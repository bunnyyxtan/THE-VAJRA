import type { ReactNode } from "react";
import { cx } from "./cx";

export type BannerVariant = "info" | "success" | "warning" | "danger";

const ICONS: Record<BannerVariant, ReactNode> = {
  info: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7.4v3.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="5.1" r="0.9" fill="currentColor" />
    </svg>
  ),
  success: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.2 8.3l2 1.9 3.6-3.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2.4l6 10.4H2L8 2.4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 6.6v2.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="11" r="0.85" fill="currentColor" />
    </svg>
  ),
  danger: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

/**
 * One compact persistent strip for environment limits, stale data or
 * network mismatch. Icon + text always travel together — color is never
 * the only signal. `danger` uses role="alert"; the rest role="status".
 */
export function Banner({
  tone,
  variant,
  title,
  children,
  action,
  className,
}: {
  /** Visual/semantic tone. */
  tone?: BannerVariant;
  /** Alias of tone. */
  variant?: BannerVariant;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const resolved: BannerVariant = tone ?? variant ?? "info";
  return (
    <div
      className={cx("vbanner", `vbanner--${resolved}`, className)}
      role={resolved === "danger" ? "alert" : "status"}
    >
      <span className="vbanner__icon">{ICONS[resolved]}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && <div className="vbanner__title">{title}</div>}
        {children}
      </div>
      {action}
    </div>
  );
}
