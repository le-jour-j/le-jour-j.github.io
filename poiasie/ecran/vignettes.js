"use strict";
/* ================================================================ les vignettes */

// Chaque mot (ou chaque lettre) est ecrit une fois dans une petite image, puis seulement pose :
// 710 mots tournes, chacun a sa taille, coutaient 170 ms par image (mesure du 2026-10-16).
//
// Refait le 2026-10-18 (grand chantier, audit de l'ecran) :
// - les vignettes vivent dans de grandes pages (un atlas de 2048 x 2048) : poser mille lettres
//   prises dans la meme page coute 1,5 fois moins que les prendre dans mille petites toiles
//   (mesure : 2000 lettres, 13 ms contre 9) ;
// - une vignette neuve n'est jamais ecrite au milieu de l'image : ecrire dans une page dont on
//   vient de poser des lettres oblige Chrome a la recopier en entier (mesure : 40 ecritures
//   melees a 2000 poses, 8 ms deviennent 60). Les demandes attendent le debut de l'image
//   suivante (vignettes.nouvelleImage, appelee par peindreFond) ; en attendant, la lettre est
//   posee depuis une vignette voisine (meme texte, meme couleur, autre taille) ou ecrite a la main ;
// - budget de creations par image, plafond en memoire, eviction page par page (la moins servie)
//   au lieu du vidage d'un coup a 5000, qui refaisait des centaines de vignettes dans l'image
//   suivante (une saccade) ;
// - lueur, aberration et contour proportionnels a la taille : en grossissant de 22 a 22,01 px,
//   une lettre changeait de palier et sa lueur retrecissait d'un tiers d'un coup ;
// - paliers plus petits (les lettres de 3 px gresillaient, reduites de 10 px) et plus grands
//   (au-dessus de 168 px, les lettres proches etaient agrandies, donc floues) ;
// - tailles fixes nettes : une scene dont les lettres gardent leur taille peut demander une
//   vignette a sa taille exacte (option `net`), sans reduction.
const PALIERS = [5, 7, 10, 15, 22, 33, 50, 75, 112, 168, 252, 378];
const LUEUR_REF = 30;          // a 30 px, la lueur, l'aberration et le contour valent ce qu'ils valaient
const ATLAS = 2048;            // cote d'une page, en pixels de l'ecran
const ATLAS_PAGES = 8;         // 8 pages de 16 Mo
const GRANDES_OCTETS = 64e6;   // les vignettes trop grandes pour une page ont leur propre toile
const BUDGET_IMAGE = 96;       // vignettes creees au plus par image
const BUDGET_PIXELS = 3e6;     // et pas plus de pixels peints par image
const DIRECTES_MAX = 160;      // lettres ecrites a la main par image, en attendant leur vignette

function palierDe(taille) {
  for (let i = 0; i < PALIERS.length; i++) if (PALIERS[i] >= taille) return PALIERS[i];
  return PALIERS[PALIERS.length - 1];
}

const vignettes = {
  styles: new Map(),     // cle de style -> Map(couleur -> Map(code -> Map(texte -> v)))
  pages: [], grandes: [], octetsGrandes: 0, n: 0,
  attente: [],           // les vignettes demandees, peintes au debut de l'image suivante
  proches: new Map(),    // texte|couleur -> la derniere vignette faite (pour patienter)
  image: 0, directes: 0, etageres: new Map(),
  get size() { return this.n; },
  clear() {
    for (const p of this.pages) { p.c.width = 0; }
    for (const v of this.grandes) if (v.c) v.c.width = 0;
    this.styles.clear(); this.pages = []; this.grandes = []; this.octetsGrandes = 0; this.n = 0;
    this.attente = []; this.proches.clear(); this.etageres.clear();
    styleV.cle = null; styleV.carte = null;
    anciennes.carte.clear();
  },
  // le debut d'une image : on peint ce qui a ete demande, avant toute pose
  nouvelleImage() {
    this.image++;
    this.directes = 0;
    if (this.attente.length) {
      let faites = 0, pixels = 0;
      const garde = [];
      for (const v of this.attente) {
        if (v.mort) continue;
        if (faites >= BUDGET_IMAGE || pixels >= BUDGET_PIXELS) { garde.push(v); continue; }
        peindre(v);
        faites++; pixels += v.sw * v.sh;
      }
      this.attente = garde;
    }
    if (this.octetsGrandes > GRANDES_OCTETS) this.evincerGrandes();
  },
  evincerGrandes() {
    // les grandes toiles les moins servies partent, quelques-unes par image
    this.grandes.sort((a, b) => a.vu - b.vu);
    let k = 0;
    while (this.octetsGrandes > GRANDES_OCTETS * 0.85 && k < this.grandes.length && k < 24) {
      const v = this.grandes[k];
      if (this.image - v.vu < 30 && this.octetsGrandes < GRANDES_OCTETS * 1.5) break;
      retirer(v); k++;
    }
    this.grandes = this.grandes.filter(v => !v.mort);
  },
};

// la cle du style : tout ce qui change le dessin d'une lettre, hors texte, couleur et taille
const styleV = { cle: null, carte: null, vals: [] };
function carteDuStyle() {
  const P = palette(), s = styleV.vals;
  const clair = P.clair ? 1 : 0;
  if (styleV.carte && s[0] === S.police && s[1] === S.espacement && s[2] === DPR && s[3] === S.lueur && s[4] === S.aberration
    && s[5] === S.contour && s[6] === clair && s[7] === S.ombre && s[8] === S.graisse && s[9] === P.note) return styleV.carte;
  styleV.vals = [S.police, S.espacement, DPR, S.lueur, S.aberration, S.contour, clair, S.ombre, S.graisse, P.note];
  styleV.cle = styleV.vals.join("|");
  let c = vignettes.styles.get(styleV.cle);
  if (!c) { c = new Map(); vignettes.styles.set(styleV.cle, c); }
  styleV.carte = c;
  return c;
}
function sousCarte(m, k) {
  let x = m.get(k);
  if (!x) { x = new Map(); m.set(k, x); }
  return x;
}

// la taille d'une police ("italic 22.0px ...") : lue une fois par police
const taillesPolices = new Map();
function tailleDePolice(pol) {
  let t = taillesPolices.get(pol);
  if (t === undefined) {
    const m = /(\d+(?:\.\d+)?)px/.exec(pol);
    t = m ? parseFloat(m[1]) : 16;
    if (taillesPolices.size > 4000) taillesPolices.clear();
    taillesPolices.set(pol, t);
  }
  return t;
}

// Une vignette demandee : sa place est retenue tout de suite (dans une page ou sa propre toile),
// elle sera peinte au debut de l'image suivante. d : ce qu'il faut pour la peindre.
function demander(parent, t, d) {
  const v = mesurerVignette(t, d, parent);
  if (!placer(v)) {
    // trop grande pour une page : sa propre toile
    v.c = document.createElement("canvas");
    v.octets = v.sw * v.sh * 4;
    vignettes.grandes.push(v);
    vignettes.octetsGrandes += v.octets;
  }
  parent.set(t, v);
  vignettes.n++;
  vignettes.attente.push(v);
  return v;
}
function mesurerVignette(t, d, parent) {
  const fs = d.fs;
  const nu = !!d.nu;
  const flou = nu || d.sansLueur || !(S.lueur > 0) ? 0 : S.lueur * 16 * fs / LUEUR_REF;
  const dec = nu ? 0 : S.aberration * 2.2 * fs / LUEUR_REF;
  const pad = fs * 0.35 + flou * 1.4 + dec + (nu ? 0 : fs * 0.1 * S.ombre + fs * 0.03 * S.graisse);
  const w = mesurer(t, d.pol) + pad * 2, h = fs * 1.4 + pad * 2;
  const v = { t, couleur: d.couleur, pol: d.pol, fs, w, h, flou, dec, nu, pret: false, mort: false, vu: vignettes.image,
    sw: Math.max(1, Math.ceil(w * DPR)), sh: Math.max(1, Math.ceil(h * DPR)), parent, page: null, c: null, sx: 0, sy: 0 };
  return v;
}

// une place dans une page : des etageres de hauteur ronde, remplies de gauche a droite
function placer(v) {
  const gap = 2, w = v.sw + gap, hc = Math.ceil((v.sh + gap) / 8) * 8;
  if (w > ATLAS / 2 || hc > 320) return false;
  let et = vignettes.etageres.get(hc);
  if (et && (et.page.generation !== et.gen || et.x + w > ATLAS)) et = null;
  if (!et) {
    let page = vignettes.pages.length ? vignettes.pages[vignettes.pages.length - 1] : null;
    if (!page || page.yLibre + hc > ATLAS) {
      page = vignettes.pages.find(p => p.yLibre + hc <= ATLAS) || nouvellePage();
      if (page.yLibre + hc > ATLAS) return false;
      // la page servie en dernier passe en fin de liste
      vignettes.pages.splice(vignettes.pages.indexOf(page), 1); vignettes.pages.push(page);
    }
    et = { page, gen: page.generation, y: page.yLibre, x: 0 };
    page.yLibre += hc;
    vignettes.etageres.set(hc, et);
  }
  v.page = et.page; v.sx = et.x; v.sy = et.y;
  et.x += w;
  et.page.entrees.push(v);
  return true;
}
function nouvellePage() {
  if (vignettes.pages.length < ATLAS_PAGES) {
    const c = document.createElement("canvas");
    c.width = ATLAS; c.height = ATLAS;
    const page = { c, g: c.getContext("2d"), yLibre: 0, entrees: [], vu: vignettes.image, generation: 1, aVider: false, sale: true,
      num: vignettes.pages.reduce((a, p) => Math.max(a, p.num + 1), 0) };
    vignettes.pages.unshift(page);
    return page;
  }
  // toutes les pages sont pleines : la moins servie est rendue (ses vignettes seront refaites,
  // au budget, si on les demande encore)
  let vieille = vignettes.pages[0];
  for (const p of vignettes.pages) if (p.vu < vieille.vu) vieille = p;
  for (const v of vieille.entrees) retirer(v, true);
  vieille.entrees = []; vieille.yLibre = 0; vieille.generation++;
  // l'effacement se fait au debut de l'image suivante, avant les poses (voir peindre)
  vieille.aVider = true;
  return vieille;
}
function retirer(v, dansPage) {
  if (v.mort) return;
  v.mort = true;
  if (v.parent && v.parent.get(v.t) === v) v.parent.delete(v.t);
  vignettes.n--;
  if (v.c) { vignettes.octetsGrandes -= v.octets || 0; v.c.width = 0; v.c = null; }
  if (!dansPage && v.page) { /* sa place reste perdue jusqu'a ce que la page soit rendue */ }
  const kp = v.t + "|" + v.couleur;
  if (vignettes.proches.get(kp) === v) vignettes.proches.delete(kp);
}

// peindre une vignette demandee (seulement depuis nouvelleImage : jamais entre deux poses)
function peindre(v, seule) {
  let g, ox = 0, oy = 0;
  if (v.page) {
    const page = v.page;
    page.sale = true;  // a renvoyer a la carte (lettresGl) avant sa prochaine pose
    if (page.aVider) { page.g.setTransform(1, 0, 0, 1, 0, 0); page.g.clearRect(0, 0, ATLAS, ATLAS); page.aVider = false; }
    g = page.g; ox = v.sx; oy = v.sy;
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.beginPath(); g.rect(ox, oy, v.sw, v.sh); g.clip();
  } else {
    v.c.width = v.sw; v.c.height = v.sh;
    g = v.c.getContext("2d");
    g.save();
  }
  g.setTransform(DPR, 0, 0, DPR, ox, oy);
  const t = v.t, w = v.w, h = v.h, couleur = v.couleur, fs = v.fs, clair = palette().clair;
  if ("letterSpacing" in g) g.letterSpacing = S.espacement + "px";
  g.font = v.pol; g.textAlign = "center"; g.textBaseline = "middle";
  g.globalAlpha = 1; g.shadowBlur = 0; g.globalCompositeOperation = "source-over";
  if (v.dec > 0) {
    g.globalCompositeOperation = clair ? "multiply" : "lighter";
    g.fillStyle = "rgba(255,30,80,0.75)"; g.fillText(t, w / 2 - v.dec, h / 2);
    g.fillStyle = "rgba(30,200,255,0.75)"; g.fillText(t, w / 2 + v.dec, h / 2 + v.dec * 0.3);
    g.globalCompositeOperation = "source-over";
  }
  if (S.ombre > 0 && !v.nu) {
    // le relief : une ombre decalee (noire sur papier, de la couleur des notes sur la nuit)
    const d = fs * 0.07 * S.ombre;
    g.fillStyle = clair ? "rgba(0,0,0," + (0.3 * Math.min(1, S.ombre)).toFixed(2) + ")" : palette().note;
    g.globalAlpha = clair ? 1 : 0.75;
    g.fillText(t, w / 2 + d, h / 2 + d);
    g.globalAlpha = 1;
  }
  // (le flou de l'ombre ne suit pas l'echelle : comme avant, il est donne en pixels de la toile)
  if (v.flou) { g.shadowColor = couleur; g.shadowBlur = v.flou; }
  g.fillStyle = couleur; g.fillText(t, w / 2, h / 2);
  g.shadowBlur = 0;
  if (S.graisse > 0 && !v.nu) {
    g.lineJoin = "round"; g.lineWidth = fs * 0.03 * S.graisse; g.strokeStyle = couleur;
    g.strokeText(t, w / 2, h / 2);
  }
  if (S.contour && !v.nu) {
    g.lineWidth = Math.max(0.5, fs / LUEUR_REF);
    g.strokeStyle = clair ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.55)";
    g.strokeText(t, w / 2, h / 2);
  }
  g.restore();
  v.pret = true;
  if (!seule) vignettes.proches.set(t + "|" + couleur, v);
}

// La vignette d'un mot dans l'atlas, a son palier de taille (ou a sa taille exacte, `net`). Rend
// une vignette prete, ou une voisine prete en attendant (v.fs dit sa taille), ou null : alors
// l'appelant ecrit le mot a la main. Elle se pose avec poserVignette(v).
function vignetteLettre(t, taille, couleur, italique, net) {
  const fs = net ? Math.max(4, Math.round(taille * 2) / 2) : palierDe(taille);
  const m3 = sousCarte(sousCarte(carteDuStyle(), couleur), fs * 2 + (italique ? 0.5 : 0));
  let v = m3.get(t);
  if (!v) v = demander(m3, t, { fs, couleur, pol: police(fs, italique) });
  v.vu = vignettes.image;
  if (v.pret) { if (v.page) v.page.vu = vignettes.image; return v; }
  return voisine(t, couleur);
}
// la meme chose pour une police donnee telle quelle (les mots de la Lecture, du maelstrom)
// sansLueur : sans lueur (les notes de marge) ; nu : sans aucun effet (le maelstrom, comme avant)
function vignetteTexte(t, pol, couleur, sansLueur, nu) {
  const m3 = sousCarte(sousCarte(carteDuStyle(), couleur), nu ? "n" + pol : sansLueur ? "s" + pol : pol);
  let v = m3.get(t);
  if (!v) v = demander(m3, t, { fs: tailleDePolice(pol), couleur, pol, sansLueur, nu });
  v.vu = vignettes.image;
  if (v.pret) { if (v.page) v.page.vu = vignettes.image; return v; }
  return voisine(t, couleur);
}
function voisine(t, couleur) {
  const p = vignettes.proches.get(t + "|" + couleur);
  if (p && p.pret && !p.mort) { p.vu = vignettes.image; if (p.page) p.page.vu = vignettes.image; return p; }
  return null;
}
// poser une vignette : la transformation (position, angle, echelle) est deja en place
function poserVignette(v) {
  if (v.page) ctx.drawImage(v.page.c, v.sx, v.sy, v.sw, v.sh, -v.w / 2, -v.h / 2, v.w, v.h);
  else ctx.drawImage(v.c, -v.w / 2, -v.h / 2, v.w, v.h);
}
// en attendant sa vignette, un mot ecrit a la main (sans lueur : elle viendra a l'image suivante) ;
// au-dela de DIRECTES_MAX par image, il attend une image de plus
function ecrireDirect(t, pol, couleur) {
  if (vignettes.directes++ > DIRECTES_MAX) return;
  ctx.font = pol; ctx.fillStyle = couleur; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(t, 0, 0);
}

// L'ancienne vignetteMot, gardee telle quelle pour les fichiers qui posent eux-memes v.c (scenes-3d) :
// une toile par vignette, toujours rendue tout de suite, { c, w, h, fs }. Lueur, aberration et
// contour proportionnels a la taille comme dans l'atlas. Son cache se vide peu a peu (les plus
// anciennes d'abord, celles qui ont servi recemment ont une seconde chance), jamais d'un coup.
// On ne libere pas la toile d'une vignette retiree : un autre fichier peut encore la garder.
const anciennes = { carte: new Map(), image: 0, PLAFOND: 5000 };
function vignetteMot(t, taille, couleur, italique) {
  const fs = palierDe(taille);
  carteDuStyle();
  const k = styleV.cle + "|" + couleur + "|" + fs + (italique ? "i|" : "|") + t;
  let v = anciennes.carte.get(k);
  if (v) { v.vu = vignettes.image; return v; }
  const n = anciennes.carte.size;
  if (n > anciennes.PLAFOND && anciennes.image !== vignettes.image) {
    // au plus 64 retraits par image
    anciennes.image = vignettes.image;
    let retires = 0, vus = 0;
    for (const [kk, vv] of anciennes.carte) {
      if (retires >= 64 || vus++ > 256) break;
      anciennes.carte.delete(kk);
      if (vignettes.image - vv.vu < 60 && n < anciennes.PLAFOND * 1.5) anciennes.carte.set(kk, vv); else retires++;
    }
  }
  v = mesurerVignette(t, { t, couleur, pol: police(fs, italique), fs }, null);
  v.c = document.createElement("canvas");
  peindre(v, true);
  anciennes.carte.set(k, v);
  return v;
}

// le maelstrom : ses mots ont leur police toute faite (taille et italique tires au hasard)
function vignette(t, pol, couleur) {
  return vignetteTexte(t, pol, couleur, true, true);
}

const maelstrom = {
  mots: [],
  naissances: [],
  dessus: false,
  remplir() {
    const n = Math.round(S.maelstrom);
    while (this.mots.length < n) this.mots.push(this.nouveau(true));
    if (this.mots.length > n) this.mots.length = n;
  },
  nouveau(partout) {
    const R = Math.hypot(W, H) * 0.55;
    const source = D.corpus.length ? D.corpus : ["poïasie", "liard", "obole", "créance"];
    const t = tirer(source);
    // la taille au demi-pixel : autant de vignettes en moins, a l'oeil la meme chose
    const taille = Math.round(hasard(7, 15) * Math.max(0.6, S.taille) * 2) / 2;
    const ital = Math.random() < 0.3, pol = police(taille, ital);
    // la vignette est peinte 1,3 fois plus grande : un mot grandit jusqu'a 1,45 fois en s'eloignant
    return { t: casse(t), pol, polV: police(taille * 1.3, ital), r: partout ? hasard(R * 0.08, R) : hasard(R * 0.85, R * 1.05), th: hasard(0, Math.PI * 2),
      a: hasard(0.12, 0.42), graine: Math.random() * 1000 };
  },
  naitre(t) {
    const pol = police(Math.round(hasard(13, 22) * S.taille), true);
    this.naissances.push({ t: casse(t), pol, r: 2, th: hasard(0, Math.PI * 2), vie: 0 });
    if (this.naissances.length > 80) this.naissances.shift();
  },
  maj(dt) {
    this.remplir();
    const R = Math.hypot(W, H) * 0.55;
    const sens = S.sensHoraire ? 1 : -1;
    for (const m of this.mots) {
      const k = m.r / R;
      m.th += sens * S.spin * (0.25 + 1.4 / (0.12 + k)) * dt * 0.35;
      m.r -= S.aspiration * (14 + 90 * (1 - k)) * dt * 0.6;
      if (m.r < 6) Object.assign(m, this.nouveau(false));
    }
    for (const n of this.naissances) {
      n.vie += dt; n.r += (30 + n.r * 0.35) * dt; n.th += sens * S.spin * 0.6 * dt;
    }
    this.naissances = this.naissances.filter(n => n.r < R * 0.9);
  },
  dessiner() {
    const cx = W / 2, cy = H / 2;
    const P = palette();
    ctx.save();
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const R = Math.hypot(W, H) * 0.55;
    const sensA = Math.PI / 2 * (S.sensHoraire ? 1 : -1);
    for (const m of this.mots) {
      const k = m.r / R;
      const x = cx + Math.cos(m.th) * m.r, y = cy + Math.sin(m.th) * m.r * S.inclinaison;
      const alpha = m.a * clamp(k * 6, 0, 1) * clamp((1 - k) * 4, 0, 1);
      if (alpha < 0.004) continue;
      ctx.globalAlpha = alpha;
      const ech = 0.45 + k, ang = m.th + sensA;
      const cos = Math.cos(ang) * ech, sin = Math.sin(ang) * ech;
      ctx.setTransform(DPR * cos, DPR * sin, -DPR * sin, DPR * cos, DPR * x, DPR * y);
      // l'arc-en-ciel tourne sans cesse : la couleur par pas de 10 degres, une vignette chacune
      const couleur = P.arcEnCiel ? hsl(Math.round(((m.th * 57 + temps * 30) % 360 + 360) % 360 / 10) * 10 % 360, 80, 65) : P.note;
      const v = vignette(m.t, m.polV || m.pol, couleur);
      if (v) { const s = tailleDePolice(m.pol) / v.fs; if (s !== 1) ctx.scale(s, s); poserVignette(v); }
      else ecrireDirect(m.t, m.pol, couleur);
    }
    for (const n of this.naissances) {
      const x = cx + Math.cos(n.th) * n.r, y = cy + Math.sin(n.th) * n.r * S.inclinaison;
      const a = clamp(n.vie * 2, 0, 1) * clamp(1 - n.r / (R * 0.9), 0, 1);
      if (a < 0.004) continue;
      ctx.globalAlpha = a;
      ctx.setTransform(DPR, 0, 0, DPR, DPR * x, DPR * y);
      const v = vignette(n.t, n.pol, P.accent);
      if (v) { const s = tailleDePolice(n.pol) / v.fs; if (s !== 1) ctx.scale(s, s); poserVignette(v); }
      else ecrireDirect(n.t, n.pol, P.accent);
    }
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.restore();
  },
};

/* ================================================================ les lettres par la carte graphique */

// Meme posees depuis l'atlas, mille lettres coutent a Chrome 3 a 6 ms de processeur (chaque
// drawImage passe par toute la machinerie de la toile 2D : mesure du 2026-10-18, 2000 lettres,
// 6 ms quelle que soit la source). Une scene qui pose ses lettres « en lot » les confie ici : elles
// sont rangees dans un tableau, puis dessinees d'un seul coup par WebGL (une instance par lettre,
// prise dans l'atlas), et l'image obtenue est recopiee sur la toile en une fois (0,4 ms). Le
// resultat est le meme : lettres posees les unes sur les autres, puis le tout pose sur la toile.
// Une scene qui doit cacher des lettres deja posees (les cretes) demande un effacement entre deux.
const LOT_SOMMET = `#version 300 es
in vec2 q; in vec4 rect; in vec2 taille; in vec4 mat; in vec2 pos; in vec2 ap;
uniform vec2 res;
out vec2 uv; out float alpha; flat out int page;
void main() {
  vec2 l = (q - 0.5) * taille;
  vec2 d = vec2(mat.x * l.x + mat.z * l.y, mat.y * l.x + mat.w * l.y) + pos;
  gl_Position = vec4(d.x / res.x * 2.0 - 1.0, 1.0 - d.y / res.y * 2.0, 0.0, 1.0);
  uv = (rect.xy + q * rect.zw) / ${ATLAS}.0;
  alpha = ap.x; page = int(ap.y + 0.5);
}`;
const LOT_POINT = `#version 300 es
precision highp float;
in vec2 uv; in float alpha; flat in int page;
uniform sampler2D t0, t1, t2, t3, t4, t5, t6, t7;
out vec4 o;
void main() {
  vec4 c;
  if (page == 0) c = texture(t0, uv); else if (page == 1) c = texture(t1, uv); else if (page == 2) c = texture(t2, uv);
  else if (page == 3) c = texture(t3, uv); else if (page == 4) c = texture(t4, uv); else if (page == 5) c = texture(t5, uv);
  else if (page == 6) c = texture(t6, uv); else c = texture(t7, uv);
  o = c * alpha;
}`;
const LOT_EFFACE_SOMMET = `#version 300 es
in vec2 p; uniform vec2 res;
void main() { gl_Position = vec4(p.x / res.x * 2.0 - 1.0, 1.0 - p.y / res.y * 2.0, 0.0, 1.0); }`;
const LOT_EFFACE_POINT = `#version 300 es
precision highp float; out vec4 o; void main() { o = vec4(0.0, 0.0, 0.0, 1.0); }`;
const LOT_FLOATS = 14;
const LOT_ATTRIBUTS = [[1, 4, 0], [2, 2, 4], [3, 4, 6], [4, 2, 10], [5, 2, 12]];  // rect, taille, mat, pos, ap
const lettresGl = {
  c: document.createElement("canvas"), gl: null, essaye: false, ok: false, actif: false, cible: null,
  n: 0, donnees: new Float32Array(LOT_FLOATS * 4096), coupes: [], textures: [], pages: new Set(),

  init() {
    if (this.essaye) return this.ok;
    this.essaye = true;
    try {
      const gl = this.c.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false });
      if (!gl) return false;
      this.gl = gl;
      const prog = (vs, fs, attributs) => {
        const p = gl.createProgram();
        for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
          const sh = gl.createShader(type);
          gl.shaderSource(sh, src); gl.compileShader(sh);
          if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
          gl.attachShader(p, sh);
        }
        attributs.forEach((a, i) => gl.bindAttribLocation(p, i, a));
        gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
        return p;
      };
      this.prog = prog(LOT_SOMMET, LOT_POINT, ["q", "rect", "taille", "mat", "pos", "ap"]);
      this.progEfface = prog(LOT_EFFACE_SOMMET, LOT_EFFACE_POINT, ["p"]);
      gl.useProgram(this.prog);
      this.uRes = gl.getUniformLocation(this.prog, "res");
      for (let i = 0; i < 8; i++) gl.uniform1i(gl.getUniformLocation(this.prog, "t" + i), i);
      this.uResEfface = gl.getUniformLocation(this.progEfface, "res");
      // les lettres : un carre (4 coins) repete par instance
      this.vao = gl.createVertexArray();
      gl.bindVertexArray(this.vao);
      const coins = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, coins);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      this.buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
      gl.bufferData(gl.ARRAY_BUFFER, this.donnees.byteLength, gl.DYNAMIC_DRAW);
      this.bufTaille = this.donnees.byteLength;
      for (const [k, nb, o] of LOT_ATTRIBUTS) {
        gl.enableVertexAttribArray(k); gl.vertexAttribPointer(k, nb, gl.FLOAT, false, LOT_FLOATS * 4, o * 4); gl.vertexAttribDivisor(k, 1);
      }
      gl.bindVertexArray(null);
      this.vaoEfface = gl.createVertexArray();
      gl.bindVertexArray(this.vaoEfface);
      this.bufEfface = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufEfface);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.bindVertexArray(null);
      this.c.addEventListener("webglcontextlost", e => { e.preventDefault(); this.ok = false; this.actif = false; });
      this.ok = true;
    } catch (e) {
      console.warn("poiasie : lettres par la carte graphique indisponibles", e);
      this.ok = false;
    }
    return this.ok;
  },
  // une scene ouvre le lot avant ses lettres et le ferme apres ; entre les deux, poserLettre et
  // poserTexte rangent leurs lettres ici au lieu de les dessiner. Rend vrai si le lot est ouvert.
  ouvrir() {
    if (this.actif || S.lettresGl === false || !this.init()) return false;
    this.actif = true; this.cible = ctx; this.n = 0; this.coupes.length = 0; this.pages.clear();
    return true;
  },
  ajouter(v, a, b, c, d, e, f, alpha) {
    if (this.n * LOT_FLOATS + LOT_FLOATS > this.donnees.length) {
      const neuf = new Float32Array(this.donnees.length * 2);
      neuf.set(this.donnees); this.donnees = neuf;
    }
    const T = this.donnees, i = this.n++ * LOT_FLOATS;
    T[i] = v.sx; T[i + 1] = v.sy; T[i + 2] = v.sw; T[i + 3] = v.sh;
    T[i + 4] = v.w; T[i + 5] = v.h;
    T[i + 6] = a; T[i + 7] = b; T[i + 8] = c; T[i + 9] = d; T[i + 10] = e; T[i + 11] = f;
    T[i + 12] = alpha > 1 ? 1 : alpha; T[i + 13] = v.page.num;
    this.pages.add(v.page);
  },
  // efface ce qui a deja ete pose sous une bande de triangles (x0, y0, x1, y1... en pixels de la
  // toile) : ce qui est pose ensuite passe par-dessus
  effacer(points) {
    this.coupes.push({ a: this.n, points: new Float32Array(points) });
  },
  fermer() {
    if (!this.actif) return;
    this.actif = false;
    if (!this.n) return;
    const gl = this.gl, cible = this.cible, w = cible.canvas.width, h = cible.canvas.height;
    if (this.c.width !== w || this.c.height !== h) { this.c.width = w; this.c.height = h; }
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    // les pages de l'atlas peintes depuis leur dernier envoi partent a la carte (a l'endroit,
    // alpha deja premultiplie : la copie la plus directe)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    for (const page of this.pages) {
      let t = this.textures[page.num];
      if (!t) {
        t = this.textures[page.num] = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        page.envoyee = false;
      }
      if (page.sale || !page.envoyee || page.texGl !== t) {
        gl.bindTexture(gl.TEXTURE_2D, t);
        if (!page.envoyee || page.texGl !== t) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, page.c);
        else gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, page.c);
        page.sale = false; page.envoyee = true; page.texGl = t;
      }
    }
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    for (let i = 0; i < 8; i++) { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, this.textures[i] || null); }
    gl.activeTexture(gl.TEXTURE0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    if (this.donnees.byteLength > this.bufTaille) { gl.bufferData(gl.ARRAY_BUFFER, this.donnees.byteLength, gl.DYNAMIC_DRAW); this.bufTaille = this.donnees.byteLength; }
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.donnees, 0, this.n * LOT_FLOATS);
    gl.enable(gl.BLEND);
    let debut = 0;
    const lettres = fin => {
      if (fin <= debut) return;
      gl.useProgram(this.prog); gl.uniform2f(this.uRes, w, h);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.bindVertexArray(this.vao);
      // les instances commencent a `debut` : on decale les attributs plutot que de recopier
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
      for (const [k, nb, o] of LOT_ATTRIBUTS) gl.vertexAttribPointer(k, nb, gl.FLOAT, false, LOT_FLOATS * 4, (debut * LOT_FLOATS + o) * 4);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, fin - debut);
      debut = fin;
    };
    for (const cp of this.coupes) {
      lettres(cp.a);
      gl.useProgram(this.progEfface); gl.uniform2f(this.uResEfface, w, h);
      gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_ALPHA);
      gl.bindVertexArray(this.vaoEfface);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufEfface);
      gl.bufferData(gl.ARRAY_BUFFER, cp.points, gl.STREAM_DRAW);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, cp.points.length / 2);
    }
    lettres(this.n);
    gl.bindVertexArray(null);
    // et le tout se pose sur la toile, d'un coup
    cible.save();
    cible.setTransform(1, 0, 0, 1, 0, 0);
    cible.globalAlpha = 1; cible.globalCompositeOperation = "source-over"; cible.shadowBlur = 0;
    cible.drawImage(this.c, 0, 0);
    cible.restore();
    this.n = 0;
  },
};
ajouterReglages("Effets", "Carte graphique", [
  { cle: "lettresGl", nom: "Poser les lettres par la carte graphique (bien plus rapide)", type: "case" },
], { lettresGl: true });
