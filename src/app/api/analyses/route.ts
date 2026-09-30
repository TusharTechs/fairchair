import { z } from "zod";
import { createDemoAnalysis, createLiveAnalysis, LiveUnavailable, type Photos } from "@/lib/analysis/service";
import { track } from "@/lib/events";
import { clientIpHash, json, problem } from "@/lib/http";
import { shopBySlug } from "@/lib/shops";
import { studioBySlug } from "@/lib/studios";
import { YouCamError } from "@/lib/youcam/errors";
import { featuresFor, VIEWS } from "@/lib/youcam/features";

export const runtime = "nodejs";

// Serverless hosting caps request bodies at ~4.5 MB; the browser sends four
// resized selfies of a few hundred KB each.
const MAX_BYTES = 3 * 1024 * 1024;
const MAX_TOTAL = 4 * 1024 * 1024;
const Fields = z.union([
  z.object({ studio: z.string().min(1).max(80), service: z.string().min(1).max(80), demo: z.string().max(40).optional() }),
  z.object({ shop: z.string().min(1).max(80), demo: z.string().max(40).optional() }),
]);

// What an extension store needs measured: texture, fullness, length. Colour is
// the shopper's choice (YouCam hair_color misread dark hair in our tests).
const SHOP_FEATURES = featuresFor(["type", "density", "length"]);

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return problem(400, "bad_request", "Expected multipart form data.");
  }
  const raw = Object.fromEntries(["studio", "service", "shop", "demo"].flatMap((k) => (form.get(k) ? [[k, form.get(k)]] : [])));
  const parsed = Fields.safeParse(raw);
  if (!parsed.success) return problem(400, "bad_request", "Missing studio/service or shop.");

  let ownerId: string;
  let features: ReturnType<typeof featuresFor>;
  if ("shop" in parsed.data) {
    const shop = await shopBySlug(parsed.data.shop);
    if (!shop) return problem(404, "not_found", "That store doesn't exist.");
    ownerId = shop.shop.id;
    features = SHOP_FEATURES;
  } else {
    const found = await studioBySlug(parsed.data.studio);
    const service = found?.studio.services.find((s) => s.id === (parsed.data as { service: string }).service);
    if (!found || !service) return problem(404, "not_found", "That studio or service doesn't exist.");
    ownerId = found.studio.id;
    features = featuresFor(service.measures);
  }

  if (parsed.data.demo) {
    try {
      const id = await createDemoAnalysis(ownerId, parsed.data.demo, features);
      await track("analysis_created", ownerId, { source: "demo", demo: parsed.data.demo });
      return json({ id });
    } catch {
      return problem(404, "not_found", "Unknown demo client.");
    }
  }

  // Four guided selfies: front (required), right, left, down (optional).
  const photos: Photos = {};
  for (const view of VIEWS) {
    const f = form.get(view);
    if (!(f instanceof File)) continue;
    if (f.size > MAX_BYTES) return problem(413, "too_large", "Each photo must be under 3 MB.");
    if (f.type !== "image/jpeg" && f.type !== "image/png") return problem(415, "unsupported", "Photos must be JPG or PNG.");
    photos[view] = { bytes: new Uint8Array(await f.arrayBuffer()), contentType: f.type };
  }
  if (!photos.front) return problem(400, "bad_request", "A front photo is required.");
  const total = Object.values(photos).reduce((sum, p) => sum + (p?.bytes.byteLength ?? 0), 0);
  if (total > MAX_TOTAL) return problem(413, "too_large", "Those photos are too large together. Please retake them.");

  try {
    const id = await createLiveAnalysis({ studioId: ownerId, photos, features, ipHash: clientIpHash(req) });
    await track("analysis_created", ownerId, { source: "live", views: Object.keys(photos) });
    return json({ id });
  } catch (e) {
    if (e instanceof LiveUnavailable) return problem(503, e.reason, e.message);
    if (e instanceof YouCamError) return problem(502, e.code, "The hair analysis service is unavailable. Please try again.");
    throw e;
  }
}
