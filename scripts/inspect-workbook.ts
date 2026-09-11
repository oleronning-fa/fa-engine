/**
 * `pnpm exec tsx scripts/inspect-workbook.ts <path.xlsx> [sheetName] [maxRows]`
 *
 * Structural peek at an .xlsx source file before/while writing importer code.
 * With no sheet name: lists every sheet, visibility, dimensions, and a 4-row
 * header preview (hyperlinks included — cell.text alone misses Jira keys that
 * live only in the link, roadmap-krav §5 step 8).
 *
 * With a sheet name: dumps every NON-EMPTY row of that sheet (ExcelJS'
 * `rowCount` counts trailing formatted-but-blank rows too, so this filters
 * those out) up to `maxRows` (default 400). Read-only, never writes anything.
 */
import ExcelJS from 'exceljs';

const path = process.argv[2];
const sheetName = process.argv[3];
const maxRows = Number(process.argv[4] ?? 400);
if (!path) {
  console.error('usage: tsx scripts/inspect-workbook.ts <path.xlsx> [sheetName] [maxRows]');
  process.exit(1);
}

/**
 * Flattens exceljs' various cell.value shapes to plain text. Handles the
 * nested case a "Comment" column with a pasted Slack link produces: a
 * hyperlink cell whose `.text` is itself rich text, not a plain string.
 */
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
    if (o.result != null) return flatten(o.result); // formula
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

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);

  if (!sheetName) {
    console.log(`=== ${path} ===`);
    console.log(`${wb.worksheets.length} worksheets\n`);
    for (const ws of wb.worksheets) {
      console.log(`--- "${ws.name}" (state=${ws.state}, rows=${ws.rowCount}, cols=${ws.columnCount}) ---`);
      for (let r = 1; r <= Math.min(4, ws.rowCount); r++) {
        const row = ws.getRow(r);
        const cells: string[] = [];
        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          const link = cellHyperlink(cell);
          cells.push(`[${colNumber}]${cellText(cell).slice(0, 45)}${link ? ` ↗${link.slice(0, 55)}` : ''}`);
        });
        console.log(`  row ${r}: ${cells.join(' | ')}`);
      }
      console.log();
    }
    return;
  }

  const ws = wb.getWorksheet(sheetName);
  if (!ws) {
    console.error(`sheet "${sheetName}" not found. Sheets: ${wb.worksheets.map((w) => w.name).join(', ')}`);
    process.exit(1);
  }

  console.log(`=== "${ws.name}" — non-empty rows (of ${ws.rowCount} total) ===\n`);
  let shown = 0;
  for (let r = 1; r <= ws.rowCount && shown < maxRows; r++) {
    const row = ws.getRow(r);
    const cells: string[] = [];
    let hasContent = false;
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const text = cellText(cell).trim();
      const link = cellHyperlink(cell);
      if (text || link) hasContent = true;
      if (text || link) cells.push(`[${colNumber}]${text}${link ? ` ↗${link}` : ''}`);
    });
    if (!hasContent) continue;
    shown++;
    console.log(`row ${r}: ${cells.join(' | ')}`);
  }
  console.log(`\n(shown ${shown} non-empty rows)`);
}

main();
