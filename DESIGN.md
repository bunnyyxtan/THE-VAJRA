# VAJRA — Design System (DESIGN.md)

Status: FORMAL. Derived from and subordinate to `docs/design-direction-v1.md`
("Obsidian Instrument + Porcelain Ledger", owner-approved 2026-07-19).
Where this file and the direction doc disagree, the direction doc wins and this file is fixed.

This document is the implementation contract for the VAJRA frontend. Tokens here are the only
legal values. If a value you need is not here, it does not exist yet — extend this file, never
invent one in a component.

---

## 1. Design identity

VAJRA is a **precision financial instrument that keeps its own ledger and seals its own receipts.**

Three words govern every decision: **precise, calm, proven.** Precision shows in calibrated
numeric readouts and exact alignment. Calm shows in restraint — one primary action, ruled
separation, no decorative noise. Proof shows in the ledger and the proof chain: every claim on
screen can be traced to a signature, a timestamp, or a transaction hash.

VAJRA must never read as: AI-generated, template SaaS, crypto-casino, cyberpunk, neon,
marketing site inside an app, empty-for-minimalism, or a purple generic dashboard.

---

## 2. Token naming convention

All tokens are CSS custom properties prefixed `--vajra-`. Appearance is switched with
`data-appearance="dark" | "light"` on the root element. Components reference semantic tokens
only — never raw hex, never appearance-specific tokens.

```
--vajra-bg              --vajra-surface          --vajra-surface-raised
--vajra-surface-secondary (light only; dark uses raised)
--vajra-surface-selected
--vajra-border          --vajra-border-strong
--vajra-text            --vajra-text-secondary   --vajra-text-muted
--vajra-action          --vajra-action-hover     --vajra-on-action
--vajra-signature       --vajra-signature-surface
--vajra-success         --vajra-warning          --vajra-danger          --vajra-info
--vajra-<semantic>-surface   (low-emphasis tint surface for that semantic, both appearances)
```

Dark is the primary appearance (the "Obsidian Instrument"). Light (the "Porcelain Ledger") is
a full first-class appearance with its own token values — never an inversion filter.

---

## 3. Color tokens (binding)

### 3.1 Dark appearance

| Token | Hex | Role |
|---|---|---|
| `--vajra-bg` | `#0B0912` | App background |
| `--vajra-surface` | `#120E19` | Base surface (panels, sheets) |
| `--vajra-surface-raised` | `#17121F` | Raised surface (popovers, active zones) |
| `--vajra-surface-selected` | `#21182B` | Selected rows/options; the only place a subtle violet-tinted gradient may whisper |
| `--vajra-border` | `#34263F` | Ruled lines, separators, default borders |
| `--vajra-border-strong` | `#51405F` | Emphasized borders, focus-adjacent chrome |
| `--vajra-text` | `#F8F5FA` | Primary text |
| `--vajra-text-secondary` | `#C8C0CC` | Secondary text, labels |
| `--vajra-text-muted` | `#8C8291` | Metadata, timestamps, disabled |
| `--vajra-action` | `#9E83FF` | Primary action / brand violet — text-on-dark usage too |
| `--vajra-action-hover` | `#B5A4FF` | Primary action hover |
| `--vajra-on-action` | `#130E1C` | Text/icons placed on `--vajra-action` |
| `--vajra-signature` | `#D8B7A4` | Warm signature accent (Seal grammar, signature states) |
| `--vajra-signature-surface` | `#2A211F` | Warm tint surface behind signature/seal content |

### 3.2 Light appearance

| Token | Hex | Role |
|---|---|---|
| `--vajra-bg` | `#F8F6F2` | App background (porcelain) |
| `--vajra-surface` | `#FFFFFF` | Base surface |
| `--vajra-surface-secondary` | `#F0ECF3` | Secondary surface (dark uses `raised` instead) |
| `--vajra-surface-selected` | `#EEE9FF` | Selected rows/options |
| `--vajra-border` | `#DDD6E1` | Ruled lines, separators |
| `--vajra-border-strong` | `#BDB3C3` | Emphasized borders |
| `--vajra-text` | `#17131B` | Primary text |
| `--vajra-text-secondary` | `#5A5260` | Secondary text, labels |
| `--vajra-text-muted` | `#756C7A` | Metadata, timestamps, disabled |
| `--vajra-action` | `#6548D9` | Primary action / brand violet |
| `--vajra-action-hover` | `#5138B6` | Primary action hover |
| `--vajra-on-action` | `#FFFFFF` | Text/icons placed on `--vajra-action` |
| `--vajra-signature` | `#A56F57` | Warm signature accent |
| `--vajra-signature-surface` | `#F3E7E0` | Warm tint surface |

### 3.3 Semantic tokens (never violet)

Chosen for ≥ 4.5:1 contrast as text against the appearance background, and ≥ 3:1 for icons and
indicators. Surface tints are the semantic color at fixed alpha over the base surface — used for
status rows and inline states, never for large fills.

| Token | Dark | Light | Role |
|---|---|---|---|
| `--vajra-success` | `#57D99A` | `#1A7F4B` | Settled, verified, valid signature |
| `--vajra-warning` | `#E8B34B` | `#8A5B0B` | Expiring soon, stale data, attention |
| `--vajra-danger` | `#F26D6D` | `#C03430` | Failed, revoked, reverted, destructive |
| `--vajra-info` | `#6BA8F5` | `#1E5FD0` | Informational, submitted/pending chain state |
| `--vajra-success-surface` | `#57D99A` @ 10% | `#1A7F4B` @ 8% | Success tint |
| `--vajra-warning-surface` | `#E8B34B` @ 10% | `#8A5B0B` @ 8% | Warning tint |
| `--vajra-danger-surface` | `#F26D6D` @ 10% | `#C03430` @ 8% | Danger tint |
| `--vajra-info-surface` | `#6BA8F5` @ 10% | `#1E5FD0` @ 8% | Info tint |

The verification seal accent is warm champagne/blush — that is `--vajra-signature`, not a sixth
semantic color.

### 3.4 Color laws

1. **Violet has ONE role: primary action / brand.** It never appears simultaneously on
   backgrounds, borders, links, secondary buttons, navigation, status, icons, inputs, or
   decoration. One violet element per view region.
2. **Semantic colors are strict:** green = success, amber = warning, red = danger, blue = info.
   No other hues, no violet as status.
3. **Color is never the only status signal.** Every status pairs color with text, icon, shape,
   or an accessible name.
4. **Gradients only at:** onboarding artwork, marketing visuals, subtle selected instrument
   surfaces, verified receipt-seal moments. Never on app background, forms, navigation, badges,
   tables, or routine screens.
5. Focus ring: `--vajra-action` at 2px outer ring with 2px offset; remains visible in both
   appearances and on every surface.

---

## 4. Typography

### 4.1 Families

| Role | Family | Fallback |
|---|---|---|
| Interface | **Manrope** (400/500/600/700) | system-ui sans stack |
| Technical identifiers | **IBM Plex Mono** (400/500) | ui-monospace stack |

Mono is reserved for: addresses, hashes, request IDs, signatures, chain IDs, amounts in ledger
contexts, code. Never for prose, labels, or headings.

### 4.2 Rules

- Sentence case everywhere. No all-caps body labels (small-caps-style eyebrow metadata allowed
  only at 12–13px with letter-spacing ≤ 0.04em, in `--vajra-text-muted`).
- Tabular numerals (`font-variant-numeric: tabular-nums`) for ALL amounts, timestamps, counters.
- No thin weights (<400), no serifs, no giant marketing headlines inside the app.
- Line length for prose: ≤ 68ch.

### 4.3 Scale

| Step | Mobile | Desktop (≥1024) | Weight | Line-height | Use |
|---|---|---|---|---|---|
| `amount-hero` | 44–56px | 56–72px | 600 | 1.05 | Calibrated amount readout (Instrument) |
| `page-title` | 28–32px | 32–40px | 700 | 1.15 | Page title |
| `section` | 20–24px | 20–24px | 600 | 1.25 | Section heading |
| `component` | 16–18px | 16–18px | 600 | 1.35 | Component title, primary row label |
| `body` | 15–16px | 15–16px | 400 | 1.55 | Body text |
| `compact` | 13–14px | 13–14px | 400/500 | 1.45 | Ledger rows, dense lists |
| `metadata` | 12–13px | 12–13px | 400 | 1.4 | Timestamps, captions, mono identifiers |

Amount readout is Manrope 600 with tabular numerals; the currency suffix (MON) is 0.5em of the
amount size in `--vajra-text-secondary`.

---

## 5. Spacing, radius, shape

### 5.1 Spacing scale (the only legal values)

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64` px — exposed as `--vajra-space-1` … `--vajra-space-8`.

| Token | Value | Typical use |
|---|---|---|
| `--vajra-space-1` | 4 | Icon gaps, inline adjustments |
| `--vajra-space-2` | 8 | Compact row padding, label-value gaps |
| `--vajra-space-3` | 12 | Input padding, chip padding |
| `--vajra-space-4` | 16 | Default component padding, field gaps |
| `--vajra-space-5` | 24 | Section padding, sheet padding |
| `--vajra-space-6` | 32 | Between major blocks |
| `--vajra-space-7` | 48 | Between page sections |
| `--vajra-space-8` | 64 | Page-level vertical rhythm |

### 5.2 Radius

| Token | Value | Use |
|---|---|---|
| `--vajra-radius-sm` | 6px | Small controls, tags |
| `--vajra-radius-md` | 8px | Inputs, buttons |
| `--vajra-radius-lg` | 12px | Panels |
| `--vajra-radius-xl` | 16px | Sheets, dialogs |
| `--vajra-radius-pill` | 999px | ONLY real compact statuses/filters |

### 5.3 Shape laws

- No nested cards. No floating cards over cards. No glassmorphism. No excessive shadows
  (at most one 1px border + one soft 8px/16px shadow on raised elements).
- Hierarchy comes from alignment, ruled separation (`--vajra-border` hairlines), surface
  changes, typography, spacing, and grid — BEFORE cards are considered.
- Dividers: 1px `--vajra-border`; strong dividers 1px `--vajra-border-strong`.

---

## 6. Motion

### 6.1 Personality

A precision financial instrument: controlled, weighted, decisive, calm, mechanically precise.
Never bouncy, playful, cinematic, or constantly moving.

### 6.2 Duration tokens

| Token | Value | Use |
|---|---|---|
| `--vajra-motion-instant` | 90ms | Press feedback, micro state |
| `--vajra-motion-fast` | 140ms | Hover, copy morph, focus |
| `--vajra-motion-standard` | 200ms | Standard transitions, inline reveals |
| `--vajra-motion-panel` | 260ms | Sheets, popovers, drawers |
| `--vajra-motion-route` | 300ms | Route transitions |
| `--vajra-motion-signature` | 420ms | Seal resolution, proof-chain completion beats |

Hard caps: routine motion ≤ 400ms; special (verified completion) ≤ 500ms total sequence.

### 6.3 Easings

| Token | Value | Use |
|---|---|---|
| `--vajra-ease-enter` | `cubic-bezier(0.22, 1, 0.36, 1)` | Elements entering |
| `--vajra-ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Default |
| `--vajra-ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Elements leaving (exits are fast) |
| `--vajra-ease-emphasis` | `cubic-bezier(0.16, 1, 0.3, 1)` | Seal, proof-chain beats |

### 6.4 Motion laws

- Animate `transform` and `opacity` only. No `width/height/top/left` animation in frequent
  interactions. No `transition: all`. No global `will-change`. No per-frame React state.
- No large motion dependency for hover/press/opacity/route transitions.
- Keyboard focus never waits for animation.
- Button press: `scale(0.985)`, 70–100ms, no layout shift.
- Copy action: icon morphs to check + "Copied", 140–200ms, restores after ~1.5–2s, announced
  to assistive tech.
- Amount input: digits may use 90–140ms opacity/vertical transition. No slot-machine, no
  count-up-from-zero.
- New activity rows: short highlight fading within 800–1200ms; no row pulsing.

### 6.5 Immediate response standard

Every interaction produces visible feedback in the next rendered frame. Sequence:
immediate physical response → clear working state → outcome → persistent record when
consequential. INP target ≤ 200ms at p75.

---

## 7. The three grammars

The grammars are compositional contracts, not components. Every screen declares which grammar
each region uses.

### 7.1 INSTRUMENT — active workflows

Create request, review terms, sign, pay, confirm.

- ONE dominant value or decision per view. One unmistakable primary action (violet).
- Calibrated numeric readout (`amount-hero`) for the value under decision.
- State is always visible and named; progression is visible (proof chain or stage text).
- Minimal noise: no secondary actions competing with the primary; tertiary actions are quiet
  text buttons.
- Feedback is immediate (§6.5).

### 7.2 LEDGER — evidence

Activity, terms, receipt details, passkey details, identities, signatures, hashes, contract
info, timestamps, audit history.

- Ruled rows: 1px `--vajra-border` separators, stable label-value alignment on a consistent
  grid (labels left in `--vajra-text-secondary`, values right-aligned or mono left-aligned).
- Tabular numerals; IBM Plex Mono for identifiers; freshness timestamps in `metadata`.
- Minimal cards: the ledger is rows on a surface, not a stack of cards.
- Compact step (`compact`/`metadata`) is the default voice.

### 7.3 SEAL — verified completion only

Settlement completed, signature verified, receipt sealed.

- Used ONLY after authoritative confirmation (onchain settlement or verified signature) —
  never on submission, never optimistically.
- ONE meaningful seal animation, ≤ 500ms: stroke draw / scale settle / emboss, in
  `--vajra-signature` on `--vajra-signature-surface`. This is the only routine moment a
  restrained gradient may appear.
- Completed proof chain accompanies the seal; the ledger is available immediately — the seal
  never delays data access.
- Formal but scannable: the receipt still reads as a ledger underneath the seal.

### 7.4 Ordering law

Instrument first. Ledger underneath. Seal only at verified completion. A screen may not open
with Seal content; Seal content may not appear before its evidence exists.

---

## 8. Proof chain (VAJRA's original motif)

Stages, in order:

1. Terms defined
2. Recipient signed
3. Request shared
4. Payer verified
5. Transaction submitted
6. Contract settled
7. Receipt sealed

### 8.1 States and rendering

| State | Rendering |
|---|---|
| Current | Strongest contrast; optional restrained pulse ONLY while actively waiting; pulse stops on completion and is disabled under reduced motion |
| Completed | Connector fills, icon completes, 160–220ms (`--vajra-motion-standard` band) |
| Future | Visible but subdued (`--vajra-text-muted`, unfilled connector) |
| Failed | Connector stops at the failed stage; stage labeled with what happened; recovery action sits beside it; explanation of what did and did not happen. No red flashing, no rail restart |

### 8.2 Layout

- Desktop: horizontal or vertical, per available space.
- Mobile: compact vertical rail. Current stage and next action are always visible. Never seven
  tiny unreadable circles — collapse completed stages into a summary line when space requires.
- Chain operations are long: state persists across refresh/background; deep-link back; NEVER
  show success on wallet submission alone. Submitted / confirmed / settled / failed / reverted
  are distinct named states.

---

## 9. Async stages, skeletons, optimistic UI

### 9.1 Named stage copy (never a bare spinner, never "Processing…" alone)

- Request creation: Preparing terms → Awaiting signature → Signing → Request created → Link ready.
- Wallet payment: Preparing transaction → Opening wallet → Awaiting wallet approval →
  Transaction submitted → Confirming on Monad → Settled → Receipt sealed.
- Passkey: Checking wallet → Checking registered credential → Awaiting device confirmation →
  Registering credential → Registration confirmed.

### 9.2 Timing rules

| Latency | Behavior |
|---|---|
| < 100ms | Pressed feedback only |
| 100–500ms | Preserve existing content |
| > 500ms | Inline progress or meaningful skeleton |
| > 2s | Descriptive stage naming whose clock we're waiting on |

### 9.3 Skeletons

Match final geometry exactly; stable row heights; used for activity ledger, receipt details,
request records. Never a blank spinner over existing content during refresh — keep stale
content labeled. No infinite shimmer; no shimmer under reduced motion; no layout shift.

### 9.4 Optimistic UI

Allowed ONLY for local filters, appearance, noncritical preferences. NEVER for wallet
signatures, onchain payments, settlement, passkey registration, revocation, or any destructive
security action.

---

## 10. Feedback hierarchy

In escalating order — use the lowest rung that carries the consequence:

1. **Ambient** — network, freshness, wallet status (quiet, persistent, non-blocking).
2. **Inline** — field errors, signature state, copy confirmation, validation, tx stage,
   disabled-control explanations.
3. **Toast** — low-risk confirmations only; never the only copy of critical information.
4. **Banner** — one compact persistent banner: environment limits, stale data, network mismatch.
5. **Dialog** — irreversible actions only: revocation, loss, consequential cancel, network
   switch interruption.

---

## 11. Accessibility (WCAG 2.2 AA, binding)

- Visible focus on every interactive element (§3.4.5); logical focus order; focus restored
  after sheets/dialogs close.
- Full keyboard operation; no focus traps; desktop keyboard shortcuts documented.
- Accessible names on all controls; correct roles; `aria-live` used sparingly; `aria-busy` on
  loading regions; errors programmatically associated with their fields.
- Color never the sole signal (§3.4.3).
- Readable at 200% zoom; compatible with increased-contrast mode.
- Both appearances independently pass AA contrast.
- Inputs: immediate focus ring, label stays visible, no shake animations, values preserved on
  error, inline error text.
- Loading buttons: stable width, compact indicator, `aria-busy`, stage text for consequential
  actions.

### 11.1 Reduced motion (complete, not partial)

Under `@media (prefers-reduced-motion: reduce)`:

- Remove translation, scale, parallax, pulse, shimmer, animated gradients.
- Shared-element transitions become crossfades; route transitions become short opacity fades.
- Progress communicated via text and static indicators.
- All functionality preserved. Manually tested before each phase gate.

---

## 12. Responsive

Test widths: **320 · 375 · 390 · 768 · 1024 · 1280 · 1440 · 1920**. Mobile ≠ compressed desktop.

| Class | Grammar adaptation |
|---|---|
| Phone (≤768) | Current state, amount, primary action, proof progress, critical terms. Single column, bottom sheets, large targets (≥44px), compact ledger rows |
| Tablet (768–1023) | List-detail layouts, supporting panes |
| Desktop (≥1024) | Persistent nav, two-column instrument layouts, dense ledger tables, evidence inspectors, keyboard shortcuts |

Reference screens are built at 390 / 768 / 1024 / 1440 in BOTH light and dark before owner
visual approval (direction §Workflow gates).

---

## 13. Screen grammar summary

- **Home:** no autoplay hero; calm readiness status; Create Request is the primary action;
  recent activity appears without stagger; no blobs, particles, animated gradients, count-up
  balances.
- **Create Request:** amount input focused immediately; proof chain visible; review preserves
  values spatially; ledger rows as one composed block; explicit signing state; share options in
  one short transition; QR appears cleanly.
- **Payment Page:** signed terms visible before wallet connect; signature verification inline;
  wallet sheet controlled; strong press/pending states; wallet approval ≠ network confirmation;
  no money flying, no confetti.
- **Activity:** new rows insert with short highlight (§6.4); stable sort/filter; live status via
  icon + label + timestamp.
- **Receipt:** one premium completion sequence ≤ 500ms AFTER authoritative confirmation:
  settlement appears → proof chain completes → seal resolves → ledger available →
  share/download appear. No confetti, no repeated rotation, no glitter, no delayed data access.
- **Passkey/Security:** restrained inline progress; native system UI for device approval;
  revocation = warning + explicit confirmation dialog; no fake biometric animations; no
  celebrating security changes.
- **Theme switch:** immediate control response, crossfade 140–220ms, no white/dark flash.

Haptics: none on web. Sound: none by default.

---

## 14. Identity test

Strip the logo, the name, and the accent color. VAJRA must still be recognizable through:
instrument hierarchy, ledger evidence, proof-chain progression, the verification seal, signing
language, settlement states, receipt anatomy, and motion personality. If a screen could belong
to any fintech product, it fails.

---

## 15. Governance

- Tokens change only by editing this file with a log.md entry. Component-local color, spacing,
  or motion values outside this file are defects.
- The three grammars and the identity test are review criteria at every phase gate
  (direction §Workflow gates: Phase 1 tokens + Motion/Interaction Lab; Phase 2 reference
  screens at 390/768/1024/1440 light+dark, then STOP for owner approval).
