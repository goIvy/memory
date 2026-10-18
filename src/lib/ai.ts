import Anthropic from "@anthropic-ai/sdk";
import type { DraftCard } from "./types";

const SYSTEM = `You turn study material into flashcards.

If the material is a vocabulary or glossary list, make exactly one card per entry: the word or term on the front and its meaning on the back. Keep the meaning as written in the material (tidy up only formatting) and do not skip entries, even if there are hundreds.

If the material is anything else (notes, a textbook chapter, an article, slides), make cards for the facts, terms, people, dates and ideas a student would need to remember. Fronts are short prompts or questions; backs are concise answers of one or two sentences.

Write cards in the language of the material. Give the deck a short title.`;

const SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    cards: {
      type: "array",
      items: {
        type: "object",
        properties: { front: { type: "string" }, back: { type: "string" } },
        required: ["front", "back"],
        additionalProperties: false,
      },
    },
  },
  required: ["title", "cards"],
  additionalProperties: false,
};

export type AiInput = { kind: "pdf"; base64: string } | { kind: "text"; text: string };

export async function generateWithClaude(apiKey: string, input: AiInput): Promise<{ title: string; cards: DraftCard[] }> {
  // The key stays in this browser and is sent only to Anthropic.
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const material: Anthropic.Beta.BetaContentBlockParam =
    input.kind === "pdf"
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: input.base64 } }
      : { type: "text", text: `<material>\n${input.text}\n</material>` };

  try {
    const stream = client.beta.messages.stream({
      model: "claude-opus-5-5",
      max_tokens: 64000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
      system: SYSTEM,
      messages: [{ role: "user", content: [material, { type: "text", text: "Make flashcards from this material." }] }],
    });
    const message = await stream.finalMessage();

    if (message.stop_reason === "refusal") throw new Error("Claude declined to make cards from this document.");
    if (message.stop_reason === "max_tokens") throw new Error("This document is too long to turn into cards in one go. Try a shorter PDF.");

    const text = message.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    const parsed = JSON.parse(text) as { title: string; cards: DraftCard[] };
    const cards = parsed.cards.filter((c) => c.front?.trim() && c.back?.trim());
    return { title: parsed.title, cards };
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) throw new Error("That API key was rejected. Check it in AI settings.");
    if (error instanceof Anthropic.RateLimitError) throw new Error("Rate limited by the API. Wait a moment and try again.");
    if (error instanceof Anthropic.APIError) throw new Error(`Claude API error (${error.status ?? "network"}): ${error.message}`);
    throw error;
  }
}
