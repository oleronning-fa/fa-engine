/**
 * One-time data restore — loads a JSON dump (scripts/export-data.ts) into
 * THIS process's own database. Exists so local work can reach production
 * without ever opening the database to the internet: the dump travels over
 * ordinary HTTPS to the already-public app, which then talks to its own
 * database on the internal network, exactly like every other write in this
 * app already does.
 *
 * Two independent guards, not just the secret: (1) requires
 * `x-admin-secret` to match ADMIN_SYNC_SECRET, unset once done; (2) refuses
 * if any row in THIS payload's app_user or roadmap_item ids already exists
 * in the target database, so a leaked secret — or an accidental second
 * run — can't duplicate or corrupt data. This is deliberately an overlap
 * check on the payload's own ids, not "the table must be empty": the
 * target database may already hold real rows created directly through the
 * live app (as production did — 3 epics from before this endpoint
 * existed), and those must be left alone, not treated as a reason to
 * refuse or as something safe to overwrite.
 */
import type { APIRoute } from 'astro';
import { ADMIN_SYNC_SECRET } from 'astro:env/server';
import { inArray, sql } from 'drizzle-orm';
import { db } from '../../../core/db';
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
} from '../../../core/schema';

// `JSON.stringify` turns every `timestamp` column's Date into a full
// ISO-8601 string (scripts/export-data.ts never touches this — it's
// automatic). Plain `date`-only columns (e.g. target_date) come out as
// bare "YYYY-MM-DD" and must stay strings — Drizzle expects those as-is.
// Reviving only the full datetime shape back into a Date keeps both kinds
// correct without hardcoding a field list that would drift as the schema
// changes.
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
function isoDateReviver(_key: string, value: unknown) {
  return typeof value === 'string' && ISO_DATETIME.test(value) ? new Date(value) : value;
}

export const POST: APIRoute = async ({ request }) => {
  if (!ADMIN_SYNC_SECRET) {
    return new Response('Not configured', { status: 404 });
  }
  if (request.headers.get('x-admin-secret') !== ADMIN_SYNC_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const dump = JSON.parse(await request.text(), isoDateReviver) as {
    appUser: (typeof appUser.$inferInsert)[];
    personAlias: (typeof personAlias.$inferInsert)[];
    roadmapItem: (typeof roadmapItem.$inferInsert & { parentId: string | null })[];
    roadmapItemAssignee: (typeof roadmapItemAssignee.$inferInsert)[];
    roadmapItemTheme: (typeof roadmapItemTheme.$inferInsert)[];
    roadmapSource: (typeof roadmapSource.$inferInsert)[];
    roadmapStatusLog: (typeof roadmapStatusLog.$inferInsert & { id?: number })[];
    roadmapComment: (typeof roadmapComment.$inferInsert)[];
    proposal: (typeof proposal.$inferInsert)[];
    importNote: (typeof importNote.$inferInsert)[];
  };

  const userIds = dump.appUser.map((u) => u.id).filter((id): id is string => !!id);
  const itemIds = dump.roadmapItem.map((r) => r.id).filter((id): id is string => !!id);
  const [existingUser] = userIds.length
    ? await db.select({ id: appUser.id }).from(appUser).where(inArray(appUser.id, userIds)).limit(1)
    : [];
  const [existingItem] = itemIds.length
    ? await db.select({ id: roadmapItem.id }).from(roadmapItem).where(inArray(roadmapItem.id, itemIds)).limit(1)
    : [];
  if (existingUser || existingItem) {
    return new Response('Refusing: this payload has already been restored into this database (matching id found).', { status: 409 });
  }

  try {
    await db.transaction(async (tx) => {
      if (dump.appUser.length) await tx.insert(appUser).values(dump.appUser);
      if (dump.personAlias.length) await tx.insert(personAlias).values(dump.personAlias);

      // Self-referential parent_id: insert every item with it nulled out
      // first, then a second pass sets the real value once every row exists.
      if (dump.roadmapItem.length) {
        await tx.insert(roadmapItem).values(dump.roadmapItem.map((r) => ({ ...r, parentId: null })));
        for (const r of dump.roadmapItem) {
          if (r.parentId) {
            await tx.execute(sql`UPDATE roadmap_item SET parent_id = ${r.parentId} WHERE id = ${r.id}`);
          }
        }
      }

      if (dump.roadmapItemAssignee.length) await tx.insert(roadmapItemAssignee).values(dump.roadmapItemAssignee);
      if (dump.roadmapItemTheme.length) await tx.insert(roadmapItemTheme).values(dump.roadmapItemTheme);
      if (dump.roadmapSource.length) await tx.insert(roadmapSource).values(dump.roadmapSource);
      // bigserial ids — let the destination assign its own, don't carry the source's.
      if (dump.roadmapStatusLog.length) {
        await tx.insert(roadmapStatusLog).values(dump.roadmapStatusLog.map(({ id: _id, ...rest }) => rest));
      }
      if (dump.roadmapComment.length) await tx.insert(roadmapComment).values(dump.roadmapComment);
      if (dump.proposal.length) await tx.insert(proposal).values(dump.proposal);
      if (dump.importNote.length) await tx.insert(importNote).values(dump.importNote);
    });
  } catch (err) {
    console.error('[admin/restore] failed', err);
    return new Response(`Restore failed: ${(err as Error).message}`, { status: 500 });
  }

  const counts = Object.fromEntries(Object.entries(dump).map(([k, v]) => [k, (v as unknown[]).length]));
  return new Response(JSON.stringify({ ok: true, counts }), { headers: { 'content-type': 'application/json' } });
};
