"use strict";
/* ================================================================ les cables : tout est lie (CV) */

// Jiiji (2026-10-18) : « je reboucle le son des mots en entree, du coup chaque mot quand il fait un
// son fait bouger tout le reste, c'est le genre de mecanique qui est super », puis « le mode full
// auto : on regarde et on kiffe, il se genere tout seul avec des CV, les mots font les sons, les
// sons font des mots, tout est lie ».
//
// Les cables sont une matrice de modulation, comme sur un synthe modulaire : une SOURCE (une valeur
// qui bouge : les notes qui partent, les mots qui paraissent, les vers, la musique, la voix, les LFO,
// des generateurs a nous) est reliee a une DESTINATION (un curseur de l'image, une entree du son
// (son.cv), ou un geste partage : les mots gonflent, la carte recoit un coup), avec une quantite
// (positive ou negative) et un lissage.
//
// - Huit cables a la main (onglet Cables). En mode full auto (S.mode "auto"), des PATCHS nommes se
//   branchent et se debranchent d'eux-memes, en fondu de 30 s, un toutes les cvRythme minutes, en
//   suivant l'energie du pilote : le pilote mene scenes et presets, les cables menent les liaisons.
//   Jamais plus de deux patchs a la fois (celui qui part, celui qui vient) : jamais le chaos.
// - Une modulation s'ajoute autour de la valeur reglee (sa base) sans l'ecraser, comme lfo.maj : si
//   quelqu'un d'autre change le reglage (curseur, pilote, manette, preset, LFO), la base bouge
//   d'autant ; debranche, le reglage retrouve sa base. On enregistre la base, pas la valeur du moment.
// - Les sons font des mots : sur chaque note (evenement "note" du bus), le mot qui chante se rallume
//   la ou il a paru et gonfle, ou eclate en lettres, ou un mot rare du poeme surgit a la place de la
//   note (sa hauteur, sa place a gauche ou a droite). Tout passe par ce qui est partage (la main de la
//   manette : main.poserMot, ses eclats, ses anneaux ; les coups de la carte : main.impact) : rien
//   dans les scenes des autres.
// - Jamais le stroboscope, le negatif, le volume, la finesse, la source. Rien ne s'ecrit sur l'image.
//
// Pour les autres fichiers : cv.val[source] (toutes les sources, de 0 a 1 ou de -1 a 1), cv.base(cle)
// (la valeur reglee d'un curseur sous un cable), cv.eclat(texte) (de 0 a 1 : ce mot vient de
// chanter ; une scene peut s'en servir pour allumer ses lettres), cv.tirerPatch(), cv.patch().

const CV_NB = 8;
// [cle, nom affiche, bipolaire (de -1 a 1) ou non (de 0 a 1)]
const CV_SOURCES = [
  ["noteEnv", "Les notes : chaque note qui part (enveloppe)", false],
  ["noteHauteur", "Les notes : hauteur (grave ↔ aigu)", false],
  ["noteDegre", "Les notes : degré dans la gamme", false],
  ["noteVel", "Les notes : vélocité", false],
  ["noteTimbre", "Les notes : timbre (une valeur par synthé)", false],
  ["notePan", "Les notes : place (gauche ↔ droite)", true],
  ["noteDensite", "Les notes : densité (notes par seconde)", false],
  ["motEnv", "Les mots : chaque mot qui paraît", false],
  ["motRare", "Les mots : rareté à la Bourse", false],
  ["motPoete", "Les mots : le poète (un par valeur)", false],
  ["motX", "Les mots : position (gauche ↔ droite)", true],
  ["motY", "Les mots : position (bas ↔ haut)", true],
  ["motLongueur", "Les mots : longueur", false],
  ["motDensite", "Les mots : densité (mots par seconde)", false],
  ["versEnv", "Les vers : chaque vers qui commence", false],
  ["bascule", "Les vers : bascule (change à chaque vers)", true],
  ["avancee", "Le poème : avancée (début ↔ fin)", false],
  ["arche", "Le poème : arche (s'ouvre au milieu)", false],
  ["forme", "Le poème : sa forme (sonnet, pantoum…)", false],
  ["basses", "La musique : basses", false],
  ["mediums", "La musique : médiums", false],
  ["aigus", "La musique : aigus", false],
  ["kick", "La musique : kick", false],
  ["caisse", "La musique : caisse claire", false],
  ["charley", "La musique : charley", false],
  ["volume", "La musique : volume", false],
  ["tempo", "La musique : tempo", false],
  ["mesure", "La musique : vague d'une mesure", false],
  ["voixEnv", "La voix : force", false],
  ["voixAigu", "La voix : hauteur (grave ↔ aigu)", false],
  ["voixDebit", "La voix : débit (syllabes par seconde)", false],
  ["voixSyllabe", "La voix : chaque syllabe", false],
  ["voixSilence", "La voix : le silence qui dure", false],
  ["lfo1", "LFO 1 (onglet LFO)", true], ["lfo2", "LFO 2 (onglet LFO)", true], ["lfo3", "LFO 3 (onglet LFO)", true],
  ["lfo4", "LFO 4 (onglet LFO)", true], ["lfo5", "LFO 5 (onglet LFO)", true], ["lfo6", "LFO 6 (onglet LFO)", true],
  ["energie", "Le pilote : énergie du moment", false],
  ["lent1", "Vague lente (41 s)", true],
  ["lent2", "Houle (2 min 30)", true],
  ["lent3", "Marée (9 min)", true],
  ["hasardNote", "Hasard échantillonné à chaque note", true],
  ["hasardTemps", "Hasard échantillonné tous les deux temps", true],
  ["marche", "Marche aléatoire", true],
  ["marches", "Marche aléatoire en cinq marches (quantifiée)", true],
  ["compteur", "Pas à pas (une marche par note, huit pas)", false],
  ["suiveur", "Suiveur d'enveloppe (notes, mots et kick ensemble)", false],
  ["envLente", "Enveloppe lente (les mots l'emplissent, elle se vide en 8 s)", false],
  ["porte", "Porte : un son et un mot en même temps", false],
  ["comparateur", "Comparateur : plus fort que d'habitude", false],
  // 2026-10-19 : la manette (mode jeu), ses gestes comme sources
  ["mainGeste", "La manette : chaque geste (rond, carré, triangle…)", false],
  ["mainVitesse", "La manette : la main qui court", false],
  ["mainX", "La manette : la main (gauche ↔ droite)", true],
  ["mainY", "La manette : la main (bas ↔ haut)", true],
  ["mainGachettes", "La manette : les gâchettes", false],
  // les memes, ramenees de 0 a 1 (« + ») : une vague qui ne fait que monter, pour un reglage pose
  // a zero (le halo, les teintes) que la moitie basse de l'onde laissait immobile
  ["lent1+", "Vague lente (41 s), de 0 à 1", false], ["lent2+", "Houle (2 min 30), de 0 à 1", false], ["lent3+", "Marée (9 min), de 0 à 1", false],
  ["marche+", "Marche aléatoire, de 0 à 1", false], ["hasardTemps+", "Hasard tous les deux temps, de 0 à 1", false],
  ["motX+", "Les mots : position (gauche → droite), de 0 à 1", false], ["motY+", "Les mots : position (bas → haut), de 0 à 1", false],
  ["notePan+", "Les notes : place (gauche → droite), de 0 à 1", false],
  ["mainX+", "La manette : la main (gauche → droite), de 0 à 1", false], ["mainY+", "La manette : la main (bas → haut), de 0 à 1", false],
  ["lfo1+", "LFO 1, de 0 à 1", false], ["lfo2+", "LFO 2, de 0 à 1", false], ["lfo3+", "LFO 3, de 0 à 1", false],
  ["lfo4+", "LFO 4, de 0 à 1", false], ["lfo5+", "LFO 5, de 0 à 1", false], ["lfo6+", "LFO 6, de 0 à 1", false],
];
const CV_BIPOLAIRE = new Set(CV_SOURCES.filter(x => x[2]).map(x => x[0]));
// en mode auto sans musique dehors, une source de la musique se tait : le patch prend a la place ce
// que l'ecran joue lui-meme (sa propre boucle : les notes, les mots)
const CV_SANS_MUSIQUE = { basses: "suiveur", mediums: "motEnv", aigus: "noteHauteur", kick: "noteEnv", caisse: "motEnv", charley: "hasardTemps",
  volume: "suiveur", tempo: "noteDensite", mesure: "lent1" };
// les gestes partages (pas des reglages) : [cle, nom, champ de main.impact, echelle]
const CV_GESTES = [
  ["gonfle", "Les mots gonflent (toutes les scènes)"],
  ["coupHalo", "Coup de lumière (halo)", "halo", 1.4],
  ["coupRvb", "Coup : les couleurs se décollent", "rvb", 1.8],
  ["coupOndes", "Coup : l'image ondule", "ondes", 1.3],
  ["coupFonte", "Coup : l'image fond", "fonte", 0.9],
  ["coupDecal", "Coup : les teintes tournent", "decal", 0.6],
  ["coupFlash", "Coup : éclair (doux)", "flash", 0.45],
  // l'onde de choc ne part que sur un temps fort de la musique : sans musique, le reglage « choc »
  // ne faisait rien. Ce geste lance sa propre onde a chaque attaque de la source (2026-10-19)
  ["coupChoc", "Coup : une onde de choc part du centre", "choc", 1.6],
];
// jamais : le stroboscope, le negatif (ca clignote), le volume, la finesse, la source
const CV_JAMAIS = new Set(["strobe", "strobeFreq", "negatif", "volume", "qualite", "source"]);

// Les patchs du mode auto : [source, destination, quantite, lissage]. humeur : "calme" (intro,
// cassure, fin, peu d'energie), "plein" (montee, drop, plateau), "tout". si : une condition (le patch
// ne vient que si elle est vraie). Une destination absente (une scene pas chargee) ou que Jiiji vient
// de toucher est sautee ; il faut au moins deux cables pour qu'un patch passe.
const CV_PATCHS = [
  { nom: "La note gonfle le mot", humeur: "tout", cables: [["noteEnv", "gonfle", 0.9, 0.05], ["noteVel", "lueur", 0.25, 0.2],
    ["noteHauteur", "decalage", 0.06, 0.6], ["noteEnv", "coupHalo", 0.3, 0.05]] },
  { nom: "La rareté ouvre le filtre", humeur: "calme", cables: [["motRare", "sonFiltre", 0.55, 0.4], ["motRare", "halo", 0.3, 0.4],
    ["motLongueur", "sonTenue", 0.3, 0.3], ["envLente", "sonReverb", 0.25, 0.5]] },
  { nom: "Le kick fait tourner le kaléidoscope", humeur: "plein", si: () => S.kaleido > 1, cables: [["kick", "kaleidoTourne", 0.5, 0.05],
    ["kick", "coupRvb", 0.45, 0.05], ["basses", "saturation", 0.2, 0.2], ["mesure", "kaleidoSpirale", 0.3, 0.3]] },
  { nom: "Les poètes changent la lumière", humeur: "calme", cables: [["motPoete", "decalage", 0.12, 0.8], ["motPoete", "sonChorus", 0.4, 0.6],
    ["versEnv", "exposition", 0.08, 0.5], ["motX", "sonRespire", 0.3, 0.4]] },
  { nom: "La houle", humeur: "calme", cables: [["lent2", "respiration", 0.4, 0], ["lent3", "trainees", 0.2, 0],
    ["marche", "ondulation", 0.25, 0.3], ["lent1", "sonReverb", 0.25, 0]] },
  { nom: "Échantillons", humeur: "tout", cables: [["hasardNote", "rotationMots", 0.12, 0.4], ["marches", "sonBalayage", 0.4, 0.2],
    ["hasardTemps", "coupDecal", 0.4, 0.1], ["hasardNote", "decalage", 0.08, 0.5]] },
  // (2026-10-19 : grain et vignette sont des effets vieille tele, eteints par la carte sans la case
  // vieilleTele : ces trois cables ne faisaient rien. Remplaces par le tremblement, des ondes, la lumiere)
  { nom: "La densité trouble l'image", humeur: "plein", cables: [["motDensite", "tremblement", 0.3, 0.5], ["noteDensite", "glitch", 0.25, 0.5],
    ["suiveur", "coupOndes", 0.45, 0.1], ["noteDensite", "sonEcho", 0.25, 0.5]] },
  { nom: "Le vers respire", humeur: "calme", cables: [["arche", "exposition", 0.1, 0.5], ["arche", "sonDensite", 0.3, 0.5],
    ["bascule", "rotationMots", 0.06, 1], ["versEnv", "gonfle", 0.4, 0.3]] },
  { nom: "Le larsen des notes", humeur: "plein", cables: [["noteEnv", "coupOndes", 0.6, 0.05], ["noteHauteur", "sonBalayage", 0.5, 0.2],
    ["noteVel", "coupFlash", 0.35, 0.05], ["noteDensite", "larsen", 0.12, 0.6]] },
  { nom: "Quand ils se rencontrent", humeur: "tout", cables: [["porte", "coupHalo", 0.8, 0.1], ["comparateur", "contraste", 0.12, 0.3],
    ["suiveur", "gonfle", 0.5, 0.2], ["porte", "sonBruits", 0.3, 0.2]] },
  { nom: "Le pas à pas", humeur: "plein", cables: [["compteur", "decalage", 0.18, 0], ["compteur", "sonFiltre", 0.3, 0.1],
    ["noteEnv", "gonfle", 0.5, 0.05], ["kick", "coupRvb", 0.3, 0.05]] },
  { nom: "La musique tient les mots", humeur: "plein", si: () => S.musique && musique.actif, cables: [["basses", "gonfle", 0.5, 0.05],
    ["caisse", "coupRvb", 0.4, 0.05], ["charley", "coupOndes", 0.35, 0.1], ["volume", "sonReverb", -0.3, 0.5]] },
  { nom: "Nuit lente", humeur: "calme", cables: [["lent3", "halo", 0.25, 0], ["marche", "exposition", -0.1, 0.3],
    ["motRare", "lueur", 0.3, 0.5], ["lent2", "sonFiltre", 0.3, 0]] },
  { nom: "Les mots font l'écho", humeur: "tout", cables: [["motEnv", "sonEcho", 0.3, 0.3], ["motDensite", "sonReverb", -0.3, 0.5],
    ["motLongueur", "sonTenue", 0.3, 0.3], ["motEnv", "coupHalo", 0.35, 0.05]] },
  { nom: "La voix mène", humeur: "tout", si: () => (S.mode || "vjing") === "poesie", cables: [["voixEnv", "halo", 0.35, 0.1],
    ["voixAigu", "decalage", 0.12, 0.4], ["voixSyllabe", "gonfle", 0.7, 0.05], ["voixDebit", "sonDensite", 0.3, 0.4]] },
];

/* ---------------------------------------------------- le generateur de patchs (2026-10-19) */

// Jiiji : « j'aimerais bien que les patchs de modulation soient generatifs pour tous les modes, et
// que ce soit fonctionnel ». Les quinze patchs ecrits restent ; a cote, un generateur fabrique a
// chaque fois un patch neuf de 2 a 5 cables, selon une grammaire de ce qui va bien ensemble :
// - une source RAPIDE (une note, un kick, une syllabe : une attaque puis rien) frappe : halo,
//   gonfle, eclair, onde de choc ;
// - une source LENTE (energie, densite, rarete, LFO, vague) fait glisser : teintes, saturation,
//   vitesse, ondulation, respiration ;
// - une HAUTEUR (la note, la voix, la place d'un mot, la main) va a ce qui a une place ou une
//   couleur : teintes, vivacite, inclinaison des mots.
// Seules les sources vivantes dans le mode du moment sont tirees (une source qui n'a pas bouge
// depuis une minute est morte : pas de voix sans micro, pas de kick sans musique), et seules les
// destinations qui changent l'image d'elles-memes (celles qui demandent un autre reglage allume,
// le kaleidoscope pour le faire tourner, ne viennent que si ce reglage l'est deja).

// les sources : [genre, famille (pour le mode), sujet du nom, pluriel]
const CV_GRAM_SRC = {
  noteEnv: ["rapide", "notes", "chaque note"], motEnv: ["rapide", "mots", "chaque mot"], versEnv: ["rapide", "mots", "chaque vers"],
  voixSyllabe: ["rapide", "voix", "les syllabes", 1], kick: ["rapide", "musique", "le kick"], caisse: ["rapide", "musique", "la caisse claire"],
  charley: ["rapide", "musique", "le charley"], porte: ["rapide", "notes", "la rencontre d'un son et d'un mot"], suiveur: ["rapide", "notes", "l'élan"],
  comparateur: ["rapide", "musique", "le trop-plein"], mainGeste: ["rapide", "manette", "le geste"],
  energie: ["lent", "tout", "l'énergie"], noteDensite: ["lent", "notes", "la pluie de notes"], motDensite: ["lent", "mots", "le flot des mots"],
  motRare: ["lent", "mots", "la rareté"], envLente: ["lent", "mots", "la mémoire des mots"], avancee: ["lent", "mots", "le poème qui avance"],
  arche: ["lent", "mots", "l'arche du poème"], basses: ["lent", "musique", "les basses", 1], mediums: ["lent", "musique", "les médiums", 1],
  aigus: ["lent", "musique", "les aigus", 1], volume: ["lent", "musique", "le volume"], mesure: ["lent", "musique", "la mesure"],
  voixEnv: ["lent", "voix", "la voix"], voixDebit: ["lent", "voix", "le débit de la voix"], voixSilence: ["lent", "voix", "le silence"],
  lent1: ["lent", "lent", "la vague"], lent2: ["lent", "lent", "la houle"], lent3: ["lent", "lent", "la marée"], marche: ["lent", "lent", "l'errance"],
  hasardTemps: ["lent", "lent", "le hasard"], motPoete: ["lent", "mots", "le poète"], mainGachettes: ["lent", "manette", "les gâchettes", 1],
  mainVitesse: ["lent", "manette", "la course de la main"],
  lfo1: ["lent", "lfo", "l'oscillateur"], lfo2: ["lent", "lfo", "l'oscillateur"], lfo3: ["lent", "lfo", "l'oscillateur"],
  lfo4: ["lent", "lfo", "l'oscillateur"], lfo5: ["lent", "lfo", "l'oscillateur"], lfo6: ["lent", "lfo", "l'oscillateur"],
  noteHauteur: ["hauteur", "notes", "la hauteur des notes"], noteDegre: ["hauteur", "notes", "le degré de la gamme"],
  notePan: ["hauteur", "notes", "la place des notes"], motX: ["hauteur", "mots", "la place des mots"], motY: ["hauteur", "mots", "la hauteur des mots"],
  voixAigu: ["hauteur", "voix", "la hauteur de la voix"], mainX: ["hauteur", "manette", "la main"], mainY: ["hauteur", "manette", "la main qui monte"],
};
// celles qui vivent toujours (des horloges a nous) : jamais declarees mortes
const CV_TOUJOURS = new Set(["lent1", "lent2", "lent3", "marche", "hasardTemps", "avancee", "arche"]);
// le poids de chaque famille de sources selon le mode (Jiiji : poesie, la voix et les syllabes ;
// VJing, la musique et le kick ; jeu, la manette ; auto, tout)
const CV_MODE_SOURCES = {
  poesie: { voix: 3, mots: 2, lent: 1, lfo: 0.6, notes: 0.6, musique: 0.2, manette: 0.2, tout: 1 },
  vjing: { musique: 3, notes: 1, mots: 0.8, lent: 0.8, lfo: 0.8, voix: 0.2, manette: 0.3, tout: 1.5 },
  jeu: { manette: 3, notes: 1.2, mots: 1, lent: 1, lfo: 0.8, musique: 1, voix: 0.3, tout: 1 },
  auto: { musique: 1, notes: 1.2, mots: 1.2, lent: 1, lfo: 0.8, voix: 1, manette: 1, tout: 1 },
};
// Les destinations : g, les genres qu'elles acceptent (frappe, glisse, place) ; douce, permise en
// poesie et au calme ; a, l'ecart qui se voit sans casser la lecture (dans l'unite du reglage ; pour
// un geste, la force du coup ; rel : en part de la valeur reglee) ; sens 1 : vers le haut seulement
// (ces reglages valent 0 au repos) ; lent : dans la cle des vignettes de mots (jamais en coups :
// chaque marche redessine les lettres) ; si : ce qu'il faut deja d'allume (sinon la destination
// n'est pas tiree : on ne pose pas un kaleidoscope ou un larsen pour avoir de quoi le faire tourner,
// ca changerait toute l'image) ; pos, neg : ce que le nom dit selon le sens.
const CV_GRAM_DST = {
  gonfle: { g: "frappe", douce: 1, a: [0.55, 1], pos: ["fait|font gonfler les mots", "donne|donnent du souffle aux mots"], neg: ["écrase|écrasent les mots"] },
  coupHalo: { g: "frappe", douce: 1, a: [0.45, 0.9], pos: ["allume|allument la lumière", "fait|font jaillir la lumière"] },
  coupFlash: { g: "frappe", a: [0.35, 0.7], pos: ["fait|font éclater la lumière", "lance|lancent des éclairs"] },
  coupRvb: { g: "frappe", a: [0.35, 0.7], pos: ["décolle|décollent les couleurs", "dédouble|dédoublent les couleurs"] },
  coupOndes: { g: "frappe", douce: 1, a: [0.4, 0.8], pos: ["fait|font frémir l'image", "ride|rident l'image"] },
  coupFonte: { g: "frappe", a: [0.3, 0.55], pos: ["fait|font fondre l'image"] },
  coupDecal: { g: "frappe place", douce: 1, a: [0.3, 0.6], pos: ["renverse|renversent les couleurs", "fait|font virer les teintes"] },
  coupChoc: { g: "frappe", a: [0.5, 0.9], pos: ["envoie|envoient des ondes de choc", "fait|font trembler l'image"] },
  halo: { g: "frappe glisse", douce: 1, a: [0.35, 0.8], sens: 1, pos: ["ouvre|ouvrent la lumière", "fait|font briller les mots"] },
  tremblement: { g: "frappe", a: [0.8, 2], sens: 1, pos: ["fait|font trembler les mots"] },
  exposition: { g: "glisse frappe", douce: 1, a: [0.15, 0.35], pos: ["éclaire|éclairent l'image"], neg: ["assombrit|assombrissent l'image"] },
  lueur: { g: "glisse", douce: 1, a: [0.25, 0.6], sens: 1, lent: 1, pos: ["fait|font luire les lettres", "dore|dorent les lettres"] },
  decalage: { g: "glisse place", douce: 1, a: [30, 80], sens: 1, pos: ["déplace|déplacent les couleurs", "tourne|tournent les teintes", "teinte|teintent la nuit"] },
  teinteGpu: { g: "glisse", a: [0.12, 0.35], sens: 1, pos: ["fait|font tourner les couleurs"] },
  saturation: { g: "glisse place", douce: 1, a: [0.35, 0.75], pos: ["avive|avivent les couleurs"], neg: ["éteint|éteignent les couleurs", "fait|font pâlir les couleurs"] },
  contraste: { g: "glisse", a: [0.15, 0.35], pos: ["durcit|durcissent l'image"], neg: ["adoucit|adoucissent l'image"] },
  vivacite: { g: "place glisse", douce: 1, a: [0.3, 0.6], lent: 1, pos: ["ravive|ravivent les mots"], neg: ["fane|fanent les mots"] },
  clarte: { g: "place", douce: 1, a: [0.15, 0.35], lent: 1, pos: ["blanchit|blanchissent les mots"], neg: ["voile|voilent les mots"] },
  chroma: { g: "glisse", a: [0.2, 0.45], sens: 1, pos: ["fait|font naître l'arc-en-ciel"] },
  bichromie: { g: "glisse", a: [0.3, 0.6], sens: 1, pos: ["peint|peignent l'image en deux couleurs"] },
  solarisation: { g: "glisse", a: [0.25, 0.5], sens: 1, pos: ["brûle|brûlent l'image"] },
  respiration: { g: "glisse", douce: 1, a: [0.4, 0.9], pos: ["fait|font respirer les mots"], neg: ["retient|retiennent le souffle des mots"] },
  ondulation: { g: "glisse", douce: 1, a: [0.4, 1.1], pos: ["fait|font onduler les vers", "berce|bercent les vers"], neg: ["apaise|apaisent les vers"] },
  rotationMots: { g: "place glisse", douce: 1, a: [0.12, 0.3], pos: ["penche|penchent les mots", "fait|font tourner les mots"], neg: ["redresse|redressent les mots"] },
  trainees: { g: "glisse", douce: 1, a: [0.15, 0.3], pos: ["laisse|laissent des traînées"], neg: ["efface|effacent les traces"] },
  ondes: { g: "glisse", a: [0.2, 0.5], sens: 1, pos: ["fait|font onduler l'image"] },
  rvb: { g: "glisse", a: [0.3, 0.7], sens: 1, pos: ["dédouble|dédoublent l'image"] },
  vitesse: { g: "glisse", douce: 1, a: [0.4, 0.8], rel: 1, pos: ["presse|pressent les mots"], neg: ["ralentit|ralentissent les mots"] },
  derive: { g: "glisse", douce: 1, a: [0.3, 0.8], sens: 1, pos: ["fait|font dériver les couleurs"] },
  fondPulse: { g: "frappe glisse", douce: 1, a: [0.4, 0.9], sens: 1, si: () => S.musique && musique.actif, pos: ["fait|font battre le fond"] },
  kaleidoTourne: { g: "place glisse", a: [0.15, 0.4], si: () => S.kaleido > 1, pos: ["fait|font tourner le kaléidoscope"], neg: ["renverse|renversent le kaléidoscope"] },
  kaleidoSpirale: { g: "glisse", a: [0.6, 1.4], si: () => S.kaleido > 1, pos: ["tord|tordent le kaléidoscope"], neg: ["dénoue|dénouent le kaléidoscope"] },
  larsenRotation: { g: "place glisse", a: [0.01, 0.03], si: () => S.larsen > 0.1, pos: ["fait|font tourner le larsen"], neg: ["renverse|renversent le larsen"] },
  calqueOpacite: { g: "glisse", douce: 1, a: [0.2, 0.4], si: () => S.calque !== "aucun" && typeof calque !== "undefined" && !!calque.scene, pos: ["fait|font venir l'autre scène"], neg: ["éloigne|éloignent l'autre scène"] },
  puitsTorsion: { g: "glisse", douce: 1, a: [0.3, 0.8], si: () => sceneCle === "puits", pos: ["tord|tordent le puits"], neg: ["dénoue|dénouent le puits"] },
  rosaceTourne: { g: "glisse", douce: 1, a: [0.3, 0.8], si: () => sceneCle === "rosace", pos: ["fait|font tourner la rosace"], neg: ["retient|retiennent la rosace"] },
};
// le son : un cable au plus, jamais en tete du patch, quand le son joue (on l'entend, on ne le voit pas)
const CV_GRAM_SON = ["sonFiltre", "sonReverb", "sonEcho", "sonChorus", "sonRespire", "sonBalayage"];
// quelle source va a quel genre de destination, et combien
const CV_GRAM_LIENS = { rapide: { frappe: 1, place: 0.15 }, lent: { glisse: 1, frappe: 0.12 }, hauteur: { place: 1, glisse: 0.35 } };
// le fondu d'un patch qui arrive (et de celui qui s'en va) : lisible en moins de dix secondes
const CV_FONDU = 8;
// le cable de tete (celui qui donne son nom au patch) doit se lire tout de suite : pas une source
// qui met des minutes a bouger, et de preference ce qui change toute l'image (la carte graphique)
const CV_PAS_EN_TETE = new Set(["lent2", "lent3", "avancee", "arche", "marche", "envLente", "energie", "motPoete", "voixSilence"]);
const CV_TETE_VISIBLE = new Set(["halo", "coupHalo", "coupFlash", "exposition", "saturation", "decalage", "coupOndes", "coupFonte", "bichromie",
  "contraste", "gonfle", "coupChoc", "coupDecal", "chroma", "teinteGpu"]);

// Les patchs inventes par l'IA (2026-10-19, Jiiji : que les modeles locaux inventent aussi des
// patchs). Un script demande des patchs au modele et les ecrit dans ecran\banque-ia.json ; l'ecran
// le relit toutes les deux minutes s'il existe (absent : rien ne change). Le format, en JSON (un
// tableau de patchs, ou { "patchs": [...] }) :
//   { "nom": "La rareté ouvre la lumière", "humeur": "calme" | "plein" | "tout",
//     "modes": ["poesie", "vjing", "jeu", "auto"],
//     "cables": [["motRare", "halo", 0.4, 0.4], ["lent2+", "decalage", 0.3, 0.4]] }
// Un cable : [source, destination, quantite de -1 a 1, lissage de 0 a 1] ; 2 a 5 cables. Sources :
// les cles de CV_GRAM_SRC (et « cle+ » pour les sources de -1 a 1 qui ont leur version de 0 a 1) ;
// destinations : celles de CV_GRAM_DST, plus un cable de son au plus (CV_GRAM_SON). cv.validerPatch
// applique la grammaire et corrige ou jette chaque patch, sans erreur ; cv.grammaire() rend les
// listes. Au tirage, un patch de l'IA passe encore par ce qui vit maintenant (sources vivantes dans
// le mode, destinations dont le reglage prealable est allume, rien de tenu par un LFO ou la main).
const CV_BANQUE_IA = "ecran/banque-ia.json";
// les tirets longs (ils signent une machine, Jiiji n'en veut nulle part) : remplaces dans les noms
const CV_TIRETS = new RegExp("[" + String.fromCharCode(0x2014, 0x2013) + "]", "g");

/* ---------------------------------------------------- les reglages (onglet Cables) */

{
  const optionsSources = () => [["aucune", "(rien)"]].concat(CV_SOURCES.map(([c, n]) => [c, n]));
  // (cv n'existe pas encore pendant le chargement : la liste attend qu'on la lise)
  const optionsDestinations = () => { try { return cv.optionsDestinations(); } catch (e) { return [["aucune", "(rien)"]]; } };
  const items = [];
  // les listes se lisent quand le panneau se construit (apres finaliserAjouts : toutes les scenes et
  // tous les reglages ajoutes sont la) : d'ou ces options qui se calculent a la lecture
  const avecOptions = (it, f) => { Object.defineProperty(it, "options", { get: f, enumerable: true, configurable: true }); return it; };
  ajouterReglages("Câbles", "Les câbles (tout est lié)", [
    { cle: "cvActif", nom: "Les câbles sont branchés", type: "case" },
    { cle: "cvDose", nom: "Profondeur de tous les câbles", type: "curseur", min: 0, max: 2, pas: 0.05 },
    { cle: "cvRythme", nom: "Un nouveau patch toutes les (minutes)", type: "curseur", min: 1, max: 20, pas: 0.5 },
    { cle: "cvPartout", nom: "Les patchs changent d'eux-mêmes dans tous les modes", type: "case" },
    { cle: "cvSonsMots", nom: "Les sons font des mots (force)", type: "curseur", min: 0, max: 1, pas: 0.05 },
    { cle: "cvSonsMotsQuand", nom: "Les sons font des mots", type: "choix", options: [["auto", "en mode full auto"], ["toujours", "dans tous les modes"], ["jamais", "jamais"]] },
    // 2026-10-19 : le generateur de patchs
    { cle: "cvPatchs", nom: "Patchs", type: "choix", options: [["ecrits", "écrits"], ["generes", "générés"], ["deux", "écrits et générés"],
      ["ia", "inventés par l'IA"], ["tous", "tous"]] },
    { cle: "cvAudace", nom: "Audace du générateur", type: "curseur", min: 0, max: 1, pas: 0.05 },
    { cle: "cvMaxCables", nom: "Câbles par patch, au plus", type: "curseur", min: 2, max: 5, pas: 1 },
  ], { cvActif: true, cvDose: 1, cvRythme: 3, cvPartout: true, cvSonsMots: 0.6, cvSonsMotsQuand: "auto", cvPatchs: "tous", cvAudace: 0.5, cvMaxCables: 4 });
  for (let i = 1; i <= CV_NB; i++) {
    const k = "cv" + i;
    ajouterReglages("Câbles", "Câble " + i, [
      avecOptions({ cle: k + "Src", nom: "Source", type: "choix" }, optionsSources),
      avecOptions({ cle: k + "Dst", nom: "Destination", type: "choix" }, optionsDestinations),
      { cle: k + "Quantite", nom: "Quantité (− : à l'envers)", type: "curseur", min: -1, max: 1, pas: 0.01 },
      { cle: k + "Lissage", nom: "Lissage", type: "curseur", min: 0, max: 1, pas: 0.05 },
    ], { [k + "Src"]: "aucune", [k + "Dst"]: "aucune", [k + "Quantite"]: 0.5, [k + "Lissage"]: 0.2 });
    items.push(k + "Src", k + "Dst", k + "Quantite", k + "Lissage");
  }
  items.push("cvActif", "cvDose", "cvRythme", "cvPartout", "cvSonsMots", "cvSonsMotsQuand", "cvPatchs", "cvAudace", "cvMaxCables");
  // les cables ne sont pas des cibles de LFO, le pilote ne les fait pas glisser, le hasard des modes
  // ne les tire pas (il a son patch au hasard a lui : le bouton de l'onglet)
  for (const c of items) {
    LFO_EXCLUS.add(c);
    if (typeof HASARD_JAMAIS !== "undefined") HASARD_JAMAIS.add(c);
    if (typeof PRESET_JAMAIS !== "undefined") PRESET_JAMAIS.add(c);
  }
}

/* ---------------------------------------------------- les cables */

const cv = {
  val: {}, bases: {}, ecrit: {}, ecarts: new Map(), dernierEcart: {}, son: {}, gonfle: 0, coups: {},
  dests: null, destsCle: "", optionsCache: null, mains: [], vu: -1, t: 0, pret: false, erreurs: new Set(), cout: 0,
  // ce qui arrive par le bus
  ev: { notes: [], mots: [], noteDuree: 1, coups: [0, 0, 0], poemeVu: null, versVus: 0, versIndex: -1, nbVers: 1, compte: 0,
    syllabe: 0, dernierEcho: 0, echos: [] },
  // les mots vus (pour rallumer le mot de la note la ou il a paru) et ceux qui viennent de chanter
  vus: new Map(), chants: new Map(),
  // les generateurs
  gen: { p1: Math.random() * 6.28, p2: Math.random() * 6.28, p3: Math.random() * 6.28, marche: 0, prochainTemps: 0, moyNiveau: 0.2 },
  // le mode auto : le patch qui joue, celui qui s'en va, et quand le suivant viendra
  auto: { actuel: null, ancien: null, prochain: 0, passes: [], journal: [], hors: 0, verifie: 0 },
  // les sondes : quels reglages ce qui se dessine maintenant lit vraiment (une scene sans mots qui
  // ondulent ne lit pas « ondulation » : un cable dessus ne fait rien). lu[c] : la derniere image
  // qui l'a lu ; usage[c] : la part des images recentes qui le lisent (2026-10-19)
  lu: {}, usage: {}, ecoute: false, imageN: -1, sondeN: 0, sondes: null,
  // l'onde de choc a nous (geste coupChoc) : sa force, son age, et la source juste avant (l'attaque)
  choc: { force: 0, age: 9, avant: 0, dernier: -9 },
  // ce que chaque source a fait ces 60 dernieres secondes (douze cases de 5 s : le plus bas, le plus haut)
  vie: { debut: 0, cases: [], cour: null, coursT: 0, mode: "" },

  maintenant() { return performance.now() / 1000; },
  enAuto() { return (S.mode || "vjing") === "auto" || !!S.cvPartout; },

  /* -------- les destinations */
  // l'image : tous les curseurs que les LFO peuvent prendre (la liste est complete apres le depart) ;
  // le son : ce que son.v lit (SON_BORNES) ; et les gestes partages
  destinations() {
    const entrees = this.entreesSon();
    const cle = Object.keys(LFO_CIBLES).length + "|" + (entrees ? entrees.length : typeof SON_BORNES !== "undefined" ? Object.keys(SON_BORNES).length : 0);
    if (this.dests && this.destsCle === cle) return this.dests;
    const d = {};
    for (const [c, nom, champ, ech] of CV_GESTES) d[c] = { type: champ ? "coup" : "gonfle", nom, champ, ech };
    for (const c in LFO_CIBLES) {
      if (CV_JAMAIS.has(c) || /^cv\d/.test(c)) continue;
      const x = LFO_CIBLES[c];
      d[c] = { type: "image", nom: x.nom, min: x.min, max: x.max, pas: x.pas };
    }
    // le son : les entrees que son.js ouvre aux cables (son.cv, son.CV_NOMS) ; a defaut, ce que son.v lit
    if (entrees) for (const [c, nom] of entrees) d[c] = { type: "son", nom: nom.replace(/^Son : /, "") + " (Son)" };
    else if (typeof SON_BORNES !== "undefined") for (const c in SON_BORNES) {
      if (CV_JAMAIS.has(c)) continue;
      const [min, max, , log] = SON_BORNES[c], it = REGLAGE[c];
      d[c] = { type: "son", nom: (it ? it.nom : c) + " (Son)", min, max, log: !!log };
    }
    this.dests = d; this.destsCle = cle; this.optionsCache = null;
    return d;
  },
  entreesSon() { return typeof son !== "undefined" && son.cv && Array.isArray(son.CV_NOMS) ? son.CV_NOMS : null; },
  optionsDestinations() {
    const d = this.destinations();
    if (!this.optionsCache) {
      const o = [["aucune", "(rien)"]], par = t => Object.keys(d).filter(c => d[c].type === t);
      for (const c of par("gonfle").concat(par("coup"))) o.push([c, d[c].nom]);
      for (const c of par("image")) o.push([c, d[c].nom]);
      for (const c of par("son")) o.push([c, d[c].nom]);
      this.optionsCache = o;
    }
    return this.optionsCache;
  },
  nomSource(c) { const x = CV_SOURCES.find(s => s[0] === c); return x ? x[1] : c; },
  nomDest(c) { const d = this.destinations()[c]; return d ? d.nom.replace(/ \([^)]*\)$/, "") : c; },
  // la valeur reglee d'un curseur sous un cable (sous un LFO aussi, l'ecart du cable ote)
  base(c) {
    if (!(c in this.bases)) return c in lfo.bases ? lfo.bases[c] : S[c];
    if (c in lfo.bases) return lfo.bases[c] - (this.dernierEcart[c] || 0);
    return this.bases[c];
  },

  /* -------- le bus */
  normal(t) { return sansAccents(String(t || "").toLowerCase()).replace(/[^a-z0-9'-]/g, ""); },
  surNote(d) {
    d = d || {};
    const e = this.ev, t = this.maintenant(), vel = clamp(Number(d.vel != null ? d.vel : 0.7), 0, 1.5);
    e.notes.push(t); e.derniereNote = t;
    const duree = clamp(Number(d.duree) || 1, 0.05, 8);
    e.noteDuree = duree;
    this.val.noteEnvBrut = Math.max(this.val.noteEnvBrut || 0, clamp(vel, 0, 1));
    this.val.noteVel = clamp(vel / 1.2, 0, 1);
    if (d.f > 0) this.val.noteHauteur = clamp(Math.log2(d.f / 55) / 6, 0, 1);
    if (d.degre != null) {
      const n = typeof son !== "undefined" && son.gamme ? Math.max(1, son.gamme().length) : 7;
      this.val.noteDegre = (((Math.round(d.degre) % n) + n) % n) / Math.max(1, n - 1);
    }
    if (d.timbre) {
      const i = typeof TIMBRES_NOMS !== "undefined" ? TIMBRES_NOMS.findIndex(x => x[0] === d.timbre) : -1;
      this.val.noteTimbre = i >= 0 ? i / Math.max(1, TIMBRES_NOMS.length - 1) : (this.hacher(d.timbre) % 1000) / 999;
    }
    if (d.pan != null) this.val.notePan = clamp(Number(d.pan) || 0, -1, 1);
    this.val.hasardNote = Math.random() * 2 - 1;
    e.compte = (e.compte + 1) % 8;
    this.val.compteur = e.compte / 7;
    const m = this.normal(d.mot);
    if (m) this.chants.set(m, t);
    if (this.chants.size > 200) this.chants.delete(this.chants.keys().next().value);
    this.sonsFontDesMots(d, vel, duree, m, t);
  },
  surMot(d) {
    d = d || {};
    const t = this.maintenant(), texte = String(d.texte || "");
    this.ev.mots.push(t); this.ev.dernierMot = t;
    this.val.motEnvBrut = 1;
    this.val.envLenteBrut = clamp((this.val.envLenteBrut || 0) + 0.12, 0, 1);
    const cours = d.cours != null ? Number(d.cours) : (typeof coursDe === "function" && texte ? coursDe(texte) : 50);
    this.val.motRare = clamp(cours / 100, 0, 1);
    this.val.motPoete = this.indexPoete(d.poete);
    if (d.x != null && W) this.val.motX = clamp(d.x / W * 2 - 1, -1, 1);
    if (d.y != null && H) this.val.motY = clamp(1 - d.y / H * 2, -1, 1);
    this.val.motLongueur = clamp(texte.length / 12, 0, 1);
    const m = this.normal(texte);
    if (m && d.x != null && d.y != null) {
      this.vus.delete(m);
      this.vus.set(m, { texte, x: d.x, y: d.y, poete: d.poete || "", cours, t });
      if (this.vus.size > 300) this.vus.delete(this.vus.keys().next().value);
    }
  },
  surVers(d) {
    d = d || {};
    const e = this.ev;
    this.val.versEnvBrut = 1;
    this.val.bascule = (this.val.bascule || 1) > 0 ? -1 : 1;
    if (poemeCourant !== e.poemeVu) this.nouveauPoeme(poemeCourant);
    e.versVus++;
    e.versIndex = d.index != null ? Number(d.index) : e.versIndex + 1;
  },
  nouveauPoeme(p) {
    const e = this.ev;
    e.poemeVu = p; e.versVus = 0; e.versIndex = -1;
    try { e.nbVers = p ? Math.max(1, versDe(p).length) : 1; } catch (er) { e.nbVers = 1; }
    this.val.forme = p && p.forme ? (this.hacher(p.forme) % 1000) / 999 : 0.5;
  },
  surCoup(d) {
    d = d || {};
    const i = typeof d.bande === "number" ? d.bande : ["kick", "caisse", "charley"].indexOf(d.bande);
    if (i >= 0 && i < 3) this.ev.coups[i] = Math.max(this.ev.coups[i], clamp(Number(d.force != null ? d.force : 1), 0, 1));
  },
  hacher(s) { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 100003; return h; },
  indexPoete(p) {
    const n = sansAccents(String(p || "")).toLowerCase();
    const i = ["lyrique", "minimaliste", "surrealiste", "sonore", "brut"].findIndex(x => n.includes(x));
    return i < 0 ? 0.5 : i / 4;
  },

  /* -------- les sources, a chaque image */
  lire(dt, t) {
    const v = this.val, e = this.ev, dec = tau => Math.exp(-dt / tau);
    const suivre = (cle, x, tau) => { v[cle] = lerp(v[cle] == null ? x : v[cle], x, 1 - dec(tau)); };
    // les enveloppes : instantanees a l'attaque, puis elles retombent
    v.noteEnvBrut = (v.noteEnvBrut || 0) * dec(0.25 + e.noteDuree * 0.4);
    v.motEnvBrut = (v.motEnvBrut || 0) * dec(0.5);
    v.versEnvBrut = (v.versEnvBrut || 0) * dec(1.5);
    v.envLenteBrut = (v.envLenteBrut || 0) * dec(8);
    v.noteEnv = v.noteEnvBrut; v.motEnv = v.motEnvBrut; v.versEnv = v.versEnvBrut; v.envLente = v.envLenteBrut;
    // les densites : ce qui est venu dans les quatre dernieres secondes
    while (e.notes.length && t - e.notes[0] > 4) e.notes.shift();
    while (e.mots.length && t - e.mots[0] > 4) e.mots.shift();
    suivre("noteDensite", clamp(e.notes.length / 4 / 4, 0, 1), 0.6);
    suivre("motDensite", clamp(e.mots.length / 4 / 6, 0, 1), 0.6);
    for (const c of ["noteHauteur", "noteDegre", "noteVel", "noteTimbre", "notePan", "motRare", "motPoete", "motX", "motY", "motLongueur", "compteur", "hasardNote", "forme", "bascule"]) {
      if (v[c] == null) v[c] = CV_BIPOLAIRE.has(c) ? 0 : c === "motRare" ? 0.5 : 0;
    }
    // le poeme : son avancee par les vers annonces, sinon par l'horloge (poemeMax)
    if (poemeCourant !== e.poemeVu) this.nouveauPoeme(poemeCourant);
    let av;
    if (e.versVus > 0) av = clamp((e.versIndex + 1) / e.nbVers, 0, 1);
    else av = S.poemeMax < 600 ? clamp((performance.now() - debutPoeme) / (S.poemeMax * 1000), 0, 1) : 0;
    suivre("avancee", av, 0.8);
    v.arche = Math.sin(Math.PI * v.avancee);
    // la musique
    const m = S.musique && musique.actif ? musique : null, env = musique.env || [0, 0, 0];
    for (let i = 0; i < 3; i++) e.coups[i] *= dec(0.2);
    v.basses = m ? clamp(m.basses / 1.2, 0, 1) : 0; v.mediums = m ? clamp(m.mediums / 1.2, 0, 1) : 0; v.aigus = m ? clamp(m.aigus / 1.2, 0, 1) : 0;
    v.kick = Math.max(m ? env[0] : 0, e.coups[0]); v.caisse = Math.max(m ? env[1] : 0, e.coups[1]); v.charley = Math.max(m ? env[2] : 0, e.coups[2]);
    v.volume = m ? clamp(m.niveau / 1.2, 0, 1) : 0;
    v.tempo = m && m.bpm ? clamp((m.bpm - 60) / 120, 0, 1) : this.enAuto() ? clamp(((S.sonTempo || 30) - 6) / 114, 0, 1) : 0;
    v.mesure = m ? 0.5 - 0.5 * Math.cos((m.phase || 0) * Math.PI / 2) : 0;
    // la voix (mode poesie, modes.js)
    const vx = typeof voix !== "undefined" && voix.actif && voix.actif() ? voix : null;
    if (vx && vx.attaque) e.syllabe = 1;
    e.syllabe *= dec(0.18);
    v.voixEnv = vx ? clamp(vx.env, 0, 1) : 0; v.voixAigu = vx ? vx.aigu() : 0; v.voixDebit = vx ? clamp(vx.debit / 6, 0, 1) : 0;
    v.voixSyllabe = e.syllabe; v.voixSilence = vx ? clamp(vx.silence / 12, 0, 1) : 0;
    // les LFO de l'onglet LFO (leur onde, branchee ou non)
    for (let i = 1; i <= Math.min(6, LFO_NB); i++) v["lfo" + i] = lfo.onde(i, t);
    // le pilote
    const pil = typeof pilote !== "undefined" && pilote.actif ? clamp(Number(pilote.intensite) || Number(pilote.energie) || 0, 0, 1) : null;
    // les generateurs
    const g = this.gen;
    v.lent1 = Math.sin(t * 6.2832 / 41 + g.p1); v.lent2 = Math.sin(t * 6.2832 / 149 + g.p2); v.lent3 = Math.sin(t * 6.2832 / 541 + g.p3);
    // marche aleatoire : un pas au hasard a chaque image (en racine du temps), rappel doux, rebond
    g.marche += (Math.random() * 2 - 1) * Math.sqrt(dt) * 0.35 - g.marche * dt * 0.02;
    if (g.marche > 1) g.marche = 2 - g.marche; else if (g.marche < -1) g.marche = -2 - g.marche;
    g.marche = clamp(g.marche, -1, 1);
    v.marche = g.marche;
    suivre("marches", Math.round((g.marche + 1) * 2) / 2 - 1, 0.08);
    // hasard tous les deux temps : ceux de la musique, sinon ceux du son de l'ecran (pilote.beat)
    const temps = m && m.bpm ? 60 / m.bpm : typeof pilote !== "undefined" && pilote.beat ? pilote.beat() : 2;
    if (!g.prochainTemps || t >= g.prochainTemps || g.prochainTemps - t > temps * 4) { g.cible = Math.random() * 2 - 1; g.prochainTemps = t + temps * 2; }
    suivre("hasardTemps", g.cible || 0, 0.06);
    // suiveur d'enveloppe : il monte vite et redescend lentement
    const brut = clamp(v.noteEnv + v.motEnv * 0.6 + v.kick * 0.5, 0, 1);
    v.suiveur = lerp(v.suiveur || 0, brut, 1 - dec(brut > (v.suiveur || 0) ? 0.05 : 1.5));
    // porte : une note et un mot partis ensemble (a moins de 0,2 s l'un de l'autre) ; elle se
    // referme en 0,3 s
    const tn = e.notes.length ? e.notes[e.notes.length - 1] : -9, tm = e.mots.length ? e.mots[e.mots.length - 1] : -9;
    const ouverte = Math.abs(tn - tm) < 0.2 && t - Math.max(tn, tm) < 0.25 ? 1 : 0;
    v.porte = ouverte ? 1 : (v.porte || 0) * dec(0.3);
    // comparateur : plus fort que sa moyenne des vingt dernieres secondes
    const niveau = m ? m.niveau : v.suiveur;
    g.moyNiveau = lerp(g.moyNiveau, niveau, 1 - dec(20));
    suivre("comparateur", niveau > g.moyNiveau * 1.2 + 0.03 ? 1 : 0, 0.15);
    v.energie = pil != null ? pil : m ? clamp(m.niveau, 0, 1) : v.suiveur;
    // la manette : ses gestes (main.frapper, voir les branchements), la main qui court, sa place,
    // les gachettes
    const mn = typeof main !== "undefined" ? main : null;
    v.mainGesteBrut = (v.mainGesteBrut || 0) * dec(0.4); v.mainGeste = v.mainGesteBrut;
    suivre("mainVitesse", mn ? clamp(Math.hypot(mn.vx || 0, mn.vy || 0) / 950, 0, 1) : 0, 0.15);
    v.mainX = mn && mn.place && W ? clamp(mn.x / W * 2 - 1, -1, 1) : 0;
    v.mainY = mn && mn.place && H ? clamp(1 - mn.y / H * 2, -1, 1) : 0;
    v.mainGachettes = mn ? clamp(Math.max(mn.souffle || 0, mn.aimant || 0), 0, 1) : 0;
    this.observer(t);
  },
  // l'etendue de chaque source sur la derniere minute, pour savoir ce qui vit (2026-10-19)
  observer(t) {
    const V = this.vie, v = this.val, mode = S.mode || "vjing";
    // un autre mode, la musique qui arrive ou part : on repart de zero
    const etat = mode + "|" + !!(S.musique && musique.actif) + "|" + !!S.son;
    if (V.mode !== etat || !V.cour) { V.mode = etat; V.debut = t; V.cases = []; V.cour = { min: {}, max: {} }; V.coursT = t; }
    const C = V.cour;
    for (const [k] of CV_SOURCES) {
      if (k.endsWith("+")) continue;
      const x = v[k];
      if (typeof x !== "number" || !isFinite(x)) continue;
      if (!(k in C.min) || x < C.min[k]) C.min[k] = x;
      if (!(k in C.max) || x > C.max[k]) C.max[k] = x;
    }
    if (t - V.coursT >= 5) { V.cases.push(C); if (V.cases.length > 11) V.cases.shift(); V.cour = { min: {}, max: {} }; V.coursT = t; }
  },
  etendue(k) {
    const V = this.vie;
    let lo = Infinity, hi = -Infinity;
    for (const C of V.cases.concat(V.cour ? [V.cour] : [])) { if (k in C.min) lo = Math.min(lo, C.min[k]); if (k in C.max) hi = Math.max(hi, C.max[k]); }
    return hi >= lo ? hi - lo : 0;
  },
  // une source vit-elle dans ce mode ? D'abord ce qu'il lui faut (la musique, le micro, le son,
  // la manette), puis ce qu'elle a vraiment fait depuis une minute
  vivante(k) {
    k = String(k).replace(/\+$/, "");
    if (!(k in this.val) && !CV_SOURCES.some(x => x[0] === k)) return false;
    // les sources hors de la grammaire (les patchs ecrits s'en servent) : leur famille par leur nom
    const G = CV_GRAM_SRC[k] || ["lent", /^(note|compteur|hasardNote)/.test(k) ? "notes" : /^voix/.test(k) ? "voix" :
      /^(basses|mediums|aigus|kick|caisse|charley|volume|tempo|mesure)$/.test(k) ? "musique" : /^mot/.test(k) ? "mots" : ""];
    const t = this.maintenant(), m = S.musique && musique.actif, fam = G[1];
    if (fam === "musique" && !m) return false;
    if (fam === "voix" && !(typeof voix !== "undefined" && voix.actif && voix.actif())) return false;
    if (fam === "manette" && !(typeof manette !== "undefined" && manette.index != null && performance.now() - (manette.dernierUsage || -1e9) < 20000)) return false;
    if (fam === "notes" && !(t - (this.ev.derniereNote || -99) < 12)) return false;
    if ((/^mot/.test(k) || k === "envLente") && !(t - (this.ev.dernierMot || -99) < 12)) return false;
    if (fam === "lfo" && !(S[k + "Cible"] && S[k + "Cible"] !== "aucune" && S[k + "Amplitude"] > 0)) return false;
    if (k === "energie" && !(typeof pilote !== "undefined" && pilote.actif) && !m) return this.etendue(k) > 0.15;
    if (CV_TOUJOURS.has(k)) return true;
    // moins de 10 s d'observation : ce qu'il lui faut suffit
    if (t - this.vie.debut < 10) return true;
    return this.etendue(k) >= (G[0] === "rapide" ? 0.25 : 0.1);
  },
  valeur(src, sansMusique) {
    // « + » : la source ramenee de -1..1 a 0..1
    const plus = typeof src === "string" && src.endsWith("+");
    if (plus) src = src.slice(0, -1);
    if (sansMusique && CV_SANS_MUSIQUE[src] && !(S.musique && musique.actif)) src = CV_SANS_MUSIQUE[src];
    const x = this.val[src];
    if (!(typeof x === "number" && isFinite(x))) return 0;
    return plus ? clamp((x + 1) / 2, 0, 1) : x;
  },

  /* -------- chaque image (apres les LFO) */
  maj(force) {
    if (this.vu === compteur && !force) return;
    this.vu = compteur;
    const debut = performance.now(), t = debut / 1000, dt = clamp(t - (this.t || t), 0, 0.25);
    this.t = t;
    if (!this.pret) this.preparer();
    this.sonder();
    this.lire(dt, t);
    this.majAuto(dt, t);
    const D = this.destinations(), ecarts = this.ecarts;
    ecarts.clear();
    for (const c in this.son) this.son[c] = 0;
    for (const c in this.coups) this.coups[c] = 0;
    let gonfle = 0;
    const ajouter = (dst, u) => {
      const d = D[dst];
      if (!d || !u) return;
      if (d.type === "image") ecarts.set(dst, (ecarts.get(dst) || 0) + u * (d.max - d.min) / 2);
      else if (d.type === "son") this.son[dst] = (this.son[dst] || 0) + u;
      else if (d.type === "gonfle") gonfle += u;
      else this.coups[dst] = (this.coups[dst] || 0) + u;
    };
    const lisser = (c, vise) => {
      const tau = c.l * c.l * 4;
      c.lisse = tau > 0.01 ? lerp(c.lisse || 0, vise, 1 - Math.exp(-dt / tau)) : vise;
      if (Math.abs(c.lisse) < 1e-5) c.lisse = 0;
      return c.lisse;
    };
    const dose = S.cvActif ? S.cvDose : 0;
    // les cables a la main
    for (let i = 1; i <= CV_NB; i++) {
      const c = this.mains[i] || (this.mains[i] = { lisse: 0 }), k = "cv" + i;
      c.src = S[k + "Src"]; c.dst = S[k + "Dst"]; c.l = clamp(Number(S[k + "Lissage"]) || 0, 0, 1);
      const branche = dose > 0 && c.src !== "aucune" && D[c.dst];
      if (!branche) { c.lisse = 0; c.sortie = 0; continue; }
      c.sortie = lisser(c, this.valeur(c.src) * (Number(S[k + "Quantite"]) || 0) * dose);
      ajouter(c.dst, c.sortie);
    }
    // le patch du mode auto (et celui qui s'en va)
    for (const P of [this.auto.ancien, this.auto.actuel]) {
      if (!P) continue;
      for (const c of P.cables) {
        // un cable dont la destination vient d'etre prise (par un LFO, par la main) s'efface en 2 s
        c.g = c.coupe ? Math.max(0, (c.g == null ? 1 : c.g) - dt / 2) : 1;
        c.sortie = lisser(c, dose > 0 ? this.valeur(c.src, true) * c.q * P.gain * c.g * dose : 0);
        ajouter(c.dst, c.sortie);
      }
    }
    this.gonfle = clamp(gonfle, -0.7, 2);
    // le son lit ses entrees lui-meme (son.cv, de -1 a 1 : en octaves pour la clarte, le tempo, la duree)
    if (this.entreesSon()) for (const [c] of son.CV_NOMS) son.cv[c] = clamp(this.son[c] || 0, -1, 1);
    // les coups : ils s'ajoutent a ceux de la main (qui retombent seuls) ; l'onde de choc est a nous
    const ch = this.choc;
    ch.age += dt;
    if (typeof main !== "undefined" && main.impact) for (const c in this.coups) {
      const u = this.coups[c], d = D[c];
      if (!d) continue;
      if (d.champ === "choc") {
        // une attaque (la source passe le seuil en montant) lance une onde, pas plus de trois par seconde
        if (u > 0.3 && ch.avant <= 0.3 && t - ch.dernier > 0.33) { ch.age = 0; ch.force = clamp(u * d.ech, 0, 1.6); ch.dernier = t; }
        ch.avant = u;
        continue;
      }
      if (u > 0.003) main.impact[d.champ] = Math.max(main.impact[d.champ] || 0, u * d.ech);
    }
    if (!("coupChoc" in this.coups)) ch.avant = 0;
    this.appliquerImage(D);
    this.majEtat(debut);
    this.cout = lerp(this.cout || 0, performance.now() - debut, 0.05);
    // a partir d'ici et jusqu'au pilote de l'image suivante : la scene, le fond, la carte lisent
    this.imageN = compteur; this.ecoute = true;
  },
  // Les sondes : chaque destination de l'image devient un accesseur de S qui note l'image ou on l'a
  // lue pendant le dessin. Rien ne change pour les autres fichiers (meme valeur, meme ecriture).
  installerSondes() {
    const cles = new Set();
    for (const c in CV_GRAM_DST) cles.add(c);
    for (const p of CV_PATCHS) for (const c of p.cables) cles.add(c[1]);
    this.sondes = [];
    for (const c of cles) {
      if (!(c in S) || typeof S[c] !== "number" || !(c in LFO_CIBLES)) continue;
      const d = Object.getOwnPropertyDescriptor(S, c);
      if (!d || !("value" in d) || !d.configurable) continue;
      let val = d.value;
      const soi = this;
      Object.defineProperty(S, c, { get() { if (soi.ecoute) soi.lu[c] = soi.imageN; return val; }, set(x) { val = x; }, enumerable: true, configurable: true });
      this.sondes.push(c);
    }
    this.sondes.push("gonfle");
  },
  sonder() {
    if (!this.sondes) return;
    // l'image d'avant : qui a ete lu pendant son dessin
    if (this.imageN >= 0) {
      this.sondeN++;
      for (const c of this.sondes) this.usage[c] = (this.usage[c] || 0) * 0.97 + (this.lu[c] === this.imageN ? 0.03 : 0);
    }
  },
  // une destination agit-elle sur ce qui se dessine maintenant ? (les deux premieres secondes : oui)
  agit(c) {
    if (!this.sondes || this.sondeN < 120 || !this.sondes.includes(c)) return true;
    return (this.usage[c] || 0) > 0.3;
  },
  // comme lfo.maj : la base bouge par difference quand quelqu'un d'autre touche le reglage
  // Un reglage sous un LFO et sous un cable : chacun voit l'ecart de l'autre comme un geste et le
  // range dans sa base (la valeur, elle, est juste : base + LFO + cable, et les deux ecrivent la meme).
  // Le LFO qui se debranche rend sa base, ou est range notre ecart : notre difference le retire.
  // Le cable qui se debranche apres le passage du LFO ote son ecart de la base du LFO.
  appliquerImage(D) {
    for (const c in this.bases) if (!this.ecarts.has(c)) {
      const e = this.dernierEcart[c] || 0;
      if (S[c] === this.ecrit[c]) S[c] = this.bases[c];
      else if (c in lfo.bases && S[c] === lfo.ecrit[c]) { lfo.bases[c] -= e; S[c] -= e; lfo.ecrit[c] = S[c]; }
      delete this.bases[c]; delete this.ecrit[c]; delete this.dernierEcart[c];
    }
    for (const [c, e] of this.ecarts) {
      const d = D[c];
      if (!(c in this.bases)) this.bases[c] = Number(S[c]);
      else if (S[c] !== this.ecrit[c]) this.bases[c] = clamp(this.bases[c] + (Number(S[c]) - this.ecrit[c]), d.min, d.max);
      let x = clamp(this.bases[c] + e, d.min, d.max);
      if (d.pas >= 1) x = Math.round(x);
      else x = enMarches(c, x);
      if (!isFinite(x)) continue;
      this.dernierEcart[c] = x - this.bases[c];
      S[c] = x; this.ecrit[c] = x;
    }
  },

  /* -------- le mode auto : des patchs qui se branchent et se debranchent */
  majAuto(dt, t) {
    const A = this.auto, fondu = CV_FONDU;
    // Jiiji (2026-10-19) : « il genere pas de patch automatiquement » : la case etait fausse par
    // defaut et les patchs ne vivaient qu'en mode full auto. Elle est cochee une fois pour toutes
    if (!this.migre) {
      this.migre = true;
      try { if (!localStorage.getItem("poiasie-cv-partout-v1")) { localStorage.setItem("poiasie-cv-partout-v1", "1"); S.cvPartout = true; sauver(); } } catch (e) { /* tant pis */ }
    }
    // la banque de l'IA : relue toutes les deux minutes (si elle a change)
    if (t - this.banqueT > 120) this.lireBanque();
    if (!this.enAuto() || !S.cvActif) {
      // hors du mode auto : le patch s'en va en douceur (8 s)
      for (const P of [A.actuel, A.ancien]) if (P) P.gain = Math.max(0, P.gain - dt / 8);
      if (A.ancien && A.ancien.gain <= 0) A.ancien = null;
      if (A.actuel && A.actuel.gain <= 0) { A.actuel = null; A.prochain = 0; }
      return;
    }
    // le curseur du rythme raccourci en cours de patch compte tout de suite
    if (A.actuel) A.prochain = Math.min(A.prochain, A.actuel.depuis + Math.max(1, S.cvRythme || 3) * 60 * 1.25);
    // (« Tout debrancher » et « Garder ce patch » donnent un repos : il est tenu, meme sans patch)
    if (t >= A.prochain) this.changerPatch(t);
    if (A.actuel) A.actuel.gain = Math.min(1, A.actuel.gain + dt / fondu);
    if (A.ancien) { A.ancien.gain -= dt / fondu; if (A.ancien.gain <= 0) A.ancien = null; }
    // deux fois par seconde : un reglage qu'un LFO ou la main vient de prendre lache son cable (jamais
    // un LFO et un cable sur le meme reglage : leurs bases derivent, 0,18 -> 0,34 mesure le 2026-10-19)
    if (t - A.verifie > 0.5) {
      A.verifie = t;
      const pris = this.tenues(), D = this.destinations();
      for (const P of [A.actuel, A.ancien]) if (P) for (const c of P.cables) if (!c.coupe && D[c.dst] && D[c.dst].type !== "gonfle" && D[c.dst].type !== "coup" && pris.has(c.dst)) c.coupe = true;
      // un patch qui a perdu tous ses cables laisse vite la place ; un patch dont la scene a change
      // et qui n'a plus qu'un cable qui agit (les sondes) aussi, apres 8 s
      if (A.actuel && A.actuel.cables.every(c => c.coupe)) A.prochain = Math.min(A.prochain, t + 15);
      if (A.actuel && A.actuel.gain >= 1) {
        const agissent = A.actuel.cables.filter(c => !c.coupe && (!D[c.dst] || D[c.dst].type === "son" || this.agit(c.dst))).length;
        A.inerte = agissent < 2 ? (A.inerte || t) : 0;
        if (A.inerte && t - A.inerte > 8) { A.prochain = Math.min(A.prochain, t + 1); A.inerte = 0; }
      }
    }
    // en cours de patch, un cable s'ecarte un peu de sa quantite, puis y revient (le patch vit)
    const P = A.actuel;
    if (P && P.cables.length) {
      if (t >= P.derive) { const c = tirer(P.cables); c.qVise = c.q0 * hasard(0.55, 1.3); P.derive = t + hasard(25, 70); }
      for (const c of P.cables) c.q = lerp(c.q, c.qVise, 1 - Math.exp(-dt / 12));
    }
  },
  // l'humeur du moment : la section du pilote, sinon l'energie
  humeur() {
    const s = typeof pilote !== "undefined" && pilote.actif ? pilote.section : null;
    if (s === "intro" || s === "cassure" || s === "fin") return 0.2;
    if (s === "drop" || s === "plateau") return 0.85;
    if (s === "montée") return 0.65;
    return clamp(this.val.energie || 0, 0, 1);
  },
  // ce que tiennent deja un LFO (de Jiiji ou du pilote), la main (pilote.libre : 30 s apres un
  // geste) et les cables a la main (sansMains : pas eux, ils vont etre remplaces)
  tenues(opt) {
    opt = opt || {};
    const l = new Set();
    for (let i = 1; i <= LFO_NB; i++) { const c = S["lfo" + i + "Cible"]; if (c && c !== "aucune" && S["lfo" + i + "Amplitude"] > 0) l.add(c); }
    for (const c in lfo.bases) l.add(c);
    if (typeof pilote !== "undefined") {
      for (const i in pilote.lfoMiens || {}) if (pilote.lfoMiens[i] && pilote.lfoMiens[i].cible) l.add(pilote.lfoMiens[i].cible);
      if (pilote.libre) for (const c of Object.keys(pilote.aLaMain || {})) if (!pilote.libre(c)) l.add(c);
    }
    if (!opt.sansMains) for (let i = 1; i <= CV_NB; i++) if (S["cv" + i + "Src"] !== "aucune" && S["cv" + i + "Dst"] !== "aucune") l.add(S["cv" + i + "Dst"]);
    return l;
  },
  // un patch prend vie : ses cables dont la destination existe, change l'image (jamais la vieille
  // tele eteinte, jamais deux fois la meme) et n'est tenue ni par un LFO ni par la main
  instancier(p, opt) {
    const D = this.destinations(), pris = this.tenues(opt), vus = new Set();
    const permis = ([s, d]) => {
      const x = D[d];
      if (!x || vus.has(d) || !CV_SOURCES.some(y => y[0] === s) || CV_JAMAIS.has(d)) return false;
      if (!S.vieilleTele && typeof VIEILLE_TELE !== "undefined" && VIEILLE_TELE.has(d)) return false;
      if (x.type !== "gonfle" && x.type !== "coup" && pris.has(d)) return false;
      // un patch ecrit : ses cables dont la source est morte dans ce mode (apres la releve des
      // sources de la musique par celles de l'ecran) ne sont pas branches
      if (!p.genere) { const s2 = !(S.musique && musique.actif) && CV_SANS_MUSIQUE[s] ? CV_SANS_MUSIQUE[s] : s; if (!this.vivante(s2)) return false; }
      // un patch de l'IA : une destination qui demande un reglage allume (le kaleidoscope pour le
      // faire tourner) attend qu'il le soit
      const X = CV_GRAM_DST[d];
      if (p.ia && X && X.si) { try { if (!X.si()) return false; } catch (e) { return false; } }
      // ce que la scene du moment ne lit pas : sans effet, le cable n'est pas branche
      if (!this.agit(d)) return false;
      vus.add(d);
      return true;
    };
    const cables = p.cables.filter(permis).map(([src, dst, q, l]) => {
      const q0 = p.genere ? q : q * hasard(0.75, 1.15);
      return { src, dst, q: q0, q0, qVise: q0, l, lisse: 0, sortie: 0 };
    });
    const t = this.maintenant();
    return cables.length >= 2 ? { nom: p.nom, humeur: p.humeur, genere: !!p.genere, ia: !!p.ia, tete: p.tete || cables[0].src, cables, gain: 0, depuis: t, derive: t + hasard(25, 70) } : null;
  },
  // un des quinze patchs ecrits, selon l'humeur
  tirerEcrit(h, opt) {
    const A = this.auto;
    // un patch dont presque toutes les destinations sont tenues ne prend pas vie : on en tire un autre
    for (let essai = 0; essai < 6; essai++) {
      const poids = CV_PATCHS.map(x => {
        if (A.actuel && x.nom === A.actuel.nom) return 0;
        if (A.passes.slice(-3).includes(x.nom)) return 0.05;
        if (x.si) { try { if (!x.si()) return 0; } catch (e) { return 0; } }
        return x.humeur === "calme" ? 1.2 - h : x.humeur === "plein" ? 0.2 + h : 0.7;
      });
      let r = Math.random() * poids.reduce((a, b) => a + b, 0), p = null;
      for (let i = 0; i < poids.length && !p; i++) { r -= poids[i]; if (r <= 0 && poids[i] > 0) p = CV_PATCHS[i]; }
      const P = p ? this.instancier(p, opt) : null;
      if (P) return P;
    }
    return null;
  },
  changerPatch(t, nom) {
    const A = this.auto, h = this.humeur();
    let P = null;
    if (nom) { const p = CV_PATCHS.find(x => x.nom === nom); P = p ? this.instancier(p) : null; }
    else P = this.tirerSelon(h);
    // rien de possible (tout est tenu) : on reessaie dans vingt secondes, pas dans un cycle entier
    A.prochain = t + (P ? Math.max(1, S.cvRythme || 3) * 60 * hasard(0.8, 1.25) : 20);
    if (!P) return;
    // celui qui s'en va part de la ou il en est ; s'il en restait un plus ancien, il part tout de suite
    A.ancien = A.actuel;
    A.actuel = P;
    A.passes.push(P.nom); if (A.passes.length > 20) A.passes.shift();
    // le journal des patchs passes : leur nom, d'ou ils viennent, leurs cables
    A.journal.push({ t: +t.toFixed(1), nom: P.nom, humeur: +h.toFixed(2), genre: P.genere ? "généré" : P.ia ? "IA" : "écrit", mode: S.mode || "vjing",
      cables: P.cables.map(c => [c.src, c.dst, +c.q.toFixed(3), c.l]) });
    if (A.journal.length > 200) A.journal.shift();
  },
  patch() { return this.auto.actuel ? this.auto.actuel.nom : ""; },
  // le bouton : en mode auto, le patch suivant tout de suite ; sinon, un patch sur les cables a la main
  tirerPatch() {
    if (this.enAuto()) { this.changerPatch(this.maintenant()); this.majEtat(0, true); return; }
    const P = this.tirerSelon(this.humeur(), { sansMains: true });
    if (P) { this.poserALaMain(P.cables); this.dernierALaMain = P.nom; }
  },
  // « Patchs : ecrits / generes / ecrits et generes / inventes par l'IA / tous » : d'ou vient le
  // prochain, et a defaut (rien de possible), les autres origines dans l'ordre
  tirerSelon(h, opt) {
    const choix = S.cvPatchs || "tous", ia = this.banqueIA.length > 0, r = Math.random();
    let ordre;
    if (choix === "ecrits") ordre = ["ecrit"];
    else if (choix === "generes") ordre = ["genere"];
    else if (choix === "ia") ordre = ["ia", "genere"];
    else if (choix === "tous" && ia) ordre = r < 0.2 ? ["ecrit", "genere", "ia"] : r < 0.55 ? ["ia", "genere", "ecrit"] : ["genere", "ia", "ecrit"];
    else ordre = r < 0.25 ? ["ecrit", "genere"] : ["genere", "ecrit"];
    for (const o of ordre) {
      const P = o === "ecrit" ? this.tirerEcrit(h, opt) : o === "ia" ? this.tirerIA(h, opt) : this.generer(h, opt);
      if (P) return P;
    }
    return null;
  },

  /* -------- les patchs inventes par l'IA (ecran\banque-ia.json) */
  banqueIA: [], banqueTexte: null, banqueT: -999, banqueEtat: "",
  lireBanque() {
    this.banqueT = this.maintenant();
    if (typeof fetch !== "function") return;
    fetch(CV_BANQUE_IA + "?v=" + Date.now(), { cache: "no-store" }).then(r => r.ok ? r.text() : null).then(txt => {
      if (txt === this.banqueTexte) return;
      this.banqueTexte = txt;
      if (!txt) { this.banqueIA = []; this.banqueEtat = ""; return; }
      let brut;
      try { brut = JSON.parse(txt); } catch (e) { this.banqueIA = []; this.banqueEtat = "banque de l'IA illisible (JSON)"; return; }
      const liste = Array.isArray(brut) ? brut : brut && Array.isArray(brut.patchs) ? brut.patchs : [];
      const ok = [], noms = new Set();
      for (const p of liste.slice(0, 500)) { const v = this.validerPatch(p); if (v && !noms.has(v.nom)) { noms.add(v.nom); ok.push(v); } }
      this.banqueIA = ok;
      this.banqueEtat = "banque de l'IA : " + ok.length + " patch" + (ok.length > 1 ? "s" : "") + " gardé" + (ok.length > 1 ? "s" : "") + " sur " + liste.length;
    }).catch(() => { /* pas de fichier, pas de serveur : rien ne change */ });
  },
  // La validation d'un patch venu d'ailleurs : la grammaire, sans rien de l'instant (le script
  // Python peut l'imiter). Rend le patch corrige, ou null. Jamais d'erreur.
  validerPatch(p) {
    try {
      if (!p || typeof p !== "object" || !Array.isArray(p.cables)) return null;
      const humeur = ["calme", "plein", "tout"].includes(p.humeur) ? p.humeur : "tout";
      let modes = Array.isArray(p.modes) ? p.modes.map(String).filter(m => CV_MODE_SOURCES[m]) : [];
      if (!modes.length) modes = Object.keys(CV_MODE_SOURCES);
      const D = this.destinations(), vus = new Set(), cables = [];
      let sons = 0;
      for (const c of p.cables) {
        if (!Array.isArray(c) || cables.length >= 5) continue;
        let src = String(c[0] || "").trim(), q = Number(c[2]), l = Number(c[3]);
        const dst = String(c[1] || "").trim(), base = src.replace(/\+$/, ""), G = CV_GRAM_SRC[base];
        // une source connue (et sa version « + » seulement si elle existe)
        if (!G || (src !== base && !CV_SOURCES.some(x => x[0] === src))) continue;
        const X = CV_GRAM_DST[dst], estSon = CV_GRAM_SON.includes(dst), d = D[dst];
        // une destination qui change l'image (ou un cable de son au plus), jamais deux fois, jamais
        // la vieille tele, le stroboscope, le negatif
        if ((!X && !estSon) || !d || vus.has(dst) || CV_JAMAIS.has(dst) || (typeof VIEILLE_TELE !== "undefined" && VIEILLE_TELE.has(dst))) continue;
        if (estSon && sons >= 1) continue;
        if (X) {
          // la grammaire : une source rapide frappe, une lente glisse, une hauteur se pose
          let w = 0;
          for (const g of X.g.split(" ")) w = Math.max(w, CV_GRAM_LIENS[G[0]][g] || 0);
          if (!w || (X.lent && G[0] === "rapide")) continue;
          // une source de -1 a 1 sur un reglage qui ne fait que monter : sa version de 0 a 1
          // (un geste aussi : il ne frappe que vers le haut)
          if ((X.sens === 1 || d.type !== "image") && CV_BIPOLAIRE.has(src)) { if (CV_SOURCES.some(x => x[0] === src + "+")) src += "+"; else continue; }
        }
        if (!isFinite(q) || Math.abs(q) < 0.01) continue;
        q = clamp(q, -1, 1);
        if (X && d.type === "image") {
          // jamais plus d'une fois et demie l'ecart qui se voit (la vitesse : en part d'une base de 0,1)
          const h = (d.max - d.min) / 2, m = 1.5 * X.a[1] * (X.rel ? 0.1 : 1) / h;
          q = clamp(q, -m, m);
          if (X.sens === 1) q = Math.abs(q);
        } else if (X) q = Math.min(Math.abs(q), 1);
        else q = clamp(q, -0.6, 0.6);
        l = isFinite(l) ? clamp(l, 0, 1) : G[0] === "rapide" ? 0.05 : 0.4;
        if (X && X.lent) l = Math.max(l, 0.5);
        vus.add(dst); if (estSon) sons++;
        cables.push([src, dst, +q.toFixed(3), +l.toFixed(2)]);
      }
      // le son jamais en tete ; au moins deux cables, dont un qui se voit
      cables.sort((a, b) => CV_GRAM_SON.includes(a[1]) - CV_GRAM_SON.includes(b[1]));
      if (cables.length < 2 || CV_GRAM_SON.includes(cables[0][1])) return null;
      let nom = String(p.nom || "").replace(CV_TIRETS, ",").replace(/\s+,/g, ",").replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
      if (!nom) nom = this.nommer(cables.map(([src, dst, q, l]) => ({ src, dst, q, l })));
      return { nom, humeur, modes, cables, ia: true };
    } catch (e) { return null; }
  },
  // un patch de l'IA pour ce mode et cette humeur
  tirerIA(h, opt) {
    const A = this.auto, mode = S.mode || "vjing";
    const ok = this.banqueIA.filter(p => p.modes.includes(mode) && !(A.actuel && A.actuel.nom === p.nom));
    for (let essai = 0; essai < 6 && ok.length; essai++) {
      const poids = ok.map(x => (A.passes.slice(-6).includes(x.nom) ? 0.05 : 1) * (x.humeur === "calme" ? 1.2 - h : x.humeur === "plein" ? 0.2 + h : 0.7));
      let r = Math.random() * poids.reduce((a, b) => a + b, 0), p = null;
      for (let i = 0; i < ok.length && !p; i++) { r -= poids[i]; if (r <= 0) p = ok[i]; }
      const P = p ? this.instancier(p, opt) : null;
      if (P) return P;
    }
    return null;
  },
  // les listes que l'IA peut employer (pour le script qui lui demande des patchs)
  grammaire() {
    const D = this.destinations();
    return {
      sources: Object.keys(CV_GRAM_SRC).map(k => ({ cle: k, genre: CV_GRAM_SRC[k][0], famille: CV_GRAM_SRC[k][1], bipolaire: CV_BIPOLAIRE.has(k), plus: CV_SOURCES.some(x => x[0] === k + "+") })),
      destinations: Object.keys(CV_GRAM_DST).filter(c => D[c]).map(c => ({ cle: c, genres: CV_GRAM_DST[c].g, douce: !!CV_GRAM_DST[c].douce, sens: CV_GRAM_DST[c].sens === 1 ? "monte" : "deux", condition: !!CV_GRAM_DST[c].si })),
      son: CV_GRAM_SON.filter(c => D[c]), liens: CV_GRAM_LIENS,
    };
  },
  // « Garder ce patch » : il passe sur les cables a la main, la ou il en est (pas de saut), et le
  // patch automatique s'efface aussitot : avant, il continuait par-dessus et chaque cable comptait
  // deux fois (2026-10-19)
  garderPatch() {
    const A = this.auto, P = A.actuel;
    if (!P) return;
    const m = S.musique && musique.actif;
    const cables = P.cables.filter(c => !c.coupe).slice(0, CV_NB).map(c => Object.assign({}, c, { src: !m && CV_SANS_MUSIQUE[c.src] ? CV_SANS_MUSIQUE[c.src] : c.src }));
    this.poserALaMain(cables);
    cables.forEach((c, i) => { const x = this.mains[i + 1] || (this.mains[i + 1] = { lisse: 0 }); x.lisse = c.sortie || 0; });
    A.actuel = null;
    A.prochain = this.maintenant() + Math.max(1, S.cvRythme || 3) * 60;
    A.journal.push({ t: +this.maintenant().toFixed(1), nom: P.nom, genre: "gardé à la main", mode: S.mode || "vjing", cables: cables.map(c => [c.src, c.dst, +c.q.toFixed(3), c.l]) });
    this.dernierALaMain = P.nom;
    this.majEtat(0, true);
  },

  /* -------- le generateur */
  // h : l'humeur (0 calme, 1 plein). opt.sansMains : pour les cables a la main (ils seront remplaces)
  generer(h, opt) {
    const D = this.destinations(), pris = this.tenues(opt), mode = S.mode || "vjing";
    const MS = CV_MODE_SOURCES[mode] || CV_MODE_SOURCES.vjing, poesie = mode === "poesie";
    const audace = isFinite(Number(S.cvAudace)) ? clamp(Number(S.cvAudace), 0, 1) : 0.5;
    if (poesie) h = Math.min(h, 0.55);
    const humeur = h < 0.4 ? "calme" : h > 0.65 ? "plein" : "tout";
    const avant = this.auto.actuel;
    // les sources vivantes dans ce mode, et leur poids
    const sources = [];
    for (const k in CV_GRAM_SRC) {
      const G = CV_GRAM_SRC[k];
      if (!this.vivante(k)) continue;
      let w = MS[G[1]] != null ? MS[G[1]] : 1;
      if (G[0] === "rapide") w *= humeur === "calme" ? 0.6 : humeur === "plein" ? 1.4 : 1;
      if (avant && String(avant.tete).replace(/\+$/, "") === k) w *= 0.25;
      if (w > 0) sources.push([k, w]);
    }
    if (!sources.length) return null;
    // les destinations permises maintenant
    const dests = [];
    for (const c in CV_GRAM_DST) {
      const G = CV_GRAM_DST[c];
      if (!D[c] || pris.has(c) || CV_JAMAIS.has(c) || (typeof VIEILLE_TELE !== "undefined" && VIEILLE_TELE.has(c))) continue;
      if (G.si) { try { if (!G.si()) continue; } catch (e) { continue; } }
      // ce que la scene du moment ne lit pas (les sondes) ne changerait rien a l'image
      if (!this.agit(c)) continue;
      // en poesie, rien que des destinations douces ; au calme, presque
      if (!G.douce && (poesie || (humeur === "calme" && Math.random() > 0.15 + 0.3 * audace))) continue;
      dests.push(c);
    }
    const max = clamp(Math.round(Number(S.cvMaxCables) || 4), 2, 5);
    const [lo, hi] = humeur === "calme" ? [2, 3] : humeur === "plein" ? [3, 5] : [3, 4];
    let n = lo + Math.floor(Math.random() * (hi - lo + 1));
    if (Math.random() < audace * 0.4) n++;
    n = clamp(n, 2, max);
    const tirerPoids = l => { let r = Math.random() * l.reduce((a, x) => a + x[1], 0); for (const x of l) { r -= x[1]; if (r <= 0) return x[0]; } return l[l.length - 1][0]; };
    const cables = [], prises = new Set(), utilisees = [];
    for (let essai = 0; essai < n * 5 && cables.length < n; essai++) {
      // une source : parfois celle d'un cable deja pose (le patch se tient), sinon une autre
      let neuves = sources.filter(s => !utilisees.includes(s[0]));
      // le cable de tete se lit en moins de dix secondes : jamais une maree de neuf minutes
      if (!cables.length && neuves.some(s => !CV_PAS_EN_TETE.has(s[0]))) neuves = neuves.filter(s => !CV_PAS_EN_TETE.has(s[0]));
      const src = utilisees.length && (Math.random() < 0.3 || !neuves.length) ? tirer(utilisees) : tirerPoids(neuves);
      const genre = CV_GRAM_SRC[src][0], liens = CV_GRAM_LIENS[genre];
      // une destination de son genre, jamais deux fois ; deux coups de la carte au plus
      const coups = cables.filter(x => D[x.dst].type === "coup").length, cands = [];
      for (const c of dests) {
        if (prises.has(c)) continue;
        const G = CV_GRAM_DST[c];
        if (G.lent && genre === "rapide") continue;
        if (D[c].type === "coup" && coups >= 2) continue;
        let w = 0;
        for (const g of G.g.split(" ")) w = Math.max(w, liens[g] || 0);
        if (!w) continue;
        if (mode === "vjing" && G.g.includes("frappe")) w *= 1.3;
        if (poesie && G.g.includes("glisse")) w *= 1.3;
        if (humeur === "plein" && !G.douce) w *= 1.1 + audace * 0.6;
        // le genre qui n'est pas encore dans le patch passe devant (une frappe, une glisse...)
        if (!cables.some(x => CV_GRAM_DST[x.dst] && CV_GRAM_DST[x.dst].g.split(" ")[0] === G.g.split(" ")[0])) w *= 1.4;
        // en tete, ce qui se voit d'un coup sur toute l'image
        if (!cables.length && CV_TETE_VISIBLE.has(c)) w *= 2.5;
        cands.push([c, w]);
      }
      if (!cands.length) continue;
      // le cable de tete : ce qui change toute l'image, s'il y en a un de permis pour cette source
      const tete = !cables.length && cands.some(x => CV_TETE_VISIBLE.has(x[0])) ? cands.filter(x => CV_TETE_VISIBLE.has(x[0])) : cands;
      const dst = tirerPoids(tete);
      const cable = this.doser(src, dst, genre, audace, humeur, !cables.length);
      prises.add(dst);
      if (!cable) continue;
      cables.push(cable);
      if (!utilisees.includes(src)) utilisees.push(src);
    }
    // le son : un cable au plus, quand le son joue, jamais en tete (on l'entend, on ne le voit pas)
    if (cables.length >= 2 && cables.length < max && S.son && typeof son !== "undefined" && son.ctx && Math.random() < 0.2 + 0.3 * audace) {
      const libres = CV_GRAM_SON.filter(c => D[c] && !pris.has(c));
      if (libres.length) cables.push({ src: cables[0].src, dst: tirer(libres), q: +(hasard(0.3, 0.55) * (Math.random() < 0.75 ? 1 : -1)).toFixed(3), l: 0.3 });
    }
    if (cables.length < 2) return null;
    const P = this.instancier({ nom: this.nommer(cables), humeur, genere: true, tete: cables[0].src, cables: cables.map(c => [c.src, c.dst, c.q, c.l]) }, opt);
    return P;
  },
  // le plus haut que la source est montee depuis une minute (en valeur absolue)
  pic(k) {
    const plus = k.endsWith("+"), b = plus ? k.slice(0, -1) : k, V = this.vie;
    let lo = Infinity, hi = -Infinity;
    for (const C of V.cases.concat(V.cour ? [V.cour] : [])) { if (b in C.min) lo = Math.min(lo, C.min[b]); if (b in C.max) hi = Math.max(hi, C.max[b]); }
    if (!(hi >= lo)) return 0;
    return plus ? (hi + 1) / 2 : Math.max(Math.abs(lo), Math.abs(hi));
  },
  // la quantite et le lissage d'un cable : un ecart qui se voit (CV_GRAM_DST.a), rapporte a ce que
  // la source fait vraiment (une source qui ne monte qu'a 0,4 recoit une quantite plus forte), du
  // cote ou le reglage a de la place
  doser(src, dst, genre, audace, humeur, tete) {
    const G = CV_GRAM_DST[dst], d = this.destinations()[dst];
    if (!G || !d) return null;
    let amt = lerp(G.a[0], G.a[1], clamp(hasard(0.15, 0.65) + audace * 0.45, 0, 1));
    if (humeur === "calme") amt *= 0.85; else if (humeur === "plein") amt *= 1.1;
    if (tete) amt = Math.max(amt, lerp(G.a[0], G.a[1], 0.8));
    let s = src, q;
    const picDe = k => { const p = this.vie.cases.length >= 2 ? this.pic(k) : 0; return p > 0.08 ? clamp(p, 0.3, 1) : 0.8; };
    if (d.type === "image") {
      const base = Number(baseDe(dst)), h = (d.max - d.min) / 2;
      if (!isFinite(base)) return null;
      if (G.rel) amt *= Math.max(base, d.min + 0.02);
      const haut = d.max - base, bas = base - d.min;
      // une source de -1 a 1 sur un reglage sans place des deux cotes : sa version de 0 a 1
      if (CV_BIPOLAIRE.has(s) && (G.sens === 1 || haut < amt * 0.6 || bas < amt * 0.6)) {
        if (!CV_SOURCES.some(x => x[0] === s + "+")) return null;
        s = s + "+";
      }
      if (CV_BIPOLAIRE.has(s)) q = (Math.random() < 0.5 ? 1 : -1) * amt / h / picDe(s);
      else {
        let sens;
        if (G.sens === 1) sens = 1;
        else if (haut >= amt * 0.8 && bas >= amt * 0.8) sens = Math.random() < 0.65 ? 1 : -1;
        else sens = haut >= bas ? 1 : -1;
        const place = sens > 0 ? haut : bas;
        if (place < amt * 0.5) { amt = place * 0.9; if (amt < G.a[0] * 0.5) return null; }
        q = sens * amt / h / picDe(s);
      }
      // une source qui monte peu recoit une quantite forte : si un jour elle monte haut, jamais plus
      // d'une fois et demie l'ecart qui se voit (comme pour les patchs de l'IA)
      const qMax = 1.5 * G.a[1] * (G.rel ? Math.max(base, d.min + 0.02) : 1) / h;
      q = clamp(q, -qMax, qMax);
    } else {
      // un geste ne frappe que vers le haut : une source de -1 a 1 y passe par sa version de 0 a 1
      if (CV_BIPOLAIRE.has(s)) { if (!CV_SOURCES.some(x => x[0] === s + "+")) return null; s = s + "+"; }
      q = amt / picDe(s);
    }
    q = clamp(q, -1, 1);
    if (!(Math.abs(q) >= 0.01)) return null;
    // le lissage : une frappe suit l'attaque, une glisse coule, une hauteur se pose
    let l = genre === "rapide" ? (d.type === "image" ? 0.12 : 0.05) : genre === "hauteur" ? hasard(0.3, 0.5) : hasard(0.25, 0.45);
    if (G.lent) l = Math.max(l, 0.5);
    if (/^(motRare|motPoete|voixDebit|noteHauteur|noteDegre|hasardTemps)/.test(src)) l = Math.max(l, 0.4);
    return { src: s, dst, q: +q.toFixed(3), l: +l.toFixed(2) };
  },
  // un nom fabrique : « La rarete ouvre la lumiere », « Le kick fait trembler les mots »
  nommer(cables) {
    const phrase = c => {
      const G = CV_GRAM_SRC[String(c.src).replace(/\+$/, "")], X = CV_GRAM_DST[c.dst];
      if (!G || !X) return null;
      const p = tirer(c.q < 0 && X.neg ? X.neg : X.pos), i = p.indexOf(" "), v = p.slice(0, i).split("|");
      return G[2] + " " + (G[3] ? v[1] || v[0] : v[0]) + p.slice(i);
    };
    const tete = String(cables[0].src).replace(/\+$/, "");
    let nom = "";
    for (let essai = 0; essai < 8; essai++) {
      nom = phrase(cables[0]) || "Un patch";
      const autre = cables.find((c, i) => i > 0 && String(c.src).replace(/\+$/, "") !== tete && CV_GRAM_DST[c.dst]);
      if (autre && cables.length >= 3 && Math.random() < 0.4) { const p2 = phrase(autre); if (p2) nom += " et " + p2; }
      nom = nom.charAt(0).toUpperCase() + nom.slice(1);
      if (!this.auto.passes.slice(-12).includes(nom)) break;
    }
    return nom;
  },
  poserALaMain(cables) {
    for (let i = 1; i <= CV_NB; i++) {
      const c = cables[i - 1], k = "cv" + i;
      S[k + "Src"] = c ? c.src : "aucune"; S[k + "Dst"] = c ? c.dst : "aucune";
      if (c) { S[k + "Quantite"] = +clamp(c.q, -1, 1).toFixed(2); S[k + "Lissage"] = c.l; }
    }
    sauver();
    for (const k in controles) if (/^cv\d/.test(k)) controles[k].maj();
    this.majEtat(0, true);
  },
  toutDebrancher() {
    for (let i = 1; i <= CV_NB; i++) S["cv" + i + "Dst"] = "aucune";
    if (this.auto.actuel) { this.auto.ancien = this.auto.actuel; this.auto.actuel = null; this.auto.prochain = this.maintenant() + 60; }
    sauver();
    for (const k in controles) if (/^cv\d/.test(k)) controles[k].maj();
    this.majEtat(0, true);
  },

  /* -------- les sons font des mots */
  sonsFontDesMots(d, vel, duree, m, t) {
    const q = S.cvSonsMotsQuand, force = S.cvSonsMots;
    if (!S.cvActif || !(force > 0) || q === "jamais" || (q === "auto" && (S.mode || "vjing") !== "auto")) return;
    if (typeof main === "undefined" || !main.poserMot || !W) return;
    const e = this.ev;
    // pas plus d'un geste tous les 0,15 s, pas a chaque note (la force dose), six echos au plus :
    // chaque mot de la main se dessine avec son ombre lumineuse (mesure : 0,2 a 0,4 ms par echo)
    if (t - e.dernierEcho < 0.15 || Math.random() > force * (0.3 + 0.45 * clamp(vel, 0, 1))) return;
    e.echos = e.echos.filter(x => x.age < x.vie);
    if (e.echos.length >= 6) return;
    e.dernierEcho = t;
    const vu = m && this.vus.get(m), frais = vu && t - vu.t < 40;
    let fait = false;
    if (frais && Math.random() < 0.75) fait = Math.random() < 0.7 ? this.rallumer(vu, vel, duree) : this.eclater(vu, vel);
    if (!fait && Math.random() < 0.35 + 0.5 * force) fait = this.surgir(d, vel, duree);
    // et la scene recoit une impulsion de lumiere
    // (ce coup-la n'est pas un geste de la manette : la source mainGeste ne le compte pas)
    if (fait) { this.frappeMoi = true; try { main.frapper({ halo: 0.2 * clamp(vel, 0, 1) * force }); } finally { this.frappeMoi = false; } }
  },
  // le mot de la note se rallume la ou il a paru, gonfle et s'efface (il chante s'il est appuye)
  rallumer(vu, vel, duree) {
    const m = main.poserMot({ t: casse(vu.texte), poete: vu.poete }, vu.x, vu.y, 0, 0, 0.75,
      { vie: 1.6 + duree * 0.6, ne: 0.5 + 0.6 * clamp(vel, 0, 1), lueur: 0.35, chante: vel > 1 ? 0.9 : 0 });
    this.ev.echos.push(m);
    main.anneau(vu.x, vu.y, 0.25 * clamp(vel, 0.3, 1), couleurDe({ poete: vu.poete, ordre: 0 }));
    return true;
  },
  // le mot eclate en lettres, depuis la ou il a paru
  eclater(vu, vel) {
    const taille = main.taille() * 0.75, pol = police(taille), lettres = [...casse(vu.texte)];
    let acc = -mesurer(lettres.join(""), pol) / 2;
    for (const c of lettres) {
      const lw = mesurer(c, pol), dir = hasard(0, Math.PI * 2), sp = hasard(90, 380) * (0.5 + clamp(vel, 0, 1));
      main.eclats.push({ t: c, x: vu.x + acc + lw / 2, y: vu.y, vx: Math.cos(dir) * sp, vy: Math.sin(dir) * sp, ang: 0, va: hasard(-4, 4), pol, poete: vu.poete, ordre: 0, age: 0 });
      acc += lw;
    }
    if (main.eclats.length > 900) main.eclats.splice(0, main.eclats.length - 900);
    main.anneau(vu.x, vu.y, 0.45 * clamp(vel, 0.3, 1), palette().accent);
    return true;
  },
  // un mot rare du poeme surgit la ou la note est : sa hauteur donne y, sa place stereo donne x
  surgir(d, vel, duree) {
    const p = poemeCourant;
    if (!p) return false;
    if (this.ev.rarePoeme !== p) {
      this.ev.rarePoeme = p;
      const mots = [];
      try { for (const v of versDe(p)) for (const x of motsPleins(v.texte)) mots.push([x, v.poete, coursDe(x)]); } catch (e) { /* rien */ }
      this.ev.rares = mots.sort((a, b) => b[2] - a[2]).filter((x, i, l) => l.findIndex(y => y[0] === x[0]) === i).slice(0, 8);
    }
    const r = this.ev.rares;
    if (!r || !r.length) return false;
    const [texte, poete] = r[Math.floor(Math.pow(Math.random(), 1.6) * r.length)];
    const h = d.f > 0 ? clamp(Math.log2(d.f / 55) / 6, 0, 1) : Math.random();
    const x = W * clamp(0.5 + 0.38 * (Number(d.pan) || hasard(-0.6, 0.6)), 0.08, 0.92), y = H * clamp(0.88 - 0.76 * h, 0.08, 0.92) + hasard(-30, 30);
    const m = main.poserMot({ t: casse(texte), poete }, x, y, hasard(-0.12, 0.12), 0, 1 + 0.4 * clamp(vel, 0, 1),
      { vie: 2.6 + duree, ne: 0.8, lueur: 0.35, chante: Math.random() < 0.15 ? 0.8 : 0 });
    this.ev.echos.push(m);
    main.anneau(x, y, 0.35, couleurDe({ poete, ordre: 0 }));
    return true;
  },
  // de 0 a 1 : ce mot vient de chanter (pour qu'une scene allume ses lettres)
  eclat(texte) {
    const t = this.chants.get(this.normal(texte));
    return t === undefined ? 0 : Math.exp(-(this.maintenant() - t) / 1.2);
  },

  /* -------- le panneau : l'etat lisible (jamais sur l'image) */
  preparer() {
    this.pret = true;
    this.destinations();
    try { this.installerSondes(); } catch (e) { this.sondes = null; }
    const i = SCHEMA.findIndex(o => o.onglet === "Câbles");
    const page = typeof pagesEl !== "undefined" && i >= 0 ? pagesEl.children[i] : null;
    if (!page) return;
    this.page = page;
    const fs = document.createElement("fieldset");
    const lg = document.createElement("legend"); lg.textContent = "Où en sont les câbles"; fs.appendChild(lg);
    const r = document.createElement("div"); r.className = "rangee";
    const bouton = (texte, f, titre) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "bouton"; b.textContent = texte; b.style.minWidth = "0";
      if (titre) b.title = titre;
      b.addEventListener("click", f); r.appendChild(b); return b;
    };
    this.boutonTirer = bouton("Tirer un patch au hasard", () => this.tirerPatch(), "En mode full auto : le patch suivant tout de suite. Sinon : un patch sur les câbles à la main.");
    bouton("Garder ce patch (à la main)", () => this.garderPatch(), "Recopie le patch du mode full auto sur les câbles à la main.");
    bouton("Tout débrancher", () => this.toutDebrancher());
    fs.appendChild(r);
    this.etatEl = document.createElement("div");
    this.etatEl.style.cssText = "font:10px Consolas,monospace;white-space:pre-wrap;margin-top:6px;color:#222;line-height:1.35";
    fs.appendChild(this.etatEl);
    page.insertBefore(fs, page.firstChild);
  },
  majEtat(debut, force) {
    if (!this.etatEl || (!force && (panneau.hidden || this.page.hidden || debut - (this.dernierEtat || 0) < 250))) return;
    this.dernierEtat = debut;
    const barre = x => { const n = Math.round(clamp(Math.abs(x), 0, 1) * 8); return (x < 0 ? "−" : "+") + "█".repeat(n) + "·".repeat(8 - n); };
    const ligne = c => "  " + this.nomSource(c.src) + "\n    → " + this.nomDest(c.dst) + "  " + barre(c.sortie || 0);
    const L = [], A = this.auto, t = this.maintenant(), mn = s => s >= 60 ? Math.floor(s / 60) + " min " + String(Math.floor(s % 60)).padStart(2, "0") : Math.floor(s) + " s";
    if (!S.cvActif) L.push("Les câbles sont débranchés (case du haut).");
    if (this.enAuto()) {
      L.push((S.mode === "auto" ? "Mode full auto" : "Patchs automatiques") + " : « " + (A.actuel ? A.actuel.nom : "…") + " »");
      if (A.actuel) L.push("  " + (A.actuel.genere ? "généré" : A.actuel.ia ? "inventé par l'IA" : "écrit") + (A.actuel.genere && A.actuel.humeur ? ", humeur " + A.actuel.humeur : "") +
        ", depuis " + mn(t - A.actuel.depuis) + ", le suivant dans " + mn(Math.max(0, A.prochain - t)) + (A.actuel.gain < 1 ? " (entre : " + Math.round(A.actuel.gain * 100) + " %)" : ""));
      if (A.ancien) L.push("  il remplace « " + A.ancien.nom + " » (encore " + Math.round(A.ancien.gain * 100) + " %)");
      if (A.actuel) for (const c of A.actuel.cables) L.push(ligne(c) + (c.coupe ? "  (lâché : réglage repris)" : ""));
    } else L.push("Les patchs automatiques sont arrêtés (case « dans tous les modes ») : les câbles se règlent à la main.");
    // le journal des patchs passes (les quatre derniers avant celui-ci)
    const passes = A.journal.filter(j => !A.actuel || j.nom !== A.actuel.nom || j.genre === "gardé à la main").slice(-4).reverse();
    if (passes.length) L.push("", "Avant : " + passes.map(j => "« " + j.nom + " »" + (j.genre === "gardé à la main" ? " (gardé)" : "")).join(" · "));
    if (this.banqueEtat) L.push(this.banqueEtat + ".");
    const mains = this.mains.filter(c => c && c.src && c.src !== "aucune" && this.dests[c.dst]);
    L.push("", mains.length ? "À la main :" : "À la main : rien de branché.");
    for (const c of mains) L.push(ligne(c));
    const v = this.val;
    L.push("", "Notes " + (this.ev.notes.length / 4).toFixed(1) + "/s · mots " + (this.ev.mots.length / 4).toFixed(1) + "/s · rareté " +
      Math.round((v.motRare || 0) * 100) + " · avancée " + Math.round((v.avancee || 0) * 100) + " % · " + (this.cout || 0).toFixed(3) + " ms");
    const txt = L.join("\n");
    if (this.etatEl.textContent !== txt) this.etatEl.textContent = txt;
  },
};

/* ---------------------------------------------------- les branchements */

bus.ecouter("note", d => cv.surNote(d));
bus.ecouter("mot", d => cv.surMot(d));
bus.ecouter("vers", d => cv.surVers(d));
bus.ecouter("poeme", d => cv.nouveauPoeme(d && d.poeme));
bus.ecouter("coup", d => cv.surCoup(d));
bus.ecouter("syllabe", () => { cv.ev.syllabe = 1; });

// Chaque image, apres les LFO (et apres modes.maj, que modes.js fait passer par lfo.maj) : a integrer
// dans image() (orchestre.js) par un appel cv.maj() juste apres lfo.maj() ; en attendant, on passe
// par lfo.maj (cv.maj ne tourne qu'une fois par image, meme appele deux fois).
{
  const majAvant = lfo.maj;
  lfo.maj = function () {
    const r = majAvant.apply(this, arguments);
    try { cv.maj(); } catch (e) { const s = String(e && e.message); if (!cv.erreurs.has(s)) { cv.erreurs.add(s); console.error("poiasie : cables", e); } }
    return r;
  };
  // on enregistre la base d'un reglage sous un cable, jamais sa valeur du moment
  const aSauverAvant = lfo.aSauver;
  lfo.aSauver = function () {
    const r = aSauverAvant.apply(this, arguments);
    for (const c in cv.bases) if (!(c in DEPUIS_ADRESSE)) r[c] = cv.base(c);
    return r;
  };
}
// le son : son.js ouvre ses entrees aux cables (son.cv) ; s'il ne les ouvrait pas, ce que son.v rend
// recevrait l'ecart des cables (en octaves pour ce qui se compte en octaves), sans rien ecrire dans S
if (typeof son !== "undefined" && typeof son.v === "function" && !cv.entreesSon()) {
  const vAvant = son.v;
  son.v = function (cle) {
    const x = vAvant.apply(this, arguments), u = cv.son[cle];
    if (!u || typeof x !== "number") return x;
    const d = cv.dests && cv.dests[cle];
    if (!d) return x;
    return d.log ? clamp(x * Math.pow(2, u * 2), d.min, d.max) : clamp(x + u * (d.max - d.min) / 2, d.min, d.max);
  };
}
// l'onde de choc du geste coupChoc : la carte la dessine comme celle des temps forts (2026-10-19)
if (typeof gpu !== "undefined" && typeof gpu.valeurs === "function") {
  const chocDe = () => cv.choc.force * Math.max(0, 1 - cv.choc.age / 1.1);
  const valeursAvant = gpu.valeurs;
  gpu.valeurs = function () {
    const v = valeursAvant.apply(this, arguments), f = chocDe();
    if (f > 0.003 && f > (v.choc || 0)) { v.choc = f; v.chocR = cv.choc.age * 0.9; }
    return v;
  };
  const utileAvant = gpu.utile;
  gpu.utile = function () { return utileAvant.apply(this, arguments) || chocDe() > 0.005; };
}
// les gestes de la manette (rond, carre, triangle, macros) passent par main.frapper : c'est la
// source mainGeste (pas les coups des cables eux-memes, qui ecrivent main.impact directement)
if (typeof main !== "undefined" && typeof main.frapper === "function") {
  const frapperAvant = main.frapper;
  main.frapper = function (quoi) {
    if (!cv.frappeMoi && quoi) {
      let f = 0;
      for (const k in quoi) f = Math.max(f, Number(quoi[k]) || 0);
      cv.val.mainGesteBrut = Math.max(cv.val.mainGesteBrut || 0, clamp(f, 0, 1));
    }
    return frapperAvant.apply(this, arguments);
  };
}
// les sondes n'ecoutent que le dessin : le pilote (premier a lire les reglages dans l'image) les coupe
if (typeof pilote !== "undefined" && typeof pilote.maj === "function") {
  const pilotageAvant = pilote.maj;
  pilote.maj = function () { cv.ecoute = false; return pilotageAvant.apply(this, arguments); };
}
// le pilote ne branche pas un LFO sur un reglage qu'un cable fait deja bouger (sinon les deux bases
// derivent l'une dans l'autre) : le temps de son choix, ces reglages ne sont pas libres pour lui
if (typeof pilote !== "undefined" && typeof pilote.brancherLfo === "function") {
  const brancherAvant = pilote.brancherLfo;
  pilote.brancherLfo = function () {
    const pris = new Set(Object.keys(cv.bases));
    for (const P of [cv.auto.actuel, cv.auto.ancien]) if (P) for (const c of P.cables) pris.add(c.dst);
    const libreAvant = this.libre, soi = this;
    this.libre = function (c) { return !pris.has(c) && libreAvant.call(soi, c); };
    try { return brancherAvant.apply(this, arguments); } finally { this.libre = libreAvant; }
  };
}
// les mots gonflent (ou s'ecrasent) dans toutes les scenes : battementMots est ce que dessinerMot,
// poserLettre et ecrireGrand appellent pour la taille de chaque mot
if (typeof battementMots === "function") {
  const battementAvant = battementMots;
  battementMots = function (k) {
    if (cv.ecoute) cv.lu.gonfle = cv.imageN;
    const b = battementAvant(k);
    return cv.gonfle ? Math.max(0.15, b * (1 + cv.gonfle * k * 3)) : b;
  };
}
