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
   'Lundi, visite du GEM à la banque. Trois de ses membres posent avec leurs billets : une planche entière, une liasse déjà découpée, et le sourire de ceux qui viennent de fabriquer leur propre argent.',
   array['images/actu/2026-10-12-gem-1.jpg'])
) as v(date_actu, titre, texte, images)
where not exists (select 1 from actus a where a.titre = v.titre);
