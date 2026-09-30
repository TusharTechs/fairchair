import { z } from "zod";
import { track } from "@/lib/events";
import { json, problem } from "@/lib/http";
import { bookQuote, getQuote } from "@/lib/quotes";

export const runtime = "nodejs";

const Body = z.object({ startAt: z.iso.datetime() });

export async function POST(req: Request, ctx: RouteContext<"/api/quotes/[id]/book">) {
  const { id } = await ctx.params;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return problem(400, "bad_request", "Pick a start time.");
  const q = await getQuote(id);
  if (!q) return problem(404, "not_found", "Quote not found.");
  if (q.status !== "quoted") return problem(409, "conflict", "This quote is already booked.");
  await bookQuote(id, new Date(parsed.data.startAt));
  await track("booking_created", q.studioId, { slotMinutes: q.result.slotMinutes });
  return json({ ok: true });
}
