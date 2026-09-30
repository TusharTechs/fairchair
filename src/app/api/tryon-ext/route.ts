import { demoClient } from "@/data/demo-clients";
import { liveStatus } from "@/lib/analysis/service";
import { track } from "@/lib/events";
import { clientIpHash, json, problem } from "@/lib/http";
import { shopBySlug } from "@/lib/shops";
import { runExtensionTryOn } from "@/lib/tryon-ext";
import { YouCamError, guidanceFor } from "@/lib/youcam/errors";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form) return problem(400, "bad_request", "Expected multipart form data.");
  const found = await shopBySlug(String(form.get("shop") ?? ""));
  if (!found) return problem(404, "not_found", "That store doesn't exist.");
  const template = String(form.get("template") ?? "all_length_2_");

  const demoId = form.get("demo");
  if (typeof demoId === "string" && demoId) {
    const image = demoClient(demoId)?.extPreview;
    if (!image) return problem(404, "not_recorded", "No recorded preview for this demo client.");
    return json({ image, source: "replay" });
  }

  const front = form.get("front");
  if (!(front instanceof File) || front.type !== "image/jpeg" || front.size > 1_500_000) {
    return problem(415, "unsupported", "Send your front photo as a JPG.");
  }
  const status = await liveStatus(clientIpHash(req));
  if (!status.available) return problem(503, status.reason, "Live previews are paused right now.");
  try {
    const out = await runExtensionTryOn(new Uint8Array(await front.arrayBuffer()), template);
    await track("ext_tryon_done", found.shop.id, { template });
    return json({ image: `data:${out.contentType};base64,${Buffer.from(out.bytes).toString("base64")}`, source: "live" });
  } catch (e) {
    const code = e instanceof YouCamError ? e.code : "request_failed";
    return problem(502, code, guidanceFor(code));
  }
}
