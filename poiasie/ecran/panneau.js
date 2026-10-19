"use strict";
/* ================================================================ le panneau Windows 98 */

const panneau = document.getElementById("panneau");
const ongletsEl = document.getElementById("onglets");
const pagesEl = document.getElementById("pages");
const controles = {};
let miniature = null;

// Le panneau : le nouveau (rangement.js, 2026-10-19 : familles, sous-pages, l'essentiel en vue et
// l'avance replie) ou l'ancien, tel qu'il etait (la case de Systeme > Machine et fenetre, le bouton
// « Nouveau panneau » du pied). Le choix est dans poiasie-panneau-v1, jamais dans S.
function construirePanneau() {
  const nouveau = typeof rangement !== "undefined" && rangement.actif();
  panneau.classList.toggle("rg", nouveau);
  if (nouveau) {
    try { rangement.construire(); }
    catch (e) {
      // un panneau qui ne se construit pas ne doit jamais laisser Jiiji sans reglages : l'ancien
      console.error("poiasie : le nouveau panneau ne se construit pas, retour a l'ancien", e);
      ongletsEl.replaceChildren(); pagesEl.replaceChildren();
      for (const k in controles) delete controles[k];
      panneau.classList.remove("rg");
      construireAncienPanneau();
    }
  } else construireAncienPanneau();
  majBoutonPanneau();
}
// tout refaire, sans recharger la page (la musique, le son, le poeme continuent)
function reconstruirePanneau() {
  ongletsEl.replaceChildren(); pagesEl.replaceChildren();
  for (const k in controles) delete controles[k];
  miniature = null;
  if (typeof pc !== "undefined" && pc.rangees) pc.rangees = {};
  panneau.style.removeProperty("--rg-h"); panneau.style.removeProperty("--rg-t");
  for (const x of panneau.querySelectorAll(".rg-grip, .rg-taille")) x.remove();
  panneau.style.width = "430px";
  construirePanneau();
  // l'etat des cables (cv.js) se repose dans sa page ; l'onglet Modes se redessine
  if (typeof cv !== "undefined" && cv.pret && typeof cv.preparer === "function") { try { cv.preparer(); } catch (e) { console.error(e); } }
  if (typeof majModesUI === "function") majModesUI(true);
  if (typeof majSonUI === "function") majSonUI();
  if (typeof majMusiqueUI === "function") majMusiqueUI();
  for (const k in controles) controles[k].maj();
}
function basculerAncienPanneau(ancien) {
  if (typeof rgPref === "undefined") return;
  rgPref.ancien = !!ancien;
  rgGarder();
  reconstruirePanneau();
}
// au pied de l'ancien panneau, de quoi revenir au nouveau
function majBoutonPanneau() {
  let b = document.getElementById("b-rg");
  const montrer = typeof rangement !== "undefined" && !rangement.actif();
  if (!montrer) { if (b) b.remove(); return; }
  if (b) return;
  b = document.createElement("button"); b.type = "button"; b.className = "bouton"; b.id = "b-rg";
  b.textContent = "Nouveau panneau"; b.title = "Le panneau rangé du 19 octobre : familles, l'essentiel en vue, l'avancé replié";
  b.addEventListener("click", () => basculerAncienPanneau(false));
  const pied = panneau.querySelector(".pied");
  pied.insertBefore(b, pied.firstChild);
}

// L'ancien panneau, garde tel quel (un onglet par onglet de SCHEMA)
function construireAncienPanneau() {
  SCHEMA.forEach((o, i) => {
    const onglet = document.createElement("div");
    onglet.className = "onglet" + (i === 0 ? " actif" : "");
    onglet.textContent = o.onglet;
    const page = document.createElement("div");
    page.className = "page";
    page.hidden = i !== 0;
    onglet.addEventListener("click", () => {
      ongletsEl.querySelectorAll(".onglet").forEach(x => x.classList.remove("actif"));
      pagesEl.querySelectorAll(".page").forEach(x => { x.hidden = true; });
      onglet.classList.add("actif"); page.hidden = false;
      if (o.special === "generateur") rafraichirGenerateur();
    });
    ongletsEl.appendChild(onglet);
    pagesEl.appendChild(page);
    // en haut de chaque onglet, ses presets (presets-categories.js) : la rangee se pose avant tout le reste
    if (typeof construireRangeeCategorie === "function") { try { construireRangeeCategorie(o, page); } catch (e) { console.error("poiasie : presets de catégorie", e); } }
    if (o.moniteur) {
      const mon = document.createElement("div");
      mon.className = "moniteur";
      mon.innerHTML = '<div class="ecran-mini"><canvas width="164" height="110"></canvas></div><div class="pied-mini"></div><div class="socle"></div>';
      page.appendChild(mon);
      miniature = mon.querySelector("canvas").getContext("2d");
    }
    if (o.special === "generateur") return construireGenerateur(page);
    if (o.special === "apropos") return construireApropos(page);
    if (o.special === "musique") construireMusique(page);
    if (o.special === "manette") construireManette(page);
    if (o.special === "son") construireSon(page);
    if (o.special === "modes") construireModes(page);
    for (const g of o.groupes) {
      const fs = document.createElement("fieldset");
      const lg = document.createElement("legend"); lg.textContent = g.titre; fs.appendChild(lg);
      if (g.ambiances) {
        const sel = document.createElement("select");
        const noms = Object.keys(AMBIANCES).filter(a => g.ambiances !== "combo" || a.startsWith("Combo"));
        sel.innerHTML = '<option value="">(choisir ' + (g.ambiances === "combo" ? "un combo" : "une ambiance") + ')</option>' + noms.map(a => "<option>" + a + "</option>").join("");
        sel.addEventListener("change", () => { if (sel.value) poserAmbiance(sel.value); sel.value = ""; });
        const r = document.createElement("div"); r.className = "rangee"; r.appendChild(sel);
        fs.appendChild(r);
      }
      for (const it of g.items || []) fs.appendChild(construireControle(it));
      page.appendChild(fs);
    }
  });
}

// Un reglage peut avoir plusieurs vues (2026-10-19, rangement.js : sa page, la page Jouer, les
// epingles, la recherche). Le contrat ne change pas : controles[cle].maj() met a jour toutes ses vues.
// Une vue « secondaire » (data-rg-secondaire) retiree de la page est oubliee au passage.
function inscrireVue(cle, maj, ligne) {
  let c = controles[cle];
  if (!c || !c.vues) {
    c = controles[cle] = { vues: [], maj() {
      this.vues = this.vues.filter(v => v.ligne.isConnected || !v.ligne.dataset.rgSecondaire);
      for (const v of this.vues) v.maj();
    } };
  }
  c.vues.push({ maj, ligne });
}
// apres un geste sur une vue, les autres vues du meme reglage suivent
function majSoeurs(cle) { const c = controles[cle]; if (c && c.vues && c.vues.length > 1) c.maj(); }

function construireControle(it) {
  const ligne = document.createElement("div");
  ligne.className = "ligne" + (it.type === "case" ? " case" : "");
  ligne.dataset.cle = it.cle;
  if (it.type === "case") {
    const lab = document.createElement("label");
    const cb = document.createElement("input"); cb.type = "checkbox"; cb.checked = !!S[it.cle];
    cb.addEventListener("change", () => { changer(it.cle, cb.checked); majSoeurs(it.cle); });
    lab.append(cb, document.createTextNode(it.nom));
    ligne.appendChild(lab);
    inscrireVue(it.cle, () => { cb.checked = !!S[it.cle]; }, ligne);
    return ligne;
  }
  const nom = document.createElement("span"); nom.textContent = it.nom; ligne.appendChild(nom);
  if (it.type === "couleur") {
    const inp = document.createElement("input"); inp.type = "color"; inp.value = S[it.cle];
    inp.addEventListener("input", () => { changer(it.cle, inp.value); majSoeurs(it.cle); });
    inp.style.gridColumn = "2 / 4"; inp.style.height = "20px";
    ligne.appendChild(inp);
    inscrireVue(it.cle, () => { inp.value = S[it.cle]; }, ligne);
    return ligne;
  }
  if (it.type === "choix") {
    const sel = document.createElement("select");
    for (const [v, n] of it.options) { const op = document.createElement("option"); op.value = v; op.textContent = n; sel.appendChild(op); }
    sel.value = S[it.cle];
    sel.addEventListener("change", () => { changer(it.cle, sel.value); majSoeurs(it.cle); });
    sel.style.gridColumn = "2 / 4";
    ligne.appendChild(sel);
    inscrireVue(it.cle, () => { sel.value = S[it.cle]; }, ligne);
  } else {
    const r = document.createElement("input"); r.type = "range"; r.min = it.min; r.max = it.max; r.step = it.pas; r.value = S[it.cle];
    const val = document.createElement("span"); val.className = "val";
    const ecrire = () => { const v = Number(S[it.cle]); val.textContent = it.pas >= 1 ? String(Math.round(v)) : v.toFixed(2).replace(/\.?0+$/, ""); };
    r.addEventListener("input", () => { changer(it.cle, Number(r.value)); ecrire(); majSoeurs(it.cle); });
    ligne.append(r, val); ecrire();
    inscrireVue(it.cle, () => { r.value = S[it.cle]; ecrire(); }, ligne);
  }
  return ligne;
}

const RECONSTRUIRE = new Set(["scene", "taille", "police", "casse", "annotations", "entree", "sortie", "ecriture", "voies", "espacement", "source", "chutes"]);
function changer(cle, valeur) {
  // le mode : sa configuration de base (modes.js), qui ecrit S.mode elle-meme
  if (cle === "mode" && typeof modes !== "undefined" && valeur !== S.mode && !modes.dansChoix) { modes.choisir(valeur); return; }
  S[cle] = valeur;
  pilote.prendre(cle);  // un geste : le pilote laisse ce reglage tranquille un moment
  sauver();
  if (cle === "son" && S.son) son.demarrer();
  if (cle === "son" || cle === "volume" || cle.startsWith("son")) { son.reglages(); majSonUI(); }
  if (cle === "sonGamme" || cle === "sonTonique") son.nouvelleGamme();
  if (cle === "sonOctave") son.accorder(false);
  if (cle === "sonSuit") son.file = [];
  if (cle === "sonTimbre") son.timbresDerive = {};
  if (cle === "source") chargerBourse();
  if (cle === "espacement") { appliquerEspacement(); mesures.clear(); }
  if (cle === "palette" || cle === "fond" || cle.startsWith("perso")) fondCache = null;
  if (cle === "crt" || cle === "vieilleTele") document.body.classList.toggle("crt", !!(S.crt && S.vieilleTele));
  if (cle === "qualite") redimensionner();
  if (cle === "maelstrom") maelstrom.remplir();
  if (cle === "musique" && !valeur) musique.debrancher();
  if ((cle === "musiqueSource" || cle === "musiqueEntree") && musique.actif) musique.brancher();
  if (cle === "bourse" || cle === "casse") bandeau.texte = null;
  if (cle === "direct") suivreDirect();
  if (cle === "cartel" && !S.cartel) montrerCartel(null);
  if (cle === "calquePoeme") { calque.scene = null; calque.voulu = null; }
  rangerBientot();
  if (cle === "source") { curseurPoeme = -1; suivant(); return; }
  if (RECONSTRUIRE.has(cle)) {
    if (cle === "scene") { sacAuto = []; sceneCle = cleSuivante(); }
    if (poemeCourant) scene = construire(sceneCle, poemeCourant);
  }
}
// le nouveau panneau range ses lignes selon l'etat (un reglage allume fait paraitre ceux qui en
// dependent) : un peu apres le geste, pas a chaque mouvement du curseur
let attenteRanger = null;
function rangerBientot() {
  if (typeof rangement === "undefined" || !rangement.pret || !rangement.actif() || panneau.hidden) return;
  clearTimeout(attenteRanger);
  attenteRanger = setTimeout(() => rangement.placer(), 150);
}
function appliquer(valeurs) {
  Object.assign(S, valeurs);
  for (const c in valeurs) pilote.prendre(c);
  sauver();
  for (const k in controles) controles[k].maj();
  if (!S.musique && musique.actif) musique.debrancher();
  document.body.classList.toggle("crt", !!(S.crt && S.vieilleTele));
  fondCache = null; bandeau.texte = null; mesures.clear(); appliquerEspacement();
  sacAuto = []; sceneCle = cleSuivante();
  if (poemeCourant) scene = construire(sceneCle, poemeCourant);
  calque.scene = null; calque.voulu = null;
  rangerBientot();
}
// le hasard de tout (bouton Hasard, touche H) : tous les onglets, tous les reglages des familles non
// verrouillees, dans des plages qui restent belles, au dosage de l'onglet Modes (modes.js). Avant le
// 2026-10-18, il ne touchait qu'une partie des pages.
function auHasard(dose) {
  photographier();
  modes.hasard(dose);
}
// une ambiance toute prete : « Sobre » eteint vraiment tout ; une ambiance qui pousse les reglages de
// la musique (Rave) les rend a la suivante qui n'en dit rien (ils restaient pousses pour toujours,
// audit du 2026-10-18)
const POUSSEES_MUSIQUE = ["musiquePulse", "musiqueFlash", "musiqueEffets", "musiqueElan"];
const ambiancePoussees = {};
function poserAmbiance(nom) {
  if (!AMBIANCES[nom]) return;
  if (nom === "Sobre (sans effet)") { toutEteindre(); return; }
  photographier();
  if (typeof modes !== "undefined") modes.arreterFondus();
  const v = Object.assign({}, ambiance(nom));
  for (const c of POUSSEES_MUSIQUE) {
    if (c in v) { if (!(c in ambiancePoussees)) ambiancePoussees[c] = S[c]; }
    else if (c in ambiancePoussees) { v[c] = ambiancePoussees[c]; delete ambiancePoussees[c]; }
  }
  appliquer(v);
}

function majMiniature() {
  if (!miniature || panneau.hidden) return;
  const source = gpu.actif ? gpu.toile : toile;
  miniature.drawImage(source, 0, 0, source.width, source.height, 0, 0, 164, 110);
}

/* ---------------------------------------------------- onglets musique et manette */

function construireMusique(page) {
  const fs = document.createElement("fieldset");
  fs.innerHTML = `<legend>La musique</legend>
    <div class="etat-gen" id="m-etat">…</div>
    <canvas class="vumetre" id="m-vu" width="360" height="54" style="margin-top:6px"></canvas>
    <div class="ligne" style="margin-top:6px"><span>Entrée son</span><select id="m-entree" style="grid-column:2/4"><option value="">entrée par défaut de Windows</option></select></div>
    <div class="rangee"><button type="button" class="bouton" id="m-brancher">Écouter</button></div>
    <p style="margin:7px 0 0;color:#404040">Pour une table de mixage : branche sa sortie sur l'entrée de la carte son et choisis-la ci-dessus. Pour la musique qui joue sur ce PC : « Le son du PC », puis « Écran entier » et « Partager aussi l'audio du système » dans la fenêtre de Chrome.</p>`;
  page.appendChild(fs);
  fs.querySelector("#m-brancher").addEventListener("click", basculerMusique);
  const sel = fs.querySelector("#m-entree");
  sel.addEventListener("focus", listerEntrees);
  sel.addEventListener("change", () => changer("musiqueEntree", sel.value));
  setTimeout(() => { listerEntrees(); majMusiqueUI(); }, 0);
}

function construireManette(page) {
  const fs = document.createElement("fieldset");
  fs.innerHTML = `<legend>Les manettes : le jeu (une main par manette, jusqu'à quatre)</legend>
    <div class="etat-gen" id="j-etat">…</div>
    <div class="manette" id="j-pages" style="margin-top:6px"></div>`;
  page.appendChild(fs);
  const cl = document.createElement("fieldset");
  cl.innerHTML = `<legend>Au clavier</legend><div class="manette">1 à 9, 0     les scènes dans l'ordre de la liste (1 lecture, 2 calligramme,
              5 constellations, 6 nuée, 7 écriture automatique, 8 coup de dés…)
Alt + 1 à 7   1 le puits, 2 les crêtes, 3 l'averse, 4 la rosace,
              5 un mot par temps, 6 l'oscilloscope, 7 texte défilant
A             toutes les scènes à tour de rôle
² ou F2       pilote automatique (il suit la musique, morceau après morceau)
W             combo : seconde scène suivante (Maj + W : précédente)
J             combo : les deux scènes échangent leur place
K / R         kaléidoscope (miroirs suivants) / miroir
L B V X O G   larsen, halo, VHS, RVB, ondes, grain
Y U E I       onde de choc, l'image bat, négatif, bichromie
Q Z           solarisation, glitch en blocs
Tab           dégradé de couleurs suivant (Maj + Tab : précédent)
N / T         palette / ambiance suivante (Maj + N : palette précédente)
M             musique · Entrée : flash
↑ ↓           vitesse générale
Retour arr.   sobre : tous les effets éteints (LFO, « Le son mène », pilote des effets)
H             le hasard de tout (Maj + H : beaucoup ; ! : un peu)
, ;           preset précédent / suivant (onglet Modes)
:             mode suivant : poésie, VJing, jeu, full auto
*             un départ frais partout (sauf la scène, le mode, le son ; Maj + * : comme avant)
P             les réglages (Maj + P : chercher un réglage)
Alt + J I M S O L Y   une famille du panneau : Jouer, Image, Mots,
              Scènes, Son, Modulation, Système</div>`;
  page.appendChild(cl);
  setTimeout(majManetteUI, 0);
}

/* ---------------------------------------------------- onglet generateur */

let serveurComplet = null;
function construireGenerateur(page) {
  page.innerHTML = `
    <fieldset><legend>Générateur de poèmes</legend>
      <div class="etat-gen" id="g-etat">…</div>
      <div class="rangee">
        <button type="button" class="bouton" id="g-demarrer">Démarrer</button>
        <button type="button" class="bouton" id="g-arreter">Arrêter</button>
      </div>
      <p style="margin:7px 0 0;color:#404040">Démarré, il écrit sans pause : en mode set, un poème toutes les 40 secondes environ (réglable dans reglages.json). Il attend poliment quand la carte graphique est prise par Fooocus.</p>
    </fieldset>
    <fieldset><legend>Un poème tout de suite</legend>
      <div class="ligne"><span>Forme</span><select id="g-forme" style="grid-column:2/4">
        <option value="">tirée au sort</option>${FORMES_NOMS.map(([v, n]) => '<option value="' + v + '">' + n + "</option>").join("")}
      </select></div>
      <div class="ligne case"><label><input type="checkbox" id="g-essai"> à blanc : un centon de vieux vers, sans modèle (va dans les essais)</label></div>
      <div class="rangee"><button type="button" class="bouton" id="g-un">Écrire</button></div>
    </fieldset>
    <fieldset><legend>Ce que la page a lu</legend><div id="g-donnees">…</div></fieldset>`;
  page.querySelector("#g-demarrer").addEventListener("click", () => commander("/hors-ligne/demarrer"));
  page.querySelector("#g-arreter").addEventListener("click", () => commander("/hors-ligne/arreter"));
  page.querySelector("#g-un").addEventListener("click", () => {
    const forme = page.querySelector("#g-forme").value;
    const essai = page.querySelector("#g-essai").checked;
    commander("/hors-ligne/un?forme=" + encodeURIComponent(forme) + (essai ? "&essai=1" : ""));
  });
}
async function commander(url) {
  try {
    const r = await fetch(url, { method: "POST", headers: { "X-Poiasie": "1" } });
    const d = await r.json();
    if (!r.ok) document.getElementById("g-etat").textContent = d.erreur || "refusé";
    setTimeout(rafraichirGenerateur, 400);
  } catch (e) {
    document.getElementById("g-etat").textContent = "Pilotage impossible : la page n'est pas servie par serveur.py (lance ecran.bat).";
  }
}
async function rafraichirGenerateur() {
  const el = document.getElementById("g-etat");
  if (!el) return;
  const e = await lireJSON("/hors-ligne/etat");
  serveurComplet = !!e;
  const boutons = ["g-demarrer", "g-arreter", "g-un"].map(id => document.getElementById(id));
  if (!e) {
    el.innerHTML = '<span class="pastille"></span>Pilotage indisponible : la page est servie par un serveur simple. Lance <b>ecran.bat</b> pour pouvoir démarrer et arrêter le générateur d\'ici.';
    boutons.forEach(b => { b.disabled = true; });
    return;
  }
  boutons.forEach(b => { b.disabled = false; });
  const d = e.direct || {};
  let couleur = "", texte = "";
  if (e.arret_demande) { couleur = "orange"; texte = "Arrêt demandé : il finit son poème."; }
  else if (d.etat === "attente") { couleur = "orange"; texte = "En marche, mais il attend : " + (d.texte || "poste occupé") + "."; }
  else if (e.boucle) { couleur = "vert"; texte = "En marche" + (d.etat === "ecrit" ? " : " + (d.poete || "un poète") + " écrit un " + (d.forme_nom || "poème").toLowerCase() + "." : d.prochain ? ", prochain poème vers " + new Date(d.prochain).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) + "." : "."); }
  else if (e.poeme_en_cours) { couleur = "vert"; texte = "Un poème s'écrit (" + (d.forme_nom || "…") + ")."; }
  else { couleur = "rouge"; texte = "Arrêté."; }
  el.innerHTML = '<span class="pastille ' + couleur + '"></span>';
  el.appendChild(document.createTextNode(texte));
}
function majInfosDonnees() {
  const el = document.getElementById("g-donnees");
  if (!el) return;
  const frag = D.flux.reduce((a, p) => a + p.strophes.length, 0);
  el.textContent = "recueil.json : " + D.recueil.length + " poème(s) en formes · poemes.json : " + frag + " fragments du poème infini · essais à blanc : " + D.essai.length + " · " + D.compte.size + " mots différents cotés à la Bourse.";
}

function construireApropos(page) {
  page.classList.add("apropos");
  page.innerHTML = `
    <p><b>poïasie</b> : des poèmes écrits à plusieurs par des intelligences locales, qui ne se lisent jamais entièrement.</p>
    <p>À chaque tour, une forme est tirée parmi vingt et une (sonnet, pantoum, villanelle, sextine, ghazal, renga, cadavre exquis, acrostiche, litanie, blason, exorcisme…), et elle n'est jamais annoncée. Cinq poètes, tirés parmi quatorze (le lyrique, le minimaliste, le surréaliste, le sonore, le brut, et ceux qui écrivent par procédés), se passent le poème ; chacun ne voit que ce que la forme lui montre. Un vers du poème infini est mis en exergue.</p>
    <p>Chacun propose plusieurs versions. Un jury compte les syllabes, cherche la césure, écoute les rimes (féminines avec féminines, et leur richesse), chasse l'anglais, les clichés et les mots usés, et garde la meilleure selon le goût de celui qui écrit : le sonore tient aux allitérations, le minimaliste à la concision, le brut au concret. Les autres versions vont aux chutes, et l'écran les montre en fantôme derrière les vers.</p>
    <p>La <b>Bourse des mots</b> : un mot vaut d'autant moins qu'il a servi. Les plus usés sont retirés de la circulation, la Banque impose des mots rares et encaisse quand on les emploie. Les poètes sont payés en sous, et touchent des droits d'auteur quand un autre reprend un mot qu'ils ont inventé. Le plus riche donne le titre ; le plus pauvre ouvre le poème suivant, avec un peu de fièvre. Quand l'indice d'un poème s'effondre, c'est le krach. Ici, les mots usés tremblent plus que les autres. La scène « La Corbeille » montre tout cela en tableau de bourse.</p>
    <p>Un clic sur un vers donne un <b>coup de cœur</b> à son poète : il est payé.</p>
    <p><kbd>P</kbd> réglages · <kbd>Espace</kbd> suivant · <kbd>←</kbd> <kbd>→</kbd> poèmes · <kbd>F</kbd> plein écran · <kbd>H</kbd> hasard · <kbd>C</kbd> cartel · <kbd>D</kbd> direct · <kbd>S</kbd> son · <kbd>clic</kbd> coup de cœur · <kbd>Échap</kbd> fermer. Dans cette fenêtre : <kbd>Alt</kbd> + la lettre soulignée ouvre une famille, <kbd>Maj</kbd> + <kbd>P</kbd> cherche un réglage. Les effets en live au clavier, et le jeu à plusieurs manettes : Système, Manette et clavier.</p>
    <p style="color:#404040">Les réglages de cette page restent dans ce navigateur. Ceux du générateur sont dans reglages.json.</p>`;
}

/* ---------------------------------------------------- fenetre deplacable, clavier, souris */

(function deplacable() {
  const barre = document.getElementById("panneau-barre");
  let prise = null;
  barre.addEventListener("pointerdown", e => {
    if (e.target.tagName === "BUTTON") return;
    prise = { x: e.clientX - panneau.offsetLeft, y: e.clientY - panneau.offsetTop };
    barre.setPointerCapture(e.pointerId);
  });
  barre.addEventListener("pointermove", e => {
    if (!prise) return;
    panneau.style.left = clamp(e.clientX - prise.x, 0, W - 80) + "px";
    panneau.style.top = clamp(e.clientY - prise.y, 0, H - 30) + "px";
  });
  barre.addEventListener("pointerup", () => { prise = null; });
})();

function basculerPanneau(montrer) {
  panneau.hidden = montrer === undefined ? !panneau.hidden : !montrer;
  if (!panneau.hidden) {
    for (const k in controles) controles[k].maj();
    rafraichirGenerateur(); majInfosDonnees();
    if (typeof rangement !== "undefined" && rangement.actif()) rangement.maj();
  }
}
function pleinEcran() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen().catch(() => {});
}
document.getElementById("b-fermer").addEventListener("click", () => basculerPanneau(false));
document.getElementById("b-ok").addEventListener("click", () => basculerPanneau(false));
document.getElementById("b-plein").addEventListener("click", pleinEcran);
document.getElementById("b-hasard").addEventListener("click", () => auHasard());
document.getElementById("b-defaut").addEventListener("click", () => appliquer(Object.assign({}, DEFAUTS)));
document.getElementById("b-aide").addEventListener("click", () => {
  if (typeof rangement !== "undefined" && rangement.actif() && rangement.pret) { rangement.aller("systeme", "apropos"); return; }
  const i = SCHEMA.findIndex(o => o.special === "apropos");
  ongletsEl.children[i].click();
});

window.addEventListener("keydown", e => {
  // le nouveau panneau (rangement.js) : Alt + la lettre soulignee d'une famille (J I M S O L Y) l'ouvre
  // sur cette famille. Seules ces sept lettres : Alt + chiffre reste aux scenes, et Alt + D, E, F
  // sont a Chrome. Avant, Alt + lettre faisait la meme chose que la lettre seule (J : echanger le combo).
  if (e.altKey && !e.ctrlKey && !e.metaKey && !e.repeat && typeof rangement !== "undefined" && rangement.actif() && rangement.pret && rangement.raccourci(e)) {
    e.preventDefault(); return;
  }
  if (e.target.tagName === "SELECT" || e.target.tagName === "INPUT") { if (e.key === "Escape") basculerPanneau(false); return; }
  // Ctrl + une lettre est au navigateur (Ctrl+R basculait le miroir en rechargeant) ; une touche tenue
  // ne se repete pas (Espace tenu sautait des dizaines de poemes), sauf la vitesse (audit du 2026-10-18)
  if (e.ctrlKey || e.metaKey) return;
  // Maj + P : le nouveau panneau s'ouvre sur la recherche
  if (e.key.toLowerCase() === "p" && e.shiftKey && !e.altKey && !e.repeat && typeof rangement !== "undefined" && rangement.actif() && rangement.pret) {
    e.preventDefault(); basculerPanneau(true); rangement.chercher(); montrerAide(true); return;
  }
  if (e.repeat && e.key !== "ArrowUp" && e.key !== "ArrowDown") { if (e.key === " " || e.key === "Tab" || e.key === "Backspace") e.preventDefault(); return; }
  // les chiffres par leur touche (sur un clavier AZERTY, sans avoir a tenir Maj) ; Alt : la suite
  const chiffre = /^(Digit|Numpad)([0-9])$/.exec(e.code || "");
  if (chiffre && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    const i = (chiffre[2] === "0" ? 10 : Number(chiffre[2])) + (e.altKey ? 10 : 0);
    if (SCENES_NOMS[i]) changerScene(SCENES_NOMS[i][0]);
    montrerAide(true);
    return;
  }
  if (e.code === "Backquote" || e.key === "F2") { e.preventDefault(); basculerPilote(); montrerAide(true); return; }
  const k = e.key.toLowerCase();
  if (k === "p") basculerPanneau();
  else if (k === "escape") basculerPanneau(false);
  else if (k === " ") { e.preventDefault(); suivant(); }
  else if (k === "arrowright") suivant();
  else if (k === "arrowleft") suivant(-1);
  else if (k === "f") pleinEcran();
  else if (k === "h") auHasard(e.shiftKey ? 1 : undefined);
  // la rangee du bas (clavier AZERTY) : les presets et les modes (modes.js)
  else if (k === ",") modes.voisin(-1);
  else if (k === ";") modes.voisin(1);
  else if (k === ":") modes.modeVoisin(1);
  else if (k === "!") auHasard(0.2);
  // un depart frais partout (presets-categories.js) ; Maj + * (µ sur le clavier AZERTY) : comme avant
  else if (k === "*" && typeof departFraisPartout === "function") departFraisPartout();
  else if (k === "µ" && typeof remettrePartout === "function") remettrePartout();
  else if (k === "c") changer("cartel", !S.cartel);
  else if (k === "d") changer("direct", !S.direct);
  else if (k === "s" && e.shiftKey) { sonAuHasard(); bulle(W / 2, H / 2, "un autre son"); }
  else if (k === "s") { changer("son", !S.son); if (controles.son) controles.son.maj(); bulle(W / 2, H / 2, S.son ? "son allumé" : "son coupé"); }
  else if (k === "a") changerScene("auto");
  else if (k === "k") kaleidoVoisin(Math.round(S.kaleido) >= 16 ? -99 : 1);
  else if (k === "l") basculerEffet("larsen", 0.85, "larsen");
  else if (k === "b") basculerEffet("halo", 0.8, "halo");
  else if (k === "v") basculerEffet("vhs", 0.7, "cassette VHS");
  else if (k === "x") basculerEffet("rvb", 1, "décalage RVB");
  else if (k === "o") basculerEffet("ondes", 0.6, "ondes");
  else if (k === "g") basculerEffet("grain", 0.45, "grain");
  else if (k === "w") calqueVoisin(e.shiftKey ? -1 : 1);
  else if (k === "j") echangerCalque();
  else if (k === "r") miroirVoisin();
  else if (k === "y") basculerEffet("choc", 1, "onde de choc");
  else if (k === "u") basculerEffet("pompe", 0.7, "l'image bat");
  else if (k === "e") basculerEffet("negatif", 0.9, "négatif sur les temps");
  else if (k === "i") basculerEffet("bichromie", 0.85, "bichromie");
  else if (k === "q") basculerEffet("solarisation", 0.8, "solarisation");
  else if (k === "z") basculerEffet("blocs", 0.6, "glitch en blocs");
  else if (k === "tab") { e.preventDefault(); degradeVoisin(e.shiftKey ? -1 : 1); }
  else if (k === "n") paletteVoisine(e.shiftKey ? -1 : 1);
  else if (k === "t") ambianceVoisine(1);
  else if (k === "m") basculerMusique();
  else if (k === "enter") flash();
  else if (k === "backspace") { e.preventDefault(); toutEteindre(); }
  else if (k === "arrowup") { e.preventDefault(); vitesseVoisine(0.1); }
  else if (k === "arrowdown") { e.preventDefault(); vitesseVoisine(-0.1); }
  else return;
  montrerAide(true);
});
// un clic : coup de coeur ; un double clic : les reglages. On attend un peu pour savoir lequel.
let attenteClic = null, focusDepuis = 0, clicDeFocus = false;
// le clic qui donne le focus a la fenetre (on revient d'une autre fenetre) n'est pas un coup de coeur :
// il s'ecrivait pour toujours dans votes.jsonl (audit du 2026-10-18)
window.addEventListener("focus", () => { focusDepuis = performance.now(); });
toile.addEventListener("pointerdown", () => { clicDeFocus = !document.hasFocus() || performance.now() - focusDepuis < 500; });
toile.addEventListener("click", e => {
  son.demarrer();
  if (clicDeFocus) { clicDeFocus = false; return; }
  if (!S.votes) return;
  clearTimeout(attenteClic);
  const x = e.clientX, y = e.clientY;
  attenteClic = setTimeout(() => voter(x, y), 280);
});
toile.addEventListener("dblclick", () => { clearTimeout(attenteClic); basculerPanneau(); });
window.addEventListener("keydown", () => son.demarrer(), { once: true });

const aide = document.getElementById("aide");
let minuteurCurseur = null;
// la barre d'aide et le curseur reviennent quand on bouge la souris ; une touche ou un bouton de
// la manette ne les montrent que si on a demande les annonces a l'ecran
function montrerAide(discret) {
  // une touche ou un bouton de manette : l'image redevient nue tout de suite (on joue, on ne pointe
  // pas). Meme avec les annonces : la barre ne vient qu'avec la souris (Jiiji, 2026-10-17, la case
  // des annonces cochee lui montrait la barre a chaque action)
  if (discret === true) {
    clearTimeout(minuteurCurseur);
    aide.classList.add("cache");
    if (panneau.hidden) document.body.classList.add("cache-curseur");
    return;
  }
  document.body.classList.remove("cache-curseur");
  aide.classList.remove("cache");
  clearTimeout(minuteurCurseur);
  minuteurCurseur = setTimeout(() => {
    aide.classList.add("cache");
    if (panneau.hidden) document.body.classList.add("cache-curseur");
  }, 3200);
}
// Seul un vrai mouvement de souris montre la fleche et l'aide. Chrome envoie un faux mouvement
// (immobile) quand ce qui est sous la souris change : la carte graphique qui s'allume sous un geste
// de la manette faisait reapparaitre fleche et barre (Jiiji, 2026-10-17).
// Et encore des boutons la montraient (Jiiji, 2026-10-17) : une manette compatible peut aussi bouger
// la souris de Windows (pave tactile). Tant que la manette sert (moins de 2 s), la souris ne compte
// pas, ni un deplacement de moins de 6 pixels.
let derniereSouris = null;
window.addEventListener("pointermove", e => {
  const d = derniereSouris ? Math.hypot(e.clientX - derniereSouris[0], e.clientY - derniereSouris[1]) : Infinity;
  if (performance.now() - manette.dernierUsage < 2000) { derniereSouris = [e.clientX, e.clientY]; return; }
  if (d < 6) return;
  derniereSouris = [e.clientX, e.clientY];
  montrerAide();
});

