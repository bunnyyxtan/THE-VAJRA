"use client";

/**
 * /pay — the sender flow (Instrument grammar; the most important screen).
 *
 * Reads the share payload from the URL fragment (never sent to the server),
 * decodes it fail-closed via lib/vajra/decode, shows ALL signed terms without
 * requiring a wallet, verifies locally AND against the canonical contract
 * (statusOf + inspect), then walks the payer through connect → network
 * switch → re-inspect → simulate → exact-value fulfill → settlement tracking
 * via lib/finality. Success is claimed only on chain evidence (receipt +
 * PaymentFulfilled event + contract state + finality) — never on wallet
 * submission alone.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { zeroAddress, type Address, type Hex } from "viem";
import {
  useAccount,
  useChainId,
  useConnect,
  useSendTransaction,
  useSwitchChain,
} from "wagmi";

import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { LedgerBlock, LedgerRow } from "@/components/ui/Ledger";
import { Sheet } from "@/components/ui/Sheet";
import { Skeleton } from "@/components/ui/Skeleton";

import { formatUnits } from "@/lib/amount";
import { getChainConfig, MONAD_MAINNET_CHAIN_ID, explorerAddressUrl } from "@/lib/chain";
import { VAJRA_ABI } from "@/lib/contracts/abi";
import {
  buildFulfillTx,
  inspectRequest,
  readStatusOf,
  vajraAddress,
} from "@/lib/contracts";
import { classifyError, userCopy, VajraError, type ErrorCode } from "@/lib/errors";
import { recordSubmittedTransaction } from "@/lib/activity";
import {
  watchSettlement,
  type SettlementSnapshot,
} from "@/lib/finality";
import { decodePayload, type DecodedPayload } from "@/lib/vajra/decode";
import { computeRequestId, paymentRequestTypedData } from "@/lib/vajra/hash";
import { vajraCodeFromRequestId } from "@/lib/vajra/fingerprint";
import {
  AUTH_MODE,
  REQUEST_STATUS,
  VALIDATION_CODE,
  type ValidationCode,
  type Bytes32,
} from "@/lib/vajra/types";

import { StageRail } from "../StageRail";
import { getVajraPublicClient } from "../public-client";

const chainConfig = getChainConfig();
const MON_DECIMALS = 18;

const PAY_STAGES = [
  "Preparing transaction",
  "Awaiting wallet approval",
  "Transaction submitted",
  "Confirming on Monad",
  "Settled",
  "Receipt sealed",
] as const;

/* -------------------------------------------------------------------------- */
/* State types                                                                 */
/* -------------------------------------------------------------------------- */

type DecodeState =
  | { kind: "reading" }
  | { kind: "invalid"; title: string; why: string; next: string }
  | {
      kind: "ready";
      decoded: DecodedPayload;
      requestId: Bytes32;
      vajraCode: string;
    };

type CheckState =
  | { kind: "checking" }
  | { kind: "failed"; message: string }
  | { kind: "done"; status: number; code: ValidationCode; at: number };

type LocalSig = "pending" | "ok" | "failed" | "skipped" | "unavailable";

type DerivedState =
  | { kind: "checking" }
  | { kind: "unavailable"; message: string }
  | { kind: "already_paid" }
  | { kind: "revoked" }
  | { kind: "expired" }
  | { kind: "invalid_auth"; code: ErrorCode }
  | { kind: "wrong_payer"; expected: Address }
  | { kind: "payable" };

type PayExec =
  | { kind: "idle" }
  | { kind: "preparing" }
  | { kind: "awaiting_wallet" }
  | { kind: "tracking"; txHash: Hex; snapshot: SettlementSnapshot | null }
  | { kind: "settled"; txHash: Hex }
  | { kind: "failed"; error: VajraError; txHash?: Hex };

/** Contract validation code → application error code (mirrors lib/errors). */
function validationToErrorCode(code: ValidationCode): ErrorCode {
  switch (code) {
    case VALIDATION_CODE.Expired:
      return "REQUEST_EXPIRED";
    case VALIDATION_CODE.AlreadyPaid:
      return "REQUEST_ALREADY_PAID";
    case VALIDATION_CODE.Revoked:
      return "REQUEST_REVOKED";
    case VALIDATION_CODE.WrongPayer:
      return "WRONG_PAYER";
    case VALIDATION_CODE.InactivePasskey:
      return "INACTIVE_PASSKEY";
    case VALIDATION_CODE.WrongPasskeyVersion:
      return "WRONG_PASSKEY_VERSION";
    case VALIDATION_CODE.InvalidWalletSignature:
      return "INVALID_WALLET_SIGNATURE";
    case VALIDATION_CODE.InvalidPasskeyProof:
      return "INVALID_PASSKEY_PROOF";
    default:
      return "PAYLOAD_INVALID";
  }
}

const dateTimeFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});
const timeFormat = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function relativeFromNow(expiresAt: bigint, nowSeconds: number): string {
  const deltaSeconds = Number(expiresAt) - nowSeconds;
  if (deltaSeconds <= 0) return "expired";
  const minutes = Math.round(deltaSeconds / 60);
  if (minutes < 60) return `in ${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `in ${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round(hours / 24);
  return `in ${days} day${days === 1 ? "" : "s"}`;
}

/* -------------------------------------------------------------------------- */
/* Icons (status is always icon + text, never color alone)                     */
/* -------------------------------------------------------------------------- */

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7.4v3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="5.2" r="0.9" fill="currentColor" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1.8L15 14H1L8 1.8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 6.4v3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="11.6" r="0.9" fill="currentColor" />
    </svg>
  );
}

function BlockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.9 4.9l6.2 6.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5.2 8.2l2 1.9 3.7-4.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ErrorGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 3.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="6" cy="8.6" r="0.9" fill="currentColor" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* PayFlow                                                                     */
/* -------------------------------------------------------------------------- */

export function PayFlow() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const client = useMemo(() => getVajraPublicClient(chainConfig), []);

  // Wallet state
  const { address, isConnected } = useAccount();
  const walletChainId = useChainId();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const { sendTransactionAsync } = useSendTransaction();

  const [decodeState, setDecodeState] = useState<DecodeState>({ kind: "reading" });
  const [checkState, setCheckState] = useState<CheckState>({ kind: "checking" });
  const [checkSoftError, setCheckSoftError] = useState<string | null>(null);
  const [localSig, setLocalSig] = useState<LocalSig>("pending");
  const [exec, setExec] = useState<PayExec>({ kind: "idle" });
  const [walletSheetOpen, setWalletSheetOpen] = useState(false);
  const [nowSeconds, setNowSeconds] = useState(() => Math.floor(Date.now() / 1000));

  const payLockRef = useRef(false);
  const ready = decodeState.kind === "ready" ? decodeState : null;

  /* Keep the expiry countdown honest. */
  useEffect(() => {
    const timer = window.setInterval(() => setNowSeconds(Math.floor(Date.now() / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  /* ------------------------------------------------------------------ */
  /* 1. Decode the fragment — fail closed, terminal on invalid input     */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const fragment = window.location.hash;
    if (!fragment || fragment === "#") {
      setDecodeState({
        kind: "invalid",
        title: "This link has no payment data",
        why: "A Vajra payment link carries the signed request inside the part of the URL after “#”. This link has nothing there — it may have been truncated when it was copied.",
        next: "Ask the recipient to send the complete payment link again, in full.",
      });
      return;
    }
    try {
      const decoded = decodePayload(fragment, {
        chainId: chainConfig.chainId,
        verifyingContract: chainConfig.contractAddress,
      });
      const requestId = computeRequestId(decoded.request);
      setDecodeState({
        kind: "ready",
        decoded,
        requestId,
        vajraCode: vajraCodeFromRequestId(requestId),
      });
    } catch (err) {
      const classified = classifyError(err);
      const copy = userCopy(classified.code);
      setDecodeState({
        kind: "invalid",
        title: copy.title,
        why: `${copy.whatHappened} ${classified.message ? `(${classified.message.slice(0, 200)})` : ""}`,
        next: copy.retrySafe,
      });
    }
  }, []);

  /* ------------------------------------------------------------------ */
  /* 2. Local signature verification (wallet-auth requests)              */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!ready) return;
    const { request, proof } = ready.decoded;
    if (request.authMode !== AUTH_MODE.Wallet) {
      setLocalSig("skipped");
      return;
    }
    let cancelled = false;
    setLocalSig("pending");
    const typedData = paymentRequestTypedData(request);
    client
      .verifyTypedData({
        address: request.recipient,
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: typedData.message,
        signature: proof.signature,
      })
      .then((ok) => {
        if (!cancelled) setLocalSig(ok ? "ok" : "failed");
      })
      .catch(() => {
        // Local verification needs the chain for contract (ERC-1271)
        // recipients; the onchain inspect check below is authoritative.
        if (!cancelled) setLocalSig("unavailable");
      });
    return () => {
      cancelled = true;
    };
  }, [ready, client]);

  /* ------------------------------------------------------------------ */
  /* 3. Onchain checks: statusOf + inspect (authoritative)               */
  /* ------------------------------------------------------------------ */
  const runChecks = useCallback(
    async (prospectivePayer: Address, soft = false) => {
      if (!ready) return;
      if (!soft) setCheckState({ kind: "checking" });
      try {
        const [status, inspectRes] = await Promise.all([
          readStatusOf(client, ready.requestId, chainConfig),
          inspectRequest(client, ready.decoded.request, ready.decoded.proof, prospectivePayer, chainConfig),
        ]);
        setCheckState({ kind: "done", status, code: inspectRes.code, at: Date.now() });
        setCheckSoftError(null);
      } catch (err) {
        const classified = classifyError(err);
        const message =
          classified.code === "RPC_UNAVAILABLE"
            ? "The Monad RPC endpoint did not answer."
            : classified.message.slice(0, 160);
        setCheckState((prev) => {
          if (prev.kind === "done") {
            // Keep stale evidence visible; the note labels it.
            setCheckSoftError(message);
            return prev;
          }
          return { kind: "failed", message };
        });
      }
    },
    [ready, client],
  );

  /* Payer used for inspection: the connected wallet when present, otherwise
     the restricted payer (so open/preflight checks don't flag WrongPayer). */
  const payerForInspect: Address = useMemo(() => {
    if (!ready) return zeroAddress;
    if (address) return address;
    const restricted = ready.decoded.request.payer;
    return restricted === zeroAddress ? zeroAddress : restricted;
  }, [ready, address]);

  useEffect(() => {
    void runChecks(payerForInspect);
  }, [runChecks, payerForInspect]);

  /* Re-check periodically while the request is payable, so expiry and
     revocation land without a refresh. */
  const derived = useMemo<DerivedState>(() => {
    if (!ready) return { kind: "checking" };
    if (checkState.kind === "checking") return { kind: "checking" };
    if (checkState.kind === "failed") return { kind: "unavailable", message: checkState.message };

    const { request } = ready.decoded;
    if (checkState.status === REQUEST_STATUS.Paid || checkState.code === VALIDATION_CODE.AlreadyPaid)
      return { kind: "already_paid" };
    if (checkState.status === REQUEST_STATUS.Revoked || checkState.code === VALIDATION_CODE.Revoked)
      return { kind: "revoked" };
    if (nowSeconds > Number(request.expiresAt) || checkState.code === VALIDATION_CODE.Expired)
      return { kind: "expired" };
    if (
      checkState.code === VALIDATION_CODE.InvalidWalletSignature ||
      checkState.code === VALIDATION_CODE.InvalidPasskeyProof ||
      checkState.code === VALIDATION_CODE.InactivePasskey ||
      checkState.code === VALIDATION_CODE.WrongPasskeyVersion
    )
      return { kind: "invalid_auth", code: validationToErrorCode(checkState.code) };
    if (localSig === "failed") return { kind: "invalid_auth", code: "INVALID_WALLET_SIGNATURE" };
    if (
      address &&
      request.payer !== zeroAddress &&
      address.toLowerCase() !== request.payer.toLowerCase()
    )
      return { kind: "wrong_payer", expected: request.payer };
    if (checkState.code === VALIDATION_CODE.WrongPayer)
      return { kind: "wrong_payer", expected: request.payer };
    if (checkState.code === VALIDATION_CODE.Valid) return { kind: "payable" };
    return { kind: "invalid_auth", code: validationToErrorCode(checkState.code) };
  }, [ready, checkState, localSig, address, nowSeconds]);

  const payable = derived.kind === "payable";
  useEffect(() => {
    if (!payable) return;
    const timer = window.setInterval(() => void runChecks(payerForInspect, true), 20000);
    return () => window.clearInterval(timer);
  }, [payable, runChecks, payerForInspect]);

  /* ------------------------------------------------------------------ */
  /* 4. Payment execution — simulate → send exact value → track          */
  /* ------------------------------------------------------------------ */
  const stepRef = useRef<"preparing" | "wallet">("preparing");

  async function onPay() {
    if (!ready || !address) return;
    if (payLockRef.current) return; // duplicate-click lockout
    payLockRef.current = true;

    const { request, proof } = ready.decoded;
    try {
      // Pre-flight simulation against the live contract — a revert here means
      // the payment would fail onchain, so nothing is sent.
      stepRef.current = "preparing";
      setExec({ kind: "preparing" });
      await client.simulateContract({
        address: vajraAddress(chainConfig),
        abi: VAJRA_ABI,
        functionName: "fulfill",
        args: [request, proof],
        value: request.amount,
        account: address,
      });

      // Wallet approval — the clock belongs to the wallet now.
      stepRef.current = "wallet";
      setExec({ kind: "awaiting_wallet" });
      const tx = buildFulfillTx(request, proof, chainConfig);
      const txHash = await sendTransactionAsync({
        to: tx.to,
        data: tx.data,
        value: tx.value,
        chainId: MONAD_MAINNET_CHAIN_ID,
      });

      // Submitted — nothing more than that. Persist the hash so verification
      // survives refresh, then track to settlement.
      recordSubmittedTransaction({
        txHash,
        kind: "fulfill",
        requestId: ready.requestId,
        chainId: chainConfig.chainId,
      });
      setExec({ kind: "tracking", txHash, snapshot: null });
    } catch (err) {
      const classified = classifyError(err, { simulation: stepRef.current === "preparing" });
      setExec({ kind: "failed", error: classified });
    } finally {
      payLockRef.current = false;
    }
  }

  /* Settlement tracking — receipt + event + state + finality, polled. */
  useEffect(() => {
    if (exec.kind !== "tracking" || !ready) return;
    const stop = watchSettlement(
      client,
      { txHash: exec.txHash, requestId: ready.requestId },
      (snapshot) => {
        setExec((prev) => {
          if (prev.kind !== "tracking" || prev.txHash !== exec.txHash) return prev;
          if (snapshot.phase === "final") return { kind: "settled", txHash: exec.txHash };
          if (snapshot.phase === "reverted") {
            return {
              kind: "failed",
              error: new VajraError(
                "TX_REVERTED",
                snapshot.reason ?? "The transaction reverted onchain.",
              ),
              txHash: exec.txHash,
            };
          }
          return { ...prev, snapshot };
        });
      },
    );
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exec.kind, exec.kind === "tracking" ? exec.txHash : null, ready, client]);

  /* ------------------------------------------------------------------ */
  /* Derived wallet UI state                                             */
  /* ------------------------------------------------------------------ */
  const wrongChain = mounted && isConnected && walletChainId !== MONAD_MAINNET_CHAIN_ID;
  const busy = exec.kind === "preparing" || exec.kind === "awaiting_wallet";

  function connectWallet() {
    if (connectors.length > 1) setWalletSheetOpen(true);
    else if (connectors[0]) connect({ connector: connectors[0] });
  }

  async function onSwitchNetwork() {
    try {
      await switchChainAsync({ chainId: MONAD_MAINNET_CHAIN_ID });
    } catch {
      // Rejection lands back on the same screen; the banner stays visible.
    }
  }

  /* Stage rail mapping for the payment execution. */
  const stageRail = useMemo(() => {
    if (exec.kind === "idle")
      return { reached: 0, waiting: false, failed: false, visible: false };
    if (exec.kind === "preparing")
      return { reached: 0, waiting: true, failed: false, visible: true };
    if (exec.kind === "awaiting_wallet")
      return { reached: 1, waiting: true, failed: false, visible: true };
    if (exec.kind === "tracking") {
      const phase = exec.snapshot?.phase;
      if (phase === "included") return { reached: 3, waiting: true, failed: false, visible: true };
      return { reached: 3, waiting: true, failed: false, visible: true };
    }
    if (exec.kind === "settled")
      return { reached: 5, waiting: false, failed: false, visible: true };
    // failed: stop the rail at the stage whose clock was running
    if (exec.txHash) return { reached: 4, waiting: false, failed: true, visible: true };
    return {
      reached: stepRef.current === "preparing" ? 0 : 1,
      waiting: false,
      failed: true,
      visible: true,
    };
  }, [exec]);

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */

  if (decodeState.kind === "reading") {
    return (
      <div className="vscreen">
        <div className="vscreen__page vscreen__page--narrow">
          <div className="vscreen__head">
            <h1 className="vscreen__title">Payment request</h1>
            <p className="vscreen__sub">Reading the signed terms from this link…</p>
          </div>
          <section aria-busy="true" aria-label="Loading payment terms">
            <Skeleton variant="block" height={96} label="Loading amount" />
            <div style={{ height: 16 }} />
            <Skeleton variant="row" label="Loading terms row 1" />
            <Skeleton variant="row" label="Loading terms row 2" />
            <Skeleton variant="row" label="Loading terms row 3" />
          </section>
        </div>
      </div>
    );
  }

  if (decodeState.kind === "invalid") {
    return (
      <div className="vscreen">
        <div className="vscreen__page vscreen__page--narrow">
          <div className="vscreen__head">
            <h1 className="vscreen__title">Payment request</h1>
          </div>
          <div className="status-callout status-callout--danger" role="alert">
            <BlockIcon />
            <div>
              <span className="status-callout__title">{decodeState.title}</span>
              <p style={{ margin: 0 }}>{decodeState.why}</p>
            </div>
          </div>
          <div className="vscreen__section">
            <h2 className="vscreen__section-title">What to do next</h2>
            <p className="sc-note">
              <InfoIcon />
              <span>{decodeState.next}</span>
            </p>
            <p className="sc-note">
              <InfoIcon />
              <span>
                Before paying any link, compare the Vajra Code and the full recipient
                address with the recipient through a separate channel. No funds moved —
                nothing was submitted.
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { request, memo } = ready.decoded;
  const amountMon = formatUnits(request.amount, MON_DECIMALS);
  const restricted = request.payer !== zeroAddress;
  const checkedAt = checkState.kind === "done" ? checkState.at : null;
  const showMainnetBanner =
    payable && (exec.kind === "idle" || exec.kind === "preparing" || exec.kind === "awaiting_wallet");

  return (
    <div className="vscreen">
      <div className="vscreen__page">
        <div className="vscreen__head">
          <h1 className="vscreen__title">Payment request</h1>
          <p className="vscreen__sub">
            Signed by the recipient. Verify the terms before you pay — they are readable
            without connecting a wallet.
          </p>
          {checkedAt !== null && (
            <p className="vscreen__freshness">
              Verified against Monad Mainnet at {timeFormat.format(new Date(checkedAt))}
            </p>
          )}
        </div>

        {/* Real-money banner — always visible before the payment is submitted */}
        {showMainnetBanner && (
          <Banner tone="warning" title="Monad Mainnet — Real MON will move">
            Paying sends {amountMon} MON from your wallet to the recipient on Monad
            Mainnet. This cannot be undone.
          </Banner>
        )}

        {wrongChain && payable && (
          <Banner
            tone="warning"
            title="Wrong network"
            action={
              <Button
                variant="secondary"
                loading={isSwitching}
                loadingText="Switching"
                onClick={() => void onSwitchNetwork()}
              >
                Switch to Monad Mainnet
              </Button>
            }
          >
            Your wallet is connected to a different network. Switch to Monad Mainnet
            (chain ID {MONAD_MAINNET_CHAIN_ID}) to pay this request.
          </Banner>
        )}

        <div className="instrument-grid">
          <div className="instrument-grid__main">
            {/* Amount hero — the one dominant value */}
            <div className="amount-hero">
              <span className="amount-hero__label">Amount due</span>
              <p className="amount-hero__value">
                {amountMon}
                <span className="amount-hero__unit">MON</span>
              </p>
              <span className="amount-hero__wei">{request.amount.toString()} wei</span>
            </div>

            <div className="vajra-code">
              <span className="vajra-code__label">Vajra Code</span>
              <span className="vajra-code__value">{ready.vajraCode}</span>
              <CopyButton text={ready.vajraCode} label="Copy" />
            </div>
            <p className="sc-note">
              <InfoIcon />
              <span>
                Confirm this code and the full recipient address with the recipient through
                a separate channel before paying.
              </span>
            </p>

            {/* Request state — one honest status, icon + text */}
            {derived.kind === "checking" && (
              <p className="sc-note" role="status">
                <InfoIcon />
                <span>Checking this request against the Vajra contract on Monad Mainnet…</span>
              </p>
            )}
            {derived.kind === "unavailable" && (
              <div className="status-callout status-callout--warning" role="alert">
                <WarningIcon />
                <div>
                  <span className="status-callout__title">Cannot confirm the request state</span>
                  <p style={{ margin: 0 }}>
                    {derived.message} The signed terms below come from the link itself; the
                    onchain state could not be read. No payment is possible until this
                    check succeeds.
                  </p>
                  <p style={{ margin: "8px 0 0" }}>
                    <Button variant="secondary" onClick={() => void runChecks(payerForInspect)}>
                      Retry verification
                    </Button>
                  </p>
                </div>
              </div>
            )}
            {checkSoftError && derived.kind !== "unavailable" && (
              <p className="sc-note sc-note--warning">
                <WarningIcon />
                <span>
                  A refresh of the onchain state failed ({checkSoftError}). The status shown
                  is from the earlier successful read.
                </span>
              </p>
            )}
            {derived.kind === "already_paid" && (
              <div className="status-callout status-callout--success">
                <CheckIcon />
                <div>
                  <span className="status-callout__title">This request is already paid</span>
                  <p style={{ margin: 0 }}>
                    The contract shows this request as settled. Each Vajra request can be
                    paid exactly once — do not send another payment.
                  </p>
                  <p style={{ margin: "8px 0 0" }}>
                    <Button
                      variant="secondary"
                      onClick={() => router.push(`/receipt/${ready.requestId}`)}
                    >
                      View the settlement receipt
                    </Button>
                  </p>
                </div>
              </div>
            )}
            {derived.kind === "revoked" && (
              <div className="status-callout status-callout--warning">
                <BlockIcon />
                <div>
                  <span className="status-callout__title">This request was revoked</span>
                  <p style={{ margin: 0 }}>
                    The recipient revoked this request before it was paid. It can no longer
                    be fulfilled. No funds moved — ask the recipient for a new request if
                    payment is still intended.
                  </p>
                </div>
              </div>
            )}
            {derived.kind === "expired" && (
              <div className="status-callout status-callout--warning">
                <WarningIcon />
                <div>
                  <span className="status-callout__title">This request has expired</span>
                  <p style={{ margin: 0 }}>
                    The expiry time signed into this request has passed. Expired requests
                    can never transfer MON. Ask the recipient to create a fresh request.
                  </p>
                </div>
              </div>
            )}
            {derived.kind === "invalid_auth" && (
              <div className="status-callout status-callout--danger" role="alert">
                <BlockIcon />
                <div>
                  <span className="status-callout__title">
                    {userCopy(derived.code).title}
                  </span>
                  <p style={{ margin: 0 }}>{userCopy(derived.code).whatHappened}</p>
                  <p style={{ margin: "6px 0 0" }}>
                    {userCopy(derived.code).retrySafe} {userCopy(derived.code).howToVerify}
                  </p>
                </div>
              </div>
            )}
            {derived.kind === "wrong_payer" && (
              <div className="status-callout status-callout--warning">
                <WarningIcon />
                <div>
                  <span className="status-callout__title">
                    This request is addressed to another wallet
                  </span>
                  <p style={{ margin: 0 }}>
                    The recipient restricted this request to{" "}
                    <span className="sc-mono sc-break">{derived.expected}</span>. The
                    connected wallet cannot pay it. Connect that wallet, or ask the
                    recipient for an open request. No funds moved.
                  </p>
                </div>
              </div>
            )}
            {localSig === "ok" && payable && (
              <p className="sc-note">
                <CheckIcon />
                <span>
                  Recipient signature verified locally; the contract inspection agrees this
                  request is payable.
                </span>
              </p>
            )}

            {/* Execution: stage rail + settlement tracking */}
            {stageRail.visible && (
              <div className="vscreen__section" aria-live="polite">
                <StageRail
                  stages={PAY_STAGES}
                  reached={stageRail.reached}
                  waiting={stageRail.waiting}
                  failed={stageRail.failed}
                  ariaLabel="Payment progress"
                />
                {exec.kind === "tracking" && (
                  <>
                    <p className="sc-note" role="status">
                      <InfoIcon />
                      <span>
                        {exec.snapshot?.phase === "included"
                          ? "The transaction is included and verified against the contract; waiting for finality on Monad."
                          : exec.snapshot?.phase === "verification_delayed"
                            ? "Verification is delayed — one or more proof sources is temporarily unavailable. The transaction hash is preserved and checking continues. Do not submit a second payment."
                            : "Transaction submitted. Waiting for confirmation on Monad Mainnet."}
                      </span>
                    </p>
                    <LedgerBlock title="Transaction">
                      <LedgerRow
                        label="Hash"
                        value={<span className="sc-break">{exec.txHash}</span>}
                        mono
                        aside={<CopyButton text={exec.txHash} />}
                      />
                    </LedgerBlock>
                    <p className="sc-note">
                      <InfoIcon />
                      <span>
                        You can leave this page — the hash is stored on this device and the
                        receipt at /receipt/{ready.requestId.slice(0, 10)}… updates from
                        chain state.
                      </span>
                    </p>
                  </>
                )}
                {exec.kind === "settled" && (
                  <div className="status-callout status-callout--success" role="status">
                    <CheckIcon />
                    <div>
                      <span className="status-callout__title">
                        Settled on Monad Mainnet — receipt sealed
                      </span>
                      <p style={{ margin: 0 }}>
                        The settlement is verified against the transaction receipt, the
                        PaymentFulfilled event, and the contract state.
                      </p>
                      <p style={{ margin: "8px 0 0" }}>
                        <Button onClick={() => router.push(`/receipt/${ready.requestId}`)}>
                          View sealed receipt
                        </Button>
                      </p>
                    </div>
                  </div>
                )}
                {exec.kind === "failed" && (
                  <div className="flow-error" role="alert">
                    <ErrorGlyph />
                    <span>
                      <span className="flow-error__title">
                        {userCopy(exec.error.code).title}.{" "}
                      </span>
                      {exec.error.code === "WALLET_REJECTED"
                        ? "No transaction was sent. Nothing was signed. You can retry safely."
                        : `${userCopy(exec.error.code).whatHappened} ${userCopy(exec.error.code).fundsMoved} ${userCopy(exec.error.code).retrySafe}`}
                      {exec.txHash ? (
                        <>
                          {" "}
                          Transaction hash:{" "}
                          <span className="sc-mono sc-break">{exec.txHash}</span>
                        </>
                      ) : null}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Full signed terms — Ledger grammar */}
            <div className="vscreen__section">
              <h2 className="vscreen__section-title">Signed terms</h2>
              <LedgerBlock title="Request terms">
                <LedgerRow
                  label="Recipient"
                  value={<span className="sc-break">{request.recipient}</span>}
                  mono
                  aside={<CopyButton text={request.recipient} />}
                />
                <LedgerRow
                  label="Payer"
                  value={
                    restricted ? (
                      <span className="sc-break">{request.payer}</span>
                    ) : (
                      "Open request — any payer"
                    )
                  }
                  mono={restricted}
                  aside={restricted ? <CopyButton text={request.payer} /> : undefined}
                />
                <LedgerRow
                  label="Amount"
                  value={
                    <>
                      <span className="sc-tnum">{amountMon} MON</span>{" "}
                      <span className="sc-mono" style={{ color: "var(--v-muted)" }}>
                        {request.amount.toString()} wei
                      </span>
                    </>
                  }
                />
                <LedgerRow
                  label="Expires"
                  value={
                    <span className="sc-tnum">
                      {dateTimeFormat.format(new Date(Number(request.expiresAt) * 1000))}{" "}
                      <span style={{ color: "var(--v-muted)" }}>
                        ({relativeFromNow(request.expiresAt, nowSeconds)})
                      </span>
                    </span>
                  }
                />
                <LedgerRow label="Memo" value={memo.trim() === "" ? "None" : memo} />
                <LedgerRow
                  label="Authorization"
                  value={
                    request.authMode === AUTH_MODE.Wallet
                      ? "Recipient wallet signature (EIP-712)"
                      : `Recipient passkey (P-256, version ${request.authVersion})`
                  }
                />
                <LedgerRow
                  label="Request ID"
                  value={<span className="sc-break">{ready.requestId}</span>}
                  mono
                  aside={<CopyButton text={ready.requestId} />}
                />
                <LedgerRow
                  label="Chain"
                  value={`Monad Mainnet · chain ID ${MONAD_MAINNET_CHAIN_ID}`}
                />
                <LedgerRow
                  label="Contract"
                  value={<span className="sc-break">{chainConfig.contractAddress}</span>}
                  mono
                  aside={
                    <>
                      <CopyButton text={chainConfig.contractAddress} />
                      <a
                        href={explorerAddressUrl(chainConfig.contractAddress, chainConfig)}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: "var(--sc-type-compact)", fontWeight: 600 }}
                      >
                        Monadscan
                      </a>
                    </>
                  }
                />
              </LedgerBlock>
            </div>
          </div>

          {/* Context column — environment + payment status */}
          <aside className="instrument-grid__aside" aria-label="Payment environment">
            <div className="instrument-grid__aside-block">
              <LedgerBlock title="Environment">
                <LedgerRow
                  label="Chain"
                  value={`Monad Mainnet · chain ID ${MONAD_MAINNET_CHAIN_ID}`}
                />
                <LedgerRow
                  label="Contract"
                  value={<span className="sc-break">{chainConfig.contractAddress}</span>}
                  mono
                  aside={<CopyButton text={chainConfig.contractAddress} />}
                />
                <LedgerRow
                  label="Exact value"
                  value="The contract requires msg.value to equal the signed amount exactly"
                />
              </LedgerBlock>
            </div>
            <div className="instrument-grid__aside-block">
              <div className="wallet-row">
                <span className="wallet-row__status">
                  <span
                    className={`wallet-row__dot${mounted && isConnected ? " wallet-row__dot--connected" : ""}`}
                    aria-hidden="true"
                  />
                  {mounted && isConnected && address ? (
                    <>
                      Paying wallet
                      <span className="wallet-row__address">{address}</span>
                    </>
                  ) : (
                    "No wallet connected"
                  )}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Primary action — fixed in the thumb zone on mobile */}
      {(payable || derived.kind === "already_paid") && exec.kind !== "tracking" && exec.kind !== "settled" && (
        <div className="actionbar">
          <div className="actionbar__inner">
            {payable && !isConnected && (
              <Button
                className="actionbar__primary"
                loading={isConnecting}
                loadingText="Connecting"
                onClick={connectWallet}
              >
                Connect wallet to pay
              </Button>
            )}
            {payable && isConnected && wrongChain && (
              <Button
                className="actionbar__primary"
                loading={isSwitching}
                loadingText="Switching"
                onClick={() => void onSwitchNetwork()}
              >
                Switch to Monad Mainnet
              </Button>
            )}
            {payable && isConnected && !wrongChain && (
              <Button
                className="actionbar__primary"
                loading={busy}
                loadingText={
                  exec.kind === "preparing" ? "Preparing transaction" : "Awaiting wallet approval"
                }
                disabled={busy}
                onClick={onPay}
              >
                Pay {amountMon} MON
              </Button>
            )}
            {derived.kind === "already_paid" && (
              <Button
                className="actionbar__primary"
                variant="secondary"
                onClick={() => router.push(`/receipt/${ready.requestId}`)}
              >
                View settlement receipt
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Wallet picker — bottom sheet when more than one wallet is available */}
      <Sheet open={walletSheetOpen} onClose={() => setWalletSheetOpen(false)} title="Connect a wallet">
        <div className="wallet-sheet">
          {connectors.map((connector) => (
            <Button
              key={connector.uid}
              variant="secondary"
              onClick={() => {
                connect({ connector });
                setWalletSheetOpen(false);
              }}
            >
              {connector.name}
            </Button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
