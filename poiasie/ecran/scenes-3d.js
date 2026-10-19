"use strict";
/* ================================================================ scenes en trois dimensions : les mots font des formes */

// Jiiji, 2026-10-18 : « il faut que toutes les animations, les scenes, ce soit des trucs comme ca
// qui font des formes en 3D, c'est vraiment ca qui rend le truc beau », et « le plus beau c'est que
// tout soit fait avec les phrases ». Ici les vers sont la forme : un globe, un noeud, une helice,
// un ruban de Moebius, une galaxie, un champ, un jet d'eau, un livre, un drape.
// Chaque lettre est une vignette deja peinte (vignetteMot), posee dans le monde : elle suit la
// surface (elle se couche, s'amincit de profil, se voit a l'envers de dos), le brouillard eteint ce
// qui est loin, et on pose du plus loin au plus proche. Pas un fillText par lettre.
// Les gestes (les formes qui tournent) suivent la vitesse generale ; la lecture (un vers apres
// l'autre) compte en vraies secondes et tient dans « Un poeme dure au plus » : Jiiji regle la
// vitesse a 0,1 et rien ne doit couper un poeme en plein milieu.

/* ================================================================ le moteur : camera, lettres, profondeur */

const E3 = {
  m: [1, 0, 0, 0, 1, 0, 0, 0, 1],  // la rotation du monde (lignes), le repere camera : x a droite, y en haut, z qui s'eloigne
  ox: 0, oy: 0, oz: 0,              // le point du monde qui vient au centre (avant la rotation)
  D: 3, F: 500, cx: 0, cy: 0,       // le recul de la camera, sa focale en pixels, le centre de l'image
  pres: 0.2, z0: 2, z1: 4,          // ce qui est trop pres ne se dessine pas ; le brouillard va de z0 a z1
  dos: 1, ombre: 0.25,              // dos : 0 pour le papier (opaque) ; ombre : les lettres de biais palissent
  liste: [], tri: [], n: 0, cpt: -1, img: -1, arret: 0,
  lx: 0, ly: 0,                     // la derniere lettre posee, a l'ecran (pour le bus)
};
const Q3 = { x: 0, y: 0, z: 0, k: 0 };

function rot3(ax, ay, az) {
  // tourne autour de z (roulis), puis de y (lacet), puis de x (tangage)
  const cx = Math.cos(ax), sx = Math.sin(ax), cy = Math.cos(ay), sy = Math.sin(ay), cz = Math.cos(az), sz = Math.sin(az);
  return [cy * cz, -cy * sz, sy,
    cx * sz + sx * sy * cz, cx * cz - sx * sy * sz, -sx * cy,
    sx * sz - cx * sy * cz, sx * cz + cx * sy * sz, cx * cy];
}
function mul3(A, B) {
  const R = new Array(9);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) R[i * 3 + j] = A[i * 3] * B[j] + A[i * 3 + 1] * B[3 + j] + A[i * 3 + 2] * B[6 + j];
  return R;
}
// remet une rotation d'aplomb (apres un melange vers une autre)
function ortho3(M) {
  let l = Math.hypot(M[0], M[1], M[2]);
  if (l < 1e-6) { M.splice(0, 9, 1, 0, 0, 0, 1, 0, 0, 0, 1); return; }
  M[0] /= l; M[1] /= l; M[2] /= l;
  const d = M[0] * M[3] + M[1] * M[4] + M[2] * M[5];
  M[3] -= d * M[0]; M[4] -= d * M[1]; M[5] -= d * M[2];
  l = Math.hypot(M[3], M[4], M[5]);
  if (l < 1e-6) { M.splice(0, 9, 1, 0, 0, 0, 1, 0, 0, 0, 1); return; }
  M[3] /= l; M[4] /= l; M[5] /= l;
  M[6] = M[1] * M[5] - M[2] * M[4]; M[7] = M[2] * M[3] - M[0] * M[5]; M[8] = M[0] * M[4] - M[1] * M[3];
}

// echelle : pixels par unite du monde au centre de la forme ; recul : distance de la camera. Le
// reglage « Perspective » rapproche la camera sans changer la taille au centre.
function camera3D(echelle, recul) {
  E3.D = Math.max(1.5, recul / clamp(S.t3Perspective, 0.3, 3));
  E3.F = echelle * E3.D;
  E3.cx = W / 2; E3.cy = H / 2 - (S.cartel && !enCalque ? H * 0.035 : 0);
  E3.ox = E3.oy = E3.oz = 0;
  E3.pres = E3.D * 0.12; E3.dos = 1; E3.ombre = 0.25; E3.brume = -1;
  E3.z0 = E3.D - 1; E3.z1 = E3.D + 1;
}
// E3.brume : la force du brouillard pour la scene en cours (les paysages la veulent plus forte) ;
// negative, c'est le reglage « Brouillard de profondeur »
function brouillard3D(z) {
  const f = E3.brume >= 0 ? E3.brume : clamp(S.t3Brouillard, 0, 1) * 0.88;
  return 1 - f * clamp((z - E3.z0) / Math.max(0.01, E3.z1 - E3.z0), 0, 1);
}
function projeter3D(x, y, z) {
  const m = E3.m;
  x -= E3.ox; y -= E3.oy; z -= E3.oz;
  const px = m[0] * x + m[1] * y + m[2] * z, py = m[3] * x + m[4] * y + m[5] * z, pz = m[6] * x + m[7] * y + m[8] * z + E3.D;
  if (pz < E3.pres) return false;
  const k = E3.F / pz;
  Q3.x = E3.cx + k * px; Q3.y = E3.cy - k * py; Q3.z = pz; Q3.k = k;
  return true;
}

// Une lettre du monde : en (x, y, z), ecrite dans le sens t, son haut vers u (deux vecteurs du
// monde, pas forcement unitaires). Elle n'est pas dessinee tout de suite : poser3D() les pose
// toutes, de la plus loin a la plus proche.
function lettre3D(c, h, couleur, x, y, z, tx, ty, tz, ux, uy, uz, alpha, ital) {
  if (alpha < 0.012 || E3.n >= 3200) return;
  const m = E3.m;
  x -= E3.ox; y -= E3.oy; z -= E3.oz;
  const px = m[0] * x + m[1] * y + m[2] * z, py = m[3] * x + m[4] * y + m[5] * z, pz = m[6] * x + m[7] * y + m[8] * z + E3.D;
  if (pz < E3.pres) return;
  const k = E3.F / pz, sx = E3.cx + k * px, sy = E3.cy - k * py;
  const taille = k * h;
  if (taille < 1.6) return;
  const marge = taille * 3;
  if (sx < -marge || sx > W + marge || sy < -marge || sy > H + marge) return;
  const Tx = m[0] * tx + m[1] * ty + m[2] * tz, Ty = m[3] * tx + m[4] * ty + m[5] * tz, Tz = m[6] * tx + m[7] * ty + m[8] * tz;
  const Ux = m[0] * ux + m[1] * uy + m[2] * uz, Uy = m[3] * ux + m[4] * uy + m[5] * uz, Uz = m[6] * ux + m[7] * uy + m[8] * uz;
  const lt = Math.hypot(Tx, Ty, Tz) || 1, lu = Math.hypot(Ux, Uy, Uz) || 1, iz = 1 / pz;
  // ce que devient un pas dans le sens de l'ecriture, et un pas vers le haut, a l'ecran
  const rx = k * (Tx - px * Tz * iz) / lt, ry = -k * (Ty - py * Tz * iz) / lt;
  const vx = k * (Ux - px * Uz * iz) / lu, vy = -k * (Uy - py * Uz * iz) / lu;
  // de face, de profil ou de dos (de dos, la lettre se voit a l'envers, a travers la forme)
  const face = (ry * vx - rx * vy) / (Math.hypot(rx, ry) * Math.hypot(vx, vy) + 1e-9);
  if (face < 0) alpha *= clamp(S.t3Dos, 0, 1) * E3.dos;
  alpha *= brouillard3D(pz) * (1 - E3.ombre * (1 - Math.abs(face)));
  if (alpha < 0.012) return;
  let o = E3.liste[E3.n];
  if (!o) o = E3.liste[E3.n] = {};
  E3.n++;
  o.z = pz; o.ch = c; o.col = couleur; o.taille = taille; o.h = h; o.al = alpha; o.it = !!ital;
  o.a = rx; o.b = ry; o.c = -vx; o.d = -vy; o.e = sx; o.f = sy;
  E3.lx = sx; E3.ly = sy;
}
function poser3D() {
  const n = E3.n;
  if (!n) return;
  const tri = E3.tri;
  tri.length = 0;
  for (let i = 0; i < n; i++) tri.push(E3.liste[i]);
  tri.sort((a, b) => b.z - a.z);
  const bat = battementMots(0.16);
  // L'atlas (vignettes.js) peint ses vignettes neuves au debut de l'image suivante
  // (vignettes.nouvelleImage). S'il ne tourne pas (l'image avance, lui non), on prend les
  // vignettes a toile propre (vignetteMot), peintes tout de suite.
  if (compteur !== E3.cpt) {
    E3.cpt = compteur;
    if (vignettes.image !== E3.img) { E3.img = vignettes.image; E3.arret = 0; } else E3.arret++;
  }
  const atlas = typeof vignetteLettre === "function" && E3.arret < 3;
  // les lettres partent en un lot a la carte graphique (vignettes.js, lettresGl) : une instance
  // par lettre au lieu d'un drawImage chacune
  const lot = atlas && typeof lettresGl === "object" && lettresGl.ouvrir();
  for (const o of tri) {
    // une vignette neuve de l'atlas n'est prete qu'a l'image suivante : la lettre attend une image
    // (ou prend une voisine d'une autre taille)
    const v = atlas ? vignetteLettre(o.ch, o.taille * bat, o.col, o.it) : vignetteMot(o.ch, o.taille * bat, o.col, o.it);
    if (!v) continue;
    // o.a..o.d sont en pixels par unite du monde ; la vignette fait v.fs pixels pour h unites
    const s = DPR * bat * o.h / v.fs;
    if (lot && v.page) { lettresGl.ajouter(v, o.a * s, o.b * s, o.c * s, o.d * s, DPR * o.e, DPR * o.f, o.al); continue; }
    ctx.globalAlpha = o.al > 1 ? 1 : o.al;
    ctx.setTransform(o.a * s, o.b * s, o.c * s, o.d * s, DPR * o.e, DPR * o.f);
    poserVignette(v);
  }
  if (lot) lettresGl.fermer();
  E3.n = 0;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.globalAlpha = 1;
}

// un trait du monde (les aretes d'une forme, le fil d'un noeud), par morceaux qui palissent au loin
function ligne3D(pts, couleur, alpha, largeur) {
  if (alpha <= 0.01) return;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.strokeStyle = couleur; ctx.lineWidth = largeur || 1;
  let ok = false, zs = 0, nb = 0, lx = 0, ly = 0;
  const vider = () => { if (nb > 1) { ctx.globalAlpha = clamp(alpha * brouillard3D(zs / nb), 0, 1); ctx.stroke(); } };
  ctx.beginPath();
  for (let i = 0; i < pts.length; i += 3) {
    if (!projeter3D(pts[i], pts[i + 1], pts[i + 2])) { vider(); ctx.beginPath(); ok = false; zs = nb = 0; continue; }
    if (ok) ctx.lineTo(Q3.x, Q3.y); else ctx.moveTo(Q3.x, Q3.y);
    ok = true; zs += Q3.z; nb++; lx = Q3.x; ly = Q3.y;
    if (nb >= 8) { vider(); ctx.beginPath(); ctx.moveTo(lx, ly); zs = Q3.z; nb = 1; }
  }
  vider();
  ctx.globalAlpha = 1;
}

// une poussiere d'etoiles autour de la forme : elle tourne avec elle et dit la profondeur
const ciel3D = { pts: null };
function poussiere3D(rayon, alpha) {
  if (!S.t3Poussiere) return;
  if (!ciel3D.pts) {
    const n = 240, p = new Float32Array(n * 5);
    for (let i = 0; i < n; i++) {
      const u = hasard(-1, 1), a = hasard(0, Math.PI * 2), r = hasard(1.7, 3.6), q = Math.sqrt(1 - u * u);
      p.set([Math.cos(a) * q * r, u * r, Math.sin(a) * q * r, Math.pow(Math.random(), 2.5), hasard(0, 6.3)], i * 5);
    }
    ciel3D.pts = p;
  }
  const P = palette(), p = ciel3D.pts;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = P.clair ? P.note : "#ffffff";
  for (let i = 0; i < p.length; i += 5) {
    if (!projeter3D(p[i] * rayon, p[i + 1] * rayon, p[i + 2] * rayon)) continue;
    if (Q3.x < 0 || Q3.x > W || Q3.y < 0 || Q3.y > H) continue;
    const m = p[i + 3], s = (0.7 + 1.9 * m) * clamp(Q3.k * E3.D / E3.F, 0.5, 1.6);
    ctx.globalAlpha = alpha * (0.12 + 0.6 * m) * (0.65 + 0.35 * Math.sin(temps * 1.7 + p[i + 4])) * brouillard3D(Q3.z);
    ctx.fillRect(Q3.x - s / 2, Q3.y - s / 2, s, s);
  }
  ctx.globalAlpha = 1;
}

// les lettres d'un texte et la place de chacune (le milieu de la lettre), en tailles de lettre
function lettresLe(texte) {
  const pol = police(100), out = [];
  let x = 0;
  for (const c of texte) {
    const w = mesurer(c, pol) / 100;
    if (c.trim()) out.push({ c, s: x + w / 2 });
    x += w;
  }
  return { lettres: out, L: Math.max(x, 0.01) };
}
// un vers trop long pour la ligne passe a la ligne (au mot)
function couperLignes(texte, largeur) {
  const pol = police(100), esp = mesurer(" ", pol) / 100, lignes = [];
  let cour = "", w = 0;
  for (const m of texte.split(/\s+/).filter(Boolean)) {
    const wm = mesurer(m, pol) / 100;
    if (cour && w + esp + wm > largeur) { lignes.push(cour); cour = m; w = wm; }
    else { cour = cour ? cour + " " + m : m; w = cour === m ? wm : w + esp + wm; }
  }
  if (cour) lignes.push(cour);
  return lignes.length ? lignes : [texte];
}

/* ================================================================ le temps de lire, la musique, le bus */

// vraies secondes : la vitesse generale ralentit les gestes, pas la lecture
function reel3D(dt) {
  const v = S.vitesse * live.vitesse * (S.musique && musique.actif ? 1 + musique.niveau * S.musiqueElan : 1);
  return v > 1e-4 ? dt / v : 0;
}
// Le pas de lecture : les vraies secondes de chaque vers. Le poeme tient dans « Un poeme dure au
// plus », sinon l'orchestre le couperait en plein milieu (Jiiji ne veut pas).
function pas3D(n) {
  let d = Math.max(S.tenue, tenueMin);
  if (S.poemeMax < 600) d = Math.min(d, S.poemeMax - 5);
  return Math.max(0.35, d / Math.max(1, n));
}
class Lecture3D {
  constructor(poeme, vers) {
    this.poeme = poeme;
    this.vers = vers || versDe(poeme);
    this.n = this.vers.length;
    this.pas = pas3D(this.n);
    this.tr = 0; this.t = 0;
    this.tenir = clamp(this.pas * this.n * 0.3, 3, 10);
    if (S.poemeMax < 600) this.tenir = Math.max(1.5, Math.min(this.tenir, S.poemeMax - 1 - this.n * this.pas));
    this.dit = -1;
    // les mots de chaque vers et l'endroit du vers ou ils commencent (pour le bus)
    this.mots = this.vers.map(v => {
      const t = casse(v.texte), out = [], re = /\S+/g;
      let m;
      while ((m = re.exec(t))) out.push({ texte: m[0], u: m.index / Math.max(1, t.length), dit: false });
      return out;
    });
    this.x = W / 2; this.y = H / 2;
  }
  avancer(dt) {
    this.t += dt;
    const d = reel3D(dt);
    this.tr += d;
    // le bus : un vers commence, un mot parait (une fois chacun)
    const c = this.courant;
    if (this.tr > 0 && c > this.dit) {
      for (let i = this.dit + 1; i <= c; i++) bus.emettre("vers", { texte: this.vers[i].texte, poete: this.vers[i].poete, index: i });
      this.dit = c;
    }
    for (let i = Math.max(0, c - 1); i <= c; i++) {
      const e = this.ecrit(i);
      for (const m of this.mots[i]) if (!m.dit && m.u <= e && this.tr >= i * this.pas) {
        m.dit = true;
        bus.emettre("mot", { texte: m.texte, x: this.x, y: this.y, poete: this.vers[i].poete, cours: coursDe(m.texte), ordre: i });
      }
    }
    return d;
  }
  ici() { this.x = E3.lx; this.y = E3.ly; }
  get courant() { return clamp(Math.floor(this.tr / this.pas), 0, this.n - 1); }
  ecrit(i) { return clamp((this.tr - i * this.pas) / (this.pas * 0.8), 0, 1); }
  get toutEcrit() { return this.tr > this.n * this.pas; }
  get finit() { return this.tr > this.n * this.pas + this.tenir - 1.5; }
  get fini() { return this.tr > this.n * this.pas + this.tenir; }
}

// la musique fait respirer les formes, doucement
function respire3D(r) {
  return 1 + (r.b * 0.03 * pulseMots() + r.coup * 0.025 + notes3D.force(0.35) * 0.02) * S.t3Musique;
}
// « les sons font des mots » : chaque note qui part (le bus) laisse une onde dans la forme
const notes3D = {
  liste: [],
  maintenant() { return performance.now() / 1000; },
  // la somme des notes recentes, qui s'eteignent en tau secondes ; f(note) les pondere
  force(tau, f) {
    const t = this.maintenant();
    let s = 0;
    for (const n of this.liste) { const a = t - n.t; if (a < tau * 5) s += n.vel * Math.exp(-a / tau) * (f ? f(n, a) : 1); }
    return s;
  },
};
bus.ecouter("note", d => {
  notes3D.liste.push({ t: notes3D.maintenant(), vel: clamp(d && d.vel !== undefined ? d.vel : 0.6, 0, 1.5),
    degre: d && d.degre !== undefined ? d.degre : Math.floor(Math.random() * 12), pan: d && d.pan || 0 });
  if (notes3D.liste.length > 12) notes3D.liste.shift();
});

// un angle vers sa cible par le plus court chemin, sans a-coup (tau en vraies secondes)
function viser3D(a, cible, dtr, tau) {
  let d = cible - a;
  d -= Math.round(d / (Math.PI * 2)) * Math.PI * 2;
  return a + d * (1 - Math.exp(-dtr / Math.max(0.05, tau)));
}
function approcher3D(a, cible, dtr, tau) { return a + (cible - a) * (1 - Math.exp(-dtr / Math.max(0.05, tau))); }
// « La forme se tourne vers le vers qu'on lit » : le temps qu'elle met (0 : elle ne s'en soucie pas)
function guide3D() { return S.t3Guide > 0 ? lerp(14, 2.2, clamp(S.t3Guide, 0, 1)) : 0; }
function lumiere3D(i, lec) { return i === lec.courant && !lec.toutEcrit ? 1 : lec.toutEcrit ? 0.9 : 0.64; }

/* ================================================================ les chemins : un poeme qui s'ecrit le long d'une courbe */

// Un chemin est fait de morceaux u (0..1) -> [x, y, z, hx, hy, hz, e] : la position, un vecteur qui
// dit ou va le haut des lettres, et l'echelle des lettres a cet endroit (1 si absente). Mode
// « haut » : le haut est h, redresse ; mode « croix » : le haut est t x h (h est la normale de la
// surface, la lettre se couche dessus). Il est re-echantillonne a pas regulier : poser une lettre
// ne coute plus un seul sinus.
class Chemin3D {
  constructor(morceaux, ferme, mode) {
    this.ferme = ferme; this.mode = mode || "haut";
    const pas = 0.008, cadres = [];
    let total = 0;
    for (const f of morceaux) {
      const N = 1400, cum = [0];
      let prev = f(0), c = 0;
      for (let k = 1; k <= N; k++) {
        const q = f(k / N);
        c += Math.hypot(q[0] - prev[0], q[1] - prev[1], q[2] - prev[2]) / (q[6] || 1);
        cum.push(c); prev = q;
      }
      const n = Math.max(2, Math.round(c / pas));
      let kk = 0;
      for (let j = 0; j < n; j++) {
        const s = j / n * c;
        while (kk < N - 1 && cum[kk + 1] < s) kk++;
        const u = (kk + (s - cum[kk]) / Math.max(1e-9, cum[kk + 1] - cum[kk])) / N;
        cadres.push(this.cadre(f, u));
      }
      total += c;
    }
    this.n = cadres.length; this.L = total; this.ds = total / this.n;
    this.d = new Float32Array(this.n * 10);
    cadres.forEach((q, i) => this.d.set(q, i * 10));
    this.o = new Float32Array(10);
  }
  cadre(f, u) {
    const q = f(u), e = 1e-4;
    const a = f(Math.max(0, u - e)), b = f(Math.min(1, u + e));
    let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2];
    let l = Math.hypot(tx, ty, tz) || 1; tx /= l; ty /= l; tz /= l;
    let ux, uy, uz;
    if (this.mode === "croix") { ux = ty * q[5] - tz * q[4]; uy = tz * q[3] - tx * q[5]; uz = tx * q[4] - ty * q[3]; }
    else { const d = tx * q[3] + ty * q[4] + tz * q[5]; ux = q[3] - d * tx; uy = q[4] - d * ty; uz = q[5] - d * tz; }
    l = Math.hypot(ux, uy, uz) || 1;
    return [q[0], q[1], q[2], tx, ty, tz, ux / l, uy / l, uz / l, q[6] || 1];
  }
  en(s) {
    const n = this.n, d = this.d, o = this.o;
    let f = s / this.ds;
    if (this.ferme) { f %= n; if (f < 0) f += n; } else f = clamp(f, 0, n - 1.001);
    const k = Math.floor(f), a = f - k, i = k * 10, j = ((k + 1) % n) * 10;
    for (let q = 0; q < 10; q++) o[q] = d[i + q] + (d[j + q] - d[i + q]) * a;
    return o;
  }
  // des points du chemin pour en dessiner le fil
  points(nb, e) {
    const out = [];
    for (let i = 0; i <= nb; i++) { const o = this.en((this.ferme ? i / nb : i / nb * 0.999) * this.L); out.push(o[0] * (e || 1), o[1] * (e || 1), o[2] * (e || 1)); }
    return out;
  }
}

// La plume ecrit les vers a la suite sur un chemin, a l'heure de chacun. Quand elle a fait le tour,
// elle repasse sur les premiers : ce qu'elle va recouvrir s'efface juste avant elle.
class Plume3D {
  constructor(chemin) { this.ch = chemin; this.lettres = []; this.curseur = 0; this.k = 0; this.tete = 0; }
  ecrire(texte, h, debut, duree, poete, ordre) {
    const { lettres, L } = lettresLe(texte), s0 = this.curseur;
    for (const l of lettres) this.lettres.push({ c: l.c, s: s0 + l.s * h, t0: debut + l.s / L * duree, h, poete, ordre });
    this.curseur += (L + 2.6) * h;
    return { s0, s1: s0 + L * h };
  }
  // un poeme coupe avant sa fin (« Un poeme dure au plus ») : ce qu'il n'avait pas encore ecrit
  // ne viendra pas se meler au suivant
  couper(horloge) {
    this.lettres = this.lettres.filter(l => l.t0 <= horloge);
    this.k = this.lettres.length;
    if (this.k) this.curseur = this.lettres[this.k - 1].s + 2.6 * this.lettres[this.k - 1].h;
  }
  avancer(horloge) {
    while (this.k < this.lettres.length && this.lettres[this.k].t0 <= horloge) this.k++;
    this.tete = this.k ? this.lettres[this.k - 1].s : 0;
    let m = 0;
    while (m < this.k && this.lettres[m].s < this.tete - this.ch.L) m++;
    if (m) { this.lettres.splice(0, m); this.k -= m; }
  }
  // chaque lettre visible : fn(lettre, cadre du chemin, alpha, age)
  chaque(horloge, fn) {
    const L = this.ch.L;
    for (let i = this.k - 1; i >= 0; i--) {
      const l = this.lettres[i], reste = l.s + L - this.tete;
      if (reste <= 0) break;
      let a = clamp(reste / (L * 0.12), 0, 1) * clamp((horloge - l.t0) / 0.3, 0, 1);
      const s = l.s % L;
      if (!this.ch.ferme) a *= clamp(Math.min(s, L - s) / (L * 0.03), 0, 1);
      if (a > 0.01) fn(l, this.ch.en(s), a, horloge - l.t0);
    }
  }
}

// la forme se tourne doucement pour montrer ce que la plume ecrit : la cible met la lettre face a
// nous (le sens de l'ecriture vers la droite, son haut vers le haut), un peu de biais
function suivre3D(M, f, biais, dtr) {
  const tau = guide3D();
  if (!tau) return false;
  const tx = f[3], ty = f[4], tz = f[5], ux = f[6], uy = f[7], uz = f[8];
  const T = mul3(biais, [tx, ty, tz, ux, uy, uz, ty * uz - tz * uy, tz * ux - tx * uz, tx * uy - ty * ux]);
  const a = 1 - Math.exp(-dtr / tau);
  for (let i = 0; i < 9; i++) M[i] += (T[i] - M[i]) * a;
  ortho3(M);
  return true;
}
function tourner3D(M, ax, ay) {
  const R = mul3(rot3(ax, ay, 0), M);
  for (let i = 0; i < 9; i++) M[i] = R[i];
  ortho3(M);
}
// une lettre de plume : fraiche, elle est de la couleur vive
function lettrePlume(l, o, a, age, lec, P, ital) {
  const frais = age < 0.5;
  const coul = frais ? P.accent : couleurDe({ poete: l.poete, ordre: l.ordre }, 10);
  const h = l.h * o[9];
  lettre3D(l.c, h, coul, o[0], o[1], o[2], o[3], o[4], o[5], o[6], o[7], o[8], a * lumiere3D(l.ordre, lec), ital);
  if (frais) lec.ici();
}

/* ================================================================ scene : le globe */

// La sphere de mots : chaque vers est un parallele du globe, ecrit tout autour (recopie autant
// qu'il faut pour faire le tour, comme la rosace). Le globe tourne sur lui-meme et s'incline pour
// montrer le parallele qu'on ecrit ; au-dela de onze vers, un vers prend la latitude du plus
// ancien, qui s'eteint. Une note qui part souleve la latitude de son degre.
const globe = { lacet: 0, tangage: 0.2 };
class SceneGlobe {
  constructor(poeme) {
    this.poeme = poeme;
    this.lec = new Lecture3D(poeme);
    const n = this.lec.n, K = this.K = Math.min(n, 11);
    const ecart = K > 1 ? 2.16 / (K - 1) : 0.9;
    const h = clamp(ecart * 0.7, 0.05, 0.17) * clamp(S.taille, 0.5, 1.8);
    this.anneaux = this.lec.vers.map((v, i) => {
      const phi = K > 1 ? 1.08 - (i % K) * ecart : 0;
      const { lettres, L } = lettresLe(casse(v.texte) + "   ·   ");
      const C = Math.PI * 2 * Math.cos(phi), hh = Math.min(h, C * 0.96 / L);
      const fois = Math.max(1, Math.floor(C / (L * hh)));
      const ls = [];
      for (let q = 0; q < fois; q++) for (const l of lettres) {
        const th = (q + l.s / L) / fois * Math.PI * 2;
        ls.push({ c: l.c, u: l.s / L, sn: Math.sin(th), co: Math.cos(th) });
      }
      return { lettres: ls, phi, h: hh, sp: Math.sin(phi), cp: Math.cos(phi), poete: v.poete, ordre: i, fin: i + K < n ? (i + K) * this.lec.pas : Infinity };
    });
    montrerCartel(poeme);
  }
  maj(dt) {
    const L = this.lec, dtr = L.avancer(dt), r = rythme();
    globe.lacet += dt * 0.22 * S.t3Rotation * (1 + r.m * 0.8);
    const tau = guide3D();
    if (tau && !L.toutEcrit) globe.tangage = approcher3D(globe.tangage, -this.anneaux[L.courant].phi * 0.85 + 0.16, dtr, tau * 0.6);
    else globe.tangage = approcher3D(globe.tangage, 0.24 + 0.22 * Math.sin(L.t * 0.13), dtr, 5);
    if (L.finit) montrerCartel(null);
    return L.fini;
  }
  dessiner() {
    const P = palette(), r = rythme(), L = this.lec, K = this.K;
    camera3D(Math.min(W, H) * 0.36 * respire3D(r), 3.4);
    E3.m = rot3(globe.tangage, globe.lacet, 0.12 * Math.sin(L.t * 0.07));
    ctx.save();
    poussiere3D(1, 0.8);
    for (const a of this.anneaux) {
      if (L.tr < a.ordre * L.pas) continue;
      const vie = a.fin === Infinity ? 1 : clamp(1 - (L.tr - a.fin) / 0.8, 0, 1);
      if (vie <= 0) continue;
      const ecrit = L.ecrit(a.ordre), lum = vie * lumiere3D(a.ordre, L);
      const coul = couleurDe({ poete: a.poete, ordre: a.ordre }, 10);
      // la latitude de la note se souleve un instant
      const deg = K > 1 ? (a.ordre % K) / (K - 1) : 0.5;
      const R = 1 + 0.09 * S.t3Musique * notes3D.force(0.45, n => Math.exp(-Math.pow(((n.degre % 12) / 11 - deg) / 0.14, 2)));
      const sp = a.sp * R, cp = a.cp * R;
      for (const l of a.lettres) {
        if (l.u > ecrit) continue;
        const frais = ecrit < 1 && l.u > ecrit - 0.06;
        lettre3D(l.c, a.h, frais ? P.accent : coul, cp * l.sn, sp, -cp * l.co, l.co, 0, l.sn, -a.sp * l.sn, a.cp, a.sp * l.co, lum);
        if (frais) L.ici();
      }
    }
    poser3D();
    ctx.restore();
  }
}

/* ================================================================ scene : le noeud */

// Le poeme s'ecrit sur un noeud de tore (trefle, cinq feuilles...), lettre a lettre, couche sur la
// surface du tore invisible dont on ne voit que le fil. Le noeud se tourne lentement vers la plume ;
// quand il a fait le tour, la plume repasse sur les premiers vers.
const NOEUDS = { trefle: [2, 3], cinq: [2, 5], sept: [2, 7], etoile: [3, 4], fleur: [3, 5], lotus: [5, 3] };
class SceneNoeud {
  constructor(poeme) {
    this.lec = new Lecture3D(poeme);
    const nom = NOEUDS[S.t3Noeud] ? S.t3Noeud : tirer(Object.keys(NOEUDS));
    const [p, q] = NOEUDS[nom], R = 0.68, a = 0.3;
    this.ch = new Chemin3D([u => {
      const f = u * Math.PI * 2, rr = R + a * Math.cos(q * f);
      const x = rr * Math.cos(p * f), z = rr * Math.sin(p * f), y = a * Math.sin(q * f);
      return [x, y, z, x - R * Math.cos(p * f), y, z - R * Math.sin(p * f)];
    }], true, "croix");
    this.fil = this.ch.points(260);
    this.plume = new Plume3D(this.ch);
    const U = this.lec.vers.reduce((s, v) => s + lettresLe(casse(v.texte)).L + 2.6, 0);
    const h = clamp(this.ch.L * 0.93 / U, 0.07, 0.12) * clamp(S.taille, 0.6, 1.6);
    this.lec.vers.forEach((v, i) => this.plume.ecrire(casse(v.texte), h, i * this.lec.pas, this.lec.pas * 0.8, v.poete, i));
    this.M = rot3(0.5, hasard(0, 6.3), 0);
    montrerCartel(poeme);
  }
  maj(dt) {
    const L = this.lec, dtr = L.avancer(dt), r = rythme();
    this.plume.avancer(L.tr);
    const biais = rot3(0.32 + 0.12 * Math.sin(L.t * 0.11), 0.42 * Math.sin(L.t * 0.07), 0);
    if (L.toutEcrit || !suivre3D(this.M, this.ch.en(this.plume.tete), biais, dtr))
      tourner3D(this.M, dt * 0.05 * S.t3Rotation, dt * 0.11 * S.t3Rotation * (1 + r.m));
    if (L.finit) montrerCartel(null);
    return L.fini;
  }
  dessiner() {
    const P = palette(), r = rythme(), L = this.lec;
    camera3D(Math.min(W, H) * 0.48 * respire3D(r), 3.2);
    E3.m = this.M;
    ctx.save();
    poussiere3D(1, 0.7);
    ligne3D(this.fil, P.note, 0.22 + 0.2 * notes3D.force(0.4), 1);
    this.plume.chaque(L.tr, (l, o, a, age) => lettrePlume(l, o, a, age, L, P));
    poser3D();
    if (!L.toutEcrit) {
      const o = this.ch.en(this.plume.tete);
      if (projeter3D(o[0], o[1], o[2])) poserEtoile(Q3.x, Q3.y, 2.2, P.clair ? P.accent : "#ffffff", 0.9, true);
    }
    ctx.restore();
  }
}

/* ================================================================ scene : le ruban de Moebius */

// Le poeme s'ecrit sur un ruban de Moebius, en deux pistes : a chaque tour la piste passe de
// l'autre cote du ruban, et le vers se lit a l'envers, a travers lui, avant de revenir.
class SceneMoebius {
  constructor(poeme) {
    this.lec = new Lecture3D(poeme);
    const piste = v => u => {
      const th = u * Math.PI * 4, c = Math.cos(th / 2), s = Math.sin(th / 2);
      return [(1 + v * c) * Math.cos(th), v * s, (1 + v * c) * Math.sin(th), c * Math.cos(th), s, c * Math.sin(th)];
    };
    this.ch = new Chemin3D([piste(0.1), piste(0.28)], true, "haut");
    this.bords = new Chemin3D([piste(0.4)], true, "haut").points(300);
    this.plume = new Plume3D(this.ch);
    const U = this.lec.vers.reduce((s, v) => s + lettresLe(casse(v.texte)).L + 2.6, 0);
    const h = clamp(this.ch.L * 0.93 / U, 0.075, 0.12) * clamp(S.taille, 0.6, 1.5);
    this.lec.vers.forEach((v, i) => this.plume.ecrire(casse(v.texte), h, i * this.lec.pas, this.lec.pas * 0.8, v.poete, i));
    this.M = rot3(0.55, hasard(0, 6.3), 0.2);
    montrerCartel(poeme);
  }
  maj(dt) {
    const L = this.lec, dtr = L.avancer(dt), r = rythme();
    this.plume.avancer(L.tr);
    const biais = rot3(0.38 + 0.1 * Math.sin(L.t * 0.09), 0.35 * Math.sin(L.t * 0.06), 0);
    if (L.toutEcrit || !suivre3D(this.M, this.ch.en(this.plume.tete), biais, dtr))
      tourner3D(this.M, dt * 0.04 * S.t3Rotation, dt * 0.12 * S.t3Rotation * (1 + r.m));
    if (L.finit) montrerCartel(null);
    return L.fini;
  }
  dessiner() {
    const P = palette(), r = rythme(), L = this.lec;
    camera3D(Math.min(W, H) * 0.38 * respire3D(r), 3.2);
    E3.m = this.M;
    E3.z0 = E3.D - 1.4; E3.z1 = E3.D + 1.4;
    ctx.save();
    poussiere3D(1.1, 0.7);
    ligne3D(this.bords, P.note, 0.3 + 0.25 * notes3D.force(0.4), 1);
    this.plume.chaque(L.tr, (l, o, a, age) => lettrePlume(l, o, a, age, L, P));
    poser3D();
    ctx.restore();
  }
}

/* ================================================================ scene : l'helice */

// Deux brins de vers s'enroulent comme l'ADN : les vers pairs sur l'un, les impairs sur l'autre,
// lus de haut en bas ; entre eux, des barreaux portent chacun un mot du poeme. L'helice tourne pour
// montrer le vers qu'on ecrit ; une note fait vibrer le brin a sa hauteur.
class SceneHelice {
  constructor(poeme) {
    this.lec = new Lecture3D(poeme);
    const L = this.lec, h = 0.088 * clamp(S.taille, 0.6, 1.5);
    const U = [0, 1].map(b => L.vers.reduce((s, v, i) => s + (i % 2 === b ? lettresLe(casse(v.texte)).L + 2.6 : 0), 0) * h);
    const Hh = 2.5, rho = 0.8, Ls = Math.max(U[0], U[1]) * 1.04;
    // au moins deux tours : l'ADN se reconnait a son enroulement
    this.pasH = clamp(Ls > Hh * 1.05 ? Hh * Math.PI * 2 * rho / Math.sqrt(Ls * Ls - Hh * Hh) : 1.25, 0.5, 1.25);
    this.rho = rho;
    const brin = phase => u => {
      const y = Hh / 2 - Hh * u, f = phase + Hh * u / this.pasH * Math.PI * 2;
      return [rho * Math.sin(f), y, -rho * Math.cos(f), 0, 1, 0];
    };
    this.brins = [0, Math.PI].map(ph => { const ch = new Chemin3D([brin(ph)], false, "haut"); return { ch, plume: new Plume3D(ch), fil: ch.points(160) }; });
    this.places = L.vers.map((v, i) => this.brins[i % 2].plume.ecrire(casse(v.texte), h, i * L.pas, L.pas * 0.8, v.poete, i));
    // les barreaux : un mot du poeme tous les demi-radians, de haut en bas
    const mots = L.vers.flatMap(v => motsPleins(v.texte)).map(m => casse(m));
    this.barreaux = [];
    const nb = Math.floor(Hh / this.pasH * Math.PI * 2 / 0.9);
    for (let k = 0; k <= nb; k++) {
      const u = k / Math.max(1, nb), f = u * Hh / this.pasH * Math.PI * 2;
      this.barreaux.push({ y: Hh / 2 - Hh * u, f, u, mot: mots.length ? mots[k % mots.length] : "" });
    }
    this.h = h; this.lacet = hasard(0, 6.3);
    montrerCartel(poeme);
  }
  maj(dt) {
    const L = this.lec, dtr = L.avancer(dt), r = rythme();
    for (const b of this.brins) b.plume.avancer(L.tr);
    const tau = guide3D();
    if (tau && !L.toutEcrit) {
      const pl = this.places[L.courant], ch = this.brins[L.courant % 2].ch;
      const o = ch.en(Math.min(ch.L - 0.01, ((pl.s0 + pl.s1) / 2) % ch.L));
      this.lacet = viser3D(this.lacet, Math.atan2(o[0], -o[2]) + 0.25 * Math.sin(L.t * 0.2), dtr, tau * 0.7);
    } else this.lacet += dt * 0.25 * S.t3Rotation * (1 + r.m * 0.8);
    if (L.finit) montrerCartel(null);
    return L.fini;
  }
  dessiner() {
    const P = palette(), r = rythme(), L = this.lec;
    camera3D(H * 0.3 * respire3D(r), 3.6);
    E3.m = rot3(0.16, this.lacet, 0.12 + 0.05 * Math.sin(L.t * 0.08));
    E3.z0 = E3.D - 0.6; E3.z1 = E3.D + 0.6;
    ctx.save();
    poussiere3D(1.2, 0.6);
    // la vibration des notes : une onde sur le brin, a la hauteur du degre de la note
    const vib = (y, a) => notes3D.force(0.5, (n, age) => Math.exp(-Math.pow((y - (1.1 - ((n.degre % 12) / 11) * 2.2)) / 0.35, 2)) * Math.sin(y * 18 - age * 22)) * 0.09 * S.t3Musique * a;
    for (const b of this.brins) ligne3D(b.fil, P.note, 0.25, 1);
    // les barreaux, et leur mot
    const prog = L.toutEcrit ? 1 : clamp(L.tr / (L.n * L.pas), 0, 1);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    for (const k of this.barreaux) {
      if (k.u > prog + 0.02) continue;
      const ca = Math.cos(k.f), sa = Math.sin(k.f), rho = this.rho * 0.92;
      ligne3D([rho * sa, k.y, -rho * ca, -rho * sa, k.y, rho * ca], P.note, 0.16, 1);
      if (k.mot) lettre3D(k.mot, this.h * 0.62, couleurDe({ note: true }, 10), 0, k.y, 0, -sa, 0, ca, 0, 1, 0, 0.75 * clamp((prog - k.u) * 20, 0, 1), true);
    }
    for (const b of this.brins) b.plume.chaque(L.tr, (l, o, a, age) => {
      const d = 1 + vib(o[1], 1);
      lettrePlume(l, [o[0] * d, o[1], o[2] * d, o[3], o[4], o[5], o[6], o[7], o[8], o[9]], a, age, L, P);
    });
    poser3D();
    ctx.restore();
  }
}

/* ================================================================ scene : la galaxie */

// Les vers sont les bras d'une galaxie vue de biais : ils s'ecrivent du bord vers le coeur, de plus
// en plus petits ; au coeur brille le mot le plus rare du poeme. La galaxie continue d'un poeme a
// l'autre : les vers neufs recouvrent peu a peu les anciens, bras apres bras.
const galaxie = { bras: [], horloge: 0, lacet: 0, etoiles: null, nb: 0, coeur: "", coeurAvant: "", coeurT: 0 };
const GAL_B = 0.16, GAL_DEHORS = 1.0, GAL_DEDANS = 0.16;
class SceneGalaxie {
  constructor(poeme) {
    this.lec = new Lecture3D(poeme);
    const N = Math.round(clamp(S.t3Bras, 2, 6));
    if (galaxie.nb !== N || !galaxie.bras.length) this.creer(N);
    for (const b of galaxie.bras) b.plume.couper(galaxie.horloge);
    const L = this.lec, h = 0.085 * clamp(S.taille, 0.6, 1.5), base = galaxie.horloge + 0.2;
    this.base = base;
    this.places = L.vers.map((v, i) => {
      const b = galaxie.bras[i % N];
      return { b, ...b.plume.ecrire(casse(v.texte), h, base + i * L.pas, L.pas * 0.8, v.poete, i) };
    });
    // le coeur : le mot le plus rare du poeme
    const mots = L.vers.flatMap(v => motsPleins(v.texte));
    galaxie.coeurAvant = galaxie.coeur; galaxie.coeurT = galaxie.horloge;
    galaxie.coeur = mots.length ? casse(mots.reduce((a, b) => coursDe(b) > coursDe(a) ? b : a)) : "";
    montrerCartel(poeme);
  }
  creer(N) {
    galaxie.nb = N; galaxie.horloge = 0;
    galaxie.bras = Array.from({ length: N }, (_, k) => {
      const a0 = k / N * Math.PI * 2;
      const ch = new Chemin3D([u => {
        const r = GAL_DEHORS * Math.pow(GAL_DEDANS / GAL_DEHORS, u), f = a0 + Math.log(GAL_DEHORS / r) / GAL_B;
        return [r * Math.cos(f), 0, r * Math.sin(f), 0, 1, 0, 0.4 + 0.6 * r];
      }], false, "croix");
      return { ch, plume: new Plume3D(ch), a0 };
    });
    // les etoiles des bras
    const n = 700, e = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const k = Math.floor(Math.random() * N), r = i < 560 ? GAL_DEDANS * 0.4 + Math.pow(Math.random(), 0.8) * (GAL_DEHORS * 1.2) : hasard(0.02, 1.3);
      const f = i < 560 ? k / N * Math.PI * 2 + Math.log(GAL_DEHORS / Math.max(0.05, r)) / GAL_B + (Math.random() + Math.random() - 1) * 0.5 : hasard(0, 6.3);
      e.set([r * Math.cos(f), (Math.random() + Math.random() - 1) * 0.04 * (1.2 - r), r * Math.sin(f), Math.pow(Math.random(), 2)], i * 4);
    }
    galaxie.etoiles = e;
  }
  maj(dt) {
    const L = this.lec, dtr = L.avancer(dt), r = rythme();
    galaxie.horloge = this.base - 0.2 + L.tr;
    for (const b of galaxie.bras) b.plume.avancer(galaxie.horloge);
    const tau = guide3D();
    if (tau && !L.toutEcrit) {
      const pl = this.places[L.courant], o = pl.b.ch.en(Math.min(pl.b.ch.L - 0.01, ((pl.s0 + pl.s1) / 2) % pl.b.ch.L));
      galaxie.lacet = viser3D(galaxie.lacet, Math.atan2(o[2], o[0]) + Math.PI / 2 + 0.3 * Math.sin(L.t * 0.15), dtr, tau);
    } else galaxie.lacet += dt * 0.08 * S.t3Rotation * (1 + r.m);
    if (L.finit) montrerCartel(null);
    return L.fini;
  }
  dessiner() {
    const P = palette(), r = rythme(), L = this.lec, R = respire3D(r);
    camera3D(Math.min(W * 0.28, H * 0.46) * R, 3.0);
    E3.m = rot3(-0.98 + 0.06 * Math.sin(L.t * 0.05), galaxie.lacet, 0.08);
    E3.z0 = E3.D - 0.9; E3.z1 = E3.D + 0.9;
    ctx.save();
    // les etoiles
    const e = galaxie.etoiles, blanc = P.clair ? P.note : "#ffffff";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = blanc;
    for (let i = 0; i < e.length; i += 4) {
      if (!projeter3D(e[i], e[i + 1], e[i + 2])) continue;
      const m = e[i + 3], s = 0.6 + 1.8 * m;
      ctx.globalAlpha = (0.14 + 0.55 * m) * (0.7 + 0.3 * Math.sin(temps * 1.3 + i)) * brouillard3D(Q3.z) * (1 + r.a * 0.6);
      ctx.fillRect(Q3.x - s / 2, Q3.y - s / 2, s, s);
    }
    // le coeur : une lueur, et le mot le plus rare
    if (projeter3D(0, 0, 0)) {
      const cx = Q3.x, cy = Q3.y, k = Q3.k;
      poserEtoile(cx, cy, k * 0.05 * (1 + notes3D.force(0.4) * 0.3 * S.t3Musique), P.clair ? P.accent : "#ffffff", 0.9, true);
      const pass = clamp((galaxie.horloge - galaxie.coeurT) / 2, 0, 1);
      const taille = k * 0.075 * clamp(S.taille, 0.6, 1.5) * R;
      if (galaxie.coeurAvant && pass < 1) ecrireGrand(galaxie.coeurAvant, taille, P.accent, cx, cy - taille * 0.9, 0, 1 - pass);
      if (galaxie.coeur) ecrireGrand(galaxie.coeur, taille, P.accent, cx, cy - taille * 0.9, 0, pass * 0.95);
    }
    for (const b of galaxie.bras) b.plume.chaque(galaxie.horloge, (l, o, a, age) => {
      const lum = l.t0 >= this.base - 0.05 ? 1 : 0.55;  // le poeme d'avant pali
      const frais = age < 0.5;
      const coul = frais ? P.accent : couleurDe({ poete: l.poete, ordre: l.ordre }, 10);
      lettre3D(l.c, l.h * o[9], coul, o[0], o[1], o[2], o[3], o[4], o[5], o[6], o[7], o[8], a * lum * (lum === 1 ? lumiere3D(l.ordre, L) : 1));
      if (frais) L.ici();
    });
    poser3D();
    ctx.restore();
  }
}

/* ================================================================ scene : le champ */

// Un terrain de vers qui ondule a perte de vue : chaque vers est une ligne posee sur la houle, le
// plus neuf tout pres de nous ; a chaque vers les autres reculent d'un rang vers l'horizon et
// s'eteignent dans le brouillard. Le champ continue d'un poeme a l'autre.
const champ = { lignes: [], horloge: 0, tau: 0 };
const CHAMP_PAS = 0.78;
class SceneChamp {
  constructor(poeme) {
    this.lec = new Lecture3D(poeme);
    const L = this.lec, base = champ.horloge + 0.2;
    this.base = base;
    champ.lignes = champ.lignes.filter(l => l.actif);  // un poeme coupe ne laisse pas ses vers en attente
    for (const [i, v] of L.vers.entries()) {
      const { lettres, L: Lu } = lettresLe(casse(v.texte));
      const h = Math.min(0.12, 2.6 / Lu) * clamp(S.taille, 0.6, 1.6);
      champ.lignes.push({ lettres: lettres.map(l => ({ c: l.c, x: (l.s - Lu / 2) * h, u: l.s / Lu })), h, poete: v.poete, ordre: i,
        t0: base + i * L.pas, duree: L.pas * 0.8, rang: -1, aff: -0.7, actif: false });
    }
    montrerCartel(poeme);
  }
  // la houle, et sa pente (pour coucher les lettres dessus)
  houle(x, z, A) {
    const t = champ.tau, a1 = 1.1 * x + 0.7 * z - t, a2 = 0.6 * x - 1.3 * z - 0.7 * t + 1, a3 = 2.3 * x + 0.4 * z + 1.6 * t;
    const s1 = Math.sin(a1), s2 = Math.sin(a2), s3 = Math.sin(a3), c1 = Math.cos(a1), c2 = Math.cos(a2), c3 = Math.cos(a3);
    return [A * (0.5 * s1 + 0.35 * s2 + 0.2 * s3), A * (0.55 * c1 + 0.21 * c2 + 0.46 * c3), A * (0.35 * c1 - 0.455 * c2 + 0.08 * c3)];
  }
  amplitude(z, r) {
    return 0.2 * S.t3Houle * (1 + (r.b * 0.6 + r.coup * 0.3 + notes3D.force(0.5) * 0.4) * S.t3Musique) * (0.15 + 0.85 * clamp((z - 1.2) / 3, 0, 1));
  }
  maj(dt) {
    const L = this.lec, dtr = L.avancer(dt);
    champ.horloge = this.base - 0.2 + L.tr;
    champ.tau += dt * 0.55 * S.t3Rotation;
    for (const l of champ.lignes) if (!l.actif && l.t0 <= champ.horloge) {
      for (const o of champ.lignes) if (o.actif) o.rang++;
      l.actif = true; l.rang = 0;
    }
    for (const l of champ.lignes) if (l.actif) l.aff = approcher3D(l.aff, l.rang, dtr, 0.9);
    champ.lignes = champ.lignes.filter(l => !l.actif || l.aff < 10);
    if (L.finit) montrerCartel(null);
    return L.fini;
  }
  dessiner() {
    const P = palette(), r = rythme(), L = this.lec;
    E3.D = 0; E3.F = H * 1.05; E3.cx = W / 2; E3.cy = H / 2 - (S.cartel && !enCalque ? H * 0.03 : 0);
    E3.ox = 0.12 * Math.sin(L.t * 0.04); E3.oy = 0.85; E3.oz = -0.5;
    E3.pres = 0.2; E3.dos = 1; E3.ombre = 0.15; E3.brume = -1; E3.z0 = 2; E3.z1 = 13 / clamp(S.t3Perspective, 0.3, 3);
    E3.m = rot3(-0.4, 0.05 * Math.sin(L.t * 0.05), 0.02 * Math.sin(L.t * 0.07));
    ctx.save();
    // le terrain lui-meme : des lignes de houle jusqu'a l'horizon
    for (let k = 0; k < 18; k++) {
      const z = 1 + k * CHAMP_PAS - ((champ.tau * 0.06) % CHAMP_PAS), pts = [], A = this.amplitude(z, r), demi = 1.5 + z * 0.9;
      for (let q = 0; q <= 28; q++) { const x = -demi + 2 * demi * q / 28; pts.push(x, this.houle(x, z, A)[0] - 0.02, z); }
      ligne3D(pts, P.note, 0.2, 1);
    }
    const lever = clamp(S.t3Lever, 0, 1);
    for (const l of champ.lignes) {
      if (!l.actif) continue;
      const z = 1.05 + l.aff * CHAMP_PAS, A = this.amplitude(z, r);
      const ap = clamp((l.aff + 0.7) / 0.7, 0, 1) * clamp((9.6 - l.aff) / 4, 0, 1);
      const neuf = l.t0 >= this.base - 0.05;
      const coul = couleurDe({ poete: l.poete, ordre: l.ordre }, 10);
      const ecrit = clamp((champ.horloge - l.t0) / l.duree, 0, 1);
      const lum = ap * (l.rang === 0 && neuf && !L.toutEcrit ? 1 : 0.8);
      for (const c of l.lettres) {
        if (c.u > ecrit) continue;
        const [y, dx, dz] = this.houle(c.x, z, A);
        const frais = ecrit < 1 && c.u > ecrit - 0.08;
        // couchee sur la houle, un peu levee vers nous pour se lire
        const fx = 0, fy = dz * (1 - lever) + lever, fz = 1 - lever;
        lettre3D(c.c, l.h, frais ? P.accent : coul, c.x, y - (1 - ap) * 0.3, z, 1, dx, 0, fx, fy, fz, lum);
        if (frais) L.ici();
      }
    }
    poser3D();
    ctx.restore();
  }
}

/* ================================================================ scene : le jet d'eau */

// Le jet d'eau d'Apollinaire, en relief : chaque vers est un jet qui monte du bassin et retombe, en
// arc, d'un cote puis de l'autre ; les jets s'ouvrent en eventail autour du centre (certains vers
// nous, d'autres au loin) et la fontaine se balance doucement. Au sol, la vasque : les mots du
// poeme en cercle sur l'eau.
class SceneFontaine {
  constructor(poeme) {
    this.lec = new Lecture3D(poeme);
    const L = this.lec, n = L.n, K = this.K = Math.min(n, 8), nf = Math.ceil(K / 2);
    const ordreEventail = Array.from({ length: nf }, (_, k) => k).sort((a, b) => Math.abs(a - (nf - 1) / 2) - Math.abs(b - (nf - 1) / 2));
    let portee = 0;
    this.jets = L.vers.map((v, i) => {
      const cote = i % 2 ? -1 : 1, f = ordreEventail[Math.floor(i / 2) % nf];
      const beta = nf > 1 ? lerp(-1.05, 1.05, f / (nf - 1)) : 0;
      const { lettres, L: Lu } = lettresLe(casse(v.texte));
      // chaque jet a sa forme (les plus hauts au milieu de l'eventail) ; la taille des lettres
      // suit : un vers court s'ecrit en grand, un vers long se serre, puis s'allonge
      const Hj = lerp(1.3, 0.8, Math.abs(beta) / 1.05) * hasard(0.92, 1.08);
      const arc = Dl => { let s = 0, py = 0, px = 0; for (let k = 1; k <= 24; k++) { const p = k / 24, x = p * Dl, y = 4 * Hj * p * (1 - p); s += Math.hypot(x - px, y - py); px = x; py = y; } return s; };
      let Dl = lerp(1.6, 1.0, Math.abs(beta) / 1.05) * hasard(0.9, 1.1);
      const hMin = 0.055, hMax = 0.13 * clamp(S.taille, 0.6, 1.5);
      let h = clamp(arc(Dl) * 0.95 / Lu, hMin, hMax);
      if (Lu * h > arc(Dl) * 0.95) { let a = Dl, b = 3.2; for (let k = 0; k < 20; k++) { const m = (a + b) / 2; if (arc(m) * 0.95 < Lu * h) a = m; else b = m; } Dl = b; }
      h = Math.min(h, arc(Dl) * 0.95 / Lu);
      // la place de chaque lettre sur l'arc, en fraction de la portee
      const table = [0];
      for (let k = 1; k <= 64; k++) { const p0 = (k - 1) / 64, p1 = k / 64; table.push(table[k - 1] + Math.hypot(Dl / 64, 4 * Hj * (p1 * (1 - p1) - p0 * (1 - p0)))); }
      const tot = table[64];
      const ls = lettres.map(l => {
        const s = Math.max(0, (tot - Lu * h) / 2) + l.s * h;  // un vers court au sommet de son arc
        let k = 0; while (k < 63 && table[k + 1] < s) k++;
        return { c: l.c, u: l.s / Lu, p: (k + (s - table[k]) / Math.max(1e-9, table[k + 1] - table[k])) / 64 };
      });
      portee = Math.max(portee, Dl);
      return { lettres: ls, cote, beta, Dl, Hj, h, poete: v.poete, ordre: i, fin: i + K < n ? (i + K) * L.pas : Infinity, ph: hasard(0, 6.3) };
    });
    // la vasque
    this.Rb = clamp(portee * 0.85, 0.7, 1.45);
    const texte = casse(L.vers.flatMap(v => motsPleins(v.texte)).join("  ·  ") + "  ·  ");
    const { lettres, L: Lu } = lettresLe(texte);
    const hb = Math.min(0.11, Math.PI * 2 * this.Rb / Lu) * clamp(S.taille, 0.6, 1.4);
    const fois = Math.max(1, Math.floor(Math.PI * 2 * this.Rb / (Lu * hb)));
    this.vasque = [];
    for (let q = 0; q < fois; q++) for (const l of lettres) this.vasque.push({ c: l.c, a: (q + l.s / Lu) / fois * Math.PI * 2 });
    this.hb = Math.min(hb, Math.PI * 2 * this.Rb / (Lu * fois));
    montrerCartel(poeme);
  }
  maj(dt) {
    const L = this.lec;
    L.avancer(dt);
    if (L.finit) montrerCartel(null);
    return L.fini;
  }
  dessiner() {
    const P = palette(), r = rythme(), L = this.lec;
    camera3D(Math.min(W * 0.26, H * 0.4) * respire3D(r), 3.6);
    E3.oy = 0.7;
    E3.m = rot3(0.3, 0.38 * Math.sin(L.t * 0.09 * S.t3Rotation), 0);
    // les jets se voient de biais : peu d'ombre de cote, le brouillard ne prend que le fond du bassin
    E3.ombre = 0.08; E3.z0 = E3.D - 0.6; E3.z1 = E3.D + 2.2;
    ctx.save();
    // la vasque tourne lentement sur l'eau
    const rot = L.t * 0.05 * S.t3Rotation, coulV = couleurDe({ note: true }, 10);
    for (const l of this.vasque) {
      const a = l.a + rot, s = Math.sin(a), c = Math.cos(a);
      lettre3D(l.c, this.hb, coulV, this.Rb * s, 0, -this.Rb * c, c, 0, s, 0, 0, 1, 0.75);
    }
    const souffle = 1 + (r.b * 0.08 + notes3D.force(0.5) * 0.1) * S.t3Musique;
    for (const j of this.jets) {
      if (L.tr < j.ordre * L.pas) continue;
      const vie = j.fin === Infinity ? 1 : clamp(1 - (L.tr - j.fin) / 0.8, 0, 1);
      if (vie <= 0) continue;
      // le jet qu'on lit brille, les autres retombent dans l'ombre
      const ecrit = L.ecrit(j.ordre), lum = vie * (j.ordre === L.courant && !L.toutEcrit ? 1 : L.toutEcrit ? 0.95 : 0.72);
      const coul = couleurDe({ poete: j.poete, ordre: j.ordre }, 10);
      const cb = Math.cos(j.beta), sb = Math.sin(j.beta);
      const Hj = j.Hj * souffle * (1 + 0.03 * Math.sin(L.t * 1.3 + j.ph)), Dl = j.Dl;
      for (const l of j.lettres) {
        if (l.u > ecrit) continue;
        // a droite le vers monte du centre ; a gauche il monte de la vasque et retombe au centre
        const p = l.p, X = j.cote > 0 ? p * Dl : (p - 1) * Dl, Y = 4 * Hj * p * (1 - p);
        let tX = Dl, tY = 4 * Hj * (1 - 2 * p);
        const nl = Math.hypot(tX, tY); tX /= nl; tY /= nl;
        const frais = ecrit < 1 && l.u > ecrit - 0.07;
        lettre3D(l.c, j.h, frais ? P.accent : coul, X * cb, Y, X * sb, tX * cb, tY, tX * sb, -tY * cb, tX, -tY * sb, lum);
        if (frais) L.ici();
      }
    }
    poser3D();
    if (projeter3D(0, 0, 0)) poserEtoile(Q3.x, Q3.y, 3 * (1 + r.coup), P.clair ? P.accent : "#ffffff", 0.7, false);
    ctx.restore();
  }
}

/* ================================================================ scene : le livre */

// Un livre ouvert, vu d'en haut et de biais : chaque strophe s'ecrit sur la page de droite, puis
// la page se souleve, se courbe et tourne ; la strophe lue se pose a gauche. Au debut, la page de
// gauche porte le titre. Le papier est opaque : on ne lit pas a travers.
function papier3D() {
  const P = palette(), a = rgbDe(P.fond[1]), b = rgbDe(P.clair ? "#ffffff" : P.texte), k = P.clair ? 0.55 : 0.075;
  return "rgb(" + a.map((v, i) => Math.round((v + (b[i] - v) * k) * 255)).join(",") + ")";
}
const LIVRE_H = 1.38;
class SceneLivre {
  constructor(poeme) {
    this.poeme = poeme;
    const pages = [];
    for (const s of strophesDe(poeme)) for (let i = 0; i < s.length; i += 6) pages.push(s.slice(i, i + 6));
    this.lec = new Lecture3D(poeme, pages.flat());
    const L = this.lec, h = this.h = 0.046 * clamp(S.taille, 0.6, 1.5);
    let iv = 0;
    this.pages = pages.map(pv => {
      const lignes = [];
      for (const v of pv) {
        const morceaux = couperLignes(casse(v.texte), 0.74 / h);
        const total = morceaux.reduce((a, m) => a + m.length, 0) || 1;
        let fait = 0;
        morceaux.forEach((m, k) => { lignes.push({ texte: m, retrait: k > 0, ordre: iv, poete: v.poete, u0: fait / total, u1: (fait + m.length) / total }); fait += m.length; });
        iv++;
      }
      return this.composer(lignes, h, pv.length ? iv - pv.length : 0, false);
    });
    this.titre = poeme.titre ? this.composer(couperLignes(casse(poeme.titre), 0.6 / (h * 1.5)).map(t => ({ texte: t, ordre: 0, poete: "", u0: 0, u1: 1, titre: true })), h * 1.5, 0, true) : null;
    this.tourne = clamp(L.pas * 0.9, 0.7, 2.4);
    this.lacet = 0;
    montrerCartel(poeme);
  }
  // les lettres d'une page : X depuis le dos du livre (page de droite), Z vers le haut de la page
  composer(lignes, h, i0, centre) {
    const lh = Math.min(h * 1.75, (LIVRE_H - 0.3) / Math.max(1, lignes.length));
    const z0 = (lignes.length - 1) * lh / 2;
    const lettres = [];
    lignes.forEach((li, k) => {
      const { lettres: ls, L } = lettresLe(li.texte);
      const x0 = centre ? 0.5 - L * h / 2 : 0.12 + (li.retrait ? 0.06 : 0);
      for (const l of ls) lettres.push({ c: l.c, X: x0 + l.s * h, Z: z0 - k * lh, u: lerp(li.u0, li.u1, l.s / L), ordre: li.ordre, poete: li.poete, titre: li.titre });
    });
    return { lettres, i0, h };
  }
  maj(dt) {
    const L = this.lec;
    L.avancer(dt);
    this.lacet = 0.07 * Math.sin(L.t * 0.05 * S.t3Rotation);
    if (L.finit) montrerCartel(null);
    return L.fini;
  }
  // la page qui tourne : angle th (0 a droite, pi a gauche), elle se courbe, son bord libre en retard
  courbe(d, th) {
    // la page ne se dresse pas tout a fait (k : vue d'en haut, debout, elle sortirait de l'image) ;
    // la courbe est refaite a vitesse constante (64 pas) pour que la page garde sa longueur et
    // les lettres leur espacement
    if (this.thTable !== th) {
      const b = -0.9 * Math.sin(th), k = 0.55, T = this.table || (this.table = new Float32Array(65 * 4));
      let x = 0, y = 0;
      for (let i = 0; i <= 64; i++) {
        const p = th + b * (i + 0.5) / 64, cx = Math.cos(p), cy = k * Math.sin(p), l = Math.hypot(cx, cy) || 1;
        T[i * 4] = x; T[i * 4 + 1] = y; T[i * 4 + 2] = cx / l; T[i * 4 + 3] = cy / l;
        x += cx / l / 64; y += cy / l / 64;
      }
      this.thTable = th;
    }
    const T = this.table, f = clamp(d, 0, 1) * 64, i = Math.min(63, Math.floor(f)), a = f - i, j = i * 4, q = j + 4;
    return [T[j] + (T[q] - T[j]) * a, T[j + 1] + (T[q + 1] - T[j + 1]) * a, T[j + 2] + (T[q + 2] - T[j + 2]) * a, T[j + 3] + (T[q + 3] - T[j + 3]) * a];
  }
  creux(d) { return 0.07 * (1 - Math.exp(-d * 6)); }  // la page monte en sortant du dos
  feuille(cote, th) {
    // le contour d'une page, pour la peindre
    const pts = [];
    for (let k = 0; k <= 12; k++) { const d = k / 12, q = th === null ? [cote * d, this.creux(d)] : this.courbe(d, th); pts.push([q[0], q[1], LIVRE_H / 2]); }
    for (let k = 12; k >= 0; k--) { const d = k / 12, q = th === null ? [cote * d, this.creux(d)] : this.courbe(d, th); pts.push([q[0], q[1], -LIVRE_H / 2]); }
    return pts;
  }
  peindre(pts, papier, P) {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.beginPath();
    let ok = false;
    for (const p of pts) { if (!projeter3D(p[0], p[1], p[2])) continue; if (ok) ctx.lineTo(Q3.x, Q3.y); else { ctx.moveTo(Q3.x, Q3.y); ok = true; } }
    if (!ok) return;
    ctx.closePath();
    ctx.globalAlpha = enCalque ? 0.7 : 0.94; ctx.fillStyle = papier; ctx.fill();
    ctx.globalAlpha = 0.35; ctx.strokeStyle = P.note; ctx.lineWidth = 1; ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // les lettres d'une page posee (cote 1 : a droite, -1 : a gauche) ou de la page qui tourne
  ecrirePage(pg, cote, th, verso, P) {
    if (!pg) return;
    const L = this.lec;
    for (const l of pg.lettres) {
      const e = l.titre ? 1 : L.ecrit(l.ordre);
      if (!l.titre && (L.tr < l.ordre * L.pas || l.u > e)) continue;
      const d = verso || cote < 0 ? 1 - l.X : l.X;
      let x, y, tx, ty;
      if (th === null) { x = cote * d; y = this.creux(d); tx = 1; ty = 0.42 * Math.exp(-d * 6) * cote; }
      else { const q = this.courbe(d, th); x = q[0]; y = q[1]; tx = verso ? -q[2] : q[2]; ty = verso ? -q[3] : q[3]; }
      const frais = !l.titre && e < 1 && l.u > e - 0.05;
      const coul = l.titre ? P.accent : frais ? P.accent : couleurDe({ poete: l.poete, ordre: l.ordre }, 10);
      lettre3D(l.c, pg.h, coul, x, y, l.Z, tx, ty, 0, 0, 0, 1, l.titre ? 0.9 : lumiere3D(l.ordre, L), l.titre);
      if (frais) L.ici();
    }
  }
  dessiner() {
    const P = palette(), r = rythme(), L = this.lec;
    camera3D(Math.min(W * 0.36, H * 0.54) * respire3D(r), 3.4);
    E3.m = rot3(-0.92 + 0.03 * Math.sin(L.t * 0.06), this.lacet, 0);
    E3.dos = 0; E3.ombre = 0.1; E3.z0 = E3.D - 0.8; E3.z1 = E3.D + 0.8;
    // ou en est le livre : la page de droite, et celle qui tourne
    let pr = 0;
    while (pr + 1 < this.pages.length && L.tr >= this.pages[pr + 1].i0 * L.pas) pr++;
    const tTour = pr > 0 ? (L.tr - this.pages[pr].i0 * L.pas) / this.tourne : 1;
    const tourne = pr > 0 && tTour < 1 ? this.pages[pr - 1] : null;
    const gauche = tourne ? (pr >= 2 ? this.pages[pr - 2] : this.titre) : (pr >= 1 ? this.pages[pr - 1] : this.titre);
    const papier = papier3D();
    ctx.save();
    // l'epaisseur du livre, sous les pages
    for (let k = 3; k >= 1; k--) for (const c of [-1, 1]) {
      const y = -0.012 * k;
      ligne3D([0, y, LIVRE_H / 2, c * (1 - 0.004 * k), y, LIVRE_H / 2, c * (1 - 0.004 * k), y, -LIVRE_H / 2, 0, y, -LIVRE_H / 2], P.note, 0.22, 1);
    }
    this.peindre(this.feuille(-1, null), papier, P);
    this.peindre(this.feuille(1, null), papier, P);
    ligne3D([0, 0, LIVRE_H / 2, 0, 0, -LIVRE_H / 2], P.note, 0.5, 1);
    this.ecrirePage(gauche, -1, null, false, P);
    this.ecrirePage(this.pages[pr], 1, null, false, P);
    poser3D();
    if (tourne) {
      const th = Math.PI * lisse(tTour);
      this.peindre(this.feuille(1, th), papier, P);
      this.ecrirePage(tourne, 1, th, false, P);
      this.ecrirePage(tourne, 1, th, true, P);
      poser3D();
    }
    ctx.restore();
  }
}

/* ================================================================ scene : le drape */

// Un tissu de vers pendu a une tringle, que le vent souleve : chaque vers est une ligne tissee dans
// l'etoffe, ecrite de haut en bas ; les plis se creusent, les lettres de biais palissent, celles
// des plis retournes se voient de dos. Les basses gonflent le vent.
class SceneDrape {
  constructor(poeme) {
    this.lec = new Lecture3D(poeme);
    const L = this.lec, n = L.n, K = this.K = Math.min(n, 9);
    const lu = L.vers.map(v => lettresLe(casse(v.texte)));
    const plusLong = Math.max(...lu.map(x => x.L));
    const ecart = K > 1 ? 1.6 / (K - 1) : 0.6;
    this.h = Math.min(clamp(ecart * 0.62, 0.06, 0.15), 2.35 / plusLong) * clamp(S.taille, 0.6, 1.4);
    this.lignes = L.vers.map((v, i) => ({
      lettres: lu[i].lettres.map(l => ({ c: l.c, x: (l.s - lu[i].L / 2) * this.h, u: l.s / lu[i].L })),
      y: K > 1 ? 0.8 - (i % K) * ecart : 0, poete: v.poete, ordre: i, fin: i + K < n ? (i + K) * L.pas : Infinity,
    }));
    this.tau = hasard(0, 50);
    montrerCartel(poeme);
  }
  maj(dt) {
    const L = this.lec;
    L.avancer(dt);
    const r = rythme();
    this.tau += dt * 0.9 * S.t3Rotation * (1 + r.b * 0.5 * S.t3Musique);
    if (L.finit) montrerCartel(null);
    return L.fini;
  }
  // l'etoffe : le point (x, y) du tissu au repos, deplace par le vent ; et ses deux pentes
  pli(x, y, A) {
    const t = this.tau, libre = clamp((0.95 - y) / 1.9, 0, 1), g = 0.22 + 0.78 * Math.pow(libre, 1.2), dg = -0.78 * 1.2 * Math.pow(libre, 0.2) / 1.9;
    const a1 = 2.1 * x + 1.7 * y - 1.3 * t, a2 = 3.7 * x - 0.8 * y + 0.9 * t, a3 = 1.2 * x + 2.6 * y - 0.6 * t + 2;
    const s1 = Math.sin(a1), s2 = Math.sin(a2), s3 = Math.sin(a3), c1 = Math.cos(a1), c2 = Math.cos(a2), c3 = Math.cos(a3);
    const w = 0.55 * s1 + 0.3 * s2 + 0.25 * s3;
    const wx = 1.155 * c1 + 1.11 * c2 + 0.3 * c3, wy = 0.935 * c1 - 0.24 * c2 + 0.65 * c3;
    const sx = 0.06 * S.t3Vent * g * Math.sin(0.6 * t + 1.3 * y);
    return [x + sx, y, A * g * w, A * g * wx, A * (dg * w + g * wy)];
  }
  dessiner() {
    const P = palette(), r = rythme(), L = this.lec;
    camera3D(Math.min(W * 0.27, H * 0.37) * respire3D(r), 3.4);
    E3.m = rot3(0.14, 0.4 * Math.sin(L.t * 0.07 * S.t3Rotation + 1), 0.03);
    E3.ombre = 0.45; E3.z0 = E3.D - 0.5; E3.z1 = E3.D + 0.5;
    const A = 0.46 * S.t3Vent * (1 + (r.b * 0.5 + r.coup * 0.25 + notes3D.force(0.5) * 0.35) * S.t3Musique);
    ctx.save();
    // la tringle, les bords et quelques plis
    ligne3D([-1.42, 0.97, 0, 1.42, 0.97, 0], P.note, 0.7, 2);
    const bord = (fx) => { const pts = []; for (let k = 0; k <= 24; k++) { const y = 0.95 - 1.9 * k / 24, q = this.pli(fx, y, A); pts.push(q[0], q[1], q[2]); } return pts; };
    for (const fx of [-1.3, -0.65, 0, 0.65, 1.3]) ligne3D(bord(fx), P.note, Math.abs(fx) > 1.2 ? 0.4 : 0.12, 1);
    const bas = [];
    for (let k = 0; k <= 32; k++) { const x = -1.3 + 2.6 * k / 32, q = this.pli(x, -0.95, A); bas.push(q[0], q[1], q[2]); }
    ligne3D(bas, P.note, 0.4, 1);
    for (const li of this.lignes) {
      if (L.tr < li.ordre * L.pas) continue;
      const vie = li.fin === Infinity ? 1 : clamp(1 - (L.tr - li.fin) / 0.8, 0, 1);
      if (vie <= 0) continue;
      const ecrit = L.ecrit(li.ordre), lum = vie * lumiere3D(li.ordre, L);
      const coul = couleurDe({ poete: li.poete, ordre: li.ordre }, 10);
      for (const l of li.lettres) {
        if (l.u > ecrit) continue;
        const q = this.pli(l.x, li.y, A);
        const frais = ecrit < 1 && l.u > ecrit - 0.07;
        lettre3D(l.c, this.h, frais ? P.accent : coul, q[0], q[1], q[2], 1, 0, q[3], 0, 1, q[4], lum);
        if (frais) L.ici();
      }
    }
    poser3D();
    ctx.restore();
  }
}

/* ================================================================ dans le panneau et dans la rotation */

ajouterScene({ cle: "globe", nom: "Le globe (chaque vers est un parallèle)", fabrique: p => new SceneGlobe(p), calme: true });
ajouterScene({ cle: "noeud", nom: "Le nœud (le poème s'écrit sur un nœud)", fabrique: p => new SceneNoeud(p), calme: true });
ajouterScene({ cle: "helice", nom: "L'hélice (deux brins de vers, des barreaux de mots)", fabrique: p => new SceneHelice(p), plein: true });
ajouterScene({ cle: "moebius", nom: "Le ruban de Möbius (le vers passe de l'autre côté)", fabrique: p => new SceneMoebius(p), calme: true });
ajouterScene({ cle: "galaxie", nom: "La galaxie (les vers tournent autour d'un cœur)", fabrique: p => new SceneGalaxie(p), calme: true, continue: true });
ajouterScene({ cle: "champ", nom: "Le champ (une houle de vers à perte de vue)", fabrique: p => new SceneChamp(p), plein: true, continue: true });
ajouterScene({ cle: "fontaine", nom: "Le jet d'eau (Apollinaire en relief)", fabrique: p => new SceneFontaine(p), plein: true });
// Jiiji (2026-10-19) : « le livre je trouve ca moche », « c'est le trait fait de mots qui est beau ».
// Il reste dans la liste, hors de « Toutes », du pilote et des combos.
ajouterScene({ cle: "livre", nom: "Le livre (les pages tournent)", fabrique: p => new SceneLivre(p), auto: false, calme: false, plein: false, calque: false });
ajouterScene({ cle: "drape", nom: "Le drapé (un tissu de vers dans le vent)", fabrique: p => new SceneDrape(p), calme: true, plein: true });

ajouterReglages("Scènes 3D", "Toutes les scènes en relief", [
  { cle: "t3Rotation", nom: "Les formes tournent (vitesse)", type: "curseur", min: 0, max: 3, pas: 0.05 },
  { cle: "t3Guide", nom: "La forme se tourne vers le vers qu'on lit (0 : jamais)", type: "curseur", min: 0, max: 1, pas: 0.05 },
  { cle: "t3Perspective", nom: "Perspective (plus fort : la forme vient vers nous)", type: "curseur", min: 0.4, max: 2, pas: 0.05 },
  { cle: "t3Brouillard", nom: "Brouillard de profondeur", type: "curseur", min: 0, max: 1, pas: 0.05 },
  { cle: "t3Dos", nom: "Lettres vues de dos (à travers la forme)", type: "curseur", min: 0, max: 1, pas: 0.05 },
  { cle: "t3Musique", nom: "La musique et les notes font respirer les formes", type: "curseur", min: 0, max: 2, pas: 0.05 },
  { cle: "t3Poussiere", nom: "Une poussière d'étoiles autour des formes", type: "case" },
], { t3Rotation: 1, t3Guide: 0.7, t3Perspective: 1, t3Brouillard: 0.6, t3Dos: 0.22, t3Musique: 1, t3Poussiere: true });
ajouterReglages("Scènes 3D", "Une par une", [
  { cle: "t3Noeud", nom: "Le nœud", type: "choix", options: [["hasard", "Au hasard, à chaque poème"], ["trefle", "Trèfle"], ["cinq", "Cinq lobes"],
    ["sept", "Sept lobes"], ["etoile", "Étoile (3, 4)"], ["fleur", "Fleur (3, 5)"], ["lotus", "Lotus (5, 3)"]] },
  { cle: "t3Bras", nom: "Bras de la galaxie", type: "curseur", min: 2, max: 6, pas: 1 },
  { cle: "t3Houle", nom: "La houle du champ", type: "curseur", min: 0, max: 2, pas: 0.05 },
  { cle: "t3Lever", nom: "Les lettres du champ se lèvent vers nous", type: "curseur", min: 0, max: 1, pas: 0.05 },
  { cle: "t3Vent", nom: "Le vent dans le drapé", type: "curseur", min: 0, max: 2, pas: 0.05 },
], { t3Noeud: "hasard", t3Bras: 3, t3Houle: 1, t3Lever: 0.35, t3Vent: 1 });
