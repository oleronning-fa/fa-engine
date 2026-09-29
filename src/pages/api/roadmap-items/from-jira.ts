/** "Add from Jira" on the All items board — pulls a picked issue straight in as a new Task. */
import type { APIRoute } from 'astro';
import { JIRA_API_TOKEN, JIRA_EMAIL } from 'astro:env/server';
import { fetchJiraIssue, JiraAuthError } from '../../../core/jira';
import { createRoadmapItemFromJira } from '../../../modules/roadmap/write';

export const POST: APIRoute = async ({ request, redirect, locals }) => {
  const form = await request.formData();
  const jiraKey = (form.get('jiraKey') as string | null)?.trim();
  if (!jiraKey) return new Response('Missing Jira key', { status: 400 });

  if (!JIRA_EMAIL || !JIRA_API_TOKEN) {
    return new Response('Jira sync is not configured.', { status: 503 });
  }

  try {
    const snapshot = await fetchJiraIssue(jiraKey, { email: JIRA_EMAIL, token: JIRA_API_TOKEN });
    if (!snapshot) return new Response(`${jiraKey} was not found in Jira.`, { status: 404 });

    await createRoadmapItemFromJira(snapshot, locals.user?.email ?? null);
    return redirect('/', 303);
  } catch (err) {
    if (err instanceof JiraAuthError) {
      return new Response('Jira rejected the credentials.', { status: 502 });
    }
    console.error('[roadmap-items/from-jira] failed', err);
    return new Response((err as Error).message || 'Could not add this issue — please try again.', { status: 500 });
  }
};
