-- Tour de Phrance — migration v13 : le catalogue public des livres
-- À exécuter dans Supabase → SQL Editor APRÈS migration_v11_livres_passages.sql.
-- Rejouable sans casse.
--
-- Ce que ça ouvre : une page où tout le monde, connecté ou non, voit les livres
-- déposés et les librairies qui les vendent.
--
-- CE QUI DEVIENT PUBLIC : le titre du livre, sa description, son année, son
-- prix, le pseudo de la personne qui le dépose, et les lieux où il est EN DÉPÔT
-- (dernier passage = « déposé »), avec la date.
--
-- CE QUI RESTE PRIVÉ, et doit le rester : les refus, les « ne prend pas », les
-- « fermé ce jour-là », les « à relancer », toutes les notes de passage (elles
-- contiennent des contacts et des appréciations), l'email et l'identifiant des
-- comptes. Publier qu'une librairie a refusé un livre nuirait à la librairie
-- comme à l'artiste : le catalogue ne montre que ce qui est effectivement en
-- vente. C'est la vue ci-dessous qui garantit ce filtrage, pas l'application.

-- ── 1. La fiche du livre ─────────────────────────────────────────────────────
alter table public.books add column if not exists description text
  check (description is null or char_length(description) <= 600);
alter table public.books add column if not exists author text
  check (author is null or char_length(author) <= 120);
alter table public.books add column if not exists year smallint
  check (year is null or year between 1900 and 2100);
alter table public.books add column if not exists price_cents integer
  check (price_cents is null or (price_cents >= 0 and price_cents <= 1000000));
alter table public.books add column if not exists url text
  check (url is null or char_length(url) <= 300);

-- `visible` existe depuis la v11 : c'est l'interrupteur « livre discret ».
-- true (défaut) = le livre paraît au catalogue ; false = il n'y paraît pas,
-- l'auteur·ice garde son suivi pour lui.
comment on column public.books.visible is
  'true : le livre et ses dépôts paraissent au catalogue public. false : livre discret.';

-- ── 2. Le catalogue ──────────────────────────────────────────────────────────
-- Une ligne = un livre en dépôt dans un lieu, aujourd'hui.
-- « Aujourd'hui » : on ne garde que le DERNIER passage de chaque couple
-- livre × lieu, et seulement s'il vaut « déposé ». Un livre repris repasse donc
-- automatiquement hors catalogue, sans rien supprimer de l'historique.
create or replace view public.catalogue as
with dernier_passage as (
  select distinct on (c.book_id, c.place_id)
    c.book_id, c.place_id, c.status, c.created_at
  from public.checkins c
  order by c.book_id, c.place_id, c.created_at desc
)
select
  b.id            as book_id,
  b.title         as book_title,
  b.description   as book_description,
  b.author        as book_author,
  b.year          as book_year,
  b.price_cents   as book_price_cents,
  b.url           as book_url,
  b.created_at    as book_created_at,
  p.pseudo        as owner_pseudo,
  d.place_id      as place_id,
  d.created_at    as deposited_at
from dernier_passage d
join public.books b on b.id = d.book_id and b.visible
left join public.profiles p on p.id = b.owner_id
where d.status = 'deposited';

-- La vue s'exécute avec les droits de son propriétaire et contourne donc la RLS
-- de `checkins` : c'est voulu, et c'est pour cela qu'elle ne sélectionne que les
-- colonnes publiables (ni user_id, ni note, ni statut autre que « déposé »).
-- Ne JAMAIS y ajouter checkins.note ni checkins.user_id.
alter view public.catalogue set (security_invoker = off);

revoke all on public.catalogue from anon, authenticated;
grant select on public.catalogue to anon, authenticated;

-- ── 3. Les livres visibles sont lisibles par tout le monde ──────────────────
-- (nécessaire pour lister un livre qui n'a encore aucun dépôt, et pour que la
-- page catalogue affiche sa fiche.)
drop policy if exists "visible books are public" on public.books;
create policy "visible books are public"
on public.books for select
using (visible or auth.uid() = owner_id);

-- La policy v11 « owners can read their books » reste : les deux se cumulent en
-- OR, un propriétaire voit donc toujours ses livres discrets.

-- ── 4. Index pour le catalogue ──────────────────────────────────────────────
create index if not exists books_visible_idx on public.books (visible) where visible;

-- ── 5. Vérification ─────────────────────────────────────────────────────────
select
  (select count(*) from public.books where visible)      as livres_publics,
  (select count(*) from public.catalogue)                as depots_au_catalogue,
  (select count(distinct book_id) from public.catalogue) as livres_au_catalogue,
  (select count(distinct place_id) from public.catalogue) as lieux_au_catalogue;
