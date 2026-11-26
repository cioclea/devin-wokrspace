import { beforeEach, describe, expect, it, vi } from "vitest";
import { initialLesson, lessonReducer, MISSIONS } from "./lesson";
import type { LessonState } from "./lesson";
import { digitsOf } from "./soroban";
import { clearLesson, isValidLessonState, loadLesson, saveLesson } from "./persist";

const store = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => void store.set(k, String(v)),
  removeItem: (k: string) => void store.delete(k),
});

const KEY = "soroban-lesson-v1";

const progressed = (): LessonState => {
  const digits = digitsOf(MISSIONS[0].target);
  return digits.reduce(
    (s, digit, rod) => lessonReducer(s, { type: "setDigit", rod, digit }),
    initialLesson(),
  );
};

beforeEach(() => store.clear());

describe("persist", () => {
  it("returns null when nothing is stored", () => {
    expect(loadLesson()).toBeNull();
  });

  it("round-trips a lesson state", () => {
    const state = progressed();
    saveLesson(state);
    expect(loadLesson()).toEqual({ ...state, event: null });
  });

  it("strips the transient event when saving", () => {
    const state = { ...progressed(), event: { kind: "solved" as const, points: 15, bonus: true, praise: "Bravo!", seq: 3 } };
    saveLesson(state);
    expect(loadLesson()?.event).toBeNull();
  });

  it("returns null and clears corrupted JSON", () => {
    store.set(KEY, "{not json");
    expect(loadLesson()).toBeNull();
    expect(store.has(KEY)).toBe(false);
  });

  it("rejects structurally invalid states", () => {
    store.set(KEY, JSON.stringify({ ...progressed(), missionIndex: 999 }));
    expect(loadLesson()).toBeNull();

    store.set(KEY, JSON.stringify({ ...progressed(), points: -5 }));
    expect(loadLesson()).toBeNull();

    store.set(KEY, JSON.stringify({ ...progressed(), seenParts: ["bogus"] }));
    expect(loadLesson()).toBeNull();

    store.set(KEY, JSON.stringify({ ...progressed(), board: [{ upper: "yes", lower: 0 }] }));
    expect(loadLesson()).toBeNull();
  });

  it("clearLesson removes stored progress", () => {
    saveLesson(progressed());
    clearLesson();
    expect(loadLesson()).toBeNull();
  });
});

describe("isValidLessonState", () => {
  it("accepts a real lesson state", () => {
    expect(isValidLessonState(progressed())).toBe(true);
  });

  it("rejects non-objects and missing fields", () => {
    expect(isValidLessonState(null)).toBe(false);
    expect(isValidLessonState("x")).toBe(false);
    expect(isValidLessonState({})).toBe(false);
  });
});
