# Typography System

Typography carries most of VAJRA’s hierarchy. It should feel engineered and authoritative, not editorial, playful, or futuristic.

## Typeface strategy

### Native apps

Prefer platform-native text styles and scaling behavior:

- Apple system typography with Dynamic Type
- Android system typography and scalable `sp` units

Brand expression can appear in selected headings or marketing surfaces, but operational text should remain native, legible, and adaptable.

### Web and desktop

Select one primary interface family with:

- excellent small-size readability,
- tabular numerals,
- a true italic,
- variable weights,
- broad language support,
- clear distinction between similar characters,
- stable metrics,
- appropriate licensing.

Use one monospace family only for identifiers, code, model names, hashes, and aligned technical values.

Do not use monospace for ordinary descriptions or navigation.

## Suggested prototype route

A license-safe starting route:

- Interface: IBM Plex Sans or Source Sans 3
- Technical identifiers: IBM Plex Mono

A final agency brand phase may select a licensed grotesk, but the interface must not depend on an unavailable font file.

## Type roles

- Display: rare, marketing or major empty-state moments
- Page title
- Section title
- Component title
- Body
- Compact body
- Label
- Caption
- Data metric
- Technical identifier

Use tokens, never arbitrary page-level sizes.

## Recommended web scale

| Role | Size | Line height | Weight |
|---|---:|---:|---:|
| Display | 44–56px | 1.02–1.10 | 600–700 |
| Page title | 28–36px | 1.15–1.22 | 600–700 |
| Section title | 20–24px | 1.25–1.35 | 600 |
| Component title | 16–18px | 1.35–1.45 | 600 |
| Body | 15–16px | 1.45–1.60 | 400 |
| Compact body | 13–14px | 1.40–1.55 | 400–500 |
| Label | 12–14px | 1.25–1.40 | 500–600 |
| Caption | 11–12px | 1.35–1.50 | 400–500 |
| Metric | 24–40px | 1.00–1.15 | 550–650 |

These are starting ranges. Native platforms must follow platform scaling and accessibility behavior.

## Rules

- Use no more than two font families in product UI.
- Avoid thin weights.
- Use sentence case for headings and actions.
- Keep labels short but never cryptic.
- Use tabular numerals in tables, timelines, costs, latency, percentages, and changing counters.
- Align decimals when comparison matters.
- Preserve units and time windows.
- Do not use color alone for typographic hierarchy.
- Do not use all caps for paragraphs or routine labels.
- Do not shrink text to fit an overcrowded component; fix the layout.
- Test long provider names, large currency values, localized dates, and 200% text zoom.
