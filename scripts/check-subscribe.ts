// Checks what /send-reading answers about a checked subscribe box, without a
// database and without sending mail (GMAIL_* are cleared, so the route stops
// before the mailer and still answers `subscribed`).
//   npx tsx scripts/check-subscribe.ts
import express from 'express';
import type { AddressInfo } from 'net';

process.env.READING_SECRET = 'check-subscribe-' + 'x'.repeat(32);
delete process.env.GMAIL_USER;
delete process.env.GMAIL_APP_PASSWORD;

const { apiRouter } = await import('../server/api');
const { signReading } = await import('../server/sign');
const { saveSubscriber } = await import('../server/store');

const reading = 'THE RULING SIGN\nA test.\n\nTHE ESSENCE\nA test essence.';
const emojis = ['🙂', '🌵', '✨'];
const signed = signReading('three', emojis, reading);

async function ask(save: ((e: string) => Promise<void>) | undefined, optIn: boolean) {
  const app = express();
  app.use('/api', apiRouter(save ? { save } : {}));
  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;
  try {
    const r = await fetch(`http://127.0.0.1:${port}/api/send-reading`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'check@example.com', optIn, emojis, reading, ...signed }),
    });
    return { status: r.status, body: await r.json() };
  } finally { server.close(); }
}

let failed = 0;
function expect(name: string, got: any, want: Record<string, unknown>) {
  const ok = Object.entries(want).every(([k, v]) => got.body[k] === v) && got.status === 200;
  if (!ok) failed++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${got.status} ${JSON.stringify(got.body)}`);
}

expect('box checked, save works', await ask(async () => {}, true), { success: true, subscribed: true });
expect('box checked, save throws', await ask(async () => { throw new Error('5 NOT_FOUND'); }, true), { success: true, subscribed: false });
expect('box checked, save hangs past 2000 ms', await ask(() => new Promise(() => {}), true), { success: true, subscribed: false });
expect('box not checked', await ask(async () => { throw new Error('should not be called'); }, false), { success: true, subscribed: false });

// The real store, with FIREBASE_DATABASE_ID blank: it must refuse, not write to (default).
for (const blank of [undefined, '', '   ']) {
  if (blank === undefined) delete process.env.FIREBASE_DATABASE_ID; else process.env.FIREBASE_DATABASE_ID = blank;
  let msg = '';
  try { await saveSubscriber('check@example.com'); } catch (e: any) { msg = e.message; }
  const ok = msg.startsWith('FIREBASE_DATABASE_ID is not set');
  if (!ok) failed++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} store refuses with FIREBASE_DATABASE_ID=${JSON.stringify(blank)}: ${msg || '(no error)'}`);
}
delete process.env.FIREBASE_DATABASE_ID;
expect('real store, database id unset', await ask(undefined, true), { success: true, subscribed: false });

console.log(failed ? `${failed} failed` : 'all passed');
process.exit(failed ? 1 : 0);
