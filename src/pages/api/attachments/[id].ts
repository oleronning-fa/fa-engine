/** Streams one attachment back — never a raw static path, so the DB row (and the login gate on every /api/ route) stays the only way in. */
import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { eq } from 'drizzle-orm';
import { UPLOAD_DIR } from '../../../core/uploads';
import { db } from '../../../core/db';
import { roadmapAttachment } from '../../../core/schema';

export const GET: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) return new Response('Missing id', { status: 400 });

  const [row] = await db.select().from(roadmapAttachment).where(eq(roadmapAttachment.id, id)).limit(1);
  if (!row) return new Response('Not found', { status: 404 });

  try {
    const buffer = await readFile(path.join(UPLOAD_DIR, row.storagePath));
    const safeName = row.filename.replace(/[\r\n"]/g, '');
    return new Response(buffer, {
      headers: {
        'content-type': row.mimeType,
        'content-disposition': `inline; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(row.filename)}`,
        'cache-control': 'private, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    console.error('[attachments] read failed', err);
    return new Response('File missing on disk', { status: 404 });
  }
};
