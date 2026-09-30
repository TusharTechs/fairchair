import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { json, problem } from "@/lib/http";
import { newId } from "@/lib/security";
import { authorizeStudio, updateStudio } from "@/lib/studios";

export const runtime = "nodejs";

const MAX_BYTES = 1_500_000;
const Fields = z.object({
  token: z.string().min(1),
  service: z.string().min(1).max(80),
  caption: z.string().trim().max(160).default(""),
  consent: z.literal("yes"),
});

// Stylist uploads a photo of their own work for a service; clients can then
// preview that exact style on themselves (YouCam hair-transfer reference).
export async function POST(req: Request, ctx: RouteContext<"/api/studios/[slug]/portfolio">) {
  const { slug } = await ctx.params;
  const form = await req.formData().catch(() => null);
  if (!form) return problem(400, "bad_request", "Expected multipart form data.");
  const parsed = Fields.safeParse({
    token: form.get("token"),
    service: form.get("service"),
    caption: form.get("caption") ?? "",
    consent: form.get("consent"),
  });
  if (!parsed.success) return problem(400, "bad_request", "Confirm you have permission to use this photo.");

  const studio = await authorizeStudio(slug, parsed.data.token);
  if (!studio) return problem(403, "forbidden", "That admin link isn't valid.");
  if ((studio as { isDemo?: boolean }).isDemo) return problem(403, "demo", "The demo studio is read-only. Create your own studio to upload photos.");
  const service = studio.services.find((s) => s.id === parsed.data.service);
  if (!service) return problem(404, "not_found", "Service not found.");

  const file = form.get("image");
  if (!(file instanceof File)) return problem(400, "bad_request", "Choose a photo.");
  if (file.type !== "image/jpeg" && file.type !== "image/png") return problem(415, "unsupported", "Use a JPG or PNG.");
  if (file.size > MAX_BYTES) return problem(413, "too_large", "That photo is too large.");

  const db = await getDb();
  const id = newId("asset");
  await db.insert(schema.assets).values({ id, studioId: studio.id, contentType: file.type, data: Buffer.from(await file.arrayBuffer()).toString("base64") });
  const caption = parsed.data.caption || `${service.name} by ${studio.name}`;
  await updateStudio(studio.id, {
    services: studio.services.map((s) =>
      s.id === service.id ? { ...s, portfolio: { image: `/api/assets/${id}`, caption }, preview: "hair-transfer" as const } : s,
    ),
  });
  return json({ image: `/api/assets/${id}`, caption });
}
