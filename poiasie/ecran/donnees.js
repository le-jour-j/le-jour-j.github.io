"use strict";
/* ================================================================ donnees */

const D = { recueil: [], flux: [], essai: [], compte: new Map(), corpus: [], cote: [], interdits: [], signature: "", charge: false, erreur: "" };
const nouveaux = [];

function racine(m) {
  m = sansAccents(m.toLowerCase());
  for (const fin of ["aient", "ent", "es", "s", "x", "e"]) {
    if (m.endsWith(fin) && m.length - fin.length >= 4) return m.slice(0, -fin.length);
  }
  return m;
}
const VIDES = new Set("dans pour avec sans sous entre vers comme plus tout tous toute toutes elle elles nous vous leur leurs notre votre cette mais donc quand aussi encore même bien très être avoir fait sont dont chaque jamais toujours rien".split(" "));
function motsPleins(texte) {
  return (texte.toLowerCase().match(/[a-zàâäéèêëîïôöùûüçœæ]+/g) || []).filter(m => m.length >= 4 && !VIDES.has(m));
}
function coursDe(mot) {
  const pleins = motsPleins(mot);
  if (!pleins.length) return 60;
  const n = D.compte.get(racine(pleins[0])) || 0;
  return Math.max(1, Math.round(100 / Math.pow(1 + n, 0.7)));
}

// Une requete ne peut plus pendre pour toujours (audit du 2026-10-18) : au bout du delai elle est
// abandonnee et compte comme un rate. Le recueil (12 Mo et plus) a droit a plus de temps.
async function chercher(url, opt, delai) {
  const ac = typeof AbortController === "function" ? new AbortController() : null;
  const minuteur = ac ? setTimeout(() => ac.abort(), delai || 8000) : null;
  try {
    const r = await fetch(url, Object.assign({ cache: "no-store" }, opt, ac ? { signal: ac.signal } : {}));
    // le corps aussi est lu sous le delai : c'est lui qui est long pour le recueil
    if (r.ok && !(opt && opt.method === "HEAD")) r.donnees = await r.json();
    return r;
  } finally { if (minuteur) clearTimeout(minuteur); }
}
async function lireJSON(url) {
  try {
    const r = await chercher(url + (url.includes("?") ? "&" : "?") + "t=" + Date.now(), {}, 8000);
    if (!r.ok) return null;
    return r.donnees;
  } catch (e) { return null; }
}

function depuisRecueil(p, origine) {
  const poeme = depuisRecueilBrut(p, origine);
  // les six mots de la sextine sont nes a la fin des vers de la premiere strophe
  const fins = poeme.memo.fins;
  if (fins && poeme.strophes[0]) poeme.strophes[0].vers.forEach((v, i) => { if (!v.fin && fins[i]) v.fin = fins[i]; });
  return poeme;
}

function depuisRecueilBrut(p, origine) {
  return {
    id: p.id, origine, titre: p.titre || null, forme: p.forme_nom || p.forme || "", cleForme: p.forme || "", resume: p.forme_resume || "",
    date: p.date, machine: p.machine, moteur: p.moteur, titrePar: p.titre_par, ordre: p.ordre || [],
    inacheve: !!p.inacheve, anaphore: p.anaphore, interdits: p.interdits || [],
    memo: p.memo || {}, epigraphe: p.epigraphe || null, indice: p.indice, krach: !!p.krach, tresor: p.tresor || 0,
    strophes: (p.strophes || []).map((s, is) => ({
      poete: s.poete, role: s.role, colle: !!s.colle, index: is, fievre: s.fievre || 0,
      vers: (s.vers || []).map(v => ({ texte: v.texte || "", lettre: v.lettre, syllabes: v.syllabes, herite: !!v.herite,
        refrain: v.refrain, impose: v.mot_impose || s.mot_impose || null, segments: v.segments,
        fin: v.fin || null, initiale: v.initiale || null, mots: v.mots || null })),
    })),
  };
}

function depuisFlux(fragments) {
  const poemes = [];
  for (let i = 0; i < fragments.length; i += 5) {
    const lot = fragments.slice(i, i + 5);
    poemes.push({
      id: "flux-" + i, origine: "flux", titre: null, forme: "Le poème infini",
      resume: "fragments " + (i + 1) + " à " + (i + lot.length) + ", écrits avant les formes, à l'aveugle",
      date: null, strophes: lot.map(f => ({
        poete: f.poete, role: "", colle: false,
        vers: (f.texte || "").split(/\n+/).map(t => t.trim()).filter(Boolean).map(t => ({ texte: t })),
      })),
    });
  }
  return poemes;
}

// La Bourse calculee par le generateur lui-meme (serveur.py) : fortunes, droits d'auteur,
// tresor de la Banque, indice de chaque poeme. Sans serveur complet, la page garde son
// propre calcul, plus simple.
const corbeille = { donnees: null };
async function chargerBourse() {
  const d = await lireJSON("/hors-ligne/bourse?source=" + (S.source === "essai" ? "essai" : "recueil"));
  if (d && d.cote) {
    const avant = corbeille.donnees ? corbeille.donnees.indices.length + "|" + corbeille.donnees.tresor : "";
    corbeille.donnees = d;
    if (avant !== d.indices.length + "|" + d.tresor) bandeau.texte = null;
  }
}

// Le recueil pese plusieurs Mo et grossit a chaque poeme : on demande d'abord au serveur
// sa date et sa taille (HEAD), et on ne le relit que s'il a change. Le relire toutes les
// 15 secondes faisait sauter l'image (2026-10-16).
const empreintes = {};
async function lireSiChange(url) {
  if (location.protocol !== "file:" && empreintes[url]) {
    try {
      const r = await chercher(url + "?t=" + Date.now(), { method: "HEAD" }, 5000);
      const e = r.ok ? (r.headers.get("Last-Modified") || "") + "|" + (r.headers.get("Content-Length") || "") : "";
      if (e && e === empreintes[url]) return undefined;  // inchange
    } catch (err) { /* on relit tout */ }
  }
  // un rate (serveur coupe, fichier en train d'etre remplace) rend null : on garde ce qu'on a et on
  // oublie l'empreinte, pour tout relire au retour. Avant, l'ecran se vidait et l'empreinte gardee
  // faisait croire ensuite que rien n'avait change (audit du 2026-10-18)
  try {
    const r = await chercher(url + "?t=" + Date.now(), {}, 30000);
    if (!r.ok) { delete empreintes[url]; return null; }
    empreintes[url] = (r.headers.get("Last-Modified") || "") + "|" + (r.headers.get("Content-Length") || "");
    return r.donnees;
  } catch (err) { delete empreintes[url]; return null; }
}

// Le comptage des mots (la Bourse de l'ecran) se fait au fil des poemes. Le recueil depasse 1 300
// poemes et grossit de 8 Mo par jour : le recompter en entier a chaque poeme neuf faisait une
// saccade de plus en plus longue (audit du 2026-10-18). Il est en ajout seul : on ne compte que
// les poemes qui arrivent au bout de la liste, et on recompte tout si la liste a change autrement.
const comptage = { listes: { recueil: [], flux: [], essai: [] }, lisible: new Map(), textes: 0 };
function compterPoemes(liste) {
  for (const p of liste) for (const s of p.strophes) for (const v of s.vers) {
    if (v.herite) continue;
    comptage.textes++;
    for (const m of motsPleins(v.texte)) {
      const r = racine(m);
      D.compte.set(r, (D.compte.get(r) || 0) + 1);
      D.corpus.push(m);
      if (!comptage.lisible.has(r)) comptage.lisible.set(r, m);
    }
  }
}
// vrai si la liste neuve commence par l'ancienne (memes poemes, meme ordre)
function prolonge(ancienne, neuve) {
  if (neuve.length < ancienne.length) return false;
  for (let i = 0; i < ancienne.length; i++) if (ancienne[i] !== neuve[i]) return false;
  return true;
}
function recompter() {
  const L = comptage.listes, nl = { recueil: D.recueil, flux: D.flux, essai: D.essai };
  const ajout = Object.keys(nl).every(k => prolonge(L[k], nl[k]));
  if (!ajout) { D.compte = new Map(); D.corpus = []; comptage.lisible = new Map(); comptage.textes = 0; }
  let change = !ajout;
  for (const k of Object.keys(nl)) {
    const neufs = ajout ? nl[k].slice(L[k].length) : nl[k];
    if (neufs.length) { compterPoemes(neufs); change = true; }
    L[k] = nl[k].slice();
  }
  return change;
}
// un poeme deja converti garde son objet : le recueil relu ne refait que les neufs (et le
// comptage reconnait les memes poemes par leur objet)
const dejaVus = { recueil: new Map(), essai: new Map() };
function convertir(brut, origine) {
  const vus = dejaVus[origine], neuf = new Map(), out = [];
  for (const p of brut) {
    const cle = p.id + "|" + p.date + "|" + (p.strophes ? p.strophes.length : 0) + "|" + (p.inacheve ? 1 : 0);
    let q = vus.get(cle);
    if (!q) q = depuisRecueil(p, origine);
    neuf.set(cle, q); out.push(q);
  }
  dejaVus[origine] = neuf;
  return out;
}

let chargeEnCours = null;
function charger() {
  // un chargement lent (recueil de 12 Mo) ne se double pas d'un second toutes les 15 secondes
  if (!chargeEnCours) chargeEnCours = chargerVraiment().finally(() => { chargeEnCours = null; });
  return chargeEnCours;
}
async function chargerVraiment() {
  const [rec, flux, essai] = await Promise.all([
    lireSiChange("recueil.json"), lireSiChange("poemes.json"), lireSiChange("essai/recueil-essai.json")]);
  chargerBourse();
  const garde = x => x === undefined || (x === null && D.charge);  // inchange, ou rate apres le premier chargement
  if (garde(rec) && garde(flux) && garde(essai) && D.charge) return;
  if (!rec && !flux && !essai && !D.charge && location.protocol === "file:") {
    D.erreur = "Ouvre l'écran avec ecran.bat : la page a besoin du petit serveur local pour lire les poèmes.";
  }
  const avant = new Set(D.recueil.concat(D.essai).map(p => p.id));
  if (!garde(rec)) D.recueil = convertir(rec && rec.poemes || [], "recueil");
  if (!garde(essai)) D.essai = convertir(essai && essai.poemes || [], "essai");
  if (!garde(flux)) D.flux = depuisFlux(flux && flux.fragments || []);
  if (D.charge && S.nouveauxDabord) {
    const suivis = S.source === "essai" ? D.essai : S.source === "flux" ? [] : D.recueil;
    const neufs = suivis.filter(p => !avant.has(p.id));
    // quelques poemes neufs passent devant ; un recueil entier d'un coup (premier chargement
    // rate, changement de source) ne doit pas defiler en entier
    if (neufs.length <= 20) nouveaux.push(...neufs);
  }
  if (recompter()) {
    D.signature = comptage.textes + "|" + D.recueil.length + "|" + D.essai.length;
    // les 30 plus uses, sans trier tout le dictionnaire
    const tri = [];
    for (const e of D.compte) {
      if (tri.length === 30 && e[1] <= tri[29][1]) continue;
      let i = tri.length;
      while (i > 0 && tri[i - 1][1] < e[1]) i--;
      tri.splice(i, 0, e);
      if (tri.length > 30) tri.pop();
    }
    D.cote = tri.map(([r, n]) => ({ mot: comptage.lisible.get(r) || r, emplois: n, cours: Math.max(1, Math.round(100 / Math.pow(1 + n, 0.7))) }));
    const dernier = D.recueil[D.recueil.length - 1];
    D.interdits = dernier ? dernier.interdits : [];
    bandeau.texte = null;
  }
  D.charge = true;
  majInfosDonnees();
}

// Dans l'ordre du temps : le poeme infini d'abord, puis le recueil. "Du plus recent" lit
// cette liste a l'envers.
function poemesDeLaSource() {
  if (S.source === "recueil") return D.recueil;
  if (S.source === "flux") return D.flux;
  if (S.source === "essai") return D.essai;
  return D.flux.concat(D.recueil);
}

const POEME_VIDE = {
  id: "vide", origine: "rien", titre: "en attente du premier poème", forme: "poïasie", resume: "",
  strophes: [{ poete: "", vers: [{ texte: "cinq poètes locaux" }, { texte: "attendent que la carte graphique se libère" }] }],
};

let curseurPoeme = -1;
let historique = [];
// l'historique (pour revenir en arriere au hasard) ne grossit plus sans fin sur un long set
const HISTORIQUE_MAX = 200;
function retenir(p) {
  historique.push(p);
  if (historique.length > HISTORIQUE_MAX) historique.splice(0, historique.length - HISTORIQUE_MAX);
}
function prochainPoeme(sens) {
  if (sens !== -1 && nouveaux.length) {
    const p = nouveaux.shift();
    retenir(p);
    return p;
  }
  const liste = poemesDeLaSource();
  if (!liste.length) return D.erreur ? Object.assign({}, POEME_VIDE, { titre: "la page est ouverte sans serveur", strophes: [{ poete: "", vers: [{ texte: D.erreur }] }] }) : POEME_VIDE;
  if (S.ordre === "hasard" && sens !== -1) {
    // au hasard, mais le recueil (les poemes en formes) sort trois fois sur quatre
    const p = S.source === "tout" && D.recueil.length && Math.random() < 0.75 ? tirer(D.recueil) : tirer(liste);
    retenir(p);
    return p;
  }
  if (S.ordre === "hasard" && historique.length > 1) {
    historique.pop();
    return historique[historique.length - 1];
  }
  curseurPoeme = (curseurPoeme + (sens === -1 ? -1 : 1) + liste.length) % liste.length;
  return liste[liste.length - 1 - curseurPoeme];
}

