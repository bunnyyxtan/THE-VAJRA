import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { LogBox } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { ToastProvider } from "@/src/components/Toast";
import { VajraProvider } from "@/src/state/vajra";
import { C } from "@/src/theme";

// Disable logbox errors etc so that users can see the app
// and agent works as expected.
LogBox.ignoreAllLogs(true);

// Keep the native splash visible from cold start until icon fonts register.
// Required because @expo/vector-icons' componentDidMount fallback fires
// Font.loadAsync against a broken vendor path if any <Icon> mounts before
// the family is registered — which throws on Android Expo Go.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [iconsLoaded, iconsError] = useIconFonts();
  const [fontsLoaded, fontsError] = useFonts({
    "SpaceGrotesk-Bold": require("../assets/fonts/SpaceGrotesk-Bold.ttf"),
    "SpaceGrotesk-Medium": require("../assets/fonts/SpaceGrotesk-Medium.ttf"),
    "Fraunces-Italic": require("../assets/fonts/Fraunces-Italic.ttf"),
    "PlusJakartaSans-Regular": require("../assets/fonts/PlusJakartaSans-Regular.ttf"),
    "PlusJakartaSans-Medium": require("../assets/fonts/PlusJakartaSans-Medium.ttf"),
    "PlusJakartaSans-SemiBold": require("../assets/fonts/PlusJakartaSans-SemiBold.ttf"),
    "PlusJakartaSans-Bold": require("../assets/fonts/PlusJakartaSans-Bold.ttf"),
  });

  const iconsReady = iconsLoaded || Boolean(iconsError);
  const fontsReady = fontsLoaded || Boolean(fontsError);

  useEffect(() => {
    if (iconsReady && fontsReady) {
      SplashScreen.hideAsync();
    }
  }, [iconsReady, fontsReady]);

  // If the CDN is unreachable we fall through on error rather than wedging
  // the app — icons will tofu, but the app still boots.
  if (!iconsReady || !fontsReady) return null;

  return (
    <KeyboardProvider>
      <VajraProvider>
        <ToastProvider>
          <StatusBar style="dark" backgroundColor={C.surface} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: C.surface },
            }}
          />
        </ToastProvider>
      </VajraProvider>
    </KeyboardProvider>
  );
}
