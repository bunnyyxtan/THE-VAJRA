# NN/g 10 Usability Heuristics — Research Report for Vajra (Monad Payment-Request App)

Research date: this session (all URLs fetched live). Primary sources: nngroup.com articles fetched in full during this session. Supplementary sources flagged.

## 0. Provenance of the Heuristics (CORE THEORY — attribution)

- Jakob Nielsen developed the heuristics with **Rolf Molich in 1990** for heuristic evaluation (Molich & Nielsen 1990, *Communications of the ACM* 33(3), 338–348; Nielsen & Molich 1990, CHI'90, 249–256).
- In **1994** Nielsen refined the set based on a **factor analysis of 249 usability problems** to derive heuristics with maximum explanatory power (Nielsen 1994a, CHI'94, 152–158; Nielsen 1994b in *Usability Inspection Methods*).
- NN/g updated the article language in **2020** (Kate Moran, Feifei Liu; posters by Kelley Gordon) but states the 10 heuristics themselves are **unchanged since 1994**.
- Nielsen: "When something has remained true for 26 years, it will likely apply to future generations of user interfaces as well."
- Source: https://www.nngroup.com/articles/ten-usability-heuristics/

---

## HEURISTIC 1 — VISIBILITY OF SYSTEM STATUS (deep dive)

### 1. Core theory
- Definition: "The design should always keep users informed about what is going on, through appropriate feedback within a reasonable amount of time."
- Grounded in Don Norman's **Gulf of Evaluation** ("Did this work how I wanted it to?") — users cannot bridge the gulf without status feedback.
- NN/g (Aurora Harley, 2018): "A lack of information often equates to a lack of control"; "The predictability of the interaction creates trust not only in the mechanics of the site or the app, but also in the brand itself."
- Source: https://www.nngroup.com/articles/visibility-system-status/

### 2. Response-time research (the numbers behind "reasonable time")
From Nielsen's *Response Times: The 3 Important Limits* (1993, excerpted from *Usability Engineering*; advice "about the same for thirty years" citing Miller 1968, Card et al. 1991):
- **0.1 s** — limit for feeling the system reacts instantaneously; no special feedback needed.
- **1.0 s** — limit for uninterrupted flow of thought; user notices delay but no special feedback needed.
- **10 s** — limit for keeping user attention; longer delays need feedback with expected completion time, and a way to interrupt.
- Percent-done indicators (Myers 1985, CHI'85) for operations > ~10 s: reassure the system hasn't crashed, indicate wait length, reduce perceived pain.
- For 2–10 s: a "busy" indicator suffices; a full percent-done bar would violate "display inertia" (flashing changes users can't track).
- Source: https://www.nngroup.com/articles/response-times-3-important-limits/

### 3. NN/g's specific guidelines (progress indicators article, 2014)
- **Always give immediate feedback** the moment the user acts (button pressed-state); otherwise users assume the action wasn't registered and retry — "Plenty of extra clicks and double orders have resulted from such user-hostile design."
- Use a progress indicator for **any action > ~1.0 s**.
- **Looped animation (spinner): only for fast actions, ~2–10 s.** Under 1 s it's distracting; over 10 s users can't tell if the system is stuck and abandon.
- **Percent-done / step-based indicator for ≥ 10 s.** Include text explaining the process ("Updating address 3 of 50"). Start animation slow, speed up toward end; give general time estimates, padded ("About 3 minutes remaining").
- **Never use static "Loading…" indicators** — if the system hangs, users can't tell.
- **Never use "don't click again / clicking twice may create an extra order" warnings.** Instead, show that the first click was accepted and is being worked on.
- Key study: Nah (2004), University of Nebraska-Lincoln (*Behaviour & Information Technology* 23(3)) — users shown a looped progress bar were willing to wait **~3× longer** and reported higher satisfaction than users shown nothing.
- Source: https://www.nngroup.com/articles/progress-indicators/

---

## HEURISTIC 2 — MATCH BETWEEN SYSTEM AND REAL WORLD

### Core theory
- Speak the users' language; words, phrases, concepts familiar to the user, not internal jargon. Follow real-world conventions ("natural mapping" per Norman).
- "Terms, concepts, icons, and images that seem perfectly clear to you and your colleagues may be unfamiliar or confusing to your users."
- Related mistake-prevention research (Heuristic 5): a mismatch between the user's mental model and the designer's is the root of conscious "mistakes."

### NN/g guidelines
- Information should appear in a natural and logical order matching real-world expectations.
- Don't assume users will learn your mental model — "with most consumer-facing apps and websites users just navigate to a different site instead of bothering to learn a tricky one."
- Sources: https://www.nngroup.com/articles/ten-usability-heuristics/ , https://www.nngroup.com/articles/user-mistakes/

---

## HEURISTIC 3 — USER CONTROL AND FREEDOM

### Core theory
- "Users often perform actions by mistake. They need a clearly marked 'emergency exit' to leave the unwanted action without having to go through an extended process."
- Easy back-out/undo "fosters a sense of freedom and confidence."

### NN/g guidelines (from mistake-prevention article)
- **Support undo** for destructive actions — NN/g cites Gmail's contextual Undo (including undoing a sent email up to 30 s after Send) as exemplar.
- For long processes, "give users the option to stop the process... Otherwise, your design may be hijacking control of the system, leaving the user powerless."
- Where undo is impossible, confirmation-before-commit and previews become the safety net.
- Sources: https://www.nngroup.com/articles/ten-usability-heuristics/ , https://www.nngroup.com/articles/user-mistakes/ , https://www.nngroup.com/articles/progress-indicators/

---

## HEURISTIC 4 — CONSISTENCY AND STANDARDS

### Core theory
- "Users should not have to wonder whether different words, situations, or actions mean the same thing. Follow platform and industry conventions."
- **Jakob's Law**: "users spend most of their time on other websites" — other products set users' expectations; deviation increases cognitive load and error rates.
- NN/g example of a consistency failure: Southwest's mobile site greyed out both past dates (unavailable) and next month's dates (available), falsely implying unavailability.

### Guidelines
- Use standard, recognizable control signifiers (buttons with outer shadow = pushable; fields with inner shadow = fillable).
- One icon/word per concept across the whole product (NN/g faults Windows 10 for using both X and ! icons for the same deletion warning).
- Sources: https://www.nngroup.com/articles/ten-usability-heuristics/ , https://www.nngroup.com/articles/user-mistakes/ , https://www.nngroup.com/articles/confirmation-dialog/

---

## HEURISTIC 5 — ERROR PREVENTION (deep dive)

### 1. Core theory — slips vs mistakes
- Two error types, per Don Norman (*The Design of Everyday Things*):
  - **Slips**: unconscious errors from inattention; user intends the right action but executes a similar wrong one. Ironically most common among **expert** users on autopilot.
  - **Mistakes**: conscious errors; the goal itself is wrong because the user's mental model doesn't match the design.
- Blame assignment: "The term 'user error' implies that the user is at fault... Not so. The designer is at fault for making it too easy for the user to commit the error. The answer is to redesign the system to be less error prone."
- Sources: https://www.nngroup.com/articles/slips/ , https://www.nngroup.com/articles/user-mistakes/

### 2. NN/g guidelines — preventing slips
- **Helpful constraints**: constrain inputs to valid values (e.g., Southwest calendar forbids return-before-departure).
- **Suggestions**: autocomplete/search suggestions preempt typos (critical on touchscreens lacking haptic feedback).
- **Good defaults**: sensible presets (e.g., reminder defaults "Tomorrow / Next week / In one hour") prevent typos and teach reasonable values.
- **Forgiving formatting**: accept flexible human input, scrub/format behind the scenes, auto-format as the user types (Uber phone-number example); chunk long digit strings so users can scan and catch their own errors.

### 3. NN/g guidelines — preventing mistakes
- **Bridge the two gulfs**: Execution ("How do I work with this tool?") and Evaluation ("Did it do what I wanted?").
- **Gather user data** (contextual inquiry, field studies, qualitative usability tests) to find mental-model gaps.
- **Follow design conventions** (Jakob's Law).
- **Communicate affordances with clear signifiers** (NN/g faults Polarr's swipe controls that don't signal how to interact).
- **Preview results** before heavyweight/irreversible commits (iOS display-zoom preview requiring a restart).
- **Remove memory burdens**: "imagine that your users could be interrupted by a phone call after every step in a multistep process. You want to show all of the information users need to readily resume their tasks after having been interrupted for several minutes." (Hipmunk example: dates, airports, chosen outbound fare all visible at step 2.)
- **Confirm before destructive actions**; **support undo**; **warn before errors are made** (Twitter's live character counter, negative-count + disabled Tweet button once over).

### 4. NN/g's 8 confirmation-dialog guidelines (2018)
1. Use confirmations for actions with **serious consequences** — destroying work or **costing large amounts of money** — especially actions that **cannot be undone**.
2. **Never for routine actions** — "The Boy Who Cried Wolf" / "The Computer That Cried Confirm": overuse converts the dialog into automated behavior that increases errors.
3. Be **specific**: restate the request and its consequence ("Delete file X", never "Are you sure?"). NN/g faults YouTube's non-specific delete dialog.
4. Buttons must **summarize the outcome** ("Delete file" / "Keep file"), not Yes/No.
5. Use **progressive disclosure** ("Tell me more") for secondary consequences.
6. **No default Yes**; ideally no default answer at all.
7. For the **most dangerous** operations, require a **nonstandard action** (MailChimp requires typing DELETE; Don Norman suggests requiring a different user for the most dangerous actions).
8. Allow a "**don't ask again**" bypass only for low-stakes educational confirmations.
- Personalization example: a banking site might confirm only payments "at least twice the amount of each user's normal range" (explicitly flagged as an example, not an optimal threshold — requires user research).
- Source: https://www.nngroup.com/articles/confirmation-dialog/

---

## HEURISTIC 6 — RECOGNITION RATHER THAN RECALL (deep dive)

### 1. Core theory
- Memory organized in chunks with **activation** levels, driven by **practice**, **recency**, and **context** (associations spread activation — Proust's madeleine).
- Recognition is easier than recall because it provides **more retrieval cues**. NN/g's example: "Is Lisbon the capital of Portugal?" is easier than "What's the capital of Portugal?" — multiple-choice beats open-ended.
- Referenced study: **Adar, Teevan & Dumais (2008, CHI)** — large-scale analysis of web revisitation patterns; people prefer re-finding pages via search-engine + SERP recognition over recalling URLs. Search suggestions partly transform query generation from recall to recognition.
- Source: https://www.nngroup.com/articles/recognition-and-recall/ (Raluca Budiu, 2014)

### 2. NN/g guidelines
- Make information and interface functions **visible and easily accessible** — menus (recognition) beat command lines (recall); gestural interfaces are recall-heavy and risky.
- **History and recently-viewed content** (Google/Bing search history, Amazon recently viewed) lets users resume incomplete tasks without recall.
- **No upfront tutorials** — "People are supposed to memorize that information and remember it when they need it. That's not going to happen." Use **contextual tips** tailored to the current page instead.
- **Label icons** (Volvo app icons faulted for unrecognizability).
- Reduce information users must carry between steps (ties to Heuristic 5's "remove memory burdens").

---

## HEURISTIC 7 — FLEXIBILITY AND EFFICIENCY OF USE

- "Shortcuts — hidden from novice users — may speed up the interaction for the expert user so that the design can cater to both inexperienced and experienced users. Allow users to tailor frequent actions."
- Flexible processes can be carried out in different ways, so people pick what works for them.
- Source: https://www.nngroup.com/articles/ten-usability-heuristics/

---

## HEURISTIC 8 — AESTHETIC AND MINIMALIST DESIGN

- "Interfaces should not contain information that is irrelevant or rarely needed. **Every extra unit of information in an interface competes with the relevant units of information and diminishes their relative visibility.**"
- Not about flat design — about keeping content and visual design focused on essentials that support primary goals.
- Source: https://www.nngroup.com/articles/ten-usability-heuristics/

---

## HEURISTIC 9 — HELP USERS RECOGNIZE, DIAGNOSE, AND RECOVER FROM ERRORS (deep dive)

### 1. Core theory
- "Error messages should be expressed in plain language (no error codes), precisely indicate the problem, and constructively suggest a solution." Presented with visual treatments that make them noticeable.
- Error handling is one of the **5 quality components of usability**; error frequency/severity is negatively related to usability.
- Sources: https://www.nngroup.com/articles/ten-usability-heuristics/ , https://www.nngroup.com/articles/error-message-guidelines/

### 2. NN/g guidelines — Visibility
- **Display the error message close to the error's source** (proximity reduces cognitive load; NN/g faults Instagram's far-away, subtly styled error).
- **Noticeable, redundant, accessible indicators**: bold/high-contrast/red text + border highlight + iconography (Amazon example). Never use color or animation *exclusively* — ~**350 million people worldwide have color-vision deficiency**.
- **Design errors by severity/impact**: "good to know" warnings (banners, toasts, conditional labels — e.g., Kohl's shipping-delay notice without red) vs blocking errors (modal dialogs reserved for severe cases).
- **Don't display errors prematurely** — "It's like grading a test before the student has had a chance to answer." Don't treat exploratory interactions (tabbing out of an empty field) as errors (Texas vehicle-registration bad example). Do use inline real-time guidance for error-prone inputs (CLEAR password-requirement checklist).

### 3. NN/g guidelines — Communication
- **Human-readable language**; avoid jargon; hide error codes except for technical diagnostics. (NN/g: the 404 page violates this guideline.)
- **Concisely and precisely describe the issue** — "An error occurred" is useless; but beware excessive technical precision that undermines understandability.
- (Note: the article has further "Efficiency" guidelines — constructive solutions, preserving user effort/input — but the fetched text was truncated mid-article; treat this last clause as partially verified, not quoted.)

---

## HEURISTIC 10 — HELP AND DOCUMENTATION

- Best if the system needs no explanation; when documentation is necessary it must be **easy to search**, **task-focused**, **concise**, with **concrete steps**.
- Related: prefer contextual help over long memorizable tutorials (Heuristic 6).
- Source: https://www.nngroup.com/articles/ten-usability-heuristics/

---

# APPLICATION TO VAJRA (10 actionable rules)

Hard constraints honored: no fake success (success requires onchain proof); money actions fail closed; passkey never described as "verified identity."

**V1. Model the payment as an explicit, visible state machine — and never lie about the state.**
Sender payment page shows labeled stages: `Signed → Broadcast → Included in block → Final`. Each transition is driven only by observed chain events; "Paid ✓" renders only after finality is observed onchain, with block number + tx hash. Rationale: Heuristic 1 (visibility builds trust: "predictability... creates trust... in the brand itself") + no-fake-success constraint. A stuck transaction must render as "still waiting" with elapsed time, never silently flip or fake-complete.

**V2. Map feedback latency to Nielsen's 0.1/1/10-second thresholds.**
Button press → pressed-state within 0.1 s. Wallet/passkey signing prompt → looped spinner acceptable for the 2–10 s window, with text ("Waiting for wallet signature…"). Broadcast-to-finality (variable, can exceed 10 s) → step/percent-style indicator with a padded time estimate ("Usually final in ~2 s on Monad; waiting 8 s…"). Never a static "Processing…". Rationale: response-time limits (Nielsen 1993; Miller 1968) + progress-indicator guidelines; Nah 2004: progress feedback triples wait tolerance.

**V3. Kill double-payment risk with accepted-click feedback, not warnings.**
On Pay click, immediately disable the button and show "Payment submitted — waiting for confirmation" with the pending tx hash. Per NN/g, "don't click twice, you may create an extra order" warnings are "the worst design"; instead show the first click was accepted. Rationale: Heuristics 1+5. This also fails closed: if broadcast fails, the button re-enables with an error — money never moves twice.

**V4. The pay confirmation is a specific, high-stakes confirmation dialog.**
Before signing, restate the full request: amount in MON, recipient address (truncated + copyable full), memo, expiry. Buttons labeled `Pay 12.5 MON` and `Cancel` — never Yes/No; no default focused on Pay. For unusually large amounts (per NN/g's personalized-threshold example, e.g., ≥2× the payer's typical payment), add the nonstandard-confirmation step (type the amount). Rationale: confirmation-dialog guidelines 1, 3, 4, 6, 7 — confirmations are explicitly recommended for actions "costing large amounts of money" that "cannot be undone."

**V5. Keep every term visible at every step — zero memory burden across the flow.**
Amount, recipient, memo, and expiry remain on screen during connect-wallet, signing, and finality-watching stages; the sender never has to recall what they saw two screens ago. Design test (NN/g): could a user interrupted by a phone call mid-flow resume correctly from what's on screen? Rationale: Heuristic 6 + mistake prevention ("remove memory burdens," Hipmunk pattern). Also: Activity/History page and permanent receipt URL exist precisely so users re-find requests via recognition (Adar/Teevan/Dumais 2008 revisitation finding), not recall.

**V6. Constrain and auto-format every input in the request-creation form.**
Amount field: numeric keypad, locale-aware decimal parsing, handles pasted commas; reject zero/negative with inline guidance. Expiry: date-time picker that disables past times; default 24 h (good default teaches reasonable values). Optional payer address: validate checksum/format live as they type (warn-before-error, Twitter-counter pattern) — never reject on blur of an exploratory focus. Rationale: slip-prevention (constraints, forgiving formatting, good defaults) + error-message timing guideline.

**V7. Translate chain failures into plain language, placed at the source, severity-graded.**
Never show revert codes, "0x" data, or RPC errors. "Not enough MON — you have 8.2, this request needs 12.5" adjacent to the Pay button; "This request expired 2 hours ago — ask the recipient for a new link" as a blocking modal (severe); "Network congestion may slow confirmation" as a non-red banner (advisory). Redundant indicators: color + icon + text (350M users with color-vision deficiency). Rationale: Heuristic 9 visibility + communication guidelines. Fail closed: any unparseable chain state renders as an explicit error state with next steps, never as success or silence.

**V8. Describe the passkey in the user's language — a device key, not an identity.**
Registration ceremony copy: "Create a key on this device to sign your payment requests — like a handwritten signature, not an ID check." Never "verify your identity." Use familiar real-world metaphors (signature, expiry like a post-dated cheque). Rationale: Heuristic 2 (users' language; "terms clear to you and your colleagues may be unfamiliar to your users") + the explicit product constraint.

**V9. Compensate for onchain irreversibility with preview + control everywhere else.**
Onchain payments can't be undone — so per NN/g, previews and confirmations become the safety net: the sender page itself is the "preview result" (all terms verifiable before commit); explicitly state "Once confirmed, this payment can't be reversed" before signing (specific consequence, guideline 3). Everywhere undo *is* possible, provide it: cancel/expire a request you created, edit draft requests, back navigation at every pre-broadcast step. During the finality wait, offer "Leave this page — we'll keep watching; view status anytime at the receipt link" (option to stop waiting, not hijack control). Rationale: Heuristics 3 + 5.

**V10. Minimalist pay page, progressive-disclosure chain details, contextual help.**
Sender page foregrounds: amount, recipient, terms, Pay button. Block number, gas, validator data live behind a "Details" disclosure (progressive disclosure, confirmation-dialog guideline 5) — "every extra unit of information... diminishes relative visibility" (Heuristic 8). No onboarding tutorials; use contextual tips inline at the passkey ceremony and first request ("This link expires in 24 h — share it with your payer"). Help docs: searchable, task-focused ("Why is my payment still pending?", "What does final mean?"). Power users get flexibility: copy raw tx hash, explorer deep link, request templates (Heuristic 7). Rationale: Heuristics 8, 10, 6, 7.

---

# NOTABLE QUOTES / NUMBERS (all verified this session)

1. **249 usability problems** — the factor-analysis basis for the 1994 heuristic revision. https://www.nngroup.com/articles/ten-usability-heuristics/
2. **0.1 / 1.0 / 10 seconds** — instantaneous / flow-of-thought / attention limits (Miller 1968; Card et al. 1991; Nielsen 1993). https://www.nngroup.com/articles/response-times-3-important-limits/
3. **~3× longer wait tolerance** with a looped progress bar vs none (Nah 2004, University of Nebraska-Lincoln, *Behaviour & Information Technology* 23(3)). https://www.nngroup.com/articles/progress-indicators/
4. **~350 million people worldwide** with color-vision deficiency — never signal errors by color alone. https://www.nngroup.com/articles/error-message-guidelines/
5. "Plenty of extra clicks and **double orders** have resulted from such user-hostile design" (no immediate feedback). https://www.nngroup.com/articles/progress-indicators/
6. "The designer is at fault for making it too easy for the user to commit the error." https://www.nngroup.com/articles/slips/
7. "The Computer That Cried Confirm" — overused confirmations *increase* errors. https://www.nngroup.com/articles/user-mistakes/
8. **Jakob's Law**: "users spend most of their time on other websites." https://www.nngroup.com/articles/user-mistakes/
9. "Imagine that your users could be **interrupted by a phone call after every step** in a multistep process." https://www.nngroup.com/articles/user-mistakes/
10. Recognition-beats-recall exemplar: "Is Lisbon the capital of Portugal?" beats "What's the capital of Portugal?" https://www.nngroup.com/articles/recognition-and-recall/
11. "Tutorials have a lot of information, but they are not rehearsed much... That's not going to happen" — use contextual tips instead. https://www.nngroup.com/articles/recognition-and-recall/
12. "Every extra unit of information in an interface competes with the relevant units of information and diminishes their relative visibility." https://www.nngroup.com/articles/ten-usability-heuristics/
13. Gmail Undo-send (up to 30 s) as the exemplar of undo for destructive actions. https://www.nngroup.com/articles/user-mistakes/
14. MailChimp's type-DELETE nonstandard confirmation as the exemplar for the most dangerous actions. https://www.nngroup.com/articles/confirmation-dialog/
15. Adar, Teevan & Dumais (2008, CHI): users prefer re-finding web content via search + SERP recognition. https://www.nngroup.com/articles/recognition-and-recall/

## Unverified / partially verified flags
- The *Error-Message Guidelines* article's "Efficiency" section (constructive solutions, preserving user input) was truncated in the fetch; the section exists but its exact wording was not captured. Do not quote it verbatim without re-fetching.
- The "twice the usual payment amount" confirmation threshold is explicitly NN/g's illustrative example, not a researched optimum ("determining that requires user research").
- Effect sizes/sample sizes: NN/g articles rarely report sample sizes; the only study-level citations retrieved are Nah (2004) (~3× wait tolerance) and the 249-problem factor analysis. No other effect sizes should be cited without further sourcing.
