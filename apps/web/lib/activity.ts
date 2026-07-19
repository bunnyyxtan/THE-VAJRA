/**
 * Local activity persistence (blueprint §18: "Transaction hash recovery must
 * survive refresh where feasible without inventing success").
 *
 * What is stored (localStorage, this device only):
 *   - Requests created on this device (terms + payload fragment + requestId).
 *   - Transaction hashes submitted from this device (fulfill / revoke /
 *     passkey operations), each tied to a requestId where applicable.
 *
 * What is NEVER stored: success. A stored transaction hash means "submitted",
 * nothing more. Settlement state is always re-derived from the chain
 * (receipt + event + statusOf/settlementOf) via lib/finality.ts.
 *
 * Storage is best-effort: private-mode/quota failures degrade to memory-only
 * for the session and never throw into user flows.
 */

import type { Address, Hex } from 'viem';
import type { PaymentRequest } from './vajra/types';

const STORAGE_KEY = 'vajra.activity.v1';

export type ActivityTxKind = 'fulfill' | 'revoke' | 'registerPasskey' | 'rotatePasskey' | 'deactivatePasskey';

export interface StoredRequest {
  requestId: Hex;
  /** Unix ms when created locally. */
  createdAt: number;
  chainId: number;
  verifyingContract: Address;
  /** Canonical request fields (bigint-safe: integers as decimal strings). */
  request: {
    recipient: Address;
    payer: Address;
    amount: string;
    issuedAt: string;
    expiresAt: string;
    nonce: Hex;
    memoHash: Hex;
    authMode: 0 | 1;
    authVersion: number;
  };
  /** Plaintext memo (local convenience; only its hash is onchain). */
  memo: string;
  /** Full base64url share payload, for re-sharing after refresh. */
  payloadFragment: string;
}

export interface StoredTransaction {
  txHash: Hex;
  kind: ActivityTxKind;
  /** requestId for fulfill/revoke; null for passkey registry ops. */
  requestId: Hex | null;
  /** Unix ms when the wallet returned the hash. */
  submittedAt: number;
  chainId: number;
}

interface ActivityStore {
  v: 1;
  requests: StoredRequest[];
  transactions: StoredTransaction[];
}

const EMPTY_STORE: ActivityStore = { v: 1, requests: [], transactions: [] };

// ---------------------------------------------------------------------------
// Storage plumbing (SSR-safe, failure-tolerant)
// ---------------------------------------------------------------------------

function storageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

let memoryFallback: ActivityStore | null = null;

function readStore(): ActivityStore {
  if (!storageAvailable()) return memoryFallback ?? { ...EMPTY_STORE, requests: [], transactions: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return { ...EMPTY_STORE, requests: [], transactions: [] };
    return sanitizeStore(JSON.parse(raw));
  } catch {
    // Corrupt or unreadable data must never crash user flows. We do not
    // silently wipe it — a fresh valid write will overwrite.
    return { ...EMPTY_STORE, requests: [], transactions: [] };
  }
}

function writeStore(store: ActivityStore): void {
  const sanitized = sanitizeStore(store);
  if (!storageAvailable()) {
    memoryFallback = sanitized;
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  } catch {
    // Quota or privacy-mode failure: degrade to memory for this session.
    memoryFallback = sanitized;
  }
}

/** Structural validation — anything unrecognizable is dropped, not trusted. */
function sanitizeStore(value: unknown): ActivityStore {
  if (typeof value !== 'object' || value === null) return { ...EMPTY_STORE, requests: [], transactions: [] };
  const v = value as Partial<ActivityStore>;
  if (v.v !== 1) return { ...EMPTY_STORE, requests: [], transactions: [] };
  return {
    v: 1,
    requests: Array.isArray(v.requests) ? v.requests.filter(isStoredRequest) : [],
    transactions: Array.isArray(v.transactions) ? v.transactions.filter(isStoredTransaction) : [],
  };
}

const HEX_RE = /^0x[0-9a-fA-F]+$/;
const DECIMAL_RE = /^(0|[1-9][0-9]*)$/;

function isStoredRequest(value: unknown): value is StoredRequest {
  if (typeof value !== 'object' || value === null) return false;
  const r = value as StoredRequest;
  return (
    typeof r.requestId === 'string' &&
    HEX_RE.test(r.requestId) &&
    typeof r.createdAt === 'number' &&
    typeof r.chainId === 'number' &&
    typeof r.verifyingContract === 'string' &&
    typeof r.memo === 'string' &&
    typeof r.payloadFragment === 'string' &&
    typeof r.request === 'object' &&
    r.request !== null &&
    DECIMAL_RE.test(r.request.amount) &&
    DECIMAL_RE.test(r.request.issuedAt) &&
    DECIMAL_RE.test(r.request.expiresAt) &&
    (r.request.authMode === 0 || r.request.authMode === 1)
  );
}

function isStoredTransaction(value: unknown): value is StoredTransaction {
  if (typeof value !== 'object' || value === null) return false;
  const t = value as StoredTransaction;
  return (
    typeof t.txHash === 'string' &&
    HEX_RE.test(t.txHash) &&
    typeof t.submittedAt === 'number' &&
    typeof t.chainId === 'number' &&
    ['fulfill', 'revoke', 'registerPasskey', 'rotatePasskey', 'deactivatePasskey'].includes(t.kind) &&
    (t.requestId === null || (typeof t.requestId === 'string' && HEX_RE.test(t.requestId)))
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Serializes a canonical PaymentRequest for storage. */
function serializeRequest(request: PaymentRequest): StoredRequest['request'] {
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

/** Deserializes a stored request back to canonical form. */
export function deserializeRequest(stored: StoredRequest['request']): PaymentRequest {
  return {
    recipient: stored.recipient,
    payer: stored.payer,
    amount: BigInt(stored.amount),
    issuedAt: BigInt(stored.issuedAt),
    expiresAt: BigInt(stored.expiresAt),
    nonce: stored.nonce,
    memoHash: stored.memoHash,
    authMode: stored.authMode,
    authVersion: stored.authVersion,
  };
}

export interface RecordRequestInput {
  requestId: Hex;
  chainId: number;
  verifyingContract: Address;
  request: PaymentRequest;
  memo: string;
  payloadFragment: string;
}

/** Persists a locally created request (idempotent by requestId). */
export function recordCreatedRequest(input: RecordRequestInput): void {
  const store = readStore();
  if (!store.requests.some((r) => r.requestId.toLowerCase() === input.requestId.toLowerCase())) {
    store.requests.unshift({
      requestId: input.requestId,
      createdAt: Date.now(),
      chainId: input.chainId,
      verifyingContract: input.verifyingContract,
      request: serializeRequest(input.request),
      memo: input.memo,
      payloadFragment: input.payloadFragment,
    });
    writeStore(store);
  }
}

/** Persists a submitted transaction hash (idempotent by hash). */
export function recordSubmittedTransaction(tx: Omit<StoredTransaction, 'submittedAt'>): void {
  const store = readStore();
  if (!store.transactions.some((t) => t.txHash.toLowerCase() === tx.txHash.toLowerCase())) {
    store.transactions.unshift({ ...tx, submittedAt: Date.now() });
    writeStore(store);
  }
}

/** All locally known requests, newest first. */
export function listStoredRequests(): StoredRequest[] {
  return readStore().requests;
}

/** All locally submitted transaction hashes, newest first. */
export function listStoredTransactions(): StoredTransaction[] {
  return readStore().transactions;
}

/** Transactions tied to a specific requestId, newest first. */
export function transactionsForRequest(requestId: Hex): StoredTransaction[] {
  const id = requestId.toLowerCase();
  return readStore().transactions.filter((t) => t.requestId?.toLowerCase() === id);
}

/** A stored request by requestId, if this device created it. */
export function findStoredRequest(requestId: Hex): StoredRequest | null {
  const id = requestId.toLowerCase();
  return readStore().requests.find((r) => r.requestId.toLowerCase() === id) ?? null;
}

/** Removes a stored request (e.g. user clears local history). Never touches chain state. */
export function removeStoredRequest(requestId: Hex): void {
  const store = readStore();
  const id = requestId.toLowerCase();
  store.requests = store.requests.filter((r) => r.requestId.toLowerCase() !== id);
  writeStore(store);
}
