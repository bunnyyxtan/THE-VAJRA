"use client";

import { useId } from "react";
import { MIN_LIFETIME_SECONDS, MAX_LIFETIME_SECONDS } from "@/lib/vajra/domain";

export type ExpiryPreset = "1h" | "24h" | "7d" | "custom";

export const EXPIRY_PRESET_SECONDS: Record<Exclude<ExpiryPreset, "custom">, number> = {
  "1h": 60 * 60,
  "24h": 24 * 60 * 60,
  "7d": 7 * 24 * 60 * 60,
};

const PRESET_LABELS: Record<Exclude<ExpiryPreset, "custom">, string> = {
  "1h": "1 hour",
  "24h": "24 hours",
  "7d": "7 days",
};

const MIN_LIFETIME = Number(MIN_LIFETIME_SECONDS);
const MAX_LIFETIME = Number(MAX_LIFETIME_SECONDS);

/** Formats a unix-ms timestamp for a datetime-local input (local time). */
export function toLocalInputValue(epochMs: number): string {
  const d = new Date(epochMs);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ErrorIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 3.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="6" cy="8.6" r="0.9" fill="currentColor" />
    </svg>
  );
}

export interface ExpiryFieldProps {
  preset: ExpiryPreset;
  onPresetChange: (preset: ExpiryPreset) => void;
  /** datetime-local value, only used when preset === "custom". */
  customValue: string;
  onCustomChange: (value: string) => void;
  error?: string;
}

/**
 * Expiry picker: real radio presets (1h / 24h / 7d) plus a custom
 * datetime-local bound to the protocol window (min 60s, max 30d).
 * Native inputs keep full keyboard support; errors are field-associated.
 */
export function ExpiryField({
  preset,
  onPresetChange,
  customValue,
  onCustomChange,
  error,
}: ExpiryFieldProps) {
  const groupId = useId();
  const customInputId = `${groupId}-custom-input`;
  const errorId = `${groupId}-error`;

  const now = Date.now();
  const minValue = toLocalInputValue(now + MIN_LIFETIME * 1000);
  const maxValue = toLocalInputValue(now + MAX_LIFETIME * 1000);

  return (
    <fieldset className="expiry" aria-describedby={error ? errorId : undefined}>
      <legend className="expiry__legend">Expires in</legend>
      <div className="expiry__presets" role="presentation">
        {(Object.keys(EXPIRY_PRESET_SECONDS) as Array<Exclude<ExpiryPreset, "custom">>).map(
          (key) => (
            <label key={key} className="expiry__preset">
              <input
                type="radio"
                name={`${groupId}-preset`}
                checked={preset === key}
                onChange={() => onPresetChange(key)}
              />
              <span className="expiry__chip">{PRESET_LABELS[key]}</span>
            </label>
          ),
        )}
        <label className="expiry__preset">
          <input
            type="radio"
            name={`${groupId}-preset`}
            checked={preset === "custom"}
            onChange={() => onPresetChange("custom")}
          />
          <span className="expiry__chip">Custom</span>
        </label>
      </div>
      {preset === "custom" && (
        <div className="expiry__custom">
          <label className="visually-hidden" htmlFor={customInputId}>
            Custom expiry date and time
          </label>
          <input
            id={customInputId}
            type="datetime-local"
            className="field__control sc-tnum"
            value={customValue}
            min={minValue}
            max={maxValue}
            aria-invalid={error ? true : undefined}
            onChange={(e) => onCustomChange(e.target.value)}
          />
          <span className="field__hint">Between 60 seconds and 30 days from now.</span>
        </div>
      )}
      <span id={errorId} className="field__error" role={error ? "alert" : undefined}>
        {error ? (
          <>
            <ErrorIcon />
            <span>{error}</span>
          </>
        ) : null}
      </span>
    </fieldset>
  );
}
