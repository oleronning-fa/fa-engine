/** "⚡ Attach Jira key" — manual bring-in from the Idea bank, no waiting for the scheduled sync. */
import type { APIRoute } from 'astro';
import { JIRA_API_TOKEN, JIRA_EMAIL } from 'astro:env/server';
import { fetchJiraIssue } from '../../../../core/jira';
import { attachJiraKey } from '../../../../modules/roadmap/write';

export const POST: APIRoute = async ({ params, request, redirect, locals }) => {
  const id = params.id;
  if (!id) return new Response('Missing id', { status: 400 });

  const form = await request.formData();
  const jiraKey = (form.get('jiraKey') as string | null)?.trim();
  const redirectTo = (form.get('redirectTo') as string) || '/idea-bank';
  if (!jiraKey) return new Response('Missing Jira key', { status: 400 });

  // Look the key up now so the item lands on its *real* current state
  // immediately, rather than waiting for the next scheduled sync — but this
  // is best-effort: if Jira sync isn't configured, still attach the key.
  let snapshot = null;
  if (JIRA_EMAIL && JIRA_API_TOKEN) {
    try {
      snapshot = await fetchJiraIssue(jiraKey, { email: JIRA_EMAIL, token: JIRA_API_TOKEN });
    } catch (err) {
      console.error('[attach-jira] lookup failed, attaching without it', err);
    }
  }

  try {
    await attachJiraKey(id, jiraKey, snapshot, locals.user?.email ?? null);
    return redirect(redirectTo, 303);
  } catch (err) {
    console.error('[attach-jira] failed', err);
    return new Response('Could not attach — please try again.', { status: 500 });
  }
};
