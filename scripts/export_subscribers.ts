// Manual run of the subscriber export email: npx tsx scripts/export_subscribers.ts
import 'dotenv/config';
import { emailSubscriberExport } from '../server/store';

emailSubscriberExport()
  .then((count) => console.log(`Sent ${count} subscribers.`))
  .catch((err) => { console.error(err?.message || err); process.exit(1); });
