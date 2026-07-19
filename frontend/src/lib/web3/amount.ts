/**
 * Bigint-safe decimal amount parsing and formatting.
 *
 * Accepts user input like "0.01", ".01", "0,01" (comma decimal separator),
 * "12", "12.5". Never uses floating point for value math.
 */

/** Normalize user input: trim, unify comma/period decimal separators. */
function normalizeDecimalInput(input: string): string {
  return input.trim().replace(/,/g, ".");
}

/**
 * Parse a decimal string into base units (bigint) for a token with
 * `decimals` decimals. Returns null when the input is not a valid,
 * non-negative decimal with at most `decimals` fractional digits.
 */
export function parseDecimalToUnits(
  input: string,
  decimals: number
): bigint | null {
  const normalized = normalizeDecimalInput(input);
  if (normalized === "" || normalized === ".") return null;
  if (!/^\d*\.?\d*$/.test(normalized)) return null;

  const [wholeRaw = "", fracRaw = ""] = normalized.split(".");
  const whole = wholeRaw === "" ? "0" : wholeRaw;
  if (fracRaw.length > decimals) return null;

  const frac = fracRaw.padEnd(decimals, "0");
  const digits = (whole + frac).replace(/^0+(?=\d)/, "");
  try {
    return BigInt(digits === "" ? "0" : digits);
  } catch {
    return null;
  }
}

/**
 * Format base units (bigint) as a decimal string with up to `decimals`
 * fractional digits, trailing zeros trimmed. Pure integer arithmetic.
 */
export function formatUnits(units: bigint, decimals: number): string {
  const negative = units < 0n;
  const abs = negative ? -units : units;
  const base = 10n ** BigInt(decimals);
  const whole = abs / base;
  const frac = abs % base;
  if (frac === 0n) return `${negative ? "-" : ""}${whole.toString()}`;
  const fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole.toString()}.${fracStr}`;
}

/**
 * Sanitize raw typing into a valid in-progress decimal string.
 * Keeps at most one separator and at most `decimals` fractional digits.
 * Returns null when the character is not acceptable at all.
 */
export function sanitizeDecimalTyping(
  input: string,
  decimals: number
): string | null {
  const normalized = normalizeDecimalInput(input);
  if (normalized === "") return "";
  if (!/^\d*\.?\d*$/.test(normalized)) return null;
  const frac = normalized.split(".")[1] ?? "";
  if (frac.length > decimals) return null;
  return normalized;
}
