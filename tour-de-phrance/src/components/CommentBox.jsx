import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

function getLocalKey(targetType, targetId) {
  return `tourdePhrance_v8_comments_${targetType}_${targetId}`;
}

function readLocalComments(targetType, targetId) {
  try {
    const raw = localStorage.getItem(getLocalKey(targetType, targetId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalComments(targetType, targetId, comments) {
  try {
    localStorage.setItem(getLocalKey(targetType, targetId), JSON.stringify(comments));
  } catch {
    // ignore
  }
}

export default function CommentBox({ targetType, targetId, title, user }) {
  const [comments, setComments] = useState(() => readLocalComments(targetType, targetId));
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");
  const canUseRemote = Boolean(supabase);

  const label = useMemo(() => {
    if (targetType === "route") return "Commentaire sur le tronçon";
    return "Commentaire sur le lieu";
  }, [targetType]);

  useEffect(() => {
    if (!supabase) {
      setComments(readLocalComments(targetType, targetId));
      return;
    }

    let cancelled = false;

    async function loadComments() {
      const { data, error } = await supabase
        .from("comments")
        .select("id, target_type, target_id, body, created_at, author_id, profiles:pseudo")
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (cancelled) return;

      if (error) {
        console.warn("Impossible de charger les commentaires", error);
        setStatus("Commentaires indisponibles pour le moment.");
        return;
      }

      setComments(data ?? []);
    }

    loadComments();

    return () => {
      cancelled = true;
    };
  }, [targetType, targetId]);

  async function submitComment(event) {
    event.preventDefault();
    const clean = body.trim();
    if (!clean) return;

    setStatus("");

    if (!supabase || !user) {
      const localComment = {
        id: `local-${Date.now()}`,
        body: clean,
        created_at: new Date().toISOString(),
        local: true,
      };
      const next = [localComment, ...comments];
      setComments(next);
      writeLocalComments(targetType, targetId, next);
      setBody("");
      setStatus("Commentaire enregistré localement sur ce navigateur.");
      return;
    }

    const { data, error } = await supabase
      .from("comments")
      .insert({
        target_type: targetType,
        target_id: targetId,
        body: clean,
        author_id: user.id,
      })
      .select("id, target_type, target_id, body, created_at, author_id, profiles:pseudo")
      .single();

    if (error) {
      console.warn("Impossible de publier le commentaire", error);
      setStatus("Impossible de publier le commentaire.");
      return;
    }

    setComments((prev) => [data, ...prev]);
    setBody("");
  }

  return (
    <div className="comment-box">
      <div className="comment-box-header">
        <span>{label}</span>
        <strong>{title}</strong>
      </div>

      <form onSubmit={submitComment} className="comment-form">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={
            canUseRemote && !user
              ? "Connecte-toi pour publier un commentaire public."
              : "Ajouter une note, un retour de dépôt, une info pratique..."
          }
          rows={3}
          disabled={canUseRemote && !user}
        />
        <button type="submit" disabled={!body.trim() || (canUseRemote && !user)}>
          {canUseRemote ? "Publier" : "Enregistrer localement"}
        </button>
      </form>

      {status && <div className="comment-status">{status}</div>}

      {comments.length > 0 && (
        <div className="comment-list">
          {comments.map((comment) => (
            <article key={comment.id} className="comment-item">
              <p>{comment.body}</p>
              <small>
                {comment.profiles?.pseudo || comment.local ? "note locale" : "contributeur·ice"} · {new Date(comment.created_at).toLocaleDateString("fr-FR")}
              </small>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
