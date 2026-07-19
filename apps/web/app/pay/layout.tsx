import type { Metadata } from "next";
import "@/components/screens/screens.css";

export const metadata: Metadata = {
  title: "Payment request",
  description:
    "Verify a signed Vajra payment request and pay the exact amount on Monad Mainnet.",
};

export default function PayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
