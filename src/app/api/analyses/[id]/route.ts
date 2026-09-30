import { getAnalysis } from "@/lib/analysis/service";
import { json, problem } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: RouteContext<"/api/analyses/[id]">) {
  const { id } = await ctx.params;
  const view = await getAnalysis(id);
  if (!view) return problem(404, "not_found", "Analysis not found.");
  return json(view);
}
