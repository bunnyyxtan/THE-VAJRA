/**
 * Settlement finality tracking (blueprint §14 "Events, Receipts and Finality").
 *
 * State machine (§14 "Receipt states"):
 *   broadcast            wallet returned a hash; NO settlement claim yet
 *   included             successful receipt + PaymentFulfilled from the canonical
 *                        contract + requestId match + contract state reads agree;
 *                        finality not yet proven
 *   final                finalized chain state covers the settlement block
 *   reverted             no successful payment event; funds did not settle
 *   verification_delayed transaction may be successful, but one or more proof
 *                        sources are temporarily unavailable — honest state,
 *                        the hash is preserved, polling continues
 *   replaced             declared for completeness (§14); plain-RPC tracking
 *                        cannot reliably detect same-nonce replacement without
 *                        wallet signals, so this watcher never invents it —
 *                        the wallet layer may surface it from its own events
 *
 * Success is NEVER claimed on wallet submission alone, and never without
 * receipt + event + state. Observed times are measured, never hardcoded.
 */

import type { Hex, PublicClient } from 'viem';
import { getChainConfig, type VajraChainConfig } from './chain';
import { decodePaymentFulfilledEvents, readSettlementOf, readStatusOf } from './contracts';
import { REQUEST_STATUS, type PaymentFulfilledEvent } from './vajra/types';

export type SettlementPhase =
  | 'broadcast'
  | 'included'
  | 'final'
  | 'reverted'
  | 'verification_delayed'
  | 'replaced';

export type FinalitySource = 'finalized-tag' | 'confirmations';

export interface SettlementSnapshot {
  phase: SettlementPhase;
  txHash: Hex;
  requestId: Hex;
  /** Present from 'included' onward. */
  blockNumber?: bigint;
  /** The matching PaymentFulfilled event, when verified. */
  event?: PaymentFulfilledEvent;
  /** How finality was established — labeled honestly, never implied. */
  finalitySource?: FinalitySource;
  /** Confirmations observed (fallback path only). */
  confirmations?: bigint;
  /** Human-readable reason for reverted / verification_delayed. */
  reason?: string;
  /** Wall-clock time of this snapshot (ms since epoch). */
  checkedAt: number;
}

/**
 * Confirmation-depth fallback when the RPC does not support the `finalized`
 * block tag. This is a documented HEURISTIC, not a finality guarantee: on
 * Monad, blocks are produced sub-second and the chain advertises single-slot
 * finality, but until the finalized tag is confirmed available on the public
 * RPC, we require this many blocks on top of the settlement block before
 * labeling the receipt 'final' via the fallback — and we always label the
 * source. 5 blocks ≈ a few seconds of additional chain growth.
 */
export const FINALITY_FALLBACK_CONFIRMATIONS = 5n;

export interface WatchParams {
  txHash: Hex;
  requestId: Hex;
  config?: VajraChainConfig;
  /** Poll interval while waiting for inclusion. Default 2000ms. */
  pollIntervalMs?: number;
  /** Abort polling (page navigation, user cancel). */
  signal?: AbortSignal;
}

function snapshot(base: SettlementSnapshot, patch: Partial<SettlementSnapshot>): SettlementSnapshot {
  return { ...base, ...patch, checkedAt: Date.now() };
}

/**
 * Single-pass verification used by the receipt page and by the polling
 * watcher. Performs the §14 checks in order and returns the furthest honest
 * state. Throws nothing for RPC failures — those become verification_delayed.
 */
export async function verifySettlementOnce(
  client: PublicClient,
  params: { txHash: Hex; requestId: Hex; config?: VajraChainConfig },
): Promise<SettlementSnapshot> {
  const config = params.config ?? getChainConfig();
  const base: SettlementSnapshot = {
    phase: 'broadcast',
    txHash: params.txHash,
    requestId: params.requestId,
    checkedAt: Date.now(),
  };

  // --- 1. Transaction receipt --------------------------------------------
  let receipt;
  try {
    receipt = await client.getTransactionReceipt({ hash: params.txHash });
  } catch (err) {
    return snapshot(base, {
      phase: 'verification_delayed',
      reason: `Receipt unavailable (RPC error). The transaction may still settle; the hash is preserved. (${String(
        (err as Error)?.message ?? err,
      ).slice(0, 160)})`,
    });
  }

  if (receipt.status === 'reverted') {
    return snapshot(base, {
      phase: 'reverted',
      blockNumber: receipt.blockNumber,
      reason: 'The transaction was included but reverted. The Vajra payment did not settle; only gas was consumed.',
    });
  }

  // --- 2+3. PaymentFulfilled from the canonical contract, requestId match -
  const events = decodePaymentFulfilledEvents(receipt.logs, config);
  const event = events.find((e) => e.requestId.toLowerCase() === params.requestId.toLowerCase());

  if (!event) {
    // A successful fulfill MUST emit exactly one matching event. Absence means
    // this hash is not the settlement we are tracking (or logs are
    // unavailable) — re-read contract state before concluding anything.
    try {
      const status = await readStatusOf(client, params.requestId, config);
      if (status === REQUEST_STATUS.Paid) {
        return snapshot(base, {
          phase: 'verification_delayed',
          reason:
            'The transaction succeeded but no matching PaymentFulfilled event was found in its logs, while the contract shows the request as Paid. Another transaction may have settled it; verify the settlement record before treating this hash as the payment.',
        });
      }
    } catch {
      // Fall through to the generic delayed state below.
    }
    return snapshot(base, {
      phase: 'verification_delayed',
      reason:
        'The transaction succeeded but receipt verification is incomplete: no matching PaymentFulfilled event from the canonical contract. Re-reading contract state is required.',
    });
  }

  const included = snapshot(base, { phase: 'included', blockNumber: receipt.blockNumber, event });

  // --- 4+5+6. Contract state agrees with the event ------------------------
  try {
    const [status, settlement] = await Promise.all([
      readStatusOf(client, params.requestId, config),
      readSettlementOf(client, params.requestId, config),
    ]);
    const stateAgrees =
      status === REQUEST_STATUS.Paid &&
      settlement.payer.toLowerCase() === event.payer.toLowerCase() &&
      settlement.recipient.toLowerCase() === event.recipient.toLowerCase() &&
      settlement.amount === event.amount &&
      settlement.paidAt === event.paidAt;
    if (!stateAgrees) {
      return snapshot(included, {
        phase: 'verification_delayed',
        reason:
          'Receipt and event verified, but the contract state read does not yet agree with the event (possible RPC lag). Re-checking.',
      });
    }
  } catch (err) {
    return snapshot(included, {
      phase: 'verification_delayed',
      reason: `Receipt and event verified, but contract state could not be read (RPC error). (${String(
        (err as Error)?.message ?? err,
      ).slice(0, 160)})`,
    });
  }

  // --- 7. Finality ---------------------------------------------------------
  // Preferred path: finalized block tag (§14). Fallback: documented
  // confirmation depth, labeled honestly as a heuristic.
  let finalizedUnsupported = false;
  try {
    const finalized = await client.getBlock({ blockTag: 'finalized' });
    if (finalized.number >= receipt.blockNumber) {
      return snapshot(included, { phase: 'final', finalitySource: 'finalized-tag' });
    }
    // Tag works but doesn't cover the block yet — stay 'included'.
    return included;
  } catch {
    finalizedUnsupported = true;
  }

  if (finalizedUnsupported) {
    try {
      const latest = await client.getBlock({ blockTag: 'latest' });
      const confirmations = latest.number - receipt.blockNumber + 1n;
      if (confirmations >= FINALITY_FALLBACK_CONFIRMATIONS) {
        return snapshot(included, {
          phase: 'final',
          finalitySource: 'confirmations',
          confirmations,
          reason: `Finalized block tag unavailable on this RPC; finality asserted via ${FINALITY_FALLBACK_CONFIRMATIONS}-confirmation heuristic fallback (not a protocol finality guarantee).`,
        });
      }
      return snapshot(included, { finalitySource: 'confirmations', confirmations });
    } catch (err) {
      return snapshot(included, {
        phase: 'verification_delayed',
        reason: `Settlement is included and state-verified, but finality could not be checked (RPC error). (${String(
          (err as Error)?.message ?? err,
        ).slice(0, 160)})`,
      });
    }
  }

  return included;
}

/**
 * Polls until a terminal state ('final' or 'reverted') or until aborted.
 * Emits every snapshot transition through onUpdate. Returns a stop function.
 * RPC outages produce 'verification_delayed' snapshots and polling continues —
 * the hash is never dropped, and success is never invented.
 */
export function watchSettlement(
  client: PublicClient,
  params: WatchParams,
  onUpdate: (snapshot: SettlementSnapshot) => void,
): () => void {
  const pollIntervalMs = params.pollIntervalMs ?? 2000;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastKey = '';

  const stop = () => {
    stopped = true;
    if (timer !== undefined) clearTimeout(timer);
    params.signal?.removeEventListener('abort', stop);
  };
  params.signal?.addEventListener('abort', stop);

  onUpdate({
    phase: 'broadcast',
    txHash: params.txHash,
    requestId: params.requestId,
    checkedAt: Date.now(),
  });

  const tick = async () => {
    if (stopped) return;
    let snap: SettlementSnapshot;
    try {
      snap = await verifySettlementOnce(client, params);
    } catch (err) {
      // verifySettlementOnce already converts RPC errors; this is a last resort.
      snap = {
        phase: 'verification_delayed',
        txHash: params.txHash,
        requestId: params.requestId,
        reason: `Verification pass failed unexpectedly: ${String((err as Error)?.message ?? err).slice(0, 160)}`,
        checkedAt: Date.now(),
      };
    }
    if (stopped) return;
    const key = `${snap.phase}:${snap.blockNumber ?? ''}:${snap.confirmations ?? ''}`;
    if (key !== lastKey) {
      lastKey = key;
      onUpdate(snap);
    }
    if (snap.phase === 'final' || snap.phase === 'reverted') {
      stop();
      return;
    }
    timer = setTimeout(tick, pollIntervalMs);
  };

  void tick();
  return stop;
}
