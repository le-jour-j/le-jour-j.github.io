"use strict";
/* ================================================================ VJ : ce que la musique donne aux scenes */

// Basses, mediums, aigus, le temps fort qui retombe (coup) et l'instant du temps fort (neuf).
// Sans musique, le flash (rond, Entree) tient lieu de temps fort.
// Les basses font battre les mots a la force choisie par Jiiji. Le pilote ne l'ecrase plus
// (2026-10-17 : « il regle trop bas tout le temps le side chain du kick sur les mots ») : il la
// part de son reglage et monte jusqu'a 1.4 fois au plus fort, jamais en dessous.
function pulseMots() {
  return S.musiquePulse * (S.pilote && pilote.actif && S.piloteEffets ? 1 + 0.4 * pilote.intensite : 1);
}
// la taille d'un mot sur le son : les basses (k : leur poids dans la scene) et le kick
function battementMots(k) {
  if (!(S.musique && musique.actif)) return 1;
  const e = musique.env || [0, 0, 0];
  const kick = (e[0] * S.kickMots + e[1] * S.caisseMots + e[2] * S.charleyMots) * k * 2.2;
  return Math.max(0.15, 1 + musique.basses * k * pulseMots() + (S.kickSens === "ecrase" ? -kick * 0.7 : kick));
}
// ce qu'un effet ecoute (onglet « Le son mène »)
function sourceMusique(nom) {
  const m = musique;
  switch (nom) {
    case "basses": return m.basses; case "mediums": return m.mediums; case "aigus": return m.aigus;
    case "kick": return m.sc || 0; case "contretemps": return 1 - (m.sc || 0); case "volume": return m.niveau;
    case "caisse": return m.env ? m.env[1] : 0; case "charley": return m.env ? m.env[2] : 0;
    case "mesure": return 0.5 - 0.5 * Math.cos((m.phase || 0) * Math.PI / 2);
  }
  return 0;
}
function rythme() {
  const on = S.musique && musique.actif;
  return { on, b: on ? musique.basses : 0, m: on ? musique.mediums : 0, a: on ? musique.aigus : 0,
    coup: Math.max(on ? musique.coup : 0, clamp(live.mod.flash * 0.6, 0, 1)), neuf: Math.max(on ? musique.coupNeuf : 0, live.coupNeuf) };
}

// un mot plus grand que les vignettes : ecrit directement, sans cache (ils sont peu nombreux)
const GRAND = 168;
function ecrireGrand(t, taille, couleur, x, y, ang, alpha) {
  if (alpha <= 0.004 || taille < 1) return;
  if (taille <= GRAND) return poserLettre(t, taille, couleur, x, y, ang, alpha);
  taille *= battementMots(0.08);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.translate(x, y);
  if (ang) ctx.rotate(ang);
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.font = police(taille); ctx.fillStyle = couleur;
  ctx.fillText(t, 0, 0);
}

// les lettres d'un texte autour d'un cercle : l'angle du milieu de chaque lettre, en tours
function lettresEnRond(texte, pol) {
  const ws = [...texte].map(c => mesurer(c, pol));
  const L = ws.reduce((a, b) => a + b, 0) || 1;
  const out = [];
  let x = 0, j = 0;
  for (const c of texte) {
    const w = ws[j];
    if (c.trim()) out.push({ c, u: (x + w / 2) / L, j, graine: Math.random() * 1000 });
    x += w; j++;
  }
  return { lettres: out, L };
}

/* ================================================================ scene : le puits */

// On tombe dans un puits fait de vers. Chaque vers est un anneau ecrit tout autour de nous, qui
// monte du fond et nous depasse ; entre eux, les parois sont des mots du recueil, en anneaux
// pales. Le puits se tord lentement, chaque anneau tourne sur lui-meme ; un temps fort nous y
// precipite. Le puits continue d'un poeme a l'autre.
const puits = { anneaux: [], d: 0, elan: 0, paroi: 0 };
const PUITS_LOIN = 10, PUITS_PRES = 0.3;
class ScenePuits {
  constructor(poeme) {
    this.poeme = poeme; this.t = 0;
    this.vers = versDe(poeme);
    this.intervalle = clamp(tenue() / Math.max(1, this.vers.length), 2.5, 6);
    this.i = 0; this.prochain = 0.2;
    this.fin = null;
    montrerCartel(poeme);
  }
  anneau(texte, poete, ordre, estVers) {
    let t = casse(texte) + (estVers ? "  ·  " : "    ");
    const pol = police(100);
    let { L } = lettresEnRond(t, pol);
    // un vers court fait plusieurs fois le tour : ses lettres ne depassent pas le tiers du rayon
    const fois = Math.max(1, Math.ceil(Math.PI * 2 * 100 / (L * 0.34)));
    t = t.repeat(fois);
    const r = lettresEnRond(t, pol);
    return { lettres: r.lettres, k: Math.PI * 2 * 100 / r.L, z: PUITS_LOIN, rot: hasard(0, 6.3),
      vr: hasard(0.04, 0.12) * (ordre % 2 ? 1 : -1), poete, ordre, estVers, texte };
  }
  maj(dt) {
    this.t += dt;
    const r = rythme();
    if (r.neuf) puits.elan += 0.9 * pulseMots();
    puits.elan *= Math.exp(-dt * 2.5);
    const v = (0.65 + r.b * 0.8 * pulseMots() + puits.elan) * dt * S.puitsVitesse;
    puits.d += v;
    for (const a of puits.anneaux) { a.z -= v; a.rot += a.vr * dt * (1 + r.m * 1.5); }
    puits.anneaux = puits.anneaux.filter(a => a.z > PUITS_PRES);
    this.prochain -= dt;
    if (this.prochain <= 0 && this.i < this.vers.length) {
      const vs = this.vers[this.i];
      puits.anneaux.push(this.anneau(vs.texte, vs.poete, this.i, true));
      annoncerVers(vs.texte, vs.poete, this.i);
      this.i++; this.prochain = this.intervalle;
    }
    // les parois : un anneau de mots du recueil tous les quelques pas
    puits.paroi -= v;
    if (puits.paroi <= 0 && S.puitsParois > 0) {
      puits.paroi = 0.6 / S.puitsParois;
      const mots = D.corpus.length ? Array.from({ length: 7 }, () => tirer(D.corpus)).join(" ") : motsPleins(tirer(this.vers).texte).join(" ");
      puits.anneaux.push(this.anneau(mots || "poïasie", "", 0, false));
    }
    if (puits.anneaux.length > 60) puits.anneaux.splice(0, puits.anneaux.length - 60);
    if (this.i >= this.vers.length && this.fin === null) this.fin = this.t;
    if (this.fin !== null && this.t - this.fin > 3) montrerCartel(null);
    // le dernier vers n'a pas fini de monter : le poeme suivant le suit dans le meme puits
    return this.fin !== null && this.t - this.fin > 9;
  }
  dessiner() {
    const P = palette(), r = rythme();
    const F = Math.min(W, H) * 0.42 * (1 + r.coup * 0.05 * pulseMots());
    ctx.save();
    const tri = puits.anneaux.slice().sort((a, b) => b.z - a.z);
    const lot = lettresGl.ouvrir();  // les lettres de la scene partent en un lot a la carte
    for (const a of tri) {
      const R = F / a.z, k = a.k * R;
      if (k < 3) continue;
      // le puits se tord : le fond s'ecarte du centre, l'entree reste au milieu
      const tor = a.z / PUITS_LOIN;
      const cx = W / 2 + Math.sin((puits.d + a.z) * 0.33) * W * 0.22 * tor * S.puitsTorsion;
      const cy = H / 2 + Math.cos((puits.d + a.z) * 0.27) * H * 0.18 * tor * S.puitsTorsion;
      const loin = clamp((PUITS_LOIN - a.z) / 2.5, 0, 1), pres = clamp((a.z - PUITS_PRES) / 0.7, 0, 1);
      const alpha = loin * pres * (a.estVers ? 1 : 0.26 + 0.3 * r.a);
      if (alpha <= 0.01) continue;
      // en passant pres de nous, l'anneau du vers s'allume a la couleur vive, en fondu (avant :
      // d'un coup a 3,2 et d'un coup a 2,2)
      const couleur = a.estVers ? couleurDe({ poete: a.poete, ordre: a.ordre }, 10) : P.note;
      const vif = a.estVers ? lisse((3.4 - a.z) / 0.4) * lisse((a.z - 2.0) / 0.4) : 0;
      if (a.estVers && !a.annonce && alpha > 0.05) {
        a.annonce = true;
        a.texte.split(/\s+/).filter(Boolean).forEach((m, i) => annoncerMot({}, m, cx, cy, a.poete, coursDe(m), i));
      }
      for (const l of a.lettres) {
        const th = l.u * Math.PI * 2 + a.rot;
        const x = cx + Math.cos(th) * R, y = cy + Math.sin(th) * R;
        if (x < -k || x > W + k || y < -k || y > H + k) continue;
        if (vif > 0) poserFondu(l.c, k, couleur, P.accent, vif, x, y, th + Math.PI / 2, alpha);
        else poserLettre(l.c, k, couleur, x, y, th + Math.PI / 2, alpha);
      }
    }
    if (lot) lettresGl.fermer();
    ctx.restore();
  }
}

/* ================================================================ scene : les cretes */

// Le pouls du poeme, a la maniere de la pochette d'Unknown Pleasures (le pulsar CP 1919, 1970) :
// des lignes de vers empilees, chacune soulevee au milieu par des cretes. Avec la musique, les
// cretes sont son spectre (les basses au centre) ; sans elle, le poeme bat a sa facon. La ligne
// neuve nait en bas et pousse les autres vers le haut ; chaque ligne cache ce qui passe derriere.
const cretes = { lignes: [], prochaine: 0, n: 17 };
const CRETES_PAS = 0.5;  // une ligne neuve toutes les demi-secondes
class SceneCretes {
  constructor(poeme) {
    this.poeme = poeme; this.t = 0;
    this.vers = versDe(poeme);
    this.intervalle = clamp(tenue() / Math.max(1, this.vers.length), 3, 7);
    this.duree = this.vers.length * this.intervalle + 1;
    cretes.n = Math.round(S.cretesLignes);
    cretes.lignes = cretes.lignes.filter(L => L.W === W && L.H === H);
    montrerCartel(poeme);
  }
  get esp() { return H * 0.62 / cretes.n; }
  ligne(v, iv) {
    const r = rythme(), p = new Float32Array(64);
    const bosses = Array.from({ length: 4 }, () => ({ c: hasard(0.36, 0.64), l: hasard(0.02, 0.07), h: hasard(0.15, 1) }));
    for (let k = 0; k < 64; k++) {
      const x = k / 63, env = Math.exp(-Math.pow((x - 0.5) / 0.17, 2));
      let h = 0;
      if (r.on) h = musique.spectre(Math.abs(x - 0.5) * 1.7 + hasard(0, 0.04)) * 1.15;
      else for (const b of bosses) h += b.h * Math.exp(-Math.pow((x - b.c) / b.l, 2));
      p[k] = h * env * (1 + r.coup * 0.5 * pulseMots()) + hasard(0, 0.035);
    }
    // le vers recommence jusqu'a remplir la largeur
    const fs = this.esp * 0.85 * clamp(S.taille, 0.6, 1.6), pol = police(fs);
    const gauche = W * 0.1, droite = W * 0.9, lettres = [];
    const texte = casse(v.texte) + "  ·  ";
    let x = gauche, j = 0;
    while (x < droite && j < 2000) {
      const c = texte[j % texte.length], w = mesurer(c, pol);
      if (x + w > droite) break;
      if (c.trim()) lettres.push({ c, x: x + w / 2 });
      x += w; j++;
    }
    return { p, lettres, fs, poete: v.poete, ordre: iv, age: 0, W, H };
  }
  hauteur(L, x) {
    const u = clamp((x - W * 0.1) / (W * 0.8), 0, 1) * 63, k = Math.floor(u);
    return lerp(L.p[k], L.p[Math.min(63, k + 1)], u - k);
  }
  maj(dt) {
    this.t += dt;
    cretes.prochaine -= dt;
    if (cretes.prochaine <= 0) {
      cretes.prochaine = CRETES_PAS;
      const iv = Math.min(this.vers.length - 1, Math.floor(this.t / this.intervalle));
      cretes.lignes.push(this.ligne(this.vers[iv], iv));
      if (iv !== this.annonce) {
        // un vers neuf nait en bas : il est annonce, ses mots aussi
        this.annonce = iv;
        const vv = this.vers[iv];
        annoncerVers(vv.texte, vv.poete, iv);
        vv.texte.split(/\s+/).filter(Boolean).forEach((m, i) => annoncerMot({}, m, W * (0.15 + 0.7 * i / 12), H * 0.82, vv.poete, coursDe(m), i));
      }
    }
    for (const L of cretes.lignes) L.age += dt;
    cretes.lignes = cretes.lignes.filter(L => L.age < CRETES_PAS * (cretes.n + 1));
    if (this.t > this.duree - 1.5) montrerCartel(null);
    return this.t > this.duree;
  }
  dessiner() {
    const P = palette(), esp = this.esp, A = H * 0.17 * S.cretesHauteur;
    const bas = H * 0.86 - (S.cartel ? H * 0.04 : 0);
    ctx.save();
    const lot = lettresGl.ouvrir();  // les lettres de la scene partent en un lot a la carte
    // des plus vieilles (en haut) aux plus neuves (en bas) : chaque ligne cache celles de derriere
    for (const L of cretes.lignes) {
      const k = L.age / CRETES_PAS;
      const yb = bas - k * esp;
      const alpha = clamp(k / 0.6, 0, 1) * clamp((cretes.n + 1 - k) / 2.5, 0, 1);
      if (alpha <= 0.01) continue;
      // le cache : sous la crete, la couleur du fond (sur un calque, on efface)
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(W * 0.1, yb + esp * 0.5);
      for (let q = 0; q <= 64; q++) { const x = W * 0.1 + W * 0.8 * q / 64; ctx.lineTo(x, yb - this.hauteur(L, x) * A + L.fs * 0.15); }
      ctx.lineTo(W * 0.9, yb + esp * 0.5);
      ctx.closePath();
      if (enCalque) { ctx.globalCompositeOperation = "destination-out"; ctx.fillStyle = "#000"; ctx.fill(); ctx.globalCompositeOperation = "source-over"; }
      else { ctx.fillStyle = fondCache ? fondCache.style : P.fond[0]; ctx.fill(); }
      if (lot) {
        // dans le lot, les lettres des lignes de derriere sont deja rangees : le meme cache les efface
        const pts = [], yBas = DPR * (yb + esp * 0.5);
        for (let q = 0; q <= 64; q++) { const x = W * 0.1 + W * 0.8 * q / 64; pts.push(DPR * x, DPR * (yb - this.hauteur(L, x) * A + L.fs * 0.15), DPR * x, yBas); }
        ctx.globalAlpha = 1;
        lettresGl.effacer(pts);
      }
      // la ligne neuve est de la couleur vive, puis prend celle de son poete en fondu (avant :
      // d'un coup) ; ses lettres gardent leur taille : vignettes nettes
      const f = clamp((k - 0.9) / 0.6, 0, 1);
      const couleur = couleurDe({ poete: L.poete, ordre: L.ordre }, 10);
      const lum = alpha * lerp(1, 0.55, clamp(k / cretes.n, 0, 1));
      for (const l of L.lettres) {
        const h = this.hauteur(L, l.x), pente = (this.hauteur(L, l.x + 6) - this.hauteur(L, l.x - 6)) * A / 12;
        poserFondu(l.c, L.fs, P.accent, couleur, f, l.x, yb - h * A, -Math.atan(pente), lum, undefined, undefined, false, true);
      }
    }
    if (lot) lettresGl.fermer();
    ctx.restore();
  }
}

/* ================================================================ scene : l'averse */

// Il pleut des lettres. Chaque colonne laisse tomber le poeme lu de haut en bas, une goutte
// claire en tete et une traine qui s'eteint. Le vers du moment attend au milieu de l'ecran,
// invisible : chaque lettre n'apparait que quand une goutte passe sur sa case, et le vers se
// forme ainsi sous la pluie. Au vers suivant, il fond et ruisselle. Un temps fort lache une averse.
const averse = { cols: [], W: 0, H: 0, fs: 0, pas: 0, lignes: 0 };
class SceneAverse {
  constructor(poeme) {
    this.poeme = poeme; this.t = 0;
    this.vers = versDe(poeme);
    this.flot = casse(this.vers.map(v => v.texte).join("   "));
    this.intervalle = clamp(tenue() / Math.max(1, this.vers.length), 5, 10);
    this.duree = this.vers.length * this.intervalle + 2.5;
    this.i = -1; this.pose = []; this.tombees = []; this.debutVers = 0;
    const fs = clamp(Math.min(W, H) * 0.024, 12, 28) * clamp(S.taille, 0.5, 1.8);
    if (averse.W !== W || averse.H !== H || Math.abs(averse.fs - fs) > 0.5) this.semer(fs);
    montrerCartel(poeme);
  }
  semer(fs) {
    averse.W = W; averse.H = H; averse.fs = fs; averse.pas = fs * 1.12;
    const n = Math.max(8, Math.floor(W / fs));
    averse.cols = Array.from({ length: n }, (_, k) => ({ x: (k + 0.5) * W / n, gouttes: [] }));
    averse.lignes = Math.ceil(H / averse.pas) + 1;
  }
  goutte(c, tete, v) {
    if (c.gouttes.length >= Math.max(3, Math.round(3 * S.averseDensite))) return;
    c.gouttes.push({ tete: tete !== undefined ? tete : -hasard(0, 5), avant: -99, v: v || hasard(4, 11), L: Math.floor(hasard(6, 22)),
      o: Math.floor(Math.random() * 100000) });
  }
  poser(v, iv) {
    if (v.texte) annoncerVers(v.texte, v.poete, iv);
    for (const l of this.pose) if (l.attrape) this.tombees.push(Object.assign(l, { dy: 0, vy: hasard(0, 60), age: 0 }));
    this.pose = [];
    this.debutVers = this.t;
    const nc = averse.cols.length, max = Math.max(6, nc - 4);
    // le vers coupe en lignes qui tiennent dans les colonnes
    const lignes = [];
    let cour = "";
    for (const m of casse(v.texte).split(/\s+/).filter(Boolean)) {
      const essai = cour ? cour + " " + m : m;
      if (essai.length > max && cour) { lignes.push(cour); cour = m; } else cour = essai;
    }
    if (cour) lignes.push(cour.slice(0, max));
    const r0 = Math.round(averse.lignes * 0.46 - lignes.length) + (iv % 2 ? 1 : -1);
    lignes.forEach((ligne, il) => {
      const c0 = Math.floor((nc - ligne.length) / 2), row = clamp(r0 + il * 2, 2, averse.lignes - 3);
      [...ligne].forEach((ch, j) => {
        if (!ch.trim()) return;
        const col = c0 + j;
        // la premiere lettre d'un mot porte le mot : il parait quand la goutte la trouve
        const mot = j === 0 || !ligne[j - 1].trim() ? ligne.slice(j).split(" ")[0] : null;
        this.pose.push({ c: ch, col, row, attrape: false, quand: 0, poete: v.poete, ordre: iv, graine: Math.random() * 1000, mot });
        // une goutte part vers chaque lettre, pour que le vers se forme en une seconde ou deux
        this.goutte(averse.cols[col], -hasard(0, 8), (row + 8) / hasard(1.2, 3));
      });
    });
  }
  maj(dt) {
    this.t += dt;
    const r = rythme();
    const vit = (1 + r.b * 1.5 * pulseMots()) * S.averseVitesse;
    let n = averse.cols.length * 0.2 * S.averseDensite * dt + (r.neuf ? averse.cols.length * 0.3 * pulseMots() : 0);
    while (n > 0) { if (n >= 1 || Math.random() < n) this.goutte(tirer(averse.cols)); n -= 1; }
    const occupe = new Map();
    for (const l of this.pose) if (!l.attrape) { if (!occupe.has(l.col)) occupe.set(l.col, []); occupe.get(l.col).push(l); }
    averse.cols.forEach((c, ic) => {
      for (const g of c.gouttes) {
        g.avant = g.tete;
        g.tete += g.v * vit * dt;
        const attente = occupe.get(ic);
        if (attente) for (const l of attente) if (!l.attrape && g.avant < l.row && g.tete >= l.row) { l.attrape = true; l.quand = this.t; }
      }
      c.gouttes = c.gouttes.filter(g => g.tete - g.L < averse.lignes);
    });
    // une lettre que la pluie n'a pas trouvee vient d'elle-meme
    for (const l of this.pose) if (!l.attrape && this.t - this.debutVers > 3.6) { l.attrape = true; l.quand = this.t; }
    const nv = Math.min(this.vers.length - 1, Math.floor((this.t - 0.4) / this.intervalle));
    if (this.t > 0.4 && nv > this.i) { this.i = nv; this.poser(this.vers[nv], nv); }
    for (const l of this.tombees) { l.age += dt; l.vy += 700 * dt; l.dy += l.vy * dt; }
    this.tombees = this.tombees.filter(l => l.age < 1.6);
    if (this.t > this.duree - 2) montrerCartel(null);
    if (this.t > this.duree - 1.2 && this.pose.length) this.poser({ texte: "", poete: "" }, 0);
    return this.t > this.duree;
  }
  dessiner() {
    const P = palette(), fs = averse.fs, pas = averse.pas, flot = this.flot;
    const tete = P.clair ? P.texte : "#ffffff", pluie = P.clair || P.mono ? P.note : P.note;
    const pris = new Set();
    for (const l of this.pose) if (l.attrape) pris.add(l.col * 1000 + l.row);
    ctx.save();
    const lot = lettresGl.ouvrir();  // les lettres de la scene partent en un lot a la carte
    averse.cols.forEach((c, ic) => {
      for (const g of c.gouttes) {
        const h = Math.floor(g.tete);
        for (let k = 0; k < g.L; k++) {
          const row = h - k;
          if (row < 0 || row >= averse.lignes || pris.has(ic * 1000 + row)) continue;
          const ch = flot[(g.o + row) % flot.length];
          if (ch === " ") continue;
          // les gouttes gardent leur taille : vignettes nettes (et les plus pales ne sont pas posees)
          const a = k === 0 ? 1 : (1 - k / g.L) * 0.75;
          if (a < 0.03) continue;
          poserLettre(ch, fs, k === 0 ? tete : pluie, c.x, row * pas + pas / 2, 0, a, undefined, undefined, false, true);
        }
      }
    });
    for (const l of this.pose) {
      if (!l.attrape) continue;
      const age = Math.max(0, this.t - l.quand);
      const x = averse.cols[l.col].x, y = l.row * pas + pas / 2;
      if (l.mot && !l.annonce) annoncerMot(l, l.mot, x, y, l.poete, coursDe(l.mot), l.ordre);
      // la goutte qui se pose est de la couleur vive, puis de celle de son poete en fondu (avant :
      // d'un coup) ; posee, la lettre garde sa taille : vignette nette
      poserFondu(l.c, fs * (1.15 + 0.6 * Math.max(0, 1 - age * 3)), P.accent, couleurDe({ poete: l.poete, ordre: l.ordre }, 10), (age - 0.3) / 0.35,
        x, y, 0, 1, l.graine, 60, false, age > 0.34);
    }
    for (const l of this.tombees) {
      poserLettre(l.c, fs * 1.15, couleurDe({ poete: l.poete, ordre: l.ordre }, 10), averse.cols[l.col] ? averse.cols[l.col].x : 0,
        l.row * pas + pas / 2 + l.dy, 0, 1 - l.age / 1.6, undefined, undefined, false, true);
    }
    if (lot) lettresGl.fermer();
    ctx.restore();
  }
}

/* ================================================================ scene : la rosace */

// Le vers en rosace, comme un vitrail ou un mandala : chaque vers d'une strophe tourne en
// anneau autour du centre, recopie autant de fois qu'il le faut pour faire le tour (la
// symetrie vient de sa longueur). Les copies s'ecrivent toutes ensemble ; les anneaux tournent
// en sens contraires, respirent sur les temps forts, et le mot le plus rare de la strophe tient
// le coeur. Une rosace par strophe : l'ancienne s'ouvre et s'envole.
class SceneRosace {
  constructor(poeme) {
    this.poeme = poeme; this.t = 0;
    this.rosaces = [];
    for (const s of strophesDe(poeme)) for (let i = 0; i < s.length; i += 4) this.rosaces.push(s.slice(i, i + 4));
    this.dureeRosace = clamp(tenue() / this.rosaces.length, 8, 22);
    this.ir = -1; this.debut = 0;
    this.anneaux = []; this.partants = [];
    this.suivante();
    montrerCartel(poeme);
  }
  suivante() {
    this.ir++;
    for (const a of this.anneaux) { a.part = this.t; this.partants.push(a); }
    this.anneaux = [];
    this.debut = this.t;
    if (this.ir >= this.rosaces.length) return;
    // les vers les plus longs a l'exterieur, ou il y a de la place
    const vers = this.rosaces[this.ir].slice().sort((a, b) => a.texte.length - b.texte.length);
    this.rosaces[this.ir].forEach((v, i) => annoncerVers(v.texte, v.poete, i));
    const M = Math.min(W, H - (S.cartel ? H * 0.1 : 0)), Rmax = M * 0.45, Rmin = M * 0.17;
    const cible = clamp(M * 0.03, 13, 30) * clamp(S.taille, 0.5, 1.8);
    const pol = police(100);
    vers.forEach((v, k) => {
      const R = vers.length === 1 ? Rmax * 0.75 : lerp(Rmin, Rmax, k / (vers.length - 1));
      const texte = casse(v.texte) + "    ";
      const { lettres, L } = lettresEnRond(texte, pol);
      const N = clamp(Math.round(Math.PI * 2 * R * 100 / (L * cible)), 1, Math.round(S.rosaceCopies));
      const fs = Math.min(Math.PI * 2 * R * 100 / (L * N), R * 0.45);
      const toutes = [];
      for (let q = 0; q < N; q++) for (const l of lettres) toutes.push({ c: l.c, a: (q + l.u) / N * Math.PI * 2, j: l.j, graine: l.graine + q });
      // les mots du vers, a l'endroit de leur premiere lettre (pour les annoncer quand ils s'ecrivent)
      const mots = [];
      let pos = 0;
      for (const m of texte.split(" ")) { if (m) mots.push({ m, u: pos / texte.length }); pos += m.length + 1; }
      this.anneaux.push({ lettres: toutes, R, fs, n: texte.length, sens: k % 2 ? 1 : -1, rot: hasard(0, 6.3), poete: v.poete, ordre: k, ne: this.t + k * 0.5, mots });
    });
    // au coeur, le mot le plus rare de la strophe, a la taille du trou
    const mots = vers.flatMap(v => motsPleins(v.texte));
    this.coeur = mots.length ? casse(mots.reduce((a, b) => coursDe(b) > coursDe(a) ? b : a)) : "";
    this.tailleCoeur = this.coeur ? Math.min(M * 0.08, Rmin * 1.5 * 100 / mesurer(this.coeur, pol)) : 0;
  }
  maj(dt) {
    this.t += dt;
    const r = rythme();
    for (const a of this.anneaux.concat(this.partants)) a.rot += a.sens * dt * (0.05 + r.m * 0.2) * (1 + r.coup * 0.5) * S.rosaceTourne;
    this.partants = this.partants.filter(a => this.t - a.part < 2.2);
    if (this.ir < this.rosaces.length && this.t - this.debut > this.dureeRosace) this.suivante();
    if (this.ir >= this.rosaces.length - 1 && this.t - this.debut > this.dureeRosace - 1.5) montrerCartel(null);
    return this.ir >= this.rosaces.length && !this.partants.length;
  }
  dessiner() {
    const P = palette(), r = rythme();
    const souffle = 1 + r.coup * 0.07 * pulseMots() + 0.015 * Math.sin(temps * 0.8);
    const cx = W / 2, cy = H / 2 - (S.cartel ? H * 0.04 : 0) + (S.bourse ? 12 : 0);
    ctx.save();
    const lot = lettresGl.ouvrir();  // les lettres de la scene partent en un lot a la carte
    for (const a of this.partants.concat(this.anneaux)) {
      const age = this.t - a.ne;
      if (age <= 0) continue;
      const ecrit = clamp(age / 3.5, 0, 1);  // le vers s'ecrit dans toutes ses copies a la fois
      let R = a.R * souffle, alpha = 1;
      if (a.part !== undefined) { const p = (this.t - a.part) / 2.2; R *= 1 + p * p * 1.4; alpha = 1 - p; }
      else R *= lerp(0.55, 1, sortie3(clamp(age / 1.4, 0, 1)));
      const k = R / a.R, couleur = couleurDe({ poete: a.poete, ordre: a.ordre }, 10);
      if (a.part === undefined) for (const m of a.mots) if (!m.annonce && m.u <= ecrit) annoncerMot(m, m.m, cx + Math.cos(a.rot) * R, cy + Math.sin(a.rot) * R, a.poete, coursDe(m.m), a.ordre);
      for (const l of a.lettres) {
        const u = l.j / a.n;
        if (u > ecrit) continue;
        const th = l.a + a.rot;
        poserLettre(l.c, a.fs * k, u > ecrit - 0.05 && ecrit < 1 ? P.accent : couleur, cx + Math.cos(th) * R, cy + Math.sin(th) * R,
          th + Math.PI / 2, alpha, l.graine, 60);
      }
    }
    if (this.coeur && this.ir < this.rosaces.length) {
      const age = this.t - this.debut;
      const a = clamp(age / 1.5, 0, 1) * clamp(this.dureeRosace - age, 0, 1);
      ecrireGrand(this.coeur, this.tailleCoeur * souffle, P.accent, cx, cy, 0, a);
    }
    if (lot) lettresGl.fermer();
    ctx.restore();
  }
}

/* ================================================================ scene : un mot par temps */

// La typographie qui bat, comme dans les clips : chaque temps fort pose le mot suivant du vers,
// en tres grand, sur toute la largeur. Les mots du vers s'empilent en un bloc qui recule a
// mesure qu'il grandit, puis s'en va d'un coup ; ou bien un seul mot tient l'ecran et les
// precedents s'enfoncent derriere lui en echo. Sans musique, le poeme bat a sa propre mesure.
class SceneBattement {
  constructor(poeme) {
    this.poeme = poeme; this.t = 0;
    this.vers = versDe(poeme);
    const nm = this.vers.reduce((a, v) => a + v.texte.split(/\s+/).filter(Boolean).length, 0);
    this.mesure = clamp(tenue() / Math.max(1, nm + this.vers.length), 0.45, 1.3);
    this.iv = -1; this.pile = []; this.reste = []; this.partants = [];
    this.attente = 0.3; this.dernier = -1; this.zoom = 1;
    this.fin = null;
    this.versSuivant();
    montrerCartel(poeme);
  }
  versSuivant() {
    this.iv++;
    for (const m of this.pile) { m.part = this.t; this.partants.push(m); }
    this.pile = [];
    if (this.iv >= this.vers.length) { this.fin = this.t; return; }
    const v = this.vers[this.iv];
    annoncerVers(v.texte, v.poete, this.iv);
    this.reste = v.texte.split(/\s+/).filter(Boolean).map(m => casse(m));
    this.poete = v.poete;
    // 0 : le bloc ; 1 : un seul mot, les autres en echo
    this.style = S.battementStyle === "bloc" ? 0 : S.battementStyle === "echo" ? 1 : Math.random() < 0.65 ? 0 : 1;
  }
  // un temps : le mot suivant ; apres le dernier mot du vers, le bloc s'en va
  frapper() {
    if (!this.reste.length) { this.versSuivant(); return; }
    const mot = this.reste.shift();
    const w100 = mesurer(mot, police(100));
    const fs = Math.min(100 * W * 0.8 / w100, H * 0.28) * clamp(S.taille, 0.5, 1.4);
    const cum = this.pile.reduce((a, m) => a + m.fs * 0.84, 0);
    this.pile.push({ mot, fs, cum, ne: this.t, cours: coursDe(mot), poete: this.poete, ordre: this.iv, style: this.style });
    annoncerMot({}, mot, W / 2, H / 2, this.poete, coursDe(mot), this.pile.length - 1);
  }
  hauteur() {
    if (this.style === 1) return this.pile.length ? this.pile[this.pile.length - 1].fs : 1;
    return this.pile.reduce((a, m) => a + m.fs * 0.84, 0);
  }
  maj(dt) {
    this.t += dt;
    const r = rythme();
    this.attente -= dt;
    // un mot tous les un, deux ou quatre temps forts
    if (r.neuf) this.coups = (this.coups || 0) + 1;
    const battu = r.neuf && this.coups % Number(S.battementTemps) === 0 && this.t - this.dernier > 0.16;
    if (this.fin === null && (battu || this.attente <= 0)) {
      this.dernier = this.t;
      // avec la musique, on attend son temps fort ; si elle se tait, le poeme reprend sa mesure
      this.attente = r.on ? Math.max(this.mesure * 1.6, 0.7) * Number(S.battementTemps) : this.mesure;
      this.frapper();
    }
    this.partants = this.partants.filter(m => this.t - m.part < 0.6);
    const voulu = Math.min(1, H * 0.74 / Math.max(1, this.hauteur()));
    this.zoom = lerp(this.zoom, voulu, 1 - Math.exp(-dt * 9));
    if (this.fin !== null && this.t - this.fin > 0.3) montrerCartel(null);
    return this.fin !== null && this.t - this.fin > 0.8;
  }
  dessiner() {
    const P = palette(), r = rythme();
    const z = this.zoom * (1 + r.b * 0.04 * pulseMots()), ang = bruit(temps * 0.4) * 0.025;
    ctx.save();
    const groupe = (pile, sortie) => {
      const h = pile.reduce((a, m) => a + m.fs * 0.84, 0);
      const zz = sortie ? z : z;
      pile.forEach((m, i) => {
        const age = this.t - m.ne;
        let s = 1 + 0.4 * (1 - sortie3(age / 0.16)), a = clamp(age / 0.05, 0, 1), x = W / 2, y, fs;
        if (m.style === 0) { y = H / 2 + (m.cum + m.fs * 0.42 - h / 2) * zz; fs = m.fs * zz; }
        else {
          const rang = pile.length - 1 - i;
          if (rang > 4) return;
          fs = m.fs * Math.pow(0.52, rang) * 1.1; y = H / 2 - rang * H * 0.07; a *= Math.pow(0.42, rang);
        }
        if (sortie) { const p = (this.t - m.part) / 0.6; s *= 1 + p * p * 3; a *= 1 - p; }
        const couleur = age < 0.22 || m.cours >= 85 ? P.accent : couleurDe({ poete: m.poete, ordre: m.ordre }, 10);
        ecrireGrand(m.mot, fs * s, couleur, x + (y - H / 2) * Math.sin(ang), y, ang, a);
      });
    };
    groupe(this.partants, true);
    groupe(this.pile, false);
    ctx.restore();
  }
}

/* ================================================================ scene : l'oscilloscope */

// Le vers est l'onde du son : ses lettres se posent sur la forme d'onde de la musique, comme la
// trace d'un oscilloscope (sans musique, une onde qui respire seule). Le vers d'avant monte et
// devient le spectre, chaque lettre haussee par sa frequence (les basses a gauche) ; sous
// l'onde, son reflet a l'envers.
class SceneOnde {
  constructor(poeme) {
    this.poeme = poeme; this.t = 0;
    this.vers = versDe(poeme);
    this.intervalle = clamp(tenue() / Math.max(1, this.vers.length), 4, 9);
    this.duree = this.vers.length * this.intervalle + 1.5;
    this.i = -1; this.lignes = [];
    this.trace = new Float32Array(96);
    montrerCartel(poeme);
  }
  ligne(v, iv) {
    const texte = casse(v.texte), gauche = W * 0.06, larg = W * 0.88;
    let fs = clamp(Math.min(W, H) * 0.045, 16, 54) * clamp(S.taille, 0.4, 2.2);
    let total = mesurer(texte, police(fs));
    if (total > larg) { fs *= larg / total; total = larg; }
    const pol = police(fs), lettres = [];
    let x = 0;
    for (const c of texte) {
      const w = mesurer(c, pol);
      if (c.trim()) lettres.push({ c, u: (x + w / 2) / total, graine: Math.random() * 1000 });
      x += w;
    }
    // un vers court s'etale sur la largeur, ses lettres s'espacent
    const etale = larg / total > 1.6;
    for (const l of lettres) l.x = etale ? gauche + l.u * larg : W / 2 + (l.u - 0.5) * total;
    annoncerVers(v.texte, v.poete, iv);
    texte.split(/\s+/).filter(Boolean).forEach((m, i, t) => annoncerMot({}, m, gauche + larg * (i + 0.5) / t.length, H * 0.5, v.poete, coursDe(m), i));
    return { lettres, fs, poete: v.poete, ordre: iv, ne: this.t, part: null };
  }
  onde(x) {
    if (S.musique && musique.actif) return musique.onde(x) * (0.3 + 0.7 * clamp(musique.niveau * 1.4, 0, 1));
    const t = temps;
    return 0.55 * Math.sin(x * 9.4 + t * 1.2) * (0.6 + 0.4 * Math.sin(t * 0.22))
      + 0.25 * Math.sin(x * 23 - t * 1.9) * Math.sin(t * 0.37 + 1)
      + 0.12 * Math.sin(x * 57 + t * 4.1) + 0.35 * live.mod.flash * Math.sin(x * 40 + t * 30);
  }
  y(u) {
    const f = clamp(u, 0, 1) * 95, k = Math.floor(f);
    return lerp(this.trace[k], this.trace[Math.min(95, k + 1)], f - k);
  }
  maj(dt) {
    this.t += dt;
    const n = Math.min(this.vers.length - 1, Math.floor(this.t / this.intervalle));
    if (n > this.i) {
      this.i = n;
      for (const L of this.lignes) if (L.part === null) L.part = this.t;
      this.lignes.push(this.ligne(this.vers[n], n));
    }
    this.lignes = this.lignes.filter(L => L.part === null || this.t - L.part < this.intervalle + 1.5);
    // la trace suit l'onde sans trembler a chaque image
    for (let k = 0; k < 96; k++) this.trace[k] = lerp(this.trace[k], this.onde(k / 95), 1 - Math.exp(-dt * 22));
    if (this.t > this.duree - 1.5) montrerCartel(null);
    return this.t > this.duree;
  }
  dessiner() {
    const P = palette(), r = rythme();
    const A = H * 0.2 * S.ondeHauteur * (1 + r.coup * 0.25 * pulseMots()), y0 = H * 0.5;
    ctx.save();
    const lot = lettresGl.ouvrir();  // les lettres de la scene partent en un lot a la carte
    for (const L of this.lignes) {
      const couleur = couleurDe({ poete: L.poete, ordre: L.ordre }, 10);
      const age = this.t - L.ne;
      if (L.part === null) {
        L.lettres.forEach((l, j) => {
          const ap = clamp((age - j * 0.02) / 0.4, 0, 1);
          if (ap <= 0) return;
          const u = l.x / W, yv = this.y(u) * A;
          const ang = Math.atan((this.y(u + 0.01) - this.y(u - 0.01)) * A / (W * 0.02));
          // la lettre qui tombe sur l'onde passe de la couleur vive a celle de son poete en fondu
          // (avant : d'un coup a l'arrivee) ; sa taille ne change pas : vignette nette
          poserFondu(l.c, L.fs, P.accent, couleur, (ap - 0.6) / 0.4, l.x, y0 + yv - (1 - sortie3(ap)) * A, ang, sortie3(ap), l.graine, 60, false, true);
          if (S.ondeReflet) poserLettre(l.c, L.fs * 0.8, couleur, l.x, y0 + H * 0.25 - yv * 0.35, Math.PI - ang * 0.35, 0.17 * ap, undefined, undefined, false, true);
        });
      } else {
        // le vers d'avant monte et devient le spectre
        const p = lisse((this.t - L.part) / 1.2), fade = clamp(1 - (this.t - L.part - this.intervalle) / 1.5, 0, 1);
        for (const l of L.lettres) {
          const u = l.x / W;
          const s = r.on ? musique.spectre(u) : 0.45 + 0.35 * Math.sin(u * 13 + temps * 1.7) * Math.sin(temps * 0.9 + u * 4);
          const yh = H * 0.2 - s * H * 0.09, yv = y0 + this.y(u) * A;
          poserLettre(l.c, L.fs * lerp(1, 0.62, p), P.clair ? P.note : couleur, l.x, lerp(yv, yh, p), 0, lerp(1, 0.6, p) * fade, l.graine, 60);
        }
      }
    }
    if (lot) lettresGl.fermer();
    ctx.restore();
  }
}

