-- ══════════════════════════════════════════════════════════════════
-- BANQUE FANTÔME : relance automatique des ventes sans enchère
-- Écrit le 2026-10-04, à la demande de Jiiji : « peu importe la durée de
-- l'enchère, si personne n'a enchéri, l'enchère se relance à 0 ».
--
-- À coller dans Supabase → SQL Editor → Run, APRÈS supabase_hotel_des_ventes.sql
-- (déjà passé). Rejouable sans risque : rien n'est supprimé.
--
-- Ce qui change :
--   • une vente qui arrive à son terme SANS enchère ne passe plus en « expiré » :
--     son chrono repart pour la même durée (1, 3 ou 7 jours), même mise de départ ;
--   • le nouveau tour part de la fin du tour précédent (et non de la visite
--     suivante), pour que le site et la base affichent toujours la même échéance ;
--   • les ventes déjà « expiré » aujourd'hui sont remises en vente une fois,
--     avec un chrono neuf ;
--   • une vente avec au moins une enchère se clôture comme avant (adjugée).
-- ══════════════════════════════════════════════════════════════════

-- 1. Clôture des ventes échues : adjuger s'il y a un enchérisseur, sinon relancer
create or replace function resoudre_ventes_expirees()
returns int language plpgsql security definer as $$
declare o record; n int := 0; periode interval;
begin
  perform set_config('bf.interne', '1', true);
  for o in select id, encherisseur_id, enchere_courante, expire_at, duree_jours from objets
           where mise_depart is not null and statut = 'disponible' and expire_at <= now()
           for update skip locked
  loop
    if o.encherisseur_id is not null then
      perform bf_finaliser_vente(o.id, o.encherisseur_id, o.enchere_courante, 'enchère');
    else
      -- Personne n'a enchéri : on saute autant de tours complets que nécessaire
      periode := make_interval(days => coalesce(o.duree_jours, 3));
      update objets
         set expire_at = o.expire_at + periode * (floor(extract(epoch from now() - o.expire_at) / extract(epoch from periode))::int + 1)
       where id = o.id;
    end if;
    n := n + 1;
  end loop;
  return n;
end $$;

-- 2. Une seule fois : les ventes déjà expirées sans enchère reviennent au market
do $$
begin
  perform set_config('bf.interne', '1', true);
  update objets
     set statut = 'disponible',
         expire_at = now() + make_interval(days => coalesce(duree_jours, 3)),
         enchere_courante = null, encherisseur_id = null, encherisseur_pseudo = null, nb_encheres = 0
   where mise_depart is not null and statut = 'expiré' and prix_final is null;
end $$;

-- 3. Les chiffres de l'accueil comptent aussi une vente sans enchère dont le tour
--    vient de finir (elle est relancée, pas terminée)
create or replace function stats_banque()
returns json language sql stable security definer as $$
  select json_build_object(
    'tresor',            (select tresor from banque where id = 1),
    'commission_pct',    (select commission_pct from banque where id = 1),
    'en_circulation',    (select coalesce(sum(solde), 0) from profiles),
    'billets_emis',      (select count(*) from billets_emis where statut = 'valide'),
    'ventes_en_cours',   (select count(*) from objets where mise_depart is not null and statut = 'disponible'
                                                          and (expire_at > now() or encherisseur_id is null)),
    'ventes_conclues',   (select count(*) from objets where mise_depart is not null and statut = 'échangé'),
    'volume_echange',    (select coalesce(sum(prix_final), 0) from objets where prix_final is not null)
  )
$$;

-- Vérification (facultative) : plus aucune vente « expiré » ne doit rester
--   select count(*) from objets where mise_depart is not null and statut = 'expiré';
