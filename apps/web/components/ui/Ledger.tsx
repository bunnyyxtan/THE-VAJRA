import type { ReactNode } from "react";

/**
 * LedgerBlock — a titled group of evidence rows with a freshness timestamp.
 * Hierarchy comes from ruled separation and alignment, not cards.
 */
export function LedgerBlock({
  title,
  freshness,
  children,
}: {
  title: string;
  /** Freshness label, e.g. "Updated 12s ago" — stale data is always labeled. */
  freshness?: string;
  children: ReactNode;
}) {
  return (
    <section className="ledger-block">
      <div className="ledger-block__head">
        <h3 className="ledger-block__title">{title}</h3>
        {freshness && (
          <span className="ledger-block__freshness">{freshness}</span>
        )}
      </div>
      <dl className="ledger">{children}</dl>
    </section>
  );
}

/**
 * LedgerRow — one ruled label/value line. Technical identifiers (addresses,
 * hashes, request IDs) render in IBM Plex Mono via `mono`. `aside` carries
 * small actions such as a CopyButton.
 */
export function LedgerRow({
  label,
  value,
  mono = false,
  aside,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
  aside?: ReactNode;
}) {
  return (
    <div className="ledger-row">
      <dt className="ledger-row__label">{label}</dt>
      <dd
        className={`ledger-row__value${mono ? " ledger-row__value--mono" : ""}`}
        style={{ margin: 0 }}
      >
        {value}
      </dd>
      {aside && <div className="ledger-row__aside">{aside}</div>}
    </div>
  );
}
