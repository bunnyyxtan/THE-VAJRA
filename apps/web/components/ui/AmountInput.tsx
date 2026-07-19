"use client";

import { useId } from "react";
import { sanitizeDecimalTyping } from "@/lib/amount";
import { cx } from "./cx";

export interface AmountInputProps {
  /** Raw decimal string the user is typing, e.g. "12.5". */
  value: string;
  onChange: (value: string) => void;
  /** Fractional digits allowed; MON uses 18. */
  decimals?: number;
  /** Unit label beside the readout. */
  unit?: string;
  /** Alias of unit. */
  symbol?: string;
  label?: string;
  error?: string;
  hint?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  id?: string;
  containerClassName?: string;
}

/**
 * The instrument's dominant value: a calibrated numeric readout with
 * tabular numerals. Typing is sanitized through lib/amount (bigint-safe,
 * comma decimals accepted) — invalid keystrokes are rejected, never
 * silently rewritten. No slot-machine animation, no count-up.
 */
export function AmountInput({
  value,
  onChange,
  decimals = 18,
  unit,
  symbol,
  label,
  error,
  hint,
  autoFocus,
  disabled,
  id,
  containerClassName,
}: AmountInputProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;

  const handleChange = (raw: string) => {
    const sanitized = sanitizeDecimalTyping(raw, decimals);
    if (sanitized !== null) onChange(sanitized);
  };

  return (
    <div className={cx("vfield", containerClassName)}>
      {label && (
        <label className="vfield__label" htmlFor={fieldId}>
          {label}
        </label>
      )}
      <div className="vamount">
        <input
          id={fieldId}
          className="vamount__input"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          placeholder="0"
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          autoFocus={autoFocus}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined
          }
        />
        <span className="vamount__symbol">{unit ?? symbol ?? "MON"}</span>
      </div>
      {error && (
        <p className="vfield__error" id={errorId} role="alert">
          {error}
        </p>
      )}
      {!error && hint && (
        <p className="vfield__hint" id={hintId}>
          {hint}
        </p>
      )}
    </div>
  );
}
