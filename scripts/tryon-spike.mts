// Feasibility: can YouCam hair-transfer (v2.1, custom reference) show a
// stylist's portfolio style — knotless braids — on a client?
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { download, findUrl, run, upload } from "./lib/youcam.mjs";

const out = "public/demo/previews";
await mkdir(out, { recursive: true });
const refPath = `${out}/ref-knotless-medium-midback.jpg`;

if (!(await access(refPath).then(() => true, () => false))) {
  const gen = await run("text-to-image/youcam", {
    model: "youcam-image-v2",
    prompt:
      "Photorealistic salon portfolio photo of one adult Black woman facing the camera, head and shoulders to mid-torso, wearing freshly installed medium-size knotless box braids in natural black, braids reaching mid-back and draped over both shoulders, neat square parts, even soft studio lighting, plain light grey background, no accessories.",
    negative_prompt: "hat, headscarf, bun, updo, ponytail, glasses, multiple people, text, watermark, blurry, cropped head",
    size: "1104*1472",
  });
  const url = gen.ok ? findUrl(gen.results) : undefined;
  if (!url) throw new Error(`reference generation failed: ${gen.ok ? "no url" : gen.error}`);
  await writeFile(refPath, await download(url));
  console.log(`✓ reference generated (${gen.ms} ms)`);
}
const refId = await upload(await readFile(refPath), "ref.jpg");

const log: Record<string, unknown> = {};
const clients = process.argv.slice(2).length ? process.argv.slice(2) : ["curly-collarbone", "coily-long-full"];
for (const client of clients) {
  const srcId = await upload(await readFile(`public/demo/generated/${client}.jpg`), `${client}.jpg`);
  const r = await run("hair-transfer", { src_file_id: srcId, ref_file_id: refId }, "v2.1");
  const url = r.ok ? findUrl(r.results) : undefined;
  log[client] = r.ok ? { ok: true, ms: r.ms } : { ok: false, error: r.error, message: r.message, ms: r.ms };
  if (url) {
    await writeFile(`${out}/${client}-knotless.jpg`, await download(url));
    console.log(`✓ ${client}: preview saved (${r.ms} ms)`);
  } else {
    console.log(`✗ ${client}:`, r.ok ? "no url" : `${r.error} ${r.message ?? ""}`);
  }
}
await writeFile(`spike/tryon-${clients.join("+")}.json`, JSON.stringify({ ranAt: new Date().toISOString(), log }, null, 2));
