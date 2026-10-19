"use strict";
/* ================================================================ le son */

// Le poeme se joue a son propre pas (2026-10-17, Jiiji : « plus de synthes, mais que ca reste
// tres minimaliste bruitiste », « plusieurs gammes, toutes, une par poeme, avec une cle
// differente », et tout allait trop vite). Avant, chaque mot qui paraissait sonnait une note :
// le son courait avec les images, et la plupart des scenes ne sonnaient pas. Maintenant, a chaque
// poeme, une gamme et une tonique sont tirees ; le poeme est lu mot a mot sur une horloge lente
// (celle du son, pas celle des images, ou le tempo de la musique). Chaque mot fait un pas dans la
// gamme (le mot donne le pas, toujours le meme pour le meme mot), le poete donne le timbre, l'octave
// et la place a gauche ou a droite ; un mot rare dure et brille ; une rime tinte en fin de vers.
// Sous les notes, un bourdon sur la tonique et de la poussiere. Rien ne sonne tant qu'on ne l'a pas
// demande (onglet Son), et le navigateur exige un premier clic.
//
// L'ordonnanceur (2026-10-18). Jiiji : « quand il y a beaucoup de mots qui apparaissent, c'est hyper
// joli quand il y a des jolis sons ; le probleme c'est que ca fait planter ma carte son parce qu'il y
// a trop de sons tout simplement, il faudrait que ca lisse et que ca cree quand meme un peu des
// patterns ». Toute note passe par son.voix, qui ne cree plus rien sans l'accord de l'ordonnanceur :
// un nombre de voix et de noeuds Web Audio borne (comptes a la creation, rendus a la fin de chaque
// voix), un debit maximal, une grille rythmique ou les gestes se posent ; en rafale on eclaircit, on
// regroupe en accords, puis une texture (grains, nappe) prend le relais au lieu de N notes. Le poeme
// se joue sur des motifs (rythme euclidien, arpege sur l'accord de la mesure, basse lente au premier
// temps) qui mutent de vers en vers et se repondent d'un poete a l'autre.
// Puis : « c'est vraiment plus joli quand c'est des notes facon synthes qui jouent ; les craquements
// c'est un peu dur » : six synthes de plus au premier plan (pad, pluck, piano FM, clochette, lead,
// basse), chorus, filtre qui respire, salle et echo soignes ; les bruits passent au fond (sonBruits).
// Et : « il faut que tous les sons soient dans la gamme ; la cloche n'a qu'une seule note » : chaque
// son prend sa hauteur dans la gamme du poeme (son.frequence, son.dansLaGamme), la cloche change de note.

// les synthes ajoutes (premier plan) ; la liste des timbres et le choix de l'onglet Son les recoivent
const TIMBRES_AJOUTES = [["pad", "Nappe de synthé (pad)"], ["pluck", "Pluck (synthé pincé)"], ["fmdoux", "Piano électrique (FM douce)"],
  ["clochette", "Clochette (FM douce)"], ["lead", "Lead filtré"], ["basse", "Basse en notes"],
  ["marimba", "Marimba (lame de bois)"], ["kalimba", "Kalimba (lame pincée)"], ["boite", "Boîte à musique"],
  ["vibraphone", "Vibraphone"], ["celesta", "Célesta"], ["steel", "Steel drum"], ["koto", "Koto (corde pincée claire)"],
  ["guitare", "Guitare étouffée"], ["analog", "Pluck analogique"], ["rhodes", "Rhodes"], ["glock", "Glockenspiel"],
  ["fente", "Tambour à fente"], ["woodblock", "Bloc de bois accordé"], ["tubulaire", "Cloche tubulaire"],
  ["sub", "Sub court"], ["bassesynth", "Basse de synthé ronde"]];
// les timbres agreables (le hasard et l'evolution les preferent) et ceux qui sont du bruit (au fond)
// Puis (2026-10-19, Jiiji : « les sons de basses toujours en drone, ca manque de son en note », « c'est des
// lettres qui apparaissent, ca devrait pouvoir etre plus percussif ») : le tirage ne garde que des timbres
// qui frappent ; nappes, souffles, gresils, sirene et chimere restent au choix, a la main.
const TIMBRES_DOUX = ["pluck", "fmdoux", "clochette", "marimba", "kalimba", "boite", "corde", "sinus", "peau",
  "vibraphone", "celesta", "steel", "koto", "guitare", "analog", "rhodes", "glock", "fente", "woodblock", "tubulaire"];
const TIMBRES_BRUITS = new Set(["souffle", "gresil", "ondes"]);
(function ajouterAuSon() {
  for (const t of TIMBRES_AJOUTES) if (!TIMBRES_NOMS.some(x => x[0] === t[0])) TIMBRES_NOMS.push(t);
  const onglet = SCHEMA.find(o => o.onglet === "Son");
  for (const g of (onglet && onglet.groupes) || []) for (const it of g.items || [])
    if (it.cle === "sonTimbre") for (const t of TIMBRES_AJOUTES) if (!it.options.some(x => x[0] === t[0])) it.options.push(t);
  // chaque mouvement de l'evolution gagne ses synthes
  const synthes = { "épars": ["kalimba", "boite", "clochette", "glock", "celesta"], "nappe": ["fmdoux", "marimba", "vibraphone", "rhodes"],
    "grains": ["pluck", "marimba", "kalimba", "woodblock", "fente", "analog", "guitare"], "rouille": ["fmdoux", "lead", "steel", "koto"],
    "clair": ["boite", "clochette", "fmdoux", "glock", "celesta", "vibraphone"], "presque rien": ["boite", "kalimba", "tubulaire", "celesta"] };
  for (const m of SON_MOUVEMENTS) if (m.timbres && synthes[m.nom]) for (const x of synthes[m.nom]) if (!m.timbres.includes(x)) m.timbres.push(x);
})();
ajouterReglages("Son", "Quand les mots se bousculent", [
  { cle: "sonVoixMax", nom: "Voix en même temps, au plus (la carte son ne sature plus)", type: "curseur", min: 6, max: 48, pas: 1 },
  { cle: "sonDebit", nom: "Notes par seconde, au plus", type: "curseur", min: 1, max: 30, pas: 1 },
  { cle: "sonGrille", nom: "Les notes des gestes se posent sur une grille", type: "choix", options: [["0", "non : la note part tout de suite"],
    ["2", "d'un demi-battement"], ["4", "d'un quart de battement"], ["8", "d'un huitième de battement"], ["16", "d'un seizième de battement"]] },
  { cle: "sonTexture", nom: "Au-delà, une texture prend le relais", type: "choix", options: [["grains", "Des grains qui s'épaississent"],
    ["nappe", "Une nappe"], ["deux", "Grains et nappe"], ["aucune", "Aucune (le surplus se tait)"]] },
  { cle: "sonTextureSeuil", nom: "La texture prend le relais à partir de (mots par seconde)", type: "curseur", min: 2, max: 30, pas: 1 },
], { sonVoixMax: 16, sonDebit: 8, sonGrille: "4", sonTexture: "grains", sonTextureSeuil: 8 });
// La banque de patterns (2026-10-19, Jiiji : « faut creer une banque de patterns. Quand ca part en musique
// c'est tellement bien »). Comme sur une boite a rythmes ou un sequenceur : r, le rythme de la melodie
// (x : une note, X : une note accentuee, . : un silence) ; t, la melodie en tons de l'accord (0 la
// fondamentale, 1 la tierce, 2 la quinte, 3 l'octave...) ou d, en degres de la gamme ; b, la basse temps
// par temps (null : le temps se tait), ou sur le rythme br ; p, la suite d'accords (degres, pour une
// gamme de sept notes) ; sub, les pas par temps (2 par defaut) ; double, une seconde voix (en degres) ;
// g, les gammes qu'il prefere quand la gamme est tiree au hasard ; humeur et energie, pour le choix.
const SON_PATTERNS = [
  // les arpeges
  { cle: "arpege", nom: "Arpège qui monte", humeur: "calme", energie: 0.4, r: "x.x.x.x.", t: [0, 1, 2, 3], b: [0, null, 2, null], p: [0, 5, 3, 4] },
  { cle: "arpegeBas", nom: "Arpège qui descend", humeur: "calme", energie: 0.4, r: "x.x.x.x.", t: [3, 2, 1, 0], b: [0, null, 0, null], p: [0, 3, 4, 0] },
  { cle: "alberti", nom: "Basse d'Alberti", humeur: "lumineux", energie: 0.6, r: "xxxxxxxx", t: [0, 2, 1, 2], b: [0, null, 2, null], p: [0, 4, 5, 3] },
  { cle: "arpegeLong", nom: "Arpège sur deux octaves", humeur: "lumineux", energie: 0.55, r: "xxxxxxxx", t: [0, 1, 2, 3, 4, 5, 4, 3], b: [0, null, null, null], p: [0, 5, 3, 4] },
  // les minimalistes
  { cle: "reich", nom: "Phase (Reich)", humeur: "vif", energie: 0.75, r: "xxxxxxxxxxxx", d: [0, 1, 4, 5, 6, 1, 0, 5, 4, 1, 6, 5], b: [0, null, null, 0], p: [0, 0, 5, 5], sub: 3 },
  { cle: "glass", nom: "Arpège additif (Glass)", humeur: "vif", energie: 0.65, r: "xxxxxxxxx", t: [0, 1, 0, 1, 2, 0, 1, 2, 3], b: [0, null, null], p: [0, 5, 3, 4], sub: 3 },
  { cle: "glassSix", nom: "Arpège en six (Glass)", humeur: "sombre", energie: 0.7, r: "xxxxxxxxxxxx", t: [0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2], b: [0, null, null, 0], p: [0, 5, 3, 4], sub: 3 },
  { cle: "riley", nom: "Pulsation (Riley)", humeur: "vif", energie: 0.7, r: "XxXxXxXx", t: [3, 3, 4, 3, 3, 3, 2, 3], b: [0, null, 2, null], p: [0, 0, 3, 4] },
  { cle: "pedale", nom: "Pédale", humeur: "calme", energie: 0.3, r: "x.......x...x...", t: [3, 2, 1, 2], b: [0, 0, 0, 0, 0, 0, 0, 0], p: [0, 3, 0, 4] },
  // les rythmes : euclidiens et polyrythmes
  { cle: "tresillo", nom: "Tresillo (3 sur 8)", humeur: "vif", energie: 0.55, r: "X..x..x.", t: [0, 1, 2], b: [0, null, 2, null], p: [0, 3, 4, 0] },
  { cle: "cinquillo", nom: "Cinquillo (5 sur 8)", humeur: "vif", energie: 0.65, r: "X.xx.xx.", t: [0, 2, 1, 2, 3], b: [0, 0, 2, 0], p: [0, 4, 5, 3] },
  { cle: "clocheAfricaine", nom: "Cloche africaine (7 sur 12)", humeur: "vif", energie: 0.75, r: "X.x.xx.x.x.x", t: [0, 1, 2, 1, 3, 2, 1], b: [0, null, null, 2], p: [0, 0, 3, 4], sub: 3 },
  { cle: "bossa", nom: "Bossa (5 sur 16)", humeur: "calme", energie: 0.5, r: "X..x..x...x..x..", t: [0, 2, 1, 3, 2], b: [0, null, 2, null, 0, null, 2, null], p: [0, 1, 4, 0] },
  { cle: "troisQuatre", nom: "Trois contre quatre", humeur: "vif", energie: 0.6, r: "X...x...x...", t: [0, 2, 3], br: "x..x..x..x..", b: [0, 2, 1, 2], p: [0, 5, 3, 4], sub: 3 },
  { cle: "contretemps", nom: "Contretemps", humeur: "vif", energie: 0.6, r: ".x.x.x.x", t: [1, 2, 1, 3], b: [0, 0, 0, 0], p: [0, 4, 5, 3] },
  { cle: "decale", nom: "Battement décalé (3-3-3-3-2-2)", humeur: "vif", energie: 0.7, r: "X..x..x..x..x.x.", t: [0, 1, 2, 3, 2, 1], b: [0, null, null, null, 2, null, null, null], p: [0, 3, 4, 0] },
  { cle: "cinqTemps", nom: "Danse à cinq temps", humeur: "vif", energie: 0.6, r: "X.x.xX.x.x", t: [0, 1, 2, 1, 3, 2], b: [0, null, 2, null, null], p: [0, 4, 3, 4] },
  // les marches
  { cle: "marcheMonte", nom: "Marche qui monte", humeur: "lumineux", energie: 0.5, r: "xxxxxxxxxxxx", d: [0, 1, 2, 1, 2, 3, 2, 3, 4, 3, 4, 5], b: [0, null, null, 0], p: [0, 3, 4, 0], sub: 3 },
  { cle: "marcheDescend", nom: "Marche qui descend", humeur: "sombre", energie: 0.5, r: "xxxxxxxxxxxx", d: [7, 6, 5, 6, 5, 4, 5, 4, 3, 4, 3, 2], b: [0, null, null, 2], p: [0, -2, -3, -1], sub: 3 },
  { cle: "tierces", nom: "Tierces parallèles", humeur: "lumineux", energie: 0.5, r: "x.x.x.x.", d: [0, 1, 2, 3, 4, 3, 2, 1], double: 2, b: [0, null, 0, null], p: [0, 5, 3, 4] },
  // le gamelan
  { cle: "kotekan", nom: "Kotekan (gamelan)", humeur: "vif", energie: 0.85, r: "xxxxxxxxxxxxxxxx", d: [0, 2, 1, 2, 0, 2, 1, 2, 3, 2, 1, 2, 0, 2, 1, 2], b: [0, null, null, null], p: [0, 0, 0, 0], sub: 4, g: ["pelog", "slendro"] },
  { cle: "gong", nom: "Cycle de gong (gamelan)", humeur: "calme", energie: 0.35, r: "x.......x...x.x.", d: [4, 2, 3, 1], b: [0, null, null, null, null, null, null, null], p: [0, 0, 0, 0], g: ["pelog", "slendro"] },
  { cle: "balungan", nom: "Balungan (gamelan)", humeur: "calme", energie: 0.45, r: "x.x.x.x.", d: [2, 3, 2, 1, 2, 3, 5, 4], b: [0, null, null, null], p: [0, 0, 0, 0], g: ["pelog", "slendro"] },
  // la boite a musique
  { cle: "valse", nom: "Valse de boîte à musique", humeur: "lumineux", energie: 0.4, r: "X.x.x.", t: [3, 4, 4], b: [0, null, null], p: [0, 4, 0, 3], g: ["majeur", "pentaMaj"] },
  { cle: "berceuse", nom: "Berceuse", humeur: "calme", energie: 0.3, r: "x..x..x..x..", d: [4, 2, 3, 1, 2, 0], b: [0, null, null, null], p: [0, 3, 4, 0], sub: 3, g: ["majeur", "pentaMaj"] },
  { cle: "carillon", nom: "Carillon", humeur: "lumineux", energie: 0.45, r: "x.x.x.x.x.x.x...", d: [2, 0, 1, -3, -3, 1, 2, 0], b: [0, null, null, null, 0, null, null, null], p: [0, 0, 4, 0] },
  { cle: "horloge", nom: "Horloge", humeur: "calme", energie: 0.45, r: "x.x.x.x.", t: [3, 2, 3, 2], b: [0, null, null, null], p: [0, 4, 0, 4] },
  // le jeu video
  { cle: "huitBits", nom: "Arpège 8 bits", humeur: "vif", energie: 0.85, r: "xxxxxxxxxxxxxxxx", t: [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 4, 3, 2, 1, 2, 3], b: [0, null, 0, null], p: [0, 5, 3, 4], sub: 4 },
  { cle: "donjon", nom: "Donjon", humeur: "sombre", energie: 0.5, r: "x.x.x.xx", d: [0, 1, 0, -1, 0, 2, 1, 0], b: [0, null, 0, null], p: [0, 0, -2, -1], g: ["harmonique", "phrygien"] },
  { cle: "fanfare", nom: "Fanfare", humeur: "lumineux", energie: 0.8, r: "X.xxx..X", t: [0, 1, 2, 3, 3], b: [0, 0, 2, 0], p: [0, 3, 4, 0] },
  { cle: "village", nom: "Village (jeu de rôle)", humeur: "calme", energie: 0.45, r: "x.xx.x.x", d: [0, 2, 4, 2, 3, 1], b: [0, null, 2, null], p: [0, 3, 0, 4], g: ["majeur", "mixolydien"] },
  // les basses et les reponses
  { cle: "marchante", nom: "Basse qui marche", humeur: "vif", energie: 0.6, r: "x...x...", t: [2, 3], b: [0, 1, 2, 1], p: [0, 5, 3, 4] },
  { cle: "appel", nom: "Appel et réponse", humeur: "vif", energie: 0.55, r: "xxx.....xxx.....", d: [0, 1, 2, 4, 3, 2], b: [0, null, null, null, 2, null, null, null], p: [0, 4, 3, 0] },
  { cle: "ostinato", nom: "Ostinato sombre", humeur: "sombre", energie: 0.6, r: "x.xx.x.x", d: [0, -1, 0, 2, 1, 0, -1, 0], b: [0, null, 0, null], p: [0, -1, -2, -1] },
  { cle: "quintes", nom: "Ostinato de quintes", humeur: "sombre", energie: 0.5, r: "x..x..x.", t: [0, 2, 0], b: [0, null, 0, null], p: [0, 0, -2, -1] },
  { cle: "pluie", nom: "Pluie lente", humeur: "calme", energie: 0.25, r: "x.....x...x.....", t: [3, 1, 4, 0], b: [0, null, null, null, null, null, null, null], p: [0, 5, 3, 4] },
  { cle: "presqueRien", nom: "Presque rien", humeur: "calme", energie: 0.15, r: "x...............", t: [3, 2, 4, 1], b: [0, null, null, null, null, null, null, null], p: [0, 3, 0, 4] },
];
ajouterReglages("Son", "Motifs", [
  { cle: "sonPattern", nom: "Motifs", type: "choix", options: [["motif", "Arpèges et basse dans la gamme, qui mutent de vers en vers"],
    ["rythme", "Le rythme seulement (euclidien), les notes au hasard"], ["aucun", "Aucun (au hasard, comme avant)"]] },
  { cle: "sonBasse", nom: "Basse lente (au premier temps de chaque mesure)", type: "curseur", min: 0, max: 1, pas: 0.05 },
  { cle: "sonBanque", nom: "Pattern", type: "choix", options: [["auto", "Selon l'humeur, l'énergie et le mode"], ["hasard", "Au hasard, un par poème"],
    ["aleatoire", "Inventé à chaque poème (euclidien)"]].concat(SON_PATTERNS.map(x => [x.cle, x.nom])) },
  { cle: "sonContinu", nom: "Le pattern joue seul entre les mots (la musique part, les mots la colorent)", type: "case" },
], { sonPattern: "motif", sonBasse: 0.45, sonBanque: "auto", sonContinu: true });
ajouterReglages("Son", "Synthés et fond", [
  { cle: "sonChorus", nom: "Chorus (les notes s'élargissent)", type: "curseur", min: 0, max: 1, pas: 0.05 },
  { cle: "sonRespire", nom: "Le filtre respire", type: "curseur", min: 0, max: 1, pas: 0.05 },
  { cle: "sonBruits", nom: "Bruits (craquements, grésil, souffle) : au fond ↔ devant", type: "curseur", min: 0, max: 1, pas: 0.05 },
  { cle: "sonSalle", nom: "Durée de la salle (secondes)", type: "curseur", min: 0.5, max: 5, pas: 0.1 },
  { cle: "sonTics", nom: "Un tic doux quand un mot paraît (ses lettres se posent)", type: "curseur", min: 0, max: 1, pas: 0.05 },
  { cle: "sonSyllabes", nom: "Les syllabes lues au micro jouent des notes (mode poésie)", type: "case" },
], { sonChorus: 0.45, sonRespire: 0.35, sonBruits: 0.3, sonSalle: 1.8, sonTics: 0.3, sonSyllabes: true });
// la modulation respire (2026-10-19, Jiiji : « c'est bien qu'on puisse la regler, mais faut pas qu'elle soit
// activee tout le temps, c'est chiant en vrai ») : elle va et vient d'elle-meme. Les curseurs de
// modulation gardent leur valeur ; la respiration les multiplie de 0 a 1, sans jamais ecrire dans S.
ajouterReglages("Son", "La modulation respire", [
  { cle: "sonModPart", nom: "La modulation est là… (part du temps)", type: "curseur", min: 0, max: 1, pas: 0.05 },
  { cle: "sonModRythme", nom: "Elle vient", type: "choix", options: [["temps", "sur un cycle de quelques minutes"], ["poemes", "certains poèmes"],
    ["vers", "certains vers"], ["toujours", "toujours (comme avant)"]] },
  { cle: "sonModCycle", nom: "Durée d'un cycle (minutes)", type: "curseur", min: 0.5, max: 15, pas: 0.5 },
  { cle: "sonModEvenements", nom: "Un drop ou un mot très rare l'appelle quelques secondes", type: "case" },
], { sonModPart: 0.33, sonModRythme: "temps", sonModCycle: 3, sonModEvenements: true });
// Le nouveau defaut musical, pose une fois (Jiiji l'a demande expressement, 2026-10-19) : melodie pincee
// sur les mots, basse en notes courtes, accords rares, salle courte, plus de bourdon, plus de tremolo
// (« le tremolo je le mets toujours a 0 »). Les reglages qu'il change ensuite restent les siens.
const SON_NOTES = { sonBourdon: 0, sonTremolo: 0, sonTenue: 0.8, sonAttaque: 0.05, sonAccords: 0.12, sonReverb: 0.3, sonSalle: 1.8,
  sonEcho: 0.22, sonBruit: 0.03, sonPoussiere: 0.04, sonMetal: 0.2, sonBasse: 0.55, sonPattern: "motif", sonGlisse: 0.04, sonVibrato: 0.05,
  sonUsure: 0.06, sonBalayage: 0.15, sonResonance: 0.15, sonSature: 0, sonHasard: 0, sonTimbre: "derive", sonTics: 0.3 };
if (!(Number(STOCKE.sonVersion) >= 2)) {
  for (const k in SON_NOTES) if (!(k in DEPUIS_ADRESSE)) S[k] = SON_NOTES[k];
  S.sonVersion = 2;
}
DEFAUTS.sonVersion = 2;
// un reglage a 0 reste coupe : l'evolution et les derives ne le rallument pas (avant, le tremolo a 0
// derivait jusqu'a 0,09)
const SON_ZERO_COUPE = new Set(["sonTremolo", "sonHasard", "sonBegaiement", "sonSature", "sonBourdon", "sonPoussiere", "sonBruit", "sonUsure"]);
// la voix dans le son (2026-10-19, Jiiji : « faudrait des effets pour la voix, au moins une rev et un
// delay ») : le micro deja ecoute par l'onglet Musique ressort de l'ecran avec ses effets. Coupe par
// defaut ; la voix seche a 0 (sa voix est sans doute deja dans la sono : l'ecran n'ajoute que les effets)
ajouterReglages("Son", "La voix dans le son", [
  { cle: "sonVoix", nom: "La voix du micro passe dans les effets (casque, ou une voie de la table)", type: "case" },
  { cle: "sonVoixNiveau", nom: "Niveau de la voix", type: "curseur", min: 0, max: 1.5, pas: 0.05 },
  { cle: "sonVoixSec", nom: "Voix sèche (0 : seulement les effets)", type: "curseur", min: 0, max: 1, pas: 0.05 },
  { cle: "sonVoixDouble", nom: "Voix doublée (un chorus léger)", type: "curseur", min: 0, max: 1, pas: 0.05 },
  { cle: "sonVoixRev", nom: "Réverbération", type: "curseur", min: 0, max: 1, pas: 0.05 },
  { cle: "sonVoixSalle", nom: "Durée de la salle (secondes)", type: "curseur", min: 0.5, max: 8, pas: 0.1 },
  { cle: "sonVoixRevClarte", nom: "Clarté de la salle (sourde ↔ brillante)", type: "curseur", min: 800, max: 12000, pas: 100 },
  { cle: "sonVoixEcho", nom: "Écho", type: "curseur", min: 0, max: 1, pas: 0.05 },
  { cle: "sonVoixRetour", nom: "Retour de l'écho (plafonné : il retombe toujours)", type: "curseur", min: 0, max: 0.75, pas: 0.05 },
  { cle: "sonVoixTemps", nom: "L'écho revient après", type: "choix", options: [["250", "250 ms"], ["380", "380 ms"], ["500", "500 ms"],
    ["750", "750 ms"], ["1000", "une seconde"], ["b0.5", "un demi-battement (son ou musique)"], ["b0.75", "trois quarts de battement"],
    ["b1", "un battement"], ["b1.5", "un battement et demi"]] },
  { cle: "sonVoixNotes", nom: "L'écho se perd dans la salle des notes", type: "curseur", min: 0, max: 1, pas: 0.05 },
  { cle: "sonVoixHp", nom: "Coupe les graves sous (Hz)", type: "curseur", min: 40, max: 400, pas: 10 },
  { cle: "sonVoixLp", nom: "Coupe les aigus au-dessus de (Hz)", type: "curseur", min: 2000, max: 16000, pas: 250 },
], { sonVoix: false, sonVoixNiveau: 0.8, sonVoixSec: 0, sonVoixDouble: 0, sonVoixRev: 0.35, sonVoixSalle: 2.5, sonVoixRevClarte: 5000,
  sonVoixEcho: 0.25, sonVoixRetour: 0.35, sonVoixTemps: "380", sonVoixNotes: 0, sonVoixHp: 120, sonVoixLp: 12000 });
// les entrees des cables (cv.js) qui ne sont pas dans SON_BORNES : [plancher, plafond, en octaves]
const SON_CV_BORNES = { sonChorus: [0, 1], sonRespire: [0, 1], sonBruits: [0, 1], sonBasse: [0, 1],
  sonVoixRev: [0, 1], sonVoixEcho: [0, 1], sonVoixRetour: [0, 0.75], sonVoixDouble: [0, 1] };

const son = {
  ctx: null, entree: null, maitre: null, taire: null, prochain: 0, minuteur: null,
  gi: 0, tonique: 0, degreCourant: 0, poemes: 0, partition: [], curseur: 0, file: [], timbresTires: {},
  cordes: new Map(), cordesTaille: 0, bruitBuf: null, ondes: {}, chimere: null, hauteurs: null, derniereF: 0, ticsUI: 0,
  // l'evolution : les mouvements, la courbe du poeme, les derives, les timbres qui changent
  arc: {}, derives: {}, ordreMvt: [], mvtA: null, mvtB: null, mvtMelange: 0, dernierEvol: 0, debutEvol: 0, cycleCourant: 0, timbresDerive: {},
  // l'ordonnanceur : les voix qui sonnent, les noeuds crees, le debit, les cases de la grille
  actives: [], crees: 0, fixes: 0, estimes: {}, jetons: 4, dernierJeton: 0, densite: 0, derniereDemande: 0, cases: new Map(),
  grainsJetons: 12, grainsT: 0, stats: null, horloge: null, journal: null, origine: 0, profondeur: 0, recents: new Map(),
  muet: false, auDessus: 0, enDessous: 0, dernierTic: 0, echoBouge: -99, cvAvant: "",
  // les motifs : le rythme, l'arpege, l'accord de la mesure, les vers
  motif: null, motifA: null, pasM: 0, mesure: -1, finMesure: 0, racine: 0, jArp: 0, jBurst: 0, vers: 0, poeteVers: "", cloches: 0,
  // les cables (cv.js) : chaque entree, de -1 a 1, s'ajoute au reglage (en octaves pour la clarte, le
  // tempo et la duree des notes ; « texture » : -1 tout en notes, +1 la texture prend vite le relais)
  cv: { sonFiltre: 0, sonResonance: 0, sonEcho: 0, sonReverb: 0, sonDensite: 0, sonTempo: 0, sonOctave: 0, sonTenue: 0, sonMetal: 0,
    sonVibrato: 0, sonBalayage: 0, sonAccords: 0, sonChorus: 0, sonRespire: 0, sonBruits: 0, sonBasse: 0, texture: 0,
    sonVoixRev: 0, sonVoixEcho: 0, sonVoixRetour: 0, sonVoixDouble: 0, modulation: 0, energie: 0 },
  CV_NOMS: [["sonFiltre", "Son : clarté"], ["sonResonance", "Son : résonance"], ["sonEcho", "Son : écho"], ["sonReverb", "Son : réverbération"],
    ["sonDensite", "Son : densité"], ["sonTempo", "Son : tempo"], ["sonOctave", "Son : octave"], ["sonTenue", "Son : durée des notes"],
    ["sonMetal", "Son : métal"], ["sonVibrato", "Son : vibrato"], ["sonBalayage", "Son : filtre sur la note"], ["sonAccords", "Son : accords"],
    ["sonChorus", "Son : chorus"], ["sonRespire", "Son : le filtre respire"], ["sonBruits", "Son : bruits"], ["sonBasse", "Son : basse"],
    ["texture", "Son : texture ↔ notes"], ["sonVoixRev", "Voix : réverbération"], ["sonVoixEcho", "Voix : écho"],
    ["sonVoixRetour", "Voix : retour de l'écho"], ["sonVoixDouble", "Voix : doublée"], ["modulation", "Son : la modulation est là"],
    ["energie", "Son : énergie (choix du pattern, densité)"]],
  // la respiration de la modulation : modG va de 0 (notes nettes) a 1 (les curseurs de modulation) en
  // quelques secondes ; modVers, modPoeme : le tirage des vers et des poemes ; modAppel : jusqu'a quand
  // un evenement (drop, mot rare) la garde
  motsPoeme: new Set(), motsTiques: new Set(), attention: 1, attentionT: 0, ticSilence: 0, ticPhrase: 0, ticPhraseT: 0, ticsCoupes: false,
  modG: 0, modVers: false, modPoeme: false, modAppel: -9, modDernier: 0, modDrop: 0,
  // ce que la voix traitee donne aux cables : son niveau (0 a 1 environ), et vrai pendant un larsen
  voixNiveau: 0, voixLarsen: false,
  POETES_ORIGINE: new Set(["Le lyrique", "Le minimaliste", "Le surréaliste", "Le surrealiste", "Le sonore", "Le brut"]),
  POETES: { "Le lyrique": ["fmdoux", 0, -0.5], "Le minimaliste": ["boite", 0, 0.7], "Le surréaliste": ["clochette", 0, 0.25],
    "Le surrealiste": ["clochette", 0, 0.25], "Le sonore": ["pluck", 0, -0.8], "Le brut": ["marimba", -1, 0.9] },
  // la duree la plus longue d'une note, par timbre : ce qui frappe ne tient pas (avant, une note pouvait
  // durer 14 s et le grave restait en nappe)
  DUREES: { pluck: 1.2, marimba: 0.9, kalimba: 1.6, boite: 1.8, fmdoux: 2.2, clochette: 2.8, corde: 2.5, sinus: 1.8, lead: 1.2,
    basse: 0.6, peau: 0.8, goutte: 0.8, verre: 3, orgue: 2.5, voyelle: 3, nuee: 4, pad: 5, chimere: 2.5, sirene: 3,
    vibraphone: 2.5, celesta: 1.3, steel: 1.2, koto: 1.6, guitare: 0.4, analog: 0.6, rhodes: 2.5, glock: 1.5, fente: 0.5,
    woodblock: 0.2, tubulaire: 3.5, sub: 0.4, bassesynth: 0.5 },
  // le volume de chaque timbre, egalise (mesure le 2026-10-19 : RMS de trois notes, le pluck pour reference ;
  // on n'applique que la racine du rapport, sinon un son tres court comme le bloc de bois aurait une
  // crete trop forte ; les basses sont egalisees sur la basse)
  EGAL: { marimba: 0.79, kalimba: 0.79, vibraphone: 0.84, celesta: 0.87, steel: 1.04, koto: 0.62, guitare: 0.71, analog: 1.06,
    rhodes: 1.09, glock: 2.04, fente: 0.82, woodblock: 2.5, tubulaire: 1.04, sub: 1.3, bassesynth: 1.52 },
  // essai : un OfflineAudioContext, pour mesurer sans haut-parleur (rien n'est alors programme)
  demarrer(essai) {
    if ((this.ctx || !(S.son || S.sonVoix)) && !essai) return;
    try {
      // « interactive » : la latence la plus courte que le navigateur propose (la voix en a besoin)
      const c = this.ctx = essai || new (window.AudioContext || window.webkitAudioContext)({ latencyHint: "interactive" });
      this.compter(c);
      this.actives = []; this.cases = new Map(); this.estimes = {}; this.stats = this.statsVides();
      this.jetons = 4; this.dernierJeton = 0; this.densite = 0; this.derniereDemande = 0; this.prochain = 0;
      this.cordes = new Map(); this.cordesTaille = 0; this.satFaite = -1; this.origine = 0;
      // entree, passe-haut, saturation, ecrasement, clarte, puis le bus (le son net, le chorus, l'echo, la
      // salle) et le volume ; puis compresseur, limiteur et plafond doux
      this.entree = c.createGain();
      const hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 30; hp.Q.value = 0.7;  // rien sous 30 Hz (audit 2026-10-18)
      this.sature = c.createWaveShaper(); this.sature.oversample = "2x";
      this.ecrase = c.createWaveShaper();
      this.filtre = c.createBiquadFilter(); this.filtre.type = "lowpass"; this.filtre.Q.value = 0.6;
      this.bus = c.createGain();
      this.maitre = c.createGain(); this.maitre.gain.value = 0;
      this.taire = c.createGain();
      this.entree.connect(hp); hp.connect(this.sature); this.sature.connect(this.ecrase); this.ecrase.connect(this.filtre);
      this.filtre.connect(this.bus); this.bus.connect(this.maitre); this.maitre.connect(this.taire);
      const garde = c.createDynamicsCompressor();
      garde.threshold.value = -16; garde.knee.value = 10; garde.ratio.value = 6; garde.attack.value = 0.008; garde.release.value = 0.3;
      const limite = this.limite = c.createDynamicsCompressor();
      limite.threshold.value = -3; limite.knee.value = 0; limite.ratio.value = 20; limite.attack.value = 0.001; limite.release.value = 0.1;
      // le plafond : une courbe douce sur quatre fois la course (avant, tout ce qui passait 1 etait ecrete
      // net) ; un petit signal passe tel quel, rien ne sort au-dessus de 0,95
      const avant = c.createGain(); avant.gain.value = 0.25;
      const borne = c.createWaveShaper(), nb = 4096, bc = new Float32Array(nb);
      for (let i = 0; i < nb; i++) bc[i] = 0.95 * Math.tanh((i / (nb - 1) * 2 - 1) * 4 / 0.95);
      borne.curve = bc;
      this.taire.connect(garde); garde.connect(limite); limite.connect(avant); avant.connect(borne); borne.connect(c.destination);
      // le chorus : deux retards courts qui ondulent lentement, l'un a gauche, l'autre a droite
      this.chorus = c.createGain(); this.chorus.gain.value = 0; this.chorus.connect(this.bus);
      for (const [base, vit, prof, p] of [[0.012, 0.31, 0.0022, -0.7], [0.017, 0.43, 0.0027, 0.7]]) {
        const d = c.createDelay(0.05), l = c.createOscillator(), lg = c.createGain(), pl = c.createStereoPanner();
        d.delayTime.value = base; l.frequency.value = vit; l.role = "lfo"; lg.gain.value = prof; pl.pan.value = p;
        l.connect(lg); lg.connect(d.delayTime); l.start();
        this.filtre.connect(d); d.connect(pl); pl.connect(this.chorus);
      }
      // le filtre respire : une onde tres lente sur la clarte (en centiemes de demi-ton)
      const r = c.createOscillator(); r.frequency.value = 1 / 11; r.role = "lfo";
      this.respire = c.createGain(); this.respire.gain.value = 0; r.connect(this.respire); this.respire.connect(this.filtre.detune); r.start();
      // l'echo, d'un cote puis de l'autre ; sans graves (il ne boue pas) ni aigus (il s'assombrit)
      // tout part de 0 (un gain vaut 1 a sa creation : les premieres notes partaient dans un echo boucle
      // le temps que l'automation le referme)
      this.envoiEcho = c.createGain(); this.retourEcho = c.createGain(); this.lrEcho = c.createGain();
      this.envoiEcho.gain.value = 0; this.retourEcho.gain.value = 0; this.lrEcho.gain.value = 0;
      const hpE = c.createBiquadFilter(); hpE.type = "highpass"; hpE.frequency.value = 160;
      this.echo = c.createDelay(4); this.echo2 = c.createDelay(4);
      const dt0 = clamp(this.dureeTemps() * Number(S.sonEchoTemps), 0.04, 3.9);
      this.echo.delayTime.value = dt0; this.echo2.delayTime.value = dt0;
      const sL = c.createBiquadFilter(), sR = c.createBiquadFilter(), pL = c.createStereoPanner(), pR = c.createStereoPanner();
      for (const s of [sL, sR]) { s.type = "lowpass"; s.frequency.value = 2600; s.Q.value = -6; }
      pL.pan.value = -0.6; pR.pan.value = 0.6;
      this.filtre.connect(this.envoiEcho); this.envoiEcho.connect(hpE); hpE.connect(this.echo);
      this.echo.connect(sL); sL.connect(pL); pL.connect(this.bus); sL.connect(this.lrEcho); this.lrEcho.connect(this.echo2);
      this.echo2.connect(sR); sR.connect(pR); pR.connect(this.bus); sR.connect(this.retourEcho); this.retourEcho.connect(this.echo);
      // la salle, sans graves a l'envoi (un coup de peau ne la fait plus gronder)
      this.envoiRev = c.createGain(); this.envoiRev.gain.value = 0; const hpR = c.createBiquadFilter(); hpR.type = "highpass"; hpR.frequency.value = 260;
      const rev = this.rev = c.createConvolver(); this.salleFaite = clamp(Number(S.sonSalle) || 1.8, 0.4, 6); rev.buffer = this.salle(this.salleFaite); this.hpRev = hpR;
      this.filtre.connect(this.envoiRev); this.envoiRev.connect(hpR); hpR.connect(rev); rev.connect(this.bus);
      // les bruits passent au fond : un bus a part, adouci
      this.bruits = c.createGain(); this.bruits.gain.value = 0.2;
      const lpB = c.createBiquadFilter(); lpB.type = "lowpass"; lpB.frequency.value = 4500; lpB.Q.value = 0.5;
      this.bruits.connect(lpB); lpB.connect(this.entree);
      // l'ecran s'ecoute lui-meme : ce point d'ecoute ne va que vers l'analyse de la musique, jamais
      // vers les haut-parleurs (pas de larsen), et ne depend pas du volume
      this.ecoute = c.createGain(); this.ecoute.gain.value = 0; this.bus.connect(this.ecoute);
      this.bruitBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
      const b = this.bruitBuf.getChannelData(0);
      for (let i = 0; i < b.length; i++) b[i] = Math.random() * 2 - 1;
      // un bruit plus long pour ce qui tourne en boucle (avant, le bourdon bouclait toutes les 2 s)
      this.bruitLong = c.createBuffer(1, Math.round(c.sampleRate * 7.3), c.sampleRate);
      const bl = this.bruitLong.getChannelData(0);
      for (let i = 0; i < bl.length; i++) bl[i] = Math.random() * 2 - 1;
      this.creerBourdon();
      this.creerTexture();
      this.creerLfos();
      this.creerVoix();
      this.creerTics();
      this.fixes = this.crees;
      this.ondes = {}; this.chimere = this.ondeAuHasard();
      if (!this.motif) this.tirerMotif();
      this.evoluer();
      if (!this.partition.length && poemeCourant) this.nouveauPoeme(poemeCourant);
      this.accorder(true);
      this.reglages();
      if (!essai) {
        this.minuteur = setInterval(() => this.tic(), 60);
        if (typeof musique !== "undefined" && musique.attendSon) musique.brancher();
      }
    } catch (e) { this.ctx = null; if (essai) throw e; }
  },
  // chaque noeud cree dans ce contexte est compte : c'est le compteur qui borne la polyphonie
  compter(c) {
    for (const nom of ["createGain", "createOscillator", "createBiquadFilter", "createBufferSource", "createStereoPanner", "createConstantSource",
      "createWaveShaper", "createDelay", "createConvolver", "createDynamicsCompressor", "createAnalyser", "createMediaStreamSource"]) {
      const f = c[nom];
      if (typeof f !== "function" || f.compte) continue;
      const g = (...a) => { this.crees++; return f.apply(c, a); };
      g.compte = true; c[nom] = g;
    }
  },
  statsVides() { return { demandes: 0, jouees: 0, absorbees: 0, refusees: 0, maxVoix: 0, maxNoeuds: 0 }; },
  maintenant() { return this.horloge != null ? this.horloge : this.ctx.currentTime; },
  // pour l'essai de justesse : chaque hauteur posee par automation (bourdon, grains, filtres de bruit)
  noter(f, quoi) { if (this.journal) this.journal.push([f, quoi]); },
  // une salle : du bruit qui s'eteint, un peu different a gauche et a droite ; les aigus meurent plus
  // vite que les graves (avant, un bruit blanc sans perte : chaque craquement trainait un « pschh »),
  // quelques premieres reflexions, et la meme energie qu'avant
  salle(duree) {
    const c = this.ctx, sr = c.sampleRate, n = Math.round(sr * duree), buf = c.createBuffer(2, n, sr), pre = Math.round(sr * 0.012);
    let eAvant = 0;
    for (let i = 0; i < n; i++) eAvant += Math.pow(1 - i / n, 6.4) / 3;
    for (let k = 0; k < 2; k++) {
      const d = buf.getChannelData(k);
      let y = 0, e = 0;
      for (let i = 0; i < n; i++) {
        const p = i / n, a = lerp(0.62, 0.035, Math.pow(p, 0.55));
        y += a * (Math.random() * 2 - 1 - y);
        d[i] = y * Math.pow(1 - p, 3.2) * (i < pre ? i / pre : 1);
      }
      for (const [tap, g] of [[0.007, 0.5], [0.013, -0.38], [0.021, 0.3], [0.034, -0.24], [0.047, 0.18], [0.061, -0.13]]) {
        const i = Math.round(sr * (tap + k * 0.0017));
        if (i < n) d[i] += g;
      }
      for (let i = 0; i < n; i++) e += d[i] * d[i];
      const g = Math.sqrt(eAvant / Math.max(1e-9, e));
      for (let i = 0; i < n; i++) d[i] *= g;
    }
    return buf;
  },
  creerBourdon() {
    const c = this.ctx;
    this.bourdon = c.createGain(); this.bourdon.gain.value = 0;
    const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 520; lp.Q.value = 3;
    const lfo = c.createOscillator(), lfoG = c.createGain();
    lfo.frequency.value = 0.031; lfo.role = "lfo"; lfoG.gain.value = 260; lfo.connect(lfoG); lfoG.connect(lp.frequency); lfo.start();
    this.bo = [["sine", 0.5, 0], ["sine", 0.32, 0], ["triangle", 0.16, 7]].map(([type, v, ec]) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = type; o.role = "auto"; o.detune.value = ec; g.gain.value = v; o.connect(g); g.connect(lp); o.start();
      return o;
    });
    // le souffle : un bruit tres etroit qui siffle sur la tonique, trois octaves au-dessus
    const src = c.createBufferSource(); src.buffer = this.bruitLong; src.loop = true;
    this.boSouffle = c.createBiquadFilter(); this.boSouffle.type = "bandpass"; this.boSouffle.Q.value = 40;
    const gs = c.createGain(); gs.gain.value = 1;
    src.connect(this.boSouffle); this.boSouffle.connect(gs); gs.connect(this.bourdon); src.start();
    lp.connect(this.bourdon); this.bourdon.connect(this.entree);
  },
  // la texture : quand les mots se bousculent, ce qui ne peut plus etre une note nourrit des grains
  // (deux sinus et un bruit dont on ouvre et ferme les portes par automation : aucun noeud par grain)
  // ou une nappe sur l'accord de la mesure. Tout est cree une fois.
  creerTexture() {
    const c = this.ctx, T = this.tex = { taux: 0, compte: 0, pool: [], prochain: 0, k: 0, L: 0, portes: [], oscs: [], nappe: [] };
    T.niveau = c.createGain(); T.niveau.gain.value = 0; T.niveau.connect(this.entree);
    for (const p of [-0.55, 0.55]) {
      const o = c.createOscillator(), g = c.createGain(), pl = c.createStereoPanner();
      o.type = "sine"; o.role = "auto"; o.frequency.value = 440; g.gain.value = 0; pl.pan.value = p;
      o.connect(g); g.connect(pl); pl.connect(T.niveau); o.start();
      T.oscs.push(o); T.portes.push(g);
    }
    const src = c.createBufferSource(); src.buffer = this.bruitLong; src.loop = true; src.start();
    T.bp = c.createBiquadFilter(); T.bp.type = "bandpass"; T.bp.Q.value = 6; T.gb = c.createGain(); T.gb.gain.value = 0;
    src.connect(T.bp); T.bp.connect(T.gb); T.gb.connect(this.bruits);
    T.lp = c.createBiquadFilter(); T.lp.type = "lowpass"; T.lp.frequency.value = 500; T.lp.Q.value = 0.5;
    T.gn = c.createGain(); T.gn.gain.value = 0; T.lp.connect(T.gn); T.gn.connect(T.niveau);
    for (let i = 0; i < 3; i++) {
      const o = c.createOscillator(); o.type = "sawtooth"; o.role = "auto"; o.detune.value = (i - 1) * 6; o.frequency.value = 130.81;
      o.connect(T.lp); o.start(); T.nappe.push(o);
    }
  },
  // le tic des lettres : deux sinus et un bruit dont on ouvre les portes par automation (aucun noeud par
  // tic, donc rien a compter dans le budget) ; accordes sur l'accord de la mesure, tout en haut
  creerTics() {
    const c = this.ctx, T = this.tics = { prochain: 0, k: 0, jetons: 10, t: 0, oscs: [], portes: [] };
    T.bus = c.createGain(); T.bus.gain.value = 0; T.bus.connect(this.entree);
    for (const p of [-0.4, 0.4]) {
      const o = c.createOscillator(), g = c.createGain(), pl = c.createStereoPanner();
      o.type = "sine"; o.role = "auto"; o.frequency.value = 2000; g.gain.value = 0; pl.pan.value = p;
      o.connect(g); g.connect(pl); pl.connect(T.bus); o.start(); T.oscs.push(o); T.portes.push(g);
    }
    const src = c.createBufferSource(); src.buffer = this.bruitLong; src.loop = true; src.start();
    T.bp = c.createBiquadFilter(); T.bp.type = "bandpass"; T.bp.Q.value = 3; T.gb = c.createGain(); T.gb.gain.value = 0;
    src.connect(T.bp); T.bp.connect(T.gb); T.gb.connect(T.bus);
  },
  // Le tic d'un mot qui parait (Jiiji, 2026-10-19 : « le son assigne aux lettres qui apparait en permanence
  // dans certaines conditions, c'est chiant »). Mesure avant : 18,7 tics par seconde au Calligramme, 12,4
  // dans les scenes 3D, 8,4 en Lecture et au Tourbillon, un flux continu. Maintenant : seulement un mot
  // neuf du poeme en cours (pas un mot qui revient, pas un mot de decor ni du poeme du calque), une
  // respiration (trois secondes de silence apres quatre tics), une oreille qui s'habitue (chaque tic baisse
  // l'attention, huit secondes de calme la rendent) ; la scene peut les couper (scene.sansTics, son.couperTics).
  ticMot(texte) {
    if (!this.tics || !(Number(S.sonTics) > 0) || this.ticsCoupes || (typeof scene !== "undefined" && scene && scene.sansTics)) return;
    const cle = sansAccents(String(texte || "").toLowerCase()).replace(/[^a-z0-9]/g, "");
    if (!cle || !this.motsPoeme.has(cle) || this.motsTiques.has(cle)) return;
    this.motsTiques.add(cle);
    const now = this.maintenant();
    this.attention = 1 - (1 - this.attention) * Math.exp(-Math.max(0, now - this.attentionT) / 8); this.attentionT = now;
    if (now < this.ticSilence || this.attention < 0.3) return;
    this.attention *= 0.78;
    if (now - this.ticPhraseT > 4) this.ticPhrase = 0;
    if (this.ticPhrase === 0) this.ticPhraseT = now;
    if (++this.ticPhrase >= 4) { this.ticPhrase = 0; this.ticSilence = now + 2.5 + Math.random(); }
    this.ticsJoues = (this.ticsJoues || 0) + 1;
    this.lettres(cle.length > 6 ? 2 : 1, this.attention);
  },
  couperTics(oui) { this.ticsCoupes = !!oui; },
  // nb tics (deux au plus), poses sur la grille, de force « force »
  lettres(nb, force) {
    const T = this.tics;
    if (!T || !this.ctx || !S.son || !(Number(S.sonTics) > 0)) return;
    const now = this.maintenant(), n = this.gamme().length;
    T.jetons = Math.min(10, T.jetons + Math.max(0, now - T.t) * 25); T.t = now;
    const g = (this.grille() || 0.5) / 2;
    let x = Math.max(T.prochain, now + 0.03);
    x = Math.ceil((x - this.origine) / g - 1e-6) * g + this.origine;
    const a = 0.035 * clamp(force == null ? 1 : force, 0.2, 1);
    for (let i = 0; i < Math.min(nb || 1, 2) && T.jetons >= 1; i++) {
      T.jetons--;
      const k = T.k++ % 2, f = this.replier(this.frequence(this.racine + 2 * n + this.ton(T.k % 4)), 1200, 3600);
      T.oscs[k].frequency.setValueAtTime(f, x); this.noter(f, "tic");
      const pg = T.portes[k].gain; pg.setValueAtTime(0, x); pg.linearRampToValueAtTime(a, x + 0.002); pg.linearRampToValueAtTime(0, x + 0.03);
      T.bp.frequency.setValueAtTime(f, x); this.noter(f, "tic de bruit");
      const q = T.gb.gain; q.setValueAtTime(0, x); q.linearRampToValueAtTime(a * 1.4, x + 0.001); q.linearRampToValueAtTime(0, x + 0.012);
      x += Math.max(0.07, g);
    }
    T.prochain = x;
  },
  volume() { this.reglages(); },
  reglages() { if (S.sonVoix && !this.ctx) this.demarrer(); this.appliquer(true); },
  // ce que la manette fait au son (mode Jouer) : la clarte multipliee, l'echo lance
  mainFiltre: 1, mainEcho: 0,
  pousser(filtre, echo) {
    if (Math.abs(echo - this.mainEcho) > 0.02 && this.ctx) this.echoBouge = this.maintenant();
    this.mainFiltre = filtre; this.mainEcho = echo;
    if (!this.ctx) return;
    const t = this.maintenant();
    this.filtre.frequency.setTargetAtTime(clamp(this.v("sonFiltre") * filtre, 60, 18000), t, 0.05);
    this.poserEcho(t, 0.05);
  },
  // l'echo : le reglage, plus le lancer de la manette (comme un dub), qui retombe de lui-meme quand le
  // geste s'arrete ; avant, tant que l'image restait tordue, l'echo restait a fond (audit 2026-10-18)
  poserEcho(t, lent) {
    const base = this.v("sonEcho") * 0.92, depuis = t - this.echoBouge;
    const lance = this.mainEcho > base && depuis < 4 ? this.mainEcho * (depuis < 0.6 ? 1 : Math.exp(-(depuis - 0.6) / 0.8)) : 0;
    const e = Math.min(0.83, Math.max(base, lance));  // sous 0.83 : la boucle ne s'emballe jamais
    const ouvert = base > 0 || (this.mainEcho > base && depuis < 0.6);
    this.envoiEcho.gain.setTargetAtTime(ouvert ? 0.55 : 0, t, ouvert ? 0.03 : 0.25);
    this.retourEcho.gain.setTargetAtTime(e, t, lent);
    this.lrEcho.gain.setTargetAtTime(e, t, lent);
  },
  niveauBruits() { const b = clamp(Number(this.v("sonBruits")) || 0, 0, 1); return 0.06 + 0.94 * Math.pow(b, 1.5); },
  // pose les reglages sur le son ; « curseur » : quelqu'un vient de toucher un curseur (on suit
  // vite, et on refait toutes les courbes) ; « cv » : un cable bouge (on suit vite) ; sinon c'est
  // l'evolution qui glisse, lentement
  appliquer(curseur) {
    if (!this.ctx) return;
    const t = this.maintenant(), lent = curseur === true ? 0.1 : curseur === "cv" ? 0.06 : 1.5;
    this.maitre.gain.setTargetAtTime(S.son ? S.volume * 0.6 : 0, t, 0.15);
    this.ecoute.gain.setTargetAtTime(S.son ? 2 : 0, t, 0.2);
    this.filtre.frequency.setTargetAtTime(clamp(this.v("sonFiltre") * this.mainFiltre, 60, 18000), t, this.mainFiltre !== 1 ? 0.05 : lent);
    this.poserEcho(t, lent);
    this.envoiRev.gain.setTargetAtTime(this.v("sonReverb") * 0.9, t, lent);
    this.bourdon.gain.setTargetAtTime(S.sonBourdon > 0.005 ? this.v("sonBourdon") * 0.05 : 0, t, 1.2);
    const sd = clamp(Number(S.sonSalle) || 1.8, 0.4, 6);
    if (this.rev && Math.abs(sd - (this.salleFaite || 0)) > 0.15) { this.salleFaite = sd; this.rev.buffer = this.salle(sd); }
    this.chorus.gain.setTargetAtTime(clamp(this.v("sonChorus"), 0, 1) * 0.7, t, lent);
    this.respire.gain.setTargetAtTime(clamp(this.v("sonRespire"), 0, 1) * 450, t, lent);
    this.bruits.gain.setTargetAtTime(this.niveauBruits(), t, lent);
    if (this.tics) this.tics.bus.gain.setTargetAtTime(clamp(Number(S.sonTics) || 0, 0, 1), t, 0.1);
    this.appliquerVoix(t, lent);
    if (this.lfos) {
      this.lfos.vib.forEach((o, i) => o.frequency.setTargetAtTime(S.sonVibratoVitesse * [0.92, 1, 1.09][i], t, 0.2));
      this.lfos.trem.forEach((o, i) => o.frequency.setTargetAtTime(S.sonTremoloVitesse * [0.88, 1, 1.13][i], t, 0.2));
    }
    const n = 2048, sat = this.v("sonSature");
    // la saturation qui derive : la courbe n'est refaite que si elle a assez bouge
    if (curseur === true || Math.abs(sat - this.satFaite) > 0.04) {
      this.satFaite = sat;
      if (sat > 0.005) {
        // normalisee : un petit signal ressort a son niveau (avant, tanh(kx)/tanh(k) multipliait le son
        // par 3,4 au reglage par defaut, un ampli cache qui faisait deriver le volume : audit 2026-10-18) ;
        // elle se melange au son net et ne mord qu'au-dessus du niveau d'une note
        const k = 1 + sat * 14, a0 = 0.12, norme = a0 / Math.tanh(k * a0), c = new Float32Array(n);
        for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; c[i] = (1 - sat) * x + sat * norme * Math.tanh(k * x); }
        this.sature.curve = c;
      } else this.sature.curve = null;
    }
    if (curseur !== true) return;
    if (S.sonEcrase > 0.01) {
      const pas = Math.max(2, Math.round(lerp(96, 3, Math.sqrt(S.sonEcrase)))), c = new Float32Array(n);
      for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; c[i] = Math.round(x * pas) / pas; }
      this.ecrase.curve = c;
    } else this.ecrase.curve = null;
  },
  gamme() { return GAMMES[this.gi][2]; },
  nomGamme() { return NOTES_NOMS[this.tonique] + " · " + GAMMES[this.gi][1].toLowerCase(); },
  octave() { return (Number(S.sonOctave) || 0) + Math.round(clamp(this.cv.sonOctave || 0, -1, 1) * 2); },
  // la hauteur d'un degre (il peut deborder sur les octaves voisines). Ni au-dessus de 3,6 kHz (les
  // aigus sifflent, la FM se replie) ni sous 36 Hz : on replie a l'octave, la note reste dans la gamme
  frequence(d) {
    d = Math.round(d) || 0;
    const g = this.gamme(), n = g.length, oct = Math.floor(d / n);
    const demi = g[d - oct * n] + 12 * oct + this.tonique + 12 * this.octave();
    return this.replier(130.81 * Math.pow(2, demi / 12), 36, 3600);
  },
  replier(f, bas, haut) {
    while (f > haut) f /= 2;
    while (f < bas) f *= 2;
    return f;
  },
  // le degre de la gamme le plus proche d'une frequence, et la note de la gamme la plus proche
  degreDe(f) {
    const g = this.gamme(), n = g.length, base = 130.81 * Math.pow(2, (this.tonique + 12 * this.octave()) / 12);
    const s = 12 * Math.log2(Math.max(1, f) / base), oct = Math.floor(s / 12);
    let best = 0, e = 99;
    for (let o = oct - 1; o <= oct + 1; o++) for (let i = 0; i < n; i++) {
      const x = Math.abs(g[i] + 12 * o - s);
      if (x < e) { e = x; best = i + o * n; }
    }
    return best;
  },
  dansLaGamme(f) { return this.frequence(this.degreDe(f)); },
  // les tons de l'accord (fondamentale, tierce, quinte) en degres ; i peut deborder sur les octaves
  ton(i) {
    const n = this.gamme().length, tons = n > 7 ? [0, Math.round(n / 3), Math.round(n * 7 / 12)] : [0, 2, 4];
    return tons[((i % 3) + 3) % 3] + n * Math.floor(i / 3);
  },
  // les notes de deux gammes, au quart de ton pres : combien ne sont pas communes
  ecart(a, b) {
    const A = new Set(a.map(x => Math.round(x * 2))), B = new Set(b.map(x => Math.round(x * 2)));
    let e = 0;
    for (const x of A) if (!B.has(x)) e++;
    for (const x of B) if (!A.has(x)) e++;
    return e;
  },
  nouvelleGamme() {
    const avant = this.gi;
    if (S.sonGamme === "hasard") {
      do this.gi = Math.floor(Math.random() * GAMMES.length); while (this.gi === avant);
    } else if (S.sonGamme === "parente") {
      const voisines = [];
      GAMMES.forEach((g, i) => { const e = this.ecart(g[2], GAMMES[avant][2]); if (e > 0 && e <= 3) voisines.push(i); });
      this.gi = voisines.length ? voisines[Math.floor(Math.random() * voisines.length)] : Math.floor(Math.random() * GAMMES.length);
    } else this.gi = Math.max(0, GAMMES.findIndex(g => g[0] === S.sonGamme));
    const ton = this.tonique;
    if (S.sonTonique === "hasard") { do this.tonique = Math.floor(Math.random() * 12); while (this.tonique === ton); }
    else if (S.sonTonique === "quintes") this.tonique = (ton + 7) % 12;
    else this.tonique = Number(S.sonTonique) || 0;
    this.degreCourant = Math.floor(Math.random() * this.gamme().length);
    if (this.tex) this.tex.pool = [];
    this.accorder(false);
    majSonUI();
  },
  // le bourdon glisse vers la tonique, la quinte (ou ce qui s'en approche) et la tonique en haut ;
  // la nappe de la texture rejoint l'accord de la mesure
  accorder(net) {
    if (!this.ctx) return;
    const g = this.gamme(), t = this.maintenant(), lent = net ? 0.01 : 2.5;
    let quinte = g[0];
    for (const x of g) if (Math.abs(x - 7) < Math.abs(quinte - 7)) quinte = x;
    const f0 = this.replier(130.81 * Math.pow(2, (this.tonique + 12 * this.octave()) / 12) / 2, 36, 400);
    const fs = [f0, f0 * Math.pow(2, quinte / 12), f0 * 2];
    fs.forEach((f, i) => { this.bo[i].frequency.setTargetAtTime(f, t, lent); this.noter(f, "bourdon"); });
    this.boSouffle.frequency.setTargetAtTime(f0 * 8, t, lent); this.noter(f0 * 8, "bourdon");
    this.accorderNappe(t, lent);
  },
  accorderNappe(t, lent) {
    if (!this.tex) return;
    this.tex.nappe.forEach((o, i) => {
      const f = this.replier(this.frequence(this.racine + this.ton(i)), 90, 700);
      o.frequency.setTargetAtTime(f, t, lent || 0.8); this.noter(f, "nappe");
    });
  },
  nouveauPoeme(p) {
    this.poemes++;
    const tous = S.sonChange === "jamais" ? Infinity : Number(S.sonChange) || 1;
    if (this.poemes === 1 || this.poemes % tous === 0) this.nouvelleGamme();
    // la partition : chaque mot plein, un silence a la fin de chaque vers
    const part = [];
    for (const v of versDe(p)) {
      const mots = v.texte.split(/\s+/).filter(m => /[a-zà-ÿœæ]/i.test(m));
      mots.forEach((m, i) => part.push({ mot: m, poete: v.poete, cours: coursDe(m), fin: i === mots.length - 1,
        lettre: v.v && v.v.lettre, syll: (sansAccents(m.toLowerCase()).match(/[aeiouy]+/g) || [1]).length }));
      part.push({ pause: 1 });
    }
    this.partition = part; this.curseur = 0;
    this.motsPoeme = new Set(part.filter(e => e.mot).map(e => sansAccents(e.mot.toLowerCase()).replace(/[^a-z0-9]/g, "")));
    this.motsTiques = new Set();
    this.timbresTires = {};
    this.deriverTimbres();
    this.tirerMotif();
    this.ouverture = true;
    const partMod = clamp(Number(S.sonModPart) || 0, 0, 1);
    this.modPoeme = partMod > 0 && Math.floor(this.poemes * partMod) !== Math.floor((this.poemes - 1) * partMod);
    if (this.ctx) { this.chimere = this.ondeAuHasard(); this.accorderNappe(this.maintenant()); }
  },
  dureeTemps() {
    if (S.sonSuit === "musique" && S.musique && musique.actif && musique.bpm) return 60 / musique.bpm * Number(S.sonDivision);
    return 60 / clamp(this.v("sonTempo"), 4, 200);
  },
  // le battement de la grille : celui de la musique quand le son la suit, sinon le sien
  battement() {
    if (S.sonSuit === "musique" && S.musique && musique.actif && musique.bpm) return 60 / musique.bpm;
    return 60 / clamp(this.v("sonTempo"), 4, 200);
  },
  grille() { const q = Number(S.sonGrille) || 0; return q > 0 ? this.battement() / q : 0; },
  // ---- l'evolution ----
  // Le son ne reste pas pareil (Jiiji, 2026-10-17 : « il faut que le sound design soit evolutif »).
  // Trois choses bougent ensemble, sans jamais toucher aux reglages : les mouvements (six climats
  // qui se fondent l'un dans l'autre, un tous les sonCycle minutes), la courbe de chaque poeme (il
  // s'ouvre au milieu et se referme a la fin) et une derive lente de chaque reglage autour de sa
  // valeur. sonEvolution dose le tout ; a 0, le son est exactement ce que disent les curseurs.
  // Les cables (son.cv) s'ajoutent par-dessus, dans les memes bornes.
  v(cle) {
    let x = S[cle];
    if (x === 0 && SON_ZERO_COUPE.has(cle)) return 0;
    const e = S.sonEvolution, B = SON_BORNES[cle];
    if (e > 0 && B) {
      const [min, max, ampli, log] = B;
      let off = this.arc[cle] || 0;
      if (this.mvtA) off += lerp(this.mvtA[cle] || 0, this.mvtB[cle] || 0, this.mvtMelange);
      const d = this.derives[cle];
      if (d) off += d.val * ampli;
      off *= e;
      x = log ? clamp(x * Math.pow(2, off), min, max) : clamp(x + off, min, max);
    }
    const cv = this.cv[cle];
    if (cv) {
      const C = B || SON_CV_BORNES[cle];
      if (C) x = C[3] ? clamp(x * Math.pow(2, clamp(cv, -1, 1) * 1.5), C[0], C[1]) : clamp(x + clamp(cv, -1, 1) * (C[1] - C[0]) / 2, C[0], C[1]);
    }
    return x;
  },
  // rend vrai quand il a recalcule (quatre fois par seconde au plus) ; « maintenant » : pour les essais
  evoluer(maintenant) {
    const now = maintenant != null ? maintenant : performance.now() / 1000;
    if (maintenant == null && now - this.dernierEvol < 0.25) return false;
    this.dernierEvol = now;
    const cycle = Math.max(0.5, S.sonCycle) * 60;
    if (!this.debutEvol) this.debutEvol = now;
    // un cycle change de longueur : on garde sa place dans le mouvement en cours
    if (this.cycleCourant && cycle !== this.cycleCourant) this.debutEvol = now - (now - this.debutEvol) * cycle / this.cycleCourant;
    this.cycleCourant = cycle;
    const pos = Math.max(0, (now - this.debutEvol) / cycle), k = Math.floor(pos), f = pos - k;
    while (this.ordreMvt.length < k + 2) {
      const tour = SON_MOUVEMENTS.map((_, i) => i).sort(() => Math.random() - 0.5);
      if (tour[0] === this.ordreMvt[this.ordreMvt.length - 1]) tour.push(tour.shift());
      this.ordreMvt.push(...tour);
    }
    this.mvtA = SON_MOUVEMENTS[this.ordreMvt[k]]; this.mvtB = SON_MOUVEMENTS[this.ordreMvt[k + 1]];
    // on reste dans un mouvement 60 % du cycle, puis on glisse vers le suivant
    const g = clamp((f - 0.6) / 0.4, 0, 1);
    this.mvtMelange = g * g * (3 - 2 * g);
    // la derive : deux ondes lentes par reglage, de periodes sans rapport (rien ne revient pareil)
    for (const cle in SON_BORNES) {
      let d = this.derives[cle];
      if (!d) d = this.derives[cle] = { p1: Math.random() * 6.28, p2: Math.random() * 6.28,
        w1: (0.6 + Math.random() * 0.8) * 6.28 / (cycle * 0.7), w2: (0.6 + Math.random() * 0.8) * 6.28 / (cycle * 0.29), val: 0 };
      d.val = Math.sin(now * d.w1 + d.p1) * 0.65 + Math.sin(now * d.w2 + d.p2) * 0.35;
    }
    // la courbe du poeme : -0.5 au debut et a la fin, +0.5 au milieu
    const p = this.partition.length ? this.curseur / this.partition.length : 0.5;
    const a = Math.sin(Math.PI * clamp(p, 0, 1)) - 0.5;
    this.arc = S.sonArc ? { sonDensite: a * 0.5, sonFiltre: a * 1.4, sonBourdon: -a * 0.4, sonReverb: -a * 0.3,
      sonTempo: a * 0.25, sonAccords: a * 0.3, sonBalayage: a * 0.4 } : {};
    return true;
  },
  mouvement() {
    if (!this.mvtA || !(S.sonEvolution > 0)) return "";
    return this.mvtA.nom + (this.mvtMelange > 0.05 ? " → " + this.mvtB.nom : "");
  },
  // un timbre au hasard, parmi ceux qui frappent (Jiiji : « c'est vraiment plus joli quand c'est des notes
  // facon synthes », puis « ca devrait pouvoir etre plus percussif »)
  tirerTimbre(liste) {
    let choix = liste || TIMBRES_NOMS.map(x => x[0]).filter(x => x !== "basse");
    const doux = choix.filter(x => TIMBRES_DOUX.includes(x));
    choix = doux.length ? doux : TIMBRES_DOUX;
    return choix[Math.floor(Math.random() * choix.length)];
  },
  // en mode « qui changent », a chaque poeme un poete peut prendre un autre timbre, souvent un de
  // ceux du mouvement en cours ; un sur trois rentre chez lui
  deriverTimbres() {
    if (S.sonTimbre !== "derive" || Math.random() > 0.2 + S.sonEvolution * 0.6) return;
    const noms = ["Le lyrique", "Le minimaliste", "Le surréaliste", "Le sonore", "Le brut", "?"]
      .concat([...new Set(this.partition.map(e => e.poete).filter(x => x && !this.POETES_ORIGINE.has(x)))]);
    const poete = noms[Math.floor(Math.random() * noms.length)];
    const mvt = this.mvtMelange < 0.5 ? this.mvtA : this.mvtB;
    const chez = this.poete(poete)[0];
    this.timbresDerive[poete] = Math.random() < 0.3 ? chez : this.tirerTimbre(mvt && mvt.timbres && Math.random() < 0.7 ? mvt.timbres : null);
    if (poete === "Le surréaliste") this.timbresDerive["Le surrealiste"] = this.timbresDerive[poete];
  },
  // ---- la voix dans le son ----
  // Le flux du micro que l'onglet Musique ecoute deja (on n'en ouvre pas un second) entre dans le
  // contexte du son : passe-haut, passe-bas, puis la voix seche, la voix doublee, la salle et l'echo ;
  // un limiteur, une garde contre le larsen, puis le limiteur final de l'ecran. Elle ne va pas dans le
  // bus des notes : l'ecran qui s'ecoute lui-meme (« ecran », « melange ») n'entend pas la voix
  // traitee, seulement les notes (et la voix seche du micro, par l'analyse de la musique).
  creerVoix() {
    const c = this.ctx, X = this.vx = { flux: null, src: null, essai: null, larsen: false, larsens: 0, finLarsen: -9, tenu: 0, picAvant: -1, plafond: 1, salleFaite: 0 };
    X.porte = c.createGain(); X.porte.gain.value = 0;
    X.hp = c.createBiquadFilter(); X.hp.type = "highpass"; X.hp.Q.value = 0.7;
    X.lp = c.createBiquadFilter(); X.lp.type = "lowpass"; X.lp.Q.value = 0.5;
    X.porte.connect(X.hp); X.hp.connect(X.lp);
    // l'oreille contre le larsen : sur ce qui entre, avant les effets
    X.oreille = c.createAnalyser(); X.oreille.fftSize = 2048; X.oreille.smoothingTimeConstant = 0; X.spectre = new Float32Array(X.oreille.frequencyBinCount);
    X.lp.connect(X.oreille);
    X.mix = c.createGain();
    X.sec = c.createGain(); X.sec.gain.value = 0; X.lp.connect(X.sec); X.sec.connect(X.mix);
    // la voix doublee : deux retards courts qui ondulent, l'un a gauche, l'autre a droite
    X.double = c.createGain(); X.double.gain.value = 0; X.double.connect(X.mix);
    for (const [base, vit, prof, pan] of [[0.019, 0.23, 0.0035, -0.6], [0.027, 0.31, 0.004, 0.6]]) {
      const d = c.createDelay(0.06), l = c.createOscillator(), lg = c.createGain(), pl = c.createStereoPanner();
      d.delayTime.value = base; l.frequency.value = vit; l.role = "lfo"; lg.gain.value = prof; pl.pan.value = pan;
      l.connect(lg); lg.connect(d.delayTime); l.start(); X.lp.connect(d); d.connect(pl); pl.connect(X.double);
    }
    // la salle de la voix : la sienne (sa duree et sa clarte se reglent), sans graves a l'envoi
    X.envoiRev = c.createGain(); X.envoiRev.gain.value = 0;
    const hpR = c.createBiquadFilter(); hpR.type = "highpass"; hpR.frequency.value = 180;
    X.rev = c.createConvolver(); X.revLp = c.createBiquadFilter(); X.revLp.type = "lowpass"; X.revLp.Q.value = 0.5;
    X.lp.connect(X.envoiRev); X.envoiRev.connect(hpR); hpR.connect(X.rev); X.rev.connect(X.revLp); X.revLp.connect(X.mix);
    // l'echo : un retour plafonne a 0,75 et assombri a chaque tour (il retombe toujours)
    X.envoiEcho = c.createGain(); X.envoiEcho.gain.value = 0;
    X.echo = c.createDelay(3); X.retour = c.createGain(); X.retour.gain.value = 0;
    const eLp = c.createBiquadFilter(), eHp = c.createBiquadFilter();
    eLp.type = "lowpass"; eLp.frequency.value = 3800; eLp.Q.value = -3; eHp.type = "highpass"; eHp.frequency.value = 160;
    X.lp.connect(X.envoiEcho); X.envoiEcho.connect(X.echo); X.echo.connect(eLp); eLp.connect(eHp);
    eHp.connect(X.retour); X.retour.connect(X.echo); eHp.connect(X.mix);
    // l'echo qui se perd dans la salle des notes
    X.versNotes = c.createGain(); X.versNotes.gain.value = 0; eHp.connect(X.versNotes); X.versNotes.connect(this.hpRev);
    // le limiteur de la voix, la garde (elle baisse tout en cas de larsen), le niveau, et le limiteur final
    X.limite = c.createDynamicsCompressor();
    X.limite.threshold.value = -9; X.limite.knee.value = 3; X.limite.ratio.value = 20; X.limite.attack.value = 0.002; X.limite.release.value = 0.15;
    X.garde = c.createGain(); X.sortie = c.createGain(); X.sortie.gain.value = 0;
    X.mix.connect(X.limite); X.limite.connect(X.garde); X.garde.connect(X.sortie); X.sortie.connect(this.limite);
    X.mesure = c.createAnalyser(); X.mesure.fftSize = 1024; X.forme = new Float32Array(X.mesure.fftSize); X.garde.connect(X.mesure);
  },
  // le temps de l'echo : en millisecondes, ou cale sur le battement (la musique si elle a un tempo, sinon le son)
  tempsEchoVoix() {
    const v = String(S.sonVoixTemps || "380");
    if (v[0] === "b") {
      const beat = S.musique && musique.actif && musique.bpm ? 60 / musique.bpm : this.battement();
      return clamp(beat * Number(v.slice(1)), 0.06, 2.9);
    }
    return clamp(Number(v) / 1000 || 0.38, 0.06, 2.9);
  },
  voixActive() {
    const X = this.vx;
    if (!X || !S.sonVoix) return false;
    if (X.essai) return true;
    return !!(S.musique && musique.actif && musique.flux && musique.flux.getAudioTracks().length && (S.musiqueSource === "micro" || S.musiqueSource === "melange"));
  },
  appliquerVoix(t, lent) {
    const X = this.vx;
    if (!X) return;
    const on = this.voixActive(), l = Math.min(lent, 0.2);
    X.porte.gain.setTargetAtTime(on ? 1 : 0, t, 0.05);
    X.sortie.gain.setTargetAtTime(on ? clamp(Number(S.sonVoixNiveau) || 0, 0, 1.5) * S.volume : 0, t, 0.08);
    X.hp.frequency.setTargetAtTime(clamp(Number(S.sonVoixHp) || 120, 20, 1000), t, l);
    X.lp.frequency.setTargetAtTime(clamp(Number(S.sonVoixLp) || 12000, 500, 20000), t, l);
    X.sec.gain.setTargetAtTime(clamp(Number(S.sonVoixSec) || 0, 0, 1), t, l);
    X.double.gain.setTargetAtTime(clamp(this.v("sonVoixDouble"), 0, 1) * 0.6, t, l);
    X.envoiRev.gain.setTargetAtTime(clamp(this.v("sonVoixRev"), 0, 1) * 0.8, t, l);
    X.revLp.frequency.setTargetAtTime(clamp(Number(S.sonVoixRevClarte) || 5000, 300, 16000), t, l);
    X.envoiEcho.gain.setTargetAtTime(clamp(this.v("sonVoixEcho"), 0, 1) * 0.8, t, l);
    X.retour.gain.setTargetAtTime(X.larsen ? 0 : Math.min(0.75, clamp(this.v("sonVoixRetour"), 0, 0.75)), t, X.larsen ? 0.02 : l);
    X.echo.delayTime.setTargetAtTime(this.tempsEchoVoix(), t, 0.3);
    X.versNotes.gain.setTargetAtTime(clamp(Number(S.sonVoixNotes) || 0, 0, 1) * 0.7, t, l);
    // la salle ne se recalcule que si sa duree a vraiment change
    const d = clamp(Number(S.sonVoixSalle) || 2.5, 0.3, 10);
    if (Math.abs(d - X.salleFaite) > 0.15) { X.salleFaite = d; X.rev.buffer = this.salle(d); }
  },
  // a chaque tic : le micro suit l'onglet Musique (s'il change de flux, on se rebranche), la garde
  // ecoute le larsen, et on mesure la voix traitee pour les cables
  voixMaj() {
    const X = this.vx;
    if (!X) return;
    const on = this.voixActive(), t = this.maintenant();
    const flux = on && !X.essai ? musique.flux : null;
    if (flux !== X.flux) {
      if (X.src) { try { X.src.disconnect(); } catch (e) { /* deja */ } X.src = null; }
      X.flux = flux;
      if (flux) { X.src = this.ctx.createMediaStreamSource(new MediaStream(flux.getAudioTracks())); X.src.connect(X.porte); }
      this.appliquerVoix(t, 0.1);
    }
    if (on !== X.on) { X.on = on; this.appliquerVoix(t, 0.1); }
    if (!on) { this.voixNiveau = 0; this.voixLarsen = false; return; }
    this.gardeLarsen(t);
    X.mesure.getFloatTimeDomainData(X.forme);
    let s = 0;
    for (let i = 0; i < X.forme.length; i += 2) s += X.forme[i] * X.forme[i];
    this.voixNiveau = clamp(Math.sqrt(s / (X.forme.length / 2)) * 4, 0, 1.5);
  },
  // le larsen : un pic etroit et pur (presque toute l'energie, bien au-dessus de ses voisins) qui reste
  // sur la meme frequence 0,4 s. Une voix qui parle bouge sans cesse de hauteur : elle ne le declenche
  // pas. La garde baisse alors la voix et coupe le retour de l'echo, tient 2,5 s, puis rend doucement.
  gardeLarsen(t) {
    const X = this.vx, sp = X.spectre, dt = clamp(t - (X.tLarsen || t), 0, 0.5);
    X.tLarsen = t;
    X.oreille.getFloatFrequencyData(sp);
    const hz = this.ctx.sampleRate / X.oreille.fftSize, a = Math.round(150 / hz), b = Math.min(sp.length - 6, Math.round(9000 / hz));
    let im = a, m = -400, total = 0;
    for (let i = a; i < b; i++) { const v = sp[i]; total += Math.pow(10, v / 10); if (v > m) { m = v; im = i; } }
    let pic = 0;
    for (let i = im - 2; i <= im + 2; i++) pic += Math.pow(10, sp[i] / 10);
    // la purete : la part de l'energie dans le pic. Un larsen est un son presque pur (0,96 a 1 mesure) ;
    // une voix, meme tenue, repartit son energie sur ses harmoniques (0,89 au plus sur la fausse voix d'essai)
    const purete = total > 0 ? pic / total : 0, voisins = Math.max(sp[im - 5], sp[im + 5]);
    // le niveau d'un larsen tremble d'une mesure a l'autre : le compteur ne repart pas a zero, il
    // redescend doucement (0,4 s cumulees sur la meme frequence a deux cases pres)
    const etroit = m > -60 && m - voisins > 20 && purete > 0.93;
    if (etroit && Math.abs(im - X.picAvant) <= 2) X.tenu += dt; else X.tenu = Math.max(0, X.tenu - dt * 0.5);
    X.picAvant = im;
    // apres un larsen, la voix revient moins fort (un larsen qui revient, c'est la salle) ; le plafond
    // remonte doucement quand tout est calme (2 % par seconde)
    if (!X.larsen) X.plafond = Math.min(1, X.plafond + dt * 0.02);
    if (X.tenu > 0.4 && !X.larsen) {
      X.larsen = true; X.larsens++; X.finLarsen = t + 2.5; X.plafond = Math.max(0.2, X.plafond * 0.7);
      X.garde.gain.setTargetAtTime(0.08, t, 0.02);
      X.retour.gain.setTargetAtTime(0, t, 0.02);
      this.voixLarsen = true;
      majSonUI();
    } else if (X.larsen && t > X.finLarsen) {
      if (X.tenu > 0.2) { X.finLarsen = t + 1; return; }  // il est encore la : on attend
      X.larsen = false; this.voixLarsen = false;
      X.garde.gain.setTargetAtTime(X.plafond, t, 1.2);
      this.appliquerVoix(t, 1);
      majSonUI();
    }
  },
  // ---- la respiration de la modulation ----
  // un reglage de modulation, multiplie par la respiration (les curseurs ne bougent jamais)
  mod(cle) { return this.v(cle) * this.modG; },
  appelerModulation(s) { const t = this.maintenant(); if (t + s > this.modAppel) this.modAppel = t + s; },
  // la cible : 1 quand la modulation est la, 0 sinon ; on y va en fondu de 4 s
  respirerModulation(t, dt) {
    const part = clamp(Number(S.sonModPart) || 0, 0, 1), r = S.sonModRythme;
    let cible;
    if (r === "toujours" || part >= 0.999) cible = 1;
    else if (r === "poemes") cible = this.modPoeme ? 1 : 0;
    else if (r === "vers") cible = this.modVers ? 1 : 0;
    else {
      // sur un cycle : la modulation occupe la fin de chaque cycle (part du cycle), fondus compris
      const cycle = Math.max(30, (Number(S.sonModCycle) || 3) * 60), pos = (t % cycle) / cycle;
      cible = pos >= 1 - part ? 1 : 0;
    }
    // un drop l'appelle aussi
    if (S.sonModEvenements && musique.dernierDrop && musique.dernierDrop !== this.modDrop) { this.modDrop = musique.dernierDrop; this.appelerModulation(10); }
    if (S.sonModEvenements && t < this.modAppel) cible = 1;
    cible = clamp(cible + clamp(this.cv.modulation || 0, -1, 1), 0, 1);
    const pas = dt / 4;  // 4 s pour aller de nette a modulee
    this.modG = cible > this.modG ? Math.min(cible, this.modG + pas) : Math.max(cible, this.modG - pas);
  },
  // ---- l'horloge ----
  tic() {
    if (!this.ctx) return;
    if (this.ctx.state === "suspended" && this.horloge == null) { this.ctx.resume(); return; }
    this.voixMaj();
    if (!S.son) return;
    const t = this.maintenant(), dt = clamp(t - (this.dernierTic || t), 0, 1);
    this.dernierTic = t;
    // un cable a bouge : on suit vite
    let cvs = "";
    for (const k in this.cv) if (this.cv[k]) cvs += k + this.cv[k].toFixed(2);
    if (cvs !== this.cvAvant) { this.cvAvant = cvs; this.evoluer(this.horloge != null ? t : undefined); this.appliquer("cv"); }
    else if (this.evoluer(this.horloge != null ? t : undefined)) { this.appliquer(false); if (++this.ticsUI % 8 === 0) majSonUI(); }
    const temps = this.dureeTemps();
    this.ecouterSilence(t, dt);
    const de = clamp(temps * Number(S.sonEchoTemps), 0.04, 3.9);
    this.echo.delayTime.setTargetAtTime(de, t, 0.4); this.echo2.delayTime.setTargetAtTime(de, t, 0.4);
    if (t - this.echoBouge < 4.5) this.poserEcho(t, 0.1);
    this.caler(t, temps);
    // l'horloge : une image lente ou un onglet en sommeil ne fait pas partir d'un coup les notes en
    // retard (avant, jusqu'a 0,5 s de notes partaient en paquet) : on reprend un peu plus loin
    if (!this.prochain || this.prochain < t + 0.01) this.prochain = t + 0.05;
    for (let i = 0; this.prochain < t + 0.3 && i < 64; i++) this.prochain += Math.max(0.0001, this.pas(this.prochain, temps));
    // une scene qui change, un drop : une section s'ouvre (un accord, la basse)
    if (S.scene !== this.sceneAvant || (musique.dernierDrop && musique.dernierDrop !== this.dropAvant)) {
      const premier = this.sceneAvant === undefined;
      const drop = musique.dernierDrop && musique.dernierDrop !== this.dropAvant;
      this.sceneAvant = S.scene; this.dropAvant = musique.dernierDrop;
      if (!premier && this.motif) {
        const g = this.grille() || 0.25, x = Math.ceil((t + 0.05 - this.origine) / g) * g + this.origine;
        // un drop ouvre une section neuve : un autre pattern
        if (drop) { this.tirerMotif(); this.ouverture = false; }
        this.accordSection(x, drop);
      }
    }
    const pous = this.v("sonPoussiere");
    if (pous > 0 && Math.random() < pous * pous * 0.6) this.craquement(t + 0.03 + Math.random() * 0.27);
    this.texture(t, dt);
    this.respirerModulation(t, dt);
    if (this.cases.size > 64) for (const [k, c] of this.cases) if (c.t < t - 2) this.cases.delete(k);
    if (this.recents.size > 200) this.recents.clear();
  },
  // « se tait quand la musique joue » : sur le volume vrai (pas les bandes remises a leur propre
  // niveau, qui ne disent pas si quelque chose joue), avec une hysteresis : il se tait apres 0,6 s de
  // musique, reprend apres 2,5 s de calme. Quand l'ecran s'ecoute lui-meme, on ne compte que ce qui
  // vient d'ailleurs (sinon il se tairait de s'entendre)
  ecouterSilence(t, dt) {
    let muet = false;
    if (S.sonSuit === "taire" && S.musique && musique.actif) {
      const v = musique.avecEcran ? (musique.volumeExterne || 0) : (musique.volume || 0);
      if (this.muet) { this.enDessous = v < 0.012 ? this.enDessous + dt : 0; muet = this.enDessous < 2.5; }
      else { this.auDessus = v > 0.03 ? this.auDessus + dt : 0; muet = this.auDessus > 0.6; }
    }
    if (muet !== this.muet) { this.muet = muet; this.auDessus = this.enDessous = 0; }
    this.taire.gain.setTargetAtTime(this.muet ? 0 : 1, t, 0.8);
  },
  // sur la musique, les pas se recalent doucement sur le kick (avant : bon tempo, mais a cote du
  // temps) ; la grille des gestes part du dernier kick
  caler(t, temps) {
    if (this.horloge != null || S.sonSuit !== "musique" || !S.musique || !musique.actif || !musique.bpm || !musique.dernierCoup) return;
    const beat = 60 / musique.bpm, k = this.ctx.currentTime - (performance.now() / 1000 - musique.dernierCoup) - 0.03;
    if (t - k > 4 * beat) return;
    this.origine = k;
    const unite = Math.min(beat, S.sonPattern !== "aucun" ? temps / 2 : temps);
    if (this.prochain - t < 0.1) return;
    const e = (this.prochain - k) / unite, frac = e - Math.round(e);
    if (Math.abs(frac) > 0.02) this.prochain -= frac * unite * 0.25;
  },
  // un pas de l'horloge : un mot, ou un silence ; il rend sa duree
  pas(t, temps) {
    if (S.sonPattern !== "aucun" && this.motif) return this.pasMotif(t, temps, S.sonSuit === "mots");
    if (S.sonSuit === "mots" || !this.partition.length) return temps;  // les mots qui paraissent passent par son.mot
    if (this.curseur >= this.partition.length) { this.curseur = 0; return temps * 4; }  // le poeme reprend apres un temps
    const ev = this.partition[this.curseur++];
    if (ev.pause) { const s = this.v("sonSouffle"); return s > 0 ? temps * s : 0.0001; }
    const h = this.hacher(ev.mot);
    let longueur = 1;
    if (S.sonRythme === "syllabes") longueur = clamp(Math.round(ev.syll) / 2, 0.5, 2.5);
    else if (S.sonRythme === "flottant") longueur = [0.5, 1, 1, 1.5, 2, 3, 1, 2.5][h % 8];
    if (Math.random() < this.v("sonDensite")) {
      const decale = S.sonRythme === "flottant" ? Math.random() * temps * 0.12 : 0;
      this.jouerMot(ev, t + decale, temps * longueur, h, { place: true });
    }
    return temps * longueur;
  },
  // ---- les motifs ----
  // des suites d'accords (en degres de la gamme, ramenees a sa longueur) et des arpeges (en tons de
  // l'accord : 0 la fondamentale, 1 la tierce, 2 la quinte, 3 l'octave...)
  PROGRESSIONS: [[0, 5, 3, 4], [0, 3, 4, 0], [0, 4, 5, 3], [0, 0, 3, 3], [0, 6, 5, 4], [0, 2, 3, 4], [0, -2, -3, -1], [0, 3, 0, 4], [0, 5, 0, 4]],
  ARPEGES: [[0, 1, 2, 3], [0, 2, 1, 3], [3, 2, 1, 0], [0, 1, 2, 1], [0, 2, 3, 2], [2, 1, 0, 1], [0, 3, 1, 2], [0, 1, 2, 4, 2, 1], [0, 2, 4, 3], [0, 0, 2, 1]],
  // la basse, temps par temps (en tons de l'accord ; null : le temps se tait)
  BASSES: [[0, 0, 2, 0], [0, 2, 3, 2], [0, null, 2, 1], [0, 0, 3, 2], [0, 2, 0, 2], [0, null, 2, null], [0, 3, 2, 1]],
  // une note de basse : courte, sur le temps, dans l'accord de la mesure (Jiiji : « ca manque de son en note »)
  coupBasse(t, j) {
    const M = this.motif, b = this.v("sonBasse");
    if (!this.ctx || !M || S.sonPattern !== "motif" || !(b > 0.02)) return;
    const x = (M.basse || this.BASSES[0])[j % (M.basse || this.BASSES[0]).length];
    if (x == null) return;
    const n = this.gamme().length, f = this.replier(this.frequence(this.racine + this.ton(x) - n), 40, 160);
    this.voix(this.timbreBasse || "basse", t, f, 0.5, (j === 0 ? 0.95 : 0.7) * (0.45 + b * 0.75), 0, "", { place: true });
  },
  // l'ouverture d'une section (un poeme neuf, une scene neuve, un drop) : un accord pose, la basse
  accordSection(t, fort) {
    const n = this.gamme().length, tb = this.timbreDe(this.poeteVers) || "fmdoux";
    for (let k = 0; k < 3; k++) this.voix(tb === "peau" ? "fmdoux" : tb, t + k * 0.012, this.frequence(this.racine + n + this.ton(k)), 1.6, fort ? 0.75 : 0.5, (k - 1) * 0.4, "", { place: true });
    if (fort) this.voix("basse", t, this.replier(this.frequence(this.racine - n), 40, 160), 0.6, 1.1, 0, "", { place: true });
  },
  euclide(k, n, rot) {
    // k coups repartis au plus juste sur n pas (Bjorklund, par la formule de Bresenham), tournes ; le
    // premier temps sonne toujours
    const p = [];
    for (let i = 0; i < n; i++) p.push(((((i + rot) % n) * k) % n) < k);
    p[0] = true;
    return p;
  },
  coupsVises(n) { return clamp(Math.round(n * (0.2 + 0.5 * clamp(this.v("sonDensite"), 0.05, 1))), 2, n - 1); },
  // le pattern du poeme : celui qu'on a choisi, au hasard, ou selon l'humeur (la gamme), l'energie (le
  // mode, la musique, le cable « energie ») ; jamais deux fois le meme de suite. null : un motif invente
  choisirPattern() {
    const c = S.sonBanque || "auto";
    if (c === "aleatoire") return null;
    const fixe = SON_PATTERNS.find(x => x.cle === c);
    if (fixe) return fixe;
    const avant = this.motif && this.motif.cle;
    if (c === "hasard") return tirer(SON_PATTERNS.filter(x => x.cle !== avant));
    let E = { poesie: 0.35, vjing: 0.65, jeu: 0.6, auto: 0.5 }[S.mode || "vjing"];
    if (E === undefined) E = 0.5;
    if (S.musique && musique.actif) E += (musique.niveau || 0) * 0.3;
    E = clamp(E + clamp(this.cv.energie || 0, -1, 1) * 0.5 + (Math.random() - 0.5) * 0.3, 0, 1);
    const g = this.gamme(), mineur = g.includes(3) && !g.includes(4);
    let total = 0;
    const poids = SON_PATTERNS.map(x => {
      let w = Math.exp(-Math.pow(x.energie - E, 2) / 0.05);
      if ((mineur && x.humeur === "sombre") || (!mineur && x.humeur === "lumineux")) w *= 1.6;
      if (x.cle === avant) w *= 0.1;
      total += w; return w;
    });
    let r = Math.random() * total;
    for (let i = 0; i < poids.length; i++) { r -= poids[i]; if (r <= 0) return SON_PATTERNS[i]; }
    return SON_PATTERNS[0];
  },
  tirerMotif() {
    const P = this.choisirPattern();
    // un pattern qui a ses gammes (gamelan, boite a musique...) les prend quand la gamme est au hasard
    if (P && P.g && S.sonGamme === "hasard" && Math.random() < 0.6) {
      const gi = GAMMES.findIndex(x => x[0] === tirer(P.g));
      if (gi >= 0 && gi !== this.gi) { this.gi = gi; this.accorder(false); }
    }
    const n = P ? P.r.length : tirer([8, 8, 12, 16]), k = this.coupsVises(n), rot = P ? 0 : Math.floor(Math.random() * n);
    const prog = P ? P.p : tirer(this.PROGRESSIONS), L = this.gamme().length;
    this.motif = P ? { cle: P.cle, nom: P.nom, banque: true, n, k, rot, sub: P.sub || 2, porte: [...P.r].map(x => x !== "."),
      accents: [...P.r].map(x => x === "X"), arp: P.t ? P.t.slice() : null, degres: P.d ? P.d.slice() : null, br: P.br || null,
      double: P.double || 0, prog: prog.map(x => Math.round(x * L / 7)), basse: P.b.slice() }
      : { cle: "invente", nom: "inventé", n, k, rot, porte: this.euclide(k, n, rot), arp: tirer(this.ARPEGES).slice(), prog: prog.map(x => Math.round(x * L / 7)),
        basse: tirer(this.BASSES).slice() };
    // la basse change d'instrument avec l'energie du pattern
    this.timbreMotif = this.tirerTimbre();
    this.timbreBasse = P && P.energie > 0.6 ? tirer(["bassesynth", "basse", "fente"]) : tirer(["basse", "basse", "sub", "bassesynth"]);
    this.souffleJusqua = 0;
    this.motifA = JSON.parse(JSON.stringify(this.motif));
    this.vers = 0; this.pasM = 0; this.mesure = -1; this.racine = 0; this.jArp = 0; this.jBurst = 0; this.finMesure = 0;
  },
  // de vers en vers, le motif mute ; quand un autre poete prend la parole, il repond (l'arpege a
  // l'envers ou renverse) ; tous les quatre vers, on revient au motif du debut : ca sonne compose
  muter(prochain) {
    const M = this.motif;
    if (!M) return;
    this.vers++;
    if (this.vers % 4 === 0) { this.motif = JSON.parse(JSON.stringify(this.motifA)); this.jArp = 0; this.recompterK(); return; }
    const reponse = prochain && this.poeteVers && prochain !== this.poeteVers, cle = M.degres ? "degres" : "arp", L = M[cle];
    if (reponse) { M[cle] = Math.random() < 0.5 ? L.slice().reverse() : L.map(x => cle === "arp" ? 3 - x : -x); this.jArp = 0; }
    else if (Math.random() < 0.5) { const i = Math.floor(Math.random() * L.length); L[i] = clamp(L[i] + (Math.random() < 0.5 ? 1 : -1), -7, 9); }
    else L.push(L.shift());
    // un pattern de la banque garde son rythme ; un motif invente peut tourner
    if (!M.banque && Math.random() < 0.3) M.rot = (M.rot + (Math.random() < 0.5 ? 1 : M.n - 1)) % M.n;
    this.recompterK();
  },
  // la densite (et son evolution) donne le nombre de coups ; un de plus ou de moins par vers
  recompterK() {
    const M = this.motif;
    if (M.banque) return;
    M.k = clamp(M.k + Math.sign(this.coupsVises(M.n) - M.k), 1, M.n);
    M.porte = this.euclide(M.k, M.n, M.rot);
  },
  // la note suivante du motif, en degres : arpege sur l'accord de la mesure, ou degres de la gamme
  degreMotif(j) {
    const M = this.motif, n = this.gamme().length;
    if (j == null) j = this.jArp++;
    if (M.degres) return n + this.racine + M.degres[((j % M.degres.length) + M.degres.length) % M.degres.length];
    return n + this.racine + this.ton(M.arp[((j % M.arp.length) + M.arp.length) % M.arp.length]);
  },
  // le pattern joue seul (entre deux mots, entre deux vers, quand le poeme est fini) : un peu plus doux,
  // dans son instrument a lui (tire a chaque poeme) ; les mots, quand ils viennent, prennent celui de leur
  // poete : on entend qu'ils colorent la musique
  noteMotif(t, deg, pas, accent) {
    const pv = this.poeteVers, tb = this.timbreMotif || this.timbreDe(pv), [, octP, panP] = this.poete(pv), n = this.gamme().length;
    const d = deg + octP * n, larg = this.v("sonLargeur"), vol = 0.48 * accent, dur = clamp(pas * 1.8 * this.v("sonTenue"), 0.15, 3);
    this.voix(tb, t, this.frequence(d), dur, vol, clamp(panP * larg, -1, 1), "", { place: true, poete: pv });
    if (this.motif.double) this.voix(tb, t + 0.012, this.frequence(d + this.motif.double), dur, vol * 0.6, clamp(-panP * larg, -1, 1), "", { place: true, poete: pv });
  },
  accent(i, M) { const fort = M.n % 3 === 0 ? M.n / 3 : M.n / 2; return i === 0 ? 1.3 : i % fort === 0 ? 1.08 : 0.82; },
  // une mesure commence : l'accord avance, la basse lente sonne sa fondamentale, la nappe le suit
  nouvelleMesure(t, longueur) {
    const M = this.motif;
    this.mesure++;
    this.racine = M.prog[((this.mesure % M.prog.length) + M.prog.length) % M.prog.length];
    // une rime vient de tomber : cadence, la mesure revient sur la tonique
    if (this.cadence) { this.cadence = false; this.racine = 0; }
    if (S.sonSuit !== "musique" || !musique.actif) this.origine = t;
    if (this.ctx) this.accorderNappe(t);
    this.jBasse = 0;
    // un poeme neuf ouvre une section : un accord leger sur le premier temps
    if (this.ctx && this.ouverture) { this.ouverture = false; this.accordSection(t); }
  },
  // un pas du motif. Le pattern joue de lui-meme ; sur ses pas, un mot du poeme prend la note (il la colore :
  // son poete, sa rarete, sa rime) ; entre deux vers et sans mots, le pattern continue, plus doux.
  // sansMots : en mode « mots », les mots viennent de l'ecran par son.mot, le pattern tient la musique.
  pasMotif(t, temps, sansMots) {
    const M = this.motif, sub = M.sub || 2, pas = temps / sub, i = this.pasM % M.n;
    if (i === 0) this.nouvelleMesure(t, pas * M.n);
    if (M.br ? M.br[i % M.br.length] === "x" : i % sub === 0) this.coupBasse(t, this.jBasse++);
    this.pasM++;
    if (!M.porte[i]) return pas;
    const fort = M.accents && M.accents[i], accent = M.accents ? (fort ? 1.3 : i === 0 ? 1.1 : 0.85) : this.accent(i, M);
    // un pattern de la banque s'eclaircit avec la densite (jamais ses accents ni son premier temps)
    if (M.banque && !fort && i !== 0 && Math.random() > clamp(this.v("sonDensite") * 1.5, 0.25, 1)) return pas;
    let ev = null;
    if (!sansMots && this.partition.length && t >= this.souffleJusqua) {
      if (this.curseur >= this.partition.length) { this.curseur = 0; this.souffleJusqua = t + temps * 4; }
      else {
        ev = this.partition[this.curseur++];
        if (ev.pause) {
          // un silence entre deux vers (le pattern, lui, continue) ; le motif mute
          const suivant = this.partition[this.curseur];
          this.modVers = Math.random() < clamp(Number(S.sonModPart) || 0, 0, 1);
          this.muter(suivant && suivant.poete);
          this.souffleJusqua = t + temps * this.v("sonSouffle");
          ev = null;
        }
      }
    }
    const motif = S.sonPattern === "motif", deg = motif ? this.degreMotif() : null;
    if (ev) {
      const h = this.hacher(ev.mot);
      let longueur = 1;
      if (S.sonRythme === "syllabes") longueur = clamp(Math.round(ev.syll) / 2, 0.5, 2.5);
      else if (S.sonRythme === "flottant") longueur = [0.5, 1, 1, 1.5, 2, 3, 1, 2.5][h % 8];
      const decale = S.sonRythme === "flottant" ? Math.random() * pas * 0.08 : 0;
      this.jouerMot(ev, t + decale, pas * 2 * longueur, h, { place: true, accent, deg });
    } else if (motif && S.sonContinu !== false) this.noteMotif(t, deg, pas, accent);
    return pas;
  },
  // ce qu'un poete donne au son : [timbre, octave, place]. Les cinq d'origine ont les leurs ; un poete
  // inconnu (le generateur en aura quinze a vingt) recoit un timbre stable tire de son nom, parmi les
  // synthes agreables, une octave et une place (au lieu de tous tomber sur le meme repli)
  poete(nom) {
    if (this.POETES[nom]) return this.POETES[nom];
    if (!nom) return ["pluck", 0, 0];
    const h = this.hacher(nom);
    return (this.POETES[nom] = [TIMBRES_DOUX[h % TIMBRES_DOUX.length], [-1, 0, 0, 1][(h >> 4) % 4], ((h >> 6) % 9) / 4 - 1]);
  },
  hacher(s) {
    let h = 7;
    for (const c of sansAccents((s || "").toLowerCase())) h = (h * 31 + c.charCodeAt(0)) % 100003;
    return h;
  },
  timbreDe(poete) {
    const chez = this.poete(poete)[0];
    if (S.sonTimbre === "poetes") return chez;
    if (S.sonTimbre === "derive") return this.timbresDerive[poete || "?"] || chez;
    if (S.sonTimbre === "hasard") {
      if (!this.timbresTires[poete]) this.timbresTires[poete] = this.tirerTimbre();
      return this.timbresTires[poete];
    }
    return S.sonTimbre;
  },
  // un mot du poeme devient une note ; o.place : deja sur la grille (la partition) ; o.motif : la
  // hauteur vient de l'arpege du motif ; sinon (un mot qui parait) c'est un geste, que l'ordonnanceur pose
  jouerMot(ev, t, duree, h, o) {
    o = o || {};
    const n = this.gamme().length;
    const [, octP, panP] = this.poete(ev.poete);
    const rare = clamp(1 - (ev.cours || 60) / 100, 0, 1);
    let deg;
    if ((o.deg != null || o.motif) && this.motif) {
      // la melodie du pattern, dans le registre du poete ; un mot sur cinq fait un pas de cote (une note
      // de passage), toujours le meme pour le meme mot
      deg = o.deg != null ? o.deg : this.degreMotif();
      if (h % 5 === 0) deg += h % 2 ? 1 : -1;
      this.degreCourant = deg;
      deg += octP * n;
    } else {
      // un pas dans la gamme, de -2 a +2 degres, qui rebondit sur les bords (deux octaves et demie)
      let d = this.degreCourant + (h % 5) - 2;
      if (d < -2) d = -4 - d;
      if (d > n * 2) d = n * 4 - d;
      this.degreCourant = d;
      deg = d + octP * n;
    }
    // une rime en fin de vers : la note se pose sur la fondamentale de l'accord, et la mesure suivante
    // revient a la tonique (une cadence)
    if (ev.fin && ev.lettre) { deg = Math.round((deg - this.racine) / n) * n + this.racine; this.cadence = true; }
    if (rare > 0.8 && h % 2) deg += n;  // un mot rare brille une octave plus haut
    if (rare > 0.92 && S.sonModEvenements) this.appelerModulation(6);
    if (ev.poete) this.poeteVers = ev.poete;
    const dur = clamp(duree * 1.5 * this.v("sonTenue") * (0.7 + rare * 0.8), 0.12, 14);
    const vol = (0.55 + rare * 0.6) * (o.accent || 1), larg = this.v("sonLargeur");
    const pan = clamp(panP * larg + (Math.random() - 0.5) * 0.25 * larg, -1, 1);
    const timbre = this.timbreDe(ev.poete), f = this.frequence(deg);
    const opt = { place: !!o.place, poete: ev.poete };
    this.voix(timbre, t, f, dur, vol, pan, ev.mot, opt);
    // accords et begaiements : seulement quand c'est calme (en rafale, l'ordonnanceur fait ses accords)
    const calme = o.place || this.densiteA(this.maintenant()) < 2;
    if (calme && Math.random() < this.v("sonAccords")) this.voix(timbre, t + 0.04, this.frequence(deg + (h % 3 ? 2 : 4)), dur, vol * 0.55, -pan, ev.mot, opt);
    // le begaiement : la note repart deux a cinq fois, de plus en plus bas, d'un cote puis de l'autre
    if (calme && Math.random() < this.mod("sonBegaiement")) {
      const fois = 2 + h % 4, ecart = duree / [3, 4, 6, 8][h % 4];
      for (let i = 1; i <= fois; i++) this.voix(timbre, t + i * ecart, f, Math.min(dur, ecart * 1.5), vol * Math.pow(0.68, i), i % 2 ? -pan : pan, ev.mot, { place: true, poete: ev.poete });
    }
    if (ev.fin && ev.lettre && S.sonRimes) this.cloche(ev.lettre, t + Math.min(duree * 0.5, 1.5), ev.mot);
  },
  // ---- l'ordonnanceur ----
  // Toute note passe ici : la main, les macros, les mots qui paraissent, la partition, les rimes, la
  // Banque. o.place : la note est deja sur la grille (partition, sequences) ; sinon c'est un geste.
  // Au-dela du budget (voix, noeuds, debit), aucun noeud n'est cree : la note nourrit la texture.
  voix(timbre, t, f, dur, vol, pan, mot, o) {
    if (!this.ctx || !this.stats) return;
    const now = this.maintenant(), st = this.stats;
    st.demandes++;
    if (!(f > 0) || !isFinite(f) || this.profondeur > 2) return;
    t = Math.max(Number(t) || 0, now + 0.03);  // jamais dans le passe : l'attaque n'est plus mangee (audit : manette a +0,01 s)
    dur = clamp(Number(dur) || 1, 0.05, 14); vol = clamp(Number(vol) || 0, 0, 2); pan = clamp(Number(pan) || 0, -1, 1);
    if (!(o && o.place)) {
      const r = this.poser(t, f, dur, vol, now);
      if (!r) return;
      t = r.t; f = r.f; dur = r.dur; vol = r.vol;
    }
    if (!this.admettre(timbre, t, 1)) { st.refusees++; this.absorber(f); return; }
    st.jouees++;
    this.sonner(timbre, t, f, dur, vol, pan, mot);
    // le bus : une note part (les cables de cv.js peuvent la faire voir) ; jamais plus de deux
    // rebonds note -> mot -> note dans la meme pile
    if (typeof bus !== "undefined") {
      this.profondeur++;
      try { bus.emettre("note", { f, degre: this.degreDe(f), vel: vol, duree: dur, timbre, pan, poete: (o && o.poete) || "", mot: mot || "", t }); }
      finally { this.profondeur--; }
    }
  },
  densiteA(now) { return this.densite * Math.exp(-Math.max(0, now - this.derniereDemande) / 1.5); },
  // un geste : on le pose sur la grille, on eclaircit et on regroupe selon la densite ; rend la note a
  // jouer, ou rien (elle nourrit alors la texture)
  poser(t, f, dur, vol, now) {
    this.densite = this.densiteA(now) + 1 / 1.5; this.derniereDemande = now;
    // en rafale, la grille se divise par deux : l'arpege court plus vite au lieu de se taire
    const d = this.densite, M = this.motif, g = this.grille() / (this.densite > 3 ? 2 : 1), pm = i => M ? ((i % M.n) + M.n) % M.n : 1;
    let idx, tt = t;
    if (g > 0) {
      idx = Math.ceil((t - this.origine) / g - 1e-6);
      while (this.origine + idx * g < now + 0.03) idx++;
      // au-dela de trois mots par seconde, seuls les pas du motif sonnent (le rythme euclidien)
      if (M && S.sonPattern !== "aucun" && d > 3) {
        let essais = 0;
        while (!M.porte[pm(idx)] && essais++ < 4) idx++;
        if (!M.porte[pm(idx)]) { this.absorber(f); return null; }
      }
      tt = this.origine + idx * g;
    } else idx = Math.round(t / 0.03);  // sans grille : on regroupe quand meme ce qui tombe a 30 ms pres
    // la texture prend le relais plus tot ou plus tard selon le reglage et le cable « texture »
    const seuil = Math.max(3, Number(S.sonTextureSeuil) || 8) * Math.pow(2, -clamp(this.cv.texture || 0, -1, 1) * 1.5);
    const fort = M ? pm(idx) === 0 : false;
    // combien de notes par case : un accord au calme, des grappes en rafale, et au-dela du seuil une
    // grappe de deux hors du premier temps (le reste nourrit la texture)
    const max = d < 3 ? 4 : d < seuil ? 3 : (fort ? 3 : 2);
    let k = this.cases.get(idx);
    if (!k) { k = { n: 0, deg: 0, t: tt }; this.cases.set(idx, k); }
    if (k.n >= max) { this.absorber(f); return null; }
    let deg = this.degreDe(f);
    if (k.n === 0) {
      // en rafale, la hauteur suit l'arpege du motif, dans le registre du geste
      if (M && S.sonPattern === "motif" && d > 3) {
        const n = this.gamme().length, oct = Math.floor((deg - this.racine) / n);
        deg = this.degreMotif(this.jBurst++) - n + oct * n;
        f = this.frequence(deg);
      }
      k.deg = deg;
    } else {
      // les suivants font l'accord : tierce, quinte, octave au-dessus de la premiere, a peine egrenees
      f = this.frequence(k.deg + this.ton(k.n)); tt += 0.018 * k.n; vol *= 0.72;
    }
    k.n++;
    // plus c'est dense, plus les notes sont courtes et douces
    const serre = Math.max(0, d - 2);
    return { t: tt, f, dur: Math.max(0.15, dur / (1 + serre / 4)), vol: vol / Math.sqrt(1 + serre / 3) };
  },
  // le budget : voix qui sonnent encore a l'heure t, noeuds qu'elles tiennent, et le debit (un seau de
  // jetons : sonDebit par seconde, une petite reserve pour un accord)
  // part : la part du budget permise (les cloches, la Banque, les craquements n'en ont que la moitie :
  // ils ne prennent jamais la place des notes)
  admettre(timbre, t, voix, part) {
    const now = this.maintenant();
    this.actives = this.actives.filter(a => a.fin > now - 0.05 && !(a.libre && a.fin < now + 0.1));
    const debit = Math.max(1, Number(S.sonDebit) || 8), cap = Math.max(3, debit / 2);
    this.jetons = Math.min(cap, this.jetons + Math.max(0, now - this.dernierJeton) * debit); this.dernierJeton = now;
    if (voix && this.jetons < 1) return false;
    const vm = this.voixMax(), nm = this.noeudsMax(), est = this.estimes[timbre] || 45;
    let v = 0, nd = 0;
    for (const a of this.actives) if (a.fin > t) { v += a.voix; nd += a.noeuds; }
    const pt = part || 1;
    if (v + voix > vm * pt || nd + est > nm * pt) return false;
    if (voix) this.jetons -= 1;
    return true;
  },
  voixMax() { return Math.round(clamp(Number(S.sonVoixMax) || 16, 2, 64)); },
  noeudsMax() { return 60 + this.voixMax() * 22; },
  debutVoix() { this.srcVoix = null; this.srcFin = -1; return this.crees; },
  // les modulations partagees : quelques LFO qui tournent toujours, chaque note en prend un par un gain
  // a elle (avant : deux a quatre oscillateurs de plus par note). Le lien est defait a la fin de la
  // note, sinon le LFO garderait ses noeuds en vie pour toujours
  creerLfos() {
    const c = this.ctx, L = this.lfos = { vib: [], trem: [], pan: [], usure: [] };
    const lfo = (f, gain) => { const o = c.createOscillator(); o.frequency.value = f; o.role = "lfo"; o.start(); if (gain == null) return o;
      const g = c.createGain(); g.gain.value = gain; o.connect(g); return [o, g]; };
    for (const k of [0.92, 1, 1.09]) L.vib.push(lfo(S.sonVibratoVitesse * k));
    for (const k of [0.88, 1, 1.13]) L.trem.push(lfo(S.sonTremoloVitesse * k));
    for (const f of [0.09, 0.17, 0.29, 0.41]) L.pan.push(lfo(f));
    for (const [lent, vite] of [[0.37, 6.3], [0.71, 8.9], [1.05, 10.7]]) {
      const somme = c.createGain(), [, g1] = lfo(lent, 35), [, g2] = lfo(vite, 8);
      g1.connect(somme); g2.connect(somme); L.usure.push(somme);
    }
  },
  brancherLfo(src, dest) { src.connect(dest); if (this.liens) this.liens.push([src, dest]); },
  finVoix(avant, t, fin, timbre, voix) {
    const n = this.crees - avant, a = { fin, noeuds: n, voix, libre: false };
    this.estimes[timbre] = Math.max(this.estimes[timbre] || 0, n);
    this.actives.push(a);
    if (this.journalVoix) this.journalVoix.push([t, fin, voix, n, timbre, this.fVoix || 0]);
    this.fVoix = 0;
    // la voix est rendue quand sa derniere source s'arrete (et, par prudence, a son heure de fin)
    const liens = this.liens || [];
    this.liens = null;
    if (this.srcVoix) this.srcVoix.onended = () => { a.libre = true; for (const [s, d] of liens) { try { s.disconnect(d); } catch (e) { /* deja */ } } };
    else for (const [s, d] of liens) { try { s.disconnect(d); } catch (e) { /* deja */ } }
    let v = 0, nd = 0;
    for (const x of this.actives) if (x.fin > t) { v += x.voix; nd += x.noeuds; }
    if (this.stats) { this.stats.maxVoix = Math.max(this.stats.maxVoix, v); this.stats.maxNoeuds = Math.max(this.stats.maxNoeuds, nd); }
  },
  source(s, fin) { if (fin >= this.srcFin) { this.srcVoix = s; this.srcFin = fin; } },
  // ce qui sonne en ce moment (pour l'onglet Son et les essais)
  etat() {
    if (!this.ctx) return { voix: 0, noeuds: 0 };
    const now = this.maintenant();
    let v = 0, nd = 0;
    for (const a of this.actives) if (a.fin > now) { v += a.voix; nd += a.noeuds; }
    return { voix: v, noeuds: nd, fixes: this.fixes, densite: +this.densiteA(now).toFixed(1), texture: this.tex ? +this.tex.L.toFixed(2) : 0 };
  },
  // une note qui n'a pas pu etre une note : elle epaissit la texture, a sa hauteur
  absorber(f) {
    if (this.stats) this.stats.absorbees++;
    const T = this.tex;
    if (!T) return;
    T.compte++;
    if (f > 0) { T.pool.push(f); if (T.pool.length > 8) T.pool.shift(); }
  },
  texture(t, dt) {
    const T = this.tex;
    if (!T) return;
    if (dt > 0) { T.taux = lerp(T.taux, T.compte / dt, 1 - Math.exp(-dt / 1.2)); T.compte = 0; }
    const mode = S.sonTexture, L = mode === "aucune" ? 0 : clamp(T.taux / 10 * Math.pow(2, clamp(this.cv.texture || 0, -1, 1)), 0, 1);
    T.L = L;
    T.niveau.gain.setTargetAtTime(L > 0.01 ? 1 : 0, t, 0.5);
    if ((mode === "grains" || mode === "deux") && L > 0.02) {
      // les grains : leur nombre suit la densite, plus forts sur les pas du motif (le motif s'entend)
      const taux = 3 + L * 30, lg = clamp(1.4 / taux, 0.03, 0.12), M = this.motif, g = this.grille() || 0.25, n = this.gamme().length;
      let x = Math.max(T.prochain, t + 0.03);
      while (x < t + 0.25) {
        const i = T.k++ % 2;
        const f0 = T.pool.length && Math.random() < 0.6 ? T.pool[Math.floor(Math.random() * T.pool.length)]
          : this.frequence(this.racine + n + this.ton(Math.floor(Math.random() * 6)));
        // ramenee dans la gamme du moment (la reserve peut dater d'avant un changement de gamme)
        const fg = this.replier(this.dansLaGamme(f0), 260, 2600);
        const porte = !M || M.porte[((Math.round((x - this.origine) / g) % M.n) + M.n) % M.n];
        const a = 0.05 * (0.4 + 0.6 * L) * (porte ? 1 : 0.4) * (0.6 + Math.random() * 0.4);
        T.oscs[i].frequency.setValueAtTime(fg, x); this.noter(fg, "grain");
        const p = T.portes[i].gain;
        p.setValueAtTime(0, x); p.linearRampToValueAtTime(a, x + lg * 0.3); p.linearRampToValueAtTime(0, x + lg);
        if (T.k % 3 === 0) {
          // un grain de bruit sur trois, accorde sur la meme note, au fond
          T.bp.frequency.setValueAtTime(fg * 2, x); this.noter(fg * 2, "grain de bruit");
          const q = T.gb.gain; q.setValueAtTime(0, x); q.linearRampToValueAtTime(a * 3, x + lg * 0.4); q.linearRampToValueAtTime(0, x + lg * 0.9);
        }
        x += (1 / taux) * (0.8 + Math.random() * 0.4);
      }
      T.prochain = x;
    }
    const nappe = mode === "nappe" || mode === "deux";
    T.gn.gain.setTargetAtTime(nappe ? L * 0.03 : 0, t, 0.6);
    T.lp.frequency.setTargetAtTime(300 + L * 1800, t, 0.6);
  },
  // ---- les voix ----
  // une enveloppe : monte, puis s'eteint d'ici la fin ; « tenu » : descend au niveau de tenue, tient,
  // puis relache en douceur. Et a la fin, elle finit de s'eteindre avant que l'oscillateur ne
  // s'arrete (avant, un petit clic s'entendait dans le calme)
  env(g, t, attaque, dur, v, tenu) {
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + attaque);
    if (tenu) {
      g.gain.setTargetAtTime(v * 0.72, t + attaque, 0.25);
      g.gain.setTargetAtTime(0, t + Math.max(attaque + 0.05, dur * 0.72), Math.max(0.05, dur * 0.12));
    } else g.gain.setTargetAtTime(0, t + attaque, Math.max(0.02, (dur - attaque) / 4));
    g.gain.setTargetAtTime(0, t + Math.max(dur, attaque + 0.06), 0.035);
  },
  // un oscillateur ; pendant qu'une note se construit, sa hauteur (detune) rejoint les modulations.
  // role : « mod » (un modulateur), « partiel » (une harmonique), « glisse » (part d'ailleurs et glisse
  // vers sa note) : ce n'est pas la fondamentale (pour l'essai de justesse)
  osc(type, f, t, fin, role) {
    const o = this.ctx.createOscillator();
    o.type = type; o.frequency.value = f; o.start(t); o.stop(fin);
    if (role) o.role = role;
    if (this.hauteurs) this.hauteurs.push(o.detune);
    this.source(o, fin);
    return o;
  },
  lfo(f, t, fin) {
    const o = this.ctx.createOscillator();
    o.frequency.value = f; o.role = "lfo"; o.start(t); o.stop(fin);
    this.source(o, fin);
    return o;
  },
  bruitSrc(t, fin) {
    const s = this.ctx.createBufferSource();
    s.buffer = this.bruitBuf; s.loop = true;
    s.start(t, Math.random() * 1.9); s.stop(fin);
    this.source(s, fin);
    return s;
  },
  // les formes d'onde dessinees (orgue) ou inventees (la chimere, une par poeme)
  onde(nom) {
    if (this.ondes[nom]) return this.ondes[nom];
    const amp = nom === "orgue" ? [0, 1, 0.55, 0.3, 0.4, 0, 0.22, 0, 0.3, 0, 0, 0, 0.12, 0, 0, 0, 0.1] : [0, 1];
    return (this.ondes[nom] = this.ctx.createPeriodicWave(new Float32Array(amp.length), new Float32Array(amp)));
  },
  ondeAuHasard() {
    const n = 24, amp = new Float32Array(n), pente = 0.5 + Math.random() * 1.5;
    for (let i = 1; i < n; i++) amp[i] = Math.random() < 0.45 && i > 1 ? 0 : Math.random() / Math.pow(i, pente);
    amp[1] = Math.max(amp[1], 0.4);
    return this.ctx.createPeriodicWave(new Float32Array(n), amp);
  },
  FORMANTS: { a: [730, 1090, 2440], e: [530, 1840, 2480], i: [270, 2290, 3010], o: [570, 840, 2410],
    u: [250, 1750, 2160], ou: [300, 870, 2240], y: [270, 2290, 3010] },
  // une note admise par l'ordonnanceur : le timbre, puis le filtre qui s'ouvre, le tremolo, la place ;
  // et la hauteur qui bouge (vibrato, bande usee, glissando, echantillonne-bloque) par les detune de
  // ses oscillateurs. Les noeuds crees sont comptes (finVoix) et rendus a la fin de la note.
  sonner(timbre, t, f, dur, vol, pan, mot) {
    if (this.DUREES[timbre]) dur = Math.min(dur, this.DUREES[timbre]);
    if (this.EGAL[timbre]) vol *= this.EGAL[timbre];
    // une recette de l'IA (ou d'un exemple) : sa duree a elle, deja bornee par la validation
    const recette = this.recettes && this.recettes[timbre];
    if (recette) dur = Math.min(dur, recette.env.duree);
    const c = this.ctx, fin = t + dur + 0.3, avant = this.debutVoix();
    this.liens = [];
    this.hauteurs = [];
    const sortie = c.createGain(), bruit = TIMBRES_BRUITS.has(timbre);
    let bout = sortie;
    const bal = this.mod("sonBalayage"), reso = this.v("sonResonance");
    if (Math.abs(bal) > 0.02 || reso > 0.05) {
      // la resonance plafonnee a +8,7 dB (avant +16,7 : elle sifflait)
      const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = 0.7 + reso * 8;
      const bas = Math.min(16000, f * 1.5), haut = Math.min(16000, f * (2 + Math.abs(bal) * 40));
      if (Math.abs(bal) > 0.02) {
        lp.frequency.setValueAtTime(bal > 0 ? bas : haut, t);
        lp.frequency.exponentialRampToValueAtTime(bal > 0 ? haut : bas, t + Math.max(0.05, dur * 0.7));
      } else lp.frequency.value = haut;
      bout.connect(lp); bout = lp;
    }
    const trem = this.mod("sonTremolo");
    if (trem > 0.02) {
      const g = c.createGain(), p = c.createGain();
      g.gain.value = 1 - trem * 0.5; p.gain.value = trem * 0.5;
      this.brancherLfo(tirer(this.lfos.trem), p); p.connect(g.gain);
      bout.connect(g); bout = g;
    }
    const place = c.createStereoPanner();
    place.pan.value = pan;
    const mv = this.mod("sonMouvement");
    if (mv > 0.02) { const p = c.createGain(); p.gain.value = mv; this.brancherLfo(tirer(this.lfos.pan), p); p.connect(place.pan); }
    bout.connect(place); place.connect(bruit ? this.bruits : this.entree);
    const attaque = Math.min(dur * 0.6, 0.004 + this.v("sonAttaque") * dur * 0.5);
    const m = this.v("sonMetal");
    if (recette) jouerRecette(c, sortie, recette, t, f, dur, vol, { osc: (ty, fr, a, b, role) => this.osc(ty, fr, a, b, role),
      bruit: (a, b) => this.bruitSrc(a, b), noter: (fr, q) => this.noter(fr, q) });
    else switch (timbre) {
      case "pad": {
        // une nappe : trois dents de scie a peine desaccordees et une sous-octave ; le filtre s'ouvre
        // pendant l'attaque et se referme lentement
        const att = Math.max(attaque, Math.min(1.4, dur * 0.4));
        this.env(sortie, t, att, dur, 0.03 * vol, true);
        const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = 1 + m * 3;
        lp.frequency.setValueAtTime(Math.min(12000, f * 1.3), t);
        lp.frequency.linearRampToValueAtTime(Math.min(12000, f * (3.5 + m * 4)), t + att);
        lp.frequency.setTargetAtTime(Math.min(12000, f * 2), t + att, Math.max(0.2, dur * 0.4));
        for (const ec of [-8, 0, 7]) { const o = this.osc("sawtooth", f, t, fin); o.detune.value = ec * (1 + m); o.connect(lp); }
        const sub = c.createGain(); sub.gain.value = 0.45; this.osc("sine", f / 2, t, fin).connect(sub); sub.connect(lp);
        lp.connect(sortie);
        break;
      }
      case "pluck": {
        // un synthe pince : le filtre se ferme vite apres la frappe, une dent de scie et un carre a peine faux
        const court = Math.min(dur, 0.5 + m * 0.6 + (f < 300 ? 0.5 : 0));
        this.env(sortie, t, 0.003, court, 0.055 * vol);
        const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = 2 + m * 5;
        lp.frequency.setValueAtTime(Math.min(14000, f * (7 + m * 10)), t);
        lp.frequency.setTargetAtTime(Math.min(14000, f * 1.2), t + 0.004, 0.05 + court * 0.12);
        this.osc("sawtooth", f, t, fin).connect(lp);
        const q = c.createGain(); q.gain.value = 0.35; const o2 = this.osc("square", f, t, fin); o2.detune.value = 6; o2.connect(q); q.connect(lp);
        lp.connect(sortie);
        break;
      }
      case "fmdoux": {
        // un piano electrique : FM a rapport 1, l'indice retombe vite (la frappe), deux porteuses qui
        // battent a peine (un chorus naturel) ; l'indice ne depasse jamais 15 kHz de bande (pas de repliement)
        this.env(sortie, t, 0.004, dur, 0.034 * vol);
        const idx = c.createGain(), mod = this.osc("sine", f, t, fin, "mod");
        const iMax = Math.min(f * (1.3 + m * 2), Math.max(0, 15000 - 2 * f));
        idx.gain.setValueAtTime(iMax, t); idx.gain.setTargetAtTime(f * 0.12, t, 0.18);
        mod.connect(idx);
        for (const ec of [0, 4]) { const p = this.osc("sine", f, t, fin); p.detune.value = ec; idx.connect(p.frequency); p.connect(sortie); }
        break;
      }
      case "clochette": {
        // une cloche douce : rapport 3,5 (inharmonique comme un metal, mais la fondamentale est dans la
        // gamme), un indice faible qui s'eteint lentement, et l'octave a peine
        this.env(sortie, t, 0.003, dur, 0.05 * vol);
        const r = 3.5 + m * 0.5, idx = c.createGain(), mod = this.osc("sine", f * r, t, fin, "mod");
        const iMax = Math.min(f * (0.8 + m * 1.5), Math.max(0, 15000 - f * (1 + r)));
        idx.gain.setValueAtTime(iMax, t); idx.gain.setTargetAtTime(f * 0.05, t, dur * 0.3 + 0.05);
        mod.connect(idx); const p = this.osc("sine", f, t, fin); idx.connect(p.frequency); p.connect(sortie);
        const o2 = c.createGain(); o2.gain.value = 0.18; this.osc("sine", f * 2, t, fin).connect(o2); o2.connect(sortie);
        break;
      }
      case "lead": {
        // un lead : dent de scie et carre dans un filtre qui chante un peu ; il glisse toujours un peu (plus bas)
        this.env(sortie, t, Math.max(attaque, 0.015), dur, 0.04 * vol, true);
        const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = 3 + m * 4;
        lp.frequency.setValueAtTime(Math.min(12000, f * 5), t); lp.frequency.setTargetAtTime(Math.min(12000, f * (2.2 + m * 3)), t, 0.15);
        this.osc("sawtooth", f, t, fin).connect(lp);
        const q = c.createGain(); q.gain.value = 0.5; const o2 = this.osc("square", f, t, fin); o2.detune.value = 5; o2.connect(q); q.connect(lp);
        lp.connect(sortie);
        break;
      }
      case "basse": {
        // la basse en notes : attaque nette, declin court, le filtre se referme juste apres la frappe
        const court = Math.min(dur, 0.6);
        this.env(sortie, t, 0.004, court, 0.14 * vol);
        const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = 2;
        lp.frequency.setValueAtTime(Math.min(3000, f * 8), t); lp.frequency.setTargetAtTime(Math.min(3000, f * 1.8), t + 0.004, 0.07);
        this.osc("sine", f, t, fin).connect(lp);
        const g = c.createGain(); g.gain.value = 0.5; this.osc("triangle", f, t, fin).connect(g); g.connect(lp);
        lp.connect(sortie);
        break;
      }
      case "marimba": {
        // une lame de bois : la fondamentale, le partiel accorde a quatre fois (qui s'eteint vite) et le
        // coup du maillet (un bruit tres court, accorde sur la note)
        const court = Math.min(dur, f < 300 ? 0.9 : 0.6);
        this.env(sortie, t, 0.002, court, 0.09 * vol);
        this.osc("sine", f, t, fin).connect(sortie);
        const p4 = c.createGain(); this.env(p4, t, 0.001, court * 0.35, 0.35); this.osc("sine", Math.min(f * 4, 7000), t, fin, "partiel").connect(p4); p4.connect(sortie);
        const m4 = c.createGain(), bp = c.createBiquadFilter(); this.env(m4, t, 0.0005, 0.012, 0.25);
        const fm = this.replier(f * 4, 36, 3600); bp.type = "bandpass"; bp.frequency.value = fm; bp.Q.value = 1.5; this.noter(fm, "maillet");
        this.bruitSrc(t, t + 0.06).connect(bp); bp.connect(m4); m4.connect(sortie);
        break;
      }
      case "kalimba": {
        // une lame de metal pincee : la fondamentale, un partiel inharmonique a 5,9 fois qui ne dure qu'un
        // instant (le pince) et l'octave en triangle, a peine
        const court = Math.min(dur, 1.6);
        this.env(sortie, t, 0.002, court, 0.08 * vol);
        this.osc("sine", f, t, fin).connect(sortie);
        const p = c.createGain(); this.env(p, t, 0.001, 0.06, 0.5); this.osc("sine", Math.min(f * 5.9, 9000), t, fin, "partiel").connect(p); p.connect(sortie);
        const o2 = c.createGain(); o2.gain.value = 0.12; this.osc("triangle", f * 2, t, fin).connect(o2); o2.connect(sortie);
        break;
      }
      case "boite": {
        // une boite a musique : une lame d'acier une octave plus haut, son partiel de cloche a 2,76 fois
        // qui s'eteint vite, et un clic tres court
        const fh = this.replier(f * 2, 300, 3600), court = Math.min(dur, 1.4);
        this.env(sortie, t, 0.002, court, 0.06 * vol);
        this.osc("sine", fh, t, fin).connect(sortie);
        const p = c.createGain(); this.env(p, t, 0.001, court * 0.3, 0.3); this.osc("sine", Math.min(fh * 2.76, 9000), t, fin, "partiel").connect(p); p.connect(sortie);
        const k = c.createGain(); this.env(k, t, 0.0005, 0.008, 0.2); this.osc("sine", Math.min(fh * 6, 12000), t, t + 0.1, "partiel").connect(k); k.connect(sortie);
        break;
      }
      case "vibraphone": {
        // un vibraphone : la lame et son partiel a quatre fois qui s'eteint vite ; long et doux
        const court = Math.min(dur, 2.5);
        this.env(sortie, t, 0.002, court, 0.07 * vol);
        this.osc("sine", f, t, fin).connect(sortie);
        const p = c.createGain(); this.env(p, t, 0.001, court * 0.25, 0.3); this.osc("sine", Math.min(f * 4, 9000), t, fin, "partiel").connect(p); p.connect(sortie);
        break;
      }
      case "celesta": {
        // un celesta : une octave plus haut, un marteau doux sur une lame, son octave a peine
        const fh = this.replier(f * 2, 260, 3600), court = Math.min(dur, 1.3);
        this.env(sortie, t, 0.002, court, 0.06 * vol);
        this.osc("sine", fh, t, fin).connect(sortie);
        const p = c.createGain(); this.env(p, t, 0.001, court * 0.4, 0.22); this.osc("sine", fh * 2, t, fin).connect(p); p.connect(sortie);
        break;
      }
      case "steel": {
        // un steel drum : fondamentale, octave et douzieme ; la note tombe juste a la frappe
        const court = Math.min(dur, 1.2);
        this.env(sortie, t, 0.002, court, 0.06 * vol);
        for (const [r, a, d] of [[1, 1, 1], [2, 0.45, 0.6]]) {
          const g = c.createGain(); this.env(g, t, 0.002, court * d, a);
          const o = this.osc("sine", f * r, t, fin); o.detune.setValueAtTime(40, t); o.detune.setTargetAtTime(0, t, 0.015); o.connect(g); g.connect(sortie);
        }
        const p3 = c.createGain(); this.env(p3, t, 0.002, court * 0.3, 0.2); this.osc("sine", Math.min(f * 3, 9000), t, fin, "partiel").connect(p3); p3.connect(sortie);
        break;
      }
      case "koto":
      case "guitare": {
        // le koto (une corde pincee claire, et le pince de l'ongle) ou la guitare etouffee (la paume
        // coupe la corde tout de suite)
        const k = this.corde(f), s2 = c.createBufferSource(), lg = k.buf.duration / k.taux, etouffe = timbre === "guitare";
        s2.buffer = k.buf; s2.playbackRate.value = k.taux;
        const g = c.createGain(), fin2 = Math.min(fin, t + lg), tient = etouffe ? Math.min(dur, 0.3) : Math.max(0.05, Math.min(dur, 1.6, lg - 0.35));
        g.gain.setValueAtTime(0.4 * vol, t); g.gain.setTargetAtTime(0, t + tient, etouffe ? 0.04 : 0.1);
        const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = etouffe ? Math.min(8000, f * 3) : Math.min(14000, f * 10); lp.Q.value = etouffe ? 2 : 0.7;
        s2.connect(lp); lp.connect(g); g.connect(sortie); s2.start(t); s2.stop(fin2);
        this.hauteurs.push(s2.detune); this.source(s2, fin2); this.noter(f, timbre);
        if (!etouffe) {
          const pn = c.createGain(), bp = c.createBiquadFilter(), fp = this.replier(f * 4, 36, 3600);
          this.env(pn, t, 0.0005, 0.015, 0.15 * vol); bp.type = "bandpass"; bp.frequency.value = fp; bp.Q.value = 2; this.noter(fp, "pince");
          this.bruitSrc(t, t + 0.05).connect(bp); bp.connect(pn); pn.connect(sortie);
        }
        break;
      }
      case "analog": {
        // un synthe pince analogique : deux dents de scie desaccordees, un filtre resonant qui claque et se referme
        const court = Math.min(dur, 0.55);
        this.env(sortie, t, 0.002, court, 0.05 * vol);
        const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = 6 + m * 4;
        lp.frequency.setValueAtTime(Math.min(14000, f * 14), t); lp.frequency.setTargetAtTime(Math.min(14000, f * 1.1), t + 0.002, 0.05);
        for (const ec of [-6, 6]) { const o = this.osc("sawtooth", f, t, fin); o.detune.value = ec; o.connect(lp); }
        lp.connect(sortie);
        break;
      }
      case "rhodes": {
        // un rhodes : la FM a rapport 1 fait le corps, la « tine » est un partiel aigu qui ne dure qu'un instant
        this.env(sortie, t, 0.003, Math.min(dur, 2.5), 0.045 * vol);
        const idx = c.createGain(), mod = this.osc("sine", f, t, fin, "mod");
        const iMax = Math.min(f * (0.9 + m), Math.max(0, 15000 - 2 * f));
        idx.gain.setValueAtTime(iMax, t); idx.gain.setTargetAtTime(f * 0.2, t, 0.35);
        mod.connect(idx); const p = this.osc("sine", f, t, fin); idx.connect(p.frequency); p.connect(sortie);
        const tine = c.createGain(); this.env(tine, t, 0.0005, 0.05, 0.25); this.osc("sine", Math.min(f * 7, 9000), t, fin, "partiel").connect(tine); tine.connect(sortie);
        break;
      }
      case "glock": {
        // un glockenspiel : deux octaves plus haut, ses partiels de lame (2,71 et 5,15), net et brillant
        const fh = this.replier(f * 4, 500, 3600), court = Math.min(dur, 1.5);
        this.env(sortie, t, 0.001, court, 0.045 * vol);
        this.osc("sine", fh, t, fin).connect(sortie);
        const p = c.createGain(); this.env(p, t, 0.0005, court * 0.3, 0.25); this.osc("sine", Math.min(fh * 2.71, 12000), t, fin, "partiel").connect(p); p.connect(sortie);
        const q = c.createGain(); this.env(q, t, 0.0005, 0.05, 0.15); this.osc("sine", Math.min(fh * 5.15, 14000), t, fin, "partiel").connect(q); q.connect(sortie);
        break;
      }
      case "fente": {
        // un tambour a fente : la note tombe d'un ton a la frappe, ronde et courte
        const court = Math.min(dur, 0.45);
        this.env(sortie, t, 0.002, court, 0.11 * vol);
        const o = this.osc("sine", f, t, fin); o.detune.setValueAtTime(200, t); o.detune.setTargetAtTime(0, t, 0.02); o.connect(sortie);
        const p = c.createGain(); this.env(p, t, 0.001, court * 0.3, 0.2); this.osc("sine", Math.min(f * 2.4, 9000), t, fin, "partiel").connect(p); p.connect(sortie);
        break;
      }
      case "woodblock": {
        // un bloc de bois accorde : un toc tres court, haut, et son bruit de bois sur la meme note
        const fh = this.replier(f * 4, 600, 3600);
        this.env(sortie, t, 0.001, 0.12, 0.08 * vol);
        this.osc("sine", fh, t, fin).connect(sortie);
        const g = c.createGain(), bp = c.createBiquadFilter(); this.env(g, t, 0.0005, 0.01, 0.3 * vol);
        bp.type = "bandpass"; bp.frequency.value = fh; bp.Q.value = 4; this.noter(fh, "bois");
        this.bruitSrc(t, t + 0.04).connect(bp); bp.connect(g); g.connect(sortie);
        break;
      }
      case "tubulaire": {
        // une cloche tubulaire : la note frappee et ses partiels inharmoniques, longue
        const court = Math.min(dur, 3.5);
        this.env(sortie, t, 0.002, court, 0.045 * vol);
        this.osc("sine", f, t, fin).connect(sortie);
        for (const [r, a, d] of [[2.76, 0.5, 0.5], [5.4, 0.3, 0.25], [8.93, 0.15, 0.12]]) {
          const g = c.createGain(); this.env(g, t, 0.001, court * d, a); this.osc("sine", Math.min(f * r, 14000), t, fin, "partiel").connect(g); g.connect(sortie);
        }
        break;
      }
      case "sub": {
        // un sub court : un sinus tres grave, net, sans queue
        const fs = this.replier(f, 40, 90), court = Math.min(dur, 0.35);
        this.env(sortie, t, 0.003, court, 0.18 * vol);
        this.osc("sine", fs, t, fin).connect(sortie);
        break;
      }
      case "bassesynth": {
        // une basse de synthe ronde : dent de scie et carre dans un filtre qui se referme vite
        const court = Math.min(dur, 0.5);
        this.env(sortie, t, 0.003, court, 0.08 * vol);
        const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = 3;
        lp.frequency.setValueAtTime(Math.min(4000, f * 7), t); lp.frequency.setTargetAtTime(Math.min(4000, f * 2), t + 0.003, 0.06);
        this.osc("sawtooth", f, t, fin).connect(lp);
        const g = c.createGain(); g.gain.value = 0.5; this.osc("square", f, t, fin).connect(g); g.connect(lp);
        lp.connect(sortie);
        break;
      }
      case "verre": {
        this.env(sortie, t, Math.max(attaque, dur * 0.3), dur, 0.05 * vol);
        this.osc("sine", f, t, fin).connect(sortie);
        this.osc("sine", f + 0.8 + m * 4, t, fin, "partiel").connect(sortie);
        break;
      }
      case "fm": {
        this.env(sortie, t, attaque, dur, 0.055 * vol);
        const r = 1.41 + m * 2.1, p = this.osc("sine", f, t, fin), mod = this.osc("sine", f * r, t, fin, "mod"), idx = c.createGain();
        const iMax = Math.max(0, 15000 - f * (1 + r));  // FM sans repliement (audit 2026-10-18)
        idx.gain.setValueAtTime(Math.min(f * (0.6 + m * 4), iMax), t); idx.gain.setTargetAtTime(Math.min(f * 0.05, iMax), t, dur * 0.25);
        mod.connect(idx); idx.connect(p.frequency); p.connect(sortie);
        break;
      }
      case "corde": {
        const k = this.corde(f), s = c.createBufferSource(), lg = k.buf.duration / k.taux;
        s.buffer = k.buf; s.playbackRate.value = k.taux;  // la justesse : la vraie periode de la corde ramenee a f
        // la corde s'eteint avant la fin de son tampon (avant, une note longue se coupait net a 5 s)
        const g = c.createGain(); g.gain.setValueAtTime(0.32 * vol, t); g.gain.setTargetAtTime(0, t + Math.max(0.05, Math.min(dur, lg - 0.35)), 0.08);
        s.connect(g); g.connect(sortie); s.start(t); s.stop(Math.min(fin, t + lg));
        this.hauteurs.push(s.detune); this.source(s, Math.min(fin, t + lg)); this.noter(f, "corde");
        break;
      }
      case "souffle": {
        // un bruit filtre autour de la note ; sa force ne monte plus avec la hauteur (avant, 15 dB de plus
        // dans l'aigu : la bande passante d'un filtre grandit avec sa frequence)
        const Q = 14 + m * 50;
        this.env(sortie, t, Math.max(attaque, 0.05), dur, 1.9 * vol * Math.sqrt(260 / f) * Math.sqrt(Q / 31.5));
        const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = f; bp.Q.value = Q;
        this.bruitSrc(t, fin).connect(bp); bp.connect(sortie);
        this.hauteurs.push(bp.detune); this.noter(f, "souffle");
        break;
      }
      case "gresil": {
        // des grains sur la note (ou son octave) ; le metal les fausse par le detune, la note reste juste
        const nb = Math.min(18, Math.round(4 + m * 10 + dur * 2));
        for (let i = 0; i < nb; i++) {
          const t0 = t + Math.random() * dur * 0.85, lg = 0.012 + Math.random() * 0.04;
          const g = c.createGain(); this.env(g, t0, lg * 0.3, lg, 0.11 * vol * (0.4 + Math.random() * 0.6));
          const o = this.osc("sine", f * (Math.random() < 0.3 ? 2 : 1), t0, t0 + lg + 0.05);
          o.detune.value = (Math.random() - 0.5) * m * 100; o.connect(g);
          g.connect(sortie);
        }
        break;
      }
      case "anneau": {
        this.env(sortie, t, attaque, dur, 0.07 * vol);
        const anneau = c.createGain(); anneau.gain.value = 0;
        this.osc("sine", f * (1.37 + m * 1.8), t, fin, "mod").connect(anneau.gain);
        this.osc("sine", f, t, fin).connect(anneau); anneau.connect(sortie);
        break;
      }
      case "goutte": {
        const court = Math.min(dur, 0.35 + m * 0.3);
        this.env(sortie, t, 0.003, court, 0.11 * vol);
        const o = this.osc("sine", f * 1.6, t, t + court + 0.3, "glisse");
        o.frequency.setTargetAtTime(f, t, 0.012); o.connect(sortie); this.noter(f, "goutte");
        break;
      }
      case "carre": {
        this.env(sortie, t, attaque, dur, 0.035 * vol);
        const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = Math.min(16000, f * (2 + m * 6));
        this.osc("square", f, t, fin).connect(lp); lp.connect(sortie);
        break;
      }
      case "voyelle": {
        // une voix de bouche : une dent de scie dans trois formants, qui passent par les voyelles du mot
        this.env(sortie, t, Math.max(attaque, 0.03), dur, 0.22 * vol, true);
        const src = this.osc("sawtooth", f, t, fin);
        const vs = (sansAccents((mot || "a").toLowerCase()).match(/ou|[aeiouy]/g) || ["a"]).slice(0, 4);
        for (let k = 0; k < 3; k++) {
          const bp = c.createBiquadFilter(), g = c.createGain();
          bp.type = "bandpass"; bp.Q.value = [7, 9, 11][k] + m * 10; g.gain.value = [1, 0.6, 0.35][k];
          vs.forEach((x, i) => {
            const fq = (this.FORMANTS[x] || this.FORMANTS.a)[k];
            if (i === 0) bp.frequency.setValueAtTime(fq, t); else bp.frequency.setTargetAtTime(fq, t + dur * i / vs.length, 0.06);
          });
          src.connect(bp); bp.connect(g); g.connect(sortie);
        }
        break;
      }
      case "orgue":
      case "chimere": {
        // l'orgue de papier, ou la chimere : un timbre invente a chaque poeme
        this.env(sortie, t, Math.max(attaque, 0.02), dur, 0.06 * vol, true);
        const o = this.osc("sine", f, t, fin);
        o.setPeriodicWave(timbre === "chimere" && this.chimere ? this.chimere : this.onde("orgue"));
        o.connect(sortie);
        break;
      }
      case "nuee": {
        // cinq dents de scie desaccordees dans un filtre : une nappe
        this.env(sortie, t, Math.max(attaque, dur * 0.35), dur, 0.03 * vol, true);
        const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = Math.min(16000, f * (2.5 + m * 4)); lp.connect(sortie);
        for (let i = 0; i < 5; i++) { const o = this.osc("sawtooth", f, t, fin); o.detune.value = (i - 2) * (4 + m * 14); o.connect(lp); }
        break;
      }
      case "sirene": {
        // elle glisse toujours depuis la note d'avant (voir plus bas)
        this.env(sortie, t, Math.max(attaque, dur * 0.2), dur, 0.06 * vol);
        this.osc("sine", f, t, fin).connect(sortie);
        const h2 = c.createGain(); h2.gain.value = 0.2; this.osc("triangle", f * 2, t, fin).connect(h2); h2.connect(sortie);
        break;
      }
      case "ondes": {
        // ondes courtes : une note qui passe mal, mangee par le bruit (au fond)
        this.env(sortie, t, attaque, dur, 0.25 * vol);
        const am = c.createGain(), lp = c.createBiquadFilter(), ga = c.createGain();
        am.gain.value = 0.4; lp.type = "lowpass"; lp.frequency.value = 9 + m * 30; ga.gain.value = 30;
        this.bruitSrc(t, fin).connect(lp); lp.connect(ga); ga.connect(am.gain);
        const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = f * 2; bp.Q.value = 5;
        this.hauteurs.push(bp.detune);
        this.osc("square", f, t, fin).connect(bp); bp.connect(am);
        const hp = c.createBiquadFilter(), gs = c.createGain(); hp.type = "bandpass"; hp.frequency.value = this.replier(f * 8, 36, 3600); hp.Q.value = 1; this.noter(hp.frequency.value, "ondes"); gs.gain.value = 0.08;
        this.bruitSrc(t, fin).connect(hp); hp.connect(gs); gs.connect(am);
        am.connect(sortie);
        break;
      }
      case "peau": {
        // une peau frappee : la hauteur tombe sur la note, un coup de bruit accorde
        const court = Math.min(dur, 0.25 + m * 0.5);
        this.env(sortie, t, 0.002, court, 0.12 * vol);
        const o = this.osc("sine", f * 2.5, t, t + court + 0.3, "glisse"); o.frequency.setTargetAtTime(f, t, 0.02); o.connect(sortie);
        const g = c.createGain(), bp = c.createBiquadFilter(); this.env(g, t, 0.001, 0.04, 0.5 * vol);
        bp.type = "bandpass"; bp.frequency.value = this.replier(f * 4, 36, 3600); bp.Q.value = 2; this.noter(bp.frequency.value, "peau");
        this.bruitSrc(t, t + 0.2).connect(bp); bp.connect(g); g.connect(sortie); this.noter(f, "peau");
        break;
      }
      default: {  // sinus
        this.env(sortie, t, attaque, dur, 0.07 * vol);
        this.osc("sine", f, t, fin).connect(sortie);
        const h2 = c.createGain(); h2.gain.value = 0.12 + m * 0.3;
        this.osc("sine", f * (2 + m * 0.37), t, fin, "partiel").connect(h2); h2.connect(sortie);
      }
    }
    // la hauteur qui bouge : tout passe par un seul bus, branche sur chaque detune de la note
    const busH = c.createGain();
    let module = false;
    const vib = this.mod("sonVibrato");
    if (vib > 0.01) {
      // le vibrato arrive apres l'attaque, jusqu'a 60 centiemes de ton
      const g = c.createGain();
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vib * 60, t + Math.min(dur * 0.5, 0.4 + attaque));
      this.brancherLfo(tirer(this.lfos.vib), g); g.connect(busH); module = true;
    }
    const us = this.mod("sonUsure");
    if (us > 0.01) {
      // la bande usee : un pleurage lent et un scintillement rapide
      const g = c.createGain(); g.gain.value = us;
      this.brancherLfo(tirer(this.lfos.usure), g); g.connect(busH); module = true;
    }
    // la sirene et le lead glissent d'eux-memes, mais seulement quand la modulation est la
    const gl = (timbre === "sirene" ? 1 : timbre === "lead" ? Math.max(0.2, this.v("sonGlisse")) : this.v("sonGlisse")) * this.modG, hz = this.mod("sonHasard");
    if ((gl > 0.01 && this.derniereF) || hz > 0.01) {
      const k = c.createConstantSource(); k.offset.value = 0;
      if (gl > 0.01 && this.derniereF) {
        k.offset.setValueAtTime(clamp(1200 * Math.log2(this.derniereF / f), -2400, 2400), t);
        k.offset.setTargetAtTime(0, t, Math.max(0.01, gl * dur * 0.3));
      }
      if (hz > 0.01) {
        // echantillonne-bloque : la hauteur saute au hasard par demi-tons, en marches, puis revient
        const pasH = 0.06 + (1 - hz) * 0.25;
        for (let x = t + pasH, i = 0; x < t + dur && i < 40; x += pasH, i++)
          k.offset.setValueAtTime(Math.random() < 0.5 ? 0 : Math.round((Math.random() * 2 - 1) * hz * 12) * 100, x);
      }
      k.start(t); k.stop(fin); this.source(k, fin); k.connect(busH); module = true;
    }
    if (module) for (const p of this.hauteurs) busH.connect(p);
    // le bruit dans la note : un souffle accorde sur elle, a peine, et au fond
    const br = this.v("sonBruit");
    if (br > 0.01 && timbre !== "souffle") {
      const fb = this.replier(f * 2, 36, 3600);
      const g = c.createGain(); this.env(g, t, Math.max(attaque, 0.02), dur * 0.8, 0.5 * vol * br * Math.sqrt(520 / fb));
      const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = fb; bp.Q.value = 6; this.noter(fb, "bruit de la note");
      this.bruitSrc(t, fin).connect(bp); bp.connect(g); g.connect(this.bruits);
    }
    this.derniereF = f; this.fVoix = f;
    this.hauteurs = null;
    this.finVoix(avant, t, fin, timbre, 1);
  },
  // une corde pincee (Karplus-Strong), calculee une fois par hauteur. Rend le tampon et la vitesse de
  // lecture qui la remet juste (avant, la periode entiere la faussait de plusieurs dizaines de cents
  // dans l'aigu) ; le tampon s'eteint de lui-meme et le cache ne passe pas 2,5 millions d'echantillons
  // (avant, jusqu'a 77 Mo)
  corde(f) {
    const metal = Math.round(this.v("sonMetal") * 10) / 10, cle = Math.round(f * 4) + "|" + metal;
    if (this.cordes.has(cle)) { const k = this.cordes.get(cle); this.cordes.delete(cle); this.cordes.set(cle, k); return k; }
    const c = this.ctx, sr = c.sampleRate, N = Math.max(2, Math.round(sr / f)), duree = clamp(4 * Math.sqrt(220 / f), 1.2, 4.5);
    const n = Math.round(sr * duree), buf = c.createBuffer(1, n, sr), d = buf.getChannelData(0);
    const amorti = 0.4985 - metal * 0.002, fondu = Math.round(sr * 0.03);
    for (let i = 0; i < n; i++) d[i] = i < N ? Math.random() * 2 - 1 : amorti * (d[i - N] + d[i - N + 1]);
    for (let i = 0; i < fondu; i++) d[n - 1 - i] *= i / fondu;
    // la boucle moyenne deux echantillons voisins : sa periode vraie est N - 0,5
    const k = { buf, taux: (N - 0.5) * f / sr };
    this.cordes.set(cle, k); this.cordesTaille += n;
    while (this.cordesTaille > 2.5e6 && this.cordes.size > 1) {
      const vieille = this.cordes.keys().next().value;
      this.cordesTaille -= this.cordes.get(vieille).buf.length; this.cordes.delete(vieille);
    }
    return k;
  },
  // la poussiere : un craquement, accorde sur une note aigue de la gamme ; adouci (sans attaque seche)
  // et au fond (Jiiji : « les craquements c'est un peu dur, c'est bien pour la texture »)
  craquement(t) {
    if (!this.ctx || !this.stats) return;
    const now = this.maintenant();
    this.grainsJetons = Math.min(12, this.grainsJetons + Math.max(0, now - (this.grainsT || now)) * 30); this.grainsT = now;
    t = Math.max(t, now + 0.03);
    if (this.grainsJetons < 1 || !this.admettre("craquement", t, 0, 0.5)) return;
    this.grainsJetons--;
    const c = this.ctx, avant = this.debutVoix(), g = c.createGain(), bp = c.createBiquadFilter(), place = c.createStereoPanner();
    const n = this.gamme().length, fq = this.frequence(this.racine + n * 2 + Math.floor(Math.random() * n * 1.5));
    bp.type = "bandpass"; bp.frequency.value = fq; bp.Q.value = 1.2; this.noter(fq, "craquement");
    const lg = 0.002 + Math.random() * 0.007, a = 0.3 * (0.3 + Math.random()), fin = t + lg * 8 + 0.03;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + 0.0015); g.gain.setTargetAtTime(0, t + 0.0015 + lg, lg * 1.5);
    this.bruitSrc(t, fin).connect(bp); bp.connect(g);
    place.pan.value = (Math.random() * 2 - 1) * this.v("sonLargeur"); g.connect(place); place.connect(this.bruits);
    this.finVoix(avant, t, fin, "craquement", 0);
  },
  // la rime : une cloche dans la gamme du poeme. Sa note vient de la lettre de la rime et de l'accord
  // de la mesure ; sans mot (la manette), chaque coup avance d'un ton de l'accord (Jiiji : « la cloche
  // n'a qu'une seule note »)
  cloche(lettre, t, mot) {
    if (!this.ctx || !this.stats) return;
    const n = this.gamme().length, l = ((lettre || "A").charCodeAt(0) - 65) || 0;
    const d = this.racine + this.ton(mot ? l : l + this.cloches++) + n * 2, f = this.frequence(d);
    t = Math.max(t, this.maintenant() + 0.03);
    // une cloche toutes les 0,8 s au plus, toutes les 2 s en rafale : les rimes ne prennent pas toutes les voix
    const ecart = this.densiteA(this.maintenant()) > 3 ? 2 : 0.8;
    if (t - (this.derniereCloche || -9) < ecart || !this.admettre("cloche", t, 1, 0.5)) { this.absorber(f); return; }
    this.derniereCloche = t;
    const c = this.ctx, avant = this.debutVoix(), g = c.createGain(), fin = t + 2.1;
    this.env(g, t, 0.003, 1.8, 0.04);
    this.osc("sine", f, t, fin).connect(g);
    const p2 = c.createGain(); p2.gain.value = 0.35; this.osc("sine", f * 2.76, t, fin, "partiel").connect(p2); p2.connect(g);
    g.connect(this.entree);
    this.finVoix(avant, t, fin, "cloche", 1);
    if (typeof bus !== "undefined") bus.emettre("note", { f, degre: d, vel: 0.5, duree: 1.8, timbre: "cloche", pan: 0, poete: "", mot: mot || "", t });
  },
  // les mots qui paraissent (Lecture, Tourbillon, Calligramme, la Banque, et toute scene qui emet
  // « mot » sur le bus) : en mode « mots », chacun demande sa note a l'ordonnanceur, qui les pose sur la
  // grille, les regroupe et passe a la texture quand ils se bousculent ; 200 mots par seconde ne
  // creent pas plus de voix que le plafond
  mot(m) {
    if (!this.ctx || !S.son || !m || !this.stats) return;
    const texte = m.t || m.texte || "", now = this.maintenant();
    // le meme mot annonce deux fois (son.mot et le bus) ne sonne qu'une fois
    const vu = this.recents.get(texte);
    if (vu != null && now - vu < 0.1) return;
    this.recents.set(texte, now);
    // un mot neuf du poeme : un tic doux, dans tous les modes (s'il sert la musique, voir ticMot)
    this.ticMot(texte);
    if (S.sonSuit !== "mots") return;
    const ev = { mot: texte, poete: m.poete, cours: m.cours, fin: !!m.cloche, lettre: m.cloche,
      syll: (sansAccents(texte.toLowerCase()).match(/[aeiouy]+/g) || [1]).length };
    this.jouerMot(ev, now, this.dureeTemps(), this.hacher(texte), { motif: S.sonPattern === "motif" });
  },
  // la gamme du poeme, montee puis descendue
  jouerGamme() {
    if (!this.ctx) return;
    const n = this.gamme().length, t = this.maintenant() + 0.05;
    for (let i = 0; i <= n * 2; i++) {
      const d = i <= n ? i : 2 * n - i;
      this.voix("sinus", t + i * 0.32, this.frequence(d), 0.9, 0.8, (d / n - 0.5) * S.sonLargeur, "", { place: true });
    }
  },
  // les petits bruits de la Banque (pieces, rouleaux) : ramenes a la note la plus proche de la gamme
  note(freq, duree, type, vol, retard) {
    if (!this.ctx || !S.son || !this.stats) return;
    const t = this.maintenant() + 0.03 + (retard || 0), f = this.dansLaGamme(freq);
    if (!this.admettre("note", t, 1, 0.5)) return;
    const avant = this.debutVoix(), o = this.osc(type, f, t, t + duree + 0.05), g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0005, t + duree);
    o.connect(g); g.connect(this.entree);
    this.finVoix(avant, t, t + duree + 0.05, "note", 1);
  },
  // la piece (et le coup de coeur) : deux notes de l'accord en cours, tout en haut, qui changent a
  // chaque fois (avant : 1318 et 1760 Hz, quelle que soit la gamme)
  piece() {
    if (!this.ctx) return;
    const n = this.gamme().length, d = this.racine + n * 3 + this.ton(this.cloches++ % 3);
    this.note(this.frequence(d), 0.12, "square", 0.03);
    this.note(this.frequence(d + 2), 0.5, "square", 0.025, 0.08);
  },
  // le tourbillon qui avale : de la fondamentale de l'accord, deux octaves plus bas (avant : 180 a 38 Hz)
  vortex() {
    if (!this.ctx || !S.son || !this.stats) return;
    const t = this.maintenant() + 0.03;
    if (!this.admettre("vortex", t, 1, 0.5)) return;
    const haut = this.replier(this.frequence(this.racine), 150, 300), bas = haut / 4;
    const avant = this.debutVoix(), o = this.osc("sine", haut, t, t + 4.3, "glisse"), g = this.ctx.createGain();
    o.frequency.setValueAtTime(haut, t); o.frequency.exponentialRampToValueAtTime(bas, t + 4);
    this.noter(haut, "vortex"); this.noter(bas, "vortex");
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.06, t + 1); g.gain.linearRampToValueAtTime(0, t + 4.2);
    o.connect(g); g.connect(this.entree);
    this.finVoix(avant, t, t + 4.3, "vortex", 1);
  },
};

// le bus (tout est lie, 2026-10-18) : un mot qui parait sonne en mode « mots » ; un vers qui commence
// fait muter le motif et ouvre une mesure (la basse)
if (typeof bus !== "undefined") {
  // une syllabe lue au micro (mode poesie) : une note qui frappe, a la hauteur de la voix ramenee dans
  // la gamme du poeme ; une syllabe sourde ne donne qu'un tic. L'ordonnanceur la pose et la borne.
  bus.ecouter("syllabe", d => {
    if (!d || !son.ctx || !S.son || !S.sonSyllabes || !son.stats) return;
    if (!d.voise || !(d.hauteur > 50)) { son.lettres(1); return; }
    const n = son.gamme().length, deg = son.degreDe(son.replier(d.hauteur * 2, 130, 1100));
    son.voix(son.timbreDe(son.poeteVers) || "kalimba", son.maintenant(), son.frequence(deg), 1, clamp(0.4 + (d.force || 0.5), 0.4, 1.2), 0, "", { poete: son.poeteVers });
  });
  bus.ecouter("mot", d => { if (d && son.ctx && S.son) son.mot({ t: d.texte, poete: d.poete, cours: d.cours }); });
  bus.ecouter("vers", () => { son.modVers = Math.random() < clamp(Number(S.sonModPart) || 0, 0, 1); });
  bus.ecouter("vers", d => {
    if (!d || !son.ctx || !S.son || !son.stats || S.sonSuit !== "mots" || !son.motif) return;
    son.muter(d.poete);
    if (d.poete) son.poeteVers = d.poete;
  });
}

/* ================================================================ la banque de l'IA */

// Les IA locales inventent en coulisse des synthes et des patterns (2026-10-19, Jiiji : « des nouveaux
// synthes et patterns de synthes ») : un script ecrit ecran\banque-ia.json entre deux poemes, sections
// « synthes » et « patterns » (la section « patchs » est aux cables, cv.js). Tout ce qui vient du fichier
// passe par une validation qui borne chaque champ, refuse ce qui sonnerait comme un drone ou du bruit, et
// ne jette jamais d'erreur. Un synthe est une recette en donnees, jouee par son.voix sans code neuf ;
// son volume est egalise par une mesure hors ligne. Un pattern a le format de SON_PATTERNS.
//
// Le format d'une recette de synthe (bornes : SON_RECETTE_BORNES) :
//   { cle, nom, humeur: "percussif" | "doux",
//     oscs: [{ forme: "sine"|"triangle"|"square"|"sawtooth", rapport, desaccord, niveau, declin }]  1 a 4
//       (rapport : multiple de la note ; le plus fort est ramene a une octave de la note : la note reste
//        dans la gamme ; un rapport hors octave est un partiel, plus faible et plus court)
//     fm: { rapport, indice, declin } ou null        (indice : multiple de la note, il retombe en « declin » s)
//     bruit: { niveau, q, rapport, declin } ou null  (accorde sur une octave de la note, court, jamais devant)
//     env: { attaque, declin, maintien, relache, duree } (secondes ; maintien : niveau tenu, 0 a 0,6)
//     filtre: { type: "lowpass"|"highpass"|"bandpass", rapport, q, env, temps } ou null
//       (rapport : multiple de la note ; env : -1 a 1, le filtre part de rapport x (1 + 3 env) et y revient)
//     saturation, chorus }                          (0 a 0,5 ; 0 a 1)
const SON_RECETTE_BORNES = {
  osc: { rapport: [0.25, 12], desaccord: [-30, 30], niveau: [0, 1], declin: [0.05, 1] },
  fm: { rapport: [0.5, 8], indice: [0, 4], declin: [0.02, 2] },
  bruit: { niveau: [0, 0.35], q: [0.5, 12], declin: [0.005, 0.3] },
  env: { attaque: [0.001, 0.25], declin: [0.05, 3], maintien: [0, 0.6], relache: [0.02, 0.25], duree: [0.1, 3.5] },
  filtre: { rapport: [0.5, 16], q: [0, 8], env: [-1, 1], temps: [0.01, 1] },
  saturation: [0, 0.5], chorus: [0, 1],
};
const SON_FORMES = ["sine", "triangle", "square", "sawtooth"];
const SON_OCTAVES = [0.25, 0.5, 1, 2, 4, 8];
// quelques timbres d'ici, recrits en recettes : la preuve que le format suffit (et la reference du volume)
const SON_RECETTES_EXEMPLES = {
  "r-pluck": { nom: "Pluck (recette)", humeur: "percussif", oscs: [{ forme: "sawtooth", rapport: 1, niveau: 1 }, { forme: "square", rapport: 1, desaccord: 6, niveau: 0.35 }],
    env: { attaque: 0.003, declin: 0.5, maintien: 0, relache: 0.05, duree: 1.2 }, filtre: { type: "lowpass", rapport: 1.2, q: 3, env: 1, temps: 0.1 } },
  "r-marimba": { nom: "Marimba (recette)", humeur: "percussif", oscs: [{ forme: "sine", rapport: 1, niveau: 1 }, { forme: "sine", rapport: 4, niveau: 0.35, declin: 0.35 }],
    bruit: { niveau: 0.25, q: 1.5, rapport: 4, declin: 0.012 }, env: { attaque: 0.002, declin: 0.45, maintien: 0, relache: 0.05, duree: 0.9 } },
  "r-kalimba": { nom: "Kalimba (recette)", humeur: "percussif", oscs: [{ forme: "sine", rapport: 1, niveau: 1 }, { forme: "sine", rapport: 5.9, niveau: 0.5, declin: 0.05 },
    { forme: "triangle", rapport: 2, niveau: 0.12 }], env: { attaque: 0.002, declin: 0.8, maintien: 0, relache: 0.05, duree: 1.6 } },
  "r-glock": { nom: "Glockenspiel (recette)", humeur: "percussif", oscs: [{ forme: "sine", rapport: 4, niveau: 1 }, { forme: "sine", rapport: 10.84, niveau: 0.25, declin: 0.3 }],
    env: { attaque: 0.001, declin: 0.75, maintien: 0, relache: 0.05, duree: 1.5 } },
  "r-rhodes": { nom: "Rhodes (recette)", humeur: "doux", oscs: [{ forme: "sine", rapport: 1, niveau: 1 }, { forme: "sine", rapport: 7, niveau: 0.25, declin: 0.05 }],
    fm: { rapport: 1, indice: 0.9, declin: 0.35 }, env: { attaque: 0.003, declin: 1.2, maintien: 0, relache: 0.08, duree: 2.5 }, chorus: 0.2 },
};

// une valeur bornee (un nombre faux prend le defaut) ; une cle propre ; un nom sans caracteres de controle
function borneIA(x, b, defaut) { if (x === null || x === undefined || x === "") return defaut; const v = Number(x); return isFinite(v) ? clamp(v, b[0], b[1]) : defaut; }
function cleIA(x, prefixe) {
  const c = sansAccents(String(x || "")).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 36);
  return c ? (c.startsWith(prefixe) ? c : prefixe + c) : "";
}
function nomIA(x, defaut) { const n = String(x || "").replace(/[\u0000-\u001f\u2014]/g, " ").trim().slice(0, 40); return n || defaut; }

// la validation d'une recette : rend { recette, corrections } ou { refus } ; ne jette jamais
function validerRecette(x, cleDefaut) {
  try {
    if (!x || typeof x !== "object" || Array.isArray(x)) return { refus: "pas un objet" };
    const B = SON_RECETTE_BORNES, notes = [];
    const cle = cleIA(x.cle || cleDefaut || x.nom, "ia-");
    if (!cle) return { refus: "sans nom" };
    if (!Array.isArray(x.oscs) || !x.oscs.length) return { refus: "aucun oscillateur" };
    if (x.oscs.length > 4) notes.push("4 oscillateurs au plus");
    const oscs = x.oscs.slice(0, 4).filter(o => o && typeof o === "object").map(o => ({
      forme: SON_FORMES.includes(o.forme) ? o.forme : (notes.push("forme inconnue : sinus"), "sine"),
      rapport: borneIA(o.rapport, B.osc.rapport, 1), desaccord: borneIA(o.desaccord, B.osc.desaccord, 0),
      niveau: borneIA(o.niveau, B.osc.niveau, 0.5), declin: borneIA(o.declin, B.osc.declin, 1) }));
    if (!oscs.length || oscs.every(o => o.niveau < 0.01)) return { refus: "aucun oscillateur ne sonne" };
    // la fondamentale (le plus fort) tombe sur une octave de la note : la note reste dans la gamme
    const fo = oscs.reduce((a, o) => (o.niveau > a.niveau ? o : a), oscs[0]);
    const oct = SON_OCTAVES.reduce((a, r) => (Math.abs(Math.log2(r / fo.rapport)) < Math.abs(Math.log2(a / fo.rapport)) ? r : a), 1);
    if (oct !== fo.rapport) { notes.push("fondamentale ramenee a " + oct); fo.rapport = oct; }
    for (const o of oscs) {
      o.partiel = !SON_OCTAVES.some(r => Math.abs(r - o.rapport) < 1e-6);
      // un partiel (hors octave) reste plus faible et plus court que la fondamentale : jamais un accord faux
      if (o.partiel && o.niveau > fo.niveau * 0.6) { o.niveau = fo.niveau * 0.6; notes.push("partiel adouci"); }
      if (o.partiel && o.declin > 0.5) { o.declin = 0.5; notes.push("partiel raccourci"); }
    }
    const fm = x.fm && typeof x.fm === "object" ? { rapport: borneIA(x.fm.rapport, B.fm.rapport, 1), indice: borneIA(x.fm.indice, B.fm.indice, 0.5),
      declin: borneIA(x.fm.declin, B.fm.declin, 0.3) } : null;
    let bruit = x.bruit && typeof x.bruit === "object" ? { niveau: borneIA(x.bruit.niveau, B.bruit.niveau, 0.1), q: borneIA(x.bruit.q, B.bruit.q, 2),
      rapport: [1, 2, 4, 8].reduce((a, r) => (Math.abs(r - Number(x.bruit.rapport)) < Math.abs(a - Number(x.bruit.rapport)) ? r : a), 2),
      declin: borneIA(x.bruit.declin, B.bruit.declin, 0.02) } : null;
    if (x.bruit && Number(x.bruit.niveau) > B.bruit.niveau[1]) notes.push("bruit baisse (jamais devant)");
    if (bruit && bruit.niveau < 0.005) bruit = null;
    const e = x.env && typeof x.env === "object" ? x.env : {};
    const env = { attaque: borneIA(e.attaque, B.env.attaque, 0.003), declin: borneIA(e.declin, B.env.declin, 0.5),
      maintien: borneIA(e.maintien, B.env.maintien, 0), relache: borneIA(e.relache, B.env.relache, 0.08), duree: borneIA(e.duree, B.env.duree, 1.2) };
    // pas de drone : ce qui tient est court, ce qui monte lentement aussi
    if (Number(e.duree) > B.env.duree[1] || Number(e.maintien) > B.env.maintien[1]) notes.push("tenue plafonnee (pas de drone)");
    if (env.maintien > 0.3 && env.duree > 2) { env.duree = 2; notes.push("note tenue raccourcie a 2 s"); }
    if (env.attaque > 0.08 && env.duree > 2.5) { env.duree = 2.5; notes.push("note lente raccourcie"); }
    if (env.declin > env.duree * 1.5) env.declin = env.duree * 1.5;
    const f = x.filtre && typeof x.filtre === "object" ? { type: ["lowpass", "highpass", "bandpass"].includes(x.filtre.type) ? x.filtre.type : "lowpass",
      rapport: borneIA(x.filtre.rapport, B.filtre.rapport, 4), q: borneIA(x.filtre.q, B.filtre.q, 1), env: borneIA(x.filtre.env, B.filtre.env, 0),
      temps: borneIA(x.filtre.temps, B.filtre.temps, 0.1) } : null;
    // un passe-haut ou un passe-bande qui coupe la fondamentale ne laisserait que du sifflement : refuse
    if (f && f.type === "highpass" && f.rapport > fo.rapport * 2) { f.rapport = fo.rapport; notes.push("passe-haut ramene sous la note"); }
    if (f && f.type === "lowpass" && f.rapport < fo.rapport) { f.rapport = fo.rapport * 1.5; notes.push("passe-bas ouvert sur la note"); }
    // un passe-bande ferait entendre l'harmonique qu'il garde : il se pose sur une octave de la note
    if (f && f.type === "bandpass") {
      const o2 = SON_OCTAVES.reduce((a, r) => (Math.abs(Math.log2(r / f.rapport)) < Math.abs(Math.log2(a / f.rapport)) ? r : a), 1);
      if (o2 !== f.rapport) { f.rapport = o2; notes.push("passe-bande pose sur une octave"); }
    }
    const R = { cle, nom: nomIA(x.nom, cle), humeur: x.humeur === "doux" ? "doux" : "percussif", oscs, fm, bruit, env, filtre: f,
      saturation: borneIA(x.saturation, B.saturation, 0), chorus: borneIA(x.chorus, B.chorus, 0), gain: 0, ia: true };
    // un premier volume par formule (la mesure hors ligne l'affine ensuite)
    const somme = oscs.reduce((a, o) => a + o.niveau * o.niveau * (o.forme === "sine" ? 0.5 : o.forme === "triangle" ? 0.33 : o.forme === "square" ? 1 : 0.33), 0);
    R.gain = clamp(0.035 / Math.sqrt(Math.max(1e-4, somme)), 0.005, 0.2);
    return { recette: R, corrections: notes };
  } catch (err) { return { refus: "illisible" }; }
}

// la validation d'un pattern (le format de SON_PATTERNS) ; ne jette jamais
function validerPattern(x, cleDefaut) {
  try {
    if (!x || typeof x !== "object" || Array.isArray(x)) return { refus: "pas un objet" };
    const notes = [], cle = cleIA(x.cle || cleDefaut || x.nom, "ia-");
    if (!cle) return { refus: "sans nom" };
    const r = String(x.r || "").replace(/[^xX.]/g, "").slice(0, 32);
    if (r.length < 2) return { refus: "rythme trop court" };
    if (!/[xX]/.test(r)) return { refus: "aucune note dans le rythme" };
    if (String(x.r).length !== r.length) notes.push("rythme nettoye");
    const ent = (v, a, b) => { const n = Math.round(Number(v)); return isFinite(n) ? clamp(n, a, b) : null; };
    const liste = (l, a, b, max) => Array.isArray(l) ? l.slice(0, max).map(v => ent(v, a, b)).filter(v => v !== null) : [];
    let t = liste(x.t, -3, 9, 32), d = liste(x.d, -14, 14, 32);
    if (d.length) t = [];
    if (!t.length && !d.length) return { refus: "ni melodie en tons ni en degres" };
    let b = Array.isArray(x.b) ? x.b.slice(0, 16).map(v => (v === null ? null : ent(v, -3, 6))) : [0, null, null, null];
    if (!b.length) b = [0];
    if (b.every(v => v === null)) b[0] = 0;
    const br = typeof x.br === "string" ? x.br.replace(/[^x.]/g, "").slice(0, 32) : null;
    const p = liste(x.p, -7, 7, 8);
    const g = Array.isArray(x.g) ? x.g.filter(k => GAMMES.some(G => G[0] === k)).slice(0, 4) : null;
    const P = { cle, nom: nomIA(x.nom, cle), humeur: ["calme", "vif", "sombre", "lumineux"].includes(x.humeur) ? x.humeur : "calme",
      energie: borneIA(x.energie, [0, 1], 0.5), r, b, p: p.length ? p : [0], sub: ent(x.sub, 1, 4) || 2, double: ent(x.double, 0, 4) || 0, ia: true };
    if (t.length) P.t = t; else P.d = d;
    if (br && br.includes("x")) P.br = br;
    if (g && g.length) P.g = g;
    return { pattern: P, corrections: notes };
  } catch (err) { return { refus: "illisible" }; }
}

// une recette jouee : les oscillateurs, la FM, le bruit, le filtre, la saturation, le chorus, puis
// l'enveloppe. « aide » cree les sources (son.osc dans une vraie voix, autre chose pour la mesure)
function jouerRecette(c, sortie, R, t, f, dur, vol, aide) {
  const E = R.env, D = Math.max(0.05, Math.min(dur, E.duree)), fin = t + D + E.relache + 0.05, g0 = vol * R.gain;
  const amp = c.createGain();
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(g0, t + E.attaque);
  amp.gain.setTargetAtTime(g0 * E.maintien, t + E.attaque, Math.max(0.01, E.declin / 3));
  amp.gain.setTargetAtTime(0, t + Math.max(E.attaque + 0.01, D), Math.max(0.01, E.relache / 4));
  let tete = amp;
  if (R.saturation > 0.01) {
    const ws = c.createWaveShaper(), k = 1 + R.saturation * 6, n = 512, cu = new Float32Array(n), no = Math.tanh(k);
    for (let i = 0; i < n; i++) { const xx = i / (n - 1) * 2 - 1; cu[i] = Math.tanh(k * xx) / no; }
    ws.curve = cu; ws.connect(amp); tete = ws;
  }
  if (R.filtre) {
    const F = R.filtre, bq = c.createBiquadFilter(), base = Math.min(16000, f * F.rapport);
    bq.type = F.type; bq.Q.value = F.type === "bandpass" ? Math.max(0.5, F.q) : F.q;
    if (Math.abs(F.env) > 0.01) { bq.frequency.setValueAtTime(clamp(base * (1 + F.env * 3), 30, 16000), t); bq.frequency.setTargetAtTime(base, t + 0.002, F.temps); }
    else bq.frequency.value = base;
    bq.connect(tete); tete = bq;
  }
  const mix = c.createGain(); mix.connect(tete);
  let fond = null;
  for (const O of R.oscs) {
    if (O.niveau < 0.01) continue;
    const copies = R.chorus > 0.02 && !O.partiel ? [-1, 1] : [0];
    for (const cote of copies) {
      const g = c.createGain(), niv = O.niveau * (copies.length > 1 ? 0.6 : 1);
      if (O.declin < 0.999) { g.gain.setValueAtTime(niv, t); g.gain.setTargetAtTime(0, t + 0.002, Math.max(0.005, E.declin * O.declin / 3)); }
      else g.gain.value = niv;
      const o = aide.osc(O.forme, Math.min(14000, f * O.rapport), t, fin, O.partiel ? "partiel" : undefined);
      o.detune.value = O.desaccord + cote * R.chorus * 10;
      o.connect(g); g.connect(mix);
      if (!fond && !O.partiel) fond = o;
    }
  }
  if (R.fm && fond && R.fm.indice > 0.01) {
    const mod = aide.osc("sine", f * R.fm.rapport, t, fin, "mod"), idx = c.createGain();
    const iMax = Math.min(f * R.fm.indice, Math.max(0, 15000 - f * (1 + R.fm.rapport)));
    idx.gain.setValueAtTime(iMax, t); idx.gain.setTargetAtTime(iMax * 0.1, t, R.fm.declin);
    mod.connect(idx); idx.connect(fond.frequency);
  }
  if (R.bruit && aide.bruit) {
    const N = R.bruit, bp = c.createBiquadFilter(), g = c.createGain(), fb = son.replier(f * N.rapport, 36, 3600);
    bp.type = "bandpass"; bp.frequency.value = fb; bp.Q.value = N.q;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(N.niveau * 2, t + 0.001); g.gain.setTargetAtTime(0, t + 0.001, N.declin / 3);
    aide.bruit(t, t + N.declin * 4 + 0.02).connect(bp); bp.connect(g); g.connect(mix);
    if (aide.noter) aide.noter(fb, "bruit de recette");
  }
  amp.connect(sortie);
  return fin;
}

Object.assign(son, {
  recettes: {}, patternsIA: [], iaCharge: "", iaNb: { synthes: 0, patterns: 0, refus: 0 },
  // une banque arrivee (du fichier, ou d'un essai) : chaque recette et chaque pattern est valide ; les
  // refus sont comptes, jamais jetes en erreur. Rend le bilan.
  recevoirBanqueIA(j) {
    const bilan = { synthes: [], patterns: [], refus: [], corrections: [] };
    try {
      const S1 = j && Array.isArray(j.synthes) ? j.synthes.slice(0, 64) : [], P1 = j && Array.isArray(j.patterns) ? j.patterns.slice(0, 64) : [];
      const rec = {}, pats = [];
      S1.forEach((x, i) => {
        const v = validerRecette(x, "synthe-" + i);
        if (v.refus) { bilan.refus.push("synthe " + i + " : " + v.refus); return; }
        if (rec[v.recette.cle] || this.EGAL[v.recette.cle] !== undefined) v.recette.cle += "-" + i;
        rec[v.recette.cle] = v.recette; bilan.synthes.push(v.recette.cle);
        if (v.corrections.length) bilan.corrections.push(v.recette.cle + " : " + v.corrections.join(", "));
      });
      P1.forEach((x, i) => {
        const v = validerPattern(x, "pattern-" + i);
        if (v.refus) { bilan.refus.push("pattern " + i + " : " + v.refus); return; }
        if (pats.some(p => p.cle === v.pattern.cle) || SON_PATTERNS.some(p => p.cle === v.pattern.cle)) v.pattern.cle += "-" + i;
        pats.push(v.pattern); bilan.patterns.push(v.pattern.cle);
        if (v.corrections.length) bilan.corrections.push(v.pattern.cle + " : " + v.corrections.join(", "));
      });
      // les recettes gardent leur volume deja mesure si elles reviennent
      for (const k in rec) if (this.recettes[k] && this.recettes[k].mesure) { rec[k].gain = this.recettes[k].gain; rec[k].mesure = this.recettes[k].mesure; }
      this.recettes = rec; this.patternsIA = pats;
      this.iaNb = { synthes: bilan.synthes.length, patterns: bilan.patterns.length, refus: bilan.refus.length };
      this.mesurerRecettes();
    } catch (err) { bilan.refus.push("banque illisible"); }
    return bilan;
  },
  // la mesure hors ligne : une note seule, sans la chaine de l'ecran ; on compare a la recette du pluck.
  // On garde la racine du rapport (comme pour les timbres d'ici) ; on refuse ce qui tient plus de 4 s
  // (un drone) ou ne sonne pas
  async mesurerUne(R) {
    const sr = 22050, c = new OfflineAudioContext(1, sr * 4.5, sr), nb = c.createBuffer(1, sr, sr), d = nb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const aide = { osc: (type, f, t, fin) => { const o = c.createOscillator(); o.type = type; o.frequency.value = f; o.start(t); o.stop(fin); return o; },
      bruit: (t, fin) => { const s = c.createBufferSource(); s.buffer = nb; s.loop = true; s.start(t); s.stop(fin); return s; } };
    jouerRecette(c, c.destination, R, 0.02, 261.63, 3, 1, aide);
    const x = (await c.startRendering()).getChannelData(0);
    let pic = 0, s = 0, nan = 0;
    const n5 = Math.round(sr * 0.5);
    for (let i = 0; i < x.length; i++) { const v = x[i]; if (v !== v) { nan++; continue; } if (Math.abs(v) > pic) pic = Math.abs(v); if (i < n5) s += v * v; }
    let fin = 0; for (let i = x.length - 1; i >= 0; i--) if (Math.abs(x[i]) > pic * 0.0316) { fin = i / sr; break; }
    return { pic, rms: Math.sqrt(s / n5), utile: fin, nan };
  },
  async mesurerRecettes() {
    try {
      if (typeof OfflineAudioContext === "undefined") return;
      if (!this.refRecette) {
        const v = validerRecette(SON_RECETTES_EXEMPLES["r-pluck"], "r-pluck");
        this.refRecette = await this.mesurerUne(v.recette);
        this.refRecette.gain = v.recette.gain;
      }
      for (const k of Object.keys(this.recettes)) {
        const R = this.recettes[k];
        if (!R || R.mesure) continue;
        const m = await this.mesurerUne(R);
        if (m.nan || !(m.rms > 1e-5) || m.utile > 4) { delete this.recettes[k]; this.iaNb.refus++; this.iaNb.synthes--; continue; }
        // meme RMS que le pluck a la racine pres, et une crete bornee
        const rapport = (this.refRecette.rms / this.refRecette.gain) / (m.rms / R.gain);
        R.gain = clamp(this.refRecette.gain * Math.sqrt(rapport) * Math.sqrt(R.gain / this.refRecette.gain), 0.003, 0.25);
        R.mesure = { pic: +m.pic.toFixed(3), rms: +m.rms.toFixed(4), utile: +m.utile.toFixed(2) };
      }
    } catch (err) { /* une mesure qui echoue garde le volume de la formule */ }
  },
  // la dose : 0, jamais ; 1, l'IA tient autant de place que la banque d'ici
  doseIA() { return clamp(Number(S.sonIA) || 0, 0, 1); },
  // les poids d'usage, gardes dans le navigateur (jamais dans S)
  CLE_POIDS_IA: "poiasie-banque-ia-poids-v1",
  poidsIA() {
    if (!this._poids) { try { this._poids = JSON.parse(localStorage.getItem(this.CLE_POIDS_IA) || "{}") || {}; } catch (e) { this._poids = {}; } }
    return this._poids;
  },
  poidsDe(cle) { const w = Number(this.poidsIA()[cle]); return isFinite(w) && w > 0 ? w : 1; },
  ajusterPoids(cle, delta, pourquoi) {
    if (!cle || !String(cle).startsWith("ia-")) return;
    const P = this.poidsIA();
    P[cle] = +clamp(this.poidsDe(cle) + delta, 0.05, 5).toFixed(2);
    clearTimeout(this._sauvePoids);
    this._sauvePoids = setTimeout(() => {
      try { localStorage.setItem(this.CLE_POIDS_IA, JSON.stringify(P)); } catch (e) { /* tant pis */ }
      // pour le script de l'atelier : le serveur les recopie dans ecran\banque-ia-poids.json (route a ajouter)
      try { fetch("/hors-ligne/banque-ia-poids", { method: "POST", headers: { "X-Poiasie": "1", "Content-Type": "application/json" }, body: JSON.stringify({ poids: P }) }).catch(() => {}); } catch (e) { /* pas de serveur */ }
    }, 2000);
  },
  // un preset garde qui contient une cle de l'IA (pour l'agent des presets) : elle gagne du poids
  iaGarder(cle) { this.ajusterPoids(cle, 0.5, "garde"); },
  // un tirage pondere par les poids d'usage
  tirerIA(liste) {
    let total = 0;
    const w = liste.map(x => { const p = this.poidsDe(x.cle); total += p; return p; });
    let r = Math.random() * total;
    for (let i = 0; i < liste.length; i++) { r -= w[i]; if (r <= 0) return liste[i]; }
    return liste[liste.length - 1];
  },
  // ce que Jiiji garde et ce qu'il zappe : un choix a la main (pattern ou timbre de l'IA) +0,5 ; change en
  // moins de 20 s -0,4 ; un pattern de l'IA qui tient sa section au moins 30 s +0,1 ; un timbre de l'IA
  // garde deux minutes +0,2
  suivreUsageIA() {
    const now = performance.now() / 1000, U = this.usage = this.usage || {};
    for (const k of ["sonBanque", "sonTimbre"]) {
      const v = S[k], a = U[k];
      if (!a) { U[k] = { v, depuis: now, compte: false }; continue; }
      if (v === a.v) {
        if (k === "sonTimbre" && String(v).startsWith("ia-") && !a.compte && now - a.depuis > 120) { a.compte = true; this.ajusterPoids(v, 0.2); }
        continue;
      }
      if (String(a.v).startsWith("ia-") && now - a.depuis < 20) this.ajusterPoids(a.v, -0.4, "zappe");
      if (String(v).startsWith("ia-")) this.ajusterPoids(v, 0.5, "choisi");
      U[k] = { v, depuis: now, compte: false };
    }
    const m = this.motif && this.motif.cle;
    if (m !== U.motif) {
      if (U.motif && String(U.motif).startsWith("ia-") && now - U.motifDepuis >= 30) this.ajusterPoids(U.motif, 0.1, "garde");
      U.motif = m; U.motifDepuis = now;
    }
  },
  // la lecture du fichier : une premiere fois tout de suite (pour que ses synthes et ses patterns entrent
  // dans les menus avant que le panneau ne se construise), puis toutes les deux minutes s'il a change
  lireBanqueIA(synchrone) {
    const url = "ecran/banque-ia.json";
    const prendre = (texte) => {
      if (!texte || texte === this.iaCharge) return;
      let j = null;
      try { j = JSON.parse(texte); } catch (e) { return; }
      this.iaCharge = texte;
      this.dernierBilanIA = this.recevoirBanqueIA(j);
      // ce que l'atelier ajoute pendant que l'ecran tourne entre aussi dans les menus
      if (typeof menusIA === "function") menusIA();
    };
    try {
      if (synchrone) {
        const x = new XMLHttpRequest();
        x.open("GET", url + "?t=" + Date.now(), false);
        x.send();
        if (x.status === 200) prendre(x.responseText);
      } else fetch(url + "?t=" + Date.now(), { cache: "no-store" }).then(r => (r.ok ? r.text() : "")).then(prendre).catch(() => {});
    } catch (e) { /* pas de fichier : rien ne change */ }
  },
});

// le tirage des timbres et des patterns fait une place a l'IA, selon la dose et les poids d'usage
(function brancherIA() {
  const tirerTimbre0 = son.tirerTimbre, choisir0 = son.choisirPattern, tic0 = son.tic;
  son.tirerTimbre = function(liste) {
    const R = Object.values(this.recettes);
    if (R.length && Math.random() < this.doseIA() * 0.4) return this.tirerIA(R).cle;
    return tirerTimbre0.call(this, liste);
  };
  son.choisirPattern = function() {
    const c = S.sonBanque || "auto", fixe = this.patternsIA.find(x => x.cle === c);
    if (fixe) return fixe;
    if ((c === "auto" || c === "hasard") && this.patternsIA.length && Math.random() < this.doseIA() * 0.4) {
      const avant = this.motif && this.motif.cle, l = this.patternsIA.filter(x => x.cle !== avant);
      if (l.length) return this.tirerIA(l);
    }
    return choisir0.call(this);
  };
  son.tic = function() { tic0.call(this); try { this.suivreUsageIA(); } catch (e) { /* jamais bloquant */ } };
})();
ajouterReglages("Son", "Sons inventés par l'IA", [
  { cle: "sonIA", nom: "Sons inventés par l'IA (0 : jamais ; ils viennent de ecran\\banque-ia.json)", type: "curseur", min: 0, max: 1, pas: 0.05 },
], { sonIA: 0.35 });
// la premiere lecture, avant le panneau : ses synthes et ses patterns entrent dans les menus du son
son.lireBanqueIA(true);
function menusIA() {
  const onglet = SCHEMA.find(o => o.onglet === "Son");
  for (const g of (onglet && onglet.groupes) || []) for (const it of g.items || []) {
    if (it.cle === "sonTimbre") for (const R of Object.values(son.recettes)) if (!it.options.some(x => x[0] === R.cle)) it.options.push([R.cle, "IA : " + R.nom]);
    if (it.cle === "sonBanque") for (const P of son.patternsIA) if (!it.options.some(x => x[0] === P.cle)) it.options.push([P.cle, "IA : " + P.nom]);
  }
}
menusIA();
setInterval(() => { if (son.doseIA() > 0) son.lireBanqueIA(false); }, 120000);

function majSonUI() {
  const el = document.getElementById("s-etat");
  if (!el) return;
  const pas = son.dureeTemps(), e = son.etat();
  el.textContent = !S.son ? "Son coupé (touche S, ou la case ci-dessous)."
    : !son.ctx ? "En attente d'un clic sur l'écran (le navigateur l'exige)."
    : "Ce poème se joue en " + son.nomGamme() + ", une note toutes les " + pas.toFixed(1).replace(".", ",") + " s environ."
      + (son.mouvement() ? " Mouvement : " + son.mouvement() + "." : "")
      + (son.motif && son.motif.nom ? " Pattern : " + son.motif.nom + "." : "")
      + (S.sonModRythme === "toujours" ? "" : son.modG > 0.95 ? " La modulation est là." : son.modG > 0.05 ? " La modulation va et vient." : " Notes nettes.")
      + " Voix : " + e.voix + " sur " + son.voixMax() + (e.texture > 0.05 ? ", texture " + Math.round(e.texture * 100) + " %" : "") + "."
      + (S.sonVoix ? " " + etatVoix() : "");
}
// l'etat de la voix dans le son, et la latence que le navigateur annonce
function etatVoix() {
  if (!son.ctx) return "";
  const lat = Math.round(((son.ctx.baseLatency || 0) + (son.ctx.outputLatency || 0)) * 1000);
  if (son.vx && son.vx.larsen) return "La voix : LARSEN, elle est baissée (casque, ou éloigne le micro des enceintes).";
  if (!son.voixActive()) return "La voix : en attente du micro (onglet Musique, « Le micro ou une entrée son », Écouter).";
  return "La voix passe dans les effets" + (lat ? ", latence annoncée " + lat + " ms" : "") + (son.vx && son.vx.larsens ? ", " + son.vx.larsens + " larsen(s) attrapé(s)" : "") + ".";
}
function construireSon(page) {
  const fs = document.createElement("fieldset");
  fs.innerHTML = `<legend>Ce qui sonne</legend>
    <div class="etat-gen" id="s-etat">…</div>
    <div class="rangee"><button type="button" class="bouton" id="s-autre">Une autre gamme</button>
    <button type="button" class="bouton" id="s-ecouter">Écouter la gamme</button>
    <button type="button" class="bouton" id="s-hasard">Un son au hasard</button></div>
    <p style="margin:7px 0 0;color:#404040">Le son lit le poème à son propre pas : il ne suit pas la vitesse des images. Pour que chaque note fasse bouger l'image, choisis dans l'onglet Musique « L'écran s'écoute lui-même » (sans câble ni partage d'écran).</p>
    <p style="margin:7px 0 0;color:#404040">La voix dans les effets : mets un casque, ou envoie la sortie de l'écran sur une voie de la table, jamais droit dans les enceintes de la salle où est le micro (larsen). Si l'écran entend un larsen, il baisse la voix tout seul.</p>`;
  page.appendChild(fs);
  fs.querySelector("#s-autre").addEventListener("click", () => { son.demarrer(); son.nouvelleGamme(); });
  fs.querySelector("#s-ecouter").addEventListener("click", () => { son.demarrer(); son.jouerGamme(); });
  fs.querySelector("#s-hasard").addEventListener("click", () => { son.demarrer(); sonAuHasard(); });
  setTimeout(majSonUI, 0);
}
// un son au hasard (Maj + S, bouton de l'onglet Son) : tous les reglages du son sauf le volume (et
// l'interrupteur). « Il joue » ne tire que ce qui sonne a coup sur : son pas, ou la musique si elle
// joue ; les mots qui paraissent seulement s'ils etaient deja choisis (toutes les scenes ne les donnent pas)
function sonAuHasard() {
  const p = (x) => Math.random() < x, h = (a, b, d) => +hasard(a, b).toFixed(d === undefined ? 2 : d);
  const musiqueLa = S.musique && musique.actif;
  const valeurs = {
    sonSuit: musiqueLa && p(0.4) ? "musique" : S.sonSuit === "mots" && p(0.6) ? "mots" : "lui",
    sonGamme: p(0.5) ? "hasard" : p(0.4) ? "parente" : tirer(GAMMES)[0],
    sonTonique: p(0.6) ? "hasard" : p(0.4) ? "quintes" : String(Math.floor(Math.random() * 12)),
    sonChange: tirer(["1", "1", "2", "4"]), sonDivision: tirer(["1", "2", "2", "4"]), sonRimes: p(0.75), sonArc: p(0.7),
    sonTimbre: p(0.4) ? "derive" : p(0.3) ? tirer(["poetes", "hasard"]) : son.tirerTimbre(),
    sonSalle: h(0.8, 3, 1), sonTics: h(0, 0.5), sonSyllabes: true,
    sonBanque: p(0.6) ? "auto" : p(0.5) ? "hasard" : tirer(SON_PATTERNS).cle, sonContinu: p(0.85),
    sonModPart: tirer([0.2, 0.33, 0.33, 0.5]), sonModRythme: tirer(["temps", "temps", "poemes", "vers"]), sonModCycle: tirer([2, 3, 5]), sonModEvenements: p(0.8),
    sonTempo: Math.round(hasard(12, 60)), sonRythme: tirer(["regulier", "syllabes", "flottant", "flottant"]), sonOctave: tirer([-1, 0, 0, 1]),
    sonDensite: h(0.3, 1), sonSouffle: Math.round(hasard(0, 4) * 2) / 2, sonTenue: h(0.5, 1.5, 1), sonAttaque: h(0, 0.3), sonAccords: h(0, 0.3),
    sonMetal: h(0, 0.6), sonBruit: p(0.3) ? h(0, 0.15) : 0, sonBourdon: p(0.15) ? h(0.05, 0.3) : 0, sonPoussiere: p(0.3) ? h(0, 0.15) : 0,
    sonReverb: h(0.2, 0.9), sonEcho: p(0.7) ? h(0.1, 0.6) : 0, sonEchoTemps: tirer(["0.33", "0.5", "0.75", "1", "1.5"]),
    sonFiltre: Math.round(800 * Math.pow(2, hasard(0, 3.5)) / 50) * 50, sonSature: p(0.35) ? h(0.1, 0.45) : 0, sonEcrase: p(0.2) ? h(0.2, 0.6) : 0,
    sonLargeur: h(0.3, 1), sonVibrato: h(0, 0.5), sonVibratoVitesse: h(1, 7, 1), sonTremolo: 0, sonTremoloVitesse: h(2, 12, 1),
    sonBalayage: h(-0.6, 1), sonResonance: h(0, 0.7), sonGlisse: h(0, 0.5), sonUsure: h(0, 0.5), sonHasard: p(0.15) ? h(0.2, 0.6) : 0,
    sonBegaiement: h(0, 0.3), sonMouvement: h(0, 0.7), sonEvolution: h(0.3, 0.9), sonCycle: tirer([2, 3, 5, 8]),
    // l'ordonnanceur, les motifs, les synthes : dans des bornes sures (jamais plus de 20 voix)
    sonVoixMax: Math.round(hasard(10, 20)), sonDebit: Math.round(hasard(3, 14)), sonGrille: tirer(["0", "2", "4", "4", "8", "16"]),
    sonPattern: tirer(["motif", "motif", "motif", "rythme", "aucun"]), sonBasse: h(0, 0.9),
    sonTexture: tirer(["grains", "grains", "nappe", "deux", "aucune"]), sonTextureSeuil: Math.round(hasard(4, 16)),
    sonChorus: h(0.1, 0.8), sonRespire: h(0, 0.8), sonBruits: h(0.05, 0.5),
  };
  for (const [k, v] of Object.entries(valeurs)) { changer(k, v); if (controles[k]) controles[k].maj(); }
}
