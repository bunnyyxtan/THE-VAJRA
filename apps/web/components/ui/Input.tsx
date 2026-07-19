"use client";

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  error?: string;
  hint?: string;
  id?: string;
  trailing?: ReactNode;
}

function ErrorIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6 3.5v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="6" cy="8.6" r="0.9" fill="currentColor" />
    </svg>
  );
}

/**
 * Text field with a persistent label, an immediate focus ring, and reserved
 * error space (one line, always present — no layout shift when errors land).
 * Errors are field-associated via aria-describedby and paired with an icon,
 * never color alone.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id, trailing, className, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className={`field${error ? " field--error" : ""}`}>
      <label className="field__label" htmlFor={inputId}>
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        className={`field__control${className ? ` ${className}` : ""}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {trailing}
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
      {hint && (
        <span id={hintId} className="field__hint">
          {hint}
        </span>
      )}
    </div>
  );
});
