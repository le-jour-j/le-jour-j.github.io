"use strict";
/* ================================================================ les entrees dans les effets (2026-10-23) */

// Jiiji, 2026-10-23 : « j'aimerais pouvoir mettre des effets sur les entrees analogiques », puis : deux
// chaines separees (la flute sur l'entree 1, la voix sur la 2), et tous les effets proposes :
// harmoniseur et shimmer, boucle et gel, bruitiste (saturation, anneau accorde sur la gamme, lo-fi),
// mouvement (flanger, phaser, filtre qui s'ouvre avec le jeu, echo ping-pong).
//
// Avant, une seule chaine (son.js, « La voix dans le son ») recevait l'entree son melangee. Ici, deux voies,
// chacune sur l'entree 1, l'entree 2 ou les deux (musique.js demande desormais deux canaux a la carte ;
// un micro seul n'en a qu'un, l'entree 2 est alors muette). Quand une voie est allumee, la chaine de la
// voix se tait (sinon l'entree passerait deux fois dans les effets).
//
// Une voie, dans l'ordre du son :
//   entree 1 / 2 -> coupe-graves, coupe-aigus -> saturation -> anneau -> filtre qui s'ouvre (wah) ->
//   flanger ou phaser -> le travail (lo-fi, boucle, gel : un AudioWorklet, voir VOIE_TRAVAIL) ->
//   le son vif, la boucle, le gel -> harmoniseur -> doublage, salle (et shimmer), echo (ou ping-pong)
//   -> limiteur, garde contre le larsen (son.gardeLarsen), niveau -> le limiteur general du son.
// Chaque effet a son dosage ; a 0 il ne colore rien. Le son sec est a 0 par defaut : l'instrument est
// deja dans la sono, l'ecran n'ajoute que les effets (comme pour la voix).
//
// L'harmoniseur est un decaleur a deux retards (la tete de lecture glisse, deux fenetres en fondu
// croise, egales en puissance) : pas de code audio a part, quelques dizaines de ms de retard. Le shimmer :
// la salle rejoue dans un decaleur a l'octave, qui revient dans la salle (retour plafonne).
// La boucle : jusqu'a 60 s, une pedale (enregistrer, jouer, ajouter par-dessus), arreter, effacer ; elle
// peut s'user a chaque tour. Le gel : les 0,7 dernieres secondes, rejouees en grains, une nappe tenue ; en
// automatique, il prend la derniere note tenue quand on s'arrete et la lache quand on rejoue.
// Touches (le clavier n'a plus de lettre libre) : < et > (Maj + <) la pedale des entrees 1 et 2,
// ù et % (Maj + ù) le gel, $ et £ (Maj + $) arreter ou reprendre la boucle, tenu une seconde : l'effacer.

const VOIE_TEMPS = [["250", "250 ms"], ["380", "380 ms"], ["500", "500 ms"], ["750", "750 ms"], ["1000", "une seconde"],
  ["b0.5", "un demi-battement (son ou musique)"], ["b0.75", "trois quarts de battement"], ["b1", "un battement"], ["b1.5", "un battement et demi"]];
const VOIE_DEFAUTS = { Actif: false, Niveau: 0.8, Sec: 0, Hp: 80, Lp: 14000, Garde: true,
  Sature: 0, Anneau: 0, AnneauNote: "tonique", Lofi: 0,
  Wah: 0, Module: "aucun", ModVitesse: 0.3, ModProf: 0.5,
  Harmo: 0, HarmoIntervalle: "12", Shimmer: 0, Double: 0, Rev: 0.35, Salle: 3, Echo: 0.2, Retour: 0.35, EchoTemps: "380", PingPong: false,
  Boucle: 1, Usure: 0, Gel: 0.8, GelAuto: false };
const VOIE_ESSENTIEL = ["Actif", "Source", "Niveau", "Sature", "Anneau", "Lofi", "Wah", "Module", "Harmo", "Shimmer", "Rev", "Echo", "Boucle", "Gel", "GelAuto"];

for (const n of [1, 2]) {
  const k = x => "e" + n + x, d = {};
  for (const x in VOIE_DEFAUTS) d[k(x)] = VOIE_DEFAUTS[x];
  d[k("Source")] = String(n); d[k("Place")] = n === 1 ? -0.25 : 0.25;
  ajouterReglages("Entrées", "Entrée " + n + " : la voie", [
    { cle: k("Actif"), nom: "L'entrée " + n + " passe dans les effets", type: "case" },
    { cle: k("Source"), nom: "Elle prend", type: "choix", options: [["1", "l'entrée 1 de la carte son"], ["2", "l'entrée 2 de la carte son"], ["12", "les entrées 1 et 2 mélangées"]] },
    { cle: k("Niveau"), nom: "Niveau", type: "curseur", min: 0, max: 1.5, pas: 0.05 },
    { cle: k("Sec"), nom: "Son sec (0 : seulement les effets, l'instrument est déjà dans la sono)", type: "curseur", min: 0, max: 1, pas: 0.05 },
    { cle: k("Place"), nom: "Place (gauche ↔ droite)", type: "curseur", min: -1, max: 1, pas: 0.05 },
    { cle: k("Hp"), nom: "Coupe les graves sous (Hz)", type: "curseur", min: 20, max: 600, pas: 10 },
    { cle: k("Lp"), nom: "Coupe les aigus au-dessus de (Hz)", type: "curseur", min: 1000, max: 18000, pas: 250 },
    { cle: k("Garde"), nom: "Garde contre le larsen (à décocher au casque : une note de flûte tenue lui ressemble)", type: "case" },
  ], {});
  ajouterReglages("Entrées", "Entrée " + n + " : bruit", [
    { cle: k("Sature"), nom: "Saturation", type: "curseur", min: 0, max: 1, pas: 0.05 },
    { cle: k("Anneau"), nom: "Modulation en anneau (métal, cloche fausse)", type: "curseur", min: 0, max: 1, pas: 0.05 },
    { cle: k("AnneauNote"), nom: "L'anneau sonne sur", type: "choix", options: [["tonique", "la tonique de la gamme du son"], ["quinte", "la quinte de la gamme"],
      ["haut", "la tonique, deux octaves plus haut"], ["gamme", "une note de la gamme, qui change toutes les 4 s"], ["jouee", "la note jouée (onglet Musique, l'instrument)"]] },
    { cle: k("Lofi"), nom: "Lo-fi (moins de bits, moins d'échantillons)", type: "curseur", min: 0, max: 1, pas: 0.05 },
  ], {});
  ajouterReglages("Entrées", "Entrée " + n + " : mouvement", [
    { cle: k("Wah"), nom: "Le filtre s'ouvre quand on joue fort (wah)", type: "curseur", min: 0, max: 1, pas: 0.05 },
    { cle: k("Module"), nom: "Modulation", type: "choix", options: [["aucun", "aucune"], ["flanger", "flanger (un avion qui passe)"], ["phaser", "phaser (le son tourne)"]] },
    { cle: k("ModVitesse"), nom: "Vitesse de la modulation (par seconde)", type: "curseur", min: 0.02, max: 6, pas: 0.02 },
    { cle: k("ModProf"), nom: "Profondeur de la modulation", type: "curseur", min: 0, max: 1, pas: 0.05 },
  ], {});
  ajouterReglages("Entrées", "Entrée " + n + " : harmoniseur et espace", [
    { cle: k("Harmo"), nom: "Harmoniseur (une seconde voix décalée)", type: "curseur", min: 0, max: 1, pas: 0.05 },
    { cle: k("HarmoIntervalle"), nom: "Elle sonne", type: "choix", options: [["12", "une octave au-dessus"], ["-12", "une octave en dessous"],
      ["7", "une quinte au-dessus"], ["-5", "une quarte en dessous"], ["19", "une octave et une quinte au-dessus"], ["24", "deux octaves au-dessus"], ["-24", "deux octaves en dessous"]] },
    { cle: k("Shimmer"), nom: "Shimmer (la salle monte d'une octave)", type: "curseur", min: 0, max: 1, pas: 0.05 },
    { cle: k("Double"), nom: "Doublage (un chorus léger)", type: "curseur", min: 0, max: 1, pas: 0.05 },
    { cle: k("Rev"), nom: "Réverbération", type: "curseur", min: 0, max: 1, pas: 0.05 },
    { cle: k("Salle"), nom: "Durée de la salle (secondes)", type: "curseur", min: 0.5, max: 10, pas: 0.1 },
    { cle: k("Echo"), nom: "Écho", type: "curseur", min: 0, max: 1, pas: 0.05 },
    { cle: k("Retour"), nom: "Retour de l'écho (plafonné : il retombe toujours)", type: "curseur", min: 0, max: 0.75, pas: 0.05 },
    { cle: k("EchoTemps"), nom: "L'écho revient après", type: "choix", options: VOIE_TEMPS },
    { cle: k("PingPong"), nom: "L'écho va de gauche à droite (ping-pong)", type: "case" },
  ], {});
  ajouterReglages("Entrées", "Entrée " + n + " : boucle et gel", [
    { cle: k("Boucle"), nom: "Niveau de la boucle", type: "curseur", min: 0, max: 1.5, pas: 0.05 },
    { cle: k("Usure"), nom: "La boucle s'use à chaque tour (0 : elle tourne pareil)", type: "curseur", min: 0, max: 1, pas: 0.05 },
    { cle: k("Gel"), nom: "Niveau du gel", type: "curseur", min: 0, max: 1.5, pas: 0.05 },
    { cle: k("GelAuto"), nom: "Le gel prend la dernière note tenue quand tu t'arrêtes", type: "case" },
  ], d);
  // l'installation du soir : ni presets ni hasard ; l'essentiel en vue dans le panneau range
  for (const c in d) { PRESET_JAMAIS.add(c); HASARD_JAMAIS.add(c); PC_JAMAIS.add(c); }
  if (typeof ESSENTIEL !== "undefined") for (const x of VOIE_ESSENTIEL) ESSENTIEL.add(k(x));
}

// le travail, dans le fil du son : lo-fi (bits et echantillons tenus), boucle, gel en grains.
// Sorties : 0 le son vif, 1 la boucle, 2 le gel (mono, chacune)
const VOIE_TRAVAIL = `
class Voie extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{ name: "lofi", defaultValue: 0, minValue: 0, maxValue: 1, automationRate: "k-rate" },
      { name: "usure", defaultValue: 0, minValue: 0, maxValue: 1, automationRate: "k-rate" }];
  }
  constructor() {
    super();
    this.max = Math.floor(sampleRate * 60); this.boucle = new Float32Array(this.max); this.long = 0; this.pos = 0; this.etat = "vide";
    this.histoire = new Float32Array(Math.floor(sampleRate * 3)); this.h = 0;
    this.gel = null; this.gelOn = false; this.gelG = 0; this.grains = [];
    this.tenu = 0; this.compte = 0; this.lp = 0; this.fondu = Math.floor(sampleRate * 0.006);
    this.port.onmessage = e => this.commande(e.data);
  }
  dire() { this.port.postMessage({ etat: this.etat, long: this.long / sampleRate, gel: this.gelOn }); }
  grain() { const L = Math.floor(sampleRate * 0.2); return { debut: Math.floor(Math.random() * (this.gel.length - L)), i: 0, L }; }
  commande(d) {
    if (d === "pedale") {
      if (this.etat === "vide") { this.etat = "enregistre"; this.pos = 0; }
      else if (this.etat === "enregistre") { this.long = Math.max(this.pos, Math.floor(sampleRate * 0.25)); this.pos = 0; this.etat = "joue"; }
      else if (this.etat === "joue") this.etat = "ajoute";
      else if (this.etat === "ajoute") this.etat = "joue";
      else if (this.etat === "arrete") { this.etat = "joue"; this.pos = 0; }
    } else if (d === "arreter") {
      if (this.etat === "joue" || this.etat === "ajoute") this.etat = "arrete";
      else if (this.etat === "arrete") { this.etat = "joue"; this.pos = 0; }
      else if (this.etat === "enregistre") { this.long = Math.max(this.pos, Math.floor(sampleRate * 0.25)); this.pos = 0; this.etat = "arrete"; }
    } else if (d === "effacer") { this.etat = "vide"; this.long = 0; this.pos = 0; }  // la prochaine prise ecrase l'ancienne
    else if (d && d.gel !== undefined) {
      if (d.gel) {
        const L = Math.floor(sampleRate * 0.7), recul = Math.floor(sampleRate * (d.recul || 0)), H = this.histoire.length;
        this.gel = new Float32Array(L);
        for (let i = 0; i < L; i++) this.gel[i] = this.histoire[(this.h - recul - L + i + 2 * H) % H];
        this.grains = [0, 1, 2, 3].map(j => { const g = this.grain(); g.i = Math.floor(j * g.L / 4); return g; });
        this.gelOn = true;
      } else this.gelOn = false;
    }
    this.dire();
  }
  process(entrees, sorties, p) {
    const x = entrees[0] && entrees[0][0], vif = sorties[0][0], bo = sorties[1][0], ge = sorties[2][0], n = vif.length;
    const k = p.lofi[0], usure = p.usure[0], H = this.histoire.length;
    const pas = k > 0.001 ? 2 / Math.pow(2, 16 - k * 13) : 0, tenir = 1 + Math.floor(k * k * 20), fb = 1 - usure * 0.12;
    for (let i = 0; i < n; i++) {
      let v = x ? x[i] : 0;
      if (pas) { if (this.compte++ % tenir === 0) this.tenu = Math.round(v / pas) * pas; v = this.tenu; }
      vif[i] = v;
      this.histoire[this.h] = v; this.h = (this.h + 1) % H;
      let y = 0;
      const e = this.etat;
      if (e === "enregistre") {
        this.boucle[this.pos++] = v;
        if (this.pos >= this.max) { this.long = this.max; this.pos = 0; this.etat = "joue"; this.dire(); }
      } else if ((e === "joue" || e === "ajoute") && this.long) {
        const q = this.pos, brut = this.boucle[q];
        // l'usure : la bande perd un peu d'aigus et de niveau a chaque tour
        this.lp += (brut - this.lp) * (1 - usure * 0.6);
        const b = usure > 0 ? this.lp * fb : brut;
        this.boucle[q] = e === "ajoute" ? b + v : b;
        y = b * Math.min(1, q / this.fondu, (this.long - 1 - q) / this.fondu);
        this.pos = (q + 1) % this.long;
      }
      bo[i] = y;
      let z = 0;
      if (this.gel && (this.gelOn || this.gelG > 0)) {
        this.gelG += ((this.gelOn ? 1 : 0) - this.gelG) * (this.gelOn ? 0.0003 : 0.00003);
        for (const g of this.grains) {
          z += this.gel[g.debut + g.i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * g.i / g.L));
          if (++g.i >= g.L) Object.assign(g, this.grain());
        }
        z *= 0.5 * this.gelG;
        if (!this.gelOn && this.gelG < 0.0005) this.gelG = 0;
      }
      ge[i] = z;
    }
    return true;
  }
}
registerProcessor("poiasie-voie", Voie);
`;

// le decaleur de hauteur : deux retards dont la tete glisse (une rampe), chacun dans sa fenetre (cosinus
// de la rampe : nulle au saut), la seconde decalee d'une demi-periode. La rampe est un vrai segment lu en
// boucle, pas une dent de scie d'oscillateur : celle-ci, lissee, ondule pres du saut, et l'ondulation de
// la tete faisait des raies parasites a 12 dB sous la note (mesure du 2026-10-23).
// Sur une note tenue, ce decaleur ne sonne juste que si sa demi-fenetre A est un multiple de la periode
// de la note : sinon le son se partage entre deux raies voisines (869 et 897 Hz pour 880), qui battent.
// caler(hz) pose A sur la note entendue (environ 35 ms) : 880, 659, 220 Hz justes, voisines a -25 dB.
function decaleur(c) {
  const Amax = 0.05, base = Amax + 0.003, L = Math.round(c.sampleRate / 10);
  const rampe = c.createBuffer(1, L, c.sampleRate), v = rampe.getChannelData(0);
  for (let i = 0; i < L; i++) v[i] = -1 + 2 * (i + 0.5) / L;
  const fenetre = new Float32Array(1025);
  for (let i = 0; i <= 1024; i++) fenetre[i] = Math.cos((i / 512 - 1) * Math.PI / 2);
  const D = { entree: c.createGain(), sortie: c.createGain(), tetes: [], profs: [], demi: null, A: 0.035, hz: 0 };
  for (let j = 0; j < 2; j++) {
    const o = c.createBufferSource(); o.buffer = rampe; o.loop = true; o.role = "lfo";
    const d = c.createDelay(base + Amax + 0.01); d.delayTime.value = base;
    const prof = c.createGain(); prof.gain.value = 0; o.connect(prof); prof.connect(d.delayTime);
    const forme = c.createWaveShaper(); forme.curve = fenetre; o.connect(forme);
    const tap = c.createGain(); tap.gain.value = 0; forme.connect(tap.gain);
    D.entree.connect(d); d.connect(tap); tap.connect(D.sortie);
    D.tetes.push(o); D.profs.push(prof);
  }
  const t0 = c.currentTime + 0.01;
  D.tetes[0].start(t0, 0); D.tetes[1].start(t0, rampe.duration / 2);
  // la tete glisse de (1 - rapport) seconde par seconde : la rampe parcourt 2A en 1/f
  const poser = t => {
    const r = Math.pow(2, D.demi / 12), f = Math.abs(1 - r) / (2 * D.A), s = r > 1 ? -1 : 1;
    D.tetes.forEach(o => o.playbackRate.setValueAtTime(f / 10, t));
    D.profs.forEach(p => p.gain.setValueAtTime(s * D.A, t));
  };
  D.regler = (demi, t) => { if (demi !== D.demi) { D.demi = demi; poser(t); } };
  D.caler = (hz, t) => {
    if (!(hz > 40) || (D.hz && Math.abs(12 * Math.log2(hz / D.hz)) < 0.3)) return;
    D.hz = hz;
    D.A = Math.min(Amax, Math.max(1, Math.round(0.035 * hz)) / hz);
    if (D.demi !== null) poser(t);
  };
  return D;
}

const entrees = {
  voies: [null, null], flux: null, src: null, coupe: null, canaux: 0, travail: null, travailFini: false, travailOk: false,
  prochainUI: 0, noteAnneau: 0, anneauT: 0,
  voulu() { return !!(S.e1Actif || S.e2Actif); },
  active(n) {
    return !!(S["e" + n + "Actif"] && S.musique && musique.actif && musique.flux && musique.flux.getAudioTracks().length
      && (S.musiqueSource === "micro" || S.musiqueSource === "melange"));
  },
  // le travail (AudioWorklet) se charge une fois ; sans lui, les voies marchent sans boucle, gel ni lo-fi
  chargerTravail(c) {
    if (this.travail) return;
    if (!c.audioWorklet) { this.travail = Promise.resolve(); this.travailFini = true; return; }
    const url = URL.createObjectURL(new Blob([VOIE_TRAVAIL], { type: "application/javascript" }));
    this.travail = c.audioWorklet.addModule(url).then(() => { this.travailOk = true; })
      .catch(e => console.warn("poiasie : le travail des entrées (boucle, gel) ne se charge pas", e))
      .finally(() => { this.travailFini = true; URL.revokeObjectURL(url); });
  },
  // toutes les 60 ms, avec la voix (son.voixMaj)
  maj() {
    const c = son.ctx;
    if (!c || !(c instanceof AudioContext)) return;
    if (!this.voulu() && !this.voies[0] && !this.voies[1]) return;
    this.chargerTravail(c);
    const t = son.maintenant();
    const flux = this.active(1) || this.active(2) ? musique.flux : null;
    if (flux !== this.flux) this.rebrancher(c, flux);
    for (const n of [1, 2]) {
      if (this.active(n) && !this.voies[n - 1] && this.travailFini) { this.voies[n - 1] = this.creerVoie(c, n); this.brancherVoie(this.voies[n - 1]); }
      const V = this.voies[n - 1];
      if (!V) continue;
      this.appliquerVoie(V, n, t, false);
      if (this.active(n)) { son.gardeLarsen(t, V); this.ecouterVoie(V, n, t); }
    }
    const tt = performance.now() / 1000;
    if (tt >= this.prochainUI && typeof panneau !== "undefined" && !panneau.hidden) { this.prochainUI = tt + 0.2; majEntreesUI(); }
  },
  rebrancher(c, flux) {
    if (this.src) { try { this.src.disconnect(); } catch (e) { /* deja fait */ } }
    if (this.coupe) { try { this.coupe.disconnect(); } catch (e) { /* deja fait */ } }
    this.src = null; this.coupe = null; this.flux = flux; this.canaux = 0;
    if (!flux) return;
    const pistes = flux.getAudioTracks();
    this.canaux = (pistes[0] && pistes[0].getSettings && pistes[0].getSettings().channelCount) || 1;
    this.src = c.createMediaStreamSource(new MediaStream(pistes));
    this.coupe = c.createChannelSplitter(2);
    this.src.connect(this.coupe);
    for (const V of this.voies) if (V) this.brancherVoie(V);
    for (const V of this.voies) if (V) V.signature = "";
  },
  brancherVoie(V) {
    if (!this.coupe) return;
    this.coupe.connect(V.a, 0); this.coupe.connect(V.b, 1);
  },

  creerVoie(c, n) {
    const G = v => { const g = c.createGain(); g.gain.value = v === undefined ? 1 : v; return g; };
    const F = (type, f, q) => { const b = c.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q !== undefined) b.Q.value = q; return b; };
    const V = { n, signature: "", etat: { etat: "vide", long: 0, gel: false }, niveau: 0, crete: 0.01, tenue: 0, gelAuto: false,
      tenu: 0, picAvant: -1, plafond: 1, larsen: false, larsens: 0, finLarsen: -9, salleFaite: 0 };
    V.a = G(0); V.b = G(0); V.porte = G(0);
    V.a.connect(V.porte); V.b.connect(V.porte);
    V.hp = F("highpass", 80, 0.7); V.lp = F("lowpass", 14000, 0.5);
    V.porte.connect(V.hp); V.hp.connect(V.lp);
    V.oreille = c.createAnalyser(); V.oreille.fftSize = 2048; V.oreille.smoothingTimeConstant = 0;
    V.spectre = new Float32Array(V.oreille.frequencyBinCount); V.forme = new Float32Array(V.oreille.fftSize);
    V.lp.connect(V.oreille);
    // la saturation : tanh(3u), u = l'entree poussee ; melangee au son net
    V.satSec = G(1); V.satPre = G(1); V.sat = c.createWaveShaper(); V.sat.oversample = "4x"; V.satMouille = G(0);
    const courbe = new Float32Array(2049);
    for (let i = 0; i <= 2048; i++) courbe[i] = Math.tanh(3 * (i / 1024 - 1));
    V.sat.curve = courbe;
    const postSat = G();
    V.lp.connect(V.satSec); V.satSec.connect(postSat);
    V.lp.connect(V.satPre); V.satPre.connect(V.sat); V.sat.connect(V.satMouille); V.satMouille.connect(postSat);
    // l'anneau : le son multiplie par une sinusoide accordee sur la gamme
    V.anSec = G(1); V.anneau = G(0); V.anMouille = G(0);
    V.anOsc = c.createOscillator(); V.anOsc.frequency.value = 220; V.anOsc.role = "auto"; V.anOsc.connect(V.anneau.gain); V.anOsc.start();
    const postAn = G();
    postSat.connect(V.anSec); V.anSec.connect(postAn); postSat.connect(V.anneau); V.anneau.connect(V.anMouille); V.anMouille.connect(postAn);
    // le wah : un filtre resonant dont la frequence suit l'enveloppe du jeu (redressee, lissee), dans le graphe
    V.wahSec = G(1); V.wahF = F("lowpass", 350, 6); V.wahMouille = G(0);
    const envPre = G(6), abs = c.createWaveShaper(), envLp = F("lowpass", 7, 0.5), envProf = G(3500);
    const cAbs = new Float32Array(1025);
    for (let i = 0; i <= 1024; i++) cAbs[i] = Math.abs(i / 512 - 1);
    abs.curve = cAbs;
    postAn.connect(envPre); envPre.connect(abs); abs.connect(envLp); envLp.connect(envProf); envProf.connect(V.wahF.frequency);
    const postWah = G();
    postAn.connect(V.wahSec); V.wahSec.connect(postWah); postAn.connect(V.wahF); V.wahF.connect(V.wahMouille); V.wahMouille.connect(postWah);
    // flanger (un retard tres court qui ondule, avec retour) et phaser (quatre passe-tout qui tournent)
    const colore = G();
    V.modSec = G(1); postWah.connect(V.modSec); V.modSec.connect(colore);
    V.modLfo = c.createOscillator(); V.modLfo.frequency.value = 0.3; V.modLfo.role = "lfo"; V.modLfo.start();
    V.fl = c.createDelay(0.03); V.fl.delayTime.value = 0.004; V.flFb = G(0); V.flMouille = G(0);
    const flProf = G(0.0028); V.modLfo.connect(flProf); flProf.connect(V.fl.delayTime);
    postWah.connect(V.fl); V.fl.connect(V.flFb); V.flFb.connect(V.fl); V.fl.connect(V.flMouille); V.flMouille.connect(colore);
    const phProf = G(550);
    V.modLfo.connect(phProf);
    let avant = postWah;
    for (let i = 0; i < 4; i++) { const ap = F("allpass", 750 + i * 180, 0.6); phProf.connect(ap.frequency); avant.connect(ap); avant = ap; }
    V.phMouille = G(0); avant.connect(V.phMouille); V.phMouille.connect(colore);
    // le travail : lo-fi, boucle, gel
    let vif = colore, boucle = null, gel = null;
    if (this.travailOk) {
      try {
        V.travail = new AudioWorkletNode(c, "poiasie-voie", { numberOfInputs: 1, numberOfOutputs: 3, outputChannelCount: [1, 1, 1], channelCount: 1, channelCountMode: "explicit" });
        V.travail.port.onmessage = e => { V.etat = e.data; majEntreesUI(); };
        colore.connect(V.travail);
        vif = G(); boucle = G(); gel = G();
        V.travail.connect(vif, 0); V.travail.connect(boucle, 1); V.travail.connect(gel, 2);
      } catch (e) { console.warn("poiasie : pas de travail pour l'entrée " + n, e); V.travail = null; }
    }
    // les sorties : le centre (mono, place gauche droite), l'espace (ce qui part dans les effets d'espace)
    const centre = G(), pre = G(), espace = G();
    V.mix = G();
    V.place = c.createStereoPanner(); centre.connect(V.place); V.place.connect(V.mix);
    V.sec = G(0); vif.connect(V.sec); V.sec.connect(centre); vif.connect(pre);
    V.boucleG = G(1); V.gelG = G(0.8);
    if (boucle) { boucle.connect(V.boucleG); V.boucleG.connect(centre); V.boucleG.connect(pre); }
    if (gel) { gel.connect(V.gelG); V.gelG.connect(centre); V.gelG.connect(pre); }
    V.harmo = decaleur(c); V.harmoG = G(0);
    pre.connect(V.harmo.entree); V.harmo.sortie.connect(V.harmoG); V.harmoG.connect(centre); V.harmoG.connect(espace);
    pre.connect(espace);
    // le doublage : deux retards courts qui ondulent, l'un a gauche, l'autre a droite
    V.double = G(0); V.double.connect(V.mix);
    for (const [b, vit, prof, pan] of [[0.019, 0.23, 0.0035, -0.6], [0.027, 0.31, 0.004, 0.6]]) {
      const d = c.createDelay(0.06), l = c.createOscillator(), lg = G(prof), pl = c.createStereoPanner();
      d.delayTime.value = b; l.frequency.value = vit; l.role = "lfo"; pl.pan.value = pan;
      l.connect(lg); lg.connect(d.delayTime); l.start(); espace.connect(d); d.connect(pl); pl.connect(V.double);
    }
    // la salle, et le shimmer : la salle repasse par un decaleur a l'octave et revient dans la salle
    V.envoiRev = G(0);
    const hpR = F("highpass", 180, 0.7);
    V.rev = c.createConvolver(); V.revLp = F("lowpass", 6000, 0.5);
    espace.connect(V.envoiRev); V.envoiRev.connect(hpR); hpR.connect(V.rev); V.rev.connect(V.revLp); V.revLp.connect(V.mix);
    V.shimmer = decaleur(c); V.shimmer.regler(12, c.currentTime); V.shimmerG = G(0);
    const shLp = F("lowpass", 7000, 0.5);
    V.rev.connect(V.shimmer.entree); V.shimmer.sortie.connect(shLp); shLp.connect(V.shimmerG); V.shimmerG.connect(hpR);
    // l'echo : au centre (retour plafonne, assombri a chaque tour), ou en ping-pong
    V.envoiEcho = G(0); V.echo = c.createDelay(3); V.retour = G(0);
    const eLp = F("lowpass", 3800, -3), eHp = F("highpass", 160, 0.7);
    espace.connect(V.envoiEcho); V.envoiEcho.connect(V.echo); V.echo.connect(eLp); eLp.connect(eHp); eHp.connect(V.retour); V.retour.connect(V.echo);
    eHp.connect(centre);
    V.envoiPP = G(0); V.ppG = c.createDelay(3); V.ppD = c.createDelay(3); V.ppGD = G(0); V.ppDG = G(0);
    const ppLp = F("lowpass", 4200, -3), fus = c.createChannelMerger(2);
    espace.connect(V.envoiPP); V.envoiPP.connect(ppLp); ppLp.connect(V.ppG);
    V.ppG.connect(V.ppGD); V.ppGD.connect(V.ppD); V.ppD.connect(V.ppDG); V.ppDG.connect(V.ppG);
    V.ppG.connect(fus, 0, 0); V.ppD.connect(fus, 0, 1); fus.connect(V.mix);
    // le limiteur de la voie, la garde contre le larsen, le niveau, puis le limiteur general du son
    V.limite = c.createDynamicsCompressor();
    V.limite.threshold.value = -9; V.limite.knee.value = 3; V.limite.ratio.value = 20; V.limite.attack.value = 0.002; V.limite.release.value = 0.15;
    V.garde = G(1); V.sortie = G(0);
    V.mix.connect(V.limite); V.limite.connect(V.garde); V.garde.connect(V.sortie); V.sortie.connect(son.limite);
    V.reappliquer = t => { V.signature = ""; this.appliquerVoie(V, n, t, true); };
    return V;
  },

  tempsEcho(n) {
    const v = String(S["e" + n + "EchoTemps"] || "380");
    if (v[0] === "b") {
      const beat = S.musique && musique.actif && musique.bpm ? 60 / musique.bpm : son.battement();
      return clamp(beat * Number(v.slice(1)), 0.06, 2.9);
    }
    return clamp(Number(v) / 1000 || 0.38, 0.06, 2.9);
  },
  // la note de l'anneau : dans la gamme du son (ou celle que joue l'instrument)
  frequenceAnneau(n, t) {
    const choix = S["e" + n + "AnneauNote"], f0 = son.replier(son.frequence(0), 90, 400);
    if (choix === "quinte") return son.replier(son.dansLaGamme(f0 * 1.5), 90, 600);
    if (choix === "haut") return f0 * 4;
    if (choix === "jouee") {
      if (typeof instrument !== "undefined" && instrument.note && instrument.hz > 0) this.noteAnneau = instrument.hz;
      return this.noteAnneau || f0;
    }
    if (choix === "gamme") {
      if (!this.noteAnneau || t - this.anneauT > 4) { this.anneauT = t; this.noteAnneau = son.frequence(Math.floor(Math.random() * son.gamme().length)); }
      return son.replier(this.noteAnneau, 90, 800);
    }
    return f0;
  },
  appliquerVoie(V, n, t, force) {
    const L = x => S["e" + n + x], on = this.active(n);
    const anneauF = this.frequenceAnneau(n, t), temps = this.tempsEcho(n);
    const sig = [on, this.canaux, V.larsen, S.volume, anneauF.toFixed(1), temps.toFixed(3)]
      .concat(Object.keys(VOIE_DEFAUTS).map(L), L("Source"), L("Place")).join("|");
    if (!force && sig === V.signature) return;
    V.signature = sig;
    const l = 0.06, num = (x, a, b) => clamp(Number(L(x)) || 0, a, b), mettre = (p, v, tc) => p.setTargetAtTime(v, t, tc || l);
    // la source : un micro seul n'a qu'un canal (l'entree 2 est muette, les deux melangees = l'entree 1)
    const src = String(L("Source")), mono = this.canaux < 2;
    mettre(V.a.gain, src === "1" ? 1 : src === "12" ? (mono ? 1 : 0.5) : 0);
    mettre(V.b.gain, src === "2" ? 1 : src === "12" && !mono ? 0.5 : 0);
    mettre(V.porte.gain, on ? 1 : 0, 0.05);
    // la garde : 1,5 s d'un son pur et immobile avant de croire au larsen (0,4 s pour la voix)
    V.sansGarde = !L("Garde"); V.patience = 1.5;
    mettre(V.hp.frequency, num("Hp", 20, 1000)); mettre(V.lp.frequency, num("Lp", 500, 20000));
    const sat = num("Sature", 0, 1), Gs = 1 + 30 * sat;
    mettre(V.satPre.gain, Gs / 3); mettre(V.satMouille.gain, sat > 0 ? sat * (1 + 0.15 * Gs) / Gs : 0); mettre(V.satSec.gain, 1 - 0.8 * sat);
    const an = num("Anneau", 0, 1);
    mettre(V.anSec.gain, 1 - 0.85 * an); mettre(V.anMouille.gain, an * 1.2); mettre(V.anOsc.frequency, anneauF, 0.03);
    const w = num("Wah", 0, 1);
    mettre(V.wahSec.gain, 1 - 0.8 * w); mettre(V.wahMouille.gain, w * 1.1); mettre(V.wahF.Q, 4 + 4 * w);
    const mod = String(L("Module")), prof = num("ModProf", 0, 1);
    mettre(V.modLfo.frequency, num("ModVitesse", 0.02, 6));
    mettre(V.modSec.gain, mod === "aucun" ? 1 : 1 - 0.4 * prof);
    mettre(V.flMouille.gain, mod === "flanger" ? prof * 0.6 : 0);
    mettre(V.flFb.gain, mod === "flanger" && !V.larsen ? 0.3 + 0.4 * prof : 0);
    mettre(V.phMouille.gain, mod === "phaser" ? prof * 0.6 : 0);
    if (V.travail) {
      V.travail.parameters.get("lofi").setTargetAtTime(num("Lofi", 0, 1), t, l);
      V.travail.parameters.get("usure").setTargetAtTime(num("Usure", 0, 1), t, l);
    }
    mettre(V.sec.gain, num("Sec", 0, 1)); mettre(V.boucleG.gain, num("Boucle", 0, 1.5)); mettre(V.gelG.gain, num("Gel", 0, 1.5));
    mettre(V.place.pan, num("Place", -1, 1));
    V.harmo.regler(Number(L("HarmoIntervalle")) || 12, t); mettre(V.harmoG.gain, num("Harmo", 0, 1) * 0.8);
    const sh = num("Shimmer", 0, 1);
    mettre(V.double.gain, num("Double", 0, 1) * 0.6);
    mettre(V.envoiRev.gain, Math.max(num("Rev", 0, 1), sh * 0.6) * 0.8);
    mettre(V.shimmerG.gain, V.larsen ? 0 : sh * 0.5, V.larsen ? 0.02 : l);
    const d = num("Salle", 0.3, 10);
    if (Math.abs(d - V.salleFaite) > 0.15) { V.salleFaite = d; V.rev.buffer = son.salle(d); }
    const pp = !!L("PingPong"), echo = num("Echo", 0, 1), ret = V.larsen ? 0 : Math.min(0.75, num("Retour", 0, 0.75));
    mettre(V.envoiEcho.gain, pp ? 0 : echo * 0.8); mettre(V.envoiPP.gain, pp ? echo * 0.8 : 0);
    mettre(V.retour.gain, pp ? 0 : ret, V.larsen ? 0.02 : l);
    mettre(V.ppGD.gain, pp ? Math.max(0.5, ret) : 0, V.larsen ? 0.02 : l); mettre(V.ppDG.gain, pp ? ret : 0, V.larsen ? 0.02 : l);
    mettre(V.echo.delayTime, temps, 0.3); mettre(V.ppG.delayTime, temps, 0.3); mettre(V.ppD.delayTime, temps, 0.3);
    mettre(V.sortie.gain, on ? num("Niveau", 0, 1.5) * S.volume : 0, 0.08);
  },
  // le niveau de la voie (pour l'onglet), et le gel automatique : une note tenue 0,4 s qui retombe sous le
  // tiers de sa crete est gelee (prise 0,15 s avant la chute) ; on rejoue, il la lache
  ecouterVoie(V, n, t) {
    V.oreille.getFloatTimeDomainData(V.forme);
    let s = 0;
    for (let i = 0; i < V.forme.length; i += 2) s += V.forme[i] * V.forme[i];
    const r = Math.sqrt(s / (V.forme.length / 2)), dt = clamp(t - (V.tEcoute || t), 0, 0.5);
    V.tEcoute = t;
    V.niveau = r;
    V.crete = Math.max(r, V.crete * Math.pow(0.5, dt / 6), 0.004);
    // l'harmoniseur se cale sur la note (la meme hauteur lue deux fois de suite, franche) ; YIN de l'instrument
    if (Number(S["e" + n + "Harmo"]) > 0 && r > 0.002 && typeof instrument !== "undefined") {
      const y = V.yin || (V.yin = { buf: V.forme, dif: null, clarte: 0 });
      const hz = instrument.hauteurDe.call(y, son.ctx.sampleRate);
      if (hz > 0 && y.clarte > 0.85) {
        if (V.hzAvant && Math.abs(12 * Math.log2(hz / V.hzAvant)) < 0.3) V.harmo.caler(hz, t);
        V.hzAvant = hz;
      }
    }
    const fort = r > V.crete * 0.3;
    if (!S["e" + n + "GelAuto"] || !V.travail) { if (V.gelAuto) { V.gelAuto = false; V.travail && V.travail.port.postMessage({ gel: false }); } return; }
    if (fort) {
      if (V.gelAuto && V.tenue > 0.12) { V.gelAuto = false; V.travail.port.postMessage({ gel: false }); }
      V.tenue += dt; V.pic = Math.max(V.pic || 0, r);
    } else {
      if (V.tenue > 0.4 && !V.gelAuto && r < (V.pic || 0) * 0.33) { V.gelAuto = true; V.travail.port.postMessage({ gel: true, recul: 0.15 }); }
      V.tenue = 0; V.pic = 0;
    }
  },

  // ---- les gestes : la pedale de la boucle, arreter, effacer, geler ----
  voie(n) { son.demarrer(); return this.voies[n - 1]; },
  pedale(n) { const V = this.voie(n); if (V && V.travail) V.travail.port.postMessage("pedale"); },
  arreter(n) { const V = this.voie(n); if (V && V.travail) V.travail.port.postMessage("arreter"); },
  effacer(n) { const V = this.voie(n); if (V && V.travail) V.travail.port.postMessage("effacer"); },
  geler(n) {
    const V = this.voie(n);
    if (!V || !V.travail) return;
    V.gelAuto = false;
    V.travail.port.postMessage({ gel: !V.etat.gel, recul: 0 });
  },
};

(function brancherEntrees() {
  // la voix de son.js se tait quand une voie prend l'entree
  const voixActiveAvant = son.voixActive;
  son.voixActive = function () { return entrees.active(1) || entrees.active(2) ? false : voixActiveAvant.apply(this, arguments); };
  const voixMajAvant = son.voixMaj;
  son.voixMaj = function () { const r = voixMajAvant.apply(this, arguments); try { entrees.maj(); } catch (e) { console.error("poiasie : entrées", e); } return r; };
  // la page du panneau range : Son > Les entrees
  const o = SCHEMA.find(x => x.onglet === "Entrées");
  if (o) o.construire = construireEntrees;
  if (typeof RANGEMENT !== "undefined") {
    const f = RANGEMENT.find(x => x.id === "son");
    if (f && f.sous) f.sous.push({ id: "entrees", nom: "Les entrées", groupes: [{ de: "Entrées / *" }], construire: construireEntrees });
    if (typeof ONGLET_PAGE !== "undefined") ONGLET_PAGE["Entrées"] = "son/entrees";
  }
  // les touches de la rangee du bas ; $ et £ tenus une seconde : effacer
  const appui = {};
  window.addEventListener("keydown", e => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.tagName === "TEXTAREA")) return;
    const k = e.key;
    if (k === "<") entrees.pedale(1);
    else if (k === ">") entrees.pedale(2);
    else if (k === "ù") entrees.geler(1);
    else if (k === "%") entrees.geler(2);
    else if (k === "$" || k === "£") appui[k] = performance.now();
  });
  window.addEventListener("keyup", e => {
    const k = e.key;
    if ((k !== "$" && k !== "£") || !appui[k]) return;
    const n = k === "$" ? 1 : 2, long = performance.now() - appui[k] > 900;
    delete appui[k];
    if (long) entrees.effacer(n); else entrees.arreter(n);
  });
})();

const ETATS_BOUCLE = { vide: "vide", enregistre: "enregistre…", joue: "joue", ajoute: "ajoute par-dessus…", arrete: "arrêtée" };
function construireEntrees(page) {
  const fs = document.createElement("fieldset");
  let voies = "";
  for (const n of [1, 2]) voies += `<div class="ligne" style="margin-top:6px"><span><b>Entrée ${n}</b></span><canvas id="en-vu${n}" width="160" height="14" style="background:#000;width:160px;height:14px"></canvas></div>
    <div class="etat-gen" id="en-etat${n}" style="min-height:0">…</div>
    <div class="rangee"><button type="button" class="bouton" data-en="pedale" data-n="${n}">Boucle : enregistrer / jouer / ajouter</button>
    <button type="button" class="bouton" data-en="arreter" data-n="${n}">Arrêter</button>
    <button type="button" class="bouton" data-en="effacer" data-n="${n}">Effacer</button>
    <button type="button" class="bouton" data-en="geler" data-n="${n}">Geler</button></div>`;
  fs.innerHTML = `<legend>Les entrées dans les effets</legend>
    <div class="etat-gen" id="en-etat">…</div>${voies}
    <p style="margin:7px 0 0;color:#404040">L'entrée son se choisit dans l'onglet Musique (Modulation &gt; Écoute), source « le micro ou une entrée son ». Touches : <b>&lt;</b> la boucle de l'entrée 1, <b>&gt;</b> (Maj + &lt;) celle de l'entrée 2 ; <b>ù</b> et <b>%</b> le gel ; <b>$</b> et <b>£</b> arrêter ou reprendre la boucle, tenues une seconde : l'effacer. Casque, ou une voie de la table : les enceintes dans la pièce du micro font un larsen (la garde baisse alors l'entrée toute seule).</p>`;
  page.appendChild(fs);
  fs.querySelectorAll("button[data-en]").forEach(b => b.addEventListener("click", () => entrees[b.dataset.en](Number(b.dataset.n))));
  setTimeout(majEntreesUI, 0);
}
function majEntreesUI() {
  const el = document.getElementById("en-etat");
  if (!el) return;
  const E = entrees;
  let t;
  if (!E.voulu()) t = "Aucune entrée n'est allumée : coche « L'entrée 1 passe dans les effets » (ou la 2), plus bas.";
  else if (!S.musique || !musique.actif) t = "L'entrée son n'est pas écoutée : onglet Musique, « Écouter » (ou M).";
  else if (S.musiqueSource !== "micro" && S.musiqueSource !== "melange") t = "La source de l'onglet Musique n'est pas une entrée son : choisis « le micro ou une entrée son ».";
  else if (!son.ctx) t = "En attente d'un clic sur l'écran (le navigateur l'exige).";
  else t = (E.canaux >= 2 ? "La carte son envoie deux entrées." : "La carte son n'envoie qu'une entrée (mono) : l'entrée 2 reste muette.")
    + (E.travailFini && !E.travailOk ? " La boucle et le gel ne marchent pas dans ce navigateur." : "");
  if (el.textContent !== t) el.textContent = t;
  for (const n of [1, 2]) {
    const V = E.voies[n - 1], e = document.getElementById("en-etat" + n);
    if (e) {
      const s = !S["e" + n + "Actif"] ? "Éteinte." : !V ? "En attente de l'entrée." : (V.larsen ? "Larsen : la garde a baissé l'entrée. " : "")
        + "Boucle : " + (ETATS_BOUCLE[V.etat.etat] || V.etat.etat) + (V.etat.long ? " (" + V.etat.long.toFixed(1).replace(".", ",") + " s)" : "") + "."
        + (V.etat.gel ? " Gel tenu" + (V.gelAuto ? " (automatique)" : "") + "." : "");
      if (e.textContent !== s) e.textContent = s;
    }
    const c = document.getElementById("en-vu" + n);
    if (c && c.offsetParent !== null) {
      const g = c.getContext("2d"), v = V && E.active(n) ? clamp(Math.sqrt(V.niveau) * 2.2, 0, 1) : 0;
      g.fillStyle = "#000"; g.fillRect(0, 0, c.width, c.height);
      g.fillStyle = v > 0.9 ? "#ff4060" : v > 0.7 ? "#ffd040" : "#40d080"; g.fillRect(0, 2, c.width * v, c.height - 4);
    }
  }
}
