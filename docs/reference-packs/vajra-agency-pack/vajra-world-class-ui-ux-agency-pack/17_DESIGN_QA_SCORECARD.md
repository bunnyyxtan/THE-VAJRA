# VAJRA Design QA Scorecard

A release must score at least 90/100 and must pass every critical gate.

## Product comprehension — 15

- Purpose is clear
- Current system state is clear
- Proposed actions are clear
- Automation is visible
- Terminology is consistent

## Decision safety — 15

- Evidence shown
- Uncertainty shown
- Consequences shown
- Policy checks shown
- Rollback shown
- Duplicate actions prevented

## Visual hierarchy — 10

- Clear first focus
- One primary action per region
- Grid alignment
- Consistent spacing
- No competing accents

## Originality and brand — 10

- Recognizably VAJRA
- Domain-native motifs
- No template appearance
- No generic AI visual clichés
- Visual decisions have rationale

## Dashboard and data — 15

- Correct chart choice
- Clear units and timeframes
- Freshness visible
- Accurate axes
- Accessible alternatives
- Limited primary metrics
- Useful drill-down

## Cross-platform — 10

- Native navigation
- Mobile task prioritization
- Tablet adaptation
- Desktop density
- State continuity

## Accessibility — 15

- Contrast
- Keyboard
- Focus
- Screen reader
- text scaling
- target sizes
- reduced motion
- non-color status

## Performance — 5

- Fast first useful content
- No major layout shift
- Responsive input
- controlled charts/scripts

## Engineering consistency — 5

- Tokens
- shared components
- complete states
- build/lint/test
- no dead redesign code

## Critical automatic failures

Regardless of score, reject when:

- a high-risk action lacks consequence or rollback information,
- stale data looks current,
- real workflows were replaced by mock UI,
- mobile is just a compressed desktop,
- color is the only status signal,
- keyboard or screen-reader use is blocked,
- duplicate approval can occur,
- the design visibly resembles generic AI dashboard output,
- the production build or critical flow fails.
