import { bigserial, index, jsonb, pgTable, real, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { appUser } from './user';

/**
 * Append-only audit log. Every change, including every agent action (plan §2,
 * §3). Never updated, never deleted.
 */
export const event = pgTable(
  'event',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    /** Null when the actor is the agent or the system. */
    actorId: uuid('actor_id').references(() => appUser.id),
    /** One of `ACTOR_KINDS`: 'user' | 'agent' | 'system' | 'import'. */
    actorKind: text('actor_kind').notNull().default('user'),
    /** e.g. 'roadmap_item.status_changed', 'signal.recorded', 'import.run'. */
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    payload: jsonb('payload'),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('event_entity_idx').on(t.entityType, t.entityId),
    index('event_at_idx').on(t.at),
  ],
);

/**
 * One row per model call: cost control and GDPR documentation from day one
 * (plan §2, §9). `piiClass` records which class of personal data left the
 * building.
 */
export const llmCall = pgTable(
  'llm_call',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    purpose: text('purpose'),
    promptHash: text('prompt_hash'),
    model: text('model'),
    inputTokens: real('input_tokens'),
    outputTokens: real('output_tokens'),
    costNok: real('cost_nok'),
    latencyMs: real('latency_ms'),
    piiClass: text('pii_class'),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('llm_call_at_idx').on(t.at)],
);

export type Event = typeof event.$inferSelect;
export type NewEvent = typeof event.$inferInsert;
export type LlmCall = typeof llmCall.$inferSelect;
