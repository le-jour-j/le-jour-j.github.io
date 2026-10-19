"use strict";
/* ================================================================ poesie visuelle : les outils */

// Les scenes ou le texte fait l'image bougent des centaines de lettres : chacune est une
// vignette deja peinte (dans l'atlas, voir vignettes.js), on ne fait que la poser, tournee et a
// l'echelle. Laisse la transformation derriere elle : l'appelant fait ctx.save() / ctx.restore().
// net (ajoute le 2026-10-18) : la lettre garde sa taille (averse, cretes, coup de des...), sa
// vignette est peinte a cette taille exacte, sans reduction, donc nette ; la respiration et le
// battement la font seulement varier autour.
function poserLettre(t, taille, couleur, x, y, ang, alpha, graine, cours, italique, net) {
  if (alpha <= 0.004 || taille < 1) return;
  if (S.tremblement > 0 && graine !== undefined) {
    const A = S.tremblement * 0.3 * (S.tremblementValeur && cours !== undefined ? 0.25 + 1.6 * (1 - cours / 100) : 1), fq = S.frequence * 6;
    x += A * bruit(temps * fq + graine); y += A * bruit(temps * fq + graine * 1.7 + 30);
  }
  const base = taille;
  if (S.respiration && graine !== undefined) taille *= 1 + S.respiration * 0.05 * Math.sin(temps * 1.3 + graine);
  taille *= battementMots(0.16);
  // une lettre de quelques pixels s'efface doucement au lieu de gresiller (reduite d'une vignette
  // plus grande, elle scintillait en bougeant)
  if (taille < 4) { alpha *= (taille - 1) / 3; if (alpha <= 0.004) return; }
  // une lettre nette tres gonflee (battement, cables) reprend son palier : agrandie, elle serait floue
  if (net && (taille > base * 1.25 || taille < base * 0.7)) net = false;
  const v = vignetteLettre(t, net ? base : taille, couleur, italique, net);
  const s = v ? taille / v.fs : 1;
  const c = Math.cos(ang || 0) * s * DPR, sn = Math.sin(ang || 0) * s * DPR;
  // en lot (lettresGl ouvert par la scene) : la lettre est rangee, la carte la posera
  if (v && v.page && lettresGl.actif && lettresGl.cible === ctx) return lettresGl.ajouter(v, c, sn, -sn, c, DPR * x, DPR * y, alpha);
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.setTransform(c, sn, -sn, c, DPR * x, DPR * y);
  if (v) poserVignette(v);
  else ecrireDirect(t, police(taille, italique), couleur);
}
// Comme poserLettre, pour un texte dont la police est deja faite (le texte defilant, le texte 3D) :
// la vignette est peinte a cette police exacte. nu : sans aucun effet (ni lueur, ni relief).
function poserTexte(t, pol, couleur, x, y, ang, alpha, graine, cours, sansLueur, nu, sx, sy) {
  if (alpha <= 0.004) return;
  if (S.tremblement > 0 && graine !== undefined) {
    const A = S.tremblement * 0.25 * (S.tremblementValeur && cours !== undefined ? 0.25 + 1.6 * (1 - cours / 100) : 1), fq = S.frequence * 6;
    x += A * bruit(temps * fq + graine); y += A * bruit(temps * fq + graine * 1.7 + 30);
  }
  const fs = tailleDePolice(pol);
  const v = vignetteTexte(t, pol, couleur, sansLueur, nu);
  const s = (v ? fs / v.fs : 1) * DPR * battementMots(0.16);
  const c = Math.cos(ang || 0) * s, sn = Math.sin(ang || 0) * s, ex = sx === undefined ? 1 : sx, ey = sy === undefined ? 1 : sy;
  if (v && v.page && lettresGl.actif && lettresGl.cible === ctx) return lettresGl.ajouter(v, c * ex, sn * ex, -sn * ey, c * ey, DPR * x, DPR * y, alpha);
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.setTransform(c * ex, sn * ex, -sn * ey, c * ey, DPR * x, DPR * y);
  if (v) poserVignette(v);
  else ecrireDirect(t, pol, couleur);
}
// Une lettre qui passe d'une couleur a l'autre (f de 0 a 1) : les deux vignettes l'une sur
// l'autre le temps du fondu, plutot qu'un saut de couleur (l'encre fraiche, la goutte qui se
// pose, la crete neuve : audit du 2026-10-18). Une couleur melangee par image ferait autant de
// vignettes neuves.
function poserFondu(t, taille, de, vers, f, x, y, ang, alpha, graine, cours, italique, net) {
  if (f >= 1 || de === vers) return poserLettre(t, taille, vers, x, y, ang, alpha, graine, cours, italique, net);
  if (f <= 0) return poserLettre(t, taille, de, x, y, ang, alpha, graine, cours, italique, net);
  poserLettre(t, taille, vers, x, y, ang, alpha, graine, cours, italique, net);
  poserLettre(t, taille, de, x, y, ang, alpha * (1 - f), graine, cours, italique, net);
}

// Le bus (reglages.js, « tout est lie ») : une scene annonce le mot qui parait, une fois par mot
// et par apparition (le drapeau `annonce` sur l'objet du mot), et le vers qui commence.
function annoncerMot(objet, texte, x, y, poete, cours, ordre) {
  if (!objet || objet.annonce) return;
  objet.annonce = true;
  if (typeof bus === "undefined" || !bus.ecouteurs.mot) return;
  bus.emettre("mot", { texte, x, y, poete: poete || "", cours: cours === undefined ? coursDe(texte) : cours, ordre: ordre || 0 });
}
function annoncerVers(texte, poete, index) {
  if (typeof bus === "undefined" || !bus.ecouteurs.vers) return;
  bus.emettre("vers", { texte, poete: poete || "", index: index || 0 });
}

// une etoile : un point de lumiere flou, peint une fois par couleur
const sprites = new Map();
function spriteEtoile(couleur) {
  let c = sprites.get(couleur);
  if (c) return c;
  c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d"), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, couleur); r.addColorStop(0.12, couleur); r.addColorStop(0.3, "rgba(255,255,255,0.18)"); r.addColorStop(1, "rgba(255,255,255,0)");
  if (palette().clair) { r.addColorStop(0.3, "rgba(0,0,0,0.12)"); r.addColorStop(1, "rgba(0,0,0,0)"); }
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  sprites.set(couleur, c);
  return c;
}
function poserEtoile(x, y, rayon, couleur, alpha, branches) {
  if (alpha <= 0.004) return;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.globalAlpha = Math.min(1, alpha);
  const R = rayon * 4;
  ctx.drawImage(spriteEtoile(couleur), x - R, y - R, R * 2, R * 2);
  if (branches) {
    // les aigrettes des etoiles brillantes, comme sur les vieilles photographies du ciel
    ctx.strokeStyle = couleur; ctx.lineWidth = 0.8; ctx.globalAlpha = Math.min(1, alpha) * 0.55;
    const L = rayon * 5.5;
    ctx.beginPath(); ctx.moveTo(x - L, y); ctx.lineTo(x + L, y); ctx.moveTo(x, y - L); ctx.lineTo(x, y + L); ctx.stroke();
  }
}

// les vers d'un poeme regroupes par strophe (les vers herites ne repassent pas)
function strophesDe(poeme) {
  const out = poeme.strophes.map(s => s.vers.filter(v => !v.herite && v.texte && v.texte !== "…").map(v => ({ texte: v.texte, poete: s.poete, v })))
    .filter(s => s.length);
  return out.length ? out : [[{ texte: "poïasie", poete: "", v: {} }]];
}

