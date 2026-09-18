import { useState } from "react";
import { STATUSES, statusInfo } from "../lib/statuses.js";

// Pastille d'état d'un couple livre × lieu + sélecteur de résultat.
// Cliquer la pastille ouvre le sélecteur ; choisir un résultat crée un passage.
export default function StatusPicker({ book, placeId, current, history, onPick, onUndo, compact }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const info = current ? statusInfo(current.status) : null;

  async function pick(statusId) {
    await onPick(book?.id, placeId, statusId, note.trim());
    setNote("");
    setOpen(false);
  }

  return (
    <div className="status-picker">
      <button
        type="button"
        className={"status-chip" + (current ? " has-status" : "") + (open ? " open" : "")}
        style={current ? { background: info.bg, color: info.color, borderColor: info.color } : undefined}
        onClick={() => setOpen((o) => !o)}
        title={book ? `${book.title} — ${current ? info.label : "aucun passage"}` : "Choisir un résultat"}
        aria-expanded={open}
      >
        {!compact && book && <span className="status-chip-book">{book.title}</span>}
        <span className="status-chip-label">{current ? info.short : "Noter un passage"}</span>
      </button>

      {open && (
        <div className="status-menu" role="menu">
          <div className="status-menu-title">
            {book ? book.title : "Livre"} · résultat du passage
          </div>
          <div className="status-menu-grid">
            {STATUSES.map((s) => (
              <button
                key={s.id}
                type="button"
                role="menuitem"
                className={"status-option" + (current?.status === s.id ? " current" : "")}
                style={{ borderColor: s.color, color: s.color, background: s.bg }}
                onClick={() => pick(s.id)}
                title={s.hint}
              >
                {s.label}
              </button>
            ))}
          </div>
          <input
            className="status-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (facultatif) : contact, exemplaires, conditions…"
            maxLength={500}
          />
          <div className="status-menu-footer">
            {current && !current.pending && (
              <button type="button" className="status-link" onClick={() => { onUndo(book.id, placeId); setOpen(false); }}>
                Annuler le dernier passage
              </button>
            )}
            {history && history.length > 0 && (
              <button type="button" className="status-link" onClick={() => setShowHistory((h) => !h)}>
                {showHistory ? "Masquer l'historique" : `Historique (${history.length})`}
              </button>
            )}
            <button type="button" className="status-link" onClick={() => setOpen(false)}>Fermer</button>
          </div>
          {showHistory && history && (
            <ul className="status-history">
              {history.map((h) => {
                const hi = statusInfo(h.status);
                return (
                  <li key={h.id}>
                    <span style={{ color: hi.color }}>{hi.label}</span>
                    <small> · {new Date(h.created_at).toLocaleDateString("fr-FR")}</small>
                    {h.note && <em> — {h.note}</em>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
