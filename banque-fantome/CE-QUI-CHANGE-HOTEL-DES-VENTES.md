# Ce qui change : l'hôtel des ventes, écrit le 18/09/2026 par le dev web

Ce document n'existait pas : Gaétan n'a pas livré de kit ni de mode d'emploi pour cette
mise à jour de Banque Fantôme, contrairement à Tour de Phrance. Sur décision de Jiiji
("va falloir faire sans kit de nouveau"), je l'écris moi-même à partir d'un diff propre
entre la copie de travail de Gaétan (`repo git\le-jour-j.github.io\`, même remote, même
HEAD que le dépôt réel au moment de la comparaison) et le dépôt réel.

**Rien de ce qui suit n'est installé dans le dépôt réel pour l'instant.** Ce fichier et
`supabase_hotel_des_ventes.sql` (copié à côté, non exécuté) sont les deux seuls ajouts de
cette passe. Voir la conclusion en bas pour pourquoi.

## Le principe du changement

Le market passe d'un troc simple (dépôt → échange décidé par message) à un système
d'enchères : chaque compte a un solde de billets, on s'enrichit en "émettant" des billets
(photo d'un billet dessiné + dénomination → crédit immédiat), un dépôt devient une vente
avec mise de départ, durée (1/3/7 jours) et achat immédiat facultatif, on enchérit avec ses
billets, la banque prélève 5 % de commission à la clôture.

## 1. Ce qui est purement visuel (risque faible)

`src/index.css` (+717/-… lignes) : refonte de style pour tous les nouveaux blocs (guichet,
enchères, ticker, menu mobile, footer). Purement CSS, ne s'exécute contre rien, ne casse
rien tant que le JSX qui référence ces classes n'est pas branché.

`banque-fantome/index.html`, `src/main.jsx`, `vite.config.js` : ajout d'une configuration
PWA complète (`vite-plugin-pwa`, nouvelle dépendance npm), manifeste, service worker,
icônes. Les 6 fichiers d'icônes référencés (`favicon-64.png`, `apple-touch-icon-180.png`,
`icon-192/512.png`, `icon-maskable-192/512.png`) existent bien dans le dossier non suivi
`public/icons/` : rien ne manque à l'appel. Risque réel mais différent : c'est une
dépendance de build neuve (jamais installée, jamais buildée par moi dans ce dépôt) et un
service worker qui met le site en cache pour un usage hors-ligne — je ne l'ai pas testé.

## 2. Ce qui est fonctionnel mais ne touche pas la base, ou dégrade proprement si elle ne répond pas (risque moyen)

Vérifié fichier par fichier, pas supposé :

- `App.jsx` : ajoute `ClickEffects` (effet visuel au clic, aucun appel réseau visible),
  `InstallPWA` (bandeau d'installation PWA), un footer, une animation d'entrée de page.
  Aucun appel Supabase.
- `Navbar.jsx` : menu mobile en tiroir, ticker qui affiche le "journal de la banque"
  (`journal_banque`, nouvelle fonction RPC) avec un **repli statique déjà écrit** si l'appel
  échoue (`journal.length ? ... : 'OUVREZ UN COMPTE ◈ ...'`). Affiche aussi le solde à côté
  de "Mon compte" via `{profile && <span>◈ {profile.solde}</span>}` : comme `profile` reste
  `null` tant que la migration n'est pas passée (voir plus bas), cette condition est fausse
  et rien ne s'affiche. Pas de plantage, pas de "◈ undefined".
- `AuthContext.jsx` : ajoute `profile`, `solde`, `estBanquier`, `refreshProfile`.
  **Point précis vérifié** : `refreshProfile` fait
  `select('id, pseudo, solde, role')` — une sélection explicite qui inclut les deux
  colonnes neuves. Si elles n'existent pas encore, PostgREST renvoie une erreur sur TOUTE
  la requête (pas seulement sur les deux colonnes), l'erreur n'est pas lue (`const { data }`,
  pas de `error`), donc `data` vaut `null` et `profile` reste `null` pour tout le monde,
  silencieusement, à chaque connexion. Ce n'est pas un plantage : `solde` vaut alors
  `profile?.solde ?? 0` (0 partout) et `estBanquier` vaut `false` partout. C'est un vrai
  angle mort (aucun message, aucun `console.warn`), mais il n'existait pas avant cette mise
  à jour : `profile` est un concept entièrement neuf, rien ne régresse par rapport à
  aujourd'hui.
- `Compte.jsx`, `GuichetEmission.jsx` (nouveau), `EnchereBloc.jsx` (nouveau) : tous les
  accès à `profile.xxx` que j'ai trouvés sont gardés par `profile &&` ou `profile?.xxx`
  avant lecture. Je n'ai pas relu chaque ligne de ces trois fichiers en entier, seulement
  les points d'accès à `profile`.
- `ObjetModal.jsx` : `{vente && <EnchereBloc .../>}` — `vente` dépend de `objet.mise_depart`,
  qui n'existe sur aucun objet existant (colonne absente). Le bloc enchères ne s'affiche
  donc simplement jamais sur les objets actuels. Pas de plantage.
- `ObjetCard.jsx`, `ImageLightbox.jsx`, `MessageModal.jsx`, `Notif.jsx`,
  `RecoveryCodeReveal.jsx`, `Connexion.jsx`, `Messages.jsx` : diffs lus en diagonale
  (stat + recherche de `profile.`/`solde`/`mise_depart`), pas relus intégralement. Rien
  trouvé qui accède à un champ neuf sans protection, mais je le dis sans garantie absolue.
- `Senrichir.jsx` : remplacé par le nouveau `GuichetEmission`. La fonctionnalité
  "émettre un billet" ne marchera pas tant que la fonction RPC `emettre_billet` n'existe
  pas (migration non passée), mais l'échec est propre : notification d'erreur
  (`messageErreur(e)`), pas de page cassée, la page elle-même s'affiche normalement.
- `Home.jsx` : `supabase.rpc('stats_banque').then(({ data }) => setStats(data || null))` —
  pas de `.catch`, mais le client Supabase ne rejette pas la promesse sur une erreur HTTP,
  il la résout avec `{data: null, error}` : `stats` reste `null`, pas de plantage.
- `Inventaire.jsx` : `supabase.rpc('resoudre_ventes_expirees').then(() => setVersion(...))`
  — ignore même le résultat, ne peut pas planter. Le tri "Valeur" par
  `enchere_courante`/`valeur` fonctionne toujours, ces colonnes seraient juste vides pour
  tous les objets actuels.

**Verdict de cette catégorie : dégrade proprement partout où je l'ai vérifié.**
Je n'ai pas de preuve que ce soit vrai à 100 %, seulement pour les points cités.

## 3. Ce qui touche la base, et où est le vrai danger

### Le fichier SQL (`supabase_hotel_des_ventes.sql`, copié dans ce dossier, NON EXÉCUTÉ)

Lu en entier. **Aucune instruction destructrice trouvée** : pas de `drop table`, pas de
`drop column`, pas de `truncate`, pas de `delete`. Tout est `add column if not exists`,
`create table if not exists`, `create or replace function`. Les `drop policy if exists` /
`drop trigger if exists` qui apparaissent sont le motif habituel pour rendre un script
rejouable : ils ne suppriment que des objets que CE MÊME script vient de créer, jamais
quelque chose qui préexistait.

**Le seul point qui n'est pas strictement additif** : le script pose deux nouveaux
triggers `BEFORE INSERT/UPDATE/DELETE` sur les tables EXISTANTES et EN PRODUCTION
`profiles` (ligne 112-113) et `objets` (lignes 148-149, 160-161). Ce sont des tables que
l'appli actuelle lit et écrit en ce moment même. J'ai relu leur logique : les deux ne
réagissent que si les colonnes neuves (`solde`, `role`, `mise_depart`, `prix_achat`, etc.)
changent, ou (pour la suppression) si `mise_depart is not null` — donc jamais pour une
ligne existante aujourd'hui, puisque ces colonnes n'existent pas encore chez elle. Sur
lecture du code, ça n'affecte pas le fonctionnement actuel. Je ne l'ai pas exécuté, donc
je ne l'ai pas vérifié en conditions réelles : c'est la limite honnête de cette analyse.

Ce que le script crée, en une phrase chacun : `banque` (une ligne, le trésor et les
réglages), `billets_emis` (chaque billet fabriqué), `encheres` (chaque mise), `transactions`
(le grand livre de tous les mouvements d'argent). Toutes les écritures d'argent passent par
des fonctions `security definer` dont les clients n'ont pas le droit d'exécution direct
(`revoke all ... from public, anon, authenticated`) : un visiteur ne peut pas se créditer
lui-même en écrivant directement dans une table.

Une ligne à la fin (section 7) prévoit de désigner Jiiji comme "banquier" à la main, par un
`update profiles set role = 'banquier' where pseudo = 'jiiji'` à lancer séparément une fois
: ce n'est pas dans le corps du script, c'est en commentaire, à faire consciemment.

### Le blocage réel, confirmé par lecture du code : `Deposer.jsx`

C'est la seule vraie découverte grave de ce diff, et elle justifie à elle seule de ne rien
installer maintenant.

Le nouveau `Deposer.jsx` **remplace entièrement** l'ancien formulaire de dépôt par un
formulaire "mise en vente aux enchères" : il rend obligatoires `mise_depart`,
`prix_achat`, `duree_jours`, et les insère systématiquement dans `objets` à chaque dépôt :

```js
const { error: insErr } = await supabase.from('objets').insert(payload)
```

avec `payload` contenant `mise_depart: Number(form.mise_depart)` etc. **Si ces colonnes
n'existent pas encore dans `objets` (migration non passée), cette insertion échoue à
coup sûr, pour tout le monde, à chaque tentative de dépôt.** L'échec est propre (attrapé
par un `catch`, notification d'erreur, pas de page blanche), mais la conséquence est
réelle : **déposer un objet dans le market — une fonction qui marche aujourd'hui sur le
site en ligne — cesserait de marcher du tout**, dès l'installation de ce fichier, tant que
la migration SQL n'est pas passée.

C'est exactement le cas que la consigne de ce matin voulait qu'on évite : "on ne casse pas
un site qui marche pour ajouter une fonction qui attend une base."

## Conclusion et ce que je recommande

**Je n'ai rien installé du code de cette mise à jour dans le dépôt réel.** Pas parce que
le reste est dangereux (il ne l'est pas, à ce que j'ai pu vérifier), mais parce que :

1. Le blocage de `Deposer.jsx` est réel et confirmé : installer sans la migration casse une
   fonction qui marche aujourd'hui.
2. Contourner ce blocage en installant tout SAUF `Deposer.jsx` (en gardant l'ancien) est
   possible sur le papier — je l'ai envisagé et rien ne s'y oppose techniquement — mais ça
   suppose un nouveau `npm install` (dépendance PWA neuve), un nouveau build, et une
   vérification visuelle aussi rigoureuse que celle faite pour Tour de Phrance (environ
   20 fichiers, une PWA jamais testée ici). Je ne l'ai pas fait dans cette passe : je
   préfère le dire plutôt que de livrer une vérification bâclée sur le site public de
   Jiiji.

**Pour débloquer une installation complète, propre, sans exclusion** : passer
`supabase_hotel_des_ventes.sql` dans le SQL Editor de la base Banque Fantôme (vivante,
vérifiée ce jour par résolution DNS et sonde HTTP, voir le rapport). Une fois fait,
`Deposer.jsx` insère des colonnes qui existent, et tout le reste (déjà vérifié comme
dégradant proprement) devient pleinement fonctionnel sans exclusion à faire.

Écrit le 2026-09-18, vers 11h45, par le dev web (Sonnet 5).
