// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import BottomBar from "./BottomBar";
import Confetti from "./Confetti";
import Goals from "./Goals";
import Header from "./Header";
import InfoPanel from "./InfoPanel";
import MissionCard from "./MissionCard";
import Modal from "./Modal";
import PartsExplorer from "./PartsExplorer";
import { MISSIONS } from "@/lib/lesson";
import { emptyBoard, rodFromDigit } from "@/lib/soroban";
import type { Board } from "@/lib/soroban";

afterEach(cleanup);

describe("Header", () => {
  it("shows module, step and points", () => {
    render(<Header step={2} steps={7} progress={30} points={25} />);
    expect(screen.getByText("Pasul 2/7")).toBeTruthy();
    expect(screen.getByText("25")).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("30");
  });
});

describe("MissionCard", () => {
  it("shows the mission text and target", () => {
    render(<MissionCard mission={MISSIONS[0]} index={0} solved={false} message="" />);
    expect(screen.getByText("Misiunea 1")).toBeTruthy();
    expect(screen.getByText(MISSIONS[0].text)).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
  });

  it("switches to the solved state", () => {
    render(<MissionCard mission={MISSIONS[0]} index={0} solved message="Felicitări!" />);
    expect(screen.getByText("Misiune îndeplinită!")).toBeTruthy();
    expect(screen.getByText("Felicitări!")).toBeTruthy();
  });
});

describe("InfoPanel", () => {
  it("describes an empty board", () => {
    render(<InfoPanel board={emptyBoard(5)} selectedRod={4} />);
    expect(screen.getByText(/toate tijele arată 0/)).toBeTruthy();
    expect(screen.getByText("Cifra reprezentată")).toBeTruthy();
  });

  it("shows the digit breakdown for a set rod", () => {
    const board: Board = emptyBoard(5);
    board[4] = rodFromDigit(7);
    render(<InfoPanel board={board} selectedRod={4} />);
    expect(screen.getByText("7", { selector: ".big" })).toBeTruthy();
    expect(screen.getByText(/5 \+ 2 bile/)).toBeTruthy();
    expect(screen.getByText(/7 × 1/)).toBeTruthy();
  });
});

describe("PartsExplorer", () => {
  it("lists all parts and shows the active description", () => {
    const onToggle = vi.fn();
    render(<PartsExplorer activePart="beam" seenParts={["beam"]} onToggle={onToggle} />);
    expect(screen.getAllByRole("button")).toHaveLength(6);
    expect(screen.getByText(/desparte bilele/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Rama" }));
    expect(onToggle).toHaveBeenCalledWith("frame");
  });
});

describe("Goals", () => {
  it("marks completed goals", () => {
    render(<Goals goals={[{ text: "G1", done: true }, { text: "G2", done: false }]} />);
    expect(screen.getByText("G1")).toBeTruthy();
    expect(screen.getByText("– realizat")).toBeTruthy();
  });
});

describe("BottomBar", () => {
  const base = { missionIndex: 0, missions: 7, solved: false, last: false, onReset: vi.fn(), onHelp: vi.fn(), onNext: vi.fn() };

  it("renders step dots and Continue", () => {
    render(<BottomBar {...base} />);
    expect(screen.getByText("Pasul 1 din 7")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Continuă/ })).toBeTruthy();
  });

  it("shows the final label on the last solved mission", () => {
    render(<BottomBar {...base} missionIndex={6} solved last />);
    expect(screen.getByRole("button", { name: /Următoarea lecție/ })).toBeTruthy();
  });

  it("wires reset, help and next callbacks", () => {
    const props = { ...base, onReset: vi.fn(), onHelp: vi.fn(), onNext: vi.fn() };
    render(<BottomBar {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    fireEvent.click(screen.getByRole("button", { name: "Ajutor" }));
    fireEvent.click(screen.getByRole("button", { name: /Continuă/ }));
    expect(props.onReset).toHaveBeenCalled();
    expect(props.onHelp).toHaveBeenCalled();
    expect(props.onNext).toHaveBeenCalled();
  });
});

describe("Modal", () => {
  it("renders nothing when closed and children when open", () => {
    const { rerender } = render(<Modal open={false} labelledBy="t" onClose={() => {}}>content</Modal>);
    expect(screen.queryByRole("dialog")).toBeNull();
    rerender(<Modal open labelledBy="t" onClose={() => {}}>content</Modal>);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("content")).toBeTruthy();
  });

  it("closes on Escape and backdrop click", () => {
    const onClose = vi.fn();
    render(<Modal open labelledBy="t" onClose={onClose}><button className="btn primary">ok</button></Modal>);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

describe("Confetti", () => {
  it("renders pieces after a burst", () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} })) as unknown as typeof window.matchMedia;
    const { container } = render(<Confetti burst={1} count={10} />);
    expect(container.querySelectorAll(".confetti")).toHaveLength(10);
  });
});
