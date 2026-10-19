"use strict";
/* ================================================================ réglages */

const DEFAUTS = {
  scene: "auto", vitesse: 1, tenue: 24, qualite: 1.5,
  source: "tout", ordre: "recent", nouveauxDabord: true,
  entree: "spirale", sortie: "vortex", ecriture: 9,
  annotations: true, cartel: true, direct: true, bourse: true,
  filsRimes: true, chutes: true, votes: true, son: false, volume: 0.35, sonRimes: true,
  police: "Georgia", taille: 1, casse: "normale", espacement: 0,
  tremblement: 0.8, tremblementValeur: true, frequence: 1, ondulation: 0, respiration: 0.3,
  rotationMots: 0, glitch: 0.08, aberration: 0, lueur: 0.25, contour: false,
  spin: 1, aspiration: 1, inclinaison: 1, maelstrom: 240, sensHoraire: true,
  etoiles: 280, vitesseEtoiles: 1,
  mode3d: "rotation", profondeur: 16, surface: "degrade",
  polygones: 2, sommets: 4, echos: 14,
  vague: 1, voies: 4,
  palette: "nuit", couleurPoetes: true, derive: 0, trainees: 0.3, crt: false, fond: "degrade",
  // la carte graphique (0 partout : elle n'est pas sollicitee)
  halo: 0, seuilHalo: 0.45, rvb: 0, ondes: 0, mosaique: 0, kaleido: 0, kaleidoTourne: 0.15,
  larsen: 0, larsenZoom: 1.015, larsenRotation: 0, vhs: 0, courbure: 0, balayage: 0, grain: 0, vignetteGpu: 0, vieilleTele: false, teinteGpu: 0,
  // la musique
  musique: false, musiqueSource: "micro", musiqueEntree: "", musiqueSensibilite: 1, musiquePulse: 1, musiqueElan: 0.4,
  musiqueFlash: 0.5, musiqueEffets: 1, musiqueDrop: false,
  // les nouvelles scenes et le live
  billets: 18, rouleaux: 5, calligramme: "hasard", annoncesEcran: false, vibration: true,
  // le combo (une seconde scene en calque) et les effets ajoutes le 2026-10-17
  calque: "aucun", calqueOpacite: 0.75, calqueMelange: "lumiere", calquePlace: "derriere", calqueMouvement: "aucun", calquePoeme: "autre", calqueMusique: 0.4,
  miroir: "aucun", kaleidoSpirale: 0, choc: 0, negatif: 0, bichromie: 0, pompe: 0, larsenTeinte: 0,
  // les couleurs, les fonds, les effets et les reglages des scenes ajoutes le 2026-10-17 dans la nuit
  modeCouleur: "poetes", teinteMots: 200, vivacite: 1, clarte: 0, fondPulse: 0, ombre: 0, graisse: 0,
  persoFond: "#04050a", persoFond2: "#1b1440", persoTexte: "#f2ece0", persoAccent: "#ff3c7d", persoNote: "#7d8aa5",
  degrade: "aucun", degradeForce: 0.85, saturation: 1, contraste: 1, exposition: 1, decalage: 0, chroma: 0,
  solarisation: 0, posterisation: 0, blocs: 0, fonte: 0, strobe: 0, strobeFreq: 4,
  puitsVitesse: 1, puitsTorsion: 1, puitsParois: 1, cretesLignes: 17, cretesHauteur: 1, averseDensite: 1, averseVitesse: 1,
  rosaceTourne: 1, rosaceCopies: 12, battementStyle: "hasard", battementTemps: "2", ondeHauteur: 1, ondeReflet: true,
  // le pilote automatique (il suit la musique, morceau apres morceau) et le kaleidoscope stable
  fonduDuree: 3, pilote: false, piloteAudace: 0.5, piloteRythme: "64", piloteCouleurs: true, piloteCombos: true, piloteEffets: true, kaleidoStable: false,
  // le kick sur les mots (le side chain) et la reaction de l'ecoute, 2026-10-17
  kickMots: 0.6, kickSens: "gonfle", kickRelache: 0.22, kickSeuil: 0.5, musiqueReaction: 1,
  poemeMax: 90,
  caisseMots: 0, caisseRelache: 0.15, caisseSeuil: 0.5, charleyMots: 0, charleyRelache: 0.08, charleySeuil: 0.5,
  // le son a son propre pas, une gamme et une tonique par poeme (2026-10-17)
  sonSuit: "lui", sonGamme: "hasard", sonTonique: "hasard", sonChange: "1", sonOctave: 0,
  sonTempo: 30, sonDivision: "2", sonRythme: "flottant", sonDensite: 0.7, sonSouffle: 2, sonTenue: 1.2, sonAttaque: 0.25, sonAccords: 0.15,
  sonTimbre: "derive", sonMetal: 0.35, sonBruit: 0.2, sonBourdon: 0, sonPoussiere: 0.25,
  sonReverb: 0.5, sonEcho: 0.35, sonEchoTemps: "0.75", sonFiltre: 5000, sonSature: 0.1, sonEcrase: 0, sonLargeur: 0.6,
  // le son evolue, et ses notes se modulent (2026-10-17)
  sonEvolution: 0.6, sonCycle: 5, sonArc: true,
  sonVibrato: 0.15, sonVibratoVitesse: 4.5, sonTremolo: 0, sonTremoloVitesse: 5, sonBalayage: 0.3, sonResonance: 0.3,
  sonGlisse: 0.15, sonUsure: 0.2, sonHasard: 0, sonBegaiement: 0.08, sonMouvement: 0.3,
  // la manette joue : les mots, l'image et le son a la main (2026-10-17)
  manetteMode: "jouer", mainCurseur: true, mainVie: 14, mainTaille: 1, mainSensibilite: 1, mainNotes: true, mainVent: 0, mainEnvol: 0,
};

// Ce qui evolue dans le son : [plancher, plafond, ampleur de la derive lente, en octaves (vrai) ou
// en plus et en moins]. Les mouvements sont six climats que le son traverse l'un apres l'autre ;
// leurs ecarts s'ajoutent aux reglages (en octaves pour la clarte, le tempo et la duree des notes).
const SON_BORNES = {
  sonFiltre: [150, 14000, 0.8, true], sonTempo: [4, 200, 0.15, true], sonTenue: [0.15, 6, 0.4, true],
  sonDensite: [0.05, 1, 0.2], sonSouffle: [0, 10, 1], sonAttaque: [0, 1, 0.25], sonAccords: [0, 1, 0.15],
  sonMetal: [0, 1, 0.25], sonBruit: [0, 1, 0.15], sonBourdon: [0, 1, 0.2], sonPoussiere: [0, 1, 0.15],
  sonReverb: [0, 1, 0.2], sonEcho: [0, 0.85, 0.15], sonSature: [0, 1, 0.1], sonLargeur: [0, 1, 0.2],
  sonVibrato: [0, 1, 0.15], sonTremolo: [0, 1, 0.15], sonBalayage: [-1, 1, 0.4], sonResonance: [0, 1, 0.2],
  sonGlisse: [0, 1, 0.2], sonUsure: [0, 1, 0.2], sonHasard: [0, 1, 0.1], sonBegaiement: [0, 1, 0.1], sonMouvement: [0, 1, 0.2],
};
// les mouvements penchent vers les notes (Jiiji, 2026-10-19 : « les basses toujours en drone,
// trop noise expe ») : plus de bourdon dedans, ni de tenue rallongee
const SON_MOUVEMENTS = [
  { nom: "épars", sonDensite: -0.3, sonSouffle: 1.5, sonFiltre: -0.6, sonReverb: 0.15, sonTenue: -0.2, sonPoussiere: 0.05, sonTempo: -0.25,
    sonAccords: -0.1, timbres: ["kalimba", "boite", "clochette", "pluck"] },
  { nom: "nappe", sonDensite: -0.1, sonTenue: 0.3, sonAttaque: 0.1, sonAccords: 0.3, sonEcho: 0.1, sonVibrato: 0.1, sonMouvement: 0.2,
    timbres: ["fmdoux", "clochette", "corde", "marimba"] },
  { nom: "grains", sonDensite: 0.35, sonSouffle: -1, sonTenue: -0.8, sonAttaque: -0.4, sonReverb: -0.2, sonEcho: 0.25, sonFiltre: 0.6,
    sonTempo: 0.3, sonBegaiement: 0.2, timbres: ["pluck", "marimba", "kalimba", "peau", "corde"] },
  { nom: "rouille", sonMetal: 0.4, sonBruit: 0.1, sonSature: 0.1, sonFiltre: -0.4, sonPoussiere: 0.1, sonUsure: 0.3, sonResonance: 0.2,
    timbres: ["fmdoux", "clochette", "kalimba"] },
  { nom: "clair", sonFiltre: 1, sonMetal: -0.3, sonBruit: -0.2, sonPoussiere: -0.2, sonReverb: 0.1, sonLargeur: 0.3,
    timbres: ["boite", "clochette", "fmdoux", "pluck", "sinus"] },
  { nom: "presque rien", sonDensite: -0.5, sonSouffle: 2.5, sonFiltre: -0.5, sonUsure: 0.2, timbres: ["boite", "kalimba", "sinus"] },
];

// Les gammes du son : [cle, nom, demi-tons depuis la tonique]. Des demi-tons a virgule pour les
// quarts de ton et pour ce qui n'est pas tempere (pelog, slendro, la serie des harmoniques).
const GAMMES = [
  ["majeur", "Majeur (ionien)", [0, 2, 4, 5, 7, 9, 11]], ["mineur", "Mineur naturel (éolien)", [0, 2, 3, 5, 7, 8, 10]],
  ["harmonique", "Mineur harmonique", [0, 2, 3, 5, 7, 8, 11]], ["melodique", "Mineur mélodique", [0, 2, 3, 5, 7, 9, 11]],
  ["dorien", "Dorien", [0, 2, 3, 5, 7, 9, 10]], ["phrygien", "Phrygien", [0, 1, 3, 5, 7, 8, 10]],
  ["lydien", "Lydien", [0, 2, 4, 6, 7, 9, 11]], ["mixolydien", "Mixolydien", [0, 2, 4, 5, 7, 9, 10]],
  ["locrien", "Locrien", [0, 1, 3, 5, 6, 8, 10]], ["pentaMaj", "Pentatonique majeure", [0, 2, 4, 7, 9]],
  ["pentaMin", "Pentatonique mineure", [0, 3, 5, 7, 10]], ["blues", "Blues", [0, 3, 5, 6, 7, 10]],
  ["tons", "Par tons (Debussy)", [0, 2, 4, 6, 8, 10]], ["diminuee", "Diminuée (Messiaen, mode 2)", [0, 1, 3, 4, 6, 7, 9, 10]],
  ["messiaen3", "Messiaen, mode 3", [0, 2, 3, 4, 6, 7, 8, 10, 11]], ["augmentee", "Augmentée", [0, 3, 4, 7, 8, 11]],
  ["promethee", "Prométhée (Scriabine)", [0, 2, 4, 6, 9, 10]], ["enigmatique", "Énigmatique (Verdi)", [0, 1, 4, 6, 8, 10, 11]],
  ["hijaz", "Hijaz (phrygien dominant)", [0, 1, 4, 5, 7, 8, 10]], ["byzantine", "Double harmonique (byzantine)", [0, 1, 4, 5, 7, 8, 11]],
  ["hongroise", "Hongroise mineure", [0, 2, 3, 6, 7, 8, 11]], ["napolitaine", "Napolitaine mineure", [0, 1, 3, 5, 7, 8, 11]],
  ["todi", "Raga todi", [0, 1, 3, 6, 7, 8, 11]], ["marwa", "Raga marwa", [0, 1, 4, 6, 7, 9, 11]],
  ["hirajoshi", "Hirajoshi (Japon)", [0, 2, 3, 7, 8]], ["insen", "In sen (Japon)", [0, 1, 5, 7, 10]],
  ["iwato", "Iwato (Japon)", [0, 1, 5, 6, 10]], ["kumoi", "Kumoi (Japon)", [0, 2, 3, 7, 9]],
  ["pelog", "Pelog (gamelan, non tempéré)", [0, 1.2, 2.7, 5.4, 6.7, 7.85, 9.5]], ["slendro", "Slendro (gamelan, cinq parts égales)", [0, 2.4, 4.8, 7.2, 9.6]],
  ["rast", "Maqam rast (quarts de ton)", [0, 2, 3.5, 5, 7, 9, 10.5]], ["bayati", "Maqam bayati (quarts de ton)", [0, 1.5, 3, 5, 7, 8, 10]],
  ["saba", "Maqam saba (quarts de ton)", [0, 1.5, 3, 4, 7, 8, 10]],
  ["harmoniques", "Série des harmoniques (8 à 15)", [8, 9, 10, 11, 12, 13, 14, 15].map(n => 12 * Math.log2(n / 8))],
  ["chromatique", "Chromatique (les douze)", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]],
];
const NOTES_NOMS = ["do", "do♯", "ré", "mi♭", "mi", "fa", "fa♯", "sol", "la♭", "la", "si♭", "si"];
const TIMBRES_NOMS = [["sinus", "Sinus (pur)"], ["verre", "Verre (deux sinus qui battent)"], ["fm", "Cloche de métal (FM)"],
  ["corde", "Corde pincée"], ["souffle", "Souffle (un bruit qui siffle)"], ["gresil", "Grésil (des grains)"],
  ["anneau", "Anneau (modulation en anneau)"], ["goutte", "Goutte"], ["carre", "Carré usé"],
  ["voyelle", "Voyelle (le mot chanté)"], ["orgue", "Orgue de papier"], ["chimere", "Chimère (un timbre inventé à chaque poème)"],
  ["nuee", "Nuée (nappe de dents de scie)"], ["sirene", "Sirène (glisse d'une note à l'autre)"],
  ["ondes", "Ondes courtes (une radio mal réglée)"], ["peau", "Peau frappée"]];

// La musique mene les effets (2026-10-17, Jiiji : « il faut plus de parametres pour faire
// interagir la musique avec les effets »). Chaque effet de la carte graphique choisit ce qu'il
// ecoute et avec quelle force ; une force negative le fait plonger sur le son, comme un side
// chain. Tout est a 0 au depart : rien ne change tant qu'on n'y touche pas.
// [cle, nom, valeur du shader, echelle, ce qu'il ecoute au depart, plancher, plafond]
const MODS = [
  ["Halo", "Halo", "halo", 1.2, "basses", 0, 4], ["Rvb", "Décalage rouge vert bleu", "rvb", 1.5, "kick", 0, 5],
  ["Ondes", "Ondes", "ondes", 0.8, "mediums", 0, 4], ["Mosaique", "Mosaïque", "mosaique", 0.35, "kick", 0, 1],
  ["Blocs", "Glitch en blocs", "blocs", 0.7, "kick", 0, 2], ["Fonte", "L'image fond et coule", "fonte", 0.6, "basses", 0, 1],
  ["Larsen", "Larsen", "larsen", 0.5, "volume", 0, 0.98], ["LarsenZoom", "Zoom du larsen", "lZoom", 0.03, "basses", 0.85, 1.15],
  ["KZoom", "Le kaléidoscope respire", "kZoom", 0.3, "basses", 0.3, 3], ["KTourne", "Le kaléidoscope tourne", "kTourne", 1.2, "mediums", -99, 99],
  ["KSpirale", "Le kaléidoscope s'enroule", "kSpirale", 1, "basses", 0, 6],
  ["Saturation", "Saturation", "sat", 0.8, "basses", 0, 4], ["Contraste", "Contraste", "contraste", 0.5, "kick", 0.2, 4],
  ["Lumiere", "Lumière", "expo", 0.6, "kick", 0.1, 4], ["Teintes", "Décaler les teintes", "decal", 1.5, "mesure", -99, 99],
  ["Chroma", "Arc-en-ciel en cercles", "chroma", 0.8, "aigus", 0, 1.5], ["Solarisation", "Solarisation", "solar", 0.8, "kick", 0, 1],
  ["Bichromie", "Bichromie", "bichro", 0.8, "basses", 0, 1],
  ["Vhs", "Cassette VHS", "vhs", 0.7, "aigus", 0, 1], ["Courbure", "Écran bombé", "courbure", 0.4, "kick", 0, 1],
  ["Grain", "Grain", "grain", 0.6, "aigus", 0, 1.5], ["Vignette", "Coins assombris", "vignette", 0.8, "contretemps", 0, 1.5],
];
const MOD_SOURCES = [["basses", "les basses"], ["mediums", "les médiums"], ["aigus", "les aigus"], ["kick", "le kick (coups des basses)"],
  ["caisse", "la caisse claire (coups des médiums)"], ["charley", "le charley (coups des aigus)"],
  ["contretemps", "entre les kicks (il retombe sur le kick)"], ["volume", "le volume"], ["mesure", "une vague sur une mesure (4 temps)"]];
for (const [c, , , , src] of MODS) { DEFAUTS["mod" + c] = 0; DEFAUTS["mod" + c + "Src"] = src; }
// les LFO : chacun fait onduler un reglage de l'image autour de sa valeur (onglet LFO)
const LFO_NB = 6;
for (let i = 1; i <= LFO_NB; i++) Object.assign(DEFAUTS, { ["lfo" + i + "Cible"]: "aucune", ["lfo" + i + "Forme"]: "sinus", ["lfo" + i + "Duree"]: 30, ["lfo" + i + "Amplitude"]: 0.3 });
const MOD_GROUPES = [["Lumière et matière", 0, 6], ["Larsen et kaléidoscope", 6, 11], ["Couleurs de l'image", 11, 18], ["Vieux écrans", 18, 22]];

const CLE_STOCKAGE = "poiasie-ecran-v1";
function lireStockage() {
  try { return JSON.parse(localStorage.getItem(CLE_STOCKAGE) || "{}"); } catch (e) { return {}; }
}
// la manette et la musique changent les reglages des dizaines de fois par seconde : on
// n'ecrit dans le navigateur qu'une fois les mains posees
let attenteSauver = null;
function sauver() {
  clearTimeout(attenteSauver);
  attenteSauver = setTimeout(() => {
    try { localStorage.setItem(CLE_STOCKAGE, JSON.stringify(lfo.aSauver())); } catch (e) { /* stockage refuse : tant pis */ }
  }, 400);
}
const STOCKE = lireStockage();
const S = Object.assign({}, DEFAUTS, STOCKE);
const PARAMS = new URLSearchParams(location.search);
// un reglage venu de l'adresse (?vitesse=0.5, ?essai=1) vaut pour cette fenetre seulement : on
// enregistre a sa place ce qui etait garde (avant, ?essai=1 restait pour toujours ; audit du 2026-10-18)
const DEPUIS_ADRESSE = {};
function lireAdresse(k, defaut) {
  const v = PARAMS.get(k);
  const x = typeof defaut === "number" ? Number(v) : typeof defaut === "boolean" ? v === "1" || v === "true" : v;
  if (typeof defaut === "number" && !isFinite(x)) return;
  S[k] = DEPUIS_ADRESSE[k] = x;
}
for (const [k] of PARAMS) if (k in DEFAUTS) lireAdresse(k, DEFAUTS[k]);
if (PARAMS.get("essai")) S.source = DEPUIS_ADRESSE.source = "essai";
if (S.manetteMode === "effets") S.manetteMode = "video";  // la table de VJ d'avant est devenue la page FX video

// Les scenes de poesie visuelle d'abord (touches 1 a 0) ; celles de la Banque en dernier :
// Jiiji les trouve moins jolies (2026-10-16), elles restent dans la liste mais ne passent plus
// d'elles-memes (ni dans « Toutes », ni avec L1 / R1)
const SCENES_NOMS = [["auto", "(Toutes, à tour de rôle)"], ["lecture", "Lecture"], ["calligramme", "Calligramme (à la manière d'Apollinaire)"], ["tourbillon", "Tourbillon"],
  ["etoiles", "Champ d'étoiles"], ["constellation", "Constellations (la nuit étoilée)"], ["nuee", "La nuée (murmuration de lettres)"],
  ["ruban", "Écriture automatique (le fil d'encre)"], ["coupdedes", "Un coup de dés (Mallarmé)"], ["mystifier", "Mystifier"], ["texte3d", "Texte 3D"],
  ["puits", "Le puits (on tombe dans les vers)"], ["cretes", "Les crêtes (le pouls du poème)"], ["averse", "L'averse (il pleut des lettres)"],
  ["rosace", "La rosace (les vers en mandala)"], ["battement", "Un mot par temps (la typographie qui bat)"], ["onde", "L'oscilloscope (le vers est l'onde)"],
  ["defilement", "Texte défilant"],
  ["corbeille", "La Corbeille (Bourse des mots)"], ["marches", "Salle des marchés"], ["billets", "Planche à billets"],
  ["machine", "Machine à sous"]];
const SCENES_BANQUE = new Set(["corbeille", "marches", "billets", "machine"]);
// ce qu'on peut mettre en calque, par-dessus ou par-dessous la scene (le combo)
const SCENES_CALQUE = [["aucun", "(pas de seconde scène)"], ["auto", "(une autre, à tour de rôle)"]]
  .concat(SCENES_NOMS.filter(([k]) => k !== "auto" && !SCENES_BANQUE.has(k)));

const FORMES_NOMS = [["sonnet", "Sonnet"], ["pantoum", "Pantoum"], ["terza_rima", "Terza rima"], ["villanelle", "Villanelle"],
  ["rondeau", "Rondeau"], ["sextine", "Sextine"], ["ghazal", "Ghazal"], ["renga", "Renga"], ["cadavre", "Cadavre exquis"],
  ["acrostiche", "Acrostiche"], ["boule_de_neige", "Boule de neige"], ["litanie", "Litanie"], ["vers_libres", "Vers libres"],
  // les huit formes du 2026-10-18 (formes.py), pour le menu « Un poeme tout de suite » (grand rangement du 2026-10-19)
  ["blason", "Blason"], ["logorrhee", "Logorrhée"], ["begaiement", "Bégaiement"], ["exorcisme", "Exorcisme"],
  ["releve", "Relevé"], ["partition", "Partition"], ["dictionnaire", "Dictionnaire"], ["litanie_derape", "Litanie qui dérape"]];

const PALETTES = {
  nuit:      { nom: "Nuit", fond: ["#04050a", "#111528"], texte: "#ece6d6", accent: "#e8c46a", note: "#7d8aa5", teinte: 45 },
  bureau95:  { nom: "Bureau 95", fond: ["#006a6a", "#008080"], texte: "#ffffff", accent: "#ffff66", note: "#bfffff", teinte: 180 },
  mystify:   { nom: "Mystifier", fond: ["#000000", "#000000"], texte: "#ffffff", accent: "#00ffff", note: "#808080", arcEnCiel: true, teinte: 0 },
  ambre:     { nom: "Ambre", fond: ["#080500", "#160c00"], texte: "#ffb000", accent: "#ffe0a0", note: "#a06a00", mono: true, teinte: 40 },
  phosphore: { nom: "Phosphore", fond: ["#000802", "#002208"], texte: "#33ff66", accent: "#c8ffd8", note: "#1a8a3a", mono: true, teinte: 135 },
  billet:    { nom: "Billet de banque", fond: ["#082419", "#14432f"], texte: "#efe6c8", accent: "#e0b95c", note: "#86a893", teinte: 50 },
  papier:    { nom: "Papier", fond: ["#e6dcc6", "#f6f1e5"], texte: "#1d1a16", accent: "#9b2b1e", note: "#8a7f6c", clair: true, teinte: 20 },
  crepuscule: { nom: "Crépuscule", fond: ["#0f1530", "#4a3556"], texte: "#f6e6d6", accent: "#ffb27a", note: "#c9b6d8", teinte: 25 },
  arc:       { nom: "Arc-en-ciel", fond: ["#000000", "#07000c"], texte: "#ffffff", accent: "#ffffff", note: "#999999", arcEnCiel: true, teinte: 0 },
  neon:      { nom: "Néon", fond: ["#05000f", "#14002a"], texte: "#f0e8ff", accent: "#00f0ff", note: "#ff2bd6", teinte: 300 },
  vapeur:    { nom: "Vaporwave", fond: ["#1a0b2e", "#3d1a5c"], texte: "#ffd6f5", accent: "#5cf2ff", note: "#ff71ce", teinte: 310 },
  braise:    { nom: "Braise", fond: ["#0a0200", "#2a0800"], texte: "#ffd9b0", accent: "#ff5a1f", note: "#a8441c", teinte: 20 },
  sang:      { nom: "Rouge sang", fond: ["#0a0000", "#220004"], texte: "#ffe1e1", accent: "#ff1f3d", note: "#8c2a35", teinte: 355 },
  glace:     { nom: "Glace", fond: ["#00070f", "#06263a"], texte: "#dff6ff", accent: "#7fe3ff", note: "#5a8aa6", teinte: 195 },
  foret:     { nom: "Forêt", fond: ["#020a05", "#0c2416"], texte: "#e3f2d8", accent: "#c6ff6b", note: "#6f8f6a", teinte: 110 },
  or:        { nom: "Or noir", fond: ["#000000", "#120d02"], texte: "#f4d58d", accent: "#fff1c1", note: "#8a6d2a", mono: true, teinte: 45 },
  klein:     { nom: "Bleu Klein", fond: ["#001a8c", "#002fa7"], texte: "#ffffff", accent: "#ffe14d", note: "#9fb3ff", teinte: 230 },
  encre:     { nom: "Encre de Chine", fond: ["#f4f1ea", "#ffffff"], texte: "#0b0b0b", accent: "#c8102e", note: "#6b6b6b", clair: true, mono: true, teinte: 0 },
  perso:     { nom: "Ma palette (onglet Couleurs)", fond: ["#04050a", "#1b1440"], texte: "#f2ece0", accent: "#ff3c7d", note: "#7d8aa5", teinte: 330 },
};
// les degrades de l'image : quatre couleurs, du plus sombre au plus clair
const DEGRADES = {
  feu: ["#000000", "#7a0a00", "#ff6a00", "#fff3b0"], glace: ["#000814", "#003a6b", "#4fc3f7", "#ffffff"],
  neon: ["#0b0014", "#6a00ff", "#ff00c8", "#00fff0"], or: ["#000000", "#3b2a07", "#c9962b", "#fff4c8"],
  aurore: ["#020016", "#0a6b5a", "#7bff9a", "#f6ffe8"], acide: ["#001100", "#00ff66", "#fff200", "#ff00aa"],
  sepia: ["#120a04", "#5a3b1e", "#c49a6c", "#fbf0dc"], thermique: ["#000033", "#7a00a0", "#ff3000", "#ffff80"],
  sang: ["#000000", "#4a0008", "#e0102a", "#ffe0e0"], encre: ["#0b0b0b", "#3c3c3c", "#bdbdbd", "#f7f3ea"],
};
const DEGRADES_NOMS = [["aucun", "Aucun"], ["palette", "Celui de la palette"], ["feu", "Feu"], ["glace", "Glace"], ["neon", "Néon"], ["or", "Or"],
  ["aurore", "Aurore boréale"], ["acide", "Acide"], ["sepia", "Sépia"], ["thermique", "Caméra thermique"], ["sang", "Sang"], ["encre", "Encre (noir et blanc)"]];
function couleursDegrade() {
  const P = palette();
  const d = S.degrade === "palette" ? (P.clair ? [P.texte, P.note, P.accent, P.fond[1]] : [P.fond[0], P.note, P.accent, P.texte]) : DEGRADES[S.degrade] || DEGRADES.feu;
  return d.map(rgbDe);
}
const TEINTES = { "Le lyrique": 345, "Le minimaliste": 200, "Le surréaliste": 275, "Le surrealiste": 275,
  "Le sonore": 48, "Le brut": 18, "à cinq mains": 160, "la boucle": 120 };

const SCHEMA = [
  { onglet: "Écran de veille", moniteur: true, groupes: [
    { titre: "Écran de veille", items: [
      { cle: "scene", nom: "Scène", type: "choix", options: SCENES_NOMS },
      { cle: "vitesse", nom: "Vitesse générale", type: "curseur", min: 0.02, max: 3, pas: 0.01 },
      { cle: "tenue", nom: "Tenue d'un poème (secondes)", type: "curseur", min: 5, max: 300, pas: 1 },
      { cle: "fonduDuree", nom: "Fondu entre deux scènes (secondes)", type: "curseur", min: 0.3, max: 10, pas: 0.1 },
      { cle: "poemeMax", nom: "Un poème dure au plus (vraies secondes, quelle que soit la vitesse ; 600 : sans limite)", type: "curseur", min: 15, max: 600, pas: 5 },
    ]},
    { titre: "Pilote automatique (touche ² ou F2, PS sur la manette)", items: [
      { cle: "pilote", nom: "Le pilote suit la musique, morceau après morceau", type: "case" },
      { cle: "piloteAudace", nom: "Audace", type: "curseur", min: 0, max: 1, pas: 0.05 },
      { cle: "piloteRythme", nom: "Ses réglages glissent tous les", type: "choix", options: [["32", "32 temps (8 mesures)"], ["64", "64 temps (16 mesures)"], ["128", "128 temps (32 mesures)"]] },
      { cle: "piloteCouleurs", nom: "Il change les palettes et les fonds", type: "case" },
      { cle: "piloteCombos", nom: "Il fait des combos", type: "case" },
      { cle: "piloteEffets", nom: "Il mène les effets (et pose des kaléidoscopes)", type: "case" },
    ]},
    { titre: "Ambiances toutes prêtes", ambiances: true },
  ]},
  { onglet: "Combo", groupes: [
    { titre: "Combos tout prêts", ambiances: "combo" },
    { titre: "Une seconde scène en même temps (touche W)", items: [
      { cle: "calque", nom: "Seconde scène", type: "choix", options: SCENES_CALQUE },
      { cle: "calquePlace", nom: "Où", type: "choix", options: [["derriere", "Derrière la scène"], ["devant", "Devant la scène"]] },
      { cle: "calqueMelange", nom: "Mélange", type: "choix", options: [["lumiere", "Lumière (les deux s'additionnent)"], ["ecran", "Écran (plus doux)"], ["dessus", "Simplement par-dessus"], ["difference", "Différence (l'une creuse l'autre)"], ["exclusion", "Exclusion"], ["superposition", "Incrustation"], ["multiplier", "Encre (pour les fonds clairs)"]] },
      { cle: "calqueOpacite", nom: "Présence", type: "curseur", min: 0, max: 1, pas: 0.05 },
      { cle: "calqueMouvement", nom: "Mouvement", type: "choix", options: [["aucun", "Immobile"], ["miroir", "En miroir"], ["renverse", "À l'envers"], ["tourne", "Il tourne lentement"], ["loin", "Au loin (petit, au milieu)"], ["pres", "De près (agrandi)"], ["bat", "Il bat sur les temps forts"]] },
      { cle: "calquePoeme", nom: "Ce qu'elle lit", type: "choix", options: [["autre", "Son propre poème"], ["meme", "Le même poème"]] },
      { cle: "calqueMusique", nom: "Les basses la font apparaître", type: "curseur", min: 0, max: 1, pas: 0.05 },
    ]},
  ]},
  { onglet: "Mots", groupes: [
    { titre: "Lettres", items: [
      { cle: "police", nom: "Police", type: "choix", options: ["Georgia", "Times New Roman", "Garamond", "Palatino Linotype", "Courier New", "Consolas", "Tahoma", "Impact", "Comic Sans MS", "Segoe UI"].map(p => [p, p]) },
      { cle: "taille", nom: "Taille", type: "curseur", min: 0.4, max: 2.5, pas: 0.05 },
      { cle: "casse", nom: "Casse", type: "choix", options: [["normale", "Normale"], ["minuscules", "minuscules"], ["majuscules", "MAJUSCULES"]] },
      { cle: "espacement", nom: "Espacement", type: "curseur", min: -2, max: 12, pas: 0.5 },
    ]},
    { titre: "Effets sur les mots", items: [
      { cle: "tremblement", nom: "Tremblement", type: "curseur", min: 0, max: 8, pas: 0.1 },
      { cle: "tremblementValeur", nom: "Les mots usés tremblent plus (cours de la Bourse)", type: "case" },
      { cle: "frequence", nom: "Fréquence", type: "curseur", min: 0.1, max: 5, pas: 0.1 },
      { cle: "ondulation", nom: "Ondulation", type: "curseur", min: 0, max: 4, pas: 0.1 },
      { cle: "respiration", nom: "Respiration", type: "curseur", min: 0, max: 3, pas: 0.05 },
      { cle: "rotationMots", nom: "Roulis", type: "curseur", min: 0, max: 3, pas: 0.05 },
      { cle: "glitch", nom: "Glitch", type: "curseur", min: 0, max: 1, pas: 0.01 },
      { cle: "aberration", nom: "Aberration chromatique", type: "curseur", min: 0, max: 3, pas: 0.05 },
      { cle: "lueur", nom: "Lueur", type: "curseur", min: 0, max: 2, pas: 0.05 },
      { cle: "contour", nom: "Contour des lettres", type: "case" },
      { cle: "graisse", nom: "Graisse (lettres plus épaisses)", type: "curseur", min: 0, max: 3, pas: 0.1 },
      { cle: "ombre", nom: "Relief (une ombre décalée)", type: "curseur", min: 0, max: 2, pas: 0.05 },
    ]},
  ]},
  { onglet: "Mouvements", groupes: [
    { titre: "Scène Lecture seulement (touche 1)", items: [
      { cle: "entree", nom: "Les vers arrivent", type: "choix", options: [["fondu", "Fondu"], ["machine", "Machine à écrire"], ["spirale", "Spirale"], ["chute", "Chute du ciel"], ["eclat", "Éclats"]] },
      { cle: "sortie", nom: "Les vers s'en vont", type: "choix", options: [["vortex", "Vortex"], ["fonte", "Fonte"], ["chute", "Chute"], ["envol", "Envol"], ["dissolution", "Poussière"], ["fondu", "Fondu"]] },
      { cle: "ecriture", nom: "Mots écrits par seconde", type: "curseur", min: 0.5, max: 60, pas: 0.5 },
    ]},
    { titre: "Tourbillon", items: [
      { cle: "spin", nom: "Rotation", type: "curseur", min: 0, max: 4, pas: 0.01 },
      { cle: "aspiration", nom: "Aspiration", type: "curseur", min: 0.1, max: 4, pas: 0.05 },
      { cle: "inclinaison", nom: "Inclinaison", type: "curseur", min: 0.15, max: 1, pas: 0.01 },
      { cle: "maelstrom", nom: "Mots du maelström", type: "curseur", min: 0, max: 900, pas: 10 },
      { cle: "sensHoraire", nom: "Sens des aiguilles d'une montre", type: "case" },
    ]},
    { titre: "Champ d'étoiles", items: [
      { cle: "etoiles", nom: "Étoiles", type: "curseur", min: 20, max: 900, pas: 10 },
      { cle: "vitesseEtoiles", nom: "Vitesse de vol", type: "curseur", min: 0.02, max: 5, pas: 0.01 },
    ]},
    { titre: "Texte 3D", items: [
      { cle: "mode3d", nom: "Mouvement", type: "choix", options: [["rotation", "Rotation"], ["bascule", "Bascule"], ["vague", "Vague"], ["culbute", "Culbute"], ["tournis", "Tournis"]] },
      { cle: "profondeur", nom: "Profondeur", type: "curseur", min: 0, max: 40, pas: 1 },
      { cle: "surface", nom: "Surface", type: "choix", options: [["degrade", "Dégradé"], ["chrome", "Chrome"], ["arc", "Arc-en-ciel"], ["poete", "Couleur du poète"], ["plein", "Unie"]] },
    ]},
    { titre: "Mystifier", items: [
      { cle: "polygones", nom: "Polygones", type: "curseur", min: 1, max: 4, pas: 1 },
      { cle: "sommets", nom: "Sommets", type: "curseur", min: 3, max: 7, pas: 1 },
      { cle: "echos", nom: "Échos", type: "curseur", min: 1, max: 40, pas: 1 },
    ]},
    { titre: "Texte défilant", items: [
      { cle: "vague", nom: "Vague", type: "curseur", min: 0, max: 3, pas: 0.05 },
      { cle: "voies", nom: "Voies", type: "curseur", min: 1, max: 8, pas: 1 },
    ]},
    { titre: "Calligramme", items: [
      { cle: "calligramme", nom: "Forme", type: "choix", options: [["hasard", "Au hasard"], ["coeur", "Cœur"], ["miroir", "Miroir (le titre dedans)"], ["montre", "Montre (à l'heure vraie)"], ["spirale", "Spirale"], ["fontaine", "Jet d'eau"], ["pluie", "Il pleut"], ["tour", "Tour"], ["losange", "Losange"], ["sablier", "Sablier"], ["coupe", "Coupe"], ["etoile", "Étoile"], ["lune", "Lune"], ["vague", "La mer"], ["cravate", "Cravate"], ["goutte", "Larme"], ["oeil", "Œil"]] },
    ]},
    { titre: "Le puits", items: [
      { cle: "puitsVitesse", nom: "Vitesse de chute", type: "curseur", min: 0.03, max: 3, pas: 0.01 },
      { cle: "puitsTorsion", nom: "Il se tord", type: "curseur", min: 0, max: 2.5, pas: 0.05 },
      { cle: "puitsParois", nom: "Parois de mots (0 : aucune)", type: "curseur", min: 0, max: 2, pas: 0.05 },
    ]},
    { titre: "Les crêtes", items: [
      { cle: "cretesLignes", nom: "Lignes", type: "curseur", min: 8, max: 30, pas: 1 },
      { cle: "cretesHauteur", nom: "Hauteur des crêtes", type: "curseur", min: 0.3, max: 2.5, pas: 0.05 },
    ]},
    { titre: "L'averse", items: [
      { cle: "averseDensite", nom: "Densité de la pluie", type: "curseur", min: 0.2, max: 3, pas: 0.05 },
      { cle: "averseVitesse", nom: "Vitesse de la pluie", type: "curseur", min: 0.05, max: 3, pas: 0.01 },
    ]},
    { titre: "La rosace", items: [
      { cle: "rosaceTourne", nom: "Elle tourne", type: "curseur", min: 0, max: 4, pas: 0.05 },
      { cle: "rosaceCopies", nom: "Copies d'un vers au plus", type: "curseur", min: 1, max: 16, pas: 1 },
    ]},
    { titre: "Un mot par temps", items: [
      { cle: "battementStyle", nom: "Les mots", type: "choix", options: [["hasard", "En bloc ou en écho, au hasard"], ["bloc", "S'empilent en bloc"], ["echo", "Un seul, les autres en écho"]] },
      { cle: "battementTemps", nom: "Avec la musique, un mot tous les", type: "choix", options: [["1", "temps fort"], ["2", "deux temps forts"], ["4", "quatre temps forts"]] },
    ]},
    { titre: "L'oscilloscope", items: [
      { cle: "ondeHauteur", nom: "Hauteur de l'onde", type: "curseur", min: 0.2, max: 2.5, pas: 0.05 },
      { cle: "ondeReflet", nom: "Le reflet à l'envers", type: "case" },
    ]},
    { titre: "Planche à billets", items: [
      { cle: "billets", nom: "Petites coupures", type: "curseur", min: 0, max: 60, pas: 1 },
    ]},
    { titre: "Machine à sous", items: [
      { cle: "rouleaux", nom: "Rouleaux", type: "curseur", min: 3, max: 8, pas: 1 },
    ]},
  ]},
  { onglet: "Couleurs", groupes: [
    { titre: "Palette (touche N)", items: [
      { cle: "palette", nom: "Palette", type: "choix", options: Object.entries(PALETTES).map(([k, p]) => [k, p.nom]) },
    ]},
    { titre: "La couleur des mots", items: [
      { cle: "modeCouleur", nom: "Les mots sont", type: "choix", options: [["poetes", "De la couleur de leur poète"], ["palette", "De la couleur de la palette"], ["accent", "Tous de la couleur vive"], ["alternance", "Un vers sur deux en couleur vive"], ["arc", "En arc-en-ciel qui défile"], ["teinte", "D'une teinte choisie"]] },
      { cle: "teinteMots", nom: "La teinte choisie", type: "curseur", min: 0, max: 359, pas: 1 },
      { cle: "vivacite", nom: "Vivacité", type: "curseur", min: 0, max: 2, pas: 0.05 },
      { cle: "clarte", nom: "Clarté", type: "curseur", min: -1, max: 1, pas: 0.05 },
      { cle: "derive", nom: "Les couleurs dérivent", type: "curseur", min: 0, max: 3, pas: 0.05 },
      { cle: "couleurPoetes", nom: "Une couleur par poète", type: "case" },
    ]},
    { titre: "Le fond", items: [
      { cle: "fond", nom: "Fond", type: "choix", options: [["degrade", "Dégradé"], ["uni", "Uni"], ["aucun", "Noir (ou blanc)"], ["etoiles", "Ciel étoilé"], ["aurore", "Aurore (nuées de couleur)"], ["horizon", "Horizon (coucher de soleil)"], ["rayons", "Soleil levant (rayons)"], ["sol", "Sol de lettres jusqu'à l'horizon"], ["tapisserie", "Papier peint de mots"], ["filigrane", "Filigrane (grands mots pâles)"], ["cahier", "Page de cahier"], ["maelstrom", "Maelström partout"]] },
      { cle: "fondPulse", nom: "Le fond bat avec les basses", type: "curseur", min: 0, max: 2, pas: 0.05 },
      { cle: "trainees", nom: "Traînées", type: "curseur", min: 0, max: 0.97, pas: 0.01 },
      { cle: "crt", nom: "Écran cathodique (balayage, vignette)", type: "case" },
    ]},
    { titre: "Ma palette (choisir « Ma palette » plus haut)", items: [
      { cle: "persoFond", nom: "Fond (bords)", type: "couleur" },
      { cle: "persoFond2", nom: "Fond (milieu)", type: "couleur" },
      { cle: "persoTexte", nom: "Texte", type: "couleur" },
      { cle: "persoAccent", nom: "Couleur vive", type: "couleur" },
      { cle: "persoNote", nom: "Notes et traînes", type: "couleur" },
    ]},
  ]},
  { onglet: "Effets", groupes: [
    { titre: "Lumière (carte graphique)", items: [
      { cle: "halo", nom: "Halo", type: "curseur", min: 0, max: 2, pas: 0.05 },
      { cle: "seuilHalo", nom: "Ce qui brille", type: "curseur", min: 0, max: 0.95, pas: 0.05 },
      { cle: "teinteGpu", nom: "Rotation des teintes", type: "curseur", min: 0, max: 2, pas: 0.05 },
      { cle: "bichromie", nom: "Bichromie (deux couleurs de la palette)", type: "curseur", min: 0, max: 1, pas: 0.05 },
      { cle: "negatif", nom: "Négatif sur les temps forts", type: "curseur", min: 0, max: 1, pas: 0.05 },
      { cle: "pompe", nom: "L'image bat sur les temps forts", type: "curseur", min: 0, max: 1, pas: 0.05 },
      { cle: "strobe", nom: "Stroboscope (attention, ça clignote)", type: "curseur", min: 0, max: 1, pas: 0.05 },
      { cle: "strobeFreq", nom: "Coups par seconde (sans musique)", type: "curseur", min: 1, max: 15, pas: 0.5 },
    ]},
    { titre: "Déformations", items: [
      { cle: "miroir", nom: "Miroir", type: "choix", options: [["aucun", "Aucun"], ["gd", "Gauche et droite"], ["hb", "Haut et bas"], ["quatre", "Les quatre coins"]] },
      { cle: "kaleido", nom: "Kaléidoscope (miroirs)", type: "curseur", min: 0, max: 16, pas: 1 },
      { cle: "kaleidoTourne", nom: "Il tourne", type: "curseur", min: -1, max: 1, pas: 0.01 },
      { cle: "kaleidoSpirale", nom: "Il s'enroule en spirale", type: "curseur", min: 0, max: 4, pas: 0.1 },
      { cle: "kaleidoStable", nom: "Kaléidoscope stable (ne saute pas sur les temps)", type: "case" },
      { cle: "ondes", nom: "Ondes", type: "curseur", min: 0, max: 2, pas: 0.05 },
      { cle: "choc", nom: "Onde de choc sur les temps forts", type: "curseur", min: 0, max: 2, pas: 0.05 },
      { cle: "mosaique", nom: "Mosaïque", type: "curseur", min: 0, max: 1, pas: 0.01 },
      { cle: "rvb", nom: "Décalage rouge vert bleu", type: "curseur", min: 0, max: 3, pas: 0.05 },
      { cle: "blocs", nom: "Glitch en blocs (touche Z)", type: "curseur", min: 0, max: 1, pas: 0.05 },
      { cle: "fonte", nom: "L'image fond et coule", type: "curseur", min: 0, max: 1, pas: 0.05 },
    ]},
    { titre: "Couleurs de l'image (carte graphique)", items: [
      { cle: "degrade", nom: "Dégradé de couleurs (Tab)", type: "choix", options: DEGRADES_NOMS },
      { cle: "degradeForce", nom: "Force du dégradé", type: "curseur", min: 0, max: 1, pas: 0.05 },
      { cle: "saturation", nom: "Saturation", type: "curseur", min: 0, max: 2.5, pas: 0.05 },
      { cle: "contraste", nom: "Contraste", type: "curseur", min: 0.4, max: 2.5, pas: 0.05 },
      { cle: "exposition", nom: "Lumière", type: "curseur", min: 0.3, max: 2.5, pas: 0.05 },
      { cle: "decalage", nom: "Décaler les teintes", type: "curseur", min: 0, max: 359, pas: 1 },
      { cle: "chroma", nom: "Arc-en-ciel en cercles", type: "curseur", min: 0, max: 1, pas: 0.05 },
      { cle: "solarisation", nom: "Solarisation (touche Q)", type: "curseur", min: 0, max: 1, pas: 0.05 },
      { cle: "posterisation", nom: "Affiche (nombre de tons, 0 : éteint)", type: "curseur", min: 0, max: 12, pas: 1 },
    ]},
    { titre: "Larsen (l'image se filme elle-même)", items: [
      { cle: "larsen", nom: "Larsen", type: "curseur", min: 0, max: 0.97, pas: 0.01 },
      { cle: "larsenZoom", nom: "Zoom", type: "curseur", min: 0.9, max: 1.1, pas: 0.005 },
      { cle: "larsenRotation", nom: "Rotation", type: "curseur", min: -0.1, max: 0.1, pas: 0.005 },
      { cle: "larsenTeinte", nom: "Les échos changent de couleur", type: "curseur", min: 0, max: 1, pas: 0.05 },
    ]},
    { titre: "Vieux écrans", items: [
      { cle: "vieilleTele", nom: "Les effets vieille télé (sans la case, rien ne les allume)", type: "case" },
      { cle: "vhs", nom: "Cassette VHS", type: "curseur", min: 0, max: 1, pas: 0.01 },
      { cle: "courbure", nom: "Écran bombé", type: "curseur", min: 0, max: 1, pas: 0.01 },
      { cle: "balayage", nom: "Lignes de balayage", type: "curseur", min: 0, max: 1, pas: 0.01 },
      { cle: "grain", nom: "Grain", type: "curseur", min: 0, max: 1, pas: 0.01 },
      { cle: "vignetteGpu", nom: "Coins assombris", type: "curseur", min: 0, max: 1, pas: 0.01 },
    ]},
  ]},
  { onglet: "Musique", special: "musique", groupes: [
    { titre: "Ce que les mots écoutent", items: [
      { cle: "musiqueSource", nom: "Écouter", type: "choix", options: [["micro", "Le micro ou une entrée son"], ["pc", "Le son du PC (partage d'écran)"]] },
      { cle: "musiqueSensibilite", nom: "Sensibilité", type: "curseur", min: 0.2, max: 3, pas: 0.05 },
      { cle: "musiqueReaction", nom: "Réaction (vite : nerveux, lent : coulé)", type: "curseur", min: 0.2, max: 3, pas: 0.05 },
    ]},
    { titre: "Les coups sur les mots (side chain)", items: [
      { cle: "kickSens", nom: "Sur un coup, les mots", type: "choix", options: [["gonfle", "Gonflent puis retombent"], ["ecrase", "S'écrasent puis reviennent (side chain)"]] },
      { cle: "kickMots", nom: "Kick (basses) : force sur les mots", type: "curseur", min: 0, max: 3, pas: 0.05 },
      { cle: "kickSeuil", nom: "Kick : se déclenche facilement", type: "curseur", min: 0, max: 1, pas: 0.05 },
      { cle: "kickRelache", nom: "Kick : relâchement (secondes)", type: "curseur", min: 0.03, max: 1.5, pas: 0.01 },
      { cle: "caisseMots", nom: "Caisse claire (médiums) : force sur les mots", type: "curseur", min: 0, max: 3, pas: 0.05 },
      { cle: "caisseSeuil", nom: "Caisse claire : se déclenche facilement", type: "curseur", min: 0, max: 1, pas: 0.05 },
      { cle: "caisseRelache", nom: "Caisse claire : relâchement (secondes)", type: "curseur", min: 0.03, max: 1.5, pas: 0.01 },
      { cle: "charleyMots", nom: "Charley (aigus) : force sur les mots", type: "curseur", min: 0, max: 3, pas: 0.05 },
      { cle: "charleySeuil", nom: "Charley : se déclenche facilement", type: "curseur", min: 0, max: 1, pas: 0.05 },
      { cle: "charleyRelache", nom: "Charley : relâchement (secondes)", type: "curseur", min: 0.03, max: 1.5, pas: 0.01 },
      { cle: "musiquePulse", nom: "Les basses font battre les mots (le pilote ne descend plus en dessous)", type: "curseur", min: 0, max: 4, pas: 0.05 },
    ]},
    { titre: "Ce que la musique fait", items: [
      { cle: "musiqueElan", nom: "La musique accélère tout", type: "curseur", min: 0, max: 2, pas: 0.05 },
      { cle: "musiqueFlash", nom: "Flash sur les temps forts", type: "curseur", min: 0, max: 1.5, pas: 0.05 },
      { cle: "musiqueEffets", nom: "Elle pousse les effets", type: "curseur", min: 0, max: 3, pas: 0.05 },
      { cle: "musiqueDrop", nom: "Un drop change de poème et de scène", type: "case" },
    ]},
  ]},
  // chaque effet : ce qu'il ecoute, et sa force (negative : il plonge sur le son)
  { onglet: "Le son mène", groupes: MOD_GROUPES.map(([titre, a, b]) => ({ titre, items: MODS.slice(a, b).flatMap(([c, nom]) => [
    { cle: "mod" + c + "Src", nom: nom + " écoute", type: "choix", options: MOD_SOURCES },
    { cle: "mod" + c, nom: nom + " : force", type: "curseur", min: -1, max: 2, pas: 0.05 },
  ]) })) },
  { onglet: "Manette", special: "manette", groupes: [
    { titre: "Jouer", items: [
      { cle: "manetteMode", nom: "Page de la manette (pavé tactile pour changer)", type: "choix", options: [["jouer", "1. Live : les mots et l'image"], ["video", "2. FX vidéo"], ["poeme", "3. FX poème"],
        ["fxson", "4. FX son"], ["son", "5. Son (le moteur)"], ["musique", "6. Musique (ce que l'image écoute)"], ["pilote", "7. Pilote (le mode automatique)"]] },
      { cle: "mainCurseur", nom: "Montrer la main (un petit cercle)", type: "case" },
      { cle: "mainVie", nom: "Les mots écrits restent (secondes)", type: "curseur", min: 3, max: 60, pas: 1 },
      { cle: "mainTaille", nom: "Taille des mots écrits", type: "curseur", min: 0.4, max: 3, pas: 0.05 },
      { cle: "mainSensibilite", nom: "La main va vite", type: "curseur", min: 0.2, max: 3, pas: 0.05 },
      { cle: "mainNotes", nom: "Chaque mot écrit chante (hauteur : où il est posé)", type: "case" },
      { cle: "mainVent", nom: "Vent sur les mots écrits (gauche ↔ droite)", type: "curseur", min: -1, max: 1, pas: 0.01 },
      { cle: "mainEnvol", nom: "Les mots écrits s'envolent (négatif : ils tombent)", type: "curseur", min: -1, max: 1, pas: 0.01 },
    ]},
    { titre: "Live", items: [
      { cle: "annoncesEcran", nom: "Écrire sur l'image ce qu'on change (pour répéter ; décoché : l'image reste nue)", type: "case" },
      { cle: "vibration", nom: "La manette vibre sur les temps forts", type: "case" },
    ]},
  ]},
  { onglet: "Poèmes", groupes: [
    { titre: "Ce que l'écran lit", items: [
      { cle: "source", nom: "Source", type: "choix", options: [["tout", "Le recueil et le poème infini"], ["recueil", "Le recueil (poèmes en formes)"], ["flux", "Le poème infini (avant les formes)"], ["essai", "Les essais à blanc"]] },
      { cle: "ordre", nom: "Ordre", type: "choix", options: [["recent", "Du plus récent au plus ancien"], ["hasard", "Au hasard"]] },
      { cle: "nouveauxDabord", nom: "Un poème qui vient de naître passe en premier", type: "case" },
    ]},
    { titre: "Ce que l'écran montre", items: [
      { cle: "annotations", nom: "Rimes, syllabes et poètes dans la marge", type: "case" },
      { cle: "filsRimes", nom: "Fils entre les vers qui riment", type: "case" },
      { cle: "chutes", nom: "Les versions battues en fantôme derrière les vers", type: "case" },
      { cle: "votes", nom: "Un clic sur un vers donne un coup de cœur à son poète", type: "case" },
      { cle: "cartel", nom: "Cartel du poème (titre, forme, date)", type: "case" },
      { cle: "direct", nom: "Fenêtre du direct (le poète qui écrit)", type: "case" },
      { cle: "bourse", nom: "Bandeau de la Bourse des mots", type: "case" },
      { cle: "qualite", nom: "Finesse de l'image", type: "curseur", min: 0.5, max: 2, pas: 0.25 },
    ]},
  ]},
  { onglet: "Son", special: "son", groupes: [
    { titre: "Son", items: [
      { cle: "son", nom: "Le poème se joue (touche S)", type: "case" },
      { cle: "volume", nom: "Volume", type: "curseur", min: 0, max: 1, pas: 0.05 },
      { cle: "sonSuit", nom: "Il joue", type: "choix", options: [["lui", "À son pas, quoi que fassent les images"],
        ["musique", "Sur le tempo de la musique (sinon à son pas)"], ["taire", "À son pas, et se tait quand la musique joue"],
        ["mots", "Les mots qui paraissent (seulement certaines scènes)"]] },
      { cle: "sonRimes", nom: "Les rimes tintent comme des cloches", type: "case" },
    ]},
    { titre: "Évolution", items: [
      { cle: "sonEvolution", nom: "Le son évolue (0 : il reste ce que disent les curseurs)", type: "curseur", min: 0, max: 1, pas: 0.05 },
      { cle: "sonCycle", nom: "Un mouvement dure (minutes)", type: "curseur", min: 0.5, max: 30, pas: 0.5 },
      { cle: "sonArc", nom: "Chaque poème s'ouvre au milieu et se referme à la fin", type: "case" },
    ]},
    { titre: "Gamme", items: [
      { cle: "sonGamme", nom: "Gamme", type: "choix", options: [["hasard", "Une autre à chaque poème (toutes)"],
        ["parente", "Une voisine à chaque poème (ça glisse)"]].concat(GAMMES.map(([c, n]) => [c, n])) },
      { cle: "sonTonique", nom: "Tonique", type: "choix", options: [["hasard", "Une autre à chaque poème"],
        ["quintes", "De quinte en quinte"]].concat(NOTES_NOMS.map((n, i) => [String(i), n])) },
      { cle: "sonChange", nom: "Elles changent", type: "choix", options: [["1", "à chaque poème"], ["2", "tous les 2 poèmes"],
        ["4", "tous les 4 poèmes"], ["8", "tous les 8 poèmes"], ["jamais", "jamais (bouton ci-dessus)"]] },
      { cle: "sonOctave", nom: "Octave (grave ↔ aigu)", type: "curseur", min: -2, max: 2, pas: 1 },
    ]},
    { titre: "Rythme", items: [
      { cle: "sonTempo", nom: "Tempo (battements par minute)", type: "curseur", min: 6, max: 120, pas: 1 },
      { cle: "sonDivision", nom: "Sur la musique, une note tous les", type: "choix", options: [["1", "temps"], ["2", "deux temps"], ["4", "mesure"], ["8", "deux mesures"]] },
      { cle: "sonRythme", nom: "Rythme", type: "choix", options: [["regulier", "Régulier (un mot par battement)"], ["syllabes", "Les syllabes (un mot long dure)"], ["flottant", "Flottant (à la Feldman)"]] },
      { cle: "sonDensite", nom: "Densité (les mots qui sonnent)", type: "curseur", min: 0.05, max: 1, pas: 0.05 },
      { cle: "sonSouffle", nom: "Silence entre deux vers (battements)", type: "curseur", min: 0, max: 8, pas: 0.5 },
      { cle: "sonTenue", nom: "Durée des notes", type: "curseur", min: 0.2, max: 4, pas: 0.1 },
      { cle: "sonAttaque", nom: "Attaque (pincée ↔ qui monte)", type: "curseur", min: 0, max: 1, pas: 0.05 },
      { cle: "sonAccords", nom: "Deux notes à la fois", type: "curseur", min: 0, max: 1, pas: 0.05 },
    ]},
    { titre: "Timbres", items: [
      { cle: "sonTimbre", nom: "Timbre", type: "choix", options: [["derive", "Qui changent avec les mouvements"], ["poetes", "Un par poète, toujours le même"],
        ["hasard", "Tirés au sort à chaque poème"]].concat(TIMBRES_NOMS) },
      { cle: "sonMetal", nom: "Métal (sons faux, inharmoniques)", type: "curseur", min: 0, max: 1, pas: 0.05 },
      { cle: "sonBruit", nom: "Bruit dans chaque note", type: "curseur", min: 0, max: 1, pas: 0.05 },
      { cle: "sonBourdon", nom: "Bourdon (la tonique tenue)", type: "curseur", min: 0, max: 1, pas: 0.05 },
      { cle: "sonPoussiere", nom: "Poussière (craquements)", type: "curseur", min: 0, max: 1, pas: 0.05 },
    ]},
    { titre: "Modulations (chaque note)", items: [
      { cle: "sonVibrato", nom: "Vibrato", type: "curseur", min: 0, max: 1, pas: 0.05 },
      { cle: "sonVibratoVitesse", nom: "Vitesse du vibrato (par seconde)", type: "curseur", min: 0.1, max: 12, pas: 0.1 },
      { cle: "sonTremolo", nom: "Trémolo (le volume tremble)", type: "curseur", min: 0, max: 1, pas: 0.05 },
      { cle: "sonTremoloVitesse", nom: "Vitesse du trémolo (par seconde)", type: "curseur", min: 0.1, max: 20, pas: 0.1 },
      { cle: "sonBalayage", nom: "Filtre (se ferme ↔ s'ouvre sur la note)", type: "curseur", min: -1, max: 1, pas: 0.05 },
      { cle: "sonResonance", nom: "Résonance du filtre", type: "curseur", min: 0, max: 1, pas: 0.05 },
      { cle: "sonGlisse", nom: "Glissando (d'une note à l'autre)", type: "curseur", min: 0, max: 1, pas: 0.05 },
      { cle: "sonUsure", nom: "Bande usée (la hauteur pleure)", type: "curseur", min: 0, max: 1, pas: 0.05 },
      { cle: "sonHasard", nom: "Hasard (la hauteur saute en marches)", type: "curseur", min: 0, max: 1, pas: 0.05 },
      { cle: "sonBegaiement", nom: "Bégaiement (la note repart)", type: "curseur", min: 0, max: 1, pas: 0.05 },
      { cle: "sonMouvement", nom: "Les notes voyagent de gauche à droite", type: "curseur", min: 0, max: 1, pas: 0.05 },
    ]},
    { titre: "Espace et matière", items: [
      { cle: "sonReverb", nom: "Réverbération", type: "curseur", min: 0, max: 1, pas: 0.05 },
      { cle: "sonEcho", nom: "Écho", type: "curseur", min: 0, max: 0.9, pas: 0.05 },
      { cle: "sonEchoTemps", nom: "L'écho revient après", type: "choix", options: [["0.33", "un tiers de battement"], ["0.5", "un demi-battement"],
        ["0.75", "trois quarts de battement"], ["1", "un battement"], ["1.5", "un battement et demi"]] },
      { cle: "sonFiltre", nom: "Clarté (sourd ↔ brillant)", type: "curseur", min: 200, max: 12000, pas: 50 },
      { cle: "sonSature", nom: "Saturation", type: "curseur", min: 0, max: 1, pas: 0.05 },
      { cle: "sonEcrase", nom: "Écrasement (lo-fi)", type: "curseur", min: 0, max: 1, pas: 0.05 },
      { cle: "sonLargeur", nom: "Largeur (les poètes à gauche, à droite)", type: "curseur", min: 0, max: 1, pas: 0.05 },
    ]},
  ]},
  { onglet: "Générateur", special: "generateur" },
  { onglet: "À propos", special: "apropos" },
];

// Les LFO (2026-10-17, Jiiji : « regler la duree et l'amplitude d'un lfo, dans les parametres de la
// scene, global »). Six ondes lentes, chacune branchee sur un curseur de l'image (n'importe lequel,
// sauf le son et ce qui oblige a reconstruire la scene) : elle le fait monter et descendre autour
// de sa valeur, d'une amplitude donnee (1 : la moitie de la course du curseur de chaque cote),
// en un temps donne. Le reglage garde sa valeur : c'est elle qu'on enregistre, et le curseur la
// deplace pendant que l'onde continue.
const LFO_EXCLUS = new Set(["qualite", "maelstrom", "volume", "poemeMax", "tenue", "fonduDuree", "billets", "rouleaux"]);
const RECONSTRUIRE_LFO = new Set(["taille", "ecriture", "voies", "espacement"]);  // comme RECONSTRUIRE, plus bas
const LFO_MARCHES = new Set(["lueur", "aberration", "ombre", "graisse"]);
// ces reglages entrent dans la cle des vignettes de mots : ils avancent par marches de 1/40 de leur
// course, sinon chaque image redessinerait tous les mots (LFO, manette et pilote passent par ici)
// les effets vieille tele (case vieilleTele, 2026-10-19)
const VIEILLE_TELE = new Set(["vhs", "courbure", "balayage", "grain", "vignetteGpu", "crt"]);
function enMarches(cle, x) {
  const it = LFO_MARCHES.has(cle) && (LFO_CIBLES[cle] || REGLAGE[cle]);
  if (!it) return x;
  const p = (it.max - it.min) / 40;
  return +(it.min + Math.round((x - it.min) / p) * p).toFixed(4);
}
const LFO_CIBLES = {};
for (const o of SCHEMA) for (const g of o.groupes || []) for (const it of g.items || []) {
  if (it.type !== "curseur" || RECONSTRUIRE_LFO.has(it.cle) || LFO_EXCLUS.has(it.cle) || /^(son|main|pilote|lfo)/.test(it.cle)) continue;
  LFO_CIBLES[it.cle] = { min: it.min, max: it.max, pas: it.pas, nom: it.nom + " (" + o.onglet + ")" };
}
const LFO_FORMES = [["sinus", "Sinus (doux)"], ["triangle", "Triangle"], ["monte", "Dent de scie qui monte"], ["descend", "Dent de scie qui descend"],
  ["carre", "Carré (deux valeurs)"], ["doux", "Hasard doux"], ["marches", "Hasard en marches"]];
{
  const groupes = [];
  for (let i = 1; i <= LFO_NB; i++) groupes.push({ titre: "LFO " + i, items: [
    { cle: "lfo" + i + "Cible", nom: "Il fait bouger", type: "choix", options: [["aucune", "(rien)"]].concat(Object.entries(LFO_CIBLES).map(([c, x]) => [c, x.nom])) },
    { cle: "lfo" + i + "Forme", nom: "Forme", type: "choix", options: LFO_FORMES },
    { cle: "lfo" + i + "Duree", nom: "Durée d'un aller-retour (secondes)", type: "curseur", min: 0.5, max: 300, pas: 0.5 },
    { cle: "lfo" + i + "Amplitude", nom: "Amplitude", type: "curseur", min: 0, max: 1, pas: 0.01 },
  ]});
  SCHEMA.splice(SCHEMA.findIndex(o => o.onglet === "Générateur"), 0, { onglet: "LFO", groupes });
}
const lfo = {
  bases: {}, ecrit: {},
  // l'onde d'un LFO, de -1 a 1, en vraies secondes (la vitesse generale n'y change rien)
  onde(i, t) {
    const ph = t / Math.max(0.2, S["lfo" + i + "Duree"]), f = ph - Math.floor(ph), forme = S["lfo" + i + "Forme"];
    switch (forme) {
      case "triangle": return 1 - 4 * Math.abs(f - 0.5);
      case "monte": return f * 2 - 1;
      case "descend": return 1 - f * 2;
      case "carre": return f < 0.5 ? 1 : -1;
      case "doux": case "marches": {
        const k = Math.floor(ph), a = this.hasardDe(i, k);
        if (forme === "marches") return a;
        return lerp(a, this.hasardDe(i, k + 1), f * f * (3 - 2 * f));
      }
      default: return Math.sin(ph * Math.PI * 2);
    }
  },
  hasardDe(i, k) { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return (x - Math.floor(x)) * 2 - 1; },
  maj() {
    const t = performance.now() / 1000, ecarts = new Map();
    for (let i = 1; i <= LFO_NB; i++) {
      const c = S["lfo" + i + "Cible"], info = LFO_CIBLES[c], a = S["lfo" + i + "Amplitude"];
      if (!info || !(a > 0)) continue;
      ecarts.set(c, (ecarts.get(c) || 0) + this.onde(i, t) * a * (info.max - info.min) / 2);
    }
    // un reglage que plus aucun LFO ne fait bouger retrouve sa valeur
    for (const c in this.bases) if (!ecarts.has(c)) {
      if (S[c] === this.ecrit[c]) S[c] = this.bases[c];
      delete this.bases[c]; delete this.ecrit[c];
    }
    for (const [c, e] of ecarts) {
      const info = LFO_CIBLES[c];
      // quelqu'un d'autre l'a change (un curseur, la manette, une ambiance) : la base bouge d'autant.
      // Par la difference, pas par la valeur : la manette relit S (l'ecart du LFO compris) et le
      // reecrit a chaque image ; reprendre la valeur entiere avalait l'ecart a chaque image et
      // collait le reglage en butee (audit du 2026-10-18)
      if (!(c in this.bases)) this.bases[c] = S[c];
      else if (S[c] !== this.ecrit[c]) this.bases[c] = clamp(this.bases[c] + (S[c] - this.ecrit[c]), info.min, info.max);
      let x = clamp(this.bases[c] + e, info.min, info.max);
      if (info.pas >= 1) x = Math.round(x);
      // ceux-la entrent dans la cle des vignettes de mots : par marches de 1/40, sinon chaque
      // image redessinerait tous les mots
      else x = enMarches(c, x);
      S[c] = x; this.ecrit[c] = x;
    }
  },
  // ce qu'on enregistre : les reglages, pas leur valeur du moment
  aSauver() {
    const r = Object.assign({}, S, this.bases);
    for (const k in DEPUIS_ADRESSE) if (r[k] === DEPUIS_ADRESSE[k]) { if (k in STOCKE) r[k] = STOCKE[k]; else delete r[k]; }
    return r;
  },
};

const AMBIANCES = {
  "Nuit étoilée": { scene: "constellation", palette: "nuit", police: "Garamond", fond: "degrade", trainees: 0.2, tremblement: 0.3, glitch: 0, lueur: 0.2, aberration: 0, halo: 0.4, seuilHalo: 0.4, vignetteGpu: 0.35 },
  "Murmuration": { scene: "nuee", palette: "crepuscule", police: "Georgia", fond: "degrade", trainees: 0.35, tremblement: 0.2, glitch: 0, lueur: 0, aberration: 0 },
  "Écriture automatique": { scene: "ruban", palette: "papier", police: "Garamond", fond: "degrade", trainees: 0, tremblement: 0.15, glitch: 0, lueur: 0, aberration: 0, halo: 0 },
  "Un coup de dés": { scene: "coupdedes", palette: "papier", police: "Garamond", fond: "degrade", trainees: 0, tremblement: 0.1, glitch: 0, lueur: 0, aberration: 0, halo: 0, kaleido: 0, larsen: 0 },
  "Voie lactée": { scene: "etoiles", palette: "nuit", police: "Garamond", etoiles: 520, vitesseEtoiles: 0.7, trainees: 0.4, lueur: 0.3, glitch: 0, halo: 0.5, seuilHalo: 0.35 },
  "Veille 98": { scene: "mystifier", palette: "mystify", trainees: 0.12, fond: "uni", glitch: 0, tremblement: 0.2, crt: false },
  "Maelström": { scene: "tourbillon", palette: "nuit", trainees: 0.55, maelstrom: 520, spin: 1.4, inclinaison: 0.5, lueur: 0.45, fond: "degrade" },
  "Lecture calme": { scene: "lecture", palette: "papier", entree: "fondu", sortie: "fondu", tremblement: 0.25, glitch: 0, trainees: 0, lueur: 0, aberration: 0, annotations: true, crt: false },
  "Cathodique": { scene: "auto", palette: "phosphore", crt: true, glitch: 0.35, aberration: 0.6, police: "Consolas", trainees: 0.45 },
  "Banque Fantôme": { scene: "tourbillon", palette: "billet", tremblement: 1.8, tremblementValeur: true, bourse: true, police: "Garamond", maelstrom: 320 },
  "Fièvre": { scene: "auto", palette: "arc", tremblement: 4, glitch: 0.6, aberration: 1.2, respiration: 1.5, ondulation: 1.5, trainees: 0.75 },
  "Bureau 95": { scene: "defilement", palette: "bureau95", police: "Tahoma", trainees: 0, crt: false, vague: 1.2, fond: "uni" },
  "Fonte": { scene: "lecture", entree: "machine", sortie: "fonte", palette: "ambre", trainees: 0.25, crt: true },
  "Corbeille": { scene: "corbeille", palette: "phosphore", crt: true, police: "Consolas", trainees: 0, glitch: 0.05 },
  "Palimpseste": { scene: "lecture", palette: "papier", entree: "fondu", sortie: "dissolution", chutes: true, filsRimes: true, tremblement: 0.3, glitch: 0, lueur: 0 },
  "Calligramme 98": { scene: "calligramme", palette: "bureau95", police: "Times New Roman", trainees: 0, fond: "uni", tremblement: 0.3, glitch: 0, lueur: 0, halo: 0, kaleido: 0, larsen: 0, vhs: 0 },
  "Calligramme de nuit": { scene: "calligramme", palette: "nuit", police: "Garamond", trainees: 0.35, fond: "etoiles", tremblement: 0.5, lueur: 0.2, halo: 0.45, seuilHalo: 0.4, vignetteGpu: 0.4 },
  "Salle des marchés": { scene: "marches", palette: "phosphore", police: "Consolas", trainees: 0, crt: false, halo: 0.5, seuilHalo: 0.5, balayage: 0.35, courbure: 0.25, vignetteGpu: 0.5 },
  "Planche à billets": { scene: "billets", palette: "billet", trainees: 0, halo: 0.25, grain: 0.25, vignetteGpu: 0.4 },
  "Casino": { scene: "machine", palette: "nuit", trainees: 0, halo: 0.7, seuilHalo: 0.4, rvb: 0.3, vignetteGpu: 0.5 },
  "Cassette 89": { scene: "auto", palette: "nuit", vhs: 0.7, courbure: 0.35, balayage: 0.4, grain: 0.35, rvb: 0.6, halo: 0.4, kaleido: 0, larsen: 0, crt: false },
  "Kaléidoscope": { scene: "tourbillon", palette: "arc", kaleido: 6, kaleidoTourne: 0.2, halo: 0.8, seuilHalo: 0.35, larsen: 0, trainees: 0.3, vhs: 0 },
  "Larsen": { scene: "etoiles", palette: "mystify", larsen: 0.88, larsenZoom: 1.03, larsenRotation: 0.01, halo: 0.5, kaleido: 0, trainees: 0 },
  "Rave": { scene: "auto", palette: "arc", halo: 1, seuilHalo: 0.35, rvb: 0.8, kaleido: 4, kaleidoTourne: 0.35, larsen: 0.6, larsenZoom: 1.02, ondes: 0.3, musiquePulse: 1.6, musiqueFlash: 0.9, musiqueEffets: 1.6, trainees: 0.2 },
  "Le puits": { scene: "puits", palette: "nuit", police: "Garamond", trainees: 0.3, tremblement: 0, glitch: 0, lueur: 0, halo: 0.55, seuilHalo: 0.35, vignetteGpu: 0.4 },
  "Pulsar": { scene: "cretes", palette: "nuit", police: "Consolas", trainees: 0, fond: "aucun", tremblement: 0, glitch: 0, lueur: 0, halo: 0.3, seuilHalo: 0.5 },
  "Averse": { scene: "averse", palette: "phosphore", police: "Consolas", trainees: 0, fond: "aucun", tremblement: 0.2, glitch: 0, lueur: 0, halo: 0.6, seuilHalo: 0.3, balayage: 0.25 },
  "Rosace": { scene: "rosace", palette: "crepuscule", police: "Garamond", trainees: 0.15, tremblement: 0.2, glitch: 0, lueur: 0, halo: 0.45, seuilHalo: 0.4 },
  "Un mot par temps": { scene: "battement", palette: "nuit", police: "Impact", trainees: 0, tremblement: 0, glitch: 0, lueur: 0, pompe: 0.6, choc: 0.8 },
  "Oscilloscope": { scene: "onde", palette: "phosphore", police: "Consolas", trainees: 0.55, fond: "aucun", tremblement: 0, glitch: 0, halo: 0.7, seuilHalo: 0.3, courbure: 0.3, balayage: 0.35, vignetteGpu: 0.5 },
  "Néon": { scene: "puits", palette: "neon", police: "Impact", fond: "degrade", trainees: 0.3, halo: 0.8, seuilHalo: 0.3, graisse: 0 },
  "Aurore": { scene: "constellation", palette: "glace", police: "Garamond", fond: "aurore", trainees: 0.2, halo: 0.4, seuilHalo: 0.4 },
  "Caméra thermique": { scene: "cretes", palette: "nuit", fond: "aucun", degrade: "thermique", degradeForce: 1, halo: 0.3, seuilHalo: 0.5 },
  "Solarisation": { scene: "rosace", palette: "or", fond: "rayons", solarisation: 0.85, halo: 0.4, seuilHalo: 0.4 },
  "Datamosh": { scene: "battement", palette: "neon", police: "Impact", blocs: 0.6, rvb: 0.8, choc: 0.6, pompe: 0.4 },
  "Sérigraphie": { scene: "coupdedes", palette: "papier", fond: "cahier", posterisation: 4, degrade: "palette", degradeForce: 0.6, contraste: 1.3, grain: 0.3 },
  "Bleu Klein": { scene: "nuee", palette: "klein", fond: "uni", trainees: 0.15, modeCouleur: "palette" },
  "Synthé 84": { scene: "onde", palette: "vapeur", police: "Impact", fond: "sol", trainees: 0.2, halo: 0.6, seuilHalo: 0.35, balayage: 0.3 },
  "Bibliothèque": { scene: "lecture", palette: "encre", police: "Garamond", fond: "tapisserie", trainees: 0, tremblement: 0.2, glitch: 0, lueur: 0 },
  "Combo : Nuit et nuée": { scene: "constellation", calque: "nuee", calquePlace: "devant", calqueMelange: "lumiere", calqueOpacite: 0.8, calqueMouvement: "aucun", calquePoeme: "meme", palette: "nuit", trainees: 0.2, halo: 0.4, seuilHalo: 0.4 },
  "Combo : Le puits et l'onde": { scene: "puits", calque: "onde", calquePlace: "devant", calqueMelange: "lumiere", calqueOpacite: 0.9, calqueMouvement: "aucun", calquePoeme: "meme", palette: "nuit", trainees: 0.3, halo: 0.6, seuilHalo: 0.35 },
  "Combo : Pluie sur le pulsar": { scene: "cretes", calque: "averse", calquePlace: "derriere", calqueMelange: "ecran", calqueOpacite: 0.5, calqueMouvement: "aucun", calquePoeme: "autre", palette: "phosphore", police: "Consolas", trainees: 0, fond: "aucun" },
  "Combo : Rosace et encre": { scene: "rosace", calque: "ruban", calquePlace: "derriere", calqueMelange: "lumiere", calqueOpacite: 0.55, calqueMouvement: "tourne", calquePoeme: "autre", palette: "crepuscule", trainees: 0.2 },
  "Combo : Club": { scene: "battement", calque: "puits", calquePlace: "derriere", calqueMelange: "difference", calqueOpacite: 0.85, calqueMouvement: "bat", calquePoeme: "autre", palette: "arc", police: "Impact", pompe: 0.5, choc: 1, halo: 0.6, seuilHalo: 0.35 },
  "Combo : Étoiles en miroir": { scene: "etoiles", calque: "constellation", calquePlace: "devant", calqueMelange: "lumiere", calqueOpacite: 0.7, calqueMouvement: "miroir", calquePoeme: "autre", palette: "nuit", trainees: 0.35, halo: 0.5, seuilHalo: 0.35 },
  "Combo : Rave des vers": { scene: "auto", calque: "auto", calquePlace: "derriere", calqueMelange: "lumiere", calqueOpacite: 0.7, calqueMouvement: "bat", calquePoeme: "autre", palette: "arc", halo: 0.9, seuilHalo: 0.35, rvb: 0.5, kaleido: 0, choc: 1, pompe: 0.5, musiquePulse: 1.6, musiqueFlash: 0.8, musiqueEffets: 1.5, trainees: 0.25 },
  "Sobre (sans effet)": { halo: 0, rvb: 0, ondes: 0, mosaique: 0, kaleido: 0, larsen: 0, vhs: 0, courbure: 0, balayage: 0, grain: 0, vignetteGpu: 0, teinteGpu: 0,
    miroir: "aucun", kaleidoSpirale: 0, choc: 0, negatif: 0, bichromie: 0, pompe: 0, larsenTeinte: 0,
    degrade: "aucun", saturation: 1, contraste: 1, exposition: 1, decalage: 0, chroma: 0, solarisation: 0, posterisation: 0, blocs: 0, fonte: 0, strobe: 0 },
};
// une ambiance qui choisit sa scene sans parler de calque eteint le combo
function ambiance(nom) {
  const A = AMBIANCES[nom];
  if (!("scene" in A)) return A;
  return Object.assign({ calque: "aucun", modeCouleur: "poetes", fondPulse: 0 }, AMBIANCES["Sobre (sans effet)"], A);
}


/* ================================================================ ce que les autres fichiers ajoutent */

// Depuis le decoupage en fichiers (2026-10-18), chaque fichier ajoute ses scenes et ses reglages
// lui-meme, sans toucher a celui-ci. Tout est rassemble par finaliserAjouts(), au depart, avant que
// le panneau ne se construise.
const SCENES_AJOUTEES = [];
const SCENES_FABRIQUES = {};
// def : { cle, nom, fabrique: p => new MaScene(p), calme, plein (pour le pilote), continue (le monde
// continue d'un poeme a l'autre), auto: false (hors de « Toutes »), calque: false (jamais en combo) }
function ajouterScene(def) {
  SCENES_AJOUTEES.push(def);
  SCENES_FABRIQUES[def.cle] = def.fabrique;
}
const REGLAGES_AJOUTES = [];
// onglet : un onglet du panneau (existant ou nouveau) ; groupe : un titre de groupe ; items : comme
// dans SCHEMA ; defauts : { cle: valeur } (le reglage garde dans le navigateur passe avant)
function ajouterReglages(onglet, groupe, items, defauts) {
  for (const k in defauts || {}) {
    DEFAUTS[k] = defauts[k];
    if (!(k in S)) S[k] = defauts[k];
    if (PARAMS.has(k)) lireAdresse(k, defauts[k]);
  }
  let o = SCHEMA.find(x => x.onglet === onglet);
  if (!o) {
    o = { onglet, groupes: [] };
    const i = SCHEMA.findIndex(x => x.special === "apropos");
    if (i < 0) SCHEMA.push(o); else SCHEMA.splice(i, 0, o);
  }
  let g = (o.groupes = o.groupes || []).find(x => x.titre === groupe);
  if (!g) { g = { titre: groupe, items: [] }; o.groupes.push(g); }
  g.items.push(...items);
  REGLAGES_AJOUTES.push(...items.map(it => [o.onglet, it]));
}

/* ================================================================ le bus : tout est lie */

// Jiiji (2026-10-18) : « les mots font les sons, les sons font des mots, tout est lie ». Le bus porte
// les evenements d'un fichier a l'autre sans qu'ils se connaissent : une scene annonce qu'un mot
// parait, le son annonce qu'une note part, les cables (cv.js) relient les deux. Evenements :
//   "mot"   { texte, x, y, poete, cours, ordre }   un mot devient visible (une fois par mot)
//   "vers"  { texte, poete, index }               un vers commence
//   "poeme" { poeme }                             un poeme commence
//   "note"  { f, degre, vel, duree, timbre, pan, poete, mot }   une note part (heure audio : t)
//   "coup"  { bande, force }                      un coup de la musique (kick, caisse, charley)
// emettre() ne fait rien quand personne n'ecoute : une scene peut emettre sans compter.
const bus = {
  ecouteurs: {},
  ecouter(nom, f) { (this.ecouteurs[nom] = this.ecouteurs[nom] || []).push(f); return f; },
  oublier(nom, f) { const l = this.ecouteurs[nom]; if (l) { const i = l.indexOf(f); if (i >= 0) l.splice(i, 1); } },
  emettre(nom, d) {
    const l = this.ecouteurs[nom];
    if (!l) return;
    for (const f of l) { try { f(d); } catch (e) { console.warn("poiasie : bus " + nom, e); } }
  },
};

// La valeur reglee d'un curseur, et la facon de la changer, quand un LFO ou un cable (cv.js) le
// fait bouger : on lit et on ecrit sa base, pas la valeur du moment (presets, pilote ; 2026-10-19)
function baseDe(c) {
  if (typeof cv !== "undefined" && c in cv.bases) return cv.base(c);
  return c in lfo.bases ? lfo.bases[c] : S[c];
}
function sousModulation(c) { return c in lfo.bases || (typeof cv !== "undefined" && c in cv.bases); }
function poserBase(c, v) {
  if (typeof cv !== "undefined" && c in cv.bases) {
    if (c in lfo.bases) lfo.bases[c] = v + (cv.dernierEcart[c] || 0); else cv.bases[c] = v;
  } else if (c in lfo.bases) lfo.bases[c] = v;
  else S[c] = v;
}
