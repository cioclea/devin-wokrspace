import { Board, PLACES, digitOf, formatRo, lowerBeadsLabel, termsOf, tipFor, totalOf } from "@/lib/soroban";

interface Props {
  board: Board;
  selectedRod: number;
}

export default function InfoPanel({ board, selectedRod }: Props) {
  const rod = board[selectedRod];
  const digit = digitOf(rod);
  const terms = termsOf(board);

  return (
    <div className="card digit-card">
      <div className="dc-head">
        <h3>Cifra reprezentată</h3>
        <span className="place">{PLACES[selectedRod]}</span>
      </div>
      <div className="dc-main">
        <div key={`${selectedRod}-${digit}`} className="big pop" aria-live="polite">{digit}</div>
        <ul className="lines">
          {digit === 0 && <li><span className="chip none" />Nicio bilă nu atinge bara</li>}
          {rod.upper && <li><span className="chip up" />1 bilă superioară activată = 5</li>}
          {rod.lower > 0 && <li><span className="chip low" />{lowerBeadsLabel(rod.lower)} = {rod.lower}</li>}
          <li className="sum">Total = <b>{digit}</b></li>
        </ul>
      </div>
      <div className="formula">
        {terms.length === 0 ? (
          <>Sorobanul este <b>curat</b>: toate tijele arată 0.</>
        ) : (
          <>
            Numărul total: {terms.map((t) => `${t.digit} × ${formatRo(t.value)}`).join(" + ")} ={" "}
            <b>{formatRo(totalOf(board))}</b>
          </>
        )}
      </div>
      <div className="tip">
        <span className="s" aria-hidden="true">🦉</span>
        <span>{tipFor(board, selectedRod)}</span>
      </div>
    </div>
  );
}
