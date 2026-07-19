# Color Theory and Palette Architecture

## Start with roles, not favorite colors

A production palette is not a list of attractive hex codes. It is a system of roles:

1. Neutral surfaces
2. Text and icon hierarchy
3. Brand signature
4. Interactive action
5. Semantic states
6. Data-visualization series
7. Focus and selection
8. Light, dark, and increased-contrast variants

Do not use the same color token for brand decoration, interactive actions, charts, and status. Reusing one accent for unrelated meanings creates ambiguity.

## Color hierarchy for VAJRA

### Neutral layer

Neutrals should carry most of the interface:

- page backgrounds,
- surfaces,
- borders,
- primary and secondary text,
- table structure,
- chart scaffolding.

This allows the meaningful colors to remain meaningful.

### Action layer

Use one stable action color for:

- primary buttons,
- selected navigation,
- interactive links,
- active controls,
- focused data selections.

Do not color noninteractive headings with the action color.

### Signature layer

Use a restrained VAJRA signature color for:

- brand moments,
- verified evidence markers,
- identity details,
- controlled highlights.

It must not compete with primary actions or warnings.

### Semantic layer

Reserve fixed roles:

- success,
- warning,
- danger,
- information,
- pending,
- disabled,
- stale/offline.

Semantic colors must include text, icon, shape, label, or pattern. Color alone is insufficient.

### Data layer

Charts need separate palettes:

- categorical,
- sequential,
- divergent,
- status overlays,
- uncertainty or confidence bands.

Do not automatically reuse semantic red/green in charts. In VAJRA, a rising line could mean higher cost, higher savings, higher latency, or higher quality; the meaning depends on the metric.

## Palette discipline

- Use a small number of dominant hues.
- Let neutral values establish most hierarchy.
- Use saturation to attract attention intentionally.
- Preserve color assignments across a workflow.
- Validate every light and dark pair separately.
- Provide increased-contrast variants.
- Test common color-vision deficiencies.
- Avoid putting essential text over gradients, imagery, blur, or variable video backgrounds.
- Avoid simplistic claims such as “blue always means trust” or “purple means innovation.” Color response depends on context, culture, surrounding colors, and product conventions.

## Light and dark mode

Dark mode is not a hexadecimal inversion.

Each appearance needs independent:

- surface elevation,
- text hierarchy,
- border strength,
- chart palette,
- focus visibility,
- status-background treatment,
- image and illustration treatment,
- shadow or elevation behavior.

In dark mode, avoid pure black over large surfaces and avoid large areas of maximum-saturation color.

## Composition ratios

Rules such as 60/30/10 can be used as rough composition prompts, not scientific laws.

For VAJRA, a better operational target is:

- 80–90% neutral structure,
- 5–12% action and selection,
- 2–6% semantic status,
- less than 3% signature emphasis on dense product screens.

Marketing pages may use the signature color more expressively, but product UI must preserve status clarity.
