/**
 * Date parsing for the import — three patterns, per roadmap-krav §5 step 6:
 * `DD.MM.YYYY.` (with trailing dot), a real datetime (exceljs gives these as
 * JS `Date` when Excel stored the cell as a date type), and an interval
 * `DD.-DD.MM.YYYY.` which becomes a `target_week`, not a `target_date`.
 * Anything else is `unparsed` — goes to `import_note`, never a silent NULL.
 */

export type ParsedDate =
  | { kind: 'date'; date: string } // YYYY-MM-DD
  | { kind: 'week'; targetWeek: string } // "2026-W33"
  | { kind: 'empty' }
  | { kind: 'unparsed'; raw: string };

const DOT_DATE = /^(\d{1,2})\.(\d{1,2})\.(\d{4})\.?$/;
// "10.-14.08.2026." — start day, end day, month, year
const INTERVAL = /^(\d{1,2})\.-(\d{1,2})\.(\d{1,2})\.(\d{4})\.?$/;
const EMPTY_VALUES = new Set(['', '-', '–', '—', 'n/a', 'tbd']);

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** ISO-8601 week number for a date, "YYYY-W##". */
function isoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${pad(week)}`;
}

/**
 * `raw` is the cell's raw value (string or Date) — NOT pre-flattened text, so
 * a genuinely-typed Excel date cell is recognised as such rather than parsed
 * as a string.
 */
export function parseDateValue(raw: unknown): ParsedDate {
  if (raw == null) return { kind: 'empty' };

  if (raw instanceof Date) {
    return { kind: 'date', date: `${raw.getFullYear()}-${pad(raw.getMonth() + 1)}-${pad(raw.getDate())}` };
  }

  const text = String(raw).trim();
  if (EMPTY_VALUES.has(text.toLowerCase())) return { kind: 'empty' };

  const interval = text.match(INTERVAL);
  if (interval) {
    const [, startDay, , month, year] = interval;
    const d = new Date(Number(year), Number(month) - 1, Number(startDay));
    return { kind: 'week', targetWeek: isoWeek(d) };
  }

  const dot = text.match(DOT_DATE);
  if (dot) {
    const [, day, month, year] = dot;
    // Guard against swapped day/month or a garbled value rather than
    // constructing an invalid date silently.
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    const valid =
      d.getFullYear() === Number(year) && d.getMonth() === Number(month) - 1 && d.getDate() === Number(day);
    if (!valid) return { kind: 'unparsed', raw: text };
    return { kind: 'date', date: `${year}-${pad(Number(month))}-${pad(Number(day))}` };
  }

  return { kind: 'unparsed', raw: text };
}

/** Sheet name "Done 0126" → { month: 1, year: 2026 }, for the completed_month fallback. */
export function monthFromDoneSheetName(sheetName: string): { month: number; year: number } | null {
  const m = sheetName.match(/^Done\s+(\d{2})(\d{2})$/);
  if (!m) return null;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return null;
  return { month, year };
}
