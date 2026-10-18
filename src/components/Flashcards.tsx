import { useCallback, useEffect, useState } from "react";
import type { Card, Deck } from "../lib/types";
import { shuffle, withStatus } from "../lib/study";
import StudyShell, { RoundDone } from "./StudyShell";

interface Props {
  deck: Deck;
  saveDeck: (deck: Deck) => void;
}

export default function Flashcards({ deck, saveDeck }: Props) {
  const [queue, setQueue] = useState<Card[]>(() => deck.cards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reverse, setReverse] = useState(false);
  const [missed, setMissed] = useState<Card[]>([]);
  const [knownCount, setKnownCount] = useState(0);
  const [leaving, setLeaving] = useState<"left" | "right" | null>(null);

  const card = queue[index];
  const done = index >= queue.length;

  const restart = (cards: Card[]) => {
    setQueue(cards);
    setIndex(0);
    setFlipped(false);
    setMissed([]);
    setKnownCount(0);
  };

  const answer = useCallback(
    (knew: boolean) => {
      if (!card || leaving) return;
      saveDeck(withStatus(deck, card.id, knew ? "known" : "learning"));
      if (knew) setKnownCount((n) => n + 1);
      else setMissed((m) => [...m, card]);
      setLeaving(knew ? "right" : "left");
      window.setTimeout(() => {
        setLeaving(null);
        setFlipped(false);
        setIndex((i) => i + 1);
      }, 260);
    },
    [card, deck, leaving, saveDeck],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done || (e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === " " || e.key === "Enter" || e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === "ArrowRight" || e.key === "2") answer(true);
      else if (e.key === "ArrowLeft" || e.key === "1") answer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer, done]);

  const front = card ? (reverse ? card.back : card.front) : "";
  const back = card ? (reverse ? card.front : card.back) : "";

  return (
    <StudyShell
      deck={deck}
      label="Flashcards"
      done={Math.min(index, queue.length)}
      total={queue.length}
      extra={
        <>
          <button className="ghost-btn small" onClick={() => restart(shuffle(queue))} title="Shuffle">
            ⤨ Shuffle
          </button>
          <button className={`ghost-btn small ${reverse ? "on" : ""}`} onClick={() => setReverse((r) => !r)} title="Show meaning first">
            ⇄ Meaning first
          </button>
        </>
      }
    >
      {done ? (
        <RoundDone
          deckId={deck.id}
          title={missed.length === 0 ? "You knew every card!" : "Round complete"}
          detail={`${knownCount} known · ${missed.length} still learning`}
          missedCount={missed.length}
          onMissed={() => restart(shuffle(missed))}
          onAgain={() => restart(shuffle(deck.cards))}
        />
      ) : (
        <>
          <div className="flip-stage">
            <button
              className={`flip-card ${flipped ? "flipped" : ""} ${leaving ? `leave-${leaving}` : ""}`}
              onClick={() => setFlipped((f) => !f)}
              aria-label={flipped ? `Answer: ${back}. Click to flip back.` : `${front}. Click to see the answer.`}
            >
              <span className="flip-inner">
                <span className="face front">
                  <span className="face-tag">{reverse ? "Meaning" : "Word"}</span>
                  <span className={`face-text ${front.length > 80 ? "long" : ""}`}>{front}</span>
                  <span className="face-hint">Click or press space to flip</span>
                </span>
                <span className="face back">
                  <span className="face-tag">{reverse ? "Word" : "Meaning"}</span>
                  <span className={`face-text ${back.length > 80 ? "long" : ""}`}>{back}</span>
                </span>
              </span>
            </button>
          </div>
          <div className="answer-row">
            <button className="answer-btn miss" onClick={() => answer(false)}>
              <kbd>←</kbd> Still learning
            </button>
            <button className="answer-btn hit" onClick={() => answer(true)}>
              Know it <kbd>→</kbd>
            </button>
          </div>
        </>
      )}
    </StudyShell>
  );
}
