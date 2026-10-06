/**
 * Full edit — the Epic and Task/Bug/Research detail pages' save forms.
 * Plain HTML form POST (browsers don't send PATCH from a <form>). Branches
 * on `kind` because the two forms genuinely differ: Epic's Owner is a
 * manual-text field resolved through resolveOrCreateOwner, Task's is a
 * plain <select> of known people (mirroring their own New Epic / New Task
 * dialogs) — and only Task has type/discipline/parentId at all.
 */
import type { APIRoute } from 'astro';
import { MILESTONES } from '../../../core/codesets';
import { resolveJiraTeamMembersField, resolveOrCreateOwner, resolveOrCreatePeople, setMilestones, updateRoadmapItem } from '../../../modules/roadmap/write';

function str(v: FormDataEntryValue | null): string | null {
  const s = typeof v === 'string' ? v.trim() : '';
  return s || null;
}

export const POST: APIRoute = async ({ params, request, redirect, locals }) => {
  const id = params.id;
  if (!id) return new Response('Missing id', { status: 400 });

  const form = await request.formData();
  const kind = str(form.get('kind'));
  const actorEmail = locals.user?.email ?? null;

  try {
    if (kind === 'task') {
      const newPeopleIds = await resolveOrCreatePeople(str(form.get('newPeople')));
      const assigneeIds = [
        ...form.getAll('assigneeIds').filter((v): v is string => typeof v === 'string' && v !== ''),
        ...newPeopleIds,
      ];
      await updateRoadmapItem({
        id,
        title: form.get('title') as string,
        type: (str(form.get('type')) as 'Task' | 'Bug' | 'Research') ?? 'Task',
        discipline: form.get('discipline') ? 'Design' : null,
        parentId: str(form.get('parentId')),
        description: str(form.get('description')),
        notes: str(form.get('notes')),
        area: str(form.get('area')),
        ownerId: str(form.get('ownerId')),
        coordinatorId: str(form.get('coordinatorId')),
        status: str(form.get('status')) ?? 'Idea',
        priority: str(form.get('priority')),
        size: str(form.get('size')),
        targetDate: str(form.get('targetDate')),
        jiraKey: str(form.get('jiraKey')),
        assigneeIds,
        actorEmail,
      });
      return redirect(`/tasks/${id}`, 303);
    }

    if (kind === 'idea') {
      const jiraTeamIds = await resolveJiraTeamMembersField(str(form.get('jiraTeamMembers')));
      await updateRoadmapItem({
        id,
        title: form.get('title') as string,
        emoji: str(form.get('emoji')), // hidden input — kept as-is
        description: str(form.get('description')),
        // Not editable on an idea, but round-tripped as hidden inputs so a save doesn't null them.
        notes: str(form.get('notes')),
        priority: str(form.get('priority')),
        size: str(form.get('size')),
        area: str(form.get('area')),
        ownerId: str(form.get('ownerId')),
        coordinatorId: str(form.get('coordinatorId')),
        status: str(form.get('status')) ?? 'Idea',
        targetDate: str(form.get('targetDate')),
        jiraKey: str(form.get('jiraKey')),
        colorLabel: str(form.get('colorLabel')),
        assigneeIds: [
          ...form.getAll('assigneeIds').filter((v): v is string => typeof v === 'string' && v !== ''),
          ...jiraTeamIds,
        ],
        actorEmail,
      });
      await setMilestones(id, Object.fromEntries(MILESTONES.map((m) => [m.id, str(form.get(`milestone_${m.id}`))])));
      return redirect(`/ideas/${id}`, 303);
    }

    const jiraTeamIds = await resolveJiraTeamMembersField(str(form.get('jiraTeamMembers')));
    const assigneeIds = [
      ...form.getAll('assigneeIds').filter((v): v is string => typeof v === 'string' && v !== ''),
      ...jiraTeamIds,
    ];
    const ownerId = await resolveOrCreateOwner(str(form.get('ownerName')));

    await updateRoadmapItem({
      id,
      title: form.get('title') as string,
      description: str(form.get('description')),
      notes: str(form.get('notes')),
      area: str(form.get('area')),
      ownerId,
      coordinatorId: str(form.get('coordinatorId')),
      status: (str(form.get('status')) as string) ?? 'Ikke påbegynt',
      priority: str(form.get('priority')),
      size: str(form.get('size')),
      targetDate: str(form.get('targetDate')),
      jiraKey: str(form.get('jiraKey')),
      colorLabel: str(form.get('colorLabel')),
      assigneeIds,
      actorEmail,
    });
    return redirect(`/epics/${id}`, 303);
  } catch (err) {
    console.error('[roadmap-items/:id] update failed', err);
    return new Response('Could not save — please try again.', { status: 500 });
  }
};
