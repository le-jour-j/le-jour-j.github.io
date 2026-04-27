import { useState } from "react";
import { useAuth } from "./hooks/useAuth.js";
import AuthPanel from "./components/AuthPanel.jsx";
import RoadtripApp from "./RoadtripApp.jsx";
import About from "./pages/About.jsx";
import Guide from "./pages/Guide.jsx";
import "./style.css";

const TABS = [
  { id: "carte", label: "Carte" },
  { id: "projet", label: "Projet" },
  { id: "guide", label: "Guide" },
  { id: "compte", label: "Compte" },
];

export default function App() {
  const [tab, setTab] = useState("carte");
  const { user, loading, isSupabaseConfigured } = useAuth();

  return (
    <div className="app-root">
      <nav className="main-nav" aria-label="Navigation principale">
        <div className="brand">Tour de Phrance{user ? " · connecté" : ""}</div>
        <div className="nav-tabs">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={tab === item.id ? "active" : ""}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>
      {tab === "carte" && <RoadtripApp user={user} authLoading={loading} isSupabaseConfigured={isSupabaseConfigured} />}
      {tab === "projet" && <About />}
      {tab === "guide" && <Guide />}
      {tab === "compte" && <AuthPanel user={user} />}
    </div>
  );
}
