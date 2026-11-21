# Privacy

Plain account of where every piece of data goes. If this file and the code disagree, the code is wrong.

State, 20 Nov 2026 (0.3.0): written from the code and from Google's and Netlify's terms as read that day. Not yet checked against a real Gemini call on the deploy preview; that check comes next. The public notices are waiting on Japhy's choice of the free or paid Gemini tier. They show as brackets until then.

## The screenshot reading

1. You choose a screenshot. It stays in your browser while you crop it. Only the part inside the box leaves your device, shrunk to at most 1024 pixels on the long side and turned into a JPEG. Choosing "Send the whole screenshot" sends all of it.
2. It goes to `{api}/analyze`. On the studio site that address is on wondervalleyprojects.com and is passed, by rewrite, to Emoujia's Netlify function. The function passes it to Google's Gemini API with the reading prompt.
3. Gemini returns the list of emoji and the reading text. The server signs them (below) and passes them back to your browser.
4. Emoujia writes nothing to disk or to the database. Netlify's function log records the time, the method and the path of each request. If Gemini fails, it records the model's name and Google's error message. It never records the image, the emoji or the reading.

## The three-emoji reading

For someone who cannot bring a screenshot. You type the three emoji you use most.

1. They go to `{api}/read-three` as three emoji and nothing else. The server refuses anything else before the model is called: no text you type ever reaches the model.
2. The function puts the three emoji into the fallback prompt and sends it to Gemini. Nothing else about you goes with them.
3. As above: the reading comes back signed, Emoujia keeps nothing, and the log records only that a request happened.

## What Google does with what is sent

Both readings go to the Gemini API under the key's terms. Read 20 Nov 2026: [Gemini API Additional Terms of Service](https://aistudio.google.com/docs/terms), effective 23 March 2026.

**Free tier (what Emoujia uses today):**

- Google uses what is submitted, and what it answers, "to provide, improve, and develop Google products and services and machine learning technologies."
- Human reviewers may read, annotate and process the input and output. Google first disconnects it from the account, key and project.
- The terms tell API users not to submit sensitive, confidential or personal information.
- No retention period is stated.
- Only paid services may be offered to people in the European Economic Area, Switzerland or the United Kingdom.

**Paid tier (not in use; Japhy decides):**

- Google does not use the prompts or the answers to improve its products.
- Google logs prompts and answers "for a limited period of time," only to detect and prevent policy violations. No period is stated.
- The paid terms do not mention human review.

**Both tiers:** users of the API must be 18 or older, and an app built on it must not be aimed at, or likely to be used by, people under 18. The terms also say the API is "not for consumer use." [EMJ-001: JAPHY'S DECISION ON THESE TERMS]

This is why the page said: "Your screenshot is read by Google's Gemini, which may use it to improve its models. We keep nothing." That disclosure is a logged exception (EMJ-001 Notes, allowed by Japhy Grant on 1 Nov 2026, review 1 May 2027). "We keep nothing" was retired by Public Wonder V5 (PW-V5-05). The replacement notices:

- Screenshot reading: [SCREENSHOT NOTICE: FROM THE TIER JAPHY CHOOSES]
- Three-emoji reading: [THREE EMOJI NOTICE: FROM THE TIER JAPHY CHOOSES]

## The reading

The reading lives only in your browser tab. Close the tab and it is gone from Emoujia.

**Signed, not stored.** When the server makes a reading it signs it: a code made from the reading's kind, its emoji, its text and the time, with a secret only the server holds. The signature travels with the reading in your browser. The studio keeps no copy and no list. The email route checks the signature, so it can send only readings this server made, unchanged, in the last 24 hours. A signature cannot stop the same reading being emailed more than once in those 24 hours, because that would mean keeping a list.

The share card is drawn in your browser. It is not uploaded unless you ask for the email.

## The email

If you type your address and ask for the email:

- The signed reading, your address and the share card go to `{api}/send-reading`. The server checks the signature, takes the essence from the signed text, and sends one email through the studio's Gmail account.
- **Gmail keeps a copy.** Every message sent through Gmail's servers is filed in the sending account's Sent Mail. So each emailed reading, with the address it went to and the card, stays in the studio's Gmail until someone deletes it. [CONFIRM ON THE PREVIEW: look in the sending account's Sent Mail after a test email]. Earlier versions of this file said nothing about the reading is stored; that was not true of the sent email.
- Replies go to emoujia@wondervalleyprojects.com, which reaches a person.

## The subscriber list

The only thing Emoujia itself keeps. Your email address is saved only if you check the box under the email field. The box starts unchecked.

Its label (PROPOSED, 20 Nov 2026, for Japhy to approve or replace): "Tell me about new labs. It comes from Japhy Grant's Substack, a few times a year, along with his other writing."

What happens to the address, exactly, so the label can be checked against it:

1. Saved in Firestore (`subscribers/{email}`) with the time and the source, "emoujia".
2. On the 1st and 15th of each month a scheduled job emails the whole list as a CSV to the studio's Gmail (`EXPORT_TO`, or `GMAIL_USER`). That email also stays in Gmail.
3. A person imports the CSV into Japhy Grant's Substack by hand. From then on Substack holds the address under its own terms and sends what Japhy publishes there. [HOW OFTEN THE SUBSTACK SENDS, AND WHAT]
4. To be removed, email emoujia@wondervalleyprojects.com with "Remove me" (the footer link on emoujia.com does this). The address is deleted from Firestore and from Substack. Copies in old CSV emails in Gmail stay until deleted. [CONFIRM: THE OLD CSV EMAILS ARE DELETED TOO]

## Limits per visitor

Netlify counts requests per visitor address at its edge and refuses more than ten a minute (three emails in three minutes). The studio stores nothing for this and cannot see who was refused.

## On your device

On emoujia.com, if you choose Day or Night in the footer, that choice is saved in your browser's local storage so the page remembers it. It never leaves your device. Auto stores nothing. Inside the studio site the embed stores nothing; the site's own light switch is the site's.

## Not collected

Emoujia adds no analytics, cookies, accounts, tracking pixels or fingerprinting.
