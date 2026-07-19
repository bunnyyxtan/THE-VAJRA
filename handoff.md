# VAJRA — Handoff

Read log.md FIRST. Never re-decide a logged decision.

## Where we are
Phase 0 (spec freeze) complete. Phase 1 (contract core) starting now.

## Facts a fresh session needs in 2 minutes
- Product: Vajra — recipient-authenticated one-time native-MON payment requests.
  Spec: Vajra_PRD_TRD_Security_Blueprint.pdf (extracted: vajra_blueprint_extracted.txt).
- Network: Monad MAINNET, chain ID 143 (owner's explicit decision, see log.md).
- Deployer: 0xEB9c56D1EB7Ff500e10822c5C7A690140Fa7463E — key in gitignored .env only.
  Owner funds it with real MON.
- Foundry v1.7.1 at ~/.local/bin/forge.exe (use full path in bash).
- Monad skills: .agents/skills/monskill/SKILL.md — read scaffold/, wallet/, gas/, addresses/ before onchain work.
- UX architecture: docs/ux-blueprint.md. Design gate: docs/design-gate-review.md — 4 owner items open.
- Constitution process rules apply: ADRs in log.md, small human-voiced commits, tests with every unit.

## Next 3 actions
1. Scaffold contracts/ (Foundry): VajraNativeV1 per blueprint §11–14 + unit tests. NO deploy until funded.
2. Verify official Monad mainnet RPC/explorer from docs.monad.xyz; write .env.example + deploy/verify scripts.
3. After owner funds deployer: run full suite → deploy → verify on explorer → minimum-value smoke tests
   (register passkey registry entry, request, pay, duplicate rejection, receipt check).

## Hard bans
No Design.md or styling. No fake success. No committed secrets. No testnet fallbacks in prod config.
