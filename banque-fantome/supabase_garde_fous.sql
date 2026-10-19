-- ══════════════════════════════════════════════════════════════════
-- BANQUE FANTÔME : garde-fous issus de l'audit du 2026-10-19
-- À jouer APRÈS supabase_market_papier.sql. ADDITIF et rejouable.
--
-- L'audit (lecture seule, 2026-10-19 vers 10 h) a trouvé l'argent sain
-- (soldes = grand livre) mais des portes ouvertes autour :
--   1. le hash du code de récupération lisible par tout le monde ;
--   2. un objet du market « gagné » par un compte jetable restait bloqué ;
--   3. pseudos ni uniques ni imposés (se renommer « bobi ») ;
--   4. bucket d'images sans limite, et un auteur pouvait effacer l'image
--      d'un billet déjà encaissé ou vendu ;
--   5. plafonds de l'atelier contournables par appels simultanés ;
--   6. messages réécrits par leur destinataire, abonnement à la lettre
--      détourné, objet modifié après les premières enchères ;
--   7. droits à nettoyer, clôture des ventes sans visite, badge des messages.
-- ══════════════════════════════════════════════════════════════════

-- ─────────────────────────── 1. Le hash du code de récupération ───────────────────────────
-- Le front ne lit que id, pseudo, solde, role, created_at. La fonction reset-password
-- passe par service_role et garde l'accès au hash. L'inscription écrit encore le hash
-- (upsert), elle n'a pas besoin de le relire.
revoke select on public.profiles from anon, authenticated;
grant select (id, pseudo, solde, role, created_at) on public.profiles to anon, authenticated;
revoke insert, update on public.profiles from anon;

-- ─────────────────────────── 2. Défaire une adjudication papier ───────────────────────────
-- Au market rien n'est débité : un compte peut cliquer « je le prends » sans jamais venir.
-- Le vendeur (ou le banquier) défait alors la vente, l'objet repasse en « retiré » et peut
-- être remis en vente. Jamais pour la bourse, où l'argent a déjà bougé.
create or replace function annuler_adjudication_papier(p_objet uuid)
returns json language plpgsql security definer set search_path = public as $$
declare o objets%rowtype;
begin
  if auth.uid() is null then raise exception 'Connectez-vous.'; end if;
  select * into o from objets where id = p_objet for update;
  if not found then raise exception 'Vente introuvable.'; end if;
  if o.dessin_id is not null then raise exception 'Une vente de la bourse ne s''annule pas : le billet est payé.'; end if;
  if o.user_id is distinct from auth.uid() and not bf_est_banquier() then raise exception 'Réservé au vendeur ou au banquier.'; end if;
  if o.statut <> 'échangé' then raise exception 'Cette vente n''est pas adjugée.'; end if;
  perform set_config('bf.interne', '1', true);
  update encheres set statut = 'rendue' where objet_id = p_objet and statut in ('active', 'gagnante');
  update objets set statut = 'retiré', vendu_a = null, vendu_a_pseudo = null, prix_final = null, vendu_at = null,
                    enchere_courante = null, encherisseur_id = null, encherisseur_pseudo = null, nb_encheres = 0
   where id = p_objet;
  return json_build_object('ok', true);
end $$;
revoke all on function annuler_adjudication_papier(uuid) from public, anon;
grant execute on function annuler_adjudication_papier(uuid) to authenticated;

-- ─────────────────────────── 3. Pseudos ───────────────────────────
-- Uniques sans tenir compte de la casse (vérifié avant : aucun doublon), et imposés
-- par la base sur les dépôts et les messages au lieu d'être fournis par le navigateur.
create unique index if not exists profiles_pseudo_unique on profiles (lower(pseudo));

create or replace function bf_pseudo_impose() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;
  if tg_table_name = 'objets' and not bf_est_interne() then new.pseudo := bf_pseudo(auth.uid()); end if;
  if tg_table_name = 'messages' then new.expediteur_pseudo := bf_pseudo(auth.uid()); end if;
  return new;
end $$;
drop trigger if exists objets_pseudo on objets;
create trigger objets_pseudo before insert on objets for each row execute function bf_pseudo_impose();
drop trigger if exists messages_pseudo on messages;
create trigger messages_pseudo before insert on messages for each row execute function bf_pseudo_impose();

-- ─────────────────────────── 4. Images ───────────────────────────
-- Deposer.jsx refuse déjà au-delà de 5 Mo ; l'atelier envoie du webp ou du png.
update storage.buckets set file_size_limit = 8388608,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
 where id = 'objets';
drop policy if exists storage_insert on storage.objects;
create policy storage_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'objets' and (name not like 'dessins/%' or name like 'dessins/' || auth.uid()::text || '/%'));
-- L'image d'un billet dessiné appartient au registre : ni l'auteur ni l'acheteur ne l'effacent.
drop policy if exists storage_delete on storage.objects;
create policy storage_delete on storage.objects for delete to authenticated
  using (bucket_id = 'objets' and owner = auth.uid() and name not like 'dessins/%');

-- ─────────────────────────── 5. Plafonds de l'atelier ───────────────────────────
-- deposer_dessin (30 par jour) et encaisser_dessin (3 par jour) comptent sans verrou :
-- des appels simultanés passaient tous. Ce garde verrouille le profil puis recompte ;
-- le second appel attend le premier et voit sa ligne.
create or replace function bf_garde_plafonds() returns trigger
language plpgsql security definer set search_path = public as $$
declare plafond int; jour int;
begin
  if tg_table_name = 'dessins' then
    if new.auteur_id is null then return new; end if;
    perform 1 from profiles where id = new.auteur_id for update;
    select count(*) into jour from dessins where auteur_id = new.auteur_id and created_at > now() - interval '1 day';
    if jour >= 30 then raise exception 'Trente billets en un jour : l''atelier ferme jusqu''à demain.'; end if;
  else
    if new.dessin_id is null or new.user_id is null then return new; end if;
    perform 1 from profiles where id = new.user_id for update;
    select plafond_encaissement_jour into plafond from banque where id = 1;
    select count(*) into jour from billets_emis where user_id = new.user_id and created_at > now() - interval '1 day';
    if jour >= plafond then raise exception 'La banque encaisse % billets par jour et par compte. Revenez demain.', plafond; end if;
  end if;
  return new;
end $$;
drop trigger if exists dessins_plafond on dessins;
create trigger dessins_plafond before insert on dessins for each row execute function bf_garde_plafonds();
drop trigger if exists billets_emis_plafond on billets_emis;
create trigger billets_emis_plafond before insert on billets_emis for each row execute function bf_garde_plafonds();

-- ─────────────────────────── 6. Messages, lettre, objets en cours de vente ───────────────────────────
-- Le destinataire marque lu, rien d'autre (Messages.jsx ne met à jour que lu).
revoke update on public.messages from anon, authenticated;
grant update (lu) on public.messages to authenticated;
revoke insert on public.messages from anon;

-- Un membre gère sa propre inscription, sans se faire passer pour un partenaire.
drop policy if exists lettre_abonnes_modif on lettre_abonnes;
create policy lettre_abonnes_modif on lettre_abonnes for update to authenticated
  using ((user_id = auth.uid()) or bf_est_banquier())
  with check ((user_id = auth.uid() and source = 'membre') or bf_est_banquier());

-- Reprise de bf_garde_objets (supabase_market_papier.sql) : en plus, une vente qui a
-- reçu des enchères ne change plus de titre, de description ni d'images.
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
    if old.statut = 'disponible' and old.nb_encheres > 0
       and (new.titre is distinct from old.titre or new.description is distinct from old.description
            or new.image_path is distinct from old.image_path or new.image_paths is distinct from old.image_paths
            or new.pseudo is distinct from old.pseudo) then
      raise exception 'Cette vente a déjà des enchères : sa fiche ne se modifie plus.';
    end if;
  end if;
  return new;
end $$;

-- ─────────────────────────── 7. Droits, clôture, temps réel ───────────────────────────
-- Ces RPC exigent un compte (elles refusaient déjà sans auth.uid()) : on ferme la porte à anon.
revoke execute on function acheter_immediat(uuid) from public, anon;
revoke execute on function placer_enchere(uuid, int) from public, anon;
revoke execute on function remettre_en_vente(uuid, int, int, int) from public, anon;
revoke execute on function retirer_vente(uuid) from public, anon;
revoke execute on function annuler_billet(uuid, text) from public, anon;
grant execute on function acheter_immediat(uuid), placer_enchere(uuid, int), remettre_en_vente(uuid, int, int, int),
  retirer_vente(uuid), annuler_billet(uuid, text) to authenticated;

-- Fonctions security definer sans search_path fixé.
alter function bf_mouvement(uuid, int, text, uuid, uuid, text) set search_path = public;
alter function bf_pseudo(uuid) set search_path = public;
alter function retirer_vente(uuid) set search_path = public;
alter function resoudre_ventes_expirees() set search_path = public;
alter function journal_banque(int) set search_path = public;
alter function cours_devises() set search_path = public;
alter function emettre_billet(int, text, text, text, text, text, text) set search_path = public;

-- Les ventes échues se règlent toutes les 10 minutes, même sans visite.
do $$ begin
  perform cron.unschedule('bf-resoudre-ventes');
exception when others then null; end $$;
do $$ begin
  perform cron.schedule('bf-resoudre-ventes', '*/10 * * * *', 'select resoudre_ventes_expirees()');
exception when undefined_function or invalid_schema_name then null; end $$;

-- Le badge des messages non lus (Navbar.jsx) écoute messages en temps réel.
do $$ begin
  alter publication supabase_realtime add table messages;
exception when duplicate_object or undefined_object then null; end $$;
