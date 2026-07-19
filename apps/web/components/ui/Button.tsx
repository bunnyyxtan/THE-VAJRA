"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Working state: stable width, compact indicator, aria-busy. */
  loading?: boolean;
  /** Stage text shown while loading, e.g. "Awaiting wallet approval". */
  loadingText?: string;
  /** Verified outcome: icon morphs to a check. */
  success?: boolean;
  successText?: string;
  icon?: ReactNode;
}

function CheckIcon() {
  return (
    <svg
      className="btn__check"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 8.5l3.2 3L13 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Primary action surface. Press feedback: scale 0.985 at 90ms with no layout
 * shift. Loading keeps the button's width (label stays, hidden) and announces
 * busy state with descriptive stage text — never a bare spinner.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      loading = false,
      loadingText,
      success = false,
      successText,
      icon,
      className,
      children,
      disabled,
      type = "button",
      ...rest
    },
    ref
  ) {
    const classes = [
      "btn",
      `btn--${variant}`,
      loading ? "btn--loading" : "",
      className ?? "",
    ]
      .filter(Boolean)
      .join(" ");

    const overlayText = success
      ? successText ?? "Done"
      : loadingText ?? "Working";

    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...rest}
      >
        <span className="btn__label">
          {icon}
          {children}
        </span>
        {(loading || success) && (
          <span className="btn__overlay" aria-hidden={success || undefined}>
            {success ? (
              <CheckIcon />
            ) : (
              <span className="btn__spinner" aria-hidden="true" />
            )}
            <span>{overlayText}</span>
          </span>
        )}
        {loading && <span className="visually-hidden">{overlayText}</span>}
      </button>
    );
  }
);
