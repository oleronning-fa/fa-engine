import { JIRA_SUBSTATUSES, type EpicStatus, type JiraSubstatus, type TaskStatus } from '../../../core/codesets';
import type { ParsedItem } from './parse-workbook';

export interface StatusMapping {
  status: TaskStatus | EpicStatus;
  jiraSubstatus: JiraSubstatus | null;
  declinedReason: string | null;
  note?: string; // -> import_note, when the mapping was a guess
}

/** Epic has its own 3-value set (feltkatalog §0) — no Jira mirroring, no Declined. */
export function mapEpicStatus(sheetStatus: string | null): { status: EpicStatus; note?: string } {
  const s = (sheetStatus ?? '').toLowerCase().trim();
  if (s.includes('done')) return { status: 'Ferdig - arkivert' };
  if (s.includes('progress') || s === 'cr' || s === 'ft' || s.includes('qa')) return { status: 'Påbegynt' };
  if (!s || s.includes('wait')) return { status: 'Ikke påbegynt' };
  return { status: 'Ikke påbegynt', note: `unrecognized epic status "${sheetStatus}" — defaulted` };
}

const BACKLOG_SHEETS = new Set(['Backlog', 'Backlog design']);

/**
 * Task/Bug/Research — 6-value set. `jiraKey` presence is the primary signal
 * (roadmap-krav §3.1: "når noe blir ekte utviklingsarbeid, får det en
 * Jira-sak"); the sheet's own status text is secondary, used to pick the
 * `jiraSubstatus` or to distinguish Delivered/Declined when there's no key.
 */
export function mapTaskStatus(item: ParsedItem): StatusMapping {
  const s = (item.statusRaw ?? '').trim();
  const sl = s.toLowerCase();

  if (sl === "won't do" || sl === 'wont do' || sl === 'outdated') {
    return {
      status: 'Declined',
      jiraSubstatus: null,
      declinedReason: item.comment
        ? `Imported from the sheet ("${s}"): ${item.comment}`
        : `Imported as "${s}" — no reason was recorded in the sheet.`,
      note: 'declinedReason has no real reason behind it, only the sheet outcome — confirm with OC/Marina',
    };
  }

  if (sl === 'done') {
    return { status: 'Delivered', jiraSubstatus: null, declinedReason: null };
  }

  if (item.jiraKey) {
    const match = JIRA_SUBSTATUSES.find((v) => v.toLowerCase() === sl);
    if (match && match !== 'Done') return { status: 'In Jira', jiraSubstatus: match, declinedReason: null };
    if (!s) return { status: 'In Jira', jiraSubstatus: null, declinedReason: null };
    return {
      status: 'In Jira',
      jiraSubstatus: null,
      declinedReason: null,
      note: `has a jira_key but the sheet status "${s}" isn't a recognised sub-status`,
    };
  }

  if (BACKLOG_SHEETS.has(item.sourceSheet)) {
    return { status: 'Idea', jiraSubstatus: null, declinedReason: null };
  }

  if (s) {
    return {
      status: 'Prioritized',
      jiraSubstatus: null,
      declinedReason: null,
      note: `active status "${s}" on ${item.sourceSheet} but no jira_key — defaulted to Prioritized, please confirm`,
    };
  }

  return { status: 'Idea', jiraSubstatus: null, declinedReason: null };
}
