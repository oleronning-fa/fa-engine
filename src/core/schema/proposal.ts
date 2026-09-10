import { jsonb, pgTable, real, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { roadmapItem } from './roadmap';
import { appUser } from './user';

/**
 * The week-agent's output (v1.2). The agent proposes, a human writes — nothing
 * reaches the roadmap without a click (plan §3, rule 1). Shell only in Phase 0;
 * the table exists so the audit trail and the accept-rate metric have somewhere
 * to land.
 */
export const proposal = pgTable('proposal', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** 'new_item' | 'raise_priority' | 'merge' | 'close_loop'. */
  type: text('type').notNull(),
  /** Signal ids backing the claim — every assertion must be clickable to evidence. */
  evidenceSignalIds: jsonb('evidence_signal_ids'),
  confidence: real('confidence'),
  /** 'pending' | 'approved' | 'rejected'. */
  status: text('status').notNull().default('pending'),
  /** Required when rejected, so the same idea doesn't come back every autumn. */
  rejectionReason: text('rejection_reason'),
  roadmapItemId: uuid('roadmap_item_id').references(() => roadmapItem.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  decidedBy: uuid('decided_by').references(() => appUser.id),
});

export type Proposal = typeof proposal.$inferSelect;
export type NewProposal = typeof proposal.$inferInsert;
