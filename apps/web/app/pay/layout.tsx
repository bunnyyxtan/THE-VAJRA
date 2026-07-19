import type { Metadata } from "next";
import { ScreenWalletProviders } from "@/components/screens/wallet-providers";
import "@/components/screens/screens.css";

export const metadata: Metadata = {
  title: "Payment request — VAJRA",
  description:
    "Verify a signed Vajra payment request and pay the exact amount on Monad Mainnet.",
};

export default function PayLayout({ children }: { children: React.ReactNode }) {
  return <ScreenWalletProviders>{children}</ScreenWalletProviders>;
}
