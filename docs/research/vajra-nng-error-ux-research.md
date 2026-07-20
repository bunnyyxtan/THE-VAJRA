# NN/g Error Messages & Error Prevention — Research Report for Vajra

Compiled from nngroup.com sources (fetched and verified during research). Items that could not be verified are explicitly marked [UNVERIFIED].

---

## 1. CORE THEORY

### 1.1 Two heuristics govern errors
Jakob Nielsen's 10 Usability Heuristics (first published April 24, 1994; continuously updated) devote two heuristics to errors:
- **Heuristic #5 — Error Prevention:** "Good error messages are important, but the best designs carefully prevent problems from occurring in the first place. Either eliminate error-prone conditions, or check for them and present users with a confirmation option before they commit to the action." (nngroup.com/articles/ten-usability-heuristics)
- **Heuristic #9 — Help Users Recognize, Diagnose, and Recover from Errors:** "Error messages should be expressed in plain language (no error codes), precisely indicate the problem, and constructively suggest a solution," with visual treatments that help users notice and recognize them.

Errors are also one of the 5 quality components of usability: error frequency and severity are negatively related to the usability of a system (Confirmation Dialogs article).

### 1.2 Norman's error taxonomy: slips vs. mistakes
Attributed by NN/g to Don Norman's *The Design of Everyday Things* (referenced in the 2013 Basic Books edition):
- **Slips** — the user intends one action but performs another (often similar) action. Unconscious; happen on autopilot when attentional resources are low. Ironically, slips are often made by *expert* users who have mastered a task and pay less attention.
- **Mistakes** — the user's *goal* itself is inappropriate for the situation, because of an incorrect mental model. Conscious errors; even perfectly executed steps lead to failure.
- NN/g maps these to Norman's **Gulf of Execution** ("How do I work this tool to accomplish my goal?") and **Gulf of Evaluation** ("Did this work how I wanted?"). Mistakes arise when design doesn't help users bridge the gulfs.
- Norman's finer sub-taxonomy (action-based vs. memory-lapse slips; rule-based vs. knowledge-based vs. memory-lapse mistakes) exists in *The Design of Everyday Things* but is NOT elaborated in the NN/g articles fetched — treat sub-types as book-sourced, not NN/g-article-sourced.

Design consequence (NN/g, Preventing User Errors series, Aug–Sep 2015):
- Slip prevention = constraints, suggestions, good defaults, forgiving formatting (largely validation/engineering work).
- Mistake prevention = matching users' mental models (user research, conventions, affordances/signifiers, previews). Requires gathering user data (contextual inquiry, field studies, qualitative usability testing).

### 1.3 Prevention beats recovery
"Preventing errors is better than helping users recover from them… When users must recover from an error, they must interrupt their task to devote precious cognitive (and working memory) resources to fixing the problem" (Dangerous UX, Feb 2021).

### 1.4 Blame the design, not the user
"The term 'user error' implies that the user is at fault… Not so. The designer is at fault for making it too easy for the user to commit the error. The solution is not to scold users, ask them to try harder, or give them more training. The answer is to redesign the system to be less error prone." (Preventing User Errors: Avoiding Unconscious Slips, 2015). In form filling, 3+ occurrences of the same error in a single attempt indicates a deeper UI issue, not user incompetence (10 Design Guidelines for Reporting Errors in Forms, 2019).

### 1.5 Supporting cognitive science cited by NN/g
- **Alphonse Chapanis, WWII B-17 crashes (1940s):** pilots confused identical landing-gear and flap levers differentiated only by placement; Chapanis shape-coded the levers. Origin of "shape coding" and designing for the distracted user (Dangerous UX, 2021).
- **Kahneman System 1 / System 2** (*Thinking, Fast and Slow*): repetitive work runs on fast, automatic System 1; to reach users in that mode, design must use preattentive attributes (color, position, shape) rather than labels alone (Dangerous UX, 2021).
- **Hawaii false missile alert, Jan 13, 2018** (NN/g case study, Kim Salazar, Jan 2018): operator selected the live alert "PACOM (CDW) – STATE ONLY" instead of "DRILL- PACOM (CDW) – STATE ONLY" from a single undifferentiated menu, then confirmed. Retraction took **38 minutes**, partly because the agency wasn't authorized to send non-alert messages and the system had no undo/retraction capability (developers built it on the fly). NN/g's verdict: "a poorly designed system is to blame." Causes identified: miscues, poorly differentiated options, problematic presentation, lack of confirmation for destructive actions, lack of undo.

### 1.6 A note on study rigor
These NN/g articles are practitioner guidelines distilled from NN/g's cumulative usability research; **the articles themselves do not report sample sizes or effect sizes** for the specific rules. Concrete numbers they do cite are listed in Section 4. Claims like "testing with 5 users" come from a separate NN/g article (2000) and are not error-specific.

---

## 2. NN/g'S SPECIFIC GUIDELINES

### 2.1 Error-Message Guidelines (May 2023) + Error-Message Scoring Rubric (June 2023)
Three groups; rubric adds measurable "Excellent" criteria:

**Visibility**
1. Display the message close to the error's source — adjacent to the element; no extra interaction needed to see it.
2. Use noticeable, redundant, accessible indicators. Rubric: at least **3 indicators** (e.g., label + icon + border/shading); indicators reserved exclusively for errors/warnings; all WCAG AA/AAA compliant; nonessential animation allowed, **100–500 ms** duration. Never use color or animation *exclusively* (≈350M people worldwide have color-vision deficiency).
3. Design errors based on impact: modal dialogs (high interaction cost) reserved for consequential, actionable decisions; banners/toasts/popovers/labels for passive warnings or minor errors. Warnings must not look like errors.
4. Avoid prematurely displaying errors. Exception: for error-prone/uncommon inputs, real-time inline errors with guidance are appropriate.

**Communication**
1. Human-readable language; rubric: **7th–8th grade reading level (Flesch-Kincaid) or lower**; error codes visually minimized or shown on request; no implementation jargon (audience-specific jargon OK).
2. Concisely and precisely describe the issue; front-load important content; no "An error occurred."
3. Offer constructive advice — a solution sufficient to fix the problem, at low interaction cost.
4. Positive tone; don't blame the user; avoid words like "invalid," "illegal," "incorrect"; avoid humor (goes stale); accountability placed on the system.

**Efficiency**
1. Safeguard against likely mistakes — "the very worst error messages are those that don't exist" (e.g., email clients detecting missing attachments).
2. Preserve the user's input (even the incorrect input) and reference it in the message.
3. Reduce error-correction effort: guess the correct action, offer one-click fixes (e.g., click-to-fix city for ZIP mismatch).
4. Educate on how the system works: at least one contextual help resource per error, low interaction cost.

### 2.2 10 Design Guidelines for Reporting Errors in Forms (Feb 2019)
1. Aim for inline validation whenever possible (validate as soon as the user finishes a field).
2. Indicate successful entry for complex fields (green check for username availability; password-strength meter while typing) — but don't overdo success indicators on trivial fields.
3. Keep error messages next to fields (minimizes working-memory load — message visible while fixing).
4. Use color to differentiate error states (red for errors, orange/yellow warnings, green/blue success; semitransparent background on long forms).
5. Add iconography or subtle animation for scanning (icon left of message; subtle pulse/bounce OK; never animate the text; don't animate many icons at once).
6. Use modals/confirmation dialogs sparingly for errors — disruptive; forces users to memorize instructions; acceptable only if the message is simple or the form can still be submitted as-is (Gmail missing-attachment example).
7. Don't validate fields before input is complete — wait until the user leaves the field.
8. Don't use validation summaries as the only error indication — summary + per-field messages (SurveyMonkey good example).
9. Don't use tooltips to report errors (hard to notice, extra effort).
10. Provide extra help for repeated errors — same error 3+ times in one attempt = design problem; review analytics, test, revise messages, offer support link.

### 2.3 Hostile Patterns in Error Messages (Oct 2022)
1. Avoid premature error messages: display errors only after the error has actually been made. Don't error while the user is typing a still-valid prefix (typing "2" in a phone field is not an error; typing a letter is). Don't trigger errors on focus/click-into-field (Hilton Conrad example). Don't ship forms with errors in the default state.
2. Reserve error styling for errors only: red text, caution/warning symbols only for critical, workflow-disrupting conditions. Don't style routine system-status messages like errors.

### 2.4 Preventing slips (Aug 2015)
1. Include helpful constraints (date pickers that can't select return-before-departure).
2. Offer suggestions (search autocomplete preempts typos; supports recognition over recall).
3. Choose good defaults (presets like "Tomorrow/Next week"; defaults also teach reasonable values, which reduces mistakes too).
4. Use forgiving formatting (accept natural input; scrub/format behind the scenes; auto-format as user types, like Uber's phone field).

### 2.5 Preventing mistakes (Sep 2015)
1. Gather user data to find mental-model gaps (contextual inquiry, field studies early; qualitative usability testing on prototypes).
2. Follow design conventions (Jakob's Law: users spend most of their time on other products).
3. Communicate affordances via clear signifiers.
4. Preview results before heavyweight/irreversible commits (iOS display-zoom preview example).
5. General, for both slips and mistakes:
   - Remove memory burdens — show context at every step; design for the user interrupted by a phone call mid-flow.
   - Confirm before destructive actions — but use carefully (see 2.6).
   - Support undo (Gmail: undo delete; undo send up to 30 seconds).
   - Warn before errors are made (Twitter character counter; warns *as you approach* the limit, then shows negative count and disables the action).

### 2.6 Confirmation Dialogs — "Can Prevent User Errors If Not Overused" (Jakob Nielsen; original publication year [UNVERIFIED — commonly cited as 2008]; page references Windows 10, so updated since)
Eight guidelines:
1. Use before actions with serious consequences — destroying work or **costing large amounts of money** — especially actions that cannot be undone (but still try to offer undo).
2. Never for routine actions — "The Computer That Cried Confirm": overuse turns confirmation into automated, thoughtless clicking and *increases* errors.
3. Be specific about consequences — restate the user's request with identifying details (file name, not "these 2 items"; MailChimp shows list name + subscriber count). Never bare "Are you sure?"
4. Action-labeled buttons, not Yes/No — e.g., "Delete file" / "Keep file" (Apple Photos uses "Delete" not "Confirm").
5. Progressive disclosure for detail (Word's "Tell Me More") — keep dialog scannable.
6. No default "Yes" answer — the entire point is to force a double-check; best to have no default at all.
7. For the most dangerous, rare operations, require a nonstandard action — e.g., type DELETE (MailChimp). Don Norman goes further: require a *different person* to confirm the most dangerous actions. Reserve for rare cases or it becomes the new routine.
8. Consider letting users bypass future routine confirmations ("don't ask again") for low-stakes educational dialogs.
Resolving the #1/#2 tension: task analysis of severity x frequency; e.g., a bank confirming only payments **>= 2x the user's normal payment range** (example threshold, needs user research to tune).

### 2.7 Dangerous UX: Consequential Options Close to Benign Options (Feb 2021)
- Never place destructive/consequential options adjacent to benign ones with similar styling (Firefox spellcheck "Add to Dictionary" next to the correction; Ubiquiti Reconnect/Block; ThinkorSwim Delete next to Confirm & Send; Trello Watch/Archive Card).
- Differentiate with **redundant visual signals**: color, icon, size, alignment — not just labels (Grammarly example).
- **Leverage Fitts' Law deliberately**: make the destructive option physically farther/harder to hit; extra milliseconds of movement are nothing vs. the cost of undoing a major error (Sonos spacing example; Gestalt proximity creates conceptual separation).

### 2.8 Indicators vs. Validations vs. Notifications (Jan 2024)
- **Indicators**: contextual, conditional, passive visual cues (icon, bold, color) — no action required.
- **Validations**: tied to a specific user input; user must act to clear; must follow error-message guidelines and say how to fix ("Please enter your street address," not "Field is blank").
- **Notifications**: system events not triggered by the user's immediate action; action-required ones should be intrusive (modal); passive ones nonintrusive — but easily missed. Cautionary finding: a participant waited **5 minutes** for content to load because a small error toast faded after 5 seconds — never implement error messages as transient toasts.

---

## 3. APPLICATION TO VAJRA — 10 ACTIONABLE RULES

**Rule 1 — Fail closed is a UX state, not just a security property (covers RPC unavailable, reverted, finality).**
NN/g: "the very worst error messages are those that don't exist." Any uncertainty about chain state must render as an explicit, honest state — never silent, never fake success. Payment page shows a persistent 3-stage status — **Broadcast -> Included in block -> Final** — and "Paid/Success" only renders after final onchain confirmation, with tx hash + explorer link as proof. If the RPC is unreachable, the screen says "Can't confirm payment status right now — no payment has been recorded. We'll keep checking automatically" (auto-retry with backoff; passive indicator, not a blocking modal). A toast is forbidden for payment status (NN/g's 5-minute-toast finding). Vajra constraint satisfied: no fake success; money actions fail closed.

**Rule 2 — Prevent the wrong-network mistake before it can happen (wrong network).**
Read chainId the moment the wallet connects and *disable* the Pay button (helpful constraint, slip prevention) rather than letting the tx fail. Inline message next to the button: "This request is on Monad. Your wallet is connected to {chain}." + one-click **[Switch to Monad]** (NN/g: reduce error-correction effort — offer the fix, don't describe it). Do not show red error styling for this pre-transaction state — it's a warning, not an error (hostile patterns guideline; rubric: warnings must not look like errors).

**Rule 3 — Wallet rejection is a neutral cancel, not an error (wallet rejection).**
EIP-1193 code 4001 means the user deliberately declined. Message: "Payment not sent — you canceled in your wallet. Nothing was charged." Positive, non-blaming tone (NN/g communication guideline #4); no red, no alarm iconography; primary action **[Review and try again]**, preserving all prior context (preserve user input). Treating a deliberate user decision as a system failure violates both "don't blame the user" and "reserve error styling for errors only."

**Rule 4 — Translate reverts into what/why/action, at 8th-grade reading level (transaction reverted).**
Never surface "execution reverted" or hex data (NN/g: no error codes/implementation jargon; rubric: 7-8th grade Flesch-Kincaid). Template: **What:** "The payment didn't go through — no MON left your wallet." **Why:** mapped from the revert reason in user terms ("The request expired at {time}" / "This request was already paid" / "Your balance was too low to cover {amount} MON plus fees"). **Action:** one specific fix button ([Try again], [Ask {recipient} for a new request]) plus a contextual help link (efficiency guideline #4). Raw revert data available behind progressive disclosure ("Technical details") for developers.

**Rule 5 — Expired/revoked/already-paid requests fail at page load, not at signature time (expired/revoked, duplicate payment).**
Check request status onchain/offchain *before* the sender connects a wallet (safeguard against likely mistakes; preview before heavyweight commit). An expired or revoked request renders a dedicated terminal state: "This payment request expired on {date} / was canceled by {recipient}. You can't pay it." + action "[Request a new link]" — never an enabled Pay button that fails later. An already-paid request renders the permanent receipt (not an error at all): "This request was paid on {date} — tx {hash}." This converts a potential onchain failure into clean information architecture.

**Rule 6 — Make duplicate payment structurally impossible, then detect the residue (duplicate payment).**
Prevention first (heuristic #5): the Pay button is disabled once the request is paid, keyed to onchain request status — not to local UI state (a second tab/device must also fail closed). If a same-block double-submit race produces two transactions, surface it explicitly: "Two transactions were submitted for this request: {hash1}, {hash2}. The second may be refundable — contact support" with both links. No silent dedupe; honesty about chain state.

**Rule 7 — The sender's verify-terms screen IS the confirmation dialog — design it to Nielsen's 8 rules.**
Payment is irreversible onchain — exactly NN/g's "costing large amounts of money / cannot be undone" case. But the wallet prompt + Vajra's verify step together are the confirmation, so: (a) restate specifics — amount in MON + fiat equivalent, recipient address (truncated + full on tap), expiry, memo, fee estimate; never a bare "Are you sure?"; (b) action-labeled button **[Pay 250 MON]**, never "Confirm/OK"; (c) no keyboard default on the pay action; (d) consider a "twice your usual amount" style friction tier — payments far above the sender's history get an extra explicit check (Nielsen's personalized-threshold example); (e) do NOT add a third "Do you really want to pay?" dialog on top of wallet confirmation — that's The Computer That Cried Confirm.

**Rule 8 — Request-creation form: inline validation on blur, live guidance only where input is error-prone (creation form).**
Amount/expiry/memo/payer fields: validate inline when the user leaves the field (never while typing a still-valid prefix — Labcorp/LG premature-error pattern). Error-prone inputs get live guidance: the optional payer address field validates checksum/format in real time (rubric exception for error-prone input); memo gets a Twitter-style remaining-character counter that warns *before* the limit; amount uses forgiving formatting (accept "1,000.5" and "1000.5", trim whitespace, auto-format), a sensible default expiry (e.g., 7 days — good defaults teach reasonable values), and a date picker that cannot select past times (helpful constraint). On submit failure, keep every field populated and put messages next to fields plus a summary (guideline #8: summary alone is insufficient).

**Rule 9 — Separate destructive from benign spatially and visually everywhere (revocation, passkey settings, activity page).**
"Revoke request" must never sit next to "Copy link" or "Share" (Dangerous UX proximity rule; ThinkorSwim Delete/Confirm & Send is the exact finance-domain anti-pattern). In passkey settings, "Remove passkey" is visually distinct (redundant signals: color + icon + placement), spatially separated from "Rename passkey," and — because it can orphan the recipient's signing ability — requires a nonstandard confirmation (type REMOVE) per Nielsen's rule 7, with specific consequences stated: "You won't be able to create new payment requests from this device. Existing signed requests remain valid." In the activity/history list, per-item destructive actions live behind an overflow menu, not as adjacent icons.

**Rule 10 — Passkey and ceremony copy: precise claims, no identity overreach (passkey registration, settings).**
Mistake prevention = aligning mental models. Passkey registration copy must say what is true: "This passkey lets this device sign your payment requests. It is not identity verification and does not prove who you are to anyone." Never use "verified identity," "KYC," or checkmark-and-shield iconography that implies identity assurance — that builds a false mental model (Norman mistake) for both recipient and sender. Ceremony errors (user cancels the platform prompt, attestation fails, unsupported authenticator) follow the same what/why/action pattern: "Passkey setup wasn't completed. No passkey was created on this device. [Try again] or [use a different device/security key]." Post-ceremony, state plainly what the passkey does and doesn't do (educate on how the system works).

---

## 4. NOTABLE QUOTES & NUMBERS (with sources)

- "Good error messages are important, but the best designs carefully prevent problems from occurring in the first place." — Heuristic #5. https://www.nngroup.com/articles/ten-usability-heuristics/ (1994, updated)
- "Error messages should be expressed in plain language (no error codes), precisely indicate the problem, and constructively suggest a solution." — Heuristic #9. Same URL.
- "The very worst error messages are those that don't exist." — https://www.nngroup.com/articles/error-message-guidelines/ (May 2023)
- Error copy at **7th-8th grade reading level (Flesch-Kincaid)**; **>= 3 redundant error indicators**; animations **100-500 ms**; error codes minimized. — https://www.nngroup.com/articles/error-messages-scoring-rubric/ (June 2023)
- **~350 million people worldwide** with color-vision deficiency — never use color alone for errors. — https://www.nngroup.com/articles/error-message-guidelines/
- Same form error **3+ times in one attempt** = deeper UI problem, not user fault. — https://www.nngroup.com/articles/errors-forms-design-guidelines/ (Feb 2019)
- "The designer is at fault for making it too easy for the user to commit the error." — https://www.nngroup.com/articles/slips/ (Aug 2015)
- "Slip-type mistakes often are made by expert users." — https://www.nngroup.com/articles/slips/
- Hawaii missile alert: **Jan 13, 2018**; retraction delay **38 minutes**; "a poorly designed system is to blame." — https://www.nngroup.com/articles/error-prevention/ (Jan 2018)
- "The Computer That Cried Confirm" — overused confirmations train users to click through, increasing errors. — https://www.nngroup.com/articles/confirmation-dialog/ (Jakob Nielsen; original year [UNVERIFIED in this capture — commonly cited 2008])
- Confirmation-dialog threshold example: confirm payments **>= 2x the user's normal payment range** (illustrative, needs research to tune). — same URL.
- Chapanis B-17 shape-coding (WWII); Kahneman System 1/System 2; "It's okay to leverage Fitts' Law and make it a little harder to select the consequential option." — https://www.nngroup.com/articles/proximity-consequential-options/ (Feb 2021)
- Participant waited **5 minutes** because a fading toast carried the error — never use transient toasts for errors. — https://www.nngroup.com/articles/indicators-validations-notifications/ (Jan 2024)
- "The solution is not to scold users, ask them to try harder, or to give them more extensive training. The answer is to redesign the system to be less error-prone." — https://www.nngroup.com/articles/error-prevention/
- Gmail **Undo Send up to 30 seconds**; undo preferred over confirmation where possible. — https://www.nngroup.com/articles/user-mistakes/ (Sep 2015)
- Hostile patterns: premature errors and error-styling inflation "feel bad-mannered and increase cognitive load." — https://www.nngroup.com/articles/hostile-error-messages/ (Oct 2022)

### Verification notes
- All URLs above were fetched/returned by tools during research. Author names omitted where not visible in captured pages. The confirmation-dialogs article's original publication year could not be verified from the captured page (content references Windows 10, indicating later updates); commonly cited as June 2008 — treat as [UNVERIFIED].
- NN/g error articles do not publish sample sizes or effect sizes for these guidelines; they are syntheses of NN/g's cumulative lab research. No effect-size claims are made in this report.
- Norman's finer slip/mistake sub-taxonomy is from *The Design of Everyday Things* (book), not from the NN/g articles cited; flagged accordingly in section 1.2.
