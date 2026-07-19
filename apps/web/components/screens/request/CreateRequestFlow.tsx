"use client";

/**
 * /request — create a payment request (Instrument grammar).
 *
 * Flow: amount hero instrument → expiry presets + memo + optional payer →
 * review (LedgerBlock of full terms) → EIP-712 signature via wagmi →
 * share link + QR. The signed terms are encoded into the URL fragment; the
 * request is persisted locally via lib/activity. Nothing is claimed before
 * the wallet actually signs.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { getAddress, isAddress, toHex, type Address } from "viem";
import { useAccount, useChainId, useConnect, useSignTypedData, useSwitchChain } from "wagmi";

import { AmountInput } from "@/components/ui/AmountInput";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { Input } from "@/components/ui/Input";
import { LedgerBlock, LedgerRow } from "@/components/ui/Ledger";
import { ProofChain, PROOF_CHAIN_STAGES, type ProofStage } from "@/components/ui/ProofChain";
import { Sheet } from "@/components/ui/Sheet";

import { parseDecimalToUnits, formatUnits } from "@/lib/amount";
import { getChainConfig, MONAD_MAINNET_CHAIN_ID } from "@/lib/chain";
import { classifyError, userCopy } from "@/lib/errors";
import { recordCreatedRequest } from "@/lib/activity";
import {
  ANY_PAYER,
  MAX_MEMO_BYTES,
  MAX_LIFETIME_SECONDS,
  MIN_LIFETIME_SECONDS,
  buildPaymentRequest,
  memoUtf8Bytes,
} from "@/lib/vajra/domain";
import { computeRequestId, paymentRequestTypedData } from "@/lib/vajra/hash";
import { encodePayload, walletShareProof } from "@/lib/vajra/encode";
import { vajraCodeFromRequestId } from "@/lib/vajra/fingerprint";
import { AUTH_MODE, type Bytes32, type PaymentRequest } from "@/lib/vajra/types";

import { StageRail } from "../StageRail";
import { QrCode } from "../QrCode";
import { ExpiryField, EXPIRY_PRESET_SECONDS, type ExpiryPreset } from "./ExpiryField";
import { MemoField } from "./MemoField";

const chainConfig = getChainConfig();
const MON_DECIMALS = 18;
const MIN_LIFETIME_MS = Number(MIN_LIFETIME_SECONDS) * 1000;
const MAX_LIFETIME_MS = Number(MAX_LIFETIME_SECONDS) * 1000;

const REQUEST_STAGES = [
  "Preparing terms",
  "Awaiting signature",
  "Signing",
  "Request created",
  "Link ready",
] as const;

type Step = "form" | "review" | "success";

interface FieldErrors {
  amount?: string;
  expiry?: string;
  memo?: string;
  payer?: string;
  wallet?: string;
}

interface SignedDraft {
  request: PaymentRequest;
  memo: string;
  requestId: Bytes32;
  vajraCode: string;
}

const dateTimeFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

/** "in 24 hours" / "in 3 days" / "in 12 minutes" — coarse, human, honest. */
function relativeFromNow(expiresAt: bigint): string {
  const deltaSeconds = Number(expiresAt) - Math.floor(Date.now() / 1000);
  if (deltaSeconds <= 0) return "expired";
  const minutes = Math.round(deltaSeconds / 60);
  if (minutes < 60) return `in ${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `in ${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round(hours / 24);
  return `in ${days} day${days === 1 ? "" : "s"}`;
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

export function CreateRequestFlow() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Wallet state
  const { address, isConnected } = useAccount();
  const walletChainId = useChainId();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { signTypedDataAsync } = useSignTypedData();

  // Form state
  const [step, setStep] = useState<Step>("form");
  const [amount, setAmount] = useState("");
  const [preset, setPreset] = useState<ExpiryPreset>("24h");
  const [customExpiry, setCustomExpiry] = useState("");
  const [memo, setMemo] = useState("");
  const [payer, setPayer] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [walletSheetOpen, setWalletSheetOpen] = useState(false);

  // Signing / result state
  const [draft, setDraft] = useState<SignedDraft | null>(null);
  const [stageReached, setStageReached] = useState(0);
  const [stageWaiting, setStageWaiting] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);

  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const wrongChain = mounted && isConnected && walletChainId !== MONAD_MAINNET_CHAIN_ID;

  // --- Proof chain status (7-stage motif; the first three belong here)
  const proofStages: ProofStage[] = useMemo(() => {
    const signed = draft !== null && (stageReached >= 2 || step === "success");
    const shared = step === "success";
    return PROOF_CHAIN_STAGES.map((label, i) => {
      let status: ProofStage["status"] = "upcoming";
      if (i === 0) status = draft ? "complete" : "current";
      else if (i === 1) status = signed ? "complete" : draft ? "current" : "upcoming";
      else if (i === 2) status = shared ? "complete" : signed ? "current" : "upcoming";
      return { label, status };
    });
  }, [draft, stageReached, step]);

  function connectWallet() {
    if (connectors.length > 1) {
      setWalletSheetOpen(true);
    } else if (connectors[0]) {
      connect({ connector: connectors[0] });
    }
  }

  // --- Per-field validation, surfaced inline on "Review terms"
  function validate(): FieldErrors {
    const next: FieldErrors = {};

    const units = parseDecimalToUnits(amount, MON_DECIMALS);
    if (amount.trim() === "") next.amount = "Enter an amount.";
    else if (units === null) next.amount = "Enter a valid amount.";
    else if (units <= 0n) next.amount = "Amount must be greater than zero.";

    if (preset === "custom") {
      if (customExpiry.trim() === "") {
        next.expiry = "Pick an expiry date and time.";
      } else {
        const epochMs = new Date(customExpiry).getTime();
        if (Number.isNaN(epochMs)) {
          next.expiry = "Enter a valid date and time.";
        } else {
          const delta = epochMs - Date.now();
          if (delta < MIN_LIFETIME_MS)
            next.expiry = "Expiry must be at least 60 seconds from now.";
          else if (delta > MAX_LIFETIME_MS)
            next.expiry = "Expiry cannot be more than 30 days from now.";
        }
      }
    }

    if (memoUtf8Bytes(memo).length > MAX_MEMO_BYTES) {
      const over = memoUtf8Bytes(memo).length - MAX_MEMO_BYTES;
      next.memo = `Memo is over the ${MAX_MEMO_BYTES}-byte protocol limit. Shorten it by ${over} byte${over === 1 ? "" : "s"}.`;
    }

    const payerTrimmed = payer.trim();
    if (payerTrimmed !== "" && !isAddress(payerTrimmed, { strict: false }))
      next.payer = "Enter a valid 0x address, or leave it empty for an open request.";

    if (!isConnected || !address)
      next.wallet = "Connect the wallet that will receive this payment.";

    return next;
  }

  function onReviewTerms() {
    setSignError(null);
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const units = parseDecimalToUnits(amount, MON_DECIMALS);
    if (units === null || !address) return; // covered by validate()

    const nowSeconds = BigInt(Math.floor(Date.now() / 1000));
    const lifetimeSeconds =
      preset === "custom"
        ? BigInt(Math.floor(new Date(customExpiry).getTime() / 1000)) - nowSeconds
        : BigInt(EXPIRY_PRESET_SECONDS[preset]);

    const nonce = toHex(window.crypto.getRandomValues(new Uint8Array(32)));
    const payerTrimmed = payer.trim();

    const request = buildPaymentRequest({
      recipient: getAddress(address),
      payer: payerTrimmed === "" ? ANY_PAYER : getAddress(payerTrimmed as Address),
      amount: units,
      issuedAt: nowSeconds,
      expiresAt: nowSeconds + lifetimeSeconds,
      nonce,
      memo,
      authMode: AUTH_MODE.Wallet,
      authVersion: 0,
    });

    const requestId = computeRequestId(request);
    setDraft({
      request,
      memo,
      requestId,
      vajraCode: vajraCodeFromRequestId(requestId),
    });
    setStageReached(0);
    setStageWaiting(false);
    setStep("review");
  }

  async function onSign() {
    if (!draft) return;
    setSignError(null);

    // Stage 1: Preparing terms — build the exact EIP-712 payload to be signed.
    setStageReached(0);
    setStageWaiting(true);
    const typedData = paymentRequestTypedData(draft.request);

    // Stage 2: Awaiting signature — the clock belongs to the wallet now.
    setStageReached(1);
    try {
      const signature = await signTypedDataAsync(typedData);

      // Stages 3–4: signed, now seal the share payload and persist locally.
      setStageReached(3);
      const fragment = encodePayload({
        chainId: chainConfig.chainId,
        verifyingContract: chainConfig.contractAddress,
        request: draft.request,
        memo: draft.memo,
        proof: walletShareProof(signature),
      });
      recordCreatedRequest({
        requestId: draft.requestId,
        chainId: chainConfig.chainId,
        verifyingContract: chainConfig.contractAddress,
        request: draft.request,
        memo: draft.memo,
        payloadFragment: fragment,
      });

      // Stage 5: Link ready.
      setLink(`${window.location.origin}/pay#${fragment}`);
      setStageReached(4);
      setStageWaiting(false);
      setStep("success");
    } catch (err) {
      const classified = classifyError(err);
      setStageReached(0);
      setStageWaiting(false);
      if (classified.code === "WALLET_REJECTED") {
        setSignError(
          "No transaction was sent. Nothing was signed. You can retry safely.",
        );
      } else {
        const copy = userCopy(classified.code);
        setSignError(`${copy.title}. ${copy.whatHappened}`);
      }
    }
  }

  function onCreateAnother() {
    setStep("form");
    setDraft(null);
    setLink(null);
    setSignError(null);
    setStageReached(0);
    setStageWaiting(false);
    setAmount("");
    setMemo("");
    setPayer("");
    setPreset("24h");
    setCustomExpiry("");
    setErrors({});
  }

  const signing = stageWaiting;

  return (
    <div className="vscreen">
      <div className="vscreen__page">
        <div className="vscreen__head">
          <h1 className="vscreen__title">Create request</h1>
          <p className="vscreen__sub">Signed terms, exact amount, one payment.</p>
        </div>

        <div className="instrument-grid">
          {/* ------------------------------------------------ Instrument column */}
          <div className="instrument-grid__main">
            {wrongChain && (
              <Banner
                tone="warning"
                title="Wrong network"
                action={
                  <Button
                    variant="secondary"
                    loading={isSwitching}
                    loadingText="Switching"
                    onClick={() => switchChain({ chainId: MONAD_MAINNET_CHAIN_ID })}
                  >
                    Switch to Monad Mainnet
                  </Button>
                }
              >
                Your wallet is connected to a different network. Switch to Monad Mainnet
                (chain ID {MONAD_MAINNET_CHAIN_ID}) before signing.
              </Banner>
            )}

            <h2 ref={headingRef} tabIndex={-1} className="visually-hidden">
              {step === "form"
                ? "Define terms"
                : step === "review"
                  ? "Review and sign"
                  : "Request created"}
            </h2>

            {step === "form" && (
              <>
                <AmountInput
                  id="request-amount"
                  label="Amount"
                  value={amount}
                  onChange={(v) => {
                    setAmount(v);
                    if (errors.amount) setErrors((e) => ({ ...e, amount: undefined }));
                  }}
                  unit="MON"
                  decimals={MON_DECIMALS}
                  error={errors.amount}
                  autoFocus
                />

                <ExpiryField
                  preset={preset}
                  onPresetChange={(p) => {
                    setPreset(p);
                    if (errors.expiry) setErrors((e) => ({ ...e, expiry: undefined }));
                  }}
                  customValue={customExpiry}
                  onCustomChange={(v) => {
                    setCustomExpiry(v);
                    if (errors.expiry) setErrors((e) => ({ ...e, expiry: undefined }));
                  }}
                  error={errors.expiry}
                />

                <MemoField
                  value={memo}
                  onChange={(v) => {
                    setMemo(v);
                    if (errors.memo) setErrors((e) => ({ ...e, memo: undefined }));
                  }}
                  error={errors.memo}
                />

                <Input
                  id="request-payer"
                  label="Payer (optional)"
                  placeholder="0x… — leave empty for an open request"
                  value={payer}
                  spellCheck={false}
                  autoComplete="off"
                  onChange={(e) => {
                    setPayer(e.target.value);
                    if (errors.payer) setErrors((er) => ({ ...er, payer: undefined }));
                  }}
                  error={errors.payer}
                  hint="Restrict this request to one payer address. Empty means anyone can pay."
                />

                <div className="wallet-row">
                  <span className="wallet-row__status">
                    <span
                      className={`wallet-row__dot${mounted && isConnected ? " wallet-row__dot--connected" : ""}`}
                      aria-hidden="true"
                    />
                    {mounted && isConnected && address ? (
                      <>
                        Receiving wallet
                        <span className="wallet-row__address">{address}</span>
                      </>
                    ) : (
                      "No wallet connected"
                    )}
                  </span>
                  {mounted && !isConnected && (
                    <Button
                      variant="secondary"
                      loading={isConnecting}
                      loadingText="Connecting"
                      onClick={connectWallet}
                    >
                      Connect wallet
                    </Button>
                  )}
                </div>
                {errors.wallet && (
                  <p className="flow-error" role="alert">
                    <ErrorGlyph />
                    <span>{errors.wallet}</span>
                  </p>
                )}
              </>
            )}

            {step === "review" && draft && (
              <>
                <LedgerBlock title="Request terms">
                  <LedgerRow
                    label="Amount"
                    value={
                      <>
                        <span className="sc-tnum">
                          {formatUnits(draft.request.amount, MON_DECIMALS)} MON
                        </span>{" "}
                        <span className="sc-mono" style={{ color: "var(--v-muted)" }}>
                          {draft.request.amount.toString()} wei
                        </span>
                      </>
                    }
                  />
                  <LedgerRow
                    label="Recipient"
                    value={<span className="sc-break">{draft.request.recipient}</span>}
                    mono
                    aside={<CopyButton text={draft.request.recipient} />}
                  />
                  <LedgerRow
                    label="Payer"
                    value={
                      draft.request.payer === ANY_PAYER ? (
                        "Open request — any payer"
                      ) : (
                        <span className="sc-break">{draft.request.payer}</span>
                      )
                    }
                    mono={draft.request.payer !== ANY_PAYER}
                    aside={
                      draft.request.payer !== ANY_PAYER ? (
                        <CopyButton text={draft.request.payer} />
                      ) : undefined
                    }
                  />
                  <LedgerRow
                    label="Expires"
                    value={
                      <span className="sc-tnum">
                        {dateTimeFormat.format(
                          new Date(Number(draft.request.expiresAt) * 1000),
                        )}{" "}
                        <span style={{ color: "var(--v-muted)" }}>
                          ({relativeFromNow(draft.request.expiresAt)})
                        </span>
                      </span>
                    }
                  />
                  <LedgerRow label="Memo" value={draft.memo.trim() === "" ? "None" : draft.memo} />
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
                    label="Vajra Code"
                    value={draft.vajraCode}
                    mono
                    aside={<CopyButton text={draft.vajraCode} />}
                  />
                </LedgerBlock>

                <StageRail
                  stages={REQUEST_STAGES}
                  reached={stageReached}
                  waiting={stageWaiting}
                  ariaLabel="Request creation progress"
                />

                {signError && (
                  <p className="flow-error" role="alert">
                    <ErrorGlyph />
                    <span>
                      <span className="flow-error__title">Signature not completed. </span>
                      {signError}
                    </span>
                  </p>
                )}
              </>
            )}

            {step === "success" && draft && link && (
              <>
                <div className="flow-success__head">
                  <span className="flow-success__icon" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M3 8.5l3.2 3L13 5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <div>
                    <h2 className="flow-success__title">Request created</h2>
                    <p className="flow-success__sub">
                      Share this link with the payer. Nothing moves until they pay.
                    </p>
                  </div>
                </div>

                <StageRail
                  stages={REQUEST_STAGES}
                  reached={4}
                  waiting={false}
                  ariaLabel="Request creation progress"
                />

                <div className="link-row">
                  <span className="link-row__url" title={link}>
                    {link}
                  </span>
                  <CopyButton text={link} label="Copy link" />
                </div>

                <QrCode value={link} label="QR code containing the payment link" />

                <LedgerBlock title="Request terms">
                  <LedgerRow
                    label="Amount"
                    value={
                      <>
                        <span className="sc-tnum">
                          {formatUnits(draft.request.amount, MON_DECIMALS)} MON
                        </span>{" "}
                        <span className="sc-mono" style={{ color: "var(--v-muted)" }}>
                          {draft.request.amount.toString()} wei
                        </span>
                      </>
                    }
                  />
                  <LedgerRow
                    label="Recipient"
                    value={<span className="sc-break">{draft.request.recipient}</span>}
                    mono
                    aside={<CopyButton text={draft.request.recipient} />}
                  />
                  <LedgerRow
                    label="Expires"
                    value={
                      <span className="sc-tnum">
                        {dateTimeFormat.format(
                          new Date(Number(draft.request.expiresAt) * 1000),
                        )}{" "}
                        <span style={{ color: "var(--v-muted)" }}>
                          ({relativeFromNow(draft.request.expiresAt)})
                        </span>
                      </span>
                    }
                  />
                  <LedgerRow
                    label="Vajra Code"
                    value={draft.vajraCode}
                    mono
                    aside={<CopyButton text={draft.vajraCode} />}
                  />
                </LedgerBlock>
              </>
            )}
          </div>

          {/* ------------------------------------------------ Context column */}
          <aside className="instrument-grid__aside" aria-label="Request progress and environment">
            <div className="instrument-grid__aside-block">
              <h2 className="instrument-grid__aside-title">Proof chain</h2>
              <ProofChain stages={proofStages} ariaLabel="Payment request progress" />
            </div>
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
                <LedgerRow label="Authorization" value="Recipient signature (EIP-712)" />
              </LedgerBlock>
            </div>
          </aside>
        </div>
      </div>

      {/* Primary action — fixed in the thumb zone on mobile, inline on desktop */}
      <div className="actionbar">
        <div className="actionbar__inner">
          {step === "form" && (
            <Button className="actionbar__primary" onClick={onReviewTerms}>
              Review terms
            </Button>
          )}
          {step === "review" && draft && (
            <>
              <Button
                className="actionbar__primary"
                loading={signing}
                loadingText={stageReached <= 0 ? "Preparing terms" : "Awaiting signature"}
                disabled={wrongChain}
                onClick={onSign}
              >
                Sign request
              </Button>
              <Button
                variant="ghost"
                className="actionbar__secondary"
                disabled={signing}
                onClick={() => setStep("form")}
              >
                Back to edit
              </Button>
            </>
          )}
          {step === "success" && link && (
            <>
              <CopyButton
                text={link}
                label="Copy payment link"
                copiedLabel="Link copied"
              />
              <Button
                variant="ghost"
                className="actionbar__secondary"
                onClick={onCreateAnother}
              >
                Create another
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Wallet picker — bottom sheet when more than one wallet is available */}
      <Sheet
        open={walletSheetOpen}
        onClose={() => setWalletSheetOpen(false)}
        title="Connect a wallet"
      >
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
