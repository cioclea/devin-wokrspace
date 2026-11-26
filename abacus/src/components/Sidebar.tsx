"use client";

import { useEffect, useState } from "react";
import { MODULES } from "@/lib/curriculum";

interface Props {
  activeLessonId: string;
  open: boolean;
  onSelect: (lessonId: string) => void;
  onClose: () => void;
}

export default function Sidebar({ activeLessonId, open, onSelect, onClose }: Props) {
  const activeModuleId = MODULES.find((m) => m.lessons.some((l) => l.id === activeLessonId))?.id;
  const [openModules, setOpenModules] = useState<ReadonlySet<string>>(
    () => new Set(activeModuleId ? [activeModuleId] : []),
  );

  // Re-expand the module when the active lesson moves into a collapsed one.
  useEffect(() => {
    if (!activeModuleId) return;
    setOpenModules((prev) => (prev.has(activeModuleId) ? prev : new Set(prev).add(activeModuleId)));
  }, [activeModuleId]);

  const toggleModule = (id: string) =>
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <>
      <nav className={`sidebar${open ? " open" : ""}`} aria-label="Module și lecții">
        {MODULES.map((m) => {
          const isOpen = openModules.has(m.id);
          return (
            <div key={m.id} className="nav-module">
              <button
                type="button"
                className="nav-module-btn"
                aria-expanded={isOpen}
                onClick={() => toggleModule(m.id)}
              >
                <span>{m.title}</span>
                <span className="nav-chev" aria-hidden="true">▾</span>
              </button>
              {isOpen && (
                <div className="nav-lessons">
                  {m.lessons.map((l) => {
                    const active = l.id === activeLessonId;
                    return (
                      <button
                        key={l.id}
                        type="button"
                        className={`nav-lesson${active ? " active" : ""}`}
                        aria-current={active ? "page" : undefined}
                        onClick={() => onSelect(l.id)}
                      >
                        <span className="nav-num">Lecția {l.number}</span>
                        <span className="nav-title">{l.title}</span>
                        {l.comingSoon && <span className="nav-soon">Curând</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      {open && <div className="nav-backdrop" onClick={onClose} aria-hidden="true" />}
    </>
  );
}
