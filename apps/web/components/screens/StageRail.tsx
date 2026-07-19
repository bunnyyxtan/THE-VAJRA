"use client";

/**
 * StageRail — the named async stages of a consequential flow
 * (design-direction-v1 §Async stages): never a bare spinner, always a named
 * stage whose clock we are waiting on.
 *
 *   `reached` is the index of the furthest stage reached; `waiting` marks the
 *   stage whose clock is currently running. Stages before `reached` render as
 *   complete; the stage at `reached` renders as current (or failed).
 *
 * Failure: the connector stops, the stage is labeled, a recovery action sits
 * beside the rail in the parent — no red flashing, no rail restart.
 */
export function StageRail({
  stages,
  reached,
  waiting,
  failed = false,
  ariaLabel = "Progress",
}: {
  stages: readonly string[];
  /** Index of the furthest stage reached (0-based). */
  reached: number;
  /** Whether the stage at `reached` is still in progress. */
  waiting: boolean;
  /** Whether the stage at `reached` failed (connector stops here). */
  failed?: boolean;
  ariaLabel?: string;
}) {
  const statusOf = (index: number): "complete" | "current" | "upcoming" | "failed" => {
    if (index < reached) return "complete";
    if (index === reached) {
      if (failed) return "failed";
      return waiting ? "current" : "complete";
    }
    return "upcoming";
  };

  return (
    <ol className="stages" aria-label={ariaLabel} aria-live="polite">
      {stages.map((label, index) => {
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
              ) : status === "failed" ? (
                <svg viewBox="0 0 12 12" fill="none" width="12" height="12">
                  <path
                    d="M3.5 3.5l5 5M8.5 3.5l-5 5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              ) : status === "current" ? (
                <span className="stages__dot-core" />
              ) : null}
            </span>
            <span className="stages__label">
              {label}
              {status === "current" && <span className="visually-hidden"> — in progress</span>}
              {status === "failed" && <span className="visually-hidden"> — stopped here</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
