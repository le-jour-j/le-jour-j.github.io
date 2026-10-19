"use strict";
/* ================================================================ fond et bandeau */

let fondCache = null;
const pointsCiel = Array.from({ length: 220 }, () => ({ x: Math.random(), y: Math.random(), a: Math.random(), v: hasard(0.5, 3) }));
function peindreFond(dt) {
  dt = dt || 0;
  // le debut de l'image : les vignettes demandees a l'image d'avant sont peintes maintenant,
  // avant la premiere pose (voir vignettes.js)
  vignettes.nouvelleImage();
  const P = palette();
  const cle = P.nom + "|" + P.fond.join() + "|" + P.accent + "|" + W + "|" + H + "|" + S.fond;
  if (!fondCache || fondCache.cle !== cle) {
    let style;
    if (S.fond === "horizon" || S.fond === "sol") {
      // le ciel descend vers une ligne d'horizon allumee, la terre reste sombre
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, P.fond[0]); g.addColorStop(0.5, P.fond[1]); g.addColorStop(0.59, melange(P.fond[1], P.accent, 0.3));
      g.addColorStop(0.617, melange(P.fond[1], P.accent, 0.8)); g.addColorStop(0.621, P.fond[0]); g.addColorStop(1, melange(P.fond[0], P.fond[1], 0.5)); style = g;
    } else if (["degrade", "maelstrom", "aurore", "rayons", "tapisserie", "filigrane"].includes(S.fond)) {
      const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.hypot(W, H) / 2);
      g.addColorStop(0, P.fond[1]); g.addColorStop(1, P.fond[0]); style = g;
    } else if (S.fond === "aucun") style = P.clair ? "#ffffff" : "#000000";
    else style = P.fond[0];
    fondCache = { cle, style };
    document.body.classList.toggle("clair", !!P.clair);
  }
  // Pendant le fondu entre deux scenes, le fond est peint plein : la photo de l'ancienne scene
  // (traines comprises) s'efface par-dessus en fonduDuree secondes. Avec les traines, la photo
  // se recopiait d'une image sur l'autre et le fondu trainait bien plus longtemps que prevu.
  const enFondu = typeof fondu !== "undefined" && fondu.alpha > 0;
  const a = S.trainees > 0 && !enFondu ? Math.max(0.03, 1 - S.trainees) : 1;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.globalAlpha = a;
  ctx.fillStyle = fondCache.style;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;
  if (S.fond === "etoiles") {
    ctx.fillStyle = P.clair ? "#7a6f5c" : "#ffffff";
    for (const p of pointsCiel) {
      ctx.globalAlpha = 0.25 + 0.5 * Math.abs(Math.sin(temps * p.v + p.a * 6));
      ctx.fillRect(p.x * W, p.y * H, 1.3, 1.3);
    }
    ctx.globalAlpha = 1;
  }
  else if (S.fond === "aurore") fondAurore(P, a);
  else if (S.fond === "rayons") fondRayons(P, a);
  else if (S.fond === "tapisserie") fondTapisserie(P, a);
  else if (S.fond === "filigrane") fondFiligrane(P, a, dt);
  else if (S.fond === "cahier") fondCahier(P, a);
  else if (S.fond === "sol") fondSol(P, a, dt);
  // le fond bat avec les basses (ou avec le flash)
  const bat = S.fondPulse * Math.max(S.musique && musique.actif ? musique.basses : 0, live.mod.flash * 0.5);
  if (bat > 0.01) {
    ctx.globalCompositeOperation = P.clair ? "multiply" : "lighter";
    ctx.globalAlpha = clamp(bat * 0.22, 0, 0.5);
    ctx.fillStyle = P.accent; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
  }
}

// Les fonds de decor (2026-10-17). Ceux qui sont faits de mots prennent les mots du recueil.
const decor = { tapis: null, tapisCle: "", fil: [], filPoeme: null, solTexte: "" };
// trois nuees de couleur qui derivent lentement
// Les trois nuees sont peintes sur une petite toile (un huitieme de cote), refaite une image
// sur deux, puis posee agrandie en une fois : trois degrades plein ecran par image coutaient
// cher pour des formes aussi douces (audit du 2026-10-18).
const aurore = { c: document.createElement("canvas"), g: null, image: 0 };
function fondAurore(P, a) {
  const w = Math.max(16, Math.ceil(W / 8)), h = Math.max(16, Math.ceil(H / 8));
  if (aurore.c.width !== w || aurore.c.height !== h || !aurore.g) { aurore.c.width = w; aurore.c.height = h; aurore.g = aurore.c.getContext("2d"); aurore.image = 0; }
  if (aurore.image++ % 2 === 0) {
    const g = aurore.g;
    g.setTransform(w / W, 0, 0, h / H, 0, 0);
    g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
    // sur papier, les nuees se multiplient : la petite toile part du blanc ; sur la nuit, du noir
    g.fillStyle = P.clair ? "#ffffff" : "#000000"; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = P.clair ? "multiply" : "lighter";
    const couleurs = [P.accent, P.note, hsl((P.teinte + 140 + temps * 6) % 360, 70, P.clair ? 78 : 42)];
    couleurs.forEach((c, i) => {
      const x = W * (0.5 + 0.38 * Math.sin(temps * (0.05 + i * 0.023) + i * 2.1)), y = H * (0.5 + 0.34 * Math.cos(temps * (0.043 + i * 0.017) + i * 1.3));
      const R = Math.max(W, H) * (0.45 + 0.1 * Math.sin(temps * 0.1 + i));
      const gr = g.createRadialGradient(x, y, 0, x, y, R);
      gr.addColorStop(0, c); gr.addColorStop(1, P.clair ? "rgba(255,255,255,0)" : "rgba(0,0,0,0)");
      g.globalAlpha = 0.17; g.fillStyle = gr; g.fillRect(0, 0, W, H);
    });
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = P.clair ? "multiply" : "lighter";
  ctx.globalAlpha = a;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(aurore.c, 0, 0, toile.width, toile.height);
  ctx.restore();
}
// un soleil levant : des rayons qui tournent depuis l'horizon, plus vifs sur le temps fort
function fondRayons(P, a) {
  const n = 18, cx = W / 2, cy = H * 0.62, R = Math.hypot(W, H);
  ctx.globalAlpha = a * (P.clair ? 0.07 : 0.09) * (1 + rythme().coup);
  ctx.fillStyle = P.accent;
  ctx.beginPath();
  for (let k = 0; k < n; k++) {
    const a0 = temps * 0.018 + k * Math.PI * 2 / n;
    ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a0, a0 + Math.PI / n); ctx.closePath();
  }
  ctx.fill();
  ctx.globalAlpha = 1;
}
// un papier peint de mots du recueil, en quinconce, qui monte doucement
function fondTapisserie(P, a) {
  const cle = W + "|" + H + "|" + DPR + "|" + P.note + "|" + S.police + "|" + D.corpus.length;
  if (!decor.tapis || decor.tapisCle !== cle) {
    const c = decor.tapis || document.createElement("canvas");
    c.width = Math.ceil(W * DPR); c.height = Math.ceil(H * DPR);
    const g = c.getContext("2d");
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    g.clearRect(0, 0, W, H);
    const fs = clamp(Math.min(W, H) * 0.018, 11, 18);
    g.font = police(fs, true); g.fillStyle = P.note; g.textBaseline = "middle";
    const mots = D.corpus.length ? D.corpus : ["poïasie", "obole", "liard", "créance", "vers"];
    let graine = 7;
    const auHasard = () => { graine = (graine * 16807) % 2147483647; return graine / 2147483647; };
    for (let y = fs, ligne = 0; y < H; y += fs * 2.1, ligne++) {
      let x = ligne % 2 ? -fs * 3 : 0;
      while (x < W) { const m = mots[Math.floor(auHasard() * mots.length)]; g.fillText(m, x, y); x += g.measureText(m).width + fs * 1.6; }
    }
    decor.tapis = c; decor.tapisCle = cle;
  }
  const dec = ((temps * 4) % H) * DPR;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = a * (P.clair ? 0.32 : 0.22);
  ctx.drawImage(decor.tapis, 0, -dec);
  ctx.drawImage(decor.tapis, 0, decor.tapis.height - dec);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.globalAlpha = 1;
}
// les grands mots pales du poeme en cours, qui derivent derriere tout
function fondFiligrane(P, a, dt) {
  if (decor.filPoeme !== poemeCourant) {
    decor.filPoeme = poemeCourant;
    const mots = poemeCourant ? versDe(poemeCourant).flatMap(v => motsPleins(v.texte)) : [];
    const choix = (mots.length ? mots : D.corpus.length ? D.corpus : ["poïasie"]).slice().sort((x, y) => coursDe(y) - coursDe(x)).slice(0, 6);
    decor.fil = Array.from({ length: Math.min(4, choix.length) }, (_, i) => ({ mot: casse(choix[i]), x: hasard(0.1, 0.9) * W, y: (0.15 + i * 0.24) * H,
      vx: hasard(-12, 12), fs: H * hasard(0.16, 0.3), ang: hasard(-0.12, 0.12) }));
  }
  for (const f of decor.fil) {
    f.x += f.vx * dt;
    if (f.x < -W * 0.2 || f.x > W * 1.2) f.vx = -f.vx;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.translate(f.x, f.y); ctx.rotate(f.ang);
    ctx.globalAlpha = a * (P.clair ? 0.07 : 0.09);
    // quatre grands mots ecrits une fois (vignette sans effet), poses a chaque image
    const pol = police(Math.round(f.fs)), coul = P.clair ? P.texte : P.note;
    const v = vignetteTexte(f.mot, pol, coul, true, true);
    if (v) poserVignette(v);
    else { ctx.font = pol; ctx.fillStyle = coul; ctx.fillText(f.mot, 0, 0); }
  }
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.globalAlpha = 1;
}
// une page de cahier : les lignes, et la marge
function fondCahier(P, a) {
  const pas = clamp(H / 26, 22, 40);
  ctx.globalAlpha = a * (P.clair ? 0.35 : 0.22);
  ctx.strokeStyle = P.clair ? "#6f8fb8" : P.note; ctx.lineWidth = 1;
  ctx.beginPath();
  for (let y = pas * 2.5; y < H; y += pas) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();
  ctx.strokeStyle = P.accent; ctx.globalAlpha = a * 0.4;
  ctx.beginPath(); ctx.moveTo(W * 0.09, 0); ctx.lineTo(W * 0.09, H); ctx.stroke();
  ctx.globalAlpha = 1;
}
// un sol de lettres jusqu'a l'horizon, qui defile vers nous (plus vite avec les basses)
// Un rang de lettres garde sa forme en approchant : il grandit tout entier depuis le milieu
// (l'ecart et la taille vont en 1/z). Les rangs lointains sont donc peints une fois chacun en
// une bande, posee a l'echelle ; seuls les proches, qui grossissent beaucoup, restent lettre a
// lettre. 900 lettres posees par image coutaient plus que bien des scenes (audit du 2026-10-18).
const SOL_BANDE = 1.6;  // au-dela de cette profondeur, un rang est une bande
function bandeSol(T, id, couleur) {
  const cle = id + "|" + couleur + "|" + W + "|" + S.police + "|" + S.lueur + "|" + DPR;
  let b = decor.bandes.get(cle);
  if (b) return b;
  const n = 61, fs = 30, pas = W * 0.042, pad = fs, larg = pas * (n - 1) + 2 * pad, haut = fs * 2;
  const c = document.createElement("canvas");
  // la bande est peinte a la taille du rang a la profondeur SOL_BANDE (ou elle commence a servir)
  const e = DPR / SOL_BANDE;
  c.width = Math.ceil(larg * e); c.height = Math.ceil(haut * e);
  const g = c.getContext("2d");
  g.setTransform(e, 0, 0, e, 0, 0);
  if ("letterSpacing" in g) g.letterSpacing = "0px";
  g.font = police(fs); g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = couleur;
  if (S.lueur > 0) { g.shadowColor = couleur; g.shadowBlur = S.lueur * 16 * e; }
  for (let i = 0; i < n; i++) {
    const ch = T[(id * 7 + i) % T.length];
    if (ch !== " ") g.fillText(ch, pad + i * pas, haut / 2);
  }
  b = { c, larg, haut, id };
  decor.bandes.set(cle, b);
  return b;
}
function fondSol(P, a, dt) {
  if (!decor.solTexte || decor.solTexte.length < 50) decor.solTexte = (D.corpus.length ? D.corpus.slice(0, 900).join(" ") : "poïasie vers obole liard créance ").replace(/\s+/g, " ");
  if (!decor.bandes) decor.bandes = new Map();
  const T = decor.solTexte, hy = H * 0.62, F = H - hy, n = 61, rangs = 16;
  decor.avance = (decor.avance || 0) + dt * (0.6 + rythme().b * 1.5);
  const base = Math.floor(decor.avance), frac = decor.avance - base;
  const lot = lettresGl.ouvrir();
  for (let k = rangs; k >= 1; k--) {
    const z = k - frac;
    if (z < 0.35) continue;
    const y = hy + F / z * 0.9, fs = 30 / z, al = a * clamp((rangs - z) / 6, 0, 1) * 0.45;
    if (al <= 0.01 || fs < 1.5 || y > H + fs) continue;
    const id = base + rangs - k, couleur = z < 2.5 ? P.accent : P.note;
    if (z >= SOL_BANDE) {
      // une bande posee sur la toile : les lettres du lot deja rangees passent d'abord
      if (lot && lettresGl.n) { lettresGl.fermer(); lettresGl.ouvrir(); }
      const b = bandeSol(T, id, couleur), s = 1 / z;
      ctx.setTransform(DPR * s, 0, 0, DPR * s, DPR * W / 2, DPR * y);
      // les rangs les plus fins s'effacent au lieu de scintiller
      ctx.globalAlpha = Math.min(1, al * clamp((fs - 1.5) / 2.5, 0, 1));
      ctx.drawImage(b.c, -b.larg / 2, -b.haut / 2, b.larg, b.haut);
      continue;
    }
    for (let i = 0; i < n; i++) {
      const x = W / 2 + (i - (n - 1) / 2) * W * 0.042 / z;
      if (x < -fs || x > W + fs) continue;
      const c = T[(id * 7 + i) % T.length];
      if (c === " ") continue;
      poserLettre(c, fs, couleur, x, y, 0, al);
    }
  }
  if (lot) lettresGl.fermer();
  // les bandes des rangs passes s'en vont
  if (decor.bandes.size > 40) for (const [k, b] of decor.bandes) if (b.id < base - 1 || decor.bandes.size > 60) { b.c.width = 0; decor.bandes.delete(k); }
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.globalAlpha = 1;
}

const bandeau = { texte: null, x: 0, largeur: 0 };
function dessinerBandeau(dt) {
  const B = corbeille.donnees;
  const cote = B && B.cote.length ? B.cote.slice(0, 30) : D.cote;
  if (!S.bourse || !cote.length) return;
  const pol = "11px Consolas, \"Courier New\", monospace";
  if (!bandeau.texte) {
    const bouts = cote.map(c => c.mot.toUpperCase() + " " + c.cours + (c.cours < 10 ? " ▼" : c.cours >= 40 ? " ▲" : " ="));
    let t = (B && B.krach ? "▼ KRACH ▼ LA BANQUE RESSERRE LA CIRCULATION   ·   " : "") + "BOURSE DES MOTS · COURS EN SOUS · " + bouts.join("   ·   ");
    const interdits = B ? B.interdits : D.interdits;
    if (interdits.length) t += "   ·   RETIRÉS DE LA CIRCULATION : " + interdits.join(", ").toUpperCase();
    if (B) {
      const der = B.indices[B.indices.length - 1];
      if (der) t += "   ·   INDICE DU DERNIER POÈME : " + der.indice;
      if (B.tresor) t += "   ·   TRÉSOR DE LA BANQUE : " + B.tresor + " SOUS";
      const riche = Object.keys(B.fortunes).sort((a, b) => B.fortunes[b] - B.fortunes[a])[0];
      if (riche) t += "   ·   LE PLUS RICHE : " + riche.toUpperCase() + " (" + B.fortunes[riche] + " SOUS)";
    }
    bandeau.texte = t + "   ·   ";
    bandeau.largeur = mesurer(bandeau.texte, pol);
    bandeau.x = W;
  }
  bandeau.x -= 45 * dt;
  if (bandeau.x < -bandeau.largeur) bandeau.x += bandeau.largeur;
  const P = palette();
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = P.clair ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)";
  ctx.fillRect(0, 0, W, 18);
  ctx.globalAlpha = 0.8;
  ctx.font = pol; ctx.textAlign = "left"; ctx.textBaseline = "middle";
  ctx.fillStyle = P.note;
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  for (let x = bandeau.x; x < W; x += bandeau.largeur) ctx.fillText(bandeau.texte, x, 9.5);
  appliquerEspacement();
  ctx.restore();
}

/* ================================================================ cartel et direct */

const cartel = document.getElementById("cartel");
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
function dateLisible(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return "le " + d.getDate() + " " + MOIS[d.getMonth()] + " " + d.getFullYear() + " à " + d.getHours() + " h " + String(d.getMinutes()).padStart(2, "0");
}
let cartelDe = null;
function remplirCartel(p) {
  if (cartelDe === p) return;
  cartelDe = p;
  cartel.replaceChildren();
  const ajouter = (classe, texte) => { if (!texte) return; const d = document.createElement("div"); d.className = classe; d.textContent = texte; cartel.appendChild(d); };
  const m = p.memo || {};
  ajouter("c-titre", p.titre ? "« " + p.titre + " »" : p.origine === "flux" ? "" : "sans titre");
  // le nom de la forme et son resume ne s'ecrivent que sur demande (annoncerForme, Jiiji 2026-10-18)
  const forme = S.annoncerForme ? p.forme : "";
  ajouter("c-forme", [forme, p.anaphore ? "« " + p.anaphore + " »" : "", m.radif ? "radif « " + m.radif + " »" : "",
    m.acrostiche ? "le mot caché : " + m.acrostiche : ""].filter(Boolean).join(" · "));
  if (S.annoncerForme) ajouter("c-ligne", p.resume);
  const indice = p.indice !== undefined && p.indice !== null ? "indice " + p.indice + (p.krach ? " (krach)" : "") : "";
  ajouter("c-ligne", [dateLisible(p.date), p.machine, p.moteur, indice].filter(Boolean).join(" · "));
  const ordre = p.ordre && p.ordre.length ? "dans l'ordre : " + p.ordre.join(", ") : "";
  ajouter("c-ligne", [ordre, p.titrePar ? "titre donné par " + p.titrePar.toLowerCase() + ", le plus riche" : ""].filter(Boolean).join(" · "));
}
function hauteurCartel(p) {
  if (!S.cartel || !p) return 0;
  if (enCalque) return cartel.offsetHeight || H * 0.12;
  remplirCartel(p);
  return cartel.offsetHeight || 0;
}
function montrerCartel(p) {
  if (enCalque) return;
  if (!p || !S.cartel) { cartel.classList.remove("visible"); return; }
  remplirCartel(p);
  cartel.classList.add("visible");
}

const fenDirect = document.getElementById("direct");
const dQui = document.getElementById("d-qui"), dOu = document.getElementById("d-ou"), dTexte = document.getElementById("d-texte"), dTitre = document.getElementById("d-titre");
let dernierTexteDirect = "";
let dernierEtatDirect = null;
async function suivreDirect() {
  const d = await lireJSON("direct.json");
  dernierEtatDirect = d;
  if (!d || !S.direct) { fenDirect.classList.remove("visible"); return; }
  const age = (Date.now() - new Date(d.maj).getTime()) / 1000;
  const actif = (d.etat === "ecrit" || d.etat === "titre" || d.etat === "reveil") && age < 600;
  const attente = d.etat === "attente" && age < 900;
  if (!actif && !attente) { fenDirect.classList.remove("visible"); dernierTexteDirect = ""; return; }
  fenDirect.classList.add("visible");
  if (attente) {
    dTitre.textContent = "Le poème attend";
    dQui.textContent = d.texte || "le poste est occupé";
    dOu.textContent = "Le générateur réessaiera dans quelques minutes.";
    dTexte.textContent = "";
    return;
  }
  dTitre.textContent = d.etat === "titre" ? "Le titre se cherche" : S.annoncerForme ? "En direct : " + (d.forme_nom || "poïasie") : "En direct";
  dQui.textContent = (d.poete || "…") + (d.etat === "titre" ? " cherche un titre" : " écrit") + (d.modele ? "  ·  " + d.modele : "");
  dOu.textContent = [d.poste, d.candidat ? "version " + d.candidat : "", d.mot_impose ? "mot imposé : " + d.mot_impose : ""].filter(Boolean).join("  ·  ");
  const texte = (d.texte || "").replace(/<think>[\s\S]*?(<\/think>|$)/g, "").trim();
  dTexte.textContent = texte;
  const curseur = document.createElement("span"); curseur.className = "curseur"; dTexte.appendChild(curseur);
  dTexte.scrollTop = dTexte.scrollHeight;
  if (texte.startsWith(dernierTexteDirect) && texte.length > dernierTexteDirect.length) {
    const neufs = texte.slice(dernierTexteDirect.length).split(/\s+/).filter(w => w.length > 2);
    for (const w of neufs.slice(0, 6)) maelstrom.naitre(w);
  }
  dernierTexteDirect = texte;
}

