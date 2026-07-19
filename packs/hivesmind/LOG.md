# HIVESMIND — Decision Log (ADR-style)

## 2026-07-17 — Concept selection (3 ideation rounds, 30+ concepts, 2 red-team passes)

| # | Decision | Why | Rejected alternatives |
|---|----------|-----|----------------------|
| 1 | **SelfMade → Genesis Fleet** as the product | Only concept with no reference class; alive (birth/death/reproduction/GDP); proves OKX's own thesis; unfakeable on-chain evidence | CLAWBACK (claim-collecting agent — strong but user rejected) · BAIT (paid-sensor anti-phishing — rejected) · MEMENTO (portable agent memory layer — rejected) · QUORUM (consensus prediction execution — killed by red team: India account trap, PROGA criminal exposure, staged-demo risk, heavy build) · TOKRI (group-buy escrow — kept as business backup) · CHARM SCHOOL (agent training — smaller idea) · Sundial (elder care — app not layer) · TurnPot (money circles — ToS kill-switch) · KITTY, PROCTOR, ShopMate, DemoForge, SusCheck, FairHour (Branch F fallback, kept) |
| 2 | **ONE ASP identity; hives = off-chain sub-ledgers with own payTo EOAs** | One ASP per wallet + ~24h review each → 20 hives impossible otherwise. payTo verified as runtime data, not in on-chain listing | Hive-per-ASP (fatal identity math) |
| 3 | **ZERO custom smart contracts** | Shop ≠ market. x402 + standard transfers + EIP-3009 gasless sweeps cover settlement, receipts, verification. Custom contract = attack surface with zero new capability. Contracts return only for trustless multi-party logic (escrow between strangers, revenue shares) | Own escrow/market contract (reentrancy, oracle, upgrade-key risk for a $5 float) |
| 4 | **Honest costs only** — real OpenModels inference at restock, real 1¢ supplier calls to named third-party ASPs | OKX covers gas; invented "hosting bill" is judge-catchable fiction | Fabricated hosting costs |
| 5 | **AI only at restock, amortized; zero-marginal-cost delivery** | $0.96 LLM call vs 12¢ goods = upside-down unit economics | LLM-per-sale |
| 6 | **Goods lineup: $0.12 OKX.AI Market Map flagship + UPSC packs + builder packs + templates** | Students can't pay on OKX.AI (0–3 organic sales projected). Market Map has recursive genius: 379+ participants want it, agents buy it too → stranger-agent receipt = the demo gasp | Riya's-notes-as-flagship (imaginary demand) |
| 7 | **Zero self-orders, published team wallets, honest day counters** | Judges trained on wash-trading heuristics; ERC-8004 registration dates are public ("Day 41" was falsifiable) | Seeded/fake traction |
| 8 | **Two-phase build: creature D1–D5, fleet D6–D10** | Fleet multiplies whatever the core does; fleet features unlock only after hive #1 earns first real external dollar | Fleet-first (bigger embarrassment if core stalls) |
| 9 | **Day-1 gauntlet gate** → Branch F (FairHour) fallback pre-committed | No mid-build improvisation; decision made now | Improvising mid-build |
| 10 | **Dormancy rule published**: dormant iff runway <3d AND no sale in 72h; dormant hives still fulfill sales | Predictability = trust; dormancy-revival filmed as emotional beat | Silent pausing |

## 2026-07-18 — Naming
- **HIVESMIND locked** (owner's pick, domain secured). The "s" is the thesis: hives (plural, each stall) + mind (collective economy). Vocabulary: hive / Keeper / the Apiary / the Empty Comb / SOLVENT stamp.
- Rejected: SOLVENT (runner-up, became the daily stamp word), TILL, ANTHILL, MENAGERIE, FERAL, SPORE, DUKAAN, ROZI, plain "hivemind" (Stranger Things + Hive blockchain + groupthink).
- Residual caution (logged once): Hive blockchain (hive.io) exists — different thing; Stranger Things echo fades behind the honeycomb world.

## 2026-07-18 — Design direction
- **"The Living Economy, premium edition"** locked: warm cream world, tangerine accent, apiary-as-ledger single metaphor. Rejected: midnight "Living Ledger" dark terminal (owner veto — wants light/energetic), pixel-creature street market (too risky).
- Stack locked: Next.js + Tailwind v4 + GSAP ScrollTrigger + Lenis + NumberFlow. Framer Motion dropped in favor of GSAP.
- Owner mandates: agency-grade output, scrollytelling, interactive onboarding guide, gallery mining (7 sites), institutionalized design-review lenses (quieter/distill/critique/polish/grill-me/apple-design).

## 2026-07-18 — Process rules adopted (owner's advice, endorsed)
log.md · handoff.md · commit-per-session + tags · understand-your-code-deeply · E2E script as executable truth (addition: tests > status files).

## 2026-07-18 — Context migrated to Kimi Work
Full project state persisted to C:\BUILDING\hivesmind (PROJECT/BLUEPRINT/DESIGN/CONSTITUTION/LOG/HANDOFF). Deadline re-verified: **Jul 27, 2026 — plan around 22:59 UTC** (hackquest.io; schedule block 22:59 vs body 23:59).

## 2026-07-18 — WORLD PIVOT: honey universe RETIRED
Owner correction: HIVESMIND derives from Stranger Things' hive mind (many bodies, one consciousness) — NOT honey/bees. Apiary/honeycomb/Empty Comb vocabulary retired. New world bible: The Mind (economy/ledger) · Vessels (hives) · Tendrils (supply chains, pulse-travel visual) · Spores (ambient tx particles) · The Quiet (memorial — "the Mind remembers") · Spawning (reproduction) · Keepers (humans who "tune in"). All visuals GENERATIVE (code-drawn from real settlement data) — zero AI stock imagery; the world is a system, not pictures.

## 2026-07-18 — DUAL THEME locked: The Waking Mind (light) + The Deep Mind (dark)
Owner: both modes for user ease; cold-dark = AI slop, white-canvas = AI slop. Solution: one OKLCH warm scale, two faces — warm cream #FAF6EF (never #FFF) + warm espresso night #171210 (never #000, never blue-black). Tangerine = bioluminescence on dark. Theme toggle = View Transitions circular color-bleed (~600ms) — a product moment. Full plan in FRONTEND_ROADMAP.md (interaction grammar, page-by-page, 7-day gated build, simplicity laws).

## 2026-07-18 — Agency skill stack installed (owner's ranked list)
Installed via `npx skills add` into `.agents/skills/` + `.claude/skills/` (universal: Kimi Code CLI, Claude Code, Cursor, etc.). 19 skills live:
- **Interface**: canvas-design, frontend-design, impeccable (absorbs critique/distill/quieter/polish — repo restructured to one skill), extract-design-system, oklch-skill, userinterface-wiki, make-interfaces-feel-better, emil-design-eng, web-design-guidelines
- **Research**: grill-me
- **Development**: shadcn, agent-browser, vercel-react-best-practices, vercel-composition-patterns, tailwind-design-system, typescript-advanced-types
- **Motion**: apple-design, animation-vocabulary, review-animations
Skipped deliberately: vercel-react-native-skills (no mobile app), ibelick/ui-skills (no repo provided).
Usage law: ranked order = priority order per section; impeccable = pre-ship gate, grill-me = design-decision gate, web-design-guidelines + vercel-react-best-practices = code audit gate, review-animations = motion gate.

## 2026-07-18 — Research desk round 2 (7 parallel agents, findings in research/)
- Prize map corrected/verified: Best Product · Creative Genius · Revenue Rocket = **$20K each**; category awards $7.5K each (3 winners per category); Social Buzz 10×$1K. (Earlier session assumed $10K flagships — superseded.)
- Sold-counts public on marketplace → Revenue Rocket = visible sales race → decision: **list ASP as early as possible at micro price** ($0.02–0.1) to compound sold-count.
- 397+ participants; PixelBrief leads sold-count at 10.09K. Winning entries cite concrete methodology (never slop naming).
- Design research locked in: Superpower (tangerine-on-warm-zinc) + Samara (large-light type) as new references; footer = curtain-reveal + mono ledger micro-bar; navbar = detached floating pill, hex-notch CTA; GDP/ticker spec assembled; Awwwards jury math: Design 40/Usability 30/Creativity 20/Content 10, scroll-narratives +1.8, accessibility = cheapest outscoring lane.

## 2026-07-18 — v0.0-scaffold committed (Day 1, task 1 done)
- Foundation live: Next.js 15.5.20 App Router + TS strict (5.9.3 — rejected TS 7 native preview) + Tailwind v4.3.3 @theme + better-sqlite3 12.11.1 + zod 4.4.3 + viem 2.55.2. All versions pinned exact.
- **Build must use Turbopack** (`next build --turbopack`): webpack's WasmHash crashes on Node 24 (`_updateWithBuffer … reading 'length'`) — V8 ArrayBuffer-transfer change. Recorded so nobody "fixes" the script back.
- **@types/better-sqlite3@7.6.13 added beyond the task's dep list** — types-only companion of an approved dep; required for TS strict. Owner-visible justification per rule 2.
- Ledger: STRICT tables (type violations fail closed at the DB), WAL, versioned migration-on-boot via `user_version`, money as atomic-unit TEXT.
- General Sans is NOT on Google Fonts — served via Fontshare CDN `<link>` with system fallbacks; Fraunces (opsz/SOFT/WONK) + IBM Plex Mono via next/font.
- Token law enforced in `globals.css`: hex only inside @theme; semantic colors via `@theme inline` + `data-theme` (day/night); reduced-motion guard in base layer.
- Tests: node:test (zero new deps), Node 24 native TS type-stripping, one suite file `tests/core.test.ts` (10 tests, 3 modules) — keeps scaffold at 7 source files, 8 remaining for the whole MVP.
- `.agents/` and `.claude/` gitignored (local tool state; `skills-lock.json` is the committed manifest).

## 2026-07-18 — v0.1-endpoints committed (Day 1, task 3 done)
- **5 frozen goods live** at `GET /api/goods/[slug]` (one dynamic route, 5 registered services — scope lock kept). x402 v2 settle-then-deliver on X Layer: 402 challenge → zod-validated PAYMENT-SIGNATURE → local checks (version/challenge/recipient/value/validity window) → OKX facilitator /verify → /settle → ledger (vessel ensure + order + settlement + event in one tx) → 200 + PAYMENT-RESPONSE receipt.
- **OKX facilitator client hand-rolled** (HMAC-SHA256 OK-ACCESS-* headers + fetch) instead of `@okxweb3/x402-*` SDKs — zero new dependencies (rule 2; no owner approval sought for SDKs). Client is injectable (`GoodsEndpointDeps.facilitator`); tests mock it at the module boundary, no network.
- **Replay protection without schema change**: order id is derived from the EIP-3009 nonce (`ord_<nonce>`), so a double-submitted settled payload returns idempotently from the ledger before any facilitator call; `settlements.tx_hash UNIQUE` is the second line, and a UNIQUE race resolves to the existing rows, never a 500.
- **Request pipeline lives in lib/x402.ts, not the route file** — Next validates route exports and rejects non-route symbols; the route is a thin env-resolving adapter (`runtime='nodejs'`, `force-dynamic`).
- **Gotcha (new)**: node --test strip-only mode rejects TS parameter properties (`constructor(private x)`); write explicit field assignments in test helpers.
- **Gotcha (new)**: relative imports inside `src/` use explicit `.ts` extensions so node --test resolves them; `app/api/goods/[slug]/route.ts` → lib is `../../../../lib/`.
- Goods content is real: market-map renders live ledger stats + labeled marketplace facts (as-of 2026-07-18); survival-report computes P&L/dormancy fields from the ledger and reports runway as null rather than inventing it (honest-costs law); packs/templates are static structured deliverables in goods.ts.
- Delivery tokens: HMAC-SHA256 `${body}.${mac}` base64url, 15-min expiry, constant-time verify; DELIVERY_SECRET min 16 chars.
- Env added to .env.example: TREASURY_ADDRESS, OKX_FACILITATOR_URL, OKX_API_KEY, OKX_SECRET_KEY, OKX_PASSPHRASE, DELIVERY_SECRET.
- Tests 23/23 (10 scaffold + 13 endpoint), typecheck ✓, build ✓ (Turbopack), HTTP smoke test on `next start` ✓ (402 shape, 404, 400).
- File budget: 11/15 used. 4 remain for frontend polish + any deploy config.

## 2026-07-18 — v0.1.3-public-base-url (prod poke-test fix)
- **Bug**: live poke-test on Railway showed 402 challenges with `resource.url`/`iconUrl` = `https://localhost:8080/...` — the handler derived the origin from the internal request host behind Railway's reverse proxy. A wrong URL here would have been written into the permanent on-chain A2MCP listing — caught just in time.
- **Fix (fail-closed, no hacks)**: origin resolution order is now (1) explicit `PUBLIC_BASE_URL` env, validated once at boot by `parsePublicBaseUrl` — must be a bare https origin (http only for localhost; path/query/credentials/garbage → boot throws → 500 server_misconfigured); (2) `x-forwarded-proto` + `x-forwarded-host` (standard Railway/Vercel/Cloudflare headers), host regex-validated so spoofed values like `https://evil.example/phish` are ignored, not trusted; (3) request origin (local dev only).
- **Audit**: goods.ts bazaar metadata carries no absolute URLs (queryParams + output examples only) — resource.url and iconUrl were the only public-facing URLs, both now routed through `resolvePublicOrigin`.
- New env: `PUBLIC_BASE_URL` in .env.example (set to https://hivesmind.xyz on Railway).
- Tests +4 (forwarded headers, env precedence, spoof rejection, parsePublicBaseUrl fail-closed table): 27/27 ✓ typecheck ✓ build ✓ HTTP smoke with PUBLIC_BASE_URL set ✓.
- Deployment host decided by owner action: **Railway** (the open-question is resolved; stick with it per the permanent-endpoint rule).

## 2026-07-18 — v0.2-agent-digest-good (owner-approved scope change)
- **Owner-approved swap**: `upsc-pack` (India-specific UPSC Mains digest) REPLACED by `agent-digest` — a global good at the same $0.49 price point. Rationale: India-specific demand window was speculative; the agent-economy digest serves the actual buyer pool (agents + builders on OKX.AI) and compounds the Market Map thesis — we sell intel about the economy we operate in.
- Spec per owner: slug `agent-digest`, serviceName "Agent Economy Digest", price 490000 atomic ($0.49, 6 decimals), 2-part description ("Delivers a structured digest… For researchers, traders, and monitoring agents." + "No input required.").
- Content law kept: honest structural explainer — marketplace mechanics, x402 v2 payment lifecycle, ERC-8004 identity, ecosystem categories, earn/spend unit economics — protocol constants and mechanisms only, explicitly no real-time statistics (framed as "structural signals, not measurements").
- validate.ts GOODS_IDS swapped (owner-instructed scaffold change); the 404 `known` list in x402.ts now derives from GOODS_IDS instead of a hardcoded literal — no more slug drift.
- Tests: 3 upsc-pack references swapped; 27/27 ✓ typecheck ✓ build ✓. Railway auto-deploys from main on push.


## 2026-07-19 — HIVESMIND registered on-chain (ASP #6633)
- onchainos CLI v4.2.6 installed (SHA256-verified vs official checksums). Wallet logged in as ranbirkapoor7002@gmail.com (NEW wallet; vijayleodas account logged out per owner — it has another agent in review).
- Consent gate passed; treasury = Agentic Wallet 0x6c43dd04e8323f9227e14c307479b26cbf2944ac (replaced interim team EOA in env; interim key stays local-only).
- Logo: owner locked the ORIGINAL badge (espresso squircle + neural star) over variants A/C; competitor PFP analysis (PixelBrief/Maya/Quiver/Clawby et al.) in assets/competitor-pfps/ — winning pattern: dark tile + one bold bright shape, no neon wireframes, no wordmarks, no anime IP.
- UPSC pack replaced with Agent Economy Digest (owner: global marketplace, not India-focused); endpoint slug agent-digest live + verified.
- QA validate-listing: pass, zero findings. agent create → #6633 (tx 0xf1bd...f0cc4). A2A runtime installed (@okxweb3/a2a-node + doctor --fix). Activated → **Listing under review** (≤24h to email).
- Category assigned by platform: SOFTWARE_SERVICES.

## 2026-07-19 — v0.4-the-watchers (OWNER-MANDATED TOTAL FRONTEND RESET)
- **Owner rejected the entire cream+espresso dual-theme system.** Wiped in full: globals.css rewritten, page.tsx token-shell deleted, General Sans/Fontshare dropped, dual `data-theme` retired. New world: **"Black Editorial / The Watchers"** (DESIGN.md v2).
- References studied + archived in `assets/inspiration/`: AWE Network (pure black, editorial italic serif, vermillion accent, mono micro-labels, big serif numerals), Intercom Fin (FIG-numbered exhibits, honest giant numerals, left index rail, orange dataviz), Brainfish (organic node-network), ChainGPT video (robot that follows the cursor, hairline grid, side-rail index).
- **THE WATCHERS device** (`src/components/MindField.tsx`, raw canvas 2D, zero libs): one large vessel-eye + 6 smaller at parallax depths, pupils track pointer with per-eye lag (0.04–0.075), random blinks (ring compresses vertically, 220ms), idle sinusoidal drift, 64 drifting spores, hairline grid, rAF with full unmount cleanup, prefers-reduced-motion → one static frame. Colors read from @theme CSS vars at runtime — zero hardcoded hex outside globals.css.
- Token system: `#0B0B0C` base / `#111113` raised / ink 100/55/32% / hairlines 8% / accent `#F27D26` as LIGHT (eye rims, one italic word, CTA). Single permitted glow = radial horizon-glow (accent light only, never multi-color). Radius ≤20px, pill for the one CTA, squircle = logo only.
- Staggered entrance (not generic fade-up): eyes wake → headline +200ms → ticker +480ms, 800ms out-expo.
- **No-fake-data law enforced in UI**: ticker = "MIND STATUS: AWAKE · 0 SETTLEMENTS · FLEET INITIALIZING —" + marquee of the 5 real services at real prices. v1's "synthetic heartbeat / prefill ticker" idea is hereby reversed — honest zero-states only.
- **Blocker handled**: `assets/logo.png` / `logo-A.png` referenced by the task DO NOT EXIST in the repo. Generated the brand mark generatively instead (Pillow superellipse): espresso squircle + tangerine vessel-eye with 6 nodes + black pupil + white glint → `public/icon.png` + `public/logo.png` (also fixes the 402 challenge's iconUrl).
- File budget: 12/15 source files (+MindField.tsx only; stagger/ticker are pure CSS in globals.css).
- typecheck ✓ · tests 27/27 ✓ · build ✓ · HTTP smoke ✓ (markup + logo.png 200).
