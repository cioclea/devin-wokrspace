import {
  Board, BeadRef, BeadType, ROD_COUNT, UNITS_ROD, describeTarget, emptyBoard, hintBeads, setDigit, tapBead, totalOf,
} from "./soroban";

export interface Mission {
  text: string;
  target: number;
  icon: string;
}

export const MISSIONS: Mission[] = [
  { text: "Atinge o bilă inferioară de pe tija Unităților.", target: 1, icon: "👆" },
  { text: "Formează cifra 3 pe tija Unităților.", target: 3, icon: "🔢" },
  { text: "Formează cifra 5 folosind o singură bilă.", target: 5, icon: "✋" },
  { text: "Formează cifra 7.", target: 7, icon: "🌟" },
  { text: "Formează cifra 9 – cea mai mare cifră de pe o tijă.", target: 9, icon: "🚀" },
  { text: "Formează numărul 24 (2 zeci și 4 unități).", target: 24, icon: "🧩" },
  { text: "Formează numărul 507.", target: 507, icon: "🏆" },
];

export type PartId = "frame" | "beam" | "rod" | "upper" | "lower" | "dot";

export const PARTS: { id: PartId; name: string; desc: string }[] = [
  { id: "frame", name: "Rama", desc: "Rama (waku) ține totul împreună. Sorobanul se ține orizontal, pe masă." },
  { id: "beam", name: "Bara de calcul", desc: "Bara centrală (hari) desparte bilele. Doar bilele care ating bara se numără." },
  { id: "rod", name: "Tijele", desc: "Fiecare tijă (keta) este o poziție zecimală: Unități, Zeci, Sute, Mii…" },
  { id: "upper", name: "Bila superioară = 5", desc: "Bila de sus („bila cerului”) valorează 5 când coboară la bară." },
  { id: "lower", name: "Bile inferioare = 1", desc: "Cele 4 bile de jos („bilele pământului”) valorează câte 1 când urcă la bară." },
  { id: "dot", name: "Punctele", desc: "Punctele de pe bară marchează tija Unităților și te ajută să citești numerele mari." },
];

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
  | { type: "replay" };

export const initialLesson = (): LessonState => ({
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

const emit = (state: LessonState, event: LessonEvent): LessonState => ({
  ...state,
  event: { ...event, seq: (state.event?.seq ?? 0) + 1 },
});

export const isLastMission = (s: Pick<LessonState, "missionIndex">) => s.missionIndex === MISSIONS.length - 1;

function updateBoard(state: LessonState, board: Board, selectedRod: number): LessonState {
  const next: LessonState = { ...state, board, selectedRod, hints: [] };
  if (state.solved || totalOf(board) !== MISSIONS[state.missionIndex].target) return next;
  const points = MISSION_POINTS + (state.hintUsed ? 0 : NO_HINT_BONUS);
  return emit(
    { ...next, solved: true, points: state.points + points },
    { kind: "solved", points, bonus: !state.hintUsed, praise: PRAISE[state.missionIndex % PRAISE.length] },
  );
}

export function lessonReducer(state: LessonState, action: LessonAction): LessonState {
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
      const target = MISSIONS[state.missionIndex].target;
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
  }
}

const passed = (s: LessonState, mission: number) => s.missionIndex > mission || (s.missionIndex === mission && s.solved);

export const goalsOf = (s: LessonState) => [
  { text: "Cunosc părțile Sorobanului", done: s.seenParts.length >= PARTS_TO_SEE },
  { text: "Știu valoarea bilelor (1 și 5)", done: passed(s, 2) },
  { text: "Formez cifrele de la 0 la 9", done: passed(s, 4) },
  { text: "Citesc numere cu mai multe cifre", done: passed(s, MISSIONS.length - 1) },
];

export const progressOf = (s: LessonState) =>
  Math.round(((s.missionIndex + (s.solved ? 1 : 0)) / MISSIONS.length) * 100);
