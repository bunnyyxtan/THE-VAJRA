export type ScenarioKey =
  | "ok"
  | "expired"
  | "revoked"
  | "wrong-wallet"
  | "wrong-network"
  | "invalid-signature"
  | "already-paid"
  | "rpc-unavailable"
  | "slow"
  | "uncertain";

export type RequestStatus = "active" | "paid" | "expired" | "revoked";

export interface PaymentRequest {
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
  signature: string;
  scenario?: ScenarioKey;
  /** true when the local user created this request */
  mine?: boolean;
  txHash?: string;
  paidBy?: string;
  paidAt?: string;
  finalizedAt?: string;
  blockNumber?: number;
  /** base64url share payload (open-link fragment) */
  payload?: string;
}

export interface Wallet {
  address: string;
  label: string;
  network: "Monad Mainnet" | "Ethereum Mainnet";
}

export interface Passkey {
  name: string;
  device: string;
  createdAt: string;
  method: "passkey" | "wallet-signature";
}

export interface Settings {
  reduceMotion: boolean;
  reduceTransparency: boolean;
  outage: boolean;
}
