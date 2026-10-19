-- ══════════════════════════════════════════════════════════════════
-- BANQUE FANTÔME : la file d'impression, la modération, la fiche des comptes
-- Écrit le 2026-10-19 au soir, à la demande de Jiiji. À jouer APRÈS supabase_bon_coin.sql.
-- ADDITIF et rejouable.
--
--   1. « faut que moi la banque je reçoive les nouveaux billets en planche pour les
--      imprimer en vrai » : dessins.imprime_at, la file « À imprimer » de l'admin.
--   2. « un petit crayon pour édition sur chaque post des users » : éditer, contacter,
--      mettre en pause. Une publication en pause disparaît des vitrines (son auteur et la
--      banque la voient encore), ses enchères sont gelées, elle ne s'encaisse ni ne se vend.
--   3. « dans l'admin, j'ai accès à tout dans la partie users » : admin_fiche_compte.
-- ══════════════════════════════════════════════════════════════════

-- ─────────────────────────── 1. À imprimer ───────────────────────────
alter table dessins add column if not exists imprime_at timestamptz;

create or replace function admin_marquer_imprimes(p_ids uuid[], p_imprime boolean default true)
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not bf_est_banquier() then raise exception 'Réservé au banquier.'; end if;
  update dessins set imprime_at = case when p_imprime then now() else null end where id = any(p_ids);
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function admin_marquer_imprimes(uuid[], boolean) from public, anon;
grant execute on function admin_marquer_imprimes(uuid[], boolean) to authenticated;

-- ─────────────────────────── 2. La pause ───────────────────────────
alter table objets  add column if not exists en_pause boolean not null default false;
alter table oeuvres add column if not exists en_pause boolean not null default false;
alter table dessins add column if not exists en_pause boolean not null default false;

-- Une publication en pause sort des vitrines ; son auteur, son propriétaire, ceux qui ont
-- enchéri dessus et la banque la voient encore.
drop policy if exists "objets_read" on objets;
create policy "objets_read" on objets for select
  using (not en_pause or user_id = auth.uid() or encherisseur_id = auth.uid() or vendu_a = auth.uid() or bf_est_banquier());
drop policy if exists oeuvres_lecture on oeuvres;
create policy oeuvres_lecture on oeuvres for select
  using ((statut <> 'annule' and not en_pause) or proprietaire_id = auth.uid() or auteur_id = auth.uid() or bf_est_banquier());
drop policy if exists "dessins_read" on dessins;
create policy "dessins_read" on dessins for select
  using (not en_pause or proprietaire_id = auth.uid() or auteur_id = auth.uid() or bf_est_banquier());

-- Reprise de bf_garde_objets (supabase_bon_coin.sql) : en_pause ne se touche pas à la main.
create or replace function bf_garde_objets() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if not bf_est_interne() then
      if new.mise_depart is null then raise exception 'Une vente demande une mise de départ.'; end if;
      new.dessin_id := null; new.oeuvre_id := null; new.en_pause := false;
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
    if new.en_pause is distinct from old.en_pause then raise exception 'Seule la banque met une vente en pause.'; end if;
    if old.en_pause then raise exception 'Cette vente est en pause : la banque y jette un œil.'; end if;
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

-- Un billet ou une œuvre en pause ne se met pas en vente (toutes les mises en vente
-- passent par une ligne d'objets, même celles des fonctions internes).
create or replace function bf_garde_pause_vente() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.dessin_id is not null and exists (select 1 from dessins where id = new.dessin_id and en_pause) then
    raise exception 'Ce billet est en pause : la banque y jette un œil.';
  end if;
  if new.oeuvre_id is not null and exists (select 1 from oeuvres where id = new.oeuvre_id and en_pause) then
    raise exception 'Cette œuvre est en pause : la banque y jette un œil.';
  end if;
  return new;
end $$;
drop trigger if exists objets_garde_pause on objets;
create trigger objets_garde_pause before insert on objets for each row execute function bf_garde_pause_vente();

-- Pas d'enchère ni d'achat sur une vente en pause (placer_enchere et acheter_immediat
-- écrivent tous deux dans encheres : l'erreur annule aussi leurs mouvements d'argent).
create or replace function bf_garde_pause_enchere() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from objets where id = new.objet_id and en_pause) then
    raise exception 'Cette vente est en pause : la banque y jette un œil.';
  end if;
  return new;
end $$;
drop trigger if exists encheres_garde_pause on encheres;
create trigger encheres_garde_pause before insert on encheres for each row execute function bf_garde_pause_enchere();

-- Un billet en pause ne s'encaisse pas et ne part pas en vente (le retour en collection,
-- l'annulation par la banque et la propriété qui change restent possibles).
create or replace function bf_garde_pause_dessin() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.en_pause and new.en_pause and new.statut is distinct from old.statut and new.statut in ('encaisse', 'en_vente') then
    raise exception 'Ce billet est en pause : la banque y jette un œil.';
  end if;
  return new;
end $$;
drop trigger if exists dessins_garde_pause on dessins;
create trigger dessins_garde_pause before update on dessins for each row execute function bf_garde_pause_dessin();

-- Clôture des ventes échues (reprise de supabase_bon_coin.sql) : une vente en pause attend.
create or replace function resoudre_ventes_expirees()
returns int language plpgsql security definer set search_path = public as $$
declare o record; n int := 0; periode interval;
begin
  perform set_config('bf.interne', '1', true);
  for o in select id, encherisseur_id, enchere_courante, expire_at, duree_jours from objets
           where mise_depart is not null and statut = 'disponible' and expire_at <= now() and not en_pause
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

-- ─────────────────────────── 3. Le crayon de la banque ───────────────────────────
-- p_type : objet | oeuvre | dessin ; p_action : pause | reprendre | editer.
-- Une œuvre ou un billet entraîne sa vente en cours ; une vente d'œuvre, son œuvre.
-- À la reprise, une vente échue pendant la pause repart pour un jour au moins.
create or replace function admin_moderer(p_type text, p_id uuid, p_action text,
                                         p_titre text default null, p_description text default null)
returns json language plpgsql security definer set search_path = public as $$
declare o objets%rowtype; v_oeuvre uuid; v_dessin uuid; v_objet uuid; pause boolean;
        t text := nullif(left(trim(coalesce(p_titre, '')), 120), '');
        d text := left(trim(coalesce(p_description, '')), 2000);
begin
  if not bf_est_banquier() then raise exception 'Réservé au banquier.'; end if;
  if p_type not in ('objet', 'oeuvre', 'dessin') then raise exception 'Type inconnu.'; end if;
  if p_action not in ('pause', 'reprendre', 'editer') then raise exception 'Action inconnue.'; end if;
  perform set_config('bf.interne', '1', true);

  -- ce que vise le crayon, et ce qui va avec
  if p_type = 'objet' then
    select * into o from objets where id = p_id for update;
    if not found then raise exception 'Vente introuvable.'; end if;
    v_objet := o.id; v_oeuvre := o.oeuvre_id; v_dessin := o.dessin_id;
  elsif p_type = 'oeuvre' then
    if not exists (select 1 from oeuvres where id = p_id) then raise exception 'Œuvre introuvable.'; end if;
    v_oeuvre := p_id;
    select id into v_objet from objets where oeuvre_id = p_id and statut = 'disponible';
  else
    if not exists (select 1 from dessins where id = p_id) then raise exception 'Billet introuvable.'; end if;
    v_dessin := p_id;
    select id into v_objet from objets where dessin_id = p_id and statut = 'disponible';
  end if;

  if p_action in ('pause', 'reprendre') then
    pause := p_action = 'pause';
    if v_oeuvre is not null then update oeuvres set en_pause = pause where id = v_oeuvre; end if;
    if v_dessin is not null then update dessins set en_pause = pause where id = v_dessin; end if;
    if v_objet is not null then
      update objets set en_pause = pause,
             expire_at = case when not pause and statut = 'disponible' and mise_depart is not null
                              then greatest(expire_at, now() + interval '1 day') else expire_at end
       where id = v_objet;
    end if;
  else
    if t is null then raise exception 'Le titre ne peut pas être vide.'; end if;
    if v_oeuvre is not null then update oeuvres set titre = t, description = nullif(d, '') where id = v_oeuvre; end if;
    if v_dessin is not null then update dessins set titre = t where id = v_dessin; end if;
    if v_objet is not null then update objets set titre = t, description = coalesce(nullif(d, ''), description) where id = v_objet; end if;
  end if;
  return json_build_object('ok', true, 'objet', v_objet, 'oeuvre', v_oeuvre, 'dessin', v_dessin);
end $$;
revoke all on function admin_moderer(text, uuid, text, text, text) from public, anon;
grant execute on function admin_moderer(text, uuid, text, text, text) to authenticated;

-- ─────────────────────────── 4. La fiche d'un compte ───────────────────────────
-- Tout ce qui touche à un compte, pour la banque : billets, œuvres, ventes, enchères,
-- mouvements d'argent. Pas les messages privés.
create or replace function admin_fiche_compte(p_user uuid)
returns json language plpgsql stable security definer set search_path = public as $$
begin
  if not bf_est_banquier() then raise exception 'Réservé au banquier.'; end if;
  return json_build_object(
    'profil', (select json_build_object('id', id, 'pseudo', pseudo, 'solde', solde, 'role', role, 'created_at', created_at)
                 from profiles where id = p_user),
    'billets', coalesce((select json_agg(x order by x.created_at desc) from (
        select id, numero, code, coupure, titre, image_path, statut, en_pause, imprime_at, auteur_id, auteur_pseudo,
               proprietaire_id, proprietaire_pseudo, created_at
          from dessins where auteur_id = p_user or proprietaire_id = p_user) x), '[]'::json),
    'oeuvres', coalesce((select json_agg(x order by x.created_at desc) from (
        select id, numero, genre, titre, description, apercu_path, statut, en_pause, auteur_id, auteur_pseudo,
               proprietaire_id, proprietaire_pseudo, nb_ventes, created_at
          from oeuvres where auteur_id = p_user or proprietaire_id = p_user) x), '[]'::json),
    'ventes', coalesce((select json_agg(x order by x.created_at desc) from (
        select * from objets where user_id = p_user or vendu_a = p_user) x), '[]'::json),
    'encheres', coalesce((select json_agg(x order by x.created_at desc) from (
        select e.id, e.objet_id, e.montant, e.statut, e.created_at, ob.titre
          from encheres e left join objets ob on ob.id = e.objet_id
         where e.user_id = p_user order by e.created_at desc limit 100) x), '[]'::json),
    'transactions', coalesce((select json_agg(x order by x.created_at desc) from (
        select id, montant, type, libelle, created_at from transactions
         where user_id = p_user order by created_at desc limit 200) x), '[]'::json)
  );
end $$;
revoke all on function admin_fiche_compte(uuid) from public, anon;
grant execute on function admin_fiche_compte(uuid) to authenticated;

-- ─────────────────────────── 5. Les nouveautés ───────────────────────────
-- Reprise de supabase_market_numerique.sql : + les billets qui attendent l'imprimante.
create or replace function admin_nouveautes()
returns json language plpgsql stable security definer set search_path = public as $$
declare
  moi uuid := auth.uid();
  defaut timestamptz := now() - interval '7 days';
  v_comptes timestamptz; v_billets timestamptz; v_market timestamptz; v_abonnes timestamptz; v_oeuvres timestamptz;
begin
  if not bf_est_banquier() then raise exception 'Réservé au banquier.'; end if;
  select coalesce(max(vu_at) filter (where rubrique = 'comptes'), defaut),
         coalesce(max(vu_at) filter (where rubrique = 'billets'), defaut),
         coalesce(max(vu_at) filter (where rubrique = 'market'),  defaut),
         coalesce(max(vu_at) filter (where rubrique = 'abonnes'), defaut),
         coalesce(max(vu_at) filter (where rubrique = 'oeuvres'), defaut)
    into v_comptes, v_billets, v_market, v_abonnes, v_oeuvres
    from admin_vu where user_id = moi;
  return json_build_object(
    'comptes', json_build_object('depuis', v_comptes,
      'n', (select count(*) from profiles where created_at > v_comptes and id <> moi)),
    'billets', json_build_object('depuis', v_billets,
      'n', (select count(*) from billets_emis where created_at > v_billets and user_id is distinct from moi)),
    'market', json_build_object('depuis', v_market,
      'n', (select count(*) from objets where created_at > v_market and user_id is distinct from moi)),
    'oeuvres', json_build_object('depuis', v_oeuvres,
      'n', (select count(*) from oeuvres where created_at > v_oeuvres and auteur_id is distinct from moi)),
    'a_imprimer', json_build_object(
      'n', (select count(*) from dessins where imprime_at is null and statut <> 'annule')),
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
