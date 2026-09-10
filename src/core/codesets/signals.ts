/**
 * Signal sources and user roles.
 *
 * `signal` is the join that makes Fa Engine one system rather than three tools
 * in a repo (`docs/fa-engine-signalkoblingen.md`). Every incoming utterance is
 * a signal against the customer graph.
 */

/**
 * Where a signal came from. `sales_note` is added by telemarketing (one
 * keystroke → a signal in the seller's own words, never rewritten —
 * signalkoblingen §3). `cancellation` is the free fourth source from Sesamy's
 * `cancellationReason` (signalkoblingen §2), wired up in a later phase.
 */
export const SIGNAL_SOURCES = [
  'chat',
  'form',
  'email',
  'sales_note',
  'forum',
  'internal_idea',
  'cancellation',
] as const;
export type SignalSource = (typeof SIGNAL_SOURCES)[number];

export function isSignalSource(v: string): v is SignalSource {
  return (SIGNAL_SOURCES as readonly string[]).includes(v);
}

/**
 * Staff roles. Internal users come from Google Workspace OIDC (plan §5); the
 * role lives in our own table, not in the IdP. Sales and support get read
 * access from v1.0 so v1.1's feedback hub has somewhere to point.
 *
 * The CRM module (v2.0) adds its own operational roles — see
 * `docs/fa-engine-crm-feltkatalog.md` §10 — layered on top of these.
 */
export const USER_ROLES = ['produkt', 'salg', 'support', 'analytiker', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(v: string): v is UserRole {
  return (USER_ROLES as readonly string[]).includes(v);
}

/** Who/what performed an audited action. Agent actions are logged too (plan §3). */
export const ACTOR_KINDS = ['user', 'agent', 'system', 'import'] as const;
export type ActorKind = (typeof ACTOR_KINDS)[number];
