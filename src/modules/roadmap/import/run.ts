import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { Database } from '../../../core/db';
import { event, importNote, personAlias, roadmapItem, roadmapItemAssignee, roadmapSource, roadmapStatusLog } from '../../../core/schema';
import { appUser } from '../../../core/schema/user';
import { isAreaId } from '../../../core/codesets';
import { matchArea } from './areas';
import { parseDateValue } from './dates';
import { mapEpicStatus, mapTaskStatus } from './map-status';
import { CANONICAL_PEOPLE, IGNORED_NAME_VALUES, resolveCanonicalPerson } from './people';
import { parseWorkbook, type ParsedItem } from './parse-workbook';

export interface ImportOptions {
  path: string;
  write: boolean;
}

interface PlannedNote {
  sourceRef: string;
  issue: string;
  detail: string;
}

interface PlannedItem {
  parsed: ParsedItem;
  type: ParsedItem['type'];
  status: string;
  jiraSubstatus: string | null;
  declinedReason: string | null;
  area: string | null;
  ownerId: string | null;
  coordinatorId: string | null;
  assigneeIds: string[];
  targetDate: string | null;
  targetWeek: string | null;
  completedAt: string | null;
  notes: PlannedNote[];
}

function splitNames(raw: string): string[] {
  return raw.split(/[,/]/).map((s) => s.replace(/[()]/g, '').trim()).filter(Boolean);
}

/** Ensures every canonical person + alias exists in the DB. Returns name -> app_user.id. */
async function ensurePeople(db: Database): Promise<Map<string, string>> {
  const byName = new Map<string, string>();
  for (const p of CANONICAL_PEOPLE) {
    const existing = await db.select().from(appUser).where(eq(appUser.name, p.name)).limit(1);
    let id: string;
    if (existing.length) {
      id = existing[0].id;
      if (p.email && !existing[0].email) {
        await db.update(appUser).set({ email: p.email }).where(eq(appUser.id, id));
      }
    } else {
      const [row] = await db.insert(appUser).values({ name: p.name, email: p.email ?? null }).returning({ id: appUser.id });
      id = row.id;
    }
    byName.set(p.name, id);

    for (const alias of p.aliases) {
      const existingAlias = await db.select().from(personAlias).where(eq(personAlias.alias, alias)).limit(1);
      if (!existingAlias.length) {
        await db.insert(personAlias).values({ alias, canonicalUserId: id });
      }
    }
  }
  return byName;
}

/** Resolves a raw owner/team name to an app_user id, tracking anything unrecognised. */
function resolveUserId(raw: string | null, byName: Map<string, string>, unresolved: Set<string>): string | null {
  if (!raw) return null;
  const canonical = resolveCanonicalPerson(raw);
  if (canonical) return byName.get(canonical.name) ?? null;
  if (!IGNORED_NAME_VALUES.has(raw)) unresolved.add(raw);
  return null;
}

function planItem(item: ParsedItem, byName: Map<string, string>, unresolvedNames: Set<string>): PlannedItem {
  const notes: PlannedNote[] = [];
  const sourceRef = `${item.sourceSheet}:${item.sourceRow}`;

  // Area: title keywords first, falling back to a bracket tag like [Pagespeed] or [iOS].
  // Required on Task/Bug/Research; optional on Epic (an epic can span several
  // areas — feltkatalog §2 — so an empty one there isn't a review item).
  let area = matchArea(item.title, item.bracketTag);
  if (area && !isAreaId(area)) area = null; // defensive; matchArea only returns valid ids anyway
  if (!area && item.type !== 'Epic') {
    notes.push({ sourceRef, issue: 'area_unresolved', detail: `no keyword match for "${item.title}"` });
  }

  for (const n of item.extraNotes) notes.push({ sourceRef, issue: 'parser_flag', detail: n });

  // Status
  let status: string;
  let jiraSubstatus: string | null = null;
  let declinedReason: string | null = null;
  if (item.type === 'Epic') {
    const m = mapEpicStatus(item.statusRaw);
    status = m.status;
    if (m.note) notes.push({ sourceRef, issue: 'status_guessed', detail: m.note });
  } else {
    const m = mapTaskStatus(item);
    status = m.status;
    jiraSubstatus = m.jiraSubstatus;
    declinedReason = m.declinedReason;
    if (m.note) notes.push({ sourceRef, issue: 'status_guessed', detail: m.note });
  }

  // Dates
  const target = parseDateValue(item.targetDateRaw);
  let targetDate: string | null = null;
  let targetWeek: string | null = null;
  if (target.kind === 'date') targetDate = target.date;
  else if (target.kind === 'week') targetWeek = target.targetWeek;
  else if (target.kind === 'unparsed') notes.push({ sourceRef, issue: 'date_unparsed', detail: `target date "${target.raw}"` });

  let completedAt: string | null = null;
  if (status === 'Delivered' || status === 'Ferdig - arkivert') {
    const completed = parseDateValue(item.completedAtRaw);
    if (completed.kind === 'date') completedAt = completed.date;
    else if (item.completedMonthFallback) {
      const { month, year } = item.completedMonthFallback;
      completedAt = `${year}-${String(month).padStart(2, '0')}-01`;
      notes.push({ sourceRef, issue: 'completed_at_approximate', detail: `no Final Delivery Date — used the 1st of the sheet's month (${year}-${String(month).padStart(2, '0')})` });
    } else if (completed.kind === 'unparsed') {
      notes.push({ sourceRef, issue: 'date_unparsed', detail: `final delivery date "${completed.raw}"` });
    }
  }

  // People. wip sheets have real owner/coordinator columns; backlog/backlogDesign/done
  // sheets have one "Owner" column that roadmap-krav §2 identifies as the COORDINATOR
  // role (Marina on ~245/330 historical rows) — never the Hegnar Media owner.
  const isWip = item.sourceSheet === 'Work in Progress';
  const ownerId = isWip ? resolveUserId(item.ownerHmRaw, byName, unresolvedNames) : null;
  const coordinatorId = isWip
    ? resolveUserId(item.ownerProficoRaw, byName, unresolvedNames)
    : resolveUserId(item.ownerHmRaw, byName, unresolvedNames);

  const assigneeIds = new Set<string>();
  if (item.teamRaw) {
    for (const name of splitNames(item.teamRaw)) {
      const id = resolveUserId(name, byName, unresolvedNames);
      if (id) assigneeIds.add(id);
    }
  }

  const backlogged = (item.sourceSheet === 'Backlog' || item.sourceSheet === 'Backlog design') && Boolean(item.jiraKey);

  return {
    parsed: item,
    type: item.type,
    status,
    jiraSubstatus,
    declinedReason,
    area,
    ownerId,
    coordinatorId,
    assigneeIds: [...assigneeIds],
    targetDate,
    targetWeek,
    completedAt,
    notes,
  };
}

export interface ImportSummary {
  runId: string;
  totalItems: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  unresolvedAreaCount: number;
  unresolvedNames: string[];
  notesCount: number;
  sampleNotes: PlannedNote[];
  written: boolean;
}

export async function runImport(db: Database, opts: ImportOptions): Promise<ImportSummary> {
  const runId = `${new Date().toISOString().slice(0, 19)}-${randomUUID().slice(0, 8)}`;
  const items = await parseWorkbook(opts.path);

  const byName = await ensurePeople(db);
  const unresolvedNames = new Set<string>();

  const planned = items.map((item) => planItem(item, byName, unresolvedNames));

  const byType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const allNotes: PlannedNote[] = [];
  for (const p of planned) {
    byType[p.type] = (byType[p.type] ?? 0) + 1;
    byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
    allNotes.push(...p.notes);
  }

  if (opts.write) {
    await db.transaction(async (tx) => {
      const idByParsed = new Map<ParsedItem, string>();

      const insertOne = async (p: PlannedItem, parentId: string | null) => {
        const [row] = await tx
          .insert(roadmapItem)
          .values({
            type: p.type,
            discipline: p.parsed.discipline,
            title: p.parsed.title,
            rawTitle: p.parsed.rawTitle,
            description: p.parsed.description,
            area: p.area,
            ownerId: p.ownerId,
            coordinatorId: p.coordinatorId,
            status: p.status,
            jiraSubstatus: p.jiraSubstatus,
            declinedReason: p.declinedReason,
            jiraKey: p.parsed.jiraKey,
            backlogged: (p.parsed.sourceSheet === 'Backlog' || p.parsed.sourceSheet === 'Backlog design') && Boolean(p.parsed.jiraKey),
            priority: p.parsed.priorityRaw,
            size: p.parsed.sizeRaw,
            targetDate: p.targetDate,
            targetWeek: p.targetWeek,
            completedAt: p.completedAt ? new Date(p.completedAt) : null,
            parentId,
          })
          .returning({ id: roadmapItem.id });

        idByParsed.set(p.parsed, row.id);

        for (const assigneeId of p.assigneeIds) {
          await tx.insert(roadmapItemAssignee).values({ roadmapItemId: row.id, userId: assigneeId });
        }
        for (const src of p.parsed.sources) {
          await tx.insert(roadmapSource).values({ roadmapItemId: row.id, kind: src.kind, ref: src.ref });
        }
        await tx.insert(roadmapStatusLog).values({
          roadmapItemId: row.id,
          fromStatus: null,
          toStatus: p.status,
          toSubstatus: p.jiraSubstatus,
          note: `Imported from ${p.parsed.sourceSheet}:${p.parsed.sourceRow}`,
        });
        await tx.insert(event).values({
          actorKind: 'import',
          action: 'roadmap_item.imported',
          entityType: 'roadmap_item',
          entityId: row.id,
          payload: { runId, sourceSheet: p.parsed.sourceSheet, sourceRow: p.parsed.sourceRow },
        });
        for (const note of p.notes) {
          await tx.insert(importNote).values({ runId, sourceRef: note.sourceRef, issue: note.issue, raw: { detail: note.detail, title: p.parsed.title } });
        }
      };

      // Pass 1: everything that isn't a sub-task.
      for (const p of planned) {
        if (!p.parsed.isSubtask) await insertOne(p, null);
      }
      // Pass 2: sub-tasks, now that their parent has a real id.
      for (const p of planned) {
        if (p.parsed.isSubtask) {
          const parentId = p.parsed.parentRef ? (idByParsed.get(p.parsed.parentRef) ?? null) : null;
          await insertOne(p, parentId);
        }
      }

      for (const name of unresolvedNames) {
        await tx.insert(importNote).values({ runId, sourceRef: null, issue: 'name_unresolved', raw: { name } });
      }
    });
  }

  return {
    runId,
    totalItems: items.length,
    byType,
    byStatus,
    unresolvedAreaCount: allNotes.filter((n) => n.issue === 'area_unresolved').length,
    unresolvedNames: [...unresolvedNames],
    notesCount: allNotes.length,
    sampleNotes: allNotes.slice(0, 25),
    written: opts.write,
  };
}
