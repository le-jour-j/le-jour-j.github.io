-- Présence du banquier par agence (2026-10-13, demande de Jiiji : « le site doit pouvoir dire
-- où je suis »). La fonction Edge `presences` lit toutes les 15 minutes l'agenda Google
-- « CLEA Jeanson 2026 » par son adresse iCal secrète (rangée dans le coffre, jamais dans le
-- code), ne garde que les créneaux dont le titre dit où il est, et les recopie ici :
--   titre contenant « quadri »          → agence 'quadrilatere'  (« quadri », « prépa quadri »…)
--   titre contenant « mediatheque bvs » → agence 'mediatheque'
-- Seuls le lieu et les heures sont publics : les titres et le reste de l'agenda ne quittent
-- jamais la fonction.

-- 1. La table, lisible par tout le monde, écrite seulement par la fonction (service_role)
create table if not exists presences (
  uid    text primary key,            -- identifiant de l'événement + début (une occurrence)
  agence text not null check (agence in ('quadrilatere', 'mediatheque')),
  debut  timestamptz not null,
  fin    timestamptz not null,
  maj_at timestamptz not null default now()
);
create index if not exists presences_debut on presences (debut);
alter table presences enable row level security;
drop policy if exists "presences lisibles" on presences;
create policy "presences lisibles" on presences for select using (true);

-- 2. L'adresse iCal secrète : dans le coffre, lue seulement par la fonction
--    À faire une fois (remplacer par l'adresse copiée dans Google Agenda) :
--    select vault.create_secret('https://calendar.google.com/calendar/ical/.../basic.ics', 'presences_ical');
create or replace function presences_ical_url() returns text
language sql security definer set search_path = '' as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'presences_ical' limit 1
$$;
revoke all on function presences_ical_url() from public, anon, authenticated;
grant execute on function presences_ical_url() to service_role;

-- 3. Toutes les 15 minutes, la base réveille la fonction (même code que la lettre)
select cron.schedule('bf-presences', '*/15 * * * *', $cron$
  select net.http_post(
    url     := 'https://eopygceibkbtkqmrgnxt.supabase.co/functions/v1/presences',
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'x-bf-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'bf_lettre_secret')),
    body    := '{}'::jsonb,
    timeout_milliseconds := 30000)
$cron$);
