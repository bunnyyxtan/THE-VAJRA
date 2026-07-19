# VAJRA — Inspiration Synthesis v1

Purpose: distill transferable craft from curated design galleries into concrete guidance for
VAJRA's dark-premium financial instrument UI. Serves `DESIGN.md`; nothing here overrides the
owner-approved direction (`docs/design-direction-v1.md`). No copying — observations only.

## Source reachability (checked 2026-07-19)

| Source | Status | What was usable |
|---|---|---|
| brilliantdesign.work | Reachable | Gallery index + full taxonomy (color / design / technic / tone tags) |
| lapa.ninja | **Unreachable (HTTP 403, both www and apex)** | — |
| refero.design | Partially reachable | Page shell only; content is JS-rendered, no crawlable entries |
| godly.website | Reachable | Curated index (Linear, Stripe Sessions, Evervault, Wise, Fey, Railway, Pipe, Resend, Phantom, Skiff, Amie, Notion AI…) |
| footer.design | Reachable | Footer gallery + style taxonomy (Typographic, Small Type, Grid, Flat, Dark, Large Type…) |
| navbar.gallery | Reachable | Navbar taxonomy (Static, Dropdown, Mega Menu, Sidebar, Search, Announcement, Full Screen, Breadcrumbs) |

Observations below synthesize (a) the galleries' own curation taxonomies and (b) the documented,
widely-referenced public patterns of the fintech/product sites these galleries feature
(godly.website's index is heavy with exactly the product class VAJRA belongs to: Linear, Stripe,
Evervault, Wise, Fey, Railway, Pipe, Resend). Where an observation rests on a specific featured
product's well-known public pattern it is attributed; gallery-level patterns are attributed to
the gallery. Nothing is copied; these are craft principles, not assets.

## Observations

### 1. Dark premium UIs earn depth with luminance steps, not decoration
godly.website's featured dark products (Linear, Railway, Pipe, Fey) consistently build hierarchy
from 3–4 close luminance steps — background / surface / raised / selected — separated by 1px
hairlines, with essentially no drop shadows on resting elements. Depth is tonal, not shadowed.
**VAJRA application:** this validates the direction's `#0B0912 → #120E19 → #17121F → #21182B`
ladder and "ruled separation BEFORE cards" law. Do not add a fifth step; do not add shadows to
resting ledger rows.

### 2. One accent, spent once per viewport
Across the gallery indexes, the products that read "premium instrument" rather than "SaaS
template" share a discipline: a single accent hue appears exactly once per screen region — on
the primary action or the active nav marker, never both, never on links AND buttons AND icons
simultaneously. **VAJRA application:** this is the direction's violet law confirmed from the
field. Code-review heuristic: count `--vajra-action` usages per viewport; >1 meaningful use is a
defect.

### 3. Numbers are the hero typeface in finance UIs
The fintech entries in godly's index (Wise, Fey, Evervault, Pipe) treat the amount as the
largest, calmest element on screen — oversized tabular numerals, small quiet currency suffix,
no animation on the value itself. The number's stillness is what makes it feel authoritative;
everything around it may move, the amount doesn't. **VAJRA application:** supports the
`amount-hero` 44–72px scale and the explicit bans on slot-machine / count-up-from-zero. The MON
suffix at 0.5em in secondary color matches this pattern.

### 4. Monospace is reserved for verifiable truth
Featured dev-tool and security products (Evervault, Resend, Vercel-adjacent entries) use a mono
face exclusively for things a user could verify elsewhere: hashes, IDs, keys, timestamps. Mono
never appears in prose or headings — its scarcity signals "this string is exact."
**VAJRA application:** IBM Plex Mono only for addresses, hashes, request IDs, signatures, chain
IDs (DESIGN.md §4.1). The pairing of mono + the copy-to-clipboard micro-interaction (icon morph
→ "Copied") is the expected affordance on these elements.

### 5. Receipts and documents use ruled tables, not cards
footer.design's "Typographic / Small Type / Grid / Flat" categories — and the invoice/receipt
patterns of featured finance products — converge on the same anatomy: full-width hairline rules,
left labels in a quiet color, right-aligned tabular values, generous row height, zero card
chrome. The document reads as one composed block. **VAJRA application:** this is the Ledger
grammar exactly (DESIGN.md §7.2) and the direction's "ledger rows as one composed block" for
Create Request review. Receipt = ruled document with a seal, not a card stack.

### 6. Navigation earns trust by being boring
navbar.gallery's taxonomy shows the pattern classes, and the featured premium products
overwhelmingly choose the plainest one: a static/sticky bar with 3–5 items, one active-state
marker, no mega menus, no full-screen menus inside the product. Announcement bars are used
sparingly for exactly one persistent message. **VAJRA application:** desktop = persistent quiet
nav with a single active marker; the direction's banner rule ("one compact persistent banner")
maps onto the announcement-bar pattern — network mismatch or stale data, nothing else.

### 7. Restraint is the differentiator, and galleries reward it
brilliantdesign.work's taxonomy includes tags for "trust / solid" (信頼・堅牢), "luxury"
(ラグジュアリー), and "simple / minimal" — and its finance-category (金融・証券) entries cluster
under those, not under "immersive / WebGL / scroll-jack." The technic tags that dominate
award-winning marketing sites (WebGL, parallax, mouse stalkers) are precisely absent from the
financially-trustworthy ones. **VAJRA application:** confirms the direction's "never
cyberpunk/overanimated" list. For the hackathon demo, the seal moment is the ONE place a
cinematic beat is allowed — everywhere else, boring is the brand.

### 8. Micro-interactions carry the "premium" feel, not macro motion
The recurring technic tag on the trustworthy featured sites is "microinteraction" — press
states, hover reveals, focus rings, tiny icon transitions — while macro motion (page
transitions, scroll animation) is subdued or absent. Premium is felt in the 90–200ms band, not
in 600ms choreography. **VAJRA application:** the motion token ladder (90/140/200/260/300/420)
is already weighted correctly; invest polish in press/copy/focus/hover before any route
transition work. Exits fast, entries soft.

### 9. Status is a sentence, not a color
Featured finance products pair every status color with an icon + a verb phrase + a timestamp
("Settled · 14:02:11", "Confirming on Monad"). Color-only dots read as decoration and fail
trust (and accessibility). **VAJRA application:** codified as the semantic law in DESIGN.md
§3.4.3; the Activity screen's "icon + label + timestamp" live status row is the canonical
implementation. Semantic tint surfaces stay at ~8–10% alpha — status rows should whisper.

### 10. Footers of serious products are documents, not marketing
footer.design's "Small Type / Flat / Dark" winners share a pattern: dense, quiet, grid-aligned
columns of small-type links and legal/metadata lines — a ledger, visually. **VAJRA
application:** the app's footer/edge metadata (contract address, chain ID, verification links)
should follow Ledger grammar: mono identifiers, metadata-size type, hairline rule above — the
app's "audit trail" extends to its edges.

### 11. Empty and loading states in finance UIs keep geometry
Across featured products, loading never collapses layout: skeletons hold final row heights and
column positions, and refreshing content stays visible with a stale label rather than blanking.
**VAJRA application:** matches the direction's skeleton law; the craft detail worth copying is
that premium skeletons use the surface-raised color (not a shimmer sweep) and pulse opacity
slowly — shimmer disabled under reduced motion in any case.

### 12. Mobile finance UIs are instruments, not brochures
The strongest mobile entries in the galleries reduce to: current state, one number, one action,
progress. Secondary evidence collapses into compact rows or sheets instead of squeezing the
desktop grid. **VAJRA application:** this is the direction's phone adaptation (state / amount /
primary action / proof progress / critical terms). The proof chain's "compact vertical rail,
current stage + next action always visible" is the pattern's sharpest form — do not ship seven
tiny circles.

## What we deliberately did NOT take

- WebGL/immersive hero techniques dominating brilliantdesign.work's Curators' Choice — wrong
  product class (marketing, not instrument).
- Full-screen menus, mega menus, mouse followers, scroll-jacking from navbar.gallery's taxonomy —
  navigation must be boring (§6).
- Animated/illustrative footers — VAJRA's edges are documents (§10).
- Any specific layout, asset, copy, or artwork — synthesis only, no reproduction.
