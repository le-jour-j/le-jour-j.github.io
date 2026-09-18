import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

// ─────────────────────────────────────────────────────────────────────────────
// Le catalogue : tous les livres déposés et les lieux qui les vendent.
// Consultable sans compte.
//
// Avec Supabase : lecture de la vue `catalogue`, qui ne contient que les dépôts
// effectifs de livres visibles (voir migration_v13_catalogue.sql). Les refus et
// les notes de passage ne sortent jamais de cette vue.
//
// Sans compte / sans Supabase : le catalogue est dérivé des livres et passages
// gardés dans le navigateur, avec exactement la même règle — dernier passage du
// couple livre × lieu, et seulement s'il vaut « déposé ».
// ─────────────────────────────────────────────────────────────────────────────

function derniersDepotsLocaux(books, checkins) {
  const dernier = {};
  for (const c of checkins) {
    const key = c.book_id + "|" + c.place_id;
    const vu = dernier[key];
    if (!vu || new Date(c.created_at) > new Date(vu.created_at)) dernier[key] = c;
  }
  const parId = Object.fromEntries(books.map((b) => [b.id, b]));
  return Object.values(dernier)
    .filter((c) => c.status === "deposited" && parId[c.book_id] && parId[c.book_id].visible !== false)
    .map((c) => {
      const b = parId[c.book_id];
      return {
        book_id: b.id,
        book_title: b.title,
        book_description: b.description ?? null,
        book_author: b.author ?? null,
        book_year: b.year ?? null,
        book_price_cents: b.price_cents ?? null,
        book_url: b.url ?? null,
        book_created_at: b.created_at,
        owner_pseudo: null,
        place_id: c.place_id,
        deposited_at: c.created_at,
        local: true, // dépôt gardé dans ce navigateur, pas encore publié
      };
    });
}

export function useCatalogue(tour, user) {
  const [rows, setRows] = useState([]);
  const [state, setState] = useState(supabase ? "loading" : "local");

  const load = useCallback(async () => {
    if (!supabase) return;
    setState("loading");
    const { data, error } = await supabase
      .from("catalogue")
      .select("book_id, book_title, book_description, book_author, book_year, book_price_cents, book_url, book_created_at, owner_pseudo, place_id, deposited_at")
      .order("deposited_at", { ascending: false });
    if (error) {
      console.warn("Impossible de charger le catalogue", error);
      setState("error");
      return;
    }
    setRows(data ?? []);
    setState("ready");
  }, []);

  useEffect(() => {
    if (supabase) load();
  }, [load]);

  // Les dépôts gardés dans ce navigateur s'ajoutent au catalogue : sinon
  // quelqu'un qui note ses dépôts sans compte ne verrait pas son propre livre.
  // UNIQUEMENT hors connexion : une fois connecté, tour.books et tour.checkins
  // contiennent les données du compte, qui sont déjà dans la vue — les ajouter
  // compterait chaque dépôt deux fois.
  const localRows = useMemo(
    () => (tour.isRemote ? [] : derniersDepotsLocaux(tour.books, tour.checkins)),
    [tour.isRemote, tour.books, tour.checkins]
  );

  useEffect(() => {
    if (supabase && tour.syncStatus === "synced") load();
  }, [tour.syncStatus, tour.checkins.length, load]);

  const all = useMemo(() => [...rows, ...localRows], [rows, localRows]);

  // Un livre, ses points de vente.
  const books = useMemo(() => {
    const map = new Map();
    for (const r of all) {
      let b = map.get(r.book_id);
      if (!b) {
        b = {
          id: r.book_id,
          title: r.book_title,
          description: r.book_description,
          author: r.book_author,
          year: r.book_year,
          priceCents: r.book_price_cents,
          url: r.book_url,
          pseudo: r.owner_pseudo,
          createdAt: r.book_created_at,
          places: [],
        };
        map.set(r.book_id, b);
      }
      b.places.push({ placeId: r.place_id, at: r.deposited_at });
      if (r.local) b.local = true;
    }
    const list = [...map.values()];
    for (const b of list) b.places.sort((x, y) => new Date(y.at) - new Date(x.at));
    list.sort((a, b) => b.places.length - a.places.length || a.title.localeCompare(b.title, "fr"));
    return list;
  }, [all]);

  // Un lieu, les livres qu'on y trouve.
  const byPlace = useMemo(() => {
    const map = {};
    for (const r of all) (map[r.place_id] ||= []).push(r);
    return map;
  }, [all]);

  return { state, rows: all, books, byPlace, refresh: load };
}
