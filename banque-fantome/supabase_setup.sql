-- ══════════════════════════════════════════════
-- BANQUE FANTÔME — Setup SQL Supabase
-- Colle ce script dans : Supabase → SQL Editor → Run
-- ══════════════════════════════════════════════

-- 1. TABLE PROFILES (pseudos)
create table if not exists profiles (
  id   uuid primary key references auth.users(id) on delete cascade,
  pseudo text not null,
  created_at timestamptz default now()
);

-- 2. TABLE OBJETS
create table if not exists objets (
  id          uuid primary key default gen_random_uuid(),
  titre       text not null,
  description text not null,
  histoire    text,
  lieu        text,
  image_path  text,
  pseudo      text,
  user_id     uuid references auth.users(id) on delete set null,
  statut      text default 'disponible',   -- disponible | réservé | échangé
  numero      int generated always as identity,
  created_at  timestamptz default now()
);

-- 3. RLS (Row Level Security)
alter table profiles enable row level security;
alter table objets    enable row level security;

-- Profiles : lecture publique, écriture par soi-même
create policy "profiles_read"   on profiles for select using (true);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- Objets : lecture publique pour tous
create policy "objets_read"     on objets for select using (true);
-- Insertion : tout utilisateur authentifié OU anonyme (pour les dépôts publics)
create policy "objets_insert"   on objets for insert with check (true);
-- Mise à jour / suppression : seulement son propre objet
create policy "objets_update"   on objets for update using (auth.uid() = user_id);
create policy "objets_delete"   on objets for delete using (auth.uid() = user_id);

-- 4. STORAGE BUCKET (à créer aussi dans l'UI Supabase Storage)
-- Nom du bucket : objets
-- Accès public : OUI (pour afficher les images sans authentification)
-- Policies bucket : insert pour tous les auth, select pour tous

-- Insert storage policy (à exécuter si le bucket est déjà créé)
insert into storage.buckets (id, name, public)
values ('objets', 'objets', true)
on conflict (id) do nothing;

create policy "storage_read" on storage.objects
  for select using (bucket_id = 'objets');

create policy "storage_insert" on storage.objects
  for insert with check (bucket_id = 'objets');

create policy "storage_delete" on storage.objects
  for delete using (bucket_id = 'objets' and auth.uid()::text = (storage.foldername(name))[1]);
