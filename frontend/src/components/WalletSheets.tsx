import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";

import Button from "./Button";
import PressableScale, { triggerHaptic } from "./PressableScale";
import Sheet from "./Sheet";
import { fmtMon, shortAddr } from "@/src/lib/format";
import type { Wallet } from "@/src/lib/types";
import {
  getDiscoveredWallets,
  getVajraWallet,
  hasInjectedFallback,
  onWalletsChanged,
  selectProvider,
  type DiscoveredWallet,
} from "@/src/lib/web3/wallet";
import { useMotionPref } from "@/src/state/vajra";
import { C, F, MONO, R, S } from "@/src/theme";

const delay = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

// ——— Connect wallet (real injected wallet on web) ———

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
  const [error, setError] = useState<string | null>(null);
  const [wallets, setWallets] = useState<DiscoveredWallet[]>(() => getDiscoveredWallets());
  const [fallback, setFallback] = useState<boolean>(() => hasInjectedFallback());
  const [brokenIcons, setBrokenIcons] = useState<Record<string, boolean>>({});
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    if (visible) {
      setPhase("choose");
      setError(null);
    }
    return () => {
      alive.current = false;
    };
  }, [visible]);

  // EIP-6963: keep the wallet list in sync with provider announcements.
  useEffect(() => {
    const update = () => {
      setWallets(getDiscoveredWallets());
      setFallback(hasInjectedFallback());
    };
    update();
    return onWalletsChanged(update);
  }, []);

  const connect = async (rdns: string | null) => {
    setPhase("connecting");
    setError(null);
    try {
      selectProvider(rdns);
      const vw = getVajraWallet();
      const account = await vw.connect();
      // account.chainId is normalized to a number by the wallet layer, so
      // this numeric comparison is safe regardless of the wallet's hex format.
      if (account.chainId !== 143) await vw.switchToMonad();
      if (!alive.current) return;
      triggerHaptic("success");
      onConnected({
        address: account.address,
        label: "Connected wallet",
        network: "Monad Mainnet",
      });
      onClose();
    } catch (err) {
      if (!alive.current) return;
      setPhase("choose");
      setError(
        err instanceof Error && err.message.includes("reject")
          ? "Connection was rejected in the wallet. Nothing changed — you can retry safely."
          : err instanceof Error
            ? err.message
            : "Wallet connection failed. Retry or try another browser wallet.",
      );
    }
  };

  const available = wallets.length > 0 || fallback;

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
            Connect the wallet that creates or pays requests on Monad Mainnet.
          </Text>
          {available ? (
            <View>
              {wallets.map((w) => (
                <PressableScale
                  key={w.rdns}
                  testID={`wallet-option-${w.rdns}`}
                  accessibilityLabel={`Connect ${w.name}`}
                  onPress={() => connect(w.rdns)}
                  style={styles.walletRow}
                >
                  <View style={[styles.walletIcon, { backgroundColor: C.lavenderSoft }]}>
                    {w.icon && !brokenIcons[w.rdns] ? (
                      <Image
                        source={{ uri: w.icon }}
                        style={styles.walletIconImage}
                        onError={() =>
                          setBrokenIcons((prev) => ({ ...prev, [w.rdns]: true }))
                        }
                      />
                    ) : (
                      <Ionicons name="wallet" size={22} color={C.brand} />
                    )}
                  </View>
                  <View style={styles.walletText}>
                    <Text style={styles.walletName}>{w.name}</Text>
                    <Text style={styles.walletAddr}>{w.rdns}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={C.inkFaint} />
                </PressableScale>
              ))}
              {fallback ? (
                <PressableScale
                  testID="wallet-option-injected"
                  accessibilityLabel="Connect browser wallet"
                  onPress={() => connect(null)}
                  style={styles.walletRow}
                >
                  <View style={[styles.walletIcon, { backgroundColor: C.lavenderSoft }]}>
                    <Ionicons name="wallet" size={22} color={C.brand} />
                  </View>
                  <View style={styles.walletText}>
                    <Text style={styles.walletName}>Browser wallet</Text>
                    <Text style={styles.walletAddr}>
                      {wallets.length > 0
                        ? "Another injected wallet (window.ethereum)"
                        : "MetaMask or any injected wallet"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={C.inkFaint} />
                </PressableScale>
              ) : null}
            </View>
          ) : (
            <View style={[styles.walletRow, styles.walletRowOff]}>
              <View style={[styles.walletIcon, { backgroundColor: C.surface2 }]}>
                <Ionicons name="cube-outline" size={22} color={C.inkFaint} />
              </View>
              <View style={styles.walletText}>
                <Text style={[styles.walletName, { color: C.inkFaint }]}>No wallet detected</Text>
                <Text style={styles.walletAddr}>Install MetaMask or another injected wallet, then retry</Text>
              </View>
            </View>
          )}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
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

// ——— Approve-terms ceremony: exact terms confirmed before the wallet signature request ———

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
            ? "Waiting for confirmation…"
            : phase === "success"
              ? "Your device approved these exact terms."
              : caption}
        </Text>
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
        Review the request in your wallet. Only you can approve it.
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
    overflow: "hidden",
  },
  walletIconImage: { width: 28, height: 28, borderRadius: 8 },
  walletText: { flex: 1 },
  walletName: { fontFamily: F.semi, fontSize: 15, color: C.ink },
  walletAddr: { fontFamily: MONO, fontSize: 12, color: C.inkFaint, marginTop: 2 },
  errorText: { fontFamily: F.med, fontSize: 13, color: C.error, marginTop: S.sm },
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
