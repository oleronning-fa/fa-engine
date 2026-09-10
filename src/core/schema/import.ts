import { boolean, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { appUser } from './user';

/**
 * Alias table for name normalisation on import — ~20 hand-written rows mapping
 * the sheet's 22 spellings of two people onto real users (roadmap-krav §5,
 * step 5). Written once, worth every minute.
 */
export const personAlias = pgTable(
  'person_alias',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    alias: text('alias').notNull().unique(),
    canonicalUserId: uuid('canonical_user_id')
      .notNull()
      .references(() => appUser.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('person_alias_alias_idx').on(t.alias)],
);

/**
 * Anything the importer can't confidently parse goes here for manual review —
 * never into a silent NULL nobody sees (roadmap-krav §5, step 6). Covers
 * unparseable dates, the ~90 items keyword rules don't place into an area, and
 * the "Line N" cross-sheet references.
 */
export const importNote = pgTable(
  'import_note',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Import run identifier, so a re-run's notes are grouped. */
    runId: text('run_id').notNull(),
    /** Which sheet + row this came from. */
    sourceRef: text('source_ref'),
    /** The raw parsed row, for context during review. */
    raw: jsonb('raw'),
    /** 'area_unresolved' | 'date_unparsed' | 'cross_reference' | 'name_unmatched' | ... */
    issue: text('issue').notNull(),
    resolved: boolean('resolved').notNull().default(false),
    resolvedBy: uuid('resolved_by').references(() => appUser.id),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('import_note_run_idx').on(t.runId), index('import_note_resolved_idx').on(t.resolved)],
);

export type PersonAlias = typeof personAlias.$inferSelect;
export type ImportNote = typeof importNote.$inferSelect;
