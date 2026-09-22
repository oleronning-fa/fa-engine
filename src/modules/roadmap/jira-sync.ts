/**
 * The shared Jira sync loop — used by the manual script (scripts/sync-jira.ts)
 * and the background scheduler (src/core/jira-scheduler.ts). One place for
 * "which items are candidates" and "what to do with each one", so the two
 * callers can't drift apart.
 */
import { and, eq, isNotNull, ne } from 'drizzle-orm';
import { db } from '../../core/db';
import { roadmapItem } from '../../core/schema';
import { fetchJiraIssue, JiraAuthError, type JiraCredentials } from '../../core/jira';
import { applyJiraSnapshot, type JiraSyncAction } from './write';

export interface SyncCandidate {
  id: string;
  title: string;
  jiraKey: string;
}

/** jira_key set, status = 'In Jira', never Epic — the only ones actually mirrored (feltkatalog §0). */
export async function getJiraSyncCandidates(): Promise<SyncCandidate[]> {
  const rows = await db
    .select({ id: roadmapItem.id, title: roadmapItem.title, jiraKey: roadmapItem.jiraKey })
    .from(roadmapItem)
    .where(and(isNotNull(roadmapItem.jiraKey), eq(roadmapItem.status, 'In Jira'), ne(roadmapItem.type, 'Epic')));
  return rows as SyncCandidate[];
}

export interface SyncOutcome {
  key: string;
  title: string;
  action: JiraSyncAction | 'not_found' | 'error';
  detail?: string;
}

/**
 * Runs the sync over every candidate. Stops early only on JiraAuthError (bad
 * credentials — no point burning through the rest). Every other per-item
 * failure is caught and reported, not fatal to the batch.
 */
export async function syncAllFromJira(creds: JiraCredentials): Promise<SyncOutcome[]> {
  const candidates = await getJiraSyncCandidates();
  const outcomes: SyncOutcome[] = [];

  for (const item of candidates) {
    try {
      const snapshot = await fetchJiraIssue(item.jiraKey, creds);
      if (!snapshot) {
        outcomes.push({ key: item.jiraKey, title: item.title, action: 'not_found' });
        continue;
      }
      const result = await applyJiraSnapshot(item.id, snapshot, creds.email);
      outcomes.push({ key: item.jiraKey, title: item.title, action: result.action });
    } catch (err) {
      if (err instanceof JiraAuthError) throw err;
      outcomes.push({ key: item.jiraKey, title: item.title, action: 'error', detail: (err as Error).message });
    }
  }

  return outcomes;
}
