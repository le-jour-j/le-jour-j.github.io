"use strict";
/* ================================================================ site : la demonstration (charge en dernier)

   Le moteur est celui de l'ecran, tel quel. Ici on ne fait que :
   - choisir les scenes qui passent d'elles-memes (les plus belles, en lettres, jamais la Banque) ;
   - couper ce qui n'a pas de sens sur un site : fenetre de reglages, generateur, manette, micro ;
   - garder les gestes du clavier : espace et fleches (poeme suivant ou precedent), S (autre scene),
     N (autres couleurs), F (plein ecran), M (son) ; le bouton du son est coupe jusqu'au clic ;
   - donner au visiteur la main du jeu : un clic pose le mot suivant du poeme, un glisser en ecrit
     plusieurs le long du chemin, un appui long fait eclater les mots autour ;
   - dire a la page qui l'entoure (index.html) quel poeme passe et de quelle machine il vient, pour
     qu'elle l'ecrive HORS de l'image. Rien ne s'ecrit sur l'image elle-meme. */

// ---- les scenes qui passent d'elles-memes : lentes, en lettres, pas de Banque, pas de vieille tele
const SITE_SCENES = ["constellation", "nuee", "etoiles", "calligramme", "puits", "rosace", "ruban", "coupdedes", "averse",
  "galaxie", "foret", "mer", "vallee", "noeud", "helice", "drape", "globe"];
const SITE_SCENES_LEGERES = ["constellation", "nuee", "etoiles", "calligramme", "rosace", "ruban", "coupdedes", "puits", "averse", "foret"];
const SITE_PALETTES = ["nuit", "crepuscule", "glace", "foret", "or", "braise", "billet", "klein", "papier"];

(function () {
  const connues = new Set(SCENES_NOMS.map(([k]) => k));
  const choix = (SITE_MOBILE ? SITE_SCENES_LEGERES : SITE_SCENES).filter(k => connues.has(k));
  window.SITE_CHOIX = choix;
  // l'ordre « toutes, a tour de rôle » et les listes du pilote : seulement ces scenes
  ORDRE_AUTO.length = 0; ORDRE_AUTO.push(...choix);
  PILOTE_CALME.length = 0; PILOTE_CALME.push(...choix);
  PILOTE_PLEIN.length = 0; PILOTE_PLEIN.push(...choix);
  sacAuto = [];
})();

// ---- ce qui est coupe
basculerPanneau = function () { /* pas de fenetre de reglages sur le site */ };
basculerMusique = function () { /* pas de micro sur le site */ };
if (typeof musique !== "undefined") { musique.brancher = async function () { return false; }; }
// pas de manette : la seule main est celle du visiteur, sans cercle ni curseur (S.mainCurseur est faux)
const siteMain = { j: null, appui: null, minuteur: 0 };
manette.maj = function (dt) {
  live.mod.flash *= Math.exp(-dt * 5);
  const j = siteMain.j;
  if (!j) return;
  j.presence = 1; j.fondu = 1;
  j.choc = Math.max(0, j.choc - dt * 1.8);
  j.spin *= Math.exp(-dt * 1.3); if (Math.abs(j.spin) < 0.003) j.spin = 0;
};
manette.dernierUsage = -1e9;
auHasard = function () { /* le hasard des reglages est coupe */ };

// le son : coupe jusqu'au clic sur le bouton de la page
let siteSonVoulu = false;
const siteSonDemarrer = son.demarrer.bind(son);
son.demarrer = function () { return siteSonVoulu ? siteSonDemarrer.apply(son, arguments) : undefined; };
function siteSon(oui) {
  siteSonVoulu = !!oui;
  try {
    if (oui) { siteSonDemarrer(); S.volume = 0.5; }
    changer("son", !!oui);
  } catch (e) { console.warn("poiasie : le son n'a pas demarre", e); siteSonVoulu = false; }
  return siteSonVoulu;
}

// ---- les gestes
let siteDernierSaut = 0;
function siteSuivant(sens) {
  const t = performance.now();
  if (t - siteDernierSaut < 350) return;
  siteDernierSaut = t;
  photographier();
  suivant(sens);
}
function siteSceneSuivante() {
  const liste = ["auto", ...SITE_CHOIX];
  const i = Math.max(0, liste.indexOf(S.scene));
  changerScene(liste[(i + 1) % liste.length]);
}
function siteCouleursSuivantes() {
  const i = SITE_PALETTES.indexOf(S.palette);
  changer("palette", SITE_PALETTES[(i + 1) % SITE_PALETTES.length]);
}
function siteTouche(e) {
  const k = e.key.toLowerCase();
  if (k === " " || k === "arrowright" || k === "enter") siteSuivant();
  else if (k === "arrowleft") siteSuivant(-1);
  else if (k === "s") siteSceneSuivante();
  else if (k === "a") changerScene("auto");
  else if (k === "n") siteCouleursSuivantes();
  else if (k === "f") sitePleinEcran();
  else if (k === "m") parent !== window && parent.postMessage({ type: "poiasie-son-bascule" }, "*");
  else return false;
  return true;
}
function sitePleinEcran() {
  try {
    if (document.fullscreenElement || (parent !== window && parent.document.fullscreenElement)) {
      (parent !== window ? parent.document : document).exitFullscreen();
    } else if (window.frameElement && window.frameElement.requestFullscreen) window.frameElement.requestFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen().catch(() => {});
  } catch (e) { /* le navigateur refuse : tant pis */ }
}
// la fenetre prend toutes les touches avant le moteur : celles dont on n'a pas l'usage ne font rien
addEventListener("keydown", e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;   // les raccourcis du navigateur restent au navigateur
  if (e.target && /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
  e.stopImmediatePropagation();
  if (e.repeat) { if (e.key === " ") e.preventDefault(); return; }
  if (siteTouche(e) && (e.key === " " || e.key === "Tab")) e.preventDefault();
}, true);

// ---- la main du visiteur (souris, doigt ou stylet)
// C'est la Joueur du moteur (live.js), sans manette : memes mots, memes couleurs de poetes, memes eclats,
// memes notes. Rien du visiteur n'est garde ni envoye : les mots s'effacent seuls.
const SITE_MOTS_MAX = 70;      // les mots du visiteur vivants a la fois (le moteur en garde 480 au plus)
const SITE_APPUI_LONG = 480;   // ms avant que l'appui devienne un eclat
const SITE_TREMBLE = 14;       // px : en dessous, le doigt n'a pas bouge

function siteJoueur() {
  if (siteMain.j) return siteMain.j;
  const j = new Joueur({ id: "visiteur", index: -1, connected: true }, "visiteur", 1);
  j.presence = 1; j.fondu = 1;
  if (SITE_MOBILE) j.tailleSel = 1.35;   // le doigt cache plus que la souris, l'ecran est petit
  joueurs.push(j);
  siteMain.j = j;
  return j;
}

// un mot du poeme en cours, la suite du dernier ; le poete du mot prete sa couleur et son timbre
function siteMot(x, y, ang) {
  const j = siteJoueur(), e = main.prochain();
  if (!e) return null;
  const p = PERSOS.find(q => q.nom === e.poete);
  if (p) j.perso = p;
  const T = j.taille(), w = mesurer(e.t, police(T));
  x = clamp(x, w / 2 + 8, Math.max(w / 2 + 8, W - w / 2 - 8));
  y = clamp(y, T * 0.6, Math.max(T * 0.6, H - T * 0.6));
  j.x = x; j.y = y;
  // pas plus de mots qu'on ne peut en lire : les plus anciens commencent a s'effacer
  let n = 0;
  for (let k = main.mots.length - 1; k >= 0; k--) {
    const m = main.mots[k];
    if (m.joueur === j.id && ++n > SITE_MOTS_MAX) m.vie = Math.min(m.vie, Math.max(0, m.age) + 0.6);
  }
  const m = j.poser(e, x, y, ang, T, 0, null);
  j.noteLibre = 0;                       // chaque mot sonne (le debit global des notes reste borne)
  j.noteMot(e, x, y, 1);
  j.dernierW = w;
  return m;
}

function siteAngle(a, b) {
  let ang = Math.atan2(b.y - a.y, b.x - a.x);
  if (ang > Math.PI / 2) ang -= Math.PI; else if (ang < -Math.PI / 2) ang += Math.PI;
  return ang;
}

// l'appui long : des mots autour du doigt s'il n'y en a pas assez, puis ils eclatent en lettres
function siteEclat(x, y) {
  const j = siteJoueur();
  j.x = x; j.y = y;
  const R = Math.max(170, j.taille() * 5);
  const pres = main.mots.filter(m => m.joueur === j.id && m.age >= 0 && Math.hypot(m.x - x, m.y - y) <= R).length;
  let attente = 0;
  if (pres < 4) {
    const r = j.taille() * 2.6, a0 = Math.random() * 6.28;
    for (let k = 0; k < 5; k++) {
      const a = a0 + k * 1.2566;
      siteMot(x + Math.cos(a) * r * 1.5, y + Math.sin(a) * r * 0.9, (Math.random() - 0.5) * 0.5);
    }
    attente = 380;
  }
  const f = () => { j.x = x; j.y = y; j.eclater(0); };
  if (attente) setTimeout(f, attente); else f();
}

addEventListener("pointerdown", e => {
  if (siteMain.appui || !e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
  try { e.target.setPointerCapture(e.pointerId); } catch (err) { /* tant pis */ }
  const j = siteJoueur(), x = e.clientX, y = e.clientY;
  siteMain.appui = { id: e.pointerId, x0: x, y0: y, x, y, dernier: { x, y }, parcours: 0, glisse: false, lance: false };
  j.traceCoupee = true;
  siteMot(x, y, (Math.random() - 0.5) * 0.35);
  clearTimeout(siteMain.minuteur);
  siteMain.minuteur = setTimeout(() => {
    const a = siteMain.appui;
    if (!a || a.glisse) return;
    a.lance = true;
    siteEclat(a.x, a.y);
  }, SITE_APPUI_LONG);
}, true);

addEventListener("pointermove", e => {
  const a = siteMain.appui;
  if (!a || e.pointerId !== a.id) return;
  const x = e.clientX, y = e.clientY, j = siteJoueur();
  const pas = Math.hypot(x - a.x, y - a.y);
  a.x = x; a.y = y;
  if (!a.glisse) {
    if (a.lance || Math.hypot(x - a.x0, y - a.y0) < SITE_TREMBLE) return;   // l'eclat est parti, ou le doigt tremble
    a.glisse = true; clearTimeout(siteMain.minuteur);
  }
  if (!pas) return;
  // l'encre du poete, comme pour la manette : une trainee fine le long du chemin
  const p = j.perso, T = j.taille();
  if (p.encre) {
    const der = j.trace[j.trace.length - 1];
    if (j.traceCoupee || !der || Math.hypot(x - der.x, y - der.y) > 5) {
      j.trace.push({ x, y, age: 0, l: T * 0.1 * p.encre * (0.5 + Math.min(1.5, pas / 10)), debut: j.traceCoupee });
      j.traceCoupee = false;
      if (j.trace.length > 600) j.trace.shift();
    }
  }
  // un mot chaque fois que le doigt a assez avance pour le poser a la suite du dernier
  a.parcours += pas;
  const suivant = main.file.length ? main.file[main.i % main.file.length] : null;
  const w = suivant ? mesurer(suivant.t, police(T)) : T * 3;
  if (a.parcours >= ((j.dernierW + w) / 2 + T * 0.4)) {
    a.parcours = 0;
    const ang = siteAngle(a.dernier, { x, y });
    a.dernier = { x, y };
    siteMot(x, y, ang);
  }
}, true);

function siteRelacher(e) {
  const a = siteMain.appui;
  if (!a || e.pointerId !== a.id) return;
  clearTimeout(siteMain.minuteur);
  siteMain.appui = null;
  if (siteMain.j) siteMain.j.traceCoupee = true;
}
addEventListener("pointerup", siteRelacher, true);
addEventListener("pointercancel", siteRelacher, true);
addEventListener("dblclick", e => e.stopImmediatePropagation(), true);
addEventListener("contextmenu", e => e.preventDefault());

// ---- ce qu'on dit a la page qui nous entoure
function siteDire(m) { try { if (parent !== window) parent.postMessage(m, "*"); } catch (e) { /* page seule : rien a dire */ } }
let siteCompteur = 0;
bus.ecouter("poeme", ({ poeme }) => {
  if (!poeme || poeme.origine === "rien") return;
  const teinte = SITE.teintes.get(poeme.machine);
  // plusieurs machines : la teinte des mots dit d'ou vient le poeme ; une seule : chaque poete garde la sienne
  if (SITE.teintes.size > 1 && teinte != null) { S.modeCouleur = "teinte"; S.teinteMots = teinte; }
  else S.modeCouleur = "poetes";
  // un autre jeu de couleurs de temps en temps, doucement (jamais la musique ni un effet)
  if (++siteCompteur % 4 === 0) {
    const i = SITE_PALETTES.indexOf(S.palette);
    S.palette = SITE_PALETTES[(i + 1 + Math.floor(Math.random() * 2)) % SITE_PALETTES.length];
    fondCache = null;
  }
  siteDire({ type: "poiasie-poeme", titre: poeme.titre || "", forme: poeme.forme || "", machine: poeme.machine || "",
    teinte: teinte != null ? teinte : null, date: poeme.date || "", scene: sceneCle });
});

// les jours plus anciens arrivent peu a peu
setInterval(siteComplement, 20000);

// ---- ce que la page peut nous demander
addEventListener("message", e => {
  const m = e.data;
  if (!m || typeof m !== "object") return;
  if (m.type === "poiasie-son") siteDire({ type: "poiasie-son-etat", actif: siteSon(m.actif) });
  else if (m.type === "poiasie-touche") siteTouche({ key: String(m.key || "") });
});
siteDire({ type: "poiasie-pret", mobile: SITE_MOBILE, scenes: SITE_CHOIX.length });
