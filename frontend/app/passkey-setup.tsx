import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";

import Button from "@/src/components/Button";
import PressableScale, { triggerHaptic } from "@/src/components/PressableScale";
import Screen from "@/src/components/Screen";
import Sheet from "@/src/components/Sheet";
import { ErrorCard } from "@/src/components/StateViews";
import { VajraTouchSheet } from "@/src/components/WalletSheets";
import { useBreakpoint } from "@/src/hooks/use-breakpoint";
import { fmtDateTime } from "@/src/lib/format";
import { delay } from "@/src/lib/mock";
import { useMotionPref, useVajra } from "@/src/state/vajra";
import { C, F, R, S, cardShadow } from "@/src/theme";

const BENEFITS = [
  {
    icon: "lock-closed" as const,
    title: "Terms locked by your device",
    body: "Amount, wallet and expiry are sealed the moment you authenticate.",
  },
  {
    icon: "eye-off" as const,
    title: "Vajra never sees your biometrics",
    body: "Authentication stays on your device. Nothing sensitive leaves it.",
  },
  {
    icon: "swap-horizontal" as const,
    title: "Works across wallets",
    body: "Your Vajra Touch identity stays yours, even if you switch wallets.",
  },
];

type Phase = "intro" | "registering" | "success" | "cancelled";

export default function PasskeySetup() {
  const router = useRouter();
  const { passkey, setPasskey } = useVajra();
  const reduceMotion = useMotionPref();
  const { isDesktop } = useBreakpoint();
  const [phase, setPhase] = useState<Phase>(passkey ? "success" : "intro");
  const [ceremonyOpen, setCeremonyOpen] = useState(false);
  const [unsupportedOpen, setUnsupportedOpen] = useState(false);

  const finishRegistration = async (method: "passkey" | "wallet-signature") => {
    setPhase("registering");
    await delay(1100);
    setPasskey({
      name: method === "passkey" ? "Vajra Touch" : "Wallet signature",
      device: "This device",
      createdAt: new Date().toISOString(),
      method,
    });
    triggerHaptic("success");
    setPhase("success");
  };

  return (
    <Screen title="Vajra Touch" maxWidth={920} testID="passkey-setup-screen">
      {phase === "success" && passkey ? (
        <Animated.View
          entering={reduceMotion ? undefined : ZoomIn.duration(320)}
          style={isDesktop ? styles.successColDesktop : undefined}
        >
          <View style={[styles.successCard, cardShadow]}>
            <View style={styles.successGlyph}>
              <Ionicons name="checkmark" size={40} color={C.onBrand} />
            </View>
            <Text style={styles.successTitle}>Vajra Touch is ready</Text>
            <Text style={styles.successBody}>
              New payment requests from this device can now be authenticated in
              one touch.
            </Text>
            <View style={styles.detailBox}>
              <DetailRow label="Name" value={passkey.name} />
              <DetailRow label="Device" value={passkey.device} />
              <DetailRow label="Created" value={fmtDateTime(passkey.createdAt)} />
              <DetailRow
                label="Method"
                value={
                  passkey.method === "passkey" ? "Device passkey" : "Wallet signature"
                }
              />
            </View>
          </View>
          <Button
            label="Create your first request"
            icon="add"
            onPress={() => router.replace("/create")}
            style={{ marginTop: S.xl }}
            testID="passkey-success-create-button"
          />
          <Button
            label="Done"
            variant="ghost"
            onPress={() => router.back()}
            style={{ marginTop: S.sm }}
            testID="passkey-success-done-button"
          />
        </Animated.View>
      ) : (
        <View>
          {/* Ceremony hero */}
          <View style={isDesktop ? styles.heroRowDesktop : undefined}>
            <View style={styles.heroWrap}>
              <View style={styles.ringOuter}>
                <View style={styles.ringMid}>
                  <View style={styles.glyph}>
                    <Ionicons name="finger-print" size={44} color={C.onBrand} />
                  </View>
                </View>
              </View>
            </View>
            <View style={isDesktop ? styles.heroTextDesktop : undefined}>
              <Text style={[styles.title, isDesktop && { marginTop: 0 }]}>
                One touch.{"\n"}Exact terms.
              </Text>
              <Text style={styles.body}>
                Vajra Touch is the passkey that seals your payment requests.
                Anyone paying you verifies exactly what you authenticated.
                Nothing more, nothing less.
              </Text>
            </View>
          </View>

          {phase === "cancelled" ? (
            <View style={{ marginTop: S.xl }}>
              <ErrorCard
                testID="passkey-cancelled-card"
                tone="warning"
                icon="hand-left"
                title="Setup was cancelled"
                moneyLine="No money moved"
                body="No passkey was created and nothing changed on this device. You can set up Vajra Touch whenever you're ready."
              />
            </View>
          ) : null}

          <View
            style={[
              { marginTop: S.xl, gap: S.md },
              isDesktop && styles.benefitsRowDesktop,
            ]}
          >
            {BENEFITS.map((b, i) => (
              <Animated.View
                key={b.title}
                entering={
                  reduceMotion ? undefined : FadeInDown.duration(360).delay(80 * i)
                }
                style={[styles.benefit, isDesktop && styles.benefitDesktop]}
              >
                <View style={styles.benefitIcon}>
                  <Ionicons name={b.icon} size={18} color={C.brand} />
                </View>
                <View style={styles.benefitText}>
                  <Text style={styles.benefitTitle}>{b.title}</Text>
                  <Text style={styles.benefitBody}>{b.body}</Text>
                </View>
              </Animated.View>
            ))}
          </View>

          <Button
            label="Set up Vajra Touch"
            icon="finger-print"
            loading={phase === "registering"}
            loadingLabel="Registering…"
            onPress={() => {
              setPhase("intro");
              setCeremonyOpen(true);
            }}
            style={[{ marginTop: S.xxl }, isDesktop && styles.ctaDesktop]}
            testID="passkey-setup-button"
          />
          <PressableScale
            testID="passkey-unsupported-link"
            accessibilityLabel="My device doesn't support passkeys"
            onPress={() => setUnsupportedOpen(true)}
            style={styles.unsupportedLink}
            haptic={null}
          >
            <Text style={styles.unsupportedText}>
              My device doesn’t support passkeys
            </Text>
          </PressableScale>
        </View>
      )}

      <VajraTouchSheet
        visible={ceremonyOpen}
        title="Create your Vajra Touch passkey"
        caption="Your device will confirm it's really you. This registers a passkey used only to authenticate payment terms."
        onDone={(result) => {
          setCeremonyOpen(false);
          if (result === "approved") finishRegistration("passkey");
          else setPhase("cancelled");
        }}
      />

      <Sheet
        visible={unsupportedOpen}
        onClose={() => setUnsupportedOpen(false)}
        title="No passkey support?"
        testID="passkey-unsupported-sheet"
      >
        <Text style={styles.sheetBody}>
          Some devices can’t create passkeys. You can authenticate your payment
          terms with a wallet signature instead. The protection for people
          paying you is identical.
        </Text>
        <Text style={[styles.sheetBody, { color: C.inkFaint, fontSize: 12 }]}>
          Vajra will never ask for your seed phrase or private key.
        </Text>
        <Button
          label="Use wallet signature instead"
          icon="create"
          variant="secondary"
          onPress={() => {
            setUnsupportedOpen(false);
            finishRegistration("wallet-signature");
          }}
          style={{ marginTop: S.lg }}
          testID="passkey-wallet-signature-button"
        />
        <Button
          label="Close"
          variant="ghost"
          small
          onPress={() => setUnsupportedOpen(false)}
          style={{ marginTop: S.sm }}
          testID="passkey-unsupported-close"
        />
      </Sheet>
    </Screen>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroRowDesktop: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.xxxl,
    marginTop: S.lg,
  },
  heroTextDesktop: { flex: 1 },
  benefitsRowDesktop: { flexDirection: "row", alignItems: "stretch" },
  benefitDesktop: { flex: 1, flexDirection: "column", gap: S.sm },
  ctaDesktop: { maxWidth: 460, width: "100%", alignSelf: "center" },
  successColDesktop: { maxWidth: 560, width: "100%", alignSelf: "center" },
  heroWrap: { alignItems: "center", marginTop: S.lg },
  ringOuter: {
    width: 168,
    height: 168,
    borderRadius: R.pill,
    backgroundColor: C.lavenderSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  ringMid: {
    width: 132,
    height: 132,
    borderRadius: R.pill,
    backgroundColor: C.lavender,
    alignItems: "center",
    justifyContent: "center",
  },
  glyph: {
    width: 96,
    height: 96,
    borderRadius: R.pill,
    backgroundColor: C.brand,
    borderWidth: 1.5,
    borderColor: C.ink,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0px 4px 0px #0E091C",
  },
  title: {
    fontFamily: F.display,
    fontSize: 34,
    lineHeight: 38,
    color: C.ink,
    marginTop: S.xl,
  },
  body: {
    fontFamily: F.med,
    fontSize: 14.5,
    lineHeight: 22,
    color: C.inkSoft,
    marginTop: S.md,
  },
  benefit: {
    flexDirection: "row",
    gap: S.md,
    backgroundColor: C.white,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    padding: S.lg,
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: R.md,
    backgroundColor: C.lavenderSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: { flex: 1 },
  benefitTitle: { fontFamily: F.semi, fontSize: 14.5, color: C.ink },
  benefitBody: {
    fontFamily: F.med,
    fontSize: 12.5,
    lineHeight: 18,
    color: C.inkSoft,
    marginTop: 3,
  },
  unsupportedLink: { alignSelf: "center", padding: S.md, marginTop: S.xs },
  unsupportedText: {
    fontFamily: F.semi,
    fontSize: 13,
    color: C.brand,
  },
  successCard: {
    backgroundColor: C.white,
    borderRadius: R.lg + 4,
    borderWidth: 1,
    borderColor: C.border,
    padding: S.xl,
    alignItems: "center",
    marginTop: S.lg,
  },
  successGlyph: {
    width: 80,
    height: 80,
    borderRadius: R.pill,
    backgroundColor: C.successBright,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: S.lg,
  },
  successTitle: { fontFamily: F.display, fontSize: 24, color: C.ink },
  successBody: {
    fontFamily: F.med,
    fontSize: 13.5,
    lineHeight: 20,
    color: C.inkSoft,
    textAlign: "center",
    marginTop: S.sm,
  },
  detailBox: {
    alignSelf: "stretch",
    backgroundColor: C.surface2,
    borderRadius: R.md + 2,
    paddingHorizontal: S.lg,
    paddingVertical: S.xs,
    marginTop: S.xl,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: S.md - 2,
    gap: S.md,
  },
  detailLabel: { fontFamily: F.med, fontSize: 13, color: C.inkSoft },
  detailValue: { fontFamily: F.semi, fontSize: 13, color: C.ink, flexShrink: 1, textAlign: "right" },
  sheetBody: {
    fontFamily: F.med,
    fontSize: 13.5,
    lineHeight: 20,
    color: C.inkSoft,
    marginBottom: S.sm,
  },
});
