export const isHexAddress = (s: string): boolean =>
  /^0x[a-fA-F0-9]{40}$/.test(s.trim());

export const shortAddr = (a: string): string =>
  a && a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;

export const shortHash = (h: string): string =>
  h && h.length > 16 ? `${h.slice(0, 10)}…${h.slice(-6)}` : h;

/** Group thousands, trim trailing zeros, never round silently (keeps entered precision up to 6dp). */
export const fmtMon = (v: string | number): string => {
  const n = typeof v === "number" ? v : parseFloat(v);
  if (!isFinite(n)) return "0";
  const [int, dec] = String(v).includes(".")
    ? String(v).split(".")
    : [String(Math.trunc(n)), ""];
  const grouped = Number(int).toLocaleString("en-US");
  const trimmedDec = (dec || "").replace(/0+$/, "");
  return trimmedDec ? `${grouped}.${trimmedDec}` : grouped;
};

export const fmtUsd = (mon: number, rate: number): string =>
  (mon * rate).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });

/** Locale-safe absolute datetime with explicit timezone. */
export const fmtDateTime = (iso: string): string => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toUTCString();
  }
};

export const timeAgo = (iso: string): string => {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return fmtDateTime(iso).split(",")[0];
};

/** "Expires in 23h" style — null when past. */
export const timeUntil = (iso: string | null): string | null => {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return null;
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ${m % 60}m`;
  return `${Math.floor(h / 24)} days`;
};

const B36 = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export const makeId = (): string => {
  let out = "VJ-";
  for (let i = 0; i < 6; i++)
    out += B36[Math.floor(Math.random() * B36.length)];
  return out;
};

/** Deterministic pseudo hex from a seed string (prototype data). */
const hex = (seed: string, len: number): string => {
  let h = 2166136261;
  let out = "";
  for (let i = 0; out.length < len; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i % seed.length) ^ i, 16777619) >>> 0;
    out += h.toString(16);
  }
  return out.slice(0, len);
};

export const txHashFor = (id: string): string => `0x${hex(`tx:${id}`, 64)}`;
export const sigFor = (id: string): string => `0x${hex(`sig:${id}`, 130)}`;
export const blockFor = (id: string): number =>
  21400000 + (parseInt(hex(`blk:${id}`, 6), 16) % 90000);
