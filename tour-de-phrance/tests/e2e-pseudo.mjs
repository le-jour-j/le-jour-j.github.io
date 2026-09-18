// Flux « changer son pseudo public », contre le faux Supabase en mémoire.
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

// un compte existant, avec un pseudo à changer
await p.evaluate(() => {
  window.__db.profiles.push({ id: "u1", pseudo: "toutou" });
  window.__db.books.push({ id: "b1", owner_id: "u1", title: "Chéquier Claude Monnaie", visible: true, created_at: new Date().toISOString() });
  window.__fakeAuth.setUser({ id: "u1", email: "jeanson@test" });
});
await p.click(".nav-tabs button:has-text('Compte')");
await p.waitForSelector("#pseudo-public");
console.log("pseudo chargé :", await p.inputValue("#pseudo-public"));

await p.fill("#pseudo-public", "Jeanson Péchin");
await p.click('.pseudo-form button[type="submit"]');
await p.waitForTimeout(300);
console.log("message :", await p.textContent(".pseudo-form .form-message"));
console.log("en base :", await p.evaluate(() => window.__db.profiles.map((x) => x.pseudo)));

// il doit survivre à un rechargement de l'onglet
await p.click(".nav-tabs button:has-text('Carte')");
await p.waitForTimeout(150);
await p.click(".nav-tabs button:has-text('Compte')");
await p.waitForSelector("#pseudo-public");
console.log("après retour :", await p.inputValue("#pseudo-public"));

// un pseudo vide est refusé
await p.fill("#pseudo-public", "   ");
await p.click('.pseudo-form button[type="submit"]');
await p.waitForTimeout(200);
console.log("pseudo vide :", await p.textContent(".pseudo-form .form-message"));
console.log("en base après tentative :", await p.evaluate(() => window.__db.profiles.map((x) => x.pseudo)));

await b.close();
console.log("ERREURS :", errs.length ? errs : "aucune");
