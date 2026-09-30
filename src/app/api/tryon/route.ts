import { demoClient } from "@/data/demo-clients";
import { liveStatus } from "@/lib/analysis/service";
import { track } from "@/lib/events";
import { clientIpHash, json, problem } from "@/lib/http";
import { studioBySlug } from "@/lib/studios";
import { runTryOn } from "@/lib/tryon";
import { YouCamError, guidanceFor } from "@/lib/youcam/errors";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form) return problem(400, "bad_request", "Expected multipart form data.");
  const found = await studioBySlug(String(form.get("studio") ?? ""));
  const service = found?.studio.services.find((s) => s.id === form.get("service"));
  if (!found || !service) return problem(404, "not_found", "That studio or service doesn't exist.");
  if (!service.portfolio) return problem(404, "no_portfolio", "This service has no portfolio photo to preview.");

  const demoId = form.get("demo");
  if (typeof demoId === "string" && demoId) {
    const image = demoClient(demoId)?.previews?.[service.id];
    if (!image) return problem(404, "not_recorded", "No recorded preview for this demo client.");
    return json({ image, source: "replay" });
  }

  const front = form.get("front");
  if (!(front instanceof File)) return problem(400, "bad_request", "Send your front photo.");
  if (front.size > MAX_BYTES || (front.type !== "image/jpeg" && front.type !== "image/png")) {
    return problem(415, "unsupported", "Use a JPG or PNG under 8 MB.");
  }

  const status = await liveStatus(clientIpHash(req));
  if (!status.available) return problem(503, status.reason, "Live previews are paused right now.");

  // The portfolio image is a public asset; fetch it through the site's own URL
  // so this works the same locally and on serverless hosting.
  const refRes = await fetch(new URL(service.portfolio.image, req.url));
  if (!refRes.ok) return problem(502, "reference_unavailable", "The stylist's portfolio photo couldn't be loaded.");
  const refType = refRes.headers.get("content-type")?.includes("png") ? "image/png" : "image/jpeg";

  try {
    const out = await runTryOn(
      { bytes: new Uint8Array(await front.arrayBuffer()), contentType: front.type },
      { bytes: new Uint8Array(await refRes.arrayBuffer()), contentType: refType },
    );
    await track("tryon_done", found.studio.id, { service: service.id });
    return json({ image: `data:${out.contentType};base64,${Buffer.from(out.bytes).toString("base64")}`, source: "live" });
  } catch (e) {
    const code = e instanceof YouCamError ? e.code : "request_failed";
    return problem(502, code, guidanceFor(code));
  }
}
