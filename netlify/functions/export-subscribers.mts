// Scheduled: emails the subscriber CSV on the 1st and 15th of each month,
// 16:00 UTC (8 or 9 a.m. in Los Angeles).
import { emailSubscriberExport } from '../../server/store';

export default async () => {
  try {
    const count = await emailSubscriberExport();
    console.log(`[export] Sent ${count} subscribers.`);
    return new Response('ok');
  } catch (err: any) {
    console.error('[export] Failed:', err?.message || err);
    return new Response('failed', { status: 500 });
  }
};

export const config = { schedule: '0 16 1,15 * *' };
