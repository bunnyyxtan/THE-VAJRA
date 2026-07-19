# NN/g Research Brief: Feedback, Confirmation, Success States & Graceful Degradation
**For:** Vajra UX architecture (Web3 payment requests on Monad)
**Method:** Fetched and read primary nngroup.com articles in full. Non-NN/g supplements are explicitly labeled. Unverifiable claims are marked.

---

## 1. CORE THEORY

### 1a. Visibility of system status (Heuristic #1) — the root principle
Jakob Nielsen's first usability heuristic: "The system should always keep users informed about what is going on, through appropriate feedback within reasonable time." NN/g's framing: communication and transparency create control, and "predictability of the interaction creates trust not only in the mechanics of the site or the app, but also in the brand itself." "A lack of information often equates to a lack of control." No action with consequences to users should be taken without informing them.
Source: https://www.nngroup.com/articles/visibility-system-status/

### 1b. Response-time limits (Nielsen, *Usability Engineering*, 1993; citing Miller 1968, Card et al. 1991, Myers 1985)
- **0.1 s** — limit for feeling the system reacts instantaneously (direct manipulation); only the result needs to be displayed.
- **1.0 s** — limit for uninterrupted flow of thought; user notices the delay but needs no special feedback (though feedback is advisable past ~1 s).
- **10 s** — limit for keeping user attention; beyond this you need percent-done indicators and a way to interrupt; users will context-switch and must reorient on return.
Source: https://www.nngroup.com/articles/response-times-3-important-limits/

### 1c. Progress feedback reduces perceived wait (study with an effect size)
University of Nebraska–Lincoln study (F. Nah, 2004, *Behaviour & Information Technology*, Vol. 23, No. 3): participants shown a continuously animating progress bar while a webpage loaded reported higher satisfaction and were **willing to wait ~3x longer** than a control group shown no indicator.
Source: https://www.nngroup.com/articles/progress-indicators/

### 1d. Peak–end rule (Kahneman & Fredrickson et al., 1993)
Memory of an experience is dominated by its most emotionally intense moment (peak) and its final moments (end). Original study: Kahneman, Fredrickson, Schreiber & Redelmeier (1993), "When More Pain Is Preferred to Less: Adding a Better End," *Psychological Science*, pp. 401–405. Cold-pressor experiment: 60 s at 14°C vs. 60 s at 14°C + 30 s at 15°C. When offered a repeat, **80% of participants chose the objectively longer (90 s) trial** because it ended slightly less painfully. (NN/g's article does not give the sample size; it is not stated — do not cite one.) UX corollaries: design positive peaks (Duolingo congratulation), eliminate negative peaks (finicky menus create lasting brand damage — Maytag eyetracking/usability example), and engineer the ending (TurboTax relief screen; progress bars judged faster when they accelerate near the end — Harrison et al. 2007, ACM UIST). Edge cases (outages, errors) are often the unplanned peak/end and dominate recall.
Source: https://www.nngroup.com/articles/peak-end-rule/

### 1e. Microinteractions (Dan Saffer, *Microinteractions*, O'Reilly 2014; NN/g synthesis)
Definition (NN/g): "trigger–feedback pairs" where the trigger is a user action or system-state change and feedback is a narrowly targeted, highly contextual UI change. Functions: show system status, prevent errors, support undo, communicate brand. Examples: Asana's completion dialog (utilitarian) + occasional flying unicorn (celebratory brand layer); Gap's pumping-heart favorite animation (subtle, short-duration, reversible).
Source: https://www.nngroup.com/articles/microinteractions/

### 1f. Error recovery (Heuristic #9) + severity-matched feedback
NN/g's error-message framework has three guideline families: **Visibility** (near the source; redundant accessible indicators — never color-only, ~350M people worldwide have color-vision deficiency; match intrusiveness to severity — toasts/banners for "good to know," modals only for blocking errors; never show errors prematurely); **Communication** (plain language, no jargon/codes, precisely describe the issue, offer constructive next steps, positive tone, never blame the user); **Efficiency** (preserve user input, reduce correction effort, suggest fixes). Catastrophic-failure mitigation: rare, dire situations may blend apology + novelty (Twitter Fail Whale), because negativity bias + peak–end make these moments memorable.
Source: https://www.nngroup.com/articles/error-message-guidelines/

### 1g. Three communication modes: indicators vs. validations vs. notifications
- **Indicators** — contextual, conditional, passive visual cues attached to an element (icons, color, bold). No action required.
- **Validations** — tied to a specific user input; user must act to clear them; must say how to fix.
- **Notifications** — system-initiated events; split into *action-required* (intrusive, modal OK) and *passive* (nonintrusive, badge/toast; easily missed — dangerous if the information is key).
Documented failure mode: a mobile user **waited 5 minutes** for content because an error message was shown as a toast that faded after 5 seconds — toasts are "a bad way to implement an error message."
Source: https://www.nngroup.com/articles/indicators-validations-notifications/

---

## 2. NN/g'S SPECIFIC GUIDELINES (granular)

### 2a. Confirmation dialogs — all 8 rules (nngroup.com/articles/confirmation-dialog/)
1. Use confirmations before actions with serious consequences (destroying work, large money), especially irreversible ones — but still try to offer undo.
2. Never use confirmations for routine actions (cry-wolf → automated dismissal).
3. Be specific: restate what will happen with identifying details ("Send 240 MON to 0x…", not "Are you sure?").
4. Button labels must summarize outcomes ("Delete file"/"Keep file"), never Yes/No.
5. Use progressive disclosure ("Tell me more") for secondary detail; keep dialog scannable.
6. No default "Yes" — ideally no default at all.
7. For the most dangerous/rare actions require a nonstandard action (e.g., typing DELETE, MailChimp pattern); reserve sparingly or it becomes the new automated behavior. (Don Norman: most dangerous actions could require a second person.)
8. Optionally let users bypass future routine confirmations (temporary, educational dialogs only).
Plus: resolve the tension between #1/#2 via task analysis — e.g., a bank might confirm only payments ≥2× the user's normal range (NN/g's explicit example, threshold itself requires user research).

### 2b. Progress indicators (nngroup.com/articles/progress-indicators/)
- Give immediate visual feedback on every action; wait time starts at the click. Without it, users re-click → duplicate orders/transactions. Never use "don't click again" warnings; instead show the first click was accepted.
- <1 s: no indicator (flashing UI is worse than none).
- ~1–2 s: subtle busy feedback.
- 2–10 s: looped animation/spinner; add explanatory text ("Loading comments…"). Spinners are risky for server-loaded data whose duration you don't control.
- ≥10 s: percent-done indicator + time estimate ("About 3 minutes remaining" — pad estimates; finishing early is a pleasant surprise). Also acceptable under 10 s when processing a known count of items ("Updating address 3 of 50"). Offer a way to stop/cancel long operations.
- Never use static "Loading…" indicators (indistinguishable from a hang).
- Progress bars should accelerate toward the end (slow start) — finishing faster than expected raises satisfaction; hanging at 99% negates all benefits. (Survey progress bars are the opposite: fast-start/slow-end reduces drop-off.)

### 2c. Skeleton screens (nngroup.com/articles/skeleton-screens/)
- Use only for full-page loads, only for waits under ~10 s (over 10 s → progress bar with duration estimate; under 1 s → nothing).
- Skeleton must mirror the real layout (content placeholders), reducing cognitive load and pre-building the mental model of the page.
- Spinners are better for single modules within a dashboard; skeletons for full screens.
- Never use "frame-display" skeletons (header/footer + blank body) — users assume the page is broken.
- Pulsing/shimmer animations are optional; they can be distracting and pose accessibility issues.
- Skeletons don't replace performance work. (Ref: Mejtoft, Langstrom & Soderstrom 2018, ECCE, DOI 10.1145/3232078.3232086.)

### 2d. Undo vs. confirmation (nngroup.com/articles/user-control-and-freedom/)
- Prefer undo over confirmation wherever possible; undo reduces anxiety and encourages exploration.
- Support multiple undo/redo when actions come in rapid succession.
- Undo must be discoverable: visible UI affordance, not just keyboard shortcuts or gestures (iOS shake-to-undo is "notoriously underused").
- Contextual undo in transient snackbars is acceptable but time-limited visibility is a weakness (Google Drive snackbar disappears in seconds — users must act fast).
- Always allow going back a step, canceling multi-step flows, and never break the browser Back button; warn rather than trap if Back would lose work.

### 2e. Status trackers & progress updates (nngroup.com/articles/status-tracker-progress-update/) — 16 guidelines; most relevant to Vajra's pay-to-finality flow:
- Offer both a pull (tracker page) and push (updates) channel; tracker-only induces obsessive checking.
- Prioritize the latest update visually; keep previous updates visible (dated log, most recent first) for troubleshooting and support.
- Plain language, zero backend jargon (NN/g mocks statuses like "Processed Sort Facility") — internal codes mean nothing to users.
- Show updates as an ordered list; vertical progress graphics work better on mobile.
- Regular low-granularity updates during long waits ("Joined the processing queue") — long silent gaps make users assume something went wrong and erode trust.
- Updates must be reliable/accurate and consistent across channels; an inaccurate tracker is worse than none.
- Errors in tracker access must be specific and diagnostic (not found vs. too early vs. typo?).
- Tell users the tracker exists at the moment of completion; updates should deep-link directly to the specific item's status (no re-entering reference numbers).
- Let users control update frequency/channels and stop updates from within the update.

### 2f. Success acknowledgment / microinteractions (nngroup.com/articles/microinteractions/)
- Feedback must be proximate to the trigger (state change near the button clicked).
- Celebratory animation must be subtle and short — "subtle enough to not brutally yank the user's attention away from the primary task"; brief duration keeps it a microinteraction rather than "inappropriately permanent."
- Pair utilitarian feedback with optional delight (Asana: confirmation dialog with Undo + occasional unicorn) — the utility layer carries the information; the celebratory layer carries brand/emotion.
- Match microinteraction tone to brand; sound can be a signature (Xbox power-on chime).
- Form-validation microinteractions (live requirement checklists, eBay password example) prevent rework and abandonment.

### 2g. Peak-end applied (nngroup.com/articles/peak-end-rule/)
- Amplify existing emotional payoffs; add a deliberate positive end moment (TurboTax relief screen).
- Don't overstay the ending with upsells or "please-don't-go" popups — they create negative final impressions.
- Design the error/outage ending explicitly: explain the problem, estimate resolution, never blame the user, don't use alarming red styling when no user action exists (Spotify outage anti-pattern).

---

## 3. APPLICATION TO VAJRA (9 actionable rules)

**V1. Tiered truth ladder for the payment flow — never skip a state, never claim early.**
Map the pay flow to explicit, plain-language stages: "Confirming with your wallet" -> "Transaction broadcast to Monad" -> "Included in a block" -> "Final (irreversible)". Only the final stage may be styled as success (per the fail-closed constraint). Earlier stages use neutral/progress styling (indicator pattern, section 1g). This combines NN/g's status-tracker guidance (2e: trackers must be "reliable and accurate" — an inaccurate tracker is worse than none) with the visibility heuristic. Words matter per 2e#3: say "Final — this payment cannot be reversed," not a loose "confirmed."

**V2. One confirmation, maximally specific, then get out of the way.**
On the sender payment page, a single pre-payment confirmation restates amount in MON, recipient address (truncated but verifiable), memo, and expiry — buttons labeled "Pay 240 MON" / "Go back," never "Yes/No," no default focus on Pay (2a rules 1, 3, 4, 6). No confirmation at all for request *creation* (routine, reversible — the creator can expire/void the link); reserve confirmation for the irreversible money movement. The passkey prompt itself is already the nonstandard confirmation action (2a#7 pattern, built into WebAuthn) — don't wrap it in an extra "Are you sure?"

**V3. Sub-1s feedback for every tap; progress staged by expected duration.**
Every button press gets immediate visual acknowledgment within the 0.1 s direct-manipulation window (pressed state). Wallet signing (~2-10 s): spinner + explanatory text ("Waiting for your wallet…"). Broadcast-to-finality: staged progress with elapsed time, because chain latency is variable — per 2b, lower the spinner-to-percent-done threshold when variance is high; show "step 2 of 3" since the stage count is known even when durations aren't. Never a static "Processing…" (indistinguishable from a hang, leading to double-pay).

**V4. Receipt page: three independent check panels with per-section loading and independent error boundaries.**
Receipt proof / event log / contract state each render in their own bounded panel: skeleton or inline spinner per section (spinners for single modules, 2c), each with its own failure state and its own retry. A failed event-log check must not block or gray out the verified receipt check. The payment-status verdict is computed only from checks that actually succeeded; a partially loaded receipt shows "2 of 3 checks complete" (percent-done-on-known-count pattern, 2b) — never a full-page spinner, never a blank shell (frame-display anti-pattern, 2c), never a green banner while any core check is pending (fail-closed).

**V5. Failed check = scoped, diagnostic, actionable — never a toast.**
A failed onchain check gets an inline panel-level state in amber/gray (not alarming red unless money is actually at risk), plain-language cause ("Couldn't reach the Monad RPC endpoint"), a "Retry" action, and a deep link to the block explorer (1f Communication + 2e#7: diagnostic errors distinguish "not yet" from "broken"). Error messages must never auto-dismiss — NN/g's observed failure: a fading 5-second error toast cost a user 5 minutes of dead waiting (1g).

**V6. Stale-state honesty on receipt and activity pages.**
Per the permanent-receipt model: always render the last-verified data with an explicit timestamp ("Verified 12:04:31 UTC, block #18234022") and a conditional staleness indicator when re-verification fails — never silently remove, downgrade, or blank previously verified content (NN/g wish-list principle, 1a: silently disappearing data "takes control away from the user and degrades trust"). Activity/history lists may show cached rows with a subtle "last updated" label and pull-to-refresh feedback (1e microinteraction).

**V7. Design the finality moment as the deliberate peak-end.**
The "Final" transition is Vajra's engineered positive peak *and* the journey's end: a brief, single celebratory microinteraction (one-shot checkmark draw-in or subtle haptic, under 1 s, no looping confetti) layered over the utilitarian receipt summary (2f Asana pattern: utility layer carries facts, delight layer carries emotion). The permanent receipt page is the "TurboTax relief screen" — calm, complete, no upsells, no dead ends; it deep-links back to proof forever (2g, 2e#13).

**V8. Long waits get low-granularity reassurance + honest estimates.**
If finality takes more than a few seconds, keep a heartbeat of small truthful updates ("Broadcast accepted by RPC endpoint…") rather than silence — NN/g: long update gaps make users assume failure (2e#9, "Joined the processing queue" pattern). Give padded time expectations ("Usually final in under a minute") rather than fake precision; finishing early is a "pleasant surprise," hanging at 99% destroys the gain (2b). If the user leaves, the receipt link + activity entry must let them resume watching later (pull channel, 2e).

**V9. Fail-closed language everywhere; passkey copy discipline.**
"Broadcast" is not "sent"; "included" is not "final"; a passkey is a *device signing key*, never "verified identity." Apply NN/g's plain-language rule (2e#3): every status label should pass the "would a non-crypto user predict what happens next?" test. Failure states must say what the user should do and what did *not* happen to their money ("Payment not sent. No MON left your wallet. You can retry.") — constructive advice, no blame, preserve their inputs (1f).

---

## 4. NOTABLE QUOTES & NUMBERS (with sources)

- **"Users… were willing to wait on average 3 times longer"** with an animated progress bar vs. none (Univ. of Nebraska-Lincoln; Nah 2004). https://www.nngroup.com/articles/progress-indicators/
- **0.1 / 1.0 / 10 s** response-time limits (Nielsen 1993, citing Miller 1968). https://www.nngroup.com/articles/response-times-3-important-limits/
- **80% of participants chose to repeat the longer (90 s) painful trial** because it ended less painfully — cold-pressor study, Kahneman et al. 1993. https://www.nngroup.com/articles/peak-end-rule/
- **"If a progress indicator speeds up towards the end, the process is judged to have been faster"** (Harrison et al. 2007, ACM UIST). https://www.nngroup.com/articles/peak-end-rule/
- **"When users are asked 'Are you sure you want to do this?' without further details… automated behavior provides no protection at all, and only serves to annoy users — and make them pay less attention to future warnings."** https://www.nngroup.com/articles/confirmation-dialog/
- **A mobile user "spent 5 minutes waiting for some content to load only because she hadn't noticed the little error message presented at the bottom of the screen that quickly faded away after 5 seconds."** https://www.nngroup.com/articles/indicators-validations-notifications/
- **"Plenty of extra clicks and double orders have resulted from such user-hostile design"** (no feedback on click). https://www.nngroup.com/articles/progress-indicators/
- **"~350 million people worldwide with a color-vision deficiency"** — never encode status by color alone. https://www.nngroup.com/articles/error-message-guidelines/
- **"A lack of information often equates to a lack of control."** https://www.nngroup.com/articles/visibility-system-status/
- iOS shake-to-undo is **"notoriously underused because it is so hard to discover."** https://www.nngroup.com/articles/user-control-and-freedom/
- Frame-display skeletons make users "assume the page isn't working and abandon it." https://www.nngroup.com/articles/skeleton-screens/

## Gaps / unverified items
- NN/g has **no dedicated article found** on stale/cached-data display or offline-first UX; rule V6 is synthesized from the wish-list/trust passage in the visibility-of-system-status article, the Spotify outage example in the peak-end article, and the error-message guidelines. Mark as synthesis, not a direct NN/g guideline.
- The 1993 cold-pressor study's **sample size is not stated** in NN/g's article — do not cite one without reading the original paper (Kahneman et al., Psychological Science 4(6):401-405).
- The famous **colonoscopy peak-end study (Redelmeier & Kahneman 1996)** is well-known background literature but is NOT cited in NN/g's article; cite separately if used.
- HPE Design System toast rules (8-second auto-dismiss, 3-line limit) surfaced in search but are **not NN/g** — use only as a non-NN/g supplement.
- NN/g's e-commerce transactional-email/confirmation report exists (nngroup.com/reports/ecommerce-transactional-email-confirmation-message/) but is paywalled; its specific confirmation-page guidelines were not retrievable and are not claimed here.
