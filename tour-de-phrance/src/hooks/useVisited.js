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

function rowsToVisited(rows) {
  const next = {};
  for (const row of rows ?? []) {
    next[row.place_id] = true;
  }
  return next;
}

export function useVisited(user) {
  const [visited, setVisited] = useState(readLocalVisited);
  const [syncStatus, setSyncStatus] = useState("local");

  const loadRemoteVisited = useCallback(async () => {
    if (!supabase || !user) {
      setSyncStatus("local");
      return;
    }

    setSyncStatus("syncing");

    const { data, error } = await supabase
      .from("visited_places")
      .select("place_id")
      .eq("user_id", user.id);

    if (error) {
      console.warn("Impossible de charger la progression distante", error);
      setSyncStatus("error");
      return;
    }

    const remote = rowsToVisited(data);
    setVisited(remote);
    writeLocalVisited(remote);
    setSyncStatus("synced");
  }, [user?.id]);

  useEffect(() => {
    loadRemoteVisited();
  }, [loadRemoteVisited]);

  useEffect(() => {
    if (!supabase || !user) return;

    const channel = supabase
      .channel(`visited_places_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "visited_places",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadRemoteVisited();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, loadRemoteVisited]);

  const toggle = useCallback((id) => {
    setVisited((prev) => {
      const nextValue = !prev[id];
      const optimistic = { ...prev };

      if (nextValue) optimistic[id] = true;
      else delete optimistic[id];

      writeLocalVisited(optimistic);

      if (supabase && user) {
        setSyncStatus("syncing");

        if (nextValue) {
          supabase
            .from("visited_places")
            .upsert(
              { user_id: user.id, place_id: id },
              { onConflict: "user_id,place_id" }
            )
            .then(({ error }) => {
              if (error) {
                console.warn("Impossible de synchroniser la coche", error);
                setSyncStatus("error");
              } else {
                setSyncStatus("synced");
              }
            });
        } else {
          supabase
            .from("visited_places")
            .delete()
            .eq("user_id", user.id)
            .eq("place_id", id)
            .then(({ error }) => {
              if (error) {
                console.warn("Impossible de retirer la coche distante", error);
                setSyncStatus("error");
              } else {
                setSyncStatus("synced");
              }
            });
        }
      }

      return optimistic;
    });
  }, [user?.id]);

  const reset = useCallback(async () => {
    setVisited({});
    writeLocalVisited({});

    try {
      localStorage.removeItem(STORAGE_KEY);
      for (const key of LEGACY_KEYS) localStorage.removeItem(key);
    } catch {
      // ignore
    }

    if (supabase && user) {
      setSyncStatus("syncing");
      const { error } = await supabase
        .from("visited_places")
        .delete()
        .eq("user_id", user.id);

      if (error) {
        console.warn("Impossible de réinitialiser la progression distante", error);
        setSyncStatus("error");
      } else {
        setSyncStatus("synced");
      }
    }
  }, [user?.id]);

  return { visited, toggle, reset, syncStatus, refreshVisited: loadRemoteVisited };
}
