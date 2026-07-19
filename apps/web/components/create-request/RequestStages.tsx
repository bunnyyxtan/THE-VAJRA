"use client";

/**
 * RequestStages — the named async stages of request creation
 * (design-direction-v1 §Async stages): never a bare spinner, always a named
 * stage whose clock we are waiting on.
 *
 *   Preparing terms → Awaiting signature → Signing → Request created → Link ready
 *
 * `reached` is the index of the furthest stage reached; `waiting` marks the
 * stage whose clock is currently running. Stages before `reached` render as
 * complete; the stage at `reached` renders as current.
 */
export const REQUEST_STAGES = [
  "Preparing terms",
  "Awaiting signature",
  "Signing",
  "Request created",
  "Link ready",
] as const;

export type RequestStageStatus = "complete" | "current" | "upcoming";

export function RequestStages({
  reached,
  waiting,
  ariaLabel = "Request creation progress",
}: {
  /** Index of the furthest stage reached (0-based). */
  reached: number;
  /** Whether the stage at `reached` is still in progress. */
  waiting: boolean;
  ariaLabel?: string;
}) {
  const statusOf = (index: number): RequestStageStatus => {
    if (index < reached) return "complete";
    if (index === reached) return waiting ? "current" : "complete";
    return "upcoming";
  };

  return (
    <ol className="stages" aria-label={ariaLabel} aria-live="polite">
      {REQUEST_STAGES.map((label, index) => {
        const status = statusOf(index);
        return (
          <li key={label} className={`stages__item stages__item--${status}`}>
            <span className="stages__dot" aria-hidden="true">
              {status === "complete" ? (
                <svg viewBox="0 0 12 12" fill="none" width="12" height="12">
                  <path
                    d="M2.5 6.4l2.4 2.3 4.6-5.2"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : status === "current" ? (
                <span className="stages__dot-core" />
              ) : null}
            </span>
            <span className="stages__label">
              {label}
              {status === "current" && (
                <span className="visually-hidden"> — in progress</span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
