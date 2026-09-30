import "server-only";
import path from "node:path";
import { drizzle as drizzlePglite, type PgliteDatabase } from "drizzle-orm/pglite";
import * as schema from "./schema";

// One Postgres API everywhere: Neon (serverless HTTP) when DATABASE_URL is
// set, otherwise an embedded PGlite database under .data/ for zero-setup
// local development.

export type DB = PgliteDatabase<typeof schema>;

// Route handlers and pages are separate bundles in dev; keep one connection
// per process (PGlite must not open the same directory twice).
const g = globalThis as unknown as { __fairchairDb?: Promise<DB> };

async function connect(): Promise<DB> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    // Same query-builder surface; migrations run via `npm run db:migrate`.
    return drizzle(neon(url), { schema }) as unknown as DB;
  }
  if (process.env.VERCEL) {
    throw new Error("DATABASE_URL is not set. Add a Neon Postgres database to this Vercel project.");
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const { mkdir } = await import("node:fs/promises");
  const dir = path.join(process.cwd(), ".data", "pglite");
  await mkdir(dir, { recursive: true });
  const client = new PGlite(dir);
  const db = drizzlePglite(client, { schema });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  return db;
}

export async function getDb(): Promise<DB> {
  g.__fairchairDb ??= connect()
    .then(async (db) => {
      const { ensureDemoStudio } = await import("./seed");
      await ensureDemoStudio(db);
      return db;
    })
    .catch((e) => {
      g.__fairchairDb = undefined; // retry on the next request
      throw e;
    });
  return g.__fairchairDb;
}

export { schema };
