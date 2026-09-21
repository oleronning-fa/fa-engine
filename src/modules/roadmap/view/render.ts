/**
 * Pure rendering helpers shared by every roadmap view — initials/avatar
 * colour, status/priority chip classes (matching `src/styles/roadmap.css`),
 * type icon letters, date formatting. No DB access here; views query, these
 * format.
 */
import type { EpicStatus, Priority, RoadmapItemType, TaskStatus } from '../../../core/codesets';

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Deterministic avatar colour from a name — same person, same colour, every render. */
const AVATAR_COLORS = ['#0373E3', '#025CB6', '#8C46CE', '#F77222', '#14985E', '#525C65', '#C65815'];
export function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const TYPE_ICON: Record<RoadmapItemType, { letter: string; class: string }> = {
  Epic: { letter: 'E', class: 'type-epic' },
  Task: { letter: 'T', class: 'type-task' },
  Bug: { letter: 'B', class: 'type-bug' },
  Research: { letter: 'R', class: 'type-research' },
};
export function typeIcon(type: RoadmapItemType) {
  return TYPE_ICON[type];
}

const TASK_STATUS_CHIP: Record<TaskStatus, { class: string; label: string }> = {
  Idea: { class: 'st-idea', label: 'Idea' },
  'Under review': { class: 'st-review', label: 'Under review' },
  Prioritized: { class: 'st-prioritized', label: 'Prioritized' },
  'In Jira': { class: 'st-jira', label: 'In Jira' },
  Delivered: { class: 'st-delivered', label: 'Delivered' },
  Declined: { class: 'st-declined', label: 'Declined' },
};
/** Falls back gracefully — status is a text column, not a DB enum. */
export function taskStatusChip(status: string) {
  return TASK_STATUS_CHIP[status as TaskStatus] ?? { class: 'st-review', label: status };
}

const EPIC_STATUS_CHIP: Record<EpicStatus, { class: string; label: string }> = {
  'Ikke påbegynt': { class: 'st-epic-not-started', label: 'Ikke påbegynt' },
  Påbegynt: { class: 'st-epic-started', label: 'Påbegynt' },
  'Ferdig - arkivert': { class: 'st-epic-archived', label: 'Ferdig - arkivert' },
};
export function epicStatusChip(status: string) {
  return EPIC_STATUS_CHIP[status as EpicStatus] ?? { class: 'st-epic-not-started', label: status };
}

const PRIORITY_CHIP: Record<Priority, string> = {
  Hotfix: 'pr-hotfix',
  High: 'pr-high',
  Medium: 'pr-medium',
  Low: 'pr-low',
};
export function priorityChipClass(priority: string | null): string | null {
  if (!priority) return null;
  return PRIORITY_CHIP[priority as Priority] ?? 'pr-medium';
}

/** "12. sep" — short, locale-aware, no year (internal surfaces, day-to-day use). */
export function fmtDateShort(d: Date | string | null): string | null {
  if (!d) return null;
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' });
}

/** The Jira org used across every doc/import in this project (roadmap-krav §5 step 8). */
export function jiraUrl(key: string): string {
  return `https://startsiden.atlassian.net/browse/${encodeURIComponent(key)}`;
}
