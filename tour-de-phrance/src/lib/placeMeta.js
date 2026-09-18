// Étiquettes d'affichage pour les champs de la base des lieux (refonte 2026).

export const TYPE_LABELS = {
  "librairie-generaliste": "librairie",
  "librairie-specialisee": "librairie spécialisée",
  "librairie-centre-art": "centre d'art · boutique",
  "galerie-artist-run": "galerie / collectif",
  "atelier-editeur": "atelier-éditeur",
  "disquaire-librairie": "disquaire-librairie",
  "mediatheque": "médiathèque",
  "musee": "musée",
  "autre": "autre",
};

// Pertinence pour un dépôt de micro-édition.
export const FIT_LABELS = {
  oui: { short: "cible", title: "Diffuse fanzines, micro-édition ou livres d'artiste", color: "#2d7d6a", bg: "#e8f9f4" },
  possible: { short: "à tenter", title: "Librairie indépendante ou lieu d'art avec point de vente", color: "#7b6a2e", bg: "#fbf6e4" },
  non: { short: "hors sujet", title: "Pas de point de vente de livres, ou hors sujet", color: "#8a8f98", bg: "#eceff3" },
};

// État de l'établissement au moment de la vérification web.
export const STATUS_LABELS = {
  active: null, // état normal : rien à afficher
  closed: { short: "fermé", title: "Fermeture constatée sur une source web", color: "#b83232", bg: "#fdecec" },
  doubtful: { short: "à confirmer", title: "Aucune trace récente : appeler ou vérifier avant de faire le détour", color: "#8a6d0b", bg: "#fdf6dc" },
  unverified: { short: "non vérifié", title: "Aucune page web consultée : information d'origine, non confirmée", color: "#5a6270", bg: "#eceff3" },
};

export function typeLabel(t) {
  return TYPE_LABELS[t] || t || "";
}
