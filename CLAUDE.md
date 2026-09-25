# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Ce qu'est ce dépôt

Dépôt de **déploiement** du site `jeansonpechin.com`, servi par GitHub Pages (`CNAME`
à la racine). Ce n'est pas un projet unique : c'est l'assemblage de trois choses de
natures différentes, et la distinction commande tout le reste.

### 1. La racine n'a pas de sources ici

`index.html`, `404.html`, `assets/`, `modules/`, `drive/`, `lamusique/`, `images/`,
les PDF et le `site.webmanifest` sont le **`dist/` d'un autre dépôt** :
`C:\Users\Pole-Fromage\Desktop\Minmaxing\chambre-compensation` (React 19 + Tailwind +
Vite, avec sa propre suite QA dans `qa/`). Ils sont copiés ici build par build.

**Ne jamais éditer ces fichiers à la main** : la copie suivante les écrase sans
prévenir. Toute modification du portfolio, des 12 applis de `modules/` ou du compteur
du site se fait dans `chambre-compensation`, puis se reporte ici par un nouveau build.
C'est précisément le piège que `scripts/inject-bf-redirect.cjs` contourne (voir plus bas).

`appels.html` et `poiasie/` (mis à jour par des commits automatiques
« poiasie: nouveau poeme ») sont statiques et autonomes, hors de ce flux.

Les dossiers `registre/`, `projet/`, `module/`, `credit/`, `downloads/`,
`message/`, `pov/`, `simulateur/`, `terminal-sonore/`, `vente-flash/`, ainsi que
`robots.txt` et `sitemap.xml`, sont **prérendus** : ils sortent eux aussi du build
de `chambre-compensation` (`npm run build` y enchaîne `vite build` puis
`scripts/prerender.mjs`). Voir « Référencement » plus bas.

### 2. Les deux applications dont les sources vivent ici

| | `banque-fantome/` | `tour-de-phrance/` |
|---|---|---|
| Stack | React 18 + Vite + `react-router-dom` + PWA | React 18 + Vite, routage maison |
| `base` Vite | `/banque-fantome/` (absolu) | `./` (relatif) |
| Supabase | **projet A**, clés par variables d'env de build | **projet B**, clés en dur dans `src/config/supabaseConfig.js` |
| Dégradation sans Supabase | non | oui, mode local `localStorage` |

Les deux projets Supabase sont **distincts** : ne jamais appliquer un SQL de l'un sur
l'autre.

## Commandes

```bash
# Banque Fantôme (appelle vite par son chemin node, pas par le bin npm)
cd banque-fantome && npm install && npm run dev      # nécessite un .env local
cd banque-fantome && npm run build                   # -> dist/

# Tour de Phrance
cd tour-de-phrance && npm install && npm run dev
cd tour-de-phrance && npm run build                  # -> dist/
node outils/verifier.mjs                             # audit d'installation, ne modifie rien, exit 1 si ça cloche
```

### Tests (Tour de Phrance uniquement, Playwright, aucun runner)

Chaque test est un script `node` autonome, lancé contre un `vite preview` déjà
démarré. Il n'y a pas de `npm test`.

```bash
npm i -D playwright && npx playwright install chromium

# Mode sans compte : build normal, port 4173
npm run build && npx vite preview --port 4173 &
node tests/e2e-local.mjs          # un seul test = un seul fichier

# Mode connecté : build « fake », port 4174 — jamais la vraie base
npx vite build -c vite.fake.config.js
npx vite preview -c vite.fake.config.js --port 4174 &
node tests/e2e-compte.mjs
```

`vite.fake.config.js` substitue `test-fake/fakeSupabase.js` à `src/lib/supabaseClient.js`
par un plugin `resolveId`, et sort dans `dist-fake/`. Le faux client reproduit les
règles d'accès et la vue `catalogue`. Les bugs du mode connecté (double comptage des
dépôts, doublon de livre au double montage React, perte de la progression locale à la
connexion) ne sont visibles que par ce chemin — cf. `tour-de-phrance/tests/README.md`.

## Déploiement

`.github/workflows/deploy.yml`, sur push `main`. Séquence :

1. `npm install && npm run build` dans `tour-de-phrance/`, puis dans `banque-fantome/`
   (avec `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` injectés depuis les secrets).
2. `rsync` de la racine vers `public-build/`, en excluant `.git`, `.github`,
   `public-build`, `tour-de-phrance`, `banque-fantome`, `scripts`.
3. Les deux `dist/` sont recopiés dans `public-build/tour-de-phrance/` et
   `public-build/banque-fantome/`.
4. `node scripts/inject-bf-redirect.cjs public-build/404.html`.
5. `upload-pages-artifact` + `deploy-pages`.

Aucun `dist/` n'est versionné : tout se reconstruit dans la CI.

### Le hack SPA de Banque Fantôme

GitHub Pages n'a pas de rewrite serveur. Un deep-link `/banque-fantome/market` tombe
sur le `404.html` **racine**, qui doit contenir un script stockant la route dans
`sessionStorage['bf-redirect']` avant de rediriger vers `/banque-fantome/` ;
`banque-fantome/src/main.jsx` la restaure au chargement via `history.replaceState`.

Ce script ne peut pas vivre dans le `404.html` source : celui-ci est resynchronisé sur
`index.html` à chaque build de `chambre-compensation`. D'où l'injection à l'étape 4,
sur le fichier de **sortie**, idempotente (marqueur `<!-- bf-redirect -->`).

À savoir : `banque-fantome/public/404.html` est un vestige mort (Pages ne sert que le
404 racine) et utilise d'ailleurs la clé `redirect`, pas `bf-redirect`.

### Réveil des bases

`keep-supabase-awake.yml` et `keep-tour-de-phrance-awake.yml` pinguent chacun leur
projet Supabase deux fois par semaine (tier gratuit mis en pause sinon). Quatre
secrets : `BANQUE_FANTOME_SUPABASE_{URL,ANON_KEY}`,
`TOUR_DE_PHRANCE_SUPABASE_{URL,ANON_KEY}`.

## Banque Fantôme — modèle de données

Deux couches SQL, à jouer dans cet ordre dans le SQL Editor Supabase :

- `supabase_setup.sql` — socle : `profiles`, `objets`, RLS, bucket Storage `objets`.
- `supabase_hotel_des_ventes.sql` — la refonte « hôtel des ventes » : colonnes
  d'enchère sur `objets`, colonnes `solde`/`role` sur `profiles`, tables `banque`,
  `billets_emis`, `encheres`, `transactions` (grand livre), et les RPC
  `emettre_billet`, `placer_enchere`, `acheter_immediat`, `retirer_vente`,
  `remettre_en_vente`, `resoudre_ventes_expirees`, `stats_banque`, `journal_banque`,
  `cours_devises`.

Le front appelle ces RPC directement (`supabase.rpc('…')`). Les deux markdown
`CE-QUI-CHANGE-HOTEL-DES-VENTES.md` et `INSTALLATION-LOCALE-*.md` documentent l'état
de cette migration et les angles morts connus (notamment : si les colonnes neuves
manquent, `refreshProfile` échoue silencieusement et `profile` reste `null` partout,
sans avertissement). `supabase/functions/reset-password/index.ts` est une Edge Function.

Les objets déposés avant la migration n'ont pas de `mise_depart` : ils restent en troc
par message, le code doit continuer à gérer ce cas.

## Tour de Phrance — points sensibles

- `src/data/locations.js` est la base des lieux. **Les `id` ne changent jamais** : ils
  portent l'historique des passages et des commentaires de la tournée n°1. Un lieu hors
  sujet se marque `retired`, jamais se supprime.
- `contenu/prive/` est gitignoré : il contient les notes de terrain, qui nomment des
  librairies. `scripts/retirer-notes-terrain.mjs` existe pour retirer les `field_note`
  du fichier publié — vérifier la décision en cours avant de le lancer.
- Migrations à jouer après `supabase/schema.sql` : `migration_v11_livres_passages.sql`
  (tables `books`, `checkins`, `profiles.is_admin`, conversion des anciennes coches),
  puis `migration_v13_catalogue.sql`.
- Sans compte : tout est dans `localStorage` (`tourdePhrance_v11`), fusionné dans le
  compte à la première connexion. Les `CHANGELOG_v*.txt` racontent chaque palier.
- La refonte v13 a été livrée (`1690cef`) puis **revertée** (`3412580`) : l'état courant
  est la version « kit Gaétan v11–v13 » d'avant cette refonte. Ne pas la réappliquer
  sans demander.

## Référencement

Le site est une SPA servie par GitHub Pages, qui n'a aucune réécriture d'URL. Sans
précaution, `/registre` ne correspond à aucun fichier : Pages répond `404.html` —
une copie d'`index.html` — donc la page s'affiche normalement pour un humain, mais
le serveur annonce **HTTP 404** et aucun moteur n'indexe. Le `rewrite` de
`vercel.json` masquait ce défaut du temps de Vercel.

Chaque application règle ça pour son propre périmètre, avec la même structure :
une table `src/lib/seo.js` qui sert à la fois le runtime et un
`scripts/prerender.mjs` branché sur `npm run build`. Un `robots.txt` unique, à
la racine, déclare les deux sitemaps.

### Site racine — dans `chambre-compensation`

- `src/lib/seo.js` — table unique des métadonnées (title, description, priorité)
  pour les 45 URL, plus `applySeo()` qui pose title / description / canonical /
  Open Graph à chaque navigation. `slugify` et `getBordereauSlug` sont ici et non
  dans `App.jsx` : les slugs de projet sont aussi des URL du sitemap, deux
  définitions finiraient par diverger et produire des liens morts.
- `scripts/prerender.mjs` — après `vite build`, visite chaque URL avec Playwright
  et écrit le HTML rendu dans `dist/<route>/index.html`, puis génère
  `sitemap.xml`. Le fichier existe donc, Pages répond 200, et le robot a du texte
  à lire. Sort en code 1 si une URL échoue, pour qu'un build ne l'enterre pas.
- `scripts/verifier-prerendu.mjs` — recharge les 45 pages et vérifie statut,
  title, canonical, description et remontée de React. À lancer après toute
  modification du routeur.
- `public/robots.txt` — renvoie vers le sitemap, exclut `/admin`.

Les canonicals portent une barre finale (`/registre/`) parce que c'est la forme
que Pages sert réellement : `/registre` y est redirigé en 301.

`NOMS_RESERVES` dans `prerender.mjs` empêche une route du site de produire un
dossier qui écraserait `banque-fantome/`, `tour-de-phrance/` ou `poiasie/` dans le
dépôt de déploiement. Ne pas l'alléger.

### Banque Fantôme — dans `banque-fantome/`

Même principe, mais `scripts/prerender.mjs` y est du **Node pur, sans
navigateur** : ce build-là tourne dans GitHub Actions, et y installer un
Chromium coûterait une dépendance et une étape pour un gain faible. Le script
part de `dist/index.html`, y injecte les métadonnées de la route et le texte
fixe déclaré dans `src/lib/seo.js` (champ `contenu`), et écrit
`dist/<route>/index.html`. React remplace ce contenu dès qu'il monte.

Choix délibéré : **les données Supabase ne sont pas figées dans les fichiers
prérendus.** Ce sont des dépôts faits par les comptes, ils changent à chaque
vente, et ils n'ont rien à faire dans l'historique git. Les pages portent donc
le texte de présentation, pas l'inventaire du moment.

`/deposer`, `/connexion`, `/compte` et `/messages` sont prérendus quand même —
pour qu'aucune URL de l'appli ne réponde 404 — mais marqués `noindex` et tenus
hors du sitemap.

### Le lien mort

`CreditOutil.jsx` pointait vers `banque-fantome.jeansonpechin.com`, un
sous-domaine qui n'a jamais existé (le DNS ne le résout pas). C'était le seul
lien du site vers l'appli, et la page qui le portait (`/credit`) répondait
elle-même 404 : aucun moteur n'avait de chemin pour découvrir Banque Fantôme.
L'appli est servie depuis un sous-dossier, jamais un sous-domaine.

## Vercel

Il n'y a plus de `vercel.json` ni de `api/` dans ce dépôt (commits `ed7f7f3`, `eae94c7`).
Le projet Vercel lié est un vestige cassé destiné à être supprimé ; GitHub Pages sert
tout. Le relais serverless `api/bordereau.js` de Ghost Mining vit dans
`chambre-compensation`, pas ici.
