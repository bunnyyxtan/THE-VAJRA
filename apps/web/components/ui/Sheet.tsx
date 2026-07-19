"use client";

import { useRef, type ReactNode } from "react";
import { useFocusManagement } from "./Dialog";

/**
 * Sheet — bottom sheet on mobile, centered panel on desktop (≥768px).
 * Same focus discipline as Dialog: trap, Escape, restore.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const { onKeyDown } = useFocusManagement(open, onClose, panelRef);

  if (!open) return null;

  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={onKeyDown}
    >
      <div
        ref={panelRef}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <div className="sheet__grip" aria-hidden="true" />
        <h2 className="sheet__title">{title}</h2>
        {children}
      </div>
    </div>
  );
}
