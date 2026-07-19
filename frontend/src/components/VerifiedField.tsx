import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";

import { useMotionPref } from "@/src/state/vajra";
import { C, F, MONO, R, S } from "@/src/theme";

export type VerifyState = "idle" | "verifying" | "verified" | "broken";

interface Props {
  label: string;
  value: string;
  /** Optional full value revealed on tap (e.g. full wallet address). */
  fullValue?: string;
  sub?: string;
  mono?: boolean;
  state?: VerifyState;
  locked?: boolean;
  big?: boolean;
  testID?: string;
}

/**
 * A protected request field on a solid high-contrast surface with a precise border.
 * Shows a cyan verification mark when verified, a broken mark when tampered,
 * and a lock glyph once terms are locked by the recipient.
 */
export default function VerifiedField({
  label,
  value,
  fullValue,
  sub,
  mono,
  state = "idle",
  locked,
  big,
  testID,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const reduceMotion = useMotionPref();

  useEffect(() => {
    if (state !== "verified" && expanded) setExpanded(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const body = (
    <View
      style={[
        styles.card,
        big && styles.cardBig,
        state === "broken" && styles.cardBroken,
        state === "verified" && styles.cardVerified,
        big && state === "verified" && { borderColor: C.ink },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.labelRow}>
          {locked ? (
            <Ionicons name="lock-closed" size={11} color={C.brand} />
          ) : null}
          <Text style={styles.label}>{label}</Text>
        </View>
        <View style={styles.mark} accessibilityLiveRegion="polite">
          {state === "verifying" ? (
            <ActivityIndicator size="small" color={C.infoBright} />
          ) : state === "verified" ? (
            <Animated.View
              entering={reduceMotion ? undefined : ZoomIn.duration(260)}
              style={styles.markRow}
            >
              <Ionicons name="checkmark-circle" size={20} color={C.infoBright} />
            </Animated.View>
          ) : state === "broken" ? (
            <Animated.View
              entering={reduceMotion ? undefined : ZoomIn.duration(200)}
              style={styles.markRow}
            >
              <Ionicons name="close-circle" size={20} color={C.errorBright} />
            </Animated.View>
          ) : null}
        </View>
      </View>
      <Text
        style={[
          styles.value,
          mono && styles.mono,
          big && styles.big,
          state === "broken" && { color: C.error },
        ]}
        accessibilityLabel={`${label}: ${fullValue || value}`}
      >
        {expanded && fullValue ? fullValue : value}
      </Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
      {fullValue ? (
        <Text style={styles.expandHint}>
          {expanded ? "Tap to shorten" : "Tap to view full"}
        </Text>
      ) : null}
    </View>
  );

  if (!fullValue) return <View testID={testID}>{body}</View>;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${expanded ? "Shorten" : "Show full value"}`}
      onPress={() => setExpanded((e) => !e)}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderRadius: R.md + 2,
    borderWidth: 1.25,
    borderColor: C.border,
    paddingHorizontal: S.lg,
    paddingVertical: S.md + 2,
  },
  cardBig: {
    borderColor: C.ink,
    borderWidth: 1.5,
    boxShadow: "0px 4px 0px #0E091C",
  },
  cardVerified: { borderColor: "#BFE9FB" },
  cardBroken: { borderColor: C.errorBright, backgroundColor: "#FFF6F8" },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 22,
  },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  label: {
    fontFamily: F.bold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: C.inkFaint,
  },
  mark: { width: 24, height: 22, alignItems: "flex-end", justifyContent: "center" },
  markRow: { flexDirection: "row", alignItems: "center" },
  value: { fontFamily: F.semi, fontSize: 16, lineHeight: 22, color: C.ink, marginTop: 2 },
  mono: { fontFamily: MONO, fontSize: 13.5, letterSpacing: 0.2 },
  big: { fontFamily: F.display, fontSize: 30, lineHeight: 36 },
  sub: { fontFamily: F.med, fontSize: 12, color: C.inkSoft, marginTop: 3 },
  expandHint: { fontFamily: F.med, fontSize: 11, color: C.brand, marginTop: 5 },
});
