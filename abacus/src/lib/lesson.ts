import {
  Board, BeadRef, BeadType, ROD_COUNT, UNITS_ROD, describeTarget, emptyBoard, hintBeads, setDigit, tapBead, totalOf,
} from "./soroban";

export interface Mission {
  text: string;
  target: number;
  icon: string;
}

export interface PartDef {
  id: string;
  name: string;
  desc: string;
}

export type PartId = string;

export interface GoalDef {
  text: string;
  /** Mission index that must be passed (or solved) for the goal to complete. */
  afterMission?: number;
  /** Completes when the learner has explored PARTS_TO_SEE different parts. */
  needsParts?: boolean;
}

/** Everything needed to run one lesson; cloning a lesson = copying this object. */
export interface LessonDefinition {
  id: string;
  moduleId: string;
  number: number;
  title: string;
  subtitle?: string;
  /** Overrides the "Misiunea N" card heading when set. */
  missionLabel?: string;
  /** Extra CSS class applied to the mission card (e.g. a per-lesson color theme). */
  missionClassName?: string;
  missions: Mission[];
  parts: PartDef[];
  goals: GoalDef[];
  comingSoon?: boolean;
}

export const PRAISE = ["Excelent!", "Bravo!", "Super!", "Minunat!", "Perfect!", "Ești un campion!"];
export const MISSION_POINTS = 10;
export const NO_HINT_BONUS = 5;
export const PARTS_GOAL_POINTS = 5;
export const PARTS_TO_SEE = 3;

export type LessonEvent =
  | { kind: "solved"; points: number; bonus: boolean; praise: string }
  | { kind: "blocked" }
  | { kind: "reset" }
  | { kind: "next"; mission: number }
  | { kind: "hint"; text: string }
  | { kind: "already-solved" }
  | { kind: "parts-goal"; points: number }
  | { kind: "reset-progress" }
  | { kind: "finished" };

export interface LessonState {
  board: Board;
  selectedRod: number;
  missionIndex: number;
  solved: boolean;
  hintUsed: boolean;
  points: number;
  hints: BeadRef[];
  seenParts: PartId[];
  activePart: PartId | null;
  finished: boolean;
  /** Last side-effect worth showing (toast, confetti); `seq` lets the UI react to repeats. */
  event: (LessonEvent & { seq: number }) | null;
}

export type LessonAction =
  | { type: "tap"; rod: number; bead: BeadType; index: number }
  | { type: "setDigit"; rod: number; digit: number }
  | { type: "selectRod"; rod: number }
  | { type: "reset" }
  | { type: "next" }
  | { type: "hint" }
  | { type: "togglePart"; part: PartId }
  | { type: "closeFinished" }
  | { type: "replay" }
  | { type: "hydrate"; state: LessonState }
  | { type: "resetProgress" };

const emit = (state: LessonState, event: LessonEvent): LessonState => ({
  ...state,
  event: { ...event, seq: (state.event?.seq ?? 0) + 1 },
});

export interface LessonEngine {
  def: LessonDefinition;
  missions: Mission[];
  parts: PartDef[];
  initialLesson(): LessonState;
  reducer(state: LessonState, action: LessonAction): LessonState;
  goalsOf(state: LessonState): { text: string; done: boolean }[];
  progressOf(state: LessonState): number;
  isLastMission(state: LessonState): boolean;
}

/** Builds a self-contained lesson runtime from a definition. Cloning a lesson = new def + createEngine. */
export function createEngine(def: LessonDefinition): LessonEngine {
  const { missions, parts } = def;

  const initialLesson = (): LessonState => ({
    board: emptyBoard(ROD_COUNT),
    selectedRod: UNITS_ROD,
    missionIndex: 0,
    solved: false,
    hintUsed: false,
    points: 0,
    hints: [],
    seenParts: [],
    activePart: null,
    finished: false,
    event: null,
  });

  const isLastMission = (s: Pick<LessonState, "missionIndex">) => s.missionIndex === missions.length - 1;

  function updateBoard(state: LessonState, board: Board, selectedRod: number): LessonState {
    const target = missions[state.missionIndex].target;
    const hints = state.hints.length ? hintBeads(board, target) : [];
    const next: LessonState = { ...state, board, selectedRod, hints };
    if (state.solved || totalOf(board) !== target) return next;
    const points = MISSION_POINTS + (state.hintUsed ? 0 : NO_HINT_BONUS);
    return emit(
      { ...next, solved: true, points: state.points + points },
      { kind: "solved", points, bonus: !state.hintUsed, praise: PRAISE[state.missionIndex % PRAISE.length] },
    );
  }

  function reducer(state: LessonState, action: LessonAction): LessonState {
    switch (action.type) {
      case "tap":
        return updateBoard(state, tapBead(state.board, action.rod, action.bead, action.index), action.rod);
      case "setDigit":
        return updateBoard(state, setDigit(state.board, action.rod, action.digit), action.rod);
      case "selectRod":
        return { ...state, selectedRod: action.rod };
      case "reset":
        return emit({ ...state, board: emptyBoard(state.board.length), hints: [] }, { kind: "reset" });
      case "next": {
        if (!state.solved) return emit(state, { kind: "blocked" });
        if (isLastMission(state)) return emit({ ...state, finished: true }, { kind: "finished" });
        const missionIndex = state.missionIndex + 1;
        return emit(
          {
            ...state, missionIndex, solved: false, hintUsed: false, hints: [],
            board: emptyBoard(state.board.length), selectedRod: UNITS_ROD,
          },
          { kind: "next", mission: missionIndex },
        );
      }
      case "hint": {
        if (state.solved) return emit(state, { kind: "already-solved" });
        const target = missions[state.missionIndex].target;
        const hints = hintBeads(state.board, target);
        return emit(
          { ...state, hints, hintUsed: true, selectedRod: hints[0]?.rod ?? state.selectedRod },
          { kind: "hint", text: `Indiciu: formează ${describeTarget(target, state.board.length)}. Atinge bilele care strălucesc.` },
        );
      }
      case "togglePart": {
        if (state.activePart === action.part) return { ...state, activePart: null };
        const seenBefore = state.seenParts.length;
        const seenParts = state.seenParts.includes(action.part) ? state.seenParts : [...state.seenParts, action.part];
        const next = { ...state, activePart: action.part, seenParts };
        if (seenBefore < PARTS_TO_SEE && seenParts.length >= PARTS_TO_SEE) {
          return emit({ ...next, points: state.points + PARTS_GOAL_POINTS }, { kind: "parts-goal", points: PARTS_GOAL_POINTS });
        }
        return next;
      }
      case "closeFinished":
        return { ...state, finished: false };
      case "replay":
        return { ...initialLesson(), event: state.event };
      case "hydrate":
        return { ...action.state, event: null };
      case "resetProgress":
        return emit(initialLesson(), { kind: "reset-progress" });
    }
  }

  const passed = (s: LessonState, mission: number) =>
    s.missionIndex > mission || (s.missionIndex === mission && s.solved);

  const goalsOf = (s: LessonState) =>
    def.goals.map((g) => ({
      text: g.text,
      done: g.needsParts ? s.seenParts.length >= PARTS_TO_SEE : g.afterMission !== undefined && passed(s, g.afterMission),
    }));

  const progressOf = (s: LessonState) =>
    missions.length ? Math.round(((s.missionIndex + (s.solved ? 1 : 0)) / missions.length) * 100) : 0;

  return { def, missions, parts, initialLesson, reducer, goalsOf, progressOf, isLastMission };
}
