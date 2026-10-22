"use strict";
/* ================================================================ le menu de la manette, et l'aide des touches */

// Jiiji, 2026-10-19 : « est-ce qu'il y a un bouton "un depart frais" assigne a la manette ? Je pense qu'il
// faut une touche qui affiche les boutons [...] De toute facon le panneau des options, on ne peut pas le
// naviguer a la manette, donc il faut un mode d'options specifique au jeu, a la manette. C'est bien parce
// que ca va etre presente sans clavier, bien sur. »
//
// PS ouvre et ferme le menu. La croix directionnelle (ou le stick gauche) navigue, croix valide, rond
// revient en arriere ou ferme, gauche et droite reglent une valeur. Seule la manette qui l'a ouvert le
// pilote (live.js lui passe ses boutons) ; les autres manettes continuent de jouer, et le jeu continue
// derriere. Il se ferme seul apres 20 s sans geste. C'est la seule chose qui s'ecrit sur l'image, et
// seulement quand on l'ouvre (Jiiji projette : rien d'autre ne s'ecrit).
// Options tenu montre le tableau des touches (aideManette), tant qu'on le tient.
// Ce qui demande un geste du navigateur (le plein ecran, le son du PC) n'y est pas propose.
//
// Tout est en elements de la page par-dessus l'image (pas dans la toile) : rien ne se dessine a chaque
// image, la page n'est retouchee qu'a un geste (et deux fois par seconde menu ouvert, pour suivre ce
// que le pilote change).

// poiasie-spectacle.bat ouvre l'accueil puis l'ecran avec ?spectacle=1 (Chrome en kiosque, sans clavier)
const SPECTACLE = PARAMS.get("spectacle") === "1";
const MENU_DELAI = 20000;  // ms sans geste avant que le menu se ferme seul

{
  const st = document.createElement("style");
  st.textContent = `
  #menu-manette, #aide-manette {
    position: fixed; left: 50%; top: 50%; z-index: 40; pointer-events: none;
    transform: translate(-50%, -50%) scale(0.97); opacity: 0; visibility: hidden;
    transition: opacity 0.35s ease, transform 0.35s ease, visibility 0s linear 0.35s;
    background: rgba(6, 6, 10, 0.82); color: #f3eee2; border: 1px solid rgba(255,255,255,0.16);
    border-radius: 8px; box-shadow: 0 0 60px rgba(0,0,0,0.6); text-shadow: 0 1px 3px #000;
    font-family: Georgia, "Times New Roman", serif;
  }
  #menu-manette.visible, #aide-manette.visible {
    opacity: 1; visibility: visible; transform: translate(-50%, -50%) scale(1);
    transition: opacity 0.35s ease, transform 0.35s ease, visibility 0s;
  }
  #aide-manette { z-index: 41; }
  #menu-manette { width: min(820px, 92vw); padding: 2.4vh 2.2vw 2vh; font-size: clamp(20px, 3.6vh, 48px); --mm: #fff; }
  #menu-manette .mm-ligne { display: flex; justify-content: space-between; align-items: baseline; gap: 0.8em;
    padding: 0.16em 0.5em 0.18em 0.6em; border-left: 0.16em solid transparent; border-radius: 3px; line-height: 1.25; }
  #menu-manette .mm-ligne.choisie { background: rgba(255,255,255,0.09); border-left-color: var(--mm); }
  #menu-manette .mm-ligne.choisie .mm-nom { color: var(--mm); }
  #menu-manette .mm-nom { white-space: nowrap; }
  #menu-manette .mm-val { font-size: 0.72em; opacity: 0.82; text-align: right; white-space: nowrap; overflow: hidden;
    text-overflow: ellipsis; min-width: 0; font-style: italic; }
  #menu-manette .mm-indice { font: 0.5em/1.4 Tahoma, Arial, sans-serif; min-height: 2.8em; margin: 0.7em 0.9em 0;
    opacity: 0.9; color: var(--mm); }
  #menu-manette .mm-pied, #aide-manette .am-pied { font: 0.42em/1.4 Tahoma, Arial, sans-serif; opacity: 0.6; text-align: center; margin-top: 0.6em; }
  #aide-manette .am-pied { font-size: 0.85em; }
  #aide-manette { width: min(1640px, 95vw); max-height: 94vh; overflow: hidden; padding: 1.8vh 1.8vw 1.4vh;
    font-size: clamp(13px, 1.95vh, 26px); --am: #fff; }
  #aide-manette .am-tete { display: flex; align-items: baseline; gap: 0.7em; flex-wrap: wrap; margin-bottom: 0.2em; }
  #aide-manette .am-point { width: 0.9em; height: 0.9em; border-radius: 50%; background: var(--am); align-self: center;
    box-shadow: 0 0 18px var(--am); flex: none; }
  #aide-manette .am-nom { font-size: 2.1em; color: var(--am); }
  #aide-manette .am-defile { font: 0.85em Tahoma, Arial, sans-serif; opacity: 0.6; }
  #aide-manette .am-facon { font-size: 1.1em; font-style: italic; opacity: 0.92; margin: 0 0 0.7em; }
  #aide-manette table { border-collapse: collapse; width: 100%; font: 1em/1.3 Tahoma, Arial, sans-serif; }
  #aide-manette th { text-align: left; font-weight: normal; opacity: 0.6; padding: 0.15em 0.6em; border-bottom: 1px solid rgba(255,255,255,0.25); }
  #aide-manette td { padding: 0.2em 0.6em; vertical-align: top; border-bottom: 1px solid rgba(255,255,255,0.07); }
  #aide-manette td:first-child { white-space: nowrap; font-weight: bold; color: var(--am); }
  `;
  document.head.appendChild(st);
}

// la couleur d'un poete sur le fond sombre du menu (toujours la variante claire)
function couleurMenu(p) { return hsl((p && teinteDe(p.nom)) || 0, 82, 68); }
function sansParentheses(t) { return String(t || "").replace(/\s*\([^)]*\)/g, "").trim(); }
function presetDuMode() {
  const p = String(S.presetCourant || "");
  return p.startsWith(S.mode + ":") ? p.slice(S.mode.length + 1) : "";
}

/* ---------------------------------------------------- l'aide : le tableau des touches */

const aideManette = {
  el: null, joueur: null, depuisMenu: false, tableau: "",
  construire() {
    const el = this.el = document.createElement("div");
    el.id = "aide-manette";
    el.setAttribute("aria-hidden", "true");
    document.body.appendChild(el);
    let h = "<table><tr><th>touche</th><th>seule</th><th>L1 tenu : en grand</th><th>R1 tenu : partout</th></tr>";
    for (const [k, a, b, c] of DISPOSITION) {
      h += "<tr><td>" + echapper(k) + "</td>" + (!b && !c ? '<td colspan="3">' + echapper(a) + "</td>"
        : "<td>" + echapper(a) + "</td><td>" + echapper(b) + "</td><td>" + echapper(c) + "</td>") + "</tr>";
    }
    this.tableau = h + "</table>";
  },
  // le tableau, avec le poete de cette manette, son nom, sa couleur et sa facon d'ecrire en une ligne
  montrer(j, depuisMenu) {
    if (!j || !j.perso) return;
    // le menu a ouvert l'aide : une autre manette ne la lui prend pas
    if (this.depuisMenu && !depuisMenu && this.joueur && this.joueur !== j && menuManette.tenuPar(this.joueur)) return;
    this.joueur = j; this.depuisMenu = !!depuisMenu;
    const p = j.perso, J = persosJouables(), c = couleurMenu(p);
    this.el.style.setProperty("--am", c);
    this.el.innerHTML = '<div class="am-tete"><span class="am-point"></span><span class="am-nom">' + echapper(p.nom) + "</span>"
      + '<span class="am-defile">pavé : le poète suivant · Share : le précédent' + (J.length > 1 ? "" : " (un seul poète jouable)") + "</span></div>"
      + '<div class="am-facon">' + echapper(FACONS[p.cle] || "") + "</div>" + this.tableau
      + '<div class="am-pied">' + (this.depuisMenu ? "○ : revenir au menu · PS : fermer" : "lâche Options : le tableau s'efface") + "</div>";
    this.el.classList.add("visible");
  },
  // Options lache : le tableau s'efface, ou passe a une autre manette qui tient encore Options
  lacher(j) {
    if (this.joueur !== j || this.depuisMenu) return;
    const autre = manette.actifs().find(x => x !== j && x.aideTenue);
    if (autre) this.montrer(autre); else this.cacher();
  },
  cacher() { this.joueur = null; this.depuisMenu = false; this.el.classList.remove("visible"); },
  visible() { return !!this.joueur; },
};

/* ---------------------------------------------------- les lignes du menu */

// Dans cet ordre, et rien de plus pour commencer (Jiiji, 2026-10-19). Chaque ligne : son nom, sa valeur
// (val), ce que disent les touches quand on est dessus (indice), ce que fait croix (ok), ce que font
// gauche et droite (gd, sens -1 ou 1) ; repete : gauche droite tenus se repetent (vite : pour le volume)
const LIGNES_MENU = [
  { cle: "frais", nom: "Un départ frais",
    indice: "✕ : des réglages neufs dans toutes les pages, en fondu (la scène, le mode et le son restent)",
    ok: m => { if (typeof departFraisPartout !== "function") return; const n = departFraisPartout(); m.dire(n ? "un départ frais : " + n + " réglages glissent" : "rien à changer"); } },
  { cle: "avant", nom: "Comme avant", visible: () => typeof pc !== "undefined" && !!(pc.dernierPartout && pc.dernierPartout.length),
    indice: "✕ : tout revient comme avant le départ frais",
    ok: m => { if (typeof remettrePartout === "function" && remettrePartout()) m.dire("tout est revenu comme avant"); } },
  { cle: "mode", nom: "Le mode", repete: true,
    val: m => { const v = m.modeVise || S.mode; return "◂ " + (MODES[v] ? MODES[v].nom : v) + " ▸"; },
    indice: m => m.modeVise && m.modeVise !== S.mode ? "✕ : passer en " + MODES[m.modeVise].nom.toLowerCase() + " (" + MODES[m.modeVise].sous + ")"
      : "← → : un autre mode, puis ✕ pour y passer",
    gd: (s, m) => { const l = MODES_ORDRE, i = Math.max(0, l.indexOf(m.modeVise || S.mode)); m.modeVise = l[(i + s + l.length) % l.length]; },
    ok: m => {
      if (m.modeVise && m.modeVise !== S.mode) { modes.choisir(m.modeVise); m.dire("mode " + MODES[S.mode].nom.toLowerCase()); }
      m.modeVise = S.mode;
    } },
  { cle: "preset", nom: "Le preset",
    val: () => presetDuMode() || "aucun",
    indice: () => "← le précédent · → ou ✕ le suivant (les presets du mode " + (MODES[S.mode] ? MODES[S.mode].nom.toLowerCase() : "") + ", en fondu)",
    gd: s => modes.voisin(s), ok: () => modes.voisin(1) },
  { cle: "scene", nom: "La scène",
    val: () => S.scene === "auto" ? "toutes, à tour de rôle" : sansParentheses(nomDe(SCENES_NOMS, S.scene)),
    indice: () => "← → : une autre scène · ✕ : " + (S.scene === "auto" ? "garder celle de ce moment" : "retour à toutes, à tour de rôle"),
    gd: s => sceneVoisine(s),
    ok: () => { if (S.scene === "auto") { if (sceneCle) changerScene(sceneCle); } else changerScene("auto"); } },
  { cle: "couleurs", nom: "Les couleurs", repete: true,
    val: () => PALETTES[S.palette] ? PALETTES[S.palette].nom : String(S.palette),
    indice: "← → ou ✕ : une autre palette", gd: s => paletteVoisine(s), ok: () => paletteVoisine(1) },
  { cle: "pilote", nom: "Le pilote automatique",
    val: () => S.pilote ? "en marche" : "arrêté",
    indice: () => S.pilote ? "✕ ou ← : l'arrêter (tu reprends la main)" : "✕ ou → : le mettre en marche (il change la scène, les couleurs, les effets)",
    gd: s => { if ((s > 0) !== !!S.pilote) basculerPilote(); }, ok: () => basculerPilote() },
  { cle: "son", nom: "Le son", repete: true, vite: true,
    val: () => (S.son ? "marche" : "arrêt") + " · " + Math.round((Number(S.volume) || 0) * 100) + " %",
    indice: () => S.son && son.ctx && son.ctx.state !== "running"
      ? "Chrome attend un clic ou une touche sur la page pour sonner (le lanceur spectacle l'en dispense)"
      : "✕ : " + (S.son ? "le couper" : "l'allumer") + " · ← → : le volume",
    gd: s => {
      const v = clamp(Math.round((Number(S.volume) || 0) * 20 + s) / 20, 0, 1);
      if (v !== S.volume) { changer("volume", v); if (controles.volume) controles.volume.maj(); }
    },
    ok: () => { changer("son", !S.son); if (controles.son) controles.son.maj(); } },
  { cle: "touches", nom: "Les touches",
    indice: "✕ : le tableau des touches (en jouant : Options tenu)", ok: m => m.voirAide() },
  // seulement dans le lanceur spectacle (Chrome en kiosque) : sans clavier, il faut pouvoir fermer
  { cle: "quitter", nom: "Quitter", visible: () => SPECTACLE,
    val: m => m.quitterDemande && performance.now() - m.quitterDemande < 5000 ? "✕ encore" : "",
    indice: "✕ deux fois : la fenêtre de poïasie se ferme (au clavier : Alt + F4)", ok: m => m.quitter() },
];

/* ---------------------------------------------------- le menu */

const menuManette = {
  el: null, liste: null, indiceEl: null, joueur: null, cle: "frais", page: "menu", geste: 0, modeVise: null,
  quitterDemande: 0, message: "", messageFin: 0, dirs: null, prochains: {}, signature: "", dernierRendu: 0,
  construire() {
    const el = this.el = document.createElement("div");
    el.id = "menu-manette";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = '<div class="mm-liste"></div><div class="mm-indice"></div>'
      + '<div class="mm-pied">↑ ↓ choisir · ← → régler · ✕ valider · ○ ou PS fermer</div>';
    document.body.appendChild(el);
    this.liste = el.querySelector(".mm-liste");
    this.indiceEl = el.querySelector(".mm-indice");
  },
  tenuPar(j) { return !!j && this.joueur === j; },
  ouvert() { return !!this.joueur; },
  lignes() { return LIGNES_MENU.filter(l => !l.visible || l.visible()); },
  ligne() { const l = this.lignes(); return l.find(x => x.cle === this.cle) || l[0]; },
  // PS (live.js, Joueur.appui)
  ouvrir(j) {
    if (this.joueur === j) return this.fermer();
    if (this.joueur) { j.vibrer(0.1, 60); return; }  // une autre manette le tient deja
    this.joueur = j; this.page = "menu"; this.cle = "frais"; this.modeVise = S.mode; this.quitterDemande = 0;
    this.message = ""; this.dirs = null; this.prochains = {}; this.geste = performance.now();
    this.el.style.setProperty("--mm", couleurMenu(j.perso));
    this.rendre(true);
    this.el.classList.add("visible");
    j.vibrer(0.2, 80);
  },
  fermer() {
    if (aideManette.depuisMenu) aideManette.cacher();
    this.joueur = null; this.page = "menu"; this.quitterDemande = 0;
    this.el.classList.remove("visible");
  },
  dire(t) { this.message = t; this.messageFin = performance.now() + 3500; },
  voirAide() {
    this.page = "aide";
    this.el.classList.remove("visible");
    aideManette.montrer(this.joueur, true);
  },
  // un bouton de la manette qui tient le menu
  appui(j, b) {
    const B = BOUTONS;
    this.geste = performance.now();
    if (b === B.ps) { this.fermer(); return; }
    if (b === B.pave || b === B.share) {
      // changer de poete marche aussi menu ouvert (et le tableau suit)
      j.persoVoisin(b === B.pave ? 1 : -1);
      this.el.style.setProperty("--mm", couleurMenu(j.perso));
      if (this.page === "aide") aideManette.montrer(j, true); else this.rendre();
      return;
    }
    if (this.page === "aide") {
      if (b === B.rond || b === B.croix || b === B.options) { this.page = "menu"; aideManette.cacher(); this.el.classList.add("visible"); this.rendre(true); }
      return;
    }
    if (b === B.options) { this.voirAide(); return; }
    if (b === B.rond) {
      if (this.quitterDemande) { this.quitterDemande = 0; this.message = ""; this.rendre(); return; }
      this.fermer(); return;
    }
    if (b === B.croix) {
      const l = this.ligne();
      if (l && l.cle !== "quitter") this.quitterDemande = 0;
      if (l && l.ok) l.ok(this);
      j.vibrer(0.15, 60);
      this.rendre(true);
    }
  },
  // chaque image, pour la manette qui tient le menu : la croix directionnelle et le stick gauche (avec
  // repetition quand on les tient), la fermeture apres 20 s sans geste
  lire(j, lu, dt) {
    const now = performance.now(), B = BOUTONS, ax = i => lu.a[i] || 0;
    const d = {
      haut: lu.b[B.haut].pressed || ax(1) < -0.6, bas: lu.b[B.bas].pressed || ax(1) > 0.6,
      gauche: lu.b[B.gauche].pressed || ax(0) < -0.6, droite: lu.b[B.droite].pressed || ax(0) > 0.6,
    };
    if (!this.dirs) {
      // ce qui etait deja tenu a l'ouverture ne compte pas tant qu'on ne l'a pas lache
      this.dirs = d;
      for (const k in d) this.prochains[k] = d[k] ? Infinity : 0;
    } else {
      for (const k in d) {
        if (d[k] && !this.dirs[k]) { this.direction(k, false); this.prochains[k] = now + 420; }
        else if (d[k] && now >= this.prochains[k]) { this.direction(k, true); this.prochains[k] = now + this.cadence(k); }
        else if (!d[k]) this.prochains[k] = 0;
      }
      this.dirs = d;
    }
    if (!this.joueur) return;
    if (now - this.geste > MENU_DELAI) { this.fermer(); return; }
    if (this.page === "menu" && now - this.dernierRendu > 500) this.rendre();
  },
  cadence(k) { const l = this.ligne(); return k === "haut" || k === "bas" ? 190 : l && l.vite ? 90 : 360; },
  direction(k, repete) {
    this.geste = performance.now();
    if (this.page !== "menu") return;
    const l = this.lignes();
    if (k === "haut" || k === "bas") {
      const i = Math.max(0, l.findIndex(x => x.cle === this.cle));
      this.cle = l[(i + (k === "bas" ? 1 : -1) + l.length) % l.length].cle;
      this.quitterDemande = 0; this.message = "";
      if (this.joueur) this.joueur.vibrer(0.06, 30);
    } else {
      const x = this.ligne();
      if (!x || !x.gd || (repete && !x.repete)) return;
      x.gd(k === "droite" ? 1 : -1, this);
    }
    this.rendre();
  },
  quitter() {
    const now = performance.now();
    if (!this.quitterDemande || now - this.quitterDemande > 5000) { this.quitterDemande = now; this.dire("✕ encore : poïasie se ferme"); return; }
    this.quitterDemande = 0;
    // Chrome ne laisse une page fermer sa fenetre que si elle n'a qu'une page dans son historique :
    // l'accueil du lanceur spectacle passe a l'ecran en se remplacant (location.replace)
    window.close();
    setTimeout(() => { if (!window.closed) { this.dire("Chrome refuse de fermer cette fenêtre : Alt + F4 au clavier"); this.rendre(); } }, 400);
  },
  // la page du menu : refaite seulement quand les lignes changent, sinon les textes seulement
  rendre(force) {
    if (!this.el) return;
    this.dernierRendu = performance.now();
    const l = this.lignes(), sig = l.map(x => x.cle).join("|");
    if (force || sig !== this.signature) {
      this.signature = sig;
      this.liste.replaceChildren(...l.map(x => {
        const r = document.createElement("div"); r.className = "mm-ligne"; r.dataset.cle = x.cle;
        const n = document.createElement("span"); n.className = "mm-nom"; n.textContent = x.nom;
        const v = document.createElement("span"); v.className = "mm-val";
        r.append(n, v);
        return r;
      }));
      if (!l.some(x => x.cle === this.cle)) this.cle = l[0].cle;
    }
    for (const r of this.liste.children) {
      const x = l.find(y => y.cle === r.dataset.cle);
      if (!x) continue;
      r.classList.toggle("choisie", x.cle === this.cle);
      const v = x.val ? x.val(this) : "";
      if (r.lastChild.textContent !== v) r.lastChild.textContent = v;
    }
    const x = this.ligne();
    const t = this.message && performance.now() < this.messageFin ? this.message : x ? (typeof x.indice === "function" ? x.indice(this) : x.indice || "") : "";
    if (this.indiceEl.textContent !== t) this.indiceEl.textContent = t;
  },
};

aideManette.construire();
menuManette.construire();

// Sans clavier, le son : Chrome ne compte pas une manette comme un geste, un contexte audio cree sans
// clic ni touche reste suspendu (son.tic le relance au premier geste). Le lanceur spectacle ouvre Chrome
// avec --autoplay-policy=no-user-gesture-required : on peut alors demarrer le son tout de suite, sans
// attendre qu'une manette joue une note.
window.addEventListener("load", () => {
  if (SPECTACLE && (S.son || S.sonVoix)) { try { son.demarrer(); } catch (e) { console.error(e); } }
});
