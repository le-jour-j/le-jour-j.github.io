import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient.js";

export default function AuthPanel({ user }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!supabase) return;

    const hash = window.location.hash || "";
    const query = window.location.search || "";
    const isRecovery =
      hash.includes("type=recovery") ||
      query.includes("type=recovery") ||
      hash.includes("access_token");

    if (isRecovery) {
      setMode("update-password");
      setMessage("Choisis un nouveau mot de passe.");
    }
  }, []);

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
      setMessage("Supabase n'est pas encore configuré.");
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
      setMessage("Supabase n'est pas encore configuré.");
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
    setMessage("Compte créé. Tu peux te connecter.");
  }

  async function handlePasswordResetRequest(event) {
    event.preventDefault();
    setMessage("");

    if (!supabase) {
      setMessage("Supabase n'est pas encore configuré.");
      return;
    }

    const redirectTo = `${window.location.origin}${window.location.pathname}`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) setMessage(error.message);
    else setMessage("Mail de récupération envoyé. Vérifie ta boîte mail.");
  }

  async function handleUpdatePassword(event) {
    event.preventDefault();
    setMessage("");

    if (!supabase) {
      setMessage("Supabase n'est pas encore configuré.");
      return;
    }

    if (newPassword.length < 6) {
      setMessage("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setNewPassword("");
    setMode("login");
    setMessage("Mot de passe mis à jour. Tu peux te connecter.");
    window.history.replaceState(null, "", window.location.pathname);
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setMessage("");
    setPassword("");
    setNewPassword("");
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

        {user && mode !== "update-password" ? (
          <div className="account-card">
            <p>Connecté avec :</p>
            <strong>{user.email}</strong>
            <button type="button" className="plain-button" onClick={signOut}>
              Se déconnecter
            </button>
          </div>
        ) : (
          <>
            {mode !== "update-password" && (
              <div className="auth-mode-tabs">
                <button
                  type="button"
                  className={mode === "login" ? "active" : ""}
                  onClick={() => switchMode("login")}
                >
                  Se connecter
                </button>
                <button
                  type="button"
                  className={mode === "signup" ? "active" : ""}
                  onClick={() => switchMode("signup")}
                >
                  Créer un compte
                </button>
                <button
                  type="button"
                  className={mode === "reset" ? "active" : ""}
                  onClick={() => switchMode("reset")}
                >
                  Mot de passe oublié
                </button>
              </div>
            )}

            {mode === "login" && (
              <form className="auth-form" onSubmit={handleLogin}>
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
                    autoComplete="current-password"
                  />
                </label>

                <button type="submit" className="primary-button">
                  Se connecter
                </button>
              </form>
            )}

            {mode === "signup" && (
              <form className="auth-form" onSubmit={handleSignup}>
                <label>
                  Pseudo public
                  <input
                    value={pseudo}
                    onChange={(event) => setPseudo(event.target.value)}
                    placeholder="ex. jean-son"
                  />
                </label>

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
                    autoComplete="new-password"
                  />
                </label>

                <button type="submit" className="primary-button">
                  Créer le compte
                </button>
              </form>
            )}

            {mode === "reset" && (
              <form className="auth-form" onSubmit={handlePasswordResetRequest}>
                <p>
                  Entre ton email. Tu recevras un lien pour choisir un nouveau mot de passe.
                </p>

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

                <button type="submit" className="primary-button">
                  Envoyer le mail de récupération
                </button>
              </form>
            )}

            {mode === "update-password" && (
              <form className="auth-form" onSubmit={handleUpdatePassword}>
                <p>
                  Choisis ton nouveau mot de passe.
                </p>

                <label>
                  Nouveau mot de passe
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="6 caractères minimum"
                    autoComplete="new-password"
                  />
                </label>

                <button type="submit" className="primary-button">
                  Mettre à jour le mot de passe
                </button>
              </form>
            )}
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
