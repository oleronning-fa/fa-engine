/**
 * Sales objection codes — the second axis on a signal, separate from `area`.
 *
 * Source of truth: `docs/fa-engine-signalkoblingen.md` §6. `area` answers
 * "which part of the product?"; `objection` answers "why not?". Only sales
 * signals carry one, and it can be empty.
 *
 * Fixed code set, changed here in code. Free text recreates the Owner/Team
 * problem one layer earlier (signalkoblingen §6).
 */

export const OBJECTIONS = [
  { id: 'pris', label: 'Pris', hint: 'For dyrt for det jeg får ut av det' },
  { id: 'bruker_det_ikke', label: 'Bruker det ikke', hint: 'Leser det ikke ofte nok' },
  { id: 'konkurrent', label: 'Konkurrent', hint: 'Har DN / E24 / Kapital' },
  { id: 'gratis_alternativ', label: 'Gratis alternativ', hint: 'Får det jeg trenger gratis' },
  { id: 'innhold', label: 'Innhold', hint: 'For lite om det jeg bryr meg om — bærer ofte også en area' },
  { id: 'format', label: 'Format', hint: 'Vil ikke ha papir / vil bare ha papir' },
  { id: 'tidligere_erfaring', label: 'Tidligere erfaring', hint: 'Sist gikk det galt — peker ofte på et eksisterende tema' },
  { id: 'beslutning_hos_andre', label: 'Beslutning hos andre', hint: 'Bedriften/partneren bestemmer' },
  { id: 'livssituasjon', label: 'Livssituasjon', hint: 'Pensjonert / sluttet i bransjen — renser lister, ikke et produktproblem' },
  { id: 'ikke_oppgitt', label: 'Ikke oppgitt', hint: 'Ingen grunn gitt' },
] as const;

export type ObjectionId = (typeof OBJECTIONS)[number]['id'];

export const OBJECTION_IDS = OBJECTIONS.map((o) => o.id) as [ObjectionId, ...ObjectionId[]];

const OBJECTION_LABEL = new Map<ObjectionId, string>(OBJECTIONS.map((o) => [o.id, o.label]));

export function objectionLabel(id: ObjectionId): string {
  return OBJECTION_LABEL.get(id) ?? id;
}

export function isObjectionId(value: string): value is ObjectionId {
  return OBJECTION_LABEL.has(value as ObjectionId);
}
