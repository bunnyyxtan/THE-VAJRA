import type { ReactNode } from "react";

export const PROOF_CHAIN_STAGES = [
  "Terms defined",
  "Recipient signed",
  "Request shared",
  "Payer verified",
  "Transaction submitted",
  "Contract settled",
  "Receipt sealed",
] as const;

export type ProofStageStatus = "complete" | "current" | "upcoming" | "failed";

export interface ProofStage {
  label: string;
  status: ProofStageStatus;
  /** Failure only: short explanation of what did and did not happen. */
  failureNote?: string;
  /** Failure only: recovery action rendered beside the failed stage. */
  recovery?: ReactNode;
}

function StageIcon({ status }: { status: ProofStageStatus }) {
  if (status === "complete") {
    return (
      <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path
          d="M2.5 6.4l2.4 2.3 4.6-5.2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (status === "failed") {
    return (
      <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path
          d="M3.5 3.5l5 5m0-5l-5 5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (status === "current") {
    return (
      <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <circle cx="6" cy="6" r="2.6" fill="currentColor" />
      </svg>
    );
  }
  return null;
}

/**
 * ProofChain — VAJRA's original motif. Horizontal on desktop, compact
 * vertical rail on mobile. The current stage carries the strongest contrast
 * and a restrained opacity pulse that stops on completion; completed
 * connectors fill in 160–220ms; failure labels the stage and offers a
 * recovery action without red flashing. Under reduced motion everything is
 * static text and shapes — no information is lost.
 */
export function ProofChain({
  stages,
  ariaLabel = "Payment progress",
}: {
  stages: ProofStage[];
  ariaLabel?: string;
}) {
  const currentIndex = stages.findIndex((s) => s.status === "current");
  const failedIndex = stages.findIndex((s) => s.status === "failed");
  const activeIndex = failedIndex >= 0 ? failedIndex : currentIndex;

  return (
    <ol
      className="proof"
      aria-label={ariaLabel}
      aria-current={activeIndex >= 0 ? "step" : undefined}
    >
      {stages.map((stage, i) => (
        <li
          key={`${stage.label}-${i}`}
          className={`proof__stage proof__stage--${stage.status}`}
          aria-current={i === activeIndex ? "step" : undefined}
        >
          <span className="proof__node">
            <StageIcon status={stage.status} />
          </span>
          <span className="proof__body">
            <span className="proof__label">
              {stage.label}
              {stage.status === "failed" && (
                <span className="visually-hidden"> — failed</span>
              )}
              {stage.status === "current" && (
                <span className="visually-hidden"> — in progress</span>
              )}
            </span>
            {stage.status === "failed" && stage.failureNote && (
              <span className="field__hint">{stage.failureNote}</span>
            )}
            {stage.status === "failed" && stage.recovery && (
              <span className="proof__recovery">{stage.recovery}</span>
            )}
          </span>
        </li>
      ))}
    </ol>
  );
}
