"use strict";
/* ================================================================ les presets par categorie (2026-10-19) */

// Jiiji, 2026-10-19 : « Pour les presets, ce que je voulais surtout, c'etait des presets pour toutes
// les categories. Je te raconte pas comment c'est chiant de regler chaque LFO. Des presets : je
// lance, comme ca, ca remet de nouveaux points de depart, avec des reglages frais qui marchent bien,
// pour relancer un cycle propre. »
//
// Une CATEGORIE, c'est un onglet du panneau (LFO, Cables, Son, Effets...) : ses cles sont celles de
// l'onglet, moins ce qui est a Jiiji (volume, source, son allume, tenue, taille...), ce qui
// reconstruit la scene (scene, police, entree, calligramme...) et ce qui clignote. En haut de chaque
// onglet, une rangee : un menu de presets de la categorie, « Un départ frais » (un tirage controle,
// dans des plages qui marchent), « Garder » (les reglages de l'onglet, dans le navigateur,
// cle CLE_PRESETS_CATEGORIES) et « Comme avant » (le dernier preset de la categorie est annule).
//
// Un preset de categorie ne touche QUE les cles de sa categorie. Les curseurs glissent comme les
// presets complets (modes.glisser : S.presetFondu secondes, pilote.prendre, bases des LFO et des
// cables) ; les choix changent sous un fondu de l'image. Les LFO et les cables changent proprement :
// un LFO (ou un cable) qui change de cible, de forme ou de duree redescend d'abord a zero (son
// ancienne cible retrouve sa base, lfo.maj et cv.maj s'en chargent), change, puis remonte. Faire
// glisser la duree d'un LFO qui tourne ferait defiler sa phase (t / duree) a toute allure.
//
// Les verrous du hasard (onglet Modes) : un depart frais n'y touche jamais. Un preset choisi a la
// main, lui, est un geste comme un curseur : il passe (PC_VERROUS_SUR_PRESETS pour changer cela).
//
// « Un départ frais » partout (touche *, bouton du pied du panneau, Share de la page Presets de la
// manette) : toutes les categories a la fois, sauf la scene, le mode et le son allume ou eteint.
// Maj + * (µ) : tout comme avant.
//
// Pour les autres fichiers : departFraisPartout(), remettrePartout(), PC_CATEGORIES, pc.poserNom(id, nom).

const CLE_PRESETS_CATEGORIES = "poiasie-presets-categories-v1";
const PC_VERROUS_SUR_PRESETS = false;

// ce qu'aucun preset de categorie ne touche : les reglages de Jiiji (lisibilite, son, source,
// manette), ceux qui reglent l'ecran plutot que l'image, et ce qui recharge tout
const PC_JAMAIS = new Set(["volume", "qualite", "source", "ordre", "nouveauxDabord", "musique", "musiqueSource", "musiqueEntree", "musiqueSensibilite",
  "musiqueDrop", "mode", "manetteMode", "annoncesEcran", "vibration", "son", "votes", "cartel", "direct", "bourse", "annotations",
  "filsRimes", "chutes", "annoncerForme", "pilote", "poemeMax", "tenue", "taille", "espacement", "ecriture", "voies", "maelstrom", "billets", "rouleaux",
  "mainSensibilite", "mainCurseur", "mainNotes", "strobeFreq", "vieilleTele", "crt", "lettresGl", "presetFondu", "presetScene", "presetVitesse",
  "hasardDose", "hasardVerrous", "presetCourant", "voixSeuil", "cvActif", "cvPartout", "sonDebit", "t3Bras"]);
// ce qui ne s'allume jamais : un preset ou un depart frais peut seulement les eteindre
const PC_ETEINTS = new Set(["strobe", "negatif", "modVhs", "modCourbure", "modGrain", "modVignette"].concat([...VIEILLE_TELE]));
// les cibles de LFO (et destinations de cables) qui n'ont pas de sens pour une onde lente : ce qui
// clignote, ce qui se compte (des etoiles, des lignes, des polygones : la scene se refait), la musique
const PC_LFO_INTERDITS = new Set(["strobe", "strobeFreq", "negatif", "posterisation", "kaleido", "mosaique", "blocs", "vitesse_"]
  .concat([...VIEILLE_TELE]));
function lfoCiblePermise(c) {
  const x = LFO_CIBLES[c];
  if (!x || PC_LFO_INTERDITS.has(c) || RECONSTRUIRE_LFO.has(c)) return false;
  if (x.pas >= 1 && c !== "decalage" && c !== "teinteMots") return false;
  return !/^(mod|kick|caisse|charley|musique|calqueMasque)/.test(c);
}

/* ---------------------------------------------------- petits outils */

const pcH = (a, b) => +hasard(a, b).toFixed(3);
const pcP = p => Math.random() < p;
// une scene qui existe parmi une liste (pour le calque : jamais la scene du moment)
function pcCalqueParmi(liste) {
  const dispo = new Set(SCENES_CALQUE.map(x => x[0]));
  const l = liste.filter(k => dispo.has(k) && k !== S.scene && k !== sceneCle);
  return l.length ? l : null;
}
// le temps d'un battement : celui de la musique, sinon celui que suit le pilote (120 par minute)
function pcBattement() {
  let b = 0.5;
  try { b = musique.actif && musique.bpm > 40 ? 60 / musique.bpm : typeof pilote.beat === "function" ? pilote.beat() : 0.5; } catch (e) { b = 0.5; }
  return clamp(Number(b) || 0.5, 0.25, 2);
}
// les cables, en reglages : liste de [source, destination, quantite, lissage]
function pcCables(liste) {
  const r = {};
  for (let i = 1; i <= CV_NB; i++) {
    const c = liste[i - 1], k = "cv" + i;
    r[k + "Src"] = c ? c[0] : "aucune"; r[k + "Dst"] = c ? c[1] : "aucune";
    r[k + "Quantite"] = c ? c[2] : 0.5; r[k + "Lissage"] = c ? c[3] : 0.2;
  }
  return r;
}
function pcPatch(nom) { const p = typeof CV_PATCHS !== "undefined" ? CV_PATCHS.find(x => x.nom === nom) : null; return p ? p.cables.map(c => c.slice()) : []; }
// le socle des LFO : les six debranches (amplitude et duree par defaut, forme sinus)
function pcSocleLfo() {
  const r = {};
  for (let i = 1; i <= LFO_NB; i++) Object.assign(r, { ["lfo" + i + "Cible"]: "aucune", ["lfo" + i + "Forme"]: "sinus", ["lfo" + i + "Duree"]: 30, ["lfo" + i + "Amplitude"]: 0.3 });
  return r;
}
function pcSocleMods() {
  const r = {};
  for (const [c, , , , src] of MODS) { r["mod" + c] = 0; r["mod" + c + "Src"] = src; }
  return r;
}
function pcDefauts(cles) { const r = {}; for (const c of cles) if (c in DEFAUTS) r[c] = DEFAUTS[c]; return r; }

/* ---------------------------------------------------- les categories et leurs presets */

// une categorie : { id, onglet, nom, cles (calculees au depart, sauf voix), socle(), frais(), presets }
// un preset : { nom, desc, groupe (une rubrique du menu), seul (sans le socle), r: {} ou () => ({}),
//   si: () => vrai (sinon le preset ne se montre pas) }
const PC_EFFETS_SOCLE = () => Object.assign({}, AMBIANCES["Sobre (sans effet)"], {
  seuilHalo: 0.45, kaleidoStable: false, kaleidoTourne: 0.15, degradeForce: 0.85, larsenZoom: 1.015, larsenRotation: 0, strobe: 0, negatif: 0 });
const PC_SON_SOCLE = () => Object.assign(pcDefauts(["sonEvolution", "sonCycle", "sonArc", "sonOctave", "sonTempo", "sonDivision", "sonRythme", "sonDensite",
  "sonSouffle", "sonTenue", "sonAttaque", "sonAccords", "sonBourdon", "sonVibrato", "sonVibratoVitesse", "sonTremolo", "sonTremoloVitesse", "sonBalayage",
  "sonResonance", "sonGlisse", "sonMouvement", "sonReverb", "sonEcho", "sonEchoTemps", "sonFiltre", "sonLargeur", "sonGrille", "sonTexture",
  "sonPattern", "sonBasse", "sonChorus", "sonRespire", "sonBruits", "sonSalle", "sonTics", "sonSyllabes", "sonModRythme", "sonModCycle", "sonModEvenements"]),
  // des notes percussives, les bruits au fond, jamais de drone (Jiiji, 2026-10-19, par l'agent du son :
  // « plus de drone ni de bruit experimental », des notes percussives)
  { sonMetal: 0.15, sonBruit: 0.1, sonSature: 0.05, sonEcrase: 0, sonHasard: 0, sonBegaiement: 0.05, sonUsure: 0.1 }, PC_SON_TOUJOURS);
// ajoute a chaque preset du son et a chaque depart frais
// (la liste corrigee de l'agent du son, 2026-10-19 : la modulation du son n'est la qu'une partie du temps)
const PC_SON_TOUJOURS = { sonBourdon: 0, sonTremolo: 0, sonBruit: 0.03, sonPoussiere: 0.03, sonModPart: 0.33 };
const PC_MOTS_SOCLE = () => ({ tremblement: 0.3, tremblementValeur: true, frequence: 1, ondulation: 0, respiration: 0.3, rotationMots: 0, glitch: 0,
  aberration: 0, lueur: 0.15, contour: false, graisse: 0, ombre: 0 });
// des timbres percussifs (le depart frais du son)
const PC_TIMBRES_PERCUSSIFS = ["boite", "kalimba", "marimba", "pluck", "fmdoux", "clochette", "peau", "corde", "goutte"];
const PC_GAMMES_DOUCES = ["pentaMaj", "pentaMin", "dorien", "lydien", "majeur", "mixolydien", "mineur", "hirajoshi", "kumoi", "pelog"];
// un preset du son (ecrits par l'agent du son le 2026-10-19), avec ce qui vaut pour tous
const PS = (nom, desc, r) => ({ nom, desc, r: Object.assign({}, r, PC_SON_TOUJOURS) });
// les cibles d'un LFO tire au sort : [cle, amplitude, duree (secondes), condition]
const PC_LFO_FRAIS = [
  ["respiration", [0.06, 0.15], [20, 90]], ["ondulation", [0.04, 0.12], [30, 120]], ["rotationMots", [0.03, 0.08], [40, 150]],
  ["trainees", [0.06, 0.15], [40, 180]], ["halo", [0.05, 0.12], [30, 120]], ["exposition", [0.02, 0.05], [60, 240]],
  ["saturation", [0.04, 0.1], [60, 200]], ["decalage", [0.03, 0.07], [90, 300]], ["teinteMots", [0.05, 0.15], [90, 300]],
  ["derive", [0.05, 0.15], [60, 200]], ["vivacite", [0.04, 0.1], [60, 200]], ["lueur", [0.05, 0.15], [40, 120]],
  ["tremblement", [0.02, 0.05], [30, 90]], ["vitesse", [0.008, 0.015], [150, 300]],
  ["calqueOpacite", [0.08, 0.2], [40, 160], () => S.calque !== "aucun"], ["puitsTorsion", [0.05, 0.15], [60, 200], () => sceneCle === "puits"],
  ["rosaceTourne", [0.03, 0.08], [60, 200], () => sceneCle === "rosace"], ["t3Rotation", [0.05, 0.15], [60, 200]],
  ["kaleidoSpirale", [0.06, 0.15], [90, 240], () => S.kaleido > 1],
];
// les cables d'un depart frais : des patchs qui vont bien, a la quantite un peu tiree
const PC_CABLES_FRAIS = ["La note gonfle le mot", "La rareté ouvre le filtre", "La houle", "Nuit lente", "Les mots font l'écho", "Le vers respire",
  "Les poètes changent la lumière", "Échantillons", "La musique tient les mots", "La voix mène", "Quand ils se rencontrent"];

const PC_CATEGORIES = [
  { id: "rythme", onglet: "Écran de veille", nom: "Rythme et pilote",
    frais: () => ({ vitesse: pcH(0.1, 0.19), fonduDuree: pcH(3, 6) }),
    presets: [
      { nom: "Lent (0,1)", desc: "La vitesse générale à 0,1, des fondus de 4 secondes.", seul: true, r: { vitesse: 0.1, fonduDuree: 4 } },
      { nom: "Un peu moins lent (0,19)", desc: "La vitesse générale à 0,19, des fondus de 3 secondes.", seul: true, r: { vitesse: 0.19, fonduDuree: 3 } },
      { nom: "Très lent, longs fondus", desc: "0,06 et des fondus de 7 secondes : pour une salle qui regarde.", seul: true, r: { vitesse: 0.06, fonduDuree: 7 } },
      { nom: "Pilote contemplatif", desc: "Il change peu, lentement, tous les 128 temps.", seul: true,
        r: { piloteTemperament: "contemplatif", piloteAudace: 0.3, piloteRythme: "128", piloteMemoire: 10 } },
      { nom: "Pilote qui raconte", desc: "Sections, refrains, actes ; il glisse tous les 64 temps.", seul: true,
        r: { piloteTemperament: "narratif", piloteAudace: 0.5, piloteRythme: "64", piloteMemoire: 6 } },
      { nom: "Pilote nerveux", desc: "Plus de changements, toujours à la fin du poème.", seul: true,
        r: { piloteTemperament: "nerveux", piloteAudace: 0.7, piloteRythme: "64", piloteMemoire: 4 } },
      { nom: "Pilote discret", desc: "Il change les couleurs, pas les combos ni les LFO, et laisse longtemps ce qu'on touche.", seul: true,
        r: { piloteAudace: 0.25, piloteCombos: false, piloteLfo: false, piloteMain: 90 } },
    ] },
  { id: "voix", onglet: "Modes", nom: "La voix (mode poésie)",
    cles: ["voixEcrit", "voixAvance", "voixSilence", "voixGonfle", "voixTeinte", "voixLumiere"],
    socle: () => pcDefauts(["voixEcrit", "voixAvance", "voixSilence", "voixGonfle", "voixTeinte", "voixLumiere"]),
    frais: () => ({ voixEcrit: pcP(0.7), voixAvance: pcH(0.6, 1.2), voixSilence: pcH(0.25, 0.5), voixGonfle: pcH(0.4, 1.1), voixTeinte: pcH(0.2, 0.8), voixLumiere: pcH(0.2, 0.8) }),
    presets: [
      { nom: "Voix discrète", desc: "Elle écrit, à peine : l'image reste à elle.", r: { voixAvance: 0.6, voixSilence: 0.6, voixGonfle: 0.4, voixTeinte: 0.2, voixLumiere: 0.2 } },
      { nom: "La voix écrit", desc: "Un mot par syllabe, en couleur selon la hauteur.", r: { voixEcrit: true, voixAvance: 1, voixGonfle: 0.8, voixTeinte: 0.7, voixLumiere: 0.4 } },
      { nom: "La voix éclaire", desc: "Elle n'écrit pas : elle allume l'image.", r: { voixEcrit: false, voixLumiere: 1.2, voixGonfle: 0.6, voixTeinte: 0.4 } },
      { nom: "La voix mène tout", desc: "Le poème avance quand on parle, s'arrête presque dans le silence.", r: { voixAvance: 1.6, voixSilence: 0.2, voixGonfle: 1.4, voixTeinte: 1, voixLumiere: 1 } },
      { nom: "Le silence suspend", desc: "Chaque silence fige l'image ; la voix la relance.", r: { voixSilence: 0.15, voixAvance: 1.2, voixGonfle: 0.6 } },
      { nom: "Seulement le temps", desc: "La voix ne touche que le temps de l'image.", r: { voixEcrit: false, voixGonfle: 0, voixTeinte: 0, voixLumiere: 0, voixAvance: 1.2, voixSilence: 0.3 } },
    ] },
  { id: "combo", onglet: "Combo", nom: "Combo",
    frais: () => {
      const l = pcCalqueParmi(["constellation", "nuee", "averse", "onde", "cretes", "rosace", "puits", "battement", "ruban"]);
      if (!l || pcP(0.5)) return { calque: "aucun" };
      return { calque: tirer(l), calquePlace: tirer(["derriere", "derriere", "devant"]), calqueMelange: tirer(["lumiere", "ecran", "ecran"]),
        calqueOpacite: pcH(0.4, 0.75), calqueMouvement: tirer(["aucun", "derive", "respire", "tourne", "aucun"]), calquePoeme: tirer(["autre", "autre", "meme"]),
        calqueMusique: pcH(0, 0.4), calqueEntree: tirer(["fondu", "rideau", "iris", "hasard"]) };
    },
    presets: [
      { nom: "Une seule scène", desc: "La seconde scène s'en va en fondu.", r: { calque: "aucun" } },
      { nom: "Nuée devant, en lumière", desc: "La murmuration de lettres par-dessus, son propre poème.",
        r: { calque: ["nuee", "constellation"], calquePlace: "devant", calqueMelange: "lumiere", calqueOpacite: 0.6, calqueMouvement: "aucun", calquePoeme: "autre", calqueMusique: 0.2, calqueEntree: "fondu" } },
      { nom: "Constellation qui dérive", desc: "Une constellation devant, qui dérive lentement.",
        r: { calque: ["constellation", "nuee"], calquePlace: "devant", calqueMelange: "lumiere", calqueOpacite: 0.7, calqueMouvement: "derive", calquePoeme: "autre", calqueMusique: 0, calqueEntree: "fondu" } },
      { nom: "Le puits derrière", desc: "On tombe dans les vers, derrière, en écran doux.",
        r: { calque: ["puits", "cretes"], calquePlace: "derriere", calqueMelange: "ecran", calqueOpacite: 0.5, calqueMouvement: "respire", calquePoeme: "autre", calqueMusique: 0.2, calqueEntree: "fondu" } },
      { nom: "Pluie derrière", desc: "Il pleut des lettres derrière la scène.",
        r: { calque: ["averse", "nuee"], calquePlace: "derriere", calqueMelange: "ecran", calqueOpacite: 0.45, calqueMouvement: "aucun", calquePoeme: "autre", calqueMusique: 0, calqueEntree: "rideau" } },
      { nom: "Oscilloscope en miroir", desc: "Le même poème sur l'onde, devant, en miroir.",
        r: { calque: ["onde", "cretes"], calquePlace: "devant", calqueMelange: "lumiere", calqueOpacite: 0.6, calqueMouvement: "miroir", calquePoeme: "meme", calqueMusique: 0.3, calqueEntree: "fondu" } },
      { nom: "À travers les lettres", desc: "La scène n'apparaît que dans les grands mots qui battent.",
        r: { calque: ["battement", "rosace"], calqueMelange: "masque", calqueOpacite: 0.9, calqueMouvement: "aucun", calquePoeme: "autre", calqueMasqueOmbre: 0.15, calqueMasqueEpaisseur: 0.45, calqueMasqueVitre: 0.25, calqueEntree: "fondu" } },
      { nom: "Crêtes au loin", desc: "Le pouls du poème, petit, au milieu, derrière.",
        r: { calque: ["cretes", "onde"], calquePlace: "derriere", calqueMelange: "ecran", calqueOpacite: 0.5, calqueMouvement: "loin", calquePoeme: "autre", calqueMusique: 0.3, calqueEntree: "iris" } },
    ] },
  { id: "mots", onglet: "Mots", nom: "Mots", socle: PC_MOTS_SOCLE,
    frais: () => Object.assign(PC_MOTS_SOCLE(), { tremblement: pcH(0.1, 0.6), frequence: pcH(0.5, 1.2), ondulation: pcP(0.5) ? pcH(0.1, 0.6) : 0,
      respiration: pcH(0.1, 0.7), rotationMots: pcP(0.4) ? pcH(0.05, 0.3) : 0, glitch: pcP(0.2) ? pcH(0.01, 0.05) : 0, aberration: pcP(0.2) ? pcH(0.1, 0.4) : 0,
      lueur: pcH(0.05, 0.4), graisse: pcP(0.25) ? pcH(0.2, 0.8) : 0, ombre: pcP(0.25) ? pcH(0.15, 0.5) : 0, contour: pcP(0.08) }),
    presets: [
      { nom: "Immobile et net", desc: "Rien ne tremble, rien ne bouge : on lit.", r: { tremblement: 0, tremblementValeur: false, respiration: 0, lueur: 0 } },
      { nom: "Respiration lente", desc: "Les mots gonflent et se dégonflent, très lentement.", r: { respiration: 0.6, frequence: 0.5, tremblement: 0.15 } },
      { nom: "Houle des mots", desc: "Une vague passe dans les vers.", r: { ondulation: 0.8, frequence: 0.4, respiration: 0.3 } },
      { nom: "Les mots usés tremblent", desc: "Le cours de la Bourse fait trembler les mots usés.", r: { tremblement: 1.2, tremblementValeur: true, frequence: 0.7 } },
      { nom: "Lueur douce", desc: "Les lettres brillent un peu.", r: { lueur: 0.45, respiration: 0.3 } },
      { nom: "Encre épaisse", desc: "Des lettres grasses, une ombre portée.", r: { graisse: 0.8, ombre: 0.35, tremblement: 0.2 } },
      { nom: "Roulis", desc: "Les mots tanguent comme sur un bateau.", r: { rotationMots: 0.35, ondulation: 0.4, frequence: 0.5 } },
      { nom: "Néon", desc: "Une forte lueur et les couleurs un peu décollées.", r: { lueur: 0.8, aberration: 0.3 } },
      { nom: "Relief", desc: "Une ombre décalée, des lettres pleines.", r: { ombre: 0.6, graisse: 0.4, tremblement: 0.1 } },
      { nom: "Un peu cassé", desc: "Un glitch léger, les couleurs qui bavent.", r: { glitch: 0.12, aberration: 0.4, tremblement: 0.5 } },
    ] },
  { id: "mouvements", onglet: "Mouvements", nom: "Mouvements des scènes",
    frais: () => ({ spin: pcH(0.3, 1.2), aspiration: pcH(0.6, 1.4), inclinaison: pcH(0.4, 1), vitesseEtoiles: pcH(0.2, 0.8), puitsVitesse: pcH(0.15, 0.5),
      puitsTorsion: pcH(0.2, 1.2), puitsParois: pcH(0.4, 1.2), cretesHauteur: pcH(0.7, 1.6), averseDensite: pcH(0.6, 1.4), averseVitesse: pcH(0.15, 0.5),
      rosaceTourne: pcH(0.15, 0.8), ondeHauteur: pcH(0.7, 1.5), vague: pcH(0.4, 1.2), calliRotation: pcH(0.4, 1.4), calliProfondeur: pcH(0.5, 1.4),
      calliDerive: pcH(0.3, 1.2), calliEpaisseur: pcP(0.5) ? pcH(0.05, 0.4) : 0, calliPlat: tirer(["bascule", "bascule", "tourne"]),
      battementStyle: tirer(["hasard", "bloc", "echo"]), battementTemps: tirer(["2", "4"]), mode3d: tirer(["rotation", "bascule", "vague"]) }),
    presets: [
      { nom: "Tout au ralenti", desc: "Chaque scène à sa vitesse la plus douce.", r: { spin: 0.4, aspiration: 0.7, vitesseEtoiles: 0.25, puitsVitesse: 0.15,
        averseVitesse: 0.15, rosaceTourne: 0.2, calliRotation: 0.4, calliDerive: 0.4, vague: 0.5 } },
      { nom: "Lent et ample", desc: "Lent, mais tout s'ouvre : crêtes hautes, onde large.", r: { spin: 0.8, inclinaison: 0.6, puitsTorsion: 1, cretesHauteur: 1.5,
        ondeHauteur: 1.4, vague: 1.2, calliProfondeur: 1.4 } },
      { nom: "Calligrammes qui flottent", desc: "Les formes basculent doucement, en relief, et dérivent.", r: { calliRotation: 0.6, calliProfondeur: 1.2,
        calliPlat: "bascule", calliDerive: 0.6, calliEpaisseur: 0.2 } },
      { nom: "Le monde se tord", desc: "Le puits se tord, le tourbillon penche, la rosace tourne.", r: { puitsTorsion: 1.8, spin: 1.2, inclinaison: 0.45, rosaceTourne: 0.8 } },
      { nom: "Pluie fine", desc: "Beaucoup de gouttes, qui tombent lentement.", r: { averseDensite: 1.4, averseVitesse: 0.25 } },
      { nom: "Calme plat", desc: "Crêtes basses, onde plate, puits droit.", r: { cretesHauteur: 0.7, ondeHauteur: 0.8, puitsTorsion: 0.3, rosaceTourne: 0.3, vague: 0.4 } },
      { nom: "Ciel profond", desc: "Le vol des étoiles ralenti, les calligrammes en perspective.", r: { vitesseEtoiles: 0.35, calliProfondeur: 1.6, calliRotation: 0.5 } },
    ] },
  { id: "couleurs", onglet: "Couleurs", nom: "Couleurs et fonds",
    frais: () => {
      const pal = tirer(["nuit", "crepuscule", "glace", "or", "neon", "klein", "braise", "foret", "billet", "vapeur", "papier", "encre", "sang", "ambre"]);
      const clair = PALETTES[pal] && PALETTES[pal].clair;
      return { palette: pal, modeCouleur: tirer(["poetes", "poetes", "palette", "palette", "alternance"]), vivacite: pcH(0.8, 1.2), clarte: pcH(-0.15, 0.15),
        derive: pcP(0.4) ? pcH(0.1, 0.6) : 0, fond: clair ? tirer(["degrade", "cahier", "uni", "filigrane", "tapisserie"]) : tirer(["degrade", "etoiles", "aurore", "horizon", "rayons", "filigrane", "uni", "aucun"]),
        fondPulse: pcP(0.3) ? pcH(0.1, 0.4) : 0, trainees: pcH(clair ? 0 : 0.1, clair ? 0.15 : 0.4) };
    },
    presets: [
      { groupe: "Couleurs", nom: "Nuit d'encre", desc: "Nuit, les poètes chacun leur couleur.", seul: true, r: { palette: "nuit", modeCouleur: "poetes", vivacite: 1, clarte: 0, derive: 0 } },
      { groupe: "Couleurs", nom: "Papier ancien", desc: "Papier, encre de la palette.", seul: true, r: { palette: "papier", modeCouleur: "palette", vivacite: 0.8, clarte: 0, derive: 0 } },
      { groupe: "Couleurs", nom: "Crépuscule", desc: "Le crépuscule, les couleurs qui dérivent un peu.", seul: true, r: { palette: "crepuscule", modeCouleur: "poetes", vivacite: 1.1, derive: 0.3 } },
      { groupe: "Couleurs", nom: "Glace", desc: "Les bleus de glace.", seul: true, r: { palette: "glace", modeCouleur: "palette", vivacite: 1, clarte: 0.05, derive: 0 } },
      { groupe: "Couleurs", nom: "Or noir", desc: "De l'or sur du noir.", seul: true, r: { palette: "or", modeCouleur: "palette", vivacite: 1, derive: 0 } },
      { groupe: "Couleurs", nom: "Néon doux", desc: "Le néon, moins vif.", seul: true, r: { palette: "neon", modeCouleur: "poetes", vivacite: 0.85, clarte: 0.1 } },
      { groupe: "Couleurs", nom: "Bleu Klein", desc: "Un seul bleu.", seul: true, r: { palette: "klein", modeCouleur: "palette", derive: 0 } },
      { groupe: "Couleurs", nom: "Braise", desc: "La braise, un vers sur deux en couleur vive.", seul: true, r: { palette: "braise", modeCouleur: "alternance", vivacite: 1 } },
      { groupe: "Couleurs", nom: "Arc-en-ciel lent", desc: "La nuit, les mots en arc-en-ciel qui défile lentement.", seul: true, r: { palette: "nuit", modeCouleur: "arc", derive: 0.2 } },
      { groupe: "Fonds", nom: "Ciel étoilé", desc: "Un ciel d'étoiles, des traînées légères.", seul: true, r: { fond: "etoiles", fondPulse: 0, trainees: 0.25 } },
      { groupe: "Fonds", nom: "Aurore", desc: "Des nuées de couleur.", seul: true, r: { fond: "aurore", fondPulse: 0, trainees: 0.2 } },
      { groupe: "Fonds", nom: "Horizon", desc: "Un coucher de soleil.", seul: true, r: { fond: "horizon", fondPulse: 0, trainees: 0.15 } },
      { groupe: "Fonds", nom: "Filigrane", desc: "Les grands mots rares en pâle.", seul: true, r: { fond: "filigrane", fondPulse: 0, trainees: 0.1 } },
      { groupe: "Fonds", nom: "Papier peint de mots", desc: "Les mots du recueil en papier peint.", seul: true, r: { fond: "tapisserie", fondPulse: 0, trainees: 0 } },
      { groupe: "Fonds", nom: "Noir profond", desc: "Rien derrière, de longues traînées.", seul: true, r: { fond: "aucun", fondPulse: 0, trainees: 0.35 } },
      { groupe: "Fonds", nom: "Dégradé qui bat", desc: "Le dégradé bat doucement avec les basses.", seul: true, r: { fond: "degrade", fondPulse: 0.4, trainees: 0.2 } },
      { groupe: "Fonds", nom: "Cahier", desc: "Une page de cahier.", seul: true, r: { fond: "cahier", fondPulse: 0, trainees: 0 } },
    ] },
  { id: "effets", onglet: "Effets", nom: "Effets (carte graphique)", socle: PC_EFFETS_SOCLE,
    frais: () => {
      const r = PC_EFFETS_SOCLE();
      const choix = [
        () => Object.assign(r, { halo: pcH(0.25, 0.6), seuilHalo: pcH(0.35, 0.5) }),
        () => { r.bichromie = pcH(0.4, 0.75); },
        () => { r.teinteGpu = pcH(0.05, 0.2); },
        () => { if (pcP(0.4)) Object.assign(r, { kaleido: tirer([4, 6, 8]), kaleidoStable: true, kaleidoTourne: pcH(-0.08, 0.08), kaleidoSpirale: pcP(0.5) ? pcH(0.1, 0.6) : 0 }); },
        () => { r.ondes = pcH(0.1, 0.35); },
        () => Object.assign(r, { larsen: pcH(0.4, 0.75), larsenZoom: pcH(1, 1.02), larsenRotation: pcH(-0.006, 0.006), larsenTeinte: pcH(0, 0.4) }),
        () => Object.assign(r, { degrade: tirer(["glace", "or", "aurore", "sepia", "encre", "palette"]), degradeForce: pcH(0.5, 0.85) }),
        () => { r.chroma = pcH(0.15, 0.35); },
        () => { if (pcP(0.5)) r.solarisation = pcH(0.4, 0.7); },
        () => { if (pcP(0.5)) r.fonte = pcH(0.05, 0.2); },
        () => { r.decalage = Math.round(hasard(0, 359)); },
        () => { if (pcP(0.4)) r.miroir = tirer(["gd", "hb"]); },
        () => { if (musique.actif) Object.assign(r, { pompe: pcH(0.1, 0.3), choc: pcH(0.2, 0.5) }); },
        () => { r.rvb = pcH(0.1, 0.4); },
      ];
      const n = 1 + (pcP(0.6) ? 1 : 0) + (pcP(0.15) ? 1 : 0);
      for (const f of choix.sort(() => Math.random() - 0.5).slice(0, n)) f();
      Object.assign(r, { saturation: pcH(0.9, 1.25), contraste: pcH(0.95, 1.15), exposition: pcH(0.95, 1.1) });
      return r;
    },
    presets: [
      { nom: "Sobre", desc: "Tous les effets de la carte éteints.", r: {} },
      { nom: "Halo doux", desc: "Ce qui brille diffuse un peu.", r: { halo: 0.4, seuilHalo: 0.45 } },
      { nom: "Halo et bichromie", desc: "Deux couleurs de la palette, un halo.", r: { halo: 0.35, seuilHalo: 0.4, bichromie: 0.6 } },
      { nom: "Kaléidoscope stable", desc: "Six miroirs qui tournent à peine, sans sauter sur les temps.", r: { kaleido: 6, kaleidoStable: true, kaleidoTourne: 0.05, halo: 0.3 } },
      { nom: "Larsen léger", desc: "L'image se filme elle-même, doucement.", r: { larsen: 0.6, larsenZoom: 1.01, larsenRotation: 0.003, larsenTeinte: 0.2 } },
      { nom: "Ondes lentes", desc: "L'image ondule, un halo.", r: { ondes: 0.25, halo: 0.25 } },
      { nom: "Glace", desc: "Le dégradé de glace, un halo.", r: { degrade: "glace", degradeForce: 0.7, halo: 0.3 } },
      { nom: "Or solarisé", desc: "Le dégradé d'or, solarisé.", r: { degrade: "or", degradeForce: 0.6, solarisation: 0.5 } },
      { nom: "Miroir et halo", desc: "Gauche et droite en miroir.", r: { miroir: "gd", halo: 0.35 } },
      { nom: "Teintes qui tournent", desc: "Les teintes de l'image tournent lentement.", r: { teinteGpu: 0.12, saturation: 1.15 } },
      { nom: "L'image fond", desc: "L'image coule un peu, un halo.", r: { fonte: 0.15, halo: 0.25 } },
      { nom: "Arc-en-ciel discret", desc: "Des cercles d'arc-en-ciel, à peine.", r: { chroma: 0.25, contraste: 1.1 } },
    ] },
  { id: "musique", onglet: "Musique", nom: "Ce que la musique fait aux mots",
    socle: () => pcDefauts(["musiqueReaction", "kickSens", "kickMots", "kickSeuil", "kickRelache", "caisseMots", "caisseSeuil", "caisseRelache",
      "charleyMots", "charleySeuil", "charleyRelache", "musiquePulse", "musiqueElan", "musiqueFlash", "musiqueEffets"]),
    frais: () => ({ musiqueReaction: pcH(0.7, 1.3), kickSens: tirer(["gonfle", "gonfle", "ecrase"]), kickMots: pcH(0.3, 1), kickSeuil: pcH(0.4, 0.6),
      kickRelache: pcH(0.15, 0.4), caisseMots: pcP(0.5) ? pcH(0.1, 0.5) : 0, caisseSeuil: pcH(0.4, 0.6), caisseRelache: pcH(0.1, 0.25),
      charleyMots: pcP(0.3) ? pcH(0.1, 0.3) : 0, charleySeuil: pcH(0.4, 0.6), charleyRelache: pcH(0.05, 0.15), musiquePulse: pcH(0.8, 1.6),
      musiqueElan: pcH(0, 0.25), musiqueFlash: pcH(0.1, 0.45), musiqueEffets: pcH(0.6, 1.3) }),
    presets: [
      { nom: "Le kick seul", desc: "Seul le kick fait gonfler les mots.", r: { kickMots: 0.8, kickSens: "gonfle", caisseMots: 0, charleyMots: 0, musiquePulse: 1, musiqueFlash: 0.3 } },
      { nom: "Side chain", desc: "Les mots s'écrasent sur le kick puis reviennent.", r: { kickSens: "ecrase", kickMots: 1, kickRelache: 0.35, caisseMots: 0, charleyMots: 0 } },
      { nom: "Coulé", desc: "Une réaction lente, des retours longs.", r: { musiqueReaction: 0.5, kickMots: 0.4, kickRelache: 0.6, musiqueFlash: 0.15, musiquePulse: 0.8, musiqueElan: 0 } },
      { nom: "Nerveux mais lisible", desc: "Les trois coups, vite, sans accélérer l'image.", r: { musiqueReaction: 1.6, kickMots: 0.9, caisseMots: 0.4, charleyMots: 0.2,
        kickRelache: 0.15, musiqueFlash: 0.4, musiqueElan: 0.1 } },
      { nom: "Les trois coups", desc: "Kick, caisse claire et charley sur les mots.", r: { kickMots: 0.7, caisseMots: 0.5, charleyMots: 0.3 } },
      { nom: "Presque sourd", desc: "La musique effleure à peine l'image.", r: { kickMots: 0.15, caisseMots: 0, charleyMots: 0, musiquePulse: 0.4, musiqueFlash: 0.05,
        musiqueEffets: 0.4, musiqueElan: 0 } },
      { nom: "La musique pousse les effets", desc: "Les effets de la carte suivent fort la musique.", r: { musiqueEffets: 1.6, musiqueFlash: 0.5, kickMots: 0.5 } },
    ] },
  { id: "sonMene", onglet: "Le son mène", nom: "Le son mène les effets", socle: pcSocleMods,
    frais: () => {
      const r = pcSocleMods();
      const choix = [
        () => Object.assign(r, M("Halo", pcH(0.3, 0.7), tirer(["kick", "basses"]))),
        () => Object.assign(r, pcP(0.5) ? M("Lumiere", pcH(0.2, 0.4), "kick") : M("Lumiere", pcH(-0.35, -0.2), "kick")),
        () => Object.assign(r, M("Teintes", pcH(0.2, 0.4), "mesure")),
        () => Object.assign(r, M("Ondes", pcH(0.2, 0.4), "mediums")),
        () => Object.assign(r, M("Saturation", pcH(0.2, 0.5), "basses")),
        () => Object.assign(r, M("Chroma", pcH(0.2, 0.4), tirer(["aigus", "charley"]))),
        () => Object.assign(r, M("Rvb", pcH(0.3, 0.6), "kick")),
        () => Object.assign(r, M("Contraste", pcH(0.15, 0.3), tirer(["kick", "caisse"]))),
        () => { if (S.kaleido > 1) Object.assign(r, M("KZoom", pcH(0.2, 0.4), "basses")); },
        () => { if (S.larsen > 0.1) Object.assign(r, M("LarsenZoom", pcH(0.2, 0.5), "basses")); },
      ];
      for (const f of choix.sort(() => Math.random() - 0.5).slice(0, pcP(0.5) ? 1 : 2)) f();
      return r;
    },
    presets: [
      { nom: "Rien n'écoute", desc: "Aucun effet ne suit la musique.", r: {} },
      { nom: "Le kick allume", desc: "Le halo s'allume sur le kick.", r: M("Halo", 0.6, "kick") },
      { nom: "Les basses respirent", desc: "Les basses font monter la saturation et le halo.", r: Object.assign(M("Saturation", 0.35, "basses"), M("Halo", 0.3, "basses")) },
      { nom: "Side chain de lumière", desc: "La lumière et la couleur plongent sur le kick.", r: Object.assign(M("Lumiere", -0.3, "kick"), M("Saturation", -0.2, "kick")) },
      { nom: "La mesure tourne les teintes", desc: "Les teintes font une vague sur chaque mesure.", r: M("Teintes", 0.3, "mesure") },
      { nom: "Médiums en ondes", desc: "Les médiums font onduler l'image.", r: M("Ondes", 0.35, "mediums") },
      { nom: "Charley arc-en-ciel", desc: "Le charley allume l'arc-en-ciel en cercles.", r: M("Chroma", 0.3, "charley") },
      { nom: "Le kaléidoscope respire", desc: "Avec un kaléidoscope : il respire sur les basses, tourne sur les médiums.", r: Object.assign(M("KZoom", 0.3, "basses"), M("KTourne", 0.2, "mediums")) },
      { nom: "Couleurs décollées", desc: "Le kick décolle les couleurs, la caisse durcit le contraste.", r: Object.assign(M("Rvb", 0.5, "kick"), M("Contraste", 0.2, "caisse")) },
      { nom: "Le larsen suit le volume", desc: "Avec un larsen : il monte avec le volume, son zoom avec les basses.", r: Object.assign(M("Larsen", 0.4, "volume"), M("LarsenZoom", 0.4, "basses")) },
    ] },
  // les mains du jeu (2026-10-19, une par manette) : ce qui vaut pour toutes ; chaque poete y ajoute sa
  // facon (sa taille, la vie de ses mots). Le poete de chaque manette et la vibration ne sont pas a un preset
  { id: "main", onglet: "Manette", nom: "Les mains (les mots écrits à la manette)", cles: ["mainVie", "mainTaille", "mainVent", "mainEnvol"],
    frais: () => ({ mainVie: Math.round(hasard(12, 30)), mainTaille: pcH(0.9, 1.4), mainVent: pcP(0.5) ? pcH(-0.15, 0.15) : 0, mainEnvol: pcP(0.5) ? pcH(-0.05, 0.2) : 0 }),
    presets: [
      { nom: "Craie qui reste", desc: "Les mots écrits restent longtemps, immobiles (chaque poète garde sa façon).", r: { mainVie: 40, mainTaille: 1.1, mainVent: 0, mainEnvol: 0 } },
      { nom: "Vent léger", desc: "Les mots de toutes les mains partent doucement vers la droite.", r: { mainVie: 18, mainVent: 0.2, mainEnvol: 0.05 } },
      { nom: "Les mots s'envolent", desc: "Ils montent lentement.", r: { mainVie: 20, mainEnvol: 0.3, mainVent: 0 } },
      { nom: "Les mots tombent", desc: "Ils retombent lentement.", r: { mainVie: 16, mainEnvol: -0.2, mainVent: 0 } },
      { nom: "Écriture brève", desc: "Gros, et ils s'effacent vite.", r: { mainVie: 6, mainTaille: 1.3, mainVent: 0, mainEnvol: 0 } },
      { nom: "Grand et lent", desc: "Très grands, ils restent et flottent.", r: { mainVie: 30, mainTaille: 1.7, mainVent: -0.05, mainEnvol: 0.08 } },
    ] },
  { id: "son", onglet: "Son", nom: "Son (timbres, matière, motifs)", socle: PC_SON_SOCLE,
    // dans l'esprit des presets de l'agent du son : des notes percussives, pas de bourdon, pas de tremolo,
    // des bruits bas, aucun drone, des salles courtes a moyennes
    frais: () => Object.assign(PC_SON_SOCLE(), {
      sonTimbre: pcP(0.15) ? "poetes" : tirer(PC_TIMBRES_PERCUSSIFS), sonGamme: pcP(0.25) ? tirer(["hasard", "parente"]) : tirer(PC_GAMMES_DOUCES),
      sonOctave: tirer([0, 0, 1]), sonTempo: Math.round(hasard(24, 50)), sonRythme: tirer(["regulier", "flottant", "syllabes"]), sonDensite: pcH(0.6, 0.9),
      sonSouffle: pcH(0.5, 2.5), sonTenue: pcH(0.6, 1.2), sonAttaque: pcH(0, 0.12), sonAccords: pcH(0.05, 0.25), sonBasse: pcH(0.3, 0.7),
      sonMetal: pcH(0.05, 0.35), sonBruit: pcH(0, 0.08), sonReverb: pcH(0.15, 0.45), sonSalle: pcH(0.9, 2.5), sonEcho: pcH(0.1, 0.3),
      sonEchoTemps: tirer(["0.5", "0.75", "1"]), sonFiltre: Math.round(hasard(3500, 7000) / 50) * 50, sonResonance: pcH(0.1, 0.35), sonChorus: pcH(0.2, 0.6),
      sonVibrato: pcH(0, 0.1), sonGlisse: pcH(0, 0.12), sonTics: pcH(0.15, 0.4), sonGrille: tirer(["4", "4", "8"]), sonSature: pcH(0, 0.08), sonEcrase: 0, sonPattern: "motif" },
      PC_SON_TOUJOURS),
    presets: [
      PS("Boîte à musique", "Une boîte à musique, une octave plus haut, en pentatonique, régulière.", { sonTimbre: "boite", sonOctave: 1, sonTempo: 40,
        sonRythme: "regulier", sonDensite: 0.8, sonTenue: 0.8, sonAccords: 0.1, sonReverb: 0.35, sonSalle: 1.6, sonEcho: 0.15, sonBasse: 0.3,
        sonGamme: "pentaMaj", sonTics: 0.25 }),
      PS("Kalimba", "Une kalimba flottante en pentatonique mineure.", { sonTimbre: "kalimba", sonTempo: 36, sonRythme: "flottant", sonDensite: 0.75,
        sonReverb: 0.3, sonSalle: 1.4, sonEcho: 0.25, sonEchoTemps: "0.75", sonBasse: 0.4, sonGamme: "pentaMin", sonTics: 0.3 }),
      PS("Piano électrique", "Une FM douce sur les syllabes, en dorien, des accords, du chorus.", { sonTimbre: "fmdoux", sonTempo: 30, sonRythme: "syllabes",
        sonAccords: 0.25, sonChorus: 0.5, sonReverb: 0.35, sonSalle: 2, sonEcho: 0.2, sonBasse: 0.55, sonGamme: "dorien", sonMetal: 0.15 }),
      PS("Pluck sec", "Un synthé pincé, régulier, en mineur, sur une grille d'un huitième.", { sonTimbre: "pluck", sonTempo: 48, sonRythme: "regulier",
        sonDensite: 0.85, sonReverb: 0.15, sonSalle: 0.9, sonEcho: 0.3, sonEchoTemps: "0.5", sonBasse: 0.6, sonGrille: "8", sonGamme: "mineur", sonFiltre: 4500 }),
      PS("Marimba et basse", "Un marimba régulier, une basse présente, en mixolydien.", { sonTimbre: "marimba", sonTempo: 40, sonRythme: "regulier",
        sonBasse: 0.8, sonAccords: 0.1, sonReverb: 0.25, sonSalle: 1.2, sonEcho: 0.1, sonGamme: "mixolydien", sonPattern: "motif" }),
      PS("Cloches de verre", "Des clochettes une octave plus haut, en lydien, une grande salle.", { sonTimbre: "clochette", sonOctave: 1, sonTempo: 24,
        sonRythme: "flottant", sonDensite: 0.6, sonReverb: 0.5, sonSalle: 2.8, sonEcho: 0.3, sonBasse: 0.2, sonGamme: "lydien", sonMetal: 0.25 }),
      PS("Gamelan", "Un marimba de métal en pelog, régulier.", { sonTimbre: "marimba", sonGamme: "pelog", sonTempo: 44, sonRythme: "regulier",
        sonBasse: 0.5, sonReverb: 0.3, sonSalle: 1.5, sonMetal: 0.4 }),
      PS("Harpe", "Une corde pincée, flottante, en mineur harmonique.", { sonTimbre: "corde", sonTempo: 34, sonRythme: "flottant", sonAccords: 0.2,
        sonReverb: 0.4, sonSalle: 2.2, sonEcho: 0.15, sonBasse: 0.35, sonGamme: "harmonique" }),
      PS("Poètes en dialogue", "Chaque poète garde son timbre : ils se répondent.", { sonTimbre: "poetes", sonPattern: "motif", sonTempo: 32, sonBasse: 0.5,
        sonReverb: 0.3, sonSalle: 1.8, sonTics: 0.35 }),
      PS("Pulsation (sur la musique)", "Une note par temps de la musique, pincée, une basse forte (sans musique : à son pas).", { sonSuit: "musique",
        sonDivision: "1", sonTimbre: "pluck", sonGrille: "16", sonBasse: 0.85, sonReverb: 0.15, sonSalle: 0.8, sonEcho: 0.25, sonEchoTemps: "0.75",
        sonTextureSeuil: 12 }),
    ] },
  { id: "lfo", onglet: "LFO", nom: "Les six LFO", socle: pcSocleLfo,
    frais: () => {
      const r = pcSocleLfo(), verrous = modes.verrous();
      const fermes = new Set([].concat(...modes.lesFamilles().filter(f => verrous.has(f.id)).map(f => f.cles)));
      const pool = PC_LFO_FRAIS.filter(([c, , , si]) => lfoCiblePermise(c) && !fermes.has(c) && (!si || si())).sort(() => Math.random() - 0.5);
      const n = Math.min(pool.length, 2 + Math.floor(Math.random() * 3));
      pool.slice(0, n).forEach(([c, a, d], k) => Object.assign(r, L(k + 1, c, Math.round(hasard(d[0], d[1]) * 2) / 2, +hasard(a[0], a[1]).toFixed(3),
        tirer(["sinus", "sinus", "triangle", "doux", "doux"]))));
      return r;
    },
    presets: [
      { nom: "Respiration lente", desc: "Les mots respirent, le halo et la lueur suivent, la lumière à peine.", r: Object.assign({}, L(1, "respiration", 24, 0.12),
        L(2, "halo", 40, 0.08), L(3, "lueur", 60, 0.1), L(4, "exposition", 90, 0.03)) },
      { nom: "Houle de quatre minutes", desc: "Ondulation, respiration et traînées sur des vagues de deux à quatre minutes.", r: Object.assign({},
        L(1, "ondulation", 240, 0.1), L(2, "respiration", 120, 0.1), L(3, "trainees", 240, 0.12, "triangle"), L(4, "rotationMots", 160, 0.05)) },
      { nom: "Marée", desc: "Très lent : la vitesse des mots, les traînées du fond, la dérive des couleurs.", r: Object.assign({}, L(1, "vitesse", 300, 0.01),
        L(2, "trainees", 180, 0.15), L(3, "derive", 200, 0.1), L(4, "exposition", 240, 0.04), L(5, "vitesseEtoiles", 180, 0.04)) },
      { nom: "Pulsation", desc: "Calée sur le tempo (sinon 120) : 16, 32, 64 et 128 temps.", r: () => {
        const b = pcBattement(), d = n => Math.max(0.5, Math.round(b * n * 2) / 2);
        return Object.assign({}, L(1, "halo", d(32), 0.08), L(2, "exposition", d(16), 0.025), L(3, "respiration", d(64), 0.1), L(4, "decalage", d(128), 0.04, "triangle"));
      } },
      { nom: "Dérive des couleurs", desc: "Les teintes de l'image et des mots, la vivacité, la saturation, sur plusieurs minutes.", r: Object.assign({},
        L(1, "decalage", 240, 0.06, "doux"), L(2, "teinteMots", 180, 0.12, "triangle"), L(3, "derive", 150, 0.1), L(4, "vivacite", 120, 0.06), L(5, "saturation", 200, 0.05)) },
      { nom: "Tout doux", desc: "Cinq ondes à peine visibles.", r: Object.assign({}, L(1, "respiration", 60, 0.04), L(2, "ondulation", 90, 0.03), L(3, "halo", 120, 0.03),
        L(4, "rotationMots", 150, 0.02), L(5, "exposition", 180, 0.015)) },
      { nom: "Chaos maîtrisé", desc: "Six hasards doux, aucun plus vite que vingt secondes.", r: Object.assign({}, L(1, "rotationMots", 45, 0.08, "doux"),
        L(2, "ondulation", 33, 0.1, "doux"), L(3, "decalage", 70, 0.05, "doux"), L(4, "halo", 27, 0.1, "triangle"), L(5, "trainees", 52, 0.12, "doux"), L(6, "respiration", 21, 0.12, "doux")) },
      { nom: "Le poème tangue", desc: "Roulis, ondulation et un peu de tremblement.", r: Object.assign({}, L(1, "rotationMots", 80, 0.06), L(2, "ondulation", 55, 0.08, "triangle"),
        L(3, "tremblement", 100, 0.03)) },
      { nom: "Lumière du jour", desc: "La lumière, la saturation, le contraste et le halo, sur cinq minutes.", r: Object.assign({}, L(1, "exposition", 300, 0.05),
        L(2, "saturation", 220, 0.06), L(3, "contraste", 160, 0.03), L(4, "halo", 260, 0.06)) },
      { nom: "Rien", desc: "Les six LFO débranchés : chaque réglage retrouve sa valeur.", r: {} },
    ] },
  { id: "scenes3d", onglet: "Scènes 3D", nom: "Scènes 3D",
    socle: () => pcDefauts(["t3Rotation", "t3Guide", "t3Perspective", "t3Brouillard", "t3Dos", "t3Musique", "t3Poussiere", "t3Houle", "t3Lever", "t3Vent"]),
    frais: () => ({ t3Rotation: pcH(0.3, 1), t3Guide: pcH(0.4, 0.9), t3Perspective: pcH(0.8, 1.3), t3Brouillard: pcH(0.4, 0.8), t3Dos: pcH(0.1, 0.35),
      t3Musique: pcH(0.5, 1.3), t3Poussiere: pcP(0.7), t3Houle: pcH(0.5, 1.3), t3Lever: pcH(0.2, 0.5), t3Vent: pcH(0.5, 1.3) }),
    presets: [
      { nom: "Lent et profond", desc: "Les formes tournent lentement, la perspective creuse.", r: { t3Rotation: 0.4, t3Perspective: 1.3, t3Brouillard: 0.8 } },
      { nom: "Presque immobile", desc: "La forme se tourne vers le vers qu'on lit, et c'est tout.", r: { t3Rotation: 0.12, t3Guide: 0.9, t3Musique: 0.4 } },
      { nom: "Brouillard", desc: "Le loin disparaît dans la brume.", r: { t3Brouillard: 1, t3Dos: 0.1, t3Rotation: 0.5 } },
      { nom: "De près", desc: "La forme vient vers nous, on voit à travers.", r: { t3Perspective: 1.8, t3Rotation: 0.5, t3Dos: 0.35 } },
      { nom: "Houle forte", desc: "Le champ se soulève, le drapé prend le vent.", r: { t3Houle: 1.6, t3Lever: 0.6, t3Vent: 1.5, t3Rotation: 0.6 } },
      { nom: "Respire avec la musique", desc: "Les notes et la musique font respirer les formes.", r: { t3Musique: 1.8, t3Rotation: 0.7 } },
    ] },
  // les paysages en lettres (scenes-paysages.js, 2026-10-19)
  { id: "paysages", onglet: "Paysages", nom: "Paysages",
    socle: () => pcDefauts(["paysVitesse", "paysDensite", "paysLoin", "paysLumieres", "paysTangage"]),
    frais: () => ({ paysVitesse: pcH(0.5, 1.2), paysDensite: pcH(0.6, 1.3), paysLoin: pcH(0.8, 1.8), paysLumieres: pcH(0.8, 1.6), paysTangage: pcH(0.2, 1) }),
    presets: [
      { nom: "Nuit lente", desc: "On avance doucement, les lumières brillent loin.", r: { paysVitesse: 0.5, paysDensite: 0.8, paysLoin: 1.3, paysLumieres: 1.1, paysTangage: 0.3 } },
      { nom: "Autoroute", desc: "Plus vite, plus de décor, des phares partout.", r: { paysVitesse: 1.8, paysDensite: 1.6, paysLoin: 1, paysLumieres: 1.5, paysTangage: 1 } },
      { nom: "Brume", desc: "Le loin disparaît, les lumières percent.", r: { paysVitesse: 0.7, paysDensite: 1, paysLoin: 0.5, paysLumieres: 1.6, paysTangage: 0.4 } },
      { nom: "Grand large", desc: "Peu de décor et un horizon très loin.", r: { paysVitesse: 0.8, paysDensite: 0.6, paysLoin: 2.2, paysLumieres: 0.8, paysTangage: 0.5 } },
      { nom: "Club", desc: "Les lumières et le tangage suivent la musique.", r: { paysVitesse: 1.2, paysDensite: 1.3, paysLoin: 1.1, paysLumieres: 2.2, paysTangage: 1.8 } },
      { nom: "Dépouillé", desc: "Presque rien, la caméra ne tangue pas.", r: { paysVitesse: 0.6, paysDensite: 0.4, paysLoin: 1.4, paysLumieres: 0.5, paysTangage: 0 } },
    ] },
  { id: "cables", onglet: "Câbles", nom: "Les huit câbles",
    socle: () => pcCables([]),
    frais: () => {
      const ok = PC_CABLES_FRAIS.filter(n => {
        const p = typeof CV_PATCHS !== "undefined" && CV_PATCHS.find(x => x.nom === n);
        try { return p && (!p.si || p.si()); } catch (e) { return false; }
      });
      const n = tirer(ok);
      return Object.assign(pcCables(pcPatch(n).map(([s, d, q, l]) => [s, d, +(q * hasard(0.6, 1)).toFixed(2), l])), { cvSonsMots: pcH(0.3, 0.7) });
    },
    presets: [
      { nom: "La note gonfle le mot", desc: "Chaque note fait gonfler les mots et allume un peu la lumière.", r: () => pcCables(pcPatch("La note gonfle le mot")) },
      { nom: "La rareté ouvre le filtre", desc: "Un mot rare ouvre le son et le halo.", r: () => pcCables(pcPatch("La rareté ouvre le filtre")) },
      { nom: "La houle", desc: "Des vagues lentes sur la respiration, les traînées, la réverbération.", r: () => pcCables(pcPatch("La houle")) },
      { nom: "Nuit lente", desc: "La marée sur le halo, les mots rares qui brillent.", r: () => pcCables(pcPatch("Nuit lente")) },
      { nom: "Les mots font l'écho", desc: "Chaque mot relance l'écho et un coup de lumière.", r: () => pcCables(pcPatch("Les mots font l'écho")) },
      { nom: "Le vers respire", desc: "Le poème s'ouvre au milieu : lumière et densité du son.", r: () => pcCables(pcPatch("Le vers respire")) },
      { nom: "Les poètes changent la lumière", desc: "Chaque poète déplace les teintes et le chorus.", r: () => pcCables(pcPatch("Les poètes changent la lumière")) },
      { nom: "La voix mène", desc: "Mode poésie : la voix allume, teinte, gonfle les mots.", r: () => pcCables(pcPatch("La voix mène")) },
      { nom: "La musique tient les mots", desc: "Avec la musique : basses, caisse et charley sur les mots.", si: () => S.musique && musique.actif,
        r: () => pcCables(pcPatch("La musique tient les mots")) },
      { nom: "Débrancher tout", desc: "Les huit câbles débranchés en douceur (et le patch du mode full auto se repose une minute).", repos: true, r: {} },
    ] },
];

/* ---------------------------------------------------- le moteur */

const pc = {
  piles: {}, etat: {}, dernier: {}, taches: [], vise: {}, rangees: {}, dernierPartout: null, final: { lfo: new Set(), cables: new Set() },
  mes: (() => { try { return JSON.parse(localStorage.getItem(CLE_PRESETS_CATEGORIES) || "null") || {}; } catch (e) { return {}; } })(),
  pret: false,

  // les cles de chaque categorie : celles de son onglet, moins ce qui n'est jamais a un preset
  preparer() {
    if (this.pret) return;
    this.pret = true;
    for (const cat of PC_CATEGORIES) {
      if (!cat.cles) {
        const o = SCHEMA.find(x => x.onglet === cat.onglet), l = [];
        for (const g of (o && o.groupes) || []) for (const it of g.items || []) {
          const c = it.cle;
          if (!c || !REGLAGE[c] || PC_JAMAIS.has(c) || SCENE_GROUPE.has(c) || /^sonVoix/.test(c)) continue;
          l.push(c);
        }
        cat.cles = l;
      }
      cat.ensemble = new Set(cat.cles.filter(c => REGLAGE[c]));
    }
  },
  categorie(id) { this.preparer(); return PC_CATEGORIES.find(c => c.id === id || c.onglet === id); },
  verrouillees() {
    const v = modes.verrous();
    return new Set([].concat(...modes.lesFamilles().filter(f => v.has(f.id)).map(f => f.cles)));
  },
  // les reglages que tiennent les LFO (ou les cables, a la main et du mode full auto), maintenant et
  // une fois poses ceux qui changent encore
  prisPar(quoi) {
    const l = new Set(this.taches.some(t => t.cat === quoi) ? this.final[quoi] : []);
    if (quoi === "lfo") { for (let i = 1; i <= LFO_NB; i++) if (S["lfo" + i + "Cible"] !== "aucune" && (S["lfo" + i + "Amplitude"] > 0 || ("lfo" + i + "Amplitude") in this.vise)) l.add(S["lfo" + i + "Cible"]); }
    else {
      for (let i = 1; i <= CV_NB; i++) if (S["cv" + i + "Src"] !== "aucune" && S["cv" + i + "Dst"] !== "aucune") l.add(S["cv" + i + "Dst"]);
      if (typeof cv !== "undefined" && cv.auto) for (const P of [cv.auto.actuel, cv.auto.ancien]) if (P) for (const c of P.cables) l.add(c.dst);
    }
    return l;
  },
  // la valeur de reference d'un reglage : la cible d'un fondu en cours, sinon sa base
  valeurDe(c) {
    if (modes.fondu[c]) return modes.fondu[c].a;
    if (c in this.vise) return this.vise[c];
    return baseDe(c);
  },
  // une valeur propre pour ce reglage (bornee, une option qui existe), ou undefined
  propre(c, v) {
    const it = REGLAGE[c];
    if (!it || v === undefined || v === null) return undefined;
    if (PC_ETEINTS.has(c)) return it.type === "case" ? false : it.type === "curseur" ? clamp(0, it.min, it.max) : undefined;
    if (it.type === "case") return !!v;
    if (it.type === "couleur") return /^#[0-9a-f]{6}$/i.test(String(v)) ? String(v) : undefined;
    if (it.type === "choix") {
      const o = it.options.find(x => String(x[0]) === String(v));
      if (!o) return /^(lfo\dCible|cv\d(Src|Dst))$/.test(c) ? "aucune" : undefined;
      // une cible interdite (vieille tele, ce qui clignote) : le LFO ou le cable reste debranche
      if (/^lfo\dCible$/.test(c) && o[0] !== "aucune" && !lfoCiblePermise(o[0])) return "aucune";
      if (/^cv\dDst$/.test(c) && o[0] !== "aucune" && (CV_JAMAIS.has(o[0]) || PC_LFO_INTERDITS.has(o[0]))) return "aucune";
      return typeof DEFAUTS[c] === "number" ? Number(o[0]) : o[0];
    }
    if (it.type !== "curseur") return undefined;
    let x = Number(v);
    if (!isFinite(x)) return undefined;
    x = clamp(x, it.min, it.max);
    return it.pas >= 1 ? clamp(it.min + Math.round((x - it.min) / it.pas) * it.pas, it.min, it.max) : +x.toFixed(4);
  },
  // ce qu'un preset veut : le socle de la categorie (sauf preset « seul »), puis ses reglages
  cibleDe(cat, p) {
    const r = Object.assign({}, p.seul || !cat.socle ? {} : cat.socle(), typeof p.r === "function" ? p.r() : p.r || {});
    // la seconde scene : une liste de preferences, jamais la scene du moment
    if (Array.isArray(r.calque)) { const l = pcCalqueParmi(r.calque); r.calque = l ? l[0] : "aucun"; }
    else if (r.calque && r.calque !== "aucun" && (r.calque === S.scene || r.calque === sceneCle)) r.calque = "aucun";
    return r;
  },

  // Poser des reglages dans une categorie. opt : { tirage (un depart frais : les verrous comptent),
  // annuler (on revient : rien n'est empile), nom, sansPhoto, duree }
  poser(cat, brut, opt) {
    opt = opt || {};
    this.preparer();
    const d = opt.duree || S.presetFondu || 3, r = {}, verrous = opt.tirage || PC_VERROUS_SUR_PRESETS ? this.verrouillees() : new Set();
    let sautees = 0, doubles = 0;
    for (const c in brut) {
      if (!cat.ensemble.has(c)) continue;
      if (verrous.has(c) && !opt.annuler) { sautees++; continue; }
      const v = this.propre(c, brut[c]);
      if (v !== undefined) r[c] = v;
    }
    // jamais un LFO et un cable sur le meme reglage : leurs bases se renvoient l'ecart de l'autre et
    // la valeur reglee derive (mesure le 2026-10-19 : 0,18 -> 0,34 sur la respiration)
    if (cat.id === "lfo" || cat.id === "cables") {
      const pris = this.prisPar(cat.id === "lfo" ? "cables" : "lfo");
      for (const c in r) if ((/^lfo\dCible$/.test(c) || /^cv\dDst$/.test(c)) && pris.has(r[c])) { r[c] = "aucune"; doubles++; }
      this.final[cat.id] = new Set(Object.keys(r).filter(c => /^lfo\dCible$/.test(c) || /^cv\dDst$/.test(c)).map(c => r[c]).filter(v => v !== "aucune"));
    }
    // un preset de LFO ou de cables precedent qui n'a pas fini : il s'efface devant celui-ci
    this.taches = this.taches.filter(t => t.cat !== cat.id);
    for (const c of cat.cles) delete this.vise[c];
    const avant = {};
    for (const c in r) avant[c] = this.valeurDe(c);
    if (!opt.annuler) {
      const pile = this.piles[cat.id] || (this.piles[cat.id] = []);
      pile.push(avant);
      if (pile.length > 12) pile.shift();
    }
    if (cat.id === "lfo") this.poserParPaires(cat, r, d, LFO_NB, i => ["lfo" + i + "Amplitude", ["lfo" + i + "Cible", "lfo" + i + "Forme", "lfo" + i + "Duree"],
      () => S["lfo" + i + "Cible"] !== "aucune"]);
    else if (cat.id === "cables") this.poserParPaires(cat, r, d, CV_NB, i => ["cv" + i + "Quantite", ["cv" + i + "Src", "cv" + i + "Dst"],
      () => S["cv" + i + "Src"] !== "aucune" && S["cv" + i + "Dst"] !== "aucune", ["cv" + i + "Lissage"]]);
    else this.poserSimple(r, d, opt);
    if (opt.repos && typeof cv !== "undefined" && cv.auto && cv.auto.actuel) { cv.auto.ancien = cv.auto.actuel; cv.auto.actuel = null; cv.auto.prochain = cv.maintenant() + 60; }
    sauver();
    this.majControles(cat);
    const n = Object.keys(r).filter(c => avant[c] !== r[c]).length;
    this.etat[cat.id] = (opt.annuler ? "Comme avant" : opt.nom ? "« " + opt.nom + " »" : "Posé") + (n ? " : " + n + " réglage" + (n > 1 ? "s" : "") + " en fondu." : " : rien à changer.") +
      (sautees ? " " + sautees + " verrouillé" + (sautees > 1 ? "s" : "") + " (onglet Modes, le hasard) : pas touché" + (sautees > 1 ? "s" : "") + "." : "") +
      (doubles ? " " + doubles + " laissé" + (doubles > 1 ? "s" : "") + " débranché" + (doubles > 1 ? "s" : "") + " : " + (cat.id === "lfo" ? "un câble" : "un LFO") + " tient déjà ce réglage." : "");
    if (!opt.annuler && opt.nom) this.dernier[cat.id] = opt.nom;
    this.majRangee(cat);
    return { changes: n, sautees };
  },
  // les curseurs glissent ; les choix et les cases changent sous un fondu de l'image
  poserSimple(r, d, opt) {
    const discrets = {};
    let visuel = false;
    for (const c in r) {
      const v = r[c], it = REGLAGE[c];
      if (typeof v === "number" && it.type === "curseur" && (it.pas < 1 || GLISSE_ENTIERS.has(c))) { modes.glisser(c, v, d); continue; }
      delete modes.fondu[c];
      if (baseDe(c) === v) continue;
      discrets[c] = v;
      if (!/^(calque|lfo|mod|son|main|battement|kick|caisse|charley|voix|pilote|t3|calli)/.test(c)) visuel = true;
    }
    if (visuel && !opt.sansPhoto) photographier();
    for (const c in discrets) {
      if (sousModulation(c) && typeof discrets[c] === "number") { poserBase(c, discrets[c]); pilote.prendre(c); }
      else changer(c, discrets[c]);
    }
  },
  // Les LFO et les cables, un par un : [amplitude (ou quantite), ce qui change sa nature (cible, forme,
  // duree ; source, destination), s'il est branche, ce qui se pose sans fondu (le lissage)].
  // Un LFO qui change de nature redescend d'abord a zero, puis change, puis remonte.
  poserParPaires(cat, r, d, nb, cles) {
    const t = performance.now();
    for (let i = 1; i <= nb; i++) {
      const [amp, nature, branche, libres] = cles(i);
      for (const c of libres || []) if (c in r && S[c] !== r[c]) changer(c, r[c]);
      const vise = amp in r ? r[amp] : this.valeurDe(amp);
      const change = nature.some(c => c in r && S[c] !== r[c]);
      if (!change) { if (amp in r) modes.glisser(amp, vise, d); continue; }
      const poserNature = () => {
        for (const c of nature) if (c in r && S[c] !== r[c]) changer(c, r[c]);
        delete modes.fondu[amp];
        S[amp] = 0;
        modes.glisser(amp, vise, d);
        delete this.vise[amp];
      };
      if (branche() && Math.abs(Number(S[amp])) > 1e-4) {
        // il redescend (son ancienne cible retrouve sa base), puis il change
        modes.glisser(amp, 0, d * 0.5);
        this.vise[amp] = vise;
        const attendu = {};
        for (const c of nature) attendu[c] = S[c];
        this.taches.push({ cat: cat.id, t: t + d * 500 + 60, f: () => {
          // quelqu'un a change sa nature entre-temps : il a la main
          if (nature.some(c => S[c] !== attendu[c])) { delete this.vise[amp]; return; }
          poserNature();
          this.majControles(cat);
        } });
      } else poserNature();
    }
  },
  majTaches() {
    if (!this.taches.length) return;
    const t = performance.now(), prets = this.taches.filter(x => t >= x.t);
    if (!prets.length) return;
    this.taches = this.taches.filter(x => t < x.t);
    for (const x of prets) { try { x.f(); } catch (e) { console.error("poiasie : presets de catégorie", e); } }
    sauver();
  },
  majControles(cat) {
    if (panneau.hidden) return;
    for (const c of cat.cles) if (controles[c]) controles[c].maj();
    if (cat.id === "son" && typeof majSonUI === "function") majSonUI();
  },

  /* -------- les gestes de la rangee */
  presetsDe(cat) { return cat.presets.filter(p => { try { return !p.si || p.si(); } catch (e) { return false; } }); },
  poserPreset(cat, p) {
    const res = this.poser(cat, this.cibleDe(cat, p), { nom: p.nom, repos: p.repos });
    annoncer(p.nom.toUpperCase(), cat.nom.toLowerCase());
    return res;
  },
  poserNom(id, nom) {
    const cat = this.categorie(id), p = cat && (cat.presets.find(x => x.nom === nom) || (this.mes[cat.id] || []).find(x => x.nom === nom));
    if (!p) return null;
    return p.reglages ? this.poser(cat, p.reglages, { nom: p.nom }) : this.poserPreset(cat, p);
  },
  frais(cat, opt) {
    if (!cat.frais) return null;
    return this.poser(cat, cat.frais(), Object.assign({ tirage: true, nom: "Un départ frais" }, opt || {}));
  },
  remettre(cat) {
    const pile = this.piles[cat.id];
    if (!pile || !pile.length) { this.etat[cat.id] = "Rien à remettre : aucun preset de cette page n'a été posé."; this.majRangee(cat); return false; }
    this.poser(cat, pile.pop(), { annuler: true });
    delete this.dernier[cat.id];
    this.majRangee(cat);
    return true;
  },
  garder(cat) {
    this.preparer();
    const r = {}, tout = lfo.aSauver();
    for (const c of cat.cles) r[c] = c in this.vise || modes.fondu[c] ? this.valeurDe(c) : tout[c];
    const d = new Date(), h = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
    const liste = this.mes[cat.id] || (this.mes[cat.id] = []);
    let nom = "Gardé à " + h, k = 2;
    while (liste.some(p => p.nom === nom)) nom = "Gardé à " + h + " (" + k++ + ")";
    liste.push({ nom, reglages: r, date: d.toISOString() });
    this.ecrireMes();
    this.dernier[cat.id] = nom;
    this.etat[cat.id] = "« " + nom + " » gardé dans « Les miens » (ce navigateur).";
    this.majRangee(cat, true);
  },
  oublier(cat, nom) {
    this.mes[cat.id] = (this.mes[cat.id] || []).filter(p => p.nom !== nom);
    this.ecrireMes();
    delete this.dernier[cat.id];
    this.etat[cat.id] = "« " + nom + " » oublié.";
    this.majRangee(cat, true);
  },
  ecrireMes() { try { localStorage.setItem(CLE_PRESETS_CATEGORIES, JSON.stringify(this.mes)); } catch (e) { /* stockage refuse : tant pis */ } },

  /* -------- la rangee en haut de chaque onglet */
  construire(o, page) {
    this.preparer();
    const cat = PC_CATEGORIES.find(c => c.onglet === o.onglet);
    if (!cat) return;
    const fs = document.createElement("fieldset");
    fs.className = "pc-rangee";
    const lg = document.createElement("legend"); lg.textContent = "Points de départ : " + cat.nom; fs.appendChild(lg);
    const r = document.createElement("div"); r.className = "rangee"; r.style.marginTop = "0";
    const sel = document.createElement("select"); sel.style.flex = "1 1 150px";
    sel.addEventListener("change", () => {
      const v = sel.value; sel.value = "";
      if (!v) return;
      const [type, i] = v.split(":");
      if (type === "k") { const p = this.presetsDe(cat)[Number(i)]; if (p) this.poserPreset(cat, p); }
      else { const p = (this.mes[cat.id] || [])[Number(i)]; if (p) { this.poser(cat, p.reglages, { nom: p.nom }); annoncer(p.nom.toUpperCase(), cat.nom.toLowerCase()); } }
      sel.blur();
    });
    const bouton = (texte, titre, f) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "bouton"; b.textContent = texte; b.title = titre;
      b.style.minWidth = "0"; b.style.padding = "3px 6px";
      b.addEventListener("click", f); r.appendChild(b); return b;
    };
    r.appendChild(sel);
    if (cat.frais) bouton("Un départ frais", "Des réglages frais pour cette page, tirés dans des plages qui marchent (les verrous du hasard comptent).", () => this.frais(cat));
    bouton("Garder", "Garder les réglages de cette page dans « Les miens » (ce navigateur).", () => this.garder(cat));
    bouton("Comme avant", "Annuler le dernier preset de cette page.", () => this.remettre(cat));
    const oubli = bouton("Oublier", "Oublier le dernier des miens posé (deux clics).", () => {
      const nom = this.dernier[cat.id];
      if (!nom) return;
      if (oubli.dataset.sur) { delete oubli.dataset.sur; this.oublier(cat, nom); return; }
      oubli.dataset.sur = "1"; oubli.textContent = "Sûr ?";
      setTimeout(() => { delete oubli.dataset.sur; oubli.textContent = "Oublier"; }, 3000);
    });
    fs.appendChild(r);
    const etat = document.createElement("div");
    etat.style.cssText = "margin-top:4px;color:#404040;font-size:10px;min-height:12px";
    fs.appendChild(etat);
    page.insertBefore(fs, page.firstChild);
    this.rangees[cat.id] = { fs, sel, etat, oubli, page };
    this.majRangee(cat, true);
  },
  // la rangee reste en haut (l'onglet Cables pose ensuite son etat au-dessus)
  remonter(onglet) {
    const cat = PC_CATEGORIES.find(c => c.onglet === onglet), x = cat && this.rangees[cat.id];
    if (x && x.page.firstChild !== x.fs) x.page.insertBefore(x.fs, x.page.firstChild);
  },
  majRangee(cat, menu) {
    const x = this.rangees[cat.id];
    if (!x) return;
    const mes = this.mes[cat.id] || [], dernier = this.dernier[cat.id];
    if (menu) {
      const opts = ['<option value="">' + "(" + cat.presets.length + " presets : choisir)" + "</option>"];
      const echapper = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
      const kit = this.presetsDe(cat);
      let groupe = null;
      kit.forEach((p, i) => {
        const g = p.groupe || null;
        if (g !== groupe) { if (groupe) opts.push("</optgroup>"); if (g) opts.push('<optgroup label="' + echapper(g) + '">'); groupe = g; }
        opts.push('<option value="k:' + i + '" title="' + echapper(p.desc || "") + '">' + echapper(p.nom) + "</option>");
      });
      if (groupe) opts.push("</optgroup>");
      if (mes.length) opts.push('<optgroup label="Les miens">' + mes.map((p, i) => '<option value="m:' + i + '">' + echapper(p.nom) + "</option>").join("") + "</optgroup>");
      x.sel.innerHTML = opts.join("");
      x.sel.value = "";
    }
    if (x.sel.options[0]) x.sel.options[0].textContent = dernier ? "« " + dernier + " »" : "(" + this.presetsDe(cat).length + " presets : choisir)";
    x.oubli.hidden = !(dernier && mes.some(p => p.nom === dernier));
    x.etat.textContent = this.etat[cat.id] || "";
  },
};

/* ---------------------------------------------------- un depart frais partout */

// Jiiji : « relancer un cycle propre ». Toutes les categories a la fois, sauf la scene, le mode et le
// son allume ou eteint (aucune categorie ne les contient) ; l'image passe en fondu une seule fois.
const PC_ORDRE_PARTOUT = ["couleurs", "effets", "mots", "mouvements", "combo", "sonMene", "lfo", "cables", "son", "musique", "main", "scenes3d", "voix", "rythme"];
function departFraisPartout() {
  pc.preparer();
  photographier();
  const lot = [];
  let n = 0;
  for (const id of PC_ORDRE_PARTOUT) {
    const cat = pc.categorie(id);
    if (!cat || !cat.frais) continue;
    const res = pc.frais(cat, { sansPhoto: true });
    if (res) n += res.changes;
    const pile = pc.piles[cat.id];
    if (pile && pile.length) lot.push([cat.id, pile[pile.length - 1]]);
  }
  pc.dernierPartout = lot;
  modes.etat = "Un départ frais partout : " + n + " réglages en fondu (Maj + * : comme avant).";
  if (typeof majModesUI === "function") majModesUI(true);
  annoncer("UN DÉPART FRAIS", "partout");
  return n;
}
function remettrePartout() {
  const lot = pc.dernierPartout;
  if (!lot || !lot.length) return false;
  photographier();
  for (const [id, avant] of lot) {
    const cat = pc.categorie(id), pile = pc.piles[id];
    if (pile && pile[pile.length - 1] === avant) pile.pop();
    pc.poser(cat, avant, { annuler: true, sansPhoto: true });
  }
  pc.dernierPartout = null;
  modes.etat = "Tout est revenu comme avant le départ frais.";
  if (typeof majModesUI === "function") majModesUI(true);
  annoncer("COMME AVANT", "partout");
  return true;
}
// appele par construirePanneau (panneau.js) pour chaque onglet
function construireRangeeCategorie(o, page) { pc.construire(o, page); }

/* ---------------------------------------------------- les branchements */

// les taches des LFO et des cables (redescendre, changer, remonter), chaque image avant les LFO
{
  const majAvant = lfo.maj;
  lfo.maj = function () { try { pc.majTaches(); } catch (e) { console.error(e); } return majAvant.apply(this, arguments); };
}
// l'onglet Cables pose son etat en haut de sa page a la premiere image : la rangee y remonte
if (typeof cv !== "undefined" && typeof cv.preparer === "function") {
  const preparerAvant = cv.preparer;
  cv.preparer = function () { const r = preparerAvant.apply(this, arguments); pc.remonter("Câbles"); return r; };
}
// le pied du panneau : « Un départ frais » pour toutes les pages, a cote du hasard
{
  const pied = document.querySelector("#panneau .pied"), h = document.getElementById("b-hasard");
  if (pied) {
    const b = document.createElement("button"); b.type = "button"; b.className = "bouton"; b.id = "b-frais";
    b.textContent = "Un départ frais"; b.title = "Toutes les pages repartent de réglages frais, sauf la scène, le mode et le son (touche *, Maj + * : comme avant).";
    b.addEventListener("click", () => departFraisPartout());
    if (h && h.nextSibling) pied.insertBefore(b, h.nextSibling); else pied.appendChild(b);
  }
}
