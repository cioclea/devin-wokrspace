import { MODULES } from "@/lib/curriculum";

interface Props {
  activeLessonId: string;
  open: boolean;
  onSelect: (lessonId: string) => void;
  onClose: () => void;
}

export default function Sidebar({ activeLessonId, open, onSelect, onClose }: Props) {
  return (
    <>
      <nav className={`sidebar${open ? " open" : ""}`} aria-label="Module și lecții">
        {MODULES.map((m) => (
          <div key={m.id} className="nav-module">
            <div className="nav-module-title">{m.title}</div>
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
        ))}
      </nav>
      {open && <div className="nav-backdrop" onClick={onClose} aria-hidden="true" />}
    </>
  );
}
