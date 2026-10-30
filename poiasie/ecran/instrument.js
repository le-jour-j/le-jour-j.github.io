"use strict";
/* ================================================================ l'instrument (2026-10-23) */

// Jiiji, 2026-10-23 : « tu saurais me dire si le moteur sonore s'accorde avec le son en entree ? que ce
// soit en entree analogique de la focusrite ou bien avec une entree stereo, comme pour un vjing /
// accompagnement flute », puis « flute d'abord ». Avant, le son suivait le tempo de la musique, jamais
// ses notes : la gamme et la tonique etaient tirees au sort, le la etait a 440.
//
// Ici, l'ecran ecoute un instrument qui joue une note a la fois (flute, voix, violon) sur l'entree
// deja ouverte par l'onglet Musique (musique.source : le micro ou l'entree son seulement, jamais le son
// de l'ecran lui-meme). Rien n'est enregistre ni rejoue tel quel.
// - la hauteur : YIN (difference cumulee normalisee, premier creux sous le seuil, interpolation
//   parabolique), a chaque image, sur 2048 echantillons ;
// - les notes : une hauteur tenue 45 ms devient une note ; le vibrato ne la coupe pas (jusqu'a 65
//   cents) ; 70 ms sans hauteur la finissent ; une phrase finit apres 0,6 s de silence ;
// - le diapason : l'ecart moyen des notes au demi-ton le plus proche, en moyenne circulaire (une flute
//   a 442 ou un peu basse) ; son.diapason le suit, et le son joue juste avec elle ;
// - la tonalite : un histogramme des douze notes, pondere par la duree, qui s'oublie en
//   instrumentMemoire secondes ; pour chaque tonique et chaque gamme temperee, la part des notes
//   entendues qui y tombent, moins celles qui en sortent, plus le profil de Krumhansl-Kessler (la
//   tonique et la quinte pesent) et la note ou finissent les phrases. Une tonalite nouvelle doit gagner
//   3 s de suite pour remplacer l'ancienne ;
// - ce que le son en fait : il prend la tonalite (son.nouvelleGamme ne tire plus au sort), il laisse la
//   place quand on joue (son.ecouterSilence), il repond aux phrases (a l'identique, a l'envers, en
//   miroir, une marche plus haut, plus lent), il double les notes (octave, tierce, quinte, accord).
// L'ecran peut s'entendre lui-meme dans les enceintes de la salle : une note qui sort du silence, faible,
// sur la note qu'il vient de jouer (meme nom, 20 a 350 ms apres) est un echo, et ne compte pas.

const INSTRUMENT_REGISTRES = { flute: [230, 2600], voix: [70, 1100], tout: [60, 2600] };
// les gammes temperees qu'il peut reconnaitre (les autres, maqams, gamelan, ne joueraient pas juste
// avec un instrument accorde au demi-ton)
const INSTRUMENT_GAMMES = ["majeur", "mineur", "harmonique", "melodique", "dorien", "phrygien", "lydien", "mixolydien", "pentaMaj", "pentaMin", "blues"];
const KK_MAJEUR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const KK_MINEUR = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

ajouterReglages("Musique", "L'instrument (une note à la fois : flûte, voix, violon…)", [
  { cle: "instrument", nom: "Écouter les notes de l'instrument (sur l'entrée son ci-dessus)", type: "case" },
  { cle: "instrumentEntree", nom: "Il écoute", type: "choix", options: [["mix", "toute l'entrée son"], ["1", "l'entrée 1 seulement"],
    ["2", "l'entrée 2 seulement"]] },
  { cle: "instrumentRegistre", nom: "Registre", type: "choix", options: [["flute", "Flûte, sifflet, violon (230 à 2 600 Hz)"],
    ["voix", "Voix, saxophone, violoncelle (70 à 1 100 Hz)"], ["tout", "Tout (60 à 2 600 Hz, un peu plus lourd)"]] },
  { cle: "instrumentSeuil", nom: "Sensibilité (seulement les notes franches ↔ aussi les notes faibles)", type: "curseur", min: 0, max: 1, pas: 0.05 },
  { cle: "instrumentAccord", nom: "Le son prend la tonalité qu'il entend", type: "case" },
  { cle: "instrumentMemoire", nom: "Il se souvient des notes pendant (secondes)", type: "curseur", min: 5, max: 120, pas: 5 },
  { cle: "instrumentDiapason", nom: "Diapason", type: "choix", options: [["auto", "Il s'accorde sur l'instrument"], ["440", "la = 440 Hz"],
    ["442", "la = 442 Hz"], ["443", "la = 443 Hz"], ["415", "la = 415 Hz (baroque)"], ["432", "la = 432 Hz"]] },
  { cle: "instrumentPlace", nom: "Il te laisse la place quand tu joues (0 : non, 1 : il se tait)", type: "curseur", min: 0, max: 1, pas: 0.05 },
  { cle: "instrumentReponse", nom: "Il répond à tes phrases (la part des phrases)", type: "curseur", min: 0, max: 1, pas: 0.05 },
  { cle: "instrumentRegistreReponse", nom: "Il répond", type: "choix", options: [["dessous", "une octave en dessous"], ["meme", "dans ton registre"],
    ["dessus", "une octave au-dessus"]] },
  { cle: "instrumentDouble", nom: "Il double tes notes", type: "choix", options: [["non", "non"], ["octave", "à l'octave en dessous"],
    ["tierce", "une tierce en dessous (dans la gamme)"], ["quinte", "une quinte en dessous"], ["accord", "un accord en dessous"]] },
  { cle: "instrumentTimbre", nom: "Timbre de la réponse et du double", type: "choix",
    options: [["motif", "celui du pattern en cours"]].concat(TIMBRES_NOMS.filter(t => TIMBRES_DOUX.includes(t[0]))) },
  { cle: "instrumentVolume", nom: "Volume de la réponse et du double", type: "curseur", min: 0, max: 1.5, pas: 0.05 },
], { instrument: false, instrumentEntree: "mix", instrumentRegistre: "flute", instrumentSeuil: 0.5, instrumentAccord: true, instrumentMemoire: 30,
  instrumentDiapason: "auto", instrumentPlace: 0.4, instrumentReponse: 0.5, instrumentRegistreReponse: "dessous", instrumentDouble: "non",
  instrumentTimbre: "motif", instrumentVolume: 0.8 });
// c'est l'installation du soir (comme l'entree son) : ni les presets, ni le hasard n'y touchent
for (const c of ["instrument", "instrumentEntree", "instrumentRegistre", "instrumentSeuil", "instrumentAccord", "instrumentMemoire", "instrumentDiapason",
  "instrumentPlace", "instrumentReponse", "instrumentRegistreReponse", "instrumentDouble", "instrumentTimbre", "instrumentVolume"]) {
  PRESET_JAMAIS.add(c); HASARD_JAMAIS.add(c); PC_JAMAIS.add(c);
}
// en vue dans le panneau range (rangement.js) ; le reste dans « Avancé »
if (typeof ESSENTIEL !== "undefined") for (const c of ["instrument", "instrumentAccord", "instrumentDiapason", "instrumentPlace", "instrumentReponse", "instrumentDouble"]) ESSENTIEL.add(c);

const instrument = {
  analyse: null, source: null, buf: null, dif: null,
  rms: 0, plancher: 0.001, plafond: 0.01, hz: 0, p: 0, clarte: 0,
  // la note qui sonne : { m (demi-tons, la 440 = 69, corrige du diapason), debut, d, p (hauteurs brutes), force, echo }
  note: null, candidat: null, candidatT: 0, candidatP: [], sansSon: 9, silence: 9, presence: 0,
  phrase: [], derniereFin: 0,
  // ce qu'il a entendu : les douze notes, les fins de phrase, le diapason (moyenne circulaire)
  pcs: new Float64Array(12), fins: new Float64Array(12), sx: 0, sy: 0, poidsDiapason: 0,
  cle: null, rival: null, rivalT: 0, sure: 0, prochainCalcul: 0, diapasonPose: 1,
  notesEcran: [], reponseJusqua: 0, derniereReponse: "", derniereReponseT: -99, prochainUI: 0,

  ecoute: false,
  // l'entree de l'onglet Musique, a part (le son de l'ecran n'y entre pas)
  // instrumentEntree : les deux entrees melangees, ou seulement la 1 ou la 2 (la flute sur l'une, la voix
  // sur l'autre : il n'ecoute que la flute)
  brancher() {
    const src = S.instrument && S.musique && musique.actif ? musique.source : null, entree = String(S.instrumentEntree || "mix");
    if (src === this.source && entree === this.entree) return !!src;
    if (this.source) { try { this.source.disconnect(this.coupe || this.analyse); } catch (e) { /* deja fait */ } }
    this.source = null; this.analyse = null; this.coupe = null; this.entree = entree;
    if (!src || !musique.ctx) return false;
    this.analyse = musique.ctx.createAnalyser();
    this.analyse.fftSize = 2048; this.analyse.smoothingTimeConstant = 0;
    if (entree === "1" || entree === "2") {
      this.coupe = musique.ctx.createChannelSplitter(2);
      src.connect(this.coupe); this.coupe.connect(this.analyse, entree === "1" ? 0 : 1);
    } else src.connect(this.analyse);
    this.source = src;
    return true;
  },

  maj(dt) {
    const t = performance.now() / 1000;
    this.ecoute = this.brancher();
    if (this.ecoute) {
      const a = this.analyse, n = a.fftSize;
      if (!this.buf || this.buf.length !== n) this.buf = new Float32Array(n);
      a.getFloatTimeDomainData(this.buf);
      const b = this.buf;
      let s = 0;
      for (let i = 0; i < n; i++) s += b[i] * b[i];
      const r = this.rms = Math.sqrt(s / n);
      // le bruit de la salle (plancher) et la note la plus forte des dernieres secondes (plafond), comme
      // pour la voix (modes.js)
      this.plancher = r < this.plancher ? lerp(this.plancher, r, 1 - Math.exp(-dt * 5)) : this.plancher * Math.pow(2, dt / 8);
      this.plancher = clamp(this.plancher, 0.0002, Math.max(0.0003, this.plafond * 0.3));
      this.plafond = Math.max(r, this.plafond * Math.pow(0.5, dt / 12), this.plancher * 5, 0.004);
      const porte = this.plancher * (1.5 + 4 * (1 - clamp(Number(S.instrumentSeuil), 0, 1)));
      this.hz = r > porte && r > 0.001 ? this.hauteurDe(musique.ctx.sampleRate) : 0;
      this.suivre(t, dt, this.hz, r / this.plafond);
    } else if (this.note || this.candidat) { this.suivre(t, dt, 0, 0); }
    else this.silence += dt;
    // les phrases, la place, l'oubli
    if (this.phrase.length && !this.note && this.silence > 0.6) this.phraseFinie();
    const joue = this.note && !this.note.echo;
    const vise = joue || this.silence < 0.5 && this.phrase.length ? 1 : 0;
    this.presence = lerp(this.presence, vise, 1 - Math.exp(-dt * (vise > this.presence ? 7 : 0.8)));
    const mem = clamp(Number(S.instrumentMemoire) || 30, 5, 600), oubli = Math.pow(0.5, dt / mem);
    for (let i = 0; i < 12; i++) { this.pcs[i] *= oubli; this.fins[i] *= oubli; }
    // le diapason ne bouge pas d'un morceau a l'autre : il oublie trois fois plus lentement
    const oubliD = Math.pow(0.5, dt / Math.max(60, mem * 3));
    this.sx *= oubliD; this.sy *= oubliD; this.poidsDiapason *= oubliD;
    if (t >= this.prochainCalcul) { this.prochainCalcul = t + 0.5; this.estimer(); }
    this.poserDiapason();
    if (t >= this.prochainUI && typeof panneau !== "undefined" && !panneau.hidden) { this.prochainUI = t + 0.2; majInstrumentUI(); }
  },

  // YIN : la difference du signal avec lui-meme decale, cumulee et normalisee ; le premier creux sous le
  // seuil est la periode (le plus petit decalage : pas d'erreur d'octave vers le grave)
  hauteurDe(sr) {
    const [fmin, fmax] = INSTRUMENT_REGISTRES[S.instrumentRegistre] || INSTRUMENT_REGISTRES.flute;
    const b = this.buf, N = b.length;
    const tauMin = Math.max(2, Math.floor(sr / fmax)), tauMax = Math.min(N >> 1, Math.ceil(sr / fmin)), W = N - tauMax;
    if (!this.dif || this.dif.length < tauMax + 2) this.dif = new Float32Array(tauMax + 2);
    const d = this.dif;
    let cumul = 0;
    d[0] = 1;
    for (let tau = 1; tau <= tauMax; tau++) {
      let s = 0;
      for (let i = 0; i < W; i++) { const x = b[i] - b[i + tau]; s += x * x; }
      cumul += s;
      d[tau] = cumul > 0 ? s * tau / cumul : 1;
    }
    let choisi = -1;
    for (let tau = tauMin; tau < tauMax; tau++) {
      if (d[tau] < 0.15) { while (tau + 1 < tauMax && d[tau + 1] < d[tau]) tau++; choisi = tau; break; }
    }
    if (choisi < 0) {
      // aucun creux franc : le plus profond, s'il l'est assez (une note voilee, du souffle dedans)
      let m = 1;
      for (let tau = tauMin; tau < tauMax; tau++) if (d[tau] < m) { m = d[tau]; choisi = tau; }
      if (m > 0.3) choisi = -1;
    }
    if (choisi < 1) { this.clarte = 0; return 0; }
    this.clarte = 1 - d[choisi];
    const x0 = d[choisi - 1], x1 = d[choisi], x2 = d[choisi + 1], den = x0 - 2 * x1 + x2;
    const tau = choisi + (Math.abs(den) > 1e-9 ? clamp(0.5 * (x0 - x2) / den, -0.5, 0.5) : 0);
    return sr / tau;
  },

  // l'ecart du diapason, en demi-tons (de -0,5 a 0,5) : celui qu'il entend, ou celui qu'on a choisi
  ecart() {
    if (S.instrumentDiapason !== "auto") return 12 * Math.log2((Number(S.instrumentDiapason) || 440) / 440);
    if (this.poidsDiapason < 1.5 || Math.hypot(this.sx, this.sy) / this.poidsDiapason < 0.6) return 0;
    return Math.atan2(this.sy, this.sx) / (2 * Math.PI);
  },
  diapasonHz() { return 440 * Math.pow(2, this.ecart() / 12); },
  // son.diapason suit (case cochee) ; le bourdon et la nappe se raccordent s'il a bouge de plus de 2 cents
  poserDiapason() {
    const r = S.instrument ? Math.pow(2, this.ecart() / 12) : 1;
    son.diapason = r;
    if (Math.abs(1200 * Math.log2(r / this.diapasonPose)) > 2) { this.diapasonPose = r; if (son.ctx) son.accorder(false); }
  },

  suivre(t, dt, hz, force) {
    if (hz > 0) {
      const p = 69 + 12 * Math.log2(hz / 440), m = p - this.ecart();
      this.sansSon = 0; this.p = p;
      if (this.note && Math.abs(m - this.note.m) < 0.65) {
        // la note continue, vibrato compris
        const n = this.note;
        n.d += dt; n.force = Math.max(n.force, force);
        if (n.p.length < 96) n.p.push(p);
        this.candidat = null;
      } else {
        const proche = Math.round(m);
        if (this.candidat === proche) this.candidatT += dt;
        else { this.candidat = proche; this.candidatT = dt; this.candidatP = []; }
        this.candidatP.push(p);
        if (this.candidatT >= 0.045) {
          const depuisSilence = !this.note && this.silence > 0.12;
          this.finir(t);
          this.commencer(t, proche, force, depuisSilence);
        }
      }
    } else {
      this.sansSon += dt; this.candidat = null;
      if (this.note && this.sansSon > 0.07) this.finir(t);
    }
    // le silence : depuis la fin de la derniere note (une note qui s'annonce ne l'interrompt pas)
    this.silence = this.note ? 0 : this.silence + dt;
  },
  commencer(t, m, force, depuisSilence) {
    const echo = this.estEcho(m, force, depuisSilence);
    this.note = { m, debut: t - this.candidatT, d: this.candidatT, p: this.candidatP.slice(), force, echo };
    this.candidat = null;
    if (!echo) this.doubler(m);
  },
  finir(t) {
    const n = this.note;
    if (!n) return;
    this.note = null;
    this.derniereFin = t;
    if (n.d < 0.06 || n.echo) return;
    // la note compte pour la tonalite (sa duree) et pour le diapason (sa hauteur moyenne, vibrato compris)
    this.pcs[((n.m % 12) + 12) % 12] += clamp(n.d, 0.08, 1.5);
    const tri = n.p.slice().sort((a, b) => a - b), milieu = tri.slice(Math.floor(tri.length * 0.2), Math.ceil(tri.length * 0.8));
    const pm = milieu.reduce((a, x) => a + x, 0) / Math.max(1, milieu.length), w = clamp(n.d, 0.1, 1);
    this.sx += w * Math.cos(2 * Math.PI * pm); this.sy += w * Math.sin(2 * Math.PI * pm); this.poidsDiapason += w;
    this.phrase.push({ m: n.m, debut: n.debut, d: n.d });
    if (this.phrase.length > 16) this.phrase.shift();
  },
  phraseFinie() {
    const ph = this.phrase;
    this.phrase = [];
    const der = ph[ph.length - 1];
    this.fins[((der.m % 12) + 12) % 12] += 1;
    // jamais une reponse par-dessus la sienne (ni un ping-pong avec son propre echo)
    const libre = !son.ctx || son.maintenant() > this.reponseJusqua + 1;
    if (libre && ph.length >= 3 && Math.random() < clamp(Number(S.instrumentReponse) || 0, 0, 1)) this.repondre(ph);
  },

  // l'ecran s'entend-il lui-meme ? (bus « note » : chaque note qu'il joue, a l'heure du son)
  estEcho(m, force, depuisSilence) {
    if (!son.ctx) return false;
    const now = son.maintenant();
    if (!depuisSilence && force > 0.35) return false;
    this.notesEcran = this.notesEcran.filter(e => now - e.t < 1);
    for (const e of this.notesEcran) {
      const me = 69 + 12 * Math.log2(e.f / 440) - this.ecart(), x = ((Math.round(me) - m) % 12 + 12) % 12;
      if (x === 0 && now - e.t > 0.02 && now - e.t < 0.35) return true;
    }
    return false;
  },

  // ---- la tonalite ----
  estimer() {
    let total = 0, totalFins = 0;
    for (let i = 0; i < 12; i++) { total += this.pcs[i]; totalFins += this.fins[i]; }
    if (total < 2.5) { this.sure = 0; this.meilleur = null; return; }
    const h = Array.from(this.pcs, x => x / total);
    const correl = (profil, ton) => {
      let mx = 0, mp = 0;
      for (let i = 0; i < 12; i++) { mx += h[(i + ton) % 12]; mp += profil[i]; }
      mx /= 12; mp /= 12;
      let sxy = 0, sxx = 0, syy = 0;
      for (let i = 0; i < 12; i++) { const a = h[(i + ton) % 12] - mx, b = profil[i] - mp; sxy += a * b; sxx += a * a; syy += b * b; }
      return sxy / Math.sqrt(sxx * syy + 1e-12);
    };
    let best = null, actuel = -9;
    const candidats = [];
    for (let ton = 0; ton < 12; ton++) {
      const kkMaj = correl(KK_MAJEUR, ton), kkMin = correl(KK_MINEUR, ton);
      for (const cle of INSTRUMENT_GAMMES) {
        const g = (GAMMES.find(x => x[0] === cle) || GAMMES[0])[2];
        // les notes de la gamme sur cette tonique, en douze bits
        let notes = 0;
        for (const x of g) notes |= 1 << ((Math.round(x) + ton) % 12);
        let dedans = 0, jamais = 0;
        for (let i = 0; i < 12; i++) if (notes & (1 << i)) { dedans += h[i]; if (h[i] < 0.03) jamais++; }
        const mineur = g.includes(3) && !g.includes(4);
        const score = dedans - 2 * (1 - dedans) - 0.3 * jamais / g.length + 0.4 * (mineur ? kkMin : kkMaj)
          + (totalFins > 0 ? 0.25 * this.fins[ton] / totalFins : 0);
        const c = { ton, cle, score, notes };
        candidats.push(c);
        if (!best || score > best.score) best = c;
        if (this.cle && this.cle.ton === ton && this.cle.cle === cle) actuel = score;
      }
    }
    // la surete : l'avance sur la meilleure tonalite qui contredit ce qu'il a entendu. Une tonalite qui
    // a les memes notes entendues (do majeur et la mineur ; re majeur et la majeur quand le sol et le sol
    // diese ne sont jamais joues ; la pentatonique dans la majeure) ne la contredit pas : le son jouerait
    // juste avec les deux, la tonique (le profil, les fins de phrase) les departage
    let entendues = 0;
    for (let i = 0; i < 12; i++) if (h[i] >= 0.03) entendues |= 1 << i;
    let second = -9;
    for (const c of candidats) {
      const compatible = (c.notes & entendues) === (best.notes & entendues) || (c.notes & best.notes) === c.notes;
      if (!compatible && c.score > second) second = c.score;
    }
    this.sure = clamp((best.score - second) / 0.6, 0, 1) * clamp(total / 6, 0, 1);
    this.meilleur = best;
    if (!this.cle) {
      if (this.sure >= 0.35) this.adopter(best);
      return;
    }
    if (best.ton === this.cle.ton && best.cle === this.cle.cle) { this.rival = null; this.rivalT = 0; }
    else {
      if (this.rival && this.rival.ton === best.ton && this.rival.cle === best.cle) this.rivalT += 0.5;
      else { this.rival = best; this.rivalT = 0; }
      if (this.rivalT >= 3 && best.score > actuel + 0.08 && this.sure >= 0.25) this.adopter(best);
    }
    // la case vient d'etre cochee, ou l'onglet Son a change la gamme : le son reprend celle qu'il entend
    if (this.impose()) this.poser();
  },
  adopter(c) {
    this.cle = { ton: c.ton, cle: c.cle };
    this.rival = null; this.rivalT = 0;
    if (this.impose()) this.poser();
  },
  impose() { return !!(S.instrument && S.instrumentAccord && this.cle); },
  // le son prend la tonalite entendue (sans rien ecrire dans S : « Garder cette tonalité » le fait)
  poser() {
    const gi = GAMMES.findIndex(x => x[0] === this.cle.cle);
    if (gi < 0 || (son.gi === gi && son.tonique === this.cle.ton)) return;
    son.gi = gi; son.tonique = this.cle.ton;
    son.degreCourant = Math.floor(Math.random() * son.gamme().length);
    if (son.tex) son.tex.pool = [];
    if (son.ctx) son.accorder(false);
    majSonUI();
  },
  nomCle(c) { return c ? NOTES_NOMS[c.ton] + " " + ((GAMMES.find(x => x[0] === c.cle) || [, c.cle])[1]).toLowerCase() : ""; },
  oublier() {
    this.pcs.fill(0); this.fins.fill(0); this.sx = this.sy = this.poidsDiapason = 0;
    this.cle = null; this.rival = null; this.rivalT = 0; this.sure = 0; this.meilleur = null; this.phrase = [];
    majInstrumentUI();
  },

  // ---- ce que le son en fait ----
  timbre() {
    const t = S.instrumentTimbre;
    if (t && t !== "motif") return t;
    return son.timbreMotif || "pluck";
  },
  // la frequence d'une note entendue, dans le son (son diapason a lui est deja le sien)
  frequenceDe(m) { return 440 * Math.pow(2, (m - 69) / 12) * son.diapason; },
  // le volume, rendu a la place qu'il laisse : un double qu'on entend quand meme
  volume(v) { return v * clamp(Number(S.instrumentVolume), 0, 1.5) / Math.max(0.35, this.gainSon()); },
  doubler(m) {
    const mode = S.instrumentDouble;
    if (!mode || mode === "non" || !son.ctx || !S.son) return;
    const n = son.gamme().length, f = this.frequenceDe(m), deg = son.degreDe(f);
    // en degres pour une gamme de sept notes ; sinon la note de la gamme la plus proche de l'intervalle
    const sous = (degres, demi) => n === 7 ? son.frequence(deg + degres) : son.dansLaGamme(f * Math.pow(2, demi / 12));
    const fs = { octave: [son.frequence(deg - n)], tierce: [sous(-2, -3.5)], quinte: [sous(-4, -7)], accord: [sous(-2, -3.5), sous(-4, -7)] }[mode] || [];
    const t = son.maintenant() + 0.01, tb = this.timbre();
    fs.forEach((x, i) => son.voix(tb, t + i * 0.012, x, 0.8, this.volume(0.42), i ? 0.3 : -0.3, "", { place: true }));
  },
  repondre(ph) {
    if (!son.ctx || !S.son) return;
    const notes = ph.slice(-8), n = son.gamme().length;
    let d = notes.map(x => son.degreDe(this.frequenceDe(x.m)));
    let ecarts = notes.map((x, i) => i ? clamp(x.debut - notes[i - 1].debut, 0.1, 1.2) : 0);
    let durees = notes.map(x => x.d);
    const forme = tirer(["echo", "echo", "retour", "miroir", "marche", "lent"]);
    if (forme === "retour") { d.reverse(); durees.reverse(); ecarts = [0].concat(ecarts.slice(1).reverse()); }
    if (forme === "miroir") d = d.map(x => 2 * d[0] - x);
    if (forme === "marche") { const k = Math.random() < 0.5 ? 1 : 2; d = d.map(x => x + k); }
    const lent = forme === "lent" ? 1.5 : 1, reg = { dessous: -n, meme: 0, dessus: n }[S.instrumentRegistreReponse];
    const tb = this.timbre();
    let t = son.maintenant() + 0.12;
    d.forEach((x, i) => {
      t += ecarts[i] * lent;
      son.voix(tb, t, son.frequence(x + (reg === undefined ? -n : reg)), clamp(durees[i] * lent, 0.12, 1.5),
        this.volume(i === 0 ? 0.55 : 0.45), (Math.random() - 0.5) * 0.5, "", { place: true });
    });
    this.reponseJusqua = t + 0.5;
    this.derniereReponse = { echo: "à l'identique", retour: "à l'envers", miroir: "en miroir", marche: "une marche plus haut", lent: "plus lentement" }[forme];
    this.derniereReponseT = performance.now() / 1000;
  },
  // le gain du son pendant qu'on joue (son.ecouterSilence)
  gainSon() {
    if (!S.instrument || !this.ecoute) return 1;
    return 1 - clamp(Number(S.instrumentPlace) || 0, 0, 1) * this.presence;
  },
};

// les notes de l'ecran, pour reconnaitre son echo dans les enceintes
bus.ecouter("note", d => { if (instrument.ecoute && d && d.f > 0) { instrument.notesEcran.push({ f: d.f, t: d.t }); if (instrument.notesEcran.length > 64) instrument.notesEcran.shift(); } });

(function brancherInstrument() {
  const majAvant = musique.maj;
  musique.maj = function (dt) { const r = majAvant.apply(this, arguments); instrument.maj(dt); return r; };
  // la gamme du poeme : celle qu'il entend, plutot qu'un tirage (le bouton « Une autre gamme » aussi)
  const gammeAvant = son.nouvelleGamme;
  son.nouvelleGamme = function () {
    if (instrument.impose()) { instrument.poser(); return; }
    return gammeAvant.apply(this, arguments);
  };
  // un pattern du gamelan ou de la boite a musique prend ses gammes : pas quand l'instrument en a une
  const motifAvant = son.tirerMotif;
  son.tirerMotif = function () {
    const r = motifAvant.apply(this, arguments);
    if (instrument.impose()) instrument.poser();
    return r;
  };
  // l'onglet Musique : ce qu'il entend, sous l'entree son
  const musiqueAvant = construireMusique;
  construireMusique = function (page) {
    musiqueAvant.apply(this, arguments);
    const fs = document.createElement("fieldset");
    fs.innerHTML = `<legend>L'instrument : ce qu'il entend</legend>
      <div class="etat-gen" id="i-etat">…</div>
      <canvas class="vumetre" id="i-vu" width="360" height="54" style="margin-top:6px"></canvas>
      <div class="rangee"><button type="button" class="bouton" id="i-oublier">Oublier ce qu'il a entendu</button>
      <button type="button" class="bouton" id="i-garder">Garder cette tonalité</button></div>
      <p style="margin:7px 0 0;color:#404040">Une note à la fois (flûte, voix, violon), sur l'entrée son ci-dessus : une entrée de la Focusrite, ou un micro. « Garder cette tonalité » la pose dans l'onglet Son, qui la garde même sans écouter. Si les enceintes sont dans la même pièce que le micro, un casque ou une voie de la table évite que l'écran s'entende lui-même.</p>`;
    page.appendChild(fs);
    fs.querySelector("#i-oublier").addEventListener("click", () => instrument.oublier());
    fs.querySelector("#i-garder").addEventListener("click", () => {
      const c = instrument.cle;
      if (!c) return;
      changer("sonChange", "jamais"); changer("sonGamme", c.cle); changer("sonTonique", String(c.ton));
      majInstrumentUI();
    });
    setTimeout(majInstrumentUI, 0);
  };
})();

function nomNote(m) { return NOTES_NOMS[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1); }
function majInstrumentUI() {
  const el = document.getElementById("i-etat");
  if (!el) return;
  const I = instrument;
  let t;
  if (!S.instrument) t = "Il n'écoute pas les notes : coche « Écouter les notes de l'instrument » (plus bas).";
  else if (!musique.actif) t = "L'entrée son n'est pas écoutée : « Écouter » ci-dessus (ou M), source « le micro ou une entrée son ».";
  else if (!musique.source) t = "Cette source n'a pas d'entrée : choisis le micro ou l'entrée son (ou l'entrée son et l'écran).";
  else {
    const n = I.note;
    t = n && !n.echo ? "Entendu : " + nomNote(n.m) + " (" + ((I.p - I.ecart() - n.m) * 100 >= 0 ? "+" : "") + Math.round((I.p - I.ecart() - n.m) * 100) + " cents)."
      : n ? "Il s'entend lui-même dans les enceintes (cette note ne compte pas)." : "Silence.";
    t += I.cle ? " Tonalité : " + I.nomCle(I.cle) + ", sûre à " + Math.round(I.sure * 100) + " %."
      : " Tonalité : il écoute encore" + (I.meilleur ? " (" + I.nomCle(I.meilleur) + " ?)" : "") + ".";
    t += " Diapason : la = " + I.diapasonHz().toFixed(1).replace(".", ",") + " Hz" + (S.instrumentDiapason === "auto" && I.poidsDiapason < 1.5 ? " (pas encore assez de notes)" : "") + ".";
    t += I.cle ? (I.impose() ? " Le son la prend." : " Le son garde la sienne (case « Le son prend la tonalité »).") : "";
    if (performance.now() / 1000 - I.derniereReponseT < 6) t += " Il a répondu " + I.derniereReponse + ".";
  }
  if (el.textContent !== t) el.textContent = t;
  dessinerInstrument();
}
// les douze notes entendues (les notes de la tonalite en couleur, la tonique plus claire), la note qui
// sonne en blanc, et l'aiguille de justesse a droite
function dessinerInstrument() {
  const c = document.getElementById("i-vu");
  if (!c || c.offsetParent === null) return;
  const g = c.getContext("2d"), w = c.width, h = c.height, I = instrument;
  g.fillStyle = "#000"; g.fillRect(0, 0, w, h);
  let max = 0;
  for (let i = 0; i < 12; i++) max = Math.max(max, I.pcs[i]);
  const dans = new Set();
  if (I.cle) for (const x of (GAMMES.find(y => y[0] === I.cle.cle) || GAMMES[0])[2]) dans.add((Math.round(x) + I.cle.ton) % 12);
  const lw = (w - 90) / 12, joue = I.note && !I.note.echo ? ((I.note.m % 12) + 12) % 12 : -1;
  g.font = "9px Consolas, monospace"; g.textAlign = "center"; g.textBaseline = "alphabetic";
  for (let i = 0; i < 12; i++) {
    const x = 4 + i * lw, v = max > 0 ? I.pcs[i] / max : 0;
    g.fillStyle = i === joue ? "#fff" : I.cle && i === I.cle.ton ? "#ffd040" : dans.has(i) ? "#40b0ff" : "#555";
    g.fillRect(x + 2, h - 14 - v * (h - 20), lw - 4, Math.max(1, v * (h - 20)));
    g.fillStyle = "#aaa"; g.fillText(NOTES_NOMS[i], x + lw / 2, h - 3);
  }
  // l'aiguille : -50 a +50 cents
  const ax = w - 80, aw = 74, cy = h / 2;
  g.fillStyle = "#222"; g.fillRect(ax, cy - 6, aw, 12);
  g.fillStyle = "#666"; g.fillRect(ax + aw / 2 - 1, cy - 9, 2, 18);
  if (joue >= 0) {
    const cents = clamp((I.p - I.ecart() - I.note.m) * 100, -50, 50);
    g.fillStyle = Math.abs(cents) < 8 ? "#40ff80" : Math.abs(cents) < 20 ? "#ffd040" : "#ff4060";
    g.fillRect(ax + aw / 2 + cents / 50 * (aw / 2) - 2, cy - 8, 4, 16);
  }
  g.textAlign = "left";
}
