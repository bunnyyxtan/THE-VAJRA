"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cx } from "./cx";

export type ToastVariant = "info" | "success" | "warning" | "danger";

export interface ToastInput {
  title: string;
  body?: string;
  variant?: ToastVariant;
  /** ms before auto-dismiss; default 4500. Pass 0 to persist. */
  duration?: number;
}

interface ToastItem extends Required<Omit<ToastInput, "body" | "duration">> {
  id: number;
  body?: string;
}

interface ToastApi {
  toast: (input: ToastInput) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const ICONS: Record<ToastVariant, ReactNode> = {
  info: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7.4v3.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="5.1" r="0.9" fill="currentColor" />
    </svg>
  ),
  success: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.2 8.3l2 1.9 3.6-3.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  warning: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2.4l6 10.4H2L8 2.4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 6.6v2.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="11" r="0.85" fill="currentColor" />
    </svg>
  ),
  danger: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

/**
 * Low-risk, transient feedback only — never the only copy of critical
 * information (design direction: feedback hierarchy).
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = nextId.current++;
      const item: ToastItem = {
        id,
        title: input.title,
        body: input.body,
        variant: input.variant ?? "info",
      };
      setToasts((list) => [...list.slice(-3), item]);
      const duration = input.duration ?? 4500;
      if (duration > 0) {
        window.setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss],
  );

  const api = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {typeof document !== "undefined" &&
        createPortal(
          <div className="vtoast-region" role="region" aria-label="Notifications" aria-live="polite">
            {toasts.map((t) => (
              <div key={t.id} className={cx("vtoast", `vtoast--${t.variant}`)}>
                <span className="vtoast__icon">{ICONS[t.variant]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="vtoast__title">{t.title}</div>
                  {t.body && <div className="vtoast__body">{t.body}</div>}
                </div>
                <button
                  type="button"
                  className="vpanel__close"
                  style={{ width: 28, height: 28 }}
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}
