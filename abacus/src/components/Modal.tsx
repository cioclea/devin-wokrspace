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
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
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
