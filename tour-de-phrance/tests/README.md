# Tests de bout en bout

Playwright doit être installé :

```bash
npm i -D playwright && npx playwright install chromium
```

## Mode sans compte

```bash
npm run build
npx vite preview --port 4173 &
node tests/e2e-local.mjs        # livres, passages, historique, persistance
node tests/e2e-contenu.mjs      # métadonnées de lieu, filtre « cibles »
node tests/e2e-catalogue.mjs    # catalogue, « en vente ici », livre discret
```

## Mode connecté

Contre un faux client Supabase en mémoire (`test-fake/fakeSupabase.js`), qui
reproduit les règles d'accès et la vue `catalogue`. Aucune donnée réelle n'est
touchée.

```bash
npx vite build -c vite.fake.config.js
npx vite preview -c vite.fake.config.js --port 4174 &
node tests/e2e-compte.mjs            # fusion du local, déconnexion, changement d'utilisateur
node tests/e2e-catalogue-compte.mjs  # livre d'un autre compte, livre discret, reprise de dépôt
node tests/e2e-pseudo.mjs            # changement de pseudo
```

## Ce que ces tests ont attrapé

Le mode connecté ne se teste pas à la main sans toucher aux vraies données ;
c'est lui qui a révélé le double comptage des dépôts au catalogue, l'absence de
rafraîchissement, le doublon de livre par défaut au double montage React, et la
perte de la progression locale à la connexion. Le mode local seul ne montrait
aucun de ces défauts.
