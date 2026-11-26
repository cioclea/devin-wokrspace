// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Soroban from "./Soroban";
import { emptyBoard, rodFromDigit } from "@/lib/soroban";
import type { Board } from "@/lib/soroban";

afterEach(cleanup);

const board = (): Board => emptyBoard(5);

const renderSoroban = (overrides: Partial<Parameters<typeof Soroban>[0]> = {}) => {
  const props = {
    board: board(),
    selectedRod: 4,
    hints: [],
    activePart: null,
    onTap: vi.fn(),
    onSelectRod: vi.fn(),
    onDigit: vi.fn(),
    ...overrides,
  };
  render(<Soroban {...props} />);
  return props;
};

const beads = () => screen.getAllByRole("button", { name: /bila/ });

describe("Soroban", () => {
  it("renders 5 rods with 5 beads each plus 5 rod labels", () => {
    renderSoroban();
    expect(beads()).toHaveLength(25);
    expect(screen.getAllByRole("button", { name: /Selectează tija/ })).toHaveLength(5);
  });

  it("reports bead taps with rod, type and index", () => {
    const props = renderSoroban();
    const target = screen.getByRole("button", { name: /Unități: bila inferioară 2/ });
    fireEvent.click(target);
    expect(props.onTap).toHaveBeenCalledWith(4, "lower", 2);
  });

  it("reflects active beads via aria-pressed", () => {
    const b = board();
    b[4] = rodFromDigit(7);
    renderSoroban({ board: b });
    expect(screen.getByRole("button", { name: /Unități: bila superioară.*activă/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Unități: bila inferioară 2.*activă/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Unități: bila inferioară 3.*inactivă/ })).toBeTruthy();
  });

  it("sets a digit when a number key is pressed on a bead", () => {
    const props = renderSoroban();
    const bead = screen.getByRole("button", { name: /Unități: bila inferioară 1/ });
    fireEvent.keyDown(bead, { key: "3" });
    expect(props.onDigit).toHaveBeenCalledWith(4, 3);
    expect(props.onTap).not.toHaveBeenCalled();
  });

  it("moves focus and selection with arrow keys", () => {
    const props = renderSoroban();
    const bead = screen.getByRole("button", { name: /Zeci: bila superioară/ });
    fireEvent.keyDown(bead, { key: "ArrowRight" });
    expect(props.onSelectRod).toHaveBeenCalledWith(4);
    fireEvent.keyDown(bead, { key: "ArrowLeft" });
    fireEvent.keyDown(bead, { key: "ArrowLeft" });
    expect(props.onSelectRod).toHaveBeenLastCalledWith(2);
  });

  it("highlights hinted beads", () => {
    renderSoroban({ hints: [{ rod: 4, type: "lower", index: 1 }] });
    expect(document.querySelector("button.bead.hint")).toBeTruthy();
  });

  it("selects a rod when its label is clicked", () => {
    const props = renderSoroban();
    fireEvent.click(screen.getByRole("button", { name: "Selectează tija Sute" }));
    expect(props.onSelectRod).toHaveBeenCalledWith(2);
  });
});
