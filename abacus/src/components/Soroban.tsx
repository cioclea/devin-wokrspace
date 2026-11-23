"use client";

import { KeyboardEvent, useRef } from "react";
import { PartId } from "@/lib/lesson";
import {
  BeadRef, BeadType, Board, DOT_RODS, LOWER_BEADS, PLACES, SHORT_PLACES, beadKey, beadOffset, digitOf, isBeadActive,
} from "@/lib/soroban";

interface Props {
  board: Board;
  selectedRod: number;
  hints: BeadRef[];
  activePart: PartId | null;
  onTap: (rod: number, type: BeadType, index: number) => void;
  onSelectRod: (rod: number) => void;
  onDigit: (rod: number, digit: number) => void;
}

/** Positions inside a rod for keyboard navigation: upper bead, then lower beads 1..4. */
const POSITIONS: { type: BeadType; index: number }[] = [
  { type: "upper", index: 0 },
  ...Array.from({ length: LOWER_BEADS }, (_, i) => ({ type: "lower" as const, index: i + 1 })),
];
const GHOST_CLICK_MS = 150;

export default function Soroban({ board, selectedRod, hints, activePart, onTap, onSelectRod, onDigit }: Props) {
  const beadRefs = useRef(new Map<string, HTMLButtonElement>());
  const lastTap = useRef({ key: "", t: 0 });
  const hinted = new Set(hints.map(beadKey));

  const tap = (rod: number, type: BeadType, index: number) => {
    const key = beadKey({ rod, type, index });
    const now = performance.now();
    if (lastTap.current.key === key && now - lastTap.current.t < GHOST_CLICK_MS) return;
    lastTap.current = { key, t: now };
    navigator.vibrate?.(8);
    onTap(rod, type, index);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, rod: number, pos: number) => {
    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      onDigit(rod, Number(e.key));
      return;
    }
    let r = rod, p = pos;
    if (e.key === "ArrowLeft") r = Math.max(0, rod - 1);
    else if (e.key === "ArrowRight") r = Math.min(board.length - 1, rod + 1);
    else if (e.key === "ArrowUp") p = Math.max(0, pos - 1);
    else if (e.key === "ArrowDown") p = Math.min(POSITIONS.length - 1, pos + 1);
    else return;
    e.preventDefault();
    beadRefs.current.get(beadKey({ rod: r, ...POSITIONS[p] }))?.focus();
    onSelectRod(r);
  };

  const renderBead = (r: number, pos: number) => {
    const { type, index } = POSITIONS[pos];
    const rod = board[r];
    const active = isBeadActive(rod, type, index);
    const key = beadKey({ rod: r, type, index });
    const label = type === "upper" ? "bila superioară (5)" : `bila inferioară ${index} (1)`;
    return (
      <button
        key={key}
        ref={(el) => {
          if (el) beadRefs.current.set(key, el);
          else beadRefs.current.delete(key);
        }}
        type="button"
        data-rod={r}
        data-type={type}
        data-i={index}
        className={`bead ${type}${active ? " on" : ""}${hinted.has(key) ? " hint" : ""}`}
        style={{ transform: `translateY(calc(var(--bh) * ${beadOffset(rod, type, index)}))` }}
        aria-pressed={active}
        aria-label={`${PLACES[r]}: ${label}, ${active ? "activă" : "inactivă"}`}
        onClick={() => tap(r, type, index)}
        onKeyDown={(e) => onKeyDown(e, r, pos)}
      >
        <span className="shape" />
      </button>
    );
  };

  return (
    <>
      <div
        className={`soroban${activePart ? ` hl-${activePart}` : ""}`}
        role="group"
        aria-label={`Soroban interactiv cu ${board.length} tije`}
      >
        <div className="inner">
          {board.map((_, r) => (
            <div key={r} className={`rod${r === selectedRod ? " sel" : ""}`} role="group" aria-label={`Tija ${PLACES[r]}`}>
              <div className="deck up">{renderBead(r, 0)}</div>
              <div className="beam">{DOT_RODS.includes(r) && <span className="dot" />}</div>
              <div className="deck low">{POSITIONS.slice(1).map((_, i) => renderBead(r, i + 1))}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="rodlabels">
        {board.map((rod, r) => (
          <button
            key={r}
            type="button"
            className={`rodlabel${r === selectedRod ? " sel" : ""}`}
            aria-label={`Selectează tija ${PLACES[r]}`}
            aria-pressed={r === selectedRod}
            onClick={() => onSelectRod(r)}
          >
            <b>{digitOf(rod)}</b>
            <span>{SHORT_PLACES[r]}</span>
          </button>
        ))}
      </div>
    </>
  );
}
