/**
 * Read-only admin diagnostic — same secret-header auth as restore.ts.
 * Exists to answer one question safely, without ever opening the database
 * to the internet: "what's actually in this database right now, and how
 * did it get there?" (roadmap_item rows + the recent audit trail).
 */
import type { APIRoute } from 'astro';
import { ADMIN_SYNC_SECRET } from 'astro:env/server';
import { desc } from 'drizzle-orm';
import { db } from '../../../core/db';
import { roadmapItem, event } from '../../../core/schema';

export const GET: APIRoute = async ({ request }) => {
  if (!ADMIN_SYNC_SECRET) {
    return new Response('Not configured', { status: 404 });
  }
  if (request.headers.get('x-admin-secret') !== ADMIN_SYNC_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const items = await db
    .select({
      id: roadmapItem.id,
      type: roadmapItem.type,
      title: roadmapItem.title,
      status: roadmapItem.status,
      jiraKey: roadmapItem.jiraKey,
      createdAt: roadmapItem.createdAt,
      createdBy: roadmapItem.createdBy,
      archivedAt: roadmapItem.archivedAt,
    })
    .from(roadmapItem)
    .orderBy(desc(roadmapItem.createdAt));

  const recentEvents = await db
    .select()
    .from(event)
    .orderBy(desc(event.at))
    .limit(30);

  return new Response(JSON.stringify({ items, recentEvents }, null, 2), {
    headers: { 'content-type': 'application/json' },
  });
};
