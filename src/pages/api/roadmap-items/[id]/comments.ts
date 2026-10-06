/** Adds a comment to an Epic or Idea — feltkatalog §2. */
import type { APIRoute } from 'astro';
import { addComment } from '../../../../modules/roadmap/write';

/** Same-site path only — default to the Epic page, which these forms were built for. */
function backTo(form: FormData, id: string): string {
  const to = form.get('redirectTo');
  return typeof to === 'string' && to.startsWith('/') && !to.startsWith('//') ? to : `/epics/${id}`;
}

export const POST: APIRoute = async ({ params, request, redirect }) => {
  const id = params.id;
  if (!id) return new Response('Missing id', { status: 400 });

  const form = await request.formData();
  const authorId = form.get('authorId') as string | null;
  const body = form.get('body') as string | null;
  if (!authorId || !body?.trim()) return new Response('Missing author or comment text', { status: 400 });

  try {
    await addComment(id, authorId, body);
    return redirect(backTo(form, id), 303);
  } catch (err) {
    console.error('[comments] failed', err);
    return new Response('Could not save the comment — please try again.', { status: 500 });
  }
};
