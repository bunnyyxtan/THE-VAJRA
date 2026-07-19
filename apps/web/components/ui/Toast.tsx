"use client";

import { useEffect } from "react";

export type ToastTone = "info" | "success";

function ToastIcon({ tone }: { tone: ToastTone }) {
  if (tone === "success") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M5.2 8.3l2 1.9 3.6-4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7.2v3.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="8" cy="5" r="1" fill="currentColor" />
    </svg>
  );
}

/**
 * Toast — zero-stakes feedback ONLY (copied, preference saved, filter
 * applied). Never the only copy of critical information. Announced politely.
 */
export function Toast({
  message,
  tone = "info",
  open,
  onClose,
  durationMs = 4000,
}: {
  message: string;
  tone?: ToastTone;
  open: boolean;
  onClose: () => void;
  durationMs?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(t);
  }, [open, durationMs, onClose]);

  if (!open) return null;

  return (
    <div className="toast-region">
      <div className={`toast toast--${tone}`} role="status">
        <span className="toast__icon">
          <ToastIcon tone={tone} />
        </span>
        <span>{message}</span>
      </div>
    </div>
  );
}
