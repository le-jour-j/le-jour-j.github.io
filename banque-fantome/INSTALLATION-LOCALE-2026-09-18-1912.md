# Banque Fantôme, version hôtel des ventes, installée en local

Écrit le 2026-09-18 à 19h55. Rien n'a été poussé, rien n'a été déployé, aucune
commande SQL n'a été exécutée sur la base.

---

## **http://localhost:8905/banque-fantome/**

Depuis le téléphone, sur le même wifi : **http://192.168.247.81:8905/banque-fantome/**

Le serveur tourne en ce moment. Si tu fermes la fenêtre de commande, il s'arrête, et
on le rallume avec (dans `banque-fantome\`) :
`npm run preview -- --port 8905 --host 0.0.0.0`

---

## 1. Ce que tu as à décider ou à faire

### a. Rien d'obligatoire pour demain

Le site tourne, tu peux le montrer tel quel. Les trois points ci-dessous sont des
choix, pas des réparations à faire en urgence.

### b. Le choix que j'ai fait à ta place, et que tu peux défaire

J'ai installé toute la mise à jour **sauf le nouveau formulaire de dépôt**, en
gardant l'ancien. C'est l'option (a) qu'avait envisagée le dev web ce matin.

Pourquoi : j'ai vérifié ce soir, en lecture seule sur ta base, que les colonnes
`objets.mise_depart` et `profiles.solde` **n'existent pas**. La base n'a pas reçu la
migration. Le nouveau formulaire de dépôt les écrit obligatoirement à chaque dépôt :
installé tel quel, **déposer un objet ne marchait plus du tout**. Or c'est exactement
ce que tu veux tester avec ton téléphone.

Conséquence : tu déposes et tu retires des objets comme aujourd'hui. Tu n'as pas la
mise de départ, ni la durée, ni l'achat immédiat sur le formulaire de dépôt.

### c. Si tu veux les enchères pour de vrai : une seule chose à faire, par toi

1. Ouvre ton tableau de bord Supabase, projet Banque Fantôme, rubrique **SQL Editor**.
2. Ouvre le fichier
   `C:\Users\Pole-Fromage\Documents\GitHub\le-jour-j.github.io\banque-fantome\supabase_hotel_des_ventes.sql`
   colle tout son contenu dans l'éditeur, et lance.
3. Dis-le moi : je remets le nouveau formulaire de dépôt, je rebuilde, et tout le
   système d'enchères s'allume.

Le dev web a lu ce fichier en entier ce matin : aucune instruction destructrice
dedans, rien qui efface une table ou une colonne. Je ne l'ai pas exécuté, ce n'est
pas mon rôle de toucher à ta base.

Une ligne en fin de fichier (section 7) est en commentaire volontaire : elle te
désigne comme banquier. À lancer séparément, consciemment, si tu la veux.

### d. Ce qui n'est pas en ligne

Tout ça vit sur ta machine, sur une branche git à part
(`hotel-des-ventes-local-2026-09-18`). **Le site public n'a pas bougé.** J'ai mis ça
sur une branche exprès : tant que personne ne fusionne dans `main`, aucun `git push`
ne peut envoyer cette version en production par accident.

---

## 2. Ce qui marche, et comment je l'ai vérifié

**Vérifié à l'écran, dans un vrai navigateur, sur le site local :**

1. **Page d'accueil** : s'affiche entièrement. Nouveau design, gros titre, bandeau de
   chiffres, bandeau défilant en haut, pied de page, bandeau "installer l'appli".
2. **Market** : s'affiche avec **les 4 vraies entrées de ta base**, filtres par
   catégorie, statut et rareté, tri, recherche. Les cartes sortent bien les données
   réelles (numéro, valeur en billets, rareté).
3. **S'enrichir** : mode d'emploi, guichet d'émission, cours des devises, billets à
   imprimer. Tout s'affiche.
4. **Connexion** : le formulaire s'affiche, les deux onglets (connexion / nouveau
   compte) sont là.
5. **Déposer, hors connexion** : affiche proprement "Accès refusé, vous devez être
   connecté". Pas de page blanche.
6. **Aucune erreur JavaScript** dans la console du navigateur sur les pages visitées.
7. **La PWA est bien générée** : `manifest.webmanifest`, `sw.js` et les 6 icônes
   répondent tous. Le bandeau "installer l'appli" apparaît en bas de page.

**Vérifié par la commande, pas à l'écran :**

8. `npm install` passe (284 paquets ajoutés, dont `vite-plugin-pwa` qui est neuf).
9. `npm run build` passe sans erreur, 109 modules, PWA générée avec 49 fichiers mis
   en cache.
10. Les 10 adresses du site (accueil, market, déposer, compte, connexion, s'enrichir,
    manifeste, service worker, icônes) répondent toutes 200.
11. L'ancien formulaire de dépôt utilise 10 classes de style : **les 10 existent
    toujours** dans le nouveau fichier de style. Il ne sera donc pas dénudé.

---

## 3. Ce qui ne marche pas, et pourquoi

Tout ce qui suit a la même cause unique : **la migration SQL n'est pas passée.**
Rien de tout ça ne casse une page, tout dégrade proprement.

1. **Le bandeau de chiffres de l'accueil** affiche un tiret vide pour billets en circulation,
   trésor de la banque et ventes en cours. La fonction `stats_banque` n'existe pas
   encore côté base. Seul "objets en circulation" est vrai.
2. **Fabriquer un billet** (guichet d'émission, page S'enrichir) : le formulaire
   s'affiche mais l'envoi échouera, la fonction `emettre_billet` n'existe pas. Échec
   propre, message d'erreur, pas de page cassée.
3. **Le solde à côté de "Mon compte"** ne s'affiche jamais, et **les blocs d'enchères
   ne s'affichent sur aucun objet**. Normal, ces notions n'existent pas dans la base.
4. **Le formulaire de dépôt est l'ancien** : pas de mise de départ, pas de durée, pas
   d'achat immédiat. C'est le choix du point 1.b.
5. **Le bandeau défilant en haut** affiche son texte de secours
   ("OUVREZ UN COMPTE...") au lieu du vrai journal de la banque. Prévu par Gaétan,
   c'est fait exprès.

Aucun de ces cinq points n'est un bug. Ce sont les cinq endroits où la nouvelle
version attend une base qu'elle n'a pas encore.

---

## 4. Ce que je n'ai pas pu vérifier

Je le dis franchement plutôt que de laisser croire que tout est testé.

1. **Tout ce qui demande d'être connecté n'a pas été testé à l'écran.** Je n'ai pas
   tes identifiants, et je ne voulais pas créer un compte de test qui resterait pour
   toujours dans ta vraie base. Donc : **déposer un objet, le retirer, la page Mon
   compte, les messages, les échanges** sont vérifiés par lecture du code, pas à
   l'écran. **C'est la première chose à faire toi-même** : connecte-toi sur
   l'adresse locale et dépose un objet. Si ça marche, le reste suit.
2. **L'affichage sur un vrai téléphone.** J'ai tenté de rétrécir la fenêtre, le
   navigateur n'a pas suivi. Le menu en tiroir et les colonnes en mode téléphone sont
   du travail de Gaétan que je n'ai pas vu de mes yeux.
3. **L'accès depuis ton téléphone.** L'adresse réseau est donnée en haut, mais le
   pare-feu Windows peut bloquer le port 8905 en arrivée. Si ton téléphone n'arrive
   pas à ouvrir la page, c'est ça, et je ne touche pas aux réglages de ta machine.
4. **L'installation de l'appli sur l'écran d'accueil du téléphone.** Les navigateurs
   exigent en général du HTTPS pour ça : en local, en `http://`, l'installation
   risque d'être refusée par le téléphone même si le bandeau s'affiche. Non testé.
5. **Le service worker en conditions réelles** (usage hors ligne, mise à jour
   automatique). Généré, servi, jamais éprouvé.
6. **Le contenu réel du fichier SQL en exécution.** Lu par le dev web ce matin, jugé
   non destructeur. Jamais lancé, donc jamais prouvé.
7. **Je n'ai pas relu ligne à ligne les 20 fichiers modifiés.** Je me suis appuyé sur
   l'analyse de ce matin (`CE-QUI-CHANGE-HOTEL-DES-VENTES.md`) et j'ai vérifié
   moi-même les points qui décidaient de l'installation.

---

*Écrit le 2026-09-18 à 19h55 par le développeur web, mandaté par MORTIS sur demande
de Jiiji. Aucune sortie vers l'extérieur, aucun déploiement, aucune écriture en base.*
