"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface NavItem {
  href: string;
  label: string;
  /** Outline icon (inactive). */
  icon: ReactNode;
  /** Filled icon (active) — icon and label change state together. */
  iconActive: ReactNode;
}

const stroke = {
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  fill: "none",
} as const;

const ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Home",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
        <path d="M4 10.5L12 4l8 6.5V19a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 19v-8.5z" />
      </svg>
    ),
    iconActive: (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M4 10.5L12 4l8 6.5V19a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 19v-8.5z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    href: "/request",
    label: "Request",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
        <path d="M7 3.5h7L19 8.5V20a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 015 20V5a1.5 1.5 0 011.5-1.5z" />
        <path d="M13.5 3.5V9H19" />
        <path d="M9 13h6M9 16.5h4" />
      </svg>
    ),
    iconActive: (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M7 3.5h7L19 8.5V20a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 015 20V5a1.5 1.5 0 011.5-1.5z"
          fill="currentColor"
        />
        <path d="M9.8 13h4.4M9.8 16.5h3" stroke="var(--v-bg)" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/activity",
    label: "Activity",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
        <path d="M4 6.5h16M4 12h16M4 17.5h10" />
      </svg>
    ),
    iconActive: (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 6.5h16M4 12h16M4 17.5h10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/pay",
    label: "Pay",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
        <path d="M13.5 13.5h3v3h-3zM17.5 17.5h3v3h-3z" />
      </svg>
    ),
    iconActive: (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" fill="currentColor" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" fill="currentColor" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" fill="currentColor" />
        <path d="M13.5 13.5h3v3h-3zM17.5 17.5h3v3h-3z" fill="currentColor" />
      </svg>
    ),
  },
];

/**
 * Phone navigation: fixed bottom bar in the one-hand thumb zone.
 * Four destinations; the active destination changes icon and label
 * together (140–200ms). Hidden at tablet width and above, where the
 * header nav takes over.
 */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="vmnav" aria-label="Primary">
      <div className="vmnav__bar">
        {ITEMS.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="vmnav__item"
              aria-current={active ? "page" : undefined}
            >
              {active ? item.iconActive : item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
