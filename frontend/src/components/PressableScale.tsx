import * as Haptics from "expo-haptics";
import React, { useCallback } from "react";
import { Platform, Pressable, StyleProp, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useMotionPref } from "@/src/state/vajra";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  haptic?: "light" | "medium" | "success" | null;
  scaleTo?: number;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityRole?: "button" | "link" | "switch";
  hitSlop?: number;
}

export function triggerHaptic(kind: "light" | "medium" | "success" | "error") {
  if (Platform.OS === "web") return;
  try {
    if (kind === "success")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (kind === "error")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    else
      Haptics.impactAsync(
        kind === "medium"
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light,
      );
  } catch {
    // haptics unavailable — fine
  }
}

export default function PressableScale({
  children,
  onPress,
  onLongPress,
  disabled,
  style,
  haptic = "light",
  scaleTo = 0.97,
  testID,
  accessibilityLabel,
  accessibilityRole = "button",
  hitSlop,
}: Props) {
  const reduceMotion = useMotionPref();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    if (disabled) return;
    if (haptic) triggerHaptic(haptic);
    onPress?.();
  }, [disabled, haptic, onPress]);

  return (
    <AnimatedPressable
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={handlePress}
      onLongPress={onLongPress}
      onPressIn={() => {
        if (!reduceMotion)
          scale.value = withTiming(scaleTo, { duration: 90 });
      }}
      onPressOut={() => {
        if (!reduceMotion) scale.value = withTiming(1, { duration: 140 });
      }}
      onHoverIn={() => {
        if (!reduceMotion && !disabled)
          scale.value = withTiming(1.01, { duration: 120 });
      }}
      onHoverOut={() => {
        if (!reduceMotion) scale.value = withTiming(1, { duration: 140 });
      }}
      style={[animStyle, style]}
    >
      {children}
    </AnimatedPressable>
  );
}
