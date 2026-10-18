import { useEffect, useState } from "react";
import { getApiKey, setApiKey } from "../lib/storage";

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const [key, setKey] = useState(getApiKey);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="settings-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="settings-title">AI settings</h2>
        <p className="muted">
          AI mode uses Claude to make cards from any PDF: notes, chapters, scanned pages. Paste an Anthropic API key from{" "}
          <a href="https://platform.claude.com/settings/keys" target="_blank" rel="noreferrer">
            platform.claude.com
          </a>
          . It's stored only in this browser and sent only to Anthropic.
        </p>
        <label className="field">
          <span>Anthropic API key</span>
          <input
            type="password"
            value={key}
            placeholder="sk-ant-…"
            onChange={(e) => {
              setKey(e.target.value);
              setSaved(false);
            }}
            autoComplete="off"
          />
        </label>
        <div className="row-actions">
          {key && (
            <button
              className="ghost-btn"
              onClick={() => {
                setKey("");
                setApiKey("");
                setSaved(true);
              }}
            >
              Remove key
            </button>
          )}
          <span className="muted">{saved ? "Saved." : ""}</span>
          <button
            className="primary-btn small"
            onClick={() => {
              setApiKey(key.trim());
              onClose();
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
