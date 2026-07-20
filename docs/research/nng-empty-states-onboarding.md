# NN/g Research: Empty States, Onboarding & First-Run Experience — Applied to Vajra

Compiled from nngroup.com primary sources (fetched and verified). See Section 4 for URLs.

## 1. CORE THEORY

### 1.1 Intentionally designed empty states (blank-slate design)
Source: "Designing Empty States in Complex Applications: 3 Guidelines" (NN/g, Sept 19, 2021).
Empty states are containers/screens/panels for which content does not yet exist or cannot be displayed. Core principle: the default of an empty space is to remain empty, but this "ultimately creates confusion and decreases user confidence — and misses a goldmine of opportunities for increasing the usability and the learnability of the application, as well as the discoverability of key features." Three functions: (a) communicate system status, (b) increase learnability via in-context learning cues ("pull revelations"), (c) provide direct pathways to key tasks. Grounded in Nielsen's Heuristic #1 (Visibility of System Status). Note: a misleading status message (e.g., showing "No records" while data is still loading) is explicitly called out as *worse* than no message.

### 1.2 Front-loaded tutorials don't work — paradox of the active user
Sources: "Mobile Tutorials: Wasted Effort or Efficiency Boost?" (NN/g, Mar 8, 2020); "Onboarding Tutorials vs. Contextual Help" (NN/g, Feb 12, 2023).
Study details (2020): between-subjects, remote unmoderated quantitative usability test (Userlytics), 70 participants (35 read tutorial / 35 skipped), 4 iOS apps (Movesum, Brainsparker, LaunchCenter Pro, SketchBook). Findings:
- Task success: 91% (read) vs 94% (skipped) — NOT statistically significant (p=0.443).
- Perceived ease (SEQ, 1-7): 4.92 (read) vs 5.49 (skipped) — statistically significant (p=0.047). Users who read tutorials perceived tasks as MORE difficult; "half a point is a fairly substantial difference on a 1-7 rating scale."
- Task-completion time (geometric mean): 93.49s (read) vs 85.17s (skipped) — not significant (p>0.1), and this excludes tutorial-reading time.
Mechanism (2023 article): three failure modes of tutorials/"push revelations": (1) the paradox of the active user — people want to start using the product immediately and skip prep work even if it would help long-term; (2) out-of-context information is hard to remember when needed (limited working memory); (3) dismissing push content itself costs effort and annoys.
Limitations NN/g itself flags: only 4 iOS apps; may not generalize (though iOS/Android UIs have converged).

### 1.3 Pull revelations (contextual help) beat push revelations
Same sources. In-context help "can often be applied right away and is thus more memorable — users have little time to establish associations between lengthy onboarding content and the actual interface." Pull revelations are triggered by a signal that the user would benefit now (empty state, first encounter with a feature, a "teachable moment" after an error). Interactive walkthroughs (learn-by-doing in a low-stakes environment, e.g., Temple Run 2, MindNode) "feel more like a practice round and less like a tutorial."

### 1.4 Progressive disclosure (vs front-loading)
Source: "Progressive Disclosure" (NN/g, Dec 3, 2006, Jakob Nielsen).
Show initially only a few of the most important options; disclose larger specialized sets only on request. Improves 3 of usability's 5 components: learnability, efficiency, error rate. Two things must be right: the split between initial and secondary features (via task analysis/usage data), and an obvious, well-scented progression mechanism. Designs beyond 2 disclosure levels "typically have low usability." Variant: staged disclosure (wizards) — good for linear tasks with independent steps.

### 1.5 Priming & expectation setting
Source: "Priming and User Interfaces" (NN/g, Jan 24, 2016).
Exposure to a stimulus influences subsequent behavior and interpretation. Cited studies: Holland, Hendriks & Aarts (2005, Psychological Science 16: 689-693 — scent of cleaner primed cleaning-related cognition/behavior); Srull & Wyer (1979, JPSP 37: 1660-1667 — trait-word priming shifted person judgments). UX implication: word choice and early screens set expectations that color everything after; "use it to your and your users' advantage, and bias people into behaviors and expectations that match your site's goals and their needs." Related: the 2020 tutorial study shows a tutorial itself primes users to expect complexity.

### 1.6 Peak-end rule (the achievement moment)
Source: "The Peak-End Rule: How Impressions Become Memories" (NN/g, Dec 30, 2018).
Grounded in Kahneman & Frederickson (1993) cold-water study: participants who endured 60s at 14C PLUS an extra 30s at 15C preferred repeating the LONGER trial — 80% chose it — because it ended slightly better. "Intense positive or negative moments (the 'peaks') and the final moments of an experience (the 'end') are heavily weighted in our mental calculus." NN/g guidance: identify the most rewarding points in the journey and design them deliberately; a bright color/icon/illustration at the end of a successful interaction "can solidify a good experience" (Duolingo example). Negative peaks are remembered more vividly than positive ones (Maytag menu example).
NOTE: NN/g has no article on "inbox zero" specifically — the peak-end rule is the correct, verified theoretical anchor. Treat any "inbox zero" framing as our application, not NN/g's term.

### 1.7 Passkeys (authentication first-run)
Source: "Passwordless Accounts: One-Time Passwords (OTPs) and Passkeys" (NN/g, Jun 25, 2023).
Passkey = "a password that is invisible to the user," created and stored (encrypted) on the device, unlocked via biometrics. More usable than passwords (nothing to remember/store/type) and lower interaction cost than OTPs; more secure (not stored per-website, phishing-resistant). Catch: cross-device use may require QR-code scanning. NN/g survey figures: 76% of respondents save passwords on their phones; 17% use a third-party password manager; 83% use biometric authentication at least occasionally (95% CI: 73%-87%).

### 1.8 Waiting & system status (for finality watching)
Source: "Skeleton Screens 101" (NN/g, Jun 4, 2023; cites Mejtoft, Langstrom & Soderstrom 2018, ECCE).
Wait-time thresholds: <1s -> no indicator needed; 2-10s -> spinner or skeleton screen; >10s -> progress bar STRONGLY recommended ("anything above 10 seconds requires an explicit estimation of duration"). Skeleton screens are for full-page loads only; for process indicators (download, conversion, confirmations) use a progress bar or wizard/stepper instead. Frame-display-only skeletons are not recommended (users assume the page is broken).

## 2. NN/g'S SPECIFIC GUIDELINES (granular do/don't)

### Empty states (2021 article)
- DON'T default to totally empty states — users can't tell if it's loading, errored, or truly empty.
- DO show a brief system-status message once a process completes with no output (e.g., "There are no records to display for the selected date range").
- DON'T ever show a misleading status (e.g., "No records" during loading) — "a worse, yet equally common scenario."
- DO use empty states as learning cues: tell the user what could be displayed there and how to populate it (DataDog: "Star your favorites to list them here").
- DO provide direct pathways: explicit instructions or, better, a link/button that starts the task from within the empty state (e.g., a Create button + Learn more link); don't describe a task without showing how/where to do it.
- DO consider offering demo/sample data for safe exploration of complex features (Loggly: add log sources OR populate demo data).
- DO show progress indicators while a process is running.

### No-results pages ("3 Guidelines for Search Engine 'No Results' Pages", NN/g)
1. Make it obvious there are no results — clear statement, strong typography, in the main body of the page (eyetracking showed users completely miss small, lightweight messages squeezed between header elements — NexTag example).
2. Offer a path forward: restate the original query; keep the query in an editable search box; suggest similar queries that DO return results; spelling corrections; advice on modifying queries (different/fewer words).
3. Don't mock the user — extreme caution with humor/whimsical imagery on failure pages; users can't tell if you're laughing with or at them (Help-U-Sell example).
Good example: Food.com — empathetic "Sorry, no results were found" in large bold text + query-improvement advice.

### Onboarding (2020 components article + 2023 contextual-help article)
- Skip onboarding whenever possible. Costs: higher interaction cost, memory strain, no demonstrated performance benefit.
- Onboarding IS warranted only when: (1) you need user info to get started (e.g., account/identity in banking); (2) functionality is highly tailored to user context/preferences; (3) features/workflows are unique, non-standard, or genuinely novel.
- Test the app with NO onboarding before investing in it; prototype onboarding only if users show difficulty.
- Feature promotion: avoid at first launch (users will skip; put it on the store page instead); highlight features contextually when they become actionable (e.g., stats after 7 days of data); for existing users, limit feature onboarding to what is TRULY new — repeatedly pushing old features trains users to ignore all onboarding.
- Customization: no visual-design customization in onboarding (people stick with defaults; they can't judge before using); content customization is OK if brief — explain WHY the data is needed, provide a Skip option and a progress indicator.
- Instructions: never to supplement poor design; must be brief, optional, minimum need-to-know.
- Deck-of-cards: NOT recommended. If used anyway: highly visible Skip, minimal cards, one concept per card.
- Instructional overlays/coach marks: must be timely (first encounter with a feature) and unobtrusive; don't highlight every element on one screen (NOAA anti-pattern); don't explain standard icons.
- Interactive walkthroughs: learn-by-doing, low-stakes practice, brief, novel interactions only, include Skip.

### Progressive disclosure (2006)
- Initial screen: only the few most important options. Everything frequently needed must be up front; rarely-used options deferred.
- Progression mechanism must be simple and labeled with strong information scent.
- Max ~2 disclosure levels in practice.
- Staged disclosure (wizard) for linear, low-interdependence step sequences.

### Passkeys (2023 recommendations)
- After a passwordless account is created, still OFFER the option of a password and of biometric authentication (user choice).
- For OTPs let users choose email vs SMS.
- For passkeys, support multiple devices via QR-code scanning.

### Skeleton screens / waiting (2023)
- <1s: nothing. 2-10s: spinner (single module) or skeleton (full page). >10s: progress bar with duration estimation.
- Process steps (non-page-load) -> progress bar or step wizard, NOT skeleton screen.
- No frame-display-only skeletons. Animations can distract/cause accessibility issues.

## 3. APPLICATION TO VAJRA (rules, mapped to screens & constraints)

R1 — Passkey ceremony: no front-loaded tutorial. Land first-time recipients directly on a single "Create your signing key" step (staged disclosure: one step, one action). NN/g's 70-user study shows tutorials add no success/speed benefit and make the task feel harder — exactly the wrong priming for a security ceremony.

R2 — Prime the passkey correctly (Priming article): one short sentence before the OS prompt: what it is ("a key stored on this device, unlocked with your fingerprint/face"), what it does ("signs your payment requests"), what it is NOT. Never "verified identity," "account," or "login" — those words prime wrong mental models (passwords, KYC). Per NN/g passkey article, emphasize "nothing to remember or type." Prime the duration: "takes a few seconds."

R3 — Passkey settings = progressive disclosure: default view shows only key nickname/device + created date; advanced options (add second device via QR — per NN/g's QR recommendation, recovery/revoke) behind a clearly labeled secondary level. Max 2 levels.

R4 — Empty activity page = status + cue + pathway (all 3 empty-state functions): (a) explicit status: "No payment requests yet" (never blank, never a spinner that resolves to blank); (b) learning cue: "Requests you create appear here with their onchain status"; (c) direct pathway: primary button "Create your first request" — the task starts from within the empty state.

R5 — Demo data option, but truth-labeled: following the Loggly pattern, let first-time recipients generate a clearly-labeled SAMPLE request/receipt (testnet or visibly watermarked "Sample — not a real payment") to explore safely. Hard-constraint guardrail: sample data must be visually unmistakable and must never be presented as a real finalized payment (no fake success).

R6 — Empty search results (activity search): make "no results" unmistakable in the main body; restate and preserve the query in an editable box; offer concrete recovery paths — "check the full 0x address / request ID," "clear filters," "create a new request." No whimsical/mocking imagery (NN/g no-results guideline 3). Distinguish "no matches" from "still syncing": while the indexer is loading, show a progress indicator, NEVER a premature "No requests found" — NN/g calls misleading status messages worse than none (this also maps to fail-closed: absent data is not zero data).

R7 — Sender payment page as staged disclosure with honest progress: verify terms -> connect wallet -> pay -> track. The finality watch (broadcast/included/final) is a process, not a page load — use a stepper/progress indicator with explicit stage labels and, if finality can exceed ~10s, explicit duration estimation (NN/g: ">10s requires explicit estimation"). No spinner-only ambiguity on a money screen.

R8 — No fake success, ever (maps to NN/g's misleading-status finding): the UI may show "Broadcast" and "Included" as intermediate states, but "Paid/Success" styling, checkmarks, and celebration are gated on confirmed finality from the chain. A premature success state that later reverts creates exactly the "negative peak" users remember most vividly (peak-end rule) — and violates our fail-closed constraint.

R9 — The finalized receipt is the designed peak AND the end (peak-end rule): make the permanent receipt page the deliberate positive moment — clear "Final" state, amount, timestamp, block/tx proof, shareable link, tasteful visual celebration (Duolingo-style affirmation). It is simultaneously the emotional peak and the journey's end, so it's what both parties will remember. Because it's the "inbox-zero" moment for the recipient (request fulfilled -> cleared), let the receipt close the loop in the activity list (request visibly transitions to "Paid / Final").

R10 — First payment-request form: progressive disclosure + teachable moments. Initial disclosure: amount + expiry (+ memo). Optional payer and advanced options deferred behind one clearly labeled expansion. Don't teach fields upfront — explain in context (pull revelation on first focus) and use errors as "teachable moments" (e.g., an expired-request error that explains expiry when it actually matters).

R11 — Expectation-setting for senders (priming): before wallet connect, state plainly: "You'll pay X MON in one transaction; it typically finalizes in ~N seconds; the receipt is permanent and verifiable onchain." Primed expectations make the wait tolerable and the final receipt confirm the promise — mismatch between prime and reality is what generates negative peaks.

R12 — No login wall for senders: NN/g's "Login Walls Stop Users in Their Tracks" principle — a sender opening a request link must see full terms before any wallet/passkey commitment. Verification of terms precedes any commitment step; money actions fail closed (any uncertainty about terms, expiry, or amount = block, not warn-and-continue).

## 4. NOTABLE QUOTES / NUMBERS (with sources)

- "Tutorials don't make users faster or more successful at completing tasks; on the contrary, they make them perceive the tasks as more difficult." — 70 users, 4 apps; success 91% vs 94% (p=0.443, ns); SEQ 4.92 vs 5.49 (p=0.047); time 93.49s vs 85.17s (ns). https://www.nngroup.com/articles/mobile-tutorials/
- "Users want to start using the product right away... This is known as the paradox of the active user." (NN/g uses the term; original concept from Carroll & Rosson 1987 — background knowledge, not cited on the NN/g page: marked as such.) https://www.nngroup.com/articles/onboarding-tutorials/
- "Don't let empty-state design be an afterthought." + misleading-status warning. https://www.nngroup.com/articles/empty-state-interface-design/
- Peak-end: 80% of Kahneman & Frederickson's (1993) participants preferred repeating the LONGER (90s) cold-water trial because it ended slightly warmer. https://www.nngroup.com/articles/peak-end-rule/
- Wait thresholds: <1s no indicator; 2-10s spinner/skeleton; ">10 seconds requires an explicit estimation of duration." https://www.nngroup.com/articles/skeleton-screens/
- Passkeys: "a password that is invisible to the user"; survey: 76% save passwords on phones, 83% use biometrics at least occasionally (95% CI 73-87%). https://www.nngroup.com/articles/passwordless-accounts/
- No-results: eyetracking showed users completely missed a de-emphasized "no matches" message (NexTag). https://www.nngroup.com/articles/search-no-results-serp/
- Progressive disclosure "improves 3 of usability's 5 components: learnability, efficiency of use, and error rate"; >2 levels "typically have low usability." https://www.nngroup.com/articles/progressive-disclosure/
- Priming studies cited by NN/g: Holland et al. 2005 (Psych. Science 16:689-693); Srull & Wyer 1979 (JPSP 37:1660-1667). https://www.nngroup.com/articles/priming/
- Onboarding warranted only for: required user info, high personalization, genuinely novel workflows; onboarding components = feature promotion, customization, instructions; avoid feature promotion at first launch. https://www.nngroup.com/articles/mobile-app-onboarding/
- Login walls: NN/g advises not requiring login/account before use ("Login Walls Stop Users in Their Tracks", listed in NN/g Mobile UX Study Guide). https://www.nngroup.com/articles/mobile-ux-study-guide/

## UNVERIFIED / GAPS
- NN/g has no article specifically on "inbox zero" or achievement/celebration patterns in productivity apps; the peak-end rule is the closest verified anchor. Any "inbox zero" citation to NN/g would be fabricated — do not use.
- NN/g has no research on blockchain finality UX specifically; the progress-indicator thresholds (Section 1.8) are the applicable verified guidance.
- The paradox of the active user originates with Carroll & Rosson (1987); NN/g uses the term but the 2023 page does not cite the origin — attribution beyond NN/g is from background knowledge, flagged as such.
