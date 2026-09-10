# src/modules/roadmap — v1.0

The roadmap tool that replaces `Fa Teams — Big Headlines — Allocation Plan.xlsx`.

**Read first:** `docs/fa-engine-roadmap-krav.md` (requirements + the 10-step
import spec), `docs/fa-engine-roadmap-feltkatalog.md` (the field contract),
`docs/fa-engine-idebank.md` (the Idea-bank status step).

## What this module owns

- `roadmap_item` and its satellites (`roadmap_*` tables in `src/core/schema/roadmap.ts`).
- The importer (`import/`) — one-off, run repeatedly against a test DB first.
- The views: one list, the Epic page, Idea bank → Backlog → board, "For deg", Logg.
- Jira one-way read sync (via `src/core/jira.ts`).

## Invariants

- **`area` is required on `Task`/`Bug`/`Research`, optional on `Epic`.** Enforced
  here, not by a DB constraint (Epic legitimately spans areas).
- **`status` uses two sets by type.** Task/Bug/Research: the 6-value set. Epic:
  its own 3 values. `statusSetFor(type)` in `core/codesets`. They never mix in a
  view.
- **`declinedReason` is mandatory when `status = 'Declined'`.**
- **`completedAt` is set automatically** when `status` becomes `'Delivered'` —
  never by hand.
- **Every status change appends a `roadmap_status_log` row** and an `event`.
- **`In Jira` and everything below it is mirrored from Jira, one-way.** Never
  write `jiraSubstatus`, resolution date, or assignee back to Jira.
- **`backlogged`** distinguishes the Backlog view from the board's "Neste"
  column. Set `true` when a Jira key is attached; `false` on "Move to Neste".

## Import

Anything the importer can't confidently parse → an `import_note` row, never a
silent `NULL`. Names normalise through `person_alias`. Read the hyperlinks, not
just the cell values (244 titles carry a Jira key only in the link).
