/** Drag-and-drop reorder on the Epics list — called by fetch(), not a <form>, so this reads a JSON body. */
import type { APIRoute } from 'astro';
import { setSortOrder } from '../../../../modules/roadmap/write';

export const POST: APIRoute = async ({ params, request }) => {
  const id = params.id;
  if (!id) return new Response('Missing id', { status: 400 });

  const body = await request.json().catch(() => null);
  const sortOrder = body && typeof body.sortOrder === 'number' ? body.sortOrder : null;
  if (sortOrder === null || !Number.isFinite(sortOrder)) {
    return new Response('Missing or invalid sortOrder', { status: 400 });
  }

  try {
    await setSortOrder(id, sortOrder);
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('[roadmap-items/reorder] failed', err);
    return new Response('Could not reorder.', { status: 500 });
  }
};
