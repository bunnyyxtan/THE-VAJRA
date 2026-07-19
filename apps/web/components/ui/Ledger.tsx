import type { ReactNode } from "react";
import { cx } from "./cx";
import { CopyButton } from "./CopyButton";

/**
 * LEDGER grammar: ruled rows with stable label–value alignment, tabular
 * numerals, monospace technical identifiers. Evidence, not decoration.
 */
export function LedgerBlock({
  title,
  /** Freshness timestamp for evidence blocks, e.g. "Verified from Monad
   *  Mainnet state at 14:02:11". Rendered in the header row. */
  freshness,
  actions,
  children,
  className,
}: {
  title?: string;
  freshness?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("vledger", className)}>
      {(title || freshness) && (
        <header className="vledger__head">
          {title && <h3 className="vledger__title">{title}</h3>}
          {freshness && <span className="vledger__fresh">{freshness}</span>}
          {actions}
        </header>
      )}
      <div>{children}</div>
    </section>
  );
}

export function LedgerRow({
  label,
  value,
  /** Render the value in IBM Plex Mono — for hashes, addresses, ids. */
  mono,
  /** Trailing accessory, typically a CopyButton or an explorer link. */
  aside,
  /** Convenience: render a CopyButton that copies this exact string. */
  copyValue,
  children,
  className,
}: {
  label: string;
  value?: ReactNode;
  mono?: boolean;
  aside?: ReactNode;
  copyValue?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("vledger-row", className)}>
      <span className="vledger-row__label">{label}</span>
      <span className={cx("vledger-row__value", mono && "vledger-row__value--mono")}>
        {value ?? children}
        {aside}
        {copyValue && <CopyButton text={copyValue} label={label} />}
      </span>
    </div>
  );
}
