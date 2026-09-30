/**
 * One-time bulk cleanup — archives every current Idea bank item (OC, 30
 * Sep: "not relevant"). Same secret-header auth as restore.ts/status.ts,
 * same soft delete as the single-item "Remove" button: nothing is dropped,
 * nothing cascades, every row keeps its own event and can be brought back
 * by clearing archived_at directly. Safe to call more than once — archiving
 * an already-archived item is a no-op re-set of the same timestamp, and a
 * second run simply finds nothing left to archive.
 */
import type { APIRoute } from 'astro';
import { ADMIN_SYNC_SECRET } from 'astro:env/server';
import { archiveAllIdeaBankItems } from '../../../modules/roadmap/write';

export const POST: APIRoute = async ({ request }) => {
  if (!ADMIN_SYNC_SECRET) {
    return new Response('Not configured', { status: 404 });
  }
  if (request.headers.get('x-admin-secret') !== ADMIN_SYNC_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  // No specific person triggered this — recorded as a system action, same as the scheduled Jira sync.
  const archived = await archiveAllIdeaBankItems(null);
  return new Response(JSON.stringify({ ok: true, count: archived.length, archived }, null, 2), {
    headers: { 'content-type': 'application/json' },
  });
};
