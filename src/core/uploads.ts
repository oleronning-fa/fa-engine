/**
 * Where uploaded attachments live on disk — outside `src/` and `public/`
 * since these are runtime user files, not build assets. Local dev only for
 * now: a plain container filesystem is ephemeral, so this needs a mounted
 * volume before it can survive a production redeploy (not set up yet).
 */
import path from 'node:path';

export const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

/** Lowercased extension including the dot, or '' if the filename has none — keeps the on-disk name recognizable without trusting the original filename itself. */
export function safeExt(filename: string): string {
  const m = /\.([a-zA-Z0-9]{1,8})$/.exec(filename);
  return m ? `.${m[1].toLowerCase()}` : '';
}
