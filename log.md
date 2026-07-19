# VAJRA — Decision Log

Format: date → context → options → decision → rejected alternatives → reason.
Never re-decide a logged decision without a new entry explaining why.

## 2026-07-19 — Project authority and process
- Context: Owner supplied Vajra PRD/TRD/Security Blueprint v1.0 (40pp), NN/g UX direction,
  vajra-world-class-ui-ux-agency-pack, and an Engineering Constitution from a different project
  (hivesmind/SelfMade: x402/USDT, X Layer, zero smart contracts).
- Decision: The Vajra blueprint is authoritative for product/security/tech (its §27).
  Constitution's process rules adopted (ADR logging, testing rigor, git discipline, single error
  shape, security rules); its stack lock and product specifics rejected (they contradict the
  blueprint: Vajra REQUIRES one immutable Solidity contract on Monad, native MON).
- Rejected: applying hivesmind stack (SQLite/x402/no-contracts) — wrong product.
- Reference: docs/design-gate-review.md §3.

## 2026-07-19 — Network target: Monad MAINNET (chain ID 143)
- Context: Blueprint v1.0 says testnet-first, mainnet out of scope pending audit + explicit
  owner release decision. Owner first said mainnet, then "drop mainnet, testnet", then issued a
  full mainnet migration spec (15:40) with real-MON funding — the latest, most detailed instruction.
- Decision: Build mainnet-first. Chain ID 143. Fresh immutable deploy, fresh EIP-712 domain,
  no testnet fallbacks in production config, fail closed on bad config. "Monad Mainnet / Real MON
  will move" displayed before every payment. Blueprint §25 mainnet gate satisfied by: this explicit
  owner decision + full test suite + adversarial review + minimum-value smoke tests before any
  larger amounts move. No testnet contract ever existed, so there is nothing to migrate.
- Rejected: testnet-first (owner override); silent mainnet deploy without test gates (blueprint §25).
- Risk logged: mainnet deploy with real funds predates independent audit. Mitigation: full Foundry
  unit/fuzz/invariant suite, adversarial review loop, minimum-value smoke tests, owner-funded
  deployer key holds only what owner sends.

## 2026-07-19 — Toolchain and keys
- Foundry v1.7.1 installed at ~/.local/bin (forge/cast/anvil/chisel).
- Deployer wallet generated locally. Address: 0xEB9c56D1EB7Ff500e10822c5C7A690140Fa7463E.
  Private key lives ONLY in gitignored .env as DEPLOYER_PRIVATE_KEY. Never printed, never committed.
- monskills (therealharpaljadeja/monskills) installed at .agents/skills/monskill — the skills CLI
  is interactive-only, so the repo was cloned directly; same content, same layout.
- Git initialized. Baseline commit 48b3861 (docs/research/packs only, no code).

## 2026-07-19 — UX/design posture
- UX architecture approved pre-gate: docs/ux-blueprint.md (+ NN/g research synthesis §6).
- Visual design gate INTACT: no Design.md, no palette/type/layout decisions until owner confirms
  the 4 open items in docs/design-gate-review.md §4. Agency pack palette ("Tempered Intelligence")
  is the leading candidate, not yet approved.
- impeccable (npx impeccable install) deferred to Phase 5 — it is a styling tool; installing it
  now would violate the gate.

## 2026-07-19 — Judging constraints (from hackathon brief)
- AI judging agent checks: start time vs hackathon start, static placeholder data, suspicious commits.
- Consequences: real onchain functionality only; human-voiced commits at natural breakpoints;
  README + demo script mandatory (Phase 6); no fake success paths anywhere (already blueprint law).
