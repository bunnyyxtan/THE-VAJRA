"use client";

/**
 * Text-bearing copy button built on the ui Button — for places where the
 * copy action is the primary affordance (share link rows, bottom action
 * bar). Real clipboard write, "Copied" state for ~1.8s, announced to
 * assistive tech, then restored. Icon-only copies belong to ui/CopyButton.
 */

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";

export function CopyTextButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  variant = "primary",
  className,
}: {
  /** The exact string placed on the clipboard. */
  value: string;
  label?: string;
  copiedLabel?: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("error");
    }
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setState("idle"), 1800);
  }

  return (
    <>
      <Button variant={variant} className={className} onClick={copy}>
        {state === "copied" ? copiedLabel : state === "error" ? "Copy failed — try again" : label}
      </Button>
      <span className="visually-hidden" role="status" aria-live="polite">
        {state === "copied" ? copiedLabel : ""}
      </span>
    </>
  );
}
