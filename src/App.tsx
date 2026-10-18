import { useEffect, useState } from "react";
import { useDecks } from "./lib/storage";
import Home from "./components/Home";
import DeckPage from "./components/DeckPage";
import Flashcards from "./components/Flashcards";
import Quiz from "./components/Quiz";
import TypeIt from "./components/TypeIt";
import SettingsModal from "./components/SettingsModal";
import { parseHash, type Route } from "./lib/router";

export default function App() {
  const [route, setRoute] = useState<Route>(parseHash);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { decks, saveDeck, deleteDeck } = useDecks();

  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const deck = route.name !== "home" ? decks.find((d) => d.id === route.id) : undefined;

  let page;
  if (route.name === "home" || !deck) {
    page = <Home decks={decks} saveDeck={saveDeck} openSettings={() => setSettingsOpen(true)} />;
  } else if (route.name === "deck") {
    page = <DeckPage deck={deck} saveDeck={saveDeck} deleteDeck={deleteDeck} />;
  } else if (route.mode === "flip") {
    page = <Flashcards deck={deck} saveDeck={saveDeck} />;
  } else if (route.mode === "quiz") {
    page = <Quiz deck={deck} saveDeck={saveDeck} />;
  } else {
    page = <TypeIt deck={deck} saveDeck={saveDeck} />;
  }

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#/">
          <span className="brand-mark" aria-hidden>
            <span />
            <span />
          </span>
          Memory
        </a>
        <nav className="topnav">
          <a href="#/">My decks</a>
          <button className="ghost-btn" onClick={() => setSettingsOpen(true)}>
            AI settings
          </button>
        </nav>
      </header>
      <main>{page}</main>
      <footer className="footer">Your decks are saved in this browser.</footer>
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
