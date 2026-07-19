/**
 * App-record ↔ contract bridge.
 *
 * Converts between the app's persisted PaymentRequest display record and the
 * canonical onchain types in lib/web3. The app's `id` IS the canonical
 * requestId; `terms` carries the exact signed struct; `payload` carries the
 * base64url share fragment. Nothing here invents chain state — statuses are
 * always derived from live reads elsewhere.
 */

import { Platform } from "react-native";
import { zeroAddress, type Address, type Hex } from "viem";

import { formatUnits } from "@/src/lib/web3/amount";
import { getChainConfig } from "@/src/lib/web3/chain";
import { REQUEST_STATUS, type PaymentRequest as CanonicalRequest } from "@/src/lib/web3/vajra/types";
import type { PaymentRequest, RequestStatus, RequestTerms } from "@/src/lib/types";

// ---------------------------------------------------------------------------
// Conversions
// ---------------------------------------------------------------------------

export function canonicalFromTerms(terms: RequestTerms): CanonicalRequest {
  return {
    recipient: terms.recipient as Address,
    payer: terms.payer as Address,
    amount: BigInt(terms.amount),
    issuedAt: BigInt(terms.issuedAt),
    expiresAt: BigInt(terms.expiresAt),
    nonce: terms.nonce as Hex,
    memoHash: terms.memoHash as Hex,
    authMode: terms.authMode,
    authVersion: terms.authVersion,
  };
}

export function termsFromCanonical(request: CanonicalRequest): RequestTerms {
  return {
    recipient: request.recipient,
    payer: request.payer,
    amount: request.amount.toString(10),
    issuedAt: request.issuedAt.toString(10),
    expiresAt: request.expiresAt.toString(10),
    nonce: request.nonce,
    memoHash: request.memoHash,
    authMode: request.authMode,
    authVersion: request.authVersion,
  };
}

export function canonicalFromRecord(record: PaymentRequest): CanonicalRequest | null {
  return record.terms ? canonicalFromTerms(record.terms) : null;
}

export interface BuildRecordInput {
  requestId: Hex;
  request: CanonicalRequest;
  memo: string;
  signature: Hex;
  payload: string;
  vajraCode: string;
  mine: boolean;
}

/** Builds the app record for a verified request (created or received). */
export function buildRecord(input: BuildRecordInput): PaymentRequest {
  const { request } = input;
  const open = request.payer.toLowerCase() === zeroAddress;
  return {
    id: input.requestId,
    amountMon: formatUnits(request.amount, 18),
    recipient: request.recipient,
    memo: input.memo || undefined,
    network: "Monad Mainnet",
    contract: getChainConfig().contractAddress,
    createdAt: new Date(Number(request.issuedAt) * 1000).toISOString(),
    expiresAt: new Date(Number(request.expiresAt) * 1000).toISOString(),
    restrictedPayer: open ? null : request.payer,
    status: "active",
    authMethod: request.authMode === 1 ? "passkey" : "wallet-signature",
    signature: input.signature,
    mine: input.mine,
    vajraCode: input.vajraCode,
    payload: input.payload,
    terms: termsFromCanonical(request),
  };
}

// ---------------------------------------------------------------------------
// Status derivation (live chain reads only)
// ---------------------------------------------------------------------------

/**
 * Maps an onchain status + expiry to the app's display status.
 * Expiry is a local-clock convenience for labeling; payment decisions always
 * use the contract's own checks.
 */
export function statusFromChain(
  status: number,
  expiresAt: bigint,
  nowSeconds: bigint = BigInt(Math.floor(Date.now() / 1000)),
): RequestStatus {
  if (status === REQUEST_STATUS.Paid) return "paid";
  if (status === REQUEST_STATUS.Revoked) return "revoked";
  return nowSeconds > expiresAt ? "expired" : "active";
}

// ---------------------------------------------------------------------------
// Share links
// ---------------------------------------------------------------------------

/**
 * The real share link: <web-origin>/open-link#<base64url payload>.
 * On native builds the origin is unknown until the web deployment exists, so
 * the canonical config's deployment origin is used as the base.
 */
export function shareLinkFor(payload: string): string {
  const origin =
    Platform.OS === "web" && typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "https://vajra.xyz";
  return `${origin}/open-link#${payload}`;
}
