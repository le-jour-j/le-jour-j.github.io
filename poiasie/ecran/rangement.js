"use strict";
/* ================================================================ le rangement du panneau (2026-10-19) */

// Jiiji, 2026-10-19 : « peut-etre a un moment on va devoir reflechir au menu des parametres, parce
// que c'est quand meme plus tres opti cette forme-la », puis « le tremolo je le mets toujours a 0,
// les cases a cocher pour les vers et les noms des poetes je m'en fous aussi. Je trouve que ca devient
// trop le bordel en fait. » Proposition et maquette : PANNEAU-REFONTE.md,
// archives\maquette-panneau-2026-10-19.html.
//
// Le rangement est une VUE posee sur SCHEMA : rien n'est renomme ni deplace dans SCHEMA (les verrous
// du hasard sont gardes par les noms des onglets et des groupes ; cv.js, son.js, musique.js, pilote.js
// et presets-categories.js cherchent des onglets par leur nom). Chaque reglage a une vue maitre, sur sa
// sous-page ; la page Jouer, les epingles et la recherche en montrent des copies (controles[cle].maj
// les met toutes a jour, panneau.js).
//
// Sept familles (Alt + la lettre soulignee), des sous-pages, l'essentiel en vue et le reste dans
// « Avance », replie en bas de chaque page : rien n'est supprime. Les preferences de la fenetre sont
// dans CLE_PANNEAU, jamais dans S (ni presets, ni hasard, ni « Par defaut »). La case « Ancien
// panneau » (Systeme > Machine et fenetre) remet le panneau d'avant tel quel (construireAncienPanneau,
// panneau.js).
//
// Charge apres presets-categories, avant depart (ECRAN_FICHIERS, ecran.html).

const CLE_PANNEAU = "poiasie-panneau-v1";
const rgPref = Object.assign({ ancien: false, famille: "jouer", sous: {}, replis: {}, avanceOuvert: false, epingles: [], texte: 11, largeur: 560, hauteur: 0 },
  (() => { try { return JSON.parse(localStorage.getItem(CLE_PANNEAU) || "null") || {}; } catch (e) { return {}; } })());
function rgGarder() { try { localStorage.setItem(CLE_PANNEAU, JSON.stringify(rgPref)); } catch (e) { /* stockage refuse : tant pis */ } }

/* ---------------------------------------------------- les familles et leurs sous-pages */

// « de » : un groupe de SCHEMA, par son onglet et le debut de son titre (« * » : tous) ;
// « plus » : des reglages pris ailleurs un par un ; « categories » : les onglets dont la rangee de
// presets (presets-categories.js) se pose en haut de la sous-page.
const RANGEMENT = [
  { id: "jouer", nom: "Jouer", lettre: "J", special: "jouer" },
  { id: "image", nom: "Image", lettre: "I", sous: [
    { id: "scene", nom: "Scène", categories: ["Écran de veille"], moniteur: true, groupes: [
      { de: "Écran de veille / Écran de veille", titre: "La scène et le temps" }, { de: "Écran de veille / Ambiances" }] },
    { id: "couleurs", nom: "Couleurs", categories: ["Couleurs"], groupes: [{ de: "Couleurs / *" }] },
    { id: "effets", nom: "Effets", categories: ["Effets"], groupes: [
      { de: "Effets / Lumière" }, { de: "Effets / Déformations" }, { de: "Effets / Couleurs de l'image" }, { de: "Effets / Larsen" },
      { de: "Effets / Vieux écrans", plus: ["crt"] }] },
    { id: "combo", nom: "Combo", categories: ["Combo"], groupes: [{ de: "Combo / *" }] },
  ]},
  { id: "mots", nom: "Mots", lettre: "M", sous: [
    { id: "lettres", nom: "Lettres", categories: ["Mots"], groupes: [{ de: "Mots / Lettres" }] },
    { id: "vie", nom: "Les mots bougent", categories: ["Mots"], groupes: [{ de: "Mots / Effets sur les mots" }] },
  ]},
  { id: "scenes", nom: "Scènes", lettre: "S", sous: [
    { id: "plat", nom: "À plat", categories: ["Mouvements"], parScene: true, groupes: [{ de: "Mouvements / *" }] },
    { id: "relief", nom: "En relief (3D)", categories: ["Scènes 3D"], groupes: [{ de: "Scènes 3D / *" }] },
    { id: "paysages", nom: "Paysages", categories: ["Paysages"], groupes: [{ de: "Paysages / *" }] },
  ]},
  { id: "son", nom: "Son", lettre: "O", sous: [
    { id: "jeu", nom: "Le son", categories: ["Son"], special: "son", groupes: [{ de: "Son / Son" }, { de: "Son / Évolution" }, { de: "Son / Gamme" }] },
    { id: "rythme", nom: "Rythme et timbres", categories: ["Son"], groupes: [{ de: "Son / Rythme" }, { de: "Son / Timbres" }, { de: "Son / Motifs" }, { de: "Son / Synthés" }] },
    { id: "matiere", nom: "Matière", categories: ["Son"], groupes: [{ de: "Son / Espace" }, { de: "Son / Modulations" }, { de: "Son / La modulation respire" }, { de: "Son / Quand les mots" }] },
    { id: "voix", nom: "La voix", categories: ["Son"], groupes: [{ de: "Son / La voix" }] },
  ]},
  { id: "modulation", nom: "Modulation", lettre: "L", sous: [
    { id: "ecoute", nom: "Écoute", categories: ["Musique", "Modes"], special: "musique", groupes: [{ de: "Musique / *" }], adopte: ["La voix"] },
    { id: "sonmene", nom: "Le son mène", categories: ["Le son mène"], groupes: [{ de: "Le son mène / *" }] },
    { id: "lfo", nom: "LFO", categories: ["LFO"], groupes: [{ de: "LFO / *" }] },
    { id: "cables", nom: "Câbles", categories: ["Câbles"], groupes: [{ de: "Câbles / *" }] },
    { id: "pilote", nom: "Pilote", categories: ["Écran de veille"], groupes: [{ de: "Écran de veille / Pilote", titre: "Pilote automatique (² ou F2, PS sur la manette)" }] },
  ]},
  { id: "systeme", nom: "Système", lettre: "Y", sous: [
    { id: "presets", nom: "Presets et hasard", adopte: ["Mes presets", "Le hasard"], groupes: [{ titre: "Les presets du mode : réglages", cles: ["presetFondu", "presetScene", "presetVitesse"] }] },
    { id: "manette", nom: "Manette et clavier", categories: ["Manette"], special: "manette", groupes: [{ de: "Manette / *" }] },
    { id: "poeme", nom: "Le poème à l'écran", categories: ["Poèmes"], groupes: [{ de: "Poèmes / *" }] },
    { id: "machine", nom: "Machine et fenêtre", special: "fenetre", groupes: [{ titre: "Finesse", cles: ["qualite"] }, { de: "Effets / Carte graphique" }] },
    { id: "generateur", nom: "Générateur", special: "generateur" },
    { id: "apropos", nom: "À propos", special: "apropos" },
  ]},
];
// un groupe que le rangement ne cite pas (ajoute demain par ajouterReglages) : dans la sous-page de
// son onglet, dans l'avance ; un onglet inconnu : Systeme > Nouveautes, en vue
const ONGLET_PAGE = { "Écran de veille": "image/scene", "Combo": "image/combo", "Mots": "mots/vie", "Mouvements": "scenes/plat",
  "Couleurs": "image/couleurs", "Effets": "image/effets", "Musique": "modulation/ecoute", "Le son mène": "modulation/sonmene",
  "Manette": "systeme/manette", "Poèmes": "systeme/poeme", "Son": "son/matiere", "LFO": "modulation/lfo", "Scènes 3D": "scenes/relief",
  "Paysages": "scenes/paysages", "Câbles": "modulation/cables" };

// La page Jouer : 12 a 15 reglages par mode, ceux qui servent en direct (journal du projet, pages de
// la manette, reglages de base des modes)
const JOUER = {
  poesie: ["scene", "vitesse", "poemeMax", "voixSeuil", "voixAvance", "voixSilence", "voixEcrit", "voixLumiere", "taille", "palette", "trainees", "halo", "sonVoix", "sonVoixRev", "volume"],
  vjing: ["scene", "calque", "calqueOpacite", "piloteAudace", "musiqueSensibilite", "kickMots", "musiquePulse", "musiqueFlash", "musiqueEffets", "halo", "kaleido", "larsen", "rvb", "palette", "degrade"],
  jeu: ["mainPerso1", "mainPerso2", "mainVie", "mainTaille", "mainSensibilite", "mainVent", "mainEnvol", "mainNotes", "mainVibre", "sonGamme", "volume", "scene", "vitesse", "trainees"],
  auto: ["piloteTemperament", "piloteAudace", "piloteSet", "cvActif", "cvDose", "cvSonsMots", "sonEvolution", "son", "volume", "vitesse", "poemeMax", "piloteCombos"],
};
const JOUER_NOMS = { poesie: "Poésie", vjing: "VJing", jeu: "Jeu vidéo", auto: "Full auto" };

// L'essentiel : ce qui reste en vue sans deplier l'avance. Le reste (reglage fin, technique, cases
// d'affichage du texte, tremolo...) est dans « Avance », replie.
const ESSENTIEL = new Set([
  "scene", "vitesse", "tenue", "poemeMax", "fonduDuree",
  "palette", "modeCouleur", "teinteMots", "vivacite", "fond", "trainees", "fondPulse",
  "halo", "kaleido", "kaleidoTourne", "larsen", "rvb", "ondes", "choc", "pompe", "bichromie", "miroir",
  "degrade", "saturation", "contraste", "exposition", "vieilleTele", "vhs", "grain",
  "calque", "calqueOpacite", "calqueMelange", "calquePlace",
  "police", "taille", "espacement", "tremblement", "ondulation", "respiration", "lueur", "glitch",
  "t3Rotation", "t3Perspective", "t3Musique", "t3Guide", "paysVitesse", "paysDensite", "paysLoin",
  "son", "volume", "sonSuit", "sonGamme", "sonEvolution", "sonTimbre",
  "sonTempo", "sonDensite", "sonTenue", "sonPattern", "sonBanque", "sonBourdon", "sonPoussiere",
  "sonReverb", "sonEcho", "sonFiltre", "sonVoix", "sonVoixNiveau", "sonVoixRev", "sonVoixEcho",
  "musiqueSource", "musiqueSensibilite", "kickMots", "caisseMots", "charleyMots", "musiquePulse", "musiqueFlash", "musiqueEffets",
  "voixSeuil", "voixAvance", "voixSilence", "voixEcrit",
  "cvActif", "cvDose", "cvSonsMots", "cvPatchs", "cvAudace", "cvRythme",
  "pilote", "piloteAudace", "piloteTemperament", "piloteRythme",
  "presetFondu", "hasardDose", "mainSensibilite", "mainNotes", "mainVie", "mainTaille", "mainVibre",
  "mainPerso1", "mainPerso2", "mainPerso3", "mainPerso4",
]);
// les poetes qu'on peut jouer (live.js, 2026-10-19) : en vue, pas dans l'avance
for (const c in DEFAUTS) if (/^mainJouable/.test(c)) ESSENTIEL.add(c);
// l'essentiel qui depend de l'etat : les effets branches sur le son, les LFO et les cables branches
// (plus le premier libre, pour en brancher un sans deplier)
function rgEssentielSi(cle) {
  let m;
  if ((m = /^mod(.+?)(Src)?$/.exec(cle)) && REGLAGE["mod" + m[1]]) return Number(S["mod" + m[1]]) !== 0;
  if ((m = /^lfo(\d)(Cible|Forme|Duree|Amplitude)$/.exec(cle))) return S["lfo" + m[1] + "Cible"] !== "aucune" || (m[2] === "Cible" && rgPremierLibre("lfo", "Cible") === m[1]);
  if ((m = /^cv(\d)(Src|Dst|Quantite|Lissage)$/.exec(cle))) return S["cv" + m[1] + "Src"] !== "aucune" || (m[2] === "Src" && rgPremierLibre("cv", "Src") === m[1]);
  return false;
}
function rgPremierLibre(pre, suf) {
  for (let i = 1; i <= 9; i++) if (REGLAGE[pre + i + suf] && S[pre + i + suf] === "aucune") return String(i);
  return null;
}
// ce qui ne sert que si un autre reglage est allume : cache en vue, grise dans l'avance
const RG_DEPEND = {
  teinteMots: () => S.modeCouleur === "teinte",
  persoFond: () => S.palette === "perso", persoFond2: () => S.palette === "perso", persoTexte: () => S.palette === "perso",
  persoAccent: () => S.palette === "perso", persoNote: () => S.palette === "perso",
  seuilHalo: () => S.halo > 0, strobeFreq: () => S.strobe > 0, frequence: () => S.tremblement > 0,
  kaleidoTourne: () => S.kaleido > 0, kaleidoSpirale: () => S.kaleido > 0, kaleidoStable: () => S.kaleido > 0,
  larsenZoom: () => S.larsen > 0, larsenRotation: () => S.larsen > 0, larsenTeinte: () => S.larsen > 0,
  degradeForce: () => S.degrade !== "aucun",
  vhs: () => !!S.vieilleTele, courbure: () => !!S.vieilleTele, balayage: () => !!S.vieilleTele, grain: () => !!S.vieilleTele,
  vignetteGpu: () => !!S.vieilleTele, crt: () => !!S.vieilleTele,
  sonVibratoVitesse: () => S.sonVibrato > 0, sonTremoloVitesse: () => S.sonTremolo > 0, sonResonance: () => Number(S.sonBalayage) !== 0,
  sonDivision: () => S.sonSuit === "musique", sonCycle: () => S.sonEvolution > 0,
  sonModRythme: () => S.sonModPart > 0, sonModCycle: () => S.sonModPart > 0, sonModEvenements: () => S.sonModPart > 0,
  kickSeuil: () => S.kickMots > 0, kickRelache: () => S.kickMots > 0, kickSens: () => S.kickMots > 0,
  caisseSeuil: () => S.caisseMots > 0, caisseRelache: () => S.caisseMots > 0, charleySeuil: () => S.charleyMots > 0, charleyRelache: () => S.charleyMots > 0,
  cvSonsMotsQuand: () => S.cvSonsMots > 0,
};
function rgDepend(cle) {
  if (RG_DEPEND[cle]) return RG_DEPEND[cle]();
  let m;
  if (/^calque./.test(cle)) return S.calque !== "aucun";
  if (/^sonVoix./.test(cle)) return !!S.sonVoix;
  if (/^pilote./.test(cle)) return !!S.pilote;
  if ((m = /^lfo(\d)(Forme|Duree|Amplitude)$/.exec(cle))) return S["lfo" + m[1] + "Cible"] !== "aucune";
  if ((m = /^cv(\d)(Dst|Quantite|Lissage)$/.exec(cle))) return S["cv" + m[1] + "Src"] !== "aucune";
  if ((m = /^mod(.+)Src$/.exec(cle))) return Number(S["mod" + m[1]]) !== 0;
  return true;
}
// les groupes de l'onglet Mouvements : la scene qu'ils reglent (en vue : la scene en cours et la
// seconde scene du combo seulement)
const RG_GROUPE_SCENE = { "Scène Lecture seulement": "lecture", "Tourbillon": "tourbillon", "Champ d'étoiles": "etoiles", "Texte 3D": "texte3d",
  "Mystifier": "mystifier", "Texte défilant": "defilement", "Calligramme": "calligramme", "Le puits": "puits", "Les crêtes": "cretes",
  "L'averse": "averse", "La rosace": "rosace", "Un mot par temps": "battement", "L'oscilloscope": "onde", "Planche à billets": "billets",
  "Machine à sous": "machine" };
// « Le son mène » : l'effet de l'image que chaque modulation pousse (MODS, valeur du shader -> cle de S)
const RG_MOD_CLE = { halo: "halo", rvb: "rvb", ondes: "ondes", mosaique: "mosaique", blocs: "blocs", fonte: "fonte", larsen: "larsen",
  lZoom: "larsenZoom", kTourne: "kaleidoTourne", kSpirale: "kaleidoSpirale", sat: "saturation", contraste: "contraste", expo: "exposition",
  decal: "decalage", chroma: "chroma", solar: "solarisation", bichro: "bichromie", vhs: "vhs", courbure: "courbure", grain: "grain", vignette: "vignetteGpu" };

/* ---------------------------------------------------- l'etat du rangement */

const rgSansParenthese = t => String(t || "").replace(/\s*\(.*$/, "").trim();
const rgPlat = t => String(t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const rangement = {
  pages: {},       // "famille/sous" -> { famille, sous, el, groupes: [], avance, avanceCorps, avanceTitre }
  lignes: {},      // cle -> { cle, el, groupe, page } : la vue maitre de chaque reglage
  jouerMode: null,
  bougeN: 0,
  pret: false,
  actif() { return !rgPref.ancien; },

  /* -------- construire */
  construire() {
    this.pages = {}; this.lignes = {}; this.jouerMode = null; this.pret = false;
    panneau.classList.add("rg");
    this.taille(rgPref.texte, true);
    panneau.style.width = Math.min(rgPref.largeur || 560, Math.max(380, innerWidth - 16)) + "px";
    if (rgPref.hauteur) panneau.style.setProperty("--rg-h", rgPref.hauteur + "px");
    this.barreBoutons();
    this.grip();
    // les barres : sous-onglets, outils (recherche, ce qui bouge, l'avance)
    this.sousEl = document.createElement("div"); this.sousEl.className = "rg-sous";
    this.outilsEl = document.createElement("div"); this.outilsEl.className = "rg-outils";
    this.chercherEl = document.createElement("input"); this.chercherEl.type = "search"; this.chercherEl.placeholder = "Chercher un réglage (Maj + P)…";
    this.chercherEl.setAttribute("aria-label", "Chercher un réglage");
    this.chercherEl.addEventListener("input", () => { this.vue = this.chercherEl.value.trim() ? "chercher" : null; this.montrer(); });
    this.chercherEl.addEventListener("keydown", e => {
      if (e.key === "Enter") { const r = this.resultatsEl.querySelector(".rg-resultat"); if (r) r.click(); }
      if (e.key === "Escape") { e.stopPropagation(); this.chercherEl.value = ""; this.vue = null; this.montrer(); this.chercherEl.blur(); }
    });
    this.bougeB = this.bouton("Ce qui bouge", () => { this.vue = this.vue === "bouge" ? null : "bouge"; this.chercherEl.value = ""; this.montrer(); }, "petit", "Les réglages qu'un LFO, un câble, le son ou le pilote font bouger");
    this.avanceB = this.bouton("Avancé : replié", () => {
      rgPref.avanceOuvert = !rgPref.avanceOuvert;
      for (const k in rgPref.replis) if (/\|avance$/.test(k)) delete rgPref.replis[k];
      rgGarder();
      for (const id in this.pages) this.replier(this.pages[id].avance, id + "|avance", !rgPref.avanceOuvert);
      this.majBarres();
    }, "petit", "Montrer partout ce qui est rangé dans l'avancé");
    this.outilsEl.append(this.chercherEl, this.bougeB, this.avanceB);
    pagesEl.append(this.sousEl, this.outilsEl);
    // les familles
    for (const f of RANGEMENT) {
      const o = document.createElement("div"); o.className = "onglet"; o.dataset.famille = f.id;
      const i = f.nom.toLowerCase().indexOf(f.lettre.toLowerCase());
      o.append(document.createTextNode(f.nom.slice(0, i)));
      const u = document.createElement("u"); u.textContent = f.nom[i]; o.appendChild(u);
      o.append(document.createTextNode(f.nom.slice(i + 1)));
      o.title = f.nom + " (Alt + " + f.lettre + ")";
      o.addEventListener("click", () => this.aller(f.id));
      ongletsEl.appendChild(o);
    }
    // les pages
    const staging = document.createElement("div");
    if (typeof construireModes === "function") construireModes(staging);
    const deplaces = new Set();
    for (const f of RANGEMENT) for (const s of f.sous || []) for (const gr of s.groupes || []) for (const c of (gr.plus || []).concat(gr.cles || [])) deplaces.add(c);
    const pris = new Set();
    this.creerPage({ id: "jouer", nom: "Jouer" }, RANGEMENT[0]);
    for (const f of RANGEMENT) for (const s of f.sous || []) this.creerPage(s, f);
    for (const f of RANGEMENT) for (const s of f.sous || []) this.remplir(f, s, deplaces, pris, staging);
    this.orphelins(pris, deplaces);
    this.construireJouer(staging);
    // ce que construireModes a fait et que personne n'a pris (un cadre ajoute demain) : Systeme > Presets
    for (const fs of [...staging.children]) this.pages["systeme/presets"].el.appendChild(fs);
    // les vues des resultats
    this.resultatsEl = document.createElement("div"); this.resultatsEl.className = "page"; this.resultatsEl.hidden = true;
    pagesEl.appendChild(this.resultatsEl);
    // les rangees de presets par categorie : une par categorie, posee sur sa premiere sous-page ;
    // elle suit ensuite la sous-page montree (montrerRangees)
    if (typeof pc !== "undefined" && typeof construireRangeeCategorie === "function") {
      for (const id in this.pages) for (const o of this.pages[id].sous.categories || []) {
        const cat = PC_CATEGORIES.find(c => c.onglet === o);
        if (cat && !pc.rangees[cat.id]) { try { construireRangeeCategorie({ onglet: o }, this.pages[id].el); } catch (e) { console.error("poiasie : presets de catégorie", e); } }
      }
    }
    this.pret = true;
    this.placer(true);
    this.montrer();
  },
  creerPage(s, f) {
    const el = document.createElement("div"); el.className = "page"; el.hidden = true; el.dataset.page = f.id + (f.sous ? "/" + s.id : "");
    pagesEl.appendChild(el);
    const id = el.dataset.page;
    this.pages[id] = { famille: f, sous: s, el, groupes: [] };
    return this.pages[id];
  },
  remplir(f, s, deplaces, pris, staging) {
    const id = f.id + "/" + s.id, p = this.pages[id], el = p.el;
    if (s.moniteur) {
      const mon = document.createElement("div"); mon.className = "moniteur";
      mon.innerHTML = '<div class="ecran-mini"><canvas width="164" height="110"></canvas></div><div class="pied-mini"></div><div class="socle"></div>';
      el.appendChild(mon); miniature = mon.querySelector("canvas").getContext("2d");
    }
    if (s.special === "generateur") { construireGenerateur(el); return; }
    if (s.special === "apropos") { construireApropos(el); return; }
    if (s.special === "musique") construireMusique(el);
    if (s.special === "manette") construireManette(el);
    if (s.special === "son" && typeof construireSon === "function") construireSon(el);
    for (const gr of s.groupes || []) {
      if (gr.de) {
        const [onglet, debut] = gr.de.split(" / ");
        const o = SCHEMA.find(x => x.onglet === onglet);
        for (const g of (o && o.groupes) || []) {
          if (!(debut === "*" || (g.titre || "").startsWith(debut)) || pris.has(onglet + " / " + g.titre)) continue;
          pris.add(onglet + " / " + g.titre);
          const items = (g.items || []).filter(it => it.cle && !deplaces.has(it.cle)).concat((gr.plus || []).map(c => REGLAGE[c]).filter(Boolean));
          this.groupe(p, { titre: gr.titre || g.titre, items, ambiances: g.ambiances, onglet,
            scene: s.parScene ? RG_GROUPE_SCENE[rgSansParenthese(g.titre)] || null : undefined });
        }
      }
      if (gr.cles) {
        // des reglages pris un par un : ceux de modes.js existent deja (lignes du cadre adopte)
        const items = gr.cles.filter(c => REGLAGE[c]).map(c => REGLAGE[c]);
        const existants = items.map(it => staging.querySelector('.ligne[data-cle="' + it.cle + '"]'));
        this.groupe(p, { titre: gr.titre, items, existants });
      }
    }
    // les cadres de l'onglet Modes (modes.js) qui reviennent a cette page, par le debut de leur titre
    for (const debut of s.adopte || []) for (const fs of [...staging.children]) {
      const lg = fs.querySelector("legend");
      if (!lg || !lg.textContent.startsWith(debut)) continue;
      el.appendChild(fs);
      this.groupe(p, { titre: rgSansParenthese(lg.textContent), fs, cles: [...fs.querySelectorAll(".ligne[data-cle]")].map(x => x.dataset.cle) });
    }
    if (s.special === "fenetre") this.cadreFenetre(el);
  },
  // un groupe : son cadre en vue (ses reglages essentiels), et son cadre dans l'avance
  groupe(p, d) {
    const id = p.el.dataset.page, cleRepli = id + "|" + d.titre;
    let fs = d.fs;
    if (!fs) {
      fs = document.createElement("fieldset");
      const lg = document.createElement("legend"); lg.textContent = d.titre; fs.appendChild(lg);
      if (d.ambiances) {
        const sel = document.createElement("select");
        const noms = Object.keys(AMBIANCES).filter(a => d.ambiances !== "combo" || a.startsWith("Combo"));
        sel.innerHTML = '<option value="">(choisir ' + (d.ambiances === "combo" ? "un combo" : "une ambiance") + ')</option>' + noms.map(a => "<option>" + a + "</option>").join("");
        sel.addEventListener("change", () => { if (sel.value) poserAmbiance(sel.value); sel.value = ""; });
        const r = document.createElement("div"); r.className = "rangee"; r.style.marginTop = "0"; r.appendChild(sel);
        fs.appendChild(r);
        fs.dataset.contenu = "1";
      }
      p.el.appendChild(fs);
    } else fs.dataset.contenu = "1";
    this.repliable(fs, cleRepli, false);
    const g = { titre: d.titre, fs, scene: d.scene, cles: [], page: id };
    (d.items || []).forEach((it, i) => {
      const el = (d.existants && d.existants[i]) || construireControle(it);
      this.ligne(it.cle, el, g);
    });
    for (const c of d.cles || []) { const el = fs.querySelector('.ligne[data-cle="' + c + '"]'); if (el) this.ligne(c, el, g); }
    p.groupes.push(g);
    return g;
  },
  ligne(cle, el, g) {
    if (this.lignes[cle]) return;  // une seule vue maitre
    el.dataset.cle = cle;
    // l'etiquette de ce qui le fait bouger, et l'epingle
    const nom = el.querySelector("label") || el.firstElementChild;
    const badges = document.createElement("span"); badges.className = "rg-badges"; nom.appendChild(badges);
    el.appendChild(this.epingle(cle));
    g.cles.push(cle);
    this.lignes[cle] = { cle, el, groupe: g, page: g.page, badges };
  },
  epingle(cle) {
    const b = document.createElement("button"); b.type = "button"; b.className = "rg-epingle";
    const maj = () => { const oui = rgPref.epingles.includes(cle); b.textContent = oui ? "★" : "☆"; b.classList.toggle("oui", oui); b.title = oui ? "Retirer de la page Jouer" : "Épingler sur la page Jouer"; };
    b.addEventListener("click", e => {
      e.preventDefault();
      rgPref.epingles = rgPref.epingles.includes(cle) ? rgPref.epingles.filter(c => c !== cle) : rgPref.epingles.concat(cle);
      rgGarder(); maj(); this.majEpingles();
    });
    b.majEpingle = maj; maj();
    return b;
  },
  // les groupes que personne n'a ranges
  orphelins(pris, deplaces) {
    let nouveautes = null;
    for (const o of SCHEMA) for (const g of o.groupes || []) {
      if (pris.has(o.onglet + " / " + g.titre) || !(g.items || []).length) continue;
      pris.add(o.onglet + " / " + g.titre);
      let p = this.pages[ONGLET_PAGE[o.onglet]];
      if (!p) {
        if (!nouveautes) {
          const sys = RANGEMENT.find(f => f.id === "systeme"), s = { id: "nouveautes", nom: "Nouveautés" };
          if (!sys.sous.some(x => x.id === "nouveautes")) sys.sous.splice(sys.sous.length - 2, 0, s);
          nouveautes = this.creerPage(sys.sous.find(x => x.id === "nouveautes"), sys);
        }
        p = nouveautes;
      }
      const grp = this.groupe(p, { titre: o.onglet + " : " + g.titre, items: g.items.filter(it => it.cle && !deplaces.has(it.cle)) });
      grp.orphelin = p !== nouveautes;   // dans une page connue : dans l'avance ; dans Nouveautes : en vue
    }
  },
  repliable(fs, cle, defaut) {
    const lg = fs.querySelector("legend");
    if (!lg || lg.dataset.rg) return;
    lg.dataset.rg = "1";
    const fl = document.createElement("span"); fl.className = "rg-fleche"; lg.insertBefore(fl, lg.firstChild);
    lg.addEventListener("click", () => { const r = !fs.classList.contains("rg-replie"); this.replier(fs, cle, r); rgPref.replis[cle] = r; rgGarder(); });
    this.replier(fs, cle, cle in rgPref.replis ? rgPref.replis[cle] : defaut);
  },
  replier(fs, cle, r) {
    if (!fs) return;
    fs.classList.toggle("rg-replie", !!r);
    const fl = fs.querySelector(":scope > legend > .rg-fleche"); if (fl) fl.textContent = r ? "►" : "▼";
  },

  /* -------- la page Jouer */
  construireJouer(staging) {
    const p = this.pages.jouer, el = p.el;
    // dans l'ordre : le mode, les gestes, les reglages du mode, ses presets, mes epingles
    const deModes = debut => [...staging.children].find(fs => { const lg = fs.querySelector("legend"); return lg && lg.textContent.startsWith(debut); });
    const fsMode = deModes("Le mode"), fsPresets = deModes("Les presets du mode");
    if (fsMode) { el.appendChild(fsMode); this.repliable(fsMode, "jouer|mode", false); }
    const g = document.createElement("fieldset");
    g.innerHTML = "<legend>Les gestes</legend>";
    const grille = document.createElement("div"); grille.className = "rg-gestes";
    this.gestes = {
      sobre: this.bouton("Sobre", () => toutEteindre(), "gros", "Tous les effets éteints (Retour arrière)"),
      hasard: this.bouton("Un peu de hasard", () => auHasard(0.2), "gros", "Touche !"),
      frais: this.bouton("Un départ frais", () => { if (typeof departFraisPartout === "function") departFraisPartout(); }, "gros", "Toutes les pages repartent de réglages frais (touche *, Maj + * : comme avant)"),
      pilote: this.bouton("Pilote", () => { basculerPilote(); this.majGestes(); }, "gros", "² ou F2"),
      son: this.bouton("Son", () => { changer("son", !S.son); if (controles.son) controles.son.maj(); this.majGestes(); }, "gros", "Touche S"),
      musique: this.bouton("Écouter", () => { basculerMusique(); setTimeout(() => this.majGestes(), 300); }, "gros", "Touche M"),
      flash: this.bouton("Flash", () => flash(), "gros", "Entrée"),
    };
    grille.append(...Object.values(this.gestes));
    g.appendChild(grille); el.appendChild(g);
    this.repliable(g, "jouer|gestes", false);
    this.jouerFs = document.createElement("fieldset"); el.appendChild(this.jouerFs);
    if (fsPresets) { el.appendChild(fsPresets); this.repliable(fsPresets, "jouer|presets", false); }
    this.epinglesFs = document.createElement("fieldset"); el.appendChild(this.epinglesFs);
    this.majJouer(true);
    this.majEpingles();
  },
  // une copie d'un reglage (Jouer, epingles, recherche) : controles[cle] la met a jour avec la vue maitre
  copie(cle) {
    const it = REGLAGE[cle];
    if (!it) return null;
    const el = construireControle(it);
    el.dataset.rgSecondaire = "1";
    el.title = this.chemin(cle);
    return el;
  },
  majJouer(force) {
    const mode = JOUER[S.mode] ? S.mode : "vjing";
    if (!force && mode === this.jouerMode) return;
    this.jouerMode = mode;
    const fs = this.jouerFs;
    fs.replaceChildren();
    const lg = document.createElement("legend"); lg.textContent = "En jeu : " + JOUER_NOMS[mode]; fs.appendChild(lg);
    for (const c of JOUER[mode]) { const x = this.copie(c); if (x) fs.appendChild(x); }
    delete fs.querySelector("legend").dataset.rg;
    this.repliable(fs, "jouer|enjeu", false);
  },
  majEpingles() {
    const fs = this.epinglesFs;
    if (!fs) return;
    fs.replaceChildren();
    const lg = document.createElement("legend"); lg.textContent = "Mes épingles (☆ au bout d'une ligne, sur n'importe quelle page)"; fs.appendChild(lg);
    const l = rgPref.epingles.filter(c => REGLAGE[c]);
    if (!l.length) fs.appendChild(this.aide("Aucune pour l'instant."));
    for (const c of l) { const x = this.copie(c); if (x) fs.appendChild(x); }
    this.repliable(fs, "jouer|epingles", false);
    for (const c in this.lignes) { const b = this.lignes[c].el.querySelector(":scope > .rg-epingle"); if (b && b.majEpingle) b.majEpingle(); }
  },
  majGestes() {
    if (!this.gestes) return;
    const g = this.gestes;
    g.pilote.textContent = "Pilote : " + (S.pilote ? "allumé" : "éteint"); g.pilote.classList.toggle("rg-enfonce", !!S.pilote);
    g.son.textContent = "Son : " + (S.son ? "allumé" : "coupé"); g.son.classList.toggle("rg-enfonce", !!S.son);
    const m = typeof musique !== "undefined" && musique.actif;
    g.musique.textContent = m ? "Écoute : oui" : "Écouter"; g.musique.classList.toggle("rg-enfonce", !!m);
  },

  /* -------- la fenetre (Systeme > Machine et fenetre) */
  cadreFenetre(el) {
    const fs = document.createElement("fieldset");
    fs.innerHTML = "<legend>La fenêtre des réglages</legend>";
    fs.appendChild(this.aide("Taille du texte : A- et A+ dans la barre de titre. La fenêtre s'agrandit par la poignée, en bas à droite. Alt + la lettre soulignée ouvre une famille ; Maj + P : chercher."));
    const r = document.createElement("div"); r.className = "rangee";
    r.appendChild(this.bouton("Revenir à l'ancien panneau", () => basculerAncienPanneau(true), "", "Le panneau d'avant le 19 octobre, tel quel (un bouton « Nouveau panneau » permet de revenir)"));
    r.appendChild(this.bouton("Remettre la fenêtre comme au départ", () => {
      Object.assign(rgPref, { texte: 11, largeur: 560, hauteur: 0, replis: {}, avanceOuvert: false });
      rgGarder(); reconstruirePanneau();
    }, ""));
    fs.appendChild(r);
    el.appendChild(fs);
  },
  barreBoutons() {
    const barre = panneau.querySelector(".boutons-barre"), aide = document.getElementById("b-aide");
    if (!barre || barre.querySelector(".rg-taille")) return;
    for (const [t, d, titre] of [["A-", -1, "Texte plus petit"], ["A+", 1, "Texte plus grand"]]) {
      const b = document.createElement("button"); b.type = "button"; b.className = "rg-taille"; b.textContent = t; b.title = titre;
      b.addEventListener("click", () => this.taille(rgPref.texte + d));
      barre.insertBefore(b, aide);
    }
  },
  grip() {
    if (panneau.querySelector(".rg-grip")) return;
    const g = document.createElement("div"); g.className = "rg-grip"; g.title = "Agrandir la fenêtre";
    let prise = null;
    g.addEventListener("pointerdown", e => { const page = pagesEl.querySelector(".page:not([hidden])"); prise = { x: e.clientX, y: e.clientY, w: panneau.offsetWidth, h: page ? page.offsetHeight : 430 }; g.setPointerCapture(e.pointerId); });
    g.addEventListener("pointermove", e => {
      if (!prise) return;
      rgPref.largeur = Math.round(clamp(prise.w + e.clientX - prise.x, 380, innerWidth - panneau.offsetLeft - 4));
      rgPref.hauteur = Math.round(clamp(prise.h + e.clientY - prise.y, 160, innerHeight - 200));
      panneau.style.width = rgPref.largeur + "px";
      panneau.style.setProperty("--rg-h", rgPref.hauteur + "px");
    });
    g.addEventListener("pointerup", () => { prise = null; rgGarder(); });
    panneau.appendChild(g);
  },
  taille(t, sansGarder) {
    rgPref.texte = clamp(Math.round(t), 10, 16);
    panneau.style.setProperty("--rg-t", rgPref.texte + "px");
    if (!sansGarder) rgGarder();
  },

  /* -------- montrer une page */
  aller(famille, sous) {
    const f = RANGEMENT.find(x => x.id === famille);
    if (!f) return;
    rgPref.famille = famille;
    if (sous) rgPref.sous[famille] = sous;
    this.vue = null; if (this.chercherEl) this.chercherEl.value = "";
    rgGarder();
    this.montrer();
  },
  idCourant() {
    const f = RANGEMENT.find(x => x.id === rgPref.famille) || RANGEMENT[0];
    if (!f.sous) return f.id;
    const s = f.sous.find(x => x.id === rgPref.sous[f.id]) || f.sous[0];
    return f.id + "/" + s.id;
  },
  montrer() {
    if (!this.pret) return;
    const f = RANGEMENT.find(x => x.id === rgPref.famille) || RANGEMENT[0], id = this.idCourant();
    for (const o of ongletsEl.children) o.classList.toggle("actif", o.dataset.famille === f.id);
    this.sousEl.replaceChildren();
    this.sousEl.hidden = !f.sous;
    for (const s of f.sous || []) {
      const b = document.createElement("button"); b.type = "button"; b.textContent = s.nom;
      b.className = f.id + "/" + s.id === id && !this.vue ? "actif" : "";
      b.addEventListener("click", () => this.aller(f.id, s.id));
      this.sousEl.appendChild(b);
    }
    for (const k in this.pages) this.pages[k].el.hidden = this.vue || k !== id;
    this.resultatsEl.hidden = !this.vue;
    if (this.vue === "chercher") this.dessinerRecherche(this.chercherEl.value.trim());
    else if (this.vue === "bouge") this.dessinerBouge();
    else this.resultatsEl.replaceChildren();
    const p = this.pages[id];
    if (!this.vue && p) {
      this.montrerRangees(p);
      if (p.sous.special === "generateur") rafraichirGenerateur();
      if (id === "jouer") { this.majJouer(); this.majGestes(); }
    }
    this.majBarres();
    this.placer(true);
  },
  // la rangee de presets d'une categorie suit la sous-page montree (une seule rangee par categorie)
  montrerRangees(p) {
    if (typeof pc === "undefined") return;
    const l = (p.sous.categories || []).map(o => PC_CATEGORIES.find(c => c.onglet === o)).filter(Boolean).map(c => pc.rangees[c.id]).filter(Boolean);
    for (let i = l.length - 1; i >= 0; i--) {
      const x = l[i];
      x.page = p.el;
      p.el.insertBefore(x.fs, p.el.firstChild);
    }
  },
  majBarres() {
    if (!this.avanceB) return;
    this.avanceB.textContent = "Avancé : " + (rgPref.avanceOuvert ? "déplié" : "replié");
    this.avanceB.classList.toggle("rg-enfonce", !!rgPref.avanceOuvert);
    this.bougeB.textContent = "Ce qui bouge (" + this.bougeN + ")";
    this.bougeB.classList.toggle("rg-enfonce", this.vue === "bouge");
  },

  /* -------- placer : chaque ligne en vue ou dans l'avance, selon l'etat */
  sceneEnCours() { return typeof sceneCle !== "undefined" && sceneCle ? sceneCle : S.scene; },
  enVue(g, c) {
    if (g.orphelin) return false;
    if (g.scene !== undefined) {
      const sc = this.sceneEnCours(), sec = S.calque !== "aucun" ? (S.calque === "auto" && typeof calque !== "undefined" ? calque.cle : S.calque) : null;
      return !!g.scene && (g.scene === sc || g.scene === sec) && rgDepend(c);
    }
    return (ESSENTIEL.has(c) || rgEssentielSi(c)) && rgDepend(c);
  },
  placer(force) {
    if (!this.pret || panneau.hidden && !force) return;
    const actif = document.activeElement;
    for (const id in this.pages) {
      const p = this.pages[id];
      if (!p.groupes.length) continue;
      let nAvance = 0;
      for (const g of p.groupes) {
        const vue = [], av = [];
        for (const c of g.cles) {
          const l = this.lignes[c];
          if (!l) continue;
          const en = this.enVue(g, c);
          // une ligne qu'on tient (curseur saisi, menu ouvert) ne bouge pas sous la main
          const tenue = l.el.contains(actif) || (this.saisie && l.el.contains(this.saisie));
          (tenue ? (l.el.parentNode === g.fs ? vue : av) : en ? vue : av).push(l);
          l.el.classList.toggle("rg-eteinte", !rgDepend(c));
        }
        if (av.length && !g.avFs) this.cadreAvance(p, g);
        this.ranger(g.fs, vue);
        if (g.avFs) { this.ranger(g.avFs, av); g.avFs.hidden = !av.length; }
        g.fs.hidden = !vue.length && !g.fs.dataset.contenu;
        nAvance += av.length;
      }
      if (p.avance) {
        p.avance.hidden = !nAvance;
        p.avanceTitre.textContent = "Avancé (" + nAvance + " réglage" + (nAvance > 1 ? "s" : "") + ")";
        p.el.appendChild(p.avance);   // l'avance reste en bas
      }
    }
    this.majBadges();
  },
  ranger(conteneur, lignes) {
    const actuelles = [...conteneur.children].filter(x => x.classList.contains("ligne") && x.dataset.cle && this.lignes[x.dataset.cle] && this.lignes[x.dataset.cle].el === x);
    if (actuelles.length === lignes.length && actuelles.every((x, i) => x === lignes[i].el)) return;
    for (const l of lignes) conteneur.appendChild(l.el);
  },
  cadreAvance(p, g) {
    const id = p.el.dataset.page;
    if (!p.avance) {
      p.avance = document.createElement("fieldset"); p.avance.className = "rg-avance";
      const lg = document.createElement("legend"); p.avanceTitre = document.createElement("span"); p.avanceTitre.textContent = "Avancé";
      lg.appendChild(p.avanceTitre); p.avance.appendChild(lg);
      p.avance.appendChild(this.aide("Rien n'est supprimé : ce qu'on touche rarement est rangé ici. Grisé : sans effet tant que le réglage dont il dépend est éteint."));
      p.el.appendChild(p.avance);
      this.repliable(p.avance, id + "|avance", !rgPref.avanceOuvert);
    }
    g.avFs = document.createElement("fieldset");
    const lg = document.createElement("legend"); lg.textContent = g.titre; g.avFs.appendChild(lg);
    p.avance.appendChild(g.avFs);
    this.repliable(g.avFs, id + "|avance|" + g.titre, false);
  },

  /* -------- ce qui bouge */
  bouge(cle) {
    const r = [];
    for (let i = 1; i <= LFO_NB; i++) if (S["lfo" + i + "Cible"] === cle && S["lfo" + i + "Amplitude"] > 0) r.push(["lfo", "LFO " + i, "lfo" + i + "Cible"]);
    if (typeof cv !== "undefined" && S.cvActif) {
      for (let i = 1; i <= (typeof CV_NB !== "undefined" ? CV_NB : 8); i++) if (S["cv" + i + "Src"] !== "aucune" && S["cv" + i + "Dst"] === cle) r.push(["cable", "câble " + i, "cv" + i + "Src"]);
      try { if (cv.auto && typeof cv.enAuto === "function" && cv.enAuto() && cv.auto.actuel && cv.auto.actuel.cables.some(c => c.dst === cle)) r.push(["cable", "patch auto", "cvActif"]); } catch (e) { /* rien */ }
    }
    for (const m of MODS) if (RG_MOD_CLE[m[2]] === cle && Number(S["mod" + m[0]]) !== 0) r.push(["son", "le son", "mod" + m[0]]);
    if (S.pilote && typeof pilote !== "undefined" && pilote.cibles && cle in pilote.cibles) r.push(["pilote", "pilote", "pilote"]);
    return r;
  },
  majBadges() {
    let n = 0;
    for (const c in this.lignes) {
      const l = this.lignes[c], b = this.bouge(c);
      if (b.length) n++;
      const sig = b.map(x => x[1]).join("|");
      if (l.badges.dataset.sig === sig) continue;
      l.badges.dataset.sig = sig;
      l.badges.replaceChildren(...b.map(x => this.badge(x)));
    }
    if (n !== this.bougeN) { this.bougeN = n; this.majBarres(); }
  },
  badge([type, nom, vers]) {
    const s = document.createElement("span"); s.className = "rg-badge rg-" + type; s.textContent = nom; s.title = "Tenu par " + nom + " : clic pour y aller";
    s.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); this.allerA(vers); });
    return s;
  },
  dessinerBouge() {
    const el = this.resultatsEl;
    el.replaceChildren();
    const fs = document.createElement("fieldset"), l = Object.keys(this.lignes).map(c => [c, this.bouge(c)]).filter(([, b]) => b.length);
    fs.innerHTML = "<legend>Ce qui bouge en ce moment : " + l.length + "</legend>";
    fs.appendChild(this.aide("Les réglages qu'un LFO, un câble, le son ou le pilote font bouger. Clic sur le nom : sa page ; clic sur l'étiquette : ce qui le tient."));
    if (!l.length) fs.appendChild(this.aide("Rien ne bouge tout seul."));
    for (const [c, b] of l) {
      const r = document.createElement("div"); r.className = "rangee"; r.style.marginTop = "2px";
      const n = document.createElement("button"); n.type = "button"; n.className = "rg-resultat"; n.style.flex = "1"; n.textContent = REGLAGE[c].nom;
      n.addEventListener("click", () => this.allerA(c));
      r.append(n, ...b.map(x => this.badge(x)));
      fs.appendChild(r);
    }
    el.appendChild(fs);
  },

  /* -------- chercher */
  chemin(cle) {
    const l = this.lignes[cle];
    if (!l) return "";
    const p = this.pages[l.page];
    return p.famille.nom + (p.famille.sous ? " › " + p.sous.nom : "") + " › " + rgSansParenthese(l.groupe.titre);
  },
  dessinerRecherche(q) {
    const el = this.resultatsEl, mots = rgPlat(q).split(/\s+/).filter(Boolean);
    el.replaceChildren();
    const l = Object.keys(this.lignes).filter(c => { const h = rgPlat(REGLAGE[c].nom + " " + this.chemin(c) + " " + c); return mots.every(m => h.includes(m)); });
    const fs = document.createElement("fieldset");
    const lg = document.createElement("legend"); lg.textContent = "Chercher « " + q + " » : " + l.length + " réglage" + (l.length > 1 ? "s" : ""); fs.appendChild(lg);
    if (!l.length) fs.appendChild(this.aide("Rien. Essaie un mot du nom du réglage (halo, écho, vitesse…)."));
    for (const c of l.slice(0, 60)) {
      const b = document.createElement("button"); b.type = "button"; b.className = "rg-resultat";
      b.append(document.createTextNode(REGLAGE[c].nom + " "));
      const sm = document.createElement("small"); sm.textContent = "(" + this.chemin(c) + (this.enVue(this.lignes[c].groupe, c) ? "" : ", avancé") + ")"; b.appendChild(sm);
      b.addEventListener("click", () => this.allerA(c));
      fs.appendChild(b);
    }
    if (l.length > 60) fs.appendChild(this.aide("… et " + (l.length - 60) + " de plus : précise."));
    el.appendChild(fs);
    if (l.length && l.length <= 8) {
      const fj = document.createElement("fieldset"); fj.innerHTML = "<legend>Directement ici</legend>";
      for (const c of l) { const x = this.copie(c); if (x) fj.appendChild(x); }
      el.appendChild(fj);
    }
  },
  chercher() {
    if (!this.chercherEl) return;
    this.chercherEl.focus(); this.chercherEl.select();
  },
  // aller a un reglage : sa page, son groupe et l'avance deplies, il clignote
  allerA(cle) {
    const l = this.lignes[cle];
    if (!l) return;
    const [f, s] = l.page.split("/");
    rgPref.famille = f; if (s) rgPref.sous[f] = s;
    this.vue = null; this.chercherEl.value = "";
    const p = this.pages[l.page], g = l.groupe;
    rgPref.replis[l.page + "|" + g.titre] = false; rgPref.replis[l.page + "|avance|" + g.titre] = false;
    if (!this.enVue(g, cle)) rgPref.replis[l.page + "|avance"] = false;
    rgGarder();
    this.replier(g.fs, l.page + "|" + g.titre, false);
    if (g.avFs) this.replier(g.avFs, l.page + "|avance|" + g.titre, false);
    if (!this.enVue(g, cle)) this.replier(p.avance, l.page + "|avance", false);
    this.montrer();
    l.el.scrollIntoView({ block: "center" });
    l.el.classList.remove("rg-cible"); void l.el.offsetWidth; l.el.classList.add("rg-cible");
    setTimeout(() => l.el.classList.remove("rg-cible"), 2200);
  },

  /* -------- le clavier : Alt + la lettre soulignee */
  raccourci(e) {
    const f = RANGEMENT.find(x => x.lettre.toLowerCase() === String(e.key).toLowerCase() || "Key" + x.lettre === e.code);
    if (!f) return false;
    basculerPanneau(true);
    this.aller(f.id);
    return true;
  },

  /* -------- petits outils */
  bouton(texte, f, classe, titre) {
    const b = document.createElement("button"); b.type = "button"; b.className = "bouton" + (classe ? " rg-" + classe : ""); b.textContent = texte;
    if (titre) b.title = titre;
    b.addEventListener("click", f); return b;
  },
  aide(texte) { const p = document.createElement("p"); p.className = "rg-aide"; p.textContent = texte; return p; },
  // chaque seconde, panneau ouvert : le pilote, les presets et la manette changent des reglages sans
  // passer par le panneau
  maj() {
    if (!this.pret || panneau.hidden || rgPref.ancien) return;
    this.placer();
    if (this.idCourant() === "jouer" && !this.vue) { this.majJouer(); this.majGestes(); }
    if (this.vue === "bouge") this.dessinerBouge();
  },
};

// une ligne saisie (curseur tenu a la souris) ne change pas de place
pagesEl.addEventListener("pointerdown", e => { rangement.saisie = e.target; });
window.addEventListener("pointerup", () => { if (rangement.saisie) { rangement.saisie = null; setTimeout(() => rangement.placer(), 60); } });
setInterval(() => rangement.maj(), 1000);

/* ---------------------------------------------------- les branchements */

// cv.js pose l'etat des cables en haut de « sa » page (pagesEl.children[index de l'onglet Cables]) :
// dans le nouveau panneau, cette page est la sous-page Modulation > Cables
if (typeof cv !== "undefined" && typeof cv.preparer === "function") {
  const preparerAvant = cv.preparer;
  cv.preparer = function () {
    const p = rangement.actif() && rangement.pages["modulation/cables"];
    if (!p) return preparerAvant.apply(this, arguments);
    const i = SCHEMA.findIndex(o => o.onglet === "Câbles"), cible = p.el;
    Object.defineProperty(pagesEl, "children", { configurable: true, get: () => ({ [i]: cible, length: i + 1 }) });
    try { return preparerAvant.apply(this, arguments); }
    finally { delete pagesEl.children; rangement.montrerRangees(p); }
  };
}

// le style du nouveau panneau (tout sous #panneau.rg : l'ancien panneau garde le sien, celui d'ecran.html)
{
  const st = document.createElement("style");
  st.id = "rg-style";
  st.textContent = `
  #panneau.rg { font-size: var(--rg-t, 11px); }
  #panneau.rg .onglets { flex-wrap: wrap; }
  #panneau.rg .onglet { padding: 3px 9px 2px; }
  #panneau.rg .onglet.actif { font-weight: bold; }
  #panneau.rg .page { height: var(--rg-h, min(470px, calc(100vh - 235px))); border-top: none; }
  #panneau.rg .rg-sous { display: flex; flex-wrap: wrap; gap: 2px; margin: 0 6px; padding: 5px 8px 4px; border: 1px solid; border-color: #fff var(--gris-fonce) transparent #fff; border-bottom: 1px solid var(--gris-fonce); }
  #panneau.rg .rg-sous[hidden] { display: none; }
  #panneau.rg .rg-sous button { font: inherit; background: transparent; border: 1px solid transparent; padding: 2px 7px; cursor: pointer; color: #000; }
  #panneau.rg .rg-sous button:hover { border-color: #fff var(--gris-fonce) var(--gris-fonce) #fff; }
  #panneau.rg .rg-sous button.actif { border-color: var(--gris-fonce) #fff #fff var(--gris-fonce); background: var(--gris-clair); }
  #panneau.rg .rg-outils { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; margin: 0 6px; padding: 5px 8px; border: 1px solid; border-color: transparent var(--gris-fonce) transparent #fff; }
  #panneau.rg .rg-sous[hidden] + .rg-outils { border-top: 1px solid #fff; }
  #panneau.rg .rg-outils input[type=search] { flex: 1 1 140px; font: inherit; background: #fff; border: 2px solid; border-color: var(--gris-fonce) #fff #fff var(--gris-fonce); padding: 1px 2px; min-width: 0; }
  #panneau.rg legend { cursor: default; user-select: none; }
  #panneau.rg legend[data-rg] { cursor: pointer; }
  #panneau.rg .rg-fleche { display: inline-block; width: 12px; font-size: 0.7em; vertical-align: 1px; }
  #panneau.rg fieldset.rg-replie > :not(legend) { display: none !important; }
  #panneau.rg fieldset.rg-replie { padding-bottom: 0; border-bottom-color: transparent; border-left-color: transparent; border-right-color: transparent; }
  #panneau.rg fieldset[hidden] { display: none; }
  #panneau.rg fieldset.rg-avance { border-style: dotted; border-color: var(--gris-fonce); }
  #panneau.rg .ligne { grid-template-columns: minmax(110px, 38%) 1fr 44px 16px; border: 1px solid transparent; }
  #panneau.rg .ligne.case { grid-template-columns: 1fr 16px; }
  #panneau.rg .ligne > span:first-child, #panneau.rg .ligne label { min-width: 0; }
  #panneau.rg .ligne.rg-eteinte > :not(.rg-epingle) { opacity: 0.45; }
  #panneau.rg .ligne.rg-cible { border-color: #000; background: #ffffe1; animation: rg-clignote 0.4s 4 steps(2); }
  @keyframes rg-clignote { 50% { background: var(--gris); } }
  #panneau.rg .rg-badges { display: inline-flex; gap: 3px; margin-left: 4px; vertical-align: 1px; }
  #panneau.rg .rg-badge { font-size: 0.82em; padding: 0 3px; border: 1px solid; background: #fff; white-space: nowrap; cursor: pointer; }
  #panneau.rg .rg-lfo { border-color: #000080; color: #000080; }
  #panneau.rg .rg-cable { border-color: #806000; color: #604800; }
  #panneau.rg .rg-son { border-color: #800060; color: #700050; }
  #panneau.rg .rg-pilote { border-color: #006000; color: #004d00; }
  #panneau.rg .rg-epingle { background: none; border: none; padding: 0; cursor: pointer; color: var(--gris-fonce); font: inherit; width: 16px; }
  #panneau.rg .rg-epingle.oui { color: #000080; }
  #panneau.rg .ligne:not(:hover) > .rg-epingle:not(.oui) { visibility: hidden; }
  #panneau.rg .ligne:not(:has(.rg-epingle)) { grid-template-columns: minmax(110px, 38%) 1fr 44px; }
  #panneau.rg .ligne.case:not(:has(.rg-epingle)) { grid-template-columns: 1fr; }
  #panneau.rg .bouton.rg-petit { min-width: 0; padding: 2px 6px; }
  #panneau.rg .bouton.rg-gros { min-width: 0; padding: 7px 8px; font-weight: bold; }
  #panneau.rg .bouton.rg-enfonce { border-color: #000 #fff #fff #000; box-shadow: inset 1px 1px var(--gris-fonce); background: var(--gris-clair); }
  #panneau.rg .rg-gestes { display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 5px; }
  #panneau.rg .rg-resultat { display: block; width: 100%; text-align: left; font: inherit; background: none; border: 1px solid transparent; padding: 3px 4px; cursor: pointer; color: #000; }
  #panneau.rg .rg-resultat:hover, #panneau.rg .rg-resultat:focus { background: var(--titre-a); color: #fff; outline: none; }
  #panneau.rg .rg-resultat small { opacity: 0.75; }
  #panneau.rg .rg-aide { color: #404040; margin: 4px 0 6px; line-height: 1.4; }
  #panneau.rg .barre .rg-taille { min-width: 18px; padding: 0 2px; }
  #panneau.rg .rg-grip { position: absolute; right: 1px; bottom: 1px; width: 13px; height: 13px; cursor: nwse-resize;
    background: linear-gradient(135deg, transparent 0 45%, var(--gris-fonce) 45% 52%, #fff 52% 59%, transparent 59% 66%, var(--gris-fonce) 66% 73%, #fff 73% 80%, transparent 80%); }
  #panneau:not(.rg) .rg-grip, #panneau:not(.rg) .rg-taille { display: none; }
  @media (max-width: 640px) { #panneau.rg .ligne { grid-template-columns: 96px 1fr 36px 16px; } }
  `;
  document.head.appendChild(st);
}
