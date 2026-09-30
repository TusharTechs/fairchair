// End-to-end QA with the locally installed Chrome (no browser download):
// drives the judge paths at desktop and phone sizes, captures screenshots,
// and reports console errors. Uses demo clients only (no API units).
//   npm run qa -- [baseUrl] [outDir]
import { mkdir } from "node:fs/promises";
import puppeteer, { type Page } from "puppeteer-core";

const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = process.argv[3] ?? "qa-shots";
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
const errors: string[] = [];
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function open(label: string, viewport: { width: number; height: number; isMobile?: boolean }) {
  const page = await browser.newPage();
  await page.setViewport({ ...viewport, deviceScaleFactor: 2, hasTouch: Boolean(viewport.isMobile) });
  page.on("console", (m) => m.type() === "error" && errors.push(`[${label}] ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`[${label}] ${(e as Error).message}`));
  return page;
}

async function clickText(page: Page, text: string, selector = "button") {
  await page.waitForFunction(
    (sel, t) => [...document.querySelectorAll(sel)].some((el) => (el as HTMLElement).innerText.trim().startsWith(t)),
    { timeout: 20_000 },
    selector,
    text,
  );
  await page.evaluate(
    (sel, t) => ([...document.querySelectorAll(sel)].find((el) => (el as HTMLElement).innerText.trim().startsWith(t)) as HTMLElement).click(),
    selector,
    text,
  );
}

async function shot(page: Page, name: string) {
  await wait(700);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log("  shot", name);
}

async function quoteFlow(vp: { width: number; height: number; isMobile?: boolean }, tag: string) {
  const page = await open(`quote-${tag}`, vp);
  await page.goto(`${BASE}/s/amara-braids-demo`, { waitUntil: "networkidle0" });
  await shot(page, `${tag}-1-service`);
  await clickText(page, "Knotless braids");
  await clickText(page, "Medium");
  await clickText(page, "Mid-back");
  await clickText(page, "Continue");
  await clickText(page, "Maya");
  await page.waitForFunction(() => document.body.innerText.includes("Your hair, measured"), { timeout: 30_000 });
  await shot(page, `${tag}-2-quote`);
  await clickText(page, "See this style on me");
  await page.waitForSelector('[role="slider"]', { timeout: 30_000 });
  await page.evaluate(() => document.querySelector('[role="slider"]')?.scrollIntoView({ block: "center" }));
  await shot(page, `${tag}-3-tryon`);
  await page.type("#client-name", "Maya");
  await clickText(page, "Hold this quote");
  await page.waitForFunction(() => document.body.innerText.includes("Pick a start time"), { timeout: 20_000 });
  await shot(page, `${tag}-4-book`);
  await page.close();
}

async function storeFlow(vp: { width: number; height: number; isMobile?: boolean }, tag: string) {
  const page = await open(`store-${tag}`, vp);
  await page.goto(`${BASE}/m/demo-extensions`, { waitUntil: "networkidle0" });
  await clickText(page, '20"');
  await clickText(page, "Black");
  await clickText(page, "Continue");
  await clickText(page, "Nia");
  await page.waitForFunction(() => document.body.innerText.includes("Your match"), { timeout: 30_000 });
  await shot(page, `${tag}-5-match`);
  await page.close();
}

async function pages(vp: { width: number; height: number; isMobile?: boolean }, tag: string) {
  const page = await open(`pages-${tag}`, vp);
  for (const [name, path] of [
    ["home", "/"],
    ["compare", "/compare"],
    ["studio", "/studio/amara-braids-demo?key=demo"],
    ["store-demo", "/store-demo"],
    ["start", "/start"],
  ] as const) {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle0" });
    await shot(page, `${tag}-page-${name}`);
  }
  await page.close();
}

const desktop = { width: 1440, height: 900 };
const phone = { width: 390, height: 844, isMobile: true };
for (const [vp, tag] of [
  [desktop, "desktop"],
  [phone, "phone"],
] as const) {
  console.log(tag);
  await pages(vp, tag);
  await quoteFlow(vp, tag);
  await storeFlow(vp, tag);
}
await browser.close();
console.log(errors.length ? `\nConsole errors:\n${errors.join("\n")}` : "\nNo console errors.");
process.exit(errors.length ? 1 : 0);
