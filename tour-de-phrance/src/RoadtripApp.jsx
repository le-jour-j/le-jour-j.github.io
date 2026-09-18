import { useState, useEffect, useMemo } from "react";
import StatusPicker from "./components/StatusPicker.jsx";
import { statusInfo } from "./lib/statuses.js";
import { typeLabel, FIT_LABELS, STATUS_LABELS } from "./lib/placeMeta.js";
import CommentBox from "./components/CommentBox.jsx";
import { RAW_LOCATIONS } from "./data/locations.js";
import { RAW_ITINERARIES } from "./data/itineraries.js";

// ─── GOOGLE MAPS API KEY ──────────────────────────────────────────────────────
import { GOOGLE_MAPS_API_KEY } from "./config/googleMapsConfig.js";


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

function getRegionStyle(loc) {
  const region = (typeof loc === "string" ? loc.replace(/-\d+$/, "") : loc?.region) || "";
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


// ─── LOCATION ROW ─────────────────────────────────────────────────────────────
function LocationRow({ loc, books, activeBook, tour, isOverlap, user, sold }) {
  const rs = getRegionStyle(loc);
  // Pastilles : une par livre. Sans livre (mode local vierge) : une pastille
  // générique qui créera le livre par défaut au premier résultat choisi.
  const pickerBooks = books.length > 0 ? books : [null];
  const activeLatest = activeBook ? tour.latest(activeBook.id, loc.id) : null;
  const activeInfo = activeLatest ? statusInfo(activeLatest.status) : null;
  const fit = FIT_LABELS[loc.fit];
  const state = STATUS_LABELS[loc.status];

  async function handlePick(bookId, placeId, status, note) {
    let id = bookId;
    if (!id) {
      const created = await tour.ensureBook();
      id = created?.id;
    }
    if (id) await tour.addCheckin(id, placeId, status, note);
  }

  return (
    <div
      className={"location-row" + (loc.fit === "oui" ? " is-target" : "")}
      style={{
        opacity: isOverlap ? 0.38 : 1,
        background: activeInfo ? activeInfo.bg : "transparent",
        borderLeft: activeInfo ? `3px solid ${activeInfo.color}` : "3px solid transparent",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px", flexWrap: "wrap" }}>
          <span className="location-name" style={{ color: activeInfo ? activeInfo.color : C.textPrimary }}>
            {loc.name}
          </span>
          {loc.city && (
            <span className="region-tag" style={{ color: rs.text, background: rs.bg }}>
              <span style={{ color: rs.dot, fontSize: "8px" }}>●</span>
              {loc.city}
            </span>
          )}
          {!isOverlap && fit && loc.fit !== "possible" && (
            <span className="meta-tag" style={{ color: fit.color, background: fit.bg }} title={fit.title}>
              {fit.short}
            </span>
          )}
          {!isOverlap && state && (
            <span className="meta-tag" style={{ color: state.color, background: state.bg }} title={state.title}>
              {state.short}
            </span>
          )}
        </div>

        {!isOverlap && (loc.type || loc.address) && (
          <div className="location-address">
            {loc.type && <span className="location-type">{typeLabel(loc.type)}</span>}
            {loc.address && loc.address !== "..." && (
              <>
                {loc.type && " · "}
                {loc.address}
                {loc.verified_address === false && <span title="Adresse non vérifiée sur le web"> (à vérifier)</span>}
              </>
            )}
          </div>
        )}

        {loc.description && !isOverlap && (
          <p className="location-description">{loc.description}</p>
        )}

        {!isOverlap && sold && sold.length > 0 && (
          <p className="location-sold">
            En vente ici : {sold.map((s) => s.book_title).join(", ")}
          </p>
        )}

        {loc.field_note && !isOverlap && (
          <p className="location-fieldnote" title="Note prise sur place lors de la tournée n°1">
            Sur place : {loc.field_note}
          </p>
        )}

        {!isOverlap && loc.website && (
          <a
            className="location-link"
            href={loc.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            Site du lieu ↗
          </a>
        )}

        {isOverlap && (
          <div className="location-overlap">Relais depuis l'étape précédente</div>
        )}

        {!isOverlap && (
          <div className="status-row">
            {pickerBooks.map((b) => (
              <StatusPicker
                key={b ? b.id : "none"}
                book={b}
                placeId={loc.id}
                current={b ? tour.latest(b.id, loc.id) : null}
                history={b ? tour.historyFor(b.id, loc.id) : []}
                onPick={handlePick}
                onUndo={tour.undoLatest}
                compact={books.length <= 1}
              />
            ))}
          </div>
        )}

        {!isOverlap && (
          <CommentBox targetType="location" targetId={loc.id} title={loc.name} user={user} />
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
function TronconCard({ troncon, locMap, books, activeBook, tour, tronconIndex, user, targetsOnly, byPlace }) {
  const [open, setOpen] = useState(false);
  const stops = troncon.stops;
  const overlapId = tronconIndex > 0 ? stops[0] : null;

  const locs = stops.map(id =>
    id === "start-0" ? KM0 : (locMap[id] || { id, name: id, address: "", city: "" })
  );

  const visitableIds = stops.filter(id => id !== overlapId);
  const targetCount = visitableIds.filter(id => locMap[id]?.fit === "oui").length;
  const shownLocs = targetsOnly
    ? locs.filter(l => l.id === overlapId || l.fit === "oui")
    : locs;
  const total = visitableIds.length;
  const passedCount = activeBook ? visitableIds.filter(id => tour.latest(activeBook.id, id)).length : 0;
  const depositedCount = activeBook ? visitableIds.filter(id => tour.latest(activeBook.id, id)?.status === "deposited").length : 0;
  const progress = total > 0 ? passedCount / total : 0;
  const allDone = passedCount === total && total > 0;

  const mapsUrl = useMemo(() => buildMapsUrl(stops, locMap), [stops, locMap]);

  const startCity = locs[0]?.city || locs[0]?.name || "?";
  const endCity = locs[locs.length - 1]?.city || locs[locs.length - 1]?.name || "?";

  return (
    <div style={{
      marginBottom: "10px",
      borderRadius: C.radius,
      border: allDone ? `1.5px solid ${C.accentMint}` : `1.5px solid ${C.cardBorder}`,
      background: C.card,
      overflow: "hidden",
      transition: "border-color 0.3s ease",
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", padding: "14px 16px",
          display: "flex", alignItems: "center", gap: "13px",
          background: "none", border: "none", cursor: "pointer", textAlign: "left",
        }}
      >
        <div style={{
          width: "38px", height: "38px", flexShrink: 0, borderRadius: "2px",
          background: allDone
            ? `linear-gradient(135deg, ${C.accentMint}, #4ec5a8)`
            : `linear-gradient(135deg, #fef3ee, #fde8dc)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-mono, monospace)", fontSize: "12px", fontWeight: "700",
          color: allDone ? "white" : C.accent, letterSpacing: "0.03em",
        }}>
          {String(tronconIndex + 1).padStart(2, "0")}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "var(--font-main, sans-serif)", fontSize: "14px", fontWeight: "700",
            color: C.textPrimary, letterSpacing: "-0.02em",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "5px",
          }}>
            {startCity} → {endCity}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <div style={{ flex: 1, height: "5px", background: "#c8d4e8", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{
                width: `${progress * 100}%`, height: "100%",
                background: allDone
                  ? `linear-gradient(90deg, ${C.accentMint}, #4ec5a8)`
                  : `linear-gradient(90deg, ${C.progressStart}, ${C.progressEnd})`,
                borderRadius: "2px", transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)",
              }} />
            </div>
            <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "10px", color: C.textMuted, flexShrink: 0 }}>
              {passedCount}/{total}{depositedCount > 0 ? ` · ${depositedCount} déposé${depositedCount > 1 ? "s" : ""}` : ""}{targetCount > 0 ? ` · ${targetCount} cible${targetCount > 1 ? "s" : ""}` : ""}
            </span>
          </div>
        </div>

        <div style={{ color: C.textMuted }}>
          <IconChevron open={open} />
        </div>
      </button>

      {open && (
        <div style={{ borderTop: `1px solid ${C.cardBorder}`, padding: "14px 14px 10px" }}>
          <MapThumbnail stops={stops} locMap={locMap} />
          {stops.length > 10 && GOOGLE_MAPS_API_KEY && (
            <div className="map-notice">
              L'aperçu ne montre que les 10 premières étapes ; le bouton ci-dessous ouvre l'itinéraire complet.
            </div>
          )}

          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="maps-button">
              <IconMap />
              Lancer l'itinéraire
            </a>
          )}

          <CommentBox targetType="route" targetId={troncon.id} title={`${startCity} → ${endCity}`} user={user} />

          <div>
            {shownLocs.map((loc, idx) => (
              <LocationRow
                key={loc.id + idx}
                loc={loc}
                books={books}
                activeBook={activeBook}
                tour={tour}
                isOverlap={loc.id === overlapId}
                user={user}
                sold={byPlace?.[loc.id]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BOOK BAR ────────────────────────────────────────────────────────────────
function BookBar({ books, activeBook, onSelect, onCreate }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    await onCreate(title);
    setTitle("");
    setAdding(false);
  }

  return (
    <div className="book-bar">
      <span className="book-bar-label">Livre suivi</span>
      {books.map((b) => (
        <button
          key={b.id}
          type="button"
          className={"book-chip" + (activeBook?.id === b.id ? " active" : "")}
          onClick={() => onSelect(b.id)}
        >
          {b.title}
        </button>
      ))}
      {adding ? (
        <form onSubmit={submit} className="book-add-form">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre du livre"
            maxLength={120}
          />
          <button type="submit">OK</button>
          <button type="button" onClick={() => { setAdding(false); setTitle(""); }}>×</button>
        </form>
      ) : (
        <button type="button" className="book-chip add" onClick={() => setAdding(true)} title="Ajouter un livre">
          + livre
        </button>
      )}
    </div>
  );
}

// ─── GLOBAL PROGRESS ──────────────────────────────────────────────────────────
function GlobalProgress({ passedCount, depositedCount, total, bookTitle }) {
  const pct = total > 0 ? (passedCount / total) * 100 : 0;
  const segments = 5;
  const filled = Math.round((pct / 100) * segments);

  return (
    <div style={{ padding: "22px 18px 12px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "14px" }}>
        <div>
          <div style={{
            fontFamily: "var(--font-mono, monospace)", fontSize: "9.5px", letterSpacing: "0.18em",
            textTransform: "uppercase", color: C.accent, marginBottom: "5px",
          }}>
            Tour de Phrance · GR-Routier{bookTitle ? ` · ${bookTitle}` : ""}
          </div>
          <div style={{
            fontFamily: "var(--font-main, sans-serif)", fontSize: "26px", fontWeight: "800",
            color: C.textPrimary, letterSpacing: "-0.03em", lineHeight: "1",
          }}>
            {passedCount}
            <span style={{ fontSize: "15px", fontWeight: "500", color: C.textMuted, marginLeft: "4px" }}>
              / {total} lieux
            </span>
          </div>
          <div style={{ fontSize: "11px", color: C.visitedText, fontFamily: "var(--font-mono, monospace)", marginTop: "4px" }}>
            {depositedCount} en dépôt
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{
            fontFamily: "var(--font-main, sans-serif)", fontSize: "28px", fontWeight: "800", letterSpacing: "-0.03em",
            background: `linear-gradient(135deg, ${C.progressStart}, ${C.progressEnd})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            {pct.toFixed(1)}%
          </div>
        </div>
      </div>

      <div style={{ height: "10px", background: "#ede8e0", borderRadius: "2px", overflow: "hidden", position: "relative" }}>
        <div style={{
          width: `${pct}%`, height: "100%",
          background: `linear-gradient(90deg, ${C.progressStart}, ${C.accentAlt})`,
          borderRadius: "2px", transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)", position: "relative",
        }}>
          {pct > 2 && (
            <div style={{
              position: "absolute", right: 0, top: 0, bottom: 0, width: "20px",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35))",
              borderRadius: "0 2px 2px 0",
            }} />
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "10px" }}>
        {Array.from({ length: segments }).map((_, i) => (
          <div key={i} style={{
            width: i < filled ? "18px" : "8px", height: "8px", borderRadius: "2px",
            background: i < filled ? `linear-gradient(90deg, ${C.progressStart}, ${C.accentAlt})` : "#ede8e0",
            transition: "all 0.4s ease",
          }} />
        ))}
        <span style={{ fontSize: "9px", color: C.textMuted, fontFamily: "var(--font-mono, monospace)", marginLeft: "5px", letterSpacing: "0.08em" }}>
          BALISAGE
        </span>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function RoadtripApp({ user, isSupabaseConfigured, tour, catalogue }) {
  const { books, activeBook, syncStatus } = tour;
  const [confirmReset, setConfirmReset] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [targetsOnly, setTargetsOnly] = useState(false);
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

  const total = allVisitableIds.length;
  const targetTotal = allVisitableIds.filter(id => locMap[id]?.fit === "oui").length;
  const passedCount = activeBook ? allVisitableIds.filter(id => tour.latest(activeBook.id, id)).length : 0;
  const depositedCount = activeBook ? allVisitableIds.filter(id => tour.latest(activeBook.id, id)?.status === "deposited").length : 0;

  const filteredItineraries = useMemo(() => {
    let list = RAW_ITINERARIES;
    if (targetsOnly) {
      list = list.filter(t => t.stops.some(id => locMap[id]?.fit === "oui"));
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(t =>
      t.stops.some(id => {
        const loc = locMap[id];
        return loc && (
          loc.name?.toLowerCase().includes(q) ||
          loc.city?.toLowerCase().includes(q)
        );
      }) || t.name.toLowerCase().includes(q)
    );
  }, [searchQuery, targetsOnly, locMap]);

  const syncLabel = isSupabaseConfigured
    ? (user
        ? `Compte connecté · ${syncStatus === "synced" ? "synchronisé" : syncStatus === "syncing" ? "synchronisation…" : syncStatus === "error" ? "erreur de synchronisation" : syncStatus}`
        : "Mode local · connecte-toi pour retrouver tes passages partout")
    : "Mode local · Supabase non configuré";

  return (
    <div className="roadtrip-root" style={{ color: C.textPrimary }}>
      <div className="roadtrip-column">

        {isMobile && (
          <button className="mobile-toggle" onClick={() => setShowHeader(h => !h)}>
            {showHeader ? "▲ RÉDUIRE" : `▼ ${passedCount}/${total} · CONTRÔLES`}
          </button>
        )}

        {(!isMobile || showHeader) && (
          <div className="sticky-header">
            <GlobalProgress
              passedCount={passedCount}
              depositedCount={depositedCount}
              total={total}
              bookTitle={books.length > 1 ? activeBook?.title : null}
            />
            <BookBar
              books={books}
              activeBook={activeBook}
              onSelect={tour.setActiveBookId}
              onCreate={tour.createBook}
            />
            <div className="sync-strip">{syncLabel}</div>

            <div style={{ padding: "0 16px 14px" }}>
              <div className="search-box">
                <span style={{ fontSize: "14px", color: C.textMuted }}>🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un lieu, une ville..."
                />
                {searchQuery && (
                  <button className="search-clear" onClick={() => setSearchQuery("")}>×</button>
                )}
              </div>
              <label className="targets-filter">
                <input
                  type="checkbox"
                  checked={targetsOnly}
                  onChange={(e) => setTargetsOnly(e.target.checked)}
                />
                Cibles seulement ({targetTotal} lieux qui diffusent de la micro-édition)
              </label>
            </div>
          </div>
        )}

        <div style={{ padding: "12px 12px 100px" }}>
          {filteredItineraries.length === 0 && (
            <div className="empty-state">Aucun tronçon trouvé pour "{searchQuery}"</div>
          )}
          {filteredItineraries.map((troncon, idx) => {
            const realIdx = RAW_ITINERARIES.indexOf(troncon);
            return (
              <div key={troncon.id} style={{ animation: `fadeSlide 0.3s ease both`, animationDelay: `${idx * 0.03}s` }}>
                <TronconCard
                  troncon={troncon}
                  locMap={locMap}
                  books={books}
                  activeBook={activeBook}
                  tour={tour}
                  tronconIndex={realIdx}
                  user={user}
                  targetsOnly={targetsOnly}
                  byPlace={catalogue?.byPlace}
                />
              </div>
            );
          })}
        </div>

        <div className="roadtrip-footer">
          <div className="footer-count">
            {passedCount === total && total > 0 ? "🎉 Tour complété !" : `${total - passedCount} lieux restants`}
          </div>

          {!confirmReset ? (
            <button className="footer-button" onClick={() => setConfirmReset(true)} disabled={!activeBook}>
              Réinitialiser{books.length > 1 && activeBook ? ` « ${activeBook.title} »` : ""}
            </button>
          ) : (
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="footer-button danger" onClick={async () => { await tour.resetBook(activeBook?.id); setConfirmReset(false); }}>
                Confirmer
              </button>
              <button className="footer-button" onClick={() => setConfirmReset(false)}>Annuler</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
