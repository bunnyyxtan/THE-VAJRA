# Performance and Perceived Speed

A world-class interface must remain fast with real data and real devices.

## Principles

- Keep first loads small.
- Load the critical visible path first.
- Ship less JavaScript.
- Lazy-load noncritical media and heavy views.
- Do not block the main thread.
- Reserve layout space.
- Optimize images, charts, fonts, and video.
- Audit third-party scripts.
- Cache versioned static assets.
- Preserve visible content during background refresh.
- Prefer meaningful skeletons over blank spinners.
- Avoid skeletons that do not match final geometry.
- Report stale data rather than pretending it is live.

## VAJRA performance risks

- large audit tables,
- high-frequency metric updates,
- complex charts,
- heavy provider comparison,
- long incident timelines,
- wallet or authentication SDKs,
- analytics and monitoring scripts,
- desktop-to-mobile code sharing that ships unused code.

## Release measurements

Web/desktop:

- route-load cost,
- bundle size,
- Core Web Vitals,
- long tasks,
- chart render time,
- search/filter latency,
- memory growth.

Native:

- cold/warm/hot startup,
- slow and frozen frames,
- UI-thread blocking,
- ANRs,
- memory,
- battery,
- network payload,
- background work,
- crash rate.
