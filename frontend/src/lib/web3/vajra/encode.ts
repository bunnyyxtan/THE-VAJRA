/**
 * Versioned share-payload encoding (blueprint §17).
 *
 * The payload is a JSON envelope serialized with a FIXED key order and encoded
 * as base64url (no padding) for transport in a URL fragment:
 *   https://vajra.xyz/pay#<base64url-payload>
 *
 * Determinism rules (the encoder is pure and deterministic):
 *   - Keys are emitted in exactly the order objects are constructed below.
 *     JavaScript preserves insertion order for string keys, and JSON.stringify
 *     follows it, so the byte output is stable for a given envelope.
 *   - All integers are decimal strings (no scientific notation, no floats).
 *   - The memo is NFC-normalized before encoding.
 *
 * The decoder (decode.ts) is the strict counterpart; it rejects anything this
 * encoder would not produce, plus anything hostile.
 */

import { toHex, type Address, type Hex } from 'viem';
import { VajraError } from '../errors';
import { MAX_PAYLOAD_BYTES, normalizeMemo } from './domain';
import { AUTH_MODE, type AuthProof, type Bytes32, type PaymentRequest } from './types';

export const PAYLOAD_VERSION = 1 as const;

/** Proof as transported in the envelope (§17). */
export type ShareProof =
  | {
      kind: 'webauthn';
      authenticatorData: string; // base64url
      clientDataJSON: string; // base64url
      challengeIndex: number;
      typeIndex: number;
      r: Bytes32;
      s: Bytes32;
    }
  | {
      kind: 'wallet';
      signature: Hex;
    };

export interface ShareRequestFields {
  recipient: Address;
  payer: Address;
  /** Exact wei, decimal string. */
  amount: string;
  /** Unix seconds, decimal string. */
  issuedAt: string;
  /** Unix seconds, decimal string. */
  expiresAt: string;
  nonce: Bytes32;
  /** Plaintext memo (only its hash reaches the chain). */
  memo: string;
  authMode: 'wallet' | 'passkey';
  /** Decimal string. "0" for wallet mode; active key version for passkey. */
  authVersion: string;
}

export interface ShareEnvelope {
  v: typeof PAYLOAD_VERSION;
  /** Decimal string, e.g. "143". */
  chainId: string;
  verifyingContract: Address;
  request: ShareRequestFields;
  proof: ShareProof;
}

export interface EncodeInput {
  chainId: number;
  verifyingContract: Address;
  request: PaymentRequest;
  /** Plaintext memo; NFC-normalized here. */
  memo: string;
  proof: ShareProof;
}

// ---------------------------------------------------------------------------
// base64url helpers (no padding, RFC 4648 §5)
// ---------------------------------------------------------------------------

export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function utf8ToBase64Url(text: string): string {
  return bytesToBase64Url(new TextEncoder().encode(text));
}

// ---------------------------------------------------------------------------
// Encoder
// ---------------------------------------------------------------------------

/**
 * Builds the canonical envelope object. Key order here IS the wire order —
 * do not reorder without a version bump.
 */
export function buildEnvelope(input: EncodeInput): ShareEnvelope {
  const { request } = input;
  return {
    v: PAYLOAD_VERSION,
    chainId: String(input.chainId),
    verifyingContract: input.verifyingContract,
    request: {
      recipient: request.recipient,
      payer: request.payer,
      amount: request.amount.toString(10),
      issuedAt: request.issuedAt.toString(10),
      expiresAt: request.expiresAt.toString(10),
      nonce: request.nonce,
      memo: normalizeMemo(input.memo),
      authMode: request.authMode === AUTH_MODE.Passkey ? 'passkey' : 'wallet',
      authVersion: String(request.authVersion),
    },
    proof: input.proof,
  };
}

/**
 * Encodes a share payload to its base64url transport form (no '#' prefix).
 * Throws PAYLOAD_TOO_LARGE if the encoded form exceeds the 8 KB limit (§17).
 */
export function encodePayload(input: EncodeInput): string {
  const json = JSON.stringify(buildEnvelope(input));
  const encoded = utf8ToBase64Url(json);
  if (encoded.length > MAX_PAYLOAD_BYTES) {
    throw new VajraError(
      'PAYLOAD_TOO_LARGE',
      `Encoded payload is ${encoded.length} bytes, exceeding the ${MAX_PAYLOAD_BYTES}-byte transport limit.`,
    );
  }
  return encoded;
}

// ---------------------------------------------------------------------------
// Proof helpers (bridge between AuthProof and the transported ShareProof)
// ---------------------------------------------------------------------------

export function emptyAuthProof(): AuthProof {
  return {
    signature: '0x',
    authenticatorData: '0x',
    clientDataJSON: '0x',
    challengeIndex: 0n,
    typeIndex: 0n,
    r: '0x0000000000000000000000000000000000000000000000000000000000000000',
    s: '0x0000000000000000000000000000000000000000000000000000000000000000',
  };
}

/** Wallet mode: only the EIP-712 signature is transported. */
export function walletShareProof(signature: Hex): ShareProof {
  return { kind: 'wallet', signature };
}

/**
 * Converts a transported ShareProof into the contract AuthProof shape.
 * WebAuthn byte fields are transported as base64url and become 0x-hex here;
 * fields unused by the mode are zero/empty (mirrors contract expectations).
 */
export function shareProofToAuthProof(proof: ShareProof): AuthProof {
  if (proof.kind === 'wallet') {
    return { ...emptyAuthProof(), signature: proof.signature };
  }
  return {
    signature: '0x',
    authenticatorData: toHex(base64UrlToBytes(proof.authenticatorData)),
    clientDataJSON: toHex(base64UrlToBytes(proof.clientDataJSON)),
    challengeIndex: BigInt(proof.challengeIndex),
    typeIndex: BigInt(proof.typeIndex),
    r: proof.r,
    s: proof.s,
  };
}
