// WCAG A/AA check of the main pages with axe-core (loaded from CDN) in the
// locally installed Chrome.   npm run axe -- [baseUrl]
import puppeteer from "puppeteer-core";

const BASE = process.argv[2] ?? "http://localhost:3000";
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PAGES = ["/", "/compare", "/s/amara-braids-demo", "/m/demo-extensions", "/store-demo", "/start", "/shops/new", "/studio/amara-braids-demo?key=demo", "/embed/amara-braids-demo"];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
let failed = 0;
for (const path of PAGES) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle0" });
  await page.addScriptTag({ url: "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js" });
  const violations = await page.evaluate(async () => {
    // @ts-expect-error axe is injected
    const r = await axe.run(document, { runOnly: ["wcag2a", "wcag2aa"] });
    return r.violations.map((v: { id: string; nodes: { target: string[]; failureSummary: string }[] }) => `${v.id} x${v.nodes.length}: ${v.nodes[0].target.join(" ")} ${v.nodes[0].failureSummary.split("\n")[1] ?? ""}`);
  });
  failed += violations.length;
  console.log(path, violations.length ? violations : "ok");
  await page.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
