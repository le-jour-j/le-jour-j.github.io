import { useState } from "react";
import { useAuth } from "./hooks/useAuth.js";
import { useTour } from "./hooks/useTour.js";
import { useCatalogue } from "./hooks/useCatalogue.js";
import AuthPanel from "./components/AuthPanel.jsx";
import BooksPanel from "./components/BooksPanel.jsx";
import RoadtripApp from "./RoadtripApp.jsx";
import About from "./pages/About.jsx";
import Guide from "./pages/Guide.jsx";
import Catalogue from "./pages/Catalogue.jsx";
import "./style.css";

const TABS = [
  { id: "carte", label: "Carte" },
  { id: "livres", label: "Livres" },
  { id: "projet", label: "Projet" },
  { id: "guide", label: "Guide" },
  { id: "compte", label: "Compte" },
];

export default function App() {
  const [tab, setTab] = useState("carte");
  const { user, isSupabaseConfigured } = useAuth();
  const tour = useTour(user);
  const catalogue = useCatalogue(tour, user);

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
      {tab === "carte" && (
        <RoadtripApp user={user} isSupabaseConfigured={isSupabaseConfigured} tour={tour} catalogue={catalogue} />
      )}
      {tab === "livres" && <Catalogue catalogue={catalogue} />}
      {tab === "projet" && <About />}
      {tab === "guide" && <Guide />}
      {tab === "compte" && (
        <>
          <AuthPanel user={user} />
          <BooksPanel tour={tour} user={user} />
        </>
      )}
    </div>
  );
}
