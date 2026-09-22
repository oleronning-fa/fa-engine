/**
 * `pnpm sync:jira [--write]`
 *
 * One-way read sync: for every roadmap_item with a jira_key and status
 * 'In Jira' (never Delivered or Declined — OC, 21 Sep), fetch the real issue
 * and apply it. Default is a dry run — prints what would happen, writes
 * nothing. `--write` actually applies it.
 *
 * Credentials: reads the token from ~/.fa-vibe/jira-token (never committed,
 * never in chat — see the deploy skill's token-handling pattern) and the
 * email from --email= or JIRA_EMAIL.
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { db } from '../src/core/db';
import { fetchJiraIssue, JiraAuthError, type JiraCredentials } from '../src/core/jira';
import { applyJiraSnapshot } from '../src/modules/roadmap/write';
import { getJiraSyncCandidates } from '../src/modules/roadmap/jira-sync';

const args = process.argv.slice(2);
const write = args.includes('--write');
const emailArg = args.find((a) => a.startsWith('--email='))?.split('=')[1];

function loadCredentials(): JiraCredentials {
  const email = emailArg ?? process.env.JIRA_EMAIL;
  if (!email) {
    console.error('No email — pass --email=you@hegnar.no or set JIRA_EMAIL.');
    process.exit(1);
  }
  let token: string;
  try {
    token = readFileSync(join(homedir(), '.fa-vibe', 'jira-token'), 'utf8').trim();
  } catch {
    console.error('Could not read ~/.fa-vibe/jira-token. Create it first (see the deploy skill\'s token pattern).');
    process.exit(1);
  }
  if (!token) {
    console.error('~/.fa-vibe/jira-token is empty.');
    process.exit(1);
  }
  return { email, token };
}

async function main() {
  const creds = loadCredentials();
  console.log(`${write ? 'WRITE' : 'DRY RUN'} — syncing as ${creds.email}\n`);

  const candidates = await getJiraSyncCandidates();

  console.log(`${candidates.length} candidate(s): jira_key set, status = 'In Jira'.\n`);

  for (const item of candidates) {
    const key = item.jiraKey;
    try {
      const snapshot = await fetchJiraIssue(key, creds);
      if (!snapshot) {
        console.log(`  ${key}  ${item.title.slice(0, 50).padEnd(50)}  NOT FOUND (deleted, or no permission)`);
        continue;
      }

      if (snapshot.isSubtask) {
        console.log(`  ${key}  ${item.title.slice(0, 50).padEnd(50)}  SKIPPED — is a Jira subtask`);
        continue;
      }

      const preview = `${snapshot.statusName}${snapshot.resolutionDate ? ` (resolved ${snapshot.resolutionDate})` : ''}`;
      console.log(`  ${key}  ${item.title.slice(0, 50).padEnd(50)}  ${preview}`);

      if (write) {
        const result = await applyJiraSnapshot(item.id, snapshot, creds.email);
        console.log(`         → ${result.action}: ${result.fromStatus}${result.fromSubstatus ? `/${result.fromSubstatus}` : ''} → ${result.toStatus}${result.toSubstatus ? `/${result.toSubstatus}` : ''}`);
      }
    } catch (err) {
      if (err instanceof JiraAuthError) {
        console.error('Jira rejected the credentials — stopping.');
        process.exit(1);
      }
      console.log(`  ${key}  ${item.title.slice(0, 50).padEnd(50)}  ERROR: ${(err as Error).message}`);
    }
  }

  console.log(write ? '\nApplied.' : '\nNothing written — this was a dry run. Re-run with --write to apply.');
  await db.$client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
