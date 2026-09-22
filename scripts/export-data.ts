/**
 * `pnpm export:data <output.json>`
 *
 * Dumps every row this app has written (not the fixed code sets — those live
 * in code already) to a JSON file, in an order the restore endpoint can
 * insert safely (parents before children). Read-only against whichever
 * DATABASE_URL is active — normally your local dev DB.
 *
 * The output file holds real content (names, notes, comments) — never
 * committed, never sent anywhere but the one restore call this pairs with.
 */
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { db } from '../src/core/db';
import {
  appUser,
  personAlias,
  roadmapItem,
  roadmapItemAssignee,
  roadmapItemTheme,
  roadmapSource,
  roadmapStatusLog,
  roadmapComment,
  proposal,
  importNote,
} from '../src/core/schema';

const outPath = process.argv[2];
if (!outPath) {
  console.error('usage: tsx scripts/export-data.ts <output.json>');
  process.exit(1);
}

async function main() {
  const dump = {
    appUser: await db.select().from(appUser),
    personAlias: await db.select().from(personAlias),
    // roadmap_item's own parent_id is handled separately by the restore
    // endpoint (insert with parent_id null, then a second pass sets it) —
    // self-references can't be ordered any other way.
    roadmapItem: await db.select().from(roadmapItem),
    roadmapItemAssignee: await db.select().from(roadmapItemAssignee),
    roadmapItemTheme: await db.select().from(roadmapItemTheme),
    roadmapSource: await db.select().from(roadmapSource),
    roadmapStatusLog: await db.select().from(roadmapStatusLog),
    roadmapComment: await db.select().from(roadmapComment),
    proposal: await db.select().from(proposal),
    importNote: await db.select().from(importNote),
  };

  writeFileSync(outPath, JSON.stringify(dump));

  console.log('Exported:');
  for (const [table, rows] of Object.entries(dump)) console.log(`  ${table.padEnd(22)} ${rows.length}`);
  console.log(`\n→ ${outPath}`);

  await db.$client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
