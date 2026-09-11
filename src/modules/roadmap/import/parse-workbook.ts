import ExcelJS from 'exceljs';
import type { Discipline, RoadmapItemType } from '../../../core/codesets';
import { monthFromDoneSheetName } from './dates';

const SECTION_MARKERS = new Set(['DEVELOPMENT epic', 'DEVELOPMENT task', 'DESIGN']);
export const SKIP_SHEETS = new Set(['Oslo trip', 'Sheet3']);

const BRACKET = /^\[([a-zA-Z -]+)\]\s*/;
const JIRA_KEY_IN_URL = /\/browse\/([A-Z][A-Z0-9]{1,9}-\d+)/;
const JIRA_KEY_IN_TEXT = /\b([A-Z]{2,10}-\d+)\b/;
const URL_IN_TEXT = /https?:\/\/\S+/g;

export interface ParsedSource {
  kind: 'slack' | 'url';
  ref: string;
}

export interface ParsedItem {
  sourceSheet: string;
  sourceRow: number;
  type: RoadmapItemType;
  discipline: Discipline | null;
  rawTitle: string;
  title: string;
  description: string | null;
  isSubtask: boolean;
  ownerHmRaw: string | null;
  ownerProficoRaw: string | null;
  teamRaw: string | null;
  statusRaw: string | null;
  priorityRaw: string | null;
  sizeRaw: string | null; // Ballpark Est
  targetDateRaw: unknown; // Estimated delivery date — raw cell value
  completedAtRaw: unknown; // Final Delivery Date — raw cell value
  completedMonthFallback: { month: number; year: number } | null;
  comment: string | null;
  sources: ParsedSource[];
  jiraKey: string | null;
  extraNotes: string[]; // anything odd worth an import_note
  /** Set on a `- `-prefixed row: the nearest preceding top-level item in this section. */
  parentRef?: ParsedItem;
  /** Lowercased bracket tag from the title ('bug', 'research', 'ios', …), if any. */
  bracketTag: string | null;
}

function flatten(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (v instanceof Date) return v.toISOString();
  if (Array.isArray(v)) return v.map((rt: { text?: string }) => rt.text ?? '').join('');
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (Array.isArray(o.richText)) return flatten(o.richText);
    if ('text' in o) return flatten(o.text);
    if (o.result != null) return flatten(o.result);
  }
  return '';
}
function cellText(cell: ExcelJS.Cell): string {
  return flatten(cell.value) || (cell.text?.toString() ?? '');
}
function cellHyperlink(cell: ExcelJS.Cell): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const direct = (cell as any).hyperlink as string | undefined;
  if (direct) return direct;
  const v = cell.value as Record<string, unknown> | undefined;
  if (v && typeof v === 'object' && typeof v.hyperlink === 'string') return v.hyperlink as string;
  return undefined;
}

type SheetKind = 'wip' | 'backlog' | 'backlogDesign' | 'done';

interface ColumnMap {
  title: number;
  ownerHm?: number;
  ownerProfico?: number;
  owner?: number;
  team?: number;
  status?: number;
  priority?: number;
  ballpark?: number;
  actualDev?: number;
  targetDate?: number;
  completedAt?: number;
  comment?: number;
}

const COLUMNS: Record<SheetKind, ColumnMap> = {
  wip: { title: 2, ownerHm: 3, ownerProfico: 4, team: 5, status: 6, ballpark: 7, actualDev: 8, targetDate: 9, completedAt: 10, comment: 11 },
  backlog: { title: 2, priority: 1, owner: 3, comment: 4 },
  backlogDesign: { title: 2, priority: 1, owner: 3, comment: 4 },
  done: { title: 2, owner: 3, team: 4, status: 5, ballpark: 6, actualDev: 7, targetDate: 8, completedAt: 9, comment: 10 },
};

function sheetKind(name: string): SheetKind {
  if (name === 'Backlog') return 'backlog';
  if (name === 'Backlog design') return 'backlogDesign';
  if (name === 'Work in Progress') return 'wip';
  return 'done';
}

function extractUrls(text: string, hyperlink: string | undefined): ParsedSource[] {
  const urls = new Set<string>();
  if (hyperlink) urls.add(hyperlink);
  for (const m of text.matchAll(URL_IN_TEXT)) urls.add(m[0].replace(/[,)]+$/, ''));
  return [...urls].map((ref) => ({ kind: ref.includes('slack.com') ? 'slack' : 'url', ref }) as ParsedSource);
}

function extractJiraKey(...texts: Array<string | undefined>): string | null {
  for (const t of texts) {
    if (!t) continue;
    const byUrl = t.match(JIRA_KEY_IN_URL);
    if (byUrl) return byUrl[1];
  }
  for (const t of texts) {
    if (!t) continue;
    const byText = t.match(JIRA_KEY_IN_TEXT);
    if (byText) return byText[1];
  }
  return null;
}

/**
 * Parses every non-hidden, non-skipped sheet in the workbook into a flat list
 * of items — Epics, Tasks/Bugs/Research, with description rows merged into
 * the preceding item and bare-URL "description" rows treated as a source
 * instead (roadmap-krav §5, steps 2–4, 8).
 */
export async function parseWorkbook(path: string): Promise<ParsedItem[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);

  const items: ParsedItem[] = [];

  for (const ws of wb.worksheets) {
    if (ws.state !== 'visible' || SKIP_SHEETS.has(ws.name)) continue;

    const kind = sheetKind(ws.name);
    const cols = COLUMNS[kind];
    const completedMonthFallback = monthFromDoneSheetName(ws.name);

    let currentType: RoadmapItemType = 'Task';
    let currentDiscipline: Discipline | null = kind === 'backlogDesign' ? 'Design' : null;
    let lastTopLevel: ParsedItem | null = null;

    for (let r = 1; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      // Header rows differ by sheet shape and must be skipped explicitly —
      // an unskipped header reads as a fake item titled "Epic" or similar.
      //   wip/done:  row 1 is the header ("Epic / big projects", "Epic / Task").
      //   backlog:   row 1 is the sheet title (col 1 only, title col blank —
      //              skipped naturally below); row 2 is the REAL header
      //              ("Prio | Epic | Owner | …").
      //   backlogDesign: row 1 doubles as sheet title + the DESIGN section
      //              marker in one row (col 2 = "DESIGN"), consumed by the
      //              SECTION_MARKERS check below — no separate header row.
      if (r === 1 && (kind === 'wip' || kind === 'done')) continue;
      if (r === 2 && kind === 'backlog') continue;

      const titleCell = row.getCell(cols.title);
      const rawTitleText = cellText(titleCell).trim();
      if (!rawTitleText) continue;

      if (SECTION_MARKERS.has(rawTitleText)) {
        // "Alt under en seksjonsrad arver type og discipline til neste
        // seksjonsrad" (roadmap-krav §5 step 2). DESIGN sets discipline only —
        // type keeps whatever the last DEVELOPMENT epic/task marker set.
        if (rawTitleText === 'DEVELOPMENT epic') {
          currentType = 'Epic';
          currentDiscipline = null;
        } else if (rawTitleText === 'DEVELOPMENT task') {
          currentType = 'Task';
          currentDiscipline = null;
        } else {
          currentDiscipline = 'Design';
        }
        continue;
      }
      if (rawTitleText === 'Backlog' || rawTitleText === 'Backlog desing') continue; // sheet-title cell, row 1

      const ownerRaw = cellText(row.getCell(cols.owner ?? cols.ownerHm ?? 0)).trim() || null;
      const teamRaw = cols.team ? cellText(row.getCell(cols.team)).trim() || null : null;
      const statusRaw = cols.status ? cellText(row.getCell(cols.status)).trim() || null : null;

      const hasStructuredData = Boolean(ownerRaw || teamRaw || statusRaw || (cols.ownerProfico && cellText(row.getCell(cols.ownerProfico)).trim()));

      // A content-less follow-up row = either a description continuation, or
      // (if it's a bare URL / "JIRA board: ...") a source on the previous item.
      if (!hasStructuredData && lastTopLevel) {
        const isBareUrl = /^https?:\/\//.test(rawTitleText) || /^JIRA board:/i.test(rawTitleText);
        if (isBareUrl) {
          const link = cellHyperlink(titleCell);
          lastTopLevel.sources.push(...extractUrls(rawTitleText, link));
        } else if (!rawTitleText.startsWith('- ')) {
          lastTopLevel.description = lastTopLevel.description
            ? `${lastTopLevel.description}\n\n${rawTitleText}`
            : rawTitleText;
        }
        if (rawTitleText.startsWith('- ')) {
          // sub-task with no other columns filled — still a real item, fall through
        } else {
          continue;
        }
      }

      const isSubtask = rawTitleText.startsWith('- ');
      const titleAfterDash = isSubtask ? rawTitleText.slice(2).trim() : rawTitleText;

      const bracketMatch = titleAfterDash.match(BRACKET);
      const tag = bracketMatch?.[1]?.toLowerCase();
      const title = bracketMatch ? titleAfterDash.slice(bracketMatch[0].length).trim() : titleAfterDash;

      let type: RoadmapItemType = currentType;
      let priorityRaw = cols.priority ? cellText(row.getCell(cols.priority)).trim() || null : null;
      const extraNotes: string[] = [];

      if (tag === 'bug') type = 'Bug';
      else if (tag === 'research') type = 'Research';
      else if (tag === 'hotfix') priorityRaw = 'Hotfix';
      else if (tag && !['ios', 'android'].includes(tag)) {
        extraNotes.push(`unhandled bracket tag: [${bracketMatch![1]}]`);
      }

      const link = cellHyperlink(titleCell);
      const commentText = cols.comment ? cellText(row.getCell(cols.comment)).trim() || null : null;
      const commentLink = cols.comment ? cellHyperlink(row.getCell(cols.comment)) : undefined;

      const sources = [...extractUrls(rawTitleText, link), ...(commentText ? extractUrls(commentText, commentLink) : [])];
      const jiraKey = extractJiraKey(link, rawTitleText, commentLink, commentText ?? undefined);

      // Row 41-style stray extra column not covered by the schema — flag, don't drop.
      if (kind === 'backlog') {
        const stray = cellText(row.getCell(5)).trim();
        if (stray) extraNotes.push(`unexpected value in column 5: "${stray}"`);
      }

      const item: ParsedItem = {
        sourceSheet: ws.name,
        sourceRow: r,
        type,
        discipline: currentDiscipline,
        rawTitle: rawTitleText,
        title: title || rawTitleText,
        description: null,
        isSubtask,
        ownerHmRaw: cols.ownerHm ? cellText(row.getCell(cols.ownerHm)).trim() || null : ownerRaw,
        ownerProficoRaw: cols.ownerProfico ? cellText(row.getCell(cols.ownerProfico)).trim() || null : null,
        teamRaw,
        statusRaw,
        priorityRaw,
        sizeRaw: cols.ballpark ? cellText(row.getCell(cols.ballpark)).trim() || null : null,
        targetDateRaw: cols.targetDate ? row.getCell(cols.targetDate).value : null,
        completedAtRaw: cols.completedAt ? row.getCell(cols.completedAt).value : null,
        completedMonthFallback,
        comment: commentText,
        sources,
        jiraKey,
        extraNotes,
        bracketTag: tag ?? null,
      };

      items.push(item);
      if (!isSubtask) lastTopLevel = item;
      else if (lastTopLevel) item.parentRef = lastTopLevel;
    }
  }

  return items;
}
