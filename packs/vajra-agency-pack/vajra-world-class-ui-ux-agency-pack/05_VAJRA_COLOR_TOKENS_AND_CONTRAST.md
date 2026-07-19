# Proposed VAJRA Color Direction

## Direction name

**Tempered Intelligence**

A mineral-neutral system with restrained cobalt action and burnished-metal signature accents. It should feel precise, durable, technical, and calm rather than neon, futuristic, or decorative.

This is a recommended starting point for prototyping and testing.

## Light appearance

| Role | Value |
|---|---|
| Background | `#F5F6F7` |
| Surface | `#FFFFFF` |
| Subtle surface | `#EEF1F4` |
| Strong surface | `#E3E8ED` |
| Border | `#D5DBE1` |
| Strong border | `#AAB4BE` |
| Primary text | `#111418` |
| Secondary text | `#4B5661` |
| Muted text | `#66737F` |
| Action | `#3156D8` |
| Action hover | `#2748BC` |
| VAJRA signature | `#8B6418` |
| Success | `#137A45` |
| Warning | `#8A5700` |
| Danger | `#B4232B` |
| Information | `#0B63A9` |
| Focus | `#244FD3` |

## Dark appearance

| Role | Value |
|---|---|
| Background | `#0B0D10` |
| Surface | `#11151A` |
| Subtle surface | `#171C22` |
| Strong surface | `#20262D` |
| Border | `#303944` |
| Strong border | `#4A5663` |
| Primary text | `#F4F7FA` |
| Secondary text | `#B2BDC8` |
| Muted text | `#8793A0` |
| Action | `#9DB2FF` |
| Action hover | `#B5C5FF` |
| VAJRA signature | `#D7AA4F` |
| Success | `#52D18A` |
| Warning | `#F1BD5B` |
| Danger | `#FF7474` |
| Information | `#63B8FF` |
| Focus | `#B6CCFF` |

## Contrast checks

These ratios were calculated with the WCAG relative-luminance formula. Actual component contrast must still be tested in context, including borders, icons, focus indicators, transparency, hover states, gradients, and overlapping content.

| Pair | Foreground | Background | Ratio |
|---|---:|---:|---:|
| Light primary text / background | `#111418` | `#F5F6F7` | **17.07:1** |
| Light secondary text / surface | `#4B5661` | `#FFFFFF` | **7.49:1** |
| Light muted text / surface | `#66737F` | `#FFFFFF` | **4.86:1** |
| White / light action | `#FFFFFF` | `#3156D8` | **6.08:1** |
| White / light success | `#FFFFFF` | `#137A45` | **5.39:1** |
| White / light warning | `#FFFFFF` | `#8A5700` | **6.1:1** |
| White / light danger | `#FFFFFF` | `#B4232B` | **6.53:1** |
| White / light info | `#FFFFFF` | `#0B63A9` | **6.23:1** |
| Dark primary text / background | `#F4F7FA` | `#0B0D10` | **18.1:1** |
| Dark secondary text / background | `#B2BDC8` | `#0B0D10` | **10.2:1** |
| Dark muted text / background | `#8793A0` | `#0B0D10` | **6.22:1** |
| Dark background / dark action | `#0B0D10` | `#9DB2FF` | **9.49:1** |
| Dark background / signature | `#0B0D10` | `#D7AA4F` | **9.04:1** |
| Dark background / success | `#0B0D10` | `#52D18A` | **10.05:1** |
| Dark background / warning | `#0B0D10` | `#F1BD5B` | **11.28:1** |
| Dark background / danger | `#0B0D10` | `#FF7474` | **7.41:1** |
| Dark background / info | `#0B0D10` | `#63B8FF` | **9.11:1** |

## Usage constraints

- Cobalt is the action color, not a general decoration color.
- Burnished gold is the signature color, not a warning substitute.
- Green means verified healthy/successful only.
- Amber means attention or risk requiring review.
- Red means destructive, failed, or incident-level state.
- Blue information must not look like primary action unless interactive.
- Muted text is not suitable for tiny text or critical instructions.
- Status backgrounds should use low-chroma tints paired with strong text and icons.
- Charts use the separate chart palette in `09_DATA_VISUALIZATION_STANDARD.md`.

## Required validation

- WCAG 2.2 AA checks
- light, dark, and increased-contrast testing
- common color-vision-deficiency simulation
- projector and low-quality monitor testing
- outdoor/bright-light mobile testing
- real chart-density testing
- destructive-action recognition testing
