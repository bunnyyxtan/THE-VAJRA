# VAJRA Design Direction v1 — "Obsidian Instrument + Porcelain Ledger"

STATUS: APPROVED by owner 2026-07-19. This is the written owner-approved design direction that
opens the frontend design gate (blueprint §13 resume condition). It is the authoritative visual
and interaction spec for the VAJRA frontend. Reference imagery supplied: deep-violet/porcelain
palette family (#1D0F30, #4A306D, #A167A5, #D3BCCC, #E8D7F1, #190019, #2B124C, #522B5B,
#854F6C, #DFB6B2, #FBE4D8) and premium dark fintech product references. The token palette in
Section 3 below is the binding implementation source; reference imagery is directional only.

## Product feel
Precise, calm, premium, responsive, financially trustworthy, technically credible, purpose-built
for VAJRA, satisfying in every interaction, native to each device class.
Never: AI-generated, template-based, cyberpunk, crypto-casino, neon, overanimated, empty-for-
minimalism, decorated without purpose, purple generic SaaS dashboard.

## Three structural grammars
A. INSTRUMENT — active workflows (create request, review terms, sign, pay, confirm). One dominant
   value/decision, calibrated numeric readout, clear state, visible progression, minimal noise,
   immediate feedback, one unmistakable primary action.
B. LEDGER — evidence (activity, terms, receipt details, passkey details, identities, signatures,
   hashes, contract info, timestamps, audit history). Ruled rows, stable label-value alignment,
   tabular numerals, monospace technical identifiers, freshness timestamps, minimal cards.
C. SEAL — verified completion only (settlement completed, signature verified, receipt sealed).
   Restrained verification moment, ONE meaningful seal animation, warm signature accent,
   completed proof chain, formal but scannable.
Order: Instrument first. Ledger underneath. Seal only at verified completion.

## Palette (binding tokens)
Purple has ONE role: primary action/brand. Never simultaneously on background, borders, links,
buttons, navigation, status, icons, inputs, decoration.

DARK: bg #0B0912 · surface #120E19 · raised #17121F · selected #21182B · border #34263F ·
strong border #51405F · text #F8F5FA · secondary #C8C0CC · muted #8C8291 · action #9E83FF ·
action hover #B5A4FF · on-action #130E1C · signature #D8B7A4 · signature surface #2A211F

LIGHT: bg #F8F6F2 · surface #FFFFFF · secondary surface #F0ECF3 · selected #EEE9FF ·
border #DDD6E1 · strong border #BDB3C3 · text #17131B · secondary #5A5260 · muted #756C7A ·
action #6548D9 · action hover #5138B6 · on-action #FFFFFF · signature #A56F57 ·
signature surface #F3E7E0

SEMANTIC (never violet): success green · warning amber · danger red · info blue ·
verification seal warm champagne/blush. Color never the only status signal — always pair with
text/icon/shape/label/accessible name.
Gradients ONLY: onboarding artwork, marketing visuals, subtle selected instrument surfaces,
verified receipt-seal moments. Never on app background, form fields, navigation, badges, tables,
routine screens.

## Typography
Manrope (interface) + IBM Plex Mono (technical identifiers only). Sentence case, tabular numerals
for amounts/timestamps. Scale: page title 28–32 mobile / 32–40 desktop · section 20–24 ·
component 16–18 · body 15–16 · compact 13–14 · metadata 12–13 · amount readout 44–56 mobile /
56–72 desktop. No thin weights, no serif, no all-caps body labels, no giant marketing headlines
inside the app.

## Spacing / shape
Spacing scale ONLY: 4 8 12 16 24 32 48 64. Radius: small controls 6 · inputs/buttons 8 ·
panels/sheets 12–16 · pills only for real compact statuses/filters. No nested cards, no floating
cards, no glassmorphism, no excessive shadows. Hierarchy via alignment, ruled separation, surface
changes, typography, spacing, grid BEFORE cards.

## Motion personality and tokens
Precision financial instrument: controlled, weighted, decisive, calm, mechanically precise.
Never bouncy/playful/cinematic/constantly moving.
Durations: --motion-instant 90ms · --motion-fast 140ms · --motion-standard 200ms ·
--motion-panel 260ms · --motion-route 300ms · --motion-signature 420ms. Max routine 400ms,
max special (verified completion) 500ms.
Easing: enter cubic-bezier(0.22,1,0.36,1) · standard cubic-bezier(0.2,0,0,1) ·
exit cubic-bezier(0.4,0,1,1) · emphasis cubic-bezier(0.16,1,0.3,1). Exits fast. No transition:all.

## Immediate response standard
Every interaction produces visible feedback in the next rendered frame. Sequence: immediate
physical response → clear working state → outcome → persistent record when consequential.
INP target ≤200ms p75. Keyboard focus never waits for animation.
Button press: scale 0.985, 70–100ms, no layout shift. Loading: stable width, compact indicator,
aria-busy, stage text for consequential actions. Copy action: icon morphs to check + "Copied",
140–200ms, restore ~1.5–2s, announce to AT. Inputs: immediate focus ring, label stays, no shake,
preserve values, inline errors. Amount input: primary calibrated readout, immediate cursor,
digits may use 90–140ms opacity/vertical transition, no slot-machine, no count-up-from-zero.

## Proof chain (VAJRA's original motif)
Stages: Terms defined → Recipient signed → Request shared → Payer verified → Transaction
submitted → Contract settled → Receipt sealed.
Current stage: strongest contrast + optional restrained pulse while actively waiting (stops on
completion, disabled under reduced motion). Completed: connector fills, icon completes, 160–220ms.
Future: visible but subdued. Failure: connector stops, stage labeled, recovery action beside it,
explain what did/didn't happen, no red flashing, no rail restart. Desktop: horizontal or vertical
per space. Mobile: compact vertical rail; current stage + next action always visible; never 7
tiny unreadable circles.

## Async stages (never a bare spinner, never "Processing/Please wait" alone)
Request creation: Preparing terms → Awaiting signature → Signing → Request created → Link ready.
Wallet payment: Preparing transaction → Opening wallet → Awaiting wallet approval → Transaction
submitted → Confirming on Monad → Settled → Receipt sealed.
Passkey: Checking wallet → Checking registered credential → Awaiting device confirmation →
Registering credential → Registration confirmed.
Timing: <100ms pressed feedback only · 100–500ms preserve content · >500ms inline progress or
meaningful skeleton · >2s descriptive stage naming whose clock we're waiting on. Long chain ops:
user may leave, state persists across refresh/background, deep-link back, NEVER success on wallet
submission alone; distinguish submitted/confirmed/settled/failed/reverted.

## Optimistic UI
Only local filters, appearance, noncritical preferences. NEVER for wallet signatures, onchain
payments, settlement, passkey registration, revocation, destructive security actions.

## Feedback hierarchy
Ambient (network, freshness, wallet) → Inline (field errors, signature state, copy, validation,
tx stage, disabled explanation) → Toast (low-risk only; never the only copy of critical info) →
Banner (one compact persistent: environment limits, stale data, network mismatch) → Dialog
(irreversible only: revocation, loss, consequential cancel, network switch interruption).

## Skeletons
Match final geometry. Use for activity ledger, receipt details, request records. Never blank-
spinner over existing content during refresh; keep stale content labeled; no infinite shimmer;
no shimmer under reduced motion; no layout shift; stable row heights.

## Reduced motion
@media (prefers-reduced-motion: reduce): remove translation/scale/parallax/pulse/shimmer/
animated gradients; shared-element → crossfade; routes → short opacity; progress via text +
static indicators; functionality preserved. Tested manually.

## Accessibility
WCAG 2.2 AA: visible focus, logical order, focus restore after sheets/dialogs, full keyboard,
no traps, accessible names, correct roles, sparing aria-live, aria-busy on loading regions,
field-associated errors, color never sole signal, 200% zoom readable, increased-contrast
compatible, light + dark both accessible.

## Performance
CSS transitions for simple states; transform/opacity only; no large motion dependency for
hover/press/opacity/route transitions; no transition:all; no width/height/top/left animation in
frequent interactions; no global will-change; no per-frame React state; no animating hundreds of
rows; no blocking input; no delaying navigation.

## Responsive
Test widths: 320 375 390 768 1024 1280 1440 1920. Mobile ≠ compressed desktop.
Phone: current state, amount, primary action, proof progress, critical terms; single-column,
bottom sheets, large targets, compact ledger rows. Tablet: list-detail, supporting panes.
Desktop: persistent nav, two-column instrument layouts, dense ledger tables, evidence inspectors,
keyboard shortcuts. Reference screens must be built at 390/768/1024/1440 in light AND dark.

## Screen grammar
HOME: no autoplay hero; readiness status calm; Create Request primary; recent activity without
stagger; no blobs/particles/animated gradients/count-up balances.
CREATE REQUEST: amount input immediate focus; proof chain stages; review preserves values
spatially; ledger rows as one composed block; explicit signing state; share options revealed in
one short transition; QR appears cleanly.
PAYMENT PAGE: signed terms visible before wallet connect; signature verification inline; wallet
sheet controlled; strong press/pending states; wallet approval ≠ network confirmation; no money
flying, no confetti.
ACTIVITY: new rows insert with short highlight fading in 800–1200ms; no row pulsing; stable sort/
filter; live status via icon+label+timestamp.
RECEIPT: one premium completion sequence ≤500ms after authoritative confirmation: settlement
appears → proof chain completes → seal resolves (short stroke/scale/emboss) → ledger available →
share/download appear. No confetti, no repeated rotation, no glitter, no delayed data access.
PASSKEY/SECURITY: restrained inline progress, native system UI for device approval, revocation =
warning + explicit confirmation, no fake biometric animations, no celebrating security changes.
THEME SWITCH: immediate control response, crossfade 140–220ms, no white/dark flash.

## Haptics / sound
Web: none. Sound: none by default.

## Identity test
VAJRA must be recognizable with logo, name, and accent color removed — through instrument
hierarchy, ledger evidence, proof-chain progression, verification seal, signing language,
settlement states, receipt anatomy, motion personality.

## Workflow gates (binding)
Phase 0: VAJRA_FRONTEND_AUDIT.md. Phase 1: tokens + Motion/Interaction Lab (dev-only).
Phase 2: Home + Create Request + Receipt at 390/768/1024/1440, light+dark, then STOP for owner
visual approval with screenshots. Phase 3: propagate after approval. Phase 4: production QA.
