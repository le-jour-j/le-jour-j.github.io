"use strict";
/* ================================================================ la carte graphique */

// La toile 2D est dessinee comme avant, puis recopiee dans une texture et retravaillee par
// la carte graphique (WebGL2) : halo, kaleidoscope, ondes, mosaique, decalage des couleurs,
// larsen (l'image se refilme elle-meme), cassette VHS, ecran bombe, balayage, grain.
// Tant qu'aucun effet n'est allume, rien de tout cela ne tourne et la toile s'affiche seule.
const SOMMET_GL = `#version 300 es
in vec2 p; out vec2 uv;
void main() { uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

const BRILLANT_GL = `#version 300 es
precision highp float;
in vec2 uv; out vec4 o;
uniform sampler2D tex; uniform vec2 texel; uniform float seuil;
void main() {
  // la toile est envoyee sans etre retournee (le retournement a l'envoi coutait une copie) : on lit a l'envers
  vec2 q = vec2(uv.x, 1.0 - uv.y);
  vec3 c = texture(tex, q + texel * vec2(-1.0, -1.0)).rgb + texture(tex, q + texel * vec2(1.0, -1.0)).rgb
         + texture(tex, q + texel * vec2(-1.0, 1.0)).rgb + texture(tex, q + texel * vec2(1.0, 1.0)).rgb;
  c *= 0.25;
  float l = max(c.r, max(c.g, c.b));
  o = vec4(c * smoothstep(seuil, seuil + 0.3, l), 1.0);
}`;

const FLOU_GL = `#version 300 es
precision highp float;
in vec2 uv; out vec4 o;
uniform sampler2D tex; uniform vec2 dir;
void main() {
  vec3 c = texture(tex, uv).rgb * 0.2270270;
  c += (texture(tex, uv + dir * 1.3846154).rgb + texture(tex, uv - dir * 1.3846154).rgb) * 0.3162162;
  c += (texture(tex, uv + dir * 3.2307692).rgb + texture(tex, uv - dir * 3.2307692).rgb) * 0.0702703;
  o = vec4(c, 1.0);
}`;

const IMAGE_GL = `#version 300 es
precision highp float;
in vec2 uv; out vec4 o;
uniform sampler2D tex, halo, prec;
uniform vec2 res; uniform float t;
uniform float force, rvb, ondes, mosaique, kaleido, kAngle, kZoom, kSpirale, larsen, lZoom, lRot, lTeinte, vhs, teinte, flash;
uniform float miroir, choc, chocR, neg, bichro, pompe, kFondu;
uniform vec3 c0, c1;
uniform float sat, contraste, expo, decal, chroma, solar, poster, blocs, fonte, strobe, gradForce;
uniform vec3 g0, g1, g2, g3;
// les mains des joueurs (jusqu'a quatre, 2026-10-19) : x, y, rayon, loupe, tourbillon de chacune
uniform vec4 mainX, mainY, mainRs, mainLs, mainTs;
float hasard(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
// la toile 2D, lue a l'endroit (elle arrive ligne du haut en premier)
vec4 scene(vec2 p) { return texture(tex, vec2(p.x, 1.0 - p.y)); }
vec3 tourner(vec3 c, float a) {
  const mat3 versYiq = mat3(0.299, 0.596, 0.211, 0.587, -0.274, -0.523, 0.114, -0.322, 0.312);
  const mat3 depuisYiq = mat3(1.0, 1.0, 1.0, 0.956, -0.272, -1.106, 0.621, -0.647, 1.703);
  vec3 y = versYiq * c;
  float cs = cos(a), sn = sin(a);
  y.yz = mat2(cs, sn, -sn, cs) * y.yz;
  return depuisYiq * y;
}
void main() {
  vec2 k = uv;
  float ratio = res.x / res.y;
  // l'image bat : un petit zoom sur le temps fort
  if (pompe > 0.0) k = (k - 0.5) / (1.0 + pompe) + 0.5;
  // les miroirs : 1 gauche et droite, 2 haut et bas, 3 les quatre coins
  if (miroir > 0.5) {
    if (miroir < 1.5 || miroir > 2.5) k.x = 0.5 - abs(k.x - 0.5);
    if (miroir > 1.5) k.y = 0.5 + abs(k.y - 0.5);
  }
  // le glitch en blocs : des carreaux de l'image glissent de travers, plus souvent sur le temps
  if (blocs > 0.0) {
    vec2 cel = floor(k * vec2(16.0, 9.0));
    float pas = floor(t * 9.0);
    if (hasard(cel + pas) < blocs * 0.35) k.x += (hasard(cel * 1.7 + pas) - 0.5) * 0.18 * blocs;
  }
  // l'image fond : chaque colonne coule a sa vitesse
  if (fonte > 0.0) {
    float c = hasard(vec2(floor(k.x * 90.0), 3.0));
    k.y += c * fonte * 0.14 * (0.6 + 0.4 * sin(t * 0.7 + c * 6.0));
  }
  // les mains des joueurs : chacune une loupe (ou un pincement) et un tourbillon autour d'elle
  for (int i = 0; i < 4; i++) {
    float r = mainRs[i];
    if (r > 0.0) {
      vec2 mp = vec2(mainX[i], mainY[i]);
      vec2 c = (k - mp) * vec2(ratio, 1.0);
      float f = exp(-dot(c, c) / (r * r));
      c *= 1.0 - clamp(mainLs[i], -1.5, 1.5) * 0.55 * f;
      float a = mainTs[i] * 2.6 * f, cs = cos(a), sn = sin(a);
      c = mat2(cs, sn, -sn, cs) * c;
      k = mp + c / vec2(ratio, 1.0);
    }
  }
  // l'onde de choc : un anneau part du centre a chaque temps fort et pousse l'image
  if (choc > 0.0) {
    vec2 c = (k - 0.5) * vec2(ratio, 1.0);
    float r = length(c) + 1e-5, d = r - chocR;
    k -= (c / r) / vec2(ratio, 1.0) * exp(-d * d * 220.0) * choc * 0.04;
  }
  if (kaleido > 1.5) {
    vec2 c = (k - 0.5) * vec2(ratio, 1.0);
    float r = length(c) / kZoom, a = atan(c.y, c.x) + kAngle + r * kSpirale;
    float seg = 6.2831853 / kaleido;
    a = mod(a, seg); a = abs(a - seg * 0.5);
    k = mix(k, vec2(cos(a), sin(a)) * r / vec2(ratio, 1.0) + 0.5, kFondu);
  }
  if (ondes > 0.0) k += ondes * 0.012 * vec2(sin(k.y * 17.0 + t * 2.1), cos(k.x * 13.0 + t * 1.7));
  if (mosaique > 0.0) {
    float n = mix(res.y, 14.0, pow(mosaique, 0.45));
    vec2 cell = vec2(n * ratio, n);
    k = (floor(k * cell) + 0.5) / cell;
  }
  if (vhs > 0.0) {
    float ligne = floor(k.y * res.y / 2.0);
    k.x += (hasard(vec2(ligne, floor(t * 30.0))) - 0.5) * 0.003 * vhs;
    float bande = fract(t * 0.06);
    float d = k.y - bande;
    k.x += vhs * 0.025 * exp(-d * d * 3000.0) * sin(t * 37.0 + k.y * 260.0);
  }
  float dec = (rvb + vhs * 0.7) * 0.0035;
  vec2 dc = k - 0.5;
  // le decalage des couleurs tourne lentement autour de l'horizontale
  vec2 sens = normalize(vec2(1.0, 0.0) + vec2(cos(t * 0.45), sin(t * 0.45)) * 0.6 * step(0.001, rvb));
  vec3 col;
  col.r = scene(k + dc * dec * 1.5 + sens * dec).r;
  col.g = scene(k).g;
  col.b = scene(k - dc * dec * 1.5 - sens * dec).b;
  if (vhs > 0.0) {
    // la couleur bave a droite, le blanc grisaille, de la neige passe
    vec3 bave = scene(k + vec2(0.004, 0.0)).rgb + scene(k + vec2(0.008, 0.0)).rgb;
    float y = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(col, vec3(y) + (bave * 0.5 - vec3(dot(bave * 0.5, vec3(0.299, 0.587, 0.114)))) * 1.1, vhs * 0.55);
    col += (hasard(uv * res + t * 61.0) - 0.5) * 0.12 * vhs;
    col *= 1.0 - 0.08 * vhs;
  }
  // le halo eclaire comme un ecran (1 - (1-a) exp(-b)) : avant il s'ajoutait et les lettres claires
  // tombaient en blanc plat ; la teinte reste, le noir reste noir
  if (force > 0.0) { vec3 cc = clamp(col, 0.0, 1.0); col = 1.0 - (1.0 - cc) * exp(-texture(halo, k).rgb * force); }
  if (larsen > 0.0) {
    vec2 q = uv - 0.5;
    float cs = cos(lRot), sn = sin(lRot);
    q = mat2(cs, sn, -sn, cs) * (q * vec2(ratio, 1.0)) / vec2(ratio, 1.0) / lZoom;
    vec3 echo = texture(prec, q + 0.5).rgb;
    if (lTeinte > 0.0) echo = tourner(echo, lTeinte);
    col = max(col, echo * larsen);
  }
  if (teinte != 0.0) col = tourner(col, teinte);
  if (decal != 0.0) col = tourner(col, decal);
  // l'arc-en-ciel en cercles : la teinte tourne avec la distance au centre
  if (chroma > 0.0) col = tourner(col, chroma * (length((uv - 0.5) * vec2(ratio, 1.0)) * 9.0 - t * 2.0));
  col = (col - 0.5) * contraste + 0.5;
  col *= expo;
  float gris = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(gris), col, sat);
  // la solarisation : ce qui est trop clair s'inverse, comme en chambre noire
  if (solar > 0.0) col = mix(col, mix(col, 1.0 - col, step(0.5, col)), solar);
  if (poster > 1.5) col = floor(clamp(col, 0.0, 1.0) * poster + 0.5) / poster;
  // le degrade : chaque lumiere prend une couleur, du plus sombre au plus clair
  if (gradForce > 0.0) {
    float y = clamp(dot(col, vec3(0.299, 0.587, 0.114)), 0.0, 1.0) * 3.0;
    vec3 g = y < 1.0 ? mix(g0, g1, y) : y < 2.0 ? mix(g1, g2, y - 1.0) : mix(g2, g3, y - 2.0);
    col = mix(col, g, gradForce);
  }
  // la bichromie : le sombre prend la couleur du fond, le clair celle de l'accent
  if (bichro > 0.0) {
    float y = dot(clamp(col, 0.0, 1.0), vec3(0.299, 0.587, 0.114));
    col = mix(col, mix(c0, c1, smoothstep(0.04, 0.8, y)), bichro);
  }
  if (neg > 0.0) col = mix(col, 1.0 - clamp(col, 0.0, 1.0), neg);
  // le flash aussi eclaire sans aplatir : ce qui est deja clair monte moins
  if (flash > 0.0) { vec3 cc = clamp(col, 0.0, 1.0); col = cc + (1.0 - cc) * clamp(flash * 0.3, 0.0, 0.9); }
  col *= 1.0 - strobe;
  o = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

const ECRAN_GL = `#version 300 es
precision highp float;
in vec2 uv; out vec4 o;
uniform sampler2D img; uniform vec2 res; uniform float t, courbure, balayage, grain, vignette;
uniform float gardeCourbe, gardeBaisse;
float hasard(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec2 k = uv;
  if (courbure > 0.0) {
    vec2 c = k * 2.0 - 1.0;
    c *= 1.0 + courbure * 0.16 * dot(c.yx, c.yx) * vec2(0.8, 1.0);
    k = c * 0.5 + 0.5;
    if (k.x < 0.0 || k.x > 1.0 || k.y < 0.0 || k.y > 1.0) { o = vec4(0.0, 0.0, 0.0, 1.0); return; }
  }
  vec3 col = texture(img, k).rgb;
  // le limiteur de lumiere (lumiere.js) : une puissance sur la luminance creuse les hautes lumieres
  // d'une image blanche qui dure (0 et 0 : rien, c'est le cas presque toujours)
  if (gardeCourbe > 0.001 || gardeBaisse > 0.001) {
    float y = max(dot(col, vec3(0.299, 0.587, 0.114)), 1e-4);
    col *= pow(min(y, 1.0), 1.0 + gardeCourbe) * (1.0 - gardeBaisse) / y;
  }
  if (balayage > 0.0) {
    float s = 0.5 + 0.5 * sin(k.y * res.y * 3.14159);
    col *= 1.0 - balayage * 0.45 * (1.0 - s);
    float m = mod(floor(k.x * res.x), 3.0);
    col *= mix(vec3(1.0), m < 1.0 ? vec3(1.08, 0.92, 0.92) : m < 2.0 ? vec3(0.92, 1.08, 0.92) : vec3(0.92, 0.92, 1.08), balayage * 0.6);
  }
  float v = vignette + courbure * 0.5;
  if (v > 0.0) {
    vec2 c = (k - 0.5) * vec2(1.25, 1.0);
    col *= 1.0 - clamp(v, 0.0, 1.0) * smoothstep(0.25, 0.85, length(c) * 1.15);
  }
  if (grain > 0.0) col += (hasard(uv * res + fract(t) * 97.0) - 0.5) * grain * 0.2;
  o = vec4(col, 1.0);
}`;

// deux couleurs melangees (t : la part de la seconde)
function melange(a, b, t) {
  const x = rgbDe(a), y = rgbDe(b);
  return "rgb(" + x.map((v, i) => Math.round((v + (y[i] - v) * t) * 255)).join(",") + ")";
}
function rgbDe(hex) { return [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255); }
const gpu = {
  ok: false, essaye: false, actif: false, gl: null, toile: document.getElementById("gl"),
  progs: {}, buf: null, scene: null, halos: [], images: [], courante: 0, w: 0, h: 0,
  kAngle: 0, rot: 0, effacer: true,

  init() {
    if (this.essaye) return this.ok;
    this.essaye = true;
    try {
      const gl = this.toile.getContext("webgl2", { alpha: false, antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: false, desynchronized: false, powerPreference: "high-performance" });
      if (!gl) return false;
      this.gl = gl;
      const prog = (fs) => {
        const p = gl.createProgram();
        for (const [type, src] of [[gl.VERTEX_SHADER, SOMMET_GL], [gl.FRAGMENT_SHADER, fs]]) {
          const sh = gl.createShader(type);
          gl.shaderSource(sh, src); gl.compileShader(sh);
          if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
          gl.attachShader(p, sh);
        }
        gl.bindAttribLocation(p, 0, "p");
        gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
        const u = {};
        const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < n; i++) { const nom = gl.getActiveUniform(p, i).name; u[nom] = gl.getUniformLocation(p, nom); }
        return { p, u };
      };
      this.progs = { brillant: prog(BRILLANT_GL), flou: prog(FLOU_GL), image: prog(IMAGE_GL), ecran: prog(ECRAN_GL) };
      this.buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      this.scene = this.texture(gl.MIRRORED_REPEAT);
      this.toile.addEventListener("webglcontextlost", e => { e.preventDefault(); this.ok = false; this.actif = false; document.body.classList.remove("gl"); });
      this.ok = true;
    } catch (e) {
      console.warn("poiasie : pas d'effets carte graphique", e);
      this.ok = false;
    }
    return this.ok;
  },
  texture(enroule) {
    const gl = this.gl, t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, enroule || gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, enroule || gl.CLAMP_TO_EDGE);
    return t;
  },
  cible(w, h, enroule) {
    const gl = this.gl, tex = this.texture(enroule);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { tex, fb, w, h };
  },
  dimensionner() {
    const gl = this.gl, w = toile.width, h = toile.height;
    if (w === this.w && h === this.h) return;
    for (const c of this.halos.concat(this.images)) { gl.deleteTexture(c.tex); gl.deleteFramebuffer(c.fb); }
    this.w = w; this.h = h;
    this.toile.width = w; this.toile.height = h;
    const hw = Math.max(1, Math.round(w / 4)), hh = Math.max(1, Math.round(h / 4));
    this.halos = [this.cible(hw, hh), this.cible(hw, hh)];
    this.images = [this.cible(w, h, gl.MIRRORED_REPEAT), this.cible(w, h, gl.MIRRORED_REPEAT)];
    this.effacer = true;
  },
  passe(prog, cible, textures, uniformes) {
    const gl = this.gl;
    gl.useProgram(prog.p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, cible ? cible.fb : null);
    gl.viewport(0, 0, cible ? cible.w : this.w, cible ? cible.h : this.h);
    let unite = 0;
    for (const nom in textures) {
      gl.activeTexture(gl.TEXTURE0 + unite);
      gl.bindTexture(gl.TEXTURE_2D, textures[nom]);
      if (prog.u[nom]) gl.uniform1i(prog.u[nom], unite);
      unite++;
    }
    for (const nom in uniformes) {
      const v = uniformes[nom], u = prog.u[nom];
      if (!u) continue;
      if (Array.isArray(v)) { if (v.length === 4) gl.uniform4f(u, v[0], v[1], v[2], v[3]); else if (v.length === 3) gl.uniform3f(u, v[0], v[1], v[2]); else gl.uniform2f(u, v[0], v[1]); } else gl.uniform1f(u, v);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  },

  // les valeurs du moment : reglages, manette et musique melanges
  valeurs(dt) {
    const m = S.musique && musique.actif ? musique : null, pousse = m ? S.musiqueEffets : 0;
    const L = live.mod;
    const v = {
      halo: S.halo * (1 + (m ? m.basses * pousse * 1.5 : 0)) + L.halo,
      rvb: S.rvb * (1 + (m ? m.aigus * pousse * 1.2 : 0)) + L.rvb,
      ondes: S.ondes * (1 + (m ? m.mediums * pousse : 0)) + L.ondes,
      mosaique: clamp(S.mosaique + L.mosaique + (m && S.mosaique > 0 ? m.coup * pousse * 0.2 : 0), 0, 1),
      kaleido: 0,
      larsen: clamp(S.larsen + L.larsen, 0, 0.98),
      lZoom: S.larsenZoom + L.zoom + (m ? m.basses * pousse * 0.015 : 0),
      vhs: clamp(S.vhs + L.vhs, 0, 1), courbure: S.courbure, balayage: S.balayage, grain: S.grain, vignette: S.vignetteGpu,
      flash: (m ? m.coup * S.musiqueFlash : 0) + L.flash,
      kZoom: S.kaleidoStable ? 1 : 1 + (m ? m.basses * pousse * 0.12 : 0) + L.flash * 0.05, kSpirale: S.kaleidoSpirale,
      miroir: { gd: 1, hb: 2, quatre: 3 }[S.miroir] || 0,
      neg: S.negatif > 0 ? clamp(S.negatif * Math.max(m && m.coup > 0.55 ? 1 : 0, L.flash > 0.6 ? 1 : 0), 0, 1) : 0,
      bichro: S.bichromie, pompe: S.pompe * Math.max(m ? m.coup : 0, L.flash * 0.6) * 0.1, lTeinte: S.larsenTeinte * 0.2,
      sat: S.saturation, contraste: S.contraste, expo: S.exposition, decal: S.decalage * Math.PI / 180, chroma: S.chroma, solar: S.solarisation,
      poster: S.posterisation >= 2 ? Math.round(S.posterisation) : 0, fonte: S.fonte,
      blocs: S.blocs * (0.35 + Math.max(m ? m.coup * pousse : 0, L.flash * 0.5)),
      gradForce: 0,
      // le stroboscope : avec la musique, noir entre les temps forts ; sans, a sa propre frequence
      strobe: S.strobe > 0 ? (m ? (m.coup < 0.35 ? S.strobe : 0) : ((performance.now() / 1000 * S.strobeFreq) % 1 < 0.5 ? S.strobe : 0)) : 0,
    };
    // l'onde de choc repart a chaque temps fort (ou a chaque flash)
    this.chocAge = (this.chocAge === undefined ? 9 : this.chocAge) + dt;
    if ((m && m.coupNeuf) || live.coupNeuf) this.chocAge = 0;
    v.choc = S.choc * Math.max(0, 1 - this.chocAge / 1.1);
    // le kaleidoscope se forme et se defait en trois secondes environ ; ses miroirs ne changent
    // de nombre que quand il est defait
    if (S.kaleido > 1 && (this.kFondu || 0) < 0.02) this.kMiroirs = Math.round(S.kaleido);
    const kVoulu = S.kaleido > 1 && Math.round(S.kaleido) === this.kMiroirs ? 1 : 0;
    this.kFondu = lerp(this.kFondu || 0, kVoulu, 1 - Math.exp(-dt / 1.1));
    if (Math.abs(this.kFondu - kVoulu) < 0.004) this.kFondu = kVoulu;
    v.kaleido = this.kFondu > 0 ? this.kMiroirs : 0;
    v.kFondu = this.kFondu;
    // le degrade glisse d'une gamme a l'autre
    const gVoulu = couleursDegrade(), kg = 1 - Math.exp(-dt / 1.2);
    this.gCour = this.gCour ? this.gCour.map((c, i) => c.map((x, j) => lerp(x, gVoulu[i][j], kg))) : gVoulu;
    this.gForce = lerp(this.gForce || 0, S.degrade !== "aucun" ? S.degradeForce : 0, kg);
    if (this.gForce < 0.003 && S.degrade === "aucun") this.gForce = 0;
    v.gradForce = this.gForce;
    v.chocR = this.chocAge * 0.9;
    // stable : il tourne a sa vitesse, sans sauter sur les temps ni battre avec les basses
    const bouge = m && !S.kaleidoStable;
    this.kAngle += dt * (S.kaleidoTourne + L.tourne + (bouge ? m.mediums * pousse * 0.4 : 0)) + (bouge ? m.coupNeuf * pousse * 0.35 : 0);
    this.rot += dt * (S.teinteGpu + (m ? m.aigus * pousse * 0.3 : 0)) + (m && S.teinteGpu > 0 ? m.coupNeuf * pousse * 0.5 : 0);
    v.lRot = S.larsenRotation + L.rot;
    // jusqu'a quatre mains (une par manette), plus la voix du mode poesie s'il reste une place
    const ls = main.loupes ? main.loupes() : [];
    v.mainX = [0, 0, 0, 0]; v.mainY = [0, 0, 0, 0]; v.mainRs = [0, 0, 0, 0]; v.mainLs = [0, 0, 0, 0]; v.mainTs = [0, 0, 0, 0];
    ls.forEach((l, i) => { if (i < 4) { v.mainX[i] = l.p[0]; v.mainY[i] = l.p[1]; v.mainRs[i] = l.r; v.mainLs[i] = l.loupe; v.mainTs[i] = l.tourb; } });
    v.mainR = ls.length ? 1 : 0;
    // la musique mene les effets (onglet « Le son mène ») : chacun ecoute sa source
    v.mods = false;
    if (m) for (const [c, , champ, ech, , lo, hi] of MODS) {
      const f = S["mod" + c];
      if (!f) continue;
      v.mods = true;
      const d = f * ech * sourceMusique(S["mod" + c + "Src"]);
      if (champ === "kTourne") this.kAngle += dt * d;
      else v[champ] = clamp((v[champ] || 0) + d, lo, hi);
    }
    // les gestes de la manette (mode Jouer) frappent l'image ; les gachettes la font onduler ou briller
    const im = main.impact, jeu = main.enJeu();
    v.rvb += im.rvb; v.flash += im.flash; v.fonte += im.fonte; v.decal += im.decal * Math.PI;
    // L2 ne secoue plus l'image (Jiiji, 2026-10-19 : « le flash, là, c'est nul ») : il ne fait
    // qu'ecarter les mots, comme R2 les attire
    v.ondes += im.ondes;
    v.halo += im.halo + (jeu ? main.aimant * 1.4 : 0);
    v.mainImpact = main.impactActif();
    // Jiiji (2026-10-19) : « j'aime pas les effets vieille tele ». Sans la case, ni le pilote, ni
    // les cables, ni les LFO, ni les presets ne les allument
    if (!S.vieilleTele) v.vhs = v.courbure = v.balayage = v.grain = v.vignette = 0;
    return v;
  },
  utile(v) {
    return v.halo > 0.01 || v.rvb > 0.01 || v.ondes > 0.01 || v.mosaique > 0.005 || v.kaleido > 1 || v.larsen > 0.01 ||
      v.vhs > 0.005 || v.courbure > 0.005 || v.balayage > 0.005 || v.grain > 0.005 || v.vignette > 0.005 || S.teinteGpu > 0.005 || v.flash > 0.01 ||
      v.miroir > 0 || S.choc > 0.005 || S.negatif > 0.005 || S.bichromie > 0.005 || S.pompe > 0.005 ||
      S.saturation !== 1 || S.contraste !== 1 || S.exposition !== 1 || S.decalage > 0 || S.chroma > 0.005 || S.solarisation > 0.005 ||
      S.posterisation >= 2 || S.blocs > 0.005 || v.mods || S.fonte > 0.005 || S.strobe > 0.005 || S.degrade !== "aucun" || (this.gForce || 0) > 0.003 ||
      v.mainR > 0 || v.mainImpact;
  },

  // les deux couleurs de la bichromie, relues seulement quand la palette change
  bichro() {
    const P = palette(), cle = P.nom + P.fond[0] + P.fond[1] + P.texte + P.accent;
    if (this.bichroCle !== cle) {
      this.bichroCle = cle;
      this.bichroC = { c0: rgbDe(P.clair ? P.texte : P.fond[0]), c1: rgbDe(P.clair ? P.fond[1] : P.accent) };
    }
    return this.bichroC;
  },

  // rend l'image ; renvoie faux si la carte n'a rien a faire (la toile s'affiche seule)
  dessiner(dt) {
    const v = this.valeurs(dt);
    const maintenant = performance.now();
    let utile = this.utile(v) && this.init();
    // Hysteresis : la carte reste allumee 3 s apres son dernier usage. Avec le flash pour seul
    // effet, elle s'allumait et s'eteignait a chaque kick : la page changeait de toile affichee
    // et le larsen repartait de zero (audit du 2026-10-18). Allumee pour rien, elle coute 0,3 ms.
    if (utile) this.dernierUsage = maintenant;
    else if (this.actif && this.ok && maintenant - (this.dernierUsage || 0) < 3000) utile = true;
    if (utile !== this.actif) {
      this.actif = utile;
      document.body.classList.toggle("gl", utile);
      this.effacer = true;
    }
    if (!utile) return false;
    const gl = this.gl;
    this.dimensionner();
    gl.bindTexture(gl.TEXTURE_2D, this.scene);
    // L'envoi de la toile au meilleur cout : a l'endroit (le shader la retourne), alpha deja
    // premultiplie (la toile est opaque, rien a convertir), et dans la texture deja allouee.
    // Retourner ou depremultiplier a l'envoi oblige Chrome a passer par une copie intermediaire.
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    if (this.sceneW !== toile.width || this.sceneH !== toile.height) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, toile);
      this.sceneW = toile.width; this.sceneH = toile.height;
    } else gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, toile);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    if (v.halo > 0.01) {
      const [a, b] = this.halos;
      this.passe(this.progs.brillant, a, { tex: this.scene }, { texel: [1 / this.w, 1 / this.h], seuil: S.seuilHalo });
      for (let i = 0; i < 2; i++) {
        const r = 1 + i * 1.5;
        this.passe(this.progs.flou, b, { tex: a.tex }, { dir: [r / a.w, 0] });
        this.passe(this.progs.flou, a, { tex: b.tex }, { dir: [0, r / a.h] });
      }
    }
    const prec = this.images[this.courante], cour = this.images[1 - this.courante];
    if (this.effacer) {
      for (const c of this.images) { gl.bindFramebuffer(gl.FRAMEBUFFER, c.fb); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT); }
      this.effacer = false;
    }
    const textures = { tex: this.scene, halo: this.halos[0].tex, prec: prec.tex }, u = {
      res: [this.w, this.h], t: temps, force: v.halo > 0.01 ? v.halo : 0, rvb: v.rvb, ondes: v.ondes, mosaique: v.mosaique,
      kaleido: v.kaleido, kAngle: this.kAngle, larsen: v.larsen, lZoom: v.lZoom, lRot: v.lRot, vhs: v.vhs, teinte: this.rot % 6.2831853 * (S.teinteGpu > 0 ? 1 : 0), flash: v.flash,
      kZoom: v.kZoom, kSpirale: v.kSpirale, lTeinte: v.lTeinte, miroir: v.miroir, choc: v.choc, chocR: v.chocR, neg: v.neg, bichro: v.bichro, pompe: v.pompe,
      sat: v.sat, contraste: v.contraste, expo: v.expo, decal: v.decal, chroma: v.chroma, solar: v.solar, poster: v.poster, blocs: v.blocs, fonte: v.fonte,
      strobe: v.strobe, gradForce: v.gradForce, kFondu: v.kFondu, g0: this.gCour[0], g1: this.gCour[1], g2: this.gCour[2], g3: this.gCour[3],
      mainX: v.mainX, mainY: v.mainY, mainRs: v.mainRs, mainLs: v.mainLs, mainTs: v.mainTs,
      c0: this.bichro().c0, c1: this.bichro().c1,
    };
    // le limiteur de lumiere (lumiere.js, 2026-10-19) : ses retouches d'avant l'ecretage (une copie
    // des valeurs, jamais S), sa courbe a la sortie, et sa mesure deux fois par seconde
    const garde = typeof lumiere !== "undefined" ? lumiere : null;
    this.passe(this.progs.image, cour, textures, garde ? garde.regler(u) : u);
    this.courante = 1 - this.courante;
    this.passe(this.progs.ecran, null, { img: cour.tex }, { res: [this.w, this.h], t: temps, courbure: v.courbure, balayage: v.balayage, grain: v.grain, vignette: v.vignette,
      gardeCourbe: garde ? garde.courbe : 0, gardeBaisse: garde ? garde.baisse : 0 });
    if (garde) garde.mesurerCarte(this, cour, textures, u);
    return true;
  },
};

