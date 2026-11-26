import { Mission } from "@/lib/lesson";
import { formatRo } from "@/lib/soroban";

interface Props {
  mission: Mission;
  index: number;
  solved: boolean;
  message: string;
  label?: string;
}

export default function MissionCard({ mission, index, solved, message, label }: Props) {
  return (
    <div className={`card mission${solved ? " done" : ""}`} aria-live="polite">
      <div className="ic" aria-hidden="true">{solved ? "✅" : mission.icon}</div>
      <div>
        <h2>{solved ? "Misiune îndeplinită!" : (label ?? `Misiunea ${index + 1}`)}</h2>
        <p>{solved ? message : mission.text}</p>
      </div>
      <div className="tgt">
        <small>Țintă</small>
        <span>{formatRo(mission.target)}</span>
      </div>
    </div>
  );
}
