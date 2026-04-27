# Tour de Phrance

Version autonome nettoyée.

## Lancer en local

```bash
npm install
npm run dev
```

## Contenu

- `src/RoadtripApp.jsx` : interface carte / tronçons / progression.
- `src/data/locations.js` : données des lieux.
- `src/data/itineraries.js` : données des tronçons.
- `src/pages/About.jsx` : présentation du projet.
- `src/pages/Guide.jsx` : documentation PDF par région.
- `public/docs/` : PDF de recherche.

## Notes

- Les cases cochées sont stockées en local dans le navigateur avec `localStorage`.
- Les anciennes coches `tourdePhrance_v2_visited` sont relues automatiquement si elles existent.
- Les fonctions liées à Banque Fantôme ont été retirées : solde, transactions, packs, inventaire.


## Comptes et commentaires

La version v8 ajoute une couche Supabase optionnelle.

Sans Supabase :
- l'application fonctionne en mode local ;
- les cases cochées restent dans le navigateur ;
- les commentaires sont enregistrés localement.

Avec Supabase :
- l'onglet Compte permet une connexion par lien email ;
- les cases cochées sont synchronisées dans `visited_places` ;
- les commentaires publics sont stockés dans `comments`.

Installation :

```bash
npm install
cp .env.example .env.local
npm run dev
```

Dans Supabase :
1. créer un projet ;
2. ouvrir SQL Editor ;
3. exécuter `supabase/schema.sql` ;
4. récupérer l'URL du projet et la clé anon public ;
5. les ajouter dans `.env.local`.

Variables :

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Pour Google Maps :

```bash
VITE_GOOGLE_MAPS_API_KEY=
```


## Authentification v9

Cette version utilise une connexion email + mot de passe.

Dans Supabase :
- Authentication → Providers → Email : activé
- Authentication → Sign In / Providers / Email selon l'interface Supabase
- désactiver la confirmation email pour les tests si tu veux une connexion immédiate

Le magic link n'est plus utilisé.


## v10 — configuration Supabase sans .env obligatoire

Cette version peut fonctionner avec les clés Supabase directement dans :

```txt
src/config/supabaseConfig.js
```

À remplacer :

```js
export const SUPABASE_URL = "https://xxxxx.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOi...";
```

La clé `anon public` peut être présente côté navigateur. Ne jamais mettre la clé `service_role`.

Le fichier `.env.local` reste compatible en secours, mais il n'est plus obligatoire.

## Ping Supabase

Un workflow est inclus :

```txt
.github/workflows/keep-supabase-awake.yml
```

Il utilise deux secrets GitHub à créer dans le repo :

```txt
TOUR_DE_PHRANCE_SUPABASE_URL
TOUR_DE_PHRANCE_SUPABASE_ANON_KEY
```

Chemin GitHub :

```txt
Settings → Secrets and variables → Actions → New repository secret
```
