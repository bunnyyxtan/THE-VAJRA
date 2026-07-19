import type { ReactNode } from "react";
import { cx } from "./cx";

/**
 * The canonical VAJRA proof chain (design direction: original motif).
 * Order carries meaning — this is a real sequence, so labels ship as data.
 */
export const PROOF_CHAIN_STAGES = [
  "Terms defined",
  "Recipient signed",
  "Request shared",
  "Payer verified",
  "Transaction submitted",
  "Contract settled",
  "Receipt sealed",
] as const;

/** State vocabulary A: complete / current / upcoming / failed. */
export type ProofStageStatus = "complete" | "current" | "upcoming" | "failed";
/** State vocabulary B: done / current / pending / failed. */
export type ProofStageState = "done" | "current" | "pending" | "failed";

export interface ProofStage {
  id?: string;
  label: string;
  /** Preferred: status vocabulary. */
  status?: ProofStageStatus;
  /** Accepted alias: state vocabulary. Resolved when `status` is absent. */
  state?: ProofStageState;
  /** Optional line under the label — whose clock we're waiting on, or
   *  what did/didn't happen for a failed stage. */
  detail?: string;
  /** Recovery action rendered beside a failed stage. */
  action?: ReactNode;
}

type Resolved = "done" | "current" | "pending" | "failed";

function resolve(stage: ProofStage): Resolved {
  const s = stage.status ?? stage.state ?? "pending";
  if (s === "complete") return "done";
  if (s === "upcoming") return "pending";
  return s;
}

/**
 * VAJRA's proof chain. Current stage gets strongest contrast and a
 * restrained pulse (disabled under reduced motion); completed stages fill
 * their connector; a failed stage stops the connector, says what happened,
 * and carries its recovery action inline.
 */
export function ProofChain({
  stages,
  orientation = "vertical",
  ariaLabel = "Progress",
  className,
}: {
  stages: ProofStage[];
  orientation?: "vertical" | "horizontal";
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <ol
      className={cx("vpchain", orientation === "horizontal" && "vpchain--horizontal", className)}
      aria-label={ariaLabel}
    >
      {stages.map((stage) => {
        const resolved = resolve(stage);
        return (
          <li
            key={stage.id ?? stage.label}
            className={cx("vpchain__step", `vpchain__step--${resolved}`)}
            aria-current={resolved === "current" ? "step" : undefined}
          >
            <span className="vpchain__icon" aria-hidden="true">
              {resolved === "done" && (
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8.5l3.2 3L13 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {resolved === "current" && (
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "currentColor",
                  }}
                />
              )}
              {resolved === "failed" && (
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </span>
            <div className="vpchain__body">
              <div className="vpchain__label">{stage.label}</div>
              {stage.detail && <div className="vpchain__detail">{stage.detail}</div>}
              {resolved === "failed" && stage.action && (
                <div style={{ marginTop: 8 }}>{stage.action}</div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
