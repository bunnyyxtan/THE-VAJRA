"use client";

import { useId } from "react";
import { memoUtf8Bytes, MAX_MEMO_BYTES } from "@/lib/vajra/domain";

function ErrorIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 3.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="6" cy="8.6" r="0.9" fill="currentColor" />
    </svg>
  );
}

export interface MemoFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

/**
 * Memo field with a live UTF-8 byte counter (protocol cap: 96 bytes after
 * NFC normalization — counted exactly as the contract hashes it). Optional;
 * only the memo hash reaches the chain.
 */
export function MemoField({ value, onChange, error }: MemoFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const counterId = `${id}-counter`;

  const byteCount = memoUtf8Bytes(value).length;
  const overLimit = byteCount > MAX_MEMO_BYTES;

  return (
    <div className={`field${error ? " field--error" : ""}`}>
      <div className="memo__label-row">
        <label className="field__label" htmlFor={id}>
          Memo <span className="memo__optional">(optional)</span>
        </label>
        <span
          id={counterId}
          className={`memo__counter tnum${overLimit ? " memo__counter--over" : ""}`}
          aria-live="off"
        >
          {byteCount} / {MAX_MEMO_BYTES} bytes
        </span>
      </div>
      <textarea
        id={id}
        className="field__control memo__input"
        rows={2}
        maxLength={MAX_MEMO_BYTES * 2}
        placeholder="Dinner on Friday, invoice 1042…"
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${counterId}${error ? ` ${errorId}` : ""}`}
        onChange={(e) => onChange(e.target.value)}
      />
      <span
        id={errorId}
        className={`field__error${error ? " field__error--visible" : ""}`}
        role={error ? "alert" : undefined}
      >
        {error ? (
          <>
            <ErrorIcon />
            <span>{error}</span>
          </>
        ) : null}
      </span>
      <span className="field__hint">
        Only the memo hash is recorded onchain; the text travels inside the
        payment link.
      </span>
    </div>
  );
}
