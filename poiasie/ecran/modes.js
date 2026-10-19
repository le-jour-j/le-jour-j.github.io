"use strict";
/* ================================================================ les modes (poesie, VJing, jeu), les presets, le hasard */

// Jiiji, 2026-10-18 : « le gros gros truc, ca va etre de creer un bon gros kit de presets. Il y aura
// trois modes : le mode poesie, ou je suis au micro, je lis et ca modifie l'image ; le mode VJing,
// ou je vais suivre la musique quand je fais le DJ ; et le mode jeu video, avec une manette. » Et :
// « dans tout ce qui est effet, il faut du random de tout ».
//
// LE MODE : S.mode, "poesie" | "vjing" | "jeu" | "auto" (les autres fichiers le lisent avec un
// repli : S.mode || "vjing"). modes.choisir(m) pose la configuration de base du mode (source du son,
// pilote, page de la manette, ce que la musique pilote) en glissant, sans toucher a la scene :
// le poeme continue. Chaque mode se souvient des reglages que Jiiji y avait laisses.
//
// LES PRESETS, objet global PRESETS (un autre fichier, le pilote par exemple, peut les lire) :
//   PRESETS = [preset, ...]           tous ceux du kit, chacun avec son mode
//   PRESETS.poesie, .vjing, .jeu, .auto : ceux d'un mode (proprietes non enumerables)
//   preset  = { nom: "Nuit étoilée à voix haute", mode: "poesie", description: "…",
//               reglages: { cle: valeur, ... }, preferences: { scene: [...] }, complet: true }
//   - reglages : des cles de S (celles de DEFAUTS ; une cle inconnue est ignoree). reglages.scene
//     est toujours une scene qui existe. preferences.scene (et .calque) : une liste, la premiere qui
//     existe passe devant (une chaine exacte, ou une RegExp essayee sur « cle nom » de la scene).
//     Ainsi un preset nomme deja une scene qu'un autre agent ajoute ce soir (calligrammes 3D, scenes
//     3D) ; au depart, reglages.scene recoit la preferee qui existe (resoudrePresets).
//   - complet (vrai par defaut) : le preset part du SOCLE (effets de la carte eteints, LFO
//     debranches, « Le son mène » a zero, effets des mots calmes) : deux presets ne se melangent pas.
//   - un preset ne touche jamais a ce qui est a Jiiji ou au mode (volume, source, finesse, taille,
//     espacement, tenue, pilote, page de la manette... : PRESET_JAMAIS).
//   modes.poser(preset) le pose : les valeurs numeriques glissent en S.presetFondu secondes (3 par
//   defaut), les choix changent sous un fondu d'image, la scene et les lettres changent tout de suite
//   en fondu ou a la fin du poeme (S.presetScene).
//   presetsDe(mode) : le kit du mode puis ceux de Jiiji. ajouterPreset(mode, preset) : completer le
//   kit depuis un autre fichier. Ceux de Jiiji sont dans le navigateur, cle "poiasie-presets-v1".
//
// LE HASARD : modes.hasard(dose, cles) tire tous les reglages des familles non verrouillees (ou ceux
// de cles), dans des plages qui restent belles (HASARD_PLAGES), et les pose en glissant comme un
// preset. Jamais le stroboscope, le volume, la finesse, la source, le mode, ce qui recharge tout.
//
// LA VOIX (mode poesie) : voix.maj lit l'analyseur de la musique (musique.analyse, sans rien y
// changer) et en tire l'enveloppe, les attaques de syllabes, la hauteur (autocorrelation), le
// voise et les silences. La voix fait avancer le poeme (le temps de l'image), ecrit les mots du
// poeme a mesure qu'on parle, gonfle l'image la ou elle ecrit, teinte selon la hauteur, eclaire sur
// les syllabes ; le silence ralentit tout et laisse l'image respirer. Pas de reconnaissance de la
// parole (elle enverrait la voix a Google) : rien ne sort du poste.
//   Objet global voix (les cables de cv.js s'en servent comme sources), mis a jour chaque image :
//   voix.env (0 a 1, la force de la voix rapportee au bruit de la piece), voix.envLent, voix.attaque
//   (vrai pendant l'image d'une syllabe), voix.derniereAttaque (secondes), voix.debit (syllabes par
//   seconde), voix.hauteur et voix.hauteurLisse (Hz), voix.aigu() (0 grave 85 Hz, 1 aigu 480 Hz),
//   voix.voise, voix.confiance (0 a 1), voix.parle, voix.silence (secondes), voix.actif().
//   Et sur le bus : "syllabe" { force, hauteur, voise } a chaque syllabe.

/* ---------------------------------------------------- reglages de ce fichier */

const MODES_ITEMS = [
  { cle: "mode", nom: "Mode", type: "choix", options: [["poesie", "Poésie (au micro)"], ["vjing", "VJing (la musique du DJ)"], ["jeu", "Jeu vidéo (la manette)"], ["auto", "Full auto (on regarde)"]] },
  { cle: "presetFondu", nom: "Fondu d'un preset à l'autre (secondes)", type: "curseur", min: 0.5, max: 10, pas: 0.5 },
  { cle: "presetScene", nom: "La scène et les lettres changent", type: "choix", options: [["mode", "Selon le mode (poésie : à la fin du poème)"], ["fondu", "Tout de suite, en fondu"], ["fin", "À la fin du poème"]] },
  { cle: "presetVitesse", nom: "Les presets règlent aussi la vitesse générale", type: "case" },
  { cle: "hasardDose", nom: "Dosage du hasard (un peu ↔ beaucoup)", type: "curseur", min: 0.05, max: 1, pas: 0.05 },
  { cle: "voixEcrit", nom: "La voix écrit les mots du poème à mesure qu'on parle", type: "case" },
  { cle: "voixAvance", nom: "La voix fait avancer le poème", type: "curseur", min: 0, max: 2, pas: 0.05 },
  { cle: "voixSilence", nom: "Dans le silence, l'image ralentit jusqu'à", type: "curseur", min: 0.1, max: 1, pas: 0.05 },
  { cle: "voixGonfle", nom: "La voix gonfle l'image là où elle écrit", type: "curseur", min: 0, max: 2, pas: 0.05 },
  { cle: "voixTeinte", nom: "La hauteur de la voix teinte (grave : bleu, aigu : chaud)", type: "curseur", min: 0, max: 2, pas: 0.05 },
  { cle: "voixLumiere", nom: "La voix éclaire (halo, éclat sur les syllabes)", type: "curseur", min: 0, max: 2, pas: 0.05 },
  { cle: "voixSeuil", nom: "Sensibilité du micro (voix lointaine ↔ voix proche)", type: "curseur", min: 0, max: 1, pas: 0.05 },
];
const MODES_DEFAUTS = {
  mode: "vjing", presetFondu: 3, presetScene: "mode", presetVitesse: true, hasardDose: 0.5,
  hasardVerrous: "rythme,Musique / Ce que les mots écoutent,Musique / Les coups sur les mots (side chain),Musique / Ce que la musique fait",
  voixEcrit: true, voixAvance: 1, voixSilence: 0.35, voixGonfle: 0.8, voixTeinte: 0.6, voixLumiere: 0.6, voixSeuil: 0.5,
  presetCourant: "",
};
// enregistres comme les autres (le reglage garde dans le navigateur passe avant), sans entrer dans
// les cibles des LFO : ils reglent les modes, pas l'image
for (const k in MODES_DEFAUTS) { DEFAUTS[k] = MODES_DEFAUTS[k]; if (!(k in S)) S[k] = MODES_DEFAUTS[k]; }
for (const it of MODES_ITEMS) REGLAGE[it.cle] = it;
// le mode demande par l'adresse (l'ecran d'accueil) est pose au depart par modes.choisir (depart.js),
// pour que sa configuration de base s'applique
if (!["poesie", "vjing", "jeu", "auto"].includes(S.mode)) S.mode = "vjing";
// l'onglet du panneau, juste apres le premier
SCHEMA.splice(1, 0, { onglet: "Modes", special: "modes", groupes: [] });

/* ---------------------------------------------------- les trois modes */

// ce que chaque mode pose la premiere fois ; ensuite, ce que Jiiji y avait laisse (memoire par mode)
const MODES = {
  poesie: { nom: "Poésie", sous: "je lis au micro, la voix modifie l'image", page: "poeme",
    base: { musiqueSource: "micro", musique: true, pilote: false, sonSuit: "lui",
      musiqueElan: 0, musiqueEffets: 0.4, musiqueFlash: 0.15, musiquePulse: 1, musiqueDrop: false,
      kickMots: 0.2, caisseMots: 0.45, charleyMots: 0, musiqueSensibilite: 1.2, musiqueReaction: 0.8 } },
  vjing: { nom: "VJing", sous: "la musique du DJ mène, le pilote suit", page: "video",
    base: { musique: true, pilote: true, sonSuit: "taire", piloteEffets: true,
      musiqueElan: 0.4, musiqueEffets: 1, musiqueFlash: 0.5, musiquePulse: 1, musiqueDrop: false,
      kickMots: 0.6, caisseMots: 0, charleyMots: 0, musiqueSensibilite: 1, musiqueReaction: 1 } },
  // le jeu (2026-10-19, Jiiji : « en fait on va faire un jeu multijoueur ») : jusqu'a quatre manettes,
  // une main chacune, chacune un poete (live.js). Le pilote se tait, le son joue et chaque mot ecrit
  // chante ; les mains se voient (un cercle de la couleur du poete, sans texte)
  jeu: { nom: "Jeu vidéo", sous: "jusqu'à quatre manettes, une main et un poète chacune", page: "jouer",
    base: { pilote: false, son: true, sonSuit: "lui", mainNotes: true, mainCurseur: true,
      musiqueElan: 0.15, musiqueEffets: 0.5, musiqueFlash: 0.25, musiqueDrop: false } },
  // Jiiji, 21:50 : « le mode full auto : on regarde et on kiffe, il se genere tout seul avec des CV,
  // les mots font les sons, les sons font des mots, tout est lie ». Le pilote mene tout, le son joue,
  // l'ecran s'ecoute lui-meme (si la source existe : musiqueSource autre que micro et pc) et les
  // cables (cv.js) passent en patch automatique
  auto: { nom: "Full auto", sous: "on regarde : il se génère tout seul, tout est lié", page: "pilote",
    base: { pilote: true, son: true, sonSuit: "lui", piloteEffets: true, piloteCouleurs: true, piloteCombos: true, cvActif: true,
      musiqueElan: 0.25, musiqueEffets: 0.8, musiqueFlash: 0.3, musiqueDrop: false, kickMots: 0.5, caisseMots: 0.2, charleyMots: 0.1 } },
};
// la source « l'ecran s'ecoute lui-meme », si l'agent du son l'a ajoutee a musiqueSource
function sourceSoi() {
  const it = REGLAGE.musiqueSource, o = it && it.options.find(([k]) => k !== "micro" && k !== "pc");
  return o ? o[0] : null;
}
// les cables en patch automatique (cv.js, charge apres ce fichier) : par sa fonction ou par son reglage
function cablesAuto(oui) {
  if (typeof cv === "object" && cv) {
    if (typeof cv.patchAuto === "function") { cv.patchAuto(oui); return; }
    if (typeof cv.auto === "function") { cv.auto(oui); return; }
  }
  for (const c of ["cvAuto", "cvPatchAuto"]) if (c in DEFAUTS && typeof DEFAUTS[c] === "boolean" && S[c] !== oui) changer(c, oui);
}
const MODES_ORDRE = ["poesie", "vjing", "jeu", "auto"];
const MODE_CLES = new Set([].concat(...Object.values(MODES).map(m => Object.keys(m.base))));
const CLE_MODES = "poiasie-modes-v1", CLE_PRESETS = "poiasie-presets-v1";

/* ---------------------------------------------------- les presets */

// ce qu'un preset ne touche jamais : les reglages de Jiiji (lisibilite, son, source), ceux du mode,
// ce qui recharge tout
const PRESET_JAMAIS = new Set(["volume", "qualite", "source", "ordre", "nouveauxDabord", "musique", "musiqueSource", "musiqueEntree", "mode",
  "manetteMode", "annoncesEcran", "vibration", "son", "votes", "cartel", "direct", "bourse", "annotations", "filsRimes", "chutes",
  "pilote", "piloteAudace", "piloteRythme", "piloteCouleurs", "piloteCombos", "piloteEffets", "poemeMax", "tenue", "fonduDuree",
  "taille", "espacement", "ecriture", "voies", "maelstrom", "billets", "rouleaux", "mainSensibilite", "mainCurseur", "sonSuit",
  "musiqueDrop", "strobeFreq", "presetFondu", "presetScene", "presetVitesse", "hasardDose", "hasardVerrous", "presetCourant",
  "voixSeuil"].concat([...MODE_CLES]));
// ces reglages reconstruisent la scene : ils changent ensemble, une seule fois (et le poeme recommence)
const SCENE_GROUPE = new Set(["scene", "police", "casse", "entree", "sortie", "calligramme", "taille", "espacement", "ecriture", "voies"]);
// des entiers qui glissent quand meme (un cercle de teintes, un tempo)
const GLISSE_ENTIERS = new Set(["decalage", "teinteMots", "sonTempo", "sonFiltre"]);
// une image propre sous chaque preset (complet) : sans cela un preset garderait les effets du precedent
let SOCLE_PRESET = null;
function soclePreset() {
  if (SOCLE_PRESET) return SOCLE_PRESET;
  const s = Object.assign({}, AMBIANCES["Sobre (sans effet)"], {
    calque: "aucun", kaleidoStable: false, kaleidoTourne: 0.15, seuilHalo: 0.45, degradeForce: 0.85, larsenZoom: 1.015, larsenRotation: 0,
    tremblement: 0.3, frequence: 1, ondulation: 0, respiration: 0.3, rotationMots: 0, glitch: 0, aberration: 0, lueur: 0.15,
    contour: false, graisse: 0, ombre: 0, trainees: 0.2, derive: 0, modeCouleur: "poetes", vivacite: 1, clarte: 0, fondPulse: 0, casse: "normale",
    fond: "degrade",
  });
  for (const [c] of MODS) s["mod" + c] = 0;
  for (let i = 1; i <= LFO_NB; i++) s["lfo" + i + "Cible"] = "aucune";
  return (SOCLE_PRESET = s);
}
// une LFO lente sur un reglage : lfo(1, "halo", 40, 0.1, "sinus")
function L(i, cible, duree, amplitude, forme) {
  return { ["lfo" + i + "Cible"]: cible, ["lfo" + i + "Duree"]: duree, ["lfo" + i + "Amplitude"]: amplitude, ["lfo" + i + "Forme"]: forme || "sinus" };
}
// un effet qui ecoute le son (onglet « Le son mène ») : M("Halo", 0.8, "kick")
function M(c, force, src) { return { ["mod" + c]: force, ["mod" + c + "Src"]: src }; }
// scene et calque peuvent etre une liste de preferences : elle va dans preferences, et reglages garde
// la scene d'aujourd'hui qui la termine (ce que lit le pilote) ; resolue au depart (resoudrePresets)
function P(mode, nom, description, ...parts) {
  const reglages = Object.assign({}, ...parts), preferences = {};
  for (const c of ["scene", "calque"]) if (Array.isArray(reglages[c])) { preferences[c] = reglages[c]; reglages[c] = reglages[c].filter(x => typeof x === "string").pop(); }
  return { nom, mode, description, reglages, preferences };
}
// les scenes que d'autres fichiers ajoutent ce soir : si elles existent, elles passent devant
const CALLI_3D = /callig[a-z]*.*3d|3d.*callig|callig.*(relief|volume|espace)/i, SCENE_3D = /3d|relief|volume/i;

const PRESETS_KIT = {
  // La voix lit, l'image ecoute. Tout est lent (Jiiji : vitesse generale a 0,1 ou 0,19), lisible,
  // en transitions ; les scenes ou le poeme se lit en entier, ou les mots respirent.
  poesie: [
    P("poesie", "La page blanche", "Un coup de dés sur papier : la voix pose les mots à l'encre, le silence laisse la page.",
      { scene: "coupdedes", palette: "papier", police: "Garamond", fond: "degrade", trainees: 0, tremblement: 0.1, lueur: 0, vitesse: 0.15,
        grain: 0.12, vignetteGpu: 0.2, voixEcrit: true, voixGonfle: 0.5, voixTeinte: 0.3, voixLumiere: 0.15, voixAvance: 0.8 }),
    P("poesie", "Nuit étoilée à voix haute", "Chaque vers devient une constellation ; la voix allume les étoiles et les teinte.",
      { scene: "constellation", palette: "nuit", police: "Garamond", fond: "etoiles", trainees: 0.2, halo: 0.4, seuilHalo: 0.4, vignetteGpu: 0.35,
        vitesse: 0.14, voixGonfle: 0.8, voixTeinte: 0.7, voixLumiere: 0.8 }, L(1, "halo", 40, 0.08)),
    P("poesie", "Le souffle", "La nuée de lettres sous une aurore : la voix gonfle la murmuration, le silence la fait respirer.",
      { scene: "nuee", palette: "crepuscule", police: "Georgia", fond: "aurore", trainees: 0.35, respiration: 0.8, halo: 0.3, seuilHalo: 0.45,
        vitesse: 0.16, voixGonfle: 1.2, voixTeinte: 0.5, voixLumiere: 0.5 }, L(1, "respiration", 24, 0.12)),
    P("poesie", "Calligramme dit", "Le poème dessine sa forme, à la manière d'Apollinaire ; la voix l'écrit en couleur par-dessus.",
      { scene: [CALLI_3D, "calligramme"], calligramme: "hasard", palette: "nuit", police: "Garamond", fond: "etoiles", trainees: 0.3, tremblement: 0.4,
        lueur: 0.2, halo: 0.45, seuilHalo: 0.4, vignetteGpu: 0.4, vitesse: 0.15, voixGonfle: 0.7, voixTeinte: 0.8, voixLumiere: 0.6 }),
    P("poesie", "Encre de Chine", "Le fil d'encre se déroule sur le blanc ; la voix écrit en noir, rien d'autre.",
      { scene: "ruban", palette: "encre", police: "Garamond", fond: "degrade", trainees: 0, tremblement: 0.15, ombre: 0.25, vitesse: 0.15,
        voixEcrit: true, voixGonfle: 0.6, voixTeinte: 0, voixLumiere: 0, grain: 0.1 }),
    P("poesie", "La voix dans le puits", "On tombe dans les vers ; chaque syllabe fait battre les parois.",
      { scene: "puits", palette: "nuit", police: "Garamond", fond: "degrade", trainees: 0.3, halo: 0.55, seuilHalo: 0.35, vignetteGpu: 0.4,
        puitsVitesse: 0.3, puitsTorsion: 0.6, vitesse: 0.15, voixGonfle: 1, voixTeinte: 0.6, voixLumiere: 0.7 }, L(1, "puitsTorsion", 60, 0.1)),
    P("poesie", "Oscillographe", "Le vers est posé sur l'onde de la voix elle-même, sur un vieil écran vert.",
      { scene: "onde", palette: "phosphore", police: "Consolas", fond: "aucun", trainees: 0.55, halo: 0.7, seuilHalo: 0.3, courbure: 0.3,
        balayage: 0.35, vignetteGpu: 0.5, ondeHauteur: 1.4, vitesse: 0.18, voixEcrit: false, voixGonfle: 0.4, voixTeinte: 0.2, voixLumiere: 0.6 }),
    P("poesie", "Rosace murmurée", "Les vers en mandala d'or ; le mot le plus rare au cœur, la voix fait tourner la lumière.",
      { scene: "rosace", palette: "or", police: "Garamond", fond: "rayons", rosaceTourne: 0.3, halo: 0.4, seuilHalo: 0.4, vitesse: 0.14,
        voixGonfle: 1.2, voixTeinte: 0.4, voixLumiere: 0.5 }, L(1, "decalage", 90, 0.05, "doux")),
    P("poesie", "Bleu Klein", "La murmuration sur un seul bleu ; la voix ne change que la lumière.",
      { scene: "nuee", palette: "klein", police: "Georgia", fond: "uni", trainees: 0.15, modeCouleur: "palette", vitesse: 0.16,
        voixGonfle: 0.9, voixTeinte: 0, voixLumiere: 0.4 }),
    P("poesie", "Palimpseste", "Le poème se lit en entier, en fondu, et s'efface en poussière ; la voix réécrit par-dessus.",
      { scene: "lecture", entree: "fondu", sortie: "dissolution", palette: "papier", police: "Garamond", tremblement: 0.3, lueur: 0, trainees: 0,
        grain: 0.18, vignetteGpu: 0.25, vitesse: 0.15, voixEcrit: true, voixTeinte: 0.3, voixGonfle: 0.5, voixLumiere: 0.1 }),
    P("poesie", "Braise et cendres", "Il pleut des lettres au coucher du soleil ; la voix attise, le silence refroidit.",
      { scene: "averse", palette: "braise", police: "Georgia", fond: "horizon", averseVitesse: 0.25, averseDensite: 0.8, halo: 0.5, seuilHalo: 0.35,
        trainees: 0.25, vitesse: 0.16, voixGonfle: 0.8, voixTeinte: 0.8, voixLumiere: 0.9 }),
    P("poesie", "Un mot par syllabe", "Un mot du poème à chaque syllabe dite, sur une page de cahier.",
      { scene: "battement", palette: "papier", police: "Times New Roman", fond: "cahier", battementTemps: "1", battementStyle: "echo",
        pompe: 0.25, tremblement: 0, vitesse: 0.2, voixEcrit: false, voixGonfle: 0.4, voixTeinte: 0.3, voixLumiere: 0.3 }),
    P("poesie", "Clair de lune", "Le poème en forme de lune dans un ciel de glace.",
      { scene: [CALLI_3D, "calligramme"], calligramme: "lune", palette: "glace", police: "Garamond", fond: "etoiles", trainees: 0.3, halo: 0.5,
        seuilHalo: 0.35, vignetteGpu: 0.4, vitesse: 0.14, voixGonfle: 0.8, voixTeinte: 0.5, voixLumiere: 0.6 }),
    P("poesie", "Voie lactée", "On vole dans un champ d'étoiles faites de mots ; la voix accélère le vol, le silence le suspend.",
      { scene: "etoiles", palette: "nuit", police: "Garamond", etoiles: 420, vitesseEtoiles: 0.5, trainees: 0.4, lueur: 0.25, halo: 0.45,
        seuilHalo: 0.35, vitesse: 0.15, voixAvance: 1.4, voixSilence: 0.25, voixGonfle: 0.6, voixTeinte: 0.7, voixLumiere: 0.5 }),
  ],

  // (en 3D, scenes-3d.js : si une scene manque, la suivante de la liste)
  poesie3d: [
    P("poesie", "La vallée qu'on lit", "Chaque vers flotte sur la rivière ; la voix écrit par-dessus.",
      { scene: ["vallee", "coupdedes"], palette: "papier", police: "Garamond", fond: "degrade", trainees: 0, tremblement: 0.1, vitesse: 0.15,
        vignetteGpu: 0.25, voixEcrit: true, voixGonfle: 0.5, voixTeinte: 0.3, voixLumiere: 0.15 }),
    P("poesie", "Le globe dit", "Chaque vers est un parallèle du globe qui tourne ; la voix l'éclaire.",
      { scene: ["globe", "constellation"], palette: "nuit", police: "Garamond", fond: "etoiles", trainees: 0.2, halo: 0.45, seuilHalo: 0.4,
        vignetteGpu: 0.35, vitesse: 0.14, voixGonfle: 0.7, voixTeinte: 0.7, voixLumiere: 0.7 }),
    P("poesie", "Jet d'eau", "Le jet d'eau d'Apollinaire en relief, dans un ciel de glace.",
      { scene: ["fontaine", "calligramme"], calligramme: "fontaine", palette: "glace", police: "Garamond", fond: "etoiles", trainees: 0.3,
        halo: 0.45, seuilHalo: 0.4, vitesse: 0.14, voixGonfle: 0.8, voixTeinte: 0.6, voixLumiere: 0.6 }),
  ],

  // La musique mene : chaque preset donne une couleur, une scene (souvent deux) et des effets qui
  // ecoutent le son ; le pilote reprend la main 30 s apres.
  vjing: [
    P("vjing", "Club des vers", "Un mot par temps devant le puits qui bat, en différence : le kick décolle les couleurs.",
      { scene: "battement", calque: "puits", calquePlace: "derriere", calqueMelange: "difference", calqueOpacite: 0.85, calqueMouvement: "bat",
        calquePoeme: "autre", palette: "arc", police: "Impact", pompe: 0.5, choc: 1, halo: 0.6, seuilHalo: 0.35, vitesse: 0.22 }, M("Rvb", 0.8, "kick")),
    P("vjing", "Pulsar", "Les crêtes à la Unknown Pleasures : le spectre soulève les vers, le kick les allume.",
      { scene: "cretes", palette: "nuit", police: "Consolas", fond: "aucun", trainees: 0, tremblement: 0, halo: 0.3, seuilHalo: 0.5,
        cretesHauteur: 1.4, vitesse: 0.2 }, M("Halo", 0.8, "kick"), M("Grain", 0.5, "charley")),
    P("vjing", "Néon liquide", "Le puits au néon qui se tord ; les médiums font onduler l'image, les teintes dérivent.",
      { scene: "puits", palette: "neon", police: "Impact", fond: "degrade", trainees: 0.3, halo: 0.8, seuilHalo: 0.3, puitsTorsion: 1.4,
        fondPulse: 0.4, vitesse: 0.2 }, M("Ondes", 0.5, "mediums"), L(1, "decalage", 64, 0.06)),
    P("vjing", "Datamosh", "Les mots battent en blocs cassés, les couleurs se décalent à chaque coup.",
      { scene: "battement", palette: "neon", police: "Impact", blocs: 0.5, rvb: 0.7, choc: 0.6, pompe: 0.4, trainees: 0.1, vitesse: 0.22 },
      M("Blocs", 0.8, "kick"), M("Rvb", 0.6, "caisse")),
    P("vjing", "Caméra thermique", "Les crêtes vues en chaleur : le kick fait monter la lumière.",
      { scene: "cretes", palette: "nuit", police: "Consolas", fond: "aucun", degrade: "thermique", degradeForce: 1, halo: 0.3, seuilHalo: 0.5,
        trainees: 0.1, vitesse: 0.2 }, M("Lumiere", 0.4, "kick")),
    P("vjing", "Synthé 84", "L'oscilloscope sur un sol de lettres jusqu'à l'horizon, en vaporwave.",
      { scene: "onde", palette: "vapeur", police: "Impact", fond: "sol", trainees: 0.2, halo: 0.6, seuilHalo: 0.35, balayage: 0.3, vitesse: 0.2 },
      M("Courbure", 0.3, "kick"), M("Teintes", 0.3, "mesure")),
    P("vjing", "Kaléidoscope des vers", "La rosace dans un kaléidoscope stable qui respire avec les basses.",
      { scene: "rosace", palette: "arc", police: "Garamond", kaleido: 6, kaleidoStable: true, kaleidoTourne: 0.08, halo: 0.6, seuilHalo: 0.35,
        trainees: 0.25, vitesse: 0.18 }, M("Halo", 0.5, "basses"), M("KZoom", 0.4, "basses")),
    P("vjing", "Larsen d'étoiles", "Le champ d'étoiles qui se filme lui-même ; les basses poussent le zoom.",
      { scene: "etoiles", palette: "mystify", police: "Georgia", larsen: 0.85, larsenZoom: 1.03, larsenRotation: 0.01, halo: 0.5, trainees: 0,
        vitesseEtoiles: 0.6, vitesse: 0.2 }, M("LarsenZoom", 0.6, "basses")),
    P("vjing", "Averse acide", "Pluie de lettres vertes passée à l'acide ; les aigus font l'arc-en-ciel.",
      { scene: "averse", palette: "phosphore", police: "Consolas", fond: "aucun", degrade: "acide", degradeForce: 0.7, halo: 0.6, seuilHalo: 0.3,
        balayage: 0.25, trainees: 0, vitesse: 0.2 }, M("Chroma", 0.4, "aigus")),
    P("vjing", "Rouge sang", "Le puits rouge : chaque kick part en onde de choc, la couleur plonge sur le coup.",
      { scene: "puits", palette: "sang", police: "Impact", fond: "degrade", halo: 0.7, seuilHalo: 0.35, choc: 0.8, pompe: 0.3, vignetteGpu: 0.5,
        trainees: 0.2, vitesse: 0.2 }, M("Saturation", -0.4, "kick")),
    P("vjing", "Cassette 89", "La nuée sur une vieille cassette : bande usée, écran bombé, les aigus font neiger.",
      { scene: "nuee", palette: "nuit", police: "Georgia", vhs: 0.6, courbure: 0.35, balayage: 0.4, grain: 0.3, rvb: 0.5, halo: 0.4,
        trainees: 0.3, vitesse: 0.2 }, M("Vhs", 0.5, "aigus"), M("Rvb", 0.4, "kick")),
    P("vjing", "Soleil noir", "La rosace d'or sous un soleil levant, solarisée ; le kick brûle le négatif.",
      { scene: "rosace", palette: "or", police: "Garamond", fond: "rayons", solarisation: 0.8, halo: 0.4, seuilHalo: 0.4, vitesse: 0.18 },
      M("Solarisation", 0.3, "kick")),
    P("vjing", "Tempête de lettres", "Le tourbillon de glace aspire les vers ; les coups font trembler les couleurs.",
      { scene: "tourbillon", palette: "glace", police: "Georgia", spin: 1.6, inclinaison: 0.5, halo: 0.5, seuilHalo: 0.4, trainees: 0.55,
        vitesse: 0.2 }, M("Rvb", 0.6, "kick"), M("Halo", 0.4, "basses")),
    P("vjing", "Hypnose", "La rosace et la constellation l'une dans l'autre, qui s'enroulent ; les teintes tournent lentement.",
      { scene: "rosace", calque: "constellation", calquePlace: "devant", calqueMelange: "lumiere", calqueOpacite: 0.7, calqueMouvement: "tourne",
        calquePoeme: "autre", palette: "vapeur", police: "Garamond", kaleidoSpirale: 1.2, halo: 0.5, seuilHalo: 0.4, trainees: 0.3, vitesse: 0.18 },
      M("KSpirale", 0.6, "basses"), L(1, "decalage", 90, 0.25, "triangle")),
    P("vjing", "Nuit et nuée", "La constellation et la murmuration en combo, le même poème des deux côtés.",
      { scene: "constellation", calque: "nuee", calquePlace: "devant", calqueMelange: "lumiere", calqueOpacite: 0.8, calqueMouvement: "aucun",
        calquePoeme: "meme", palette: "nuit", police: "Garamond", trainees: 0.2, halo: 0.4, seuilHalo: 0.4, vitesse: 0.18 }, M("Halo", 0.4, "kick")),
    P("vjing", "Relief", "Le texte en trois dimensions qui culbute, en chrome, et les crêtes derrière.",
      { scene: ["drape", "champ", "texte3d"], calque: "cretes", calquePlace: "derriere", calqueMelange: "ecran", calqueOpacite: 0.6, calqueMouvement: "aucun",
        calquePoeme: "autre", mode3d: "culbute", surface: "chrome", palette: "nuit", police: "Impact", halo: 0.5, seuilHalo: 0.4, vitesse: 0.2 },
      M("Halo", 0.5, "kick")),
  ],

  vjing3d: [
    P("vjing", "L'hélice des vers", "Deux brins de vers et des barreaux de mots qui tournent ; le kick décolle les couleurs.",
      { scene: ["helice", "puits"], palette: "neon", police: "Impact", fond: "degrade", halo: 0.7, seuilHalo: 0.35, trainees: 0.25, choc: 0.6, vitesse: 0.2 },
      M("Rvb", 0.6, "kick"), M("Halo", 0.4, "basses")),
    P("vjing", "Houle", "Une houle de vers à perte de vue, soulevée par les basses, sous un ciel de braise.",
      { scene: ["champ", "cretes"], palette: "braise", police: "Georgia", fond: "horizon", halo: 0.5, seuilHalo: 0.4, trainees: 0.2, vitesse: 0.2 },
      M("Lumiere", 0.35, "kick"), M("Ondes", 0.3, "mediums")),
  ],

  // La manette mene : des fonds qui laissent la place a la main, des sons qui chantent les mots.
  jeu: [
    P("jeu", "Tableau noir", "Un ciel presque vide : la main écrit à la craie, les mots restent longtemps.",
      { scene: "etoiles", etoiles: 140, vitesseEtoiles: 0.3, palette: "nuit", police: "Georgia", fond: "aucun", trainees: 0, halo: 0.3, seuilHalo: 0.5,
        mainVie: 30, mainTaille: 1.2, mainVent: 0, mainEnvol: 0, sonTimbre: "poetes", sonGamme: "pentaMaj", vitesse: 0.15 }),
    P("jeu", "Jardin japonais", "Papier, kalimba et gamme hirajoshi : chaque mot tombe comme une pierre dans l'eau.",
      { scene: "coupdedes", palette: "papier", police: "Garamond", fond: "degrade", trainees: 0, mainVie: 20, mainEnvol: -0.08, mainVent: 0,
        sonGamme: "hirajoshi", sonTimbre: "kalimba", sonReverb: 0.5, sonEcho: 0.3, vitesse: 0.15 }),
    P("jeu", "Vent d'automne", "Les mots écrits partent avec le vent sous un ciel de braise ; cordes pincées.",
      { scene: "averse", averseVitesse: 0.3, palette: "braise", police: "Georgia", fond: "horizon", mainVent: 0.35, mainEnvol: 0.05, mainVie: 16,
        sonTimbre: "corde", sonGamme: "dorien", halo: 0.35, seuilHalo: 0.4, vitesse: 0.16 }),
    P("jeu", "Apesanteur", "Les mots montent doucement dans la nuit étoilée ; des clochettes.",
      { scene: "constellation", palette: "nuit", police: "Garamond", fond: "etoiles", mainEnvol: 0.3, mainVent: 0, mainVie: 24, sonTimbre: "clochette",
        sonReverb: 0.5, halo: 0.4, seuilHalo: 0.4, vitesse: 0.15 }),
    P("jeu", "Gamelan", "La rosace d'or et la gamme pelog, non tempérée ; cloches de métal.",
      { scene: "rosace", palette: "or", police: "Garamond", fond: "rayons", sonGamme: "pelog", sonTimbre: "fm", sonMetal: 0.5, mainTaille: 1.1,
        mainVie: 18, halo: 0.4, seuilHalo: 0.4, vitesse: 0.15 }),
    P("jeu", "Pluie de néon", "Le puits au néon : les mots écrits vivent peu et brillent fort, en notes pincées.",
      { scene: "puits", palette: "neon", police: "Impact", fond: "degrade", halo: 0.8, seuilHalo: 0.3, mainVie: 10, mainTaille: 1.4,
        sonTimbre: "pluck", sonGamme: "tons", trainees: 0.3, vitesse: 0.18 }),
    P("jeu", "Écritoire 98", "Le vieux bureau turquoise et ses polygones ; la main écrit en Times, en carrés usés.",
      { scene: "mystifier", palette: "bureau95", police: "Times New Roman", fond: "uni", trainees: 0.12, mainVie: 40, sonTimbre: "carre",
        sonGamme: "majeur", vitesse: 0.15 }),
    P("jeu", "Sous la mer", "La nuée de glace ondule ; les mots remontent comme des bulles, en kalimba.",
      { scene: "nuee", palette: "glace", police: "Georgia", fond: "degrade", ondes: 0.35, mainEnvol: 0.15, mainVent: -0.1, mainVie: 20,
        sonTimbre: "kalimba", sonGamme: "pentaMin", sonReverb: 0.5, vitesse: 0.15 }),
    P("jeu", "La forge", "Les crêtes de braise ; chaque mot frappe un marimba de métal.",
      { scene: "cretes", palette: "braise", police: "Impact", fond: "aucun", sonTimbre: "marimba", sonMetal: 0.6, halo: 0.5, seuilHalo: 0.4,
        rvb: 0.25, mainTaille: 1.3, mainVie: 14, vitesse: 0.18 }),
    P("jeu", "Le chœur", "La rosace au crépuscule : chaque mot écrit sonne comme une cloche, en dorien.",
      { scene: "rosace", palette: "crepuscule", police: "Garamond", sonTimbre: "clochette", sonGamme: "dorien", sonBourdon: 0, mainVie: 18,
        halo: 0.4, seuilHalo: 0.4, trainees: 0.15, vitesse: 0.15 }),
    P("jeu", "Arcade", "Un mot par temps sur un écran bombé de salle de jeux ; carrés usés, pentatonique.",
      { scene: "battement", battementTemps: "2", palette: "arc", police: "Impact", courbure: 0.4, balayage: 0.4, vhs: 0.25, sonTimbre: "carre",
        sonGamme: "pentaMaj", mainTaille: 1.3, mainVie: 12, vitesse: 0.2 }),
    P("jeu", "Nuit blanche", "Le fil d'encre sur le blanc ; la main écrit en noir, au piano électrique, lydien.",
      { scene: "ruban", palette: "encre", police: "Garamond", fond: "degrade", trainees: 0, sonTimbre: "fmdoux", sonGamme: "lydien", mainVie: 30,
        vitesse: 0.15 }),
    P("jeu", "Radio fantôme", "L'oscilloscope vert et des notes pincées en quarts de ton.",
      { scene: "onde", palette: "phosphore", police: "Consolas", fond: "aucun", sonTimbre: "pluck", sonGamme: "rast", courbure: 0.3, balayage: 0.35,
        grain: 0.3, halo: 0.5, seuilHalo: 0.35, mainVie: 16, vitesse: 0.18 }),
    P("jeu", "Calligraphe", "Le calligramme derrière, la main qui écrit devant, en cloches de verre.",
      { scene: [CALLI_3D, "calligramme"], calligramme: "hasard", palette: "nuit", police: "Garamond", fond: "etoiles", halo: 0.4, seuilHalo: 0.4,
        mainVie: 22, sonTimbre: "clochette", sonGamme: "pentaMin", trainees: 0.25, vitesse: 0.15 }),
  ],

  jeu3d: [
    P("jeu", "Le nœud", "Le poème s'écrit sur un nœud qui tourne ; la main écrit devant, en cloches.",
      { scene: ["noeud", "rosace"], palette: "or", police: "Garamond", fond: "degrade", halo: 0.4, seuilHalo: 0.4, mainVie: 20, sonTimbre: "fm",
        sonGamme: "lydien", trainees: 0.2, vitesse: 0.15 }),
  ],

  auto3d: [
    P("auto", "Le monde tourne", "Le globe de vers tourne lentement dans les étoiles.",
      { scene: ["globe", "constellation"], palette: "nuit", police: "Garamond", fond: "etoiles", halo: 0.4, seuilHalo: 0.4, trainees: 0.2, vitesse: 0.12,
        sonTimbre: "clochette", sonReverb: 0.5 }, L(1, "halo", 120, 0.1)),
    P("auto", "Ruban sans fin", "Le vers passe de l'autre côté du ruban de Möbius, sans fin.",
      { scene: ["moebius", "ruban"], palette: "crepuscule", police: "Garamond", fond: "aurore", halo: 0.4, seuilHalo: 0.4, trainees: 0.25, vitesse: 0.12,
        sonTimbre: "kalimba", sonGamme: "tons" }, L(1, "decalage", 240, 0.05, "doux")),
    P("auto", "Galaxie", "Les vers tournent autour d'un cœur de lumière ; une constellation devant.",
      { scene: ["galaxie", "etoiles"], calque: "constellation", calquePlace: "devant", calqueMelange: "lumiere", calqueOpacite: 0.5, calqueMouvement: "aucun",
        calquePoeme: "autre", palette: "vapeur", police: "Garamond", halo: 0.5, seuilHalo: 0.35, trainees: 0.3, vitesse: 0.12, sonTimbre: "clochette" }),
    P("auto", "Drapé", "Un tissu de vers dans le vent, en encre sur le blanc ; une harpe.",
      { scene: ["drape", "ruban"], palette: "encre", police: "Garamond", fond: "degrade", trainees: 0, vitesse: 0.12, sonTimbre: "corde", sonBourdon: 0 }),
  ],

  // Full auto : on regarde. Des mondes qui continuent (constellations, nuee, encre, puits), des combos
  // lents, des LFO tres longs, un son qui evolue : le pilote et les cables font le reste.
  auto: [
    P("auto", "Marée lente", "La constellation et la nuée l'une dans l'autre ; la lumière monte et descend sur deux minutes.",
      { scene: "constellation", calque: "nuee", calquePlace: "devant", calqueMelange: "lumiere", calqueOpacite: 0.6, calqueMouvement: "aucun",
        calquePoeme: "autre", palette: "nuit", police: "Garamond", fond: "etoiles", trainees: 0.25, halo: 0.4, seuilHalo: 0.4, vitesse: 0.12,
        sonTimbre: "derive", sonReverb: 0.5, sonEvolution: 0.8, sonCycle: 8 }, L(1, "halo", 120, 0.15), L(2, "decalage", 240, 0.06, "doux")),
    P("auto", "Herbier", "La rosace dans les verts de la forêt, cordes pincées et pentatonique.",
      { scene: "rosace", palette: "foret", police: "Garamond", fond: "degrade", rosaceTourne: 0.25, halo: 0.35, seuilHalo: 0.4, trainees: 0.15,
        vitesse: 0.12, sonTimbre: "corde", sonGamme: "pentaMaj", sonReverb: 0.5 }, L(1, "rosaceTourne", 90, 0.08)),
    P("auto", "Jardin de pierres", "Un coup de dés sur papier, une kalimba en hirajoshi : presque rien.",
      { scene: "coupdedes", palette: "papier", police: "Garamond", fond: "degrade", trainees: 0, tremblement: 0.1, grain: 0.12, vitesse: 0.12,
        sonTimbre: "kalimba", sonGamme: "hirajoshi", sonDensite: 0.4, sonReverb: 0.5, sonEcho: 0.3 }),
    P("auto", "Aquarium", "La nuée de glace qui ondule doucement ; une boîte à musique, très loin.",
      { scene: "nuee", palette: "glace", police: "Georgia", fond: "degrade", ondes: 0.3, trainees: 0.3, halo: 0.3, seuilHalo: 0.45, vitesse: 0.12,
        sonTimbre: "boite", sonGamme: "pentaMin", sonReverb: 0.5 }, L(1, "ondes", 75, 0.06)),
    P("auto", "Observatoire", "On vole dans les étoiles de mots, une constellation se dessine par-dessus.",
      { scene: "etoiles", calque: "constellation", calquePlace: "devant", calqueMelange: "lumiere", calqueOpacite: 0.7, calqueMouvement: "aucun",
        calquePoeme: "autre", palette: "nuit", police: "Garamond", vitesseEtoiles: 0.35, trainees: 0.35, halo: 0.45, seuilHalo: 0.35, vitesse: 0.12,
        sonTimbre: "clochette", sonGamme: "lydien", sonReverb: 0.5 }),
    P("auto", "Cathédrale", "La rosace d'or sous un soleil levant, des cloches dans la nef.",
      { scene: "rosace", palette: "or", police: "Garamond", fond: "rayons", halo: 0.5, seuilHalo: 0.4, vignetteGpu: 0.35, vitesse: 0.12,
        sonTimbre: "clochette", sonBourdon: 0, sonGamme: "dorien", sonReverb: 0.5 }, L(1, "halo", 150, 0.12)),
    P("auto", "Pluie d'été", "Il pleut des lettres au crépuscule ; une boîte à musique sous la pluie.",
      { scene: "averse", palette: "crepuscule", police: "Georgia", fond: "horizon", averseVitesse: 0.3, averseDensite: 0.9, halo: 0.4, seuilHalo: 0.4,
        trainees: 0.2, vitesse: 0.12, sonTimbre: "boite", sonPoussiere: 0.03, sonReverb: 0.5 }),
    P("auto", "Télégraphe", "L'oscilloscope vert écoute l'écran lui-même ; des notes pincées en quarts de ton.",
      { scene: "onde", palette: "phosphore", police: "Consolas", fond: "aucun", trainees: 0.5, halo: 0.6, seuilHalo: 0.3, courbure: 0.3, balayage: 0.3,
        vignetteGpu: 0.45, vitesse: 0.14, sonTimbre: "pluck", sonGamme: "rast" }),
    P("auto", "Fleuve d'encre", "Les fils d'encre se croisent sur le blanc, au piano électrique.",
      { scene: "ruban", palette: "encre", police: "Garamond", fond: "degrade", trainees: 0, ombre: 0.2, vitesse: 0.12,
        sonTimbre: "fmdoux", sonGamme: "majeur", sonDensite: 0.5, sonReverb: 0.5 }),
    P("auto", "Mandala qui respire", "Un kaléidoscope stable de huit miroirs qui s'enroule et se déroule.",
      { scene: "constellation", palette: "vapeur", police: "Garamond", fond: "degrade", kaleido: 8, kaleidoStable: true, kaleidoTourne: 0.05,
        halo: 0.5, seuilHalo: 0.35, trainees: 0.3, vitesse: 0.12, sonTimbre: "kalimba", sonGamme: "tons" }, L(1, "kaleidoSpirale", 180, 0.25, "triangle")),
    P("auto", "Veille 98", "Les polygones de Mystifier, comme un économiseur oublié allumé.",
      { scene: "mystifier", palette: "mystify", police: "Tahoma", fond: "uni", trainees: 0.12, vitesse: 0.15, sonTimbre: "carre", sonGamme: "majeur", sonDensite: 0.4 }),
    P("auto", "Aurore boréale", "La constellation sous une aurore de glace, des cloches de verre.",
      { scene: "constellation", palette: "glace", police: "Garamond", fond: "aurore", trainees: 0.2, halo: 0.4, seuilHalo: 0.4, vitesse: 0.12,
        sonTimbre: "clochette", sonBourdon: 0, sonReverb: 0.5 }, L(1, "decalage", 200, 0.05, "doux")),
    P("auto", "Le puits sans fond", "On tombe sans fin dans les vers ; le puits se tord au rythme d'une très longue onde.",
      { scene: "puits", palette: "nuit", police: "Garamond", fond: "degrade", puitsVitesse: 0.25, halo: 0.5, seuilHalo: 0.35, vignetteGpu: 0.4,
        trainees: 0.3, vitesse: 0.12, sonTimbre: "marimba", sonOctave: -1, sonBourdon: 0 }, L(1, "puitsTorsion", 160, 0.3, "triangle")),
    P("auto", "Calligrammes du soir", "Les formes d'Apollinaire au crépuscule, l'une après l'autre.",
      { scene: [CALLI_3D, "calligramme"], calligramme: "hasard", palette: "crepuscule", police: "Garamond", fond: "aurore", trainees: 0.3, halo: 0.4,
        seuilHalo: 0.4, vitesse: 0.12, sonTimbre: "kalimba", sonGamme: "pentaMaj" }),
  ],
};
// PRESETS : la liste de tous les presets du kit, chacun avec son mode (le pilote la lit telle quelle) ;
// PRESETS.poesie, PRESETS.vjing, PRESETS.jeu, PRESETS.auto : ceux d'un mode (non enumerables)
const PRESETS = [].concat(...Object.values(PRESETS_KIT));
for (const m of MODES_ORDRE) Object.defineProperty(PRESETS, m, { enumerable: false, get() { return PRESETS.filter(p => p.mode === m); } });
function ajouterPreset(mode, preset) {
  if (!MODES[mode]) return;
  PRESETS.push(Object.assign({ mode, preferences: {} }, preset));
  if (typeof majModesUI === "function") majModesUI(true);
}
function presetsDe(mode) { return PRESETS[mode].concat(modes.mes.filter(p => p.mode === mode)); }
// au depart (toutes les scenes ajoutees) : chaque preference devient la scene qui existe
function resoudrePresets() {
  for (const p of PRESETS) for (const c in p.preferences || {}) { const k = sceneParmi(p.preferences[c], c === "calque"); if (k) p.reglages[c] = k; }
}

/* ---------------------------------------------------- le hasard de tout */

// jamais : ce qui clignote, le volume, la finesse, la source, le mode, ce qui recharge tout, et ce qui
// regle l'ecran plutot que l'image
const HASARD_JAMAIS = new Set(["strobe", "strobeFreq", "negatif", "volume", "qualite", "source", "ordre", "nouveauxDabord", "mode", "musique",
  "musiqueSource", "musiqueEntree", "manetteMode", "annoncesEcran", "vibration", "son", "votes", "cartel", "direct", "bourse", "annotations",
  "filsRimes", "chutes", "pilote", "maelstrom", "billets", "rouleaux", "taille", "espacement", "ecriture", "voies", "musiqueDrop", "sonSuit",
  "mainCurseur", "mainSensibilite", "mainNotes", "crt", "presetFondu", "presetScene", "presetVitesse", "hasardDose", "hasardVerrous",
  "presetCourant", "voixSeuil", "piloteCouleurs", "piloteCombos", "piloteEffets"]);
// ni les reglages du jeu (live.js) : le poete de chaque manette, ceux qu'on peut jouer, la vibration
for (const c in DEFAUTS) if (/^main(Perso|Jouable|Vibre)/.test(c)) HASARD_JAMAIS.add(c);
// [plancher, plafond, chance d'etre allume (un effet), valeur eteinte] : des plages qui restent belles
const HASARD_PLAGES = {
  vitesse: [0.06, 0.3], tenue: [12, 60], fonduDuree: [2, 6], poemeMax: [40, 180], piloteAudace: [0.2, 0.9],
  tremblement: [0, 2.2], frequence: [0.3, 2], ondulation: [0.2, 1.5, 0.35], respiration: [0, 1.2], rotationMots: [0.1, 0.8, 0.3],
  glitch: [0.02, 0.3, 0.35], aberration: [0.2, 1.2, 0.25], lueur: [0, 0.7], graisse: [0.3, 1.5, 0.2], ombre: [0.2, 1, 0.25],
  trainees: [0, 0.75], derive: [0.2, 1.5, 0.3], vivacite: [0.7, 1.4], clarte: [-0.3, 0.3], teinteMots: [0, 359], fondPulse: [0.2, 1, 0.3],
  halo: [0.2, 1, 0.5], seuilHalo: [0.3, 0.6], teinteGpu: [0.05, 0.4, 0.12], bichromie: [0.5, 0.9, 0.12], pompe: [0.2, 0.6, 0.25],
  kaleidoTourne: [-0.3, 0.3], kaleidoSpirale: [0.3, 1.5, 0.15], ondes: [0.15, 0.8, 0.2], choc: [0.4, 1.2, 0.25],
  mosaique: [0.05, 0.25, 0.06], rvb: [0.2, 1.2, 0.3], blocs: [0.2, 0.6, 0.1], fonte: [0.1, 0.4, 0.08],
  degradeForce: [0.5, 1], saturation: [0.75, 1.6], contraste: [0.85, 1.4], exposition: [0.85, 1.3], decalage: [0, 359, 0.2], chroma: [0.2, 0.6, 0.08],
  solarisation: [0.5, 0.9, 0.08], posterisation: [3, 6, 0.08],
  larsen: [0.5, 0.9, 0.15], larsenZoom: [0.99, 1.04], larsenRotation: [-0.02, 0.02], larsenTeinte: [0.2, 0.8, 0.3],
  vhs: [0.3, 0.8, 0.15], courbure: [0.2, 0.6, 0.2], balayage: [0.2, 0.6, 0.2], grain: [0.1, 0.4, 0.3], vignetteGpu: [0.2, 0.6, 0.5],
  spin: [0.4, 2.5], aspiration: [0.5, 2], inclinaison: [0.35, 1], etoiles: [150, 600], vitesseEtoiles: [0.2, 1.5], profondeur: [6, 30],
  polygones: [1, 4], sommets: [3, 7], echos: [5, 30], vague: [0.3, 2], puitsVitesse: [0.15, 1.2], puitsTorsion: [0.2, 2], puitsParois: [0.3, 1.5],
  cretesLignes: [10, 26], cretesHauteur: [0.6, 2], averseDensite: [0.5, 2], averseVitesse: [0.15, 1.5], rosaceTourne: [0.2, 2], rosaceCopies: [4, 14],
  ondeHauteur: [0.6, 1.8], calqueOpacite: [0.5, 0.9], calqueMusique: [0, 0.7],
  musiqueSensibilite: [0.7, 1.6], musiqueReaction: [0.6, 1.6], musiquePulse: [0.6, 2], musiqueElan: [0, 0.8], musiqueFlash: [0.1, 0.8], musiqueEffets: [0.5, 1.8],
  kickMots: [0.2, 1.4], kickSeuil: [0.3, 0.7], kickRelache: [0.1, 0.5], caisseMots: [0.2, 1, 0.4], caisseSeuil: [0.3, 0.7], caisseRelache: [0.08, 0.3],
  charleyMots: [0.1, 0.8, 0.3], charleySeuil: [0.3, 0.7], charleyRelache: [0.04, 0.2],
  mainVie: [8, 30], mainTaille: [0.7, 1.6], mainVent: [-0.3, 0.3, 0.4], mainEnvol: [-0.2, 0.3, 0.4],
  // le son, dans les plages de « Un son au hasard » (son.js)
  sonTempo: [12, 60], sonOctave: [-1, 1], sonDensite: [0.3, 1], sonSouffle: [0, 4], sonTenue: [0.5, 2.5], sonAttaque: [0, 0.8], sonAccords: [0, 0.5],
  sonMetal: [0, 0.6], sonBruit: [0, 0.1], sonBourdon: [0, 0.1], sonPoussiere: [0, 0.1], sonReverb: [0.2, 0.9], sonEcho: [0.1, 0.6, 0.7], sonFiltre: [800, 9000],
  sonSature: [0.1, 0.4, 0.3], sonEcrase: [0.2, 0.6, 0.2], sonLargeur: [0.3, 1], sonVibrato: [0, 0.5], sonVibratoVitesse: [1, 7], sonTremolo: [0.05, 0.15, 0.05],
  sonTremoloVitesse: [2, 12], sonBalayage: [-0.6, 1], sonResonance: [0, 0.7], sonGlisse: [0, 0.5], sonUsure: [0, 0.6], sonHasard: [0.2, 0.6, 0.15],
  sonBegaiement: [0, 0.3], sonMouvement: [0, 0.7], sonEvolution: [0.3, 0.9], sonCycle: [2, 8],
};
// les cases que le hasard peut retourner (les autres disent ce que l'ecran montre, pas l'image)
const HASARD_CASES = new Set(["tremblementValeur", "contour", "sensHoraire", "ondeReflet", "kaleidoStable", "couleurPoetes", "sonArc", "sonRimes"]);
// ce qui compte comme un effet de la carte : le hasard n'en allume jamais trop a la fois
const EFFETS_GPU = ["halo", "rvb", "ondes", "mosaique", "kaleido", "larsen", "vhs", "courbure", "balayage", "grain", "teinteGpu", "bichromie", "pompe",
  "choc", "kaleidoSpirale", "blocs", "fonte", "chroma", "solarisation", "posterisation", "larsenTeinte"];
// des onglets entiers qui ne font qu'une famille (sinon une case par groupe)
const FAMILLES_FONDUES = new Set(["LFO", "Le son mène", "Mouvements"]);
const ONGLETS_HORS_HASARD = new Set(["Modes", "Poèmes", "Générateur", "À propos"]);

/* ---------------------------------------------------- la voix (mode poesie) */

const voix = {
  buf: null, x: null, cumul: null, cor: null,
  env: 0, envLent: 0, rms: 0, plafond: 0.03, plancher: 0.002, arme: true, attaque: false, derniereAttaque: 0, syllabes: [], debit: 0,
  hauteur: 0, hauteurLisse: 0, voise: false, confiance: 0, silence: 9, parle: false, image: 0,
  actif() { return S.mode === "poesie" && S.musique && musique.actif && !!musique.analyse && !!musique.analyse.getFloatTimeDomainData; },
  maj(dt) {
    this.attaque = false;
    if (!this.actif()) { this.env *= Math.exp(-dt * 6); this.envLent *= Math.exp(-dt * 3); this.parle = false; this.voise = false; this.silence += dt; return; }
    const a = musique.analyse, n = a.fftSize || 2048;
    if (!this.buf || this.buf.length !== n) this.buf = new Float32Array(n);
    a.getFloatTimeDomainData(this.buf);
    // l'enveloppe : la force de la voix, rapportee au bruit de la piece (plancher) et a la voix la
    // plus forte des dernieres secondes (plafond) : elle danse pareil pres du micro et loin
    const b = this.buf;
    let s = 0;
    for (let i = 0; i < n; i++) s += b[i] * b[i];
    const r = Math.sqrt(s / n);
    this.rms = r;
    // le plancher descend vite (une pause) et remonte lentement (un bruit qui s'installe)
    this.plancher = r < this.plancher ? lerp(this.plancher, r, 1 - Math.exp(-dt * 5)) : this.plancher * Math.pow(2, dt / 8);
    this.plancher = clamp(this.plancher, 0.0002, Math.max(0.0003, this.plafond * 0.4));
    this.plafond = Math.max(r, this.plafond * Math.pow(0.5, dt / 12), this.plancher * 5, 0.004);
    const porte = this.plancher * (1.4 + 3 * (1 - S.voixSeuil));
    const e = clamp((r - porte) / Math.max(1e-4, this.plafond - porte), 0, 1);
    this.env = e > this.env ? lerp(this.env, e, 1 - Math.exp(-dt * 45)) : lerp(this.env, e, 1 - Math.exp(-dt * 10));
    this.envLent = lerp(this.envLent, this.env, 1 - Math.exp(-dt * 5));
    // une syllabe : l'enveloppe rebondit au-dessus de sa moyenne lente, apres etre retombee
    const t = performance.now() / 1000;
    if (this.env < this.envLent * 0.85 || this.env < 0.06) this.arme = true;
    if (this.arme && this.env > 0.12 && this.env > this.envLent * 1.15 + 0.05 && t - this.derniereAttaque > 0.11) {
      this.attaque = true; this.arme = false; this.derniereAttaque = t;
      this.syllabes.push(t);
      if (typeof bus !== "undefined") bus.emettre("syllabe", { force: this.env, hauteur: this.voise ? this.hauteurLisse : 0, voise: this.voise });
    }
    while (this.syllabes.length && t - this.syllabes[0] > 3) this.syllabes.shift();
    this.debit = this.syllabes.length / 3;
    this.parle = this.env > 0.05;
    this.silence = this.parle ? 0 : this.silence + dt;
    // la hauteur, une image sur deux (l'autocorrelation coute ~0,2 ms)
    if (this.env > 0.08) { if ((this.image++ & 1) === 0) this.hauteurDe((musique.ctx && musique.ctx.sampleRate) || 48000); }
    else { this.voise = false; this.confiance = 0; }
  },
  // l'autocorrelation normalisee, sur le signal ramene a la moitie (de 70 a 600 Hz) ; on garde le
  // plus petit decalage proche du meilleur (sinon l'octave du dessous gagne souvent)
  hauteurDe(sr) {
    const b = this.buf, N = b.length >> 1, sr2 = sr / 2;
    if (!this.x || this.x.length !== N) { this.x = new Float32Array(N); this.cumul = new Float64Array(N + 1); this.cor = new Float32Array(N); }
    const x = this.x, cu = this.cumul, cor = this.cor;
    for (let i = 0; i < N; i++) { x[i] = (b[2 * i] + b[2 * i + 1]) * 0.5; cu[i + 1] = cu[i] + x[i] * x[i]; }
    const lagMin = Math.max(2, Math.floor(sr2 / 600)), lagMax = Math.min(N >> 1, Math.ceil(sr2 / 70)), M = N - lagMax;
    const e0 = cu[M];
    if (e0 < 1e-9) { this.voise = false; return; }
    let meilleur = 0;
    for (let lag = lagMin; lag <= lagMax; lag++) {
      let s = 0;
      for (let i = 0; i < M; i++) s += x[i] * x[i + lag];
      const c = s / Math.sqrt(e0 * (cu[lag + M] - cu[lag]) + 1e-12);
      cor[lag] = c;
      if (c > meilleur) meilleur = c;
    }
    let choisi = 0;
    for (let lag = lagMin + 1; lag < lagMax; lag++) {
      if (cor[lag] >= meilleur * 0.9 && cor[lag] >= cor[lag - 1] && cor[lag] >= cor[lag + 1]) { choisi = lag; break; }
    }
    this.confiance = meilleur;
    this.voise = meilleur > 0.6 && choisi > 0;
    if (!this.voise) return;
    const a = cor[choisi - 1], c = cor[choisi], d = cor[choisi + 1], den = a - 2 * c + d;
    const lag = choisi + (Math.abs(den) > 1e-9 ? clamp(0.5 * (a - d) / den, -0.5, 0.5) : 0);
    this.hauteur = sr2 / lag;
    this.hauteurLisse = this.hauteurLisse > 0 ? Math.exp(lerp(Math.log(this.hauteurLisse), Math.log(this.hauteur), 0.35)) : this.hauteur;
  },
  // de 0 (grave, 85 Hz) a 1 (aigu, 480 Hz)
  aigu() { return this.hauteurLisse > 0 ? clamp(Math.log2(this.hauteurLisse / 85) / 2.5, 0, 1) : 0.5; },
  note() {
    if (!this.voise || !this.hauteurLisse) return "";
    const m = Math.round(69 + 12 * Math.log2(this.hauteurLisse / 440));
    return NOTES_NOMS[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
  },
};

/* ---------------------------------------------------- les modes, les presets, le hasard */

function lireJSONStocke(cle, defaut) { try { return JSON.parse(localStorage.getItem(cle) || "null") || defaut; } catch (e) { return defaut; } }
function ecrireJSONStocke(cle, v) { try { localStorage.setItem(cle, JSON.stringify(v)); } catch (e) { /* stockage refuse : tant pis */ } }

const modes = {
  fondu: {}, enAttente: null, poemeVu: undefined, vu: -1, t: 0, dernierSon: 0, dernierUI: 0, facteur: 1, vitesseEcrite: null, vitesseBase: 1,
  plume: null, dernierMot: 0, etat: "", familles: null,
  memoire: lireJSONStocke(CLE_MODES, {}),
  mes: lireJSONStocke(CLE_PRESETS, []),

  // chaque image, avant les LFO (voir le bas du fichier) : les fondus, la scene en attente, la voix
  maj() {
    if (this.vu === compteur) return;  // une seule fois par image
    if (this.vu === -1) resoudrePresets();  // la premiere image : toutes les scenes sont la
    this.vu = compteur;
    const t = performance.now(), dt = clamp((t - (this.t || t)) / 1000, 0, 0.05);
    this.t = t;
    this.majFondu(t);
    if (poemeCourant !== this.poemeVu) {
      // la fin d'un poeme : la scene (et les lettres) d'un preset qui attendait
      if (this.poemeVu !== undefined && this.enAttente) { const v = this.enAttente; this.enAttente = null; this.poserScene(v, !CONTINUES.has(sceneCle)); }
      this.poemeVu = poemeCourant;
    }
    voix.maj(dt);
    this.voixSurImage(dt);
    if (!panneau.hidden && t - this.dernierUI > 200) { this.dernierUI = t; majModesUI(); dessinerVoix(); }
  },

  // la valeur de reference d'un reglage (sous un LFO : sa base, pas la valeur du moment)
  base(c) { return baseDe(c); },
  glisser(c, a, duree) {
    const de = Number(this.base(c));
    delete this.fondu[c];
    if (de === a || !isFinite(de)) { if (S[c] !== a && !sousModulation(c)) S[c] = a; return; }
    pilote.prendre(c);
    this.fondu[c] = { de, a, t0: performance.now(), d: Math.max(0.05, duree) * 1000, ecrit: null };
  },
  majFondu(t) {
    let sonAFaire = false, fini = false;
    for (const c in this.fondu) {
      const f = this.fondu[c], it = REGLAGE[c];
      // quelqu'un l'a touche entre-temps (un curseur, un stick, le pilote) : il a la main
      if (f.ecrit !== null && this.base(c) !== f.ecrit) { delete this.fondu[c]; continue; }
      const k = lisse((t - f.t0) / f.d);
      let x = k >= 1 ? f.a : lerp(f.de, f.a, k);
      x = it && it.pas >= 1 ? Math.round(x / it.pas) * it.pas : enMarches(c, +x.toFixed(4));
      if (k >= 1) x = f.a;
      poserBase(c, x);
      f.ecrit = x;
      if (c === "volume" || c.startsWith("son")) sonAFaire = true;
      if (k >= 1) { delete this.fondu[c]; fini = true; }
    }
    if (sonAFaire && t - this.dernierSon > 100) { son.reglages(); this.dernierSon = t; }
    if (fini) { sauver(); if (!panneau.hidden) for (const k in controles) controles[k].maj(); }
    else if (!panneau.hidden && Object.keys(this.fondu).length && t - this.dernierUI > 190) for (const c in this.fondu) if (controles[c]) controles[c].maj();
  },
  arreterFondus() { this.fondu = {}; this.enAttente = null; },

  // ce qu'un preset veut, une fois resolu : le socle, ses reglages, la scene qui existe
  cibleDe(p, filtre) {
    const r = Object.assign({}, p.complet === false ? {} : soclePreset(), p.reglages);
    for (const c in p.preferences || {}) if (c in r) { const k = sceneParmi(p.preferences[c], c === "calque"); if (k) r[c] = k; }
    if (!r.scene) delete r.scene;
    if (!r.calque) delete r.calque;
    for (const c in r) if (!(c in DEFAUTS) || filtre.has(c)) delete r[c];
    return r;
  },
  // Poser un preset (ou un tirage du hasard). Les valeurs numeriques glissent ; les choix changent
  // sous un fondu de l'image ; la scene et les lettres changent ensemble, une seule fois.
  poser(p, opt) {
    opt = opt || {};
    const filtre = opt.hasard ? HASARD_JAMAIS : PRESET_JAMAIS;
    const r = this.cibleDe(p, filtre);
    if (!opt.hasard && !S.presetVitesse) delete r.vitesse;
    const d = opt.duree || S.presetFondu, groupe = {}, discrets = {};
    let visuel = false;
    for (const c in r) {
      const v = r[c], it = REGLAGE[c];
      if (SCENE_GROUPE.has(c)) { if (S[c] !== v) groupe[c] = v; continue; }
      if (typeof v === "number" && it && it.type === "curseur" && (it.pas < 1 || GLISSE_ENTIERS.has(c))) { this.glisser(c, v, d); continue; }
      delete this.fondu[c];
      if (this.base(c) === v) continue;
      discrets[c] = v;
      if (!/^(calque|degrade|kaleido|lfo|mod|son|main|battement|kick|caisse|charley|voix)/.test(c)) visuel = true;
    }
    const quand = S.presetScene === "mode" ? (S.mode === "poesie" ? "fin" : "fondu") : S.presetScene;
    const sceneMaintenant = Object.keys(groupe).length && quand !== "fin";
    if (visuel && !sceneMaintenant) photographier();
    for (const c in discrets) {
      if (sousModulation(c) && typeof discrets[c] === "number") { poserBase(c, discrets[c]); pilote.prendre(c); }
      else changer(c, discrets[c]);
    }
    if (Object.keys(groupe).length) {
      if (sceneMaintenant) { this.enAttente = null; this.poserScene(groupe, true); }
      else this.enAttente = Object.assign(this.enAttente || {}, groupe);
    }
    if (!opt.hasard) S.presetCourant = (p.mode || S.mode) + ":" + p.nom;
    sauver();
    if (!panneau.hidden) for (const k in controles) controles[k].maj();
    this.etat = (opt.hasard ? "Hasard" : "« " + p.nom + " »") + (this.enAttente ? " : la scène viendra à la fin du poème." : ".");
    majModesUI(true);
  },
  // la scene et ses lettres, d'un coup (le poeme recommence dans la nouvelle scene, en fondu)
  poserScene(v, photo) {
    Object.assign(S, v);
    for (const c in v) pilote.prendre(c);
    if (photo) photographier();
    if ("espacement" in v) appliquerEspacement();
    mesures.clear();
    if ("scene" in v) sacAuto = [];
    if ("scene" in v || S.scene !== "auto") sceneCle = cleSuivante();
    if (poemeCourant) scene = construire(sceneCle, poemeCourant);
    sauver();
    for (const c in v) if (controles[c]) controles[c].maj();
  },
  voisin(sens) {
    const l = presetsDe(S.mode);
    if (!l.length) return;
    const i = l.findIndex(p => S.presetCourant === p.mode + ":" + p.nom);
    const p = l[((i < 0 ? (sens > 0 ? -1 : 0) : i) + sens + l.length) % l.length];
    this.poser(p);
    annoncer(p.nom.toUpperCase(), "preset " + MODES[S.mode].nom.toLowerCase());
  },
  presetAuHasard() {
    const l = presetsDe(S.mode).filter(p => S.presetCourant !== p.mode + ":" + p.nom);
    if (l.length) { const p = tirer(l); this.poser(p); annoncer(p.nom.toUpperCase(), "preset"); }
  },

  // Changer de mode : sa configuration de base glisse, la scene ne bouge pas (le poeme continue).
  // Ce que Jiiji avait regle dans un mode y revient la fois suivante.
  choisir(m) {
    if (!MODES[m]) return;
    const avant = S.mode, tout = lfo.aSauver();
    if (MODES[avant]) { this.memoire[avant] = {}; for (const c of MODE_CLES) this.memoire[avant][c] = tout[c]; }
    S.mode = m;
    const base = Object.assign({}, MODES[m].base, this.memoire[m] || {});
    if (m === "poesie") base.musiqueSource = "micro";  // la voix passe par le micro, toujours
    if (m === "auto") { const soi = sourceSoi(); if (soi) { base.musiqueSource = soi; base.musique = true; } }
    ecrireJSONStocke(CLE_MODES, this.memoire);
    const voulueMusique = base.musique;
    delete base.musique;
    for (const c in base) {
      const v = base[c], it = REGLAGE[c];
      if (!(c in DEFAUTS)) continue;
      if (typeof v === "number" && it && it.type === "curseur") { this.glisser(c, v, S.presetFondu); continue; }
      if (S[c] === v) continue;
      // la page de la manette n'existe plus (le jeu, 2026-10-19) : une memoire de mode qui la garde
      // encore ne la pose pas
      if (c === "manetteMode") continue;
      changer(c, v);
    }
    // la musique : on l'ecoute si le mode le veut (le son du PC demande un geste et une fenetre de
    // Chrome : seulement si on vient d'appuyer sur un bouton de la page)
    if (voulueMusique && !musique.actif && !musique.branchement) {
      S.musique = true;
      if (S.musiqueSource !== "pc" || navigator.userActivation && navigator.userActivation.isActive) musique.brancher();
    } else if (voulueMusique === false && musique.actif) basculerMusique();
    if (m === "auto" || avant === "auto") cablesAuto(m === "auto");
    sauver();
    for (const k in controles) controles[k].maj();
    majManetteUI();
    this.etat = "Mode " + MODES[m].nom.toLowerCase() + " : " + MODES[m].sous + ".";
    annoncer("MODE " + MODES[m].nom.toUpperCase(), MODES[m].sous);
    majModesUI(true);
  },
  modeVoisin(sens) { const i = MODES_ORDRE.indexOf(S.mode); const n = MODES_ORDRE.length; this.choisir(MODES_ORDRE[(i + sens + n) % n]); },

  // Mes presets : les reglages du moment (leurs bases, pas l'ecart d'un LFO), sauf ce qui est au mode
  enregistrer(nom, mode) {
    const tout = lfo.aSauver(), r = {};
    for (const c in DEFAUTS) if (!PRESET_JAMAIS.has(c)) r[c] = tout[c];
    mode = MODES[mode] ? mode : S.mode;
    const d = new Date(), h = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
    nom = (nom || "").trim() || "Moment de " + h;
    // un nom deja pris dans ce mode : on le remplace (on garde un seul « Mon preset »)
    this.mes = this.mes.filter(p => !(p.mode === mode && p.nom === nom));
    this.mes.push({ nom, mode, reglages: r, complet: false, date: d.toISOString(), description: "Enregistré le " + d.toLocaleDateString("fr-FR") + " à " + h + "." });
    ecrireJSONStocke(CLE_PRESETS, this.mes);
    S.presetCourant = mode + ":" + nom;
    this.etat = "« " + nom + " » gardé dans mes presets (" + MODES[mode].nom.toLowerCase() + ").";
    annoncer("PRESET GARDÉ", nom);
    majModesUI(true);
    return nom;
  },
  effacer(mode, nom) {
    this.mes = this.mes.filter(p => !(p.mode === mode && p.nom === nom));
    ecrireJSONStocke(CLE_PRESETS, this.mes);
    this.etat = "« " + nom + " » effacé.";
    majModesUI(true);
  },

  // Les familles du hasard : une par groupe du panneau (les onglets LFO, Le son mène et Mouvements
  // n'en font qu'une chacun). Construites a la premiere demande : les reglages des autres fichiers
  // (ajouterReglages) y sont deja.
  lesFamilles() {
    if (this.familles) return this.familles;
    const f = [], par = {};
    const famille = (id, nom) => par[id] || (par[id] = f[f.push({ id, nom, cles: [] }) - 1]);
    for (const o of SCHEMA) {
      if (ONGLETS_HORS_HASARD.has(o.onglet) || o.special === "generateur" || o.special === "apropos") continue;
      for (const g of o.groupes || []) {
        if (/^Pilote/.test(g.titre || "") || (o.onglet === "Manette" && g.titre === "Live")) continue;
        for (const it of g.items || []) {
          if (!it.cle || HASARD_JAMAIS.has(it.cle)) continue;
          let id, nom;
          if (it.cle === "scene") { id = "scene"; nom = "La scène"; }
          else if (o.onglet === "Écran de veille") { id = "rythme"; nom = "Le rythme (vitesse, tenue, fondus)"; }
          else if (FAMILLES_FONDUES.has(o.onglet)) { id = o.onglet; nom = o.onglet === "Mouvements" ? "Mouvements des scènes" : o.onglet; }
          else { id = o.onglet + " / " + g.titre; nom = o.onglet === g.titre ? o.onglet : o.onglet + " : " + g.titre.replace(/\s*\(.*\)\s*$/, ""); }
          famille(id, nom).cles.push(it.cle);
        }
      }
    }
    return (this.familles = f);
  },
  verrous() { return new Set(String(S.hasardVerrous || "").split(",").filter(Boolean)); },
  verrouiller(id, oui) {
    const v = this.verrous();
    if (oui) v.add(id); else v.delete(id);
    S.hasardVerrous = [...v].join(","); sauver();
  },
  clesLibres() {
    const v = this.verrous();
    return [].concat(...this.lesFamilles().filter(f => !v.has(f.id)).map(f => f.cles));
  },
  // Le hasard de tout. dose : de 0 (presque rien) a 1 (beaucoup) ; cles : seulement celles-la (le
  // Share d'une page). Pose son tirage comme un preset, en glissant.
  hasard(dose, cles) {
    dose = clamp(dose === undefined ? S.hasardDose : dose, 0.05, 1);
    const liste = (cles || this.clesLibres()).filter(c => REGLAGE[c] && !HASARD_JAMAIS.has(c) && c !== "vieilleTele" && (S.vieilleTele || !VIEILLE_TELE.has(c))), v = {};
    for (const c of liste) tirerReglage(c, dose, v);
    // ma palette : cinq couleurs qui vont ensemble
    if (liste.includes("persoFond") && ((v.palette || S.palette) === "perso") && Math.random() < 0.3 + 0.6 * dose) Object.assign(v, palettePerso());
    // jamais tous les effets a la fois
    const permis = 2 + Math.round(dose * 3);
    const allumes = EFFETS_GPU.filter(c => (c in v ? v[c] : S[c]) > 0.001 && liste.includes(c));
    for (const c of allumes.sort(() => Math.random() - 0.5).slice(permis)) v[c] = 0;
    // la seconde scene n'est jamais la premiere
    if (v.calque && v.calque !== "aucun" && v.calque === (v.scene || S.scene)) v.calque = "aucun";
    if (!Object.keys(v).length) return;
    this.poser({ nom: "hasard", complet: false, reglages: v }, { hasard: true });
  },
  // le Share d'une page : tous ses reglages (la page Live : le hasard de tout)
  hasardPage(page) {
    if (page.cle === "jouer" || page.cle === "presets") { photographier(); this.hasard(); return; }
    const cles = [];
    for (const [mod, couche] of Object.entries(page.couches || {})) {
      if ((page.hasardSauf || []).includes(mod)) continue;
      for (const c of couche) if (c && REGLAGE[c]) cles.push(c);
    }
    for (const c of page.hasardPlus || []) if (REGLAGE[c]) cles.push(c);
    for (const c of cles) { if (!(c in potards.origine)) potards.origine[c] = S[c]; delete potards.retours[c]; }
    // un Share couvre toute la page : presque tous ses reglages sont retires
    this.hasard(Math.max(0.85, S.hasardDose), cles);
  },

  // La voix sur l'image (mode poesie). Rien n'est ecrit dans les reglages : la voix agit sur le temps
  // de l'image (live.vitesse), sur les coups donnes a la carte (main.impact, qui retombent seuls), sur
  // la loupe de la main et sur des mots poses (main.mots).
  voixSurImage(dt) {
    const actif = voix.actif();
    // le temps : la voix fait avancer, le silence ralentit (la manette remet live.vitesse a chaque
    // image ; sans elle, on repart de ce qu'on avait avant de le multiplier)
    const vise = !actif ? 1 : voix.parle ? 1 + S.voixAvance * voix.env * 1.5 : voix.silence > 0.5 ? S.voixSilence : this.facteur;
    this.facteur = lerp(this.facteur, vise, 1 - Math.exp(-dt * (vise > this.facteur ? 5 : 1.2)));
    if (Math.abs(this.facteur - 1) < 0.002 && !actif) this.facteur = 1;
    if (live.vitesse !== this.vitesseEcrite) this.vitesseBase = live.vitesse;
    live.vitesse = this.vitesseBase * this.facteur;
    this.vitesseEcrite = live.vitesse;
    main.voixLoupe = lerp(main.voixLoupe || 0, actif ? voix.env * S.voixGonfle * 0.9 : 0, 1 - Math.exp(-dt * 10));
    if (main.voixLoupe < 0.002) main.voixLoupe = 0;
    if (!actif) return;
    const im = main.impact;
    if (S.voixLumiere > 0) im.halo = Math.max(im.halo, voix.env * 0.6 * S.voixLumiere);
    if (voix.attaque) {
      // une syllabe : les scenes l'entendent comme un temps fort, l'image s'eclaire un instant
      live.coupNeuf = 1;
      if (S.voixLumiere > 0) im.flash = Math.max(im.flash, 0.1 * S.voixLumiere);
    }
    // la hauteur teinte l'image (un decalage des teintes, qui retombe quand la voix se tait)
    if (voix.voise && S.voixTeinte > 0) im.decal = lerp(im.decal, voix.aigu() * 0.3 * S.voixTeinte, 1 - Math.exp(-dt * 4));
    // la voix ecrit : un mot du poeme par syllabe qui attaque (pas plus de quatre par seconde)
    const t = performance.now() / 1000;
    if (S.voixEcrit && voix.attaque && t - this.dernierMot > 0.24) { this.dernierMot = t; this.ecrireMot(); }
    // le silence : les mots dits s'elevent doucement
    if (voix.silence > 0.8) for (const m of main.mots) if (m.voix && !m.fige) m.vy -= 22 * dt;
  },
  ecrireMot() {
    const e = main.prochain();
    if (!e) return;
    const taille = main.taille() * (0.85 + voix.env * 0.5), pol = police(taille), w = mesurer(e.t, pol), esp = mesurer(" ", pol);
    // la plume ecrit de gauche a droite ; un silence (une respiration) ou le bord : a la ligne
    const p = this.plume;
    if (!p || p.x + w > W * 0.9 || voix.silence > 1.2 || this.dernierMot - p.t > 2.5) {
      const y = !p ? H * 0.22 : p.y + taille * 1.7;
      this.plume = { x: W * (0.08 + Math.random() * 0.1), y: y > H * 0.86 ? H * (0.14 + Math.random() * 0.08) : y, t: this.dernierMot };
    }
    const q = this.plume, x = q.x + w / 2, y = q.y + Math.sin(q.x * 0.01) * taille * 0.15;
    q.x += w + esp; q.t = this.dernierMot;
    const P = palette(), h = 225 - 210 * voix.aigu();
    const couleur = S.voixTeinte > 0 && !P.mono ? (P.clair ? "hsl(" + h.toFixed(0) + ",70%,32%)" : "hsl(" + h.toFixed(0) + ",85%,70%)") : null;
    main.poserMot(e, x, y, hasard(-0.04, 0.04), 0, 0.85 + voix.env * 0.5, { voix: true, couleur, vie: Math.max(14, S.mainVie), lueur: 0.5 + voix.env * 0.5 });
    main.voixP = [x / Math.max(1, W), 1 - y / Math.max(1, H)];
  },
};

// une scene parmi une liste de preferences : la premiere qui existe (exacte, ou une RegExp)
function sceneParmi(liste, enCalque) {
  const l = Array.isArray(liste) ? liste : [liste];
  const dispo = (enCalque ? SCENES_CALQUE : SCENES_NOMS).filter(([k]) => !SCENES_BANQUE.has(k));
  for (const x of l) {
    if (x instanceof RegExp) { const t = dispo.find(([k, n]) => k !== "auto" && x.test(k + " " + n)); if (t) return t[0]; }
    else if (dispo.some(([k]) => k === x)) return x;
  }
  return null;
}
function palettePerso() {
  const h = Math.floor(Math.random() * 360), hsl = (a, s, l) => {
    a = ((a % 360) + 360) % 360; s /= 100; l /= 100;
    const f = n => { const k = (n + a / 30) % 12, c = l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1)); return Math.round(c * 255).toString(16).padStart(2, "0"); };
    return "#" + f(0) + f(8) + f(4);
  };
  return { persoFond: hsl(h, 55, 5), persoFond2: hsl(h + 30, 50, 17), persoTexte: hsl(h, 30, 92), persoAccent: hsl(h + 180, 90, 62), persoNote: hsl(h + 20, 25, 60) };
}
// un reglage tire au sort, dans une plage belle ; v recoit la valeur (ou rien s'il ne bouge pas)
function tirerReglage(c, dose, v) {
  const it = REGLAGE[c];
  if (!it || HASARD_JAMAIS.has(c)) return;
  // un peu de hasard (0,2) : un reglage sur dix bouge ; beaucoup (1) : presque tous
  const pChange = 0.06 + 0.88 * dose * dose, change = () => Math.random() < pChange;
  if (it.type === "case") { if (HASARD_CASES.has(c) && Math.random() < 0.08 + 0.25 * dose) v[c] = !S[c]; return; }
  if (it.type === "couleur") return;  // ma palette : les cinq ensemble (modes.hasard)
  if (it.type === "choix") {
    let o = it.options.map(x => x[0]).filter(k => !SCENES_BANQUE.has(k));
    const p = Math.random();
    if (c === "scene") { if (change()) v[c] = tirer([...new Set(ORDRE_AUTO)]); return; }
    if (c === "calque") { if (dose < 0.7 && !change()) return; const s = o.filter(k => k !== "aucun" && k !== "auto"); v[c] = p < 0.12 + 0.35 * dose ? tirer(s) : "aucun"; return; }
    if (c === "degrade") { if (dose < 0.7 && !change()) return; v[c] = p < 0.1 + 0.2 * dose ? tirer(o.filter(k => k !== "aucun")) : "aucun"; return; }
    if (c === "miroir") { if (dose < 0.7 && !change()) return; v[c] = p < 0.05 + 0.15 * dose ? tirer(o.filter(k => k !== "aucun")) : "aucun"; return; }
    if (c === "casse") { if (dose < 0.7 && !change()) return; v[c] = p < 0.12 * dose ? tirer(o) : "normale"; return; }
    if (/^lfo\dCible$/.test(c)) { if (dose < 0.7 && !change()) return; v[c] = p < 0.1 + 0.3 * dose ? tirer(ciblesHasardLfo()) : "aucune"; return; }
    // le calligramme : le plus souvent une famille (chaque forme y passe une fois avant de revenir)
    if (c === "calligramme") { if (change()) v[c] = p < 0.7 ? tirer(["hasard", "apollinaire", "objets", "nature", "volumes"].filter(k => o.includes(k))) || tirer(o) : tirer(o); return; }
    if (c === "calliPlat") { if (change()) v[c] = tirer(["bascule", "bascule", "tourne"].filter(k => o.includes(k))) || tirer(o); return; }
    if (c === "palette") o = o.filter(k => k !== "perso" || dose > 0.7);
    if (c === "fond") o = o.filter(k => k !== "maelstrom");
    // des notes qui frappent, plus de nappes ni de bruits (Jiiji, 2026-10-19 : plus de drone)
    if (c === "sonTimbre") o = o.filter(k => ["poetes", "derive", "boite", "kalimba", "marimba", "pluck", "fmdoux", "clochette", "peau", "corde", "fm"].includes(k));
    if (o.length && change()) v[c] = typeof DEFAUTS[c] === "number" ? Number(tirer(o)) : tirer(o);
    return;
  }
  if (it.type !== "curseur") return;
  let pl = HASARD_PLAGES[c];
  if (!pl && /^mod[A-Z]/.test(c)) pl = /^mod(Saturation|Contraste|Lumiere)$/.test(c) && Math.random() < 0.35 ? [-0.6, -0.2, 0.2] : [0.3, 1.2, 0.18];
  if (!pl && /^lfo\dAmplitude$/.test(c)) pl = [0.05, 0.35];
  if (!pl && /^lfo\dDuree$/.test(c)) pl = [8, 120];
  const e = it.max - it.min, d = DEFAUTS[c];
  // un reglage d'un autre fichier, eteint par defaut : on le traite comme un effet
  if (!pl && typeof d === "number" && d <= it.min + e * 0.02) pl = [it.min + e * 0.1, it.min + e * 0.45, 0.2];
  if (!pl) pl = [Math.max(it.min, d - e * 0.25), Math.min(it.max, d + e * 0.25)];
  let x;
  if (c === "kaleido") { if (dose < 0.7 && !change()) return; x = Math.random() < 0.08 + 0.15 * dose ? tirer([4, 6, 8, 12]) : 0; }
  else if (pl[2] !== undefined) {
    // un effet : allume (dans sa plage) ou eteint ; avec beaucoup de hasard, tous sont retires
    if (dose < 0.7 && !change()) return;
    const on = Math.random() < Math.min(0.95, pl[2] * (0.6 + dose));
    x = on ? hasard(pl[0], pl[1]) : (pl[3] !== undefined ? pl[3] : typeof d === "number" && d >= it.min && d <= it.max && Math.abs(d) < 1e-9 ? 0 : it.min > 0 ? it.min : 0);
  } else {
    if (!change()) return;
    const y = MANETTE_LOG.has(c) && pl[0] > 0 ? pl[0] * Math.pow(pl[1] / pl[0], Math.random()) : hasard(pl[0], pl[1]);
    x = lerp(clamp(Number(modes.base(c)), it.min, it.max), y, 0.45 + 0.55 * dose);
  }
  x = clamp(x, it.min, it.max);
  v[c] = it.pas >= 1 ? Math.round(x / it.pas) * it.pas : +x.toFixed(3);
}
// ce qu'un LFO tire au sort peut faire bouger : jamais le stroboscope ni ce qui clignote, ni un
// reglage d'une famille verrouillee (un LFO le ferait bouger quand meme)
function ciblesHasardLfo() {
  const verrous = modes.verrous(), fermes = new Set([].concat(...modes.lesFamilles().filter(f => verrous.has(f.id)).map(f => f.cles)));
  return Object.keys(LFO_CIBLES).filter(c => !HASARD_JAMAIS.has(c) && !fermes.has(c) && !/^(strobe|negatif|posterisation|kaleido$|mosaique|blocs)/.test(c));
}

/* ---------------------------------------------------- l'onglet Modes du panneau */

function construireModes(page) {
  const fs = (titre, html) => { const f = document.createElement("fieldset"); f.innerHTML = "<legend>" + titre + "</legend>" + (html || ""); page.appendChild(f); return f; };
  const m = fs("Le mode", `<div class="rangee" id="mo-modes"></div><div class="etat-gen" id="mo-etat" style="margin-top:6px">…</div>`);
  for (const k of MODES_ORDRE) {
    const b = document.createElement("button"); b.type = "button"; b.className = "bouton"; b.dataset.mode = k;
    b.textContent = MODES[k].nom; b.title = MODES[k].sous;
    b.addEventListener("click", () => modes.choisir(k));
    m.querySelector("#mo-modes").appendChild(b);
  }
  const p = fs("Les presets du mode", `<div id="mo-presets" style="display:grid;grid-template-columns:1fr 1fr;gap:4px"></div>
    <div class="rangee"><button type="button" class="bouton" id="mo-prec">◀ Précédent</button><button type="button" class="bouton" id="mo-suiv">Suivant ▶</button>
    <button type="button" class="bouton" id="mo-maintenant" hidden>La scène tout de suite</button></div>`);
  p.querySelector("#mo-prec").addEventListener("click", () => modes.voisin(-1));
  p.querySelector("#mo-suiv").addEventListener("click", () => modes.voisin(1));
  p.querySelector("#mo-maintenant").addEventListener("click", () => { const v = modes.enAttente; modes.enAttente = null; if (v) modes.poserScene(v, true); majModesUI(true); });
  for (const c of ["presetFondu", "presetScene", "presetVitesse"]) p.appendChild(construireControle(REGLAGE[c]));
  const mes = fs("Mes presets", `<div class="ligne"><span>Nom</span><input type="text" id="mo-nom" placeholder="(l'heure, si rien)" style="grid-column:2/4"></div>
    <div class="ligne"><span>Pour le mode</span><select id="mo-pour" style="grid-column:2/4">${MODES_ORDRE.map(k => '<option value="' + k + '">' + MODES[k].nom + "</option>").join("")}</select></div>
    <div class="rangee"><button type="button" class="bouton" id="mo-garder">Garder ce moment</button></div><div id="mo-mes" style="margin-top:6px"></div>`);
  mes.querySelector("#mo-garder").addEventListener("click", () => {
    const n = mes.querySelector("#mo-nom"); modes.enregistrer(n.value, mes.querySelector("#mo-pour").value); n.value = "";
  });
  const h = fs("Le hasard de tout (H ; Maj + H : beaucoup ; ! : un peu)", `<div class="rangee"><button type="button" class="bouton" id="mo-peu">Un peu</button>
    <button type="button" class="bouton" id="mo-hasard">Hasard</button><button type="button" class="bouton" id="mo-beaucoup">Beaucoup</button></div>`);
  h.appendChild(construireControle(REGLAGE.hasardDose));
  h.querySelector("#mo-peu").addEventListener("click", () => { photographier(); modes.hasard(0.2); });
  h.querySelector("#mo-hasard").addEventListener("click", () => { photographier(); modes.hasard(); });
  h.querySelector("#mo-beaucoup").addEventListener("click", () => { photographier(); modes.hasard(1); });
  const ver = document.createElement("div");
  ver.innerHTML = '<p style="margin:6px 0 3px;color:#404040">Coché : le hasard n\'y touche pas. Jamais le stroboscope, le volume, la finesse, la source, le mode ni ce qui recharge tout.</p><div id="mo-verrous" style="display:grid;grid-template-columns:1fr 1fr;gap:1px 8px"></div>';
  h.appendChild(ver);
  const v = fs("La voix (mode poésie)", `<div class="etat-gen" id="mo-voix">…</div><canvas class="vumetre" id="mo-vu" width="360" height="40" style="margin-top:6px"></canvas>
    <div class="rangee"><button type="button" class="bouton" id="mo-micro">Écouter le micro</button></div>`);
  v.querySelector("#mo-micro").addEventListener("click", () => {
    if (S.musiqueSource !== "micro") changer("musiqueSource", "micro");
    if (!musique.actif) basculerMusique();
  });
  for (const it of MODES_ITEMS.filter(x => x.cle.startsWith("voix"))) v.appendChild(construireControle(it));
  setTimeout(() => majModesUI(true), 0);
}
let modesUIcle = "";
function majModesUI(force) {
  const etat = document.getElementById("mo-etat");
  if (!etat) return;
  for (const b of document.querySelectorAll("#mo-modes .bouton")) {
    const actif = b.dataset.mode === S.mode;
    b.style.borderColor = actif ? "#000 #fff #fff #000" : ""; b.style.fontWeight = actif ? "bold" : "";
  }
  const fil = (S.pilote ? "pilote allumé" : "pilote éteint") + " · manettes : " + (typeof manette !== "undefined" && manette.actifs ? manette.actifs().length : 0) + " · musique : " +
    (musique.actif ? (S.musiqueSource === "pc" ? "le son du PC" : "le micro") : "débranchée");
  const texte = MODES[S.mode].nom + " : " + MODES[S.mode].sous + ". " + fil + (modes.etat ? "\n" + modes.etat : "");
  if (etat.textContent !== texte) etat.textContent = texte;
  etat.style.whiteSpace = "pre-line";
  const maint = document.getElementById("mo-maintenant");
  if (maint) maint.hidden = !modes.enAttente;
  // les listes ne se reconstruisent que si elles ont change
  const cle = S.mode + "|" + S.presetCourant + "|" + modes.mes.length + "|" + PRESETS[S.mode].length + "|" + S.hasardVerrous + "|" + (modes.familles ? modes.familles.length : 0);
  if (!force && cle === modesUIcle) return;
  modesUIcle = cle;
  const grille = document.getElementById("mo-presets");
  grille.replaceChildren();
  for (const p of PRESETS[S.mode]) {
    const b = document.createElement("button"); b.type = "button"; b.className = "bouton"; b.textContent = p.nom; b.title = p.description || "";
    b.style.textAlign = "left"; b.style.minWidth = "0";
    if (S.presetCourant === p.mode + ":" + p.nom) { b.style.borderColor = "#000 #fff #fff #000"; b.style.fontWeight = "bold"; }
    b.addEventListener("click", () => modes.poser(p));
    grille.appendChild(b);
  }
  const pour = document.getElementById("mo-pour");
  if (pour && document.activeElement !== pour) pour.value = S.mode;
  const liste = document.getElementById("mo-mes");
  liste.replaceChildren();
  if (!modes.mes.length) liste.textContent = "Aucun pour l'instant : règle l'image, puis « Garder ce moment » .";
  for (const p of modes.mes.slice().sort((a, b) => MODES_ORDRE.indexOf(a.mode) - MODES_ORDRE.indexOf(b.mode))) {
    const r = document.createElement("div"); r.className = "rangee"; r.style.marginTop = "2px";
    const n = document.createElement("span"); n.style.flex = "1"; n.textContent = p.nom + " (" + MODES[p.mode].nom.toLowerCase() + ")";
    if (S.presetCourant === p.mode + ":" + p.nom) n.style.fontWeight = "bold";
    const a = document.createElement("button"); a.type = "button"; a.className = "bouton"; a.textContent = "Rappeler"; a.style.minWidth = "0";
    a.addEventListener("click", () => { if (p.mode !== S.mode) modes.choisir(p.mode); modes.poser(p); });
    const e = document.createElement("button"); e.type = "button"; e.className = "bouton"; e.textContent = "Effacer"; e.style.minWidth = "0";
    // deux clics pour effacer (pas de fenetre de confirmation : elle s'ouvrirait sur la projection)
    e.addEventListener("click", () => {
      if (e.dataset.sur) { modes.effacer(p.mode, p.nom); return; }
      e.dataset.sur = "1"; e.textContent = "Sûr ?"; setTimeout(() => { delete e.dataset.sur; e.textContent = "Effacer"; }, 3000);
    });
    r.append(n, a, e); liste.appendChild(r);
  }
  const ver = document.getElementById("mo-verrous");
  ver.replaceChildren();
  const verrous = modes.verrous();
  for (const f of modes.lesFamilles()) {
    const lab = document.createElement("label"); lab.style.display = "flex"; lab.style.gap = "4px"; lab.style.alignItems = "center";
    const cb = document.createElement("input"); cb.type = "checkbox"; cb.checked = verrous.has(f.id);
    cb.addEventListener("change", () => modes.verrouiller(f.id, cb.checked));
    lab.title = f.cles.map(court).join(", ");
    lab.append(cb, document.createTextNode(f.nom));
    ver.appendChild(lab);
  }
}
// le vumetre de la voix : l'enveloppe, la lampe des syllabes, la hauteur
function dessinerVoix() {
  const c = document.getElementById("mo-vu"), el = document.getElementById("mo-voix");
  if (!c || c.offsetParent === null) return;
  const g = c.getContext("2d"), w = c.width, h = c.height;
  g.fillStyle = "#000"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#222"; g.fillRect(8, 8, w - 120, 10); g.fillRect(8, 24, w - 120, 8);
  g.fillStyle = "hsl(" + (225 - 210 * voix.aigu()).toFixed(0) + ",85%,60%)"; g.fillRect(8, 8, (w - 120) * voix.env, 10);
  g.fillStyle = "#666"; g.fillRect(8, 24, (w - 120) * clamp(voix.debit / 6, 0, 1), 8);
  g.fillStyle = performance.now() / 1000 - voix.derniereAttaque < 0.12 ? "#fff" : "#333";
  g.beginPath(); g.arc(w - 100, h / 2, 8, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#aaa"; g.font = "bold 11px Consolas, monospace"; g.textAlign = "right"; g.textBaseline = "middle";
  g.fillText(voix.voise ? Math.round(voix.hauteurLisse) + " Hz " + voix.note() : voix.parle ? "souffle" : "silence", w - 4, h / 2);
  g.textAlign = "left";
  if (el) {
    const t = !voix.actif() ? (S.mode !== "poesie" ? "La voix ne compte qu'en mode poésie." : "Le micro n'est pas écouté : « Écouter le micro » (ou M).")
      : voix.parle ? "La voix parle · " + voix.debit.toFixed(1) + " syllabes par seconde" + (voix.voise ? " · " + voix.note() : "")
      : "Silence depuis " + voix.silence.toFixed(1) + " s : l'image respire.";
    if (el.textContent !== t) el.textContent = t;
  }
}

/* ---------------------------------------------------- scene : le karaoke */

// Jiiji : « je peux meme faire du karaoke ». Le vers en cours en grand, lisible de loin ; ses mots
// s'allument un a un sur le tempo de la musique (un par temps, deux par temps pour un long vers) ou,
// en mode poesie, sur les syllabes de la voix au micro ; sans musique ni voix, a la mesure du poeme.
// Le vers suivant attend en dessous, petit et pale ; celui d'avant s'efface au-dessus. Rien d'autre
// que les vers sur l'image : belle aussi en seconde scene d'un combo.
class SceneKaraoke {
  constructor(poeme) {
    this.poeme = poeme; this.t = performance.now() / 1000;
    this.vers = versDe(poeme).map(v => ({ poete: v.poete, mots: v.texte.split(/\s+/).filter(Boolean).map(m => casse(m)) })).filter(v => v.mots.length);
    const nm = this.vers.reduce((a, v) => a + v.mots.length, 0);
    // en vraies secondes (la vitesse generale ne ralentit pas la lecture) ; le poeme doit tenir dans
    // poemeMax, sinon il serait coupe avant la fin
    const n = Math.max(1, nm + this.vers.length * 2);
    this.mesure = clamp(Math.max(S.tenue, tenueMin) / n, 0.35, 1.2);
    if (S.poemeMax < 600) this.mesure = Math.max(0.3, Math.min(this.mesure, S.poemeMax * 0.9 / n));
    this.iv = 0; this.allumes = 0; this.quand = []; this.attente = 0.8; this.passe = this.t - 9; this.fin = null; this.dispo = new Map();
    if (!this.vers.length) this.fin = 0;
    if (!enCalque) montrerCartel(poeme);
  }
  // la mise en page d'un vers a une echelle : une ligne, deux si le vers est trop long ; mise en cache
  disposer(iv, echelle) {
    echelle = Math.round(echelle * 50) / 50;  // quelques tailles seulement pendant la montee (cache)
    const k = iv + "|" + echelle + "|" + W + "|" + S.police + "|" + S.taille;
    let d = this.dispo.get(k);
    if (d) return d;
    const v = this.vers[iv], tailleMax = H * 0.13 * clamp(S.taille, 0.5, 1.6) * echelle;
    const largeur = (mots, fs) => mots.reduce((a, m) => a + mesurer(m, police(fs)), 0) + mesurer(" ", police(fs)) * 1.35 * (mots.length - 1);
    let lignes = [v.mots], fs = Math.min(tailleMax, tailleMax * W * 0.86 / Math.max(1, largeur(v.mots, tailleMax)));
    if (fs < tailleMax * 0.55 && v.mots.length > 3) {
      const h = Math.ceil(v.mots.length / 2);
      lignes = [v.mots.slice(0, h), v.mots.slice(h)];
      fs = Math.min(tailleMax, ...lignes.map(l => tailleMax * W * 0.86 / Math.max(1, largeur(l, tailleMax))));
    }
    const pol = police(fs), esp = mesurer(" ", pol) * 1.35, places = [];  // un peu plus d'air : lisible de loin
    lignes.forEach((l, j) => {
      let x = W / 2 - largeur(l, fs) / 2;
      for (const m of l) { const w = mesurer(m, pol); places.push({ m, x: x + w / 2, dy: (j - (lignes.length - 1) / 2) * fs * 1.15 }); x += w + esp; }
    });
    d = { fs, places, haut: lignes.length * fs * 1.15 };
    this.dispo.set(k, d);
    return d;
  }
  allumer() {
    const v = this.vers[this.iv];
    if (!v) return;
    if (this.allumes < v.mots.length) { this.allumes++; this.quand[this.allumes - 1] = this.t; this.attente = this.mesure; return; }
    // le vers est dit : le suivant monte
    this.iv++; this.allumes = 0; this.quand = []; this.passe = this.t; this.attente = this.mesure * 1.5;
    if (this.iv >= this.vers.length) this.fin = this.t;
  }
  maj() {
    const rt = performance.now() / 1000, dt = clamp(rt - this.t, 0, 0.1);
    this.t = rt;
    if (this.fin !== null) { if (this.t - this.fin > 0.4 && !enCalque) montrerCartel(null); return this.t - this.fin > 1.6; }
    const r = rythme(), v = this.vers[this.iv];
    const parVoix = S.mode === "poesie" && voix.actif();
    this.attente -= dt;
    if (parVoix) {
      // une syllabe, un mot ; un long silence finit le vers
      if (voix.attaque) this.allumer();
      else if (voix.silence > 2.5 && this.allumes > 0 && this.allumes >= v.mots.length) this.allumer();
    } else if (r.on && musique.bpm) {
      // un mot par temps ; un vers long : deux par temps (le demi-temps)
      const ph = musique.phase || 0, demi = v.mots.length > 8;
      const franchi = Math.floor(ph * (demi ? 2 : 1)) !== Math.floor((this.phaseAvant === undefined ? ph : this.phaseAvant) * (demi ? 2 : 1));
      this.phaseAvant = ph;
      if (franchi || this.attente < -this.mesure * 3) this.allumer();
    } else if (this.attente <= 0) this.allumer();
    return false;
  }
  dessiner() {
    const P = palette(), t = this.t;
    ctx.save();
    // la montee d'un vers a l'autre, sur une demi-seconde
    const m = sortie3((t - this.passe) / 0.55);
    const ecrire = (iv, echelle, y, alpha, allumes, quand) => {
      if (iv < 0 || iv >= this.vers.length || alpha <= 0.01) return;
      const d = this.disposer(iv, echelle), poete = this.vers[iv].poete;
      // les mots battent sur le kick (battementMots, dans poserLettre et ecrireGrand) : ici au quart
      // seulement, sinon ils se chevauchent et le vers ne se lit plus de loin
      const kb = battementMots(d.fs <= PALIERS[PALIERS.length - 1] ? 0.16 : 0.08), doux = (1 + (kb - 1) * 0.25) / kb;
      d.places.forEach((p, i) => {
        const allume = i < allumes, age = allume && quand[i] !== undefined ? t - quand[i] : 9;
        const s = (allume ? 1 + 0.1 * (1 - sortie3(age / 0.35)) : 1) * doux;
        const coul = allume ? (age < 0.6 ? P.accent : couleurDe({ poete, ordre: iv }, 10)) : P.texte;
        ecrireGrand(p.m, d.fs * s, coul, p.x, y + p.dy, 0, alpha * (allume ? 1 : 0.38));
      });
    };
    const yc = H * 0.5, yh = H * 0.24, yb = H * 0.76;
    const cour = this.disposer(Math.min(this.iv, this.vers.length - 1), 1);
    // le vers d'avant monte et s'efface ; le vers en cours vient d'en bas en grandissant
    ecrire(this.iv - 1, 1 - 0.35 * m, lerp(yc, yh - cour.haut * 0.2, m), (1 - m) * 0.9 + 0.12 * m * clamp(1 - (t - this.passe) / 6, 0, 1), 99, []);
    if (this.fin === null) ecrire(this.iv, lerp(0.55, 1, m), lerp(yb, yc, m), lerp(0.45, 1, m), this.allumes, this.quand);
    ecrire(this.iv + 1, 0.55, lerp(yb + H * 0.12, yb, m), 0.45 * m, 0, []);
    ctx.restore();
  }
}
ajouterScene({ cle: "karaoke", nom: "Karaoké (le vers en grand, mot à mot)", fabrique: p => new SceneKaraoke(p), calme: true, auto: false });
PRESETS.push(
  P("poesie", "Karaoké", "Le vers en grand, ses mots s'allument à chaque syllabe dite au micro ; rien d'autre.",
    { scene: "karaoke", palette: "nuit", police: "Georgia", fond: "degrade", trainees: 0, tremblement: 0, lueur: 0.1, halo: 0.25, seuilHalo: 0.5,
      voixEcrit: false, voixGonfle: 0.3, voixTeinte: 0.3, voixLumiere: 0.3, voixAvance: 0 }),
  P("vjing", "Karaoké", "Le vers en grand sur le tempo, un mot par temps ; les crêtes du spectre derrière.",
    { scene: "karaoke", calque: "cretes", calquePlace: "derriere", calqueMelange: "ecran", calqueOpacite: 0.45, calqueMouvement: "aucun",
      calquePoeme: "autre", palette: "neon", police: "Impact", fond: "degrade", trainees: 0, tremblement: 0, halo: 0.5, seuilHalo: 0.4 },
    M("Halo", 0.4, "kick")),
);

// chaque image, juste avant les LFO (apres la manette, la musique et le pilote). A integrer dans
// image() (orchestre.js) par un appel modes.maj() avant lfo.maj() ; en attendant, on passe par lfo.maj
// (modes.maj ne tourne qu'une fois par image, meme appele deux fois).
{
  const lfoMajAvant = lfo.maj;
  lfo.maj = function () { try { modes.maj(); } catch (e) { console.error(e); } return lfoMajAvant.apply(this, arguments); };
}
