# Privacy

Plain account of where every piece of data goes. If this file and the code disagree, the code is wrong.

State, 21 Nov 2026 (0.3.0): written from the code and from Anthropic's, Google's and Netlify's terms as read on 20 and 21 Nov. Not yet checked against a real call on the deploy preview; that check comes next. On 21 Nov Japhy chose Claude Sonnet 5.5 alone, with no Google fallback; the notices below are PROPOSED from that and wait for his approval.

## The screenshot reading

1. You choose a screenshot. It stays in your browser while you crop it. Only the part inside the box leaves your device, shrunk to at most 1024 pixels on the long side and turned into a JPEG. Choosing "Send the whole screenshot" sends all of it.
2. It goes to `{api}/analyze`. On the studio site that address is on wondervalleyprojects.com and is passed, by rewrite, to Emoujia's Netlify function. The function passes it to Anthropic's Claude API with the reading prompt.
3. Claude returns the list of emoji and the reading text. The server signs them (below) and passes them back to your browser.
4. Emoujia writes nothing to disk or to the database. Netlify's function log records the time, the method and the path of each request. If Claude fails, it records the model's name and Anthropic's error message. It never records the image, the emoji or the reading.

## The three-emoji reading

For someone who cannot bring a screenshot. You type the three emoji you use most.

1. They go to `{api}/read-three` as three emoji and nothing else. The server refuses anything else before the model is called: no text you type ever reaches the model.
2. The function puts the three emoji into the fallback prompt and sends it to Claude. Nothing else about you goes with them.
3. As above: the reading comes back signed, Emoujia keeps nothing, and the log records only that a request happened.

## What the model's company does with what is sent

From 21 Nov 2026 both readings go to Anthropic's Claude; that section is below. Until then they went to Google's Gemini on the free tier, and the Google terms are kept here for the record and in case a Gemini model is ever put back. Read 20 Nov 2026: [Gemini API Additional Terms of Service](https://aistudio.google.com/docs/terms), effective 23 March 2026.

**Google free tier (what Emoujia used until 21 Nov 2026):**

- Google uses what is submitted, and what it answers, "to provide, improve, and develop Google products and services and machine learning technologies."
- Human reviewers may read, annotate and process the input and output. Google first disconnects it from the account, key and project.
- The terms tell API users not to submit sensitive, confidential or personal information.
- No retention period is stated.
- Only paid services may be offered to people in the European Economic Area, Switzerland or the United Kingdom.

**Google paid tier (never used):**

- Google does not use the prompts or the answers to improve its products.
- Google logs prompts and answers "for a limited period of time," only to detect and prevent policy violations. No period is stated.
- The paid terms do not mention human review.

**Both Google tiers:** users of the API must be 18 or older, and an app built on it must not be aimed at, or likely to be used by, people under 18. The terms also say the API is "not for consumer use." [EMJ-001: JAPHY'S DECISION ON THESE TERMS]

### Anthropic's Claude (the only reading model from 21 Nov 2026; not live until the key is set in Netlify)

Japhy chose Claude Sonnet 5.5 as the only reading model on 21 Nov 2026. With the default settings no reading goes to Google; the Google terms above apply only if someone puts a Gemini model back in `READING_MODELS`. Read 21 Nov 2026: [Commercial Terms](https://www.anthropic.com/legal/commercial-terms), effective 17 June 2025; [Usage Policy](https://www.anthropic.com/legal/aup), effective 12 Nov 2026; Anthropic's privacy pages on [retention](https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data) and [training](https://privacy.claude.com/en/articles/7996868-is-my-data-used-for-model-training).

- Training: "Anthropic may not train models on Customer Content from Services."
- Kept: Anthropic deletes what is sent, and what it answers, within 30 days. If its automatic checks flag a request as breaking its usage policy, it may keep that request for up to 2 years.
- Deleting on request: "For paid API customers, we do not support ad hoc deletion." So the studio cannot have one reading removed early.
- Human review: the pages read do not say plainly whether staff read ordinary requests. The retention page speaks of "limited data retention and review as a part of our safety work" for some models. The notice takes the careful reading: Anthropic may look at what is sent, for safety, during the 30 days.
- There is no free tier.
- The United Kingdom, Switzerland and the EEA countries are on Anthropic's [Supported Regions](https://www.anthropic.com/supported-countries) list (effective 12 Nov 2026).
- An organization that lets people under 18 use its product directly must add safeguards (age checks, filtering, a public statement of compliance). The page does not say what a general-audience product owes. [EMJ-001]
- The terms open with "Services under these Terms are not for consumer use." Section A.1 allows using the service to power products for the customer's own end users. [EMJ-001: JAPHY'S READING OF THIS]
- A product where people talk to an AI must say so. The casing line does.

The Google free terms are why the page said: "Your screenshot is read by Google's Gemini, which may use it to improve its models. We keep nothing." That disclosure is a logged exception (EMJ-001 Notes, allowed by Japhy Grant on 1 Nov 2026, review 1 May 2027). "We keep nothing" was retired by Public Wonder V5 (PW-V5-05). With Claude alone, nothing is offered for training. Japhy closed the exception on 21 Nov 2026 (draft Register note: `docs/EMJ-001_Register-note_DRAFT.md`; decision record: `docs/adr/ADR-001.md`). The replacement notices:

- Screenshot reading (PROPOSED; revised at Japhy's word, 21 Nov 2026; last two sentences PROPOSED the same day, from his decision to clear Sent Mail daily): "The part of the screenshot you send is read by Anthropic's Claude. Anthropic does not train its models on it. It keeps it for up to 30 days, may look at it in that time for safety, and keeps it longer only if its checks flag it: Anthropic's retention page [linked]. The studio does not store the screenshot. If you ask for the reading by email, a copy of that email, with your address, stays in the studio's Gmail for up to a day, then is deleted."
- Three-emoji reading (PROPOSED): "Only the three emoji are sent. They are read by Anthropic's Claude, on the same terms as a screenshot."

## The reading

The reading lives only in your browser tab. Close the tab and it is gone from Emoujia, unless you asked for the email: then a copy of that email stays in the studio's Gmail for up to a day (below).

**Signed, not stored.** When the server makes a reading it signs it: a code made from the reading's kind, its emoji, its text and the time, with a secret only the server holds. The signature travels with the reading in your browser. The studio keeps no copy and no list. The email route checks the signature, so it can send only readings this server made, unchanged, in the last 24 hours. A signature cannot stop the same reading being emailed more than once in those 24 hours, because that would mean keeping a list.

The share card is drawn in your browser. It is not uploaded unless you ask for the email.

## The email

If you type your address and ask for the email:

- The signed reading, your address and the share card go to `{api}/send-reading`. The server checks the signature, takes the essence from the signed text, and sends one email through the studio's Gmail account.
- **Gmail keeps a copy, for up to a day.** Every message sent through Gmail's servers is filed in the sending account's Sent Mail, with the address it went to and the card. Japhy decided on 21 Nov 2026 that these copies are cleared daily. A script in the sending account (`scripts/gmail-clear-sent.gs`, installed as in OPERATIONS) runs every hour and permanently deletes each reading email once it is 23 hours old, so none stays a full day. It deletes, not trashes: Trash would keep it 30 more days. It touches only messages whose subject is exactly "Your Emoujia reading" and whose sender is "Emoujia, a Wonder Valley Projects Lab" at that account; replies to visitors and the subscriber export are left alone. Public notice (PROPOSED): "If you ask for the reading by email, a copy of that email, with your address, stays in the studio's Gmail for up to a day, then is deleted." [CONFIRM ON THE PREVIEW: a test email appears in Sent Mail, and is gone a day later] Earlier versions of this file said nothing about the reading is stored; that was not true of the sent email.
- If you checked the box, your address is also saved to the subscriber list (below). That is separate from the email copy.
- Replies go to emoujia@wondervalleyprojects.com, which reaches a person.

## The subscriber list

The only thing Emoujia itself keeps. Your email address is saved only if you check the box under the email field. The box starts unchecked.

Its label (PROPOSED, 20 Nov 2026, for Japhy to approve or replace): "Tell me about new labs. It comes from Japhy Grant's Substack, a few times a year, along with his other writing."

What happens to the address, exactly, so the label can be checked against it:

1. Saved in Firestore (`subscribers/{email}`) with the time and the source, "emoujia". If the save fails, the page says so under "Sent" and offers to try again; the address is then not on the list.
2. On the 1st and 15th of each month a scheduled job emails the whole list as a CSV to the studio's Gmail (`EXPORT_TO`, or `GMAIL_USER`). That email also stays in Gmail.
3. A person imports the CSV into Japhy Grant's Substack by hand. From then on Substack holds the address under its own terms and sends what Japhy publishes there. [HOW OFTEN THE SUBSTACK SENDS, AND WHAT]
4. To be removed, email emoujia@wondervalleyprojects.com with "Remove me" (the footer link on emoujia.com does this). The address is deleted from Firestore and from Substack. Copies in old CSV emails in Gmail stay until deleted. [CONFIRM: THE OLD CSV EMAILS ARE DELETED TOO]

## Limits per visitor

Netlify counts requests per visitor address at its edge and refuses more than ten a minute (three emails in three minutes). The studio stores nothing for this and cannot see who was refused.

## On your device

On emoujia.com, if you choose Day or Night in the footer, that choice is saved in your browser's local storage so the page remembers it. It never leaves your device. Auto stores nothing. Inside the studio site the embed stores nothing; the site's own light switch is the site's.

## Not collected

Emoujia adds no analytics, cookies, accounts, tracking pixels or fingerprinting.
