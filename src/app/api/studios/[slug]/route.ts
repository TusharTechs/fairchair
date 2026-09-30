import { z } from "zod";
import { json, problem } from "@/lib/http";
import { authorizeStudio, updateStudio } from "@/lib/studios";

export const runtime = "nodejs";

const Minutes = z.record(z.string(), z.number().int().min(-240).max(600));
const Adjustment = z.object({
  id: z.string(),
  basis: z.enum(["density", "length", "type", "frizz"]),
  label: z.string().max(80),
  minutes: Minutes,
  price: z.record(z.string(), z.number().min(0).max(2000)).optional(),
});
const Service = z.object({
  id: z.string(),
  template: z.enum(["knotless", "silk-press", "sew-in", "tape-ins", "wig-install"]),
  name: z.string().max(60),
  blurb: z.string().max(200),
  axes: z.array(z.any()),
  basePrice: z.record(z.string(), z.number().min(0).max(10000)),
  baseMinutes: z.record(z.string(), z.number().int().min(15).max(1440)),
  adjustments: z.array(Adjustment),
  supplies: z.any().optional(),
  measures: z.array(z.enum(["type", "density", "length", "frizz", "color"])),
  preview: z.enum(["hair-ext", "hair-transfer", "none"]).optional(),
});
const Body = z.object({
  token: z.string().min(1),
  patch: z.object({
    name: z.string().trim().min(2).max(60).optional(),
    city: z.string().trim().max(60).optional(),
    hourlyRate: z.number().int().min(10).max(500).optional(),
    depositPct: z.number().min(0).max(1).optional(),
    priceByTime: z.boolean().optional(),
    services: z.array(Service).optional(),
  }),
});

export async function PATCH(req: Request, ctx: RouteContext<"/api/studios/[slug]">) {
  const { slug } = await ctx.params;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return problem(400, "bad_request", "Invalid update.");
  const studio = await authorizeStudio(slug, parsed.data.token);
  if (!studio) return problem(403, "forbidden", "That admin link isn't valid.");
  if ((studio as { isDemo?: boolean }).isDemo) return problem(403, "demo", "The demo studio is read-only. Create your own studio to edit prices.");
  await updateStudio(studio.id, parsed.data.patch as Parameters<typeof updateStudio>[1]);
  return json({ ok: true });
}
