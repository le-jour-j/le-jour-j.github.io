# La lettre de la banque : mode d'emploi

*Écrit le 2026-10-04 à 22:55, à la demande de Jiiji : une lettre par semaine, qui résume
les posts du fil d'actu et invite à visiter le site, envoyée aux comptes inscrits et aux
structures partenaires (qui n'ont pas de compte).*

---

## Ce que ça fait

- **Chaque lundi matin**, la lettre part toute seule. Elle raconte les actus **publiées**
  depuis la lettre précédente : la première photo, le titre, le début du texte, un lien
  « Lire sur le site ». Plus ton **mot du banquier** si tu en as écrit un.
- **S'il n'y a rien de neuf**, elle ne part pas. Une semaine sans actu ne fait rien perdre :
  ce qui n'a pas été raconté part la fois suivante.
- **Elle part depuis une adresse Gmail**, un exemplaire par personne : personne ne voit
  l'adresse des autres, et tu retrouves les envois dans « Messages envoyés ».
- **Chacun peut se désinscrire** par le lien en bas de la lettre (c'est obligatoire).

**Qui la reçoit :**

| Qui | Comment il s'inscrit |
|---|---|
| Les structures partenaires (sans compte) | **Toi**, dans Admin → Lettre : une par une, ou en collant une liste |
| Les comptes du site | Eux-mêmes : case à cocher en créant leur compte, ou dans Mon compte |

Les boutons « ✉ Recevoir la lettre » sont sur l'accueil (à côté de « Entrer dans le market »)
et sur la page Actu. Ils mènent à la création de compte, case déjà cochée.

**Les adresses ne se voient nulle part sur le site.** Elles sont rangées à part des
profils (qui eux sont publics) : chacun ne voit que la sienne, toi tu vois tout.

---

## Dans l'admin, onglet « Lettre »

- **Envoyer automatiquement chaque lundi matin** : la case pour couper ou remettre l'envoi.
- **Le mot du banquier** : un texte qui s'affiche en tête de la prochaine lettre, puis s'efface.
- **Voir l'aperçu** : la lettre exactement comme elle partirait.
- **Envoyer un test** : à toi seul, pour la voir dans une vraie boîte mail.
- **Envoyer maintenant** : sans attendre lundi (demande une confirmation).
- **Abonnés** : ajouter, suspendre, retirer. « Copier les adresses » les met toutes dans
  le presse-papier, pour un mail écrit à la main depuis Gmail.
- **Lettres envoyées** : l'historique, avec les éventuels échecs.

---

## La mise en route

**Fait le 2026-10-04 vers 23:00 :**

- la base (`supabase_lettre.sql` appliqué) ;
- la fonction `lettre` déployée ;
- l'appel du lundi programmé, avec son code tiré au hasard dans le coffre de la base.
  Vérifié : la base appelle la fonction, la fonction répond « Envoi automatique désactivé ».
- **L'envoi automatique est COUPÉ** : à cocher dans l'admin après un test réussi.

**Reste à faire par Jiiji :**

### 1. Gmail : envoyer depuis jeanson.pechin, signé banque.fantome

1. Dans le Gmail de **jeanson.pechin@gmail.com** : Paramètres → Voir tous les paramètres →
   **Comptes et importation** → « Envoyer des e-mails en tant que ». Si
   `banque.fantome@gmail.com` n'y est pas, l'ajouter (Gmail envoie un code de confirmation
   dans la boîte de banque.fantome). Sans ça, Gmail signe avec jeanson.pechin.
2. Sur le compte Google **jeanson.pechin** : la validation en deux étapes doit être active,
   puis **myaccount.google.com/apppasswords** → créer « Lettre Banque Fantôme ». Google
   affiche **16 lettres**. *Ce n'est pas le mot de passe du compte, on peut le révoquer.*

### 2. Les secrets de la fonction

Supabase → Edge Functions → **Secrets**
(supabase.com/dashboard/project/eopygceibkbtkqmrgnxt/functions/secrets) :

- `GMAIL_USER` = `jeanson.pechin@gmail.com`
- `GMAIL_APP_PASSWORD` = les 16 lettres
- `GMAIL_FROM` = `banque.fantome@gmail.com`

### 3. Essayer

Admin → Lettre → **Voir l'aperçu** → **Envoyer un test**. Si la lettre arrive et te plaît,
cocher « Envoyer automatiquement chaque lundi matin ».

### 4. Le site

Publier le site (envoi sur GitHub : la mise en ligne suit toute seule).

---

## Les limites à connaître

- **Gmail plafonne à environ 500 envois par jour.** La fonction refuse d'envoyer au-delà de
  450 abonnés : à ce moment-là, il faudra passer à un service d'envoi (Brevo, par exemple).
- **L'heure** : lundi 8 h UTC, donc 10 h à Paris l'été et 9 h l'hiver.
- **La première lettre** reprendra toutes les actus publiées à ce jour (aucune n'a encore
  été racontée). Si tu ne le veux pas, dans le SQL Editor :
  `update actus set en_lettre_at = now() where publie;`

---

## Les fichiers

| Fichier | Rôle |
|---|---|
| `supabase_lettre.sql` | les tables (abonnés, réglages, historique) et le lundi automatique |
| `supabase/functions/lettre/index.ts` | fabrique la lettre et l'envoie par Gmail |
| `src/lib/lettre.js` | les appels communs du site |
| `src/components/BoutonLettre.jsx` | le bouton « ✉ Recevoir la lettre » |
| `src/pages/Lettre.jsx` | la page du lien de désinscription |
| `src/pages/Admin.jsx` | l'onglet Lettre |
| `src/pages/Compte.jsx`, `src/pages/Connexion.jsx` | l'inscription des comptes |
