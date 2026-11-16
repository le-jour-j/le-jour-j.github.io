-- ══════════════════════════════════════════════════════════════════
-- L'EXPO DES FAUSSAIRES : page d'organisation partagee (/expo-des-faussaires/)
-- Ecrit le 2026-11-16, a la demande de Jiiji : une page ou ses amis cochent
-- leurs jours, les arrets et les choses a faire, sans compte, depuis le telephone.
--
-- A jouer dans le projet Supabase eopygceibkbtkqmrgnxt (le meme que la Banque
-- Fantome). ADDITIF et rejouable : deux tables privees, deux fonctions.
--
--   * expo_orga_reglages : le code d'acces. Table privee (RLS, aucune politique).
--     LE CODE N'EST PAS DANS CE FICHIER NI DANS LE DEPOT. Il a ete pose a la main :
--       insert into expo_orga_reglages (cle, valeur) values ('code', '<code>')
--       on conflict (cle) do update set valeur = excluded.valeur;
--     La page le lit dans le fragment de l'adresse (/expo-des-faussaires/#<code>).
--   * expo_orga : l'etat partage, une ligne par case ou par texte. Table privee.
--   * expo_orga_lire(p_code) : rend toutes les lignes si le code est bon.
--   * expo_orga_ecrire(p_code, p_cle, p_valeur) : upsert, ou suppression si la
--     valeur est vide. Cle 80 caracteres max (a-z 0-9 . _ : -), valeur 500 max,
--     400 lignes max.
-- anon n'a le droit d'executer que ces deux fonctions.
-- ══════════════════════════════════════════════════════════════════

create table if not exists public.expo_orga_reglages (
  cle    text primary key,
  valeur text not null
);
alter table public.expo_orga_reglages enable row level security;
revoke all on public.expo_orga_reglages from anon, authenticated;

create table if not exists public.expo_orga (
  cle    text primary key,
  valeur text not null,
  maj_at timestamptz not null default now()
);
alter table public.expo_orga enable row level security;
revoke all on public.expo_orga from anon, authenticated;

create or replace function public.expo_orga_lire(p_code text)
returns table (cle text, valeur text, maj_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_code text;
begin
  select r.valeur into v_code from public.expo_orga_reglages r where r.cle = 'code';
  if v_code is null or p_code is null or length(p_code) < 20 or p_code <> v_code then
    raise exception 'refuse' using errcode = '42501';
  end if;
  return query select o.cle, o.valeur, o.maj_at from public.expo_orga o order by o.cle;
end;
$$;

create or replace function public.expo_orga_ecrire(p_code text, p_cle text, p_valeur text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_code text;
  v_n    int;
begin
  select r.valeur into v_code from public.expo_orga_reglages r where r.cle = 'code';
  if v_code is null or p_code is null or length(p_code) < 20 or p_code <> v_code then
    raise exception 'refuse' using errcode = '42501';
  end if;

  if p_cle is null or length(p_cle) = 0 or length(p_cle) > 80
     or p_cle !~ '^[a-z0-9._:-]+$' then
    raise exception 'cle invalide' using errcode = '22023';
  end if;
  if p_valeur is not null and length(p_valeur) > 500 then
    raise exception 'valeur trop longue' using errcode = '22023';
  end if;

  if p_valeur is null or btrim(p_valeur) = '' then
    delete from public.expo_orga where cle = p_cle;
    return;
  end if;

  if not exists (select 1 from public.expo_orga where cle = p_cle) then
    select count(*) into v_n from public.expo_orga;
    if v_n >= 400 then
      raise exception 'trop de lignes' using errcode = '54000';
    end if;
  end if;

  insert into public.expo_orga (cle, valeur, maj_at)
  values (p_cle, p_valeur, now())
  on conflict (cle) do update set valeur = excluded.valeur, maj_at = now();
end;
$$;

revoke all on function public.expo_orga_lire(text) from public;
revoke all on function public.expo_orga_ecrire(text, text, text) from public;
grant execute on function public.expo_orga_lire(text) to anon;
grant execute on function public.expo_orga_ecrire(text, text, text) to anon;
