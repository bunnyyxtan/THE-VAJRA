/**
 * Typed viem client helpers for VajraNativeV1.
 *
 * Framework-agnostic: every function takes a viem PublicClient (reads) or
 * builds transaction parameters for a wallet layer (writes). No wagmi
 * dependency here — the wallet layer owns connectors; this module owns the
 * contract surface. All reads/writes target the canonical address from
 * lib/chain.ts — the single configuration module.
 *
 * Read functions:  statusOf, settlementOf, passkeyOf, requestId, inspect
 * Write functions: fulfill, revoke, registerPasskey, rotatePasskey, deactivatePasskey
 * Events:          PaymentFulfilled decoding for receipt verification (§14).
 */

import {
  encodeFunctionData,
  parseEventLogs,
  type Address,
  type Hex,
  type Log,
  type PublicClient,
} from 'viem';
import { getChainConfig, type VajraChainConfig } from './chain';
import { VAJRA_ABI } from './contracts/abi';
import type {
  AuthMode,
  AuthProof,
  PasskeyCredential,
  PaymentFulfilledEvent,
  PaymentRequest,
  Settlement,
  ValidationCode,
} from './vajra/types';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

export function vajraAddress(config: VajraChainConfig = getChainConfig()): Address {
  return config.contractAddress;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function readRequestId(
  client: PublicClient,
  request: PaymentRequest,
  config: VajraChainConfig = getChainConfig(),
): Promise<Hex> {
  return client.readContract({
    address: vajraAddress(config),
    abi: VAJRA_ABI,
    functionName: 'requestId',
    args: [request],
  });
}

export async function readStatusOf(
  client: PublicClient,
  requestId: Hex,
  config: VajraChainConfig = getChainConfig(),
): Promise<number> {
  return client.readContract({
    address: vajraAddress(config),
    abi: VAJRA_ABI,
    functionName: 'statusOf',
    args: [requestId],
  });
}

export async function readSettlementOf(
  client: PublicClient,
  requestId: Hex,
  config: VajraChainConfig = getChainConfig(),
): Promise<Settlement> {
  const [payer, recipient, amount, paidAt, memoHash, authMode, authVersion] = await client.readContract({
    address: vajraAddress(config),
    abi: VAJRA_ABI,
    functionName: 'settlementOf',
    args: [requestId],
  });
  return { payer, recipient, amount, paidAt, memoHash, authMode: authMode as AuthMode, authVersion };
}

export async function readPasskeyOf(
  client: PublicClient,
  recipient: Address,
  config: VajraChainConfig = getChainConfig(),
): Promise<PasskeyCredential> {
  const [qx, qy, credentialIdHash, rpIdHash, version, active] = await client.readContract({
    address: vajraAddress(config),
    abi: VAJRA_ABI,
    functionName: 'passkeyOf',
    args: [recipient],
  });
  return { qx, qy, credentialIdHash, rpIdHash, version, active };
}

export interface InspectResult {
  id: Hex;
  code: ValidationCode;
}

/**
 * Dry-run validation for a prospective payer (blueprint §11 Appendix B).
 * The msg.value check is enforced by fulfill at payment time, not here.
 */
export async function inspectRequest(
  client: PublicClient,
  request: PaymentRequest,
  proof: AuthProof,
  prospectivePayer: Address,
  config: VajraChainConfig = getChainConfig(),
): Promise<InspectResult> {
  const [id, code] = await client.readContract({
    address: vajraAddress(config),
    abi: VAJRA_ABI,
    functionName: 'inspect',
    args: [request, proof, prospectivePayer],
  });
  return { id, code: code as ValidationCode };
}

// ---------------------------------------------------------------------------
// Write transaction builders (the wallet layer signs/sends these)
// ---------------------------------------------------------------------------

export interface TxParams {
  to: Address;
  data: Hex;
  value: bigint;
}

/** fulfill(request, proof) with EXACT msg.value = request.amount. */
export function buildFulfillTx(
  request: PaymentRequest,
  proof: AuthProof,
  config: VajraChainConfig = getChainConfig(),
): TxParams {
  return {
    to: vajraAddress(config),
    data: encodeFunctionData({ abi: VAJRA_ABI, functionName: 'fulfill', args: [request, proof] }),
    value: request.amount,
  };
}

/** revoke(request) — callable only by the request recipient. */
export function buildRevokeTx(request: PaymentRequest, config: VajraChainConfig = getChainConfig()): TxParams {
  return {
    to: vajraAddress(config),
    data: encodeFunctionData({ abi: VAJRA_ABI, functionName: 'revoke', args: [request] }),
    value: 0n,
  };
}

export function buildRegisterPasskeyTx(
  credential: Pick<PasskeyCredential, 'qx' | 'qy' | 'credentialIdHash' | 'rpIdHash'>,
  config: VajraChainConfig = getChainConfig(),
): TxParams {
  return {
    to: vajraAddress(config),
    data: encodeFunctionData({
      abi: VAJRA_ABI,
      functionName: 'registerPasskey',
      args: [credential.qx, credential.qy, credential.credentialIdHash, credential.rpIdHash],
    }),
    value: 0n,
  };
}

export function buildRotatePasskeyTx(
  credential: Pick<PasskeyCredential, 'qx' | 'qy' | 'credentialIdHash' | 'rpIdHash'>,
  config: VajraChainConfig = getChainConfig(),
): TxParams {
  return {
    to: vajraAddress(config),
    data: encodeFunctionData({
      abi: VAJRA_ABI,
      functionName: 'rotatePasskey',
      args: [credential.qx, credential.qy, credential.credentialIdHash, credential.rpIdHash],
    }),
    value: 0n,
  };
}

export function buildDeactivatePasskeyTx(config: VajraChainConfig = getChainConfig()): TxParams {
  return {
    to: vajraAddress(config),
    data: encodeFunctionData({ abi: VAJRA_ABI, functionName: 'deactivatePasskey' }),
    value: 0n,
  };
}

// ---------------------------------------------------------------------------
// Event decoding (receipt verification, blueprint §14)
// ---------------------------------------------------------------------------

/**
 * Decodes PaymentFulfilled events from transaction logs, keeping ONLY events
 * emitted by the canonical Vajra contract. Receipt verification additionally
 * requires requestId equality with the locally computed digest (§14 check 3) —
 * callers compare `event.requestId` against their computed value.
 */
export function decodePaymentFulfilledEvents(
  logs: readonly Log[],
  config: VajraChainConfig = getChainConfig(),
): PaymentFulfilledEvent[] {
  const canonical = vajraAddress(config).toLowerCase();
  const parsed = parseEventLogs({
    abi: VAJRA_ABI,
    eventName: 'PaymentFulfilled',
    logs: logs.filter((log) => log.address.toLowerCase() === canonical),
  });
  return parsed.map((log) => ({
    requestId: log.args.requestId,
    payer: log.args.payer,
    recipient: log.args.recipient,
    amount: log.args.amount,
    paidAt: log.args.paidAt,
    memoHash: log.args.memoHash,
    authMode: log.args.authMode as AuthMode,
    authVersion: log.args.authVersion,
  }));
}

// ---------------------------------------------------------------------------
// Event location (receipt verification without a tx hash, blueprint §14)
// ---------------------------------------------------------------------------

/**
 * The public Monad RPC caps eth_getLogs at a 100-block range, and the chain is
 * tens of millions of blocks deep — a full-history scan is impossible. The
 * contract writes settlement.paidAt = block.timestamp, so the settlement
 * block is located by binary-searching block timestamps for paidAt, then
 * scanning forward in ≤100-block chunks. Deterministic; works on any RPC
 * regardless of log-range limits. (Ported from event-locator.reference.ts.)
 */
const LOG_CHUNK = 100n;
const MAX_LOG_CHUNKS = 6n;
/** Stop scanning once we are this many seconds past the settlement second. */
const TIMESTAMP_EXIT_MARGIN = 64n;

export interface LocatedPaymentFulfilled {
  txHash: Hex;
  blockNumber: bigint;
  event: PaymentFulfilledEvent;
}

const paymentFulfilledEvent = VAJRA_ABI.find(
  (entry): entry is Extract<(typeof VAJRA_ABI)[number], { type: 'event'; name: 'PaymentFulfilled' }> =>
    entry.type === 'event' && entry.name === 'PaymentFulfilled',
);

/**
 * Locates the PaymentFulfilled event for a request whose settlement timestamp
 * (settlementOf(requestId).paidAt) is known. Returns null when no matching
 * event exists within the scan window — the caller cross-checks against the
 * settlement record and treats absence as incomplete verification, never as
 * proof of non-payment. Throws on RPC failure (callers classify).
 */
export async function locatePaymentFulfilledEvent(
  client: PublicClient,
  requestId: Hex,
  paidAt: bigint,
  config: VajraChainConfig = getChainConfig(),
): Promise<LocatedPaymentFulfilled | null> {
  if (!paymentFulfilledEvent) return null;

  // 1. Binary-search block timestamps for the first block of the settlement second.
  const latest = await client.getBlockNumber();
  let lo = 0n;
  let hi = latest;
  while (lo < hi) {
    const mid = (lo + hi) >> 1n;
    const block = await client.getBlock({ blockNumber: mid, includeTransactions: false });
    if (block.timestamp >= paidAt) hi = mid;
    else lo = mid + 1n;
  }

  // 2. Scan forward in ≤100-block chunks until the matching event appears.
  const id = requestId.toLowerCase();
  for (let chunk = 0n; chunk < MAX_LOG_CHUNKS && lo <= latest; chunk++) {
    const fromBlock = lo + chunk * LOG_CHUNK;
    const toBlock = fromBlock + (LOG_CHUNK - 1n) > latest ? latest : fromBlock + (LOG_CHUNK - 1n);
    const logs = await client.getLogs({
      address: vajraAddress(config),
      event: paymentFulfilledEvent,
      args: { requestId },
      fromBlock,
      toBlock,
    });
    const match = logs.find((l) => l.args.requestId?.toLowerCase() === id);
    if (match) {
      const a = match.args;
      if (
        a.payer !== undefined &&
        a.recipient !== undefined &&
        a.amount !== undefined &&
        a.paidAt !== undefined &&
        a.memoHash !== undefined &&
        a.authMode !== undefined &&
        a.authVersion !== undefined
      ) {
        return {
          txHash: match.transactionHash,
          blockNumber: match.blockNumber,
          event: {
            requestId: a.requestId ?? requestId,
            payer: a.payer,
            recipient: a.recipient,
            amount: a.amount,
            paidAt: a.paidAt,
            memoHash: a.memoHash,
            authMode: a.authMode as AuthMode,
            authVersion: a.authVersion,
          },
        };
      }
      return null;
    }
    // Early exit once we are well past the settlement second.
    const probe = await client.getBlock({ blockNumber: toBlock, includeTransactions: false });
    if (probe.timestamp > paidAt + TIMESTAMP_EXIT_MARGIN) break;
  }
  return null;
}
