import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { DEFAULT_BOOK_TITLE, STATUS_BY_ID } from "../lib/statuses.js";

// ─────────────────────────────────────────────────────────────────────────────
// Modèle v11 : un compte possède des LIVRES ; un PASSAGE relie un livre à un
// lieu avec un résultat (déposé, refusé, …) et une date. L'historique est
// conservé : le dernier passage donne l'état courant du couple livre × lieu.
//
// Sans compte : tout vit dans localStorage (clé v11). À la connexion, les
// données locales sont fusionnées dans le compte puis effacées du navigateur.
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "tourdePhrance_v11";
const ACTIVE_KEY = "tourdePhrance_v11_activeBook"; // livre suivi, mémorisé entre deux visites
const MERGE_LOCK_KEY = "tourdePhrance_v11_merging";
const LEGACY_BOOLEAN_KEYS = ["tourdePhrance_v8_visited", "tourdePhrance_v6_visited", "tourdePhrance_v2_visited"];

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "local-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

function emptyStore() {
  return { books: [], checkins: [], activeBookId: null };
}

// Lit le store local v11 ; s'il n'existe pas, convertit les anciennes coches
// booléennes (v2/v6/v8) en passages « Passé, sans précision » sur un livre
// par défaut. Rien n'est perdu.
function readLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...emptyStore(), ...parsed };
    }
    for (const key of LEGACY_BOOLEAN_KEYS) {
      const legacy = localStorage.getItem(key);
      if (!legacy) continue;
      const map = JSON.parse(legacy);
      const ids = Object.keys(map).filter((k) => map[k]);
      if (ids.length === 0) continue;
      const book = { id: uid(), title: DEFAULT_BOOK_TITLE, created_at: new Date().toISOString() };
      const checkins = ids.map((placeId) => ({
        id: uid(),
        book_id: book.id,
        place_id: placeId,
        status: "visited",
        note: "",
        created_at: new Date().toISOString(),
      }));
      const store = { books: [book], checkins, activeBookId: book.id };
      writeLocal(store);
      return store;
    }
  } catch {
    // localStorage illisible : on repart de zéro, sans planter.
  }
  return emptyStore();
}

function writeLocal(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // navigation privée, quota… on ignore.
  }
}

function clearLocal() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    for (const key of LEGACY_BOOLEAN_KEYS) localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function sortByDate(list) {
  return [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export function useTour(user) {
  const userId = user?.id ?? null;
  const remote = Boolean(supabase && userId);
  const [store, setStore] = useState(readLocal);
  const [syncStatus, setSyncStatus] = useState("local"); // local | syncing | synced | error
  const mergePromiseRef = useRef(null);
  const creatingDefaultRef = useRef(null);

  const selectBooks = useCallback(async () => {
    const { data, error } = await supabase
      .from("books")
      .select("id, title, visible, description, author, year, price_cents, url, created_at")
      .eq("owner_id", userId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  }, [userId]);

  // Rapatrie livres et passages locaux dans le compte. Ne vide le navigateur
  // que si TOUT a été transféré ; sinon la prochaine connexion réessaiera
  // (les livres déjà créés sont retrouvés par titre, donc pas de doublon).
  const mergeLocal = useCallback(async (books) => {
    const local = readLocal();
    if (local.books.length === 0 && local.checkins.length === 0) return;

    // Verrou inter-onglets : un seul onglet fusionne à la fois.
    try {
      const lock = localStorage.getItem(MERGE_LOCK_KEY);
      if (lock && Date.now() - Number(lock) < 60_000) return;
      localStorage.setItem(MERGE_LOCK_KEY, String(Date.now()));
    } catch { /* ignore */ }

    try {
      const bookIdMap = {};
      for (const lb of local.books) {
        let target = books.find((b) => b.title.trim().toLowerCase() === lb.title.trim().toLowerCase());
        if (!target) {
          const { data: created, error } = await supabase
            .from("books")
            .insert({ owner_id: userId, title: lb.title })
            .select("id, title, visible, description, author, year, price_cents, url, created_at")
            .single();
          if (error) {
            console.warn("Impossible de créer le livre lors de la fusion", error);
            return; // on garde le local intact, on réessaiera
          }
          target = created;
          books.push(created);
        }
        bookIdMap[lb.id] = target.id;
      }
      const rows = local.checkins
        .filter((c) => bookIdMap[c.book_id])
        .map((c) => ({
          book_id: bookIdMap[c.book_id],
          user_id: userId,
          place_id: c.place_id,
          status: STATUS_BY_ID[c.status] ? c.status : "visited",
          note: c.note || null,
          created_at: c.created_at,
        }));
      if (rows.length !== local.checkins.length) {
        console.warn("Fusion incomplète : des passages sans livre ont été trouvés, local conservé");
        return;
      }
      if (rows.length > 0) {
        const { error } = await supabase.from("checkins").insert(rows);
        if (error) {
          console.warn("Impossible de fusionner les passages locaux", error);
          return;
        }
      }
      clearLocal();
    } finally {
      try { localStorage.removeItem(MERGE_LOCK_KEY); } catch { /* ignore */ }
    }
  }, [userId]);

  // ── Chargement distant + fusion du local ──────────────────────────────────
  // isCancelled() devient vrai si l'utilisateur change ou se déconnecte
  // pendant le chargement : on n'écrit alors rien dans l'état.
  const loadRemote = useCallback(async (isCancelled = () => false) => {
    if (!remote) return;
    setSyncStatus("syncing");

    try {
      let books = await selectBooks();

      // Fusion (une seule fois même si loadRemote est appelé deux fois : StrictMode).
      if (!mergePromiseRef.current) {
        mergePromiseRef.current = mergeLocal(books).finally(() => { mergePromiseRef.current = null; });
      }
      await mergePromiseRef.current;
      if (isCancelled()) return;

      // Re-sélection : la fusion a pu créer des livres (dans cet onglet ou un autre).
      books = await selectBooks();

      // Aucun livre : on en crée un par défaut (le trigger SQL le fait pour les
      // nouveaux comptes ; les comptes antérieurs à la v11 passent par ici).
      if (books.length === 0) {
        if (!creatingDefaultRef.current) {
          // Le builder Supabase n'est qu'un « thenable » : on l'enveloppe pour avoir .finally
          creatingDefaultRef.current = Promise.resolve(
            supabase
              .from("books")
              .insert({ owner_id: userId, title: DEFAULT_BOOK_TITLE })
              .select("id, title, visible, description, author, year, price_cents, url, created_at")
              .single()
          ).finally(() => { creatingDefaultRef.current = null; });
        }
        const { data: created, error } = await creatingDefaultRef.current;
        if (error) throw error;
        books = await selectBooks(); // au cas où un autre onglet l'ait aussi créé
        if (books.length === 0 && created) books = [created];
      }

      const { data: checkins, error: checkinsError } = await supabase
        .from("checkins")
        .select("id, book_id, place_id, status, note, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (checkinsError) throw checkinsError;
      if (isCancelled()) return;

      let remembered = null;
      try { remembered = localStorage.getItem(ACTIVE_KEY); } catch { /* ignore */ }
      setStore((prev) => {
        const wanted = [prev.activeBookId, remembered].find((id) => id && books.some((b) => b.id === id));
        return {
          books,
          checkins: checkins ?? [],
          activeBookId: wanted || books[0]?.id || null,
        };
      });
      setSyncStatus("synced");
    } catch (error) {
      if (isCancelled()) return;
      console.warn("Impossible de charger les données du compte", error);
      setSyncStatus("error");
    }
  }, [remote, userId, selectBooks, mergeLocal]);

  useEffect(() => {
    if (remote) {
      let cancelled = false;
      setStore(emptyStore()); // pas de flash des données locales pendant le chargement
      loadRemote(() => cancelled);
      return () => { cancelled = true; };
    }
    setStore(readLocal());
    setSyncStatus("local");
    return undefined;
  }, [remote, loadRemote]);

  // ── Persistance locale (mode sans compte uniquement) ──────────────────────
  const commitLocal = useCallback((updater) => {
    setStore((prev) => {
      const next = updater(prev);
      writeLocal(next);
      return next;
    });
  }, []);

  // ── Livres ────────────────────────────────────────────────────────────────
  const books = store.books;
  const activeBook = useMemo(
    () => books.find((b) => b.id === store.activeBookId) || books[0] || null,
    [books, store.activeBookId]
  );

  const setActiveBookId = useCallback((id) => {
    try { localStorage.setItem(ACTIVE_KEY, id || ""); } catch { /* ignore */ }
    if (remote) setStore((prev) => ({ ...prev, activeBookId: id }));
    else commitLocal((prev) => ({ ...prev, activeBookId: id }));
  }, [remote, commitLocal]);

  const createBook = useCallback(async (title) => {
    const clean = (title || "").trim();
    if (!clean) return null;
    if (remote) {
      setSyncStatus("syncing");
      const { data, error } = await supabase
        .from("books")
        .insert({ owner_id: userId, title: clean })
        .select("id, title, visible, description, author, year, price_cents, url, created_at")
        .single();
      if (error) {
        console.warn("Impossible de créer le livre", error);
        setSyncStatus("error");
        return null;
      }
      setStore((prev) => ({ ...prev, books: [...prev.books, data], activeBookId: data.id }));
      setSyncStatus("synced");
      return data;
    }
    const book = { id: uid(), title: clean, created_at: new Date().toISOString() };
    commitLocal((prev) => ({ ...prev, books: [...prev.books, book], activeBookId: book.id }));
    return book;
  }, [remote, userId, commitLocal]);

  // Garantit qu'il existe un livre actif (mode local : créé au premier clic).
  const ensureBook = useCallback(async () => {
    if (activeBook) return activeBook;
    return createBook(DEFAULT_BOOK_TITLE);
  }, [activeBook, createBook]);

  // Met à jour n'importe quel champ de la fiche d'un livre.
  const updateBook = useCallback(async (id, patch) => {
    const clean = {};
    if ("title" in patch) {
      const t = (patch.title || "").trim();
      if (!t) return;
      clean.title = t;
    }
    for (const k of ["description", "author", "url"]) {
      if (k in patch) clean[k] = (patch[k] || "").trim() || null;
    }
    for (const k of ["year", "price_cents"]) {
      if (k in patch) {
        const v = patch[k];
        clean[k] = v === "" || v == null ? null : Number(v);
      }
    }
    if ("visible" in patch) clean.visible = Boolean(patch.visible);
    if (Object.keys(clean).length === 0) return;

    if (remote) {
      setSyncStatus("syncing");
      const { error } = await supabase.from("books").update(clean).eq("id", id);
      if (error) {
        console.warn("Impossible de mettre à jour le livre", error);
        setSyncStatus("error");
        return;
      }
      setStore((prev) => ({ ...prev, books: prev.books.map((b) => (b.id === id ? { ...b, ...clean } : b)) }));
      setSyncStatus("synced");
      return;
    }
    commitLocal((prev) => ({ ...prev, books: prev.books.map((b) => (b.id === id ? { ...b, ...clean } : b)) }));
  }, [remote, commitLocal]);

  const renameBook = useCallback((id, title) => updateBook(id, { title }), [updateBook]);

  // Supprime un livre ET tous ses passages (cascade côté SQL).
  const deleteBook = useCallback(async (id) => {
    if (remote) {
      setSyncStatus("syncing");
      const { error } = await supabase.from("books").delete().eq("id", id);
      if (error) {
        console.warn("Impossible de supprimer le livre", error);
        setSyncStatus("error");
        return;
      }
      setSyncStatus("synced");
    }
    const apply = (prev) => {
      const nextBooks = prev.books.filter((b) => b.id !== id);
      return {
        books: nextBooks,
        checkins: prev.checkins.filter((c) => c.book_id !== id),
        activeBookId: prev.activeBookId === id ? nextBooks[0]?.id ?? null : prev.activeBookId,
      };
    };
    if (remote) setStore(apply);
    else commitLocal(apply);
  }, [remote, commitLocal]);

  // ── Passages ──────────────────────────────────────────────────────────────
  // Dernier passage par couple livre × lieu (clé "bookId|placeId").
  const latestByKey = useMemo(() => {
    const map = {};
    for (const c of sortByDate(store.checkins)) {
      const key = c.book_id + "|" + c.place_id;
      if (!map[key]) map[key] = c;
    }
    return map;
  }, [store.checkins]);

  const latest = useCallback((bookId, placeId) => latestByKey[bookId + "|" + placeId] || null, [latestByKey]);

  const historyFor = useCallback(
    (bookId, placeId) => sortByDate(store.checkins.filter((c) => c.book_id === bookId && c.place_id === placeId)),
    [store.checkins]
  );

  const addCheckin = useCallback(async (bookId, placeId, status, note = "") => {
    if (!bookId || !STATUS_BY_ID[status]) return;
    const draft = {
      id: uid(),
      book_id: bookId,
      place_id: placeId,
      status,
      note: note || "",
      created_at: new Date().toISOString(),
    };
    if (remote) {
      draft.pending = true; // pas annulable tant que le serveur n'a pas répondu
      setStore((prev) => ({ ...prev, checkins: [draft, ...prev.checkins] })); // optimiste
      setSyncStatus("syncing");
      const { data, error } = await supabase
        .from("checkins")
        .insert({ book_id: bookId, user_id: userId, place_id: placeId, status, note: note || null })
        .select("id, book_id, place_id, status, note, created_at")
        .single();
      if (error) {
        console.warn("Impossible d'enregistrer le passage", error);
        setStore((prev) => ({ ...prev, checkins: prev.checkins.filter((c) => c.id !== draft.id) }));
        setSyncStatus("error");
        return;
      }
      setStore((prev) => ({ ...prev, checkins: prev.checkins.map((c) => (c.id === draft.id ? data : c)) }));
      setSyncStatus("synced");
      return;
    }
    commitLocal((prev) => ({ ...prev, checkins: [draft, ...prev.checkins] }));
  }, [remote, userId, commitLocal]);

  // Annule le DERNIER passage d'un couple livre × lieu (correction d'un clic).
  const undoLatest = useCallback(async (bookId, placeId) => {
    const target = latestByKey[bookId + "|" + placeId];
    if (!target || target.pending) return;
    if (remote) {
      setSyncStatus("syncing");
      const { error } = await supabase.from("checkins").delete().eq("id", target.id);
      if (error) {
        console.warn("Impossible d'annuler le passage", error);
        setSyncStatus("error");
        return;
      }
      setStore((prev) => ({ ...prev, checkins: prev.checkins.filter((c) => c.id !== target.id) }));
      setSyncStatus("synced");
      return;
    }
    commitLocal((prev) => ({ ...prev, checkins: prev.checkins.filter((c) => c.id !== target.id) }));
  }, [remote, latestByKey, commitLocal]);

  // Efface tous les passages d'un livre (le livre reste).
  const resetBook = useCallback(async (bookId) => {
    if (!bookId) return;
    if (remote) {
      setSyncStatus("syncing");
      const { error } = await supabase.from("checkins").delete().eq("book_id", bookId);
      if (error) {
        console.warn("Impossible de réinitialiser le livre", error);
        setSyncStatus("error");
        return;
      }
      setStore((prev) => ({ ...prev, checkins: prev.checkins.filter((c) => c.book_id !== bookId) }));
      setSyncStatus("synced");
      return;
    }
    commitLocal((prev) => ({ ...prev, checkins: prev.checkins.filter((c) => c.book_id !== bookId) }));
  }, [remote, commitLocal]);

  return {
    isRemote: remote,
    syncStatus,
    books,
    activeBook,
    setActiveBookId,
    ensureBook,
    createBook,
    renameBook,
    updateBook,
    deleteBook,
    checkins: store.checkins,
    latest,
    historyFor,
    addCheckin,
    undoLatest,
    resetBook,
    refresh: loadRemote,
  };
}
