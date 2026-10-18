import { useState } from "react";
import type { Deck, DraftCard } from "../lib/types";
import { toCards, uid } from "../lib/types";
import { go } from "../lib/router";
import Importer from "./Importer";
import CardEditor from "./CardEditor";
import { ArcBackground, SylvaIntro } from "./ThreeUI";

interface Props {
  decks: Deck[];
  saveDeck: (deck: Deck) => void;
  openSettings: () => void;
}

interface Draft {
  title: string;
  source: string;
  cards: DraftCard[];
}

export default function Home({ decks, saveDeck, openSettings }: Props) {
  const [draft, setDraft] = useState<Draft | null>(null);

  function createDeck() {
    if (!draft) return;
    const cards = draft.cards.filter((c) => c.front.trim() && c.back.trim());
    const deck: Deck = {
      id: uid(),
      title: draft.title.trim() || "Untitled deck",
      source: draft.source,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      cards: toCards(cards),
    };
    saveDeck(deck);
    setDraft(null);
    go({ name: "deck", id: deck.id });
  }

  if (draft) {
    return (
      <section className="page narrow">
        <button className="back-link" onClick={() => setDraft(null)}>
          ← Start over
        </button>
        <p className="eyebrow">Review before saving</p>
        <h1 className="page-title">
          We found <em>{draft.cards.length}</em> {draft.cards.length === 1 ? "card" : "cards"}
        </h1>
        <p className="lede">Fix anything that looks off, then save the deck and start studying.</p>
        <label className="field">
          <span>Deck name</span>
          <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        </label>
        <CardEditor cards={draft.cards} onChange={(cards) => setDraft({ ...draft, cards })} />
        <div className="sticky-actions">
          <span className="muted">{draft.cards.length} cards</span>
          <button className="primary-btn" onClick={createDeck} disabled={draft.cards.length === 0}>
            Save deck & study
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      <SylvaIntro />
      <div className="hero-wrap" id="make">
      <ArcBackground />
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">PDF → flashcards</p>
          <h1>
            Drop in a PDF.
            <br />
            <em>Walk away remembering it.</em>
          </h1>
          <p className="lede">
            Upload a vocab list, notes or a whole chapter. Memory pulls out every word and its meaning, builds a deck,
            and drills you with flip cards, quizzes and typing practice.
          </p>
        </div>
        <Importer onCards={setDraft} openSettings={openSettings} />
        <ul className="hero-points">
          <li>
            <strong>100 words in, 100 cards out</strong>
            <span>Reads lists, tables and “word – meaning” layouts</span>
          </li>
          <li>
            <strong>Three ways to study</strong>
            <span>Flip cards, multiple choice and type-the-answer</span>
          </li>
          <li>
            <strong>Tracks what you know</strong>
            <span>Re-study only the cards you missed</span>
          </li>
        </ul>
      </section>
      </div>

      <section className="page">
        <div className="section-head">
          <h2>My decks</h2>
          <span className="muted">{decks.length ? `${decks.length} saved` : ""}</span>
        </div>
        {decks.length === 0 ? (
          <div className="empty">Your decks will show up here after your first upload.</div>
        ) : (
          <div className="deck-grid">
            {decks.map((d) => {
              const known = d.cards.filter((c) => c.status === "known").length;
              const pct = d.cards.length ? Math.round((known / d.cards.length) * 100) : 0;
              return (
                <a key={d.id} className="deck-tile" href={`#/deck/${d.id}`}>
                  <div className="deck-stack" aria-hidden>
                    <span />
                    <span />
                  </div>
                  <h3>{d.title}</h3>
                  <p className="muted">
                    {d.cards.length} cards · {d.source}
                  </p>
                  <div className="meter" aria-label={`${pct}% known`}>
                    <span style={{ width: `${pct}%` }} />
                  </div>
                  <p className="meter-label">{pct}% known</p>
                </a>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
