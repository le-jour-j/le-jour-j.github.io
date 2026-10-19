"use strict";
/* ================================================================ scene : le poeme (lecture, tourbillon) */

class ScenePoeme {
  constructor(poeme, opt) {
    this.poeme = poeme;
    this.entree = opt.entree; this.sortie = opt.sortie; this.avecMaelstrom = opt.maelstrom;
    this.t = 0; this.phase = "entree";
    this.mots = mettreEnPage(poeme);
    this.geo = this.mots.geo || [];
    this.tailleTexte = this.mots.taille || 20;
    this.gaucheTexte = this.mots.gauche || 0;
    this.droiteTexte = this.mots.droite || W;
    this.fantomes = [];
    if (S.chutes && (poeme.origine === "recueil" || poeme.origine === "essai")) {
      chutesDe(poeme).then(liste => { this.fantomes = placerChutes(liste, this.geo, poeme); });
    }
    const n = this.mots.reduce((a, m) => Math.max(a, m.ordre), 0) + 1;
    this.cadence = Math.max(1, S.ecriture);
    this.dureeEntree = n / this.cadence + 1.8;
    if (this.dureeEntree > 40) { this.cadence = n / 38; this.dureeEntree = 40; }
    this.debutSortie = this.dureeEntree + tenue();
    this.cx = W / 2; this.cy = H / 2;
    for (const m of this.mots) {
      m.t0 = m.ordre / this.cadence;
      m.depart = { x: hasard(-W * 0.3, W * 1.3), y: hasard(-H * 0.4, H * 1.4), r: hasard(-1, 1) };
      const dx = m.hx - this.cx, dy = m.hy - this.cy;
      m.rh = Math.hypot(dx, dy); m.thh = Math.atan2(dy, dx);
      m.tours = hasard(0.8, 1.6) * (S.sensHoraire ? -1 : 1);
    }
  }

  commencerSortie() {
    this.phase = "sortie"; this.tSortie = this.t;
    montrerCartel(null);
    if (S.son && this.sortie === "vortex") son.vortex();
    const incl = Math.max(0.15, S.inclinaison);
    if (this.sortie === "fonte" || this.sortie === "dissolution") {
      const lettres = [];
      for (const m of this.mots) {
        const chars = [...m.affiche];
        let acc = m.hx - m.w / 2;
        for (const c of chars) {
          const w = mesurer(c, m.police);
          if (c.trim()) lettres.push(Object.assign({}, m, { t: c, affiche: c, w, hx: acc + w / 2, x: acc + w / 2, y: m.hy, alpha: m.alpha, lettrine: 0,
            vx: this.sortie === "dissolution" ? hasard(-140, 140) : hasard(-6, 6), vy: this.sortie === "dissolution" ? hasard(-160, 60) : 0,
            delai: this.sortie === "fonte" ? hasard(0, 3.5) + (m.hy / H) * 1.5 : hasard(0, 1.2), graine: Math.random() * 1000 }));
          acc += w;
        }
      }
      this.mots = lettres;
    } else {
      for (const m of this.mots) {
        const dx = m.x - this.cx, dy = (m.y - this.cy) / incl;
        m.r = Math.hypot(dx, dy); m.r0 = Math.max(1, m.r); m.th = Math.atan2(dy, dx);
        m.vx = hasard(-80, 80); m.vy = hasard(-260, -60); m.va = hasard(-2, 2);
        m.delai = this.sortie === "chute" ? hasard(0, 1.5) : this.sortie === "envol" ? hasard(0, 2.5) : 0;
      }
    }
  }

  maj(dt) {
    this.t += dt;
    if (this.avecMaelstrom) maelstrom.maj(dt);
    if (this.phase === "entree" && this.t >= this.dureeEntree) { this.phase = "tenue"; montrerCartel(this.poeme); }
    if (this.phase === "tenue" && this.t >= this.debutSortie) this.commencerSortie();
    if (this.phase === "entree" || this.phase === "tenue") {
      for (const m of this.mots) {
        this.placerEntree(m);
        if (m.initiale) {
          m.revele = clamp((this.t - this.dureeEntree - 0.4 - m.rangInitiale * 0.45) / 0.5, 0, 1);
          m.lettrine = m.initialeRatee ? 0 : m.revele;
        }
      }
      return false;
    }
    const ts = this.t - this.tSortie;
    let vivants = 0;
    const incl = Math.max(0.15, S.inclinaison);
    const R = Math.hypot(W, H) / 2;
    for (const m of this.mots) {
      if (m.mort) continue;
      vivants++;
      const tm = ts - (m.delai || 0);
      if (tm < 0) continue;
      switch (this.sortie) {
        case "vortex": {
          const elan = clamp(ts / 4, 0, 1);
          const sens = S.sensHoraire ? 1 : -1;
          m.th += sens * S.spin * (0.4 + 1.6 / (0.15 + m.r / R)) * dt * (0.2 + elan);
          m.r -= S.aspiration * (12 + 0.12 * (R - m.r) + 0.08 * m.r) * dt * elan * elan;
          m.x = this.cx + Math.cos(m.th) * m.r;
          m.y = this.cy + Math.sin(m.th) * m.r * incl;
          m.angle = lerp(m.angle, m.th + sens * Math.PI / 2, dt * 2 * elan);
          m.echelle = Math.max(0.05, Math.pow(clamp(m.r / m.r0, 0, 1), 0.55));
          m.alpha = clamp(m.r / 45, 0, 1);
          if (m.r < 3) m.mort = true;
          break;
        }
        case "fonte": {
          m.vy += 120 * dt * (1 + m.graine % 1.7);
          m.y += m.vy * dt; m.x += m.vx * dt * 0.2;
          m.etirement = 1 + m.vy * 0.006;
          if (m.y > H * 0.78) m.alpha -= dt * 1.2;
          if (m.y > H + 40 || m.alpha <= 0) m.mort = true;
          break;
        }
        case "dissolution": {
          m.x += m.vx * dt; m.y += m.vy * dt; m.vy += 30 * dt; m.vx *= 0.995;
          m.angle += m.vx * 0.002; m.alpha -= dt * 0.45; m.echelle *= 1 - dt * 0.12;
          if (m.alpha <= 0) m.mort = true;
          break;
        }
        case "chute": {
          if (!m.lance) { m.lance = true; m.vy = hasard(-120, 0); }
          m.vy += 700 * dt; m.x += m.vx * dt; m.y += m.vy * dt; m.angle += m.va * dt;
          if (m.y > H - 20 && m.vy > 0 && !m.rebond) { m.vy *= -0.45; m.rebond = true; }
          if (m.rebond) m.alpha -= dt * 0.9;
          if (m.y > H + 80 || m.alpha <= 0) m.mort = true;
          break;
        }
        case "envol": {
          m.y -= (40 + m.graine % 60) * dt * (1 + tm * 0.4);
          m.x += Math.sin(tm * 1.7 + m.graine) * 30 * dt;
          m.angle = Math.sin(tm * 1.3 + m.graine) * 0.25;
          m.echelle *= 1 + dt * 0.05; m.alpha -= dt * 0.28;
          if (m.alpha <= 0 || m.y < -60) m.mort = true;
          break;
        }
        default: {
          m.alpha -= dt * 0.45;
          if (m.alpha <= 0) m.mort = true;
        }
      }
    }
    return vivants === 0 || ts > 22;
  }

  placerEntree(m) {
    const tm = this.t - m.t0;
    if (tm >= 0 && !m.sonne) {
      m.sonne = true;
      if (S.son && !m.note) son.mot(m);
      if (!m.note) {
        // le bus : le vers qui commence, puis le mot qui parait
        if (m.v && m.v !== this.dernierVers) { this.dernierVers = m.v; annoncerVers(m.v.texte, m.poete, this.versAnnonces = (this.versAnnonces || 0) + 1); }
        annoncerMot(m, m.t, m.hx, m.hy, m.poete, m.cours, m.ordre);
      }
    }
    const d = this.entree === "spirale" ? 1.7 : this.entree === "eclat" ? 1.4 : this.entree === "chute" ? 1.1 : 0.7;
    const p = clamp(tm / d, 0, 1);
    switch (this.entree) {
      case "spirale": {
        const e = sortie3(p);
        const r = m.rh * e, th = m.thh + (1 - e) * m.tours * Math.PI * 2;
        m.x = this.cx + Math.cos(th) * r; m.y = this.cy + Math.sin(th) * r;
        m.angle = (1 - e) * (th + Math.PI / 2) * 0.6; m.echelle = 0.15 + 0.85 * e; m.alpha = clamp(p * 2, 0, 1);
        break;
      }
      case "chute": {
        const e = p < 1 ? 1 - Math.pow(1 - p, 2) : 1;
        const rebond = p >= 1 ? 0 : Math.abs(Math.sin(p * Math.PI * 2.2)) * (1 - p) * 18;
        m.x = m.hx; m.y = lerp(m.hy - H * 0.7 - m.depart.r * 80, m.hy, e) - rebond;
        m.angle = (1 - e) * m.depart.r * 0.6; m.echelle = 1; m.alpha = clamp(p * 3, 0, 1);
        break;
      }
      case "eclat": {
        const e = sortie3(p);
        m.x = lerp(m.depart.x, m.hx, e); m.y = lerp(m.depart.y, m.hy, e);
        m.angle = (1 - e) * m.depart.r * 3; m.echelle = lerp(2.4, 1, e); m.alpha = clamp(p * 1.5, 0, 1);
        break;
      }
      case "machine": {
        m.x = m.hx; m.y = m.hy; m.angle = 0; m.echelle = 1;
        m.alpha = tm > 0 ? 1 : 0;
        m.lettres = tm > 0 ? Math.min(m.affiche.length, Math.floor(tm * 28) + 1) : 0;
        break;
      }
      default: {
        m.x = m.hx; m.y = m.hy + (1 - lisse(p)) * 10; m.angle = 0; m.echelle = 1; m.alpha = lisse(p);
      }
    }
  }

  // depuis combien de temps le poeme est entierement ecrit (0 tant qu'il s'ecrit)
  tenueDepuis() { return this.phase === "tenue" ? this.t - this.dureeEntree : 0; }

  dessinerFantomes() {
    const td = this.tenueDepuis();
    if (!this.fantomes.length || td <= 0) return;
    const P = palette();
    const fond = clamp(td / 2.5, 0, 1) * clamp((this.debutSortie - this.t) / 1.5, 0, 1);
    ctx.save();
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (const f of this.fantomes) {
      // une version battue a la fois par strophe, qui passe et revient
      const cycle = 5.5, phase = (td / cycle) % f.nb;
      const ici = phase - f.rang;
      if (ici < 0 || ici >= 1) continue;
      const enveloppe = Math.sin(ici * Math.PI);
      const a = (P.clair ? 0.2 : 0.16) * enveloppe * fond;
      const derive = Math.sin(td * 0.35 + f.graine) * f.taille * 1.1;
      if (!f.pol) f.pol = police(f.taille * 0.94, true);
      poserTexte(f.texte, f.pol, P.note, f.xc + f.decale + derive, f.y + f.taille * 0.06, 0, a, undefined, undefined, true, true);
    }
    ctx.restore();
  }

  dessinerFils() {
    const td = this.tenueDepuis();
    if (!S.filsRimes || td <= 0) return;
    const progres = sortie3(td / 2.2) * clamp((this.debutSortie - this.t) / 1.2, 0, 1);
    if (progres <= 0) return;
    const groupes = new Map();
    for (const g of this.geo) {
      if (!g.v || !g.v.lettre || !g.v.texte || g.v.texte === "…") continue;
      if (!groupes.has(g.v.lettre)) groupes.set(g.v.lettre, []);
      groupes.get(g.v.lettre).push(g);
    }
    const P = palette();
    const pad = this.tailleTexte * 0.35;
    ctx.save();
    ctx.lineWidth = Math.max(0.8, this.tailleTexte * 0.035);
    for (const [lettre, liste] of groupes) {
      if (liste.length < 2) continue;
      const h = ((lettre.charCodeAt(0) - 65) * 67 + 20) % 360;
      const couleur = P.mono ? P.accent : P.clair ? "hsl(" + h + ",55%,38%)" : "hsl(" + h + ",80%,70%)";
      ctx.strokeStyle = couleur; ctx.fillStyle = couleur;
      for (let i = 1; i < liste.length; i++) {
        const A = liste[i - 1], B = liste[i];
        const dy = Math.abs(B.y - A.y);
        if (dy > H * 0.6 || A.col !== B.col) continue;  // un fil qui traverserait l'ecran generait la lecture
        const xa = A.droite + pad, xb = B.droite + pad;
        const bosse = Math.max(Math.max(xa, xb) + 6, Math.min(Math.max(xa, xb) + pad + 10 + dy * 0.22, A.colDroite + this.tailleTexte * 0.85));
        const L = dy + 2 * (bosse - Math.min(xa, xb)) + 1;
        ctx.globalAlpha = 0.5;
        ctx.setLineDash([L, L]);
        ctx.lineDashOffset = L * (1 - progres);
        ctx.beginPath(); ctx.moveTo(xa, A.y); ctx.bezierCurveTo(bosse, A.y, bosse, B.y, xb, B.y); ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.75 * progres;
        ctx.beginPath(); ctx.arc(xa, A.y, 1.8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(xb, B.y, 1.8, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  dessinerAcrostiche() {
    // le mot secret, debout dans la marge, une lettre par vers a mesure qu'elles s'allument
    const mot = this.poeme.memo && this.poeme.memo.acrostiche;
    if (!mot) return;
    const lettres = [...mot.toUpperCase()];
    const initiales = this.mots.filter(m => m.initiale).sort((a, b) => a.rangInitiale - b.rangInitiale);
    // a gauche de tout, noms des poetes compris
    let bord = this.gaucheTexte;
    for (const m of this.mots) if (m.note && m.poete && m.type !== "forme") bord = Math.min(bord, m.hx - m.w / 2);
    const x = bord - this.tailleTexte * 1.2;
    if (x < 14 || this.phase === "sortie") return;
    const P = palette();
    ctx.save();
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = police(this.tailleTexte * 1.1, false);
    initiales.forEach((m, i) => {
      if (!lettres[i] || !(m.revele > 0)) return;
      const rate = m.initialeRatee;
      ctx.globalAlpha = m.revele * (rate ? 0.4 : 0.9);
      ctx.fillStyle = rate ? P.note : P.accent;
      ctx.shadowColor = P.accent; ctx.shadowBlur = rate ? 0 : 12;
      ctx.fillText(lettres[i], x, m.hy);
    });
    ctx.restore();
  }

  dessiner() {
    if (this.avecMaelstrom) maelstrom.dessiner();
    ctx.save();
    this.dessinerFantomes();
    ctx.restore();
    this.dessinerFils();
    this.dessinerAcrostiche();
    const calme = this.phase === "sortie" && (this.sortie === "vortex" || this.sortie === "fonte");
    for (const m of this.mots) {
      if (m.mort) continue;
      if (this.phase !== "sortie" && this.entree === "machine" && m.lettres !== undefined && m.lettres < m.affiche.length) {
        if (!m.lettres) continue;
        const gx = m.hx - m.w / 2;
        dessinerMot(Object.assign({}, m, { x: gx }), { texte: m.affiche.slice(0, m.lettres), gauche: true });
        continue;
      }
      dessinerMot(m, { calme, etirementY: m.etirement });
    }
  }
}

/* ================================================================ scene : champ d'etoiles */

// Le ciel ne recommence pas a chaque poeme : les etoiles continuent leur vol, seules les
// nouvelles prennent les mots du poeme qui arrive. Avant, chaque poeme rebattait tout le ciel
// d'un coup, et l'on voyait la boucle.
const ciel = { etoiles: [], reserve: [] };
class SceneEtoiles {
  constructor(poeme) {
    this.poeme = poeme; this.t = 0;
    this.vers = poeme.strophes.flatMap(s => s.vers.filter(v => !v.herite && v.texte && v.texte !== "…").map(v => ({ texte: v.texte, poete: s.poete })));
    const motsPoeme = this.vers.flatMap(v => v.texte.split(/\s+/).filter(Boolean).map(t => ({ t, poete: v.poete })));
    ciel.reserve = motsPoeme.concat(motsPoeme, motsPoeme, (D.corpus.length ? Array.from({ length: 200 }, () => ({ t: tirer(D.corpus), poete: "" })) : []));
    this.cometes = [];
    this.prochaineComete = 1.2;
    this.indexVers = 0;
    // chaque vers passe une fois, en comete ; la scene finit quand le dernier est passe
    this.intervalle = clamp(tenue() / Math.max(1, this.vers.length), 1.6, 3.6);
    this.duree = Math.max(10, this.vers.length * this.intervalle + 7);
    montrerCartel(poeme);
  }
  nouvelle(partout) {
    const r = tirer(ciel.reserve) || { t: "·", poete: "" };
    return { t: casse(r.t), poete: r.poete, x: hasard(-1, 1) * 1.6, y: hasard(-1, 1) * 1.1, z: partout ? hasard(0.05, 1) : hasard(0.85, 1),
      px: null, py: null, graine: Math.random() * 1000, cours: coursDe(r.t), ordre: Math.floor(Math.random() * 99) };
  }
  maj(dt) {
    this.t += dt;
    const n = Math.round(S.etoiles);
    const E = ciel.etoiles;
    while (E.length < n) E.push(this.nouvelle(true));
    if (E.length > n) E.length = n;
    const v = 0.22 * S.vitesseEtoiles * (1 + (S.musique ? musique.basses * pulseMots() * 1.5 : 0));
    for (const e of E) { e.z -= v * dt; if (e.z <= 0.03) Object.assign(e, this.nouvelle(false)); }
    // la poussiere : de vraies etoiles, des points, pour la profondeur entre les mots
    if (!ciel.points) ciel.points = Array.from({ length: 360 }, () => ({ x: hasard(-1.6, 1.6), y: hasard(-1.1, 1.1), z: hasard(0.05, 1) }));
    for (const p of ciel.points) { p.z -= v * dt; if (p.z <= 0.03) { p.x = hasard(-1.6, 1.6); p.y = hasard(-1.1, 1.1); p.z = 1; } }
    this.prochaineComete -= dt;
    if (this.prochaineComete <= 0 && this.indexVers < this.vers.length) {
      const vv = this.vers[this.indexVers++];
      // le vers arrive en lettres eparses, se rassemble pour etre lu, puis eclate en passant
      const texte = casse(vv.texte), ref = police(16, true), lettres = [];
      let acc = 0;
      for (const c of texte) {
        const w = mesurer(c, ref);
        if (c.trim()) lettres.push({ c, lx: acc + w / 2, ex: hasard(-1, 1), ey: hasard(-1, 1), ea: hasard(-4, 4) });
        acc += w;
      }
      for (const l of lettres) l.lx -= acc / 2;
      this.cometes.push({ t: texte, lettres, poete: vv.poete, z: 1.4, x: hasard(-0.25, 0.25), y: hasard(-0.18, 0.18), graine: Math.random() * 1000, cours: 50, ordre: this.indexVers });
      annoncerVers(vv.texte, vv.poete, this.indexVers);
      this.prochaineComete = this.intervalle / Math.max(0.3, S.vitesseEtoiles);
    }
    for (const c of this.cometes) {
      c.z -= v * 0.55 * dt;
      // le vers se lit quand ses lettres se rassemblent : ses mots paraissent
      if (c.z < 0.95 && !c.annonce) {
        c.annonce = true;
        const p = this.projeter(c, Math.min(W, H) * 0.5);
        c.t.split(/\s+/).filter(Boolean).forEach((m, i) => annoncerMot({}, m, p.x, p.y, c.poete, coursDe(m), i));
      }
    }
    this.cometes = this.cometes.filter(c => c.z > 0.08);
    if (this.t > this.duree - 2) montrerCartel(null);
    return this.t > this.duree && (this.indexVers >= this.vers.length && !this.cometes.length || this.t > this.duree + 8);
  }
  projeter(e, f) { return { x: W / 2 + (e.x / e.z) * f, y: H / 2 + (e.y / e.z) * f }; }
  dessiner() {
    const f = Math.min(W, H) * 0.5;
    const pulse = battementMots(0.16);
    ctx.save();
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const P = palette();
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = P.clair ? P.texte : "#ffffff";
    // (les projections sont calculees sur place : un objet par etoile et par image, c'etait
    // 600 dechets par image pour le ramasse-miettes)
    const cx = W / 2, cy = H / 2;
    for (const pt of ciel.points || []) {
      const px = cx + (pt.x / pt.z) * f, py = cy + (pt.y / pt.z) * f;
      if (px < 0 || px > W || py < 0 || py > H) continue;
      const r = clamp(1.6 / pt.z, 0.6, 4);
      ctx.globalAlpha = clamp((1 - pt.z) * 1.3, 0, 0.9);
      ctx.fillRect(px - r / 2, py - r / 2, r, r);
    }
    // les traines des etoiles : regroupees par couleur, epaisseur et force (un trait par groupe
    // au lieu d'un par etoile ; a l'oeil, la meme chose)
    const lot = lettresGl.ouvrir();  // les mots du ciel partent en un lot a la carte
    const traines = S.trainees > 0.05 ? this.traines || (this.traines = new Map()) : null;
    if (traines) for (const g of traines.values()) g.n = 0;
    for (const e of ciel.etoiles) {
      const x0 = cx + (e.x / e.z) * f, y0 = cy + (e.y / e.z) * f;
      const taille = clamp(4 / e.z, 3, 90) * S.taille;
      // les mots lointains scintillent
      const a = clamp((1 - e.z) * 1.6, 0, 1) * (e.z > 0.5 ? 0.72 + 0.28 * Math.sin(temps * 2.3 + e.graine) : 1);
      const couleur = couleurDe(e, 10);
      if (traines && e.px !== null && a > 0.02) {
        const lw = Math.max(0.5, Math.round(taille * 0.05 * 2) / 2), na = Math.min(4, Math.round(a * 0.35 * 10));
        if (na > 0) {
          const k = couleur + "|" + lw + "|" + na;
          let g = traines.get(k);
          if (!g) { g = { couleur, lw, a: na / 10, pts: [], n: 0 }; traines.set(k, g); }
          g.pts[g.n++] = e.px; g.pts[g.n++] = e.py; g.pts[g.n++] = x0; g.pts[g.n++] = y0;
        }
      }
      e.px = x0; e.py = y0;
      if (x0 < -200 || x0 > W + 200 || y0 < -100 || y0 > H + 100 || a < 0.01) continue;
      let x = x0, y = y0;
      if (S.tremblement > 0) {
        const A = S.tremblement * 0.25 * (S.tremblementValeur ? 0.25 + 1.6 * (1 - e.cours / 100) : 1), fq = S.frequence * 6;
        x += A * bruit(temps * fq + e.graine); y += A * bruit(temps * fq + e.graine * 1.7 + 30);
      }
      if (S.glitch > 0 && Math.random() < S.glitch * 0.006) {
        // le glitch reste ecrit a la main : il ne dure qu'une image
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        dessinerMot({ x, y, angle: 0, echelle: 1, alpha: a, affiche: e.t, police: police(taille), graine: e.graine, cours: e.cours, poete: e.poete, ordre: e.ordre, hx: x },
          { calme: true, texte: brouiller(e.t) });
        continue;
      }
      const t = taille * pulse;
      const vg = vignetteLettre(e.t, t, couleur);
      ctx.globalAlpha = t < 4 ? a * (t - 1) / 3 : a;
      if (vg) {
        const s = t / vg.fs;
        if (lot && vg.page) { lettresGl.ajouter(vg, DPR * s, 0, 0, DPR * s, DPR * x, DPR * y, ctx.globalAlpha); continue; }
        ctx.setTransform(DPR * s, 0, 0, DPR * s, DPR * x, DPR * y);
        poserVignette(vg);
      } else { ctx.setTransform(DPR, 0, 0, DPR, DPR * x, DPR * y); ecrireDirect(e.t, police(t), couleur); }
    }
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (traines) for (const g of traines.values()) {
      if (!g.n) continue;
      ctx.globalAlpha = g.a; ctx.strokeStyle = g.couleur; ctx.lineWidth = g.lw;
      ctx.beginPath();
      for (let i = 0; i < g.n; i += 4) { ctx.moveTo(g.pts[i], g.pts[i + 1]); ctx.lineTo(g.pts[i + 2], g.pts[i + 3]); }
      ctx.stroke();
    }
    for (const c of this.cometes) {
      const p = this.projeter(c, f);
      const taille = clamp(16 / c.z, 10, 200) * S.taille, k = taille / 16;
      const alpha = clamp((1.4 - c.z) * 2, 0, 1) * clamp(c.z * 5, 0, 1);
      // eparpillees au loin, rassemblees au milieu du vol, eclatees tout pres
      const d = c.z > 0.95 ? lisse((c.z - 0.95) / 0.4) : c.z < 0.32 ? lisse((0.32 - c.z) / 0.22) : 0;
      const ecart = Math.min(W, H) * 0.75 * d;
      const couleur = couleurDe({ poete: c.poete, ordre: c.ordre }, 10);
      c.lettres.forEach((l, i) => poserLettre(l.c, taille, couleur, p.x + l.lx * k + l.ex * ecart, p.y + l.ey * ecart, l.ea * d, alpha * (1 - d * 0.4), c.graine + i, 50, true));
    }
    if (lot) lettresGl.fermer();
    ctx.restore();
  }
}

/* ================================================================ scene : texte 3D */

class SceneTexte3D {
  constructor(poeme) {
    this.poeme = poeme; this.t = 0;
    const vers = poeme.strophes.flatMap(s => s.vers.filter(v => !v.herite).map(v => ({ texte: v.texte, poete: s.poete })));
    const choix = [];
    if (poeme.titre) choix.push({ texte: poeme.titre, poete: "" });
    const pas = Math.max(1, Math.floor(vers.length / 6));
    for (let i = 0; i < vers.length && choix.length < 7; i += pas) choix.push(vers[i]);
    this.textes = choix.length ? choix : [{ texte: "poïasie", poete: "" }];
    this.duree = clamp(tenue() / this.textes.length, 4.5, 9);
    this.i = 0; this.ti = 0;
    montrerCartel(poeme);
  }
  annoncer() {
    const it = this.textes[this.i];
    if (!it || this.annonce === this.i) return;
    this.annonce = this.i;
    annoncerVers(it.texte, it.poete, this.i);
    it.texte.split(/\s+/).filter(Boolean).forEach((m, k) => annoncerMot({}, m, W / 2, H / 2, it.poete, coursDe(m), k));
  }
  maj(dt) {
    this.t += dt; this.ti += dt;
    this.annoncer();
    if (this.ti > this.duree) { this.ti = 0; this.i++; }
    if (this.i >= this.textes.length) { montrerCartel(null); return true; }
    return false;
  }
  dessiner() {
    const item = this.textes[this.i];
    if (!item) return;
    const texte = casse(item.texte);
    let taille = Math.min(H * 0.16, 120) * S.taille;
    const largeur = mesurer(texte, police(taille));
    if (largeur > W * 0.74) taille *= (W * 0.74) / largeur;
    const pol = police(taille);
    const w = mesurer(texte, pol);
    const t = this.t * 0.9;
    // le texte se promene, mais sans jamais sortir de l'ecran
    const jeuX = Math.max(0, (W - w * 1.1) / 2 - taille * 0.3);
    const jeuY = Math.max(0, H / 2 - taille * 1.4);
    const cx = W / 2 + Math.sin(t * 0.31) * jeuX * 0.85;
    const cy = H / 2 + Math.sin(t * 0.43 + 1) * Math.min(jeuY, H * 0.2);
    const apparition = clamp(this.ti / 0.8, 0, 1) * clamp((this.duree - this.ti) / 0.8, 0, 1);
    const P = palette();
    const teinte = teinteDe(item.poete) !== undefined ? teinteDe(item.poete) : P.teinte;
    let sx = 1, sy = 1, rot = 0, dx = 0, dy = 0;
    const a = this.ti * 1.4;
    switch (S.mode3d) {
      case "rotation": sx = Math.cos(a); dx = Math.sin(a); break;
      case "bascule": sy = Math.cos(a * 0.8); dy = Math.sin(a * 0.8); break;
      case "culbute": sx = Math.cos(a); sy = Math.cos(a * 0.7); dx = Math.sin(a); dy = Math.sin(a * 0.7); break;
      case "tournis": rot = a * 0.6; sx = sy = 0.8 + 0.25 * Math.sin(a * 1.3); dx = 0.6; dy = 0.6; break;
      default: dx = 0.5; dy = 0.5;
    }
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.globalAlpha = apparition;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = pol;
    const couches = Math.round(S.profondeur);
    const lettres = S.mode3d === "vague" ? [...texte] : null;
    // Les couches de l'epaisseur sont des vignettes (une par couleur de couche, peintes une fois
    // par vers) : seize textes de 120 px ecrits a chaque image coutaient jusqu'a 54 ms (audit du
    // 2026-10-18). La face, qui peut etre un degrade, reste ecrite a la main (une seule fois).
    const base = ctx.getTransform();
    const poserCouche = (style, t, x, y, ex, ey) => {
      const v = vignetteTexte(t, pol, style, true, true);
      ctx.setTransform(base);
      ctx.translate(x, y); ctx.scale(ex || 0.001, ey || 0.001);
      if (v) { if (v.fs !== taille) ctx.scale(taille / v.fs, taille / v.fs); poserVignette(v); }
      else { ctx.fillStyle = style; ctx.fillText(t, 0, 0); }
    };
    const dessinerTexte = (style, ox, oy, couche) => {
      ctx.fillStyle = style;
      if (!lettres) {
        if (couche) { poserCouche(style, texte, ox, oy, sx, sy); ctx.setTransform(base); return; }
        ctx.save(); ctx.scale(sx || 0.001, sy || 0.001); ctx.fillText(texte, ox / (sx || 1), oy / (sy || 1)); ctx.restore(); return;
      }
      let acc = -w / 2;
      lettres.forEach((c, i) => {
        const lw = mesurer(c, pol);
        const yy = Math.sin(this.t * 3 + i * 0.45) * taille * 0.28;
        const ss = 1 + 0.18 * Math.sin(this.t * 3 + i * 0.45 + 1.2);
        if (couche) { poserCouche(style, c, acc + lw / 2 + ox, yy + oy, ss, ss); acc += lw; return; }
        ctx.save(); ctx.translate(acc + lw / 2 + ox, yy + oy); ctx.scale(ss, ss); ctx.fillText(c, 0, 0); ctx.restore();
        acc += lw;
      });
      ctx.setTransform(base);
    };
    for (let k = couches; k >= 1; k--) {
      const ombre = P.clair ? hsl(teinte, 30, 20 + k) : hsl(teinte, 45, clamp(8 + (couches - k) * 0.9, 6, 30));
      dessinerTexte(ombre, dx * k * 1.3, dy * k * 1.3 + (lettres ? k * 1.1 : 0), true);
    }
    let face;
    if (S.surface === "chrome") {
      face = ctx.createLinearGradient(0, -taille / 2, 0, taille / 2);
      face.addColorStop(0, "#ffffff"); face.addColorStop(0.45, "#9aa3ad"); face.addColorStop(0.5, "#4b525a"); face.addColorStop(1, "#e8edf2");
    } else if (S.surface === "arc") {
      face = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
      for (let i = 0; i <= 6; i++) face.addColorStop(i / 6, "hsl(" + ((i * 60 + this.t * 60) % 360).toFixed(0) + ",90%,62%)");
    } else if (S.surface === "poete") {
      face = P.clair ? hsl(teinte, 60, 32) : hsl(teinte, 70, 70);
    } else if (S.surface === "plein") {
      face = P.texte;
    } else {
      face = ctx.createLinearGradient(0, -taille / 2, 0, taille / 2);
      face.addColorStop(0, P.accent); face.addColorStop(1, P.texte);
    }
    if (!lettres && S.surface !== "arc") {
      // la face (degrade et lueur compris) est peinte une fois par vers, puis posee : son ombre
      // floue de 120 px coutait a elle seule 2 ms par image
      const cle = texte + "|" + pol + "|" + S.surface + "|" + P.accent + P.texte + "|" + teinte + "|" + S.lueur + "|" + DPR;
      if (!this.face || this.face.cle !== cle) {
        const flou = S.lueur > 0 ? S.lueur * 20 : 0, pad = taille * 0.4 + flou * 1.5;
        const fw = w + pad * 2, fh = taille * 1.4 + pad * 2;
        const c = (this.face && this.face.c) || document.createElement("canvas");
        c.width = Math.ceil(fw * DPR); c.height = Math.ceil(fh * DPR);
        const g = c.getContext("2d");
        g.setTransform(DPR, 0, 0, DPR, DPR * fw / 2, DPR * fh / 2);
        if ("letterSpacing" in g) g.letterSpacing = S.espacement + "px";
        g.font = pol; g.textAlign = "center"; g.textBaseline = "middle";
        let f = face;
        if (typeof face !== "string") {
          // le meme degrade, refait dans la petite toile
          f = g.createLinearGradient(0, -taille / 2, 0, taille / 2);
          if (S.surface === "chrome") { f.addColorStop(0, "#ffffff"); f.addColorStop(0.45, "#9aa3ad"); f.addColorStop(0.5, "#4b525a"); f.addColorStop(1, "#e8edf2"); }
          else { f.addColorStop(0, P.accent); f.addColorStop(1, P.texte); }
        }
        if (flou) { g.shadowColor = P.accent; g.shadowBlur = flou; }
        g.fillStyle = f; g.fillText(texte, 0, 0);
        this.face = { cle, c, fw, fh };
      }
      ctx.scale(sx || 0.001, sy || 0.001);
      ctx.drawImage(this.face.c, -this.face.fw / 2, -this.face.fh / 2, this.face.fw, this.face.fh);
      ctx.restore();
      return;
    }
    if (S.lueur > 0) { ctx.shadowColor = P.accent; ctx.shadowBlur = S.lueur * 20; }
    dessinerTexte(face, 0, 0);
    ctx.restore();
  }
}

/* ================================================================ scene : mystifier */

// les polygones survivent au poeme : le suivant reprend la ou l'autre s'est arrete
const mystifie = { formes: [] };
class SceneMystifier {
  constructor(poeme) {
    this.poeme = poeme; this.t = 0;
    this.mots = poeme.strophes.flatMap(s => s.vers.filter(v => !v.herite).flatMap(v => v.texte.split(/\s+/).filter(Boolean).map(t => ({ t: casse(t), poete: s.poete }))));
    if (!this.mots.length) this.mots = [{ t: "poïasie", poete: "" }];
    this.formes = mystifie.formes;
    this.decalage = 0; this.prochain = 2.5;
    // le poeme fait un seul tour des aretes, puis le suivant prend la place
    const parTour = Math.max(1, Math.round(S.sommets) * Math.round(S.polygones));
    this.duree = clamp(Math.ceil(this.mots.length / parTour) * 2.5 + 3, 10, tenue() + 8);
    if (!this.formes.length) this.creer();
    montrerCartel(poeme);
  }
  creer() {
    this.formes = mystifie.formes = Array.from({ length: Math.round(S.polygones) }, () => ({
      sommets: Array.from({ length: Math.round(S.sommets) }, () => ({ x: hasard(0, W), y: hasard(0, H), vx: hasard(-1, 1) * 160, vy: hasard(-1, 1) * 140 })),
      echos: [], teinte: hasard(0, 360),
    }));
  }
  maj(dt) {
    this.t += dt;
    if (this.formes.length !== Math.round(S.polygones) || this.formes[0].sommets.length !== Math.round(S.sommets)) this.creer();
    for (const f of this.formes) {
      for (const s of f.sommets) {
        s.x += s.vx * dt; s.y += s.vy * dt;
        if (s.x < 0 || s.x > W) { s.vx *= -1; s.x = clamp(s.x, 0, W); }
        if (s.y < 0 || s.y > H) { s.vy *= -1; s.y = clamp(s.y, 0, H); }
      }
      f.echos.push(f.sommets.map(s => ({ x: s.x, y: s.y })));
      const garde = Math.round(S.echos) * 3;
      while (f.echos.length > garde) f.echos.shift();
      f.teinte = (f.teinte + dt * 25) % 360;
    }
    this.prochain -= dt;
    if (this.prochain <= 0) { this.decalage += Math.round(S.sommets); this.prochain = 2.5; }
    if (this.t > this.duree - 2) montrerCartel(null);
    return this.t > this.duree;
  }
  dessiner() {
    const P = palette();
    ctx.save();
    ctx.lineWidth = 1.5;
    this.formes.forEach((f, fi) => {
      const couleur = P.mono ? P.texte : "hsl(" + f.teinte.toFixed(0) + ",95%,60%)";
      f.echos.forEach((e, i) => {
        if (i % 3) return;
        ctx.globalAlpha = (i + 1) / f.echos.length * 0.75;
        ctx.strokeStyle = couleur;
        ctx.beginPath();
        e.forEach((p, j) => j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
        ctx.closePath(); ctx.stroke();
      });
      const s = f.sommets;
      for (let j = 0; j < s.length; j++) {
        const a = s[j], b = s[(j + 1) % s.length];
        const mot = this.mots[(this.decalage + j + fi * s.length) % this.mots.length];
        const L = Math.hypot(b.x - a.x, b.y - a.y);
        let ang = Math.atan2(b.y - a.y, b.x - a.x);
        if (ang > Math.PI / 2 || ang < -Math.PI / 2) ang += Math.PI;
        const taille = clamp(L / Math.max(4, mot.t.length) * 0.9, 10, 46) * S.taille;
        // la taille change sans cesse avec l'arete : par l'atlas, a son palier (une police par
        // taille aurait fait une vignette neuve par image). Le mot est pose au-dessus de l'arete
        // (comme ecrit sur sa ligne de pied), la teinte tourne par pas de 5 degres.
        const couleur = P.mono ? P.texte : hsl(Math.round((f.teinte + 40) % 360 / 5) * 5 % 360, 90, 75);
        const mx = (a.x + b.x) / 2 + Math.sin(ang) * taille * 0.5, my = (a.y + b.y) / 2 - Math.cos(ang) * taille * 0.5;
        if (!mot.cours) mot.cours = coursDe(mot.t);
        poserLettre(mot.t, taille, couleur, mx, my, ang, 1, j * 13 + fi * 101, mot.cours, true);
        if (!mot.annonce) annoncerMot(mot, mot.t, mx, my, mot.poete, mot.cours, j);
      }
    });
    ctx.restore();
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.textBaseline = "middle";
  }
}

/* ================================================================ scene : texte defilant */

class SceneDefilement {
  constructor(poeme) {
    this.poeme = poeme; this.t = 0;
    this.vers = poeme.strophes.flatMap(s => s.vers.map(v => ({ texte: casse(v.texte), poete: s.poete, herite: v.herite })));
    if (poeme.titre) this.vers.unshift({ texte: "« " + casse(poeme.titre) + " »", poete: "", titre: true });
    const n = Math.round(S.voies);
    this.taille = Math.min(Math.min(H / (n * 1.9), 110) * S.taille, H / (n + 1) * 0.9);
    this.voies = Array.from({ length: n }, (_, i) => ({ y: H * (i + 1) / (n + 1), items: [], vitesse: hasard(0.8, 1.25) }));
    this.prochain = 0;
    montrerCartel(poeme);
  }
  maj(dt) {
    this.t += dt;
    for (const v of this.voies) {
      const dernier = v.items[v.items.length - 1];
      if ((!dernier || dernier.x + dernier.w < W - 80) && this.prochain < this.vers.length) {
        const vv = this.vers[this.prochain++];
        const pol = police(this.taille, vv.titre);
        v.items.push({ texte: vv.texte, poete: vv.poete, herite: vv.herite, pol, w: mesurer(vv.texte, pol), x: W + 20, graine: Math.random() * 1000 });
        annoncerVers(vv.texte, vv.poete, this.prochain - 1);
      }
      for (const it of v.items) it.x -= 150 * v.vitesse * dt * Math.max(0.6, this.taille / 60);
      v.items = v.items.filter(it => it.x + it.w > -40);
    }
    const fini = this.prochain >= this.vers.length && this.voies.every(v => !v.items.length);
    if (fini || (this.t > 8 && !this.cartelRange)) { montrerCartel(null); this.cartelRange = true; }
    return fini || this.t > 240;
  }
  dessiner() {
    ctx.save();
    ctx.textBaseline = "middle"; ctx.textAlign = "center";
    const lot = lettresGl.ouvrir();  // les lettres de la scene partent en un lot a la carte
    for (const v of this.voies) {
      for (const it of v.items) {
        if (!it.annonce && it.x < W) {
          // le vers entre dans l'ecran : ses mots paraissent
          it.annonce = true;
          it.texte.split(/\s+/).filter(Boolean).forEach((m, k) => annoncerMot({}, m, Math.min(W, it.x + 40 + k * 60), v.y, it.poete, coursDe(m), k));
        }
        if (!it.couleur) it.couleur = couleurDe({ poete: it.poete, ordre: 0 }, 4);
        const alpha = it.herite ? 0.72 : 1;
        if (S.vague > 0) {
          // chaque lettre suit la vague : une vignette par lettre, a la police exacte du vers
          if (!it.lettres) {
            let acc = 0;
            it.lettres = [...it.texte].map((c, i) => { const lw = mesurer(c, it.pol), l = { c, dx: acc + lw / 2, g: it.graine + i }; acc += lw; return l; });
          }
          for (const l of it.lettres) {
            const xx = it.x + l.dx;
            if (xx < -40 || xx > W + 40 || l.c === " ") continue;
            const acc = xx;
            const y = v.y + Math.sin(this.t * 3 + acc * 0.012) * S.vague * this.taille * 0.22;
            poserTexte(l.c, it.pol, it.couleur, xx, y, Math.cos(this.t * 3 + acc * 0.012) * S.vague * 0.12, alpha, l.g, 50);
          }
        } else {
          poserTexte(it.texte, it.pol, it.couleur, it.x + it.w / 2, v.y, 0, alpha, it.graine, 50);
        }
      }
    }
    if (lot) lettresGl.fermer();
    ctx.restore();
  }
}

/* ================================================================ scene : la Corbeille */

// La corbeille, c'etait l'anneau de la Bourse de Paris ou criaient les agents de change.
// Ici : un tableau a palettes (les mots et leur cours, qui se retournent lettre a
// lettre), la courbe de l'indice des poemes avec ses krachs, les fortunes des poetes
// (leurs vers, leurs droits d'auteur, leurs coups de coeur) et le tresor de la Banque.
const PALETTES_LETTRES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&";
class SceneCorbeille {
  constructor(poeme) {
    this.poeme = poeme; this.t = 0;
    this.duree = tenue() + 10;
    const B = corbeille.donnees;
    this.B = B;
    const tuile = (c, i) => ({ mot: sansAccents(c.mot).toUpperCase(), cours: String(c.cours), emplois: c.emplois,
      sens: c.cours < 10 ? -1 : c.cours >= 40 ? 1 : 0, delai: 0.4 + i * 0.07 + hasard(0, 0.5) });
    const neuves = B && B.neuves ? B.neuves.slice(0, 12) : [];
    const usees = (B && B.cote.length ? B.cote : D.cote).slice(0, neuves.length ? 12 : 24);
    this.blocs = [{ titre: "LES PLUS USÉS", tuiles: usees.map(tuile) }];
    if (neuves.length) this.blocs.push({ titre: "LES VALEURS NEUVES", tuiles: neuves.map((c, i) => tuile(c, i + 6)) });
    const vus = new Set();
    this.ordres = [];
    for (const s of poeme.strophes) for (const v of s.vers) for (const m of motsPleins(v.texte)) {
      const r = racine(m);
      if (vus.has(r)) continue;
      vus.add(r);
      const c = coursDe(m);
      this.ordres.push((c >= 50 ? "ACHAT " : "VENTE ") + sansAccents(m).toUpperCase() + " " + c);
    }
    this.texteOrdres = "ORDRES DU POÈME · " + (this.ordres.join("   ·   ") || "AUCUN") + "   ·   ";
    this.xOrdres = W;
    montrerCartel(null);
  }
  maj(dt) {
    this.t += dt;
    this.xOrdres -= 70 * dt;
    return this.t > this.duree;
  }
  retourner(texte, depuis, vitesse) {
    // les lettres pas encore tombees tournent au hasard
    const pose = Math.floor(Math.max(0, depuis) * vitesse);
    let s = "";
    for (let i = 0; i < texte.length; i++) s += i < pose ? texte[i] : (depuis < 0 ? " " : PALETTES_LETTRES[Math.floor(Math.random() * PALETTES_LETTRES.length)]);
    return s;
  }
  dessiner() {
    const P = palette();
    const fin = clamp((this.duree - this.t) / 1.5, 0, 1);
    const haut = S.bourse ? 30 : 12;
    const etroit = W < 760;
    const marge = Math.max(16, W * 0.035);
    const encre = P.texte, faible = P.note;
    const rouge = P.clair ? "#b22222" : "#ff5a5a", vert = P.clair ? "#1f7a3a" : "#4fe08a";
    ctx.save();
    ctx.globalAlpha = fin;
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
    ctx.textBaseline = "middle";
    // en-tete
    const tEntete = clamp(Math.min(W, H) * 0.035, 14, 26);
    ctx.font = "bold " + tEntete + "px Consolas, \"Courier New\", monospace";
    ctx.textAlign = "left"; ctx.fillStyle = P.accent;
    ctx.fillText(this.retourner("LA CORBEILLE · BOURSE DES MOTS", this.t, 22), marge, haut + tEntete);
    ctx.textAlign = "right"; ctx.fillStyle = faible;
    ctx.font = Math.round(tEntete * 0.55) + "px Consolas, monospace";
    const B = this.B;
    const maintenant = new Date();
    const heure = String(maintenant.getHours()).padStart(2, "0") + ":" + String(maintenant.getMinutes()).padStart(2, "0") + ":" + String(maintenant.getSeconds()).padStart(2, "0");
    ctx.fillText(heure + (B ? " · TRÉSOR DE LA BANQUE " + B.tresor + " SOUS · " + B.mots + " MOTS COTÉS" : ""), W - marge, haut + tEntete);
    if (B && B.krach) {
      ctx.fillStyle = rouge; ctx.font = "bold " + Math.round(tEntete * 0.8) + "px Consolas, monospace";
      if (Math.floor(this.t * 2) % 2 === 0) ctx.fillText("▼ KRACH AU DERNIER POÈME ▼", W - marge, haut + tEntete * 2.2);
    }
    const y0 = haut + tEntete * 3.2;
    const bas = H - 70;
    // le tableau a palettes
    const colonnes = etroit ? 2 : 3;
    const largeurTableau = etroit ? W - 2 * marge : W * 0.52;
    const rangees = this.blocs.reduce((a, b) => a + Math.ceil(b.tuiles.length / colonnes) + 0.8, 0);
    const hauteurDispo = etroit ? (bas - y0) * 0.5 : bas - y0;
    const th = clamp(hauteurDispo / Math.max(1, rangees) - 6, 18, 46);
    const tw = largeurTableau / colonnes - 6;
    const tPol = clamp(th * 0.42, 9, 18);
    const places = [];
    let yb = y0;
    for (const b of this.blocs) {
      places.push({ titre: b.titre, y: yb + th * 0.3 });
      yb += th * 0.8;
      b.tuiles.forEach((tu, i) => places.push({ tu, cx: marge + (i % colonnes) * (tw + 6), cy: yb + Math.floor(i / colonnes) * (th + 6) }));
      yb += Math.ceil(b.tuiles.length / colonnes) * (th + 6);
    }
    for (const pl of places) {
      if (pl.titre) {
        ctx.globalAlpha = fin * clamp(this.t * 2, 0, 1);
        ctx.font = Math.round(tPol * 0.85) + "px Consolas, monospace"; ctx.textAlign = "left"; ctx.fillStyle = faible;
        ctx.fillText(pl.titre, marge, pl.y);
        continue;
      }
      const { tu, cx, cy } = pl;
      ctx.globalAlpha = fin * clamp((this.t - tu.delai + 0.4) * 3, 0, 1);
      ctx.fillStyle = P.clair ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.06)";
      ctx.fillRect(cx, cy, tw, th);
      ctx.strokeStyle = P.clair ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.18)";
      ctx.lineWidth = 1; ctx.strokeRect(cx + 0.5, cy + 0.5, tw - 1, th - 1);
      ctx.beginPath(); ctx.moveTo(cx, cy + th / 2); ctx.lineTo(cx + tw, cy + th / 2); ctx.globalAlpha *= 0.4; ctx.stroke();
      ctx.globalAlpha = fin * clamp((this.t - tu.delai + 0.4) * 3, 0, 1);
      ctx.font = "bold " + tPol + "px Consolas, \"Courier New\", monospace";
      ctx.textAlign = "left"; ctx.fillStyle = encre;
      const place = Math.max(4, Math.floor((tw - tPol * 4.2) / (tPol * 0.56)));
      ctx.fillText(this.retourner(tu.mot.slice(0, place), this.t - tu.delai, 16), cx + tPol * 0.5, cy + th / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = tu.sens < 0 ? rouge : tu.sens > 0 ? vert : encre;
      const fleche = tu.sens < 0 ? " ▼" : tu.sens > 0 ? " ▲" : " =";
      ctx.fillText(this.retourner(tu.cours, this.t - tu.delai - 0.5, 10) + fleche, cx + tw - tPol * 0.4, cy + th / 2);
    }
    ctx.globalAlpha = fin;
    // la courbe de l'indice
    const gx = etroit ? marge : marge + largeurTableau + W * 0.04, gw = etroit ? W - 2 * marge : W - gx - marge;
    const gy = etroit ? y0 + hauteurDispo + 20 : y0, gh = etroit ? (bas - gy) * 0.45 : (bas - y0) * 0.48;
    ctx.font = Math.round(tPol * 0.85) + "px Consolas, monospace"; ctx.textAlign = "left"; ctx.fillStyle = faible;
    ctx.fillText("INDICE DES POÈMES (FRAÎCHEUR DES MOTS, SUR 100)", gx, gy);
    const indices = B ? B.indices : [];
    ctx.strokeStyle = faible; ctx.globalAlpha = fin * 0.4;
    ctx.strokeRect(gx + 0.5, gy + 12.5, gw - 1, gh - 14);
    ctx.globalAlpha = fin;
    if (indices.length >= 2) {
      const vus = indices.slice(-40);
      const max = Math.max(60, ...vus.map(i => i.indice)), min = 0;
      const px = k => gx + 8 + (gw - 16) * k / (vus.length - 1);
      const py = v => gy + gh - 8 - (gh - 28) * (v - min) / (max - min);
      const montre = clamp((this.t - 0.8) / 2.5, 0, 1) * (vus.length - 1);
      ctx.strokeStyle = P.accent; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let k = 0; k <= Math.floor(montre); k++) k ? ctx.lineTo(px(k), py(vus[k].indice)) : ctx.moveTo(px(k), py(vus[k].indice));
      if (montre % 1 && Math.floor(montre) + 1 < vus.length) {
        const a = Math.floor(montre), f = montre % 1;
        ctx.lineTo(lerp(px(a), px(a + 1), f), lerp(py(vus[a].indice), py(vus[a + 1].indice), f));
      }
      ctx.stroke();
      vus.forEach((i, k) => {
        if (k > montre) return;
        if (i.krach) {
          ctx.fillStyle = rouge; ctx.beginPath(); ctx.arc(px(k), py(i.indice), 4, 0, Math.PI * 2); ctx.fill();
          ctx.font = "bold " + Math.round(tPol * 0.7) + "px Consolas, monospace"; ctx.textAlign = "center";
          ctx.fillText("KRACH", px(k), py(i.indice) + 14);
        }
      });
      const der = vus[vus.length - 1];
      if (montre >= vus.length - 1) {
        ctx.fillStyle = P.accent; ctx.textAlign = "right"; ctx.font = "bold " + Math.round(tPol) + "px Consolas, monospace";
        ctx.fillText(String(der.indice), gx + gw - 6, py(der.indice) - 12);
      }
    } else {
      ctx.fillStyle = faible; ctx.textAlign = "center"; ctx.font = Math.round(tPol * 0.85) + "px Consolas, monospace";
      ctx.fillText(B ? "la courbe paraîtra après deux poèmes" : "lance ecran.bat pour voir la courbe", gx + gw / 2, gy + gh / 2);
    }
    // les fortunes
    const fy = gy + gh + 22, fh = bas - fy;
    if (B && fh > 60) {
      ctx.font = Math.round(tPol * 0.85) + "px Consolas, monospace"; ctx.textAlign = "left"; ctx.fillStyle = faible;
      ctx.fillText("FORTUNES · VERS + DROITS D'AUTEUR + COUPS DE CŒUR", gx, fy);
      const noms = Object.keys(B.fortunes).sort((a, b) => B.fortunes[b] - B.fortunes[a]).slice(0, 6);
      const max = Math.max(1, ...noms.map(n => B.fortunes[n]));
      const bh = clamp((fh - 18) / Math.max(1, noms.length) - 5, 8, 26);
      const montre = clamp((this.t - 1.5) / 2, 0, 1);
      noms.forEach((n, k) => {
        const yy = fy + 14 + k * (bh + 5);
        const lab = Math.min(gw * 0.32, 150);
        const bw = (gw - lab - 70) * montre;
        const g = B.gains[n] || 0, dr = B.droits[n] || 0, cc = (B.coups[n] || 0) * (B.coup_de_coeur || 25);
        const h = teinteDe(n) !== undefined ? teinteDe(n) : P.teinte;
        ctx.textAlign = "left"; ctx.fillStyle = encre; ctx.font = Math.round(Math.min(bh * 0.7, tPol)) + "px Consolas, monospace";
        ctx.fillText(sansAccents(n).toUpperCase(), gx, yy + bh / 2);
        let x = gx + lab;
        const seg = (v, coul) => { const w = bw * v / max; ctx.fillStyle = coul; ctx.fillRect(x, yy, w, bh); x += w; };
        seg(g, P.mono ? P.texte : "hsl(" + h + ",55%," + (P.clair ? 40 : 58) + "%)");
        seg(dr, P.mono ? P.note : "hsl(" + h + ",40%," + (P.clair ? 62 : 36) + "%)");
        seg(cc, P.accent);
        ctx.fillStyle = encre; ctx.textAlign = "left";
        ctx.fillText(String(Math.round((g + dr + cc) * montre)) + (B.coups[n] ? " ♥" + B.coups[n] : ""), x + 6, yy + bh / 2);
      });
    }
    // les ordres du poeme, en bas
    ctx.font = "13px Consolas, monospace"; ctx.textAlign = "left"; ctx.fillStyle = P.accent;
    const lo = mesurer(this.texteOrdres, "13px Consolas, monospace");
    if (this.xOrdres < -lo) this.xOrdres += lo;
    ctx.globalAlpha = fin * 0.85;
    for (let x = this.xOrdres; x < W; x += lo) ctx.fillText(this.texteOrdres, x, H - 34);
    appliquerEspacement();
    ctx.restore();
  }
}

