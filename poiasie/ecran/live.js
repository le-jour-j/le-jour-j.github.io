"use strict";
/* ================================================================ le live : manette, clavier, annonces */

// Ce que les gachettes et les sticks ajoutent en ce moment aux reglages. Rien n'est garde :
// on lache, ca revient.
const live = { mod: { halo: 0, rvb: 0, ondes: 0, mosaique: 0, larsen: 0, zoom: 0, rot: 0, tourne: 0, vhs: 0, flash: 0 }, vitesse: 1, coupNeuf: 0 };

const osd = document.getElementById("osd");
let minuteurOsd = null;
function annoncer(titre, sous) {
  // rien ne s'ecrit sur l'image tant qu'on ne l'a pas demande (Jiiji, 2026-10-17 : il projette)
  if (!S.annoncesEcran) return;
  osd.replaceChildren(document.createTextNode(titre));
  if (sous) { const s = document.createElement("small"); s.textContent = sous; osd.appendChild(s); }
  osd.classList.add("visible");
  clearTimeout(minuteurOsd);
  minuteurOsd = setTimeout(() => osd.classList.remove("visible"), 1300);
}

// nomDe(liste, cle) est dans pilote.js (charge avant ce fichier) : la copie d'ici, identique,
// la remplacait en silence (grand rangement du 2026-10-19)

// changer de scene en live : l'ancienne image s'efface en fondu sous la nouvelle
function changerScene(cle) {
  photographier();
  changer("scene", cle);
  if (controles.scene) controles.scene.maj();
  annoncer(nomDe(SCENES_NOMS, cle).toUpperCase(), cle === "auto" ? "toutes, à tour de rôle" : "scène");
}
function sceneVoisine(sens) {
  const cles = SCENES_NOMS.map(([k]) => k).filter(k => !SCENES_BANQUE.has(k) || k === S.scene);
  changerScene(cles[(cles.indexOf(S.scene) + sens + cles.length) % cles.length]);
}
function paletteVoisine(sens) {
  const cles = Object.keys(PALETTES);
  const k = cles[(cles.indexOf(S.palette) + sens + cles.length) % cles.length];
  changer("palette", k);
  if (controles.palette) controles.palette.maj();
  annoncer(PALETTES[k].nom.toUpperCase(), "palette");
}
let ambianceCourante = -1;
function ambianceVoisine(sens) {
  // jamais les ambiances de la Banque (Jiiji ne les aime pas : elles revenaient par T et triangle,
  // audit du 2026-10-18) ; on les choisit encore dans la liste du panneau
  const noms = Object.keys(AMBIANCES).filter(n => !SCENES_BANQUE.has(AMBIANCES[n].scene));
  ambianceCourante = (ambianceCourante + sens + noms.length) % noms.length;
  poserAmbiance(noms[ambianceCourante]);
  annoncer(noms[ambianceCourante].toUpperCase(), "ambiance");
}
function basculerEffet(cle, allume, nom) {
  const v = S[cle] > 0 ? 0 : allume;
  changer(cle, v);
  if (controles[cle]) controles[cle].maj();
  annoncer(nom.toUpperCase(), v ? "allumé" : "éteint");
}
const MIROIRS = [0, 4, 6, 8, 12, 16];
function kaleidoVoisin(sens) {
  let i = MIROIRS.findIndex(n => n >= Math.round(S.kaleido));
  if (i < 0) i = 0;
  i = clamp(i + sens, 0, MIROIRS.length - 1);
  changer("kaleido", MIROIRS[i]);
  if (controles.kaleido) controles.kaleido.maj();
  annoncer("KALÉIDOSCOPE", MIROIRS[i] ? MIROIRS[i] + " miroirs" : "éteint");
}
function vitesseVoisine(pas) {
  changer("vitesse", clamp(+(S.vitesse + pas).toFixed(2), 0.1, 3));
  if (controles.vitesse) controles.vitesse.maj();
  annoncer("VITESSE " + S.vitesse.toFixed(2).replace(/\.?0+$/, ""));
}
function toutEteindre() {
  // sans reconstruire la scene : on coupe les effets, le poeme continue. Et plus aucun reste (audit
  // du 2026-10-18) : les LFO debranches, « Le son mène » a zero, le kaleidoscope stable eteint, le
  // pilote ne mene plus les effets, les mots graves reprennent leur vie, les coups des gestes et les
  // fondus des presets s'arretent
  const v = Object.assign({}, AMBIANCES["Sobre (sans effet)"], { kaleidoStable: false, piloteEffets: false });
  for (const [c] of MODS) v["mod" + c] = 0;
  for (let i = 1; i <= LFO_NB; i++) v["lfo" + i + "Cible"] = "aucune";
  if ("cvActif" in DEFAUTS) v.cvActif = false;  // les cables (cv.js) aussi : plus rien ne module
  if (typeof modes !== "undefined") modes.arreterFondus();
  potards.retours = {};
  for (const c in v) { S[c] = v[c]; pilote.prendre(c); if (sousModulation(c)) poserBase(c, v[c]); }  // sous un LFO ou un cable : sa base aussi
  sauver();
  for (const k in v) if (controles[k]) controles[k].maj();
  manette.remettre();  // et ce que les sticks avaient laisse (chaque main redresse l'image)
  for (const m of main.mots) { m.fige = false; m.vie = Math.min(m.vie, m.age + 3); }
  for (const k in main.impact) main.impact[k] = 0;
  main.pince = main.choc = 0;
  for (const j of joueurs) j.choc = j.spin = 0;
  live.mod.flash = 0;
  annoncer("SOBRE", "tous les effets éteints");
}
function flash() { live.mod.flash = 1.4; live.coupNeuf = 1; }
// le combo en live : la seconde scene suivante, l'echange des deux, le miroir
function calqueVoisin(sens) {
  const cles = SCENES_CALQUE.map(([k]) => k);
  const k = cles[(cles.indexOf(S.calque) + sens + cles.length) % cles.length];
  changer("calque", k);
  if (controles.calque) controles.calque.maj();
  annoncer(k === "aucun" ? "UNE SEULE SCÈNE" : "+ " + nomDe(SCENES_CALQUE, k).toUpperCase(), k === "aucun" ? "combo éteint" : "combo");
}
function echangerCalque() {
  if (S.calque === "aucun" || S.calque === "auto" || S.scene === "auto") { annoncer("ÉCHANGE", "il faut deux scènes choisies"); return; }
  const dessus = S.calque;
  changer("calque", S.scene);
  if (controles.calque) controles.calque.maj();
  changerScene(dessus);
}
const MIROIRS_NOMS = [["aucun", "éteint"], ["gd", "gauche et droite"], ["hb", "haut et bas"], ["quatre", "les quatre coins"]];
function degradeVoisin(sens) {
  const cles = DEGRADES_NOMS.map(([k]) => k);
  const k = cles[(cles.indexOf(S.degrade) + sens + cles.length) % cles.length];
  changer("degrade", k);
  if (controles.degrade) controles.degrade.maj();
  annoncer("DÉGRADÉ", nomDe(DEGRADES_NOMS, k).toLowerCase());
}
function miroirVoisin() {
  const i = (MIROIRS_NOMS.findIndex(([k]) => k === S.miroir) + 1) % MIROIRS_NOMS.length;
  changer("miroir", MIROIRS_NOMS[i][0]);
  if (controles.miroir) controles.miroir.maj();
  annoncer("MIROIR", MIROIRS_NOMS[i][1]);
}

/* ================================================================ le jeu : une main par manette */

// Jiiji, 2026-10-19 : « on va refaire les controles de la manette, ca sert plus, en fait on va faire
// un jeu multijoueur », « tout le monde aura le meme type sur chaque touche mais des configs
// differentes : autant de facons differentes d'interagir dans le jeu qu'il y a de personnages »,
// « y a une touche pour changer de perso, mais on voit jamais le principe de joueur », « pas le truc
// des 50 configs sur la manette comme avant, c'est trop complexe ». Et depuis le 2026-10-17 : « un jeu
// graphico musico poetique, abstrait » (pas de score, pas de but).
//
// Jusqu'a quatre manettes (la limite du navigateur), chacune sa main a l'ecran. Une seule disposition
// pour tous (DISPOSITION, plus bas) ; L1 et R1 tenus sont les modificateurs, comme Maj et Ctrl : L1
// donne aux memes touches leur geste en grand, R1 leur geste partout. Les personnages sont les poetes
// du generateur (poetes.py) : chacun ecrit ses propres vers du recueil, a sa facon, a sa couleur, avec
// son timbre. Rien ne s'ecrit sur l'image : ni joueur, ni poete, ni score. Les anciennes pages de la
// manette (Live, Video, Poeme, FX son, Son, Musique, Pilote, Presets), les potards et les macros sont
// gardes dans archives\live-manette-2026-10-19.js.

// Les boutons, dans l'ordre du mapping « standard » de Chrome
const BOUTONS = { croix: 0, rond: 1, carre: 2, triangle: 3, L1: 4, R1: 5, L2: 6, R2: 7, share: 8, options: 9, L3: 10, R3: 11, haut: 12, bas: 13, gauche: 14, droite: 15, ps: 16, pave: 17 };
const NOM_BOUTON = Object.fromEntries(Object.entries(BOUTONS).map(([k, v]) => [v, k]));
// Une vraie DualShock (ou une Xbox) arrive deja rangee par Chrome (mapping "standard"). Les manettes
// compatibles (celle de Jiiji : « PS4 Fun Controller », 11c0:4001, 14 boutons, 10 axes) arrivent en
// brut : carre 0, croix 1, rond 2, triangle 3, L1 4, R1 5, L2 6, R2 7, Share 8, Options 9, L3 10,
// R3 11, PS 12, pave 13 ; gachettes sur les axes 3 et 4 (de -1 a 1), stick droit vertical sur l'axe
// 5, croix directionnelle sur l'axe 9 (un seul axe, 3.29 au repos). Une autre manette en brut : on
// suppose l'ordre habituel des boutons et les sticks sur les quatre premiers axes.
// Traduction deduite de la disposition DualShock habituelle, pas verifiee bouton par bouton (2026-10-16).
const reposVu = {};
function lirePad(pad) {
  const b = i => pad.buttons[i] || { pressed: false, value: 0 };
  const pret = x => ({ pressed: !!x.pressed, value: x.value || 0 });
  if (pad.mapping === "standard" || pad.axes.length < 10) {
    return { b: Array.from({ length: 18 }, (_, i) => pret(b(i))), a: [0, 1, 2, 3].map(i => pad.axes[i] || 0) };
  }
  const ax = i => pad.axes[i] || 0, cle = pad.index + "|" + pad.id;
  // une gachette sur un axe ne compte qu'une fois vue au repos (-1) : avant, Chrome dit 0
  const gachette = (i, bouton) => {
    if (ax(i) < -0.9) reposVu[cle + ":" + i] = true;
    const v = reposVu[cle + ":" + i] ? (ax(i) + 1) / 2 : 0;
    return Math.max(v, b(bouton).pressed ? Math.max(b(bouton).value, 0.999) : 0);
  };
  const chapeau = ax(9), dir = Math.abs(chapeau) <= 1.05 ? Math.round((chapeau + 1) / (2 / 7)) : -1;  // 0 haut, 2 droite, 4 bas, 6 gauche
  const vers = (...d) => ({ pressed: d.includes(dir), value: d.includes(dir) ? 1 : 0 });
  const g2 = gachette(3, 6), d2 = gachette(4, 7);
  const bs = [pret(b(1)), pret(b(2)), pret(b(0)), pret(b(3)), pret(b(4)), pret(b(5)),
    { pressed: g2 > 0.5, value: g2 }, { pressed: d2 > 0.5, value: d2 },
    pret(b(8)), pret(b(9)), pret(b(10)), pret(b(11)),
    vers(7, 0, 1), vers(3, 4, 5), vers(5, 6, 7), vers(1, 2, 3), pret(b(12)), pret(b(13))];
  return { b: bs, a: [ax(0), ax(1), ax(2), ax(5)] };
}

/* ---------------------------------------------------- les personnages : les poetes */

// Leur couleur : celle de leurs vers dans les scenes (teinteDe). Les neuf poetes arrives le 2026-10-18
// n'avaient qu'une teinte tiree de leur nom, et trois d'entre eux tombaient a quelques degres du
// lyrique ou du brut : on ne les distinguait pas. Ils recoivent ici une teinte a eux (un ajout a
// TEINTES : les cinq d'origine ne bougent pas), espacees d'environ 25 degres.
for (const [nom, h] of [["Le nomenclateur", 78], ["Le chosiste", 104], ["L'inventoriste", 128], ["Le débit", 152], ["L'exorciste", 176],
  ["Le caissier", 226], ["La voisine", 250], ["Le mode d'emploi", 300], ["Le malaxeur", 322]]) if (!(nom in TEINTES)) TEINTES[nom] = h;

// Chaque poete joue les memes gestes a sa facon : c'est une config, pas de nouvelles touches.
//   forme    : comment la main tenue sur la croix pose ses mots (chemin : le long du trajet ; plume :
//              en lignes de gauche a droite ; loin : loin de la main ; mot : un seul, grand ; grille :
//              tamponnes sur une grille ; objet : autour d'un objet ; colonne : en liste qui descend)
//   grand    : la disposition d'un vers entier (L1 + croix), partout : d'une strophe sur l'ecran (R1)
//   taille, vie, pas (ecart entre les mots en marchant), cadence (secondes entre deux mots, main
//   immobile), ne (le mot nait gros), lueur, encre (la trainee), tordu (angle au hasard), onde (les
//   mots ondulent sur la ligne), casse (maj : capitales ; nom : Chaque Mot Comme Un Nom), numeros,
//   chiffres, malaxe, fantome (un echo du mot), defile (les mots s'en vont en cortege)
//   son      : timbre, registre (octaves), motif (degres ajoutes mot apres mot), duree, force, chaque
//              (un mot sur n chante), rythme (notes par seconde au plus), chiffre (le timbre des montants)
//   eclat    : ce que fait son « eclater » (et ce qu'il frappe dans l'image : frappe, choc, spin)
//   chant    : son « chanter » ; grave : son « graver »
// Les sons restent dans la gamme (son.frequence) et passent par son.voix (budget de voix), en timbres
// qui frappent : ni nappe ni bruit (Jiiji, 2026-10-19).
const PERSOS = [
  // tu ecris a quelqu'un, avec souffle : les mots ondulent, un piano electrique qui monte
  { cle: "lyrique", nom: "Le lyrique", forme: "chemin", grand: "ligne", partout: "lignes", vie: 1.2, cadence: 0.8, onde: 0.3, encre: 1,
    son: { t: "fmdoux", motif: [0, 2, 4, 2, 1, 3], dur: 1.6, force: 0.85 },
    eclat: { style: "petales", sons: [["fmdoux", 0, 0], ["fmdoux", 2, 0.09], ["fmdoux", 4, 0.18], ["fmdoux", 7, 0.27]], frappe: { halo: 1, flash: 0.25 }, choc: 0.4 },
    chant: { t: "vibraphone", motif: [0, 2, 4, 5, 4, 2, 1, 0], pas: 0.22, dur: 2.4 },
    grave: { sons: [["vibraphone", 4]], frappe: { halo: 1.3, flash: 0.4 } } },
  // un mot a la fois, grand, qui reste ; une boite a musique, une note
  { cle: "minimaliste", nom: "Le minimaliste", forme: "mot", grand: "mot", partout: "mot", taille: 1.9, vie: 2.2, pas: 3.5, cadence: 2.4, ne: 0.4, lueur: 0.5, encre: 0,
    son: { t: "boite", motif: [0], reg: 1, dur: 1.8, force: 0.9, rythme: 1.2 },
    eclat: { style: "fente", seul: true, sons: [["boite", 7, 0]], frappe: { halo: 0.3 }, choc: 0.15 },
    chant: { t: "clochette", motif: [0, 4], pas: 0.6, dur: 2.8, peu: true },
    grave: { sons: [["clochette", 7]], frappe: { halo: 0.6 } } },
  // des realites lointaines rapprochees : les mots paraissent loin de la main, reliees par un fil
  { cle: "surrealiste", nom: "Le surréaliste", forme: "loin", grand: "eparpille", partout: "eparpille", pas: 2, cadence: 1.1, tordu: 0.5, encre: 0.4,
    son: { t: "clochette", motif: [0, 7, -3, 9, 2, -5], dur: 2, force: 0.8 },
    eclat: { style: "permute", sons: [["clochette", 0, 0], ["clochette", 9, 0.25]], frappe: { decal: 0.8, rvb: 0.8 }, choc: 0.3 },
    chant: { t: "celesta", motif: [0, 9, -2, 11, 4], pas: 0.2, dur: 2, special: "echo" },
    grave: { sons: [["celesta", 9]], frappe: { decal: 0.5, halo: 0.8 } } },
  // les allitérations : chaque mot laisse son echo, les notes se repetent
  { cle: "sonore", nom: "Le sonore", forme: "chemin", grand: "ligne", partout: "lignes", cadence: 0.5, fantome: true, encre: 0.8,
    son: { t: "pluck", motif: [0, 0, 2, 2, 4, 4], dur: 1, force: 0.8 },
    eclat: { style: "rebond", sons: [["pluck", 0, 0], ["pluck", 0, 0.07], ["pluck", 0, 0.14], ["pluck", 0, 0.21]], frappe: { ondes: 0.9 }, choc: 0.4 },
    chant: { t: "koto", motif: [0, 0, 2, 2, 4, 4, 2, 2], pas: 0.12, dur: 1.4, special: "begaie" },
    grave: { sons: [["koto", 2]], frappe: { ondes: 0.6, halo: 0.8 } } },
  // des constats : tamponnes droits, en capitales, sur une grille ; un marimba grave et sec
  { cle: "brut", nom: "Le brut", forme: "grille", grand: "grille", partout: "grille", taille: 1.05, vie: 0.7, cadence: 0.6, ne: 0.15, lueur: 0, casse: "maj", encre: 1.4,
    son: { t: "marimba", motif: [0, 0, -1, 0], reg: -1, dur: 0.9, force: 1 },
    eclat: { style: "chute", sons: [["marimba", -7, 0], ["woodblock", 0, 0.12]], frappe: { fonte: 0.5, rvb: 0.6 }, choc: 0.8 },
    chant: { t: "woodblock", motif: [0, 0, 0, 2], pas: 0.16, dur: 0.3 },
    grave: { sons: [["marimba", -7]], frappe: { flash: 0.3 }, choc: 0.6 } },
  // la parole qui deborde : vite, longtemps, des phrases qui s'enchainent, petites et serrees
  { cle: "debit", nom: "Le débit", forme: "chemin", plumeArret: true, grand: "bloc", partout: "bloc", taille: 0.72, vie: 0.85, pas: 0.35, cadence: 0.16, ne: 0.5, encre: 0.6,
    son: { t: "analog", motif: [0, 1, 2, 3, 4, 5, 4, 3, 2, 1], dur: 0.6, force: 0.6, rythme: 4 },
    eclat: { style: "foule", sons: [0, 1, 2, 3, 4, 5].map(k => ["analog", k, k * 0.05]), frappe: { rvb: 1.4, ondes: 0.5 }, choc: 0.5 },
    chant: { t: "guitare", motif: [0, 1, 2, 3, 4, 5, 6, 7], pas: 0.07, dur: 0.4 },
    grave: { sons: [["guitare", 0], ["guitare", 2]], frappe: { halo: 1, flash: 0.3 } } },
  // pour chasser ce qui occupe : les mots frappent de travers, l'eclat fait tourner l'image
  { cle: "exorciste", nom: "L'exorciste", forme: "chemin", grand: "ligne", partout: "eparpille", pas: 1.2, cadence: 0.45, ne: 1.6, tordu: 0.45, encre: 1.6,
    son: { t: "peau", motif: [0, -2, 0, 3], reg: -1, dur: 0.8, force: 1.1 },
    eclat: { style: "exorcisme", sons: [["peau", -7, 0], ["fente", -5, 0.1], ["peau", -7, 0.2]], frappe: { rvb: 2.2, ondes: 0.8, flash: 0.4, decal: 0.4 }, choc: 1, spin: 1.4 },
    chant: { t: "fente", motif: [0, -2, 3, -1], pas: 0.14, dur: 0.7, special: "cri" },
    grave: { sons: [["peau", -7]], frappe: { fonte: 0.5, rvb: 0.8 }, choc: 0.5 } },
  // une phrase qui se retourne : chaque vers revient avec un mot change, les lettres malaxees
  { cle: "malaxeur", nom: "Le malaxeur", forme: "chemin", grand: "lignes", grandVers: 2, partout: "lignes", cadence: 0.6, malaxe: true, encre: 1,
    son: { t: "kalimba", motif: [0, 1, 0, -1], dur: 1.4, force: 0.8 },
    eclat: { style: "orbite", sons: [0, 2, 0, -2, 0].map((d, k) => ["kalimba", d, k * 0.08]), frappe: { ondes: 1.2, decal: 0.3 }, choc: 0.3 },
    chant: { t: "kalimba", motif: [0, 1, 2, 1, 0, 1, 2, 3], pas: 0.15, dur: 1.4 },
    grave: { sons: [["kalimba", 0], ["kalimba", 1]], frappe: { halo: 1, ondes: 0.4 } } },
  // les vies par leurs transactions : des montants entre les mots, une caisse accordee
  { cle: "caissier", nom: "Le caissier", forme: "chemin", grand: "ticket", partout: "ticket", taille: 0.9, cadence: 0.55, chiffres: true, encre: 0.5,
    son: { t: "woodblock", motif: [0, 0, 1, 0], dur: 0.3, force: 0.7, chiffre: "glock" },
    eclat: { style: "pieces", sons: [["woodblock", 0, 0], ["woodblock", 2, 0.07], ["glock", 7, 0.16], ["glock", 14, 0.3]], frappe: { halo: 0.8, flash: 0.3 }, choc: 0.3 },
    chant: { t: "glock", motif: [0, 2, 4, 7], pas: 0.12, dur: 1.2, special: "caisse" },
    grave: { sons: [["glock", 7], ["woodblock", 0]], frappe: { halo: 1.2, flash: 0.5 } } },
  // des personnages aux noms impossibles : Chaque Mot Est Un Nom, et la foule s'en va en cortege
  { cle: "nomenclateur", nom: "Le nomenclateur", forme: "chemin", grand: "ligne", partout: "lignes", cadence: 0.5, casse: "nom", defile: true, encre: 0.8,
    son: { t: "steel", motif: [0, 4, 2, 5, 3, 7], dur: 1.1, force: 0.85 },
    eclat: { style: "confettis", sons: [0, 4, 7, 9].map((d, k) => ["steel", d, k * 0.07]), frappe: { decal: 0.6, halo: 0.6 }, choc: 0.4 },
    chant: { t: "steel", motif: [0, 2, 4, 5, 7, 9], pas: 0.13, dur: 1.1 },
    grave: { sons: [["steel", 4]], frappe: { halo: 1, decal: 0.3 } } },
  // des etapes : chaque vers est une ligne numerotee, qui descend
  { cle: "modeEmploi", nom: "Le mode d'emploi", forme: "plume", grand: "liste", partout: "liste", taille: 0.95, cadence: 0.6, numeros: true, ne: 0.6, encre: 0.5,
    son: { t: "vibraphone", motif: [0, 1, 2, 3, 4, 5, 6, 7], dur: 1.2, force: 0.75 },
    eclat: { style: "domino", sons: [7, 6, 5, 4, 3, 2, 1, 0].map((d, k) => ["vibraphone", d, k * 0.06]), frappe: { ondes: 0.5 }, choc: 0.2 },
    chant: { t: "celesta", motif: [0, 1, 2, 3, 4, 5, 6, 7], pas: 0.18, dur: 1.2 },
    grave: { sons: [["vibraphone", 0], ["vibraphone", 4]], frappe: { halo: 1, flash: 0.3 } } },
  // a plat : de petites lignes droites, sans eclat ; son eclater ne fait que glisser
  { cle: "voisine", nom: "La voisine", forme: "plume", grand: "ligne", partout: "bloc", taille: 0.82, cadence: 0.7, ne: 0, lueur: 0, encre: 0.3,
    son: { t: "rhodes", motif: [0, -1, 0, 1], dur: 1.4, force: 0.6 },
    eclat: { style: "glisse", sons: [["rhodes", -2, 0]], frappe: {}, choc: 0 },
    chant: { t: "rhodes", motif: [0, -1], pas: 0.4, dur: 1.2, special: "haussement" },
    grave: { sons: [["rhodes", 0]], frappe: { halo: 0.4 } } },
  // le parti pris des choses : les mots font le tour d'un objet, que le graver grave
  { cle: "chosiste", nom: "Le chosiste", forme: "objet", grand: "cercle", partout: "cercle", vie: 1.6, cadence: 0.7, encre: 0.8,
    son: { t: "tubulaire", motif: [0, 4], reg: -1, dur: 2.5, force: 0.8, rythme: 1.2 },
    eclat: { style: "cassure", sons: [["tubulaire", -7, 0], ["tubulaire", 0, 0.3]], frappe: { fonte: 0.4, halo: 0.4 }, choc: 0.5 },
    chant: { t: "tubulaire", motif: [0, 4, 7], pas: 0.05, dur: 2.8, special: "resonance" },
    grave: { sons: [["tubulaire", -7], ["tubulaire", 0]], frappe: { fonte: 0.25, halo: 1.4, flash: 0.4 } } },
  // les inventaires : les mots en colonne, qui deborde ; un celesta qui compte
  { cle: "inventoriste", nom: "L'inventoriste", forme: "colonne", grand: "colonnes", partout: "colonnes", taille: 0.9, vie: 1.4, cadence: 0.55, encre: 0.4,
    son: { t: "celesta", motif: [0, 0, 0, -1], dur: 1, force: 0.7 },
    eclat: { style: "effondre", sons: [7, 6, 5, 4, 3, 2].map((d, k) => ["celesta", d, k * 0.08]), frappe: { fonte: 0.7 }, choc: 0.3 },
    chant: { t: "glock", motif: [7, 6, 5, 4, 3, 2, 1, 0], pas: 0.16, dur: 1, special: "lecture" },
    grave: { sons: [["celesta", 0], ["celesta", 7]], frappe: { halo: 1, flash: 0.3 } } },
];
// les cles de reglage : « mainJouableLyrique », « mainJouableModeEmploi »...
const cleJouable = p => "mainJouable" + p.cle.charAt(0).toUpperCase() + p.cle.slice(1);
function persosJouables() {
  const l = PERSOS.filter(p => S[cleJouable(p)] !== false);
  return l.length ? l : PERSOS;
}
// la couleur d'un poete pour sa main et ses mots : sa teinte, lisible sur la palette du moment
function couleurPerso(p) {
  const h = teinteDe(p.nom) || 0, P = palette();
  return P.clair ? hsl(h, 70, 32) : hsl(h, 82, 68);
}
// les vers d'un poete dans le recueil (et le poeme infini), une strophe par entree, les plus recents
// d'abord ; refaits quand le recueil change
const banques = { cle: "", par: new Map() };
function banqueDe(nom) {
  const cle = D.recueil.length + "|" + D.flux.length + "|" + (D.recueil[D.recueil.length - 1] || {}).id;
  if (banques.cle !== cle) { banques.cle = cle; banques.par = new Map(); }
  let b = banques.par.get(nom);
  if (b) return b;
  b = [];
  for (const liste of [D.recueil, D.flux]) for (let i = liste.length - 1; i >= 0 && b.length < 400; i--)
    for (const s of liste[i].strophes || []) if (s.poete === nom) {
      const v = (s.vers || []).filter(x => !x.herite && x.texte && x.texte !== "…").map(x => x.texte.trim()).filter(Boolean);
      if (v.length) b.push(v);
    }
  banques.par.set(nom, b);
  return b;
}
function hacherTexte(s) { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 1000003; return h; }
// les montants du caissier, toujours les memes pour le meme vers
function montantDe(v) {
  const h = hacherTexte(v), k = h % 10;
  if (k < 6) return ((h % 9000) / 100 + 0.4).toFixed(2).replace(".", ",") + " €";
  if (k < 9) return String(7 + h % 14).padStart(2, "0") + " h " + String((h >> 3) % 60).padStart(2, "0");
  return "× " + (2 + h % 7);
}
function casser(t, casse) {
  if (casse === "maj") return t.toLocaleUpperCase("fr-FR");
  if (casse === "nom") return t.length > 2 ? t.charAt(0).toLocaleUpperCase("fr-FR") + t.slice(1) : t;
  return t;
}

/* ---------------------------------------------------- la disposition des touches */

// Une seule pour tous (Jiiji : « tout le monde aura le meme type sur chaque touche »). Trois couches :
// seule, L1 tenu (en grand : plus grand, plus long, plus loin), R1 tenu (partout : sur tout l'ecran).
// C'est aussi le tableau de l'onglet Manette.
const DISPOSITION = [
  ["stick gauche", "la main bouge", "elle file", "elle vise, lentement"],
  ["stick droit", "↕ loupe · ↔ tourbillon (ils restent où on les laisse)", "↕ la zone grandit · ↔ tourbillon fort", "↕ ↔ le vent sur ses mots"],
  ["✕", "tenu : écrire sur son chemin", "un vers entier, en grand", "une strophe sur tout l'écran"],
  ["○", "éclater autour de la main", "éclater fort, loin", "tout éclate"],
  ["□", "graver autour (encore : dégraver)", "ses mots restent, l'image laisse son empreinte", "tout graver (encore : tout libérer)"],
  ["△", "le mot le plus proche chante", "une phrase : les mots proches chantent l'un après l'autre", "le chœur : tous les mots"],
  ["L2", "souffler les mots (le son s'assombrit)", "souffler fort", "tout l'écran s'envole"],
  ["R2", "attirer les mots (le son s'éclaire)", "attirer fort", "tout tourne autour de la main"],
  ["croix ↑ ↓", "taille de ses mots", "", ""],
  ["croix ← →", "plus grave / plus aigu", "", ""],
  ["L3 (pousser)", "la main part seule et écrit (encore : elle s'arrête)", "", ""],
  ["R3 (pousser)", "l'image se redresse sous la main", "", ""],
  ["pavé tactile", "poète suivant (en fondu, la manette vibre)", "", ""],
  ["Share", "poète précédent", "", ""],
  ["Options", "la main revient au centre, ses gestes à zéro", "", ""],
  ["PS", "pilote automatique (pour tout l'écran)", "", ""],
];

/* ---------------------------------------------------- un joueur */

let joueurNumero = 0;
class Joueur {
  constructor(pad, cle, rang) {
    this.id = ++joueurNumero; this.cle = cle; this.rang = rang; this.pad = pad; this.nom = pad.id;
    this.x = W / 2 + (rang - 2.5) * W * 0.12; this.y = H / 2; this.vx = 0; this.vy = 0;
    this.avant = []; this.debut = {}; this.presence = 0; this.part = false; this.active = performance.now();
    this.loupe = 0; this.tourbillon = 0; this.rayon = 1; this.ventX = 0; this.ventY = 0; this.spin = 0; this.choc = 0;
    this.souffle = 0; this.aimant = 0; this.couche = 0; this.croixCouche = -1; this.marche = false; this.redresse = false;
    this.tailleSel = 1; this.registre = 0; this.file = []; this.versN = 0; this.compte = 0;
    this.parcours = 0; this.attente = 0; this.spirale = 0; this.dernierW = 0; this.trace = []; this.traceCoupee = true;
    this.plume = null; this.objet = null; this.col = null; this.derniereVibration = 0; this.fondu = 1; this.ancienne = null;
    this.perso = persoDepart(rang);
    this.sonFiltre = 0; this.sonEcho = 0;
  }
  get p() { return this.perso; }
  couleur() { return couleurPerso(this.perso); }
  taille() { return main.taille() * this.tailleSel * (this.perso.taille || 1); }
  vibrer(force, duree) {
    const p = this.pad, now = performance.now();
    if (!S.vibration || !p || !p.vibrationActuator || now - this.derniereVibration < 110) return;
    const k = clamp(force * (S.mainVibre === undefined ? 0.6 : S.mainVibre) * 1.6, 0, 1);
    if (k < 0.02) return;
    this.derniereVibration = now;
    try { p.vibrationActuator.playEffect("dual-rumble", { duration: duree || 70, strongMagnitude: k, weakMagnitude: clamp(k * 0.8, 0, 1) }).catch(() => {}); } catch (e) { /* pas de vibreur */ }
  }
  // changer de poete : en fondu (le cercle passe d'une couleur a l'autre), la manette vibre doucement.
  // Rien ne s'ecrit : on le reconnait a sa facon, a sa couleur, a son timbre
  changerPerso(p) {
    if (!p || p === this.perso) return;
    this.ancienne = this.couleur(); this.fondu = 0;
    this.perso = p; this.file = []; this.plume = this.objet = this.col = null; this.spirale = 0;
    this.active = performance.now();
    main.anneau(this.x, this.y, 0.45, this.couleur());
    this.vibrer(0.3, 160);
    if (sonPret()) { const n = son.gamme().length; son.voix(p.son.t, son.ctx.currentTime + 0.02, son.frequence(Math.round(n * (1.2 + (p.son.reg || 0)))), 1, 0.7, this.pan(), "", { poete: p.nom }); }
  }
  persoVoisin(sens) {
    const J = persosJouables();
    let i = J.indexOf(this.perso);
    if (i < 0) i = sens > 0 ? -1 : 0;
    this.changerPerso(J[(i + sens + J.length) % J.length]);
  }
  pan() { return clamp(this.x / Math.max(1, W) * 2 - 1, -1, 1) * son.v("sonLargeur"); }

  /* -- les mots a ecrire : ses vers a lui, une strophe apres l'autre */
  remplir() {
    const p = this.perso, b = banqueDe(p.nom);
    let strophe;
    if (b.length) strophe = b[Math.floor(Math.pow(Math.random(), 1.6) * b.length)];  // les recents plus souvent
    else if (poemeCourant) strophe = versDe(poemeCourant).map(v => v.texte);
    else strophe = ["…"];
    strophe.forEach((v, k) => {
      const vk = this.versN++, mots = v.split(/\s+/).filter(Boolean).map(t => casser(t, p.casse));
      if (!mots.length) return;
      if (p.numeros) this.file.push({ t: (k + 1) + ".", numero: true, vers: vk, debut: true, poete: p.nom });
      mots.forEach((t, i) => this.file.push({ t, vers: vk, debut: i === 0 && !p.numeros, poete: p.nom }));
      // le malaxeur : le vers revient, un mot change (pris dans un autre de ses vers)
      if (p.malaxe && mots.length > 2) {
        const vk2 = this.versN++, r = Math.floor(Math.random() * mots.length), ailleurs = b.length ? tirer(tirer(b)).split(/\s+/).filter(Boolean) : [];
        const autre = ailleurs.length ? casser(tirer(ailleurs), p.casse) : mots[(r + 1) % mots.length];
        mots.forEach((t, i) => this.file.push({ t: i === r ? autre : t, vers: vk2, debut: i === 0, poete: p.nom }));
      }
      if (p.chiffres) this.file.push({ t: montantDe(v), chiffre: true, vers: vk, poete: p.nom });
    });
    if (!this.file.length) this.file.push({ t: "…", vers: this.versN++, poete: p.nom });
  }
  peek() { if (!this.file.length) this.remplir(); return this.file[0]; }
  prochain() { if (!this.file.length) this.remplir(); return this.file.shift(); }
  // les mots d'un vers (ou de n vers), pour les gestes en grand
  versEntiers(n, max) {
    const out = [];
    let v = null, k = 0;
    while (out.length < max) {
      const e = this.peek();
      if (v !== null && e.vers !== v) { if (++k >= n) break; }
      v = e.vers; out.push(this.prochain());
    }
    return out;
  }

  /* -- poser un mot dans le monde partage */
  poser(e, x, y, ang, T, retard, plus) {
    const p = this.perso, pol = police(T);
    const m = { t: e.t, poete: p.nom, joueur: this.id, ordre: main.ordre++, x, y, ang, taille: T, pol, fs: tailleDePolice(pol), w: mesurer(e.t, pol),
      age: -(retard || 0), vie: S.mainVie * (p.vie || 1), vx: 0, vy: 0, va: 0, chante: 0, lueur: p.lueur === undefined ? 0.8 : p.lueur,
      ne: p.ne === undefined ? 1 : p.ne, couleur: this.couleur() };
    if (p.defile) m.derive = [Math.sign(this.vx || (this.x < W / 2 ? 1 : -1)) * 60, 0];
    if (plus) Object.assign(m, plus);
    main.ajouter(m);
    return m;
  }
  // une note d'un mot : sa hauteur vient de sa place (en haut : aigu), plus le motif du poete
  noteMot(e, x, y, force, retard) {
    if (!S.mainNotes || !sonPret()) return;
    const p = this.perso, s = p.son, n = son.gamme().length;
    // pas plus de notes que l'oreille n'en suit : quatre mains qui ecrivent demandaient 27 notes par
    // seconde, l'ordonnanceur en jouait 3 et noyait les autres dans la texture (mesure du 2026-10-19).
    // Chaque poete a son debit (rythme : notes par seconde au plus), et toutes les mains ensemble 6
    const now = performance.now() / 1000;
    if (now < (this.noteLibre || 0)) return;
    const k = this.compte++;
    if (s.chaque && k % s.chaque) return;
    if (!manette.jeton(now)) return;
    this.noteLibre = now + 1 / (s.rythme || 2.2);
    let deg = Math.round((1 - y / Math.max(1, H)) * n * 1.4) - 1 + s.motif[k % s.motif.length] + ((s.reg || 0) + this.registre) * n;
    let tb = s.t;
    // la caisse accordee : un montant sonne la tonique, une octave plus haut
    if (e.chiffre && s.chiffre) { tb = s.chiffre; deg = Math.round(deg / n) * n + n; }
    son.voix(tb, son.ctx.currentTime + 0.01 + (retard || 0), son.frequence(deg), s.dur * son.v("sonTenue"), force * s.force,
      clamp(x / Math.max(1, W) * 2 - 1, -1, 1) * son.v("sonLargeur"), e.t, { poete: p.nom });
  }
  // une suite de notes [timbre, degre, retard, force, duree] a partir de la hauteur de la main
  jouer(notes, force) {
    if (!sonPret()) return;
    const n = son.gamme().length, base = Math.round((1 - this.y / Math.max(1, H)) * n * 1.2) + ((this.perso.son.reg || 0) + this.registre) * n;
    const t = son.ctx.currentTime + 0.02;
    for (const [tb, d, r, f, du] of notes) son.voix(tb, t + (r || 0), son.frequence(base + d), du || son.DUREES[tb] || 1.2, (f || 0.9) * (force || 1), this.pan(), "", { poete: this.perso.nom });
  }
  direction() {
    let a = Math.atan2(this.vy, this.vx);
    if (a > Math.PI / 2) a -= Math.PI; else if (a < -Math.PI / 2) a += Math.PI;
    return a;
  }

  /* -- ✕ seule : un mot, a la facon du poete */
  ecrireUn() {
    const p = this.perso, e = this.prochain();
    if (!e) return;
    const T = this.taille() * (e.chiffre ? 0.92 : 1), pol = police(T), w = mesurer(e.t, pol);
    const vite = Math.hypot(this.vx, this.vy) > 40;
    let x = this.x, y = this.y, ang = 0, plus = null;
    const plume = () => {
      const esp = mesurer(" ", pol), lh = T * 1.45;
      let q = this.plume;
      const loinDeLaMain = q && Math.hypot(this.x - q.x, this.y - q.y) > T * 4;
      if (!q || (vite && loinDeLaMain)) q = this.plume = { x0: this.x - w / 2, x: this.x - w / 2, y: this.y, y0: this.y };
      else if ((e.debut || e.numero) && q.x > q.x0 + 1 && p.numeros) { q.x = q.x0; q.y += lh; }
      if (q.x + w > Math.min(W - 16, q.x0 + Math.max(W * 0.42, w * 2))) { q.x = q.x0; q.y += lh; }
      if (q.y > H - T) { q.y = Math.max(T, q.y0 - lh * 6); }
      x = q.x + w / 2; y = q.y; q.x += w + esp;
    };
    switch (p.forme) {
      case "plume": plume(); break;
      case "loin": {
        const a = hasard(0, Math.PI * 2), r = hasard(0.18, 0.4) * Math.min(W, H);
        x = clamp(this.x + Math.cos(a) * r, w / 2 + 10, W - w / 2 - 10); y = clamp(this.y + Math.sin(a) * r, T, H - T);
        plus = { depuis: [this.x, this.y] };
        break;
      }
      case "mot": {
        // un seul mot, la ou est la main ; s'il y en a deja un, juste en dessous
        for (const m of main.mots) if (m.joueur === this.id && Math.abs(m.x - x) < (m.w + w) / 2 && Math.abs(m.y - y) < T) { y += T * 1.5; }
        break;
      }
      case "grille": {
        const gx = T * 3.2, gy = T * 1.5;
        x = (Math.round(this.x / gx) + 0.5) * gx; y = (Math.round(this.y / gy) + 0.5) * gy;
        for (const m of main.mots) if (m.joueur === this.id && Math.abs(m.x - x) < 2 && Math.abs(m.y - y) < 2) { y += gy; break; }
        break;
      }
      case "objet": {
        // les mots font le tour d'un objet ; la main s'en va : un autre objet
        let o = this.objet;
        if (!o || Math.hypot(this.x - o.cx, this.y - o.cy) > o.r * 1.6 + T * 2 || o.n >= 16) o = this.objet = { cx: this.x, cy: this.y, r: T * 2.2, a: hasard(0, 6.28), n: 0, dw: 0 };
        o.a += (o.dw / 2 + w / 2 + mesurer(" ", pol)) / o.r;
        if (o.a > Math.PI * 2 + o.a0) o.r += T * 1.3;
        if (o.a0 === undefined) o.a0 = o.a;
        x = o.cx + Math.cos(o.a) * o.r; y = o.cy + Math.sin(o.a) * o.r;
        ang = ((o.a + Math.PI / 2) % Math.PI + Math.PI) % Math.PI - Math.PI / 2;
        o.dw = w; o.n++;
        break;
      }
      case "colonne": {
        let c = this.col;
        if (!c || Math.abs(this.x - (c.x0 + c.larg / 2)) > c.larg / 2 + T * 4 || c.y > H - T * 0.8) c = this.col = { x0: this.x - T, y: this.y, larg: w };
        x = c.x0 + w / 2; y = c.y; c.y += T * 1.3; c.larg = Math.max(c.larg, w);
        break;
      }
      default:  // le chemin
        if (vite) ang = this.direction();
        else if (p.plumeArret) plume();
        else {
          // immobile : en spirale autour d'elle
          this.spirale += 1;
          const r = this.spirale > 1 ? T * (0.9 + this.spirale * 0.35) : 0, a = this.spirale * 2.4;
          x += Math.cos(a) * r; y += Math.sin(a) * r; ang = hasard(-0.3, 0.3);
        }
    }
    if (p.tordu) ang += hasard(-p.tordu, p.tordu);
    this.nMots = (this.nMots || 0) + 1;
    if (p.onde) { const o = Math.sin(this.nMots * 0.8) * T * p.onde; x -= Math.sin(ang) * o; y += Math.cos(ang) * o; }
    if (vite) this.spirale = 0;
    x = clamp(x, 10, W - 10); y = clamp(y, T * 0.5, H - T * 0.5);
    this.poser(e, x, y, ang, T, 0, Object.assign(p.fantome ? { chante: 0.35 } : {}, plus));
    // le sonore : chaque mot laisse un echo de lui-meme, plus petit, qui part un peu apres
    if (p.fantome) this.poser(e, x + T * 0.2, y - T * 0.65, ang, T * 0.68, 0.2, { fantome: 0.45, vie: S.mainVie * 0.5, ne: 0.3 });
    main.anneau(x, y, 0.22, this.couleur());
    this.dernierW = w; this.parcours = 0; this.attente = 0;
    this.noteMot(e, x, y, 1);
    this.vibrer(0.05);
  }

  /* -- les dispositions des gestes en grand (L1) et partout (R1) */
  disposer(lay, mots, cadre, T) {
    const out = [], pol = police(T), esp = mesurer(" ", pol), lh = T * 1.45, ws = mots.map(e => mesurer(e.t, pol));
    const larg = li => li.reduce((s, i, k) => s + ws[i] + (k ? esp : 0), 0);
    // en lignes qui tiennent dans le cadre (parVers : un vers par ligne ; un montant reste sur sa ligne)
    const lignes = parVers => {
      const L = []; let cur = [], lw = 0, v = null;
      mots.forEach((e, i) => {
        const neuf = parVers && v !== null && e.vers !== v && !e.chiffre;
        if (cur.length && (neuf || (!e.chiffre && lw + esp + ws[i] > cadre.w))) { L.push(cur); cur = []; lw = 0; }
        cur.push(i); lw += (cur.length > 1 ? esp : 0) + ws[i];
        if (!e.chiffre) v = e.vers;
      });
      if (cur.length) L.push(cur);
      return L;
    };
    const enLignes = (L, centre) => {
      const y0 = cadre.cy - (L.length - 1) * lh / 2;
      L.forEach((li, k) => {
        let x = centre ? cadre.cx - larg(li) / 2 : cadre.cx - cadre.w / 2;
        for (const i of li) {
          // le ticket : le montant au bout de la ligne, a droite
          const xi = mots[i].chiffre && lay === "ticket" ? cadre.cx + cadre.w / 2 - ws[i] / 2 : x + ws[i] / 2;
          out.push({ e: mots[i], x: xi, y: y0 + k * lh, ang: 0 });
          x += ws[i] + esp;
        }
      });
    };
    switch (lay) {
      case "ligne": {
        const total = ws.reduce((a, b) => a + b, 0) + esp * (mots.length - 1);
        if (total > cadre.w) { enLignes(lignes(true), true); break; }
        const a = cadre.ang || 0, cs = Math.cos(a), sn = Math.sin(a);
        let acc = -total / 2;
        mots.forEach((e, i) => { const c = acc + ws[i] / 2; out.push({ e, x: cadre.cx + cs * c, y: cadre.cy + sn * c, ang: a }); acc += ws[i] + esp; });
        break;
      }
      case "lignes": enLignes(lignes(true), true); break;
      case "liste": case "ticket": enLignes(lignes(true), false); break;
      case "bloc": enLignes(lignes(false), false); break;
      case "grille": {
        const cel = Math.max(...ws) + esp * 2, n = Math.max(1, Math.floor(cadre.w / cel)), rangs = Math.ceil(mots.length / n);
        mots.forEach((e, i) => out.push({ e, x: cadre.cx - (n - 1) * cel / 2 + (i % n) * cel, y: cadre.cy - (rangs - 1) * lh / 2 + Math.floor(i / n) * lh, ang: 0 }));
        break;
      }
      case "eparpille":
        mots.forEach((e, i) => out.push({ e, x: cadre.cx + hasard(-0.5, 0.5) * (cadre.w - ws[i]), y: cadre.cy + hasard(-0.5, 0.5) * (cadre.h - T), ang: hasard(-0.7, 0.7) }));
        break;
      case "cercle": {
        const total = ws.reduce((a, b) => a + b + esp, 0);
        let r = Math.max(T * 2, Math.min(total / (Math.PI * 2), Math.min(cadre.w, cadre.h) * 0.42)), a = hasard(0, 6.28), a0 = a, dw = 0;
        mots.forEach((e, i) => {
          a += (dw / 2 + ws[i] / 2 + esp) / r;
          if (a > a0 + Math.PI * 2) { a0 = a; r += lh; }
          out.push({ e, x: cadre.cx + Math.cos(a) * r, y: cadre.cy + Math.sin(a) * r, ang: ((a + Math.PI / 2) % Math.PI + Math.PI) % Math.PI - Math.PI / 2 });
          dw = ws[i];
        });
        break;
      }
      case "colonnes": {
        let x0 = cadre.cx - cadre.w / 2, y = cadre.cy - cadre.h / 2 + T, cl = 0;
        const n = Math.max(1, Math.floor((cadre.h - T) / (T * 1.3)));
        // une seule colonne quand elle tient (le geste en grand), sinon de gauche a droite
        if (mots.length <= n && cadre.w < W * 0.9) { x0 = cadre.cx - Math.max(...ws) / 2; y = cadre.cy - (mots.length - 1) * T * 0.65; }
        mots.forEach((e, i) => {
          if (y > cadre.cy + cadre.h / 2 - T * 0.5) { x0 += cl + T * 1.6; y = cadre.cy - cadre.h / 2 + T; cl = 0; }
          out.push({ e, x: x0 + ws[i] / 2, y, ang: 0 }); y += T * 1.3; cl = Math.max(cl, ws[i]);
        });
        break;
      }
      case "mot": {
        // les mots les plus rares (la Bourse), tres grands
        const rares = mots.map((e, i) => [i, coursDe(e.t) || 0]).filter(([i]) => mots[i].t.length > 2).sort((a, b) => b[1] - a[1]);
        const n = cadre.w > W * 0.8 ? 3 : 1, places = n === 1 ? [[cadre.cx, cadre.cy]] : [[W * 0.27, H * 0.33], [W * 0.62, H * 0.52], [W * 0.38, H * 0.74]];
        rares.slice(0, n).forEach(([i], k) => out.push({ e: mots[i], x: places[k][0] + hasard(-30, 30), y: places[k][1] + hasard(-20, 20), ang: 0, echelle: n === 1 ? 2.2 : 2.6 }));
        break;
      }
    }
    if (!out.length && mots.length) out.push({ e: mots[0], x: cadre.cx, y: cadre.cy, ang: 0, echelle: 2 });
    // rien ne sort de l'image
    for (const o of out) { o.x = clamp(o.x, 12, W - 12); o.y = clamp(o.y, T * 0.6, H - T * 0.6); }
    return out;
  }
  ecrireGrand(partout) {
    const p = this.perso;
    const T = this.taille() * (partout ? 1.1 : 1.6), mots = partout ? this.versEntiers(4, 48) : this.versEntiers(p.grandVers || 1, 18);
    const cadre = partout ? { cx: W / 2, cy: H / 2, w: W * 0.86, h: H * 0.8 }
      : { cx: clamp(this.x, W * 0.2, W * 0.8), cy: clamp(this.y, H * 0.15, H * 0.85), w: W * 0.62, h: H * 0.45, ang: Math.hypot(this.vx, this.vy) > 40 ? this.direction() : 0 };
    const places = this.disposer(partout ? p.partout : p.grand, mots, cadre, T);
    let notes = 0;
    places.forEach((o, k) => {
      const tt = T * (o.echelle || 1), retard = k * (partout ? 0.04 : 0.07);
      const ang = o.ang + (p.tordu ? hasard(-p.tordu, p.tordu) * 0.6 : 0);
      this.poser(o.e, o.x, o.y, ang, tt, retard, { ne: (p.ne === undefined ? 1 : p.ne) * 0.5, vie: S.mainVie * (p.vie || 1) * (partout ? 1.3 : 1.6) });
      if (k % (partout ? 4 : 2) === 0 && notes++ < 8) this.noteMot(o.e, o.x, o.y, 0.8, retard);
    });
    this.dernierW = 0;
    main.frapper({ halo: partout ? 0.9 : 0.6, flash: partout ? 0.3 : 0.15 });
    main.anneau(this.x, this.y, partout ? 1.3 : 0.8, this.couleur());
    this.vibrer(partout ? 0.5 : 0.35);
  }

  /* -- ○ eclater */
  eclater(couche) {
    const p = this.perso, E = p.eclat, T = this.taille();
    const R = couche === 2 ? 1e9 : Math.max(170, T * 5) * (couche === 1 ? 2.6 : 1), force = [1, 1.6, 2.2][couche];
    let cibles = main.mots.filter(m => m.age >= 0 && Math.hypot(m.x - this.x, m.y - this.y) <= R);
    // le minimaliste : un seul mot se fend (en grand : trois ; partout : tous)
    if (E.seul && couche < 2) cibles = cibles.sort((a, b) => Math.hypot(a.x - this.x, a.y - this.y) - Math.hypot(b.x - this.x, b.y - this.y)).slice(0, couche ? 3 : 1);
    const sp = (a, b) => hasard(a, b) * (0.7 + 0.3 * force);
    let rang = 0;
    for (const m of cibles) {
      if (E.style === "glisse") { m.fige = false; m.tombe = 0.14; m.va += hasard(-0.4, 0.4); m.vie = Math.min(m.vie, m.age + 3); continue; }
      const cs = Math.cos(m.ang), sn = Math.sin(m.ang), lettres = [...m.t];
      let acc = -m.w / 2;
      const coul = m.couleur || couleurDe(m);
      lettres.forEach((c, li) => {
        const lw = mesurer(c, m.pol), lx = m.x + cs * (acc + lw / 2), ly = m.y + sn * (acc + lw / 2);
        acc += lw;
        if (c === " ") return;
        const loin = Math.atan2(ly - this.y, lx - this.x);
        const e = { t: c, x: lx, y: ly, vx: 0, vy: 0, ang: m.ang, va: hasard(-7, 7), taille: m.taille, couleur: coul, poete: m.poete, ordre: m.ordre, age: 0, g: 70, frein: 1.2, vie: 3 };
        let dir = loin + hasard(-0.5, 0.5), v = sp(240, 900);
        switch (E.style) {
          case "petales": dir = -Math.PI / 2 + hasard(-1.2, 1.2); v = sp(60, 180); e.g = -25; e.va = hasard(-1.5, 1.5); e.vie = 3.6; e.frein = 0.6; break;
          case "fente": dir = li < lettres.length / 2 ? Math.PI + hasard(-0.3, 0.3) : hasard(-0.3, 0.3); dir += m.ang; v = sp(30, 80); e.g = 0; e.va = hasard(-0.6, 0.6); e.frein = 0.5; e.vie = 3.2; break;
          case "permute": dir = hasard(0, 6.28); v = sp(600, 1300); e.g = 0; e.frein = 2.4; e.vie = 3.4; break;
          case "rebond": v = sp(160, 360); e.g = 650; e.sol = ly + hasard(20, 70); e.va = 0; break;
          case "chute": dir = Math.PI / 2; v = sp(0, 60); e.vx = hasard(-25, 25); e.g = 1400; e.va = hasard(-1, 1); break;
          case "foule": v = sp(300, 1100); break;
          case "exorcisme": dir = loin + Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1) * 0.8; v = sp(400, 950); e.va = hasard(-12, 12); break;
          case "orbite": e.orbite = { x: this.x, y: this.y, w: (Math.random() < 0.5 ? 1 : -1) * hasard(1.6, 2.8), fin: hasard(1.6, 2.4) }; v = 0; e.g = 0; e.frein = 0; e.vie = 3.4; break;
          case "pieces": dir = -Math.PI / 2 + hasard(-0.6, 0.6); v = sp(220, 460); e.g = 1150; e.va = hasard(-14, 14); break;
          case "confettis": dir = -Math.PI / 2 + hasard(-1, 1); v = sp(300, 720); e.g = 260; e.couleur = hsl(((teinteDe(m.poete) || 0) + hasard(-50, 50) + 360) % 360, 80, palette().clair ? 38 : 66); break;
          case "domino": dir = m.ang + (this.x < m.x ? 0 : Math.PI) + hasard(-0.2, 0.2); v = sp(220, 360); e.g = 500; e.age = -rang * 0.025 - li * 0.012; e.va = hasard(-3, 3); break;
          case "cassure": dir = (li < lettres.length / 2 ? Math.PI + 0.5 : -0.5) + m.ang + hasard(-0.25, 0.25); v = sp(120, 260); e.g = 300; e.va = hasard(-2, 2); break;
          case "effondre": dir = Math.PI / 2; v = 0; e.vx = hasard(-20, 20); e.g = 900; e.age = -clamp(m.y / Math.max(1, H), 0, 1) * 0.6 - li * 0.01; break;
        }
        if (!e.orbite) { e.vx += Math.cos(dir) * v; e.vy += Math.sin(dir) * v; }
        main.eclats.push(e);
      });
      main.retirer(m);
      rang++;
    }
    if (main.eclats.length > 900) main.eclats.splice(0, main.eclats.length - 900);
    const q = {};
    for (const k in E.frappe) q[k] = E.frappe[k] * Math.min(force, 1.8);
    main.frapper(q);
    this.choc = Math.min(1.2, this.choc + (E.choc || 0) * force);
    if (E.spin) this.spin = clamp(this.spin + E.spin * force * (Math.random() < 0.5 ? 1 : -1), -2.5, 2.5);
    const P = palette();
    for (const [f, r] of [[1, 0], [0.7, 0.12], [0.45, 0.26]]) main.anneaux.push({ x: this.x, y: this.y, age: -r, force: f * Math.min(1.5, 0.6 + 0.4 * force), couleur: this.couleur() || P.accent });
    this.jouer(E.sons, Math.min(1.3, 0.8 + 0.2 * force));
    this.vibrer(0.4 + 0.25 * couche, 90 + couche * 40);
  }

  /* -- □ graver */
  graver(couche) {
    const p = this.perso, G = p.grave, R = Math.max(170, this.taille() * 5);
    const cibles = couche === 2 ? main.mots : couche === 1 ? main.mots.filter(m => m.joueur === this.id) : main.mots.filter(m => Math.hypot(m.x - this.x, m.y - this.y) <= R);
    const tous = cibles.length > 0 && cibles.every(m => m.fige);
    for (const m of cibles) { m.fige = !tous; if (!tous) m.lueur = Math.max(m.lueur, 0.7); }
    // l'image entiere laisse son empreinte, qui s'efface lentement par-dessus la suite
    if (couche >= 1 && !tous) photographier();
    if (!tous) {
      main.frapper(G.frappe);
      if (G.choc) this.choc = Math.min(1.2, this.choc + G.choc);
      main.anneau(this.x, this.y, couche ? 1.3 : 0.9, this.couleur());
    }
    this.jouer(G.sons.map(([tb, d], k) => [tb, tous ? d - 2 : d, k * 0.12, 0.85]));
    this.vibrer(0.35);
  }

  /* -- △ chanter */
  chanter(couche) {
    const p = this.perso, C = p.chant, n = sonPret() ? son.gamme().length : 7;
    const R = 380 * (couche === 1 ? 2.6 : 1);
    const pres = main.mots.filter(m => m.age >= 0 && !m.fantome).map(m => [m, Math.hypot(m.x - this.x, m.y - this.y)]).filter(([, d]) => couche === 2 || d < R).sort((a, b) => a[1] - b[1]);
    let liste = pres.map(([m]) => m);
    if (couche === 0) liste = liste.slice(0, 1);
    else if (couche === 1) liste = liste.slice(0, C.special === "haussement" ? 2 : 8);
    else liste = liste.sort(() => Math.random() - 0.5).slice(0, 40);
    // le chosiste fait resonner tout son objet ; l'inventoriste lit sa colonne de haut en bas
    if (C.special === "resonance" && couche === 1) liste = main.mots.filter(m => m.joueur === this.id && m.age >= 0).slice(-16);
    if (C.special === "lecture" || couche === 1) liste.sort((a, b) => C.special === "lecture" ? a.y - b.y : a.x - b.x);
    // la hauteur d'un mot (en haut : aigu), comptee depuis celle de la main (jouer part de la main)
    const hv = Math.round((1 - this.y / Math.max(1, H)) * n * 1.2), tVoix = m => Math.round((1 - m.y / Math.max(1, H)) * n * 1.2) - hv;
    const notes = [];
    if (!liste.length) {
      // personne autour : la main chante le mot qu'elle allait ecrire
      notes.push([C.t, C.motif[0], 0, 1, C.dur]);
    } else if (couche < 2) {
      liste.forEach((m, k) => {
        m.chante = 1; m.lueur = 1;
        main.anneaux.push({ x: m.x, y: m.y, age: -k * C.pas, force: 0.5, couleur: m.couleur || couleurDe(m) });
        if (k < 8) notes.push([C.t, C.motif[k % C.motif.length] + tVoix(m), k * C.pas, 1, C.dur]);
      });
    } else {
      for (const m of liste) { m.chante = 1; m.lueur = 1; }
      const accord = C.peu ? [0, 4, 7] : C.special === "haussement" ? [0, -1] : [0, 2, 4, 7, 9];
      accord.forEach((d, k) => { notes.push([C.t, d, k * 0.06, 0.8, C.dur]); const m = liste[k]; if (m) main.anneaux.push({ x: m.x, y: m.y, age: -k * 0.1, force: 0.6, couleur: m.couleur || couleurDe(m) }); });
    }
    // le sonore begaie : chaque note repart aussitot ; la caisse finit sur la tonique, en haut
    if (C.special === "begaie") for (const x of notes.slice()) notes.push([x[0], x[1], x[2] + 0.09, 0.6, x[4]]);
    if (C.special === "caisse") notes.push(["glock", n * 2 - hv, (notes.length ? notes[notes.length - 1][2] : 0) + 0.2, 1]);
    if (C.special === "cri") { main.frapper({ ondes: 1.6 }); this.spin = clamp(this.spin + 0.7 * (couche + 1), -2.5, 2.5); }
    if (C.special === "echo" && liste[0]) {
      // le surrealiste : le mot chante, et son double parait ailleurs
      const m = liste[0], a = hasard(0, 6.28), r = hasard(0.2, 0.4) * Math.min(W, H);
      this.poser({ t: m.t }, clamp(m.x + Math.cos(a) * r, 40, W - 40), clamp(m.y + Math.sin(a) * r, 40, H - 40), hasard(-0.5, 0.5), m.taille, 0.3, { chante: 1, depuis: [m.x, m.y], vie: 6 });
    }
    main.frapper({ ondes: [0.8, 1.1, 1.6][couche], halo: couche === 2 ? 0.8 : 0.3 });
    this.jouer(notes, couche === 2 ? 0.85 : 1);
    this.vibrer(0.25);
  }

  /* -- les boutons */
  appui(b) {
    const B = BOUTONS;
    this.debut[b] = performance.now();
    switch (b) {
      case B.pave: return this.persoVoisin(1);
      case B.share: return this.persoVoisin(-1);
      case B.ps: return basculerPilote();
      case B.options: return this.remettre();
      case B.L3:
        this.marche = !this.marche;
        if (this.marche && Math.hypot(this.vx, this.vy) < 60) { const a = hasard(0, 6.28); this.vx = Math.cos(a) * 160; this.vy = Math.sin(a) * 160; }
        main.anneau(this.x, this.y, 0.35, this.couleur()); this.vibrer(0.2);
        return;
      case B.R3: this.redresse = true; main.anneau(this.x, this.y, 0.3, this.couleur()); this.vibrer(0.2); return;
      case B.croix:
        this.croixCouche = this.couche;
        if (this.couche === 0) this.ecrireUn(); else this.ecrireGrand(this.couche === 2);
        return;
      case B.rond: return this.eclater(this.couche);
      case B.carre: return this.graver(this.couche);
      case B.triangle: return this.chanter(this.couche);
      case B.haut: this.tailleSel = clamp(this.tailleSel * 1.25, 0.3, 4); this.vibrer(0.1); return;
      case B.bas: this.tailleSel = clamp(this.tailleSel / 1.25, 0.3, 4); this.vibrer(0.1); return;
      case B.gauche: case B.droite: {
        this.registre = clamp(this.registre + (b === B.droite ? 1 : -1), -2, 2);
        this.jouer([[this.perso.son.t, 0, 0, 0.8]]); this.vibrer(0.1);
        return;
      }
    }
  }
  // Options : la main revient au milieu, ses gestes a zero, ses mots s'effacent doucement
  remettre() {
    this.x = W / 2; this.y = H / 2; this.vx = this.vy = 0;
    this.loupe = this.tourbillon = this.ventX = this.ventY = this.spin = this.choc = 0; this.rayon = 1;
    this.tailleSel = 1; this.registre = 0; this.marche = false; this.redresse = false;
    this.plume = this.objet = this.col = null; this.trace = [];
    for (const m of main.mots) if (m.joueur === this.id) { m.fige = false; m.vie = Math.min(m.vie, Math.max(0, m.age) + 2.5); }
    main.anneau(this.x, this.y, 0.5, this.couleur());
    this.vibrer(0.25);
  }
  // R3 (et le mode sobre) : l'image se redresse en douceur
  redresser() { this.redresse = true; }

  /* -- chaque image */
  lire(lu, dt) {
    const B = BOUTONS, now = performance.now();
    if (!this.avant.length) this.avant = lu.b.map(b => b.pressed);  // un bouton tenu en arrivant ne compte pas
    let servi = false;
    lu.b.forEach((b, i) => {
      if (b.pressed && !this.avant[i]) { this.appui(i); servi = true; manette.dernierBouton = i; manette.dernierJoueur = this.rang; }
      if (b.pressed) manette.dernierUsage = now;
      this.avant[i] = b.pressed;
    });
    if (servi) { montrerAide(true); majManetteUI(); this.active = now; }
    // la couche : L1 ou R1 tenu (le dernier enfonce si les deux le sont)
    const l1 = lu.b[B.L1].pressed, r1 = lu.b[B.R1].pressed;
    this.couche = l1 && r1 ? ((this.debut[B.R1] || 0) > (this.debut[B.L1] || 0) ? 2 : 1) : l1 ? 1 : r1 ? 2 : 0;
    const ax = i => { const v = lu.a[i] || 0; return Math.abs(v) < 0.15 ? 0 : (v - Math.sign(v) * 0.15) / 0.85; };
    const sx = ax(0), sy = ax(1);
    if (sx || sy || ax(2) || ax(3)) { manette.dernierUsage = now; this.active = now; }
    // la vitesse suit le stick en puissance : on vise fin, on traverse vite (L1 : elle file ; R1 : elle vise)
    const v = 950 * S.mainSensibilite * [1, 2.2, 0.35][this.couche];
    if (this.marche && Math.hypot(sx, sy) > 0.3) this.marche = false;
    if (!this.marche) {
      this.vx = Math.sign(sx) * Math.pow(Math.abs(sx), 1.7) * v;
      this.vy = Math.sign(sy) * Math.pow(Math.abs(sy), 1.7) * v;
    }
    const x0 = this.x, y0 = this.y;
    this.x += this.vx * dt; this.y += this.vy * dt;
    // la main seule rebondit sur les bords
    if (this.marche) { if (this.x < 0 || this.x > W) this.vx *= -1; if (this.y < 0 || this.y > H) this.vy *= -1; }
    this.x = clamp(this.x, 0, W); this.y = clamp(this.y, 0, H);
    const pas = Math.hypot(this.x - x0, this.y - y0);
    // les gachettes : souffler et attirer (elles reviennent quand on les lache)
    this.souffle = lu.b[B.L2].value || 0; this.aimant = lu.b[B.R2].value || 0;
    this.forceCouche = this.couche;
    // le stick droit : loupe et tourbillon, qui restent ou on les laisse ; L1 : la zone et un tourbillon
    // fort ; R1 : le vent sur ses mots
    const tx = ax(2), ly = -ax(3), k = a => Math.sign(a) * Math.pow(Math.abs(a), 1.5) * dt;
    if (this.couche === 0) { this.tourbillon = clamp(this.tourbillon + k(tx) * 1.2, -1.5, 1.5); this.loupe = clamp(this.loupe + k(ly), -1.5, 1.5); }
    else if (this.couche === 1) { this.tourbillon = clamp(this.tourbillon + k(tx) * 3, -1.5, 1.5); this.rayon = clamp(this.rayon * Math.exp(k(ly) * 1.6), 0.5, 6); }
    else { this.ventX = clamp(this.ventX + k(tx) * 1.2, -1, 1); this.ventY = clamp(this.ventY + k(ly) * 1.2, -1, 1); }
    if (this.redresse) {
      const q = Math.exp(-dt * 4);
      this.tourbillon *= q; this.loupe *= q; this.ventX *= q; this.ventY *= q; this.rayon = 1 + (this.rayon - 1) * q;
      if (tx || ly) this.redresse = false;
      else if (Math.abs(this.tourbillon) + Math.abs(this.loupe) + Math.abs(this.ventX) + Math.abs(this.ventY) + Math.abs(this.rayon - 1) < 0.005) {
        this.redresse = false; this.tourbillon = this.loupe = this.ventX = this.ventY = 0; this.rayon = 1;
      }
    }
    // ✕ tenue (ou la main seule) : un mot chaque fois que la main a assez avance pour le poser a la
    // suite ; immobile, un mot de temps en temps
    const ecrit = (lu.b[B.croix].pressed && this.croixCouche === 0) || this.marche;
    if (!ecrit) { this.traceCoupee = true; this.croixCouche = lu.b[B.croix].pressed ? this.croixCouche : -1; }
    this.ecrit = ecrit;
    if (ecrit) {
      this.active = now;
      const p = this.perso, T = this.taille();
      if (pas > 0) {
        // la trainee d'encre, plus large quand la main va vite
        if (p.encre) {
          const der = this.trace[this.trace.length - 1];
          if (this.traceCoupee || !der || Math.hypot(this.x - der.x, this.y - der.y) > 5) {
            this.trace.push({ x: this.x, y: this.y, age: 0, l: T * 0.1 * p.encre * (0.5 + Math.min(1.5, pas / 10)), debut: this.traceCoupee });
            this.traceCoupee = false;
            if (this.trace.length > 600) this.trace.shift();
          }
        }
        this.parcours += pas; this.attente = 0;
        const e = this.peek(), w = mesurer(e.t, police(T));
        if (this.parcours >= ((this.dernierW + w) / 2 + T * 0.3) * (p.pas || 1)) this.ecrireUn();
      } else if ((this.attente += dt) > (p.cadence || 0.8)) this.ecrireUn();
    }
  }
  // l'image sous la main, pour la carte graphique
  loupeGpu() {
    const a = this.presence, loupe = (this.loupe * 0.9 + this.choc * 0.9) * a, tourb = (this.tourbillon + this.spin) * a;
    if (Math.abs(loupe) + Math.abs(tourb) < 0.01) return null;
    return { p: [this.x / Math.max(1, W), 1 - this.y / Math.max(1, H)], r: 0.22 * Math.max(0.5, S.mainTaille * this.tailleSel) * this.rayon, loupe, tourb };
  }
}
// le poete d'une manette qui arrive : celui du reglage de sa place (1 a 4), ou au hasard parmi ceux
// qu'on peut jouer, de preference un que personne ne tient
function persoDepart(rang) {
  const J = persosJouables(), v = S["mainPerso" + rang];
  const p = PERSOS.find(x => x.cle === v);
  if (p && J.includes(p)) return p;
  const libres = J.filter(x => !joueurs.some(j => !j.part && j.perso === x));
  return tirer(libres.length ? libres : J);
}

/* ---------------------------------------------------- les manettes */

// les mains a l'ecran, dans l'ordre d'arrivee. Une manette se reconnait a son index ET a son id :
// l'ordre de navigator.getGamepads peut changer, un index peut passer a une autre manette.
const joueurs = [];
const manette = {
  index: null, nom: "", derniereVibration: 0, dernierUsage: 0, dernierBouton: undefined, dernierJoueur: 0, pf: 1, pe: 0,
  souvenirs: new Map(),  // cle de la manette -> son poete (elle revient : elle le retrouve)
  actifs() { return joueurs.filter(j => !j.part); },
  maj(dt) {
    live.mod.flash *= Math.exp(-dt * 5);
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const vus = new Set();
    for (const pad of pads) {
      if (!pad || !pad.connected) continue;
      const cle = pad.index + "|" + pad.id;
      vus.add(cle);
      let j = joueurs.find(x => x.cle === cle);
      if (j && j.part) { j.part = false; j.avant = []; }  // revenue avant d'etre partie : elle reprend sa main
      if (!j) {
        if (this.actifs().length >= JOUEURS_MAX) continue;
        j = this.entrer(pad, cle);
      }
      j.pad = pad;
      j.lire(lirePad(pad), dt);
    }
    for (const j of joueurs) if (!j.part && !vus.has(j.cle)) this.partir(j);
    // les fondus : une main entre en 0,6 s, part en 1,2 s ; le poete change en 0,8 s
    for (let i = joueurs.length - 1; i >= 0; i--) {
      const j = joueurs[i];
      j.presence = j.part ? Math.max(0, j.presence - dt / 1.2) : Math.min(1, j.presence + dt / 0.6);
      j.fondu = Math.min(1, j.fondu + dt / 0.8);
      j.choc = Math.max(0, j.choc - dt * 1.8);
      j.spin *= Math.exp(-dt * 1.3); if (Math.abs(j.spin) < 0.003) j.spin = 0;
      if (j.part && j.presence <= 0) joueurs.splice(i, 1);
    }
    const a = this.actifs();
    this.index = a.length ? a[0].pad.index : null;
    this.nom = a.length ? a[0].nom : "";
    // le son suit les gachettes et le stick droit de toutes les mains : la gauche assombrit, la droite
    // eclaire (les gestes s'additionnent, bornes) ; le tourbillon lance l'echo (comme un dub)
    let somme = 0, e = 0, so = 0, ai = 0;
    for (const j of a) {
      somme += j.aimant * 1.6 - j.souffle * 2.2; e = Math.max(e, Math.min(0.8, Math.abs(j.tourbillon) * 0.85));
      so = Math.max(so, j.souffle); ai = Math.max(ai, j.aimant);
    }
    main.souffle = so; main.aimant = ai;
    this.pousserSon(Math.pow(2, clamp(somme, -3.5, 2.2)), e);
  },
  entrer(pad, cle) {
    const pris = new Set(this.actifs().map(j => j.rang));
    let rang = 1;
    while (pris.has(rang)) rang++;
    const j = new Joueur(pad, cle, rang);
    const souvenir = this.souvenirs.get(cle);
    if (souvenir && persosJouables().includes(souvenir) && !PERSOS.some(p => p.cle === S["mainPerso" + rang])) j.perso = souvenir;
    joueurs.push(j);
    // elle entre discretement : un anneau de sa couleur, pas de texte
    for (const [f, r] of [[0.9, 0], [0.55, 0.2]]) main.anneaux.push({ x: j.x, y: j.y, age: -r, force: f, couleur: j.couleur() });
    j.vibrer(0.3, 120);
    majManetteUI();
    return j;
  },
  partir(j) {
    j.part = true; j.souffle = j.aimant = 0; j.marche = false;
    this.souvenirs.set(j.cle, j.perso);
    majManetteUI();
  },
  // le debit des notes de toutes les mains ensemble : un seau de jetons, 6 par seconde
  jetons: 3, jetonT: 0,
  jeton(now) {
    this.jetons = Math.min(3, this.jetons + Math.max(0, now - this.jetonT) * 6); this.jetonT = now;
    if (this.jetons < 1) return false;
    this.jetons -= 1; return true;
  },
  pousserSon(f, e) {
    if (Math.abs(f - this.pf) < 0.02 && Math.abs(e - this.pe) < 0.02) return;
    this.pf = f; this.pe = e; son.pousser(f, e);
  },
  // le mode sobre : toutes les mains redressent l'image
  remettre() { for (const j of joueurs) j.redresser(); },
  // toutes les manettes (un temps fort de la musique, la Banque...)
  vibrer(force, prioritaire) { for (const j of this.actifs()) j.vibrer(force); },
};
const JOUEURS_MAX = 4;
// la manette peut se signaler avant que panneau.js soit charge
window.addEventListener("gamepadconnected", () => { if (typeof montrerAide === "function") montrerAide(true); });

/* ---------------------------------------------------- le monde partage : main */

// main est la facade de tout ce que les autres fichiers lisent ou posent (cv.js, modes.js, gpu.js) :
// les mots poses, les eclats, les anneaux, les coups donnes a la carte graphique, la loupe. Les mots
// de toutes les mains (et ceux des cables, et ceux de la voix) vivent ici ensemble.
const main = {
  mots: [], eclats: [], anneaux: [], ordre: 0, tailleSel: 1, souffle: 0, aimant: 0, choc: 0, pince: 0,
  poeme: null, file: [], i: 0,
  // ce que les gestes laissent sur l'image : des coups a la carte graphique (decalage des couleurs,
  // flash, ondes, fonte, teintes, halo) qui retombent seuls. Les coups de plusieurs mains
  // s'additionnent, plafonnes
  impact: { rvb: 0, flash: 0, ondes: 0, fonte: 0, decal: 0, halo: 0 },
  PLAFONDS: { rvb: 2.6, flash: 0.8, ondes: 2.2, fonte: 1, decal: 1, halo: 1.8 },
  frapper(quoi) { for (const k in quoi) if (quoi[k] > 0) this.impact[k] = Math.min(this.PLAFONDS[k] || 2, (this.impact[k] || 0) + quoi[k]); },
  anneau(x, y, force, couleur) { this.anneaux.push({ x, y, age: 0, force, couleur }); if (this.anneaux.length > 60) this.anneaux.shift(); },
  ajouter(m) { this.mots.push(m); if (this.mots.length > 480) this.mots.shift(); },
  retirer(m) { const i = this.mots.indexOf(m); if (i >= 0) this.mots.splice(i, 1); },
  // la taille de base des mots ecrits (chaque main la multiplie par la sienne)
  taille() { return 38 * S.mainTaille * Math.min(W, H) / 900; },
  // les mots du poeme a l'ecran, dans l'ordre (la voix du mode poesie les ecrit, modes.js)
  remplir() {
    this.poeme = poemeCourant; this.i = 0; this.file = [];
    if (!poemeCourant) return;
    versDe(poemeCourant).forEach((v, k) => { for (const t of v.texte.split(/\s+/)) if (t.trim()) this.file.push({ t, poete: v.poete, vers: k }); });
  },
  prochain() {
    if (!this.file.length || this.poeme !== poemeCourant) this.remplir();
    if (!this.file.length) return null;
    return this.file[this.i++ % this.file.length];
  },
  // un mot pose par un geste (retard : il attend son tour avant de paraitre)
  poserMot(e, x, y, ang, retard, echelle, plus) {
    const taille = this.taille() * (echelle || 1), pol = police(taille);
    const m = { t: e.t, poete: e.poete, ordre: this.ordre++, x, y, ang, taille, pol, fs: tailleDePolice(pol), w: mesurer(e.t, pol), age: -(retard || 0), vie: S.mainVie,
      vx: 0, vy: 0, va: 0, chante: 0, lueur: 0.8, ne: 1 };
    Object.assign(m, plus);
    this.ajouter(m);
    return m;
  },
  // une note pour un mot, comme avant (la hauteur vient de la place sur l'ecran, en haut : aigu)
  note(mot, poete, y, x, force, timbre, duree, retard) {
    if (!sonPret()) return;
    const n = son.gamme().length, deg = Math.round((1 - y / Math.max(1, H)) * n * 2.2) - 2;
    son.voix(timbre || son.timbreDe(poete), son.ctx.currentTime + 0.01 + (retard || 0), son.frequence(deg), (duree || 1.6) * son.v("sonTenue"), force,
      clamp(x / Math.max(1, W) * 2 - 1, -1, 1) * son.v("sonLargeur"), mot, { poete });
  },
  accord() {
    if (!sonPret()) return;
    const t = son.ctx.currentTime + 0.05;
    for (const k of [0, 2, 4]) son.voix("clochette", t + k * 0.05, son.frequence(k), 2.6, 0.8, (k - 2) / 3);
  },
  impactActif() {
    for (const k in this.impact) if (this.impact[k] > 0.01) return true;
    return this.enJeu() && (this.souffle > 0.02 || this.aimant > 0.02);
  },
  // au moins une main a l'ecran
  enJeu() { return joueurs.some(j => !j.part); },
  surImage() { return joueurs.length > 0; },
  lacher() { manette.pousserSon(1, 0); },
  recentrer() { for (const j of manette.actifs()) j.remettre(); },
  redresser() { manette.remettre(); },
  // la voix (mode poesie, modes.js) gonfle aussi l'image, la ou elle ecrit : voixLoupe, voixP
  voixLoupe: 0, voixP: [0.5, 0.5],
  // ce que la carte graphique doit faire sous les mains : jusqu'a quatre loupes (gpu.js)
  loupes() {
    const l = [];
    for (const j of joueurs) { const g = j.loupeGpu(); if (g) l.push(g); }
    if (this.voixLoupe > 0.01 && l.length < 4) l.push({ p: this.voixP, r: 0.22 * Math.max(0.5, S.mainTaille), loupe: this.voixLoupe, tourb: 0 });
    return l.slice(0, 4);
  },
  // l'ancienne entree (une seule loupe), gardee pour qui la lirait encore
  gpu() { const l = this.loupes(); return l.length ? l[0] : null; },
  // une main d'un mot : celle de son joueur, s'il est encore la
  dessiner(dt) {
    for (const k in this.impact) { this.impact[k] *= Math.exp(-dt * (k === "fonte" || k === "decal" ? 1.1 : 2.4)); if (this.impact[k] < 0.005) this.impact[k] = 0; }
    this.choc = Math.max(0, this.choc - dt * 1.8); this.pince = Math.max(0, this.pince - dt * 0.7);
    const vieTrace = Math.max(2, S.mainVie * 0.6);
    for (const j of joueurs) {
      for (const p of j.trace) p.age += dt;
      while (j.trace.length && j.trace[0].age > vieTrace) j.trace.shift();
    }
    for (const a of this.anneaux) a.age += dt;
    if (this.anneaux.length) this.anneaux = this.anneaux.filter(a => a.age < 1.6);
    if (!this.mots.length && !this.eclats.length && !this.anneaux.length && !joueurs.length) return;
    // les forces des mains sur tous les mots : la gachette gauche souffle loin de la main, la droite
    // attire et fait tourner ; L1 tenu : plus fort et plus loin ; R1 tenu : sur tout l'ecran
    const forces = joueurs.filter(j => !j.part && (j.souffle > 0.02 || j.aimant > 0.02));
    const parId = new Map(joueurs.map(j => [j.id, j]));
    for (let k = this.mots.length - 1; k >= 0; k--) {
      const m = this.mots[k];
      if (!m.fige || m.age < 0) m.age += dt;
      if (m.age < 0) continue;
      m.chante = Math.max(0, m.chante - dt / 3.2); m.lueur = Math.max(0, m.lueur - dt * 1.5);
      if (!m.fige) {
        for (const j of forces) {
          const dx = m.x - j.x, dy = m.y - j.y, d = Math.hypot(dx, dy) + 1, c = j.forceCouche;
          if (j.souffle > 0.02) {
            const f = c === 2 ? j.souffle * 420 : c === 1 ? j.souffle * 320000 * 4.8 / (d * d + 58000) : j.souffle * 320000 / (d * d + 12000);
            m.vx += dx / d * f * dt * (c === 2 ? 3 : 60); m.vy += dy / d * f * dt * (c === 2 ? 3 : 60); m.va += (Math.random() - 0.5) * j.souffle * dt * 4;
          }
          if (j.aimant > 0.02) {
            const f = j.aimant * Math.min(1100, d * 1.4) * (c === 1 ? 2 : 1), tour = j.aimant * (c === 2 ? 900 : 160);
            const tire = c === 2 ? (d - Math.min(W, H) * 0.25) / d : 1;  // partout : tout tourne en anneau autour de la main
            m.vx += (-dx / d * f * tire - dy / d * tour) * dt; m.vy += (-dy / d * f * tire + dx / d * tour) * dt;
          }
        }
        if (m.tombe) m.vy += (m.tombe === true ? 900 : 900 * m.tombe) * dt;
        if (S.mainVent || S.mainEnvol) { m.vx += S.mainVent * 280 * dt; m.vy -= S.mainEnvol * 280 * dt; }
        if (m.derive) { m.vx += m.derive[0] * dt * 1.6; m.vy += m.derive[1] * dt * 1.6; }
        const j = m.joueur && parId.get(m.joueur);
        if (j && (j.ventX || j.ventY)) { m.vx += j.ventX * 280 * dt; m.vy -= j.ventY * 280 * dt; }
      }
      const amorti = Math.exp(-dt * (m.fige ? 3 : 1.6));
      m.vx *= amorti; m.vy *= amorti; m.va *= Math.exp(-dt);
      m.x += m.vx * dt; m.y += m.vy * dt; m.ang += m.va * dt;
      if ((!m.fige && m.age > m.vie) || m.y > H + 120 || m.y < -160 || m.x < -260 || m.x > W + 260) this.mots.splice(k, 1);
    }
    for (let k = this.eclats.length - 1; k >= 0; k--) {
      const e = this.eclats[k];
      e.age += dt;
      if (e.age < 0) continue;
      if (e.orbite) {
        // le malaxeur : les lettres tournent autour de la main, puis s'en vont
        const o = e.orbite, dx = e.x - o.x, dy = e.y - o.y, a = o.w * dt, cs = Math.cos(a), sn = Math.sin(a);
        e.x = o.x + (dx * cs - dy * sn) * (1 - dt * 0.15); e.y = o.y + (dx * sn + dy * cs) * (1 - dt * 0.15);
        if (e.age > o.fin) { const d = Math.hypot(dx, dy) + 1; e.vx = dx / d * 300 - dy / d * o.w * 60; e.vy = dy / d * 300 + dx / d * o.w * 60; e.orbite = null; e.g = 60; e.frein = 1.2; }
      } else {
        const fr = Math.exp(-dt * (e.frein === undefined ? 1.2 : e.frein));
        e.vx *= fr; e.vy = e.vy * fr + (e.g === undefined ? 70 : e.g) * dt;
        e.x += e.vx * dt; e.y += e.vy * dt;
        if (e.sol !== undefined && e.y > e.sol && e.vy > 0) { e.y = e.sol; e.vy *= -0.55; e.vx *= 0.8; }
      }
      e.ang += e.va * dt;
      if (e.age > (e.vie || 3) || e.y > H + 80) this.eclats.splice(k, 1);
    }
    const P = palette(), maintenant = performance.now() / 1000;
    ctx.save();
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.lineCap = "round";
    // les trainees d'encre, sous les mots, par troncons (une seule courbe par douzaine de points)
    for (const j of joueurs) {
      const tr = j.trace;
      if (tr.length < 2) continue;
      ctx.strokeStyle = j.couleur();
      for (let i = 1; i < tr.length; i += 12) {
        const fin = Math.min(tr.length - 1, i + 12), q = tr[Math.min(fin, i + 6)], r = 1 - q.age / vieTrace;
        if (r <= 0) continue;
        ctx.globalAlpha = r * 0.45 * j.presence; ctx.lineWidth = Math.max(0.5, q.l * (0.4 + r * 0.6));
        ctx.beginPath(); ctx.moveTo(tr[i - 1].x, tr[i - 1].y);
        for (let n = i; n <= fin; n++) { if (tr[n].debut) ctx.moveTo(tr[n].x, tr[n].y); else ctx.lineTo(tr[n].x, tr[n].y); }
        ctx.stroke();
      }
    }
    // les fils du surrealiste : de la main au mot lointain, le temps qu'il paraisse
    ctx.lineWidth = 1;
    for (const m of this.mots) if (m.depuis && m.age > 0 && m.age < 1.4) {
      ctx.globalAlpha = (1 - m.age / 1.4) * 0.35; ctx.strokeStyle = m.couleur || P.accent;
      ctx.beginPath(); ctx.moveTo(m.depuis[0], m.depuis[1]); ctx.lineTo(m.x, m.y); ctx.stroke();
    }
    // Les mots sont poses depuis leurs vignettes (des images, pas des lettres a dessiner) : avec
    // quatre mains qui ecrivent, l'ombre lumineuse de chaque mot qui nait (shadowBlur) et les lettres
    // ecrites une a une coutaient 12 a 17 ms par image (mesure du 2026-10-19). La lueur de naissance
    // est une seconde pose du mot, plus grande et legere, en lumiere ; le mot qui chante ondule lettre
    // a lettre, chaque lettre depuis l'atlas.
    const lumiere = !P.clair;
    for (const m of this.mots) {
      if (m.age < 0) continue;
      if (m.age > 0) m.ne = Math.max(0, (m.ne || 0) - dt * 3);
      const a = clamp(m.age / 0.25, 0, 1) * (m.fige ? 1 : clamp((m.vie - m.age) / 3, 0, 1)) * (m.fantome || 1);
      if (a <= 0.004) continue;
      const coul = m.couleur || couleurDe(m), cs = Math.cos(m.ang), sn = Math.sin(m.ang);
      const v = vignetteTexte(m.t, m.pol, coul, true), k = v ? (m.fs || m.taille) / v.fs : 1;
      const poser = (s, al) => {
        const c = cs * s * DPR, d = sn * s * DPR;
        ctx.setTransform(c, d, -d, c, DPR * m.x, DPR * m.y); ctx.globalAlpha = Math.min(1, al);
        if (v) poserVignette(v); else ecrireDirect(m.t, m.pol, coul);
      };
      const naissance = m.ne > 0 ? lisse(m.ne) * 0.7 : 0;
      if (m.chante > 0.01) {
        // le mot qui chante laisse des echos qui grandissent et s'effacent, et ses lettres ondulent
        for (let n = 1; n <= 3; n++) poser(k * (1 + ((1 - m.chante) * 2 + n * 0.35) % 1.6), a * m.chante * 0.22 / n);
        const S2 = 1 + m.chante * 0.25 + naissance;
        let acc = -m.w / 2, i = 0;
        ctx.globalAlpha = a;
        for (const c of m.t) {
          const lw = mesurer(c, m.pol), lx = (acc + lw / 2) * S2, ly = Math.sin(maintenant * 9 + i++ * 0.9) * m.taille * 0.28 * m.chante * S2;
          acc += lw;
          if (c === " ") continue;
          const vl = vignetteLettre(c, m.taille * S2, coul), s = vl ? m.taille * S2 / vl.fs * DPR : DPR;
          ctx.setTransform(cs * s, sn * s, -sn * s, cs * s, DPR * (m.x + lx * cs - ly * sn), DPR * (m.y + lx * sn + ly * cs));
          if (vl) poserVignette(vl); else ecrireDirect(c, m.pol, coul);
        }
        continue;
      }
      if (m.lueur > 0.05) {
        // le mot qui nait brille : une seconde pose, plus grande et legere (en lumiere sur le sombre)
        if (lumiere) ctx.globalCompositeOperation = "lighter";
        poser(k * (1 + naissance) * (1.1 + m.lueur * 0.12), a * m.lueur * 0.45);
        ctx.globalCompositeOperation = "source-over";
      }
      poser(k * (1 + naissance), a);
    }
    for (const e of this.eclats) {
      if (e.age < 0) continue;
      const T = e.taille || (e.taille = tailleDePolice(e.pol || police(this.taille()))), coul = e.couleur || couleurDe(e);
      const v = vignetteLettre(e.t, T, coul), s = (v ? T / v.fs : 1) * DPR, c = Math.cos(e.ang) * s, sn = Math.sin(e.ang) * s;
      ctx.globalAlpha = clamp(1 - e.age / (e.vie || 3), 0, 1);
      ctx.setTransform(c, sn, -sn, c, DPR * e.x, DPR * e.y);
      if (v) poserVignette(v); else ecrireDirect(e.t, police(T), coul);
    }
    // les anneaux : ils partent de la main (ou du mot) et s'elargissent en s'effacant
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    for (const an of this.anneaux) {
      if (an.age < 0) continue;
      const r = 1 - an.age / 1.6;
      ctx.globalAlpha = r * 0.8 * Math.min(1, an.force + 0.2); ctx.strokeStyle = an.couleur || P.accent; ctx.lineWidth = 1 + 7 * an.force * r;
      ctx.beginPath(); ctx.arc(an.x, an.y, 6 + sortie3(an.age / 1.6) * 520 * an.force, 0, Math.PI * 2); ctx.stroke();
    }
    // les mains : un cercle discret de la couleur du poete, qui s'efface quand on ne joue plus.
    // Au-dedans, ou en sont la loupe (un cercle) et le tourbillon (un arc) ; L1 tenu : un second
    // cercle ; R1 tenu : un cercle en pointilles. Aucun texte
    if (S.mainCurseur) for (const j of joueurs) {
      const repos = (performance.now() - j.active) / 1000, a = clamp(1 - (repos - 3) / 1.5, 0, 1) * 0.65 * j.presence;
      if (a <= 0.01) continue;
      const r = this.taille() * 0.55 * j.tailleSel, coul = j.couleur();
      const passes = j.fondu < 1 && j.ancienne ? [[j.ancienne, 1 - j.fondu], [coul, j.fondu]] : [[coul, 1]];
      for (const [cl, k] of passes) {
        ctx.globalAlpha = a * k; ctx.strokeStyle = cl; ctx.fillStyle = cl; ctx.lineWidth = 1.5;
        if (j.couche === 2) ctx.setLineDash([4, 5]);
        ctx.beginPath(); ctx.arc(j.x, j.y, r, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        if (j.couche === 1) { ctx.beginPath(); ctx.arc(j.x, j.y, r * 1.45, 0, Math.PI * 2); ctx.stroke(); }
        if (Math.abs(j.loupe) > 0.02) { ctx.beginPath(); ctx.arc(j.x, j.y, r * clamp(0.45 + j.loupe * 0.25, 0.05, 2), 0, Math.PI * 2); ctx.stroke(); }
        if (Math.abs(j.tourbillon) > 0.02) {
          ctx.lineWidth = 3; ctx.beginPath();
          ctx.arc(j.x, j.y, r + 5, -Math.PI / 2, -Math.PI / 2 + j.tourbillon / 1.5 * Math.PI, j.tourbillon < 0); ctx.stroke();
        }
        if (j.ecrit || j.marche) { ctx.beginPath(); ctx.arc(j.x, j.y, 3, 0, Math.PI * 2); ctx.fill(); }
      }
    }
    ctx.restore();
  },
};

/* ---------------------------------------------------- les reglages du jeu (onglet Manette) */

// Les cles de la manette d'avant restent dans DEFAUTS (les reglages gardes de Jiiji restent valables)
// mais celle qui ne sert plus sort du panneau : manetteMode (la page de la manette). Les autres
// servent encore : mainVie (la duree de vie des mots ecrits), mainTaille, mainSensibilite (la vitesse
// de la main), mainNotes, mainCurseur, mainVent, mainEnvol, vibration.
const REGLAGE = {};
for (const o of SCHEMA) for (const g of o.groupes || []) for (const it of g.items || []) if (it.cle) REGLAGE[it.cle] = it;
for (const o of SCHEMA) if (o.onglet === "Manette") for (const g of o.groupes || []) if (g.items) g.items = g.items.filter(it => it.cle !== "manetteMode");
ajouterReglages("Manette", "Les joueurs (une main par manette, jusqu'à quatre)", [
  { cle: "mainVibre", nom: "Force de la vibration des manettes", type: "curseur", min: 0, max: 1, pas: 0.05 },
  ...[1, 2, 3, 4].map(n => ({ cle: "mainPerso" + n, nom: "Le poète de la manette " + n + " en arrivant", type: "choix",
    options: [["hasard", "Au hasard"]].concat(PERSOS.map(p => [p.cle, p.nom])) })),
], Object.assign({ mainVibre: 0.6 }, ...[1, 2, 3, 4].map(n => ({ ["mainPerso" + n]: "hasard" }))));
ajouterReglages("Manette", "Les poètes qu'on peut jouer (pavé tactile : le suivant)",
  PERSOS.map(p => ({ cle: cleJouable(p), nom: p.nom, type: "case" })),
  Object.assign({}, ...PERSOS.map(p => ({ [cleJouable(p)]: true }))));
for (const it of REGLAGES_AJOUTES.slice(-(5 + PERSOS.length)).map(x => x[1])) REGLAGE[it.cle] = it;

// ceux-la vont du simple au centuple (modes.js s'en sert pour son hasard)
const MANETTE_LOG = new Set(["tenue", "poemeMax", "fonduDuree", "vitesse", "frequence", "vitesseEtoiles", "puitsVitesse", "averseVitesse",
  "sonTempo", "sonFiltre", "sonCycle", "sonVibratoVitesse", "sonTremoloVitesse", "kickRelache", "caisseRelache", "charleyRelache", "lfo1Duree", "lfo2Duree", "lfo3Duree", "lfo4Duree"]);
const MANETTE_TOUR = new Set(["decalage", "teinteMots"]);  // un cercle : apres 359, 0
const NOMS_MANETTE = { larsenRotation: "rotation du larsen", larsenZoom: "zoom du larsen", larsenTeinte: "couleur des échos du larsen",
  kaleidoTourne: "le kaléidoscope tourne", kaleidoSpirale: "le kaléidoscope s'enroule", kaleido: "kaléidoscope (miroirs)",
  frequence: "fréquence du tremblement", calqueOpacite: "présence de la seconde scène", calqueMelange: "mélange des deux scènes" };
function court(cle) {
  const it = REGLAGE[cle];
  if (NOMS_MANETTE[cle]) return NOMS_MANETTE[cle];
  if (!it) return cle;
  const n = it.nom.replace(/\s*\([^)]*\)/g, "").replace(/\s*:\s*/g, " : ").trim();
  return n.charAt(0).toLowerCase() + n.slice(1);
}
function valeurLue(cle) {
  const it = REGLAGE[cle], v = S[cle];
  if (!it) return String(v);
  if (it.type === "choix") { const o = it.options.find(x => String(x[0]) === String(v)); return o ? o[1] : String(v); }
  if (it.type === "case") return v ? "oui" : "non";
  return (it.pas >= 1 ? String(Math.round(v)) : Number(v).toFixed(2).replace(/\.?0+$/, "")) || "0";
}
// un choix, au suivant ou au precedent ; une case, a l'inverse
function choixVoisin(cle, sens) {
  const it = REGLAGE[cle], opts = it.options.map(o => String(o[0]));
  const i = Math.max(0, opts.indexOf(String(S[cle]))), k = opts[((i + sens) % opts.length + opts.length) % opts.length];
  potards.ecrire(cle, typeof DEFAUTS[cle] === "number" ? Number(k) : k, true);
}
function caseBascule(cle) { potards.ecrire(cle, !S[cle], true); }
// Les potards de l'ancienne manette sont dans l'archive ; il en reste l'ecriture d'un reglage d'un
// coup, et les deux listes que modes.js lit encore (origine, retours)
const potards = {
  origine: {}, retours: {},
  ecrire(cle, v) {
    pilote.prendre(cle);
    changer(cle, v);
    if (controles[cle]) controles[cle].maj();
  },
  maj() {},
};

// quelques gestes d'une touche, gardes pour qui s'en sert
function noteSeule(timbre, duree) {
  if (!sonPret()) return;
  const n = son.gamme().length;
  son.voix(timbre || son.timbreDe(""), son.ctx.currentTime + 0.02, son.frequence(Math.floor(Math.random() * n * 1.5)), duree || 1.6, 1, hasard(-0.6, 0.6) * son.v("sonLargeur"));
}
function sonPret() { son.demarrer(); return S.son && son.ctx && son.ctx.state === "running"; }
// un des combos tout prets (les ambiances « Combo : ... »), sans toucher aux couleurs ni aux effets :
// seulement les deux scenes et leur facon d'etre ensemble
let comboCourant = -1;
function comboPret(sens) {
  const noms = Object.keys(AMBIANCES).filter(n => n.startsWith("Combo"));
  comboCourant = (comboCourant + sens + noms.length) % noms.length;
  const a = AMBIANCES[noms[comboCourant]];
  if (a.scene && a.scene !== S.scene) changerScene(a.scene);
  for (const c in a) if (c.startsWith("calque")) { changer(c, a[c]); if (controles[c]) controles[c].maj(); }
  annoncer(noms[comboCourant].replace(/^Combo : /, "").toUpperCase(), "combo");
}
// il n'y a plus qu'une page : le jeu (pour qui lirait encore la page de la manette)
const PAGE_JEU = { cle: "jouer", nom: "Le jeu (une main par manette)" };
function pageManette() { return PAGE_JEU; }

/* ---------------------------------------------------- l'onglet Manette */

function echapper(t) { return String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]); }
// ce que fait chaque touche, en un tableau : touche, seule, L1 tenu, R1 tenu ; puis les poetes
function docManette() {
  const td = 'style="border:1px solid #c0c0c0;padding:2px 5px;vertical-align:top"';
  const th = 'style="border:1px solid #808080;padding:2px 5px;background:#e8e8e8;text-align:left"';
  let h = '<table style="border-collapse:collapse;font:11px/1.35 Tahoma,Arial,sans-serif;white-space:normal;width:100%">'
    + "<tr><th " + th + ">Touche</th><th " + th + ">seule</th><th " + th + ">L1 tenu : en grand</th><th " + th + ">R1 tenu : partout</th></tr>";
  for (const [k, a, b, c] of DISPOSITION) {
    if (!b && !c) h += "<tr><td " + td + "><b>" + echapper(k) + "</b></td><td " + td + ' colspan="3">' + echapper(a) + "</td></tr>";
    else h += "<tr><td " + td + "><b>" + echapper(k) + "</b></td><td " + td + ">" + echapper(a) + "</td><td " + td + ">" + echapper(b) + "</td><td " + td + ">" + echapper(c) + "</td></tr>";
  }
  h += "</table>";
  const facons = {
    lyrique: "écrit en phrases qui ondulent ; piano électrique qui monte ; son éclat s'envole en pétales",
    minimaliste: "un mot à la fois, grand, qui reste ; une boîte à musique ; son éclat fend un seul mot",
    surrealiste: "pose ses mots loin de la main, au bout d'un fil ; clochettes en grands sauts ; les lettres s'en vont ailleurs",
    sonore: "chaque mot laisse son écho ; notes pincées qui se répètent ; les lettres rebondissent",
    brut: "tamponne en capitales sur une grille ; marimba grave et sec ; les lettres tombent droit",
    debit: "écrit vite et longtemps, petit et serré ; une course de notes ; la foule s'éparpille",
    exorciste: "frappe de travers ; tambours graves ; son éclat fait tourner l'image",
    malaxeur: "chaque vers revient avec un mot changé ; kalimba qui tourne ; les lettres tournent autour de la main",
    caissier: "des montants entre les mots, le ticket ; une caisse accordée (un tic, puis la tonique) ; les lettres tombent comme des pièces",
    nomenclateur: "Chaque Mot Comme Un Nom, qui part en cortège ; steel drum ; des confettis",
    modeEmploi: "des étapes numérotées, en lignes ; vibraphone qui monte marche par marche ; les mots tombent en dominos",
    voisine: "à plat, en petites lignes droites ; un Rhodes doux ; son éclat ne fait que glisser",
    chosiste: "les mots font le tour d'un objet ; cloche tubulaire ; l'objet se casse en deux",
    inventoriste: "en colonne, qui déborde ; un célesta qui compte ; la colonne s'effondre",
  };
  h += '<p style="margin:8px 0 3px;font:11px Tahoma,Arial,sans-serif">Les poètes : chacun joue les mêmes gestes à sa façon. On les reconnaît à leur façon, à leur couleur et à leur son ; rien ne s\'écrit sur l\'image.</p>';
  h += '<table style="border-collapse:collapse;font:11px/1.35 Tahoma,Arial,sans-serif;white-space:normal;width:100%">';
  for (const p of PERSOS) h += "<tr><td " + td + '><span style="display:inline-block;width:10px;height:10px;margin-right:5px;background:' + hsl(teinteDe(p.nom) || 0, 82, 55) + '"></span><b>'
    + echapper(p.nom) + "</b></td><td " + td + ">" + echapper(facons[p.cle] || "") + "</td></tr>";
  return h + "</table>";
}
function majManetteUI() {
  const el = document.getElementById("j-etat");
  if (!el) return;
  const doc = document.getElementById("j-pages");
  if (doc && !doc.dataset.fait) { doc.style.whiteSpace = "normal"; doc.style.font = "11px Tahoma, Arial, sans-serif"; doc.innerHTML = docManette(); doc.dataset.fait = "1"; }
  const a = manette.actifs();
  el.innerHTML = '<span class="pastille ' + (a.length ? "vert" : "") + '"></span>';
  // le panneau, lui, peut dire qui est qui (il n'est pas projete)
  const qui = a.map(j => "manette " + j.rang + " (" + j.nom.replace(/\s*\(.*\)\s*$/, "") + ") : " + j.perso.nom.toLowerCase()).join(" · ");
  el.appendChild(document.createTextNode(a.length
    ? qui + (manette.dernierBouton !== undefined ? " · dernier bouton lu : " + NOM_BOUTON[manette.dernierBouton] + " (manette " + manette.dernierJoueur + ")" : " · appuie sur un bouton pour vérifier")
    : "Pas de manette vue. Branche-la (USB ou Bluetooth) puis appuie sur un bouton : Chrome ne la montre qu'après un premier appui. Jusqu'à quatre manettes, une main chacune."));
}
// le fondu entre deux scenes : la derniere image de l'ancienne s'efface par-dessus la nouvelle
const fondu = { c: document.createElement("canvas"), alpha: 0 };
function photographier() {
  if (!scene || !toile.width) return;
  if (fondu.c.width !== toile.width || fondu.c.height !== toile.height) { fondu.c.width = toile.width; fondu.c.height = toile.height; }
  const g = fondu.c.getContext("2d");
  g.clearRect(0, 0, fondu.c.width, fondu.c.height);
  g.drawImage(toile, 0, 0);
  fondu.alpha = 1;
}
function dessinerFondu(dt) {
  if (fondu.alpha <= 0) return;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = lisse(fondu.alpha);
  ctx.drawImage(fondu.c, 0, 0);
  ctx.restore();
  fondu.alpha -= dt / Math.max(0.3, S.fonduDuree);
}

