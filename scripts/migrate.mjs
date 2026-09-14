/**
 * Applies pending migrations, then exits. Run automatically before the server
 * starts (see Dockerfile CMD) — never manually against a production database
 * from outside the platform's network.
 *
 * Deliberately plain JS, not TypeScript: this runs in the FINAL production
 * image, which only has `dependencies` installed (no tsx, no drizzle-kit —
 * see Dockerfile). `drizzle-orm/postgres-js/migrator` ships as part of
 * drizzle-orm itself, so this needs nothing beyond what's already there.
 *
 * Idempotent — drizzle tracks applied migrations in `drizzle.__drizzle_migrations`
 * and skips ones already run. Safe to execute on every boot.
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set — cannot migrate. Refusing to start with an unmigrated schema.');
  process.exit(1);
}

const client = postgres(url, { max: 1 });
const db = drizzle(client);

console.log('[migrate] applying pending migrations...');
await migrate(db, { migrationsFolder: './drizzle' });
console.log('[migrate] done.');

await client.end();
