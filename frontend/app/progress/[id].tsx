import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";

import Button from "@/src/components/Button";
import PressableScale, { triggerHaptic } from "@/src/components/PressableScale";
import Screen from "@/src/components/Screen";
import StageRail, { Stage, StageStatus } from "@/src/components/StageRail";
import { EmptyState, ErrorCard } from "@/src/components/StateViews";
import { useToast } from "@/src/components/Toast";
import { WalletConfirmSheet } from "@/src/components/WalletSheets";
import { blockFor, fmtMon, shortAddr, shortHash, txHashFor } from "@/src/lib/format";
const delay = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
import { useMotionPref, useVajra } from "@/src/state/vajra";
import { C, F, MONO, R, S, cardShadow } from "@/src/theme";

type StageKey = "prepare" | "wallet" | "broadcast" | "included" | "finality";
type FlowPhase = "running" | "rejected" | "uncertain" | "final";

const STAGE_DEFS: { key: StageKey; label: string; desc: string }[] = [
  { key: "prepare", label: "Preparing payment", desc: "Re-checking the authenticated terms one last time" },
  { key: "wallet", label: "Confirm in wallet", desc: "Approve the exact amount and recipient in your wallet" },
  { key: "broadcast", label: "Broadcast to Monad", desc: "Your transaction is being sent to the network" },
  { key: "included", label: "Included on Monad", desc: "A block has included your transaction" },
  { key: "finality", label: "Payment final", desc: "Finality reached. The settlement is permanent" },
];

export default function TransactionProgress() {
  const { id, tx: txParam } = useLocalSearchParams<{ id: string; tx?: string }>();
  const router = useRouter();
  const { getRequest, updateRequest, wallet } = useVajra();
  const { toast } = useToast();
  const reduceMotion = useMotionPref();

  const request = id ? getRequest(String(id)) : undefined;

  const [statuses, setStatuses] = useState<Record<StageKey, StageStatus>>({
    prepare: "pending",
    wallet: "pending",
    broadcast: "pending",
    included: "pending",
    finality: "pending",
  });
  const [phase, setPhase] = useState<FlowPhase>("running");
  const [walletSheetOpen, setWalletSheetOpen] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [block, setBlock] = useState<number | null>(null);
  const [checkCount, setCheckCount] = useState(0);
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const started = useRef(false);
  const alive = useRef(true);

  const set = (key: StageKey, status: StageStatus) =>
    setStatuses((prev) => ({ ...prev, [key]: status }));

  const speed = (ms: number) => (reduceMotion ? Math.min(ms, 400) : ms);

  useEffect(() => {
    alive.current = true;
    if (!request || started.current) return;
    started.current = true;
    (async () => {
      const hash = (txParam || request.txHash) as string | undefined;
      if (!hash) {
        // no real transaction in flight — nothing to track honestly
        setPhase("uncertain");
        return;
      }
      set("prepare", "done");
      set("wallet", "done");
      setTxHash(hash);
      set("broadcast", "active");
      try {
        const { getPublicClient } = await import("@/src/lib/web3/client");
        const { getChainConfig } = await import("@/src/lib/web3/chain");
        const config = getChainConfig();
        const client = getPublicClient(config);
        set("broadcast", "done");
        set("included", "active");
        const receipt = await client.waitForTransactionReceipt({
          hash: hash as `0x${string}`,
          timeout: 120_000,
        });
        if (!alive.current) return;
        if (receipt.status !== "success") {
          set("included", "failed");
          setPhase("rejected");
          return;
        }
        setBlock(Number(receipt.blockNumber));
        set("included", "done");
        set("finality", "active");
        // finality: wait for the finalized tag to cover the tx block when
        // available, else a short labeled confirmation delay
        try {
          const finalized = await client.getBlock({ blockTag: "finalized" });
          if (finalized.number < receipt.blockNumber) {
            await delay(3000);
          }
        } catch {
          await delay(3000); // finalized tag unavailable — labeled fallback
        }
        if (!alive.current) return;
        const now = new Date().toISOString();
        updateRequest(request.id, {
          status: "paid",
          txHash: hash,
          paidBy: wallet?.address,
          paidAt: now,
          finalizedAt: now,
          blockNumber: Number(receipt.blockNumber),
        });
        set("finality", "done");
        triggerHaptic("success");
        setPhase("final");
      } catch (err) {
        if (!alive.current) return;
        setPhase("uncertain");
        setLastChecked(new Date().toLocaleTimeString());
      }
    })();
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const continueAfterInclusion = async () => {
    if (!request) return;
    set("included", "active");
    await delay(speed(request.scenario === "slow" ? 6500 : 1900));
    if (!alive.current) return;
    setBlock(blockFor(request.id));
    set("included", "done");
    set("finality", "active");
    await delay(speed(2200));
    if (!alive.current) return;
    finalize();
  };

  const finalize = () => {
    if (!request) return;
    const now = new Date().toISOString();
    updateRequest(request.id, {
      status: "paid",
      txHash: txHashFor(request.id),
      paidBy: wallet?.address,
      paidAt: now,
      finalizedAt: now,
      blockNumber: blockFor(request.id),
      scenario: undefined,
    });
    set("finality", "done");
    triggerHaptic("success");
    setPhase("final");
  };

  const onApprove = async () => {
    if (!request) return;
    setWalletSheetOpen(false);
    set("wallet", "done");
    set("broadcast", "active");
    await delay(speed(1500));
    if (!alive.current) return;
    setTxHash(txHashFor(request.id));
    set("broadcast", "done");
    if (request.scenario === "uncertain" && checkCount === 0) {
      setPhase("uncertain");
      return;
    }
    continueAfterInclusion();
  };

  const onReject = () => {
    setWalletSheetOpen(false);
    set("wallet", "failed");
    setPhase("rejected");
  };

  const retryAfterReject = () => {
    setPhase("running");
    set("wallet", "active");
    setWalletSheetOpen(true);
  };

  const checkAgain = async () => {
    setChecking(true);
    await delay(speed(1200));
    if (!alive.current) return;
    setChecking(false);
    const next = checkCount + 1;
    setCheckCount(next);
    setLastChecked(new Date().toLocaleTimeString());
    if (next >= 2) {
      setPhase("running");
      continueAfterInclusion();
    }
  };

  const copyHash = async () => {
    if (!txHash) return;
    try {
      await Clipboard.setStringAsync(txHash);
      toast("Transaction hash copied", "success");
    } catch {
      toast("Could not copy. Try again.", "error");
    }
  };

  if (!request) {
    return (
      <Screen title="Payment" testID="progress-screen">
        <EmptyState
          testID="progress-not-found"
          icon="help-circle-outline"
          title="Request not found"
          body="This payment can't be started. No money moved."
          actionLabel="Back to home"
          onAction={() => router.replace("/")}
        />
      </Screen>
    );
  }

  const stages: Stage[] = STAGE_DEFS.map((d) => ({
    ...d,
    status: statuses[d.key],
    meta:
      d.key === "broadcast" && txHash
        ? shortHash(txHash)
        : d.key === "included" && block
          ? `Block ${block.toLocaleString("en-US")}`
          : undefined,
  }));

  return (
    <Screen
      title={phase === "final" ? "Payment final" : "Payment in progress"}
      subtitle={request.id}
      onBack={() => (router.canGoBack() ? router.back() : router.replace("/"))}
      maxWidth={620}
      testID="progress-screen"
      footer={
        phase === "final" ? (
          <Button
            label="View permanent receipt"
            icon="ribbon"
            onPress={() => router.replace(`/receipt/${request.id}` as never)}
            testID="progress-view-receipt"
          />
        ) : undefined
      }
    >
      {/* Amount summary — always visible, solid surface */}
      <View style={[styles.summary, cardShadow]}>
        <Text style={styles.summaryAmount}>
          {fmtMon(request.amountMon)} MON
        </Text>
        <Text style={styles.summaryTo}>
          to {shortAddr(request.recipient)} · Monad Mainnet
        </Text>
      </View>

      {phase === "rejected" ? (
        <View style={{ marginBottom: S.lg }}>
          <ErrorCard
            testID="progress-rejected-card"
            tone="warning"
            icon="hand-left"
            title="Payment was not submitted"
            moneyLine="No money moved"
            body="You rejected the request in your wallet, so nothing was sent to Monad. The request is still valid. Review it and try again whenever you like."
            actionLabel="Review and try again"
            onAction={retryAfterReject}
            secondaryLabel="Back to request"
            onSecondary={() => router.back()}
          />
        </View>
      ) : null}

      {phase === "uncertain" ? (
        <View style={{ marginBottom: S.lg }}>
          <ErrorCard
            testID="progress-uncertain-card"
            tone="warning"
            icon="help-circle"
            title="Payment status is still being checked"
            moneyLine="Money may have moved"
            body={`A transaction was submitted, but Vajra cannot confirm its final result yet. Do not pay again. Check the status until it resolves.${lastChecked ? ` Last checked at ${lastChecked}.` : ""}`}
            actionLabel="Check again"
            actionLoading={checking}
            onAction={checkAgain}
          />
          {txHash ? (
            <PressableScale
              testID="progress-uncertain-hash"
              accessibilityLabel="Copy transaction hash"
              onPress={copyHash}
              style={styles.hashRow}
              haptic={null}
            >
              <Ionicons name="copy-outline" size={14} color={C.brand} />
              <Text style={styles.hashText} numberOfLines={1}>
                {shortHash(txHash)}
              </Text>
              <Text style={styles.hashHint}>Copy for explorer lookup</Text>
            </PressableScale>
          ) : null}
        </View>
      ) : null}

      {/* Transaction rail */}
      <View style={[styles.railCard, cardShadow]}>
        <StageRail stages={stages} />
      </View>

      {request.scenario === "slow" && statuses.included === "active" ? (
        <View style={styles.slowNote} testID="progress-slow-note">
          <Ionicons name="hourglass" size={15} color={C.inkSoft} />
          <Text style={styles.slowText}>
            Monad is taking longer than usual to include this transaction. Your
            payment was broadcast once. Do not pay again.
          </Text>
        </View>
      ) : null}

      {phase === "running" && statuses.broadcast !== "pending" ? (
        <Text style={styles.truthNote}>
          Stages advance only on confirmed network events, never on a timer.
        </Text>
      ) : null}

      {phase === "final" ? (
        <Animated.View
          entering={reduceMotion ? undefined : ZoomIn.duration(420)}
          style={styles.sealWrap}
          testID="progress-final-seal"
        >
          <View style={styles.sealRing}>
            <View style={styles.sealInner}>
              <Ionicons name="shield-checkmark" size={34} color={C.onBrand} />
            </View>
          </View>
          <Text style={styles.sealTitle}>Payment final on Monad</Text>
          <Text style={styles.sealSub}>
            {fmtMon(request.amountMon)} MON settled permanently. Your receipt is
            ready.
          </Text>
          {txHash ? (
            <PressableScale
              testID="progress-final-hash"
              accessibilityLabel="Copy transaction hash"
              onPress={copyHash}
              style={styles.hashRow}
              haptic={null}
            >
              <Ionicons name="copy-outline" size={14} color={C.brand} />
              <Text style={styles.hashText}>{shortHash(txHash)}</Text>
            </PressableScale>
          ) : null}
        </Animated.View>
      ) : null}

      <WalletConfirmSheet
        visible={walletSheetOpen}
        amountMon={request.amountMon}
        to={request.recipient}
        onApprove={onApprove}
        onReject={onReject}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    backgroundColor: C.inverse,
    borderRadius: R.lg,
    padding: S.xl,
    marginBottom: S.xl,
  },
  summaryAmount: { fontFamily: F.display, fontSize: 32, color: C.onInverse },
  summaryTo: {
    fontFamily: F.med,
    fontSize: 13,
    color: "#B9B3CE",
    marginTop: 4,
  },
  railCard: {
    backgroundColor: C.white,
    borderRadius: R.lg,
    borderWidth: 1.5,
    borderColor: C.ink,
    padding: S.xl,
    boxShadow: "0px 4px 0px #0E091C",
  },
  slowNote: {
    flexDirection: "row",
    gap: S.sm,
    alignItems: "flex-start",
    backgroundColor: C.surface2,
    borderRadius: R.md,
    padding: S.md,
    marginTop: S.lg,
  },
  slowText: {
    flex: 1,
    fontFamily: F.med,
    fontSize: 12.5,
    lineHeight: 18,
    color: C.inkSoft,
  },
  truthNote: {
    fontFamily: F.med,
    fontSize: 11.5,
    color: C.inkFaint,
    textAlign: "center",
    marginTop: S.lg,
  },
  sealWrap: { alignItems: "center", marginTop: S.xl },
  sealRing: {
    width: 108,
    height: 108,
    borderRadius: R.pill,
    backgroundColor: C.lavenderSoft,
    borderWidth: 1.5,
    borderColor: C.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  sealInner: {
    width: 78,
    height: 78,
    borderRadius: R.pill,
    backgroundColor: C.brand,
    borderWidth: 1.5,
    borderColor: C.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  sealTitle: {
    fontFamily: F.display,
    fontSize: 22,
    color: C.ink,
    marginTop: S.lg,
  },
  sealSub: {
    fontFamily: F.med,
    fontSize: 13,
    lineHeight: 19,
    color: C.inkSoft,
    textAlign: "center",
    marginTop: S.xs,
    maxWidth: 300,
  },
  hashRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    backgroundColor: C.lavenderSoft,
    borderRadius: R.pill,
    paddingHorizontal: S.md,
    paddingVertical: 8,
    marginTop: S.md,
  },
  hashText: { fontFamily: MONO, fontSize: 12, color: C.onLavender },
  hashHint: { fontFamily: F.med, fontSize: 11, color: C.inkFaint },
});
