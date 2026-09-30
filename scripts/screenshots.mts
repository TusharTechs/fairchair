// Regenerates the README screenshots from demo clients (no API units).
// Run against a fresh local database so the dashboard shows only these quotes:
//   npm run screenshots -- [baseUrl]
import puppeteer, { type Page } from "puppeteer-core";

const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = "docs/screenshots";
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function click(page: Page, text: string, selector = "button") {
  await page.waitForFunction(
    (sel, t) => [...document.querySelectorAll(sel)].some((el) => (el as HTMLElement).innerText.trim().startsWith(t)),
    { timeout: 30_000 },
    selector,
    text,
  );
  await page.evaluate(
    (sel, t) => ([...document.querySelectorAll(sel)].find((el) => (el as HTMLElement).innerText.trim().startsWith(t)) as HTMLElement).click(),
    selector,
    text,
  );
}

async function quote(client: string, name: string, book: boolean) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(`${BASE}/s/amara-braids-demo`, { waitUntil: "networkidle0" });
  await click(page, "Knotless braids");
  await click(page, "Medium");
  await click(page, "Mid-back");
  await click(page, "Continue");
  await click(page, client);
  await page.waitForFunction(() => document.body.innerText.includes("Your hair, measured"), { timeout: 30_000 });
  await page.waitForSelector("#client-name");
  await page.type("#client-name", name);
  await click(page, "Hold this quote");
  await page.waitForFunction(() => document.body.innerText.includes("Pick a start time"), { timeout: 20_000 });
  if (book) {
    await page.evaluate(() => {
      const times = [...document.querySelectorAll("button[aria-pressed]")].filter((b) => /\d:\d\d/.test((b as HTMLElement).innerText));
      (times[1] as HTMLElement | undefined)?.click();
    });
    await click(page, "Request this time");
  } else await click(page, "Just save my quote");
  await page.waitForFunction(() => location.pathname.startsWith("/q/"), { timeout: 20_000 });
  const url = page.url();
  await page.close();
  return url;
}

async function shot(path: string, file: string, viewport: { width: number; height: number }, prep?: (p: Page) => Promise<void>) {
  const page = await browser.newPage();
  await page.setViewport({ ...viewport, deviceScaleFactor: 2 });
  await page.goto(path.startsWith("http") ? path : `${BASE}${path}`, { waitUntil: "networkidle0" });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  if (prep) await prep(page);
  await wait(900);
  await page.screenshot({ path: `${OUT}/${file}` });
  console.log("✓", file);
  await page.close();
}

await quote("Nia", "Nia", false);
const receipt = await quote("Maya", "Maya", true);

await shot("/", "landing.png", { width: 1440, height: 900 });
await shot("/compare", "two-heads.png", { width: 1440, height: 1420 });
await shot("/studio/amara-braids-demo?key=demo", "stylist.png", { width: 1440, height: 1000 });
await shot(receipt, "receipt.png", { width: 900, height: 1600 });
await browser.close();
