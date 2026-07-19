"use client";

import { useState } from "react";
import { cx } from "./cx";

export interface CopyButtonProps {
  /** The exact string placed on the clipboard. */
  text?: string;
  /** Alias of text. */
  value?: string;
  /** What is being copied, for the accessible name, e.g. "contract address". */
  label?: string;
  /** Visible confirmation text while copied (default "Copied"). */
  copiedLabel?: string;
  className?: string;
}

/**
 * Copies `text`, morphs to a check + "Copied" for ~1.8s, announces the
 * outcome to assistive tech, then restores. 140–200ms morph per direction.
 */
export function CopyButton({ text, value, label, copiedLabel, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const thing = label ?? "value";
  const content = text ?? value ?? "";
  const doneLabel = copiedLabel ?? "Copied";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      // Clipboard API unavailable (permissions, insecure context): fall back.
      const area = document.createElement("textarea");
      area.value = content;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={copy}
      className={cx("vcopy", className)}
      aria-label={copied ? `${thing} copied` : `Copy ${thing}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        color: copied ? "var(--v-success)" : "var(--v-muted)",
        transition: "color var(--motion-fast) var(--ease-standard)",
        flex: "none",
      }}
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 8.5l3.2 3L13 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10.5 3.5v-.2A1.3 1.3 0 009.2 2H3.8a1.3 1.3 0 00-1.3 1.3v5.4a1.3 1.3 0 001.3 1.3h.2" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )}
      <span aria-live="polite" style={{ fontSize: 12, fontWeight: 600 }}>
        {copied ? doneLabel : ""}
      </span>
    </button>
  );
}
