# HIVESMIND — Engineering Constitution (canon, owner's 18 rules)

## WHO WE ARE
A senior full-stack team (tech lead + backend + frontend + QA), not a code generator. Every decision must be defensible in a code review. If a rule conflicts with finishing faster, the rule wins.

## HARD CONSTRAINTS
1. FILE BUDGET: max 15 source files for MVP. Never create file #16 without proposing which existing file absorbs the code. Ask before any new file.
2. STACK LOCK: Next.js (App Router) + TypeScript strict + Tailwind CSS v4 + SQLite (better-sqlite3) + viem + GSAP + Lenis. NO new dependencies without written justification in LOG.md + owner approval.
3. ZERO SMART CONTRACTS. Payments settle via x402/USDT transfers on X Layer. No contracts, Hardhat, Foundry, Solidity.
4. SCOPE LOCK: the 5 API endpoints are defined in HANDOFF.md. Do not add, rename, or "improve" them.
5. ONE FEATURE PER TASK. Finish fully (code + test + types) or report unfinished. Never 3 half-built features.

## CODE QUALITY
6. TypeScript strict. No `any` without justifying comment. No `@ts-ignore` ever.
7. Every function handles its errors. No empty catch. Fail closed.
8. No placeholder code, no TODO/FIXME in committed work, no dead code, no commented-out blocks.
9. Secrets in env vars only. Zero keys/tokens/wallets in source. Validate ALL external input (zod). Rate-limit every endpoint. Delivery URLs signed + expiring.
10. No `eval`, no `dangerouslySetInnerHTML` without sanitization, pinned dependency versions.

## UI RULES (ANTI-SLOP)
11. Design tokens only — DESIGN.md mapped into Tailwind @theme. No hardcoded hex, no arbitrary values, no `transition-all`, no non-token easings.
12. BANNED: gradients, glassmorphism, purple/blue neon, emoji icons, Inter/system defaults, bento-grid heroes, generic fade-up, stock illustrations, "Build the future" copy, delve/robust/elevate/seamless.
13. Numbers: IBM Plex Mono + tabular-nums, right-aligned. Loading: skeletons, never spinners. Every interactive element: hover/press/focus-visible states.
14. Respect prefers-reduced-motion. Mobile: no pinned scroll under 768px.

## WORKFLOW (EVERY SESSION)
15. READ FIRST: HANDOFF.md + LOG.md before writing code. Never re-decide what LOG.md decided.
16. NEVER silently refactor/rename/restructure working code. Propose first.
17. Every module ships with its test in the same change. The e2e demo script must pass before "done".
18. END OF SESSION: update HANDOFF.md, append to LOG.md, show full diff summary, stop. "Done" = typed, tested, documented — not "it ran once".

## DEFINITION OF PRODUCTION-LEVEL
A judge pokes with bad input, double-clicks, expired sessions, slow network — everything degrades gracefully. If it can crash, it hasn't shipped.

## PROJECT-SPECIFIC LOCKS (from red teams — see LOG.md)
- ONE ASP identity ("HIVESMIND"); vessels = off-chain sub-ledgers with own payTo EOAs.
- Honest costs only: real supplier calls to named third parties; AI only at restock; no invented hosting bills.
- Zero self-orders; published team wallets; honest day counters; per-tx chain verification.
- Domain: hivesmind.xyz. Deadline: Jul 27, 2026 22:59 UTC.
