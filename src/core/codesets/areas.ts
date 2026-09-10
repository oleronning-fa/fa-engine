/**
 * The 18 consolidated product areas.
 *
 * Source of truth: `docs/fa-engine-signalkoblingen.md` §5. This list REPLACES
 * the earlier ones in `fa-engine-plan.md` §2 and `fa-engine-roadmap-krav.md` §7
 * — do not reintroduce those.
 *
 * A fixed code set: changed here in code, never user-editable (see the field
 * catalogs' "faste kodesett, endres i kode"). Free text in an `area` field
 * recreates the Owner/Team mess from roadmap-krav §3.3.
 *
 * Each area needs ONE responsible person and ONE Slack channel — that mapping
 * is the router ("område → ansvarlig → Slack-kanal", plan §2) and lives in the
 * `area_routing` table, seeded once the owners are assigned. That assignment is
 * still an open blocker (signalkoblingen §5, plan §10).
 */

export const AREAS = [
  { id: 'bors-instrumenter', label: 'Børs & instrumenter' },
  { id: 'bjellesauer', label: 'Bjellesauer' },
  { id: 'artikkel-innhold-sok', label: 'Artikkel, innhold & søk' },
  { id: 'nyhetsbrev-varsler', label: 'Nyhetsbrev & varsler' },
  { id: 'forum', label: 'Forum' },
  { id: 'mittfa-personalisering', label: 'MittFa & personalisering' },
  { id: 'watchlist-portefolje', label: 'Watchlist & portefølje' },
  { id: 'papir-eavis', label: 'Papir & eAvis' },
  { id: 'abonnement-betaling', label: 'Abonnement & betaling' },
  { id: 'bedriftsabonnement-b2b', label: 'Bedriftsabonnement & B2B' },
  { id: 'innlogging-konto', label: 'Innlogging & konto' },
  { id: 'app', label: 'App' },
  { id: 'annonse', label: 'Annonse' },
  { id: 'ai-investorchat', label: 'AI & Investorchat' },
  { id: 'sporing-analyse', label: 'Sporing & analyse' },
  { id: 'ytelse-teknisk-plattform', label: 'Ytelse & teknisk plattform' },
  { id: 'interne-verktoy', label: 'Interne verktøy' },
  { id: 'annet', label: 'Annet' },
] as const;

export type AreaId = (typeof AREAS)[number]['id'];

export const AREA_IDS = AREAS.map((a) => a.id) as [AreaId, ...AreaId[]];

const AREA_LABEL = new Map<AreaId, string>(AREAS.map((a) => [a.id, a.label]));

export function areaLabel(id: AreaId): string {
  return AREA_LABEL.get(id) ?? id;
}

export function isAreaId(value: string): value is AreaId {
  return AREA_LABEL.has(value as AreaId);
}
