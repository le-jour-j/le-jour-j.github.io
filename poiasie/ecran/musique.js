"use strict";
/* ================================================================ la musique */

// Les mots ecoutent : le micro, une entree son (une table de mixage branchee sur la carte
// son), ou le son du PC lui-meme par le partage d'ecran de Chrome. Rien n'est enregistre ni
// rejoue : on mesure trois bandes (basses, mediums, aigus) et les temps forts, c'est tout.
const musique = {
  ctx: null, analyse: null, flux: null, donnees: null, actif: false, erreur: "", branchement: false,
  basses: 0, mediums: 0, aigus: 0, niveau: 0, coup: 0, coupNeuf: 0,
  max: [0.15, 0.15, 0.15], moyBasses: 0, dernierCoup: 0, intervalles: [], bpm: 0, calmeDepuis: 0, dernierDrop: 0,

  // les sources : « micro » (le micro ou une entree son), « pc » (le partage d'ecran), et depuis le
  // 2026-10-18 la boucle interne. Jiiji : « je reboucle en entree dans le logiciel le son des mots
  // quand ils apparaissent, du coup chaque mot quand il fait un son fait bouger tout le reste » :
  // « ecran » (l'ecran s'ecoute lui-meme : la sortie du son va droit a l'analyse, sans permission ni
  // partage d'ecran, sans retard), « melange » (le micro ou l'entree son, plus l'ecran), « pcEcran »
  // (le son du PC sans celui de cette page quand Chrome sait l'exclure, plus l'ecran). L'analyse n'est
  // jamais branchee sur les haut-parleurs : pas de larsen numerique.
  SOURCES_ECRAN: new Set(["ecran", "melange", "pcEcran"]),
  // quand l'ecran s'ecoute lui-meme, chaque note qui part frappe aussi sa bande au moment ou elle sonne
  // (graves : kick, medium : caisse, aigu : charley), en plus de l'analyse : une nappe qui monte
  // doucement ne fait pas de coup a l'oreille du detecteur, mais c'est un mot qui sonne (Jiiji :
  // « chaque mot quand il fait un son fait bouger tout le reste »)
  notesEcran: [],
  coupsEcran() {
    const r = [false, false, false];
    if (!this.avecEcran || !son.ctx || !this.notesEcran.length) return r;
    const t = son.ctx.currentTime;
    this.notesEcran = this.notesEcran.filter(n => {
      if (n.t > t) return true;
      if (t - n.t < 0.5) r[n.f < 300 ? 0 : n.f < 1500 ? 1 : 2] = true;
      return false;
    });
    return r;
  },
  async brancher() {
    if (this.branchement) return;
    this.branchement = true;
    this.debrancher(true);
    this.erreur = ""; this.attendSon = false;
    majMusiqueUI();
    try {
      const src = S.musiqueSource, avecEcran = this.SOURCES_ECRAN.has(src);
      if (avecEcran) {
        // l'ecran s'ecoute dans le contexte du son lui-meme : il faut que le son ait demarre
        if (!S.son) throw new Error("le son de l'écran est coupé : allume-le (touche S, onglet Son)");
        son.demarrer();
        if (!son.ctx || !son.ecoute) { this.attendSon = true; throw new Error("en attente d'un clic sur l'écran (le navigateur l'exige)"); }
      }
      if (src !== "ecran" && !navigator.mediaDevices) throw new Error("ce navigateur ne donne pas accès au son (ouvre la page par ecran.bat)");
      const sansTraitement = { echoCancellation: false, noiseSuppression: false, autoGainControl: false };
      let flux = null;
      if (src === "pc" || src === "pcEcran") {
        // Chrome exige une video pour partager le son : on la demande la plus petite possible, une image
        // par seconde (avant : l'ecran entier, a pleine cadence, tout le set, pour rien)
        const audio = Object.assign({}, sansTraitement);
        const permis = navigator.mediaDevices.getSupportedConstraints ? navigator.mediaDevices.getSupportedConstraints() : {};
        if (src === "pcEcran" && permis.restrictOwnAudio) audio.restrictOwnAudio = true;  // l'ecran ne s'entend pas deux fois
        flux = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: { max: 1 }, width: { max: 320 }, height: { max: 240 } }, audio, systemAudio: "include" });
        if (!flux.getAudioTracks().length) {
          flux.getTracks().forEach(t => t.stop());
          throw new Error("aucun son partagé : choisis « Écran entier » et coche « Partager aussi l'audio du système »");
        }
        for (const v of flux.getVideoTracks()) v.applyConstraints({ frameRate: 1, width: 64, height: 48 }).catch(() => {});
        this.sansSoi = !!(audio.restrictOwnAudio);
      } else if (src === "micro" || src === "melange") {
        flux = await navigator.mediaDevices.getUserMedia({ audio: Object.assign({ deviceId: S.musiqueEntree ? { exact: S.musiqueEntree } : undefined }, sansTraitement) });
      }
      this.avecEcran = avecEcran;
      this.ctxPartage = avecEcran;
      this.ctx = avecEcran ? son.ctx : new (window.AudioContext || window.webkitAudioContext)();
      this.analyse = this.ctx.createAnalyser();
      this.analyse.fftSize = 2048;
      this.analyse.smoothingTimeConstant = 0.45;
      // une musique masterisee depassait -30 dB dans les graves : les kicks plafonnaient et n'etaient
      // plus vus. Le plancher reste a -100, le plafond monte a -12 (spectre() compense pour les scenes)
      this.analyse.minDecibels = -100; this.analyse.maxDecibels = -12;
      if (flux) {
        this.source = this.ctx.createMediaStreamSource(new MediaStream(flux.getAudioTracks()));
        this.source.connect(this.analyse);  // vers l'analyse seulement : on n'envoie rien aux haut-parleurs
        if (avecEcran) {
          // ce qui vient d'ailleurs, a part : pour « se tait quand la musique joue »
          this.analyseExt = this.ctx.createAnalyser(); this.analyseExt.fftSize = 1024;
          this.formeExt = new Uint8Array(this.analyseExt.fftSize);
          this.source.connect(this.analyseExt);
        }
      }
      if (avecEcran) { son.ecoute.connect(this.analyse); this.ecouteBranchee = son.ecoute; }
      this.donnees = new Uint8Array(this.analyse.frequencyBinCount);
      this.forme = new Uint8Array(this.analyse.fftSize);
      this.flux = flux;
      this.actif = true;
      if (flux) flux.getTracks().forEach(t => t.addEventListener("ended", () => { if (this.flux === flux) { this.debrancher(); majMusiqueUI(); } }));
      if (flux) listerEntrees();
    } catch (e) {
      this.erreur = e && e.name === "NotAllowedError" ? "refusé : Chrome n'a pas eu la permission d'écouter" : (e && e.message) || String(e);
      this.actif = false;
    }
    this.branchement = false;
    majMusiqueUI();
  },
  debrancher(enSilence) {
    if (this.flux) this.flux.getTracks().forEach(t => t.stop());
    // le contexte du son est partage : on debranche l'ecoute, on ne le ferme pas
    if (this.ecouteBranchee) { try { this.ecouteBranchee.disconnect(this.analyse); } catch (e) { /* deja fait */ } this.ecouteBranchee = null; }
    if (this.source) { try { this.source.disconnect(); } catch (e) { /* deja fait */ } this.source = null; }
    if (this.ctx && !this.ctxPartage) this.ctx.close().catch(() => {});
    this.flux = null; this.ctx = null; this.analyse = null; this.analyseExt = null; this.actif = false;
    this.avecEcran = false; this.ctxPartage = false; this.volumeExterne = 0; this.notesEcran = [];
    this.basses = this.mediums = this.aigus = this.niveau = this.coup = this.coupNeuf = this.sc = 0;
    this.env = [0, 0, 0];
    this.bpm = 0; this.intervalles = [];
    if (!enSilence) majMusiqueUI();
  },

  maj(dt) {
    this.coupNeuf = 0;
    if (!this.actif || !this.analyse) {
      this.coup *= Math.exp(-dt * 6);
      this.enveloppes(dt);
      return;
    }
    this.analyse.getByteFrequencyData(this.donnees);
    // la forme de l'onde, pour l'oscilloscope : son pic recent sert d'echelle, et la trace part
    // d'un passage a zero montant, comme sur un vrai oscilloscope (elle ne glisse pas)
    this.analyse.getByteTimeDomainData(this.forme);
    const fo = this.forme;
    let pic = 0;
    let carre = 0;
    for (let i = 0; i < fo.length; i += 4) { const d = fo[i] - 128; pic = Math.max(pic, Math.abs(d)); carre += d * d; }
    // le volume vrai (pour le pilote) : il ne se remet pas a niveau comme les trois bandes
    this.volume = lerp(this.volume || 0, Math.sqrt(carre / (fo.length / 4)) / 128, 1 - Math.exp(-dt * 8));
    this.volumeMax = Math.max(this.volume, (this.volumeMax || 0.02) * Math.pow(0.5, dt / 40), 0.005);
    this.picOnde = Math.max(pic / 128, (this.picOnde || 0.05) * Math.pow(0.5, dt / 4), 0.02);
    // le volume de ce qui vient d'ailleurs, quand l'ecran s'ecoute aussi lui-meme
    if (this.analyseExt) {
      this.analyseExt.getByteTimeDomainData(this.formeExt);
      let ce = 0;
      for (let i = 0; i < this.formeExt.length; i += 4) { const x = this.formeExt[i] - 128; ce += x * x; }
      this.volumeExterne = lerp(this.volumeExterne || 0, Math.sqrt(ce / (this.formeExt.length / 4)) / 128, 1 - Math.exp(-dt * 8));
    } else this.volumeExterne = this.avecEcran ? 0 : this.volume;
    this.declenche = 0;
    for (let i = 1; i < fo.length >> 1; i++) if (fo[i - 1] < 128 && fo[i] >= 128) { this.declenche = i; break; }
    const hz = this.ctx.sampleRate / this.analyse.fftSize, d = this.donnees;
    const bande = (a, b) => {
      let s = 0, n = 0;
      for (let i = Math.max(1, Math.floor(a / hz)); i <= Math.ceil(b / hz) && i < d.length; i++) { s += d[i]; n++; }
      return n ? s / n / 255 : 0;
    };
    const brut = [bande(30, 150), bande(150, 2000), bande(2000, 10000)];
    // gain automatique : chaque bande se compare a son propre maximum des dernieres secondes,
    // pour que l'ecran danse pareil a bas volume et a fond
    for (let i = 0; i < 3; i++) this.max[i] = Math.max(brut[i], this.max[i] * Math.pow(0.5, dt / 5), 0.03);
    const sens = S.musiqueSensibilite;
    const cible = brut.map((v, i) => clamp(Math.pow(v / this.max[i], 2) * sens, 0, 1.6));
    const ra = S.musiqueReaction;
    const suivre = (cur, vise) => lerp(cur, vise, 1 - Math.exp(-dt * (vise > cur ? 30 : 7) * ra));
    this.basses = suivre(this.basses, cible[0]);
    this.mediums = suivre(this.mediums, cible[1]);
    this.aigus = suivre(this.aigus, cible[2]);
    this.niveau = (this.basses * 1.2 + this.mediums + this.aigus * 0.8) / 3;
    // un temps fort : les basses bondissent au-dessus de leur moyenne
    const maintenant = performance.now() / 1000;
    this.moyBasses = lerp(this.moyBasses, brut[0], 1 - Math.exp(-dt * 2.5));
    // le seuil du kick : 0.5 garde le reglage d'avant (25 % au-dessus de la moyenne)
    const ks = S.kickSeuil, ne = this.coupsEcran();
    if ((ne[0] || brut[0] > this.moyBasses * (1.5 - 0.5 * ks) + 0.02 && brut[0] > this.max[0] * (0.75 - 0.3 * ks)) && maintenant - this.dernierCoup > 0.22) {
      const ecart = maintenant - this.dernierCoup;
      if (ecart > 0.25 && ecart < 1.5) {
        this.intervalles.push(ecart);
        if (this.intervalles.length > 24) this.intervalles.shift();
        const tri = this.intervalles.slice().sort((a, b) => a - b);
        let bpm = 60 / tri[Math.floor(tri.length / 2)];
        while (bpm < 80) bpm *= 2;
        while (bpm > 180) bpm /= 2;
        this.bpm = this.intervalles.length >= 6 ? Math.round(bpm) : 0;
      }
      this.dernierCoup = maintenant;
      this.coup = 1; this.coupNeuf = 1;
      manette.vibrer(0.12);
      if (typeof bus !== "undefined") bus.emettre("coup", { bande: "kick", force: clamp(brut[0] / Math.max(0.03, this.max[0]), 0, 1) });
      // le drop : un temps fort tres plein apres un passage calme
      if (S.musiqueDrop && !S.pilote && this.calmeDepuis > 3.5 && this.basses > 0.75 && maintenant - this.dernierDrop > 20) {
        this.dernierDrop = maintenant;
        annoncer("DROP");
        sacAuto = []; suivant();
      }
    }
    this.coup *= Math.exp(-dt * 6);
    this.calmeDepuis = this.niveau < 0.3 ? this.calmeDepuis + dt : 0;
    this.enveloppes(dt, brut, ne);
  },
  // le side chain : 1 sur le kick, puis il se relache (kickRelache, en secondes) ; et la phase
  // des temps, recalee sur chaque kick, pour la vague d'une mesure
  // Jiiji : « le side chain tu peux le mettre sur chaque partie du spectre, kick active, aigu
  // active des choses » : les coups des mediums (la caisse claire) et des aigus (le charley) se
  // detectent comme le kick, chacun avec son seuil et son relachement. env : [kick, caisse, charley]
  enveloppes(dt, brut, ne) {
    this.env = this.env || [0, 0, 0]; this.moyB = this.moyB || [0, 0, 0]; this.dernierB = this.dernierB || [0, 0, 0];
    this.coupsNeufs = [this.coupNeuf, 0, 0];
    if (brut) {
      const t = performance.now() / 1000, seuils = [0, S.caisseSeuil, S.charleySeuil], ecart = [0, 0.11, 0.06];
      for (let i = 1; i < 3; i++) {
        this.moyB[i] = lerp(this.moyB[i], brut[i], 1 - Math.exp(-dt * 4));
        if ((ne && ne[i] || brut[i] > this.moyB[i] * (1.5 - 0.5 * seuils[i]) + 0.015 && brut[i] > this.max[i] * (0.75 - 0.3 * seuils[i])) && t - this.dernierB[i] > ecart[i]) {
          this.dernierB[i] = t; this.coupsNeufs[i] = 1;
          if (typeof bus !== "undefined") bus.emettre("coup", { bande: i === 1 ? "caisse" : "charley", force: clamp(brut[i] / Math.max(0.03, this.max[i]), 0, 1) });
        }
      }
    }
    const rel = [S.kickRelache, S.caisseRelache, S.charleyRelache];
    for (let i = 0; i < 3; i++) this.env[i] = this.coupsNeufs[i] ? 1 : this.env[i] * Math.exp(-dt / Math.max(0.02, rel[i]));
    this.sc = this.env[0];
    this.phase = (this.phase || 0) + dt * (this.bpm || 120) / 60;
    if (this.coupNeuf) this.phase = Math.round(this.phase);
  },
  // la hauteur du spectre en x (0 : les basses, 1 : les aigus, sur une echelle de notes)
  spectre(x) {
    if (!this.actif || !this.donnees) return 0;
    const hz = this.ctx.sampleRate / this.analyse.fftSize, d = this.donnees, n = d.length - 1;
    const i = clamp(Math.round(40 * Math.pow(8000 / 40, clamp(x, 0, 1)) / hz), 1, n - 1);
    // l'analyse lit maintenant jusqu'a -12 dB au lieu de -30 : on remet l'echelle d'avant (88 dB de
    // course au lieu de 70), pour que les scenes dessinent pareil (sauf qu'elles ne plafonnent plus)
    const v = Math.min(1, (d[i - 1] + d[i] * 2 + d[i + 1]) / 4 / 255 * 88 / 70);
    return clamp(Math.pow(v, 1.6) * 1.5 * S.musiqueSensibilite, 0, 1.5);
  },
  // l'onde elle-meme en x, de -1 a 1 environ
  onde(x) {
    if (!this.actif || !this.forme) return 0;
    const i = this.declenche + Math.floor(clamp(x, 0, 1) * ((this.forme.length >> 1) - 1));
    return clamp((this.forme[i] - 128) / 128 / this.picOnde, -1.2, 1.2);
  },
};

async function listerEntrees() {
  const sel = document.getElementById("m-entree");
  if (!sel || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
  try {
    const liste = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === "audioinput");
    sel.replaceChildren();
    const def = document.createElement("option"); def.value = ""; def.textContent = "entrée par défaut de Windows"; sel.appendChild(def);
    liste.forEach((d, i) => {
      if (d.deviceId === "default" || d.deviceId === "communications") return;
      const op = document.createElement("option"); op.value = d.deviceId; op.textContent = d.label || "entrée " + (i + 1); sel.appendChild(op);
    });
    sel.value = S.musiqueEntree;
    if (sel.value !== S.musiqueEntree) sel.value = "";
  } catch (e) { /* pas de liste : tant pis */ }
}

function majMusiqueUI() {
  const etat = document.getElementById("m-etat"), bouton = document.getElementById("m-brancher");
  if (!etat) return;
  let couleur, texte;
  const src = S.musiqueSource, pc = src === "pc" || src === "pcEcran";
  const ecoutent = { pc: "le son du PC.", micro: "l'entrée son.", ecran: "l'écran lui-même : chaque note fait bouger l'image.",
    melange: "l'entrée son et l'écran lui-même.", pcEcran: "le son du PC et l'écran lui-même" + (musique.sansSoi ? " (Chrome retire cette page du son du PC)." : ".") };
  if (musique.branchement) { couleur = "orange"; texte = pc ? "Choisis « Écran entier » et coche « Partager aussi l'audio du système »…" : "Chrome demande la permission d'écouter…"; }
  else if (musique.actif) { couleur = "vert"; texte = "Les mots écoutent " + (ecoutent[src] || "l'entrée son."); }
  else if (musique.erreur) { couleur = "rouge"; texte = "Pas de son : " + musique.erreur + "."; }
  else { couleur = ""; texte = "Débranché. Clique sur « Écouter » (ou touche M)."; }
  etat.innerHTML = '<span class="pastille ' + couleur + '"></span>';
  etat.appendChild(document.createTextNode(texte));
  if (bouton) bouton.textContent = musique.actif ? "Ne plus écouter" : "Écouter";
}

function basculerMusique() {
  if (musique.actif || musique.branchement) { musique.debrancher(); changer("musique", false); annoncer("MUSIQUE", "débranchée"); }
  else { changer("musique", true); musique.brancher().then(() => annoncer("MUSIQUE", musique.actif ? "les mots écoutent" : "pas de son")); }
}

// le petit vumetre de l'onglet Musique : trois barres, la lampe des temps forts, le tempo
function dessinerVumetre() {
  const c = document.getElementById("m-vu");
  if (!c || panneau.hidden || c.offsetParent === null) return;
  const g = c.getContext("2d"), w = c.width, h = c.height;
  g.fillStyle = "#000"; g.fillRect(0, 0, w, h);
  const barres = [["BASSES", musique.basses, "#ff4060"], ["MÉDIUMS", musique.mediums, "#ffd040"], ["AIGUS", musique.aigus, "#40d0ff"]];
  g.font = "9px Consolas, monospace"; g.textBaseline = "middle";
  barres.forEach(([nom, v, coul], i) => {
    const y = 6 + i * 15;
    g.fillStyle = "#555"; g.fillText(nom, 4, y + 5);
    g.fillStyle = "#222"; g.fillRect(58, y, w - 150, 10);
    g.fillStyle = coul; g.fillRect(58, y, (w - 150) * clamp(v / 1.2, 0, 1), 10);
  });
  g.fillStyle = musique.coup > 0.3 ? "#fff" : "#333";
  g.beginPath(); g.arc(w - 72, h / 2, 9, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#aaa"; g.font = "bold 11px Consolas, monospace"; g.textAlign = "right";
  g.fillText(musique.bpm ? musique.bpm + " BPM" : "", w - 4, h / 2);
  if (S.pilote) {
    g.font = "9px Consolas, monospace"; g.fillStyle = "#8c8";
    g.fillText("PILOTE · morceau " + pilote.morceau + " · " + pilote.etat + " · " + (pilote.temps - pilote.phrase) + "/" + S.piloteRythme, w - 4, h - 4);
  }
  g.textAlign = "left";
}


// les sources de la boucle interne entrent dans le choix « Écouter » de l'onglet Musique (2026-10-18)
(function ajouterSources() {
  const onglet = SCHEMA.find(o => o.onglet === "Musique");
  for (const g of (onglet && onglet.groupes) || []) for (const it of g.items || []) if (it.cle === "musiqueSource") {
    for (const op of [["ecran", "L'écran s'écoute lui-même (ses notes font bouger l'image)"],
      ["melange", "Le micro ou une entrée son, plus l'écran lui-même"],
      ["pcEcran", "Le son du PC, plus l'écran lui-même (partage d'écran)"]]) if (!it.options.some(x => x[0] === op[0])) it.options.push(op);
  }
})();

if (typeof bus !== "undefined") bus.ecouter("note", d => {
  if (d && musique.actif && musique.avecEcran && d.vel > 0.25 && musique.notesEcran.length < 64) musique.notesEcran.push({ t: d.t, f: d.f });
});
