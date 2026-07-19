"use client";

/**
 * /activity — the local ledger (Ledger grammar).
 *
 * Every row comes from lib/activity (this device's localStorage): requests
 * created here and transaction hashes submitted here. A stored hash means
 * "submitted", nothing more — settlement state is always re-derived live
 * from the contract (statusOf) and labeled with its freshness. No invented
 * rows, no invented success.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Hex } from "viem";

import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { Skeleton } from "@/components/ui/Skeleton";

import { formatUnits } from "@/lib/amount";
import { explorerTxUrl, getChainConfig } from "@/lib/chain";
import { readStatusOf } from "@/lib/contracts";
import {
  deserializeRequest,
  listStoredRequests,
  listStoredTransactions,
  type ActivityTxKind,
  type StoredRequest,
  type StoredTransaction,
} from "@/lib/activity";
import { ANY_PAYER } from "@/lib/vajra/domain";
import { REQUEST_STATUS } from "@/lib/vajra/types";

import { getVajraPublicClient } from "../public-client";

const chainConfig = getChainConfig();

const TX_KIND_LABEL: Record<ActivityTxKind, string> = {
  fulfill: "Payment",
  revoke: "Revocation",
  registerPasskey: "Passkey registration",
  rotatePasskey: "Passkey rotation",
  deactivatePasskey: "Passkey deactivation",
};

const dateTimeFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const timeFmt = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

type RowStatus =
  | { kind: "loading" }
  | { kind: "open" }
  | { kind: "expired" }
  | { kind: "paid" }
  | { kind: "revoked" }
  | { kind: "unavailable" };

function statusLabel(s: RowStatus): string {
  switch (s.kind) {
    case "loading":
      return "Checking";
    case "open":
      return "Open";
    case "expired":
      return "Expired";
    case "paid":
      return "Paid";
    case "revoked":
      return "Revoked";
    case "unavailable":
      return "Unavailable";
  }
}

function StatusPill({ status }: { status: RowStatus }) {
  if (status.kind === "loading") {
    return <Skeleton variant="text" width={64} label="Checking request status" />;
  }
  return (
    <span className={`activity-pill activity-pill--${status.kind}`}>
      <span className="activity-pill__dot" aria-hidden="true" />
      {statusLabel(status)}
    </span>
  );
}

export function ActivityLedger() {
  const router = useRouter();
  const client = useMemo(() => getVajraPublicClient(chainConfig), []);

  const [mounted, setMounted] = useState(false);
  const [requests, setRequests] = useState<StoredRequest[]>([]);
  const [transactions, setTransactions] = useState<StoredTransaction[]>([]);
  const [statuses, setStatuses] = useState<Record<string, RowStatus>>({});
  const [checkedAt, setCheckedAt] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  /* Rows added after the initial load get a short 1s highlight, then it
     fades — no pulsing, no permanent marking. */
  const seenRef = useRef<Set<string> | null>(null);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  const loadLocal = useCallback(() => {
    const reqs = listStoredRequests();
    const txs = listStoredTransactions();
    if (seenRef.current === null) {
      // Initial load: nothing is "new".
      seenRef.current = new Set(reqs.map((r) => r.requestId.toLowerCase()));
    } else {
      const added = reqs
        .map((r) => r.requestId.toLowerCase())
        .filter((requestId) => !seenRef.current!.has(requestId));
      if (added.length > 0) {
        added.forEach((requestId) => seenRef.current!.add(requestId));
        setNewIds(new Set(added));
        window.setTimeout(() => setNewIds(new Set()), 1200);
      }
    }
    setRequests(reqs);
    setTransactions(txs);
    return reqs;
  }, []);

  const refreshStatuses = useCallback(
    async (reqs: StoredRequest[]) => {
      if (reqs.length === 0) {
        setCheckedAt(Date.now());
        return;
      }
      setRefreshing(true);
      setStatuses((prev) => {
        const next = { ...prev };
        for (const r of reqs) {
          const key = r.requestId.toLowerCase();
          if (!next[key]) next[key] = { kind: "loading" };
        }
        return next;
      });
      const nowSeconds = Math.floor(Date.now() / 1000);
      const results = await Promise.allSettled(
        reqs.map((r) => readStatusOf(client, r.requestId as Hex, chainConfig)),
      );
      setStatuses((prev) => {
        const next = { ...prev };
        results.forEach((result, i) => {
          const r = reqs[i];
          const key = r.requestId.toLowerCase();
          if (result.status === "fulfilled") {
            const status = result.value;
            if (status === REQUEST_STATUS.Paid) next[key] = { kind: "paid" };
            else if (status === REQUEST_STATUS.Revoked) next[key] = { kind: "revoked" };
            else if (nowSeconds > Number(deserializeRequest(r.request).expiresAt))
              next[key] = { kind: "expired" };
            else next[key] = { kind: "open" };
          } else {
            // A failed re-read keeps the last known status; only a first
            // failure is "unavailable". Honest, never invented.
            next[key] = prev[key] && prev[key].kind !== "loading" ? prev[key] : { kind: "unavailable" };
          }
        });
        return next;
      });
      setCheckedAt(Date.now());
      setRefreshing(false);
    },
    [client],
  );

  useEffect(() => {
    setMounted(true);
    const reqs = loadLocal();
    void refreshStatuses(reqs);
  }, [loadLocal, refreshStatuses]);

  /* Live re-reads: poll while the screen is open. */
  useEffect(() => {
    if (!mounted) return;
    const timer = window.setInterval(() => {
      const reqs = loadLocal();
      void refreshStatuses(reqs);
    }, 20000);
    return () => window.clearInterval(timer);
  }, [mounted, loadLocal, refreshStatuses]);

  function onRefresh() {
    const reqs = loadLocal();
    void refreshStatuses(reqs);
  }

  const empty = mounted && requests.length === 0 && transactions.length === 0;

  return (
    <div className="vscreen">
      <div className="vscreen__page">
        <div className="vscreen__head">
          <h1 className="vscreen__title">Activity</h1>
          <p className="vscreen__sub">
            Requests and transactions known to this device. Status is re-read live from
            Monad Mainnet — a stored hash means submitted, never settled.
          </p>
          {checkedAt !== null && (
            <p className="vscreen__freshness">
              {refreshing
                ? "Re-reading request statuses from Monad Mainnet…"
                : `Statuses checked at ${timeFmt.format(new Date(checkedAt))}`}
            </p>
          )}
        </div>

        {!mounted ? (
          <section aria-busy="true" aria-label="Loading local activity">
            <div className="activity-stack">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} variant="row" label={`Loading activity row ${i + 1}`} />
              ))}
            </div>
          </section>
        ) : empty ? (
          <section className="activity-empty">
            <span className="activity-empty__icon" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
                <path d="M3 10h18" stroke="currentColor" strokeWidth="1.6" />
                <path d="M7 15h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
            <h2 className="activity-empty__title">Nothing on this device yet</h2>
            <p className="activity-empty__body">
              Requests you create and payments you submit from this browser will appear
              here, with their settlement status re-read from the chain. Settlement history
              itself lives on Monad Mainnet — this list is only a local convenience.
            </p>
            <div>
              <Button onClick={() => router.push("/request")}>Create your first request</Button>
            </div>
          </section>
        ) : (
          <>
            {requests.length > 0 && (
              <section className="vscreen__section" aria-label="Requests created on this device">
                <div className="activity-section-head">
                  <h2 className="vscreen__section-title">Requests created on this device</h2>
                  <Button
                    variant="ghost"
                    onClick={onRefresh}
                    loading={refreshing}
                    loadingText="Re-reading"
                  >
                    Refresh
                  </Button>
                </div>
                <ul className="activity-list">
                  {requests.map((stored) => {
                    const request = deserializeRequest(stored.request);
                    const key = stored.requestId.toLowerCase();
                    const status = statuses[key] ?? { kind: "loading" as const };
                    const isNew = newIds.has(key);
                    const shareLink =
                      typeof window !== "undefined"
                        ? `${window.location.origin}/pay#${stored.payloadFragment}`
                        : "";
                    return (
                      <li
                        key={stored.requestId}
                        className={`activity-row${isNew ? " activity-row--new" : ""}`}
                      >
                        <div className="activity-row__main">
                          <div className="activity-row__primary">
                            <span className="activity-row__amount sc-tnum">
                              {formatUnits(request.amount, 18)} MON
                            </span>
                            <StatusPill status={status} />
                          </div>
                          <div className="activity-row__secondary">
                            {stored.memo.trim() !== "" ? (
                              <span className="activity-row__memo">{stored.memo}</span>
                            ) : (
                              <span className="activity-row__memo activity-row__memo--none">
                                No memo
                              </span>
                            )}
                            <span className="activity-row__meta sc-tnum">
                              Created {dateTimeFmt.format(new Date(stored.createdAt))}
                            </span>
                          </div>
                          <div className="activity-row__secondary">
                            <span className="activity-row__meta">
                              To{" "}
                              <span className="sc-mono sc-break">{request.recipient}</span>
                            </span>
                          </div>
                          <div className="activity-row__secondary">
                            <span className="activity-row__meta">
                              {request.payer === ANY_PAYER
                                ? "Open request — any payer"
                                : "Restricted payer"}
                              {" · "}
                              Expires{" "}
                              <span className="sc-tnum">
                                {dateTimeFmt.format(new Date(Number(request.expiresAt) * 1000))}
                              </span>
                            </span>
                          </div>
                        </div>
                        <div className="activity-row__actions">
                          {shareLink !== "" && (
                            <CopyButton text={shareLink} label="Copy link" copiedLabel="Copied" />
                          )}
                          {status.kind === "paid" && (
                            <Button
                              variant="ghost"
                              onClick={() => router.push(`/receipt/${stored.requestId}`)}
                            >
                              View receipt
                            </Button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {transactions.length > 0 && (
              <section className="vscreen__section" aria-label="Transactions submitted from this device">
                <div className="activity-section-head">
                  <h2 className="vscreen__section-title">
                    Transactions submitted from this device
                  </h2>
                </div>
                <ul className="activity-list">
                  {transactions.map((tx) => (
                    <li key={tx.txHash} className="activity-row">
                      <div className="activity-row__main">
                        <div className="activity-row__primary">
                          <span className="activity-row__kind">{TX_KIND_LABEL[tx.kind]}</span>
                          <span className="activity-row__meta sc-tnum">
                            {dateTimeFmt.format(new Date(tx.submittedAt))}
                          </span>
                        </div>
                        <div className="activity-row__secondary">
                          <span className="sc-mono sc-break activity-row__hash">
                            {tx.txHash}
                          </span>
                        </div>
                        <div className="activity-row__secondary">
                          <span className="activity-row__meta">
                            Submitted — settlement is verified from chain state, not from
                            this record.
                          </span>
                        </div>
                      </div>
                      <div className="activity-row__actions">
                        <CopyButton text={tx.txHash} label="Copy hash" copiedLabel="Copied" />
                        <a
                          className="activity-row__link"
                          href={explorerTxUrl(tx.txHash, chainConfig)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Monadscan
                        </a>
                        {tx.requestId && (
                          <Button
                            variant="ghost"
                            onClick={() => router.push(`/receipt/${tx.requestId}`)}
                          >
                            Receipt
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>

      {/* Primary action — fixed in the thumb zone on mobile */}
      {mounted && (
        <div className="actionbar">
          <div className="actionbar__inner">
            <Button className="actionbar__primary" onClick={() => router.push("/request")}>
              Create a request
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
