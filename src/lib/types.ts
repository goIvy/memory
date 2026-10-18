export type CardStatus = "new" | "learning" | "known";

export interface Card {
  id: string;
  front: string;
  back: string;
  status: CardStatus;
}

export interface Deck {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  source: string;
  cards: Card[];
}

export interface DraftCard {
  front: string;
  back: string;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function toCards(drafts: DraftCard[]): Card[] {
  return drafts.map((d) => ({ id: uid(), front: d.front, back: d.back, status: "new" }));
}
