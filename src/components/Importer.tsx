import { useRef, useState } from "react";
import type { DraftCard } from "../lib/types";
import { parseVocabulary, textToLines } from "../lib/parse";
import { getApiKey } from "../lib/storage";

interface Props {
  onCards: (draft: { title: string; source: string; cards: DraftCard[] }) => void;
  openSettings: () => void;
}

type Mode = "auto" | "ai";
const MAX_PDF_BYTES = 30 * 1024 * 1024;

function titleFromFile(name: string) {
  const base = name.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ").trim();
  return base.charAt(0).toUpperCase() + base.slice(1);
}

// Heavy libraries (PDF reader, Claude SDK) load on first use.
const loadPdf = () => import("../lib/pdf");
const loadAi = () => import("../lib/ai");

export default function Importer({ onCards, openSettings }: Props) {
  const [mode, setMode] = useState<Mode>("auto");
  const [tab, setTab] = useState<"pdf" | "text">("pdf");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function run(task: () => Promise<void>) {
    setError(null);
    try {
      await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong reading that file.");
    } finally {
      setBusy(null);
    }
  }

  function requireKey(): string | null {
    const key = getApiKey();
    if (!key) {
      setError("AI mode needs an Anthropic API key. Add one in AI settings.");
      openSettings();
      return null;
    }
    return key;
  }

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) {
      setError("That isn't a PDF. Choose a .pdf file.");
      return;
    }
    const title = titleFromFile(file.name);
    run(async () => {
      if (mode === "ai") {
        const key = requireKey();
        if (!key) return;
        setBusy("Claude is reading your PDF…");
        const [{ extractPdfLines, fileToBase64 }, { generateWithClaude }] = await Promise.all([loadPdf(), loadAi()]);
        const input =
          file.size <= MAX_PDF_BYTES
            ? { kind: "pdf" as const, base64: await fileToBase64(file) }
            : { kind: "text" as const, text: (await extractPdfLines(file)).join("\n") };
        const result = await generateWithClaude(key, input);
        if (!result.cards.length) throw new Error("Claude couldn't find anything to make cards from.");
        onCards({ title: result.title || title, source: "PDF · AI", cards: result.cards });
        return;
      }
      setBusy("Reading your PDF…");
      const { extractPdfLines } = await loadPdf();
      const lines = await extractPdfLines(file);
      if (!lines.length) throw new Error("This PDF has no readable text (it may be a scan). Try AI mode instead.");
      const cards = parseVocabulary(lines);
      if (cards.length < 2) {
        throw new Error(
          "Couldn't find a word list in this PDF. Auto mode reads layouts like “word – meaning”. For notes or chapters, switch to AI mode.",
        );
      }
      onCards({ title, source: "PDF", cards });
    });
  }

  function handleText() {
    run(async () => {
      if (!text.trim()) throw new Error("Paste some text first.");
      if (mode === "ai") {
        const key = requireKey();
        if (!key) return;
        setBusy("Claude is reading your text…");
        const { generateWithClaude } = await loadAi();
        const result = await generateWithClaude(key, { kind: "text", text });
        onCards({ title: result.title || "Pasted notes", source: "Text · AI", cards: result.cards });
        return;
      }
      const cards = parseVocabulary(textToLines(text));
      if (cards.length < 1) throw new Error("Couldn't find “word – meaning” lines. Try AI mode for free-form notes.");
      onCards({ title: "Pasted list", source: "Text", cards });
    });
  }

  return (
    <div className="importer">
      <div className="importer-top">
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === "pdf"} className={tab === "pdf" ? "on" : ""} onClick={() => setTab("pdf")}>
            Upload PDF
          </button>
          <button role="tab" aria-selected={tab === "text"} className={tab === "text" ? "on" : ""} onClick={() => setTab("text")}>
            Paste text
          </button>
        </div>
        <div className="mode-switch" role="radiogroup" aria-label="How to make cards">
          <button role="radio" aria-checked={mode === "auto"} className={mode === "auto" ? "on" : ""} onClick={() => setMode("auto")}>
            Word list
          </button>
          <button role="radio" aria-checked={mode === "ai"} className={mode === "ai" ? "on" : ""} onClick={() => setMode("ai")}>
            ✦ AI · anything
          </button>
        </div>
      </div>

      <p className="mode-hint">
        {mode === "auto"
          ? "Instant and free. Best for vocab lists: one word and its meaning per line or table row."
          : "Claude reads any PDF (notes, chapters, scans) and writes the cards. Uses your Anthropic API key."}
      </p>

      {tab === "pdf" ? (
        <div
          className={`dropzone ${dragging ? "dragging" : ""} ${busy ? "busy" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!busy) handleFile(e.dataTransfer.files[0]);
          }}
          onClick={() => !busy && inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && !busy && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            hidden
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          {busy ? (
            <>
              <div className="spinner" aria-hidden />
              <strong>{busy}</strong>
              <span className="muted">{mode === "ai" ? "Big PDFs can take a minute." : "Almost there."}</span>
            </>
          ) : (
            <>
              <div className="drop-icon" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                  <path d="M14 3v5h5M12 17v-6M9.5 13.5 12 11l2.5 2.5" />
                </svg>
              </div>
              <strong>Drop your PDF here</strong>
              <span className="muted">or click to choose a file</span>
            </>
          )}
        </div>
      ) : (
        <div className="paste">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"abate - to become less intense\nbenevolent - kind and well meaning\ncandid - honest and direct"}
            rows={7}
          />
          <button className="primary-btn" onClick={handleText} disabled={!!busy}>
            {busy ?? "Make flashcards"}
          </button>
        </div>
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
