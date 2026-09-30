// What do YouCam's three hair-extension templates look like on a real head?
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { download, findUrl, run, upload } from "./lib/youcam.mjs";

const src = process.argv[2] ?? "curly-collarbone";
await mkdir("public/demo/extensions", { recursive: true });
// hair-ext requires JPG with long side ≤ 1024.
const tmp = `/tmp/${src}-1024.jpg`;
execFileSync("sips", ["-s", "format", "jpeg", "-Z", "1024", `public/demo/generated/${src}.jpg`, "--out", tmp]);
const id = await upload(new Uint8Array(await readFile(tmp)), `${src}.jpg`);
for (const template of ["all_length_1", "all_length_2_", "all_length_3"]) {
  const r = await run("hair-ext", { src_file_id: id, template_id: template });
  const url = r.ok ? findUrl(r.results) : undefined;
  if (url) {
    await writeFile(`public/demo/extensions/${src}-${template.replace(/_$/, "")}.jpg`, await download(url));
    console.log(`✓ ${template} (${r.ms} ms)`);
  } else console.log(`✗ ${template}`, r.ok ? "no url" : `${r.error} ${r.message ?? ""}`);
}
