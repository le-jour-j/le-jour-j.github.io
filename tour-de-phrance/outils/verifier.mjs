// Vérifie une installation du kit Tour de Phrance.
// À lancer depuis le dossier tour-de-phrance/ :  node outils/verifier.mjs
// Ne modifie rien. Code de sortie 1 si quelque chose cloche.

import fs from "fs";
import path from "path";

let erreurs = 0;
let alertes = 0;
const ok = (m) => console.log("  ok    " + m);
const ko = (m) => { erreurs++; console.log("  ÉCHEC " + m); };
const warn = (m) => { alertes++; console.log("  ~     " + m); };

function titre(t) { console.log("\n" + t); }

// ── 1. Fichiers attendus ─────────────────────────────────────────────────────
titre("Fichiers");
const attendus = [
  "src/App.jsx", "src/RoadtripApp.jsx", "src/style.css",
  "src/pages/Catalogue.jsx", "src/pages/About.jsx", "src/pages/Guide.jsx",
  "src/components/BooksPanel.jsx", "src/components/StatusPicker.jsx",
  "src/components/AuthPanel.jsx", "src/components/CommentBox.jsx",
  "src/hooks/useTour.js", "src/hooks/useCatalogue.js", "src/hooks/useAuth.js",
  "src/lib/statuses.js", "src/lib/placeMeta.js", "src/lib/supabaseClient.js",
  "src/data/locations.js", "src/data/itineraries.js", "src/data/documents.js",
  "src/config/supabaseConfig.js", "src/config/googleMapsConfig.js",
  "package.json", "vite.config.js", "index.html",
];
for (const f of attendus) fs.existsSync(f) ? ok(f) : ko(f + " manquant");

const aSupprimer = [
  "src/hooks/useVisited.js", "src/hooks/useVisited_old.js",
  "src/RoadtripApp_old_1.jsx", "src/components/AuthPanel_old.jsx",
  ".github", "CNAME",
];
for (const f of aSupprimer) {
  if (fs.existsSync(f)) warn(f + " est encore là (devait être supprimé à l'étape 2)");
}

// ── 2. Dépendances figées ────────────────────────────────────────────────────
titre("Dépendances");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const toutes = { ...pkg.dependencies, ...pkg.devDependencies };
for (const [nom, v] of Object.entries(toutes)) {
  if (v === "latest" || v === "*") ko(`${nom} = "${v}" : une majeure peut casser le build de prod sans prévenir`);
}
if (!Object.values(toutes).some((v) => v === "latest" || v === "*")) ok("aucune version flottante");

// ── 3. Cohérence des données ─────────────────────────────────────────────────
titre("Données");
const { RAW_LOCATIONS } = await import(path.resolve("src/data/locations.js"));
const { RAW_ITINERARIES } = await import(path.resolve("src/data/itineraries.js"));
const parId = Object.fromEntries(RAW_LOCATIONS.map((l) => [l.id, l]));

console.log(`  ${RAW_LOCATIONS.length} lieux, ${RAW_ITINERARIES.length} tronçons`);

const ids = RAW_LOCATIONS.map((l) => l.id);
const doublons = ids.filter((x, i) => ids.indexOf(x) !== i);
doublons.length ? ko("identifiants en double : " + doublons.join(", ")) : ok("identifiants uniques");

const introuvables = [];
for (const t of RAW_ITINERARIES) {
  for (const s of t.stops) if (s !== "start-0" && !parId[s]) introuvables.push(`${t.id} → ${s}`);
}
introuvables.length ? ko("étapes pointant vers un lieu inexistant : " + introuvables.join(", ")) : ok("toutes les étapes pointent vers un lieu existant");

const idsTroncons = RAW_ITINERARIES.map((t) => t.id);
new Set(idsTroncons).size === idsTroncons.length ? ok("identifiants de tronçons uniques") : ko("identifiants de tronçons en double");

const ruptures = [];
for (let i = 1; i < RAW_ITINERARIES.length; i++) {
  const prec = RAW_ITINERARIES[i - 1].stops.at(-1);
  const debut = RAW_ITINERARIES[i].stops[0];
  if (prec !== debut) ruptures.push(`${RAW_ITINERARIES[i - 1].id} finit sur ${prec}, ${RAW_ITINERARIES[i].id} commence sur ${debut}`);
}
ruptures.length ? ko("chaîne des tronçons rompue :\n        " + ruptures.join("\n        ")) : ok("chaîne des tronçons continue");

const dansTroncon = new Set(RAW_ITINERARIES.flatMap((t) => t.stops));
const retiresDansTroncon = RAW_LOCATIONS.filter((l) => l.retired && dansTroncon.has(l.id));
retiresDansTroncon.length
  ? ko("lieux écartés encore présents dans un tronçon : " + retiresDansTroncon.map((l) => l.id).join(", "))
  : ok("aucun lieu écarté dans les tronçons");

const orphelins = RAW_LOCATIONS.filter((l) => !l.retired && !dansTroncon.has(l.id));
if (orphelins.length) warn(`${orphelins.length} lieux hors tronçon (normal pour les lieux excentrés) : ${orphelins.map((l) => l.id).join(", ")}`);

const sansAdresse = RAW_LOCATIONS.filter((l) => !l.retired && (!l.address || l.address === "..."));
if (sansAdresse.length) warn(`${sansAdresse.length} lieux sans adresse : ${sansAdresse.map((l) => l.id).join(", ")}`);

const cibles = RAW_LOCATIONS.filter((l) => l.fit === "oui").length;
const nonVerifies = RAW_LOCATIONS.filter((l) => l.status === "unverified").length;
console.log(`  ${cibles} cibles, ${RAW_LOCATIONS.filter((l) => l.fit === "possible").length} à tenter, ${RAW_LOCATIONS.filter((l) => l.retired).length} écartés, ${nonVerifies} non vérifiés`);

// ── 4. Rien de privé dans le code livré ──────────────────────────────────────
titre("Confidentialité");
const brut = fs.readFileSync("src/data/locations.js", "utf8");
const interdits = ["field_note", "pas sympas", "Pas sympas", "prennent pour des oufs", "virer gibert", "la flemme"];
const fuites = interdits.filter((s) => brut.includes(s));
fuites.length
  ? ko("appréciations de terrain présentes dans locations.js : " + fuites.join(", "))
  : ok("aucune note de terrain dans la base publiée");

if (fs.existsSync(".gitignore")) {
  fs.readFileSync(".gitignore", "utf8").includes("contenu/prive")
    ? ok(".gitignore protège contenu/prive/")
    : warn(".gitignore ne mentionne pas contenu/prive/ : les notes privées risquent d'être commitées");
} else warn("pas de .gitignore");

// ── 5. Configuration ─────────────────────────────────────────────────────────
titre("Configuration");
const cfg = fs.readFileSync("src/config/supabaseConfig.js", "utf8");
if (cfg.includes("REMPLACE_PAR") || /SUPABASE_URL\s*=\s*["']\s*["']/.test(cfg)) {
  ko("supabaseConfig.js ne contient pas d'URL : l'appli tournera en mode local en production");
} else ok("supabaseConfig.js renseigné");
// On décode les JWT présents plutôt que de chercher le mot « service_role »,
// qui apparaît légitimement dans le commentaire d'avertissement du fichier.
for (const jeton of cfg.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) || []) {
  try {
    const charge = JSON.parse(Buffer.from(jeton.split(".")[1], "base64url").toString());
    if (charge.role === "service_role") ko("supabaseConfig.js contient une clé service_role — à retirer immédiatement, elle donne tous les droits");
    else if (charge.role === "anon") ok("la clé publiée est bien une clé anon");
    else warn(`clé de rôle « ${charge.role} » dans supabaseConfig.js, à vérifier`);
  } catch {
    warn("un jeton de supabaseConfig.js n'a pas pu être décodé");
  }
}

const vite = fs.readFileSync("vite.config.js", "utf8");
vite.includes("base: './'") || vite.includes('base: "./"')
  ? ok("vite.config.js garde base: './' (nécessaire pour servir depuis /tour-de-phrance/)")
  : ko("vite.config.js : base doit rester './', sinon les assets cassent en sous-dossier");

// ── Bilan ────────────────────────────────────────────────────────────────────
console.log("\n" + "─".repeat(60));
if (erreurs) {
  console.log(`${erreurs} problème(s) à régler${alertes ? `, ${alertes} point(s) de vigilance` : ""}.`);
  process.exit(1);
}
console.log(alertes ? `Tout est en ordre. ${alertes} point(s) de vigilance ci-dessus, à lire mais sans gravité.` : "Tout est en ordre.");
