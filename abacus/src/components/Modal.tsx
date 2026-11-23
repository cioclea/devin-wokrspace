"use client";

import { ReactNode, useEffect, useRef } from "react";

interface Props {
  open: boolean;
  labelledBy: string;
  className?: string;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ open, labelledBy, className = "", onClose, children }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLElement>(".btn.primary")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>("button, [href], [tabindex]:not([tabindex='-1'])");
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (!first) return;
      const inside = dialogRef.current.contains(document.activeElement);
      if (e.shiftKey && (!inside || document.activeElement === first)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (!inside || document.activeElement === last)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal open" role="dialog" aria-modal="true" aria-labelledby={labelledBy} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={dialogRef} className={`card dialog ${className}`}>{children}</div>
    </div>
  );
}
