// ============================================================
// scripts/prerender.mjs
//
// Écrit un vrai fichier HTML pour chaque route de l'appli, plus le sitemap.
//
// Pourquoi : GitHub Pages n'a pas de réécriture d'URL. /banque-fantome/market
// ne correspondait à aucun fichier, donc Pages répondait le 404.html racine —
// qui relance l'appli. La page s'affichait correctement pour un humain, mais
// le serveur annonçait HTTP 404 et aucun moteur n'indexait. Seule la racine
// de l'appli répondait 200, avec un <div id="root"> vide.
//
// Pourquoi sans navigateur : le build tourne dans GitHub Actions. Lancer un
// Chromium y ajouterait une dépendance et une étape d'installation pour un
// gain faible — les pages de l'appli sont surtout du contenu Supabase, qui
// n'a rien à faire figé dans un fichier versionné (données déposées par les
// comptes, et périmées au premier dépôt suivant). On injecte donc les
// métadonnées, plus le texte fixe de chaque page décrit dans lib/seo.js.
// React remplace ce contenu dès qu'il monte.
//
// Usage :  node scripts/prerender.mjs        (après le build)
// ============================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PAGES, listPrerenderPaths, listSitemapPages, publicUrl, seoForPath, SITE_NAME } from "../src/lib/seo.js";

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(RACINE, "dist");

const echapper = (s = "") => s
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

const gabarit = fs.readFileSync(path.join(DIST, "index.html"), "utf8");

if (!gabarit.includes('<div id="root">')) {
  console.error('dist/index.html ne contient pas <div id="root"> : gabarit inattendu, rien écrit.');
  process.exit(1);
}

// ------------------------------------------------------------
// L'instantané de départ (2026-11-18).
//
// La base gratuite cale par moments 2 à 6 s, et l'accueil restait vide en attendant. On relève
// donc ici, à chaque construction du site, les contenus publics de l'accueil, et on les pose dans
// chaque page (window.__BF_DEPART__). L'appli les affiche tout de suite, puis les remplace quand
// la base répond (src/lib/memoire.js). Les clés et les demandes sont celles des composants :
// si l'une change là-bas, la changer ici.
//
// Rien de ceci ne doit faire échouer la construction : une demande qui rate ou qui traîne est
// laissée de côté, et sans clé de base (construction locale sans .env) il n'y a pas d'instantané.
// On ne relève que ce que l'accueil montre déjà à tout le monde, avec la clé publique.
// ------------------------------------------------------------
function reglagesBase() {
  let url = process.env.VITE_SUPABASE_URL;
  let cle = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !cle) {
    try {
      for (const ligne of fs.readFileSync(path.join(RACINE, ".env"), "utf8").split(/\r?\n/)) {
        const m = /^\s*(VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY)\s*=\s*"?([^"\s]+)"?\s*$/.exec(ligne);
        if (m && m[1] === "VITE_SUPABASE_URL") url = url || m[2];
        if (m && m[1] === "VITE_SUPABASE_ANON_KEY") cle = cle || m[2];
      }
    } catch { /* pas de .env : pas d'instantané */ }
  }
  return url && cle ? { url: url.replace(/\/+$/, ""), cle } : null;
}

async function instantane() {
  const base = reglagesBase();
  if (!base) { console.log("  (pas d'instantané de départ : pas de clé de base)"); return null; }
  const entetes = { apikey: base.cle, Authorization: `Bearer ${base.cle}` };
  const demander = async (chemin, options = {}) => {
    const r = await fetch(`${base.url}/rest/v1/${chemin}`, {
      ...options,
      headers: { ...entetes, ...(options.headers || {}) },
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r;
  };
  const lire = async (chemin) => (await demander(chemin)).json();
  const rpc = async (nom, corps = {}) => (await demander(`rpc/${nom}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps),
  })).json();
  const demandes = {
    "journal": () => rpc("journal_banque", { p_limit: 20 }),
    "cours": () => rpc("cours_devises"),
    "billets-8": () => lire("billets_emis?select=*&order=created_at.desc&limit=8"),
    "accueil-recent": () => lire("objets?select=*&statut=neq.retir%C3%A9&order=created_at.desc&limit=3"),
    "accueil-total": async () => {
      const r = await demander("objets?select=id&statut=eq.disponible", { method: "HEAD", headers: { Prefer: "count=exact" } });
      const n = Number((r.headers.get("content-range") || "").split("/")[1]);
      if (!Number.isFinite(n)) throw new Error("compte illisible");
      return n;
    },
    "accueil-stats": () => rpc("stats_banque"),
    "actus-3": async () => (await lire("actus?select=*&order=date_actu.desc,created_at.desc,id&limit=3")).filter((a) => a.publie !== false),
    "presences": () => lire(`presences?select=agence,debut,fin&fin=gte.${encodeURIComponent(new Date().toISOString())}&order=debut&limit=40`),
  };
  const v = {};
  for (const [cle, relever] of Object.entries(demandes)) {
    try {
      const valeur = await relever();
      if (valeur != null) v[cle] = valeur;
    } catch (e) {
      console.log(`  (instantané : « ${cle} » laissé de côté, ${e.message})`);
    }
  }
  return Object.keys(v).length ? { t: Date.now(), v } : null;
}

let baliseDepart = "";
try {
  const depart = await instantane();
  if (depart) {
    // « < » échappé : un texte déposé par un compte ne peut pas refermer la balise
    const json = JSON.stringify(depart).replace(/</g, "\\u003c");
    baliseDepart = `<script>window.__BF_DEPART__=${json}</script>`;
    console.log(`  instantané de départ : ${Object.keys(depart.v).join(", ")} (${Math.round(baliseDepart.length / 1024)} Ko)`);
  }
} catch (e) {
  console.log(`  (pas d'instantané de départ : ${e.message})`);
}

function baliser(seo) {
  const m = [
    `<title>${echapper(seo.title)}</title>`,
    `<meta name="description" content="${echapper(seo.description)}">`,
    `<link rel="canonical" href="${seo.canonical}">`,
    `<meta name="robots" content="${seo.noindex ? "noindex, nofollow" : "index, follow"}">`,
    `<meta property="og:title" content="${echapper(seo.title)}">`,
    `<meta property="og:description" content="${echapper(seo.description)}">`,
    `<meta property="og:url" content="${seo.canonical}">`,
    `<meta property="og:image" content="${seo.image}">`,
    `<meta property="og:site_name" content="${echapper(SITE_NAME)}">`,
    `<meta property="og:type" content="website">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${echapper(seo.title)}">`,
    `<meta name="twitter:description" content="${echapper(seo.description)}">`,
    `<meta name="twitter:image" content="${seo.image}">`,
  ];
  return m.join("\n    ");
}

function pageHtml(route) {
  const seo = seoForPath(route);
  let html = gabarit;

  // Le gabarit porte déjà un <title> et une description : on les retire pour
  // ne pas en avoir deux, puis on pose ceux de la route.
  html = html.replace(/\s*<title>[\s\S]*?<\/title>/i, "");
  html = html.replace(/\s*<meta\s+name="description"[^>]*>/i, "");
  html = html.replace("</head>", `  ${baliser(seo)}\n  </head>`);
  // L'instantané de départ, avant le script de l'appli (par une fonction : le JSON peut contenir « $ »)
  if (baliseDepart) html = html.replace("</head>", () => `  ${baliseDepart}\n  </head>`);

  if (seo.contenu) {
    // Enveloppé dans .prerendu : visible sans JavaScript (robots, lecteurs), caché sinon
    // pour ne pas montrer une page nue avant que React la remplace (index.html, html.js).
    html = html.replace('<div id="root">', `<div id="root"><div class="prerendu">${seo.contenu}</div>`);
  }
  return html;
}

let ecrites = 0;
for (const route of listPrerenderPaths()) {
  const dossier = route === "/" ? DIST : path.join(DIST, route);
  fs.mkdirSync(dossier, { recursive: true });
  fs.writeFileSync(path.join(dossier, "index.html"), pageHtml(route), "utf8");
  const seo = seoForPath(route);
  console.log(`  ${seo.noindex ? "~ " : "ok"} ${route.padEnd(12)} ${seo.title.slice(0, 58)}`);
  ecrites++;
}

// Sitemap propre à l'appli. Le robots.txt racine le déclare en plus du sien :
// un domaine peut annoncer plusieurs sitemaps, et chaque appli garde ainsi la
// liste de ses propres URL.
const aujourdhui = new Date().toISOString().slice(0, 10);
const urls = listSitemapPages().map((p) => [
  "  <url>",
  `    <loc>${publicUrl(p.path)}</loc>`,
  `    <lastmod>${aujourdhui}</lastmod>`,
  `    <priority>${p.priority || "0.5"}</priority>`,
  "  </url>",
].join("\n"));

fs.writeFileSync(
  path.join(DIST, "sitemap.xml"),
  ['<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls, "</urlset>", ""].join("\n"),
  "utf8",
);

console.log(`\n${ecrites} pages écrites, dont ${listSitemapPages().length} dans sitemap.xml (${PAGES.length - listSitemapPages().length} en noindex).`);
