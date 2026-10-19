"use strict";
/* ================================================================ scene : la salle des marches */

// Le poeme cote en direct : chaque vers est une bougie (ouverture : la cloture d'avant ;
// cloture : le cours moyen de ses mots a la Bourse ; meches : le mot le plus use et le plus
// rare). Le vers qui se cote passe en depeche, ses mots dans le carnet d'ordres.
function versDe(poeme) {
  const v = poeme.strophes.flatMap(s => s.vers.filter(x => !x.herite && x.texte && x.texte !== "…").map(x => ({ texte: x.texte, poete: s.poete, v: x })));
  return v.length ? v : [{ texte: "aucune cotation ce jour", poete: "", v: {} }];
}
class SceneMarches {
  constructor(poeme) {
    this.poeme = poeme; this.t = 0;
    this.vers = versDe(poeme);
    let prec = 50;
    this.bougies = this.vers.map(v => {
      const mots = motsPleins(v.texte).map(m => ({ m, c: coursDe(m) }));
      const cours = mots.map(x => x.c);
      const c = cours.length ? cours.reduce((a, b) => a + b, 0) / cours.length : prec;
      const b = { o: prec, c, h: Math.max(prec, c, ...cours), l: Math.min(prec, c, ...cours), mots, vol: mots.length };
      prec = c;
      return b;
    });
    this.pas = clamp(tenue() / this.vers.length, 1.5, 3.4);
    this.duree = this.vers.length * this.pas + 5;
    this.vu = -1;
    montrerCartel(null);
  }
  maj(dt) {
    this.t += dt;
    const n = Math.min(this.vers.length - 1, Math.floor(this.t / this.pas));
    if (n !== this.vu) {
      this.vu = n;
      if (S.son) son.mot({ t: this.vers[n].texte, poete: this.vers[n].poete, cours: this.bougies[n].c });
    }
    return this.t > this.duree;
  }
  dessiner() {
    const P = palette();
    const fin = clamp(this.t / 0.8, 0, 1) * clamp((this.duree - this.t) / 1.5, 0, 1);
    const vert = P.clair ? "#1f7a3a" : "#3ee07f", rouge = P.clair ? "#b22222" : "#ff4f5e";
    const marge = Math.max(16, W * 0.03), haut = S.bourse ? 34 : 14;
    const pol = (taille, gras) => (gras ? "bold " : "") + Math.round(taille) + "px Consolas, \"Courier New\", monospace";
    ctx.save();
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
    ctx.globalAlpha = fin;
    ctx.textBaseline = "middle";
    const tE = clamp(Math.min(W, H) * 0.03, 13, 24);
    // en-tete
    ctx.font = pol(tE, true); ctx.textAlign = "left"; ctx.fillStyle = P.accent;
    ctx.fillText("SALLE DES MARCHÉS · POÏASIE", marge, haut + tE);
    ctx.font = pol(tE * 0.6); ctx.textAlign = "right"; ctx.fillStyle = P.note;
    const d = new Date();
    ctx.fillText((this.poeme.titre ? "« " + sansAccents(this.poeme.titre).toUpperCase() + " » · " : "") + (this.poeme.forme || "").toUpperCase() + " · " + d.toLocaleTimeString("fr-FR"), W - marge, haut + tE);
    const n = this.vu, b = this.bougies, k = clamp((this.t - n * this.pas) / this.pas, 0, 1);
    // la depeche : le vers qui se cote
    const v = this.vers[n];
    const tD = clamp(Math.min(W * 0.034, H * 0.05), 16, 40) * S.taille;
    const tape = Math.floor(k * this.pas * 45);
    ctx.textAlign = "left";
    ctx.font = pol(tD * 0.45, true);
    ctx.fillStyle = rouge;
    const tag = "■ DÉPÊCHE " + String(n + 1).padStart(2, "0") + "/" + String(this.vers.length).padStart(2, "0");
    ctx.fillText(tag, marge, haut + tE * 2.6);
    ctx.fillStyle = P.note;
    ctx.fillText(v.poete ? sansAccents(v.poete).toUpperCase() : "", marge + mesurer(tag, ctx.font) + tD * 0.6, haut + tE * 2.6);
    ctx.font = "italic " + Math.round(tD) + "px \"" + S.police + "\", Georgia, serif";
    ctx.fillStyle = P.texte;
    let ligne = casse(v.texte).slice(0, tape);
    while (ligne.length > 4 && mesurer(ligne, ctx.font) > W - 2 * marge) ligne = ligne.slice(1);
    ctx.fillText(ligne + (tape < v.texte.length && Math.floor(this.t * 4) % 2 ? "▌" : ""), marge, haut + tE * 2.6 + tD * 1.05);
    // le graphique
    const gx = marge, gy = haut + tE * 2.6 + tD * 2.1, gw = W * (W < 760 ? 1 : 0.7) - marge * (W < 760 ? 2 : 1.5), gh = H - gy - 74;
    if (gh < 60) { ctx.restore(); return; }
    const vus = b.slice(0, n + 1);
    // l'echelle suit les cours (les mots uses valent quelques sous, un mot neuf jusqu'a 100)
    const pasGrille = [5, 10, 20, 25, 50].find(p => p * 4 >= Math.max(...vus.map(x => x.h)) * 1.15) || 25;
    const max = pasGrille * 4, min = 0;
    const py = val => gy + gh - (gh - 10) * (val - min) / (max - min || 1);
    ctx.strokeStyle = P.note; ctx.lineWidth = 1;
    ctx.font = pol(10);
    for (let g = 0; g <= max; g += pasGrille) {
      ctx.globalAlpha = fin * 0.25;
      ctx.beginPath(); ctx.moveTo(gx, py(g) + 0.5); ctx.lineTo(gx + gw, py(g) + 0.5); ctx.stroke();
      ctx.globalAlpha = fin * 0.6; ctx.fillStyle = P.note; ctx.textAlign = "left";
      ctx.fillText(String(g), gx + gw + 6, py(g));
    }
    const nb = Math.max(this.vers.length, 8);
    const cw = gw / nb, bw = Math.max(3, cw * 0.58);
    const moy = [];
    vus.forEach((x, i) => {
      // la bougie du vers en cours se forme : sa cloture hesite avant de se poser
      const c = i === n ? lerp(x.o, x.c, sortie3(k)) + (1 - k) * 6 * bruit(this.t * 7 + i) : x.c;
      const hi = i === n ? lerp(Math.max(x.o, c), x.h, k) : x.h, lo = i === n ? lerp(Math.min(x.o, c), x.l, k) : x.l;
      const cx = gx + cw * (i + 0.5), monte = c >= x.o;
      ctx.globalAlpha = fin;
      ctx.strokeStyle = ctx.fillStyle = monte ? vert : rouge;
      ctx.beginPath(); ctx.moveTo(cx, py(hi)); ctx.lineTo(cx, py(lo)); ctx.stroke();
      const y1 = py(Math.max(x.o, c)), y2 = py(Math.min(x.o, c));
      if (monte) { ctx.lineWidth = 1.5; ctx.strokeRect(cx - bw / 2, y1, bw, Math.max(1.5, y2 - y1)); ctx.lineWidth = 1; }
      else ctx.fillRect(cx - bw / 2, y1, bw, Math.max(1.5, y2 - y1));
      // le volume : le nombre de mots pleins
      ctx.globalAlpha = fin * 0.35;
      ctx.fillRect(cx - bw / 2, gy + gh + 4, bw, Math.min(26, x.vol * 3) * (i === n ? k : 1));
      moy.push(c);
    });
    // la moyenne mobile sur trois vers
    ctx.globalAlpha = fin * 0.9; ctx.strokeStyle = P.accent; ctx.lineWidth = 1.5;
    ctx.beginPath();
    moy.forEach((c, i) => {
      const m3 = moy.slice(Math.max(0, i - 2), i + 1).reduce((a, x) => a + x, 0) / Math.min(3, i + 1);
      i ? ctx.lineTo(gx + cw * (i + 0.5), py(m3)) : ctx.moveTo(gx + cw * (i + 0.5), py(m3));
    });
    ctx.stroke(); ctx.lineWidth = 1;
    // le dernier cours, en etiquette
    const der = moy[moy.length - 1];
    ctx.setLineDash([3, 4]); ctx.globalAlpha = fin * 0.5; ctx.strokeStyle = P.accent;
    ctx.beginPath(); ctx.moveTo(gx, py(der)); ctx.lineTo(gx + gw, py(der)); ctx.stroke(); ctx.setLineDash([]);
    ctx.globalAlpha = fin; ctx.fillStyle = P.accent; ctx.fillRect(gx + gw + 2, py(der) - 9, 38, 18);
    ctx.fillStyle = P.clair ? "#fff" : "#000"; ctx.font = pol(11, true); ctx.textAlign = "center";
    ctx.fillText(der.toFixed(1), gx + gw + 21, py(der));
    // le carnet d'ordres : les mots du vers, achetes s'ils sont neufs, vendus s'ils sont uses
    if (W >= 760) {
      const ox = gx + gw + 56, ow = W - ox - marge;
      ctx.textAlign = "left"; ctx.font = pol(11); ctx.fillStyle = P.note;
      ctx.fillText("CARNET D'ORDRES", ox, gy);
      const lignes = b[n].mots.slice(0, 14);
      const lh = clamp((gh - 20) / Math.max(8, lignes.length), 14, 26);
      lignes.forEach((x, i) => {
        const yy = gy + 20 + i * lh;
        if (k * lignes.length < i) return;
        const achat = x.c >= 50;
        const clign = (Math.floor(this.t * 6) + i) % 9 === 0;
        ctx.globalAlpha = fin * (clign ? 1 : 0.85);
        ctx.fillStyle = achat ? vert : rouge;
        ctx.font = pol(clamp(lh * 0.55, 10, 15), true);
        ctx.fillText(achat ? "ACH" : "VTE", ox, yy);
        ctx.fillStyle = P.texte;
        let mot = sansAccents(x.m).toUpperCase();
        while (mot.length > 3 && mesurer(mot, ctx.font) > ow - 90) mot = mot.slice(0, -1);
        ctx.fillText(mot, ox + 38, yy);
        ctx.textAlign = "right"; ctx.fillStyle = achat ? vert : rouge;
        ctx.fillText(x.c + (achat ? " ▲" : " ▼"), ox + ow, yy);
        ctx.textAlign = "left";
      });
    }
    // krach : l'ecran rougit
    if (this.poeme.krach && n === this.vers.length - 1 && k > 0.5) {
      const p = Math.floor(this.t * 3) % 2;
      ctx.globalAlpha = fin * 0.16 * p; ctx.fillStyle = rouge; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = fin * (0.6 + 0.4 * p); ctx.font = pol(Math.min(W * 0.12, 140), true); ctx.textAlign = "center"; ctx.fillStyle = rouge;
      ctx.fillText("KRACH", W / 2, H / 2);
    }
    // les depeches deja passees, en bas
    ctx.globalAlpha = fin * 0.75; ctx.font = pol(12); ctx.textAlign = "left"; ctx.fillStyle = P.note;
    const fil = this.vers.slice(0, n).reverse().map((x, i) => (n - i) + " · " + sansAccents(x.texte).toUpperCase()).join("     ");
    ctx.fillText(fil, marge, H - 44);
    appliquerEspacement();
    ctx.restore();
  }
}

/* ================================================================ scene : la planche a billets */

// Chaque vers est imprime sur un billet de la Banque Fantome, qui sort de la presse et
// tombe en tournoyant. Sa valeur : le cours de ses mots. Au dos : ce billet n'a cours que
// dans le poeme. Des petites coupures (un seul mot) tombent avec eux.
function graine(texte) { let h = 7; for (const c of texte) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }
function fabriquerBillet(v, petit, poeme) {
  const L = petit ? 230 : 420, Hb = petit ? 116 : 210, e = Math.min(2, DPR * 1.5);
  const teinte = teinteDe(v.poete);
  const valeur = Math.max(1, Math.round(motsPleins(v.texte).reduce((a, m) => a + coursDe(m), 0) || coursDe(v.texte)));
  const serie = "PF " + String(graine(v.texte + (poeme.id || "")) % 100000000).padStart(8, "0");
  const faces = [];
  for (let face = 0; face < 2; face++) {
    const c = document.createElement("canvas");
    c.width = Math.ceil(L * e); c.height = Math.ceil(Hb * e);
    const g = c.getContext("2d");
    g.scale(e, e);
    const fond = g.createLinearGradient(0, 0, L, Hb);
    fond.addColorStop(0, "hsl(" + teinte + ",32%," + (face ? 74 : 84) + "%)");
    fond.addColorStop(1, "hsl(" + ((teinte + 30) % 360) + ",28%," + (face ? 64 : 72) + "%)");
    g.fillStyle = fond; g.fillRect(0, 0, L, Hb);
    const encre = "hsl(" + teinte + ",45%,24%)", trait = "hsla(" + teinte + ",45%,30%,0.28)";
    // les vagues de fond
    g.strokeStyle = trait; g.lineWidth = 0.6;
    for (let i = 0; i < 18; i++) {
      g.beginPath();
      for (let x = 0; x <= L; x += 4) { const y = Hb * (i + 0.5) / 18 + Math.sin(x * 0.045 + i * 0.7) * 4; x ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    }
    // la rosace guillochee
    const rx = face ? L / 2 : L * 0.22, ry = Hb * 0.52, R = Hb * (face ? 0.4 : 0.33);
    g.strokeStyle = "hsla(" + teinte + ",50%,28%,0.45)";
    for (let k = 0; k < 26; k++) {
      g.beginPath();
      for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.03) {
        const r = R * (0.72 + 0.22 * Math.sin(7 * a + k * 0.24) + 0.06 * Math.sin(19 * a));
        const x = rx + Math.cos(a) * r, y = ry + Math.sin(a) * r * 0.92;
        a ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.stroke();
    }
    // le cadre
    g.strokeStyle = encre; g.lineWidth = 2; g.strokeRect(5, 5, L - 10, Hb - 10);
    g.lineWidth = 0.7; g.strokeRect(9, 9, L - 18, Hb - 18);
    g.fillStyle = encre; g.textBaseline = "middle";
    const coin = (x, y) => {
      g.beginPath(); g.arc(x, y, Hb * 0.11, 0, Math.PI * 2); g.fillStyle = "hsla(" + teinte + ",40%,90%,0.85)"; g.fill(); g.stroke();
      g.fillStyle = encre; g.textAlign = "center"; g.font = "bold " + Math.round(Hb * (String(valeur).length > 3 ? 0.075 : 0.1)) + "px Georgia, serif";
      g.fillText(String(valeur), x, y + 1);
    };
    coin(Hb * 0.17, Hb * 0.19); coin(L - Hb * 0.17, Hb * 0.81);
    if (face === 0) {
      g.textAlign = "center";
      g.font = "bold " + Math.round(Hb * 0.1) + "px Georgia, serif";
      g.fillText("BANQUE FANTÔME", L * 0.58, Hb * 0.17);
      g.font = Math.round(Hb * 0.045) + "px Georgia, serif";
      g.fillText(petit ? "PETITE COUPURE" : "BILLET DE POÉSIE · " + (poeme.forme || "").toUpperCase(), L * 0.58, Hb * 0.27);
      // le medaillon du poete
      g.beginPath(); g.ellipse(rx, ry, R * 0.5, R * 0.6, 0, 0, Math.PI * 2);
      g.fillStyle = "hsla(" + teinte + ",35%,92%,0.9)"; g.fill(); g.strokeStyle = encre; g.lineWidth = 1.2; g.stroke();
      g.fillStyle = encre; g.font = "italic bold " + Math.round(R * 0.62) + "px Georgia, serif";
      const nom = (v.poete || "la Banque").replace(/^(le|la|l')\s*/i, "");
      g.fillText(nom.charAt(0).toUpperCase(), rx, ry);
      g.font = Math.round(Hb * 0.042) + "px Georgia, serif";
      g.fillText((v.poete || "la Banque").toUpperCase(), rx, ry + R * 0.84);
      // le vers
      const zone = L * 0.56, cx = L * 0.64;
      let taille = Hb * (petit ? 0.17 : 0.1);
      const mots = casse(v.texte).split(/\s+/);
      let lignes;
      for (;;) {
        g.font = "italic " + taille.toFixed(1) + "px \"" + S.police + "\", Georgia, serif";
        lignes = []; let l = "";
        for (const m of mots) { const essai = l ? l + " " + m : m; if (g.measureText(essai).width > zone && l) { lignes.push(l); l = m; } else l = essai; }
        if (l) lignes.push(l);
        if (lignes.length <= 3 || taille < 7) break;
        taille *= 0.88;
      }
      lignes.slice(0, 4).forEach((l, i) => g.fillText(l, cx, Hb * 0.53 + (i - (Math.min(4, lignes.length) - 1) / 2) * taille * 1.25));
      // le numero de serie, en rouge, et la signature
      g.fillStyle = "#a3241c"; g.font = "bold " + Math.round(Hb * 0.055) + "px Consolas, monospace";
      g.textAlign = "left"; g.fillText(serie, Hb * 0.34, Hb * 0.85);
      g.textAlign = "right"; g.fillText(serie, L - Hb * 0.34, Hb * 0.17);
      g.fillStyle = encre; g.font = "italic " + Math.round(Hb * 0.038) + "px Georgia, serif"; g.textAlign = "center";
      g.fillText("Le Caissier principal", L * 0.64, Hb * 0.86);
      g.beginPath(); g.lineWidth = 0.9; g.strokeStyle = encre;
      const h0 = graine(v.texte);
      for (let i = 0; i <= 26; i++) { const x = L * 0.56 + i * 3.4, y = Hb * 0.79 + Math.sin(i * 1.3 + h0 % 7) * 4 * Math.sin(i * 0.3); i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    } else {
      g.textAlign = "center";
      g.font = "bold " + Math.round(Hb * 0.3) + "px Georgia, serif";
      g.fillStyle = "hsla(" + teinte + ",45%,24%,0.85)";
      g.fillText(String(valeur), L / 2, Hb * 0.5);
      g.font = Math.round(Hb * 0.055) + "px Georgia, serif"; g.fillStyle = encre;
      g.fillText("CE BILLET N'A COURS QUE DANS LE POÈME", L / 2, Hb * 0.16);
      g.fillText("LA BANQUE FANTÔME NE GARANTIT RIEN", L / 2, Hb * 0.85);
    }
    faces.push(c);
  }
  return { faces, L, Hb, valeur };
}
class SceneBillets {
  constructor(poeme) {
    this.poeme = poeme; this.t = 0;
    this.vers = versDe(poeme);
    this.i = 0; this.prochain = 0.4; this.petite = 1.2;
    this.billets = [];
    this.pas = clamp(tenue() / this.vers.length, 0.9, 2.6);
    this.duree = this.vers.length * this.pas + 9;
    this.echelle = clamp(Math.min(W / 1500, H / 900), 0.45, 1.3) * S.taille;
    montrerCartel(poeme);
  }
  lacher(v, petit) {
    const b = fabriquerBillet(v, petit, this.poeme);
    this.billets.push({ b, x: hasard(0.12, 0.88) * W, y: -b.Hb * this.echelle * 0.8, vy: hasard(55, 95) * (petit ? 1.2 : 1), ph: hasard(0, 6.28),
      vrille: hasard(1.2, 2.6) * (Math.random() < 0.5 ? -1 : 1), rot: hasard(-0.4, 0.4), vr: hasard(-0.5, 0.5), derive: hasard(30, 90), petit,
      ech: this.echelle * (petit ? hasard(0.75, 1) : 1), z: petit ? 0 : 1 });
    if (!petit && S.son) son.piece();
  }
  maj(dt) {
    this.t += dt;
    this.prochain -= dt;
    if (this.prochain <= 0 && this.i < this.vers.length) { this.lacher(this.vers[this.i++], false); this.prochain = this.pas; }
    this.petite -= dt;
    if (S.billets > 0 && this.petite <= 0 && this.t < this.duree - 4 && D.corpus.length) {
      const m = tirer(D.corpus);
      this.lacher({ texte: m, poete: tirer(Object.keys(TEINTES).slice(0, 6)) }, true);
      this.petite = 10 / S.billets;
    }
    const pousse = S.musique && musique.actif ? 1 + musique.basses * pulseMots() : 1;
    for (const o of this.billets) {
      o.y += o.vy * dt * pousse;
      o.ph += o.vrille * dt;
      o.rot += o.vr * dt;
      o.x += Math.sin(o.ph * 0.7) * o.derive * dt;
    }
    this.billets = this.billets.filter(o => o.y < H + o.b.L * o.ech);
    return this.t > this.duree && (this.i >= this.vers.length && !this.billets.some(o => !o.petit) || this.t > this.duree + 10);
  }
  dessiner() {
    const P = palette();
    // la presse, en haut
    const hp = Math.round(clamp(H * 0.045, 18, 40));
    ctx.save();
    ctx.globalAlpha = clamp(this.t, 0, 1) * clamp((this.duree - this.t + 6) / 2, 0, 1);
    ctx.fillStyle = P.clair ? "#3a342b" : "#15171c"; ctx.fillRect(0, 0, W, hp);
    ctx.strokeStyle = P.clair ? "#6b6355" : "#3a3f4a"; ctx.lineWidth = 2;
    for (let x = (-this.t * 160) % 24; x < W; x += 24) { ctx.beginPath(); ctx.moveTo(x, hp * 0.25); ctx.lineTo(x + 10, hp * 0.75); ctx.stroke(); }
    ctx.fillStyle = P.accent; ctx.fillRect(0, hp - 3, W, 3);
    ctx.globalAlpha = 1;
    const tri = this.billets.slice().sort((a, b) => a.z - b.z);
    for (const o of tri) {
      const f = Math.cos(o.ph);
      const img = o.b.faces[f >= 0 ? 0 : 1];
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(o.rot);
      ctx.scale(o.ech, o.ech * Math.max(0.04, Math.abs(f)));
      ctx.globalAlpha = 0.6 + 0.4 * Math.abs(f);
      ctx.drawImage(img, -o.b.L / 2, -o.b.Hb / 2, o.b.L, o.b.Hb);
      ctx.restore();
    }
    ctx.restore();
  }
}

/* ================================================================ scene : la machine a sous */

// Chaque vers se joue au bandit manchot : les rouleaux tournent sur des mots du poeme
// infini et s'arretent un a un sur ceux du vers. Une rime, un mot impose par la Banque ou un
// mot de fin de sextine : jackpot, les sous pleuvent. Le poeme s'imprime sur le ticket.
class SceneMachine {
  constructor(poeme) {
    this.poeme = poeme; this.t = 0;
    // dix vers au plus : au-dela, la partie durait une minute et demie
    const tous = versDe(poeme);
    this.vers = tous.length > 10 ? Array.from({ length: 10 }, (_, i) => tous[Math.round(i * (tous.length - 1) / 9)]) : tous;
    this.iv = -1; this.ticket = []; this.pieces = [];
    this.etat = "levier"; this.te = 0; this.gain = null;
    this.fin = 0;
    montrerCartel(poeme);
    this.preparer();
  }
  preparer() {
    this.iv++;
    if (this.iv >= this.vers.length) { this.etat = "fin"; this.te = 0; return; }
    const v = this.vers[this.iv];
    const mots = casse(v.texte).split(/\s+/).filter(Boolean);
    const n = clamp(Math.min(mots.length, Math.round(S.rouleaux)), 1, 8);
    // les mots du vers, repartis sur n rouleaux
    const morceaux = Array.from({ length: n }, (_, i) => mots.slice(Math.floor(i * mots.length / n), Math.floor((i + 1) * mots.length / n)).join(" "));
    const source = D.corpus.length ? D.corpus : ["obole", "liard", "créance", "sou"];
    const pasTour = clamp(tenue() / this.vers.length, 1.6, 3.6);
    this.rouleaux = morceaux.map((cible, i) => {
      const L = 22 + i * 5;
      const bande = Array.from({ length: L + 3 }, () => casse(tirer(source)));
      bande[L] = cible;
      return { bande, L, pos: hasard(0, 3), depart: 0, arret: 0.9 + i * (pasTour * 0.5 / n) + hasard(0, 0.15), fini: false };
    });
    for (const r of this.rouleaux) r.depart = r.pos;
    this.etat = "levier"; this.te = 0; this.gain = null;
  }
  maj(dt) {
    this.t += dt; this.te += dt;
    if (this.etat === "levier" && this.te > 0.5) { this.etat = "tourne"; this.te = 0; }
    if (this.etat === "tourne") {
      let tous = true;
      for (const r of this.rouleaux) {
        if (r.fini) continue;
        const p = clamp(this.te / r.arret, 0, 1);
        // il lance vite puis se pose sur sa cible, avec un petit rebond
        const e = p < 1 ? 1 - Math.pow(1 - p, 3) : 1;
        r.pos = lerp(r.depart, r.L, e) + (p > 0.92 ? Math.sin((p - 0.92) / 0.08 * Math.PI) * 0.12 : 0);
        r.vitesse = p < 1 ? 3 * Math.pow(1 - p, 2) * (r.L - r.depart) / r.arret : 0;
        if (p >= 1) { r.fini = true; r.pos = r.L; if (S.son) son.note(520 + this.rouleaux.indexOf(r) * 90, 0.15, "square", 0.02); }
        else tous = false;
      }
      if (tous) this.payer();
    } else if (this.etat === "gain" && this.te > (this.gain.jackpot ? 2.6 : 1.3)) {
      this.ticket.push(this.vers[this.iv]);
      this.preparer();
    } else if (this.etat === "fin" && this.te > 5) return true;
    for (const p of this.pieces) { p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; }
    this.pieces = this.pieces.filter(p => p.y < H + 30);
    return false;
  }
  payer() {
    const vv = this.vers[this.iv], v = vv.v || {};
    const somme = motsPleins(vv.texte).reduce((a, m) => a + coursDe(m), 0);
    const prec = this.vers[this.iv - 1];
    const rime = v.lettre && prec && prec.v && prec.v.lettre === v.lettre;
    const raison = v.impose ? "MOT IMPOSÉ : " + sansAccents(v.impose).toUpperCase() : v.fin ? "MOT DE FIN : " + sansAccents(v.fin).toUpperCase() : rime ? "RIME EN " + v.lettre : "";
    this.gain = { somme, jackpot: !!raison, raison };
    this.etat = "gain"; this.te = 0;
    const n = raison ? 70 : 8;
    for (let i = 0; i < n; i++) this.pieces.push({ x: W / 2 + hasard(-60, 60), y: H * 0.42, vx: hasard(-380, 380), vy: hasard(-720, -260), r: 0, vr: hasard(-9, 9), t: hasard(9, 15) });
    if (S.son) { son.piece(); if (raison) setTimeout(() => son.piece(), 180); }
    if (raison) manette.vibrer(0.35);
  }
  dessiner() {
    const P = palette();
    const apparait = clamp(this.t / 0.8, 0, 1) * (this.etat === "fin" ? clamp((5 - this.te) / 1.5, 0, 1) : 1);
    const n = this.rouleaux ? this.rouleaux.length : 5;
    const mw = Math.min(W * 0.84, 1100), cellW = (mw - 60) / n, cellH = clamp(H * 0.13, 60, 140);
    const mx = W / 2 - mw / 2, my = H * 0.2, mh = cellH * 3 + 70;
    ctx.save();
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
    ctx.globalAlpha = apparait;
    // la caisse
    const caisse = ctx.createLinearGradient(0, my - 60, 0, my + mh);
    caisse.addColorStop(0, "#7a0c14"); caisse.addColorStop(0.5, "#b3121f"); caisse.addColorStop(1, "#4d070c");
    ctx.fillStyle = caisse;
    ctx.fillRect(mx - 14, my - 64, mw + 28, mh + 78);
    ctx.strokeStyle = "#e8c46a"; ctx.lineWidth = 3; ctx.strokeRect(mx - 14, my - 64, mw + 28, mh + 78);
    // le fronton et ses ampoules
    ctx.fillStyle = "#e8c46a"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "bold " + Math.round(clamp(mw * 0.032, 13, 30)) + "px Georgia, serif";
    ctx.fillText("MACHINE À SOUS DE LA BANQUE FANTÔME", W / 2, my - 34);
    const nbA = Math.floor(mw / 22);
    for (let i = 0; i < nbA; i++) {
      const allume = (i + Math.floor(this.t * (this.etat === "gain" ? 14 : 4))) % 3 === 0;
      ctx.fillStyle = allume ? "#fff6c0" : "#6d5a2a";
      ctx.beginPath(); ctx.arc(mx + 4 + i * (mw - 8) / (nbA - 1), my - 58, 3.2, 0, Math.PI * 2); ctx.fill();
    }
    // les rouleaux
    const rx0 = mx + 30, ry = my + 20;
    ctx.fillStyle = "#f4efe2"; ctx.fillRect(rx0 - 8, ry - 8, n * cellW + 16, cellH * 3 + 16);
    (this.rouleaux || []).forEach((r, i) => {
      const x = rx0 + i * cellW;
      ctx.save();
      ctx.beginPath(); ctx.rect(x + 2, ry, cellW - 4, cellH * 3); ctx.clip();
      const fond = ctx.createLinearGradient(0, ry, 0, ry + cellH * 3);
      fond.addColorStop(0, "#9c968a"); fond.addColorStop(0.5, "#fffdf6"); fond.addColorStop(1, "#9c968a");
      ctx.fillStyle = fond; ctx.fillRect(x + 2, ry, cellW - 4, cellH * 3);
      const base = Math.floor(r.pos), frac = r.pos - base;
      const flou = clamp((r.vitesse || 0) / 25, 0, 1);
      for (let j = -2; j <= 2; j++) {
        const idx = base + j;
        if (idx < 0 || idx >= r.bande.length) continue;
        const mot = r.bande[idx];
        const y = ry + cellH * 1.5 + (j - frac) * cellH;
        let taille = Math.min(cellH * 0.34, (cellW - 14) / Math.max(3, mot.length * 0.52)) * S.taille;
        const pol = (j === 0 && r.fini ? "bold " : "") + taille.toFixed(1) + "px \"" + S.police + "\", Georgia, serif";
        ctx.font = pol;
        ctx.fillStyle = r.fini && j === 0 ? "#7a0c14" : "#2a241c";
        if (flou > 0.05) {
          for (let s = 0; s < 3; s++) { ctx.globalAlpha = apparait * (0.35 - s * 0.1); ctx.fillText(mot, x + cellW / 2, y - s * flou * cellH * 0.18); }
          ctx.globalAlpha = apparait;
        } else ctx.fillText(mot, x + cellW / 2, y);
      }
      ctx.restore();
      ctx.strokeStyle = "#5a4a30"; ctx.lineWidth = 1; ctx.strokeRect(x + 2.5, ry + 0.5, cellW - 5, cellH * 3 - 1);
    });
    // la ligne de paiement
    ctx.strokeStyle = this.etat === "gain" && this.gain.jackpot && Math.floor(this.t * 8) % 2 ? "#ffef7a" : "#d42a2a";
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(rx0 - 12, ry + cellH * 1.5); ctx.lineTo(rx0 + n * cellW + 12, ry + cellH * 1.5); ctx.stroke();
    // le levier
    const lx = mx + mw + 30, ly = my + mh * 0.35;
    const tire = this.etat === "levier" ? Math.sin(clamp(this.te / 0.5, 0, 1) * Math.PI) : 0;
    const bout = ly - cellH * 1.2 * Math.cos(tire * 1.2);
    ctx.strokeStyle = "#c9c9c9"; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(lx, ly + cellH * 0.6); ctx.lineTo(lx, bout); ctx.stroke();
    ctx.fillStyle = "#d42a2a"; ctx.beginPath(); ctx.arc(lx, bout, 13, 0, Math.PI * 2); ctx.fill();
    // le gain
    const gy = my + mh + 34;
    if (this.etat === "gain") {
      const g = this.gain;
      ctx.textAlign = "center";
      if (g.jackpot) {
        const p = 1 + 0.08 * Math.sin(this.te * 18);
        ctx.save(); ctx.translate(W / 2, gy); ctx.scale(p, p);
        ctx.fillStyle = "#ffe066"; ctx.font = "bold " + Math.round(clamp(mw * 0.06, 22, 64)) + "px Impact, Georgia, sans-serif";
        ctx.shadowColor = "#ff9900"; ctx.shadowBlur = 18;
        ctx.fillText("JACKPOT · " + g.somme + " SOUS", 0, 0);
        ctx.restore();
        ctx.fillStyle = P.texte; ctx.font = Math.round(clamp(mw * 0.018, 11, 18)) + "px Consolas, monospace";
        ctx.fillText(g.raison, W / 2, gy + clamp(mw * 0.045, 20, 48));
      } else {
        ctx.fillStyle = P.accent; ctx.font = "bold " + Math.round(clamp(mw * 0.028, 14, 30)) + "px Consolas, monospace";
        ctx.fillText("GAIN : " + g.somme + " SOUS", W / 2, gy);
      }
    }
    // le ticket : les vers deja joues
    const tl = this.ticket.slice(-4);
    if (tl.length) {
      const ty = Math.min(H - 30 - tl.length * 22, gy + 92);
      ctx.textAlign = "center";
      tl.forEach((v, i) => {
        ctx.globalAlpha = apparait * (0.45 + 0.55 * (i + 1) / tl.length);
        ctx.fillStyle = P.texte;
        ctx.font = "italic " + Math.round(clamp(H * 0.022, 12, 22) * S.taille) + "px \"" + S.police + "\", Georgia, serif";
        ctx.fillText(casse(v.texte), W / 2, ty + i * clamp(H * 0.03, 16, 30));
      });
    }
    // les sous qui pleuvent
    ctx.globalAlpha = apparait;
    for (const p of this.pieces) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.scale(Math.cos(p.r), 1);
      ctx.fillStyle = "#e8c46a"; ctx.beginPath(); ctx.arc(0, 0, p.t, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#9a7a2a"; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = "#9a7a2a"; ctx.font = "bold " + Math.round(p.t * 1.1) + "px Georgia, serif"; ctx.fillText("¤", 0, 1);
      ctx.restore();
    }
    appliquerEspacement();
    ctx.restore();
  }
}

