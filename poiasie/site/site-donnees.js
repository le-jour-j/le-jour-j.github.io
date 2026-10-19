"use strict";
/* ================================================================ site : les poemes viennent des fichiers du site
   (charge juste apres donnees.js : il remplace la lecture du recueil)

   Les poemes sont publies en un fichier par jour et par machine :
     poemes/machines.json              la liste des machines (nom, dossier, teinte)
     poemes/<machine>/index.json       les jours de cette machine
     poemes/<machine>/AAAA-MM-JJ.json  les poemes du jour
   La page mele les poemes de toutes les machines, les derniers jours d'abord, sans serveur et sans /api. */

const SITE = {
  machines: [],            // [{ dossier, nom, teinte, jours: [{ jour, octets }] }]
  jours: new Map(),        // "dossier/jour" -> { octets, poemes: [bruts] }
  teintes: new Map(),      // nom public -> teinte
  derniereLecture: 0,
  joursAuDepart: SITE_MOBILE ? 1 : 2,
  joursMax: SITE_MOBILE ? 3 : 6,
  profondeur: 0,           // combien de jours (par machine) sont charges
  bons: [],
};

async function siteJSON(url, delai) {
  try {
    const r = await chercher(url, { cache: "default" }, delai || 15000);
    return r.ok ? r.donnees : null;
  } catch (e) { return null; }
}

// Un poeme est montrable s'il est acheve et lisible : les vers rates du generateur (« … ») sont retires,
// et un poeme trop troue est laisse de cote.
function siteNettoyer(p) {
  if (!p || p.inacheve || !Array.isArray(p.strophes)) return null;
  let total = 0, vides = 0;
  const strophes = [];
  for (const s of p.strophes) {
    // l'etiquette de la consigne que le modele recopie parfois en tete de vers (« À écrire, ... ») :
    // retiree a la lecture, le reste du vers garde sa premiere lettre en capitale
    const propres = (s.vers || []).map(v => {
      const t = String(v.texte || "");
      const u = t.replace(/^\s*[ÀàAa] écrire\s*[,:]\s*/u, "");
      return u === t ? v : Object.assign({}, v, { texte: u.charAt(0).toUpperCase() + u.slice(1) });
    });
    const vers = propres.filter(v => {
      total++;
      const t = String(v.texte || "").trim();
      const vide = !t || /^[….\s]+$/.test(t);
      if (vide) vides++;
      return !vide;
    });
    if (vers.length) strophes.push(Object.assign({}, s, { vers }));
  }
  if (!strophes.length || total < 2 || vides / total > 0.15) return null;
  if (vides && p.memo && p.memo.fins) return null;   // la sextine compte ses vers : un trou la fausserait
  return Object.assign({}, p, { strophes });
}

async function siteLireJour(m, j) {
  const cle = m.dossier + "/" + j.jour;
  const connu = SITE.jours.get(cle);
  if (connu && connu.octets === j.octets) return false;
  const d = await siteJSON("poemes/" + m.dossier + "/" + j.jour + ".json", 30000);
  if (!d || !Array.isArray(d.poemes)) return false;
  SITE.jours.set(cle, { octets: j.octets, poemes: d.poemes });
  return true;
}

async function siteMachines() {
  const liste = await siteJSON("poemes/machines.json");
  const machines = [];
  for (const m of (liste && liste.machines) || []) {
    if (!m || !m.dossier) continue;
    const idx = await siteJSON("poemes/" + m.dossier + "/index.json");
    if (!idx || !Array.isArray(idx.jours)) continue;
    const jours = idx.jours.slice().sort((a, b) => (a.jour < b.jour ? 1 : -1));   // les plus recents d'abord
    machines.push({ dossier: m.dossier, nom: idx.machine || m.nom || m.dossier, teinte: idx.teinte != null ? idx.teinte : m.teinte || 0, jours });
    SITE.teintes.set(idx.machine || m.nom || m.dossier, idx.teinte != null ? idx.teinte : m.teinte || 0);
  }
  SITE.machines = machines;
}

function siteReconstruire() {
  const bruts = [];
  for (const { poemes } of SITE.jours.values()) for (const p of poemes) { const q = siteNettoyer(p); if (q) bruts.push(q); }
  bruts.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  D.recueil = convertir(bruts, "recueil");
  D.essai = []; D.flux = [];
  D.cote = []; D.interdits = [];
  if (recompter()) D.signature = comptage.textes + "|" + D.recueil.length;
  SITE.bons = D.recueil;
  D.charge = true;
}

// charge `n` jours de plus par machine (les plus recents d'abord)
async function siteCharger(n) {
  const cible = Math.min(SITE.joursMax, SITE.profondeur + n);
  let neuf = false;
  for (const m of SITE.machines) {
    for (const j of m.jours.slice(0, cible)) if (await siteLireJour(m, j)) neuf = true;
  }
  SITE.profondeur = cible;
  if (neuf || !D.charge) siteReconstruire();
}

let siteEnCours = null;
function charger() {
  if (siteEnCours) return siteEnCours;
  siteEnCours = (async () => {
    // on attend que tous les fichiers du moteur soient en place (le depart y compte)
    if (document.readyState === "loading") await new Promise(r => document.addEventListener("DOMContentLoaded", r, { once: true }));
    const maintenant = Date.now();
    if (D.charge && maintenant - SITE.derniereLecture < 10 * 60 * 1000) return;   // pas plus d'une relecture par 10 minutes
    SITE.derniereLecture = maintenant;
    await siteMachines();
    // le premier chargement ne prend que les tout derniers jours : la page demarre vite
    await siteCharger(D.charge ? Math.max(SITE.profondeur, 1) : SITE.joursAuDepart);
    if (!D.charge) D.erreur = "les poèmes n'ont pas pu être chargés";
  })().finally(() => { siteEnCours = null; });
  return siteEnCours;
}
async function chargerVraiment() { return charger(); }
async function chargerBourse() { /* pas de Bourse sur le site */ }
async function suivreDirect() { /* pas de poeme en direct sur le site */ }

// En arriere-plan, les jours plus anciens arrivent peu a peu : la page a plus a lire sans avoir attendu.
function siteComplement() {
  if (SITE.profondeur >= SITE.joursMax || !SITE.machines.length) return;
  siteCharger(1).catch(() => {});
}

// ---- l'ordre des poemes : un sac melange, qu'on vide ; la fleche gauche revient en arriere
const SITE_POEME_VIDE = {
  id: "vide", origine: "rien", titre: null, forme: "poïasie", resume: "", machine: "",
  strophes: [{ poete: "", vers: [{ texte: "des poèmes écrits par des machines" }, { texte: "arrivent" }] }],
};
let siteSac = [], siteHistoire = [], sitePosition = -1;
function prochainPoeme(sens) {
  const liste = D.recueil;
  if (!liste.length) {
    return D.erreur ? Object.assign({}, SITE_POEME_VIDE, { strophes: [{ poete: "", vers: [{ texte: D.erreur }] }] }) : SITE_POEME_VIDE;
  }
  if (sens === -1) {
    if (sitePosition > 0) return siteHistoire[--sitePosition];
    return siteHistoire[0] || liste[0];
  }
  if (sitePosition < siteHistoire.length - 1) return siteHistoire[++sitePosition];
  if (!siteSac.length) {
    siteSac = liste.slice();
    for (let i = siteSac.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [siteSac[i], siteSac[j]] = [siteSac[j], siteSac[i]]; }
  }
  // pas deux poemes de la meme forme de suite, quand le sac le permet
  let k = siteSac.length - 1;
  const avant = siteHistoire[sitePosition];
  if (avant) { for (let i = siteSac.length - 1; i >= Math.max(0, siteSac.length - 8); i--) if (siteSac[i].cleForme !== avant.cleForme) { k = i; break; } }
  const p = siteSac.splice(k, 1)[0];
  siteHistoire.push(p);
  if (siteHistoire.length > 60) { siteHistoire.shift(); }
  sitePosition = siteHistoire.length - 1;
  return p;
}
