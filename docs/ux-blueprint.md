# Vajra UX Blueprint — Interaction & State Architecture (Pre-Design-Gate)

**Status:** UX architecture only. This is NOT Design.md. No colors, typography, layout composition,
motion language, or visual metaphor is chosen here. The §10 frontend design gate remains intact.
Everything below is functional-state and interaction design, which the blueprint (§10, §13) explicitly
permits and requires before visual work.

**Sources of direction:** Owner-supplied UX video series (Parts 1–14) + the underlying theory
(Nielsen, Norman, Hick, Jakob, Fitts, Miller, Doherty) + Vajra PRD/TRD/Security Blueprint v1.0
(§8 functional requirements, §9 state machines, §23 error standard, §29 honest limitations).

---

## 1. Theory foundation — the laws we're applying and why

### 1.1 The four-state rule (Nielsen: visibility of system status)
Every screen has **four states: loading, success, error, empty**. AI-generated apps build only the
happy path. Vajra's blueprint already forbids this ("No fake success"), but we go further: every
route in §18 gets an explicit four-state spec (Section 3 below) before a single component is built.

**Mapping to Vajra:** the payment state machine (§9) already has 15 states. The four-state rule is
the user-facing projection of that machine — we never let a state exist onchain/in-code that has no
honest screen representation.

### 1.2 Error theory (Norman's Gulf of Evaluation + Part 5)
A good error message answers: **what happened, why, what to do next**. Vajra §23 extends this for
payments with a mandatory fourth question: **did funds move?** That fourth question is the difference
between a good app and a trustworthy payment product.

Rules adopted:
- **Never dump backend/RPC/Solidity errors on screen** (also a security requirement — §23 "Raw errors").
- **Never say "Something went wrong."** Every error names the failure in user language.
- **Never silent-fail.** Every action has feedback; every button click produces a visible state change.
- Errors are **classified to stable app error codes** (§23) and mapped to copy — not stringified exceptions.

### 1.3 Error placement hierarchy (Part 7)
| Channel | Use for | Vajra usage |
|---|---|---|
| **Inline** (default) | Anything tied to a field or a just-clicked control | Amount validation, memo length, expiry, wrong-payer notice, pay-button failure ("Payment didn't settle — retry safely" next to the button) |
| **Modal** (sparingly) | User cannot continue without addressing it | Transaction reverted after broadcast (must resolve: inspect state / view on explorer), wrong network blocking payment |
| **Toast** (trivial only) | Recoverable, low-stakes, auto-dismissable | "Copied link", "Couldn't reach RPC — retrying" (paired with a persistent inline state; never the ONLY signal for anything touching money) |

Rule: **the closer the error to the cause, the better.** Eyes are already at the clicked button.

### 1.4 Loading psychology (Parts 2–4 + Doherty threshold)
The Doherty threshold (~400ms) says sub-second feedback feels instant; the video's tiers become
Vajra's explicit loading policy:

| Duration | Pattern | Vajra example |
|---|---|---|
| < 1 s | **No loader at all** — show the result | Local payload decode + local signature verify |
| 1–5 s | Spinner **with static text** | "Checking request onchain…" (inspect call) |
| 5–10 s | **Changing status text** (real, not fake) | "Confirm in your wallet" → "Payment submitted" → "Confirming on Monad…" |
| > 10 s | **Step indicator / progress**, never a bare spinner | The receipt tracker: Broadcast → Included → Final as discrete steps with the tx hash visible |

**Hard rules:**
- Never flash a loader for sub-second work (feels broken, not fast).
- After ~10 s a looped spinner *increases* frustration — Vajra's payment tracker is a stepper, never a spinner.
- Fail fast: show the error the moment we know; never spin 20 s then apologize.
- **Optimistic UI is forbidden for settlement.** Liking a photo can be optimistic; paying MON cannot.
  §28/FR-028: success requires receipt + event + state. Optimism is allowed ONLY for zero-stakes
  actions (e.g., copying a link, local contact nickname).

### 1.5 Forms (Part 6 + Miller's 7±2 + forgiving input)
Request creation is Vajra's only real form. Rules:
1. **Submit stays disabled until valid — and always says why.** A grayed button with no explanation
   is worse than no validation. ("Add an amount" / "Expiry must be in the future".)
2. **Inline validation on blur/change**, not on submit. No scroll-up-to-fix moments.
3. **Character/byte counter on memo** — the 96-byte limit (FR-005) is shown live as "bytes left",
   because UTF-8 byte count ≠ visible characters and surprising the user here violates the rule.
4. **Prefill everything knowable:** connected wallet → recipient; chain time → issuedAt; sensible
   default expiry (e.g., 24 h) with one-tap presets instead of raw datetime entry where possible.
5. **Forgiving amount parsing:** "0.01", "0,01" (locale), ".01", "0.01 MON" all parse to the same wei
   via checked bigint conversion — never float (FR-002). Format is normalized for the user; precision
   is never lost.
6. **No multi-page wizard for creation** — it's 4 fields (Hick's Law says keep it one screen); but the
   *passkey ceremony* is broken into discrete steps (explain → create → confirm) because it's novel.

### 1.6 Hick's Law — one decision per screen
- `/pay` has exactly **one primary action** at any moment: Connect → Switch network → Pay. The state
  machine guarantees only one is ever presented. No competing CTAs on a money screen.
- `/request` presents amount/expiry/memo/payer as one compact group, not a 24-jar shelf.
- Secondary actions (revoke, copy, view on explorer) are visually demoted, never co-equal with Pay.

### 1.7 Jakob's Law — borrow every convention users already have
Users arrive with habits from wallets, block explorers, and payment apps:
- **Wallet connect top-right** (every dApp convention).
- **Address display:** familiar `0x1234…abcd` truncation PLUS full address one tap away — the
  blueprint (§20) forbids truncation as the *only* representation; convention + security both satisfied.
- **Explorer links** where users expect them (tx hash, contract, addresses).
- **QR code** for in-person sharing — the universal payment-request convention.
- We innovate ONLY where Vajra is genuinely new (passkey ceremony, finality seal) — and there we
  over-explain, because there is no borrowed convention.

### 1.8 Platform & context conventions (Part 13)
- **Mobile-first thumb zones for the pay flow.** Requests will be opened from chat apps on phones.
  The primary Pay action lives in the bottom third, reachable one-handed — not top-right desktop habits.
- Desktop layout follows dApp conventions; mobile layout follows thumb conventions. Same logic,
  different geometry (this is interaction placement, not visual design).
- **Full address comparison must work on a phone** — expandable, copy-safe, side-by-side with the
  Vajra Code for out-of-band confirmation (§17).
- i18n note: memo field accepts any Unicode (NFC-normalized, FR-005); no RTL mirroring commitments
  pre-design-gate, but layout must not hard-code left-right assumptions into logic.

### 1.9 Graceful degradation (Parts 9–10 + §19 RPC threats)
**Every section owns its own data, loading, and error.** Vajra's concrete plan:
- `/pay` payload decode is **local and instant** — terms are readable even if RPC is down.
  Onchain inspection degrades independently: "Terms verified locally. Onchain status temporarily
  unavailable — retry" with a retry button on that section only. **Pay button stays disabled** while
  inspection is unavailable (fail closed — money screens never degrade to permissive).
- Receipt page verifies receipt, event, and state as **independent checks** (§14). If one source lags,
  show "2 of 3 checks confirmed — verification pending", never a whole-page error, never a false seal.
- Activity page: local history renders instantly; indexer/event reads load and fail per-section.
- **Fail-closed for money, fail-open for information.** That's the Vajra degradation doctrine.

### 1.10 Empty states (Part 8)
- **No requests yet (recipient):** "Create your first request" + one-line explanation + CTA. Not blank.
- **No activity:** explains what activity will show (payments you made or received via this browser),
  and that it's local-only (§24 privacy).
- **Empty search/filter results:** suggest the correction path ("No payments match — check the request
  link or create a new request").
- **Terminal-good empty:** a cleared/paid request list isn't celebrated — payments are sober — but the
  **sealed receipt** IS Vajra's "inbox zero" moment: the one place success deserves ceremony (post-gate).

### 1.11 Success states (Part 11 + §14 receipt states)
Calibrated feedback, proportional to stakes:
- **Micro-confirmations:** copy link → inline "Copied". State change visible, no modal.
- **Medium:** request created → full terms review screen (this doubles as the verification step, FR-007).
- **The big one:** payment final → the **Vajra Seal**. Three-stage honesty (Broadcast → Included → Final)
  means the user is never asked to trust a spinner with their money. The seal is earned by observed chain
  state (FR-029), so the celebration is also the proof. This is the product's emotional peak — and per
  the peak-end rule, it's the moment users will remember and judge.

### 1.12 Trust & the security posture (final video + §29)
The 380k-vibe-coded-apps warning is Vajra's raison d'être. UX consequences:
- Never claim "verified identity" — always "registered-device authentication" (FR-013).
- Never market "unhackable" — "minimized attack surface, independently verifiable" (§29).
- Every trust claim in UI copy must point at something the user can check (event, state, explorer).
- Uncertainty is shown honestly ("verification delayed") — a payment app that hides doubt loses
  more trust than one that displays it.

---

## 2. The money-action feedback ladder (Vajra-specific synthesis)

Every irreversible or money-adjacent action follows this ladder, combining §23 with the video rules:

1. **Before:** primary action disabled until all preconditions verifiably pass (simulation, inspection),
   with the blocker stated in plain language next to the button.
2. **At click:** immediate inline state change (no silent 200ms of nothing) — "Confirm in your wallet".
3. **Wallet rejection:** "No transaction was sent. Nothing moved. You can retry safely." — inline, by the button.
4. **Broadcast:** hash captured and persisted instantly (FR-027), shown as a step, not a spinner.
5. **Outcome:** success = seal (receipt+event+state); failure = modal with what/why/funds-status/next action
   + explorer link + safe-retry guidance.
6. **Ambiguity:** RPC down post-broadcast → "Payment submitted — we can't confirm the result yet. Your
   transaction hash is safe. Verify or retry." Never infer either way (§23).

---

## 3. Screen-by-screen four-state spec (functional, pre-design)

### `/` — Landing
- Loading: none (static content).
- Empty: n/a.
- Error: none (no data dependencies).
- Success: n/a. One primary action each for the two personas (Create request / Open a request) — Hick.

### `/request` — Create
- Loading: chain-time read gets a spinner+text only if >1 s.
- Empty: first-use → guided one-liner above the form.
- Error: inline per field; byte counter on memo; submit disabled with reason.
- Success: terms-review screen with link, QR, full address, Vajra Code, expiry (FR-008: no gas, no tx —
  say so; "no transaction needed" is a delightful detail worth stating).

### `/pay#payload` — Verify & pay  ← highest-stakes screen
- Loading: decode instant; inspect = spinner+text; simulation = changing status text.
- Empty: invalid payload → dedicated terminal state ("This request link is invalid or tampered" — with
  what/why/action, never a crash).
- Error: inline + the §9 terminal states (Expired / Revoked / Already paid / Wrong payer / Invalid auth)
  each get specific copy answering what/why/funds/next. Pay action removed (FR-023).
- Success: the three-step seal tracker → sealed receipt.

### `/receipt/[requestId]`
- Loading: independent per-check (receipt / event / state) with per-section pending indicators.
- Empty: unknown requestId → "No settlement found for this request" + how to verify independently.
- Error: per-section retry; RPC outage → partial receipt with honest pending labels.
- Success: full permanent receipt, all fields (FR-031), reproducible from public data (§24).

### `/activity`
- Loading: local history instant; chain reads per-section.
- Empty: first-run explainer + local-only privacy note.
- Error: per-section retry; never blocks the rest of the page.
- Success: n/a (informational screen).

### `/settings/passkey`
- Loading: registry read = spinner+text.
- Empty: no passkey → explanation of authority boundary ("can authorize requests, cannot spend")
  BEFORE the ceremony (Journey A, §7) — this is informed consent, not marketing.
- Error: WebAuthn failures mapped to human copy ("Your device declined or doesn't support passkeys —
  use wallet signature instead" + FR-034 fallback path).
- Success: ceremony completion with version number and what rotation invalidates (honest, specific).

---

## 4. UX acceptance tests (added to Definition of Done, §28)

These are checkable without any visual design:

- [ ] Every route demonstrates loading / error / empty / success in tests or fixtures.
- [ ] No error message contains a raw RPC/Solidity/stack string.
- [ ] Every error states: what happened, why, funds status, next action.
- [ ] No silent failure: every click produces visible feedback within 400 ms.
- [ ] No spinner for <1 s operations; no bare spinner beyond 10 s (payment tracker is a stepper).
- [ ] Pay action is disabled with a stated reason until simulation passes.
- [ ] Memo counter shows bytes remaining live.
- [ ] Amount input accepts "0.01" / ".01" / "0,01" and never uses float math.
- [ ] RPC outage during payment leaves hash persisted and shows "verification pending", never success or failure.
- [ ] Receipt page degrades per-check, never whole-page.
- [ ] Passkey setup states the authority boundary before credential creation.
- [ ] Primary action reachable one-handed on a 360px-wide viewport.
- [ ] No optimistic UI on any fund-moving action.

### 4.1 NN/g-derived additions

Cross-checked against the 10 live-fetched NN/g research reports (see Section 6). All testable
without visual design:

- [ ] Create-request button is either enabled-with-click-validation or disabled-with-reason:
      on click of an invalid form, per-field inline errors appear next to each field plus a
      summary (never summary-only); if the disabled pattern is used, a visible reason string
      and `aria-disabled="true"` are present.
- [ ] No validation error fires while the user is typing a still-valid prefix, and none on
      focus-in/focus-out of an untouched field; validation fires on blur/change only —
      except the payer-address checksum and the memo byte counter, which are live.
- [ ] Required fields are individually marked; the optional payer field carries the literal
      word "(optional)" plus its consequence line ("anyone with the link can pay").
- [ ] Wallet rejection (EIP-1193 4001) renders a neutral, non-alarming message stating the
      user canceled, that nothing moved, and preserves all inputs; it is not styled as an error.
- [ ] Every error uses ≥3 redundant indicators (text + icon + container treatment) and never
      relies on color alone; error copy reads at ~7th–8th grade level.
- [ ] No error or payment-status information is ever delivered by an auto-dismissing toast.
- [ ] The pay confirmation button label carries the outcome ("Pay 12.5 MON"), has no default
      keyboard focus, and the confirmation restates amount, recipient, expiry, and memo.
- [ ] No confirmation dialogs on routine actions (connect wallet, create request, view receipt,
      copy link) — confirmations are reserved for the irreversible payment step only.
- [ ] All touch targets ≥ 1 cm × 1 cm physical rendered size; the Pay CTA ≥ 1.5 cm tall;
      ≥ 0.4 cm separation between Pay and any adjacent interactive element.
- [ ] The sender payment page is fully usable with navigation never opened: terms, safety
      cues, and the single primary action are all on the landing view.
- [ ] Full-page loads < 10 s use a layout-mirroring skeleton (never a frame-only skeleton);
      processes (signing, broadcast, finality) use a labeled stepper, never a skeleton.
- [ ] Loading copy states whose clock is running ("Waiting for your wallet…" vs
      "Confirming on Monad…"), so a user-side wait is never read as a system stall.
- [ ] The finality wait offers an explicit safe-leave path ("this receipt updates on its own")
      and the receipt link persists/resumes state across reloads.
- [ ] Amounts render as numerals, MON-primary; wei and request IDs live only behind the
      technical-details disclosure; every truncated hash/address has a one-tap copy and a
      tap-to-expand full form; no task-vital datum exists only in a tooltip.
- [ ] The Vajra Code renders in chunks of 3–4 characters, max 4 groups, ambiguous glyphs
      (0/O, 1/I/l) excluded from the alphabet.
- [ ] Empty states never render while their data is still loading; each empty state carries
      status + learning cue + a direct task pathway (e.g., "Create your first request" button).
- [ ] No front-loaded tutorial, deck-of-cards, or coach-mark tour anywhere; help is contextual
      (pull revelations at first encounter / teachable moments after errors).
- [ ] Every QR ships with an adjacent label stating what it does plus the short URL in text;
      expired request links render a dedicated explanatory page with a next action, never a 404.
- [ ] Destructive actions (revoke request, remove passkey) are spatially separated from benign
      actions and differently signaled; passkey removal requires a nonstandard confirmation
      (type-to-confirm) stating the exact consequence.
- [ ] Double-submission is prevented by button state (instant disable + loading) keyed to
      onchain request status — including in a second tab — never by "don't click twice" text.
- [ ] On RPC outage, receipt and activity pages keep rendering last-verified data with an
      explicit verification timestamp and pending labels; previously verified content is never
      blanked, downgraded, or silently removed.
- [ ] The sender page discloses full terms (amount, recipient, memo, expiry, irreversibility)
      before any wallet-connect prompt.

---

## 5. What this document is NOT

- Not a visual design system. No palette, type, spacing scale, or component styling.
- Not a replacement for the §13 design conversation — those 12 questions remain mandatory and unanswered.
- Not a change to any functional or security requirement; where UX and security tension exists
  (optimism vs. verification, convenience vs. fail-closed), **security wins, and the UX job is to make
  the secure path feel good** — the seal ceremony instead of a spinner, honest pending states instead of
  false confidence.

---

## 6. NN/g Research Synthesis (verified)

Ten research reports, each compiled from live fetches of nngroup.com during this project, are
indexed in `research/README.md`. This section distills what they verified, reconciles them with
Sections 1–5 above, and consolidates the result into a screen-by-screen rulebook. Where a report
flagged a claim as unverified or non-NN/g, it is either dropped or explicitly labeled here.
Nothing in this section makes visual-design decisions: geometry (target sizes, zones, placement)
is interaction architecture per §1.8; color, type, and style choices remain gated.

### 6.1 Verified findings by domain

**A. The heuristics themselves.** Nielsen developed the 10 heuristics with Rolf Molich in 1990
(Molich & Nielsen 1990, *Communications of the ACM* 33(3)); the 1994 revision derived from a
factor analysis of **249 usability problems**; the set is unchanged since 1994 (article text
updated 2020). Two heuristics govern our error work: #5 (prevention beats recovery) and #9
(plain-language, precise, constructive messages). Source:
https://www.nngroup.com/articles/ten-usability-heuristics/

**B. Response-time limits.** Nielsen's 1993 thresholds (citing Miller 1968; Card et al. 1991;
Myers 1985): **0.1 s** = feels instantaneous, show only the result; **1.0 s** = flow of thought
uninterrupted, no special feedback needed; **10 s** = limit of attention, beyond which users need
feedback with expected completion time and a way to interrupt. No sample sizes exist for these —
they are syntheses of human-factors work, robust rules of thumb. Progress-indicator guidance
(2014): immediate feedback on every action (its absence causes "extra clicks and double orders");
<1 s nothing; ~2–10 s looped animation with text; ≥10 s percent-done/step indicator; **never
static "Loading…"** (indistinguishable from a hang); **never "don't click again" warnings** —
show the first click was accepted. Nah (2004, U. Nebraska-Lincoln, *Behaviour & Information
Technology* 23(3)): users shown an animated progress indicator waited **~3× longer** with higher
satisfaction. Sources: https://www.nngroup.com/articles/response-times-3-important-limits/ ,
https://www.nngroup.com/articles/progress-indicators/

**C. Skeleton screens.** For full-page loads < 10 s only; must mirror the real layout; **never
frame-display skeletons** (header + blank body reads as "broken"); single modules get spinners,
full pages get skeletons; **processes** (uploads, transactions) get progress bars/steppers, never
skeletons. Academic anchor: Mejtoft, Långström & Söderström 2018 (ECCE, DOI
10.1145/3232078.3232086). Source: https://www.nngroup.com/articles/skeleton-screens/

**D. The Doherty threshold is not NN/g.** The ~400 ms "productivity threshold" is Doherty &
Thadani (1982), *IBM Systems Journal* — frequently misattributed to NN/g. Its circulating
effect-size numbers ("10–15% productivity") trace only to low-authority aggregators and are
**unverified — do not cite**. We keep 400 ms as an internal engineering target for interactive
feedback, attributed correctly to IBM 1982.

**E. Choice architecture & cognitive load.** Jam study (Iyengar & Lepper 2000, JPSP): 24-jam
display drew 60% of passersby but 3% bought; 6-jam drew 40% but **30% bought** (~10× conversion
gap). **Critical nuance**: Scheibehenne et al. (2010, JCR) meta-analysis found the mean
choice-overload effect ≈ zero; Chernev et al. (2015, 99 studies) found overload emerges under 4
conditions — quick choice wanted, complex product, hard comparison, unclear preferences — **all
four describe a first-time crypto payer**, which is why minimal-choice money screens are right
for Vajra specifically, not as a universal law. NN/g's correction to Miller: **7±2 governs
recall, not screen options** — menus rely on recognition; don't cap options at 7. Working-memory
capacity for novel items is ~**4±1 chunks** (Cowan 2001). Progressive disclosure (Nielsen 2006):
improves learnability, efficiency, and error rate; **max ~2 disclosure levels**; everything
frequent up front. NN/g's soda-machine test: customization bloated time-on-task **>500%**.
Sources: https://www.nngroup.com/articles/chunking/ ,
https://www.nngroup.com/articles/progressive-disclosure/ ,
https://www.nngroup.com/articles/simplicity-vs-choice/

**F. Empty states & onboarding.** Empty states must do three things: status + learning cue +
direct task pathway; a **misleading status is worse than none** ("No records" while loading is
the named anti-pattern). Tutorial study (NN/g 2020, 70 participants, 4 iOS apps): reading the
tutorial gave **no** success benefit (91% vs 94%, p=0.443) and made tasks feel **harder** (SEQ
4.92 vs 5.49, p=0.047) — front-loaded tutorials fail via the "paradox of the active user"; use
contextual pull revelations instead. No-results pages: make "no results" unmistakable in the main
body (eyetracking showed users miss de-emphasized messages), restate the query, offer a path
forward, never mock the user. Peak-end rule (Kahneman & Fredrickson et al. 1993 cold-pressor:
**80% chose to repeat the longer trial** because it ended better) — the sealed receipt is Vajra's
engineered peak *and* end; negative peaks (errors, outages) are remembered most vividly, so error
endings must be designed. Sources:
https://www.nngroup.com/articles/empty-state-interface-design/ ,
https://www.nngroup.com/articles/mobile-tutorials/ ,
https://www.nngroup.com/articles/search-no-results-serp/ ,
https://www.nngroup.com/articles/peak-end-rule/

**G. Forms.** Users don't want to fill forms: "every question is a withdrawal" from a trust
account (EAS framework: Eliminate, Automate, Simplify). Never use placeholder-as-label (7
documented failure modes; eyetracking shows **eyes are drawn to empty fields**, so filled fields
get skipped). Labels above fields on mobile; single column. Mark required fields individually —
top-of-form "all required" banners don't work; mark optional fields with the word "(optional)"
(the red asterisk alone underperformed **even among UX professionals**). Validation: inline on
blur; **premature validation is "a hostile pattern… unwarranted scolding"**; live validation only
for error-prone inputs; success indicators only for complex fields; errors next to the field;
summary never the only indication; no tooltips for errors; **3+ repeats of the same error = a
design problem**, not user incompetence. Disabled buttons "confuse users by appearing clickable
but providing no response" — use sparingly, `aria-disabled`, always explain why. Users **rarely
change defaults** — the default expiry *is* the product decision. Forgiving formatting: accept
any separator/locale, auto-format, never float. Sources:
https://www.nngroup.com/articles/4-principles-reduce-cognitive-load/ ,
https://www.nngroup.com/articles/eas-framework-simplify-forms/ ,
https://www.nngroup.com/articles/form-design-placeholders/ ,
https://www.nngroup.com/articles/web-form-design/ ,
https://www.nngroup.com/articles/errors-forms-design-guidelines/ ,
https://www.nngroup.com/videos/why-disabled-buttons-hurt-ux-and-how-to-fix-them/
(Attribution flag: the "top-aligned labels are fastest" eyetracking numbers are **Penzo 2006,
UXmatters — not NN/g**; cited here only as consistent background.)

**H. Mobile & touch.** Minimum touch target **1 cm × 1 cm physical** (Parhi, Karlson & Bederson
2006, MobileHCI; MIT Touch Lab 2003: fingertip 1.6–2 cm, thumb impact 2.5 cm); primary CTAs and
in-motion controls larger (NN/g's example ≈ 2 cm × 2 cm); spacing matters as much as size —
crowded targets cause errors (Instagram dismiss/Follow anti-pattern). **Thumb-zone attribution
correction**: the 49% one-handed / 36% cradled / 15% two-handed figures are **Steven Hoober,
UXmatters 2013 (1,333 street observations) — not NN/g**, and Hoober himself warns users change
grips "sometimes every few seconds" — so: bottom-anchored primary action yes, but never design
one-handed-*only*, and never treat hard-to-reach as a safety mechanism. NN/g hamburger study (179
participants, 6 live sites): hidden navigation used ~half as much (mobile 57% vs 86% combo),
content discoverability dropped **>20%**, task difficulty **+21%** — the cold-open sender page
must work with navigation never opened. QR codes have **no information scent** — always label
them; QR is for cross-device handoff, direct links for same-device. Sources:
https://www.nngroup.com/articles/touch-target-size/ ,
https://www.uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php ,
https://www.nngroup.com/articles/hamburger-menus/ ,
https://www.nngroup.com/articles/wechat-qr-shake/

**I. Errors.** Slips vs mistakes (Norman): slips prevented by constraints/suggestions/defaults/
forgiving formatting; mistakes by mental-model alignment, conventions, previews. "The designer
is at fault for making it too easy for the user to commit the error." Hawaii false missile alert
(Jan 13, 2018; **38-minute retraction**): "a poorly designed system is to blame" —
differentiate consequential options, provide undo paths. Error-message rubric (2023): ≥3
redundant indicators; never color alone (**~350M people worldwide** have color-vision
deficiency); 7th–8th grade reading level; no codes/jargon in primary copy; constructive fix;
preserve user input. Never show errors prematurely. **Never deliver errors via fading toast** —
an NN/g participant waited 5 minutes because a 5-second error toast went unnoticed. Match channel
to severity: banners/toasts for "good to know," modals only for blocking. Destructive actions
must be spatially and visually separated from benign ones (ThinkorSwim's Delete next to Confirm
& Send is the exact finance-domain anti-pattern); deliberately leverage Fitts' Law to make the
dangerous option harder to hit. Sources:
https://www.nngroup.com/articles/slips/ ,
https://www.nngroup.com/articles/error-prevention/ ,
https://www.nngroup.com/articles/error-message-guidelines/ ,
https://www.nngroup.com/articles/error-messages-scoring-rubric/ ,
https://www.nngroup.com/articles/hostile-error-messages/ ,
https://www.nngroup.com/articles/indicators-validations-notifications/ ,
https://www.nngroup.com/articles/proximity-consequential-options/

**J. Confirmation dialogs.** All 8 NN/g rules, verified: (1) only for serious consequences —
explicitly including "costing large amounts of money" — especially irreversible ones; (2) never
for routine actions ("The Computer That Cried Confirm" — overuse *increases* errors); (3)
specific, restating the request — never "Are you sure?"; (4) outcome-labeled buttons, never
Yes/No; (5) progressive disclosure for detail; (6) no default Yes, ideally no default; (7)
nonstandard action (type-to-confirm, MailChimp) for the most dangerous operations; (8)
"don't ask again" only for low-stakes educational cases. The "confirm payments ≥2× the user's
normal range" idea is NN/g's **illustrative example, not a researched threshold**. The wallet /
passkey signing prompt already is a nonstandard confirmation — **do not stack extra dialogs on
top of it**. Source: https://www.nngroup.com/articles/confirmation-dialog/

**K. Trust & security UX.** Nielsen's 4 trust factors (1999), re-validated 2016 ("same…
regardless of location and culture"): design quality, up-front disclosure, comprehensive/current
content, connection to the rest of the web. Asking for anything before providing value "is a
breach of trust" — full terms before wallet connect. Links to external sources generate trust —
the explorer link is a trust feature. NIST security-fatigue study (Stanton et al. 2016; 40
interviews, fatigue in 25/40): mitigations = **limit security decisions, make the secure path the
easiest path, keep decisions consistent**. Nielsen 2009: "sometimes security should win" — NN/g
endorses friction for money movement. First impressions form in **50 ms** (Lindgaard et al.
2006). NN/g QR guidance (2024, 13 rules): label + adjacent URL, min **2 cm × 2 cm** + 1 cm per
10 cm scan distance, deep-link never homepage, expired destinations redirect to explanatory
pages; **payment QRs are actively manipulated by scammers and "few users… will actively consider
these risks" — the design carries the safety burden**. Passkeys (NN/g 2023): "a password that is
invisible to the user"; 83% use biometrics at least occasionally (CI 73–87% as printed);
cross-device friction solved via QR. Sources:
https://www.nngroup.com/articles/trustworthy-design/ ,
https://www.nngroup.com/articles/visibility-system-status/ ,
https://www.nngroup.com/articles/stop-password-masking/ ,
https://www.nngroup.com/articles/qr-code-guidelines/ ,
https://www.nngroup.com/articles/passwordless-accounts/ ,
https://www.nist.gov/news-events/news/2016/10/security-fatigue-can-cause-computer-users-feel-hopeless-and-act-recklessly

**L. Data display & readability.** 79% of users scan, 16% read word-by-word (1997); concise +
scannable + objective writing = **+124% measured usability** (+58% / +47% / +27% individually).
F-pattern (232 users, 2006; replicated 2017 incl. mobile & RTL mirror): first lines and first
words get the fixations; ~80% of viewing time lands on the left half. Numerals stop the eye —
write amounts as digits, thousands-separated; humans can't parse 18-digit integers (wei is never
primary display). STM holds ~7 chunks fading in ~20 s — the system carries obscure codes, never
the user; human-compared codes get chunked 3–4 char groups. Tables beat cards for comparison
(card grids force "spatial reorientation"); activity/history is a table use case. Spell out
months ("3 Nov 2026", not 11/03/26). Never put task-vital info in tooltips. "UI too fast"
(2013): transient states get missed — relevant to very fast chains like Monad. Sources:
https://www.nngroup.com/articles/how-users-read-on-the-web/ ,
https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content-discovered/ ,
https://www.nngroup.com/articles/horizontal-attention-leans-left/ ,
https://www.nngroup.com/articles/web-writing-show-numbers-as-numerals/ ,
https://www.nngroup.com/articles/short-term-memory-and-web-usability/ ,
https://www.nngroup.com/articles/data-tables/ ,
https://www.nngroup.com/articles/date-input/ ,
https://www.nngroup.com/articles/tooltip-guidelines/ ,
https://www.nngroup.com/articles/ui-too-fast/

### 6.2 Cross-check against Sections 1–5

**CONFIRMED (research endorses the existing rule as written):**
- §1.1 four-state rule — Heuristic #1 verbatim; "a lack of information often equates to a lack
  of control."
- §1.2 never-dump-backend-errors, never-"something went wrong" — Heuristic #9; "An error
  occurred" is NN/g's named useless-message example.
- §1.3 error placement hierarchy — matches NN/g's severity-graded channels (inline default,
  modal for blocking only, toast trivial) with one sharpening below.
- §1.4 loading ladder's core shape (<1 s nothing; stepper not spinner beyond ~10 s; fail fast;
  no optimistic settlement) — matches 0.1/1/10 s limits and the skeleton/progress rules.
- §1.5 forgiving amount parsing, live byte counter, prefill — matches forgiving-formatting,
  warn-before-error (Twitter-counter pattern), and reuse-existing-data guidelines.
- §1.6 one primary action per money screen — Hick's Law + Chernev 2015's four overload
  conditions all applying to first-time crypto payers.
- §1.7 Jakob's Law conventions (wallet top-right, truncation+copy, explorer links, QR) —
  confirmed, and NN/g adds that truncation must never be the *only* representation.
- §1.9 fail-closed-for-money / fail-open-for-information, per-section degradation — confirmed by
  the status-tracker research ("an inaccurate tracker is worse than none") and the
  misleading-status finding.
- §1.11 the seal as engineered peak-end — the peak-end rule is the verified anchor (the
  blueprint's "inbox zero" framing is ours, **not an NN/g term** — flagged by the research).
- §2 money-action feedback ladder — matches accepted-click feedback, staged status, and
  ambiguity rules.

**REFINED (research changes the authoritative rule):**

1. **Disabled submit button (§1.5 rule 1) — refined.** NN/g: disabled buttons "confuse users by
   appearing clickable but providing no response." New authoritative rule: on the *creation
   form*, prefer the **enabled-button pattern** — click surfaces per-field inline errors plus a
   summary (never summary-only), because the click is not irreversible and validation teaches
   what's missing. The disabled pattern remains acceptable only with a visible reason string and
   `aria-disabled="true"`. Disabling *is* the correct pattern for double-submit prevention
   during signing and for the Pay button under fail-closed conditions (wrong network, failed
   inspection) — there the reason must be stated inline next to the button.

2. **Loading ladder tiers (§1.4) — refined.** NN/g's ladder: <1 s nothing; ~1–2 s subtle busy
   state; 2–10 s looped animation **with explanatory text**; ≥10 s percent-done/step indicator
   **plus an interrupt path**. The blueprint's "1–5 s spinner / 5–10 s changing text" collapses
   into this. Two additions: (a) **full-page loads under 10 s use a layout-mirroring skeleton,
   not a spinner** (spinners are for single modules); (b) **high-variance operations lower the
   cutoff** — chain-dependent waits (finality, wallet confirmation) escalate to the step
   indicator early. Loading copy must name **whose clock is running**: "Waiting for your
   wallet…" (user-side) vs "Confirming on Monad…" (system-side) — otherwise a user-side wait
   reads as a crash.

3. **Validation timing (§1.5 rule 2) — sharpened.** "On blur/change" now carries NN/g's
   hostile-pattern clause: never validate while typing a still-valid prefix, never on
   focus-in/focus-out of an untouched field. Live/real-time validation is reserved for
   error-prone inputs only (payer checksum, memo byte counter). Success indicators only for
   complex fields (checksum valid), never for trivial filled-checks. Same error 3+ times in one
   attempt = redesign the field, don't blame the user.

4. **Thumb-zone rule (§1.8) — corrected attribution, added nuance.** The 49/36/15 grip figures
   are Hoober (UXmatters 2013), not NN/g, and grips change "every few seconds." Authoritative
   rule: Pay CTA bottom-anchored, ≥1.5 cm tall, near-full width; **≥0.4 cm separation from any
   adjacent interactive element**; all targets ≥1 cm × 1 cm physical; but never rely on
   "hard-to-reach = safe" for destructive actions (guard by confirmation + re-auth instead), and
   never design a one-handed-*only* layout.

5. **Toast usage (§1.3) — narrowed.** NN/g's observed 5-minute-toast failure makes the rule
   absolute: **no error and no payment-status information may ever be delivered solely by a
   transient toast.** Toasts survive only for zero-stakes confirmations ("Copied link").

6. **Doherty threshold (§1.4) — re-attributed.** IBM 1982, not NN/g; unverified productivity
   percentages dropped. Kept as an engineering target for interactive feedback only.

7. **Miller's 7±2 (§1.5) — corrected.** NN/g explicitly warns against capping options at 7
   (recognition-based displays are exempt). The operative limit is Cowan's ~4±1 working-memory
   chunks: cap what a user must *hold in mind* (≈3–4 chunks), not what a screen may show. Terms
   stay visible at every step (the interrupted-by-a-phone-call test).

8. **Empty vs. loading (§1.10, §3) — new hard rule.** A misleading empty state is worse than
   none: never render "no requests / no results" while data is still loading. Absent data is not
   zero data — this is also the fail-closed doctrine applied to lists.

9. **Pay confirmation (§2 step 1–2) — formalized.** The verify-terms screen *is* the
   confirmation dialog and follows all 8 NN/g rules: specifics restated, "Pay {amount} MON"
   button, no default focus, irreversibility stated factually. And the wallet/passkey prompt is
   already the nonstandard confirmation action — **no third "really sure?" dialog may be
   stacked** on top (cry-wolf). No confirmations anywhere else in the flow.

10. **Passkey ceremony (§1.5 rule 6, §3) — refined by the tutorial evidence.** No front-loaded
    explainer carousel; land on a single "Create your signing key" step with one short priming
    sentence (what it is, what it does, what it is not, ~seconds duration). The tutorial study
    shows front-loading makes the task *feel* harder — the wrong priming for a security
    ceremony. OS prompt used verbatim, never re-skinned.

11. **QR handling (§1.7) — expanded.** Label + short URL adjacent (no information scent), min
    2 cm × 2 cm, deep-link only, same-device sharing prefers tappable links, expired links
    render a dedicated explanatory page with next action, and the payment page is the
    anti-phishing surface (everything derived from the signed payload, decoded on-device).

12. **Data display (new to Sections 1–5).** Amounts as numerals, MON-primary (wei in technical
    details); F-order front-loading of terms (amount → recipient → memo → expiry); activity as
    table-style rows (comparison task), status/amount leftmost; dates with spelled-out months +
    UTC; Vajra Code chunked 3–4 chars, ambiguous glyphs excluded; nothing task-vital in
    tooltips; "UI too fast" caution — don't flash success states the user can't perceive.

### 6.3 The Vajra interaction rulebook (consolidated, by screen)

**Request creation form (`/request`)**
1. Four fields, single column, visible label above each field, zero placeholders-as-labels.
2. Amount, expiry, memo individually marked required; payer marked "(optional)" with the
   consequence line "leave blank and anyone with the link can pay."
3. Amount: forgiving decimal parsing ("0.01" / ".01" / "0,01" / " 0.5 "), bigint only, `MON`
   suffix outside the editable text, fiat equivalent shown as computed display, validate on blur
   only.
4. Expiry: prefilled default (24 h — the default *is* the product decision because users rarely
   change defaults), preset chips (1 h / 24 h / 7 d), typed entry accepts any separator, past
   times disabled rather than errored, absolute time shown human-readable ("Expires Tue 14:00
   UTC").
5. Memo: live byte counter ("43 / 96 bytes") counting UTF-8 bytes not characters; hard stop at
   limit; the public-permanence hint lives outside the field, always visible; PII-pattern memo
   triggers the one sanctioned form modal.
6. Payer: paste-first, autocorrect/autocapitalize off, live checksum validation (error-prone
   input exception), green check on valid checksum; an invalid optional address **blocks link
   creation** — never silently drop the restriction.
7. Submit uses the enabled-with-click-validation pattern (per refinement 6.2.1); on failure,
   all inputs preserved, per-field errors + summary. During signing: loading state, double-submit
   blocked.
8. Success = full terms-review screen (link, QR + label + short URL, full address, Vajra Code,
   expiry) with the delightful fact stated: no gas, no transaction needed.

**Pay page (`/pay#payload`)**
9. Cold-open design: everything (amount, recipient, memo, expiry, safety cues, single primary
    action) works with navigation never opened; mobile-first geometry, desktop-adapted.
10. Terms disclosed in F-order — amount (numerals, MON-primary) → recipient (head…tail +
    identicon + one-tap copy + tap-to-expand full) → memo in full → expiry (spelled month,
    absolute + relative) — before any wallet-connect prompt; "Connect wallet" never precedes
    value.
11. Local payload decode renders instantly with zero chrome (<1 s rule); onchain inspection is a
    layout-mirroring skeleton (full-page, <10 s) degrading per-section; terms remain readable
    even if RPC is down.
12. Terminal request states (expired / revoked / already paid / wrong payer / tampered) resolve
    **before** any commitment step into dedicated screens with what/why/funds/next — already-paid
    renders the receipt, not an error. Pay action absent in terminal states.
13. Exactly one primary action at a time (Connect → Switch network → Pay); wrong-network is a
    disabled-Pay warning state (not red-error styling) with a one-click "Switch to Monad" fix.
14. The verify step is the NN/g confirmation: restated specifics, "Pay {amount} MON" button, no
    default focus, factual irreversibility line, chain details behind "Technical details" (max 2
    disclosure levels). No stacked dialogs beyond the wallet prompt.
15. On Pay tap: pressed-state within 0.1 s; button immediately enters disabled loading state —
    accepted-click feedback, never "don't click twice" text; wallet wait labeled as user-side;
    rejection = neutral non-error message, inputs preserved, nothing moved.
16. Post-broadcast: staged tracker (Broadcast → Included → Final) with elapsed time and padded
    honest estimates; hash persisted instantly; >10 s gets an explicit safe-leave path ("this
    receipt updates on its own"); RPC ambiguity = "verification pending", never inferred success
    or failure. "Paid" styling only after finality is observed. No skeleton, no bare spinner, no
    premature checkmark ("UI too fast" caution on fast chains).

**Passkey ceremony (`/settings/passkey`)**
17. No front-loaded tutorial. One screen: authority boundary stated before creation ("signs your
    payment requests; cannot spend; does not identify you"), one priming sentence (device key,
    biometric unlock, ~seconds), one action.
18. OS passkey prompt used verbatim — never re-skinned into an unfamiliar ceremony; immediate
    pressed-state feedback, labeled spinner during OS handoff, instant result.
19. Failure = fail closed with plain-language reason + retry + the wallet-signature fallback;
    extra help after repeated failures (3+ = design problem).
20. Copy discipline everywhere: "registered-device authentication," never "verified identity,"
    "KYC," or identity-shield metaphors; success states the version number and what rotation
    invalidates.
21. Settings = hub pattern, max 2 disclosure levels; "Remove passkey" spatially separated,
    redundantly signaled, type-to-confirm with the exact consequence stated; multi-device via
    QR-code add.

**Receipt page (`/receipt/[requestId]`)**
22. Three independent check panels (receipt / event / state), each with its own loading, error,
    and retry; verdict computed only from succeeded checks; "2 of 3 checks confirmed" never a
    whole-page error, never a partial seal.
23. Full-fidelity canonical record: complete addresses, full tx hash, block number, exact wei +
    MON, spelled-month UTC timestamps, one copy button per row; explorer links throughout
    (external verification is a trust feature).
24. Stale-state honesty: last-verified data renders with verification timestamp on RPC outage;
    verified content never blanked or downgraded; unknown requestId = dedicated empty state with
    independent-verification guidance.
25. The Final transition is the designed peak-end: brief one-shot celebration over the
    utilitarian receipt, then calm — no upsells, no dead ends. Self-explanatory to a cold
    visitor; renders fast (an 8 s load made NN/g's test content functionally invisible — 1% vs
    20% viewing time).

**Activity page (`/activity`)**
26. Table-style rows (comparison is the task): status + amount leftmost, counterparty, spelled
    dates; rows ≥1 cm tall with clear separation; sticky headers on long lists; 1–2 inline
    actions max, destructive ones behind overflow.
27. Local history renders instantly; chain reads load and fail per-section with retry; "last
    updated" labels on cached rows.
28. Empty state = status + cue + pathway ("Create your first request"); never rendered while
    loading; local-only privacy note. Search no-results = unmistakable main-body message, query
    preserved editable, concrete recovery paths, no whimsy.

**Landing (`/`)**
29. One primary action per persona (Create request / Open a request), nothing else competing;
    no onboarding deck, no feature tour — contextual help only where it becomes actionable.
30. First impression forms in ~50 ms and trust factors are disclosure + polish + external
    connection: state plainly what Vajra does, what it never does (custody, identity), and link
    to independently checkable artifacts (contract, explorer).

### 6.4 Contradictions, tensions, and unverified items

- **Jam study vs meta-analyses**: the 10× jam-conversion figure is real but the 2010
  meta-analysis mean effect is ≈zero; Vajra's justification rests on Chernev 2015's four
  moderating conditions all applying to novice crypto payers — cite it that way, not as
  universal law.
- **Progress-bar pacing**: accelerate-toward-end for processes (Harrison 2007), but NN/g reports
  the *opposite* (fast-start) reduces drop-off for surveys. Vajra has only processes → slow
  start, fast finish, never hang at 99%.
- **Default expiry**: two reports used different example defaults (24 h vs 7 d) — the blueprint
  keeps 24 h; the research contributes the principle (defaults are sticky, choose deliberately),
  not the number.
- **Unverified — excluded or flagged**: Doherty effect-size percentages; the "59% mobile vs 80%
  desktop task success" figure (not confirmable on nngroup.com); the HubSpot "+50% conversion"
  claim (low-authority); Penzo label-placement numbers (real but not NN/g); Hoober thumb-zone
  figures (real but not NN/g); the "≥2× usual amount" confirmation threshold (NN/g's illustrative
  example, requires user research); confirmation-dialogs article's original publication year;
  NN/g has no crypto-specific research, no "inbox zero" article, and no passkey-ceremony
  microcopy guidance — those applications are ours, built on verified first principles.
