import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: RouteContext<"/api/assets/[id]">) {
  const { id } = await ctx.params;
  const db = await getDb();
  const [asset] = await db.select().from(schema.assets).where(eq(schema.assets.id, id));
  if (!asset) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(Buffer.from(asset.data, "base64")), {
    headers: {
      "Content-Type": asset.contentType,
      // Asset ids are never reused, so the bytes can be cached forever.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
