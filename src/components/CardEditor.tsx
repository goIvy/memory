interface EditableCard {
  front: string;
  back: string;
}

interface Props<T extends EditableCard> {
  cards: T[];
  onChange: (cards: T[]) => void;
  makeCard?: () => T;
}

export default function CardEditor<T extends EditableCard>({ cards, onChange, makeCard }: Props<T>) {
  function update(i: number, patch: Partial<EditableCard>) {
    onChange(cards.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  }

  return (
    <div className="card-editor">
      <div className="card-editor-head" aria-hidden>
        <span />
        <span>Front (word)</span>
        <span>Back (meaning)</span>
        <span />
      </div>
      {cards.map((card, i) => (
        <div className="card-row" key={i}>
          <span className="card-num">{i + 1}</span>
          <textarea
            aria-label={`Card ${i + 1} front`}
            value={card.front}
            rows={1}
            onChange={(e) => update(i, { front: e.target.value })}
          />
          <textarea
            aria-label={`Card ${i + 1} back`}
            value={card.back}
            rows={2}
            onChange={(e) => update(i, { back: e.target.value })}
          />
          <button className="icon-btn" aria-label={`Delete card ${i + 1}`} onClick={() => onChange(cards.filter((_, j) => j !== i))}>
            ×
          </button>
        </div>
      ))}
      <button
        className="add-row"
        onClick={() => onChange([...cards, makeCard ? makeCard() : ({ front: "", back: "" } as T)])}
      >
        + Add a card
      </button>
    </div>
  );
}
