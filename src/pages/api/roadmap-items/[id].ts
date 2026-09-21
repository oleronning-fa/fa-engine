/** Full edit — the Epic detail page's save form. Plain HTML form POST (browsers don't send PATCH from a <form>). */
import type { APIRoute } from 'astro';
import { resolveOrCreatePeople, updateRoadmapItem } from '../../../modules/roadmap/write';

function str(v: FormDataEntryValue | null): string | null {
  const s = typeof v === 'string' ? v.trim() : '';
  return s || null;
}

export const POST: APIRoute = async ({ params, request, redirect, locals }) => {
  const id = params.id;
  if (!id) return new Response('Missing id', { status: 400 });

  const form = await request.formData();
  const newPeopleIds = await resolveOrCreatePeople(str(form.get('newPeople')));
  const assigneeIds = [
    ...form.getAll('assigneeIds').filter((v): v is string => typeof v === 'string' && v !== ''),
    ...newPeopleIds,
  ];

  try {
    await updateRoadmapItem({
      id,
      title: form.get('title') as string,
      emoji: str(form.get('emoji')),
      description: str(form.get('description')),
      notes: str(form.get('notes')),
      area: str(form.get('area')),
      ownerId: str(form.get('ownerId')),
      coordinatorId: str(form.get('coordinatorId')),
      status: (str(form.get('status')) as string) ?? 'Ikke påbegynt',
      priority: str(form.get('priority')),
      size: str(form.get('size')),
      targetDate: str(form.get('targetDate')),
      jiraKey: str(form.get('jiraKey')),
      assigneeIds,
      actorEmail: locals.user?.email ?? null,
    });
    return redirect(`/epics/${id}`, 303);
  } catch (err) {
    console.error('[roadmap-items/:id] update failed', err);
    return new Response('Could not save — please try again.', { status: 500 });
  }
};
