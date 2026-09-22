/**
 * The write paths for roadmap items — create (New Epic / New Idea / New
 * Task) and update (the Epic edit page). Every write here also appends a
 * `roadmap_status_log` row (when status changes) and an `event`, matching
 * the rule in `src/core/AGENTS.md`: every mutation is logged, from day one.
 */
import { db } from '../../core/db';
import { appUser, event, roadmapComment, roadmapItem, roadmapItemAssignee, roadmapStatusLog } from '../../core/schema';
import { eq } from 'drizzle-orm';
import { mapSubstatus, type JiraSnapshot } from '../../core/jira';

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

/**
 * "Remove" on an Epic card (OC, 21 Sep) — hides it from /epics. A soft
 * delete, not a real one: nothing is dropped, nothing cascades, and it can
 * be brought back by clearing `archived_at` directly. Deliberately not a
 * hard DELETE — that would cascade away the item's status log, sources,
 * comments and assignee links, per the schema's onDelete: 'cascade'.
 */
export async function archiveRoadmapItem(id: string, actorEmail?: string | null): Promise<void> {
  const actorId = await resolveActor(actorEmail);
  await db.transaction(async (tx) => {
    await tx.update(roadmapItem).set({ archivedAt: new Date(), updatedAt: new Date() }).where(eq(roadmapItem.id, id));
    await tx.insert(event).values({
      actorId,
      actorKind: actorId ? 'user' : 'system',
      action: 'roadmap_item.archived',
      entityType: 'roadmap_item',
      entityId: id,
      payload: {},
    });
  });
}

export type JiraSyncAction = 'delivered' | 'updated' | 'unchanged' | 'skipped_subtask';

export interface JiraSyncResult {
  action: JiraSyncAction;
  fromStatus: string;
  toStatus: string;
  fromSubstatus: string | null;
  toSubstatus: string | null;
}

/**
 * Applies one Jira snapshot to one item. Never called for an item whose
 * local status is already 'Delivered' or 'Declined' — the caller selects
 * only 'In Jira' candidates (feltkatalog §0: those are the ones actually
 * mirrored). A subtask is skipped outright, never applied.
 */
export async function applyJiraSnapshot(itemId: string, snapshot: JiraSnapshot, actorEmail?: string | null): Promise<JiraSyncResult> {
  if (snapshot.isSubtask) {
    return { action: 'skipped_subtask', fromStatus: 'In Jira', toStatus: 'In Jira', fromSubstatus: null, toSubstatus: null };
  }

  const actorId = await resolveActor(actorEmail);

  return db.transaction(async (tx) => {
    const [before] = await tx
      .select({ status: roadmapItem.status, jiraSubstatus: roadmapItem.jiraSubstatus })
      .from(roadmapItem)
      .where(eq(roadmapItem.id, itemId))
      .limit(1);
    if (!before) throw new Error(`roadmap_item ${itemId} not found`);

    const toStatus = snapshot.resolutionDate ? 'Delivered' : 'In Jira';
    const toSubstatus = snapshot.resolutionDate ? null : mapSubstatus(snapshot.statusName);
    // Real work has demonstrably started (or finished) in Jira — no longer
    // "attached but not picked", so it leaves Backlog on its own (OC, 21 Sep:
    // a started task should land under Påbegynt automatically, not need a
    // separate "Move to Neste" click once Jira already shows progress).
    const isRealProgress = toStatus === 'Delivered' || ['In progress', 'CR', 'FT', 'On QA'].includes(toSubstatus ?? '');
    const changed = before.status !== toStatus || before.jiraSubstatus !== toSubstatus;

    if (!changed) {
      return { action: 'unchanged', fromStatus: before.status, toStatus, fromSubstatus: before.jiraSubstatus, toSubstatus };
    }

    await tx
      .update(roadmapItem)
      .set({
        status: toStatus,
        jiraSubstatus: toSubstatus,
        backlogged: isRealProgress ? false : undefined,
        completedAt: toStatus === 'Delivered' ? new Date(snapshot.resolutionDate as string) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(roadmapItem.id, itemId));

    await tx.insert(roadmapStatusLog).values({
      roadmapItemId: itemId,
      fromStatus: before.status,
      toStatus,
      fromSubstatus: before.jiraSubstatus,
      toSubstatus,
      actorId,
      note: `Jira sync: ${snapshot.key} → ${snapshot.statusName}`,
    });

    await tx.insert(event).values({
      actorId,
      actorKind: actorId ? 'user' : 'system',
      action: 'roadmap_item.jira_synced',
      entityType: 'roadmap_item',
      entityId: itemId,
      payload: { key: snapshot.key, jiraStatus: snapshot.statusName, resolutionDate: snapshot.resolutionDate, assignee: snapshot.assigneeName },
    });

    return {
      action: toStatus === 'Delivered' ? 'delivered' : 'updated',
      fromStatus: before.status,
      toStatus,
      fromSubstatus: before.jiraSubstatus,
      toSubstatus,
    };
  });
}

/**
 * "⚡ Attach Jira key" — the manual way to bring a task in, without waiting
 * for the background sync (OC, 21 Sep). Moves the item to status 'In Jira',
 * backlogged (feltkatalog §5a — a key alone doesn't mean picked up yet).
 *
 * `snapshot` is optional: pass one (already fetched by the caller) to
 * reconcile to Jira's *real* current state in the same step, rather than
 * showing a stale "just attached" moment until the next scheduled sync —
 * e.g. attaching a key for an issue that's already resolved should land
 * directly on Delivered, not sit in Backlog first.
 */
export async function attachJiraKey(itemId: string, jiraKey: string, snapshot: JiraSnapshot | null, actorEmail?: string | null): Promise<void> {
  const actorId = await resolveActor(actorEmail);

  await db.transaction(async (tx) => {
    const [before] = await tx.select({ status: roadmapItem.status }).from(roadmapItem).where(eq(roadmapItem.id, itemId)).limit(1);
    if (!before) throw new Error(`roadmap_item ${itemId} not found`);

    await tx
      .update(roadmapItem)
      .set({ jiraKey: jiraKey.trim(), status: 'In Jira', jiraSubstatus: 'Todo', backlogged: true, updatedAt: new Date() })
      .where(eq(roadmapItem.id, itemId));

    await tx.insert(roadmapStatusLog).values({
      roadmapItemId: itemId,
      fromStatus: before.status,
      toStatus: 'In Jira',
      actorId,
      note: `Attached Jira key ${jiraKey}`,
    });
    await tx.insert(event).values({
      actorId,
      actorKind: actorId ? 'user' : 'system',
      action: 'roadmap_item.jira_attached',
      entityType: 'roadmap_item',
      entityId: itemId,
      payload: { jiraKey },
    });
  });

  if (snapshot) {
    await applyJiraSnapshot(itemId, snapshot, actorEmail);
  }
}

/**
 * A progress note on an Epic — comments[] in feltkatalog §2, distinct from
 * roadmap_status_log (the system's own automatic entries). `authorId` is
 * picked from a select on the form, not resolved from a session — there's no
 * per-person login yet (root AGENTS.md's real-auth step is still open), and
 * `roadmap_comment.author_id` is NOT NULL, so a comment always names a real
 * person on purpose.
 */
export async function addComment(itemId: string, authorId: string, body: string): Promise<void> {
  const trimmed = body.trim();
  if (!trimmed) throw new Error('Comment body is empty');

  await db.transaction(async (tx) => {
    await tx.insert(roadmapComment).values({ roadmapItemId: itemId, authorId, body: trimmed });
    await tx.insert(event).values({
      actorId: authorId,
      actorKind: 'user',
      action: 'roadmap_item.commented',
      entityType: 'roadmap_item',
      entityId: itemId,
      payload: {},
    });
  });
}
