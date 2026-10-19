"use strict";
/* ================================================================ depart */

// les scenes et les reglages que chaque fichier a ajoutes (ajouterScene, ajouterReglages)
function finaliserAjouts() {
  const banque = SCENES_NOMS.findIndex(([k]) => SCENES_BANQUE.has(k));
  for (const d of SCENES_AJOUTEES) {
    if (SCENES_NOMS.some(([k]) => k === d.cle)) continue;
    SCENES_NOMS.splice(banque < 0 ? SCENES_NOMS.length : SCENES_NOMS.findIndex(([k]) => SCENES_BANQUE.has(k)), 0, [d.cle, d.nom]);
    if (d.calque !== false) SCENES_CALQUE.push([d.cle, d.nom]);
    if (d.auto !== false) ORDRE_AUTO.push(d.cle);
    if (d.calme) PILOTE_CALME.push(d.cle);
    if (d.plein) PILOTE_PLEIN.push(d.cle);
    if (d.continue) CONTINUES.add(d.cle);
  }
  const cibles = [];
  for (let i = 1; i <= LFO_NB; i++) if (REGLAGE["lfo" + i + "Cible"]) cibles.push(REGLAGE["lfo" + i + "Cible"].options);
  for (const [onglet, it] of REGLAGES_AJOUTES) {
    if (!it.cle) continue;
    REGLAGE[it.cle] = it;
    if (it.type !== "curseur" || LFO_CIBLES[it.cle] || RECONSTRUIRE_LFO.has(it.cle) || LFO_EXCLUS.has(it.cle) || /^(son|main|pilote|lfo)/.test(it.cle)) continue;
    LFO_CIBLES[it.cle] = { min: it.min, max: it.max, pas: it.pas, nom: it.nom + " (" + onglet + ")" };
    for (const o of cibles) o.push([it.cle, LFO_CIBLES[it.cle].nom]);
  }
}
finaliserAjouts();
document.body.classList.toggle("crt", !!(S.crt && S.vieilleTele));
construirePanneau();
redimensionner();
window.addEventListener("beforeunload", () => { try { localStorage.setItem(CLE_STOCKAGE, JSON.stringify(lfo.aSauver())); } catch (e) { /* tant pis */ } });
// la musique reprend toute seule si Chrome a deja donne la permission du micro ; le son du
// PC (partage d'ecran) demande un geste, on attend la touche M ou le bouton Share ; l'ecran qui
// s'ecoute lui-meme (la boucle de Jiiji) se rebranche aussi, il attend le premier clic
// l'ecran d'accueil (accueil.html, 2026-10-19) : mode=, preset=, plein=1 dans l'adresse. Le mode pose
// sa configuration de base, le preset la sienne, puis les reglages venus de l'adresse passent par-dessus
// (le PC pourri eteint ce qu'un preset rallumerait)
function remettreAdresse() {
  for (const k in DEPUIS_ADRESSE) { delete modes.fondu[k]; S[k] = DEPUIS_ADRESSE[k]; }
}
const MODE_ADRESSE = PARAMS.get("mode");
if (MODES[MODE_ADRESSE] && MODE_ADRESSE !== S.mode) { modes.choisir(MODE_ADRESSE); remettreAdresse(); }
const PRESET_ADRESSE = PARAMS.get("preset");
if (PARAMS.get("plein") === "1") {
  // une page ne peut demander le plein ecran qu'apres un geste : le premier clic ou la premiere touche
  const plein = () => {
    removeEventListener("pointerdown", plein, true); removeEventListener("keydown", plein, true);
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
  };
  addEventListener("pointerdown", plein, true); addEventListener("keydown", plein, true);
}
if (S.musique && ["micro", "ecran", "melange"].includes(S.musiqueSource)) musique.brancher();
else if (S.musique) { S.musique = false; }
charger().then(() => {
  const p = PRESET_ADRESSE && presetsDe(S.mode).find(x => x.nom === PRESET_ADRESSE);
  if (p) {
    modes.poser(p, { duree: 0.05 });
    // au depart, la scene du preset vient tout de suite (pas a la fin du premier poeme)
    if (modes.enAttente) { const v = modes.enAttente; modes.enAttente = null; modes.poserScene(v, false); }
    remettreAdresse();
  }
  suivant();
  requestAnimationFrame(image);
  // au demarrage, l'image reste nue : la barre ne vient qu'avec la souris
  aide.classList.add("cache"); document.body.classList.add("cache-curseur");
});
setInterval(charger, 15000);
setInterval(suivreDirect, 900);
setInterval(() => { if (!panneau.hidden) rafraichirGenerateur(); }, 3000);
