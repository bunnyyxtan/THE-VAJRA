import type { CSSProperties } from "react";

/**
 * Skeleton — geometry-matching placeholder for ledger rows, receipt
 * details, and request records. The sheen passes a fixed number of times
 * and then settles static (never infinite); under reduced motion there is
 * no shimmer at all. Stable dimensions mean no layout shift.
 */
export function Skeleton({
  variant = "text",
  width,
  height,
  shimmer = true,
  label = "Loading",
  style,
  className,
}: {
  variant?: "text" | "row" | "block";
  width?: number | string;
  height?: number | string;
  /** Finite sheen; disabled under prefers-reduced-motion automatically. */
  shimmer?: boolean;
  label?: string;
  style?: CSSProperties;
  /** Extra geometry classes (e.g. responsive height overrides). */
  className?: string;
}) {
  return (
    <div
      className={`skeleton skeleton--${variant}${shimmer ? " skeleton--shimmer" : ""}${className ? ` ${className}` : ""}`}
      role="status"
      aria-label={label}
      style={{
        width: width ?? (variant === "text" ? "100%" : undefined),
        height: height ?? (variant === "block" ? 160 : undefined),
        ...style,
      }}
    />
  );
}
