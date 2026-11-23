"use client";

import { CSSProperties, useEffect, useState } from "react";

const COLORS = ["#E8664A", "#F2A541", "#5E9C6A", "#3D4F8F", "#F7C77A"];

interface Piece {
  id: number;
  style: CSSProperties;
}

/** Bursts `count` pieces whenever `burst` changes (0 = no burst). */
export default function Confetti({ burst, count }: { burst: number; count: number }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (!burst || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setPieces(
      Array.from({ length: count }, (_, i) => ({
        id: burst * 1000 + i,
        style: {
          left: `${Math.random() * 100}vw`,
          background: COLORS[i % COLORS.length],
          animationDuration: `${1.4 + Math.random() * 1.4}s`,
          animationDelay: `${Math.random() * 0.3}s`,
          "--dx": `${Math.random() * 200 - 100}px`,
          "--rot": `${Math.random() * 720 - 360}deg`,
        } as CSSProperties,
      })),
    );
    const t = setTimeout(() => setPieces([]), 3400);
    return () => clearTimeout(t);
  }, [burst, count]);

  return (
    <>
      {pieces.map((p) => (
        <i key={p.id} className="confetti" style={p.style} aria-hidden="true" />
      ))}
    </>
  );
}
