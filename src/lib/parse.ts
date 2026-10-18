import type { DraftCard } from "./types";

/** Separators we look for between a word and its meaning, strongest first. */
const SEPARATORS: { name: string; re: RegExp }[] = [
  { name: "tab", re: /\t+/ },
  { name: "em-dash", re: /\s+—\s*|\s*—\s+/ },
  { name: "en-dash", re: /\s+–\s+/ },
  { name: "hyphen", re: /\s+-{1,2}\s+/ },
  { name: "colon", re: /\s*:\s+/ },
  { name: "equals", re: /\s+=\s+/ },
  { name: "pipe", re: /\s*\|\s*/ },
];

const POS = "n|v|vt|vi|adj|adv|prep|conj|pron|interj|noun|verb|adjective|adverb";
const POS_RE = new RegExp(`^(.{1,40}?)\\s+\\(?((?:${POS})\\.?)\\)?\\s+(.+)$`, "i");
const BULLET_RE = /^\s*(?:\(?\d{1,4}[.)]|[•●▪◦·*\-–]|[a-z][.)])\s+/i;

function stripBullet(line: string): string {
  return line.replace(BULLET_RE, "").trim();
}

function looksLikeTerm(term: string): boolean {
  if (!term || term.length > 60) return false;
  const words = term.split(/\s+/).length;
  if (words > 7) return false;
  if (/^\d+$/.test(term)) return false;
  return /\p{L}/u.test(term);
}

function splitLine(line: string, sep: RegExp): DraftCard | null {
  const match = sep.exec(line);
  if (!match || match.index === 0) return null;
  const front = line.slice(0, match.index).trim();
  const back = line.slice(match.index + match[0].length).replace(/\t+/g, " ").trim();
  if (!looksLikeTerm(front) || back.length < 2) return null;
  return { front, back };
}

function splitPos(line: string): DraftCard | null {
  const m = POS_RE.exec(line);
  if (!m || !looksLikeTerm(m[1])) return null;
  return { front: m[1].trim(), back: `(${m[2].replace(/\.$/, "")}.) ${m[3].trim()}` };
}

function isNoise(line: string): boolean {
  return /^(page\s*)?\d+(\s*(of|\/)\s*\d+)?$/i.test(line) || line.length < 2;
}

/**
 * Turns lines of text into word/definition cards.
 * It picks the separator most lines agree on (tab, dash, colon...), so a colon
 * inside a definition doesn't get mistaken for a new card. Lines with no
 * separator are treated as the wrapped continuation of the previous definition.
 */
export function parseVocabulary(lines: string[]): DraftCard[] {
  const cleaned = lines.map((l) => l.replace(/\s+$/, "")).filter((l) => !isNoise(l.trim()));
  const bodies = cleaned.map(stripBullet);

  let best: { re: RegExp | null; hits: number } = { re: null, hits: 0 };
  for (const sep of SEPARATORS) {
    const hits = bodies.filter((l) => splitLine(l, sep.re)).length;
    if (hits > best.hits) best = { re: sep.re, hits };
  }
  const posHits = bodies.filter((l) => splitPos(l)).length;
  const usePos = posHits > best.hits;

  const cards: DraftCard[] = [];
  for (let i = 0; i < bodies.length; i++) {
    const body = bodies[i];
    const card = usePos ? splitPos(body) : best.re ? splitLine(body, best.re) : null;
    if (card) {
      cards.push(card);
      continue;
    }
    const prev = cards[cards.length - 1];
    const startsNewItem = BULLET_RE.test(cleaned[i]);
    if (prev && !startsNewItem && body.length > 0) {
      prev.back = `${prev.back} ${body.replace(/\t+/g, " ")}`.replace(/\s+/g, " ").trim();
    }
  }

  // Merge duplicates (same word twice) and drop empty results.
  const seen = new Map<string, DraftCard>();
  for (const c of cards) {
    const key = c.front.toLowerCase();
    const existing = seen.get(key);
    if (existing) {
      if (!existing.back.includes(c.back)) existing.back += `; ${c.back}`;
    } else seen.set(key, { ...c });
  }
  return [...seen.values()].filter((c) => !isHeaderRow(c));
}

const HEADER_WORDS = /^(words?|terms?|vocab(ulary)?|english|concepts?|meanings?|definitions?|translations?|answers?|questions?)$/i;
function isHeaderRow(c: DraftCard): boolean {
  return HEADER_WORDS.test(c.front) && HEADER_WORDS.test(c.back);
}

export function textToLines(text: string): string[] {
  return text.split(/\r?\n/);
}
