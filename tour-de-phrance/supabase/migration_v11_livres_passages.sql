-- Tour de Phrance — migration v11 : livres et passages
-- À exécuter UNE FOIS dans Supabase → SQL Editor, sur un projet où schema.sql
-- a déjà été appliqué (tables profiles, visited_places, comments existantes).
-- Le script est rejouable sans casse (if not exists / on conflict).
--
-- Ce qui change :
--   * books     : un compte possède des livres (éditions) ;
--   * checkins  : un passage = livre × lieu × résultat × date (historique conservé) ;
--   * profiles.is_admin : rôle administrateur (utilisé à l'étape suivante) ;
--   * chaque nouveau compte reçoit un livre par défaut ;
--   * les anciennes coches visited_places sont converties en passages
--     « Passé, sans précision » sur le livre par défaut de chaque compte.
-- visited_places n'est PAS supprimée ici (filet de sécurité) : à supprimer
-- plus tard, quand la v11 aura tourné quelques semaines.

-- ── 1. Rôle admin ────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- ── 2. Livres ────────────────────────────────────────────────────────────────
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  visible boolean not null default true,   -- étape 2 : « livre discret » = false
  created_at timestamptz not null default now()
);

create index if not exists books_owner_idx on public.books (owner_id, created_at);

alter table public.books enable row level security;

drop policy if exists "owners can read their books" on public.books;
create policy "owners can read their books"
on public.books for select
using (auth.uid() = owner_id);

drop policy if exists "owners can insert their books" on public.books;
create policy "owners can insert their books"
on public.books for insert
with check (auth.uid() = owner_id);

drop policy if exists "owners can update their books" on public.books;
create policy "owners can update their books"
on public.books for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "owners can delete their books" on public.books;
create policy "owners can delete their books"
on public.books for delete
using (auth.uid() = owner_id);

-- ── 3. Passages ──────────────────────────────────────────────────────────────
create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id text not null,
  status text not null check (status in ('deposited', 'refused', 'not_taking', 'closed', 'follow_up', 'visited')),
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now()
);

create index if not exists checkins_user_idx on public.checkins (user_id, created_at desc);
create index if not exists checkins_book_place_idx on public.checkins (book_id, place_id, created_at desc);
create index if not exists checkins_place_idx on public.checkins (place_id, created_at desc); -- étape 2 : agrégats par lieu

alter table public.checkins enable row level security;

drop policy if exists "owners can read their checkins" on public.checkins;
create policy "owners can read their checkins"
on public.checkins for select
using (auth.uid() = user_id);

-- Insertion : le passage doit appartenir à l'utilisateur ET à un de ses livres.
drop policy if exists "owners can insert their checkins" on public.checkins;
create policy "owners can insert their checkins"
on public.checkins for insert
with check (
  auth.uid() = user_id
  and exists (select 1 from public.books b where b.id = book_id and b.owner_id = auth.uid())
);

drop policy if exists "owners can update their checkins" on public.checkins;
create policy "owners can update their checkins"
on public.checkins for update
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (select 1 from public.books b where b.id = book_id and b.owner_id = auth.uid())
);

drop policy if exists "owners can delete their checkins" on public.checkins;
create policy "owners can delete their checkins"
on public.checkins for delete
using (auth.uid() = user_id);

-- ── 4. Livre par défaut à la création d'un compte ───────────────────────────
-- Remplace handle_new_user (schema.sql) : profil + livre par défaut.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, pseudo)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'pseudo', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  insert into public.books (owner_id, title)
  select new.id, 'Mon édition'
  where not exists (select 1 from public.books where owner_id = new.id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- ── 5. Livre par défaut pour TOUS les comptes existants sans livre ──────────
-- (le trigger ne joue que pour les comptes créés après cette migration)
insert into public.books (owner_id, title)
select u.id, 'Mon édition'
from auth.users u
where not exists (select 1 from public.books b where b.owner_id = u.id);

-- ── 6. Migration des anciennes coches (si la table existe) ──────────────────
-- une coche → un passage « visited » daté de la coche, sur le premier livre du compte
do $$
begin
  if to_regclass('public.visited_places') is not null then
    insert into public.checkins (book_id, user_id, place_id, status, created_at)
    select b.id, v.user_id, v.place_id, 'visited', v.visited_at
    from public.visited_places v
    join lateral (
      select id from public.books where owner_id = v.user_id order by created_at asc limit 1
    ) b on true
    where not exists (
      select 1 from public.checkins c
      where c.user_id = v.user_id and c.place_id = v.place_id and c.book_id = b.id
    );
  end if;
end $$;

-- ── 7. Vérification (facultatif, à lire dans le résultat) ───────────────────
select
  (select count(*) from auth.users) as comptes,
  (select count(*) from public.books) as livres,
  (select count(*) from public.checkins) as passages;
