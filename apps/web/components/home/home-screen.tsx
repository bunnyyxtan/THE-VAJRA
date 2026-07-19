"use client";

/**
 * Home — screen grammar (design-direction-v1 §Screen grammar HOME):
 * no autoplay hero, one calm ambient readiness line, ONE primary action
 * ("Create request"), recent activity from local records re-verified against
 * the contract, and a wallet connect entry.
 *
 * Real data only: activity rows come from lib/activity.ts (this device's
 * localStorage) and each row's status is re-read live from the contract via
 * statusOf. Nothing is fabricated; a missing chain answer is labeled, never
 * guessed.
 */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useChainId,
  useConnect,
  usePublicClient,
  useSwitchChain,
} from "wagmi";
import { useQuery } from "@tanstack/react-query";
import type { Hex } from "viem";
import { getChainConfig } from "@/lib/chain";
import { readStatusOf } from "@/lib/contracts";
import { listStoredRequests, type StoredRequest } from "@/lib/activity";
import { formatUnits } from "@/lib/amount";
import { classifyError, userCopy } from "@/lib/errors";
import { REQUEST_STATUS } from "@/lib/vajra/types";
import { Button } from "@/components/ui/Button";
import { LedgerBlock, LedgerRow } from "@/components/ui/Ledger";
import { Skeleton } from "@/components/ui/Skeleton";
import { Banner } from "@/components/ui/Banner";
import styles from "./home.module.css";

const chain = getChainConfig();

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const RECENT_LIMIT = 5;

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
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

type StatusTone = "checking" | "success" | "info" | "warning" | "danger";

/** One calm ambient readiness line: wallet, network, contract reachability. */
function Readiness() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const connect = useConnect();
  const switchChain = useSwitchChain();

  const correctChain = chainId === chain.chainId;

  const contractQuery = useQuery({
    queryKey: ["vajra", "contract-reachable", chain.chainId],
    enabled: !!publicClient,
    staleTime: 30_000,
    queryFn: async () => {
      const code = await publicClient!.getBytecode({
        address: chain.contractAddress,
      });
      return typeof code === "string" && code !== "0x";
    },
  });

  const injectedConnector =
    connect.connectors.find((c) => c.id === "injected") ?? connect.connectors[0];

  let tone: StatusTone;
  let text: string;
  if (contractQuery.isPending) {
    tone = "checking";
    text = "Checking the Vajra contract on Monad Mainnet…";
  } else if (contractQuery.isError || contractQuery.data === false) {
    tone = "danger";
    text =
      "The Vajra contract is unreachable — chain state cannot be verified right now.";
  } else if (!isConnected) {
    tone = "info";
    text = "Contract reachable · wallet not connected";
  } else if (!correctChain) {
    tone = "warning";
    text = "Connected to the wrong network — switch to Monad Mainnet (chain 143).";
  } else {
    tone = "success";
    text = `Ready · ${shortAddress(address ?? "")} · Monad Mainnet · contract reachable`;
  }

  const walletError = connect.error ?? switchChain.error ?? null;
  const walletErrorCopy = walletError
    ? userCopy(classifyError(walletError).code)
    : null;

  return (
    <div className={styles.intro} aria-label="Readiness">
      <p
        className={styles.status}
        data-tone={tone}
        role="status"
        aria-busy={contractQuery.isPending || undefined}
      >
        <span className={styles.statusDot} aria-hidden="true" />
        <span>{text}</span>
      </p>
      <div className={styles.statusActions}>
        {!isConnected && (
          <Button
            variant="secondary"
            onClick={() =>
              injectedConnector &&
              connect.connect({ connector: injectedConnector })
            }
            loading={connect.isPending}
            loadingText="Opening wallet"
            disabled={!injectedConnector}
          >
            Connect wallet
          </Button>
        )}
        {isConnected && !correctChain && (
          <Button
            variant="secondary"
            onClick={() => switchChain.switchChain({ chainId: chain.chainId })}
            loading={switchChain.isPending}
            loadingText="Awaiting wallet approval"
          >
            Switch to Monad Mainnet
          </Button>
        )}
      </div>
      {walletErrorCopy && (
        <p className={styles.inlineError} role="alert">
          {walletErrorCopy.title}. {walletErrorCopy.retrySafe}
        </p>
      )}
    </div>
  );
}

type RowState =
  | { kind: "known"; label: string; tone: "success" | "info" | "muted" }
  | { kind: "checking" }
  | { kind: "unknown" };

function rowState(
  status: number | undefined,
  statusFailed: boolean,
  expiresAtSeconds: bigint
): RowState {
  if (status === undefined) {
    return statusFailed ? { kind: "unknown" } : { kind: "checking" };
  }
  if (status === REQUEST_STATUS.Paid) {
    return { kind: "known", label: "Paid", tone: "success" };
  }
  if (status === REQUEST_STATUS.Revoked) {
    return { kind: "known", label: "Revoked", tone: "muted" };
  }
  const expired = expiresAtSeconds * 1000n < BigInt(Date.now());
  return expired
    ? { kind: "known", label: "Expired", tone: "muted" }
    : { kind: "known", label: "Open", tone: "info" };
}

function StatusChip({ state }: { state: RowState }) {
  if (state.kind === "checking") {
    return <span className={styles.chip}>Checking…</span>;
  }
  if (state.kind === "unknown") {
    return <span className={styles.chip}>Unknown</span>;
  }
  return (
    <span className={styles.chip} data-tone={state.tone}>
      <span className={styles.chipDot} aria-hidden="true" />
      {state.label}
    </span>
  );
}

/**
 * Recent activity — the four states: loading (skeleton matching ledger
 * geometry), empty (with CTA), error (labeled, retryable, saved records kept),
 * populated (rows with live contract status).
 */
function RecentActivity() {
  const publicClient = usePublicClient();
  // null = not yet hydrated (localStorage is client-only).
  const [requests, setRequests] = useState<StoredRequest[] | null>(null);

  useEffect(() => {
    setRequests(listStoredRequests().slice(0, RECENT_LIMIT));
  }, []);

  const ids = useMemo(
    () => (requests ?? []).map((r) => r.requestId),
    [requests]
  );

  const statusQuery = useQuery({
    queryKey: ["vajra", "home-request-status", ids.join(",")],
    enabled: !!publicClient && ids.length > 0,
    staleTime: 15_000,
    refetchInterval: 30_000,
    queryFn: async () => {
      const client = publicClient!;
      return Promise.all(ids.map((id: Hex) => readStatusOf(client, id)));
    },
  });

  if (requests === null) {
    return (
      <div
        className={styles.activityLoading}
        aria-busy="true"
        aria-label="Loading recent activity"
      >
        <Skeleton variant="text" width={140} label="Loading activity heading" />
        <Skeleton variant="row" label="Loading activity row" />
        <Skeleton variant="row" label="Loading activity row" />
        <Skeleton variant="row" label="Loading activity row" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>
          No requests yet — create your first.
        </p>
        <Link href="/request" className="btn btn--secondary">
          Create request
        </Link>
      </div>
    );
  }

  const freshness =
    statusQuery.dataUpdatedAt > 0
      ? `Updated ${timeFmt.format(new Date(statusQuery.dataUpdatedAt))}`
      : "Saved on this device";

  return (
    <div className={styles.activity}>
      {statusQuery.isError && (
        <Banner
          tone="warning"
          title="Live status unavailable"
          action={
            <Button
              variant="ghost"
              onClick={() => statusQuery.refetch()}
              loading={statusQuery.isRefetching}
              loadingText="Retrying"
            >
              Retry
            </Button>
          }
        >
          Showing your saved records; their onchain status could not be
          refreshed. Nothing here is a settlement claim.
        </Banner>
      )}
      <LedgerBlock title="Recent activity" freshness={freshness}>
        {requests.map((r, i) => {
          const state = rowState(
            statusQuery.data?.[i],
            statusQuery.isError,
            BigInt(r.request.expiresAt)
          );
          const payer = r.request.payer;
          const openPayer = payer.toLowerCase() === ZERO_ADDRESS;
          return (
            <LedgerRow
              key={r.requestId}
              label={dateFmt.format(new Date(r.createdAt))}
              value={
                <>
                  <span className={styles.rowAmount}>
                    {formatUnits(BigInt(r.request.amount), 18)} MON
                  </span>
                  <span className={openPayer ? styles.rowMeta : styles.rowMetaMono}>
                    {openPayer ? " · any payer" : ` · ${shortAddress(payer)}`}
                  </span>
                  {r.memo !== "" && (
                    <span className={styles.rowMeta}> · {r.memo}</span>
                  )}
                </>
              }
              aside={
                <>
                  <StatusChip state={state} />
                  <Link
                    href={`/receipt/${r.requestId}`}
                    className={styles.quietLink}
                  >
                    View
                  </Link>
                </>
              }
            />
          );
        })}
      </LedgerBlock>
    </div>
  );
}

export function HomeScreen() {
  return (
    <main className={styles.container}>
      <div className={styles.intro}>
        <h1 className={styles.title}>Payment requests</h1>
        <p className={styles.lede}>
          Create a one-time payment request. You sign the terms; the contract
          settles the exact amount onchain, once.
        </p>
        <div className={styles.ctaWrap}>
          <Link href="/request" className="btn btn--primary">
            Create request
          </Link>
        </div>
        <Readiness />
      </div>
      <RecentActivity />
    </main>
  );
}
