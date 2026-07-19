"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createPublicClient, http, type Hex, type PublicClient } from "viem";
import { explorerAddressUrl, explorerTxUrl, getChainConfig } from "@/lib/chain";
import { readSettlementOf, readStatusOf } from "@/lib/contracts";
import { VAJRA_ABI } from "@/lib/contracts/abi";
import { formatUnits } from "@/lib/amount";
import { classifyError } from "@/lib/errors";
import { REQUEST_STATUS, type Settlement } from "@/lib/vajra/types";
import { Button } from "@/components/ui/Button";
import { LedgerBlock, LedgerRow } from "@/components/ui/Ledger";
import {
  ProofChain,
  PROOF_CHAIN_STAGES,
  type ProofStage,
} from "@/components/ui/ProofChain";
import { Seal } from "@/components/ui/Seal";
import { Skeleton } from "@/components/ui/Skeleton";
import { CopyButton } from "@/components/ui/CopyButton";
import { Banner } from "@/components/ui/Banner";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type Check<T> =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "done"; value: T };

interface StateResult {
  status: number;
  settlement: Settlement;
  at: number;
}

interface FulfilledLog {
  txHash: Hex;
  blockNumber: bigint;
  payer: `0x${string}`;
  recipient: `0x${string}`;
  amount: bigint;
  paidAt: bigint;
  memoHash: Hex;
  authMode: number;
  authVersion: number;
}

interface EventResult {
  found: FulfilledLog | null;
  at: number;
}

const REQUEST_ID_RE = /^0x[0-9a-fA-F]{64}$/;

const paymentFulfilledEvent = VAJRA_ABI.find(
  (entry): entry is Extract<(typeof VAJRA_ABI)[number], { name: "PaymentFulfilled" }> =>
    entry.type === "event" && "name" in entry && entry.name === "PaymentFulfilled",
);

const timeFmt = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const dateTimeFmt = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZoneName: "short",
});

function describeError(err: unknown): string {
  const classified = classifyError(err);
  if (classified.code === "RPC_UNAVAILABLE") {
    return "The Monad RPC endpoint did not answer.";
  }
  return classified.message.slice(0, 160);
}

/* -------------------------------------------------------------------------- */
/* Small inline icons (status is always icon + text, never color alone)        */
/* -------------------------------------------------------------------------- */

function CheckCircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M6.4 10.3l2.5 2.4 4.7-5.3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1.8L15 14H1L8 1.8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 6.4v3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="11.6" r="0.9" fill="currentColor" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7.4v3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="5.2" r="0.9" fill="currentColor" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* ReceiptView                                                                 */
/* -------------------------------------------------------------------------- */

export function ReceiptView({ requestId }: { requestId: string }) {
  const valid = REQUEST_ID_RE.test(requestId);
  const id = requestId.toLowerCase() as Hex;

  const config = useMemo(() => getChainConfig(), []);
  const client = useMemo<PublicClient>(
    () => createPublicClient({ chain: config.chain, transport: http(config.rpcUrl) }),
    [config],
  );

  /* Two INDEPENDENT verification channels, each with its own pending state:
     A) contract state (statusOf + settlementOf)
     B) the PaymentFulfilled event log (canonical contract, indexed requestId) */
  const [stateCheck, setStateCheck] = useState<Check<StateResult>>({ phase: "loading" });
  const [eventCheck, setEventCheck] = useState<Check<EventResult>>({ phase: "loading" });
  const [refreshing, setRefreshing] = useState(false);
  /* Soft errors: a re-verification failed while earlier evidence stays on
     screen — labeled honestly, never swapped for a blank error. */
  const [stateSoftError, setStateSoftError] = useState<string | null>(null);
  const [eventSoftError, setEventSoftError] = useState<string | null>(null);

  const runStateCheck = useCallback(
    async (soft = false) => {
      if (!valid) return;
      if (!soft) setStateCheck({ phase: "loading" });
      try {
        const [status, settlement] = await Promise.all([
          readStatusOf(client, id, config),
          readSettlementOf(client, id, config),
        ]);
        setStateCheck({ phase: "done", value: { status, settlement, at: Date.now() } });
        setStateSoftError(null);
      } catch (err) {
        const message = describeError(err);
        setStateCheck((prev) => {
          if (prev.phase === "done") {
            // Keep stale evidence visible; the banner labels it.
            setStateSoftError(message);
            return prev;
          }
          return { phase: "error", message };
        });
      }
    },
    [client, id, config, valid],
  );

  const runEventCheck = useCallback(
    async (soft = false) => {
      if (!valid || !paymentFulfilledEvent) return;
      if (!soft) setEventCheck({ phase: "loading" });
      try {
        const logs = await client.getLogs({
          address: config.contractAddress,
          event: paymentFulfilledEvent,
          args: { requestId: id },
          fromBlock: 0n,
        });
        const log = [...logs]
          .reverse()
          .find((l) => l.args.requestId?.toLowerCase() === id.toLowerCase());
        const a = log?.args;
        let found: FulfilledLog | null = null;
        if (
          log &&
          a &&
          a.payer !== undefined &&
          a.recipient !== undefined &&
          a.amount !== undefined &&
          a.paidAt !== undefined &&
          a.memoHash !== undefined &&
          a.authMode !== undefined &&
          a.authVersion !== undefined
        ) {
          found = {
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
            payer: a.payer,
            recipient: a.recipient,
            amount: a.amount,
            paidAt: a.paidAt,
            memoHash: a.memoHash,
            authMode: a.authMode,
            authVersion: a.authVersion,
          };
        }
        setEventCheck({ phase: "done", value: { found, at: Date.now() } });
        setEventSoftError(null);
      } catch (err) {
        const message = describeError(err);
        setEventCheck((prev) => {
          if (prev.phase === "done") {
            setEventSoftError(message);
            return prev;
          }
          return { phase: "error", message };
        });
      }
    },
    [client, id, config, valid],
  );

  useEffect(() => {
    void runStateCheck();
    void runEventCheck();
  }, [runStateCheck, runEventCheck]);

  const reverify = useCallback(async () => {
    setRefreshing(true);
    setStateSoftError(null);
    setEventSoftError(null);
    await Promise.allSettled([runStateCheck(true), runEventCheck(true)]);
    setRefreshing(false);
  }, [runStateCheck, runEventCheck]);

  /* ------------------------------------------------------------------ */
  /* Derived state                                                       */
  /* ------------------------------------------------------------------ */

  const settlement =
    stateCheck.phase === "done" && stateCheck.value.status === REQUEST_STATUS.Paid
      ? stateCheck.value.settlement
      : null;
  const eventLog = eventCheck.phase === "done" ? eventCheck.value.found : null;

  // The ledger renders from whichever authoritative source exists.
  const source: Settlement | null =
    settlement ??
    (eventLog
      ? {
          payer: eventLog.payer,
          recipient: eventLog.recipient,
          amount: eventLog.amount,
          paidAt: eventLog.paidAt,
          memoHash: eventLog.memoHash,
          authMode: eventLog.authMode as Settlement["authMode"],
          authVersion: eventLog.authVersion,
        }
      : null);

  const mismatch =
    settlement !== null &&
    eventLog !== null &&
    !(
      settlement.payer.toLowerCase() === eventLog.payer.toLowerCase() &&
      settlement.recipient.toLowerCase() === eventLog.recipient.toLowerCase() &&
      settlement.amount === eventLog.amount &&
      settlement.paidAt === eventLog.paidAt &&
      settlement.memoHash.toLowerCase() === eventLog.memoHash.toLowerCase()
    );

  const confirmed = source !== null && !mismatch;
  const bothFailed = stateCheck.phase === "error" && eventCheck.phase === "error";
  const initialLoading =
    !bothFailed &&
    source === null &&
    (stateCheck.phase === "loading" || eventCheck.phase === "loading") &&
    !(stateCheck.phase === "done" && eventCheck.phase === "done");
  const notFound =
    stateCheck.phase === "done" &&
    stateCheck.value.status !== REQUEST_STATUS.Paid &&
    eventCheck.phase !== "loading" &&
    eventLog === null;
  const revoked =
    stateCheck.phase === "done" && stateCheck.value.status === REQUEST_STATUS.Revoked;

  const verifiedAt = Math.max(
    stateCheck.phase === "done" ? stateCheck.value.at : 0,
    eventCheck.phase === "done" ? eventCheck.value.at : 0,
  );

  /* Proof chain: all seven stages complete on a settled receipt. The fill
     animation runs once on mount (next frame flip), never on re-verify. */
  const [chainComplete, setChainComplete] = useState(false);
  useEffect(() => {
    if (!confirmed || chainComplete) return;
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setChainComplete(true)),
    );
    return () => cancelAnimationFrame(raf);
  }, [confirmed, chainComplete]);

  const stages: ProofStage[] = PROOF_CHAIN_STAGES.map((label) => ({
    label,
    status: chainComplete ? "complete" : "upcoming",
  }));

  /* Share = copy this receipt URL. Real clipboard write, check morph, AT note. */
  const [shareState, setShareState] = useState<"idle" | "copied" | "error">("idle");
  const shareTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (shareTimer.current !== null) window.clearTimeout(shareTimer.current);
    },
    [],
  );
  async function shareReceipt() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareState("copied");
    } catch {
      setShareState("error");
    }
    if (shareTimer.current !== null) window.clearTimeout(shareTimer.current);
    shareTimer.current = window.setTimeout(() => setShareState("idle"), 1800);
  }

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */

  const contractExplorerUrl = explorerAddressUrl(config.contractAddress, config);

  return (
    <main className="receipt-page">
      <header className="receipt-header">
        <Link href="/" className="receipt-brand">
          VAJRA
        </Link>
        <ThemeToggle />
      </header>

      <p className="receipt-print-only">
        VAJRA payment receipt · VajraNativeV1 at{" "}
        <span className="mono">{config.contractAddress}</span> on Monad Mainnet (chain 143)
      </p>

      <div className="receipt-titleblock">
        <h1 className="receipt-title">Payment receipt</h1>
        {verifiedAt > 0 && (
          <p className="receipt-freshness tnum">
            {refreshing
              ? "Re-verifying against Monad Mainnet…"
              : `Verified from Monad Mainnet state at ${timeFmt.format(new Date(verifiedAt))}`}
          </p>
        )}
      </div>

      {!valid ? (
        <InvalidRequestId raw={requestId} contractExplorerUrl={contractExplorerUrl} />
      ) : initialLoading ? (
        <ReceiptSkeleton />
      ) : bothFailed ? (
        <section className="receipt-empty" aria-busy={refreshing}>
          <h2 className="receipt-empty__title">Could not reach Monad Mainnet</h2>
          <p className="receipt-empty__body">
            Neither the contract state nor the settlement event could be read right now, so
            this receipt cannot be verified. No result is claimed either way — the request ID
            is preserved below.
          </p>
          <dl className="ledger">
            <LedgerRow label="Request ID" value={id} mono aside={<CopyButton text={id} />} />
          </dl>
          <p className="receipt-note">
            <InfoIcon />
            <span>
              You can verify independently any time: open the{" "}
              <a href={contractExplorerUrl} target="_blank" rel="noreferrer">
                canonical VajraNativeV1 contract on Monadscan
              </a>{" "}
              and call <span className="mono">statusOf</span> /{" "}
              <span className="mono">settlementOf</span> with this request ID.
            </span>
          </p>
          <div className="receipt-actions">
            <Button onClick={reverify} loading={refreshing} loadingText="Re-verifying on Monad">
              Retry verification
            </Button>
          </div>
        </section>
      ) : notFound ? (
        <section className="receipt-empty">
          <h2 className="receipt-empty__title">No settlement found for this request</h2>
          {revoked ? (
            <Banner tone="warning" title="Request revoked">
              The recipient revoked this request before it was paid. No settlement exists and
              none can be created from it.
            </Banner>
          ) : (
            <p className="receipt-empty__body">
              The canonical VajraNativeV1 contract on Monad Mainnet shows no settled payment
              for this request ID. It may never have been paid, the ID may be mistyped, or the
              link may come from a different deployment.
            </p>
          )}
          {eventCheck.phase === "error" && (
            <p className="receipt-note receipt-note--warning">
              <WarningIcon />
              <span>
                The settlement event could not be read ({eventCheck.message}). The
                contract-state answer above is authoritative; you can retry the event check.
              </span>
              <Button variant="ghost" onClick={() => void runEventCheck()}>
                Retry
              </Button>
            </p>
          )}
          <dl className="ledger">
            <LedgerRow label="Request ID" value={id} mono aside={<CopyButton text={id} />} />
          </dl>
          <h3 className="receipt-empty__title" style={{ fontSize: "var(--type-component)" }}>
            How to verify independently
          </h3>
          <ol className="receipt-empty__steps">
            <li>
              Open the{" "}
              <a href={contractExplorerUrl} target="_blank" rel="noreferrer">
                canonical VajraNativeV1 contract on Monadscan
              </a>{" "}
              (chain 143).
            </li>
            <li>
              Call <span className="mono">statusOf(requestId)</span> —{" "}
              <span className="mono">Paid</span> means settled;{" "}
              <span className="mono">Unused</span> means no payment exists.
            </li>
            <li>
              Call <span className="mono">settlementOf(requestId)</span> for the payer,
              recipient, amount and settlement time.
            </li>
          </ol>
        </section>
      ) : confirmed && source ? (
        <>
          {stateCheck.phase === "error" && eventLog && (
            <Banner tone="warning" title="Contract state re-read pending">
              This receipt is verified from the PaymentFulfilled event of the canonical
              contract. The contract state read failed ({stateCheck.message}) — the event is
              authoritative chain data, but you can retry the state read.
            </Banner>
          )}
          {(stateSoftError || eventSoftError) && (
            <Banner tone="warning" title="Re-verification incomplete">
              {stateSoftError ?? eventSoftError} The evidence below is from the earlier
              successful read and remains labeled with its verification time.
            </Banner>
          )}

          <div className="receipt-reveal receipt-confirm" role="status">
            <CheckCircleIcon />
            <span>Settlement confirmed on Monad Mainnet</span>
          </div>

          <div className="receipt-reveal" aria-label="Completed proof chain">
            <ProofChain stages={stages} ariaLabel="Payment proof chain — all stages complete" />
          </div>

          <div className="receipt-reveal receipt-sealrow">
            <Seal
              title="Receipt sealed"
              sub="VajraNativeV1 · Monad Mainnet · chain 143"
              size={40}
            />
          </div>

          <div className="receipt-reveal receipt-reveal--1">
            <LedgerBlock
              title="Settlement record"
              freshness={`Verified from Monad Mainnet state at ${timeFmt.format(new Date(verifiedAt))}`}
            >
              <LedgerRow
                label="Payer"
                value={source.payer}
                mono
                aside={<CopyButton text={source.payer} />}
              />
              <LedgerRow
                label="Recipient"
                value={source.recipient}
                mono
                aside={<CopyButton text={source.recipient} />}
              />
              <LedgerRow
                label="Amount"
                value={
                  <span className="tnum" style={{ fontWeight: 700 }}>
                    {formatUnits(source.amount, 18)} MON
                  </span>
                }
              />
              <LedgerRow
                label="Amount (wei)"
                value={source.amount.toString()}
                mono
                aside={<CopyButton text={source.amount.toString()} />}
              />
              <LedgerRow label="Request ID" value={id} mono aside={<CopyButton text={id} />} />
              <LedgerRow
                label="Memo hash"
                value={source.memoHash}
                mono
                aside={<CopyButton text={source.memoHash} />}
              />
              <LedgerRow
                label="Authorization"
                value={
                  source.authMode === 0
                    ? "Wallet signature (EIP-712)"
                    : `Passkey (P-256, version ${source.authVersion})`
                }
              />
              <LedgerRow
                label="Transaction"
                value={
                  eventLog ? (
                    eventLog.txHash
                  ) : eventCheck.phase === "loading" ? (
                    <Skeleton variant="text" width={240} label="Event verification pending" />
                  ) : (
                    "Verification pending"
                  )
                }
                mono={!!eventLog}
                aside={
                  eventLog ? (
                    <>
                      <CopyButton text={eventLog.txHash} />
                      <a
                        href={explorerTxUrl(eventLog.txHash, config)}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: "var(--type-compact)", fontWeight: 600 }}
                      >
                        Monadscan
                      </a>
                    </>
                  ) : eventCheck.phase === "error" ? (
                    <Button variant="ghost" onClick={() => void runEventCheck()}>
                      Retry
                    </Button>
                  ) : undefined
                }
              />
              <LedgerRow
                label="Block"
                value={
                  eventLog ? (
                    <span className="tnum">{Number(eventLog.blockNumber).toLocaleString("en-US")}</span>
                  ) : eventCheck.phase === "loading" ? (
                    <Skeleton variant="text" width={96} label="Block number pending" />
                  ) : (
                    "Verification pending"
                  )
                }
              />
              <LedgerRow
                label="Settled at"
                value={
                  <span className="tnum">
                    {dateTimeFmt.format(new Date(Number(source.paidAt) * 1000))}
                  </span>
                }
              />
              <LedgerRow
                label="Contract"
                value={config.contractAddress}
                mono
                aside={
                  <>
                    <CopyButton text={config.contractAddress} />
                    <a
                      href={contractExplorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: "var(--type-compact)", fontWeight: 600 }}
                    >
                      Monadscan
                    </a>
                  </>
                }
              />
            </LedgerBlock>
          </div>

          {eventCheck.phase === "error" && (
            <p className="receipt-note receipt-note--warning">
              <WarningIcon />
              <span>
                The PaymentFulfilled event could not be read ({eventCheck.message}), so the
                transaction hash and block number are pending. The settlement record above
                comes from contract state and is authoritative.
              </span>
            </p>
          )}
          {eventCheck.phase === "loading" && (
            <p className="receipt-note">
              <InfoIcon />
              <span>Reading the PaymentFulfilled event from the canonical contract…</span>
            </p>
          )}

          <div className="receipt-reveal receipt-reveal--2 receipt-actions">
            <Button
              variant="secondary"
              onClick={shareReceipt}
              success={shareState === "copied"}
              successText="Link copied"
            >
              {shareState === "error" ? "Copy failed — try again" : "Copy receipt link"}
            </Button>
            <Button variant="secondary" onClick={() => window.print()}>
              Print / save receipt
            </Button>
            <Button
              variant="ghost"
              onClick={reverify}
              loading={refreshing}
              loadingText="Re-verifying"
            >
              Re-verify
            </Button>
            <span className="visually-hidden" role="status" aria-live="polite">
              {shareState === "copied" ? "Receipt link copied" : ""}
            </span>
          </div>

          <p className="receipt-note receipt-no-print">
            <InfoIcon />
            <span>
              Anyone can verify this receipt independently: call{" "}
              <span className="mono">statusOf</span> / <span className="mono">settlementOf</span>{" "}
              with this request ID on the{" "}
              <a href={contractExplorerUrl} target="_blank" rel="noreferrer">
                canonical contract
              </a>
              .
            </span>
          </p>
        </>
      ) : mismatch ? (
        <section className="receipt-empty">
          <Banner tone="danger" title="Verification conflict">
            The contract state and the PaymentFulfilled event do not agree for this request
            ID. Do not treat this as a verified receipt. Check the request ID and verify both
            reads independently on the{" "}
            <a href={contractExplorerUrl} target="_blank" rel="noreferrer">
              canonical contract
            </a>
            .
          </Banner>
          <div className="receipt-actions">
            <Button onClick={reverify} loading={refreshing} loadingText="Re-verifying on Monad">
              Retry verification
            </Button>
          </div>
        </section>
      ) : stateCheck.phase === "error" ? (
        /* Event channel answered (no PaymentFulfilled log) but the contract
           state read failed — we cannot authoritatively say "no settlement". */
        <section className="receipt-empty" aria-busy={refreshing}>
          <h2 className="receipt-empty__title">Verification incomplete</h2>
          <p className="receipt-empty__body">
            No PaymentFulfilled event was found for this request ID, but the contract state
            could not be read ({stateCheck.message}), so this cannot be confirmed as unpaid.
            Nothing is claimed either way.
          </p>
          <dl className="ledger">
            <LedgerRow label="Request ID" value={id} mono aside={<CopyButton text={id} />} />
          </dl>
          <p className="receipt-note">
            <InfoIcon />
            <span>
              Verify independently: call <span className="mono">statusOf</span> with this
              request ID on the{" "}
              <a href={contractExplorerUrl} target="_blank" rel="noreferrer">
                canonical VajraNativeV1 contract
              </a>
              .
            </span>
          </p>
          <div className="receipt-actions">
            <Button onClick={reverify} loading={refreshing} loadingText="Re-verifying on Monad">
              Retry verification
            </Button>
          </div>
        </section>
      ) : null}
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Panels                                                                      */
/* -------------------------------------------------------------------------- */

function InvalidRequestId({
  raw,
  contractExplorerUrl,
}: {
  raw: string;
  contractExplorerUrl: string;
}) {
  return (
    <section className="receipt-empty">
      <h2 className="receipt-empty__title">This is not a valid request ID</h2>
      <p className="receipt-empty__body">
        A Vajra request ID is a 32-byte hex digest (<span className="mono">0x</span> followed
        by 64 hexadecimal characters). The value in this link does not match that format, so
        nothing was queried onchain.
      </p>
      {raw.length > 0 && raw.length <= 128 && (
        <dl className="ledger">
          <LedgerRow label="Received" value={raw} mono />
        </dl>
      )}
      <h3 className="receipt-empty__title" style={{ fontSize: "var(--type-component)" }}>
        How to verify independently
      </h3>
      <ol className="receipt-empty__steps">
        <li>Ask the sender for the exact receipt link or the full request ID.</li>
        <li>
          Open the{" "}
          <a href={contractExplorerUrl} target="_blank" rel="noreferrer">
            canonical VajraNativeV1 contract on Monadscan
          </a>{" "}
          (chain 143).
        </li>
        <li>
          Call <span className="mono">statusOf(requestId)</span> —{" "}
          <span className="mono">Paid</span> means settled;{" "}
          <span className="mono">Unused</span> means no payment exists.
        </li>
      </ol>
    </section>
  );
}

function ReceiptSkeleton() {
  return (
    <>
      <p className="receipt-stage" role="status">
        Reading settlement from Monad Mainnet…
      </p>
      <section aria-busy="true" aria-label="Loading settlement confirmation">
        <Skeleton variant="text" width={280} height={24} label="Loading settlement status" />
      </section>
      <section aria-busy="true" aria-label="Loading proof chain">
        <Skeleton variant="block" className="receipt-proof-skeleton" label="Loading proof chain" />
      </section>
      <section aria-busy="true" aria-label="Loading seal">
        <Skeleton variant="block" height={72} label="Loading verification seal" />
      </section>
      <section aria-busy="true" aria-label="Loading settlement record">
        <div className="receipt-skeleton-stack">
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} variant="row" label={`Loading ledger row ${i + 1}`} />
          ))}
        </div>
      </section>
    </>
  );
}
