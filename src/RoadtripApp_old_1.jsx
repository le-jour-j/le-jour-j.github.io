import { useState, useEffect, useCallback, useMemo } from "react";

// ─── GOOGLE MAPS API KEY ──────────────────────────────────────────────────────
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// ─── RAW DATA ────────────────────────────────────────────────────────────────
const RAW_LOCATIONS = [{"id": "auvergne-rhone-alpes-1", "name": "Librairie Lame", "city": "Saint-Denis", "address": "44 rue Auguste Poullain, 93200 Saint-Denis", "description": "Librairie spécialisée dans la micro-édition, les fanzines, le livre d'artiste, le graphzine et le design contemporain. Lieu central de la culture éditoriale indépendante à Lyon.", "visited": false}, {"id": "auvergne-rhone-alpes-2", "name": "Le Bal des Ardents", "city": "Lyon", "address": "17 rue Neuve, 69001 Lyon", "description": "Librairie indépendante emblématique défendant l’édition indépendante, la poésie, l’art, le graphisme et la littérature exigeante.", "visited": false}, {"id": "auvergne-rhone-alpes-3", "name": "Librairie Archipel", "city": "Lyon", "address": "21 place des Terreaux, 69001 Lyon", "description": "Librairie indépendante située face au Musée des Beaux-Arts de Lyon, proposant notamment des ouvrages d’art et de littérature exigeante.", "visited": false}, {"id": "auvergne-rhone-alpes-4", "name": "Capsule Bikini", "city": "Lyon", "address": "15 bis rue de la Thibaudière, 69007 Lyon", "description": "Artist-run space et micro-galerie dédiée à l’avant-garde artistique et aux multiples d’artistes contemporains.", "visited": false}, {"id": "auvergne-rhone-alpes-5", "name": "Réfectoire des nonnes (ENSBA Lyon)", "city": "Lyon", "address": "10 rue Neyret, 69001 Lyon", "description": "Galerie d’exposition de l’École nationale supérieure des beaux-arts de Lyon, laboratoire de recherche artistique et lieu de diffusion de micro-éditions étudiantes.", "visited": false}, {"id": "auvergne-rhone-alpes-6", "name": "Institut d’Art Contemporain (IAC)", "city": "Villeurbanne", "address": "11 rue Docteur Dolard, 69100 Villeurbanne", "description": "Centre d’art contemporain majeur disposant d’une librairie spécialisée et d’un espace de consultation documentaire.", "visited": false}, {"id": "auvergne-rhone-alpes-7", "name": "URDLA – Centre international de l’estampe et du livre", "city": "Villeurbanne", "address": "207 rue Francis-de-Pressensé, 69100 Villeurbanne", "description": "Institution dédiée aux pratiques d’impression traditionnelle, combinant atelier d’estampe, galerie et diffusion d’éditions artistiques.", "visited": false}, {"id": "auvergne-rhone-alpes-8", "name": "Musée d’Art Contemporain de Lyon – Boutique", "city": "Lyon", "address": "Cité Internationale, 81 quai Charles de Gaulle, 69006 Lyon", "description": "Boutique du MAC Lyon proposant catalogues, essais et ouvrages liés aux expositions et à l’art contemporain.", "visited": false}, {"id": "auvergne-rhone-alpes-9", "name": "Grrrnd Zero", "city": "Vaulx-en-Velin", "address": "56-60 avenue de Böhlen, 69120 Vaulx-en-Velin", "description": "Tiers-lieu alternatif DIY accueillant concerts, événements et salons de micro-édition autour de la culture punk et fanzine.", "visited": false}, {"id": "auvergne-rhone-alpes-10", "name": "MJC Monplaisir", "city": "Lyon", "address": "25 avenue des Frères Lumière, 69008 Lyon", "description": "Maison des jeunes et de la culture accueillant notamment des salons importants de micro-édition comme le Grand Salon de la Micro-Edition.", "visited": false}, {"id": "auvergne-rhone-alpes-11", "name": "Cité du Design – Librairie (La Platine)", "city": "Saint-Étienne", "address": "14 rue Marius Patinaud, 42000 Saint-Étienne", "description": "Librairie-boutique institutionnelle dédiée au design contemporain, à l’architecture et aux explorations graphiques.", "visited": false}, {"id": "auvergne-rhone-alpes-12", "name": "MAMC+ – Librairie-boutique", "city": "Saint-Étienne", "address": "Rue Fernand Léger, 42270 Saint-Priest-en-Jarez", "description": "Librairie du Musée d’Art Moderne et Contemporain de Saint-Étienne Métropole spécialisée en art moderne, contemporain et design.", "visited": false}, {"id": "auvergne-rhone-alpes-13", "name": "Bibliothèque Jean Laude (MAMC+)", "city": "Saint-Étienne", "address": "Rue Fernand Léger, 42270 Saint-Priest-en-Jarez", "description": "Centre de ressources du MAMC+ consacré à la recherche en art contemporain et aux catalogues d’exposition.", "visited": false}, {"id": "auvergne-rhone-alpes-14", "name": "Estampille", "city": "Saint-Étienne", "address": "2-8 Arcades de l’Hôtel de Ville, 42000 Saint-Étienne", "description": "Atelier d’estampe et de sérigraphie fonctionnant également comme maison d’édition indépendante.", "visited": false}, {"id": "auvergne-rhone-alpes-15", "name": "Librairie Forum", "city": "Saint-Étienne", "address": "5 rue Michel Rondet, 42000 Saint-Étienne", "description": "Grande librairie indépendante historique disposant d’un important rayon beaux-arts.", "visited": false}, {"id": "auvergne-rhone-alpes-16", "name": "Le Magasin des Horizons", "city": "Grenoble", "address": "8 esplanade Andry Farcy, 38000 Grenoble", "description": "Centre national d’art contemporain installé dans une halle industrielle et disposant d’une librairie spécialisée.", "visited": false}, {"id": "auvergne-rhone-alpes-17", "name": "Librairie Les Modernes", "city": "Grenoble", "address": "6 rue Lakanal, 38000 Grenoble", "description": "Librairie indépendante organisatrice du Saloon de la petite édition et engagée dans la diffusion de fanzines et micro-éditions.", "visited": false}, {"id": "auvergne-rhone-alpes-18", "name": "Boutique du Musée de Grenoble", "city": "Grenoble", "address": "5 place de Lavalette, 38000 Grenoble", "description": "Boutique muséale proposant catalogues d’exposition et ouvrages d’art moderne et contemporain.", "visited": false}, {"id": "auvergne-rhone-alpes-19", "name": "Gibert Joseph Grenoble", "city": "Grenoble", "address": "4 rue Béranger, 38000 Grenoble", "description": "Grande librairie généraliste disposant d’un rayon art et permettant une diffusion à large public.", "visited": false}, {"id": "auvergne-rhone-alpes-20", "name": "Librairie Arthaud", "city": "Grenoble", "address": "23 Grande Rue, 38000 Grenoble", "description": "Librairie indépendante historique de grande taille avec un rayon beaux-arts conséquent.", "visited": false}, {"id": "auvergne-rhone-alpes-21", "name": "Librairie Le Square", "city": "Grenoble", "address": "2 Place du Docteur Léon Martin, 38000 Grenoble", "description": "Grande librairie grenobloise proposant un rayon art important et fréquenté par un public large.", "visited": false}, {"id": "auvergne-rhone-alpes-22", "name": "FRAC Auvergne", "city": "Clermont-Ferrand", "address": "6 rue du Terrail, 63000 Clermont-Ferrand", "description": "Fonds régional d’art contemporain avec collection majeure et diffusion d’éditions d’artistes.", "visited": false}, {"id": "auvergne-rhone-alpes-23", "name": "Centre photographique Hôtel Fontfreyde", "city": "Clermont-Ferrand", "address": "34 rue des Gras, 63000 Clermont-Ferrand", "description": "Centre d’exposition dédié à la photographie contemporaine pouvant accueillir des livres photo.", "visited": false}, {"id": "auvergne-rhone-alpes-24", "name": "Les éditions de la dernière chance", "city": "Lyon", "address": "21 rue Montesquieu, 69007 Lyon", "description": "Structure locale de micro-édition spécialisée dans les fanzines et l’édition alternative.", "visited": false}, {"id": "auvergne-rhone-alpes-25", "name": "Librairie Les Volcans", "city": "Clermont-Ferrand", "address": "80 boulevard François Mitterrand, 63000 Clermont-Ferrand", "description": "Grande librairie coopérative emblématique de Clermont-Ferrand avec un important rayon arts et sciences humaines.", "visited": false}, {"id": "auvergne-rhone-alpes-26", "name": "Centre Culturel Le Bief", "city": "Ambert", "address": "23 rue des Chazeaux, 63600 Ambert", "description": "Centre d’art et résidence d’artistes dédié aux pratiques de l’estampe, du papier et de l’édition artisanale.", "visited": false}, {"id": "corse-1", "name": "FRAC Corsica", "city": "Corte", "address": "La Citadelle, 20250 Corti", "description": "Fonds Régional d'Art Contemporain de Corse situé dans la citadelle de Corte, institution centrale de la création contemporaine insulaire, orientée vers photographie, vidéo et pratiques expérimentales.", "visited": false}, {"id": "corse-2", "name": "Musée de la Corse", "city": "Corte", "address": "Citadelle de Corte", "description": "Musée d’anthropologie régionale majeur disposant d’une boutique éditoriale structurée diffusant ouvrages d’art, catalogues et publications sur la Méditerranée et la société corse.", "visited": false}, {"id": "corse-3", "name": "Palais Fesch - Musée des Beaux-Arts", "city": "Ajaccio", "address": "50-52 Rue Cardinal Fesch, 20000 Ajaccio", "description": "Grand musée ajaccien célèbre pour sa collection de peintures italiennes et son fonds napoléonien, avec une boutique ouverte aux publications artistiques et photographiques contemporaines.", "visited": false}, {"id": "corse-4", "name": "Musée de Bastia", "city": "Bastia", "address": "Palais des Gouverneurs, Citadelle, 20200 Bastia", "description": "Musée consacré à l’histoire urbaine et sociale de Bastia, accueillant régulièrement des expositions contemporaines en lien avec la photographie et les arts visuels.", "visited": false}, {"id": "corse-5", "name": "Musée Départemental de Préhistoire et d'Archéologie de Sartène", "city": "Sartène", "address": "Rue Croce, 20100 Sartène", "description": "Musée archéologique départemental attirant un public cultivé et spécialisé, disposant d’une boutique culturelle.", "visited": false}, {"id": "corse-6", "name": "MUDACC - Musée des Arts de la Citadelle de Calvi", "city": "Calvi", "address": "Citadelle de Calvi, 20260 Calvi", "description": "Musée d’art contemporain et d’expositions estivales en Balagne, associé notamment au festival Calvi Art et fréquenté par une clientèle touristique aisée.", "visited": false}, {"id": "corse-7", "name": "Galerie Noir et Blanc", "city": "Bastia", "address": "Place du Marché, 20200 Bastia", "description": "Galerie associative exigeante dirigée par l’association Festivale di U MercARTu, promouvant plus de cent artistes et organisant plusieurs festivals d’art contemporain.", "visited": false}, {"id": "corse-8", "name": "Art Gallery Porto Vecchio", "city": "Porto-Vecchio", "address": "18 Rue Camille de Rocca Serra, 20137 Porto-Vecchio", "description": "Galerie haut de gamme orientée vers une clientèle internationale et de collectionneurs, spécialisée dans l’art contemporain, pop art et street art.", "visited": false}, {"id": "corse-9", "name": "Galerie Du Levant", "city": "Porto-Vecchio", "address": "17 Rue Général de Gaulle, 20137 Porto-Vecchio", "description": "Galerie présentant peintures, sculptures et photographies contemporaines pour collectionneurs et amateurs d’art décoratif haut de gamme.", "visited": false}, {"id": "corse-10", "name": "De Renava Biennale d'Art Contemporain", "city": "Bonifacio", "address": "Caserne Montlaur, Haute Ville de Bonifacio", "description": "Biennale d’art contemporain expérimentale investissant des sites patrimoniaux de Bonifacio et disposant d’une boutique événementielle.", "visited": false}, {"id": "corse-11", "name": "Galerie Archipel", "city": "Ajaccio", "address": "Citadelle Miollis, Boulevard Fred Scamaroni, 20000 Ajaccio", "description": "Galerie d’art promouvant artistes émergents de la sphère méditerranéenne avec des expositions personnelles régulières.", "visited": false}, {"id": "corse-12", "name": "L'Étrange Atelier", "city": "Ajaccio", "address": "Rue Montenotte, Tour Napoléon, 20000 Ajaccio", "description": "Espace artistique atypique ouvert aux formes singulières et expérimentales incluant objets éditoriaux et créations hybrides.", "visited": false}, {"id": "corse-13", "name": "Espace Farel Créations", "city": "Ajaccio", "address": "1 Rue Barrière, 20000 Ajaccio", "description": "Galerie orientée vers l’art contemporain accessible et les pièces artistiques destinées à la décoration et au cadeau culturel.", "visited": false}, {"id": "corse-14", "name": "Librairie La Marge", "city": "Ajaccio", "address": "4 Rue Emmanuel Arène, 20000 Ajaccio", "description": "Librairie indépendante labellisée LiR, institution culturelle ajaccienne réputée pour ses rayons beaux-livres, art et littérature exigeante.", "visited": false}, {"id": "corse-15", "name": "Librairie des Palmiers - Libraria di I Palmi", "city": "Ajaccio", "address": "2 Place Foch, 20000 Ajaccio", "description": "Librairie historique fondée en 1909 au cœur d’Ajaccio, bénéficiant d’un fort passage touristique et local.", "visited": false}, {"id": "corse-16", "name": "Alma Librairie", "city": "Bastia", "address": "27 Boulevard Paoli, 20200 Bastia", "description": "Grande librairie bastiaise avec un fonds important et des spécialistes par domaine, particulièrement reconnue pour ses rayons BD et livres d’art.", "visited": false}, {"id": "corse-17", "name": "Librairie Les Deux Mondes", "city": "Bastia", "address": "10 Rue Napoléon / 8 Boulevard Paoli, 20200 Bastia", "description": "Librairie historique du centre-ville bastiais proposant un fonds généraliste solide et des ouvrages régionaux.", "visited": false}, {"id": "corse-18", "name": "Librairie A Piuma Lesta", "city": "Bastia", "address": "Centre Commercial Le Polygone, Bastia", "description": "Librairie moderne des quartiers sud de Bastia, mettant l’accent sur le conseil et l’accueil des objets éditoriaux originaux.", "visited": false}, {"id": "corse-19", "name": "Librairie Caro", "city": "Ajaccio", "address": "Ajaccio", "description": "Librairie spécialisée BD et image participant au maillage culturel local et aux circuits alternatifs de diffusion.", "visited": false}, {"id": "corse-20", "name": "Mag Presse", "city": "Propriano", "address": "Propriano", "description": "Point presse et librairie permettant une diffusion secondaire dans la région du Valinco.", "visited": false}, {"id": "corse-21", "name": "Galerie Bel'Arti", "city": "Calvi", "address": "Route de Pietramaggiore, 20260 Calvi", "description": "Galerie d’art contemporaine en Balagne présentant artistes et œuvres visuelles dans un cadre touristique.", "visited": false}, {"id": "corse-22", "name": "L'Animu Médiathèque", "city": "Porto-Vecchio", "address": "Porto-Vecchio", "description": "Médiathèque moderne de Porto-Vecchio pouvant intégrer des livres d’artiste dans son fonds public.", "visited": false}, {"id": "centre-val-de-loire-1", "name": "Centre de Création Contemporaine Olivier Debré (CCCOD)", "city": "Tours", "address": "1 parvis Jean Germain / 16bis Jardin François 1er, 37000 Tours", "description": "Centre d’art contemporain majeur avec une librairie spécialisée proposant catalogues d’exposition, multiples d’artistes et micro-éditions.", "visited": false}, {"id": "centre-val-de-loire-2", "name": "Groupe Laura", "city": "Tours", "address": "10 place Choiseul, 37100 Tours", "description": "Laboratoire éditorial et association produisant la Revue Laura et soutenant la micro-édition, l’édition d’art et les pratiques curatoriales expérimentales.", "visited": false}, {"id": "centre-val-de-loire-3", "name": "Galerie Veyssière Sigma", "city": "Tours", "address": "25 rue Colbert, 37000 Tours", "description": "Galerie spécialisée dans l’art moderne, contemporain et les estampes, particulièrement attentive aux œuvres imprimées et aux objets de bibliophilie.", "visited": false}, {"id": "centre-val-de-loire-4", "name": "Librairie Rosemonde", "city": "Tours", "address": "1 rue de Jérusalem, 37000 Tours", "description": "Librairie indépendante avec un fonds artistique et un espace propice aux éditions singulières et aux projets éditoriaux indépendants.", "visited": false}, {"id": "centre-val-de-loire-5", "name": "Nanza Galerie", "city": "Tours", "address": "61 rue Blaise-Pascal, 37000 Tours", "description": "Galerie hybride mêlant objets d’art, design et créations contemporaines, ouverte aux objets éditoriaux expérimentaux.", "visited": false}, {"id": "centre-val-de-loire-6", "name": "Association PoSo", "city": "Tours", "address": "109 rue de la Fuye, 37000 Tours", "description": "Collectif artistique et poétique travaillant autour de la performance, de l’écriture expérimentale et des formes éditoriales artisanales.", "visited": false}, {"id": "centre-val-de-loire-7", "name": "Galerie Exuo", "city": "Tours", "address": "109 rue de la Fuye, 37000 Tours", "description": "Galerie d’art contemporain citée comme relais dans le réseau artistique local lié aux pratiques expérimentales et éditoriales.", "visited": false}, {"id": "centre-val-de-loire-8", "name": "Fondation du Doute", "city": "Blois", "address": "14 rue de la Paix, 41000 Blois", "description": "Centre d’art consacré à Fluxus et aux pratiques conceptuelles, espace potentiellement réceptif aux éditions expérimentales.", "visited": false}, {"id": "centre-val-de-loire-9", "name": "Galerie Olivier Rousseau", "city": "Tours", "address": "48 rue de la Scellerie, 37000 Tours", "description": "Galerie d’art contemporain ayant exposé plusieurs artistes contemporains et ouverte aux objets éditoriaux liés aux arts plastiques.", "visited": false}, {"id": "centre-val-de-loire-10", "name": "La Boîte à Livres", "city": "Tours", "address": "19 rue Nationale, 37000 Tours", "description": "Grande librairie indépendante tourangelle collaborant régulièrement avec institutions culturelles et bibliothèques pour des projets artistiques.", "visited": false}, {"id": "centre-val-de-loire-11", "name": "Le Garage", "city": "Amboise", "address": "1 rue du Général Foy, 37400 Amboise", "description": "Centre d’art contemporain accueillant expositions internationales et projets liant texte et image, incluant des livres d’artistes.", "visited": false}, {"id": "centre-val-de-loire-12", "name": "FRAC Centre-Val de Loire", "city": "Orléans", "address": "88 rue du Colombier, 45000 Orléans", "description": "Institution majeure consacrée aux relations entre art contemporain et architecture, avec acquisitions et programmation curatoriale.", "visited": false}, {"id": "centre-val-de-loire-13", "name": "Librairie Renée Gailhoustet", "city": "Orléans", "address": "88 rue du Colombier, 45000 Orléans", "description": "Librairie spécialisée du FRAC Centre-Val de Loire dédiée à l’architecture, aux questions de genre et à la théorie critique.", "visited": false}, {"id": "centre-val-de-loire-14", "name": "Librairie Jaune Citron", "city": "Orléans", "address": "9 rue des Carmes, 45000 Orléans", "description": "Librairie-galerie dédiée à l’illustration, aux arts graphiques et aux micro-éditions, accueillant sérigraphies, risographies et fanzines.", "visited": false}, {"id": "centre-val-de-loire-15", "name": "Librairie Les Temps Modernes", "city": "Orléans", "address": "57 rue Notre Dame de Recouvrance, 45000 Orléans", "description": "Librairie indépendante historique proposant littérature, sciences humaines et un rayon arts approfondi.", "visited": false}, {"id": "centre-val-de-loire-16", "name": "Le 108", "city": "Orléans", "address": "108 rue de Bourgogne, 45000 Orléans", "description": "Friche culturelle pluridisciplinaire rassemblant collectifs artistiques et espaces de création.", "visited": false}, {"id": "centre-val-de-loire-17", "name": "Le Bol", "city": "Orléans", "address": "108 rue de Bourgogne, 45000 Orléans", "description": "Espace d’art contemporain situé dans la friche du 108, accueillant expositions et collectifs expérimentaux.", "visited": false}, {"id": "centre-val-de-loire-18", "name": "Empreinte Galerie", "city": "Orléans", "address": "3 rue d'Alibert, 45000 Orléans", "description": "Galerie d’art contemporain présentant artistes émergents et confirmés.", "visited": false}, {"id": "centre-val-de-loire-19", "name": "Le Garage", "city": "Orléans", "address": "Rue de Bourgogne, 45000 Orléans", "description": "Galerie indépendante dirigée par Michel Dubois soutenant les pratiques artistiques audacieuses et les multiples contemporains.", "visited": false}, {"id": "centre-val-de-loire-20", "name": "Antre Peaux / Le Transpalette", "city": "Bourges", "address": "24/26 route de la Chapelle, 18000 Bourges", "description": "Friche culturelle et centre d’art contemporain majeur accueillant expositions, micro-édition et événements DIY comme le forum Macules & Conceptions.", "visited": false}, {"id": "centre-val-de-loire-21", "name": "ENSA Bourges / La Box", "city": "Bourges", "address": "9 rue Edouard Branly, 18000 Bourges", "description": "Galerie de l’École nationale supérieure d’art de Bourges dédiée à la recherche artistique, aux expositions et aux publications.", "visited": false}, {"id": "centre-val-de-loire-22", "name": "La Transversale", "city": "Bourges", "address": "50 rue Stéphane Mallarmé, 18000 Bourges", "description": "Espace d’exposition associé à l’ENSA Bourges accueillant résidences et projets pédagogiques.", "visited": false}, {"id": "centre-val-de-loire-23", "name": "Galerie Pictura", "city": "Bourges", "address": "15 rue Littré, 18000 Bourges", "description": "Galerie spécialisée dans les arts graphiques traditionnels : gravure, lithographie, dessin et photographie.", "visited": false}, {"id": "centre-val-de-loire-24", "name": "Librairie Les Pages du Donjon", "city": "Bourges", "address": "54-56 rue Coursarlon, 18000 Bourges", "description": "Librairie indépendante locale proposant événements culturels et ouverture aux ouvrages d’art et créations régionales.", "visited": false}, {"id": "centre-val-de-loire-25", "name": "Art Tension (Espace Chen Jang-Hua)", "city": "Bourges", "address": "5 place Saint-Bonnet, 18000 Bourges", "description": "Galerie et espace d’atelier orienté vers l’art contemporain et les pratiques liées aux cultures asiatiques.", "visited": false}, {"id": "centre-val-de-loire-26", "name": "Château d'eau - Château d'art", "city": "Bourges", "address": "Place Séraucourt, 18000 Bourges", "description": "Monument patrimonial reconverti accueillant ponctuellement des expositions d’art contemporain.", "visited": false}, {"id": "normandie-1", "name": "FRAC Normandie – Site de Rouen", "city": "Sotteville-lès-Rouen", "address": "3 place des Martyrs-de-la-Résistance", "description": "Fonds Régional d’Art Contemporain possédant une collection importante incluant des livres d’artistes. Dépôt possible via le centre de documentation et potentiel d’acquisition institutionnelle.", "visited": false}, {"id": "normandie-2", "name": "Le Shed, Centre d'art contemporain de Normandie", "city": "Maromme", "address": "96 rue des Martyrs de la Résistance", "description": "Centre d’art indépendant avec une boutique d’éditions d’artistes proposant livres d’artistes, multiples et objets imprimés expérimentaux.", "visited": false}, {"id": "normandie-3", "name": "ADN – Art Dédié à la Nature", "city": "Rouen", "address": "57 rue des Faulx", "description": "Galerie hybride avec espace librairie dédiée aux thèmes écologiques, photographiques et naturalistes, ouverte aux propositions éditoriales.", "visited": false}, {"id": "normandie-4", "name": "Librairie L'Armitière", "city": "Rouen", "address": "66 rue Jeanne d'Arc", "description": "Grande librairie indépendante du centre-ville avec un rayon arts visuels important permettant la diffusion de livres d’artistes via un dépôt classique.", "visited": false}, {"id": "normandie-5", "name": "HATCH – Galerie du livre et de l'objet imprimé", "city": "Le Havre", "address": "17 allée Aimé Césaire", "description": "Galerie spécialisée dans la micro-édition et les techniques d’impression artisanales (risographie, sérigraphie, gravure). Lieu central de diffusion du livre d’artiste en Normandie.", "visited": false}, {"id": "normandie-6", "name": "Le Portique – Centre Régional d’Art Contemporain", "city": "Le Havre", "address": "1517 Place de l'Hôtel de Ville", "description": "Centre d’art contemporain avec boutique diffusant catalogues, éditions d’artistes, multiples et objets imprimés liés aux expositions.", "visited": false}, {"id": "normandie-7", "name": "ESADHaR – Campus du Havre (bibliothèque)", "city": "Le Havre", "address": "65 rue Demidoff", "description": "École supérieure d’art et design possédant une bibliothèque spécialisée en design graphique et livres d’artistes, ouverte aux dons et acquisitions.", "visited": false}, {"id": "normandie-8", "name": "Librairie La Galerne", "city": "Le Havre", "address": "148 rue Victor Hugo", "description": "Grande librairie indépendante gérant également la boutique du MuMa, fréquentée par un public d’amateurs d’art et de visiteurs culturels.", "visited": false}, {"id": "normandie-9", "name": "L’Artothèque, Espaces d’art contemporain", "city": "Caen", "address": "Palais Ducal, Impasse Duc Rollon", "description": "Centre d’art et institution éditoriale majeure produisant et diffusant livres d’artistes, multiples et publications théoriques.", "visited": false}, {"id": "normandie-10", "name": "FRAC Normandie – Site de Caen", "city": "Caen", "address": "7 bis rue Neuve Bourg l'Abbé", "description": "Second site du FRAC Normandie, accueillant expositions et centre de documentation incluant un fonds de livres d’artistes.", "visited": false}, {"id": "normandie-11", "name": "Le Pavillon", "city": "Caen", "address": "Presqu'île de Caen", "description": "Espace d’exposition et de médiation dédié à l’architecture, au territoire et à l’urbanisme, pouvant accueillir des éditions liées au paysage ou à la cartographie.", "visited": false}, {"id": "normandie-12", "name": "Librairie Eureka Street", "city": "Caen", "address": "126 boulevard Maréchal Leclerc, 14000 Caen", "description": "Librairie indépendante engagée dans le réseau culturel caennais et participante à la Semaine des Éditions d’Art.", "visited": false}, {"id": "normandie-13", "name": "Le Brouillon de Culture", "city": "Caen", "address": "29 rue Saint-Sauveur", "description": "Librairie indépendante majeure de Caen avec un rayon arts et beaux-livres, impliquée dans la vie culturelle locale.", "visited": false}, {"id": "normandie-14", "name": "Librairie Ancienne et Moderne P. Frérot", "city": "Caen", "address": "24-26 rue des Croisiers", "description": "Librairie historique spécialisée dans les livres anciens et universitaires, participant à la valorisation des livres d’artistes lors d’événements éditoriaux.", "visited": false}, {"id": "grand-est-1", "name": "FRAC Champagne-Ardenne", "city": "Reims", "address": "1 place Museux", "description": "FRAC disposant d'une boutique-librairie scénographiée (installation Metashelves) où livres d'artistes, publications et multiples d'art sont proposés à la vente et parfois acquis institutionnellement.", "visited": false}, {"id": "grand-est-2", "name": "49 Nord 6 Est – FRAC Lorraine", "city": "Metz", "address": "1 bis rue des Trinitaires", "description": "FRAC centré sur l'art conceptuel et les enjeux sociopolitiques, avec un centre de documentation important et un programme d'éditions d'artistes (Degrés Est).", "visited": false}, {"id": "grand-est-3", "name": "FRAC Alsace", "city": "Sélestat", "address": "1 route de Marckolsheim", "description": "FRAC axé sur la réflexion autour du livre comme archive et objet éditorial, avec un réseau transfrontalier actif entre France, Allemagne et Suisse.", "visited": false}, {"id": "grand-est-4", "name": "Séries Graphiques", "city": "Strasbourg", "address": "5 rue de la Douane", "description": "Librairie indépendante spécialisée dans l'image imprimée, l'illustration, le design graphique et la micro-édition, avec espace galerie et café.", "visited": false}, {"id": "grand-est-5", "name": "Librairie Le Tigre", "city": "Strasbourg", "address": "36 quai des Bateliers", "description": "Librairie indépendante tournée vers la bande dessinée alternative, les graphzines et la micro-édition underground.", "visited": false}, {"id": "grand-est-6", "name": "L'Image et le Livre", "city": "Strasbourg", "address": "12 rue Jacques Peirotes", "description": "Librairie spécialisée dans les livres anciens, gravures, estampes et œuvres graphiques, pouvant accueillir des livres d'artistes liés aux techniques traditionnelles.", "visited": false}, {"id": "grand-est-7", "name": "Micro-librairie Central Vapeur", "city": "Strasbourg", "address": "Garage Coop, 2 rue de la Coopérative, 67000 Strasbourg", "description": "Dispositif de vente mis en place par l'association Central Vapeur, dédié à la micro-édition et aux arts imprimés lors d'événements et festivals.", "visited": false}, {"id": "grand-est-8", "name": "Troc'afé", "city": "Strasbourg", "address": "Rue du faubourg Saverne", "description": "Lieu alternatif ayant accueilli des événements de micro-édition et de vente directe de sérigraphies et posters d'artistes.", "visited": false}, {"id": "grand-est-9", "name": "Librairie du Musée d'Art Moderne et Contemporain de Strasbourg (MAMCS)", "city": "Strasbourg", "address": "Place de l'Étoile", "description": "Librairie de musée proposant catalogues d'expositions et livres d'art, offrant une visibilité institutionnelle importante.", "visited": false}, {"id": "grand-est-10", "name": "Librairie Lame", "city": "Saint-Denis", "address": "44 rue Auguste Poullain, 93200 Saint-Denis", "description": "Librairie ultra-spécialisée dans le livre d'artiste, la micro-édition, le livre photo et les essais sur le design graphique et l'esthétique.", "visited": false}, {"id": "grand-est-11", "name": "La Factorine", "city": "Nancy", "address": "14 rue Stanislas", "description": "Espace hybride entre galerie et lieu d'expérimentation artistique organisant expositions, performances et événements autour de la micro-édition.", "visited": false}, {"id": "grand-est-12", "name": "Galerie Modulab", "city": "Metz", "address": "28 rue Mazelle", "description": "Galerie d'art contemporain combinée à un atelier d'estampe (Atelier Etching) produisant et diffusant des éditions d'artistes et tirages limités.", "visited": false}, {"id": "grand-est-13", "name": "Papier Bon Œil", "city": "Reims", "address": "37 bis rue des Capucins, 51100 Reims", "description": "Studio de création graphique, atelier d'impression risographie et sérigraphie, boutique et galerie dédiée à la micro-édition et aux objets graphiques.", "visited": false}, {"id": "grand-est-14", "name": "Centre d'Art Contemporain – La Synagogue de Delme", "city": "Delme", "address": "33 rue Poincaré, 57590 Delme", "description": "Centre d'art contemporain organisant notamment le salon NUMÉRO(S), événement majeur dédié à l'édition et à la micro-édition dans le Grand Est.", "visited": false}, {"id": "bourgogne-franche-comte-1", "name": "Le Consortium Museum", "city": "Dijon", "address": "37 rue de Longvic, 21000 Dijon", "description": "Centre d’art contemporain majeur avec librairie spécialisée liée aux Presses du réel, influent dans l’édition d’art contemporain.", "visited": false}, {"id": "bourgogne-franche-comte-2", "name": "FRAC Bourgogne – Les Bains du Nord", "city": "Dijon", "address": "16 rue Quentin, 21000 Dijon", "description": "Espace d’exposition et boutique du FRAC Bourgogne diffusant catalogues, multiples et éditions d’artistes liés à la collection publique.", "visited": false}, {"id": "bourgogne-franche-comte-3", "name": "Les Ateliers Vortex", "city": "Dijon", "address": "71-73 rue des Rotondes, 21000 Dijon", "description": "Centre d’art associatif avec résidences, atelier de sérigraphie et production de multiples et éditions d’artistes.", "visited": false}, {"id": "bourgogne-franche-comte-4", "name": "Interface", "city": "Dijon", "address": "12 rue Chancelier de l'Hospital, 21000 Dijon", "description": "Appartement-galerie dédié à la jeune création contemporaine et à l’édition critique, notamment la revue Horsd’œuvre.", "visited": false}, {"id": "bourgogne-franche-comte-5", "name": "Galerie Le Trigram", "city": "Dijon", "address": "29 rue Charles Dumont, 21000 Dijon", "description": "Galerie indépendante récente consacrée aux arts visuels contemporains et aux artistes émergents.", "visited": false}, {"id": "bourgogne-franche-comte-6", "name": "Galerie Barnoud (Entrepôt 9)", "city": "Quetigny", "address": "9 boulevard de l'Europe, 21800 Quetigny", "description": "Galerie privée et collection d’entreprise produisant expositions, catalogues et multiples d’artistes.", "visited": false}, {"id": "bourgogne-franche-comte-7", "name": "La Minoterie", "city": "Dijon", "address": "75 avenue Jean Jaurès, 21000 Dijon", "description": "Pôle de création jeune public et lieu de diffusion artistique reliant illustration, livre et arts visuels.", "visited": false}, {"id": "bourgogne-franche-comte-8", "name": "Librairie Papeterie Grangier", "city": "Dijon", "address": "14 rue du Château, 21000 Dijon", "description": "Grande librairie indépendante labellisée LiR avec un vaste rayon beaux-arts et graphisme.", "visited": false}, {"id": "bourgogne-franche-comte-9", "name": "Planète BD", "city": "Dijon", "address": "Passage Darcy, 21000 Dijon", "description": "Librairie spécialisée en bande dessinée et illustration avec un public amateur d’arts graphiques.", "visited": false}, {"id": "bourgogne-franche-comte-10", "name": "Momie Dijon", "city": "Dijon", "address": "Rue des Godrans, 21000 Dijon", "description": "Librairie spécialisée en BD, manga et illustration avec un public lié aux arts graphiques.", "visited": false}, {"id": "bourgogne-franche-comte-11", "name": "Librairie Autrement Dit", "city": "Dijon", "address": "Rue des Godrans, 21000 Dijon", "description": "Librairie hybride mêlant jeunesse, pop-ups, objets artistiques et livres illustrés.", "visited": false}, {"id": "bourgogne-franche-comte-12", "name": "Librairie Yannick Guillemin", "city": "Dijon", "address": "Place de la République, 21000 Dijon", "description": "Librairie spécialisée dans les livres anciens, éditions originales et livres d’art.", "visited": false}, {"id": "bourgogne-franche-comte-13", "name": "Le Barde Bourguignon", "city": "Dijon", "address": "Rue Berbisey, 21000 Dijon", "description": "Librairie et bouquiniste attirant bibliophiles et collectionneurs d’ouvrages rares.", "visited": false}, {"id": "bourgogne-franche-comte-14", "name": "Librairie Florence Bardon", "city": "Dijon", "address": "Rue Berbisey, 21000 Dijon", "description": "Librairie d’ouvrages anciens et illustrés appréciée des collectionneurs.", "visited": false}, {"id": "bourgogne-franche-comte-15", "name": "FRAC Franche-Comté – Le Studiolo", "city": "Besançon", "address": "Cité des arts, 2 passage des Arts, 25000 Besançon", "description": "Boutique et espace éditorial du FRAC diffusant multiples, éditions d’art et objets d’artistes.", "visited": false}, {"id": "bourgogne-franche-comte-16", "name": "Superseñor", "city": "Besançon", "address": "10 avenue de Chardonnet, 25000 Besançon", "description": "Collectif de micro-édition et atelier DIY spécialisé en sérigraphie, risographie et culture fanzine.", "visited": false}, {"id": "bourgogne-franche-comte-17", "name": "Boucle d’arts", "city": "Besançon", "address": "7 rue Klein, 25000 Besançon", "description": "Boutique et atelier partagé permettant aux artistes locaux de vendre et diffuser leurs œuvres et éditions.", "visited": false}, {"id": "bourgogne-franche-comte-18", "name": "Librairie L'Intranquille Plazza", "city": "Besançon", "address": "59 rue des Granges, 25000 Besançon", "description": "Grande librairie indépendante avec rayon arts graphiques et matériel artistique.", "visited": false}, {"id": "bourgogne-franche-comte-19", "name": "Les Sandales d'Empédocle", "city": "Besançon", "address": "95 Grande Rue, 25000 Besançon", "description": "Librairie indépendante historique réputée pour sa sélection exigeante en poésie, sciences humaines et beaux-arts.", "visited": false}, {"id": "bourgogne-franche-comte-20", "name": "Le 19 CRAC", "city": "Montbéliard", "address": "19 avenue des Alliés, 25200 Montbéliard", "description": "Centre régional d’art contemporain organisant notamment un salon de la micro-édition et du fanzine.", "visited": false}, {"id": "bourgogne-franche-comte-21", "name": "Espace multimédia Gantner", "city": "Bourogne", "address": "1 rue de la Varonne, 90140 Bourogne", "description": "Centre dédié aux arts numériques, aux cultures internet et aux pratiques multimédia.", "visited": false}, {"id": "bourgogne-franche-comte-22", "name": "L'Imaginarium", "city": "Belfort", "address": "Rue Lecourbe, 90000 Belfort", "description": "Boutique-galerie proposant œuvres et publications d’artistes contemporains.", "visited": false}, {"id": "bourgogne-franche-comte-23", "name": "Musée Nicéphore Niépce", "city": "Chalon-sur-Saône", "address": "28 quai des Messageries, 71100 Chalon-sur-Saône", "description": "Musée consacré à l’histoire de la photographie avec librairie spécialisée en ouvrages photographiques.", "visited": false}, {"id": "bourgogne-franche-comte-24", "name": "Librairie La Mandragore", "city": "Chalon-sur-Saône", "address": "3 rue des Tonneliers, 71100 Chalon-sur-Saône", "description": "Librairie indépendante avec rayon beaux-livres et présence événementielle dans les festivals locaux.", "visited": false}, {"id": "bourgogne-franche-comte-25", "name": "Espace des Arts", "city": "Chalon-sur-Saône", "address": "5 bis avenue Nicéphore Niépce, 71100 Chalon-sur-Saône", "description": "Scène nationale accueillant festivals et événements artistiques avec présence de librairie mobile.", "visited": false}, {"id": "bourgogne-franche-comte-26", "name": "Le Cadran Lunaire", "city": "Mâcon", "address": "27 rue Franche, 71000 Mâcon", "description": "Librairie indépendante historique avec solide rayon beaux-arts et clientèle fidèle.", "visited": false}, {"id": "bourgogne-franche-comte-27", "name": "Librairie Ancienne Darreau Norbert", "city": "Mâcon", "address": "Place Saint-Pierre, 71000 Mâcon", "description": "Librairie spécialisée en livres anciens et éditions rares pour collectionneurs.", "visited": false}, {"id": "bourgogne-franche-comte-28", "name": "Ravisius Textor / Tombolo Presses", "city": "Nevers", "address": "8 rue des 4 vents, 58000 Nevers", "description": "Librairie expérimentale, atelier de risographie et maison d’édition spécialisée en design graphique et micro-édition.", "visited": false}, {"id": "bourgogne-franche-comte-29", "name": "Parc Saint-Léger – Centre d’art contemporain", "city": "Pougues-les-Eaux", "address": "23 avenue Conti, 58320 Pougues-les-Eaux", "description": "Centre d’art accueillant résidences d’artistes et produisant livres d’artistes et catalogues.", "visited": false}, {"id": "bourgogne-franche-comte-30", "name": "Librairie Obliques", "city": "Auxerre", "address": "2 place de l'Hôtel de Ville, 89000 Auxerre", "description": "Grande librairie indépendante avec un rayon solide dédié aux beaux-arts.", "visited": false}, {"id": "bourgogne-franche-comte-31", "name": "CRAC Fontenoy", "city": "Fontenoy", "address": "Château du Tremblay, 89520 Fontenoy", "description": "Centre régional d’art contemporain avec artothèque favorisant la diffusion d’œuvres et d’éditions.", "visited": false}, {"id": "paca-1", "name": "FRAC Sud – Cité de l'art contemporain", "city": "Marseille", "address": "20 boulevard de Dunkerque, 13002 Marseille", "description": "Institution publique abritant le centre de documentation 'Le 3e Plateau' et le Fonds LEM consacré aux livres, éditions et multiples d’artistes.", "visited": false}, {"id": "paca-2", "name": "Librairie du MUCEM", "city": "Marseille", "address": "1 esplanade J4, 13002 Marseille", "description": "Grande librairie de musée gérée par Arteum avec une sélection d’ouvrages en art, architecture, urbanisme et photographie.", "visited": false}, {"id": "paca-3", "name": "Librairie des expositions du MUCEM", "city": "Marseille", "address": "1 esplanade J4, 13002 Marseille", "description": "Librairie située au deuxième étage du MUCEM proposant une sélection liée directement aux expositions temporaires.", "visited": false}, {"id": "paca-4", "name": "Maison Yellow (Concept-store du MUCEM)", "city": "Marseille", "address": "1 esplanade J4, 13002 Marseille", "description": "Concept-store consacré à la culture marseillaise et au design, pouvant accueillir objets d’artistes et éditions liées à l’identité locale.", "visited": false}, {"id": "paca-5", "name": "Musée d'Art Contemporain de Marseille – Centre de documentation Ernst Goldschmidt", "city": "Marseille", "address": "69 avenue d’Haïfa, 13008 Marseille", "description": "Centre de documentation spécialisé dans l’art contemporain avec fonds de catalogues, livres d’artistes et publications de design.", "visited": false}, {"id": "paca-6", "name": "Galerie-Librairie Zoème", "city": "Marseille", "address": "8 rue Vian, 13006 Marseille", "description": "Galerie, maison d’édition et librairie indépendante dédiée à la photographie, la poésie contemporaine et la critique sociale.", "visited": false}, {"id": "paca-7", "name": "Le Dernier Cri", "city": "Marseille", "address": "Friche la Belle de Mai, 41 rue Jobin, 13003 Marseille", "description": "Atelier de sérigraphie et maison d’édition emblématique de la scène graphzine internationale.", "visited": false}, {"id": "paca-8", "name": "Librairie de la Friche", "city": "Marseille", "address": "Friche la Belle de Mai, 41 rue Jobin, 13003 Marseille", "description": "Librairie généraliste avec une sélection pointue liée aux expositions et aux activités culturelles de la Friche.", "visited": false}, {"id": "paca-9", "name": "Studio Fotokino", "city": "Marseille", "address": "33 allée Léon Gambetta, 13001 Marseille", "description": "Espace dédié au graphisme, illustration et typographie avec librairie spécialisée en édition indépendante.", "visited": false}, {"id": "paca-10", "name": "Librairie Pantagruel", "city": "Marseille", "address": "7e arrondissement, Marseille", "description": "Librairie indépendante impliquée dans la micro-édition et les formats littéraires atypiques.", "visited": false}, {"id": "paca-11", "name": "Librairie Lame", "city": "Saint-Denis", "address": "44 rue Auguste Poullain, 93200 Saint-Denis", "description": "Librairie spécialisée en micro-édition et fanzines participant régulièrement aux salons et foires en PACA.", "visited": false}, {"id": "paca-12", "name": "Librairie Offprint (Fondation LUMA)", "city": "Arles", "address": "35 avenue Victor Hugo, 13200 Arles", "description": "Librairie internationale consacrée à l’édition indépendante expérimentale et aux avant-gardes éditoriales.", "visited": false}, {"id": "paca-13", "name": "Librairie du Palais", "city": "Arles", "address": "10 rue Plan de la Cour, 13200 Arles", "description": "Librairie spécialisée dans la photographie avec une sélection d’ouvrages rares et contemporains.", "visited": false}, {"id": "paca-14", "name": "Les Grandes Largeurs", "city": "Arles", "address": "11 rue Réattu, 13200 Arles", "description": "Librairie indépendante avec fonds riche en littérature, sciences humaines et beaux-arts, incluant espace d’exposition.", "visited": false}, {"id": "paca-15", "name": "Librairie Actes Sud (Le Méjan)", "city": "Arles", "address": "Place Nina Berberova, 13200 Arles", "description": "Grande librairie des éditions Actes Sud avec important rayon consacré à l’art et à la photographie.", "visited": false}, {"id": "paca-16", "name": "Villa Arson", "city": "Nice", "address": "20 avenue Stephen Liégeard, 06105 Nice", "description": "École et centre national d’art contemporain disposant d’une librairie et d’une bibliothèque spécialisée.", "visited": false}, {"id": "paca-17", "name": "Librairie-Galerie Laure Matarasso", "city": "Nice", "address": "46 boulevard Risso, 06300 Nice", "description": "Librairie d’art et galerie spécialisée dans la bibliophilie, les éditions originales et les livres d’artistes.", "visited": false}, {"id": "paca-18", "name": "MAMAC – Librairie-boutique", "city": "Nice", "address": "Place Yves Klein, 06300 Nice", "description": "Librairie du Musée d’Art Moderne et d’Art Contemporain mettant en avant publications et créations contemporaines.", "visited": false}, {"id": "paca-19", "name": "Evrlst Lifestore", "city": "Nice", "address": "4 rue du Lycée, 06000 Nice", "description": "Concept-store mêlant musique, design, vêtements et publications culturelles.", "visited": false}, {"id": "paca-20", "name": "Shababik", "city": "Nice", "address": "10 rue Benoît Bunico, 06300 Nice", "description": "Lieu hybride café, galerie et boutique pouvant accueillir fanzines et publications contemporaines.", "visited": false}, {"id": "paca-21", "name": "Ose Décoration", "city": "Nice", "address": "1 rue Raynardi, 06000 Nice", "description": "Concept-store mêlant design, exposition et objets culturels incluant parfois des éditions indépendantes.", "visited": false}, {"id": "paca-22", "name": "Collection Lambert – Librairie", "city": "Avignon", "address": "5 rue Violette, 84000 Avignon", "description": "Librairie du musée consacrée à l’art contemporain et aux multiples édités par les artistes.", "visited": false}, {"id": "paca-23", "name": "Villa Noailles – Librairie-boutique", "city": "Hyères", "address": "Montée Noailles, 83400 Hyères", "description": "Librairie du centre d’art orientée design, photographie et architecture.", "visited": false}, {"id": "paca-24", "name": "Le Metaxu", "city": "Toulon", "address": "26 rue Nicolas Laugier, 83000 Toulon", "description": "Galerie et lieu de micro-édition organisant des événements comme PRJNT ou Duplicata autour du fanzine.", "visited": false}, {"id": "paca-25", "name": "La Caravane des Créateurs", "city": "Saint-Rémy-de-Provence", "address": "4 rue Carnot, 13210 Saint-Rémy-de-Provence", "description": "Concept-store mettant en avant l’artisanat et la création contemporaine locale.", "visited": false}, {"id": "occitanie-1", "name": "Librairie du Carré d'Art", "city": "Nîmes", "address": "Place de la Maison Carrée, 30000 Nîmes", "description": "Librairie du musée d'art contemporain Carré d'Art, spécialisée en art contemporain, photographie, design et architecture.", "visited": false}, {"id": "occitanie-2", "name": "Librairie Teissier", "city": "Nîmes", "address": "Rue Régale, 30000 Nîmes", "description": "Librairie indépendante historique fondée en 1913, disposant d’un rayon beaux-arts et poésie.", "visited": false}, {"id": "occitanie-3", "name": "Librairie L'Eau Vive", "city": "Nîmes", "address": "30000 Nîmes", "description": "Librairie indépendante mentionnée par la DRAC Occitanie, pertinente pour les ouvrages narratifs et auto-édités.", "visited": false}, {"id": "occitanie-4", "name": "Aux Lettres de mon Moulin", "city": "Nîmes", "address": "30000 Nîmes", "description": "Librairie indépendante nîmoise référencée par la DRAC Occitanie, ouverte aux ouvrages d’édition indépendante.", "visited": false}, {"id": "occitanie-5", "name": "FRAC Occitanie Montpellier", "city": "Montpellier", "address": "4 Rue Rambaud, 34000 Montpellier", "description": "Fonds régional d’art contemporain chargé de constituer une collection publique d’art contemporain et d’acquérir des œuvres via un comité scientifique.", "visited": false}, {"id": "occitanie-6", "name": "MO.CO. / La Panacée", "city": "Montpellier", "address": "14 Rue de l'École de Pharmacie, 34000 Montpellier", "description": "Centre d’art contemporain et lieu d’exposition soutenant la jeune création, avec librairie et activité éditoriale.", "visited": false}, {"id": "occitanie-7", "name": "Galerie Al/Ma", "city": "Montpellier", "address": "15 Rue La Fontaine, 34000 Montpellier", "description": "Galerie d’art contemporain axée sur le dessin, la sculpture minimaliste et les éditions d’artistes.", "visited": false}, {"id": "occitanie-8", "name": "Librairie En Traits Libres", "city": "Montpellier", "address": "2 Rue du Bayle, 34000 Montpellier", "description": "Librairie et collectif dédié à la bande dessinée indépendante, aux fanzines et à la micro-édition.", "visited": false}, {"id": "occitanie-9", "name": "Centre d'Art La Fenêtre", "city": "Montpellier", "address": "27 Rue Frédéric Peyson, 34000 Montpellier", "description": "Centre d’art associatif explorant les relations entre architecture, design, graphisme et arts visuels.", "visited": false}, {"id": "occitanie-10", "name": "Sauramps Musée Fabre", "city": "Montpellier", "address": "39 Boulevard Bonne Nouvelle, 34000 Montpellier", "description": "Grande librairie spécialisée en beaux-arts et architecture située dans le musée Fabre.", "visited": false}, {"id": "occitanie-11", "name": "Le Grain des Mots", "city": "Montpellier", "address": "13 Boulevard du Jeu de Paume, 34000 Montpellier", "description": "Librairie indépendante labellisée LIR avec une forte activité culturelle et un rayon arts visuels.", "visited": false}, {"id": "occitanie-12", "name": "CRAC Occitanie", "city": "Sète", "address": "26 Quai Aspirant Herber, 34200 Sète", "description": "Centre régional d’art contemporain disposant d’une activité éditoriale importante et d’une librairie spécialisée.", "visited": false}, {"id": "occitanie-13", "name": "Librairie L'Échappée Belle", "city": "Sète", "address": "7 Rue Gambetta, 34200 Sète", "description": "Librairie indépendante reconnue pour sa sélection pointue en photographie contemporaine et livres d’art.", "visited": false}, {"id": "occitanie-14", "name": "La Nouvelle Librairie Sétoise", "city": "Sète", "address": "34200 Sète", "description": "Librairie indépendante labellisée LIR, complémentaire de L’Échappée Belle, ouverte à la poésie et aux essais.", "visited": false}, {"id": "occitanie-15", "name": "MRAC Occitanie", "city": "Sérignan", "address": "146 Avenue de la Plage, 34410 Sérignan", "description": "Musée régional d’art contemporain avec librairie spécialisée en livres d’artistes, multiples et éditions liées aux expositions.", "visited": false}, {"id": "occitanie-16", "name": "L.A.C. (Lieu d'Art Contemporain)", "city": "Sigean", "address": "4 Rue de la Cave Coopérative, 11130 Sigean", "description": "Lieu d’exposition indépendant installé dans une ancienne cave viticole, dédié à l’art contemporain et à la pédagogie artistique.", "visited": false}, {"id": "occitanie-17", "name": "Musée des Arts et Métiers du Livre", "city": "Montolieu", "address": "Rue de la Mairie, 11170 Montolieu", "description": "Musée consacré à l’histoire de l’imprimerie et du livre, situé dans le Village du Livre de Montolieu.", "visited": false}, {"id": "occitanie-18", "name": "Librairie de la Paix", "city": "Montolieu", "address": "11170 Montolieu", "description": "Librairie du Village du Livre spécialisée dans la bibliophilie et les livres rares.", "visited": false}, {"id": "occitanie-19", "name": "Librairie L'Aubaine", "city": "Montolieu", "address": "11170 Montolieu", "description": "Librairie ancienne du Village du Livre de Montolieu, dédiée aux livres rares et d’occasion.", "visited": false}, {"id": "occitanie-20", "name": "Librairie Torcatis", "city": "Perpignan", "address": "10 Rue Mailly, 66000 Perpignan", "description": "Librairie indépendante LIR faisant également office de galerie d’art et soutenant les artistes locaux.", "visited": false}, {"id": "occitanie-21", "name": "À Cent Mètres du Centre du Monde", "city": "Perpignan", "address": "3 Avenue de Grande Bretagne, 66000 Perpignan", "description": "Centre d’art contemporain international fondé en hommage à Salvador Dalí et à la gare de Perpignan.", "visited": false}, {"id": "occitanie-22", "name": "Centre d'Art Le Lait", "city": "Albi", "address": "5 Rue de l'École Normale, 81000 Albi", "description": "Centre d’art contemporain reconnu pour ses expositions expérimentales et ses éditions d’artistes.", "visited": false}, {"id": "occitanie-23", "name": "Librairie Les Petits Vagabonds", "city": "Albi", "address": "81000 Albi", "description": "Librairie indépendante labellisée LIR avec un rayon art et littérature contemporaine.", "visited": false}, {"id": "occitanie-24", "name": "Les Abattoirs, Musée - FRAC Occitanie Toulouse", "city": "Toulouse", "address": "76 Allées Charles de Fitte, 31300 Toulouse", "description": "Musée d’art moderne et contemporain et pôle FRAC disposant d’une librairie et d’une bibliothèque spécialisée.", "visited": false}, {"id": "occitanie-25", "name": "Librairie Ombres Blanches", "city": "Toulouse", "address": "50 Rue Léon Gambetta, 31000 Toulouse", "description": "Grande librairie indépendante toulousaine avec galerie, conférences et important rayon arts visuels.", "visited": false}, {"id": "occitanie-26", "name": "Librairie du Père Duchêne", "city": "Toulouse", "address": "31000 Toulouse", "description": "Librairie spécialisée dans les livres anciens et la bibliophilie.", "visited": false}, {"id": "occitanie-27", "name": "Librairie Alain Pons", "city": "Toulouse", "address": "Région de Toulouse", "description": "Librairie spécialisée en livres anciens et bibliophilie, susceptible d’accueillir des livres d’artistes de facture traditionnelle.", "visited": false}, {"id": "hauts-de-france-1", "name": "FRAC Grand Large — Hauts-de-France", "city": "Dunkerque", "address": "503 Avenue des Bancs de Flandres, 59140 Dunkerque", "description": "Institution majeure d’art contemporain et de design avec une librairie intégrée (Café-Boutique) proposant livres d’art, multiples d’artistes et ouvrages spécialisés.", "visited": false}, {"id": "hauts-de-france-2", "name": "LAAC (Lieu d’Art et Action Contemporaine)", "city": "Dunkerque", "address": "302 Avenue des Bordées, 59140 Dunkerque", "description": "Musée d’art contemporain situé dans un jardin de sculptures avec une boutique-librairie liée à la programmation et aux collections Pop Art et Nouveau Réalisme.", "visited": false}, {"id": "hauts-de-france-3", "name": "LaM – Lille Métropole Musée d’Art Moderne, d’Art Contemporain et d’Art Brut", "city": "Villeneuve-d'Ascq", "address": "1 Allée du Musée, 59650 Villeneuve-d'Ascq", "description": "Musée internationalement reconnu avec une librairie-boutique importante et un travail de recherche sur la micro-édition et les graphzines.", "visited": false}, {"id": "hauts-de-france-4", "name": "Bibliothèque Dominique Bozo (LaM)", "city": "Villeneuve-d'Ascq", "address": "1 Allée du Musée, 59650 Villeneuve-d'Ascq", "description": "Bibliothèque spécialisée du LaM consacrée notamment aux graphzines, à l’art brut et aux publications alternatives.", "visited": false}, {"id": "hauts-de-france-5", "name": "La Boutique du Lieu (siège)", "city": "Croix", "address": "198 Rue Jean Monnet, 59170 Croix", "description": "Structure qui centralise la gestion des boutiques de plusieurs grands musées de la région et sélectionne les ouvrages diffusés dans ces lieux.", "visited": false}, {"id": "hauts-de-france-6", "name": "Palais des Beaux-Arts de Lille", "city": "Lille", "address": "Place de la République, 59000 Lille", "description": "Grand musée d’art dont la boutique-librairie est gérée par La Boutique du Lieu et propose catalogues, livres d’art et objets liés aux expositions.", "visited": false}, {"id": "hauts-de-france-7", "name": "La Piscine – Musée d’Art et d’Industrie", "city": "Roubaix", "address": "23 Rue de l’Espérance, 59100 Roubaix", "description": "Musée installé dans une ancienne piscine Art déco avec une boutique-librairie spécialisée en art et design.", "visited": false}, {"id": "hauts-de-france-8", "name": "Louvre-Lens", "city": "Lens", "address": "99 Rue Paul Bert, 62300 Lens", "description": "Musée associé au Louvre disposant d’une librairie importante proposant catalogues, livres d’art et publications liées aux expositions.", "visited": false}, {"id": "hauts-de-france-9", "name": "L’Espace du Dedans", "city": "Lille", "address": "28 Rue de Gand, 59000 Lille", "description": "Galerie-librairie spécialisée en bibliophilie contemporaine et livres d’artistes originaux, axée sur gravure, poésie et tirages limités.", "visited": false}, {"id": "hauts-de-france-10", "name": "Croâfunding", "city": "Lille", "address": "90 Rue Pierre Mauroy, 59800 Lille", "description": "Micro-librairie indépendante dédiée aux fanzines, à la bande dessinée alternative et à l’auto-édition.", "visited": false}, {"id": "hauts-de-france-11", "name": "Le Cagibi", "city": "Lille", "address": "8 Rue de Wazemmes, 59000 Lille", "description": "Galerie-librairie associative et atelier d’impression très actif dans la micro-édition, les graphzines et la sérigraphie.", "visited": false}, {"id": "hauts-de-france-12", "name": "Le Tripostal", "city": "Lille", "address": "22 Avenue Willy Brandt, 59000 Lille", "description": "Centre d’exposition accueillant des boutiques éphémères lors des saisons culturelles de lille3000.", "visited": false}, {"id": "hauts-de-france-13", "name": "La Chouette Librairie", "city": "Lille", "address": "Rue de l'Hôpital Militaire, 59000 Lille", "description": "Librairie indépendante avec un rayon arts visuels et poésie, active dans la vie culturelle locale.", "visited": false}, {"id": "hauts-de-france-14", "name": "Librairie Meura", "city": "Lille", "address": "Rue de Valmy, 59000 Lille", "description": "Librairie reconnue pour son fonds en sciences humaines, esthétique et théorie de l’art.", "visited": false}, {"id": "hauts-de-france-15", "name": "Librairie Godon", "city": "Lille", "address": "Rue Masurel, 59000 Lille", "description": "Librairie spécialisée dans les livres rares et anciens, appréciée des bibliophiles et chercheurs.", "visited": false}, {"id": "hauts-de-france-16", "name": "L’Hybride", "city": "Lille", "address": "18 rue Gosselet, 59000 Lille", "description": "Lieu culturel consacré à l’image animée qui accueille ponctuellement des salons de micro-édition et de fanzines.", "visited": false}, {"id": "hauts-de-france-17", "name": "Le Fresnoy – Studio national des arts contemporains", "city": "Tourcoing", "address": "22 Rue du Fresnoy, 59202 Tourcoing", "description": "Centre d’art et de production dédié aux arts numériques, au cinéma et à l’image expérimentale, avec librairie spécialisée.", "visited": false}, {"id": "hauts-de-france-18", "name": "Les Ateliers de la Halle", "city": "Arras", "address": "2 Rue de la Douizième, 62000 Arras", "description": "Association organisant la Biennale internationale du livre d’artiste 'Livres à Voir' et disposant d’un atelier de gravure et d’exposition.", "visited": false}, {"id": "hauts-de-france-19", "name": "Hôtel de Guînes", "city": "Arras", "address": "Rue des Jongleurs, 62000 Arras", "description": "Lieu d’exposition utilisé notamment pour la Biennale internationale du livre d’artiste organisée par Les Ateliers de la Halle.", "visited": false}, {"id": "hauts-de-france-20", "name": "L’Être Lieu", "city": "Arras", "address": "21 boulevard Carnot, 62000 Arras", "description": "Structure de résidences d’artistes liée à la Cité scolaire Gambetta-Carnot et impliquée dans des projets éditoriaux et d’expositions.", "visited": false}, {"id": "hauts-de-france-21", "name": "Musée des Beaux-Arts d’Arras", "city": "Arras", "address": "22 rue Paul Doumer, 62000 Arras", "description": "Musée situé dans l’abbaye Saint-Vaast, possédant une boutique proposant des ouvrages d’art liés aux collections.", "visited": false}, {"id": "hauts-de-france-22", "name": "Librairie du Labyrinthe", "city": "Amiens", "address": "37 Rue du Hocquet, 80000 Amiens", "description": "Librairie indépendante et maison d’édition spécialisée dans la poésie, le patrimoine régional et les arts visuels.", "visited": false}, {"id": "hauts-de-france-23", "name": "FRAC Picardie", "city": "Amiens", "address": "45 Rue Pointin, 80000 Amiens", "description": "FRAC spécialisé dans le dessin contemporain et les œuvres sur papier, ressource importante pour le livre d’artiste.", "visited": false}, {"id": "hauts-de-france-24", "name": "Musée de Picardie", "city": "Amiens", "address": "2 Rue Puvis de Chavannes, 80000 Amiens", "description": "Grand musée d’Amiens disposant d’une boutique-librairie proposant catalogues et ouvrages d’art liés aux collections.", "visited": false}, {"id": "pays-de-la-loire-1", "name": "FRAC Pays de la Loire", "city": "Carquefou", "address": "24 bis boulevard Ampère, La Fleuriaye, 44470 Carquefou", "description": "Institution publique majeure dédiée à l’art contemporain, disposant d’un pôle de documentation et de médiation actif incluant des coffrets de livres d’artistes diffusés dans les établissements scolaires de la région.", "visited": false}, {"id": "pays-de-la-loire-2", "name": "Cool Paper Zone", "city": "Nantes", "address": "Place Dulcie September, Ateliers, 44000 Nantes", "description": "Librairie associative entièrement dédiée à la micro-édition, aux fanzines et à l’auto-édition. Fonctionne sur un modèle solidaire permettant aux artistes de récupérer 100 % des ventes.", "visited": false}, {"id": "pays-de-la-loire-3", "name": "Librairie Vent d'Ouest au Lieu Unique", "city": "Nantes", "address": "Le Lieu Unique, 2 rue de la Biscuiterie, 44000 Nantes", "description": "Librairie spécialisée située dans le centre d’art du Lieu Unique, proposant une sélection exigeante en art contemporain, architecture, design graphique et micro-édition.", "visited": false}, {"id": "pays-de-la-loire-4", "name": "Maison Fumetti", "city": "Nantes", "address": "La Manufacture, 6 cour Jules Durand, 44000 Nantes", "description": "Association dédiée aux arts graphiques et à la bande dessinée alternative, proposant ateliers d’impression, résidences et événements autour de la micro-édition et du fanzine.", "visited": false}, {"id": "pays-de-la-loire-5", "name": "Librairie HAB Galerie", "city": "Nantes", "address": "21 Quai des Antilles, Hangar à Bananes, 44200 Nantes", "description": "Librairie-boutique liée à la HAB Galerie et au Voyage à Nantes, spécialisée dans l’art contemporain, le design et l’architecture, ouverte pendant les expositions.", "visited": false}, {"id": "pays-de-la-loire-6", "name": "Le Grand Café", "city": "Saint-Nazaire", "address": "2 Place des Quatre Z'Horloges, 44600 Saint-Nazaire", "description": "Centre d’art contemporain d’intérêt national développant une forte politique éditoriale et organisateur du salon Editorama consacré au livre d’art contemporain.", "visited": false}, {"id": "pays-de-la-loire-7", "name": "Librairie L'Oiseau Tempête", "city": "Saint-Nazaire", "address": "20B Rue de la Paix et des Arts, 44600 Saint-Nazaire", "description": "Librairie indépendante reconnue pour ses choix exigeants en littérature, poésie et essais, partenaire régulier du centre d’art Le Grand Café lors d’événements autour du livre.", "visited": false}, {"id": "pays-de-la-loire-8", "name": "Librairie Myriagone", "city": "Angers", "address": "16 rue Bodinier, 49100 Angers", "description": "Librairie indépendante radicale valorisant la micro-édition, les essais critiques et la contre-culture, fonctionnant aussi comme galerie d’art et lieu d’expositions.", "visited": false}, {"id": "pays-de-la-loire-9", "name": "Château de Montsoreau - Musée d'Art Contemporain", "city": "Montsoreau", "address": "Passage du Marquis de Geoffre, 49730 Montsoreau", "description": "Musée d’art conceptuel abritant la collection Art & Language et disposant d’une librairie proposant éditions d’artistes, multiples conceptuels et ouvrages critiques.", "visited": false}, {"id": "pays-de-la-loire-10", "name": "Galerie 5", "city": "Angers", "address": "...", "description": "Espace d’exposition géré par l’Université d’Angers dédié à la jeune création contemporaine et pouvant servir de relais documentaire pour les pratiques artistiques éditoriales.", "visited": false}, {"id": "pays-de-la-loire-11", "name": "Librairie-boutique des Musées d'Angers", "city": "Angers", "address": "...", "description": "Réseau de librairies-boutiques situées dans les musées de la ville (Musée des Beaux-Arts, Musée Jean-Lurçat et Artothèque) proposant catalogues d’exposition et ouvrages liés à la création contemporaine.", "visited": false}, {"id": "pays-de-la-loire-12", "name": "FIAA (Fonds International d'Art Actuel)", "city": "Le Mans", "address": "La Visitation, 1 rue Gambetta, 72000 Le Mans", "description": "Centre d’art contemporain intégrant un fonds documentaire et une salle de lecture dédiée à l’art actuel, permettant la consultation d’ouvrages et catalogues spécialisés.", "visited": false}, {"id": "pays-de-la-loire-13", "name": "Librairie Bulle", "city": "Le Mans", "address": "13 rue de la Barillerie, 72000 Le Mans", "description": "Librairie spécialisée reconnue nationalement pour la bande dessinée, les arts graphiques et l’illustration contemporaine.", "visited": false}, {"id": "pays-de-la-loire-14", "name": "Librairie Thuard", "city": "Le Mans", "address": "...", "description": "Librairie indépendante généraliste de référence au Mans, réputée pour son exigence éditoriale et l’organisation régulière de rencontres avec auteurs et artistes.", "visited": false}, {"id": "ile-de-france-1", "name": "MAC VAL", "city": "Vitry-sur-Seine", "address": "Place de la Libération, 94400 Vitry-sur-Seine", "description": "Musée d'art contemporain du Val-de-Marne avec un centre de documentation important accueillant livres d'artistes et micro-éditions.", "visited": false}, {"id": "ile-de-france-2", "name": "CNEAI (Centre national édition art image)", "city": "Pantin", "address": "1 rue de l'Ancien Canal", "description": "Institution spécialisée dans l’édition d’art et les multiples, conservant une importante collection de livres d’artistes et fanzines.", "visited": false}, {"id": "ile-de-france-3", "name": "Le Crédac", "city": "Ivry-sur-Seine", "address": "1 place Pierre Gosnat, 94200 Ivry-sur-Seine", "description": "Centre d’art contemporain avec une forte culture éditoriale et une boutique proposant des éditions d’artistes.", "visited": false}, {"id": "ile-de-france-4", "name": "La Galerie", "city": "Noisy-le-Sec", "address": "1 rue Jean Jaurès", "description": "Centre d’art contemporain produisant des micro-éditions et des journaux d’exposition liés aux pratiques graphiques.", "visited": false}, {"id": "ile-de-france-5", "name": "Centre Tignous d’Art Contemporain", "city": "Montreuil", "address": "116 rue de Paris", "description": "Centre d’art avec artothèque et espaces de consultation permettant d’intégrer des éditions d’artistes.", "visited": false}, {"id": "ile-de-france-6", "name": "CAC Brétigny", "city": "Brétigny-sur-Orge", "address": "Rue Henri Douard, 91220 Brétigny-sur-Orge", "description": "Centre d’art contemporain reconnu pour sa programmation conceptuelle et son intérêt pour le design graphique et les objets éditoriaux.", "visited": false}, {"id": "ile-de-france-7", "name": "La Ferme du Buisson", "city": "Noisiel", "address": "Allée de la Ferme, 77186 Noisiel", "description": "Centre d’art et scène nationale avec un espace boutique accueillant micro-éditions et productions artistiques.", "visited": false}, {"id": "ile-de-france-8", "name": "Les Églises - Centre d'art contemporain de Chelles", "city": "Chelles", "address": "", "description": "Centre d’art contemporain installé dans un ancien édifice religieux avec espace de documentation et éditions liées aux expositions.", "visited": false}, {"id": "ile-de-france-9", "name": "MABA (Maison d’Art Bernard Anthonioz)", "city": "Nogent-sur-Marne", "address": "", "description": "Centre d’art de la Fondation des Artistes avec une forte relation au design graphique et à l’édition.", "visited": false}, {"id": "ile-de-france-10", "name": "Les Laboratoires d'Aubervilliers", "city": "Aubervilliers", "address": "41 rue Lécuyer", "description": "Lieu de recherche artistique soutenant activement la micro-édition, les fanzines et les pratiques expérimentales.", "visited": false}, {"id": "ile-de-france-11", "name": "Laurel Parker Book", "city": "Romainville", "address": "43 rue de la Commune de Paris", "description": "Atelier, librairie et espace d’exposition spécialisé dans la reliure d’art et les livres d’artistes sculpturaux.", "visited": false}, {"id": "ile-de-france-12", "name": "Mains d’Œuvres", "city": "Saint-Ouen", "address": "1 rue Charles Garnier", "description": "Grand tiers-lieu culturel indépendant lié aux scènes DIY, musicales et aux distributions alternatives de fanzines.", "visited": false}, {"id": "ile-de-france-13", "name": "La Marbrerie", "city": "Montreuil", "address": "", "description": "Salle de concert et lieu culturel hybride accueillant marchés de créateurs, expositions et lancements de publications.", "visited": false}, {"id": "ile-de-france-14", "name": "Le Générateur", "city": "Gentilly", "address": "16 rue Charles Frérot", "description": "Lieu dédié à la performance contemporaine avec une activité éditoriale documentant les pratiques expérimentales.", "visited": false}, {"id": "ile-de-france-15", "name": "Anis Gras - Le Lieu de l’Autre", "city": "Arcueil", "address": "", "description": "Ancienne distillerie transformée en lieu artistique accueillant résidences, expositions et événements culturels.", "visited": false}, {"id": "ile-de-france-16", "name": "Librairie Zenobi", "city": "Malakoff", "address": "50 avenue Pierre Larousse", "description": "Librairie indépendante engagée spécialisée en art, architecture, écologie et publications critiques.", "visited": false}, {"id": "ile-de-france-17", "name": "Librairie Zeugma", "city": "Montreuil", "address": "7 avenue Walwein", "description": "Librairie indépendante reconnue pour sa sélection exigeante et son ouverture aux petites maisons d’édition.", "visited": false}, {"id": "ile-de-france-18", "name": "Libertalia", "city": "Montreuil", "address": "12 rue Marcelin Berthelot", "description": "Maison d’édition et librairie engagée spécialisée dans les luttes sociales, l’histoire populaire et les textes radicaux.", "visited": false}, {"id": "ile-de-france-19", "name": "Folies d’Encre", "city": "Montreuil", "address": "9 avenue de la Résistance", "description": "Librairie indépendante historique soutenant l’édition indépendante et la scène culturelle locale.", "visited": false}, {"id": "ile-de-france-20", "name": "L'Établi", "city": "Alfortville", "address": "8 rue Jules Cuillerier", "description": "Librairie indépendante dynamique accueillant rencontres, expositions et événements liés aux cultures visuelles.", "visited": false}, {"id": "ile-de-france-21", "name": "Mots et Motions", "city": "Noisy-le-Grand", "address": "", "description": "Librairie indépendante assurant une diffusion éditoriale de qualité dans l’est de l’Île-de-France.", "visited": false}, {"id": "ile-de-france-22", "name": "La Vagabonde", "city": "Versailles", "address": "40 rue d'Anjou", "description": "Librairie indépendante hébergeant la Bibliothèque Vagabonde, dispositif dédié à la présentation de livres d’artistes.", "visited": false}, {"id": "ile-de-france-23", "name": "Ygrec-ENSAPC", "city": "Aubervilliers", "address": "29 rue Henri Barbusse", "description": "Espace lié à l’École nationale supérieure d’arts de Paris-Cergy, sensible aux projets éditoriaux expérimentaux.", "visited": false}, {"id": "ile-de-france-24", "name": "Komunuma", "city": "Romainville", "address": "", "description": "Quartier culturel accueillant fondations, galeries et ateliers liés à la création contemporaine et à l’édition.", "visited": false}, {"id": "ile-de-france-25", "name": "Librairie Lame", "city": "Saint-Denis", "address": "", "description": "Librairie spécialisée dans le livre photo, les fanzines, la micro-édition et les publications d’artistes.", "visited": false}, {"id": "bretagne-1", "name": "Librairie du FRAC Bretagne", "city": "Rennes", "address": "Quartier Beauregard", "description": "Librairie spécialisée du FRAC Bretagne proposant catalogues, essais et livres d'artistes liés à la collection et aux expositions du fonds régional d'art contemporain.", "visited": false}, {"id": "bretagne-2", "name": "La Criée centre d'art contemporain", "city": "Rennes", "address": "Place Honoré Commeurec", "description": "Centre d'art contemporain avec espace boutique-librairie diffusant éditions d'expositions, revues et projets éditoriaux expérimentaux.", "visited": false}, {"id": "bretagne-3", "name": "L'Endroit Édition", "city": "Rennes", "address": "5 rue de la Parcheminerie", "description": "Maison d’édition, librairie spécialisée et galerie consacrée à l’art imprimé, aux fanzines, multiples et micro-éditions.", "visited": false}, {"id": "bretagne-4", "name": "Blindspot", "city": "Rennes", "address": "36 rue Poullain Duparc", "description": "Disquaire et librairie alternative diffusant micro-éditions, sérigraphies, fanzines et graphzines dans une esthétique underground.", "visited": false}, {"id": "bretagne-5", "name": "L'Antre Temps", "city": "Rennes", "address": "45 rue de la Parcheminerie", "description": "Atelier-galerie mêlant art contemporain et artisanat d’art, exposant régulièrement éditions d’artistes et petits formats.", "visited": false}, {"id": "bretagne-6", "name": "L'Atelier du Bourg", "city": "Rennes", "address": "", "description": "Collectif d'artistes travaillant autour de la sérigraphie et de la micro-édition, produisant livres d’artistes, fanzines et éditions limitées.", "visited": false}, {"id": "bretagne-7", "name": "Le Volume", "city": "Vern-sur-Seiche", "address": "3 rue François Rabelais", "description": "Espace culturel et médiathèque accueillant expositions, résidences et activités de médiation pouvant intégrer des livres d’artistes.", "visited": false}, {"id": "bretagne-8", "name": "Passerelle Centre d’art contemporain", "city": "Brest", "address": "41 rue Charles Berthelot", "description": "Centre d’art contemporain d’intérêt national avec librairie spécialisée diffusant monographies, catalogues et éditions d’artistes.", "visited": false}, {"id": "bretagne-9", "name": "La PAM – Musée vivant de l’Imprimerie", "city": "Brest", "address": "", "description": "Tiers-lieu installé dans une ancienne imprimerie proposant ateliers d’impression, édition artisanale et diffusion de livres d’artistes.", "visited": false}, {"id": "bretagne-10", "name": "Kuuutch", "city": "Brest", "address": "17 rue Fautras", "description": "Boutique d’édition alternative et galerie dédiée à la risographie, aux affiches et aux fanzines d’artistes locaux.", "visited": false}, {"id": "bretagne-11", "name": "Bad Seeds Recordshop", "city": "Brest", "address": "17 rue Fautras", "description": "Disquaire indépendant associé à Kuuutch, participant à la diffusion de micro-éditions et projets graphiques alternatifs.", "visited": false}, {"id": "bretagne-12", "name": "Dialogues Beaux-Arts", "city": "Brest", "address": "37 rue Louis Pasteur", "description": "Grande librairie spécialisée en art, photographie et design, attirant un public large d’étudiants et collectionneurs.", "visited": false}, {"id": "bretagne-13", "name": "Galerie Le Lieu", "city": "Lorient", "address": "Hôtel Gabriel - Aile Est, Enclos du Port", "description": "Galerie photographique et bibliothèque spécialisée disposant d’un important fonds de livres d’auteurs et d’auto-éditions.", "visited": false}, {"id": "bretagne-14", "name": "Librairie Comme dans les livres", "city": "Lorient", "address": "", "description": "Librairie indépendante généraliste avec un rayon dédié aux beaux-livres, aux arts graphiques et à l’édition indépendante.", "visited": false}, {"id": "bretagne-15", "name": "Ma Première Galerie", "city": "Quimper", "address": "23 rue de la Providence", "description": "Galerie contemporaine soutenant des artistes locaux et accueillant ponctuellement fanzines et micro-éditions.", "visited": false}, {"id": "bretagne-16", "name": "Librairie Ravy", "city": "Quimper", "address": "", "description": "Grande librairie indépendante avec un rayon important consacré aux arts graphiques, à la photographie et à l’architecture.", "visited": false}, {"id": "bretagne-17", "name": "L'Atelier d'Album", "city": "Quimper", "address": "", "description": "Atelier d’artisanat spécialisé dans la tapisserie et le design, illustrant l’intérêt local pour l’objet artistique et les créations matérielles.", "visited": false}, {"id": "bretagne-18", "name": "Librairie Cheminant", "city": "Vannes", "address": "", "description": "Grande librairie indépendante avec section arts et spectacles accueillant ouvrages d’art et essais visuels.", "visited": false}, {"id": "bretagne-19", "name": "Librairie Le Silence de la Mer", "city": "Vannes", "address": "5 place Saint-Pierre", "description": "Librairie indépendante reconnue pour sa sélection pointue et son accueil personnalisé des auteurs.", "visited": false}, {"id": "bretagne-20", "name": "Domaine de Kerguéhennec", "city": "Bignan", "address": "", "description": "Centre d’art contemporain et domaine patrimonial proposant expositions, médiation culturelle et édition d’ouvrages artistiques.", "visited": false}, {"id": "bretagne-21", "name": "Les Moyens du Bord", "city": "Morlaix", "address": "Manufacture des Tabacs, 41 Quai du Léon", "description": "Association artistique avec boutique solidaire et artothèque diffusant œuvres, affiches et livres d’artistes.", "visited": false}, {"id": "bretagne-22", "name": "La Maison des Bulles", "city": "Morlaix", "address": "", "description": "Projet de librairie hybride dédiée à la bande dessinée et aux micro-éditions graphiques.", "visited": false}, {"id": "bretagne-23", "name": "La Galerie / Forum des Champs", "city": "Saint-Brieuc", "address": "1 rue Saint-François", "description": "Espace dédié aux estampes, multiples graphiques et beaux livres d’art, lié à la librairie Le Forum des Champs.", "visited": false}, {"id": "bretagne-24", "name": "La Grande Passerelle", "city": "Saint-Malo", "address": "2 rue Nicolas Bouvier", "description": "Grand pôle culturel regroupant cinéma, espaces d’exposition et médiathèque pouvant acquérir livres d’artistes.", "visited": false}, {"id": "bretagne-25", "name": "Le Porte-Plume Malouin", "city": "Saint-Malo", "address": "", "description": "Librairie indépendante avec rayons beaux-arts, sciences humaines et papeterie créative.", "visited": false}, {"id": "bretagne-26", "name": "Centre Cristel Éditeur d'Art", "city": "Saint-Malo", "address": "9 boulevard de la Tour d’Auvergne", "description": "Centre d’art privé spécialisé dans les estampes et éditions d’art moderne et contemporain.", "visited": false}, {"id": "bretagne-27", "name": "Strandflat Editions", "city": "Saint-Malo", "address": "", "description": "Maison d’édition et réseau DIY dédié aux fanzines, micro-éditions et recherches autour de la culture zine.", "visited": false}, {"id": "nouvelle-aquitaine-1", "name": "FRAC Nouvelle-Aquitaine MÉCA", "city": "Bordeaux", "address": "5 parvis Corto Maltese, 33088 Bordeaux", "description": "Fonds régional d'art contemporain situé dans la MÉCA, avec boutique spécialisée et politique active d’édition et de diffusion d’art contemporain.", "visited": false}, {"id": "nouvelle-aquitaine-2", "name": "CAPC Musée d'art contemporain", "city": "Bordeaux", "address": "7 rue Ferrère, 33000 Bordeaux", "description": "Institution majeure de l’art contemporain installée dans l’Entrepôt Lainé, avec librairie-boutique spécialisée dans les catalogues et livres d’artistes.", "visited": false}, {"id": "nouvelle-aquitaine-3", "name": "La Mauvaise Réputation", "city": "Bordeaux", "address": "19 rue des Argentiers, 33000 Bordeaux", "description": "Librairie-galerie indépendante dédiée à la culture graphique underground, au livre d’artiste, au fanzine et à l’illustration contemporaine.", "visited": false}, {"id": "nouvelle-aquitaine-4", "name": "Disparate", "city": "Bordeaux", "address": "99 rue de Bègles, 33800 Bordeaux", "description": "Association et espace de diffusion de micro-édition et fanzines fonctionnant en dépôt-vente solidaire et organisant le Zinefest.", "visited": false}, {"id": "nouvelle-aquitaine-5", "name": "Librairie Mollat", "city": "Bordeaux", "address": "15 rue Vital-Carles, 33000 Bordeaux", "description": "Plus grande librairie indépendante de France, avec rayon spécialisé en arts graphiques, design, architecture et édition d’art.", "visited": false}, {"id": "nouvelle-aquitaine-6", "name": "Les arts au mur artothèque", "city": "Pessac", "address": "Pessac, Gironde", "description": "Artothèque consacrée au prêt d’œuvres et à l’organisation d’expositions, intégrant des éditions et multiples dans ses collections.", "visited": false}, {"id": "nouvelle-aquitaine-7", "name": "FRAC Poitou-Charentes", "city": "Angoulême", "address": "63 boulevard Besson Bey, 16000 Angoulême", "description": "Fonds régional d’art contemporain développant une collection et des programmes de médiation liés aux arts graphiques et à l’édition.", "visited": false}, {"id": "nouvelle-aquitaine-8", "name": "Librairie Cosmopolite", "city": "Angoulême", "address": "Galerie du Champ de Mars, 16000 Angoulême", "description": "Grande librairie indépendante de référence à Angoulême, avec rayons dédiés aux arts visuels, graphisme et bande dessinée.", "visited": false}, {"id": "nouvelle-aquitaine-9", "name": "La Fanzinothèque", "city": "Poitiers", "address": "185 rue du Faubourg du Pont Neuf, 86000 Poitiers", "description": "Centre d’archives mondial dédié au fanzine et à la micro-édition, distribuant également les ouvrages sans commission.", "visited": false}, {"id": "nouvelle-aquitaine-10", "name": "Plage 76", "city": "Poitiers", "address": "76 rue de la Cathédrale, 86000 Poitiers", "description": "Galerie-boutique coopérative réunissant artistes et créateurs et proposant objets éditoriaux, design et éditions indépendantes.", "visited": false}, {"id": "nouvelle-aquitaine-11", "name": "Atelier Bletterie", "city": "La Rochelle", "address": "Quartier historique, 17000 La Rochelle", "description": "Association gérant ateliers d’artistes et galerie d’art contemporain, accueillant expositions et objets éditoriaux hybrides.", "visited": false}, {"id": "nouvelle-aquitaine-12", "name": "Centre des livres d'artistes (CDLA)", "city": "Saint-Yrieix-la-Perche", "address": "1 place Attane, 87500 Saint-Yrieix-la-Perche", "description": "Institution internationale consacrée exclusivement au livre d’artiste, conservant une collection majeure et organisant expositions et résidences.", "visited": false}, {"id": "nouvelle-aquitaine-13", "name": "Frac-Artothèque Nouvelle-Aquitaine", "city": "Limoges", "address": "17 bis rue Charles Michels, 87000 Limoges", "description": "FRAC hybride fonctionnant aussi comme artothèque permettant le prêt d’œuvres et multiples aux particuliers et institutions.", "visited": false}, {"id": "nouvelle-aquitaine-14", "name": "LAC&S - Lavitrine", "city": "Limoges", "address": "4 rue Raspail, 87000 Limoges", "description": "Galerie associative soutenant la jeune création et organisant expositions et projets liés aux arts visuels contemporains.", "visited": false}, {"id": "nouvelle-aquitaine-15", "name": "Librairie Page et Plume", "city": "Limoges", "address": "4 place de la Motte, 87000 Limoges", "description": "Librairie indépendante historique avec un important rayon beaux-arts, architecture, photographie et revues spécialisées.", "visited": false}, {"id": "nouvelle-aquitaine-16", "name": "Le Bel Ordinaire", "city": "Billère", "address": "Les Abattoirs, Allée Montesquieu, 64140 Billère", "description": "Centre d’art contemporain de l’agglomération de Pau, accueillant expositions, résidences et projets éditoriaux.", "visited": false}, {"id": "nouvelle-aquitaine-17", "name": "Villa Beatrix Enea", "city": "Anglet", "address": "2 rue Albert-le-Barillier, 64600 Anglet", "description": "Centre d’art contemporain installé dans une villa Belle Époque accueillant expositions et documentation liée aux artistes exposés.", "visited": false}, {"id": "nouvelle-aquitaine-18", "name": "Librairie Hirigoyen", "city": "Bayonne", "address": "Bayonne, Pyrénées-Atlantiques", "description": "Librairie indépendante très active organisant signatures et expositions pour défendre la création éditoriale contemporaine.", "visited": false}, {"id": "nouvelle-aquitaine-19", "name": "Bookstore BD & Jeunesse", "city": "Biarritz", "address": "13 rue Poste, 64200 Biarritz", "description": "Librairie spécialisée dans la bande dessinée, l’illustration et les arts visuels contemporains.", "visited": false}, {"id": "nouvelle-aquitaine-20", "name": "Le Second Jeudi (Station V)", "city": "Bayonne", "address": "Bayonne, Pyrénées-Atlantiques", "description": "Lieu d’exposition et espace artistique accueillant événements et présentations d’art contemporain.", "visited": false}, {"id": "nouvelle-aquitaine-21", "name": "Musée départemental d'art contemporain de Rochechouart", "city": "Rochechouart", "address": "Château de Rochechouart, 87600 Rochechouart", "description": "Musée d’art contemporain installé dans un château médiéval, possédant notamment des archives liées aux avant-gardes artistiques.", "visited": false}, {"id": "nouvelle-aquitaine-22", "name": "Musée du pays d'Ussel", "city": "Ussel", "address": "Ussel, Corrèze", "description": "Musée développant des activités autour des arts du livre avec atelier de lithographie et de typographie.", "visited": false}, {"id": "nouvelle-aquitaine-23", "name": "Centre d'art contemporain de l'Abbaye Saint André", "city": "Meymac", "address": "Place de l'Église, 19250 Meymac", "description": "Centre d’art contemporain installé dans une abbaye, organisant expositions et projets curatoriaux.", "visited": false}, {"id": "nouvelle-aquitaine-24", "name": "Librairie Vivre d'Art", "city": "Meymac", "address": "4 rue du Four, 19250 Meymac", "description": "Librairie spécialisée en art contemporain située près du centre d’art de Meymac.", "visited": false}, {"id": "nouvelle-aquitaine-25", "name": "Librairie Aux Bavardages", "city": "Poitiers", "address": "Poitiers, Vienne", "description": "Librairie indépendante de Poitiers reconnue pour son rôle prescripteur dans la scène culturelle locale.", "visited": false}, {"id": "nouvelle-aquitaine-26", "name": "Librairie Rêv'en Pages", "city": "Limoges", "address": "Rue Othon Péconnet, 87000 Limoges", "description": "Librairie indépendante participant au réseau culturel limougeaud.", "visited": false}, {"id": "nouvelle-aquitaine-27", "name": "Le Bibliovore", "city": "Limoges", "address": "Rue Fourie, 87000 Limoges", "description": "Librairie dédiée à l’économie circulaire du livre et aux ouvrages de seconde main.", "visited": false}, {"id": "nouvelle-aquitaine-28", "name": "Chez Simone", "city": "Bayonne", "address": "Quartier Saint-Esprit, Bayonne", "description": "Galerie-librairie d’art proposant expositions et ouvrages liés à la création contemporaine.", "visited": false}, {"id": "nouvelle-aquitaine-29", "name": "Le 5e Art", "city": "Saint-Jean-de-Luz", "address": "Saint-Jean-de-Luz, Pyrénées-Atlantiques", "description": "Librairie indépendante dynamique organisant rencontres et événements autour du livre et des arts visuels.", "visited": false}, {"id": "nouvelle-aquitaine-30", "name": "Chabram2", "city": "Bellevigne", "address": "Bellevigne, Charente", "description": "Association transformant d’anciennes écoles en centres d’art contemporains en milieu rural.", "visited": false}];
const RAW_ITINERARIES = [{ "id": "troncon-1", "name": "De Gratens à Montpellier", "url": "https://www.google.com/maps/dir/2165%20route%20du%20Bois%20de%20la%20pierre%2C%2031430%20Gratens/76%20All%C3%A9es%20Charles%20de%20Fitte%2C%2031300%20Toulouse/50%20Rue%20L%C3%A9on%20Gambetta%2C%2031000%20Toulouse/31000%20Toulouse/R%C3%A9gion%20de%20Toulouse/5%20Rue%20de%20l%27%C3%89cole%20Normale%2C%2081000%20Albi/81000%20Albi/4%20Rue%20Rambaud%2C%2034000%20Montpellier/14%20Rue%20de%20l%27%C3%89cole%20de%20Pharmacie%2C%2034000%20Montpellier/15%20Rue%20La%20Fontaine%2C%2034000%20Montpellier", "stops": ["start-0", "occitanie-24", "occitanie-25", "occitanie-26", "occitanie-27", "occitanie-22", "occitanie-23", "occitanie-5", "occitanie-6", "occitanie-7"] }, { "id": "troncon-2", "name": "De Montpellier à Sigean", "url": "https://www.google.com/maps/dir/15%20Rue%20La%20Fontaine%2C%2034000%20Montpellier/2%20Rue%20du%20Bayle%2C%2034000%20Montpellier/27%20Rue%20Fr%C3%A9d%C3%A9ric%20Peyson%2C%2034000%20Montpellier/39%20Boulevard%20Bonne%20Nouvelle%2C%2034000%20Montpellier/13%20Boulevard%20du%20Jeu%20de%20Paume%2C%2034000%20Montpellier/26%20Quai%20Aspirant%20Herber%2C%2034200%20S%C3%A8te/7%20Rue%20Gambetta%2C%2034200%20S%C3%A8te/34200%20S%C3%A8te/146%20Avenue%20de%20la%20Plage%2C%2034410%20S%C3%A9rignan/4%20Rue%20de%20la%20Cave%20Coop%C3%A9rative%2C%2011130%20Sigean", "stops": ["occitanie-7", "occitanie-8", "occitanie-9", "occitanie-10", "occitanie-11", "occitanie-12", "occitanie-13", "occitanie-14", "occitanie-15", "occitanie-16"] }, { "id": "troncon-3", "name": "De Sigean à Perpignan", "url": "https://www.google.com/maps/dir/4%20Rue%20de%20la%20Cave%20Coop%C3%A9rative%2C%2011130%20Sigean/Rue%20de%20la%20Mairie%2C%2011170%20Montolieu/11170%20Montolieu/11170%20Montolieu/Place%20de%20la%20Maison%20Carr%C3%A9e%2C%2030000%20N%C3%AEmes/Rue%20R%C3%A9gale%2C%2030000%20N%C3%AEmes/30000%20N%C3%AEmes/30000%20N%C3%AEmes/10%20Rue%20Mailly%2C%2066000%20Perpignan/3%20Avenue%20de%20Grande%20Bretagne%2C%2066000%20Perpignan", "stops": ["occitanie-16", "occitanie-17", "occitanie-18", "occitanie-19", "occitanie-1", "occitanie-2", "occitanie-3", "occitanie-4", "occitanie-20", "occitanie-21"] }, { "id": "troncon-4", "name": "De Perpignan à Marseille", "url": "https://www.google.com/maps/dir/3%20Avenue%20de%20Grande%20Bretagne%2C%2066000%20Perpignan/20%20boulevard%20de%20Dunkerque%2C%2013002%20Marseille/1%20esplanade%20J4%2C%2013002%20Marseille/1%20esplanade%20J4%2C%2013002%20Marseille/1%20esplanade%20J4%2C%2013002%20Marseille/69%20avenue%20d%E2%80%99Ha%C3%AFfa%2C%2013008%20Marseille/8%20rue%20Vian%2C%2013006%20Marseille/Friche%20la%20Belle%20de%20Mai%2C%2041%20rue%20Jobin%2C%2013003%20Marseille/Friche%20la%20Belle%20de%20Mai%2C%2041%20rue%20Jobin%2C%2013003%20Marseille/33%20all%C3%A9e%20L%C3%A9on%20Gambetta%2C%2013001%20Marseille", "stops": ["occitanie-21", "paca-1", "paca-2", "paca-3", "paca-4", "paca-5", "paca-6", "paca-7", "paca-8", "paca-9"] }, { "id": "troncon-5", "name": "De Marseille à Nice", "url": "https://www.google.com/maps/dir/33%20all%C3%A9e%20L%C3%A9on%20Gambetta%2C%2013001%20Marseille/7e%20arrondissement%2C%20Marseille/35%20avenue%20Victor%20Hugo%2C%2013200%20Arles/Librairie%20du%20Palais%2C%20Arles/11%20rue%20R%C3%A9attu%2C%2013200%20Arles/Place%20Nina%20Berberova%2C%2013200%20Arles/5%20rue%20Violette%2C%2084000%20Avignon/La%20Caravane%20des%20Cr%C3%A9ateurs%2C%20Saint-R%C3%A9my-de-Provence/20%20avenue%20Stephen%20Li%C3%A9geard%2C%2006105%20Nice/46%20boulevard%20Risso%2C%2006300%20Nice", "stops": ["paca-9", "paca-10", "paca-12", "paca-13", "paca-14", "paca-15", "paca-22", "paca-25", "paca-16", "paca-17"] }, { "id": "troncon-6", "name": "De Nice à Ajaccio", "url": "https://www.google.com/maps/dir/46%20boulevard%20Risso%2C%2006300%20Nice/Place%20Yves%20Klein%2C%2006300%20Nice/Evrlst%20Lifestore%2C%20Nice/Shababik%2C%20Nice/Ose%20D%C3%A9coration%2C%20Nice/Le%20Metaxu%2C%20Toulon/Mont%C3%A9e%20Noailles%2C%2083400%20Hy%C3%A8res/50-52%20Rue%20Cardinal%20Fesch%2C%2020000%20Ajaccio/Citadelle%20Miollis%2C%20Boulevard%20Fred%20Scamaroni%2C%2020000%20Ajaccio/Rue%20Montenotte%2C%20Tour%20Napol%C3%A9on%2C%2020000%20Ajaccio", "stops": ["paca-17", "paca-18", "paca-19", "paca-20", "paca-21", "paca-24", "paca-23", "corse-3", "corse-11", "corse-12"] }, { "id": "troncon-7", "name": "De Ajaccio à Bastia", "url": "https://www.google.com/maps/dir/Rue%20Montenotte%2C%20Tour%20Napol%C3%A9on%2C%2020000%20Ajaccio/1%20Rue%20Barri%C3%A8re%2C%2020000%20Ajaccio/4%20Rue%20Emmanuel%20Ar%C3%A8ne%2C%2020000%20Ajaccio/2%20Place%20Foch%2C%2020000%20Ajaccio/Ajaccio/Palais%20des%20Gouverneurs%2C%20Citadelle%2C%2020200%20Bastia/Place%20du%20March%C3%A9%2C%2020200%20Bastia/27%20Boulevard%20Paoli%2C%2020200%20Bastia/10%20Rue%20Napol%C3%A9on%20%2F%208%20Boulevard%20Paoli%2C%2020200%20Bastia/Centre%20Commercial%20Le%20Polygone%2C%20Bastia", "stops": ["corse-12", "corse-13", "corse-14", "corse-15", "corse-19", "corse-4", "corse-7", "corse-16", "corse-17", "corse-18"] }, { "id": "troncon-8", "name": "De Bastia à Calvi", "url": "https://www.google.com/maps/dir/Centre%20Commercial%20Le%20Polygone%2C%20Bastia/La%20Citadelle%2C%2020250%20Corti/Citadelle%20de%20Corte/Rue%20Croce%2C%2020100%20Sart%C3%A8ne/Caserne%20Montlaur%2C%20Haute%20Ville%20de%20Bonifacio/18%20Rue%20Camille%20de%20Rocca%20Serra%2C%2020137%20Porto-Vecchio/17%20Rue%20G%C3%A9n%C3%A9ral%20de%20Gaulle%2C%2020137%20Porto-Vecchio/Porto-Vecchio/Citadelle%20de%20Calvi%2C%2020260%20Calvi/Route%20de%20Pietramaggiore%2C%2020260%20Calvi", "stops": ["corse-18", "corse-1", "corse-2", "corse-5", "corse-10", "corse-8", "corse-9", "corse-22", "corse-6", "corse-21"] }, { "id": "troncon-9", "name": "De Calvi à Lyon", "url": "https://www.google.com/maps/dir/Route%20de%20Pietramaggiore%2C%2020260%20Calvi/Propriano/8%20esplanade%20Andry%20Farcy%2C%2038000%20Grenoble/6%20rue%20Lakanal%2C%2038000%20Grenoble/5%20place%20de%20Lavalette%2C%2038000%20Grenoble/Gibert%20Joseph%20Grenoble%2C%20Grenoble/Librairie%20Arthaud%2C%20Grenoble/Librairie%20Le%20Square%2C%20Grenoble/Librairie%20Lame%2C%20Lyon/17%20rue%20Neuve%2C%2069001%20Lyon", "stops": ["corse-21", "corse-20", "auvergne-rhone-alpes-16", "auvergne-rhone-alpes-17", "auvergne-rhone-alpes-18", "auvergne-rhone-alpes-19", "auvergne-rhone-alpes-20", "auvergne-rhone-alpes-21", "auvergne-rhone-alpes-1", "auvergne-rhone-alpes-2"] }, { "id": "troncon-10", "name": "De Lyon à Saint-Étienne", "url": "https://www.google.com/maps/dir/17%20rue%20Neuve%2C%2069001%20Lyon/21%20place%20des%20Terreaux%2C%2069001%20Lyon/15%20bis%20rue%20de%20la%20Thibaudi%C3%A8re%2C%2069007%20Lyon/10%20rue%20Neyret%2C%2069001%20Lyon/11%20rue%20Docteur%20Dolard%2C%2069100%20Villeurbanne/207%20rue%20Francis-de-Pressens%C3%A9%2C%2069100%20Villeurbanne/Cit%C3%A9%20Internationale%2C%2081%20quai%20Charles%20de%20Gaulle%2C%2069006%20Lyon/56-60%20avenue%20de%20B%C3%B6hlen%2C%2069120%20Vaulx-en-Velin/25%20avenue%20des%20Fr%C3%A8res%20Lumi%C3%A8re%2C%2069008%20Lyon/14%20rue%20Marius%20Patinaud%2C%2042000%20Saint-%C3%89tienne", "stops": ["auvergne-rhone-alpes-2", "auvergne-rhone-alpes-3", "auvergne-rhone-alpes-4", "auvergne-rhone-alpes-5", "auvergne-rhone-alpes-6", "auvergne-rhone-alpes-7", "auvergne-rhone-alpes-8", "auvergne-rhone-alpes-9", "auvergne-rhone-alpes-10", "auvergne-rhone-alpes-11"] }, { "id": "troncon-11", "name": "De Saint-Étienne à Ambert", "url": "https://www.google.com/maps/dir/14%20rue%20Marius%20Patinaud%2C%2042000%20Saint-%C3%89tienne/Rue%20Fernand%20L%C3%A9ger%2C%2042270%20Saint-Priest-en-Jarez/Rue%20Fernand%20L%C3%A9ger%2C%2042270%20Saint-Priest-en-Jarez/2-8%20Arcades%20de%20l%E2%80%99H%C3%B4tel%20de%20Ville%2C%2042000%20Saint-%C3%89tienne/5%20rue%20Michel%20Rondet%2C%2042000%20Saint-%C3%89tienne/6%20rue%20du%20Terrail%2C%2063000%20Clermont-Ferrand/34%20rue%20des%20Gras%2C%2063000%20Clermont-Ferrand/Les%20%C3%A9ditions%20de%20la%20derni%C3%A8re%20chance%2C%20Clermont-Ferrand/80%20boulevard%20Fran%C3%A7ois%20Mitterrand%2C%2063000%20Clermont-Ferrand/23%20rue%20des%20Chazeaux%2C%2063600%20Ambert", "stops": ["auvergne-rhone-alpes-11", "auvergne-rhone-alpes-12", "auvergne-rhone-alpes-13", "auvergne-rhone-alpes-14", "auvergne-rhone-alpes-15", "auvergne-rhone-alpes-22", "auvergne-rhone-alpes-23", "auvergne-rhone-alpes-24", "auvergne-rhone-alpes-25", "auvergne-rhone-alpes-26"] }, { "id": "troncon-12", "name": "De Ambert à Dijon", "url": "https://www.google.com/maps/dir/23%20rue%20des%20Chazeaux%2C%2063600%20Ambert/27%20rue%20Franche%2C%2071000%20M%C3%A2con/Place%20Saint-Pierre%2C%2071000%20M%C3%A2con/28%20quai%20des%20Messageries%2C%2071100%20Chalon-sur-Sa%C3%B4ne/3%20rue%20des%20Tonneliers%2C%2071100%20Chalon-sur-Sa%C3%B4ne/Espace%20des%20Arts%2C%20Chalon-sur-Sa%C3%B4ne/37%20rue%20de%20Longvic%2C%2021000%20Dijon/16%20rue%20Quentin%2C%2021000%20Dijon/71-73%20rue%20des%20Rotondes%2C%2021000%20Dijon/12%20rue%20Chancelier%20de%20l%27Hospital%2C%2021000%20Dijon", "stops": ["auvergne-rhone-alpes-26", "bourgogne-franche-comte-26", "bourgogne-franche-comte-27", "bourgogne-franche-comte-23", "bourgogne-franche-comte-24", "bourgogne-franche-comte-25", "bourgogne-franche-comte-1", "bourgogne-franche-comte-2", "bourgogne-franche-comte-3", "bourgogne-franche-comte-4"] }, { "id": "troncon-13", "name": "De Dijon à Dijon", "url": "https://www.google.com/maps/dir/12%20rue%20Chancelier%20de%20l%27Hospital%2C%2021000%20Dijon/29%20rue%20Charles%20Dumont%2C%2021000%20Dijon/9%20boulevard%20de%20l%27Europe%2C%2021800%20Quetigny/75%20avenue%20Jean%20Jaur%C3%A8s%2C%2021000%20Dijon/14%20rue%20du%20Ch%C3%A2teau%2C%2021000%20Dijon/Passage%20Darcy%2C%2021000%20Dijon/Rue%20des%20Godrans%2C%2021000%20Dijon/Rue%20des%20Godrans%2C%2021000%20Dijon/Place%20de%20la%20R%C3%A9publique%2C%2021000%20Dijon/Rue%20Berbisey%2C%2021000%20Dijon", "stops": ["bourgogne-franche-comte-4", "bourgogne-franche-comte-5", "bourgogne-franche-comte-6", "bourgogne-franche-comte-7", "bourgogne-franche-comte-8", "bourgogne-franche-comte-9", "bourgogne-franche-comte-10", "bourgogne-franche-comte-11", "bourgogne-franche-comte-12", "bourgogne-franche-comte-13"] }, { "id": "troncon-14", "name": "De Dijon à Besançon", "url": "https://www.google.com/maps/dir/Rue%20Berbisey%2C%2021000%20Dijon/Rue%20Berbisey%2C%2021000%20Dijon/2%20place%20de%20l%27H%C3%B4tel%20de%20Ville%2C%2089000%20Auxerre/CRAC%20Fontenoy%2C%20Fontenoy/8%20rue%20des%204%20vents%2C%2058000%20Nevers/23%20avenue%20Conti%2C%2058320%20Pougues-les-Eaux/Cit%C3%A9%20des%20arts%2C%202%20passage%20des%20Arts%2C%2025000%20Besan%C3%A7on/Superse%C3%B1or%2C%20Besan%C3%A7on/7%20rue%20Klein%2C%2025000%20Besan%C3%A7on/59%20rue%20des%20Granges%2C%2025000%20Besan%C3%A7on", "stops": ["bourgogne-franche-comte-13", "bourgogne-franche-comte-14", "bourgogne-franche-comte-30", "bourgogne-franche-comte-31", "bourgogne-franche-comte-28", "bourgogne-franche-comte-29", "bourgogne-franche-comte-15", "bourgogne-franche-comte-16", "bourgogne-franche-comte-17", "bourgogne-franche-comte-18"] }, { "id": "troncon-15", "name": "De Besançon à Strasbourg", "url": "https://www.google.com/maps/dir/59%20rue%20des%20Granges%2C%2025000%20Besan%C3%A7on/95%20Grande%20Rue%2C%2025000%20Besan%C3%A7on/19%20avenue%20des%20Alli%C3%A9s%2C%2025200%20Montb%C3%A9liard/1%20rue%20de%20la%20Varonne%2C%2090140%20Bourogne/Rue%20Lecourbe%2C%2090000%20Belfort/5%20rue%20de%20la%20Douane/36%20quai%20des%20Bateliers/12%20rue%20Jacques%20Peirotes/Micro-librairie%20Central%20Vapeur%2C%20Strasbourg/Rue%20du%20faubourg%20Saverne", "stops": ["bourgogne-franche-comte-18", "bourgogne-franche-comte-19", "bourgogne-franche-comte-20", "bourgogne-franche-comte-21", "bourgogne-franche-comte-22", "grand-est-4", "grand-est-5", "grand-est-6", "grand-est-7", "grand-est-8"] }, { "id": "troncon-16", "name": "De Strasbourg à Reims", "url": "https://www.google.com/maps/dir/Rue%20du%20faubourg%20Saverne/Place%20de%20l%27%C3%89toile/1%20route%20de%20Marckolsheim/Librairie%20Lame%2C%20Nancy/14%20rue%20Stanislas/1%20bis%20rue%20des%20Trinitaires/28%20rue%20Mazelle/Centre%20d%27Art%20Contemporain%20%E2%80%93%20La%20Synagogue%20de%20Delme%2C%20Delme/1%20place%20Museux/Papier%20Bon%20%C5%92il%2C%20Reims", "stops": ["grand-est-8", "grand-est-9", "grand-est-3", "grand-est-10", "grand-est-11", "grand-est-2", "grand-est-12", "grand-est-14", "grand-est-1", "grand-est-13"] }, { "id": "troncon-17", "name": "De Reims à Lille", "url": "https://www.google.com/maps/dir/Papier%20Bon%20%C5%92il%2C%20Reims/37%20Rue%20du%20Hocquet%2C%2080000%20Amiens/45%20Rue%20Pointin%2C%2080000%20Amiens/2%20Rue%20Puvis%20de%20Chavannes%2C%2080000%20Amiens/2%20Rue%20de%20la%20Douizi%C3%A8me%2C%2062000%20Arras/Rue%20des%20Jongleurs%2C%2062000%20Arras/L%E2%80%99%C3%8Atre%20Lieu%2C%20Arras/Mus%C3%A9e%20des%20Beaux-Arts%20d%E2%80%99Arras%2C%20Arras/99%20Rue%20Paul%20Bert%2C%2062300%20Lens/Place%20de%20la%20R%C3%A9publique%2C%2059000%20Lille", "stops": ["grand-est-13", "hauts-de-france-22", "hauts-de-france-23", "hauts-de-france-24", "hauts-de-france-18", "hauts-de-france-19", "hauts-de-france-20", "hauts-de-france-21", "hauts-de-france-8", "hauts-de-france-6"] }, { "id": "troncon-18", "name": "De Lille à Tourcoing", "url": "https://www.google.com/maps/dir/Place%20de%20la%20R%C3%A9publique%2C%2059000%20Lille/28%20Rue%20de%20Gand%2C%2059000%20Lille/90%20Rue%20Pierre%20Mauroy%2C%2059800%20Lille/8%20Rue%20de%20Wazemmes%2C%2059000%20Lille/22%20Avenue%20Willy%20Brandt%2C%2059000%20Lille/Rue%20de%20l%27H%C3%B4pital%20Militaire%2C%2059000%20Lille/Rue%20de%20Valmy%2C%2059000%20Lille/Rue%20Masurel%2C%2059000%20Lille/L%E2%80%99Hybride%2C%20Lille/22%20Rue%20du%20Fresnoy%2C%2059202%20Tourcoing", "stops": ["hauts-de-france-6", "hauts-de-france-9", "hauts-de-france-10", "hauts-de-france-11", "hauts-de-france-12", "hauts-de-france-13", "hauts-de-france-14", "hauts-de-france-15", "hauts-de-france-16", "hauts-de-france-17"] }, { "id": "troncon-19", "name": "De Tourcoing à Rouen", "url": "https://www.google.com/maps/dir/22%20Rue%20du%20Fresnoy%2C%2059202%20Tourcoing/23%20Rue%20de%20l%E2%80%99Esp%C3%A9rance%2C%2059100%20Roubaix/1%20All%C3%A9e%20du%20Mus%C3%A9e%2C%2059650%20Villeneuve-d%27Ascq/1%20All%C3%A9e%20du%20Mus%C3%A9e%2C%2059650%20Villeneuve-d%27Ascq/198%20Rue%20Jean%20Monnet%2C%2059170%20Croix/503%20Avenue%20des%20Bancs%20de%20Flandres%2C%2059140%20Dunkerque/302%20Avenue%20des%20Bord%C3%A9es%2C%2059140%20Dunkerque/3%20place%20des%20Martyrs-de-la-R%C3%A9sistance/96%20rue%20des%20Martyrs%20de%20la%20R%C3%A9sistance/57%20rue%20des%20Faulx", "stops": ["hauts-de-france-17", "hauts-de-france-7", "hauts-de-france-3", "hauts-de-france-4", "hauts-de-france-5", "hauts-de-france-1", "hauts-de-france-2", "normandie-1", "normandie-2", "normandie-3"] }, { "id": "troncon-20", "name": "De Rouen à Caen", "url": "https://www.google.com/maps/dir/57%20rue%20des%20Faulx/66%20rue%20Jeanne%20d%27Arc/17%20all%C3%A9e%20Aim%C3%A9%20C%C3%A9saire/1517%20Place%20de%20l%27H%C3%B4tel%20de%20Ville/65%20rue%20Demidoff/148%20rue%20Victor%20Hugo/Palais%20Ducal%2C%20Impasse%20Duc%20Rollon/7%20bis%20rue%20Neuve%20Bourg%20l%27Abb%C3%A9/Presqu%27%C3%AEle%20de%20Caen/Librairie%20Eureka%20Street%2C%20Caen", "stops": ["normandie-3", "normandie-4", "normandie-5", "normandie-6", "normandie-7", "normandie-8", "normandie-9", "normandie-10", "normandie-11", "normandie-12"] }, { "id": "troncon-21", "name": "De Caen à Morlaix", "url": "https://www.google.com/maps/dir/Librairie%20Eureka%20Street%2C%20Caen/29%20rue%20Saint-Sauveur/24-26%20rue%20des%20Croisiers/2%20rue%20Nicolas%20Bouvier/Le%20Porte-Plume%20Malouin%2C%20Saint-Malo/9%20boulevard%20de%20la%20Tour%20d%E2%80%99Auvergne/Strandflat%20Editions%2C%20Saint-Malo/1%20rue%20Saint-Fran%C3%A7ois/Manufacture%20des%20Tabacs%2C%2041%20Quai%20du%20L%C3%A9on/La%20Maison%20des%20Bulles%2C%20Morlaix", "stops": ["normandie-12", "normandie-13", "normandie-14", "bretagne-24", "bretagne-25", "bretagne-26", "bretagne-27", "bretagne-23", "bretagne-21", "bretagne-22"] }, { "id": "troncon-22", "name": "De Morlaix à Lorient", "url": "https://www.google.com/maps/dir/La%20Maison%20des%20Bulles%2C%20Morlaix/41%20rue%20Charles%20Berthelot/La%20PAM%20%E2%80%93%20Mus%C3%A9e%20vivant%20de%20l%E2%80%99Imprimerie%2C%20Brest/17%20rue%20Fautras/17%20rue%20Fautras/37%20rue%20Louis%20Pasteur/23%20rue%20de%20la%20Providence/Librairie%20Ravy%2C%20Quimper/L%27Atelier%20d%27Album%2C%20Quimper/H%C3%B4tel%20Gabriel%20-%20Aile%20Est%2C%20Enclos%20du%20Port", "stops": ["bretagne-22", "bretagne-8", "bretagne-9", "bretagne-10", "bretagne-11", "bretagne-12", "bretagne-15", "bretagne-16", "bretagne-17", "bretagne-13"] }, { "id": "troncon-23", "name": "De Lorient à Rennes", "url": "https://www.google.com/maps/dir/H%C3%B4tel%20Gabriel%20-%20Aile%20Est%2C%20Enclos%20du%20Port/Librairie%20Comme%20dans%20les%20livres%2C%20Lorient/Librairie%20Cheminant%2C%20Vannes/5%20place%20Saint-Pierre/Domaine%20de%20Kergu%C3%A9hennec%2C%20Bignan/Quartier%20Beauregard/Place%20Honor%C3%A9%20Commeurec/5%20rue%20de%20la%20Parcheminerie/36%20rue%20Poullain%20Duparc/45%20rue%20de%20la%20Parcheminerie", "stops": ["bretagne-13", "bretagne-14", "bretagne-18", "bretagne-19", "bretagne-20", "bretagne-1", "bretagne-2", "bretagne-3", "bretagne-4", "bretagne-5"] }, { "id": "troncon-24", "name": "De Rennes à Nantes", "url": "https://www.google.com/maps/dir/45%20rue%20de%20la%20Parcheminerie/L%27Atelier%20du%20Bourg%2C%20Rennes/3%20rue%20Fran%C3%A7ois%20Rabelais/2%20Place%20des%20Quatre%20Z%27Horloges%2C%2044600%20Saint-Nazaire/20B%20Rue%20de%20la%20Paix%20et%20des%20Arts%2C%2044600%20Saint-Nazaire/24%20bis%20boulevard%20Amp%C3%A8re%2C%20La%20Fleuriaye%2C%2044470%20Carquefou/Place%20Dulcie%20September%2C%20Ateliers%2C%2044000%20Nantes/Le%20Lieu%20Unique%2C%202%20rue%20de%20la%20Biscuiterie%2C%2044000%20Nantes/La%20Manufacture%2C%206%20cour%20Jules%20Durand%2C%2044000%20Nantes/21%20Quai%20des%20Antilles%2C%20Hangar%20%C3%A0%20Bananes%2C%2044200%20Nantes", "stops": ["bretagne-5", "bretagne-6", "bretagne-7", "pays-de-la-loire-6", "pays-de-la-loire-7", "pays-de-la-loire-1", "pays-de-la-loire-2", "pays-de-la-loire-3", "pays-de-la-loire-4", "pays-de-la-loire-5"] }, { "id": "troncon-25", "name": "De Nantes à Pantin", "url": "https://www.google.com/maps/dir/21%20Quai%20des%20Antilles%2C%20Hangar%20%C3%A0%20Bananes%2C%2044200%20Nantes/16%20rue%20Bodinier%2C%2049100%20Angers/Passage%20du%20Marquis%20de%20Geoffre%2C%2049730%20Montsoreau/Galerie%205%2C%20Angers/Librairie-boutique%20des%20Mus%C3%A9es%20d%27Angers%2C%20Angers/La%20Visitation%2C%201%20rue%20Gambetta%2C%2072000%20Le%20Mans/13%20rue%20de%20la%20Barillerie%2C%2072000%20Le%20Mans/Librairie%20Thuard%2C%20Le%20Mans/Librairie%20Lame%2C%20Saint-Denis/1%20rue%20de%20l%27Ancien%20Canal", "stops": ["pays-de-la-loire-5", "pays-de-la-loire-8", "pays-de-la-loire-9", "pays-de-la-loire-10", "pays-de-la-loire-11", "pays-de-la-loire-12", "pays-de-la-loire-13", "pays-de-la-loire-14", "ile-de-france-25", "ile-de-france-2"] }, { "id": "troncon-26", "name": "De Pantin à Montreuil", "url": "https://www.google.com/maps/dir/1%20rue%20de%20l%27Ancien%20Canal/29%20rue%20Henri%20Barbusse/41%20rue%20L%C3%A9cuyer/43%20rue%20de%20la%20Commune%20de%20Paris/Komunuma%2C%20Romainville/1%20rue%20Charles%20Garnier/1%20rue%20Jean%20Jaur%C3%A8s/116%20rue%20de%20Paris/La%20Marbrerie%2C%20Montreuil/7%20avenue%20Walwein", "stops": ["ile-de-france-2", "ile-de-france-23", "ile-de-france-10", "ile-de-france-11", "ile-de-france-24", "ile-de-france-12", "ile-de-france-4", "ile-de-france-5", "ile-de-france-13", "ile-de-france-17"] }, { "id": "troncon-27", "name": "De Montreuil à Vitry-sur-Seine", "url": "https://www.google.com/maps/dir/7%20avenue%20Walwein/12%20rue%20Marcelin%20Berthelot/9%20avenue%20de%20la%20R%C3%A9sistance/La%20Ferme%20du%20Buisson%2C%20Noisiel/Les%20%C3%89glises%20-%20Centre%20d%27art%20contemporain%20de%20Chelles%2C%20Chelles/MABA%20%28Maison%20d%E2%80%99Art%20Bernard%20Anthonioz%29%2C%20Nogent-sur-Marne/Mots%20et%20Motions%2C%20Noisy-le-Grand/CAC%20Br%C3%A9tigny%2C%20Br%C3%A9tigny-sur-Orge/40%20rue%20d%27Anjou/MAC%20VAL%2C%20Vitry-sur-Seine", "stops": ["ile-de-france-17", "ile-de-france-18", "ile-de-france-19", "ile-de-france-7", "ile-de-france-8", "ile-de-france-9", "ile-de-france-21", "ile-de-france-6", "ile-de-france-22", "ile-de-france-1"] }, { "id": "troncon-28", "name": "De Vitry-sur-Seine à Orléans", "url": "https://www.google.com/maps/dir/MAC%20VAL%2C%20Vitry-sur-Seine/Le%20Cr%C3%A9dac%2C%20Ivry-sur-Seine/16%20rue%20Charles%20Fr%C3%A9rot/Anis%20Gras%20-%20Le%20Lieu%20de%20l%E2%80%99Autre%2C%20Arcueil/50%20avenue%20Pierre%20Larousse/8%20rue%20Jules%20Cuillerier/88%20rue%20du%20Colombier%2C%2045000%20Orl%C3%A9ans/88%20rue%20du%20Colombier%2C%2045000%20Orl%C3%A9ans/9%20rue%20des%20Carmes%2C%2045000%20Orl%C3%A9ans/57%20rue%20Notre%20Dame%20de%20Recouvrance%2C%2045000%20Orl%C3%A9ans", "stops": ["ile-de-france-1", "ile-de-france-3", "ile-de-france-14", "ile-de-france-15", "ile-de-france-16", "ile-de-france-20", "centre-val-de-loire-12", "centre-val-de-loire-13", "centre-val-de-loire-14", "centre-val-de-loire-15"] }, { "id": "troncon-29", "name": "De Orléans à Bourges", "url": "https://www.google.com/maps/dir/57%20rue%20Notre%20Dame%20de%20Recouvrance%2C%2045000%20Orl%C3%A9ans/108%20rue%20de%20Bourgogne%2C%2045000%20Orl%C3%A9ans/108%20rue%20de%20Bourgogne%2C%2045000%20Orl%C3%A9ans/3%20rue%20d%27Alibert%2C%2045000%20Orl%C3%A9ans/Rue%20de%20Bourgogne%2C%2045000%20Orl%C3%A9ans/24%2F26%20route%20de%20la%20Chapelle%2C%2018000%20Bourges/9%20rue%20Edouard%20Branly%2C%2018000%20Bourges/50%20rue%20St%C3%A9phane%20Mallarm%C3%A9%2C%2018000%20Bourges/15%20rue%20Littr%C3%A9%2C%2018000%20Bourges/54-56%20rue%20Coursarlon%2C%2018000%20Bourges", "stops": ["centre-val-de-loire-15", "centre-val-de-loire-16", "centre-val-de-loire-17", "centre-val-de-loire-18", "centre-val-de-loire-19", "centre-val-de-loire-20", "centre-val-de-loire-21", "centre-val-de-loire-22", "centre-val-de-loire-23", "centre-val-de-loire-24"] }, { "id": "troncon-30", "name": "De Bourges à Tours", "url": "https://www.google.com/maps/dir/54-56%20rue%20Coursarlon%2C%2018000%20Bourges/5%20place%20Saint-Bonnet%2C%2018000%20Bourges/Ch%C3%A2teau%20d%27eau%20-%20Ch%C3%A2teau%20d%27art%2C%20Bourges/1%20parvis%20Jean%20Germain%20%2F%2016bis%20Jardin%20Fran%C3%A7ois%201er%2C%2037000%20Tours/10%20place%20Choiseul%2C%2037100%20Tours/25%20rue%20Colbert%2C%2037000%20Tours/1%20rue%20de%20J%C3%A9rusalem%2C%2037000%20Tours/61%20rue%20Blaise-Pascal%2C%2037000%20Tours/109%20rue%20de%20la%20Fuye%2C%2037000%20Tours/Galerie%20Exuo%2C%20Tours", "stops": ["centre-val-de-loire-24", "centre-val-de-loire-25", "centre-val-de-loire-26", "centre-val-de-loire-1", "centre-val-de-loire-2", "centre-val-de-loire-3", "centre-val-de-loire-4", "centre-val-de-loire-5", "centre-val-de-loire-6", "centre-val-de-loire-7"] }, { "id": "troncon-31", "name": "De Tours à Angoulême", "url": "https://www.google.com/maps/dir/Galerie%20Exuo%2C%20Tours/Galerie%20Olivier%20Rousseau%2C%20Tours/19%20rue%20Nationale%2C%2037000%20Tours/1%20rue%20du%20G%C3%A9n%C3%A9ral%20Foy%2C%2037400%20Amboise/14%20rue%20de%20la%20Paix%2C%2041000%20Blois/185%20rue%20du%20Faubourg%20du%20Pont%20Neuf%2C%2086000%20Poitiers/76%20rue%20de%20la%20Cath%C3%A9drale%2C%2086000%20Poitiers/Poitiers%2C%20Vienne/63%20boulevard%20Besson%20Bey%2C%2016000%20Angoul%C3%AAme/Galerie%20du%20Champ%20de%20Mars%2C%2016000%20Angoul%C3%AAme", "stops": ["centre-val-de-loire-7", "centre-val-de-loire-9", "centre-val-de-loire-10", "centre-val-de-loire-11", "centre-val-de-loire-8", "nouvelle-aquitaine-9", "nouvelle-aquitaine-10", "nouvelle-aquitaine-25", "nouvelle-aquitaine-7", "nouvelle-aquitaine-8"] }, { "id": "troncon-32", "name": "De Angoulême à Ussel", "url": "https://www.google.com/maps/dir/Galerie%20du%20Champ%20de%20Mars%2C%2016000%20Angoul%C3%AAme/Quartier%20historique%2C%2017000%20La%20Rochelle/17%20bis%20rue%20Charles%20Michels%2C%2087000%20Limoges/4%20rue%20Raspail%2C%2087000%20Limoges/4%20place%20de%20la%20Motte%2C%2087000%20Limoges/Rue%20Othon%20P%C3%A9connet%2C%2087000%20Limoges/Rue%20Fourie%2C%2087000%20Limoges/Ch%C3%A2teau%20de%20Rochechouart%2C%2087600%20Rochechouart/1%20place%20Attane%2C%2087500%20Saint-Yrieix-la-Perche/Ussel%2C%20Corr%C3%A8ze", "stops": ["nouvelle-aquitaine-8", "nouvelle-aquitaine-11", "nouvelle-aquitaine-13", "nouvelle-aquitaine-14", "nouvelle-aquitaine-15", "nouvelle-aquitaine-26", "nouvelle-aquitaine-27", "nouvelle-aquitaine-21", "nouvelle-aquitaine-12", "nouvelle-aquitaine-22"] }, { "id": "troncon-33", "name": "De Ussel à Bellevigne", "url": "https://www.google.com/maps/dir/Ussel%2C%20Corr%C3%A8ze/Place%20de%20l%27%C3%89glise%2C%2019250%20Meymac/4%20rue%20du%20Four%2C%2019250%20Meymac/5%20parvis%20Corto%20Maltese%2C%2033088%20Bordeaux/7%20rue%20Ferr%C3%A8re%2C%2033000%20Bordeaux/19%20rue%20des%20Argentiers%2C%2033000%20Bordeaux/99%20rue%20de%20B%C3%A8gles%2C%2033800%20Bordeaux/15%20rue%20Vital-Carles%2C%2033000%20Bordeaux/Pessac%2C%20Gironde/Bellevigne%2C%20Charente", "stops": ["nouvelle-aquitaine-22", "nouvelle-aquitaine-23", "nouvelle-aquitaine-24", "nouvelle-aquitaine-1", "nouvelle-aquitaine-2", "nouvelle-aquitaine-3", "nouvelle-aquitaine-4", "nouvelle-aquitaine-5", "nouvelle-aquitaine-6", "nouvelle-aquitaine-30"] }, { "id": "troncon-34", "name": "De Bellevigne à Billère", "url": "https://www.google.com/maps/dir/Bellevigne%2C%20Charente/Bayonne%2C%20Pyr%C3%A9n%C3%A9es-Atlantiques/Bayonne%2C%20Pyr%C3%A9n%C3%A9es-Atlantiques/Quartier%20Saint-Esprit%2C%20Bayonne/2%20rue%20Albert-le-Barillier%2C%2064600%20Anglet/13%20rue%20Poste%2C%2064200%20Biarritz/Saint-Jean-de-Luz%2C%20Pyr%C3%A9n%C3%A9es-Atlantiques/Les%20Abattoirs%2C%20All%C3%A9e%20Montesquieu%2C%2064140%20Bill%C3%A8re", "stops": ["nouvelle-aquitaine-30", "nouvelle-aquitaine-18", "nouvelle-aquitaine-20", "nouvelle-aquitaine-28", "nouvelle-aquitaine-17", "nouvelle-aquitaine-19", "nouvelle-aquitaine-29", "nouvelle-aquitaine-16"] }, { "id": "troncon-35", "name": "Retour au KM 0 — De Billère à Gratens", "url": "https://www.google.com/maps/dir/Les%20Abattoirs%2C%20All%C3%A9e%20Montesquieu%2C%2064140%20Bill%C3%A8re/2165%20route%20du%20Bois%20de%20la%20pierre%2C%2031430%20Gratens", "stops": ["nouvelle-aquitaine-16", "start-0"] }];

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const KM0 = {
  id: "start-0",
  name: "KM 0 — Gratens",
  address: "2165 route du Bois de la pierre, 31430 Gratens",
  city: "Gratens",
  description: "Point de départ absolu du Tour de Phrance.",
  visited: false,
};

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const C = {
  bg: "transparent",
  card: "#e0eaf5",
  cardBorder: "rgba(0,0,0,0.06)",
  textPrimary: "#2d3748",
  textSecondary: "#718096",
  textMuted: "#a0aec0",
  accent: "#f6845e",       // pêche douce
  accentAlt: "#f2c94c",    // jaune miel
  accentMint: "#68d8c0",   // menthe fraîche
  accentLavender: "#9b8ec4", // lavande
  visited: "#e8f9f4",
  visitedBorder: "#68d8c0",
  visitedText: "#2d7d6a",
  progressStart: "#f6845e",
  progressEnd: "#f2c94c",
  shadow: "none",
  shadowHover: "none",
  radius: "2px",
  radiusSm: "2px",
  radiusXs: "2px",
};

// ─── REGION COLORS ────────────────────────────────────────────────────────────
const REGION_COLORS = {
  "occitanie": { bg: "#fff4e6", text: "#c05621", dot: "#f6ad55" },
  "paca": { bg: "#fff0f3", text: "#b83280", dot: "#f687b3" },
  "corse": { bg: "#f0fff4", text: "#276749", dot: "#68d391" },
  "auvergne-rhone-alpes": { bg: "#ebf8ff", text: "#2b6cb0", dot: "#63b3ed" },
  "bourgogne-franche-comte": { bg: "#faf5ff", text: "#6b46c1", dot: "#b794f4" },
  "grand-est": { bg: "#fff5f5", text: "#c53030", dot: "#fc8181" },
  "hauts-de-france": { bg: "#e6fffa", text: "#234e52", dot: "#4fd1c5" },
  "normandie": { bg: "#fffbeb", text: "#744210", dot: "#f6e05e" },
  "bretagne": { bg: "#ebf4ff", text: "#2c5282", dot: "#90cdf4" },
  "pays-de-la-loire": { bg: "#fefcbf", text: "#744210", dot: "#f6e05e" },
  "ile-de-france": { bg: "#fff0f3", text: "#97266d", dot: "#ed64a6" },
  "centre-val-de-loire": { bg: "#f0fff4", text: "#22543d", dot: "#68d391" },
  "nouvelle-aquitaine": { bg: "#fffaf0", text: "#7b341e", dot: "#fbb6ce" },
};

function getRegionStyle(id) {
  const region = id.replace(/-\d+$/, "");
  return REGION_COLORS[region] || { bg: "#f7f8fa", text: "#4a5568", dot: "#a0aec0" };
}

// ─── CUSTOM HOOK ──────────────────────────────────────────────────────────────
function useVisited() {
  const [visited, setVisited] = useState(() => {
    try {
      const s = localStorage.getItem("tourdePhrance_v2_visited");
      return s ? JSON.parse(s) : {};
    } catch { return {}; }
  });

  const toggle = useCallback((id) => {
    setVisited((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem("tourdePhrance_v2_visited", JSON.stringify(next)); } catch { }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setVisited({});
    try { localStorage.removeItem("tourdePhrance_v2_visited"); } catch { }
  }, []);

  return { visited, toggle, reset };
}

// ─── URL BUILDERS ─────────────────────────────────────────────────────────────
function getLocAddr(id, locMap) {
  if (id === "start-0") return KM0.address;
  const loc = locMap[id];
  if (!loc) return null;
  const addr = loc.address?.trim();
  if (addr && addr !== "...") return addr;
  return loc.name + (loc.city ? ", " + loc.city : "");
}

function buildMapsUrl(stops, locMap) {
  const addresses = stops.map(id => getLocAddr(id, locMap)).filter(Boolean);
  if (addresses.length < 2) return null;
  return "https://www.google.com/maps/dir/" + addresses.map(encodeURIComponent).join("/");
}

function buildEmbedMapUrl(stops, locMap) {
  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === "VOTRE_CLE_API_ICI") return null;
  const addresses = stops.map(id => getLocAddr(id, locMap)).filter(Boolean).slice(0, 10);
  if (addresses.length < 2) return null;
  const origin = encodeURIComponent(addresses[0]);
  const destination = encodeURIComponent(addresses[addresses.length - 1]);
  const waypoints = addresses.slice(1, -1).map(encodeURIComponent).join("|");
  const waypointParam = waypoints ? `&waypoints=${waypoints}` : "";
  return `https://www.google.com/maps/embed/v1/directions?key=${GOOGLE_MAPS_API_KEY}&origin=${origin}&destination=${destination}${waypointParam}&mode=driving&language=fr`;
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
const IconChevron = ({ open }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
    style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)", flexShrink: 0 }}>
    <path d="M4.5 6.75L9 11.25L13.5 6.75" stroke={C.textMuted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconMap = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
    <line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" />
  </svg>
);

const IconCheck = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
    <path d="M1.5 5.5L4.5 8.5L9.5 2.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconPin = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
  </svg>
);

// ─── LOCATION ROW ─────────────────────────────────────────────────────────────
function LocationRow({ loc, isVisited, onToggle, isOverlap }) {
  const rs = getRegionStyle(loc.id);

  return (
    <div
      onClick={() => !isOverlap && onToggle(loc.id)}
      style={{
        display: "flex", alignItems: "flex-start", gap: "11px",
        padding: "10px 12px",
        borderRadius: C.radiusSm,
        cursor: isOverlap ? "default" : "pointer",
        opacity: isOverlap ? 0.38 : 1,
        background: isVisited ? C.visited : "transparent",
        borderLeft: isVisited ? `3px solid ${C.visitedBorder}` : "3px solid transparent",
        transition: "background 0.2s ease, border-color 0.2s ease",
        marginBottom: "2px",
      }}
    >
      {/* Checkbox */}
      {!isOverlap && (
        <div style={{
          width: "20px", height: "20px", flexShrink: 0, marginTop: "2px",
          borderRadius: "2px",
          border: isVisited ? "none" : `2px solid ${C.textMuted}`,
          background: isVisited ? C.accentMint : "white",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.2s ease",
          boxShadow: isVisited ? `0 2px 8px ${C.accentMint}55` : "none",
        }}>
          {isVisited && <IconCheck />}
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px", flexWrap: "wrap" }}>
          <span style={{
            fontFamily: "var(--font-main, sans-serif)",
            fontSize: "13.5px", fontWeight: "600",
            color: isVisited ? C.visitedText : C.textPrimary,
            textDecoration: isVisited ? "line-through" : "none",
            letterSpacing: "-0.01em",
            transition: "color 0.2s",
          }}>
            {loc.name}
          </span>
          {loc.city && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "3px",
              fontSize: "10.5px", fontFamily: "var(--font-mono, monospace)",
              color: rs.text, background: rs.bg,
              padding: "2px 7px", borderRadius: "2px",
              letterSpacing: "0.02em", fontWeight: "500",
            }}>
              <span style={{ color: rs.dot, fontSize: "8px" }}>●</span>
              {loc.city}
            </span>
          )}
        </div>
        {loc.address && loc.address !== "..." && !isOverlap && (
          <div style={{
            fontSize: "11px", color: C.textMuted, marginTop: "3px",
            fontFamily: "var(--font-mono, monospace)", letterSpacing: "0.01em",
          }}>
            {loc.address}
          </div>
        )}
        {isOverlap && (
          <div style={{ fontSize: "10.5px", color: C.textMuted, fontStyle: "italic", fontFamily: "var(--font-main, sans-serif)" }}>
            Relais depuis l'étape précédente
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAP THUMBNAIL (Embed iframe) ─────────────────────────────────────────────
function MapThumbnail({ stops, locMap }) {
  const url = buildEmbedMapUrl(stops, locMap);
  if (!url) return (
    <div style={{
      width: "100%", height: "160px",
      background: "#eef2f8",
      borderRadius: C.radiusSm,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: "6px", marginBottom: "12px",
      border: `1px dashed ${C.cardBorder}`,
    }}>
      <div style={{ fontSize: "28px" }}>🗺️</div>
      <div style={{ fontSize: "11px", color: C.textMuted, fontFamily: "var(--font-mono, monospace)", textAlign: "center", lineHeight: "1.5" }}>
        Aperçu disponible<br />avec une clé API Google Maps
      </div>
    </div>
  );

  return (
    <div style={{
      width: "100%", height: "160px",
      borderRadius: C.radiusSm,
      overflow: "hidden",
      marginBottom: "12px",
      boxShadow: "none",
      position: "relative",
    }}>
      <iframe
        title="Aperçu itinéraire"
        src={url}
        width="100%"
        height="100%"
        style={{ border: "none", display: "block" }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}

// ─── TRONCON CARD ─────────────────────────────────────────────────────────────
function TronconCard({ troncon, locMap, visited, onToggle, tronconIndex }) {
  const [open, setOpen] = useState(false);
  const stops = troncon.stops;
  const overlapId = tronconIndex > 0 ? stops[0] : null;

  const locs = stops.map(id =>
    id === "start-0" ? KM0 : (locMap[id] || { id, name: id, address: "", city: "" })
  );

  const visitableIds = stops.filter(id => id !== overlapId);
  const visitedCount = visitableIds.filter(id => visited[id]).length;
  const total = visitableIds.length;
  const progress = total > 0 ? visitedCount / total : 0;
  const allDone = visitedCount === total && total > 0;

  const mapsUrl = useMemo(() => buildMapsUrl(stops, locMap), [stops]);

  const startCity = locs[0]?.city || locs[0]?.name || "?";
  const endCity = locs[locs.length - 1]?.city || locs[locs.length - 1]?.name || "?";

  // Collect region tags visible in this troncon
  const regions = [...new Set(
    visitableIds.map(id => id.replace(/-\d+$/, ""))
      .filter(r => REGION_COLORS[r])
  )].slice(0, 3);

  return (
    <div style={{
      marginBottom: "10px",
      borderRadius: C.radius,
      border: allDone
        ? `1.5px solid ${C.accentMint}`
        : `1.5px solid ${C.cardBorder}`,
      background: C.card,
      boxShadow: open ? C.shadowHover : C.shadow,
      overflow: "hidden",
      transition: "box-shadow 0.25s ease, border-color 0.3s ease",
    }}>

      {/* ── Header ── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", padding: "14px 16px",
          display: "flex", alignItems: "center", gap: "13px",
          background: "none", border: "none", cursor: "pointer",
          textAlign: "left",
        }}
      >
        {/* Number badge */}
        <div style={{
          width: "38px", height: "38px", flexShrink: 0,
          borderRadius: "2px",
          background: allDone
            ? `linear-gradient(135deg, ${C.accentMint}, #4ec5a8)`
            : `linear-gradient(135deg, #fef3ee, #fde8dc)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "12px", fontWeight: "700",
          color: allDone ? "white" : C.accent,
          letterSpacing: "0.03em",
          boxShadow: allDone ? `0 3px 12px ${C.accentMint}55` : "none",
        }}>
          {String(tronconIndex + 1).padStart(2, "0")}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "var(--font-main, sans-serif)",
            fontSize: "14px", fontWeight: "700",
            color: C.textPrimary, letterSpacing: "-0.02em",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            marginBottom: "5px",
          }}>
            {startCity} → {endCity}
          </div>
          {/* Progress bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <div style={{
              flex: 1, height: "5px",
              background: "#c8d4e8",
              borderRadius: "2px", overflow: "hidden",
            }}>
              <div style={{
                width: `${progress * 100}%`, height: "100%",
                background: allDone
                  ? `linear-gradient(90deg, ${C.accentMint}, #4ec5a8)`
                  : `linear-gradient(90deg, ${C.progressStart}, ${C.progressEnd})`,
                borderRadius: "2px",
                transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)",
              }} />
            </div>
            <span style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "10px", color: C.textMuted, flexShrink: 0,
            }}>
              {visitedCount}/{total}
            </span>
          </div>
        </div>

        <div style={{ color: C.textMuted }}>
          <IconChevron open={open} />
        </div>
      </button>

      {/* ── Expanded body ── */}
      {open && (
        <div style={{ borderTop: `1px solid ${C.cardBorder}`, padding: "14px 14px 10px" }}>

          {/* Map thumbnail */}
          <MapThumbnail stops={stops} locMap={locMap} />

          {/* Maps button */}
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: "8px",
                width: "100%", padding: "13px",
                borderRadius: C.radiusSm,
                background: `linear-gradient(135deg, ${C.progressStart} 0%, ${C.accentAlt} 100%)`,
                color: "white",
                fontFamily: "var(--font-main, sans-serif)",
                fontSize: "13px", fontWeight: "700",
                letterSpacing: "0.04em", textTransform: "uppercase",
                textDecoration: "none",
                boxShadow: `0 6px 20px ${C.accent}44`,
                marginBottom: "14px",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
            >
              <IconMap />
              Lancer l'itinéraire
            </a>
          )}

          {/* Location list */}
          <div>
            {locs.map((loc, idx) => (
              <LocationRow
                key={loc.id + idx}
                loc={loc}
                isVisited={!!visited[loc.id]}
                onToggle={onToggle}
                isOverlap={loc.id === overlapId}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── GLOBAL PROGRESS ──────────────────────────────────────────────────────────
function GlobalProgress({ visitedCount, total }) {
  const pct = total > 0 ? (visitedCount / total) * 100 : 0;
  const segments = 5;
  const filled = Math.round((pct / 100) * segments);

  return (
    <div style={{ padding: "22px 18px 16px" }}>
      {/* Title row */}
      <div style={{
        display: "flex", alignItems: "flex-end",
        justifyContent: "space-between", marginBottom: "14px",
      }}>
        <div>
          <div style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "9.5px", letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: C.accent, marginBottom: "5px",
          }}>
            Tour de Phrance · GR-Routier
          </div>
          <div style={{
            fontFamily: "var(--font-main, sans-serif)",
            fontSize: "26px", fontWeight: "800",
            color: C.textPrimary, letterSpacing: "-0.03em", lineHeight: "1",
          }}>
            {visitedCount}
            <span style={{ fontSize: "15px", fontWeight: "500", color: C.textMuted, marginLeft: "4px" }}>
              / {total} lieux
            </span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{
            fontFamily: "var(--font-main, sans-serif)",
            fontSize: "28px", fontWeight: "800", letterSpacing: "-0.03em",
            background: `linear-gradient(135deg, ${C.progressStart}, ${C.progressEnd})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            {pct.toFixed(1)}%
          </div>
          <div style={{ fontSize: "10px", color: C.textMuted, fontFamily: "var(--font-mono, monospace)" }}>
            ~{Math.round(pct * 98)} km
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        height: "10px",
        background: "#ede8e0",
        borderRadius: "2px", overflow: "hidden",
        position: "relative",
      }}>
        <div style={{
          width: `${pct}%`, height: "100%",
          background: `linear-gradient(90deg, ${C.progressStart}, ${C.accentAlt})`,
          borderRadius: "2px",
          transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
          position: "relative",
        }}>
          {pct > 2 && (
            <div style={{
              position: "absolute", right: 0, top: 0, bottom: 0,
              width: "20px",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35))",
              borderRadius: "0 2px 2px 0",
            }} />
          )}
        </div>
      </div>

      {/* Balisage dots */}
      <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "10px" }}>
        {Array.from({ length: segments }).map((_, i) => (
          <div key={i} style={{
            width: i < filled ? "18px" : "8px",
            height: "8px",
            borderRadius: "2px",
            background: i < filled
              ? `linear-gradient(90deg, ${C.progressStart}, ${C.accentAlt})`
              : "#ede8e0",
            transition: "all 0.4s ease",
          }} />
        ))}
        <span style={{
          fontSize: "9px", color: C.textMuted,
          fontFamily: "var(--font-mono, monospace)",
          marginLeft: "5px", letterSpacing: "0.08em",
        }}>
          BALISAGE
        </span>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function RoadtripApp({ soldeActuel = 0, effectuerTransaction = () => { }, crediterSolde = () => { }, pushToInventaire = () => { }, fmt = (n) => n, inflationRate = 1 }) {
  const { visited, toggle, reset } = useVisited();
  const [confirmReset, setConfirmReset] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showHeader, setShowHeader] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const locMap = useMemo(() => {
    const m = { "start-0": KM0 };
    RAW_LOCATIONS.forEach(loc => { m[loc.id] = loc; });
    return m;
  }, []);

  const allVisitableIds = useMemo(() => {
    const seen = new Set();
    RAW_ITINERARIES.forEach((t, idx) => {
      t.stops.forEach((id, i) => {
        if (idx > 0 && i === 0) return;
        seen.add(id);
      });
    });
    return [...seen];
  }, []);

  const visitedCount = allVisitableIds.filter(id => visited[id]).length;
  const total = allVisitableIds.length;

  const filteredItineraries = useMemo(() => {
    if (!searchQuery.trim()) return RAW_ITINERARIES;
    const q = searchQuery.toLowerCase();
    return RAW_ITINERARIES.filter(t =>
      t.stops.some(id => {
        const loc = locMap[id];
        return loc && (
          loc.name?.toLowerCase().includes(q) ||
          loc.city?.toLowerCase().includes(q)
        );
      }) || t.name.toLowerCase().includes(q)
    );
  }, [searchQuery, locMap]);

  return (
    <div style={{
      width: "100%",
      height: "100%",
      flex: 1,
      overflow: "auto",
      background: "#0a0812",
      color: C.textPrimary,
      fontFamily: "var(--font-main, sans-serif)",
      position: "relative",
    }}>
      <div style={{
        maxWidth: "600px",
        margin: "0 auto",
        background: "#eef2f8",
        minHeight: "100%",
      }}>
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }
        button:focus-visible { outline: 2px solid ${C.accent}; outline-offset: 2px; }
        a:hover > div { transform: translateY(-1px); }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

        {/* ── Toggle mobile ── */}
        {isMobile && (
          <button
            onClick={() => setShowHeader(h => !h)}
            style={{
              width: "100%",
              padding: "10px 16px",
              background: "#111",
              border: "1px solid #333",
              color: "#ccc",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              letterSpacing: "0.1em",
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            {showHeader ? "▲ RÉDUIRE" : "▼ DÉPLIER LES CONTRÔLES"}
          </button>
        )}

        {/* ── Sticky header ── */}
        {(!isMobile || showHeader) && (
          <div style={{
            position: "sticky", top: 0, zIndex: 100,
            background: "#e8eef8",
            backdropFilter: "blur(16px)",
            borderBottom: `1px solid ${C.cardBorder}`,
          }}>
            <GlobalProgress visitedCount={visitedCount} total={total} />

            {/* ── GUICHET — PACKS D'OUTILS TOURNÉE ── */}
            <div style={{ padding: "10px 16px 0", display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {[
                { id: "pack-impression", label: "Pack Impression", prix: 800, desc: "Risographe portable + encres", emoji: "🖨" },
                { id: "pack-transport", label: "Pack Transport", prix: 1200, desc: "Van + assurance tournée", emoji: "🚐" },
                { id: "pack-com", label: "Pack Com", prix: 500, desc: "Affiches + réseaux", emoji: "📣" },
              ].map(pack => {
                const cout = Math.round(pack.prix * inflationRate);
                const canAfford = soldeActuel >= cout;
                return (
                  <button
                    key={pack.id}
                    disabled={!canAfford}
                    onClick={() => {
                      if (!canAfford) return;
                      effectuerTransaction(`Achat ${pack.label}`, cout);
                      pushToInventaire({
                        id: `${pack.id}-${Date.now()}`,
                        type: "outil",
                        titre: `${pack.emoji} ${pack.label} — ${pack.desc}`,
                        src: null,
                        prixAchat: cout,
                      });
                    }}
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: "9px",
                      letterSpacing: "0.08em",
                      padding: "5px 10px",
                      background: canAfford ? "rgba(248,132,94,0.08)" : "transparent",
                      border: `1px solid ${canAfford ? "#f6845e" : "#ccc"}`,
                      color: canAfford ? "#f6845e" : "#bbb",
                      cursor: canAfford ? "pointer" : "not-allowed",
                      borderRadius: "2px",
                      transition: "all 0.15s",
                    }}
                  >
                    {pack.emoji} {pack.label} — {fmt(cout)} €
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div style={{ padding: "0 16px 14px" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "10px",
                background: "#e0eaf5",
                border: "1px solid #333",
                borderRadius: "2px",
                padding: "9px 14px",
                boxShadow: "none",
              }}>
                <span style={{ fontSize: "14px", color: C.textMuted }}>🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un lieu, une ville..."
                  style={{
                    flex: 1, border: "none", outline: "none",
                    fontFamily: "var(--font-main, sans-serif)",
                    fontSize: "13.5px", color: C.textPrimary,
                    background: "transparent",
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: C.textMuted, fontSize: "16px", padding: "0", lineHeight: "1",
                    }}
                  >×</button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Troncon list ── */}
        <div style={{ padding: "12px 12px 100px" }}>
          {filteredItineraries.length === 0 && (
            <div style={{
              textAlign: "center", padding: "50px 20px",
              color: C.textMuted, fontFamily: "var(--font-mono, monospace)",
              fontSize: "13px",
            }}>
              Aucun tronçon trouvé pour "{searchQuery}"
            </div>
          )}
          {filteredItineraries.map((troncon, idx) => {
            const realIdx = RAW_ITINERARIES.indexOf(troncon);
            return (
              <div key={troncon.id} style={{ animation: `fadeSlide 0.3s ease both`, animationDelay: `${idx * 0.03}s` }}>
                <TronconCard
                  troncon={troncon}
                  locMap={locMap}
                  visited={visited}
                  onToggle={(id) => {
                    const alreadyVisited = visited[id];
                    toggle(id);
                    const loc = locMap[id];
                    const nom = loc ? `${loc.name}, ${loc.city}` : id;
                    if (!alreadyVisited) {
                      const cout = Math.round(25 * inflationRate);
                      effectuerTransaction(`Dépôt livre — ${nom}`, cout);
                      pushToInventaire({
                        id: `tournee-${id}-${Date.now()}`,
                        type: "outil",
                        titre: `Étape tournée : ${nom}`,
                        src: null,
                        prixAchat: cout,
                      });
                    } else {
                      effectuerTransaction(`Retrait dépôt — ${nom}`, Math.round(5 * inflationRate));
                    }
                  }}
                  tronconIndex={realIdx}
                />
              </div>
            );
          })}
        </div>

        {/* ── Footer ── */}
        <div style={{
          position: "sticky", bottom: 0,
          width: "100%",
          padding: "12px 16px",
          background: "#e8eef8",
          backdropFilter: "blur(16px)",
          borderTop: `1px solid ${C.cardBorder}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          zIndex: 50,
        }}>
          <div style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "10px", color: C.textMuted, letterSpacing: "0.05em",
          }}>
            {visitedCount === total && total > 0 ? "🎉 Tour complété !" : `${total - visitedCount} lieux restants`}
          </div>

          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              style={{
                padding: "7px 14px", borderRadius: "2px",
                background: "transparent",
                border: "1px solid #333",
                color: C.textMuted, cursor: "pointer",
                fontFamily: "var(--font-main, sans-serif)",
                fontSize: "12px", fontWeight: "500",
                transition: "all 0.2s",
              }}
            >
              Réinitialiser
            </button>
          ) : (
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => { reset(); setConfirmReset(false); }}
                style={{
                  padding: "7px 14px", borderRadius: "2px",
                  background: "#fee2e2", border: "none",
                  color: "#dc2626", cursor: "pointer",
                  fontFamily: "var(--font-main, sans-serif)",
                  fontSize: "12px", fontWeight: "700",
                }}
              >Confirmer</button>
              <button
                onClick={() => setConfirmReset(false)}
                style={{
                  padding: "7px 14px", borderRadius: "2px",
                  background: "#e0eaf5", border: "1px solid #333",
                  color: C.textSecondary, cursor: "pointer",
                  fontFamily: "var(--font-main, sans-serif)",
                  fontSize: "12px",
                }}
              >Annuler</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}