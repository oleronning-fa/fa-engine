import { type AreaId } from '../../../core/codesets';

/**
 * Rule-based keyword matching for `area` on import (roadmap-krav §5 step 7).
 * Deliberately modest: first match wins, ordered most-specific-first, and
 * anything that doesn't match goes to `import_note` for a human to confirm —
 * "Ingen automatisk skriving" (roadmap-krav §5 step 7). This is a first pass,
 * not a source of truth.
 *
 * Rewritten against the 18-area list in `signalkoblingen` §5 (the original
 * roadmap-krav §7 table used the superseded 13/15-area version).
 */
const RULES: Array<[AreaId, RegExp]> = [
  ['forum', /\bforum\b/i],
  ['bjellesauer', /\bbjellesau|bellsheep\b/i],
  ['watchlist-portefolje', /\bwatchlist|portfolio|portefølje\b/i],
  ['mittfa-personalisering', /\bmitt\s?fa\b|\bmy\s?fa\b|personali[sz]/i],
  ['ai-investorchat', /\binvestor\s?chat|\bchatbot|\bchat\s?bot\b/i],
  ['nyhetsbrev-varsler', /\bnewsletter|nyhetsbrev|\bpush\s?notification|\bvarsel/i],
  ['app', /\bios\b|\bandroid\b|\bmobile\s?app\b/i],
  ['annonse', /\bad(s|ops)?\b.*\b(widget|page|campaign)|\bannonse/i],
  ['sporing-analyse', /\bmixpanel|kilkaya|\btracking|sporing|\banalytics|\bseo\b|schema\.org/i],
  ['innlogging-konto', /\blog[- ]?in\b|\bsign[- ]?in\b|\baccount\b|\bkonto\b|\bpassword|passord/i],
  ['abonnement-betaling', /\bsubscription|abonnement|\bpayment|betaling|faktura|invoice|\bsesamy|\bzephr/i],
  ['bedriftsabonnement-b2b', /\bb2b\b|bedriftsabonnement/i],
  ['papir-eavis', /\be-?avis\b|\bpaper\s?(edition|delivery)|papiravis/i],
  ['interne-verktoy', /\bvibe\s?coding|\bjournalist\s?boost|\bfa\s?engine\b/i],
  [
    'ytelse-teknisk-plattform',
    /\bperformance|\bytelse\b|infrastructure|infrastruktur|\baws\b|redpill|\bsecurity\b|page\s?speed|\brefactor|\bmiddleware\b|\bwebhook\b|\bendpoint|\bcors\b|\bcach(e|ing)\b|\bapi\b|\bdatabase\b|\bbackend\b|\bdeploy|\bdocker\b|\bmigration\b|\benv(ironment)?\s?variable|\blibrary\b|\bindex(ing)?\b/i,
  ],
  ['artikkel-innhold-sok', /\barticle|artikkel|\bsearch\b|søk|\bcontent\b|scraping|journalist(?!\s?boost)/i],
  ['bors-instrumenter', /\binstrument|\bstock|\baksje|\bbørs|\btrading|\bmarket\s?data/i],
];

/** Bracket prefixes that name a platform/area directly, independent of the title text. */
const TAG_AREAS: Partial<Record<string, AreaId>> = {
  ios: 'app',
  android: 'app',
  pagespeed: 'ytelse-teknisk-plattform',
  'security headers': 'ytelse-teknisk-plattform',
};

/**
 * Returns the first matching area, or null if nothing matches. Checks the
 * title first, then the bracket tag (e.g. `[Pagespeed]`) — the tag is
 * stripped out of `title` upstream, so a keyword living only in the tag would
 * otherwise never get a chance to match.
 */
export function matchArea(title: string, bracketTag?: string | null): AreaId | null {
  for (const [area, pattern] of RULES) {
    if (pattern.test(title)) return area;
  }
  if (bracketTag && TAG_AREAS[bracketTag]) return TAG_AREAS[bracketTag] ?? null;
  return null;
}
