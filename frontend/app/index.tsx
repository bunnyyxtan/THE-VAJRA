import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Button from "@/src/components/Button";
import PressableScale from "@/src/components/PressableScale";
import RequestRow from "@/src/components/RequestRow";
import Skeleton from "@/src/components/Skeleton";
import { EmptyState, SectionError } from "@/src/components/StateViews";
import { useToast } from "@/src/components/Toast";
import { useBreakpoint } from "@/src/hooks/use-breakpoint";
import { fmtMon, shortAddr } from "@/src/lib/format";
import {
  useMotionPref,
  useTransparencyPref,
  useVajra,
} from "@/src/state/vajra";
import { C, F, HAIRLINE, MONO, R, S, hard, hardSm } from "@/src/theme";

const STEPS = [
  {
    n: "01",
    title: "Recipient locks the exact terms",
    body: "Amount, wallet, network and expiry are sealed with Vajra Touch, never typed into a chat.",
  },
  {
    n: "02",
    title: "One signed link or QR",
    body: "The request travels as a signed payload. Change one character and the handshake visibly breaks.",
  },
  {
    n: "03",
    title: "Verify, pay once, keep proof",
    body: "Every protected field is checked before money moves. Settlement leaves a permanent receipt on Monad.",
  },
];

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { hydrated, passkey, requests, settings } = useVajra();
  const { toast } = useToast();
  const reduceMotion = useMotionPref();
  const reduceTransparency = useTransparencyPref();
  const { isDesktop } = useBreakpoint();

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const cardStyle = useAnimatedStyle(() => {
    if (reduceMotion) return { transform: [{ rotate: "-2.2deg" }] };
    return {
      transform: [
        { translateY: interpolate(scrollY.value, [0, 380], [0, -30], "clamp") },
        {
          rotate: `${interpolate(scrollY.value, [0, 380], [-2.2, 0.6], "clamp")}deg`,
        },
        { scale: interpolate(scrollY.value, [0, 380], [1, 1.02], "clamp") },
      ],
    };
  });

  const backStyle = useAnimatedStyle(() => {
    if (reduceMotion) return { transform: [{ rotate: "2.4deg" }] };
    return {
      transform: [
        { translateY: interpolate(scrollY.value, [0, 380], [0, 18], "clamp") },
        {
          rotate: `${interpolate(scrollY.value, [0, 380], [2.4, 5.2], "clamp")}deg`,
        },
      ],
    };
  });

  const recent = requests.slice(0, 4);
  const activeCount = requests.filter((r) => r.status === "active").length;
  const settledMon = requests
    .filter((r) => r.status === "paid")
    .reduce((sum, r) => sum + parseFloat(r.amountMon), 0);

  const requestObject = (
    <View style={[styles.objectStage, isDesktop && styles.objectStageDesktop]}>
      <Animated.View style={[styles.objectBack, backStyle]} />
      <Animated.View style={[styles.requestCard, cardStyle]}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardMicro}>SIGNED REQUEST</Text>
          <View style={styles.cardSealRing}>
            <LinearGradient
              colors={["#A78BFF", "#6E54FF", "#19CE9A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.cardSeal}>
              <Ionicons name="finger-print" size={13} color={C.onBrand} />
            </View>
          </View>
        </View>
        <Text style={styles.cardAmount}>
          0.01 <Text style={styles.cardUnit}>MON</Text>
        </Text>
        <View style={styles.cardToRow}>
          <Text style={styles.cardTo} numberOfLines={1}>
            to {shortAddr("0xEB9c56D1EB7Ff500e10822c5C7A690140Fa7463E")}
          </Text>
          <Ionicons name="checkmark-circle" size={15} color={C.emerald} />
        </View>
        <View style={styles.cardDashes} />
        <View style={styles.cardBottomRow}>
          <View style={styles.cardLockRow}>
            <Ionicons name="lock-closed" size={10} color={C.brand} />
            <Text style={styles.cardLockText}>LOCKED · VAJRA TOUCH</Text>
          </View>
          <Text style={styles.cardCode}>VJ-CAFE42</Text>
        </View>
      </Animated.View>
    </View>
  );

  return (
    <View style={styles.root} testID="home-screen">
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={[styles.headerRow, isDesktop && styles.headerRowDesktop]}>
          <View style={styles.brandRow}>
            <Text style={styles.wordmark}>VAJRA</Text>
            <View style={styles.netPill}>
              <View style={styles.netDot} />
              <Text style={styles.netText}>MONAD MAINNET</Text>
            </View>
          </View>
          {isDesktop ? (
            <View style={styles.navRow}>
              <PressableScale
                testID="home-activity-button"
                accessibilityLabel="Open activity"
                onPress={() => router.push("/activity")}
                style={styles.navLink}
                haptic={null}
              >
                <Text style={styles.navLinkText}>Activity</Text>
              </PressableScale>
              <PressableScale
                testID="home-security-button"
                accessibilityLabel="Open security settings"
                onPress={() => router.push("/security")}
                style={styles.navLink}
                haptic={null}
              >
                <Text style={styles.navLinkText}>Security</Text>
              </PressableScale>
              <Button
                label="Open a link"
                variant="outline"
                small
                onPress={() => router.push("/open-link")}
                testID="home-open-link-button"
              />
              <Button
                label="Create a request"
                icon="add"
                small
                onPress={() => router.push("/create")}
                testID="home-create-request-button"
              />
            </View>
          ) : (
            <View style={styles.headerActions}>
              <PressableScale
                testID="home-activity-button"
                accessibilityLabel="Open activity"
                onPress={() => router.push("/activity")}
                style={styles.iconBtn}
                haptic={null}
              >
                <Ionicons name="reader-outline" size={21} color={C.ink} />
              </PressableScale>
              <PressableScale
                testID="home-security-button"
                accessibilityLabel="Open security settings"
                onPress={() => router.push("/security")}
                style={styles.iconBtn}
                haptic={null}
              >
                <Ionicons name="finger-print" size={21} color={C.ink} />
              </PressableScale>
            </View>
          )}
        </View>
      </View>

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: isDesktop ? 96 : 150 + insets.bottom,
        }}
      >
        {/* Hero panel */}
        <View style={styles.heroPanel}>
          <LinearGradient
            colors={["#F7F4FF", "#EFE9FF", "#E6DFFE"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.2, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={[styles.heroInner, isDesktop && styles.heroInnerDesktop]}>
            {settings.outage ? (
              <View style={{ marginBottom: S.xl }}>
                <SectionError
                  testID="home-outage-banner"
                  title="Monad connection unavailable"
                  body="Verification and payment are paused. Saved requests and receipts remain available."
                  retryLabel="Retry"
                  onRetry={() =>
                    toast(
                      "Monad is still unreachable. Verification stays paused.",
                    )
                  }
                />
              </View>
            ) : null}

            <View style={isDesktop ? styles.heroCols : undefined}>
              <View style={isDesktop ? styles.heroLeft : undefined}>
                <Text style={styles.heroKicker}>
                  RECIPIENT-AUTHENTICATED PAYMENTS
                </Text>
                <Text
                  style={[styles.heroTitle, isDesktop && styles.heroTitleDesktop]}
                  accessibilityRole="header"
                >
                  Never trust a{"\n"}
                  <Text
                    style={[
                      styles.heroStrike,
                      isDesktop && styles.heroStrikeDesktop,
                    ]}
                  >
                    pasted address
                  </Text>
                  {"\n"}again.
                </Text>
                <Text style={styles.heroBody}>
                  The person you’re paying locks the exact terms with a passkey.
                  You verify every field, pay once, and keep permanent proof on
                  Monad.
                </Text>
                {isDesktop ? (
                  <View style={styles.heroCtaRow}>
                    <Button
                      label="Create a request"
                      icon="add"
                      onPress={() => router.push("/create")}
                      style={styles.heroCta}
                      testID="home-hero-create-button"
                    />
                    <Button
                      label="Pay a request"
                      variant="outline"
                      onPress={() => router.push("/open-link")}
                      style={styles.heroCta}
                      testID="home-hero-open-button"
                    />
                  </View>
                ) : null}
              </View>
              <View style={isDesktop ? styles.heroRight : undefined}>
                {requestObject}
              </View>
            </View>
          </View>
        </View>

        {/* Passkey nudge */}
        {hydrated && !passkey ? (
          <View style={[styles.pad, isDesktop && styles.padDesktop]}>
            <PressableScale
              testID="home-passkey-nudge"
              accessibilityLabel="Set up Vajra Touch"
              onPress={() => router.push("/passkey-setup")}
              style={[styles.nudge, hard]}
              scaleTo={0.99}
            >
              <View style={styles.nudgeIcon}>
                <Ionicons name="finger-print" size={20} color={C.onBrand} />
              </View>
              <View style={styles.nudgeText}>
                <Text style={styles.nudgeTitle}>Set up Vajra Touch</Text>
                <Text style={styles.nudgeBody}>
                  Lock your payment terms in one touch.
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={18} color={C.ink} />
            </PressableScale>
          </View>
        ) : null}

        {/* Stats strip */}
        <View
          style={[
            styles.pad,
            styles.statsRow,
            isDesktop && styles.padDesktop,
            isDesktop && styles.statsRowDesktop,
          ]}
        >
          <PressableScale
            testID="home-bento-activity"
            accessibilityLabel={`Activity, ${activeCount} active requests`}
            onPress={() => router.push("/activity")}
            style={[styles.stat, isDesktop && styles.statDesktop]}
            haptic={null}
            scaleTo={0.99}
          >
            <View style={[styles.statChip, { backgroundColor: C.lavenderSoft }]}>
              <Ionicons name="flash" size={17} color={C.brand} />
            </View>
            <View style={styles.statBottom}>
              <Text
                style={[styles.statValue, isDesktop && styles.statValueDesktop]}
              >
                {hydrated ? activeCount : "—"}
              </Text>
              <Text style={styles.statLabel}>ACTIVE{"\n"}REQUESTS</Text>
            </View>
          </PressableScale>
          <PressableScale
            testID="home-bento-settled"
            accessibilityLabel={`${fmtMon(settledMon)} MON settled`}
            onPress={() => router.push("/activity")}
            style={[styles.stat, isDesktop && styles.statDesktop]}
            haptic={null}
            scaleTo={0.99}
          >
            <View style={[styles.statChip, { backgroundColor: C.emeraldBg }]}>
              <Ionicons name="checkmark-done" size={17} color={C.emeraldDeep} />
            </View>
            <View style={styles.statBottom}>
              <Text
                style={[styles.statValue, isDesktop && styles.statValueDesktop]}
              >
                {hydrated ? fmtMon(settledMon) : "—"}
              </Text>
              <Text style={styles.statLabel}>MON{"\n"}SETTLED</Text>
            </View>
          </PressableScale>
          <PressableScale
            testID="home-bento-security"
            accessibilityLabel={`Vajra Touch ${passkey ? "active" : "off"}`}
            onPress={() => router.push("/security")}
            style={[styles.stat, isDesktop && styles.statDesktop]}
            haptic={null}
            scaleTo={0.99}
          >
            <View style={[styles.statChip, { backgroundColor: C.goldBg }]}>
              <Ionicons
                name={passkey ? "shield-checkmark" : "shield-half"}
                size={17}
                color={C.gold}
              />
            </View>
            <View style={styles.statBottom}>
              <Text
                style={[
                  styles.statValue,
                  isDesktop && styles.statValueDesktop,
                  { color: passkey ? C.ink : C.gold },
                ]}
              >
                {passkey ? "ON" : "OFF"}
              </Text>
              <Text style={styles.statLabel}>VAJRA{"\n"}TOUCH</Text>
            </View>
          </PressableScale>
        </View>

        {/* How it works */}
        <View style={[styles.pad, isDesktop && styles.padDesktop]}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>How it works</Text>
            <View style={styles.sectionRule} />
          </View>
          <View style={isDesktop ? styles.stepsRowDesktop : undefined}>
            {STEPS.map((s, i) => (
              <View
                key={s.n}
                style={[
                  styles.step,
                  !isDesktop && i < STEPS.length - 1 && styles.stepBorder,
                  isDesktop && styles.stepDesktop,
                ]}
              >
                <View
                  style={[styles.stepNumWrap, isDesktop && styles.stepNumWrapDesktop]}
                >
                  <Text
                    style={[styles.stepNum, isDesktop && styles.stepNumDesktop]}
                  >
                    {s.n}
                  </Text>
                </View>
                <View style={styles.stepText}>
                  <Text style={styles.stepTitle}>{s.title}</Text>
                  <Text style={styles.stepBody}>{s.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Recent ledger */}
        <View style={[styles.pad, isDesktop && styles.padNarrowDesktop]}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Recent</Text>
            <View style={styles.sectionRule} />
            <PressableScale
              testID="home-see-all-activity"
              accessibilityLabel="See all activity"
              onPress={() => router.push("/activity")}
              haptic={null}
              hitSlop={8}
            >
              <Text style={styles.seeAll}>SEE ALL</Text>
            </PressableScale>
          </View>
          {!hydrated ? (
            <View style={{ gap: S.md }}>
              <Skeleton h={56} r={R.md} />
              <Skeleton h={56} r={R.md} />
            </View>
          ) : recent.length === 0 ? (
            <EmptyState
              testID="home-empty-activity"
              icon="leaf-outline"
              title="No payment activity yet"
              body="Requests you create, send, or receive will appear here."
              actionLabel="Create a payment request"
              onAction={() => router.push("/create")}
            />
          ) : (
            <View style={styles.ledgerCard}>
              {recent.map((r, i) => (
                <RequestRow
                  key={r.id}
                  request={r}
                  last={i === recent.length - 1}
                />
              ))}
            </View>
          )}
        </View>

        <Text style={styles.protoFoot}>
          PROTOTYPE BUILD · SETTLEMENT ON MONAD IS SIMULATED
        </Text>
      </Animated.ScrollView>

      {/* Sticky glass action bar (mobile / tablet only) */}
      {!isDesktop ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + S.md }]}>
          {reduceTransparency || Platform.OS === "android" ? (
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: C.surface }]}
            />
          ) : (
            <BlurView
              intensity={36}
              tint="light"
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: "rgba(252,251,255,0.72)" },
              ]}
            />
          )}
          <View style={styles.footerRow}>
            <Button
              label="Create a request"
              icon="add"
              onPress={() => router.push("/create")}
              style={styles.footerPrimary}
              testID="home-create-request-button"
            />
            <PressableScale
              testID="home-open-link-button"
              accessibilityLabel="Pay a request"
              onPress={() => router.push("/open-link")}
              style={[styles.footerSquare, hardSm]}
            >
              <Ionicons name="qr-code" size={21} color={C.ink} />
            </PressableScale>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const MAXW = 1140;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },
  header: { backgroundColor: C.surface, zIndex: 10 },
  headerRow: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: S.lg,
    paddingRight: S.sm,
  },
  headerRowDesktop: {
    height: 76,
    maxWidth: MAXW,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: S.xl,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: S.sm + 2 },
  wordmark: {
    fontFamily: F.display,
    fontSize: 19,
    letterSpacing: 3,
    color: C.ink,
  },
  netPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: C.ink,
    borderRadius: 5,
    paddingHorizontal: 7,
    height: 22,
  },
  netDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.brand },
  netText: { fontFamily: F.bold, fontSize: 8.5, letterSpacing: 1, color: C.ink },
  headerActions: { flexDirection: "row" },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  navRow: { flexDirection: "row", alignItems: "center", gap: S.lg },
  navLink: { paddingVertical: S.md, paddingHorizontal: S.xs },
  navLinkText: { fontFamily: F.semi, fontSize: 14.5, color: C.ink },
  heroPanel: {
    backgroundColor: C.lavenderSoft,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    borderBottomWidth: 1.5,
    borderColor: C.ink,
    paddingHorizontal: S.lg,
    paddingTop: S.xl,
    paddingBottom: S.xxl + S.md,
    overflow: "hidden",
  },
  heroInner: { width: "100%" },
  heroInnerDesktop: {
    maxWidth: MAXW,
    alignSelf: "center",
    paddingHorizontal: S.sm,
    paddingTop: S.xxl,
    paddingBottom: S.xl,
  },
  heroCols: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.xxxl,
  },
  heroLeft: { flex: 1.1 },
  heroRight: { flex: 1, maxWidth: 470 },
  heroKicker: {
    fontFamily: F.bold,
    fontSize: 11,
    letterSpacing: 2.6,
    color: C.brand,
    marginBottom: S.lg,
  },
  heroTitle: {
    fontFamily: F.display,
    fontSize: 44,
    lineHeight: 50,
    letterSpacing: -1.2,
    color: C.ink,
  },
  heroTitleDesktop: { fontSize: 66, lineHeight: 71, letterSpacing: -2 },
  heroStrike: {
    fontFamily: F.serif,
    fontSize: 43,
    color: C.brand,
    textDecorationLine: "line-through",
    textDecorationColor: C.pink,
  },
  heroStrikeDesktop: { fontSize: 64 },
  heroBody: {
    fontFamily: F.med,
    fontSize: 15.5,
    lineHeight: 24,
    color: C.inkSoft,
    marginTop: S.lg,
    maxWidth: 420,
  },
  heroCtaRow: { flexDirection: "row", gap: S.lg, marginTop: S.xxl },
  heroCta: { minWidth: 190 },
  objectStage: { marginTop: S.xxl, height: 200, justifyContent: "center" },
  objectStageDesktop: { marginTop: 0, height: 232 },
  objectBack: {
    position: "absolute",
    left: S.xl,
    right: S.xl,
    height: 172,
    borderRadius: 18,
    backgroundColor: C.lavender,
    borderWidth: 1.5,
    borderColor: C.ink,
  },
  requestCard: {
    backgroundColor: C.white,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: C.ink,
    padding: S.xl,
    marginHorizontal: S.xs,
    boxShadow:
      "0px 6px 0px #0E091C, 0px 26px 52px rgba(42,28,107,0.18), inset 0px 1.5px 0px rgba(255,255,255,0.85)",
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardMicro: {
    fontFamily: F.bold,
    fontSize: 9.5,
    letterSpacing: 2,
    color: C.inkFaint,
  },
  cardSealRing: {
    width: 32,
    height: 32,
    borderRadius: R.pill,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    boxShadow: "0px 3px 10px rgba(110,84,255,0.45)",
  },
  cardSeal: {
    width: 25,
    height: 25,
    borderRadius: R.pill,
    backgroundColor: C.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  cardAmount: {
    fontFamily: F.display,
    fontSize: 42,
    letterSpacing: -0.5,
    color: C.ink,
    marginTop: S.md,
  },
  cardUnit: { fontSize: 18, letterSpacing: 0, color: C.inkFaint },
  cardToRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  cardTo: { fontFamily: MONO, fontSize: 12, color: C.inkSoft, flexShrink: 1 },
  cardDashes: {
    borderBottomWidth: 1.5,
    borderStyle: "dashed",
    borderColor: C.surface3,
    marginVertical: S.md,
  },
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLockRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  cardLockText: {
    fontFamily: F.bold,
    fontSize: 9,
    letterSpacing: 1.4,
    color: C.brand,
  },
  cardCode: { fontFamily: MONO, fontSize: 11, color: C.ink },
  pad: { paddingHorizontal: S.lg, marginTop: S.xl + S.md },
  padDesktop: {
    maxWidth: MAXW,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: S.xl,
    marginTop: S.xxxl + S.sm,
  },
  padNarrowDesktop: {
    maxWidth: 800,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: S.xl,
    marginTop: S.xxxl + S.sm,
  },
  nudge: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.md,
    backgroundColor: C.lavender,
    borderRadius: R.lg - 4,
    borderWidth: 1.5,
    borderColor: C.ink,
    padding: S.lg,
  },
  nudgeIcon: {
    width: 40,
    height: 40,
    borderRadius: R.md,
    backgroundColor: C.brand,
    borderWidth: 1.25,
    borderColor: C.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  nudgeText: { flex: 1 },
  nudgeTitle: { fontFamily: F.display, fontSize: 16, color: C.ink },
  nudgeBody: { fontFamily: F.med, fontSize: 12.5, color: C.inkSoft, marginTop: 2 },
  statsRow: { flexDirection: "row", gap: S.md },
  statsRowDesktop: { gap: S.lg },
  stat: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.ink,
    padding: S.lg,
    minHeight: 132,
    justifyContent: "space-between",
    boxShadow:
      "0px 3px 0px #0E091C, 0px 12px 24px rgba(42,28,107,0.09), inset 0px 1px 0px rgba(255,255,255,0.75)",
  },
  statDesktop: { minHeight: 160, padding: S.xl },
  statChip: {
    width: 36,
    height: 36,
    borderRadius: 11,
    borderWidth: 1.25,
    borderColor: C.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  statBottom: { marginTop: S.md },
  statValue: { fontFamily: F.display, fontSize: 30, color: C.ink },
  statValueDesktop: { fontSize: 40 },
  statLabel: {
    fontFamily: F.bold,
    fontSize: 10.5,
    letterSpacing: 1.3,
    lineHeight: 15,
    color: C.inkSoft,
    marginTop: 6,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.md,
    marginBottom: S.sm,
  },
  sectionTitle: { fontFamily: F.display, fontSize: 19, color: C.ink },
  sectionRule: { flex: 1, height: 1.5, backgroundColor: C.ink, opacity: 0.9 },
  seeAll: {
    fontFamily: F.bold,
    fontSize: 10.5,
    letterSpacing: 1.4,
    color: C.brand,
    paddingVertical: 8,
  },
  step: { flexDirection: "row", gap: S.lg, paddingVertical: S.lg },
  stepBorder: { borderBottomWidth: HAIRLINE, borderBottomColor: C.surface3 },
  stepsRowDesktop: { flexDirection: "row", gap: S.xl, marginTop: S.md },
  stepDesktop: {
    flex: 1,
    flexDirection: "column",
    gap: S.md,
    borderTopWidth: 1.5,
    borderTopColor: C.ink,
    paddingTop: S.lg,
    paddingVertical: 0,
    paddingBottom: S.lg,
  },
  stepNumWrap: {
    width: 46,
    height: 46,
    borderRadius: R.pill,
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.ink,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0px 2.5px 0px #0E091C",
  },
  stepNumWrapDesktop: { width: 54, height: 54 },
  stepNum: { fontFamily: F.display, fontSize: 17, color: C.brand },
  stepNumDesktop: { fontSize: 19 },
  stepText: { flex: 1, paddingTop: 2 },
  stepTitle: { fontFamily: F.semi, fontSize: 16, color: C.ink },
  stepBody: {
    fontFamily: F.med,
    fontSize: 13,
    lineHeight: 20,
    color: C.inkSoft,
    marginTop: 5,
  },
  ledgerCard: {
    backgroundColor: C.white,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: C.ink,
    paddingHorizontal: S.lg,
    boxShadow:
      "0px 4px 0px #0E091C, 0px 14px 30px rgba(42,28,107,0.10), inset 0px 1px 0px rgba(255,255,255,0.7)",
  },
  protoFoot: {
    fontFamily: F.bold,
    fontSize: 9,
    letterSpacing: 1.6,
    color: C.inkFaint,
    textAlign: "center",
    marginTop: S.xxl,
    paddingHorizontal: S.lg,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: S.md,
    borderTopWidth: HAIRLINE,
    borderTopColor: C.border,
    overflow: "hidden",
  },
  footerRow: {
    flexDirection: "row",
    gap: S.md,
    paddingHorizontal: S.lg,
    alignItems: "flex-start",
  },
  footerPrimary: { flex: 1 },
  footerSquare: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.ink,
    alignItems: "center",
    justifyContent: "center",
  },
});
