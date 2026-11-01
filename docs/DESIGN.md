# Design

Emoujia wears Public Wonder, the Wonder Valley Projects design system (V4), in its Lab face. The deck and the Specimen are the sources of truth; this file says how they apply here.

## Face and light

- **Lab night** is the default on screens: Ink `#0A0E2A` ground, white text, muted `#B4BAD6`, Signal `#FA3A6B` for the invitation bracket, the log marks and the trace line.
- **Lab day** is Ink on white with Signal Deep `#D11E50` as the accent.
- The footer offers **Auto, Day, Night** as plain text links. Auto follows the system setting.
- The emoji are the only color. The studio adds none of its own beyond the Lab palette.

Tokens live at the top of `src/index.css` under the names used by `public-wonder-tokens.css` 2027.5 (`--pw-color-*`, `--pw-role-*`, `--pw-motion-*`). Components use roles, not hex codes, except the band and the share card, which are always Lab night.

## Type

| Use | Face | Fallback |
| --- | --- | --- |
| Hero, essence, buttons, the name | Shapiro 75 Heavy | Barlow 700 |
| Labels (margin column, masthead) | Shapiro 75 Heavy Wide, spaced caps | Barlow 700 |
| Interface text | Shapiro 45 Welter Text | Barlow 400 |
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

1080 by 1080, Lab night, drawn on a canvas in the browser (`src/lib/shareCard.ts`). Masthead strip; Ruling sign, Essence and The grid as margin labels; the ruling emoji at 300px; the Essence in Shapiro Heavy, two lines at 58px when it fits; nine emoji from the grid; the trace band; the bug and the Record line. "Wonder Valley Projects Lab" and the labels in Shapiro Wide, the Essence in Shapiro Heavy, everything else in DM Mono. The approved comp is `docs/comps/share-card-E-final.png`.

## Motion

V4 tokens only: 150ms for hover and focus, 80ms for press, 240ms steps. The band plots once over 1.2 seconds at an even speed, then holds. The waiting log adds a line every 1.6 seconds and stops when the lines run out; nothing loops. Under reduced motion everything is instant.

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
