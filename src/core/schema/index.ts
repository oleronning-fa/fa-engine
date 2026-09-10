/**
 * The domain model — the one thing that must be right from day one (plan §1).
 *
 *   person ──┬── signal ──── theme ──── roadmap_item ──── owner ──── slack
 *   account ─┘
 *
 * Modules (`src/modules/{roadmap,feedback,crm,chat}`) talk to each other only
 * through this core, never directly (plan §8).
 *
 * This is also the drizzle-kit schema entry (see `drizzle.config.ts`). One
 * migration set in `drizzle/`, generated from these files.
 */

export * from './user';
export * from './person';
export * from './signal';
export * from './roadmap';
export * from './proposal';
export * from './audit';
export * from './routing';
export * from './import';
