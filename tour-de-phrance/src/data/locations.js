// Base des lieux — Tour de Phrance
// Refonte du 12/09/2026 : chaque lieu a été recherché sur le web (2 à 4 requêtes),
// seules les informations vues sur une page sont notées, avec la source.
// Les ids ne changent JAMAIS : ils portent l'historique des passages et des
// commentaires de la tournée n°1. Un lieu hors sujet est marqué retired,
// jamais supprimé.
//
// status : active (aucune fermeture trouvée) | closed | doubtful | unverified
// fit    : oui (diffuse fanzines / micro-édition / livres d'artiste)
//          possible (librairie indépendante ou lieu d'art avec point de vente)
//          non (pas de point de vente de livres, hors sujet, chaîne)
// origine: v1 (base d'origine) | ajout-2026 (ajouté lors de la refonte)
//
// field_note : note de terrain prise pendant la tournée n°1, sur les 37 lieux qui
// en ont une. Nomme parfois des librairies, et le ton n'est pas toujours flatteur.
// Retirée du site le 12/09/2026 par précaution, remise le 18/09/2026 sur décision
// explicite de Jeanson (« elles sont cruciales, elles doivent être visibles »),
// après qu'on lui a montré les exemples les moins flatteurs. Elles ont aussi
// servi à classer les lieux (fit, status). Copie source dans contenu/prive/.

export const RAW_LOCATIONS = [
  {
    "id": "occitanie-1",
    "field_note": "faut les relancer eux (2026-06-01)",
    "name": "Librairie du Carré d'Art",
    "city": "Nîmes",
    "address": "Place de la Maison Carrée, 30000 Nîmes",
    "description": "Librairie du musée d'art contemporain Carré d'Art (Ville de Nîmes) : monographies, catalogues, revues, livres d'artistes et éditions d'artistes, estampes. Ouvert mardi-samedi 10h-13h / 14h-18h, plus certains dimanches 14h-18h.",
    "website": "https://www.carreartmusee.com/fr/librairie-publications/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://www.carreartmusee.com/fr/librairie-publications/presentation/",
      "https://www.carreartmusee.com/fr/librairie-publications/librairie-en-ligne/"
    ],
    "region": "occitanie",
    "origine": "v1",
    "verification_note": "Contact librairie : librairie@carreartmusee.com, 04 66 76 35 83."
  },
  {
    "id": "occitanie-2",
    "field_note": "Généraliste (2026-05-12)",
    "name": "Librairie Teissier",
    "city": "Nîmes",
    "address": "11 rue Régale, 30000 Nîmes",
    "description": "Librairie généraliste indépendante fondée en 1914, label LIR, environ 8 000 titres sur 55 m² (littérature française et hispanique, polars, tauromachie, sciences humaines). Lundi-samedi 9h-12h30 / 14h-19h.",
    "website": "https://www.librairie-nimes.fr",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.occitanielivre.fr/annuaire/teissier-librairie"
    ],
    "region": "occitanie",
    "origine": "v1",
    "verification_note": "Numéro corrigé : 11 rue Régale (le brief n'avait pas de numéro)."
  },
  {
    "id": "occitanie-3",
    "field_note": "Généraliste (2026-05-12)",
    "name": "Librairie L'Eau Vive",
    "city": "Nîmes",
    "address": "7 rue Régale, 30000 Nîmes",
    "description": "Librairie indépendante jeunesse et jeux (label LIR), 110 m², environ 6 500 titres, fondée en 1994. Mardi-samedi 10h-13h / 14h-19h.",
    "website": "https://www.librairie-eauvive.com",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.occitanielivre.fr/annuaire/eau-vive"
    ],
    "region": "occitanie",
    "origine": "v1",
    "verification_note": "L'annuaire Occitanie Livre la classe librairie jeunesse spécialisée ; type gardé « généraliste » selon la note de terrain. Peu adaptée à des livres d'artiste adultes."
  },
  {
    "id": "occitanie-4",
    "field_note": "Généraliste (2026-05-12)",
    "name": "La Librairie des Deux Places (ex-Aux Lettres de mon Moulin)",
    "city": "Nîmes",
    "address": "12 boulevard Alphonse Daudet, 30000 Nîmes",
    "description": "Aux Lettres de mon Moulin a fermé le 22 janvier 2026 après 25 ans ; le local a rouvert le 17 mars 2026 sous le nom La Librairie des Deux Places (repreneurs Jean-François Camilleri et Vincent Barbare, déjà libraires à Uzès), généraliste littérature/BD/régional sur deux niveaux. Mardi-samedi 10h-13h / 14h-19h.",
    "website": "https://www.lalibrairiedesdeuxplaces.fr/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.vivrenimes.fr/formats/articles/aux-lettres-de-mon-moulin-a-nimes-une-page-se-tourne",
      "https://www.vivrenimes.fr/formats/articles/la-librairie-des-deux-places-ouvre-ses-portes-a-nimes"
    ],
    "region": "occitanie",
    "origine": "v1",
    "verification_note": "Nouvelle équipe depuis mars 2026 : tout contact antérieur est caduc, à reprendre de zéro."
  },
  {
    "id": "occitanie-5",
    "name": "Frac Occitanie Montpellier – La Librairie verticale",
    "city": "Montpellier",
    "address": "4 rue Rambaud, 34000 Montpellier",
    "description": "La « Librairie verticale » du Frac (conçue en 1998 par Thierry Verdier) vend environ 120 titres : monographies et livres d'artistes liés à la collection, de 5 à 150 €. Mardi-samedi 14h-18h (juillet-août : samedi 15h-19h), entrée libre.",
    "website": "https://www.frac-om.org/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://www.frac-om.org/actualites/la-librairie-verticale.html",
      "https://www.frac-om.org/informations-pratiques/venir-au-frac-om"
    ],
    "region": "occitanie",
    "origine": "v1",
    "verification_note": "Sélection restreinte, liée aux artistes de la collection : à négocier."
  },
  {
    "id": "occitanie-6",
    "field_note": "Pas ouvert quand je suis passé j'ai envoyé un mail (2026-05-12)",
    "name": "MO.CO. Panacée – librairie-boutique",
    "city": "Montpellier",
    "address": "14 rue de l'École de Pharmacie, 34000 Montpellier",
    "description": "Le MO.CO. a deux librairies-boutiques : Hôtel des collections (13 rue de la République) et Panacée (14 rue de l'École de Pharmacie), ouvertes uniquement pendant les expositions, mardi-dimanche 11h-19h (juin-sept.) / 11h-18h (oct.-mai). Livres adultes/jeunesse et produits dérivés.",
    "website": "https://www.moco.art/index.php/fr/librairie-boutique",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.moco.art/index.php/fr/librairie-boutique",
      "https://fr.wikipedia.org/wiki/Sauramps"
    ],
    "region": "occitanie",
    "origine": "v1",
    "verification_note": "Wikipédia indique que la boutique MO.CO. est exploitée par Sauramps (en redressement judiciaire depuis juin 2026) : vérifier qui décide des dépôts. Fermée hors périodes d'exposition."
  },
  {
    "id": "occitanie-7",
    "name": "Galerie AL/MA",
    "city": "Montpellier",
    "address": "5 rue du Plan du Palais, 34000 Montpellier",
    "description": "Galerie d'art contemporain, ouverte mercredi-samedi 14h30-18h30, fermée en août. Aucune mention de vente d'éditions sur le site.",
    "website": "https://galeriealma.com/",
    "type": "galerie-artist-run",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://galeriealma.com/gallery/",
      "https://www.paris-art.com/lieux/galerie-alma/"
    ],
    "region": "occitanie",
    "origine": "v1",
    "verification_note": "ERREUR D'ADRESSE dans le brief (15 rue La Fontaine) : le site officiel donne 5 rue du Plan du Palais. Vente d'éditions non confirmée."
  },
  {
    "id": "occitanie-8",
    "field_note": "Ne fait plus de vente (2026-05-12)",
    "name": "En Traits Libres (librairie fermée / collectif)",
    "city": "Montpellier",
    "address": "2 rue du Bayle, 34000 Montpellier",
    "description": "La librairie En Traits Libres (1 rue Voltaire) a fermé définitivement le 31 décembre 2025 ; le collectif d'artistes (Mattt Konture, Ganaëlle Maury, etc.) continue son atelier au 2 rue du Bayle, sans activité de vente.",
    "website": "https://www.occitanielivre.fr/index.php/annuaire/en-traits-libres",
    "type": "atelier-editeur",
    "status": "closed",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://www.artistes-occitanie.fr/a-montpellier-la-fin-definitive-de-la-librairie-en-traits-libres-mais-pas-du-collectif/",
      "https://actualitte.com/article/126045/librairie/a-montpellier-un-dernier-noel-et-on-plie-boutique-pour-en-traits-libres"
    ],
    "region": "occitanie",
    "origine": "v1",
    "verification_note": "Le collectif reste un contact utile pour la micro-édition (Rhony's Festival), mais plus de point de vente.",
    "retired": true
  },
  {
    "id": "occitanie-9",
    "name": "Centre d'art La Fenêtre",
    "city": "Montpellier",
    "address": "Opéra Comédie, place de la Comédie, 34000 Montpellier",
    "description": "Centre d'art dédié à l'architecture, au design et aux arts visuels. Il a quitté le 27 rue Frédéric Peyson : hébergé chez En Traits Libres jusqu'en juin 2025, puis installation prévue en juillet 2025 dans un ancien restaurant de l'Opéra Comédie. Aucune boutique mentionnée.",
    "website": "https://la-fenetre.com/",
    "type": "autre",
    "status": "doubtful",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://www.artistes-occitanie.fr/a-montpellier-le-centre-dart-la-fenetre-sinstalle-place-de-la-comedie/",
      "https://la-fenetre.com/"
    ],
    "region": "occitanie",
    "origine": "v1",
    "verification_note": "ADRESSE DU BRIEF OBSOLÈTE. L'installation effective à l'Opéra Comédie et l'existence d'un point de vente n'ont pas pu être confirmées (site officiel non lisible)."
  },
  {
    "id": "occitanie-10",
    "field_note": "Travaux (2026-05-12)",
    "name": "Sauramps au Musée (Musée Fabre)",
    "city": "Montpellier",
    "address": "39 boulevard Bonne Nouvelle, 34000 Montpellier",
    "description": "La librairie Sauramps du musée Fabre a fermé en 2025. Le groupe Sauramps (magasin principal au Triangle, Alès) a été placé en redressement judiciaire le 15 juin 2026 ; Sauramps Odyssée a fermé en janvier 2026.",
    "website": "https://www.sauramps.com/",
    "type": "librairie-centre-art",
    "status": "closed",
    "fit": "non",
    "verified_address": false,
    "sources": [
      "https://actualitte.com/article/132001/librairie/sauramps-en-redressement-judiciaire-la-librairie-historique-de-montpellier-joue-sa-survie",
      "https://fr.wikipedia.org/wiki/Sauramps"
    ],
    "region": "occitanie",
    "origine": "v1",
    "verification_note": "Les « travaux » vus sur place correspondent à une fermeture définitive de ce point de vente. Existence d'une autre boutique au musée Fabre non vérifiée.",
    "retired": true
  },
  {
    "id": "occitanie-11",
    "field_note": "Généraliste Maïa sympa (2026-05-12)",
    "name": "Le Grain des Mots",
    "city": "Montpellier",
    "address": "2 cours Gambetta, 34000 Montpellier",
    "description": "Librairie généraliste indépendante depuis 2003. A quitté le 13 boulevard du Jeu de Paume pour rouvrir le 1er septembre 2026 au 2 cours Gambetta. Mardi-samedi 10h-19h.",
    "website": "https://legraindesmots.com/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://legraindesmots.com/"
    ],
    "region": "occitanie",
    "origine": "v1",
    "verification_note": "DÉMÉNAGEMENT : nouvelle adresse depuis septembre 2026 (le site indique encore les deux adresses)."
  },
  {
    "id": "occitanie-12",
    "field_note": "Pas de point de vente (2026-05-12)",
    "name": "CRAC Occitanie",
    "city": "Sète",
    "address": "26 quai Aspirant Herber, 34200 Sète",
    "description": "Centre régional d'art contemporain (Région Occitanie), entrée libre, 12h30-19h en semaine, 14h-19h le week-end, fermé le mardi ; fermé pour montage du 7 septembre au 8 octobre 2026. Aucune librairie mentionnée.",
    "website": "https://crac.laregion.fr/",
    "type": "musee",
    "status": "active",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://crac.laregion.fr/",
      "https://pleinsud.art/fr/lieux/crac-sete"
    ],
    "region": "occitanie",
    "origine": "v1",
    "verification_note": "Confirmé par le terrain et par l'absence de boutique sur le site.",
    "retired": true
  },
  {
    "id": "occitanie-13",
    "name": "Librairie L'Échappée Belle",
    "city": "Sète",
    "address": "7 rue Gambetta, 34200 Sète",
    "description": "Librairie généraliste indépendante (label LIR) créée en 2004, 170 m², 21 000 titres, avec des rayons littérature étrangère, BD indépendante, jeunesse et éditions d'art. Lundi-samedi 9h30-19h en continu, dimanche 10h-13h.",
    "website": "https://www.lechappeebelle.fr/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.occitanielivre.fr/annuaire/lechappee-belle"
    ],
    "region": "occitanie",
    "origine": "v1",
    "verification_note": "Rayon « BD indépendante / éditions d'art rares » signalé par l'annuaire : bonne cible."
  },
  {
    "id": "occitanie-14",
    "name": "Nouvelle Librairie Sétoise",
    "city": "Sète",
    "address": "7 rue Alsace-Lorraine, 34200 Sète",
    "description": "Librairie généraliste indépendante fondée en 1981, 145 m². Lundi-samedi 9h30-19h, dimanche 10h-13h.",
    "website": "https://www.nouvellelibrairiesetoise.fr/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.occitanielivre.fr/annuaire/nouvelle-librairie-setoise"
    ],
    "region": "occitanie",
    "origine": "v1",
    "verification_note": "Adresse complétée (le brief n'en avait pas)."
  },
  {
    "id": "occitanie-15",
    "field_note": "relancer nouvelle libraire, nouveau ? je sais plus. juin 26 relance (2026-06-01)",
    "name": "Mrac Occitanie – librairie-boutique",
    "city": "Sérignan",
    "address": "146 avenue de la Plage, 34410 Sérignan",
    "description": "Librairie-boutique spécialisée art contemporain du musée régional : monographies, catalogues, livres d'artistes, éditions et multiples du musée, accès libre. Musée ouvert mardi-vendredi 10h-18h, samedi-dimanche 13h-18h, fermé lundi et jours fériés.",
    "website": "https://mrac.laregion.fr/Librairie-boutique",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://mrac.laregion.fr/Librairie-boutique",
      "https://mrac.laregion.fr/Horaires-tarifs-acces"
    ],
    "region": "occitanie",
    "origine": "v1",
    "verification_note": "Contact : museedartcontemporain@laregion.fr, 04 67 17 88 95. Changement de libraire signalé sur le terrain, non vérifiable en ligne."
  },
  {
    "id": "occitanie-16",
    "field_note": "Envoyer dossier par mail (2026-05-12)",
    "name": "L.A.C. – Lieu d'Art Contemporain",
    "city": "Sigean",
    "address": "4 rue de la Cave Coopérative, 11130 Sigean",
    "description": "Lieu d'art contemporain associatif, ouvert en saison : jeudi-dimanche 15h-19h (juillet-août), 14h-18h (septembre), samedi-dimanche 14h-17h (octobre-décembre), sur rendez-vous le reste de l'année. Affiches et catalogues proposés aux adhérents, pas de boutique décrite.",
    "website": "https://lac-narbonne.art/",
    "type": "autre",
    "status": "active",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://lac-narbonne.art/"
    ],
    "region": "occitanie",
    "origine": "v1",
    "verification_note": "Adresse postale non affichée sur le site (gardée du brief). Contact : contact@lac-narbonne.art, 04 68 48 83 62."
  },
  {
    "id": "occitanie-17",
    "field_note": "« $pl » (2026-04-27) ; contacté (2026-05-12)",
    "name": "Musée des Arts et Métiers du Livre",
    "city": "Montolieu",
    "address": "39 rue de la Mairie, 11170 Montolieu",
    "description": "Musée municipal consacré à l'histoire de l'écriture, de la typographie, de l'imprimerie et de la reliure, avec expositions temporaires. Mardi-samedi 10h-13h / 14h-18h, dimanche 15h-18h, fermé lundi ; entrée 5 €.",
    "website": "https://www.montolieu-livre.fr/livre/musee-des-arts-et-metiers-du-livre/",
    "type": "musee",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.montolieu-livre.fr/livre/musee-des-arts-et-metiers-du-livre/informations/"
    ],
    "region": "occitanie",
    "origine": "v1",
    "verification_note": "Existence d'une boutique non confirmée en ligne. Numéro de rue ajouté (39)."
  },
  {
    "id": "occitanie-18",
    "name": "Librairie de la Paix",
    "city": "Montolieu",
    "address": "11170 Montolieu",
    "description": "Aucune librairie de ce nom trouvée dans les listes des librairies de Montolieu (site officiel du village, office de tourisme Grand Carcassonne, ilibrairie.fr).",
    "website": "",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://www.grand-carcassonne-tourisme.fr/votre-sejour-chez-nous/culture-art-patrimoine/montolieu-village-du-livre-ses-librairies-et-celles-autour/",
      "https://ilibrairie.fr/11/montolieu/"
    ],
    "region": "occitanie",
    "origine": "v1",
    "verification_note": "Probable erreur de nom ou librairie disparue : à confirmer sur place. Hors tronçon selon le brief."
  },
  {
    "id": "occitanie-19",
    "field_note": "livre ancien (2026-05-12)",
    "name": "Librairie L'Aubaine",
    "city": "Montolieu",
    "address": "22 rue Nationale, 11170 Montolieu",
    "description": "Librairie de Montolieu classée dans l'ancien et l'occasion (pochothèque, sciences humaines, beaux-arts). Horaires non affichés.",
    "website": "https://www.montolieu-livre.fr/librairies/librairie-laubaine/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://www.montolieu-livre.fr/librairies/librairie-laubaine/",
      "https://ilibrairie.fr/11/montolieu/"
    ],
    "region": "occitanie",
    "origine": "v1",
    "verification_note": "Note de terrain « livre ancien » : pas de dépôt d'éditions neuves.",
    "retired": true
  },
  {
    "id": "occitanie-20",
    "field_note": "Pas pu passer, contact pris par mail (2026-05-11)",
    "name": "Librairie Torcatis",
    "city": "Perpignan",
    "address": "10 rue Mailly, 66000 Perpignan",
    "description": "Librairie généraliste indépendante fondée en 1945, 600 m² sur trois niveaux, plus de 50 000 titres. Lundi 10h-19h, mardi-samedi 9h30-19h.",
    "website": "http://www.librairietorcatis.com/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.occitanielivre.fr/annuaire/torcatis-librairie"
    ],
    "region": "occitanie",
    "origine": "v1",
    "verification_note": "Contact : librairie.torcatis@wanadoo.fr."
  },
  {
    "id": "occitanie-21",
    "field_note": "Pas sûr qu'il y ait une librairie ici (2026-05-12)",
    "name": "À Cent Mètres du Centre du Monde",
    "city": "Perpignan",
    "address": "3 avenue de Grande-Bretagne, 66000 Perpignan",
    "description": "Centre d'art contemporain privé, ouvert mercredi-dimanche 15h-19h (avril-octobre) et 14h-18h (novembre-mars) ; exposition « Le Salon des Oubliés » du 2 octobre 2026 au 21 mars 2027. Aucune librairie mentionnée sur le site.",
    "website": "https://www.acentmetresducentredumonde.com/",
    "type": "autre",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.acentmetresducentredumonde.com/"
    ],
    "region": "occitanie",
    "origine": "v1",
    "verification_note": "Point de vente non confirmé : à demander par mail avant détour."
  },
  {
    "id": "occitanie-22",
    "name": "Centre d'art Le LAIT",
    "city": "Albi",
    "address": "5 rue de l'École Normale, 81000 Albi",
    "description": "Centre d'art contemporain installé depuis mars 2025 rue de l'École Normale (Laboratoire Artistique International du Tarn). Le site comporte une rubrique boutique « Éditions du Lait ». Tripadvisor indique une ouverture le samedi 13h30-18h30.",
    "website": "https://www.centredartlelait.com",
    "type": "autre",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://albi.fr/annuaire-des-equipements/centre-dart-le-lait",
      "http://www.centredartlelait.com/_boutique_article&id_article=11?lang=fr",
      "https://www.tripadvisor.com/Attraction_Review-g187167-d8528396-Reviews-Centre_d_art_Le_Lait-Albi_Tarn_Occitanie.html"
    ],
    "region": "occitanie",
    "origine": "v1",
    "verification_note": "Site officiel illisible sans JavaScript : horaires complets et boutique physique non vérifiés. Contact : centredart@centredartlelait.com, 09 63 03 98 84."
  },
  {
    "id": "occitanie-23",
    "name": "Librairie Les Petits Vagabonds",
    "city": "Albi",
    "address": "13 rue Peyrolière, 81000 Albi",
    "description": "Librairie jeunesse indépendante depuis une vingtaine d'années (albums, BD, romans, documentaires). Mardi-vendredi 10h-19h, samedi 10h-12h30 / 14h-19h.",
    "website": "https://www.librairiepetitsvagabonds.fr/",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.occitanielivre.fr/annuaire/petits-vagabonds-librairie"
    ],
    "region": "occitanie",
    "origine": "v1",
    "verification_note": "Spécialisée jeunesse : intérêt limité pour des éditions adultes."
  },
  {
    "id": "occitanie-24",
    "name": "Librairie des Abattoirs (les Abattoirs, Musée – Frac Occitanie Toulouse)",
    "city": "Toulouse",
    "address": "76 allées Charles-de-Fitte, 31300 Toulouse",
    "description": "Librairie du musée : art moderne et contemporain, photo, design, graphisme, revues, jeunesse, publications maison, affiches. Mercredi-dimanche 12h-18h.",
    "website": "https://www.lesabattoirs.org/en/the-bookstore/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.lesabattoirs.org/en/the-bookstore/",
      "https://www.lesabattoirs.org/en/contact-us/",
      "https://www.herbot.fr/librairie-des-abattoirs/"
    ],
    "region": "occitanie",
    "origine": "v1",
    "verification_note": "Contact : librairie@lesabattoirs.org. La librairie accueille aussi des expositions (ex. Herbot, été 2025)."
  },
  {
    "id": "occitanie-25",
    "name": "Librairie Ombres Blanches",
    "city": "Toulouse",
    "address": "50 rue Léon Gambetta, 31000 Toulouse",
    "description": "Grande librairie indépendante fondée en 1975, 2 000 m², environ 130 000 titres dont beaux-arts et BD, avec café et galerie d'exposition. Lundi-jeudi 10h-19h, vendredi-samedi 10h-19h30.",
    "website": "https://www.ombres-blanches.fr/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.occitanielivre.fr/annuaire/ombres-blanches-librairie",
      "https://www.lejournaltoulousain.fr/occitanie/haute-garonne/toulouse/librairies-independantes-toulouse-315930/"
    ],
    "region": "occitanie",
    "origine": "v1",
    "verification_note": "Plusieurs entrées (33, 48, 50 rue Gambetta, 3 rue Mirepoix) : viser le rayon beaux-arts."
  },
  {
    "id": "occitanie-26",
    "name": "Librairie Le Père Duchêne",
    "city": "Toulouse",
    "address": "25 rue Pargaminières, 31000 Toulouse",
    "description": "Librairie ancienne et d'occasion ouverte en 2010 (achat-vente de livres anciens, littérature, histoire, arts, BD). Horaires non affichés.",
    "website": "https://librairielepereduchene.com/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://www.pagesjaunes.fr/pros/56298841",
      "https://www.livre-rare-book.com/d/1342325719"
    ],
    "region": "occitanie",
    "origine": "v1",
    "verification_note": "Bouquiniste : pas de dépôt d'éditions neuves. Adresse ajoutée (absente du brief).",
    "retired": true
  },
  {
    "id": "occitanie-27",
    "name": "Librairie, Antiquités, Brocante Alain Pons",
    "city": "Pinsaguel",
    "address": "1 bis avenue Lacroix-Falgarde, 31120 Pinsaguel",
    "description": "Librairie ancienne et brocante-antiquités au sud de Toulouse (débarras, achat de livres anciens). Mardi-vendredi 14h30-19h.",
    "website": "https://www.librairie-alain-pons.fr/",
    "type": "autre",
    "status": "active",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://www.librairie-alain-pons.fr/contact"
    ],
    "region": "occitanie",
    "origine": "v1",
    "verification_note": "Ville corrigée : Pinsaguel, pas Toulouse. Hors sujet (livres anciens/brocante).",
    "retired": true
  },
  {
    "id": "occitanie-28",
    "field_note": "ajouter Terra Nova à Toulouse !",
    "name": "Librairie Terra Nova",
    "city": "Toulouse",
    "address": "18 rue Léon Gambetta, 31000 Toulouse",
    "description": "Librairie indépendante depuis 2004, 125 m², environ 12 500 titres, orientée éditeurs indépendants (littérature française et étrangère, sciences humaines, jeunesse), avec espace café et rencontres. Mardi-samedi 10h-19h, dimanche 15h-19h.",
    "website": "https://librairie-terranova.fr/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://www.occitanielivre.fr/annuaire/terra-nova-librairie",
      "https://www.lejournaltoulousain.fr/occitanie/haute-garonne/toulouse/librairies-independantes-toulouse-315930/"
    ],
    "region": "occitanie",
    "origine": "ajout-2026",
    "verification_note": "Demande explicite de Jeanson. Contact : contact@librairie-terranova.fr, 05 61 21 17 47."
  },
  {
    "id": "occitanie-29",
    "name": "Librairie Floury Frères",
    "city": "Toulouse",
    "address": "36 rue de la Colombette, 31000 Toulouse",
    "description": "Librairie généraliste indépendante (1998), 140 m², 15 000 titres : littérature, sciences humaines, poésie, théâtre, beaux-arts, BD. Mardi-samedi 10h-19h30, dimanche 10h-13h.",
    "website": "http://librairie-floury.fr",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.occitanielivre.fr/annuaire/floury-freres-librairie"
    ],
    "region": "occitanie",
    "origine": "ajout-2026",
    "verification_note": "Quartier Saint-Aubin, proche de Terra Nova et Ombres Blanches."
  },
  {
    "id": "occitanie-30",
    "name": "Lieu-Commun, artist run space",
    "city": "Toulouse",
    "address": "25 rue d'Armagnac, 31500 Toulouse",
    "description": "Artist run space de 1 000 m² (ancienne usine de chemises, quartier Bonnefoy) : 450 m² d'exposition, ateliers d'artistes, studio son, résidence. Ouvert mercredi-samedi 14h-18h pendant les expositions, entrée libre.",
    "website": "https://lieu-commun.fr/",
    "type": "galerie-artist-run",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://lieu-commun.fr/contact/",
      "https://www.toulouse-tourisme.com/activite/lieu-commun-artist-run-space/"
    ],
    "region": "occitanie",
    "origine": "ajout-2026",
    "verification_note": "Aucun point de vente d'éditions vu sur le site : à demander (contact@lieu-commun.fr, 05 61 23 80 57)."
  },
  {
    "id": "occitanie-31",
    "name": "Librairie Privat",
    "city": "Toulouse",
    "address": "14 rue des Arts, 31000 Toulouse",
    "description": "Librairie indépendante historique de Toulouse, plus de 60 000 titres (BD, sciences humaines, beaux-arts, fonds régional). Lundi-samedi 10h-19h.",
    "website": "https://www.librairieprivat.com/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.lejournaltoulousain.fr/occitanie/haute-garonne/toulouse/librairies-independantes-toulouse-315930/",
      "https://www.grizette.com/librairie-a-toulouse-meilleures-adresses/"
    ],
    "region": "occitanie",
    "origine": "ajout-2026",
    "verification_note": "Vérifiée par deux articles de presse locale (2025), pas par le site officiel."
  },
  {
    "id": "occitanie-32",
    "name": "Le Comptoir du Rêve",
    "city": "Toulouse",
    "address": "25 rue de Rémusat, 31000 Toulouse",
    "description": "Librairie spécialisée BD, mangas et romans graphiques, plus de 60 000 références. Lundi-samedi 10h-12h30 / 13h30-19h.",
    "website": "",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://www.lejournaltoulousain.fr/occitanie/haute-garonne/toulouse/librairies-independantes-toulouse-315930/",
      "https://www.grizette.com/librairie-a-toulouse-meilleures-adresses/"
    ],
    "region": "occitanie",
    "origine": "ajout-2026",
    "verification_note": "Adresse donnée « 25-42 rue de Rémusat » par la presse : numéro à confirmer. Rayon BD indépendante non vérifié."
  },
  {
    "id": "occitanie-33",
    "name": "Sauramps Comédie (Le Triangle)",
    "city": "Montpellier",
    "address": "Galerie du Triangle, allée Jules Milhau, 34000 Montpellier",
    "description": "Magasin principal de Sauramps (1 600 m², près de la place de la Comédie). Entreprise en redressement judiciaire depuis le 15 juin 2026, bâtiment dégradé (zones condamnées), chiffre d'affaires divisé par 2,5 depuis 2021.",
    "website": "https://www.sauramps.com/",
    "type": "librairie-generaliste",
    "status": "doubtful",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://actualitte.com/article/132001/librairie/sauramps-en-redressement-judiciaire-la-librairie-historique-de-montpellier-joue-sa-survie",
      "https://fr.wikipedia.org/wiki/Sauramps"
    ],
    "region": "occitanie",
    "origine": "ajout-2026",
    "verification_note": "Piste « Sauramps généraliste » du brief : dépôt risqué (procédure collective, paiement des dépôts incertain). Adresse de rue non vérifiée."
  },
  {
    "id": "occitanie-34",
    "field_note": "Ateliers du Réservoir, à ajouter",
    "name": "Le Réservoir (galerie / ateliers)",
    "city": "Sète",
    "address": "34200 Sète",
    "description": "Galerie d'art contemporain sur les quais de Sète, référencée par le guide local Ici7 ; correspond probablement aux « Ateliers du Réservoir » cités par Jeanson. Adresse, horaires et vente d'éditions non trouvés.",
    "website": "https://icisete.fr/lieu/le-reservoir-sete/",
    "type": "galerie-artist-run",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://icisete.fr/lieu/le-reservoir-sete/"
    ],
    "region": "occitanie",
    "origine": "ajout-2026",
    "verification_note": "Seule trace en ligne accessible : fiche Ici7 sans adresse. Site officiel non trouvé (recherches web épuisées). À compléter sur place."
  },
  {
    "id": "occitanie-35",
    "field_note": "boutique du musée d'art brut ouverture en juin 26",
    "name": "La Coopérative – Musée Cérès Franco",
    "city": "Montolieu",
    "address": "5 route d'Alzonne, 11170 Montolieu",
    "description": "Musée (collection Cérès Franco, art brut/singulier) rouvert en 2026 dans l'ancienne cave coopérative réhabilitée, appellation Musée de France depuis le 1er décembre 2025. Mardi-dimanche 10h-12h30 / 14h-18h.",
    "website": "https://www.museeceresfranco.com/",
    "type": "musee",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.museeceresfranco.com/",
      "https://www.montolieu-livre.fr/musee-ceres-franco/la-cooperative-musee-ceres-franco/",
      "https://www.lartvues.com/montolieu-la-cooperative-musee-ceres-franco-obtient-lappellation-musee-de-france-et-rouvrira-ses-portes-en-2026/"
    ],
    "region": "occitanie",
    "origine": "ajout-2026",
    "verification_note": "Réouverture confirmée ; existence et fonctionnement de la boutique non vérifiés en ligne (info terrain : ouverture juin 2026)."
  },
  {
    "id": "occitanie-36",
    "name": "Librairie La Manufacture & Eclectic galerie",
    "city": "Montolieu",
    "address": "3 rue du 8 Mai 1945, 11170 Montolieu",
    "description": "Librairie-galerie de Montolieu listée par l'office de tourisme Grand Carcassonne (« Eclectic Librairie – Galerie », « Librairie La Manufacture ») et par ilibrairie.fr (3 rue du 8 Mai 1945).",
    "website": "",
    "type": "librairie-specialisee",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://ilibrairie.fr/11/montolieu/",
      "https://www.grand-carcassonne-tourisme.fr/votre-sejour-chez-nous/culture-art-patrimoine/montolieu-village-du-livre-ses-librairies-et-celles-autour/"
    ],
    "region": "occitanie",
    "origine": "ajout-2026",
    "verification_note": "Spécialité, horaires et lien avec le Pôle culturel de la Manufacture (20 impasse de la Manufacture, ouvert avril-octobre) non vérifiés."
  },
  {
    "id": "paca-1",
    "name": "Frac Sud – Cité de l'art contemporain (librairie-boutique)",
    "city": "Marseille",
    "address": "20 boulevard de Dunkerque, 13002 Marseille",
    "description": "Frac régional avec librairie-boutique accessible aux heures d'ouverture publiques : mercredi-samedi 12h-18h, dimanche 14h-18h, fermé jours fériés.",
    "website": "https://fracsud.org/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://fracsud.org/Adresse-et-horaires",
      "https://fracsud.org/Librairie-boutique"
    ],
    "region": "paca",
    "origine": "v1",
    "verification_note": "Page Librairie-boutique inaccessible (429) : contenu exact du fonds (éditions indépendantes ?) non vérifié."
  },
  {
    "id": "paca-2",
    "name": "Librairie-boutique du Mucem (J4, 1er étage)",
    "city": "Marseille",
    "address": "1 esplanade J4, 13002 Marseille",
    "description": "Librairie généraliste « aux couleurs de la Méditerranée » au 1er étage du J4 : sciences humaines, histoire, kiosque presse, photographie, BD, jeunesse. Gérée par Maupetit (Actes Sud) selon le site Maupetit.",
    "website": "https://mucem.org/en/the-mucem-bookshop-boutique/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://mucem.org/en/the-mucem-bookshop-boutique/",
      "https://www.maupetitlibraire.fr/"
    ],
    "region": "paca",
    "origine": "v1",
    "verification_note": "Horaires non indiqués sur la page ; librairie rattachée au groupe Actes Sud/Maupetit, dépôt à négocier via Maupetit."
  },
  {
    "id": "paca-3",
    "name": "Librairie des expositions du Mucem (J4, 2e étage)",
    "city": "Marseille",
    "address": "1 esplanade J4, 13002 Marseille",
    "description": "Espace au 2e étage du J4 dédié aux expositions en cours : catalogues d'exposition, magnets, cartes postales.",
    "website": "https://mucem.org/en/the-mucem-bookshop-boutique/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://mucem.org/en/the-mucem-bookshop-boutique/"
    ],
    "region": "paca",
    "origine": "v1",
    "verification_note": "Fonds limité aux catalogues du musée : peu de place pour un dépôt extérieur. Doublon fonctionnel de paca-2.",
    "retired": true
  },
  {
    "id": "paca-4",
    "name": "Maison Yellow au Mucem (concept-store éphémère, Fort Saint-Jean)",
    "city": "Marseille",
    "address": "Fort Saint-Jean, Mucem, 13002 Marseille",
    "description": "Pop-up store de la marque Ricard ouvert en 2025 au Fort Saint-Jean : objets Ricard, céramiques, textiles, confiserie. Aucun livre.",
    "website": "https://mucem.org/maison-yellow-au-mucem/",
    "type": "autre",
    "status": "doubtful",
    "fit": "non",
    "verified_address": false,
    "sources": [
      "https://mucem.org/maison-yellow-au-mucem/",
      "https://www.destimed.fr/marseille-le-mucem-accueille-maison-yellow-au-sein-dun-concept-store-ephemere"
    ],
    "region": "paca",
    "origine": "v1",
    "verification_note": "Décrit comme éphémère, dates de fin non trouvées ; adresse du brief (J4) inexacte, le pop-up est au Fort Saint-Jean. Hors sujet.",
    "retired": true
  },
  {
    "id": "paca-5",
    "name": "[mac] Musée d'art contemporain de Marseille – Centre de documentation Ernst Goldschmidt",
    "city": "Marseille",
    "address": "69 avenue de Haïfa, 13008 Marseille",
    "description": "Musée ouvert mardi-dimanche 9h-18h. Le centre de documentation est une bibliothèque consultable sur rendez-vous (mercredi 15h-17h, samedi 10h-12h) ; la page municipale ne mentionne aucune librairie-boutique.",
    "website": "https://musees.marseille.fr/musee-dart-contemporain-mac",
    "type": "mediatheque",
    "status": "active",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://musees.marseille.fr/musee-dart-contemporain-mac"
    ],
    "region": "paca",
    "origine": "v1",
    "verification_note": "Aucune boutique-librairie trouvée sur le site officiel : c'est un centre de documentation, pas un point de vente.",
    "retired": true
  },
  {
    "id": "paca-6",
    "name": "Zoème – galerie-librairie",
    "city": "Marseille",
    "address": "8 rue Vian, 13006 Marseille",
    "description": "Association fondée en 2017, maison d'édition, galerie photo et librairie spécialisée soutenant les éditeurs indépendants (poésie, photographie, théorie de l'art). Mardi-samedi 11h-19h.",
    "website": "https://zoeme.net",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://p-a-c.fr/les-membres/galerie-librairie-zoeme",
      "https://www.livre-provencealpescotedazur.fr/ressources/annuaire/etablissements/zoeme-184"
    ],
    "region": "paca",
    "origine": "v1",
    "verification_note": "Site zoeme.net non consulté directement (fiche PAC 2025-2026 consultée)."
  },
  {
    "id": "paca-7",
    "name": "Le Dernier Cri",
    "city": "Marseille",
    "address": "Friche la Belle de Mai, 41 rue Jobin, 13003 Marseille",
    "description": "Éditeur sérigraphe et galerie résident à la Friche depuis 1993 (graphzines, affiches, fanzines). Galerie ouverte toute l'année : lundi-vendredi 10h-12h / 14h-17h, samedi-dimanche 14h-18h, entrée libre ; boutique en ligne.",
    "website": "https://www.lederniercri.org/",
    "type": "atelier-editeur",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://www.lafriche.org/la-friche/lieux/le-dernier-cri/",
      "https://www.lederniercri.org/en/contact/"
    ],
    "region": "paca",
    "origine": "v1",
    "verification_note": "Horaires issus de la page Friche ; le site LDC ne les précise pas. Vente sur place de tiers non confirmée (éditeur avant tout)."
  },
  {
    "id": "paca-8",
    "field_note": "rdv demain (2026-05-12)",
    "name": "Librairie de la Friche (La Salle des machines)",
    "city": "Marseille",
    "address": "Friche la Belle de Mai, 41 rue Jobin, 13003 Marseille",
    "description": "Librairie de la Friche spécialisée création contemporaine (art, photo, graphisme, architecture, cultures urbaines, street art) plus jeunesse et BD. Lundi 11h-18h, mardi-samedi 11h-19h, dimanche 13h-19h. Membre Libraires du Sud.",
    "website": "https://www.lafriche.org/infos-pratiques/librairie/",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://www.lafriche.org/infos-pratiques/librairie/",
      "https://www.librairesdusud.com/portfolio-item/librairie-salle-machines/"
    ],
    "region": "paca",
    "origine": "v1",
    "verification_note": "Aucune."
  },
  {
    "id": "paca-9",
    "field_note": "contacté (2026-05-12)",
    "name": "Studio Fotokino",
    "city": "Marseille",
    "address": "33 allée Léon Gambetta, 13001 Marseille",
    "description": "Lieu d'arts visuels avec éditions maison (livres « du catalogue monographique au zine », risographies, affiches, sérigraphies) vendues sur place et sur shop-fotokino.com. Ouvert mercredi-dimanche 14h-18h30 pendant les expositions.",
    "website": "https://fotokino.org/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://fotokino.org/en/studio-fotokino/",
      "https://shop-fotokino.com/"
    ],
    "region": "paca",
    "origine": "v1",
    "verification_note": "Vente d'éditions d'autres structures non explicitement confirmée."
  },
  {
    "id": "paca-10",
    "field_note": "j'ai un peu la flemme c'est loin (2026-05-12)",
    "name": "Librairie Pantagruel",
    "city": "Marseille",
    "address": "44 rue Paul Codaccioni, 13007 Marseille",
    "description": "Librairie généraliste indépendante de quartier (70 m², ~8 000 références, forte part jeunesse, café sur place). Mardi-samedi 10h-19h, dimanche 10h-13h.",
    "website": "https://www.facebook.com/librairiepantagruel/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://tarpin-bien.com/lieu/librairie-pantagruel/",
      "https://fr.mappy.com/poi/588d19b80351d117d7ea7f5b"
    ],
    "region": "paca",
    "origine": "v1",
    "verification_note": "Pas de site propre trouvé ; adresse ajoutée (le brief n'avait que l'arrondissement)."
  },
  {
    "id": "paca-12",
    "field_note": "0 / j'ai pas assez regardé les livres pour donner un conseil, mais doit y avoir moyen (2026-06-01)",
    "name": "Librairie Offprint (LUMA Arles, Hôtel L'Arlatan)",
    "city": "Arles",
    "address": "14 rue du Docteur Fanton, 13200 Arles",
    "description": "Librairie d'Offprint (plateforme d'éditeurs indépendants) installée à l'Hôtel L'Arlatan en centre-ville : livres d'art, design, photo, éditions indépendantes et alternatives, zines, affiches, objets d'artistes.",
    "website": "https://luma.org/en/arles/about/offprint",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://luma.org/en/arles/about/offprint",
      "https://www.livre-provencealpescotedazur.fr/la-vie-du-livre/actualites/offprint-la-librairie-de-luma-arles-2262"
    ],
    "region": "paca",
    "origine": "v1",
    "verification_note": "L'adresse du brief (35 av. Victor Hugo = Parc des Ateliers) est corrigée : la librairie permanente est à L'Arlatan ; un pop-up existe aussi à LUMA lors des Rencontres. Horaires non trouvés."
  },
  {
    "id": "paca-13",
    "field_note": "3 (2026-06-01)",
    "name": "Librairie du Palais",
    "city": "Arles",
    "address": "10 rue du Plan de la Cour, 13200 Arles",
    "description": "Librairie-galerie de photographie (éditeurs indépendants, artistes émergents, livres anciens) avec atelier de risographie sur place. Sept.-juin mardi-samedi 10h-18h ; juillet-août tous les jours 10h30-19h30.",
    "website": "https://www.librairiedupalais.fr/",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://www.librairiedupalais.fr/librairie-arles/",
      "https://arles-contemporain.com/librairie-du-palais/"
    ],
    "region": "paca",
    "origine": "v1",
    "verification_note": "Aucune."
  },
  {
    "id": "paca-14",
    "field_note": "Généraliste (2026-05-12)",
    "name": "Les Grandes Largeurs",
    "city": "Arles",
    "address": "11 rue Réattu, 13200 Arles",
    "description": "Librairie indépendante généraliste du centre historique (littérature, sciences humaines, BD, beaux-arts, jeunesse), événements en sous-sol. Mardi-samedi 10h-19h.",
    "website": "https://www.lesgrandeslargeurs.com/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.lesgrandeslargeurs.com/"
    ],
    "region": "paca",
    "origine": "v1",
    "verification_note": "Aucune."
  },
  {
    "id": "paca-15",
    "name": "Librairie Actes Sud (Le Méjan)",
    "city": "Arles",
    "address": "Place Nina Berberova, 13200 Arles",
    "description": "Librairie généraliste de l'éditeur Actes Sud, 300 m², ~40 000 titres, rayon musique, rencontres au Méjan. Lundi 14h-19h30, mardi-samedi 9h30-19h30.",
    "website": "https://www.librairieactessud.com/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.librairesdusud.com/portfolio-item/librairie-actes-sud/",
      "https://actes-sud.fr/page/librairies-actes-sud"
    ],
    "region": "paca",
    "origine": "v1",
    "verification_note": "Librairie d'éditeur (pas une chaîne) mais politique de dépôt inconnue."
  },
  {
    "id": "paca-16",
    "name": "Villa Arson – librairie",
    "city": "Nice",
    "address": "20 avenue Stephen Liégeard, 06105 Nice",
    "description": "Centre national d'art contemporain et école d'art ; librairie à l'entrée des expositions vendant les éditions Villa Arson (dirigées par Alice Dusapin depuis 2024) et un shop en ligne. Ouvert tous les après-midi 14h-18h (19h en juillet-août).",
    "website": "https://villa-arson.fr/editions/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://villa-arson.fr/editions/",
      "https://bookshop.villa-arson.org/"
    ],
    "region": "paca",
    "origine": "v1",
    "verification_note": "Site bookshop non accessible ; fonds d'éditions extérieures non confirmé."
  },
  {
    "id": "paca-17",
    "name": "Librairie-Galerie Laure Matarasso",
    "city": "Nice",
    "address": "46 boulevard Risso (dans le passage), 06300 Nice",
    "description": "Librairie-galerie spécialisée livres d'artistes, éditions et expositions (éditions Matarasso). Mardi-vendredi 14h30-18h30, samedi 11h-16h30, sur rendez-vous en dehors.",
    "website": "https://www.laure-matarasso.com/",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://www.laure-matarasso.com/contact/",
      "https://www.editionsdartfma.com/post/librairie-galerie-laure-matarasso"
    ],
    "region": "paca",
    "origine": "v1",
    "verification_note": "Aucune."
  },
  {
    "id": "paca-18",
    "name": "MAMAC – librairie-boutique",
    "city": "Nice",
    "address": "Place Yves Klein, 06300 Nice",
    "description": "Musée fermé depuis le 7 janvier 2024 pour rénovation, réouverture visée en 2028 ; programmation hors les murs. Pas de boutique accessible.",
    "website": "https://www.mamac-nice.org/",
    "type": "musee",
    "status": "closed",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://www.mamac-nice.org/actualite/un-nouveau-mamac/",
      "https://www.mamac-nice.org/en/evenement/2024-2028/"
    ],
    "region": "paca",
    "origine": "v1",
    "verification_note": "Fermeture temporaire (travaux) ; à réévaluer en 2028.",
    "retired": true
  },
  {
    "id": "paca-19",
    "name": "Evrlst Lifestore",
    "city": "Nice",
    "address": "4 rue du Lycée, 06000 Nice",
    "description": "Concept store seconde main : vinyles, déco, bijoux, vintage. Mardi-samedi 12h-19h. Pas de rayon livres/éditions mentionné.",
    "website": "https://evrlst.fr/",
    "type": "autre",
    "status": "active",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://nice.love-spots.com/en/spots/culture-en/bookstore-record-shop/80003-evrlst-lifestore.html",
      "https://evrlst.fr/"
    ],
    "region": "paca",
    "origine": "v1",
    "verification_note": "Fit non faute de point de vente de livres identifié.",
    "retired": true
  },
  {
    "id": "paca-20",
    "name": "Shababik",
    "city": "Nice",
    "address": "10 rue Benoît Bunico, 06300 Nice",
    "description": "Concept store levantin (artisanat Moyen-Orient/Afrique du Nord), café-bar à vin, espace d'exposition, quelques livres (18-45 €). Mardi-samedi 11h-19h.",
    "website": "https://www.shababik.shop/",
    "type": "autre",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://nice.love-spots.com/en/spots/out-about-spots/bars-en/100362-shababik.html",
      "https://www.shababik.shop/pages/contact"
    ],
    "region": "paca",
    "origine": "v1",
    "verification_note": "Rayon livres marginal et thématique ; pertinence faible."
  },
  {
    "id": "paca-21",
    "name": "Ose Décoration",
    "city": "Nice",
    "address": "1 rue Raynardi, 06000 Nice",
    "description": "Concept store de décoration (lampes, vases, papeterie, livres de cuisine). Mardi-dimanche 11h-19h.",
    "website": "https://nice.love-spots.com/en/spots/shopping-en/decoration-furniture/82255-ose-decoration.html",
    "type": "autre",
    "status": "active",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://nice.love-spots.com/en/spots/shopping-en/decoration-furniture/82255-ose-decoration.html",
      "https://fr.kompass.com/c/ose/fra0294nj/"
    ],
    "region": "paca",
    "origine": "v1",
    "verification_note": "Hors sujet (déco).",
    "retired": true
  },
  {
    "id": "paca-22",
    "field_note": "Pas sympas (2026-05-12)",
    "name": "Collection Lambert – librairie",
    "city": "Avignon",
    "address": "5 rue Violette, 84000 Avignon",
    "description": "Librairie du musée : catalogues coédités, monographies, essais, revues d'art contemporain, multiples d'artistes numérotés. Libraire : Christophe Martin.",
    "website": "https://collectionlambert.com/librairie/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://collectionlambert.com/librairie/"
    ],
    "region": "paca",
    "origine": "v1",
    "verification_note": "Horaires non indiqués sur la page librairie."
  },
  {
    "id": "paca-23",
    "name": "Villa Noailles – boutique",
    "city": "Hyères",
    "address": "Montée Noailles, 83400 Hyères",
    "description": "Boutique du centre d'art (design, mode, objets, éditions) aménagée par Pierre Yovanovitch, entrée libre ; mardi-dimanche 14h-19h, jeudi 15h-21h, fermée lundi. Boutique physique annoncée du 11 juillet au 20 septembre (saison), boutique en ligne toute l'année.",
    "website": "https://villanoailles.com/expositions/un-ete-a-hyeres/boutique-villa-noailles",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://villanoailles.com/expositions/un-ete-a-hyeres/boutique-villa-noailles",
      "https://shop.villanoailles-hyeres.com/"
    ],
    "region": "paca",
    "origine": "v1",
    "verification_note": "Ouverture hors saison estivale à vérifier ; fonds livres non détaillé."
  },
  {
    "id": "paca-24",
    "name": "Metaxu – espace d'artistes",
    "city": "Toulon",
    "address": "26-28-30 rue Nicolas Laugier, 83000 Toulon",
    "description": "Galerie/espace d'artistes indépendant ; organise PRJNT, sessions de fabrication de fanzines et micro-éditions (photocopieuse laser, ateliers) sur des week-ends ponctuels (2022, 2024).",
    "website": "https://www.metaxu.fr/",
    "type": "galerie-artist-run",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.metaxu.fr/prjnt",
      "https://www.cnap.fr/annuaire/lieu/metaxu"
    ],
    "region": "paca",
    "origine": "v1",
    "verification_note": "Pas de boutique permanente attestée ; horaires non trouvés ; activité 2025-2026 non confirmée."
  },
  {
    "id": "paca-25",
    "field_note": "Pas trouvé (2026-05-12)",
    "name": "La Caravane des Créateurs",
    "city": "Saint-Rémy-de-Provence",
    "address": "4 rue Carnot, 13210 Saint-Rémy-de-Provence",
    "description": "Collectif de créateurs/artisans provençaux (bijoux, vêtements, luminaires, textile, mobilier, déco), ouvert 10h-19h avec calendrier saisonnier. Aucun livre.",
    "website": "https://lacaravanedescreateurs.wordpress.com/",
    "type": "autre",
    "status": "active",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://www.alpillesenprovence.com/en/fiches/la-caravane-des-createurs/"
    ],
    "region": "paca",
    "origine": "v1",
    "verification_note": "Un annuaire donne le 6 rue Carnot ; l'office de tourisme donne le 4. Hors sujet (artisanat sans livres).",
    "retired": true
  },
  {
    "id": "paca-26",
    "name": "L'Archa des Carmes",
    "city": "Arles",
    "address": "23 rue des Carmes, 13200 Arles",
    "description": "Librairie-galerie de 70 m² dédiée aux catalogues de petits éditeurs, à la poésie et aux livres d'artistes (neuf, occasion, rare), rencontres et expositions. Gérant : Pierre Besson.",
    "website": "https://archadescarmes.com/",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://www.livre-provencealpescotedazur.fr/ressources/annuaire/etablissements/librairie-larcha-des-carmes-126",
      "https://www.livre-provencealpescotedazur.fr/blog/l-archa-des-carmes-librairie-mais-pas-que-2169"
    ],
    "region": "paca",
    "origine": "ajout-2026",
    "verification_note": "Demandée par Jeanson (note de tronçon). Horaires non trouvés ; site archadescarmes.com non consultable."
  },
  {
    "id": "paca-27",
    "name": "Histoire de l'Œil",
    "city": "Marseille",
    "address": "25 rue Fontange, 13006 Marseille",
    "description": "Librairie indépendante, galerie et café dédiés aux formes contemporaines et aux éditions indépendantes ; rencontres et expositions. Mardi-samedi 10h-19h (été : 10h-13h / 16h-19h).",
    "website": "https://www.histoiredeloeil.com/",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://www.histoiredeloeil.com/",
      "https://www.librairesdusud.com/portfolio-item/librairie-histoire-de-loeil/"
    ],
    "region": "paca",
    "origine": "ajout-2026",
    "verification_note": "Adresse issue de Yelp/PagesJaunes (le site ne l'affiche pas dans l'extrait)."
  },
  {
    "id": "paca-28",
    "name": "Rupture & Imbernon (Librairie Imbernon)",
    "city": "Marseille",
    "address": "Cité Radieuse Le Corbusier, 3e étage, 280 boulevard Michelet, 13009 Marseille",
    "description": "Librairie-éditeur d'architecture, art et design dans la Cité Radieuse, devenue « Rupture Arts & Books ». Lundi-samedi 10h-13h / 14h30-18h30, dimanche 10h-14h (mardi-samedi en basse saison).",
    "website": "https://marseille.love-spots.com/en/spots/shopping-en/bookstore-record-shop/210039-rupture-imbernon.html",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://marseille.love-spots.com/en/spots/shopping-en/bookstore-record-shop/210039-rupture-imbernon.html",
      "https://toutma.fr/rupture-imbernon-editeur-librairie-specialise-en-architecture-a-la-cite-radieuse"
    ],
    "region": "paca",
    "origine": "ajout-2026",
    "verification_note": "Pas de site officiel consulté ; horaires issus d'un guide."
  },
  {
    "id": "paca-29",
    "name": "Tchikebe",
    "city": "Marseille",
    "address": "2 bis rue Duverger, 13002 Marseille",
    "description": "Coopérative d'artisans d'art : atelier de sérigraphie et d'impression d'éditions signées/numérotées avec des artistes contemporains (Viallat, Messager, Childress…), encadrement.",
    "website": "https://www.tchikebe.com/",
    "type": "atelier-editeur",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.tchikebe.com/"
    ],
    "region": "paca",
    "origine": "ajout-2026",
    "verification_note": "Horaires et ouverture au public non indiqués sur le site ; pas de librairie attestée (estampes surtout)."
  },
  {
    "id": "paca-30",
    "name": "Vidéodrome 2",
    "city": "Marseille",
    "address": "49 cours Julien, 13006 Marseille",
    "description": "Cinéma associatif, vidéoclub, librairie et bistrot. Mardi-mercredi 18h30-0h30, jeudi-samedi 17h30-1h30, dimanche 18h30-23h30 ; vidéothèque mardi-samedi 18h30-20h.",
    "website": "https://www.videodrome2.fr/",
    "type": "autre",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.videodrome2.fr/"
    ],
    "region": "paca",
    "origine": "ajout-2026",
    "verification_note": "La librairie est mentionnée sans détail sur son fonds (cinéma probablement)."
  },
  {
    "id": "paca-31",
    "name": "Librairie Maupetit",
    "city": "Marseille",
    "address": "142 La Canebière, 13001 Marseille",
    "description": "Grande librairie généraliste (littérature, jeunesse, BD, sciences humaines, beaux-arts) appartenant au groupe Actes Sud, annexe papeterie au 128 La Canebière et point de vente au Mucem. Ouverture 10h.",
    "website": "https://www.maupetitlibraire.fr/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.maupetitlibraire.fr/"
    ],
    "region": "paca",
    "origine": "ajout-2026",
    "verification_note": "Librairie du groupe Actes Sud, pas une chaîne au sens Fnac ; politique de dépôt inconnue."
  },
  {
    "id": "paca-32",
    "name": "La Mémoire du Monde",
    "city": "Avignon",
    "address": "36 rue Carnot, 84000 Avignon",
    "description": "Librairie indépendante depuis 1974 : littérature, poésie, sciences humaines, art, avec une sélection de petits éditeurs ; rencontres et signatures. Mardi-samedi 10h-19h.",
    "website": "https://www.lamemoiredumonde.fr/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.lamemoiredumonde.fr/"
    ],
    "region": "paca",
    "origine": "ajout-2026",
    "verification_note": "Aucune."
  },
  {
    "id": "paca-33",
    "name": "3bisF – centre d'arts contemporains",
    "city": "Aix-en-Provence",
    "address": "Hôpital Montperrin, 109 avenue du Petit Barthélémy, 13100 Aix-en-Provence",
    "description": "Centre d'art et résidences dans l'enceinte de l'hôpital psychiatrique Montperrin ; expositions mardi-samedi 14h-18h. Aucune boutique mentionnée sur le site.",
    "website": "https://www.3bisf.com/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://www.3bisf.com/"
    ],
    "region": "paca",
    "origine": "ajout-2026",
    "verification_note": "Adresse postale non affichée sur la page consultée (conservée du savoir général, non vérifiée) ; pas de point de vente attesté, à confirmer sur place."
  },
  {
    "id": "corse-1",
    "name": "FRAC Corsica",
    "city": "Corte",
    "address": "La Citadelle, 20250 Corti",
    "description": "Fonds régional d'art contemporain installé dans la citadelle de Corte. Horaires : lun-ven 14h-20h (jeu jusqu'à 21h), sam 10h-14h. Expositions en cours en 2026 (« Atlantropa n'aura pas lieu », 30/04-17/10/2026). Le site ne mentionne aucune boutique ni vente d'éditions.",
    "website": "https://frac.isula.corsica/fr",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://frac.isula.corsica/fr"
    ],
    "region": "corse",
    "origine": "v1",
    "verification_note": "Existence d'un point de vente non confirmée : à demander sur place ou par mail. Fit « possible » uniquement au titre de centre d'art institutionnel."
  },
  {
    "id": "corse-2",
    "name": "Musée de la Corse (Museu di a Corsica) — boutique",
    "city": "Corte",
    "address": "La Citadelle, 20250 Corti",
    "description": "Musée d'anthropologie de la Corse dans la citadelle. La boutique vend catalogues d'exposition, carnets d'anthropologie, éditions jeunesse, affiches, souvenirs (tél. 04 95 45 25 30) ; horaires calqués sur ceux du musée.",
    "website": "https://www.museudiacorsica.corsica/en/shop/",
    "type": "musee",
    "status": "active",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://www.museudiacorsica.corsica/en/shop/"
    ],
    "region": "corse",
    "origine": "v1",
    "verification_note": "Boutique de musée ethnographique orientée publications institutionnelles et souvenirs : pas un lieu de diffusion de micro-édition d'artiste.",
    "retired": true
  },
  {
    "id": "corse-3",
    "field_note": "2026-05-12 : « ça j'y vais pas, ce sera quand on me paiera pour finir le site web » / « ou au gré de mes trajets »",
    "name": "Palais Fesch – Musée des Beaux-Arts (boutique)",
    "city": "Ajaccio",
    "address": "50-52 rue Cardinal Fesch, 20000 Ajaccio",
    "description": "Musée des beaux-arts (peinture italienne, collection Fesch). Ouvert tous les jours 9h15-18h (mai-oct) / 9h-17h (nov-avr), fermé 1er-15 janvier. Boutique (en ligne sur boutiquefesch.goodbarber.app) : catalogues, livres d'art sur les collections, textile, goodies.",
    "website": "https://www.musee-fesch.com/",
    "type": "musee",
    "status": "active",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://www.musee-fesch.com/",
      "https://www.musee-fesch.com/infos-pratiques",
      "https://boutiquefesch.goodbarber.app/"
    ],
    "region": "corse",
    "origine": "v1",
    "verification_note": "Boutique de musée classique orientée produits dérivés/catalogues maison, pas d'éditions indépendantes visibles. Jeanson a lui-même indiqué qu'il n'irait pas.",
    "retired": true
  },
  {
    "id": "corse-4",
    "name": "Musée de Bastia (boutique)",
    "city": "Bastia",
    "address": "Place du Donjon, La Citadelle, 20200 Bastia",
    "description": "Musée d'histoire de Bastia dans le Palais des Gouverneurs. Haute saison (2 mai-30 sept) 10h-18h30 ; basse saison 9h-12h / 14h-17h, fermé dim-lun. Le site propose une rubrique boutique « Publications » (éditions du musée).",
    "website": "https://musee.bastia.corsica/",
    "type": "musee",
    "status": "active",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://musee.bastia.corsica/"
    ],
    "region": "corse",
    "origine": "v1",
    "verification_note": "Boutique limitée aux publications du musée : hors cible micro-édition.",
    "retired": true
  },
  {
    "id": "corse-5",
    "name": "Musée Départemental de Préhistoire et d'Archéologie de Sartène",
    "city": "Sartène",
    "address": "Bd Jacques Nicolaï, 20100 Sartène",
    "description": "Musée d'archéologie préhistorique. Aucune page consultée ne signale une librairie-boutique.",
    "website": "",
    "type": "musee",
    "status": "unverified",
    "fit": "non",
    "verified_address": false,
    "sources": [],
    "region": "corse",
    "origine": "v1",
    "verification_note": "Non vérifié en ligne (site officiel non atteint). Hors sujet par nature (préhistoire, pas d'art contemporain ni de librairie).",
    "retired": true
  },
  {
    "id": "corse-6",
    "name": "MUDACC – Musée des Arts de la Citadelle de Calvi",
    "city": "Calvi",
    "address": "Citadelle de Calvi, 20260 Calvi",
    "description": "Musée municipal d'art dans la citadelle de Calvi. Aucune page consultée ne confirme une boutique-librairie.",
    "website": "",
    "type": "musee",
    "status": "unverified",
    "fit": "non",
    "verified_address": false,
    "sources": [],
    "region": "corse",
    "origine": "v1",
    "verification_note": "Page officielle non trouvée (calvi.fr/mudacc renvoie 404). À rétrograder en « possible » seulement si une boutique est confirmée.",
    "retired": true
  },
  {
    "id": "corse-7",
    "name": "Galerie Noir et Blanc",
    "city": "Bastia",
    "address": "2 rue Cardinal Viale Prelà (place du Marché), 20200 Bastia",
    "description": "Galerie associative ouverte en 2018, 300 m² sur deux niveaux place du Marché, ~110 artistes locaux (peinture, sculpture, photo, dessin, céramique, bijoux) ; expositions mensuelles et trois festivals annuels dont le Festival d'art actuel de Bastia. Prochaine exposition annoncée à partir du 17 septembre.",
    "website": "https://www.galerie-noir-blanc.corsica/",
    "type": "galerie-artist-run",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.galerie-noir-blanc.corsica/",
      "https://www.visit-corsica.com/fr/Mon-sejour/Artisans-d-art/Tous-les-artisans-d-art/GALERIE-NOIR-ET-BLANC",
      "https://www.artistescontemporains.org/lieux_dart/galerie-noir-et-blanc-bastia/",
      "https://www.corsenetinfos.corsica/Bastia-L-annee-debute-avec-15-artistes-a-la-Galerie-Noir-et-Blanc_a75826.html"
    ],
    "region": "corse",
    "origine": "v1",
    "verification_note": "Aucune vente de livres/éditions mentionnée ; galerie d'art « classique » avec une rubrique « billets artistiques ». Fit possible au titre d'artist-run space qui vend des œuvres."
  },
  {
    "id": "corse-8",
    "name": "Art Gallery Porto Vecchio",
    "city": "Porto-Vecchio",
    "address": "18 rue Camille de Rocca Serra, 20137 Porto-Vecchio",
    "description": "Galerie commerciale de Porto-Vecchio. Aucune page consultée.",
    "website": "",
    "type": "autre",
    "status": "unverified",
    "fit": "non",
    "verified_address": false,
    "sources": [],
    "region": "corse",
    "origine": "v1",
    "verification_note": "Non vérifié. Galerie touristique sans indice de vente d'éditions ; exclu par sévérité.",
    "retired": true
  },
  {
    "id": "corse-9",
    "name": "Galerie Du Levant",
    "city": "Porto-Vecchio",
    "address": "17 rue Général de Gaulle, 20137 Porto-Vecchio",
    "description": "Galerie commerciale de Porto-Vecchio. Aucune page consultée.",
    "website": "",
    "type": "autre",
    "status": "unverified",
    "fit": "non",
    "verified_address": false,
    "sources": [],
    "region": "corse",
    "origine": "v1",
    "verification_note": "Non vérifié. Même remarque que corse-8.",
    "retired": true
  },
  {
    "id": "corse-10",
    "name": "De Renava – Biennale d'art contemporain de Bonifacio",
    "city": "Bonifacio",
    "address": "Caserne Montlaur, Haute Ville, 20169 Bonifacio",
    "description": "Biennale d'art contemporain, événement saisonnier (été) et non lieu permanent avec point de vente.",
    "website": "",
    "type": "autre",
    "status": "unverified",
    "fit": "non",
    "verified_address": false,
    "sources": [],
    "region": "corse",
    "origine": "v1",
    "verification_note": "Site derenava.com non joignable. Événement biennal, pas de dépôt-vente permanent possible.",
    "retired": true
  },
  {
    "id": "corse-11",
    "name": "Galerie Archipel",
    "city": "Ajaccio",
    "address": "Citadelle Miollis, boulevard Fred Scamaroni, 20000 Ajaccio",
    "description": "Galerie mentionnée dans la citadelle Miollis d'Ajaccio. Aucune page consultée ne l'atteste.",
    "website": "",
    "type": "autre",
    "status": "unverified",
    "fit": "non",
    "verified_address": false,
    "sources": [],
    "region": "corse",
    "origine": "v1",
    "verification_note": "Non vérifié (recherche corsenetinfos sans résultat). Exclu par sévérité.",
    "retired": true
  },
  {
    "id": "corse-12",
    "name": "L'Étrange Atelier",
    "city": "Ajaccio",
    "address": "Rue Montenotte, Tour Napoléon, 20000 Ajaccio",
    "description": "Atelier-boutique d'artisanat. Aucune page consultée.",
    "website": "",
    "type": "autre",
    "status": "unverified",
    "fit": "non",
    "verified_address": false,
    "sources": [],
    "region": "corse",
    "origine": "v1",
    "verification_note": "Non vérifié ; atelier d'artisanat sans indice de vente de livres.",
    "retired": true
  },
  {
    "id": "corse-13",
    "name": "Espace Farel Créations",
    "city": "Ajaccio",
    "address": "1 rue Barrière, 20000 Ajaccio",
    "description": "Boutique de créations artisanales. Aucune page consultée.",
    "website": "",
    "type": "autre",
    "status": "unverified",
    "fit": "non",
    "verified_address": false,
    "sources": [],
    "region": "corse",
    "origine": "v1",
    "verification_note": "Non vérifié ; artisanat sans livres.",
    "retired": true
  },
  {
    "id": "corse-14",
    "name": "Librairie La Marge",
    "city": "Ajaccio",
    "address": "4 rue Emmanuel Arène, 20000 Ajaccio",
    "description": "Librairie indépendante généraliste labellisée LiR (mise en avant par le CNL), rayons voyage, art, sciences humaines, littérature corse, jeunesse, BD ; forte place aux éditions corses. Lun-sam 9h-19h30 ; contact@lamarge.corsica, 04 95 51 23 67. Société SARL Librairie Caro, active.",
    "website": "https://librairie-lamarge.fr/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://librairie-lamarge.fr/contact",
      "https://centrenationaldulivre.fr/actualites/les-librairies-de-votre-region-corse",
      "https://www.pappers.fr/entreprise/librairie-caro-481843993",
      "https://ilibrairie.fr/2A/ajaccio/librairie-la-marge-n4"
    ],
    "region": "corse",
    "origine": "v1",
    "verification_note": "Meilleure cible de l'île. Pas de mention explicite de fanzines/micro-édition, mais rayon art et éditeurs locaux en dépôt."
  },
  {
    "id": "corse-15",
    "name": "Librairie des Palmiers – Libraria di I Palmi",
    "city": "Ajaccio",
    "address": "2 place Foch, 20000 Ajaccio",
    "description": "Librairie-papeterie-presse indépendante (SGEC Corse) place Foch. Lun-sam 8h-12h30 / 14h30-19h30 (ven jusqu'à 23h), dim 9h-12h30. Accueille des événements (Printemps des poètes).",
    "website": "https://www.instagram.com/lalibrairiedespalmiers/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.les-horaires.info/librairie-des-palmiers-ajaccio-307407.html",
      "https://ilibrairie.fr/2A",
      "https://agenda.printempsdespoetes.com/evenements/librairie-des-palmiers/"
    ],
    "region": "corse",
    "origine": "v1",
    "verification_note": "ilibrairie.fr donne 4 av. Antoine Sérafini (même angle). Profil librairie-papeterie-presse : fit plus faible que La Marge."
  },
  {
    "id": "corse-16",
    "name": "Alma Librairie",
    "city": "Bastia",
    "address": "27 boulevard Paoli, 20200 Bastia",
    "description": "Librairie indépendante ouverte le 8 septembre 2021 par d'anciens salariés d'Album (Olivier Rivollier, Christophe Di Caro) ; ~10 000 références, ~20 % de fonds corse, partenariats avec les éditeurs insulaires (Albiana, Clémentine, Piazzola), espace dédicaces, lien avec le centre culturel Una Volta. Tél. 04 95 55 98 27.",
    "website": "https://www.almalivres.com/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.corsenetinfos.corsica/A-Bastia-la-nouvelle-librairie-Alma-a-ouvert-ses-portes_a59973.html",
      "https://agenda.bastia.corsica/lieux/alma-librairie/",
      "https://www.pagesjaunes.fr/annuaire/region/corse/librairies"
    ],
    "region": "corse",
    "origine": "v1",
    "verification_note": "Site almalivres.com non joignable au moment de la recherche ; horaires non trouvés. Principale librairie de Bastia."
  },
  {
    "id": "corse-17",
    "name": "Librairie Les Deux Mondes",
    "city": "Bastia",
    "address": "10 rue Napoléon, 20200 Bastia",
    "description": "Librairie fermée : l'établissement du 10 rue Napoléon est clos depuis mars 2022 (et celui du 8 bd Paoli depuis janvier 2013) ; la société DIANE qui la portait exploite désormais des magasins de chaussures/vêtements (Tiffosi).",
    "website": "",
    "type": "librairie-generaliste",
    "status": "closed",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://www.pappers.fr/entreprise/diane-513653717",
      "https://www.horairesdouverture24.fr/filiale/Bastia-Librairie%2520Les%2520Deux%2520Mondes-636549G.html"
    ],
    "region": "corse",
    "origine": "v1",
    "verification_note": "Fermeture attestée par le registre des établissements (Pappers).",
    "retired": true
  },
  {
    "id": "corse-18",
    "name": "Librairie A Piuma Lesta",
    "city": "Bastia",
    "address": "Centre commercial Le Polygone, Résidence Montesoro, 20600 Bastia",
    "description": "Librairie indépendante (SARL créée en 2017) à dominante jeunesse, dans un centre commercial de Montesoro. Mar-sam 9h30-18h30. Tél. 04 95 62 04 66.",
    "website": "https://www.facebook.com/apiumalesta/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://agenda.bastia.corsica/lieux/librairie-a-piuma-lesta/",
      "https://ilibrairie.fr/2b/bastia/librairie-a-piuma-lesta-4j9",
      "https://www.rue-des-livres.com/librairie/371/a_piuma_lesta.html"
    ],
    "region": "corse",
    "origine": "v1",
    "verification_note": "Le domaine apiumalesta.com indiqué par l'agenda de Bastia renvoie aujourd'hui vers un site de casino (domaine récupéré) : ne pas l'utiliser. Librairie jeunesse en galerie commerciale : fit faible."
  },
  {
    "id": "corse-19",
    "name": "Librairie Caro (= Librairie La Marge)",
    "city": "Ajaccio",
    "address": "4 rue Emmanuel Arène, 20000 Ajaccio",
    "description": "Doublon : « Librairie Caro » est la raison sociale (SARL, SIREN 481 843 993) de la Librairie La Marge, même adresse, même site. Les annuaires la listent deux fois.",
    "website": "https://librairie-lamarge.fr/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://www.pappers.fr/entreprise/librairie-caro-481843993",
      "https://www.mylibrairie.fr/2A/ajaccio/librairie-caro-178480",
      "https://ilibrairie.fr/2A/ajaccio/librairie-la-marge-n4"
    ],
    "region": "corse",
    "origine": "v1",
    "verification_note": "Fit « non » uniquement parce que doublon de corse-14 ; à fusionner.",
    "retired": true
  },
  {
    "id": "corse-20",
    "name": "Mag Presse",
    "city": "Propriano",
    "address": "Propriano",
    "description": "Enseigne de presse (réseau Mag Presse) : point presse/tabac, pas une librairie indépendante.",
    "website": "",
    "type": "autre",
    "status": "unverified",
    "fit": "non",
    "verified_address": false,
    "sources": [],
    "region": "corse",
    "origine": "v1",
    "verification_note": "Hors cible (chaîne de presse). Non vérifié, à supprimer.",
    "retired": true
  },
  {
    "id": "corse-21",
    "name": "Galerie Bel'Arti",
    "city": "Calvi",
    "address": "Route de Pietramaggiore, 20260 Calvi",
    "description": "Galerie d'art commerciale en périphérie de Calvi. Aucune page consultée.",
    "website": "",
    "type": "autre",
    "status": "unverified",
    "fit": "non",
    "verified_address": false,
    "sources": [],
    "region": "corse",
    "origine": "v1",
    "verification_note": "Non vérifié ; aucun indice de vente d'éditions. Exclu par sévérité.",
    "retired": true
  },
  {
    "id": "corse-22",
    "name": "L'Animu – Médiathèque de Porto-Vecchio",
    "city": "Porto-Vecchio",
    "address": "Voie Romaine, 20137 Porto-Vecchio",
    "description": "Médiathèque municipale : pas de point de vente.",
    "website": "",
    "type": "mediatheque",
    "status": "unverified",
    "fit": "non",
    "verified_address": false,
    "sources": [],
    "region": "corse",
    "origine": "v1",
    "verification_note": "Hors cible par définition (médiathèque). À supprimer.",
    "retired": true
  },
  {
    "id": "corse-23",
    "name": "Les Contes Infusés",
    "city": "Corte",
    "address": "7 cours Paoli, 20250 Corte",
    "description": "Librairie-café indépendante de 80 m² ouverte le 27 mai 2026 par Laure Pelgris au pied de la citadelle : fonds généraliste et littérature corse, café de spécialité, artisanat corse (papeterie, céramique), rencontres d'auteurs et ateliers d'artistes annoncés dès septembre. Mar-sam 10h-19h (dim en juillet-août). Tél. 04 95 55 10 59.",
    "website": "https://lescontesinfuses.corsica/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://lescontesinfuses.corsica/",
      "https://www.livreshebdo.fr/article/corse-une-librairie-cafe-ouvre-ses-portes-corte"
    ],
    "region": "corse",
    "origine": "ajout-2026",
    "verification_note": "Lieu très récent, ouvert aux collaborations d'artistes : bonne cible au même endroit que le FRAC."
  },
  {
    "id": "corse-24",
    "name": "Bartleby's",
    "city": "Ajaccio",
    "address": "80 rue Cardinal Fesch, 20000 Ajaccio",
    "description": "Librairie listée par ilibrairie.fr rue Cardinal Fesch, à quelques pas du Palais Fesch. Aucune autre page trouvée (pas de fiche détaillée, pas de site).",
    "website": "",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://ilibrairie.fr/2A",
      "https://ilibrairie.fr/2A/ajaccio/librairie-la-marge-n4"
    ],
    "region": "corse",
    "origine": "ajout-2026",
    "verification_note": "Existence à confirmer sur place ; le nom (référence à Melville) suggère une librairie de fonds mais rien ne le prouve."
  },
  {
    "id": "corse-25",
    "name": "Librairie Grand Sud",
    "city": "Porto-Vecchio",
    "address": "Rue Henri Frenay, 20137 Porto-Vecchio",
    "description": "Seule librairie généraliste listée par PagesJaunes à Porto-Vecchio : livres d'art, BD, manga, jeunesse, langues étrangères, policier.",
    "website": "https://www.pagesjaunes.fr/annuaire/porto-vecchio-2a/librairies",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://www.pagesjaunes.fr/annuaire/porto-vecchio-2a/librairies"
    ],
    "region": "corse",
    "origine": "ajout-2026",
    "verification_note": "Numéro de rue non trouvé ; pas de site propre. Détour de 2 h depuis Ajaccio pour une seule librairie généraliste."
  },
  {
    "id": "corse-26",
    "name": "La Petite Librairie",
    "city": "Belgodère (Lozari)",
    "address": "Zone commerciale Via Stazzola, Lozari, 20226 Belgodère",
    "description": "Librairie indépendante de Balagne, entre L'Île-Rousse et Saint-Florent, notée 5/5 (16 avis) et décrite comme « une vraie librairie comme il n'y en a plus beaucoup ». Ouverte jusqu'à 18h.",
    "website": "https://ilibrairie.fr/2B/belgodere",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/2B/belgodere",
      "https://www.pagesjaunes.fr/annuaire/region/corse/librairies"
    ],
    "region": "corse",
    "origine": "ajout-2026",
    "verification_note": "Pas de site propre ; horaires complets non trouvés. Sur la route Bastia -> Calvi."
  },
  {
    "id": "corse-27",
    "name": "Librairie Ambrogi",
    "city": "L'Île-Rousse",
    "address": "Avenue Piccioni, 20220 L'Île-Rousse",
    "description": "Seule librairie généraliste listée à L'Île-Rousse (4,5/5, 15 avis), ouverte jusqu'à 19h.",
    "website": "https://ilibrairie.fr/2B/l-ile-rousse",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://ilibrairie.fr/2B/l-ile-rousse"
    ],
    "region": "corse",
    "origine": "ajout-2026",
    "verification_note": "La piste « L'Île Lettrée » n'a été trouvée sur aucune page consultée : non vérifiée, non retenue. Numéro de rue manquant."
  },
  {
    "id": "auvergne-rhone-alpes-2",
    "name": "Le Bal des Ardents",
    "city": "Lyon",
    "address": "17 rue Neuve, 69001 Lyon",
    "description": "Librairie-galerie « anciens & modernes » indépendante, presqu'île. Ouvert du lundi au samedi 10h-19h sans interruption, fermé le dimanche ; commandes via Chez Mon Libraire.",
    "website": "https://www.lebaldesardents.com/",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.lebaldesardents.com/contact",
      "https://www.lebaldesardents.com/"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "v1",
    "verification_note": "Le site ne mentionne pas explicitement fanzines ou micro-édition ; à demander sur place."
  },
  {
    "id": "auvergne-rhone-alpes-3",
    "name": "Archipel Librairie",
    "city": "Lyon",
    "address": "21 place des Terreaux, 69001 Lyon",
    "description": "Librairie indépendante de 50 m² spécialisée architecture, urbanisme, paysage, design et art urbain, installée dans Archipel Centre de culture urbaine. Horaires site librairie : lundi 14h-19h, mardi-samedi 10h-13h/14h-19h, dimanche 14h-19h.",
    "website": "https://www.archipel-librairie.fr/",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.archipel-librairie.fr/",
      "https://asso.chez-mon-libraire.fr/librairie/librairie/69.html",
      "https://www.lyon.fr/lieu/lieux-dexposition/archipel-centre-de-culture-urbaine"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "v1",
    "verification_note": "Les horaires diffèrent entre le site de la librairie et lyon.fr (mar-ven et dim 13h-19h, sam 11h-19h) ; vérifier avant visite."
  },
  {
    "id": "auvergne-rhone-alpes-4",
    "name": "Bikini, espace d'art contemporain",
    "city": "Lyon",
    "address": "15 bis rue de la Thibaudière, 69007 Lyon",
    "description": "Très petit espace-vitrine d'art contemporain (une ou deux œuvres accompagnées d'un texte), visible en permanence depuis la rue, accès sur rendez-vous et lors des vernissages. Exposition « Josy's Club » du 11 septembre au 6 novembre 2026.",
    "website": "http://capsule-bikini.com/",
    "type": "galerie-artist-run",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.ac-ra.eu/structure/bikini/"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "v1",
    "verification_note": "Aucun point de vente d'éditions vu ; site officiel inaccessible (503). Lieu minuscule, dépôt improbable."
  },
  {
    "id": "auvergne-rhone-alpes-5",
    "name": "Le Réfectoire des nonnes (ENSBA Lyon)",
    "city": "Lyon",
    "address": "8 bis quai Saint-Vincent, 69001 Lyon",
    "description": "Galerie principale d'exposition de l'École nationale supérieure des beaux-arts de Lyon, ouverte au public pendant les expositions. L'école a des journées portes ouvertes en 2026 ; pas de boutique décrite sur la page.",
    "website": "https://www.ensba-lyon.fr/page_refectoire-nonnes",
    "type": "autre",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.ensba-lyon.fr/page_refectoire-nonnes",
      "https://www.ensba-lyon.fr/actualite_journees-portes-ouvertes-2026"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "v1",
    "verification_note": "L'adresse du brief (10 rue Neyret) n'apparaît pas sur la page ; l'école donne 8 bis quai Saint-Vincent. Aucun point de vente d'éditions vu."
  },
  {
    "id": "auvergne-rhone-alpes-6",
    "name": "Institut d'art contemporain (IAC) – Librairie",
    "city": "Villeurbanne",
    "address": "11 rue Docteur Dolard, 69100 Villeurbanne",
    "description": "Librairie et espace de consultation du centre d'art (monographies, catalogues, textes théoriques, produits exclusifs), ouverts uniquement en période d'exposition : mercredi-vendredi 14h-17h30, week-end 13h-18h30. Fermé jusqu'au vernissage du 17 septembre 2026 (Jeune création internationale).",
    "website": "https://i-ac.eu/fr/73_librairie-espace-de-consultation",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://i-ac.eu/fr/73_librairie-espace-de-consultation",
      "https://i-ac.eu/fr/71_acces-horaires"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "v1",
    "verification_note": "Politique de dépôt non indiquée."
  },
  {
    "id": "auvergne-rhone-alpes-7",
    "name": "URDLA – Centre international estampe & livre",
    "city": "Villeurbanne",
    "address": "207 rue Francis-de-Pressensé, 69100 Villeurbanne",
    "description": "Atelier-éditeur d'estampes (cinq presses lithographiques) et de livres d'artiste avec galerie et vente d'œuvres et d'éditions sur place et en ligne. Mardi-vendredi 10h-18h, samedi 14h-18h, entrée libre. Exposition Delphine Reist du 19 septembre au 19 décembre 2026.",
    "website": "https://urdla.com/",
    "type": "atelier-editeur",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://urdla.com/",
      "https://www.lyon.fr/lieu/lieux-dexposition/urdla-centre-international-estampe-livre"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "v1",
    "verification_note": "Vend surtout ses propres éditions ; dépôt extérieur à négocier."
  },
  {
    "id": "auvergne-rhone-alpes-8",
    "name": "macLYON – Boutique",
    "city": "Lyon",
    "address": "Cité Internationale, 81 quai Charles de Gaulle, 69006 Lyon",
    "description": "Le musée d'art contemporain a une boutique (catalogues, affiches, cartes), sans vente en ligne. Musée fermé pour le montage de la Biennale de Lyon, réouverture le 19 septembre 2026.",
    "website": "https://www.mac-lyon.com/fr",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://www.mac-lyon.com/fr/faq"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "v1",
    "verification_note": "Adresse postale non relue sur la page consultée ; gestion de la boutique (régie ou concession) inconnue."
  },
  {
    "id": "auvergne-rhone-alpes-9",
    "name": "Grrrnd Zero",
    "city": "Vaulx-en-Velin",
    "address": "60 avenue de Böhlen, 69120 Vaulx-en-Velin",
    "description": "Lieu autogéré (salle de concerts, résidences, sérigraphie, radio) ouvert lors des événements, prix libre, paiement en espèces uniquement. Édite le magazine Grrrnd Confort ; programmation dense septembre-octobre 2026.",
    "website": "https://www.grrrndzero.org/",
    "type": "autre",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.grrrndzero.org/"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "v1",
    "verification_note": "Pas de boutique permanente vue : dépôt possible seulement via une table de distro pendant les soirées."
  },
  {
    "id": "auvergne-rhone-alpes-10",
    "name": "MJC Monplaisir",
    "city": "Lyon",
    "address": "25 avenue des Frères Lumière, 69008 Lyon",
    "description": "Maison des jeunes et de la culture du 8e arrondissement (ateliers, spectacles). Aucun point de vente de livres connu.",
    "website": "https://www.mjcmonplaisir.net/",
    "type": "autre",
    "status": "unverified",
    "fit": "non",
    "verified_address": false,
    "sources": [
      "https://www.lyon.fr/lieu/maisons-des-jeunes-et-de-la-culture/maison-des-jeunes-et-de-la-culture-monplaisir"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "v1",
    "verification_note": "Site officiel inaccessible (robots). Hors sujet sauf événement ponctuel (brocante, salon).",
    "retired": true
  },
  {
    "id": "auvergne-rhone-alpes-11",
    "name": "Cité du design – Boutique-librairie",
    "city": "Saint-Étienne",
    "address": "3 rue Javelin Pagnon, 42000 Saint-Étienne",
    "description": "La Cité du design (site de la Manufacture d'armes) est ouverte du mardi au dimanche 10h-12h30 / 13h30-18h, avec plusieurs expositions jusqu'en octobre 2026 et mars 2027 ; son site référence une boutique-librairie.",
    "website": "https://www.citedudesign.com/fr/a/la-boutique-librairie-673",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.ac-ra.eu/structure/cite-du-design/",
      "https://www.citedudesign.com/fr/infos-pratiques/horaires-et-acces"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "v1",
    "verification_note": "Pages boutique du site en erreur 503 lors de la consultation ; le nom « La Platine » n'a pas été confirmé. 14 rue Marius Patinaud = adresse de contact, 3 rue Javelin Pagnon = entrée publique."
  },
  {
    "id": "auvergne-rhone-alpes-12",
    "name": "MAMC+ – Librairie-boutique",
    "city": "Saint-Priest-en-Jarez",
    "address": "Rue Fernand Léger, 42270 Saint-Priest-en-Jarez",
    "description": "Librairie du musée d'art moderne et contemporain : plus de 4 000 titres art moderne et contemporain, design, photo, architecture, plus catalogues, affiches, papeterie et créations locales. Lundi-vendredi 10h-18h, samedi-dimanche 10h-18h30, fermé le mardi ; boutique en ligne dédiée.",
    "website": "https://mamc.saint-etienne-metropole.fr/fr/librairie-boutique",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://mamc.saint-etienne-metropole.fr/fr/librairie-boutique"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "v1",
    "verification_note": "Adresse non relue sur la page ; contact librairie : mamc.librairie@saint-etienne-metropole.fr, 04 77 79 52 51."
  },
  {
    "id": "auvergne-rhone-alpes-13",
    "name": "Bibliothèque Jean Laude (MAMC+)",
    "city": "Saint-Priest-en-Jarez",
    "address": "Rue Fernand Léger, 42270 Saint-Priest-en-Jarez",
    "description": "Bibliothèque de recherche du musée (45 000 volumes, 2 000 livres d'artistes), consultation sur place, lundi-vendredi 14h-18h sauf mardi. Pas de vente.",
    "website": "https://mamc.saint-etienne-metropole.fr/fr/le-musee/bibliotheque-jean-laude",
    "type": "mediatheque",
    "status": "active",
    "fit": "non",
    "verified_address": false,
    "sources": [
      "https://mamc.saint-etienne-metropole.fr/fr/le-musee/bibliotheque-jean-laude"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "v1",
    "verification_note": "Pourrait accepter un don pour le fonds livres d'artistes, mais ce n'est pas un dépôt-vente.",
    "retired": true
  },
  {
    "id": "auvergne-rhone-alpes-14",
    "name": "Estampille – Sérigraphie & édition d'art",
    "city": "Saint-Étienne",
    "address": "2, 4, 6 arcades de l'hôtel de ville, 42000 Saint-Étienne",
    "description": "Atelier de sérigraphie et d'édition d'estampes contemporaines sous les arcades de l'hôtel de ville, référencé par l'office de tourisme (Saint-Étienne Hors-Cadre) et les annuaires.",
    "website": "https://www.saint-etienne-hors-cadre.fr/activite/estampille-atelier-de-serigraphie-et-dedition-destampes-contemporaines-saint-etienne-2/",
    "type": "atelier-editeur",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://www.saint-etienne-hors-cadre.fr/activite/estampille-atelier-de-serigraphie-et-dedition-destampes-contemporaines-saint-etienne-2/",
      "https://www.pagesjaunes.fr/pros/60261523"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "v1",
    "verification_note": "Pages en erreur (503/403) à la consultation : horaires, site et présence de livres non vérifiés."
  },
  {
    "id": "auvergne-rhone-alpes-15",
    "name": "Librairie Forum",
    "city": "Saint-Étienne",
    "address": "5 rue Michel Rondet, 42000 Saint-Étienne",
    "description": "Grande librairie généraliste du centre (Forum Espace Culture à la même adresse), membre du réseau de libraires indépendants Chez Mon Libraire ; SAS créée en 2014.",
    "website": "https://www.forum-saint-etienne.com/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/42/saint-etienne/forum-saint-etienne-87s",
      "https://asso.chez-mon-libraire.fr/vos-librairies-cml/trouver-une-librairie/librairies.html"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "v1",
    "verification_note": "Contact affiché en @chapitre.com : ancien magasin Chapitre repris, taille de grande surface culturelle ; dépôt de micro-édition incertain."
  },
  {
    "id": "auvergne-rhone-alpes-16",
    "name": "Magasin – Centre national d'art contemporain (CNAC)",
    "city": "Grenoble",
    "address": "8 esplanade Andry-Farcy, 38000 Grenoble",
    "description": "Centre d'art (ex-Magasin des Horizons, renommé Magasin CNAC), ouvert mercredi-dimanche 11h-19h, 5 €/3 €, gratuit le premier dimanche. Exposition Adrien Fregosi du 14 mai 2026 au 3 janvier 2027 ; braderie de livres les 26-27 septembre 2026.",
    "website": "https://www.magasin-cnac.org/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.magasin-cnac.org/",
      "https://www.magasin-cnac.org/fr/infos-pratiques"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "v1",
    "verification_note": "Aucune page « librairie » permanente vue ; la braderie indique un stock de livres. Nom du brief obsolète."
  },
  {
    "id": "auvergne-rhone-alpes-17",
    "name": "Librairie Les Modernes",
    "city": "Grenoble",
    "address": "6 rue Lakanal, 38000 Grenoble",
    "description": "Librairie indépendante (2007, quartier Championnet) : livres jeunesse, livres d'images et « curiosités », environ 5 000 références valorisant créateurs contemporains et maisons d'édition indépendantes, avec un atelier d'expositions. Mardi-samedi 10h-13h / 14h-19h ; exposition Mathilde Grange et Matéa Palévody jusqu'au 30 septembre 2026.",
    "website": "https://www.lesmodernes.com/",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://www.lesmodernes.com/",
      "https://asso.chez-mon-libraire.fr/librairie/librairie/42.html"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "v1",
    "verification_note": "Orientation jeunesse/illustration : vérifier l'intérêt pour un chéquier d'artiste."
  },
  {
    "id": "auvergne-rhone-alpes-18",
    "name": "Boutique-librairie du Musée de Grenoble",
    "city": "Grenoble",
    "address": "5 place de Lavalette, 38000 Grenoble",
    "description": "Librairie-boutique au rez-de-chaussée, accessible librement depuis le hall, gérée par la RMN-Grand Palais : guides, monographies, papeterie, cadeaux. Tous les jours 10h-13h / 14h-18h30 sauf mardi ; tél. 04 76 51 94 07.",
    "website": "https://www.museedegrenoble.fr/1940-la-boutique-du-musee.htm",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://www.museedegrenoble.fr/1940-la-boutique-du-musee.htm",
      "https://www.museedegrenoble.fr/"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "v1",
    "verification_note": "Gestion RMN-GP centralisée : dépôt local peu probable."
  },
  {
    "id": "auvergne-rhone-alpes-19",
    "field_note": "« on va te virer gibert, t'as rien à faire là » (2026-05-11)",
    "name": "Gibert Joseph Grenoble",
    "city": "Grenoble",
    "address": "4 rue Béranger, 38000 Grenoble",
    "description": "Magasin de la chaîne Gibert Joseph.",
    "website": "",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "non",
    "verified_address": false,
    "sources": [],
    "region": "auvergne-rhone-alpes",
    "origine": "v1",
    "verification_note": "Retiré à la demande de Jeanson (chaîne) ; non recherché.",
    "retired": true
  },
  {
    "id": "auvergne-rhone-alpes-20",
    "name": "Librairie Arthaud",
    "city": "Grenoble",
    "address": "23 Grande Rue, 38000 Grenoble",
    "description": "Librairie indépendante bicentenaire de Grenoble, grande surface généraliste (« plus d'un million de titres » en ligne).",
    "website": "https://www.librairie-arthaud.fr/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://www.librairie-arthaud.fr/"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "v1",
    "verification_note": "Seules les métadonnées du site ont été lues : adresse et horaires non confirmés."
  },
  {
    "id": "auvergne-rhone-alpes-21",
    "name": "Librairie Le Square",
    "city": "Grenoble",
    "address": "2 place du Docteur Léon Martin, 38000 Grenoble",
    "description": "Librairie généraliste indépendante de 350 m², plus de 60 ans d'existence, rayons littérature, jeunesse, essais, beaux-arts et BD ; rencontres d'auteurs. Tél. 04 76 46 61 63.",
    "website": "http://www.librairielesquare.fr/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://asso.chez-mon-libraire.fr/librairie/librairie/77.html"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "v1",
    "verification_note": "Site officiel en 403 ; horaires non vus."
  },
  {
    "id": "auvergne-rhone-alpes-22",
    "field_note": "« Pas de boutique » (2026-05-19)",
    "name": "Frac Auvergne",
    "city": "Clermont-Ferrand",
    "address": "11 rue Ballainvilliers, 63000 Clermont-Ferrand",
    "description": "Fonds régional d'art contemporain, entrée libre mardi-dimanche 14h-18h ; week-end inaugural 25-27 septembre 2026 et exposition « Les mues éternelles » jusqu'au 7 février 2027.",
    "website": "https://www.frac-auvergne.fr/",
    "type": "musee",
    "status": "active",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://www.ac-ra.eu/structure/frac-auvergne/"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "v1",
    "verification_note": "AC//RA donne 11 rue Ballainvilliers (le brief disait 6 rue du Terrail) : déménagement probable, site officiel inaccessible (certificat SSL). Pas de boutique selon Jeanson.",
    "retired": true
  },
  {
    "id": "auvergne-rhone-alpes-23",
    "name": "Hôtel Fontfreyde – Centre photographique",
    "city": "Clermont-Ferrand",
    "address": "34 rue des Gras, 63000 Clermont-Ferrand",
    "description": "Centre photographique municipal dans un hôtel Renaissance, entrée libre mardi-samedi 13h30-19h ; résidences et publications. Exposition « Majestic » jusqu'au 20 septembre 2026.",
    "website": "https://clermont-ferrand.fr/hotel-fontfreyde-centre-photographique",
    "type": "musee",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.ac-ra.eu/structure/hotel-fontfreyde-centre-photographique/"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "v1",
    "verification_note": "Aucun point de vente vu ; site de la ville inaccessible (SSL)."
  },
  {
    "id": "auvergne-rhone-alpes-24",
    "name": "Les éditions de la dernière chance",
    "city": "Lyon",
    "address": "21 rue Montesquieu, 69007 Lyon",
    "description": "Maison d'édition / atelier du 7e arrondissement figurant au brief.",
    "website": "",
    "type": "atelier-editeur",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "auvergne-rhone-alpes",
    "origine": "v1",
    "verification_note": "Non recherché : budget de recherche web épuisé avant ce lieu."
  },
  {
    "id": "auvergne-rhone-alpes-25",
    "field_note": "« Pas de micro édition » (2026-05-19)",
    "name": "Scop Librairie Les Volcans",
    "city": "Clermont-Ferrand",
    "address": "80 boulevard François Mitterrand, 63000 Clermont-Ferrand",
    "description": "Grande librairie généraliste en coopérative (SARL Scop créée en 2014), lundi-samedi 10h-19h.",
    "website": "http://www.librairielesvolcans.com/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/63/clermont-ferrand/scop-librairie-les-volcans-1jd"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "v1",
    "verification_note": "Site officiel en 403. Note de terrain : ne prend pas de micro-édition.",
    "retired": true
  },
  {
    "id": "auvergne-rhone-alpes-26",
    "name": "Centre culturel Le Bief",
    "city": "Ambert",
    "address": "23 rue des Chazeaux, 63600 Ambert",
    "description": "Centre culturel d'Ambert figurant au brief.",
    "website": "https://www.lebief.org/",
    "type": "autre",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "auvergne-rhone-alpes",
    "origine": "v1",
    "verification_note": "Site en 503 et absent de l'annuaire AC//RA ; existence d'un point de vente non vérifiée."
  },
  {
    "id": "auvergne-rhone-alpes-27",
    "name": "La BF15",
    "city": "Lyon",
    "address": "11 quai de la Pêcherie, 69001 Lyon",
    "description": "Espace de production et d'expérimentation en art contemporain (réseau Adele), entrée libre mercredi-samedi 14h-19h. Exposition « Les infiltré·es » du 11 septembre au 31 octobre 2026.",
    "website": "http://labf15.org/",
    "type": "galerie-artist-run",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.ac-ra.eu/structure/la-bf15/"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "ajout-2026",
    "verification_note": "Vente d'éditions non vérifiée."
  },
  {
    "id": "auvergne-rhone-alpes-28",
    "name": "Galerie Tator",
    "city": "Lyon",
    "address": "36 rue d'Anvers, 69007 Lyon",
    "description": "Galerie associative fondée en 1994 (arts plastiques, design, architecture), cinq expositions par an, entrée libre lundi-vendredi 14h-18h ; résidence La Factatory.",
    "website": "http://www.rogertator.com/",
    "type": "galerie-artist-run",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.ac-ra.eu/structure/galerie-tator/"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "ajout-2026",
    "verification_note": "Vente d'éditions non vérifiée ; dernière exposition listée terminée le 24 juillet 2026."
  },
  {
    "id": "auvergne-rhone-alpes-29",
    "name": "La Salle de bains",
    "city": "Lyon",
    "address": "1 rue Louis Vitet, 69001 Lyon",
    "description": "Association de production et diffusion d'art contemporain fondée en 1998 par des artistes et designers, petit espace ouvert mercredi-samedi 15h-19h. Exposition « BDPD » jusqu'au 10 octobre 2026.",
    "website": "http://www.lasalledebains.net/",
    "type": "galerie-artist-run",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.ac-ra.eu/structure/la-salle-de-bains/"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "ajout-2026",
    "verification_note": "Vente d'éditions non vérifiée."
  },
  {
    "id": "auvergne-rhone-alpes-30",
    "name": "Le Bleu du ciel",
    "city": "Lyon",
    "address": "12 rue des Fantasques, 69001 Lyon",
    "description": "Galerie associative de photographie documentaire (200 m², pentes de la Croix-Rousse), entrée libre mercredi-samedi 14h30-19h. Exposition « Voyages au Kurdistan » jusqu'au 26 septembre 2026.",
    "website": "http://www.lebleuduciel.net/",
    "type": "galerie-artist-run",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.ac-ra.eu/structure/le-bleu-du-ciel/"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "ajout-2026",
    "verification_note": "Vente de livres photo non vérifiée."
  },
  {
    "id": "auvergne-rhone-alpes-31",
    "name": "Librairie Vivement Dimanche",
    "city": "Lyon",
    "address": "4 rue du Chariot d'Or, 69004 Lyon",
    "description": "Librairie indépendante de la Croix-Rousse en trois boutiques voisines (L'Aînée : littérature, sciences humaines, poésie ; La Cadette : pratique ; La Benjamine : jeunesse), reprise en 2020.",
    "website": "http://www.vivementdimanche.com/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://asso.chez-mon-libraire.fr/librairie/librairie/5.html"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "ajout-2026",
    "verification_note": "Horaires non vus."
  },
  {
    "id": "auvergne-rhone-alpes-32",
    "name": "La Bande dessinée",
    "city": "Lyon",
    "address": "50 grande rue de la Croix-Rousse, 69004 Lyon",
    "description": "Librairie de 100 m² dédiée à la bande dessinée depuis 2002 : franco-belge, comics, mangas et « indépendants », conseils de Marianne et Simon.",
    "website": "https://www.labd.net/",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://asso.chez-mon-libraire.fr/librairie/librairie/43.html"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "ajout-2026",
    "verification_note": "« Indépendants » = BD alternative ; fanzines hors BD à confirmer. Horaires non vus."
  },
  {
    "id": "auvergne-rhone-alpes-33",
    "name": "Librairie Rive Gauche",
    "city": "Lyon",
    "address": "19 rue de Marseille, 69007 Lyon",
    "description": "Librairie généraliste indépendante de la Guillotière (SARL créée en 2016), mardi-samedi 10h-19h.",
    "website": "http://www.facebook.com/librairierivegauche",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/69/lyon/librairie-rive-gauche-lyon-3gw"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "ajout-2026",
    "verification_note": "Pas de site propre trouvé (réservation via chez-mon-libraire.fr)."
  },
  {
    "id": "auvergne-rhone-alpes-34",
    "name": "Spacejunk Grenoble",
    "city": "Grenoble",
    "address": "19 rue Génissieu, 38000 Grenoble",
    "description": "Galerie d'art urbain et émergent fondée en 2003, organisatrice du Street Art Fest Grenoble-Alpes, entrée libre mardi-samedi 14h-19h30. Exposition « Présences » du 19 septembre au 7 novembre 2026.",
    "website": "http://www.spacejunk.tv/",
    "type": "galerie-artist-run",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.ac-ra.eu/structure/spacejunk-grenoble/"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "ajout-2026",
    "verification_note": "Vente d'éditions/prints non vérifiée."
  },
  {
    "id": "auvergne-rhone-alpes-35",
    "name": "Le VOG – Centre d'art contemporain",
    "city": "Fontaine",
    "address": "10 avenue Aristide Briand, 38600 Fontaine",
    "description": "Centre d'art municipal de Fontaine (agglomération grenobloise), entrée libre mercredi-samedi 15h-18h ; conférences, résidences, médiation.",
    "website": "https://mairie-fontaine.fr/le-vog/",
    "type": "musee",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.ac-ra.eu/structure/le-vog/"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "ajout-2026",
    "verification_note": "Aucune mention de boutique ou d'éditions ; programmation 2026 non vue."
  },
  {
    "id": "auvergne-rhone-alpes-36",
    "name": "Lune et l'Autre",
    "city": "Saint-Étienne",
    "address": "19 rue Pierre Bérard, 42000 Saint-Étienne",
    "description": "Librairie de quartier indépendante : littérature, jeunesse, un rayon architecture et design, petite papeterie. Tél. 04 77 32 58 49.",
    "website": "http://www.lunetlautre.canalblog.com/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://asso.chez-mon-libraire.fr/librairie/librairie/86.html"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "ajout-2026",
    "verification_note": "Horaires non vus."
  },
  {
    "id": "auvergne-rhone-alpes-37",
    "name": "L'Assaut de la menuiserie",
    "city": "Saint-Étienne",
    "address": "11 rue Bourgneuf, 42000 Saint-Étienne",
    "description": "Association fondée en 1995 dans une ancienne menuiserie (salle d'exposition, cour, atelier), cinq à six expositions par an, entrée libre mercredi-samedi 14h-18h. Exposition « Langage Pas(sage) » du 23 septembre au 14 novembre 2026.",
    "website": "https://www.lassaut.fr/",
    "type": "galerie-artist-run",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.ac-ra.eu/structure/lassaut-de-la-menuiserie/"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "ajout-2026",
    "verification_note": "Vente d'éditions non vérifiée."
  },
  {
    "id": "auvergne-rhone-alpes-38",
    "name": "Greenhouse",
    "city": "Saint-Étienne",
    "address": "11 rue de l'Égalerie, 42000 Saint-Étienne",
    "description": "Association (1997) d'architectes, designers, plasticiens et graphistes qui organise des expositions d'art contemporain, design et architecture ; horaires variables selon les expositions, entrée libre.",
    "website": "https://greenhouse-saintetienne.fr/",
    "type": "galerie-artist-run",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.ac-ra.eu/structure/greenhouse/"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "ajout-2026",
    "verification_note": "Aucune exposition 2026 listée : appeler avant (04 77 50 84 28)."
  },
  {
    "id": "auvergne-rhone-alpes-39",
    "name": "In extenso",
    "city": "Clermont-Ferrand",
    "address": "12 rue de la Coifferie, 63000 Clermont-Ferrand",
    "description": "Association d'art contemporain fondée en 2002, trois à quatre expositions par an, qui édite catalogues et livres d'artistes et coproduit La belle revue. Entrée libre mercredi-samedi 14h-18h ; exposition du 5 septembre au 31 octobre 2026.",
    "website": "http://www.inextenso-asso.com/",
    "type": "galerie-artist-run",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://www.ac-ra.eu/structure/in-extenso/"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "ajout-2026",
    "verification_note": "Éditeur de livres d'artistes ; vente sur place d'éditions extérieures à confirmer."
  },
  {
    "id": "auvergne-rhone-alpes-40",
    "name": "La Tôlerie",
    "city": "Clermont-Ferrand",
    "address": "10 rue de Bien-Assis, 63100 Clermont-Ferrand",
    "description": "Lieu d'art performatif et pluridisciplinaire (expositions, cabarets, performances), entrée libre mercredi-samedi 14h-18h. Exposition « Amour réciproque » du 19 septembre au 12 décembre 2026.",
    "website": "https://latolerie.fr/",
    "type": "galerie-artist-run",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.ac-ra.eu/structure/la-tolerie/"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "ajout-2026",
    "verification_note": "Vente d'éditions non vérifiée."
  },
  {
    "id": "auvergne-rhone-alpes-41",
    "name": "Le Creux de l'Enfer – Boutique",
    "city": "Thiers",
    "address": "83-85 avenue Joseph Claussat, 63300 Thiers",
    "description": "Centre d'art contemporain d'intérêt national (Vallée des Usines), rouvert en juin 2025 après travaux, avec une boutique proposant livres d'art, objets et épicerie régionale. Mercredi-dimanche 14h-18h, 5 €/3 €. Expositions jusqu'au 20 septembre 2026.",
    "website": "http://www.creuxdelenfer.net/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.ac-ra.eu/structure/le-creux-de-lenfer-centre-dart-contemporain-dinteret-national/"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "ajout-2026",
    "verification_note": "Sur la route Ambert–Clermont ; politique de dépôt inconnue."
  },
  {
    "id": "auvergne-rhone-alpes-42",
    "name": "Librairie Notre Temps",
    "city": "Valence",
    "address": "30 Grande Rue, 26000 Valence",
    "description": "Librairie généraliste indépendante du centre de Valence (romans, essais, jeunesse, BD, régionalisme), rencontres régulières. Tél. 04 75 43 78 79.",
    "website": "https://notretempslibrairie.wordpress.com/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://asso.chez-mon-libraire.fr/librairie/librairie/94.html"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "ajout-2026",
    "verification_note": "Horaires non vus."
  },
  {
    "id": "auvergne-rhone-alpes-43",
    "name": "Librairie Jean-Jacques Rousseau",
    "city": "Chambéry",
    "address": "64 rue Croix d'Or, 73000 Chambéry",
    "description": "Librairie indépendante du centre de Chambéry, mardi-samedi 10h-12h30 / 14h-18h30, fermée dimanche et lundi.",
    "website": "http://www.librairie-rousseau.com/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/73/chambery/librairie-jean-jacques-rousseau-59u"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "ajout-2026",
    "verification_note": "Spécialités non vues ; absente du réseau Chez Mon Libraire."
  },
  {
    "id": "auvergne-rhone-alpes-44",
    "name": "Librairie-café BD Fugue",
    "city": "Annecy",
    "address": "Centre Bonlieu, 1 rue Jean Jaurès, 74000 Annecy",
    "description": "Librairie-café BD de 350 m² dans le centre Bonlieu (fondée en 1981) : BD, mangas, romans graphiques, jeunesse, papeterie. Lundi 14h-19h, mardi-samedi 10h-19h.",
    "website": "https://www.bdfugue.com/annecy",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://asso.chez-mon-libraire.fr/librairie/librairie/141.html",
      "https://ilibrairie.fr/74/annecy"
    ],
    "region": "auvergne-rhone-alpes",
    "origine": "ajout-2026",
    "verification_note": "BD Fugue est une petite enseigne à plusieurs magasins (Annecy, Chambéry, Grenoble…) : à considérer comme limite. C'est le lieu qui correspond à la piste « Librairie Bonlieu »."
  },
  {
    "id": "bourgogne-franche-comte-1",
    "name": "Consortium Museum (librairie)",
    "city": "Dijon",
    "address": "37 rue de Longvic, 21000 Dijon",
    "description": "Centre d'art contemporain (depuis 1977) avec une librairie au 1er étage (aménagée par Matali Crasset) : livres et revues d'art contemporain, publications des presses du réel, éditions d'artistes, e-shop. Ouvert mercredi-dimanche 14h-18h, vendredi jusqu'à 20h, fermé jours fériés ; entrée libre à la librairie. Expositions en cours jusqu'en mars 2027.",
    "website": "https://www.consortiummuseum.com/fr",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://www.consortiummuseum.com/fr",
      "https://www.consortiummuseum.com/fr/informations-pratiques",
      "https://www.consortiummuseum.com/fr/librairie",
      "https://www.lapetitelibrairie.fr/librairies/21231-dijon/"
    ],
    "region": "bourgogne-franche-comte",
    "origine": "v1",
    "verification_note": "Contact librairie : librairie@consortiummuseum.com. Rien ne dit si la librairie prend du dépôt-vente extérieur."
  },
  {
    "id": "bourgogne-franche-comte-2",
    "name": "FRAC Bourgogne – Les Bains du Nord",
    "city": "Dijon",
    "address": "16 rue Quentin, 21000 Dijon",
    "description": "Espace d'exposition du FRAC Bourgogne (depuis 2013), ouvert uniquement pendant les expositions : mer/jeu/ven/dim 14h30-18h, sam 11h-13h et 14h-18h selon Seize Mille. La fiche tourisme régionale indique que le FRAC est « en transit vers de nouveaux locaux ».",
    "website": "http://www.frac-bourgogne.org",
    "type": "musee",
    "status": "doubtful",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.seizemille.com/structures-collectifs/frac-bourgogne/",
      "https://www.jds.fr/dijon/musee-et-collection-d-art/frac-bourgogne-dijon-14740_L",
      "https://www.sortezchezvous.fr/visites-du-patrimoine/frac-bourgogne-fonds-regional-dart-contemporain-de-bourgogne"
    ],
    "region": "bourgogne-franche-comte",
    "origine": "v1",
    "verification_note": "Site officiel inaccessible (redirection en boucle). Aucune mention de librairie/boutique trouvée. Déménagement annoncé : vérifier que les Bains du Nord sont encore ouverts avant de passer."
  },
  {
    "id": "bourgogne-franche-comte-3",
    "name": "Les Ateliers Vortex (Voisines)",
    "city": "Dijon",
    "address": "3 rue Joliet, 21000 Dijon",
    "description": "Artist-run space de diffusion et production d'art contemporain, relocalisé en mai 2026 dans un nouveau lieu, « Voisines », partagé avec ici l'onde (CNCM). Mercredi-samedi 14h-18h, vendredi jusqu'à 19h. Vend des multiples (boutique en ligne SumUp, « Boutique des multiples » éphémère en décembre) ; exposition « Mucilages » à partir du 18/09/2026.",
    "website": "https://lesateliersvortex.com/",
    "type": "galerie-artist-run",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://lesateliersvortex.com/",
      "https://www.seizemille.com/structures-collectifs/les-ateliers-vortex/",
      "https://jondi.fr/lieu/les-ateliers-vortex/",
      "https://www.dijon.fr/annuaire/les-ateliers-vortex/"
    ],
    "region": "bourgogne-franche-comte",
    "origine": "v1",
    "verification_note": "L'adresse du brief (71-73 rue des Rotondes) est l'ancienne, encore affichée sur l'annuaire de la ville ; Seize Mille et Jondi donnent 3 rue Joliet. Pas de point de vente permanent de livres constaté."
  },
  {
    "id": "bourgogne-franche-comte-4",
    "name": "Interface appartement/galerie",
    "city": "Dijon",
    "address": "12 rue Chancelier de l'Hospital, 21000 Dijon",
    "description": "Appartement-galerie associatif exposant artistes émergents et confirmés ; édite le journal d'art contemporain « horsd'œuvre ». Mercredi-samedi 14h-19h et sur rendez-vous. Visite libre annoncée aux Journées du patrimoine 2025.",
    "website": "https://www.interface-art.com",
    "type": "galerie-artist-run",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.seizemille.com/structures-collectifs/interface/",
      "https://unidivers.fr/event/visite-libre-de-lappartement-galerie-interface-interface-dijon-cote-dor-2025-09-20t140000/"
    ],
    "region": "bourgogne-franche-comte",
    "origine": "v1",
    "verification_note": "Site officiel non consultable (robots). Pas de point de vente de livres constaté ; le dépôt d'éditions reste à négocier."
  },
  {
    "id": "bourgogne-franche-comte-5",
    "name": "Galerie Le Trigram",
    "city": "Dijon",
    "address": "29 rue Charles Dumont, 21000 Dijon",
    "description": "Galerie non vérifiée : aucune page consultée. Absente de l'annuaire du réseau Seize Mille.",
    "website": "",
    "type": "autre",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "bourgogne-franche-comte",
    "origine": "v1",
    "verification_note": "Non vérifié (outils de recherche indisponibles)."
  },
  {
    "id": "bourgogne-franche-comte-6",
    "name": "Galerie Barnoud (Entrepôt 9)",
    "city": "Quetigny",
    "address": "9 boulevard de l'Europe, 21800 Quetigny",
    "description": "Galerie non vérifiée : aucune page consultée. Absente de l'annuaire du réseau Seize Mille.",
    "website": "",
    "type": "autre",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "bourgogne-franche-comte",
    "origine": "v1",
    "verification_note": "Non vérifié."
  },
  {
    "id": "bourgogne-franche-comte-7",
    "name": "La Minoterie",
    "city": "Dijon",
    "address": "75 avenue Jean Jaurès, 21000 Dijon",
    "description": "Lieu de création jeune public, non vérifié : aucune page consultée.",
    "website": "",
    "type": "autre",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "bourgogne-franche-comte",
    "origine": "v1",
    "verification_note": "Non vérifié ; aucune indication d'un point de vente de livres."
  },
  {
    "id": "bourgogne-franche-comte-8",
    "name": "Librairie Papeterie Grangier",
    "city": "Dijon",
    "address": "14 rue du Château, 21000 Dijon",
    "description": "Librairie-papeterie généraliste indépendante du centre de Dijon, listée dans l'annuaire LaPetiteLibrairie (2026) à cette adresse.",
    "website": "",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.lapetitelibrairie.fr/librairies/21231-dijon/"
    ],
    "region": "bourgogne-franche-comte",
    "origine": "v1",
    "verification_note": "Adresse confirmée par annuaire ; site officiel et horaires non consultés."
  },
  {
    "id": "bourgogne-franche-comte-9",
    "name": "Planète BD",
    "city": "Dijon",
    "address": "21 passage Darcy, 21000 Dijon",
    "description": "Librairie BD indépendante, listée dans l'annuaire LaPetiteLibrairie au 21 passage Darcy.",
    "website": "",
    "type": "librairie-specialisee",
    "status": "unverified",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.lapetitelibrairie.fr/librairies/21231-dijon/"
    ],
    "region": "bourgogne-franche-comte",
    "origine": "v1",
    "verification_note": "Numéro de rue ajouté d'après annuaire ; ouverture actuelle non vérifiée."
  },
  {
    "id": "bourgogne-franche-comte-10",
    "name": "Momie Dijon",
    "city": "Dijon",
    "address": "29 rue des Godrans, 21000 Dijon",
    "description": "Librairie BD/manga de l'enseigne Momie, listée au 29 rue des Godrans par l'annuaire LaPetiteLibrairie.",
    "website": "",
    "type": "librairie-specialisee",
    "status": "unverified",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.lapetitelibrairie.fr/librairies/21231-dijon/"
    ],
    "region": "bourgogne-franche-comte",
    "origine": "v1",
    "verification_note": "Momie est un réseau de plusieurs librairies BD (mini-chaîne) : intérêt limité pour la micro-édition."
  },
  {
    "id": "bourgogne-franche-comte-11",
    "name": "Librairie Autrement Dit",
    "city": "Dijon",
    "address": "66 rue des Godrans, 21000 Dijon",
    "description": "Librairie indépendante listée au 66 rue des Godrans par l'annuaire LaPetiteLibrairie.",
    "website": "",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.lapetitelibrairie.fr/librairies/21231-dijon/"
    ],
    "region": "bourgogne-franche-comte",
    "origine": "v1",
    "verification_note": "Numéro ajouté d'après annuaire ; site et horaires non consultés."
  },
  {
    "id": "bourgogne-franche-comte-12",
    "name": "Librairie Yannick Guillemin",
    "city": "Dijon",
    "address": "Place de la République, 21000 Dijon",
    "description": "Non vérifié ; n'apparaît pas dans la liste des 23 librairies de Dijon de l'annuaire LaPetiteLibrairie.",
    "website": "",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://www.lapetitelibrairie.fr/librairies/21231-dijon/"
    ],
    "region": "bourgogne-franche-comte",
    "origine": "v1",
    "verification_note": "Absence de l'annuaire : possible librairie ancienne/bouquinerie ou fermeture, à confirmer."
  },
  {
    "id": "bourgogne-franche-comte-13",
    "name": "Le Barde Bourguignon",
    "city": "Dijon",
    "address": "62 rue Berbisey, 21000 Dijon",
    "description": "Librairie indépendante listée au 62 rue Berbisey par l'annuaire LaPetiteLibrairie.",
    "website": "",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.lapetitelibrairie.fr/librairies/21231-dijon/"
    ],
    "region": "bourgogne-franche-comte",
    "origine": "v1",
    "verification_note": "Numéro ajouté d'après annuaire ; spécialité (régionalisme ?) et horaires non vérifiés."
  },
  {
    "id": "bourgogne-franche-comte-14",
    "name": "Librairie Florence Bardon",
    "city": "Dijon",
    "address": "Rue Berbisey, 21000 Dijon",
    "description": "Non vérifié ; n'apparaît pas dans l'annuaire LaPetiteLibrairie de Dijon.",
    "website": "",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://www.lapetitelibrairie.fr/librairies/21231-dijon/"
    ],
    "region": "bourgogne-franche-comte",
    "origine": "v1",
    "verification_note": "Probable librairie ancienne ; existence actuelle non confirmée."
  },
  {
    "id": "bourgogne-franche-comte-15",
    "name": "Frac Franche-Comté – Le Studiolo (librairie)",
    "city": "Besançon",
    "address": "Cité des arts, 2 passage des Arts, 25000 Besançon",
    "description": "Librairie du Frac (bâtiment Kengo Kuma) : ouvrages d'art contemporain, multiples, objets d'artistes, cartes, affiches ; accès libre. Horaires : oct-mars mer-dim 14h-18h ; avril-sept mer-ven 14h-18h, sam-dim 14h-19h. Expositions en cours jusqu'en janvier 2027.",
    "website": "https://frac-franche-comte.fr/fr/librairie",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://frac-franche-comte.fr",
      "https://frac-franche-comte.fr/fr/librairie",
      "https://www.seizemille.com/structures-collectifs/frac-franche-comte/"
    ],
    "region": "bourgogne-franche-comte",
    "origine": "v1",
    "verification_note": "Tél. 03 81 87 87 40. Politique de dépôt non indiquée."
  },
  {
    "id": "bourgogne-franche-comte-16",
    "name": "Superseñor",
    "city": "Besançon",
    "address": "10 avenue de Chardonnet, 25000 Besançon",
    "description": "Non vérifié : aucune page consultée ; absent de l'annuaire Seize Mille et de l'annuaire des librairies de Besançon.",
    "website": "",
    "type": "autre",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "bourgogne-franche-comte",
    "origine": "v1",
    "verification_note": "Non vérifié."
  },
  {
    "id": "bourgogne-franche-comte-17",
    "name": "Boucle d'arts",
    "city": "Besançon",
    "address": "7 rue Klein, 25000 Besançon",
    "description": "Non vérifié : aucune page consultée ; absent des annuaires consultés.",
    "website": "",
    "type": "autre",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "bourgogne-franche-comte",
    "origine": "v1",
    "verification_note": "Non vérifié."
  },
  {
    "id": "bourgogne-franche-comte-18",
    "name": "Librairie L'Intranquille",
    "city": "Besançon",
    "address": "59 rue des Granges, 25000 Besançon",
    "description": "Librairie indépendante listée « L'Intranquille » au 59 rue des Granges par l'annuaire LaPetiteLibrairie.",
    "website": "",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.lapetitelibrairie.fr/librairies/25056-besancon/"
    ],
    "region": "bourgogne-franche-comte",
    "origine": "v1",
    "verification_note": "Le suffixe « Plazza » du brief n'apparaît pas dans l'annuaire ; nom exact et horaires à confirmer."
  },
  {
    "id": "bourgogne-franche-comte-19",
    "name": "Les Sandales d'Empédocle",
    "city": "Besançon",
    "address": "95 Grande Rue, 25000 Besançon",
    "description": "Librairie indépendante de référence à Besançon, listée au 95 Grande Rue par l'annuaire LaPetiteLibrairie.",
    "website": "",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.lapetitelibrairie.fr/librairies/25056-besancon/"
    ],
    "region": "bourgogne-franche-comte",
    "origine": "v1",
    "verification_note": "Site officiel et horaires non consultés."
  },
  {
    "id": "bourgogne-franche-comte-20",
    "name": "Le 19, Crac",
    "city": "Montbéliard",
    "address": "19 avenue des Alliés, 25200 Montbéliard",
    "description": "Centre régional d'art contemporain (550 m², 3-4 expositions/an), entrée libre, mardi-samedi 14h-18h, dimanche 15h-18h. Ses éditions (Cahiers, multiples, catalogues, de gratuit à 40 €) sont « distribuées au 19 » et commandées par mail (mediation@le19crac.com) ; exposition Caroline Mesquita jusqu'au 13/09/2026, autre exposition jusqu'au 11/10/2026.",
    "website": "https://le19crac.com",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://le19crac.com",
      "https://le19crac.com/editions",
      "https://www.seizemille.com/structures-collectifs/crac-le-19/"
    ],
    "region": "bourgogne-franche-comte",
    "origine": "v1",
    "verification_note": "Point de vente limité aux éditions maison ; pas de librairie généraliste constatée."
  },
  {
    "id": "bourgogne-franche-comte-21",
    "name": "Espace multimédia Gantner",
    "city": "Bourogne",
    "address": "1 rue de la Varonne, 90140 Bourogne",
    "description": "Centre d'art contemporain (label 2012) du Département du Territoire de Belfort, dédié aux arts numériques ; expositions, concerts, ressources documentaires. Mardi-samedi 14h-18h, entrée libre.",
    "website": "http://espacemultimediagantner.cg90.net",
    "type": "musee",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.seizemille.com/structures-collectifs/espace-multimedia-gantner/"
    ],
    "region": "bourgogne-franche-comte",
    "origine": "v1",
    "verification_note": "Site officiel non joignable (DNS). Aucune boutique/librairie constatée ; fit possible seulement si dépôt accepté à l'accueil."
  },
  {
    "id": "bourgogne-franche-comte-22",
    "name": "L'Imaginarium",
    "city": "Belfort",
    "address": "Rue Lecourbe, 90000 Belfort",
    "description": "Non vérifié : aucune page consultée.",
    "website": "",
    "type": "autre",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "bourgogne-franche-comte",
    "origine": "v1",
    "verification_note": "Non vérifié."
  },
  {
    "id": "bourgogne-franche-comte-23",
    "name": "Musée Nicéphore Niépce",
    "city": "Chalon-sur-Saône",
    "address": "28 quai des Messageries, 71100 Chalon-sur-Saône",
    "description": "Musée de la photographie ; existence d'une librairie-boutique non vérifiée (aucune page consultée).",
    "website": "",
    "type": "musee",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "bourgogne-franche-comte",
    "origine": "v1",
    "verification_note": "Non vérifié."
  },
  {
    "id": "bourgogne-franche-comte-24",
    "name": "Librairie La Mandragore",
    "city": "Chalon-sur-Saône",
    "address": "3 rue des Tonneliers, 71100 Chalon-sur-Saône",
    "description": "Librairie indépendante, non vérifiée (annuaire Chalon inaccessible, erreur 503).",
    "website": "",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "bourgogne-franche-comte",
    "origine": "v1",
    "verification_note": "Non vérifié."
  },
  {
    "id": "bourgogne-franche-comte-25",
    "name": "Espace des Arts",
    "city": "Chalon-sur-Saône",
    "address": "5 bis avenue Nicéphore Niépce, 71100 Chalon-sur-Saône",
    "description": "Scène nationale (spectacle vivant) ; point de vente de livres non constaté, aucune page consultée.",
    "website": "",
    "type": "autre",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "bourgogne-franche-comte",
    "origine": "v1",
    "verification_note": "Probablement hors sujet (pas de librairie), à confirmer."
  },
  {
    "id": "bourgogne-franche-comte-26",
    "name": "Le Cadran Lunaire",
    "city": "Mâcon",
    "address": "27 rue Franche, 71000 Mâcon",
    "description": "Librairie indépendante, non vérifiée (annuaire Mâcon inaccessible, erreur 503).",
    "website": "",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "bourgogne-franche-comte",
    "origine": "v1",
    "verification_note": "Non vérifié."
  },
  {
    "id": "bourgogne-franche-comte-27",
    "name": "Librairie Ancienne Darreau Norbert",
    "city": "Mâcon",
    "address": "Place Saint-Pierre, 71000 Mâcon",
    "description": "Librairie ancienne (livres anciens/occasion), non vérifiée.",
    "website": "",
    "type": "librairie-specialisee",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "bourgogne-franche-comte",
    "origine": "v1",
    "verification_note": "Une librairie ancienne prend rarement de la micro-édition contemporaine."
  },
  {
    "id": "bourgogne-franche-comte-28",
    "name": "Ravisius Textor (Tombolo Presses)",
    "city": "Nevers",
    "address": "8 rue des 4 vents, 58000 Nevers",
    "description": "Petite librairie spécialisée graphisme, art contemporain et design, avec espace de reprographie Riso et de façonnage, et espace d'exposition/ateliers ; projet pédagogique porté par Tombolo Presses. Jeudi et samedi 14h-19h, entrée libre. Programme 2026 : école d'été (juillet), exposition « Almost There » du 19/09 au 28/11/2026.",
    "website": "http://www.ravisiustextor.eu/",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "http://www.ravisiustextor.eu/",
      "https://www.seizemille.com/structures-collectifs/ravisius-textor/"
    ],
    "region": "bourgogne-franche-comte",
    "origine": "v1",
    "verification_note": "Contact : ravisiustextor@t-o-m-b-o-l-o.eu. Lieu le plus pertinent de la région pour la micro-édition."
  },
  {
    "id": "bourgogne-franche-comte-29",
    "name": "Parc Saint-Léger – Centre d'art contemporain",
    "city": "Pougues-les-Eaux",
    "address": "23 avenue Conti, 58320 Pougues-les-Eaux",
    "description": "Centre d'art dont la fermeture est évoquée dans le brief ; il n'apparaît pas dans l'annuaire 2026 du réseau régional Seize Mille (49 membres), ce qui va dans le sens d'une cessation d'activité.",
    "website": "",
    "type": "musee",
    "status": "doubtful",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://www.seizemille.com/annuaire-du-reseau/"
    ],
    "region": "bourgogne-franche-comte",
    "origine": "v1",
    "verification_note": "Fermeture non confirmée par une page officielle : à vérifier avant tout détour."
  },
  {
    "id": "bourgogne-franche-comte-30",
    "name": "Librairie Obliques",
    "city": "Auxerre",
    "address": "2 place de l'Hôtel de Ville, 89000 Auxerre",
    "description": "Librairie indépendante, non vérifiée (annuaire Auxerre inaccessible, erreur 503).",
    "website": "",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "bourgogne-franche-comte",
    "origine": "v1",
    "verification_note": "Non vérifié."
  },
  {
    "id": "bourgogne-franche-comte-31",
    "name": "CRAC Fontenoy",
    "city": "Fontenoy",
    "address": "Château du Tremblay, 89520 Fontenoy",
    "description": "Centre d'art en Puisaye, non vérifié ; absent de l'annuaire du réseau Seize Mille.",
    "website": "",
    "type": "musee",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://www.seizemille.com/annuaire-du-reseau/"
    ],
    "region": "bourgogne-franche-comte",
    "origine": "v1",
    "verification_note": "Non vérifié ; boutique non constatée."
  },
  {
    "id": "bourgogne-franche-comte-32",
    "name": "La Fleur qui Pousse à l'Intérieur",
    "city": "Dijon",
    "address": "5 place des Cordeliers, 21000 Dijon",
    "description": "Librairie indépendante listée au 5 place des Cordeliers par l'annuaire LaPetiteLibrairie (piste du brief : librairie orientée illustration/graphisme).",
    "website": "",
    "type": "librairie-specialisee",
    "status": "unverified",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.lapetitelibrairie.fr/librairies/21231-dijon/"
    ],
    "region": "bourgogne-franche-comte",
    "origine": "ajout-2026",
    "verification_note": "Spécialité et horaires non vérifiés sur une page officielle."
  },
  {
    "id": "bourgogne-franche-comte-33",
    "name": "Librairie Gotham",
    "city": "Dijon",
    "address": "6 rue Auguste Comte, 21000 Dijon",
    "description": "Librairie listée par l'annuaire LaPetiteLibrairie ; nom suggérant une spécialisation BD/comics.",
    "website": "",
    "type": "librairie-specialisee",
    "status": "unverified",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.lapetitelibrairie.fr/librairies/21231-dijon/"
    ],
    "region": "bourgogne-franche-comte",
    "origine": "ajout-2026",
    "verification_note": "Spécialité non vérifiée."
  },
  {
    "id": "bourgogne-franche-comte-34",
    "name": "Au Chat Curieux",
    "city": "Dijon",
    "address": "11 rue des Bons Enfants, 21000 Dijon",
    "description": "Librairie indépendante listée par l'annuaire LaPetiteLibrairie.",
    "website": "",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.lapetitelibrairie.fr/librairies/21231-dijon/"
    ],
    "region": "bourgogne-franche-comte",
    "origine": "ajout-2026",
    "verification_note": "Non vérifié au-delà de l'annuaire."
  },
  {
    "id": "bourgogne-franche-comte-35",
    "name": "Café-librairie L'Interstice",
    "city": "Besançon",
    "address": "43 rue Mégevand, 25000 Besançon",
    "description": "Café-librairie indépendant listé par l'annuaire LaPetiteLibrairie.",
    "website": "",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.lapetitelibrairie.fr/librairies/25056-besancon/"
    ],
    "region": "bourgogne-franche-comte",
    "origine": "ajout-2026",
    "verification_note": "Non vérifié au-delà de l'annuaire."
  },
  {
    "id": "bourgogne-franche-comte-36",
    "name": "Livres dans la Boucle",
    "city": "Besançon",
    "address": "4 rue Gabriel Plançon, 25000 Besançon",
    "description": "Librairie listée par l'annuaire LaPetiteLibrairie.",
    "website": "",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.lapetitelibrairie.fr/librairies/25056-besancon/"
    ],
    "region": "bourgogne-franche-comte",
    "origine": "ajout-2026",
    "verification_note": "Non vérifié au-delà de l'annuaire."
  },
  {
    "id": "bourgogne-franche-comte-37",
    "name": "Reservoir Books",
    "city": "Besançon",
    "address": "6 rue Gustave Courbet, 25000 Besançon",
    "description": "Librairie listée par l'annuaire LaPetiteLibrairie.",
    "website": "",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.lapetitelibrairie.fr/librairies/25056-besancon/"
    ],
    "region": "bourgogne-franche-comte",
    "origine": "ajout-2026",
    "verification_note": "Non vérifié au-delà de l'annuaire."
  },
  {
    "id": "bourgogne-franche-comte-38",
    "name": "Librairie Mine de Rien",
    "city": "Besançon",
    "address": "12 rue Bersot, 25000 Besançon",
    "description": "Librairie listée par l'annuaire LaPetiteLibrairie.",
    "website": "",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.lapetitelibrairie.fr/librairies/25056-besancon/"
    ],
    "region": "bourgogne-franche-comte",
    "origine": "ajout-2026",
    "verification_note": "Non vérifié au-delà de l'annuaire."
  },
  {
    "id": "bourgogne-franche-comte-39",
    "name": "Librairie Forum Espace Culture",
    "city": "Besançon",
    "address": "18 place de la Révolution, 25000 Besançon",
    "description": "Librairie généraliste indépendante (piste du brief) listée place de la Révolution par l'annuaire LaPetiteLibrairie.",
    "website": "",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.lapetitelibrairie.fr/librairies/25056-besancon/"
    ],
    "region": "bourgogne-franche-comte",
    "origine": "ajout-2026",
    "verification_note": "Non vérifié au-delà de l'annuaire."
  },
  {
    "id": "bourgogne-franche-comte-40",
    "name": "Les2portes",
    "city": "Besançon",
    "address": "11 rue de Pontarlier, 25000 Besançon",
    "description": "Atelier-galerie artist-run créé en 2017 (Gwilherm Courbet, Thierry Millotte), lieu de production et d'exposition d'art contemporain, plus de 70 artistes exposés ; entrée libre, horaires non précisés.",
    "website": "http://les2portes.org",
    "type": "galerie-artist-run",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.seizemille.com/structures-collectifs/les2portes/"
    ],
    "region": "bourgogne-franche-comte",
    "origine": "ajout-2026",
    "verification_note": "Pas de point de vente de livres constaté."
  },
  {
    "id": "bourgogne-franche-comte-41",
    "name": "Éditions Untitled",
    "city": "Besançon",
    "address": "69 chemin de Valentin, 25000 Besançon",
    "description": "Maison d'édition associative de multiples et éditions d'artistes, qui diffuse via institutions et boutiques partenaires ; pas de lieu de vente propre indiqué.",
    "website": "http://editions-untitled.fr/",
    "type": "atelier-editeur",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.seizemille.com/structures-collectifs/editions-untitled/"
    ],
    "region": "bourgogne-franche-comte",
    "origine": "ajout-2026",
    "verification_note": "Contact plutôt qu'étape de dépôt : editions.untitled@gmail.com."
  },
  {
    "id": "bourgogne-franche-comte-42",
    "name": "La fraternelle – Maison du peuple",
    "city": "Saint-Claude",
    "address": "12 rue de la Poyat, 39200 Saint-Claude",
    "description": "Lieu culturel de 4 000 m² dans l'ancienne Maison du peuple (depuis 1984) : expositions, résidences, ateliers d'estampe, PAO, sérigraphie et imprimerie sur place, éditions (Instagram « editions_la_fraternelle »). Mardi-vendredi 9h30-12h30 et 14h-18h30, entrée libre.",
    "website": "http://www.maisondupeuple.fr/",
    "type": "atelier-editeur",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.seizemille.com/structures-collectifs/la-fraternelle/"
    ],
    "region": "bourgogne-franche-comte",
    "origine": "ajout-2026",
    "verification_note": "Point de vente de livres non constaté sur la page consultée."
  },
  {
    "id": "bourgogne-franche-comte-43",
    "name": "Hors Cadre",
    "city": "Auxerre",
    "address": "",
    "description": "Structure d'art contemporain membre du réseau Seize Mille à Auxerre ; fiche non consultée.",
    "website": "https://www.seizemille.com/structures-collectifs/hors-cadre/",
    "type": "galerie-artist-run",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://www.seizemille.com/annuaire-du-reseau/"
    ],
    "region": "bourgogne-franche-comte",
    "origine": "ajout-2026",
    "verification_note": "Adresse et nature du lieu non vérifiées."
  },
  {
    "id": "bourgogne-franche-comte-44",
    "name": "Café des Glaces",
    "city": "Tonnerre",
    "address": "",
    "description": "Lieu d'art contemporain membre du réseau Seize Mille à Tonnerre ; fiche non consultée.",
    "website": "https://www.seizemille.com/structures-collectifs/cafe-des-glaces/",
    "type": "galerie-artist-run",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://www.seizemille.com/annuaire-du-reseau/"
    ],
    "region": "bourgogne-franche-comte",
    "origine": "ajout-2026",
    "verification_note": "Adresse non vérifiée."
  },
  {
    "id": "bourgogne-franche-comte-45",
    "name": "Chez ta sœur",
    "city": "Tournus",
    "address": "",
    "description": "Lieu d'art contemporain membre du réseau Seize Mille à Tournus (entre Mâcon et Chalon) ; fiche non consultée.",
    "website": "https://www.seizemille.com/structures-collectifs/chez-ta-soeur/",
    "type": "galerie-artist-run",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://www.seizemille.com/annuaire-du-reseau/"
    ],
    "region": "bourgogne-franche-comte",
    "origine": "ajout-2026",
    "verification_note": "Adresse non vérifiée."
  },
  {
    "id": "bourgogne-franche-comte-46",
    "name": "Un Singe en Hiver",
    "city": "Dijon",
    "address": "",
    "description": "Collectif/lieu d'art contemporain dijonnais membre du réseau Seize Mille ; fiche non consultée.",
    "website": "https://www.seizemille.com/structures-collectifs/un-singe-en-hiver/",
    "type": "galerie-artist-run",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://www.seizemille.com/annuaire-du-reseau/"
    ],
    "region": "bourgogne-franche-comte",
    "origine": "ajout-2026",
    "verification_note": "Adresse non vérifiée."
  },
  {
    "id": "bourgogne-franche-comte-47",
    "name": "Galerrrie du GRRRANIT – Scène nationale",
    "city": "Belfort",
    "address": "",
    "description": "Galerie d'art contemporain de la scène nationale de Belfort, membre du réseau Seize Mille ; fiche non consultée.",
    "website": "https://www.seizemille.com/structures-collectifs/galerrrie-du-grrranit/",
    "type": "autre",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://www.seizemille.com/annuaire-du-reseau/"
    ],
    "region": "bourgogne-franche-comte",
    "origine": "ajout-2026",
    "verification_note": "Boutique non constatée."
  },
  {
    "id": "bourgogne-franche-comte-48",
    "name": "La Villa / Frac-Collection",
    "city": "Arc-lès-Gray",
    "address": "",
    "description": "Lieu d'exposition membre du réseau Seize Mille en Haute-Saône ; fiche non consultée.",
    "website": "https://www.seizemille.com/structures-collectifs/la-villa-frac-collection/",
    "type": "musee",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://www.seizemille.com/annuaire-du-reseau/"
    ],
    "region": "bourgogne-franche-comte",
    "origine": "ajout-2026",
    "verification_note": "Adresse et boutique non vérifiées."
  },
  {
    "id": "grand-est-1",
    "name": "FRAC Champagne-Ardenne",
    "city": "Reims",
    "address": "1 place Museux, 51100 Reims",
    "description": "Fonds régional d'art contemporain installé dans l'ancien collège des Jésuites. Ouvert mercredi-dimanche 14h-18h et mardi matin 9h-12h ; une rubrique « Shop » figure sur le site.",
    "website": "https://frac-champagneardenne.org/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://frac-champagneardenne.org/en/le-frac/infos"
    ],
    "region": "grand-est",
    "origine": "v1",
    "verification_note": "Existence d'une librairie physique non confirmée sur la page infos (page boutique en 404) ; contenu de la boutique inconnu."
  },
  {
    "id": "grand-est-2",
    "name": "49 Nord 6 Est – Frac Lorraine",
    "city": "Metz",
    "address": "1 bis rue des Trinitaires, 57000 Metz",
    "description": "Frac installé dans l'hôtel Saint-Livier. Ouvert mercredi-vendredi 14h-18h, samedi-dimanche 11h-19h. Le Frac publie ses propres éditions ; l'office de tourisme de Metz mentionne une boutique et une bibliothèque sur place.",
    "website": "https://www.fraclorraine.org/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.fraclorraine.org/en/",
      "https://www.fraclorraine.org/en/collection-et-ressources/editions/",
      "https://www.tourisme-metz.com/en/page/838162244-49-nord-6-est-frac-lorraine"
    ],
    "region": "grand-est",
    "origine": "v1",
    "verification_note": "Le site officiel ne décrit pas de point de vente ; la mention « Shop » vient de l'office de tourisme."
  },
  {
    "id": "grand-est-3",
    "name": "Frac Alsace",
    "city": "Sélestat",
    "address": "1 route de Marckolsheim, 67600 Sélestat",
    "description": "Fonds régional d'art contemporain, entrée libre. Programmation 2026-2027 en ligne (Estelle Hoffert du 11/09/2026 au 10/01/2027, Régionale 27 dès le 04/12/2026). Horaires indiqués : lundi-samedi 14h-18h.",
    "website": "https://frac-alsace.org/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://frac-alsace.org/"
    ],
    "region": "grand-est",
    "origine": "v1",
    "verification_note": "Aucune librairie/boutique mentionnée sur le site ; à confirmer sur place."
  },
  {
    "id": "grand-est-4",
    "name": "Séries Graphiques",
    "city": "Strasbourg",
    "address": "5 rue de la Douane",
    "description": "Librairie indépendante d'illustration/graphisme liée au studio Samuel Gadea. Le site répond en erreur 503 et les seules sources datent de 2014 ; la librairie n'apparaît pas dans le tour d'horizon des 23 librairies strasbourgeoises de Pokaa (10/2024).",
    "website": "http://seriesgraphiques.samuelgadea.com/",
    "type": "librairie-specialisee",
    "status": "doubtful",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "http://seriesgraphiques.samuelgadea.com/",
      "https://mariannebellanger.wordpress.com/2014/03/21/series-graphiques-une-librairie-specialisee-a-strasbourg/",
      "https://pokaa.fr/2024/10/09/lire-cest-sexy-a-strasbourg-ces-23-librairies-nous-font-redecouvrir-le-plaisir-de-bouquiner/"
    ],
    "region": "grand-est",
    "origine": "v1",
    "verification_note": "Probablement fermée ; aucune preuve de fermeture trouvée, aucune trace d'activité récente non plus."
  },
  {
    "id": "grand-est-5",
    "name": "Librairie Le Tigre",
    "city": "Strasbourg",
    "address": "36 quai des Bateliers, 67000 Strasbourg",
    "description": "Librairie indépendante « underground » de BD, roman graphique et micro-édition, mardi-samedi 10h-19h. Vendue en novembre 2025 à la société Le 36 (Laurent Singer) : transformation en café-librairie prévue au 1er semestre 2026, l'ancien gérant Nicolas Deprez restant salarié pour la partie librairie avec la même ligne éditoriale.",
    "website": "https://librairie-letigre.fr/",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://librairie-letigre.fr/",
      "https://www.rue89strasbourg.com/librairie-le-tigre-vendue-cafe-366744",
      "https://actualitte.com/article/127572/librairie/a-strasbourg-la-librairie-le-tigre-a-un-nouveau-proprietaire",
      "https://www.strasbourg.eu/lieu/-/entity/id/339989514/librairie-le-tigre"
    ],
    "region": "grand-est",
    "origine": "v1",
    "verification_note": "Vérifier si le café-librairie a rouvert après travaux et si la surface librairie (arrière-boutique) accepte encore le dépôt."
  },
  {
    "id": "grand-est-6",
    "name": "L'Image et le Livre",
    "city": "Strasbourg",
    "address": "12 rue Jacques Peirotes, 67000 Strasbourg",
    "description": "Librairie de livres anciens, estampes, manuscrits et dessins du XVe au XXe siècle, fondée en 1976. Mardi-vendredi 10h-12h / 14h-18h30, samedi 10h-12h / 14h30-18h.",
    "website": "https://www.limage-et-le-livre.com/",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://www.limage-et-le-livre.com/en"
    ],
    "region": "grand-est",
    "origine": "v1",
    "verification_note": "Aucune édition contemporaine ni livre d'artiste au catalogue : hors cible.",
    "retired": true
  },
  {
    "id": "grand-est-7",
    "name": "Micro-Librairie Central Vapeur",
    "city": "Strasbourg",
    "address": "Garage Coop, 2 rue de la Coopérative, 67000 Strasbourg",
    "description": "Micro-librairie de 18 m² rouverte le 16/11/2025 au Garage Coop (rez-de-chaussée), ouverte le mercredi 10h-12h et 14h-18h. Micro-éditions, fanzines, revues, BD, livres-objets, en dépôt-vente (commission 20 % micro-éditeurs, 35 % structures plus grosses) ; proposition par mail à info@centralvapeur.org, max 3 titres et 20 exemplaires par éditeur.",
    "website": "https://centralvapeur.org/micro-librairie-central-vapeur/",
    "type": "atelier-editeur",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://centralvapeur.org/micro-librairie-central-vapeur/",
      "https://garage-coop.org/membre/central-vapeur/"
    ],
    "region": "grand-est",
    "origine": "v1",
    "verification_note": "Priorité aux productions locales/régionales ; format livre à pages obligatoire."
  },
  {
    "id": "grand-est-8",
    "name": "Troc'afé",
    "city": "Strasbourg",
    "address": "8 rue du Faubourg-de-Saverne, 67000 Strasbourg",
    "description": "Café-bar ouvert depuis 1996, lundi-vendredi 7h30-23h, samedi 10h-22h, dimanche 10h-20h ; concerts. Aucune mention de vente de livres ou d'éditions dans les annuaires consultés.",
    "website": "https://www.facebook.com/letrocafe/",
    "type": "autre",
    "status": "active",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://www.pagesjaunes.fr/pros/06201909",
      "https://strasbourg.curieux.net/annuaire/le-troc-afe-strasbourg"
    ],
    "region": "grand-est",
    "origine": "v1",
    "verification_note": "Si Jeanson y a déjà déposé, garder ; sinon pas de point de vente identifié.",
    "retired": true
  },
  {
    "id": "grand-est-9",
    "name": "Librairie du Musée d'Art Moderne et Contemporain (MAMCS)",
    "city": "Strasbourg",
    "address": "1 place Hans-Jean-Arp, 67000 Strasbourg",
    "description": "Librairie du MAMCS exploitée par la Librairie Kléber, accessible sans billet dans le hall. Mercredi 11h-17h15, jeudi 10h-17h, vendredi-dimanche 11h-17h45. Catalogues, monographies, revues d'art, design, photo, architecture.",
    "website": "https://www.strasbourg.eu/lieu/-/entity/sig/1702_CUL_191/librairie-du-musee-d-art-moderne-et-contemporain",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.strasbourg.eu/lieu/-/entity/sig/1702_CUL_191/librairie-du-musee-d-art-moderne-et-contemporain",
      "https://www.pagesjaunes.fr/pros/52352987"
    ],
    "region": "grand-est",
    "origine": "v1",
    "verification_note": "Décision de dépôt probablement prise par la Librairie Kléber."
  },
  {
    "id": "grand-est-11",
    "name": "La Factorine",
    "city": "Nancy",
    "address": "14-16 rue Stanislas, 54000 Nancy",
    "description": "Vitrine artistique associative fondée par trois anciens étudiants des Beaux-Arts dans un ancien magasin de cadres : « La Vitrine » (galerie vivante) et « L'Usine » (ateliers, coworking), horaires selon programmation, entrée gratuite.",
    "website": "https://lafactorine.fr/",
    "type": "galerie-artist-run",
    "status": "unverified",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.petitfute.com/v20962-nancy-54000/c1173-visites-points-d-interet/c999-galerie-d-art-lieu-d-exposition-fondation-centre-culturel/1614897-la-factorine.html",
      "https://www.actualitte.com/article/reportages/nancy-dans-les-marges-le-livre-se-deplace/60507"
    ],
    "region": "grand-est",
    "origine": "v1",
    "verification_note": "Site officiel inaccessible (DNS), page Facebook non consultable ; aucune preuve d'activité 2025-2026 ni de point de vente d'éditions."
  },
  {
    "id": "grand-est-12",
    "name": "Galerie Modulab",
    "city": "Metz",
    "address": "28 rue Mazelle, 57000 Metz",
    "description": "Galerie et atelier de création autour de l'image imprimée, qui produit et vend des éditions et multiples d'artistes (tirages < 30 ex.). Jeudi-samedi 14h-18h et sur rendez-vous ; présente sur Drawing Now, Art-o-rama, Luxembourg Art Week. Site mis à jour en mars 2026.",
    "website": "https://www.modulab.fr/",
    "type": "galerie-artist-run",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://www.modulab.fr/modulab/",
      "https://www.actualitte.com/article/reportages/nancy-dans-les-marges-le-livre-se-deplace/60507",
      "https://metz.fr/lieux/lieu-384.php"
    ],
    "region": "grand-est",
    "origine": "v1"
  },
  {
    "id": "grand-est-13",
    "name": "Papier Bon Œil",
    "city": "Reims",
    "address": "37 bis rue des Capucins, 51100 Reims",
    "description": "Studio de création, boutique d'affiches et objets graphiques, atelier de risographie (Print Club) et galerie, tenu par Amélie du Petit Thouars et Jonathan Ghodsi. Lundi-samedi 12h-18h30 ; fonds de livres et fanzines graphisme/illustration/micro-édition sur place.",
    "website": "https://papierbonoeil.com/",
    "type": "atelier-editeur",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://papierbonoeil.com/",
      "https://www.francebleu.fr/infos/societe/en-images-reims-papier-bon-oeil-un-lieu-hybride-pour-faire-decouvrir-le-graphisme-au-grand-public-5920280"
    ],
    "region": "grand-est",
    "origine": "v1"
  },
  {
    "id": "grand-est-14",
    "name": "Centre d'art contemporain – la synagogue de Delme",
    "city": "Delme",
    "address": "33 rue Poincaré, 57590 Delme",
    "description": "Centre d'art dans une ancienne synagogue, entrée libre, mercredi-dimanche 14h-18h. Exposition « L'envers de l'ordinaire » (Marianne Berenhaut, Hana Miletić) du 11/07 au 06/12/2026 ; rubrique Éditions sur le site.",
    "website": "https://www.cac-synagoguedelme.org/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://www.cac-synagoguedelme.org/"
    ],
    "region": "grand-est",
    "origine": "v1",
    "verification_note": "Adresse postale non affichée sur la page consultée ; point de vente physique des éditions non confirmé."
  },
  {
    "id": "grand-est-15",
    "name": "Librairie Quai des Brumes",
    "city": "Strasbourg",
    "address": "120 Grand'Rue, 67000 Strasbourg",
    "description": "Librairie littéraire indépendante (réseau Initiales) axée poésie, petits éditeurs et éditions québécoises (Noroît, La Peuplade, Divergences, Marchialy). Lundi 14h-19h, mardi-samedi 10h-19h ; rencontres et expositions programmées à l'automne 2026.",
    "website": "https://www.quaidesbrumes.com/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://www.quaidesbrumes.com/",
      "https://pokaa.fr/2024/10/09/lire-cest-sexy-a-strasbourg-ces-23-librairies-nous-font-redecouvrir-le-plaisir-de-bouquiner/"
    ],
    "region": "grand-est",
    "origine": "ajout-2026"
  },
  {
    "id": "grand-est-16",
    "name": "Librairie Kléber",
    "city": "Strasbourg",
    "address": "1 rue des Francs-Bourgeois, 67000 Strasbourg",
    "description": "Grande librairie indépendante généraliste de Strasbourg, connue pour ses rencontres-débats ; elle exploite aussi la librairie du MAMCS.",
    "website": "https://www.librairie-kleber.com/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://pokaa.fr/2020/09/12/strasbourg-9-librairies-specialisees-a-decouvrir-au-coin-de-la-rue-independantes/",
      "https://www.strasbourg.eu/lieu/-/entity/sig/1702_CUL_191/librairie-du-musee-d-art-moderne-et-contemporain"
    ],
    "region": "grand-est",
    "origine": "ajout-2026",
    "verification_note": "Site officiel en 403 ; adresse tirée d'un article Pokaa 2020, horaires non vérifiés."
  },
  {
    "id": "grand-est-17",
    "name": "L'Oiseau Rare",
    "city": "Strasbourg",
    "address": "23 quai des Bateliers, 67000 Strasbourg",
    "description": "Lieu hybride galerie-librairie-café sur le quai des Bateliers, à quelques numéros du Tigre, cité dans les deux tours d'horizon Pokaa (2020 et 2024).",
    "website": "",
    "type": "galerie-artist-run",
    "status": "active",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://pokaa.fr/2024/10/09/lire-cest-sexy-a-strasbourg-ces-23-librairies-nous-font-redecouvrir-le-plaisir-de-bouquiner/",
      "https://pokaa.fr/2020/09/12/strasbourg-9-librairies-specialisees-a-decouvrir-au-coin-de-la-rue-independantes/"
    ],
    "region": "grand-est",
    "origine": "ajout-2026",
    "verification_note": "Pas de site trouvé ; horaires et politique de dépôt inconnus."
  },
  {
    "id": "grand-est-18",
    "name": "Librairie Le Fil Rouge",
    "city": "Strasbourg",
    "address": "78 route de Mittelhausbergen, 67200 Strasbourg",
    "description": "Librairie-café indépendante de quartier (Cronenbourg) proposant livres d'art, alsatiques et jeux, d'après Pokaa (10/2024).",
    "website": "",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://pokaa.fr/2024/10/09/lire-cest-sexy-a-strasbourg-ces-23-librairies-nous-font-redecouvrir-le-plaisir-de-bouquiner/"
    ],
    "region": "grand-est",
    "origine": "ajout-2026",
    "verification_note": "Code postal déduit du quartier, non vérifié ; pas de site consulté."
  },
  {
    "id": "grand-est-19",
    "name": "Au Bonheur des Livres",
    "city": "Strasbourg",
    "address": "11 rue du Général-de-Castelnau, 67000 Strasbourg",
    "description": "Librairie indépendante généraliste avec rayon jeunesse et expositions d'artistes, d'après Pokaa (10/2024).",
    "website": "",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://pokaa.fr/2024/10/09/lire-cest-sexy-a-strasbourg-ces-23-librairies-nous-font-redecouvrir-le-plaisir-de-bouquiner/"
    ],
    "region": "grand-est",
    "origine": "ajout-2026",
    "verification_note": "Pas de site consulté."
  },
  {
    "id": "grand-est-20",
    "name": "Librairie Chapitre 8",
    "city": "Strasbourg",
    "address": "5 rue de Verdun, 67000 Strasbourg",
    "description": "Petite librairie indépendante généraliste (plus de 7 000 titres) organisant des ateliers, d'après Pokaa (10/2024).",
    "website": "",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://pokaa.fr/2024/10/09/lire-cest-sexy-a-strasbourg-ces-23-librairies-nous-font-redecouvrir-le-plaisir-de-bouquiner/"
    ],
    "region": "grand-est",
    "origine": "ajout-2026",
    "verification_note": "Pas de site consulté."
  },
  {
    "id": "grand-est-21",
    "name": "Librairie Gutenberg",
    "city": "Strasbourg",
    "address": "10 place Saint-Étienne, 67000 Strasbourg",
    "description": "Librairie indépendante généraliste avec coups de cœur manuscrits, d'après Pokaa (10/2024).",
    "website": "",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://pokaa.fr/2024/10/09/lire-cest-sexy-a-strasbourg-ces-23-librairies-nous-font-redecouvrir-le-plaisir-de-bouquiner/"
    ],
    "region": "grand-est",
    "origine": "ajout-2026",
    "verification_note": "Pas de site consulté."
  },
  {
    "id": "grand-est-22",
    "name": "La Tache Noire",
    "city": "Strasbourg",
    "address": "1 rue de Zurich, 67000 Strasbourg",
    "description": "Librairie-café spécialisée polar et roman noir (environ 4 000 titres), citée par Pokaa en 2020 et 2024.",
    "website": "",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://pokaa.fr/2024/10/09/lire-cest-sexy-a-strasbourg-ces-23-librairies-nous-font-redecouvrir-le-plaisir-de-bouquiner/"
    ],
    "region": "grand-est",
    "origine": "ajout-2026",
    "verification_note": "Spécialisation polar : pertinence faible pour la micro-édition, à tester."
  },
  {
    "id": "grand-est-23",
    "name": "CEAAC – Centre européen d'actions artistiques contemporaines",
    "city": "Strasbourg",
    "address": "7 rue de l'Abreuvoir, 67000 Strasbourg",
    "description": "Centre d'art contemporain avec Project Space ; rubrique Éditions sur le site. Exposition « Crabe Chorus » de Violaine Lochu du 20/09/2026 au 07/02/2027 (vernissage 19/09/2026).",
    "website": "https://ceaac.org/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ceaac.org/"
    ],
    "region": "grand-est",
    "origine": "ajout-2026",
    "verification_note": "Horaires et existence d'un point de vente non affichés sur la page d'accueil."
  },
  {
    "id": "grand-est-24",
    "name": "Stimultania – Pôle de photographie",
    "city": "Strasbourg",
    "address": "33 rue Kageneck, 67000 Strasbourg",
    "description": "Pôle de photographie (Strasbourg et Givors) fondé en 1987, avec une boutique d'éditions photographiques. Nouvel espace d'accueil du public ouvert le 09/10/2026 avec l'exposition « Neo-Analog » (jusqu'au 09/01/2027).",
    "website": "https://www.stimultania.org/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.stimultania.org/"
    ],
    "region": "grand-est",
    "origine": "ajout-2026",
    "verification_note": "Horaires non affichés ; boutique vue sur le site, présence physique à confirmer."
  },
  {
    "id": "grand-est-25",
    "name": "La Chambre – espace d'exposition et de formation à l'image",
    "city": "Strasbourg",
    "address": "4 place d'Austerlitz, 67000 Strasbourg",
    "description": "Espace photo associatif, entrée libre, mercredi-dimanche 14h-19h. Expositions « Points de bascule » (12-20/09/2026) et « Archifoto » (26/09-31/10/2026).",
    "website": "https://www.la-chambre.org/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.la-chambre.org/"
    ],
    "region": "grand-est",
    "origine": "ajout-2026",
    "verification_note": "Aucune librairie mentionnée sur le site ; dépôt à négocier."
  },
  {
    "id": "grand-est-26",
    "name": "Librairie-boutique du Centre Pompidou-Metz",
    "city": "Metz",
    "address": "1 parvis des Droits-de-l'Homme, 57020 Metz",
    "description": "Librairie-boutique du musée d'art moderne et contemporain de Metz (adresse et téléphone 03 87 15 39 39 sur la page infos pratiques).",
    "website": "https://www.centrepompidou-metz.fr/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.centrepompidou-metz.fr/fr/infos-pratiques"
    ],
    "region": "grand-est",
    "origine": "ajout-2026",
    "verification_note": "La page infos pratiques consultée ne détaille ni horaires ni gestionnaire de la librairie (page librairie-boutique en 404)."
  },
  {
    "id": "grand-est-27",
    "name": "Galerie Poirel",
    "city": "Nancy",
    "address": "",
    "description": "Galerie d'exposition municipale (art, design, graphisme), ouverte en période d'exposition du mercredi au samedi 14h-18h et les premiers dimanches du mois ; billetterie en ligne, tél. 03 83 32 31 25.",
    "website": "https://poirel.nancy.fr/",
    "type": "musee",
    "status": "active",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://poirel.nancy.fr/"
    ],
    "region": "grand-est",
    "origine": "ajout-2026",
    "verification_note": "Adresse postale non affichée sur la page d'accueil ; boutique non mentionnée."
  },
  {
    "id": "grand-est-28",
    "name": "La Kunsthalle Mulhouse",
    "city": "Mulhouse",
    "address": "La Fonderie, 16 rue de la Fonderie, 68093 Mulhouse",
    "description": "Centre d'art contemporain de la ville de Mulhouse, entrée libre, ouvert en période d'exposition mercredi-vendredi 12h-18h et samedi-dimanche 14h-18h. Exposition « Persistances – Hassan Darsi » du 12/06 au 25/10/2026 ; éditions propres listées sur le site.",
    "website": "https://kunsthallemulhouse.com/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://kunsthallemulhouse.com/",
      "https://kunsthallemulhouse.com/informations-pratiques/",
      "https://kunsthallemulhouse.com/editions/"
    ],
    "region": "grand-est",
    "origine": "ajout-2026",
    "verification_note": "Aucun point de vente physique mentionné pour les éditions."
  },
  {
    "id": "grand-est-29",
    "name": "Le Signe – Centre national du graphisme",
    "city": "Chaumont",
    "address": "1 place Émile-Goguenheim, 52000 Chaumont",
    "description": "Centre national dédié au graphisme (biennale internationale de design graphique), avec un pôle éditions (revue Le Signe Design, catalogues). Expositions en cours jusqu'au 20/09/2026 (GraphicDesign.zip, Voyage illustré en Ukraine) et 29/11/2026 (Les Ambassadeurs). Tél. 03 25 35 79 01.",
    "website": "https://www.centrenationaldugraphisme.fr/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.centrenationaldugraphisme.fr/"
    ],
    "region": "grand-est",
    "origine": "ajout-2026",
    "verification_note": "Horaires et boutique physique non confirmés (page infos pratiques en 404) ; lieu très pertinent pour un objet graphique type chéquier."
  },
  {
    "id": "ile-de-france-1",
    "name": "MAC VAL – Musée d'art contemporain du Val-de-Marne",
    "city": "Vitry-sur-Seine",
    "address": "Place de la Libération, 94400 Vitry-sur-Seine",
    "description": "Musée d'art contemporain départemental, ouvert du mardi au dimanche 11h-18h (fermé lundi, 1er janvier, 1er mai, 15 août, 25 décembre). Restaurant Vert-Verre sur place ; l'existence d'une librairie-boutique n'apparaît pas sur les pages consultées.",
    "website": "https://www.macval.fr/",
    "type": "musee",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.macval.fr/Informations-pratiques",
      "https://www.offi.fr/expositions-musees/mac-val-1444.html"
    ],
    "region": "ile-de-france",
    "origine": "v1",
    "verification_note": "Librairie-boutique non confirmée sur les pages consultées : à vérifier sur place avant dépôt."
  },
  {
    "id": "ile-de-france-2",
    "name": "Cneai = (Centre national édition art image)",
    "city": "L'Île-Saint-Denis",
    "address": "1 bis rue Méchin / Place des Arts, 93450 L'Île-Saint-Denis",
    "description": "Centre d'art dédié à l'édition d'artiste. N'est plus à Pantin : le site officiel donne une adresse à L'Île-Saint-Denis (siège), avec un déménagement annoncé en 2026 vers la « Maison Fleuve » dans la même commune ; espaces aussi à la Cité internationale universitaire de Paris. Ouverture selon programmation, fermé dimanche, jours fériés et en août.",
    "website": "https://cneai.com/",
    "type": "autre",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://cneai.com/en/visit",
      "https://cneai.com/en/houses",
      "https://www.paris-art.com/lieux/cneai/"
    ],
    "region": "ile-de-france",
    "origine": "v1",
    "verification_note": "L'adresse de Pantin (Magasins généraux) est obsolète. Aucun point de vente public d'éditions identifié sur le site : contacter public@cneai.com avant de venir."
  },
  {
    "id": "ile-de-france-3",
    "name": "Le Crédac – Centre d'art contemporain d'Ivry",
    "city": "Ivry-sur-Seine",
    "address": "La Manufacture des Œillets, 1 place Pierre Gosnat, 94200 Ivry-sur-Seine",
    "description": "Centre d'art contemporain d'intérêt national installé à la Manufacture des Œillets ; le site mentionne une librairie (bookshop) et un espace de documentation, et vend ses propres publications (dernières parutions 2025-2026). Horaires non trouvés sur les pages consultées.",
    "website": "https://credac.fr/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://credac.fr/en/presentation",
      "https://credac.fr/en/publications"
    ],
    "region": "ile-de-france",
    "origine": "v1",
    "verification_note": "La librairie semble centrée sur les éditions du Crédac ; dépôt de tiers à négocier."
  },
  {
    "id": "ile-de-france-4",
    "name": "La Galerie, centre d'art contemporain de Noisy-le-Sec",
    "city": "Noisy-le-Sec",
    "address": "1 Rue Jean Jaurès, 93130 Noisy-le-Sec",
    "description": "Centre d'art municipal en activité : exposition de Haig Aivazian du 10 septembre au 12 décembre 2026. Adresse et horaires non affichés sur la page consultée ; aucun point de vente mentionné.",
    "website": "https://lagalerie-cac-noisylesec.fr/",
    "type": "autre",
    "status": "active",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://lagalerie-cac-noisylesec.fr/actuellement/",
      "https://www.cnap.fr/annuaire/lieu/la-galerie-centre-dart-contemporain-de-noisy-le-sec"
    ],
    "region": "ile-de-france",
    "origine": "v1",
    "verification_note": "Adresse conservée du brief, non revue sur le site officiel. Point de vente d'éditions non confirmé."
  },
  {
    "id": "ile-de-france-5",
    "name": "Centre Tignous d'art contemporain",
    "city": "Montreuil",
    "address": "116 rue de Paris, 93100 Montreuil",
    "description": "Centre d'art municipal de Montreuil (expositions, résidences, médiation, documentation) ; programmation 2025-2026 en ligne. Aucun point de vente/librairie mentionné sur le site.",
    "website": "https://centretignousdartcontemporain.fr/",
    "type": "autre",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://centretignousdartcontemporain.fr/",
      "https://www.montreuil.fr/sortir-et-bouger/culture/arts-visuels/centre-tignous-dart-contemporain"
    ],
    "region": "ile-de-france",
    "origine": "v1",
    "verification_note": "Horaires à consulter sur la page « Accès et horaires » ; pas de boutique documentée."
  },
  {
    "id": "ile-de-france-6",
    "name": "CAC Brétigny",
    "city": "Brétigny-sur-Orge",
    "address": "Rue Henri Douard, 91220 Brétigny-sur-Orge",
    "description": "Centre d'art contemporain d'intérêt national, ouvert du mardi au samedi 14h-18h (plus soirs et dimanches de spectacle au théâtre attenant). Produit et vend ses publications.",
    "website": "https://cacbretigny.com/",
    "type": "autre",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.cnap.fr/annuaire/lieu/cac-bretigny",
      "https://dca-art.com/les-centres-d-art-contemporain/membres/cac-bretigny-centre-d-art-contemporain-d-interet-national"
    ],
    "region": "ile-de-france",
    "origine": "v1",
    "verification_note": "Pas de librairie dédiée identifiée ; vente d'éditions maison seulement, d'après la fiche Cnap."
  },
  {
    "id": "ile-de-france-7",
    "name": "La Ferme du Buisson – Centre d'art contemporain",
    "city": "Noisiel",
    "address": "Allée de la Ferme, 77186 Noisiel",
    "description": "Scène nationale avec centre d'art, ouvert pendant les expositions du mercredi au vendredi 14h-18h et samedi-dimanche 14h-19h30. Aucune librairie/boutique mentionnée sur les pages pratiques.",
    "website": "https://www.lafermedubuisson.com/",
    "type": "autre",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.lafermedubuisson.com/fr/acces-et-horaires",
      "https://www.cnap.fr/annuaire/lieu/centre-dart-contemporain-de-la-ferme-du-buisson"
    ],
    "region": "ile-de-france",
    "origine": "v1",
    "verification_note": "Point de vente non confirmé."
  },
  {
    "id": "ile-de-france-8",
    "name": "Les Églises – Centre d'art contemporain de la ville de Chelles",
    "city": "Chelles",
    "address": "Esplanade de la Légion d'Honneur, 77500 Chelles",
    "description": "Centre d'art municipal dans deux anciennes églises, entrée libre, ouvert samedi et dimanche 15h-18h et en semaine sur rendez-vous. Exposition « Sirènes » de Jeanne Macaigne du 19 septembre au 6 décembre 2026.",
    "website": "https://www.chelles.fr/mon-temps-libre/culture/centre-art-les-eglises/",
    "type": "autre",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.chelles.fr/mon-temps-libre/culture/centre-art-les-eglises/",
      "https://www.timeout.fr/paris/art/les-eglises-centre-dart-contemporain-de-la-ville-de-chelles"
    ],
    "region": "ile-de-france",
    "origine": "v1",
    "verification_note": "Adresse donnée par la ville ; d'autres annuaires indiquent « rue Louis Éterlet » (même site). Aucun point de vente documenté."
  },
  {
    "id": "ile-de-france-9",
    "name": "MABA – Maison d'art Bernard Anthonioz",
    "city": "Nogent-sur-Marne",
    "address": "16 rue Charles VII, 94130 Nogent-sur-Marne",
    "description": "Lieu d'exposition de la Fondation des Artistes (4 à 5 expositions par an : photographie, graphisme, vidéo), entrée libre. Ouvert en semaine 13h-18h, samedi-dimanche 12h-18h, fermé mardi et jours fériés.",
    "website": "https://www.fondationdesartistes.fr/lieu/maba/",
    "type": "autre",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ville-nogentsurmarne.com/culture-loisirs-sports/culture/lieux-culturels/maison-dart-bernard-anthonioz/",
      "https://www.offi.fr/expositions-musees/maison-bernard-anthonioz-3657.html"
    ],
    "region": "ile-de-france",
    "origine": "v1",
    "verification_note": "Point de vente d'éditions non confirmé."
  },
  {
    "id": "ile-de-france-10",
    "name": "Les Laboratoires d'Aubervilliers",
    "city": "Aubervilliers",
    "address": "41 rue Lécuyer, 93300 Aubervilliers",
    "description": "Lieu de recherche et de création artistique avec une politique d'édition propre (catalogue en ligne) ; bureaux ouverts du lundi au vendredi 10h-18h hors événements publics. Calendrier 2026 actif.",
    "website": "https://leslaboratoires.org/",
    "type": "autre",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://leslaboratoires.org/informations/contact-acces",
      "https://leslaboratoires.org/editions"
    ],
    "region": "ile-de-france",
    "origine": "v1",
    "verification_note": "Vente d'éditions sur place non précisée ; un « chargé des publics et des éditions » est le contact à solliciter."
  },
  {
    "id": "ile-de-france-11",
    "name": "Laurel Parker Book",
    "city": "Romainville",
    "address": "43 rue de la Commune de Paris, 93230 Romainville",
    "description": "Atelier de conception et fabrication de livres d'artiste (depuis 2008), également éditeur de multiples, installé dans le site Komunuma ; un « Artist Book Space » (galerie-librairie-bibliothèque) y est mentionné depuis 2020. Visite sur rendez-vous (mail ou téléphone).",
    "website": "https://www.laurelparkerbook.com/",
    "type": "atelier-editeur",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://www.laurelparkerbook.com/en/infos/",
      "https://laurelparkerbook.bigcartel.com/atelier"
    ],
    "region": "ile-de-france",
    "origine": "v1",
    "verification_note": "Pas d'horaires publics ; conditions de vente au public de l'Artist Book Space à confirmer."
  },
  {
    "id": "ile-de-france-12",
    "name": "Mains d'Œuvres",
    "city": "Saint-Ouen",
    "address": "1 rue Charles Garnier, 93400 Saint-Ouen",
    "description": "Lieu culturel hybride (concerts, résidences, ateliers) ; festival MOFO les 12-14 mars 2026. Aucune boutique ni vente d'éditions mentionnée sur les pages consultées.",
    "website": "https://www.mainsdoeuvres.org/",
    "type": "autre",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.mainsdoeuvres.org/agenda/promofo",
      "https://www.sortiraparis.com/en/lieux/52472-mains-d-oeuvres"
    ],
    "region": "ile-de-france",
    "origine": "v1",
    "verification_note": "Point de vente non confirmé : intérêt pour le dépôt incertain."
  },
  {
    "id": "ile-de-france-13",
    "name": "La Marbrerie",
    "city": "Montreuil",
    "address": "21 rue Alexis Lepère, 93100 Montreuil",
    "description": "Ancien espace industriel de 1 500 m² près de la mairie : salle de concerts, cantine, bar, espace galerie/ateliers ; programmation de concerts jusqu'en 2027. Aucune boutique ni librairie documentée.",
    "website": "https://lamarbrerie.fr/",
    "type": "autre",
    "status": "active",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://93.agendaculturel.fr/la-marbrerie",
      "https://mapetitebanlieue.fr/la-marbrerie-montreuil/"
    ],
    "region": "ile-de-france",
    "origine": "v1",
    "verification_note": "Mappy indique une autre adresse (2 av. de la Résistance) ; l'adresse rue Alexis Lepère est celle de l'agenda culturel et de mapetitebanlieue. Pas de point de vente de livres.",
    "retired": true
  },
  {
    "id": "ile-de-france-14",
    "name": "Le Générateur",
    "city": "Gentilly",
    "address": "16 rue Charles Frérot, 94250 Gentilly",
    "description": "Lieu d'art et de performances (arts vivants, expositions, Nuit Blanche). Aucun point de vente mentionné.",
    "website": "https://www.legenerateur.com/fr/",
    "type": "autre",
    "status": "active",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://www.ville-gentilly.fr/annuaires/commerces-et-services/lieu-dart-et-de-performances/le-generateur",
      "https://www.sortiraparis.com/en/lieux/53954-the-generator"
    ],
    "region": "ile-de-france",
    "origine": "v1",
    "verification_note": "Pas de librairie/boutique : hors sujet pour un dépôt.",
    "retired": true
  },
  {
    "id": "ile-de-france-15",
    "name": "Anis Gras – Le lieu de l'Autre",
    "city": "Arcueil",
    "address": "55 avenue Laplace, 94110 Arcueil",
    "description": "Lieu culturel (spectacles, expositions, café des enfants, cantine) avec un programme septembre-décembre 2026 en ligne. Aucune librairie ni boutique mentionnée.",
    "website": "https://lelieudelautre.com/",
    "type": "autre",
    "status": "active",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://lelieudelautre.com/",
      "https://www.arcueil.fr/demarches-et-services/culture/anis-gras-le-lieu-de-lautre/"
    ],
    "region": "ile-de-france",
    "origine": "v1",
    "verification_note": "Pas de point de vente de livres documenté.",
    "retired": true
  },
  {
    "id": "ile-de-france-16",
    "name": "Librairie Zenobi",
    "city": "Malakoff",
    "address": "50 avenue Pierre Larousse, 92240 Malakoff",
    "description": "Librairie-papeterie-presse indépendante, avec une thématique « villes ». Tél. 01 57 63 89 10 ; horaires non trouvés.",
    "website": "https://www.facebook.com/librairiezenobi/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.malakoff.fr/113-2343/cadre-de-vie/commerces-et-marches/annuaire-des-commerces/ficheAnnu/librairie-zenobi.htm",
      "https://www.parislibrairies.fr/librairie-5894/malakoff/Zenobi/"
    ],
    "region": "ile-de-france",
    "origine": "v1",
    "verification_note": "Pas de site propre ; horaires à confirmer."
  },
  {
    "id": "ile-de-france-17",
    "name": "Zeugma Librairie",
    "city": "Montreuil",
    "address": "7 avenue Walwein, 93100 Montreuil",
    "description": "Librairie indépendante généraliste de Montreuil (tél. 01 76 58 36 41), référencée par des éditeurs indépendants (Zulma). Horaires non trouvés.",
    "website": "https://www.facebook.com/zeugmalibrairie/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.zulma.fr/librairie/librairie-zeugma/",
      "https://www.placedeslibraires.fr/magasins/montreuil/Zeugma-Librairie-6107/"
    ],
    "region": "ile-de-france",
    "origine": "v1",
    "verification_note": "Horaires et politique de dépôt à confirmer."
  },
  {
    "id": "ile-de-france-18",
    "name": "Librairie Libertalia",
    "city": "Montreuil",
    "address": "12 rue Marcelin-Berthelot, 93100 Montreuil",
    "description": "Librairie des éditions indépendantes Libertalia (sciences humaines, littérature engagée), ouverte lundi-samedi 10h-19h30 et dimanche 15h-19h30. Seconde librairie à la Maison des Métallos (Paris 11e).",
    "website": "https://librairielibertalia.com/",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://librairielibertalia.com/blogs/actualites/infos-pratiques",
      "https://www.librairies93.fr/magasins/montreuil/Libertalia-3331/"
    ],
    "region": "ile-de-france",
    "origine": "v1",
    "verification_note": "Orientation politique/sciences humaines : intérêt pour un livre d'artiste à discuter."
  },
  {
    "id": "ile-de-france-19",
    "field_note": "3 déposés 1 vendu, retour état compliqué, le chéquier est fragile semble-t-il. (2026-06-01)",
    "name": "Folies d'encre Montreuil",
    "city": "Montreuil",
    "address": "9 avenue de la Résistance, 93100 Montreuil",
    "description": "Librairie indépendante généraliste (métro Croix de Chavaux), ouverte lundi 12h-19h et mardi-samedi 10h-19h ; annexe papeterie « Le Kraft » depuis 2018. Dépôt déjà accepté.",
    "website": "https://foliesdencre.com/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://foliesdencre.com/home/",
      "https://www.librairies93.fr/magasins/montreuil/Folies-d-encre-Montreuil-5491/"
    ],
    "region": "ile-de-france",
    "origine": "v1",
    "verification_note": "Le site ne liste que Montreuil : aucune Folies d'encre à Aubervilliers n'y apparaît. Prévoir un conditionnement protecteur pour le chéquier."
  },
  {
    "id": "ile-de-france-20",
    "name": "Librairie L'Établi",
    "city": "Alfortville",
    "address": "8 rue Jules Cuillerier, 94140 Alfortville",
    "description": "Librairie-papeterie indépendante référencée par la ville d'Alfortville (tél. 06 56 67 98 80). Horaires non trouvés.",
    "website": "https://www.parislibrairies.fr/magasins/alfortville/L-etabli-6188/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.alfortville.fr/l-etabli",
      "https://www.parislibrairies.fr/magasins/alfortville/L-etabli-6188/"
    ],
    "region": "ile-de-france",
    "origine": "v1",
    "verification_note": "Pas de site propre ; horaires à confirmer."
  },
  {
    "id": "ile-de-france-21",
    "name": "Mots & Motions",
    "city": "Saint-Mandé",
    "address": "74 avenue du Général de Gaulle, 94160 Saint-Mandé",
    "description": "Librairie généraliste (neuf, occasion, BD, guides, scolaire) située à Saint-Mandé et non à Noisy-le-Grand comme indiqué dans le brief. Horaires non renseignés dans les annuaires ; site officiel inaccessible lors de la vérification.",
    "website": "http://www.motsetmotions.com/",
    "type": "librairie-generaliste",
    "status": "doubtful",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://editions-metailie.com/librairie/mots-et-motions/",
      "https://www.justacote.com/saint-mande-94160/librairie/mots-et-motions-588464.htm"
    ],
    "region": "ile-de-france",
    "origine": "v1",
    "verification_note": "Ville corrigée (Saint-Mandé). Activité 2025-2026 non confirmée : appeler le 01 43 28 77 61 avant de passer."
  },
  {
    "id": "ile-de-france-22",
    "name": "La Vagabonde",
    "city": "Versailles",
    "address": "40 rue d'Anjou, 78000 Versailles",
    "description": "Librairie indépendante du quartier Saint-Louis (avec espace atelier/galerie « la Fabrique » selon la presse locale), ouverte du mardi au samedi 10h-19h d'après PagesJaunes.",
    "website": "https://www.pagesjaunes.fr/pros/58331970",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.pagesjaunes.fr/pros/58331970",
      "https://www.versaillesinmypocket.com/2014/10/la-vagabonde-et-sa-fabrique-culture-decouverte-librairie-galerie-atelier-versailles-enfants.html"
    ],
    "region": "ile-de-france",
    "origine": "v1",
    "verification_note": "Pas de site officiel trouvé ; activité 2026 déduite de l'annuaire seulement."
  },
  {
    "id": "ile-de-france-23",
    "name": "Ygrec-ENSAPC",
    "city": "Aubervilliers",
    "address": "29-31 rue Henri Barbusse, 93300 Aubervilliers",
    "description": "Centre d'art de l'École nationale supérieure d'arts de Paris-Cergy, installé à Aubervilliers depuis mars 2020, entrée libre du mercredi au samedi 14h-19h (TRAM). Aucune librairie mentionnée.",
    "website": "https://www.ensapc.fr/fr/ygrec/galerie",
    "type": "autre",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://tram-idf.fr/lieu/ygrec-ensapc/",
      "https://www.aubervilliers.fr/Ouverture-des-nouveaux-espaces-d-Ygrec-a-Aubervilliers"
    ],
    "region": "ile-de-france",
    "origine": "v1",
    "verification_note": "Point de vente d'éditions non confirmé."
  },
  {
    "id": "ile-de-france-24",
    "name": "Komunuma",
    "city": "Romainville",
    "address": "43 rue de la Commune de Paris, 93230 Romainville",
    "description": "Pôle de galeries (Air de Paris, Sator, Jocelyn Wolff, In Situ – Fabienne Leclerc) sur le site de la Fondation Fiminco, qui accueille aussi Laurel Parker Book et le campus Parsons Paris. Pas de librairie commune identifiée.",
    "website": "https://www.facebook.com/komunuma/",
    "type": "galerie-artist-run",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.timeout.fr/paris/art/komunuma",
      "https://uk.tourisme93.com/fondation-fiminco.html"
    ],
    "region": "ile-de-france",
    "origine": "v1",
    "verification_note": "Horaires des galeries non trouvés ; c'est un ensemble de galeries commerciales, le dépôt se négocie galerie par galerie."
  },
  {
    "id": "ile-de-france-25",
    "name": "Librairie Lame – art & microédition",
    "city": "Saint-Denis",
    "address": "44 rue Auguste Poullain, 93200 Saint-Denis",
    "description": "Librairie associative en ligne dédiée à l'art, la micro-édition, le graphisme et la typographie (fanzines, livres d'artiste). Le site ne mentionne aucune boutique physique ni horaires ; dernière mise à jour visible en 2024.",
    "website": "https://librairie-lame.com/",
    "type": "librairie-specialisee",
    "status": "doubtful",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://librairie-lame.com/",
      "https://annuaire.petitesaffiches.fr/librairie/lame-papier-88295545300015/"
    ],
    "region": "ile-de-france",
    "origine": "v1",
    "verification_note": "L'adresse rue Auguste Poullain correspond au siège « Lame & Papier » dans les annuaires, pas à une boutique ouverte au public. Contact : contact@librairie-lame.com."
  },
  {
    "id": "ile-de-france-26",
    "name": "Kiblind",
    "city": "Paris",
    "address": "5 rue Curial, 75019 Paris",
    "description": "Magazine, agence, atelier d'impression et festival d'illustration ; la page contact donne un bureau parisien au 69 rue Armand Carrel (75019) et évoque des « boutiques lyonnaises et parisiennes » sans adresse ni horaires.",
    "website": "https://kiblind.com/",
    "type": "atelier-editeur",
    "status": "doubtful",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://kiblind.com/contact/",
      "https://www.kiblind.com/"
    ],
    "region": "ile-de-france",
    "origine": "v1",
    "verification_note": "L'adresse 5 rue Curial du brief n'apparaît pas sur le site ; existence et adresse d'une boutique physique à Paris à confirmer."
  },
  {
    "id": "ile-de-france-27",
    "name": "La Petite Égypte",
    "city": "Paris",
    "address": "35 rue des Petits Carreaux, 75002 Paris",
    "description": "Librairie indépendante du 2e arrondissement. Aucune page web n'a pu être consultée pendant cette recherche.",
    "website": "",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "ile-de-france",
    "origine": "v1",
    "verification_note": "Non vérifié : recherche web indisponible (quota épuisé) ; site officiel non accessible."
  },
  {
    "id": "ile-de-france-28",
    "name": "Quintal Librairie",
    "city": "Paris",
    "address": "13 rue d'Eupatoria, 75020 Paris",
    "description": "Librairie du 20e arrondissement. Aucune page web n'a pu être consultée pendant cette recherche.",
    "website": "",
    "type": "librairie-specialisee",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "ile-de-france",
    "origine": "v1",
    "verification_note": "Non vérifié : recherche web indisponible (quota épuisé)."
  },
  {
    "id": "ile-de-france-29",
    "name": "Le Monte-en-l'air",
    "city": "Paris",
    "address": "2 rue de la Mare, 75020 Paris",
    "description": "Librairie-galerie de Ménilmontant. Aucune page web n'a pu être consultée pendant cette recherche (site officiel non résolu, annuaires bloqués).",
    "website": "",
    "type": "librairie-specialisee",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "ile-de-france",
    "origine": "v1",
    "verification_note": "Non vérifié : recherche web indisponible (quota épuisé)."
  },
  {
    "id": "ile-de-france-30",
    "name": "Perrotin Store (Turenne)",
    "city": "Paris",
    "address": "76 rue de Turenne, 75003 Paris",
    "description": "Boutique de la galerie Perrotin : monographies, éditions rares, magazines, estampes, multiples, objets des artistes de la galerie. Ouvert du mardi au samedi 10h-18h (tél. 01 78 94 01 48).",
    "website": "https://storeparis.perrotin.com/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://storeparis.perrotin.com/"
    ],
    "region": "ile-de-france",
    "origine": "v1",
    "verification_note": "Offre centrée sur les artistes Perrotin ; dépôt extérieur peu probable mais non exclu."
  },
  {
    "id": "ile-de-france-31",
    "name": "Cahier Central",
    "city": "Paris",
    "address": "26 rue du Château d'Eau, 75010 Paris",
    "description": "Librairie soutenant les créations sous-représentées : magazines, livres, zines, prints, posters (art, design, photo, mode). Ouvert du mardi au dimanche 12h-19h.",
    "website": "https://www.cahiercentral.com/",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://www.cahiercentral.com/"
    ],
    "region": "ile-de-france",
    "origine": "v1"
  },
  {
    "id": "ile-de-france-32",
    "name": "La Régulière",
    "city": "Paris",
    "address": "43 rue Myrha, 75018 Paris",
    "description": "Librairie-café de la Goutte d'Or. Aucune page web n'a pu être consultée (certificat du site invalide, recherche indisponible).",
    "website": "",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "ile-de-france",
    "origine": "v1",
    "verification_note": "Non vérifié : recherche web indisponible (quota épuisé)."
  },
  {
    "id": "ile-de-france-33",
    "field_note": "Débordé (2026-05-12)",
    "name": "After 8 Books",
    "city": "Paris",
    "address": "7 rue Jarry, 75010 Paris",
    "description": "Librairie indépendante et maison d'édition consacrée aux publications d'artistes, écrivains, musiciens et penseurs contemporains. Ouvert mardi-vendredi 11h-13h et 14h-19h, samedi 14h-19h.",
    "website": "https://after8books.com/",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://after8books.com/"
    ],
    "region": "ile-de-france",
    "origine": "v1",
    "verification_note": "Contact : books@after8books.com — privilégier le mail."
  },
  {
    "id": "ile-de-france-34",
    "field_note": "Débordé et pas sympas (2026-05-12)",
    "name": "Artazart",
    "city": "Paris",
    "address": "83 quai de Valmy, 75010 Paris",
    "description": "Librairie-galerie d'arts visuels (photographie, illustration, design) au bord du canal Saint-Martin, 26 ans d'activité, récemment rénovée. Ouvert tous les jours 10h30-19h30 (11h le dimanche).",
    "website": "https://www.artazart.com/",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.artazart.com/"
    ],
    "region": "ile-de-france",
    "origine": "v1",
    "verification_note": "Terrain défavorable : priorité basse."
  },
  {
    "id": "ile-de-france-35",
    "field_note": "Pas de réponse, se prennent pour des oufs (2026-05-12)",
    "name": "Librairie sans titre",
    "city": "Paris",
    "address": "143 avenue Parmentier, 75010 Paris",
    "description": "Librairie d'art (photo, beaux-arts, architecture, design, graphisme, illustration) proposant aussi magazines, fanzines, vinyles et posters ; expositions et lancements réguliers. Ouvert mardi-samedi 10h30-19h30, dimanche 12h-18h.",
    "website": "https://www.librairiesanstitre.com/",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://www.librairiesanstitre.com/"
    ],
    "region": "ile-de-france",
    "origine": "v1",
    "verification_note": "Terrain : pas de retour ; à relancer sur place seulement si passage."
  },
  {
    "id": "ile-de-france-36",
    "field_note": "Pas de retour (2026-05-12)",
    "name": "Librairie à la marge",
    "city": "Montreuil",
    "address": "7 rue Arsène Chéreau, 93100 Montreuil",
    "description": "Librairie indépendante de Montreuil. Aucune page web n'a pu être consultée pendant cette recherche.",
    "website": "",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "ile-de-france",
    "origine": "v1",
    "verification_note": "Non vérifié : recherche web indisponible (quota épuisé)."
  },
  {
    "id": "ile-de-france-37",
    "name": "Librairie Libertalia – Maison des Métallos",
    "city": "Paris",
    "address": "94 rue Jean-Pierre Timbaud, 75011 Paris",
    "description": "Seconde librairie des éditions indépendantes Libertalia, dans la Maison des Métallos. Ouvert lundi-vendredi 13h-19h30, samedi-dimanche 11h-19h30 (prolongé les soirs d'événement).",
    "website": "https://librairielibertalia.com/",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://librairielibertalia.com/blogs/actualites/infos-pratiques"
    ],
    "region": "ile-de-france",
    "origine": "ajout-2026",
    "verification_note": "Même équipe que Montreuil : un seul contact pour les deux dépôts."
  },
  {
    "id": "ile-de-france-38",
    "name": "Ofr. Librairie, Galerie",
    "city": "Paris",
    "address": "20 rue Dupetit-Thouars, 75003 Paris",
    "description": "Librairie spécialisée en livres d'art avec galerie de 60 m², fondée en 2007 par les frères Thumerelle ; publie ses propres éditions et exploite une boutique annexe depuis 2014.",
    "website": "https://en.wikipedia.org/wiki/Ofr_Librairie,_Galerie",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://en.wikipedia.org/wiki/Ofr_Librairie,_Galerie"
    ],
    "region": "ile-de-france",
    "origine": "ajout-2026",
    "verification_note": "Horaires et site officiel non consultés (seule la fiche Wikipédia était accessible)."
  },
  {
    "id": "ile-de-france-39",
    "name": "Perrotin Store (Matignon)",
    "city": "Paris",
    "address": "2bis avenue Matignon, 75008 Paris",
    "description": "Second Perrotin Store parisien (livres, éditions, multiples des artistes de la galerie), ouvert du mardi au samedi 11h-19h (tél. 01 83 62 51 64).",
    "website": "https://storeparis.perrotin.com/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://storeparis.perrotin.com/"
    ],
    "region": "ile-de-france",
    "origine": "ajout-2026",
    "verification_note": "Même réserve que rue de Turenne : offre centrée sur les artistes Perrotin."
  },
  {
    "id": "hauts-de-france-1",
    "name": "Frac Grand Large — Hauts-de-France (café-boutique / librairie)",
    "city": "Dunkerque",
    "address": "503 avenue des Bancs de Flandres, 59140 Dunkerque",
    "description": "Le café-boutique du Frac vend les éditions du Frac Grand Large, une sélection d'ouvrages liés à la collection et à la programmation, un coin presse spécialisée art, des multiples et de la papeterie. Accessible gratuitement sans billet ; ouvert du mercredi au dimanche de 14h à 18h.",
    "website": "https://www.fracgrandlarge-hdf.fr/le-frac/cafe-boutique/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.fracgrandlarge-hdf.fr/le-frac/cafe-boutique/"
    ],
    "region": "hauts-de-france",
    "origine": "v1",
    "verification_note": "Pas de mention explicite de fanzines ou micro-édition ; la sélection est 'en résonance avec la programmation'."
  },
  {
    "id": "hauts-de-france-2",
    "name": "LAAC — Lieu d'Art et Action Contemporaine",
    "city": "Dunkerque",
    "address": "302 avenue des Bordées, 59140 Dunkerque",
    "description": "Musée d'art contemporain de Dunkerque (musées municipaux). La page officielle consultée ne mentionne ni boutique ni librairie.",
    "website": "https://www.musees-dunkerque.eu/en/laac/the-laac",
    "type": "musee",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://www.musees-dunkerque.eu/en/laac/the-laac"
    ],
    "region": "hauts-de-france",
    "origine": "v1",
    "verification_note": "Existence d'un point de vente de livres non vérifiée ; adresse non confirmée sur la page consultée. Si pas de boutique : fit non."
  },
  {
    "id": "hauts-de-france-3",
    "name": "La librairie-boutique du LaM",
    "city": "Villeneuve-d'Ascq",
    "address": "1 allée du Musée, 59650 Villeneuve-d'Ascq",
    "description": "Librairie-boutique du musée, gérée par la société La Boutique du Lieu (Croix). Catalogues d'exposition, rayon livres, papeterie. Ouverte tous les jours sauf le lundi, de 11h à 19h. Tél. 06 70 47 72 12, lalibrairieboutiquedulam@laboutiquedulieu.fr.",
    "website": "https://librairie.musee-lam.fr/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://librairie.musee-lam.fr/en/",
      "https://www.laboutiquedulieu.com/"
    ],
    "region": "hauts-de-france",
    "origine": "v1",
    "verification_note": "Décision de dépôt probablement centralisée chez La Boutique du Lieu (voir hauts-de-france-5)."
  },
  {
    "id": "hauts-de-france-4",
    "name": "Bibliothèque Dominique Bozo (LaM)",
    "city": "Villeneuve-d'Ascq",
    "address": "1 allée du Musée, 59650 Villeneuve-d'Ascq",
    "description": "Bibliothèque de recherche du musée : pas un point de vente. Hors protocole (bibliothèques exclues).",
    "website": "https://librairie.musee-lam.fr/",
    "type": "mediatheque",
    "status": "unverified",
    "fit": "non",
    "verified_address": false,
    "sources": [],
    "region": "hauts-de-france",
    "origine": "v1",
    "verification_note": "Non recherchée spécifiquement ; exclue par nature.",
    "retired": true
  },
  {
    "id": "hauts-de-france-5",
    "name": "La Boutique du Lieu (siège social)",
    "city": "Croix",
    "address": "198 rue Jean Monnet, 59170 Croix",
    "description": "Siège de la société qui exploite 11 librairies-boutiques de musées, dont 4 dans la région : Palais des Beaux-Arts de Lille, La Piscine (Roubaix), LaM (Villeneuve-d'Ascq), Louvre-Lens (plus la Cité de la Dentelle à Calais). Contact : info@laboutiquedulieu.fr, bonjour@laboutiquedulieu.fr.",
    "website": "https://www.laboutiquedulieu.com/",
    "type": "autre",
    "status": "active",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://www.laboutiquedulieu.com/",
      "https://www.verif.com/societe/LA-BOUTIQUE-DU-LIEU-500506993/"
    ],
    "region": "hauts-de-france",
    "origine": "v1",
    "verification_note": "Pas de point de vente au siège. Utile comme interlocuteur unique pour un dépôt dans les 4 boutiques régionales.",
    "retired": true
  },
  {
    "id": "hauts-de-france-6",
    "name": "La librairie-boutique du Palais des Beaux-Arts de Lille",
    "city": "Lille",
    "address": "Place de la République, 59000 Lille",
    "description": "Boutique dans l'atrium, accessible sans billet, gérée par La Boutique du Lieu : livres d'art, cartes, affiches, papeterie, jeunesse. Lundi 14h-18h, mercredi-dimanche 10h-18h, fermée le mardi. Tél. 06 76 70 01 67, lalibrairieboutiquedupalais@laboutiquedulieu.fr.",
    "website": "https://pba.lille.fr/Infos/La-Librairie-Boutique",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://pba.lille.fr/Infos/La-Librairie-Boutique"
    ],
    "region": "hauts-de-france",
    "origine": "v1",
    "verification_note": "Offre orientée produits dérivés et beaux-livres ; micro-édition non mentionnée."
  },
  {
    "id": "hauts-de-france-7",
    "name": "La librairie-boutique de La Piscine — Musée d'art et d'industrie André Diligent",
    "city": "Roubaix",
    "address": "23 rue de l'Espérance, 59100 Roubaix",
    "description": "Librairie-boutique du musée (site marchand actif, exposition en cours 'L'art du motif. Invitation à Minakani'), gérée par La Boutique du Lieu : catalogues, livres jeunesse, papeterie, objets. Horaires non trouvés sur la page consultée.",
    "website": "https://librairie.roubaix-lapiscine.com/fr/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://librairie.roubaix-lapiscine.com/fr/",
      "https://www.laboutiquedulieu.com/"
    ],
    "region": "hauts-de-france",
    "origine": "v1",
    "verification_note": "Page musée (roubaix-lapiscine.com) inaccessible (robots) ; adresse reprise du brief. Un annuaire indique l'entrée boutique 24 rue des Champs."
  },
  {
    "id": "hauts-de-france-8",
    "name": "La librairie-boutique du Louvre-Lens",
    "city": "Lens",
    "address": "99 rue Paul Bert, 62300 Lens",
    "description": "Boutique dans le hall, accessible sans billet, gérée par La Boutique du Lieu : livres, catalogues, papeterie, cadeaux. Ouverte tous les jours 10h-18h sauf le mardi. Tél. 07 89 26 32 97.",
    "website": "https://www.louvrelens.fr/librairie-boutique/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.louvrelens.fr/librairie-boutique/"
    ],
    "region": "hauts-de-france",
    "origine": "v1",
    "verification_note": "Offre grand public ; micro-édition non mentionnée."
  },
  {
    "id": "hauts-de-france-9",
    "name": "L'Espace du Dedans (galerie-librairie)",
    "city": "Lille",
    "address": "28 rue de Gand, 59800 Lille",
    "description": "Galerie-librairie d'art contemporain du Vieux-Lille (20 ans en 2024) : œuvres, livres d'artiste, estampes, expositions régulières. Mercredi-vendredi 14h-18h30, samedi 10h-18h30. Tél. 06 82 54 90 96.",
    "website": "http://www.espacedudedans.com/",
    "type": "galerie-artist-run",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://www.lechti.com/etablissement/galerie-espace-du-dedans/1802/",
      "https://lilleartup.com/les-galeries/lespace-du-dedans/"
    ],
    "region": "hauts-de-france",
    "origine": "v1",
    "verification_note": "Site officiel non lisible (redirection en boucle) ; fiche annuaire mise à jour mars 2026."
  },
  {
    "id": "hauts-de-france-10",
    "name": "CROÂfunding",
    "city": "Lille",
    "address": "90 rue Pierre Mauroy, 59000 Lille",
    "description": "Librairie consacrée à 100 % à l'autoédition : BD, livres illustrés, fanzines, jeux de cartes, projets financés en crowdfunding. Ouverte 10h-19h30 sans interruption, fermée dimanche et mercredi. Site à jour (nouveautés septembre 2026). Tél. 09 67 48 72 68, contact@croafunding.fr.",
    "website": "https://croafunding.fr/",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://croafunding.fr/",
      "https://actualitte.com/article/130446/librairie/a-lille-une-librairie-unique-au-monde-croafunding-100-autoedition-et-circuit-court"
    ],
    "region": "hauts-de-france",
    "origine": "v1",
    "verification_note": "Modalités de dépôt non précisées sur le site."
  },
  {
    "id": "hauts-de-france-11",
    "name": "Le Cagibi",
    "city": "Lille",
    "address": "8 rue de Wazemmes, 59000 Lille",
    "description": "Galerie coopérative d'artistes, atelier de sérigraphie et librairie (graphisme, petite édition, photo, DIY, sérigraphie) ouverte en 2009 dans le quartier Moulins ; exposition mensuelle. Horaires annuaire : samedi et dimanche 15h-19h.",
    "website": "https://www.facebook.com/eulcagibi/",
    "type": "galerie-artist-run",
    "status": "doubtful",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://www.lillelanuit.com/annuaires/lieux/le-cagibi/",
      "https://www.societe.com/societe/le-cagibi-530414879.html"
    ],
    "region": "hauts-de-france",
    "origine": "v1",
    "verification_note": "Association toujours active au registre (société.com) mais aucune actualité 2025-2026 trouvée ; horaires à confirmer avant visite."
  },
  {
    "id": "hauts-de-france-12",
    "name": "Le Tripostal",
    "city": "Lille",
    "address": "22 avenue Willy Brandt, 59000 Lille",
    "description": "Lieu d'exposition municipal (lille3000) sans librairie permanente ; la page de la Ville l'affiche 'fermé temporairement' après l'exposition Pom Pom Pidou (avril-novembre 2025).",
    "website": "https://www.lille.fr/Nos-equipements/Le-Tripostal",
    "type": "autre",
    "status": "doubtful",
    "fit": "non",
    "verified_address": false,
    "sources": [
      "https://www.lille.fr/Nos-equipements/Le-Tripostal",
      "https://59.agendaculturel.fr/tri-postal"
    ],
    "region": "hauts-de-france",
    "origine": "v1",
    "verification_note": "Pas de boutique permanente identifiée ; ouverture liée aux expositions.",
    "retired": true
  },
  {
    "id": "hauts-de-france-13",
    "name": "La Chouette Librairie",
    "city": "Lille",
    "address": "72 rue de l'Hôpital Militaire, 59000 Lille",
    "description": "Librairie généraliste indépendante ouverte en novembre 2018 (littérature, essais, BD, jeunesse, art), label LIR depuis 2023, membre Initiales. Mardi-vendredi 10h30-19h, samedi 10h-19h. Tél. 03 20 09 79 68.",
    "website": "https://www.lachouettelibrairie.com/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.lachouettelibrairie.com/decouvrir_la_librairie/",
      "https://www.leslibraires.fr/presentation/La-chouette-librairie/"
    ],
    "region": "hauts-de-france",
    "origine": "v1"
  },
  {
    "id": "hauts-de-france-14",
    "name": "Librairie Meura",
    "city": "Lille",
    "address": "25 rue de Valmy, 59000 Lille",
    "description": "Librairie universitaire indépendante spécialisée en sciences humaines (lettres, philosophie, histoire, droit, sociologie), près du Palais des Beaux-Arts. Horaires divergents selon annuaires (lechti : lundi 14h-19h, mardi-samedi 10h-19h avec pause ; mylibrairie : jeudi-samedi seulement). Tél. 03 20 57 36 44.",
    "website": "https://www.ar2l-hdf.fr/annuaire-des-professionnels/annuaire/librairie-meura-59000-lille",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.ar2l-hdf.fr/annuaire-des-professionnels/annuaire/librairie-meura-59000-lille",
      "https://lechti.com/place/librairie-meura/",
      "https://www.mylibrairie.fr/59/lille/librairie-meura-130388"
    ],
    "region": "hauts-de-france",
    "origine": "v1",
    "verification_note": "Le domaine librairiemeura.com est aujourd'hui un site de casino : ne pas l'utiliser. Profil sciences humaines, peu adapté aux livres d'artiste."
  },
  {
    "id": "hauts-de-france-15",
    "name": "Librairie Godon",
    "city": "Lille",
    "address": "16 rue Masurel, 59800 Lille",
    "description": "Librairie ancienne et moderne : le site officiel indique que la boutique a fermé définitivement en juin 2024 ; les libraires travaillent désormais sur rendez-vous uniquement (06 88 22 22 66).",
    "website": "https://www.librairiegodon.com/",
    "type": "librairie-specialisee",
    "status": "closed",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://www.librairiegodon.com/",
      "https://www.ar2l-hdf.fr/annuaire-des-professionnels/annuaire/godon-59800-lille"
    ],
    "region": "hauts-de-france",
    "origine": "v1",
    "verification_note": "Livre ancien : hors cible de toute façon.",
    "retired": true
  },
  {
    "id": "hauts-de-france-16",
    "name": "L'hybride",
    "city": "Lille",
    "address": "18 rue Gosselet, 59000 Lille",
    "description": "Lieu culturel dédié au court métrage et au vidéo-mapping immersif (séances mercredi, samedi, dimanche ; courts métrages jeudi et vendredi soir). Aucune boutique ni vente de livres mentionnée.",
    "website": "https://lhybride.org/",
    "type": "autre",
    "status": "active",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://www.lille.fr/Nos-equipements/L-hybride"
    ],
    "region": "hauts-de-france",
    "origine": "v1",
    "verification_note": "Site officiel inaccessible (503).",
    "retired": true
  },
  {
    "id": "hauts-de-france-17",
    "name": "Le Fresnoy — Studio national des arts contemporains (librairie)",
    "city": "Tourcoing",
    "address": "22 rue du Fresnoy, 59200 Tourcoing",
    "description": "Le site liste une librairie et un restaurant (Le Plateau) sur place. Accueil lundi-vendredi 9h30-12h30 et 14h-18h ; expositions (Panorama 28) mercredi-dimanche 14h-19h. Tél. 03 20 28 38 00.",
    "website": "https://www.lefresnoy.net/fr/infos-pratiques",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.lefresnoy.net/fr/infos-pratiques",
      "https://www.lefresnoy.net/fr/librairie"
    ],
    "region": "hauts-de-france",
    "origine": "v1",
    "verification_note": "Contenu et horaires de la librairie non détaillés sur le site ; code postal officiel 59202 Tourcoing cedex (BP)."
  },
  {
    "id": "hauts-de-france-18",
    "name": "Les Ateliers de la Halle",
    "city": "Arras",
    "address": "2 rue de la Douizième, 62000 Arras",
    "description": "Non vérifié : aucune page web n'a pu être consultée (quota de recherche épuisé).",
    "website": "",
    "type": "autre",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "hauts-de-france",
    "origine": "v1",
    "verification_note": "Existence, adresse et point de vente à vérifier."
  },
  {
    "id": "hauts-de-france-19",
    "name": "Hôtel de Guînes",
    "city": "Arras",
    "address": "Rue des Jongleurs, 62000 Arras",
    "description": "Non vérifié : aucune page web n'a pu être consultée (quota de recherche épuisé).",
    "website": "",
    "type": "autre",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "hauts-de-france",
    "origine": "v1",
    "verification_note": "Lieu d'exposition municipal ; point de vente à vérifier."
  },
  {
    "id": "hauts-de-france-20",
    "name": "L'Être Lieu",
    "city": "Arras",
    "address": "21 boulevard Carnot, 62000 Arras",
    "description": "Non vérifié : aucune page web n'a pu être consultée (quota de recherche épuisé).",
    "website": "",
    "type": "autre",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "hauts-de-france",
    "origine": "v1",
    "verification_note": "Adresse et point de vente à vérifier."
  },
  {
    "id": "hauts-de-france-21",
    "name": "Musée des Beaux-Arts d'Arras",
    "city": "Arras",
    "address": "22 rue Paul Doumer, 62000 Arras",
    "description": "Non vérifié : aucune page web n'a pu être consultée (quota de recherche épuisé).",
    "website": "",
    "type": "musee",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "hauts-de-france",
    "origine": "v1",
    "verification_note": "Existence d'une boutique-librairie à vérifier ; sinon fit non."
  },
  {
    "id": "hauts-de-france-22",
    "name": "Librairie du Labyrinthe",
    "city": "Amiens",
    "address": "37 rue du Hocquet, 80000 Amiens",
    "description": "Non vérifié : aucune page web n'a pu être consultée (quota de recherche épuisé).",
    "website": "",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "hauts-de-france",
    "origine": "v1",
    "verification_note": "Adresse, type et ouverture à vérifier."
  },
  {
    "id": "hauts-de-france-23",
    "name": "Frac Picardie",
    "city": "Amiens",
    "address": "45 rue Pointin, 80000 Amiens",
    "description": "Non vérifié : aucune page web n'a pu être consultée (quota de recherche épuisé).",
    "website": "",
    "type": "librairie-centre-art",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "hauts-de-france",
    "origine": "v1",
    "verification_note": "Existence d'un point de vente d'éditions à vérifier (le Frac Picardie est spécialisé dessin)."
  },
  {
    "id": "hauts-de-france-24",
    "name": "Musée de Picardie",
    "city": "Amiens",
    "address": "2 rue Puvis de Chavannes, 80000 Amiens",
    "description": "Non vérifié : aucune page web n'a pu être consultée (quota de recherche épuisé).",
    "website": "",
    "type": "musee",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "hauts-de-france",
    "origine": "v1",
    "verification_note": "Existence d'une boutique-librairie à vérifier ; sinon fit non."
  },
  {
    "id": "hauts-de-france-25",
    "name": "L'Affranchie",
    "city": "Lille",
    "address": "6 place Sébastopol, 59000 Lille",
    "description": "Librairie indépendante spécialisée arts de la scène (théâtre, danse), poésie et féminismes, avec rayons BD et arts visuels ; travaille avec des éditeurs indépendants et de petites structures (Le Noroît, L'Arbre de Diane, Le Gospel) ; rencontres mensuelles et podcast. Mardi-samedi 10h-13h30 et 14h30-19h ; événement annoncé le 19 septembre 2026.",
    "website": "https://www.laffranchielibrairie.com/",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://www.laffranchielibrairie.com/",
      "https://www.lapetitelibrairie.fr/librairies/59350-lille/bdbbcaiigefeccbgjgii.htm"
    ],
    "region": "hauts-de-france",
    "origine": "ajout-2026"
  },
  {
    "id": "hauts-de-france-26",
    "name": "La Librairie Mauve",
    "city": "Lille",
    "address": "83 rue Léon Gambetta, 59000 Lille",
    "description": "Librairie spécialisée arts, design, street-art et mode (neuf et occasion), accueillant expositions d'artistes et conférences ; lundi sur rendez-vous. Horaires non affichés sur la fiche.",
    "website": "https://www.lapetitelibrairie.fr/librairies/59350-lille/bccbgideigidieedfcec.htm",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://www.lapetitelibrairie.fr/librairies/59350-lille/bccbgideigidieedfcec.htm"
    ],
    "region": "hauts-de-france",
    "origine": "ajout-2026",
    "verification_note": "Une seule source (annuaire) ; site officiel / page Facebook non consultables. Ouverture actuelle à confirmer."
  },
  {
    "id": "hauts-de-france-27",
    "name": "Les Quatre Chemins",
    "city": "Lille",
    "address": "142 rue Pierre Mauroy, 59000 Lille",
    "description": "Librairie indépendante listée dans l'annuaire des librairies de Lille ; fiche détaillée inaccessible (erreur serveur).",
    "website": "https://www.lapetitelibrairie.fr/librairies/59350-lille/egcjhhjggjejdhhhhce.htm",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://www.lapetitelibrairie.fr/librairies/59350-lille/"
    ],
    "region": "hauts-de-france",
    "origine": "ajout-2026",
    "verification_note": "Type, horaires et ouverture à vérifier ; piste du brief."
  },
  {
    "id": "hauts-de-france-28",
    "name": "Le Bateau Livre",
    "city": "Lille",
    "address": "154 rue Léon Gambetta, 59000 Lille",
    "description": "Librairie indépendante de Wazemmes listée dans l'annuaire des librairies de Lille (affichée 'The Boat Book' en version traduite) ; fiche détaillée inaccessible.",
    "website": "https://www.lapetitelibrairie.fr/librairies/59350-lille/baeiigicidbiagheffja.htm",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://www.lapetitelibrairie.fr/librairies/59350-lille/"
    ],
    "region": "hauts-de-france",
    "origine": "ajout-2026",
    "verification_note": "Nom et adresse à confirmer ; piste du brief."
  },
  {
    "id": "hauts-de-france-29",
    "name": "Librairie-café Le Biglemoi",
    "city": "Lille",
    "address": "124 rue Pierre Legrand, 59000 Lille",
    "description": "Librairie-café indépendante à Fives, listée dans l'annuaire des librairies de Lille.",
    "website": "https://www.lapetitelibrairie.fr/librairies/59350-lille/beedhgegiibjiaijbef.htm",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://www.lapetitelibrairie.fr/librairies/59350-lille/"
    ],
    "region": "hauts-de-france",
    "origine": "ajout-2026",
    "verification_note": "Fiche non ouverte ; horaires et ligne éditoriale à vérifier."
  },
  {
    "id": "hauts-de-france-30",
    "name": "Librairie La Lison",
    "city": "Lille",
    "address": "8 place Jeanne d'Arc, 59000 Lille",
    "description": "Librairie indépendante listée dans l'annuaire des librairies de Lille.",
    "website": "https://www.lapetitelibrairie.fr/librairies/59350-lille/eihaeahicijdfgecij.htm",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://www.lapetitelibrairie.fr/librairies/59350-lille/"
    ],
    "region": "hauts-de-france",
    "origine": "ajout-2026",
    "verification_note": "Fiche non ouverte ; à vérifier."
  },
  {
    "id": "hauts-de-france-31",
    "name": "BD + Café / Rue Royale Éditions",
    "city": "Lille",
    "address": "5 rue Royale, 59000 Lille",
    "description": "Librairie BD-café et maison d'édition (Rue Royale Éditions) à la même adresse du Vieux-Lille, listées dans l'annuaire des librairies de Lille.",
    "website": "https://www.lapetitelibrairie.fr/librairies/59350-lille/gccjagaegfchffjbebc.htm",
    "type": "librairie-specialisee",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://www.lapetitelibrairie.fr/librairies/59350-lille/"
    ],
    "region": "hauts-de-france",
    "origine": "ajout-2026",
    "verification_note": "Fiches non ouvertes ; lien entre les deux entités et ouverture à vérifier."
  },
  {
    "id": "hauts-de-france-32",
    "name": "Humeurs Noires",
    "city": "Lille",
    "address": "6 rue Mourmant, 59000 Lille",
    "description": "Librairie indépendante listée dans l'annuaire des librairies de Lille (nom évoquant une spécialisation polar).",
    "website": "https://www.lapetitelibrairie.fr/librairies/59350-lille/jfigbbfdhjcfgfjgdaf.htm",
    "type": "librairie-specialisee",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://www.lapetitelibrairie.fr/librairies/59350-lille/"
    ],
    "region": "hauts-de-france",
    "origine": "ajout-2026",
    "verification_note": "Spécialité et ouverture à vérifier."
  },
  {
    "id": "hauts-de-france-33",
    "name": "La Petite",
    "city": "Lille",
    "address": "61 rue Colbert, 59800 Lille",
    "description": "Librairie indépendante listée dans l'annuaire des librairies de Lille.",
    "website": "https://www.lapetitelibrairie.fr/librairies/59350-lille/jfijdjbfeijfcfdfadb.htm",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://www.lapetitelibrairie.fr/librairies/59350-lille/"
    ],
    "region": "hauts-de-france",
    "origine": "ajout-2026",
    "verification_note": "Fiche non ouverte ; à vérifier."
  },
  {
    "id": "hauts-de-france-34",
    "name": "Librairie Place Ronde",
    "city": "Lille",
    "address": "8 place de Strasbourg, 59800 Lille",
    "description": "Librairie indépendante listée dans l'annuaire des librairies de Lille.",
    "website": "https://www.lapetitelibrairie.fr/librairies/59350-lille/baiggcfhcghbgbhdbace.htm",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://www.lapetitelibrairie.fr/librairies/59350-lille/"
    ],
    "region": "hauts-de-france",
    "origine": "ajout-2026",
    "verification_note": "Fiche non ouverte ; à vérifier."
  },
  {
    "id": "hauts-de-france-35",
    "name": "La Malterie",
    "city": "Lille",
    "address": "",
    "description": "Lieu culturel lillois (ateliers d'artistes et salle de concert) listé dans l'annuaire LillelaNuit ; point de vente non vérifié.",
    "website": "https://www.lillelanuit.com/annuaires/lieux/malterie-la/",
    "type": "galerie-artist-run",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://www.lillelanuit.com/annuaires/lieux/"
    ],
    "region": "hauts-de-france",
    "origine": "ajout-2026",
    "verification_note": "Adresse et existence d'une vente d'éditions à vérifier."
  },
  {
    "id": "normandie-1",
    "name": "Frac Normandie – Sotteville-lès-Rouen",
    "city": "Sotteville-lès-Rouen",
    "address": "3 place des Martyrs de la Résistance, 76300 Sotteville-lès-Rouen",
    "description": "Site rouennais du Frac Normandie (deux lieux : Sotteville-lès-Rouen et Caen), 400 m² d'exposition dans un ancien bâtiment industriel. Ouvert du mercredi au dimanche 14h-18h, entrée libre ; aucune librairie ni boutique mentionnée sur les pages consultées.",
    "website": "https://fracnormandie.fr",
    "type": "musee",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://lesfrac.com/frac/frac-normandie-rouen/",
      "https://en.visiterouen.com/offres/frac-normandie-sotteville-les-rouen-en-3941045/",
      "https://fracnormandie.fr/accueil"
    ],
    "region": "normandie",
    "origine": "v1",
    "verification_note": "Le site officiel fracnormandie.fr ne s'est pas laissé lire (contenu vide). Existence d'un point de vente d'éditions non vérifiée : à confirmer sur place."
  },
  {
    "id": "normandie-2",
    "name": "Le Shed, Centre d'art contemporain de Normandie",
    "city": "Maromme",
    "address": "96 rue des Martyrs de la Résistance, 76150 Maromme",
    "description": "Centre d'art associatif (3 à 6 expositions par an), avec un atelier de production à Notre-Dame-de-Bondeville. Ouvert en période d'exposition du mercredi au dimanche 14h-18h ; aucune boutique mentionnée sur le site.",
    "website": "https://www.le-shed.com/",
    "type": "galerie-artist-run",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.le-shed.com/%C3%A0-propos",
      "https://www.le-shed.com/"
    ],
    "region": "normandie",
    "origine": "v1",
    "verification_note": "Pas de date récente d'exposition trouvée sur la page « À propos » ; point de vente d'éditions non vérifié."
  },
  {
    "id": "normandie-3",
    "name": "ADN – Art Dédié à la Nature",
    "city": "Rouen",
    "address": "57 rue des Faulx, 76000 Rouen",
    "description": "Galerie-librairie-papeterie de 50 m² présentant une vingtaine d'artistes, cartes postales, œuvres originales et livres sur la nature et l'environnement. Ouvert du mercredi au samedi 11h-19h (selon rouen.fr).",
    "website": "https://www.instagram.com/adn_galerie_librairie/",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://rouen.fr/boutique/adn-art-dedie-a-nature",
      "https://ilibrairie.fr/normandie/"
    ],
    "region": "normandie",
    "origine": "v1",
    "verification_note": "Site www.artemis-art.com/adn cité par rouen.fr, non consulté. Toujours référencé sur ilibrairie.fr ; date d'ouverture initiale non datée sur la fiche rouen.fr."
  },
  {
    "id": "normandie-4",
    "name": "Librairie L'Armitière",
    "city": "Rouen",
    "address": "66 rue Jeanne d'Arc, 76000 Rouen",
    "description": "Grande librairie indépendante généraliste (1 050 m², environ 75 000 titres, rayon beaux-arts, fonds d'occasion). Ouvert du lundi au samedi 10h-19h (19h30 le samedi).",
    "website": "https://www.armitiere.com/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.armitiere.com/decouvrir_la_librairie/",
      "https://ilibrairie.fr/normandie/p7"
    ],
    "region": "normandie",
    "origine": "v1"
  },
  {
    "id": "normandie-5",
    "name": "HATCH – galerie du livre et de l'objet imprimé",
    "city": "Le Havre",
    "address": "17 allée Aimé Césaire, 76600 Le Havre",
    "description": "Galerie consacrée à la « slow édition » : livres d'artiste, estampes, affiches, multiples d'éditeurs indépendants et de collectifs. Ouvert du mercredi au samedi 11h-18h, entrée libre ; expositions datées 2025 et mars-avril 2026.",
    "website": "https://galeriedulivre.fr/",
    "type": "galerie-artist-run",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://galeriedulivre.fr/",
      "https://esadhar.fr/actu/dapres-images/"
    ],
    "region": "normandie",
    "origine": "v1",
    "verification_note": "Lieu le plus en phase avec la micro-édition dans la région. Modalités de dépôt-vente non lues."
  },
  {
    "id": "normandie-6",
    "name": "Le Portique – centre régional d'art contemporain du Havre",
    "city": "Le Havre",
    "address": "30 rue Gabriel Péri, 76600 Le Havre",
    "description": "Centre d'art avec boutique et librairie sur place (éditions d'artistes, multiples, monographies, affiches, cartes) et boutique en ligne. Ouvert du mardi au dimanche 14h-18h (13h-19h l'été), entrée libre.",
    "website": "https://www.leportique.org/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://leportique.myshopify.com/",
      "https://www.lehavre-etretat-tourisme.com/fr/fiche/le-havre/le-portique-centre-regional-d-art-contemporain-du-havre_TFOPCUNOR076V50P2HL/"
    ],
    "region": "normandie",
    "origine": "v1",
    "verification_note": "Erreur du brief corrigée : l'adresse n'est pas « 1517 place de l'Hôtel de Ville » mais 30 rue Gabriel Péri. Site leportique.org non lisible (robots)."
  },
  {
    "id": "normandie-7",
    "name": "ESADHaR – campus du Havre (bibliothèque)",
    "city": "Le Havre",
    "address": "65 rue Demidoff, 76600 Le Havre",
    "description": "Bibliothèque de l'école supérieure d'art et design Le Havre-Rouen, ouverte aux étudiants et personnels (lundi-mardi 9h-12h/14h-18h, jeudi-vendredi 9h-11h30). Aucun point de vente d'éditions mentionné.",
    "website": "https://esadhar.fr/",
    "type": "mediatheque",
    "status": "active",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://esadhar.fr/actualites/bibliotheques-horaires-guides-lecteur-actualite/",
      "https://esadhar.fr/en/presentation-contacts"
    ],
    "region": "normandie",
    "origine": "v1",
    "verification_note": "Bibliothèque d'école, pas de lieu de vente : exclue de la tournée. L'école lance ses éditions étudiantes chez HATCH (normandie-5).",
    "retired": true
  },
  {
    "id": "normandie-8",
    "name": "Librairie La Galerne",
    "city": "Le Havre",
    "address": "148 rue Victor Hugo, 76600 Le Havre",
    "description": "Librairie indépendante généraliste fondée en 1982, 1 300 m², environ 70 000 titres, café, une centaine de rencontres par an. Ouvert du lundi au samedi 10h-19h.",
    "website": "https://www.lagalerne.com/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.lagalerne.com/decouvrir_la_librairie/",
      "https://ilibrairie.fr/normandie/p4"
    ],
    "region": "normandie",
    "origine": "v1"
  },
  {
    "id": "normandie-9",
    "name": "L'Artothèque, Espaces d'art contemporain",
    "city": "Caen",
    "address": "Palais Ducal, impasse Duc Rollon, 14000 Caen",
    "description": "Artothèque et espaces d'exposition au Palais Ducal, six expositions par an, entrée libre ; expositions en cours « Laurent Proux – Ground Melody » (4 juillet-17 octobre 2026) et « Messages/Images, graphisme d'intérêt général » (jusqu'au 20 septembre 2026). Expositions ouvertes du mardi au samedi 14h-18h.",
    "website": "https://www.artotheque-caen.fr/",
    "type": "musee",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.artotheque-caen.fr/",
      "https://caen.fr/annuaire-equipement/artotheque",
      "https://14.agendaculturel.fr/palais-ducal-artotheque-espaces-d-art-contemporain"
    ],
    "region": "normandie",
    "origine": "v1",
    "verification_note": "Aucune librairie/boutique mentionnée sur les trois pages consultées ; code postal ajouté (14000). Intérêt possible via l'exposition graphisme."
  },
  {
    "id": "normandie-10",
    "name": "Frac Normandie – Caen",
    "city": "Caen",
    "address": "7 bis rue Neuve Bourg l'Abbé, 14000 Caen",
    "description": "Site caennais du Frac Normandie dans un ancien couvent du XVIIe siècle rénové par Rudy Ricciotti (ouvert en 2018). Ouvert du mercredi au dimanche 14h-18h ; aucune librairie mentionnée sur la page consultée.",
    "website": "https://fracnormandie.fr",
    "type": "musee",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://lesfrac.com/frac/frac-normandie/",
      "https://fracnormandie.fr/venir-a-caen"
    ],
    "region": "normandie",
    "origine": "v1",
    "verification_note": "Code postal ajouté (14000). Point de vente d'éditions non vérifié (site officiel illisible)."
  },
  {
    "id": "normandie-11",
    "field_note": "2026-05-22 : « territoire archi » (lieu d'architecture, pas de dépôt)",
    "name": "Le Pavillon",
    "city": "Caen",
    "address": "10 quai François Mitterrand, 14000 Caen",
    "description": "Lieu municipal dédié à l'architecture, l'urbanisme et le paysage sur la presqu'île de Caen : expositions, ateliers, centre de ressources documentaires en consultation. Ouvert du mercredi au dimanche 13h-19h ; aucune boutique ni vente de livres mentionnée.",
    "website": "https://www.lepavillon-caen.com/",
    "type": "autre",
    "status": "active",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://caen.fr/annuaire-equipement/le-pavillon",
      "https://www.lepavillon-caen.com/tout/",
      "https://mom-art.org/le-pavillon/"
    ],
    "region": "normandie",
    "origine": "v1",
    "verification_note": "Confirmé par la note de terrain : lieu d'architecture, pas de dépôt.",
    "retired": true
  },
  {
    "id": "normandie-12",
    "name": "Librairie Eureka Street",
    "city": "Caen",
    "address": "126 boulevard Maréchal Leclerc, 14000 Caen",
    "description": "Librairie indépendante généraliste (littérature française et étrangère, poésie, théâtre, BD, jeunesse, essais, beaux-arts). Ouvert du mardi au samedi 10h-19h, fermé le lundi.",
    "website": "https://www.eurekastreet.fr/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.eurekastreet.fr/contact",
      "https://www.eurekastreet.fr/agenda-librairie"
    ],
    "region": "normandie",
    "origine": "v1"
  },
  {
    "id": "normandie-13",
    "name": "Le Brouillon de Culture",
    "city": "Caen",
    "address": "29 rue Saint-Sauveur, 14000 Caen",
    "description": "Librairie indépendante caennaise créée en 1989, au fonds BD/manga décrit comme l'un des plus fournis du Calvados. Ouvert du lundi au samedi 9h30-19h (annuaire ilibrairie).",
    "website": "https://www.brouillondeculture.fr/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/14/caen/le-brouillon-de-culture-bl",
      "https://www.lastarduweb.fr/librairies-en-normandie-le-top-10-2026"
    ],
    "region": "normandie",
    "origine": "v1",
    "verification_note": "Site officiel inaccessible (403) ; horaires issus d'un annuaire. La fiche ilibrairie la classe bizarrement « librairie médicale » (code NAF), à ignorer."
  },
  {
    "id": "normandie-14",
    "name": "Librairie Ancienne et Moderne Frérot",
    "city": "Caen",
    "address": "26 rue des Croisiers, 14000 Caen",
    "description": "Librairie ancienne et moderne (livres rares et d'occasion), en activité depuis 1996. Ouvert du mardi au samedi 9h30-19h (annuaire ilibrairie).",
    "website": "https://www.livre-rare-book.com/c/b/Frerot",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/14/caen/librairie-ancienne-et-moderne-frerot-32f",
      "https://ilibrairie.fr/normandie/p6"
    ],
    "region": "normandie",
    "origine": "v1",
    "verification_note": "Orientation livre ancien : le dépôt de micro-édition contemporaine est incertain. Pas de site propre trouvé (vitrine livre-rare-book)."
  },
  {
    "id": "normandie-15",
    "name": "Librairie café La Grande Ourse",
    "city": "Dieppe",
    "address": "45 rue Saint-Jacques, 76200 Dieppe",
    "description": "Librairie-café indépendante du centre de Dieppe. Ouvert du mardi au samedi 10h-12h30 / 14h-19h (samedi 10h-13h / 14h-19h).",
    "website": "https://www.lagrandeoursedieppe.fr/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/76/dieppe/librairie-cafe-la-grande-ourse-2cx"
    ],
    "region": "normandie",
    "origine": "ajout-2026",
    "verification_note": "Site officiel non consulté (blocage) ; fiche annuaire seulement."
  },
  {
    "id": "normandie-16",
    "name": "Librairie Au Grand Nulle Part",
    "city": "Rouen",
    "address": "102 rue du Général Leclerc, 76000 Rouen",
    "description": "Librairie BD indépendante (réseau Canal BD) près du Théâtre des Arts. Ouvert du mardi au samedi 11h-19h.",
    "website": "https://www.facebook.com/AuGrandNullePart",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/76/rouen/librairie-au-grand-nulle-part-102-rue-du-general-leclerc-76000-rouen-2d4"
    ],
    "region": "normandie",
    "origine": "ajout-2026",
    "verification_note": "Rayon fanzines/micro-édition non vérifié."
  },
  {
    "id": "normandie-17",
    "name": "Librairie Générale Universitaire Colbert",
    "city": "Rouen",
    "address": "65 rue Martainville, 76000 Rouen",
    "description": "Librairie générale et universitaire du quartier Martainville (SAS créée en 2013), référencée sur l'annuaire ilibrairie sans horaires ni site.",
    "website": "",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/76/rouen/librairie-generale-universitaire-colbert-70n"
    ],
    "region": "normandie",
    "origine": "ajout-2026",
    "verification_note": "Une seule source (annuaire), pas d'horaires ni de site : activité 2026 à confirmer sur place."
  },
  {
    "id": "normandie-18",
    "name": "Le Tetris (Fort de Tourneville)",
    "city": "Le Havre",
    "address": "Fort de Tourneville, 33 rue du 329e R.I., 76620 Le Havre",
    "description": "Salle de musiques actuelles et lieu culturel du Fort de Tourneville. La fanzinothèque évoquée dans la piste n'apparaît pas sur les pages consultées du site.",
    "website": "https://www.letetris.fr/",
    "type": "autre",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.letetris.fr/",
      "https://www.letetris.fr/infos-pratiques/contactez-nous"
    ],
    "region": "normandie",
    "origine": "ajout-2026",
    "verification_note": "Point de vente/dépôt de fanzines non vérifié : à demander sur place ou par téléphone (02 35 19 00 38)."
  },
  {
    "id": "normandie-19",
    "name": "Librairie Guillaume",
    "city": "Caen",
    "address": "98 rue Saint-Pierre, 14000 Caen",
    "description": "Librairie indépendante généraliste du centre de Caen avec programmation de rencontres. Ouvert lundi 14h-19h, mardi-samedi 9h30-19h.",
    "website": "https://www.librairie-guillaume.fr/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/14/caen/librairie-guillaume-3ti",
      "https://www.lastarduweb.fr/librairies-en-normandie-le-top-10-2026"
    ],
    "region": "normandie",
    "origine": "ajout-2026",
    "verification_note": "Site officiel non consulté."
  },
  {
    "id": "normandie-20",
    "name": "La Cour des Miracles",
    "city": "Caen",
    "address": "51 rue Froide, 14000 Caen",
    "description": "Librairie BD de la rue Froide (rue qui concentre aussi BD r'Art au 13, Univers BD au 18 et Le Cheval Crayon au 43). Ouvert mardi, mercredi, vendredi, samedi 10h30-13h / 14h-19h.",
    "website": "",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/14/caen/la-cour-des-miracles-c7",
      "https://ilibrairie.fr/normandie/p10"
    ],
    "region": "normandie",
    "origine": "ajout-2026",
    "verification_note": "Fanzines/micro-édition non vérifiés ; pas de site web."
  },
  {
    "id": "normandie-21",
    "name": "Librairie Metropolis",
    "city": "Bayeux",
    "address": "10 rue Saint-Malo, 14400 Bayeux",
    "description": "Librairie indépendante de Bayeux créée en 2016. Ouvert du mardi au samedi 10h-19h.",
    "website": "https://librairie-metropolis.fr/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/14/bayeux/metropolis-335"
    ],
    "region": "normandie",
    "origine": "ajout-2026",
    "verification_note": "Site officiel non consulté."
  },
  {
    "id": "normandie-22",
    "name": "Librairie Ryst",
    "city": "Cherbourg-en-Cotentin",
    "address": "16 rue Grande Rue, 50100 Cherbourg-en-Cotentin",
    "description": "Librairie générale indépendante du centre de Cherbourg (SAS depuis 2016). Ouvert lundi 14h-19h, mardi-samedi 10h-19h.",
    "website": "https://www.librairie-ryst.fr/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/50/cherbourg-en-cotentin/librairie-generale-ryst-6vp"
    ],
    "region": "normandie",
    "origine": "ajout-2026",
    "verification_note": "Site officiel non consulté (blocage)."
  },
  {
    "id": "normandie-23",
    "name": "Le Point du Jour, centre d'art / éditeur",
    "city": "Cherbourg-en-Cotentin",
    "address": "",
    "description": "Centre d'art cherbourgeois cité comme partenaire du projet d'édition étudiante « D'après Images » de l'ESADHaR (mai 2025). Adresse, horaires et existence d'une librairie non vérifiés.",
    "website": "",
    "type": "librairie-centre-art",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://esadhar.fr/actu/dapres-images/"
    ],
    "region": "normandie",
    "origine": "ajout-2026",
    "verification_note": "Site lepointdujour.eu inaccessible depuis ici. Piste jugée très pertinente par Jeanson : à vérifier en priorité (adresse, boutique)."
  },
  {
    "id": "normandie-24",
    "name": "Librairie Le Détour",
    "city": "Granville",
    "address": "62 rue des Juifs, 50400 Granville",
    "description": "Librairie indépendante de Granville. Ouvert du mardi au samedi 10h-19h et le dimanche 10h30-18h30.",
    "website": "http://www.librairie-le-detour.fr/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/50/granville/librairie-le-detour-9j1"
    ],
    "region": "normandie",
    "origine": "ajout-2026",
    "verification_note": "Site officiel non consulté."
  },
  {
    "id": "normandie-25",
    "name": "Librairie Le Passage",
    "city": "Alençon",
    "address": "8 rue du Bercail, 61000 Alençon",
    "description": "Librairie-papeterie généraliste et BD d'Alençon (SAS depuis 2000). Ouvert lundi 14h-19h, mardi-samedi 10h-19h.",
    "website": "https://lepassage.site-solocal.com/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/61/alencon/le-passage-1h1",
      "https://www.lastarduweb.fr/librairies-en-normandie-le-top-10-2026"
    ],
    "region": "normandie",
    "origine": "ajout-2026",
    "verification_note": "Hors axe Rouen–Caen–Saint-Malo (100 km au sud de Caen) : détour à décider."
  },
  {
    "id": "normandie-26",
    "name": "A plus d'un titre",
    "city": "Honfleur",
    "address": "30 rue de la République, 14600 Honfleur",
    "description": "Librairie indépendante référencée à Honfleur sur l'annuaire ilibrairie (liste régionale), sans fiche détaillée consultée.",
    "website": "",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/normandie/"
    ],
    "region": "normandie",
    "origine": "ajout-2026",
    "verification_note": "Fiche détaillée introuvable (404) : horaires, site et activité 2026 à confirmer."
  },
  {
    "id": "bretagne-1",
    "name": "Librairie du Frac Bretagne",
    "city": "Rennes",
    "address": "19 avenue André Mussat, 35011 Rennes cedex",
    "description": "Espace librairie-boutique de 60 m² à l'entrée du Frac Bretagne : catalogues, essais, albums jeunesse, sérigraphies, multiples et éditions d'artistes (plus de 1 000 références). Ouvert du mardi au dimanche 12h-18h, contact librairie@fracbretagne.fr.",
    "website": "https://www.fracbretagne.fr/fr/venir-au-frac/boutique/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://www.fracbretagne.fr/fr/venir-au-frac/boutique/",
      "https://www.tourisme-rennes.com/sortir/librairie-du-frac-bretagne-fonds-regional-dart-contemporain/"
    ],
    "region": "bretagne",
    "origine": "v1"
  },
  {
    "id": "bretagne-2",
    "name": "La Criée centre d'art contemporain",
    "city": "Rennes",
    "address": "Place Honoré Commeurec, 35000 Rennes",
    "description": "Centre d'art contemporain municipal dans les halles centrales, mardi-dimanche 13h-19h, avec « un espace librairie et documentation » pour consulter des ouvrages liés à l'exposition et découvrir les éditions de La Criée.",
    "website": "https://www.la-criee.org/fr/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.la-criee.org/fr/informations-pratiques/acces-et-horaires/",
      "https://www.la-criee.org/fr/informations-pratiques/votre-visite/"
    ],
    "region": "bretagne",
    "origine": "v1",
    "verification_note": "Espace surtout orienté consultation et éditions maison ; dépôt d'éditions extérieures non confirmé."
  },
  {
    "id": "bretagne-3",
    "name": "Lendroit éditions",
    "city": "Rennes",
    "address": "24 bis place du Colombier, 35000 Rennes",
    "description": "Maison d'édition d'artistes, librairie spécialisée et galerie (« art book print ») fondée en 2001 par Mathieu Renard, avec atelier de sérigraphie ; la librairie diffuse des éditeurs spécialisés et des artistes auto-édités. Mercredi-samedi 12h-18h ; programme actif en 2026 (expo « Mauvaises graines » 23/09-17/10/2026, festival Ancrages en novembre).",
    "website": "https://www.lendroit.org/",
    "type": "atelier-editeur",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://www.lendroit.org/",
      "https://www.tourisme-rennes.com/sortir/lendroit-editions/"
    ],
    "region": "bretagne",
    "origine": "v1",
    "verification_note": "L'adresse « 5 rue de la Parcheminerie » était obsolète."
  },
  {
    "id": "bretagne-4",
    "name": "Blind Spot",
    "city": "Rennes",
    "address": "36 rue Poullain Duparc, 35000 Rennes",
    "description": "Disquaire indépendant (vinyles neufs et d'occasion) avec un rayon de livres et BD indépendants autour de la musique, expositions renouvelées tous les deux mois. Lundi 13h-19h, mardi-samedi 11h-19h.",
    "website": "http://www.blindspot.fr",
    "type": "disquaire-librairie",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.tourisme-rennes.com/sortir/blind-spot/",
      "https://www.disquaireday.fr/blind-spot-rennes/"
    ],
    "region": "bretagne",
    "origine": "v1",
    "verification_note": "Rayon livres orienté musique."
  },
  {
    "id": "bretagne-5",
    "name": "L'Antre Temps",
    "city": "Rennes",
    "address": "45 rue de la Parcheminerie, 35000 Rennes",
    "description": "Atelier-galerie de l'artiste Constance Villeroy (bijoux, horloges, objets en métal recyclé), environ six expositions d'invités par an. Aucune vente de livres ou d'éditions.",
    "website": "http://lantretemps.blogspot.com/",
    "type": "galerie-artist-run",
    "status": "active",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://www.tourisme-rennes.com/sortir/atelier-galerie-lantre-temps/",
      "https://www.lessentiel.fr/rennes/bonnes-adresses/2026-01-06/rennes-lart-du-mineral-lantre-temps-13264"
    ],
    "region": "bretagne",
    "origine": "v1",
    "verification_note": "Hors sujet a priori.",
    "retired": true
  },
  {
    "id": "bretagne-6",
    "name": "L'Atelier du Bourg",
    "city": "Rennes",
    "address": "11 rue de Flandre, 35000 Rennes",
    "description": "Association et atelier collectif d'arts graphiques (sérigraphie, gravure, risographie, typographie) au Marché Noir, quartier Villejean, avec activité d'édition, stages et boutique en ligne.",
    "website": "https://atelierdubourg.fr/adb/",
    "type": "atelier-editeur",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.tourisme-rennes.com/sortir/latelier-du-bourg/",
      "https://atelierdubourg.fr/adb/"
    ],
    "region": "bretagne",
    "origine": "v1",
    "verification_note": "Pas d'horaires publics ; prendre rendez-vous."
  },
  {
    "id": "bretagne-7",
    "name": "Le Volume",
    "city": "Vern-sur-Seiche",
    "address": "3 rue François Rabelais, 35770 Vern-sur-Seiche",
    "description": "Centre culturel municipal (médiathèque, expositions, spectacles, résidences). Aucun point de vente de livres.",
    "website": "https://levolume.fr/",
    "type": "mediatheque",
    "status": "active",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://levolume.fr/",
      "https://www.cnap.fr/annuaire/lieu/espace-culturel-le-volume"
    ],
    "region": "bretagne",
    "origine": "v1",
    "verification_note": "Hors critères sauf dépôt en artothèque/expo.",
    "retired": true
  },
  {
    "id": "bretagne-8",
    "name": "Passerelle Centre d'art contemporain",
    "city": "Brest",
    "address": "41 rue Charles Berthelot, 29200 Brest",
    "description": "Centre d'art contemporain d'intérêt national avec une boutique dédiée aux publications d'artistes et éditions indépendantes (monographies, écrits d'artistes, catalogues, sérigraphies ; éditeurs Mousse, B42, Lenz). Mardi-samedi 13h-18h.",
    "website": "https://www.cac-passerelle.com/boutique/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "oui",
    "verified_address": false,
    "sources": [
      "https://www.cac-passerelle.com/boutique/",
      "https://www.cac-passerelle.com/"
    ],
    "region": "bretagne",
    "origine": "v1",
    "verification_note": "La page boutique indique « 52 rue du Château » ; adresse historique conservée, à trancher sur place."
  },
  {
    "id": "bretagne-9",
    "name": "Musée vivant de l'Imprimerie PAM",
    "city": "Brest",
    "address": "La PAM, 16 rue Louis Pasteur, 29200 Brest",
    "description": "Musée-atelier créé en 2020 dans l'ancienne imprimerie des Papeteries Armoricaines et Morlaisiennes : pierres lithographiques, casses typographiques, ateliers litho/typo/reliure. Aucune boutique ni librairie.",
    "website": "https://www.lapambrest.fr/musee-imprimerie-pam",
    "type": "musee",
    "status": "active",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://www.lapambrest.fr/musee-imprimerie-pam",
      "https://brest.fr/la-pam"
    ],
    "region": "bretagne",
    "origine": "v1",
    "verification_note": "Intéressant pour imprimer, pas pour déposer.",
    "retired": true
  },
  {
    "id": "bretagne-10",
    "name": "Kuuutch",
    "city": "Brest",
    "address": "17 rue Fautras, 29200 Brest",
    "description": "Galerie-boutique associative « créative et militante » animée par des bénévoles, plus de 180 artistes et collectifs (affiches, sérigraphies, objets), mardi-samedi 14h-19h selon les annuaires.",
    "website": "https://www.instagram.com/kuuutch/",
    "type": "galerie-artist-run",
    "status": "doubtful",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://csc-maximin.fr/kuuutch/",
      "https://trouver-ouvert.fr/brest/kuuutch-929634"
    ],
    "region": "bretagne",
    "origine": "v1",
    "verification_note": "Aucune actualité datée 2025-2026 hors annuaires ; même adresse que Bad Seeds. Confirmer avant le détour."
  },
  {
    "id": "bretagne-11",
    "name": "Bad Seeds Recordshop",
    "city": "Brest",
    "address": "17 rue Fautras, 29200 Brest",
    "description": "Disquaire indépendant fondé en 2015, avec label, concerts et expositions ; mardi-samedi 14h-19h. Programme 2026 en ligne.",
    "website": "https://www.badseedsrecordshop.com/",
    "type": "disquaire-librairie",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.badseedsrecordshop.com/",
      "https://www.disquaireday.fr/bad-seeds-recordshop-brest/"
    ],
    "region": "bretagne",
    "origine": "v1",
    "verification_note": "Aucune mention de livres/fanzines sur le site."
  },
  {
    "id": "bretagne-12",
    "name": "Dialogues Beaux-Arts",
    "city": "Brest",
    "address": "37 rue Louis Pasteur, 29200 Brest",
    "description": "Boutique de matériel beaux-arts et loisirs créatifs ouverte en octobre 2023 par la librairie Dialogues. Ce n'est pas une librairie.",
    "website": "https://www.librairiedialogues.fr/decouvrir-arts-dialogues/",
    "type": "autre",
    "status": "active",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://www.brest-metropole-tourisme.fr/commerce/dialogues-beaux-arts/",
      "https://www.artistes-grandouest.fr/2023/10/26/ouverture-dune-boutique-dialogues-beaux-arts-a-brest/"
    ],
    "region": "bretagne",
    "origine": "v1",
    "verification_note": "Viser la librairie Dialogues elle-même (ajoutée).",
    "retired": true
  },
  {
    "id": "bretagne-13",
    "name": "Galerie Le Lieu – Le Lieu de la Photographie",
    "city": "Lorient",
    "address": "2 chemin du Conservatoire, 56270 Ploemeur (adresse administrative provisoire)",
    "description": "Galerie de photographie contemporaine qui a quitté l'Hôtel Gabriel (Enclos du Port) en 2025 pour cause de travaux ; programmation hors les murs, adresse provisoire à Ploemeur.",
    "website": "https://www.galerielelieu.com/",
    "type": "galerie-artist-run",
    "status": "doubtful",
    "fit": "non",
    "verified_address": false,
    "sources": [
      "https://www.galerielelieu.com/unlieupourlelieu/",
      "https://www.galerielelieu.com/"
    ],
    "region": "bretagne",
    "origine": "v1",
    "verification_note": "Pas d'espace physique en septembre 2026 ; à réévaluer.",
    "retired": true
  },
  {
    "id": "bretagne-14",
    "name": "Librairie Comme dans les livres",
    "city": "Lorient",
    "address": "52 rue de Liège, 56100 Lorient",
    "description": "Librairie indépendante dédiée à la littérature jeunesse et ado, avec rayons BD, beaux livres et arts.",
    "website": "https://commedansleslivres.fr/",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://commedansleslivres.fr/"
    ],
    "region": "bretagne",
    "origine": "v1",
    "verification_note": "Profil jeunesse."
  },
  {
    "id": "bretagne-15",
    "name": "Ma Première Galerie",
    "city": "Quimper",
    "address": "23 rue de la Providence, 29000 Quimper",
    "description": "Galerie associative présentée par la Ville comme la première galerie dédiée au street art du Finistère, avec coin concept-store (sérigraphies, affiches, objets). Jeudi-samedi 14h-18h selon la page municipale.",
    "website": "https://www.facebook.com/mapremieregalerie/",
    "type": "galerie-artist-run",
    "status": "doubtful",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.quimper.bzh/1309-ma-premiere-galerie.htm"
    ],
    "region": "bretagne",
    "origine": "v1",
    "verification_note": "Aucune actualité datée 2025-2026 ; un annuaire donne une autre adresse (8 rue du Parc)."
  },
  {
    "id": "bretagne-16",
    "name": "Librairie Ravy",
    "city": "Quimper",
    "address": "10 rue de la Providence, 29000 Quimper",
    "description": "Grande librairie indépendante généraliste fondée en 1964 (littérature, BD, jeunesse, sciences humaines), papeterie, rayon beaux-arts ; actualités mars 2026.",
    "website": "https://www.librairieravy.fr/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.librairieravy.fr/",
      "https://leslabelsindependants.fr/repertoire/librairie-ravy-quimper/"
    ],
    "region": "bretagne",
    "origine": "v1"
  },
  {
    "id": "bretagne-17",
    "name": "L'Atelier d'Album",
    "city": "Quimper",
    "address": "",
    "description": "Aucune trace en ligne d'un lieu de ce nom à Quimper.",
    "website": "",
    "type": "autre",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://www.pagesjaunes.fr/annuaire/quimper-29/librairies-de-bandes-dessinees"
    ],
    "region": "bretagne",
    "origine": "v1",
    "verification_note": "Nom probablement erroné ; à retirer sauf précision de Jeanson."
  },
  {
    "id": "bretagne-18",
    "name": "Librairie Cheminant",
    "city": "Vannes",
    "address": "19 rue Joseph Le Brix, 56000 Vannes",
    "description": "Librairie indépendante généraliste de 1 000 m² sur quatre niveaux en centre-ville (livres, papeterie, disques, BD).",
    "website": "https://www.librairiecheminant.com/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://leslabelsindependants.fr/repertoire/librairie-cheminant/"
    ],
    "region": "bretagne",
    "origine": "v1",
    "verification_note": "Site officiel inaccessible (403) ; adresse recoupée via deux annuaires."
  },
  {
    "id": "bretagne-19",
    "name": "Librairie Le Silence de la Mer",
    "city": "Vannes",
    "address": "5 place Saint-Pierre, 56000 Vannes",
    "description": "Petite librairie indépendante de littérature face à la cathédrale, référencée par des éditeurs indépendants (Zulma).",
    "website": "https://www.facebook.com/p/Librairie-Le-Silence-de-la-Mer-100063578926073/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.zulma.fr/librairie/librairie-le-silence-de-la-mer/",
      "https://www.placedeslibraires.fr/magasins/vannes/Le-silence-de-la-mer-3207/"
    ],
    "region": "bretagne",
    "origine": "v1"
  },
  {
    "id": "bretagne-20",
    "name": "Domaine de Kerguéhennec",
    "city": "Bignan",
    "address": "Domaine de Kerguéhennec, 56500 Bignan",
    "description": "Domaine départemental (château, parc de sculptures, centre d'art). Château fermé depuis le 8 janvier 2024 pour trois ans de travaux ; seul le parc reste accessible.",
    "website": "https://www.kerguehennec.fr/",
    "type": "librairie-centre-art",
    "status": "doubtful",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.kerguehennec.fr/domaine/presentation"
    ],
    "region": "bretagne",
    "origine": "v1",
    "verification_note": "Réouverture vers 2027 ; inutile en 2026."
  },
  {
    "id": "bretagne-21",
    "name": "Les Moyens du Bord",
    "city": "Morlaix",
    "address": "Manufacture des Tabacs, cour d'honneur, 41 quai du Léon, 29600 Morlaix",
    "description": "Association d'art contemporain : galerie, artothèque, atelier ouvert (La Fabrique de proximités) et organisatrice du festival annuel Multiples dédié aux éditions d'artistes et à la petite édition. Mercredi-samedi 14h-18h pendant les expositions.",
    "website": "https://www.artcontemporainbretagne.org/structure/les-moyens-du-bord/?lang=fr",
    "type": "galerie-artist-run",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://www.artcontemporainbretagne.org/structure/les-moyens-du-bord/?lang=fr",
      "https://www.cnap.fr/annuaire/lieu/les-moyens-du-bord"
    ],
    "region": "bretagne",
    "origine": "v1",
    "verification_note": "Point de vente permanent non confirmé ; festival Multiples très pertinent."
  },
  {
    "id": "bretagne-22",
    "name": "La Maison des Bulles",
    "city": "Morlaix",
    "address": "18 Grand'Rue, 29600 Morlaix",
    "description": "Librairie spécialisée BD, comics, mangas, jeunesse, ouverte six jours sur sept.",
    "website": "https://www.lamaisondesbulles.fr/",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.lamaisondesbulles.fr/contact"
    ],
    "region": "bretagne",
    "origine": "v1",
    "verification_note": "Profil BD grand public."
  },
  {
    "id": "bretagne-23",
    "name": "Librairie Forum des Champs",
    "city": "Saint-Brieuc",
    "address": "Centre commercial Les Champs, 1 rue Sainte-Barbe, 22000 Saint-Brieuc",
    "description": "Librairie-papeterie indépendante de plus de 1 100 m² dans le centre commercial Les Champs, présentée comme la plus grande librairie indépendante du département.",
    "website": "https://www.facebook.com/librairieforumdeschamps/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.les-champs.fr/horaires-et-acces/",
      "https://www.les-horaires.info/librairie-forum-des-champs-saint-brieuc-les-champs-305895.html"
    ],
    "region": "bretagne",
    "origine": "v1",
    "verification_note": "Le libellé « La Galerie » de l'ancienne fiche ne correspond à rien."
  },
  {
    "id": "bretagne-24",
    "name": "La Grande Passerelle",
    "city": "Saint-Malo",
    "address": "2 rue Nicolas Bouvier, 35400 Saint-Malo",
    "description": "Pôle culturel municipal (médiathèque, cinéma, expositions). Pas de point de vente.",
    "website": "https://lagrandepasserelle.saint-malo.fr/",
    "type": "mediatheque",
    "status": "active",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://www.saint-malo.fr/mes_contacts/pole-culturel-la-grande-passerelle/"
    ],
    "region": "bretagne",
    "origine": "v1",
    "verification_note": "Hors critères.",
    "retired": true
  },
  {
    "id": "bretagne-25",
    "name": "Le Porte-Plume Malouin",
    "city": "Saint-Malo",
    "address": "78 rue Georges Clemenceau, Saint-Servan, 35400 Saint-Malo",
    "description": "Librairie indépendante généraliste familiale (depuis 1930) à Saint-Servan : littérature, polars, sciences humaines, beaux livres, BD, jeunesse.",
    "website": "https://www.leporteplumemalouin.com/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.leporteplumemalouin.com/"
    ],
    "region": "bretagne",
    "origine": "v1"
  },
  {
    "id": "bretagne-26",
    "name": "Centre Cristel Éditeur d'Art",
    "city": "Saint-Malo",
    "address": "9 boulevard de la Tour d'Auvergne, 35400 Saint-Malo",
    "description": "Galerie privée et maison d'édition d'art moderne et contemporain (Rouault, Veličković…), quatre expositions par an, catalogues édités ; entrée libre lundi-samedi.",
    "website": "https://www.centre-cristel-editeur-art.com/",
    "type": "galerie-artist-run",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.centre-cristel-editeur-art.com/"
    ],
    "region": "bretagne",
    "origine": "v1",
    "verification_note": "Vend surtout ses propres éditions."
  },
  {
    "id": "bretagne-27",
    "name": "Strandflat",
    "city": "Saint-Malo",
    "address": "",
    "description": "Label et plateforme d'édition malouine animée par Samuel Étienne, consacrée à la culture fanzine et aux publications DIY (revue ZINES, essais, livres d'artistes ; distribué par Les presses du réel). Pas de lieu de vente physique ; vente en ligne.",
    "website": "https://strandflat.bandcamp.com/",
    "type": "atelier-editeur",
    "status": "active",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://www.lespressesdureel.com/EN/editeur.php?id=234",
      "https://strandflat.bandcamp.com/merch/artiste-editeur"
    ],
    "region": "bretagne",
    "origine": "v1",
    "verification_note": "Contact par mail (strandflat@strandflat.fr) plutôt que visite."
  },
  {
    "id": "bretagne-28",
    "name": "Cabinet du livre d'artiste / Éditions Incertain Sens",
    "city": "Rennes",
    "address": "Université Rennes 2, BU centrale (bâtiment H, rez-de-jardin), place du Recteur Henri Le Moal, 35043 Rennes cedex",
    "description": "Collection, lieu d'exposition et de recherche dédié au livre d'artiste, intégré à la BU de Rennes 2 depuis janvier 2023, adossé aux éditions Incertain Sens.",
    "website": "https://www.sites.univ-rennes2.fr/cabinet-livre-artiste/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://satellites.univ-rennes2.fr/cabinet-livre-artiste/incertain-sens/informations_pratiques.htm",
      "https://www.bu.univ-rennes2.fr/nous-connaitre/bibliotheque-centrale/cabinet-livre-dartiste"
    ],
    "region": "bretagne",
    "origine": "ajout-2026",
    "verification_note": "Plutôt dépôt en collection/exposition que dépôt-vente."
  },
  {
    "id": "bretagne-29",
    "name": "40mcube",
    "city": "Rennes",
    "address": "48 avenue Sergent Maginot, 35000 Rennes",
    "description": "Centre d'art contemporain d'intérêt national (2001) : exposition et production, édite catalogues, livres d'artistes et sérigraphies.",
    "website": "https://www.40mcube.org/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://fr.wikipedia.org/wiki/40mcube"
    ],
    "region": "bretagne",
    "origine": "ajout-2026",
    "verification_note": "Point de vente permanent non documenté."
  },
  {
    "id": "bretagne-30",
    "name": "Librairie Comment Dire",
    "city": "Rennes",
    "address": "5 rue Jules Simon, 35000 Rennes",
    "description": "Librairie indépendante ouverte en septembre 2022, littérature, sciences humaines et écrits sur les arts ; mardi-samedi 10h-19h.",
    "website": "https://www.librairiecommentdire.fr/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.placedeslibraires.fr/magasins/rennes/Comment-Dire-6312/"
    ],
    "region": "bretagne",
    "origine": "ajout-2026"
  },
  {
    "id": "bretagne-31",
    "name": "Librairie La Nuit des Temps",
    "city": "Rennes",
    "address": "10 quai Émile Zola, 35000 Rennes",
    "description": "Librairie indépendante engagée du centre-ville (féminisme, LGBTQ+, écologie, littérature étrangère, BD, jeunesse), mardi-samedi 10h-19h.",
    "website": "https://lndt.fr/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://lndt.fr/"
    ],
    "region": "bretagne",
    "origine": "ajout-2026"
  },
  {
    "id": "bretagne-32",
    "name": "Librairie Le Failler",
    "city": "Rennes",
    "address": "8-14 rue Saint-Georges, 35000 Rennes",
    "description": "Grande librairie indépendante généraliste (depuis 1925, plus de 80 000 références) près du Parlement de Bretagne.",
    "website": "https://www.librairielefailler.fr/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.tourisme-rennes.com/sortir/librairie-le-failler/"
    ],
    "region": "bretagne",
    "origine": "ajout-2026",
    "verification_note": "Dépôt à négocier au rayon arts."
  },
  {
    "id": "bretagne-33",
    "name": "Sandwich Éditions – Riso Print Club",
    "city": "Redon",
    "address": "5 rue Jacques Prado, 35600 Redon",
    "description": "Atelier de risographie et sérigraphie en édition limitée avec galerie d'objets imprimés, ateliers et boutique en ligne.",
    "website": "https://www.sandwich.bzh/",
    "type": "atelier-editeur",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://www.sandwich.bzh/en_GB/shop"
    ],
    "region": "bretagne",
    "origine": "ajout-2026",
    "verification_note": "Horaires publics non trouvés ; contacter avant."
  },
  {
    "id": "bretagne-34",
    "name": "Librairie Le Pain des Rêves",
    "city": "Saint-Brieuc",
    "address": "13 rue Saint-François, 22000 Saint-Brieuc",
    "description": "Librairie indépendante du centre-ville créée dans les années 1970, nommée d'après le roman de Louis Guilloux, plus de 11 000 titres.",
    "website": "",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.rue-des-livres.com/librairie/706/le_pain_des_reves.html"
    ],
    "region": "bretagne",
    "origine": "ajout-2026",
    "verification_note": "Pas de source datée 2025-2026 ; domaine lepaindesreves.fr détourné."
  },
  {
    "id": "bretagne-35",
    "name": "Atelier B.8",
    "city": "Saint-Brieuc",
    "address": "8 rue de Rohan, 22000 Saint-Brieuc",
    "description": "Studio d'impression (risographie, fine art, numérique) qui produit fanzines, micro-éditions et livres d'artistes, avec boutique ouverte en 2020 en centre-ville.",
    "website": "https://www.fabouestcreations.com/",
    "type": "atelier-editeur",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://www.fabouestcreations.com/a-propos"
    ],
    "region": "bretagne",
    "origine": "ajout-2026",
    "verification_note": "Horaires de la boutique non trouvés."
  },
  {
    "id": "bretagne-36",
    "name": "Galerie Raymond Hains – École des Beaux-Arts",
    "city": "Saint-Brieuc",
    "address": "9 esplanade Georges Pompidou, 22000 Saint-Brieuc",
    "description": "Galerie municipale d'art contemporain créée en 2015 au sein de l'école des beaux-arts, à 300 m de la gare.",
    "website": "https://www.saint-brieuc.bzh/au-quotidien/culture/ecole-des-beaux-arts/galerie-raymond-hains",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.cotesdarmor.com/fr/fiche/patrimoine-culturel/galerie-raymond-hains-saint-brieuc_TFOPCUBRE022V5286G0/"
    ],
    "region": "bretagne",
    "origine": "ajout-2026",
    "verification_note": "Aucun point de vente mentionné."
  },
  {
    "id": "bretagne-37",
    "name": "Centre d'art GwinZegal",
    "city": "Guingamp",
    "address": "Ancienne prison, 4 rue Auguste Pavie, 22200 Guingamp",
    "description": "Centre d'art dédié à la photographie dans l'ancienne prison de Guingamp, programme d'éditions photographiques ; entrée gratuite, mercredi-dimanche 14h-18h30.",
    "website": "https://gwinzegal.com/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://gwinzegal.com/infos-pratiques",
      "https://www.cnap.fr/annuaire/lieu/centre-dart-gwinzegal"
    ],
    "region": "bretagne",
    "origine": "ajout-2026",
    "verification_note": "Boutique physique non détaillée."
  },
  {
    "id": "bretagne-38",
    "name": "L'Imagerie centre d'art",
    "city": "Lannion",
    "address": "19 rue Jean Savidan, 22300 Lannion",
    "description": "Centre d'art fondé en 1984, consacré à la photographie et à l'image, galerie de 500 m² en centre-ville, entrée libre mardi-samedi.",
    "website": "https://www.imageriecentredart.com/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.imageriecentredart.com/"
    ],
    "region": "bretagne",
    "origine": "ajout-2026",
    "verification_note": "Aucune boutique mentionnée."
  },
  {
    "id": "bretagne-39",
    "name": "Librairie Gwalarn",
    "city": "Lannion",
    "address": "15 rue des Chapeliers, 22300 Lannion",
    "description": "Librairie indépendante généraliste du centre de Lannion.",
    "website": "https://www.gwalarn.com/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://editions-metailie.com/librairie/gwalarn/",
      "https://www.gwalarn.com/presentation/"
    ],
    "region": "bretagne",
    "origine": "ajout-2026"
  },
  {
    "id": "bretagne-40",
    "name": "Librairie-Café Les Déferlantes",
    "city": "Morlaix",
    "address": "9 place de Viarmes, 29600 Morlaix",
    "description": "Librairie-café indépendante du centre de Morlaix.",
    "website": "https://www.facebook.com/p/Les-D%C3%A9ferlantes-Librairie-Caf%C3%A9-100063802672602/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://acceslibre.beta.gouv.fr/app/29-morlaix/a/librairie/erp/librairie-cafe-les-deferlantes/"
    ],
    "region": "bretagne",
    "origine": "ajout-2026",
    "verification_note": "Existence confirmée par annuaires uniquement."
  },
  {
    "id": "bretagne-41",
    "name": "Fonds Hélène & Édouard Leclerc pour la Culture (FHEL)",
    "city": "Landerneau",
    "address": "Aux Capucins, 29800 Landerneau",
    "description": "Centre d'expositions privé d'art moderne et contemporain dans l'ancien couvent des Capucins, avec boutique et maison d'édition propre ; exposition Warhol en 2026.",
    "website": "https://www.fonds-culturel-leclerc.fr/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.fonds-culturel-leclerc.fr/",
      "https://editions.fonds-culturel-leclerc.fr/"
    ],
    "region": "bretagne",
    "origine": "ajout-2026",
    "verification_note": "Boutique orientée catalogues maison."
  },
  {
    "id": "bretagne-42",
    "name": "Librairie Dialogues",
    "city": "Brest",
    "address": "Parvis Marie-Paul Kermarec, 29200 Brest",
    "description": "L'une des plus grandes librairies indépendantes de France (120 000 références) avec café et rencontres ; lundi-samedi 10h-19h.",
    "website": "https://www.librairiedialogues.fr/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.brest-metropole-tourisme.fr/commerce/librairie-dialogues/",
      "https://www.librairiedialogues.fr/qui_sommes_nous/"
    ],
    "region": "bretagne",
    "origine": "ajout-2026"
  },
  {
    "id": "bretagne-43",
    "name": "Café-Librairie Les Métamorphoses",
    "city": "Douarnenez",
    "address": "17 rue Voltaire, 29100 Douarnenez",
    "description": "Café-librairie du centre de Douarnenez (fonds éclectique et régional), expositions et rencontres ; mardi-samedi 10h-13h / 15h-19h.",
    "website": "https://www.instagram.com/lesmetamorphoses29/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://douarnenez-tourisme.com/offres/librairie-les-metamorphoses-douarnenez-fr-6239828/"
    ],
    "region": "bretagne",
    "origine": "ajout-2026",
    "verification_note": "Semble avoir pris la suite de L'Ivraie (fermée)."
  },
  {
    "id": "bretagne-44",
    "name": "Librairie de l'Angle Rouge",
    "city": "Douarnenez",
    "address": "9 rue de l'Hôpital, 29100 Douarnenez",
    "description": "Librairie coopérative indépendante labellisée LIR depuis 2023, papeterie, jeux, coin café et expositions ; mardi-samedi 10h-13h / 15h-19h.",
    "website": "https://librairiedelanglerouge.com/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.lapetitelibrairie.fr/librairies/29046-douarnenez/bedhhbbffcabbbgefhhf.htm"
    ],
    "region": "bretagne",
    "origine": "ajout-2026"
  },
  {
    "id": "bretagne-45",
    "name": "Fracas – librairie, atelier de céramique, café",
    "city": "Lorient",
    "address": "11 rue Auguste Nayel, 56100 Lorient",
    "description": "Librairie indépendante au fonds réduit et choisi (féminisme, écologie, BD, jeunesse), couplée à un atelier de céramique et un café ; mardi-samedi 10h30-19h.",
    "website": "https://www.fracaslorient.com/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.fracaslorient.com/le-lieu"
    ],
    "region": "bretagne",
    "origine": "ajout-2026",
    "verification_note": "A pris la suite de la librairie « À la ligne » (non documenté)."
  },
  {
    "id": "bretagne-46",
    "name": "Librairie L'Archipel des Mots",
    "city": "Vannes",
    "address": "",
    "description": "Librairie indépendante généraliste de Vannes.",
    "website": "https://www.facebook.com/archipeldesmots/",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://www.rue-des-livres.com/librairie/1383/l_archipel_des_mots.html"
    ],
    "region": "bretagne",
    "origine": "ajout-2026",
    "verification_note": "Adresse et activité 2026 non vérifiées."
  },
  {
    "id": "bretagne-47",
    "name": "Librairie Le Cabestan",
    "city": "Saint-Malo",
    "address": "2 rue Porcon de la Barbinais, intra-muros, 35400 Saint-Malo",
    "description": "Librairie généraliste intra-muros ouverte 7j/7 (fonds régional, guides, cartes marines).",
    "website": "",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.saint-malo-tourisme.co.uk/offers/librairie-le-cabestan-saint-malo-en-3645726/"
    ],
    "region": "bretagne",
    "origine": "ajout-2026",
    "verification_note": "Profil touristique."
  },
  {
    "id": "pays-de-la-loire-1",
    "name": "Frac des Pays de la Loire",
    "city": "Carquefou",
    "address": "24 bis boulevard Ampère, La Fleuriaye, 44470 Carquefou",
    "description": "Fonds régional d'art contemporain, site de Carquefou (expositions Xavier Veilhan et programmation fin 2026 annoncées). Expositions ouvertes mercredi-dimanche 14h-18h selon le site officiel (Le Voyage à Nantes indique mercredi-vendredi et dimanche). Aucune librairie ni point de vente d'éditions mentionné sur les pages consultées.",
    "website": "https://fracdespaysdelaloire.com/",
    "type": "autre",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://fracdespaysdelaloire.com/en/contact/",
      "https://fracdespaysdelaloire.com/en/",
      "https://www.levoyageanantes.fr/lieux/frac-des-pays-de-la-loire/"
    ],
    "region": "pays-de-la-loire",
    "origine": "v1",
    "verification_note": "Point de vente non confirmé. Le Voyage à Nantes parle de « plusieurs sites à Nantes et Carquefou » mais aucune adresse nantaise n'apparaît sur le site du Frac : le site Nantes évoqué dans les pistes reste non vérifié."
  },
  {
    "id": "pays-de-la-loire-2",
    "name": "Cool Paper Zone",
    "city": "Nantes",
    "address": "Ateliers Dulcie September, place Dulcie September, 44000 Nantes",
    "description": "Librairie associative dédiée à la micro-édition, aux fanzines et aux multiples, ouverte le 13 décembre 2025 dans l'ancienne école des Beaux-Arts (Ateliers Dulcie September). Dépôt-vente : adhésion artiste 10 €/an, 100 % du prix de vente reversé. Horaires : mercredi-vendredi 17h-19h, samedi 10h-19h.",
    "website": "https://www.instagram.com/cool_paper_zone/",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://www.sambuc.fr/articles/a1220-cool-paper-zone-une-librairie-associative-dediee-a-la-micro-edition-s-ouvre-a-nantes.html",
      "https://www.fragil.org/cool-paper-zone-la-richesse-de-la-micro-edition-celebree/",
      "https://www.helloasso.com/associations/cool-paper-zone",
      "https://annuaire-entreprises.data.gouv.fr/entreprise/cool-paper-zone-989230578"
    ],
    "region": "pays-de-la-loire",
    "origine": "v1",
    "verification_note": "Pas de site web propre (Instagram + HelloAsso). Le siège social est au 54 boulevard Louis Millet 44300 (annuaire entreprises), pas l'adresse de la boutique. Horaires datés de l'ouverture (déc. 2025), à confirmer."
  },
  {
    "id": "pays-de-la-loire-3",
    "name": "Librairie Vent d'Ouest au lieu unique",
    "city": "Nantes",
    "address": "Le lieu unique, 2 rue de la Biscuiterie, 44000 Nantes",
    "description": "Annexe de la librairie généraliste Vent d'Ouest dans le lieu unique (scène nationale). Horaires : mardi-samedi 12h-19h30, dimanche 15h-19h selon Petit Futé ; l'annuaire horairesdouverture24 donne mardi-samedi 9h30-12h45 / 13h30-19h (probablement les horaires du Bon Pasteur).",
    "website": "https://librairie-nantes.fr/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.horairesdouverture24.fr/filiale/Nantes-Librairie%20Vent%20d%27Ouest%20au%20lieu%20unique-1055216P.html",
      "https://www.petitfute.co.uk/v27598-nantes-44000/c1168-shopping-mode-cadeaux/c521-librairie/c522-generaliste/102358-vent-d-ouest.html",
      "https://librairie-nantes.fr/"
    ],
    "region": "pays-de-la-loire",
    "origine": "v1",
    "verification_note": "Horaires divergents selon les annuaires ; le site officiel (page d'accueil) ne détaille pas l'annexe. Fiche Mobilis inaccessible (403)."
  },
  {
    "id": "pays-de-la-loire-4",
    "name": "Maison Fumetti",
    "city": "Nantes",
    "address": "Manufacture des tabacs, 6 cour Jules Durand, 44000 Nantes",
    "description": "Lieu associatif dédié à la bande dessinée et aux arts graphiques (expositions, ateliers « Fabrique ton fanzine », cours du soir 2026/2027). Visites hors expositions sur contact préalable, sinon aux horaires de la bibliothèque de la Manufacture (mardi-vendredi).",
    "website": "https://www.maisonfumetti.fr/",
    "type": "autre",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.maisonfumetti.fr/category/informations/",
      "https://www.maisonfumetti.fr/",
      "https://www.maisonfumetti.fr/atelier-fanzine-3/"
    ],
    "region": "pays-de-la-loire",
    "origine": "v1",
    "verification_note": "Aucune boutique/librairie mentionnée sur le site ; les ventes passent par des librairies partenaires (Aladin citée). Dépôt à négocier au cas par cas."
  },
  {
    "id": "pays-de-la-loire-5",
    "name": "Librairie HAB Galerie",
    "city": "Nantes",
    "address": "HAB Galerie, 21 quai des Antilles, Hangar à Bananes, 44200 Nantes",
    "description": "Librairie du Voyage à Nantes dans la HAB Galerie : livres d'art, photo, architecture, graphisme, BD, jeunesse, papeterie et objets de créateurs français ; signatures et rencontres mensuelles. Horaires 2026 : du 7 septembre, mercredi-dimanche 13h30-19h (exposition Interstellar jusqu'au 27 septembre 2026). Contact librairie.hab@lvan.fr.",
    "website": "https://www.levoyageanantes.fr/lieux/librairie-hab-galerie/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://www.levoyageanantes.fr/lieux/librairie-hab-galerie/",
      "https://www.levoyageanantes.fr/lieux/hab-galerie/"
    ],
    "region": "pays-de-la-loire",
    "origine": "v1",
    "verification_note": "Le site donne « Quai des Antilles » sans numéro : le 21 vient du brief. Ouverture liée aux périodes d'exposition (fermeture possible après le 27/09/2026)."
  },
  {
    "id": "pays-de-la-loire-6",
    "name": "Le Grand Café, centre d'art contemporain",
    "city": "Saint-Nazaire",
    "address": "2 place des Quatre Z'Horloges, 44600 Saint-Nazaire",
    "description": "Centre d'art contemporain d'intérêt national, entrée libre ; éditions maison « en vente au Grand Café » et salon du livre d'art Editorama (6-7 décembre 2025, 9 éditeurs indépendants + librairie L'Oiseau-Tempête). Exposition Nefeli Papadimouli du 13 juin au 18 octobre 2026. Horaires (Pôle arts visuels) : 14h-19h sauf lundi, 11h-19h en été.",
    "website": "https://www.grandcafe-saintnazaire.fr/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://www.grandcafe-saintnazaire.fr/",
      "https://www.grandcafe-saintnazaire.fr/evenements/nouvelles-editions/",
      "https://www.grandcafe-saintnazaire.fr/en/evenements/editorama/",
      "https://www.saintnazairenews.fr/news/editorama-le-livre-d-art-mis-a-l-honneur-au-grand-cafe",
      "https://poleartsvisuels-pdl.fr/annuaires/le-grand-cafe/"
    ],
    "region": "pays-de-la-loire",
    "origine": "v1",
    "verification_note": "Pas de librairie permanente identifiée : vente à l'accueil des éditions du centre. Une édition 2026 d'Editorama n'est pas encore annoncée."
  },
  {
    "id": "pays-de-la-loire-7",
    "name": "Librairie L'Oiseau Tempête",
    "city": "Saint-Nazaire",
    "address": "20 bis rue de la Paix, 44600 Saint-Nazaire",
    "description": "Librairie indépendante (SARL créée en octobre 2021), membre ALIP, partenaire livre d'art du salon Editorama du Grand Café. Ouvert mardi-samedi 10h-19h.",
    "website": "https://asso.librairies-alip.fr/librairies/loiseau-tempete/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/44/saint-nazaire/librairie-l-oiseau-tempete-88p",
      "https://www.grandcafe-saintnazaire.fr/en/evenements/editorama/",
      "https://asso.librairies-alip.fr/librairies/loiseau-tempete/"
    ],
    "region": "pays-de-la-loire",
    "origine": "v1",
    "verification_note": "Site officiel loiseau-tempete.fr non consulté (fiches ALIP et Place des libraires en erreur 403/503)."
  },
  {
    "id": "pays-de-la-loire-8",
    "name": "Librairie Myriagone",
    "city": "Angers",
    "address": "16 rue Bodinier, 49100 Angers",
    "description": "Librairie indépendante « hybride » : littérature, BD, beaux-arts, jeunesse, curiosités, vinyles, avec espace galerie d'arts graphiques et comptoir café. Horaires 2026 : mardi 16h-19h, mercredi-samedi 11h-19h.",
    "website": "https://www.librairiemyriagone.fr/",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://www.librairiemyriagone.fr/",
      "https://www.anjou-tourisme.com/fr/diffusio/visites/myriagone-angers_TFOPCUUMYRIAGONE"
    ],
    "region": "pays-de-la-loire",
    "origine": "v1",
    "verification_note": "Fanzines/micro-édition non explicitement cités ; le « oui » repose sur la galerie d'arts graphiques et le rayon beaux-arts."
  },
  {
    "id": "pays-de-la-loire-9",
    "name": "Château de Montsoreau – Musée d'art contemporain",
    "city": "Montsoreau",
    "address": "Passage du Marquis de Geoffre, 49730 Montsoreau",
    "description": "Musée privé d'art contemporain (collection Art & Language) avec librairie-boutique au cœur du musée : livres et revues d'art, sciences humaines, catalogues d'expositions, objets et bijoux de créateurs ; rencontres d'auteurs. Ouvert toute l'année (12h-18h l'hiver, 10h-19h l'été), entrée adulte 10,70 €.",
    "website": "https://www.chateau-montsoreau.com/",
    "type": "musee",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.chateau-montsoreau.com/wordpress/en/bookstore-shopping/",
      "https://www.chateau-montsoreau.com/wordpress/en/practical-informations/"
    ],
    "region": "pays-de-la-loire",
    "origine": "v1",
    "verification_note": "Accès à la librairie sans billet non précisé (« accessible aux visiteurs et au grand public »)."
  },
  {
    "id": "pays-de-la-loire-10",
    "name": "Galerie 5 – Université d'Angers",
    "city": "Angers",
    "address": "BU Belle-Beille, 5 rue Le Nôtre, 49045 Angers",
    "description": "Galerie d'art contemporain de la bibliothèque universitaire Belle-Beille, fermée pour rénovation jusqu'en septembre 2027 (dernière exposition listée : avril 2025). Pas de point de vente mentionné.",
    "website": "https://bu.univ-angers.fr/galeries",
    "type": "autre",
    "status": "closed",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://bu.univ-angers.fr/galeries",
      "https://www.univ-angers.fr/fr/vie-des-campus/vie-pratique/lieux-de-vie-et-de-culture/galerie-5.html",
      "https://www.enpaysdelaloire.com/visites/musees-et-centres-d-interpretation/galerie-5"
    ],
    "region": "pays-de-la-loire",
    "origine": "v1",
    "verification_note": "Fermeture temporaire (travaux) : à réévaluer à la réouverture. La Galerie Dityvon (BU Saint-Serge, photo) reste active mais sans boutique.",
    "retired": true
  },
  {
    "id": "pays-de-la-loire-11",
    "name": "Librairie-boutique des Musées d'Angers (Musée des Beaux-Arts)",
    "city": "Angers",
    "address": "Musée des Beaux-Arts, 14 rue du Musée, 49100 Angers",
    "description": "Librairie-boutique municipale, en accès libre dans le hall du Musée des Beaux-Arts (boutique principale), avec antennes au Musée Jean-Lurçat, galerie David d'Angers, Artothèque, etc. Ouvrages liés à l'art, catalogues d'expositions, vente par correspondance (librairie.musees@ville.angers.fr, 02 41 05 38 99). Horaires du musée : mardi-dimanche 10h-18h.",
    "website": "https://musees.angers.fr/infos-pratiques/librairie-boutique/index.html",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://musees.angers.fr/infos-pratiques/librairie-boutique/index.html",
      "https://musees.angers.fr/lieux/musee-des-beaux-arts/index.html"
    ],
    "region": "pays-de-la-loire",
    "origine": "v1",
    "verification_note": "Gestion municipale : dépôt-vente probablement soumis à validation administrative."
  },
  {
    "id": "pays-de-la-loire-12",
    "name": "FIAA – Centre d'art (Fonds International d'Art Actuel)",
    "city": "Le Mans",
    "address": "Là Visitation, 1 rue Gambetta, 72100 Le Mans",
    "description": "Centre d'art privé au cœur du Mans (accès par le passage entre le restaurant Peach et le bar Racines ; adresse postale 8 allée Leprince d'Ardenay), avec micro-galerie de 25 m² et boutique sur place. Exposition Erró du 22 mai au 1er novembre 2026. Ouvert mardi-dimanche 14h-18h.",
    "website": "https://www.fiaa-lemans.com/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.fiaa-lemans.com/nous-contacter",
      "https://www.fiaa-lemans.com/",
      "https://sortiraumans.fr/lieu/fiaa-centre-art-actuel",
      "https://www.lemans-tourisme.com/en/centre-dart-fiaa.html"
    ],
    "region": "pays-de-la-loire",
    "origine": "v1",
    "verification_note": "Contenu de la boutique (livres ? objets ?) non détaillé. Code postal 72100 selon le site, 72000 selon l'office de tourisme."
  },
  {
    "id": "pays-de-la-loire-13",
    "name": "Librairie Bulle",
    "city": "Le Mans",
    "address": "13 rue de la Barillerie, 72000 Le Mans",
    "description": "Librairie BD fondée en 1983 (350 m²), avec un « Espace Bis » au 18 rue Saint-Martin (sérigraphies, affiches, originaux, figurines). Horaires : lundi 13h-19h, mardi-samedi 10h-19h ; Espace Bis mardi-vendredi 13h-19h, samedi 10h-13h / 14h-19h.",
    "website": "https://www.librairie-bulle.fr/",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.librairie-bulle.fr/infos-pratiques/",
      "https://asso.librairies-alip.fr/librairies/bulle/"
    ],
    "region": "pays-de-la-loire",
    "origine": "v1",
    "verification_note": "Fanzines non cités explicitement ; l'Espace Bis (sérigraphies) est le point d'entrée le plus pertinent."
  },
  {
    "id": "pays-de-la-loire-14",
    "name": "Librairie Thuard",
    "city": "Le Mans",
    "address": "24 rue de l'Étoile, 72000 Le Mans",
    "description": "Librairie généraliste indépendante labellisée LIR, avec salon de thé, rencontres d'auteurs et ateliers. Horaires : lundi-vendredi 9h-19h, samedi 9h-19h30.",
    "website": "https://www.librairiethuard.fr/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.pagesjaunes.fr/pros/00882820",
      "https://fr.mappy.com/poi/4d6d7dc5b9eb25075c94cdc3"
    ],
    "region": "pays-de-la-loire",
    "origine": "v1",
    "verification_note": "Site officiel inaccessible (403) ; adresse confirmée par deux annuaires."
  },
  {
    "id": "pays-de-la-loire-15",
    "name": "Zoo centre d'art contemporain (ex-Zoo galerie)",
    "city": "Nantes",
    "address": "12 rue Lamoricière, 44100 Nantes",
    "description": "Centre d'art contemporain nantais (ancienne Zoo galerie, renommé, nouveau domaine zoo-cac.fr) avec une rubrique Éditions. Exposition Émilie Brout & Maxime Marion à partir du 10 septembre 2026.",
    "website": "https://zoo-cac.fr/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://zoo-cac.fr/",
      "https://zoogalerie.fr/"
    ],
    "region": "pays-de-la-loire",
    "origine": "ajout-2026",
    "verification_note": "Vente d'éditions sur place et horaires non confirmés."
  },
  {
    "id": "pays-de-la-loire-16",
    "name": "Librairie Coiffard",
    "city": "Nantes",
    "address": "7-8 rue de la Fosse, 44000 Nantes",
    "description": "Grande librairie indépendante du centre de Nantes avec rayons beaux-arts, photo, architecture, graphisme, design et BD ; espace événementiel « L'Échelle ».",
    "website": "https://www.librairiecoiffard.fr/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.librairiecoiffard.fr/nous_contacter",
      "https://www.librairiecoiffard.fr/"
    ],
    "region": "pays-de-la-loire",
    "origine": "ajout-2026",
    "verification_note": "Horaires non affichés sur les pages consultées."
  },
  {
    "id": "pays-de-la-loire-17",
    "name": "Librairie Vent d'Ouest (Bon Pasteur)",
    "city": "Nantes",
    "address": "5 place du Bon-Pasteur, 44000 Nantes",
    "description": "Librairie mère de Vent d'Ouest, généraliste sur quatre niveaux (env. 50 000 titres, forts rayons littérature et sciences humaines). Mardi-samedi 9h30-12h45 / 13h30-19h.",
    "website": "https://librairie-nantes.fr/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.petitfute.co.uk/v27598-nantes-44000/c1168-shopping-mode-cadeaux/c521-librairie/c522-generaliste/102358-vent-d-ouest.html",
      "https://librairie-nantes.fr/"
    ],
    "region": "pays-de-la-loire",
    "origine": "ajout-2026",
    "verification_note": "Doublon fonctionnel avec l'annexe du lieu unique : un seul interlocuteur pour les deux."
  },
  {
    "id": "pays-de-la-loire-18",
    "name": "Atelier Prisme",
    "city": "Nantes",
    "address": "3 bis rue Sévigné, 44000 Nantes",
    "description": "Atelier coopératif et lieu d'exposition artist-run créé en 2014 (une dizaine d'artistes : illustration, motion design, peinture, photo, objets), avec événements publics.",
    "website": "http://www.atelierprisme.fr",
    "type": "galerie-artist-run",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://poleartsvisuels-pdl.fr/annuaires/atelier-prisme/"
    ],
    "region": "pays-de-la-loire",
    "origine": "ajout-2026",
    "verification_note": "Aucun point de vente mentionné ; activité 2026 non vérifiée (fiche annuaire sans date)."
  },
  {
    "id": "pays-de-la-loire-19",
    "name": "Librairie Bulle – Espace Bis",
    "city": "Le Mans",
    "address": "18 rue Saint-Martin, 72000 Le Mans",
    "description": "Annexe de la librairie Bulle dédiée aux sérigraphies, affiches, originaux et expositions. Mardi-vendredi 13h-19h, samedi 10h-13h / 14h-19h (espacebis@libbulle.com).",
    "website": "https://www.librairie-bulle.fr/infos-pratiques/",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.librairie-bulle.fr/infos-pratiques/",
      "https://asso.librairies-alip.fr/librairies/bulle/"
    ],
    "region": "pays-de-la-loire",
    "origine": "ajout-2026",
    "verification_note": "Même gestion que Bulle (id 13) : à traiter dans la même visite."
  },
  {
    "id": "pays-de-la-loire-20",
    "name": "Le Carré, scène nationale – centre d'art contemporain (Chapelle du Genêteil)",
    "city": "Château-Gontier-sur-Mayenne",
    "address": "4 bis rue Horeau, 53200 Château-Gontier-sur-Mayenne",
    "description": "Centre d'art contemporain d'intérêt national (membre DCA) installé dans la Chapelle du Genêteil ; chapelle en travaux, programmation d'expositions actuellement nomade. Seul centre d'art labellisé de Mayenne.",
    "website": "https://www.le-carre.org/",
    "type": "autre",
    "status": "doubtful",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://dca-art.com/les-centres-d-art-contemporain/membres/le-carre-scene-nationale-centre-d-art-contemporain-d-interet-national",
      "https://dca-art.com/les-centres-d-art-contemporain/membres"
    ],
    "region": "pays-de-la-loire",
    "origine": "ajout-2026",
    "verification_note": "Pas de point de vente identifié et lieu en travaux : hors tournée sauf réouverture."
  },
  {
    "id": "pays-de-la-loire-21",
    "name": "Les Vagues, librairie queer",
    "city": "Nantes",
    "address": null,
    "description": "Librairie queer nantaise avec ateliers militants, citée par Nantes Métropole (liste des librairies indépendantes) et par Fragil.",
    "website": "",
    "type": "librairie-specialisee",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://metropole.nantes.fr/que-faire-a-nantes/librairies-independantes-les-bonnes-adresses-dans-la-metropole-nantaise",
      "https://www.fragil.org/cool-paper-zone-la-richesse-de-la-micro-edition-celebree/"
    ],
    "region": "pays-de-la-loire",
    "origine": "ajout-2026",
    "verification_note": "Adresse et site non trouvés (aucune page consultable dans cette session)."
  },
  {
    "id": "pays-de-la-loire-22",
    "name": "Librairie Aladin",
    "city": "Nantes",
    "address": null,
    "description": "Librairie BD nantaise, citée par Nantes Métropole et désignée par Maison Fumetti comme librairie partenaire.",
    "website": "",
    "type": "librairie-specialisee",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://metropole.nantes.fr/que-faire-a-nantes/librairies-independantes-les-bonnes-adresses-dans-la-metropole-nantaise",
      "https://www.maisonfumetti.fr/category/informations/"
    ],
    "region": "pays-de-la-loire",
    "origine": "ajout-2026",
    "verification_note": "Adresse non vérifiée (site officiel non consultable dans cette session)."
  },
  {
    "id": "pays-de-la-loire-23",
    "name": "Librairie L'Atalante",
    "city": "Nantes",
    "address": null,
    "description": "Librairie spécialisée SF/polar liée aux éditions L'Atalante, citée par Nantes Métropole.",
    "website": "",
    "type": "librairie-specialisee",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://metropole.nantes.fr/que-faire-a-nantes/librairies-independantes-les-bonnes-adresses-dans-la-metropole-nantaise"
    ],
    "region": "pays-de-la-loire",
    "origine": "ajout-2026",
    "verification_note": "Adresse non vérifiée."
  },
  {
    "id": "pays-de-la-loire-24",
    "name": "Librairie Durance",
    "city": "Nantes",
    "address": null,
    "description": "Librairie généraliste indépendante du centre de Nantes, citée par Nantes Métropole.",
    "website": "",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://metropole.nantes.fr/que-faire-a-nantes/librairies-independantes-les-bonnes-adresses-dans-la-metropole-nantaise"
    ],
    "region": "pays-de-la-loire",
    "origine": "ajout-2026",
    "verification_note": "Adresse non vérifiée."
  },
  {
    "id": "pays-de-la-loire-25",
    "name": "Librairie Les Bien-Aimés",
    "city": "Nantes",
    "address": null,
    "description": "Librairie généraliste indépendante nantaise, citée par Nantes Métropole.",
    "website": "",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://metropole.nantes.fr/que-faire-a-nantes/librairies-independantes-les-bonnes-adresses-dans-la-metropole-nantaise"
    ],
    "region": "pays-de-la-loire",
    "origine": "ajout-2026",
    "verification_note": "Adresse non vérifiée."
  },
  {
    "id": "pays-de-la-loire-26",
    "name": "Librairie La Vie Devant Soi",
    "city": "Nantes",
    "address": null,
    "description": "Librairie généraliste indépendante nantaise, citée par Nantes Métropole.",
    "website": "",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://metropole.nantes.fr/que-faire-a-nantes/librairies-independantes-les-bonnes-adresses-dans-la-metropole-nantaise"
    ],
    "region": "pays-de-la-loire",
    "origine": "ajout-2026",
    "verification_note": "Adresse non vérifiée."
  },
  {
    "id": "pays-de-la-loire-27",
    "name": "Librairie du Musée d'arts de Nantes",
    "city": "Nantes",
    "address": null,
    "description": "Librairie de musée citée par Nantes Métropole parmi les librairies de musées de la métropole.",
    "website": "",
    "type": "librairie-centre-art",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://metropole.nantes.fr/que-faire-a-nantes/librairies-independantes-les-bonnes-adresses-dans-la-metropole-nantaise"
    ],
    "region": "pays-de-la-loire",
    "origine": "ajout-2026",
    "verification_note": "Adresse (10 rue Georges Clemenceau selon connaissance générale) et gestionnaire de la librairie non vérifiés sur une page web."
  },
  {
    "id": "centre-val-de-loire-1",
    "name": "CCC OD – Centre de création contemporaine Olivier Debré",
    "city": "Tours",
    "address": "1 parvis Jean Germain, 37000 Tours",
    "description": "Centre d'art contemporain avec une librairie et un café (Mobydick Café). Ouvert du mercredi au dimanche 11h-18h (samedi jusqu'à 19h). Expositions en cours en 2026 (« Sœur de jour » jusqu'au 20/09/2026, « L'idée des corps célestes » du 10/07/2026 au 03/01/2027).",
    "website": "https://cccod.fr/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://cccod.fr/",
      "https://www.placedeslibraires.fr/magasins/tours/CCC-OD-3447/"
    ],
    "region": "centre-val-de-loire",
    "origine": "v1",
    "verification_note": "La librairie est référencée sur placedeslibraires.fr (page inaccessible, 403) ; contenu exact de la librairie (éditions indépendantes, livres d'artiste ?) non vérifié, la page dédiée du site renvoie 404."
  },
  {
    "id": "centre-val-de-loire-2",
    "name": "Groupe Laura",
    "city": "Tours",
    "address": "10 place Choiseul, 37100 Tours",
    "description": "Association (2000) d'édition et d'arts plastiques dirigée par Sammy Engramer : revue LAURA (semestrielle, 1000 ex., diffusée dans centres d'art et écoles d'art), livres d'artiste, multiples, commissariat. Pas de galerie ni de boutique propre : le groupe investit des lieux non dédiés à l'art.",
    "website": "https://groupelaura.fr/",
    "type": "atelier-editeur",
    "status": "doubtful",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://fraap.org/article57.html",
      "https://aaar.fr/annuaire/structure/groupe-laura/",
      "https://devenir.art/structure/groupe-laura/",
      "https://groupelaura.fr/"
    ],
    "region": "centre-val-de-loire",
    "origine": "v1",
    "verification_note": "Aucune actualité datée 2025-2026 trouvée sur le site (dernier numéro référencé : revue Laura 38, sans date). Pas de point de vente : intérêt comme contact réseau/éditeur plutôt que comme lieu de dépôt."
  },
  {
    "id": "centre-val-de-loire-3",
    "name": "Galerie Veyssière Sigma",
    "city": "Tours",
    "address": "25 rue Colbert, 37000 Tours",
    "description": "Galerie commerciale fondée en 2010, spécialisée en estampes japonaises et œuvres modernes/contemporaines (aquarelle, lithographie). Ouverte du mardi au samedi 10h-12h30 / 14h-19h. Site mis à jour en novembre 2025.",
    "website": "https://www.veyssieresigma.com/",
    "type": "galerie-artist-run",
    "status": "active",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://www.veyssieresigma.com/contact/",
      "https://www.pagesjaunes.fr/pros/52730317"
    ],
    "region": "centre-val-de-loire",
    "origine": "v1",
    "verification_note": "Aucune mention de livres ou d'éditions ; hors sujet pour un dépôt de micro-édition.",
    "retired": true
  },
  {
    "id": "centre-val-de-loire-4",
    "name": "Librairie Rosemonde",
    "city": "Tours",
    "address": "1 rue de Jérusalem, 37000 Tours",
    "description": "Librairie indépendante ouverte en février 2023, généraliste (classiques, contemporains, occasion, papeterie) avec une sélection mettant en avant des autrices féministes. Horaires relevés : mar/jeu/ven 11h-12h45 et 14h-19h, mer 14h-19h, sam 11h-19h.",
    "website": "https://librairierosemonde.com",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://wadesworld.fr/librairie-rosemonde/",
      "https://info-tours.fr/culture/2023/02/20/rosemonde-une-nouvelle-librairie-dans-le-centre-ville-de-tours/",
      "https://www.pagesjaunes.fr/pros/61977165"
    ],
    "region": "centre-val-de-loire",
    "origine": "v1",
    "verification_note": "Site officiel non consulté directement (URL vue sur annuaire) ; pas de mention explicite de fanzines/micro-édition."
  },
  {
    "id": "centre-val-de-loire-5",
    "name": "Nanza",
    "city": "Tours",
    "address": "61 rue Blaise Pascal, 37000 Tours",
    "description": "Lieu hybride de 200 m² : exposition d'art contemporain (une vingtaine d'artistes permanents, 6 expositions par an), créations françaises et restaurant-salon de thé. Ouvert du mercredi au samedi 11h-19h.",
    "website": "https://www.nanza.fr/",
    "type": "autre",
    "status": "active",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://www.nanza.fr/",
      "https://www.info-tours.fr/articles/tours/2020/03/11/12728/miam-un-restau-galerie-brocante-presque-cache-rue-blaise-pascal/"
    ],
    "region": "centre-val-de-loire",
    "origine": "v1",
    "verification_note": "Aucune mention de vente de livres ou d'éditions sur le site ; pas de date 2025-2026 visible.",
    "retired": true
  },
  {
    "id": "centre-val-de-loire-6",
    "name": "PoSo – poésie sonore, littérature vivante",
    "city": "Tours",
    "address": "22 rue des Déportés, 37000 Tours",
    "description": "Association (2016) de poésie sonore : ateliers d'écriture, performances, création radiophonique, édition. Siège indiqué 22 rue des Déportés (et non 109 rue de la Fuye, adresse de la galerie Exuo où elle intervient). Pas de lieu de vente.",
    "website": "https://linktr.ee/poso.asso",
    "type": "autre",
    "status": "doubtful",
    "fit": "non",
    "verified_address": false,
    "sources": [
      "https://aaar.fr/annuaire/structure/poso-poesie-sonore-litterature-vivante/"
    ],
    "region": "centre-val-de-loire",
    "origine": "v1",
    "verification_note": "Aucun événement à venir listé sur l'annuaire AAAR ; adresse du brief différente de celle de l'annuaire.",
    "retired": true
  },
  {
    "id": "centre-val-de-loire-7",
    "name": "Galerie Exuo",
    "city": "Tours",
    "address": "109 rue de la Fuye, 37000 Tours",
    "description": "Galerie associative du quartier Velpeau (depuis 2017) : 7 à 9 expositions par an d'artistes émergents, concerts, lectures, performances. Ouverte samedi 15h-19h, dimanche 10h30-13h30, ou sur rendez-vous en semaine. Entrée libre.",
    "website": "https://galerie-exuo.com",
    "type": "galerie-artist-run",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://devenir.art/structure/galerie-exuo/"
    ],
    "region": "centre-val-de-loire",
    "origine": "v1",
    "verification_note": "Point de vente d'éditions non confirmé ; site officiel non consultable dans cette session."
  },
  {
    "id": "centre-val-de-loire-8",
    "name": "Fondation du doute",
    "city": "Blois",
    "address": "14 rue de la Paix, 41000 Blois",
    "description": "Centre d'art autour de Fluxus et de Ben (« Mur des mots »), collections permanentes, expositions temporaires. Horaires 2024 relevés : mercredi-dimanche 14h-18h30, entrée 7,50 €.",
    "website": "https://www.fondationdudoute.fr/",
    "type": "musee",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://devenir.art/structure/la-fondation-du-doute/"
    ],
    "region": "centre-val-de-loire",
    "origine": "v1",
    "verification_note": "Existence d'une boutique-librairie non vérifiée (site officiel inaccessible, timeout) ; horaires vus datés de 2024."
  },
  {
    "id": "centre-val-de-loire-9",
    "name": "Galerie Olivier Rousseau",
    "city": "Tours",
    "address": "48 rue de la Scellerie, 37000 Tours",
    "description": "Galerie d'art rue de la Scellerie (rue des antiquaires et galeries de Tours). Non vérifiée dans cette session.",
    "website": "",
    "type": "galerie-artist-run",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "centre-val-de-loire",
    "origine": "v1",
    "verification_note": "Aucune page consultée (quota de recherche épuisé)."
  },
  {
    "id": "centre-val-de-loire-10",
    "name": "La Boîte à Livres",
    "city": "Tours",
    "address": "19 rue Nationale, 37000 Tours",
    "description": "Grande librairie indépendante généraliste du centre de Tours. Non vérifiée dans cette session.",
    "website": "",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "centre-val-de-loire",
    "origine": "v1",
    "verification_note": "Aucune page consultée (quota de recherche épuisé)."
  },
  {
    "id": "centre-val-de-loire-11",
    "name": "Centre d'art Le Garage",
    "city": "Amboise",
    "address": "1 rue du Général Foy, 37400 Amboise",
    "description": "Centre d'art municipal de 340 m² (3 à 4 expositions par an) dont la programmation inclut des « productions spécifiques, éditions et actions culturelles ». Ouvert pendant les expositions : mer-ven 14h30-18h30, week-end 11h-13h et 14h30-18h30.",
    "website": "https://www.ville-amboise.fr/329/le-garage.htm",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://devenir.art/structure/centre-dart-le-garage/"
    ],
    "region": "centre-val-de-loire",
    "origine": "v1",
    "verification_note": "Point de vente des éditions non confirmé ; programmation 2026 non consultée (site municipal inaccessible dans cette session)."
  },
  {
    "id": "centre-val-de-loire-12",
    "name": "Frac Centre-Val de Loire – Les Turbulences",
    "city": "Orléans",
    "address": "88 rue du Colombier, 45000 Orléans",
    "description": "Frac dédié aux relations art / architecture / design, avec une librairie mentionnée dans « Préparer ma visite ». Ouvert mercredi-dimanche 14h-19h (nocturne jusqu'à 20h le premier jeudi du mois), entrée libre. Exposition « CIRCUS » du 19/09/2026 au 07/03/2027.",
    "website": "https://www.frac-centre.fr/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.frac-centre.fr/",
      "https://devenir.art/structure/fonds-regional-dart-contemporain-centre-val-de-loire/"
    ],
    "region": "centre-val-de-loire",
    "origine": "v1",
    "verification_note": "Page librairie non consultée (quota épuisé) : gestionnaire et fonds de la librairie non vérifiés."
  },
  {
    "id": "centre-val-de-loire-13",
    "name": "Librairie Renée Gailhoustet",
    "city": "Orléans",
    "address": "88 rue du Colombier, 45000 Orléans",
    "description": "Librairie du Frac Centre-Val de Loire (même adresse que le lieu 12). Le site du Frac confirme l'existence d'une librairie, mais pas ce nom.",
    "website": "",
    "type": "librairie-centre-art",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://www.frac-centre.fr/"
    ],
    "region": "centre-val-de-loire",
    "origine": "v1",
    "verification_note": "Nom « Renée Gailhoustet » non vu sur une page web ; doublon probable avec centre-val-de-loire-12 (une seule visite)."
  },
  {
    "id": "centre-val-de-loire-14",
    "field_note": "2026-06-01 : « fauchée :'( mais super librairie enfin je crois. »",
    "name": "Librairie Jaune Citron",
    "city": "Orléans",
    "address": "9 rue des Carmes, 45000 Orléans",
    "description": "Librairie indépendante d'Orléans visitée par Jeanson le 01/06/2026 : « super librairie ». Statut fondé sur la note de terrain.",
    "website": "",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "oui",
    "verified_address": false,
    "sources": [],
    "region": "centre-val-de-loire",
    "origine": "v1",
    "verification_note": "Aucune page web consultée (quota épuisé) ; type et fit déduits de la note de terrain et des pistes du brief, à confirmer."
  },
  {
    "id": "centre-val-de-loire-15",
    "name": "Librairie Les Temps Modernes",
    "city": "Orléans",
    "address": "57 rue Notre-Dame-de-Recouvrance, 45000 Orléans",
    "description": "Librairie indépendante généraliste d'Orléans. Non vérifiée dans cette session.",
    "website": "",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "centre-val-de-loire",
    "origine": "v1",
    "verification_note": "Aucune page consultée."
  },
  {
    "id": "centre-val-de-loire-16",
    "name": "Le 108",
    "city": "Orléans",
    "address": "108 rue de Bourgogne, 45000 Orléans",
    "description": "Lieu associatif partagé rue de Bourgogne (collectifs artistiques). Non vérifié dans cette session.",
    "website": "",
    "type": "autre",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "centre-val-de-loire",
    "origine": "v1",
    "verification_note": "Aucune page consultée ; point de vente inconnu."
  },
  {
    "id": "centre-val-de-loire-17",
    "name": "Le Bol",
    "city": "Orléans",
    "address": "108 rue de Bourgogne, 45000 Orléans",
    "description": "Structure hébergée au 108 (même adresse que le lieu 16). Non vérifiée dans cette session.",
    "website": "",
    "type": "autre",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "centre-val-de-loire",
    "origine": "v1",
    "verification_note": "Aucune page consultée ; probable doublon de visite avec centre-val-de-loire-16."
  },
  {
    "id": "centre-val-de-loire-18",
    "name": "Empreinte Galerie",
    "city": "Orléans",
    "address": "3 rue d'Alibert, 45000 Orléans",
    "description": "Galerie d'Orléans. Non vérifiée dans cette session.",
    "website": "",
    "type": "galerie-artist-run",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "centre-val-de-loire",
    "origine": "v1",
    "verification_note": "Aucune page consultée."
  },
  {
    "id": "centre-val-de-loire-19",
    "name": "Le Garage",
    "city": "Orléans",
    "address": "Rue de Bourgogne, 45000 Orléans",
    "description": "Lieu rue de Bourgogne à Orléans, adresse incomplète dans le brief. Non vérifié dans cette session.",
    "website": "",
    "type": "autre",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "centre-val-de-loire",
    "origine": "v1",
    "verification_note": "Adresse sans numéro ; aucune page consultée. Ne pas confondre avec le centre d'art Le Garage d'Amboise (lieu 11)."
  },
  {
    "id": "centre-val-de-loire-20",
    "name": "Antre Peaux (Transpalette)",
    "city": "Bourges",
    "address": "24-26 route de la Chapelle, 18000 Bourges",
    "description": "Friche culturelle et artistique (ex-Emmetrop / Bandits-Mages) : concerts, expositions, résidences, ateliers, studios de répétition, festivals (Antre Mômes 12-13/09/2026). Expositions ouvertes mercredi-dimanche 15h-19h, entrée libre.",
    "website": "https://antrepeaux.net/",
    "type": "galerie-artist-run",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://antrepeaux.net/",
      "https://antrepeaux.net/antre-peaux/",
      "https://devenir.art/structure/antre-peaux/"
    ],
    "region": "centre-val-de-loire",
    "origine": "v1",
    "verification_note": "Aucune boutique/librairie mentionnée sur le site ni sur devenir.art ; le nom « Transpalette » n'apparaît pas dans les pages consultées. Lieu très actif en 2026, à contacter directement pour un dépôt (bar/accueil)."
  },
  {
    "id": "centre-val-de-loire-21",
    "name": "ENSA Bourges / La Box",
    "city": "Bourges",
    "address": "9 rue Édouard Branly, 18000 Bourges",
    "description": "École nationale supérieure d'art de Bourges, listée sur devenir.art ; galerie La Box. Fiche non consultable (429).",
    "website": "",
    "type": "autre",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://devenir.art/structures/"
    ],
    "region": "centre-val-de-loire",
    "origine": "v1",
    "verification_note": "Adresse et existence d'un point de vente d'éditions non vérifiées."
  },
  {
    "id": "centre-val-de-loire-22",
    "name": "La Transversale",
    "city": "Bourges",
    "address": "Lycée Alain-Fournier, 50 rue Stéphane Mallarmé, 18000 Bourges",
    "description": "Espace d'art contemporain situé dans un lycée : 4 expositions par an, rencontres, formations. Ouvert lundi-vendredi 8h-18h hors vacances scolaires, entrée libre.",
    "website": "https://lycee-alain-fournier.fr/formations/la-transversale",
    "type": "autre",
    "status": "active",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://devenir.art/structure/la-transversale/"
    ],
    "region": "centre-val-de-loire",
    "origine": "v1",
    "verification_note": "Pas de boutique ; lieu scolaire, inadapté au dépôt-vente.",
    "retired": true
  },
  {
    "id": "centre-val-de-loire-23",
    "name": "Galerie Pictura",
    "city": "Bourges",
    "address": "15 rue Littré, 18000 Bourges",
    "description": "Galerie de Bourges. Non vérifiée dans cette session.",
    "website": "",
    "type": "galerie-artist-run",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "centre-val-de-loire",
    "origine": "v1",
    "verification_note": "Aucune page consultée."
  },
  {
    "id": "centre-val-de-loire-24",
    "name": "Librairie Les Pages du Donjon",
    "city": "Bourges",
    "address": "54-56 rue Coursarlon, 18000 Bourges",
    "description": "Librairie de Bourges. Non vérifiée dans cette session.",
    "website": "",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "centre-val-de-loire",
    "origine": "v1",
    "verification_note": "Aucune page consultée."
  },
  {
    "id": "centre-val-de-loire-25",
    "name": "Art Tension (Espace Chen Jang-Hua)",
    "city": "Bourges",
    "address": "5 place Saint-Bonnet, 18000 Bourges",
    "description": "Espace d'exposition de Bourges. Non vérifié dans cette session.",
    "website": "",
    "type": "galerie-artist-run",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "centre-val-de-loire",
    "origine": "v1",
    "verification_note": "Aucune page consultée."
  },
  {
    "id": "centre-val-de-loire-26",
    "name": "Château d'eau – Château d'art",
    "city": "Bourges",
    "address": "Place Séraucourt, 18000 Bourges",
    "description": "Lieu d'exposition municipal de Bourges. Non vérifié dans cette session.",
    "website": "",
    "type": "musee",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "centre-val-de-loire",
    "origine": "v1",
    "verification_note": "Aucune page consultée ; existence d'une boutique inconnue."
  },
  {
    "id": "centre-val-de-loire-27",
    "name": "Éditions HYX",
    "city": "Orléans",
    "address": null,
    "description": "Maison d'édition d'art et d'architecture référencée dans l'annuaire AAAR (domaine « Édition », région Centre), historiquement liée au Frac Centre. Piste réseau pour Orléans.",
    "website": "https://aaar.fr/annuaire/structure/editions-hyx/",
    "type": "atelier-editeur",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://aaar.fr/annuaire/domaine-activite/edition/"
    ],
    "region": "centre-val-de-loire",
    "origine": "ajout-2026",
    "verification_note": "Fiche non consultée ; adresse et existence d'un point de vente inconnues."
  },
  {
    "id": "centre-val-de-loire-28",
    "name": "Oulan Bator",
    "city": "Orléans",
    "address": null,
    "description": "Structure orléanaise listée sur devenir.art (catégorie « Support » / accompagnement des artistes). Piste associative pour le tronçon Orléans.",
    "website": "https://devenir.art/structures/",
    "type": "autre",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://devenir.art/structures/"
    ],
    "region": "centre-val-de-loire",
    "origine": "ajout-2026",
    "verification_note": "Fiche non consultée ; nature exacte et point de vente inconnus."
  },
  {
    "id": "centre-val-de-loire-29",
    "name": "Le Passage – galerie d'art contemporain",
    "city": "Saint-Pierre-des-Corps",
    "address": null,
    "description": "Galerie d'art contemporain de Saint-Pierre-des-Corps (agglomération de Tours), listée sur devenir.art avec AtMo et Bruit contemporain dans la même commune.",
    "website": "https://devenir.art/structures/",
    "type": "galerie-artist-run",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://devenir.art/structures/"
    ],
    "region": "centre-val-de-loire",
    "origine": "ajout-2026",
    "verification_note": "Fiche non consultée ; adresse et point de vente inconnus."
  },
  {
    "id": "centre-val-de-loire-30",
    "name": "atelier-galerie e(co)tone",
    "city": "Vendôme",
    "address": null,
    "description": "Atelier-galerie à Vendôme listé sur devenir.art. Seule structure d'art contemporain repérée à Vendôme, sur la route Le Mans → Orléans.",
    "website": "https://devenir.art/structures/",
    "type": "galerie-artist-run",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://devenir.art/structures/"
    ],
    "region": "centre-val-de-loire",
    "origine": "ajout-2026",
    "verification_note": "Fiche non consultée ; adresse, horaires et point de vente inconnus."
  },
  {
    "id": "centre-val-de-loire-31",
    "name": "Zone i",
    "city": "Thoré-la-Rochette",
    "address": null,
    "description": "Structure classée « Publishing » (édition) sur devenir.art, près de Vendôme (Loir-et-Cher). Piste éditeur/lieu sur l'itinéraire Le Mans → Orléans.",
    "website": "https://devenir.art/structures/",
    "type": "atelier-editeur",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://devenir.art/structures/"
    ],
    "region": "centre-val-de-loire",
    "origine": "ajout-2026",
    "verification_note": "Fiche non consultée ; lieu de vente inconnu."
  },
  {
    "id": "centre-val-de-loire-32",
    "name": "La ritournelle",
    "city": "Châteauroux",
    "address": null,
    "description": "Lieu d'exposition de Châteauroux listé sur devenir.art (catégorie « Exhibition »). Seule structure d'art contemporain non institutionnelle repérée à Châteauroux.",
    "website": "https://devenir.art/structures/",
    "type": "galerie-artist-run",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://devenir.art/structures/"
    ],
    "region": "centre-val-de-loire",
    "origine": "ajout-2026",
    "verification_note": "Fiche non consultée ; hors itinéraire principal (Bourges → Tours passe plus au nord)."
  },
  {
    "id": "centre-val-de-loire-33",
    "name": "Centre d'art contemporain l'ar[T]senal",
    "city": "Dreux",
    "address": null,
    "description": "Centre d'art contemporain de Dreux (Eure-et-Loir) listé sur devenir.art, avec une association d'amis. Hors itinéraire (nord de la région).",
    "website": "https://devenir.art/structures/",
    "type": "librairie-centre-art",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://devenir.art/structures/"
    ],
    "region": "centre-val-de-loire",
    "origine": "ajout-2026",
    "verification_note": "Fiche non consultée ; boutique inconnue."
  },
  {
    "id": "nouvelle-aquitaine-1",
    "name": "Frac Nouvelle-Aquitaine MÉCA",
    "city": "Bordeaux",
    "address": "MÉCA, 5 parvis Corto Maltese, 33000 Bordeaux",
    "description": "Frac installé dans la MÉCA près de la gare Saint-Jean ; boutique dans le hall vendant catalogues d'expositions et éditions. Ouvert du mercredi au dimanche 13h-18h (boutique jusqu'à 17h30) ; espaces d'exposition du 5e étage fermés jusqu'au 8 octobre 2026.",
    "website": "https://fracnouvelleaquitaine-meca.fr/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://fracnouvelleaquitaine-meca.fr/preparer-votre-visite/acces-horaires-tarifs/"
    ],
    "region": "nouvelle-aquitaine",
    "origine": "v1",
    "verification_note": "Le brief indiquait le code postal 33088 (cedex) ; le site officiel donne 33000. Politique de dépôt d'éditions extérieures non documentée."
  },
  {
    "id": "nouvelle-aquitaine-2",
    "name": "Capc musée d'art contemporain de Bordeaux",
    "city": "Bordeaux",
    "address": "7 rue Ferrère, 33000 Bordeaux",
    "description": "Musée d'art contemporain (centre d'art d'intérêt national depuis 2021) dans l'entrepôt Lainé ; page « La boutique » sur le site officiel (capc-bordeaux.fr/boutique) mais contenu non consultable. Ouvert du mardi au dimanche 11h-18h, fermé lundi et jours fériés.",
    "website": "https://www.capc-bordeaux.fr/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.bordeaux.fr/le-capc-musee-dart-contemporain-de-bordeaux",
      "https://www.capc-bordeaux.fr/boutique",
      "https://www.happen.fr/latelier-duplicoclub-de-disparate-au-capc/"
    ],
    "region": "nouvelle-aquitaine",
    "origine": "v1",
    "verification_note": "La fiche bordeaux.fr indique 33300 comme code postal, le brief 33000 ; le site du Capc (robots.txt) n'a pas pu être lu, donc contenu exact de la boutique (livres d'artiste ?) non vérifié. Disparate y a animé un atelier Duplicoclub (2017)."
  },
  {
    "id": "nouvelle-aquitaine-3",
    "name": "La Mauvaise Réputation",
    "city": "Bordeaux",
    "address": "19 rue des Argentiers, 33000 Bordeaux",
    "description": "Librairie indépendante spécialisée art contemporain, philosophie et graphisme, fondée en 2002 par Rodolphe Nicaisse et Franck Piovesan, quartier Saint-Pierre ; fonds mêlant « livres d'artistes, imports » et introuvables, avec espace d'exposition (artistes, graphistes, illustrateurs, photographes). Tél. 05 56 79 73 54, contact@lamauvaisereputation.net. Horaires non trouvés.",
    "website": "https://www.instagram.com/lamauvaisereputationlibrairie/",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://alca-nouvelle-aquitaine.fr/fr/annuaire-des-professionnels/la-mauvaise-reputation",
      "https://asso.librairies-nouvelleaquitaine.com/librairies/librairie-la-mauvaise-reputation/"
    ],
    "region": "nouvelle-aquitaine",
    "origine": "v1",
    "verification_note": "Pas de site web propre trouvé dans les annuaires (seulement Instagram + e-mail). Horaires absents des pages consultées."
  },
  {
    "id": "nouvelle-aquitaine-4",
    "name": "Disparate",
    "city": "Bordeaux",
    "address": "99 rue de Bègles, 33800 Bordeaux",
    "description": "Librairie associative (loi 1901, créée en 2013) dédiée au fanzine, à la micro-édition et aux multiples ; fonctionne en fanzinothèque et dépôt-vente sans commission selon l'article Happen (2017) ; ateliers (Duplicoclub), expositions, organise le Zinefest de Bordeaux. Horaires non trouvés.",
    "website": "http://www.disparate.fr",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://alca-nouvelle-aquitaine.fr/fr/annuaire-des-professionnels/disparate",
      "https://www.happen.fr/latelier-duplicoclub-de-disparate-au-capc/",
      "https://www.bordeaux.fr/associations/disparate",
      "http://zinefest.fr/"
    ],
    "region": "nouvelle-aquitaine",
    "origine": "v1",
    "verification_note": "Adresse 99 rue de Bègles confirmée par l'annuaire ALCA (fiche non datée) ; l'article de 2017 donnait 31 rue Bergeret (ancien local). Le site disparate.fr n'a pas pu être chargé (erreur TLS) : horaires et actualité 2025-2026 non vérifiés."
  },
  {
    "id": "nouvelle-aquitaine-5",
    "name": "Librairie Mollat",
    "city": "Bordeaux",
    "address": "15 rue Vital-Carles, 33080 Bordeaux Cedex",
    "description": "Grande librairie indépendante généraliste ; ouverte du lundi au samedi 10h-20h et le dimanche 14h-19h (jours fériés 11h-19h sauf 1er mai, 25 décembre, 1er janvier). Point click & collect au 91 rue Porte Dijeaux.",
    "website": "https://www.mollat.com/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.mollat.com/acces-horaires",
      "https://ilibrairie.fr/33/bordeaux/"
    ],
    "region": "nouvelle-aquitaine",
    "origine": "v1",
    "verification_note": "Très grosse structure : le dépôt-vente de micro-édition dépend du rayon (art/graphisme) ; non documenté en ligne."
  },
  {
    "id": "nouvelle-aquitaine-6",
    "name": "les arts au mur artothèque",
    "city": "Pessac",
    "address": "Pavillon des Arts et de la Musique (PAM), 6 rue Georges Pompidou, 33600 Pessac",
    "description": "Artothèque (prêt d'œuvres) avec espace d'exposition gratuit, ouverte du mardi au samedi 14h-18h ; adhésions et emprunts sur rendez-vous. Aucune boutique ni vente d'éditions mentionnée sur la page horaires.",
    "website": "https://www.lesartsaumur.com/",
    "type": "autre",
    "status": "active",
    "fit": "non",
    "verified_address": true,
    "sources": [
      "https://www.lesartsaumur.com/nos-horaires/"
    ],
    "region": "nouvelle-aquitaine",
    "origine": "v1",
    "verification_note": "Fit « non » par absence de point de vente documenté ; à reconsidérer si l'artothèque vend des éditions sur place (non vu).",
    "retired": true
  },
  {
    "id": "nouvelle-aquitaine-7",
    "name": "Frac Delta Nouvelle-Aquitaine (ex-Frac Poitou-Charentes), site d'Angoulême",
    "city": "Angoulême",
    "address": "63 boulevard Besson Bey, 16000 Angoulême",
    "description": "Le Frac Poitou-Charentes s'appelle désormais Frac Delta Nouvelle-Aquitaine (direction Irene Aristizábal depuis 2024) ; site web provisoire « en transition » jusqu'au printemps 2027. Ouvert 14h-18h (mercredi-dimanche selon fracdelta.fr ; mardi-samedi + 1er dimanche du mois selon lesfrac.com). Second site à Linazay (86), ouvert seulement pendant les expositions.",
    "website": "https://www.fracdelta.fr/",
    "type": "musee",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.fracdelta.fr/venir-au-frac",
      "https://lesfrac.com/frac/frac-poitou-charentes/",
      "https://fracnouvelleaquitaine-meca.fr/lieu/au-frac-poitou-charentes-site-dangouleme/"
    ],
    "region": "nouvelle-aquitaine",
    "origine": "v1",
    "verification_note": "Aucune librairie/boutique mentionnée sur les pages consultées ; horaires contradictoires entre les deux sources. Fit « possible » uniquement au titre du lieu d'art."
  },
  {
    "id": "nouvelle-aquitaine-8",
    "name": "Librairie Cosmopolite",
    "city": "Angoulême",
    "address": "Galerie du Champ de Mars, 16000 Angoulême",
    "description": "Librairie indépendante généraliste de 1 700 m² (littérature, sciences humaines, BD, jeunesse, papeterie, disques) dans la galerie du Champ de Mars ; ouverte du lundi au samedi 10h-19h. Tél. 05 45 92 16 58.",
    "website": "https://www.librairiecosmopolite.com/",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://www.librairiecosmopolite.com/decouvrir_la_librairie/",
      "https://ilibrairie.fr/16/angouleme/cosmopolite-cw"
    ],
    "region": "nouvelle-aquitaine",
    "origine": "v1",
    "verification_note": "Le site officiel ne donne pas de numéro de rue (seulement « Galerie du Champ de Mars »)."
  },
  {
    "id": "nouvelle-aquitaine-9",
    "name": "La Fanzinothèque",
    "city": "Poitiers",
    "address": "Le Confort Moderne, 185 rue du Faubourg du Pont-Neuf, 86000 Poitiers",
    "description": "« Au service du fanzinat depuis 1989 » au Confort Moderne : fonds documentaire, atelier d'impression, librairie/dépôt-vente d'éditions indépendantes et boutique en ligne (la-fanzino.sumupstore.com). Ouvert mardi-vendredi 12h-18h, samedi 15h-18h ; tél. 05 16 34 53 44. Actualité de septembre 2026 en ligne (ateliers zines, accueil bénévoles).",
    "website": "https://www.fanzino.org/",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "oui",
    "verified_address": true,
    "sources": [
      "https://www.fanzino.org/"
    ],
    "region": "nouvelle-aquitaine",
    "origine": "v1",
    "verification_note": "Rien de douteux."
  },
  {
    "id": "nouvelle-aquitaine-10",
    "name": "Plage 76",
    "city": "Poitiers",
    "address": "76 rue de la Cathédrale, 86000 Poitiers",
    "description": "Lieu non vérifié : le site plage76.fr n'a pas pu être chargé et aucune page tierce n'a été consultée.",
    "website": "",
    "type": "galerie-artist-run",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "nouvelle-aquitaine",
    "origine": "v1",
    "verification_note": "Non vérifié (recherche web indisponible pendant la session)."
  },
  {
    "id": "nouvelle-aquitaine-11",
    "name": "Atelier Bletterie",
    "city": "La Rochelle",
    "address": "Quartier historique, 17000 La Rochelle",
    "description": "Lieu hors tronçon, non vérifié.",
    "website": "",
    "type": "autre",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "nouvelle-aquitaine",
    "origine": "v1",
    "verification_note": "Hors tronçon ; adresse vague conservée ; non vérifié."
  },
  {
    "id": "nouvelle-aquitaine-12",
    "name": "Centre des livres d'artistes (cdla)",
    "city": "Saint-Yrieix-la-Perche",
    "address": "1 place Attane, 87500 Saint-Yrieix-la-Perche",
    "description": "Centre dédié aux expositions, publications et à la collection de livres d'artistes ; exposition « PAYSAGES première partie » du 17 juillet au 3 octobre 2026, rubrique « Publications cdla » sur le site. Pages « Heures d'ouverture » et « Contacts » existent mais n'ont pas pu être lues (limite de requêtes).",
    "website": "https://cdla.info/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "oui",
    "verified_address": false,
    "sources": [
      "https://cdla.info/",
      "https://cdla.info/category/heures-douverture/",
      "https://cdla.info/category/contacts/"
    ],
    "region": "nouvelle-aquitaine",
    "origine": "v1",
    "verification_note": "Réintégré dans le tronçon (à 40 km au sud de Limoges). Adresse du brief conservée, non confirmée sur le site ; horaires non lus. Lieu le plus pertinent de la région pour le livre d'artiste."
  },
  {
    "id": "nouvelle-aquitaine-13",
    "name": "Frac-Artothèque Nouvelle-Aquitaine",
    "city": "Limoges",
    "address": "17 bis rue Charles Michels, 87000 Limoges",
    "description": "Fusion unique en France d'un Frac et d'une artothèque ; le site mentionne un café-librairie, un espace immersif, des visites et ateliers. Tél. 05 55 52 03 03. Horaires non trouvés sur la page d'accueil.",
    "website": "https://www.fracartothequenouvelleaquitaine.fr/",
    "type": "librairie-centre-art",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.fracartothequenouvelleaquitaine.fr/"
    ],
    "region": "nouvelle-aquitaine",
    "origine": "v1",
    "verification_note": "Contenu du café-librairie (éditions en vente ?) et horaires non vérifiés ; page « informations pratiques » introuvable (404)."
  },
  {
    "id": "nouvelle-aquitaine-14",
    "name": "Lavitrine – LAC&S",
    "city": "Limoges",
    "address": "4 rue Raspail, 87000 Limoges",
    "description": "Galerie associative d'art contemporain (LAC&S), entrée libre, ouverte du mercredi au samedi 14h30-18h30 et sur rendez-vous ; programme 2026 de quatre expositions dont « Laboratoire Recto/Verso vol.1 » (12 septembre-14 novembre 2026). Tél. 05 55 77 36 26.",
    "website": "https://www.lavitrine-lacs.org/",
    "type": "galerie-artist-run",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://www.lavitrine-lacs.org/"
    ],
    "region": "nouvelle-aquitaine",
    "origine": "v1",
    "verification_note": "Aucune vente d'éditions mentionnée ; fit « possible » au titre du lieu d'art."
  },
  {
    "id": "nouvelle-aquitaine-15",
    "name": "Page et Plume",
    "city": "Limoges",
    "address": "4 place de la Motte, 87000 Limoges",
    "description": "Librairie indépendante référencée sur ilibrairie.fr à cette adresse (spécialité BD signalée par l'annuaire). Fiche détaillée en erreur 404, horaires et site non trouvés.",
    "website": "",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/87/limoges/"
    ],
    "region": "nouvelle-aquitaine",
    "origine": "v1",
    "verification_note": "Seule la ligne d'annuaire a été vue ; site officiel et horaires non vérifiés."
  },
  {
    "id": "nouvelle-aquitaine-16",
    "name": "Le Bel Ordinaire",
    "city": "Billère",
    "address": "Les Abattoirs, allée Montesquieu, 64140 Billère",
    "description": "Espace d'art contemporain de l'agglomération de Pau ; le site belordinaire.agglo-pau.fr n'a pas pu être résolu pendant la session.",
    "website": "",
    "type": "librairie-centre-art",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "nouvelle-aquitaine",
    "origine": "v1",
    "verification_note": "Non vérifié (site inaccessible, recherche web indisponible)."
  },
  {
    "id": "nouvelle-aquitaine-17",
    "name": "Villa Beatrix Enea",
    "city": "Anglet",
    "address": "2 rue Albert-le-Barillier, 64600 Anglet",
    "description": "Centre d'art municipal d'Anglet ; non vérifié.",
    "website": "",
    "type": "musee",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "nouvelle-aquitaine",
    "origine": "v1",
    "verification_note": "Non vérifié ; présence d'une boutique inconnue."
  },
  {
    "id": "nouvelle-aquitaine-18",
    "name": "Librairie Hirigoyen",
    "city": "Bayonne",
    "address": "Bayonne, Pyrénées-Atlantiques",
    "description": "Absente de la liste des 13 librairies de Bayonne recensées par ilibrairie.fr (Alinéa, Banc Dessiné, Darrieumerlou, Rue en Pente, Levant, Chez Simone, Jakin, Koegui, Esprit du Large…).",
    "website": "",
    "type": "librairie-generaliste",
    "status": "doubtful",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://ilibrairie.fr/64/bayonne/"
    ],
    "region": "nouvelle-aquitaine",
    "origine": "v1",
    "verification_note": "Aucune trace dans l'annuaire consulté : à confirmer sur place ou par téléphone (possible fermeture ou changement de nom)."
  },
  {
    "id": "nouvelle-aquitaine-19",
    "name": "Bookstore BD & Jeunesse",
    "city": "Biarritz",
    "address": "13 rue Poste, 64200 Biarritz",
    "description": "Non vérifié.",
    "website": "",
    "type": "librairie-specialisee",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "nouvelle-aquitaine",
    "origine": "v1",
    "verification_note": "Non vérifié (recherche web indisponible)."
  },
  {
    "id": "nouvelle-aquitaine-20",
    "name": "Le Second Jeudi (Station V)",
    "city": "Bayonne",
    "address": "Bayonne, Pyrénées-Atlantiques",
    "description": "Non vérifié.",
    "website": "",
    "type": "autre",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "nouvelle-aquitaine",
    "origine": "v1",
    "verification_note": "Adresse vague conservée ; non vérifié."
  },
  {
    "id": "nouvelle-aquitaine-21",
    "name": "Musée d'art contemporain de la Haute-Vienne – Château de Rochechouart",
    "city": "Rochechouart",
    "address": "Château de Rochechouart, 87600 Rochechouart",
    "description": "Non vérifié.",
    "website": "",
    "type": "musee",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "nouvelle-aquitaine",
    "origine": "v1",
    "verification_note": "Nom officiel et existence d'une librairie-boutique non vérifiés."
  },
  {
    "id": "nouvelle-aquitaine-22",
    "name": "Musée du pays d'Ussel",
    "city": "Ussel",
    "address": "Ussel, Corrèze",
    "description": "Musée hors tronçon, non vérifié ; aucune boutique-librairie d'art connue.",
    "website": "",
    "type": "musee",
    "status": "unverified",
    "fit": "non",
    "verified_address": false,
    "sources": [],
    "region": "nouvelle-aquitaine",
    "origine": "v1",
    "verification_note": "Exclu de la tournée : hors tronçon et hors sujet a priori (musée de pays).",
    "retired": true
  },
  {
    "id": "nouvelle-aquitaine-23",
    "name": "Centre d'art contemporain de Meymac – Abbaye Saint-André",
    "city": "Meymac",
    "address": "Place de l'Église, 19250 Meymac",
    "description": "Non vérifié.",
    "website": "",
    "type": "musee",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "nouvelle-aquitaine",
    "origine": "v1",
    "verification_note": "Présence d'une boutique-librairie non vérifiée."
  },
  {
    "id": "nouvelle-aquitaine-24",
    "name": "Librairie Vivre d'Art",
    "city": "Meymac",
    "address": "4 rue du Four, 19250 Meymac",
    "description": "Non vérifié.",
    "website": "",
    "type": "librairie-generaliste",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "nouvelle-aquitaine",
    "origine": "v1",
    "verification_note": "Non vérifié."
  },
  {
    "id": "nouvelle-aquitaine-25",
    "name": "Librairie Aux Bavardages",
    "city": "Poitiers",
    "address": "Poitiers, Vienne",
    "description": "Absente des 9 librairies de Poitiers recensées par ilibrairie.fr (Aladin, Bulles d'Encre, Gibert Joseph, La Belle Aventure, Librairie de la Belette, Ludibrairie, Procure, PJFB, Bruno Remay).",
    "website": "",
    "type": "librairie-generaliste",
    "status": "doubtful",
    "fit": "possible",
    "verified_address": false,
    "sources": [
      "https://ilibrairie.fr/86/poitiers/"
    ],
    "region": "nouvelle-aquitaine",
    "origine": "v1",
    "verification_note": "Aucune trace dans l'annuaire consulté ; à confirmer."
  },
  {
    "id": "nouvelle-aquitaine-26",
    "name": "Rêv'en pages",
    "city": "Limoges",
    "address": "16 rue Othon Péconnet, 87000 Limoges",
    "description": "Librairie jeunesse indépendante ; ouverte mardi-vendredi 9h30-13h / 14h-19h et samedi 10h-13h / 14h-19h.",
    "website": "http://www.revenpages.fr",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/87/limoges/rev-en-pages-2p9"
    ],
    "region": "nouvelle-aquitaine",
    "origine": "v1",
    "verification_note": "Spécialisée jeunesse : pertinence limitée pour le livre d'artiste."
  },
  {
    "id": "nouvelle-aquitaine-27",
    "name": "Le Bibliovore",
    "city": "Limoges",
    "address": "8 rue Fourie, 87000 Limoges",
    "description": "Librairie de livres d'occasion ; ouverte du lundi au samedi 10h-13h / 15h-19h.",
    "website": "http://www.lebibliovore.fr",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/87/limoges/bibliovore-8or"
    ],
    "region": "nouvelle-aquitaine",
    "origine": "v1",
    "verification_note": "Occasion : le dépôt-vente de neuf n'est pas documenté."
  },
  {
    "id": "nouvelle-aquitaine-28",
    "name": "Librairie Galerie Chez Simone",
    "city": "Bayonne",
    "address": "12 boulevard Alsace-Lorraine, 64100 Bayonne",
    "description": "Librairie-galerie du quartier Saint-Esprit ; ouverte mardi-vendredi 10h-12h30 / 14h-19h et samedi 10h-12h30.",
    "website": "http://librairiechezsimone.fr",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/64/bayonne/librairie-galerie-chez-simone-8cz"
    ],
    "region": "nouvelle-aquitaine",
    "origine": "v1",
    "verification_note": "Site officiel non lu : ligne éditoriale (art ? éditions ?) non vérifiée, d'où « possible » plutôt que « oui »."
  },
  {
    "id": "nouvelle-aquitaine-29",
    "name": "Le 5e Art",
    "city": "Saint-Jean-de-Luz",
    "address": "Saint-Jean-de-Luz, Pyrénées-Atlantiques",
    "description": "Non vérifié (le brief le situait aussi à Bayonne dans les pistes).",
    "website": "",
    "type": "librairie-specialisee",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "nouvelle-aquitaine",
    "origine": "v1",
    "verification_note": "Ville incertaine (Bayonne ou Saint-Jean-de-Luz) ; non vérifié."
  },
  {
    "id": "nouvelle-aquitaine-30",
    "name": "Chabram2",
    "city": "Bellevigne",
    "address": "Bellevigne, Charente",
    "description": "Non vérifié.",
    "website": "",
    "type": "autre",
    "status": "unverified",
    "fit": "possible",
    "verified_address": false,
    "sources": [],
    "region": "nouvelle-aquitaine",
    "origine": "v1",
    "verification_note": "Non vérifié."
  },
  {
    "id": "nouvelle-aquitaine-31",
    "name": "La Belle Aventure",
    "city": "Poitiers",
    "address": "5 rue des Grandes Écoles, 86000 Poitiers",
    "description": "Librairie indépendante généraliste du centre de Poitiers ; ouverte du mardi au samedi 10h-19h.",
    "website": "http://labelleaventure.fr",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/86/poitiers/la-belle-aventuire-2oh"
    ],
    "region": "nouvelle-aquitaine",
    "origine": "ajout-2026",
    "verification_note": "L'annuaire l'orthographie « Aventuire » (coquille) ; site officiel non lu."
  },
  {
    "id": "nouvelle-aquitaine-32",
    "name": "Bulles d'Encre",
    "city": "Poitiers",
    "address": "63 rue de la Cathédrale, 86000 Poitiers",
    "description": "Librairie BD située dans la même rue que Plage 76 (n°76).",
    "website": "",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/86/poitiers/"
    ],
    "region": "nouvelle-aquitaine",
    "origine": "ajout-2026",
    "verification_note": "Ligne d'annuaire seulement ; horaires et site non vérifiés."
  },
  {
    "id": "nouvelle-aquitaine-33",
    "name": "La Machine à Lire",
    "city": "Bordeaux",
    "address": "8 place du Parlement, 33000 Bordeaux",
    "description": "Librairie indépendante généraliste du quartier Saint-Pierre, à 200 m de La Mauvaise Réputation (468 avis, 4,5/5 sur ilibrairie).",
    "website": "",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/33/bordeaux/"
    ],
    "region": "nouvelle-aquitaine",
    "origine": "ajout-2026",
    "verification_note": "Ligne d'annuaire seulement ; horaires et site non vérifiés."
  },
  {
    "id": "nouvelle-aquitaine-34",
    "name": "Lilosimages",
    "city": "Angoulême",
    "address": "27 rue de la Cloche Verte, 16000 Angoulême",
    "description": "Librairie indépendante référencée à Angoulême (ville de la BD).",
    "website": "",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/16/angouleme/lilosimages-5h1"
    ],
    "region": "nouvelle-aquitaine",
    "origine": "ajout-2026",
    "verification_note": "Ligne d'annuaire seulement ; spécialité (image/BD ?) et horaires non vérifiés."
  },
  {
    "id": "nouvelle-aquitaine-35",
    "name": "Librairie Anecdotes",
    "city": "Limoges",
    "address": "19 rue du Consulat, 87000 Limoges",
    "description": "Librairie indépendante du centre de Limoges (référencée deux fois sur ilibrairie, « Anecdotes » et « Librairie Anecdote », même adresse).",
    "website": "",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/87/limoges/"
    ],
    "region": "nouvelle-aquitaine",
    "origine": "ajout-2026",
    "verification_note": "Ligne d'annuaire seulement."
  },
  {
    "id": "nouvelle-aquitaine-36",
    "name": "BD Rêve",
    "city": "Limoges",
    "address": "19 rue du Temple, 87000 Limoges",
    "description": "Librairie BD indépendante.",
    "website": "",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/87/limoges/"
    ],
    "region": "nouvelle-aquitaine",
    "origine": "ajout-2026",
    "verification_note": "Ligne d'annuaire seulement."
  },
  {
    "id": "nouvelle-aquitaine-37",
    "name": "Bulles 2 papier",
    "city": "Limoges",
    "address": "17 rue Adrien Dubouché, 87000 Limoges",
    "description": "Librairie BD indépendante.",
    "website": "",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/87/limoges/"
    ],
    "region": "nouvelle-aquitaine",
    "origine": "ajout-2026",
    "verification_note": "Ligne d'annuaire seulement."
  },
  {
    "id": "nouvelle-aquitaine-38",
    "name": "Boukie's Bookshop",
    "city": "Périgueux",
    "address": "32 rue Taillefer, 24000 Périgueux",
    "description": "Librairie indépendante de Périgueux, seule référencée sur ilibrairie pour la ville.",
    "website": "",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/24/perigueux/boukie-s-bookshop-8sj"
    ],
    "region": "nouvelle-aquitaine",
    "origine": "ajout-2026",
    "verification_note": "Ligne d'annuaire seulement ; la piste « Des Livres et Nous » n'a pas pu être vérifiée."
  },
  {
    "id": "nouvelle-aquitaine-39",
    "name": "Le Banc Dessiné",
    "city": "Bayonne",
    "address": "6 rue du Pilori, 64100 Bayonne",
    "description": "Librairie BD du Petit Bayonne.",
    "website": "",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/64/bayonne/le-banc-dessine-7cq"
    ],
    "region": "nouvelle-aquitaine",
    "origine": "ajout-2026",
    "verification_note": "Ligne d'annuaire seulement."
  },
  {
    "id": "nouvelle-aquitaine-40",
    "name": "Librairie Darrieumerlou",
    "city": "Bayonne",
    "address": "2 place du Réduit, 64100 Bayonne",
    "description": "Librairie indépendante du centre de Bayonne.",
    "website": "",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/64/bayonne/librairie-darrieumerlou-1jq"
    ],
    "region": "nouvelle-aquitaine",
    "origine": "ajout-2026",
    "verification_note": "Ligne d'annuaire seulement."
  },
  {
    "id": "nouvelle-aquitaine-41",
    "name": "Librairie Koegui",
    "city": "Bayonne",
    "address": "21 rue Vieille Boucherie, 64100 Bayonne",
    "description": "Librairie indépendante du Grand Bayonne.",
    "website": "",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/64/bayonne/librairie-koegui-4xd"
    ],
    "region": "nouvelle-aquitaine",
    "origine": "ajout-2026",
    "verification_note": "Ligne d'annuaire seulement."
  },
  {
    "id": "nouvelle-aquitaine-42",
    "name": "L'Alinéa Librairie",
    "city": "Bayonne",
    "address": "20 rue d'Espagne, 64100 Bayonne",
    "description": "Librairie indépendante du Grand Bayonne.",
    "website": "",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/64/bayonne/l-alinea-librairie-1kb"
    ],
    "region": "nouvelle-aquitaine",
    "origine": "ajout-2026",
    "verification_note": "Ligne d'annuaire seulement."
  },
  {
    "id": "nouvelle-aquitaine-43",
    "name": "Librairie de la Rue en Pente",
    "city": "Bayonne",
    "address": "29 rue Poissonnerie, 64100 Bayonne",
    "description": "Librairie indépendante du Grand Bayonne.",
    "website": "",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/64/bayonne/librairie-de-la-rue-en-pente-1km"
    ],
    "region": "nouvelle-aquitaine",
    "origine": "ajout-2026",
    "verification_note": "Ligne d'annuaire seulement."
  },
  {
    "id": "nouvelle-aquitaine-44",
    "name": "Librairie L'Escampette",
    "city": "Pau",
    "address": "19 rue des Cordeliers, 64000 Pau",
    "description": "Librairie indépendante du centre de Pau (piste du brief confirmée dans l'annuaire).",
    "website": "",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/64/pau/librairie-l-escampette-8b2"
    ],
    "region": "nouvelle-aquitaine",
    "origine": "ajout-2026",
    "verification_note": "Ligne d'annuaire seulement."
  },
  {
    "id": "nouvelle-aquitaine-45",
    "name": "Librairie Tonnet",
    "city": "Pau",
    "address": "3 bis place Marguerite Laborde, 64000 Pau",
    "description": "Librairie indépendante de Pau (piste du brief confirmée dans l'annuaire).",
    "website": "",
    "type": "librairie-generaliste",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/64/pau/librairie-tonnet-1jk"
    ],
    "region": "nouvelle-aquitaine",
    "origine": "ajout-2026",
    "verification_note": "Ligne d'annuaire seulement."
  },
  {
    "id": "nouvelle-aquitaine-46",
    "name": "Bachi-Bouzouk !",
    "city": "Pau",
    "address": "11 rue Latapie, 64000 Pau",
    "description": "Librairie indépendante de Pau référencée sur ilibrairie (nom évoquant la BD).",
    "website": "",
    "type": "librairie-specialisee",
    "status": "active",
    "fit": "possible",
    "verified_address": true,
    "sources": [
      "https://ilibrairie.fr/64/pau/bachi-bouzouk-1k1"
    ],
    "region": "nouvelle-aquitaine",
    "origine": "ajout-2026",
    "verification_note": "Ligne d'annuaire seulement ; spécialité non confirmée."
  }
];
