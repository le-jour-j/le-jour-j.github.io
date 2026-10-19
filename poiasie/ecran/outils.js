"use strict";
/* ================================================================ outils */

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const lisse = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const sortie3 = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const hasard = (a, b) => a + Math.random() * (b - a);
const tirer = liste => liste[Math.floor(Math.random() * liste.length)];
function bruit(x) { return Math.sin(x) * 0.5 + Math.sin(x * 2.37 + 1.3) * 0.3 + Math.sin(x * 5.11 + 2.1) * 0.2; }
function sansAccents(s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, ""); }
function palette() {
  if (S.palette === "perso") {
    // ma palette : les cinq couleurs choisies dans l'onglet Couleurs
    const P = PALETTES.perso, cle = S.persoFond + S.persoFond2 + S.persoTexte + S.persoAccent + S.persoNote;
    if (P.cle !== cle) {
      P.cle = cle; P.fond = [S.persoFond, S.persoFond2]; P.texte = S.persoTexte; P.accent = S.persoAccent; P.note = S.persoNote;
      const [r, g, b] = rgbDe(S.persoFond2);
      P.clair = 0.299 * r + 0.587 * g + 0.114 * b > 0.55;
    }
    return P;
  }
  return PALETTES[S.palette] || PALETTES.nuit;
}
function casse(t) { return S.casse === "majuscules" ? t.toUpperCase() : S.casse === "minuscules" ? t.toLowerCase() : t; }
// La tenue se compte en vraies secondes : la vitesse generale ralentit les gestes, pas la
// lecture. (Avant le 2026-10-16, tenue 56 et vitesse 0.55 gardaient un poeme deux minutes.)
// Plancher : un poeme reste au moins le temps de lire chacun de ses vers (1,2 s par vers).
// Avec la tenue a 5 s, le 2026-10-16, les poemes repartaient trois secondes apres etre ecrits.
let tenueMin = 0;
function tenue() { return Math.max(S.tenue, tenueMin) * S.vitesse; }
function police(taille, italique) { return (italique ? "italic " : "") + Math.max(4, taille).toFixed(1) + "px \"" + S.police + "\", Georgia, serif"; }

const toile = document.getElementById("toile");
// la toile principale est opaque (le fond la couvre toujours) : Chrome la compose sans melange et
// l'envoie a la carte graphique sans conversion (audit du 2026-10-18)
let ctx = toile.getContext("2d", { alpha: false });  // change le temps de dessiner le calque (avecCalque)
let W = 0, H = 0, DPR = 1;
const mesures = new Map();
function mesurer(texte, pol) {
  const k = pol + "|" + texte;
  let w = mesures.get(k);
  if (w === undefined) {
    ctx.font = pol;
    w = ctx.measureText(texte).width;
    if (mesures.size > 30000) mesures.clear();
    mesures.set(k, w);
  }
  return w;
}
function appliquerEspacement() {
  if ("letterSpacing" in ctx) ctx.letterSpacing = S.espacement + "px";
  if (calque.g && "letterSpacing" in calque.g) calque.g.letterSpacing = S.espacement + "px";
}

