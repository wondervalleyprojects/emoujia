# Design

Emoujia wears Public Wonder, the Wonder Valley Projects design system, in its Lab face. It was built to V4 and, from 0.3.0, takes its token names and font families from the studio site's (V5). Where the two differed, the site won. The deck and the Specimen are the sources of truth; this file says how they apply here.

## Face and light

- **Lab night** is the default on screens: Ink `#0A0E2A` ground, white text, muted `#B4BAD6`, Signal `#FA3A6B` for the invitation bracket, the log marks and the trace line.
- **Lab day** is Ink on white with Signal Deep `#D11E50` as the accent.
- The footer offers **Auto, Day, Night** as plain text links. Auto follows the system setting.
- The emoji are the only color. The studio adds none of its own beyond the Lab palette.

Inside the studio site the embed uses the site's tokens, type and light. On emoujia.com, `src/standalone.css` defines the same names. Components use roles, not hex codes, except the band and the share card, which are always Lab night. The embed has no light switch; it follows its host.

### What changed from V4 to the site's names (20 Nov 2026)

| Emoujia 0.2.0 | The site, and Emoujia from 0.3.0 |
| --- | --- |
| `--pw-font-heavy`, family "Shapiro Heavy", weight 700 | `--pw-font-display`, family "Shapiro", weight 400 |
| `--pw-font-wide`, "Shapiro Wide" at 700 | `--pw-font-label`, "Shapiro Wide" at 400 |
| `--pw-ease` | `--pw-motion-ease` (same curve) |
| `--pw-role-hover` (a set color) | none; the tint is mixed from the text color |
| none | `--pw-role-accent-text` |
| `--pw-font-emoji` | none; the embed keeps its own emoji stack |
| Light on `:root[data-light]`, night by default | The site: `html[data-site-face="lab"]` with `data-theme`, day by default. emoujia.com keeps night by default and its own switch |
| 44px, 6px, 3px, 4px written in | `--pw-tap-min`, `--pw-sheet-bracket-open`, `--pw-sheet-bracket-underline`, `--pw-sheet-arrow-nudge` |
| Record line 13px | `--pw-record-web` 15px (13px minimum, `--pw-record-web-min`, for the casing line) |
| Barlow as stand-in | The site: Arial. emoujia.com: Barlow, through each Shapiro face's own source list |

The site sets `font-synthesis: none`; so does the embed, so Shapiro is never faked bold. Lab day and Lab night role colors are the same values in both. The site's `tokens.css` header still says "Version 4"; that file is the site's.

## Type

| Use | Face | Fallback |
| --- | --- | --- |
| Hero, essence, buttons, the name | Shapiro 75 Heavy, as "Shapiro" | Arial Black (site), Barlow 700 (emoujia.com) |
| Labels (margin column, masthead) | Shapiro 75 Heavy Wide, spaced caps | Arial (site), Barlow 700 (emoujia.com) |
| Interface text | Shapiro 45 Welter Text | Arial (site), Barlow 400 (emoujia.com) |
| The machine's words, the Record line, the casing line, the log | DM Mono | |

The reading itself is set in DM Mono because it is the machine's own words, the Lab's stated exception. Labels are never mono.

Shapiro is licensed and never committed to this public repo. See [Operations](OPERATIONS.md#fonts). Barlow, the system's sanctioned stand-in, fills in until the files are deployed.

## Composition

- **Masthead strip:** a rule, then who (Wonder Valley Projects Lab), what (Emoujia), when.
- **Labels in the margin:** every section label sits in a 184px column on wide screens and stacks above on phones.
- **The band is a field:** the trace sits on its own Ink plate at the top of the reading. No text on it.
- **Color fields, not heavy rules:** sections are separated by hairlines.
- Corners are 0. No shadows, glows, blur, gradients (the bug's fade is the only one), cards or pills.

## The Emoujia pattern

Slots joined in triads. Each of the grid's emoji is a slot on a 24px Ink grid with Studio Blue lines. Each slot sits on one of four steps, chosen from the emoji's code points, so every grid draws a different trace. One Signal line joins the slots three at a time. A Studio Blue tick under each triad marks the group. Code: `src/lib/grid.ts` (`traceSteps`), `src/components/TraceBand.tsx`, `src/lib/shareCard.ts`.

## The share card (comp E)

1080 by 1080, Lab night, drawn on a canvas in the browser (`src/lib/shareCard.ts`), with the fonts its host page declares (read from the mount's `--pw-font-label`, `--pw-font-display`, `--pw-font-mono`). Checked on the stub host: Shapiro Heavy, Shapiro Wide and DM Mono all drew. "KEPT BY NO ONE" is retired (PW-V5-05); until Japhy supplies its replacement the card shows [SHARE CARD LINE] and is not to ship. A three-emoji card labels its row THE THREE (PROPOSED) and shows two emoji after the ruling sign. Masthead strip; Ruling sign, Essence and The grid as margin labels; the ruling emoji at 300px; the Essence in Shapiro Heavy, two lines at 58px when it fits; nine emoji from the grid; the trace band; the bug and the Record line. "Wonder Valley Projects Lab" and the labels in Shapiro Wide, the Essence in Shapiro Heavy, everything else in DM Mono. The approved comp is `docs/comps/share-card-E-final.png`.

## Motion

V4 tokens only: 150ms for hover and focus, 80ms for press, 240ms steps. The band plots once over 1.2 seconds at an even speed, then holds. The waiting log adds a line every 1.6 seconds and stops when the lines run out; nothing loops. Under reduced motion everything is instant.

## The embed

No header, footer, masthead, light switch or page title of its own: the host supplies them. Labels sit in the margin column when the mount is at least 720px wide (a container query, so it follows the mount, not the window). The order: the invitation and the three steps; one small line for people without a screenshot; the waiting log; the reading with the band, the casing line and the Record line; the share card and the email; after a three-emoji reading, the offer to come back with a screenshot; "Build with the Lab" if the host gives it.

**Crop.** Before a screenshot is sent, the person sees it with a box over the keyboard and the rest shaded with four plain fields (no shadows). Drag the box or a corner; arrow keys move it, Shift and arrow keys change its size; the screen reader hears its size. "Read this part" sends only what is inside; "Send the whole screenshot" sends all of it.

**The fallback field.** One plain text field, emoji at 28px, counting "1 of 3" as the person types, refusing anything that is not an emoji. Nothing is offered to pick from.

## Controls

- **The invitation bracket** `[READ MY EMOJI]` is a real button in DM Mono Medium, in the accent. On hover or focus it opens 6px each side and gains a 3px underline. Screen readers hear "Your part: read my emoji."
- **Buttons** are outlined, take the hover tint, nudge the arrow 4px and settle 1px on press. They never flood solid.
- Tap targets are at least 44px.

## Machine work, labeled

- "The words below are the machine's own. No person reviewed them."
- `CASING · MODEL GEMINI-2.5-FLASH · EDITS 0`, naming the model that actually answered.
- The Record line at the foot of the reading and on the card: `RECORD · LAB · EMOUJIA · [DATE] · MACHINE UNREVIEWED`. Under 480px it stacks one field per row; screen readers hear each field by name.

## The bug

`public/wvp-bug.svg` is the master (LOGO-001), never redrawn or faded. 40px in the header and footer, 48px on the card, and the favicon.
