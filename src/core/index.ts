/**
 * `core` — the customer graph and the vocabulary it joins on.
 *
 * Modules import from here. `core` imports from nothing above it.
 * See `docs/fa-engine-plan.md` §8 and `src/core/AGENTS.md`.
 */

export { db, schema, type Database } from './db';
export * as tables from './schema';
export * from './codesets';
