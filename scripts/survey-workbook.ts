/**
 * `pnpm exec tsx scripts/survey-workbook.ts <path.xlsx>`
 *
 * One-off survey pass, read-only: per-sheet content-row counts, section
 * marker positions, and every distinct name found in an owner/team column —
 * the raw material for the `person_alias` table (roadmap-krav §5 step 5).
 * Doesn't write anything, doesn't guess at identities.
 */
import ExcelJS from 'exceljs';

const path = process.argv[2];
if (!path) {
  console.error('usage: tsx scripts/survey-workbook.ts <path.xlsx>');
  process.exit(1);
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

const SECTION_MARKERS = new Set(['DEVELOPMENT epic', 'DEVELOPMENT task', 'DESIGN']);
const SKIP_SHEETS = new Set(['Oslo trip', 'Sheet3']);

/** Splits "Marina / (Magnus)", "Kula/Andrej", "Andrija, Carlo" into individual names. */
function splitNames(raw: string): string[] {
  return raw
    .split(/[,/]/)
    .map((s) => s.replace(/[()]/g, '').trim())
    .filter(Boolean);
}

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);

  const nameColsBySheetKind = {
    wip: [3, 4, 5], // Owner HM, Owner Profico, Team
    backlog: [3], // Owner
    done: [3, 4], // Owner, Team
    backlogDesign: [3], // Owner
  };

  const names = new Map<string, number>(); // name -> occurrence count
  let totalContentRows = 0;
  let bracketPrefixed = 0;
  let hyperlinkedTitles = 0;
  let lineRefs = 0;
  const sheetSummaries: string[] = [];

  for (const ws of wb.worksheets) {
    if (ws.state !== 'visible' || SKIP_SHEETS.has(ws.name)) continue;

    const kind: keyof typeof nameColsBySheetKind = ws.name === 'Backlog'
      ? 'backlog'
      : ws.name === 'Backlog design'
        ? 'backlogDesign'
        : ws.name === 'Work in Progress'
          ? 'wip'
          : 'done';
    const nameCols = nameColsBySheetKind[kind];
    const titleCol = kind === 'backlog' || kind === 'backlogDesign' ? 2 : 2;

    let sheetContentRows = 0;
    let sheetSections = 0;

    for (let r = 1; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const titleCell = row.getCell(titleCol);
      const title = cellText(titleCell).trim();
      if (!title) continue;
      if (SECTION_MARKERS.has(title)) {
        sheetSections++;
        continue;
      }
      if (r === 1) continue; // header row

      sheetContentRows++;
      totalContentRows++;

      if (/^\[[a-zA-Z]+\]/.test(title)) bracketPrefixed++;
      if (cellHyperlink(titleCell)) hyperlinkedTitles++;
      if (/\bLine\s+\d+\b/i.test(title)) lineRefs++;

      for (const col of nameCols) {
        const raw = cellText(row.getCell(col)).trim();
        if (!raw) continue;
        for (const name of splitNames(raw)) {
          names.set(name, (names.get(name) ?? 0) + 1);
        }
      }
    }

    sheetSummaries.push(`  ${ws.name.padEnd(20)} ${String(sheetContentRows).padStart(4)} content rows, ${sheetSections} section markers`);
  }

  console.log(`=== ${path} ===\n`);
  console.log('Per sheet:');
  console.log(sheetSummaries.join('\n'));
  console.log(`\nTotal content rows (excl. section markers, headers, hidden sheets): ${totalContentRows}`);
  console.log(`Bracket-prefixed titles ([bug], [research], …): ${bracketPrefixed}`);
  console.log(`Titles carrying a hyperlink directly: ${hyperlinkedTitles}`);
  console.log(`"Line N" cross-references (fragile, need manual resolution): ${lineRefs}`);

  console.log(`\n${names.size} distinct names across all owner/team columns, by occurrence:\n`);
  const sorted = [...names.entries()].sort((a, b) => b[1] - a[1]);
  for (const [name, count] of sorted) {
    console.log(`  ${String(count).padStart(3)}×  ${name}`);
  }
}

main();
