"use client";

import { useEffect, useRef, useState } from "react";

/**
 * CopyButton — icon morphs to a check with "Copied" in 140–200ms, restores
 * after ~1.8s, and announces the outcome to assistive technology.
 */
export function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied",
}: {
  /** The exact string placed on the clipboard. */
  text: string;
  label?: string;
  copiedLabel?: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("error");
    }
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setState("idle"), 1800);
  }

  return (
    <button
      type="button"
      className={`copy-btn${state === "copied" ? " copy-btn--copied" : ""}${state === "error" ? " copy-btn--error" : ""}`}
      onClick={copy}
    >
      {state === "copied" ? (
        <svg className="btn__check" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M3 8.5l3.2 3L13 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect
            x="5.5"
            y="5.5"
            width="8"
            height="8"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M10.5 3.5v-.2A1.8 1.8 0 0 0 8.7 1.5H4.3a1.8 1.8 0 0 0-1.8 1.8v4.4a1.8 1.8 0 0 0 1.8 1.8h.2"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      )}
      <span>{state === "copied" ? copiedLabel : state === "error" ? "Copy failed" : label}</span>
      <span className="visually-hidden" role="status" aria-live="polite">
        {state === "copied" ? copiedLabel : state === "error" ? "Copy failed" : ""}
      </span>
    </button>
  );
}
