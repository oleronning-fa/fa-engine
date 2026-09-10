/**
 * `pnpm db:health` — prove the database is reachable and the schema is applied.
 *
 * Prints the Postgres version, whether pgvector is installed, how many
 * migrations have run, and a row count for every table. Read-only.
 */
import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db } from '../src/core/db';

async function main() {
  const version = await db.execute<{ version: string }>(sql`SELECT version()`);
  console.log(version[0].version.split(',')[0]);

  const ext = await db.execute<{ extversion: string }>(
    sql`SELECT extversion FROM pg_extension WHERE extname = 'vector'`,
  );
  console.log(ext.length ? `pgvector ${ext[0].extversion}` : 'pgvector NOT installed');

  const migrations = await db
    .execute<{ count: string }>(sql`SELECT count(*)::text AS count FROM drizzle.__drizzle_migrations`)
    .catch(() => [{ count: '0 (none applied)' }]);
  console.log(`migrations applied: ${migrations[0].count}`);

  const tables = await db.execute<{ table_name: string }>(sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  console.log(`\n${tables.length} tables:`);
  console.log('table                          rows');
  console.log('------------------------------ ----');
  for (const { table_name } of tables) {
    const [{ n }] = await db.execute<{ n: string }>(
      sql`SELECT count(*)::text AS n FROM ${sql.identifier(table_name)}`,
    );
    console.log(`${table_name.padEnd(30)} ${n}`);
  }

  await db.$client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
