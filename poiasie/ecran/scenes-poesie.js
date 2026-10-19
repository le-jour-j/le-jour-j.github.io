"use strict";
/* ================================================================ scene : constellations */

// Mallarme, Gomringer : le vers en constellation. Le ciel tourne lentement autour du centre
// de l'ecran ; chaque vers s'y pose en etoiles, une par mot (plus brillante si le mot est
// rare a la Bourse), reliees par un trait qui se dessine de mot en mot. Les vers lus restent
// au ciel, palis, et tournent avec lui ; le poeme suivant les efface peu a peu. Des etoiles
// filantes emportent un mot de temps en temps.
const voute = { rot: 0, poussiere: null, figures: [], filantes: [], W: 0, H: 0 };
class SceneConstellation {
  constructor(poeme) {
    this.poeme = poeme; this.t = 0;
    this.vers = versDe(poeme);
    for (const f of voute.figures) f.ancien = true;
    this.intervalle = clamp(tenue() / Math.max(1, this.vers.length), 4.5, 8);
    this.prochain = 0.8; this.i = 0;
    this.prochaineFilante = hasard(3, 8);
    this.duree = this.vers.length * this.intervalle + 7;
    this.taille = clamp(Math.min(W, H) * 0.026, 13, 28) * clamp(S.taille, 0.4, 2);
    if (!voute.poussiere || voute.W !== W || voute.H !== H) this.semer();
    montrerCartel(poeme);
  }
  semer() {
    const R = Math.hypot(W, H) / 2;
    voute.W = W; voute.H = H; voute.figures = [];
    const lettres = D.corpus.length ? D.corpus.join("").replace(/[^\p{L}]/gu, "") : "poiasie";
    voute.poussiere = Array.from({ length: 460 }, () => {
      const r = R * Math.sqrt(Math.random()), a = hasard(0, Math.PI * 2);
      return { x: Math.cos(a) * r, y: Math.sin(a) * r, m: Math.pow(Math.random(), 3), ph: hasard(0, 6.3), v: hasard(0.6, 2.4),
        lettre: Math.random() < 0.13 ? lettres[Math.floor(Math.random() * lettres.length)] : null };
    });
  }
  versEcran(x, y) {
    const c = Math.cos(voute.rot), s = Math.sin(voute.rot);
    return { x: W / 2 + x * c - y * s, y: H / 2 + x * s + y * c };
  }
  versCiel(x, y) {
    const c = Math.cos(-voute.rot), s = Math.sin(-voute.rot), dx = x - W / 2, dy = y - H / 2;
    return { x: dx * c - dy * s, y: dx * s + dy * c };
  }
  // un vers devient une figure : les mots avancent de gauche a droite, en montant et en
  // descendant, sans jamais se chevaucher ; trop long pour la largeur, il repart a la ligne
  figure(vers) {
    const fs = this.taille, pol = police(fs, true);
    const mots = casse(vers.texte).split(/\s+/).filter(Boolean).map(m => ({ m, w: mesurer(m, pol) }));
    const gauche = W * 0.08, droite = W * 0.92, haut = H * 0.1 + (S.bourse ? 30 : 0), bas = H * 0.78;
    const largeur = mots.reduce((a, b) => a + b.w + fs * 1.3, 0);
    // on essaie quelques departs, on garde celui qui est le plus loin des figures encore vives
    // le ciel a tourne depuis : les centres se recalculent
    const vives = voute.figures.filter(f => f.fondu > 0.2).map(f => {
      const n = f.etoiles.length, c = f.etoiles.reduce((a, e) => ({ x: a.x + e.x / n, y: a.y + e.y / n }), { x: 0, y: 0 });
      return this.versEcran(c.x, c.y);
    });
    let mieux = null, score = -1;
    for (let k = 0; k < 14; k++) {
      const x0 = largeur < droite - gauche ? hasard(gauche, droite - largeur) : gauche;
      const y0 = hasard(haut + fs * 2, bas - fs * 3);
      const cx = x0 + Math.min(largeur, droite - gauche) / 2;
      const d = vives.length ? Math.min(...vives.map(c => Math.hypot(c.x - cx, (c.y - y0) * 1.6))) : 9999;
      if (d > score) { score = d; mieux = { x0, y0 }; }
    }
    let x = mieux.x0, y = mieux.y0, pente = hasard(-0.5, 0.5);
    const etoiles = [];
    mots.forEach((mot, i) => {
      if (i) {
        const pas = (mots[i - 1].w + mot.w) / 2 + fs * hasard(1, 2.2);
        if (x + pas + mot.w / 2 > droite) { x = gauche + hasard(0, W * 0.2) + mot.w / 2; y += fs * hasard(2.6, 3.6); }
        else { x += pas; y += clamp(Math.tan(pente) * pas * 0.6, -fs * 2.4, fs * 2.4); }
        pente = clamp(pente + hasard(-0.7, 0.7), -1, 1);
        if (y < haut + fs) pente = Math.abs(pente); else if (y > bas - fs) pente = -Math.abs(pente);
        y = clamp(y, haut + fs, bas);
      } else x += mot.w / 2;
      const cours = coursDe(mot.m);
      etoiles.push(Object.assign(this.versCiel(x, y), { m: mot.m, w: mot.w, cours, mag: cours / 100, graine: Math.random() * 1000, ph: hasard(0, 6.3) }));
    });
    const cx = etoiles.reduce((a, e) => a + e.x, 0) / etoiles.length, cy = etoiles.reduce((a, e) => a + e.y, 0) / etoiles.length;
    return { etoiles, poete: vers.poete, age: 0, ancien: false, fondu: 1, fs, centre: this.versEcran(cx, cy), ordre: this.i };
  }
  maj(dt) {
    this.t += dt;
    voute.rot += dt * (0.011 + rythme().m * 0.03) * (S.sensHoraire ? 1 : -1);
    this.prochain -= dt;
    if (this.prochain <= 0 && this.i < this.vers.length) {
      const vv = this.vers[this.i];
      voute.figures.push(this.figure(this.vers[this.i++]));
      annoncerVers(vv.texte, vv.poete, this.i - 1);
      this.prochain = this.intervalle;
    }
    for (const f of voute.figures) {
      f.age += dt;
      if (f.ancien) f.fondu -= dt / 9;
    }
    // le ciel garde les cinq derniers vers ; les plus vieux s'eteignent
    const vivantes = voute.figures.filter(f => !f.ancien);
    for (let k = 0; k < vivantes.length - 5; k++) vivantes[k].ancien = true;
    voute.figures = voute.figures.filter(f => f.fondu > 0);
    // les etoiles filantes : un mot du poeme traverse le ciel, ses lettres en traine
    this.prochaineFilante -= dt;
    if (this.prochaineFilante <= 0) {
      this.prochaineFilante = hasard(5, 12);
      const v = tirer(this.vers);
      const mots = motsPleins(v.texte);
      const a = hasard(0.35, 0.75) * (Math.random() < 0.5 ? 1 : -1) + (Math.random() < 0.5 ? 0 : Math.PI);
      voute.filantes.push({ mot: casse(mots.length ? tirer(mots) : v.texte), x: hasard(0.15, 0.85) * W, y: hasard(0.08, 0.45) * H,
        dx: Math.cos(a), dy: Math.abs(Math.sin(a)), vie: 0, poete: v.poete });
    }
    for (const fl of voute.filantes) fl.vie += dt;
    voute.filantes = voute.filantes.filter(fl => fl.vie < 1.8);
    if (this.t > this.duree - 2) montrerCartel(null);
    return this.t > this.duree;
  }
  dessiner() {
    const P = palette();
    const blanc = P.clair ? P.texte : "#ffffff";
    const battu = 1 + rythme().coup * 0.9 * pulseMots();  // les etoiles s'embrasent sur le temps fort
    ctx.save();
    const lot = lettresGl.ouvrir();  // les lettres de la scene partent en un lot a la carte
    // la poussiere du ciel, et de loin en loin une lettre perdue (les points d'abord, d'un trait,
    // puis les lettres : passer de l'un a l'autre a chaque grain coutait des changements d'etat)
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = blanc;
    const co = Math.cos(voute.rot), si = Math.sin(voute.rot);
    for (const p of voute.poussiere) {
      if (p.lettre) continue;
      const ex = W / 2 + p.x * co - p.y * si, ey = H / 2 + p.x * si + p.y * co;
      if (ex < -10 || ex > W + 10 || ey < -10 || ey > H + 10) continue;
      const r = 0.6 + 1.8 * p.m;
      ctx.globalAlpha = (0.12 + 0.6 * p.m) * (0.6 + 0.4 * Math.sin(temps * p.v + p.ph));
      ctx.fillRect(ex - r / 2, ey - r / 2, r, r);
    }
    for (const p of voute.poussiere) {
      if (!p.lettre) continue;
      const ex = W / 2 + p.x * co - p.y * si, ey = H / 2 + p.x * si + p.y * co;
      if (ex < -10 || ex > W + 10 || ey < -10 || ey > H + 10) continue;
      const a = (0.12 + 0.6 * p.m) * (0.6 + 0.4 * Math.sin(temps * p.v + p.ph));
      poserLettre(p.lettre, 7 + p.m * 8, P.note, ex, ey, voute.rot, a * 0.8);
    }
    // les figures : le trait, puis les etoiles, puis les mots
    for (const f of voute.figures) {
      const vif = f.age < this.intervalle * 1.8 ? 1 : lerp(1, 0.34, clamp((f.age - this.intervalle * 1.8) / 3, 0, 1));
      const lum = vif * f.fondu;
      const couleur = couleurDe({ poete: f.poete, ordre: f.ordre }, 10);
      const pts = f.etoiles.map(e => this.versEcran(e.x, e.y));
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.strokeStyle = P.clair ? P.note : couleur; ctx.lineWidth = 0.9;
      for (let k = 1; k < pts.length; k++) {
        const pr = clamp((f.age - (k - 1) * 0.45 - 0.2) / 0.35, 0, 1);
        if (pr <= 0) continue;
        const a = pts[k - 1], b = pts[k], L = Math.hypot(b.x - a.x, b.y - a.y), g = Math.min(7, L / 3);
        const ux = (b.x - a.x) / L, uy = (b.y - a.y) / L;
        ctx.globalAlpha = 0.42 * lum;
        ctx.beginPath(); ctx.moveTo(a.x + ux * g, a.y + uy * g);
        ctx.lineTo(a.x + ux * (g + (L - 2 * g) * pr), a.y + uy * (g + (L - 2 * g) * pr)); ctx.stroke();
      }
      f.etoiles.forEach((e, k) => {
        const ap = clamp((f.age - k * 0.45) / 0.5, 0, 1);
        if (ap <= 0) return;
        const sc = 0.75 + 0.25 * Math.sin(temps * 2.1 + e.ph);
        poserEtoile(pts[k].x, pts[k].y, (1.1 + e.mag * 2.6) * (1 + (1 - ap) * 1.5) * battu, P.clair ? P.texte : blanc, ap * lum * sc, e.mag > 0.75 && lum > 0.5);
      });
      f.etoiles.forEach((e, k) => {
        const ap = clamp((f.age - k * 0.45 - 0.15) / 0.6, 0, 1);
        if (ap <= 0) return;
        if (!e.annonce && !f.ancien) annoncerMot(e, e.m, pts[k].x, pts[k].y, f.poete, e.cours, k);
        // les mots d'une figure gardent leur taille : vignette a la taille exacte, nette
        poserLettre(e.m, f.fs, couleur, pts[k].x, pts[k].y + f.fs * 1.05, voute.rot, ap * lum * 0.95, e.graine, e.cours, true, true);
      });
    }
    // les filantes
    for (const fl of voute.filantes) {
      const v = Math.min(W, H) * 0.9, d = fl.vie * v;
      const hx = fl.x + fl.dx * d, hy = fl.y + fl.dy * d;
      const a = clamp(fl.vie * 6, 0, 1) * clamp((1.8 - fl.vie) / 0.6, 0, 1);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const g = ctx.createLinearGradient(hx, hy, hx - fl.dx * v * 0.35, hy - fl.dy * v * 0.35);
      g.addColorStop(0, P.clair ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.7)"); g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.strokeStyle = g; ctx.lineWidth = 1.2; ctx.globalAlpha = a;
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx - fl.dx * v * 0.35, hy - fl.dy * v * 0.35); ctx.stroke();
      poserEtoile(hx, hy, 2.4, blanc, a, true);
      // les lettres du mot s'egrenent derriere la tete
      const couleur = couleurDe({ poete: fl.poete, ordre: 3 }, 10);
      const lettres = [...fl.mot], fs = this.taille * 0.9, ang = Math.atan2(fl.dy, fl.dx);
      lettres.forEach((c, j) => {
        const recul = (lettres.length - j) * fs * (0.62 + fl.vie * 0.5);
        poserLettre(c, fs, couleur, hx - fl.dx * recul, hy - fl.dy * recul, ang, a * (0.35 + 0.65 * j / lettres.length), undefined, undefined, false, true);
      });
    }
    if (lot) lettresGl.fermer();
    ctx.restore();
  }
}

/* ================================================================ scene : la nuee */

// La murmuration : les lettres du poeme volent ensemble comme des etourneaux au crepuscule.
// Une a une, les lettres d'un vers quittent la nuee, viennent se poser en ligne pour etre lues,
// puis repartent. Le poeme suivant arrive par les bords, l'ancien s'en va.
const nuee = { lettres: [], T: 0 };
class SceneNuee {
  constructor(poeme) {
    this.poeme = poeme; this.t = 0;
    this.vers = versDe(poeme);
    for (const l of nuee.lettres) l.partante = true;
    this.intervalle = clamp(tenue() / Math.max(1, this.vers.length), 4, 8);
    this.duree = this.vers.length * this.intervalle + 5;
    this.base = clamp(Math.min(W, H) * 0.04, 16, 46) * clamp(S.taille, 0.4, 2.2);
    this.cree = 0;  // les vers dont les lettres sont deja nees
    this.courant = -1;
    // la nuee ne garde pas plus de 700 lettres : les vers lointains naissent plus tard
    while (this.cree < this.vers.length && this.vivantes() < 700) this.naitre(this.cree++);
    montrerCartel(poeme);
  }
  vivantes() { return nuee.lettres.reduce((a, l) => a + (l.partante ? 0 : 1), 0); }
  naitre(iv) {
    const v = this.vers[iv], texte = casse(v.texte);
    let fs = this.base;
    const w0 = mesurer(texte, police(fs));
    if (w0 > W * 0.88) fs *= W * 0.88 / w0;
    const pol = police(fs), total = mesurer(texte, pol);
    const y = H * (iv % 2 ? 0.6 : 0.4);
    let x = W / 2 - total / 2, j = 0, k = 0, prec = " ";
    for (const c of texte) {
      const w = mesurer(c, pol);
      if (c.trim()) {
        // elles arrivent par un bord, au hasard
        const bord = Math.floor(Math.random() * 4);
        const px = bord === 0 ? -40 : bord === 1 ? W + 40 : hasard(0, W), py = bord === 2 ? -40 : bord === 3 ? H + 40 : hasard(0, H);
        const r = Math.sqrt(Math.random()), a = hasard(0, Math.PI * 2);
        // la premiere lettre d'un mot porte le mot : il est annonce quand elle se pose
        const mot = prec.trim() ? null : texte.slice(k).split(/\s/)[0];
        nuee.lettres.push({ c, vers: iv, poete: v.poete, fs, sx: x + w / 2, sy: y, j: j++, x: px, y: py, vx: 0, vy: 0, ang: 0,
          u: Math.cos(a) * r, v: Math.sin(a) * r, graine: Math.random() * 1000, etat: "vol", pose: 0, alpha: 1, cours: 60, mot });
      }
      x += w; k += c.length; prec = c;
    }
  }
  maj(dt) {
    this.t += dt;
    nuee.T += dt;
    const T = nuee.T;
    // la tete de la nuee et la forme qu'elle prend
    const Lx = W / 2 + W * 0.28 * Math.sin(T * 0.13 + 0.7 * Math.sin(T * 0.05));
    const Ly = H / 2 + H * 0.2 * Math.sin(T * 0.19 + 1);
    const A = T * 0.11 + Math.sin(T * 0.07) * 1.2, ca = Math.cos(A), sa = Math.sin(A);
    const sx = W * 0.2 * (1 + 0.5 * Math.sin(T * 0.23)), sy = H * 0.09 * (1 + 0.7 * Math.sin(T * 0.17 + 2));
    // le vers qui doit se poser
    const n = Math.min(this.vers.length - 1, Math.floor((this.t - 1.5) / this.intervalle));
    if (n > this.courant && this.t > 1.5) {
      this.courant = n;
      while (this.cree < this.vers.length && this.cree <= n + 4) this.naitre(this.cree++);
      if (this.vers[n]) annoncerVers(this.vers[n].texte, this.vers[n].poete, n);
      for (const l of nuee.lettres) {
        if (l.partante) continue;
        if (l.vers === n) { l.etat = "pose"; l.depart = this.t + l.j * 0.025; l.annonce = false; }
        else if (l.etat === "pose") {
          l.etat = "vol";
          l.vx += hasard(-1, 1) * 260; l.vy += hasard(-1, 1) * 200;
          // une nuee trop grosse laisse partir les lettres deja lues
          if (this.vivantes() > 760) l.partante = true;
        }
      }
    }
    const fin = this.t > this.duree - 2.5;
    // un temps fort fait eclater la nuee, qui se reforme
    const souffle = rythme().neuf * 240 * pulseMots();
    for (const l of nuee.lettres) {
      let tx, ty, k = 2.2, amort = 1.6;
      if (l.partante) {
        const d = Math.hypot(l.x - W / 2, l.y - H / 2) || 1;
        tx = l.x + (l.x - W / 2) / d * 400; ty = l.y + (l.y - H / 2) / d * 400; k = 0.8; amort = 0.4;
        if (l.x < -80 || l.x > W + 80 || l.y < -80 || l.y > H + 80) l.alpha -= dt * 2;
      } else if (l.etat === "pose" && this.t >= l.depart && !fin) {
        tx = l.sx; ty = l.sy; k = 9; amort = 5.5;
      } else {
        const fu = l.u * sx, fv = l.v * sy + Math.sin(l.u * 2.5 + T * 0.6) * H * 0.07;
        tx = Lx + fu * ca - fv * sa + bruit(T * 0.9 + l.graine) * l.fs * 1.6;
        ty = Ly + fu * sa + fv * ca + bruit(T * 0.8 + l.graine * 1.3) * l.fs * 1.6;
      }
      l.vx += ((tx - l.x) * k - l.vx * amort) * dt;
      l.vy += ((ty - l.y) * k - l.vy * amort) * dt;
      if (souffle && l.etat !== "pose" && !l.partante) {
        const dx = l.x - Lx, dy = l.y - Ly, d = Math.hypot(dx, dy) || 1;
        l.vx += dx / d * souffle; l.vy += dy / d * souffle;
      }
      l.x += l.vx * dt; l.y += l.vy * dt;
      const posee = l.etat === "pose" && !l.partante && this.t >= l.depart && !fin;
      if (posee && l.mot && !l.annonce) annoncerMot(l, l.mot, l.sx, l.sy, l.poete, coursDe(l.mot), l.vers);
      l.pose = clamp(l.pose + (posee ? dt * 1.6 : -dt * 1.2), 0, 1);
      // en vol, la lettre suit sa route ; posee, elle se redresse
      const vol = Math.atan2(l.vy, l.vx);
      l.ang = lerp(vol * 0.5, 0, lisse(l.pose));
    }
    nuee.lettres = nuee.lettres.filter(l => l.alpha > 0);
    if (fin) montrerCartel(null);
    return this.t > this.duree;
  }
  dessiner() {
    const P = palette();
    ctx.save();
    const vol = P.clair ? P.texte : P.note;
    const lot = lettresGl.ouvrir();  // les lettres de la scene partent en un lot a la carte
    for (const l of nuee.lettres) {
      const p = lisse(l.pose);
      const taille = l.fs * (0.42 + 0.58 * p);
      // en se posant, la lettre passe de la couleur de la nuee a celle de son poete en fondu
      // (avant : d'un coup, a mi-chemin) ; posee, elle garde sa taille : vignette nette
      if (p <= 0.3) poserLettre(l.c, taille, vol, l.x, l.y, l.ang, l.alpha * (0.62 + 0.38 * p), undefined, 60);
      else poserFondu(l.c, taille, vol, couleurDe({ poete: l.poete, ordre: l.vers }, 10), (p - 0.3) / 0.4, l.x, l.y, l.ang, l.alpha * (0.62 + 0.38 * p),
        p > 0.9 ? l.graine : undefined, 60, false, p >= 1);
    }
    if (lot) lettresGl.fermer();
    ctx.restore();
  }
}

/* ================================================================ scene : l'ecriture automatique */

// Chaque strophe est un fil d'encre qui se deroule a travers l'ecran, lettre apres lettre,
// en suivant sa propre pente. Le texte reste ecrit derriere la plume, encore humide (de la
// couleur vive), puis seche, palit et s'efface ; les fils se croisent, s'enroulent : c'est le
// poeme qui dessine. Les traces du poeme d'avant finissent de secher sous le suivant.
const encre = { traces: [] };
class SceneRuban {
  constructor(poeme) {
    this.poeme = poeme; this.t = 0;
    this.fils = strophesDe(poeme).map(s => ({ texte: casse(s.map(v => v.texte).join("  /  ")), poete: s[0].poete }));
    this.plumes = [];
    this.suivant = 0;
    this.nbPlumes = Math.min(2, this.fils.length);
    const total = this.fils.reduce((a, f) => a + f.texte.length, 0);
    this.fs = clamp(Math.min(W, H) * 0.03, 15, 34) * clamp(S.taille, 0.4, 2);
    const cps = clamp(total / Math.max(8, tenue() * 0.85) / this.nbPlumes, 3, 12);  // lettres par seconde et par plume
    this.vitesse = cps * this.fs * 0.5;
    this.vie = clamp(tenue() * 0.55, 9, 28);
    this.fin = null;
    montrerCartel(poeme);
  }
  lancer() {
    const f = this.fils[this.suivant++];
    annoncerVers(f.texte.split("  /  ")[0], f.poete, this.suivant - 1);
    const m = Math.min(W, H) * 0.2;
    this.plumes.push({ f, i: 0, reste: 0, x: hasard(m, W - m), y: hasard(m, H - m), dir: hasard(0, Math.PI * 2),
      graine: Math.random() * 1000, ordre: this.suivant, pause: 0 });
  }
  maj(dt) {
    this.t += dt;
    while (this.plumes.length < this.nbPlumes && this.suivant < this.fils.length) this.lancer();
    const marge = Math.min(W, H) * 0.14, haut = S.bourse ? 34 : 0;
    const virageMax = this.vitesse / (this.fs * 2.2);  // le fil ne se tord pas plus serre que deux lettres
    for (const p of this.plumes) {
      // la pente vient d'un bruit lent ; pres d'un bord, la plume revient vers le milieu
      let voulu = bruit(this.t * 0.35 + p.graine) * 1.6;
      const versCentre = Math.atan2(H / 2 - p.y, W / 2 - p.x);
      if (p.x < marge || p.x > W - marge || p.y < marge + haut || p.y > H - marge) {
        let d = versCentre - p.dir;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        voulu = Math.sign(d) * virageMax;
      }
      p.dir += clamp(voulu, -virageMax, virageMax) * dt;
      const pas = this.vitesse * dt * (1 + rythme().b * 0.9 * pulseMots());
      p.x += Math.cos(p.dir) * pas; p.y += Math.sin(p.dir) * pas;
      p.reste += pas;
      const pol = police(this.fs, true);
      while (p.i < p.f.texte.length) {
        const c = p.f.texte[p.i], w = mesurer(c, pol);
        if (p.reste < w) break;
        p.reste -= w; p.i++;
        if (!c.trim()) continue;
        const recul = p.reste + w / 2;
        const prec = p.i >= 2 ? p.f.texte[p.i - 2] : " ";
        if (!prec.trim()) {
          // une lettre qui commence un mot : le mot parait (et un vers, apres chaque « / »)
          const mot = p.f.texte.slice(p.i - 1).split(/\s/)[0];
          if (mot === "/") annoncerVers(p.f.texte.slice(p.i + 1).split("  /  ")[0], p.f.poete, p.i);
          else annoncerMot({}, mot, p.x, p.y, p.f.poete, coursDe(mot), p.ordre);
        }
        encre.traces.push({ c, x: p.x - Math.cos(p.dir) * recul, y: p.y - Math.sin(p.dir) * recul, ang: p.dir, fs: this.fs, poete: p.f.poete,
          ordre: p.ordre, ne: this.t, age: 0, vie: this.vie, graine: Math.random() * 1000 });
      }
    }
    this.plumes = this.plumes.filter(p => p.i < p.f.texte.length);
    for (const tr of encre.traces) tr.age += dt;
    encre.traces = encre.traces.filter(tr => tr.age < tr.vie + 3);
    if (encre.traces.length > 3000) encre.traces.splice(0, encre.traces.length - 3000);
    if (this.fin === null && !this.plumes.length && this.suivant >= this.fils.length) { this.fin = this.t; montrerCartel(null); }
    return this.fin !== null && this.t - this.fin > 4;
  }
  dessiner() {
    const P = palette();
    ctx.save();
    const lot = lettresGl.ouvrir();  // les lettres de la scene partent en un lot a la carte
    for (const tr of encre.traces) {
      const nait = clamp(tr.age / 0.3, 0, 1);
      const a = nait * clamp((tr.vie + 3 - tr.age) / 3, 0, 1) * lerp(1, 0.6, clamp((tr.age - 4) / 8, 0, 1));
      if (a <= 0.004) continue;
      // l'encre fraiche brille, puis prend la couleur de son poete, en fondu (avant : d'un coup a
      // 0,9 s) ; seche, la lettre garde sa taille : vignette nette
      const couleur = couleurDe({ poete: tr.poete, ordre: tr.ordre }, 10);
      if (tr.age >= 1.3) poserLettre(tr.c, tr.fs, couleur, tr.x, tr.y, tr.ang, a, tr.graine, 60, true, true);
      else poserFondu(tr.c, tr.fs * (1.25 - 0.25 * sortie3(nait)), P.accent, couleur, (tr.age - 0.7) / 0.6, tr.x, tr.y, tr.ang, a, tr.graine, 60, true, nait >= 1);
    }
    if (lot) lettresGl.fermer();
    for (const p of this.plumes) poserEtoile(p.x, p.y, 2.2, P.clair ? P.accent : "#ffffff", 0.9, false);
    ctx.restore();
  }
}

/* ================================================================ scene : un coup de des */

// « Un coup de des jamais n'abolira le hasard » (Mallarme, 1897) : la double page ou les mots
// s'espacent, descendent en escalier, changent de corps. Ici le corps vient de la Bourse : un
// mot rare s'ecrit en capitales, un mot courant en romain, un mot use en petit italique.
// Une strophe par page ; les mots tombent comme des des quand la page tourne.
class SceneCoupDeDes {
  constructor(poeme) {
    this.poeme = poeme; this.t = 0;
    const pages = [];
    let cour = [];
    for (const s of strophesDe(poeme)) {
      for (let i = 0; i < s.length; i += 6) {
        const bout = s.slice(i, i + 6);
        if (cour.length && cour.length + bout.length > 6) { pages.push(cour); cour = []; }
        cour = cour.concat(bout);
        if (cour.length >= 4) { pages.push(cour); cour = []; }
      }
    }
    if (cour.length) pages.push(cour);
    this.pages = pages;
    this.base = clamp(Math.min(W, H) * 0.03, 13, 30) * clamp(S.taille, 0.4, 2);
    this.dureePage = clamp(tenue() / pages.length, 7, 22) + 2;
    this.ip = -1;
    this.debutPage = 0;
    this.tourner();
    montrerCartel(poeme);
  }
  tourner() {
    this.ip++;
    this.debutPage = this.t;
    if (this.ip >= this.pages.length) { this.mots = []; return; }
    this.mots = this.mettreEnPage(this.pages[this.ip], this.ip === 0);
    this.cadence = clamp(this.dureePage * 0.5 / Math.max(1, this.mots.length), 0.12, 0.8);
  }
  mettreEnPage(vers, premiere) {
    const b = this.base, gauche = W * 0.08, droite = W * 0.92, Wp = droite - gauche;
    const mots = [];
    let x = gauche + hasard(0, Wp * 0.2), y = 0, ligne = b;
    vers.forEach((v, iv) => {
      const morceaux = v.texte.split(/\s+/).filter(Boolean);
      morceaux.forEach((m, im) => {
        const cours = coursDe(m), plein = motsPleins(m).length > 0;
        let taille = b, maj = false, ital = false, couleur = couleurDe({ poete: v.poete, ordre: iv }, 10);
        if (premiere && iv === 0 && im === 0) { taille = b * 2.8; maj = true; couleur = palette().accent; }
        else if (plein && cours >= 85) { taille = b * 1.9; maj = true; couleur = palette().accent; }
        else if (plein && cours >= 40) taille = b * 1.2;
        else { taille = b * 0.82; ital = true; }
        const texte = maj ? casse(m).toUpperCase() : casse(m);
        const w = mesurer(texte, police(taille, ital));
        if (im === 0 && iv > 0) {
          // un vers nouveau descend : la ou l'autre s'est arrete (l'escalier), ou plus a gauche
          y += ligne * hasard(1.3, 2.3); ligne = taille;
          if (Math.random() < 0.45 || x + w > droite) x = gauche + hasard(0, Wp * 0.45);
          else x += b * hasard(0.5, 2);
        } else if (mots.length) {
          const blanc = b * 0.4 * hasard(1, Math.random() < 0.3 ? 9 : 2.5);
          if (x + blanc + w > droite) { y += ligne * 1.25; ligne = taille; x = gauche + hasard(0, Wp * 0.3); }
          else if (Math.random() < 0.22) { y += Math.max(ligne, taille) * 0.95; ligne = taille; x += blanc; }
          else { x += blanc; ligne = Math.max(ligne, taille); }
        }
        if (x + w > droite) x = Math.max(gauche, droite - w);
        mots.push({ texte, taille, ital, couleur, x: x + w / 2, y, w, cours, graine: Math.random() * 1000, va: hasard(-3, 3), vx: hasard(-40, 40),
          poete: v.poete, iv, premier: im === 0, vers: v.texte });
        x += w;
      });
    });
    // la page tient dans l'ecran : on la ramene a la hauteur utile, puis on la centre
    const haut = (S.bourse ? 40 : 16) + b, bas = H - (S.cartel ? H * 0.16 : 24);
    const y0 = Math.min(...mots.map(m => m.y - m.taille)), y1 = Math.max(...mots.map(m => m.y + m.taille * 0.4));
    const k = Math.min(1, (bas - haut) / Math.max(1, y1 - y0));
    const decale = haut + ((bas - haut) - (y1 - y0) * k) / 2;
    for (const m of mots) {
      m.y = decale + (m.y - y0) * k;
      m.x = W / 2 + (m.x - W / 2) * k;
      m.taille *= k;
    }
    return mots;
  }
  maj(dt) {
    this.t += dt;
    const tp = this.t - this.debutPage;
    if (this.ip < this.pages.length && tp > this.dureePage + 2) this.tourner();
    if (this.ip >= this.pages.length - 1 && tp > this.dureePage - 1) montrerCartel(null);
    return this.ip >= this.pages.length;
  }
  dessiner() {
    const P = palette();
    const tp = this.t - this.debutPage;
    ctx.save();
    // le pli de la double page
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const g = ctx.createLinearGradient(W / 2 - 30, 0, W / 2 + 30, 0);
    const ombre = P.clair ? "rgba(60,40,20," : "rgba(255,255,255,";
    g.addColorStop(0, ombre + "0)"); g.addColorStop(0.5, ombre + (P.clair ? "0.09)" : "0.035)")); g.addColorStop(1, ombre + "0)");
    ctx.fillStyle = g; ctx.globalAlpha = 1; ctx.fillRect(W / 2 - 30, 0, 60, H);
    const chute = tp - this.dureePage;
    const lot = lettresGl.ouvrir();  // les lettres de la scene partent en un lot a la carte
    this.mots.forEach((m, i) => {
      const ap = clamp((tp - i * this.cadence) / 0.9, 0, 1);
      if (ap <= 0) return;
      let x = m.x, y = m.y + (1 - sortie3(ap)) * m.taille * 0.5, ang = 0, a = sortie3(ap);
      if (chute > 0) {
        // la page tourne : les mots roulent et tombent, comme des des
        const tc = Math.max(0, chute - (m.graine % 1) * 0.8);
        y += 380 * tc * tc; x += m.vx * tc; ang = m.va * tc * tc; a *= clamp(1 - tc / 1.4, 0, 1);
      }
      if (!m.annonce) {
        if (m.premier) annoncerVers(m.vers, m.poete, m.iv);
        annoncerMot(m, m.texte, m.x, m.y, m.poete, m.cours, i);
      }
      // chaque mot garde son corps sur la page : vignette a la taille exacte, nette
      poserLettre(m.texte, m.taille, m.couleur, x, y, ang, a, m.graine, m.cours, m.ital, true);
    });
    if (lot) lettresGl.fermer();
    ctx.restore();
  }
}

