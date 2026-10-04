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

**Fait le 2026-10-05 vers 00:10 :**

- le site publié (les boutons, l'onglet Lettre, la page de désinscription) ;
- 17 structures partenaires inscrites (depuis le tableau de bord CLEA et les adresses
  données par Jiiji) ;
- les identifiants Gmail rangés dans le **coffre de la base** (vault : `gmail_user`,
  `gmail_app_password`, `gmail_from`), lus par la fonction. L'outil Supabase de Claude ne sait
  pas poser les secrets de la fonction, d'où le coffre. Rien n'est écrit dans un fichier ;
- deux lettres de test envoyées à dieu.pechin et village.simsclaude, parties signées
  **banque.fantome@gmail.com** (vérifié dans les messages envoyés de jeanson.pechin).

**Reste à faire par Jiiji :** relire la lettre de test, puis cocher « Envoyer
automatiquement chaque lundi matin » dans Admin → Lettre.

**Changer le mot de passe d'application** (s'il est révoqué chez Google) : en créer un
nouveau sur myaccount.google.com/apppasswords (compte jeanson.pechin), puis dans le SQL
Editor :
`select vault.update_secret((select id from vault.secrets where name = 'gmail_app_password'), 'les16lettres');`

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
