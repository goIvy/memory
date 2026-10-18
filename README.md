# Memory

Upload a PDF and turn it into flashcards.

- **Word list mode** (free, instant, runs in the browser): reads vocab lists such as
  `word - meaning`, `word: meaning`, `1. word — meaning`, `word (adj.) meaning`, and
  two-column tables. A 100-word list gives 100 cards.
- **AI mode** (any PDF: notes, chapters, scans): Claude reads the PDF and writes the
  cards. Needs your own Anthropic API key, added under **AI settings**. The key is
  kept in your browser and sent only to Anthropic.

Study with **Flashcards** (flip, then sort into Know it / Still learning),
**Quiz** (multiple choice) or **Type it** (type the word for a meaning). Progress
is tracked per card, and you can re-study only the ones you missed.
Decks are saved in the browser (localStorage).

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # parser tests
npm run build    # static site in dist/
```

Keyboard: space flips, → = know it, ← = still learning, 1–4 picks a quiz answer.
