-- ══════════════════════════════════════════════════════════════════
-- BANQUE FANTÔME : les nouveautés du banquier
-- Écrit le 2026-10-05 à 20:25, à la demande de Jiiji : « une notification dans
-- mon interface à moi en tant qu'admin qui dit que j'ai des infos (nouvelle
-- newsletter, nouvel utilisateur...) », et « toutes les 3 actus » pour la lettre.
-- À coller dans Supabase → SQL Editor → Run, APRÈS supabase_lettre.sql.
-- ADDITIF et rejouable.
--
-- Ce qui compte comme nouveau, depuis la dernière fois que le banquier a ouvert
-- l'onglet correspondant de l'admin :
--   • comptes  : les comptes créés              (onglet Comptes et chiffres)
--   • billets  : les billets déposés au guichet (onglet Billets émis)
--   • market   : les dépôts au market           (onglet Market)
--   • abonnes  : inscriptions et désinscriptions des comptes à la lettre (onglet Lettre)
-- Ce que le banquier fait lui-même ne compte pas (ses billets, ses dépôts, les
-- partenaires qu'il inscrit).
--
-- La lettre est « prête » quand au moins seuil_actus actus publiées attendent
-- d'être racontées (3 par défaut, réglable dans Admin → Lettre). Ce seuil sert
-- seulement à prévenir : « Envoyer maintenant » marche toujours, et l'envoi du
-- lundi (s'il est coché un jour) n'en tient pas compte.
-- ══════════════════════════════════════════════════════════════════

-- 1. Le seuil de la lettre
alter table lettre_reglages add column if not exists seuil_actus int not null default 3;
do $$ begin
  alter table lettre_reglages add constraint lettre_reglages_seuil_check check (seuil_actus between 1 and 50);
exception when duplicate_object then null; end $$;

-- 2. Ce que le banquier a déjà vu, onglet par onglet
create table if not exists admin_vu (
  user_id   uuid not null references auth.users(id) on delete cascade,
  rubrique  text not null check (rubrique in ('comptes', 'billets', 'market', 'abonnes')),
  vu_at     timestamptz not null default now(),
  primary key (user_id, rubrique)
);
-- Aucune règle d'accès : la table ne se lit et ne s'écrit que par les deux fonctions ci-dessous.
alter table admin_vu enable row level security;

-- 3. Les compteurs. Sans passage enregistré, on compte les 7 derniers jours.
create or replace function admin_nouveautes()
returns json language plpgsql stable security definer set search_path = public as $$
declare
  moi uuid := auth.uid();
  defaut timestamptz := now() - interval '7 days';
  v_comptes timestamptz; v_billets timestamptz; v_market timestamptz; v_abonnes timestamptz;
begin
  if not bf_est_banquier() then raise exception 'Réservé au banquier.'; end if;
  select coalesce(max(vu_at) filter (where rubrique = 'comptes'), defaut),
         coalesce(max(vu_at) filter (where rubrique = 'billets'), defaut),
         coalesce(max(vu_at) filter (where rubrique = 'market'),  defaut),
         coalesce(max(vu_at) filter (where rubrique = 'abonnes'), defaut)
    into v_comptes, v_billets, v_market, v_abonnes
    from admin_vu where user_id = moi;
  return json_build_object(
    'comptes', json_build_object('depuis', v_comptes,
      'n', (select count(*) from profiles where created_at > v_comptes and id <> moi)),
    'billets', json_build_object('depuis', v_billets,
      'n', (select count(*) from billets_emis where created_at > v_billets and user_id is distinct from moi)),
    'market', json_build_object('depuis', v_market,
      'n', (select count(*) from objets where created_at > v_market and user_id is distinct from moi)),
    'abonnes', json_build_object('depuis', v_abonnes,
      'n', (select count(*) from lettre_abonnes where source = 'membre' and actif and created_at > v_abonnes),
      'desinscrits', (select count(*) from lettre_abonnes where not actif and desinscrit_at > v_abonnes)),
    'lettre', json_build_object(
      'en_attente', (select count(*) from actus where publie and en_lettre_at is null),
      'seuil', coalesce((select seuil_actus from lettre_reglages where id = 1), 3))
  );
end $$;
revoke all on function admin_nouveautes() from public, anon;
grant execute on function admin_nouveautes() to authenticated;

-- 4. « J'ai vu » : appelé par l'admin quand le banquier ouvre un onglet
create or replace function admin_marquer_vu(p_rubriques text[])
returns void language plpgsql security definer set search_path = public as $$
begin
  if not bf_est_banquier() then raise exception 'Réservé au banquier.'; end if;
  insert into admin_vu (user_id, rubrique, vu_at)
    select auth.uid(), r, now() from unnest(p_rubriques) r
     where r in ('comptes', 'billets', 'market', 'abonnes')
  on conflict (user_id, rubrique) do update set vu_at = excluded.vu_at;
end $$;
revoke all on function admin_marquer_vu(text[]) from public, anon;
grant execute on function admin_marquer_vu(text[]) to authenticated;
