import type { CSSProperties } from "react";
import { cx } from "./cx";

export type SkeletonVariant = "text" | "row" | "block";

/**
 * Geometry-matching placeholder while data loads. No layout shift, no
 * shimmer under reduced motion. The `label` is exposed to assistive tech
 * via visually hidden text; pair with aria-busy on the region it stands
 * in for.
 */
export function Skeleton({
  variant = "text",
  width,
  height,
  label,
  className,
  style,
}: {
  variant?: SkeletonVariant;
  width?: number | string;
  height?: number | string;
  /** Accessible description of what is loading, e.g. "Loading amount". */
  label?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={cx("vskeleton", `vskeleton--${variant}`, className)}
      style={{ width, height, ...style }}
    >
      {label && <span className="v-sr-only">{label}</span>}
    </span>
  );
}

/** A stack of text-line skeletons with stable row heights. */
export function SkeletonLines({
  lines = 3,
  lineHeight = 14,
  gap = 10,
  label,
  className,
}: {
  lines?: number;
  lineHeight?: number;
  gap?: number;
  label?: string;
  className?: string;
}) {
  return (
    <span className={className} style={{ display: "block" }}>
      {label && <span className="v-sr-only">{label}</span>}
      {Array.from({ length: lines }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="vskeleton vskeleton--text"
          style={{
            display: "block",
            height: lineHeight,
            width: i === lines - 1 ? "62%" : "100%",
            marginBottom: i === lines - 1 ? 0 : gap,
          }}
        />
      ))}
    </span>
  );
}
