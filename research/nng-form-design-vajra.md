# NN/g Form-Design Research → Vajra Payment-Request Creation Form
**Research date:** 2026 (current turn). All findings verified against live nngroup.com pages this turn unless marked otherwise.

---

## 1. CORE THEORY

### 1.1 Interaction cost & cognitive load (the unifying principle)
NN/g's form research rests on one premise: **users don't want to fill out forms; every field, decision, and memory demand adds interaction cost and raises abandonment risk.** In "4 Principles to Reduce Cognitive Load in Forms" (2025), NN/g frames good form design as minimizing cognitive load through four principles: **Structure, Transparency, Clarity, Support** (nngroup.com/articles/4-principles-reduce-cognitive-load/). In the **EAS framework** (Huei-Hsin Wang, Mar 2025): *Eliminate first, Automate where possible, Simplify what remains.* Memorable framing: a form is "a bank account of trust — **every question is a withdrawal**; ask too many (or intrusive ones) and you overdraft trust and lose the user" (nngroup.com/articles/eas-framework-simplify-forms/).

### 1.2 Eyetracking evidence base
- **F-pattern (2006):** NN/g's original eyetracking study recorded **232 users looking at thousands of web pages**; dominant reading pattern is F-shaped — two horizontal stripes then a vertical stem. Implications: first two paragraphs / first words get the most attention; content lower-right is under-seen (nngroup.com/articles/f-shaped-pattern-reading-web-content-discovered/). Replicated in 2017 ("same today as 11 years ago"; example heatmap aggregated **47 people**; also confirmed on mobile and mirrored in RTL languages) (nngroup.com/articles/f-shaped-pattern-reading-web-content/).
- **Eyetracking Web Usability** (Nielsen & Pernice, 2009 book): "one of the largest studies of eyetracking usability in existence" — **1.5 million gaze instances**, a **three-year study**; includes a chapter section "Forms, Fields, and Applications" (nngroup.com/books/eyetracking-web-usability/).
- **Form-specific eyetracking finding:** NN/g reports (in the placeholders article) that "**eyetracking studies show that users' eyes are drawn to empty fields**" — fields that already contain text are less noticeable and may be skipped or mistaken for prefilled data. This is the empirical core of the anti-placeholder position (nngroup.com/articles/form-design-placeholders/).
- **"How People Read on the Web" report:** three large-scale eyetracking studies spanning 13 years, 500+ participants, 750+ hours of testing (nngroup.com/reports/how-people-read-web-eyetracking-evidence/).

### 1.3 Label placement — the classic study is NOT NN/g (attribution warning)
The widely cited "top-aligned labels are fastest" data comes from **Matteo Penzo's July 2006 eyetracking study published on UXmatters**, operationalizing Luke Wroblewski's form-layout recommendations — **not from NN/g**. Findings (as relayed by Wroblewski, *Web Form Design*, Rosenfeld 2008, and lukew.com):
- Top-aligned labels: single fixation captures label+field; **fastest completion times**.
- Right-aligned labels: average saccade label→field of **170 ms (experts) / 240 ms (novices)**; completion times **~2× faster than left-aligned**.
- Left-aligned labels: slowest; "excessive distances between labels [and] inputs forced users to take more time."
- Caveat noted by Wroblewski himself: Penzo's forms were **short (4 fields) and all-required** — common scenarios (optional fields, long forms) untested.
NN/g's own position is consistent but pragmatic: labels **above** the field for mobile and shorter forms, **next to** the field only for very long desktop forms (nngroup.com/articles/web-form-design/); mobile checklist item: "Is the label above it? (Not inside, not below)" (nngroup.com/articles/mobile-input-checklist/).

### 1.4 Required/optional signaling study detail
From NN/g's survey research ("28 Tips for Creating Great Qualitative Surveys", 2016): "**People have trouble understanding required and optional signals** on survey questions/forms... the red asterisk '*' didn't work well enough, **even in a survey of UX professionals** — many of whom likely design such forms. People complained that required fields were not marked. Pages that stated at the top that all were required or optional also didn't help, because many people ignore instruction text. Use '(Optional)' and/or '(Required)' after each question." Also: "When marking is not clear enough, many people feel obligated to answer optional questions" (nngroup.com/articles/qualitative-surveys/).

### 1.5 Disabled buttons — NN/g's stance
NN/g video (Aug 2025): "**Disabled buttons often confuse users by appearing clickable but providing no response or feedback.** Designers should use them sparingly, ensure they're accessible, and **clearly explain why the button is disabled**" (nngroup.com/videos/why-disabled-buttons-hurt-ux-and-how-to-fix-them/). Button States article (Apr 2025): disabled = "action unavailable"; style light-gray/desaturated, low contrast; add `aria-disabled="true"` so it keeps tab focus and screen readers announce the state (nngroup.com/articles/button-states-communicate-interaction/).

---

## 2. NN/g'S SPECIFIC GUIDELINES (granular)

### 2.1 Field labels
- Always have a visible label **outside** the field; never use placeholder text as the label (7 documented failure modes: memory strain when it disappears; users can't check work before submitting; error recovery breaks; keyboard/Tab users miss it; filled fields are less noticeable — eyetracking; users mistake placeholder for a default and skip the field; occasionally users must manually delete it) (form-design-placeholders/).
- Placeholder **in addition to** a label is acceptable only for supplementary, non-essential hints; anything **essential** goes outside the field, always visible.
- Floating labels are a tolerated compromise (Material Design style) — fix issues #1–4 but **not** #5–6, and accessibility issues may persist. "If you have the screen space, placing the label and hint outside the field is still the best way to go."
- Label above the field (mobile/short forms); single-column layout ("multiple columns interrupt the vertical momentum"); group related labels/fields with unambiguous proximity (web-form-design/).
- Accessibility: placeholder light-gray fails contrast; not all screen readers read placeholder text; cognitive/motor-impaired users are hit hardest.

### 2.2 Required vs optional
- **Mark all required fields** — even if nearly all fields are required. Don't rely on "All fields are required" instructions at the top: people don't read top-of-form instructions, and even if they read them they forget or must hold them in working memory (required-fields/).
- Use an **asterisk** (web-conventional; Jakob's Law); red is the expected color but not mandatory — never pale gray/low-contrast. Position (before vs after label) makes little practical difference; before-label in color helps scanning long forms.
- **Also mark optional fields** with the word "(optional)" — "not obligatory, but lightens cognitive load"; without it users must scan/infer, or feel obligated to fill optional fields.
- **Limit to 1–2 optional fields; eliminate the rest** (web-form-design/, recommendation 7).
- Exception: pure login forms (username+password) may omit markers. Registration forms must mark.
- HTML5: ensure screen readers announce "required" for asterisked fields.

### 2.3 Inline validation & errors (10 rules, errors-forms-design-guidelines/, 2019)
1. Aim for inline validation whenever possible; validate when user leaves the field.
2. Indicate **successful** entry for complex fields (e.g., password strength, username availability) — but don't show success messages for trivial "is it filled" checks.
3. Keep error messages **next to the field** (minimizes working-memory load).
4. Use color to differentiate (red = error, orange/yellow = warning, green/blue = success); semitransparent tinted background on long forms.
5. Add **iconography** (helps colorblind users; aids scanning); subtle pulse/bounce on the icon OK; never
 animate the error text.
6. Modals/confirmation dialogs **sparingly** (disruptive; force memorizing instructions). OK only if the message is simple or the form can proceed anyway.
7. **Don't validate before input is complete** — premature validation is "a hostile pattern... unwarranted scolding" (4-principles-reduce-cognitive-load/).
8. Never use a validation summary as the **only** error indication. Summary + per-field messages is fine.
9. Don't use tooltips to report errors.
10. Provide extra help for **repeated** errors.
Plus (2025): real-time validation selectively (password checklist-type cases); error messages must be **constructive** (Etsy suggests available usernames).

### 2.4 Input masking & forgiving formats
- "**Be Flexible with Formatting**": clean input behind the scenes (strip parentheses/spaces) (eas-framework-simplify-forms/).
- **Input masks are endorsed** for structured data: masks "structure their input as they type... automatically adds spaces, parentheses, or hyphens where needed, **while ignoring unnecessary characters**" (USPS phone example). When a format change needs confirmation, show **side-by-side comparison** (Amazon address example).
- Dates: accept any separators and leading zeros; Priceline rejecting "9-3-17" is the anti-example (date-input/).
- Mobile checklist #13–14: allow typos/abbreviations; "allow users to enter it in whatever format they like — **you can autoformat it for them**."
- Explain format requirements up front — never reveal rules only via error ("secret rules" — Netgear example); "death to parentheses for phone-number area codes" (web-form-design/).

### 2.5 Defaults & prefilling
- "**Offer Helpful Defaults**... But be careful: **users rarely change defaults**. A poorly chosen default can feel pushy, intrusive, and lead to errors" (Amazon preselected paid shipping = deceptive-feeling).
- **Reuse existing data**: prefill, keep fields editable; never silently store payment info without explicit opt-in (GoFundMe positive example).
- **Infer instead of asking**: ZIP→city/state (editable) "worked well" in NN/g research; don't ask card type when detectable from number.
- Mobile checklist #7–9: defaults from history/frequent values; phone features (camera, GPS, voice); compute for the user.

### 2.6 Disabled submit buttons vs allowing errors
- Disabled buttons "confuse users by appearing clickable but providing no response" — use sparingly, `aria-disabled`, **explain why**.
- Alternative pattern: allow click, then inline errors next to fields + optional summary (never summary-only).
- **Avoid Reset/Clear buttons** entirely (TSA anti-example); keep primary action closest to the fields.
- Button **loading state** for slow actions: spinner → check (button-states-communicate-interaction/).

### 2.7 Mobile form design
- 14-point mobile input checklist (mobile-input-checklist/): necessity; label above; required/optional marked; no placeholder; field wide enough; visible with keyboard open; defaults; device features; computed values; copy-paste supported; correct keyboard; autocomplete; **no autocorrect for names/addresses/emails**; allow typos; any format + autoformat.
- Reduce field count; autofill known data (mobile-checkout-ux/).
- Match field size to expected input — "extremely error prone when users can't see their full entry." Data point: 2,130 UX Conference participants, city names 3–22 chars, **99.9% ≤ 19 chars**.
- Touch targets ≥ **1 cm × 1 cm** (input-steppers/).
- Mobile users are frequently interrupted → persistent labels/hints matter more.

### 2.8 Date/time input (expiry field)
- Calendar pickers only for dates within ~1 year; always allow typing; avoid endless scrollers and split month/day/year dropdowns (date-input/).
- Mark "today" explicitly. Disable illogical options (past dates). Never ask for the same date twice; keep ranges consistent.
- For ≤10 options, show a short list with unavailable choices grayed out.

---

## 3. APPLICATION TO VAJRA

**Rule 1 — Four fields, one column, labels above, hints persistent.** Single column; visible labels above each field; zero placeholders-as-labels. The memo's critical hint — "**max 96 bytes — stored publicly onchain and permanent**" — is essential and lives outside the field, always visible. Fail-closed: users can't unknowingly publish personal data.

**Rule 2 — Required/optional marking.** Amount, Expiry, Memo: red asterisk each (no "all fields required" banner — users skip/forget it). Payer address: literal word "**(optional)**" + consequence line: "Leave blank and anyone with the link can pay." NN/g found users feel obligated to fill unmarked optional fields and can't infer optionality — that behavior would cause recipients to paste payer addresses unnecessarily.

**Rule 3 — Amount: forgiving decimal input + computed context.** `inputmode="decimal"` on mobile; accept "0.5", "0,5", " 0.5 " and normalize silently. Show fiat equivalent as computed display text (Automate, per EAS). "MON" as a fixed suffix outside the editable text. Validate only on blur, never mid-keystroke.

**Rule 4 — Expiry: safe default + presets + typed fallback.** Users rarely change defaults → the default is the product decision: prefill 24 h, shown as human-readable absolute time ("Expires Tue 14:00 UTC"). Preset chips (1 h / 24 h / 7 d) as the ≤10 short-list pattern; custom entry accepts typing with any separator; disable past dates rather than erroring. Never re-ask later (preserve work).

**Rule 5 — Memo: live byte counter as legitimate success feedback; hard stop at 96.** Live "43 / 96 bytes" counter is the password-strength-meter pattern for a complex field. Count **bytes, not characters** (multi-byte emoji/CJK would otherwise blow the onchain limit silently). At limit: stop input + inline message next to the field; error text static (no animation). If the memo matches address/key/PII patterns, use a simple modal (NN/g's sanctioned modal case): "Memos are public and permanent on Monad. Avoid personal data."

**Rule 6 — Payer address: paste-first, checksum-validated, never autocorrected.** Support paste; disable autocorrect/autocapitalize. Validate checksum inline on blur — red + icon + constructive message ("Checksum invalid — check for a typo"). Green check on valid checksum justified (complex field). **Fail closed:** an invalid optional address blocks link creation with the field flagged — never silently drop the restriction and mint an open link.

**Rule 7 — "Create request" button: explain, don't just disable.** Either (a) keep enabled; click surfaces inline errors per field + summary (never summary-only), or (b) if disabled, pair with visible reason ("Enter an amount to continue") + `aria-disabled`. Given fail-closed money constraints, (a) is safer: the click is not irreversible, and validation teaches what's missing — a dead button teaches nothing. During signing, use loading state (spinner → check) and block double-submission — the legitimate use of disabling.

**Rule 8 — Sender payment page: F-pattern the terms, then a truthful status ladder.** Amount, recipient, expiry, memo in the top-left of the content area's first two lines (F-pattern: 232 users, 2006; replicated 2017). The 96-byte public memo renders in full. Broadcast → included → final is Heuristic #1 (visibility of system status): show each state as it happens onchain; label finality precisely — "**Final on Monad** (block #N)" — never "Payment successful" before finality (no fake success). Failed tx = error state with constructive next steps, not an endless spinner.

**Rule 9 — Passkey ceremony: transparency + careful framing.** State upfront: "Your device will ask you to create a passkey — one biometric/PIN prompt, ~10 seconds" — OS dialogs appear outside your UI and unexplained prompts read as errors. Describe the passkey as "a signing key stored on this device" — never "verified identity" (hard constraint; also matches NN/g's literal-labeling guidance). Ceremony failure fails closed with plain-language reason and retry; extra help after repeated failures (error rule #10).

**Rule 10 — Receipt & activity: verification beats celebration.** Permanent receipt = checkable artifact: amount, memo, expiry, tx hash, block number, finality status — grouped regions, bold key values (Structure principle). Activity rows lead with information-carrying words (amount + counterparty + status), per F-pattern front-loading guidance.

*Scope note: NN/g has no crypto-specific research; rules 3–10 apply their general form/feedback findings to Vajra's domain. Byte-counting, checksum, and finality mechanics are our domain layer on top of verified NN/g principles.*

---

## 4. NOTABLE QUOTES & NUMBERS

1. F-pattern: "**232 users** looked at **thousands of Web pages**" (2006); replicated 2017 (heatmap: 47 people), holds on mobile — nngroup.com/articles/f-shaped-pattern-reading-web-content-discovered/ ; /articles/f-shaped-pattern-reading-web-content/
2. Eyetracking Web Usability: "**1.5 million** gaze instances," three-year study — nngroup.com/books/eyetracking-web-usability/
3. "**Eyetracking studies show that users' eyes are drawn to empty fields**" — nngroup.com/articles/form-design-placeholders/
4. "Every question is a **withdrawal** [from a bank account of trust]" — nngroup.com/articles/eas-framework-simplify-forms/
5. "**Users rarely change defaults.**" — same source
6. Red asterisk "didn't work well enough, **even in a survey of UX professionals**... Use '(Optional)' and/or '(Required)'" — nngroup.com/articles/qualitative-surveys/
7. Premature validation = "a **hostile pattern**... unwarranted scolding" — nngroup.com/articles/4-principles-reduce-cognitive-load/
8. Disabled buttons "confuse users by appearing clickable but providing **no response or feedback**" — nngroup.com/videos/why-disabled-buttons-hurt-ux-and-how-to-fix-them/
9. "Death to parentheses for phone-number area codes!" — nngroup.com/articles/web-form-design/
10. City field: 2,130 participants; **99.9% of city names ≤ 19 chars** — nngroup.com/articles/web-form-design/
11. Right-aligned labels: 170 ms (expert)/240 ms (novice) saccade; ~2x faster completion than left-aligned — **Penzo 2006, UXmatters — NOT NN/g** — uxmatters.com/mt/archives/2006/07/label-placement-in-forms.php
12. Input masks "structure their input as they type... while ignoring unnecessary characters" — nngroup.com/articles/eas-framework-simplify-forms/
13. "Don't set users up for failure with **secret rules**" — nngroup.com/articles/web-form-design/
14. Touch targets >= **1 cm x 1 cm** — nngroup.com/articles/input-steppers/

**Unverified / not found:** No standalone NN/g "input masks" article (guidance lives inside the EAS article). No NN/g-run eyetracking study on label placement specifically — the canonical numbers (#11) are Penzo/UXmatters; NN/g's label-above-field position comes from usability testing, not a published NN/g eyetracking experiment. The 1.5M-gaze figure covers web reading broadly; NN/g's form-specific eyetracking claim is limited to "empty fields attract fixations" (#3).
