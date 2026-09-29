/** Upload a file/image onto an item — writes it to uploads/ and records it. */
import type { APIRoute } from 'astro';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { MAX_ATTACHMENT_BYTES, safeExt, UPLOAD_DIR } from '../../../../core/uploads';
import { addAttachment } from '../../../../modules/roadmap/write';

export const POST: APIRoute = async ({ params, request, redirect, locals }) => {
  const id = params.id;
  if (!id) return new Response('Missing id', { status: 400 });

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return redirect(`/epics/${id}`, 303);
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return new Response(`File too large — max ${MAX_ATTACHMENT_BYTES / (1024 * 1024)}MB.`, { status: 413 });
  }

  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    const storagePath = `${randomUUID()}${safeExt(file.name)}`;
    await writeFile(path.join(UPLOAD_DIR, storagePath), Buffer.from(await file.arrayBuffer()));

    await addAttachment({
      roadmapItemId: id,
      filename: file.name || 'file',
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      storagePath,
      actorEmail: locals.user?.email ?? null,
    });
    return redirect(`/epics/${id}`, 303);
  } catch (err) {
    console.error('[roadmap-items/attachments] upload failed', err);
    return new Response('Upload failed — please try again.', { status: 500 });
  }
};
