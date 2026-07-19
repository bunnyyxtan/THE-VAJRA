import { blockFor, sigFor, txHashFor } from "./format";
import type { PaymentRequest, Wallet } from "./types";

// ——— Deterministic prototype data. No real chain, wallet, or backend is contacted. ———

export const MON_USD = 3.42;

export const VAJRA_CONTRACT = "0x54a1e3d2c4b99f0e7a8d21c6bb0453f8e19d70aa";

export const DEMO_WALLET: Wallet = {
  address: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
  label: "Vajra Demo Wallet",
  network: "Monad Mainnet",
};

export const MERCHANT = "0x3d91f0a6bcd44e5a9c027f6b8e21ad4c9f8e6b12";
export const OTHER_PAYER = "0x1b7e44c09d3f2a85e6b190cd47a3ff28d05c9e77";

export const linkFor = (id: string): string => `https://vajra.link/r/${id}`;
export const explorerTx = (hash: string): string =>
  `https://monadexplorer.com/tx/${hash}`;

export const delay = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

const hoursFromNow = (h: number): string =>
  new Date(Date.now() + h * 3600_000).toISOString();

const base = (id: string, over: Partial<PaymentRequest>): PaymentRequest => ({
  id,
  amountMon: "42.5",
  recipient: MERCHANT,
  recipientLabel: "Aster Studio",
  memo: "Table 12 dinner",
  network: "Monad Mainnet",
  contract: VAJRA_CONTRACT,
  createdAt: hoursFromNow(-4),
  expiresAt: hoursFromNow(20),
  restrictedPayer: null,
  status: "active",
  authMethod: "passkey",
  signature: sigFor(id),
  ...over,
});

export const DEMO_REQUESTS: Record<string, PaymentRequest> = {
  "VJ-CAFE42": base("VJ-CAFE42", { scenario: "ok" }),
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
  "VJ-PAID88": base("VJ-PAID88", {
    scenario: "already-paid",
    status: "paid",
    amountMon: "120",
    memo: "Photography session",
    createdAt: hoursFromNow(-50),
    txHash: txHashFor("VJ-PAID88"),
    paidBy: DEMO_WALLET.address,
    paidAt: hoursFromNow(-48),
    finalizedAt: hoursFromNow(-48),
    blockNumber: blockFor("VJ-PAID88"),
  }),
  "VJ-RPCDWN": base("VJ-RPCDWN", {
    scenario: "rpc-unavailable",
    amountMon: "55",
    memo: "Consulting hour",
  }),
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

/** First-run local data so Home and Activity feel alive. */
export const seedRequests = (): PaymentRequest[] => [
  {
    id: "VJ-MJX4T2",
    amountMon: "120",
    recipient: DEMO_WALLET.address,
    recipientLabel: "You",
    memo: "Photography session",
    network: "Monad Mainnet",
    contract: VAJRA_CONTRACT,
    createdAt: hoursFromNow(-49),
    expiresAt: null,
    restrictedPayer: null,
    status: "paid",
    authMethod: "passkey",
    signature: sigFor("VJ-MJX4T2"),
    mine: true,
    txHash: txHashFor("VJ-MJX4T2"),
    paidBy: OTHER_PAYER,
    paidAt: hoursFromNow(-48),
    finalizedAt: hoursFromNow(-48),
    blockNumber: blockFor("VJ-MJX4T2"),
  },
  {
    id: "VJ-Q8KWNP",
    amountMon: "12",
    recipient: DEMO_WALLET.address,
    recipientLabel: "You",
    memo: "Design sprint invoice",
    network: "Monad Mainnet",
    contract: VAJRA_CONTRACT,
    createdAt: hoursFromNow(-6),
    expiresAt: hoursFromNow(66),
    restrictedPayer: null,
    status: "active",
    authMethod: "passkey",
    signature: sigFor("VJ-Q8KWNP"),
    mine: true,
  },
  {
    id: "VJ-ZT2R9C",
    amountMon: "5.5",
    recipient: DEMO_WALLET.address,
    recipientLabel: "You",
    memo: "Shared ride",
    network: "Monad Mainnet",
    contract: VAJRA_CONTRACT,
    createdAt: hoursFromNow(-96),
    expiresAt: hoursFromNow(-72),
    restrictedPayer: null,
    status: "expired",
    authMethod: "passkey",
    signature: sigFor("VJ-ZT2R9C"),
    mine: true,
  },
];
