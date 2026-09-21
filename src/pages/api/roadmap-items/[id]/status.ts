/** One-click status change from a card — no modal, no full edit form. */
import type { APIRoute } from 'astro';
import { setItemStatus } from '../../../../modules/roadmap/write';

export const POST: APIRoute = async ({ params, request, redirect, locals }) => {
  const id = params.id;
  if (!id) return new Response('Missing id', { status: 400 });

  const form = await request.formData();
  const status = form.get('status');
  const redirectTo = (form.get('redirectTo') as string) || '/epics';
  if (typeof status !== 'string' || !status) return new Response('Missing status', { status: 400 });

  try {
    await setItemStatus(id, status, locals.user?.email ?? null);
    return redirect(redirectTo, 303);
  } catch (err) {
    console.error('[roadmap-items/status] failed', err);
    return new Response('Could not update status.', { status: 500 });
  }
};
