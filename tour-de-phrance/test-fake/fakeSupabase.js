// Faux client Supabase en mémoire pour tester le chemin « compte connecté ».
// Simule from().select/insert/update/delete + auth (session pilotée par window.__fakeAuth).
const db = { books: [], checkins: [], comments: [], profiles: [] };
window.__db = db;
let seq = 0;
const uuid = () => "srv-" + (++seq);
window.__delay = 30; // latence simulée (ms)

// Reproduit la vue SQL `catalogue` : dernier passage de chaque couple
// livre × lieu, gardé seulement s'il vaut « déposé », sur un livre visible.
// Ne doit jamais exposer note ni user_id — comme la vraie vue.
function vueCatalogue() {
  const dernier = {};
  for (const c of db.checkins) {
    const k = c.book_id + "|" + c.place_id;
    if (!dernier[k] || new Date(c.created_at) > new Date(dernier[k].created_at)) dernier[k] = c;
  }
  const out = [];
  for (const c of Object.values(dernier)) {
    if (c.status !== "deposited") continue;
    const b = db.books.find(x => x.id === c.book_id);
    if (!b || b.visible === false) continue;
    const prof = db.profiles.find(x => x.id === b.owner_id);
    out.push({
      book_id: b.id, book_title: b.title, book_description: b.description ?? null,
      book_author: b.author ?? null, book_year: b.year ?? null,
      book_price_cents: b.price_cents ?? null, book_url: b.url ?? null,
      book_created_at: b.created_at, owner_pseudo: prof?.pseudo ?? null,
      place_id: c.place_id, deposited_at: c.created_at,
    });
  }
  return out;
}

class Query {
  constructor(table) { this.table = table; this.op = "select"; this.filters = []; this.payload = null; this.single_ = false; this.wantSelect = false; }
  select(cols) { if (this.op === "select") {} else this.wantSelect = true; return this; }
  insert(p) { this.op = "insert"; this.payload = p; return this; }
  update(p) { this.op = "update"; this.payload = p; return this; }
  delete() { this.op = "delete"; return this; }
  eq(k, v) { this.filters.push([k, v]); return this; }
  order() { return this; }
  limit() { return this; }
  single() { this.single_ = true; return this; }
  maybeSingle() { this.single_ = true; this.maybe_ = true; return this; }
  upsert(p, opts) { this.op = "upsert"; this.payload = p; this.onConflict = opts?.onConflict || "id"; return this; }
  _match(row) { return this.filters.every(([k, v]) => row[k] === v); }
  async _run() {
    await new Promise(r => setTimeout(r, window.__delay));
    const rows = this.table === "catalogue" ? vueCatalogue() : db[this.table];
    if (!rows) return { data: this.single_ ? null : [], error: { message: "relation « " + this.table + " » inconnue" } };
    const uid = window.__fakeAuth.user?.id;
    if (this.op === "select") {
      const out = rows.filter(r => this._match(r));
      if (this.single_) {
        if (out.length) return { data: out[0], error: null };
        return this.maybe_ ? { data: null, error: null } : { data: null, error: { message: "no rows" } };
      }
      return { data: out, error: null };
    }
    if (this.op === "insert") {
      const list = Array.isArray(this.payload) ? this.payload : [this.payload];
      const created = [];
      for (const p of list) {
        // RLS simulée
        if (this.table === "books" && p.owner_id !== uid) return { data: null, error: { message: "RLS books" } };
        if (this.table === "checkins") {
          if (p.user_id !== uid) return { data: null, error: { message: "RLS checkins user" } };
          if (!db.books.some(b => b.id === p.book_id && b.owner_id === uid)) return { data: null, error: { message: "RLS checkins book" } };
        }
        const row = { id: uuid(), created_at: new Date().toISOString(), visible: true, note: null, ...p };
        rows.push(row); created.push(row);
      }
      window.__inserts = (window.__inserts || 0) + created.length;
      if (!this.wantSelect) return { data: null, error: null };
      return this.single_ ? { data: created[0], error: null } : { data: created, error: null };
    }
    if (this.op === "upsert") {
      const keys = this.onConflict.split(",").map(k => k.trim());
      const list = Array.isArray(this.payload) ? this.payload : [this.payload];
      for (const item of list) {
        const existant = rows.find(r => keys.every(k => r[k] === item[k]));
        if (existant) Object.assign(existant, item);
        else rows.push({ created_at: new Date().toISOString(), ...item });
      }
      return { data: null, error: null };
    }
    if (this.op === "update") {
      rows.forEach(r => { if (this._match(r)) Object.assign(r, this.payload); });
      return { data: null, error: null };
    }
    if (this.op === "delete") {
      const keep = rows.filter(r => !this._match(r));
      const removed = rows.length - keep.length;
      db[this.table] = keep;
      if (this.table === "books") db.checkins = db.checkins.filter(c => db.books.some(b => b.id === c.book_id)); // cascade
      return { data: null, error: null, count: removed };
    }
  }
  then(res, rej) { return this._run().then(res, rej); }
}

const listeners = new Set();
window.__fakeAuth = {
  user: null,
  setUser(u) { this.user = u; const s = u ? { user: u } : null; listeners.forEach(fn => fn("CHANGE", s)); },
};

export const isSupabaseConfigured = true;
export const supabase = {
  from: (t) => new Query(t),
  auth: {
    getSession: async () => ({ data: { session: window.__fakeAuth.user ? { user: window.__fakeAuth.user } : null } }),
    onAuthStateChange: (fn) => { listeners.add(fn); return { data: { subscription: { unsubscribe: () => listeners.delete(fn) } } }; },
    signOut: async () => window.__fakeAuth.setUser(null),
  },
  channel: () => ({ on() { return this; }, subscribe() { return this; } }),
  removeChannel() {},
};
