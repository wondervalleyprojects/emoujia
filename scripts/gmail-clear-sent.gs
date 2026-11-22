// Emoujia: permanently delete the studio's Gmail copies of reading emails.
//
// Gmail files a copy of every message sent through it in Sent Mail (see
// server/mailer.ts). Each Emoujia reading email carries the visitor's address
// and the share card. The notices promise that copy stays for up to a day
// (PROPOSED, 21 Nov 2026). This script keeps that promise.
//
// Installed by hand in the sending account (GMAIL_USER) at script.google.com,
// with the Gmail advanced service on, and run by an hourly trigger. Steps:
// docs/OPERATIONS.md, "Clearing reading emails from Sent Mail".
//
// Why hourly: each run deletes copies older than MAX_AGE_HOURS. Run once a
// day, a copy sent just after a run would wait almost two days. Run hourly
// with a 23-hour cutoff, no copy stays a full day.
//
// Why the advanced service: GmailApp can only move mail to Trash, where Gmail
// keeps it 30 more days. Gmail.Users.Messages.remove deletes it for good.
//
// What it matches: a broad search narrows the list, then every message is
// checked header by header and deleted only if all of these hold:
//   - it carries Gmail's SENT label,
//   - Subject is exactly "Your Emoujia reading" (not "Re: ..." or "Fwd: ..."),
//   - From's name is exactly "Emoujia, a Wonder Valley Projects Lab" and its
//     address is this account's,
//   - it was sent more than MAX_AGE_HOURS ago.
// Replies, forwards, the subscriber CSV export and anything else are left alone.
// The log never records an address: only counts, dates and message ids.

const DRY_RUN = true;            // true: count and log only. Set false after the first dry run looks right.
const MAX_AGE_HOURS = 23;
const SUBJECT = 'Your Emoujia reading';            // server/readingEmail.ts
const FROM_NAME = 'Emoujia, a Wonder Valley Projects Lab'; // server/api.ts
const QUERY = 'in:sent subject:"Your Emoujia reading" from:me';
const MAX_PER_RUN = 400;         // stays well inside Apps Script's time limit

function clearReadingEmails() {
  const me = Session.getEffectiveUser().getEmail().toLowerCase();
  const cutoff = Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000;
  let pageToken;
  let looked = 0, matched = 0, deleted = 0, tooNew = 0, skipped = 0;

  do {
    const page = Gmail.Users.Messages.list('me', { q: QUERY, maxResults: 100, pageToken: pageToken });
    pageToken = page.nextPageToken;
    for (const ref of page.messages || []) {
      if (matched >= MAX_PER_RUN) { pageToken = null; break; }
      looked++;
      const m = Gmail.Users.Messages.get('me', ref.id, { format: 'metadata', metadataHeaders: ['From', 'Subject'] });
      if (!isReadingEmail(m, me)) { skipped++; continue; }
      if (Number(m.internalDate) > cutoff) { tooNew++; continue; }
      matched++;
      const sent = new Date(Number(m.internalDate)).toISOString();
      if (DRY_RUN) { console.log(`would delete ${m.id}, sent ${sent}`); continue; }
      Gmail.Users.Messages.remove('me', m.id);
      deleted++;
    }
  } while (pageToken);

  console.log(`${DRY_RUN ? 'DRY RUN. ' : ''}Looked at ${looked}; ${matched} reading emails over ${MAX_AGE_HOURS} hours old; deleted ${deleted}; ${tooNew} newer, left for a later run; ${skipped} did not match exactly and were left alone.`);
}

function isReadingEmail(m, me) {
  if (!(m.labelIds || []).includes('SENT')) return false;
  const header = (name) => ((m.payload && m.payload.headers) || []).find((h) => h.name.toLowerCase() === name.toLowerCase());
  const subject = header('Subject');
  const from = header('From');
  if (!subject || subject.value.trim() !== SUBJECT) return false;
  if (!from) return false;
  // From: "Emoujia, a Wonder Valley Projects Lab" <address>
  const f = from.value.match(/^\s*"?(.*?)"?\s*<([^>]+)>\s*$/);
  return !!f && f[1] === FROM_NAME && f[2].trim().toLowerCase() === me;
}
