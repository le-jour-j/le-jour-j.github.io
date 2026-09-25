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

  if (seo.contenu) {
    html = html.replace('<div id="root">', `<div id="root">${seo.contenu}`);
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
