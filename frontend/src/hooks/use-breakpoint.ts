import { useWindowDimensions } from "react-native";

/** Responsive breakpoints shared across the app. */
export function useBreakpoint() {
  const { width } = useWindowDimensions();
  return {
    width,
    isTablet: width >= 768,
    isDesktop: width >= 1024,
    isWide: width >= 1280,
  };
}
