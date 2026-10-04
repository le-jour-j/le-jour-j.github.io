-- ══════════════════════════════════════════════════════════════════
-- BANQUE FANTÔME : espace admin du banquier
-- Écrit le 2026-10-04, à la demande de Jiiji (« il me faut une interface admin »).
-- À coller dans Supabase → SQL Editor → Run, APRÈS supabase_fil_actu.sql
-- (qui crée bf_est_banquier). ADDITIF et rejouable.
--
-- Le reste de l'admin s'appuie sur ce qui existe déjà : comptes, billets,
-- ventes et banque sont lisibles, le banquier lit toutes les transactions,
-- et annuler_billet() est déjà réservé au banquier.
-- ══════════════════════════════════════════════════════════════════

-- Retirer du market un dépôt problématique, quel que soit son propriétaire.
-- S'il y a un meilleur enchérisseur, ses billets bloqués lui sont rendus.
create or replace function admin_retirer_objet(p_objet uuid)
returns json language plpgsql security definer set search_path = public as $$
declare o objets%rowtype;
begin
  if not bf_est_banquier() then raise exception 'Réservé au banquier.'; end if;
  select * into o from objets where id = p_objet for update;
  if not found then raise exception 'Objet introuvable.'; end if;
  if o.statut not in ('disponible', 'réservé') then raise exception 'Ce dépôt n''est plus en vente.'; end if;
  perform set_config('bf.interne', '1', true);
  if o.encherisseur_id is not null then
    perform bf_mouvement(o.encherisseur_id, o.enchere_courante, 'remboursement', p_objet, null,
                         format('Vente retirée par la banque : « %s »', o.titre));
    update encheres set statut = 'rendue' where objet_id = p_objet and statut = 'active';
  end if;
  update objets set statut = 'retiré' where id = p_objet;
  return json_build_object('ok', true, 'rembourse', coalesce(o.enchere_courante, 0));
end $$;
revoke all on function admin_retirer_objet(uuid) from public, anon;
grant execute on function admin_retirer_objet(uuid) to authenticated;

-- Le total des montants déposés au guichet (montant_emis), à côté du nombre de billets
-- (billets_emis) : affiché sur l'accueil, dans Mon compte et dans l'admin (2026-10-04).
create or replace function stats_banque()
returns json language sql stable security definer as $$
  select json_build_object(
    'tresor',            (select tresor from banque where id = 1),
    'commission_pct',    (select commission_pct from banque where id = 1),
    'en_circulation',    (select coalesce(sum(solde), 0) from profiles),
    'billets_emis',      (select count(*) from billets_emis where statut = 'valide'),
    'montant_emis',      (select coalesce(sum(valeur), 0) from billets_emis where statut = 'valide'),
    'ventes_en_cours',   (select count(*) from objets where mise_depart is not null and statut = 'disponible'
                                                          and (expire_at > now() or encherisseur_id is null)),
    'ventes_conclues',   (select count(*) from objets where mise_depart is not null and statut = 'échangé'),
    'volume_echange',    (select coalesce(sum(prix_final), 0) from objets where prix_final is not null)
  )
$$;
