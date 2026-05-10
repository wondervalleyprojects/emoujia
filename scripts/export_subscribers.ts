import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';
import nodemailer from 'nodemailer';
import { stringify } from 'csv-stringify/sync';

const firebaseConfig = {
  projectId: 'gen-lang-client-0365094838',
  appId: '1:907908129152:web:26241f84d0c573d81ce165',
  apiKey: 'AIzaSyBe_EAD8EQiQX8R28CUGPC-d1ZcoshRd4Q',
  authDomain: 'gen-lang-client-0365094838.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-ba8645f8-a857-4aaf-afb0-8024a7560e64',
  storageBucket: 'gen-lang-client-0365094838.firebasestorage.app',
  messagingSenderId: '907908129152',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function exportAndEmail() {
  const adminEmail = 'japhy@wondervalleyprojects.com';
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    console.error("Gmail credentials missing for scheduled export.");
    return;
  }

  try {
    const q = query(collection(db, 'subscribers'), orderBy('subscribedAt', 'desc'));
    const snapshot = await getDocs(q);
    const subscribers = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        email: data.email,
        subscribedAt: data.subscribedAt?.toDate?.()?.toISOString?.() || '',
        source: data.source || ''
      };
    });

    if (subscribers.length === 0) {
      console.log("No subscribers to export.");
      return;
    }

    const csv = stringify(subscribers, { header: true });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass
      }
    });

    const senderEmail = 'emoujia@wondervalleyprojects.com';
    await transporter.sendMail({
      from: { name: "Emoujia System", address: senderEmail },
      replyTo: senderEmail,
      to: adminEmail,
      subject: "Emoujia: Bi-weekly Subscriber Export",
      text: "Attached is the latest subscriber list for your Substack import.",
      attachments: [
        {
          filename: `emoujia_subscribers_${new Date().toISOString().split('T')[0]}.csv`,
          content: csv
        }
      ]
    });

    console.log("Export sent to", adminEmail);
  } catch (error) {
    console.error("Failed to run scheduled export:", error);
  }
}

exportAndEmail();
