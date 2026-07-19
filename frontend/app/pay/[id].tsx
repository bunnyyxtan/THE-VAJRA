import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import Button from "@/src/components/Button";
import Screen from "@/src/components/Screen";
import Skeleton from "@/src/components/Skeleton";
import { EmptyState, ErrorCard } from "@/src/components/StateViews";
import VerifiedField, { VerifyState } from "@/src/components/VerifiedField";
import { useBreakpoint } from "@/src/hooks/use-breakpoint";
import { ConnectWalletSheet } from "@/src/components/WalletSheets";
import { triggerHaptic } from "@/src/components/PressableScale";
import {
  fmtDateTime,
  fmtMon,
  shortAddr,
  shortHash,
  timeUntil,
} from "@/src/lib/format";
import { getChainConfig } from "@/src/lib/web3/chain";
import { getPublicClient } from "@/src/lib/web3/client";
import { inspectRequest, buildFulfillTx } from "@/src/lib/web3/contracts";
import { decodePayload } from "@/src/lib/web3/vajra/decode";
import { VALIDATION_CODE } from "@/src/lib/web3/vajra/types";
import { getVajraWallet } from "@/src/lib/web3/wallet";
import type { Address } from "viem";
const delay = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
import { useToast } from "@/src/components/Toast";
import { useMotionPref, useVajra } from "@/src/state/vajra";
import { C, F, R, S, cardShadow } from "@/src/theme";

type Phase =
  | "checking"
  | "unavailable"
  | "broken"
  | "expired"
  | "revoked"
  | "paid"
  | "ready";

export default function VerifyAndPay() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getRequest, wallet, setWallet, setWalletNetwork, settings, updateRequest } =
    useVajra();
  const reduceMotion = useMotionPref();
  const { toast } = useToast();
  const { isDesktop } = useBreakpoint();

  const request = id ? getRequest(String(id)) : undefined;

  const fields = useMemo(() => {
    if (!request) return [];
    const f: {
      label: string;
      value: string;
      fullValue?: string;
      mono?: boolean;
      big?: boolean;
      sub?: string;
    }[] = [
      { label: "Amount", value: `${fmtMon(request.amountMon)} MON`, big: true },
      {
        label: "Recipient",
        value: shortAddr(request.recipient),
        fullValue: request.recipient,
        mono: true,
        sub: request.recipientLabel && request.recipientLabel !== "You"
          ? `Labelled “${request.recipientLabel}”. Vajra verifies the address, not the identity.`
          : undefined,
      },
      { label: "Network", value: request.network },
      {
        label: "Settlement contract",
        value: shortAddr(request.contract),
        fullValue: request.contract,
        mono: true,
      },
      {
        label: "Expires",
        value: request.expiresAt
          ? fmtDateTime(request.expiresAt)
          : "No expiry",
        sub:
          request.status === "active" && timeUntil(request.expiresAt)
            ? `In ${timeUntil(request.expiresAt)}`
            : undefined,
      },
      {
        label: "Who can pay",
        value: request.restrictedPayer
          ? shortAddr(request.restrictedPayer)
          : "Anyone",
        fullValue: request.restrictedPayer || undefined,
        mono: Boolean(request.restrictedPayer),
      },
    ];
    if (request.memo) f.push({ label: "Memo", value: request.memo });
    f.push({
      label: "Recipient signature",
      value: shortHash(request.signature),
      fullValue: request.signature,
      mono: true,
    });
    return f;
  }, [request]);

  const [phase, setPhase] = useState<Phase>("checking");
  const [fieldStates, setFieldStates] = useState<VerifyState[]>([]);
  const [connectOpen, setConnectOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [paying, setPaying] = useState(false);
  const runToken = useRef(0);
  const netDemoDone = useRef(false);
  const walletRef = useRef(wallet);
  walletRef.current = wallet;

  const verify = useCallback(async () => {
    if (!request) return;
    const token = ++runToken.current;
    setPhase("checking");
    setFieldStates(fields.map(() => "idle"));
    await delay(reduceMotion ? 300 : 800);
    if (token !== runToken.current) return;

    try {
      if (!request.payload && request.scenario) {
        // deterministic sample preview — staged reveal, designed outcome,
        // no onchain verification claimed
        for (let i = 0; i < fields.length; i++) {
          setFieldStates((prev) => prev.map((st, j) => (j === i ? "verifying" : st)));
          await delay(reduceMotion ? 40 : 140);
          if (token !== runToken.current) return;
          if (request.scenario === "invalid-signature" && i === fields.length - 1) {
            setFieldStates(fields.map(() => "broken"));
            triggerHaptic("error");
            setPhase("broken");
            return;
          }
          setFieldStates((prev) => prev.map((st, j) => (j === i ? "verified" : st)));
        }
        if (request.scenario === "rpc-unavailable") setPhase("unavailable");
        else if (request.scenario === "expired") setPhase("expired");
        else if (request.scenario === "revoked") setPhase("revoked");
        else if (request.scenario === "already-paid") setPhase("paid");
        else setPhase("ready");
        return;
      }
      if (!request.payload) {
        setPhase("broken");
        return;
      }
      const config = getChainConfig();
      const decoded = decodePayload(request.payload, {
        chainId: config.chainId,
        verifyingContract: config.contractAddress,
      });
      const proof = decoded.proof;
      const client = getPublicClient(config);
      const payer = (walletRef.current?.address ??
        "0x0000000000000000000000000000000000000000") as Address;

      // staged field reveal preserved from the design; the check itself is
      // one authoritative onchain inspect call
      for (let i = 0; i < fields.length; i++) {
        setFieldStates((prev) => prev.map((st, j) => (j === i ? "verifying" : st)));
        await delay(reduceMotion ? 40 : 140);
        if (token !== runToken.current) return;
        setFieldStates((prev) => prev.map((st, j) => (j === i ? "verified" : st)));
      }

      const { code } = await inspectRequest(client, decoded.request, proof, payer, config);
      if (token !== runToken.current) return;

      if (code === VALIDATION_CODE.Expired) setPhase("expired");
      else if (code === VALIDATION_CODE.Revoked) setPhase("revoked");
      else if (code === VALIDATION_CODE.AlreadyPaid) setPhase("paid");
      else if (code === VALIDATION_CODE.Valid || code === VALIDATION_CODE.WrongPayer) setPhase("ready");
      else {
        setFieldStates(fields.map(() => "broken"));
        triggerHaptic("error");
        setPhase("broken");
      }
    } catch (err) {
      if (token !== runToken.current) return;
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("RPC") || msg.includes("fetch") || msg.includes("timeout") || msg.includes("network")) {
        setPhase("unavailable");
      } else {
        setPhase("broken");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.id, request?.status, fields.length, reduceMotion]);

  useFocusEffect(
    useCallback(() => {
      setPaying(false);
      verify();
      return () => {
        runToken.current++;
      };
    }, [verify]),
  );

  if (!request) {
    return (
      <Screen title="Payment request" testID="pay-screen">
        <EmptyState
          testID="pay-not-found"
          icon="help-circle-outline"
          title="Request not found"
          body="Check the full link or code with the sender and try again. No money moved."
          actionLabel="Open a different link"
          onAction={() => router.replace("/open-link")}
        />
      </Screen>
    );
  }

  const wrongNetwork = wallet && wallet.network !== "Monad Mainnet";
  const wrongPayer =
    wallet &&
    request.restrictedPayer &&
    wallet.address.toLowerCase() !== request.restrictedPayer.toLowerCase();

  const payBlocker = !wallet
    ? null
    : wrongNetwork
      ? "Switch your wallet to Monad Mainnet to pay this request."
      : wrongPayer
        ? `Only ${shortAddr(request.restrictedPayer!)} can pay this request.`
        : null;

  const footer =
    phase === "ready" ? (
      !wallet ? (
        <Button
          label="Connect wallet to pay"
          icon="wallet"
          onPress={() => setConnectOpen(true)}
          testID="pay-connect-wallet-button"
        />
      ) : (
        <Button
          label={`Pay ${fmtMon(request.amountMon)} MON`}
          icon="shield-checkmark"
          loading={paying}
          loadingLabel="Opening wallet…"
          disabled={Boolean(payBlocker)}
          disabledReason={payBlocker || undefined}
          onPress={async () => {
            if (paying) return;
            if (!request.payload) {
              toast("Sample request — create and share a real Vajra request to pay onchain.");
              return;
            }
            setPaying(true);
            try {
              const config = getChainConfig();
              const decoded = decodePayload(request.payload!, {
                chainId: config.chainId,
                verifyingContract: config.contractAddress,
              });
              const proof = decoded.proof;
              const vw = getVajraWallet();
              const account = await vw.currentAccount();
              if (!account) throw new Error("wallet disconnected");
              if (account.chainId !== 143) await vw.switchToMonad();
              const tx = buildFulfillTx(decoded.request, proof, config);
              const hash = await vw.sendTransaction(account.address, tx);
              updateRequest(request.id, { txHash: hash });
              router.push((`/progress/${request.id}?tx=${hash}`) as never);
            } catch (err) {
              setPaying(false);
            }
          }}
          testID="pay-button"
        />
      )
    ) : undefined;

  const bannerBlock = (
    <View style={styles.bannerSlot} accessibilityLiveRegion="polite">
        {phase === "checking" ? (
          <View style={[styles.banner, { backgroundColor: C.surface2 }]}>
            <Skeleton w={18} h={18} r={9} />
            <Text style={styles.bannerTextNeutral}>
              Verifying the recipient’s authentication with Monad…
            </Text>
          </View>
        ) : phase === "broken" ? (
          <View style={[styles.banner, { backgroundColor: C.errorBg }]} testID="pay-banner-broken">
            <Ionicons name="close-circle" size={18} color={C.error} />
            <Text style={[styles.bannerText, { color: C.error }]}>
              Authentication failed. The contents of this link do not match
              the signed terms.
            </Text>
          </View>
        ) : phase === "unavailable" ? (
          <View style={[styles.banner, { backgroundColor: C.warningBg }]} testID="pay-banner-unavailable">
            <Ionicons name="cloud-offline" size={18} color={C.warning} />
            <Text style={[styles.bannerText, { color: C.warning }]}>
              Verification unavailable. Payment stays disabled until Vajra can
              verify.
            </Text>
          </View>
        ) : (
          <Animated.View
            entering={reduceMotion ? undefined : FadeInDown.duration(280)}
            style={[styles.banner, { backgroundColor: C.infoBg }]}
            testID="pay-banner-verified"
          >
            <Ionicons name="shield-checkmark" size={18} color={C.info} />
            <Text style={[styles.bannerText, { color: C.info }]}>
              Verified by Vajra. The signature matches every protected field
              below.
            </Text>
          </Animated.View>
        )}
    </View>
  );

  const outcomeBlock = (
    <>
      {phase === "unavailable" ? (
        <View style={{ marginBottom: S.lg }}>
          <ErrorCard
            testID="pay-unavailable-card"
            tone="warning"
            icon="cloud-offline"
            title="Vajra can't verify this request right now"
            moneyLine="No money moved"
            body="Monad could not be reached, so the recipient's signature and the request status can't be checked. Paying is disabled until verification succeeds. Retrying is safe."
            actionLabel="Retry verification"
            onAction={verify}
          />
        </View>
      ) : null}
      {phase === "broken" ? (
        <View style={{ marginBottom: S.lg }}>
          <ErrorCard
            testID="pay-broken-card"
            tone="error"
            icon="warning"
            title="Do not pay this request"
            moneyLine="No money moved"
            body="The details in this link don't match what the recipient locked and signed, so it may have been altered in transit. Payment has been removed. Ask the recipient to send a fresh Vajra link."
            actionLabel="Open a different link"
            onAction={() => router.replace("/open-link")}
          />
        </View>
      ) : null}
      {phase === "expired" ? (
        <View style={{ marginBottom: S.lg }}>
          <ErrorCard
            testID="pay-expired-card"
            tone="warning"
            icon="time"
            title="This request expired"
            moneyLine="No money moved"
            body={`It stopped being payable on ${request.expiresAt ? fmtDateTime(request.expiresAt) : "its expiry"}. If you still owe this payment, ask ${shortAddr(request.recipient)} for a new Vajra link.`}
          />
        </View>
      ) : null}
      {phase === "revoked" ? (
        <View style={{ marginBottom: S.lg }}>
          <ErrorCard
            testID="pay-revoked-card"
            tone="error"
            icon="ban"
            title="The recipient revoked this request"
            moneyLine="No money moved"
            body="It can no longer be paid. If you still owe this payment, ask the recipient for a new Vajra link."
          />
        </View>
      ) : null}
      {phase === "paid" ? (
        <View style={{ marginBottom: S.lg }}>
          <ErrorCard
            testID="pay-already-paid-card"
            tone="success"
            icon="checkmark-done-circle"
            title="Already settled"
            body={`This request was paid${request.paidAt ? ` on ${fmtDateTime(request.paidAt)}` : ""} and can only be paid once. No additional payment is possible.`}
            actionLabel="View permanent receipt"
            onAction={() => router.push(`/receipt/${request.id}` as never)}
          />
        </View>
      ) : null}

      {/* Wallet gating — inline, next to the cause */}
      {phase === "ready" && wallet && wrongNetwork ? (
        <View style={{ marginBottom: S.lg }}>
          <ErrorCard
            testID="pay-wrong-network-card"
            tone="warning"
            icon="git-network"
            title="Wrong network"
            moneyLine="No money moved"
            body={`Your wallet is on ${wallet.network}, but this request settles on Monad Mainnet. Switch networks to continue. Retrying is safe.`}
            actionLabel="Switch to Monad Mainnet"
            actionLoading={switching}
            onAction={async () => {
              setSwitching(true);
              await delay(900);
              setWalletNetwork("Monad Mainnet");
              setSwitching(false);
              triggerHaptic("success");
            }}
          />
        </View>
      ) : null}
      {phase === "ready" && wallet && !wrongNetwork && wrongPayer ? (
        <View style={{ marginBottom: S.lg }}>
          <ErrorCard
            testID="pay-wrong-wallet-card"
            tone="error"
            icon="person-remove"
            title={`Only ${shortAddr(request.restrictedPayer!)} can pay this`}
            moneyLine="No money moved"
            body={`The recipient restricted this request to a specific payer. Your connected wallet ${shortAddr(wallet.address)} can't complete it. Connect the approved wallet, or ask the recipient to remove the restriction.`}
            actionLabel="Use a different wallet"
            onAction={() => setConnectOpen(true)}
          />
        </View>
      ) : null}
    </>
  );

  const fieldsBlock = (
    <>
      <Text style={styles.sectionLabel}>PROTECTED BY THE RECIPIENT</Text>
      <View style={{ gap: S.md }}>
        {phase === "checking" && fieldStates.every((s) => s === "idle") ? (
          <View style={{ gap: S.md }} testID="pay-skeleton">
            <Skeleton h={86} r={R.md + 2} />
            <Skeleton h={64} r={R.md + 2} />
            <Skeleton h={64} r={R.md + 2} />
            <Skeleton h={64} r={R.md + 2} />
          </View>
        ) : (
          fields.map((f, i) => (
            <VerifiedField
              key={f.label}
              testID={`pay-field-${i}`}
              label={f.label}
              value={f.value}
              fullValue={f.fullValue}
              mono={f.mono}
              big={f.big}
              sub={f.sub}
              state={fieldStates[i] || "idle"}
            />
          ))
        )}
      </View>
    </>
  );

  const walletBlock =
    phase === "ready" ? (
      <View style={[styles.walletCard, cardShadow]} testID="pay-wallet-card">
          <Text style={styles.sectionLabelTight}>PAYING FROM</Text>
          {wallet ? (
            <View style={styles.walletRow}>
              <View style={styles.walletIcon}>
                <Ionicons name="wallet" size={18} color={C.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.walletAddr}>{shortAddr(wallet.address)}</Text>
                <Text
                  style={[
                    styles.walletNet,
                    wrongNetwork ? { color: C.warning } : { color: C.success },
                  ]}
                >
                  {wallet.network}
                  {wrongNetwork ? " · wrong network" : ""}
                </Text>
              </View>
              <Button
                label="Change"
                variant="ghost"
                small
                onPress={() => setConnectOpen(true)}
                testID="pay-change-wallet"
              />
            </View>
          ) : (
            <Text style={styles.walletNone}>
              No wallet connected yet. You can review everything first.
            </Text>
          )}
      </View>
    ) : null;

  return (
    <Screen
      title="Payment request"
      subtitle={request.id}
      onBack={() => (router.canGoBack() ? router.back() : router.replace("/"))}
      footer={footer}
      maxWidth={1024}
      testID="pay-screen"
    >
      <Text style={styles.publicNote}>
        Anyone with this link can review this request. A wallet is only needed
        to pay.
      </Text>

      {isDesktop ? (
        <View style={styles.cols}>
          <View style={styles.colMain}>{fieldsBlock}</View>
          <View style={styles.colAside}>
            {bannerBlock}
            {outcomeBlock}
            {walletBlock}
          </View>
        </View>
      ) : (
        <>
          {bannerBlock}
          {outcomeBlock}
          {fieldsBlock}
          {walletBlock}
        </>
      )}

      <ConnectWalletSheet
        visible={connectOpen}
        onClose={() => setConnectOpen(false)}
        onConnected={setWallet}
        forceNetwork={
          request.scenario === "wrong-network" && !wallet
            ? "Ethereum Mainnet"
            : undefined
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  cols: {
    flexDirection: "row",
    gap: S.xxxl,
    alignItems: "flex-start",
  },
  colMain: { flex: 1.15, minWidth: 0 },
  colAside: { flex: 1, maxWidth: 420, minWidth: 0 },
  publicNote: {
    fontFamily: F.med,
    fontSize: 12,
    lineHeight: 17,
    color: C.inkFaint,
    marginBottom: S.md,
  },
  bannerSlot: { minHeight: 52, marginBottom: S.lg, justifyContent: "center" },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.sm,
    borderRadius: R.md + 2,
    paddingHorizontal: S.md,
    paddingVertical: S.md,
  },
  bannerText: { flex: 1, fontFamily: F.semi, fontSize: 12.5, lineHeight: 17 },
  bannerTextNeutral: {
    flex: 1,
    fontFamily: F.semi,
    fontSize: 12.5,
    lineHeight: 17,
    color: C.inkSoft,
  },
  sectionLabel: {
    fontFamily: F.bold,
    fontSize: 10.5,
    letterSpacing: 1.2,
    color: C.inkFaint,
    marginBottom: S.md,
  },
  sectionLabelTight: {
    fontFamily: F.bold,
    fontSize: 10.5,
    letterSpacing: 1.2,
    color: C.inkFaint,
    marginBottom: S.sm,
  },
  walletCard: {
    backgroundColor: C.white,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    padding: S.lg,
    marginTop: S.xl,
  },
  walletRow: { flexDirection: "row", alignItems: "center", gap: S.md },
  walletIcon: {
    width: 38,
    height: 38,
    borderRadius: R.md,
    backgroundColor: C.lavenderSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  walletAddr: { fontFamily: F.semi, fontSize: 14, color: C.ink },
  walletNet: { fontFamily: F.med, fontSize: 12, marginTop: 2 },
  walletNone: { fontFamily: F.med, fontSize: 13, lineHeight: 19, color: C.inkSoft },
});
