# AGENTS.md — Finansavisen Vibe-Coding Starter

You are the coding agent for a **Finansavisen journalist** building a small web app. The journalist is **not a developer**: they speak product, not code. Treat every interaction with that in mind.

This file is the contract. Read it fully before doing anything. The companion `skills/` folder contains step-by-step recipes — load the matching skill before any non-trivial action.

---

## THIS REPO IS FA ENGINE — read `docs/` first

This is no longer a blank starter. It's **Fa Engine** (Hegnar Media / Finansavisen):
a roadmap tool for the product team (v1.0), growing into a feedback hub, a
week-agent and a telemarketing CRM. Built hands-on by OC and Magnus with AI
assistance — not a "journalist who can't read code" situation.

**Before any work:** read `docs/README.md`, then `docs/fa-engine-phase-0-plan.md`
(what's built, what's next, what's blocked), then the spec docs it points to.
The domain model comes first and lives in `src/core/` — see `src/core/AGENTS.md`.

**Where the template's defaults change for this project:**

| Template default | Fa Engine |
|---|---|
| "small app, near-zero client JS" | data-heavy internal tool; React islands for the boards/tables/keyboard nav (`skills/add-react`) |
| `fa-vibe:add-database` — plain `pg`, no ORM | **Drizzle + migrations** in `drizzle/` (schema too complex for raw SQL — the skill's own exception). See the plan doc's "Divergences" section. |
| no queue | **pg-boss** (a queue inside Postgres — no new infra) |
| JB session middleware (`AUTH_MODE=jb`) | will become **Auth.js + Google Workspace OIDC**; role in `app_user`. Not done yet. |
| internal copy in English is unusual | internal surfaces **are** English; reader-facing stays bokmål (`roadmap-krav` §10) |

Everything below still applies where it doesn't conflict with the above:
Zephr rules for any reader-facing surface, FA tokens never hardcoded, quality
gates (`pnpm build`, `pnpm check`), reversibility, deployable with no infra
hand-editing.

---

## Mission

Produce small, well-branded web apps for `finansavisen.no` that:

1. Use the **Finansavisen visual identity** (palette, type, header chrome) out of the box.
2. Optionally render the **real Finansavisen header** when deployed behind the Zephr CDN, and a faithful local simulation in dev.
3. Build to a **single Docker image** the FA app platform deploys automatically on every save.
4. Stay **boring**: Astro pages, server-rendered HTML, near-zero client JS. Add interactivity only where the journalist explicitly asks for it.

You are NOT building a SPA. You are NOT shipping a React app. Reach for islands only when the requested interaction genuinely needs them.

---

## Before you start

This project is created and bootstrapped by the **fa-vibe plugin**:

```
/plugin marketplace add startsiden/hegnar-fa-vibe-plugin
/plugin install fa-vibe@fa-vibe
/fa-vibe:new-project
```

If you're reading this inside an already-cloned project, bootstrap is done —
run `skills/tools-init.md` and get on with the work.

The plugin owns everything that is true for **any** Finansavisen app: starting a
project, the save/publish vocabulary, login, databases, and going live. This
file owns everything specific to **this stack** — Astro, the FA visual identity,
the Zephr header, and the file layout below.

## Stack — Locked

| Layer        | Choice                                         | Why                                                  |
|--------------|------------------------------------------------|------------------------------------------------------|
| Framework    | **Astro 7**, `output: 'server'`                | Eliminates the React/Zephr hydration conflict        |
| Adapter      | **`@astrojs/node`** (standalone)               | Runs as a plain container on the app platform        |
| Styling      | **Tailwind 4** via `@tailwindcss/vite`         | CSS-config, no JS config drift                       |
| Type         | TypeScript everywhere (`.astro` + `.ts`)       | Catches mistakes the journalist can't                |
| Font         | `@fontsource-variable/inter`                   | FA brand font, self-hosted                           |
| Runtime      | Node 22 LTS                                    | Same as hegnar-bellsheep-web                         |
| Package mgr  | **pnpm** (corepack)                            | Same as the FA family                                |
| Database     | **Postgres** (shared server, one DB per app)   | Survives redeploys. Never SQLite — see `skills/add-database.md` |
| Login        | **Handled by the platform, not by the app**    | The app never implements auth — see "Who's logged in" |

**Do not swap any of these.** If the journalist asks for "Next.js" or "React", explain in their words: *"You don't need a heavier framework — Astro keeps the site fast and works correctly with the Finansavisen paywall system. Adding React on top would slow it down and break the header."* Then continue with Astro.

---

## Project Modes

This template supports three workflows. Pick the right one from what the journalist says:

### A. Fresh project ("I want to build…")
Clone this starter, customize `package.json` name, run `skills/tools-init.md`, then build the requested pages.

### B. Rewrite an existing project ("I already have a project, make it Finansavisen-style")
Run `skills/rewrite-existing.md`. Read their code first, port it page-by-page into the Astro structure, preserve content verbatim, replace styling with the FA tokens.

### C. Continue work ("I want to add…")
Read existing pages first, then add. Never rename existing files unless the journalist asks.

---

## Finansavisen Visual Identity

The palette and type are pre-wired in `src/styles/globals.css` as Tailwind 4 `@theme` tokens. Use the utilities directly — never hardcode hex values, never inline color in components.

| Token              | Use for                                       |
|--------------------|-----------------------------------------------|
| `bg-blue-500` `#0373E3` | Primary brand accent, CTA buttons       |
| `bg-blue-800` `#012E5B` | Strong headers, dark surfaces            |
| `text-gray-900` `#151719` | Default body text                     |
| `text-gray-500` `#67737E` | Secondary text                        |
| `bg-gray-50` `#F1F2F3` | Neutral surface                          |
| `bg-red-500` `#CA2B3D` | Errors, negative price moves             |
| `bg-green-500` `#19BE76` | Success, positive price moves          |
| `bg-orange-500` `#F77222` | Highlights, callouts                  |
| `bg-yellow-500` `#FCC727` | Warnings, badges                      |
| `font-sans` (Inter)  | Everything                                  |

Breakpoint `header:` = 1130px (matches hegnar-web's main-header switch).

For full customization see `skills/theme.md`.

---

## Environment variables

Declare it, then import it. Never reach for `process.env` or `import.meta.env`.

1. Add the variable to `env.schema` in `astro.config.mjs`, with its default.
2. Import it: `import { MY_VAR } from 'astro:env/server'`.

`import.meta.env.X` is replaced by Vite at **build** time, so a value from the
machine that built the image is what ships — a local `AUTH_DISABLED` would be
compiled in with no way to switch it back off. Server values must be read at
runtime, which is what `astro:env/server` does.

Values the browser needs are the exception: name them `PUBLIC_…` and declare
them with `context: 'client', access: 'public'`.

`.env.example` holds only what you may want to change locally. Defaults live in
the schema, so there is one place to look.

## The Finansavisen Header (Zephr)

The FA header / footer are served at the edge by **Zephr**. They appear in HTML as comment markers:

```html
<!-- ZEPHR_FEATURE finansavisen-header -->
<!-- ZEPHR_FEATURE_END finansavisen-header -->
```

In production, the Zephr CDN intercepts every page response, replaces these comment pairs with the real header HTML, and injects auth state. **Your job is to emit the markers correctly and stay out of Zephr's way.**

### The dev problem

In production the markers turn into a real header. Locally, with no CDN in front, they stay as comments — so the journalist sees a blank page where the header should be.

### The solution — local Zephr simulation

`src/middleware.ts` runs on every dev response. When `SIMULATE_ZEPHR=true` (default in `.env.example`), it:

1. Scans the HTML for `<!-- ZEPHR_FEATURE <id> --><!-- ZEPHR_FEATURE_END <id> -->` pairs.
2. Looks up `<id>` in a feature → component map.
3. Fetches the **real** component HTML from `https://prod-zephr-components.finansavisen.no/<component>.html` (cached in memory).
4. Rewrites relative `/static/` asset paths to absolute prod URLs.
5. Strips `<head>` / `<meta>` (those don't belong in body context).
6. Substitutes a default template variable set (Norwegian, `Jane Doe`, `registered` access level).
7. Splices the result between the comment pair.

In production, the middleware is a **no-op** — Zephr handles the real injection at the edge.

This pattern is ported directly from `hegnar-web`'s `src/server/middleware/hNunjucks.ts` (`simulateEsi` filter) and `src/server/config/ZephrComponents/ZephrComponentsConfiguration.ts`. If you need to add more Zephr features (footer, paywall, regwall), extend the `FEATURE_TO_COMPONENT` map in `src/lib/zephr.ts`.

### The header decision tree

When the journalist starts a new project, **ask first**:

> "Do you want the regular Finansavisen header and footer on this app? It shows the FA logo, login button, and main navigation. You'll see it in production. Locally it'll show a slightly stale snapshot but it'll be there."

- **Yes** → in `src/layouts/Base.astro` set `showFaChrome={true}` as the default, or pass it explicitly from `src/pages/index.astro`.
- **No** → leave `showFaChrome={false}`, ship the bare Astro page.

Full recipe: `skills/add-zephr-header.md`.

---

## File Layout

```
src/
├── middleware.ts              # Zephr local simulation (dev only)
├── lib/zephr.ts               # fetch + cache + template-var substitution
├── components/
│   ├── ZephrFeature.astro     # emits comment pair; use this, not raw comments
│   ├── FinansavisenHeader.astro
│   └── FinansavisenFooter.astro
├── layouts/
│   └── Base.astro             # showFaChrome prop wraps the page
├── pages/
│   └── index.astro            # starter page, edit freely
└── styles/
    └── globals.css            # Tailwind 4 + FA palette + Inter
```

Add new pages in `src/pages/`. Astro's file-based routing gives you the URL for free: `src/pages/about.astro` → `/about`.

Add shared building blocks in `src/components/`. Keep them `.astro` unless interactivity is required.

---

## Interactivity Rules

Default: **zero client JavaScript** for content pages. If the journalist's app is genuinely interactive — dashboards, filterable lists, charts, forms, real-time data — **React islands (CSR included) are fine**. Add them on demand via `skills/add-react.md`, not preemptively.

Three island shapes, pick by need:

```astro
---
import Counter from '../components/Counter.tsx';
import Dashboard from '../components/Dashboard.tsx';
---
<!-- Hydrate when visible (most common) -->
<Counter client:visible />

<!-- Full CSR — skip SSR, render only on the client. Use when the
     component depends on browser APIs (window, localStorage, etc.) -->
<Dashboard client:only="react" />

<!-- Hydrate immediately on page load — only for above-the-fold widgets
     the user interacts with within the first second -->
<NavSearch client:load />
```

**Hard rule that doesn't bend**: a React island must **never wrap a Zephr feature tag**. The CDN must own that HTML; React would overwrite it on hydration. If a journalist asks for "a React app with the FA header inside", keep the `<FinansavisenHeader />` in the Astro layout *outside* the island.

For pages that are mostly interactive React, keep them as one Astro page with a single `client:only="react"` island as the body, and put the FA header + footer in the surrounding layout.

---

## GitHub — "Save" Vocabulary

Journalists don't speak git: "save" means commit + push, "publish" means go
live. Full table in the plugin's `working-with-journalists` skill; the recipe is
`skills/save.md`.

## Deploy

Container on port 3000, built from the Dockerfile. Where it goes depends on
whether this is a JB app or an FA app — the plugin's `publish` skill routes it.
Do not propose Vercel, Netlify, Cloudflare Pages or a personal server.

## Who's logged in — depends on where the app lives

Two different models. Pick with `AUTH_MODE`, and pick correctly: the wrong one
locks out exactly the audience the app is for.

| | JB app | FA app |
|---|---|---|
| `AUTH_MODE` | `jb` *(default)* | `zephr` |
| Lives at | `<name>.apps.journalistboost.ai` | `finansavisen.no/<path>` |
| Who gets in | Journalists signed into JournalistBoost | Readers, per the paywall |
| Enforced by | This app, via `src/middleware.ts` | Zephr, at the CDN edge, before the request arrives |
| App-level login code | Already written — don't touch it | **None.** The app does no login work |

**AUTH_MODE=jb.** `src/middleware.ts` validates JB's shared session and
redirects anyone without one. It's already there. Don't reimplement it.

**AUTH_MODE=zephr.** The middleware stands down entirely. Readers have no
JournalistBoost session, so running the JB check would reject every one of
them. Gating happens at the edge; use `skills/add-zephr-header.md` for the
Finansavisen chrome.

In both cases: **never build a login page, user table, session or password
field, and never add an auth library.** The platform handles it, in whichever
of the two ways applies.

To find out *who* the visitor is — JB apps only — see the plugin's
`working-with-journalists` skill. Short version: ask JB
`/api/auth/check-session` server-side, forwarding the request's cookie. Never
expose that cookie to browser JavaScript. `Astro.locals.user` is populated for
you, and is `undefined` under `AUTH_MODE=zephr`, so guard before using it.

## Quality Gates Before You Claim "Done"

1. `pnpm dev` boots without errors.
2. The page renders in the journalist's browser (you ask them to confirm).
3. If they enabled the FA header, it appears with `SIMULATE_ZEPHR=true` in dev.
4. `pnpm build` succeeds.
5. `pnpm check` passes. (That is `tsc`. Do **not** run `astro check` — this
   template is on TypeScript 7, which has no JS API, so `@astrojs/check` cannot
   run and the command stops on an install prompt.)
6. No hardcoded color hex values outside `src/styles/globals.css`.
7. No hardcoded API URLs. Every environment variable is declared in the `env.schema`
   in `astro.config.mjs` and imported from `astro:env/server` — never read
   `import.meta.env` for a server value, because Vite substitutes those at BUILD
   time and the value gets frozen into the image.

If any of these fail, fix before reporting success.

---

## Hard Don'ts

- ❌ Don't preemptively add React. Wait until the journalist asks for interactivity that needs it, then run `skills/add-react.md`.
- ❌ Don't add a state management library, GraphQL, tRPC, or a database client unless explicitly requested.
- ❌ Don't propose a CMS (Sanity, Contentful, etc.) — start with Astro content collections (markdown files in `src/content/`) and graduate only if the journalist outgrows it.
- ❌ Don't hardcode the journalist's personal data, project name, or repo URL into any source file.
- ❌ Don't strip the Zephr middleware. Even if the journalist says "I don't need the header", the middleware is a no-op without `SIMULATE_ZEPHR=true` and costs nothing.
- ❌ Don't `pnpm add` packages with hand-picked versions. Always let pnpm resolve latest stable.
- ❌ Don't use git commands directly in conversation — go through `skills/save.md` so the journalist's vocabulary holds.
- ❌ Don't write to `/Users/`, `/home/`, or absolute system paths in scripts. Use project-relative paths.

---

## Skills Index

Always load the matching skill before acting.

**This template's skills** (`skills/`) — everything specific to this stack:

| When the journalist says…                 | Load skill                       |
|-------------------------------------------|----------------------------------|
| "let's start" / first interaction         | `skills/tools-init.md`           |
| "save" / "commit" / "push"                | `skills/save.md`                 |
| "add a page" / "new page" / "section"     | `skills/new-page.md`             |
| "add the FA header" / "show the logo"     | `skills/add-zephr-header.md`     |
| "change the colors" / "make it darker"    | `skills/theme.md`                |
| "I want a dashboard" / "make it react-ish"| `skills/add-react.md`            |
| "I have a project, redo it Finansavisen-style" | `skills/rewrite-existing.md` |

**Plugin skills** (`fa-vibe`) — everything true for any Finansavisen app:

| When the journalist says…                 | Skill                            |
|-------------------------------------------|----------------------------------|
| "save this" / "remember" / "keep a list"  | `fa-vibe:add-database`           |
| "publish" / "deploy" / "go live"          | `fa-vibe:publish`                |
| anything about how we work here           | `fa-vibe:working-with-journalists` |

If the plugin isn't installed, install it — see "Before you start". Don't
reimplement its skills here.


## Reference Tabletop

If the journalist's request is ambiguous, prefer this priority order:

1. Render correctly behind Zephr (no client-side hydration overwriting CDN content).
2. Match FA brand (palette + type).
3. Keep page weight tiny (zero JS by default).
4. Be reversible (every change should survive `git reset --hard HEAD~1`).
5. Be deployable to the FA app platform with no hand-editing of infrastructure.

Conflicts resolve top-down. Never trade #1 for any other goal.
