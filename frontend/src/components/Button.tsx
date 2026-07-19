import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { triggerHaptic } from "./PressableScale";
import { C, F, S } from "@/src/theme";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
  /** Rendered under the button while disabled — explains why (never leave users guessing). */
  disabledReason?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const PALETTE: Record<
  Variant,
  {
    bg: string;
    fg: string;
    border?: string;
    shadow?: boolean;
    disabledBg: string;
    disabledFg: string;
  }
> = {
  primary: {
    bg: C.brand,
    fg: C.onBrand,
    border: C.borderStrong,
    shadow: true,
    disabledBg: C.lavender,
    disabledFg: "#7B6ECC",
  },
  secondary: {
    bg: C.lavenderSoft,
    fg: C.onLavender,
    border: C.borderStrong,
    shadow: true,
    disabledBg: C.surface2,
    disabledFg: C.inkFaint,
  },
  outline: {
    bg: C.white,
    fg: C.ink,
    border: C.borderStrong,
    shadow: true,
    disabledBg: C.white,
    disabledFg: C.inkFaint,
  },
  ghost: {
    bg: "transparent",
    fg: C.brand,
    disabledBg: "transparent",
    disabledFg: C.inkFaint,
  },
  danger: {
    bg: C.white,
    fg: C.error,
    border: C.error,
    shadow: false,
    disabledBg: C.surface2,
    disabledFg: C.inkFaint,
  },
};

/**
 * Tactile brutalist button: hard offset shadow, physical press compression
 * (the button visibly sinks 3px onto its shadow when pressed).
 */
export default function Button({
  label,
  onPress,
  variant = "primary",
  loading,
  loadingLabel,
  disabled,
  disabledReason,
  icon,
  small,
  style,
  testID,
}: Props) {
  const p = PALETTE[variant];
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const isOff = Boolean(disabled || loading);
  const isPrimary = variant === "primary" && !disabled;
  const fg = disabled ? p.disabledFg : p.fg;
  const hasShadow = Boolean(p.shadow) && !disabled;
  const sunk = pressed && hasShadow;
  const lifted = hovered && hasShadow && !pressed && !isOff;
  const shadowStyle = !hasShadow
    ? null
    : sunk
      ? isPrimary
        ? styles.primarySunk
        : null
      : isPrimary
        ? lifted
          ? styles.primaryShadowLift
          : styles.primaryShadow
        : lifted
          ? styles.hardShadowLift
          : styles.hardShadow;

  return (
    <View style={style}>
      {/* fixed-height slot so the press compression never shifts layout */}
      <View style={{ height: (small ? 44 : 56) + (p.shadow ? 3 : 0) }}>
        <Pressable
          testID={testID}
          accessibilityRole="button"
          accessibilityLabel={loading ? loadingLabel || label : label}
          accessibilityState={{ disabled: isOff }}
          disabled={isOff}
          onPress={() => {
            triggerHaptic(variant === "primary" ? "medium" : "light");
            onPress();
          }}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          onHoverIn={() => setHovered(true)}
          onHoverOut={() => setHovered(false)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.base,
            small ? styles.small : styles.regular,
            {
              backgroundColor: disabled ? p.disabledBg : p.bg,
              borderWidth: p.border ? 1.5 : 0,
              borderColor: disabled ? C.border : p.border,
              transform: [{ translateY: sunk ? 3 : lifted ? -1 : 0 }],
              opacity: hovered && !hasShadow && !isOff ? 0.85 : 1,
            },
            shadowStyle,
            Platform.OS === "web" && focused && !isOff
              ? styles.focusRing
              : null,
          ]}
        >
          {isPrimary ? (
            <LinearGradient
              colors={
                hovered && !pressed
                  ? ["#8B72FF", "#7259FF", "#5940E6"]
                  : ["#8268FF", "#6E54FF", "#5940E6"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          ) : null}
          {loading ? (
            <ActivityIndicator size="small" color={fg} />
          ) : icon ? (
            <Ionicons name={icon} size={small ? 16 : 19} color={fg} />
          ) : null}
          <Text
            numberOfLines={1}
            style={[styles.label, { color: fg, fontSize: small ? 14 : 15.5 }]}
          >
            {loading ? loadingLabel || label : label}
          </Text>
        </Pressable>
      </View>
      {disabled && !loading && disabledReason ? (
        <Text
          testID={testID ? `${testID}-disabled-reason` : undefined}
          accessibilityLiveRegion="polite"
          style={styles.reason}
        >
          {disabledReason}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: S.sm,
    borderRadius: 14,
    paddingHorizontal: S.xl,
    overflow: "hidden",
  },
  hardShadow: { boxShadow: "0px 3px 0px #0E091C" },
  hardShadowLift: { boxShadow: "0px 4px 0px #0E091C" },
  primaryShadow: {
    boxShadow:
      "0px 3px 0px #0E091C, 0px 12px 24px rgba(110,84,255,0.30), inset 0px 1px 0px rgba(255,255,255,0.30)",
  },
  primaryShadowLift: {
    boxShadow:
      "0px 4px 0px #0E091C, 0px 16px 30px rgba(110,84,255,0.38), inset 0px 1px 0px rgba(255,255,255,0.30)",
  },
  primarySunk: {
    boxShadow: "inset 0px 1px 0px rgba(255,255,255,0.22)",
  },
  focusRing: {
    outlineStyle: "solid",
    outlineWidth: 2,
    outlineColor: "rgba(110,84,255,0.55)",
    outlineOffset: 2,
  },
  regular: { height: 56 },
  small: { height: 44, paddingHorizontal: S.lg },
  label: { fontFamily: F.bold, letterSpacing: 0.1 },
  reason: {
    marginTop: S.sm,
    fontFamily: F.med,
    fontSize: 12.5,
    lineHeight: 17,
    color: C.inkSoft,
    textAlign: "center",
  },
});
