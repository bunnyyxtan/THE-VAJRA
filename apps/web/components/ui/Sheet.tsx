"use client";

import { useCallback, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cx } from "./cx";
import { useModalA11y } from "./use-modal-a11y";

export interface SheetProps {
  open: boolean;
  /** Controlled open state (called with false when the sheet asks to close). */
  onOpenChange?: (open: boolean) => void;
  /** Alias: called when the sheet asks to close. */
  onClose?: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

/**
 * Bottom sheet on phones (liquid glass, thumb-reachable), centered panel
 * on desktop. Keyboard-complete: Escape closes, Tab cycles inside, focus
 * restores on close.
 */
export function Sheet({ open, onOpenChange, onClose, title, children, className }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const close = useCallback(() => {
    onOpenChange?.(false);
    onClose?.();
  }, [onOpenChange, onClose]);
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
        tabIndex={-1}
        className={cx("vsheet", className)}
      >
        <div className="vpanel__head">
          <h2 className="vpanel__title" id={titleId}>
            {title}
          </h2>
          <button type="button" className="vpanel__close" onClick={close} aria-label="Close panel">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </>,
    document.body,
  );
}
