import { blockFor, sigFor, txHashFor } from "./format";
import type { PaymentRequest } from "./types";
import { CANONICAL_CONTRACT_ADDRESS } from "./web3/chain";

// ——— Deterministic sample data for the "Sample requests" preview. ———
// No real chain, wallet, or backend is contacted for these; the pay screen
// renders a scenario preview instead of an onchain verification.

const RECIPIENT = "0x3d91f0a6bcd44e5a9c027f6b8e21ad4c9f8e6b12";
const OTHER_PAYER = "0x1b7e44c09d3f2a85e6b190cd47a3ff28d05c9e77";

const hoursFromNow = (h: number): string =>
  new Date(Date.now() + h * 3600_000).toISOString();

const base = (id: string, over: Partial<PaymentRequest>): PaymentRequest => ({
  id,
  amountMon: "42.5",
  recipient: RECIPIENT,
  recipientLabel: "Aster Studio",
  memo: "Table 12 dinner",
  network: "Monad Mainnet",
  contract: CANONICAL_CONTRACT_ADDRESS,
  createdAt: hoursFromNow(-4),
  expiresAt: hoursFromNow(20),
  restrictedPayer: null,
  status: "active",
  authMethod: "passkey",
  signature: sigFor(id),
  ...over,
});

export const SAMPLE_REQUESTS: Record<string, PaymentRequest> = {
  "VJ-CAFE42": base("VJ-CAFE42", { scenario: "ok" }),
  "VJ-SLOW11": base("VJ-SLOW11", {
    scenario: "slow",
    amountMon: "8.2",
    memo: "Split lunch",
  }),
  "VJ-UNSURE": base("VJ-UNSURE", {
    scenario: "uncertain",
    amountMon: "31",
    memo: "Ticket resale",
  }),
  "VJ-PAID88": base("VJ-PAID88", {
    scenario: "already-paid",
    status: "paid",
    amountMon: "120",
    memo: "Photography session",
    createdAt: hoursFromNow(-50),
    txHash: txHashFor("VJ-PAID88"),
    paidBy: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
    paidAt: hoursFromNow(-48),
    finalizedAt: hoursFromNow(-48),
    blockNumber: blockFor("VJ-PAID88"),
  }),
  "VJ-EXP7D1": base("VJ-EXP7D1", {
    scenario: "expired",
    status: "expired",
    amountMon: "18",
    memo: "Workshop deposit",
    createdAt: hoursFromNow(-80),
    expiresAt: hoursFromNow(-8),
  }),
  "VJ-RVK9K2": base("VJ-RVK9K2", {
    scenario: "revoked",
    status: "revoked",
    amountMon: "260",
    memo: "Studio rental, March",
    createdAt: hoursFromNow(-30),
  }),
  "VJ-PAYER3": base("VJ-PAYER3", {
    scenario: "wrong-wallet",
    amountMon: "75",
    memo: "Invoice #2214",
    restrictedPayer: OTHER_PAYER,
  }),
  "VJ-NETETH": base("VJ-NETETH", {
    scenario: "wrong-network",
    amountMon: "12.75",
    memo: "Coffee subscription",
  }),
  "VJ-TAMPRD": base("VJ-TAMPRD", {
    scenario: "invalid-signature",
    amountMon: "999",
    memo: "URGENT: pay now",
  }),
  "VJ-RPCDWN": base("VJ-RPCDWN", {
    scenario: "rpc-unavailable",
    amountMon: "55",
    memo: "Consulting hour",
  }),
};

export const SCENARIO_LIST: {
  id: string;
  title: string;
  desc: string;
  tone: "ok" | "warn" | "error";
}[] = [
  { id: "VJ-CAFE42", title: "Valid request", desc: "Verifies cleanly and can be paid", tone: "ok" },
  { id: "VJ-SLOW11", title: "Slow inclusion", desc: "Monad takes longer than usual", tone: "ok" },
  { id: "VJ-UNSURE", title: "Uncertain result", desc: "Broadcast, then status must be re-checked", tone: "warn" },
  { id: "VJ-PAID88", title: "Already paid", desc: "Settled once and cannot be paid again", tone: "warn" },
  { id: "VJ-EXP7D1", title: "Expired", desc: "The recipient's terms lapsed", tone: "warn" },
  { id: "VJ-RVK9K2", title: "Revoked", desc: "Recipient cancelled this request", tone: "warn" },
  { id: "VJ-PAYER3", title: "Wrong wallet", desc: "Restricted to a different payer", tone: "error" },
  { id: "VJ-NETETH", title: "Wrong network", desc: "Wallet connects on Ethereum", tone: "error" },
  { id: "VJ-TAMPRD", title: "Tampered link", desc: "Signature check breaks the handshake", tone: "error" },
  { id: "VJ-RPCDWN", title: "Monad unreachable", desc: "Verification fails closed", tone: "error" },
];
