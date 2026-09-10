# src/core — the customer graph

This is the one part of Fa Engine that must be right from day one (`docs/fa-engine-plan.md` §1).
Everything else can be rebuilt.

## Rules

- **`core` imports from nothing above it.** Not from `src/modules/*`, not from
  `src/pages/*`. Modules depend on `core`; `core` depends on nobody. A module
  that needs something from another module gets it through a `core` function.
- **The schema is the contract.** `src/core/schema/*` is kept in step with the
  field catalogs (`docs/fa-engine-roadmap-feltkatalog.md`, `-crm-feltkatalog.md`).
  Change one, change the other in the same commit.
- **Fixed code sets, in code.** The 18 areas, 10 objection codes, statuses,
  priorities, sizes — `src/core/codesets/*`. No custom fields, no user-editable
  enums, no free text where a code belongs (`roadmap-krav` §3.3).
- **The area taxonomy is `docs/fa-engine-signalkoblingen.md` §5** — the 18-value
  list. The lists in `fa-engine-plan.md` §2 and `-roadmap-krav.md` §7 are
  superseded. Do not reintroduce them.
- **Every mutation writes an `event`.** Append-only, includes agent actions
  (`plan` §2, §3). Never `UPDATE` or `DELETE` an `event` row.
- **`rawText` on a signal is never rewritten.** The author's wording is the
  evidence (`signalkoblingen` §3).
- **`jira_key` is not unique.** Several roadmap items may point at one issue.

## Migrations

`pnpm db:generate` after a schema edit → review the SQL in `drizzle/` →
`pnpm db:migrate`. Migrations are committed. Never hand-edit a migration that
has been applied anywhere but your own machine.

## Database

`src/core/db.ts` reads `process.env.DATABASE_URL` (works in Astro and in
scripts). Local: Postgres 17 + pgvector via Homebrew, `.env`. Production: the
platform injects it. Never commit a real value.
