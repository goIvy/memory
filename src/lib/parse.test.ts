import { describe, expect, it } from "vitest";
import { parseVocabulary, textToLines } from "./parse";

describe("parseVocabulary", () => {
  it("reads dash-separated lists with numbering", () => {
    const cards = parseVocabulary(
      textToLines(`Unit 4 Vocabulary
1. abate - to become less intense
2. benevolent - well meaning and kindly
3. candid - truthful and straightforward`),
    );
    expect(cards).toEqual([
      { front: "abate", back: "to become less intense" },
      { front: "benevolent", back: "well meaning and kindly" },
      { front: "candid", back: "truthful and straightforward" },
    ]);
  });

  it("keeps colons inside definitions when dashes are the separator", () => {
    const cards = parseVocabulary(
      textToLines(`ephemeral — lasting a very short time: e.g. a mayfly
gregarious — fond of company`),
    );
    expect(cards[0]).toEqual({ front: "ephemeral", back: "lasting a very short time: e.g. a mayfly" });
    expect(cards).toHaveLength(2);
  });

  it("reads table columns (tabs) and joins wrapped definitions", () => {
    const cards = parseVocabulary(["Word\tMeaning", "lucid\tclear and easy to", "understand", "page 2", "zeal\tgreat energy"]);
    expect(cards).toContainEqual({ front: "lucid", back: "clear and easy to understand" });
    expect(cards).toEqual([
      { front: "lucid", back: "clear and easy to understand" },
      { front: "zeal", back: "great energy" },
    ]);
  });

  it("reads part-of-speech style entries", () => {
    const cards = parseVocabulary(["obstinate (adj.) stubbornly refusing to change", "placate (v.) to make less angry"]);
    expect(cards).toEqual([
      { front: "obstinate", back: "(adj.) stubbornly refusing to change" },
      { front: "placate", back: "(v.) to make less angry" },
    ]);
  });

  it("reads colon lists and merges duplicates", () => {
    const cards = parseVocabulary(["• hola: hello", "• adiós: goodbye", "• hola: hi"]);
    expect(cards).toEqual([
      { front: "hola", back: "hello; hi" },
      { front: "adiós", back: "goodbye" },
    ]);
  });

  it("returns nothing for plain prose", () => {
    expect(parseVocabulary(["The mitochondria is the powerhouse of the cell and it makes energy."])).toEqual([]);
  });
});
