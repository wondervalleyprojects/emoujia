# Privacy

Plain account of where every piece of data goes. If this file and the code disagree, the code is wrong.

## The screenshot

1. You choose a screenshot. Your browser shrinks it to at most 1024 pixels on the long side and turns it into a JPEG.
2. It goes to `/api/analyze` on Netlify, which passes it to Google's Gemini API with the reading prompt.
3. Gemini returns the list of emoji and the reading text. The server passes them back to your browser.
4. Nothing is written to disk or to the database. Netlify's function logs record that a request happened, not its contents.

Google's free tier terms let Google use API inputs and outputs to improve its products, and human reviewers may read them. That is why the page says: "Your screenshot is read by Google's Gemini, which may use it to improve its models. We keep nothing." This is a logged exception (EMJ-001 Notes, allowed by Japhy Grant on 1 Nov 2026, review 1 May 2027). Moving to a paid tier or another engine that does not train on inputs would close it.

## The reading

The reading lives only in your browser tab. Close the tab and it is gone.

The share card is drawn in your browser. It is not uploaded unless you ask for the email.

## The email

If you type your address and ask for the email:

- The reading text, the essence and the share card image go to `/api/send-reading`, which sends one email through Gmail and forgets them. Nothing about the reading is stored.
- Replies go to emoujia@wondervalleyprojects.com, which reaches a person.

## The subscriber list

The only thing Emoujia keeps. Your email address is saved in Firestore (`subscribers/{email}`, with the time and the source) only if you check "Subscribe for more information." The box starts unchecked.

- Twice a month a scheduled job emails the list as a CSV to the studio for import into the Substack newsletter.
- To be removed, email emoujia@wondervalleyprojects.com with "Remove me" (the footer link does this). Removal leaves no trace unless you ask for one.

## On your device

If you choose Day or Night in the footer, that choice is saved in your browser's local storage so the page remembers it. It never leaves your device. Auto stores nothing.

## Not collected

The app adds no analytics, cookies, accounts, tracking pixels or fingerprinting.
