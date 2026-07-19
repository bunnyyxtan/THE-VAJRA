export type RequestStatus = "active" | "paid" | "expired" | "revoked";

/**
 * Serialized canonical onchain terms of a request (the exact fields of the
 * contract's PaymentRequest struct; bigints as decimal strings so the record
 * survives JSON storage). Present on every real request.
 */
export interface RequestTerms {
  recipient: string;
  /** Zero address = open to any payer. */
  payer: string;
  /** Exact wei, decimal string. */
  amount: string;
  /** Unix seconds, decimal string. */
  issuedAt: string;
  /** Unix seconds, decimal string. */
  expiresAt: string;
  nonce: string;
  memoHash: string;
  /** 0 = wallet signature, 1 = passkey. */
  authMode: 0 | 1;
  authVersion: number;
}

export interface PaymentRequest {
  /** Canonical requestId (0x + 64 hex) — the EIP-712 digest of the terms. */
  id: string;
  amountMon: string;
  recipient: string;
  recipientLabel?: string;
  memo?: string;
  network: string;
  contract: string;
  createdAt: string;
  expiresAt: string | null;
  restrictedPayer?: string | null;
  status: RequestStatus;
  authMethod: "passkey" | "wallet-signature";
  /** Real EIP-712 signature for wallet mode; "0x" for passkey mode. */
  signature: string;
  /** true when the local user created this request */
  mine?: boolean;
  txHash?: string;
  paidBy?: string;
  paidAt?: string;
  finalizedAt?: string;
  blockNumber?: number;
  /** Human-comparison code derived from the requestId ("AD0A-4E98"). */
  vajraCode?: string;
  /** Full base64url share payload, for re-sharing and re-verification. */
  payload?: string;
  /** Canonical signed terms. */
  terms?: RequestTerms;
}

export interface Wallet {
  address: string;
  label: string;
  /** Human network label; "Monad Mainnet" only when chainId === 143. */
  network: string;
  chainId?: number;
}

export interface Passkey {
  name: string;
  device: string;
  createdAt: string;
  method: "passkey" | "wallet-signature";
  /** Onchain registry version (passkey method only). */
  version?: number;
}

export interface Settings {
  reduceMotion: boolean;
  reduceTransparency: boolean;
}
