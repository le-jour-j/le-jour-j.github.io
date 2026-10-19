"use strict";
/* ================================================================ paysages en lettres, en perspective */

// Jiiji, 2026-10-19 : « quand c'est dessine avec les mots, c'est la que c'est beau. Donc faut des
// scenes qui creent des paysages en lettres avec des perspectives, faut des objets comme des
// voitures. » Il aime les calligrammes (des objets dessines par des lignes de mots), la nuit
// etoilee, les mots qui bougent ; il n'aime pas un objet qui porte du texte comme une surface (le
// livre). Ici chaque trait du paysage est une ligne de mots : la route, les lampadaires, les
// voitures, les vagues, les arbres. Les vers du poeme dessinent les objets proches, les mots du
// recueil le decor lointain ; la camera avance lentement, le brouillard eteint ce qui est loin.
//
// S'appuie sur scenes-3d.js (charge avant) : E3, rot3, projeter3D, lettre3D, poser3D,
// brouillard3D, Lecture3D, reel3D, fluxDe ici. Les lettres partent en lot a la carte (lettresGl).

/* ================================================================ le moteur des paysages */

const PAYS = { lumieres: [], flux: new Map(), buf: new Float64Array(3 * 600) };

// un nombre tire d'un entier, toujours le meme : un mot du decor garde sa place quand on avance
function hacher(k) {
  k = Math.imul((k | 0) ^ 0x9e3779b9, 0x85ebca6b); k ^= k >>> 13; k = Math.imul(k, 0xc2b2ae35);
  return (k ^ (k >>> 16)) >>> 0;
}
// un texte en lettres et leurs largeurs (en tailles de lettre), garde une fois mesure
function fluxDe(texte) {
  let f = PAYS.flux.get(texte);
  if (f) return f;
  if (PAYS.flux.size > 400) PAYS.flux.clear();
  const pol = police(100), c = [...texte];
  f = { c, w: Float32Array.from(c, x => Math.max(0.12, mesurer(x, pol) / 100)), n: c.length };
  PAYS.flux.set(texte, f);
  return f;
}

// La camera : position, lacet (gauche droite), tangage (haut bas, negatif : on regarde vers le
// sol), roulis. Les basses la font tanguer (« les basses font tanguer la camera »).
function cameraPays(cam, r) {
  const b = (r.b * 0.9 + r.coup * 0.4) * clamp(S.paysTangage, 0, 2), t = temps;
  E3.D = 0; E3.F = H * 0.95; E3.cx = W / 2; E3.cy = H / 2 - (S.cartel && !enCalque ? H * 0.02 : 0);
  E3.ox = cam.x; E3.oy = cam.y + b * 0.06 * Math.sin(t * 2.1); E3.oz = cam.z;
  E3.m = rot3(cam.tangage + b * 0.012 * Math.sin(t * 1.3), cam.lacet, (cam.roulis || 0) + b * 0.02 * Math.sin(t * 1.7));
  E3.pres = 0.35; E3.dos = 1; E3.ombre = 0;
  // au loin, les lettres s'assombrissent jusqu'a presque disparaitre
  E3.brume = 0.94; E3.z0 = (cam.pres || 6) * clamp(S.paysLoin, 0.3, 3); E3.z1 = (cam.loin || 120) * clamp(S.paysLoin, 0.3, 3);
}

// Une lettre (ou un mot) posee droite a l'ecran, couchee le long de son trait : le sens du trait
// a l'ecran donne son angle. Comme lettre3D, elle attend poser3D().
function lettreDroite(c, h, couleur, x, y, z, tx, ty, tz, alpha) {
  if (alpha < 0.012 || E3.n >= 3200) return false;
  const m = E3.m;
  x -= E3.ox; y -= E3.oy; z -= E3.oz;
  const px = m[0] * x + m[1] * y + m[2] * z, py = m[3] * x + m[4] * y + m[5] * z, pz = m[6] * x + m[7] * y + m[8] * z + E3.D;
  if (pz < E3.pres) return false;
  const k = E3.F / pz, sx = E3.cx + k * px, sy = E3.cy - k * py, taille = k * h;
  if (taille < 1.7) return false;
  const marge = taille * 4;
  if (sx < -marge || sx > W + marge || sy < -marge || sy > H + marge) return false;
  const Tx = m[0] * tx + m[1] * ty + m[2] * tz, Ty = m[3] * tx + m[4] * ty + m[5] * tz, Tz = m[6] * tx + m[7] * ty + m[8] * tz;
  const iz = 1 / pz, rx = Tx - px * Tz * iz, ry = -(Ty - py * Tz * iz), l = Math.hypot(rx, ry) || 1;
  const cs = rx / l, sn = ry / l;
  // tout pres, la lettre s'efface (elle passerait sur la camera) ; geante, elle ne se lit plus
  alpha *= brouillard3D(pz) * clamp((pz - E3.pres) / 1.2, 0, 1) * clamp((300 - taille) / 160, 0, 1);
  if (alpha < 0.012) return false;
  let o = E3.liste[E3.n];
  if (!o) o = E3.liste[E3.n] = {};
  E3.n++;
  o.z = pz; o.ch = c; o.col = couleur; o.taille = taille; o.h = h; o.al = alpha; o.it = false;
  o.a = cs * k; o.b = sn * k; o.c = -sn * k; o.d = cs * k; o.e = sx; o.f = sy;
  E3.lx = sx; E3.ly = sy;
  return true;
}

// le sens a l'ecran (de -1 a 1 en x) d'une direction du monde prise au point (x, y, z) ; 0 derriere
function sensEcran(x, y, z, tx, ty, tz) {
  const m = E3.m;
  x -= E3.ox; y -= E3.oy; z -= E3.oz;
  const px = m[0] * x + m[1] * y + m[2] * z, py = m[3] * x + m[4] * y + m[5] * z, pz = m[6] * x + m[7] * y + m[8] * z + E3.D;
  if (pz < 0.05) return 0;
  const Tx = m[0] * tx + m[1] * ty + m[2] * tz, Ty = m[3] * tx + m[4] * ty + m[5] * tz, Tz = m[6] * tx + m[7] * ty + m[8] * tz;
  const rx = Tx - px * Tz / pz, ry = -(Ty - py * Tz / pz);
  return rx / (Math.hypot(rx, ry) || 1);
}
// une lumiere : un point qui brille (phare, lampadaire, fenetre) ; posee apres les lettres
function lumierePays(x, y, z, rayon, couleur, alpha) {
  if (alpha < 0.02 || PAYS.lumieres.length > 160 || !projeter3D(x, y, z)) return;
  const r = rayon * Q3.k * clamp(S.paysLumieres, 0, 3);
  if (r < 0.4 || Q3.x < -50 || Q3.x > W + 50 || Q3.y < -50 || Q3.y > H + 50) return;
  PAYS.lumieres.push(Q3.x, Q3.y, Math.min(r, 60), alpha * brouillard3D(Q3.z) * (0.5 + 0.5 * Math.min(1, S.paysLumieres)), couleur);
}
function poserLumieres() {
  const L = PAYS.lumieres;
  for (let i = 0; i < L.length; i += 5) poserEtoile(L[i], L[i + 1], L[i + 2], L[i + 4], Math.min(1, L[i + 3]), L[i + 2] > 6);
  L.length = 0;
}

// des mots poses le long d'une ligne du monde (bords de route, fils, vagues, cretes) : un mot tous
// les `pas` ; le mot depend de sa place (k), pas de l'instant : il ne change pas quand on avance.
// f(s) rend [x, y, z] ; sol : le mot est couche sur le sol (leve de `sol` vers nous), sinon droit
function ligneMots(f, s0, s1, pas, graine, mots, h, couleur, alpha, sol, phase) {
  const k0 = Math.ceil((s0 + (phase || 0)) / pas), k1 = Math.floor((s1 + (phase || 0)) / pas);
  if (k1 - k0 > 400) return;
  // la ligne se lit de gauche a droite : si elle part vers la gauche a l'ecran, les mots se retournent
  let sens = 1;
  const sm = (s0 + s1) / 2, ma = f(sm);
  if (projeter3D(ma[0], ma[1], ma[2])) { const x0 = Q3.x, mb = f(sm + pas); if (projeter3D(mb[0], mb[1], mb[2]) && Q3.x < x0 - 0.5) sens = -1; }
  for (let k = k0; k <= k1; k++) {
    const s = k * pas - (phase || 0), a = f(s), b = f(s + 0.3);
    const mot = mots[hacher(k * 7919 + graine) % mots.length];
    let tx = (b[0] - a[0]) * sens, ty = (b[1] - a[1]) * sens, tz = (b[2] - a[2]) * sens;
    if (sol !== undefined && sol !== false) {
      const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
      lettre3D(mot, h, couleur, a[0], a[1], a[2], tx, 0, tz, -tz * (1 - sol), sol, tx * (1 - sol), alpha);
    } else lettreDroite(mot, h, couleur, a[0], a[1], a[2], tx, ty, tz, alpha);
  }
}

// le ciel : des etoiles (seulement la direction : elles ne s'approchent jamais)
const cielPays = { pts: null };
function etoilesPays(alpha) {
  if (!cielPays.pts) {
    const n = 260, p = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const a = hasard(0, Math.PI * 2), h = Math.asin(Math.pow(Math.random(), 1.6) * 0.95);
      p.set([Math.cos(h) * Math.sin(a), Math.sin(h) + 0.02, Math.cos(h) * Math.cos(a), Math.pow(Math.random(), 2.5)], i * 4);
    }
    cielPays.pts = p;
  }
  const P = palette(), p = cielPays.pts, m = E3.m;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = P.clair ? P.note : "#ffffff";
  for (let i = 0; i < p.length; i += 4) {
    const x = p[i], y = p[i + 1], z = p[i + 2];
    const pz = m[6] * x + m[7] * y + m[8] * z;
    if (pz <= 0.05) continue;
    const sx = E3.cx + E3.F * (m[0] * x + m[1] * y + m[2] * z) / pz, sy = E3.cy - E3.F * (m[3] * x + m[4] * y + m[5] * z) / pz;
    if (sx < 0 || sx > W || sy < 0 || sy > H) continue;
    const g = p[i + 3], s = 0.7 + 1.8 * g;
    ctx.globalAlpha = alpha * (0.15 + 0.6 * g) * (0.65 + 0.35 * Math.sin(temps * 1.4 + i));
    ctx.fillRect(sx - s / 2, sy - s / 2, s, s);
  }
  ctx.globalAlpha = 1;
}
// la lune : un cercle ecrit avec le titre du poeme, tres loin, dans la direction (az, haut)
function lunePays(texte, az, haut, rayon) {
  const P = palette(), d = 600, cx = E3.ox + Math.sin(az) * Math.cos(haut) * d, cy = E3.oy + Math.sin(haut) * d, cz = E3.oz + Math.cos(az) * Math.cos(haut) * d;
  const ex = Math.cos(az), ez = -Math.sin(az);
  const f = fluxDe(casse(texte || "poïasie") + "  ·  ");
  const tour = Math.PI * 2 * rayon, hl = rayon * 0.32;
  const brume = E3.brume; E3.brume = 0;
  let s = 0, i = 0;
  while (s < tour - hl * 0.5 && i < 90) {
    const w = f.w[i % f.n] * hl, a = Math.PI - (s + w / 2) / rayon;  // de la gauche, par le haut
    const ch = f.c[i % f.n];
    if (ch !== " ") lettreDroite(ch, hl, P.accent, cx + ex * Math.cos(a) * rayon, cy + Math.sin(a) * rayon, cz + ez * Math.cos(a) * rayon,
      ex * Math.sin(a), -Math.cos(a), ez * Math.sin(a), 0.8);
    s += w; i++;
  }
  E3.brume = brume;
  if (projeter3D(cx, cy, cz)) PAYS.lumieres.push(Q3.x, Q3.y, Math.min(70, rayon * Q3.k * 0.55), 0.55, P.clair ? P.accent : "#ffffff");
}

/* ================================================================ les objets en mots */

// Une petite bibliotheque de formes en 3D, pour toutes les scenes. Chaque forme est une fonction
// (objet, temps) -> { traits, lum } dans le repere de l'objet (en metres : x a droite, y en haut,
// z vers l'avant de l'objet ; le sol en y = 0) :
//   traits : [{ p: [x, y, z, x, y, z...], mots: pas (facultatif) }] : on y pose des lettres, ou un
//            mot tous les `pas` metres (pour les traits longs et le decor) ;
//   lum    : [[x, y, z, rayon, "blanc" | "rouge" | "accent" | "vert" | "orange"]] : des lumieres.
// FORMES.x.anime : la forme change avec le temps (grande roue, eolienne) ; sinon elle est gardee.
const tr = (...p) => ({ p });
function cercleP(cx, cy, cz, r, plan, n, a0, a1) {
  const p = [];
  a0 = a0 === undefined ? Math.PI : a0; a1 = a1 === undefined ? a0 - Math.PI * 2 : a1;
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * i / n, c = Math.cos(a) * r, s = Math.sin(a) * r;
    if (plan === "xy") p.push(cx + c, cy + s, cz); else if (plan === "zy") p.push(cx, cy + s, cz + c); else p.push(cx + c, cy, cz + s);
  }
  return p;
}
// une boite : ses douze aretes, chacune un trait (un trait se lit de gauche a droite)
function boiteP(x0, y0, z0, x1, y1, z1, pas) {
  const t = [];
  for (const y of [y0, y1]) t.push(tr(x0, y, z0, x1, y, z0), tr(x1, y, z0, x1, y, z1), tr(x0, y, z1, x1, y, z1), tr(x0, y, z0, x0, y, z1));
  t.push(tr(x0, y0, z0, x0, y1, z0), tr(x1, y0, z0, x1, y1, z0), tr(x1, y0, z1, x1, y1, z1), tr(x0, y0, z1, x0, y1, z1));
  if (pas) for (const x of t) x.mots = pas;
  return t;
}
// une chainette (un fil entre deux points, qui pend)
function chainette(a, b, fleche, n) {
  const p = [];
  for (let i = 0; i <= n; i++) { const u = i / n; p.push(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - fleche * 4 * u * (1 - u), a[2] + (b[2] - a[2]) * u); }
  return p;
}
const FORMES = {
  // les vehicules ne montrent que le flanc tourne vers nous (o.cote : 1 ou -1, calcule a chaque
  // image) : deux flancs l'un sur l'autre brouillaient le dessin
  voiture(o) {
    const k = (o && o.cote) || 1, f = (o && o.face) || 1, x = .86 * k;
    // la face tournee vers nous d'abord (vue de face ou de dos, une voiture se reconnait a elle)
    // la face en deux traits ouverts (l'arche, puis le bas) : chacun se lit de gauche a droite
    const face = z => [tr(-.92, .32, z, -.92, .86, z, -.74, .98, z, -.58, 1.4, z, .58, 1.4, z, .74, .98, z, .92, .86, z, .92, .32, z), tr(-.92, .32, z, .92, .32, z)];
    const prof = [[-2.1, .38], [-2.15, .86], [-1.7, .98], [-1.05, 1.4], [.55, 1.42], [1.25, .98], [2.15, .82], [2.2, .4]];
    const t = [...face(2.2 * f), tr(...prof.flatMap(([z, y]) => [x, y, z])), tr(-.58, 1.41, -1.05, -.58, 1.41, .55), tr(.58, 1.41, -1.05, .58, 1.41, .55), ...face(-2.15 * f)];
    for (const z of [-1.35, 1.35]) t.push(tr(...cercleP(x, .34, z, .33, "zy", 9)));
    return { traits: t, lum: [[-.62, .62, 2.22, .14, "blanc"], [.62, .62, 2.22, .14, "blanc"], [-.68, .84, -2.18, .1, "rouge"], [.68, .84, -2.18, .1, "rouge"]] };
  },
  camion(o) {
    const k = (o && o.cote) || 1, x = 1.2 * k;
    const t = [tr(x, 3.3, -4.5, x, 3.3, 1.2), tr(x, .7, -4.5, x, .7, 1.2), tr(x, .7, -4.5, x, 3.3, -4.5), tr(x, .7, 1.2, x, 3.3, 1.2),
      tr(-1.2, 3.3, -4.5, 1.2, 3.3, -4.5), tr(-1.2, 3.3, 1.2, 1.2, 3.3, 1.2), tr(-1.2, .7, -4.5, -1.2, 3.3, -4.5, 1.2, 3.3, -4.5, 1.2, .7, -4.5)];
    const cab = [[1.2, .7], [1.2, 2.6], [1.9, 2.6], [2.5, 1.6], [2.6, .7]];
    t.push(tr(...cab.flatMap(([z, y]) => [x * .96, y, z])), tr(-1.15, 2.6, 1.9, 1.15, 2.6, 1.9));
    for (const z of [-3.6, -2.6, 1.9]) t.push(tr(...cercleP(x, .45, z, .44, "zy", 9)));
    return { traits: t, lum: [[-.8, .95, 2.62, .17, "blanc"], [.8, .95, 2.62, .17, "blanc"], [-1, .9, -4.55, .12, "rouge"], [1, .9, -4.55, .12, "rouge"]] };
  },
  velo() {
    const t = [tr(...cercleP(0, .35, -.55, .34, "zy", 12)), tr(...cercleP(0, .35, .55, .34, "zy", 12)),
      tr(0, .35, -.55, 0, .35, 0, 0, .9, .32, 0, .92, -.22, 0, .35, 0), tr(0, .9, .32, 0, 1.1, .45, 0, 1.12, .3),
      // le cycliste : le dos, la tete, le bras, la jambe
      tr(0, .95, -.25, 0, 1.55, 0, 0, 1.1, .4), tr(...cercleP(0, 1.78, .06, .16, "zy", 8)), tr(0, .95, -.25, 0, .6, 0, 0, .25, .05)];
    return { traits: t, lum: [[0, .95, .5, .07, "blanc"], [0, .85, -.6, .06, "rouge"]] };
  },
  avion() {
    const t = [tr(0, 0, -7, 0, .4, -5, 0, .5, 4, 0, 0, 7), tr(-8, .3, .2, 0, .4, 1.8, 8, .3, .2), tr(-8, .3, .2, 0, .4, -.8, 8, .3, .2),
      tr(0, .5, -5.5, 0, 2.6, -6.6, 0, .4, -4.2), tr(-2.6, .4, -6.4, 0, .4, -5.6, 2.6, .4, -6.4)];
    return { traits: t, lum: [[-8, .3, .2, .3, "rouge"], [8, .3, .2, .3, "vert"], [0, .6, 0, .25, "blanc"]], clignote: true };
  },
  voilier() {
    // la voile d'abord : c'est elle qui porte le vers
    const t = [tr(0, 7.4, .3, 0, 1.2, -2.6, 0, 1.2, .2), tr(0, 7.4, .3, 0, 1.1, 2.7), tr(0, 1.2, .3, 0, 7.4, .3),
      tr(-.9, .6, -3, -1.1, .6, 0, -.6, .6, 2.6, 0, .6, 3.4, .6, .6, 2.6, 1.1, .6, 0, .9, .6, -3, -.9, .6, -3),
      tr(-.9, .6, -3, -.4, -.3, -2, 0, -.4, 0, .4, -.3, -2, .9, .6, -3), tr(0, -.4, 0, 0, .6, 3.4)];
    return { traits: t, lum: [[0, 7.6, .3, .18, "blanc"], [0, .9, 3.3, .1, "vert"]] };
  },
  wagon(o) {
    const L = (o && o.long) || 18, k = (o && o.cote) || 1, f = (o && o.face) || 1, x = 1.42 * k;
    // le flanc d'abord (il porte le vers, sous les fenetres), la face vers nous, le toit, les fenetres
    const bout = z => [tr(-1.4, .9, z, -1.4, 4, z, 0, 4.4, z, 1.4, 4, z, 1.4, .9, z), tr(-1.4, .9, z, 1.4, .9, z)];
    const t = [tr(x, 1.6, -L / 2 + .6, x, 1.6, L / 2 - .6), ...bout(L / 2 * f), tr(x, 4, -L / 2, x, 4, L / 2), tr(x, .9, -L / 2, x, .9, L / 2), tr(0, 4.4, -L / 2, 0, 4.4, L / 2)];
    const lum = [];
    for (let z = -L / 2 + 2; z < L / 2 - 1; z += 3.2) {
      t.push(tr(x, 2.2, z, x, 3.1, z, x, 3.1, z + 1.3, x, 2.2, z + 1.3, x, 2.2, z));
      lum.push([x * 1.02, 2.65, z + .65, .28, "orange"]);
    }
    for (const z of [-L / 2 + 2.5, L / 2 - 2.5]) t.push(tr(...cercleP(x, .5, z, .45, "zy", 8)));
    return { traits: t, lum };
  },
  locomotive(o) {
    const k = (o && o.cote) || 1, x = 1.42 * k;
    // la face avant d'abord : c'est elle qu'on voit arriver
    const t = [tr(-1.3, .9, 7.4, -1.3, 3.5, 7.4, -.9, 4.1, 7.2, .9, 4.1, 7.2, 1.3, 3.5, 7.4, 1.3, .9, 7.4), tr(-1.3, .9, 7.4, 1.3, .9, 7.4),
      tr(-1, 2.6, 7.42, -.15, 2.6, 7.42, -.15, 3.4, 7.42), tr(.15, 2.6, 7.42, 1, 2.6, 7.42, 1, 3.4, 7.42),
      tr(x, 1.6, -6.4, x, 1.6, 6.8), tr(x, 4.1, -7, x, 4.1, 7.2), tr(x, .9, -7, x, .9, 7.4), tr(-1.4, .9, -7, -1.4, 4.1, -7, 1.4, 4.1, -7, 1.4, .9, -7)];
    for (const z of [-5, -2, 3]) t.push(tr(...cercleP(x, .5, z, .45, "zy", 8)));
    return { traits: t, lum: [[-.8, 1.4, 7.45, .3, "blanc"], [.8, 1.4, 7.45, .3, "blanc"], [0, 3.8, 7.3, .25, "blanc"]] };
  },
  maison() {
    const t = boiteP(-3, 0, -4, 3, 4.5, 4);
    t.push(tr(-3, 4.5, -4, 0, 7.2, -4, 3, 4.5, -4), tr(-3, 4.5, 4, 0, 7.2, 4, 3, 4.5, 4), tr(0, 7.2, -4, 0, 7.2, 4),
      tr(-.6, 0, -4.02, -.6, 2.2, -4.02, .6, 2.2, -4.02, .6, 0, -4.02));
    return { traits: t, lum: [[-1.9, 2.6, -4.05, .3, "orange"], [1.9, 2.6, -4.05, .3, "orange"]] };
  },
  stand() {
    const t = boiteP(-2.2, 0, -1.5, 2.2, 2.6, 1.5);
    const auvent = [];
    for (let i = 0; i <= 8; i++) auvent.push(-2.4 + 4.8 * i / 8, 2.9 + (i % 2 ? -.35 : 0), -1.9);
    t.unshift({ p: auvent });
    const lum = [];
    for (let i = 0; i < 5; i++) lum.push([-2 + i, 2.95, -1.95, .16, i % 2 ? "accent" : "orange"]);
    return { traits: t, lum };
  },
  immeuble(o) {
    const { w, h, d, cote } = o.p, x1 = cote * d, z0 = -w / 2, z1 = w / 2, pas = 3.2;
    const t = [tr(0, 0, z0, 0, h, z0), tr(0, 0, z1, 0, h, z1), tr(0, h, z0, 0, h, z1), tr(0, h, z0, x1, h, z0), tr(0, h, z1, x1, h, z1)];
    for (let y = 7; y < h - 2; y += 7) t.push(tr(0, y, z0, 0, y, z1));
    for (const x of t) x.mots = pas;
    // des fenetres allumees, toujours les memes pour un immeuble
    const lum = [];
    let n = 0;
    for (let y = 2; y < h - 1 && n < 9; y += 3.5) for (let z = z0 + 1.5; z < z1 - 1 && n < 9; z += 3) {
      if (hacher(o.id * 131 + Math.round(y * 7 + z * 13)) % 100 < 22) { lum.push([cote * -.05, y, z, .35, hacher(o.id + n) % 3 ? "orange" : "accent"]); n++; }
    }
    return { traits: t, lum };
  },
  arbre(o) {
    // un arbre-calligramme : le tronc, des branches, et le feuillage en anneaux croises
    const g = (o && o.id) || 1, r = k => (hacher(g * 97 + k) % 1000) / 1000;
    const t = [tr(0, 0, 0, .05, 2.4, 0, -.05, 3.6, 0)];
    for (let k = 0; k < 4; k++) {
      const a = r(k) * Math.PI * 2, y = 2 + r(k + 9) * 1.6, l = 1 + r(k + 20);
      t.push(tr(0, y, 0, Math.cos(a) * l * .6, y + l * .5, Math.sin(a) * l * .6, Math.cos(a) * l, y + l * .9, Math.sin(a) * l));
    }
    const R = 1.6 + r(40) * .6, yc = 4.3 + r(41);
    t.push(tr(...cercleP(0, yc, 0, R, "xy", 14)), tr(...cercleP(0, yc + .3, 0, R * .9, "zy", 14)));
    return { traits: t, lum: [] };
  },
  sapin(o) {
    const g = (o && o.id) || 1, t = [tr(0, 0, 0, 0, 1.2, 0)];
    const n = 4 + (hacher(g) % 2), H0 = 6 + (hacher(g + 1) % 3);
    for (const plan of [0, Math.PI / 2]) {
      const c = Math.cos(plan), s = Math.sin(plan), p = [];
      for (let k = 0; k <= n; k++) { const y = 1.2 + (H0 - 1.2) * k / n, l = 2.3 * (1 - k / n); p.push(-c * l, y - (k < n ? .4 : 0), -s * l, 0, y + (H0 - 1.2) / n * .55, 0); }
      for (let k = n; k >= 0; k--) { const y = 1.2 + (H0 - 1.2) * k / n, l = 2.3 * (1 - k / n); p.push(c * l, y - (k < n ? .4 : 0), s * l); }
      t.push({ p });
    }
    return { traits: t, lum: [] };
  },
  lampadaire() {
    return { traits: [tr(0, 0, 0, 0, 6, 0, .3, 6.5, 0, 1.2, 6.6, 0, 1.6, 6.3, 0)], lum: [[1.6, 6.15, 0, .55, "orange"]] };
  },
  poteau() {
    return { traits: [tr(0, 0, 0, 0, 8, 0), tr(-1.2, 7.4, 0, 1.2, 7.4, 0)], lum: [] };
  },
  banniere(o) {
    // un fil tendu en travers de la rue, ou pend le vers, et des ampoules
    const l = (o && o.p && o.p.l) || 7, p = chainette([-l, 7.4, 0], [l, 7.4, 0], .9, 24), lum = [];
    for (let i = 1; i < 12; i++) { const u = i / 12; lum.push([-l + 2 * l * u, 7.25 - .9 * 4 * u * (1 - u), 0, .18, i % 3 ? "orange" : "accent"]); }
    return { traits: [{ p }, tr(-l, 0, 0, -l, 7.6, 0), tr(l, 0, 0, l, 7.6, 0)], lum };
  },
  panneau() {
    // un panneau suspendu (le quai) : le vers s'ecrit sur sa ligne du milieu
    return { traits: [tr(0, 3.2, 2.1, 0, 3.2, -2.1), tr(0, 2.7, 2.3, 0, 3.7, 2.3, 0, 3.7, -2.3, 0, 2.7, -2.3, 0, 2.7, 2.3), tr(0, 3.7, 1.6, 0, 4.6, 1.6), tr(0, 3.7, -1.6, 0, 4.6, -1.6)],
      lum: [[0, 3.75, 0, .2, "accent"]] };
  },
  horloge() {
    // l'horloge de la gare, a l'heure vraie : les chiffres sont des lettres posees en rond
    const d = new Date(), t = [tr(0, 0, 0, 0, 4.2, 0), tr(...cercleP(0, 5.2, 0, 1, "zy", 16))];
    const hm = (d.getHours() % 12 + d.getMinutes() / 60) / 12 * Math.PI * 2, mn = d.getMinutes() / 60 * Math.PI * 2;
    t.push(tr(0, 5.2, 0, 0, 5.2 + Math.cos(hm) * .5, -Math.sin(hm) * .5), tr(0, 5.2, 0, 0, 5.2 + Math.cos(mn) * .8, -Math.sin(mn) * .8));
    return { traits: t, lum: [[0, 5.2, 0, .12, "blanc"]] };
  },
  grandeRoue(o, temps) {
    const R = 9, cy = 11, a0 = (temps || 0) * .05, t = [], lum = [];
    // la jante d'abord : elle porte le vers, qui tourne avec elle
    t.push(tr(...cercleP(0, cy, 0, R, "xy", 28, Math.PI - a0, -Math.PI - a0)), tr(...cercleP(0, cy, 0, R * .55, "xy", 16)));
    for (let k = 0; k < 8; k++) {
      const a = a0 + k * Math.PI / 4, x = Math.cos(a) * R, y = cy + Math.sin(a) * R;
      t.push({ p: [0, cy, 0, x, y, 0], mots: 1.6 });
      t.push(tr(x - .6, y - .4, 0, x - .6, y - 1.4, 0, x + .6, y - 1.4, 0, x + .6, y - .4, 0));
      lum.push([x, y, 0, .3, k % 2 ? "accent" : "orange"]);
    }
    t.push({ p: [-5, 0, 1.5, 0, cy, 0, 5, 0, 1.5], mots: 1.8 }, { p: [-5, 0, -1.5, 0, cy, 0, 5, 0, -1.5], mots: 1.8 });
    return { traits: t, lum };
  },
  eolienne(o, temps) {
    const a0 = (temps || 0) * .35 + ((o && o.id) || 0), t = [{ p: [0, 0, 0, 0, 28, 0], mots: 2.2 }, tr(-.8, 28, -.6, .8, 28, -.6, .8, 29.2, -.6, -.8, 29.2, -.6, -.8, 28, -.6)];
    for (let k = 0; k < 3; k++) { const a = a0 + k * Math.PI * 2 / 3; t.push({ p: [0, 28.6, -1, Math.cos(a) * 13, 28.6 + Math.sin(a) * 13, -1], mots: 1.8 }); }
    return { traits: t, lum: [[0, 29.4, -.6, .4, "rouge"]], clignote: true };
  },
  phare(o, temps) {
    const t = [{ p: [-2, 0, 0, -1.2, 18, 0], mots: 1.8 }, { p: [2, 0, 0, 1.2, 18, 0], mots: 1.8 }, tr(...cercleP(0, 6, 0, 1.75, "xz", 10)), tr(...cercleP(0, 12, 0, 1.45, "xz", 10)),
      tr(-1.4, 18, 0, -1.4, 20.5, 0, 0, 22, 0, 1.4, 20.5, 0, 1.4, 18, 0)];
    // le faisceau qui tourne : une ligne de lumiere
    const a = (temps || 0) * .4;
    t.push({ p: [0, 19.3, 0, Math.cos(a) * 60, 18, Math.sin(a) * 60], mots: 3.5, lumineux: true });
    return { traits: t, lum: [[0, 19.3, 0, 1.1, "blanc"]] };
  },
  manege(o, temps) {
    const a0 = (temps || 0) * .12, t = [tr(...cercleP(0, 5.4, 0, 5, "xz", 24, a0, a0 + Math.PI * 2))], lum = [];
    t.push(tr(...cercleP(0, .6, 0, 5, "xz", 20)));
    for (let k = 0; k < 8; k++) {
      const a = a0 + k * Math.PI / 4, x = Math.cos(a) * 4.3, z = Math.sin(a) * 4.3, y = 1.4 + .35 * Math.sin((temps || 0) * .8 + k);
      t.push({ p: [x, .6, z, x, 5.4, z], mots: 1.4 }, { p: [x - Math.sin(a) * .7, y, z + Math.cos(a) * .7, x, y + .5, z, x + Math.sin(a) * .7, y, z - Math.cos(a) * .7] });
      t.push({ p: [Math.cos(a) * 5, 5.4, Math.sin(a) * 5, 0, 7.6, 0], mots: 1.6 });
      lum.push([Math.cos(a) * 5, 5.4, Math.sin(a) * 5, .25, k % 2 ? "accent" : "orange"]);
    }
    return { traits: t, lum };
  },
  fleuve(o) {
    // un vers couche sur la riviere : son trait suit le milieu du courant
    return { traits: [{ p: o.p.pts, sol: .25 }], lum: [] };
  },
};
FORMES.voiture.cote = FORMES.camion.cote = FORMES.wagon.cote = FORMES.locomotive.cote = true;
FORMES.grandeRoue.anime = FORMES.eolienne.anime = FORMES.phare.anime = FORMES.manege.anime = FORMES.horloge.anime = true;
// la hauteur du centre de chaque forme (pour savoir si elle est a l'image)
const FORMES_HAUT = { voiture: .8, camion: 1.8, velo: 1, avion: 0, voilier: 3, wagon: 2.4, locomotive: 2.4, maison: 3.5, stand: 1.5, immeuble: 10,
  arbre: 3.5, sapin: 3.5, lampadaire: 4, poteau: 4, banniere: 6.5, panneau: 3.2, horloge: 4, grandeRoue: 11, eolienne: 20, phare: 11, manege: 3.5, fleuve: 0 };

function couleurLum(nom, P) {
  if (nom === "rouge") return "#ff4a3d";
  if (nom === "vert") return "#4dff8a";
  if (nom === "orange") return P.clair ? P.accent : "#ffc46b";
  if (nom === "accent") return P.accent;
  return P.clair ? P.texte : "#fff6e0";
}

// Pose un objet : ses traits en lettres (le vers qu'il porte, sinon les mots du recueil), puis ses
// lumieres. Un trait se lit toujours de gauche a droite : s'il part vers la gauche a l'ecran, on
// le parcourt a l'envers. Au-dela de `max` lettres, le reste se dessine en mots (moins de lettres).
function tracerObjet(o, P, r, decor, temps) {
  const F = FORMES[o.forme];
  const c = Math.cos(o.ang || 0), s = Math.sin(o.ang || 0), e = o.ech || 1;
  let forme;
  if (F.anime) forme = F(o, temps);
  else if (F.cote) {
    // le flanc tourne vers la camera : le signe de la camera dans le repere de l'objet
    o.cote = c * (E3.ox - o.x) - s * (E3.oz - o.z) >= 0 ? 1 : -1;
    o.face = s * (E3.ox - o.x) + c * (E3.oz - o.z) >= 0 ? 1 : -1;
    const cle = "f" + o.cote + o.face;
    forme = o[cle] || (o[cle] = F(o));
  } else forme = o.f || (o.f = F(o));
  if (!projeter3D(o.x, o.y + (FORMES_HAUT[o.forme] || 1) * e, o.z) && o.forme !== "fleuve") return;
  const vie = clamp((o.age || 0) / 0.8, 0, 1) * (o.alpha === undefined ? 1 : o.alpha);
  if (vie <= 0.01) return;
  const h = (o.h || 0.3) * e;
  // le decor passe vite aux mots entiers (moins de lettres) ; un porteur ecrit son vers en lettres
  // un porteur ecrit son vers une fois et demie au plus, puis le reste en mots
  let flux, nV = 0, ecrit = 1, coul, alphaV = 0.5 * vie, lec = null;
  let max = o.max !== undefined ? o.max : 50;
  if (o.vers && o.forme !== "fleuve") max = Math.min(o.max !== undefined ? Math.max(o.max, 1) : 170, Math.round(o.vers.n * 1.5 + 12));
  if (o.vers) {
    flux = fluxDe(o.vers.texte + "   ·   ");
    nV = o.vers.n;
    lec = o.vers.ancien ? null : o.vers.lec;
    ecrit = lec ? lec.ecrit(o.vers.ordre) : 1;
    coul = couleurDe({ poete: o.vers.poete, ordre: o.vers.ordre }, 10);
    alphaV = (o.vers.ancien ? 0.55 : 1) * vie;
  } else { flux = fluxDe(o.decor || "poïasie  "); coul = P.note; }
  const B = PAYS.buf, ecritN = ecrit * nV;
  let i = 0;
  forme.traits.forEach((t, it) => {
    const p = t.p, np = Math.min(200, p.length / 3);
    for (let k = 0; k < np; k++) {
      const lx = p[k * 3], ly = p[k * 3 + 1], lz = p[k * 3 + 2];
      B[k * 3] = o.x + e * (c * lx + s * lz); B[k * 3 + 1] = o.y + e * ly; B[k * 3 + 2] = o.z + e * (-s * lx + c * lz);
    }
    // le sens de lecture : la direction du trait (du debut a la fin), projetee en son milieu
    let rev = false;
    if (np > 1) {
      const q = Math.floor(np / 2) * 3, sx = sensEcran(B[q], B[q + 1], B[q + 2], B[np * 3 - 3] - B[0], B[np * 3 - 2] - B[1], B[np * 3 - 1] - B[2]);
      rev = sx < -0.05;
    }
    const enMots = t.mots || i >= max;
    const pas = t.mots || (o.pas || 1.4);
    let acc = 0, d = enMots ? pas * 0.5 : flux.w[i % flux.n] * h * 0.5, km = 0;
    for (let q = 0; q < np - 1; q++) {
      const a = rev ? np - 1 - q : q, b = rev ? a - 1 : a + 1;
      const ax = B[a * 3], ay = B[a * 3 + 1], az = B[a * 3 + 2], dx = B[b * 3] - ax, dy = B[b * 3 + 1] - ay, dz = B[b * 3 + 2] - az;
      const L = Math.hypot(dx, dy, dz);
      if (L < 1e-6) continue;
      // en mots, chaque segment decide de son sens (un mot n'a pas besoin du suivant pour se lire)
      let sm = 1;
      if (enMots && projeter3D(ax, ay, az)) { const x0 = Q3.x; if (projeter3D(ax + dx, ay + dy, az + dz) && Q3.x < x0 - 0.5) sm = -1; }
      while (d <= acc + L) {
        const u = (d - acc) / L, x = ax + dx * u, y = ay + dy * u, z = az + dz * u;
        if (enMots) {
          // le decor en mots entiers : un mot tous les `pas` metres
          const mot = decor[hacher(o.id * 1009 + it * 131 + km) % decor.length];
          if (t.lumineux) lettreDroite(mot, h * 1.3, P.accent, x, y, z, dx * sm, dy * sm, dz * sm, 0.75 * vie);
          else if (t.sol) lettre3D(mot, h, o.vers ? coul : P.note, x, y, z, dx * sm, 0, dz * sm, -dz * sm * (1 - t.sol), L * t.sol, dx * sm * (1 - t.sol), alphaV * 0.7);
          else lettreDroite(mot, h * 1.1, o.vers && !o.vers.ancien ? coul : P.note, x, y, z, dx * sm, dy * sm, dz * sm, (o.vers ? alphaV * 0.6 : 0.45 * vie));
          d += pas; km++;
        } else {
          const ch = flux.c[i % flux.n];
          if (ch !== " ") {
            let al, col = coul;
            if (o.vers) {
              if (i < nV) { al = i < ecritN ? alphaV : 0; if (lec && ecrit < 1 && i > ecritN - 3 && al > 0) col = P.accent; }
              else al = ecrit >= 1 ? alphaV * 0.45 : 0;
            } else al = 0.5 * vie;
            if (al > 0) {
              const ok = t.sol ? (lettre3D(ch, h, col, x, y, z, dx, 0, dz, -dz * (1 - t.sol), L * t.sol, dx * (1 - t.sol), al), true)
                : lettreDroite(ch, h, col, x, y, z, dx, dy, dz, al);
              if (ok && col === P.accent && lec) lec.ici();
            }
          }
          d += (flux.w[i % flux.n] + flux.w[(i + 1) % flux.n]) * 0.5 * h;
          i++;
        }
      }
      acc += L;
    }
  });
  // les lumieres : les coups font clignoter les phares
  const flash = 1 + r.coup * 1.6 * clamp(S.paysLumieres, 0, 2);
  for (const l of forme.lum) {
    let a = 0.85 * vie;
    if (forme.clignote) a *= 0.5 + 0.5 * Math.sin(temps * 3 + o.id);
    const x = o.x + e * (c * l[0] + s * l[2]), y = o.y + e * l[1], z = o.z + e * (-s * l[0] + c * l[2]);
    lumierePays(x, y, z, l[3] * e * (l[4] === "blanc" || l[4] === "rouge" ? flash : 1), couleurLum(l[4], P), a);
  }
}

/* ================================================================ la scene de paysage, en commun */

// Le monde de chaque paysage continue d'un poeme a l'autre (la camera ne revient jamais en
// arriere). Chaque vers est donne a un objet proche, a l'image (un porteur : une voiture, une
// voile, une banderole...) : il s'y ecrit en dessinant l'objet. S'il n'y en a pas, la scene en fait
// venir un. Les objets qui portaient le poeme d'avant gardent leur vers, plus pales.
let idPays = 1;
class ScenePaysage {
  constructor(poeme, monde) {
    this.poeme = poeme;
    this.m = monde;
    this.lec = new Lecture3D(poeme);
    // un vocabulaire de decor borne (les mots du recueil) : autant de vignettes en moins
    if (!monde.decor || monde.decor.length < 5 || Math.random() < 0.3) {
      const src = D.corpus && D.corpus.length ? D.corpus : this.lec.vers.flatMap(v => motsPleins(v.texte));
      monde.decor = Array.from({ length: 48 }, () => casse(tirer(src.length ? src : ["poïasie"])));
    }
    if (!monde.cam) { monde.objets = []; monde.t = 0; this.initialiser(); }
    for (const o of monde.objets) if (o.vers) o.vers.ancien = true;
    this.donnes = -1;
    montrerCartel(poeme);
  }
  nouveau(forme, x, y, z, opt) {
    const o = Object.assign({ id: idPays++, forme, x, y, z, ang: 0, ech: 1, vx: 0, vz: 0, age: 0, h: 0.3 }, opt || {});
    if (!o.decor) o.decor = Array.from({ length: 8 }, () => tirer(this.m.decor)).join("  ") + "  ";
    this.m.objets.push(o);
    return o;
  }
  maj(dt) {
    const L = this.lec, dtr = L.avancer(dt), m = this.m;
    m.t += dt;
    for (const o of m.objets) { o.x += o.vx * dt; o.z += o.vz * dt; o.age += dtr; }
    this.avancer(dt, dtr);
    m.objets = m.objets.filter(o => this.garder(o));
    // les vers, chacun sur son porteur
    cameraPays(m.cam, rythme());
    while (L.tr > 0 && this.donnes < L.courant) this.donner(++this.donnes);
    if (L.finit) montrerCartel(null);
    return L.fini;
  }
  // un objet reste tant qu'il est devant la camera (les scenes peuvent changer la regle)
  garder(o) { const d = o.z - this.m.cam.z; return d > -12 && d < (this.m.cam.loin || 120) * 2.2; }
  donner(i) {
    const v = this.lec.vers[i], m = this.m, [dmin, dmax, ideal] = this.distances || [8, 45, 18];
    let mieux = null, score = 1e9;
    for (const o of m.objets) {
      // un objet qui porte deja un vers de ce poeme peut en recevoir un autre s'il est plus vieux de deux
      const recent = o.vers && !o.vers.ancien && o.vers.lec === this.lec;
      if (!o.porteur || (recent && o.vers.ordre > i - 2)) continue;
      if (!projeter3D(o.x, o.y + (FORMES_HAUT[o.forme] || 1) * (o.ech || 1), o.z)) continue;
      if (Q3.x < W * 0.05 || Q3.x > W * 0.95 || Q3.y < H * 0.03 || Q3.y > H * 0.97) continue;
      // de preference a bonne distance pour etre lu, et pas deja ecrit
      const hors = Q3.z < dmin ? (dmin - Q3.z) * 4 : Q3.z > dmax ? (Q3.z - dmax) * 2 : 0;
      const sc = Math.abs(Q3.z - ideal) + hors + (o.vers ? (recent ? 18 : 10) : 0);
      if (sc < score) { score = sc; mieux = o; }
    }
    // trop loin ou trop pres : la scene en fait venir un, si elle sait le faire
    if (!mieux || score > 60) mieux = this.porteur(i) || mieux;
    if (!mieux) return;
    mieux.vers = { texte: casse(v.texte), n: [...casse(v.texte)].length, poete: v.poete, ordre: i, lec: this.lec, ancien: false };
  }
  dessiner() {
    const P = palette(), r = rythme(), m = this.m;
    cameraPays(m.cam, r);
    ctx.save();
    this.fond(P, r);
    // du plus loin au plus proche : poser3D trie les lettres ; les objets aussi pour les lumieres
    for (const o of m.objets) tracerObjet(o, P, r, m.decor, m.t);
    poser3D();
    poserLumieres();
    ctx.restore();
  }
}

/* ================================================================ scene : la route de nuit */

// Une route qui file vers l'horizon : les bords et les pointilles sont des mots couches sur
// l'asphalte, les lampadaires et les poteaux des lignes de mots, les fils entre eux aussi. Les
// voitures qu'on croise, celles qui nous doublent, les camions, un cycliste : chacun dessine par
// un vers. Leurs phares clignent sur les coups ; la lune est ecrite avec le titre du poeme.
const route = {};
class SceneRoute extends ScenePaysage {
  constructor(p) { super(p, route); this.distances = [8, 40, 16]; }
  initialiser() {
    const m = this.m;
    m.cam = { x: 1.8, y: 1.3, z: 0, lacet: 0, tangage: -0.035, loin: 140, pres: 8 };
    m.lampe = 8; m.poteau = 15; m.croise = 2; m.double = 6; m.velo = 20;
  }
  avancer(dt) {
    const m = this.m, c = m.cam, dens = clamp(S.paysDensite, 0.2, 3), v = 9 * S.paysVitesse;
    c.z += v * dt;
    c.lacet = 0.03 * Math.sin(m.t * 0.04);
    while (m.lampe < c.z + 170) { const g = (Math.round(m.lampe) % 2) ? -1 : 1; this.nouveau("lampadaire", g * 5.4, 0, m.lampe, { ang: g > 0 ? Math.PI : 0, h: 0.32 }); m.lampe += 26 / dens; }
    while (m.poteau < c.z + 170) { this.nouveau("poteau", 10.5, 0, m.poteau, { h: 0.35 }); m.poteau += 42; }
    m.croise -= dt; m.double -= dt; m.velo -= dt;
    if (m.croise <= 0) {
      m.croise = hasard(3, 8) / dens;
      this.nouveau(Math.random() < 0.25 ? "camion" : "voiture", -1.8, 0, c.z + 165, { ang: Math.PI, vz: -hasard(8, 13), porteur: true, h: 0.2, ech: 1.6 });
    }
    if (m.double <= 0) {
      m.double = hasard(20, 40) / dens;
      this.nouveau("voiture", -2.2, 0, c.z - 10, { vz: v * 1.25 + 2, porteur: true, h: 0.2, ech: 1.6 });
    }
    if (m.velo <= 0) { m.velo = hasard(25, 50) / dens; this.nouveau("velo", 4.2, 0, c.z + 120, { vz: 3, porteur: true, h: 0.16 }); }
  }
  porteur() {
    const c = this.m.cam;
    return this.nouveau("voiture", -1.8, 0, c.z + 46, { ang: Math.PI, vz: -hasard(6, 9), porteur: true, h: 0.2, ech: 1.6 });
  }
  fond(P, r) {
    const c = this.m.cam, mots = this.m.decor;
    etoilesPays(0.9);
    lunePays(this.poeme.titre, -0.35, 0.2, 26);
    // les collines de l'horizon : de grands mots, a distance fixe (elles ne s'approchent jamais)
    const zh = c.z + 420;
    ligneMots(s => [s, 14 + 11 * Math.sin(s / 95) + 6 * Math.sin(s / 33 + 1), zh], -500, 500, 26, 11, mots, 7, P.note, 0.55);
    // la route : bords et pointilles couches sur l'asphalte
    for (const x of [-3.7, 3.7]) ligneMots(s => [x, 0, s], c.z + 3, c.z + 150, 3.2, x > 0 ? 1 : 2, mots, 0.55, P.note, 0.75, 0.12);
    ligneMots(s => [0, 0, s], c.z + 4, c.z + 150, 8, 3, mots, 0.6, P.texte, 0.6, 0.1);
    // les fils entre les poteaux
    const pot = this.m.objets.filter(o => o.forme === "poteau").sort((a, b) => a.z - b.z);
    for (let k = 0; k + 1 < pot.length; k++) {
      const a = pot[k], b = pot[k + 1];
      for (const dx of [-1.1, 1.1]) {
        const A = [a.x + dx, 7.4, a.z], Bp = [b.x + dx, 7.4, b.z], L = b.z - a.z;
        ligneMots(s => { const u = s / L; return [A[0], 7.4 - 1.4 * 4 * u * (1 - u), A[2] + (Bp[2] - A[2]) * u]; }, 0.5, L - 0.5, 1.5, a.id * 7 + (dx > 0 ? 1 : 0), mots, 0.2, P.note, 0.5);
      }
    }
  }
}

/* ================================================================ scene : la ville */

// Une avenue la nuit : des immeubles en lignes de mots des deux cotes, leurs fenetres allumees,
// des banderoles tendues en travers de la rue ou pendent les vers, des lampadaires, des voitures
// garees, une voiture qui vient. Au fond, la ligne des toits.
const ville = {};
class SceneVille extends ScenePaysage {
  constructor(p) { super(p, ville); this.distances = [10, 45, 22]; }
  initialiser() {
    const m = this.m;
    m.cam = { x: 0, y: 1.7, z: 0, lacet: 0, tangage: 0.03, loin: 120, pres: 10 };
    m.bat = [0, 0]; m.ban = 20; m.lampe = 6; m.auto = 5;
  }
  avancer(dt) {
    const m = this.m, c = m.cam, dens = clamp(S.paysDensite, 0.2, 3);
    c.z += 5 * S.paysVitesse * dt;
    c.lacet = 0.05 * Math.sin(m.t * 0.03);
    for (const g of [0, 1]) while (m.bat[g] < c.z + 150) {
      const w = hasard(9, 18), cote = g ? 1 : -1;
      this.nouveau("immeuble", cote * hasard(7.5, 9), 0, m.bat[g] + w / 2, { p: { w, h: hasard(12, 46), d: 10, cote }, h: 0.6 });
      m.bat[g] += w + hasard(1, 5) / dens;
    }
    while (m.ban < c.z + 150) { this.nouveau("banniere", 0, 0, m.ban, { p: { l: 7 }, porteur: true, h: 0.6 }); m.ban += 30 / dens; }
    while (m.lampe < c.z + 150) { for (const g of [-1, 1]) this.nouveau("lampadaire", g * 6.2, 0, m.lampe, { ang: g > 0 ? Math.PI : 0, h: 0.3 }); m.lampe += 24; }
    m.auto -= dt;
    if (m.auto <= 0) {
      m.auto = hasard(4, 10) / dens;
      if (Math.random() < 0.5) this.nouveau("voiture", -2.6, 0, c.z + 170, { ang: Math.PI, vz: -hasard(5, 9), porteur: true, h: 0.3 });
      else this.nouveau("voiture", (Math.random() < 0.5 ? -1 : 1) * 4.9, 0, c.z + 170, { ang: hasard(-0.05, 0.05), h: 0.28 });
    }
  }
  porteur() { return this.nouveau("banniere", 0, 0, this.m.cam.z + 26, { p: { l: 7 }, porteur: true, h: 0.6 }); }
  fond(P) {
    const c = this.m.cam, mots = this.m.decor;
    etoilesPays(0.6);
    lunePays(this.poeme.titre, 0.3, 0.3, 24);
    // la ligne des toits au fond, a distance fixe
    const zh = c.z + 380, tours = s => 18 + (hacher(Math.floor(s / 22) + 5) % 60);
    const pts = [];
    for (let x = -360; x <= 360; x += 22) { const y = tours(x); pts.push([x, y, zh], [x + 21, y, zh], [x + 21, tours(x + 22), zh]); }
    ligneMots(s => { const k = clamp(Math.floor(s / 1), 0, pts.length - 2), u = s - k; const a = pts[k], b = pts[k + 1]; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, zh]; },
      0, pts.length - 1.01, 0.45, 21, mots, 4.5, P.note, 0.4);
    for (const x of [-6, 6]) ligneMots(s => [x, 0.05, s], c.z + 3, c.z + 160, 3, x > 0 ? 4 : 5, mots, 0.5, P.note, 0.6, 0.1);
  }
}

/* ================================================================ scene : le bord de mer */

// On longe la mer la nuit : les vagues sont des lignes de mots qui arrivent du large et
// meurent sur la plage ; des voiliers passent, leur voile dessinee par un vers ; un phare balaie
// la nuit de son faisceau de mots ; la lune (le titre) a son reflet qui tremble sur l'eau.
const mer = {};
class SceneMer extends ScenePaysage {
  constructor(p) { super(p, mer); this.distances = [14, 80, 32]; }
  initialiser() {
    const m = this.m;
    m.cam = { x: 0, y: 3.6, z: 0, lacet: 0.12, tangage: -0.07, loin: 160, pres: 10 };
    m.phare = 60; m.bateau = 1; m.vague = 0;
  }
  garder(o) { const c = this.m.cam; return Math.abs(o.x - c.x) < 260 && o.z > c.z - 5; }
  avancer(dt) {
    const m = this.m, c = m.cam, dens = clamp(S.paysDensite, 0.2, 3);
    c.x += 1.6 * S.paysVitesse * dt;
    c.lacet = 0.12 + 0.05 * Math.sin(m.t * 0.03);
    m.vague += dt * 0.45;
    while (m.phare < c.x + 220) { this.nouveau("phare", m.phare, 0, hasard(60, 90), { h: 0.5 }); m.phare += hasard(260, 380); }
    m.bateau -= dt;
    const nb = m.objets.filter(o => o.forme === "voilier").length;
    if (m.bateau <= 0 && nb < 3 + dens * 2) { m.bateau = hasard(6, 14) / dens; this.voilier(c.x + hasard(60, 110), hasard(25, 75)); }
  }
  voilier(x, z) {
    return this.nouveau("voilier", x, 0, z, { ang: -Math.PI / 2 + hasard(-0.25, 0.25), vx: -hasard(0.8, 2), porteur: true, h: 0.36, ech: 1.3 });
  }
  porteur() { const c = this.m.cam; return this.voilier(c.x + hasard(-8, 12), hasard(24, 34)); }
  fond(P, r) {
    const m = this.m, c = m.cam, mots = m.decor, t = m.t;
    etoilesPays(1);
    const az = 0.25, haut = 0.16;
    lunePays(this.poeme.titre, az, haut, 22);
    // les vagues : des rangs qui avancent du large, chacun ses mots
    const A = 0.22 * (1 + (r.b * 0.8 + r.coup * 0.3) * S.paysTangage);
    for (let k = 0; k < 20; k++) {
      const n = Math.floor(m.vague) + k, z = 4 * Math.pow(1.17, k - (m.vague % 1)) + 2;
      if (z > 170) break;
      // une vague est une ligne : des mots serres, qui ondulent
      const demi = 8 + z * 1.1, hm = 0.3 + z * 0.007, pas = hm * 5.2 + (hacher(n) % 100) / 200;
      const naissance = clamp((170 - z) / 30, 0, 1) * clamp((z - 2.2) / 2.5, 0, 1);
      ligneMots(s => [s, A * 1.6 * Math.sin(s * 0.16 + t * 0.9 + n), z], c.x - demi, c.x + demi, pas, n * 3, mots, hm, P.note, 0.8 * naissance, 0.18);
    }
    // le reflet de la lune : des mots courts qui tremblent sur l'eau
    for (let k = 0; k < 16; k++) {
      const z = 14 + k * k * 0.9, x = c.x + Math.tan(az) * z + Math.sin(t * 2 + k * 1.7) * (0.6 + z * 0.02);
      lettreDroite(mots[hacher(k + Math.floor(t * 0.7)) % mots.length], 0.4 + z * 0.012, P.accent, x, 0.02, z, 1, 0, 0, 0.35 + 0.25 * Math.sin(t * 3 + k));
    }
    // la plage
    ligneMots(s => [s, 0, 3.2 + 0.4 * Math.sin(s * 0.3)], c.x - 10, c.x + 10, 2.2, 9, mots, 0.32, P.note, 0.6, 0.1);
  }
}

/* ================================================================ scene : la vallee */

// On survole une vallee : la riviere serpente, ses rives sont des mots couches, l'eau charrie
// des mots qui descendent ; les montagnes sont des cretes de grands mots, de plus en plus pales
// au loin ; des arbres et des eoliennes sur les rives. Chaque vers flotte sur la riviere.
const vallee = {};
const riviere = z => 14 * Math.sin(z / 70) + 7 * Math.sin(z / 29 + 1);
class SceneVallee extends ScenePaysage {
  constructor(p) { super(p, vallee); }
  initialiser() {
    const m = this.m;
    m.cam = { x: 0, y: 15, z: 0, lacet: 0, tangage: -0.24, loin: 230, pres: 15 };
    m.arbre = 10; m.eol = 60;
  }
  avancer(dt) {
    const m = this.m, c = m.cam, dens = clamp(S.paysDensite, 0.2, 3);
    c.z += 7 * S.paysVitesse * dt;
    c.x = riviere(c.z + 30) * 0.7;
    c.lacet = Math.atan2(riviere(c.z + 60) - riviere(c.z + 20), 40) * 0.6;
    while (m.arbre < c.z + 200) {
      const g = Math.random() < 0.5 ? -1 : 1;
      this.nouveau(Math.random() < 0.55 ? "sapin" : "arbre", riviere(m.arbre) + g * hasard(9, 26), 0, m.arbre, { h: 0.5, ech: hasard(1, 1.6), max: 0 });
      m.arbre += hasard(5, 11) / dens;
    }
    while (m.eol < c.z + 220) { this.nouveau("eolienne", riviere(m.eol) - hasard(45, 70), 0, m.eol, { h: 0.9 }); m.eol += hasard(70, 140); }
  }
  // chaque vers se couche sur la riviere, un peu devant nous
  porteur(i) {
    const c = this.m.cam, z0 = c.z + 36, f = fluxDe(casse(this.lec.vers[i].texte)), h = Math.min(0.85, 26 / Math.max(1, f.w.reduce((a, b) => a + b, 0))) * clamp(S.taille, 0.6, 1.6);
    const L = f.w.reduce((a, b) => a + b, 0) * h + 2;
    // couche en travers de l'eau, de gauche a droite, un peu courbe comme le courant
    const pts2 = [];
    for (let k = 0; k <= 24; k++) { const u = k / 24, z = z0 + 6 * Math.sin(u * Math.PI * 0.5); pts2.push(riviere(z) - L / 2 + L * u, 0.05, z); }
    return this.nouveau("fleuve", 0, 0, 0, { p: { pts: pts2 }, porteur: true, h, max: 400 });
  }
  donner(i) {
    const o = this.porteur(i), v = this.lec.vers[i];
    o.vers = { texte: casse(v.texte), n: [...casse(v.texte)].length, poete: v.poete, ordre: i, lec: this.lec, ancien: false };
  }
  garder(o) { const d = (o.forme === "fleuve" ? o.p.pts[2] : o.z) - this.m.cam.z; return d > -20 && d < 300; }
  fond(P, r) {
    const m = this.m, c = m.cam, mots = m.decor, t = m.t;
    etoilesPays(0.9);
    lunePays(this.poeme.titre, -0.55, 0.07, 22);
    // les rives et le courant
    for (const g of [-1, 1]) ligneMots(s => [riviere(s) + g * 7, 0, s], c.z + 4, c.z + 190, 3.4, g > 0 ? 1 : 2, mots, 1.0, P.note, 0.75, 0.15);
    for (const g of [-3, 0, 3]) ligneMots(s => [riviere(s) + g, 0.02, s], c.z + 4, c.z + 150, 7, 10 + g, mots, 0.8, P.texte, 0.35, 0.12, t * 2.5);
    // les montagnes : des cretes de grands mots, de chaque cote, et la chaine au fond
    for (let k = 0; k < 3; k++) for (const g of [-1, 1]) {
      const x0 = g * (55 + k * 45);
      ligneMots(s => [c.x + x0 + g * 15 * Math.sin(s / 50 + k), 18 + k * 14 + 16 * Math.sin(s / 41 + k * 2) + 9 * Math.sin(s / 17 + g), s],
        c.z + 20, c.z + 320, 9 + k * 3, k * 10 + (g > 0 ? 5 : 0), mots, 3 + k, P.note, 0.6);
    }
    ligneMots(s => [s, 70 + 35 * Math.sin(s / 120) + 18 * Math.sin(s / 47 + 2) + 8 * Math.sin(s / 19), c.z + 480], c.x - 600, c.x + 600, 30, 77, mots, 9, P.note, 0.5);
  }
}

/* ================================================================ scene : la gare */

// Sur le quai, la nuit, on regarde passer les trains : les rails et les traverses sont des
// mots couches, les poteaux et la catenaire des lignes de mots, l'horloge a l'heure vraie ; les
// wagons, fenetres allumees, sont dessines par les vers, et les panneaux du quai aussi.
const gare = {};
class SceneGare extends ScenePaysage {
  constructor(p) { super(p, gare); this.distances = [9, 60, 22]; }
  initialiser() {
    const m = this.m;
    m.cam = { x: -2.2, y: 1.75, z: 0, lacet: 0.06, tangage: -0.02, loin: 150, pres: 8 };
    m.poteau = 6; m.panneau = 10; m.horloge = 30; m.train = hasard(20, 35);
    this.train(true);
  }
  garder(o) { const d = o.z - this.m.cam.z; return d > -60 && d < 320; }
  avancer(dt, dtr) {
    const m = this.m, c = m.cam, dens = clamp(S.paysDensite, 0.2, 3);
    c.z += 1.2 * S.paysVitesse * dt;
    c.lacet = 0.06 + 0.03 * Math.sin(m.t * 0.05);
    while (m.poteau < c.z + 220) { this.nouveau("poteau", 4.2, 0, m.poteau, { h: 0.3 }); m.poteau += 28; }
    while (m.panneau < c.z + 220) { this.nouveau("panneau", -1.2, 0, m.panneau, { ang: Math.PI / 2, porteur: true, h: 0.32 }); m.panneau += 24 / dens; }
    while (m.horloge < c.z + 220) { this.nouveau("horloge", -3.4, 0, m.horloge, { ang: Math.PI / 2, h: 0.3 }); m.horloge += 80; }
    // un train toutes les 20 a 45 vraies secondes (sa vitesse, elle, suit la vitesse generale)
    m.train -= dtr;
    if (m.train <= 0) { m.train = hasard(20, 45) / dens; this.train(false); }
  }
  train(deja) {
    const c = this.m.cam, arrive = Math.random() < 0.6, voie = arrive ? 1.8 : 6.5, n = 3 + Math.floor(Math.random() * 4);
    // il arrive vers nous sur la voie du quai, ou s'eloigne sur l'autre
    const v = arrive ? -hasard(3, 6) : hasard(3, 6), z0 = deja ? c.z + 70 : arrive ? c.z + 200 : c.z - 30, sens = arrive ? -1 : 1;
    // le decor des wagons en mots espaces : un train entier ferait sinon des milliers de lettres
    this.nouveau("locomotive", voie, 0, z0, { ang: arrive ? Math.PI : 0, vz: v, porteur: true, h: 0.3, pas: 2.4 });
    for (let k = 1; k <= n; k++) this.nouveau("wagon", voie, 0, z0 - sens * (k * 19.5 - 3), { ang: arrive ? Math.PI : 0, vz: v, porteur: true, h: 0.3, pas: 2.4 });
  }
  porteur() { return this.nouveau("panneau", -1.2, 0, this.m.cam.z + 16, { ang: Math.PI / 2, porteur: true, h: 0.32 }); }
  fond(P) {
    const c = this.m.cam, mots = this.m.decor;
    etoilesPays(0.6);
    lunePays(this.poeme.titre, 0.35, 0.2, 22);
    const z0 = c.z + 2, z1 = c.z + 200;
    for (const x of [1.1, 2.5, 5.8, 7.2]) ligneMots(s => [x, 0.05, s], z0, z1, 2.4, Math.round(x * 10), mots, 0.32, P.note, 0.7, 0.1);
    ligneMots(s => [0, 0.9, s], z0, z1, 2.8, 7, mots, 0.36, P.accent, 0.55, 0.15);
    ligneMots(s => [4.2, 6.6, s], z0, z1, 1.8, 8, mots, 0.24, P.note, 0.5);
    // la marquise du quai : ses deux bords de toit, et une colonne tous les 9 metres
    for (const x of [-5.2, 0.4]) ligneMots(s => [x, 4.6, s], z0, c.z + 140, 2.2, x > 0 ? 31 : 32, mots, 0.3, P.note, 0.6);
    for (let k = Math.ceil(z0 / 9); k * 9 < c.z + 120; k++) {
      ligneMots(s => [-4.8, s, k * 9], 0.4, 4.4, 1.1, k * 5 + 3, mots, 0.24, P.note, 0.5);
      lumierePays(-2.4, 4.4, k * 9, 0.35, "#ffc46b", 0.7);
    }
    // les lumieres de la ville, au loin a droite
    for (let k = 0; k < 40; k++) {
      const z = Math.floor(c.z / 40) * 40 + k * 14 + (hacher(k) % 8), x = 40 + (hacher(k * 7 + Math.floor(z)) % 220), y = 2 + (hacher(k * 13) % 30);
      lumierePays(x, y, z, 1.2, k % 3 ? "#ffc46b" : P.accent, 0.5);
    }
  }
}

/* ================================================================ scene : la foret */

// On marche la nuit dans une foret d'arbres-calligrammes : troncs, branches et feuillages en
// lignes de mots, des sapins ; les arbres pres du chemin portent les vers ; des lucioles (des
// lettres qui brillent) flottent ; la lune passe entre les branches.
const foret = {};
const chemin = z => 2.2 * Math.sin(z / 26);
class SceneForet extends ScenePaysage {
  constructor(p) { super(p, foret); this.distances = [6, 32, 13]; }
  initialiser() {
    const m = this.m;
    m.cam = { x: 0, y: 1.7, z: 0, lacet: 0, tangage: 0.02, loin: 55, pres: 6 };
    m.arbre = 3;
    m.lucioles = Array.from({ length: 26 }, () => ({ x: hasard(-12, 12), y: hasard(0.5, 4), z: hasard(3, 40), ph: hasard(0, 6.3) }));
  }
  avancer(dt) {
    const m = this.m, c = m.cam, dens = clamp(S.paysDensite, 0.2, 3);
    c.z += 1.5 * S.paysVitesse * dt;
    c.x = chemin(c.z);
    c.lacet = Math.atan2(chemin(c.z + 6) - chemin(c.z), 6) * 0.8;
    while (m.arbre < c.z + 62) {
      const n = 1 + (Math.random() < 0.6 * dens ? 1 : 0) + (Math.random() < 0.25 * dens ? 1 : 0);
      for (let k = 0; k < n; k++) {
        const g = Math.random() < 0.5 ? -1 : 1, dx = hasard(3.4, 20), x = chemin(m.arbre) + g * dx, pres = dx < 7.5;
        // les arbres du bord du chemin ecrivent les vers en lettres ; le decor, en petits mots
        this.nouveau(Math.random() < 0.6 ? "arbre" : "sapin", x, 0, m.arbre + hasard(-1, 1), { ech: hasard(0.85, 1.4), porteur: pres, h: pres ? 0.22 : 0.17, max: pres ? 150 : 0, pas: 1.9 });
      }
      m.arbre += hasard(3.2, 5.2) / dens;
    }
    for (const l of m.lucioles) {
      l.x += Math.sin(m.t * 0.3 + l.ph) * dt * 0.4; l.y += Math.cos(m.t * 0.4 + l.ph) * dt * 0.2;
      if (l.z < c.z + 2) { l.z = c.z + hasard(25, 45); l.x = c.x + hasard(-12, 12); }
    }
  }
  porteur() {
    const c = this.m.cam, g = Math.random() < 0.5 ? -1 : 1;
    return this.nouveau("arbre", chemin(c.z + 14) + g * hasard(3.5, 5.5), 0, c.z + 14, { porteur: true, h: 0.22, max: 150 });
  }
  fond(P, r) {
    const m = this.m, c = m.cam, mots = m.decor;
    etoilesPays(0.6);
    lunePays(this.poeme.titre, 0.2, 0.3, 24);
    for (const g of [-1.3, 1.3]) ligneMots(s => [chemin(s) + g, 0, s], c.z + 1, c.z + 70, 1.8, g > 0 ? 3 : 4, mots, 0.3, P.note, 0.7, 0.15);
    // les lucioles : des lettres du poeme qui brillent
    const vers = this.lec.vers, P2 = P.accent;
    m.lucioles.forEach((l, k) => {
      const a = 0.5 + 0.5 * Math.sin(m.t * 1.6 + l.ph * 3) * (1 + r.coup);
      lumierePays(l.x, l.y, l.z, 0.035, P2, a * 0.8);
      const t = vers[k % vers.length].texte, ch = [...t][(k * 7) % Math.max(1, t.length)] || "·";
      lettreDroite(ch, 0.16, P2, l.x, l.y + 0.2, l.z, 1, 0, 0, a * 0.7);
    });
  }
}

/* ================================================================ scene : la fete foraine */

// La fete foraine la nuit, vue en tournant lentement autour : la grande roue tourne, le vers
// ecrit sur sa jante tourne avec elle ; le manege, les baraques et leurs auvents, les guirlandes
// d'ampoules entre les mats. Les vers vont sur la roue, le manege, les guirlandes, les auvents.
const foire = {};
class SceneFoire extends ScenePaysage {
  constructor(p) { super(p, foire); this.distances = [12, 75, 34]; }
  initialiser() {
    const m = this.m;
    m.cam = { x: 0, y: 3, z: -44, lacet: 0, tangage: 0.06, loin: 140, pres: 14 };
    m.phi = 0;
    this.nouveau("grandeRoue", -12, 0, 8, { porteur: true, h: 0.5, ang: 0.3 });
    this.nouveau("manege", 13, 0, -1, { porteur: true, h: 0.36 });
    for (let k = 0; k < 9; k++) {
      const a = k / 9 * Math.PI * 2 + 0.3, R = 24;
      this.nouveau("stand", Math.sin(a) * R, 0, Math.cos(a) * R, { ang: a + Math.PI, porteur: true, h: 0.3 });
    }
    // les guirlandes : d'un mat a l'autre, en cercle
    for (let k = 0; k < 7; k++) {
      const a = k / 7 * Math.PI * 2, b = (k + 1) / 7 * Math.PI * 2, R = 18;
      const A = [Math.sin(a) * R, Math.cos(a) * R], Bq = [Math.sin(b) * R, Math.cos(b) * R];
      const mx = (A[0] + Bq[0]) / 2, mz = (A[1] + Bq[1]) / 2, l = Math.hypot(Bq[0] - A[0], Bq[1] - A[1]) / 2;
      this.nouveau("banniere", mx, 0, mz, { ang: Math.atan2(Bq[0] - A[0], Bq[1] - A[1]) - Math.PI / 2, p: { l }, porteur: true, h: 0.36 });
    }
  }
  garder() { return true; }
  avancer(dt) {
    const m = this.m, c = m.cam;
    m.phi += dt * 0.03 * S.paysVitesse;
    const R = 44 + 4 * Math.sin(m.t * 0.02);
    c.x = Math.sin(m.phi) * R; c.z = -Math.cos(m.phi) * R; c.lacet = -m.phi;
  }
  porteur() { return null; }
  fond(P) {
    const c = this.m.cam, mots = this.m.decor;
    etoilesPays(0.8);
    lunePays(this.poeme.titre, -this.m.phi + 0.5, 0.35, 26);
    ligneMots(s => [Math.sin(s / 29) * 29, 0, Math.cos(s / 29) * 29], 0, Math.PI * 2 * 29, 2.6, 5, mots, 0.45, P.note, 0.6, 0.12);
  }
}

/* ================================================================ dans le panneau et dans la rotation */

ajouterScene({ cle: "route", nom: "La route de nuit (voitures, phares, lampadaires en mots)", fabrique: p => new SceneRoute(p), calme: true, plein: true, continue: true });
ajouterScene({ cle: "ville", nom: "La ville (immeubles et banderoles de vers)", fabrique: p => new SceneVille(p), plein: true, continue: true });
ajouterScene({ cle: "mer", nom: "Le bord de mer (vagues, voiliers, phare)", fabrique: p => new SceneMer(p), calme: true, continue: true });
ajouterScene({ cle: "vallee", nom: "La vallée (rivière, montagnes, éoliennes)", fabrique: p => new SceneVallee(p), calme: true, continue: true });
ajouterScene({ cle: "gare", nom: "La gare (trains, rails, horloge)", fabrique: p => new SceneGare(p), plein: true, continue: true });
ajouterScene({ cle: "foret", nom: "La forêt d'arbres-calligrammes", fabrique: p => new SceneForet(p), calme: true, continue: true });
ajouterScene({ cle: "foire", nom: "La fête foraine (grande roue, manège)", fabrique: p => new SceneFoire(p), plein: true, continue: true });

ajouterReglages("Paysages", "Les paysages en lettres", [
  { cle: "paysVitesse", nom: "La caméra avance (vitesse)", type: "curseur", min: 0, max: 3, pas: 0.05 },
  { cle: "paysDensite", nom: "Densité du décor (voitures, arbres, trains...)", type: "curseur", min: 0.3, max: 2.5, pas: 0.05 },
  { cle: "paysLoin", nom: "Jusqu'où l'on voit (le brouillard)", type: "curseur", min: 0.4, max: 2.5, pas: 0.05 },
  { cle: "paysLumieres", nom: "Les lumières brillent (phares, fenêtres, ampoules)", type: "curseur", min: 0, max: 2.5, pas: 0.05 },
  { cle: "paysTangage", nom: "La musique fait tanguer la caméra", type: "curseur", min: 0, max: 2, pas: 0.05 },
], { paysVitesse: 1, paysDensite: 1, paysLoin: 1, paysLumieres: 1, paysTangage: 1 });
