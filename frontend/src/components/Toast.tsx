import { Ionicons } from "@expo/vector-icons";
import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { C, F, R, S, cardShadow } from "@/src/theme";

type ToastType = "neutral" | "success" | "error";

interface ToastCtx {
  toast: (message: string, type?: ToastType) => void;
}

const Ctx = createContext<ToastCtx>({ toast: () => {} });

export const useToast = () => useContext(Ctx);

const ICONS: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  neutral: "information-circle",
  success: "checkmark-circle",
  error: "alert-circle",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [msg, setMsg] = useState<{ text: string; type: ToastType } | null>(
    null,
  );
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback(
    (text: string, type: ToastType = "neutral") => {
      if (timer.current) clearTimeout(timer.current);
      setMsg({ text, type });
      Animated.timing(anim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      timer.current = setTimeout(() => {
        Animated.timing(anim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }).start(() => setMsg(null));
      }, 2200);
    },
    [anim],
  );

  return (
    <Ctx.Provider value={{ toast }}>
      <View style={styles.fill}>
        {children}
        {msg ? (
          <Animated.View
            pointerEvents="none"
            accessibilityLiveRegion="polite"
            testID="toast"
            style={[
              styles.toast,
              cardShadow,
              {
                top: insets.top + S.md,
                opacity: anim,
                transform: [
                  {
                    translateY: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-12, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons
              name={ICONS[msg.type]}
              size={17}
              color={
                msg.type === "success"
                  ? C.successBright
                  : msg.type === "error"
                    ? C.errorBright
                    : C.lavender
              }
            />
            <Text style={styles.text} numberOfLines={2}>
              {msg.text}
            </Text>
          </Animated.View>
        ) : null}
      </View>
    </Ctx.Provider>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  toast: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: S.sm,
    backgroundColor: C.inverse,
    borderRadius: R.pill,
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
    maxWidth: "86%",
    zIndex: 1000,
  },
  text: { fontFamily: F.semi, fontSize: 13.5, color: C.onInverse },
});
