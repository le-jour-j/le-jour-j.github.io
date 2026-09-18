import { useEffect, useMemo, useState } from "react";
import { RAW_LOCATIONS } from "../data/locations.js";

const LOCS = Object.fromEntries(RAW_LOCATIONS.map((l) => [l.id, l]));

function prix(cents) {
  if (cents == null) return null;
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: cents % 100 ? 2 : 0 });
}

function BookCard({ book }) {
  const [open, setOpen] = useState(false);
  const villes = useMemo(() => {
    const v = [];
    for (const p of book.places) {
      const c = LOCS[p.placeId]?.city;
      if (c && !v.includes(c)) v.push(c);
    }
    return v;
  }, [book.places]);

  return (
    <article className="cat-book">
      <header className="cat-book-head">
        <div>
          <h2>{book.title}</h2>
          <p className="cat-by">
            {book.author || book.pseudo || "sans nom d'auteur"}
            {book.local ? " · pas encore publié" : ""}
            {book.year ? ` · ${book.year}` : ""}
            {prix(book.priceCents) ? ` · ${prix(book.priceCents)}` : ""}
          </p>
        </div>
        <div className="cat-count">
          <b>{book.places.length}</b>
          <span>point{book.places.length > 1 ? "s" : ""} de vente</span>
        </div>
      </header>

      {book.description && <p className="cat-desc">{book.description}</p>}

      <p className="cat-cities">{villes.slice(0, 8).join(" · ")}{villes.length > 8 ? ` · +${villes.length - 8}` : ""}</p>

      <button type="button" className="cat-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {open ? "Masquer les adresses" : "Où le trouver"}
      </button>

      {open && (
        <ul className="cat-places">
          {book.places.map((p) => {
            const loc = LOCS[p.placeId];
            if (!loc) return null;
            const addr = loc.address && loc.address !== "..." ? loc.address : `${loc.name}, ${loc.city}`;
            return (
              <li key={p.placeId}>
                <a
                  href={"https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(addr)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {loc.name}
                </a>
                <span> · {loc.city}</span>
                {loc.address && loc.address !== "..." && <small>{loc.address}</small>}
              </li>
            );
          })}
        </ul>
      )}

      {book.url && (
        <a className="cat-link" href={book.url} target="_blank" rel="noopener noreferrer">
          En savoir plus sur ce livre ↗
        </a>
      )}
    </article>
  );
}

export default function Catalogue({ catalogue }) {
  const [q, setQ] = useState("");

  // Les dépôts des autres bougent sans qu'on en soit averti : on relit à
  // l'ouverture de l'onglet.
  useEffect(() => { catalogue.refresh(); }, []);
  const books = catalogue.books;

  const filtres = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return books;
    return books.filter((b) => {
      if (b.title.toLowerCase().includes(s)) return true;
      if ((b.author || "").toLowerCase().includes(s)) return true;
      if ((b.pseudo || "").toLowerCase().includes(s)) return true;
      return b.places.some((p) => {
        const l = LOCS[p.placeId];
        return l && (l.name.toLowerCase().includes(s) || l.city.toLowerCase().includes(s));
      });
    });
  }, [books, q]);

  const nbLieux = useMemo(() => new Set(catalogue.rows.map((r) => r.place_id)).size, [catalogue.rows]);

  return (
    <main className="page-shell">
      <section className="page-card">
        <p className="eyebrow">Catalogue</p>
        <h1>Les livres en circulation, et où les trouver.</h1>
        <p>
          Chaque livre déposé par quelqu'un apparaît ici avec les librairies et les lieux qui le vendent
          aujourd'hui. Pas besoin de compte pour consulter.
        </p>

        {books.length > 0 && (
          <p className="cat-stats">
            {books.length} livre{books.length > 1 ? "s" : ""} · {catalogue.rows.length} dépôt
            {catalogue.rows.length > 1 ? "s" : ""} · {nbLieux} lieu{nbLieux > 1 ? "x" : ""}
          </p>
        )}

        {catalogue.state === "loading" && books.length === 0 && (
          <p className="form-message">Chargement du catalogue…</p>
        )}
        {catalogue.state === "error" && (
          <div className="notice-card">
            <strong>Le catalogue public n'est pas joignable pour le moment.</strong>
            <p>
              Ce n'est pas la même chose qu'un catalogue vide : on ne sait juste pas, là, ce que les autres
              ont déposé. La carte, les 467 lieux, les tronçons et les notes de terrain restent consultables
              normalement, eux ne dépendent pas de cette connexion.
              {" "}Si tu as toi-même déposé un livre sans compte, il reste ci-dessous.
            </p>
          </div>
        )}

        {books.length === 0 && catalogue.state !== "loading" && catalogue.state !== "error" && (
          <div className="notice-card">
            <strong>Le catalogue est encore vide.</strong>
            <p>
              Un livre y entre dès qu'un premier passage est noté « Déposé » quelque part, sur l'onglet
              Carte. Il en ressort tout seul si le dépôt est repris.
            </p>
          </div>
        )}

        {books.length > 0 && (
          <div className="cat-search">
            <input
              id="cat-q"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Un titre, un nom, une ville…"
              autoComplete="off"
            />
            {q && (
              <button type="button" onClick={() => setQ("")} aria-label="Effacer la recherche">×</button>
            )}
          </div>
        )}

        <div className="cat-list">
          {filtres.map((b) => <BookCard key={b.id} book={b} />)}
          {books.length > 0 && filtres.length === 0 && (
            <p className="form-message">Rien ne correspond à « {q} ».</p>
          )}
        </div>

        <div className="page-note">
          <p>
            Le catalogue ne montre que les dépôts en cours. Les refus, les lieux fermés et les notes prises
            sur place restent privés, visibles de la seule personne qui les a écrits.
          </p>
          <p>
            Pour qu'un livre n'y figure pas, il suffit de le passer en « discret » dans l'onglet Compte.
          </p>
        </div>
      </section>
    </main>
  );
}
