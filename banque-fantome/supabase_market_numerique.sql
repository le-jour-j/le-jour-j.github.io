-- ══════════════════════════════════════════════════════════════════
-- BANQUE FANTÔME : le market numérique et le supermarket de la banque
-- Écrit le 2026-10-19, à la demande de Jiiji. À jouer APRÈS supabase_garde_fous.sql.
-- ADDITIF et rejouable.
--
-- Trois circuits :
--   • la bourse (objets.dessin_id) : les billets dessinés, payés en argent du site ;
--   • le market (objets.oeuvre_id) : les œuvres faites dans les ateliers du site
--     (paint, poésie, image retouchée, collage), payées en argent du site, 5 % de
--     commission. L'œuvre est unique : achetée, elle passe dans la collection de
--     l'acheteur, qui peut la revendre. L'aperçu est public ; l'image en haute
--     définition ne se télécharge que par son propriétaire (bucket privé oeuvres-hd) ;
--   • le supermarket (objets sans dessin ni œuvre) : les objets physiques, déposés par
--     la banque seule, en promesses de billets papier, remis en main propre. Les ventes
--     physiques des joueurs en cours vont au bout, sans relance.
-- ══════════════════════════════════════════════════════════════════

-- ─────────────────────────── 1. Les œuvres ───────────────────────────
create table if not exists oeuvres (
  id                  uuid primary key default gen_random_uuid(),
  numero              int generated always as identity,
  genre               text not null check (genre in ('paint', 'poesie', 'image', 'collage')),
  auteur_id           uuid references auth.users(id) on delete set null,
  auteur_pseudo       text,
  proprietaire_id     uuid references auth.users(id) on delete set null,
  proprietaire_pseudo text,
  titre               text not null,
  description         text,
  apercu_path         text not null,   -- bucket public objets : oeuvres/<uid>/...
  hd_path             text not null,   -- bucket privé oeuvres-hd : <uid>/...
  largeur             int,
  hauteur             int,
  source              jsonb,           -- de quoi refaire l'œuvre (traits, texte, réglages)
  nb_ventes           int not null default 0,
  statut              text not null default 'collection' check (statut in ('collection', 'en_vente', 'annule')),
  motif               text,
  created_at          timestamptz not null default now()
);
create index if not exists oeuvres_proprietaire_idx on oeuvres (proprietaire_id, created_at desc);
create index if not exists oeuvres_auteur_idx on oeuvres (auteur_id, created_at desc);

alter table oeuvres enable row level security;
drop policy if exists oeuvres_lecture on oeuvres;
create policy oeuvres_lecture on oeuvres for select
  using (statut <> 'annule' or proprietaire_id = auth.uid() or auteur_id = auth.uid() or bf_est_banquier());
-- Pas d'écriture directe : tout passe par les fonctions ci-dessous.
revoke insert, update, delete on oeuvres from anon, authenticated;
grant select on oeuvres to anon, authenticated;

alter table objets add column if not exists oeuvre_id uuid references oeuvres(id) on delete set null;
create unique index if not exists objets_oeuvre_en_vente on objets (oeuvre_id) where statut = 'disponible';
-- Une vente « numérique » se paie en argent du site : la bourse et le market.
alter table objets add column if not exists numerique boolean generated always as (dessin_id is not null or oeuvre_id is not null) stored;

-- ─────────────────────────── 2. Stockage ───────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('oeuvres-hd', 'oeuvres-hd', false, 12582912, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Bucket public objets : dessins/<uid>/ et oeuvres/<uid>/ sont à leur auteur seul, et ne s'effacent pas.
drop policy if exists storage_insert on storage.objects;
create policy storage_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'objets'
    and (name not like 'dessins/%' or name like 'dessins/' || auth.uid()::text || '/%')
    and (name not like 'oeuvres/%' or name like 'oeuvres/' || auth.uid()::text || '/%'));
drop policy if exists storage_delete on storage.objects;
create policy storage_delete on storage.objects for delete to authenticated
  using (bucket_id = 'objets' and owner = auth.uid() and name not like 'dessins/%' and name not like 'oeuvres/%');

-- Bucket privé oeuvres-hd : on y dépose dans son dossier ; on lit la HD de ce qu'on possède.
drop policy if exists oeuvres_hd_depot on storage.objects;
create policy oeuvres_hd_depot on storage.objects for insert to authenticated
  with check (bucket_id = 'oeuvres-hd' and name like auth.uid()::text || '/%');
drop policy if exists oeuvres_hd_lecture on storage.objects;
create policy oeuvres_hd_lecture on storage.objects for select to authenticated
  using (bucket_id = 'oeuvres-hd' and (bf_est_banquier()
    or exists (select 1 from public.oeuvres o where o.hd_path = name and o.proprietaire_id = auth.uid())));

-- ─────────────────────────── 3. Les dépôts dans objets ───────────────────────────
-- Reprise de bf_garde_objets (supabase_garde_fous.sql) : seule la banque dépose un objet
-- physique (le supermarket) ; une vente de la bourse ou du market ne se modifie pas.
create or replace function bf_garde_objets() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if not bf_est_interne() then
      if not bf_est_banquier() then raise exception 'Le supermarket est tenu par la banque. Vos œuvres se déposent depuis Créer, puis se vendent au market.'; end if;
      if new.mise_depart is null then raise exception 'Une vente demande une mise de départ.'; end if;
      new.dessin_id := null; new.oeuvre_id := null;
      new.vendeur_banque := true;
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
       or new.vendeur_banque is distinct from old.vendeur_banque then
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

create or replace function bf_garde_objets_delete() returns trigger language plpgsql as $$
begin
  if not bf_est_interne() then
    if old.dessin_id is not null then raise exception 'Une vente de la bourse se retire, elle ne se supprime pas.'; end if;
    if old.oeuvre_id is not null then raise exception 'Une vente du market se retire, elle ne se supprime pas.'; end if;
    if old.mise_depart is not null then
      if old.statut = 'disponible' and old.nb_encheres > 0 then raise exception 'Impossible de supprimer une vente qui a déjà des enchères.'; end if;
      if old.prix_final is not null then raise exception 'Une vente conclue reste dans le registre de la banque.'; end if;
    end if;
  end if;
  return old;
end $$;

drop policy if exists "objets_insert" on objets;
create policy "objets_insert" on objets for insert
  with check (auth.uid() is not null and user_id = auth.uid() and bf_est_banquier());

-- ─────────────────────────── 4. L'œuvre suit sa vente ───────────────────────────
create or replace function bf_sync_oeuvre() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.oeuvre_id is null then return new; end if;
  perform set_config('bf.interne', '1', true);
  if new.statut = 'disponible' then
    update oeuvres set statut = 'en_vente' where id = new.oeuvre_id and statut <> 'annule';
  elsif new.statut = 'échangé' and (tg_op = 'INSERT' or old.statut is distinct from 'échangé') then
    update oeuvres set statut = 'collection', proprietaire_id = new.vendu_a, proprietaire_pseudo = new.vendu_a_pseudo,
                       nb_ventes = nb_ventes + 1
     where id = new.oeuvre_id;
  elsif new.statut in ('retiré', 'expiré') then
    update oeuvres set statut = 'collection' where id = new.oeuvre_id and statut = 'en_vente';
  end if;
  return new;
end $$;
drop trigger if exists objets_sync_oeuvre on objets;
create trigger objets_sync_oeuvre after insert or update of statut on objets for each row execute function bf_sync_oeuvre();

-- ─────────────────────────── 5. L'argent : bourse et market, pas le supermarket ───────────────────────────
-- Reprises de supabase_market_papier.sql : « dessin_id is not null » devient « numerique ».
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
  if o.numerique then
    -- bourse et market : les billets du site sont bloqués, le précédent meneur est remboursé
    select solde into s from profiles where id = u for update;
    if precedent = u then s := s + precedent_montant; end if;
    if s < p_montant then raise exception 'Solde insuffisant (% billets disponibles).', s; end if;
    if precedent is not null then
      perform bf_mouvement(precedent, precedent_montant, 'remboursement', p_objet, null, format('Surenchéri sur « %s »', o.titre));
    end if;
    perform bf_mouvement(u, -p_montant, 'enchere', p_objet, null, format('Enchère sur « %s »', o.titre));
  end if;
  -- au supermarket : une promesse de billets papier, rien ne bouge sur les comptes
  if precedent is not null then
    update encheres set statut = 'surencherie' where objet_id = p_objet and user_id = precedent and statut = 'active';
  end if;
  insert into encheres (objet_id, user_id, pseudo, montant) values (p_objet, u, bf_pseudo(u), p_montant);
  update objets set enchere_courante = p_montant, encherisseur_id = u, encherisseur_pseudo = bf_pseudo(u),
                    nb_encheres = nb_encheres + 1,
                    expire_at = greatest(expire_at, now() + interval '10 minutes')
  where id = p_objet;
  select solde into s from profiles where id = u;
  return json_build_object('ok', true, 'mode', 'enchere', 'montant', p_montant, 'solde', s, 'papier', not o.numerique);
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
  if o.numerique then
    select solde into s from profiles where id = u for update;
    if o.encherisseur_id = u then credit := o.enchere_courante; end if;
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
  return json_build_object('ok', true, 'mode', 'achat', 'montant', o.prix_achat, 'solde', s, 'papier', not o.numerique);
end $$;

create or replace function bf_finaliser_vente(p_objet uuid, p_acheteur uuid, p_prix int, p_mode text)
returns void language plpgsql security definer set search_path = public as $$
declare o objets%rowtype; c int; comm int;
begin
  perform set_config('bf.interne', '1', true);
  select * into o from objets where id = p_objet for update;
  if o.numerique then
    if o.vendeur_banque then
      perform bf_mouvement(null, p_prix, 'vente', p_objet, null, format('Vente de la banque « %s » (%s)', o.titre, p_mode));
    else
      select commission_pct into c from banque where id = 1;
      comm := floor(p_prix * c / 100.0);
      if o.user_id is not null then
        perform bf_mouvement(o.user_id, p_prix - comm, 'vente', p_objet, null, format('Vente « %s » (%s)', o.titre, p_mode));
      end if;
      perform bf_mouvement(null, comm, 'commission', p_objet, null, format('Commission %s %% sur « %s »', c, o.titre));
    end if;
  end if;
  update objets set statut = 'échangé', vendu_a = p_acheteur, vendu_a_pseudo = bf_pseudo(p_acheteur),
                    prix_final = p_prix, vendu_at = now(), enchere_courante = p_prix,
                    encherisseur_id = p_acheteur, encherisseur_pseudo = bf_pseudo(p_acheteur)
  where id = p_objet;
  update encheres set statut = 'gagnante' where objet_id = p_objet and user_id = p_acheteur and statut = 'active';
end $$;
revoke all on function bf_finaliser_vente(uuid, uuid, int, text) from public, anon, authenticated;

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
    if o.numerique then
      perform bf_mouvement(o.encherisseur_id, o.enchere_courante, 'remboursement', p_objet, null,
                           format('Vente retirée par la banque : « %s »', o.titre));
    end if;
    update encheres set statut = 'rendue' where objet_id = p_objet and statut = 'active';
  end if;
  update objets set statut = 'retiré' where id = p_objet;
  return json_build_object('ok', true, 'rembourse', case when o.numerique then coalesce(o.enchere_courante, 0) else 0 end);
end $$;
revoke all on function admin_retirer_objet(uuid) from public, anon;
grant execute on function admin_retirer_objet(uuid) to authenticated;

-- Remettre en vente : seulement les objets de la banque au supermarket. Billets et
-- œuvres repassent par leur collection (nouvelle ligne de vente, historique intact).
create or replace function remettre_en_vente(p_objet uuid, p_mise int, p_prix_achat int, p_duree int)
returns json language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); o objets%rowtype;
begin
  if u is null then raise exception 'Connectez-vous.'; end if;
  select * into o from objets where id = p_objet for update;
  if not found or o.user_id <> u then raise exception 'Ce dépôt n''est pas le vôtre.'; end if;
  if o.dessin_id is not null then raise exception 'Un billet se remet en vente depuis votre collection.'; end if;
  if o.oeuvre_id is not null then raise exception 'Une œuvre se remet en vente depuis votre collection.'; end if;
  if not bf_est_banquier() then raise exception 'Le supermarket est tenu par la banque.'; end if;
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
revoke execute on function placer_enchere(uuid, int), acheter_immediat(uuid), remettre_en_vente(uuid, int, int, int) from public, anon;
grant execute on function placer_enchere(uuid, int), acheter_immediat(uuid), remettre_en_vente(uuid, int, int, int) to authenticated;

-- Clôture des ventes échues (reprise de supabase_relance_auto.sql) : une vente sans enchère
-- repart pour un tour, SAUF un objet physique d'un joueur, qui expire : le supermarket est
-- à la banque, les ventes physiques des joueurs vont au bout et s'arrêtent là.
create or replace function resoudre_ventes_expirees()
returns int language plpgsql security definer set search_path = public as $$
declare o record; n int := 0; periode interval;
begin
  perform set_config('bf.interne', '1', true);
  for o in select id, encherisseur_id, enchere_courante, expire_at, duree_jours, numerique, vendeur_banque from objets
           where mise_depart is not null and statut = 'disponible' and expire_at <= now()
           for update skip locked
  loop
    if o.encherisseur_id is not null then
      perform bf_finaliser_vente(o.id, o.encherisseur_id, o.enchere_courante, 'enchère');
    elsif not o.numerique and not o.vendeur_banque then
      update objets set statut = 'expiré' where id = o.id;
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

-- ─────────────────────────── 6. Les ateliers (RPC) ───────────────────────────
-- Déposer une œuvre dans sa collection. Les deux images sont déjà envoyées :
-- l'aperçu dans objets/oeuvres/<uid>/, la HD dans oeuvres-hd/<uid>/.
create or replace function deposer_oeuvre(p_genre text, p_titre text, p_description text, p_apercu_path text,
                                          p_hd_path text, p_largeur int, p_hauteur int, p_source jsonb)
returns json language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); jour int; o uuid; num int; t text := nullif(left(trim(p_titre), 120), '');
begin
  if u is null then raise exception 'Connectez-vous pour déposer votre œuvre.'; end if;
  if p_genre not in ('paint', 'poesie', 'image', 'collage') then raise exception 'Atelier inconnu.'; end if;
  if t is null then raise exception 'Donnez un titre à votre œuvre.'; end if;
  if p_apercu_path is null or p_apercu_path not like 'oeuvres/' || u::text || '/%' then raise exception 'Aperçu de l''œuvre invalide.'; end if;
  if p_hd_path is null or p_hd_path not like u::text || '/%' then raise exception 'Image de l''œuvre invalide.'; end if;
  if p_source is not null and pg_column_size(p_source) > 1000000 then raise exception 'Œuvre trop lourde pour le registre.'; end if;
  perform 1 from profiles where id = u for update;   -- le plafond tient même en appels simultanés
  select count(*) into jour from oeuvres where auteur_id = u and created_at > now() - interval '1 day';
  if jour >= 30 then raise exception 'Trente œuvres en un jour : les ateliers ferment jusqu''à demain.'; end if;
  insert into oeuvres (genre, auteur_id, auteur_pseudo, proprietaire_id, proprietaire_pseudo, titre, description,
                       apercu_path, hd_path, largeur, hauteur, source)
  values (p_genre, u, bf_pseudo(u), u, bf_pseudo(u), t, nullif(left(trim(p_description), 2000), ''),
          p_apercu_path, p_hd_path, p_largeur, p_hauteur, p_source)
  returning id, numero into o, num;
  return json_build_object('oeuvre_id', o, 'numero', num);
end $$;

-- Mettre en vente au market une œuvre de sa collection (faite ou achetée).
create or replace function mettre_oeuvre_en_vente(p_oeuvre uuid, p_mise int, p_prix_achat int, p_duree int)
returns json language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); w oeuvres%rowtype; o uuid;
begin
  if u is null then raise exception 'Connectez-vous pour vendre.'; end if;
  select * into w from oeuvres where id = p_oeuvre for update;
  if not found then raise exception 'Œuvre introuvable.'; end if;
  if w.proprietaire_id is distinct from u then raise exception 'Cette œuvre n''est pas dans votre collection.'; end if;
  if w.statut <> 'collection' then raise exception 'Cette œuvre est déjà en vente, ou n''est plus disponible.'; end if;
  perform set_config('bf.interne', '1', true);
  insert into objets (titre, description, image_path, image_paths, pseudo, user_id, categorie,
                      mise_depart, prix_achat, duree_jours, oeuvre_id, vendeur_banque)
  values (w.titre,
          coalesce(w.description, format('Œuvre n° %s, faite dans l''atelier %s par %s.', w.numero,
                   case w.genre when 'paint' then 'Paint' when 'poesie' then 'Poésie' when 'image' then 'Image' else 'Collage' end,
                   coalesce(w.auteur_pseudo, 'un compte disparu'))),
          w.apercu_path, array[w.apercu_path], bf_pseudo(u), u, 'œuvre',
          p_mise, p_prix_achat, p_duree, w.id, false)
  returning id into o;
  return json_build_object('ok', true, 'objet_id', o);
end $$;

-- Annuler une œuvre (banquier) : elle sort du market (enchère remboursée) et des vitrines.
create or replace function annuler_oeuvre(p_oeuvre uuid, p_motif text default null)
returns json language plpgsql security definer set search_path = public as $$
declare w oeuvres%rowtype; v uuid;
begin
  if not bf_est_banquier() then raise exception 'Réservé au banquier.'; end if;
  select * into w from oeuvres where id = p_oeuvre for update;
  if not found then raise exception 'Œuvre introuvable.'; end if;
  if w.statut = 'annule' then raise exception 'Œuvre déjà annulée.'; end if;
  select id into v from objets where oeuvre_id = p_oeuvre and statut = 'disponible';
  if v is not null then perform admin_retirer_objet(v); end if;
  perform set_config('bf.interne', '1', true);
  update oeuvres set statut = 'annule', motif = p_motif where id = p_oeuvre;
  return json_build_object('ok', true);
end $$;

revoke all on function deposer_oeuvre(text, text, text, text, text, int, int, jsonb), mettre_oeuvre_en_vente(uuid, int, int, int),
  annuler_oeuvre(uuid, text) from public, anon;
grant execute on function deposer_oeuvre(text, text, text, text, text, int, int, jsonb), mettre_oeuvre_en_vente(uuid, int, int, int),
  annuler_oeuvre(uuid, text) to authenticated;

-- ─────────────────────────── 7. Chiffres publics et admin ───────────────────────────
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
    'plafond_encaissement_jour', (select plafond_encaissement_jour from banque where id = 1)
  )
$$;
grant execute on function stats_banque() to anon, authenticated;

-- Les nouveautés du banquier comptent aussi les œuvres déposées.
alter table admin_vu drop constraint if exists admin_vu_rubrique_check;
alter table admin_vu add constraint admin_vu_rubrique_check check (rubrique in ('comptes', 'billets', 'market', 'abonnes', 'oeuvres'));

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

create or replace function admin_marquer_vu(p_rubriques text[])
returns void language plpgsql security definer set search_path = public as $$
begin
  if not bf_est_banquier() then raise exception 'Réservé au banquier.'; end if;
  insert into admin_vu (user_id, rubrique, vu_at)
    select auth.uid(), r, now() from unnest(p_rubriques) r
     where r in ('comptes', 'billets', 'market', 'abonnes', 'oeuvres')
  on conflict (user_id, rubrique) do update set vu_at = excluded.vu_at;
end $$;
revoke all on function admin_marquer_vu(text[]) from public, anon;
grant execute on function admin_marquer_vu(text[]) to authenticated;

-- ─────────────────────────── 8. Temps réel ───────────────────────────
do $$ begin
  alter publication supabase_realtime add table oeuvres;
exception when duplicate_object or undefined_object then null; end $$;
