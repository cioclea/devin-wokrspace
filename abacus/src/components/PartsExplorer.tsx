import type { PartDef, PartId } from "@/lib/lesson";

interface Props {
  parts: PartDef[];
  activePart: PartId | null;
  seenParts: PartId[];
  onToggle: (part: PartId) => void;
}

export default function PartsExplorer({ parts, activePart, seenParts, onToggle }: Props) {
  const active = parts.find((p) => p.id === activePart);
  return (
    <div className="card parts">
      <h3>Părțile Sorobanului</h3>
      <div className="chips">
        {parts.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`pchip${seenParts.includes(p.id) ? " seen" : ""}`}
            aria-pressed={activePart === p.id}
            onClick={() => onToggle(p.id)}
          >
            {p.name}
          </button>
        ))}
      </div>
      <p className="pdesc" aria-live="polite">
        {active ? active.desc : "Atinge o parte pentru a o vedea evidențiată pe Soroban."}
      </p>
    </div>
  );
}
