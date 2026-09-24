# Refonte du Market façon hôtel des ventes (WoW-like)

## Contexte

Le market (`src/pages/Inventaire.jsx`, route `/market`) liste des entrées (`objets`) déposées par les joueurs : objet / œuvre / service, avec titre, description, images, statut (disponible/réservé/échangé), catégorie. On veut lui donner une ambiance plus proche d'un hôtel des ventes de jeu vidéo (type World of Warcraft) : rareté colorée sur chaque entrée, valeur symbolique affichée, tri, tout en gardant :
- la barre de filtres horizontale actuelle (pas de sidebar)
- l'identité visuelle existante du site (variables CSS dans `src/index.css` : `--jaune`, `--noir`, `--blanc`, `--gris`, `--gris-fonce`, `--gris-clair`, `--gris-bord`, `--rouge`, polices `--bebas`/`--sans`/`--mono`) — **pas de vert/bleu/violet/orange façon WoW littéral**, ça casserait l'identité papier/tampon du site.
- le fonctionnement actuel (dépôt + proposition d'échange par message) : pas de vraie transaction chiffrée, la valeur est symbolique/narrative.

## 1. Base de données (Supabase)

Ajouter deux colonnes à la table `objets` :
- `rarete text default 'commun'` — valeurs possibles : `commun`, `rare`, `precieux`, `exceptionnel`
- `valeur integer` — nullable, valeur en "billets" (unité fictive de la Banque Fantôme)

Écris la migration SQL (ALTER TABLE ... ADD COLUMN IF NOT EXISTS, avec les mêmes conventions que le reste de `supabase_setup.sql`), montre-la moi, et applique-la seulement après ma confirmation — comme d'habitude.

## 2. Code couleur des raretés

Utiliser uniquement les variables CSS déjà définies dans `src/index.css`, pas de nouvelles teintes :
- `commun` → `var(--gris)`
- `rare` → `var(--jaune)` (le jaune signature du site)
- `precieux` → `var(--rouge)`
- `exceptionnel` → `var(--noir)` avec un liseré `var(--jaune)` (les deux combinés, pour marquer le tier le plus haut)

Crée une classe utilitaire réutilisable (ex. `.rarete-badge` avec des modificateurs `.rarete-commun`, `.rarete-rare`, `.rarete-precieux`, `.rarete-exceptionnel`) dans `src/index.css`, sur le même modèle que les classes `.tag`/`.stamp` existantes.

## 3. Formulaire de dépôt (`src/pages/Deposer.jsx`)

Ajouter deux champs :
- **Rareté** : select avec les 4 valeurs ci-dessus (défaut `commun`)
- **Valeur** : select basé sur les dénominations de billets déjà utilisées sur la page S'enrichir (`src/pages/Senrichir.jsx` : 5, 10, 20, 50, 100, 200, 500), plus une option vide/"non précisé"

Inclure ces deux champs dans le payload d'insertion (`rarete`, `valeur`).

## 4. Affichage — carte (`src/components/ObjetCard.jsx`)

- Ajouter le badge de rareté (couleur selon le mapping ci-dessus), positionné à côté du tag catégorie existant.
- Afficher la valeur si elle existe, en évidence façon "prix" d'hôtel des ventes : police `--bebas`, taille visible, positionné en haut à droite de la carte (au-dessus ou à côté du numéro `#0000` existant), format `"{valeur} billets"`.

## 5. Affichage — modale (`src/components/ObjetModal.jsx`)

- Même badge de rareté que sur la carte, affiché à côté du tag catégorie.
- Valeur affichée de façon plus développée dans la zone des stamps en bas (à côté du stamp de statut), format `"Valeur estimée : {valeur} billets"`. Si `valeur` est vide, ne rien afficher (pas de "0" ni de placeholder).

## 6. Market (`src/pages/Inventaire.jsx`)

- Ajouter un filtre **Rareté** dans la barre horizontale existante, sur le même modèle que les filtres Catégories/Statuts (boutons `btn-outline`/`btn-noir`), avec les 5 valeurs (`toutes`, `commun`, `rare`, `precieux`, `exceptionnel`).
- Ajouter un contrôle **Trier par** (select ou petits boutons) avec au moins : `Plus récent` (défaut, actuel), `Valeur décroissante`, `Valeur croissante`, `Rareté` (exceptionnel → commun).
- Garder la disposition horizontale actuelle, ne pas passer en sidebar.
- Adapter la requête Supabase (`order`, filtre `eq('rarete', ...)`) en conséquence, en gardant le fallback existant si jamais une colonne manque (comme c'est déjà géré pour `categorie`).

## Consignes générales

- Ne touche à rien côté déploiement/CI, ce chantier est uniquement front + une migration additive sur `objets`.
- Montre-moi la migration SQL avant de l'appliquer.
- Fais un point avant de commit/push comme d'habitude, je valide avant que tu pushes.
