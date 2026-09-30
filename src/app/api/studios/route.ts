import { z } from "zod";
import { track } from "@/lib/events";
import { json, problem } from "@/lib/http";
import { createStudio } from "@/lib/studios";

export const runtime = "nodejs";

const Body = z.object({
  name: z.string().trim().min(2).max(60),
  city: z.string().trim().max(60).default(""),
  hourlyRate: z.number().int().min(10).max(500),
  depositPct: z.number().min(0).max(1),
  timezone: z.string().max(60).refine((tz) => {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }, "Unknown timezone"),
  templates: z.array(z.enum(["knotless", "silk-press", "sew-in", "tape-ins", "wig-install"])).min(1),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return problem(400, "bad_request", "Check the studio details.");
  const { slug, token } = await createStudio(parsed.data);
  await track("studio_created", null, { templates: parsed.data.templates });
  return json({ slug, token });
}
