/**
 * VAJRA domain logic: protocol constants, canonical field order, memo handling
 * and local request validation that mirrors the contract's static checks.
 *
 * Everything here is pure and deterministic — no I/O, no clock access except
 * where a caller passes `now` explicitly.
 */

import { isAddress, keccak256, stringToBytes, zeroAddress, type Address } from 'viem';
import { VajraError } from '../errors';
import { AUTH_MODE, type AuthMode, type Bytes32, type PaymentRequest } from './types';

// ---------------------------------------------------------------------------
// Protocol constants (contract constants in VajraNativeV1.sol)
// ---------------------------------------------------------------------------

/** Blueprint FR-004: request lifetime at least 60 seconds. */
export const MIN_LIFETIME_SECONDS = 60n;
/** Blueprint FR-004: request lifetime at most 30 days. */
export const MAX_LIFETIME_SECONDS = 30n * 24n * 60n * 60n; // 2,592,000
/** Maximum tolerated clock skew for issuedAt lying in the future. */
export const MAX_FUTURE_SKEW_SECONDS = 5n * 60n; // 300
/** Blueprint FR-005: memo limited to 96 UTF-8 bytes after NFC normalization. */
export const MAX_MEMO_BYTES = 96;
/** Contract bound for decoded authenticatorData (§17 transport of proofs). */
export const MAX_AUTHENTICATOR_DATA_BYTES = 1024;
/** Contract bound for decoded clientDataJSON. */
export const MAX_CLIENT_DATA_JSON_BYTES = 1024;
/** §17: maximum encoded share payload. */
export const MAX_PAYLOAD_BYTES = 8 * 1024;

export const ZERO_BYTES32: Bytes32 = '0x0000000000000000000000000000000000000000000000000000000000000000';
export const ANY_PAYER: Address = zeroAddress;

/**
 * The single canonical PaymentRequest field order, shared with Solidity
 * (blueprint §18). Encoding, hashing, validation and the ABI all follow this.
 */
export const PAYMENT_REQUEST_FIELDS = [
  'recipient',
  'payer',
  'amount',
  'issuedAt',
  'expiresAt',
  'nonce',
  'memoHash',
  'authMode',
  'authVersion',
] as const;

// ---------------------------------------------------------------------------
// Memo handling (FR-005: NFC normalize offchain, max 96 UTF-8 bytes)
// ---------------------------------------------------------------------------

/**
 * NFC-normalizes a memo and enforces the 96-byte UTF-8 cap.
 * Normalization happens offchain by protocol design; the contract hashes the
 * exact bytes it is given, so both sides must agree on NFC form.
 */
export function normalizeMemo(memo: string): string {
  return memo.normalize('NFC');
}

export function memoUtf8Bytes(memo: string): Uint8Array {
  return stringToBytes(normalizeMemo(memo));
}

/**
 * keccak256 of the NFC-normalized memo bytes — identical to the contract's
 * memoHashOf(bytes) for memos within the byte cap. Throws MEMO_TOO_LONG
 * instead of returning a hash the contract would reject.
 */
export function memoHashOf(memo: string): Bytes32 {
  const bytes = memoUtf8Bytes(memo);
  if (bytes.length > MAX_MEMO_BYTES) {
    throw new VajraError(
      'MEMO_TOO_LONG',
      `Memo is ${bytes.length} UTF-8 bytes after NFC normalization; the protocol limit is ${MAX_MEMO_BYTES}.`,
    );
  }
  return keccak256(bytes);
}

// ---------------------------------------------------------------------------
// Local request validation (static checks mirroring _validate order)
// ---------------------------------------------------------------------------

export interface RequestDraft {
  recipient: Address;
  payer: Address;
  amount: bigint;
  issuedAt: bigint;
  expiresAt: bigint;
  nonce: Bytes32;
  memo: string;
  authMode: AuthMode;
  authVersion: number;
}

const UINT64_MAX = (1n << 64n) - 1n;
const UINT32_MAX = 0xffffffff;

/**
 * Validates a draft request locally, in the same order as the contract's
 * static checks (steps 1 of _validate), plus local-only type bounds.
 * Returns the canonical PaymentRequest with derived memoHash.
 * Throws VajraError PAYLOAD_INVALID with a specific reason on failure.
 */
export function buildPaymentRequest(draft: RequestDraft): PaymentRequest {
  if (!isAddress(draft.recipient, { strict: false })) {
    throw new VajraError('PAYLOAD_INVALID', `Recipient is not a valid address: "${draft.recipient}".`);
  }
  if (draft.recipient.toLowerCase() === zeroAddress) {
    throw new VajraError('PAYLOAD_INVALID', 'Recipient must be a non-zero address (contract: ZeroRecipient).');
  }
  if (!isAddress(draft.payer, { strict: false })) {
    throw new VajraError('PAYLOAD_INVALID', `Payer is not a valid address: "${draft.payer}".`);
  }
  if (typeof draft.amount !== 'bigint' || draft.amount <= 0n) {
    throw new VajraError('PAYLOAD_INVALID', 'Amount must be a positive wei value (contract: ZeroAmount).');
  }
  if (draft.amount > (1n << 256n) - 1n) {
    throw new VajraError('PAYLOAD_INVALID', 'Amount exceeds uint256.');
  }
  if (!isUint64(draft.issuedAt) || !isUint64(draft.expiresAt)) {
    throw new VajraError('PAYLOAD_INVALID', 'issuedAt and expiresAt must fit uint64 (unix seconds).');
  }
  if (!/^0x[0-9a-fA-F]{64}$/.test(draft.nonce)) {
    throw new VajraError('PAYLOAD_INVALID', 'Nonce must be 32 bytes hex.');
  }
  if (draft.nonce.toLowerCase() === ZERO_BYTES32) {
    throw new VajraError('PAYLOAD_INVALID', 'Nonce must be non-zero (contract: InvalidNonce).');
  }
  if (!Number.isInteger(draft.authVersion) || draft.authVersion < 0 || draft.authVersion > UINT32_MAX) {
    throw new VajraError('PAYLOAD_INVALID', 'authVersion must be a uint32.');
  }
  if (draft.authMode === AUTH_MODE.Wallet && draft.authVersion !== 0) {
    throw new VajraError('PAYLOAD_INVALID', 'authVersion must be 0 for wallet-authenticated requests.');
  }
  if (draft.authMode === AUTH_MODE.Passkey && draft.authVersion < 1) {
    throw new VajraError('PAYLOAD_INVALID', 'Passkey requests must carry the active key version (>= 1).');
  }

  const memoHash = memoHashOf(draft.memo);

  const request: PaymentRequest = {
    recipient: draft.recipient,
    payer: draft.payer,
    amount: draft.amount,
    issuedAt: draft.issuedAt,
    expiresAt: draft.expiresAt,
    nonce: draft.nonce,
    memoHash,
    authMode: draft.authMode,
    authVersion: draft.authVersion,
  };
  assertValidTimeWindow(request);
  return request;
}

/**
 * Time-window check mirroring the contract: expiresAt strictly after issuedAt,
 * lifetime within [60s, 30d], issuedAt not more than 5 minutes in the future.
 * `now` is injected so the function stays pure.
 */
export function assertValidTimeWindow(request: PaymentRequest, now?: bigint): void {
  const { issuedAt, expiresAt } = request;
  if (expiresAt <= issuedAt) {
    throw new VajraError('PAYLOAD_INVALID', 'expiresAt must be strictly after issuedAt (contract: InvalidTimeWindow).');
  }
  const lifetime = expiresAt - issuedAt;
  if (lifetime < MIN_LIFETIME_SECONDS) {
    throw new VajraError(
      'PAYLOAD_INVALID',
      `Request lifetime ${lifetime}s is below the ${MIN_LIFETIME_SECONDS}s minimum (contract: InvalidTimeWindow).`,
    );
  }
  if (lifetime > MAX_LIFETIME_SECONDS) {
    throw new VajraError(
      'PAYLOAD_INVALID',
      `Request lifetime ${lifetime}s exceeds the ${MAX_LIFETIME_SECONDS}s (30 day) maximum (contract: InvalidTimeWindow).`,
    );
  }
  if (now !== undefined && issuedAt > now + MAX_FUTURE_SKEW_SECONDS) {
    throw new VajraError(
      'PAYLOAD_INVALID',
      'issuedAt lies too far in the future (contract: InvalidTimeWindow; derive it from a recent chain timestamp).',
    );
  }
}

export function isExpired(request: PaymentRequest, now: bigint): boolean {
  return now > request.expiresAt;
}

export function isUint64(value: bigint): boolean {
  return value >= 0n && value <= UINT64_MAX;
}
