// Every API route, once. netlify/functions/api.ts serves it in production and
// server.ts in local development. No cross-origin headers anywhere: the studio
// site reaches these routes by rewrite, so to a browser they are same-origin.
//
// Errors always answer { error, code }:
//   invalid_input 400  the request is not what the route takes (nothing was sent to the model)
//   too_large     413  the body is over the route's limit
//   unsigned      403  /send-reading: the reading was not made by this server, or is over 24 hours old
//   resting       429  the studio's credit or spending limit at the model's company is used up
//   busy          429  the model's company is taking too many requests this minute; try again shortly
//   oracle_error  502  the model failed or answered in a shape we could not read
//   send_failed   502  the email did not go out
//   not_found     404
import express, { type NextFunction, type Request, type Response } from 'express';
import { readGrid, readThree, OracleError, InputError } from './readings';
import { validateThree } from '../src/lib/emoji';
import { signReading, verifyReading, type ReadingKind } from './sign';
import { buildReadingEmail } from './readingEmail';
import { sendMail } from './mailer';
import { saveSubscriber, subscribersCsv, exportAuthorized } from './store';
import { parseReading } from '../src/lib/grid';

export const LIMITS = {
  analyzeBody: '4mb',
  threeBody: '1kb',
  sendBody: '1mb',
  cardBytes: 600 * 1024,
  emailLength: 254,
};

const fail = (res: Response, status: number, code: string, error: string) => res.status(status).json({ error, code });

function oracleFail(res: Response, err: unknown) {
  if (err instanceof InputError) return fail(res, 400, 'invalid_input', err.message);
  if (err instanceof OracleError && err.code === 'resting') return fail(res, 429, 'resting', err.message);
  if (err instanceof OracleError && err.code === 'busy') return fail(res, 429, 'busy', err.message);
  if (err instanceof OracleError) return fail(res, 502, 'oracle_error', err.message);
  console.error('[api] unexpected:', (err as any)?.message || err);
  return fail(res, 502, 'oracle_error', 'Something went wrong between here and the machine.');
}

const withTimeout = <T>(p: Promise<T>, ms: number, label: string) =>
  Promise.race([p, new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms))]);

export function apiRouter() {
  const router = express.Router();

  // The screenshot reading.
  router.post('/analyze', express.json({ limit: LIMITS.analyzeBody }), async (req, res) => {
    try {
      const out = await readGrid(req.body?.image);
      res.json({ kind: 'grid', ...out, ...signReading('grid', out.emojis, out.reading) });
    } catch (err) { oracleFail(res, err); }
  });

  // The fallback reading: three emoji the person typed, in order. The check
  // runs before anything else; only the checked emoji reach the prompt.
  router.post('/read-three', express.json({ limit: LIMITS.threeBody, strict: true }), async (req, res) => {
    const checked = validateThree(req.body);
    if (checked.ok === false) return fail(res, 400, 'invalid_input', (checked as { reason: string }).reason);
    try {
      const out = await readThree(checked.emojis);
      res.json({ kind: 'three', ...out, ...signReading('three', out.emojis, out.reading) });
    } catch (err) { oracleFail(res, err); }
  });

  // Emails a reading this server made. Nothing about the reading is stored by
  // Emoujia; see server/mailer.ts for the copy Gmail keeps.
  router.post('/send-reading', express.json({ limit: LIMITS.sendBody }), async (req, res) => {
    const { email, optIn, kind, emojis, reading, issuedAt, signature, card } = req.body || {};
    if (typeof email !== 'string' || email.length > LIMITS.emailLength || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return fail(res, 400, 'invalid_input', 'That email address does not look right.');
    }
    if (!verifyReading({ kind, issuedAt, emojis, reading, signature })) {
      return fail(res, 403, 'unsigned', 'This reading can no longer be emailed. Readings can be emailed for 24 hours after they are made.');
    }
    let cardBase64: string | null = null;
    if (card != null) {
      const m = typeof card === 'string' ? card.match(/^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/) : null;
      const bytes = m ? Buffer.from(m[1], 'base64') : null;
      if (!bytes || bytes.length > LIMITS.cardBytes || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
        return fail(res, 400, 'invalid_input', 'The card must be a JPEG under 600 KB.');
      }
      cardBase64 = m![1];
    }

    // The essence comes from the signed text, never from the browser.
    const sections = parseReading(reading);
    const essence = sections.find((s) => s.header === 'THE ESSENCE')?.content.split('\n')[0] || '';
    const body = reading.split(/THE ESSENCE/i)[0].split('\n').map((l: string) => l.trim()).join('\n').trim();
    const appUrl = process.env.VITE_APP_URL || 'https://emoujia.com';

    try {
      // The address is kept only when the person checked the box.
      if (optIn === true) {
        try { await withTimeout(saveSubscriber(email), 2000, 'Subscriber save'); }
        catch (dbError: any) { console.warn('[db] subscriber save failed; sending the email anyway:', dbError?.message || dbError); }
      }
      const gmailUser = process.env.GMAIL_USER;
      if (!gmailUser || !process.env.GMAIL_APP_PASSWORD) return res.json({ success: true, warning: 'Email configuration missing on server.' });
      const result = await sendMail({
        from: `"Emoujia, a Wonder Valley Projects Lab" <${gmailUser}>`,
        replyTo: process.env.REPLY_TO || 'emoujia@wondervalleyprojects.com',
        to: email,
        ...buildReadingEmail(body, essence, appUrl, kind as ReadingKind),
      }, cardBase64);
      res.json({ success: true, fallback: result.fallback });
    } catch (err: any) {
      console.error('[send-reading] failed:', err?.message || err);
      fail(res, 502, 'send_failed', 'The email did not go out. Try again in a minute.');
    }
  });

  // Admin: subscriber CSV. Closed unless EXPORT_SECRET is set; then it needs
  // "Authorization: Bearer <EXPORT_SECRET>". The scheduled email lives in
  // netlify/functions/export-subscribers.mts.
  router.get('/admin/export-subscribers', async (req, res) => {
    if (!exportAuthorized(req.get('authorization'))) return fail(res, 404, 'not_found', 'Not found');
    try {
      const { csv } = await subscribersCsv();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=emoujia_subscribers.csv');
      res.send(csv);
    } catch (error: any) {
      console.error('[export] failed:', error?.message || error);
      fail(res, 500, 'export_failed', 'Export failed');
    }
  });

  router.all('*', (_req, res) => fail(res, 404, 'not_found', 'Not found'));

  // Body parser errors: too large, or not JSON.
  router.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    if (err?.type === 'entity.too.large') return fail(res, 413, 'too_large', 'That request is too large.');
    if (err?.type === 'entity.parse.failed' || err instanceof SyntaxError) return fail(res, 400, 'invalid_input', 'That request is not valid JSON.');
    next(err);
  });

  return router;
}
