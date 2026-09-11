/**
 * The import's alias table (roadmap-krav §5, step 5) — hand-written from a
 * survey of the actual sheet (`pnpm exec tsx scripts/survey-workbook.ts`),
 * 10 September 2026.
 *
 * Real spelling variants found: only TWO people actually have them (the sheet
 * is cleaner than the August snapshot suggested). Everyone else appears with
 * one consistent spelling.
 *
 * Emails are filled in ONLY where known with confidence — inventing one would
 * be worse than leaving it blank. `app_user.email` is nullable for exactly
 * this reason; unconfirmed rows get an email once the person signs in via
 * Google OIDC or HR confirms an address.
 *
 * `Luka` and `Jonas` appear once each in the sheet and aren't mentioned in any
 * spec document — flagged as new/unconfirmed, not silently dropped.
 */
export interface CanonicalPerson {
  /** The name written into `app_user.name`. */
  name: string;
  email?: string;
  /** Every spelling found in the sheet that should resolve to this person. */
  aliases: string[];
  note?: string;
}

export const CANONICAL_PEOPLE: CanonicalPerson[] = [
  { name: 'Ole Christian', email: 'ole.ronning@hegnar.no', aliases: ['Ole Christian', 'OC'] },
  { name: 'Magnus', aliases: ['Magnus'] },
  { name: 'Marina', aliases: ['Marina'] },
  { name: 'Siniša T.', aliases: ['Sina T.', 'Sina T', 'Siniša T', 'Sinisa T', 'Sinisa T.'] },
  { name: 'Siniša M.', aliases: ['Sina M.', 'Siniša M', 'Sinisa M', 'Sinisa M.'] },
  { name: 'Andrej', aliases: ['Andrej'] },
  { name: 'Andrija', aliases: ['Andrija'] },
  { name: 'Kula', aliases: ['Kula'] },
  { name: 'Filip', aliases: ['Filip'] },
  { name: 'Matija', aliases: ['Matija'] },
  { name: 'Carlo', aliases: ['Carlo'] },
  { name: 'Tomislav', aliases: ['Tomislav'] },
  { name: 'Marko', aliases: ['Marko'] },
  { name: 'Franko', aliases: ['Franko'] },
  { name: 'Mihovil', aliases: ['Mihovil'] },
  { name: 'Josipa', aliases: ['Josipa'] },
  { name: 'Verino', aliases: ['Verino'] },
  { name: 'Petar', aliases: ['Petar'] },
  { name: 'Luka', aliases: ['Luka'], note: 'New — appears once, not in any spec doc. Confirm who this is.' },
  { name: 'Jonas', aliases: ['Jonas'], note: 'New — appears once, not in any spec doc. Confirm who this is.' },
];

/**
 * Values that show up in an owner/team column but are not a person —
 * spreadsheet noise, not silently merged into anyone.
 */
export const IGNORED_NAME_VALUES = new Set(['Owner']);

const ALIAS_INDEX = new Map<string, CanonicalPerson>();
for (const person of CANONICAL_PEOPLE) {
  for (const alias of person.aliases) ALIAS_INDEX.set(alias.toLowerCase(), person);
}

/** Case-insensitive alias lookup. Returns null for noise values and unknown names alike. */
export function resolveCanonicalPerson(raw: string): CanonicalPerson | null {
  const key = raw.trim().toLowerCase();
  if (!key || IGNORED_NAME_VALUES.has(raw.trim())) return null;
  return ALIAS_INDEX.get(key) ?? null;
}
