/**
 * Background Jira sync — runs on an interval inside this same process, same
 * pattern as the JB session-cache sweep in src/lib/auth.ts
 * (`setInterval(sweep, ...).unref()`). No separate worker, no queue — this
 * app is one container (fa-engine-status.md: "Ingen DevOps-forespørsel til
 * Profico i fase 0").
 *
 * Importing this module is what starts it — see the side-effect import in
 * src/middleware.ts, which Astro loads exactly once per server process.
 *
 * Quietly does nothing if JIRA_EMAIL / JIRA_API_TOKEN aren't set, rather than
 * crashing the app — Jira sync is a feature, not a boot requirement.
 */
import { JIRA_API_TOKEN, JIRA_EMAIL, JIRA_SYNC_INTERVAL_MS } from 'astro:env/server';
import { syncAllFromJira } from '../modules/roadmap/jira-sync';
import { JiraAuthError } from './jira';

let running = false;

async function tick() {
  if (running) return; // don't overlap if one run is still going
  if (!JIRA_EMAIL || !JIRA_API_TOKEN) return;

  running = true;
  try {
    const outcomes = await syncAllFromJira({ email: JIRA_EMAIL, token: JIRA_API_TOKEN });
    const delivered = outcomes.filter((o) => o.action === 'delivered').length;
    const updated = outcomes.filter((o) => o.action === 'updated').length;
    const errors = outcomes.filter((o) => o.action === 'error' || o.action === 'not_found').length;
    if (outcomes.length > 0) {
      console.log(`[jira-sync] ${outcomes.length} candidate(s): ${delivered} delivered, ${updated} updated, ${errors} issue(s).`);
    }
  } catch (err) {
    if (err instanceof JiraAuthError) {
      console.error('[jira-sync] credentials rejected — check JIRA_EMAIL / JIRA_API_TOKEN.');
    } else {
      console.error('[jira-sync] run failed:', err);
    }
  } finally {
    running = false;
  }
}

if (JIRA_EMAIL && JIRA_API_TOKEN) {
  console.log(`[jira-sync] scheduled every ${JIRA_SYNC_INTERVAL_MS}ms.`);
  setInterval(tick, JIRA_SYNC_INTERVAL_MS).unref();
} else {
  console.log('[jira-sync] JIRA_EMAIL / JIRA_API_TOKEN not set — background sync disabled.');
}
