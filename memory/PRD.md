# Vajra — PRD & Build Memory

## Original problem statement
Build a premium, mobile-first frontend for **Vajra**, a recipient-authenticated payment app on Monad Mainnet. Core promise: "Never trust a pasted address again." Recipients authenticate exact payment terms with a passkey; senders verify every protected detail, pay once, and receive a permanent settlement receipt. Luxury consumer-finance feel with Monad-native personality (purple #6E54FF, lavender #DDD7FE, warm white, near-black #0E091C). Truthful states everywhere, no fake success, no raw errors.

## User choices (locked)
- Frontend-only PROTOTYPE: no backend, no database, no APIs, no real RPC/contracts.
- Simulated Vajra Touch passkey ceremony (UI only, no biometrics claimed).
- Local-only deterministic mock data; share links/QR encode mock request codes.
- Wallet-identity only, no signup.

## Architecture
- Expo SDK 54 + expo-router (stack navigation), React Native, reanimated.
- No backend used (FastAPI/Mongo template untouched).
- State: `src/state/vajra.tsx` context, persisted via `@/src/utils/storage` (passkey, wallet, requests, settings).
- Mock engine: `src/lib/mock.ts` — deterministic scenario requests (VJ-CAFE42 ok, VJ-EXP7D1 expired, VJ-RVK9K2 revoked, VJ-PAYER3 wrong-wallet, VJ-NETETH wrong-network, VJ-TAMPRD invalid-signature, VJ-PAID88 already-paid, VJ-RPCDWN rpc-down, VJ-SLOW11 slow, VJ-UNSURE uncertain) + seeded local activity.
- Design: brutalist-tactile identity. Hard offset shadows (boxShadow), ink borders, Space Grotesk display + Plus Jakarta Sans body + Fraunces italic accents, editorial numbered sections, ledger lists, ticket-style receipt with stamp/perforation/barcode. Tokens in `src/theme/index.ts` + `/app/design_guidelines.json`.
- Keyboard: react-native-keyboard-controller (KeyboardProvider, KeyboardAwareScrollView, KeyboardStickyView footer).
- Camera: expo-camera QR scanner with full permission contract (pre-prompt explanation, denied, blocked → Open Settings, web fallback).

## Screens (all implemented, June 2026)
- `/` Home: scroll-linked hero (serif strikethrough headline, tilted signed-request object), stats, editorial how-it-works, recent ledger, glass footer (Create / Scan-Open).
- `/passkey-setup` Vajra Touch ceremony: intro, simulated sheet, cancelled, unsupported→wallet-signature fallback, persistent success.
- `/create` 3-step: Amount (centered dynamic-size input, USD estimate, quick chips) → Terms (wallet prefill, memo 64-char counter, expiry chips, payer restriction disclosure) → Review & authenticate (fields lock sequentially, Vajra Code reveal) → Share.
- `/share/[id]`: QR + copy (label swap) + native share, revoke with confirm sheet, expired/revoked/paid persistent states.
- `/pay/[id]`: skeleton → staggered per-field verification marks → verified banner; fail-closed states (outage/rpc), broken handshake (tampered), expired, revoked, already-paid, wrong-wallet, wrong-network (with simulated switch), connect wallet gating; every error explains what happened + whether money moved + next step.
- `/progress/[id]`: truthful stage rail (Prepare → Confirm in wallet → Broadcast → Included → Final), interactive wallet approve/reject, rejection recovery, slow-inclusion note, uncertain state with "Check again" (resolves deterministically), finality seal, store update only after final.
- `/receipt/[id]`: permanent settlement ticket (stamp, perforation, mono ledger rows, barcode), copy/share/explorer sheet, unpaid gating, prototype disclosure.
- `/activity`: filter chips (single-line scroller), skeleton, ledger card, per-filter empty states, outage section error (derived from live settings), pull-to-refresh.
- `/security`: passkey management (how-it-works, disable flow), wallet connect/disconnect, reduce motion/transparency prefs, outage simulation toggle, "never asks" sheet.
- `/open-link` "Pay a request": QR scanner entry (camera permission flow, web fallback), paste link with inline validation, 10 sample scenario rows.

## Desktop / responsive web (June 2026, complete)
- `src/hooks/use-breakpoint.ts`: isTablet ≥768, isDesktop ≥1024, isWide ≥1280.
- `Screen.tsx` is the responsive shell: `maxWidth` prop (default 680) caps and centers content, header inner bar, belowHeader and sticky footer on desktop; header row 64pt on desktop. Fixed a crash where `isDesktop` was referenced but the hook was never called.
- Landing `/`: top nav links + dual CTAs, side-by-side hero (headline left, signed-request object right), 3-col how-it-works, bento stats.
- `/create` (maxWidth 1024): form left + live "DRAFT REQUEST → SIGNED REQUEST" preview card right that mirrors amount/terms and flips to locked state.
- `/pay/[id]` (1024): protected fields left; verification banner, outcome cards and wallet card in right rail. Mobile order unchanged.
- `/share/[id]` (1000 active / 640 terminal): QR card left, link + summary + actions right.
- `/security` (1000): 2-col bento grid of the four cards.
- `/open-link` (1000): scan/paste left, sample scenarios right.
- `/passkey-setup` (920): ring + headline side-by-side, 3-col benefits, centered CTA; success card capped 560.
- `/receipt/[id]` (560): centered ticket, copy/share buttons in a row.
- `/activity` 760, `/progress/[id]` 620 centered columns.
- `PressableScale`: subtle hover scale (1.01) on web; `Button` already lifts on hover. Sheets center as dialogs on ≥768 (pre-existing).
- QR scanner keeps its web fallback panel (paste instead).

## Testing status
- 3 testing-agent iterations + manual passes: all flows pass. Fixed along the way: wrong-network after full reload (flip moved into verify post-hydration), activity outage banner hydration race (derived state), iOS horizontal shift on amount step (removed autofocus, centered constrained input), stray parse error.
- Copy audit: no em dashes in UI, professional tone, prototype honestly labeled everywhere.

## Backlog / next (P1–P2)
- P1: Real backend for shareable requests (FastAPI + Mongo), so links resolve across devices.
- P1: Real Monad RPC + wallet integration (WalletConnect), real passkey (WebAuthn) when moving past prototype.
- P2: Reverted-transaction scenario, contact labels, request search, localization (RTL readiness in place), Activity search empty state.
- P2: Push notification on payment received (only if user requests).
