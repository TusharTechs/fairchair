// Applies drizzle/ migrations to the Postgres database in DATABASE_URL.
// Runs automatically before `next build`; a no-op when DATABASE_URL is unset
// (local development uses embedded PGlite, which migrates itself on startup).
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

const url = process.env.DATABASE_URL;
if (!url) {
  if (process.env.VERCEL) {
    console.error("DATABASE_URL is not set. Add a Neon Postgres database to this Vercel project (Storage → Neon).");
    process.exit(1);
  }
  console.log("DATABASE_URL not set — skipping migrations (local PGlite migrates on startup).");
  process.exit(0);
}
await migrate(drizzle(neon(url)), { migrationsFolder: "drizzle" });
console.log("migrations applied");
