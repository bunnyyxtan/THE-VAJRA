import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";

import Button from "./Button";
import PressableScale, { triggerHaptic } from "./PressableScale";
import Sheet from "./Sheet";
import type { Wallet } from "@/src/lib/types";
import { MONAD_MAINNET_CHAIN_ID } from "@/src/lib/web3/chain";
import { classifyError, userCopy, type ErrorCode } from "@/src/lib/web3/errors";
import { getVajraWallet } from "@/src/lib/web3/wallet";
import { useMotionPref, useVajra } from "@/src/state/vajra";
import { C, F, MONO, R, S } from "@/src/theme";

// ——— Connect wallet (real EIP-1193 injected wallet) ———

export function ConnectWalletSheet({
  visible,
  onClose,
  onConnected,
}: {
  visible: boolean;
  onClose: () => void;
  onConnected: (w: Wallet) => void;
}) {
  const { connectWallet } = useVajra();
  const [phase, setPhase] = useState<"choose" | "connecting">("choose");
  const [error, setError] = useState<{ title: string; body: string } | null>(null);
  const alive = useRef(true);

  const available = getVajraWallet().isAvailable();

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

  const connect = async () => {
    setError(null);
    setPhase("connecting");
    try {
      const wallet = await connectWallet();
      if (!alive.current) return;
      triggerHaptic("success");
      onConnected(wallet);
      onClose();
    } catch (err) {
      if (!alive.current) return;
      const classified = classifyError(err);
      const copy = userCopy(classified.code);
      if (classified.code === "WALLET_REJECTED") {
        // Declined in the wallet — back to the chooser, no error framing.
        setPhase("choose");
        return;
      }
      setError({ title: copy.title, body: copy.whatHappened });
      setPhase("choose");
    }
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
            Vajra connects to the wallet in your browser and asks it to switch
            to Monad Mainnet (chain ID {MONAD_MAINNET_CHAIN_ID}).
          </Text>
          {error ? (
            <View style={styles.errorBox} testID="connect-wallet-error">
              <Ionicons name="alert-circle" size={16} color={C.error} />
              <Text style={styles.errorText}>
                {error.title}. {error.body}
              </Text>
            </View>
          ) : null}
          {available ? (
            <PressableScale
              testID="wallet-option-injected"
              accessibilityLabel="Connect browser wallet"
              onPress={connect}
              style={styles.walletRow}
            >
              <View style={[styles.walletIcon, { backgroundColor: C.lavenderSoft }]}>
                <Ionicons name="wallet" size={22} color={C.brand} />
              </View>
              <View style={styles.walletText}>
                <Text style={styles.walletName}>Browser wallet</Text>
                <Text style={styles.walletAddr}>
                  MetaMask, Rabby or any injected wallet
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.inkFaint} />
            </PressableScale>
          ) : (
            <View style={[styles.walletRow, styles.walletRowOff]} testID="wallet-none-available">
              <View style={[styles.walletIcon, { backgroundColor: C.surface2 }]}>
                <Ionicons name="cube-outline" size={22} color={C.inkFaint} />
              </View>
              <View style={styles.walletText}>
                <Text style={[styles.walletName, { color: C.inkFaint }]}>
                  No browser wallet found
                </Text>
                <Text style={styles.walletAddr}>
                  Install a wallet that supports Monad Mainnet to continue
                </Text>
              </View>
            </View>
          )}
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
          <Text style={styles.caption}>
            Approve the connection in your wallet.
          </Text>
        </View>
      )}
    </Sheet>
  );
}

// ——— Vajra Touch ceremony (real wallet signature / passkey prompt) ———

export function VajraTouchSheet({
  visible,
  onDone,
  title,
  caption,
  details,
  onAuthenticate,
  actionLabel = "Authenticate with Vajra Touch",
  note,
}: {
  visible: boolean;
  onDone: (result: "approved" | "cancelled") => void;
  title: string;
  caption: string;
  details?: { label: string; value: string }[];
  /**
   * Real authentication work (EIP-712 signature or WebAuthn ceremony).
   * Resolve on success; throw a VajraError (or anything classifiable) on
   * failure. WALLET_REJECTED is reported as "cancelled".
   */
  onAuthenticate?: () => Promise<void>;
  actionLabel?: string;
  /** Small print under the ceremony. Honest status only. */
  note?: string;
}) {
  const [phase, setPhase] = useState<"prompt" | "authorizing" | "success">("prompt");
  const [error, setError] = useState<{ title: string; body: string } | null>(null);
  const alive = useRef(true);
  const reduceMotion = useMotionPref();

  useEffect(() => {
    alive.current = true;
    if (visible) {
      setPhase("prompt");
      setError(null);
    }
    return () => {
      alive.current = false;
    };
  }, [visible]);

  const authenticate = async () => {
    setError(null);
    setPhase("authorizing");
    try {
      if (onAuthenticate) await onAuthenticate();
      if (!alive.current) return;
      triggerHaptic("success");
      setPhase("success");
      setTimeout(() => {
        if (alive.current) onDone("approved");
      }, 700);
    } catch (err) {
      if (!alive.current) return;
      const classified = classifyError(err);
      if (classified.code === ("WALLET_REJECTED" as ErrorCode)) {
        onDone("cancelled");
        return;
      }
      const copy = userCopy(classified.code);
      setError({ title: copy.title, body: copy.whatHappened });
      setPhase("prompt");
    }
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
            ? "Waiting for your wallet…"
            : phase === "success"
              ? "Your wallet signed these exact terms."
              : caption}
        </Text>
        {note ? <Text style={styles.protoNote}>{note}</Text> : null}
      </View>

      {error && phase === "prompt" ? (
        <View style={styles.errorBox} testID="vajra-touch-error">
          <Ionicons name="alert-circle" size={16} color={C.error} />
          <Text style={styles.errorText}>
            {error.title}. {error.body}
          </Text>
        </View>
      ) : null}

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
            label={actionLabel}
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
    textAlign: "center",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: S.sm,
    backgroundColor: C.errorBg,
    borderRadius: R.md,
    padding: S.md,
    marginBottom: S.md,
  },
  errorText: {
    flex: 1,
    fontFamily: F.med,
    fontSize: 12.5,
    lineHeight: 18,
    color: C.error,
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
});
