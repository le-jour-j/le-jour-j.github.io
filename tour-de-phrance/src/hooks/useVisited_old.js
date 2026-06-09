import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

const STORAGE_KEY = "tourdePhrance_v8_visited";
const LEGACY_KEYS = ["tourdePhrance_v6_visited", "tourdePhrance_v2_visited"];

function readLocalVisited() {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) return JSON.parse(current);

    for (const key of LEGACY_KEYS) {
      const legacy = localStorage.getItem(key);
      if (legacy) return JSON.parse(legacy);
    }
  } catch {
    return {};
  }
  return {};
}

function writeLocalVisited(next) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage can fail in private browsing; ignore.
  }
}

export function useVisited(user) {
  const [visited, setVisited] = useState(readLocalVisited);
  const [syncStatus, setSyncStatus] = useState("local");

  useEffect(() => {
    if (!supabase || !user) {
      setSyncStatus("local");
      return;
    }

    let cancelled = false;

    async function loadRemoteVisited() {
      setSyncStatus("syncing");
      const { data, error } = await supabase
        .from("visited_places")
        .select("place_id")
        .eq("user_id", user.id);

      if (cancelled) return;

      if (error) {
        console.warn("Impossible de charger la progression distante", error);
        setSyncStatus("error");
        return;
      }

      const remote = {};
      for (const row of data ?? []) remote[row.place_id] = true;

      setVisited((prev) => {
        const merged = { ...prev, ...remote };
        writeLocalVisited(merged);
        return merged;
      });
      setSyncStatus("synced");
    }

    loadRemoteVisited();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const toggle = useCallback((id) => {
    setVisited((prev) => {
      const nextValue = !prev[id];
      const next = { ...prev, [id]: nextValue };
      if (!nextValue) delete next[id];
      writeLocalVisited(next);

      if (supabase && user) {
        if (nextValue) {
          supabase
            .from("visited_places")
            .upsert(
              { user_id: user.id, place_id: id },
              { onConflict: "user_id,place_id" }
            )
            .then(({ error }) => {
              if (error) console.warn("Impossible de synchroniser la coche", error);
            });
        } else {
          supabase
            .from("visited_places")
            .delete()
            .eq("user_id", user.id)
            .eq("place_id", id)
            .then(({ error }) => {
              if (error) console.warn("Impossible de retirer la coche distante", error);
            });
        }
      }

      return next;
    });
  }, [user?.id]);

  const reset = useCallback(async () => {
    setVisited({});
    try {
      localStorage.removeItem(STORAGE_KEY);
      for (const key of LEGACY_KEYS) localStorage.removeItem(key);
    } catch {
      // ignore
    }

    if (supabase && user) {
      const { error } = await supabase
        .from("visited_places")
        .delete()
        .eq("user_id", user.id);
      if (error) console.warn("Impossible de réinitialiser la progression distante", error);
    }
  }, [user?.id]);

  return { visited, toggle, reset, syncStatus };
}
