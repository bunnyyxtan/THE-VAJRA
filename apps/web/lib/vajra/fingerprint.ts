/**
 * Vajra Code — a short human-comparison code derived from the requestId
 * (blueprint §17 "Vajra Code").
 *
 * Derivation (ADR in log.md, 2026-07-19):
 *   Take the FIRST 4 BYTES of the canonical requestId (the EIP-712 digest),
 *   render them as 8 uppercase hex characters, grouped 4-4 with a hyphen:
 *     requestId 0xad0a4e98…  →  "AD0A-4E98"
 *
 * Rationale:
 *   - Deterministic and trivially reproducible on both sides (recipient and
 *     payer compute the same requestId from the same canonical fields).
 *   - Hex is case-insensitive on input, has no visually ambiguous alphabet
 *     (no O/0, I/1/l confusion beyond what hex already carries), and matches
 *     the hexadecimal language of the rest of the evidence surfaces.
 *   - 32 bits is a USABILITY AID ONLY, not a cryptographic replacement
 *     (blueprint §17). Full address and digest remain the authoritative
 *     comparison; the code supports out-of-band confirmation for high-value
 *     payments. Collision probability is irrelevant to security because the
 *     code is never used to authorize anything.
 */

import type { Bytes32 } from './types';

const CODE_RE = /^[0-9a-fA-F]{8}$/;

/** Computes the Vajra Code for a requestId: 8 uppercase hex chars, "XXXX-XXXX". */
export function vajraCodeFromRequestId(requestId: Bytes32): string {
  const hex = requestId.slice(2, 10).toUpperCase();
  return `${hex.slice(0, 4)}-${hex.slice(4)}`;
}

/**
 * Normalizes a user-entered code for comparison: strips whitespace, hyphens
 * and case. Returns null when the input cannot be a Vajra Code.
 */
export function normalizeVajraCode(input: string): string | null {
  const compact = input.replace(/[\s-]+/g, '');
  if (!CODE_RE.test(compact)) return null;
  return compact.toUpperCase();
}

/** Compares a user-entered code against the code for a requestId. */
export function vajraCodeMatches(requestId: Bytes32, input: string): boolean {
  const normalized = normalizeVajraCode(input);
  if (normalized === null) return false;
  return vajraCodeFromRequestId(requestId).replace('-', '') === normalized;
}
