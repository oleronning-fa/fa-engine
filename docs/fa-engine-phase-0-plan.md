# Fa Engine — Phase 0 build plan

*Written in Claude Code, 10 September 2026. Maps the spec package in this folder
onto concrete work in this repo. Living document — update as steps land.*

This is the plan for **v1.0** (the roadmap tool), starting from the fresh
`vibecode-template` clone. Order follows every spec doc's first instruction:
**the domain model comes first** (`fa-engine-plan.md` §1, `-versjonsplan.md` §3,
`-signalkoblingen.md` §10).

---

## Divergences from the fa-vibe defaults — decided, with reasons

The `fa-vibe` platform skills assume small apps. Fa Engine is the case they
carve out. Two deliberate departures:

| fa-vibe default | Fa Engine | Why |
|---|---|---|
| `add-database`: plain `pg`, `CREATE TABLE IF NOT EXISTS`, **no ORM** | **Drizzle + drizzle-kit**, migrations committed to `drizzle/` | The skill's own exception: "unless the journalist has a schema too complex for plain SQL". 18 tables, a field-catalog contract, generated types, contract tests. `fa-engine-status.md` confirms this was built and verified once already. |
| `add-database`: "no queue" | **pg-boss** | It's a queue *inside Postgres* — no Redis, no new infra to ask Profico for. `fa-engine-status.md` already decided this: "pg-boss kjører i samme Node-prosess". |

Everything else in `add-database` still holds: the platform provisions the DB,
`DATABASE_URL` is injected in Coolify, no real value is ever committed,
placeholder-only in `.env.example`.

---

## Status — what's done

- [x] Spec package moved to `docs/`, filenames kept (they cross-reference).
- [x] Local Postgres 17 + pgvector 0.8.6 (Homebrew service), `fa_engine_dev`.
- [x] Deps: `drizzle-orm`, `postgres`, `pg-boss`, `drizzle-kit`, `dotenv`, `tsx`.
- [x] `src/core/` — the domain model:
  - `codesets/` — the 18 areas, 10 objection codes, roadmap status sets (6 + Epic's 3), priority, size, types, signal sources, user roles. All "faste kodesett, endres i kode".
  - `schema/` — 18 Drizzle tables: `app_user`, `person`, `account`, `subscription`, `signal`, `theme`, `roadmap_item` (+ `_assignee`, `_theme`, `roadmap_source`, `roadmap_status_log`, `roadmap_comment`), `proposal`, `event`, `llm_call`, `area_routing`, `person_alias`, `import_note`.
  - `db.ts` — one postgres.js connection, throws loudly if `DATABASE_URL` is unset.
- [x] `drizzle/0000_*.sql` generated and applied. `pnpm db:health` green.
- [x] Scripts: `db:generate`, `db:migrate`, `db:studio`, `db:health`.

## Next — in order

1. **Seed `app_user` + `person_alias`** — the ~20-line hand-written alias table
   mapping the sheet's 22 spellings of OC/Magnus/Marina/Zagreb onto real users
   (`roadmap-krav` §5 step 5). Blocks the importer.
2. **Domain services in `src/core/`** — `recordSignal()` (the signal contract,
   `signalkoblingen` §3), `logEvent()` (append-only, every mutation), roadmap
   status-transition rules (which statuses are legal per type; auto-set
   `completedAt`; require `declinedReason`).
3. **Contract tests on `core`** (Vitest) — a contributing agent must not be able
   to break the customer graph silently (`plan` §8.4).
4. **The importer** (`src/modules/roadmap/import/`) — the 10-step spec in
   `roadmap-krav` §5. Needs the two `.xlsx` files (see Blocked) and a Jira token
   for enrichment. Everything it can't parse → `import_note` review queue.
5. **Roadmap read model + views** — one list (filter/group/inline-edit/bulk/
   keyboard/shareable URL), the Epic page, Idea bank → Backlog → board, "For
   deg", Logg (`roadmap-feltkatalog` §1–§7). React islands per `add-react`.
6. **Jira one-way read sync** — `src/core/jira.ts`: given a key, pull status,
   resolution date, assignee. Never write back. Mirrors `CR`/`FT`/`On QA` as
   `jiraSubstatus`.
7. **Auth** — Auth.js + Google Workspace OIDC, role in `app_user`. Replaces the
   template's JB middleware. Blocked on OIDC credentials.
8. **Idea bank** — `status = 'Idea'` + a view + the `fa-concept` skill. Mostly
   falls out of steps 2 and 5 (`idebank` §7).

Stop points for review: after step 3 (the model is real and tested), after
step 4 (real data is in), after step 5 (something to click).

---

## Blocked — needs someone else

| Blocker | Needed for | Owner |
|---|---|---|
| The two `.xlsx` files (`Fa Teams — Big Headlines — Allocation Plan.xlsx`, `WiP - Fa Roadmap 2026.xlsx`) | The importer (step 4) | OC |
| Jira API token, read access to FCK/FIB/FADT/FAPPS/JB | Import enrichment + sync (steps 4, 6) | Profico / Atlassian admin |
| Google Workspace OIDC client (id + secret + redirect) | Real auth (step 7) | Hegnar Google Workspace admin |
| **One owner + one Slack channel per of the 18 areas** | `area_routing` seed; routing in every view | Hegnar (`versjonsplan` §9) |
| The WiP-sheet colour legend (7 fill colours, no key) | Import of the strategic sheet | Whoever coloured it |
| **Does the platform's shared Postgres have `pgvector`?** | `signal.embedding` / `theme.embedding` columns; everything from v1.2 | Platform owner (`coolify` skill) |
| Slack app with `chat:write` | Slack notifications (step 5 "bør ha") | Hegnar workspace admin |

`pgvector` note: the columns are in migration `0000` behind
`CREATE EXTENSION IF NOT EXISTS vector`. v1.0 does not read them. If the
platform's Postgres can't provide the extension, drop those two columns to a
later migration — nothing in v1.0 breaks.

---

## Hosting — unresolved

This session bootstrapped a **JournalistBoost app** (Coolify self-serve,
`AUTH_MODE=jb`, no DB). Fa Engine needs its own Postgres+pgvector, Google OIDC
instead of the JB session, and eventually a worker process. `plan` §5 says
"extend vibecode-template" and §5's "two containers" was later narrowed to one
in `status.md` ("Ingen DevOps-forespørsel til Profico i fase 0"), so one
container is fine for now — but **where this deploys, and how auth works there,
is a conversation with the platform team before first deploy.** It does not
block any of steps 1–6.

---

## Module layout (`plan` §8)

```
src/
  core/                 # the customer graph + vocabulary. Imports nothing above it.
    codesets/           # the 18 areas, 10 objections, statuses, …
    schema/             # drizzle tables — the field-catalog contract in code
    db.ts
  modules/
    roadmap/            # v1.0
    feedback/           # v1.1
    crm/                # v2.0
    chat/               # v1.1
```

Modules talk to each other only through `core`. One person owns `core`.
