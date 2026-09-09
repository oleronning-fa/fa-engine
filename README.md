# fa-engine

A roadmap tool for product managers and product owners across Finansavisen and Profico, running as a JournalistBoost app.

The starter is **agent-first**: the canonical instructions live in [`AGENTS.md`](./AGENTS.md). The agent reads that file, follows the recipes in [`skills/`](./skills/), and customizes this template to whatever the journalist asks for.

## Stack

- **Astro 5** server-rendered (Node adapter, port 3000)
- **Tailwind 4** with the Finansavisen palette + Inter
- **Zephr-aware** — emits `<!-- ZEPHR_FEATURE … -->` markers; local simulation downloads the real components in dev
- **Docker** multi-stage build, deploys to the FA app platform (`*.apps.journalistboost.ai`)

## Start a new project from this template

```bash
git clone https://github.com/startsiden/vibecode-template.git my-app
cd my-app
```

Then open your editor with a coding assistant attached (Claude Code, Cursor, Codex, etc.) and say *"let's start"*. The assistant reads [`AGENTS.md`](./AGENTS.md), runs [`skills/tools-init.md`](./skills/tools-init.md) to verify Node + pnpm + git, and gets you running.

## Quick start (manual, for the developer who already knows the stack)

```bash
pnpm install
cp .env.example .env

pnpm dev
# → open http://localhost:3000
```

Then talk to the agent:

- *"Add an about page"*
- *"Show the Finansavisen header"*
- *"Save my work"*
- *"Publish it"*

## Skills

| When you say…                          | Skill                              |
|----------------------------------------|------------------------------------|
| "let's start"                          | [`skills/tools-init.md`](./skills/tools-init.md)         |
| "save"                                 | [`skills/save.md`](./skills/save.md)                     |
| "add a page"                           | [`skills/new-page.md`](./skills/new-page.md)             |
| "show the FA header"                   | [`skills/add-zephr-header.md`](./skills/add-zephr-header.md) |
| "change the colors"                    | [`skills/theme.md`](./skills/theme.md)                   |
| "make it react-ish"                    | [`skills/add-react.md`](./skills/add-react.md)           |
| "redo my old project Finansavisen-style" | [`skills/rewrite-existing.md`](./skills/rewrite-existing.md) |
| "publish"                              | [`skills/deploy.md`](./skills/deploy.md)                 |

## For developers

- Edit `src/styles/globals.css` to change brand tokens.
- Extend `src/lib/zephr.ts` to register new Zephr feature IDs.
- Adjust the `Dockerfile` if the deploy target changes.
- The middleware is dev-only (gated by `SIMULATE_ZEPHR`); in production Zephr handles injection at the edge.
