import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";

import Button from "@/src/components/Button";
import PressableScale, { triggerHaptic } from "@/src/components/PressableScale";
import Screen from "@/src/components/Screen";
import { ErrorCard } from "@/src/components/StateViews";
import VerifiedField from "@/src/components/VerifiedField";
import { useBreakpoint } from "@/src/hooks/use-breakpoint";
import {
  ConnectWalletSheet,
  VajraTouchSheet,
} from "@/src/components/WalletSheets";
import {
  fmtDateTime,
  fmtMon,
  fmtUsd,
  isHexAddress,
  shortAddr,
} from "@/src/lib/format";
import { getChainConfig } from "@/src/lib/web3/chain";
import { parseDecimalToUnits } from "@/src/lib/web3/amount";
import { computeRequestId, paymentRequestTypedData } from "@/src/lib/web3/vajra/hash";
import { encodePayload, walletShareProof } from "@/src/lib/web3/vajra/encode";
import { memoHashOf, MIN_LIFETIME_SECONDS, MAX_LIFETIME_SECONDS, ANY_PAYER } from "@/src/lib/web3/vajra/domain";
import { getVajraWallet } from "@/src/lib/web3/wallet";
import { vajraCodeFromRequestId } from "@/src/lib/web3/vajra/fingerprint";
import { getAddress, type Address } from "viem";

const MON_USD = 3.42; // display-only estimate
const delay = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
import type { PaymentRequest } from "@/src/lib/types";
import { useMotionPref, useVajra } from "@/src/state/vajra";
import { C, F, MONO, R, S, cardShadow } from "@/src/theme";

const EXPIRY_OPTIONS = [
  { key: "1h", label: "1 hour", hours: 1 },
  { key: "24h", label: "24 hours", hours: 24 },
  { key: "7d", label: "7 days", hours: 168 },
  { key: "30d", label: "30 days", hours: 720 },
  { key: "none", label: "No expiry", hours: null },
] as const;

type ExpiryKey = (typeof EXPIRY_OPTIONS)[number]["key"];

const validateAmount = (raw: string): string | null => {
  const v = raw.trim();
  if (!v) return "Enter an amount greater than 0 MON to continue.";
  if (!/^\d*\.?\d*$/.test(v)) return "Use numbers and a single decimal point only.";
  const n = parseFloat(v);
  if (!isFinite(n) || n <= 0)
    return "Enter an amount greater than 0 MON to continue.";
  if (n > 1_000_000_000) return "That amount is above the 1,000,000,000 MON limit.";
  const dec = v.split(".")[1];
  if (dec && dec.length > 6) return "MON amounts support up to 6 decimal places.";
  return null;
};

export default function CreateRequest() {
  const router = useRouter();
  const { hydrated, passkey, setPasskey, wallet, setWallet, addRequest } = useVajra();
  const reduceMotion = useMotionPref();
  const { isDesktop } = useBreakpoint();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [amount, setAmount] = useState("");
  const [amountTouched, setAmountTouched] = useState(false);
  const [memo, setMemo] = useState("");
  const [expiry, setExpiry] = useState<ExpiryKey>("24h");
  const [restrictPayer, setRestrictPayer] = useState(false);
  const [payerAddr, setPayerAddr] = useState("");
  const [payerTouched, setPayerTouched] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [touchOpen, setTouchOpen] = useState(false);
  const [authCancelled, setAuthCancelled] = useState(false);
  const [phase, setPhase] = useState<"review" | "locking" | "locked">("review");
  const [lockedCount, setLockedCount] = useState(0);
  const createdRef = useRef<PaymentRequest | null>(null);

  const amountError = validateAmount(amount);
  const showAmountError = amountTouched && amount.trim().length > 0 && amountError;
  const amtLen = Math.max(amount.length, 1);
  const amtFont = amtLen <= 7 ? 56 : amtLen <= 10 ? 44 : amtLen <= 13 ? 36 : 30;
  const payerValid = isHexAddress(payerAddr);
  const payerError =
    restrictPayer && payerTouched && payerAddr.trim().length > 0 && !payerValid
      ? "Enter a complete wallet address (0x + 40 hex characters)."
      : null;

  const expiryOpt = EXPIRY_OPTIONS.find((e) => e.key === expiry)!;
  const expiresAtIso = useMemo(
    () =>
      expiryOpt.hours
        ? new Date(Date.now() + expiryOpt.hours * 3600_000).toISOString()
        : null,
    [expiryOpt],
  );

  const step2Blocker = !wallet
    ? "Connect your wallet so Vajra knows where funds settle."
    : restrictPayer && !payerValid
      ? "Enter a valid payer wallet address, or turn off the payer restriction."
      : null;

  const reviewFields = useMemo(() => {
    const f = [
      { label: "Amount", value: `${fmtMon(amount || "0")} MON`, big: true },
      {
        label: "To (your wallet)",
        value: wallet ? shortAddr(wallet.address) : "—",
        fullValue: wallet?.address,
        mono: true,
      },
      { label: "Network", value: "Monad Mainnet" },
      {
        label: "Settlement contract",
        value: shortAddr(getChainConfig().contractAddress),
        fullValue: getChainConfig().contractAddress,
        mono: true,
      },
      {
        label: "Expires",
        value: expiresAtIso ? fmtDateTime(expiresAtIso) : "No expiry",
      },
      {
        label: "Who can pay",
        value: restrictPayer && payerValid ? shortAddr(payerAddr) : "Anyone",
        fullValue: restrictPayer && payerValid ? payerAddr.trim() : undefined,
        mono: restrictPayer && payerValid,
      },
    ];
    if (memo.trim()) f.push({ label: "Memo", value: memo.trim() });
    return f;
  }, [amount, wallet, expiresAtIso, restrictPayer, payerValid, payerAddr, memo]);

  const startLocking = async () => {
    setPhase("locking");
    try {
      const config = getChainConfig();
      const recipient = getAddress(wallet!.address);
      const payer =
        restrictPayer && payerValid ? getAddress(payerAddr.trim()) : ANY_PAYER;
      const amountWei = parseDecimalToUnits(amount.trim(), 18);
      if (amountWei === null || amountWei <= 0n) throw new Error("bad amount");
      const issuedAt = BigInt(Math.floor(Date.now() / 1000));
      const expiresAtSec = expiresAtIso
        ? BigInt(Math.floor(new Date(expiresAtIso).getTime() / 1000))
        : issuedAt + MAX_LIFETIME_SECONDS;
      if (expiresAtSec - issuedAt < MIN_LIFETIME_SECONDS)
        throw new Error("lifetime too short");
      const nonceBytes = new Uint8Array(32);
      globalThis.crypto.getRandomValues(nonceBytes);
      const nonce = ("0x" + Array.from(nonceBytes, (b) => b.toString(16).padStart(2, "0")).join("")) as `0x${string}`;
      const memoText = memo.trim();
      const contractReq = {
        recipient,
        payer,
        amount: amountWei,
        issuedAt,
        expiresAt: expiresAtSec,
        nonce,
        memoHash: memoHashOf(memoText),
        authMode: 0 as const,
        authVersion: 0,
      };
      const typedData = paymentRequestTypedData(contractReq);
      const vw = getVajraWallet();
      if (typedData.domain.chainId !== 143) throw new Error("bad domain");
      const account = await vw.currentAccount();
      if (!account) throw new Error("wallet disconnected");
      if (account.chainId !== 143) await vw.switchToMonad();
      const signature = await vw.signTypedData(account.address, typedData);
      const requestId = computeRequestId(contractReq);
      const payload = encodePayload({
        chainId: config.chainId,
        verifyingContract: config.contractAddress,
        request: contractReq,
        memo: memoText,
        proof: walletShareProof(signature),
      });
      const id = requestId;
      for (let i = 1; i <= reviewFields.length; i++) {
        // terms visibly lock one by one after authentication
        await delay(reduceMotion ? 30 : 160);
        setLockedCount(i);
      }
      const req: PaymentRequest = {
        id,
        amountMon: amount.trim(),
        recipient,
        recipientLabel: "You",
        memo: memoText || undefined,
        network: "Monad Mainnet",
        contract: config.contractAddress,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAtIso,
        restrictedPayer: payer === ANY_PAYER ? null : payer.toLowerCase(),
        status: "active",
        authMethod: "wallet-signature",
        signature,
        mine: true,
        payload,
      };
      createdRef.current = req;
      addRequest(req);
      await delay(300);
      triggerHaptic("success");
      setPhase("locked");
    } catch (err) {
      setPhase("review");
      setAuthCancelled(true);
    }
  };

  const goBack = () => {
    if (phase !== "review") return; // terms are locked — leave via Share
    if (step > 1) setStep((s) => (s - 1) as 1 | 2);
    else router.back();
  };

  const footer = (() => {
    if (step === 1)
      return (
        <Button
          label="Continue to terms"
          icon="arrow-forward"
          onPress={() => {
            Keyboard.dismiss();
            setStep(2);
          }}
          disabled={Boolean(amountError)}
          disabledReason={amount.trim() ? amountError || undefined : "Enter an amount greater than 0 MON to continue."}
          testID="create-continue-terms"
        />
      );
    if (step === 2)
      return (
        <Button
          label="Review request"
          icon="arrow-forward"
          onPress={() => {
            Keyboard.dismiss();
            setStep(3);
          }}
          disabled={Boolean(step2Blocker)}
          disabledReason={step2Blocker || undefined}
          testID="create-review-request"
        />
      );
    if (phase === "locked")
      return (
        <Button
          label="Share request"
          icon="qr-code"
          onPress={() =>
            router.replace(`/share/${createdRef.current?.id}` as never)
          }
          testID="create-share-request"
        />
      );
    return (
      <Button
        label="Lock & authenticate"
        icon="finger-print"
        loading={phase === "locking"}
        loadingLabel="Locking terms…"
        onPress={() => {
          setAuthCancelled(false);
          setTouchOpen(true);
        }}
        disabled={!passkey}
        disabledReason={
          !passkey
            ? "Set up Vajra Touch below to authenticate these terms."
            : undefined
        }
        testID="create-lock-authenticate"
      />
    );
  })();

  return (
    <Screen
      title="New request"
      subtitle={`Step ${step} of 3 · ${step === 1 ? "Amount" : step === 2 ? "Terms" : "Review & authenticate"}`}
      onBack={goBack}
      footer={footer}
      maxWidth={1024}
      testID="create-screen"
      belowHeader={
        <View style={styles.progressRow}>
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.progressSeg,
                i <= step && { backgroundColor: C.brand },
              ]}
            />
          ))}
        </View>
      }
    >
      <View style={isDesktop ? styles.cols : undefined}>
      <View style={isDesktop ? styles.colMain : undefined}>
      {step === 1 ? (
        <View>
          <Text style={styles.stepTitle}>How much are you{"\n"}requesting?</Text>
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>AMOUNT · NATIVE MON</Text>
            <TextInput
              testID="create-amount-input"
              accessibilityLabel="Amount in MON"
              style={[
                styles.amountInput,
                { fontSize: amtFont, lineHeight: Math.round(amtFont * 1.2) },
              ]}
              value={amount}
              onChangeText={(t) => setAmount(t.replace(",", "."))}
              onBlur={() => setAmountTouched(true)}
              keyboardType="decimal-pad"
              inputMode="decimal"
              placeholder="0"
              placeholderTextColor={C.surface3}
              maxLength={15}
              returnKeyType="done"
              textAlign="center"
            />
            <View style={styles.amountMetaRow}>
              {!amountError ? (
                <Animated.View
                  entering={reduceMotion ? undefined : ZoomIn.duration(200)}
                  style={styles.validRow}
                >
                  <Ionicons name="checkmark-circle" size={15} color={C.infoBright} />
                  <Text style={styles.usdText}>Settles on Monad Mainnet</Text>
                </Animated.View>
              ) : showAmountError ? (
                <Text testID="create-amount-error" style={styles.amountError}>
                  {amountError}
                </Text>
              ) : (
                <Text style={styles.usdText}>Settles on Monad Mainnet</Text>
              )}
            </View>
          </View>
          <View style={styles.quickRow}>
            {["5", "25", "100"].map((v) => (
              <PressableScale
                key={v}
                testID={`create-quick-${v}`}
                accessibilityLabel={`Set amount to ${v} MON`}
                onPress={() => {
                  setAmount(v);
                  setAmountTouched(true);
                }}
                style={styles.quickChip}
                haptic={null}
              >
                <Text style={styles.quickText}>{v} MON</Text>
              </PressableScale>
            ))}
          </View>
          <Text style={styles.amountHint}>
            Your payer sees this exact amount. Vajra never rounds it.
          </Text>
        </View>
      ) : null}

      {step === 2 ? (
        <View>
          <Text style={styles.stepTitle}>Terms of this request</Text>

          <Text style={styles.fieldLabel}>YOU RECEIVE TO · REQUIRED</Text>
          {wallet ? (
            <View style={styles.recipientCard} testID="create-recipient-card">
              <View style={styles.recipientRow}>
                <View style={styles.recipientIcon}>
                  <Ionicons name="wallet" size={18} color={C.brand} />
                </View>
                <View style={styles.recipientText}>
                  <Text style={styles.recipientAddr}>{shortAddr(wallet.address)}</Text>
                  <Text style={styles.recipientSub}>
                    Your connected wallet · {wallet.network}
                  </Text>
                </View>
                <Ionicons name="checkmark-circle" size={20} color={C.infoBright} />
              </View>
            </View>
          ) : (
            <View style={styles.recipientCard}>
              <Text style={styles.recipientSub}>
                Vajra prefills your connected wallet as the protected
                destination.
              </Text>
              <Button
                label="Connect wallet"
                icon="wallet"
                variant="secondary"
                small
                onPress={() => setConnectOpen(true)}
                style={{ marginTop: S.md }}
                testID="create-connect-wallet"
              />
            </View>
          )}

          <Text style={styles.fieldLabel}>MEMO · OPTIONAL</Text>
          <View style={styles.memoWrap}>
            <TextInput
              testID="create-memo-input"
              accessibilityLabel="Memo, optional"
              style={styles.memoInput}
              value={memo}
              onChangeText={(t) => t.length <= 64 && setMemo(t)}
              placeholder="What is this payment for?"
              placeholderTextColor={C.inkFaint}
              multiline
            />
            <Text style={styles.memoCounter}>{memo.length}/64</Text>
          </View>
          <Text style={styles.helper}>
            The memo is signed with your terms and shown to the payer.
          </Text>

          <Text style={styles.fieldLabel}>EXPIRES · REQUIRED</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.expiryRowContent}
            style={styles.expiryRow}
          >
            {EXPIRY_OPTIONS.map((o) => {
              const selected = o.key === expiry;
              return (
                <PressableScale
                  key={o.key}
                  testID={`create-expiry-${o.key}`}
                  accessibilityLabel={`Expiry: ${o.label}`}
                  onPress={() => setExpiry(o.key)}
                  style={[styles.expiryChip, selected && styles.expiryChipOn]}
                  haptic={null}
                >
                  <Text
                    style={[styles.expiryText, selected && styles.expiryTextOn]}
                  >
                    {o.label}
                  </Text>
                </PressableScale>
              );
            })}
          </ScrollView>
          <Text style={styles.helper}>
            {expiresAtIso
              ? `Payable until ${fmtDateTime(expiresAtIso)}.`
              : "This request stays payable until you revoke it."}
          </Text>

          <PressableScale
            testID="create-toggle-restrict-payer"
            accessibilityLabel="Restrict who can pay"
            onPress={() => setRestrictPayer((v) => !v)}
            style={styles.advancedRow}
            haptic={null}
          >
            <Ionicons
              name={restrictPayer ? "chevron-down" : "chevron-forward"}
              size={16}
              color={C.inkSoft}
            />
            <Text style={styles.advancedText}>Restrict who can pay</Text>
            <Text style={styles.advancedHint}>
              {restrictPayer ? "On" : "Optional"}
            </Text>
          </PressableScale>
          {restrictPayer ? (
            <View>
              <View
                style={[
                  styles.payerInputWrap,
                  payerError ? { borderColor: C.errorBright } : null,
                  payerValid ? { borderColor: "#BFE9FB" } : null,
                ]}
              >
                <TextInput
                  testID="create-payer-input"
                  accessibilityLabel="Approved payer wallet address"
                  style={styles.payerInput}
                  value={payerAddr}
                  onChangeText={(t) => setPayerAddr(t.trim())}
                  onBlur={() => setPayerTouched(true)}
                  placeholder="0x…"
                  placeholderTextColor={C.inkFaint}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {payerValid ? (
                  <Ionicons name="checkmark-circle" size={20} color={C.infoBright} />
                ) : null}
              </View>
              <Text
                testID="create-payer-helper"
                style={payerError ? styles.amountError : styles.helper}
              >
                {payerError ||
                  (payerValid
                    ? `Only ${shortAddr(payerAddr)} will be able to complete this payment. Vajra validates the address format, not the owner's identity.`
                    : "Only this wallet will be able to complete the payment.")}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {step === 3 ? (
        <View>
          <Text style={styles.stepTitle}>
            {phase === "locked"
              ? "Terms locked & authenticated"
              : "Review before you lock"}
          </Text>
          <Text style={styles.reviewSub}>
            {phase === "locked"
              ? "These exact terms are now sealed. Anyone opening your link verifies them before paying."
              : "Vajra Touch will seal these exact terms. Once locked, they can only be revoked, never edited."}
          </Text>

          {authCancelled && phase === "review" ? (
            <View style={{ marginBottom: S.lg }}>
              <ErrorCard
                testID="create-auth-cancelled"
                tone="warning"
                icon="hand-left"
                title="Authentication cancelled"
                moneyLine="No money moved"
                body="Your request is not authenticated yet and no link was created. Your details are saved. Try again when you're ready."
              />
            </View>
          ) : null}

          <View style={{ gap: S.md }}>
            {reviewFields.map((f, i) => (
              <VerifiedField
                key={f.label}
                testID={`review-field-${i}`}
                label={f.label}
                value={f.value}
                fullValue={f.fullValue}
                mono={f.mono}
                big={f.big}
                locked={phase !== "review" && i < lockedCount}
                state={
                  phase === "review"
                    ? "idle"
                    : i < lockedCount
                      ? "verified"
                      : "verifying"
                }
              />
            ))}
          </View>

          {phase === "locked" && createdRef.current ? (
            <Animated.View
              entering={reduceMotion ? undefined : ZoomIn.duration(320)}
              style={[styles.codeCard, cardShadow]}
              testID="create-vajra-code"
            >
              <Text style={styles.codeLabel}>YOUR VAJRA CODE</Text>
              <Text style={styles.codeValue}>
                {vajraCodeFromRequestId(createdRef.current.id as `0x${string}`)}
              </Text>
              <Text style={styles.codeSub}>
                Signed with your wallet ·{" "}
                {fmtDateTime(createdRef.current.createdAt)}
              </Text>
            </Animated.View>
          ) : null}

          {hydrated && !passkey && phase === "review" ? (
            <Animated.View
              entering={reduceMotion ? undefined : FadeInDown.duration(300)}
              style={styles.passkeyNudge}
            >
              <Ionicons name="finger-print" size={20} color={C.onLavender} />
              <View style={{ flex: 1 }}>
                <Text style={styles.nudgeTitle}>Vajra Touch required</Text>
                <Text style={styles.nudgeBody}>
                  Set it up once. After that, locking terms takes one touch.
                </Text>
                <PressableScale
                  testID="create-nudge-wallet-signature"
                  accessibilityLabel="Use wallet signature instead"
                  onPress={() => {
                    // Real local preference, not a fake passkey: choosing this
                    // registers wallet-signature as the auth method and
                    // permanently dismisses the nudge.
                    setPasskey({
                      name: "Wallet signature",
                      device: "This device",
                      createdAt: new Date().toISOString(),
                      method: "wallet-signature",
                    });
                    triggerHaptic("success");
                  }}
                  style={styles.nudgeAlt}
                  haptic={null}
                >
                  <Text style={styles.nudgeAltText}>
                    Use wallet signature instead
                  </Text>
                </PressableScale>
              </View>
              <Button
                label="Set up"
                small
                variant="primary"
                onPress={() => router.push("/passkey-setup")}
                testID="create-setup-passkey"
              />
            </Animated.View>
          ) : null}
        </View>
      ) : null}
      </View>

      {isDesktop ? (
        <View style={styles.previewWrap}>
          <View style={styles.previewCard} testID="create-desktop-preview">
            <View style={styles.previewTopRow}>
              <Text style={styles.previewMicro}>
                {phase === "locked" ? "SIGNED REQUEST" : "DRAFT REQUEST"}
              </Text>
              <View
                style={[
                  styles.previewSeal,
                  phase !== "locked" && styles.previewSealIdle,
                ]}
              >
                <Ionicons
                  name="finger-print"
                  size={13}
                  color={phase === "locked" ? C.onBrand : C.inkFaint}
                />
              </View>
            </View>
            <Text style={styles.previewAmount} numberOfLines={1}>
              {fmtMon(amount || "0")} <Text style={styles.previewUnit}>MON</Text>
            </Text>
            <View style={styles.previewDashes} />
            {[
              {
                label: "To",
                value: wallet ? shortAddr(wallet.address) : "Not connected",
                mono: Boolean(wallet),
              },
              { label: "Network", value: "Monad Mainnet" },
              {
                label: "Expires",
                value: expiresAtIso ? fmtDateTime(expiresAtIso) : "No expiry",
              },
              {
                label: "Who can pay",
                value:
                  restrictPayer && payerValid ? shortAddr(payerAddr) : "Anyone",
                mono: restrictPayer && payerValid,
              },
              ...(memo.trim() ? [{ label: "Memo", value: memo.trim() }] : []),
            ].map((r) => (
              <View key={r.label} style={styles.previewRow}>
                <Text style={styles.previewLabel}>{r.label}</Text>
                <Text
                  style={[
                    styles.previewValue,
                    r.mono ? { fontFamily: MONO, fontSize: 12.5 } : null,
                  ]}
                  numberOfLines={1}
                >
                  {r.value}
                </Text>
              </View>
            ))}
            <View style={styles.previewDashes} />
            <View style={styles.previewLockRow}>
              <Ionicons
                name={phase === "locked" ? "lock-closed" : "lock-open"}
                size={11}
                color={phase === "locked" ? C.brand : C.inkFaint}
              />
              <Text
                style={[
                  styles.previewLockText,
                  phase === "locked" && { color: C.brand },
                ]}
              >
                {phase === "locked"
                  ? "LOCKED · WALLET SIGNED"
                  : "LOCKS WHEN YOU AUTHENTICATE"}
              </Text>
            </View>
          </View>
          <Text style={styles.previewCaption}>
            Your payer verifies these exact terms before any money moves.
          </Text>
        </View>
      ) : null}
      </View>

      <ConnectWalletSheet
        visible={connectOpen}
        onClose={() => setConnectOpen(false)}
        onConnected={setWallet}
      />
      <VajraTouchSheet
        visible={touchOpen}
        title="Authenticate these terms"
        caption="Your device authorizes exactly what is shown below and nothing else."
        details={[
          { label: "Amount", value: `${fmtMon(amount || "0")} MON` },
          { label: "To", value: wallet ? shortAddr(wallet.address) : "—" },
          { label: "Network", value: "Monad Mainnet" },
          {
            label: "Expires",
            value: expiresAtIso ? fmtDateTime(expiresAtIso) : "No expiry",
          },
        ]}
        onDone={(result) => {
          setTouchOpen(false);
          if (result === "approved") startLocking();
          else setAuthCancelled(true);
        }}
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
  colMain: { flex: 1.2, minWidth: 0 },
  previewWrap: { flex: 1, maxWidth: 400 },
  previewCard: {
    backgroundColor: C.white,
    borderRadius: R.lg,
    borderWidth: 1.5,
    borderColor: C.ink,
    padding: S.xl,
    boxShadow: "0px 5px 0px #0E091C",
  },
  previewTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  previewMicro: {
    fontFamily: F.bold,
    fontSize: 9.5,
    letterSpacing: 2,
    color: C.inkFaint,
  },
  previewSeal: {
    width: 26,
    height: 26,
    borderRadius: R.pill,
    backgroundColor: C.brand,
    borderWidth: 1.25,
    borderColor: C.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  previewSealIdle: { backgroundColor: C.surface2, borderColor: C.border },
  previewAmount: {
    fontFamily: F.display,
    fontSize: 34,
    letterSpacing: -0.5,
    color: C.ink,
    marginTop: S.sm,
  },
  previewUnit: { fontSize: 16, letterSpacing: 0, color: C.inkFaint },
  previewDashes: {
    borderBottomWidth: 1.5,
    borderStyle: "dashed",
    borderColor: C.surface3,
    marginVertical: S.md,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
    gap: S.md,
  },
  previewLabel: { fontFamily: F.med, fontSize: 12.5, color: C.inkSoft },
  previewValue: {
    fontFamily: F.semi,
    fontSize: 13,
    color: C.ink,
    flexShrink: 1,
    textAlign: "right",
  },
  previewLockRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  previewLockText: {
    fontFamily: F.bold,
    fontSize: 9,
    letterSpacing: 1.4,
    color: C.inkFaint,
  },
  previewCaption: {
    fontFamily: F.med,
    fontSize: 12,
    lineHeight: 17,
    color: C.inkFaint,
    marginTop: S.md,
    paddingHorizontal: S.xs,
  },
  progressRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: S.lg,
    paddingBottom: S.md,
    backgroundColor: C.surface,
  },
  progressSeg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.surface3,
  },
  stepTitle: {
    fontFamily: F.display,
    fontSize: 24,
    lineHeight: 30,
    color: C.ink,
    marginBottom: S.lg,
  },
  amountCard: {
    width: "100%",
    overflow: "hidden",
    alignItems: "center",
    backgroundColor: C.white,
    borderRadius: R.lg + 4,
    borderWidth: 1.5,
    borderColor: C.borderStrong,
    paddingVertical: S.xl,
    paddingHorizontal: S.lg,
    boxShadow: "0px 5px 0px #0E091C",
  },
  amountLabel: {
    fontFamily: F.bold,
    fontSize: 10,
    letterSpacing: 1.8,
    color: C.inkFaint,
  },
  amountInput: {
    width: "100%",
    fontFamily: F.display,
    color: C.ink,
    padding: 0,
    marginTop: S.md,
    minHeight: 70,
    textAlign: "center",
  },
  amountMetaRow: {
    minHeight: 24,
    justifyContent: "center",
    alignItems: "center",
    marginTop: S.sm,
    width: "100%",
  },
  validRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  usdText: { fontFamily: F.med, fontSize: 13, color: C.inkSoft },
  amountError: {
    fontFamily: F.med,
    fontSize: 12.5,
    lineHeight: 18,
    color: C.error,
    textAlign: "center",
  },
  quickRow: {
    flexDirection: "row",
    gap: S.sm,
    marginTop: S.xl,
    justifyContent: "center",
  },
  amountHint: {
    fontFamily: F.med,
    fontSize: 12,
    lineHeight: 17,
    color: C.inkFaint,
    textAlign: "center",
    marginTop: S.lg,
  },
  quickChip: {
    height: 36,
    borderRadius: R.pill,
    paddingHorizontal: S.lg,
    backgroundColor: C.white,
    borderWidth: 1.25,
    borderColor: C.ink,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0px 2px 0px #0E091C",
  },
  quickText: { fontFamily: F.semi, fontSize: 13, color: C.ink },
  fieldLabel: {
    fontFamily: F.bold,
    fontSize: 10.5,
    letterSpacing: 0.8,
    color: C.inkFaint,
    marginBottom: S.sm,
    marginTop: S.xl,
  },
  recipientCard: {
    backgroundColor: C.white,
    borderRadius: R.md + 4,
    borderWidth: 1.25,
    borderColor: C.border,
    padding: S.lg,
  },
  recipientRow: { flexDirection: "row", alignItems: "center", gap: S.md },
  recipientIcon: {
    width: 38,
    height: 38,
    borderRadius: R.md,
    backgroundColor: C.lavenderSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  recipientText: { flex: 1 },
  recipientAddr: { fontFamily: MONO, fontSize: 14, color: C.ink },
  recipientSub: { fontFamily: F.med, fontSize: 12, lineHeight: 17, color: C.inkSoft, marginTop: 2 },
  memoWrap: {
    backgroundColor: C.white,
    borderWidth: 1.25,
    borderColor: C.border,
    borderRadius: R.md + 2,
    padding: S.md,
  },
  memoInput: {
    fontFamily: F.med,
    fontSize: 14.5,
    color: C.ink,
    minHeight: 48,
    textAlignVertical: "top",
    padding: 0,
  },
  memoCounter: {
    fontFamily: F.med,
    fontSize: 11,
    color: C.inkFaint,
    alignSelf: "flex-end",
    marginTop: 4,
  },
  helper: {
    fontFamily: F.med,
    fontSize: 12,
    lineHeight: 17,
    color: C.inkFaint,
    marginTop: S.sm,
  },
  expiryRow: { marginHorizontal: -S.lg },
  expiryRowContent: {
    gap: S.sm,
    paddingHorizontal: S.lg,
    alignItems: "center",
    height: 44,
  },
  expiryChip: {
    height: 36,
    borderRadius: R.pill,
    paddingHorizontal: S.lg,
    backgroundColor: C.white,
    borderWidth: 1.25,
    borderColor: C.ink,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  expiryChipOn: { backgroundColor: C.ink, borderColor: C.ink },
  expiryText: { fontFamily: F.semi, fontSize: 13, color: C.ink },
  expiryTextOn: { color: C.onInverse },
  advancedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.sm,
    paddingVertical: S.md,
    marginTop: S.lg,
    minHeight: 44,
  },
  advancedText: { flex: 1, fontFamily: F.semi, fontSize: 14.5, color: C.ink },
  advancedHint: { fontFamily: F.med, fontSize: 12.5, color: C.inkFaint },
  payerInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.sm,
    backgroundColor: C.white,
    borderWidth: 1.25,
    borderColor: C.border,
    borderRadius: R.md + 2,
    paddingHorizontal: S.md,
    height: 52,
  },
  payerInput: { flex: 1, fontFamily: MONO, fontSize: 13.5, color: C.ink, height: "100%" },
  reviewSub: {
    fontFamily: F.med,
    fontSize: 13,
    lineHeight: 19,
    color: C.inkSoft,
    marginTop: -S.sm,
    marginBottom: S.lg,
  },
  codeCard: {
    backgroundColor: C.inverse,
    borderRadius: R.lg + 4,
    padding: S.xl,
    alignItems: "center",
    marginTop: S.xl,
  },
  codeLabel: {
    fontFamily: F.bold,
    fontSize: 10.5,
    letterSpacing: 1.6,
    color: C.lavender,
  },
  codeValue: {
    fontFamily: MONO,
    fontSize: 30,
    color: C.onInverse,
    marginTop: S.sm,
    letterSpacing: 2,
  },
  codeSub: {
    fontFamily: F.med,
    fontSize: 11.5,
    color: "#B9B3CE",
    marginTop: S.sm,
    textAlign: "center",
  },
  passkeyNudge: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.md,
    backgroundColor: C.lavender,
    borderRadius: R.lg,
    borderWidth: 1.5,
    borderColor: C.ink,
    padding: S.lg,
    marginTop: S.xl,
    boxShadow: "0px 4px 0px #0E091C",
  },
  nudgeTitle: { fontFamily: F.semi, fontSize: 14, color: C.onLavender },
  nudgeBody: {
    fontFamily: F.med,
    fontSize: 12,
    lineHeight: 17,
    color: C.onLavender,
    opacity: 0.85,
    marginTop: 2,
  },
  nudgeAlt: { alignSelf: "flex-start", paddingVertical: 6, marginTop: 2 },
  nudgeAltText: {
    fontFamily: F.semi,
    fontSize: 12,
    color: C.onLavender,
    textDecorationLine: "underline",
  },
});
