"use strict";
/* ================================================================ chef d'orchestre */

let scene = null, sceneCle = null, poemeCourant = null;
// la poesie visuelle passe plus souvent ; la Banque (corbeille, marches, billets, machine) ne
// passe plus d'elle-meme depuis le 2026-10-16, on la choisit dans la liste
const ORDRE_AUTO = ["constellation", "nuee", "ruban", "calligramme", "puits", "cretes", "averse", "rosace", "battement", "onde",
  "etoiles", "tourbillon", "coupdedes", "lecture", "constellation", "nuee", "puits", "rosace", "calligramme", "mystifier", "texte3d", "defilement"];
let sacAuto = [];
function cleSuivante() {
  if (S.scene !== "auto") return S.scene;
  if (!sacAuto.length) sacAuto = ORDRE_AUTO.slice().sort(() => Math.random() - 0.5);
  return sacAuto.pop();
}
function construire(cle, p) {
  montrerCartel(null);
  tenueMin = versDe(p).length * 1.2;
  if (SCENES_FABRIQUES[cle]) return SCENES_FABRIQUES[cle](p);  // les scenes ajoutees par leur fichier
  switch (cle) {
    case "lecture": return new ScenePoeme(p, { entree: S.entree, sortie: S.sortie, maelstrom: S.fond === "maelstrom" });
    case "tourbillon": return new ScenePoeme(p, { entree: "spirale", sortie: "vortex", maelstrom: true });
    case "etoiles": return new SceneEtoiles(p);
    case "texte3d": return new SceneTexte3D(p);
    case "mystifier": return new SceneMystifier(p);
    case "defilement": return new SceneDefilement(p);
    case "corbeille": return new SceneCorbeille(p);
    case "marches": return new SceneMarches(p);
    case "billets": return new SceneBillets(p);
    case "machine": return new SceneMachine(p);
    case "calligramme": return new SceneCalligramme(p);
    case "constellation": return new SceneConstellation(p);
    case "nuee": return new SceneNuee(p);
    case "ruban": return new SceneRuban(p);
    case "coupdedes": return new SceneCoupDeDes(p);
    case "puits": return new ScenePuits(p);
    case "cretes": return new SceneCretes(p);
    case "averse": return new SceneAverse(p);
    case "rosace": return new SceneRosace(p);
    case "battement": return new SceneBattement(p);
    case "onde": return new SceneOnde(p);
  }
  return new ScenePoeme(p, { entree: "fondu", sortie: "fondu", maelstrom: false });
}
// les scenes dont le monde continue d'un poeme a l'autre : pas de fondu entre elles
const CONTINUES = new Set(["etoiles", "mystifier", "constellation", "nuee", "ruban", "puits", "cretes", "averse"]);
let debutPoeme = performance.now(), sceneChronometree = null;
function suivant(sens) {
  debutPoeme = performance.now();
  // le pilote pose ici ce qu'il a prepare pendant le poeme
  // le pilote voit le poeme qui vient : sa forme oriente la scene
  const prochain = prochainPoeme(sens);
  const change = S.pilote && pilote.actif ? pilote.finDePoeme(prochain) : false;
  const avant = sceneCle;
  poemeCourant = prochain;
  son.nouveauPoeme(poemeCourant);
  bus.emettre("poeme", { poeme: poemeCourant });
  sceneCle = cleSuivante();
  if (change || !(avant === sceneCle && CONTINUES.has(sceneCle))) photographier();
  scene = construire(sceneCle, poemeCourant);
  // le calque suit : le meme poeme, ou une autre scene si les deux tombent sur la meme
  if (S.calque !== "aucun" && (S.calquePoeme === "meme" || calque.cle === sceneCle)) construireCalque(false);
}

function redimensionner() {
  DPR = Math.min(window.devicePixelRatio || 1, S.qualite);
  W = window.innerWidth; H = window.innerHeight;
  toile.width = Math.round(W * DPR); toile.height = Math.round(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  appliquerEspacement();
  mesures.clear(); vignettes.clear();
  fondCache = null; bandeau.texte = null; fondu.alpha = 0;
  maelstrom.mots = [];
  ctx.fillStyle = palette().fond[0]; ctx.fillRect(0, 0, W, H);
  if (poemeCourant) scene = construire(sceneCle, poemeCourant);
  if (calque.scene) construireCalque(false);
}
let attenteRedim = null;
window.addEventListener("resize", () => { clearTimeout(attenteRedim); attenteRedim = setTimeout(redimensionner, 180); });

let dernier = performance.now();
let compteur = 0;
function image(maintenant) {
  const reel = clamp((maintenant - dernier) / 1000, 0, 0.05);  // l'horloge peut reculer
  dernier = maintenant;
  manette.maj(reel);
  musique.maj(reel);
  pilote.maj(reel);
  lfo.maj();
  let dt = reel * S.vitesse * live.vitesse * (S.musique && musique.actif ? 1 + musique.niveau * S.musiqueElan : 1);
  temps += dt;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  peindreFond(dt);
  if (S.fond === "maelstrom" && !(scene && scene.avecMaelstrom)) { maelstrom.maj(dt); maelstrom.dessiner(); }
  majCalque(dt, reel);
  if (S.calquePlace === "derriere") dessinerCalque();
  if (scene) {
    // une scene reconstruite (autre scene, police, taille, ambiance) recommence le poeme : son
    // chrono aussi, sinon poemeMax la coupait quelques secondes apres (audit du 2026-10-18)
    if (scene !== sceneChronometree) { sceneChronometree = scene; debutPoeme = maintenant; }
    const fini = scene.maj(dt);
    scene.dessiner();
    // a la vitesse 0.1, chaque vers garde ses secondes de scene (4 a 8) dix fois plus longtemps :
    // un sonnet durait dix minutes et le pilote, qui attend la fin du poeme, ne changeait plus
    // rien (Jiiji, 2026-10-17). La duree d'un poeme est donc bornee en vraies secondes (l'horloge,
    // pas la somme des images : une image lente est plafonnee a 50 ms).
    if (fini || (S.poemeMax < 600 && maintenant - debutPoeme > S.poemeMax * 1000)) { if (!fini) photographier(); suivant(); }
  }
  if (S.calquePlace !== "derriere") dessinerCalque();
  main.dessiner(reel);
  dessinerFondu(reel);
  dessinerBandeau(dt);
  dessinerBulles();
  if (!gpu.dessiner(reel)) {
    // sans carte graphique, le flash des temps forts se peint sur la toile
    const f = (S.musique && musique.actif ? musique.coup * S.musiqueFlash : 0) + live.mod.flash;
    if (f > 0.02) {
      ctx.save(); ctx.globalCompositeOperation = palette().clair ? "source-over" : "lighter";
      ctx.globalAlpha = clamp(f * 0.18, 0, 0.5); ctx.fillStyle = palette().clair ? "#ffffff" : palette().accent;
      ctx.fillRect(0, 0, W, H); ctx.restore();
    }
  }
  live.coupNeuf = 0;
  if (++compteur % 12 === 0) { majMiniature(); dessinerVumetre(); }  // 5 fois par seconde suffit
  requestAnimationFrame(image);
}

