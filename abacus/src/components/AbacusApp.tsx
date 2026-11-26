"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { PRAISE, createEngine } from "@/lib/lesson";
import type { LessonDefinition } from "@/lib/lesson";
import { lessonStorageKey } from "@/lib/curriculum";
import { formatRo, totalOf } from "@/lib/soroban";
import { loadLesson, saveLesson } from "@/lib/persist";
import BottomBar from "./BottomBar";
import Confetti from "./Confetti";
import Goals from "./Goals";
import Header from "./Header";
import InfoPanel from "./InfoPanel";
import MissionCard from "./MissionCard";
import Modal from "./Modal";
import PartsExplorer from "./PartsExplorer";
import Soroban from "./Soroban";

interface Toast {
  text: string;
  good: boolean;
  seq: number;
}

interface Props {
  lesson: LessonDefinition;
  moduleTitle: string;
  onOpenMenu?: () => void;
  navOpen?: boolean;
}

export default function AbacusApp({ lesson, moduleTitle, onOpenMenu, navOpen }: Props) {
  const engine = useMemo(() => createEngine(lesson), [lesson]);
  const storageKey = lessonStorageKey(lesson);
  const [state, dispatch] = useReducer(engine.reducer, undefined, engine.initialLesson);
  const [helpOpen, setHelpOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [confetti, setConfetti] = useState({ burst: 0, count: 50 });
  const [wipeArm, setWipeArm] = useState(false);
  const toastSeq = useRef(0);
  const wipeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef(state);

  // Restore saved progress after mount (keeps SSR/first paint identical), then
  // persist every subsequent state change. The first effect run is skipped so
  // the initial state never overwrites stored progress before hydration.
  useEffect(() => {
    const saved = loadLesson(storageKey, lesson);
    if (saved) dispatch({ type: "hydrate", state: saved });
  }, [storageKey, lesson]);
  useEffect(() => {
    if (lastSaved.current === state) return;
    lastSaved.current = state;
    saveLesson(storageKey, state);
  }, [state, storageKey]);

  useEffect(() => () => {
    if (wipeTimer.current) clearTimeout(wipeTimer.current);
  }, []);

  const showToast = useCallback((text: string, good = false) => {
    setToast({ text, good, seq: ++toastSeq.current });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast((cur) => (cur?.seq === toast.seq ? null : cur)), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const { event } = state;
  useEffect(() => {
    if (!event) return;
    const burst = (count: number) => setConfetti((c) => ({ burst: c.burst + 1, count }));
    switch (event.kind) {
      case "solved":
        showToast(`${event.praise} +${event.points} ⭐${event.bonus ? " (bonus fără indiciu)" : ""}`, true);
        burst(50);
        break;
      case "blocked":
        showToast("Mai întâi îndeplinește misiunea. Ai nevoie de ajutor? Apasă „Ajutor”.");
        break;
      case "reset":
        showToast("Sorobanul a fost curățat. Toate tijele arată 0.");
        break;
      case "next":
        showToast(`Misiunea ${event.mission + 1}: ${engine.missions[event.mission].text}`);
        break;
      case "hint":
        showToast(event.text);
        break;
      case "already-solved":
        showToast("Misiunea este deja îndeplinită – apasă „Continuă”!");
        break;
      case "parts-goal":
        showToast(`Obiectiv atins: cunoști părțile Sorobanului! +${event.points} ⭐`, true);
        break;
      case "finished":
        burst(120);
        break;
      case "reset-progress":
        showToast("Progresul a fost șters. Succes la reînceput!", true);
        break;
    }
  }, [event, showToast, engine]);

  const anyModalOpen = helpOpen || state.finished;
  const { selectedRod } = state;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (anyModalOpen || !/^[0-9]$/.test(e.key) || e.metaKey || e.ctrlKey || e.altKey) return;
      dispatch({ type: "setDigit", rod: selectedRod, digit: Number(e.key) });
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [anyModalOpen, selectedRod]);

  const closeHelp = useCallback(() => setHelpOpen(false), []);
  const closeFinished = useCallback(() => dispatch({ type: "closeFinished" }), []);

  const wipeProgress = useCallback(() => {
    if (!wipeArm) {
      setWipeArm(true);
      wipeTimer.current = setTimeout(() => setWipeArm(false), 3000);
      return;
    }
    if (wipeTimer.current) clearTimeout(wipeTimer.current);
    setWipeArm(false);
    setHelpOpen(false);
    dispatch({ type: "resetProgress" });
  }, [wipeArm]);

  const mission = engine.missions[state.missionIndex];
  const last = engine.isLastMission(state);
  const total = totalOf(state.board);
  const message = last
    ? "Ai terminat toate misiunile! Apasă „Următoarea lecție”."
    : `${PRAISE[state.missionIndex % PRAISE.length]} Apasă „Continuă” pentru următoarea misiune.`;

  return (
    <>
      <Header
        step={state.missionIndex + 1}
        steps={engine.missions.length}
        progress={engine.progressOf(state)}
        points={state.points}
        moduleTitle={moduleTitle}
        lessonTitle={lesson.title}
        navOpen={navOpen}
        onOpenMenu={onOpenMenu}
      />

      <main>
        <section aria-labelledby="lessonTitle">
          <span className="eyebrow">{moduleTitle} · Lecția {lesson.number}</span>
          <h1 id="lessonTitle">{lesson.title}</h1>
          <p className="subtitle">{lesson.subtitle ?? "Învață să calculezi folosind tehnica japoneză"}</p>

          <MissionCard mission={mission} index={state.missionIndex} solved={state.solved} message={message} label={lesson.missionLabel} className={lesson.missionClassName} />

          <div className="card stage">
            <div className="total">
              <small>Numărul de pe Soroban</small>
              <output key={total} className={total ? "pop" : ""} aria-live="polite">{formatRo(total)}</output>
            </div>
            <p className="hint-line">👆 O atingere = bila se activează sau se dezactivează</p>
            <Soroban
              board={state.board}
              selectedRod={selectedRod}
              hints={state.hints}
              activePart={state.activePart}
              onTap={(rod, bead, index) => dispatch({ type: "tap", rod, bead, index })}
              onSelectRod={(rod) => dispatch({ type: "selectRod", rod })}
              onDigit={(rod, digit) => dispatch({ type: "setDigit", rod, digit })}
            />
          </div>
        </section>

        <aside aria-label="Panou de informații">
          <InfoPanel board={state.board} selectedRod={selectedRod} />
          <PartsExplorer
            parts={engine.parts}
            activePart={state.activePart}
            seenParts={state.seenParts}
            onToggle={(part) => dispatch({ type: "togglePart", part })}
          />
          <Goals goals={engine.goalsOf(state)} />
        </aside>
      </main>

      <BottomBar
        missionIndex={state.missionIndex}
        missions={engine.missions.length}
        solved={state.solved}
        last={last}
        onReset={() => dispatch({ type: "reset" })}
        onHelp={() => setHelpOpen(true)}
        onNext={() => dispatch({ type: "next" })}
      />

      <div className={`toast${toast ? " show" : ""}${toast?.good ? " good" : ""}`} role="status" aria-live="polite">
        {toast?.text}
      </div>

      <Modal open={helpOpen} labelledBy="helpTitle" onClose={closeHelp}>
        <h2 id="helpTitle">Cum funcționează Sorobanul?</h2>
        <ul>
          <li><b>Atinge o bilă</b> o singură dată: se mișcă singură spre bara centrală (activă) sau înapoi (inactivă).</li>
          <li>Fiecare <b>tijă</b> este o poziție: Unități, Zeci, Sute…</li>
          <li><b>Bila superioară</b> valorează <b>5</b>. Fiecare <b>bilă inferioară</b> valorează <b>1</b>.</li>
          <li>Contează doar bilele care <b>ating bara centrală</b>.</li>
          <li>Bilele inferioare se mișcă împreună, ca pe un Soroban real: dacă atingi a treia bilă, urcă și cele de deasupra ei.</li>
          <li>
            Tastatură: <span className="kbd">Tab</span> / săgeți pentru a te muta, <span className="kbd">Enter</span> sau{" "}
            <span className="kbd">Spațiu</span> pentru a activa, <span className="kbd">0</span>–<span className="kbd">9</span>{" "}
            pentru a scrie cifra pe tija selectată.
          </li>
        </ul>
        <div className="row">
          <button type="button" className="btn ghost" onClick={() => { setHelpOpen(false); dispatch({ type: "hint" }); }}>
            💡 Arată-mi un indiciu
          </button>
          <button type="button" className="btn primary" onClick={closeHelp}>Am înțeles</button>
        </div>
        <div className="row">
          <button type="button" className="btn danger" onClick={wipeProgress}>
            {wipeArm ? "⚠️ Confirmă: șterge tot progresul" : "🗑️ Șterge tot progresul"}
          </button>
        </div>
      </Modal>

      <Modal open={state.finished} labelledBy="doneTitle" className="celebrate" onClose={closeFinished}>
        <div className="medal" aria-hidden="true">🏅</div>
        <h2 id="doneTitle">Felicitări! Ai descoperit Sorobanul!</h2>
        <p style={{ fontWeight: 700, color: "var(--muted)" }}>
          Ai câștigat <b>{state.points}</b> ⭐ și știi acum să formezi orice număr pe Soroban.
        </p>
        <div className="row" style={{ justifyContent: "center" }}>
          <button type="button" className="btn ghost" onClick={() => dispatch({ type: "replay" })}>↺ Reia lecția</button>
          <button type="button" className="btn primary" onClick={() => showToast("Lecția 2 – „Adunarea simplă” va fi disponibilă în curând!")}>
            Următoarea lecție →
          </button>
        </div>
      </Modal>

      <Confetti burst={confetti.burst} count={confetti.count} />
    </>
  );
}
