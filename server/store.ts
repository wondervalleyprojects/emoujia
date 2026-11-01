// The only thing Emoujia keeps: the email address of someone who checked
// "Subscribe for more information." Readings are never stored.
import { timingSafeEqual } from 'crypto';
import { stringify } from 'csv-stringify/sync';
import nodemailer from 'nodemailer';
import { initializeApp as initializeClientApp } from 'firebase/app';
import { getFirestore as getClientFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { cert, getApps, initializeApp as initializeAdminApp } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore, FieldValue } from 'firebase-admin/firestore';

const databaseId = process.env.FIREBASE_DATABASE_ID || '(default)';

// Admin credentials, either way:
// - FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY (with FIREBASE_PROJECT_ID).
//   Smallest; use this on Netlify, where functions share a 4KB env limit.
// - FIREBASE_SERVICE_ACCOUNT: the whole key file as JSON, raw or base64.
// With either, the server reads and writes as an admin and the public
// Firestore rules can deny everything. Without them, writes fall back to the
// client SDK and the subscriber export cannot run.
function adminCredential() {
  const email = process.env.FIREBASE_CLIENT_EMAIL;
  const key = process.env.FIREBASE_PRIVATE_KEY;
  if (email && key) {
    return cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: email, privateKey: key.replace(/\\n/g, '\n') });
  }
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  const json = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
  return cert(JSON.parse(json));
}

function adminDb() {
  const credential = adminCredential();
  if (!credential) return null;
  const app = getApps()[0] || initializeAdminApp({ credential });
  return getAdminFirestore(app, databaseId);
}

let clientDb: ReturnType<typeof getClientFirestore> | null = null;
function fallbackClientDb() {
  if (!clientDb) {
    const app = initializeClientApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
      appId: process.env.FIREBASE_APP_ID,
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    });
    clientDb = getClientFirestore(app, databaseId);
  }
  return clientDb;
}

export async function saveSubscriber(email: string): Promise<void> {
  const id = email.trim().toLowerCase();
  const admin = adminDb();
  if (admin) {
    await admin.collection('subscribers').doc(id).set(
      { email: id, subscribedAt: FieldValue.serverTimestamp(), source: 'emoujia' },
      { merge: true },
    );
    return;
  }
  await setDoc(
    doc(fallbackClientDb(), 'subscribers', id),
    { email: id, subscribedAt: serverTimestamp(), source: 'emoujia' },
    { merge: true },
  );
}

export async function subscribersCsv(): Promise<{ csv: string; count: number }> {
  const admin = adminDb();
  if (!admin) {
    throw new Error('Subscriber export needs FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY (or FIREBASE_SERVICE_ACCOUNT). The public Firestore rules do not allow listing subscribers.');
  }
  const snapshot = await admin.collection('subscribers').orderBy('subscribedAt', 'desc').get();
  const rows = snapshot.docs.map((d) => {
    const data = d.data();
    return {
      email: data.email,
      subscribedAt: data.subscribedAt?.toDate?.()?.toISOString?.() || '',
      source: data.source || '',
    };
  });
  return { csv: stringify(rows, { header: true }), count: rows.length };
}

// The export endpoint is closed unless EXPORT_SECRET is set, and then only
// answers a request carrying "Authorization: Bearer <EXPORT_SECRET>".
export function exportAuthorized(authorizationHeader: string | undefined | null): boolean {
  const secret = process.env.EXPORT_SECRET;
  if (!secret || !authorizationHeader?.startsWith('Bearer ')) return false;
  const given = Buffer.from(authorizationHeader.slice(7));
  const expected = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

// Emails the subscriber list as a CSV, for import into Substack.
export async function emailSubscriberExport(): Promise<number> {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (!gmailUser || !gmailPass) throw new Error('GMAIL_USER and GMAIL_APP_PASSWORD are required for the export email.');
  const { csv, count } = await subscribersCsv();
  const day = new Date().toISOString().split('T')[0];
  const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: gmailUser, pass: gmailPass } });
  await transporter.sendMail({
    from: { name: 'Emoujia', address: gmailUser },
    to: process.env.EXPORT_TO || gmailUser,
    subject: `Emoujia subscribers, ${day}`,
    text: `${count} subscribers, attached as CSV for the Substack import.\n\nSent by a machine for the Wonder Valley Projects Lab. Reviewed by a person: no.`,
    attachments: [{ filename: `emoujia-subscribers_${day}.csv`, content: csv }],
  });
  return count;
}
