import type { Metadata } from "next";
import { RequestProviders } from "@/components/create-request/RequestProviders";

export const metadata: Metadata = {
  title: "Create request — VAJRA",
  description:
    "Define payment terms, sign them with your wallet, and share a recipient-authenticated payment link on Monad Mainnet.",
};

export default function RequestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequestProviders>{children}</RequestProviders>;
}
