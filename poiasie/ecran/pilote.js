"use strict";
/* ================================================================ le pilote automatique */

// Le pilote suit la musique, morceau apres morceau (une playlist, un set) : il ecoute le volume
// vrai (celui que le gain automatique ne remet pas a niveau), compte les temps, reconnait les
// passages calmes, les montees, les drops et les changements de morceau (un silence entre deux
// titres, ou un tempo qui change dans un mix). Rien ne coupe un poeme (Jiiji, 2026-10-17) : les
// changements francs (scene, couleurs, combo, kaleidoscope stable) attendent la fin du poeme et
// passent en fondu ; a chaque phrase, seuls des reglages glissent doucement vers d'autres valeurs.
// Il ne touche jamais aux scenes de la Banque ni au stroboscope, et n'ecrit rien sur l'image.
//
// Repris le 2026-10-18 (Jiiji : « il faudrait qu'il soit bien plus complexe pour que ce soit un
// truc de ouf ») : une dramaturgie de set.
// - il lit la musique plus finement : sections (intro, montee, drop, plateau, cassure, fin),
//   courbe d'energie et sa tendance, caractere du spectre (sombre, brillant, plein, creux) qui
//   oriente scenes, palettes et fonds, tempo qui regle la vitesse des scenes et la duree des LFO
//   (en mesures), et les retours (un refrain ramene le regard qu'il avait la premiere fois) ;
// - il se souvient : ni la meme scene, ni la meme palette, ni le meme combo trop tot ; et le set a
//   des actes (ouverture, developpement, sommet, denouement) : le regard evolue sur une heure ;
// - il joue avec tout : scenes (y compris celles que d'autres fichiers ajoutent), combos (par la
//   table d'affinites de combo.js), couleurs, fonds, effets, les LFO libres, les presets ;
// - il suit le mode : en poesie il suit la voix et laisse lire, en jeu il accompagne la manette ;
// - il ecoute le poeme (sa forme, sa longueur, ses mots rares) et le son de l'ecran lui-meme
//   (Jiiji reboucle la sortie sur l'entree : chaque mot qui sonne fait frissonner l'image) ;
// - un temperament (contemplatif, narratif, nerveux), et ce qu'il a le droit de toucher.
// Ce qu'il fait reste lisible dans le panneau (son etat, son journal), jamais sur l'image.
const PILOTE_CALME = ["constellation", "rosace", "ruban", "coupdedes", "nuee", "calligramme", "lecture", "etoiles", "mystifier", "onde"];
const PILOTE_PLEIN = ["puits", "battement", "averse", "cretes", "onde", "tourbillon", "etoiles", "nuee", "texte3d", "rosace"];
const PILOTE_FONDS = ["degrade", "degrade", "aurore", "etoiles", "horizon", "rayons", "sol", "tapisserie", "filigrane", "aucun", "uni"];
// les reglages qu'il fait glisser : [cle, minimum, maximum]
const PILOTE_REGLAGES = [["tremblement", 0, 2.5], ["ondulation", 0, 2], ["respiration", 0, 1.2], ["rotationMots", 0, 1], ["lueur", 0, 0.6],
  ["vitesseEtoiles", 0.5, 2.5], ["spin", 0.5, 2.5], ["puitsTorsion", 0.3, 2], ["puitsVitesse", 0.6, 2], ["rosaceTourne", 0.4, 2.5],
  ["cretesHauteur", 0.6, 2], ["ondeHauteur", 0.6, 1.8], ["averseDensite", 0.6, 2], ["saturation", 0.8, 1.5], ["vivacite", 0.7, 1.5],
  ["derive", 0, 1], ["decalage", 0, 60], ["kaleidoSpirale", 0, 1.2], ["graisse", 0, 1.5], ["ombre", 0, 1]];
// les vitesses des scenes, que le tempo regle (et la scene a laquelle chacune sert)
const PILOTE_VITESSES = { vitesseEtoiles: "etoiles", spin: "tourbillon", puitsVitesse: "puits", rosaceTourne: "rosace", averseVitesse: "averse" };
// ce qui rend la lecture difficile en mode poesie, ou derange la main en mode jeu
const PILOTE_MOUVEMENTS = new Set(["tremblement", "ondulation", "rotationMots", "graisse", "ombre"]);

// Le caractere de chaque scene : [lumiere (0 : elle aime le sombre, 1 : le brillant), plein (0 :
// creux, 1 : dense), lisible (on lit le poeme)]. Une scene ajoutee par un autre fichier peut donner
// `profil` dans ajouterScene ; sinon elle est au milieu.
const PILOTE_PROFILS = {
  constellation: [0.2, 0.3, 0.7], rosace: [0.7, 0.5, 0.6], ruban: [0.4, 0.4, 0.6], coupdedes: [0.5, 0.2, 0.9], nuee: [0.5, 0.8, 0.4],
  calligramme: [0.6, 0.4, 0.9], lecture: [0.5, 0.2, 1], etoiles: [0.3, 0.7, 0.5], mystifier: [0.8, 0.5, 0.3], onde: [0.8, 0.3, 0.6],
  puits: [0.2, 0.8, 0.5], battement: [0.6, 0.9, 0.7], averse: [0.7, 0.7, 0.4], cretes: [0.2, 0.8, 0.5], tourbillon: [0.5, 0.9, 0.3],
  texte3d: [0.6, 0.7, 0.5], defilement: [0.5, 0.4, 0.8],
};
// les palettes : [lumiere, plein (des couleurs franches)] ; « billet » est la Banque, jamais
const PILOTE_PALETTES = {
  nuit: [0.2, 0.2], bureau95: [0.6, 0.4], mystify: [0.8, 0.6], ambre: [0.4, 0.3], phosphore: [0.6, 0.4], papier: [0.6, 0.1],
  crepuscule: [0.4, 0.4], arc: [0.9, 1], neon: [0.9, 0.9], vapeur: [0.7, 0.7], braise: [0.3, 0.7], sang: [0.25, 0.7], glace: [0.75, 0.4],
  foret: [0.35, 0.4], or: [0.3, 0.3], klein: [0.6, 0.8], encre: [0.6, 0.1],
};
const PILOTE_FONDS_PROFILS = {
  degrade: [0.4, 0.5], aurore: [0.7, 0.7], etoiles: [0.2, 0.3], horizon: [0.5, 0.5], rayons: [0.8, 0.8], sol: [0.6, 0.8],
  tapisserie: [0.5, 0.9], filigrane: [0.4, 0.3], aucun: [0.1, 0.1], uni: [0.3, 0.2],
};
// la forme du poeme appelle certaines scenes (cle de la forme, ou son nom)
const PILOTE_FORMES = {
  sonnet: ["rosace", "calligramme", "coupdedes", "constellation"], pantoum: ["ruban", "onde", "cretes"], terza_rima: ["cretes", "puits", "ruban"],
  villanelle: ["rosace", "battement", "onde"], rondeau: ["rosace", "calligramme"], sextine: ["rosace", "constellation", "puits"],
  ghazal: ["rosace", "constellation", "nuee"], renga: ["constellation", "coupdedes", "etoiles"], cadavre: ["nuee", "averse", "mystifier", "tourbillon"],
  acrostiche: ["calligramme", "battement", "coupdedes"], boule_de_neige: ["nuee", "averse", "battement"], litanie: ["battement", "puits", "onde"],
  vers_libres: ["ruban", "nuee", "etoiles"], infini: ["etoiles", "constellation", "ruban"],
};
// ce sur quoi il peut brancher un LFO, et de combien (part de la demi-course du curseur)
const PILOTE_LFO = [["decalage", 0.1], ["saturation", 0.12], ["exposition", 0.05], ["respiration", 0.2], ["ondulation", 0.15], ["rotationMots", 0.12],
  ["tremblement", 0.08], ["vitesseEtoiles", 0.12], ["puitsTorsion", 0.2], ["rosaceTourne", 0.15], ["cretesHauteur", 0.15], ["ondeHauteur", 0.15],
  ["kaleidoSpirale", 0.12], ["vignetteGpu", 0.2], ["fondPulse", 0.2], ["lueur", 0.08], ["calqueOpacite", 0.12], ["derive", 0.12], ["halo", 0.1],
  ["calqueMasqueOmbre", 0.15], ["teinteMots", 0.08]];
// a quelle scene sert un LFO (sinon il sert partout)
const PILOTE_LFO_SCENE = { vitesseEtoiles: "etoiles", puitsTorsion: "puits", rosaceTourne: "rosace", cretesHauteur: "cretes", ondeHauteur: "onde" };

// Les temperaments : combien il change (a la fin d'un poeme), la longueur de ses phrases, la force
// des effets, l'envie de combos et de masques, la duree de ses LFO (en mesures), combien il en branche
const PILOTE_TEMPERAMENTS = {
  contemplatif: { change: 0.25, phrase: 2, effets: 0.55, combos: 0.5, masques: 0.5, kaleido: 0.5, lfo: [16, 32, 64], lfoNb: 2, lfoAmp: 0.7, memoire: 1.4,
    passages: ["fondu", "iris", "fondu", "lettres"] },
  narratif: { change: 0.45, phrase: 1, effets: 1, combos: 1, masques: 1, kaleido: 1, lfo: [8, 16, 32], lfoNb: 3, lfoAmp: 1, memoire: 1,
    passages: ["fondu", "rideau", "iris", "lettres"] },
  nerveux: { change: 0.7, phrase: 0.5, effets: 1.3, combos: 1.5, masques: 1.4, kaleido: 1.3, lfo: [2, 4, 8], lfoNb: 4, lfoAmp: 1.3, memoire: 0.7,
    passages: ["rideau", "lettres", "iris", "rideau"] },
};
// Les actes d'un set : la part du set ou chacun finit, et ce qu'il change aux envies du pilote.
// Apres le denouement, le set repart au developpement (il ne rejoue pas l'ouverture).
const PILOTE_ACTES = [
  { nom: "ouverture", jusqua: 0.15, audace: 0.6, effets: 0.6, combos: 0.35, masques: 0, sombre: 0.3 },
  { nom: "développement", jusqua: 0.5, audace: 1, effets: 1, combos: 1, masques: 0.6, sombre: 0 },
  { nom: "sommet", jusqua: 0.8, audace: 1.3, effets: 1.25, combos: 1.3, masques: 1.2, sombre: -0.1 },
  { nom: "dénouement", jusqua: 1, audace: 0.75, effets: 0.7, combos: 0.6, masques: 0.4, sombre: 0.2 },
];
// Les modes (modes.js, S.mode) : en poesie Jiiji lit au micro, le pilote suit sa voix et laisse lire
// (pas de drop, pas de flash, des scenes lisibles, peu de combos) ; en jeu il accompagne la manette.
const PILOTE_MODES = {
  poesie: { audace: 0.5, effets: 0.4, combos: 0.3, masques: 0.3, drops: false, flash: false, lisible: 1, kaleido: 0.3, lfoNb: 1, silence: 25 },
  vjing: { audace: 1, effets: 1, combos: 1, masques: 1, drops: true, flash: true, lisible: 0, kaleido: 1, lfoNb: 4, silence: 1.2 },
  jeu: { audace: 0.7, effets: 0.6, combos: 0.6, masques: 0.6, drops: true, flash: false, lisible: 0.3, kaleido: 0, lfoNb: 2, silence: 1.2 },
  // Le mode full auto (Jiiji : « on regarde et on kiffe, il se genere tout seul, les mots font les
  // sons, les sons font des mots, tout est lie ») : le pilote est maitre de tout, meme sans musique
  // exterieure. Il ecrit lui-meme la dramaturgie (un plan par morceau), ecoute l'ecran (les notes et
  // les mots du bus, le son de l'ecran s'il s'ecoute) et mene aussi les grands reglages du son.
  auto: { audace: 1, effets: 0.85, combos: 1.1, masques: 1.1, drops: true, flash: false, lisible: 0.2, kaleido: 0.8, lfoNb: 4, silence: 1.2 },
};
// Les plans du mode auto : une suite de sections et la part du morceau que chacune prend. Le pilote en
// tire un a chaque morceau ; l'energie du plan se mele a ce que l'ecran fait vraiment.
const PILOTE_PLANS = [
  [["intro", 0.14], ["montée", 0.14], ["drop", 0.06], ["plateau", 0.22], ["cassure", 0.12], ["montée", 0.1], ["drop", 0.05], ["plateau", 0.09], ["fin", 0.08]],
  [["intro", 0.2], ["plateau", 0.28], ["cassure", 0.16], ["montée", 0.14], ["plateau", 0.12], ["fin", 0.1]],
  [["intro", 0.25], ["montée", 0.25], ["plateau", 0.3], ["fin", 0.2]],
  [["intro", 0.3], ["cassure", 0.2], ["montée", 0.2], ["drop", 0.05], ["plateau", 0.15], ["fin", 0.1]],
];
const PILOTE_PLAN_ENERGIE = { intro: [0.25, 0.4], "montée": [0.4, 0.78], drop: [0.95, 0.9], plateau: [0.82, 0.75], cassure: [0.3, 0.22], fin: [0.4, 0.1] };
// ce que chaque section fait au son, en mode auto : [densite, tempo (fois celui du morceau), clarte,
// reverberation, echo, bourdon, poussiere]. Tout glisse ; le volume n'est jamais touche.
const PILOTE_SON = {
  intro: [0.35, 0.85, 2600, 0.65, 0.4, 0.45, 0.25], "montée": [0.65, 1.05, 6000, 0.5, 0.35, 0.35, 0.2],
  drop: [0.85, 1.2, 8000, 0.4, 0.3, 0.3, 0.15], plateau: [0.8, 1.15, 7000, 0.45, 0.3, 0.3, 0.2],
  cassure: [0.25, 0.8, 1500, 0.8, 0.6, 0.55, 0.35], fin: [0.15, 0.7, 1200, 0.85, 0.5, 0.5, 0.3],
};
// ce qu'un preset peut lui faire poser (des reglages de l'image, jamais le son, la musique, la manette,
// la vitesse et la tenue de lecture de Jiiji, ni le stroboscope)
const PILOTE_PRESET_CHOIX = new Set(["scene", "palette", "fond", "modeCouleur", "police", "casse", "miroir", "degrade", "kaleidoStable", "mode3d", "surface",
  "calligramme", "battementStyle", "entree", "sortie", "calque", "calqueMelange", "calqueMouvement", "calquePlace", "calquePoeme", "calqueEntree", "crt", "contour"]);
const PILOTE_PRESET_EXCLUS = new Set(["vitesse", "tenue", "strobe", "strobeFreq", "qualite", "poemeMax", "fonduDuree", "volume", "espacement"]);

// on ajoute ses reglages au groupe du pilote, dans le premier onglet
ajouterReglages("Écran de veille", "Pilote automatique (touche ² ou F2, ou PS sur la manette : le menu)", [
  { cle: "piloteTemperament", nom: "Tempérament", type: "choix", options: [["contemplatif", "Contemplatif (il change peu, lentement)"],
    ["narratif", "Narratif (il raconte le set : sections, refrains, actes)"], ["nerveux", "Nerveux (plus de changements, toujours à la fin du poème)"]] },
  { cle: "piloteMain", nom: "Ce que tu touches, il le laisse (secondes)", type: "curseur", min: 5, max: 300, pas: 5 },
  { cle: "piloteSet", nom: "Durée du set (minutes) : ouverture, développement, sommet, dénouement", type: "curseur", min: 20, max: 240, pas: 10 },
  { cle: "piloteMemoire", nom: "Il ne reprend pas une scène avant (minutes)", type: "curseur", min: 1, max: 30, pas: 1 },
  { cle: "piloteScenes", nom: "Il change de scène", type: "case" },
  { cle: "piloteLfo", nom: "Il branche des LFO (seulement ceux qui sont libres)", type: "case" },
  { cle: "piloteTempo", nom: "Il cale les vitesses et les LFO sur le tempo", type: "case" },
  { cle: "pilotePresets", nom: "Il pioche dans les presets", type: "case" },
], { piloteTemperament: "narratif", piloteMain: 30, piloteSet: 60, piloteMemoire: 6, piloteScenes: true, piloteLfo: true, piloteTempo: true, pilotePresets: true });

const pilote = {
  actif: false, energie: 0, lente: 0, intensite: 0, boost: 0, temps: 0, phrase: 0, morceau: 0, ageMorceau: 0,
  silence: 0, calme: 0, bpmRef: 0, bpmAutre: 0, horloge: 0, etat: "", cibles: {}, kaleidoPoemes: 0, rafraichir: 0,
  evenement: null, dropPret: false, etaitPlein: false, aLaMain: {}, fin: {},
  // la lecture fine de la musique
  tresLente: 0.5, tendance: 0, histoire: [], histT: 0, brillance: 0.5, plenitude: 0.5, refB: 0.5, refP: 0.5, specT: 0,
  depuisKick: 99, kicksDensite: 0, aDesKicks: 0, section: "intro", sectionDepuis: 0, tendanceBas: 0, phaseAvant: 0,
  frisson: 0, tension: 0, parle: 0, voixSilence: 0,
  // la memoire, le set, les phrases, les LFO, le journal
  memoire: { scene: new Map(), palette: new Map(), fond: new Map(), combo: new Map(), preset: new Map() },
  set: 0, phrases: [], accu: null, lfoMiens: {}, apres: {}, journal: [], dansFin: false, comboAttente: null,
  poemeVu: null, poemeInfo: null, image: 0.016, lourdDepuis: 0, lourds: new Set(), calqueDuPilote: false, mainJoue: false,

  // Un reglage touche a la main (panneau, clavier, manette, ambiance) : le pilote ne le fait plus
  // glisser et ne le mene plus pendant 30 s (piloteMain). Avant, il le reecrivait a chaque image :
  // les sticks revenaient en 2 s, B et X semblaient ne rien faire (audit du 2026-10-18).
  prendre(cle) { this.aLaMain[cle] = performance.now(); delete this.cibles[cle]; delete this.fin[cle]; delete this.apres[cle]; },
  libre(cle) {
    const t = this.aLaMain[cle];
    if (t === undefined) return true;
    if (performance.now() - t < (S.piloteMain || 30) * 1000) return false;
    delete this.aLaMain[cle];
    return true;
  },
  mode() { const m = S.mode || "vjing"; return PILOTE_MODES[m] ? m : "vjing"; },
  // ce qu'il a le droit de toucher (cases du panneau) ; en mode auto, il est maitre de tout
  peut(cle) { return this.mode() === "auto" || S[cle] !== false; },
  temperament() { return PILOTE_TEMPERAMENTS[S.piloteTemperament] || PILOTE_TEMPERAMENTS.narratif; },
  // l'acte du set : la part du set ecoulee (apres la fin, il repart au developpement)
  acte() {
    let x = this.set / Math.max(60, (S.piloteSet || 60) * 60);
    if (x >= 1) x = 0.15 + ((x - 1) % 0.85);
    return PILOTE_ACTES.find(a => x < a.jusqua) || PILOTE_ACTES[PILOTE_ACTES.length - 1];
  },
  // les envies du moment : le reglage d'audace, le temperament, l'acte et le mode ensemble
  envies() {
    const T = this.temperament(), A = this.acte(), M = PILOTE_MODES[this.mode()];
    return { T, A, M, audace: clamp(S.piloteAudace * A.audace * M.audace, 0, 1.3), effets: T.effets * A.effets * M.effets,
      combos: T.combos * A.combos * M.combos, masques: T.masques * A.masques * M.masques, kaleido: T.kaleido * M.kaleido * (this.mainJoue ? 0 : 1) };
  },
  noter(quoi, detail) {
    this.journal.push({ t: +this.horloge.toFixed(1), set: +this.set.toFixed(1), acte: this.acte().nom, section: this.section, quoi, detail: detail || "",
      finDePoeme: this.dansFin });
    if (this.journal.length > 1000) this.journal.shift();
    this.dernier = quoi + (detail ? " : " + detail : "");
  },
  // la duree d'un temps : celui de la musique ; en mode auto, celui du son de l'ecran
  beat() { return this.mode() === "auto" ? 60 / clamp(S.sonTempo || 30, 6, 120) : 60 / (musique.bpm || this.bpmRef || 120); },

  maj(dt) {
    // le mode auto est mene par le pilote : il s'allume avec lui
    if (S.mode === "auto" && !S.pilote && this.modeAvant !== "auto") { S.pilote = true; if (controles.pilote) controles.pilote.maj(); }
    this.modeAvant = S.mode;
    if (!S.pilote) { this.actif = false; return; }
    if (!this.actif) {
      this.actif = true; this.cibles = {}; this.fin = {}; this.apres = {}; this.set = 0; this.phrases = []; this.accu = null;
      this.noter("pilote allumé");
      this.nouveauMorceau();
    }
    const mode = this.mode(), M = PILOTE_MODES[mode];
    const m = S.musique && musique.actif;
    // l'ecran qui s'ecoute lui-meme (la source ajoutee par un autre fichier) : des notes eparses, pas
    // un morceau ; on suit sa propre maree pour les morceaux, et chaque note fait frissonner l'image
    const soi = m && S.musiqueSource !== "micro" && S.musiqueSource !== "pc";
    this.mainJoue = mode === "jeu" && typeof manette !== "undefined" && performance.now() - (manette.dernierUsage || 0) < 6000;
    this.ageMorceau += dt;
    this.horloge += dt;
    this.set += dt;
    this.sectionDepuis += dt;
    if (!document.hidden) this.image = lerp(this.image, dt, 1 - Math.exp(-dt / 2));
    let e, battu = false;
    const auto = mode === "auto";
    if (auto) e = this.energieAuto(dt, m);
    else if (m && !soi) {
      // l'energie : le volume rapporte au plus fort des quatre dernieres minutes. Le maximum de la
      // musique (demi-vie 40 s) suit une montee lente : l'energie restait collee a 1 et le saut d'un
      // drop disparaissait (essai du 2026-10-18)
      // La reference monte lentement (8 s) : un maximum qui saute avec le drop l'avalait aussitot.
      const ref = this.volRef || musique.volume || 0.02;
      this.volRef = Math.max(0.005, musique.volume > ref ? lerp(ref, musique.volume, 1 - Math.exp(-dt / 8)) : ref * Math.pow(0.5, dt / 240));
      // (jusqu a 1,6 : un drop au-dessus de la montee doit encore se voir)
      e = clamp(musique.volume / this.volRef, 0, 1.6);
      // entre deux morceaux : un silence ; dans un mix : un autre tempo qui tient. En poesie, la voix
      // se tait souvent : seul un long silence ouvre une autre lecture
      if (musique.volume < musique.volumeMax * 0.06 + 0.002) this.silence += dt;
      else {
        if (this.silence > M.silence && this.ageMorceau > 20) this.nouveauMorceau(this.silence > 300 ? "long silence" : "silence");
        if (mode === "poesie" && this.silence > 4 && this.parle > 10) { this.evenementSi("souffle"); this.parle = 0; }
        this.silence = 0;
      }
      if (mode !== "poesie" && musique.bpm && this.bpmRef && Math.abs(musique.bpm - this.bpmRef) > 5) {
        this.bpmAutre += dt;
        if (this.bpmAutre > 10 && this.ageMorceau > 40) this.nouveauMorceau("tempo " + this.bpmRef + " → " + musique.bpm);
      } else { this.bpmAutre = 0; if (musique.bpm && !this.bpmRef) this.bpmRef = musique.bpm; }
      if (e > 0.25) this.parle += dt;
    } else if (this.mainJoue) {
      // la manette joue sans musique : son geste tient lieu d'energie
      e = 0.35 + 0.4 * clamp(1 - (performance.now() - manette.dernierUsage) / 3000, 0, 1);
      if (this.ageMorceau > 300) this.nouveauMorceau("maree");
    } else {
      // sans musique (ou l'ecran qui s'ecoute) : une maree de quatre minutes
      e = 0.5 + 0.45 * Math.sin(this.horloge * Math.PI * 2 / 240);
      if (soi) e = clamp(e * 0.7 + 0.5 * (musique.niveau || 0), 0, 1.2);
      if (this.ageMorceau > 240) this.nouveauMorceau("marée");
    }
    // les temps : la phase de la musique (recalee sur chaque kick), deux par seconde sans elle
    const ph = musique.phase || 0;
    if (auto) { const b = this.beat(); battu = Math.floor(this.horloge / b) !== Math.floor((this.horloge - dt) / b); }
    else battu = m && !soi ? Math.floor(ph) !== Math.floor(this.phaseAvant) : Math.floor(this.horloge * 2) !== Math.floor((this.horloge - dt) * 2);
    this.phaseAvant = ph;
    if (battu) this.temps++;
    this.ecouter(dt, e, m && !soi, soi);
    // en poesie, la voix n'a pas de sections de morceau (parler, se taire, reprendre les faisait
    // basculer sans arret : 73 changements de section en 20 minutes a l'essai) ; seuls comptent le
    // souffle apres une lecture et le tres long silence
    if (auto) this.suivrePlan();
    else if (mode === "poesie") { if (this.section !== "intro") { this.section = "intro"; this.tension = 0; } this.etat = "voix"; }
    else this.sections(dt, m && !soi, battu);
    this.memoriserPhrase(dt, e);
    // l'intensite monte avec l'energie, et a mesure que le morceau avance, lentement
    this.boost = Math.max(0, this.boost - dt / 10);
    const voulue = clamp(this.energie * (0.55 + 0.45 * Math.min(1, this.ageMorceau / 150)) + this.boost * 0.35, 0, 1);
    this.intensite = lerp(this.intensite, voulue, 1 - Math.exp(-dt / 4));
    // le poeme a l'ecran : sa forme, sa longueur, ses mots rares
    if (poemeCourant && poemeCourant !== this.poemeVu) this.lirePoeme(poemeCourant);
    // une phrase de passee : quelques reglages repartent, en glissant (rien ne casse le poeme)
    const T = this.temperament();
    const longueur = clamp(Math.round(Number(S.piloteRythme) * T.phrase * (mode === "poesie" ? 2 : 1)), 16, 256);
    if (this.temps - this.phrase >= longueur) {
      this.phrase = this.temps;
      this.finDePhrase();
    }
    // un combo qui attendait que l'ancien soit sorti (en fondu) entre a son tour
    if (this.comboAttente && !calque.scene && (calque.fondu || 0) <= 0.001) {
      const v = this.comboAttente; this.comboAttente = null;
      this.poser(v);
      this.noter("combo", nomDe(SCENES_CALQUE, v.calque) + " (" + v.calqueMelange + ", " + v.calqueMouvement + ")");
    }
    this.surveillerCharge(dt);
    this.effets(dt);
    this.afficher(dt);
  },

  /* ---------------------------------------------------- le mode auto */

  // L'energie en mode auto : ce que le plan veut, mele a ce que l'ecran fait vraiment (les notes et
  // les mots par seconde, recus par le bus ; le son de l'ecran s'il s'ecoute). Le plan pousse le son,
  // le son fait des notes, les notes font l'energie : la boucle reste douce parce que le plan y pese
  // plus que la mesure.
  energieAuto(dt, m) {
    if (!this.plan) this.planifier();
    const notes = this.busNotes || 0, mots = this.busMots || 0;
    this.busNotes = this.busMots = 0;
    this.busTaux = lerp(this.busTaux || 0, (notes + 0.5 * mots) / Math.max(dt, 0.001), 1 - Math.exp(-dt / 3));
    this.busMax = Math.max(this.busTaux, (this.busMax || 0.5) * Math.pow(0.5, dt / 60), 0.5);
    let mesure = this.busTaux / this.busMax;
    if (m) mesure = Math.max(mesure, clamp(musique.volume / Math.max(0.005, musique.volumeMax), 0, 1.2));
    // chaque note qui part fait frissonner l'image (les sons font bouger les mots)
    if (notes) this.frisson = Math.min(1, this.frisson + 0.15 * notes);
    return clamp(0.6 * this.planEnergie() + 0.4 * mesure, 0, 1.2);
  },
  planifier() {
    const T = this.temperament();
    const duree = hasard(240, 420) * (T === PILOTE_TEMPERAMENTS.contemplatif ? 1.3 : T === PILOTE_TEMPERAMENTS.nerveux ? 0.75 : 1);
    const modele = tirer(PILOTE_PLANS);
    const total = modele.reduce((a, x) => a + x[1], 0);
    let t = 0;
    const parts = modele.map(([section, f]) => { const p = { section, t0: t / total, t1: (t + f) / total }; t += f; return p; });
    this.plan = { debut: this.horloge, duree, parts, tempo: hasard(20, 40) * (T === PILOTE_TEMPERAMENTS.nerveux ? 1.2 : 1) };
    this.noter("plan", parts.map(p => p.section).join(" · ") + " (" + Math.round(duree / 60 * 10) / 10 + " min)");
  },
  partDuPlan() {
    const p = this.plan;
    if (!p) return null;
    const x = (this.horloge - p.debut) / p.duree;
    const part = p.parts.find(q => x < q.t1) || p.parts[p.parts.length - 1];
    return { part, x, u: clamp((x - part.t0) / Math.max(0.001, part.t1 - part.t0), 0, 1) };
  },
  planEnergie() {
    const q = this.partDuPlan();
    if (!q) return 0.5;
    const [a, b] = PILOTE_PLAN_ENERGIE[q.part.section] || [0.5, 0.5];
    return lerp(a, b, lisse(q.u));
  },
  // le plan dit la section ; quand il est fini, un autre morceau commence
  suivrePlan() {
    const q = this.partDuPlan();
    if (!q) return;
    if (q.x >= 1) { this.nouveauMorceau("plan fini"); return; }
    const s = q.part.section;
    if (s !== this.section) {
      if (s === "drop") this.drop(); else this.allerA(s);
      this.sonDuPlan(s);
    }
    if (s === "montée") this.tension = lisse(q.u);
    this.etat = this.section;
  },
  // les grands reglages du son suivent la section (en glissant) ; jamais le volume
  sonDuPlan(section) {
    const v = PILOTE_SON[section];
    if (!v || !this.plan) return;
    const E = this.envies(), a = clamp(E.audace, 0.3, 1.2);
    const cles = ["sonDensite", "sonTempo", "sonFiltre", "sonReverb", "sonEcho", "sonBourdon", "sonPoussiere"];
    const vals = [clamp(v[0] * (0.7 + 0.3 * a), 0.05, 1), clamp(this.plan.tempo * v[1], 6, 120), v[2], v[3], Math.min(0.8, v[4]), v[5], v[6]];
    cles.forEach((c, i) => { if (c in S && this.libre(c)) this.cibles[c] = +(+vals[i]).toFixed(3); });
    this.sonTouche = true;
  },

  /* ---------------------------------------------------- l'ecoute */

  // energie, tendance, kicks, et le caractere du spectre (relatif au set : plus sombre que ce qu'on
  // entend d'habitude, plus brillant, plus plein, plus creux)
  ecouter(dt, e, m, soi) {
    this.energie = lerp(this.energie, e, 1 - Math.exp(-dt * 1.5));
    this.lente = lerp(this.lente, e, 1 - Math.exp(-dt / 6));
    this.tresLente = lerp(this.tresLente, e, 1 - Math.exp(-dt / 40));
    this.histT += dt;
    if (this.histT >= 0.5) {
      this.histT = 0;
      this.histoire.push(this.lente);
      if (this.histoire.length > 24) this.histoire.shift();
      this.tendance = this.histoire.length > 4 ? (this.lente - this.histoire[0]) / (this.histoire.length * 0.5) : 0;
    }
    this.calme = this.energie < 0.45 ? this.calme + dt : Math.max(0, this.calme - dt * 2);
    if (m) {
      if (musique.coupNeuf) { this.kickAvant = this.depuisKick; this.depuisKick = 0; } else this.depuisKick += dt;
      this.kicksDensite = lerp(this.kicksDensite, musique.coupNeuf ? 1 / Math.max(dt, 0.001) : 0, 1 - Math.exp(-dt / 4));
      this.aDesKicks = lerp(this.aDesKicks, this.depuisKick < 1.5 ? 1 : 0, 1 - Math.exp(-dt / 20));
    } else { this.depuisKick = 99; this.kicksDensite = 0; }
    // chaque note de l'ecran (ou chaque coup aigu de la musique) fait frissonner l'image
    const notes = musique.coupsNeufs || [0, 0, 0];
    if (S.musique && musique.actif && (notes[1] || notes[2] || (soi && notes[0]))) this.frisson = Math.min(1, this.frisson + (soi ? 0.3 : 0.12));
    this.frisson *= Math.exp(-dt / 0.8);
    // le spectre, quatre fois par seconde suffit
    this.specT -= dt;
    if (this.specT > 0) return;
    this.specT = 0.25;
    let b, p;
    const d = musique.donnees;
    if (S.musique && musique.actif && d && musique.ctx) {
      const hz = musique.ctx.sampleRate / musique.analyse.fftSize, n = d.length;
      // douze bandes egales sur une echelle de notes, de 60 Hz a 10 kHz
      const bandes = new Array(12).fill(0), comptes = new Array(12).fill(0);
      const l0 = Math.log2(60), l1 = Math.log2(10000);
      for (let i = Math.max(1, Math.floor(60 / hz)); i < n && i * hz < 10000; i++) {
        const k = Math.min(11, Math.floor((Math.log2(i * hz) - l0) / (l1 - l0) * 12));
        bandes[k] += d[i] * d[i]; comptes[k]++;
      }
      let s = 0, sp = 0, mx = 0;
      for (let k = 0; k < 12; k++) { bandes[k] = comptes[k] ? Math.sqrt(bandes[k] / comptes[k]) / 255 : 0; s += bandes[k]; sp += bandes[k] * k; mx = Math.max(mx, bandes[k]); }
      if (s < 0.05) return;  // silence : le caractere ne bouge pas
      b = sp / s / 11;               // le centre du spectre, de 0 (grave) a 1 (aigu)
      p = s / 12 / Math.max(mx, 0.01); // 1 : tout le spectre est occupe ; vers 0 : quelques pics
    } else {
      // sans musique : deux lentes derives sans rapport
      b = 0.5 + 0.25 * Math.sin(this.horloge / 97);
      p = 0.5 + 0.25 * Math.sin(this.horloge / 131 + 1);
    }
    const k = 1 - Math.exp(-0.25 / 6);
    this.brillance = lerp(this.brillance, b, k); this.plenitude = lerp(this.plenitude, p, k);
    const k2 = 1 - Math.exp(-0.25 / 180);
    this.refB = lerp(this.refB, b, k2); this.refP = lerp(this.refP, p, k2);
  },
  // le caractere : de 0 a 1, relatif a ce que le set fait d'habitude (0,5 : comme d'habitude)
  caractere() {
    return { lumiere: clamp(0.5 + (this.brillance - this.refB) * 4, 0, 1), plein: clamp(0.5 + (this.plenitude - this.refP) * 3, 0, 1) };
  },
  nomCaractere() {
    const c = this.caractere();
    return [c.lumiere < 0.4 ? "sombre" : c.lumiere > 0.6 ? "brillant" : "", c.plein > 0.6 ? "plein" : c.plein < 0.4 ? "creux" : ""].filter(x => x).join(", ") || "égal";
  },

  // Les sections d'un morceau. Intro ; montee (l'energie tend a monter) ; drop (apres un calme ou des
  // kicks absents, l'energie revient d'un coup, sur le temps) ; plateau ; cassure (les kicks
  // disparaissent, l'energie tombe) ; fin (le morceau s'eteint lentement). Les changements francs
  // qu'elles appellent attendent la fin du poeme.
  sections(dt, m, battu) {
    const M = PILOTE_MODES[this.mode()];
    const avant = this.energieAvant === undefined ? this.energie : this.energieAvant;
    this.energieAvant = this.energie;
    const s = this.section;
    const beat = this.beat();
    // le drop : un passage calme ou sans kick, puis l'energie d'un coup ; il tombe sur le temps suivant
    const retourKick = m && musique.coupNeuf && (this.kickAvant || 0) > Math.max(3.5, 8 * beat) && this.energie > 0.8;
    // un saut : l'energie rapide passe nettement au-dessus de celle des deux dernieres secondes (une
    // montee lineaire ne saute pas : essai du 2026-10-18, les drops tombaient 14 s trop tot, en pleine
    // montee, parce que le volume de reference avait baisse pendant la cassure)
    this.moyenne = lerp(this.moyenne === undefined ? this.energie : this.moyenne, this.energie, 1 - Math.exp(-dt / 2));
    const saut = this.energie > 0.75 && this.energie - this.moyenne > 0.07;
    const sautFort = this.energie > 0.85 && this.energie - this.moyenne > 0.12;
    const apresCalme = this.calme > 5 || s === "montée" || s === "cassure" || s === "intro";
    // pas dans les quinze premieres secondes d'un morceau : le retour du son apres le silence entre
    // deux titres n'est pas un drop
    if (M.drops && s !== "drop" && this.ageMorceau > 15 && this.horloge - (this.dernierDrop || -99) > 20 && ((apresCalme && saut) || sautFort || retourKick)) { this.calme = 0; this.dropPret = true; }
    if (this.dropPret && (battu || !m)) { this.dropPret = false; this.drop(); return; }
    if (s === "intro") {
      if (this.sectionDepuis > 6 && this.tendance > 0.012 && this.lente > 0.3) this.allerA("montée");
      else if (this.sectionDepuis > 6 && this.lente > 0.62) this.allerA("plateau");
    } else if (s === "montée") {
      this.tension = clamp(this.sectionDepuis / 30, 0, 1);
      if (this.sectionDepuis > 12 && this.tendance < 0.002) this.allerA(this.lente > 0.58 ? "plateau" : "intro");
    } else if (s === "drop") {
      if (this.sectionDepuis > Math.max(16, 32 * beat)) this.allerA("plateau");
    } else if (s === "cassure") {
      if (this.sectionDepuis > 6 && this.tendance > 0.01) this.allerA("montée");
      else if (this.sectionDepuis > 30 && this.lente > 0.6) this.allerA("plateau");
    }
    if (s === "plateau" || s === "drop") {
      // la cassure : les kicks s'en vont (s'il y en avait), ou l'energie s'effondre
      const sansKick = this.aDesKicks > 0.6 && this.depuisKick > Math.max(2.5, 6 * beat);
      if (sansKick || (this.lente > 0.5 && this.energie < this.lente * 0.5)) this.allerA("cassure");
    }
    // la fin : le morceau s'eteint lentement
    this.tendanceBas = this.tendance < -0.004 ? this.tendanceBas + dt : 0;
    if (s !== "fin" && s !== "cassure" && this.ageMorceau > 90 && this.tendanceBas > 12 && this.lente < 0.45) this.allerA("fin");
    // pour le vumetre (onglet Musique) : l'etat se lit comme avant
    this.etat = this.section;
  },
  allerA(section) {
    const avant = this.section;
    this.section = section; this.sectionDepuis = 0;
    if (section !== "montée") this.tension = 0;
    this.noter("section", avant + " → " + section);
    if (section === "cassure") this.pause();
    else if (section === "fin") this.evenementSi("fin");
    else if (section === "montée") this.monter();
    else if (section === "plateau" && avant === "intro") this.evenementSi("plateau");
  },
  // un evenement attend la fin du poeme ; le plus fort passe devant
  evenementSi(ev) {
    const rang = { morceau: 6, drop: 5, calme: 4, refrain: 3, fin: 3, plateau: 2, souffle: 1 };
    if (!this.evenement || (rang[ev] || 0) >= (rang[this.evenement] || 0)) this.evenement = ev;
  },

  // La memoire des phrases : chacune a une signature (energie, lumiere, plenitude, kicks). Une phrase
  // qui ressemble a une phrase d'avant, apres une phrase differente, est un retour (un refrain) : le
  // pilote narratif lui rend le regard qu'il avait la premiere fois.
  memoriserPhrase(dt, e) {
    const a = this.accu || (this.accu = { e: 0, b: 0, p: 0, k: 0, n: 0 });
    a.e += e * dt; a.b += this.brillance * dt; a.p += this.plenitude * dt; a.k += musique.coupNeuf ? 1 : 0; a.n += dt;
  },
  finDePhrase() {
    const a = this.accu;
    this.accu = null;
    if (a && a.n > 4) {
      const sig = [a.e / a.n, a.b / a.n, a.p / a.n, a.k / a.n * this.beat()];
      const regard = { scene: S.scene, palette: S.palette, fond: S.fond };
      const dist = (x, y) => Math.abs(x[0] - y[0]) * 1.5 + Math.abs(x[1] - y[1]) * 2 + Math.abs(x[2] - y[2]) + Math.abs(x[3] - y[3]) * 0.5;
      const prec = this.phrases[this.phrases.length - 1];
      if (prec && dist(sig, prec.sig) > 0.12) {
        let meilleur = null;
        for (let i = 0; i < this.phrases.length - 1; i++) {
          const d = dist(sig, this.phrases[i].sig);
          if (d < 0.07 && (!meilleur || d < meilleur.d)) meilleur = { d, i };
        }
        if (meilleur) {
          const T = this.temperament();
          const ancien = this.phrases[meilleur.i].regard;
          if (Math.random() < (T === PILOTE_TEMPERAMENTS.narratif ? 0.75 : 0.3) && (ancien.scene !== S.scene || ancien.palette !== S.palette)) {
            this.refrain = ancien;
            this.evenementSi("refrain");
            this.noter("retour", "la phrase " + (meilleur.i + 1) + " revient");
          }
        }
      }
      this.phrases.push({ sig, regard });
      if (this.phrases.length > 40) this.phrases.shift();
    }
    const E = this.envies();
    if (Math.random() < 0.5 + 0.4 * E.audace) this.reglages();
    if (this.peut("piloteLfo")) this.lfos();
  },

  /* ---------------------------------------------------- le poeme */

  lirePoeme(p) {
    this.poemeVu = p;
    const vers = versDe(p);
    const mots = vers.flatMap(v => motsPleins(v.texte));
    const cours = mots.map(m => coursDe(m));
    // rare : un mot qui n a servi que deux ou trois fois (cours de la Bourse au-dessus de 35 sous)
    const rares = cours.length ? cours.filter(c => c > 35).length / cours.length : 0;
    let forme = (p.cleForme || p.forme || "").toLowerCase();
    if (p.origine === "flux" || /infini/.test(forme)) forme = "infini";
    forme = sansAccents(forme).replace(/[\s-]+/g, "_").replace(/^cadavre.*/, "cadavre");
    this.poemeInfo = { forme, vers: vers.length, rares };
    // ce qui ne coupe rien : les mots rares allument un peu la lueur, un long poeme ralentit le roulis
    if (this.peut("piloteEffets") && this.libre("lueur") && rares > 0.35) this.cibles.lueur = +clamp(0.1 + rares * 0.5, 0, 0.6).toFixed(2);
    if (vers.length > 20 && this.libre("rotationMots")) this.cibles.rotationMots = 0;
    this.noter("poème", (p.forme || "?") + ", " + vers.length + " vers, " + Math.round(rares * 100) + " % de mots rares");
  },

  /* ---------------------------------------------------- choisir */

  // le poids d un choix deja fait recemment, selon la fenetre (en minutes)
  oubli(genre, cle, minutes) {
    const t = this.memoire[genre].get(cle);
    if (t === undefined) return 1;
    // dans la fenetre : presque jamais (seulement si rien d'autre ne reste) ; apres, l'envie revient
    const age = (this.horloge - t) / 60, F = Math.max(0.5, minutes * this.temperament().memoire);
    return age < F ? 0.002 : 0.3 + 0.7 * (1 - Math.exp(-(age - F) / F));
  },
  // un tirage pondere ; poids nuls exclus
  pondere(liste, poids) {
    const w = liste.map(poids);
    let s = 0;
    for (const x of w) s += Math.max(0, x);
    if (s <= 0) return liste.length ? tirer(liste) : null;
    let r = Math.random() * s;
    for (let i = 0; i < liste.length; i++) { r -= Math.max(0, w[i]); if (r <= 0) return liste[i]; }
    return liste[liste.length - 1];
  },
  scenesConnues() {
    return new Set(SCENES_NOMS.map(x => x[0]).filter(k => k !== "auto" && !SCENES_BANQUE.has(k)));
  },
  profil(cle) {
    if (PILOTE_PROFILS[cle]) return PILOTE_PROFILS[cle];
    const d = SCENES_AJOUTEES.find(x => x.cle === cle);
    return (d && d.profil) || [0.5, 0.6, 0.5];
  },
  // une scene : pleine ou calme, qui va au caractere de la musique, a la forme du poeme, au mode,
  // pas reprise trop tot ; les listes du pilote sont lues maintenant (d'autres fichiers les completent)
  sceneDe(plein) {
    const connues = this.scenesConnues();
    const voulues = new Set(plein ? PILOTE_PLEIN : PILOTE_CALME);
    const toutes = [...new Set(PILOTE_CALME.concat(PILOTE_PLEIN))].filter(k => connues.has(k) && k !== S.scene && k !== S.calque);
    if (!toutes.length) return tirer(PILOTE_CALME);
    const c = this.caractere(), M = PILOTE_MODES[this.mode()], A = this.acte(), info = this.poemeInfo;
    const formes = info && PILOTE_FORMES[info.forme] || [];
    return this.pondere(toutes, k => {
      const [lu, pl, li] = this.profil(k);
      let w = voulues.has(k) ? 1 : 0.25;
      w *= 1.2 - Math.abs(lu - clamp(c.lumiere - A.sombre, 0, 1)) * 0.8 - Math.abs(pl - (plein ? Math.max(c.plein, 0.6) : Math.min(c.plein, 0.4))) * 0.5;
      if (M.lisible) w *= lerp(1, li * 1.5, M.lisible);
      if (formes.includes(k)) w *= 1.8;
      if (info && info.vers > 20) w *= 0.5 + li;
      if (typeof coutDe === "function" && coutDe(k) > 30 && S.calque !== "aucun") w *= 0.4;
      return w * this.oubli("scene", k, S.piloteMemoire || 6);
    });
  },
  paletteDe() {
    const c = this.caractere(), A = this.acte(), M = PILOTE_MODES[this.mode()];
    const noms = Object.keys(PALETTES).filter(p => p !== "perso" && p !== "billet" && p !== S.palette);
    return this.pondere(noms, p => {
      const [lu, pl] = PILOTE_PALETTES[p] || [0.5, 0.5];
      let w = 1.2 - Math.abs(lu - clamp(c.lumiere - A.sombre, 0, 1)) - Math.abs(pl - c.plein) * 0.7;
      // les palettes claires (papier, encre) : pour lire, rarement en pleine nuit de set
      if (PALETTES[p].clair) w *= M.lisible ? 1.2 : 0.25;
      return w * this.oubli("palette", p, 8);
    });
  },
  fondDe() {
    const c = this.caractere();
    const fonds = [...new Set(PILOTE_FONDS)].filter(f => f !== S.fond);
    return this.pondere(fonds, f => {
      const [lu, pl] = PILOTE_FONDS_PROFILS[f] || [0.5, 0.5];
      return (1.2 - Math.abs(lu - c.lumiere) - Math.abs(pl - c.plein) * 0.6) * this.oubli("fond", f, 5);
    });
  },
  // Un combo pour la scene donnee : la seconde scene par la table d'affinites (combo.js), son melange,
  // son mouvement, sa place, sa facon d'entrer ; les masques seulement quand l'acte et le
  // temperament le veulent ; sur une palette claire, l'encre plutot que la lumiere.
  combo(plein, pourScene) {
    const sc = pourScene || S.scene;
    if (S.calque !== "aucun" && !pourScene && Math.random() < 0.4) return { calque: "aucun" };
    const E = this.envies(), M = PILOTE_MODES[this.mode()];
    const connues = this.scenesConnues();
    let cands = SCENES_CALQUE.map(x => x[0]).filter(k => k !== "aucun" && k !== "auto" && connues.has(k) && k !== sc && !this.lourds.has(sc + "|" + k));
    // de temps en temps (surtout au sommet du set), un masque : on ne garde que les secondes scenes
    // qui font une belle fenetre sur celle-ci (un essai d'une heure n'en avait tire aucun)
    if (Math.random() < 0.3 * E.masques && M.lisible < 1) {
      const fenetres = cands.filter(x => affinite(sc, x).melanges.some(y => MASQUES.has(y)));
      if (fenetres.length) { cands = fenetres; this.veutMasque = true; }
    }
    const k = this.pondere(cands, x => {
      const a = affinite(sc, x);
      const [, pl] = this.profil(x);
      return a.note * a.note * (1.2 - Math.abs(pl - (plein ? 0.8 : 0.3)) * 0.6) * this.oubli("combo", sc + "|" + x, 10);
    });
    if (!k) return {};
    const a = affinite(sc, k);
    let melanges = this.veutMasque ? a.melanges.filter(x => MASQUES.has(x)) : a.melanges.filter(x => !MASQUES.has(x) || Math.random() < 0.6 * E.masques);
    this.veutMasque = false;
    if (!melanges.length) melanges = ["ecran", "lumiere"];
    if (this.mode() === "jeu") melanges = melanges.filter(x => x !== "difference");
    if (M.lisible >= 1) melanges = melanges.filter(x => x === "ecran" || x === "dessus" || MASQUES.has(x));
    let mel = melanges.length ? (Math.random() < 0.6 ? melanges[0] : tirer(melanges)) : "ecran";
    if (palette().clair && (mel === "lumiere" || mel === "ecran")) mel = tirer(["multiplier", "dessus"]);
    const masque = MASQUES.has(mel);
    let mouv = Math.random() < 0.55 ? a.mouvements[0] : tirer(a.mouvements);
    if (M.lisible >= 1) mouv = "aucun";
    const T = this.temperament();
    return {
      calqueMelange: mel, calqueMouvement: mouv, calquePlace: masque ? "devant" : a.place,
      calqueOpacite: masque ? 1 : +(M.lisible >= 1 ? hasard(0.3, 0.5) : hasard(0.5, 0.85)).toFixed(2),
      calquePoeme: masque || M.lisible >= 1 ? "meme" : tirer(["autre", "autre", "meme"]),
      calqueEntree: tirer(T.passages), calque: k,
    };
  },
  couleurs() {
    const v = { palette: this.paletteDe() };
    if (Math.random() < 0.5) v.fond = this.fondDe();
    if (Math.random() < 0.4) v.modeCouleur = tirer(["poetes", "poetes", "arc", "alternance", "accent", "palette"]);
    if (this.peut("piloteEffets") && Math.random() < 0.25) v.degrade = Math.random() < 0.5 ? "aucun" : tirer(DEGRADES_NOMS.slice(1))[0];
    return v;
  },
  kaleidoscope() {
    this.kaleidoPoemes = 2 + Math.floor(Math.random() * 2);
    return { kaleido: tirer([4, 6, 6, 8, 12]), kaleidoTourne: tirer([-1, 1]) * +hasard(0.03, 0.1).toFixed(2), kaleidoStable: true, miroir: "aucun" };
  },
  // Les presets (modes.js, s'il les donne) : un objet { nom: reglages } ou une liste de { nom,
  // reglages } ; on n'en garde que les reglages de l'image, et rien de la Banque ni du stroboscope
  presets() {
    if (typeof PRESETS === "undefined" || !PRESETS) return [];
    const entrees = Array.isArray(PRESETS) ? PRESETS.map((p, i) => [p && (p.nom || p.titre) || "preset " + (i + 1), p]) : Object.entries(PRESETS);
    const mode = this.mode(), r = [];
    for (const [nom, p] of entrees) {
      if (!p || typeof p !== "object") continue;
      if (p.mode && p.mode !== mode && !(Array.isArray(p.mode) && p.mode.includes(mode))) continue;
      const src = p.valeurs || p.reglages || p.S || p;
      const v = {};
      for (const c in src) {
        if (!(c in DEFAUTS) || PILOTE_PRESET_EXCLUS.has(c) || /^(son|musique|manette|main|pilote|lfo|kick|caisse|charley|annonces|mode$)/.test(c)) continue;
        if (!(PILOTE_PRESET_CHOIX.has(c) || LFO_CIBLES[c])) continue;
        v[c] = src[c];
      }
      if (v.scene && (SCENES_BANQUE.has(v.scene) || !this.scenesConnues().has(v.scene))) delete v.scene;
      if (v.calque && SCENES_BANQUE.has(v.calque)) delete v.calque;
      if (v.palette === "billet") delete v.palette;
      if (Object.keys(v).length) r.push([nom, v]);
    }
    return r;
  },

  /* ---------------------------------------------------- poser */

  // poser des reglages d'un coup (fin de poeme, ou un combo qui entre en fondu) ; ce que Jiiji a
  // touche depuis peu reste a lui ; un reglage sous un LFO recoit une nouvelle base
  poser(v) {
    let n = 0;
    for (const c in v) {
      if (!this.libre(c)) continue;
      delete this.cibles[c]; delete this.fin[c];
      poserBase(c, v[c]);
      if (c === "palette" || c === "fond") fondCache = null;
      if (controles[c]) controles[c].maj();
      if (c === "scene") this.memoire.scene.set(v[c], this.horloge);
      if (c === "palette") this.memoire.palette.set(v[c], this.horloge);
      if (c === "fond") this.memoire.fond.set(v[c], this.horloge);
      if (c === "calque") { this.calqueDuPilote = v[c] !== "aucun"; if (v[c] !== "aucun") { this.comboPose = this.horloge; this.memoire.combo.set((v.scene || S.scene) + "|" + v[c], this.horloge); } }
      n++;
    }
    if ("crt" in v) document.body.classList.toggle("crt", !!(S.crt && S.vieilleTele));
    if (n) sauver();
    return n;
  },

  // Les changements francs (scene, couleurs, kaleidoscope, combo) attendent la fin du poeme : rien ne
  // coupe un vers. Appele par suivant() ; renvoie vrai si quelque chose change (fondu force).
  // prochain : le poeme qui vient, si l'orchestre le donne (sa forme oriente la scene).
  finDePoeme(prochain) {
    if (prochain) this.lirePoeme(prochain);
    this.dansFin = true;
    try { return this.decider(); } finally { this.dansFin = false; }
  },
  decider() {
    const v = {}, E = this.envies(), M = PILOTE_MODES[this.mode()];
    let ev = this.evenement;
    this.evenement = null;
    // le temperament dit s'il repond a chaque section (le contemplatif en laisse passer une sur deux) ;
    // un nouveau morceau, toujours
    if (ev && ev !== "morceau" && Math.random() > clamp(E.T.change * 2, 0.4, 1)) ev = null;
    // le kaleidoscope pose tient deux ou trois poemes, quoi qu'il arrive entre-temps
    const finKaleido = this.kaleidoPoemes > 0 && --this.kaleidoPoemes === 0;
    const scenes = this.peut("piloteScenes");
    const plein = this.plein();
    let raison = ev || "";
    if (ev === "morceau") {
      // un nouveau morceau : un nouveau regard (ou un preset)
      const presets = this.peut("pilotePresets") ? this.presets() : [];
      if (presets.length && Math.random() < 0.3) {
        const [nom, p] = this.pondere(presets, x => this.oubli("preset", x[0], 20));
        Object.assign(v, p);
        if (v.calque && v.calque !== "aucun" && !this.peut("piloteCombos")) delete v.calque;
        this.memoire.preset.set(nom, this.horloge);
        raison = "morceau, preset « " + nom + " »";
      } else {
        if (scenes) v.scene = this.sceneDe(this.lente > 0.55);
        if (this.peut("piloteCouleurs")) {
          v.palette = this.paletteDe(); v.fond = this.fondDe();
          v.modeCouleur = tirer(["poetes", "poetes", "poetes", "arc", "alternance", "accent"]);
        }
        if (this.peut("piloteEffets")) Object.assign(v, { kaleido: 0, kaleidoStable: false, miroir: "aucun", solarisation: 0, posterisation: 0, chroma: 0, fonte: 0,
          degrade: Math.random() < 0.2 ? tirer(DEGRADES_NOMS.slice(2))[0] : "aucun" });
        if (this.peut("piloteCombos") && Math.random() < 0.4 * E.combos) this.comboPourFin(v, !(this.lente > 0.55));
        else if (this.peut("piloteCombos") && S.calque !== "aucun") v.calque = "aucun";
      }
      // le kaleidoscope du morceau d'avant s'en va aussi (un preset ne le disait pas : il restait pour
      // toujours, son compteur remis a zero ; essai du 2026-10-18)
      if (this.peut("piloteEffets") && this.kaleidoPoemes > 0 && !("kaleido" in v)) Object.assign(v, { kaleido: 0, kaleidoStable: false });
      this.kaleidoPoemes = 0;
    } else if (ev === "drop") {
      if (scenes) v.scene = this.sceneDe(true);
      if (this.peut("piloteCombos") && S.calque === "aucun" && Math.random() < 0.5 * E.combos) this.comboPourFin(v, true);
      else if (this.peut("piloteEffets") && E.kaleido > 0 && !S.kaleido && Math.random() < 0.25 * E.kaleido) Object.assign(v, this.kaleidoscope());
    } else if (ev === "calme" || ev === "fin") {
      if (scenes) v.scene = this.sceneDe(false);
      if (ev === "fin" && this.peut("piloteCouleurs") && Math.random() < 0.5) v.palette = this.paletteDe();
      if (this.peut("piloteEffets") && ev === "calme" && E.kaleido > 0 && !S.kaleido && Math.random() < 0.3 * E.kaleido) Object.assign(v, this.kaleidoscope());
    } else if (ev === "refrain" && this.refrain) {
      // le refrain revient : le regard de la premiere fois (si on n'y est pas deja)
      const r = this.refrain;
      // (la scene seulement si elle n'est pas revenue depuis trois minutes : un refrain par phrase
      // ramenait la meme scene trois fois en huit minutes)
      if (scenes && r.scene !== S.scene && this.scenesConnues().has(r.scene) && this.oubli("scene", r.scene, 3 / this.temperament().memoire) > 0.01) v.scene = r.scene;
      if (this.peut("piloteCouleurs") && r.palette !== S.palette) v.palette = r.palette;
      if (this.peut("piloteCouleurs") && r.fond !== S.fond) v.fond = r.fond;
      this.refrain = null;
    } else if (ev === "souffle" || ev === "plateau") {
      if (this.peut("piloteCouleurs") && Math.random() < 0.6) Object.assign(v, this.couleurs());
      else if (scenes) v.scene = this.sceneDe(ev === "plateau");
    } else if (finKaleido) {
      Object.assign(v, { kaleido: 0, kaleidoStable: false });
      raison = "fin du kaléidoscope";
    } else {
      // sans evenement : parfois une seule chose change (le temperament dit combien)
      const p = clamp(E.T.change * (0.6 + 0.8 * E.audace) * (this.mainJoue ? 0.4 : 1) * (this.mode() === "poesie" ? 0.5 : 1), 0, 0.95);
      if (Math.random() < p) {
        const choix = [];
        if (scenes) choix.push(["scene", 0.4]);
        if (this.peut("piloteCombos")) choix.push(["combo", 0.2 * E.combos]);
        if (this.peut("piloteCouleurs")) choix.push(["couleurs", 0.25]);
        if (this.peut("piloteEffets") && E.kaleido > 0 && !S.kaleido) choix.push(["kaleido", 0.1 * E.kaleido]);
        if (this.peut("pilotePresets") && this.presets().length) choix.push(["preset", 0.06]);
        const quoi = choix.length ? this.pondere(choix, x => x[1])[0] : null;
        if (quoi === "scene") v.scene = this.sceneDe(plein);
        else if (quoi === "combo") { if (S.calque !== "aucun" && Math.random() < 0.45) v.calque = "aucun"; else this.comboPourFin(v, plein); }
        else if (quoi === "couleurs") Object.assign(v, this.couleurs());
        else if (quoi === "kaleido") Object.assign(v, this.kaleidoscope());
        else if (quoi === "preset") {
          const ps = this.presets(), [nom, x] = this.pondere(ps, y => this.oubli("preset", y[0], 20));
          Object.assign(v, x); this.memoire.preset.set(nom, this.horloge);
          raison = "preset « " + nom + " »";
        }
        if (!raison) raison = quoi || "";
      }
      // un combo trop lourd pour la carte (vu par surveillerCharge) s'en va a la fin du poeme
      if (this.alleger && S.calque !== "aucun") { v.calque = "aucun"; raison = "combo trop lourd"; }
    }
    this.alleger = false;
    if (finKaleido && !("kaleido" in v) && this.kaleidoPoemes === 0) Object.assign(v, { kaleido: 0, kaleidoStable: false });
    // jamais la Banque, jamais le stroboscope
    if (v.scene && SCENES_BANQUE.has(v.scene)) delete v.scene;
    if (v.calque && SCENES_BANQUE.has(v.calque)) v.calque = "aucun";
    delete v.strobe;
    if (v.calque === v.scene && v.calque) v.calque = "aucun";
    // un combo deja la, qu'on remplace : on le laisse sortir en fondu, le suivant entre apres
    if (v.calque && v.calque !== "aucun" && S.calque !== "aucun" && calque.scene && v.calque !== S.calque) {
      const attente = {};
      for (const c in v) if (c.startsWith("calque")) { attente[c] = v[c]; delete v[c]; }
      v.calque = "aucun";
      this.comboAttente = attente;
    } else if (v.calque && v.calque !== "aucun" && S.calque !== "aucun" && calque.scene) {
      // la meme seconde scene : on ne change pas sa facon d'etre pendant qu'elle est visible
      for (const c in v) if (c.startsWith("calque")) delete v[c];
    }
    if (!Object.keys(v).length) return false;
    const n = this.poser(v);
    if (n) this.noter("fin du poème" + (raison ? " (" + raison + ")" : ""), Object.keys(v).map(c => c + " " + v[c]).join(", "));
    return n > 0;
  },
  comboPourFin(v, plein) {
    const sc = v.scene || S.scene;
    Object.assign(v, this.combo(plein, sc === "auto" ? null : sc));
  },

  // quelques reglages repartent vers d'autres valeurs, en douceur ; les vitesses des scenes suivent
  // le tempo (Jiiji : le tempo regle la vitesse des scenes)
  reglages() {
    const E = this.envies(), mode = this.mode();
    const n = 2 + Math.floor(Math.random() * 2);
    let liste = PILOTE_REGLAGES.slice();
    if (mode === "poesie" || this.mainJoue) liste = liste.filter(r => !PILOTE_MOUVEMENTS.has(r[0]));
    // les reglages des scenes ajoutees par d'autres fichiers (un sur trois, au milieu de leur course)
    if (Math.random() < 0.33) for (const [onglet, it] of REGLAGES_AJOUTES) {
      if (it.type !== "curseur" || !LFO_CIBLES[it.cle] || /^(calque|pilote|son|main|lfo|mode)/.test(it.cle) || ["Son", "Manette", "Musique", "Le son mène", "LFO"].includes(onglet)) continue;
      liste.push([it.cle, it.min + 0.15 * (it.max - it.min), it.min + 0.6 * (it.max - it.min)]);
    }
    liste = liste.filter(r => this.libre(r[0]) && r[0] in S);
    const choix = liste.sort(() => Math.random() - 0.5).slice(0, n);
    const tempo = clamp(Math.pow((musique.bpm || this.bpmRef || 120) / 120, 0.7), 0.6, 1.4);
    for (const [c, a, b] of choix) {
      let x = a + Math.random() * (b - a) * (0.4 + 0.6 * clamp(E.audace, 0, 1));
      if (this.peut("piloteTempo") && PILOTE_VITESSES[c]) x = clamp(x * tempo, a, b);
      this.cibles[c] = +x.toFixed(3);
    }
    // la vitesse de la scene en cours, calee sur le tempo
    if (this.peut("piloteTempo") && S.musique && musique.actif && musique.bpm) {
      for (const c in PILOTE_VITESSES) if (PILOTE_VITESSES[c] === sceneCle && this.libre(c)) {
        const r = PILOTE_REGLAGES.find(x => x[0] === c) || [c, 0.6, 2];
        this.cibles[c] = +clamp(lerp(r[1], r[2], 0.35) * tempo, r[1], r[2]).toFixed(3);
      }
    }
    this.dernier = "réglages : " + choix.map(x => nomReglage(x[0])).join(", ");
  },
  // la montee : les vitesses de la scene et la spirale du kaleidoscope montent, la tension s'installe
  monter() {
    const E = this.envies();
    for (const c in PILOTE_VITESSES) if (PILOTE_VITESSES[c] === sceneCle && this.libre(c)) {
      const r = PILOTE_REGLAGES.find(x => x[0] === c) || [c, 0.6, 2];
      this.cibles[c] = +lerp(r[1], r[2], 0.55 + 0.35 * clamp(E.audace, 0, 1)).toFixed(3);
    }
    if (S.kaleido > 1 && this.libre("kaleidoSpirale") && E.kaleido > 0) this.cibles.kaleidoSpirale = +(0.3 + 0.6 * clamp(E.audace, 0, 1)).toFixed(2);
  },

  /* ---------------------------------------------------- les LFO */

  // Les LFO libres (cible « rien ») : il en branche, leur donne une duree en mesures (le tempo),
  // fait monter leur amplitude en glissant, et les debranche en la faisant redescendre. Il ne touche
  // jamais un LFO que Jiiji a regle ; s'il touche un des siens, ce LFO redevient a Jiiji.
  lfos() {
    const E = this.envies(), mode = this.mode();
    // ceux que Jiiji a repris
    for (const i in this.lfoMiens) {
      if (!["Cible", "Forme", "Duree", "Amplitude"].every(x => this.libre("lfo" + i + x))) { delete this.lfoMiens[i]; this.noter("LFO " + i, "repris à la main"); }
    }
    const miens = Object.keys(this.lfoMiens);
    const voulus = Math.min(E.T.lfoNb + (E.A.nom === "sommet" ? 1 : 0), PILOTE_MODES[mode].lfoNb);
    // un LFO dont la scene est partie, ou au tempo d'un autre morceau, s'en va
    for (const i of miens) {
      const L = this.lfoMiens[i];
      const sc = PILOTE_LFO_SCENE[L.cible];
      if ((sc && sceneCle !== sc && S.calque !== sc) || L.morceau !== this.morceau || this.horloge - L.depuis > 240) this.debrancherLfo(i);
    }
    const actifs = Object.values(this.lfoMiens).filter(L => !L.sort).length;
    if (actifs < voulus && Math.random() < 0.5 + 0.3 * E.audace) this.brancherLfo();
    else if (actifs > 0 && Math.random() < 0.15) this.debrancherLfo(tirer(Object.keys(this.lfoMiens).filter(i => !this.lfoMiens[i].sort)));
  },
  brancherLfo() {
    const mode = this.mode(), T = this.temperament();
    let libre = 0;
    for (let i = 1; i <= LFO_NB; i++) {
      if (S["lfo" + i + "Cible"] === "aucune" && !this.lfoMiens[i] && ["Cible", "Forme", "Duree", "Amplitude"].every(x => this.libre("lfo" + i + x))) { libre = i; break; }
    }
    if (!libre) return;
    const prises = new Set();
    for (let i = 1; i <= LFO_NB; i++) prises.add(S["lfo" + i + "Cible"]);
    const cands = PILOTE_LFO.filter(([c]) => {
      if (!LFO_CIBLES[c] || prises.has(c) || !this.libre(c)) return false;
      const sc = PILOTE_LFO_SCENE[c];
      if (sc && sceneCle !== sc && S.calque !== sc) return false;
      if (c === "kaleidoSpirale" && !(S.kaleido > 1)) return false;
      if (c === "calqueOpacite" && S.calque === "aucun") return false;
      if (c === "calqueMasqueOmbre" && S.calqueMelange !== "masque") return false;
      if ((mode === "poesie" || this.mainJoue) && PILOTE_MOUVEMENTS.has(c)) return false;
      return true;
    });
    if (!cands.length) return;
    const [cible, amp] = tirer(cands);
    // la duree : un nombre de mesures (quatre temps) au tempo du morceau
    const mesures = tirer(T.lfo) * (mode === "poesie" ? 2 : 1);
    // jamais sous 6 s : « tout va trop vite » (Jiiji)
    const duree = clamp(Math.round(mesures * 4 * this.beat() * 2) / 2, 6, 300);
    const i = libre;
    S["lfo" + i + "Cible"] = cible; S["lfo" + i + "Forme"] = tirer(["sinus", "sinus", "triangle", "doux"]);
    S["lfo" + i + "Duree"] = duree; S["lfo" + i + "Amplitude"] = 0;
    this.cibles["lfo" + i + "Amplitude"] = +clamp(amp * T.lfoAmp * (0.6 + 0.6 * clamp(S.piloteAudace, 0, 1)), 0.02, 0.6).toFixed(3);
    this.lfoMiens[i] = { cible, depuis: this.horloge, morceau: this.morceau, sort: false };
    for (const x of ["Cible", "Forme", "Duree", "Amplitude"]) if (controles["lfo" + i + x]) controles["lfo" + i + x].maj();
    this.noter("LFO " + i + " branché", nomReglage(cible) + ", " + mesures + " mesures (" + duree + " s)");
  },
  debrancherLfo(i) {
    const L = this.lfoMiens[i];
    if (!L || L.sort) return;
    L.sort = true;
    const k = "lfo" + i + "Amplitude";
    this.cibles[k] = 0;
    this.apres[k] = () => {
      if (this.lfoMiens[i] === L) {
        S["lfo" + i + "Cible"] = "aucune";
        delete this.lfoMiens[i];
        if (controles["lfo" + i + "Cible"]) controles["lfo" + i + "Cible"].maj();
        this.noter("LFO " + i + " débranché", nomReglage(L.cible));
      }
    };
  },

  /* ---------------------------------------------------- chaque image */

  // les effets suivent l'intensite ; les reglages choisis glissent vers leur cible
  effets(dt) {
    const k = 1 - Math.exp(-dt * 0.25);
    // un reglage sous un LFO : le pilote fait glisser sa base, le LFO ondule autour
    const lire = baseDe, poser = poserBase;
    for (const c in this.cibles) {
      if (!this.libre(c)) { delete this.cibles[c]; delete this.fin[c]; delete this.apres[c]; continue; }
      // la valeur fine reste ici ; le reglage recoit ses marches (lueur, ombre, graisse sont dans
      // la cle des vignettes : en glissant d'un cheveu a chaque image, ils faisaient redessiner
      // tous les mots a chaque image)
      let x = lerp(c in this.fin ? this.fin[c] : lire(c), this.cibles[c], k);
      const fini = Math.abs(x - this.cibles[c]) < 0.002 * Math.max(1, Math.abs(this.cibles[c]) / 10);
      if (fini) x = this.cibles[c];
      this.fin[c] = x;
      poser(c, enMarches(c, x));
      if (fini) {
        delete this.cibles[c]; delete this.fin[c];
        if (this.apres[c]) { const f = this.apres[c]; delete this.apres[c]; f(); }
      }
    }
    if (this.peut("piloteEffets")) {
      const E = this.envies(), mode = this.mode();
      const I = this.intensite, A = clamp(E.audace, 0, 1.3), F = E.effets, k2 = 1 - Math.exp(-dt * 0.5);
      const doux = mode === "poesie" || this.mainJoue;
      const cible = {
        halo: clamp(0.12 + 0.7 * I * F + this.tension * 0.25 * A, 0, 1.2),
        choc: doux ? 0 : Math.max(0, I - 0.55) * 2 * A * F,
        pompe: doux ? 0 : Math.max(0, I - 0.5) * 0.9 * A * F,
        rvb: doux ? 0 : Math.max(0, I - 0.75) * 2.4 * A * F,
        trainees: this.section === "cassure" ? 0.5 : doux ? lerp(0.3, 0.15, I) : lerp(0.45, 0.15, I),
        blocs: mode === "vjing" ? this.boost * 0.4 * A * F : 0,
        // chaque note qui sonne (l'ecran s'ecoute) fait onduler l'image un instant
        ondes: this.frisson * (mode === "poesie" ? 0.12 : 0.25) * F,
      };
      // Sur une palette claire (papier, encre), le halo eclaire le fond tout entier : des 0,3 les
      // lettres ne se detachent plus, a 0,45 l'image est blanche (mesure du 2026-10-19, lumiere.js).
      // Jiiji : « blanc blanc pendant 3 minutes c'est une galere ». Le pilote s'y arrete a 0,15
      if (palette().clair) cible.halo = Math.min(cible.halo, 0.15);
      for (const c in cible) if (this.libre(c)) poser(c, lerp(lire(c), cible[c], c === "ondes" ? 1 - Math.exp(-dt * 4) : k2));
    }
    // le son recoit ses reglages qui glissent (mode auto), une fois par seconde, en douceur
    this.sonT = (this.sonT || 0) - dt;
    if (this.sonT <= 0) {
      this.sonT = 1;
      if (this.sonTouche && typeof son !== "undefined" && son.ctx && son.appliquer) son.appliquer(false);
      this.sonTouche = Object.keys(this.cibles).some(c => c.startsWith("son"));
    }
    // le panneau suit, une fois par seconde
    this.rafraichir -= dt;
    if (this.rafraichir <= 0 && !panneau.hidden) {
      this.rafraichir = 1;
      for (const c of ["halo", "choc", "pompe", "rvb", "trainees", "blocs", "ondes"].concat(PILOTE_REGLAGES.map(r => r[0]), Object.keys(this.cibles))) if (controles[c]) controles[c].maj();
    }
  },
  // un combo pose par le pilote qui fait tomber la carte sous ~38 images par seconde pendant 5 s : il
  // le retire (en fondu) et ne le reposera plus sur cette scene
  surveillerCharge(dt) {
    if (document.hidden || S.calque === "aucun" || !this.calqueDuPilote) { this.lourdDepuis = 0; return; }
    this.lourdDepuis = this.image > 0.026 ? this.lourdDepuis + dt : 0;
    if (this.lourdDepuis > 5) {
      this.lourdDepuis = 0;
      this.lourds.add(sceneCle + "|" + (calque.cle || S.calque));
      this.noter("combo trop lourd", sceneCle + " + " + (calque.cle || S.calque) + " (" + Math.round(this.image * 1000) + " ms par image)");
      if (this.libre("calque")) { S.calque = "aucun"; if (controles.calque) controles.calque.maj(); }
    }
  },

  plein() { return this.lente > 0.6 || this.boost > 0.3 || this.section === "drop" || this.section === "plateau"; },
  nouveauMorceau(pourquoi) {
    this.morceau++; this.ageMorceau = 0; this.bpmRef = musique.bpm || 0; this.bpmAutre = 0; this.temps = this.phrase = 0;
    this.calme = 0; this.dropPret = false; this.etaitPlein = false; this.phrases = []; this.accu = null; this.refrain = null;
    this.section = "intro"; this.sectionDepuis = 0; this.tension = 0; this.tendanceBas = 0;
    if (pourquoi === "long silence") this.set = 0;
    // en mode auto, un nouveau plan, et une autre gamme pour le son
    if (this.mode() === "auto") {
      this.planifier();
      if (S.son && typeof son !== "undefined" && son.ctx && son.nouvelleGamme) son.nouvelleGamme();
    } else this.plan = null;
    this.evenementSi("morceau");
    this.noter("morceau " + this.morceau, pourquoi || "");
    // les LFO au tempo de l'ancien morceau redescendent (en glissant)
    for (const i in this.lfoMiens) this.debrancherLfo(i);
  },
  // le drop : tout de suite, ce qui ne coupe rien (le flash, les effets, un combo qui entre en
  // fondu) ; la scene pleine attend la fin du poeme
  drop() {
    const E = this.envies(), M = PILOTE_MODES[this.mode()];
    if (M.flash && S.musique && musique.actif) flash();
    this.boost = 1;
    this.dernierDrop = this.horloge;
    if (this.section !== "drop") { const a = this.section; this.section = "drop"; this.sectionDepuis = 0; this.tension = 0; this.noter("section", a + " → drop"); }
    if (this.peut("piloteCombos") && S.calque === "aucun" && !calque.scene && Math.random() < 0.6 * E.combos) {
      const v = this.combo(true);
      if (v.calque) { this.poser(v); this.noter("combo au drop", nomDe(SCENES_CALQUE, v.calque) + " (" + v.calqueMelange + ")"); }
    }
    this.evenementSi("drop");
  },
  // le passage calme : le combo s'efface en fondu ; la scene calme attend la fin du poeme
  pause() {
    // (un combo entre depuis moins de 20 s reste : il entrait a 57 s et sortait a 61 s, essai du 2026-10-18)
    if (S.calque !== "aucun" && Math.random() < 0.6 && this.libre("calque") && this.horloge - (this.comboPose || -99) > 20) {
      S.calque = "aucun"; this.comboAttente = null;
      if (controles.calque) controles.calque.maj();
      this.noter("combo retiré", "passage calme");
    }
    this.evenementSi("calme");
  },

  /* ---------------------------------------------------- dans le panneau */

  // l'etat du pilote, sous ses reglages (premier onglet), une fois par seconde, panneau ouvert
  afficher(dt) {
    this.affT = (this.affT || 0) - dt;
    if (this.affT > 0 || panneau.hidden) return;
    this.affT = 1;
    if (!this.etatEl || !this.etatEl.isConnected) {
      const lg = [...document.querySelectorAll("#pages legend")].find(x => x.textContent.startsWith("Pilote automatique"));
      if (!lg) return;
      this.etatEl = document.createElement("div"); this.etatEl.className = "etat-gen";
      this.journalEl = document.createElement("div");
      this.journalEl.style.cssText = "font:10px Consolas,monospace;white-space:pre-wrap;max-height:84px;overflow:auto;margin-top:4px;color:#333";
      lg.parentNode.append(this.etatEl, this.journalEl);
    }
    const A = this.acte(), m = Math.floor(this.set / 60), bpm = musique.bpm || this.bpmRef;
    const lfoN = Object.values(this.lfoMiens).filter(L => !L.sort).length;
    this.etatEl.textContent = "Acte : " + A.nom + " (" + m + " min) · morceau " + this.morceau + " · " + this.section +
      (this.tendance > 0.006 ? " ↗" : this.tendance < -0.006 ? " ↘" : "") + (bpm ? " · " + bpm + " BPM" : "") + " · " + this.nomCaractere() +
      (this.plan ? " · plan " + Math.round(clamp((this.horloge - this.plan.debut) / this.plan.duree, 0, 1) * 100) + " %" : "") + " · mode " + this.mode() + (this.mainJoue ? " (la main joue)" : "") + (lfoN ? " · " + lfoN + " LFO" : "") +
      (this.evenement ? " · à la fin du poème : " + this.evenement : "");
    this.journalEl.textContent = this.journal.slice(-8).reverse().map(j => Math.floor(j.t / 60) + ":" + String(Math.floor(j.t % 60)).padStart(2, "0") + "  " + j.quoi + (j.detail ? " : " + j.detail : "")).join("\n");
  },
};
// le bus (reglages.js) : les notes et les mots qui paraissent nourrissent l'energie du mode auto
if (typeof bus !== "undefined") {
  bus.ecouter("note", () => { pilote.busNotes = (pilote.busNotes || 0) + 1; });
  bus.ecouter("mot", () => { pilote.busMots = (pilote.busMots || 0) + 1; });
}
function nomDe(liste, cle) { const x = liste.find(y => y[0] === cle); return x ? x[1] : cle; }
function nomReglage(cle) {
  for (const o of SCHEMA) for (const g of o.groupes || []) for (const it of g.items || []) if (it.cle === cle) return it.nom.toLowerCase();
  return cle;
}
function basculerPilote() {
  changer("pilote", !S.pilote);
  if (controles.pilote) controles.pilote.maj();
  if (!S.pilote) annoncer("PILOTE AUTOMATIQUE", "tu reprends la main");
  else if (!(S.musique && musique.actif)) annoncer("PILOTE AUTOMATIQUE", "sans musique, il suit sa propre marée (M : écouter)");
}
