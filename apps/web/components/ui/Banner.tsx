import type { ReactNode } from "react";

export type BannerTone = "info" | "warning" | "danger";

function BannerIcon({ tone }: { tone: BannerTone }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      {tone === "danger" ? (
        <>
          <path
            d="M8 1.8L15 14H1L8 1.8z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M8 6.4v3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="8" cy="11.6" r="0.9" fill="currentColor" />
        </>
      ) : tone === "warning" ? (
        <>
          <path
            d="M8 1.8L15 14H1L8 1.8z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M8 6.4v3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="8" cy="11.6" r="0.9" fill="currentColor" />
        </>
      ) : (
        <>
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 7.4v3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="8" cy="5.2" r="0.9" fill="currentColor" />
        </>
      )}
    </svg>
  );
}

/**
 * Banner — the one compact persistent message: environment limits, stale
 * data, network mismatch. Status is icon + text, never color alone.
 */
export function Banner({
  tone = "info",
  title,
  children,
  action,
}: {
  tone?: BannerTone;
  title?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      className={`banner banner--${tone}`}
      role={tone === "info" ? "status" : "alert"}
    >
      <span className="banner__icon">
        <BannerIcon tone={tone} />
      </span>
      <div className="banner__body">
        {title && <div className="banner__title">{title}</div>}
        <div>{children}</div>
      </div>
      {action && <div className="banner__action">{action}</div>}
    </div>
  );
}
