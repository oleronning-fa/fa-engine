import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Internal staff — OC, Magnus, Marina, the Zagreb executors, plus sales and
 * support (read access from v1.0).
 *
 * Populated from Google Workspace OIDC on first sign-in (plan §5); `externalId`
 * holds the OIDC `sub`. Kept separate from `person` (readers/prospects, which
 * are pseudonymous — see `person.ts`): a roadmap `ownerId` is a colleague, a
 * `signal.personId` is a reader.
 *
 * Named `app_user` because `user` is reserved in Postgres.
 */
export const appUser = pgTable('app_user', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** Google Workspace address — the natural key while OIDC isn't wired yet. */
  email: text('email').notNull().unique(),
  /** OIDC `sub`. Null until the person has actually signed in. */
  externalId: text('external_id').unique(),
  name: text('name').notNull(),
  initials: text('initials'),
  /** One of `USER_ROLES`. Guarded in domain code, not by a DB enum. */
  role: text('role').notNull().default('produkt'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type AppUser = typeof appUser.$inferSelect;
export type NewAppUser = typeof appUser.$inferInsert;
