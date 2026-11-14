-- ══════════════════════════════════════════════════════════════════
-- BANQUE FANTÔME : le fil d'actu (journal du projet, façon blog)
-- Écrit le 2026-10-04, à la demande de Jiiji : « un fil d'actu façon blog
-- en utilisant les images de la banque fantôme, comme ça on va pouvoir
-- suivre le projet ».
--
-- À coller dans Supabase → SQL Editor → Run. ADDITIF et rejouable :
-- une table neuve, un bucket neuf, rien de ce qui existe n'est modifié.
--
--   • tout le monde lit les nouvelles publiées ;
--   • seul le banquier (profiles.role = 'banquier') écrit, publie, modifie,
--     supprime, et voit les brouillons ;
--   • les photos envoyées depuis le site vont dans le bucket public « actus » ;
--     les photos livrées avec le site sont référencées par « images/actu/... ».
-- ══════════════════════════════════════════════════════════════════

-- 1. Qui est banquier (sert aux règles d'accès ci-dessous)
create or replace function bf_est_banquier() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'banquier')
$$;
grant execute on function bf_est_banquier() to anon, authenticated;

-- 2. La table des nouvelles
create table if not exists actus (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  date_actu   date not null default current_date,       -- date affichée (celle de l'événement)
  titre       text not null check (length(trim(titre)) between 1 and 160),
  texte       text,
  images      text[] not null default '{}',             -- chemins dans le bucket « actus » ou « images/actu/... »
  publie      boolean not null default false,           -- false = brouillon, visible du seul banquier
  auteur      uuid references auth.users(id) on delete set null default auth.uid()
);
create index if not exists actus_date_idx on actus (date_actu desc, created_at desc);

alter table actus enable row level security;
drop policy if exists actus_lecture on actus;
create policy actus_lecture on actus for select using (publie or bf_est_banquier());
drop policy if exists actus_ajout on actus;
create policy actus_ajout on actus for insert to authenticated with check (bf_est_banquier());
drop policy if exists actus_modif on actus;
create policy actus_modif on actus for update to authenticated using (bf_est_banquier()) with check (bf_est_banquier());
drop policy if exists actus_suppr on actus;
create policy actus_suppr on actus for delete to authenticated using (bf_est_banquier());

grant select on actus to anon, authenticated;
grant insert, update, delete on actus to authenticated;

-- 3. Le rangement des photos envoyées depuis le site
insert into storage.buckets (id, name, public) values ('actus', 'actus', true) on conflict (id) do nothing;

drop policy if exists actus_photos_ajout on storage.objects;
create policy actus_photos_ajout on storage.objects for insert to authenticated
  with check (bucket_id = 'actus' and bf_est_banquier());
drop policy if exists actus_photos_suppr on storage.objects;
create policy actus_photos_suppr on storage.objects for delete to authenticated
  using (bucket_id = 'actus' and bf_est_banquier());

-- 4. Les premiers brouillons (photos de Bureau\Banque_Fantome, réduites et livrées
--    avec le site dans public/images/actu/). Textes à relire par Jiiji avant publication.
insert into actus (date_actu, titre, texte, images, publie, auteur)
select v.date_actu, v.titre, v.texte, v.images, false, null
from (values
  (date '2026-03-26', 'Les billets passent sous cadre',
   'Premiers billets dessinés mis sous verre, par trois, comme des œuvres. Un billet encadré ne circule plus : il attend qu''on lui donne une valeur.',
   array['images/actu/2026-03-26-1.jpg', 'images/actu/2026-03-26-2.jpg', 'images/actu/2026-03-26-3.jpg', 'images/actu/2026-03-26-4.jpg']),
  (date '2026-04-25', 'Expo 3A : les liasses',
   'Une table couverte de liasses, bandes jaunes, rangées comme dans un coffre. On en soulève une : dedans, des billets dessinés à la main. Aux murs : « Ouvrez un compte aujourd''hui », « Offrez-vous de la monnaie ».',
   array['images/actu/2026-04-25-1.jpg', 'images/actu/2026-04-25-2.jpg', 'images/actu/2026-04-25-3.jpg', 'images/actu/2026-04-25-4.jpg', 'images/actu/2026-04-25-5.jpg']),
  (date '2026-06-27', 'La banque s''installe',
   'Montage de l''espace : l''affiche « Be rich, create your monnaie », les dessins au mur, et une monnaie de pièces jaunes posées une à une.',
   array['images/actu/2026-06-27-1.jpg', 'images/actu/2026-06-27-2.jpg', 'images/actu/2026-06-27-3.jpg', 'images/actu/2026-06-27-4.jpg']),
  (date '2026-09-29', 'Le guichet est ouvert',
   'Tablettes lumineuses, imprimante à billets, valise pleine, coffre rouge et le site en direct sur l''écran : on dessine sa monnaie, on la fait créditer, on la dépense au market.',
   array['images/actu/2026-09-29-1.jpg', 'images/actu/2026-09-29-2.jpg', 'images/actu/2026-09-29-3.jpg', 'images/actu/2026-09-29-4.jpg', 'images/actu/2026-09-29-5.jpg', 'images/actu/2026-09-29-6.jpg'])
) as v(date_actu, titre, texte, images)
where not exists (select 1 from actus a where a.titre = v.titre);

-- 5. À faire UNE fois, pour que Jiiji puisse publier (remplacer le pseudo) :
--   begin;
--   select set_config('bf.interne', '1', true);
--   update profiles set role = 'banquier' where pseudo = 'PSEUDO_DE_JIIJI';
--   commit;

-- 6. Brouillon ajouté le 2026-10-04 (atelier du 25/09, mains et billets seulement, pas de visages)
insert into actus (date_actu, titre, texte, images, publie, auteur)
select date '2026-09-25', 'Premier atelier au Quadrilatère : on fait du bifton',
       'Premier atelier de la Banque Fantôme au Quadrilatère. Feutres, crayons, une grande table : chacun dessine ses billets.',
       array['images/actu/2026-09-25-1.jpg', 'images/actu/2026-09-25-2.jpg', 'images/actu/2026-09-25-3.jpg'], false, null
where not exists (select 1 from actus where titre = 'Premier atelier au Quadrilatère : on fait du bifton');

-- 7. Six actus ajoutées le 2026-10-12 vers 21 h, publiées (photos de
--    Bureau\Banque_Fantome\04_photos\actu-1 à actu-6). Visages des enfants et des
--    participants du Quadrilatère couverts de fleurs ; EHPAD et GEM laissés tels quels,
--    à la demande de Jiiji. La première photo de chaque actu est celle de la lettre.
insert into actus (date_actu, titre, texte, images, publie, auteur)
select v.date_actu, v.titre, v.texte, v.images, true, null
from (values
  (date '2026-10-06', 'École Simone-Veil, Bresles : la monnaie des CM1',
   'Une matinée avec les CM1 du groupe scolaire Simone-Veil, à Bresles. Chacun reçoit sa planche de billets, du 5 au 200, et la remplit comme il l''entend : un cœur, une bouche, une pyramide avec un œil dedans, des gribouillis serrés jusqu''à faire disparaître le pont. Le billet n''a pas encore de valeur, mais il a déjà un style.',
   array['images/actu/2026-10-06-veil-1.jpg', 'images/actu/2026-10-06-veil-2.jpg', 'images/actu/2026-10-06-veil-3.jpg', 'images/actu/2026-10-06-veil-4.jpg', 'images/actu/2026-10-06-veil-5.jpg', 'images/actu/2026-10-06-veil-6.jpg']),
  (date '2026-10-06', 'Deux classes de maternelle à la banque',
   'L''après-midi, deux classes de l''école maternelle Picasso sont venues au Quadrilatère. À cet âge, on ne fait pas de détail : le billet de 5 se colorie en entier, le 10 reçoit des ronds verts, rouges et roses. Personne n''a demandé combien ça valait.',
   array['images/actu/2026-10-06-picasso-1.jpg', 'images/actu/2026-10-06-picasso-2.jpg', 'images/actu/2026-10-06-picasso-3.jpg', 'images/actu/2026-10-06-picasso-4.jpg']),
  (date '2026-10-07', 'Les Lucioles, première séance',
   'Première séance avec Les Lucioles. Autour de la table, des billets de 20, de 50 et de 200 à refaire à sa façon. Sur l''un, un prénom écrit en grand à la place du portrait ; sur un autre, un volcan qui crache sa lave en travers du billet.',
   array['images/actu/2026-10-07-lucioles-1.jpg', 'images/actu/2026-10-07-lucioles-2.jpg', 'images/actu/2026-10-07-lucioles-3.jpg', 'images/actu/2026-10-07-lucioles-4.jpg', 'images/actu/2026-10-07-lucioles-5.jpg']),
  (date '2026-10-07', 'Fin de journée au Quadrilatère',
   'En fin d''après-midi, nouvelle tablée au Quadrilatère. Les planches de 5, 10, 20, 50 et 100 attendent en piles, la tablette lumineuse sert à décalquer, et à la fin certains ont déjà une liasse en main.',
   array['images/actu/2026-10-07-quadri-3.jpg', 'images/actu/2026-10-07-quadri-4.jpg', 'images/actu/2026-10-07-quadri-2.jpg', 'images/actu/2026-10-07-quadri-1.jpg']),
  (date '2026-10-09', 'Les sous de l''EHPAD',
   'Vendredi, la banque s''est installée à l''EHPAD. Feutres, gommettes étoiles et papillons, billets de 20 et de 200 : les résidents ont décoré leurs billets une gommette après l''autre, avec un soin qu''aucune banque centrale n''a jamais eu.',
   array['images/actu/2026-10-09-ehpad-1.jpg', 'images/actu/2026-10-09-ehpad-2.jpg', 'images/actu/2026-10-09-ehpad-3.jpg', 'images/actu/2026-10-09-ehpad-4.jpg', 'images/actu/2026-10-09-ehpad-5.jpg', 'images/actu/2026-10-09-ehpad-6.jpg', 'images/actu/2026-10-09-ehpad-7.jpg']),
  (date '2026-10-12', 'Le GEM passe à la banque',
   'Lundi, le GEM de Beauvais est venu à la banque, au Quadrilatère. Deux de ses membres et Marine, qui les accompagnait, posent avec leurs billets : une planche entière, une liasse déjà découpée, et le sourire de ceux qui viennent de fabriquer leur propre argent.',
   array['images/actu/2026-10-12-gem-1.jpg'])
) as v(date_actu, titre, texte, images)
where not exists (select 1 from actus a where a.titre = v.titre);

-- 8. Actu ajoutée le 2026-10-13 vers 18 h, à la demande de Jiiji (« les ajouts de billets
--    doivent faire partie des actus ») : les 62 planches à imprimer de la page S'enrichir.
--    Couverture en éventail fabriquée à partir des aperçus, puis une planche par valeur.
--    Quand de nouvelles planches arrivent sur le site, une actu les annonce de la même façon.
insert into actus (date_actu, titre, texte, images, publie, auteur)
select date '2026-10-13', '62 planches de billets à imprimer',
  'Les billets dessinés en atelier ont maintenant leurs planches : 62 feuilles A4, du 5 au 500, à télécharger sur le site de la banque. On imprime chez soi, on découpe, et la monnaie circule en vrai papier.

Il y a les rayures arc-en-ciel du 50, la souris du 100, l''ourson à la fleur, les zigzags du 20 : chaque planche reprend un billet tel qu''il a été dessiné, coups de feutre compris.

Toutes les planches sont sur la page « S''enrichir ».',
  array['images/actu/2026-10-13-planches-1.jpg', 'images/actu/2026-10-13-planches-2.jpg', 'images/actu/2026-10-13-planches-3.jpg', 'images/actu/2026-10-13-planches-4.jpg', 'images/actu/2026-10-13-planches-5.jpg', 'images/actu/2026-10-13-planches-6.jpg', 'images/actu/2026-10-13-planches-7.jpg', 'images/actu/2026-10-13-planches-8.jpg'],
  true, null
where not exists (select 1 from actus a where a.titre = '62 planches de billets à imprimer');

-- 9. Actu ajoutée le 2026-10-13 vers 20 h : les billets de l'atelier (chiffres de la session
--    atelier-billets, comptés page par page dans les PDF d'impression A4) et les 772 billets à
--    planches de SCAN-BILLET-2 (une planche A4 par dessin, comme les 62 de SCAN-BILLET-1). Les PDF, aperçus et vignettes vivent dans le dépôt
--    billets-banque-fantome (servi à jeansonpechin.com/billets-banque-fantome/) ; seules les
--    images de l'actu sont livrées avec le site. Jiiji : tous en ligne, sans tri ; les billets
--    sont « prêts à imprimer », pas encore imprimés.
insert into actus (date_actu, titre, texte, images, publie, auteur)
select date '2026-10-13', '837 dessins, 8 381 billets prêts à imprimer',
  'Tous les billets dessinés en atelier sont passés au scanner : 837 dessins originaux, d''enfants et d''adultes, pour une valeur de 45 810 €. Chacun est tiré à dix exemplaires, ce qui fait 8 381 billets prêts à imprimer, pour 459 290 €. Le détail par coupure est dans le tableau.

Les 772 dessins du dernier scan ont aussi chacun leur planche A4 en ligne, remplie de ce seul billet à taille réelle, avec ses traits de coupe. On imprime, on découpe, et la monnaie circule. Avec les 62 premières, cela fait 834 planches sur la page « S''enrichir ».

Parmi elles : des papillons, des extraterrestres en soucoupe, une fusée, un Pac-Man, un ours, une plage à palmiers, et un « We ♥ Beauvais » sur un 500.',
  array['images/actu/2026-10-13-billets-1.jpg', 'images/actu/2026-10-13-billets-tableau.jpg', 'images/actu/2026-10-13-billets-2.jpg', 'images/actu/2026-10-13-billets-3.jpg', 'images/actu/2026-10-13-billets-4.jpg', 'images/actu/2026-10-13-billets-5.jpg', 'images/actu/2026-10-13-billets-6.jpg', 'images/actu/2026-10-13-billets-7.jpg', 'images/actu/2026-10-13-billets-8.jpg'],
  true, null
where not exists (select 1 from actus a where a.titre = '837 dessins, 8 381 billets prêts à imprimer');

-- 10. Dix-sept actus ajoutées le 2026-11-14 vers 12 h 30, publiées, à la demande de Jiiji
--     (« mettre en ligne et dans les actus »). Photos du lot du 12/10 au 13/11, réduites à
--     1600 px, sans EXIF. Chaque photo a été regardée avant : aucun visage reconnaissable,
--     aucun prénom d'enfant, aucun écran ni numéro lisible. Textes courts, sans nom de lieu
--     ni de personne : Jiiji les complète depuis la page Actu.
insert into actus (date_actu, titre, texte, images, publie, auteur)
select v.date_actu, v.titre, v.texte, v.images, true, null
from (values
  (date '2026-10-14', 'Des billets par terre, des gilets orange',
   'Dans une grande salle d''exposition, un groupe d''enfants en gilets orange s''assoit par terre. Ils trient leurs billets dessinés, se les échangent, en laissent un petit tas au pied du mur. Ce jour-là, la banque n''a pas de guichet : elle tient dans les mains.',
   array['images/actu/2026-10-14-gilets-1.jpg', 'images/actu/2026-10-14-gilets-2.jpg']),
  (date '2026-10-16', 'Une mallette dans un rectangle',
   'Une mallette en métal est posée par terre, au milieu d''un rectangle de ruban jaune et noir, à côté d''un distributeur de boissons. Personne n''y touche. C''est un dépôt.',
   array['images/actu/2026-10-16-mallette-1.jpg', 'images/actu/2026-10-16-mallette-2.jpg']),
  (date '2026-10-21', 'On dessine à la banque',
   'Trois personnes dessinent, assises à de longues tables, sous une lampe. Sur une autre table, des billets dessinés et la caisse rouge, ouverte. Au fond, quelqu''un s''est installé devant un vieil ordinateur, sous l''écran de projection.',
   array['images/actu/2026-10-21-tables-1.jpg', 'images/actu/2026-10-21-tables-2.jpg', 'images/actu/2026-10-21-tables-3.jpg', 'images/actu/2026-10-21-tables-4.jpg', 'images/actu/2026-10-21-tables-5.jpg']),
  (date '2026-10-23', 'Les billets sortent de l''imprimerie',
   'Des piles de planches de billets : 10, 20, 50, 100, 200 et 500. Sur le billet de 100, une souris à grandes oreilles et les mots « Cash ton flouze ». Les planches passent ensuite au massicot, et la monnaie devient des liasses.',
   array['images/actu/2026-10-23-imprimerie-1.jpg', 'images/actu/2026-10-23-imprimerie-2.jpg', 'images/actu/2026-10-23-imprimerie-3.jpg', 'images/actu/2026-10-23-imprimerie-4.jpg', 'images/actu/2026-10-23-imprimerie-5.jpg', 'images/actu/2026-10-23-imprimerie-6.jpg', 'images/actu/2026-10-23-imprimerie-7.jpg']),
  (date '2026-10-23', 'Une table pleine de billets',
   'L''après-midi, les billets découpés sont rangés en piles serrées sur une grande table, à côté de la caisse rouge. Autour : les meubles jaunes, un présentoir couvert de billets dessinés, un écran où défile du texte, et l''affiche « Be rich, create your monnaie ».',
   array['images/actu/2026-10-23-table-1.jpg', 'images/actu/2026-10-23-table-2.jpg', 'images/actu/2026-10-23-table-3.jpg', 'images/actu/2026-10-23-table-4.jpg', 'images/actu/2026-10-23-table-5.jpg', 'images/actu/2026-10-23-table-6.jpg', 'images/actu/2026-10-23-table-7.jpg', 'images/actu/2026-10-23-table-8.jpg']),
  (date '2026-10-23', 'Un bureau d''accueil qui imprime des billets',
   'Un bureau d''accueil arrondi, du parquet, des poteaux jaunes, des fenêtres sur des toits de brique. Dessus : un écran, une imprimante, et un petit panneau : « Prochainement, ouverture de votre succursale ». Le 23 octobre, l''imprimante sort une planche de billets de 500.',
   array['images/actu/2026-10-23-accueil-1.jpg', 'images/actu/2026-10-23-accueil-2.jpg', 'images/actu/2026-10-23-accueil-3.jpg', 'images/actu/2026-10-23-accueil-4.jpg']),
  (date '2026-10-25', 'Une forme bleue sur l''écran',
   'Sur l''écran de projection, une forme bleue en dentelle. Autour, la salle sans public : les tables, les écrans, les meubles jaunes. La banque tourne même quand il n''y a personne.',
   array['images/actu/2026-10-25-ecran-1.jpg', 'images/actu/2026-10-25-ecran-2.jpg']),
  (date '2026-10-26', 'BF en lumière',
   'Une guirlande lumineuse fixée au mur dessine deux lettres : B et F. Elle change de couleur : jaune et vert, blanc, orange, bleu. Une enseigne de banque, en plus doux.',
   array['images/actu/2026-10-26-lumiere-1.jpg', 'images/actu/2026-10-26-lumiere-2.jpg', 'images/actu/2026-10-26-lumiere-3.jpg', 'images/actu/2026-10-26-lumiere-4.jpg']),
  (date '2026-10-29', 'Le bureau du banquier',
   'Dans la salle, un bureau avec un écran, un clavier et des pots de feutres. Une veste attend sur le dossier du fauteuil. À gauche, le présentoir de billets dessinés. Le banquier s''est absenté.',
   array['images/actu/2026-10-29-bureau-1.jpg', 'images/actu/2026-10-29-bureau-2.jpg']),
  (date '2026-11-02', 'Le Magot : une table de chéquiers',
   'Une table couverte de chéquiers blancs à bande jaune, empilés. Une main en ouvre un : dedans, un dessin rond, très coloré. Le panneau dit « Le Magot » et « Chéquier Claude Monnaie, 15 € ».',
   array['images/actu/2026-11-02-magot-1.jpg', 'images/actu/2026-11-02-magot-2.jpg', 'images/actu/2026-11-02-magot-3.jpg']),
  (date '2026-11-02', 'Tour de la salle',
   'Un tour complet de la salle, sans public. La table de billets, la caisse rouge « Dépôt d''espèces », un masque doré et un faux lingot, une caisse de tampons en bois. Sur les murs et les poteaux, des panneaux : « Ce que j''ai obtenu », « Les tables lumineuses », « La mallette », « Ouvrez un compte ».',
   array['images/actu/2026-11-02-salle-1.jpg', 'images/actu/2026-11-02-salle-2.jpg', 'images/actu/2026-11-02-salle-3.jpg', 'images/actu/2026-11-02-salle-4.jpg', 'images/actu/2026-11-02-salle-5.jpg']),
  (date '2026-11-04', 'Un pochoir de billet de 5 imprimé en 3D',
   'L''écran de l''imprimante 3D affiche « pochoir-005-euros ». Sur le plateau, le dessin d''un billet de 5 apparaît en fines lignes blanches, couche après couche.',
   array['images/actu/2026-11-04-pochoir-1.jpg', 'images/actu/2026-11-04-pochoir-2.jpg', 'images/actu/2026-11-04-pochoir-3.jpg']),
  (date '2026-11-06', 'La salle en jaune',
   'La salle est éclairée en jaune. Sur une table lumineuse, une rosace dessinée aux feutres, à côté de roues dentées en plastique et d''un dessin encadré.',
   array['images/actu/2026-11-06-jaune-1.jpg', 'images/actu/2026-11-06-jaune-2.jpg', 'images/actu/2026-11-06-jaune-3.jpg', 'images/actu/2026-11-06-jaune-4.jpg']),
  (date '2026-11-07', 'Le billet et son ombre',
   'Une main tient un pochoir noir de billet de 5 devant un mur de pierre. Le soleil passe à travers : l''ombre du billet se pose sur le mur, puis sur le sol. Un billet qui ne pèse rien et qu''on ne peut pas ramasser.',
   array['images/actu/2026-11-07-ombre-1.jpg', 'images/actu/2026-11-07-ombre-2.jpg']),
  (date '2026-11-10', 'Peinture sur billets, chez les petits',
   'Dans une classe de jeunes enfants, des planches de billets de 10, 200 et 500 sont peintes à la gouache. Elles sèchent sur un fil, tenues par des pinces à linge. D''autres sont dessinées au feutre : des fleurs, des cœurs, des bonshommes.',
   array['images/actu/2026-11-10-gouache-1.jpg', 'images/actu/2026-11-10-gouache-2.jpg', 'images/actu/2026-11-10-gouache-3.jpg', 'images/actu/2026-11-10-gouache-4.jpg', 'images/actu/2026-11-10-gouache-5.jpg', 'images/actu/2026-11-10-gouache-6.jpg', 'images/actu/2026-11-10-gouache-7.jpg']),
  (date '2026-11-12', 'Une bibliothèque, un écran, des gradins',
   'Dans une bibliothèque, un écran d''ordinateur éteint attend dans une niche, au bout d''un rayonnage courbe. Plus loin, une petite salle à gradins rouges avec un projecteur. La banque cherche où ouvrir sa prochaine agence.',
   array['images/actu/2026-11-12-gradins-1.jpg', 'images/actu/2026-11-12-gradins-2.jpg']),
  (date '2026-11-13', 'Des billets dessinés par une classe',
   'Dans une classe, les enfants dessinent aux feutres sur des planches de billets de 5, 10, 20, 100 et 500. On y trouve un ours brun, un ballon de basket, des maisons, un arc-en-ciel, des personnages.',
   array['images/actu/2026-11-13-classe-1.jpg', 'images/actu/2026-11-13-classe-2.jpg', 'images/actu/2026-11-13-classe-3.jpg', 'images/actu/2026-11-13-classe-4.jpg', 'images/actu/2026-11-13-classe-5.jpg', 'images/actu/2026-11-13-classe-6.jpg', 'images/actu/2026-11-13-classe-7.jpg', 'images/actu/2026-11-13-classe-8.jpg'])
) as v(date_actu, titre, texte, images)
where not exists (select 1 from actus a where a.titre = v.titre);
