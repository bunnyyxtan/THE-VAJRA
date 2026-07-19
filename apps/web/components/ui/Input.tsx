"use client";

import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cx } from "./cx";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  /** Field-associated error; sets aria-invalid and aria-describedby. */
  error?: string;
  containerClassName?: string;
}

/**
 * Labeled text input. Focus ring is immediate; the label never moves;
 * errors render inline and are wired to the field for assistive tech.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, id, containerClassName, className, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const describedBy = [error ? errorId : null, hint ? hintId : null]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className={cx("vfield", containerClassName)}>
      {label && (
        <label className="vfield__label" htmlFor={fieldId}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={fieldId}
        className={cx("vinput", className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
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
});
