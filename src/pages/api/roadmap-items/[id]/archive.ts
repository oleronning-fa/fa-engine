/** "Remove" on an Epic card — soft delete, hides from /epics. Nothing is actually lost. */
import type { APIRoute } from 'astro';
import { archiveRoadmapItem } from '../../../../modules/roadmap/write';

export const POST: APIRoute = async ({ params, request, redirect, locals }) => {
  const id = params.id;
  if (!id) return new Response('Missing id', { status: 400 });

  const form = await request.formData();
  const redirectTo = (form.get('redirectTo') as string) || '/epics';

  try {
    await archiveRoadmapItem(id, locals.user?.email ?? null);
    return redirect(redirectTo, 303);
  } catch (err) {
    console.error('[roadmap-items/archive] failed', err);
    return new Response('Could not remove — please try again.', { status: 500 });
  }
};
