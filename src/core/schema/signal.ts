import { bigint, jsonb, pgTable, text, timestamp, uuid, vector } from 'drizzle-orm/pg-core';
import { account, person } from './person';
import { appUser } from './user';

/**
 * One incoming utterance — a chat message, a form submission, an email, a
 * sales note, a forum post, an internal idea. This is the seam that makes the
 * whole thing one system (`docs/fa-engine-signalkoblingen.md`).
 *
 * Two independent axes:
 *   - `area`      — which part of the product (one of the 18). On any signal.
 *   - `objection` — why not (one of the 10). Only on sales signals.
 * A signal can carry both: "I only read Børs, and 5 490 is too much" →
 * area `bors-instrumenter` + objection `pris`.
 *
 * `rawText` is stored unchanged — the exact wording is the evidence. The agent
 * summarises; it never overwrites (signalkoblingen §3, rule 1).
 *
 * v1.0 does not write signals yet (that's v1.1's feedback hub and v2.0's CRM),
 * but the table and the join columns exist from Phase 0 so nothing has to be
 * reworked later.
 */
export const signal = pgTable('signal', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** One of `SIGNAL_SOURCES`. */
  source: text('source').notNull(),
  /** The author's own words, never rewritten. */
  rawText: text('raw_text').notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  personId: uuid('person_id').references(() => person.id),
  accountId: uuid('account_id').references(() => account.id),
  /** One of `AREA_IDS`. Optional. */
  area: text('area'),
  /** One of `OBJECTION_IDS`. Optional; sales signals only. */
  objection: text('objection'),
  sentiment: text('sentiment'),
  /** Filled by the week-agent from v1.2. OpenAI/Anthropic embedding width. */
  embedding: vector('embedding', { dimensions: 1536 }),
  dedupeKey: text('dedupe_key'),
  /**
   * Carries the money on a sales signal: callAttemptId, campaignId, listId,
   * offeredProductId, offeredPriceNok (signalkoblingen §3, rule 2).
   */
  context: jsonb('context'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => appUser.id),
});

/**
 * A cluster of signals with a human name ("Can't change username in the
 * forum"). Carries a count, first/last seen, affected ARR. Empty until v1.1;
 * `roadmap_item_theme` links themes to roadmap items and concepts.
 */
export const theme = pgTable('theme', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  signalCount: bigint('signal_count', { mode: 'number' }).notNull().default(0),
  firstSeenAt: timestamp('first_seen_at', { withTimezone: true }),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
  /** Affected annual recurring revenue, in whole NOK. */
  affectedArrNok: bigint('affected_arr_nok', { mode: 'number' }),
  embedding: vector('embedding', { dimensions: 1536 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Signal = typeof signal.$inferSelect;
export type NewSignal = typeof signal.$inferInsert;
export type Theme = typeof theme.$inferSelect;
