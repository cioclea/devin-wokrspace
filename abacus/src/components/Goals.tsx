interface Props {
  goals: { text: string; done: boolean }[];
}

export default function Goals({ goals }: Props) {
  return (
    <div className="card goals">
      <h3>Obiective de învățare</h3>
      <ul>
        {goals.map((g) => (
          <li key={g.text} className={g.done ? "ok" : ""}>
            <span className="ck" aria-hidden="true">{g.done ? "✓" : ""}</span>
            {g.text}
            {g.done && <span className="sr-only"> – realizat</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
