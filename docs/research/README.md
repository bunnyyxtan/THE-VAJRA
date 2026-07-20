# Vajra UX Research Index — NN/g Reports

Ten research reports on Nielsen Norman Group (NN/g) UX theory, each compiled from live fetches
of nngroup.com during this project, with non-NN/g supplements and unverifiable claims explicitly
flagged inside each file. All ten are synthesized into `docs/ux-blueprint.md` Section 6
("NN/g Research Synthesis (verified)"), which cross-checks them against the pre-existing
blueprint and consolidates them into the screen-by-screen interaction rulebook. Read the
blueprint section first for decisions; come here for the underlying evidence, exact quotes,
study details, and source URLs.

- **nng-10-heuristics-vajra.md** — Provenance and deep dives on the 10 usability heuristics:
  Molich & Nielsen 1990 origin, the 1994 factor analysis of 249 usability problems, the
  0.1/1/10-second response-time limits, Nah 2004 (~3× wait tolerance with progress feedback),
  slips-vs-mistakes prevention, all 8 confirmation-dialog rules, recognition-over-recall, and
  10 Vajra-specific applications. Includes the list of notable verified quotes/numbers and the
  truncation flag on the error-message article's "Efficiency" section.

- **nng-choice-architecture-cognitive-load.md** — Hick's Law, the corrected reading of Miller's
  7±2 (recognition-based displays are exempt; Cowan's 4±1 is the operative working-memory limit),
  the Iyengar & Lepper jam study with its meta-analytic caveats (Scheibehenne 2010 mean effect
  ≈ zero; Chernev 2015's four moderating conditions — all four apply to first-time crypto
  payers), progressive/staged disclosure (max ~2 levels), wizard-vs-single-page evidence, and
  the danger of defaults. Flags the unverified HubSpot conversion claim.

- **nng-empty-states-onboarding.md** — The three functions of empty states (status, learning
  cue, direct pathway) and why a misleading empty state is worse than none; the 70-participant
  tutorial study (no success benefit, tasks perceived as harder — paradox of the active user);
  pull vs push revelations; priming; the peak-end rule (the verified anchor for Vajra's
  "inbox zero" receipt moment — NN/g has no inbox-zero article); no-results-page guidelines;
  passkey UX figures (83% biometric usage); skeleton-screen thresholds.

- **nng-feedback-success-graceful-degradation.md** — Visibility of system status as the root
  trust principle; response-time limits; progress-indicator tiers and anti-patterns (static
  "Loading…", "don't click again" warnings); skeleton-screen rules; undo vs confirmation;
  status-tracker guidelines (reliable, plain-language, pull + push channels); indicators vs
  validations vs notifications (the 5-minute fading-toast failure); microinteractions and
  peak-end applied to Vajra's finality moment; per-section receipt degradation rules.

- **nng-form-design-vajra.md** — The form-design evidence base applied to Vajra's 4-field
  request form: EAS framework, interaction cost, F-pattern eyetracking (232 users, 2006;
  replicated 2017), placeholder-as-label's 7 failure modes, required/optional marking (the word
  "(optional)" beats the bare asterisk), the 10 inline-validation rules, premature validation as
  hostile pattern, forgiving formats and input masks, sticky defaults, disabled-button guidance
  with the attribution warning that the Penzo label-placement numbers are not NN/g, and mobile
  input checklist items (touch targets ≥1 cm × 1 cm).

- **nng-mobile-touch-ux-research.md** — Touch targets (1 cm × 1 cm minimum, Parhi et al. 2006;
  fingertip/thumb anatomy), the thumb-zone evidence with the critical attribution correction
  (Hoober 2013, UXmatters — not NN/g — and grips change constantly), the 179-participant
  hidden-navigation study (usage halved, discoverability −20%, difficulty +21%), mobile-vs-desktop
  layout strategy, response-time limits, and QR/cross-device handoff findings from NN/g's WeChat
  research. Flags the unverified "59% vs 80% mobile task success" figure.

- **nng-response-time-loading-ux.md** — The canonical response-time file: Miller 1968 / Card et
  al. 1991 origins of the 0.1/1/10 s thresholds, the Doherty-threshold attribution correction
  (IBM 1982, not NN/g; circulating productivity percentages unverified), Myers 1985
  percent-done research, Nah 2004, Lindgaard 50 ms first impressions, the 8-second-invisible-promo
  eyetracking finding, skeleton-screen rules, and a state-by-state mapping of Vajra's payment
  flow (local verify, inspection, wallet confirmation, inclusion, finality) onto the correct
  indicator per tier.

- **nng-trust-security-ux-report.md** — Nielsen's 4 trust factors (1999, re-validated 2016),
  50 ms first impressions (Lindgaard 2006), the NIST security-fatigue study (Stanton et al.
  2016; 40 interviews; mitigations: fewer decisions, secure-by-default, consistency), the
  security-vs-usability position ("sometimes security should win"), passkey coverage, the 13
  QR-code usability rules (including minimum 2 cm × 2 cm size and the QR-payment-fraud warning
  that the design must carry the safety burden), deceptive-pattern research to avoid, and
  up-front-disclosure rules that mandate terms-before-wallet-connect.

- **vajra-nng-data-display-research.md** — How to display technical/financial data: 79%-scan
  vs 16%-read (1997), the +124% concise/scannable/objective usability gain, F-pattern and the
  80/20 left-attention split, numerals-stop-the-eye, STM ~7 chunks / 20 s (the system carries
  obscure codes), tables-vs-cards (activity history is a table task), date display (spell out
  months), tooltip limits, and the "UI too fast" caution for fast chains. Derives Vajra's
  address-truncation, chunked Vajra Code, MON-primary/wei-secondary, and receipt-layout rules —
  with honest notes that hex-display conventions are first-principles derivations, not NN/g
  standards.

- **vajra-nng-error-ux-research.md** — The error-UX file: Heuristics #5 and #9, Norman's
  slips-vs-mistakes taxonomy, blame-the-design (Hawaii missile alert, 38-minute retraction),
  the error-message rubric (≥3 redundant indicators, 7th–8th grade reading level, ~350M
  color-vision-deficient users), the 10 form-error rules (3+ repeats = design problem), hostile
  patterns (premature errors, error-styling inflation), all 8 confirmation-dialog rules,
  Dangerous UX proximity rules for destructive actions, and 10 Vajra rules covering fail-closed
  states, wrong-network prevention, neutral wallet-rejection handling, revert translation, and
  terminal request states.
