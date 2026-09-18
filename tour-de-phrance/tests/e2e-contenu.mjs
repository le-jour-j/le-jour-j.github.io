import { chromium } from "playwright";

const b = await chromium.launch();
const errors = [];
const ctx = await b.newContext({ viewport: { width: 1200, height: 1000 } });
const page = await ctx.newPage();
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error" && !m.text().includes("TUNNEL")) errors.push("console: " + m.text()); });

await page.goto("http://localhost:4173/");
await page.waitForSelector(".roadtrip-column");
console.log("entête:", (await page.textContent(".sticky-header")).replace(/\s+/g, " ").slice(0, 140));
const troncons = page.locator(".roadtrip-column button:has-text('→')");
console.log("tronçons affichés:", await troncons.count());

await page.locator("button:has-text('Rennes')").first().click();
await page.waitForSelector(".location-row");
console.log("lieux visibles:", await page.locator(".location-row").count());
console.log("cibles surlignées:", await page.locator(".location-row.is-target").count());
console.log("liens site:", await page.locator(".location-link").count());
console.log("tags méta:", (await page.locator(".meta-tag").allTextContents()).join(" | "));
await page.screenshot({ path: "/tmp/shots/10-rennes.png" });

await page.check(".targets-filter input");
await page.waitForTimeout(400);
console.log("filtre cibles — tronçons:", await troncons.count(), "| lieux visibles:", await page.locator(".location-row").count());
await page.screenshot({ path: "/tmp/shots/11-cibles.png" });
await page.uncheck(".targets-filter input");

// Les notes de terrain ont été retirées du site : on vérifie qu'elles n'y sont pas.
await page.fill(".search-box input", "Folies");
await page.waitForTimeout(400);
await troncons.first().click();
await page.waitForSelector(".location-row");
const notes = await page.locator(".location-fieldnote").count();
console.log("blocs de note de terrain (doit être 0) :", notes);
const html = await page.content();
const interdits = ["pas sympas", "Pas sympas", "prennent pour des oufs", "virer gibert"];
const fuites = interdits.filter((s) => html.includes(s));
console.log("appréciations dans la page :", fuites.length ? fuites : "aucune");
if (notes || fuites.length) process.exitCode = 1;

await b.close();
console.log("ERREURS:", errors.length ? errors : "aucune");
