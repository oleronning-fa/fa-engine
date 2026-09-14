/**
 * The one write path for creating a roadmap item — used by the New Epic /
 * New Idea / New Task forms (all three ultimately create a `roadmap_item`
 * row, just with different defaults). Every write here also appends a
 * `roadmap_status_log` row and an `event`, matching the rule in
 * `src/core/AGENTS.md`: every mutation is logged, from day one.
 */
import { db } from '../../core/db';
import { appUser, event, roadmapItem, roadmapItemAssignee, roadmapStatusLog } from '../../core/schema';
import { eq } from 'drizzle-orm';

export interface CreateItemInput {
  type: 'Epic' | 'Task' | 'Bug' | 'Research';
  discipline?: string | null;
  title: string;
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

export async function createRoadmapItem(input: CreateItemInput): Promise<string> {
  const actorId = await resolveActor(input.actorEmail);

  const id = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(roadmapItem)
      .values({
        type: input.type,
        discipline: input.discipline || null,
        title: input.title.trim(),
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
