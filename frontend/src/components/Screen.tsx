import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PressableScale from "./PressableScale";
import { useBreakpoint } from "@/src/hooks/use-breakpoint";
import { useTransparencyPref } from "@/src/state/vajra";
import { C, F, HAIRLINE, S } from "@/src/theme";

interface Props {
  title?: string;
  subtitle?: string;
  backHidden?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
  children: React.ReactNode;
  scroll?: boolean;
  /** Sticky bar under the header (e.g. filter chips) — stays out of the scroll. */
  belowHeader?: React.ReactNode;
  /** Sticky glass footer for the dominant action. */
  footer?: React.ReactNode;
  padded?: boolean;
  /** Content column cap on desktop viewports. */
  maxWidth?: number;
  testID?: string;
}

export const FOOTER_CLEARANCE = 132;

export default function Screen({
  title,
  subtitle,
  backHidden,
  onBack,
  right,
  children,
  scroll = true,
  belowHeader,
  footer,
  padded = true,
  maxWidth = 680,
  testID,
}: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const reduceTransparency = useTransparencyPref();
  const { isDesktop } = useBreakpoint();

  // Desktop caps: content column, plus a slightly wider bar so the back
  // chevron and header actions sit just outside the content edge.
  const desktopCol = isDesktop
    ? { maxWidth, width: "100%" as const, alignSelf: "center" as const }
    : null;
  const desktopBar = isDesktop
    ? {
        maxWidth: maxWidth + 48,
        width: "100%" as const,
        alignSelf: "center" as const,
      }
    : null;

  const content = scroll ? (
    <KeyboardAwareScrollView
      style={styles.fill}
      contentContainerStyle={styles.contentWidth}
      bottomOffset={footer ? FOOTER_CLEARANCE : S.xl}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={[
          styles.inner,
          padded && styles.padded,
          padded && isDesktop && styles.paddedDesktop,
          desktopCol,
          {
            paddingBottom:
              (footer ? FOOTER_CLEARANCE : S.xxl) + insets.bottom,
          },
        ]}
      >
        {children}
      </View>
    </KeyboardAwareScrollView>
  ) : (
    <View
      style={[
        styles.fill,
        styles.inner,
        padded && styles.padded,
        padded && isDesktop && styles.paddedDesktop,
        desktopCol,
      ]}
    >
      {children}
    </View>
  );

  return (
    <View style={styles.root} testID={testID}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={[styles.headerRow, isDesktop && styles.headerRowDesktop]}>
          <View style={[styles.headerInner, desktopBar]}>
            {!backHidden ? (
              <PressableScale
                testID="header-back-button"
                accessibilityLabel="Go back"
                onPress={onBack || (() => router.back())}
                style={styles.backBtn}
                haptic={null}
              >
                <Ionicons name="chevron-back" size={24} color={C.ink} />
              </PressableScale>
            ) : (
              <View style={styles.backBtn} />
            )}
            <View style={styles.titleWrap}>
              {title ? (
                <Text style={styles.title} numberOfLines={1}>
                  {title}
                </Text>
              ) : null}
              {subtitle ? (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <View style={styles.rightWrap}>{right}</View>
          </View>
        </View>
        {belowHeader ? <View style={desktopBar}>{belowHeader}</View> : null}
      </View>

      {content}

      {footer ? (
        <KeyboardStickyView
          offset={{ closed: 0, opened: insets.bottom }}
          style={styles.footerSticky}
        >
          <View style={[styles.footer, { paddingBottom: insets.bottom + S.md }]}>
            {reduceTransparency || Platform.OS === "android" ? (
              <View style={[StyleSheet.absoluteFill, styles.footerSolid]} />
            ) : (
              <BlurView
                intensity={36}
                tint="light"
                style={[StyleSheet.absoluteFill, styles.footerGlass]}
              />
            )}
            <View style={[styles.footerInner, desktopCol]}>{footer}</View>
          </View>
        </KeyboardStickyView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },
  fill: { flex: 1 },
  contentWidth: { width: "100%" },
  inner: { width: "100%" },
  padded: { paddingHorizontal: S.lg, paddingTop: S.lg },
  paddedDesktop: { paddingHorizontal: S.xl, paddingTop: S.xl },
  header: {
    backgroundColor: C.surface,
    borderBottomWidth: HAIRLINE,
    borderBottomColor: C.border,
    zIndex: 10,
  },
  headerRow: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: S.sm,
  },
  headerRowDesktop: { height: 64 },
  headerInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: "100%",
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: { flex: 1, alignItems: "center" },
  title: { fontFamily: F.display, fontSize: 17, color: C.ink },
  subtitle: { fontFamily: F.med, fontSize: 11.5, color: C.inkFaint, marginTop: 1 },
  rightWrap: {
    minWidth: 44,
    height: 44,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: S.sm,
  },
  footerSticky: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  footer: {
    paddingTop: S.md,
    borderTopWidth: HAIRLINE,
    borderTopColor: C.border,
    overflow: "hidden",
  },
  footerGlass: { backgroundColor: "rgba(252,251,255,0.72)" },
  footerSolid: { backgroundColor: C.surface },
  footerInner: { paddingHorizontal: S.lg },
});

/** Horizontal filter chip row — single line, 56pt row, 36pt chips, never wraps. */
export function ChipRow<T extends string>({
  options,
  value,
  onChange,
  testIDPrefix = "chip",
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  testIDPrefix?: string;
}) {
  return (
    <View style={chipStyles.row}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={chipStyles.content}
      >
        {options.map((o) => {
          const selected = o.key === value;
          return (
            <PressableScale
              key={o.key}
              testID={`${testIDPrefix}-${o.key}`}
              accessibilityLabel={`Filter: ${o.label}`}
              onPress={() => onChange(o.key)}
              style={[chipStyles.chip, selected && chipStyles.chipSelected]}
              haptic={null}
            >
              <Text
                style={[chipStyles.label, selected && chipStyles.labelSelected]}
              >
                {o.label}
              </Text>
            </PressableScale>
          );
        })}
      </ScrollView>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  row: { height: 56, justifyContent: "center", backgroundColor: C.surface },
  content: {
    gap: S.sm,
    paddingHorizontal: S.lg,
    alignItems: "center",
  },
  chip: {
    height: 36,
    borderRadius: 999,
    paddingHorizontal: S.lg,
    backgroundColor: C.white,
    borderWidth: 1.25,
    borderColor: C.ink,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  chipSelected: {
    backgroundColor: C.ink,
    borderColor: C.ink,
    boxShadow: "0px 2px 0px #B9B3CE",
  },
  label: { fontFamily: F.semi, fontSize: 13.5, color: C.ink },
  labelSelected: { color: C.onInverse },
});
