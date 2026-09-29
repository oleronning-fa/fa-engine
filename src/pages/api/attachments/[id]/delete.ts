/** Removes one attachment — DB row first, then the file on disk. Plain POST: browsers can't send DELETE from a <form>. */
import type { APIRoute } from 'astro';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { UPLOAD_DIR } from '../../../../core/uploads';
import { deleteAttachment } from '../../../../modules/roadmap/write';

export const POST: APIRoute = async ({ params, request, redirect, locals }) => {
  const id = params.id;
  if (!id) return new Response('Missing id', { status: 400 });

  const form = await request.formData();
  const redirectTo = (form.get('redirectTo') as string) || '/epics';

  const deleted = await deleteAttachment(id, locals.user?.email ?? null);
  if (deleted) {
    await unlink(path.join(UPLOAD_DIR, deleted.storagePath)).catch((err) => {
      console.error('[attachments/delete] file missing on disk, DB row removed anyway', err);
    });
  }
  return redirect(redirectTo, 303);
};
