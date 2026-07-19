# Dashboard Architecture

A dashboard is not a collage of numbers. It is a structured interface for monitoring, interpreting, deciding, or exploring.

## Four dashboard modes

### 1. Monitoring dashboard

Answers:

- Is the system healthy?
- What changed?
- What requires attention?
- Is data current?

Use for VAJRA Overview.

### 2. Decision dashboard

Answers:

- What action is proposed?
- Why?
- What is the evidence?
- What are the risks and consequences?
- Can it be reversed?

Use for approvals and route changes.

### 3. Analytical dashboard

Answers:

- Why did this happen?
- How do providers, models, periods, or workloads compare?
- Which variables explain the result?

Use for evaluations, cost, quality, and incident investigation.

### 4. Configuration workspace

Answers:

- What policy or threshold is being changed?
- Who or what will it affect?
- Is the configuration valid?
- What happens after saving?

Use for policies and provider settings.

Do not combine all four modes into one overloaded page.

## VAJRA Overview format

Recommended first viewport:

1. Workspace and time scope
2. Data freshness and system state
3. One sentence operational summary
4. Critical alerts or pending decisions
5. Four to six primary metrics only
6. Primary trend or route-performance view
7. Recent consequential activity

Secondary metrics belong below the first viewport, behind drill-down, or in a dedicated analytical view.

## Metric anatomy

Every KPI must include:

- clear label,
- current value,
- unit,
- time window,
- comparison baseline,
- direction,
- meaning of good/bad,
- freshness,
- drill-down destination.

Avoid unexplained “+18%” badges.

## Card rules

Use a card only when the content:

- is a self-contained object,
- needs a boundary for interaction,
- has an independent state,
- can be rearranged or selected,
- represents a distinct decision or record.

Do not wrap page titles, every paragraph, chart, and table in separate rounded cards.

## Filters

- Place global filters where their scope is clear.
- Show active filters persistently.
- Provide reset.
- Preserve filters across related views when useful.
- Avoid hidden filter state.
- Show empty-result explanations.
- On mobile, use a focused filter sheet with an applied-filter count.

## Freshness and trust

Operational dashboards must display:

- last updated time,
- live/stale/offline state,
- partial-data warnings,
- source or scope when ambiguous,
- changes made by automation versus humans.

A beautiful dashboard using stale data is dangerous.
