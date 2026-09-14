/**
 * Read queries for the roadmap views. All server-side, all real data — no
 * fixtures. Kept separate from the pages so the pages stay thin.
 */
import { aliasedTable, and, desc, eq, inArray, ne, sql, type SQL } from 'drizzle-orm';
import { db } from '../../../core/db';
import { appUser, roadmapItem, roadmapItemAssignee, roadmapStatusLog } from '../../../core/schema';

const owner = aliasedTable(appUser, 'owner');
const coordinator = aliasedTable(appUser, 'coordinator');

export interface ItemRow {
  id: string;
  type: string;
  title: string;
  area: string | null;
  status: string;
  jiraSubstatus: string | null;
  jiraKey: string | null;
  priority: string | null;
  size: string | null;
  backlogged: boolean;
  parentId: string | null;
  ownerName: string | null;
  coordinatorName: string | null;
  updatedAt: Date;
  completedAt: Date | null;
}

const baseSelect = {
  id: roadmapItem.id,
  type: roadmapItem.type,
  title: roadmapItem.title,
  area: roadmapItem.area,
  status: roadmapItem.status,
  jiraSubstatus: roadmapItem.jiraSubstatus,
  jiraKey: roadmapItem.jiraKey,
  priority: roadmapItem.priority,
  size: roadmapItem.size,
  backlogged: roadmapItem.backlogged,
  parentId: roadmapItem.parentId,
  ownerName: owner.name,
  coordinatorName: coordinator.name,
  updatedAt: roadmapItem.updatedAt,
  completedAt: roadmapItem.completedAt,
};

/**
 * Every list query joins the same two owner/coordinator aliases the same
 * way — factored out as a where-clause parameter instead of a builder
 * helper, since Drizzle's fluent types don't survive being passed through an
 * intermediate function.
 */
async function selectItems(where: SQL | undefined) {
  return db
    .select(baseSelect)
    .from(roadmapItem)
    .leftJoin(owner, eq(roadmapItem.ownerId, owner.id))
    .leftJoin(coordinator, eq(roadmapItem.coordinatorId, coordinator.id))
    .where(where)
    .orderBy(desc(roadmapItem.updatedAt));
}

/** Assignee names for a batch of items, grouped by item id — one extra query, not N. */
export async function getAssigneesByItemIds(ids: string[]): Promise<Map<string, string[]>> {
  if (ids.length === 0) return new Map();
  const rows = await db
    .select({ itemId: roadmapItemAssignee.roadmapItemId, name: appUser.name })
    .from(roadmapItemAssignee)
    .innerJoin(appUser, eq(roadmapItemAssignee.userId, appUser.id))
    .where(inArray(roadmapItemAssignee.roadmapItemId, ids));
  const map = new Map<string, string[]>();
  for (const r of rows) {
    const list = map.get(r.itemId) ?? [];
    list.push(r.name);
    map.set(r.itemId, list);
  }
  return map;
}

/**
 * "All items" board — Task/Bug/Research only, mirrors feltkatalog §5c: Neste /
 * Påbegynt / Code review & testing / Done. Excludes Idea/Under
 * review/Prioritized (those live in the Idea bank / Backlog views) and
 * Declined (the prototype itself hides it from this board — feltkatalog §0).
 */
export async function getBoardItems(): Promise<ItemRow[]> {
  return selectItems(and(ne(roadmapItem.type, 'Epic'), inArray(roadmapItem.status, ['In Jira', 'Delivered'])));
}

export interface EpicRow extends ItemRow {
  description: string | null;
  totalChildren: number;
  deliveredChildren: number;
}

/** Epics with a computed progress bar — N of M child Task/Bug/Research delivered. */
export async function getEpics(): Promise<EpicRow[]> {
  const rows = await db
    .select({ ...baseSelect, description: roadmapItem.description })
    .from(roadmapItem)
    .leftJoin(owner, eq(roadmapItem.ownerId, owner.id))
    .leftJoin(coordinator, eq(roadmapItem.coordinatorId, coordinator.id))
    .where(eq(roadmapItem.type, 'Epic'))
    .orderBy(roadmapItem.title);

  const epicIds = rows.map((r) => r.id);
  if (epicIds.length === 0) return [];

  const childCounts = await db
    .select({
      parentId: roadmapItem.parentId,
      total: sql<number>`count(*)`.as('total'),
      delivered: sql<number>`count(*) filter (where ${roadmapItem.status} = 'Delivered')`.as('delivered'),
    })
    .from(roadmapItem)
    .where(inArray(roadmapItem.parentId, epicIds))
    .groupBy(roadmapItem.parentId);

  const byParent = new Map(childCounts.map((c) => [c.parentId as string, c]));
  return rows.map((r) => ({
    ...r,
    totalChildren: Number(byParent.get(r.id)?.total ?? 0),
    deliveredChildren: Number(byParent.get(r.id)?.delivered ?? 0),
  }));
}

/** Idea bank — status Idea / Under review / Prioritized, not yet in Jira. */
export async function getIdeaBankItems(): Promise<ItemRow[]> {
  return selectItems(and(ne(roadmapItem.type, 'Epic'), inArray(roadmapItem.status, ['Idea', 'Under review', 'Prioritized'])));
}

/** Backlog — in Jira, but not yet picked ("Move to Neste" not clicked). feltkatalog §5b. */
export async function getBacklogItems(): Promise<ItemRow[]> {
  return selectItems(and(eq(roadmapItem.backlogged, true), eq(roadmapItem.status, 'In Jira')));
}

/** Items owned/coordinated by a name — "For deg" (feltkatalog §7). */
export async function getItemsForPerson(name: string): Promise<ItemRow[]> {
  const rows = await selectItems(undefined);
  return rows.filter((r) => r.ownerName === name || r.coordinatorName === name);
}

export interface LogRow {
  id: number;
  itemId: string;
  itemTitle: string;
  itemType: string;
  toStatus: string | null;
  toSubstatus: string | null;
  note: string | null;
  at: Date;
}

/** Recent status-log entries across every item — the "Logg" view (feltkatalog §7). Capped for MVP speed. */
export async function getRecentLog(limit = 200): Promise<LogRow[]> {
  return db
    .select({
      id: roadmapStatusLog.id,
      itemId: roadmapStatusLog.roadmapItemId,
      itemTitle: roadmapItem.title,
      itemType: roadmapItem.type,
      toStatus: roadmapStatusLog.toStatus,
      toSubstatus: roadmapStatusLog.toSubstatus,
      note: roadmapStatusLog.note,
      at: roadmapStatusLog.at,
    })
    .from(roadmapStatusLog)
    .innerJoin(roadmapItem, eq(roadmapStatusLog.roadmapItemId, roadmapItem.id))
    .orderBy(desc(roadmapStatusLog.at))
    .limit(limit);
}

export async function getItemCount(): Promise<{ total: number; epics: number }> {
  const [row] = await db
    .select({
      total: sql<number>`count(*) filter (where ${roadmapItem.type} != 'Epic')`,
      epics: sql<number>`count(*) filter (where ${roadmapItem.type} = 'Epic')`,
    })
    .from(roadmapItem);
  return { total: Number(row.total), epics: Number(row.epics) };
}
