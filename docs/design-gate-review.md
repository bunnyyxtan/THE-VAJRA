# Vajra Design-Gate Review — Agency Pack Mapping

**Status:** Prepared for owner confirmation. This is NOT Design.md and creates no visual system.
It maps the owner-supplied `vajra-world-class-ui-ux-agency-pack` (20 files, read in full,
archived at `packs/vajra-agency-pack/`) onto the 12 mandatory design questions from the
blueprint §13, and reconciles the pack + Engineering Constitution with the Vajra PRD/TRD v1.0,
which remains the authoritative document for product, security, and technical behavior.

---

## 1. What the pack is (and isn't)

The pack is a strong agency-grade standard: design process, brand strategy, no-AI-slop rules,
color architecture, a proposed Vajra palette ("Tempered Intelligence"), typography, grid/density,
dashboard modes, data-viz, component/state specs, cross-platform adaptation, motion, microcopy,
accessibility (WCAG 2.2 AA), performance, testing rounds, and a 100-point QA scorecard with
critical automatic failures.

**Adaptation warning:** large parts of the pack were clearly authored for an AI-routing/ops
product — it references providers, models, route changes, savings reports, approvals,
pause/revert, and operator personas. Those passages do NOT describe Vajra's actual objects
(payment requests, passkeys, settlements, receipts). Applicability split:

| Pack section | Verdict for Vajra payments |
|---|---|
| 00–01 process, 03 no-slop, 04 color architecture, 06 typography, 07 grid/density, 10 components/states, 12 motion, 13 microcopy, 14 a11y, 15 performance, 16 testing, 17 QA scorecard, 18 research library | **Adopt wholesale** — product-agnostic standards |
| 02 brand strategy | **Adopt with edits** — keep "verified force under control", evidence-before-action, calm confidence; DROP routing/autonomy motifs (decision traces, route topology, rollback paths) that belong to the ops product. Vajra-native motifs: seals, proof chains, verification marks, expiry, signed terms |
| 05 color tokens | **Adopt as prototype baseline** (owner-supplied); validate pairs in context per its own rules |
| 08 dashboard modes, 09 data-viz examples | **Adapt** — Vajra v1 has no monitoring/analytical dashboards. The receipt page and activity page are the only data surfaces; apply metric anatomy, freshness, and honest-uncertainty rules there |
| 11 platform adaptation | **Adapt** — Vajra is web-first; keep "shared meaning, different composition" and mobile task prioritization (pay flow = phone-first), drop native-app guidance |
| 19 agent prompt's "audit the current product" | **Translate** — no code exists yet; the audit becomes a build-time inventory obligation (below) |

## 2. Missing pack files (must be supplied or waived)

1. `vajra.tokens.json` — the machine-readable token file the pack references.
2. `VAJRA_VISUAL_SYSTEM_REFERENCE.html` — the visual reference the pack references.
3. `05_QA_AUDIT_CHECKLIST.md` — referenced by the separate `ui-ux-coding-agent-knowledge-pack`
   instructions; that entire knowledge pack was NOT attached. Either attach it or treat
   `17_DESIGN_QA_SCORECARD.md` as the QA instrument.

## 3. Constitution reconciliation

The Engineering Constitution v2 contains a **stack lock for a different product** (Next.js +
SQLite + x402/USDT on X Layer, "zero smart contracts", stall/keeper domain language). Per Vajra
blueprint §27 (authoritative) the following constitution rules are **overridden for Vajra**:
stack lock (2.1–2.2: Vajra = Foundry/Solidity + Next.js + wagmi/viem on Monad, one immutable
contract), domain names (3.2 examples), E2E scenario (5.3). The following are **adopted**:
governance/ADR discipline, one-feature-per-task, config-in-one-module, single error shape,
testing rigor, git discipline, security rules (4.x — they match blueprint §20), anti-detection
craft, definition of done, self-review. File budget (1.4) is waived for the blueprint's mandated
module layout (§18).

## 4. The 12 mandatory design questions — pack answers vs. owner confirmations needed

| # | Question | What the pack answers | Needs owner confirmation |
|---|---|---|---|
| 1 | Feel | Operational intelligence, calm confidence, precision under pressure, technical credibility | Confirm this fits a P2P payment product (pack was written for ops users) |
| 2 | Guiding references | Behavioral refs: Carbon, Primer, USWDS, GOV.UK, Material/Apple/Fluent as behavior only | Any additional product references owner admires |
| 3 | Styles to avoid | Full no-slop list (03): gradients, glass, orbs, neon, nested cards, pill overload, crypto clichés | — |
| 4 | Light/dark | Both, independently designed (05 gives both palettes) | Which is primary for the demo? |
| 5 | Role of "Vajra" metaphor | "Verified force under control" — hardness/precision as proof & seals, NOT lightning bolts | Approve replacing ops motifs with payment-native ones (seal, signed terms, expiry, proof chain) |
| 6 | Motion budget | Restrained, token-defined (80–400ms), purpose-only, reduced-motion respected (12) | — |
| 7 | Passkey feel | Not explicitly answered | Choose: mechanical/ceremonial/invisible — recommend "mechanical seal": a deliberate, weighty confirmation moment |
| 8 | Typography | Engineered, authoritative; IBM Plex Sans + IBM Plex Mono, tabular numerals, ≤2 families (06) | — |
| 9 | Mobile behavior | Phone = pay/verify/approve with thumb-reachable primary actions; no shrunk desktop (11) | — |
| 10 | Brand assets/constraints | None supplied; domain vajra.xyz unconfirmed (blueprint §30) | Supply logo/assets or confirm none; confirm domain status |
| 11 | One direction or several | Pack proposes exactly one: "Tempered Intelligence" (05) with palette + contrast table | Approve as THE direction, or request alternatives per blueprint Stage 3 |
| 12 | Screens needing owner approval before propagation | Not answered | Recommend: landing, /pay verification screen, sealed receipt — these three first |

## 5. How this integrates with delivery phases (no phase skipping)

- **Phase 1 (contracts)** — unaffected; proceeds now. Constitution testing/git/ADR rules apply.
- **Phase 2 (functional web)** — build semantic unstyled skeleton per blueprint §10 + our
  `docs/ux-blueprint.md`. The pack's "audit first" instruction is satisfied by producing the
  route/workflow/state inventory AS the skeleton is built (routes, forms, handlers, wallet flows,
  all four states per screen — already specced in ux-blueprint §3).
- **Phase 3 (security hardening)** — unchanged.
- **Phase 4 (design gate)** — this document + owner's answers to the open items in §4 above
  complete the gate conversation. Only then create Design.md, sourcing tokens from the pack's
  palette (or the missing `vajra.tokens.json` if supplied).
- **Phase 5 (visual implementation)** — pack becomes the binding standard: tokens-only styling,
  component state specs (10), motion tokens (12), microcopy rules (13), WCAG 2.2 AA (14),
  verified batches with type-check/lint/test/build after each batch.
- **Phase 6 (submission)** — QA via `17_DESIGN_QA_SCORECARD.md` (≥90/100 + zero critical
  failures), with filled scorecard, exact files changed, routes/viewports tested, and honest
  unverified list.

## 6. Standing rejections (locked in advance)

Per pack 03 + blueprint: no neon blue-purple gradients, glowing orbs, particles, glassmorphism,
nested cards, pill overload, fake metrics, decorative motion, "seamless/revolutionary/AI-powered"
copy, hardcoded hex outside tokens, color-only status, toast-only critical outcomes, compressed-
desktop mobile, skeletons that don't match final geometry, stale data shown as live.
