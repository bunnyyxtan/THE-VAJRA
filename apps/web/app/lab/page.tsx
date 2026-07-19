"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AmountInput } from "@/components/ui/AmountInput";
import { LedgerBlock, LedgerRow } from "@/components/ui/Ledger";
import {
  ProofChain,
  PROOF_CHAIN_STAGES,
  type ProofStage,
} from "@/components/ui/ProofChain";
import { Seal } from "@/components/ui/Seal";
import { Toast } from "@/components/ui/Toast";
import { Banner } from "@/components/ui/Banner";
import { Dialog } from "@/components/ui/Dialog";
import { Sheet } from "@/components/ui/Sheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { CopyButton } from "@/components/ui/CopyButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
        paddingBottom: "var(--space-7)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
        <h2 style={{ fontSize: "var(--type-section)", fontWeight: 700 }}>{title}</h2>
        {note && (
          <p style={{ fontSize: "var(--type-compact)", color: "var(--text-muted)" }}>{note}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "var(--space-3)",
      }}
    >
      {children}
    </div>
  );
}

const midStages: ProofStage[] = PROOF_CHAIN_STAGES.map((label, i) => ({
  label,
  status: i < 3 ? "complete" : i === 3 ? "current" : "upcoming",
}));

const doneStages: ProofStage[] = PROOF_CHAIN_STAGES.map((label) => ({
  label,
  status: "complete",
}));

const failedStages: ProofStage[] = PROOF_CHAIN_STAGES.map((label, i) => ({
  label,
  status: i < 4 ? "complete" : i === 4 ? "failed" : "upcoming",
  ...(i === 4
    ? {
        failureNote: "Submitted to the wallet, but the network rejected it. No funds moved.",
        recovery: (
          <Button variant="secondary" onClick={() => undefined}>
            Retry submission
          </Button>
        ),
      }
    : {}),
}));

export default function LabPage() {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  function simulateWork() {
    setLoading(true);
    setSuccess(false);
    window.setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      window.setTimeout(() => setSuccess(false), 1800);
    }, 2000);
  }

  return (
    <main
      style={{
        maxWidth: 880,
        margin: "0 auto",
        padding: "var(--space-6) var(--space-4) var(--space-8)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-7)",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "var(--space-4)",
        }}
      >
        <div>
          <h1 style={{ fontSize: "var(--type-page-title)", fontWeight: 800 }}>
            Motion &amp; Interaction Lab
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--type-compact)" }}>
            Dev-only surface. Not linked from any navigation. Every state of every
            base component, in both appearances.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <Banner tone="info" title="Reduced motion">
        With <span className="mono">prefers-reduced-motion: reduce</span>, all
        translation, scale, pulse, rotation and shimmer are removed. States remain
        fully readable as static text and shape.
      </Banner>

      <Section
        title="Button"
        note="Press scales to 0.985 in 90ms with no layout shift. Loading holds width, sets aria-busy, and names the stage."
      >
        <Row>
          <Button>Primary action</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Revoke access</Button>
        </Row>
        <Row>
          <Button loading loadingText="Awaiting wallet approval">
            Pay request
          </Button>
          <Button success successText="Signed">
            Sign terms
          </Button>
          <Button disabled>Disabled</Button>
          <Button onClick={simulateWork} loading={loading} success={success}
            loadingText="Confirming on Monad" successText="Settled">
            Run 2s work demo
          </Button>
        </Row>
      </Section>

      <Section
        title="Input"
        note="Focus ring is immediate. Error space is always reserved — nothing jumps when an error lands."
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
          <Input label="Recipient address" placeholder="0x…" hint="Checksummed EVM address." />
          <Input
            label="Recipient address"
            defaultValue="0x123"
            error="Address is too short — 42 characters required."
          />
          <Input label="Disabled field" value="Locked by signed terms" disabled />
        </div>
      </Section>

      <Section
        title="AmountInput"
        note="Calibrated readout with tabular numerals. Bigint-safe: accepts 0.01, .01 and 0,01; base units echo below."
      >
        <AmountInput
          label="Amount"
          value={amount}
          onChange={setAmount}
          unit="MON"
          decimals={18}
        />
        <AmountInput
          label="Amount (error state)"
          value={"9".repeat(30)}
          onChange={() => undefined}
          unit="MON"
          error="Amount exceeds what this wallet can cover."
        />
      </Section>

      <Section
        title="Ledger"
        note="Ruled rows, stable label-value alignment, mono identifiers, labeled freshness."
      >
        <LedgerBlock title="Request terms" freshness="Updated 12s ago">
          <LedgerRow label="Amount" value="0.00001 MON" />
          <LedgerRow
            label="Contract"
            value="0x7d17f2765bb58ceb27b9e1e52b068c72ccb8299f"
            mono
            aside={<CopyButton text="0x7d17f2765bb58ceb27b9e1e52b068c72ccb8299f" />}
          />
          <LedgerRow label="Chain" value="Monad Mainnet · 143" />
          <LedgerRow
            label="Request ID"
            value="0x94ca84d687b6b3f162b3b96d2d8c329cc0dad91bcbff2288ad18294efc2409a2"
            mono
          />
        </LedgerBlock>
      </Section>

      <Section
        title="Proof chain"
        note="Horizontal here; a compact vertical rail below 768px. Pulse is opacity-only and stops on completion."
      >
        <ProofChain stages={midStages} ariaLabel="In-progress payment" />
        <ProofChain stages={doneStages} ariaLabel="Completed payment" />
        <ProofChain stages={failedStages} ariaLabel="Failed payment with recovery" />
      </Section>

      <Section
        title="Seal"
        note="Resolves once, in 420ms, only at verified completion. Reload to replay."
      >
        <Seal title="Receipt sealed" sub="Settlement verified onchain" />
      </Section>

      <Section title="Toast" note="Zero-stakes feedback only — never critical information.">
        <Row>
          <Button variant="secondary" onClick={() => setToastOpen(true)}>
            Show toast
          </Button>
        </Row>
        <Toast
          open={toastOpen}
          onClose={() => setToastOpen(false)}
          tone="success"
          message="Link copied to clipboard"
        />
      </Section>

      <Section title="Banner" note="One compact persistent message; icon + text, never color alone.">
        <Banner tone="info" title="Network">
          Connected to Monad Mainnet (chain 143). Real MON will move.
        </Banner>
        <Banner tone="warning" title="Stale data">
          Activity was last refreshed 4 minutes ago. Pull to refresh.
        </Banner>
        <Banner tone="danger" title="Network mismatch" action={<Button variant="secondary">Switch</Button>}>
          Your wallet is on a different chain than this request.
        </Banner>
      </Section>

      <Section title="Dialog" note="Irreversible actions only. Focus trapped, Escape closes, focus restored.">
        <Row>
          <Button variant="danger" onClick={() => setDialogOpen(true)}>
            Open revocation dialog
          </Button>
        </Row>
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title="Revoke this request?"
          actions={
            <>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                Keep request
              </Button>
              <Button variant="danger" onClick={() => setDialogOpen(false)}>
                Revoke permanently
              </Button>
            </>
          }
        >
          Revoking marks the request unusable onchain. This cannot be undone, and
          the recipient will need to create a new request to be paid.
        </Dialog>
      </Section>

      <Section title="Sheet" note="Bottom sheet on mobile, centered panel on desktop.">
        <Row>
          <Button variant="secondary" onClick={() => setSheetOpen(true)}>
            Open sheet
          </Button>
        </Row>
        <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Share request">
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--type-body)" }}>
            The signed request link can be opened by any payer. Payment still
            requires the recipient signature embedded in the link.
          </p>
          <div style={{ marginTop: "var(--space-4)" }}>
            <CopyButton text="https://vajra.example/pay/0x94ca84d6" label="Copy link" />
          </div>
        </Sheet>
      </Section>

      <Section
        title="Skeleton"
        note="Geometry-matching. The sheen runs three passes then settles — never infinite, never under reduced motion."
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <Skeleton variant="text" width="38%" />
          <Skeleton variant="text" width="72%" />
          <Skeleton variant="row" />
          <Skeleton variant="row" shimmer={false} />
          <Skeleton variant="block" height={140} />
        </div>
      </Section>

      <Section title="CopyButton" note="Morphs to a check in 140ms, restores after ~1.8s, announces to AT.">
        <Row>
          <CopyButton text="0x7d17f2765bb58ceb27b9e1e52b068c72ccb8299f" label="Copy address" />
        </Row>
      </Section>
    </main>
  );
}
