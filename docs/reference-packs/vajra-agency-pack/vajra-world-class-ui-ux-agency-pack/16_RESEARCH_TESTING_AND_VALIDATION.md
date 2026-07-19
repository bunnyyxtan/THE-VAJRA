# Research, Testing, and Validation

## Research questions

- Can users explain what VAJRA is doing?
- Can they distinguish monitoring, proposal, approval, applied change, and rollback?
- What evidence do they need before approval?
- Can they identify stale or partial data?
- Can they recover from a failed action?
- Do they understand savings versus projected savings?
- Can they compare quality and cost without misreading the chart?
- Can they use the phone experience during an urgent interruption?
- Can they continue the investigation on desktop?

## Test rounds

### Round 1 — Structure

Low-fidelity flows:

- navigation,
- terminology,
- hierarchy,
- decision anatomy.

### Round 2 — Visual and interactive prototype

Test:

- palette and hierarchy,
- data comprehension,
- chart reading,
- mobile/desktop adaptation,
- motion,
- accessibility assumptions.

### Round 3 — Production implementation

Test:

- actual latency,
- real data extremes,
- permissions,
- failure recovery,
- background/resume,
- keyboard and assistive technology,
- device matrix,
- performance.

## Critical scenarios

- provider failure during route evaluation,
- quality evidence is inconclusive,
- projected savings are high but confidence is low,
- two operators act on the same proposal,
- data becomes stale,
- approval is interrupted,
- automatic change is applied and must be reverted,
- user lacks permission,
- one data source is unavailable,
- mobile device is offline,
- screen reader user reviews and approves a proposal.

## Evidence over preference

Do not approve a design because stakeholders say it “looks premium.” Observe task success, errors, comprehension, time, confidence, and recovery behavior.
