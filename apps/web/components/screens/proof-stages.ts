/**
 * VAJRA's proof chain — the seven canonical stages (design-direction-v1
 * §Proof chain). The ui/ProofChain primitive renders them; this module owns
 * the labels and the mapping from screen progress to stage states.
 */

import type { ProofStage, ProofStageState } from "@/components/ui";

export const PROOF_CHAIN_STAGES = [
  "Terms defined",
  "Recipient signed",
  "Request shared",
  "Payer verified",
  "Transaction submitted",
  "Contract settled",
  "Receipt sealed",
] as const;

export type ProofProgress = "done" | "current" | "pending" | "failed";

/**
 * Builds ProofChain stages from per-stage progress. `progress[i]` is the
 * state of stage i; stages without an entry are pending.
 */
export function buildProofStages(
  progress: readonly ProofProgress[],
  details?: readonly (string | undefined)[],
): ProofStage[] {
  return PROOF_CHAIN_STAGES.map((label, i) => ({
    id: `stage-${i}`,
    label,
    state: (progress[i] ?? "pending") as ProofStageState,
    detail: details?.[i],
  }));
}
