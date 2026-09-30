import "server-only";
import { getDb, schema } from "@/lib/db";

export async function track(name: string, studioId: string | null, props: Record<string, unknown> = {}) {
  try {
    const db = await getDb();
    await db.insert(schema.events).values({ name, studioId, props });
  } catch {
    // Analytics must never break a user flow.
  }
}
