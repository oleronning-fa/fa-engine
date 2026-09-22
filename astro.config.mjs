// @ts-check
// Loads .env into process.env for this Node process. Astro's own astro:env
// system only populates a given var lazily, the first time something imports
// it from 'astro:env/server' — and DATABASE_URL is deliberately read directly
// via process.env in src/core/db.ts instead (so the same module also works
// from plain Node scripts, which astro:env/server can't). Without this,
// DATABASE_URL never reaches process.env under `astro dev` / `astro build`.
import 'dotenv/config';
import { defineConfig, envField } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

// Server-rendered Astro. The standalone Node adapter runs as a plain
// container on the FA app platform.
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),

  /**
   * Every variable this template reads, declared once.
   *
   * All of them are `context: 'server', access: 'secret'`, which is what makes
   * them RUNTIME values: `astro:env/server` reads them from `process.env` when
   * the container starts. The alternative — `import.meta.env` — is substituted
   * by Vite at BUILD time, so a developer's `AUTH_DISABLED` would be compiled
   * into the production image with no way to switch it back on. That is not
   * hypothetical: it had already happened here, and the flag was dead-code
   * eliminated out of the bundle.
   *
   * Declaring defaults here rather than in the code that reads them means there
   * is exactly one place to look, and a wrong value fails loudly with the
   * variable's name instead of silently taking a fallback branch.
   *
   * Adding a variable to your app? Add it here first, then import it from
   * `astro:env/server`. Client-visible values are the exception: those want
   * `context: 'client', access: 'public'` and a `PUBLIC_` name.
   */
  env: {
    // Validate secrets during `astro build`, not just on first read. The
    // platform builds the image on deploy, so a bad AUTH_MODE fails the deploy
    // with the variable named, instead of shipping and 500-ing on whichever
    // page touches it first.
    //
    // Measured, so nobody re-derives it: this does NOT validate when the
    // production container starts — Astro only checks secrets on build and dev
    // server start. At runtime a bad value is still a 500 on first read, never
    // a silent fallback.
    validateSecrets: true,
    schema: {
      // --- Login -------------------------------------------------------
      AUTH_MODE: envField.enum({
        context: 'server',
        access: 'secret',
        values: ['jb', 'zephr'],
        default: 'jb',
      }),
      JB_URL: envField.string({
        context: 'server',
        access: 'secret',
        default: 'https://www.journalistboost.ai',
      }),
      // Only 'true'/'false' parse. 'AUTH_DISABLED=1' is a hard error, not a
      // silent false — the loud direction is the safe one for a login switch.
      AUTH_DISABLED: envField.boolean({
        context: 'server',
        access: 'secret',
        default: false,
      }),
      // 1 hour, in milliseconds.
      AUTH_CACHE_TTL_MS: envField.number({
        context: 'server',
        access: 'secret',
        default: 3_600_000,
      }),

      // --- Local Zephr simulation --------------------------------------
      SIMULATE_ZEPHR: envField.boolean({
        context: 'server',
        access: 'secret',
        default: false,
      }),
      ZEPHR_COMPONENTS_URL: envField.string({
        context: 'server',
        access: 'secret',
        default: 'https://prod-zephr-components.finansavisen.no',
      }),

      // --- Database (Fa Engine) --------------------------------------
      // Postgres 16+ with pgvector. Local: in .env. Production: injected by
      // the platform in Coolify. `optional` so `astro build` runs without a
      // DB reachable; `src/core/db.ts` throws loudly at runtime if it's unset.
      DATABASE_URL: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),

      // --- Jira (Fa Engine) — one-way read sync, src/core/jira.ts ------
      // Both optional: the background sync (src/core/jira-scheduler.ts) and
      // the manual "attach Jira key" endpoint both no-op quietly without
      // these, rather than failing the whole app.
      JIRA_EMAIL: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      JIRA_API_TOKEN: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      // 10 minutes, in milliseconds.
      JIRA_SYNC_INTERVAL_MS: envField.number({
        context: 'server',
        access: 'secret',
        default: 600_000,
      }),

      // --- One-time admin data sync — src/pages/api/admin/restore.ts ---
      // Guards the restore endpoint. Unset in Coolify once the one sync it
      // was for is done; the endpoint also refuses to run a second time
      // against a database that already has data, so this isn't the only
      // guard, just the first one.
      ADMIN_SYNC_SECRET: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
    },
  },

  build: {
    // Pinned, not defaulted. `src/middleware.ts` lets this prefix through
    // without a login check, so the two must agree — if Astro ever changed its
    // default, unauthenticated asset serving would break silently.
    assets: '_astro',
  },

  security: {
    // TLS terminates at the platform's proxy, so this process is reached over
    // plain http with the real hostname in a forwarded header. Without these
    // entries Astro distrusts that header and `Astro.url` falls back to
    // localhost — which would send the login redirect's return address to
    // localhost instead of the app. Add a domain here before serving from it.
    allowedDomains: [
      { hostname: '**.journalistboost.ai', protocol: 'https' },
      { hostname: '**.finansavisen.no', protocol: 'https' },
    ],
  },
  server: { host: true, port: 3000 },
  vite: {
    plugins: [tailwindcss()],
  },
});
