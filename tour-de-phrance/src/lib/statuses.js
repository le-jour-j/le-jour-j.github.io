// Résultats possibles d'un passage (livre × lieu).
// L'ordre est celui d'affichage dans le sélecteur.
export const STATUSES = [
  { id: "deposited", label: "Déposé", short: "Déposé", hint: "Le livre est en dépôt ou en vente ici", color: "#2d7d6a", bg: "#e8f9f4" },
  { id: "refused", label: "Refusé", short: "Refusé", hint: "Le lieu n'a pas voulu le prendre", color: "#b83232", bg: "#fdecec" },
  { id: "not_taking", label: "Ne prend pas ce type d'objet", short: "Ne prend pas", hint: "Pas de fanzines / livres d'artiste ici", color: "#7b4a1e", bg: "#fbeee0" },
  { id: "closed", label: "Fermé ce jour-là", short: "Fermé", hint: "Porte close, à retenter", color: "#5a6270", bg: "#eceff3" },
  { id: "follow_up", label: "À relancer", short: "À relancer", hint: "Intérêt, mais à confirmer plus tard", color: "#8a6d0b", bg: "#fdf6dc" },
  { id: "visited", label: "Passé, sans précision", short: "Passé", hint: "Juste noter que le livre est passé par là", color: "#4a5568", bg: "#e6ebf2" },
];

export const STATUS_BY_ID = Object.fromEntries(STATUSES.map((s) => [s.id, s]));

export function statusInfo(id) {
  return STATUS_BY_ID[id] || STATUS_BY_ID.visited;
}

export const DEFAULT_BOOK_TITLE = "Mon édition";
