import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEngine } from "./lesson";
import type { LessonDefinition } from "./lesson";
import { getLesson, lessonStorageKey } from "./curriculum";
import { digitsOf } from "./soroban";
import { clearLesson, isValidLessonState, loadLesson, saveLesson } from "./persist";

const store = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => void store.set(k, String(v)),
  removeItem: (k: string) => void store.delete(k),
});

const DEF = getLesson("m2-l1") as LessonDefinition;
const KEY = lessonStorageKey(DEF);
const engine = createEngine(DEF);

const progressed = () => {
  const digits = digitsOf(DEF.missions[0].target);
  return digits.reduce(
    (s, digit, rod) => engine.reducer(s, { type: "setDigit", rod, digit }),
    engine.initialLesson(),
  );
};

beforeEach(() => store.clear());

describe("persist", () => {
  it("returns null when nothing is stored", () => {
    expect(loadLesson(KEY, DEF)).toBeNull();
  });

  it("round-trips a lesson state", () => {
    const state = progressed();
    saveLesson(KEY, state);
    expect(loadLesson(KEY, DEF)).toEqual({ ...state, event: null });
  });

  it("strips the transient event when saving", () => {
    const state = { ...progressed(), event: { kind: "solved" as const, points: 15, bonus: true, praise: "Bravo!", seq: 3 } };
    saveLesson(KEY, state);
    expect(loadLesson(KEY, DEF)?.event).toBeNull();
  });

  it("returns null and clears corrupted JSON", () => {
    store.set(KEY, "{not json");
    expect(loadLesson(KEY, DEF)).toBeNull();
    expect(store.has(KEY)).toBe(false);
  });

  it("rejects structurally invalid states", () => {
    store.set(KEY, JSON.stringify({ ...progressed(), missionIndex: 999 }));
    expect(loadLesson(KEY, DEF)).toBeNull();

    store.set(KEY, JSON.stringify({ ...progressed(), points: -5 }));
    expect(loadLesson(KEY, DEF)).toBeNull();

    store.set(KEY, JSON.stringify({ ...progressed(), seenParts: ["bogus"] }));
    expect(loadLesson(KEY, DEF)).toBeNull();

    store.set(KEY, JSON.stringify({ ...progressed(), board: [{ upper: "yes", lower: 0 }] }));
    expect(loadLesson(KEY, DEF)).toBeNull();
  });

  it("keeps progress isolated per lesson key", () => {
    const other = getLesson("m1-l1") as LessonDefinition;
    saveLesson(lessonStorageKey(other), progressed());
    expect(loadLesson(KEY, DEF)).toBeNull();
    expect(loadLesson(lessonStorageKey(other), other)).not.toBeNull();
  });

  it("clearLesson removes stored progress", () => {
    saveLesson(KEY, progressed());
    clearLesson(KEY);
    expect(loadLesson(KEY, DEF)).toBeNull();
  });
});

describe("isValidLessonState", () => {
  it("accepts a real lesson state", () => {
    expect(isValidLessonState(progressed(), DEF)).toBe(true);
  });

  it("rejects non-objects and missing fields", () => {
    expect(isValidLessonState(null, DEF)).toBe(false);
    expect(isValidLessonState("x", DEF)).toBe(false);
    expect(isValidLessonState({}, DEF)).toBe(false);
  });
});
