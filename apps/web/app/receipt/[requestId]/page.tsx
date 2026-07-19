import type { Metadata } from "next";
import { ReceiptView } from "@/components/screens/receipt/ReceiptView";
import "@/components/screens/screens.css";
import "@/components/screens/receipt/receipt.css";

export const metadata: Metadata = {
  title: "Payment receipt — VAJRA",
  description:
    "Verify a Vajra settlement directly against the canonical VajraNativeV1 contract on Monad Mainnet.",
};

/**
 * /receipt/[requestId] — receipt verification (design-direction §RECEIPT,
 * blueprint §14). All evidence is read live from chain state; nothing is
 * trusted from the URL beyond the request ID itself.
 */
export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  return <ReceiptView requestId={decodeURIComponent(requestId)} />;
}
