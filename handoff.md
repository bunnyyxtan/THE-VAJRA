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
1. Phase 1 DONE: contract live on mainnet, verified, smoke-tested (see log.md).
2. Verify official Monad mainnet RPC/explorer from docs.monad.xyz; write .env.example + deploy/verify scripts.
3. After owner funds deployer: run full suite → deploy → verify on explorer → minimum-value smoke tests
   (register passkey registry entry, request, pay, duplicate rejection, receipt check).

## Hard bans
No Design.md or styling. No fake success. No committed secrets. No testnet fallbacks in prod config.

## Mainnet facts
Contract: 0x7d17f2765bb58ceb27b9e1e52b068c72ccb8299f · chain 143 · verified on Sourcify/Monadscan.

## Design system installed (2026-07-19, Wave 1)
- DESIGN.md at repo root: formal design system derived from owner-approved
  docs/design-direction-v1.md (tokens, type, motion, grammars, proof chain, a11y). Binding for
  all frontend work; tokens change only with a log.md entry.
- docs/inspiration-synthesis.md: craft observations from design galleries (lapa.ninja was
  unreachable; refero.design is JS-rendered — both noted).
- Agent skills installed in .agents/skills/ (cloned shallow, .git removed — same pattern as
  monskill): canvas-design, frontend-design (anthropics/skills); impeccable (pbakaus — single
  skill; critique/distill/quieter are reference docs inside it, not separate skills);
  extract-design-system; oklch-skill; userinterface-wiki; make-interfaces-feel-better;
  emilkowalski set (animation-vocabulary, apple-design, emil-design-eng,
  find-animation-opportunities, improve-animations, review-animations); grill-me (mattpocock);
  vercel-react-best-practices + vercel-composition-patterns (vercel-labs/agent-skills).
  wshobson/agents skipped: huge multi-harness plugin marketplace, not design-relevant.
## Next 3 actions (updated)
1. Phase 2: functional Next.js skeleton (semantic, unstyled) wired to the mainnet contract.
2. E2E demo script: the 90-second judge flow as an executable test (test gate = demo gate).
3. Adversarial review loop on VajraNativeV1.sol before any larger amounts move.
