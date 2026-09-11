/**
 * `pnpm import:roadmap [path] [--write]`
 *
 * Default is a DRY RUN: parses the sheet, resolves people/areas/statuses,
 * prints a summary — writes nothing. Pass `--write` to actually insert into
 * the database configured by `DATABASE_URL` (your local practice DB unless
 * you've pointed it somewhere else).
 *
 * Safe to run repeatedly: each run gets its own `runId`, and dry runs never
 * touch the database at all (roadmap-krav §5: "må kjøres flere ganger mot en
 * testdatabase før den treffer").
 */
import 'dotenv/config';
import { db } from '../src/core/db';
import { runImport } from '../src/modules/roadmap/import/run';

const args = process.argv.slice(2);
const write = args.includes('--write');
const path = args.find((a) => !a.startsWith('--')) ?? 'import-source/big-headlines-allocation-plan.xlsx';

async function main() {
  console.log(`${write ? 'WRITE' : 'DRY RUN'} — ${path}\n`);
  const summary = await runImport(db, { path, write });

  console.log(`run: ${summary.runId}`);
  console.log(`items parsed: ${summary.totalItems}`);
  console.log('\nby type:');
  for (const [k, v] of Object.entries(summary.byType)) console.log(`  ${k.padEnd(10)} ${v}`);
  console.log('\nby status:');
  for (const [k, v] of Object.entries(summary.byStatus)) console.log(`  ${k.padEnd(20)} ${v}`);

  console.log(`\nunresolved area: ${summary.unresolvedAreaCount}`);
  console.log(`unresolved names (${summary.unresolvedNames.length}): ${summary.unresolvedNames.join(', ') || '(none)'}`);
  console.log(`total review notes: ${summary.notesCount}`);

  if (summary.sampleNotes.length) {
    console.log(`\nfirst ${summary.sampleNotes.length} notes:`);
    for (const n of summary.sampleNotes) console.log(`  [${n.issue}] ${n.sourceRef} — ${n.detail}`);
  }

  console.log(write ? '\nWritten to the database.' : '\nNothing written — this was a dry run.');
  await db.$client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
