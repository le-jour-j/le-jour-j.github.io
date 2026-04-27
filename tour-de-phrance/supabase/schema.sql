-- Tour de Phrance — Supabase schema
-- À exécuter dans Supabase SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  pseudo text,
  created_at timestamptz not null default now()
);

create table if not exists public.visited_places (
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id text not null,
  visited_at timestamptz not null default now(),
  primary key (user_id, place_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('location', 'route')),
  target_id text not null,
  body text not null check (char_length(body) <= 2000),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.visited_places enable row level security;
alter table public.comments enable row level security;

create policy "profiles are readable by everyone"
on public.profiles for select
using (true);

create policy "users can insert their own profile"
on public.profiles for insert
with check (auth.uid() = id);

create policy "users can update their own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "users can read their own visited places"
on public.visited_places for select
using (auth.uid() = user_id);

create policy "users can insert their own visited places"
on public.visited_places for insert
with check (auth.uid() = user_id);

create policy "users can delete their own visited places"
on public.visited_places for delete
using (auth.uid() = user_id);

create policy "comments are readable by everyone"
on public.comments for select
using (true);

create policy "authenticated users can insert comments"
on public.comments for insert
with check (auth.uid() = author_id);

create policy "authors can update their comments"
on public.comments for update
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

create policy "authors can delete their comments"
on public.comments for delete
using (auth.uid() = author_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, pseudo)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'pseudo', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create index if not exists comments_target_idx
on public.comments (target_type, target_id, created_at desc);
