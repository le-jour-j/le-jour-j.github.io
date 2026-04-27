import { useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient.js";

export default function AuthPanel({ user }) {
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
          <div className="account-card">
            <p>Connecté avec :</p>
            <strong>{user.email}</strong>
            <button type="button" className="plain-button" onClick={signOut}>
              Se déconnecter
            </button>
          </div>
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
