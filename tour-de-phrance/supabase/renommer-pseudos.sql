-- Renommer les pseudos publics des comptes existants.
-- À exécuter dans Supabase → SQL Editor. Le SQL Editor a les droits nécessaires ;
-- depuis l'application, chacun ne peut changer que son propre pseudo.
--
-- Pourquoi : le pseudo paraît au catalogue à côté des livres. Les deux comptes
-- créés en avril 2026 s'appellent « toutou » et « boobs ».

-- 1. Voir ce qu'il y a, et à quoi ça correspond
select
  p.id,
  p.pseudo,
  p.created_at,
  (select count(*) from public.books b where b.owner_id = p.id)    as livres,
  (select count(*) from public.checkins c where c.user_id = p.id)  as passages,
  (select count(*) from public.comments m where m.author_id = p.id) as commentaires
from public.profiles p
order by p.created_at;

-- 2. Renommer. Remplace les valeurs à droite du signe =, puis exécute.
--    (Le compte « toutou » est celui qui porte la tournée n°1.)
update public.profiles set pseudo = 'Jeanson Péchin' where pseudo = 'toutou';
update public.profiles set pseudo = 'Jeanson'        where pseudo = 'boobs';

-- 3. Vérifier
select id, pseudo from public.profiles order by created_at;

-- Note : le pseudo n'est qu'un nom d'affichage. L'adresse email de connexion,
-- elle, ne se change pas ici — elle se change depuis le compte, avec une
-- confirmation par mail.
