import type { Metadata } from "next";
import "@/components/screens/screens.css";

export const metadata: Metadata = {
  title: "Create request",
  description:
    "Define payment terms, sign them with your wallet, and share a recipient-authenticated payment link on Monad Mainnet.",
};

export default function RequestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
