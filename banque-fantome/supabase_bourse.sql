-- ══════════════════════════════════════════════════════════════════
-- BANQUE FANTÔME : la bourse aux billets, et le market rendu à la banque
-- Écrit le 2026-10-18, à la demande de Jiiji. À coller dans Supabase →
-- SQL Editor → Run, APRÈS tous les autres fichiers (il a besoin de
-- bf_est_banquier, de supabase_fil_actu.sql). ADDITIF et rejouable.
--
-- Ce qui change :
--   • le guichet photo ferme : emettre_billet n'est plus appelable
--     (« pas du tout fluide », aucun billet n'y a jamais été émis) ;
--   • l'argent naît dans l'atelier du site : on dessine sur un billet
--     habillé (dessins), puis on l'ENCAISSE (la banque le garde, le compte
--     est crédité de sa valeur) ou on le met en VENTE dans la bourse ;
--   • un billet acheté dans la bourse passe dans la collection de
--     l'acheteur, qui peut le revendre ;
--   • le market n'accueille plus que les ventes de la banque. L'argent de
--     ces ventes va au trésor, la remise se fait en main propre ;
--   • faille fermée : un profil ne peut plus naître avec un solde ou le
--     rôle de banquier (la garde ne portait que sur l'update).
-- ══════════════════════════════════════════════════════════════════

-- ─────────────────────────── 0. Faille des profils ───────────────────────────
-- Avant ce fichier, profiles_insert laissait un compte s'inscrire avec
-- solde = 1000000 ou role = 'banquier'. Vérifié le 2026-10-18 : personne
-- ne s'en est servi (soldes = grand livre, un seul banquier).
create or replace function bf_garde_profiles_insert() returns trigger language plpgsql as $$
begin
  if not bf_est_interne() then
    new.solde := 0;
    new.role  := 'joueur';
  end if;
  return new;
end $$;
drop trigger if exists profiles_garde_insert on profiles;
create trigger profiles_garde_insert before insert on profiles for each row execute function bf_garde_profiles_insert();

-- ─────────────────────────── 1. Réglages de la banque ───────────────────────────
alter table banque add column if not exists plafond_encaissement_jour integer not null default 3;  -- billets encaissés par 24 h et par compte
alter table banque add column if not exists traits_min                integer not null default 5;  -- en dessous, la banque n'émet pas

-- ─────────────────────────── 2. Les billets dessinés ───────────────────────────
create table if not exists dessins (
  id                  uuid primary key default gen_random_uuid(),
  numero              int generated always as identity,
  auteur_id           uuid references auth.users(id) on delete set null,
  auteur_pseudo       text,
  proprietaire_id     uuid references auth.users(id) on delete set null,  -- null = la banque (billet encaissé)
  proprietaire_pseudo text,
  coupure             integer not null check (coupure in (5, 10, 20, 50, 100, 200, 500)),
  graine              bigint,                -- refait le même habillage
  code                text,                  -- le n° imprimé sur le billet (BF-20-K7Q2)
  titre               text,
  devise              text,
  image_path          text not null,
  trace               jsonb not null,        -- format --dessin de machine-a-bifton : réimprimable
  nb_traits           integer not null default 0,
  nb_ventes           integer not null default 0,
  statut              text not null default 'collection',   -- collection | en_vente | encaisse | annule
  billet_id           uuid references billets_emis(id) on delete set null,
  created_at          timestamptz default now()
);
create index if not exists dessins_proprietaire_idx on dessins (proprietaire_id, created_at desc);
create index if not exists dessins_auteur_idx       on dessins (auteur_id, created_at desc);

alter table dessins enable row level security;
drop policy if exists "dessins_read" on dessins; create policy "dessins_read" on dessins for select using (true);
-- Aucune policy d'écriture : tout passe par les fonctions ci-dessous.

alter table billets_emis add column if not exists dessin_id uuid references dessins(id) on delete set null;

-- Une vente de la bourse est une ligne d'objets qui pointe vers son dessin.
-- Chaque revente fait une nouvelle ligne : l'historique des propriétaires se lit là.
alter table objets add column if not exists dessin_id      uuid references dessins(id) on delete set null;
alter table objets add column if not exists vendeur_banque boolean not null default false;
create unique index if not exists objets_dessin_en_vente on objets (dessin_id) where statut = 'disponible';

-- ─────────────────────────── 3. Garde-fous sur objets ───────────────────────────
-- Reprise de bf_garde_objets (supabase_hotel_des_ventes.sql) avec trois ajouts :
-- seul le banquier insère directement (le market) ; dessin_id et vendeur_banque
-- sont verrouillés ; une vente de la bourse ne se modifie pas à la main.
create or replace function bf_garde_objets() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if not bf_est_interne() then
      if not bf_est_banquier() then raise exception 'Le market est réservé aux ventes de la banque.'; end if;
      if new.mise_depart is null then raise exception 'Une vente demande une mise de départ.'; end if;
      new.dessin_id := null;
      new.vendeur_banque := true;
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
    -- Une vente en cours ne change pas de statut à la main (utiliser retirer_vente)
    if old.mise_depart is not null and new.statut is distinct from old.statut then
      raise exception 'Une vente se retire avec retirer_vente(), son statut ne se modifie pas à la main.';
    end if;
  end if;
  return new;
end $$;

create or replace function bf_garde_objets_delete() returns trigger language plpgsql as $$
begin
  if not bf_est_interne() then
    if old.dessin_id is not null then raise exception 'Une vente de la bourse se retire, elle ne se supprime pas.'; end if;
    if old.mise_depart is not null then
      if old.statut = 'disponible' and old.nb_encheres > 0 then raise exception 'Impossible de supprimer une vente qui a déjà des enchères.'; end if;
      if old.prix_final is not null then raise exception 'Une vente conclue reste dans le registre de la banque.'; end if;
    end if;
  end if;
  return old;
end $$;

-- La policy suit le trigger : seul le banquier insère dans objets.
drop policy if exists "objets_insert" on objets;
create policy "objets_insert" on objets for insert
  with check (auth.uid() is not null and user_id = auth.uid() and bf_est_banquier());

-- Les ventes déjà déposées par le banquier deviennent des ventes de la banque.
-- Celles des joueurs vont au bout (décision de Jiiji du 2026-10-18), sans relance possible.
do $$
begin
  perform set_config('bf.interne', '1', true);
  update objets set vendeur_banque = true
   where dessin_id is null and vendeur_banque = false
     and user_id in (select id from profiles where role = 'banquier');
end $$;

-- ─────────────────────────── 4. Le dessin suit sa vente ───────────────────────────
-- Mise en vente → en_vente ; adjugé → collection de l'acheteur ; retiré → retour en collection.
create or replace function bf_sync_dessin() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.dessin_id is null then return new; end if;
  perform set_config('bf.interne', '1', true);
  if new.statut = 'disponible' then
    update dessins set statut = 'en_vente' where id = new.dessin_id;
  elsif new.statut = 'échangé' and (tg_op = 'INSERT' or old.statut is distinct from 'échangé') then
    update dessins set statut = 'collection', proprietaire_id = new.vendu_a, proprietaire_pseudo = new.vendu_a_pseudo,
                       nb_ventes = nb_ventes + 1
     where id = new.dessin_id;
  elsif new.statut in ('retiré', 'expiré') then
    update dessins set statut = 'collection' where id = new.dessin_id and statut = 'en_vente';
  end if;
  return new;
end $$;
drop trigger if exists objets_sync_dessin on objets;
create trigger objets_sync_dessin after insert or update of statut on objets for each row execute function bf_sync_dessin();

-- ─────────────────────────── 5. Clôture d'une vente ───────────────────────────
-- Reprise de bf_finaliser_vente : quand la banque vend, tout le prix va au trésor.
create or replace function bf_finaliser_vente(p_objet uuid, p_acheteur uuid, p_prix int, p_mode text)
returns void language plpgsql security definer set search_path = public as $$
declare o objets%rowtype; c int; comm int;
begin
  perform set_config('bf.interne', '1', true);
  select * into o from objets where id = p_objet for update;
  if o.vendeur_banque then
    perform bf_mouvement(null, p_prix, 'vente', p_objet, null, format('Vente de la banque « %s » (%s)', o.titre, p_mode));
  else
    select commission_pct into c from banque where id = 1;
    comm := floor(p_prix * c / 100.0);
    -- Le vendeur touche le prix moins la commission
    if o.user_id is not null then
      perform bf_mouvement(o.user_id, p_prix - comm, 'vente', p_objet, null, format('Vente « %s » (%s)', o.titre, p_mode));
    end if;
    perform bf_mouvement(null, comm, 'commission', p_objet, null, format('Commission %s %% sur « %s »', c, o.titre));
  end if;
  update objets set statut = 'échangé', vendu_a = p_acheteur, vendu_a_pseudo = bf_pseudo(p_acheteur),
                    prix_final = p_prix, vendu_at = now(), enchere_courante = p_prix,
                    encherisseur_id = p_acheteur, encherisseur_pseudo = bf_pseudo(p_acheteur)
  where id = p_objet;
  update encheres set statut = 'gagnante' where objet_id = p_objet and user_id = p_acheteur and statut = 'active';
end $$;
revoke all on function bf_finaliser_vente(uuid, uuid, int, text) from public, anon, authenticated;

-- Remettre en vente : réservé aux ventes de la banque. Un billet de la bourse
-- repasse par mettre_dessin_en_vente (nouvelle ligne, historique intact).
create or replace function remettre_en_vente(p_objet uuid, p_mise int, p_prix_achat int, p_duree int)
returns json language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); o objets%rowtype;
begin
  if u is null then raise exception 'Connectez-vous.'; end if;
  select * into o from objets where id = p_objet for update;
  if not found or o.user_id <> u then raise exception 'Ce dépôt n''est pas le vôtre.'; end if;
  if o.dessin_id is not null then raise exception 'Un billet se remet en vente depuis votre collection, dans la bourse.'; end if;
  if not o.vendeur_banque then raise exception 'Le market est désormais réservé aux ventes de la banque.'; end if;
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

-- ─────────────────────────── 6. L'atelier (RPC) ───────────────────────────

-- Déposer un billet dessiné dans sa collection. L'image est déjà envoyée
-- dans le bucket objets, sous dessins/<uid>/.
create or replace function deposer_dessin(p_coupure int, p_graine bigint, p_code text, p_image_path text, p_trace jsonb,
                                          p_titre text default null, p_devise text default null)
returns json language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); n int; mini int; jour int; d uuid; num int;
begin
  if u is null then raise exception 'Connectez-vous pour déposer votre billet.'; end if;
  if p_coupure not in (5, 10, 20, 50, 100, 200, 500) then raise exception 'Coupure invalide.'; end if;
  if p_image_path is null or p_image_path not like 'dessins/' || u::text || '/%' then raise exception 'Image du billet invalide.'; end if;
  if p_trace is null or jsonb_typeof(p_trace -> 'dessin') <> 'array' then raise exception 'Dessin illisible.'; end if;
  if pg_column_size(p_trace) > 2000000 then raise exception 'Dessin trop lourd pour le registre.'; end if;
  n := jsonb_array_length(p_trace -> 'dessin');
  select traits_min into mini from banque where id = 1;
  if n < mini then raise exception 'Dessinez un peu plus : la banque n''émet pas de billet blanc.'; end if;
  select count(*) into jour from dessins where auteur_id = u and created_at > now() - interval '1 day';
  if jour >= 30 then raise exception 'Trente billets en un jour : l''atelier ferme jusqu''à demain.'; end if;
  insert into dessins (auteur_id, auteur_pseudo, proprietaire_id, proprietaire_pseudo, coupure, graine, code,
                       titre, devise, image_path, trace, nb_traits)
  values (u, bf_pseudo(u), u, bf_pseudo(u), p_coupure, p_graine, left(trim(p_code), 30),
          nullif(left(trim(p_titre), 120), ''), nullif(left(trim(p_devise), 40), ''), p_image_path, p_trace, n)
  returning id, numero into d, num;
  return json_build_object('dessin_id', d, 'numero', num);
end $$;

-- Encaisser : la banque garde le billet (il rejoint le mur), le compte est crédité de sa valeur.
-- Seul l'auteur encaisse, et seulement un billet qui n'a jamais circulé.
create or replace function encaisser_dessin(p_dessin uuid)
returns json language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); d dessins%rowtype; plafond int; jour int; b uuid; s int;
begin
  if u is null then raise exception 'Connectez-vous pour encaisser.'; end if;
  select * into d from dessins where id = p_dessin for update;
  if not found then raise exception 'Billet introuvable.'; end if;
  if d.statut = 'encaisse' then raise exception 'Ce billet est déjà encaissé.'; end if;
  if d.statut = 'annule' then raise exception 'Ce billet a été annulé par la banque.'; end if;
  if d.proprietaire_id is distinct from u or d.auteur_id is distinct from u then raise exception 'Seul l''auteur encaisse son propre billet.'; end if;
  if d.statut = 'en_vente' then raise exception 'Ce billet est en vente dans la bourse : retirez-le d''abord.'; end if;
  if d.statut <> 'collection' then raise exception 'Ce billet n''est plus dans votre collection.'; end if;
  if d.nb_ventes > 0 then raise exception 'Un billet qui a déjà circulé ne s''encaisse plus.'; end if;
  select plafond_encaissement_jour into plafond from banque where id = 1;
  select count(*) into jour from billets_emis where user_id = u and created_at > now() - interval '1 day';
  if jour >= plafond then raise exception 'La banque encaisse % billets par jour et par compte. Revenez demain.', plafond; end if;
  perform set_config('bf.interne', '1', true);
  insert into billets_emis (user_id, pseudo, valeur, image_path, titre, artiste, technique, devise, dessin_id)
  values (u, bf_pseudo(u), d.coupure, d.image_path, d.titre, bf_pseudo(u), 'atelier du site', d.devise, d.id)
  returning id into b;
  perform bf_mouvement(u, d.coupure, 'emission', null, b,
    format('Encaissement du billet n° %s%s', d.code, coalesce(', « ' || d.titre || ' »', '')));
  update dessins set statut = 'encaisse', proprietaire_id = null, proprietaire_pseudo = null, billet_id = b where id = d.id;
  select solde into s from profiles where id = u;
  return json_build_object('billet_id', b, 'solde', s);
end $$;

-- Mettre en vente dans la bourse un billet de sa collection (dessiné ou acheté).
create or replace function mettre_dessin_en_vente(p_dessin uuid, p_mise int, p_prix_achat int, p_duree int)
returns json language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); d dessins%rowtype; o uuid;
begin
  if u is null then raise exception 'Connectez-vous pour vendre.'; end if;
  select * into d from dessins where id = p_dessin for update;
  if not found then raise exception 'Billet introuvable.'; end if;
  if d.proprietaire_id is distinct from u then raise exception 'Ce billet n''est pas dans votre collection.'; end if;
  if d.statut <> 'collection' then raise exception 'Ce billet est déjà en vente, ou n''est plus à vous.'; end if;
  perform set_config('bf.interne', '1', true);
  insert into objets (titre, description, image_path, image_paths, pseudo, user_id, categorie,
                      mise_depart, prix_achat, duree_jours, dessin_id, vendeur_banque)
  values (coalesce(d.titre, format('Billet de %s', d.coupure)),
          format('Billet de %s n° %s, dessiné par %s.', d.coupure, d.code, coalesce(d.auteur_pseudo, 'un compte disparu')),
          d.image_path, array[d.image_path], bf_pseudo(u), u, 'billet',
          p_mise, p_prix_achat, p_duree, d.id, false)
  returning id into o;
  return json_build_object('ok', true, 'objet_id', o);
end $$;

-- Annuler un billet (banquier) : reprise d'annuler_billet, le dessin encaissé est marqué annulé.
create or replace function annuler_billet(p_billet uuid, p_motif text default null)
returns json language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); b billets_emis%rowtype; s int;
begin
  if u is null or not exists (select 1 from profiles where id = u and role = 'banquier') then
    raise exception 'Réservé au banquier.';
  end if;
  select * into b from billets_emis where id = p_billet for update;
  if not found then raise exception 'Billet introuvable.'; end if;
  if b.statut = 'annule' then raise exception 'Billet déjà annulé.'; end if;
  perform set_config('bf.interne', '1', true);
  update billets_emis set statut = 'annule', annule_par = u, annule_at = now(), motif = p_motif where id = p_billet;
  if b.dessin_id is not null then update dessins set statut = 'annule' where id = b.dessin_id; end if;
  perform bf_mouvement(b.user_id, -b.valeur, 'annulation', null, p_billet, coalesce('Billet annulé : ' || p_motif, 'Billet annulé'));
  select solde into s from profiles where id = b.user_id;
  return json_build_object('ok', true, 'solde', s);
end $$;

-- Le guichet photo ferme. La fonction reste (historique), plus personne ne l'appelle.
revoke execute on function emettre_billet(int, text, text, text, text, text, text) from public, anon, authenticated;

revoke all on function deposer_dessin(int, bigint, text, text, jsonb, text, text), encaisser_dessin(uuid),
  mettre_dessin_en_vente(uuid, int, int, int) from public, anon;
grant execute on function deposer_dessin(int, bigint, text, text, jsonb, text, text), encaisser_dessin(uuid),
  mettre_dessin_en_vente(uuid, int, int, int), annuler_billet(uuid, text), remettre_en_vente(uuid, int, int, int)
  to authenticated;

-- ─────────────────────────── 7. Chiffres publics ───────────────────────────
-- Reprise de stats_banque (supabase_admin.sql), avec la bourse et sans le market des joueurs.
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
    'plafond_encaissement_jour', (select plafond_encaissement_jour from banque where id = 1)
  )
$$;
grant execute on function stats_banque() to anon, authenticated;

-- ─────────────────────────── 8. Temps réel ───────────────────────────
do $$
begin
  begin alter publication supabase_realtime add table dessins; exception when duplicate_object or undefined_object then null; end;
end $$;
