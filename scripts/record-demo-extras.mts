// Records live YouCam results the store demo replays: hair colour
// (skin-tone-analysis) and an extension try-on (hair-ext) per demo portrait.
//   node --import tsx scripts/record-demo-extras.mts <portrait> [--color] [--ext]
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { download, findUrl, run, upload } from "./lib/youcam.mjs";

const [portrait, ...flags] = process.argv.slice(2);
if (!portrait) throw new Error("usage: record-demo-extras <portrait> [--color] [--ext]");
await mkdir("spike", { recursive: true });
const out: Record<string, unknown> = { portrait, ranAt: new Date().toISOString() };

if (flags.includes("--color")) {
  const id = await upload(new Uint8Array(await readFile(`public/demo/generated/${portrait}.jpg`)), `${portrait}.jpg`);
  const r = await run("skin-tone-analysis", { src_file_id: id, face_angle_strictness_level: "medium" });
  out.color = r.ok ? r.results : { error: r.error, message: r.message };
  console.log("colour:", JSON.stringify(out.color));
}
if (flags.includes("--ext")) {
  await mkdir("public/demo/extensions", { recursive: true });
  const tmp = `/tmp/${portrait}-1024.jpg`;
  execFileSync("sips", ["-s", "format", "jpeg", "-Z", "1024", `public/demo/generated/${portrait}.jpg`, "--out", tmp]);
  const id = await upload(new Uint8Array(await readFile(tmp)), `${portrait}.jpg`);
  const r = await run("hair-ext", { src_file_id: id, template_id: "all_length_2_" });
  const url = r.ok ? findUrl(r.results) : undefined;
  if (url) await writeFile(`public/demo/extensions/${portrait}-all_length_2.jpg`, await download(url));
  out.ext = url ? "saved" : r.ok ? "no url" : { error: r.error, message: r.message };
  console.log("extension:", JSON.stringify(out.ext));
}
await writeFile(`spike/demo-extras-${portrait}.json`, JSON.stringify(out, null, 2));
