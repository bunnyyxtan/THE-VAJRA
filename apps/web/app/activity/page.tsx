import type { Metadata } from "next";
import { ActivityLedger } from "@/components/screens/activity/ActivityLedger";
import "@/components/screens/screens.css";
import "@/components/screens/activity/activity.css";

export const metadata: Metadata = {
  title: "Activity — VAJRA",
  description:
    "Requests and transactions known to this device, with live settlement status from Monad Mainnet.",
};

export default function ActivityPage() {
  return <ActivityLedger />;
}
