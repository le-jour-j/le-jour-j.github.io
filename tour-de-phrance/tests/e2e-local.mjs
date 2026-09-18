import { chromium } from "playwright";
const b = await chromium.launch();
const errors = [];
async function fresh(init) {
  const ctx = await b.newContext({ viewport: { width: 420, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", e => errors.push("pageerror: " + e.message));
  page.on("console", m => { if (m.type() === "error") errors.push("console: " + m.text()); });
  if (init) await page.addInitScript(init);
  await page.goto("http://localhost:4173/");
  await page.waitForSelector(".roadtrip-column");
  return { ctx, page };
}

// 1) Mode local vierge : noter un passage, vérifier compteur, recharger
let { ctx, page } = await fresh();
await page.click(".mobile-toggle"); // ouvrir contrôles (mobile)
console.log("sync:", await page.textContent(".sync-strip"));
await page.screenshot({ path: "/tmp/shots/01-home.png", fullPage: false });
// ouvrir tronçon 1
await page.locator(".roadtrip-column button:has-text('Gratens')").first().click();
await page.waitForSelector(".location-row");
console.log("descriptions affichées:", await page.locator(".location-description").count());
const chip = page.locator(".status-chip").nth(1); // 2e lieu (KM0 est le 1er)
await chip.click();
await page.screenshot({ path: "/tmp/shots/02-picker.png" });
await page.fill(".status-note", "2 exemplaires, contact Julie");
await page.click(".status-option:has-text('Déposé')");
await page.waitForTimeout(200);
console.log("chip après choix:", await chip.textContent());
console.log("footer:", await page.textContent(".footer-count"));
console.log("livres:", await page.locator(".book-chip:not(.add)").allTextContents());
// second passage sur le même lieu → refusé, puis historique
await chip.click(); await page.click(".status-option:has-text('Refusé')"); await page.waitForTimeout(100);
await chip.click(); await page.click(".status-link:has-text('Historique')");
console.log("historique:", (await page.locator(".status-history li").allTextContents()).join(" | "));
await page.screenshot({ path: "/tmp/shots/03-history.png" });
// recharger → persistance
await page.reload(); await page.waitForSelector(".roadtrip-column");
await page.click(".mobile-toggle");
console.log("après reload livres:", await page.locator(".book-chip:not(.add)").allTextContents(), "footer:", await page.textContent(".footer-count"));
const store = await page.evaluate(() => JSON.parse(localStorage.getItem("tourdePhrance_v11")));
console.log("store: books", store.books.length, "checkins", store.checkins.length);
// 2e livre via la barre
await page.click(".book-chip.add"); await page.fill(".book-add-form input", "Chéquier Claude Monnaie"); await page.click(".book-add-form button[type=submit]");
await page.waitForTimeout(100);
console.log("livres:", await page.locator(".book-chip:not(.add)").allTextContents());
await page.locator(".roadtrip-column button:has-text('Gratens')").first().click();
await page.waitForSelector(".location-row");
console.log("pastilles sur 2e lieu:", await page.locator(".location-row").nth(1).locator(".status-chip").allTextContents());
await page.screenshot({ path: "/tmp/shots/04-two-books.png" });
// onglet compte
await page.click(".nav-tabs button:has-text('Compte')");
await page.waitForSelector(".books-list");
console.log("panneau livres:", (await page.locator(".books-item").allTextContents()).map(s=>s.replace(/\s+/g," ")));
await page.screenshot({ path: "/tmp/shots/05-compte.png", fullPage: true });
await ctx.close();

// 2) Migration des anciennes coches v8
({ ctx, page } = await fresh(() => localStorage.setItem("tourdePhrance_v8_visited", JSON.stringify({ "occitanie-24": true, "occitanie-25": true, "corse-3": true }))));
await page.click(".mobile-toggle");
console.log("migration v8 → footer:", await page.textContent(".footer-count"), "| livres:", await page.locator(".book-chip:not(.add)").allTextContents());
await ctx.close();

// 3) Desktop screenshot
const ctx2 = await b.newContext({ viewport: { width: 1200, height: 900 } });
const p2 = await ctx2.newPage(); await p2.goto("http://localhost:4173/"); await p2.waitForSelector(".roadtrip-column");
await p2.locator(".roadtrip-column button:has-text('Montpellier')").first().click(); await p2.waitForTimeout(300);
await p2.screenshot({ path: "/tmp/shots/06-desktop.png" });
await ctx2.close();
await b.close();
console.log("ERREURS:", errors.length ? errors : "aucune");
