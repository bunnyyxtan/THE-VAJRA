# Vajra UX Architecture — NN/g Research: Data Display & Readability for Technical/Financial Information

Compiled from live nngroup.com sources (fetched current turn). Supplements from non-NN/g sources are explicitly labeled.

---

## 1. CORE THEORY

### 1.1 People scan; they don't read (Morkes & Nielsen, 1997)
- In NN/g's original web-reading study, **79% of test users always scanned any new page; only 16% read word-by-word**. (Source: https://www.nngroup.com/articles/how-users-read-on-the-web/)
- Follow-up experiment (5 versions of the same site): concise text = **+58%** measured usability; scannable layout = **+47%**; objective language = **+27%**; combined = **+124%** usability vs. control. (Same source; 1998 write-up of a technical-whitepaper rewrite reported +159%: https://www.nngroup.com/articles/applying-writing-guidelines-web-pages/)
- Theory: cognitive load — concise, scannable, objective content reduces processing cost. Users "detested marketese"; promotional language itself imposes a filtering burden.

### 1.2 F-pattern and other scanning patterns (NN/g eyetracking, 2006-2019)
- Original study (Jakob Nielsen, April 2006): **232 users**, thousands of pages. Dominant pattern: two horizontal stripes (top bar, shorter second bar) + vertical scan down the left = "F". (https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content-discovered/)
- 2017 replication confirmed F-pattern on desktop AND mobile; mirrored F in right-to-left languages. Heatmaps cited aggregate 45-47 participants. (https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/)
- Implications NN/g states explicitly: **first lines get more gazes than later lines; first few words on the left of each line get more fixations than words to the right.**
- 2019 taxonomy (Budiu): 4 text-scanning patterns — F-pattern, spotted, layer-cake, commitment — plus zigzag (the closest NN/g analogue to "Z-pattern") for image-heavy layouts. F-pattern is framed as *bad* for users and businesses; antidotes: meaningful subheadings, bullets, front-loading, keyword styling. (https://www.nngroup.com/articles/text-scanning-patterns-eyetracking/)
- Horizontal attention leans left: **users spend ~80% of viewing time on the left half of the page vs. 20% on the right** (2017 study, Pernice). (https://www.nngroup.com/articles/horizontal-attention-leans-left/)

### 1.3 Numerals stop the wandering eye (Nielsen, 2007)
- Eyetracking gaze replays showed **numerals attract fixations even inside ignored text**, because digit-shapes differ from letter-shapes in peripheral vision. (https://www.nngroup.com/articles/web-writing-show-numbers-as-numerals/)
- Corollaries: digits = compact "hard information"; stating exact numbers (e.g., "2,692 users") boosts credibility; most people can't interpret numbers above a billion — explain big numbers and unusual units ("1 TB" failed with e-commerce users).

### 1.4 Short-term memory limits & chunking (Nielsen, 2009)
- STM holds **~7 chunks**, fading in **~20 seconds**. (https://www.nngroup.com/articles/short-term-memory-and-web-usability/)
- "The computer carries the burden of remembering the obscure code" — NN/g explicitly recommends encoding obscure codes into links/state rather than making users remember or re-enter them (coupon-code example).
- Top 25% of users are 2.4x better than bottom 25%; only ~5% of population can do complex inferential computer tasks — design for limited-capacity brains.
- Related heuristic #6 (Recognition rather than recall, 1994): keep important info visible; don't make users memorize data across screens. (https://www.nngroup.com/articles/ten-usability-heuristics/)

### 1.5 Response-time limits: 0.1 / 1.0 / 10 seconds (Nielsen 1993; roots in Miller 1968, Card et al. 1991)
- **0.1 s** = feels instantaneous/direct manipulation; **1.0 s** = flow of thought uninterrupted (user notices delay); **10 s** = limit of attention — beyond it, show progress feedback with expected completion (percent-done) and a way to interrupt. (https://www.nngroup.com/articles/response-times-3-important-limits/)
- Progress indicators (2014, Whitenton): wait animations/percent-done bars "reduce uncertainty"; users wait longer and are more satisfied with dynamic progress indicators; cites Myers (1985) CHI paper on percent-done indicators. (https://www.nngroup.com/articles/progress-indicators/)
- "When the UI Is Too Fast" (2013): users overlook changes that happen too fast; transient states can be missed. (https://www.nngroup.com/articles/ui-too-fast/) — relevant to very fast chains.

### 1.6 Tables vs. cards (Budiu, 2022)
- Tables' advantages: **scalability** (rows/columns) and **comparison support** — adjacent cells are compared without eye travel or working-memory load; card grids force "spatial reorientation" per card, making comparison "cognitively effortful and slow." (https://www.nngroup.com/articles/data-tables/)
- Tables must support 4 tasks: find records by criteria, compare data, view/edit/add a row, take action on records. Inline actions OK for 1-2; more = batch actions or menus (but hover-hidden actions hurt discoverability).
- Mobile tables (2017): keep columns legible without zoom; number-heavy tables can fit more columns than wordy ones; stick headers and left column; indicate horizontal scrolling. (https://www.nngroup.com/articles/mobile-tables/)

### 1.7 Date/time display & input (Budiu, 2017)
- Spell out month names to avoid 10/11/2016 ambiguity across locales; label date components; mark "today" to anchor the user; don't require special characters; disable illogical dates. (https://www.nngroup.com/articles/date-input/)

### 1.8 Tooltips and hidden info (2019)
- **Never put task-vital information in tooltips** — tooltips disappear, forcing working-memory burden; use them only for supplementary explanation; support keyboard hover; don't block related content. (https://www.nngroup.com/articles/tooltip-guidelines/)

---

## 2. NN/g'S SPECIFIC GUIDELINES (granular do/don't)

**Numbers**
- DO write numbers as digits, not words (23, not twenty-three) — even at sentence start.
- DO use thousands separators for big numbers (2,000,000) up to ~billion; write magnitude as a word beyond that ("24 billion").
- DO explain unusual units/abbreviations; DO state exact counts for credibility.
- DON'T expect users to parse many-digit raw numbers or exotic units without aid.

**Layout & scanability**
- DO front-load: conclusions and key facts first (inverted pyramid); first words of lines carry the most weight.
- DO use meaningful subheadings, bullets, bold keywords; one idea per paragraph; ~half the word count of print.
- DON'T use "clever" headings, marketese, or fancy formatting that looks like an ad (banner blindness: users ignored the US Census population clock; task success 14%).
- DO put the most important info on the left (80/20 left/right attention split).

**Identifiers & codes**
- DON'T require users to memorize or transcribe obscure codes between screens; let the system carry the code (heuristic #6 recognition-over-recall; coupon-code guidance).
- DO keep vital info persistently visible, not in tooltips/hover states.
- DO size text fields to expected input; full entry must be visible (form guideline #6, web-form-design).

**Tables vs cards**
- DO use tables for dense multivariate data, comparison, finding/filtering records; cards for visual browsing where comparison isn't the task.
- DON'T hide row actions behind hover-only menus (discoverability/accessibility hit).
- On mobile: keep columns legible, sticky headers/left column, signal horizontal scroll.

**Dates/times**
- DO spell out month names ("3 Nov 2026", not 11/03/26); DO label components; DO say "today"; DON'T accept/emit ambiguous numeric-only dates for global audiences.

**Wait states / status**
- DO show dynamic progress indicators with expected completion for anything >10 s; keep attention in the 1-10 s band with clear working feedback; give a way to interrupt/cancel.
- DO make system status continuously visible (heuristic #1).
- DON'T flash states too fast to perceive ("UI too fast" effect).

---

## 3. APPLICATION TO VAJRA (actionable rules)

1. **Two-tier amount display, MON-primary / wei-secondary.** Per NN/g's numerals + big-number guidance: humans cannot parse 18-digit integers. Primary display: exact MON with full decimals as entered (e.g., "12.50000000 MON"), tabular-numeral font. Wei value (12500000000000000000) available via an expandable "technical details" row — never the primary readout. On the sender payment page, the amount is the single most-scanned fact: largest type, top-left of the content area (F-pattern top bar, 80/20 left bias).

2. **Truncate hex addresses as head + tail (`0x1a2b…9z8y`), monospace, with a one-tap copy button.** NN/g has no hex-specific standard, but recognition-over-recall + "system carries the obscure code" directly imply: users verify identity by pattern-matching the head/tail, never by reading 42 chars. Rationale: first/last chars are what fixations land on (F-pattern: line starts dominate); the tail is what differs between lookalike addresses. Copy button eliminates transcription (STM ~7 chunks / 20 s makes manual copying of 42 hex chars error-prone by design). Pair with a visual identicon for recognition. Full address available on tap-expand + always copyable. (Non-NN/g supplement: EIP-55 checksummed casing — keep it, don't lowercase.)

3. **Tables for the activity/history page; cards only if browsing is the task.** History rows (status, amount, counterparty, time, expiry) are multivariate and comparison-heavy — exactly NN/g's table use case. Keep status and amount as the leftmost columns; sticky header on mobile; 1-2 inline actions max (e.g., "Copy link"), rest behind an overflow menu.

4. **Front-load verification facts on the sender page in F-order.** Reading order: (1) amount, (2) recipient/identicon, (3) memo/terms, (4) expiry, (5) technical details (request ID, chain ID, contract). Exact figures as numerals, thousands-separated. One idea per line; no prose paragraphs. This matches the "first lines / first words get the fixations" finding.

5. **Countdown-to-expiry as a labeled, absolute + relative hybrid.** Show "Expires in 14 m 32 s" with the absolute deadline on hover/expand spelled unambiguously ("3 Nov 2026, 15:04 UTC"). NN/g date guidance: spell out months, label components, anchor "now." At T-60s switch to a visibly distinct urgent state; when expired, fail closed: disable Pay, show "Request expired — do not pay," never allow a dead request to submit.

6. **Finality watch = explicit progress indicator with staged states, never a bare spinner.** Monad finality should land in the 1-10 s attention band: show staged status ("Broadcast - Included in block N - Final") with per-stage checkmarks and elapsed time; if it exceeds ~10 s, add percent-done/expected-time framing and a non-destructive way to leave ("We'll keep watching — receipt updates automatically"). NN/g 2014: dynamic progress indicators increase willingness to wait. Constraint mapping: "Included" is NOT "Paid" — the success state requires the finality signal, no optimistic fake-success (also honors "UI too fast": don't flash success states the user can't perceive/verify).

7. **Permanent receipt page = the full-fidelity record.** Everything truncated elsewhere appears in full here: complete 42-char address(es), full tx hash, request ID, block number, exact wei amount, timestamps (absolute, spelled month, UTC labeled) — each with its own copy button, one per row, label + value layout (single column per form guideline #3). This is the page users screenshot/forward; treat it as the canonical document view, scannable via the concise/scannable/objective triad (+124%).

8. **Security comparison code: chunked groups of 3-4 characters, 4 groups max.** STM research (~7 chunks, 20-s decay) says a human-compared code must be short and chunked. Display as `K7F2 · 9QM4 · T8XA` (not one 12-char run), monospace, large type, and instruct comparison *while both parties look* — no memorization across screens. Exclude ambiguous glyphs (0/O, 1/I/l). (Chunking as presentation technique is NN/g-endorsed: "How Chunking Helps Content Processing"; ambiguous-character exclusion is standard security-UX practice, non-NN/g.)

9. **Status language everywhere must be literal and fail-closed.** Objective-language finding (+27% usability; marketese actively harms credibility): write "Transaction broadcast, waiting for inclusion" not "Payment processing!" Passkey copy: "This device unlocks signing for your requests" — never "verified identity." Error prevention (heuristic #5): disabled Pay until terms acknowledged; destructive actions (revoking a passkey, cancelling a request) get confirmation dialogs with the concrete consequence stated.

10. **No task-vital data behind hover/tooltips.** Tx hash, expiry, and the security code must be visible without interaction. Tooltips only for definitional help ("What is a block number?") — NN/g tooltip rule #1.

---

## 4. NOTABLE QUOTES / NUMBERS (citable)

- "79 percent of our test users always scanned any new page they came across; only 16 percent read word-by-word." — Nielsen, 1997. https://www.nngroup.com/articles/how-users-read-on-the-web/
- Combined concise + scannable + objective rewrite: "124% better usability" (+58% concise, +47% scannable, +27% objective). Same URL. Technical-whitepaper replication: +159%. https://www.nngroup.com/articles/applying-writing-guidelines-web-pages/
- F-pattern original study: "we recorded how 232 users looked at thousands of Web pages" — Nielsen, 2006. https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content-discovered/ ; confirmed 2017 incl. mobile & RTL mirror. https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/
- "Users spend 80% of the viewing time on the left half of the page vs. 20% on the right half." — NN/g 2017. https://www.nngroup.com/articles/horizontal-attention-leans-left/
- "Numerals often stop the wandering eye and attract fixations, even when they're embedded within a mass of words that users otherwise ignore." — Nielsen, 2007. https://www.nngroup.com/articles/web-writing-show-numbers-as-numerals/
- "Short-term memory famously holds only about 7 chunks of information, and these fade from your brain in about 20 seconds." — Nielsen, 2009. https://www.nngroup.com/articles/short-term-memory-and-web-usability/
- Response-time limits: "0.1 second … instantaneous … 1.0 second … flow of thought … 10 seconds … limit for keeping the user's attention … users should be given feedback indicating when the computer expects to be done." — Nielsen, 1993 (origins Miller 1968). https://www.nngroup.com/articles/response-times-3-important-limits/
- "Users experience higher satisfaction with a site and are willing to wait longer when the site uses a dynamic progress indicator." — NN/g 2014 (cites Myers 1985 percent-done study). https://www.nngroup.com/articles/progress-indicators/
- Tables vs cards: card UIs require users to "spatially reorient each time they move their eyes from one card to another, making comparison tasks cognitively effortful and slow." — Budiu, 2022. https://www.nngroup.com/articles/data-tables/
- Tooltips: "Don't use tooltips for information that is vital to task completion." — NN/g 2019. https://www.nngroup.com/articles/tooltip-guidelines/
- Dates: spell out month; "10/11/2016 could mean 11th of October 2016 to an American, but November 10th to someone from Europe." — NN/g 2017. https://www.nngroup.com/articles/date-input/
- Eyetracking evidence base: 3 large-scale studies over 13 years, 500+ participants, 750+ hours. https://www.nngroup.com/reports/how-people-read-web-eyetracking-evidence/

---

## 5. VERIFICATION NOTES (honesty)

- **No NN/g source found** for: hex/long-identifier truncation conventions, copy-to-clipboard button design, crypto address display, or security-code comparison. Rules 2 and 8 derive from NN/g first principles (recognition-over-recall, STM/chunking, F-pattern) plus non-NN/g practice (EIP-55 checksums, identicons, ambiguous-glyph exclusion) — labeled as such.
- The classic "Z-pattern" as commonly cited in design blogs is NOT an NN/g named pattern; NN/g's closest is the "zigzag pattern" for image-heavy pages (in the 2019 scanning-patterns article). Cite zigzag, not Z, if attributing to NN/g.
- Miller's "7±2" (1956) is cited by NN/g; NN/g also teaches elsewhere (Cowan 2001, 4±1) that effective capacity is lower for novel/abstract items — which argues for 3-4-char code groups. The Cowan reference appears in NN/g course material/video ("The Magical Number 7 and UX"); the 2009 article itself uses "about 7 chunks."
