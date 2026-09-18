import { useState } from "react";

// Gestion des livres suivis : fiche, confidentialité, suppression.
// Un passage est toujours rattaché à un livre ; supprimer un livre supprime
// ses passages (demande de confirmation).

function euros(cents) {
  if (cents == null || cents === "") return "";
  return String(cents / 100);
}

function BookForm({ book, onSave, onCancel }) {
  const [f, setF] = useState({
    title: book.title || "",
    author: book.author || "",
    year: book.year ?? "",
    price: euros(book.price_cents),
    description: book.description || "",
    url: book.url || "",
  });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  function submit(e) {
    e.preventDefault();
    if (!f.title.trim()) return;
    const price = f.price === "" ? null : Math.round(Number(String(f.price).replace(",", ".")) * 100);
    onSave({
      title: f.title,
      author: f.author,
      description: f.description,
      url: f.url,
      year: f.year === "" ? null : Number(f.year),
      price_cents: Number.isFinite(price) ? price : null,
    });
  }

  return (
    <form onSubmit={submit} className="auth-form book-form">
      <label>
        Titre
        <input value={f.title} onChange={set("title")} maxLength={120} required autoFocus />
      </label>
      <label>
        Auteur·ice <small>tel qu'il apparaîtra au catalogue</small>
        <input value={f.author} onChange={set("author")} maxLength={120} placeholder="ton nom ou ton pseudo" />
      </label>
      <div className="book-form-row">
        <label>
          Année
          <input type="number" value={f.year} onChange={set("year")} min="1900" max="2100" placeholder="2026" />
        </label>
        <label>
          Prix public (€)
          <input type="number" value={f.price} onChange={set("price")} min="0" step="0.5" placeholder="15" />
        </label>
      </div>
      <label>
        Description <small>quelques lignes, visibles au catalogue</small>
        <textarea value={f.description} onChange={set("description")} maxLength={600} rows={3} />
      </label>
      <label>
        Lien <small>site, page de l'édition (facultatif)</small>
        <input type="url" value={f.url} onChange={set("url")} maxLength={300} placeholder="https://" />
      </label>
      <div className="books-item-actions">
        <button type="submit" className="primary-button">Enregistrer</button>
        <button type="button" className="plain-button" onClick={onCancel}>Annuler</button>
      </div>
    </form>
  );
}

export default function BooksPanel({ tour, user }) {
  const { books, activeBook, checkins } = tour;
  const [title, setTitle] = useState("");
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  async function add(e) {
    e.preventDefault();
    if (!title.trim()) return;
    await tour.createBook(title);
    setTitle("");
  }

  function stats(bookId) {
    const dernier = {};
    for (const c of checkins) {
      if (c.book_id !== bookId) continue;
      const prev = dernier[c.place_id];
      if (!prev || new Date(c.created_at) > new Date(prev.created_at)) dernier[c.place_id] = c;
    }
    const lieux = Object.keys(dernier).length;
    const depots = Object.values(dernier).filter((c) => c.status === "deposited").length;
    return { lieux, depots };
  }

  return (
    <main className="page-shell" style={{ paddingTop: 0, minHeight: 0 }}>
      <section className="page-card">
        <p className="eyebrow">Mes livres</p>
        <h1>Un parcours par livre.</h1>
        <p>
          Chaque livre a sa propre progression : un même lieu peut avoir pris l'un et refusé l'autre.
          {user
            ? " Tes livres sont enregistrés dans ton compte."
            : " Sans compte, ils restent dans ce navigateur ; ils seront rapatriés dans ton compte à la première connexion."}
        </p>
        <p>
          Dès qu'un passage est noté « Déposé », le livre paraît au catalogue avec les lieux qui le vendent.
          Les refus et les notes prises sur place n'y paraissent jamais.
        </p>

        {books.length === 0 && (
          <p className="form-message">
            Aucun livre pour l'instant : le premier passage noté sur la carte en créera un, ou ajoute-le ici.
          </p>
        )}

        <ul className="books-list">
          {books.map((b) => {
            const s = stats(b.id);
            const discret = b.visible === false;
            return (
              <li key={b.id} className={"books-item" + (activeBook?.id === b.id ? " active" : "")}>
                {editing === b.id ? (
                  <BookForm
                    book={b}
                    onCancel={() => setEditing(null)}
                    onSave={async (patch) => {
                      await tour.updateBook(b.id, patch);
                      setEditing(null);
                    }}
                  />
                ) : (
                  <>
                    <div className="books-item-main">
                      <strong>
                        {b.title}
                        {discret && <span className="book-flag">discret</span>}
                      </strong>
                      {(b.author || b.year) && (
                        <small>
                          {b.author}
                          {b.author && b.year ? " · " : ""}
                          {b.year || ""}
                        </small>
                      )}
                      <small>
                        {s.lieux} lieu{s.lieux > 1 ? "x" : ""} avec un passage
                        {s.depots > 0 ? ` · ${s.depots} en dépôt` : ""}
                        {discret ? " · absent du catalogue" : ""}
                      </small>
                      {b.description && <p className="book-desc">{b.description}</p>}
                    </div>
                    <div className="books-item-actions">
                      {activeBook?.id !== b.id && (
                        <button type="button" className="plain-button" onClick={() => tour.setActiveBookId(b.id)}>
                          Suivre
                        </button>
                      )}
                      <button type="button" className="plain-button" onClick={() => setEditing(b.id)}>
                        Modifier la fiche
                      </button>
                      <button
                        type="button"
                        className="plain-button"
                        onClick={() => tour.updateBook(b.id, { visible: discret })}
                        title={discret
                          ? "Faire paraître ce livre et ses dépôts au catalogue"
                          : "Retirer ce livre du catalogue : personne d'autre ne le verra"}
                      >
                        {discret ? "Publier au catalogue" : "Passer en discret"}
                      </button>
                      {confirmDelete === b.id ? (
                        <>
                          <button
                            type="button"
                            className="plain-button danger"
                            onClick={async () => {
                              await tour.deleteBook(b.id);
                              setConfirmDelete(null);
                            }}
                          >
                            Supprimer définitivement
                          </button>
                          <button type="button" className="plain-button" onClick={() => setConfirmDelete(null)}>
                            Non
                          </button>
                        </>
                      ) : (
                        <button type="button" className="plain-button" onClick={() => setConfirmDelete(b.id)}>
                          Supprimer
                        </button>
                      )}
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>

        <form onSubmit={add} className="auth-form">
          <label>
            Ajouter un livre
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de l'édition" maxLength={120} />
          </label>
          <button type="submit" className="primary-button" disabled={!title.trim()}>Ajouter</button>
        </form>
      </section>
    </main>
  );
}
