/**
 * Strict share-payload decoding (blueprint §17 transport rules, §20 untrusted
 * input handling). Every fragment byte is treated as hostile until the full
 * validation pipeline succeeds.
 *
 * Guarantees:
 *   - Pure and deterministic: no I/O, no clock, no randomness.
 *   - Rejects: unknown versions, unknown/missing keys at any level, payloads
 *     over 8 KB, malformed numbers, scientific notation, non-decimal or
 *     unsafe integers, invalid addresses, invalid hex, oversized proof
 *     components, control characters in memos, lone surrogates.
 *   - Verifies the payload targets the expected chain and contract
 *     (fail closed: pass them in; mismatches throw WRONG_CHAIN / PAYLOAD_INVALID).
 */

import { getAddress, isAddress, toHex, zeroAddress, type Address, type Hex } from 'viem';
import { VajraError } from '../errors';
import {
  MAX_AUTHENTICATOR_DATA_BYTES,
  MAX_CLIENT_DATA_JSON_BYTES,
  MAX_MEMO_BYTES,
  MAX_PAYLOAD_BYTES,
  ZERO_BYTES32,
  memoHashOf,
  normalizeMemo,
} from './domain';
import { base64UrlToBytes, PAYLOAD_VERSION, type ShareEnvelope, type ShareProof } from './encode';
import { AUTH_MODE, type AuthProof, type PaymentRequest } from './types';

export interface DecodedPayload {
  envelope: ShareEnvelope;
  /** Canonical request with derived memoHash (keccak256 of NFC memo bytes). */
  request: PaymentRequest;
  /** Plaintext memo, NFC-normalized. Display as plain text only (§20). */
  memo: string;
  /** Contract-ready proof: unused fields for the mode are zero/empty. */
  proof: AuthProof;
}

export interface DecodeExpectation {
  chainId: number;
  verifyingContract: Address;
}

// ---------------------------------------------------------------------------
// Primitive validators
// ---------------------------------------------------------------------------

function fail(message: string, code: 'PAYLOAD_INVALID' | 'PAYLOAD_TOO_LARGE' = 'PAYLOAD_INVALID'): never {
  throw new VajraError(code, message);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Exact key-set check: rejects missing AND unknown keys (§17: no unknown fields). */
function requireKeys(obj: Record<string, unknown>, keys: readonly string[], where: string): void {
  const actual = Object.keys(obj);
  for (const key of keys) {
    if (!actual.includes(key)) fail(`Payload ${where} is missing required key "${key}".`);
  }
  for (const key of actual) {
    if (!keys.includes(key)) fail(`Payload ${where} contains unknown key "${key}".`);
  }
}

/**
 * Decimal-string integer parsing (§17: numeric values remain decimal strings
 * until converted with checked bigint parsing). Rejects scientific notation,
 * signs, decimals, leading zeros ("01"), whitespace and empty strings.
 */
const DECIMAL_RE = /^(0|[1-9][0-9]*)$/;

function parseDecimalString(value: unknown, where: string): bigint {
  if (typeof value !== 'string') fail(`Payload ${where} must be a decimal string.`);
  if (!DECIMAL_RE.test(value)) {
    fail(`Payload ${where} is not a plain decimal integer string: ${JSON.stringify(value)}.`);
  }
  // 78 digits covers uint256 max (78 digits); longer strings are rejected
  // before BigInt parsing.
  if (value.length > 78) fail(`Payload ${where} exceeds uint256 digit capacity.`);
  return BigInt(value);
}

function parseUint64String(value: unknown, where: string): bigint {
  const parsed = parseDecimalString(value, where);
  if (parsed > (1n << 64n) - 1n) fail(`Payload ${where} exceeds uint64.`);
  return parsed;
}

function parseUint32String(value: unknown, where: string): number {
  const parsed = parseDecimalString(value, where);
  if (parsed > 0xffffffffn) fail(`Payload ${where} exceeds uint32.`);
  return Number(parsed);
}

function parseAddress(value: unknown, where: string): Address {
  if (typeof value !== 'string' || !isAddress(value, { strict: false })) {
    fail(`Payload ${where} is not a valid address.`);
  }
  return getAddress(value);
}

function parseBytes32(value: unknown, where: string): Hex {
  if (typeof value !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(value)) {
    fail(`Payload ${where} must be 32 bytes hex.`);
  }
  return value.toLowerCase() as Hex;
}

function parseHexBytes(value: unknown, where: string, maxBytes: number): Hex {
  if (typeof value !== 'string' || !/^0x([0-9a-fA-F]{2})*$/.test(value)) {
    fail(`Payload ${where} must be even-length hex with 0x prefix.`);
  }
  if ((value.length - 2) / 2 > maxBytes) fail(`Payload ${where} exceeds ${maxBytes} bytes.`);
  return value.toLowerCase() as Hex;
}

/** Non-negative safe integer for small numeric fields (indices). */
function parseIndex(value: unknown, where: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    fail(`Payload ${where} must be a non-negative safe integer.`);
  }
  return value;
}

const BASE64URL_RE = /^[A-Za-z0-9\-_]*$/;

function parseBase64UrlBytes(value: unknown, where: string, maxBytes: number): Uint8Array {
  if (typeof value !== 'string' || !BASE64URL_RE.test(value)) {
    fail(`Payload ${where} must be base64url (no padding).`);
  }
  if (value.length % 4 === 1) fail(`Payload ${where} has invalid base64url length.`);
  let bytes: Uint8Array;
  try {
    bytes = base64UrlToBytes(value);
  } catch {
    fail(`Payload ${where} is not decodable base64url.`);
  }
  if (bytes.length > maxBytes) fail(`Payload ${where} exceeds ${maxBytes} bytes.`);
  return bytes;
}

/**
 * Memo validation (FR-005 + §20): NFC-normalized, at most 96 UTF-8 bytes, no
 * control characters (C0, DEL, C1) and no bidirectional-override/isolate
 * formatting characters that could corrupt safe visual comparison. Memos are
 * rendered as plain text only. Lone surrogates (possible via \ud800-style
 * JSON escapes) are rejected.
 */
// eslint-disable-next-line no-control-regex
const UNSAFE_MEMO_CHARS = /[\u0000-\u001F\u007F-\u009F\u202A-\u202E\u2066-\u2069]/;

function parseMemo(value: unknown): string {
  if (typeof value !== 'string') fail('Payload request.memo must be a string.');
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(i + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) fail('Payload request.memo contains a lone surrogate.');
      i++;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      fail('Payload request.memo contains a lone surrogate.');
    }
  }
  if (UNSAFE_MEMO_CHARS.test(value)) {
    fail('Payload request.memo contains control or bidirectional-override characters.');
  }
  const normalized = normalizeMemo(value);
  if (new TextEncoder().encode(normalized).length > MAX_MEMO_BYTES) {
    fail(`Payload request.memo exceeds ${MAX_MEMO_BYTES} UTF-8 bytes after NFC normalization.`);
  }
  return normalized;
}

// ---------------------------------------------------------------------------
// Proof decoding
// ---------------------------------------------------------------------------

const UINT256_MAX = (1n << 256n) - 1n;

interface ParsedWebAuthnProof {
  kind: 'webauthn';
  authenticatorData: string;
  clientDataJSON: string;
  challengeIndex: number;
  typeIndex: number;
  r: Hex;
  s: Hex;
  authDataHex: Hex;
  clientDataHex: Hex;
}

interface ParsedWalletProof {
  kind: 'wallet';
  signature: Hex;
}

type ParsedProof = ParsedWebAuthnProof | ParsedWalletProof;

function parseProof(value: unknown): ParsedProof {
  if (!isPlainObject(value)) fail('Payload proof must be an object.');
  const kind = value.kind;
  if (kind === 'wallet') {
    requireKeys(value, ['kind', 'signature'], 'proof');
    const signature = parseHexBytes(value.signature, 'proof.signature', 512);
    if (signature === '0x') fail('Payload proof.signature must be non-empty for wallet auth.');
    return { kind: 'wallet', signature };
  }
  if (kind === 'webauthn') {
    requireKeys(
      value,
      ['kind', 'authenticatorData', 'clientDataJSON', 'challengeIndex', 'typeIndex', 'r', 's'],
      'proof',
    );
    const authenticatorData = parseBase64UrlBytes(
      value.authenticatorData,
      'proof.authenticatorData',
      MAX_AUTHENTICATOR_DATA_BYTES,
    );
    const clientDataJSON = parseBase64UrlBytes(
      value.clientDataJSON,
      'proof.clientDataJSON',
      MAX_CLIENT_DATA_JSON_BYTES,
    );
    if (authenticatorData.length < 37) {
      fail('Payload proof.authenticatorData is shorter than the 37-byte WebAuthn minimum.');
    }
    if (clientDataJSON.length === 0) fail('Payload proof.clientDataJSON must be non-empty.');
    const challengeIndex = parseIndex(value.challengeIndex, 'proof.challengeIndex');
    const typeIndex = parseIndex(value.typeIndex, 'proof.typeIndex');
    const r = parseBytes32(value.r, 'proof.r');
    const s = parseBytes32(value.s, 'proof.s');
    return {
      kind: 'webauthn',
      authenticatorData: value.authenticatorData as string,
      clientDataJSON: value.clientDataJSON as string,
      challengeIndex,
      typeIndex,
      r,
      s,
      authDataHex: toHex(authenticatorData),
      clientDataHex: toHex(clientDataJSON),
    };
  }
  fail(`Payload proof.kind must be "webauthn" or "wallet"; got ${JSON.stringify(kind)}.`);
}

// ---------------------------------------------------------------------------
// Top-level decoder
// ---------------------------------------------------------------------------

const ENVELOPE_KEYS = ['v', 'chainId', 'verifyingContract', 'request', 'proof'] as const;
const REQUEST_KEYS = [
  'recipient',
  'payer',
  'amount',
  'issuedAt',
  'expiresAt',
  'nonce',
  'memo',
  'authMode',
  'authVersion',
] as const;

/**
 * Strictly decodes a base64url share payload (with or without leading '#',
 * and tolerating a full URL whose fragment is the payload). `expected` binds
 * the payload to the configured chain and contract — fail closed on mismatch.
 */
export function decodePayload(fragment: string, expected: DecodeExpectation): DecodedPayload {
  if (typeof fragment !== 'string') fail('Payload must be a string.');
  const withoutHash = fragment.startsWith('#') ? fragment.slice(1) : fragment;
  // Also accept a full URL form defensively: strip everything up to '#'.
  const hashIndex = withoutHash.indexOf('#');
  const body = hashIndex === -1 ? withoutHash : withoutHash.slice(hashIndex + 1);

  if (body.length === 0) fail('Payload is empty.');
  if (body.length > MAX_PAYLOAD_BYTES) {
    fail(
      `Payload is ${body.length} bytes, exceeding the ${MAX_PAYLOAD_BYTES}-byte transport limit.`,
      'PAYLOAD_TOO_LARGE',
    );
  }
  if (!BASE64URL_RE.test(body)) fail('Payload contains characters outside base64url.');
  if (body.length % 4 === 1) fail('Payload has invalid base64url length.');

  let jsonBytes: Uint8Array;
  try {
    jsonBytes = base64UrlToBytes(body);
  } catch {
    fail('Payload is not decodable base64url.');
  }
  let jsonText: string;
  try {
    jsonText = new TextDecoder('utf-8', { fatal: true }).decode(jsonBytes);
  } catch {
    fail('Payload is not valid UTF-8.');
  }
  let raw: unknown;
  try {
    raw = JSON.parse(jsonText);
  } catch {
    fail('Payload is not valid JSON.');
  }
  if (!isPlainObject(raw)) fail('Payload envelope must be a JSON object.');
  requireKeys(raw, ENVELOPE_KEYS, 'envelope');

  if (raw.v !== PAYLOAD_VERSION) {
    fail(`Unsupported payload version ${JSON.stringify(raw.v)}; this build understands v${PAYLOAD_VERSION} only.`);
  }

  const chainId = parseDecimalString(raw.chainId, 'chainId');
  if (chainId !== BigInt(expected.chainId)) {
    throw new VajraError(
      'WRONG_CHAIN',
      `Payload targets chain ${chainId}, but this deployment serves chain ${expected.chainId} (Monad Mainnet).`,
    );
  }

  const verifyingContract = parseAddress(raw.verifyingContract, 'verifyingContract');
  if (verifyingContract.toLowerCase() !== expected.verifyingContract.toLowerCase()) {
    fail(
      `Payload targets contract ${verifyingContract}, not the canonical Vajra contract ${expected.verifyingContract}.`,
    );
  }

  if (!isPlainObject(raw.request)) fail('Payload request must be an object.');
  requireKeys(raw.request, REQUEST_KEYS, 'request');

  const recipient = parseAddress(raw.request.recipient, 'request.recipient');
  if (recipient.toLowerCase() === zeroAddress) fail('Payload request.recipient must be non-zero.');
  const payer = parseAddress(raw.request.payer, 'request.payer');
  const amount = parseDecimalString(raw.request.amount, 'request.amount');
  if (amount === 0n) fail('Payload request.amount must be positive.');
  if (amount > UINT256_MAX) fail('Payload request.amount exceeds uint256.');
  const issuedAt = parseUint64String(raw.request.issuedAt, 'request.issuedAt');
  const expiresAt = parseUint64String(raw.request.expiresAt, 'request.expiresAt');
  if (expiresAt <= issuedAt) fail('Payload request.expiresAt must be after request.issuedAt.');
  const nonce = parseBytes32(raw.request.nonce, 'request.nonce');
  if (nonce.toLowerCase() === ZERO_BYTES32) fail('Payload request.nonce must be non-zero.');
  const memo = parseMemo(raw.request.memo);

  const authModeRaw = raw.request.authMode;
  if (authModeRaw !== 'wallet' && authModeRaw !== 'passkey') {
    fail(`Payload request.authMode must be "wallet" or "passkey"; got ${JSON.stringify(authModeRaw)}.`);
  }
  const authMode = authModeRaw === 'passkey' ? AUTH_MODE.Passkey : AUTH_MODE.Wallet;
  const authVersion = parseUint32String(raw.request.authVersion, 'request.authVersion');
  if (authMode === AUTH_MODE.Wallet && authVersion !== 0) {
    fail('Payload request.authVersion must be "0" for wallet-authenticated requests.');
  }
  if (authMode === AUTH_MODE.Passkey && authVersion === 0) {
    fail('Payload request.authVersion must be >= 1 for passkey-authenticated requests.');
  }

  const parsedProof = parseProof(raw.proof);
  if (parsedProof.kind === 'webauthn' && authMode !== AUTH_MODE.Passkey) {
    fail('Payload carries a webauthn proof but request.authMode is "wallet".');
  }
  if (parsedProof.kind === 'wallet' && authMode !== AUTH_MODE.Wallet) {
    fail('Payload carries a wallet proof but request.authMode is "passkey".');
  }

  // Derive memoHash locally from the NFC-normalized memo — identical to the
  // onchain memoHashOf for any memo within the byte cap.
  const request: PaymentRequest = {
    recipient,
    payer,
    amount,
    issuedAt,
    expiresAt,
    nonce: nonce as `0x${string}`,
    memoHash: memoHashOf(memo),
    authMode,
    authVersion,
  };

  const proof: AuthProof =
    parsedProof.kind === 'wallet'
      ? {
          signature: parsedProof.signature,
          authenticatorData: '0x',
          clientDataJSON: '0x',
          challengeIndex: 0n,
          typeIndex: 0n,
          r: ZERO_BYTES32,
          s: ZERO_BYTES32,
        }
      : {
          signature: '0x',
          authenticatorData: parsedProof.authDataHex,
          clientDataJSON: parsedProof.clientDataHex,
          challengeIndex: BigInt(parsedProof.challengeIndex),
          typeIndex: BigInt(parsedProof.typeIndex),
          r: parsedProof.r,
          s: parsedProof.s,
        };

  const envelope: ShareEnvelope = {
    v: PAYLOAD_VERSION,
    chainId: chainId.toString(10),
    verifyingContract,
    request: {
      recipient,
      payer,
      amount: amount.toString(10),
      issuedAt: issuedAt.toString(10),
      expiresAt: expiresAt.toString(10),
      nonce: nonce as `0x${string}`,
      memo,
      authMode: authModeRaw,
      authVersion: authVersion.toString(10),
    },
    proof:
      parsedProof.kind === 'wallet'
        ? { kind: 'wallet', signature: parsedProof.signature }
        : {
            kind: 'webauthn',
            authenticatorData: parsedProof.authenticatorData,
            clientDataJSON: parsedProof.clientDataJSON,
            challengeIndex: parsedProof.challengeIndex,
            typeIndex: parsedProof.typeIndex,
            r: parsedProof.r,
            s: parsedProof.s,
          },
  };

  return { envelope, request, memo, proof };
}
