import { describe, expect, it } from "vitest";
import { LessonAction, LessonState, createEngine } from "./lesson";
import type { LessonDefinition } from "./lesson";
import { digitsOf } from "./soroban";
import { getLesson } from "./curriculum";

// The canonical lesson (Modulul 2 · Lecția 1) exercises the full engine.
const DEF = getLesson("m2-l1") as LessonDefinition;
const engine = createEngine(DEF);
const { missions: MISSIONS } = engine;

const run = (state: LessonState, ...actions: LessonAction[]) => actions.reduce(engine.reducer, state);
const solve = (state: LessonState) =>
  run(state, ...digitsOf(MISSIONS[state.missionIndex].target).map((digit, rod) => ({ type: "setDigit", rod, digit }) as const));

describe("lessonReducer", () => {
  it("solves a mission when the board matches the target and awards the no-hint bonus", () => {
    const s = run(engine.initialLesson(), { type: "tap", rod: 4, bead: "lower", index: 1 });
    expect(s.solved).toBe(true);
    expect(s.points).toBe(15);
    expect(s.event).toMatchObject({ kind: "solved", bonus: true });
  });

  it("blocks Continue until the mission is solved", () => {
    const s = run(engine.initialLesson(), { type: "next" });
    expect(s.missionIndex).toBe(0);
    expect(s.event?.kind).toBe("blocked");
  });

  it("moves to the next mission with a clean board", () => {
    const s = run(solve(engine.initialLesson()), { type: "next" });
    expect(s.missionIndex).toBe(1);
    expect(s.solved).toBe(false);
    expect(s.board.every((r) => !r.upper && r.lower === 0)).toBe(true);
  });

  it("using a hint removes the bonus and highlights beads", () => {
    let s = run(solve(engine.initialLesson()), { type: "next" }, { type: "hint" });
    expect(s.hints).toEqual([{ rod: 4, type: "lower", index: 3 }]);
    s = solve(s);
    expect(s.points).toBe(25);
    expect(s.hints).toEqual([]);
  });

  it("keeps the remaining hints after a hinted bead is tapped", () => {
    let s = engine.initialLesson();
    for (let i = 0; i < MISSIONS.length - 1; i++) s = run(solve(s), { type: "next" });
    s = run(s, { type: "hint" }, { type: "tap", rod: 2, bead: "upper", index: 0 });
    expect(s.hints).toEqual([
      { rod: 4, type: "upper", index: 0 },
      { rod: 4, type: "lower", index: 2 },
    ]);
  });

  it("awards points once when enough parts are explored", () => {
    const s = run(
      engine.initialLesson(),
      { type: "togglePart", part: "beam" },
      { type: "togglePart", part: "rod" },
      { type: "togglePart", part: "upper" },
      { type: "togglePart", part: "lower" },
    );
    expect(s.points).toBe(5);
    expect(engine.goalsOf(s)[0].done).toBe(true);
  });

  it("finishes the lesson after the last mission", () => {
    let s = engine.initialLesson();
    for (let i = 0; i < MISSIONS.length; i++) {
      s = solve(s);
      s = run(s, { type: "next" });
    }
    expect(s.finished).toBe(true);
    expect(engine.progressOf(s)).toBe(100);
    expect(engine.goalsOf(s).slice(1).every((g) => g.done)).toBe(true);
    expect(run(s, { type: "replay" }).missionIndex).toBe(0);
  });

  it("hydrates a saved state without resurrecting its event", () => {
    const saved = { ...solve(engine.initialLesson()), points: 42 };
    const s = run(engine.initialLesson(), { type: "hydrate", state: saved });
    expect(s).toMatchObject({ missionIndex: 0, solved: true, points: 42 });
    expect(s.event).toBeNull();
  });

  it("resetProgress returns to the initial lesson with a wipe event", () => {
    const s = run(solve(engine.initialLesson()), { type: "next" }, { type: "resetProgress" });
    expect(s).toMatchObject({ missionIndex: 0, points: 0, solved: false });
    expect(s.board.every((r) => !r.upper && r.lower === 0)).toBe(true);
    expect(s.event?.kind).toBe("reset-progress");
  });
});
