// Le catalogue en mode connecté, contre le faux Supabase (vue `catalogue` simulée).
// Prérequis : npx vite build -c vite.fake.config.js && npx vite preview -c vite.fake.config.js --port 4174
import { chromium } from "playwright";

const b = await chromium.launch();
const errs = [];
const c = await b.newContext({ viewport: { width: 430, height: 1100 } });
const p = await c.newPage();
p.on("pageerror", (e) => errs.push("JS: " + e.message));
p.on("console", (m) => { if (m.type() === "error" && !m.text().includes("TUNNEL")) errs.push("C: " + m.text()); });

await p.goto("http://localhost:4174/");
await p.waitForSelector(".roadtrip-column");

// Deux comptes : le livre de quelqu'un d'autre doit apparaître au catalogue.
await p.evaluate(() => {
  const t = new Date().toISOString();
  window.__db.profiles.push({ id: "u1", pseudo: "Jeanson Péchin" }, { id: "u2", pseudo: "Une autre" });
  window.__db.books.push(
    { id: "b1", owner_id: "u1", title: "Chéquier Claude Monnaie", visible: true, price_cents: 1500, year: 2026, created_at: t },
    { id: "b2", owner_id: "u2", title: "Livre de quelqu'un d'autre", visible: true, created_at: t },
    { id: "b3", owner_id: "u2", title: "Livre discret", visible: false, created_at: t }
  );
  window.__db.checkins.push(
    { id: "c1", book_id: "b1", user_id: "u1", place_id: "occitanie-1", status: "deposited", created_at: t },
    { id: "c2", book_id: "b1", user_id: "u1", place_id: "occitanie-2", status: "refused", created_at: t },
    { id: "c3", book_id: "b2", user_id: "u2", place_id: "bretagne-1", status: "deposited", created_at: t },
    { id: "c4", book_id: "b3", user_id: "u2", place_id: "bretagne-3", status: "deposited", created_at: t }
  );
  window.__fakeAuth.setUser({ id: "u1", email: "jeanson@test" });
});

await p.click(".nav-tabs button:has-text('Livres')");
await p.waitForSelector(".cat-book");
const titres = await p.locator(".cat-book h2").allTextContents();
console.log("livres au catalogue :", titres);
console.log("le livre discret est-il masqué ?", titres.includes("Livre discret") ? "NON — BUG" : "oui");
console.log("le livre d'un autre compte apparaît ?", titres.includes("Livre de quelqu'un d'autre") ? "oui" : "NON — BUG");
console.log("signatures :", await p.locator(".cat-by").allTextContents());
console.log("stats :", await p.textContent(".cat-stats"));

// le lieu refusé ne doit pas être listé
await p.locator(".cat-book").first().locator(".cat-toggle").click();
await p.waitForSelector(".cat-places li");
console.log("adresses du 1er livre :", await p.locator(".cat-book").first().locator(".cat-places li a").allTextContents());

// reprise du dépôt → sortie du catalogue
await p.evaluate(() => {
  window.__db.checkins.push({ id: "c5", book_id: "b1", user_id: "u1", place_id: "occitanie-1", status: "follow_up", created_at: new Date(Date.now() + 1000).toISOString() });
});
await p.click(".nav-tabs button:has-text('Carte')");
await p.waitForTimeout(200);
await p.click(".nav-tabs button:has-text('Livres')");
await p.waitForTimeout(600);
const apres = await p.locator(".cat-book h2").allTextContents();
console.log("après reprise du dépôt :", apres);

await b.close();
console.log("ERREURS :", errs.length ? errs : "aucune");
