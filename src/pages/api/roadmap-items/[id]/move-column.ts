/** Drag-and-drop between columns on the All items board — called by fetch(), so this reads a JSON body, same as reorder.ts. */
import type { APIRoute } from 'astro';
import { moveBoardColumn } from '../../../../modules/roadmap/write';

export const POST: APIRoute = async ({ params, request, locals }) => {
  const id = params.id;
  if (!id) return new Response('Missing id', { status: 400 });

  const body = await request.json().catch(() => null);
  const column = body && typeof body.column === 'string' ? body.column : null;
  if (!column) return new Response('Missing column', { status: 400 });

  try {
    await moveBoardColumn(id, column, locals.user?.email ?? null);
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('[roadmap-items/move-column] failed', err);
    return new Response((err as Error).message || 'Could not move.', { status: 500 });
  }
};
