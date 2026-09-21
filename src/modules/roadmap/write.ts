/**
 * The write paths for roadmap items — create (New Epic / New Idea / New
 * Task) and update (the Epic edit page). Every write here also appends a
 * `roadmap_status_log` row (when status changes) and an `event`, matching
 * the rule in `src/core/AGENTS.md`: every mutation is logged, from day one.
 */
import { db } from '../../core/db';
import { appUser, event, roadmapItem, roadmapItemAssignee, roadmapStatusLog } from '../../core/schema';
import { eq } from 'drizzle-orm';

export interface CreateItemInput {
  type: 'Epic' | 'Task' | 'Bug' | 'Research';
  discipline?: string | null;
  title: string;
  emoji?: string | null;
  description?: string | null;
  notes?: string | null;
  area?: string | null;
  ownerId?: string | null;
  coordinatorId?: string | null;
  status: string;
  priority?: string | null;
  size?: string | null;
  targetDate?: string | null;
  jiraKey?: string | null;
  parentId?: string | null;
  assigneeIds?: string[];
  /** The signed-in JB user's email, if any — resolved to an app_user for attribution when it matches. */
  actorEmail?: string | null;
}

/** Best-effort: does this JB email match a known app_user? Most don't yet — that's fine, attribution is optional. */
async function resolveActor(email: string | null | undefined): Promise<string | null> {
  if (!email) return null;
  const [row] = await db.select({ id: appUser.id }).from(appUser).where(eq(appUser.email, email)).limit(1);
  return row?.id ?? null;
}

/**
 * There's no JournalistBoost API for listing every user (only
 * /api/auth/check-session, which validates one session — see AGENTS.md
 * "Who's logged in"), so the assignee picker can't be a live JB directory.
 * This is the practical stand-in: free-text names (comma-separated), matched
 * case-insensitively against existing `app_user` rows, and created if new.
 */
export async function resolveOrCreatePeople(freeText: string | null | undefined): Promise<string[]> {
  if (!freeText?.trim()) return [];
  const names = freeText
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean);
  if (names.length === 0) return [];

  const ids: string[] = [];
  for (const name of names) {
    const [existing] = await db.select({ id: appUser.id }).from(appUser).where(eq(appUser.name, name)).limit(1);
    if (existing) {
      ids.push(existing.id);
    } else {
      const [created] = await db.insert(appUser).values({ name }).returning({ id: appUser.id });
      ids.push(created.id);
    }
  }
  return ids;
}

export async function createRoadmapItem(input: CreateItemInput): Promise<string> {
  const actorId = await resolveActor(input.actorEmail);

  const id = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(roadmapItem)
      .values({
        type: input.type,
        discipline: input.discipline || null,
        title: input.title.trim(),
        emoji: input.emoji?.trim() || null,
        description: input.description?.trim() || null,
        notes: input.notes?.trim() || null,
        area: input.area || null,
        ownerId: input.ownerId || null,
        coordinatorId: input.coordinatorId || null,
        status: input.status,
        priority: input.priority || null,
        size: input.size || null,
        targetDate: input.targetDate || null,
        jiraKey: input.jiraKey?.trim() || null,
        parentId: input.parentId || null,
        createdBy: actorId,
      })
      .returning({ id: roadmapItem.id });

    for (const userId of input.assigneeIds ?? []) {
      await tx.insert(roadmapItemAssignee).values({ roadmapItemId: row.id, userId });
    }

    await tx.insert(roadmapStatusLog).values({
      roadmapItemId: row.id,
      fromStatus: null,
      toStatus: input.status,
      actorId,
      note: 'Created',
    });

    await tx.insert(event).values({
      actorId,
      actorKind: actorId ? 'user' : 'system',
      action: 'roadmap_item.created',
      entityType: 'roadmap_item',
      entityId: row.id,
      payload: { type: input.type, title: input.title },
    });

    return row.id;
  });

  return id;
}

export interface UpdateItemInput {
  id: string;
  title: string;
  emoji?: string | null;
  description?: string | null;
  notes?: string | null;
  area?: string | null;
  ownerId?: string | null;
  coordinatorId?: string | null;
  status: string;
  priority?: string | null;
  size?: string | null;
  targetDate?: string | null;
  jiraKey?: string | null;
  assigneeIds?: string[];
  actorEmail?: string | null;
}

/** Full edit — used by the Epic (and, later, Task) detail page. Replaces assignees wholesale; logs a status_log row only when status actually changed. */
export async function updateRoadmapItem(input: UpdateItemInput): Promise<void> {
  const actorId = await resolveActor(input.actorEmail);

  await db.transaction(async (tx) => {
    const [before] = await tx.select({ status: roadmapItem.status }).from(roadmapItem).where(eq(roadmapItem.id, input.id)).limit(1);
    if (!before) throw new Error(`roadmap_item ${input.id} not found`);

    await tx
      .update(roadmapItem)
      .set({
        title: input.title.trim(),
        emoji: input.emoji?.trim() || null,
        description: input.description?.trim() || null,
        notes: input.notes?.trim() || null,
        area: input.area || null,
        ownerId: input.ownerId || null,
        coordinatorId: input.coordinatorId || null,
        status: input.status,
        priority: input.priority || null,
        size: input.size || null,
        targetDate: input.targetDate || null,
        jiraKey: input.jiraKey?.trim() || null,
        completedAt: input.status === 'Delivered' || input.status === 'Ferdig - arkivert' ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(roadmapItem.id, input.id));

    await tx.delete(roadmapItemAssignee).where(eq(roadmapItemAssignee.roadmapItemId, input.id));
    for (const userId of input.assigneeIds ?? []) {
      await tx.insert(roadmapItemAssignee).values({ roadmapItemId: input.id, userId });
    }

    if (before.status !== input.status) {
      await tx.insert(roadmapStatusLog).values({
        roadmapItemId: input.id,
        fromStatus: before.status,
        toStatus: input.status,
        actorId,
        note: 'Edited',
      });
    }

    await tx.insert(event).values({
      actorId,
      actorKind: actorId ? 'user' : 'system',
      action: 'roadmap_item.updated',
      entityType: 'roadmap_item',
      entityId: input.id,
      payload: { title: input.title, statusChanged: before.status !== input.status },
    });
  });
}

/** Quick one-field status change — the "Start" button on an Epic card. No modal, one click. */
export async function setItemStatus(id: string, status: string, actorEmail?: string | null): Promise<void> {
  const actorId = await resolveActor(actorEmail);
  await db.transaction(async (tx) => {
    const [before] = await tx.select({ status: roadmapItem.status }).from(roadmapItem).where(eq(roadmapItem.id, id)).limit(1);
    if (!before) throw new Error(`roadmap_item ${id} not found`);

    await tx
      .update(roadmapItem)
      .set({
        status,
        completedAt: status === 'Delivered' || status === 'Ferdig - arkivert' ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(roadmapItem.id, id));

    await tx.insert(roadmapStatusLog).values({ roadmapItemId: id, fromStatus: before.status, toStatus: status, actorId, note: 'Quick action' });
    await tx.insert(event).values({
      actorId,
      actorKind: actorId ? 'user' : 'system',
      action: 'roadmap_item.status_changed',
      entityType: 'roadmap_item',
      entityId: id,
      payload: { from: before.status, to: status },
    });
  });
}
