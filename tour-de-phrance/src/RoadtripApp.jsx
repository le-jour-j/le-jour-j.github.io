import { useState, useEffect, useMemo } from "react";
import { useVisited } from "./hooks/useVisited.js";
import CommentBox from "./components/CommentBox.jsx";
import { RAW_LOCATIONS } from "./data/locations.js";
import { RAW_ITINERARIES } from "./data/itineraries.js";

// ─── GOOGLE MAPS API KEY ──────────────────────────────────────────────────────
import { GOOGLE_MAPS_API_KEY } from "./config/googleMapsConfig.js";

const apiKey = GOOGLE_MAPS_API_KEY;


// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const KM0 = {
  id: "start-0",
  name: "KM 0 — Gratens",
  address: "2165 route du Bois de la pierre, 31430 Gratens",
  city: "Gratens",
  description: "Point de départ absolu du Tour de Phrance.",
  visited: false,
};

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const C = {
  bg: "transparent",
  card: "#e0eaf5",
  cardBorder: "rgba(0,0,0,0.06)",
  textPrimary: "#2d3748",
  textSecondary: "#718096",
  textMuted: "#a0aec0",
  accent: "#f6845e",       // pêche douce
  accentAlt: "#f2c94c",    // jaune miel
  accentMint: "#68d8c0",   // menthe fraîche
  accentLavender: "#9b8ec4", // lavande
  visited: "#e8f9f4",
  visitedBorder: "#68d8c0",
  visitedText: "#2d7d6a",
  progressStart: "#f6845e",
  progressEnd: "#f2c94c",
  shadow: "none",
  shadowHover: "none",
  radius: "2px",
  radiusSm: "2px",
  radiusXs: "2px",
};

// ─── REGION COLORS ────────────────────────────────────────────────────────────
const REGION_COLORS = {
  "occitanie": { bg: "#fff4e6", text: "#c05621", dot: "#f6ad55" },
  "paca": { bg: "#fff0f3", text: "#b83280", dot: "#f687b3" },
  "corse": { bg: "#f0fff4", text: "#276749", dot: "#68d391" },
  "auvergne-rhone-alpes": { bg: "#ebf8ff", text: "#2b6cb0", dot: "#63b3ed" },
  "bourgogne-franche-comte": { bg: "#faf5ff", text: "#6b46c1", dot: "#b794f4" },
  "grand-est": { bg: "#fff5f5", text: "#c53030", dot: "#fc8181" },
  "hauts-de-france": { bg: "#e6fffa", text: "#234e52", dot: "#4fd1c5" },
  "normandie": { bg: "#fffbeb", text: "#744210", dot: "#f6e05e" },
  "bretagne": { bg: "#ebf4ff", text: "#2c5282", dot: "#90cdf4" },
  "pays-de-la-loire": { bg: "#fefcbf", text: "#744210", dot: "#f6e05e" },
  "ile-de-france": { bg: "#fff0f3", text: "#97266d", dot: "#ed64a6" },
  "centre-val-de-loire": { bg: "#f0fff4", text: "#22543d", dot: "#68d391" },
  "nouvelle-aquitaine": { bg: "#fffaf0", text: "#7b341e", dot: "#fbb6ce" },
};

function getRegionStyle(id) {
  const region = id.replace(/-\d+$/, "");
  return REGION_COLORS[region] || { bg: "#f7f8fa", text: "#4a5568", dot: "#a0aec0" };
}

// ─── URL BUILDERS ─────────────────────────────────────────────────────────────
function getLocAddr(id, locMap) {
  if (id === "start-0") return KM0.address;
  const loc = locMap[id];
  if (!loc) return null;
  const addr = loc.address?.trim();
  if (addr && addr !== "...") return addr;
  return loc.name + (loc.city ? ", " + loc.city : "");
}

function buildMapsUrl(stops, locMap) {
  const addresses = stops.map(id => getLocAddr(id, locMap)).filter(Boolean);
  if (addresses.length < 2) return null;
  return "https://www.google.com/maps/dir/" + addresses.map(encodeURIComponent).join("/");
}

function buildEmbedMapUrl(stops, locMap) {
  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === "VOTRE_CLE_API_ICI") return null;
  const addresses = stops.map(id => getLocAddr(id, locMap)).filter(Boolean).slice(0, 10);
  if (addresses.length < 2) return null;
  const origin = encodeURIComponent(addresses[0]);
  const destination = encodeURIComponent(addresses[addresses.length - 1]);
  const waypoints = addresses.slice(1, -1).map(encodeURIComponent).join("|");
  const waypointParam = waypoints ? `&waypoints=${waypoints}` : "";
  return `https://www.google.com/maps/embed/v1/directions?key=${GOOGLE_MAPS_API_KEY}&origin=${origin}&destination=${destination}${waypointParam}&mode=driving&language=fr`;
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
const IconChevron = ({ open }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
    style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)", flexShrink: 0 }}>
    <path d="M4.5 6.75L9 11.25L13.5 6.75" stroke={C.textMuted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconMap = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
    <line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" />
  </svg>
);

const IconCheck = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
    <path d="M1.5 5.5L4.5 8.5L9.5 2.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconPin = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
  </svg>
);

// ─── LOCATION ROW ─────────────────────────────────────────────────────────────
function LocationRow({ loc, isVisited, onToggle, isOverlap, user }) {
  const rs = getRegionStyle(loc.id);

  return (
    <div
      onClick={() => !isOverlap && onToggle(loc.id)}
      style={{
        display: "flex", alignItems: "flex-start", gap: "11px",
        padding: "10px 12px",
        borderRadius: C.radiusSm,
        cursor: isOverlap ? "default" : "pointer",
        opacity: isOverlap ? 0.38 : 1,
        background: isVisited ? C.visited : "transparent",
        borderLeft: isVisited ? `3px solid ${C.visitedBorder}` : "3px solid transparent",
        transition: "background 0.2s ease, border-color 0.2s ease",
        marginBottom: "2px",
      }}
    >
      {/* Checkbox */}
      {!isOverlap && (
        <div style={{
          width: "20px", height: "20px", flexShrink: 0, marginTop: "2px",
          borderRadius: "2px",
          border: isVisited ? "none" : `2px solid ${C.textMuted}`,
          background: isVisited ? C.accentMint : "white",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.2s ease",
          boxShadow: isVisited ? `0 2px 8px ${C.accentMint}55` : "none",
        }}>
          {isVisited && <IconCheck />}
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px", flexWrap: "wrap" }}>
          <span style={{
            fontFamily: "var(--font-main, sans-serif)",
            fontSize: "13.5px", fontWeight: "600",
            color: isVisited ? C.visitedText : C.textPrimary,
            textDecoration: isVisited ? "line-through" : "none",
            letterSpacing: "-0.01em",
            transition: "color 0.2s",
          }}>
            {loc.name}
          </span>
          {loc.city && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "3px",
              fontSize: "10.5px", fontFamily: "var(--font-mono, monospace)",
              color: rs.text, background: rs.bg,
              padding: "2px 7px", borderRadius: "2px",
              letterSpacing: "0.02em", fontWeight: "500",
            }}>
              <span style={{ color: rs.dot, fontSize: "8px" }}>●</span>
              {loc.city}
            </span>
          )}
        </div>
        {loc.address && loc.address !== "..." && !isOverlap && (
          <div style={{
            fontSize: "11px", color: C.textMuted, marginTop: "3px",
            fontFamily: "var(--font-mono, monospace)", letterSpacing: "0.01em",
          }}>
            {loc.address}
          </div>
        )}
        {isOverlap && (
          <div style={{ fontSize: "10.5px", color: C.textMuted, fontStyle: "italic", fontFamily: "var(--font-main, sans-serif)" }}>
            Relais depuis l'étape précédente
          </div>
        )}
        {!isOverlap && (
          <CommentBox
            targetType="location"
            targetId={loc.id}
            title={loc.name}
            user={user}
          />
        )}
      </div>
    </div>
  );
}

// ─── MAP THUMBNAIL (Embed iframe) ─────────────────────────────────────────────
function MapThumbnail({ stops, locMap }) {
  const url = buildEmbedMapUrl(stops, locMap);
  if (!url) return (
    <div style={{
      width: "100%", height: "160px",
      background: "#eef2f8",
      borderRadius: C.radiusSm,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: "6px", marginBottom: "12px",
      border: `1px dashed ${C.cardBorder}`,
    }}>
      <div style={{ fontSize: "28px" }}>🗺️</div>
      <div style={{ fontSize: "11px", color: C.textMuted, fontFamily: "var(--font-mono, monospace)", textAlign: "center", lineHeight: "1.5" }}>
        Aperçu disponible<br />avec une clé API Google Maps
      </div>
    </div>
  );

  return (
    <div style={{
      width: "100%", height: "160px",
      borderRadius: C.radiusSm,
      overflow: "hidden",
      marginBottom: "12px",
      boxShadow: "none",
      position: "relative",
    }}>
      <iframe
        title="Aperçu itinéraire"
        src={url}
        width="100%"
        height="100%"
        style={{ border: "none", display: "block" }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}

// ─── TRONCON CARD ─────────────────────────────────────────────────────────────
function TronconCard({ troncon, locMap, visited, onToggle, tronconIndex, user }) {
  const [open, setOpen] = useState(false);
  const stops = troncon.stops;
  const overlapId = tronconIndex > 0 ? stops[0] : null;

  const locs = stops.map(id =>
    id === "start-0" ? KM0 : (locMap[id] || { id, name: id, address: "", city: "" })
  );

  const visitableIds = stops.filter(id => id !== overlapId);
  const visitedCount = visitableIds.filter(id => visited[id]).length;
  const total = visitableIds.length;
  const progress = total > 0 ? visitedCount / total : 0;
  const allDone = visitedCount === total && total > 0;

  const mapsUrl = useMemo(() => buildMapsUrl(stops, locMap), [stops]);

  const startCity = locs[0]?.city || locs[0]?.name || "?";
  const endCity = locs[locs.length - 1]?.city || locs[locs.length - 1]?.name || "?";

  // Collect region tags visible in this troncon
  const regions = [...new Set(
    visitableIds.map(id => id.replace(/-\d+$/, ""))
      .filter(r => REGION_COLORS[r])
  )].slice(0, 3);

  return (
    <div style={{
      marginBottom: "10px",
      borderRadius: C.radius,
      border: allDone
        ? `1.5px solid ${C.accentMint}`
        : `1.5px solid ${C.cardBorder}`,
      background: C.card,
      boxShadow: open ? C.shadowHover : C.shadow,
      overflow: "hidden",
      transition: "box-shadow 0.25s ease, border-color 0.3s ease",
    }}>

      {/* ── Header ── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", padding: "14px 16px",
          display: "flex", alignItems: "center", gap: "13px",
          background: "none", border: "none", cursor: "pointer",
          textAlign: "left",
        }}
      >
        {/* Number badge */}
        <div style={{
          width: "38px", height: "38px", flexShrink: 0,
          borderRadius: "2px",
          background: allDone
            ? `linear-gradient(135deg, ${C.accentMint}, #4ec5a8)`
            : `linear-gradient(135deg, #fef3ee, #fde8dc)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "12px", fontWeight: "700",
          color: allDone ? "white" : C.accent,
          letterSpacing: "0.03em",
          boxShadow: allDone ? `0 3px 12px ${C.accentMint}55` : "none",
        }}>
          {String(tronconIndex + 1).padStart(2, "0")}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "var(--font-main, sans-serif)",
            fontSize: "14px", fontWeight: "700",
            color: C.textPrimary, letterSpacing: "-0.02em",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            marginBottom: "5px",
          }}>
            {startCity} → {endCity}
          </div>
          {/* Progress bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <div style={{
              flex: 1, height: "5px",
              background: "#c8d4e8",
              borderRadius: "2px", overflow: "hidden",
            }}>
              <div style={{
                width: `${progress * 100}%`, height: "100%",
                background: allDone
                  ? `linear-gradient(90deg, ${C.accentMint}, #4ec5a8)`
                  : `linear-gradient(90deg, ${C.progressStart}, ${C.progressEnd})`,
                borderRadius: "2px",
                transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)",
              }} />
            </div>
            <span style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "10px", color: C.textMuted, flexShrink: 0,
            }}>
              {visitedCount}/{total}
            </span>
          </div>
        </div>

        <div style={{ color: C.textMuted }}>
          <IconChevron open={open} />
        </div>
      </button>

      {/* ── Expanded body ── */}
      {open && (
        <div style={{ borderTop: `1px solid ${C.cardBorder}`, padding: "14px 14px 10px" }}>

          {/* Map thumbnail */}
          <MapThumbnail stops={stops} locMap={locMap} />

          {/* Maps button */}
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: "8px",
                width: "100%", padding: "13px",
                borderRadius: C.radiusSm,
                background: `linear-gradient(135deg, ${C.progressStart} 0%, ${C.accentAlt} 100%)`,
                color: "white",
                fontFamily: "var(--font-main, sans-serif)",
                fontSize: "13px", fontWeight: "700",
                letterSpacing: "0.04em", textTransform: "uppercase",
                textDecoration: "none",
                boxShadow: `0 6px 20px ${C.accent}44`,
                marginBottom: "14px",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
            >
              <IconMap />
              Lancer l'itinéraire
            </a>
          )}

          <CommentBox
            targetType="route"
            targetId={troncon.id}
            title={`${startCity} → ${endCity}`}
            user={user}
          />

          {/* Location list */}
          <div>
            {locs.map((loc, idx) => (
              <LocationRow
                key={loc.id + idx}
                loc={loc}
                isVisited={!!visited[loc.id]}
                onToggle={onToggle}
                isOverlap={loc.id === overlapId}
                user={user}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── GLOBAL PROGRESS ──────────────────────────────────────────────────────────
function GlobalProgress({ visitedCount, total }) {
  const pct = total > 0 ? (visitedCount / total) * 100 : 0;
  const segments = 5;
  const filled = Math.round((pct / 100) * segments);

  return (
    <div style={{ padding: "22px 18px 16px" }}>
      {/* Title row */}
      <div style={{
        display: "flex", alignItems: "flex-end",
        justifyContent: "space-between", marginBottom: "14px",
      }}>
        <div>
          <div style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "9.5px", letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: C.accent, marginBottom: "5px",
          }}>
            Tour de Phrance · GR-Routier
          </div>
          <div style={{
            fontFamily: "var(--font-main, sans-serif)",
            fontSize: "26px", fontWeight: "800",
            color: C.textPrimary, letterSpacing: "-0.03em", lineHeight: "1",
          }}>
            {visitedCount}
            <span style={{ fontSize: "15px", fontWeight: "500", color: C.textMuted, marginLeft: "4px" }}>
              / {total} lieux
            </span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{
            fontFamily: "var(--font-main, sans-serif)",
            fontSize: "28px", fontWeight: "800", letterSpacing: "-0.03em",
            background: `linear-gradient(135deg, ${C.progressStart}, ${C.progressEnd})`,
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
        height: "10px",
        background: "#ede8e0",
        borderRadius: "2px", overflow: "hidden",
        position: "relative",
      }}>
        <div style={{
          width: `${pct}%`, height: "100%",
          background: `linear-gradient(90deg, ${C.progressStart}, ${C.accentAlt})`,
          borderRadius: "2px",
          transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
          position: "relative",
        }}>
          {pct > 2 && (
            <div style={{
              position: "absolute", right: 0, top: 0, bottom: 0,
              width: "20px",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35))",
              borderRadius: "0 2px 2px 0",
            }} />
          )}
        </div>
      </div>

      {/* Balisage dots */}
      <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "10px" }}>
        {Array.from({ length: segments }).map((_, i) => (
          <div key={i} style={{
            width: i < filled ? "18px" : "8px",
            height: "8px",
            borderRadius: "2px",
            background: i < filled
              ? `linear-gradient(90deg, ${C.progressStart}, ${C.accentAlt})`
              : "#ede8e0",
            transition: "all 0.4s ease",
          }} />
        ))}
        <span style={{
          fontSize: "9px", color: C.textMuted,
          fontFamily: "var(--font-mono, monospace)",
          marginLeft: "5px", letterSpacing: "0.08em",
        }}>
          BALISAGE
        </span>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function RoadtripApp({ user, authLoading, isSupabaseConfigured }) {
  const { visited, toggle, reset, syncStatus } = useVisited(user);
  const [confirmReset, setConfirmReset] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showHeader, setShowHeader] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const locMap = useMemo(() => {
    const m = { "start-0": KM0 };
    RAW_LOCATIONS.forEach(loc => { m[loc.id] = loc; });
    return m;
  }, []);

  const allVisitableIds = useMemo(() => {
    const seen = new Set();
    RAW_ITINERARIES.forEach((t, idx) => {
      t.stops.forEach((id, i) => {
        if (idx > 0 && i === 0) return;
        seen.add(id);
      });
    });
    return [...seen];
  }, []);

  const visitedCount = allVisitableIds.filter(id => visited[id]).length;
  const total = allVisitableIds.length;

  const filteredItineraries = useMemo(() => {
    if (!searchQuery.trim()) return RAW_ITINERARIES;
    const q = searchQuery.toLowerCase();
    return RAW_ITINERARIES.filter(t =>
      t.stops.some(id => {
        const loc = locMap[id];
        return loc && (
          loc.name?.toLowerCase().includes(q) ||
          loc.city?.toLowerCase().includes(q)
        );
      }) || t.name.toLowerCase().includes(q)
    );
  }, [searchQuery, locMap]);

  return (
    <div style={{
      width: "100%",
      height: "100%",
      flex: 1,
      overflow: "auto",
      background: "#0a0812",
      color: C.textPrimary,
      fontFamily: "var(--font-main, sans-serif)",
      position: "relative",
    }}>
      <div style={{
        maxWidth: "600px",
        margin: "0 auto",
        background: "#eef2f8",
        minHeight: "100%",
      }}>
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }
        button:focus-visible { outline: 2px solid ${C.accent}; outline-offset: 2px; }
        a:hover > div { transform: translateY(-1px); }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

        {/* ── Toggle mobile ── */}
        {isMobile && (
          <button
            onClick={() => setShowHeader(h => !h)}
            style={{
              width: "100%",
              padding: "10px 16px",
              background: "#111",
              border: "1px solid #333",
              color: "#ccc",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              letterSpacing: "0.1em",
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            {showHeader ? "▲ RÉDUIRE" : "▼ DÉPLIER LES CONTRÔLES"}
          </button>
        )}

        {/* ── Sticky header ── */}
        {(!isMobile || showHeader) && (
          <div style={{
            position: "sticky", top: 0, zIndex: 100,
            background: "#e8eef8",
            backdropFilter: "blur(16px)",
            borderBottom: `1px solid ${C.cardBorder}`,
          }}>
            <GlobalProgress visitedCount={visitedCount} total={total} />
            <div className="sync-strip">
              {isSupabaseConfigured
                ? (user ? `Compte connecté · progression ${syncStatus === "synced" ? "synchronisée" : syncStatus}` : "Mode local · connecte-toi pour synchroniser")
                : "Mode local · Supabase non configuré"}
            </div>

            {/* Search */}
            <div style={{ padding: "0 16px 14px" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "10px",
                background: "#e0eaf5",
                border: "1px solid #333",
                borderRadius: "2px",
                padding: "9px 14px",
                boxShadow: "none",
              }}>
                <span style={{ fontSize: "14px", color: C.textMuted }}>🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un lieu, une ville..."
                  style={{
                    flex: 1, border: "none", outline: "none",
                    fontFamily: "var(--font-main, sans-serif)",
                    fontSize: "13.5px", color: C.textPrimary,
                    background: "transparent",
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: C.textMuted, fontSize: "16px", padding: "0", lineHeight: "1",
                    }}
                  >×</button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Troncon list ── */}
        <div style={{ padding: "12px 12px 100px" }}>
          {filteredItineraries.length === 0 && (
            <div style={{
              textAlign: "center", padding: "50px 20px",
              color: C.textMuted, fontFamily: "var(--font-mono, monospace)",
              fontSize: "13px",
            }}>
              Aucun tronçon trouvé pour "{searchQuery}"
            </div>
          )}
          {filteredItineraries.map((troncon, idx) => {
            const realIdx = RAW_ITINERARIES.indexOf(troncon);
            return (
              <div key={troncon.id} style={{ animation: `fadeSlide 0.3s ease both`, animationDelay: `${idx * 0.03}s` }}>
                <TronconCard
                  troncon={troncon}
                  locMap={locMap}
                  visited={visited}
                  onToggle={toggle}
                  tronconIndex={realIdx}
                  user={user}
                />
              </div>
            );
          })}
        </div>

        {/* ── Footer ── */}
        <div style={{
          position: "sticky", bottom: 0,
          width: "100%",
          padding: "12px 16px",
          background: "#e8eef8",
          backdropFilter: "blur(16px)",
          borderTop: `1px solid ${C.cardBorder}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          zIndex: 50,
        }}>
          <div style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "10px", color: C.textMuted, letterSpacing: "0.05em",
          }}>
            {visitedCount === total && total > 0 ? "🎉 Tour complété !" : `${total - visitedCount} lieux restants`}
          </div>

          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              style={{
                padding: "7px 14px", borderRadius: "2px",
                background: "transparent",
                border: "1px solid #333",
                color: C.textMuted, cursor: "pointer",
                fontFamily: "var(--font-main, sans-serif)",
                fontSize: "12px", fontWeight: "500",
                transition: "all 0.2s",
              }}
            >
              Réinitialiser
            </button>
          ) : (
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => { reset(); setConfirmReset(false); }}
                style={{
                  padding: "7px 14px", borderRadius: "2px",
                  background: "#fee2e2", border: "none",
                  color: "#dc2626", cursor: "pointer",
                  fontFamily: "var(--font-main, sans-serif)",
                  fontSize: "12px", fontWeight: "700",
                }}
              >Confirmer</button>
              <button
                onClick={() => setConfirmReset(false)}
                style={{
                  padding: "7px 14px", borderRadius: "2px",
                  background: "#e0eaf5", border: "1px solid #333",
                  color: C.textSecondary, cursor: "pointer",
                  fontFamily: "var(--font-main, sans-serif)",
                  fontSize: "12px",
                }}
              >Annuler</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}