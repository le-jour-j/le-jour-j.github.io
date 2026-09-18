import { chromium } from "playwright";

const b = await chromium.launch();
const errs = [];
const c = await b.newContext({ viewport: { width: 430, height: 1200 } });
const p = await c.newPage();
p.on("pageerror", (e) => errs.push("JS: " + e.message));
p.on("console", (m) => { if (m.type() === "error" && !m.text().includes("TUNNEL")) errs.push("C: " + m.text()); });

await p.goto("http://localhost:4173/");
await p.waitForSelector(".roadtrip-column");

// catalogue vide au départ
await p.click(".nav-tabs button:has-text('Livres')");
await p.waitForSelector(".page-card");
console.log("catalogue vide :", (await p.textContent(".notice-card")).replace(/\s+/g, " ").slice(0, 80));

// un livre, deux dépôts, un refus
await p.click(".nav-tabs button:has-text('Carte')");
await p.click(".mobile-toggle");
await p.click(".book-chip.add");
await p.fill(".book-add-form input", "Chéquier Claude Monnaie");
await p.click(".book-add-form button[type=submit]");
await p.waitForTimeout(150);

await p.locator(".roadtrip-column button:has-text('Gratens')").first().click();
await p.waitForSelector(".location-row");
for (const [n, statut] of [[1, "Déposé"], [2, "Déposé"], [3, "Refusé"]]) {
  await p.locator(".location-row").nth(n).locator(".status-chip").first().click();
  await p.click(`.status-option:has-text('${statut}')`);
  await p.waitForTimeout(180);
}

// fiche du livre
await p.click(".nav-tabs button:has-text('Compte')");
await p.waitForSelector(".books-list");
await p.locator("button:has-text('Modifier la fiche')").first().click();
await p.fill('.book-form input[maxlength="120"] >> nth=1', "Jeanson Péchin");
await p.fill('.book-form input[type="number"] >> nth=0', "2026");
await p.fill('.book-form input[type="number"] >> nth=1', "15");
await p.fill(".book-form textarea", "Un chéquier d'artiste : chaque chèque est une œuvre détachable.");
await p.click('.book-form button[type="submit"]');
await p.waitForTimeout(250);
console.log("fiche livre :", (await p.textContent(".books-item-main")).replace(/\s+/g, " ").slice(0, 120));

// catalogue rempli
await p.click(".nav-tabs button:has-text('Livres')");
await p.waitForSelector(".cat-book");
console.log("stats :", await p.textContent(".cat-stats"));
console.log("titre :", await p.textContent(".cat-book h2"));
console.log("signature :", await p.textContent(".cat-by"));
console.log("points de vente :", await p.textContent(".cat-count b"));
await p.click(".cat-toggle");
await p.waitForSelector(".cat-places li");
const lieux = await p.locator(".cat-places li a").allTextContents();
console.log("adresses listées :", lieux);
await p.screenshot({ path: "/tmp/shots/c1-catalogue.png" });

// le refus ne doit PAS apparaître
const html = await p.content();
console.log("le lieu refusé fuite-t-il au catalogue ?", html.includes("Refusé") ? "OUI — BUG" : "non");

// « en vente ici » sur la carte
await p.click(".nav-tabs button:has-text('Carte')");
await p.waitForTimeout(200);
await p.locator(".roadtrip-column button:has-text('Gratens')").first().click();
await p.waitForSelector(".location-sold");
console.log("sur la carte :", (await p.locator(".location-sold").first().textContent()).slice(0, 70));
console.log("lieux marqués en vente :", await p.locator(".location-sold").count());
await p.locator(".location-sold").first().scrollIntoViewIfNeeded();
await p.waitForTimeout(200);
await p.screenshot({ path: "/tmp/shots/c2-envente.png" });

// livre discret → sort du catalogue
await p.click(".nav-tabs button:has-text('Compte')");
await p.waitForSelector(".books-list");
await p.locator("button:has-text('Passer en discret')").first().click();
await p.waitForTimeout(250);
await p.click(".nav-tabs button:has-text('Livres')");
await p.waitForTimeout(300);
console.log("après passage en discret :", (await p.locator(".cat-book").count()) === 0 ? "retiré du catalogue" : "TOUJOURS LÀ — BUG");

// persistance
await p.reload();
await p.waitForSelector(".roadtrip-column");
await p.click(".nav-tabs button:has-text('Compte')");
await p.waitForSelector(".books-list");
console.log("après rechargement :", (await p.textContent(".books-item-main")).replace(/\s+/g, " ").slice(0, 100));

await b.close();
console.log("ERREURS :", errs.length ? errs : "aucune");
