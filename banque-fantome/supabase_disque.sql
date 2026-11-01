-- ============================================================
-- supabase_disque.sql (2026-11-01)
-- Ménager le budget disque de la base gratuite, après trois alertes Supabase
-- « running out of Disk IO Budget » (4/10, 22/10, 29/10).
--
-- Relevé du 01/11 (pg_stat_statements, pg_stat_wal, pg_stat_io, depuis le 06/10) :
--   * la boucle de Supabase Realtime (realtime.list_changes) : 2,8 millions d'appels,
--     4 h 30 de travail de la base, 11,5 millions de petites écritures du journal :
--     de loin le premier poste. Elle tourne tant qu'un onglet garde un abonnement
--     ouvert ; c'est réglé côté site (src/lib/veille.js), pas ici ;
--   * le planificateur (pg_cron) : 3 600 passages, chacun écrit 5 fois dans
--     cron.job_run_details, qui grossissait sans fin (1,3 Mo, depuis le 05/10) ;
--   * l'agenda du banquier, effacé puis réécrit toutes les 15 minutes : réglé dans
--     supabase/functions/presences/index.ts (on n'écrit plus que ce qui change).
--
-- Rejouable. Ne redéfinit aucune fonction d'argent. À jouer après les autres fichiers.
-- ============================================================

-- 1. Realtime ne diffuse plus que les tables qu'une page écoute vraiment. dessins et
--    oeuvres y étaient sans aucun abonné (vérifié dans banque-fantome/src et dans
--    chambre-compensation) : chaque écriture y était décodée pour rien.
do $$ begin
  if exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'dessins') then
    alter publication supabase_realtime drop table public.dessins;
  end if;
  if exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'oeuvres') then
    alter publication supabase_realtime drop table public.oeuvres;
  end if;
end $$;

-- 2. La clôture des ventes échues passe toutes les heures au lieu de toutes les 10 minutes.
--    Chaque page du market la lance déjà à l'ouverture : un visiteur voit toujours une vente
--    échue adjugée. Seule une vente finie pendant que personne ne regarde attend l'heure pile.
--    (supabase_garde_fous.sql est aligné : le rejouer ne remet plus les 10 minutes.)
do $$ begin
  perform cron.schedule('bf-resoudre-ventes', '0 * * * *', 'select resoudre_ventes_expirees()');
exception when undefined_function or invalid_schema_name then null; end $$;

-- 3. Le carnet du planificateur ne garde que 3 jours, purgé chaque nuit à 4 h 10 (UTC).
delete from cron.job_run_details where end_time < now() - interval '3 days';
do $$ begin
  perform cron.schedule('bf-menage-cron', '10 4 * * *',
    $cron$delete from cron.job_run_details where end_time < now() - interval '3 days'$cron$);
exception when undefined_function or invalid_schema_name then null; end $$;

-- Vérification
select jobname, schedule, active from cron.job order by jobid;
select tablename from pg_publication_tables where pubname = 'supabase_realtime' order by 1;
