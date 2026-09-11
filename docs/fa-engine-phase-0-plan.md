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
- [x] **The importer** (`src/modules/roadmap/import/`), run against the real
  `Fa Teams — Big Headlines — Allocation Plan.xlsx` (OC's `OC_kopi_av_Roadmap.xlsx`),
  11 September 2026. `312 roadmap_item` rows written to the local dev DB, `20`
  people, `152 import_note` rows for review. Source file kept in
  `import-source/` — **gitignored, never committed** (this repo is public; see
  "Public repo" below). Detail in "Import results", below.

## Next — in order

1. **Resolve the `import_note` review queue** (152 rows) — mostly area
   confirmation, a few name/date/status calls only a human can make. See
   "Import results".
2. **Domain services in `src/core/`** — `recordSignal()` (the signal contract,
   `signalkoblingen` §3), `logEvent()` (append-only, every mutation), roadmap
   status-transition rules (which statuses are legal per type; auto-set
   `completedAt`; require `declinedReason`).
3. **Contract tests on `core`** (Vitest) — a contributing agent must not be able
   to break the customer graph silently (`plan` §8.4).
4. **Roadmap read model + views** — one list (filter/group/inline-edit/bulk/
   keyboard/shareable URL), the Epic page, Idea bank → Backlog → board, "For
   deg", Logg (`roadmap-feltkatalog` §1–§7). React islands per `add-react`.
   This is the first thing anyone can click on.
5. **Jira one-way read sync** — `src/core/jira.ts`: given a key, pull status,
   resolution date, assignee. Never write back. Mirrors `CR`/`FT`/`On QA` as
   `jiraSubstatus`. Also lets the importer's area-matching improve (Jira
   components are already a taxonomy — roadmap-krav §5 step 9).
6. **Auth** — Auth.js + Google Workspace OIDC, role in `app_user`. Replaces the
   template's JB middleware. Blocked on OIDC credentials.
7. **Idea bank** — `status = 'Idea'` + a view + the `fa-concept` skill. Mostly
   falls out of steps 2 and 4 (`idebank` §7).

Stop points for review: after step 3 (the model is real and tested), after
step 4 (something to click).

---

## Import results — 11 September 2026

Source: OC's `OC_kopi_av_Roadmap.xlsx` (= `Fa Teams — Big Headlines — Allocation
Plan.xlsx`). The `WiP - Fa Roadmap 2026` file is **reference only, per OC** —
nothing was imported from it, and the importer has no code path that reads it.

Real data drifted a little from the August snapshot the spec docs describe —
expected, a live sheet moves. Two findings worth recording: `Next to do` is now
named `Backlog`, and a new `Backlog design` sheet exists (small, design-only
items) that no spec document mentions.

**Written:** 312 `roadmap_item` (39 Epic, 262 Task, 4 Bug, 7 Research) · 20
`app_user` · 28 `person_alias` · 249 `roadmap_source` · 312 `roadmap_status_log`
· 312 `event`.

**152 `import_note` rows, for a human to resolve:**

| Issue | Count | What it means |
|---|---|---|
| `area_unresolved` | 105 | Keyword rules found no area for a Task/Bug/Research title. Expected — the spec itself budgeted ~90 for manual review even with the old rules, and Jira-component enrichment (would shrink this a lot) is blocked on the API token. Epics are exempt — an empty area there is normal (feltkatalog §2), not flagged. |
| `completed_at_approximate` | 17 | No Final Delivery Date; used the 1st of the sheet's `Done MMYY` month instead. |
| `parser_flag` | 16 | Mostly bracket tags the importer doesn't specially handle (`[MyFa]`, `[fa-web]`, …) — informational, not necessarily wrong. |
| `status_guessed` | 5 | An active-looking status with no `jira_key` — defaulted to `Prioritized`. |
| `date_unparsed` | 5 | A date string that didn't match any of the 3 known patterns (e.g. `"16. - 18.06.2026."`). |
| `name_unresolved` | 4 | `Kula/Andrej`, `Marina / (Magnus)`, `Marina/Kula`, `Marina/Sina T.` — slash-joined dual ownership in a single-owner column. Needs a human to pick one, not a guess. |

**Two names need confirming, not silently dropped:** `Luka` and `Jonas` each
appear once in an owner/team column and aren't in any spec document. Real
people (new hires?) or a typo — `docs/../import/people.ts` flags both.

**Query the queue:**
```sql
SELECT issue, source_ref, raw->>'detail' FROM import_note WHERE issue = 'area_unresolved';
```

Re-runnable: `pnpm import:roadmap [path] [--write]` — no `--write` is a dry run
(prints the same summary, writes nothing). Re-running `--write` will duplicate
rows unless the roadmap tables are truncated first; there's no upsert (it's a
one-time import, per the spec).

---

## Public repo — what never gets committed

`github.com/oleronning-fa/fa-engine` is a **public** repo (confirmed via the
GitHub API, unauthenticated request returned 200). That changes what's allowed
in git beyond the usual `.env` rule:

- The source `.xlsx` files (real names, sales comments, business detail) live
  in `import-source/`, gitignored. Never commit them.
- The imported data itself lives only in Postgres (local dev, and later the
  platform's DB) — never as a file in the repo.
- Only the **importer code** and the **spec docs already in `docs/`** are
  public. If a future doc or export contains something more sensitive than
  what's already here, flag it before adding it to `docs/`.

---

## Blocked — needs someone else

| Blocker | Needed for | Owner |
|---|---|---|
| Jira API token, read access to FCK/FIB/FADT/FAPPS/JB | Import enrichment (shrinks `area_unresolved`) + one-way sync (steps 4, 5) | Profico / Atlassian admin |
| Google Workspace OIDC client (id + secret + redirect) | Real auth (step 6) | Hegnar Google Workspace admin |
| **One owner + one Slack channel per of the 18 areas** | `area_routing` seed; routing in every view | Hegnar (`versjonsplan` §9) |
| **Does the platform's shared Postgres have `pgvector`?** | `signal.embedding` / `theme.embedding` columns; everything from v1.2 | Platform owner (`coolify` skill) |
| Slack app with `chat:write` | Slack notifications (step 4 "bør ha") | Hegnar workspace admin |
| Who is `Luka`? Who is `Jonas`? | `person_alias` confirmation, 1 row each | OC |
| Which single name is the real owner on 4 items with slash-joined names | `import_note` issue `name_unresolved` | OC / Marina |

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
