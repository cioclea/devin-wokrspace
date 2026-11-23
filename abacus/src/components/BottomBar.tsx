interface Props {
  missionIndex: number;
  missions: number;
  solved: boolean;
  last: boolean;
  onReset: () => void;
  onHelp: () => void;
  onNext: () => void;
}

export default function BottomBar({ missionIndex, missions, solved, last, onReset, onHelp, onNext }: Props) {
  return (
    <div className="bottom">
      <div className="bwrap">
        <button type="button" className="btn ghost" aria-label="Reset" onClick={onReset}>
          <span aria-hidden="true">↺</span><span className="t">Reset</span>
        </button>
        <button type="button" className="btn ghost" aria-label="Ajutor" onClick={onHelp}>
          <span aria-hidden="true">?</span><span className="t">Ajutor</span>
        </button>
        <div className="steps" aria-hidden="true">
          <span className="steps-label">Pasul {missionIndex + 1} din {missions}</span>
          <span className="step-dots">
            {Array.from({ length: missions }, (_, i) => {
              const done = i < missionIndex || (i === missionIndex && solved);
              const cur = i === missionIndex && !solved;
              return <i key={i} className={`${done ? "done" : ""}${cur ? "cur" : ""}`} />;
            })}
          </span>
        </div>
        <button
          type="button"
          className={`btn primary${solved ? " ready" : ""}`}
          aria-disabled={!solved}
          onClick={onNext}
        >
          <span>{last && solved ? "Următoarea lecție" : "Continuă"}</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
