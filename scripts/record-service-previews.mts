// Records demo-studio portfolio references (AI-generated) and live YouCam
// hair-transfer previews of each on every demo client, so the recorded demo
// path covers every service. Skips files that already exist.
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { download, findUrl, run, upload } from "./lib/youcam.mjs";

const out = "public/demo/previews";
await mkdir(out, { recursive: true });
const exists = (p: string) => access(p).then(() => true, () => false);

const BASE =
  "Photorealistic salon portfolio photo of one adult woman facing the camera, head and shoulders to mid-torso, even soft studio lighting, plain light grey background, no accessories, natural makeup.";
const REFS: Record<string, string> = {
  "silk-press": `${BASE} She has a fresh silk press on her natural hair: sleek, glossy, bone-straight hair falling just past her shoulders, with movement at the ends.`,
  "sew-in": `${BASE} She wears a sew-in with leave-out: long, voluminous natural-black body-wave hair past her chest, blended seamlessly at a middle part.`,
  "tape-ins": `${BASE} She wears long dark-brown tape-in extensions: smooth, straight, seamless blend, hair reaching her lower chest.`,
};
const CLIENTS = ["curly-collarbone", "coily-long-full", "coily-short", "kinky-chest-stretched"];

for (const [service, prompt] of Object.entries(REFS)) {
  const refPath = `${out}/ref-${service}.jpg`;
  if (!(await exists(refPath))) {
    const gen = await run("text-to-image/youcam", {
      model: "youcam-image-v2",
      prompt,
      negative_prompt: "hat, headscarf, bun, updo, braids, glasses, multiple people, text, watermark, blurry, cropped head",
      size: "1104*1472",
    });
    const url = gen.ok ? findUrl(gen.results) : undefined;
    if (!url) throw new Error(`${service} reference failed: ${gen.ok ? "no url" : gen.error}`);
    await writeFile(refPath, await download(url));
    console.log(`✓ reference ${service}`);
  }
  const refId = await upload(await readFile(refPath), `ref-${service}.jpg`);
  for (const client of CLIENTS) {
    const target = `${out}/${client}-${service}.jpg`;
    if (await exists(target)) continue;
    const srcId = await upload(await readFile(`public/demo/generated/${client}.jpg`), `${client}.jpg`);
    const r = await run("hair-transfer", { src_file_id: srcId, ref_file_id: refId }, "v2.1");
    const url = r.ok ? findUrl(r.results) : undefined;
    if (url) {
      await writeFile(target, await download(url));
      console.log(`  ✓ ${client} × ${service} (${r.ms} ms)`);
    } else console.log(`  ✗ ${client} × ${service}: ${r.ok ? "no url" : `${r.error} ${r.message ?? ""}`}`);
  }
}
