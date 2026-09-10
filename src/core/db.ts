import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * The one database connection.
 *
 * `DATABASE_URL` is read from the environment, not from `astro:env/server`, so
 * the same module works inside the Astro server AND in plain scripts
 * (drizzle-kit, the importer, the worker). Locally it's in `.env`; in
 * production the platform injects it in Coolify (see `skills/add-database.md`
 * and the `coolify` skill). Never commit a real value.
 *
 * Failing loudly when it's missing is deliberate — an app that boots without a
 * database and silently stores nothing is worse than a clear crash.
 */
const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    'DATABASE_URL is not set. Local dev: add it to .env ' +
      '(postgres://<you>@localhost:5432/fa_engine_dev). Production: the platform ' +
      'injects it in Coolify.',
  );
}

/**
 * Shared pool. Small — the Postgres server is shared with every other app on
 * the platform. The worker process opens its own separate client.
 */
const client = postgres(url, { max: 10 });

export const db = drizzle(client, { schema });

export { schema };
export type Database = typeof db;
