-- ══════════════════════════════════════════════════════════════════
-- BANQUE FANTÔME — Hôtel des ventes (enchères + achat immédiat)
-- Migration ADDITIVE : à coller dans Supabase → SQL Editor → Run.
-- Rejouable sans risque (if not exists / or replace partout).
--
-- Principe :
--   • chaque compte a un SOLDE de billets (profiles.solde) ;
--   • on s'enrichit en ÉMETTANT des billets : photo d'un billet dessiné
--     + dénomination → crédité immédiatement (emettre_billet) ;
--   • un dépôt dans le market est une VENTE : mise de départ, prix d'achat
--     immédiat facultatif, durée 1 / 3 / 7 jours ;
--   • enchérir bloque les billets (débit) ; être surenchéri les rend ;
--   • à l'expiration (ou à l'achat immédiat) le vendeur touche le prix
--     moins la commission de la banque (5 %) → banque.tresor ;
--   • toute écriture d'argent passe par des fonctions SECURITY DEFINER,
--     jamais par une écriture directe des clients (voir les triggers garde-fous).
-- ══════════════════════════════════════════════════════════════════

-- ─────────────────────────── 1. Colonnes ───────────────────────────
alter table profiles add column if not exists solde integer not null default 0;
alter table profiles add column if not exists role  text    not null default 'joueur';   -- joueur | banquier

alter table objets add column if not exists mise_depart        integer;      -- null = ancien objet (troc par messages)
alter table objets add column if not exists prix_achat         integer;      -- achat immédiat, facultatif
alter table objets add column if not exists duree_jours        integer;      -- 1 | 3 | 7
alter table objets add column if not exists expire_at          timestamptz;
alter table objets add column if not exists enchere_courante   integer;
alter table objets add column if not exists encherisseur_id    uuid references auth.users(id) on delete set null;
alter table objets add column if not exists encherisseur_pseudo text;
alter table objets add column if not exists nb_encheres        integer not null default 0;
alter table objets add column if not exists vendu_a            uuid references auth.users(id) on delete set null;
alter table objets add column if not exists vendu_a_pseudo     text;
alter table objets add column if not exists prix_final         integer;
alter table objets add column if not exists vendu_at           timestamptz;
-- statut : disponible (en vente) | réservé | échangé (vendu) | expiré | retiré

-- ─────────────────────────── 2. Tables ───────────────────────────
create table if not exists banque (
  id             int primary key default 1 check (id = 1),
  tresor         integer not null default 0,     -- commissions encaissées
  commission_pct integer not null default 5,
  increment_min  integer not null default 5,     -- surenchère minimale
  updated_at     timestamptz default now()
);
insert into banque (id) values (1) on conflict (id) do nothing;

create table if not exists billets_emis (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  pseudo     text,
  valeur     integer not null check (valeur in (5, 10, 20, 50, 100, 200, 500)),
  image_path text not null,
  statut     text not null default 'valide',     -- valide | annule
  annule_par uuid references auth.users(id) on delete set null,
  annule_at  timestamptz,
  motif      text,
  created_at timestamptz default now()
);

create table if not exists encheres (
  id         uuid primary key default gen_random_uuid(),
  objet_id   uuid not null references objets(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  pseudo     text,
  montant    integer not null,
  statut     text not null default 'active',     -- active | surencherie | gagnante | achat | rendue
  created_at timestamptz default now()
);
create index if not exists encheres_objet_idx on encheres (objet_id, created_at desc);
create index if not exists encheres_user_idx  on encheres (user_id, created_at desc);

create table if not exists transactions (                 -- grand livre
  id         bigint generated always as identity primary key,
  user_id    uuid references auth.users(id) on delete set null,   -- null = la banque elle-même
  montant    integer not null,                            -- + crédit / − débit
  type       text not null,   -- emission | annulation | enchere | remboursement | achat | vente | commission
  objet_id   uuid references objets(id) on delete set null,
  billet_id  uuid references billets_emis(id) on delete set null,
  libelle    text,
  created_at timestamptz default now()
);
create index if not exists transactions_user_idx on transactions (user_id, created_at desc);

-- ─────────────────────────── 3. RLS ───────────────────────────
alter table banque       enable row level security;
alter table billets_emis enable row level security;
alter table encheres     enable row level security;
alter table transactions enable row level security;

drop policy if exists "banque_read"       on banque;       create policy "banque_read"       on banque       for select using (true);
drop policy if exists "billets_read"      on billets_emis; create policy "billets_read"      on billets_emis for select using (true);
drop policy if exists "encheres_read"     on encheres;     create policy "encheres_read"     on encheres     for select using (true);
drop policy if exists "transactions_read" on transactions; create policy "transactions_read" on transactions
  for select using (auth.uid() = user_id or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'banquier'));
-- Aucune policy insert/update/delete : les écritures passent uniquement par les fonctions ci-dessous.

-- ─────────────────────────── 4. Garde-fous ───────────────────────────
-- Les fonctions internes posent bf.interne = '1' ; en dehors, les colonnes
-- d'argent / d'enchères ne sont pas modifiables par les clients.
create or replace function bf_est_interne() returns boolean language sql stable as $$
  select coalesce(current_setting('bf.interne', true), '') = '1'
$$;

create or replace function bf_garde_profiles() returns trigger language plpgsql as $$
begin
  if not bf_est_interne() then
    if new.solde is distinct from old.solde then raise exception 'Le solde ne se modifie pas directement.'; end if;
    if new.role  is distinct from old.role  then raise exception 'Le rôle ne se modifie pas directement.'; end if;
  end if;
  return new;
end $$;
drop trigger if exists profiles_garde on profiles;
create trigger profiles_garde before update on profiles for each row execute function bf_garde_profiles();

create or replace function bf_garde_objets() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
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
drop trigger if exists objets_garde on objets;
create trigger objets_garde before insert or update on objets for each row execute function bf_garde_objets();

-- Un objet en vente avec enchères, ou déjà vendu aux enchères, ne se supprime pas (trace de la transaction)
create or replace function bf_garde_objets_delete() returns trigger language plpgsql as $$
begin
  if not bf_est_interne() and old.mise_depart is not null then
    if old.statut = 'disponible' and old.nb_encheres > 0 then raise exception 'Impossible de supprimer une vente qui a déjà des enchères.'; end if;
    if old.prix_final is not null then raise exception 'Une vente conclue reste dans le registre de la banque.'; end if;
  end if;
  return old;
end $$;
drop trigger if exists objets_garde_delete on objets;
create trigger objets_garde_delete before delete on objets for each row execute function bf_garde_objets_delete();

-- ─────────────────────────── 5. Fonctions internes ───────────────────────────
create or replace function bf_pseudo(p uuid) returns text language sql stable security definer as $$
  select pseudo from profiles where id = p
$$;

-- Crédite / débite un compte (interne)
create or replace function bf_mouvement(p_user uuid, p_montant int, p_type text, p_objet uuid, p_billet uuid, p_libelle text)
returns void language plpgsql security definer as $$
begin
  perform set_config('bf.interne', '1', true);
  if p_user is null then
    update banque set tresor = tresor + p_montant, updated_at = now() where id = 1;
  else
    update profiles set solde = solde + p_montant where id = p_user;
    if not found then raise exception 'Profil introuvable.'; end if;
  end if;
  insert into transactions (user_id, montant, type, objet_id, billet_id, libelle)
  values (p_user, p_montant, p_type, p_objet, p_billet, p_libelle);
end $$;
revoke all on function bf_mouvement(uuid, int, text, uuid, uuid, text) from public, anon, authenticated;

-- Clôture une vente au profit d'un acheteur (interne)
create or replace function bf_finaliser_vente(p_objet uuid, p_acheteur uuid, p_prix int, p_mode text)
returns void language plpgsql security definer as $$
declare o objets%rowtype; c int; comm int;
begin
  perform set_config('bf.interne', '1', true);
  select * into o from objets where id = p_objet for update;
  select commission_pct into c from banque where id = 1;
  comm := floor(p_prix * c / 100.0);
  -- Le vendeur touche le prix moins la commission
  if o.user_id is not null then
    perform bf_mouvement(o.user_id, p_prix - comm, 'vente', p_objet, null, format('Vente « %s » (%s)', o.titre, p_mode));
  end if;
  perform bf_mouvement(null, comm, 'commission', p_objet, null, format('Commission %s %% sur « %s »', c, o.titre));
  update objets set statut = 'échangé', vendu_a = p_acheteur, vendu_a_pseudo = bf_pseudo(p_acheteur),
                    prix_final = p_prix, vendu_at = now(), enchere_courante = p_prix,
                    encherisseur_id = p_acheteur, encherisseur_pseudo = bf_pseudo(p_acheteur)
  where id = p_objet;
  update encheres set statut = 'gagnante' where objet_id = p_objet and user_id = p_acheteur and statut = 'active';
end $$;
revoke all on function bf_finaliser_vente(uuid, uuid, int, text) from public, anon, authenticated;

-- ─────────────────────────── 6. Fonctions exposées (RPC) ───────────────────────────

-- Émettre un billet : photo du billet fabriqué + dénomination → crédit immédiat
create or replace function emettre_billet(p_valeur int, p_image_path text)
returns json language plpgsql security definer as $$
declare u uuid := auth.uid(); b uuid; s int;
begin
  if u is null then raise exception 'Connectez-vous pour émettre un billet.'; end if;
  if p_valeur not in (5, 10, 20, 50, 100, 200, 500) then raise exception 'Dénomination invalide.'; end if;
  if p_image_path is null or length(p_image_path) < 3 then raise exception 'Image du billet requise.'; end if;
  perform set_config('bf.interne', '1', true);
  insert into billets_emis (user_id, pseudo, valeur, image_path) values (u, bf_pseudo(u), p_valeur, p_image_path) returning id into b;
  perform bf_mouvement(u, p_valeur, 'emission', null, b, format('Émission d''un billet de %s', p_valeur));
  select solde into s from profiles where id = u;
  return json_build_object('billet_id', b, 'solde', s);
end $$;

-- Annuler un billet (banquier uniquement) : le compte est débité
create or replace function annuler_billet(p_billet uuid, p_motif text default null)
returns json language plpgsql security definer as $$
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
  perform bf_mouvement(b.user_id, -b.valeur, 'annulation', null, p_billet, coalesce('Billet annulé : ' || p_motif, 'Billet annulé'));
  select solde into s from profiles where id = b.user_id;
  return json_build_object('ok', true, 'solde', s);
end $$;

-- Résout les ventes expirées (idempotent, appelable par tout le monde)
create or replace function resoudre_ventes_expirees()
returns int language plpgsql security definer as $$
declare o record; n int := 0;
begin
  perform set_config('bf.interne', '1', true);
  for o in select id, encherisseur_id, enchere_courante from objets
           where mise_depart is not null and statut = 'disponible' and expire_at <= now()
           for update skip locked
  loop
    if o.encherisseur_id is not null then
      perform bf_finaliser_vente(o.id, o.encherisseur_id, o.enchere_courante, 'enchère');
    else
      update objets set statut = 'expiré' where id = o.id;
    end if;
    n := n + 1;
  end loop;
  return n;
end $$;

-- Enchérir
create or replace function placer_enchere(p_objet uuid, p_montant int)
returns json language plpgsql security definer as $$
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
  -- Achat immédiat si on atteint le prix
  if o.prix_achat is not null and p_montant >= o.prix_achat then
    return acheter_immediat(p_objet);
  end if;
  select solde into s from profiles where id = u for update;
  precedent := o.encherisseur_id; precedent_montant := o.enchere_courante;
  -- Si je surenchéris sur moi-même, mon ancienne mise revient d'abord
  if precedent = u then s := s + precedent_montant; end if;
  if s < p_montant then raise exception 'Solde insuffisant (% billets disponibles).', s; end if;
  perform set_config('bf.interne', '1', true);
  if precedent is not null then
    perform bf_mouvement(precedent, precedent_montant, 'remboursement', p_objet, null, format('Surenchéri sur « %s »', o.titre));
    update encheres set statut = 'surencherie' where objet_id = p_objet and user_id = precedent and statut = 'active';
  end if;
  perform bf_mouvement(u, -p_montant, 'enchere', p_objet, null, format('Enchère sur « %s »', o.titre));
  insert into encheres (objet_id, user_id, pseudo, montant) values (p_objet, u, bf_pseudo(u), p_montant);
  update objets set enchere_courante = p_montant, encherisseur_id = u, encherisseur_pseudo = bf_pseudo(u),
                    nb_encheres = nb_encheres + 1,
                    -- anti-sniping : une enchère dans les 10 dernières minutes prolonge de 10 minutes
                    expire_at = greatest(expire_at, now() + interval '10 minutes')
  where id = p_objet;
  select solde into s from profiles where id = u;
  return json_build_object('ok', true, 'mode', 'enchere', 'montant', p_montant, 'solde', s);
end $$;

-- Achat immédiat
create or replace function acheter_immediat(p_objet uuid)
returns json language plpgsql security definer as $$
declare u uuid := auth.uid(); o objets%rowtype; s int; credit int := 0;
begin
  if u is null then raise exception 'Connectez-vous pour acheter.'; end if;
  perform resoudre_ventes_expirees();
  select * into o from objets where id = p_objet for update;
  if not found then raise exception 'Objet introuvable.'; end if;
  if o.mise_depart is null or o.prix_achat is null then raise exception 'Pas d''achat immédiat sur cet objet.'; end if;
  if o.statut <> 'disponible' or o.expire_at <= now() then raise exception 'Cette vente est terminée.'; end if;
  if o.user_id = u then raise exception 'On n''achète pas son propre dépôt.'; end if;
  select solde into s from profiles where id = u for update;
  if o.encherisseur_id = u then credit := o.enchere_courante; end if;   -- ma mise en cours est déjà bloquée
  if s + credit < o.prix_achat then raise exception 'Solde insuffisant (% billets disponibles).', s + credit; end if;
  perform set_config('bf.interne', '1', true);
  if o.encherisseur_id is not null then
    perform bf_mouvement(o.encherisseur_id, o.enchere_courante, 'remboursement', p_objet, null, format('Vente conclue par achat immédiat : « %s »', o.titre));
    update encheres set statut = case when user_id = u then 'rendue' else 'surencherie' end
      where objet_id = p_objet and statut = 'active';
  end if;
  perform bf_mouvement(u, -o.prix_achat, 'achat', p_objet, null, format('Achat immédiat « %s »', o.titre));
  insert into encheres (objet_id, user_id, pseudo, montant, statut) values (p_objet, u, bf_pseudo(u), o.prix_achat, 'active');
  update objets set nb_encheres = nb_encheres + 1 where id = p_objet;
  perform bf_finaliser_vente(p_objet, u, o.prix_achat, 'achat immédiat');
  select solde into s from profiles where id = u;
  return json_build_object('ok', true, 'mode', 'achat', 'montant', o.prix_achat, 'solde', s);
end $$;

-- Retirer sa vente (seulement sans enchère)
create or replace function retirer_vente(p_objet uuid)
returns json language plpgsql security definer as $$
declare u uuid := auth.uid(); o objets%rowtype;
begin
  if u is null then raise exception 'Connectez-vous.'; end if;
  select * into o from objets where id = p_objet for update;
  if not found or o.user_id <> u then raise exception 'Ce dépôt n''est pas le vôtre.'; end if;
  if o.statut <> 'disponible' then raise exception 'Cette vente n''est plus en cours.'; end if;
  if o.nb_encheres > 0 then raise exception 'Impossible de retirer une vente qui a des enchères.'; end if;
  perform set_config('bf.interne', '1', true);
  update objets set statut = 'retiré' where id = p_objet;
  return json_build_object('ok', true);
end $$;

-- Remettre en vente un dépôt expiré / retiré (nouvelle durée)
create or replace function remettre_en_vente(p_objet uuid, p_mise int, p_prix_achat int, p_duree int)
returns json language plpgsql security definer as $$
declare u uuid := auth.uid(); o objets%rowtype;
begin
  if u is null then raise exception 'Connectez-vous.'; end if;
  select * into o from objets where id = p_objet for update;
  if not found or o.user_id <> u then raise exception 'Ce dépôt n''est pas le vôtre.'; end if;
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

-- Chiffres publics pour l'accueil
create or replace function stats_banque()
returns json language sql stable security definer as $$
  select json_build_object(
    'tresor',            (select tresor from banque where id = 1),
    'commission_pct',    (select commission_pct from banque where id = 1),
    'en_circulation',    (select coalesce(sum(solde), 0) from profiles),
    'billets_emis',      (select count(*) from billets_emis where statut = 'valide'),
    'ventes_en_cours',   (select count(*) from objets where mise_depart is not null and statut = 'disponible' and expire_at > now()),
    'ventes_conclues',   (select count(*) from objets where mise_depart is not null and statut = 'échangé'),
    'volume_echange',    (select coalesce(sum(prix_final), 0) from objets where prix_final is not null)
  )
$$;

grant execute on function emettre_billet(int, text), annuler_billet(uuid, text), resoudre_ventes_expirees(),
  placer_enchere(uuid, int), acheter_immediat(uuid), retirer_vente(uuid), remettre_en_vente(uuid, int, int, int)
  to authenticated;
grant execute on function stats_banque(), resoudre_ventes_expirees() to anon, authenticated;

-- ─────────────────────────── 7. Banquier ───────────────────────────
-- À faire UNE fois, à la main, pour désigner le compte de Jiiji (remplacer le pseudo) :
--   begin;
--   select set_config('bf.interne', '1', true);
--   update profiles set role = 'banquier' where pseudo = 'jiiji';
--   commit;
-- (le tout dans la même exécution du SQL Editor : le garde-fou n'est levé que le temps de la transaction)

-- ─────────────────────────── 8. Résolution automatique (facultatif) ───────────────────────────
-- L'appli appelle resoudre_ventes_expirees() à chaque ouverture du market.
-- Pour que les ventes se clôturent même sans visiteur, activer l'extension pg_cron
-- (Database → Extensions) puis :
--   select cron.schedule('bf-resoudre-ventes', '*/10 * * * *', $$select resoudre_ventes_expirees()$$);

-- ─────────────────────────── 9. Temps réel ───────────────────────────
-- Le solde dans la barre de navigation et les fiches ouvertes se mettent à jour en direct.
do $$
begin
  begin alter publication supabase_realtime add table profiles; exception when duplicate_object or undefined_object then null; end;
  begin alter publication supabase_realtime add table objets;   exception when duplicate_object or undefined_object then null; end;
end $$;

-- ═══════════════════════════════════════════════════════════════════
-- 10. Les billets sont des œuvres : cartel (titre, artiste, technique, devise)
--     + journal public de la banque + cours des devises
-- ═══════════════════════════════════════════════════════════════════
alter table billets_emis add column if not exists titre       text;
alter table billets_emis add column if not exists artiste     text;   -- prénom / pseudonyme affiché (défaut : pseudo du compte)
alter table billets_emis add column if not exists technique   text;   -- aquarelle, feutre, linogravure, collage…
alter table billets_emis add column if not exists devise      text;   -- nom de la monnaie inventée (ex. « le Phantom »)
alter table billets_emis add column if not exists description text;

-- Nouvelle signature d'emettre_billet (remplace celle à 2 arguments, sinon PostgREST hésite entre les deux)
drop function if exists emettre_billet(int, text);
create or replace function emettre_billet(p_valeur int, p_image_path text, p_titre text default null, p_artiste text default null,
                                          p_technique text default null, p_devise text default null, p_description text default null)
returns json language plpgsql security definer as $$
declare u uuid := auth.uid(); b uuid; s int;
begin
  if u is null then raise exception 'Connectez-vous pour émettre un billet.'; end if;
  if p_valeur not in (5, 10, 20, 50, 100, 200, 500) then raise exception 'Dénomination invalide.'; end if;
  if p_image_path is null or length(p_image_path) < 3 then raise exception 'Image du billet requise.'; end if;
  perform set_config('bf.interne', '1', true);
  insert into billets_emis (user_id, pseudo, valeur, image_path, titre, artiste, technique, devise, description)
  values (u, bf_pseudo(u), p_valeur, p_image_path,
          nullif(left(trim(p_titre), 120), ''), coalesce(nullif(left(trim(p_artiste), 60), ''), bf_pseudo(u)),
          nullif(left(trim(p_technique), 80), ''), nullif(left(trim(p_devise), 40), ''), nullif(left(trim(p_description), 600), ''))
  returning id into b;
  perform bf_mouvement(u, p_valeur, 'emission', null, b,
    format('Émission d''un billet de %s%s', p_valeur, coalesce(' — « ' || nullif(trim(p_titre), '') || ' »', '')));
  select solde into s from profiles where id = u;
  return json_build_object('billet_id', b, 'solde', s);
end $$;
grant execute on function emettre_billet(int, text, text, text, text, text, text) to authenticated;

-- Journal public de la banque : ce qui vient de se passer (émissions, enchères, adjudications, dépôts)
create or replace function journal_banque(p_limit int default 20)
returns table (quand timestamptz, type text, pseudo text, montant int, objet_id uuid, objet_titre text, billet_id uuid, devise text, billet_titre text)
language sql stable security definer as $$
  (select b.created_at, 'emission', coalesce(b.artiste, b.pseudo), b.valeur, null::uuid, null::text, b.id, b.devise, b.titre
     from billets_emis b where b.statut = 'valide')
  union all
  (select e.created_at, case when e.statut in ('gagnante') and o.prix_final = e.montant and o.prix_achat = e.montant then 'achat' else 'enchere' end,
          e.pseudo, e.montant, o.id, o.titre, null, null, null
     from encheres e join objets o on o.id = e.objet_id)
  union all
  (select o.vendu_at, 'adjuge', o.vendu_a_pseudo, o.prix_final, o.id, o.titre, null, null, null
     from objets o where o.vendu_at is not null)
  union all
  (select o.created_at, 'depot', o.pseudo, o.mise_depart, o.id, o.titre, null, null, null
     from objets o where o.mise_depart is not null)
  order by 1 desc
  limit greatest(1, least(p_limit, 100))
$$;
grant execute on function journal_banque(int) to anon, authenticated;

-- Cours des devises : chaque monnaie inventée, sa masse émise et ses émetteurs
create or replace function cours_devises()
returns table (devise text, billets bigint, masse bigint, emetteurs bigint, derniere_emission timestamptz)
language sql stable security definer as $$
  select coalesce(nullif(trim(devise), ''), 'billets sans nom') as devise, count(*), sum(valeur), count(distinct user_id), max(created_at)
  from billets_emis where statut = 'valide'
  group by 1 order by 3 desc, 2 desc
$$;
grant execute on function cours_devises() to anon, authenticated;

-- Les billets émis en direct dans le journal / le ticker
do $$
begin
  begin alter publication supabase_realtime add table billets_emis; exception when duplicate_object or undefined_object then null; end;
  begin alter publication supabase_realtime add table encheres;     exception when duplicate_object or undefined_object then null; end;
end $$;
