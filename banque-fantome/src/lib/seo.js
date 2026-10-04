// ============================================================
// src/lib/seo.js
// Métadonnées de référencement de Banque Fantôme.
//
// Deux consommateurs, une seule table :
//   - App.jsx appelle applySeo() à chaque navigation ;
//   - scripts/prerender.mjs fabrique un fichier HTML par route et le
//     sitemap à partir des mêmes entrées.
//
// Pourquoi ces pages n'étaient pas référencées : GitHub Pages n'a pas de
// réécriture d'URL, donc /banque-fantome/market ne correspondait à aucun
// fichier et répondait HTTP 404 (le 404.html racine relance l'appli, d'où
// une page correcte pour un humain et une erreur pour un robot). Seule
// /banque-fantome/ répondait 200, avec un <div id="root"> vide.
// ============================================================

export const BASE_URL = "https://jeansonpechin.com/banque-fantome";
export const SITE_NAME = "Banque Fantôme";
export const DEFAULT_IMAGE = BASE_URL + "/icons/icon-512.png";

// `contenu` est le HTML écrit dans #root par le prérendu. React le remplace
// dès qu'il monte : il ne sert qu'aux robots et aux navigateurs sans JS,
// et reprend le texte réellement affiché par la page.
export const PAGES = [
  {
    path: "/",
    title: "Banque Fantôme — fabriquez votre monnaie, faites circuler vos objets",
    description:
      "Institution de circulation : ouvrez un compte, dessinez et imprimez vos propres billets, puis enchérissez sur des objets, des œuvres et des services. La valeur ne préexiste pas : elle se dessine.",
    priority: "0.9",
    contenu: `
      <h1>Banque Fantôme</h1>
      <p>Institution de circulation. La valeur ne préexiste pas : elle se dessine.</p>
      <h2>Ouvrir un compte</h2>
      <p>Chacun peut entrer dans la banque avec un pseudo et devenir opérateur temporaire du dispositif.</p>
      <h2>Fabriquer son argent</h2>
      <p>Imprimez les planches pour jouer sur papier, ou dessinez un billet original et déposez-le au guichet : la banque le crédite sur votre compte.</p>
      <h2>Enchérir dans le market</h2>
      <p>Les dépôts sont mis aux enchères : objets, œuvres ou services. Le plus offrant l'emporte, la banque prélève sa commission et s'enrichit.</p>`,
  },
  {
    path: "/market",
    title: "Market — enchères d'objets, d'œuvres et de services | Banque Fantôme",
    description:
      "Le market de la Banque Fantôme : objets, œuvres et services déposés par les comptes et mis aux enchères, payables en billets fabriqués à la main.",
    priority: "0.8",
    contenu: `
      <h1>Market</h1>
      <p>Les objets, œuvres et services déposés par les comptes de la Banque Fantôme, mis aux enchères.</p>
      <p>Chaque dépôt part d'une mise de départ, pour une durée d'un, trois ou sept jours, avec un achat immédiat facultatif. On enchérit avec les billets originaux qu'on a soi-même dessinés et fait créditer au guichet. À la clôture, la banque prélève sa commission.</p>`,
  },
  {
    path: "/senrichir",
    title: "S'enrichir — planches de billets à imprimer | Banque Fantôme",
    description:
      "Planches A4 de billets dessinés, de 5 à 500 €, à télécharger, imprimer et découper pour jouer sur papier. Billets émis et cours des devises.",
    priority: "0.7",
    contenu: `
      <h1>S'enrichir</h1>
      <p>Fabriquez votre monnaie : téléchargez une planche, imprimez-la, découpez vos billets et jouez avec, en vrai papier.</p>
      <h2>Planches à imprimer</h2>
      <p>Des planches A4 de billets dessinés, de 5 à 500 €, à télécharger en PDF, imprimer, découper et faire créditer.</p>
      <h2>Cours des devises</h2>
      <p>Le cours des monnaies fabriquées par les comptes de la banque.</p>`,
  },

  {
    path: "/actu",
    title: "Le fil de la banque — expositions, ateliers, billets | Banque Fantôme",
    description:
      "Le journal du projet Banque Fantôme : expositions, ateliers, billets dessinés et installations, au fur et à mesure.",
    priority: "0.7",
    contenu: `
      <h1>Le fil de la banque</h1>
      <p>Expositions, ateliers, billets, installations : ce qui arrive à la Banque Fantôme, au fur et à mesure.</p>`,
  },

  {
    path: "/participer",
    title: "Participer — déposer un billet original ou un objet | Banque Fantôme",
    description:
      "Alimenter la Banque Fantôme : déposer au guichet un billet original dessiné à la main, crédité sur votre compte, ou mettre aux enchères un objet, une œuvre ou un service.",
    priority: "0.7",
    contenu: `
      <h1>Participer</h1>
      <h2>Déposer un billet original</h2>
      <p>Photographiez un billet dessiné à la main, donnez-lui un titre, une devise et une dénomination : la banque le crédite sur votre compte.</p>
      <h2>Mettre en vente au market</h2>
      <p>Un objet, une œuvre ou un service, mis aux enchères pour un, trois ou sept jours.</p>`,
  },

  // Pages de compte : servies normalement, tenues hors de l'index. /deposer
  // affiche « Accès refusé » sans compte, les trois autres sont privées ou
  // sans contenu propre.
  { path: "/deposer", title: "Déposer dans le market | Banque Fantôme", description: "Mettre un objet, une œuvre ou un service aux enchères. Réservé aux comptes.", noindex: true },
  { path: "/connexion", title: "Connexion | Banque Fantôme", description: "Ouvrir un compte ou se connecter à la Banque Fantôme.", noindex: true },
  { path: "/compte", title: "Mon compte | Banque Fantôme", description: "Solde, billets émis et ventes en cours.", noindex: true },
  { path: "/messages", title: "Messages | Banque Fantôme", description: "Messagerie entre comptes.", noindex: true },
  { path: "/admin", title: "Admin | Banque Fantôme", description: "Espace du banquier.", noindex: true },
  { path: "/lettre", title: "La lettre de la banque | Banque Fantôme", description: "Se désinscrire de la lettre de la Banque Fantôme.", noindex: true },
];

const PAR_PATH = new Map(PAGES.map((p) => [p.path, p]));

const normalize = (path = "/") => (path.replace(/\/+$/, "") || "/");

/**
 * URL publique d'une route. Le prérendu écrit `market/index.html` et
 * GitHub Pages redirige `/market` (301) vers `/market/` : la forme servie
 * porte la barre finale, c'est donc elle qu'on déclare en canonical.
 */
export const publicUrl = (path = "/") => {
  const p = normalize(path);
  return BASE_URL + (p === "/" ? "/" : p + "/");
};

export const seoForPath = (path = "/") => {
  const page = PAR_PATH.get(normalize(path)) || PAR_PATH.get("/");
  return { ...page, image: page.image || DEFAULT_IMAGE, canonical: publicUrl(page.path) };
};

/** Les routes à prérendre : toutes, y compris les privées, pour qu'aucune
 *  URL de l'appli ne réponde 404. Les privées portent un noindex. */
export const listPrerenderPaths = () => PAGES.map((p) => p.path);

/** Les routes du sitemap : uniquement les publiques. */
export const listSitemapPages = () => PAGES.filter((p) => !p.noindex);

// ── Application au DOM ───────────────────────────────────────

const setMeta = (selector, attrs) => {
  if (typeof document === "undefined") return;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement(attrs.tag || "meta");
    document.head.appendChild(el);
  }
  for (const [k, v] of Object.entries(attrs)) {
    if (k !== "tag") el.setAttribute(k, v);
  }
};

export const applySeo = (path = "/") => {
  if (typeof document === "undefined") return;
  const seo = seoForPath(path);

  document.title = seo.title;
  setMeta('meta[name="description"]', { tag: "meta", name: "description", content: seo.description });
  setMeta('link[rel="canonical"]', { tag: "link", rel: "canonical", href: seo.canonical });

  setMeta('meta[property="og:title"]', { tag: "meta", property: "og:title", content: seo.title });
  setMeta('meta[property="og:description"]', { tag: "meta", property: "og:description", content: seo.description });
  setMeta('meta[property="og:url"]', { tag: "meta", property: "og:url", content: seo.canonical });
  setMeta('meta[property="og:image"]', { tag: "meta", property: "og:image", content: seo.image });
  setMeta('meta[property="og:site_name"]', { tag: "meta", property: "og:site_name", content: SITE_NAME });
  setMeta('meta[property="og:type"]', { tag: "meta", property: "og:type", content: "website" });

  setMeta('meta[name="twitter:card"]', { tag: "meta", name: "twitter:card", content: "summary_large_image" });
  setMeta('meta[name="twitter:title"]', { tag: "meta", name: "twitter:title", content: seo.title });
  setMeta('meta[name="twitter:description"]', { tag: "meta", name: "twitter:description", content: seo.description });
  setMeta('meta[name="twitter:image"]', { tag: "meta", name: "twitter:image", content: seo.image });

  setMeta('meta[name="robots"]', { tag: "meta", name: "robots", content: seo.noindex ? "noindex, nofollow" : "index, follow" });
};
