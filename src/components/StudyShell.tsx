import type { ReactNode } from "react";
import type { Deck } from "../lib/types";

interface Props {
  deck: Deck;
  label: string;
  done: number;
  total: number;
  extra?: ReactNode;
  children: ReactNode;
}

export default function StudyShell({ deck, label, done, total, extra, children }: Props) {
  return (
    <section className="study">
      <div className="study-bar">
        <a className="back-link" href={`#/deck/${deck.id}`}>
          ← {deck.title}
        </a>
        <span className="study-label">{label}</span>
        <div className="study-extra">{extra}</div>
      </div>
      <div className="progress" aria-label={`${done} of ${total}`}>
        <span style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
      </div>
      <p className="progress-count">
        {Math.min(done + 1, total)} / {total}
      </p>
      {children}
    </section>
  );
}

export function RoundDone({
  title,
  detail,
  onAgain,
  onMissed,
  missedCount,
  deckId,
}: {
  title: string;
  detail: string;
  onAgain: () => void;
  onMissed?: () => void;
  missedCount?: number;
  deckId: string;
}) {
  return (
    <div className="round-done">
      <div className="confetti" aria-hidden>
        {Array.from({ length: 14 }, (_, i) => (
          <i key={i} style={{ ["--i" as string]: i }} />
        ))}
      </div>
      <h2>{title}</h2>
      <p className="lede">{detail}</p>
      <div className="row-actions center">
        {onMissed && !!missedCount && (
          <button className="primary-btn" onClick={onMissed}>
            Study the {missedCount} I missed
          </button>
        )}
        <button className={onMissed && missedCount ? "ghost-btn" : "primary-btn"} onClick={onAgain}>
          Go again
        </button>
        <a className="ghost-btn" href={`#/deck/${deckId}`}>
          Back to deck
        </a>
      </div>
    </div>
  );
}
