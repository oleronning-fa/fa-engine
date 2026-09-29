/**
 * One-way read sync with Jira — given a key, pull status, resolution date,
 * assignee, and whether it's a subtask. Never writes back to Jira, ever
 * (roadmap-krav §8 "ikke bygg": toveis synk). This is the only file that
 * talks to Jira's API.
 *
 * Auth is HTTP Basic with an Atlassian API token: email + token. Read from
 * process.env here (same pattern as src/core/db.ts, so this also works from
 * plain Node scripts) — JIRA_EMAIL / JIRA_API_TOKEN.
 */

const JIRA_BASE = 'https://startsiden.atlassian.net';

export interface JiraSnapshot {
  key: string;
  /** Jira's own status name, verbatim (e.g. "ON PRODUCTION") — projects have their own workflows, not our sheet-derived dropdown. */
  statusName: string;
  isSubtask: boolean;
  /** YYYY-MM-DD, or null if unresolved. */
  resolutionDate: string | null;
  assigneeName: string | null;
}

export class JiraAuthError extends Error {}
export class JiraConfigError extends Error {}

export interface JiraCredentials {
  email: string;
  token: string;
}

/** Reads JIRA_EMAIL / JIRA_API_TOKEN from process.env. Throws with a clear message if either is missing. */
export function jiraCredentialsFromEnv(): JiraCredentials {
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;
  if (!email || !token) {
    throw new JiraConfigError('JIRA_EMAIL and JIRA_API_TOKEN must both be set — Jira sync is not configured.');
  }
  return { email, token };
}

function authHeader({ email, token }: JiraCredentials): string {
  return `Basic ${Buffer.from(`${email}:${token}`).toString('base64')}`;
}

/**
 * Fetches one issue. Returns null for a 404 — Jira deliberately returns 404
 * (never 401/403) for both "doesn't exist" and "no permission", so a missing
 * result is not necessarily an error; it just means there's nothing to sync.
 * Throws JiraAuthError on 401 (the credentials themselves are bad).
 */
export async function fetchJiraIssue(key: string, creds: JiraCredentials): Promise<JiraSnapshot | null> {
  const url = `${JIRA_BASE}/rest/api/3/issue/${encodeURIComponent(key)}?fields=status,issuetype,resolutiondate,assignee`;
  const res = await fetch(url, {
    headers: { Authorization: authHeader(creds), Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  });

  if (res.status === 404) return null;
  if (res.status === 401) throw new JiraAuthError('Jira rejected the credentials (401).');
  if (!res.ok) throw new Error(`Jira API error ${res.status} for ${key}`);

  const data = (await res.json()) as {
    key: string;
    fields: {
      status?: { name?: string };
      issuetype?: { subtask?: boolean };
      resolutiondate?: string | null;
      assignee?: { displayName?: string } | null;
    };
  };
  const f = data.fields ?? {};
  return {
    key: data.key,
    statusName: f.status?.name ?? 'Unknown',
    isSubtask: Boolean(f.issuetype?.subtask),
    resolutionDate: f.resolutiondate ? f.resolutiondate.slice(0, 10) : null,
    assigneeName: f.assignee?.displayName ?? null,
  };
}

/**
 * Best-effort mapping from a project's real workflow status to our
 * sheet-derived jiraSubstatus vocabulary (codesets/roadmap.ts). Falls back to
 * the raw Jira status name when nothing matches — `jira_substatus` is plain
 * text, not a DB enum, so an unmapped value like "ON PRODUCTION" is stored
 * as-is rather than forced into the wrong bucket.
 */
const SUBSTATUS_HINTS: Record<string, string> = {
  'to do': 'Todo',
  waiting: 'Waiting',
  'in progress': 'In progress',
  'code review': 'CR',
  cr: 'CR',
  'feature test': 'FT',
  ft: 'FT',
  'on qa': 'On QA',
  qa: 'On QA',
  done: 'Done',
};

export function mapSubstatus(rawStatusName: string): string {
  return SUBSTATUS_HINTS[rawStatusName.trim().toLowerCase()] ?? rawStatusName;
}

export interface JiraUserResult {
  accountId: string;
  displayName: string;
  emailAddress: string | null;
  avatarUrl: string | null;
}

/**
 * Search-as-you-type for the Team picker (OC, 29 Sep) — "Find users" search
 * against the whole Jira instance, not scoped to one project. Filters to
 * real (non-app, non-deleted) accounts; a query under 2 characters isn't
 * sent — Jira's own search needs at least that much to return anything
 * useful, so this avoids a wasted round trip per keystroke.
 */
export async function searchJiraUsers(query: string, creds: JiraCredentials): Promise<JiraUserResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const url = `${JIRA_BASE}/rest/api/3/user/search?query=${encodeURIComponent(q)}&maxResults=10`;
  const res = await fetch(url, {
    headers: { Authorization: authHeader(creds), Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  });

  if (res.status === 401) throw new JiraAuthError('Jira rejected the credentials (401).');
  if (!res.ok) throw new Error(`Jira user search failed: ${res.status}`);

  const data = (await res.json()) as {
    accountId: string;
    accountType?: string;
    displayName: string;
    emailAddress?: string;
    active?: boolean;
    avatarUrls?: Record<string, string>;
  }[];

  return data
    .filter((u) => u.accountType === 'atlassian' && u.active !== false)
    .map((u) => ({
      accountId: u.accountId,
      displayName: u.displayName,
      emailAddress: u.emailAddress ?? null,
      avatarUrl: u.avatarUrls?.['24x24'] ?? null,
    }));
}
