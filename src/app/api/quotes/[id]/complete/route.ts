import { z } from "zod";
import { json, problem } from "@/lib/http";
import { completeQuote, getQuote } from "@/lib/quotes";
import { authorizeStudio } from "@/lib/studios";
import { studioById } from "@/lib/studios";

export const runtime = "nodejs";

const Body = z.object({ actualMinutes: z.number().int().min(15).max(24 * 60), token: z.string().min(1) });

export async function POST(req: Request, ctx: RouteContext<"/api/quotes/[id]/complete">) {
  const { id } = await ctx.params;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return problem(400, "bad_request", "Enter the actual minutes.");
  const q = await getQuote(id);
  if (!q) return problem(404, "not_found", "Quote not found.");
  const studio = await studioById(q.studioId);
  if (!studio || !(await authorizeStudio(studio.slug, parsed.data.token))) return problem(403, "forbidden", "Not your studio.");
  await completeQuote(studio.id, id, parsed.data.actualMinutes);
  return json({ ok: true });
}
