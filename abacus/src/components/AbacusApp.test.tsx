// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AbacusApp from "./AbacusApp";
import { getLesson, lessonStorageKey } from "@/lib/curriculum";
import type { LessonDefinition } from "@/lib/lesson";

const DEF = getLesson("m2-l1") as LessonDefinition;
const MISSIONS = DEF.missions;
const STORAGE_KEY = lessonStorageKey(DEF);

const renderApp = () => render(<AbacusApp lesson={DEF} moduleTitle="Modulul 2" />);

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

const clickBead = (name: RegExp) => fireEvent.click(screen.getByRole("button", { name }));

beforeEach(() => {
  localStorage.clear();
});

afterEach(cleanup);

describe("AbacusApp", () => {
  it("renders the first mission with its target", () => {
    renderApp();
    expect(screen.getByText("Descoperă Sorobanul")).toBeTruthy();
    expect(screen.getByText(MISSIONS[0].text)).toBeTruthy();
    expect(screen.getByText("Misiunea 1")).toBeTruthy();
    expect(screen.getByText("Numărul de pe Soroban")).toBeTruthy();
  });

  it("solves mission 1 by tapping the first lower bead on the units rod", () => {
    renderApp();
    clickBead(/Unități: bila inferioară 1 \(1\), inactivă/);
    expect(screen.getByText("Misiune îndeplinită!")).toBeTruthy();
    expect(screen.getByText(/\+15/)).toBeTruthy();
  });

  it("advances to the next mission after Continue", () => {
    renderApp();
    clickBead(/Unități: bila inferioară 1 \(1\), inactivă/);
    fireEvent.click(screen.getByRole("button", { name: /Continuă/ }));
    expect(screen.getByText("Misiunea 2")).toBeTruthy();
    expect(screen.getByText(MISSIONS[1].text)).toBeTruthy();
  });

  it("blocks Continue until the mission is solved", () => {
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: /Continuă/ }));
    expect(screen.getByText("Misiunea 1")).toBeTruthy();
    expect(screen.getByText(/Mai întâi îndeplinește misiunea/)).toBeTruthy();
  });

  it("sets a digit on the selected rod via keyboard", () => {
    renderApp();
    fireEvent.keyDown(document, { key: "3" });
    expect(screen.getByText("3", { selector: "output" })).toBeTruthy();
  });

  it("shows the help modal and its two-step progress wipe", () => {
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: "Ajutor" }));
    expect(screen.getByText("Cum funcționează Sorobanul?")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Șterge tot progresul/ }));
    // first click only arms the confirmation
    expect(screen.getByText("Cum funcționează Sorobanul?")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Confirmă: șterge tot progresul/ }));
    expect(screen.getByText(/Progresul a fost șters/)).toBeTruthy();
  });

  it("persists progress to localStorage and restores it on reload", () => {
    const first = renderApp();
    clickBead(/Unități: bila inferioară 1 \(1\), inactivă/);
    fireEvent.click(screen.getByRole("button", { name: /Continuă/ }));
    first.unmount();

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(saved.missionIndex).toBe(1);
    expect(saved.points).toBe(15);

    renderApp();
    expect(screen.getByText("Misiunea 2")).toBeTruthy();
    expect(screen.getByText("15")).toBeTruthy();
  });

  it("explores a soroban part and shows its description", () => {
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: "Bara de calcul" }));
    expect(screen.getByText(/desparte bilele/)).toBeTruthy();
  });
});
