// Sends one email through Gmail, trying three connection settings, then the
// same three without the card if the attachment was the problem.
//
// Fact for the notice: Gmail files a copy of every message sent through its
// SMTP servers in the sending account's Sent Mail. So each reading emailed is
// kept there, with the address and the card, until it is deleted. From 21 Nov
// 2026, scripts/gmail-clear-sent.gs (installed in that account) deletes each
// one for good within a day; the notices say so.
import nodemailer from 'nodemailer';

const transports = (user: string, pass: string) => [
  { name: 'Gmail service', config: { service: 'gmail', auth: { user, pass }, connectionTimeout: 4000, socketTimeout: 6000 } },
  { name: 'SMTPS 465, IPv4', config: { host: 'smtp.gmail.com', port: 465, secure: true, family: 4, auth: { user, pass }, connectionTimeout: 4000, socketTimeout: 5000 } },
  { name: 'STARTTLS 587, IPv4', config: { host: 'smtp.gmail.com', port: 587, secure: false, family: 4, auth: { user, pass }, connectionTimeout: 4000, socketTimeout: 5000 } },
];

export async function sendMail(mail: { from: string; replyTo: string; to: string; subject: string; text: string; html: string }, cardBase64: string | null): Promise<{ fallback: boolean }> {
  const user = process.env.GMAIL_USER, pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error('Email configuration missing on server.');
  const tries = transports(user, pass);
  let last: unknown = null;

  for (const withCard of cardBase64 ? [true, false] : [false]) {
    for (const t of tries) {
      try {
        const options: any = { ...mail };
        if (withCard) options.attachments = [{ filename: 'emoujia-share-card.jpg', content: cardBase64, encoding: 'base64' }];
        else if (cardBase64) options.text += '\n\n(The card image was left off so the email would get through.)';
        await nodemailer.createTransport(t.config as any).sendMail(options);
        console.log(`[smtp] sent via ${t.name}${withCard ? ' with the card' : ''}`);
        return { fallback: !withCard && !!cardBase64 };
      } catch (err: any) {
        console.warn(`[smtp] ${t.name}${withCard ? ' with the card' : ''} failed: ${err?.message || err}`);
        last = err;
      }
    }
  }
  throw last || new Error('Every way of sending failed.');
}
