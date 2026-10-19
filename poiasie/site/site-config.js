"use strict";
/* ================================================================ site : les reglages de la demonstration
   (charge juste apres reglages.js : S existe, les autres fichiers ne l'ont pas encore lu)

   Les reglages de Jiiji pour regarder : vitesse basse, ecriture lente, pas de texte sur l'image
   (ni cartel, ni Bourse, ni annonces), poemes dans un ordre de hasard, aucun vote, aucun son avant
   un clic sur le bouton prevu pour cela. Rien n'est enregistre. */

const SITE_MOBILE = (() => {
  try { return matchMedia("(pointer: coarse)").matches || Math.min(screen.width, screen.height) < 600 || innerWidth < 700; } catch (e) { return false; }
})();

Object.assign(S, {
  scene: "auto", source: "recueil", ordre: "hasard", nouveauxDabord: false,
  vitesse: 0.19, ecriture: 0.5, tenue: 5, poemeMax: 24, fonduDuree: 3,
  cartel: false, direct: false, bourse: false, annoncesEcran: false, annotations: !SITE_MOBILE,
  votes: false, chutes: false, filsRimes: true,
  son: false, musique: false, manetteMode: "jouer", vibration: false,
  // la main du visiteur : des mots qui vivent quelques secondes, aucun cercle ni curseur dessine
  mainCurseur: false, mainVie: 7, mainNotes: true,
  pilote: false, calque: "aucun", crt: false, vieilleTele: false,
  palette: "nuit", fond: "degrade", modeCouleur: "poetes", couleurPoetes: true,
  halo: 0, rvb: 0, ondes: 0, kaleido: 0, larsen: 0, vhs: 0, grain: 0,
});
if (SITE_MOBILE) Object.assign(S, { qualite: 1, etoiles: 150, maelstrom: 100, echos: 8, trainees: 0 });
else S.qualite = Math.min(S.qualite, 1.5);
