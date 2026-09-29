/**
 * The write paths for roadmap items — create (New Epic / New Idea / New
 * Task) and update (the Epic edit page). Every write here also appends a
 * `roadmap_status_log` row (when status changes) and an `event`, matching
 * the rule in `src/core/AGENTS.md`: every mutation is logged, from day one.
 */
import { db } from '../../core/db';
import {
  appUser,
  event,
  roadmapAttachment,
  roadmapComment,
  roadmapItem,
  roadmapItemAssignee,
  roadmapStatusLog,
} from '../../core/schema';
import { desc, eq, sql } from 'drizzle-orm';
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
  /** Epic only — one of `EPIC_LABEL_COLORS`. */
  colorLabel?: string | null;
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
 * "Who's logged in"), so pickers like assignees and Epic owner can't be a
 * live JB directory. This is the practical stand-in: a free-text name,
 * matched case-insensitively against existing `app_user` rows, and created
 * if new.
 */
async function resolveOrCreatePersonId(name: string): Promise<string> {
  const [existing] = await db.select({ id: appUser.id }).from(appUser).where(eq(appUser.name, name)).limit(1);
  if (existing) return existing.id;
  const [created] = await db.insert(appUser).values({ name }).returning({ id: appUser.id });
  return created.id;
}

/** Comma-separated names (assignees' "New person?" field) — one id per name. */
export async function resolveOrCreatePeople(freeText: string | null | undefined): Promise<string[]> {
  if (!freeText?.trim()) return [];
  const names = freeText
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean);
  return Promise.all(names.map(resolveOrCreatePersonId));
}

/** One name (the Epic "Owner" field) — null when left blank. */
export async function resolveOrCreateOwner(name: string | null | undefined): Promise<string | null> {
  const trimmed = name?.trim();
  return trimmed ? resolveOrCreatePersonId(trimmed) : null;
}

export interface JiraUserRef {
  accountId: string;
  displayName: string;
  email: string | null;
}

/**
 * A person picked from the Jira search box on Team (OC, 29 Sep) — real Jira
 * identities, not free text. Three cases, checked in order: (1) already
 * linked to this exact Jira account, (2) an existing app_user with a
 * matching email that just hasn't been linked yet (linked now, not
 * duplicated), (3) genuinely new — created with the link already set.
 */
export async function resolveOrCreateFromJiraUser(user: JiraUserRef): Promise<string> {
  const [byJira] = await db.select({ id: appUser.id }).from(appUser).where(eq(appUser.jiraAccountId, user.accountId)).limit(1);
  if (byJira) return byJira.id;

  if (user.email) {
    const [byEmail] = await db.select({ id: appUser.id }).from(appUser).where(eq(appUser.email, user.email)).limit(1);
    if (byEmail) {
      await db.update(appUser).set({ jiraAccountId: user.accountId }).where(eq(appUser.id, byEmail.id));
      return byEmail.id;
    }
  }

  const [created] = await db
    .insert(appUser)
    .values({ name: user.displayName, email: user.email, jiraAccountId: user.accountId })
    .returning({ id: appUser.id });
  return created.id;
}

/** Parses the Jira people picker's hidden JSON field (components/JiraPeoplePicker.astro) into resolved app_user ids. Empty/invalid input → no ids, never throws. */
export async function resolveJiraTeamMembersField(raw: string | null | undefined): Promise<string[]> {
  if (!raw) return [];
  let picks: unknown;
  try {
    picks = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(picks)) return [];

  const valid = picks.filter(
    (p): p is JiraUserRef =>
      !!p && typeof p === 'object' && typeof (p as JiraUserRef).accountId === 'string' && typeof (p as JiraUserRef).displayName === 'string',
  );
  return Promise.all(valid.map(resolveOrCreateFromJiraUser));
}

export async function createRoadmapItem(input: CreateItemInput): Promise<string> {
  const actorId = await resolveActor(input.actorEmail);

  const id = await db.transaction(async (tx) => {
    // Manual drag-and-drop rank (Epics list) — appended at the end, well
    // clear of the last row, so a fresh Epic doesn't need re-numbering.
    let sortOrder: number | null = null;
    if (input.type === 'Epic') {
      const [{ max }] = await tx.execute<{ max: number | null }>(
        sql`SELECT max(sort_order) AS max FROM roadmap_item WHERE type = 'Epic'`,
      );
      sortOrder = (max ?? 0) + 1000;
    }

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
        colorLabel: input.colorLabel || null,
        sortOrder,
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
  /** Epic only — one of `EPIC_LABEL_COLORS`. */
  colorLabel?: string | null;
  /**
   * Task/Bug/Research only — undefined (not null) means "the Epic edit form
   * submitted this, leave it alone": Epic has no type/discipline/parentId
   * inputs at all, so the API route only fills these when a Task form
   * submitted (kind='task'), and `?? undefined` below skips the column
   * entirely rather than nulling it out for an Epic.
   */
  type?: 'Task' | 'Bug' | 'Research';
  discipline?: string | null;
  parentId?: string | null;
  actorEmail?: string | null;
}

/** Full edit — used by the Epic and Task/Bug/Research detail pages. Replaces assignees wholesale; logs a status_log row only when status actually changed. */
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
        colorLabel: input.colorLabel || null,
        type: input.type ?? undefined,
        discipline: input.type !== undefined ? input.discipline || null : undefined,
        parentId: input.type !== undefined ? input.parentId || null : undefined,
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

/** Drag-and-drop reorder on the Epics list — one field, no status_log entry (not a status change). */
export async function setSortOrder(id: string, sortOrder: number): Promise<void> {
  await db.update(roadmapItem).set({ sortOrder, updatedAt: new Date() }).where(eq(roadmapItem.id, id));
}

/**
 * The four columns on the All items board, as the exact state each
 * represents — kept in one place so a manual drag lands exactly where
 * `inCol()` (src/pages/index.astro) will actually display it, not just
 * near it. 'review' picks CR as the representative sub-status; the three
 * real Jira values it covers (CR/FT/On QA) can't be told apart from a
 * plain "dropped in this column" gesture.
 */
const BOARD_COLUMN_TARGETS: Record<string, { status: string; jiraSubstatus: string | null; backlogged: boolean }> = {
  neste: { status: 'In Jira', jiraSubstatus: 'Todo', backlogged: false },
  pabegynt: { status: 'In Jira', jiraSubstatus: 'In progress', backlogged: false },
  review: { status: 'In Jira', jiraSubstatus: 'CR', backlogged: false },
  done: { status: 'Delivered', jiraSubstatus: null, backlogged: false },
};

/**
 * Drag a card to a different column on the All items board (OC, 29 Sep).
 * Manual, local-only — same as every other quick action, never written to
 * Jira. Worth knowing: if this item still has an active jiraKey, the next
 * scheduled sync (every JIRA_SYNC_INTERVAL_MS) re-reads Jira's real current
 * status and can move it right back — this is a nudge, not a pin.
 */
export async function moveBoardColumn(id: string, column: string, actorEmail?: string | null): Promise<void> {
  const target = BOARD_COLUMN_TARGETS[column];
  if (!target) throw new Error(`Unknown board column: ${column}`);

  const actorId = await resolveActor(actorEmail);
  await db.transaction(async (tx) => {
    const [before] = await tx
      .select({ status: roadmapItem.status, jiraSubstatus: roadmapItem.jiraSubstatus })
      .from(roadmapItem)
      .where(eq(roadmapItem.id, id))
      .limit(1);
    if (!before) throw new Error(`roadmap_item ${id} not found`);

    await tx
      .update(roadmapItem)
      .set({
        status: target.status,
        jiraSubstatus: target.jiraSubstatus,
        backlogged: target.backlogged,
        completedAt: target.status === 'Delivered' ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(roadmapItem.id, id));

    await tx.insert(roadmapStatusLog).values({
      roadmapItemId: id,
      fromStatus: before.status,
      toStatus: target.status,
      fromSubstatus: before.jiraSubstatus,
      toSubstatus: target.jiraSubstatus,
      actorId,
      note: 'Moved on board (manual drag)',
    });
    await tx.insert(event).values({
      actorId,
      actorKind: actorId ? 'user' : 'system',
      action: 'roadmap_item.board_moved',
      entityType: 'roadmap_item',
      entityId: id,
      payload: { column },
    });
  });
}

/** One uploaded file, already written to `uploads/` by the caller — this just records it. */
export async function addAttachment(input: {
  roadmapItemId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  actorEmail?: string | null;
}): Promise<void> {
  const actorId = await resolveActor(input.actorEmail);
  await db.transaction(async (tx) => {
    await tx.insert(roadmapAttachment).values({
      roadmapItemId: input.roadmapItemId,
      filename: input.filename,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      storagePath: input.storagePath,
      uploadedBy: actorId,
    });
    await tx.insert(event).values({
      actorId,
      actorKind: actorId ? 'user' : 'system',
      action: 'roadmap_item.attachment_added',
      entityType: 'roadmap_item',
      entityId: input.roadmapItemId,
      payload: { filename: input.filename },
    });
  });
}

/** Deletes the DB row and returns enough of it for the caller to also remove the file on disk and redirect — null if it never existed. */
export async function deleteAttachment(
  id: string,
  actorEmail?: string | null,
): Promise<{ storagePath: string; roadmapItemId: string } | null> {
  const actorId = await resolveActor(actorEmail);
  const [deleted] = await db.delete(roadmapAttachment).where(eq(roadmapAttachment.id, id)).returning();
  if (!deleted) return null;

  await db.insert(event).values({
    actorId,
    actorKind: actorId ? 'user' : 'system',
    action: 'roadmap_item.attachment_removed',
    entityType: 'roadmap_item',
    entityId: deleted.roadmapItemId,
    payload: { filename: deleted.filename },
  });
  return { storagePath: deleted.storagePath, roadmapItemId: deleted.roadmapItemId };
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
    // Our own type enum is only Task/Bug/Research (no native "Research" in
    // Jira) — everything that isn't a real Jira Bug stays/becomes Task.
    const inferredType = snapshot.issueTypeName === 'Bug' ? 'Bug' : 'Task';
    const changed = before.status !== toStatus || before.jiraSubstatus !== toSubstatus;

    // Informational fields (OC, 29 Sep) are refreshed every pass regardless
    // of whether status/substatus changed — Jira's assignee or logged time
    // can move without the workflow status moving at all.
    await tx
      .update(roadmapItem)
      .set({
        type: inferredType,
        jiraAssigneeName: snapshot.assigneeName,
        jiraEstimateSeconds: snapshot.estimateSeconds,
        jiraSpentSeconds: snapshot.spentSeconds,
      })
      .where(eq(roadmapItem.id, itemId));

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
 * "Add from Jira" on the All items board (OC, 29 Sep) — pulls a Jira issue
 * straight in as a new Task, title included, rather than making the user
 * create the item by hand first and attach the key after (that's
 * attachJiraKey, for the Idea bank). Refuses a subtask outright, same rule
 * as everywhere else Jira sync touches (feltkatalog §0).
 *
 * Creates with status 'In Jira' and the schema's own backlogged=false
 * default — unlike attachJiraKey's deliberate backlogged=true (an idea
 * you're not necessarily picking up yet), this lands straight on the board,
 * then applyJiraSnapshot immediately reconciles it to the real current
 * Jira state instead of sitting under "Neste" until the next scheduled sync.
 */
export async function createRoadmapItemFromJira(snapshot: JiraSnapshot, actorEmail?: string | null): Promise<string> {
  if (snapshot.isSubtask) {
    throw new Error(`${snapshot.key} is a subtask — only parent tasks can be pulled in directly.`);
  }

  const id = await createRoadmapItem({
    type: snapshot.issueTypeName === 'Bug' ? 'Bug' : 'Task',
    title: snapshot.summary,
    status: 'In Jira',
    jiraKey: snapshot.key,
    actorEmail,
  });
  await applyJiraSnapshot(id, snapshot, actorEmail);
  return id;
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
