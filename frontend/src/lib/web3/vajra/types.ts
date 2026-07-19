/**
 * Canonical VAJRA domain types, mirroring contracts/src/VajraNativeV1.sol exactly.
 *
 * Field order in PaymentRequest and AuthProof is the single canonical order
 * shared with the Solidity struct declarations (blueprint §18). Do not reorder.
 */

export type Address = `0x${string}`;
export type Hex = `0x${string}`;
export type Bytes32 = `0x${string}`;

/** enum AuthMode { Wallet, Passkey } — uint8 onchain. */
export const AUTH_MODE = { Wallet: 0, Passkey: 1 } as const;
export type AuthMode = (typeof AUTH_MODE)[keyof typeof AUTH_MODE];
export type AuthModeName = 'wallet' | 'passkey';

/** enum RequestStatus { Unused, Paid, Revoked } — uint8 onchain. */
export const REQUEST_STATUS = { Unused: 0, Paid: 1, Revoked: 2 } as const;
export type RequestStatus = (typeof REQUEST_STATUS)[keyof typeof REQUEST_STATUS];
export type RequestStatusName = 'Unused' | 'Paid' | 'Revoked';

/**
 * enum ValidationCode — returned by inspect() (blueprint Appendix B).
 * Numeric values MUST match the Solidity declaration order.
 */
export const VALIDATION_CODE = {
  Valid: 0,
  ZeroRecipient: 1,
  ZeroAmount: 2,
  InvalidNonce: 3,
  InvalidTimeWindow: 4,
  Expired: 5,
  AlreadyPaid: 6,
  Revoked: 7,
  WrongPayer: 8,
  InactivePasskey: 9,
  WrongPasskeyVersion: 10,
  InvalidWalletSignature: 11,
  InvalidPasskeyProof: 12,
  IncorrectValue: 13,
} as const;
export type ValidationCode = (typeof VALIDATION_CODE)[keyof typeof VALIDATION_CODE];
export type ValidationCodeName = keyof typeof VALIDATION_CODE;

export const VALIDATION_CODE_NAMES: readonly ValidationCodeName[] = [
  'Valid',
  'ZeroRecipient',
  'ZeroAmount',
  'InvalidNonce',
  'InvalidTimeWindow',
  'Expired',
  'AlreadyPaid',
  'Revoked',
  'WrongPayer',
  'InactivePasskey',
  'WrongPasskeyVersion',
  'InvalidWalletSignature',
  'InvalidPasskeyProof',
  'IncorrectValue',
];

export function validationCodeName(code: number): ValidationCodeName | 'Unknown' {
  return VALIDATION_CODE_NAMES[code] ?? 'Unknown';
}

/**
 * struct PaymentRequest — canonical field order (Solidity declaration order):
 * recipient, payer, amount, issuedAt, expiresAt, nonce, memoHash, authMode, authVersion.
 *
 * - payer: zero address means the request is open to any payer.
 * - amount: exact wei.
 * - issuedAt / expiresAt: unix seconds (uint64).
 * - authVersion: 0 for wallet mode; the active passkey version for passkey mode.
 */
export interface PaymentRequest {
  recipient: Address;
  payer: Address;
  amount: bigint;
  issuedAt: bigint;
  expiresAt: bigint;
  nonce: Bytes32;
  memoHash: Bytes32;
  authMode: AuthMode;
  authVersion: number;
}

/**
 * struct AuthProof — authentication evidence presented at fulfillment time.
 * Wallet mode: only `signature` is used. Passkey mode: the WebAuthn assertion
 * fields are used. Unused fields for a mode are zero/empty values.
 */
export interface AuthProof {
  signature: Hex;
  authenticatorData: Hex;
  clientDataJSON: Hex;
  challengeIndex: bigint;
  typeIndex: bigint;
  r: Bytes32;
  s: Bytes32;
}

/** struct PasskeyCredential — passkeyOf(recipient) registry row. */
export interface PasskeyCredential {
  qx: Bytes32;
  qy: Bytes32;
  credentialIdHash: Bytes32;
  rpIdHash: Bytes32;
  version: number;
  active: boolean;
}

/** struct Settlement — settlementOf(requestId) record, written exactly once. */
export interface Settlement {
  payer: Address;
  recipient: Address;
  amount: bigint;
  paidAt: bigint;
  memoHash: Bytes32;
  authMode: AuthMode;
  authVersion: number;
}

/** PaymentFulfilled event (blueprint §14). */
export interface PaymentFulfilledEvent {
  requestId: Bytes32;
  payer: Address;
  recipient: Address;
  amount: bigint;
  paidAt: bigint;
  memoHash: Bytes32;
  authMode: AuthMode;
  authVersion: number;
}
