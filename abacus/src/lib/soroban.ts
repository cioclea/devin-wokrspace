export type BeadType = "upper" | "lower";

/** One rod: the upper bead (worth 5) and how many of the 4 lower beads (worth 1) touch the beam. */
export interface Rod {
  upper: boolean;
  lower: number;
}

export type Board = Rod[];

export interface BeadRef {
  rod: number;
  type: BeadType;
  /** 0 for the upper bead, 1..4 for lower beads counted from the beam. */
  index: number;
}

export const ROD_COUNT = 5;
export const LOWER_BEADS = 4;
export const PLACES = ["Zeci de mii", "Mii", "Sute", "Zeci", "Unități"] as const;
export const SHORT_PLACES = ["Z. mii", "Mii", "Sute", "Zeci", "Unități"] as const;
/** Reference dots on the beam: the units rod and every third rod to its left. */
export const DOT_RODS = [1, 4];
export const UNITS_ROD = ROD_COUNT - 1;

export const emptyBoard = (rods = ROD_COUNT): Board =>
  Array.from({ length: rods }, () => ({ upper: false, lower: 0 }));

export const digitOf = (rod: Rod): number => (rod.upper ? 5 : 0) + rod.lower;

export const placeValue = (rodIndex: number, rods = ROD_COUNT): number => 10 ** (rods - 1 - rodIndex);

export const totalOf = (board: Board): number =>
  board.reduce((sum, rod, r) => sum + digitOf(rod) * placeValue(r, board.length), 0);

export const rodFromDigit = (digit: number): Rod => {
  if (!Number.isInteger(digit) || digit < 0 || digit > 9) throw new RangeError(`Invalid digit: ${digit}`);
  return { upper: digit >= 5, lower: digit % 5 };
};

/** Digits of `n` spread across `rods` rods, most significant first. */
export const digitsOf = (n: number, rods = ROD_COUNT): number[] =>
  Array.from({ length: rods }, (_, r) => Math.floor(n / placeValue(r, rods)) % 10);

export const isBeadActive = (rod: Rod, type: BeadType, index: number): boolean =>
  type === "upper" ? rod.upper : index <= rod.lower;

/** Vertical offset of a bead inside its deck, in bead heights. */
export const beadOffset = (rod: Rod, type: BeadType, index: number): number => {
  const active = isBeadActive(rod, type, index);
  return type === "upper" ? (active ? 1 : 0) : index - 1 + (active ? 0 : 1);
};

/**
 * One tap toggles a bead. Lower beads move together like on a real soroban:
 * activating bead i pushes beads 1..i to the beam, deactivating it drops beads i..4.
 */
export function tapBead(board: Board, rodIndex: number, type: BeadType, index: number): Board {
  return board.map((rod, r) => {
    if (r !== rodIndex) return rod;
    if (type === "upper") return { ...rod, upper: !rod.upper };
    if (index < 1 || index > LOWER_BEADS) return rod;
    return { ...rod, lower: index <= rod.lower ? index - 1 : index };
  });
}

export const setDigit = (board: Board, rodIndex: number, digit: number): Board =>
  board.map((rod, r) => (r === rodIndex ? rodFromDigit(digit) : rod));

/** Beads to tap (one per deck) to turn the current board into `target`. */
export function hintBeads(board: Board, target: number): BeadRef[] {
  const wanted = digitsOf(target, board.length);
  return board.flatMap((rod, r) => {
    const want = rodFromDigit(wanted[r]);
    const hints: BeadRef[] = [];
    if (want.upper !== rod.upper) hints.push({ rod: r, type: "upper", index: 0 });
    if (want.lower > rod.lower) hints.push({ rod: r, type: "lower", index: want.lower });
    else if (want.lower < rod.lower) hints.push({ rod: r, type: "lower", index: want.lower + 1 });
    return hints;
  });
}

export const beadKey = ({ rod, type, index }: BeadRef): string => `${rod}-${type}-${index}`;

export const formatRo = (n: number): string => n.toLocaleString("ro-RO");

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export const lowerBeadsLabel = (n: number): string =>
  `${n} ${plural(n, "bilă inferioară activată", "bile inferioare activate")}`;

export function tipFor(board: Board, rodIndex: number): string {
  const d = digitOf(board[rodIndex]);
  let tip: string;
  if (d === 0) tip = "Când nicio bilă nu atinge bara, tija arată 0. Atinge o bilă ca să începi!";
  else if (d <= 3) tip = `Fiecare bilă inferioară adaugă 1. Numără bilele lipite de bară: ${d}!`;
  else if (d === 4) tip = "4 este maximul bilelor de jos. Pentru 5 folosim bila de sus și eliberăm bilele de jos.";
  else if (d === 5) tip = "Bila de sus valorează 5 – cât toate cele cinci degete ale unei mâini!";
  else if (d <= 8) tip = `Combină: bila de 5 + ${d - 5} ${plural(d - 5, "bilă", "bile")} de 1 = ${d}.`;
  else tip = "9 este cifra maximă pe o tijă: toate bilele ating bara!";
  const pv = placeValue(rodIndex, board.length);
  if (pv !== 1 && d > 0) tip += ` Pe tija ${PLACES[rodIndex]}, cifra ${d} înseamnă ${formatRo(d * pv)}.`;
  return tip;
}

/** Non-zero terms of the board, e.g. 507 → [{digit:5, value:100}, {digit:7, value:1}]. */
export const termsOf = (board: Board) =>
  board
    .map((rod, r) => ({ digit: digitOf(rod), value: placeValue(r, board.length) }))
    .filter((t) => t.digit > 0);

export function describeTarget(target: number, rods = ROD_COUNT): string {
  return digitsOf(target, rods)
    .map((d, r) => (d ? `${d} pe tija ${PLACES[r]}` : null))
    .filter(Boolean)
    .join(", ");
}
