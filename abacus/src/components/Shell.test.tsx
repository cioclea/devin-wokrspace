// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Shell from "./Shell";
import { MODULES, lessonStorageKey } from "@/lib/curriculum";

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

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("Shell", () => {
  it("lists both modules and their lessons in the sidebar", () => {
    render(<Shell />);
    const nav = within(screen.getByRole("navigation", { name: "Module și lecții" }));
    expect(nav.getByText("Modulul 1")).toBeTruthy();
    expect(nav.getByText("Modulul 2")).toBeTruthy();
    expect(nav.getByRole("button", { name: /Descoperă componentele abacului/ })).toBeTruthy();
    expect(nav.getByRole("button", { name: /Descoperă Sorobanul/ })).toBeTruthy();
    expect(nav.getByRole("button", { name: /Lecție nouă/ })).toBeTruthy();
  });

  it("opens on Modulul 1 · Lecția 1 by default", () => {
    render(<Shell />);
    expect(screen.getByRole("heading", { name: "Descoperă componentele abacului" })).toBeTruthy();
    expect(screen.getByText(/Explorează frame-ul/)).toBeTruthy();
  });

  it("switches to Modulul 2 · Lecția 1 (the original lesson)", () => {
    render(<Shell />);
    fireEvent.click(screen.getByRole("button", { name: /Descoperă Sorobanul/ }));
    expect(screen.getByText("Învață să calculezi folosind tehnica japoneză")).toBeTruthy();
    expect(screen.getByText("Misiunea 1")).toBeTruthy();
  });

  it("shows a coming-soon panel for placeholder lessons", () => {
    render(<Shell />);
    fireEvent.click(screen.getByRole("button", { name: /Lecție nouă/ }));
    expect(screen.getByText(/va fi disponibilă în curând/)).toBeTruthy();
  });

  it("keeps progress isolated per lesson", () => {
    const m2 = MODULES[1].lessons[0];
    // simulate saved progress in Modulul 2
    localStorage.setItem(
      lessonStorageKey(m2),
      JSON.stringify({
        board: Array.from({ length: 5 }, () => ({ upper: false, lower: 0 })),
        selectedRod: 4, missionIndex: 1, solved: false, hintUsed: false,
        points: 15, hints: [], seenParts: [], activePart: null, finished: false, event: null,
      }),
    );
    render(<Shell />);
    // Modulul 1 starts fresh at mission 1
    expect(screen.getByText("Misiunea 1")).toBeTruthy();
    // switch to Modulul 2 → restored to mission 2 with 15 points
    fireEvent.click(screen.getByRole("button", { name: /Descoperă Sorobanul/ }));
    expect(screen.getByText("Misiunea 2")).toBeTruthy();
    expect(screen.getByText("15")).toBeTruthy();
  });
});
