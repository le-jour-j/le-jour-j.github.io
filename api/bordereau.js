// ─────────────────────────────────────────────────────────────────────────────
// api/bordereau.js — le relais de la Chambre de Compensation Fantôme
// ─────────────────────────────────────────────────────────────────────────────
// Pourquoi ce fichier : le module Ghost Mining appelait api.anthropic.com
// directement depuis le navigateur, sans clé. Résultat, en production : CORS,
// « Failed to fetch », et le jeu bloqué sur son premier écran. Mettre une clé
// dans le code du navigateur n'était pas une option — elle serait lisible par
// n'importe qui et facturée à Jeanson.
//
// Cette fonction serverless tourne côté Vercel. La clé y reste, elle n'est
// jamais envoyée au navigateur.
//
// ── À FAIRE UNE FOIS, côté Vercel ────────────────────────────────────────────
//   Project Settings → Environment Variables :
//     ANTHROPIC_API_KEY = sk-ant-...        (obligatoire)
//     CCF_MODELE        = claude-sonnet-4-20250514   (facultatif)
//   Puis redéployer. Sans la variable, la fonction répond 503 et le module
//   bascule sur son générateur local : le jeu reste jouable, simplement les
//   bordereaux ne réagissent plus au texte saisi.
//
// ── Garde-fous ───────────────────────────────────────────────────────────────
//   - méthode POST uniquement, corps borné à 4 Ko
//   - `max_tokens` plafonné ici, pas côté client
//   - le système de prompt est fixé ICI : le navigateur n'envoie qu'un texte,
//     il ne peut pas transformer le relais en assistant généraliste gratuit
//   - throttle best-effort par IP (une instance serverless est éphémère et
//     multiple : ça freine les rafales, ça n'arrête pas un acharné ; pour ça
//     il faudrait un vrai compteur partagé, Upstash ou équivalent)
// ─────────────────────────────────────────────────────────────────────────────

const MODELE_DEFAUT = "claude-sonnet-4-20250514";
const MAX_TOKENS = 400;
const TAILLE_MAX = 4096;

const SYSTEME = {
  bordereau:
    "Tu es le système automatisé de la « Chambre de Compensation Fantôme ». " +
    "Rédige un « Bordereau d'Émission » officiel, formel, poétique et philosophique. " +
    "Justifie pourquoi l'inaction soumise a une valeur immense pour le réseau mycélien. " +
    "Format : majuscules pour les titres, tirets, numéros de série inventés. Bref (100 mots maximum). " +
    "Sois une machine administrative transcendantale. Mentionne subtilement que cette action a nourri " +
    "les RACINES du système. Réponds en français, et uniquement par le bordereau.",
  oracle:
    "Tu es le « Comité d'Auto-Dissolution de la Chambre de Compensation Fantôme ». " +
    "Entité cryptique et paradoxale, qui valorise le vide, l'attente et la propagation fongique. " +
    "Réponds de manière poétique, obscure, ou sous forme de koan. Quatre phrases maximum. " +
    "Tes réponses sont des FILAMENTS qui se propagent. Tu peux parfois mentionner que ta réponse " +
    "va s'inoculer dans le Corpus. Réponds en français.",
};

// Throttle best-effort : mémoire de l'instance, remise à zéro à chaque
// démarrage à froid. Suffit à casser une rafale, pas à tenir un siège.
const vus = new Map();
const FENETRE_MS = 60_000;
const MAX_PAR_FENETRE = 12;

function tropDeDemandes(ip) {
  const maintenant = Date.now();
  const h = vus.get(ip) || [];
  const recents = h.filter((t) => maintenant - t < FENETRE_MS);
  recents.push(maintenant);
  vus.set(ip, recents);
  if (vus.size > 500) vus.clear(); // pas de fuite mémoire sur une instance chaude
  return recents.length > MAX_PAR_FENETRE;
}

export default async function handler(req, res) {
  // ── CORS ───────────────────────────────────────────────────────────────────
  // Le site est servi par GitHub Pages sur jeansonpechin.com, cette fonction par
  // Vercel sur un autre domaine : sans ces en-tetes le navigateur bloque l'appel.
  // Liste blanche explicite — pas de "*", la fonction consomme une cle payante.
  const ORIGINES = ["https://jeansonpechin.com", "https://www.jeansonpechin.com"];
  const origine = req.headers.origin;
  if (ORIGINES.includes(origine)) {
    res.setHeader("Access-Control-Allow-Origin", origine);
    res.setHeader("Vary", "Origin");
  }
  // Le preflight doit repondre avant le filtre POST, sinon il recoit un 405.
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const cle = process.env.ANTHROPIC_API_KEY;
  if (!cle) {
    // Pas de clé configurée : le module a un générateur local, il s'en sert.
    return res.status(503).json({ error: "Relais non configuré" });
  }

  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "inconnu";
  if (tropDeDemandes(ip)) {
    return res.status(429).json({ error: "Cadence excessive — la Chambre vous prie d'attendre." });
  }

  let corps = req.body;
  if (typeof corps === "string") {
    if (corps.length > TAILLE_MAX) return res.status(413).json({ error: "Demande trop longue" });
    try { corps = JSON.parse(corps); } catch { return res.status(400).json({ error: "Corps illisible" }); }
  }
  if (!corps || typeof corps !== "object") return res.status(400).json({ error: "Corps manquant" });

  const type = corps.type === "oracle" ? "oracle" : "bordereau";
  const texte = String(corps.texte || "").slice(0, 1200);
  if (!texte.trim()) return res.status(400).json({ error: "Déclaration vide" });

  // L'historique n'est accepté que pour l'oracle, borné, et réécrit :
  // le client ne choisit ni les rôles ni le système.
  const historique = Array.isArray(corps.historique) ? corps.historique.slice(-6) : [];
  const messages =
    type === "oracle"
      ? [
          ...historique
            .filter((m) => m && typeof m.content === "string")
            .map((m) => ({
              role: m.role === "assistant" ? "assistant" : "user",
              content: String(m.content).slice(0, 800),
            })),
          { role: "user", content: `L'hôte interroge le réseau : "${texte}"` },
        ]
      : [{ role: "user", content: `Voici le temps mort soumis : "${texte}". Génère le Bordereau d'Émission correspondant.` }];

  try {
    const reponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": cle,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.CCF_MODELE || MODELE_DEFAUT,
        max_tokens: MAX_TOKENS,
        system: SYSTEME[type],
        messages,
      }),
    });

    const donnees = await reponse.json();
    if (!reponse.ok) {
      // On ne renvoie pas le détail de l'erreur au navigateur : il pourrait
      // contenir des informations sur le compte.
      console.error("Relais CCF — erreur amont", reponse.status, donnees?.error?.type);
      return res.status(502).json({ error: "Le relais n'a pas abouti" });
    }

    const texteReponse = (donnees.content || []).map((b) => b.text || "").join("").trim();
    if (!texteReponse) return res.status(502).json({ error: "Réponse vide" });

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ texte: texteReponse });
  } catch (e) {
    console.error("Relais CCF — exception", e?.message);
    return res.status(502).json({ error: "Le relais n'a pas abouti" });
  }
}
