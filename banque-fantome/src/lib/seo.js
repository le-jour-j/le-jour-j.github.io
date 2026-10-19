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
    title: "Banque Fantôme : dessinez votre monnaie, faites-la circuler",
    description:
      "Institution de circulation : ouvrez un compte, dessinez vos propres billets sur le site, créez des œuvres dans ses ateliers et échangez-les : billets à la bourse ; œuvres, objets des joueurs et de la banque au market. La valeur ne préexiste pas : elle se dessine.",
    priority: "0.9",
    contenu: `
      <h1>Banque Fantôme</h1>
      <p>Institution de circulation. La valeur ne préexiste pas : elle se dessine.</p>
      <h2>Ouvrir un compte</h2>
      <p>Chacun peut entrer dans la banque avec un pseudo et devenir opérateur temporaire du dispositif.</p>
      <h2>Créer</h2>
      <p>Dans les ateliers, dessinez sur un billet de la banque : encaissé, il crédite votre compte de sa valeur. Ou faites une œuvre : peinture, poème, photo retouchée, collage.</p>
      <h2>Échanger</h2>
      <p>Avec l'argent du site, achetez les billets des autres à la bourse et les œuvres au market. Au market encore, le bon coin des joueurs et ce que vend la banque, en billets papier, réglés en main propre.</p>`,
  },
  {
    path: "/creer",
    title: "Créer : les ateliers de la banque | Banque Fantôme",
    description:
      "Les ateliers de la Banque Fantôme : dessiner un billet, peindre, écrire un poème, retoucher sa photo, faire un collage. Chaque œuvre rejoint votre collection et se vend au market.",
    priority: "0.8",
    contenu: `
      <h1>Créer</h1>
      <p>Les ateliers de la banque, ouverts à tous, dans le navigateur.</p>
      <h2>Le billet</h2>
      <p>Dessinez sur un billet habillé par la banque : encaissé, il crédite votre compte ; vendu, il circule à la bourse.</p>
      <h2>Les œuvres</h2>
      <p>Paint, poésie, image retouchée, collage : chaque œuvre est unique, rejoint votre collection et se vend au market, en argent du site. Chaque atelier présente une pratique d'artiste.</p>`,
  },
  {
    path: "/market",
    title: "Market : E-market, bon coin et ce que vend la banque | Banque Fantôme",
    description:
      "Le market de la Banque Fantôme : les œuvres des ateliers du site en argent du site (E-market), les objets réels des joueurs (le bon coin) et ceux de la banque, en billets papier.",
    priority: "0.8",
    contenu: `
      <h1>Market</h1>
      <h2>L'E-market</h2>
      <p>Les œuvres faites dans les ateliers de la banque : peintures, poèmes, images retouchées, collages. Chacune est unique.</p>
      <p>On les achète aux enchères avec l'argent du site, celui qu'on gagne en dessinant des billets. Achetée, l'œuvre rejoint la collection de l'acheteur, qui la télécharge en haute définition, la garde ou la revend.</p>
      <h2>Le bon coin</h2>
      <p>Les objets réels des joueurs, aux enchères en billets papier : vendeur et acheteur s'arrangent entre eux pour la remise.</p>
      <h2>La banque vend</h2>
      <p>Les objets, œuvres physiques et services que la banque met en vente, à venir chercher à la banque. On y enchérit en billets papier ; le gagnant paie à la remise, ou avec l'argent de son compte.</p>`,
  },
  {
    path: "/bourse",
    title: "Bourse aux billets : dessiner, encaisser, échanger | Banque Fantôme",
    description:
      "L'atelier et la bourse de la Banque Fantôme : dessinez un billet sur le site, encaissez-le pour créditer votre compte ou vendez-le aux enchères aux autres comptes.",
    priority: "0.8",
    contenu: `
      <h1>Bourse aux billets</h1>
      <p>Ici, l'argent se dessine. Dans l'atelier, on dessine sur un billet habillé par la banque : cadre, guillochis, montant et numéro de série.</p>
      <h2>Encaisser ou vendre</h2>
      <p>Un billet terminé s'encaisse (la banque le garde et crédite le compte de sa valeur) ou se vend aux enchères aux autres comptes, qui paient avec les billets qu'ils ont encaissés.</p>
      <h2>Collectionner</h2>
      <p>Un billet acheté rejoint la collection de l'acheteur, qui peut le garder ou le revendre. Chaque vente reste inscrite au registre.</p>
      <h2>Le coffre de la banque</h2>
      <p>Les billets encaissés ne circulent plus : la banque les garde dans son coffre, visible de tous.</p>`,
  },
  {
    path: "/senrichir",
    title: "S'enrichir : planches de billets à imprimer | Banque Fantôme",
    description:
      "834 planches A4 de billets dessinés en atelier, de 5 à 500 €, et chaque billet dessiné dans l'atelier, à taille réelle : à télécharger, imprimer et découper pour jouer sur papier.",
    priority: "0.7",
    contenu: `
      <h1>S'enrichir</h1>
      <p>Fabriquez votre monnaie : téléchargez une planche, imprimez-la, découpez vos billets et jouez avec, en vrai papier.</p>
      <h2>Planches à imprimer</h2>
      <p>834 planches A4 de billets dessinés en atelier, de 5 à 500 € : chaque planche reprend un seul dessin, à taille réelle, avec traits de coupe. À télécharger en PDF, imprimer et découper.</p>
      <h2>Cours des devises</h2>
      <p>Le cours des monnaies fabriquées par les comptes de la banque.</p>`,
  },

  {
    path: "/actu",
    title: "Le fil de la banque : expositions, ateliers, billets | Banque Fantôme",
    description:
      "Le journal du projet Banque Fantôme : expositions, ateliers, billets dessinés et installations, au fur et à mesure.",
    priority: "0.7",
    contenu: `
      <h1>Le fil de la banque</h1>
      <p>Expositions, ateliers, billets, installations : ce qui arrive à la Banque Fantôme, au fur et à mesure.</p>`,
  },

  {
    path: "/info",
    title: "Infos pratiques : agences et permanences du banquier | Banque Fantôme",
    description:
      "Où trouver la Banque Fantôme à Beauvais : l'agence du Quadrilatère, l'agence à venir de la médiathèque Centre ville, leurs horaires et les permanences du banquier.",
    priority: "0.6",
    contenu: `
      <h1>Infos pratiques</h1>
      <h2>Le banquier est-il au guichet ?</h2>
      <p>Les permanences du banquier, tirées de son agenda et mises à jour toutes les quinze minutes.</p>
      <h2>Les agences</h2>
      <p>Agence actuelle : Le Quadrilatère, 22 rue Saint-Pierre, 60000 Beauvais. Mardi au vendredi de 12 h à 18 h, samedi et dimanche de 10 h à 18 h, fermé le lundi.</p>
      <p>Agence à venir : Médiathèque Centre ville, 3 cour des Lettres, 60000 Beauvais. Mardi, jeudi et vendredi de 13 h à 18 h 30, mercredi de 9 h 30 à 18 h 30, samedi de 9 h 30 à 18 h, fermé le lundi.</p>`,
  },

  // Pages de compte : servies normalement, tenues hors de l'index. /participer
  // n'est plus qu'un renvoi vers l'atelier de la bourse (2026-10-18), gardé pour
  // que les anciens liens ne répondent pas 404.
  { path: "/participer", title: "Créer | Banque Fantôme", description: "L'atelier de la Banque Fantôme : dessiner un billet.", noindex: true },
  { path: "/collection", title: "Ma collection | Banque Fantôme", description: "Vos billets et vos œuvres.", noindex: true },
  // Le supermarket est devenu le rayon « La banque vend » du market (2026-10-19) : l'adresse y renvoie.
  { path: "/supermarket", title: "La banque vend | Banque Fantôme", description: "Ce que vend la banque est un rayon du market.", noindex: true },
  { path: "/deposer", title: "Annonce au bon coin | Banque Fantôme", description: "Mettre un objet réel en vente au bon coin du market, en billets papier.", noindex: true },
  { path: "/connexion", title: "Connexion | Banque Fantôme", description: "Ouvrir un compte ou se connecter à la Banque Fantôme.", noindex: true },
  { path: "/compte", title: "Mon compte | Banque Fantôme", description: "Solde, billets encaissés et ventes en cours.", noindex: true },
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
