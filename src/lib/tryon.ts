import "server-only";
import { getDb, schema } from "@/lib/db";
import { uploadImage } from "@/lib/youcam/files";
import { YouCamError } from "@/lib/youcam/errors";
import { deleteTask, pollRawTask, startRawTask } from "@/lib/youcam/tasks";
import { log } from "@/lib/youcam/http";

const PATH = "/s2s/v2.1/task/hair-transfer";
export const TRYON_UNITS = 2;

function findUrl(v: unknown): string | undefined {
  if (typeof v === "string" && /^https?:\/\//.test(v)) return v;
  if (v && typeof v === "object") for (const x of Object.values(v)) { const u = findUrl(x); if (u) return u; }
  return undefined;
}

/**
 * Shows the stylist's portfolio style on the client with YouCam hair-transfer.
 * Returns the image bytes; nothing is stored, and the YouCam task (with its
 * inputs and output) is deleted as soon as the result has been fetched.
 */
export async function runTryOn(client: { bytes: Uint8Array; contentType: "image/jpeg" | "image/png" }, reference: { bytes: Uint8Array; contentType: "image/jpeg" | "image/png" }) {
  const [src, ref] = await Promise.all([
    uploadImage(client.bytes, client.contentType, "client.jpg"),
    uploadImage(reference.bytes, reference.contentType, "reference.jpg"),
  ]);
  const taskId = await startRawTask(PATH, { src_file_id: src, ref_file_id: ref });
  try {
    const started = Date.now();
    while (Date.now() - started < 50_000) {
      await new Promise((r) => setTimeout(r, 2000));
      const state = await pollRawTask(PATH, taskId);
      if (state.status === "running") continue;
      if (state.status === "error") throw new YouCamError({ code: state.code, message: state.message ?? state.code });
      const url = findUrl(state.results);
      if (!url) throw new YouCamError({ code: "malformed_response", message: "hair-transfer returned no image" });
      const img = await fetch(url);
      if (!img.ok) throw new YouCamError({ code: "request_failed", message: `result download ${img.status}` });
      const db = await getDb();
      await db.insert(schema.usageLedger).values({ feature: "hair-transfer", units: TRYON_UNITS });
      return { bytes: new Uint8Array(await img.arrayBuffer()), contentType: img.headers.get("content-type") ?? "image/jpeg" };
    }
    throw new YouCamError({ code: "timeout", message: "Try-on took too long", retryable: true });
  } finally {
    deleteTask(taskId).catch((e) => log("youcam.delete_failed", { message: (e as Error).message }));
  }
}
