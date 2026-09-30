import { z } from "zod";
import { track } from "@/lib/events";
import { json, problem } from "@/lib/http";
import { createQuote } from "@/lib/quotes";
import { studioBySlug } from "@/lib/studios";

export const runtime = "nodejs";

const Body = z.object({
  studio: z.string().min(1),
  service: z.string().min(1),
  analysisId: z.string().min(1),
  options: z.object({
    size: z.string().max(40).optional(),
    length: z.string().max(40).optional(),
    stretched: z.enum(["short", "shoulder", "chest", "long"]).optional(),
  }),
  clientName: z.string().max(60).default(""),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return problem(400, "bad_request", "Invalid quote request.");
  const found = await studioBySlug(parsed.data.studio);
  if (!found) return problem(404, "not_found", "Studio not found.");
  try {
    const id = await createQuote({
      studio: found.studio,
      serviceId: parsed.data.service,
      options: parsed.data.options,
      analysisId: parsed.data.analysisId,
      clientName: parsed.data.clientName,
    });
    await track("quote_created", found.studio.id, { service: parsed.data.service });
    return json({ id });
  } catch (e) {
    return problem(422, "unprocessable", (e as Error).message);
  }
}
