import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTransparencyPref } from "@/src/state/vajra";
import { useBreakpoint } from "@/src/hooks/use-breakpoint";
import { C, F, R, S } from "@/src/theme";

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  dismissable?: boolean;
  testID?: string;
}

export default function Sheet({
  visible,
  onClose,
  title,
  children,
  dismissable = true,
  testID,
}: Props) {
  const insets = useSafeAreaInsets();
  const reduceTransparency = useTransparencyPref();
  const { isTablet } = useBreakpoint();
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(progress, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(progress, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => setMounted(false));
    }
  }, [visible, progress]);

  if (!mounted) return null;

  return (
    <Modal
      transparent
      visible
      animationType="none"
      onRequestClose={dismissable ? onClose : undefined}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={[styles.root, isTablet && styles.rootCenter]}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: reduceTransparency
                ? "rgba(14,9,28,0.72)"
                : "rgba(14,9,28,0.45)",
              opacity: progress,
            },
          ]}
        >
          <Pressable
            testID={testID ? `${testID}-backdrop` : "sheet-backdrop"}
            accessibilityLabel="Close sheet"
            style={StyleSheet.absoluteFill}
            onPress={dismissable ? onClose : undefined}
          />
        </Animated.View>
        <Animated.View
          testID={testID}
          style={[
            styles.sheet,
            isTablet && styles.sheetDialog,
            {
              paddingBottom: isTablet
                ? S.xl
                : Math.max(insets.bottom, S.lg) + S.sm,
              opacity: progress,
              transform: [
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [isTablet ? 24 : 56, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {!isTablet ? <View style={styles.handle} /> : null}
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  rootCenter: { justifyContent: "center", alignItems: "center" },
  sheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: R.lg + 8,
    borderTopRightRadius: R.lg + 8,
    paddingHorizontal: S.xl,
    paddingTop: S.md,
    maxHeight: "88%",
  },
  sheetDialog: {
    width: "94%",
    maxWidth: 460,
    borderRadius: R.lg + 8,
    borderWidth: 1.5,
    borderColor: C.ink,
    paddingTop: S.xl,
    boxShadow: "0px 6px 0px #0E091C",
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: R.pill,
    backgroundColor: C.surface3,
    marginBottom: S.lg,
  },
  title: {
    fontFamily: F.display,
    fontSize: 20,
    color: C.ink,
    marginBottom: S.md,
  },
});
