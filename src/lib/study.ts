import type { Card, CardStatus, Deck } from "./types";

export function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function withStatus(deck: Deck, cardId: string, status: CardStatus): Deck {
  return { ...deck, cards: deck.cards.map((c) => (c.id === cardId ? { ...c, status } : c)) };
}

/** Normalises an answer so "The  Mitochondria." matches "mitochondria". */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/^(the|a|an|to)\s+/, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function distance(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

export type Grade = "correct" | "close" | "wrong";

export function grade(answer: string, expected: string): Grade {
  const a = normalize(answer);
  const options = expected.split(/[;,/]/).map(normalize).filter(Boolean);
  if (!a) return "wrong";
  if (options.includes(a) || normalize(expected) === a) return "correct";
  const near = options.some((o) => o.length > 4 && distance(a, o) <= Math.max(1, Math.floor(o.length / 8)));
  return near ? "close" : "wrong";
}

export function choicesFor(card: Card, deck: Card[], field: "front" | "back", count = 4): string[] {
  const pool = shuffle(deck.filter((c) => c.id !== card.id && normalize(c[field]) !== normalize(card[field])));
  const seen = new Set([normalize(card[field])]);
  const picks: string[] = [];
  for (const c of pool) {
    const key = normalize(c[field]);
    if (seen.has(key)) continue;
    seen.add(key);
    picks.push(c[field]);
    if (picks.length === count - 1) break;
  }
  return shuffle([card[field], ...picks]);
}
