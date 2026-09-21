import {
  type AnyPgColumn,
  bigserial,
  boolean,
  date,
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { theme } from './signal';
import { appUser } from './user';

/**
 * The roadmap item — what the Google Sheet is today, as a real model.
 *
 * Contract: `docs/fa-engine-roadmap-feltkatalog.md` §1. Epic and Task/Bug/
 * Research are ONE table, different `type` — not two entities (plan §2). The
 * only field where they truly diverge is `status` (§0): Task uses the 6-value
 * set, Epic its own 3-value set. Domain code guards that; the DB column is
 * plain text.
 *
 * "Jira eier gjennomføring, Fa Engine eier intensjon." `jiraKey` is a
 * first-class field, NOT unique — several rows may point at one issue
 * (fa-engine-status.md). Status and resolution date are mirrored one-way from
 * Jira; nothing is ever written back.
 */
export const roadmapItem = pgTable(
  'roadmap_item',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** 'Epic' | 'Task' | 'Bug' | 'Research'. Not changed after creation. */
    type: text('type').notNull(),
    /** 'Design' — a discipline, orthogonal to type. */
    discipline: text('discipline'),
    title: text('title').notNull(),
    /** Optional single emoji shown on the card — Epic and Idea only, OC's ask. Not a real field in any spec doc. */
    emoji: text('emoji'),
    /** Original sheet title, kept only on import for traceability. */
    rawTitle: text('raw_title'),
    /** Short markdown context — the row-under-the-title convention as a real field. */
    description: text('description'),
    /**
     * Long free-text field — Task/Bug/Research only, not meaningful on Epic
     * (feltkatalog §3). Deliberately unstructured: pasted context, background,
     * things to remember. Never AI-filled at creation (§6, "bevisst utelatt").
     */
    notes: text('notes'),
    /** One of `AREA_IDS`. Required on Task, optional on Epic (enforced in domain code). */
    area: text('area'),
    /** "Owner, Hegnar Media" — business/product owner (OC, Magnus). */
    ownerId: uuid('owner_id').references(() => appUser.id),
    /** "Owner, Profico" — coordinating role on the supplier side (Marina, tech leads). */
    coordinatorId: uuid('coordinator_id').references(() => appUser.id),
    /** One of the status sets in `codesets/roadmap.ts`. Mirrored from Jira when `jiraKey` is set. */
    status: text('status').notNull(),
    /** 'CR' | 'FT' | 'On QA' | ... — shown only when status = 'In Jira'. Never written here. */
    jiraSubstatus: text('jira_substatus'),
    /** Required when status = 'Declined'. Merges the sheet's "Won't do" / "Outdated". */
    declinedReason: text('declined_reason'),
    /** NOT unique on purpose. Once set, status + resolution date come from Jira. */
    jiraKey: text('jira_key'),
    /**
     * Task/Bug/Research only. Separates the Backlog view from the board's
     * "Neste" column — both are status 'In Jira' with an early sub-status, so
     * without this flag the two steps can't be told apart (feltkatalog §1).
     */
    backlogged: boolean('backlogged').notNull().default(false),
    /** 'Hotfix' | 'High' | 'Medium' | 'Low'. */
    priority: text('priority'),
    /** 'S' | 'M' | 'L' | 'Ongoing'. Optional, never mandatory. */
    size: text('size'),
    targetDate: date('target_date'),
    /** For items without day precision: "10.–14.08.2026" → week 33. */
    targetWeek: text('target_week'),
    /** Set automatically when status becomes 'Delivered'. */
    completedAt: timestamp('completed_at', { withTimezone: true }),
    /**
     * Soft delete — set by the "Remove" action on an Epic card (OC, 21 Sep).
     * Hides the item from default views; nothing is actually deleted, nothing
     * cascades. Null = visible, as normal.
     */
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    /** Real parent relation. A Task usually points at an Epic; a sub-task at another Task. */
    parentId: uuid('parent_id').references((): AnyPgColumn => roadmapItem.id),
    /** Idea-bank attribution — follows the item all the way to delivery (idebank §3). */
    proposedBy: uuid('proposed_by').references(() => appUser.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid('created_by').references(() => appUser.id),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('roadmap_item_type_idx').on(t.type),
    index('roadmap_item_status_idx').on(t.status),
    index('roadmap_item_area_idx').on(t.area),
    index('roadmap_item_jira_key_idx').on(t.jiraKey),
    index('roadmap_item_parent_idx').on(t.parentId),
  ],
);

/** `assignee_ids[]` — "Team" / executors, a real relation not free text. */
export const roadmapItemAssignee = pgTable(
  'roadmap_item_assignee',
  {
    roadmapItemId: uuid('roadmap_item_id')
      .notNull()
      .references(() => roadmapItem.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => appUser.id),
  },
  (t) => [primaryKey({ columns: [t.roadmapItemId, t.userId] })],
);

/** `theme_ids[]` — link to feedback themes. Empty until v1.1. */
export const roadmapItemTheme = pgTable(
  'roadmap_item_theme',
  {
    roadmapItemId: uuid('roadmap_item_id')
      .notNull()
      .references(() => roadmapItem.id, { onDelete: 'cascade' }),
    themeId: uuid('theme_id')
      .notNull()
      .references(() => theme.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.roadmapItemId, t.themeId] })],
);

/**
 * `sources[]` — "the most important field in the whole module" (roadmap-krav §4).
 * A Slack permalink here is resolved to channel / author / date / excerpt and
 * shown inline, without clicking out.
 */
export const roadmapSource = pgTable(
  'roadmap_source',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    roadmapItemId: uuid('roadmap_item_id')
      .notNull()
      .references(() => roadmapItem.id, { onDelete: 'cascade' }),
    /** 'slack' | 'signal' | 'theme' | 'url'. */
    kind: text('kind').notNull(),
    /** The permalink / external URL, or the id of the signal/theme. */
    ref: text('ref').notNull(),
    label: text('label'),
    /** Slack preview payload: channel, author, date, excerpt. */
    meta: jsonb('meta'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid('created_by').references(() => appUser.id),
  },
  (t) => [index('roadmap_source_item_idx').on(t.roadmapItemId)],
);

/**
 * Status log — who, what, when, for every change, from day one. The basis for
 * all measurement (roadmap-krav §8.7). Sheet dates are day-precision only; we
 * keep a real timestamp but don't rely on intraday ordering (feltkatalog §7).
 */
export const roadmapStatusLog = pgTable(
  'roadmap_status_log',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    roadmapItemId: uuid('roadmap_item_id')
      .notNull()
      .references(() => roadmapItem.id, { onDelete: 'cascade' }),
    fromStatus: text('from_status'),
    toStatus: text('to_status'),
    fromSubstatus: text('from_substatus'),
    toSubstatus: text('to_substatus'),
    actorId: uuid('actor_id').references(() => appUser.id),
    note: text('note'),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('roadmap_status_log_item_idx').on(t.roadmapItemId)],
);

/**
 * `comments[]` — Epic only. A human thread that follows progress over time,
 * distinct from `status_log` (system events). The latest comment shows on the
 * epic card (feltkatalog §2).
 */
export const roadmapComment = pgTable(
  'roadmap_comment',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    roadmapItemId: uuid('roadmap_item_id')
      .notNull()
      .references(() => roadmapItem.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id')
      .notNull()
      .references(() => appUser.id),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('roadmap_comment_item_idx').on(t.roadmapItemId)],
);

export type RoadmapItem = typeof roadmapItem.$inferSelect;
export type NewRoadmapItem = typeof roadmapItem.$inferInsert;
export type RoadmapSource = typeof roadmapSource.$inferSelect;
export type RoadmapStatusLogEntry = typeof roadmapStatusLog.$inferSelect;
export type RoadmapComment = typeof roadmapComment.$inferSelect;
