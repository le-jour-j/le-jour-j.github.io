"use strict";
/* ================================================================ le limiteur de lumiere (2026-10-19) */

// Jiiji, 2026-10-19 : « un truc que je trouve chiant, c'est quand l'ecran est trop blanc, qu'on voit
// que dalle. Ca peut etre cool, des moments clairs, mais blanc blanc pendant 3 minutes c'est une
// galere. » Il projette : un moment clair est permis, une image blanche ou l'on ne lit plus rien ne
// doit pas durer. C'est l'equivalent, pour la lumiere, du limiteur du son.
//
// La mesure (environ deux fois par seconde, jamais en attendant la carte) : la carte reduit l'image
// en 64 x 36 cases ; chaque point de chaque case est lu : luminance moyenne, la plus sombre, la plus
// claire, part des points sombres. Le petit tableau (18 Ko : l'image brute et l'image corrigee) part
// dans un PIXEL_PACK_BUFFER, une barriere (fenceSync) le suit, et on ne le lit qu'une fois la
// barriere passee, au debut d'une image suivante : aucun readPixels qui attend l'ecran (15,9 ms
// mesures le 2026-10-19). La lecture coute 0,4 a 0,6 ms (jusqu'a ~10 ms quand la carte est deja
// saturee par le dessin) ; carte eteinte (aucun effet), la toile n'est envoyee qu'une fois par seconde.
//
// « Blanc illisible » : une image claire (luminance moyenne haute) ou presque aucune case n'a d'ecart
// franc entre son plus sombre et son plus clair, c'est-a-dire plus de lettres qui se detachent. Une
// page claire a l'encre sombre (palette papier) garde ses lettres : elle ne compte pas.
//
// La garde s'engage si ca dure plus de lumiereTolerance secondes (un flash, une onde de choc, un
// stroboscope ne durent pas), en quelques secondes et sans a-coup ; elle relache lentement quand la
// cause est partie. Elle ne touche a AUCUN reglage : S reste a Jiiji, au pilote, aux LFO, aux cables
// et aux presets (pas de bataille avec baseDe, poserBase, pilote.prendre). Elle vit dans la carte :
// - avant l'ecretage (passe IMAGE de gpu.js), le halo, la lumiere (exposition) poussee au-dela de 1,
//   le contraste pousse au-dela de 1, le flash et le larsen sont ramenes, selon l'engagement seul
//   (ce qui est ecrete a 1 est perdu, aucune courbe ne le rendrait ; et ces retouches reviennent
//   dans l'image suivante par le larsen : les faire suivre la mesure faisait clignoter l'image) ;
// - a la sortie (passe ECRAN), une courbe en puissance sur la luminance creuse les hautes lumieres
//   et baisse le blanc : sa force s glisse doucement jusqu'a ce que la salle voie lumiereCible
//   (a pleine force, 0,85 et 1,0 deviennent 0,21 et 0,65 : l'ecart des lettres se rouvre).
// L'image « brute » (sans la garde) est redessinee a part, en pleine taille : c'est elle qui dit si
// la cause est toujours la. L'image corrigee, elle, regle la courbe.
//
// Sans WebGL (la page du site sur une machine sans WebGL2) : une petite toile de 160 x 90 et
// getImageData une fois par seconde ; la correction passe alors par la toile 2D (l'image multipliee
// par elle-meme, qui creuse aussi les hautes lumieres).
//
// Rien ne s'ecrit sur l'image : l'etat se lit dans le panneau (Image > Effets), « Lumière : tenue
// depuis 12 s ».

const LUMIERE_CASES = [64, 36];
const LUMIERE_SEUIL_L = 0.72;        // luminance moyenne au-dessus de laquelle l'image est « claire »
const LUMIERE_ECART = 0.3;           // l'ecart sombre / clair d'une case ou une lettre se detache
const LUMIERE_LISIBLE_MIN = 0.006;   // part des cases ou une lettre se detache, en dessous : illisible
const LUMIERE_PERIODE = 500;         // ms entre deux mesures (carte) ; 1000 sans WebGL
const LUMIERE_RELACHE = 8;           // s sans blanc (image brute) avant de relacher
const LUMIERE_RECHUTE = 60;          // s apres une relache pendant lesquelles un retour du blanc engage vite
const LUMIERE_RECHUTE_TOL = 5;       // ... au bout de 5 s
const LUMIERE_PUISSANCE = 7;         // la puissance de la courbe a pleine force
const LUMIERE_GAIN = 0.3;            // la force bouge de 0,3 x l'ecart a la cible par seconde
const LUMIERE_FORCE_DEPART = 0.5;

const REDUIRE_GL = `#version 300 es
precision highp float;
in vec2 uv; out vec4 o;
uniform sampler2D tex; uniform vec2 cases; uniform float courbe, baisse;
void main() {
  ivec2 taille = textureSize(tex, 0);
  ivec2 cel = ivec2(floor(uv * cases));
  // chaque point de la case (30 x 25 en 1920 x 911) : un trait de lettre fin de 1 point compte aussi.
  // Au-dela de 48 x 48 points par case (tres grand ecran), un point sur deux ou trois
  ivec2 a = cel * taille / ivec2(cases), b = (cel + 1) * taille / ivec2(cases);
  ivec2 pas = max(ivec2(1), (b - a + 47) / 48);
  float somme = 0.0, n = 0.0, mn = 1.0, mx = 0.0, sombres = 0.0;
  for (int y = a.y; y < b.y; y += pas.y) for (int x = a.x; x < b.x; x += pas.x) {
    vec3 c = clamp(texelFetch(tex, ivec2(x, y), 0).rgb, 0.0, 1.0);
    float l = dot(c, vec3(0.299, 0.587, 0.114));
    // la meme courbe que la sortie (gpu.js, ECRAN_GL) : la mesure voit ce que voit la salle
    if (courbe > 0.001 || baisse > 0.001) l = pow(l, 1.0 + courbe) * (1.0 - baisse);
    somme += l; n += 1.0; mn = min(mn, l); mx = max(mx, l); sombres += step(l, 0.45);
  }
  n = max(n, 1.0);
  o = vec4(somme / n, mn, mx, sombres / n);
}`;

const lumiere = {
  // ce que la carte lit a chaque image (gpu.js) : la force de la garde, sa courbe, sa baisse du blanc
  g: 0, gCible: 0, s: 0.5, courbe: 0, baisse: 0,
  engage: false, chrono: 0, calme: 0, depuisTenue: 0, derniereRelache: -1e9,
  brute: null, finale: null, dernierT: 0, prochaine: 0, attente: null, voie: null,
  mesures: 0, erreurs: new Set(),

  // une erreur ne casse jamais l'image : notee une fois dans la console, la garde se tait
  proteger(f) {
    try { return f(); } catch (e) {
      const s = String(e && e.message);
      if (!this.erreurs.has(s)) { this.erreurs.add(s); console.error("poiasie : limiteur de lumiere", e); }
      return null;
    }
  },

  // Le pas entre deux mesures, un peu au hasard (de 0,35 a 0,65 s) : a 120 BPM, un flash toutes les
  // 0,5 s et une mesure toutes les 0,5 s tombaient toujours ensemble, et la garde croyait l'image
  // blanche en permanence (essai du 2026-10-19)
  periode() { return LUMIERE_PERIODE * (0.7 + 0.6 * Math.random()); },

  /* -------- la carte (WebGL2) */

  // la voie de mesure : la carte si elle repond, sinon la toile 2D
  carte() {
    if (this.voie === "2d") return false;
    if (this.voie === "carte") return gpu.ok && gpu.gl && !gpu.gl.isContextLost();
    // (gpu.init ne s'essaie qu'une fois : la carte s'allumera pour les effets de toute facon)
    const ok = gpu.ok || gpu.init();
    this.voie = ok && this.preparer() ? "carte" : "2d";
    return this.voie === "carte";
  },
  preparer() {
    return !!this.proteger(() => {
      const gl = gpu.gl;
      const p = gl.createProgram();
      for (const [type, src] of [[gl.VERTEX_SHADER, SOMMET_GL], [gl.FRAGMENT_SHADER, REDUIRE_GL]]) {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src); gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
        gl.attachShader(p, sh);
      }
      gl.bindAttribLocation(p, 0, "p");
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      this.prog = { p, u: { tex: gl.getUniformLocation(p, "tex"), cases: gl.getUniformLocation(p, "cases"),
        courbe: gl.getUniformLocation(p, "courbe"), baisse: gl.getUniformLocation(p, "baisse") } };
      // le tableau des cases : deux moities (en bas l'image brute, en haut l'image corrigee)
      const [cw, ch] = LUMIERE_CASES;
      this.tableau = gpu.cible(cw, ch * 2);
      this.pbo = gl.createBuffer();
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, this.pbo);
      gl.bufferData(gl.PIXEL_PACK_BUFFER, cw * ch * 2 * 4, gl.STREAM_READ);
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
      this.octets = new Uint8Array(cw * ch * 2 * 4);
      this.toileTex = gpu.texture();
      return true;
    });
  },
  // une moitie du tableau : la reduction d'une texture, avec ou sans la courbe de sortie
  reduire(tex, moitie, courbe, baisse) {
    const gl = gpu.gl, [cw, ch] = LUMIERE_CASES;
    gl.useProgram(this.prog.p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.tableau.fb);
    gl.viewport(0, moitie * ch, cw, ch);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(this.prog.u.tex, 0);
    gl.uniform2f(this.prog.u.cases, cw, ch);
    gl.uniform1f(this.prog.u.courbe, courbe);
    gl.uniform1f(this.prog.u.baisse, baisse);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  },
  // le tableau part vers la memoire sans attendre la carte ; la barriere dira quand le lire
  envoyer() {
    const gl = gpu.gl, [cw, ch] = LUMIERE_CASES;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.tableau.fb);
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, this.pbo);
    gl.readPixels(0, 0, cw, ch * 2, gl.RGBA, gl.UNSIGNED_BYTE, 0);
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    this.attente = { sync, t: performance.now(), courbe: this.courbe, baisse: this.baisse };
  },
  // appele par gpu.dessiner, la carte allumee, apres la sortie : l'image corrigee (cour, avec la
  // courbe) et l'image brute (redessinee a part avec les valeurs d'origine)
  mesurerCarte(G, cour, textures, u) {
    if (!this.carte()) return;
    this.proteger(() => {
      // L'image brute, sans la garde : la meme passe, les memes textures, les valeurs d'origine, en
      // pleine taille (a moitie ou au quart, les traits fins des lettres disparaissaient de la mesure).
      // Avec le larsen, l'image d'avant entre dans la suivante : une brute redessinee une fois
      // reprenait l'echo deja corrige et se croyait guerie (mesure le 2026-10-19 : 1,00 puis 0,38 sept
      // secondes apres l'engagement, la garde relachait et le blanc revenait). Tant que la garde agit
      // et que le larsen tourne, la brute a donc sa propre chaine, une passe de plus par image.
      let brute = null;
      if (this.g > 0.002 && u.larsen > 0.01) brute = this.chaineBrute(G, textures, u);
      else this.chaineVive = false;
      if (this.attente || performance.now() < this.prochaine) return;
      this.prochaine = performance.now() + this.periode();
      if (!brute && this.g > 0.002) {
        const c = this.cibleBrute(G, 0);
        G.passe(G.progs.image, c, textures, u);
        brute = c.tex;
      }
      this.reduire(brute || cour.tex, 0, 0, 0);
      this.reduire(cour.tex, 1, this.courbe, this.baisse);
      this.envoyer();
    });
  },
  cibleBrute(G, i) {
    const gl = G.gl, B = this.brutes || (this.brutes = []);
    if (!B[i] || B[i].w !== G.w || B[i].h !== G.h) {
      if (B[i]) { gl.deleteTexture(B[i].tex); gl.deleteFramebuffer(B[i].fb); }
      B[i] = G.cible(G.w, G.h, gl.MIRRORED_REPEAT);
      if (i === 1 || i === 0) this.chaineVive = false;
    }
    return B[i];
  },
  // la chaine du larsen sans la garde : elle part de l'image vraie au moment ou la garde s'engage
  chaineBrute(G, textures, u) {
    const i = this.bruteCour || 0, prec = this.cibleBrute(G, i), cour = this.cibleBrute(G, 1 - i);
    G.passe(G.progs.image, cour, { tex: textures.tex, halo: textures.halo, prec: this.chaineVive ? prec.tex : textures.prec }, u);
    this.bruteCour = 1 - i; this.chaineVive = true;
    return cour.tex;
  },
  // la carte eteinte (aucun effet) : la toile 2D est l'image ; on l'envoie a la carte pour la mesurer
  mesurerToile() {
    if (this.attente || performance.now() < this.prochaine) return;
    this.proteger(() => {
      // une fois par seconde : l'envoi de la toile et sa lecture pesent plus que la carte allumee
      this.prochaine = performance.now() + this.periode() * 2;
      const gl = gpu.gl;
      gl.bindTexture(gl.TEXTURE_2D, this.toileTex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      if (this.toileW !== toile.width || this.toileH !== toile.height) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, toile);
        this.toileW = toile.width; this.toileH = toile.height;
      } else gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, toile);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      this.reduire(this.toileTex, 0, 0, 0);
      this.reduire(this.toileTex, 1, 0, 0);
      this.envoyer();
    });
  },
  // chaque image : le tableau est-il arrive ? (jamais d'attente : la barriere passee ou rien)
  relever() {
    const A = this.attente;
    if (!A) return;
    const ok = this.proteger(() => {
      const gl = gpu.gl;
      const s = gl.clientWaitSync(A.sync, 0, 0);
      if (s === gl.TIMEOUT_EXPIRED) {
        // une barriere qui ne passe pas en 3 s (onglet cache, carte perdue) : on oublie cette mesure
        if (performance.now() - A.t > 3000) { gl.deleteSync(A.sync); this.attente = null; }
        return true;
      }
      if (s === gl.WAIT_FAILED) { gl.deleteSync(A.sync); this.attente = null; return true; }
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, this.pbo);
      gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, this.octets);
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
      gl.deleteSync(A.sync);
      this.attente = null;
      const n = LUMIERE_CASES[0] * LUMIERE_CASES[1];
      this.resultat(this.resumer(this.octets, 0, n), this.resumer(this.octets, n, n), A);
      return true;
    });
    // une lecture qui a casse : on l'oublie (la suivante repart d'une barriere neuve)
    if (!ok) this.attente = null;
  },
  // un tableau de cases (R moyenne, G plus sombre, B plus clair, A part sombre) : ce qu'il dit
  resumer(o, debut, n) {
    let L = 0, lisibles = 0, sombre = 0;
    for (let i = debut; i < debut + n; i++) {
      const k = i * 4;
      L += o[k]; sombre += o[k + 3];
      if (o[k + 2] - o[k + 1] > LUMIERE_ECART * 255) lisibles++;
    }
    return { L: L / n / 255, lisible: lisibles / n, sombre: sombre / n / 255 };
  },

  /* -------- sans WebGL : la toile 2D, une fois par seconde */
  mesurer2D() {
    if (performance.now() < this.prochaine) return;
    this.proteger(() => {
      this.prochaine = performance.now() + this.periode() * 2;
      const w = 160, h = 90, cw = 2, ch = 2;   // 80 x 45 cases de 2 x 2 points
      if (!this.petite) {
        this.petite = document.createElement("canvas"); this.petite.width = w; this.petite.height = h;
        this.pctx = this.petite.getContext("2d", { willReadFrequently: true });
      }
      this.pctx.drawImage(toile, 0, 0, w, h);
      const d = this.pctx.getImageData(0, 0, w, h).data;
      const nx = w / cw, ny = h / ch, o = this.octets2D || (this.octets2D = new Uint8Array(nx * ny * 4));
      for (let cy = 0; cy < ny; cy++) for (let cx = 0; cx < nx; cx++) {
        let s = 0, mn = 255, mx = 0, so = 0;
        // chaque case et ses voisines (3 x 3 points autour) : a cette taille, une lettre fait 3 points
        for (let y = cy * ch - 1; y <= cy * ch + ch; y++) for (let x = cx * cw - 1; x <= cx * cw + cw; x++) {
          const xx = Math.min(w - 1, Math.max(0, x)), yy = Math.min(h - 1, Math.max(0, y)), k = (yy * w + xx) * 4;
          const l = 0.299 * d[k] + 0.587 * d[k + 1] + 0.114 * d[k + 2];
          s += l; if (l < mn) mn = l; if (l > mx) mx = l; if (l < 102) so++;
        }
        const k = (cy * nx + cx) * 4;
        o[k] = s / 16; o[k + 1] = mn; o[k + 2] = mx; o[k + 3] = so / 16 * 255;
      }
      const r = this.resumer(o, 0, nx * ny);
      // (la toile est mesuree avant sa correction : pas de sortie mesuree, la force reste a son depart)
      this.resultat(r, null, { t: performance.now() });
    });
  },
  // la correction sans carte : l'image multipliee par elle-meme (y devient y x y), puis le blanc baisse
  corriger2D() {
    const k = this.g * this.s;
    if (k < 0.01) return;
    this.proteger(() => {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = "multiply";
      const passes = k > 0.5 ? 2 : 1;
      for (let i = 0; i < passes; i++) { ctx.globalAlpha = clamp(k * 2 / passes, 0, 1); ctx.drawImage(toile, 0, 0); }
      ctx.globalAlpha = 1;
      const b = Math.round(255 * (1 - this.baisse));
      ctx.fillStyle = "rgb(" + b + "," + b + "," + b + ")";
      ctx.fillRect(0, 0, toile.width, toile.height);
      ctx.restore();
    });
  },

  /* -------- la decision */

  // une mesure arrivee : la brute dit si le blanc dure, la finale (ce que voit la salle) regle la force
  resultat(brute, finale, A) {
    this.brute = brute; this.finale = finale; this.mesures++;
    const t = A.t / 1000, dtm = clamp(t - (this.dernierT || t), 0, 2);
    this.dernierT = t;
    const blanc = brute.L > LUMIERE_SEUIL_L && brute.lisible < LUMIERE_LISIBLE_MIN;
    this.blanc = blanc;
    if (!S.lumiereGarde) {
      this.engage = false; this.chrono = 0; this.calme = 0;
    } else if (!this.engage) {
      // un flash, une onde de choc, un stroboscope : le compte monte un instant puis redescend
      this.chrono = blanc ? this.chrono + dtm : Math.max(0, this.chrono - dtm);
      if (this.chrono >= this.tolerance(t)) {
        this.engage = true; this.depuisTenue = t; this.calme = 0;
        // la force repart d'une moitie si la garde etait au repos (sinon de la ou elle en etait)
        if (this.g < 0.05) this.s = LUMIERE_FORCE_DEPART;
      }
    } else {
      this.calme = blanc ? 0 : this.calme + dtm;
      if (this.calme >= LUMIERE_RELACHE) { this.engage = false; this.chrono = 0; this.derniereRelache = t; }
    }
    this.gCible = this.engage ? 1 : 0;
  },
  // la tolerance de Jiiji ; un blanc qui revient juste apres une relache engage vite
  tolerance(t) {
    const tol = clamp(Number(S.lumiereTolerance) || 25, 5, 120);
    return t - this.derniereRelache < LUMIERE_RECHUTE ? Math.min(tol, LUMIERE_RECHUTE_TOL) : tol;
  },
  // Chaque image. g, l'engagement : il monte en ~4 s, il retombe en ~15 s. s, la force : un
  // integrateur doux sur ce que voit la salle (plus clair que la cible : plus fort ; plus sombre :
  // moins fort), sans saut. Un calcul direct de la puissance depassait : avec le larsen, l'image
  // passait de 1,00 a 0,01 en trois secondes (mesure du 2026-10-19).
  glisser(dt) {
    if (!(dt > 0)) return;
    const tau = this.gCible > this.g ? 1.4 : 5;
    this.g = lerp(this.g, this.gCible, 1 - Math.exp(-dt / tau));
    if (this.g < 0.002 && this.gCible === 0) this.g = 0;
    if (this.engage && this.finale && this.g > 0.3) {
      const cible = clamp(Number(S.lumiereCible) || 0.6, 0.4, 0.8), e = this.finale.L - cible;
      if (Math.abs(e) > 0.03) this.s = clamp(this.s + dt * LUMIERE_GAIN * (e - Math.sign(e) * 0.03), 0, 1);
    }
    const k = this.g * this.s;
    this.courbe = k * (LUMIERE_PUISSANCE - 1);
    this.baisse = k * 0.35;
    if (!isFinite(this.courbe)) { this.courbe = 0; this.s = LUMIERE_FORCE_DEPART; }
  },
  // Les retouches d'avant l'ecretage (gpu.dessiner, passe IMAGE) : une copie, jamais S. Elles ne
  // suivent que l'engagement g, jamais la force s : ce qu'elles touchent revient dans l'image
  // suivante (le larsen), et les faire varier avec la mesure faisait basculer l'image entre le blanc
  // et le noir toutes les deux a quatre secondes (mesure du 2026-10-19). Fixes, elles cassent la
  // boucle ; la courbe de sortie, qui ne revient pas dans l'image, fait le reglage fin.
  regler(u) {
    const k = this.g;
    if (!(k > 0.002)) return u;
    const r = Object.assign({}, u);
    if (r.force > 0) r.force *= 1 - 0.7 * k;
    if (r.expo > 1) r.expo = Math.pow(r.expo, 1 - 0.85 * k);
    if (r.contraste > 1) r.contraste = 1 + (r.contraste - 1) * (1 - 0.6 * k);
    if (r.flash > 0) r.flash *= 1 - 0.6 * k;
    // le larsen garde le plus clair de ses echos : avec le halo, le blanc s'y nourrit de lui-meme
    if (r.larsen > 0) r.larsen *= 1 - 0.5 * k;
    return r;
  },

  /* -------- le panneau : une ligne, jamais sur l'image */
  texte() {
    const s = x => Math.floor(x) + " s", t = performance.now() / 1000;
    const chiffres = this.brute ? " (lumière " + this.brute.L.toFixed(2).replace(".", ",") + ", lettres " +
      (this.brute.lisible * 100).toFixed(1).replace(".", ",") + " %" + (this.g > 0.01 && this.finale ? " ; à la sortie " + this.finale.L.toFixed(2).replace(".", ",") : "") + ")" : "";
    if (!S.lumiereGarde) return "Lumière : garde éteinte" + (this.blanc ? ", l'image est blanche" : "") + chiffres;
    if (!this.brute) return "Lumière : pas encore mesurée";
    if (this.engage) return "Lumière : tenue depuis " + s(t - this.depuisTenue) + chiffres;
    if (this.g > 0.01) return "Lumière : relâche" + chiffres;
    if (this.chrono > 0.5) return "Lumière : blanc depuis " + s(this.chrono) + ", garde dans " + s(Math.max(0, this.tolerance(t) - this.chrono)) + chiffres;
    return "Lumière : rien à tenir" + chiffres;
  },
  afficher() {
    if (typeof panneau === "undefined" || panneau.hidden) return;
    const t = performance.now();
    if (t - (this.afficheT || 0) < 500) return;
    this.afficheT = t;
    const ligne = [...document.querySelectorAll('.ligne[data-cle="lumiereGarde"]')].find(l => !l.dataset.rgSecondaire);
    if (!ligne) return;
    if (!this.etatEl) {
      this.etatEl = document.createElement("div");
      this.etatEl.style.cssText = "font:10px Consolas,monospace;white-space:pre-wrap;margin:2px 0 4px 4px;color:#222";
    }
    if (this.etatEl.previousSibling !== ligne) ligne.after(this.etatEl);
    const txt = this.texte();
    if (this.etatEl.textContent !== txt) this.etatEl.textContent = txt;
  },

  // chaque image, apres gpu.dessiner (r : la carte a-t-elle dessine)
  image(r, dt) {
    this.glisser(dt);
    if (!S.lumiereGarde && this.g === 0) { this.engage = false; this.chrono = 0; }
    if (this.carte()) {
      if (!r) this.mesurerToile();   // la carte dessine : gpu.dessiner a deja mesure (mesurerCarte)
    } else {
      this.mesurer2D();
      if (!r) this.corriger2D();
    }
    this.afficher();
  },
};

/* ---------------------------------------------------- les branchements */

{
  // la carte s'allume tant que la garde agit (une image blanche venue de la toile seule : palette
  // claire, mots clairs, traines), et retombe d'elle-meme 3 s apres (gpu.dessiner)
  const utileAvant = gpu.utile;
  gpu.utile = function () { return utileAvant.apply(this, arguments) || (S.lumiereGarde !== false && lumiere.g > 0.002 && lumiere.voie === "carte"); };
  const dessinerAvant = gpu.dessiner;
  gpu.dessiner = function (dt) {
    // (si la lecture n'a pas pu se faire au debut de l'image, voir plus bas)
    if (lumiere.voie === "carte" && lumiere.attente) lumiere.relever();
    const r = dessinerAvant.apply(this, arguments);
    try { lumiere.image(r, dt); } catch (e) { lumiere.proteger(() => { throw e; }); }
    return r;
  };
  // La lecture du tableau se fait au tout debut de l'image, avant que les scenes dessinent : faite
  // apres, getBufferSubData attendait que la carte ait fini le dessin en cours (1,8 ms en moyenne et
  // jusqu'a 20 ms, contre 0,6 et 2,6 au debut de l'image, mesures le 2026-10-19). pilote.maj est
  // appele tot dans image() (orchestre.js), avant le fond et la scene.
  if (typeof pilote !== "undefined" && typeof pilote.maj === "function") {
    const pilotageAvant = pilote.maj;
    pilote.maj = function () {
      if (lumiere.voie === "carte" && lumiere.attente) { try { lumiere.relever(); } catch (e) { /* relever se protege */ } }
      return pilotageAvant.apply(this, arguments);
    };
  }
}

ajouterReglages("Effets", "Le limiteur de lumière (contre le blanc qui dure)", [
  { cle: "lumiereGarde", nom: "Garde contre l'écran blanc qui dure", type: "case" },
  { cle: "lumiereTolerance", nom: "Blanc toléré avant qu'elle tienne (secondes)", type: "curseur", min: 5, max: 120, pas: 1 },
  { cle: "lumiereCible", nom: "Lumière visée quand elle tient", type: "curseur", min: 0.4, max: 0.8, pas: 0.05 },
], { lumiereGarde: true, lumiereTolerance: 25, lumiereCible: 0.6 });
// ni le hasard, ni les presets (des modes ou des onglets), ni les LFO, ni les cables, ni le pilote ne
// l'eteignent ou ne la reglent : c'est une garde, pas un effet
for (const c of ["lumiereGarde", "lumiereTolerance", "lumiereCible"]) {
  LFO_EXCLUS.add(c);
  if (typeof HASARD_JAMAIS !== "undefined") HASARD_JAMAIS.add(c);
  if (typeof PRESET_JAMAIS !== "undefined") PRESET_JAMAIS.add(c);
  if (typeof PC_JAMAIS !== "undefined") PC_JAMAIS.add(c);
}
