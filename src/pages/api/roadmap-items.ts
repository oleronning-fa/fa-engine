/**
 * Handles all three create forms (New Epic / New Idea / New Task) — plain
 * HTML `<form method="POST">`, no client JS needed for the submit itself.
 * Redirects back to a sensible view on success (303, so the browser doesn't
 * re-POST on refresh).
 */
import type { APIRoute } from 'astro';
import { createRoadmapItem, resolveOrCreatePeople } from '../../modules/roadmap/write';

function str(v: FormDataEntryValue | null): string | null {
  const s = typeof v === 'string' ? v.trim() : '';
  return s || null;
}

function ids(form: FormData, field: string): string[] {
  return form.getAll(field).filter((v): v is string => typeof v === 'string' && v !== '');
}

export const POST: APIRoute = async ({ request, redirect, locals }) => {
  const form = await request.formData();
  const kind = str(form.get('kind'));
  const actorEmail = locals.user?.email ?? null;

  // No JournalistBoost API lists every user (only /api/auth/check-session,
  // which validates one session — AGENTS.md "Who's logged in"), so this is
  // the stand-in: type a name that isn't in the list, they get created.
  const newPeopleIds = await resolveOrCreatePeople(str(form.get('newPeople')));

  try {
    if (kind === 'epic') {
      await createRoadmapItem({
        type: 'Epic',
        title: form.get('title') as string,
        emoji: str(form.get('emoji')),
        description: str(form.get('description')),
        targetDate: str(form.get('targetDate')),
        status: 'Ikke påbegynt',
        size: 'Ongoing',
        assigneeIds: [...ids(form, 'assigneeIds'), ...newPeopleIds],
        actorEmail,
      });
      return redirect('/epics', 303);
    }

    if (kind === 'idea') {
      await createRoadmapItem({
        type: 'Task',
        title: form.get('title') as string,
        emoji: str(form.get('emoji')),
        description: str(form.get('description')),
        targetDate: str(form.get('targetDate')),
        status: 'Idea',
        assigneeIds: [...ids(form, 'assigneeIds'), ...newPeopleIds],
        actorEmail,
      });
      return redirect('/idea-bank', 303);
    }

    if (kind === 'task') {
      await createRoadmapItem({
        type: (str(form.get('type')) as 'Task' | 'Bug' | 'Research') ?? 'Task',
        discipline: form.get('discipline') ? 'Design' : null,
        title: form.get('title') as string,
        description: str(form.get('description')),
        notes: str(form.get('notes')),
        area: str(form.get('area')),
        parentId: str(form.get('parentId')),
        ownerId: str(form.get('ownerId')),
        coordinatorId: str(form.get('coordinatorId')),
        status: str(form.get('status')) ?? 'Idea',
        priority: str(form.get('priority')) ?? 'Medium',
        size: str(form.get('size')),
        targetDate: str(form.get('targetDate')),
        jiraKey: str(form.get('jiraKey')),
        assigneeIds: [...ids(form, 'assigneeIds'), ...newPeopleIds],
        actorEmail,
      });
      return redirect('/', 303);
    }

    return new Response('Unknown item kind', { status: 400 });
  } catch (err) {
    console.error('[roadmap-items] create failed', err);
    return new Response('Could not save — please try again.', { status: 500 });
  }
};
