-- ══════════════════════════════════════════════════════════════════
-- BANQUE FANTÔME : le bon coin (les joueurs revendent leurs objets réels)
-- Écrit le 2026-10-19 au soir, à la demande de Jiiji (« faut faire plein de différents
-- market, le E market, le bon coin, ce que vend la banque »). À jouer APRÈS
-- supabase_market_numerique.sql. ADDITIF et rejouable.
--
-- La page Market a trois rayons :
--   • l'E-market (objets.oeuvre_id) : les œuvres des ateliers, en argent du site ;
--   • le bon coin (objets physiques, vendeur_banque = false) : les joueurs remettent en
--     vente leurs objets réels ; on y promet des billets papier, vendeur et acheteur
--     s'arrangent entre eux pour la remise ;
--   • la banque vend (objets physiques, vendeur_banque = true) : le supermarket ; on y paie
--     en billets papier ou, au choix du gagnant, avec l'argent de son compte.
-- Ce fichier rouvre le dépôt physique aux joueurs, que supabase_market_numerique.sql
-- réservait à la banque.
-- ══════════════════════════════════════════════════════════════════

-- La banque vend aussi contre l'argent du site : le gagnant d'un objet de la banque peut
-- régler avec son compte au lieu des billets papier (payer_avec_compte, plus bas).
alter table objets add column if not exists regle_compte_at timestamptz;

-- ─────────────────────────── 1. Déposer une annonce ───────────────────────────
-- Reprise de bf_garde_objets (supabase_market_numerique.sql) : un joueur dépose au bon
-- coin (dix annonces par jour), la banque à son rayon. Le reste est inchangé.
create or replace function bf_garde_objets() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if not bf_est_interne() then
      if new.mise_depart is null then raise exception 'Une vente demande une mise de départ.'; end if;
      new.dessin_id := null; new.oeuvre_id := null;
      new.vendeur_banque := bf_est_banquier();
      if not new.vendeur_banque and (select count(*) from objets
            where user_id = new.user_id and dessin_id is null and oeuvre_id is null
              and created_at > now() - interval '1 day') >= 10 then
        raise exception 'Dix annonces en un jour : le bon coin vous attend demain.';
      end if;
    end if;
    if new.mise_depart is not null then
      if new.mise_depart < 1 then raise exception 'Mise de départ invalide.'; end if;
      if new.prix_achat is not null and new.prix_achat < new.mise_depart then raise exception 'Le prix d''achat immédiat doit être ≥ à la mise de départ.'; end if;
      if new.duree_jours is null or new.duree_jours not in (1, 3, 7) then raise exception 'Durée invalide (1, 3 ou 7 jours).'; end if;
      new.expire_at := now() + make_interval(days => new.duree_jours);
      new.statut := 'disponible';
      new.enchere_courante := null; new.encherisseur_id := null; new.encherisseur_pseudo := null; new.nb_encheres := 0;
      new.vendu_a := null; new.vendu_a_pseudo := null; new.prix_final := null; new.vendu_at := null;
      if new.valeur is null then new.valeur := new.mise_depart; end if;
    end if;
    return new;
  end if;
  if not bf_est_interne() then
    if old.dessin_id is not null then raise exception 'Une vente de la bourse ne se modifie pas : retirez-la puis remettez le billet en vente.'; end if;
    if old.oeuvre_id is not null then raise exception 'Une vente du market ne se modifie pas : retirez-la puis remettez l''œuvre en vente.'; end if;
    if new.dessin_id is distinct from old.dessin_id or new.oeuvre_id is distinct from old.oeuvre_id
       or new.vendeur_banque is distinct from old.vendeur_banque or new.regle_compte_at is distinct from old.regle_compte_at then
      raise exception 'Les données de vente ne se modifient pas directement.';
    end if;
    if new.mise_depart is distinct from old.mise_depart or new.prix_achat is distinct from old.prix_achat
       or new.duree_jours is distinct from old.duree_jours or new.expire_at is distinct from old.expire_at
       or new.enchere_courante is distinct from old.enchere_courante or new.encherisseur_id is distinct from old.encherisseur_id
       or new.encherisseur_pseudo is distinct from old.encherisseur_pseudo or new.nb_encheres is distinct from old.nb_encheres
       or new.vendu_a is distinct from old.vendu_a or new.vendu_a_pseudo is distinct from old.vendu_a_pseudo
       or new.prix_final is distinct from old.prix_final or new.vendu_at is distinct from old.vendu_at then
      raise exception 'Les données d''enchère ne se modifient pas directement.';
    end if;
    if old.mise_depart is not null and new.statut is distinct from old.statut then
      raise exception 'Une vente se retire avec retirer_vente(), son statut ne se modifie pas à la main.';
    end if;
    if old.statut = 'disponible' and old.nb_encheres > 0
       and (new.titre is distinct from old.titre or new.description is distinct from old.description
            or new.image_path is distinct from old.image_path or new.image_paths is distinct from old.image_paths
            or new.pseudo is distinct from old.pseudo) then
      raise exception 'Cette vente a déjà des enchères : sa fiche ne se modifie plus.';
    end if;
  end if;
  return new;
end $$;

drop policy if exists "objets_insert" on objets;
create policy "objets_insert" on objets for insert
  with check (auth.uid() is not null and user_id = auth.uid());

-- ─────────────────────────── 2. Relancer ───────────────────────────
-- Une annonce du bon coin sans enchère repart pour un tour, comme toutes les ventes
-- (la branche « un objet physique d'un joueur expire » de supabase_market_numerique.sql tombe).
create or replace function resoudre_ventes_expirees()
returns int language plpgsql security definer set search_path = public as $$
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
      periode := make_interval(days => coalesce(o.duree_jours, 3));
      update objets
         set expire_at = o.expire_at + periode * (floor(extract(epoch from now() - o.expire_at) / extract(epoch from periode))::int + 1)
       where id = o.id;
    end if;
    n := n + 1;
  end loop;
  return n;
end $$;

-- Remettre en vente : un objet réel, par son vendeur (joueur ou banque). Billets et
-- œuvres repassent par leur collection.
create or replace function remettre_en_vente(p_objet uuid, p_mise int, p_prix_achat int, p_duree int)
returns json language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); o objets%rowtype;
begin
  if u is null then raise exception 'Connectez-vous.'; end if;
  select * into o from objets where id = p_objet for update;
  if not found or o.user_id <> u then raise exception 'Ce dépôt n''est pas le vôtre.'; end if;
  if o.dessin_id is not null then raise exception 'Un billet se remet en vente depuis votre collection.'; end if;
  if o.oeuvre_id is not null then raise exception 'Une œuvre se remet en vente depuis votre collection.'; end if;
  if o.statut not in ('expiré', 'retiré') then raise exception 'Seule une vente expirée ou retirée se remet en vente.'; end if;
  if p_mise < 1 then raise exception 'Mise de départ invalide.'; end if;
  if p_prix_achat is not null and p_prix_achat < p_mise then raise exception 'Prix d''achat immédiat ≥ mise de départ.'; end if;
  if p_duree not in (1, 3, 7) then raise exception 'Durée invalide.'; end if;
  perform set_config('bf.interne', '1', true);
  update objets set statut = 'disponible', mise_depart = p_mise, prix_achat = p_prix_achat, duree_jours = p_duree,
                    expire_at = now() + make_interval(days => p_duree), enchere_courante = null, encherisseur_id = null,
                    encherisseur_pseudo = null, nb_encheres = 0, valeur = p_mise
  where id = p_objet;
  return json_build_object('ok', true);
end $$;
revoke execute on function remettre_en_vente(uuid, int, int, int) from public, anon;
grant execute on function remettre_en_vente(uuid, int, int, int) to authenticated;

-- ─────────────────────────── 3. Chiffres publics ───────────────────────────
create or replace function stats_banque()
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'tresor',            (select tresor from banque where id = 1),
    'commission_pct',    (select commission_pct from banque where id = 1),
    'en_circulation',    (select coalesce(sum(solde), 0) from profiles),
    'billets_emis',      (select count(*) from billets_emis where statut = 'valide'),
    'montant_emis',      (select coalesce(sum(valeur), 0) from billets_emis where statut = 'valide'),
    'ventes_en_cours',   (select count(*) from objets where mise_depart is not null and statut = 'disponible'
                                                          and (expire_at > now() or encherisseur_id is null)),
    'ventes_conclues',   (select count(*) from objets where mise_depart is not null and statut = 'échangé'),
    'volume_echange',    (select coalesce(sum(prix_final), 0) from objets where prix_final is not null),
    'billets_dessines',  (select count(*) from dessins where statut <> 'annule'),
    'billets_en_bourse', (select count(*) from objets where dessin_id is not null and statut = 'disponible'),
    'oeuvres',           (select count(*) from oeuvres where statut <> 'annule'),
    'oeuvres_en_vente',  (select count(*) from objets where oeuvre_id is not null and statut = 'disponible'),
    'articles_supermarket', (select count(*) from objets where not numerique and vendeur_banque and statut = 'disponible'),
    'annonces_bon_coin', (select count(*) from objets where not numerique and not coalesce(vendeur_banque, false) and statut = 'disponible'),
    'plafond_encaissement_jour', (select plafond_encaissement_jour from banque where id = 1)
  )
$$;
grant execute on function stats_banque() to anon, authenticated;

-- ─────────────────────────── 4. Payer la banque avec son compte ───────────────────────────
-- « pour les achats à la banque il y a possibilité d'acheter aussi en billet numérique »
-- (Jiiji, 2026-10-19) : le gagnant d'un objet de la banque règle avec son solde, qui va au
-- trésor. Au bon coin, on règle avec le vendeur, en billets papier.
create or replace function payer_avec_compte(p_objet uuid)
returns json language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); o objets%rowtype; s int;
begin
  if u is null then raise exception 'Connectez-vous.'; end if;
  select * into o from objets where id = p_objet for update;
  if not found then raise exception 'Vente introuvable.'; end if;
  if o.numerique then raise exception 'Cette vente se paie déjà en argent du site.'; end if;
  if not coalesce(o.vendeur_banque, false) then raise exception 'Au bon coin, on règle avec le vendeur, en billets papier.'; end if;
  if o.statut <> 'échangé' or o.vendu_a is distinct from u then raise exception 'Seul le gagnant règle cette vente.'; end if;
  if o.regle_compte_at is not null then raise exception 'Cette vente est déjà réglée.'; end if;
  select solde into s from profiles where id = u for update;
  if s < o.prix_final then raise exception 'Solde insuffisant (% billets disponibles).', s; end if;
  perform set_config('bf.interne', '1', true);
  perform bf_mouvement(u, -o.prix_final, 'achat', p_objet, null, format('Réglé avec le compte : « %s »', o.titre));
  perform bf_mouvement(null, o.prix_final, 'vente', p_objet, null, format('Vente de la banque « %s » (réglée avec le compte)', o.titre));
  update objets set regle_compte_at = now() where id = p_objet;
  return json_build_object('ok', true, 'solde', s - o.prix_final);
end $$;
revoke all on function payer_avec_compte(uuid) from public, anon;
grant execute on function payer_avec_compte(uuid) to authenticated;

-- Défaire une adjudication (reprise de supabase_garde_fous.sql) : jamais une vente en argent
-- du site (bourse, E-market : l'acheteur a payé, l'œuvre a changé de main) ; une vente de la
-- banque réglée avec le compte est remboursée.
create or replace function annuler_adjudication_papier(p_objet uuid)
returns json language plpgsql security definer set search_path = public as $$
declare o objets%rowtype;
begin
  if auth.uid() is null then raise exception 'Connectez-vous.'; end if;
  select * into o from objets where id = p_objet for update;
  if not found then raise exception 'Vente introuvable.'; end if;
  if o.numerique then raise exception 'Une vente en argent du site ne se défait pas : elle est payée.'; end if;
  if o.user_id is distinct from auth.uid() and not bf_est_banquier() then raise exception 'Réservé au vendeur ou au banquier.'; end if;
  if o.statut <> 'échangé' then raise exception 'Cette vente n''est pas adjugée.'; end if;
  perform set_config('bf.interne', '1', true);
  if o.regle_compte_at is not null and o.vendu_a is not null then
    perform bf_mouvement(o.vendu_a, o.prix_final, 'remboursement', p_objet, null, format('Vente défaite : « %s »', o.titre));
    perform bf_mouvement(null, -o.prix_final, 'remboursement', p_objet, null, format('Vente défaite : « %s »', o.titre));
  end if;
  update encheres set statut = 'rendue' where objet_id = p_objet and statut in ('active', 'gagnante');
  update objets set statut = 'retiré', vendu_a = null, vendu_a_pseudo = null, prix_final = null, vendu_at = null,
                    enchere_courante = null, encherisseur_id = null, encherisseur_pseudo = null, nb_encheres = 0,
                    regle_compte_at = null
   where id = p_objet;
  return json_build_object('ok', true);
end $$;
revoke all on function annuler_adjudication_papier(uuid) from public, anon;
grant execute on function annuler_adjudication_papier(uuid) to authenticated;
