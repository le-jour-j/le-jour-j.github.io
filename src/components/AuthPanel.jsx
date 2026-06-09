import { useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient.js";

// ─── DESIGN TOKENS (repris de RoadtripApp) ────────────────────────────────────
const C = {
  accent: "#f6845e",
  accentAlt: "#f2c94c",
  accentMint: "#68d8c0",
  textPrimary: "#2d3748",
  textMuted: "#a0aec0",
  textSecondary: "#718096",
  progressStart: "#f6845e",
  visited: "#e8f9f4",
  visitedBorder: "#68d8c0",
  visitedText: "#2d7d6a",
};

// ─── MINI PROGRESS BLOCK ──────────────────────────────────────────────────────
function AccountProgress({ visitedCount, total, visited }) {
  const pct = total > 0 ? (visitedCount / total) * 100 : 0;

  // Regroupe les lieux visités par région
  const byRegion = {};
  Object.keys(visited).forEach((id) => {
    if (!visited[id]) return;
    const region = id.replace(/-\d+$/, "");
    byRegion[region] = (byRegion[region] || 0) + 1;
  });

  const topRegions = Object.entries(byRegion)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const REGION_LABELS = {
    "occitanie": "Occitanie",
    "paca": "PACA",
    "corse": "Corse",
    "auvergne-rhone-alpes": "Auvergne-Rhône-Alpes",
    "bourgogne-franche-comte": "Bourgogne-FC",
    "grand-est": "Grand Est",
    "hauts-de-france": "Hauts-de-France",
    "normandie": "Normandie",
    "bretagne": "Bretagne",
    "pays-de-la-loire": "Pays de la Loire",
    "ile-de-france": "Île-de-France",
    "centre-val-de-loire": "Centre-Val de Loire",
    "nouvelle-aquitaine": "Nouvelle-Aquitaine",
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, #f8faff 0%, #eef5ff 100%)",
      border: "1.5px solid #d0dced",
      borderRadius: "6px",
      padding: "20px",
      marginBottom: "20px",
    }}>
      {/* Big numbers */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "16px" }}>
        <div>
          <div style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "9.5px", letterSpacing: "0.18em",
            textTransform: "uppercase", color: C.accent, marginBottom: "4px",
          }}>
            Ma progression
          </div>
          <div style={{
            fontFamily: "var(--font-main, sans-serif)",
            fontSize: "32px", fontWeight: "800",
            color: C.textPrimary, letterSpacing: "-0.03em", lineHeight: "1",
          }}>
            {visitedCount}
            <span style={{ fontSize: "16px", fontWeight: "500", color: C.textMuted, marginLeft: "5px" }}>
              / {total} lieux
            </span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{
            fontFamily: "var(--font-main, sans-serif)",
            fontSize: "32px", fontWeight: "800", letterSpacing: "-0.03em",
            background: `linear-gradient(135deg, ${C.progressStart}, ${C.accentAlt})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            {pct.toFixed(1)}%
          </div>
          <div style={{ fontSize: "10px", color: C.textMuted, fontFamily: "var(--font-mono, monospace)" }}>
            ~{Math.round(pct * 98)} km
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        height: "10px", background: "#dce6f0",
        borderRadius: "2px", overflow: "hidden", marginBottom: "12px",
      }}>
        <div style={{
          width: `${pct}%`, height: "100%",
          background: `linear-gradient(90deg, ${C.progressStart}, ${C.accentAlt})`,
          borderRadius: "2px",
          transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
        }} />
      </div>

      {/* Regions breakdown */}
      {topRegions.length > 0 && (
        <div>
          <div style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "9px", letterSpacing: "0.12em",
            textTransform: "uppercase", color: C.textMuted,
            marginBottom: "8px",
          }}>
            Régions visitées
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {topRegions.map(([region, count]) => (
              <div key={region} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{
                  flex: 1,
                  fontFamily: "var(--font-main, sans-serif)",
                  fontSize: "12px", color: C.textSecondary,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {REGION_LABELS[region] || region}
                </div>
                <div style={{
                  display: "inline-flex", alignItems: "center",
                  background: C.visited,
                  border: `1px solid ${C.visitedBorder}`,
                  borderRadius: "2px",
                  padding: "1px 7px",
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "10px", fontWeight: "600",
                  color: C.visitedText,
                }}>
                  {count} lieu{count > 1 ? "x" : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {visitedCount === 0 && (
        <div style={{
          textAlign: "center",
          fontFamily: "var(--font-main, sans-serif)",
          fontSize: "13px", color: C.textMuted,
          marginTop: "4px",
        }}>
          Commence à cocher des lieux dans l'onglet Carte !
        </div>
      )}
    </div>
  );
}

export default function AuthPanel({ user, visited = {}, total = 0 }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function ensureProfile(nextUser, nextPseudo) {
    if (!supabase || !nextUser) return;

    const cleanPseudo = nextPseudo.trim() || nextUser.email?.split("@")[0] || "utilisateur";

    await supabase
      .from("profiles")
      .upsert(
        { id: nextUser.id, pseudo: cleanPseudo },
        { onConflict: "id" }
      );
  }

  async function handleLogin(event) {
    event.preventDefault();
    setMessage("");

    if (!supabase) {
      setMessage("Supabase n'est pas encore configuré. Ajoute VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.local.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) setMessage(error.message);
    else setMessage("Connexion réussie.");
  }

  async function handleSignup(event) {
    event.preventDefault();
    setMessage("");

    if (!supabase) {
      setMessage("Supabase n'est pas encore configuré. Ajoute VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.local.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { pseudo: pseudo.trim() || null },
      },
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    await ensureProfile(data.user, pseudo);
    setMessage("Compte créé. Si la confirmation email est désactivée dans Supabase, tu es connecté directement.");
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  return (
    <main className="page-shell">
      <section className="page-card">
        <p className="eyebrow">Compte</p>
        <h1>Progression et commentaires</h1>

        {!isSupabaseConfigured && (
          <div className="notice-card">
            <strong>Mode local actif.</strong>
            <p>
              Les cases cochées restent sauvegardées dans ce navigateur. Les comptes et les commentaires publics s'activeront quand Supabase sera configuré.
            </p>
          </div>
        )}

        {user ? (
          <>
            <div className="account-card">
              <p>Connecté avec :</p>
              <strong>{user.email}</strong>
              <button type="button" className="plain-button" onClick={signOut}>
                Se déconnecter
              </button>
            </div>
            <AccountProgress
              visitedCount={Object.values(visited).filter(Boolean).length}
              total={total}
              visited={visited}
            />
          </>
        ) : (
          <>
            <div className="auth-mode-tabs">
              <button
                type="button"
                className={mode === "login" ? "active" : ""}
                onClick={() => {
                  setMode("login");
                  setMessage("");
                }}
              >
                Se connecter
              </button>
              <button
                type="button"
                className={mode === "signup" ? "active" : ""}
                onClick={() => {
                  setMode("signup");
                  setMessage("");
                }}
              >
                Créer un compte
              </button>
            </div>

            <form className="auth-form" onSubmit={mode === "login" ? handleLogin : handleSignup}>
              {mode === "signup" && (
                <label>
                  Pseudo public
                  <input
                    value={pseudo}
                    onChange={(event) => setPseudo(event.target.value)}
                    placeholder="ex. jean-son"
                  />
                </label>
              )}

              <label>
                Email
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="adresse@mail.com"
                  autoComplete="email"
                />
              </label>

              <label>
                Mot de passe
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="6 caractères minimum"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </label>

              <button type="submit" className="primary-button">
                {mode === "login" ? "Se connecter" : "Créer le compte"}
              </button>
            </form>
          </>
        )}

        {message && <p className="form-message">{message}</p>}

        <div className="page-note">
          <p>
            Le compte sert uniquement à retrouver sa progression et à publier des commentaires sur les lieux ou les tronçons.
          </p>
          <p>
            Pas de paiement, pas d'abonnement, pas de paywall.
          </p>
        </div>
      </section>
    </main>
  );
}
