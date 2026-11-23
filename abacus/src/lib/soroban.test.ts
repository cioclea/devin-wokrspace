import { describe, expect, it } from "vitest";
import {
  beadOffset, digitOf, digitsOf, emptyBoard, hintBeads, rodFromDigit, setDigit, tapBead, tipFor, totalOf,
} from "./soroban";

describe("soroban values", () => {
  it("upper bead is worth 5 and each lower bead 1", () => {
    expect(digitOf({ upper: true, lower: 2 })).toBe(7);
    expect(digitOf({ upper: false, lower: 0 })).toBe(0);
  });

  it("computes the total from place values", () => {
    const board = setDigit(setDigit(emptyBoard(), 2, 5), 4, 7);
    expect(totalOf(board)).toBe(507);
  });

  it("maps every digit to an authentic rod", () => {
    for (let d = 0; d <= 9; d++) expect(digitOf(rodFromDigit(d))).toBe(d);
    expect(() => rodFromDigit(10)).toThrow(RangeError);
  });

  it("splits numbers into digits per rod", () => {
    expect(digitsOf(507)).toEqual([0, 0, 5, 0, 7]);
  });
});

describe("tapBead", () => {
  it("toggles the upper bead", () => {
    const on = tapBead(emptyBoard(), 4, "upper", 0);
    expect(on[4].upper).toBe(true);
    expect(tapBead(on, 4, "upper", 0)[4].upper).toBe(false);
  });

  it("pushes the beads between the tapped bead and the beam", () => {
    expect(tapBead(emptyBoard(), 4, "lower", 3)[4].lower).toBe(3);
  });

  it("deactivating a bead drops it and the beads below it", () => {
    const four = tapBead(emptyBoard(), 4, "lower", 4);
    expect(tapBead(four, 4, "lower", 2)[4].lower).toBe(1);
    expect(tapBead(four, 4, "lower", 1)[4].lower).toBe(0);
  });

  it("does not mutate the input or touch other rods", () => {
    const board = emptyBoard();
    const next = tapBead(board, 3, "lower", 1);
    expect(board[3].lower).toBe(0);
    expect(next[4]).toBe(board[4]);
  });

  it("ignores out-of-range lower beads", () => {
    expect(tapBead(emptyBoard(), 4, "lower", 5)[4].lower).toBe(0);
  });
});

describe("beadOffset", () => {
  it("moves active beads next to the beam", () => {
    const rod = { upper: true, lower: 1 };
    expect(beadOffset(rod, "upper", 0)).toBe(1);
    expect(beadOffset(rod, "lower", 1)).toBe(0);
    expect(beadOffset(rod, "lower", 2)).toBe(2);
  });
});

describe("hintBeads", () => {
  it("returns the beads to tap to reach the target", () => {
    expect(hintBeads(emptyBoard(), 507)).toEqual([
      { rod: 2, type: "upper", index: 0 },
      { rod: 4, type: "upper", index: 0 },
      { rod: 4, type: "lower", index: 2 },
    ]);
  });

  it("suggests the right bead when beads must be removed", () => {
    const board = setDigit(emptyBoard(), 4, 4);
    expect(hintBeads(board, 1)).toEqual([{ rod: 4, type: "lower", index: 2 }]);
  });

  it("applying the hints reaches the target", () => {
    let board = setDigit(emptyBoard(), 3, 9);
    for (const h of hintBeads(board, 24)) board = tapBead(board, h.rod, h.type, h.index);
    expect(totalOf(board)).toBe(24);
  });
});

describe("tipFor", () => {
  it("explains combinations and place value", () => {
    expect(tipFor(setDigit(emptyBoard(), 4, 7), 4)).toContain("5 + 2 bile de 1 = 7");
    expect(tipFor(setDigit(emptyBoard(), 3, 2), 3)).toContain("înseamnă 20");
  });
});
