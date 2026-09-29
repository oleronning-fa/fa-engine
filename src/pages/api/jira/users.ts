/** Search-as-you-type backing the Jira people picker on Team (see RoadmapLayout.astro's shared script). */
import type { APIRoute } from 'astro';
import { JIRA_API_TOKEN, JIRA_EMAIL } from 'astro:env/server';
import { JiraAuthError, searchJiraUsers } from '../../../core/jira';

export const GET: APIRoute = async ({ url }) => {
  if (!JIRA_EMAIL || !JIRA_API_TOKEN) {
    return new Response(JSON.stringify([]), { status: 503, headers: { 'content-type': 'application/json' } });
  }

  const q = url.searchParams.get('q') ?? '';
  try {
    const users = await searchJiraUsers(q, { email: JIRA_EMAIL, token: JIRA_API_TOKEN });
    return new Response(JSON.stringify(users), { headers: { 'content-type': 'application/json' } });
  } catch (err) {
    if (err instanceof JiraAuthError) {
      console.error('[jira/users] credentials rejected — check JIRA_EMAIL / JIRA_API_TOKEN.');
    } else {
      console.error('[jira/users] search failed', err);
    }
    return new Response(JSON.stringify([]), { status: 502, headers: { 'content-type': 'application/json' } });
  }
};
