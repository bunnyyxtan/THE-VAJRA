import { Platform, StyleSheet } from "react-native";

// Vajra design tokens — bright, dimensional, Monad-native, brutalist-tactile.
export const C = {
  surface: "#FCFBFF",
  surface2: "#F3F0F8",
  surface3: "#E5E1EF",
  ink: "#0E091C",
  inkSoft: "#55506B",
  inkFaint: "#8B86A0",
  inverse: "#0E091C",
  onInverse: "#FCFBFF",
  brand: "#6E54FF",
  brandDark: "#5940E6",
  onBrand: "#FFFFFF",
  lavender: "#DDD7FE",
  lavenderSoft: "#F1EFFF",
  onLavender: "#3D26B8",
  success: "#0B7E6B",
  successBright: "#00D1B2",
  successBg: "#DEF7F1",
  warning: "#A85400",
  warningBright: "#FF9A40",
  warningBg: "#FFF1E3",
  error: "#CC2447",
  errorBright: "#FF4C6A",
  errorBg: "#FFE9EE",
  info: "#0072A3",
  infoBright: "#00B5FF",
  infoBg: "#E2F6FF",
  pink: "#FF7AC3",
  // Secondary accent — emerald. Trust, security, settled money.
  emerald: "#0DA678",
  emeraldDeep: "#087A59",
  emeraldBright: "#19CE9A",
  emeraldBg: "#DFF6EC",
  // Warm gold — protection surfaces (Vajra Touch).
  gold: "#A56A00",
  goldBright: "#F0B23E",
  goldBg: "#FBF1DC",
  border: "#E5E2EC",
  borderStrong: "#0E091C",
  white: "#FFFFFF",
};

export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };
export const R = { sm: 6, md: 12, lg: 20, pill: 999 };

export const F = {
  display: "SpaceGrotesk-Bold",
  displayMed: "SpaceGrotesk-Medium",
  serif: "Fraunces-Italic",
  body: "PlusJakartaSans-Regular",
  med: "PlusJakartaSans-Medium",
  semi: "PlusJakartaSans-SemiBold",
  bold: "PlusJakartaSans-Bold",
};

export const MONO = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
}) as string;

export const HAIRLINE = StyleSheet.hairlineWidth;

// Hard offset shadows — the tactile, printed-object look. (RN 0.76+ boxShadow)
export const hard = { boxShadow: "0px 4px 0px #0E091C" } as const;
export const hardSm = { boxShadow: "0px 3px 0px #0E091C" } as const;
export const hardBrand = { boxShadow: "0px 4px 0px #5940E6" } as const;

// Soft ambient depth for large panels only.
export const cardShadow = {
  boxShadow: "0px 10px 28px rgba(42,28,107,0.10)",
} as const;
export const softShadow = {
  boxShadow: "0px 4px 14px rgba(42,28,107,0.07)",
} as const;

// Layered premium shadows: hard offset (identity) + ambient depth + inner
// top highlight so cards read as physical, lit objects instead of flat fills.
export const premium = {
  boxShadow:
    "0px 5px 0px #0E091C, 0px 22px 44px rgba(42,28,107,0.16), inset 0px 1.5px 0px rgba(255,255,255,0.85)",
} as const;
export const premiumSm = {
  boxShadow:
    "0px 3px 0px #0E091C, 0px 10px 22px rgba(42,28,107,0.09), inset 0px 1px 0px rgba(255,255,255,0.75)",
} as const;
