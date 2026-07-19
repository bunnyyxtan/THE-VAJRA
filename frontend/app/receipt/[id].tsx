import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Share, StyleSheet, Text, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";

import Button from "@/src/components/Button";
import PressableScale from "@/src/components/PressableScale";
import Screen from "@/src/components/Screen";
import Sheet from "@/src/components/Sheet";
import { EmptyState } from "@/src/components/StateViews";
import { useToast } from "@/src/components/Toast";
import { useBreakpoint } from "@/src/hooks/use-breakpoint";
import { fmtDateTime, fmtMon, shortAddr, shortHash } from "@/src/lib/format";
import { getChainConfig } from "@/src/lib/web3/chain";
const explorerTx = (hash: string): string =>
  `${getChainConfig().explorerUrl}/tx/${hash}`;
const linkFor = (id: string): string => {
  if (typeof window !== "undefined" && (window as any).location) {
    return `${(window as any).location.origin}/receipt/${id}`;
  }
  return `https://vajra.xyz/receipt/${id}`;
};
import { useMotionPref, useVajra } from "@/src/state/vajra";
import { C, F, MONO, R, S } from "@/src/theme";

/** Deterministic barcode widths from the request id. */
const barcodeFor = (id: string): number[] => {
  const out: number[] = [];
  let h = 5381;
  for (let i = 0; i < 42; i++) {
    h = (h * 33 + id.charCodeAt(i % id.length) + i) >>> 0;
    out.push(1 + (h % 4));
  }
  return out;
};

export default function Receipt() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getRequest } = useVajra();
  const { toast } = useToast();
  const reduceMotion = useMotionPref();
  const { isDesktop } = useBreakpoint();
  const [explorerOpen, setExplorerOpen] = useState(false);

  const request = id ? getRequest(String(id)) : undefined;
  const bars = useMemo(
    () => (request ? barcodeFor(request.id) : []),
    [request],
  );

  if (!request) {
    return (
      <Screen title="Receipt" testID="receipt-screen">
        <EmptyState
          testID="receipt-not-found"
          icon="help-circle-outline"
          title="Receipt not found"
          body="Check the receipt link or request code and try again."
          actionLabel="Back to home"
          onAction={() => router.replace("/")}
        />
      </Screen>
    );
  }

  if (request.status !== "paid") {
    return (
      <Screen title="Receipt" subtitle={request.id} testID="receipt-screen">
        <EmptyState
          testID="receipt-unpaid"
          icon="hourglass-outline"
          title="No settlement yet"
          body="This request hasn't been paid, so there is no receipt. A permanent receipt appears the moment payment is final on Monad."
          actionLabel="View the request"
          onAction={() => router.replace(`/pay/${request.id}` as never)}
        />
      </Screen>
    );
  }

  const copy = async (value: string, label: string) => {
    try {
      await Clipboard.setStringAsync(value);
      toast(`${label} copied`, "success");
    } catch {
      toast("Could not copy. Try again.", "error");
    }
  };

  const shareReceipt = async () => {
    try {
      await Share.share({
        message: `Vajra settlement receipt · ${fmtMon(request.amountMon)} MON on Monad · ${linkFor(request.id)}`,
      });
    } catch {
      // dismissed
    }
  };

  return (
    <Screen
      title="Settlement receipt"
      subtitle={request.id}
      onBack={() => (router.canGoBack() ? router.back() : router.replace("/"))}
      maxWidth={560}
      testID="receipt-screen"
    >
      {/* The ticket */}
      <Animated.View
        entering={reduceMotion ? undefined : ZoomIn.duration(360)}
        style={styles.ticket}
        testID="receipt-seal"
      >
        {/* Stamp */}
        <View style={styles.stamp}>
          <Text style={styles.stampText}>SETTLED{"\n"}ON MONAD</Text>
        </View>

        <Text style={styles.ticketMicro}>VAJRA · PERMANENT SETTLEMENT RECEIPT</Text>
        <Text style={styles.ticketAmount}>
          {fmtMon(request.amountMon)}
          <Text style={styles.ticketUnit}> MON</Text>
        </Text>
        {request.memo ? (
          <Text style={styles.ticketMemo}>for {request.memo}</Text>
        ) : null}
        <View style={styles.finalPill}>
          <Ionicons name="shield-checkmark" size={13} color={C.success} />
          <Text style={styles.finalPillText}>PAYMENT FINAL · COMPLETED</Text>
        </View>

        {/* Perforation */}
        <View style={styles.perforation}>
          <View style={[styles.notch, { left: -S.lg - 11 }]} />
          <View style={styles.perfDots}>
            {Array.from({ length: 14 }).map((_, i) => (
              <View key={i} style={styles.perfDot} />
            ))}
          </View>
          <View style={[styles.notch, { right: -S.lg - 11 }]} />
        </View>

        {/* Details */}
        <Row label="FROM" value={request.paidBy ? shortAddr(request.paidBy) : "—"} mono />
        <Row label="TO" value={shortAddr(request.recipient)} mono />
        <Row label="NETWORK" value="Monad Mainnet" />
        <Row label="CONTRACT" value={shortAddr(request.contract)} mono />
        <Row
          label="REQUEST ID"
          value={request.id}
          mono
          onCopy={() => copy(request.id, "Request ID")}
        />
        <Row
          label="TX HASH"
          value={request.txHash ? shortHash(request.txHash) : "—"}
          mono
          onCopy={
            request.txHash
              ? () => copy(request.txHash!, "Transaction hash")
              : undefined
          }
        />
        <Row
          label="BLOCK"
          value={
            request.blockNumber
              ? request.blockNumber.toLocaleString("en-US")
              : "—"
          }
          mono
        />
        <Row
          label="INCLUDED"
          value={request.paidAt ? fmtDateTime(request.paidAt) : "—"}
        />
        <Row
          label="FINALIZED"
          value={request.finalizedAt ? fmtDateTime(request.finalizedAt) : "—"}
          last
        />

        {/* Barcode */}
        <View style={styles.barcode} accessibilityElementsHidden>
          {bars.map((w, i) => (
            <View
              key={i}
              style={{
                width: w,
                height: i % 7 === 0 ? 34 : 28,
                backgroundColor: C.ink,
                marginRight: 2,
              }}
            />
          ))}
        </View>
        <Text style={styles.barcodeCode}>{request.id}</Text>
      </Animated.View>

      <View style={styles.publicRow}>
        <Ionicons name="lock-closed" size={12} color={C.success} />
        <Text style={styles.publicText}>
          Permanent and readable by anyone with the link. No wallet needed.
        </Text>
      </View>

      <View style={isDesktop ? styles.actionsRowDesktop : undefined}>
        <Button
          label="Copy receipt link"
          icon="link"
          variant="outline"
          onPress={() => copy(linkFor(request.id), "Receipt link")}
          style={[{ marginTop: S.lg }, isDesktop && styles.actionFlex]}
          testID="receipt-copy-link"
        />
        <Button
          label="Share receipt"
          icon="share-outline"
          variant="secondary"
          onPress={shareReceipt}
          style={[{ marginTop: S.md }, isDesktop && styles.actionFlex]}
          testID="receipt-share"
        />
      </View>
      <Button
        label="View on Monad Explorer"
        icon="open-outline"
        variant="ghost"
        onPress={() => setExplorerOpen(true)}
        style={{ marginTop: S.sm }}
        testID="receipt-explorer"
      />

      <Text style={styles.protoNote}>
        PROTOTYPE SETTLEMENT · NO REAL FUNDS MOVED ON MONAD
      </Text>

      <Sheet
        visible={explorerOpen}
        onClose={() => setExplorerOpen(false)}
        title="Open Monad Explorer"
        testID="explorer-sheet"
      >
        <Text style={styles.sheetBody}>
          This is a prototype receipt with a simulated transaction hash, so the
          explorer won’t show it yet. In production this opens
          monadexplorer.com so you can independently verify the settlement.
        </Text>
        <Button
          label="Copy explorer link"
          icon="copy-outline"
          variant="secondary"
          onPress={() => {
            if (request.txHash)
              copy(explorerTx(request.txHash), "Explorer link");
            setExplorerOpen(false);
          }}
          style={{ marginTop: S.lg }}
          testID="explorer-copy-link"
        />
        <Button
          label="Close"
          variant="ghost"
          small
          onPress={() => setExplorerOpen(false)}
          style={{ marginTop: S.sm }}
          testID="explorer-close"
        />
      </Sheet>
    </Screen>
  );
}

function Row({
  label,
  value,
  mono,
  onCopy,
  last,
}: {
  label: string;
  value: string;
  mono?: boolean;
  onCopy?: () => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        <Text
          style={[
            styles.rowValue,
            mono && { fontFamily: MONO, fontSize: 12.5 },
          ]}
          numberOfLines={1}
        >
          {value}
        </Text>
        {onCopy ? (
          <PressableScale
            testID={`receipt-copy-${label.toLowerCase().replace(/\s+/g, "-")}`}
            accessibilityLabel={`Copy ${label}`}
            onPress={onCopy}
            haptic={null}
            hitSlop={8}
            style={styles.copyIcon}
          >
            <Ionicons name="copy-outline" size={15} color={C.brand} />
          </PressableScale>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionsRowDesktop: { flexDirection: "row", gap: S.md },
  actionFlex: { flex: 1, marginTop: S.lg },
  ticket: {
    backgroundColor: C.white,
    borderRadius: R.lg,
    borderWidth: 1.5,
    borderColor: C.ink,
    paddingHorizontal: S.lg,
    paddingTop: S.xl,
    paddingBottom: S.lg,
    marginTop: S.sm,
    boxShadow: "0px 5px 0px #0E091C",
    overflow: "hidden",
  },
  stamp: {
    position: "absolute",
    top: S.lg,
    right: S.md,
    borderWidth: 2,
    borderColor: C.success,
    borderRadius: 8,
    paddingHorizontal: S.sm,
    paddingVertical: 5,
    transform: [{ rotate: "-9deg" }],
    backgroundColor: C.white,
  },
  stampText: {
    fontFamily: F.display,
    fontSize: 10.5,
    lineHeight: 13,
    letterSpacing: 1.2,
    color: C.success,
    textAlign: "center",
  },
  ticketMicro: {
    fontFamily: F.bold,
    fontSize: 9,
    letterSpacing: 1.8,
    color: C.inkFaint,
  },
  ticketAmount: {
    fontFamily: F.display,
    fontSize: 44,
    letterSpacing: -1,
    color: C.ink,
    marginTop: S.md,
  },
  ticketUnit: { fontSize: 20, letterSpacing: 0, color: C.inkFaint },
  ticketMemo: {
    fontFamily: F.serif,
    fontSize: 16,
    color: C.inkSoft,
    marginTop: 2,
  },
  finalPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: C.successBg,
    borderRadius: 6,
    paddingHorizontal: S.sm,
    paddingVertical: 5,
    marginTop: S.md,
  },
  finalPillText: {
    fontFamily: F.bold,
    fontSize: 9.5,
    letterSpacing: 1,
    color: C.success,
  },
  perforation: {
    marginVertical: S.lg,
    height: 22,
    justifyContent: "center",
  },
  perfDots: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: S.md,
  },
  perfDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.surface3,
  },
  notch: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: R.pill,
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.ink,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: S.md,
    gap: S.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderStyle: "dashed",
    borderBottomColor: C.surface3,
  },
  rowLabel: {
    fontFamily: F.bold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: C.inkFaint,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.sm,
    flexShrink: 1,
  },
  rowValue: { fontFamily: F.semi, fontSize: 13.5, color: C.ink, flexShrink: 1 },
  copyIcon: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  barcode: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    marginTop: S.lg,
    height: 34,
    overflow: "hidden",
  },
  barcodeCode: {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 4,
    color: C.inkSoft,
    textAlign: "center",
    marginTop: 6,
  },
  publicRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: S.lg,
    paddingHorizontal: S.xs,
  },
  publicText: {
    flex: 1,
    fontFamily: F.med,
    fontSize: 11.5,
    lineHeight: 16,
    color: C.inkSoft,
  },
  protoNote: {
    fontFamily: F.bold,
    fontSize: 8.5,
    letterSpacing: 1.4,
    color: C.inkFaint,
    textAlign: "center",
    marginTop: S.xl,
  },
  sheetBody: {
    fontFamily: F.med,
    fontSize: 13.5,
    lineHeight: 20,
    color: C.inkSoft,
  },
});
