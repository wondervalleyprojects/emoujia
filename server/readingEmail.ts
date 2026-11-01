// The reading email follows the studio's email rules: the reader's default
// font, black text, no colors or images in the body, links as words. The
// share card travels as an attachment.
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function buildReadingEmail(bodyText: string, essence: string, appUrl: string) {
  const signoff = [
    'Your reading was sent and not kept.',
    'Sent by a machine for the Wonder Valley Projects Lab. Reviewed by a person: no. Replies reach a person.',
  ];
  const text = [
    'Here is your Emoujia reading.',
    bodyText,
    essence ? `The essence: ${essence}` : '',
    `Read another: ${appUrl}`,
    '--',
    ...signoff,
  ].filter(Boolean).join('\n\n');

  const paras = bodyText.split(/\n+/).map((p) => p.trim()).filter(Boolean)
    .map((p) => (/^[A-Z ]+$/.test(p) ? `<p><b>${esc(p)}</b></p>` : `<p>${esc(p)}</p>`)).join('\n');
  const html = `<div>
<p>Here is your Emoujia reading.</p>
${paras}
${essence ? `<p><b>The essence:</b> ${esc(essence)}</p>` : ''}
<p><a href="${appUrl}">Read another</a></p>
<p>--<br>${signoff.join('<br>')}<br><a href="https://wondervalleyprojects.com">A Wonder Valley Projects Lab</a></p>
</div>`;
  return { subject: 'Your Emoujia reading', text, html };
}
