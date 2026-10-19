"use strict";
/* ================================================================ le combo : deux scenes a la fois */

// Le calque : une seconde scene se dessine sur sa propre toile transparente, puis se pose sur
// la premiere, derriere ou devant, en lumiere (les deux s'additionnent), en difference (l'une
// creuse l'autre), en miroir, en tournant... Elle lit son propre poeme, ou le meme. Ses mondes
// (le ciel, la nuee, l'encre) sont ceux de sa scene : la meme scene ne se superpose pas a elle-meme.
//
// Repris le 2026-10-18 (Jiiji : « les combos, je trouve que c'est quand meme un truc tres
// important ») : deux masques (la scene n'apparait qu'a travers les lettres de la seconde, ou ses
// lettres la creusent), des entrees et des sorties en rideau, en iris ou en lettres qui se
// dissolvent, des mouvements lents de plus, une table d'affinites (quelles scenes vont bien
// ensemble, et comment), quatorze combos tout prets de plus. Corrige : la double trainee (le
// calque gardait sa propre trainee, posee sur une toile qui traine deja), la surexposition en
// « lumiere » (un calque immobile s'ajoutait a lui-meme, x1,4 a x2,2), et la scene du calque
// n'est plus dessinee quand on ne la verrait pas.
let enCalque = false;
const calque = { c: document.createElement("canvas"), g: null, scene: null, cle: null, voulu: null, poeme: null, tenueMin: 0, attend: null,
  fondu: 0, sens: 0, passage: null };
const MELANGES = { dessus: "source-over", lumiere: "lighter", ecran: "screen", difference: "difference", exclusion: "exclusion",
  superposition: "overlay", multiplier: "multiply" };
// les masques ne sont pas des modes de melange du navigateur : ils se calculent (dessinerMasque)
const MASQUES = new Set(["masque", "creuse"]);
const PASSAGES = ["fondu", "rideau", "iris", "lettres"];

// les options nouvelles s'ajoutent aux choix existants (rien n'est retire ni renomme)
for (const o of SCHEMA) for (const g of o.groupes || []) for (const it of g.items || []) {
  if (it.cle === "calqueMelange") it.options.push(["masque", "À travers ses lettres (la scène n'apparaît que dans les lettres de la seconde, toujours devant)"],
    ["creuse", "Ses lettres creusent la scène (toujours devant)"]);
  if (it.cle === "calqueMouvement") it.options.push(["derive", "Il dérive lentement"], ["respire", "Il respire (s'approche, s'éloigne)"],
    ["balance", "Il se balance"], ["spirale", "Il tourne en s'approchant"], ["quatre", "En quatre miroirs"], ["glisse", "Il glisse sans fin"]);
}
ajouterReglages("Combo", "Une seconde scène en même temps (touche W)", [
  { cle: "calqueEntree", nom: "Elle entre et s'en va", type: "choix", options: [["hasard", "Chaque fois autrement"], ["fondu", "En fondu"],
    ["rideau", "En rideau (un bord doux qui passe)"], ["iris", "En iris (un cercle qui s'ouvre)"], ["lettres", "En lettres (elle se dissout en lettres)"]] },
  { cle: "calqueMasqueOmbre", nom: "À travers ses lettres : ce qui reste de la scène autour", type: "curseur", min: 0, max: 1, pas: 0.05 },
  { cle: "calqueMasqueEpaisseur", nom: "À travers ses lettres : lettres élargies", type: "curseur", min: 0, max: 1, pas: 0.05 },
  { cle: "calqueMasqueVitre", nom: "À travers ses lettres : la lueur des lettres", type: "curseur", min: 0, max: 1, pas: 0.05 },
], { calqueEntree: "hasard", calqueMasqueOmbre: 0.12, calqueMasqueEpaisseur: 0.4, calqueMasqueVitre: 0.22 });

/* ---------------------------------------------------- ce qui va bien ensemble */

// La texture de chaque scene : deux pages a lire l'une sur l'autre se brouillent, une scene clairsemee
// devant une scene dense se lit, un grand mot qui bat fait une belle fenetre sur une scene dense.
// cout : ms par image mesurees le 2026-10-18 (audit, 1920 x 1080), pour ne pas poser deux scenes
// lourdes ensemble (le combo doit tenir sous 16 ms). Une scene ajoutee par un autre fichier peut
// donner `texture` et `cout` dans ajouterScene ; sinon : « objet », 6 ms.
const SCENES_TEXTURE = {
  nuee: "dense", averse: "dense", puits: "dense", tourbillon: "dense", etoiles: "dense", cretes: "lignes", onde: "lignes", ruban: "lignes",
  mystifier: "lignes", constellation: "clairseme", coupdedes: "page", lecture: "page", defilement: "page", battement: "grand",
  rosace: "motif", calligramme: "forme", texte3d: "objet",
};
const COUT_SCENES = {
  onde: 1.5, battement: 1.5, rosace: 4, averse: 4.5, cretes: 5, puits: 6.9, mystifier: 16, coupdedes: 16, constellation: 19,
  texte3d: 20, ruban: 28, nuee: 28, calligramme: 38, etoiles: 38, defilement: 50, tourbillon: 55, lecture: 55,
};
function textureDe(cle) {
  if (SCENES_TEXTURE[cle]) return SCENES_TEXTURE[cle];
  const d = SCENES_AJOUTEES.find(x => x.cle === cle);
  return (d && d.texture) || "objet";
}
function coutDe(cle) {
  if (cle in COUT_SCENES) return COUT_SCENES[cle];
  const d = SCENES_AJOUTEES.find(x => x.cle === cle);
  return d && typeof d.cout === "number" ? d.cout : 6;
}
// [texture de la scene, texture du calque] : note de 0 a 1, puis les melanges, les mouvements et
// la place qui leur vont (le premier de chaque liste est le meilleur)
const AFFINITES_TEXTURES = {
  "dense|grand": [0.95, ["masque", "masque", "creuse", "lumiere"], ["aucun", "bat", "respire"], "devant"],
  "dense|page": [0.7, ["masque", "lumiere", "ecran"], ["aucun", "derive"], "devant"],
  "dense|clairseme": [0.85, ["lumiere", "ecran"], ["aucun", "loin", "respire", "derive"], "devant"],
  "clairseme|dense": [0.8, ["ecran", "lumiere"], ["aucun", "respire", "tourne", "spirale"], "derriere"],
  "dense|lignes": [0.75, ["lumiere", "ecran", "difference"], ["aucun", "miroir", "renverse"], "devant"],
  "lignes|dense": [0.7, ["ecran", "lumiere"], ["aucun", "derive", "glisse"], "derriere"],
  "dense|motif": [0.75, ["ecran", "difference", "lumiere"], ["loin", "tourne", "quatre"], "devant"],
  "motif|dense": [0.75, ["ecran", "lumiere"], ["aucun", "respire", "spirale"], "derriere"],
  "clairseme|lignes": [0.75, ["lumiere", "ecran"], ["aucun", "glisse", "balance"], "derriere"],
  "lignes|clairseme": [0.75, ["lumiere", "ecran"], ["aucun", "derive"], "devant"],
  "clairseme|motif": [0.8, ["ecran", "lumiere"], ["tourne", "respire", "loin"], "derriere"],
  "motif|clairseme": [0.7, ["lumiere"], ["aucun", "derive"], "devant"],
  "grand|dense": [0.65, ["difference", "ecran"], ["bat", "aucun"], "derriere"],
  "grand|lignes": [0.7, ["difference", "lumiere"], ["aucun", "bat"], "devant"],
  "lignes|grand": [0.8, ["masque", "creuse", "difference"], ["aucun", "bat"], "devant"],
  "motif|grand": [0.85, ["masque", "creuse"], ["aucun", "respire"], "devant"],
  "forme|dense": [0.7, ["ecran", "lumiere"], ["aucun", "derive"], "derriere"],
  "forme|clairseme": [0.75, ["lumiere", "ecran"], ["aucun", "respire"], "derriere"],
  "objet|clairseme": [0.75, ["lumiere", "ecran"], ["aucun", "derive", "respire"], "derriere"],
  "objet|dense": [0.65, ["ecran", "lumiere"], ["aucun", "spirale"], "derriere"],
  "dense|objet": [0.65, ["lumiere", "ecran"], ["loin", "derive"], "devant"],
  "objet|grand": [0.8, ["masque", "creuse"], ["aucun"], "devant"],
  "page|dense": [0.45, ["ecran"], ["aucun", "respire"], "derriere"],
  "page|clairseme": [0.5, ["ecran", "lumiere"], ["derive"], "derriere"],
  "page|page": [0.1, ["ecran"], ["aucun"], "derriere"],
};
// des couples choisis a l'oeil (ceux des combos tout prets) : ils passent avant les textures
const AFFINITES_COUPLES = {
  "puits|onde": [1, ["lumiere"], ["aucun"], "devant"], "constellation|nuee": [1, ["lumiere"], ["aucun"], "devant"],
  "cretes|averse": [0.95, ["ecran"], ["aucun"], "derriere"], "rosace|ruban": [0.9, ["lumiere"], ["tourne"], "derriere"],
  "battement|puits": [0.9, ["difference"], ["bat"], "derriere"], "etoiles|constellation": [0.9, ["lumiere"], ["miroir"], "devant"],
  "nuee|battement": [1, ["masque"], ["aucun"], "devant"], "averse|battement": [1, ["masque"], ["respire"], "devant"],
  "puits|coupdedes": [0.95, ["masque"], ["aucun"], "devant"], "rosace|battement": [0.95, ["creuse"], ["aucun"], "devant"],
  "puits|constellation": [0.95, ["lumiere"], ["loin"], "devant"], "cretes|onde": [0.95, ["lumiere"], ["aucun"], "devant"],
  "calligramme|averse": [1, ["ecran"], ["aucun"], "derriere"], "puits|rosace": [0.9, ["lumiere"], ["quatre"], "devant"],
  "coupdedes|onde": [0.85, ["lumiere"], ["glisse"], "derriere"], "battement|cretes": [0.85, ["difference"], ["bat"], "devant"],
  "constellation|rosace": [0.9, ["ecran"], ["derive"], "derriere"], "rosace|averse": [0.85, ["ecran"], ["respire"], "derriere"],
  "ruban|etoiles": [0.85, ["ecran"], ["respire"], "derriere"], "puits|nuee": [0.8, ["ecran"], ["spirale"], "derriere"],
  // deux pages a lire l'une sur l'autre : illisible
  "lecture|defilement": [0.05, ["ecran"], ["aucun"], "derriere"], "lecture|coupdedes": [0.1, ["ecran"], ["aucun"], "derriere"],
};
// la note d'un couple (scene, calque), avec ce qui lui va ; le cout fait baisser la note des
// couples trop lourds pour tenir ensemble sous 16 ms
function affinite(a, b) {
  if (!a || !b || a === b) return { note: 0, melanges: ["ecran"], mouvements: ["aucun"], place: "derriere" };
  const x = AFFINITES_COUPLES[a + "|" + b] || AFFINITES_TEXTURES[textureDe(a) + "|" + textureDe(b)]
    || [textureDe(a) === textureDe(b) ? 0.35 : 0.55, ["ecran", "lumiere"], ["aucun", "derive"], "derriere"];
  const cout = coutDe(a) + coutDe(b);
  const k = cout > 45 ? 0.15 : cout > 30 ? 0.45 : cout > 20 ? 0.8 : 1;
  return { note: x[0] * k, melanges: x[1], mouvements: x[2], place: x[3], cout };
}

// les combos tout prets s'ajoutent aux ambiances (le panneau, comboPret et la manette les trouvent
// par leur nom « Combo : ... »)
Object.assign(AMBIANCES, {
  "Combo : Le mot fenêtre": { scene: "nuee", calque: "battement", calquePlace: "devant", calqueMelange: "masque", calqueOpacite: 1, calqueMouvement: "aucun", calquePoeme: "meme",
    calqueMasqueOmbre: 0.1, calqueMasqueEpaisseur: 0.45, calqueEntree: "lettres", palette: "crepuscule", trainees: 0.2, halo: 0.4, seuilHalo: 0.4 },
  "Combo : Il pleut dans les lettres": { scene: "averse", calque: "battement", calquePlace: "devant", calqueMelange: "masque", calqueOpacite: 1, calqueMouvement: "respire", calquePoeme: "meme",
    calqueMasqueOmbre: 0.18, calqueMasqueEpaisseur: 0.5, calqueEntree: "rideau", palette: "glace", police: "Impact", trainees: 0.1, halo: 0.5, seuilHalo: 0.35 },
  "Combo : Le puits à travers la page": { scene: "puits", calque: "coupdedes", calquePlace: "devant", calqueMelange: "masque", calqueOpacite: 1, calqueMouvement: "aucun", calquePoeme: "meme",
    calqueMasqueOmbre: 0.08, calqueMasqueEpaisseur: 0.6, calqueEntree: "iris", palette: "nuit", trainees: 0.25, halo: 0.5, seuilHalo: 0.35 },
  "Combo : Lettres creusées": { scene: "rosace", calque: "battement", calquePlace: "devant", calqueMelange: "creuse", calqueOpacite: 0.95, calqueMouvement: "aucun", calquePoeme: "meme",
    calqueEntree: "lettres", palette: "or", fond: "rayons", trainees: 0.15, halo: 0.35, seuilHalo: 0.45 },
  "Combo : Constellations au fond du puits": { scene: "puits", calque: "constellation", calquePlace: "devant", calqueMelange: "lumiere", calqueOpacite: 0.8, calqueMouvement: "loin", calquePoeme: "autre",
    calqueEntree: "iris", palette: "nuit", trainees: 0.3, halo: 0.55, seuilHalo: 0.35, vignetteGpu: 0.4 },
  "Combo : L'encre et les étoiles": { scene: "ruban", calque: "etoiles", calquePlace: "derriere", calqueMelange: "ecran", calqueOpacite: 0.6, calqueMouvement: "respire", calquePoeme: "autre",
    calqueEntree: "fondu", palette: "crepuscule", trainees: 0.2, halo: 0.3, seuilHalo: 0.45 },
  "Combo : Oscilloscope sur les crêtes": { scene: "cretes", calque: "onde", calquePlace: "devant", calqueMelange: "lumiere", calqueOpacite: 0.85, calqueMouvement: "aucun", calquePoeme: "meme",
    calqueEntree: "rideau", palette: "phosphore", police: "Consolas", fond: "aucun", trainees: 0.2, halo: 0.6, seuilHalo: 0.3, balayage: 0.25 },
  "Combo : Rosace en dérive": { scene: "constellation", calque: "rosace", calquePlace: "derriere", calqueMelange: "ecran", calqueOpacite: 0.55, calqueMouvement: "derive", calquePoeme: "autre",
    calqueEntree: "lettres", palette: "glace", fond: "aurore", trainees: 0.2, halo: 0.45, seuilHalo: 0.4 },
  "Combo : Il pleut sur le calligramme": { scene: "calligramme", calque: "averse", calquePlace: "derriere", calqueMelange: "ecran", calqueOpacite: 0.45, calqueMouvement: "aucun", calquePoeme: "meme",
    calqueEntree: "rideau", palette: "nuit", police: "Garamond", trainees: 0.25, halo: 0.35, seuilHalo: 0.4 },
  "Combo : Quatre rosaces dans le puits": { scene: "puits", calque: "rosace", calquePlace: "devant", calqueMelange: "lumiere", calqueOpacite: 0.6, calqueMouvement: "quatre", calquePoeme: "autre",
    calqueEntree: "iris", palette: "neon", trainees: 0.25, halo: 0.6, seuilHalo: 0.35 },
  "Combo : Coup de dés sur l'onde": { scene: "coupdedes", calque: "onde", calquePlace: "derriere", calqueMelange: "lumiere", calqueOpacite: 0.7, calqueMouvement: "glisse", calquePoeme: "meme",
    calqueEntree: "rideau", palette: "nuit", police: "Garamond", trainees: 0.15 },
  "Combo : Murmure dans le puits": { scene: "puits", calque: "nuee", calquePlace: "derriere", calqueMelange: "ecran", calqueOpacite: 0.65, calqueMouvement: "spirale", calquePoeme: "autre",
    calqueEntree: "lettres", palette: "vapeur", trainees: 0.3, halo: 0.45, seuilHalo: 0.4 },
  "Combo : Club des lettres": { scene: "battement", calque: "cretes", calquePlace: "devant", calqueMelange: "difference", calqueOpacite: 0.85, calqueMouvement: "bat", calquePoeme: "meme",
    calqueEntree: "rideau", palette: "arc", police: "Impact", pompe: 0.4, choc: 0.8, halo: 0.5, seuilHalo: 0.35 },
  "Combo : Aurore sur la rosace": { scene: "rosace", calque: "averse", calquePlace: "derriere", calqueMelange: "ecran", calqueOpacite: 0.5, calqueMouvement: "respire", calquePoeme: "autre",
    calqueEntree: "iris", palette: "glace", fond: "aurore", trainees: 0.2, halo: 0.4, seuilHalo: 0.4 },
});

/* ---------------------------------------------------- la toile du calque */

function dimensionnerCalque() {
  if (calque.c.width !== toile.width || calque.c.height !== toile.height || !calque.g) {
    calque.c.width = toile.width; calque.c.height = toile.height;
    calque.g = calque.c.getContext("2d");
  }
  if ("letterSpacing" in calque.g) calque.g.letterSpacing = S.espacement + "px";
}
// deux toiles de travail (masques, passages), a la taille de l'ecran, faites une fois
const tampons = [];
function tampon(i) {
  let t = tampons[i];
  if (!t) t = tampons[i] = { c: document.createElement("canvas"), g: null };
  if (t.c.width !== toile.width || t.c.height !== toile.height || !t.g) {
    t.c.width = toile.width; t.c.height = toile.height;
    t.g = t.c.getContext("2d");
    t.vide = true;
  }
  return t;
}
function cleCalque() {
  if (S.calque === "aucun") return null;
  if (S.calque !== "auto") return S.calque === sceneCle ? null : S.calque;
  // a tour de role, mais parmi ce qui va bien avec la scene (une seconde page a lire sur une
  // page, ou deux scenes lourdes ensemble, passent en dernier)
  const choix = ORDRE_AUTO.filter(k => k !== sceneCle && k !== calque.cle);
  const liste = choix.length ? choix : ORDRE_AUTO.filter(k => k !== sceneCle);
  const bons = liste.filter(k => affinite(sceneCle, k).note >= 0.5);
  return tirer(bons.length ? bons : liste);
}
function avecCalque(fn) {
  const ctx0 = ctx, tm = tenueMin;
  ctx = calque.g; tenueMin = calque.tenueMin; enCalque = true;
  try { return fn(); } finally { calque.tenueMin = tenueMin; ctx = ctx0; tenueMin = tm; enCalque = false; }
}
function construireCalque(nouveauPoeme) {
  calque.voulu = S.calque;
  calque.attend = null;
  const cle = cleCalque();
  if (!cle) { calque.scene = null; calque.cle = null; return; }
  if (S.calquePoeme === "meme") calque.poeme = poemeCourant;
  else if (nouveauPoeme || !calque.poeme) { const l = poemesDeLaSource(); calque.poeme = l.length ? tirer(l) : poemeCourant; }
  if (!calque.poeme) return;
  dimensionnerCalque();
  calque.cle = cle;
  avecCalque(() => {
    calque.g.setTransform(DPR, 0, 0, DPR, 0, 0);
    calque.g.textAlign = "center"; calque.g.textBaseline = "middle";
    calque.scene = construire(cle, calque.poeme);
    calque.scene.maj(0);
  });
}

/* ---------------------------------------------------- entrer, sortir */

// Le passage : comment le calque entre (sens 1) ou s'en va (sens -1), le temps du fondu.
// Rideau et iris : un bord doux qui passe. Lettres : la scene apparait dans de grandes lettres de
// son poeme qui se posent une a une, puis partout ; en sortant, des lettres la trouent.
function nouveauPassage(sens) {
  let type = S.calqueEntree === "hasard" ? tirer(PASSAGES) : S.calqueEntree;
  if (!PASSAGES.includes(type) || MASQUES.has(S.calqueMelange)) type = "fondu";
  const p = { type, sens, angle: tirer([0, 0.5, 1, 1.5]) * Math.PI, cx: hasard(0.3, 0.7), cy: hasard(0.3, 0.7), lettres: null, posees: 0, rampe: 0 };
  if (type === "lettres") {
    const texte = calque.poeme ? versDe(calque.poeme).map(v => v.texte).join("").replace(/[^A-Za-zÀ-ÿ]/g, "") : "";
    const src = texte.length ? texte : "poiasie";
    p.lettres = [];
    for (let i = 0; i < 220; i++) p.lettres.push({ t: src[Math.floor(Math.random() * src.length)], x: Math.random() * W, y: Math.random() * H,
      taille: hasard(50, 230), ang: hasard(-0.5, 0.5), seuil: Math.random() * 0.85 });
    p.lettres.sort((a, b) => a.seuil - b.seuil);
    const T = tampon(2);
    T.g.setTransform(1, 0, 0, 1, 0, 0); T.g.globalAlpha = 1; T.g.globalCompositeOperation = "source-over";
    T.g.clearRect(0, 0, T.c.width, T.c.height);
  }
  return p;
}
// le passage, applique a la toile du calque (que la scene vient d'y dessiner) ; q : de 0 a 1,
// la part du chemin faite (entree : on en voit q ; sortie : il en reste 1 - q)
function appliquerPassage(p, q) {
  const g = calque.g, w = calque.c.width, h = calque.c.height;
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (p.type === "rideau" || p.type === "iris") {
    // entree : visible avant le bord ; sortie : le bord efface derriere lui
    const doux = 0.22, x = lerp(-doux, 1, lisse(q));
    let grad;
    if (p.type === "rideau") {
      const c = Math.cos(p.angle), s = Math.sin(p.angle), L = Math.abs(c) * w + Math.abs(s) * h;
      const x0 = w / 2 - c * L / 2, y0 = h / 2 - s * L / 2;
      grad = g.createLinearGradient(x0, y0, x0 + c * L, y0 + s * L);
    } else {
      const cx = p.cx * w, cy = p.cy * h, R = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy));
      grad = g.createRadialGradient(cx, cy, 0, cx, cy, R);
    }
    const a0 = clamp(x, 0, 1), a1 = clamp(x + doux, 0, 1);
    const dedans = p.sens > 0 ? "rgba(0,0,0,1)" : "rgba(0,0,0,0)", dehors = p.sens > 0 ? "rgba(0,0,0,0)" : "rgba(0,0,0,1)";
    grad.addColorStop(0, dedans); grad.addColorStop(a0, dedans);
    grad.addColorStop(Math.max(a0, a1), dehors); grad.addColorStop(1, dehors);
    g.globalCompositeOperation = "destination-in";
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
  } else if (p.type === "lettres") {
    // les lettres se posent une a une sur un masque qui ne s'efface pas (quelques-unes par image) ;
    // a partir de la moitie, un voile partout monte jusqu'a tout couvrir (sans saut a la fin)
    const T = tampon(2), tg = T.g;
    tg.setTransform(DPR, 0, 0, DPR, 0, 0);
    tg.globalCompositeOperation = "source-over"; tg.fillStyle = "#000"; tg.textAlign = "center"; tg.textBaseline = "middle";
    while (p.posees < p.lettres.length && p.lettres[p.posees].seuil <= q) {
      const l = p.lettres[p.posees++];
      tg.save(); tg.translate(l.x, l.y); tg.rotate(l.ang);
      tg.font = "bold " + l.taille.toFixed(0) + "px \"" + S.police + "\", Georgia, serif";
      tg.fillText(l.t, 0, 0); tg.restore();
    }
    const rampe = lisse((q - 0.5) / 0.5);
    if (rampe > p.rampe + 0.001) {
      // le voile s'accumule : 1 - (1 - r1) / (1 - r0) de plus fait passer de r0 a r1
      const k = p.rampe >= 0.999 ? 1 : 1 - (1 - rampe) / (1 - p.rampe);
      tg.setTransform(1, 0, 0, 1, 0, 0); tg.globalAlpha = clamp(k, 0, 1); tg.fillRect(0, 0, w, h); tg.globalAlpha = 1;
      p.rampe = rampe;
    }
    g.globalCompositeOperation = p.sens > 0 ? "destination-in" : "destination-out";
    g.drawImage(T.c, 0, 0);
  }
  g.restore();
}

function majCalque(dt, reel) {
  // le calque entre et sort en fondu (le temps du fondu entre deux scenes)
  const sortir = S.calque === "aucun" || (calque.scene && calque.voulu !== S.calque);
  const sens = sortir ? -1 : 1;
  if (sens !== calque.sens && calque.scene) {
    // un passage qui change de sens repart du meme point, sans saut
    calque.sens = sens;
    calque.passage = nouveauPassage(sens);
  }
  calque.fondu = clamp((calque.fondu || 0) + sens * (reel || dt) / Math.max(0.3, S.fonduDuree), 0, 1);
  if (sortir) {
    if (calque.scene && calque.fondu > 0) { const sc = calque.scene; avecCalque(() => sc.maj(dt)); return; }
    calque.scene = null; calque.cle = null; calque.passage = null; calque.sens = 0;
    if (S.calque === "aucun") return;
  }
  if (calque.attend && calque.attend === poemeCourant && calque.voulu === S.calque) return;
  if (!calque.scene || calque.voulu !== S.calque || calque.cle === sceneCle) construireCalque(false);
  if (!calque.scene) return;
  if (calque.sens !== 1) { calque.sens = 1; calque.passage = nouveauPassage(1); }
  if (calque.fondu >= 1) calque.passage = null;
  const fini = avecCalque(() => calque.scene.maj(dt));
  if (fini) {
    // le meme poeme : le calque attend que la scene principale passe au suivant
    if (S.calquePoeme === "meme") { calque.scene = null; calque.attend = poemeCourant; calque.sens = 0; }
    else construireCalque(true);
  }
}

/* ---------------------------------------------------- poser le calque */

// le calque pose sur g selon son mouvement (lents : « tout va trop vite », Jiiji) ; decale : un
// petit decalage en pixels (pour elargir les lettres d'un masque)
function poserCalque(g, source, w, h, r, dx, dy) {
  const m = S.calqueMouvement;
  dx = dx || 0; dy = dy || 0;
  g.save();
  if (m === "quatre") {
    // quatre miroirs : le calque en petit, quatre fois, retourne comme un kaleidoscope
    for (let i = 0; i < 4; i++) {
      g.save();
      g.translate(w / 2 + dx, h / 2 + dy);
      g.scale(i % 2 ? -1 : 1, i > 1 ? -1 : 1);
      g.drawImage(source, 0, 0, w, h, 0, 0, w / 2, h / 2);
      g.restore();
    }
    g.restore();
    return;
  }
  if (m === "glisse") {
    const x = ((temps * 0.012) % 1) * w;
    g.drawImage(source, x + dx, dy); g.drawImage(source, x - w + dx, dy);
    g.restore();
    return;
  }
  g.translate(dx, dy);
  if (m === "miroir") { g.translate(w, 0); g.scale(-1, 1); }
  else if (m === "renverse") { g.translate(w, h); g.scale(-1, -1); }
  else if (m !== "aucun") {
    let s = 1, rot = 0, tx = 0, ty = 0;
    if (m === "loin") s = 0.5 * (1 + r.coup * 0.08);
    else if (m === "pres") s = 1.7;
    else if (m === "bat") s = 1 + r.coup * 0.12 + r.b * 0.04;
    else if (m === "tourne") rot = temps * 0.07;
    else if (m === "derive") { tx = Math.sin(temps * 0.05) * w * 0.06; ty = Math.cos(temps * 0.037) * h * 0.05; s = 1.08; }
    else if (m === "respire") s = 1 + 0.09 * Math.sin(temps * 0.21);
    else if (m === "balance") rot = 0.12 * Math.sin(temps * 0.09);
    else if (m === "spirale") { rot = temps * 0.05; s = 1.1 + 0.15 * Math.sin(temps * 0.11); }
    g.translate(w / 2 + tx, h / 2 + ty);
    if (rot) g.rotate(rot);
    g.scale(s, s);
    g.translate(-w / 2, -h / 2);
  }
  g.drawImage(source, 0, 0);
  g.restore();
}

// Les masques. « A travers ses lettres » : la scene ne se voit que dans les lettres du calque
// (elargies), le reste retombe vers le fond ; « creuse » : les lettres du calque sont des trous
// couleur du fond. a : la force du masque (0 : la scene telle quelle), elle suit le fondu.
function dessinerMasque(a, r) {
  const w = calque.c.width, h = calque.c.height, P = palette();
  const M = tampon(0), mg = M.g;
  mg.setTransform(1, 0, 0, 1, 0, 0); mg.globalAlpha = 1;
  mg.globalCompositeOperation = "source-over";
  mg.clearRect(0, 0, w, h);
  // les lettres elargies : le calque pose plusieurs fois, decale tout autour
  const e = S.calqueMelange === "masque" ? S.calqueMasqueEpaisseur * 7 * DPR : 0;
  poserCalque(mg, calque.c, w, h, r);
  if (e > 0.5) {
    const n = e > 4 ? 8 : 4;
    for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2 + (n === 4 ? Math.PI / 4 : 0); poserCalque(mg, calque.c, w, h, r, Math.cos(t) * e, Math.sin(t) * e); }
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (S.calqueMelange === "masque") {
    // la scene, gardee seulement dans les lettres
    const T = tampon(1), tg = T.g;
    tg.setTransform(1, 0, 0, 1, 0, 0); tg.globalAlpha = 1;
    tg.globalCompositeOperation = "copy"; tg.drawImage(toile, 0, 0);
    tg.globalCompositeOperation = "destination-in"; tg.drawImage(M.c, 0, 0);
    tg.globalCompositeOperation = "source-over";
    // autour, la scene retombe vers le fond ; dedans, elle revient entiere
    ctx.globalAlpha = clamp(a * (1 - S.calqueMasqueOmbre), 0, 1);
    ctx.fillStyle = P.fond[0]; ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = clamp(a, 0, 1);
    ctx.drawImage(T.c, 0, 0);
    // la vitre : les lettres de la fenetre gardent une faible lueur, sinon une scene clairsemee (la
    // nuee, l'averse) ne laissait pas lire la forme du mot (essai du 2026-10-18)
    ctx.globalCompositeOperation = palette().clair ? "multiply" : "lighter";
    ctx.globalAlpha = clamp(a * S.calqueMasqueVitre, 0, 1);
    if (ctx.globalAlpha > 0.01) ctx.drawImage(M.c, 0, 0);
    ctx.globalCompositeOperation = "source-over";
  } else {
    // creuse : les lettres prennent la couleur du fond
    mg.globalCompositeOperation = "source-in";
    mg.fillStyle = P.fond[0]; mg.fillRect(0, 0, w, h);
    mg.globalCompositeOperation = "source-over";
    ctx.globalAlpha = clamp(a, 0, 1);
    ctx.drawImage(M.c, 0, 0);
  }
  ctx.restore();
}

function dessinerCalque() {
  if (!calque.scene) return;
  // un masque se calcule sur la scene deja dessinee : il est toujours devant
  if (MASQUES.has(S.calqueMelange) && S.calquePlace === "derriere") {
    S.calquePlace = "devant";
    if (controles.calquePlace) controles.calquePlace.maj();
    return;
  }
  const r = rythme();
  const p = calque.passage, f = calque.fondu || 0;
  // ce qu'on verra, avant de rien dessiner : un calque invisible ne coute rien
  let a = S.calqueOpacite;
  if (r.on) a *= lerp(1, clamp(0.2 + r.b * 1.1, 0, 1), clamp(S.calqueMusique, 0, 1));
  // un passage (rideau, iris, lettres) montre le calque par morceaux ; un fondu, en entier
  const q = p && p.type !== "fondu" ? (p.sens > 0 ? f : 1 - f) : null;
  a *= q === null ? lisse(f) : lisse(clamp(f * 4, 0, 1));
  // en lumiere, la toile garde (trainees) de l'image d'avant : un calque immobile s'ajoutait a
  // lui-meme jusqu'a 1 / (1 - trainees) fois (x2,2 a 0,55) ; on lui retire cette part
  const t = S.trainees > 0 ? clamp(S.trainees, 0, 0.97) : 0;
  const melange = S.calqueMelange;
  if (melange === "lumiere") a *= 1 - 0.9 * t;
  else if (melange === "ecran") a *= 1 - 0.5 * t;
  if (a <= 0.01 || (q !== null && p.sens < 0 && q >= 0.999)) return;
  const g = calque.g, w = calque.c.width, h = calque.c.height;
  // une seule trainee : celle de la toile (le calque y est pose chaque image, elle le fait trainer
  // comme le reste) ; le calque lui-meme repart d'une toile vide
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = "source-over";
  g.globalAlpha = 1;
  g.clearRect(0, 0, w, h);
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  g.textAlign = "center"; g.textBaseline = "middle";
  avecCalque(() => calque.scene.dessiner());
  if (MASQUES.has(melange)) return dessinerMasque(clamp(a, 0, 1), r);
  if (q !== null) appliquerPassage(p, q);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = clamp(a, 0, 1);
  ctx.globalCompositeOperation = MELANGES[melange] || "lighter";
  poserCalque(ctx, calque.c, w, h, r);
  ctx.restore();
}
