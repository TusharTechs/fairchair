// Generates one image with YouCam text-to-image: gen-image <out.jpg> <size> <prompt>
import { writeFile } from "node:fs/promises";
import { download, findUrl, run } from "./lib/youcam.mjs";
const [out, size, ...prompt] = process.argv.slice(2);
const r = await run("text-to-image/youcam", {
  model: "youcam-image-v2",
  prompt: prompt.join(" "),
  negative_prompt: "text, logo, watermark, brand name, label, people, face, hands, blurry",
  size,
});
const url = r.ok ? findUrl(r.results) : undefined;
if (!url) throw new Error(r.ok ? "no url" : `${r.error} ${r.message ?? ""}`);
await writeFile(out, await download(url));
console.log(`✓ ${out} (${r.ms} ms)`);
