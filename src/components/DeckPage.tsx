import { useEffect, useState } from "react";
import type { Card, Deck } from "../lib/types";
import { uid } from "../lib/types";
import { go } from "../lib/router";
import CardEditor from "./CardEditor";

interface Props {
  deck: Deck;
  saveDeck: (deck: Deck) => void;
  deleteDeck: (id: string) => void;
}

const MODES = [
  { mode: "flip", title: "Flashcards", text: "Flip, then sort into Know it / Still learning", icon: "◧" },
  { mode: "quiz", title: "Quiz", text: "Pick the right meaning out of four", icon: "◉" },
  { mode: "type", title: "Type it", text: "Read the meaning, type the word", icon: "⌨" },
] as const;

export default function DeckPage({ deck, saveDeck, deleteDeck }: Props) {
  const [editing, setEditing] = useState(false);
  const [cards, setCards] = useState<Card[]>(deck.cards);
  const [title, setTitle] = useState(deck.title);

  useEffect(() => {
    setCards(deck.cards);
    setTitle(deck.title);
  }, [deck]);

  const known = deck.cards.filter((c) => c.status === "known").length;
  const learning = deck.cards.filter((c) => c.status === "learning").length;
  const fresh = deck.cards.length - known - learning;

  function save() {
    saveDeck({ ...deck, title: title.trim() || deck.title, cards: cards.filter((c) => c.front.trim() && c.back.trim()) });
    setEditing(false);
  }

  return (
    <section className="page narrow">
      <a className="back-link" href="#/">
        ← All decks
      </a>
      <p className="eyebrow">{deck.source}</p>
      {editing ? (
        <input className="title-input" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Deck name" />
      ) : (
        <h1 className="page-title">{deck.title}</h1>
      )}

      <div className="stats">
        <div>
          <strong>{deck.cards.length}</strong>
          <span>cards</span>
        </div>
        <div className="stat-known">
          <strong>{known}</strong>
          <span>known</span>
        </div>
        <div className="stat-learning">
          <strong>{learning}</strong>
          <span>learning</span>
        </div>
        <div>
          <strong>{fresh}</strong>
          <span>not studied</span>
        </div>
      </div>
      <div className="meter big" aria-hidden>
        <span style={{ width: `${deck.cards.length ? (known / deck.cards.length) * 100 : 0}%` }} />
        <span className="meter-learning" style={{ width: `${deck.cards.length ? (learning / deck.cards.length) * 100 : 0}%` }} />
      </div>

      <div className="mode-grid">
        {MODES.map((m) => (
          <button
            key={m.mode}
            className="mode-card"
            disabled={deck.cards.length === 0 || (m.mode === "quiz" && deck.cards.length < 2)}
            onClick={() => go({ name: "study", id: deck.id, mode: m.mode })}
          >
            <span className="mode-icon" aria-hidden>
              {m.icon}
            </span>
            <strong>{m.title}</strong>
            <span>{m.text}</span>
          </button>
        ))}
      </div>

      <div className="section-head">
        <h2>Cards</h2>
        <div className="row-actions">
          {editing ? (
            <>
              <button
                className="ghost-btn"
                onClick={() => {
                  setCards(deck.cards);
                  setTitle(deck.title);
                  setEditing(false);
                }}
              >
                Cancel
              </button>
              <button className="primary-btn small" onClick={save}>
                Save changes
              </button>
            </>
          ) : (
            <>
              {known + learning > 0 && (
                <button
                  className="ghost-btn"
                  onClick={() => saveDeck({ ...deck, cards: deck.cards.map((c) => ({ ...c, status: "new" })) })}
                >
                  Reset progress
                </button>
              )}
              <button className="ghost-btn" onClick={() => setEditing(true)}>
                Edit cards
              </button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <>
          <CardEditor cards={cards} onChange={setCards} makeCard={(): Card => ({ id: uid(), front: "", back: "", status: "new" })} />
          <button
            className="danger-link"
            onClick={() => {
              if (confirm(`Delete “${deck.title}”? This can't be undone.`)) {
                deleteDeck(deck.id);
                go({ name: "home" });
              }
            }}
          >
            Delete this deck
          </button>
        </>
      ) : (
        <ul className="card-list">
          {deck.cards.map((c) => (
            <li key={c.id}>
              <span className={`dot ${c.status}`} title={c.status} />
              <strong>{c.front}</strong>
              <span>{c.back}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
