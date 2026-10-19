"use strict";
/* ================================================================ les coups de coeur */

const bulles = [];
function bulle(x, y, texte) { bulles.push({ x, y, texte, t0: temps }); if (bulles.length > 12) bulles.shift(); }
function dessinerBulles() {
  if (!bulles.length) return;
  const P = palette();
  ctx.save();
  ctx.font = "bold 13px Tahoma, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  for (let i = bulles.length - 1; i >= 0; i--) {
    const b = bulles[i], age = temps - b.t0;
    if (age > 2.8) { bulles.splice(i, 1); continue; }
    ctx.globalAlpha = clamp(age * 4, 0, 1) * clamp((2.8 - age) / 0.8, 0, 1);
    ctx.shadowColor = P.clair ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.9)"; ctx.shadowBlur = 6;
    ctx.fillStyle = P.accent;
    ctx.fillText(b.texte, clamp(b.x, 140, W - 140), b.y - 26 - age * 32);
  }
  appliquerEspacement();
  ctx.restore();
}

const votesDonnes = new Set();
function voter(x, y) {
  if (!(scene instanceof ScenePoeme) || scene.phase === "sortie") return;
  const p = scene.poeme;
  if (p.origine !== "recueil" && p.origine !== "essai") { bulle(x, y, "le poème infini ne se vote pas"); return; }
  let choisi = null, d = Infinity;
  for (const m of scene.mots) {
    if (!m.s || m.note || m.mort) continue;
    const dd = Math.hypot(m.x - x, m.y - y);
    if (dd < d) { d = dd; choisi = m; }
  }
  if (!choisi || d > Math.max(40, scene.tailleTexte * 1.6)) return;
  const s = choisi.s;
  const poete = s.poete === "à cinq mains" ? choisi.poete : s.poete;
  if (!poete || poete === "la boucle") { bulle(x, y, "la strophe qui se referme n'a pas d'auteur"); return; }
  const cle = p.id + "|" + s.index + "|" + poete;
  if (votesDonnes.has(cle)) { bulle(x, y, "déjà donné à " + poete.toLowerCase()); return; }
  votesDonnes.add(cle);
  for (const m of scene.mots) if (m.s === s && (s.poete !== "à cinq mains" || m.poete === poete)) m.flash = temps;
  const coup = corbeille.donnees ? corbeille.donnees.coup_de_coeur : 25;
  fetch("/hors-ligne/vote", { method: "POST", headers: { "X-Poiasie": "1", "Content-Type": "application/json" },
    body: JSON.stringify({ poeme: p.id, strophe: s.index, poete, vers: choisi.v ? choisi.v.texte : "", source: p.origine }) })
    .then(r => {
      if (!r.ok) { votesDonnes.delete(cle); bulle(x, y, "vote refusé : lance l'écran avec ecran.bat"); return; }
      bulle(x, y, "♥ coup de cœur pour " + poete.toLowerCase() + " · +" + coup + " sous");
      son.piece();
      chargerBourse();
    })
    .catch(() => { votesDonnes.delete(cle); bulle(x, y, "vote impossible sans serveur.py"); });
}

/* ================================================================ le mot */

let temps = 0;

function creerMot(t, pol, w, cx, cy, meta) {
  return Object.assign({
    t, affiche: casse(t), police: pol, w, hx: cx, hy: cy, x: cx, y: cy, angle: 0, echelle: 1, alpha: 0,
    graine: Math.random() * 1000, cours: coursDe(t), mort: false, ordre: 0,
  }, meta);
}

// une teinte fixe par mot : les six mots de la sextine gardent chacun la leur d'une strophe
// a l'autre, on voit la spirale tourner ; le radif du ghazal brille pareil a chaque distique
function teinteDuMot(r) {
  let h = 0;
  for (const c of r) h = (h * 31 + c.charCodeAt(0)) % 3600;
  return h % 360;
}

// Les couleurs "hsl(h,s%,l%)" sont faites une fois et gardees : couleurDe est appelee pour
// chaque lettre a chaque image, et chaque chaine neuve etait un dechet de plus (audit du
// 2026-10-18). La meme chaine sert aussi de cle aux vignettes, toujours le meme objet.
const chainesHsl = new Map();
function hsl(h, s, l) {
  h = Math.round(h); s = Math.round(s); l = Math.round(l);
  const k = (h * 128 + s) * 128 + l;
  let c = chainesHsl.get(k);
  if (c === undefined) {
    c = "hsl(" + h + "," + s + "%," + l + "%)";
    if (chainesHsl.size > 20000) chainesHsl.clear();
    chainesHsl.set(k, c);
  }
  return c;
}

// La teinte d'un poete : la sienne s'il est connu (TEINTES), sinon une teinte tiree de son nom,
// toujours la meme. Le generateur va passer a 15 ou 20 poetes (2026-10-18) : chacun garde sa
// couleur sans qu'on ait a l'ecrire ici.
const teintesTirees = new Map();
function teinteDe(poete) {
  if (!poete) return undefined;
  const t = TEINTES[poete];
  if (t !== undefined) return t;
  let h = teintesTirees.get(poete);
  if (h === undefined) {
    // un hachage du nom (FNV), etale par le nombre d'or pour que deux noms voisins s'ecartent
    let x = 2166136261;
    for (const c of poete) { x ^= c.codePointAt(0); x = Math.imul(x, 16777619) >>> 0; }
    h = Math.round(((x / 4294967296) * 0.618034 * 7 % 1) * 360) % 360;
    teintesTirees.set(poete, h);
  }
  return h;
}

// pas : arrondit la teinte (les vignettes ne gardent qu'une couleur tous les "pas" degres)
function couleurDe(m, pas) {
  const P = palette();
  if (m.note) return P.note;
  if (m.type === "titre" || m.impose) return P.accent;
  if (m.flash && temps - m.flash < 1.6) return P.accent;  // le coup de coeur
  if (m.fin && !P.mono) return P.clair ? hsl(teinteDuMot(m.fin), 70, 32) : hsl(teinteDuMot(m.fin), 85, 70);
  if (P.mono) return P.texte;
  const mode = S.modeCouleur;
  if (mode === "palette") return P.texte;
  if (mode === "accent") return P.accent;
  if (mode === "alternance") return (m.ordre || 0) % 2 ? P.accent : P.texte;
  let h, vif = false;
  if (mode === "arc") { h = ((m.ordre || 0) * 47 + temps * 40) % 360; vif = true; }
  else if (P.arcEnCiel) { h = ((m.ordre || 0) * 11 + temps * 40) % 360; vif = true; }
  else if (mode === "teinte") h = S.teinteMots;
  else if (S.couleurPoetes && teinteDe(m.poete) !== undefined) h = teinteDe(m.poete);
  else if (S.derive > 0) h = P.teinte;
  else return P.texte;
  h = (h + temps * S.derive * 25 + 360) % 360;
  if (pas) h = (Math.round(h / pas) * pas) % 360;
  // la vivacite et la clarte se reglent dans l'onglet Couleurs
  // par pas de 5 % : le pilote fait glisser la vivacite, et chaque teinte neuve est une vignette neuve
  const sat = clamp(Math.round((P.clair ? 55 : vif ? 90 : 55) * S.vivacite / 5) * 5, 0, 100), lum = clamp((P.clair ? 28 : vif ? 65 : 80) + S.clarte * 22, 6, 96);
  return hsl(h % 360, sat, lum);
}

const GLYPHES = "▓▒░#%&@$¤§01ØΣ";
function brouiller(t) {
  const c = t.split("");
  const n = 1 + Math.floor(Math.random() * Math.min(3, c.length));
  for (let i = 0; i < n; i++) c[Math.floor(Math.random() * c.length)] = tirer(GLYPHES);
  return c.join("");
}

function dessinerMot(m, opt) {
  opt = opt || {};
  const alpha = clamp((opt.alpha !== undefined ? opt.alpha : m.alpha) * (m.herite ? 0.72 : 1), 0, 1);
  if (alpha <= 0.003) return;
  const t = temps;
  let x = m.x, y = m.y, ang = m.angle, ech = m.echelle;
  const calme = opt.calme ? 0.25 : 1;
  let A = S.tremblement * calme * (S.tremblementValeur && !m.note ? 0.25 + 1.6 * (1 - m.cours / 100) : 1);
  if (A > 0) {
    const f = S.frequence * 6;
    x += A * bruit(t * f + m.graine);
    y += A * bruit(t * f + m.graine * 1.7 + 30);
    ang += A * 0.008 * bruit(t * f * 0.8 + m.graine * 2.3);
  }
  if (S.ondulation) y += S.ondulation * 7 * Math.sin(t * 2 + m.hx * 0.013) * calme;
  if (S.respiration) ech *= 1 + S.respiration * 0.07 * Math.sin(t * 1.3 + m.graine) * calme;
  if (m.flash && t - m.flash < 1.6) ech *= 1 + 0.14 * Math.sin(clamp((t - m.flash) / 1.6, 0, 1) * Math.PI);
  if (S.rotationMots) ang += S.rotationMots * 0.25 * Math.sin(t * 0.7 + m.graine) * calme;
  if (S.musique && musique.actif) {
    // les basses font battre les mots, les aigus les font trembler
    ech *= battementMots(0.16);
    const a = musique.aigus * pulseMots() * 2.5 * calme;
    if (a) { x += a * bruit(t * 23 + m.graine); y += a * bruit(t * 19 + m.graine * 1.3); }
  }
  let texte = opt.texte !== undefined ? opt.texte : m.affiche;
  if (m.glitchJusqua > t) { texte = m.glitchTexte; x += m.glitchDx; }
  else if (S.glitch > 0 && Math.random() < S.glitch * 0.006) {
    m.glitchJusqua = t + 0.06 + Math.random() * 0.18; m.glitchTexte = brouiller(texte); m.glitchDx = (Math.random() - 0.5) * 24 * S.glitch;
  }
  // la teinte par pas de 4 degres : invisible, et une teinte qui derive ne refait plus la vignette
  // a chaque image
  const couleur = opt.couleur || couleurDe(m, 4);
  ctx.save();
  ctx.translate(x, y);
  if (ang) ctx.rotate(ang);
  if (ech !== 1) ctx.scale(ech * (opt.etirementX || 1), ech * (opt.etirementY || 1));
  else if (opt.etirementY) ctx.scale(1, opt.etirementY);
  ctx.globalAlpha = alpha;
  // Le mot est pose depuis sa vignette, peinte une fois a sa taille exacte (lueur comprise) :
  // ecrire chaque mot avec son ombre floue a chaque image coutait 44 a 65 ms a la Lecture, au
  // Tourbillon et au Texte defilant (audit du 2026-10-18). Restent ecrits a la main : le texte
  // brouille du glitch, les morceaux de mot (machine a ecrire), un mot tres agrandi (il serait flou).
  if (texte === m.affiche && ech <= 1.3 && !(m.glitchJusqua > t)) {
    const base = ctx.textBaseline, align = opt.gauche ? "left" : ctx.textAlign;
    const fs = tailleDePolice(m.police);
    const dy = base === "middle" ? 0 : base === "bottom" ? -fs / 2 : base === "top" ? fs / 2 : null;
    if (dy !== null) {
      const v = vignetteTexte(texte, m.police, couleur, !!m.note);
      if (v) {
        let dx = 0;
        if (align === "left" || align === "start") dx = mesurer(texte, m.police) / 2;
        else if (align === "right" || align === "end") dx = -mesurer(texte, m.police) / 2;
        if (dx || dy) ctx.translate(dx, dy);
        if (v.fs !== fs) ctx.scale(fs / v.fs, fs / v.fs);
        poserVignette(v);
        if (dx || dy || v.fs !== fs) { ctx.restore(); ctx.save(); ctx.translate(x, y); if (ang) ctx.rotate(ang); if (ech !== 1) ctx.scale(ech * (opt.etirementX || 1), ech * (opt.etirementY || 1)); else if (opt.etirementY) ctx.scale(1, opt.etirementY); }
        if (m.lettrine > 0 && texte.length) lettrineDe(m, texte, alpha, opt);
        ctx.restore();
        return;
      }
    }
  }
  ctx.font = m.police;
  if (opt.gauche) ctx.textAlign = "left";
  // les deux fantomes de l'aberration passent avant la lueur, sans ombre : une ombre floue
  // dessinee en mode "lighter" fait tomber Chrome dans un chemin lent (631 ms par image
  // mesures le 2026-10-16 avec aberration 1 et lueur 0.5, 18 ms sans)
  if (S.aberration > 0) {
    const d = S.aberration * 2.2;
    ctx.globalCompositeOperation = palette().clair ? "multiply" : "lighter";
    ctx.fillStyle = "rgba(255,30,80,0.75)"; ctx.fillText(texte, -d, 0);
    ctx.fillStyle = "rgba(30,200,255,0.75)"; ctx.fillText(texte, d, d * 0.3);
    ctx.globalCompositeOperation = "source-over";
  }
  if (S.lueur > 0 && !m.note) { ctx.shadowColor = couleur; ctx.shadowBlur = S.lueur * 16; }
  ctx.fillStyle = couleur;
  ctx.fillText(texte, 0, 0);
  if (S.contour) {
    ctx.shadowBlur = 0; ctx.lineWidth = 1;
    ctx.strokeStyle = palette().clair ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.55)";
    ctx.strokeText(texte, 0, 0);
  }
  if (m.lettrine > 0 && texte.length) lettrineDe(m, texte, alpha, opt);
  ctx.restore();
}
function lettrineDe(m, texte, alpha, opt) {
  // l'acrostiche : la premiere lettre s'allume
  const premiere = texte[0];
  const wTout = mesurer(texte, m.police), wP = mesurer(premiere, m.police);
  ctx.font = m.police;
  if (opt.gauche) ctx.textAlign = "left";
  ctx.globalAlpha = alpha * m.lettrine;
  ctx.shadowColor = palette().accent; ctx.shadowBlur = 18 * m.lettrine;
  ctx.fillStyle = palette().accent;
  ctx.fillText(premiere, opt.gauche ? 0 : -wTout / 2 + wP / 2, 0);
}

/* ================================================================ mise en page */

ajouterReglages("Poèmes", "Ce qui s'écrit avec le poème", [
  { cle: "annoncerForme", nom: "Écrire le nom de la forme (sonnet, pantoum…)", type: "case" },
], { annoncerForme: false });

// un vers trop long pour l'ecran passe a la ligne, mot a mot, a la largeur donnee
function couperVers(texte, largeur, pol) {
  const mots = texte.split(/\s+/).filter(Boolean), lignes = [];
  let cour = "";
  for (const m of mots) {
    const essai = cour ? cour + " " + m : m;
    if (cour && mesurer(casse(essai), pol) > largeur) { lignes.push(cour); cour = m; } else cour = essai;
  }
  if (cour) lignes.push(cour);
  return lignes.length ? lignes : [texte];
}

function mettreEnPage(p, coupe) {
  const tete = [];
  if (p.titre) tete.push({ type: "titre", texte: p.titre });
  // Jiiji (2026-10-18) : « j'aime pas que les styles de poemes soient annonces ». Le nom de la
  // forme ne s'ecrit plus (ni sa place), sauf si on coche « Écrire le nom de la forme »
  if (S.annoncerForme) tete.push({ type: "forme", texte: (p.forme || "") + (p.inacheve ? " (inachevé)" : "") });
  if (p.epigraphe && p.epigraphe.texte) tete.push({ type: "epigraphe", texte: p.epigraphe.texte });
  tete.push({ type: "blanc" });
  const corps = [];
  p.strophes.forEach((s, is) => {
    if (is > 0 && !s.colle) corps.push({ type: "blanc" });
    s.vers.forEach((v, iv) => {
      if (!coupe || !v.texte) { corps.push({ type: "vers", texte: v.texte, v, s, premier: iv === 0 }); return; }
      const bouts = couperVers(v.texte, coupe.largeur, coupe.police);
      bouts.forEach((t, k) => corps.push({ type: "vers", texte: t, v, s, premier: iv === 0 && k === 0, suite: k > 0, dernier: k === bouts.length - 1, coupe: bouts.length > 1 }));
    });
  });
  // un long poeme (sextine, renga, cadavre) sur un ecran large passe sur deux colonnes,
  // coupe entre deux strophes, au plus pres de la moitie
  let colonnes = [corps];
  const nbVers = corps.filter(l => l.type === "vers").length;
  if (nbVers > 24 && W > 1000 && W / H > 1.2) {
    let compte = 0, coupe = -1, ecart = Infinity;
    corps.forEach((l, i) => {
      if (l.type === "vers") compte++;
      else if (Math.abs(compte - nbVers / 2) < ecart) { ecart = Math.abs(compte - nbVers / 2); coupe = i; }
    });
    if (coupe > 0) colonnes = [corps.slice(0, coupe), corps.slice(coupe + 1)];
  }
  const nc = colonnes.length;
  const HAUTEURS = { blanc: 0.55, titre: 1.3, forme: 0.75, epigraphe: 0.85 };
  const unitesDe = ls => ls.reduce((a, l) => a + (HAUTEURS[l.type] || 1), 0);
  const unites = unitesDe(tete) + Math.max(...colonnes.map(unitesDe));
  // en bas, la place du cartel (sa vraie hauteur) ; en haut, celle du bandeau de la Bourse
  const reserveBas = S.cartel ? clamp(hauteurCartel(p) + 30, 60, H * 0.22) : 24;
  const reserveHaut = S.bourse ? 30 : 16;
  const utile = H - reserveBas - reserveHaut;
  // la taille choisie grossit le texte, mais jamais au point de le faire sortir de l'image :
  // le plafond de hauteur s'applique apres elle (avant le 2026-10-16, il s'appliquait avant,
  // et a 2 le bas du poeme passait sous l'ecran)
  let taille = Math.min(Math.min(42, W / 26) * S.taille, (utile * 0.96) / (unites * 1.42));
  const marges = S.annotations && W > 720 && !(coupe && coupe.sansMarges);
  const largeurMax = (W / nc) * (marges ? 0.7 : 0.9);
  // L'espacement des lettres ne grandit pas avec la police : reduire la police de moitie ne
  // reduit pas la ligne de moitie. On mesure donc, on reduit, et on remesure.
  const largeurs = t => {
    let pl = 0;
    for (const l of corps) if (l.type === "vers") pl = Math.max(pl, mesurer(casse(l.texte), police(t)) + (l.suite ? t * 1.5 : 0));
    if (nc === 1 && p.titre) pl = Math.max(pl, mesurer(casse(p.titre), police(t * 1.25, true)));
    // les noms des poetes et les syllabes, dans la marge, doivent tenir aussi
    const note = marges ? Math.max(...["Le surréaliste", "Le minimaliste", "à cinq mains", "12 · A"].map(x => mesurer(x, police(t * 0.42)))) : 0;
    return { pl, besoin: marges ? pl + 2 * (t * 1.1 + note) + 24 : pl / 0.9 };
  };
  const tailleVoulue = taille;
  const tient = L => L.pl <= largeurMax && L.besoin <= W / nc;
  let L = largeurs(taille);
  if (!tient(L)) {
    // la plus grande taille qui tient, par dichotomie (la largeur croit avec la taille)
    let bas = 1, haut = taille;
    for (let k = 0; k < 18; k++) { const mi = (bas + haut) / 2; if (tient(largeurs(mi))) bas = mi; else haut = mi; }
    taille = bas; L = largeurs(taille);
  }
  let plusLarge = L.pl;
  // des vers si longs qu'il faudrait les ecrire en tout petit : on les coupe et on recommence
  // et si, coupes, ils ne tiennent toujours pas avec les notes de marge, on retire les notes
  const tropPetit = taille < Math.min(16, tailleVoulue * 0.6) || !tient(L);
  if (tropPetit && !coupe) {
    const tc = Math.max(13, Math.min(tailleVoulue, 30) * 0.85);
    // a la largeur d'une colonne : une fois coupe, le poeme peut passer sur deux
    return mettreEnPage(p, { largeur: W * (marges ? 0.33 : 0.42), police: police(tc) });
  }
  if (tropPetit && marges) return mettreEnPage(p, Object.assign({}, coupe, { largeur: W * 0.42, sansMarges: true }));
  // (plus de plancher a 7 px : il faisait deborder les longs poemes en deux colonnes)
  // le titre a sa propre limite : toute la largeur de l'ecran
  let tailleTitre = taille * 1.25;
  if (p.titre) tailleTitre = Math.min(tailleTitre, tailleTitre * W * 0.86 / Math.max(1, mesurer(casse(p.titre), police(tailleTitre, true))));
  const lh = taille * 1.42;
  let y = reserveHaut + Math.max(0, (utile - unites * lh) / 2) + lh * 0.5;
  const mots = [];
  const geo = [];
  let ordre = 0, rangInitiale = 0;

  function poser(l, cx, y, gauche, droite, col) {
    const titre = l.type === "titre", forme = l.type === "forme", epi = l.type === "epigraphe";
    let tl = titre ? tailleTitre : forme ? Math.max(8, taille * 0.46) : epi ? Math.max(8, taille * 0.55) : taille;
    // l'epigraphe tient sur la largeur de l'ecran
    if (epi) tl = Math.max(7, Math.min(tl, tl * W * 0.9 / Math.max(1, mesurer("« " + casse(l.texte) + " »", police(tl, true)))));
    const italique = titre || epi || (l.v && l.v.refrain);
    const pol = forme ? (Math.max(8, tl)).toFixed(1) + "px Tahoma, sans-serif" : police(tl, italique);
    const texteLigne = epi ? "« " + l.texte + " »" : l.texte;
    const morceaux = forme ? [l.texte.toUpperCase().split("").join(" ")] : texteLigne.split(/\s+/).filter(Boolean);
    const esp = mesurer(" ", pol);
    const largeurs = morceaux.map(m => mesurer(casse(m), pol));
    const total = largeurs.reduce((a, b) => a + b, 0) + esp * (morceaux.length - 1);
    // la suite d'un vers coupe est en retrait
    let x = cx - total / 2 + (l.suite ? taille * 1.5 : 0);
    const debutLigne = x;
    const finDeVers = !l.coupe || l.dernier;
    const finR = l.v && l.v.fin ? racine(l.v.fin) : null;
    const imposeR = l.v && l.v.impose ? racine(l.v.impose.split(/[\s-]/)[0]) : null;
    // cadavre exquis : chaque mot garde la couleur de la main qui l'a ecrit
    const mains = l.v && l.v.segments ? l.v.segments.flatMap(sg => (sg.texte || "").split(/\s+/).filter(Boolean).map(() => sg.poete)) : null;
    morceaux.forEach((m, i) => {
      const meta = { type: l.type, ordre: ordre++, poete: mains && mains[i] ? mains[i] : l.s ? l.s.poete : "", herite: l.v ? l.v.herite : false,
        refrain: l.v ? l.v.refrain : null, impose: !!imposeR && motsPleins(m).some(w => racine(w).startsWith(imposeR.slice(0, 5))),
        s: l.s || null, v: l.v || null };
      if (forme || epi) Object.assign(meta, { note: true });
      // le mot de fin de la sextine et le radif du ghazal, chacun a sa couleur
      if (finR && finDeVers && i === morceaux.length - 1 && racine(m.replace(/[^\p{L}-]/gu, "")) === finR) meta.fin = finR;
      if (l.v && l.v.lettre && finDeVers && i === morceaux.length - 1) meta.cloche = l.v.lettre;
      if (l.v && l.v.initiale && !l.suite && i === 0) {
        meta.initiale = true; meta.rangInitiale = rangInitiale++;
        // une lettre ratee ne s'allume pas : le trou reste visible dans le mot cache
        const premiere = (sansAccents(m).match(/\p{L}/u) || [""])[0].toLowerCase();
        meta.initialeRatee = premiere !== sansAccents(l.v.initiale).toLowerCase();
      }
      mots.push(creerMot(m, pol, largeurs[i], x + largeurs[i] / 2, y, meta));
      x += largeurs[i] + esp;
    });
    if (l.type !== "vers") return;
    if (finDeVers) geo.push({ s: l.s, v: l.v, y, gauche: debutLigne, droite: debutLigne + total, taille, col, colDroite: droite });
    if (!marges) return;
    const pn = police(taille * 0.42);
    if (l.premier && l.s.poete) {
      const nom = l.s.poete;
      const w = mesurer(nom, pn);
      mots.push(creerMot(nom, pn, w, gauche - taille * 1.1 - w / 2, y, { note: true, ordre: ordre, poete: nom }));
    }
    if (!finDeVers) return;
    // la boule de neige se compte en mots, le reste en syllabes
    const bout = l.v.mots ? l.texte.split(/\s+/).filter(w => /\p{L}/u.test(w)).length + "/" + l.v.mots + " mots"
      : [l.v.lettre || "", l.v.syllabes ? String(l.v.syllabes) : ""].filter(Boolean).join(" · ");
    if (bout) {
      const w = mesurer(bout, pn);
      mots.push(creerMot(bout, pn, w, droite + taille * 1.1 + w / 2, y, { note: true, ordre: ordre }));
    }
  }

  for (const l of tete) {
    if (l.type !== "blanc") poser(l, W / 2, y, W / 2 - plusLarge / 2, W / 2 + plusLarge / 2, -1);
    y += lh * (HAUTEURS[l.type] || 1);
  }
  const yCorps = y;
  colonnes.forEach((col, k) => {
    const cx = nc === 1 ? W / 2 : W * (k === 0 ? 0.25 : 0.75);
    const gauche = cx - plusLarge / 2, droite = cx + plusLarge / 2;
    let yy = yCorps;
    for (const l of col) {
      if (l.type !== "blanc") poser(l, cx, yy, gauche, droite, k);
      yy += lh * (HAUTEURS[l.type] || 1);
    }
  });
  mots.geo = geo;
  mots.taille = taille;
  mots.gauche = W / 2 - plusLarge / 2;
  mots.droite = W / 2 + plusLarge / 2;
  mots.colonnes = nc;
  return mots;
}

/* ================================================================ les chutes en fantome */

const cacheChutes = new Map();
async function chutesDe(p) {
  if (cacheChutes.has(p.id)) return cacheChutes.get(p.id);
  const d = await lireJSON("/hors-ligne/chutes?source=" + (p.origine === "essai" ? "essai" : "recueil") + "&id=" + encodeURIComponent(p.id));
  const liste = d && d.chutes ? d.chutes : [];
  cacheChutes.set(p.id, liste);
  if (cacheChutes.size > 60) cacheChutes.delete(cacheChutes.keys().next().value);
  return liste;
}

// Chaque version battue va se poser, en transparence, sur les vers qu'elle aurait ete :
// le poeme se lit par-dessus ce qu'il a failli etre.
function placerChutes(liste, geo, poeme) {
  const fantomes = [];
  const parStrophe = new Map();
  for (const c of liste) {
    if (!c.texte) continue;
    let cibles = [], textes;
    const phrase = /^phrase (\d+)/.exec(c.poste || "");
    if (phrase) {
      const g = geo.filter(x => x.s && x.s.index === 0)[Number(phrase[1]) - 1];
      if (!g) continue;
      cibles = [g]; textes = [c.texte];
    } else {
      const s = poeme.strophes.find(x => x.role === c.poste && x.poete === c.poete);
      if (!s) continue;
      cibles = geo.filter(x => x.s === s && !(x.v && x.v.herite));
      textes = c.texte.split("\n").filter(Boolean);
    }
    const cle = phrase ? "p" + phrase[1] : c.poste + "|" + c.poete;
    const rang = parStrophe.get(cle) || 0;
    parStrophe.set(cle, rang + 1);
    textes.forEach((t, j) => {
      const g = cibles[j];
      if (!g) return;
      fantomes.push({ texte: casse(t), y: g.y, xc: (g.gauche + g.droite) / 2, taille: g.taille, rang, cle,
        decale: phrase ? hasard(-0.25, 0.25) * W : 0, graine: Math.random() * 1000 });
    });
  }
  for (const f of fantomes) f.nb = parStrophe.get(f.cle) || 1;
  return fantomes;
}

