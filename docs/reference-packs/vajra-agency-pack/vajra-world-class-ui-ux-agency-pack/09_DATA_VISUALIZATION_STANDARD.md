# Data Visualization Standard

## Choose charts by the question

- Trend over time → line chart
- Compare categories → bar chart
- Distribution → histogram or box plot
- Part-to-whole with few categories → stacked bar; use pie/donut rarely
- Relationship → scatter plot
- Current value against threshold → bullet chart or direct labeled metric
- Flow or routing → purpose-built route diagram only when the topology matters
- Sequence of operational events → timeline
- Uncertainty → confidence band, interval, distribution, or explicit range

Do not select a chart because it looks visually interesting.

## VAJRA chart hierarchy

1. Direct labels and values
2. Common charts
3. Comparison and confidence
4. Interactive exploration
5. Complex topology only where necessary

## Chart anatomy

Every production chart needs:

- descriptive title,
- optional one-sentence takeaway,
- unit and time range,
- axis labels,
- readable ticks,
- legend only when necessary,
- source and freshness,
- interaction instructions when non-obvious,
- accessible text or table alternative,
- loading, empty, error, and partial states.

## Color palettes

### Categorical

Use distinct hues for unrelated groups. Maintain assignments across screens.

Suggested prototype series:

- `#3156D8`
- `#8B6418`
- `#0B7A75`
- `#7A4DB5`
- `#B44A73`
- `#4F6B3A`

Do not use more simultaneous series than people can reliably distinguish. Prefer filtering, small multiples, or direct labels.

### Sequential

Use one hue progressing in lightness for low-to-high values.

### Divergent

Use two directions around a meaningful midpoint such as zero, baseline, or policy threshold.

### Status overlays

Semantic status colors may annotate data but should not become the entire multi-series palette.

## Accessibility

- Never distinguish series using color alone.
- Combine color with line style, markers, direct labels, texture, or shape.
- Provide data tables or downloadable data for complex charts.
- Ensure meaningful lines, markers, and boundaries meet contrast requirements.
- Support keyboard access for interactive data points.
- Provide concise screen-reader summaries.
- Do not hide all exact values behind hover.

## Accuracy

- Start bar-chart axes at zero unless a clearly explained analytical exception exists.
- Do not use 3D charts.
- Do not distort proportions.
- Do not use dual axes unless the relationship is essential and unmistakable.
- Label percentages with their denominator or population.
- Show missing and partial data honestly.
- Expose uncertainty in quality judgments and projected savings.
- Never animate a value in a way that hides the actual final number.

## VAJRA-specific visualizations

Useful:

- current vs challenger comparison,
- cost-quality frontier,
- evaluation confidence distribution,
- policy-threshold view,
- cumulative verified savings,
- latency and failure trend,
- provider health timeline,
- decision and rollback timeline,
- route-switch audit trail.

Avoid decorative node maps when a table or comparison chart communicates the decision better.
