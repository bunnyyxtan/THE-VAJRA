import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";

import Button from "./Button";
import PressableScale, { triggerHaptic } from "./PressableScale";
import Sheet from "./Sheet";
import { fmtMon, shortAddr } from "@/src/lib/format";
import { DEMO_WALLET, delay } from "@/src/lib/mock";
import type { Wallet } from "@/src/lib/types";
import { useMotionPref } from "@/src/state/vajra";
import { C, F, MONO, R, S } from "@/src/theme";

// ——— Connect wallet (simulated — no real wallet is contacted) ———

export function ConnectWalletSheet({
  visible,
  onClose,
  onConnected,
  forceNetwork,
}: {
  visible: boolean;
  onClose: () => void;
  onConnected: (w: Wallet) => void;
  forceNetwork?: Wallet["network"];
}) {
  const [phase, setPhase] = useState<"choose" | "connecting">("choose");
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    if (visible) setPhase("choose");
    return () => {
      alive.current = false;
    };
  }, [visible]);

  const connect = async () => {
    setPhase("connecting");
    await delay(1200);
    if (!alive.current) return;
    triggerHaptic("success");
    onConnected({ ...DEMO_WALLET, network: forceNetwork || "Monad Mainnet" });
    onClose();
  };

  return (
    <Sheet
      visible={visible}
      onClose={phase === "connecting" ? () => {} : onClose}
      title="Connect a wallet"
      testID="connect-wallet-sheet"
      dismissable={phase !== "connecting"}
    >
      {phase === "choose" ? (
        <View>
          <Text style={styles.caption}>
            Prototype build. No real wallet is contacted. The demo wallet
            signs in instantly.
          </Text>
          <PressableScale
            testID="wallet-option-demo"
            accessibilityLabel="Connect Vajra Demo Wallet"
            onPress={connect}
            style={styles.walletRow}
          >
            <View style={[styles.walletIcon, { backgroundColor: C.lavenderSoft }]}>
              <Ionicons name="wallet" size={22} color={C.brand} />
            </View>
            <View style={styles.walletText}>
              <Text style={styles.walletName}>Vajra Demo Wallet</Text>
              <Text style={styles.walletAddr}>{shortAddr(DEMO_WALLET.address)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.inkFaint} />
          </PressableScale>
          {["MetaMask", "WalletConnect"].map((name) => (
            <View key={name} style={[styles.walletRow, styles.walletRowOff]}>
              <View style={[styles.walletIcon, { backgroundColor: C.surface2 }]}>
                <Ionicons name="cube-outline" size={22} color={C.inkFaint} />
              </View>
              <View style={styles.walletText}>
                <Text style={[styles.walletName, { color: C.inkFaint }]}>{name}</Text>
                <Text style={styles.walletAddr}>Available after real integration</Text>
              </View>
            </View>
          ))}
          <Button
            label="Cancel"
            onPress={onClose}
            variant="ghost"
            small
            style={{ marginTop: S.md }}
            testID="connect-wallet-cancel"
          />
        </View>
      ) : (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.brand} />
          <Text style={styles.phaseTitle}>Connecting…</Text>
          <Text style={styles.caption}>Waiting for the wallet to approve the session.</Text>
        </View>
      )}
    </Sheet>
  );
}

// ——— Vajra Touch ceremony (simulated passkey — UI only, no cryptography) ———

export function VajraTouchSheet({
  visible,
  onDone,
  title,
  caption,
  details,
}: {
  visible: boolean;
  onDone: (result: "approved" | "cancelled") => void;
  title: string;
  caption: string;
  details?: { label: string; value: string }[];
}) {
  const [phase, setPhase] = useState<"prompt" | "authorizing" | "success">("prompt");
  const alive = useRef(true);
  const reduceMotion = useMotionPref();

  useEffect(() => {
    alive.current = true;
    if (visible) setPhase("prompt");
    return () => {
      alive.current = false;
    };
  }, [visible]);

  const authenticate = async () => {
    setPhase("authorizing");
    await delay(1400);
    if (!alive.current) return;
    triggerHaptic("success");
    setPhase("success");
    await delay(700);
    if (!alive.current) return;
    onDone("approved");
  };

  return (
    <Sheet
      visible={visible}
      onClose={() => phase === "prompt" && onDone("cancelled")}
      testID="vajra-touch-sheet"
      dismissable={phase === "prompt"}
    >
      <View style={styles.center}>
        <View style={styles.touchGlyph}>
          {phase === "success" ? (
            <Animated.View entering={reduceMotion ? undefined : ZoomIn.duration(260)}>
              <Ionicons name="checkmark" size={40} color={C.onBrand} />
            </Animated.View>
          ) : (
            <Ionicons name="finger-print" size={40} color={C.onBrand} />
          )}
        </View>
        <Text style={styles.phaseTitle}>
          {phase === "success" ? "Authenticated" : title}
        </Text>
        <Text style={styles.caption}>
          {phase === "authorizing"
            ? "Waiting for Vajra Touch…"
            : phase === "success"
              ? "Your device approved these exact terms."
              : caption}
        </Text>
        <Text style={styles.protoNote}>Simulated passkey ceremony · prototype build</Text>
      </View>

      {details && phase === "prompt" ? (
        <View style={styles.detailBox}>
          {details.map((d) => (
            <View key={d.label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{d.label}</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {d.value}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {phase === "prompt" ? (
        <View style={{ marginTop: S.lg }}>
          <Button
            label="Authenticate with Vajra Touch"
            icon="finger-print"
            onPress={authenticate}
            testID="vajra-touch-authenticate"
          />
          <Button
            label="Cancel"
            onPress={() => onDone("cancelled")}
            variant="ghost"
            small
            style={{ marginTop: S.sm }}
            testID="vajra-touch-cancel"
          />
        </View>
      ) : phase === "authorizing" ? (
        <View style={[styles.center, { marginTop: S.md }]}>
          <ActivityIndicator color={C.brand} />
        </View>
      ) : null}
    </Sheet>
  );
}

// ——— Simulated wallet payment confirmation ———

export function WalletConfirmSheet({
  visible,
  amountMon,
  to,
  onApprove,
  onReject,
}: {
  visible: boolean;
  amountMon: string;
  to: string;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <Sheet
      visible={visible}
      onClose={onReject}
      title="Confirm in wallet"
      testID="wallet-confirm-sheet"
    >
      <Text style={styles.caption}>
        Simulated wallet · prototype build. Nothing leaves your device.
      </Text>
      <View style={styles.detailBox}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Send</Text>
          <Text style={styles.detailValueStrong}>{fmtMon(amountMon)} MON</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>To</Text>
          <Text style={[styles.detailValue, { fontFamily: MONO }]}>{shortAddr(to)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Network</Text>
          <Text style={styles.detailValue}>Monad Mainnet</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Est. fee</Text>
          <Text style={styles.detailValue}>0.0021 MON</Text>
        </View>
      </View>
      <View style={{ marginTop: S.lg }}>
        <Button label="Approve in wallet" onPress={onApprove} testID="wallet-approve-button" />
        <Button
          label="Reject"
          onPress={onReject}
          variant="danger"
          style={{ marginTop: S.sm }}
          testID="wallet-reject-button"
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  caption: {
    fontFamily: F.med,
    fontSize: 13,
    lineHeight: 19,
    color: C.inkSoft,
    textAlign: "center",
    marginBottom: S.md,
  },
  protoNote: {
    fontFamily: F.med,
    fontSize: 11,
    color: C.inkFaint,
    marginTop: S.sm,
  },
  walletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.md,
    backgroundColor: C.surface2,
    borderRadius: R.md + 2,
    padding: S.md,
    marginBottom: S.sm,
  },
  walletRowOff: { opacity: 0.7 },
  walletIcon: {
    width: 44,
    height: 44,
    borderRadius: R.md,
    alignItems: "center",
    justifyContent: "center",
  },
  walletText: { flex: 1 },
  walletName: { fontFamily: F.semi, fontSize: 15, color: C.ink },
  walletAddr: { fontFamily: MONO, fontSize: 12, color: C.inkFaint, marginTop: 2 },
  center: { alignItems: "center", paddingVertical: S.md },
  phaseTitle: {
    fontFamily: F.display,
    fontSize: 20,
    color: C.ink,
    marginTop: S.md,
    textAlign: "center",
  },
  touchGlyph: {
    width: 84,
    height: 84,
    borderRadius: R.pill,
    backgroundColor: C.brand,
    borderWidth: 1.5,
    borderColor: C.ink,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: S.xs,
    boxShadow: "0px 4px 0px #0E091C",
  },
  detailBox: {
    backgroundColor: C.white,
    borderWidth: 1.25,
    borderColor: C.border,
    borderRadius: R.md + 2,
    paddingHorizontal: S.lg,
    paddingVertical: S.xs,
    marginTop: S.sm,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: S.md - 2,
    gap: S.md,
  },
  detailLabel: { fontFamily: F.med, fontSize: 13, color: C.inkSoft },
  detailValue: {
    fontFamily: F.semi,
    fontSize: 13.5,
    color: C.ink,
    flexShrink: 1,
    textAlign: "right",
  },
  detailValueStrong: { fontFamily: F.display, fontSize: 17, color: C.ink },
});
