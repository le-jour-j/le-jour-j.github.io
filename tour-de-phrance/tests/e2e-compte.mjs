import { chromium } from "playwright";
const b = await chromium.launch();
const errors = [];
const ctx = await b.newContext({ viewport: { width: 1000, height: 900 } });
const page = await ctx.newPage();
page.on("pageerror", e => errors.push("pageerror: " + e.message));
page.on("console", m => { if (m.type() === "warning" || m.type()==="error") errors.push(m.type()+": " + m.text()); });
await page.goto("http://localhost:4174/");
await page.waitForSelector(".roadtrip-column");
const openT1 = async () => { if (await page.locator(".location-row").count() > 0) return; await page.locator(".roadtrip-column button:has-text('Gratens')").first().click(); await page.waitForSelector(".location-row"); };
const chipOf = (n) => page.locator(".location-row").nth(n).locator(".status-chip");

// A) hors ligne : 2 livres locaux, 3 passages
await openT1();
await chipOf(1).first().click(); await page.click(".status-option:has-text('Déposé')");
await page.click(".book-chip.add"); await page.fill(".book-add-form input", "Livre B"); await page.click(".book-add-form button[type=submit]");
await page.waitForTimeout(50);
await chipOf(1).nth(1).click(); await page.click(".status-option:has-text('Refusé')");
await chipOf(2).nth(0).click(); await page.click(".status-option:has-text('À relancer')");
await page.waitForTimeout(50);
console.log("A local:", await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("tourdePhrance_v11")); return `${s.books.length} livres, ${s.checkins.length} passages`; }));

// B) connexion de l'utilisateur U1 (compte neuf, le trigger a créé « Mon édition »)
await page.evaluate(() => { window.__db.books.push({ id: "srv-trigger", owner_id: "u1", title: "Mon édition", visible: true, created_at: new Date(Date.now()-1e6).toISOString() }); window.__fakeAuth.setUser({ id: "u1", email: "u1@test" }); });
await page.waitForFunction(() => document.querySelector(".sync-strip")?.textContent.includes("synchronisé"), null, { timeout: 5000 });
const after = await page.evaluate(() => ({ books: window.__db.books.map(b=>b.title), checkins: window.__db.checkins.map(c=>c.book_id+":"+c.place_id+":"+c.status), local: localStorage.getItem("tourdePhrance_v11") }));
console.log("B après fusion:", JSON.stringify(after));
console.log("B chips livres:", await page.locator(".book-chip:not(.add)").allTextContents());
await openT1();
console.log("B pastilles lieu 1:", await chipOf(1).allTextContents(), "| lieu 2:", await chipOf(2).allTextContents());

// C) passage en ligne + annulation + historique
await chipOf(3).nth(0).click(); await page.click(".status-option:has-text('Fermé')");
await page.waitForFunction(() => document.querySelector(".sync-strip")?.textContent.includes("synchronisé"));
console.log("C lieu 3:", await chipOf(3).nth(0).textContent(), "| db checkins:", await page.evaluate(() => window.__db.checkins.length));
await chipOf(3).nth(0).click(); await page.click(".status-link:has-text('Annuler le dernier')");
await page.waitForFunction(() => document.querySelector(".sync-strip")?.textContent.includes("synchronisé"));
console.log("C après annulation:", await chipOf(3).nth(0).textContent(), "| db checkins:", await page.evaluate(() => window.__db.checkins.length));

// D) déconnexion : le navigateur doit être vide (données restées dans le compte)
await page.evaluate(() => window.__fakeAuth.setUser(null));
await page.waitForFunction(() => document.querySelector(".sync-strip")?.textContent.includes("Mode local"));
console.log("D déconnecté, livres affichés:", await page.locator(".book-chip:not(.add)").allTextContents(), "| local:", await page.evaluate(() => localStorage.getItem("tourdePhrance_v11")));

// E) reconnexion : pas de doublons
await page.evaluate(() => window.__fakeAuth.setUser({ id: "u1", email: "u1@test" }));
await page.waitForFunction(() => document.querySelector(".sync-strip")?.textContent.includes("synchronisé"));
console.log("E reconnexion: db livres", await page.evaluate(() => window.__db.books.length), "passages", await page.evaluate(() => window.__db.checkins.length));

// F) changement d'utilisateur U2 (compte ancien sans livre → livre par défaut créé côté client, une seule fois)
await page.evaluate(() => window.__fakeAuth.setUser({ id: "u2", email: "u2@test" }));
await page.waitForFunction(() => document.querySelector(".sync-strip")?.textContent.includes("synchronisé"));
await page.waitForTimeout(200);
console.log("F u2 livres:", await page.evaluate(() => window.__db.books.filter(b=>b.owner_id==="u2").map(b=>b.title)), "| affichés:", await page.locator(".book-chip:not(.add)").allTextContents());

// G) course : déconnexion pendant un chargement lent
await page.evaluate(() => { window.__delay = 400; window.__fakeAuth.setUser({ id: "u1", email: "u1@test" }); });
await page.waitForTimeout(100);
await page.evaluate(() => window.__fakeAuth.setUser(null));
await page.waitForTimeout(1500);
console.log("G après course: livres affichés", await page.locator(".book-chip:not(.add)").allTextContents(), "| local:", await page.evaluate(() => localStorage.getItem("tourdePhrance_v11")), "| strip:", await page.textContent(".sync-strip"));

// H) suppression d'un livre + reset
await page.evaluate(() => { window.__delay = 20; window.__fakeAuth.setUser({ id: "u1", email: "u1@test" }); });
await page.waitForFunction(() => document.querySelector(".sync-strip")?.textContent.includes("synchronisé"));
await page.click(".nav-tabs button:has-text('Compte')"); await page.waitForSelector(".books-list");
const items = page.locator(".books-item");
await items.nth(1).locator("button:has-text('Supprimer')").first().click(); await items.nth(1).locator("button:has-text('Supprimer définitivement')").click();
await page.waitForTimeout(200);
console.log("H après suppression Livre B: db livres", await page.evaluate(() => window.__db.books.filter(b=>b.owner_id==="u1").map(b=>b.title)), "passages", await page.evaluate(() => window.__db.checkins.filter(c=>c.user_id==="u1").length));
await b.close();
console.log("ERREURS:", errors.length ? errors.filter(e=>!e.includes("ERR_TUNNEL")) : "aucune");
