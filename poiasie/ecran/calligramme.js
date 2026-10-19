"use strict";
/* ================================================================ scene : le calligramme */

// A la maniere d'Apollinaire : le poeme s'ecrit lettre a lettre le long d'une forme, et la forme
// derive lentement d'un bord a l'autre, comme les vieux ecrans de veille (Jiiji aime « le cote
// Apollinaire fond d'ecran Windows »).
// Refait le 2026-10-18 pour le grand chantier. Jiiji : « il faut beaucoup, beaucoup, beaucoup plus
// de dessins Apollinaire », « des trucs comme ca qui font des formes en 3D, c'est vraiment ca qui
// rend le truc beau ». Donc :
// - les lettres sont des vignettes posees (vignetteMot) : ecrites une a une par dessinerMot avec
//   leur ombre floue, 500 lettres coutaient 42 a 58 ms par image (mesure du 2026-10-18) ;
// - une forme est faite de parties : des traces (le texte coule le long), des surfaces remplies
//   de lignes de texte (pair-impair : un polygone dans un autre y fait un trou), des textes fixes
//   (le titre dans le miroir, les aiguilles de la montre), des parties qui bougent (ailes, roues,
//   cloche, flamme) ;
// - tout est en 3D : chaque lettre est une petite plaque posee dans l'espace (sa direction, son
//   haut), projetee en perspective, plus petite et plus sombre au loin. Les formes a plat
//   basculent doucement ; les volumes (sphere, tore, ruban...) tournent sur eux-memes.

/* ---------------------------------------------------- les outils de dessin des formes */

// Coordonnees d'une forme : x vers la droite, y vers le bas, a peu pres entre -1 et 1 ; z vers
// le fond (la camera regarde depuis z negatif). La scene recadre et met a l'echelle.
const CALLI_ID = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const calli = {
  // un trace : f(t) -> { x, y, z }, t de 0 a 1
  trait(f, o) { return Object.assign({ type: "trait", f }, o || {}); },
  // un trace par des points [[x, y(, z)], ...], parcouru a vitesse constante ; lisse : une
  // courbe qui passe par les points ; ferme : il revient au premier
  ligne(pts, o) {
    o = o || {};
    const q = o.lisse ? calli.lisser(pts, o.ferme) : (o.ferme ? pts.concat([pts[0]]) : pts);
    return calli.trait(calli.parcours(q), o);
  },
  parcours(q) {
    const L = [0];
    for (let i = 1; i < q.length; i++) L.push(L[i - 1] + Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1], (q[i][2] || 0) - (q[i - 1][2] || 0)));
    const tot = L[L.length - 1] || 1;
    return t => {
      const s = clamp(t, 0, 1) * tot;
      let lo = 0, hi = q.length - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L[m] <= s) lo = m; else hi = m; }
      const k = (s - L[lo]) / Math.max(1e-9, L[hi] - L[lo]), a = q[lo], b = q[hi];
      return { x: lerp(a[0], b[0], k), y: lerp(a[1], b[1], k), z: lerp(a[2] || 0, b[2] || 0, k) };
    };
  },
  // courbe de Catmull-Rom : passe par chaque point
  lisser(pts, ferme, n) {
    n = n || 10;
    const out = [], N = pts.length, P = i => ferme ? pts[(i + N) % N] : pts[clamp(i, 0, N - 1)];
    const fin = ferme ? N : N - 1;
    for (let i = 0; i < fin; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      for (let j = 0; j < n; j++) {
        const t = j / n, t2 = t * t, t3 = t2 * t;
        const c = d => 0.5 * (2 * p1[d] + (p2[d] - p0[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (3 * p1[d] - p0[d] - 3 * p2[d] + p3[d]) * t3);
        out.push([c(0), c(1)]);
      }
    }
    out.push(ferme ? out[0].slice() : pts[N - 1].slice());
    return out;
  },
  // un arc d'ellipse (angles en radians, y vers le bas : l'angle croit dans le sens des aiguilles)
  arc(cx, cy, rx, ry, a0, a1, o) { return calli.trait(t => { const a = a0 + (a1 - a0) * t; return { x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry, z: 0 }; }, o); },
  // un cercle qui part du haut et tourne dans le sens des aiguilles (le texte est droit en haut)
  cercle(cx, cy, r, o) { return calli.arc(cx, cy, r, r, -Math.PI / 2, Math.PI * 1.5, o); },
  // une surface remplie de lignes de texte ; polys : des polygones, pair-impair
  plein(polys, o) { return Object.assign({ type: "plein", polys }, o || {}); },
  ovale(cx, cy, rx, ry, n) { n = n || 40; const out = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return out; },
  rect(x0, y0, x1, y1) { return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]; },
  // agrandir, tourner, deplacer des points
  poser(pts, s, dx, dy, a) { const c = Math.cos(a || 0), sn = Math.sin(a || 0); return pts.map(p => [dx + s * (p[0] * c - p[1] * sn), dy + s * (p[0] * sn + p[1] * c)]); },
  miroir(pts) { return pts.map(p => [-p[0], p[1]]); },
  // l'ancienne facon des silhouettes : une demi-largeur pour chaque hauteur
  silhouette(fn) {
    const d = [], g = [];
    for (let i = 0; i <= 80; i++) { const y = -1 + i / 40, w = Math.max(0, fn(y)) * 0.9; d.push([w, y]); g.push([-w, y]); }
    return calli.plein([d.concat(g.reverse())]);
  },
  // les rotations, matrices 3 x 3 rangees par lignes
  rx(a) { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; },
  ry(a) { const c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 1, 0, -s, 0, c]; },
  rz(a) { const c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, s, c, 0, 0, 0, 1]; },
  mul(A, B) {
    const M = new Array(9);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) M[i * 3 + j] = A[i * 3] * B[j] + A[i * 3 + 1] * B[3 + j] + A[i * 3 + 2] * B[6 + j];
    return M;
  },
  app(m, v) { return [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]]; },
  // une rotation autour d'un pivot : ce que rend une partie qui bouge
  autour(m, pivot, d) { return { m, o: pivot || [0, 0, 0], d: d || [0, 0, 0] }; },
  // la normale d'une surface p(u, v) (les lettres d'un ruban se tordent avec lui)
  normale(p, u, v) {
    const e = 1e-3, a = p(u, v), du = p(u + e, v), dv = p(u, v + e);
    const x = [du[0] - a[0], du[1] - a[1], du[2] - a[2]], y = [dv[0] - a[0], dv[1] - a[1], dv[2] - a[2]];
    return [x[1] * y[2] - x[2] * y[1], x[2] * y[0] - x[0] * y[2], x[0] * y[1] - x[1] * y[0]];
  },
};
function calliCoeur(a) { return [16 * Math.pow(Math.sin(a), 3) / 17, -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 17]; }
function calliNorm(v) { const l = Math.hypot(v[0], v[1], v[2]); return l > 1e-9 ? [v[0] / l, v[1] / l, v[2] / l] : null; }
function calliOrtho(n, T) { const d = n[0] * T[0] + n[1] * T[1] + n[2] * T[2]; return calliNorm([n[0] - d * T[0], n[1] - d * T[1], n[2] - d * T[2]]); }
function calliLarg(c) { return mesurer(c, police(100)) / 100; }

// la colombe (de profil, vers la gauche), son aile a part pour qu'elle batte
const CALLI_COLOMBE = [[-1.0, -0.30], [-0.86, -0.42], [-0.70, -0.46], [-0.58, -0.38], [-0.45, -0.22], [-0.30, -0.18], [0.38, -0.22], [0.75, -0.18],
  [1.10, -0.28], [1.08, -0.06], [0.72, 0.04], [0.30, 0.20], [-0.20, 0.22], [-0.55, 0.06], [-0.72, -0.14], [-0.86, -0.24]];
const CALLI_AILE = [[-0.30, -0.20], [-0.12, -0.55], [0.12, -0.95], [0.30, -0.88], [0.22, -0.55], [0.38, -0.24]];
// la colombe d'un seul trait, l'aile levee (pour les petites, au loin)
const CALLI_COLOMBE_AILEE = CALLI_COLOMBE.slice(0, 6).concat(CALLI_AILE.slice(1, 5), CALLI_COLOMBE.slice(6));
// un nuage bosselé
const CALLI_NUAGE = [[-1.1, 0.3], [1.1, 0.3], [1.18, 0.05], [0.95, -0.22], [0.62, -0.28], [0.45, -0.58], [0.05, -0.7], [-0.3, -0.5], [-0.6, -0.55], [-0.95, -0.3], [-1.18, 0.0]];
// le cheval, debout, la tete a gauche
const CALLI_CHEVAL = [[-1.05, -0.30], [-1.00, -0.44], [-0.82, -0.70], [-0.74, -0.92], [-0.66, -0.80], [-0.52, -0.72], [-0.32, -0.47], [-0.12, -0.22], [0.20, -0.20],
  [0.55, -0.24], [0.80, -0.18], [0.94, -0.06], [1.12, 0.12], [1.17, 0.46], [1.04, 0.50], [0.97, 0.18], [0.90, 0.10], [0.88, 0.22], [0.84, 0.55], [0.88, 0.95],
  [0.76, 0.95], [0.72, 0.58], [0.66, 0.42], [0.62, 0.42], [0.60, 0.62], [0.58, 0.95], [0.47, 0.95], [0.50, 0.58], [0.48, 0.26], [-0.24, 0.26], [-0.22, 0.60],
  [-0.20, 0.95], [-0.31, 0.95], [-0.34, 0.60], [-0.36, 0.42], [-0.40, 0.42], [-0.42, 0.62], [-0.40, 0.95], [-0.52, 0.95], [-0.54, 0.60], [-0.58, 0.22],
  [-0.63, 0.05], [-0.70, -0.14], [-0.84, -0.24], [-0.96, -0.20]];
// l'heure vraie, pour les aiguilles
function calliHeure() { const d = new Date(); return { h: (d.getHours() % 12 + d.getMinutes() / 60) / 12, mn: (d.getMinutes() + d.getSeconds() / 60) / 60 }; }
// une petite nef de rayons, droits ou ondulants, autour d'un centre
function calliRayons(cx, cy, n, r0, r1, r2, o) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + i / n * Math.PI * 2, r = i % 2 && r2 ? r2 : r1;
    out.push(calli.ligne([[cx + Math.cos(a) * r0, cy + Math.sin(a) * r0], [cx + Math.cos(a) * r, cy + Math.sin(a) * r]], Object.assign({}, o, i % 2 && o && o.onduleImpair ? { ondule: o.onduleImpair } : {})));
  }
  return out;
}

/* ---------------------------------------------------- les formes */

// famille : apollinaire, objets, nature, volumes. volume : la forme tourne dans l'espace.
// Parties : texte (« titre », « rare » : le mot le plus rare, ou un texte), ech (taille de la lettre), droit (lettres
// debout), pasFixe (lettres empilees), teinte (« accent », « note » ou une teinte), ondule
// [amplitude, frequence, vitesse], anime(t, scene) -> { m, o, d }, fixe (ne suit pas l'anime de la
// forme), n(t) (le dehors d'une surface, en 3D), bord (une surface recoit son contour). fsMax :
// la plus grande lettre, en part de la taille de la forme.
const CALLIGRAMMES = {
  /* ---- les seize d'avant (2026-10-16), redessinees a l'identique */
  coeur: { nom: "Cœur", famille: "apollinaire", parties: () => [1, 0.72, 0.46].map(k => calli.trait(t => { const [x, y] = calliCoeur(t * Math.PI * 2); return { x: k * x, y: k * y + 0.12 }; })) },
  miroir: { nom: "Miroir (le titre dedans)", famille: "apollinaire", parties: () => [1, 0.86, 0.72].map(k => calli.arc(0, 0, 0.72 * k, k, -Math.PI / 2, Math.PI * 1.5))
    .concat([calli.ligne([[-0.5, 0], [0.5, 0]], { texte: "titre", ech: 1.5, droit: true, teinte: "accent" })]) },
  montre: { nom: "Montre (à l'heure vraie)", famille: "apollinaire", parties: () => [1, 0.86, 0.72].map(k => calli.cercle(0, 0, k)).concat([
    calli.ligne([[0, -0.06], [0, -0.42]], { texte: "rare", teinte: "accent", anime: () => calli.autour(calli.rz(calliHeure().h * Math.PI * 2)) }),
    calli.ligne([[0, -0.06], [0, -0.6]], { texte: "titre", teinte: "accent", anime: () => calli.autour(calli.rz(calliHeure().mn * Math.PI * 2)) })]) },
  spirale: { nom: "Spirale", famille: "objets", parties: () => [calli.trait(t => { const a = t * Math.PI * 2 * 4.2, r = 1 - t * 0.9; return { x: Math.cos(a) * r, y: Math.sin(a) * r }; })] },
  fontaine: { nom: "Jet d'eau", famille: "apollinaire", parties: () => [-1.3, -1, -0.7, -0.42, -0.16, 0.16, 0.42, 0.7, 1, 1.3].map(a => calli.trait(t => ({ x: a * t * 0.95, y: -0.55 - 0.45 * Math.sin(t * Math.PI * 0.62) * (1 - Math.abs(a) * 0.3) + t * t * 1.5 }))) },
  pluie: { nom: "Il pleut", famille: "apollinaire", parties: () => [-1.5, -1.2, -0.9, -0.6, -0.3, 0, 0.3, 0.6, 0.9, 1.2, 1.5].map((x, i) => calli.trait(t => ({ x: x + t * 0.22, y: -1 + t * 2 + (i % 2) * 0.08 }), { droit: true, pasFixe: true, ondule: [0.012, 9, 0.8] })) },
  tour: { nom: "Tour", famille: "objets", parties: () => [calli.silhouette(y => { const u = (y + 1) / 2; return u < 0.08 ? 0.04 : 0.1 + 0.9 * Math.pow(u, 2.2) + (u > 0.55 && u < 0.62 ? 0.18 : 0); })] },
  losange: { nom: "Losange", famille: "objets", parties: () => [calli.silhouette(y => 1 - Math.abs(y))] },
  sablier: { nom: "Sablier", famille: "objets", parties: () => [calli.silhouette(y => 0.12 + 0.88 * Math.abs(y))] },
  coupe: { nom: "Coupe", famille: "objets", parties: () => [calli.silhouette(y => { const u = (y + 1) / 2; return u < 0.55 ? 0.95 - Math.pow(u / 0.55, 2) * 0.75 : u < 0.85 ? 0.08 : 0.55; })] },
  etoile: { nom: "Étoile", famille: "nature", parties: () => [1, 0.74, 0.5].map(k => calli.trait(t => {
    const u = t * 10, i = Math.floor(u) % 10, f = u - Math.floor(u);
    const pt = j => { const a = -Math.PI / 2 + j * Math.PI / 5, r = j % 2 ? 0.42 : 1; return { x: Math.cos(a) * r * k, y: Math.sin(a) * r * k + 0.08 }; };
    const a = pt(i), b = pt(i + 1);
    return { x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f) };
  })) },
  lune: { nom: "Lune", famille: "nature", parties: () => [[1, 0, 0.36], [0.82, 0.13, 0.42], [0.64, 0.25, 0.48], [0.46, 0.36, 0.55]].map(([r, c, d]) => calli.trait(t => {
    const a = Math.PI * (d + t * (2 - 2 * d));
    return { x: c * 0.9 + Math.cos(a) * r, y: Math.sin(a) * r * 1.05 };
  })) },
  vague: { nom: "La mer", famille: "nature", parties: () => [-0.85, -0.55, -0.25, 0.05, 0.35, 0.65, 0.95].map((y0, i) => calli.trait(t => {
    const x = (t - 0.5) * 2.7;
    return { x, y: y0 + 0.11 * Math.sin((x * 1.3 + i * 0.35) * Math.PI) + 0.04 * Math.sin(x * 7 + i) };
  }, { ondule: [0.02, 4, 0.5, i] })) },
  cravate: { nom: "Cravate", famille: "apollinaire", parties: () => [calli.silhouette(y => { const u = (y + 1) / 2; return u < 0.14 ? 0.3 - u * 0.8 : u < 0.86 ? 0.14 + (u - 0.14) / 0.72 * 0.38 : 0.52 * (1 - (u - 0.86) / 0.14); })] },
  goutte: { nom: "Larme", famille: "nature", parties: () => [calli.silhouette(y => y < 0.44 ? 0.56 * Math.pow((y + 1) / 1.44, 1.6) : Math.sqrt(Math.max(0, 0.3136 - (y - 0.44) * (y - 0.44))))] },
  oeil: { nom: "Œil", famille: "objets", parties: () => [
    calli.trait(t => { const x = (t * 2 - 1) * 1.15; return { x, y: -0.55 * (1 - x * x / 1.3225) }; }),
    calli.trait(t => { const x = (1 - t * 2) * 1.15; return { x, y: 0.55 * (1 - x * x / 1.3225) }; }),
    calli.cercle(0, 0, 0.36), calli.cercle(0, 0, 0.18)] },

  /* ---- les calligrammes d'Apollinaire (ajoutes le 2026-10-18) */
  // La colombe poignardee et le jet d'eau : la colombe en haut, les jets qui retombent, le bassin
  colombeJet: { nom: "La colombe poignardée et le jet d'eau", famille: "apollinaire", parties: () => [
    calli.ligne(calli.poser(CALLI_COLOMBE, 0.55, 0, -0.85), { lisse: true, ferme: true }),
    calli.ligne(calli.poser(CALLI_AILE, 0.55, 0, -0.85), { lisse: true, anime: t => calli.autour(calli.rx(0.45 * Math.sin(t * 0.9)), [0, -0.95, 0]) }),
    ...[-1, -0.62, -0.28, 0.28, 0.62, 1].map(a => calli.trait(t => ({ x: a * t * 0.78, y: -0.28 - 0.32 * Math.sin(t * Math.PI * 0.62) * (1 - Math.abs(a) * 0.25) + t * t * 0.95 }), { ondule: [0.008, 12, 1.2] })),
    calli.arc(0, 0.78, 0.95, 0.16, Math.PI, 0)] },
  // Coeur couronne et miroir : le coeur renverse (« pareil a une flamme renversee »), la couronne,
  // le miroir ou le poete se voit (ici le titre)
  coeurCouronne: { nom: "Cœur couronne et miroir", famille: "apollinaire", parties: () => [
    ...[1, 0.68].map(k => calli.trait(t => { const [x, y] = calliCoeur(t * Math.PI * 2); return { x: 0.3 * k * x, y: -0.78 - 0.3 * k * y }; })),
    calli.ligne([[-0.4, -0.08], [-0.44, -0.42], [-0.22, -0.2], [0, -0.48], [0.22, -0.2], [0.44, -0.42], [0.4, -0.08]]),
    calli.ligne([[-0.42, -0.02], [0.42, -0.02]]),
    calli.arc(0, 0.52, 0.33, 0.44, -Math.PI / 2, Math.PI * 1.5), calli.arc(0, 0.52, 0.27, 0.37, -Math.PI / 2, Math.PI * 1.5),
    calli.ligne([[-0.22, 0.52], [0.22, 0.52]], { texte: "titre", droit: true, teinte: "accent", ech: 1.3 })] },
  // La cravate et la montre : la cravate a gauche, la montre a droite, a l'heure vraie
  cravateMontre: { nom: "La cravate et la montre", famille: "apollinaire", parties: () => [
    calli.plein([[[-0.80, -0.95], [-0.40, -0.95], [-0.50, -0.74], [-0.70, -0.74]], [[-0.69, -0.70], [-0.51, -0.70], [-0.36, 0.50], [-0.60, 0.82], [-0.84, 0.50]]]),
    calli.cercle(0.45, 0.15, 0.56), calli.cercle(0.45, 0.15, 0.46), calli.ligne([[0.40, -0.48], [0.50, -0.48]]),
    calli.ligne([[0.45, 0.11], [0.45, -0.13]], { texte: "rare", teinte: "accent", anime: () => calli.autour(calli.rz(calliHeure().h * Math.PI * 2), [0.45, 0.15, 0]) }),
    calli.ligne([[0.45, 0.11], [0.45, -0.25]], { texte: "titre", teinte: "accent", anime: () => calli.autour(calli.rz(calliHeure().mn * Math.PI * 2), [0.45, 0.15, 0]) })] },
  // Paysage : la maison, l'arbre, le personnage, le cigare qui fume
  paysage: { nom: "Paysage (maison, arbre, cigare, personnage)", famille: "apollinaire", fsMax: 0.04, parties: () => [
    calli.plein([[[-1.32, -0.3], [-0.825, -0.82], [-0.33, -0.3]]], { bord: "tout" }),
    calli.plein([calli.rect(-1.2, -0.26, -0.45, 0.35), calli.rect(-0.92, 0.02, -0.74, 0.35)]),
    calli.ligne([[-1.2, 0.35], [-1.2, -0.26], [-0.45, -0.26], [-0.45, 0.35]]),
    calli.plein([calli.ovale(0.9, -0.42, 0.42, 0.4, 48)], { anime: t => calli.autour(calli.rz(0.035 * Math.sin(t * 0.6)), [0.9, 0.75, 0]) }),
    calli.plein([calli.rect(0.84, 0.0, 0.96, 0.75)]),
    calli.cercle(0.15, -0.3, 0.1), calli.ligne([[0.15, -0.18], [0.15, 0.3]]), calli.ligne([[-0.08, -0.02], [0.38, -0.02]]),
    calli.ligne([[0.0, 0.74], [0.15, 0.32], [0.3, 0.74]]),
    calli.plein([calli.rect(-0.95, 0.62, -0.4, 0.76)]),
    calli.ligne([[-0.38, 0.58], [-0.3, 0.44], [-0.38, 0.3], [-0.28, 0.14]], { lisse: true, ondule: [0.02, 8, 1.1] })] },
  // Loin du pigeonnier : le colombier, et deux pigeons qui s'en vont
  pigeonnier: { nom: "Loin du pigeonnier", famille: "apollinaire", parties: () => [
    calli.plein([[[-0.52, -0.32], [0, -0.95], [0.52, -0.32]]]),
    calli.plein([calli.rect(-0.36, -0.28, 0.36, 0.92), calli.ovale(0, -0.02, 0.08, 0.11, 20), calli.ovale(-0.18, 0.38, 0.07, 0.09, 20), calli.ovale(0.18, 0.38, 0.07, 0.09, 20)]),
    calli.ligne(calli.poser(CALLI_COLOMBE_AILEE, 0.3, 0.98, -0.85), { lisse: true, ferme: true, anime: t => calli.autour(CALLI_ID, [0, 0, 0], [0.04 * Math.sin(t * 0.4), 0.03 * Math.sin(t * 0.7), 0]) }),
    calli.ligne(calli.poser(CALLI_COLOMBE_AILEE, 0.2, 0.66, -0.5), { lisse: true, ferme: true, anime: t => calli.autour(CALLI_ID, [0, 0, 0], [0.03 * Math.sin(t * 0.5 + 1), 0.025 * Math.sin(t * 0.8 + 2), 0]) })] },
  // La mandoline, l'oeillet et le bambou
  mandoline: { nom: "La mandoline, l'œillet et le bambou", famille: "apollinaire", parties: () => [
    calli.plein([calli.lisser([[-0.55, -0.15], [-0.30, 0.0], [-0.22, 0.35], [-0.35, 0.75], [-0.55, 0.88], [-0.75, 0.75], [-0.88, 0.35], [-0.80, 0.0]], true), calli.ovale(-0.55, 0.3, 0.1, 0.1, 24)]),
    calli.ligne([[-0.55, -0.95], [-0.55, -0.18]]),
    calli.ligne([[-0.62, -0.95], [-0.48, -0.95]]),
    calli.trait(t => { const a = -Math.PI / 2 + t * Math.PI * 2, r = 0.26 + 0.045 * Math.sin(a * 11); return { x: 0.12 + Math.cos(a) * r, y: -0.45 + Math.sin(a) * r }; }),
    calli.trait(t => { const a = -Math.PI / 2 + t * Math.PI * 2, r = 0.13 + 0.03 * Math.sin(a * 9); return { x: 0.12 + Math.cos(a) * r, y: -0.45 + Math.sin(a) * r }; }),
    calli.ligne([[0.12, 0.92], [0.08, 0.4], [0.12, -0.17]], { lisse: true }),
    calli.ligne([[0.09, 0.45], [-0.1, 0.3], [-0.22, 0.1]], { lisse: true }), calli.ligne([[0.1, 0.62], [0.3, 0.5], [0.4, 0.3]], { lisse: true }),
    ...[[-0.95, -0.58], [-0.53, -0.18], [-0.13, 0.22], [0.27, 0.62], [0.67, 0.95]].flatMap(([a, b]) => [calli.ligne([[0.68, a], [0.68, b]]), calli.ligne([[0.78, a], [0.78, b]])]),
    calli.ligne([[0.78, -0.56], [0.95, -0.7], [1.12, -0.72]], { lisse: true }), calli.ligne([[0.68, -0.16], [0.56, -0.28], [0.46, -0.3]], { lisse: true }),
    calli.ligne([[0.78, 0.24], [0.95, 0.12], [1.14, 0.14]], { lisse: true })] },
  // la Tour Eiffel, « Salut monde » au sommet
  eiffel: { nom: "Tour Eiffel (Salut monde)", famille: "apollinaire", parties: () => {
    const d = [[0.04, -0.45], [0.09, -0.05], [0.16, 0.0], [0.16, 0.04], [0.12, 0.04], [0.24, 0.42], [0.34, 0.45], [0.34, 0.5], [0.28, 0.5], [0.44, 0.80], [0.58, 0.98], [0.36, 0.98]];
    const arche = []; for (let i = 1; i < 16; i++) { const a = i / 16 * Math.PI; arche.push([0.36 * Math.cos(a), 0.98 - 0.3 * Math.sin(a)]); }
    const g = calli.miroir(d).reverse();
    return [calli.ligne([[0, -1.32], [0, -0.5]], { texte: "SALUT MONDE", droit: true, pasFixe: true, teinte: "accent", ech: 1.4 }),
      calli.plein([d.concat(arche, g)])];
  } },
  // La petite auto : la voiture, ses roues qui tournent, la route
  auto: { nom: "La petite auto", famille: "apollinaire", fsMax: 0.04, parties: () => {
    const passage = (cx, de, a) => { const out = []; for (let i = 0; i <= 14; i++) { const a2 = de + i / 14 * a; out.push([cx + 0.33 * Math.cos(a2), 0.25 + 0.33 * Math.sin(a2)]); } return out; };
    const corps = [[-1.2, 0.22], [-1.2, -0.05], [-0.82, -0.12], [-0.62, -0.55], [0.22, -0.55], [0.42, -0.14], [1.1, -0.08], [1.2, 0.05], [1.2, 0.22], [1.06, 0.22]]
      .concat(passage(0.72, 0, -Math.PI), [[-0.34, 0.22]], passage(-0.68, 0, -Math.PI), [[-1.02, 0.22]]);
    const roue = (cx, r) => calli.cercle(cx, 0.25, r, { anime: t => calli.autour(calli.rz(-t * 0.5), [cx, 0.25, 0]) });
    return [calli.plein([corps, calli.rect(-0.52, -0.45, -0.16, -0.18), calli.rect(-0.08, -0.45, 0.18, -0.18)], { bord: true }),
      roue(-0.68, 0.27), roue(-0.68, 0.12), roue(0.72, 0.27), roue(0.72, 0.12), calli.ligne([[-1.35, 0.62], [1.35, 0.62]])];
  } },
  // Lettre-Ocean : le texte rayonne autour d'un centre, comme les ondes de la T.S.F.
  lettreOcean: { nom: "Lettre-Océan", famille: "apollinaire", parties: () => [
    calli.cercle(0, 0, 0.36), calli.cercle(0, 0, 0.5),
    ...calliRayons(0, 0, 16, 0.6, 1.0, 0.84, { anime: t => calli.autour(calli.rz(t * 0.03)) }),
    calli.ligne([[-0.26, 0], [0.26, 0]], { texte: "titre", droit: true, teinte: "accent" })] },
  // Voyage : le nuage, l'oiseau, le train et sa fumee
  voyage: { nom: "Voyage (nuage, oiseau, train)", famille: "apollinaire", parties: () => [
    calli.plein([calli.lisser(calli.poser(CALLI_NUAGE, 0.42, -0.72, -0.62), true)], { anime: t => calli.autour(CALLI_ID, [0, 0, 0], [0.05 * Math.sin(t * 0.25), 0, 0]) }),
    calli.ligne(calli.poser(CALLI_COLOMBE_AILEE, 0.36, 0.75, -0.7), { lisse: true, ferme: true, anime: t => calli.autour(CALLI_ID, [0, 0, 0], [0, 0.03 * Math.sin(t * 0.7), 0]) }),
    calli.plein([[[-1.2, 0.75], [-1.2, 0.2], [-0.95, 0.2], [-0.95, 0.02], [-0.72, 0.02], [-0.72, 0.32], [-0.56, 0.32], [-0.56, 0.1], [-0.44, 0.1], [-0.44, 0.32], [-0.3, 0.32], [-0.3, 0.75]]]),
    calli.plein([calli.rect(-0.2, 0.36, 0.38, 0.75)]), calli.plein([calli.rect(0.48, 0.36, 1.06, 0.75)]),
    calli.ligne([[-1.3, 0.86], [1.2, 0.86]]),
    calli.ligne([[-0.5, 0.06], [-0.38, -0.12], [-0.12, -0.2], [0.2, -0.14], [0.55, -0.26]], { lisse: true, ondule: [0.025, 7, 1] })] },

  /* ---- les objets */
  chapeau: { nom: "Chapeau melon", famille: "objets", fsMax: 0.045, parties: () => {
    const dome = [[-0.6, -0.06]]; for (let i = 0; i <= 24; i++) { const a = Math.PI + i / 24 * Math.PI; dome.push([0.6 * Math.cos(a), -0.06 + 0.6 * Math.sin(a)]); } dome.push([0.6, -0.06]);
    return [calli.plein([dome]), calli.ligne([[-0.55, 0.05], [0.55, 0.05]], { texte: "titre", droit: true, teinte: "accent" }),
      calli.arc(0, 0.22, 1.05, 0.15, Math.PI, Math.PI * 3)];
  } },
  pipe: { nom: "Pipe", famille: "objets", parties: () => [
    calli.plein([calli.lisser([[-0.95, -0.35], [-0.5, -0.35], [-0.48, 0.0], [-0.58, 0.25], [-0.75, 0.3], [-0.9, 0.22], [-0.98, 0.0]], true)]),
    calli.ligne([[-0.5, -0.06], [0.1, -0.06], [0.6, -0.19], [1.0, -0.31]], { lisse: true }),
    calli.ligne([[-0.52, 0.06], [0.1, 0.05], [0.6, -0.08], [1.0, -0.2]], { lisse: true }),
    calli.ligne([[-0.8, -0.42], [-0.65, -0.6], [-0.82, -0.8], [-0.66, -1.0]], { lisse: true, ondule: [0.03, 7, 1.2] }),
    calli.ligne([[-0.62, -0.42], [-0.5, -0.62], [-0.62, -0.78], [-0.44, -0.96]], { lisse: true, ondule: [0.03, 8, 1.4, 2] })] },
  bateau: { nom: "Voilier", famille: "objets", anime: t => calli.autour(calli.rz(0.05 * Math.sin(t * 0.7)), [0, 0.6, 0], [0, 0.02 * Math.sin(t * 0.7 + 1), 0]), parties: () => [
    calli.plein([[[-1.05, 0.32], [1.05, 0.32], [0.75, 0.62], [-0.75, 0.62]]]),
    calli.ligne([[0, 0.28], [0, -0.98]]),
    calli.plein([[[0.06, -0.92], [0.06, 0.24], [0.82, 0.24]]]),
    calli.plein([[[-0.06, -0.78], [-0.06, 0.24], [-0.72, 0.24]]]),
    calli.trait(t => ({ x: -1.35 + t * 2.7, y: 0.76 + 0.03 * Math.sin(t * 22) }), { fixe: true, ondule: [0.02, 5, 0.9] }),
    calli.trait(t => ({ x: -1.35 + t * 2.7, y: 0.92 + 0.03 * Math.sin(t * 19 + 1) }), { fixe: true, ondule: [0.02, 5, 0.7, 1] })] },
  ancre: { nom: "Ancre", famille: "objets", anime: t => calli.autour(calli.rz(0.04 * Math.sin(t * 0.5)), [0, -0.95, 0]), parties: () => [
    calli.cercle(0, -0.8, 0.16), calli.ligne([[-0.42, -0.55], [0.42, -0.55]]),
    calli.ligne([[-0.05, -0.62], [-0.05, 0.8]]), calli.ligne([[0.05, -0.62], [0.05, 0.8]]),
    calli.arc(0, 0.2, 0.7, 0.66, Math.PI - 0.1, 0.1),
    calli.ligne([[-0.88, 0.1], [-0.7, 0.27], [-0.52, 0.1]]), calli.ligne([[0.52, 0.1], [0.7, 0.27], [0.88, 0.1]])] },
  cle: { nom: "Clé", famille: "objets", parties: () => [
    calli.cercle(-0.7, 0, 0.32), calli.cercle(-0.7, 0, 0.17),
    calli.ligne([[-0.38, -0.06], [0.98, -0.06]]), calli.ligne([[-0.38, 0.06], [0.98, 0.06]]),
    calli.ligne([[0.55, 0.06], [0.55, 0.42], [0.68, 0.42], [0.68, 0.28], [0.8, 0.28], [0.8, 0.42], [0.95, 0.42], [0.95, 0.06]])] },
  bouteille: { nom: "Bouteille", famille: "objets", parties: () => [
    calli.plein([[[-0.1, -1.0], [0.1, -1.0], [0.1, -0.45], [0.34, -0.18], [0.34, 0.95], [-0.34, 0.95], [-0.34, -0.18], [-0.1, -0.45]], calli.rect(-0.3, 0.12, 0.3, 0.42)]),
    calli.ligne([[-0.28, 0.27], [0.28, 0.27]], { texte: "titre", droit: true, teinte: "accent" })] },
  bougie: { nom: "Bougie", famille: "objets", parties: () => {
    const flamme = k => calli.trait(t => { const a = t * Math.PI * 2; return { x: 0.19 * k * Math.sin(a) * Math.pow(Math.sin(a / 2), 1.2), y: -0.52 - 0.34 * k * Math.cos(a) }; },
      { teinte: "accent", anime: t => calli.autour(calli.rz(0.07 * bruit(t * 1.7)), [0, -0.24, 0]) });
    return [flamme(1), flamme(0.6), calli.plein([calli.rect(-0.2, -0.2, 0.2, 0.92)]), calli.arc(0, 0.94, 0.5, 0.08, Math.PI, Math.PI * 3)];
  } },
  cloche: { nom: "Cloche", famille: "objets", anime: t => calli.autour(calli.rz(0.16 * Math.sin(t * 0.8)), [0, -0.94, 0]), parties: () => [
    calli.cercle(0, -0.94, 0.12),
    calli.plein([[[0, -0.8], [0.22, -0.78], [0.35, -0.62], [0.4, -0.3], [0.46, 0.05], [0.6, 0.35], [0.78, 0.5], [0.8, 0.6], [-0.8, 0.6], [-0.78, 0.5], [-0.6, 0.35], [-0.46, 0.05], [-0.4, -0.3], [-0.35, -0.62], [-0.22, -0.78]]]),
    calli.cercle(0, 0.76, 0.1, { anime: t => calli.autour(calli.rz(0.24 * Math.sin(t * 0.8 - 0.5)), [0, -0.94, 0]) })] },
  guitare: { nom: "Guitare", famille: "objets", parties: () => [
    calli.plein([calli.lisser([[0, -0.42], [0.25, -0.4], [0.36, -0.2], [0.28, 0.05], [0.45, 0.3], [0.48, 0.6], [0.3, 0.88], [0, 0.95], [-0.3, 0.88], [-0.48, 0.6], [-0.45, 0.3], [-0.28, 0.05], [-0.36, -0.2], [-0.25, -0.4]], true),
      calli.ovale(0, 0.12, 0.12, 0.12, 24)]),
    calli.ligne([[-0.05, -1.25], [-0.05, -0.45]]), calli.ligne([[0.05, -1.25], [0.05, -0.45]]),
    calli.plein([calli.rect(-0.12, -1.5, 0.12, -1.27)]), calli.ligne([[-0.18, 0.62], [0.18, 0.62]])] },
  maison: { nom: "Maison", famille: "objets", parties: () => [
    calli.plein([[[-0.9, -0.15], [0, -0.82], [0.9, -0.15]]]),
    calli.plein([[[0.42, -0.75], [0.58, -0.75], [0.58, -0.42], [0.42, -0.55]]]),
    calli.plein([calli.rect(-0.7, -0.12, 0.7, 0.85), calli.rect(-0.15, 0.35, 0.15, 0.85), calli.rect(-0.55, 0.05, -0.28, 0.3), calli.rect(0.28, 0.05, 0.55, 0.3)]),
    calli.ligne([[0.5, -0.8], [0.62, -0.95], [0.82, -1.0], [1.05, -1.1]], { lisse: true, ondule: [0.03, 7, 1] })] },
  main: { nom: "Main", famille: "objets", parties: () => [
    calli.ligne([[-0.32, 0.95], [-0.42, 0.32], [-0.62, -0.02], [-0.66, -0.12], [-0.58, -0.18], [-0.36, 0.08], [-0.26, -0.02], [-0.26, -0.64], [-0.18, -0.72], [-0.10, -0.64],
      [-0.04, -0.10], [-0.02, -0.76], [0.07, -0.84], [0.14, -0.72], [0.17, -0.10], [0.21, -0.62], [0.30, -0.68], [0.36, -0.55], [0.34, -0.06], [0.47, -0.30], [0.55, -0.33],
      [0.60, -0.22], [0.46, 0.12], [0.38, 0.45], [0.30, 0.95]], { lisse: true }),
    calli.ligne([[-0.28, 0.12], [-0.05, 0.22], [0.22, 0.16]], { lisse: true }), calli.ligne([[-0.24, 0.0], [0.02, 0.04], [0.3, -0.02]], { lisse: true }),
    calli.ligne([[-0.3, 0.02], [-0.22, 0.38], [-0.06, 0.62]], { lisse: true })] },
  profil: { nom: "Profil", famille: "objets", fsMax: 0.035, parties: () => [
    calli.plein([calli.lisser([[0.1, -1.0], [0.45, -0.95], [0.7, -0.7], [0.75, -0.35], [0.65, -0.05], [0.48, 0.2], [0.42, 0.95], [-0.15, 0.95], [-0.15, 0.55], [-0.26, 0.43],
      [-0.4, 0.38], [-0.44, 0.27], [-0.4, 0.2], [-0.47, 0.13], [-0.43, 0.07], [-0.48, 0.02], [-0.63, -0.05], [-0.5, -0.3], [-0.46, -0.42], [-0.44, -0.62], [-0.28, -0.9]], true, 6),
      calli.ovale(-0.32, -0.38, 0.07, 0.04, 16)], { bord: true })] },
  parapluie: { nom: "Parapluie", famille: "objets", parties: () => {
    const toile = []; for (let i = 0; i <= 28; i++) { const a = Math.PI + i / 28 * Math.PI; toile.push([Math.cos(a), 0.75 * Math.sin(a)]); }
    for (let k = 3; k >= 0; k--) for (let j = 1; j <= 8; j++) { const u = j / 8; toile.push([-1 + 0.5 * (k + 1 - u), -0.13 * Math.sin(Math.PI * u)]); }
    const manche = [[0, 0.0], [0, 0.72]]; for (let i = 1; i <= 10; i++) { const a = i / 10 * Math.PI; manche.push([-0.14 + 0.14 * Math.cos(a), 0.72 + 0.14 * Math.sin(a)]); }
    return [calli.plein([toile]), calli.ligne(manche), calli.ligne([[0, -0.75], [0, -0.92]])];
  } },
  tasse: { nom: "Tasse fumante", famille: "objets", parties: () => [
    calli.plein([calli.lisser([[-0.55, -0.25], [0.55, -0.25], [0.5, 0.2], [0.35, 0.45], [0, 0.52], [-0.35, 0.45], [-0.5, 0.2]], true)]),
    calli.arc(0.6, 0.05, 0.2, 0.2, -1.3, 1.3), calli.arc(0, 0.62, 0.85, 0.1, Math.PI, Math.PI * 3),
    ...[[-0.22, -0.28], [0.02, -0.3], [0.24, -0.28]].map(([x, y], i) => calli.ligne([[x, y], [x - 0.06, y - 0.25], [x + 0.04, y - 0.45], [x - 0.04, y - 0.65]], { lisse: true, ondule: [0.03, 9, 1.2, i * 2] }))] },
  livre: { nom: "Livre ouvert", famille: "objets", parties: () => {
    const page = [[-1.1, -0.5], [-0.8, -0.6], [-0.4, -0.62], [-0.04, -0.52], [-0.04, 0.6], [-0.4, 0.5], [-0.8, 0.48], [-1.1, 0.58]];
    return [calli.plein([page]), calli.plein([calli.miroir(page)]), calli.ligne([[0, -0.5], [0, 0.58]], { texte: "titre", teinte: "accent" }),
      calli.ligne([[-1.15, 0.66], [-0.6, 0.58], [0, 0.7], [0.6, 0.58], [1.15, 0.66]], { lisse: true })];
  } },
  ampoule: { nom: "Ampoule", famille: "objets", parties: () => [
    calli.ligne([[-0.22, 0.45], [-0.3, 0.2], [-0.5, -0.05], [-0.55, -0.35], [-0.4, -0.72], [0, -0.86], [0.4, -0.72], [0.55, -0.35], [0.5, -0.05], [0.3, 0.2], [0.22, 0.45]], { lisse: true }),
    calli.ligne([[-0.15, 0.35], [-0.15, -0.1], [-0.1, -0.3], [-0.05, -0.15], [0, -0.3], [0.05, -0.15], [0.1, -0.3], [0.15, -0.1], [0.15, 0.35]], { teinte: "accent" }),
    calli.plein([calli.rect(-0.24, 0.47, 0.24, 0.85)]), calli.ligne([[-0.1, 0.92], [0.1, 0.92]]),
    ...[-2.6, -2.1, -1.57, -1.05, -0.55].map(a => calli.ligne([[Math.cos(a) * 0.72, -0.32 + Math.sin(a) * 0.72], [Math.cos(a) * 0.95, -0.32 + Math.sin(a) * 0.95]], { teinte: "accent" }))] },

  /* ---- la nature */
  colombe: { nom: "Colombe", famille: "nature", fsMax: 0.04, anime: t => calli.autour(CALLI_ID, [0, 0, 0], [0, 0.03 * Math.sin(t * 0.6), 0]), parties: () => [
    calli.plein([calli.lisser(CALLI_COLOMBE, true)], { bord: true }),
    calli.plein([calli.lisser(CALLI_AILE, true)], { bord: true, anime: t => calli.autour(calli.rx(0.5 * Math.sin(t * 1.0)), [0, -0.2, 0], [0, 0.03 * Math.sin(t * 0.6), 0]) })] },
  oiseau: { nom: "Hirondelle", famille: "nature", fsMax: 0.035, parties: () => {
    const aile = [[-0.12, -0.2], [-0.55, -0.42], [-1.25, -0.15], [-0.62, -0.06], [-0.3, 0.05], [-0.12, 0.08]];
    const bat = s => t => calli.autour(calli.ry(s * 0.6 * Math.sin(t * 1.3)), [s * 0.12, 0, 0]);
    return [calli.plein([calli.lisser([[0, -0.55], [0.11, -0.48], [0.12, -0.32], [0.14, 0.0], [0.1, 0.3], [0, 0.36], [-0.1, 0.3], [-0.14, 0.0], [-0.12, -0.32], [-0.11, -0.48]], true)], { bord: true }),
      calli.plein([[[-0.08, 0.34], [-0.3, 0.95], [-0.11, 0.62], [0, 0.5], [0.11, 0.62], [0.3, 0.95], [0.08, 0.34]]], { bord: "tout" }),
      calli.plein([calli.lisser(aile, true, 6)], { bord: true, anime: bat(-1) }), calli.plein([calli.lisser(calli.miroir(aile), true, 6)], { bord: true, anime: bat(1) })];
  } },
  papillon: { nom: "Papillon", famille: "nature", fsMax: 0.04, parties: () => {
    const haut = [[0.05, -0.12], [0.3, -0.65], [0.7, -0.88], [1.05, -0.75], [1.0, -0.35], [0.6, -0.08], [0.06, 0.0]];
    const bas = [[0.06, 0.04], [0.55, 0.06], [0.82, 0.35], [0.7, 0.72], [0.38, 0.78], [0.12, 0.45]];
    const bat = s => t => calli.autour(calli.ry(s * 0.8 * (0.5 - 0.5 * Math.cos(t * 1.1))), [0, 0, 0]);
    return [calli.plein([calli.lisser(haut, true)], { bord: true, anime: bat(-1) }), calli.plein([calli.lisser(bas, true)], { bord: true, anime: bat(-1) }),
      calli.plein([calli.lisser(calli.miroir(haut), true)], { bord: true, anime: bat(1) }), calli.plein([calli.lisser(calli.miroir(bas), true)], { bord: true, anime: bat(1) }),
      calli.ligne([[0, -0.42], [0, 0.55]], { teinte: "accent" }),
      calli.ligne([[-0.03, -0.44], [-0.15, -0.74], [-0.3, -0.88]], { lisse: true }), calli.ligne([[0.03, -0.44], [0.15, -0.74], [0.3, -0.88]], { lisse: true })];
  } },
  poisson: { nom: "Poisson", famille: "nature", fsMax: 0.04, anime: t => calli.autour(calli.rz(0.04 * Math.sin(t * 0.5)), [0, 0, 0], [0, 0.03 * Math.sin(t * 0.4), 0]), parties: () => [
    calli.plein([calli.lisser([[-1.0, 0.0], [-0.75, -0.3], [-0.25, -0.46], [0.25, -0.36], [0.62, -0.1], [0.62, 0.1], [0.25, 0.36], [-0.25, 0.44], [-0.75, 0.3]], true), calli.ovale(-0.68, -0.08, 0.06, 0.06, 16)], { bord: true }),
    calli.plein([[[0.58, 0], [1.08, -0.48], [0.95, 0], [1.08, 0.48]]], { bord: "tout", anime: t => calli.autour(calli.mul(calli.rz(0.04 * Math.sin(t * 0.5)), calli.ry(0.6 * Math.sin(t * 1.4))), [0.6, 0, 0], [0, 0.03 * Math.sin(t * 0.4), 0]) }),
    calli.plein([[[-0.2, -0.42], [0.05, -0.74], [0.25, -0.35]]])] },
  escargot: { nom: "Escargot", famille: "nature", parties: () => [
    calli.trait(t => { const a = Math.PI / 2 - t * Math.PI * 2 * 3.1, r = 0.66 * (1 - t * 0.9); return { x: 0.15 + Math.cos(a) * r, y: -0.2 + Math.sin(a) * r }; }),
    calli.plein([[[0.95, 0.62], [0.75, 0.5], [-0.55, 0.5], [-0.78, 0.28], [-0.92, 0.04], [-1.04, 0.1], [-0.98, 0.4], [-0.85, 0.62]]]),
    calli.ligne([[-0.9, 0.06], [-1.02, -0.2], [-1.08, -0.42]], { lisse: true, anime: t => calli.autour(calli.rz(0.1 * Math.sin(t * 0.7)), [-0.9, 0.06, 0]) }),
    calli.ligne([[-0.97, 0.08], [-1.2, -0.12], [-1.34, -0.26]], { lisse: true, anime: t => calli.autour(calli.rz(0.12 * Math.sin(t * 0.6 + 1)), [-0.97, 0.08, 0]) })] },
  coquillage: { nom: "Coquille Saint-Jacques", famille: "nature", parties: () => {
    const out = [calli.trait(t => { const a = -Math.PI * 5 / 6 + t * Math.PI * 2 / 3, r = 1.25 + 0.05 * Math.cos(a * 27); return { x: Math.cos(a) * r, y: 0.72 + Math.sin(a) * r }; })];
    for (let i = 0; i < 9; i++) { const a = -Math.PI * 5 / 6 + i / 8 * Math.PI * 2 / 3; out.push(calli.ligne([[Math.cos(a) * 0.2, 0.72 + Math.sin(a) * 0.2], [Math.cos(a) * 1.15, 0.72 + Math.sin(a) * 1.15]])); }
    out.push(calli.plein([[[-0.42, 0.62], [0.42, 0.62], [0.3, 0.92], [-0.3, 0.92]]]));
    return out;
  } },
  fleur: { nom: "Fleur", famille: "nature", anime: t => calli.autour(calli.rz(0.05 * Math.sin(t * 0.5)), [0, 0.95, 0]), parties: () => {
    const out = [calli.plein([calli.ovale(0, -0.3, 0.15, 0.15, 30)], { teinte: "accent" })];
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 - Math.PI / 2; out.push(calli.ligne(calli.poser(calli.ovale(0, 0, 0.25, 0.1, 30), 1, Math.cos(a) * 0.42, -0.3 + Math.sin(a) * 0.42, a), { ferme: true })); }
    out.push(calli.ligne([[0, -0.12], [0.04, 0.4], [-0.02, 0.95]], { lisse: true }));
    out.push(calli.plein([calli.lisser([[0.03, 0.52], [0.3, 0.36], [0.55, 0.38], [0.32, 0.56]], true)]), calli.plein([calli.lisser([[0.0, 0.7], [-0.28, 0.54], [-0.52, 0.56], [-0.3, 0.74]], true)]));
    return out;
  } },
  arbre: { nom: "Arbre", famille: "nature", parties: () => {
    const cime = []; for (let i = 0; i < 64; i++) { const a = i / 64 * Math.PI * 2, r = 0.6 + 0.07 * Math.sin(a * 6) + 0.03 * Math.sin(a * 11); cime.push([Math.cos(a) * r * 1.08, -0.36 + Math.sin(a) * r]); }
    return [calli.plein([cime], { bord: true, anime: t => calli.autour(calli.rz(0.03 * Math.sin(t * 0.6)), [0, 0.22, 0]) }),
      calli.plein([[[-0.09, 0.26], [0.09, 0.26], [0.11, 0.72], [0.34, 0.95], [-0.34, 0.95], [-0.11, 0.72]]])];
  } },
  feuille: { nom: "Feuille", famille: "nature", parties: () => {
    const P = (u, cote) => { const w = 0.5 * Math.pow(Math.sin(Math.PI * u), 0.85) * (1 - 0.25 * u); return [cote * w, 0.8 - 1.6 * u]; };
    const tourne = pts => calli.poser(pts, 1, 0, 0, 0.45);
    const bord = []; for (let i = 0; i <= 30; i++) bord.push(P(i / 30, 1)); for (let i = 29; i >= 1; i--) bord.push(P(i / 30, -1));
    const out = [calli.ligne(tourne(bord), { ferme: true }), calli.ligne(tourne([[0, 0.8], [0, -0.78]]))];
    for (const u of [0.22, 0.38, 0.54, 0.7]) for (const c of [-1, 1]) { const e = P(u + 0.12, c); out.push(calli.ligne(tourne([[0, 0.8 - 1.6 * u], [e[0] * 0.85, e[1]]]))); }
    out.push(calli.ligne(tourne([[0, 0.8], [0.04, 1.05], [0.12, 1.2]]), { lisse: true }));
    return out;
  } },
  plume: { nom: "Plume", famille: "nature", parties: () => {
    const B = s => { const u = 1 - s; return [u * u * 0.3 + 2 * u * s * 0.38 + s * s * -0.25, u * u * 0.95 + 2 * u * s * -0.2 + s * s * -0.95]; };
    const out = [calli.ligne(Array.from({ length: 21 }, (_, i) => B(i / 20)), { ech: 0.9 })];
    for (let k = 0; k < 15; k++) {
      const s = 0.14 + k * 0.058, p = B(s), q = B(s + 0.01), dx = q[0] - p[0], dy = q[1] - p[1], dl = Math.hypot(dx, dy), tx = dx / dl, ty = dy / dl;
      const l = 0.36 * Math.pow(Math.sin(Math.PI * Math.min(1, (s - 0.08) / 0.92)), 0.7);
      for (const c of [-1, 1]) { const b = 1.0, ax = tx * Math.cos(b) - c * ty * Math.sin(b), ay = ty * Math.cos(b) + c * tx * Math.sin(b), L = l * (c < 0 ? 1.1 : 0.9); out.push(calli.ligne([p, [p[0] + ax * L, p[1] + ay * L]])); }
    }
    return out;
  } },
  soleil: { nom: "Soleil rayonnant", famille: "nature", parties: () => [
    calli.plein([calli.ovale(0, 0, 0.42, 0.42, 48)]),
    ...calliRayons(0, 0, 18, 0.52, 1.0, 0.86, { anime: t => calli.autour(calli.rz(t * 0.04)), onduleImpair: [0.025, 14, 1.2] })] },
  nuage: { nom: "Nuage", famille: "nature", anime: t => calli.autour(CALLI_ID, [0, 0, 0], [0.04 * Math.sin(t * 0.3), 0, 0]), parties: () => [
    calli.plein([calli.lisser(CALLI_NUAGE, true)], { bord: true }),
    calli.ligne([[-0.9, 0.48], [-0.2, 0.46], [0.5, 0.5]], { lisse: true, ondule: [0.015, 6, 0.6] }), calli.ligne([[-0.4, 0.62], [0.3, 0.6], [0.95, 0.64]], { lisse: true, ondule: [0.015, 6, 0.5, 1] })] },
  eclair: { nom: "Éclair", famille: "nature", parties: () => [
    calli.plein([calli.lisser(calli.poser(CALLI_NUAGE, 0.62, 0, -0.62), true)], { bord: true }),
    calli.plein([[[0.12, -0.38], [-0.35, 0.25], [-0.04, 0.25], [-0.22, 0.98], [0.42, 0.05], [0.08, 0.05], [0.32, -0.38]]], { teinte: "accent", clignote: true })] },
  arcenciel: { nom: "Arc-en-ciel", famille: "nature", parties: () => [
    ...[0, 28, 52, 120, 195, 235, 280].map((h, k) => calli.arc(0, 0.5, 1.15 - k * 0.1, 1.15 - k * 0.1, Math.PI, Math.PI * 2, { teinte: h })),
    calli.plein([calli.lisser(calli.poser(CALLI_NUAGE, 0.36, -1.0, 0.56), true)]), calli.plein([calli.lisser(calli.poser(CALLI_NUAGE, 0.36, 1.0, 0.56), true)])] },
  montagne: { nom: "Montagnes", famille: "nature", parties: () => {
    const neige = [[-0.1, -0.85], [-0.33, -0.45], [-0.2, -0.5], [-0.1, -0.4], [0.02, -0.52], [0.14, -0.46]];
    return [calli.plein([neige], { teinte: "accent" }),
      calli.plein([[[-1.25, 0.75], [-0.65, -0.15], [-0.45, -0.05], [-0.1, -0.85], [0.38, -0.05], [0.55, -0.22], [0.75, -0.38], [1.3, 0.75]], neige]),
      calli.cercle(0.95, -0.72, 0.18, { teinte: "accent" })];
  } },
  deferlante: { nom: "La grande vague", famille: "nature", parties: () => {
    const profil = [[-1.3, 0.75], [-0.95, 0.5], [-0.6, 0.1], [-0.3, -0.38], [0.05, -0.72], [0.45, -0.85], [0.8, -0.7], [0.9, -0.38], [0.75, -0.12], [0.5, -0.1], [0.36, -0.28], [0.44, -0.46], [0.62, -0.45], [0.66, -0.32]];
    const out = [calli.ligne(profil, { lisse: true })];
    for (let k = 1; k <= 4; k++) out.push(calli.ligne(profil.slice(0, 6).map(p => [p[0] + 0.07 * k, p[1] + 0.17 * k]), { lisse: true }));
    for (const [x, y] of [[0.3, -0.86], [0.6, -0.86], [0.86, -0.6]]) out.push(calli.ligne([[x, y], [x + 0.12, y - 0.1], [x + 0.2, y - 0.02]], { lisse: true, teinte: "note" }));
    out.push(calli.ligne([[0.75, 0.75], [1.0, 0.45], [1.1, 0.45], [1.36, 0.75]]));
    out.push(calli.trait(t => ({ x: -1.3 + t * 2.66, y: 0.88 + 0.03 * Math.sin(t * 25) }), { ondule: [0.02, 5, 0.8] }));
    return out;
  } },
  cheval: { nom: "Cheval", famille: "nature", fsMax: 0.03, parties: () => [
    calli.plein([CALLI_CHEVAL, calli.ovale(-0.82, -0.52, 0.05, 0.035, 14)], { bord: true }),
    calli.ligne([[-0.62, -0.88], [-0.44, -0.78], [-0.24, -0.53], [-0.06, -0.3]], { lisse: true, teinte: "accent", ondule: [0.02, 10, 1] })] },

  /* ---- les volumes, en 3D */
  sphere: { nom: "Sphère", famille: "volumes", volume: true, inclinaison: 0.3, parties: () => [-1.15, -0.86, -0.57, -0.29, 0, 0.29, 0.57, 0.86, 1.15].map(f => calli.trait(t => {
    const a = -Math.PI + t * Math.PI * 2, r = Math.cos(f); return { x: r * Math.cos(a), y: Math.sin(f), z: r * Math.sin(a) };
  })) },
  globe: { nom: "Globe aux méridiens", famille: "volumes", volume: true, inclinaison: 0.38, parties: () => [
    calli.trait(t => { const a = -Math.PI + t * Math.PI * 2; return { x: Math.cos(a), y: 0, z: Math.sin(a) }; }, { ech: 1.15, teinte: "accent" }),
    ...Array.from({ length: 8 }, (_, i) => calli.trait(t => { const l = i / 8 * Math.PI * 2, f = -Math.PI / 2 * 0.9 + t * Math.PI * 0.9; return { x: Math.cos(f) * Math.cos(l), y: Math.sin(f), z: Math.cos(f) * Math.sin(l) }; })),
    ...[-0.62, 0.62].map(f => calli.trait(t => { const a = -Math.PI + t * Math.PI * 2, r = Math.cos(f); return { x: r * Math.cos(a), y: Math.sin(f), z: r * Math.sin(a) }; }))] },
  tore: { nom: "Tore", famille: "volumes", volume: true, inclinaison: 0.75, parties: () => Array.from({ length: 8 }, (_, k) => {
    const v = -Math.PI / 2 + k / 8 * Math.PI * 2;
    return calli.trait(t => { const u = -Math.PI + t * Math.PI * 2, r = 0.68 + 0.32 * Math.cos(v); return { x: r * Math.cos(u), y: 0.32 * Math.sin(v), z: r * Math.sin(u) }; },
      { n: t => { const u = -Math.PI + t * Math.PI * 2; return [Math.cos(v) * Math.cos(u), Math.sin(v), Math.cos(v) * Math.sin(u)]; } });
  }) },
  colonne: { nom: "Colonne (à la Trajane)", famille: "volumes", volume: true, inclinaison: 0.12, parties: () => [
    calli.trait(t => { const a = -Math.PI + t * Math.PI * 2; return { x: 0.55 * Math.cos(a), y: -1.0, z: 0.55 * Math.sin(a) }; }, { teinte: "accent" }),
    calli.trait(t => { const a = -Math.PI + t * Math.PI * 2 * 7; return { x: 0.42 * Math.cos(a), y: -0.9 + 1.8 * t, z: 0.42 * Math.sin(a) }; }),
    calli.trait(t => { const a = -Math.PI + t * Math.PI * 2; return { x: 0.55 * Math.cos(a), y: 1.0, z: 0.55 * Math.sin(a) }; }, { teinte: "accent" })] },
  cone: { nom: "Cône", famille: "volumes", volume: true, inclinaison: 0.32, parties: () => Array.from({ length: 9 }, (_, k) => {
    const y = -0.8 + k * 0.2, r = 0.06 + 0.84 * (y + 0.9) / 1.8;
    return calli.trait(t => { const a = -Math.PI + t * Math.PI * 2; return { x: r * Math.cos(a), y, z: r * Math.sin(a) }; }, { n: t => { const a = -Math.PI + t * Math.PI * 2; return [Math.cos(a), -0.45, Math.sin(a)]; } });
  }) },
  spiraleMontante: { nom: "Spirale qui monte", famille: "volumes", volume: true, inclinaison: 0.28, parties: () => [
    calli.trait(t => { const a = -Math.PI + t * Math.PI * 2 * 6, r = 0.12 + 0.82 * Math.pow(t, 1.2); return { x: r * Math.cos(a), y: 0.95 - 1.9 * t, z: r * Math.sin(a) }; })] },
  helice: { nom: "Double hélice", famille: "volumes", volume: true, inclinaison: 0.15, parties: () => {
    const brin = d => t => { const a = d + t * Math.PI * 2 * 2.5; return { x: 0.45 * Math.cos(a), y: -1 + 2 * t, z: 0.45 * Math.sin(a) }; };
    const out = [calli.trait(brin(0)), calli.trait(brin(Math.PI))];
    for (let k = 1; k < 12; k++) { const t = k / 12, a = brin(0)(t), b = brin(Math.PI)(t); out.push(calli.ligne([[a.x, a.y, a.z], [b.x, b.y, b.z]], { teinte: "note", n: () => [0, 0, -1] })); }
    return out;
  } },
  ruban: { nom: "Ruban de Möbius", famille: "volumes", volume: true, inclinaison: 0.6, parties: () => {
    const p = (u, w) => [(1 + w * Math.cos(u / 2)) * Math.cos(u) * 0.85, w * Math.sin(u / 2) * 0.85, (1 + w * Math.cos(u / 2)) * Math.sin(u) * 0.85];
    const bord = (w, tours) => calli.trait(t => { const q = p(t * Math.PI * 2 * tours, w); return { x: q[0], y: q[1], z: q[2] }; }, { n: t => calli.normale(p, t * Math.PI * 2 * tours, w) });
    const barreaux = [];
    for (let k = 0; k < 14; k++) { const u = k / 14 * Math.PI * 2, a = p(u, -0.5), b = p(u, 0.5); barreaux.push(calli.ligne([a, b], { teinte: "note", n: () => calli.normale(p, u, 0) })); }
    return [bord(0, 1), bord(0.5, 2)].concat(barreaux);
  } },
  cube: { nom: "Cube", famille: "volumes", volume: true, inclinaison: 0.5, parties: () => {
    const c = 0.6, S8 = [[-c, -c, -c], [c, -c, -c], [c, -c, c], [-c, -c, c], [-c, c, -c], [c, c, -c], [c, c, c], [-c, c, c]];
    const A = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
    return A.map(([a, b]) => { const m = calliNorm([(S8[a][0] + S8[b][0]) / 2, (S8[a][1] + S8[b][1]) / 2, (S8[a][2] + S8[b][2]) / 2]); return calli.ligne([S8[a], S8[b]], { n: () => m }); });
  } },
  pyramide: { nom: "Pyramide", famille: "volumes", volume: true, inclinaison: 0.3, parties: () => {
    const c = 0.72, h = [0, -0.9, 0], B4 = [[-c, 0.6, -c], [c, 0.6, -c], [c, 0.6, c], [-c, 0.6, c]];
    const mil = (a, b) => calliNorm([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 0.1, (a[2] + b[2]) / 2]);
    return B4.map((p, i) => { const q = B4[(i + 1) % 4], m = mil(p, q); return calli.ligne([p, q], { n: () => m }); })
      .concat(B4.map(p => { const m = mil(p, h); return calli.ligne([p, h], { n: () => m }); }));
  } },
  coeur3d: { nom: "Cœur en volume", famille: "volumes", volume: true, inclinaison: 0.08, parties: () => [0, -0.18, 0.18, -0.34, 0.34, -0.46, 0.46].map(z => {
    const s = Math.sqrt(Math.max(0.05, 1 - Math.pow(z / 0.52, 2)));
    return calli.trait(t => { const [x, y] = calliCoeur(t * Math.PI * 2); return { x: x * s, y: y * s + 0.1, z }; }, { n: t => { const [x, y] = calliCoeur(t * Math.PI * 2); return [x, y, z * 2.2]; } });
  }) },
  fleur3d: { nom: "Fleur qui s'ouvre", famille: "volumes", volume: true, inclinaison: 0.55, parties: () => {
    const petale = calli.lisser([[0, 0], [-0.22, -0.25], [-0.2, -0.6], [0, -0.82], [0.2, -0.6], [0.22, -0.25]], true, 8);
    const out = [];
    for (const [n, k, dec, ouvre] of [[6, 1, 0, 1.25], [6, 0.62, Math.PI / 6, 0.8]]) for (let i = 0; i < n; i++) {
      const phi = dec + i / n * Math.PI * 2;
      out.push(calli.ligne(petale.map(p => [p[0] * k, p[1] * k]), { n: () => [0, 0, -1], anime: (t, sc) => {
        const m = calli.mul(calli.ry(phi), calli.rx(0.1 + ouvre * sc.ouverture));
        return calli.autour(m, [0, 0, 0], calli.app(calli.ry(phi), [0, 0, -0.1]));
      } }));
    }
    out.push(calli.trait(t => { const a = -Math.PI + t * Math.PI * 2; return { x: 0.1 * Math.cos(a), y: 0, z: 0.1 * Math.sin(a) }; }, { texte: "titre", teinte: "accent", repeter: true }));
    out.push(calli.ligne([[0, 0.05, 0], [0, 1.0, 0]], { n: () => [0, 0, -1] }));
    return out;
  } },
  armillaire: { nom: "Sphère armillaire", famille: "volumes", volume: true, inclinaison: 0.35, parties: () => {
    const anneau = (M, o) => calli.trait(t => { const a = -Math.PI + t * Math.PI * 2, q = calli.app(M, [Math.cos(a), 0, Math.sin(a)]); return { x: q[0], y: q[1], z: q[2] }; },
      Object.assign({ n: t => { const a = -Math.PI + t * Math.PI * 2; return calli.app(M, [Math.cos(a), 0, Math.sin(a)]); } }, o));
    return [anneau(CALLI_ID, { teinte: "accent" }), anneau(calli.rx(Math.PI / 2)), anneau(calli.rz(0.41), { anime: t => calli.autour(calli.ry(t * 0.25)) }),
      anneau(calli.mul(calli.rz(Math.PI / 2), calli.rx(Math.PI / 2)), { ech: 0.9, anime: t => calli.autour(calli.ry(-t * 0.15)) }),
      calli.ligne([[-0.3, 0], [0.3, 0]], { texte: "titre", droit: true, teinte: "accent", fixe: true })];
  } },
};

/* ---------------------------------------------------- le choix de la forme */

const CALLI_FAMILLES = { apollinaire: "Apollinaire", objets: "les objets", nature: "la nature", volumes: "en 3D (les volumes)", plats: "à plat (sans les volumes)" };
const calliSacs = {};
let calliDerniere = null;
// une forme precise, ou une famille (Au hasard : toutes). Dans une famille, chaque forme passe une
// fois avant de revenir, et jamais deux fois de suite.
function calliChoisir() {
  const v = S.calligramme;
  if (CALLIGRAMMES[v]) return v;
  const fam = CALLI_FAMILLES[v] ? v : "hasard";
  const cles = Object.keys(CALLIGRAMMES).filter(k => fam === "hasard" || (fam === "plats" ? !CALLIGRAMMES[k].volume : CALLIGRAMMES[k].famille === fam));
  let sac = calliSacs[fam];
  if (!sac || !sac.length) sac = calliSacs[fam] = cles.slice().sort(() => Math.random() - 0.5);
  let k = sac.pop();
  if (k === calliDerniere && sac.length) { sac.unshift(k); k = sac.pop(); }
  calliDerniere = k;
  return k;
}

/* ---------------------------------------------------- la scene */

const calliTampon = {};
// le plus de lettres dans un dessin (poeme et echo) : 1100 lettres coutaient 7 a 8,5 ms par image
// (mesure du 2026-10-19), 950 lettres 6 a 9,7 ; le budget d'une scene est 8
const CALLI_LETTRES = 800;
class SceneCalligramme {
  constructor(poeme) {
    this.poeme = poeme; this.t = 0; this.phase = "entree";
    this.cle = calliChoisir();
    this.forme = CALLIGRAMMES[this.cle];
    this.volume = !!this.forme.volume;
    // bord : une surface recoit aussi son contour, ecrit avant elle (une silhouette remplie de
    // lignes se lit mal seule : le trait du bord dessine la forme)
    this.parties = [];
    for (const p of this.forme.parties()) {
      if (p.type === "plein" && p.bord) for (const poly of p.polys) if (poly.length > 6 || p.bord === "tout")
        this.parties.push(calli.ligne(poly, { ferme: true, anime: p.anime, fixe: p.fixe, teinte: p.teinte, ech: 0.85 }));
      this.parties.push(p);
    }
    this.rot = hasard(-0.6, 0.6); this.phi = hasard(0, 6.3); this.ouverture = 0;
    // le texte : les vers bout a bout, chacun garde son poete pour sa couleur
    const vers = versDe(poeme), lettres = [];
    this.vers = vers;
    vers.forEach((v, i) => {
      const t = casse(v.texte) + (i < vers.length - 1 ? "   " : "");
      let mot = -1, dansMot = false;
      for (const c of t) {
        if (c.trim() && !dansMot) { mot++; dansMot = true; } else if (!c.trim()) dansMot = false;
        lettres.push({ c, poete: v.poete, w: calliLarg(c), vers: i, mot: c.trim() ? mot : -1 });
      }
    });
    this.cadrer();
    this.placer(lettres);
    // les lettres arrivent de partout et se posent sur la forme (ou tombent en place) ; a la fin,
    // la pluie, le vent ou l'eclat
    this.arrivee = Math.random() < 0.7 ? "rassemblement" : "plume";
    this.depart = tirer(["pluie", "vent", "eclat"]);
    // la cadence : le poeme s'ecrit dans la moitie de sa tenue, et tient dans poemeMax (Jiiji le
    // regle a 20 s : le poeme etait coupe avant d'etre ecrit)
    const n = Math.max(1, this.nPoeme), vit = Math.max(0.02, S.vitesse * ((typeof live !== "undefined" && live.vitesse) || 1));
    let cadence = clamp(n / Math.max(4, tenue() * 0.45), 18, 140);
    if (S.poemeMax < 600) cadence = Math.max(cadence, n / Math.max(2, S.poemeMax * 0.42 * vit));
    this.cadence = cadence;
    let fin = 0, e = 0, f = 0;
    for (const l of this.lettres) {
      if (l.fixe) l.tArr = n / cadence * 0.55 + (f++) * 0.06;
      else if (l.echo) l.tArr = n / cadence + (e++) / (cadence * 2.5);
      else l.tArr = l.ordre / cadence;
      fin = Math.max(fin, l.tArr);
    }
    this.dureeEntree = fin + (this.arrivee === "rassemblement" ? 1.6 : 1);
    this.debutSortie = this.dureeEntree + tenue();
    if (S.poemeMax < 600) this.debutSortie = Math.max(this.dureeEntree + 1, Math.min(this.debutSortie, (S.poemeMax - 4) * vit));
    // la derive facon economiseur d'ecran
    this.cx = W / 2; this.cy = H / 2;
    const v = Math.min(W, H) * 0.035;
    this.vx = v * (Math.random() < 0.5 ? -1 : 1); this.vy = v * 0.7 * (Math.random() < 0.5 ? -1 : 1);
    this.tri = this.lettres.slice();
    this.versDits = new Set();
    montrerCartel(null);
  }
  // l'echelle : la forme remplit l'ecran sans en sortir, recentree
  cadrer() {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, r3 = 0;
    const ext = (x, y, z) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); r3 = Math.max(r3, Math.hypot(x, y, z || 0)); };
    for (const p of this.parties) {
      if (p.type === "plein") { for (const poly of p.polys) for (const q of poly) ext(q[0], q[1], 0); }
      else for (let i = 0; i <= 160; i++) { const q = p.f(i / 160); ext(q.x, q.y, q.z); }
    }
    const k = clamp(S.taille, 0.4, 1), Hu = H - (S.bourse ? 30 : 0);
    if (this.volume) {
      this.ox = 0; this.oy = 0;
      const e = r3 * 1.12;
      this.R = Math.min(Hu * 0.44 * k / e, W * 0.44 * k / e); this.Rz = r3;
    } else {
      this.ox = (x0 + x1) / 2; this.oy = (y0 + y1) / 2;
      const hx = Math.max(0.2, (x1 - x0) / 2), hy = Math.max(0.2, (y1 - y0) / 2);
      // 0,4 et pas 0,45 : en basculant, le cote proche grossit d'un dixieme (la cle debordait)
      this.R = Math.min(Hu * 0.41 * k / hy, W * 0.4 * k / hx); this.Rz = Math.max(hx, hy);
    }
  }
  echantillonner(p) {
    const R = this.R, pts = [];
    let L = 0;
    for (let i = 0; i <= 400; i++) {
      const t = i / 400, q = p.f(t), pt = { x: (q.x - this.ox) * R, y: (q.y - this.oy) * R, z: (q.z || 0) * R, t };
      if (i) { const a = pts[i - 1]; L += Math.hypot(pt.x - a.x, pt.y - a.y, pt.z - a.z); }
      pt.s = L; pts.push(pt);
    }
    return { pts, L };
  }
  // les lignes d'une surface : chaque ligne horizontale coupe les polygones (pair-impair)
  lignesPlein(p, fl) {
    const R = this.R, polys = p.polys.map(poly => poly.map(q => [(q[0] - this.ox) * R, (q[1] - this.oy) * R]));
    let y0 = Infinity, y1 = -Infinity;
    for (const poly of polys) for (const q of poly) { y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
    const pas = fl * 1.18, out = [];
    for (let y = y0 + pas * 0.55; y <= y1 - pas * 0.4; y += pas) {
      const xs = [];
      for (const poly of polys) for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length];
        if ((a[1] <= y) !== (b[1] <= y)) xs.push(a[0] + (y - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
      }
      xs.sort((u, v) => u - v);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const xa = xs[k] + fl * 0.2, xb = xs[k + 1] - fl * 0.2;
        if (xb - xa > fl * 1.7) out.push({ pts: [{ x: xa, y, z: 0, s: 0, t: 0 }, { x: xb, y, z: 0, s: xb - xa, t: 1 }], L: xb - xa });
      }
    }
    return out;
  }
  // le texte coule d'un trace au suivant ; dans les surfaces, un mot passe entier a la ligne et une
  // ligne ne commence pas par un blanc. Au-dela du poeme, il recommence en echo pour finir le
  // dessin, jusqu'a limite lettres en tout (0 : pas d'echo)
  disposer(fs, lettres, limite) {
    const traits = [];
    this.parties.forEach((p, pi) => {
      if (p.texte) return;
      const fl = fs * (p.ech || 1);
      if (p.type === "plein") for (const seg of this.lignesPlein(p, fl)) traits.push({ p: pi, fl, plein: true, pts: seg.pts, L: seg.L, rempli: 0 });
      else traits.push({ p: pi, fl, pts: this.ech[pi].pts, L: this.ech[pi].L, rempli: 0 });
    });
    const total = lettres.length, out = [];
    let ti = 0, s = 0, j = 1, n = 0, i = 0;
    while (ti < traits.length && total) {
      if (i >= total && out.length >= limite) break;
      const L = lettres[i % total], tr = traits[ti], part = this.parties[tr.p], fl = tr.fl;
      const pas = part.pasFixe ? fl * 0.95 : L.w * fl;
      if (tr.plein) {
        if (s > 0 && L.c !== " " && (i % total === 0 || lettres[(i - 1) % total].c === " ")) {
          let mot = 0;
          for (let k = i; k < i + 40 && lettres[k % total].c !== " "; k++) mot += lettres[k % total].w * fl;
          if (s + mot > tr.L && mot <= tr.L) { ti++; s = 0; j = 1; continue; }
        }
        if (s === 0 && L.c === " ") { i++; continue; }
      }
      if (s + pas > tr.L) { ti++; s = 0; j = 1; continue; }
      const milieu = s + pas / 2;
      while (j < tr.pts.length - 1 && tr.pts[j].s < milieu) j++;
      const a = tr.pts[j - 1], b = tr.pts[j], k = (milieu - a.s) / Math.max(0.001, b.s - a.s);
      s += pas;
      if (L.c.trim()) {
        tr.rempli = s;
        out.push({ L, echo: i >= total, tr, x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k), tx: b.x - a.x, ty: b.y - a.y, tz: b.z - a.z, tp: lerp(a.t, b.t, k), u: milieu / this.R });
        if (i < total) n++;
      }
      i++;
    }
    return { out, n };
  }
  // une lettre posee : sa place, sa direction (T), son bas (B) et le dehors (N), en pixels du monde
  lettre(c, o, pi, fl, extra) {
    const part = this.parties[pi];
    const T = part.droit || (o.tr && o.tr.plein) ? [1, 0, 0] : (calliNorm([o.tx, o.ty, o.tz]) || [1, 0, 0]);
    let N = part.n ? part.n(o.tp) : (this.volume ? [o.x, 0, o.z] : [0, 0, -1]);
    N = calliOrtho(N, T) || calliOrtho([0, 0, -1], T) || calliOrtho([0, -1, 0], T);
    const B = [T[1] * N[2] - T[2] * N[1], T[2] * N[0] - T[0] * N[2], T[0] * N[1] - T[1] * N[0]];
    return Object.assign({ c, p: pi, fl, x: o.x, y: o.y, z: o.z, u: o.u || 0, T, B, N, graine: Math.random() * 1000, cours: 60, alpha: 0,
      ox: hasard(-0.1, 1.1) * W, oy: hasard(-0.1, 1.1) * H, oa: hasard(-3, 3), X: 0, Y: 0, ma: 1, mb: 0, mc: 0, md: 1, rx: 0, ry: 0, zz: 0, vis: 1, ex: 0, ey: 0 }, extra);
  }
  placer(lettres) {
    this.ech = this.parties.map(p => p.type === "trait" ? this.echantillonner(p) : null);
    const pleines = lettres.filter(l => l.c.trim()).length;
    // la plus grande lettre qui fait tenir tout le poeme
    // plafond : une lettre trop grosse efface les details (pieds de table, ailes, roues) ; le
    // poeme recommence alors en echo pour finir le dessin
    const fsMax = Math.max(10, Math.min(58, this.R * (this.forme.fsMax || 0.06)));
    const tient = f => this.disposer(f, lettres, 0).n >= pleines;
    let lo = 6, hi = 58, fs;
    if (tient(hi)) fs = hi;
    else if (!tient(lo)) fs = lo;
    else { for (let k = 0; k < 12; k++) { const m = (lo + hi) / 2; if (tient(m)) lo = m; else hi = m; } fs = lo; }
    const fsTient = fs;
    fs = Math.min(fs, fsMax);
    // le dessin entier ne passe pas CALLI_LETTRES lettres (le cout d'une image) : la lettre grossit
    // juste ce qu'il faut entre le plafond et la taille ou le poeme seul remplit la forme
    const echo = S.calliEcho !== false;
    if (echo && fs < fsTient && this.disposer(fs, lettres, CALLI_LETTRES + 1).out.length > CALLI_LETTRES) {
      let a = fs, b = fsTient;
      for (let k = 0; k < 10; k++) { const m = (a + b) / 2; if (this.disposer(m, lettres, CALLI_LETTRES + 1).out.length > CALLI_LETTRES) a = m; else b = m; }
      fs = b;
    }
    this.fs = fs;
    const d = this.disposer(fs, lettres, echo ? CALLI_LETTRES : 0);
    this.lettres = [];
    let ordre = 0;
    const premiers = new Set();
    for (const o of d.out) {
      if (o.tr.plein) o.x += (o.tr.L - o.tr.rempli) / 2;  // chaque ligne d'une surface est centree
      const L = o.L, extra = { poete: L.poete, echo: o.echo, ordre: o.echo ? 0 : ordre };
      if (!o.echo) {
        extra.vers = L.vers;
        const cleMot = L.vers + "|" + L.mot;
        if (!premiers.has(cleMot)) { premiers.add(cleMot); extra.motDebut = L.mot; }
        ordre++;
      }
      this.lettres.push(this.lettre(L.c, o, o.tr.p, o.tr.fl, extra));
    }
    this.nPoeme = ordre;
    // les textes fixes : le titre du miroir, les aiguilles, « Salut monde »
    this.parties.forEach((p, pi) => {
      if (!p.texte || !this.ech[pi]) return;
      const e = this.ech[pi];
      // jamais le nom de la forme du poeme (Jiiji, 2026-10-18 : « j'aime pas que les styles de poemes
      // soient annonces ») : le titre, ou le mot le plus rare du poeme
      let txt = p.texte === "titre" ? casse(this.poeme.titre || this.motRare()) : p.texte === "rare" ? casse(this.motRare()) : casse(p.texte);
      const w = c => p.pasFixe ? 0.95 : calliLarg(c);
      let Wt = [...txt].reduce((a, c) => a + w(c), 0);
      let fl = Math.min(fs * (p.ech || 1), e.L / Math.max(0.01, Wt));
      if (p.repeter) { fl = Math.min(fs * (p.ech || 1), e.L / Math.max(0.01, Wt)) ; const un = txt + " · "; txt = un.repeat(Math.max(1, Math.floor(e.L / Math.max(1, [...un].reduce((a, c) => a + w(c), 0) * fl)))); Wt = [...txt].reduce((a, c) => a + w(c), 0); }
      let s = Math.max(0, (e.L - Wt * fl) / 2), j = 1;
      for (const c of txt) {
        const pas = w(c) * fl, milieu = s + pas / 2;
        s += pas;
        if (!c.trim()) continue;
        while (j < e.pts.length - 1 && e.pts[j].s < milieu) j++;
        const a = e.pts[j - 1], b = e.pts[j], k = (milieu - a.s) / Math.max(0.001, b.s - a.s);
        this.lettres.push(this.lettre(c, { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k), tx: b.x - a.x, ty: b.y - a.y, tz: b.z - a.z, tp: lerp(a.t, b.t, k), u: milieu / this.R },
          pi, fl, { fixe: true, ordre: 0 }));
      }
    });
  }
  // le mot le plus rare du poeme (le plus cher a la Bourse)
  motRare() {
    if (this.rare) return this.rare;
    let best = "", c = -1;
    for (const v of this.vers) for (const m of (typeof motsPleins === "function" ? motsPleins(v.texte) : v.texte.split(/\s+/))) {
      const k = typeof coursDe === "function" ? coursDe(m) : 60;
      if (m.length > 2 && (k > c || (k === c && m.length > best.length))) { c = k; best = m; }
    }
    return (this.rare = best || "poïasie");
  }
  sortir() {
    this.phase = "sortie"; this.tSortie = this.t;
    let x0 = Infinity, x1 = -Infinity;
    for (const l of this.lettres) { x0 = Math.min(x0, l.rx); x1 = Math.max(x1, l.rx); }
    const larg = Math.max(1, x1 - x0);
    for (const l of this.lettres) {
      if (this.depart === "vent") {
        // le vent vient de la gauche : les lettres de gauche partent les premieres
        l.vx = hasard(60, 160); l.vy = hasard(-50, 10); l.delai = (l.rx - x0) / larg * 2.2 + hasard(0, 0.5);
      } else if (this.depart === "eclat") {
        const d = Math.max(1, Math.hypot(l.rx, l.ry)), f = hasard(90, 300);
        l.vx = l.rx / d * f; l.vy = l.ry / d * f; l.delai = hasard(0, 0.6);
      } else { l.vy = hasard(-40, 20); l.vx = hasard(-30, 30); l.delai = hasard(0, 1.6); }
    }
  }
  maj(dt) {
    this.t += dt;
    const t = this.t, R = this.R, r = rythme(), pm = pulseMots();
    if (this.phase === "entree" && t >= this.dureeEntree) this.phase = "tenue";
    if (this.phase === "tenue" && t >= this.debutSortie) this.sortir();
    this.ouverture = sortie3(clamp(t / Math.max(0.5, this.dureeEntree), 0, 1));
    // l'orientation : les volumes tournent, les formes a plat basculent (la musique pousse un peu)
    this.rot += dt * 0.3 * S.calliRotation * (1 + r.b * 0.5 * pm);
    let yaw, pitch, roll = Math.sin(t * 0.17) * 0.08;
    if (this.volume) { yaw = S.calliRotation > 0.001 ? this.rot : 0.5; pitch = (this.forme.inclinaison || 0.3) + 0.14 * Math.sin(t * 0.11); roll *= 0.6; }
    else if (S.calliPlat === "tourne") { yaw = this.rot; pitch = 0.12 * Math.sin(t * 0.13); }
    else if (S.calliPlat === "fixe") { yaw = 0; pitch = 0; }
    else { const A = 0.42 * Math.min(1.6, S.calliRotation); yaw = A * Math.sin(t * 0.21 + this.phi); pitch = A * 0.5 * Math.sin(t * 0.16 + this.phi * 1.7); }
    const G = calli.mul(calli.rz(roll), calli.mul(calli.rx(pitch), calli.ry(yaw)));
    const ech = (1 + Math.sin(t * 0.31) * 0.03) * (1 + r.coup * 0.025 * pm);
    const prof = S.calliProfondeur, Dc = R * (prof > 0.02 ? 1.6 + 3.2 / prof : 1e5), brume = 0.72 * Math.min(1, prof), Rz = this.Rz * R;
    // les parties qui bougent
    const A = this.anims || (this.anims = []);
    for (let i = 0; i < this.parties.length; i++) {
      const p = this.parties[i], f = p.anime || (!p.fixe && this.forme.anime);
      if (!f) { A[i] = null; continue; }
      const a = f(t, this), o = a.o || [0, 0, 0], d = a.d || [0, 0, 0];
      A[i] = { m: a.m || CALLI_ID, ox: (o[0] - this.ox) * R, oy: (o[1] - this.oy) * R, oz: (o[2] || 0) * R, dx: d[0] * R, dy: d[1] * R, dz: (d[2] || 0) * R };
    }
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const l of this.lettres) {
      let px = l.x, py = l.y, pz = l.z, T = l.T, B = l.B, N = l.N;
      const a = A[l.p], p = this.parties[l.p];
      if (a) {
        const m = a.m, qx = px - a.ox, qy = py - a.oy, qz = pz - a.oz;
        px = m[0] * qx + m[1] * qy + m[2] * qz + a.ox + a.dx;
        py = m[3] * qx + m[4] * qy + m[5] * qz + a.oy + a.dy;
        pz = m[6] * qx + m[7] * qy + m[8] * qz + a.oz + a.dz;
        T = calli.app(m, T); B = calli.app(m, B); N = calli.app(m, N);
      }
      if (p.ondule) { const o = p.ondule[0] * R * Math.sin(l.u * p.ondule[1] - t * p.ondule[2] + (p.ondule[3] || 0)); px += B[0] * o; py += B[1] * o; pz += B[2] * o; }
      const gx = (G[0] * px + G[1] * py + G[2] * pz) * ech, gy = (G[3] * px + G[4] * py + G[5] * pz) * ech, gz = (G[6] * px + G[7] * py + G[8] * pz) * ech;
      const tx = G[0] * T[0] + G[1] * T[1] + G[2] * T[2], ty = G[3] * T[0] + G[4] * T[1] + G[5] * T[2], tz = G[6] * T[0] + G[7] * T[1] + G[8] * T[2];
      const bx = G[0] * B[0] + G[1] * B[1] + G[2] * B[2], by = G[3] * B[0] + G[4] * B[1] + G[5] * B[2], bz = G[6] * B[0] + G[7] * B[1] + G[8] * B[2];
      const nx = G[0] * N[0] + G[1] * N[1] + G[2] * N[2], ny = G[3] * N[0] + G[4] * N[1] + G[5] * N[2], nz = G[6] * N[0] + G[7] * N[1] + G[8] * N[2];
      // la perspective : la camera est a Dc devant ; la lettre est une petite plaque projetee
      const q = Math.max(R * 0.3, Dc + gz), k = Dc / q;
      l.rx = gx * k; l.ry = gy * k; l.zz = gz;
      l.ax = k * (tx - gx * tz / q); l.ay = k * (ty - gy * tz / q);
      l.bx = k * (bx - gx * bz / q); l.by = k * (by - gy * bz / q);
      l.ex = k * (-nx + gx * nz / q); l.ey = k * (-ny + gy * nz / q);
      // plus sombre au loin, et un peu plus quand on la voit de dos
      let vis = 1 - brume * clamp(gz / Math.max(1, Rz), 0, 1);
      if (nz > 0.02) vis *= this.volume ? 0.5 : 0.8;
      if (l.echo) vis *= 0.8;
      if (p.clignote) vis *= 0.6 + 0.4 * Math.max(r.coup, Math.abs(Math.sin(t * 2.3) * Math.sin(t * 0.9)));
      l.vis = vis;
      const e = l.fl * k * 0.7;
      x0 = Math.min(x0, l.rx - e); x1 = Math.max(x1, l.rx + e); y0 = Math.min(y0, l.ry - e); y1 = Math.max(y1, l.ry + e);
    }
    // la derive : rebondit sur les bords de l'ecran
    if (this.lettres.length) {
      const haut = S.bourse ? 30 : 0, dv = S.calliDerive;
      const rebond = (c, v, lo, hi) => {
        if (lo > hi) return [(lo + hi) / 2, v];  // plus grande que l'ecran : elle reste au milieu
        if (c < lo) return [lo, Math.abs(v)];
        if (c > hi) return [hi, -Math.abs(v)];
        return [c, v];
      };
      [this.cx, this.vx] = rebond(this.cx + this.vx * dv * dt, this.vx, -x0, W - x1);
      [this.cy, this.vy] = rebond(this.cy + this.vy * dv * dt, this.vy, -y0 + haut, H - y1);
    }
    // l'arrivee, la tenue, le depart
    const ts = this.phase === "sortie" ? t - this.tSortie : 0;
    let vivants = 0;
    for (const l of this.lettres) {
      const X = this.cx + l.rx, Y = this.cy + l.ry;
      if (this.phase === "sortie" && ts >= l.delai) {
        if (!l.parti) { l.parti = true; l.X = X; l.Y = Y; l.ang = Math.atan2(l.ay, l.ax); l.sc = Math.max(0.05, Math.hypot(l.ax, l.ay)); l.dech = 1; l.a = 1; l.vis0 = l.alpha; }
        if (this.depart === "vent") { l.vx += 90 * dt; l.vy += Math.sin(t * 2 + l.graine) * 60 * dt; l.ang += dt * (1.5 + l.graine % 2); l.a -= dt * 0.32; }
        else if (this.depart === "eclat") { l.vx *= 1 - dt * 0.5; l.vy *= 1 - dt * 0.5; l.ang += l.vx * 0.003 * dt; l.dech *= 1 - dt * 0.25; l.a -= dt * 0.4; }
        else { l.vy += 260 * dt; l.ang += l.vx * 0.002; l.a -= dt * 0.5; }
        l.X += l.vx * dt; l.Y += l.vy * dt;
        const c = Math.cos(l.ang) * l.sc * l.dech, s = Math.sin(l.ang) * l.sc * l.dech;
        l.ma = c; l.mb = s; l.mc = -s; l.md = c; l.alpha = Math.max(0, l.a) * l.vis0;
        if (l.a > 0 && l.Y < H + 40 && l.X < W + 60 && l.X > -60) vivants++;
        continue;
      }
      vivants++;
      if (this.phase === "sortie") { l.X = X; l.Y = Y; l.ma = l.ax; l.mb = l.ay; l.mc = l.bx; l.md = l.by; l.alpha = l.sonne ? l.vis : 0; continue; }
      const age = t - l.tArr;
      if (this.arrivee === "rassemblement") {
        const pp = clamp(age * 0.85, 0, 1), e = sortie3(pp), k0 = 0.35 * (1 - e), c = Math.cos(l.oa) * k0, s = Math.sin(l.oa) * k0;
        l.X = lerp(l.ox, X, e); l.Y = lerp(l.oy, Y, e);
        l.ma = c + l.ax * e; l.mb = s + l.ay * e; l.mc = -s + l.bx * e; l.md = c + l.by * e;
        l.alpha = clamp(pp * 2.5, 0, 1) * l.vis;
        if (pp > 0 && !l.sonne) this.paraitre(l, X, Y);
      } else {
        const pp = clamp(age * 3, 0, 1), e = sortie3(pp), s = 0.6 + 0.4 * e;
        l.X = X; l.Y = Y - (1 - e) * l.fl * 0.6;
        l.ma = l.ax * s; l.mb = l.ay * s; l.mc = l.bx * s; l.md = l.by * s;
        l.alpha = pp * l.vis;
        if (pp > 0 && !l.sonne) this.paraitre(l, X, Y);
      }
    }
    return this.phase === "sortie" && (vivants === 0 || ts > 9);
  }
  // une lettre se pose : une note (une lettre sur trois), et sur le bus, le vers qui commence et le
  // mot qui parait (une fois chacun, a sa premiere lettre)
  paraitre(l, X, Y) {
    l.sonne = true;
    if (l.echo || l.fixe) return;
    if (S.son && l.ordre % 3 === 0) son.mot({ t: l.c, poete: l.poete, cours: 60 });
    if (typeof bus === "undefined") return;
    if (l.vers !== undefined && !this.versDits.has(l.vers)) {
      this.versDits.add(l.vers);
      const v = this.vers[l.vers];
      if (v && bus.ecouteurs.vers) bus.emettre("vers", { texte: v.texte, poete: v.poete || "", index: l.vers });
    }
    // personne n'ecoute : on ne decoupe pas le vers pour rien
    if (l.motDebut !== undefined && bus.ecouteurs.mot) {
      const v = this.vers[l.vers], mots = v ? casse(v.texte).split(/\s+/).filter(m => m) : [], texte = mots[l.motDebut] || l.c;
      bus.emettre("mot", { texte, x: X, y: Y, poete: l.poete, cours: typeof coursDe === "function" ? coursDe(texte) : 60, ordre: l.ordre });
    }
  }
  couleur(l, P) {
    if (l.fixe) return P.accent;
    if (l.echo) return P.note;
    const te = this.parties[l.p].teinte;
    if (te !== undefined) return te === "accent" ? P.accent : te === "note" ? P.note : P.mono ? P.texte : "hsl(" + te + (P.clair ? ",65%,34%)" : ",80%,66%)");
    return couleurDe(l, 10);
  }
  // le glitch garde dessinerMot : quelques lettres a la fois, brouillees un instant
  glitcher(l, X, Y, couleur) {
    if (!(l.glitchJusqua > temps)) {
      if (Math.random() >= S.glitch * 0.006) return false;
      l.glitchJusqua = temps + 0.06 + Math.random() * 0.18; l.glitchTexte = brouiller(l.c); l.glitchDx = (Math.random() - 0.5) * 24 * S.glitch;
    }
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const m = calliTampon;
    m.x = X; m.y = Y; m.hx = l.x; m.angle = Math.atan2(l.mb, l.ma); m.echelle = Math.hypot(l.ma, l.mb); m.alpha = l.alpha; m.police = police(l.fl); m.affiche = l.c;
    m.glitchJusqua = l.glitchJusqua; m.glitchTexte = l.glitchTexte; m.glitchDx = l.glitchDx; m.graine = l.graine; m.cours = 60;
    dessinerMot(m, { calme: true, couleur });
    return true;
  }
  dessiner() {
    const P = palette();
    ctx.save();
    const ep = S.calliEpaisseur > 0.01 && this.phase !== "sortie" ? S.calliEpaisseur : 0;
    const trier = this.volume || ep || S.calliPlat === "tourne";
    const liste = trier ? this.tri.sort((a, b) => b.zz - a.zz) : this.lettres;
    const batt = battementMots(0.16), A = S.tremblement * 0.3, fq = S.frequence * 6, ond = S.ondulation * 7 * 0.25;
    const aig = S.musique && musique.actif ? musique.aigus * pulseMots() * 2.5 * 0.25 : 0;
    // la couleur de chaque lettre est revue une image sur huit (et toutes quand un reglage de
    // couleur change) : a 500 a 1100 lettres, la recalculer a chaque image se voyait
    const teintes = S.palette + "|" + S.modeCouleur + "|" + S.couleurPoetes + "|" + S.teinteMots + "|" + S.vivacite + "|" + S.clarte + "|" + S.derive;
    const toutes = teintes !== this.teintes;
    this.teintes = teintes;
    const tour = (this.image = (this.image || 0) + 1) & 7;
    // la lettre est une petite plaque : sa vignette (l'atlas de vignettes.js) est prise a sa taille
    // a l'ecran, puis posee avec la transformation de la plaque (perspective comprise)
    const poser = (l, c, X, Y, taille, alpha) => {
      const ka = l.ma * l.ma + l.mb * l.mb, kb = l.mc * l.mc + l.md * l.md, ecran = taille * Math.sqrt(ka > kb ? ka : kb);
      if (ecran < 1) return;
      if (ecran < 4) { alpha *= (ecran - 1) / 3; if (alpha <= 0.004) return; }
      const v = vignetteLettre(l.c, ecran, c), s = (v ? taille / v.fs : taille / ecran) * DPR;
      ctx.globalAlpha = alpha < 1 ? alpha : 1;
      ctx.setTransform(s * l.ma, s * l.mb, s * l.mc, s * l.md, DPR * X, DPR * Y);
      if (v) poserVignette(v); else ecrireDirect(l.c, police(ecran), c);
    };
    // l'epaisseur : des copies de chaque lettre en arriere, couleur des notes (lettres en relief)
    if (ep) {
      const d0 = ep * this.R * 0.05;
      for (const l of liste) {
        if (l.alpha <= 0.02 || l.parti) continue;
        for (let j = 3; j >= 1; j--) poser(l, P.note, l.X + l.ex * d0 * j, l.Y + l.ey * d0 * j, l.fl * batt, l.alpha * 0.4 * (1 - j / 4));
      }
    }
    const resp = S.respiration;
    for (let i = 0; i < liste.length; i++) {
      const l = liste[i];
      if (l.alpha <= 0.004) continue;
      let X = l.X, Y = l.Y, taille = l.fl * batt;
      if (A > 0) { X += A * bruit(temps * fq + l.graine); Y += A * bruit(temps * fq + l.graine * 1.7 + 30); }
      if (ond) Y += ond * Math.sin(temps * 2 + l.x * 0.013);
      if (aig) { X += aig * bruit(temps * 23 + l.graine); Y += aig * bruit(temps * 19 + l.graine * 1.3); }
      if (resp) taille *= 1 + resp * 0.05 * Math.sin(temps * 1.3 + l.graine);
      if (toutes || !l.coul || (l.ordre & 7) === tour) l.coul = this.couleur(l, P);
      if (S.glitch > 0 && this.glitcher(l, X, Y, l.coul)) continue;
      poser(l, l.coul, X, Y, taille, l.alpha);
    }
    ctx.restore();
  }
}

/* ---------------------------------------------------- les reglages */

// le choix de la forme : les familles d'abord, puis chaque forme (ajout seul : les anciennes
// valeurs gardees dans le navigateur de Jiiji restent valables)
(function () {
  for (const o of SCHEMA) for (const g of o.groupes || []) for (const it of g.items || []) {
    if (it.cle !== "calligramme" || !it.options) continue;
    const deja = new Set(it.options.map(x => x[0]));
    const familles = Object.keys(CALLI_FAMILLES).filter(k => !deja.has(k)).map(k => [k, "Au hasard : " + CALLI_FAMILLES[k]]);
    it.options.splice(1, 0, ...familles);
    for (const k in CALLIGRAMMES) if (!deja.has(k)) it.options.push([k, CALLIGRAMMES[k].nom]);
  }
})();
ajouterReglages("Mouvements", "Calligramme", [
  { cle: "calliRotation", nom: "Rotation dans l'espace", type: "curseur", min: 0, max: 3, pas: 0.01 },
  { cle: "calliProfondeur", nom: "Profondeur (perspective, le loin s'assombrit)", type: "curseur", min: 0, max: 2, pas: 0.01 },
  { cle: "calliPlat", nom: "Les formes à plat", type: "choix", options: [["bascule", "basculent doucement"], ["tourne", "tournent comme une carte"], ["fixe", "restent à plat"]] },
  { cle: "calliEpaisseur", nom: "Épaisseur des lettres (relief)", type: "curseur", min: 0, max: 1, pas: 0.01 },
  { cle: "calliDerive", nom: "Dérive (l'économiseur d'écran)", type: "curseur", min: 0, max: 3, pas: 0.01 },
  { cle: "calliEcho", nom: "Le poème recommence pour finir le dessin", type: "case" },
], { calliRotation: 1, calliProfondeur: 1, calliPlat: "bascule", calliEpaisseur: 0, calliDerive: 1, calliEcho: true });
// le pilote fait glisser la rotation et la profondeur, et passe aussi le calligramme dans les
// moments pleins (les volumes qui tournent)
if (typeof PILOTE_REGLAGES !== "undefined" && Array.isArray(PILOTE_REGLAGES)) PILOTE_REGLAGES.push(["calliRotation", 0.4, 1.8], ["calliProfondeur", 0.5, 1.6]);
if (typeof PILOTE_PLEIN !== "undefined" && Array.isArray(PILOTE_PLEIN) && !PILOTE_PLEIN.includes("calligramme")) PILOTE_PLEIN.push("calligramme");
