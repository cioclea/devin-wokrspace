interface Props {
  step: number;
  steps: number;
  progress: number;
  points: number;
  moduleTitle: string;
  lessonTitle: string;
  navOpen?: boolean;
  onOpenMenu?: () => void;
}

export default function Header({ step, steps, progress, points, moduleTitle, lessonTitle, navOpen, onOpenMenu }: Props) {
  return (
    <header>
      <div className="hwrap">
        {onOpenMenu && (
          <button
            type="button"
            className="menu-btn"
            aria-label="Meniu module"
            aria-expanded={navOpen}
            onClick={onOpenMenu}
          >
            ☰
          </button>
        )}
        <div className="logo" aria-label="Abacus Soroban">
          <div className="logo-mark" aria-hidden="true">
            <div><i /><i /><i /></div>
          </div>
          <div>Abacus<small>SOROBAN ACADEMY</small></div>
        </div>
        <div className="module" aria-label="Progresul lecției">
          <div className="module-top">
            <span><b>{moduleTitle}</b> · {lessonTitle}</span>
            <span>Pasul {step}/{steps}</span>
          </div>
          <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="profile">
          <div key={points} className={`points${points ? " bump" : ""}`} title="Puncte" aria-live="polite">
            <span aria-hidden="true">⭐</span>
            <span>{points}</span>
          </div>
          <div className="avatar" title="Profilul meu" aria-label="Profil utilizator: Ana">A</div>
        </div>
      </div>
    </header>
  );
}
