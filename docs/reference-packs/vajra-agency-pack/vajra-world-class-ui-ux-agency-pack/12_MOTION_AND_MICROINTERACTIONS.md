# Motion and Microinteractions

Motion must explain relationships, state, or consequence.

## Approved purposes

- confirm direct manipulation,
- preserve spatial context,
- reveal hierarchy,
- show an item moving between states,
- indicate progress,
- draw attention to a meaningful change,
- communicate success, warning, or failure.

## Prohibited purposes

- making every scroll feel cinematic,
- showing design-tool skill,
- delaying interaction,
- decorating an otherwise static dashboard,
- making routine cards float or bounce,
- hiding loading or data latency,
- creating continuous background distraction.

## Starting motion tokens

- Instant feedback: 80–120ms
- Hover/press: 120–160ms
- Small state transition: 160–220ms
- Panel/sheet transition: 220–320ms
- Page/context transition: 240–400ms

Use these as starting ranges, not universal laws.

## Behavior

- Prefer opacity and transform over layout-changing animation.
- Keep motion interruptible.
- Avoid animating large areas during high-focus tasks.
- Respect reduced-motion preferences.
- Avoid shimmer when reduced motion is active.
- Prevent layout shift.
- Haptics are reserved for meaningful native confirmations or warnings.
- Do not animate live metrics continuously; update calmly and mark freshness.
