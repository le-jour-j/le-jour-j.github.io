-- ══════════════════════════════════════════════════════════════════
-- BANQUE FANTÔME : la lettre de la banque (newsletter hebdomadaire)
-- Écrit le 2026-10-04 à 22:45, à la demande de Jiiji : « un système de
-- génération de newsletter, une par semaine, qui s'envoie automatiquement :
-- une petite synthèse des posts de la semaine, qui invite à visiter le site »,
-- « pour envoyer aux structures partenaires sans qu'elles aient de compte ».
--
-- À coller dans Supabase → SQL Editor → Run, APRÈS supabase_fil_actu.sql
-- (qui crée la table actus et bf_est_banquier). ADDITIF et rejouable :
-- trois tables neuves, une colonne ajoutée à actus, rien n'est supprimé.
--
--   • lettre_abonnes : qui reçoit la lettre. Deux sources :
--       - « partenaire » : une structure ajoutée par le banquier, sans compte ;
--       - « membre »     : un compte du site qui s'est inscrit lui-même
--                          (à la création du compte ou dans Mon compte).
--     Les adresses ne sont PAS dans profiles, qui est lisible par tous.
--     Ici, chacun ne lit que sa propre ligne ; le banquier lit tout.
--   • lettre_reglages : l'envoi automatique (oui / non) et le mot du banquier
--     à glisser dans la prochaine lettre.
--   • lettres : l'historique des envois.
--   • actus.en_lettre_at : la date de la lettre qui a déjà raconté cette actu.
--     Une actu publiée et pas encore racontée part dans la lettre suivante :
--     une semaine sautée ne fait rien perdre.
--
-- L'envoi lui-même est fait par la fonction serveur « lettre »
-- (supabase/functions/lettre), par Gmail. Voir LETTRE-MODE-D-EMPLOI.md.
-- ══════════════════════════════════════════════════════════════════

-- 1. Les abonnés
create table if not exists lettre_abonnes (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  email         text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  nom           text,                                   -- nom de la structure (partenaires)
  source        text not null default 'partenaire' check (source in ('partenaire', 'membre')),
  user_id       uuid unique references auth.users(id) on delete cascade,
  actif         boolean not null default true,
  jeton         uuid not null default gen_random_uuid(), -- lien de désinscription, propre à chacun
  desinscrit_at timestamptz
);
create unique index if not exists lettre_abonnes_email_idx on lettre_abonnes (lower(email));
create unique index if not exists lettre_abonnes_jeton_idx on lettre_abonnes (jeton);

alter table lettre_abonnes enable row level security;
drop policy if exists lettre_abonnes_lecture on lettre_abonnes;
create policy lettre_abonnes_lecture on lettre_abonnes for select to authenticated
  using (user_id = auth.uid() or bf_est_banquier());
drop policy if exists lettre_abonnes_ajout on lettre_abonnes;
create policy lettre_abonnes_ajout on lettre_abonnes for insert to authenticated
  with check ((user_id = auth.uid() and source = 'membre') or bf_est_banquier());
drop policy if exists lettre_abonnes_modif on lettre_abonnes;
create policy lettre_abonnes_modif on lettre_abonnes for update to authenticated
  using (user_id = auth.uid() or bf_est_banquier())
  with check (user_id = auth.uid() or bf_est_banquier());
drop policy if exists lettre_abonnes_suppr on lettre_abonnes;
create policy lettre_abonnes_suppr on lettre_abonnes for delete to authenticated
  using (user_id = auth.uid() or bf_est_banquier());

revoke all on lettre_abonnes from anon;
grant select, insert, update, delete on lettre_abonnes to authenticated;

-- Se désinscrire depuis le lien de la lettre, sans compte ni connexion :
-- le jeton suffit, et il ne révèle rien (la fonction ne renvoie pas l'adresse).
create or replace function lettre_desinscrire(p_jeton uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update lettre_abonnes set actif = false, desinscrit_at = now()
   where jeton = p_jeton and actif;
  get diagnostics n = row_count;
  return n > 0 or exists (select 1 from lettre_abonnes where jeton = p_jeton);
end $$;
revoke all on function lettre_desinscrire(uuid) from public;
grant execute on function lettre_desinscrire(uuid) to anon, authenticated;

-- 2. Les réglages (une seule ligne)
create table if not exists lettre_reglages (
  id          int primary key default 1 check (id = 1),
  envoi_auto  boolean not null default false, -- la lettre part seule le lundi matin
  mot         text,                           -- le mot du banquier pour la prochaine lettre
  updated_at  timestamptz not null default now()
);
-- L'envoi automatique démarre COUPÉ : Jiiji le coche dans l'admin après avoir reçu
-- et validé une lettre de test (mis en place un dimanche soir, veille d'un lundi).
insert into lettre_reglages (id) values (1) on conflict (id) do nothing;

alter table lettre_reglages enable row level security;
drop policy if exists lettre_reglages_lecture on lettre_reglages;
create policy lettre_reglages_lecture on lettre_reglages for select to authenticated using (bf_est_banquier());
drop policy if exists lettre_reglages_modif on lettre_reglages;
create policy lettre_reglages_modif on lettre_reglages for update to authenticated
  using (bf_est_banquier()) with check (bf_est_banquier());
revoke all on lettre_reglages from anon;
grant select, update on lettre_reglages to authenticated;

-- 3. L'historique des envois (écrit par la fonction serveur, lu par le banquier)
create table if not exists lettres (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  mode             text not null check (mode in ('auto', 'manuel', 'test')),
  objet            text,
  nb_actus         int not null default 0,
  nb_destinataires int not null default 0,
  nb_echecs        int not null default 0,
  erreurs          text
);
alter table lettres enable row level security;
drop policy if exists lettres_lecture on lettres;
create policy lettres_lecture on lettres for select to authenticated using (bf_est_banquier());
revoke all on lettres from anon;
grant select on lettres to authenticated;

-- 4. Les actus déjà racontées dans une lettre
alter table actus add column if not exists en_lettre_at timestamptz;

-- 5. L'envoi automatique du lundi
--    Chaque lundi à 8 h (heure UTC, donc 10 h à Paris l'été, 9 h l'hiver), la
--    base appelle la fonction. La lettre ne part que si l'envoi automatique
--    est coché dans l'admin ET s'il y a quelque chose à raconter (une actu
--    publiée pas encore racontée, ou un mot du banquier).
--
--    L'appel porte un code tiré au hasard ici et rangé dans le coffre (vault) :
--    il n'est écrit nulle part ailleurs, et la fonction le vérifie auprès de la
--    base (lettre_verifier_secret). Personne d'autre ne peut déclencher l'envoi.
create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  if not exists (select 1 from vault.secrets where name = 'bf_lettre_secret') then
    perform vault.create_secret(gen_random_uuid()::text || gen_random_uuid()::text, 'bf_lettre_secret');
  end if;
end $$;

create or replace function lettre_verifier_secret(p_secret text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from vault.decrypted_secrets where name = 'bf_lettre_secret' and decrypted_secret = p_secret)
$$;
revoke all on function lettre_verifier_secret(text) from public, anon, authenticated;
grant execute on function lettre_verifier_secret(text) to service_role;

select cron.schedule('bf-lettre-hebdo', '0 8 * * 1', $cron$
  select net.http_post(
    url     := 'https://eopygceibkbtkqmrgnxt.supabase.co/functions/v1/lettre',
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'x-bf-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'bf_lettre_secret')),
    body    := '{"action":"hebdo"}'::jsonb,
    timeout_milliseconds := 120000)
$cron$);

-- Vérifications (facultatives)
--   select jobname, schedule, active from cron.job where jobname = 'bf-lettre-hebdo';
--   select source, actif, count(*) from lettre_abonnes group by 1, 2;
--   select count(*) from actus where publie and en_lettre_at is null;  -- en attente de la prochaine lettre
--   select * from net._http_response order by created desc limit 5;    -- réponses des derniers appels
-- Pour arrêter l'envoi du lundi pour de bon : select cron.unschedule('bf-lettre-hebdo');

-- 6. Les identifiants Gmail dans le coffre (ajouté le 2026-10-05 vers 00:15)
--    La fonction lit d'abord ses propres secrets (GMAIL_USER, GMAIL_APP_PASSWORD,
--    GMAIL_FROM) ; s'ils ne sont pas posés, elle lit ces trois entrées du coffre.
--    Les valeurs ne sont écrites dans aucun fichier : elles ont été rangées avec
--      select vault.create_secret('<valeur>', 'gmail_user');          -- et gmail_app_password, gmail_from
--    et se changent avec
--      select vault.update_secret((select id from vault.secrets where name = 'gmail_app_password'), '<nouveau>');
create or replace function lettre_identifiants_gmail()
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'user', (select decrypted_secret from vault.decrypted_secrets where name = 'gmail_user'),
    'pass', (select decrypted_secret from vault.decrypted_secrets where name = 'gmail_app_password'),
    'from', (select decrypted_secret from vault.decrypted_secrets where name = 'gmail_from'))
$$;
revoke all on function lettre_identifiants_gmail() from public, anon, authenticated;
grant execute on function lettre_identifiants_gmail() to service_role;
-- (pour une pause, il suffit de décocher la case dans l'admin)
