"use strict";
/* ================================================================ la musique de l'expo (2026-11-17) */

// Jiiji, 2026-11-17 : « j'aimerais pouvoir mettre de la musique dans l'expo et que les sons generes
// suivent la tonalite des morceaux (on avait deja commence a le faire) ». Le commencement, c'est
// instrument.js (2026-10-23) : une note a la fois, par YIN. Un morceau entier joue plusieurs notes a la
// fois : ici, on compte les douze notes dans le spectre (un chroma).
//
// - les morceaux : des fichiers poses dans un dossier du PC (Bureau\MUSIQUE-EXPO, voir morceaux.py),
//   lus a la suite ou au hasard, sans fin. Pas de dossier, ou un dossier vide : pas de musique, et rien
//   d'autre ne change. Le dossier est relu a chaque fin de morceau (et toutes les 30 s tant qu'il est
//   vide) : poser un fichier suffit. Apres un redemarrage, la lecture reprend au morceau suivant.
// - le son : la musique a son propre contexte audio, a part du son de l'ecran (elle joue meme si le son
//   de l'ecran est coupe), et sort droit vers les haut-parleurs, sans les effets ni le limiteur du son.
// - la tonalite : cinq fois par seconde, les pics du spectre (65 a 2 100 Hz, ceux qui depassent
//   nettement leur voisinage : les notes, pas le bruit des percussions) sont ranges par nom de note.
//   L'histogramme des douze notes s'oublie en morceauxMemoire secondes (un long mix change de tonalite
//   en route). On le compare aux 24 tonalites (profils de Krumhansl-Kessler, majeur et mineur). La
//   tonalite est prise apres 8 s d'ecoute si elle est franche, 20 s sinon ; ensuite une autre doit
//   gagner 8 s de suite pour la remplacer.
// - ce que le son en fait : il prend la tonalite (son.nouvelleGamme et son.tirerMotif ne tirent plus au
//   sort), en cinq notes par defaut (la pentatonique : les erreurs courantes, le ton relatif ou voisin
//   d'une quinte, tombent encore dans la gamme du morceau), ou la gamme entiere. Il s'accorde aussi au
//   diapason du morceau s'il n'est pas a 440 (son.diapason).
// - la memoire : a la fin d'un morceau, ses douze notes et son diapason sont gardes dans le navigateur
//   (par nom et taille de fichier) ; la fois suivante, le son prend sa tonalite des la premiere seconde.
// - l'image : la source « Les morceaux du dossier » de l'onglet Musique (musique.js) fait ecouter aux
//   mots la musique elle-meme, sans micro ni partage d'ecran.

const MORCEAUX_CLE = "poiasie-morceaux-v1";

// ---- pur (banc d'essai : tests\banc-morceaux.js lit ce bloc tel quel) ----
const MORCEAUX_KK_MAJEUR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MORCEAUX_KK_MINEUR = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
// Les douze notes d'une image du spectre. db : le spectre en decibels (AnalyserNode) ; hz : la largeur
// d'une case ; ecart : le diapason, en demi-tons ; c : douze cases a remplir (leur somme fait 1).
// Rend null dans le silence, sinon { dx, dy } : l'ecart moyen des pics au demi-ton, en vecteur (le
// diapason se lit dans sa direction, sa longueur dit s'il est franc).
function morceauxChroma(db, hz, ecart, c) {
  const n = db.length, i0 = Math.max(12, Math.ceil(62 / hz)), i1 = Math.min(n - 13, Math.floor(2100 / hz));
  const lire = i => { const x = db[i]; return x > -120 ? x : -120; };
  let max = -Infinity;
  for (let i = i0; i <= i1; i++) if (db[i] > max) max = db[i];
  if (!(max > -72)) return null;
  const bas = max - 48;
  // la moyenne du voisinage (10 cases de chaque cote), glissante
  let somme = 0;
  for (let i = i0 - 10; i <= i0 + 10; i++) somme += lire(i);
  let total = 0, dx = 0, dy = 0, wd = 0;
  for (let i = i0; i <= i1; i++) {
    if (i > i0) somme += lire(i + 10) - lire(i - 11);
    const y = db[i];
    // un pic : plus haut que ses voisins, pas trop faible, et nettement au-dessus de son voisinage
    if (y < bas || y <= db[i - 1] || y < db[i + 1] || y - somme / 21 < 10) continue;
    const a = lire(i - 1), b = lire(i + 1), den = a - 2 * y + b;
    const f = (i + (den < -1e-6 ? Math.max(-0.5, Math.min(0.5, 0.5 * (a - b) / den)) : 0)) * hz;
    const brut = 69 + 12 * Math.log2(f / 440), m = brut - ecart, proche = Math.round(m);
    // le poids : la force du pic (adoucie : une basse tres forte ne cache pas l'accord), moins dans
    // l'aigu (surtout des harmoniques), et rien pour un pic a mi-chemin entre deux notes
    const force = Math.pow(10, (y - max) / 40) * (f > 1000 ? 1000 / f : 1);
    const juste = Math.cos(Math.PI * (m - proche));
    const p = force * juste * juste;
    c[((proche % 12) + 12) % 12] += p; total += p;
    if (f > 180) { dx += force * Math.cos(2 * Math.PI * brut); dy += force * Math.sin(2 * Math.PI * brut); wd += force; }
  }
  if (!(total > 0)) return null;
  for (let i = 0; i < 12; i++) c[i] /= total;
  return wd > 0 ? { dx: dx / wd, dy: dy / wd } : { dx: 0, dy: 0 };
}
// Les 24 tonalites, de la plus ressemblante a la moins ressemblante : { ton (0 : do), mineur, r }.
// r : la correlation de l'histogramme h avec le profil de la tonalite.
function morceauxCles(h) {
  const cles = [];
  let mh = 0;
  for (let i = 0; i < 12; i++) mh += h[i];
  mh /= 12;
  for (let mineur = 0; mineur < 2; mineur++) {
    const profil = mineur ? MORCEAUX_KK_MINEUR : MORCEAUX_KK_MAJEUR;
    let mp = 0;
    for (let i = 0; i < 12; i++) mp += profil[i];
    mp /= 12;
    for (let ton = 0; ton < 12; ton++) {
      let sxy = 0, sxx = 0, syy = 0;
      for (let i = 0; i < 12; i++) { const a = h[(i + ton) % 12] - mh, b = profil[i] - mp; sxy += a * b; sxx += a * a; syy += b * b; }
      cles.push({ ton, mineur: !!mineur, r: sxy / Math.sqrt(sxx * syy + 1e-12) });
    }
  }
  return cles.sort((a, b) => b.r - a.r);
}
// la surete (0 a 1) : l'avance de la meilleure sur la premiere qui n'est ni elle ni son ton relatif (do
// majeur et la mineur ont les memes notes : le son jouerait juste avec les deux)
function morceauxSurete(cles) {
  const best = cles[0], relatif = best.mineur ? (best.ton + 3) % 12 : (best.ton + 9) % 12;
  const second = cles.find((c, i) => i > 0 && !(c.mineur !== best.mineur && c.ton === relatif));
  const avance = Math.max(0, Math.min(1, (best.r - second.r) / 0.12)), nette = Math.max(0, Math.min(1, (best.r - 0.3) / 0.4));
  return avance * nette;
}
// ---- fin pur ----

ajouterReglages("Musique", "La musique de l'expo (les morceaux d'un dossier du PC)", [
  { cle: "morceaux", nom: "Jouer les morceaux du dossier (s'il y en a)", type: "case" },
  { cle: "morceauxVolume", nom: "Volume de la musique", type: "curseur", min: 0, max: 1, pas: 0.05 },
  { cle: "morceauxOrdre", nom: "Ordre", type: "choix", options: [["suite", "à la suite, par nom"], ["hasard", "au hasard"]] },
  { cle: "morceauxAccord", nom: "Le son prend la tonalité du morceau", type: "case" },
  { cle: "morceauxGamme", nom: "Il joue", type: "choix", options: [["penta", "cinq notes sûres de la tonalité (pentatonique)"],
    ["entiere", "la gamme entière (majeure ou mineure)"]] },
  { cle: "morceauxMemoire", nom: "Il se souvient des notes pendant (secondes)", type: "curseur", min: 15, max: 300, pas: 15 },
], { morceaux: true, morceauxVolume: 0.5, morceauxOrdre: "suite", morceauxAccord: true, morceauxGamme: "penta", morceauxMemoire: 60 });
// c'est l'installation du lieu (comme l'entree son et l'instrument) : ni les presets, ni le hasard n'y touchent
for (const c of ["morceaux", "morceauxVolume", "morceauxOrdre", "morceauxAccord", "morceauxGamme", "morceauxMemoire"]) {
  PRESET_JAMAIS.add(c); HASARD_JAMAIS.add(c); PC_JAMAIS.add(c);
}
if (typeof ESSENTIEL !== "undefined") for (const c of ["morceaux", "morceauxVolume", "morceauxOrdre", "morceauxAccord", "morceauxGamme"]) ESSENTIEL.add(c);

const morceaux = {
  ctx: null, el: null, sortie: null, gain: null, analyse: null,
  // le dossier
  liste: [], dossier: null, attendu: "", signature: "", sansServeur: false, enListe: false, prochaineListe: 0,
  // la lecture. etat : arret, vide, joue, geste (le navigateur attend un clic), erreur
  courant: null, numero: 0, sac: [], etat: "arret", rates: 0, attenteJusqua: 0, enVeille: false,
  dernierTemps: -1, figeDepuis: 0,
  // l'ecoute : les douze notes (qui s'oublient), celles du morceau entier, le diapason (vecteur moyen)
  db: null, trame: new Float64Array(12), pcs: new Float64Array(12), tout: new Float64Array(12),
  sx: 0, sy: 0, poids: 0, ecoute: 0, ecartPose: 0, ecartConnu: 0, connu: false,
  cle: null, cleDuMorceau: null, rival: null, rivalT: 0, sure: 0, meilleur: null,
  dernierT: 0, prochainCalcul: 0, prochainUI: 0, diapasonPose: 1,
  memoire: { cles: {}, dernier: "" },

  lireMemoire() {
    try {
      const m = JSON.parse(localStorage.getItem(MORCEAUX_CLE) || "{}");
      if (m && typeof m === "object") this.memoire = { cles: m.cles && typeof m.cles === "object" ? m.cles : {}, dernier: String(m.dernier || "") };
    } catch (e) { /* stockage refuse : pas de memoire */ }
  },
  ecrireMemoire() {
    try { localStorage.setItem(MORCEAUX_CLE, JSON.stringify(this.memoire)); } catch (e) { /* tant pis */ }
  },

  // ---- le son ----
  // le volume : le carre du curseur (la moitie du curseur fait un quart du son, -12 dB)
  volume() { const v = clamp(Number(S.morceauxVolume) || 0, 0, 1); return v * v; },
  demarrer() {
    if (this.ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try {
      const c = new AC({ latencyHint: "playback" });
      const el = new Audio();
      el.preload = "auto";
      // la musique : vers les haut-parleurs par le volume, et vers l'analyse (avant le volume : la
      // tonalite se lit pareil a bas volume). sortie : ce que l'onglet Musique peut ecouter (musique.js)
      const src = c.createMediaElementSource(el);
      this.gain = c.createGain(); this.gain.gain.value = this.volume();
      this.analyse = c.createAnalyser(); this.analyse.fftSize = 16384; this.analyse.smoothingTimeConstant = 0;
      src.connect(this.gain); this.gain.connect(c.destination);
      src.connect(this.analyse);
      el.addEventListener("ended", () => this.finMorceau());
      el.addEventListener("error", () => this.rate());
      el.addEventListener("playing", () => { this.rates = 0; this.etat = "joue"; });
      // sans le lanceur spectacle, le navigateur attend un geste avant de laisser sonner une page
      const geste = () => {
        if (!this.ctx) return;
        if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
        if (this.etat === "geste") this.reprendre();
      };
      addEventListener("pointerdown", geste, true); addEventListener("keydown", geste, true);
      this.ctx = c; this.el = el; this.sortie = src;
    } catch (e) { this.ctx = null; return false; }
    return true;
  },
  joue() {
    return !!(S.morceaux && this.ctx && this.courant && !this.el.paused && !this.el.ended && this.el.readyState >= 2 && this.ctx.state === "running");
  },

  // ---- le dossier ----
  async lister() {
    if (this.enListe) return;
    this.enListe = true;
    try {
      const r = await fetch("/hors-ligne/morceaux", { cache: "no-store" });
      if (!r.ok) throw new Error("serveur");
      const d = await r.json();
      this.sansServeur = false;
      this.dossier = d.dossier || null; this.attendu = d.attendu || "";
      if (d.signature !== this.signature) {
        this.signature = d.signature; this.sac = [];
        this.attenteJusqua = 0; this.rates = 0;  // le dossier a change : on n'attend plus (un fichier pose suffit)
        this.liste = (Array.isArray(d.morceaux) ? d.morceaux : []).filter(m => m && typeof m.nom === "string");
        if (this.courant) this.numero = this.liste.findIndex(m => m.nom === this.courant.nom) + 1;
      }
    } catch (e) { this.sansServeur = true; }  // un serveur d'avant ce chantier, ou coupe : on garde la liste qu'on a
    this.enListe = false;
  },

  // ---- la lecture ---- (toutes les 2 s, et a chaque fin de morceau : pas a chaque image, la musique
  // continue quand la fenetre est cachee)
  async veiller() {
    if (this.enVeille) return;
    this.enVeille = true;
    try {
      const t = performance.now() / 1000;
      if (!S.morceaux) {
        if (this.el && !this.el.paused) this.el.pause();
        this.etat = "arret";
        return;
      }
      if (t >= this.prochaineListe) { this.prochaineListe = t + (this.liste.length ? 120 : 30); await this.lister(); }
      if (!this.liste.length) { if (!this.courant) this.etat = "vide"; return; }
      if (!this.demarrer()) { this.etat = "erreur"; return; }
      if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
      if (!this.courant) { if (t >= this.attenteJusqua) this.suivant(); return; }
      const el = this.el;
      if (el.paused && !el.ended) { this.reprendre(); return; }
      // un morceau fige (le fichier a disparu en route, le serveur a ete relance) : au suivant
      if (this.ctx.state === "running" && el.currentTime === this.dernierTemps) { if (t - this.figeDepuis > 20) { this.figeDepuis = t; this.rate(); } }
      else { this.dernierTemps = el.currentTime; this.figeDepuis = t; }
    } finally { this.enVeille = false; }
  },
  reprendre() {
    const p = this.el.play();
    if (p && p.catch) p.catch(e => {
      if (e && e.name === "NotAllowedError") this.etat = "geste";
      else if (e && e.name !== "AbortError") this.rate();
    });
  },
  suivant() {
    const L = this.liste;
    if (!L.length) return;
    let m;
    if (S.morceauxOrdre === "hasard") {
      if (!this.sac.length) {
        this.sac = L.map((x, i) => i);
        for (let i = this.sac.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [this.sac[i], this.sac[j]] = [this.sac[j], this.sac[i]]; }
        // jamais deux fois le meme d'affilee
        const der = this.sac.length - 1;
        if (der > 0 && L[this.sac[der]].nom === this.memoire.dernier) [this.sac[0], this.sac[der]] = [this.sac[der], this.sac[0]];
      }
      m = L[this.sac.pop()];
    } else m = L[(L.findIndex(x => x.nom === this.memoire.dernier) + 1) % L.length];
    this.jouer(m);
  },
  jouer(m) {
    this.garderCle();
    this.courant = m; this.numero = this.liste.indexOf(m) + 1;
    this.memoire.dernier = m.nom; this.ecrireMemoire();
    this.nouveauMorceau(m);
    this.dernierTemps = -1; this.figeDepuis = performance.now() / 1000;
    this.el.src = "/morceaux/" + m.nom.split("/").map(encodeURIComponent).join("/") + "?t=" + (m.modifie || 0);
    this.reprendre();
  },
  finMorceau() {
    this.garderCle();
    this.courant = null; this.attenteJusqua = 0; this.prochaineListe = 0;
    this.veiller();
  },
  // un morceau qui ne se lit pas : au suivant apres 2 s ; s'ils ratent tous, on attend une minute
  rate() {
    if (!this.courant) return;  // deja compte (l'erreur du fichier et le refus de lecture arrivent ensemble)
    this.rates++;
    this.courant = null; this.etat = "erreur"; this.prochaineListe = 0;
    this.attenteJusqua = performance.now() / 1000 + (this.rates >= Math.max(1, this.liste.length) ? 60 : 2);
    if (this.rates >= Math.max(1, this.liste.length)) this.rates = 0;
  },
  passer() {
    if (!this.ctx || !this.liste.length) return;
    this.suivant();
  },

  // ---- l'ecoute ----
  nouveauMorceau(m) {
    this.pcs.fill(0); this.tout.fill(0);
    this.sx = this.sy = this.poids = 0; this.ecoute = 0; this.ecartPose = 0; this.ecartConnu = 0; this.connu = false;
    this.cleDuMorceau = null; this.rival = null; this.rivalT = 0; this.sure = 0; this.meilleur = null;
    // deja entendu : ses douze notes reviennent (elles pesent 30 s), le son prend sa tonalite tout de suite
    const k = this.memoire.cles[m.nom + "|" + m.taille];
    if (k && Array.isArray(k.h) && k.h.length === 12) {
      for (let i = 0; i < 12; i++) this.pcs[i] = (Number(k.h[i]) || 0) * 30;
      this.ecartConnu = this.ecartPose = Number(k.e) || 0;
      this.connu = true;
      this.estimer();
    }
  },
  // a la fin d'un morceau (ecoute au moins 30 s) : ses douze notes et son diapason, pour la prochaine fois
  garderCle() {
    const m = this.courant;
    if (!m || this.ecoute < 30) return;
    let total = 0;
    for (let i = 0; i < 12; i++) total += this.tout[i];
    if (!(total > 0)) return;
    const cles = this.memoire.cles;
    cles[m.nom + "|" + m.taille] = { h: Array.from(this.tout, x => Math.round(x / total * 1000) / 1000), e: Math.round(this.ecart() * 1000) / 1000, d: Date.now() };
    const noms = Object.keys(cles);
    if (noms.length > 400) for (const n of noms.sort((a, b) => (cles[a].d || 0) - (cles[b].d || 0)).slice(0, noms.length - 400)) delete cles[n];
    this.ecrireMemoire();
  },
  // cinq fois par seconde (une minuterie : l'ecoute continue quand la fenetre est cachee)
  battre() {
    const t = performance.now() / 1000, dt = clamp(t - (this.dernierT || t), 0, 0.5);
    this.dernierT = t;
    if (this.gain) this.gain.gain.setTargetAtTime(this.volume(), this.ctx.currentTime, 0.08);
    const joue = this.joue();
    if (joue && dt > 0) {
      const a = this.analyse;
      if (!this.db || this.db.length !== a.frequencyBinCount) this.db = new Float32Array(a.frequencyBinCount);
      a.getFloatFrequencyData(this.db);
      const c = this.trame;
      c.fill(0);
      const r = morceauxChroma(this.db, this.ctx.sampleRate / a.fftSize, this.ecartPose, c);
      if (r) {
        const oubli = Math.pow(0.5, dt / clamp(Number(S.morceauxMemoire) || 60, 15, 600));
        for (let i = 0; i < 12; i++) { this.pcs[i] = this.pcs[i] * oubli + c[i] * dt; this.tout[i] += c[i] * dt; }
        this.sx += r.dx * dt; this.sy += r.dy * dt; this.poids += dt; this.ecoute += dt;
      }
    }
    if (t >= this.prochainCalcul) {
      this.prochainCalcul = t + 1;
      if (joue) this.estimer();
      // la case vient d'etre cochee, l'onglet Son a change la gamme, « Il joue » a change : le son reprend la tonalite
      if (this.impose()) this.poser();
      this.poserDiapason();
    }
    if (t >= this.prochainUI && typeof panneau !== "undefined" && !panneau.hidden) { this.prochainUI = t + 0.5; majMorceauxUI(); }
  },
  // l'ecart du diapason du morceau, en demi-tons (de -0,5 a 0,5). Moins de 7 centiemes : c'est 440
  ecart() {
    if (this.poids < 4) return this.ecartConnu;
    if (Math.hypot(this.sx, this.sy) / this.poids < 0.45) return 0;
    const e = Math.atan2(this.sy, this.sx) / (2 * Math.PI);
    return Math.abs(e) < 0.07 ? 0 : e;
  },
  diapasonHz() { return 440 * Math.pow(2, this.ecart() / 12); },
  estimer() {
    let total = 0;
    for (let i = 0; i < 12; i++) total += this.pcs[i];
    if (total < 3) { this.sure = 0; this.meilleur = null; return; }
    const cles = morceauxCles(this.pcs), best = cles[0], meme = (a, b) => a && b && a.ton === b.ton && a.mineur === b.mineur;
    this.sure = morceauxSurete(cles);
    this.meilleur = best;
    this.ecartPose = this.ecart();
    const cur = this.cleDuMorceau;
    if (!cur) {
      if (this.connu || this.ecoute >= 8 && (this.sure >= 0.3 || this.ecoute >= 20)) this.adopter(best);
      return;
    }
    if (meme(best, cur)) { this.rival = null; this.rivalT = 0; return; }
    if (meme(best, this.rival)) this.rivalT++;
    else { this.rival = best; this.rivalT = 0; }
    const actuel = cles.find(c => meme(c, cur));
    if (this.rivalT >= 8 && best.r > actuel.r + 0.04) this.adopter(best);
  },
  adopter(c) {
    this.cle = this.cleDuMorceau = { ton: c.ton, mineur: c.mineur };
    this.rival = null; this.rivalT = 0;
    if (this.impose()) this.poser();
  },

  // ---- ce que le son en fait ----
  // tant que la musique joue (et un instant apres, entre deux morceaux), sa tonalite passe avant le tirage
  impose() { return !!(S.morceaux && S.morceauxAccord && this.cle && this.etat === "joue"); },
  gammeDe(c) { return S.morceauxGamme === "entiere" ? (c.mineur ? "mineur" : "majeur") : (c.mineur ? "pentaMin" : "pentaMaj"); },
  // le son prend la tonalite du morceau (sans rien ecrire dans S, comme l'instrument)
  poser() {
    const gi = GAMMES.findIndex(x => x[0] === this.gammeDe(this.cle));
    if (gi < 0 || (son.gi === gi && son.tonique === this.cle.ton)) return;
    son.gi = gi; son.tonique = this.cle.ton;
    son.degreCourant = Math.floor(Math.random() * son.gamme().length);
    if (son.tex) son.tex.pool = [];
    if (son.ctx) son.accorder(false);
    majSonUI();
  },
  // le diapason du son : celui du morceau quand il mene ; le bourdon et la nappe se raccordent s'il a
  // bouge de plus de 2 centiemes. Sans musique, l'instrument (ou 440) reprend la main
  poserDiapason() {
    if (!this.impose()) return;
    const r = Math.pow(2, this.ecart() / 12);
    son.diapason = r;
    if (Math.abs(1200 * Math.log2(r / this.diapasonPose)) > 2) { this.diapasonPose = r; if (son.ctx) son.accorder(false); }
  },
  nomCle(c) { return c ? NOTES_NOMS[c.ton] + (c.mineur ? " mineur" : " majeur") : ""; },
};

(function brancherMorceaux() {
  // la tonalite du morceau passe avant celle de l'instrument, qui passe avant le tirage
  const imposeAvant = instrument.impose;
  instrument.impose = function () { return !morceaux.impose() && imposeAvant.apply(this, arguments); };
  const diapasonAvant = instrument.poserDiapason;
  instrument.poserDiapason = function () {
    // (diapasonPose suit : quand la musique s'arrete, l'instrument voit l'ecart et raccorde le bourdon)
    if (morceaux.impose()) { son.diapason = this.diapasonPose = Math.pow(2, morceaux.ecart() / 12); return; }
    return diapasonAvant.apply(this, arguments);
  };
  const gammeAvant = son.nouvelleGamme;
  son.nouvelleGamme = function () {
    if (morceaux.impose()) { morceaux.poser(); return; }
    return gammeAvant.apply(this, arguments);
  };
  const motifAvant = son.tirerMotif;
  son.tirerMotif = function () {
    const r = motifAvant.apply(this, arguments);
    if (morceaux.impose()) morceaux.poser();
    return r;
  };
  // l'onglet Musique : ce qui joue, sous l'entree son et l'instrument
  const musiqueAvant = construireMusique;
  construireMusique = function (page) {
    musiqueAvant.apply(this, arguments);
    const fs = document.createElement("fieldset");
    fs.innerHTML = `<legend>La musique de l'expo : ce qui joue</legend>
      <div class="etat-gen" id="morceaux-etat">…</div>
      <canvas class="vumetre" id="morceaux-vu" width="360" height="44" style="margin-top:6px"></canvas>
      <div class="rangee"><button type="button" class="bouton" id="morceaux-suivant">Morceau suivant</button>
      <button type="button" class="bouton" id="morceaux-relire">Relire le dossier</button></div>
      <p style="margin:7px 0 0;color:#404040">Pose des morceaux (mp3, wav, flac, ogg, m4a) dans le dossier <b id="morceaux-dossier">Bureau\\MUSIQUE-EXPO</b> de ce PC : ils jouent à la suite, sans fin, et le son de l'écran prend la tonalité de chacun. Dossier vide ou absent : pas de musique. Pour que les mots dansent dessus : « Écouter », source « Les morceaux du dossier ».</p>`;
    page.appendChild(fs);
    fs.querySelector("#morceaux-suivant").addEventListener("click", () => morceaux.passer());
    fs.querySelector("#morceaux-relire").addEventListener("click", () => { morceaux.prochaineListe = 0; morceaux.veiller().then(majMorceauxUI); });
    setTimeout(majMorceauxUI, 0);
  };
  morceaux.lireMemoire();
  setInterval(() => morceaux.veiller(), 2000);
  setInterval(() => morceaux.battre(), 180);
  morceaux.veiller();
})();

function majMorceauxUI() {
  const el = document.getElementById("morceaux-etat");
  if (!el) return;
  const M = morceaux, duree = s => isFinite(s) ? Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0") : "…";
  const d = document.getElementById("morceaux-dossier");
  if (d && (M.dossier || M.attendu)) d.textContent = M.dossier || M.attendu;
  let t;
  if (!S.morceaux) t = "La musique est coupée : coche « Jouer les morceaux du dossier » (plus bas).";
  else if (M.sansServeur && !M.liste.length) t = "Le serveur de l'écran ne connaît pas encore la musique : il faut le fermer et le relancer (poiasie.bat).";
  else if (!M.liste.length) t = "Pas de morceau : " + (M.dossier ? "le dossier " + M.dossier + " est vide." : "le dossier " + (M.attendu || "Bureau\\MUSIQUE-EXPO") + " n'existe pas encore.");
  else if (M.etat === "geste") t = "En attente d'un clic sur l'écran (le navigateur l'exige avant de laisser sonner). " + M.liste.length + " morceaux.";
  else if (!M.courant) t = M.etat === "erreur" ? "Un morceau ne se lit pas : il passe au suivant." : "Il lance la musique…";
  else {
    t = "Morceau " + M.numero + " sur " + M.liste.length + " : " + M.courant.nom + " (" + duree(M.el.currentTime) + " / " + duree(M.el.duration) + ").";
    t += M.cleDuMorceau ? " Tonalité : " + M.nomCle(M.cleDuMorceau) + ", sûre à " + Math.round(M.sure * 100) + " %" + (M.connu ? " (déjà entendu)." : ".")
      : " Tonalité : il écoute encore" + (M.meilleur ? " (" + M.nomCle(M.meilleur) + " ?)" : "") + ".";
    t += " Diapason : la = " + M.diapasonHz().toFixed(1).replace(".", ",") + " Hz.";
    t += M.cle ? (M.impose() ? " Le son la prend (" + son.nomGamme() + ")." : " Le son garde la sienne (case « Le son prend la tonalité du morceau »).") : "";
  }
  if (el.textContent !== t) el.textContent = t;
  dessinerMorceaux();
}
// les douze notes entendues (celles que le son joue en couleur, la tonique plus claire)
function dessinerMorceaux() {
  const c = document.getElementById("morceaux-vu");
  if (!c || c.offsetParent === null) return;
  const g = c.getContext("2d"), w = c.width, h = c.height, M = morceaux;
  g.fillStyle = "#000"; g.fillRect(0, 0, w, h);
  let max = 0;
  for (let i = 0; i < 12; i++) max = Math.max(max, M.pcs[i]);
  const dans = new Set(), k = M.cleDuMorceau;
  if (k) for (const x of (GAMMES.find(y => y[0] === M.gammeDe(k)) || GAMMES[0])[2]) dans.add((Math.round(x) + k.ton) % 12);
  const lw = (w - 8) / 12;
  g.font = "9px Consolas, monospace"; g.textAlign = "center"; g.textBaseline = "alphabetic";
  for (let i = 0; i < 12; i++) {
    const x = 4 + i * lw, v = max > 0 ? M.pcs[i] / max : 0;
    g.fillStyle = k && i === k.ton ? "#ffd040" : dans.has(i) ? "#40b0ff" : "#555";
    g.fillRect(x + 2, h - 14 - v * (h - 20), lw - 4, Math.max(1, v * (h - 20)));
    g.fillStyle = "#aaa"; g.fillText(NOTES_NOMS[i], x + lw / 2, h - 3);
  }
  g.textAlign = "left";
}
