import type { LessonDefinition } from "./lesson";
import type { LessonState } from "./lesson";
import type { Board, BeadRef } from "./soroban";
import { LOWER_BEADS } from "./soroban";

const isPartId = (v: unknown, def: LessonDefinition): boolean => def.parts.some((p) => p.id === v);

const isBeadRef = (v: unknown): v is BeadRef => {
  if (typeof v !== "object" || v === null) return false;
  const b = v as Record<string, unknown>;
  return (
    Number.isInteger(b.rod) &&
    (b.type === "upper" || b.type === "lower") &&
    Number.isInteger(b.index) &&
    (b.index as number) >= 0 &&
    (b.index as number) <= LOWER_BEADS
  );
};

const isBoard = (v: unknown): v is Board =>
  Array.isArray(v) &&
  v.length > 0 &&
  v.every(
    (rod) =>
      typeof rod === "object" &&
      rod !== null &&
      typeof (rod as { upper?: unknown }).upper === "boolean" &&
      Number.isInteger((rod as { lower?: unknown }).lower) &&
      (rod as { lower: number }).lower >= 0 &&
      (rod as { lower: number }).lower <= LOWER_BEADS,
  );

/** Structural check for a persisted lesson; rejects anything that could crash the UI. */
export function isValidLessonState(v: unknown, def: LessonDefinition): v is LessonState {
  if (typeof v !== "object" || v === null) return false;
  const s = v as Record<string, unknown>;
  return (
    isBoard(s.board) &&
    Number.isInteger(s.missionIndex) &&
    (s.missionIndex as number) >= 0 &&
    (s.missionIndex as number) < def.missions.length &&
    typeof s.selectedRod === "number" &&
    Number.isInteger(s.selectedRod) &&
    (s.selectedRod as number) >= 0 &&
    (s.selectedRod as number) < (s.board as Board).length &&
    typeof s.solved === "boolean" &&
    typeof s.hintUsed === "boolean" &&
    typeof s.finished === "boolean" &&
    typeof s.points === "number" &&
    Number.isFinite(s.points) &&
    (s.points as number) >= 0 &&
    Array.isArray(s.hints) &&
    (s.hints as unknown[]).every(isBeadRef) &&
    Array.isArray(s.seenParts) &&
    (s.seenParts as unknown[]).every((p) => isPartId(p, def)) &&
    (s.activePart === null || isPartId(s.activePart, def))
  );
}

export function saveLesson(key: string, state: LessonState): void {
  try {
    // `event` is transient UI feedback; it must not survive a reload.
    localStorage.setItem(key, JSON.stringify({ ...state, event: null }));
  } catch {
    // Storage may be unavailable (private mode, quota) – persistence is best-effort.
  }
}

export function loadLesson(key: string, def: LessonDefinition): LessonState | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidLessonState(parsed, def)) {
      localStorage.removeItem(key);
      return null;
    }
    return { ...parsed, event: null };
  } catch {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
    return null;
  }
}

export function clearLesson(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
