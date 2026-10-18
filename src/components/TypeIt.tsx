import { useRef, useState } from "react";
import type { Card, Deck } from "../lib/types";
import { grade, shuffle, withStatus, type Grade } from "../lib/study";
import StudyShell, { RoundDone } from "./StudyShell";

interface Props {
  deck: Deck;
  saveDeck: (deck: Deck) => void;
}

export default function TypeIt({ deck, saveDeck }: Props) {
  const [queue, setQueue] = useState<Card[]>(() => shuffle(deck.cards));
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<Grade | null>(null);
  const [missed, setMissed] = useState<Card[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const card = queue[index];
  const done = index >= queue.length;

  function check(override?: Grade) {
    if (!card) return;
    const g = override ?? grade(answer, card.front);
    setResult(g);
    const ok = g !== "wrong";
    saveDeck(withStatus(deck, card.id, ok ? "known" : "learning"));
    setMissed((m) => (ok ? m.filter((c) => c.id !== card.id) : m.some((c) => c.id === card.id) ? m : [...m, card]));
  }

  function next() {
    setResult(null);
    setAnswer("");
    setIndex((i) => i + 1);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  function restart(cards: Card[]) {
    setQueue(shuffle(cards));
    setIndex(0);
    setAnswer("");
    setResult(null);
    setMissed([]);
  }

  return (
    <StudyShell deck={deck} label="Type it" done={Math.min(index, queue.length)} total={queue.length}>
      {done ? (
        <RoundDone
          deckId={deck.id}
          title={`${queue.length - missed.length} / ${queue.length} spelled right`}
          detail={missed.length ? "Typing is the hardest mode. Run the misses again." : "Every word, from memory."}
          missedCount={missed.length}
          onMissed={() => restart(missed)}
          onAgain={() => restart(deck.cards)}
        />
      ) : (
        <div className="quiz">
          <div className="prompt-card">
            <span className="face-tag">Type the word for</span>
            <p className={`prompt-text ${card.back.length > 80 ? "long" : ""}`}>{card.back}</p>
          </div>
          <form
            className={`type-form ${result ?? ""}`}
            onSubmit={(e) => {
              e.preventDefault();
              if (result) next();
              else check();
            }}
          >
            <input
              ref={inputRef}
              autoFocus
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Your answer"
              readOnly={!!result}
              aria-label="Your answer"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            <button className="primary-btn" type="submit">
              {result ? "Next →" : "Check"}
            </button>
          </form>
          <div className="quiz-foot">
            {result === "correct" && <span className="good">Correct!</span>}
            {result === "close" && (
              <span className="good">
                Close enough. It's spelled <strong>{card.front}</strong>
              </span>
            )}
            {result === "wrong" && (
              <>
                <span className="bad">
                  The answer is <strong>{card.front}</strong>
                </span>
                <button className="ghost-btn small" onClick={() => check("correct")}>
                  I was right
                </button>
              </>
            )}
            {!result && (
              <button className="ghost-btn small" onClick={() => check("wrong")}>
                Show answer
              </button>
            )}
          </div>
        </div>
      )}
    </StudyShell>
  );
}
