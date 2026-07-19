"use client";

import { useCallback, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cx } from "./cx";
import { useModalA11y } from "./use-modal-a11y";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Centered modal. Reserved for irreversible or consequential moments
 * (design direction: feedback hierarchy). Keyboard-complete: Escape closes,
 * Tab cycles inside, focus restores on close.
 */
export function Dialog({ open, onOpenChange, title, description, children, className }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  useModalA11y(open, close, panelRef);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <>
      <div className="voverlay" onClick={close} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cx("vdialog", className)}
      >
        <div className="vpanel__head">
          <h2 className="vpanel__title" id={titleId}>
            {title}
          </h2>
          <button type="button" className="vpanel__close" onClick={close} aria-label="Close dialog">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {description && (
          <p id={descId} style={{ margin: "0 0 16px", color: "var(--v-text-2)", fontSize: 14 }}>
            {description}
          </p>
        )}
        {children}
      </div>
    </>,
    document.body,
  );
}
