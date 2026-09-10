import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { appUser } from './user';

/**
 * The router: area → responsible person → Slack channel.
 *
 * This is what turns "tag the right owner" into a `SELECT` instead of a guess
 * (plan §2). One row per area id (`AREA_IDS`). Seeded when the 18 owners are
 * assigned — still an open blocker (signalkoblingen §5, plan §10, versjonsplan §9).
 *
 * The 18 area IDENTITIES are fixed in code (`codesets/areas.ts`); this table is
 * only the operational mapping, which changes without a deploy.
 */
export const areaRouting = pgTable('area_routing', {
  /** One of `AREA_IDS`. */
  areaId: text('area_id').primaryKey(),
  responsibleUserId: uuid('responsible_user_id').references(() => appUser.id),
  slackChannelId: text('slack_channel_id'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type AreaRouting = typeof areaRouting.$inferSelect;
