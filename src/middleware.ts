import { defineMiddleware, sequence } from 'astro:middleware';
import { authMode, getJbUser, isAuthDisabled, jbLoginUrl } from './lib/auth';
import { isZephrSimulationEnabled, simulateZephr } from './lib/zephr';
// Side-effect import — starts the background Jira sync interval exactly once
// per server process. See core/jira-scheduler.ts for why it lives here.
import './core/jira-scheduler';

/**
 * Login, for JB apps only.
 *
 * AUTH_MODE=jb (default): everyone reaching this app must be signed into
 * JournalistBoost, and this validates that.
 *
 * AUTH_MODE=zephr: this does nothing. FA apps on finansavisen.no are gated by
 * Zephr at the CDN edge before the request arrives, and their readers have no
 * JournalistBoost session — running the JB check would reject all of them.
 *
 * Don't replace either with your own login. See AGENTS.md, "Who's logged in".
 */
const requireLogin = defineMiddleware(async (context, next) => {
  if (authMode() === 'zephr') return next();
  if (isAuthDisabled()) return next();

  // Built assets and the favicon carry nothing private, and gating them would
  // mean a JB round-trip per file instead of per page.
  //
  // An explicit allowlist, not a `/_` prefix or a list of file extensions.
  // Both of those guess, and they guess in the dangerous direction: `/_` would
  // also expose a future `_health` route, and any extension list will miss one
  // eventually. Being too NARROW here costs a needless login check on some
  // asset — visible and harmless. Being too broad serves something private to
  // anyone who asks.
  //
  // `/_astro/` is pinned as `build.assets` in astro.config.mjs precisely so
  // this cannot drift if Astro changes its default. Add a path here only after
  // deciding it is safe to serve logged-out.
  const { pathname } = context.url;
  const isPublicAsset =
    pathname.startsWith('/_astro/') ||
    pathname === '/favicon.ico' ||
    pathname === '/favicon.svg';
  if (isPublicAsset) return next();

  const user = await getJbUser(context.request.headers.get('cookie'));

  if (!user) {
    // API routes get a status code; pages get sent to JB to log in.
    if (pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'Not logged in' }), {
        status: 401,
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
      });
    }
    return new Response(null, {
      status: 302,
      headers: { location: jbLoginUrl(context.url), 'cache-control': 'no-store' },
    });
  }

  // Pages can read this: `const user = Astro.locals.user`
  context.locals.user = user;

  const response = await next();
  // This response depended on who asked. A shared cache must never replay it.
  response.headers.set('cache-control', 'no-store');
  return response;
});

/**
 * Astro middleware that mirrors hegnar-web's ESI-simulation step for
 * local development. In production the Zephr CDN handles ZEPHR_FEATURE
 * comment markers at the edge, so this middleware is a no-op.
 */
const zephrSimulation = defineMiddleware(async (_context, next) => {
  const response = await next();

  if (!isZephrSimulationEnabled()) return response;

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/html')) return response;

  const html = await response.text();
  const transformed = await simulateZephr(html);

  return new Response(transformed, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
});

export const onRequest = sequence(requireLogin, zephrSimulation);
