import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

/**
 * drizzle-kit config — migrations live in `drizzle/`, generated from the schema
 * in `src/core/schema`. Migrations are committed to the repo (plan §5).
 *
 * `pnpm db:generate` after a schema change, review the SQL, `pnpm db:migrate`
 * to apply. Never edit a generated migration by hand once it's been applied.
 */
export default defineConfig({
  schema: './src/core/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  casing: 'snake_case',
  strict: true,
  verbose: true,
});
