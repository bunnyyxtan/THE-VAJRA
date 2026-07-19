import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Motion & Interaction Lab — VAJRA (dev only)",
  robots: { index: false, follow: false },
};

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return children;
}
