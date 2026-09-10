/**
 * Fixed code sets for the roadmap module.
 *
 * Source of truth: `docs/fa-engine-roadmap-feltkatalog.md` §0, cross-checked
 * against `docs/fa-engine-roadmap-krav.md` §3. All of these are "faste
 * kodesett, endres i kode" — no custom fields, no user-editable enums.
 *
 * Internal surfaces are in English (roadmap-krav §10), so the values here are
 * English. Status labels are translated ONCE, here, not scattered.
 */

/** Item type — from the bracket prefixes in today's sheet titles. */
export const ROADMAP_ITEM_TYPES = ['Epic', 'Task', 'Bug', 'Research'] as const;
export type RoadmapItemType = (typeof ROADMAP_ITEM_TYPES)[number];

/** A discipline is orthogonal to type — an item can be a Task AND Design. */
export const DISCIPLINES = ['Design'] as const;
export type Discipline = (typeof DISCIPLINES)[number];

/**
 * Task / Bug / Research status — 6 values.
 * `Idea` → `Under review` → `Prioritized` → `In Jira` → `Delivered` · `Declined`
 *
 * `In Jira` mirrors Jira one-way. `Declined` requires `declinedReason`.
 * `Delivered` + `completedAt` are set automatically when Jira reports the
 * issue resolved.
 */
export const TASK_STATUSES = [
  'Idea',
  'Under review',
  'Prioritized',
  'In Jira',
  'Delivered',
  'Declined',
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

/**
 * Epic has its OWN 3-value status set — no Jira mirroring, no declined state.
 * This is the one field where Epic and Task/Bug/Research diverge
 * (feltkatalog §0). The two sets never collide in any view.
 */
export const EPIC_STATUSES = ['Ikke påbegynt', 'Påbegynt', 'Ferdig - arkivert'] as const;
export type EpicStatus = (typeof EPIC_STATUSES)[number];

/** Every status value that can land in `roadmap_item.status`. */
export const ROADMAP_STATUSES = [...TASK_STATUSES, ...EPIC_STATUSES] as const;
export type RoadmapStatus = (typeof ROADMAP_STATUSES)[number];

/**
 * Jira sub-status, mirrored one-way, shown only when `status = 'In Jira'`.
 * Never written from Fa Engine. Dropdown in today's sheet was
 * `Waiting, Todo, In progress, CR, FT, On QA, Done` (roadmap-krav §3.5).
 */
export const JIRA_SUBSTATUSES = [
  'Waiting',
  'Todo',
  'In progress',
  'CR',
  'FT',
  'On QA',
  'Done',
] as const;
export type JiraSubstatus = (typeof JIRA_SUBSTATUSES)[number];

/** One scale, replacing the `High/Medium/Low` + `1.0` + `?` mix in the sheet. */
export const PRIORITIES = ['Hotfix', 'High', 'Medium', 'Low'] as const;
export type Priority = (typeof PRIORITIES)[number];

/** Optional t-shirt size. Never mandatory — hour estimates died at 0% fill. */
export const SIZES = ['S', 'M', 'L', 'Ongoing'] as const;
export type Size = (typeof SIZES)[number];

/** Where a `roadmap_source` row points. `sources[]` is "the most important field in the module". */
export const SOURCE_KINDS = ['slack', 'signal', 'theme', 'url'] as const;
export type SourceKind = (typeof SOURCE_KINDS)[number];

const has = <T extends readonly string[]>(set: T, v: string): v is T[number] =>
  (set as readonly string[]).includes(v);

export const isRoadmapItemType = (v: string): v is RoadmapItemType => has(ROADMAP_ITEM_TYPES, v);
export const isTaskStatus = (v: string): v is TaskStatus => has(TASK_STATUSES, v);
export const isEpicStatus = (v: string): v is EpicStatus => has(EPIC_STATUSES, v);
export const isPriority = (v: string): v is Priority => has(PRIORITIES, v);
export const isSize = (v: string): v is Size => has(SIZES, v);

/** Which status set applies, given an item type. */
export function statusSetFor(type: RoadmapItemType): readonly RoadmapStatus[] {
  return type === 'Epic' ? EPIC_STATUSES : TASK_STATUSES;
}
