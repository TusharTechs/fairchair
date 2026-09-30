// Phase-3 accuracy spike. Generates synthetic, AI-made portraits with known
// intended hair attributes (YouCam text-to-image), then runs the four YouCam
// hair detectors on each and records the raw outputs. Two portraits are run
// twice to check determinism. Writes spike/results.json and saves images to
// public/demo/generated/. No real people are photographed.
//
//   npm run spike            # generate + detect
//   npm run spike -- --detect-only   # reuse existing images

import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";

const key = process.env.YOUCAM_API_KEY;
const base = process.env.YOUCAM_BASE_URL || "https://yce-api-01.makeupar.com";
if (!key) throw new Error("YOUCAM_API_KEY not set");
const auth = { Authorization: `Bearer ${key}` };
const detectOnly = process.argv.includes("--detect-only");
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7).split(",");

type Persona = { id: string; intended: { type: string; density: string; length: string; frizz: string }; prompt: string };

const COMMON =
  "Photorealistic studio portrait photo of one adult, head and shoulders, facing the camera directly, neutral expression, mouth closed, " +
  "even soft frontal lighting, plain light grey background, hair fully visible and loose, no accessories, no hat, no headscarf, natural look.";
const NEGATIVE =
  "hat, headscarf, hood, braids, bun, ponytail, updo, wig cap, sunglasses, glasses, multiple people, cropped head, side profile, tilted head, text, watermark, blurry";

const PERSONAS: Persona[] = [
  {
    id: "coily-long-full",
    intended: { type: "4b–4c", density: "high", length: "long / past shoulders (stretched)", frizz: "frizzy" },
    prompt: `${COMMON} A Black woman with very dense, voluminous 4C natural hair, a large full blown-out afro reaching well past her shoulders.`,
  },
  {
    id: "curly-collarbone",
    intended: { type: "3b–3c", density: "medium", length: "collarbone", frizz: "slight" },
    prompt: `${COMMON} A woman with defined 3B ringlet curls, medium thickness, falling to her collarbone.`,
  },
  {
    id: "coily-short",
    intended: { type: "4a–4c", density: "medium-high", length: "short / above ears", frizz: "slight" },
    prompt: `${COMMON} A Black woman with a short tapered 4C natural hair teeny weeny afro, hair above the ears.`,
  },
  {
    id: "straight-fine-shoulder",
    intended: { type: "1–2a", density: "low", length: "shoulder", frizz: "none" },
    prompt: `${COMMON} A woman with fine, thin, sleek straight hair cut exactly at shoulder length, some scalp visible at the part.`,
  },
  {
    id: "wavy-long",
    intended: { type: "2b–2c", density: "medium", length: "long / past chest", frizz: "slight" },
    prompt: `${COMMON} A woman with long 2C wavy hair falling past her chest, draped in front of both shoulders.`,
  },
  {
    id: "kinky-chest-stretched",
    intended: { type: "4a–4b", density: "high", length: "chest (stretched)", frizz: "frizzy" },
    prompt: `${COMMON} A Black woman with thick 4A kinky coily hair that has been stretched and blown out, reaching chest length, draped in front of her shoulders.`,
  },
];

// Documented capture protocol: type & frizz take exactly [front, right, left]
// (45° yaw, same size); length takes the front view; density takes one
// front-facing selfie with the head lowered ~45° so the hairline shows.
const FEATURES = [
  { name: "hair-type", slug: "hair-type-detection", views: ["front", "right", "left"] },
  { name: "hair-density", slug: "hair-density-detection", views: ["down"] },
  { name: "hair-length", slug: "hair-length-detection", views: ["front"] },
  { name: "hair-frizz", slug: "hair-frizziness-detection", views: ["front", "right", "left"] },
] as const;

const VIEW_PROMPTS = {
  right: "The same person, same hair, same clothes, same lighting and background, head turned about 45 degrees to the right (yaw only, head level), face still fully visible.",
  left: "The same person, same hair, same clothes, same lighting and background, head turned about 45 degrees to the left (yaw only, head level), face still fully visible.",
  down: "The same person, same hair, same clothes, same lighting and background. Body facing the camera, chin lowered toward the chest by about 45 degrees (pitch only, no turning), eyes looking down, so the forehead, the whole hairline and the top of the head face the camera. Face still partly visible.",
} as const;
type View = "front" | keyof typeof VIEW_PROMPTS;

async function api<T>(p: string, init?: { method: "POST"; body: unknown }): Promise<T> {
  const res = await fetch(new URL(p, base), {
    method: init?.method ?? "GET",
    headers: { ...auth, ...(init ? { "Content-Type": "application/json" } : {}) },
    body: init ? JSON.stringify(init.body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${p} → ${res.status} ${text.slice(0, 300)}`);
  return JSON.parse(text) as T;
}

async function run(slugPath: string, body: unknown) {
  const started = Date.now();
  const s = await api<{ data?: { task_id?: string } }>(`/s2s/v2.0/task/${slugPath}`, { method: "POST", body });
  const id = s.data?.task_id;
  if (!id) throw new Error(`no task id for ${slugPath}`);
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, i < 3 ? 1500 : 3000));
    const p = await api<{ data?: { task_status?: string; results?: unknown; error?: string; error_message?: string } }>(
      `/s2s/v2.0/task/${slugPath}/${encodeURIComponent(id)}`,
    );
    const st = p.data?.task_status;
    if (st === "success") return { ok: true as const, results: p.data?.results, ms: Date.now() - started, taskId: id };
    if (st === "error") return { ok: false as const, error: p.data?.error ?? "error", message: p.data?.error_message, ms: Date.now() - started, taskId: id };
  }
  return { ok: false as const, error: "poll_timeout", ms: Date.now() - started, taskId: id };
}

function findUrl(v: unknown): string | undefined {
  if (typeof v === "string" && /^https?:\/\//.test(v)) return v;
  if (Array.isArray(v)) for (const x of v) { const u = findUrl(x); if (u) return u; }
  if (v && typeof v === "object") for (const x of Object.values(v)) { const u = findUrl(x); if (u) return u; }
  return undefined;
}

async function upload(bytes: Buffer, name: string) {
  const init = await api<{ data?: { files?: { file_id?: string; requests?: { url: string; method?: string; headers?: Record<string, string> }[] }[] } }>(
    "/s2s/v2.0/file",
    { method: "POST", body: { files: [{ content_type: "image/jpeg", file_name: name, file_size: bytes.byteLength }] } },
  );
  const f = init.data?.files?.[0];
  const req = f?.requests?.[0];
  if (!f?.file_id || !req) throw new Error("upload init failed");
  const put = await fetch(req.url, { method: req.method ?? "PUT", headers: req.headers, body: new Uint8Array(bytes) });
  if (!put.ok) throw new Error(`PUT ${put.status}`);
  return f.file_id;
}

const outDir = path.join(process.cwd(), "public", "demo", "generated");
await mkdir(outDir, { recursive: true });
await mkdir("spike", { recursive: true });
const log: Record<string, unknown> = { ranAt: new Date().toISOString(), personas: [] as unknown[] };

for (const persona of PERSONAS.filter((p) => !only || only.includes(p.id))) {
  const file = path.join(outDir, `${persona.id}.jpg`);
  const entry: Record<string, unknown> = { id: persona.id, intended: persona.intended };
  const exists = await access(file).then(() => true, () => false);

  if (!detectOnly || !exists) {
    const gen = await run("text-to-image/youcam", {
      model: "youcam-image-v2",
      prompt: persona.prompt,
      negative_prompt: NEGATIVE,
      size: "1104*1472",
    });
    entry.generate = { ok: gen.ok, ms: gen.ms, ...(gen.ok ? {} : { error: gen.error, message: gen.message }) };
    const url = gen.ok ? findUrl(gen.results) : undefined;
    if (!url) {
      entry.generateRaw = gen.ok ? gen.results : undefined;
      console.log(`✗ ${persona.id}: generation failed`, gen.ok ? "(no url)" : gen.error);
      (log.personas as unknown[]).push(entry);
      continue;
    }
    const img = Buffer.from(await (await fetch(url)).arrayBuffer());
    await writeFile(file, img);
    console.log(`✓ generated ${persona.id} (${Math.round(img.byteLength / 1024)} KB, ${gen.ms} ms)`);
  }

  const frontId = await upload(await readFile(file), `${persona.id}.jpg`);
  const ids: Record<View, string> = { front: frontId, right: "", left: "", down: "" };
  for (const view of ["right", "left", "down"] as const) {
    const vfile = path.join(outDir, `${persona.id}-${view}.jpg`);
    if (!(await access(vfile).then(() => true, () => false))) {
      const v = await run("image-to-image/youcam", {
        src_file_ids: [frontId],
        model: "youcam-image-v2",
        prompt: VIEW_PROMPTS[view],
        negative_prompt: NEGATIVE,
        size: "1104*1472",
      });
      const url = v.ok ? findUrl(v.results) : undefined;
      if (!url) {
        console.log(`  ✗ ${view} view failed: ${v.ok ? "no url" : v.error}`);
        entry[`${view}ViewError`] = v.ok ? "no url" : v.error;
        continue;
      }
      await writeFile(vfile, Buffer.from(await (await fetch(url)).arrayBuffer()));
      console.log(`  ✓ ${view} view`);
    }
    if (await access(vfile).then(() => true, () => false)) ids[view] = await upload(await readFile(vfile), `${persona.id}-${view}.jpg`);
  }
  const repeats = persona.id === "coily-long-full" || persona.id === "curly-collarbone" ? 2 : 1;
  const detections: Record<string, unknown[]> = {};
  for (let r = 0; r < repeats; r++) {
    const results = await Promise.all(
      FEATURES.filter((f) => f.views.every((v) => ids[v])).map(async (f) => {
        const fileIds = f.views.map((v) => ids[v]);
        const body = fileIds.length > 1 ? { src_file_ids: fileIds } : { src_file_id: fileIds[0] };
        const res = await run(f.slug, body);
        return [f.name, res.ok ? { results: res.results, ms: res.ms } : { error: res.error, message: res.message, ms: res.ms }] as const;
      }),
    );
    for (const [name, v] of results) (detections[name] ??= []).push(v);
  }
  entry.detections = detections;
  const brief = Object.fromEntries(Object.entries(detections).map(([k, v]) => [k, JSON.stringify((v[0] as { results?: unknown; error?: string }).results ?? (v[0] as { error?: string }).error)]));
  console.log(`  ${persona.id}:`, brief);
  (log.personas as unknown[]).push(entry);
}

await writeFile(only ? `spike/results-${only.join("+")}.json` : "spike/results.json", JSON.stringify(log, null, 2));
console.log("wrote spike/results.json");
