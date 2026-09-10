import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * A reader / customer / prospect. Pseudonymous by construction — `pseudonymId`
 * is the key everything else references, which keeps GDPR tractable (plan §2,
 * crm-feltkatalog §1). Linked to a real subscriber only through an adapter,
 * never directly.
 *
 * A prospect is just a `person` with no subscription — there is no separate
 * prospect table (crm-krav §4.1).
 *
 * v1.0 barely touches this table; the CRM module (v2.0) adds reservation
 * status, suppression, contact policy and identity-link fields. Kept minimal
 * here but shaped so those can be added without a rework.
 */
export const person = pgTable('person', {
  id: uuid('id').primaryKey().defaultRandom(),
  pseudonymId: text('pseudonym_id').notNull().unique(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  email: text('email'),
  /** Normalised to +47XXXXXXXX. The common key against Sesamy/Telia later. */
  phoneE164: text('phone_e164'),
  /** Kept verbatim for traceability on import. */
  phoneRaw: text('phone_raw'),
  accountId: uuid('account_id').references(() => account.id),
  /** 'import' | 'kampanje' | 'manuelt' | 'innkommende' */
  origin: text('origin'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * A company. Carries the B2B agreement, seats, renewal date. Enriched from
 * Brreg in a worker job (crm-feltkatalog §3). Minimal shell for now.
 */
export const account = pgTable('account', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgNumber: text('org_number').unique(),
  name: text('name'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Subscription — owned entirely by Sesamy, read through a `SubscriptionProvider`
 * interface (plan §6). Nothing here is written from Fa Engine; this is a cached
 * read model. `cancellationReason` is the seller's single most important field
 * in a win-back call (crm-feltkatalog §2).
 */
export const subscription = pgTable('subscription', {
  id: uuid('id').primaryKey().defaultRandom(),
  personId: uuid('person_id')
    .notNull()
    .references(() => person.id),
  externalId: text('external_id'),
  productName: text('product_name'),
  status: text('status'),
  priceNok: integer('price_nok'),
  cancellationReason: text('cancellation_reason'),
  syncedAt: timestamp('synced_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Person = typeof person.$inferSelect;
export type NewPerson = typeof person.$inferInsert;
export type Account = typeof account.$inferSelect;
export type Subscription = typeof subscription.$inferSelect;
