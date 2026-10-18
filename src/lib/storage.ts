import { useCallback, useEffect, useState } from "react";
import type { Deck } from "./types";

const DECKS_KEY = "memory.decks.v1";
const API_KEY = "memory.anthropicKey";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: keep working in memory */
  }
}

export function useDecks() {
  const [decks, setDecks] = useState<Deck[]>(() => read<Deck[]>(DECKS_KEY, []));

  useEffect(() => write(DECKS_KEY, decks), [decks]);

  const saveDeck = useCallback((deck: Deck) => {
    setDecks((all) => {
      const next = { ...deck, updatedAt: Date.now() };
      const i = all.findIndex((d) => d.id === deck.id);
      return i === -1 ? [next, ...all] : all.map((d) => (d.id === deck.id ? next : d));
    });
  }, []);

  const deleteDeck = useCallback((id: string) => setDecks((all) => all.filter((d) => d.id !== id)), []);

  return { decks, saveDeck, deleteDeck };
}

export function getApiKey(): string {
  return read<string>(API_KEY, "");
}

export function setApiKey(key: string) {
  if (key) write(API_KEY, key);
  else {
    try {
      localStorage.removeItem(API_KEY);
    } catch {
      /* ignore */
    }
  }
}
