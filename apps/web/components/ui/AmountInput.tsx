"use client";

import { useId } from "react";
import {
  formatUnits,
  parseDecimalToUnits,
  sanitizeDecimalTyping,
} from "@/lib/amount";

export interface AmountInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  /** Token decimals (MON: 18). */
  decimals?: number;
  unit?: string;
  error?: string;
  autoFocus?: boolean;
  id?: string;
}

/**
 * Calibrated amount readout (44–56px mobile / 56–72px desktop) with tabular
 * numerals. Parsing is bigint-safe: accepts "0.01", ".01", "0,01"; the parsed
 * base-unit value is echoed in monospace metadata so the exact amount is
 * never ambiguous.
 */
export function AmountInput({
  label = "Amount",
  value,
  onChange,
  decimals = 18,
  unit = "MON",
  error,
  autoFocus,
  id,
}: AmountInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;
  const metaId = `${inputId}-meta`;

  const units = parseDecimalToUnits(value, decimals);
  const showMeta = value !== "" && units !== null && !error;

  return (
    <div className={`amount${error ? " amount--error" : ""}`}>
      <label className="field__label" htmlFor={inputId}>
        {label}
      </label>
      <div className="amount__row">
        <input
          id={inputId}
          className="amount__input"
          inputMode="decimal"
          autoComplete="off"
          autoFocus={autoFocus}
          placeholder="0.00"
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : metaId}
          onChange={(e) => {
            const next = sanitizeDecimalTyping(e.target.value, decimals);
            if (next !== null) onChange(next);
          }}
        />
        <span className="amount__unit" aria-hidden="true">
          {unit}
        </span>
      </div>
      <span
        id={errorId}
        className={`field__error${error ? " field__error--visible" : ""}`}
        role={error ? "alert" : undefined}
      >
        {error}
      </span>
      <span id={metaId} className="amount__meta">
        {showMeta
          ? `= ${formatUnits(units, decimals)} ${unit} · ${units.toString()} base units`
          : " "}
      </span>
    </div>
  );
}
