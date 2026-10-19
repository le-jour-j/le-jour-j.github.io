-- ══════════════════════════════════════════════════════════════════
-- BANQUE FANTÔME : le market en billets papier
-- Écrit le 2026-10-19, à la demande de Jiiji. À coller dans Supabase →
-- SQL Editor → Run, APRÈS supabase_bourse.sql. ADDITIF et rejouable.
--
-- Deux circuits :
--   • la bourse (objets avec dessin_id) : des billets dessinés sur le site,
--     payés avec l'argent du site. Rien ne change ;
--   • le market (objets sans dessin_id) : des objets physiques, déposés par
--     tout le monde. On y enchérit en PROMESSES de billets papier (planches
--     imprimées, billets dessinés en atelier) : rien n'est débité, le site
--     note les promesses, et le gagnant paie le vendeur en main propre.
--
-- Vérifié le 2026-10-19 avant d'écrire ce fichier : aucune enchère n'avait
-- jamais été posée sur le market, aucun argent du site n'y avait bougé.
-- Rien à rembourser au passage.
-- ══════════════════════════════════════════════════════════════════

-- ─────────────────────────── 1. Tout le monde dépose au market ───────────────────────────
-- Reprise de bf_garde_objets (supabase_bourse.sql) : un joueur peut de nouveau insérer,
-- vendeur_banque dit seulement si c'est la banque qui vend (affichage, contact).
create or replace function bf_garde_objets() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if not bf_est_interne() then
      if new.mise_depart is null then raise exception 'Une vente demande une mise de départ.'; end if;
      new.dessin_id := null;
      new.vendeur_banque := bf_est_banquier();
    end if;
    -- Un dépôt avec mise de départ = une vente : on valide et on calcule l'expiration.
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
  -- UPDATE par un client : les colonnes d'enchère sont verrouillées
  if not bf_est_interne() then
    if old.dessin_id is not null then raise exception 'Une vente de la bourse ne se modifie pas : retirez-la puis remettez le billet en vente.'; end if;
    if new.dessin_id is distinct from old.dessin_id or new.vendeur_banque is distinct from old.vendeur_banque then
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
  end if;
  return new;
end $$;

drop policy if exists "objets_insert" on objets;
create policy "objets_insert" on objets for insert
  with check (auth.uid() is not null and user_id = auth.uid());

-- ─────────────────────────── 2. Enchérir : promesse au market, argent à la bourse ───────────────────────────
create or replace function placer_enchere(p_objet uuid, p_montant int)
returns json language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); o objets%rowtype; inc int; requis int; s int; precedent uuid; precedent_montant int;
begin
  if u is null then raise exception 'Connectez-vous pour enchérir.'; end if;
  perform resoudre_ventes_expirees();
  select * into o from objets where id = p_objet for update;
  if not found then raise exception 'Objet introuvable.'; end if;
  if o.mise_depart is null then raise exception 'Cet objet n''est pas en vente aux enchères.'; end if;
  if o.statut <> 'disponible' or o.expire_at <= now() then raise exception 'Cette vente est terminée.'; end if;
  if o.user_id = u then raise exception 'On n''enchérit pas sur son propre dépôt.'; end if;
  select increment_min into inc from banque where id = 1;
  requis := case when o.enchere_courante is null then o.mise_depart else o.enchere_courante + inc end;
  if p_montant < requis then raise exception 'Enchère minimale : % billets.', requis; end if;
  if o.prix_achat is not null and p_montant >= o.prix_achat then
    return acheter_immediat(p_objet);
  end if;
  precedent := o.encherisseur_id; precedent_montant := o.enchere_courante;
  perform set_config('bf.interne', '1', true);
  if o.dessin_id is not null then
    -- la bourse : les billets du site sont bloqués, le précédent meneur est remboursé
    select solde into s from profiles where id = u for update;
    if precedent = u then s := s + precedent_montant; end if;
    if s < p_montant then raise exception 'Solde insuffisant (% billets disponibles).', s; end if;
    if precedent is not null then
      perform bf_mouvement(precedent, precedent_montant, 'remboursement', p_objet, null, format('Surenchéri sur « %s »', o.titre));
    end if;
    perform bf_mouvement(u, -p_montant, 'enchere', p_objet, null, format('Enchère sur « %s »', o.titre));
  end if;
  -- au market : une promesse de billets papier, rien ne bouge sur les comptes
  if precedent is not null then
    update encheres set statut = 'surencherie' where objet_id = p_objet and user_id = precedent and statut = 'active';
  end if;
  insert into encheres (objet_id, user_id, pseudo, montant) values (p_objet, u, bf_pseudo(u), p_montant);
  update objets set enchere_courante = p_montant, encherisseur_id = u, encherisseur_pseudo = bf_pseudo(u),
                    nb_encheres = nb_encheres + 1,
                    -- anti-sniping : une enchère dans les 10 dernières minutes prolonge de 10 minutes
                    expire_at = greatest(expire_at, now() + interval '10 minutes')
  where id = p_objet;
  select solde into s from profiles where id = u;
  return json_build_object('ok', true, 'mode', 'enchere', 'montant', p_montant, 'solde', s, 'papier', o.dessin_id is null);
end $$;

create or replace function acheter_immediat(p_objet uuid)
returns json language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); o objets%rowtype; s int; credit int := 0;
begin
  if u is null then raise exception 'Connectez-vous pour acheter.'; end if;
  perform resoudre_ventes_expirees();
  select * into o from objets where id = p_objet for update;
  if not found then raise exception 'Objet introuvable.'; end if;
  if o.mise_depart is null or o.prix_achat is null then raise exception 'Pas d''achat immédiat sur cet objet.'; end if;
  if o.statut <> 'disponible' or o.expire_at <= now() then raise exception 'Cette vente est terminée.'; end if;
  if o.user_id = u then raise exception 'On n''achète pas son propre dépôt.'; end if;
  perform set_config('bf.interne', '1', true);
  if o.dessin_id is not null then
    select solde into s from profiles where id = u for update;
    if o.encherisseur_id = u then credit := o.enchere_courante; end if;   -- ma mise en cours est déjà bloquée
    if s + credit < o.prix_achat then raise exception 'Solde insuffisant (% billets disponibles).', s + credit; end if;
    if o.encherisseur_id is not null then
      perform bf_mouvement(o.encherisseur_id, o.enchere_courante, 'remboursement', p_objet, null, format('Vente conclue par achat immédiat : « %s »', o.titre));
    end if;
    perform bf_mouvement(u, -o.prix_achat, 'achat', p_objet, null, format('Achat immédiat « %s »', o.titre));
  end if;
  if o.encherisseur_id is not null then
    update encheres set statut = case when user_id = u then 'rendue' else 'surencherie' end
      where objet_id = p_objet and statut = 'active';
  end if;
  insert into encheres (objet_id, user_id, pseudo, montant, statut) values (p_objet, u, bf_pseudo(u), o.prix_achat, 'active');
  update objets set nb_encheres = nb_encheres + 1 where id = p_objet;
  perform bf_finaliser_vente(p_objet, u, o.prix_achat, 'achat immédiat');
  select solde into s from profiles where id = u;
  return json_build_object('ok', true, 'mode', 'achat', 'montant', o.prix_achat, 'solde', s, 'papier', o.dessin_id is null);
end $$;

-- ─────────────────────────── 3. Clôture : au market, aucun mouvement d'argent ───────────────────────────
create or replace function bf_finaliser_vente(p_objet uuid, p_acheteur uuid, p_prix int, p_mode text)
returns void language plpgsql security definer set search_path = public as $$
declare o objets%rowtype; c int; comm int;
begin
  perform set_config('bf.interne', '1', true);
  select * into o from objets where id = p_objet for update;
  if o.dessin_id is not null then
    -- la bourse : le vendeur touche le prix moins la commission de la banque
    select commission_pct into c from banque where id = 1;
    comm := floor(p_prix * c / 100.0);
    if o.user_id is not null then
      perform bf_mouvement(o.user_id, p_prix - comm, 'vente', p_objet, null, format('Vente « %s » (%s)', o.titre, p_mode));
    end if;
    perform bf_mouvement(null, comm, 'commission', p_objet, null, format('Commission %s %% sur « %s »', c, o.titre));
  end if;
  -- le market : le prix est une promesse en billets papier, réglée en main propre
  update objets set statut = 'échangé', vendu_a = p_acheteur, vendu_a_pseudo = bf_pseudo(p_acheteur),
                    prix_final = p_prix, vendu_at = now(), enchere_courante = p_prix,
                    encherisseur_id = p_acheteur, encherisseur_pseudo = bf_pseudo(p_acheteur)
  where id = p_objet;
  update encheres set statut = 'gagnante' where objet_id = p_objet and user_id = p_acheteur and statut = 'active';
end $$;
revoke all on function bf_finaliser_vente(uuid, uuid, int, text) from public, anon, authenticated;

-- Retrait par la banque : on ne rend des billets du site qu'à la bourse
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
    if o.dessin_id is not null then
      perform bf_mouvement(o.encherisseur_id, o.enchere_courante, 'remboursement', p_objet, null,
                           format('Vente retirée par la banque : « %s »', o.titre));
    end if;
    update encheres set statut = 'rendue' where objet_id = p_objet and statut = 'active';
  end if;
  update objets set statut = 'retiré' where id = p_objet;
  return json_build_object('ok', true, 'rembourse', case when o.dessin_id is not null then coalesce(o.enchere_courante, 0) else 0 end);
end $$;
revoke all on function admin_retirer_objet(uuid) from public, anon;
grant execute on function admin_retirer_objet(uuid) to authenticated;

-- Remettre en vente : chacun ses dépôts du market. Un billet de la bourse repasse
-- par mettre_dessin_en_vente (nouvelle ligne, historique intact).
create or replace function remettre_en_vente(p_objet uuid, p_mise int, p_prix_achat int, p_duree int)
returns json language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); o objets%rowtype;
begin
  if u is null then raise exception 'Connectez-vous.'; end if;
  select * into o from objets where id = p_objet for update;
  if not found or o.user_id <> u then raise exception 'Ce dépôt n''est pas le vôtre.'; end if;
  if o.dessin_id is not null then raise exception 'Un billet se remet en vente depuis votre collection, dans la bourse.'; end if;
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

grant execute on function placer_enchere(uuid, int), acheter_immediat(uuid), remettre_en_vente(uuid, int, int, int) to authenticated;
