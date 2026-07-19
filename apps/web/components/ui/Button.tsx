import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cx } from "./cx";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Show a spinner and mark the control busy. Width stays stable. */
  loading?: boolean;
  /** Visible text while loading — names the stage, never a bare spinner. */
  loadingLabel?: string;
  /** Alias of loadingLabel. */
  loadingText?: string;
  /** Momentary success state: check icon + successText (e.g. after copy). */
  success?: boolean;
  successText?: string;
  fullWidth?: boolean;
}

export function buttonClasses(opts?: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}): string {
  return cx(
    "vbtn",
    `vbtn--${opts?.variant ?? "primary"}`,
    opts?.size && opts.size !== "md" && `vbtn--${opts.size}`,
    opts?.fullWidth && "vbtn--full",
    opts?.className,
  );
}

/**
 * Primary action control. Press feedback: scale 0.985 in 90ms, no layout
 * shift. Loading keeps the label visible (or swaps in `loadingLabel`) and
 * sets aria-busy — never a bare spinner.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    loadingLabel,
    loadingText,
    success = false,
    successText,
    fullWidth,
    className,
    children,
    disabled,
    type = "button",
    ...rest
  },
  ref,
) {
  const busyLabel = loadingLabel ?? loadingText;
  if (success && !loading) {
    return (
      <button
        ref={ref}
        type={type}
        className={buttonClasses({ variant, size, fullWidth, className })}
        disabled={disabled}
        {...rest}
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 8.5l3.2 3L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>{successText ?? children}</span>
      </button>
    );
  }
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClasses({ variant, size, fullWidth, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="vbtn__spinner" aria-hidden="true" />}
      <span>{loading && busyLabel ? busyLabel : children}</span>
    </button>
  );
});
