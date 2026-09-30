import "server-only";
import { getDb, schema } from "@/lib/db";
import { uploadImage } from "@/lib/youcam/files";
import { YouCamError } from "@/lib/youcam/errors";
import { log } from "@/lib/youcam/http";
import { deleteTask, pollRawTask, startRawTask } from "@/lib/youcam/tasks";

const PATH = "/s2s/v2.0/task/hair-ext";
const TEMPLATES = new Set(["all_length_1", "all_length_2_", "all_length_3"]);

function findUrl(v: unknown): string | undefined {
  if (typeof v === "string" && /^https?:\/\//.test(v)) return v;
  if (v && typeof v === "object") for (const x of Object.values(v)) { const u = findUrl(x); if (u) return u; }
  return undefined;
}

/**
 * Shows extensions blended into the shopper's own hair (YouCam hair-ext). The
 * input must be a JPG with the long side ≤ 1024 px and shoulders visible.
 * Nothing is stored; the task and its files are deleted afterwards.
 */
export async function runExtensionTryOn(jpeg: Uint8Array, template: string) {
  if (!TEMPLATES.has(template)) throw new YouCamError({ code: "invalid_parameter", message: "Unknown template" });
  const src = await uploadImage(jpeg, "image/jpeg", "shopper.jpg");
  const taskId = await startRawTask(PATH, { src_file_id: src, template_id: template });
  try {
    const started = Date.now();
    while (Date.now() - started < 50_000) {
      await new Promise((r) => setTimeout(r, 2000));
      const state = await pollRawTask(PATH, taskId);
      if (state.status === "running") continue;
      if (state.status === "error") throw new YouCamError({ code: state.code, message: state.message ?? state.code });
      const url = findUrl(state.results);
      if (!url) throw new YouCamError({ code: "malformed_response", message: "hair-ext returned no image" });
      const img = await fetch(url);
      if (!img.ok) throw new YouCamError({ code: "request_failed", message: `result download ${img.status}` });
      const db = await getDb();
      await db.insert(schema.usageLedger).values({ feature: "hair-ext", units: 1 });
      return { bytes: new Uint8Array(await img.arrayBuffer()), contentType: img.headers.get("content-type") ?? "image/jpeg" };
    }
    throw new YouCamError({ code: "timeout", message: "Try-on took too long", retryable: true });
  } finally {
    deleteTask(taskId).catch((e) => log("youcam.delete_failed", { message: (e as Error).message }));
  }
}
