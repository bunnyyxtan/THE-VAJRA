<subagent agent_id="agent-1" item="Research NN/g work on response-time limits and loading UX: the classic 0.1s/1s/10s thresholds (Miller 1968, Card/Newell, Nielsen's Response Times article), progress indicators vs spinners vs skeleton screens, perceived performance, the Doherty threshold, and staged/progressive disclosure of progress. Apply to a payment flow with states: local verification (&lt;1s), onchain inspection (1-5s), wallet confirmation (5-30s), block inclusion (~1-2s), finality tracking (seconds to minutes)." outcome="completed"># NN/g Response-Time & Loading UX Research — Vajra Assignment Report

## 1. CORE THEORY

### 1.1 The 0.1s / 1s / 10s Thresholds

The foundational framework comes from **Jakob Nielsen's *Usability Engineering* (1993), Chapter 5**, which he states was itself based on human-factors research ~30 years old at the time, citing:

- **Miller, R. B. (1968).** "Response time in man-computer conversational transactions." *Proc. AFIPS Fall Joint Computer Conference*, Vol. 33, 267–277. This is the original source of the response-time thresholds (from terminal/mainframe interaction studies).
- **Card, S. K., Robertson, G. G., & Mackinlay, J. D. (1991).** "The information visualizer: An information workspace." *Proc. ACM CHI'91*, 181–188.

Nielsen's three limits, verbatim:

- **0.1 second** — "the limit for having the user feel that the system is reacting instantaneously, meaning that no special feedback is necessary except to display the result." This is the limit for the feeling of *direct manipulation* (the user did it, not the computer).
- **1.0 second** — "the limit for the user's flow of thought to stay uninterrupted, even though the user will notice the delay. Normally, no special feedback is necessary during delays of more than 0.1 but less than 1.0 second, but the user does lose the feeling of operating directly on the data." Required for the feeling of *free navigation*.
- **10 seconds** — "the limit for keeping the user's attention focused on the dialogue. For longer delays, users will want to perform other tasks while waiting for the computer to finish, so they should be given feedback indicating when the computer expects to be done."

Nielsen also notes the inverse hazard: computers can respond *too fast* for users to keep up with feedback — animations must be timed by a real-time clock, not machine speed. (Source: [Response Times: The 3 Important Limits](https://www.nngroup.com/articles/response-times-3-important-limits/))

**Study-detail caveat:** NN/g's article does not report sample sizes or effect sizes for Miller (1968) or Card et al. (1991). These were syntheses of human-factors work, not single controlled experiments, so treat the thresholds as robust rules of thumb, not point estimates from one study.

### 1.2 The Doherty Threshold (400 ms) — NOT an NN/g finding

This is frequently misattributed. The Doherty threshold is **not from NN/g**. It comes from:

- **Doherty, W. J., & Thadani, A. J. (1982).** "The Economic Value of Rapid Response Time." *IBM Systems Journal*.

The paper challenged the then-standard 2-second acceptable response time, arguing productivity gains continue as response time drops toward **400 ms** — the point where "neither [human nor computer] has to wait on the other," and interaction becomes continuous ("addicting," in the paper's framing). The exact quote widely circulated: "productivity increases in more than direct proportion to a decrease in response time."

**Verification status:** The 400 ms figure, the 1982 date, the IBM Systems Journal venue, and the authorship are consistently corroborated across multiple independent secondary sources ([Laws of UX](https://lawsofux.com/doherty-threshold/), [PCMag Encyclopedia](https://www.pcmag.com/encyclopedia/term/doherty-threshold), Yablonski's *Laws of UX* book PDF). However, I could not access the original paper in this research pass, so **sample size, experimental design, and effect sizes are unverified** — some secondary sources cite "10–15% higher productivity" or "25–30% more transactions per hour," but these numbers trace only to low-authority aggregator sites and should **not** be cited in the Vajra document without pulling the original paper.

### 1.3 Progress Indicators & Perceived Performance

- **Myers, B. A. (1985).** "The importance of percent-done progress indicators for computer-human interfaces." *Proc. ACM CHI'85*, 11–17. Cited by Nielsen as the basis for the rule that percent-done indicators should be used for operations > ~10 seconds.
- **Nah, F. (2004).** "A study on tolerable waiting time: how long are web users willing to wait?" *Behaviour and Information Technology*, 23(3). Cited by NN/g's progress-indicators article: in a University of Nebraska–Lincoln study, participants shown a continuous animated progress bar "experienced higher satisfaction and were willing to wait on average **3 times longer** than those who did not see any progress indicators."
- **Lindgaard et al. (50 ms study)** — cited in NN/g's "Powers of 10" article: people form rough judgments of a web page's visual appeal after **50 ms** of exposure. Relevant to first paint of the payment page. (Source: [Powers of 10: Time Scales in User Experience](https://www.nngroup.com/articles/powers-of-10-time-scales-in-ux/))
- **Mejtoft, Långström, & Söderström (2018).** "The effect of skeleton screens." *Proc. 36th European Conference on Cognitive Ergonomics*. DOI: 10.1145/3232078.3232086. The one academic reference in NN/g's skeleton-screens article.
- **NN/g eyetracking finding:** in an NN/g study, a promo slideshow that took **8 seconds** to load got only **1%** of one user's viewing time (vs. **20%** for a user who effectively saw it render instantly) — a slow-loading 23%-of-page element was functionally invisible. (Source: [Website Response Times](https://www.nngroup.com/articles/website-response-times/))
- Nielsen's conversion claim: "When sites shave as little as **0.1 seconds** off response time, the outcome is a juicy lift in conversion rates." (Same article; anecdotal across client studies, no sample sizes given.)

---

## 2. NN/g'S SPECIFIC GUIDELINES

From [Progress Indicators Make a Slow System Less Insufferable](https://www.nngroup.com/articles/progress-indicators/), [Skeleton Screens 101](https://www.nngroup.com/articles/skeleton-screens/), and the two response-time articles above:

**Immediate feedback (all delays):**
1. Give *some* visual feedback the instant the user acts (button pressed-state, page begins refresh). Without it, users assume the action didn't register and act again — the cause of "extra clicks and double orders."
2. Wait time is measured from the moment of user initiation, not from when the server starts working.

**Choosing the indicator by duration:**
3. **< 1 s: no indicator at all.** A flashing spinner or skeleton for a sub-second load is "distracting… users cannot keep up with what happened and might feel anxious about whatever flashed on the screen" (display-inertia principle).
4. **~2–10 s: looped animation (spinner)**, ideally with explanatory text ("Loading comments…"). Never a bare spinner for server-dependent operations without considering worst-case latency (your 2 s call can become 15 s on bad connectivity).
5. **≥ 10 s: percent-done indicator (or explicit step indicator), plus a clearly signposted way to interrupt/cancel.** Users will context-switch; design for reorientation on return. Delays >10 s are "only acceptable during natural breaks in the user's work."
6. Percent-done is also acceptable for sub-10 s operations *if* processing a known series of records ("Updating address 3 of 50").
7. **High-variance operations → lower the cutoff** for switching from spinner to percent-done: "The bigger the variability in your estimates, the lower the threshold for showing the more elaborate feedback."

**Progress-bar behavior:**
8. **Start slow, finish fast.** A bar that races then hangs at 99% destroys the benefit — users calibrate expectations to observed speed. Exceeding expectations beats disappointing them. (Note: for *surveys*, NN/g reports the opposite — fast-start/slow-end reduces drop-off. Don't mix these up.)
9. **Give general time estimates, never fake-exact ones** ("About 3 minutes remaining" / "This might take at least a minute"); exact estimates that prove wrong damage credibility. Always pad the estimate.
10. **Step counts are a valid substitute** when duration is unknowable ("Step 2 of 4") — users can at least bound the wait.

**Anti-patterns (explicit don'ts):**
11. **Never static indicators.** An unmoving "Loading…" is indistinguishable from a hang.
12. **Never "don't click again" warnings.** Threatening users ("clicking again may create an extra order") is both hostile and ineffective — "the way to avoid extra clicks is to show the user that the first click has been accepted and is being worked on." This maps directly to double-payment prevention.
13. **Never frame-display skeleton screens** (header/footer + empty background). With no content wireframe, users assume the page is broken.

**Skeleton screens specifically:**
14. Use only for **full-page loads** of **< 10 s**. For processes (uploads, conversions, transactions), a skeleton is confusing — use a progress bar or wizard.
15. Spinners suit a *single module* loading within an already-rendered page; skeletons suit the *whole screen*.
16. Animated ("shimmer") skeletons are acceptable but can be distracting / an accessibility hazard — keep motion subtle.

**Psychological framing (the 4 functions of progress feedback):**
17. Progress indicators (a) reassure the system hasn't crashed, (b) give something to look at, (c) give a reason to wait, and (d) reduce perceived wait by absorbing cognitive resources.

---

## 3. APPLICATION TO VAJRA

Mapping Vajra's states onto the thresholds (durations from your spec):

| Vajra state | Duration | NN/g class | Correct pattern |
|---|---|---|---|
| Local verification (signature/payload check) | < 1 s | Instantaneous/flow | No indicator; instant result |
| Onchain inspection | 1–5 s | Flow → impatience | Skeleton (page load) or labeled spinner |
| Wallet confirmation | 5–30 s | **Crosses 10 s attention limit** | Step/percent indicator + copy + cancel |
| Block inclusion | ~1–2 s | Tolerable wait | Labeled looped animation |
| Finality tracking | seconds–minutes | **> 10 s, high variance** | Staged progress + permission to leave |

**Rule 1 — Sub-second local verification gets zero chrome.** When Vajra verifies the request signature and payload locally (< 1 s), render the verified terms immediately with no spinner or skeleton. Per NN/g, flashing feedback on a sub-second operation causes anxiety, not reassurance. (0.1 s/1 s limits; display inertia.)

**Rule 2 — Sender payment page loads as a skeleton, not a spinner.** Onchain inspection (1–5 s) is a full-page load under 10 s → content-wireframe skeleton: gray blocks where amount, memo, expiry, and recipient go. Do *not* use a frame-only skeleton, and do *not* skeleton the transaction lifecycle states (those are processes, not page loads — NN/g says skeletons there are "confusing").

**Rule 3 — Label every looped indicator with *what* is happening and *whose* clock it is.** "Verifying request on Monad…", "Broadcasting transaction…", "Waiting for approval in your wallet…" NN/g explicitly recommends text explanations with looped animations. Crucially, the wallet-confirmation wait is waiting on the *user*, not the system — copy must say so, or users read the stall as Vajra being broken.

**Rule 4 — Wallet confirmation (5–30 s) must never be a bare spinner.** It crosses the 10-second attention limit. Use a step indicator ("Step 3 of 4 — Approve in wallet") so users can bound the wait, and always offer a visible cancel/back path ("clearly signposted way to interrupt"). If the wallet session hangs > ~60 s, fail closed with a distinct timeout state and recovery instructions — an indefinite spinner reads as a crash (NN/g's 15-minute-stuck-user anecdote).

**Rule 5 — Finality tracking is a percent-done/staged problem, and users must be allowed to leave.** Finality is seconds-to-minutes with high variance → NN/g's most elaborate feedback tier. Use staged progressive disclosure: "Broadcast ✓ → Included in block ✓ → Finalized (waiting)". Apply the slow-start/fast-finish animation rule so the bar never visibly stalls near 100%. And because >10 s waits are only acceptable at natural task breaks, make leaving *safe and explicit*: "Payment is already onchain — this page is permanent, you can close it and check the receipt later." Design the return experience for reorientation (persistent state on reload).

**Rule 6 — Prevent double-submission by state, never by warning.** NN/g: don't write "clicking again may create an extra payment" copy; users won't read it. On first tap of **Pay**, the button immediately (< 100 ms, Doherty-grade) enters a disabled "Processing…" state. This is also your fail-closed guarantee: idempotent request design plus UI lockout, not user education.

**Rule 7 — No fake success, ever — and no optimistic money UI.** Perceived-performance tricks (optimistic rendering) are legitimate only for content that is *already cryptographically settled*: the signed request terms can render instantly because they're locally verifiable from the signed payload. The payment outcome can *never* be optimistic. "Payment sent" must appear only after block inclusion; "Final" only after chain finality. NN/g's principle that misleading progress "negates the benefits of showing progress" applies a fortiori to misleading success. Use a three-state vocabulary — **Submitted / Included / Final** — never a premature checkmark.

**Rule 8 — Passkey ceremonies: fast, honest, unglamorous.** Passkey registration is a 1–5 s platform ceremony: give immediate pressed-state feedback on tap, a labeled spinner during the OS prompt handoff, and an instant result. Copy constraint: never "verify your identity" — the passkey proves *this device's key signed this request*, nothing more. Recommended phrasing: "Sign requests with this device's key." This is both a security-accuracy requirement and NN/g's credibility rule (don't claim what the system can't back).

**Rule 9 — Conservative, padded estimates for chain-dependent timing.** NN/g: general estimates, always padded ("Finality usually takes ~2–5 seconds on Monad" — only once you have real network data; until then say "typically under a minute"). If finality exceeds your stated estimate, escalate the UI tier (add reassurance text + explorer link) rather than letting the estimate be wrong silently.

**Rule 10 — History/activity and receipt pages: skeletons for lists, instant static receipts.** The activity page list load (< 10 s) gets a list-shaped skeleton, not a spinner (single-module vs. full-page rule). The permanent receipt page should hit the 1-second free-navigation bar — it is static, onchain-verifiable content and is Vajra's trust artifact; per NN/g's eyetracking finding, every second of render delay measurably shrinks the attention its proof content receives.

*(Bonus engineering target: hold all interactive feedback — button states, hover, input echo — under the 400 ms Doherty threshold, and ideally under 100 ms. Frame it as IBM 1982, not NN/g.)*

---

## 4. NOTABLE QUOTES & NUMBERS (citable)

1. **"0.1 second is about the limit for having the user feel that the system is reacting instantaneously… 10 seconds is about the limit for keeping the user's attention focused on the dialogue."** — Nielsen, *Usability Engineering* (1993) via [Response Times: The 3 Important Limits](https://www.nngroup.com/articles/response-times-3-important-limits/)

2. **"People who saw the moving feedback bar experienced higher satisfaction and were willing to wait on average 3 times longer than those who did not see any progress indicators."** — NN/g citing Nah (2004), *Behaviour and Information Technology* 23(3), University of Nebraska–Lincoln. [Progress Indicators article](https://www.nngroup.com/articles/progress-indicators/)

3. **"When sites shave as little as 0.1 seconds off response time, the outcome is a juicy lift in conversion rates."** — [Website Response Times](https://www.nngroup.com/articles/website-response-times/) (Nielsen, client-study observation; no sample size disclosed)

4. **8-second promo = invisible:** user who endured an 8 s widget load spent **1%** of viewing time in a promo occupying 23% of the page, vs. **20%** for a user who saw it rendered. NN/g eyetracking. [Same article](https://www.nngroup.com/articles/website-response-times/)

5. **50 ms:** exposure time after which users form a stable judgment of a page's visual appeal (Lindgaard team). [Powers of 10: Time Scales in UX](https://www.nngroup.com/articles/powers-of-10-time-scales-in-ux/)

6. **"The way to avoid extra clicks is to show the user that the first click has been accepted and is being worked on."** — [Progress Indicators](https://www.nngroup.com/articles/progress-indicators/). Directly quotable in Vajra's double-payment design rationale.

7. **"A 10-second delay will often make users leave a site immediately."** and repeated short delays "can easily lose half your sales." — [Website Response Times](https://www.nngroup.com/articles/website-response-times/)

8. **Doherty threshold (400 ms):** "productivity increases in more than direct proportion to a decrease in response time" — Doherty & Thadani (1982), *IBM Systems Journal*, quoted via [Laws of UX](https://lawsofux.com/doherty-threshold/). The prior industry standard was 2 seconds. **Unverified:** original sample sizes/effect sizes; the "10–15%" and "25–30%" productivity figures circulating online trace only to aggregator sites — do not cite without the primary paper.

9. **Skeleton screens academic anchor:** Mejtoft, Långström, & Söderström (2018), "The effect of skeleton screens," ECCE 2018, DOI: 10.1145/3232078.3232086 — cited in [NN/g Skeleton Screens 101](https://www.nngroup.com/articles/skeleton-screens/).

---

**Summary for the parent agent:** The assignment is complete. All four sections delivered above, grounded in five primary NN/g pages fetched in full (response-times limits, progress indicators, skeleton screens, website response times, time scales). The key factual corrections to enforce in the Vajra document: (a) the Doherty threshold is IBM 1982, not NN/g; (b) Nielsen's thresholds cite Miller 1968 and Card et al. 1991, with no reported sample sizes; (c) the "wait 3× longer" figure is Nah 2004 as relayed by NN/g; (d) circulating Doherty productivity percentages are unverified and should be excluded or footnoted as such.</subagent>
