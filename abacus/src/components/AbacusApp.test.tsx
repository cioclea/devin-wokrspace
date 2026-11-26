// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AbacusApp from "./AbacusApp";
import { MISSIONS } from "@/lib/lesson";

// Confetti checks prefers-reduced-motion; jsdom lacks matchMedia.
window.matchMedia = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;

const STORAGE_KEY = "soroban-lesson-v1";

const clickBead = (name: RegExp) => fireEvent.click(screen.getByRole("button", { name }));

beforeEach(() => {
  localStorage.clear();
});

afterEach(cleanup);

describe("AbacusApp", () => {
  it("renders the first mission with its target", () => {
    render(<AbacusApp />);
    expect(screen.getByText("Descoperă Sorobanul")).toBeTruthy();
    expect(screen.getByText(MISSIONS[0].text)).toBeTruthy();
    expect(screen.getByText("Misiunea 1")).toBeTruthy();
    expect(screen.getByText("Numărul de pe Soroban")).toBeTruthy();
  });

  it("solves mission 1 by tapping the first lower bead on the units rod", () => {
    render(<AbacusApp />);
    clickBead(/Unități: bila inferioară 1 \(1\), inactivă/);
    expect(screen.getByText("Misiune îndeplinită!")).toBeTruthy();
    expect(screen.getByText(/\+15/)).toBeTruthy();
  });

  it("advances to the next mission after Continue", () => {
    render(<AbacusApp />);
    clickBead(/Unități: bila inferioară 1 \(1\), inactivă/);
    fireEvent.click(screen.getByRole("button", { name: /Continuă/ }));
    expect(screen.getByText("Misiunea 2")).toBeTruthy();
    expect(screen.getByText(MISSIONS[1].text)).toBeTruthy();
  });

  it("blocks Continue until the mission is solved", () => {
    render(<AbacusApp />);
    fireEvent.click(screen.getByRole("button", { name: /Continuă/ }));
    expect(screen.getByText("Misiunea 1")).toBeTruthy();
    expect(screen.getByText(/Mai întâi îndeplinește misiunea/)).toBeTruthy();
  });

  it("sets a digit on the selected rod via keyboard", () => {
    render(<AbacusApp />);
    fireEvent.keyDown(document, { key: "3" });
    expect(screen.getByText("3", { selector: "output" })).toBeTruthy();
  });

  it("shows the help modal and its two-step progress wipe", () => {
    render(<AbacusApp />);
    fireEvent.click(screen.getByRole("button", { name: "Ajutor" }));
    expect(screen.getByText("Cum funcționează Sorobanul?")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Șterge tot progresul/ }));
    // first click only arms the confirmation
    expect(screen.getByText("Cum funcționează Sorobanul?")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Confirmă: șterge tot progresul/ }));
    expect(screen.getByText(/Progresul a fost șters/)).toBeTruthy();
  });

  it("persists progress to localStorage and restores it on reload", () => {
    const first = render(<AbacusApp />);
    clickBead(/Unități: bila inferioară 1 \(1\), inactivă/);
    fireEvent.click(screen.getByRole("button", { name: /Continuă/ }));
    first.unmount();

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(saved.missionIndex).toBe(1);
    expect(saved.points).toBe(15);

    render(<AbacusApp />);
    expect(screen.getByText("Misiunea 2")).toBeTruthy();
    expect(screen.getByText("15")).toBeTruthy();
  });

  it("explores a soroban part and shows its description", () => {
    render(<AbacusApp />);
    fireEvent.click(screen.getByRole("button", { name: "Bara de calcul" }));
    expect(screen.getByText(/desparte bilele/)).toBeTruthy();
  });
});
