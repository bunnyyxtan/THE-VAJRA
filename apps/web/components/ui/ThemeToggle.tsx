"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

function currentTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

/**
 * Switches [data-theme] on the root element and persists the choice.
 * The control responds in the same frame; surfaces crossfade via the
 * body's background/color transition — no white/dark flash.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(currentTheme());
  }, []);

  const toggle = () => {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("vajra-theme", next);
    } catch {
      /* private mode: theme still applies for the session */
    }
    setTheme(next);
  };

  return (
    <button
      type="button"
      className="vtheme-btn"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light appearance" : "Switch to dark appearance"}
      aria-pressed={theme === "light"}
    >
      {theme === "dark" ? (
        <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <circle cx="9" cy="9" r="3.6" stroke="currentColor" strokeWidth="1.6" />
          <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.7 3.7l1.4 1.4M12.9 12.9l1.4 1.4M14.3 3.7l-1.4 1.4M5.1 12.9l-1.4 1.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M15.2 10.4A6.4 6.4 0 017.6 2.8a6.4 6.4 0 107.6 7.6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
