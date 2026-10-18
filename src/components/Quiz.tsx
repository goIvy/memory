import { useEffect, useMemo, useState } from "react";
import type { Card, Deck } from "../lib/types";
import { choicesFor, shuffle, withStatus } from "../lib/study";
import StudyShell, { RoundDone } from "./StudyShell";

interface Props {
  deck: Deck;
  saveDeck: (deck: Deck) => void;
}

export default function Quiz({ deck, saveDeck }: Props) {
  const [queue, setQueue] = useState<Card[]>(() => shuffle(deck.cards));
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [missed, setMissed] = useState<Card[]>([]);
  const [reverse, setReverse] = useState(false);

  const card = queue[index];
  const done = index >= queue.length;
  const askField = reverse ? "back" : "front";
  const answerField = reverse ? "front" : "back";
  // Choices come from the whole deck so short re-study rounds still get 4 options.
  const choices = useMemo(
    () => (card ? choicesFor(card, deck.cards, answerField) : []),
    [card?.id, answerField],
  );

  function pick(choice: string) {
    if (picked || !card) return;
    setPicked(choice);
    const right = choice === card[answerField];
    saveDeck(withStatus(deck, card.id, right ? "known" : "learning"));
    if (!right) setMissed((m) => [...m, card]);
  }

  function next() {
    setPicked(null);
    setIndex((i) => i + 1);
  }

  function restart(cards: Card[]) {
    setQueue(shuffle(cards));
    setIndex(0);
    setPicked(null);
    setMissed([]);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done) return;
      const n = Number(e.key);
      if (!picked && n >= 1 && n <= choices.length) pick(choices[n - 1]);
      else if (picked && (e.key === "Enter" || e.key === " " || e.key === "ArrowRight")) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const score = index - missed.length;

  return (
    <StudyShell
      deck={deck}
      label="Quiz"
      done={Math.min(index, queue.length)}
      total={queue.length}
      extra={
        <button className={`ghost-btn small ${reverse ? "on" : ""}`} onClick={() => setReverse((r) => !r)}>
          ⇄ {reverse ? "Pick the word" : "Pick the meaning"}
        </button>
      }
    >
      {done ? (
        <RoundDone
          deckId={deck.id}
          title={`${score} / ${queue.length} correct`}
          detail={missed.length ? "Run the ones you missed until they stick." : "A perfect round. Nice."}
          missedCount={missed.length}
          onMissed={() => restart(missed)}
          onAgain={() => restart(deck.cards)}
        />
      ) : (
        <div className="quiz">
          <div className="prompt-card">
            <span className="face-tag">{reverse ? "Which word means…" : "What does this mean?"}</span>
            <p className={`prompt-text ${card[askField].length > 80 ? "long" : ""}`}>{card[askField]}</p>
          </div>
          <div className="choices">
            {choices.map((choice, i) => {
              const state = !picked ? "" : choice === card[answerField] ? "right" : choice === picked ? "wrong" : "dim";
              return (
                <button key={choice} className={`choice ${state}`} onClick={() => pick(choice)} disabled={!!picked}>
                  <kbd>{i + 1}</kbd>
                  <span>{choice}</span>
                </button>
              );
            })}
          </div>
          <div className="quiz-foot">
            {picked && (
              <>
                <span className={picked === card[answerField] ? "good" : "bad"}>
                  {picked === card[answerField] ? "Correct!" : "Not quite. The answer is highlighted."}
                </span>
                <button className="primary-btn" onClick={next} autoFocus>
                  Next →
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </StudyShell>
  );
}
