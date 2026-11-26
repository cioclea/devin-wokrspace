"use client";

import { useCallback, useState } from "react";
import { MODULES, getLesson, getModule } from "@/lib/curriculum";
import AbacusApp from "./AbacusApp";
import Sidebar from "./Sidebar";

const DEFAULT_LESSON = MODULES[0].lessons[0].id;

export default function Shell() {
  const [lessonId, setLessonId] = useState(DEFAULT_LESSON);
  const [navOpen, setNavOpen] = useState(false);

  const lesson = getLesson(lessonId) ?? MODULES[0].lessons[0];
  const moduleDef = getModule(lesson.moduleId) ?? MODULES[0];

  const selectLesson = useCallback((id: string) => {
    setLessonId(id);
    setNavOpen(false);
  }, []);
  const closeNav = useCallback(() => setNavOpen(false), []);
  const openNav = useCallback(() => setNavOpen(true), []);

  return (
    <div className="shell">
      <Sidebar activeLessonId={lesson.id} open={navOpen} onSelect={selectLesson} onClose={closeNav} />
      {lesson.comingSoon ? (
        <main className="coming-soon">
          <div className="card">
            <span className="eyebrow">{moduleDef.title} · Lecția {lesson.number}</span>
            <h1>{lesson.title}</h1>
            <p className="subtitle">Această lecție va fi disponibilă în curând. Revino curând!</p>
          </div>
        </main>
      ) : (
        <AbacusApp key={lesson.id} lesson={lesson} moduleTitle={moduleDef.title} onOpenMenu={openNav} navOpen={navOpen} />
      )}
    </div>
  );
}
