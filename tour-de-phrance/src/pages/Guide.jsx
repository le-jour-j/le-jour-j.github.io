import { DOCUMENTS } from "../data/documents.js";

export default function Guide() {
  return (
    <main className="page-shell">
      <section className="page-card">
        <p className="eyebrow">Documentation</p>
        <h1>Recherches régionales</h1>
        <p>
          Ces documents rassemblent les recherches qui ont servi à construire la cartographie : réseaux de librairies, centres d’art, FRAC, lieux hybrides, logiques de dépôt et contraintes territoriales.
        </p>
        <div className="doc-grid">
          {DOCUMENTS.map((doc) => (
            <a className="doc-card" href={doc.href} target="_blank" rel="noreferrer" key={doc.file}>
              <span>{doc.regionLabel}</span>
              <strong>{doc.title}</strong>
              <small>Ouvrir le PDF</small>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
