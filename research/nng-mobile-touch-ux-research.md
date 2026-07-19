# Vajra UX Research: NN/g Mobile & Touch UX Findings
Research brief — touch targets, thumb zones, mobile navigation, one-handed use, mobile-vs-desktop layout, QR/cross-device handoff. Prepared for the Vajra payment-request app on Monad.

---

## 1. CORE THEORY

### 1.1 Touch target size (NN/g)
- **Principle**: Interactive elements must be at least **1cm × 1cm (0.4in × 0.4in)** in *physical, rendered* size to support adequate selection time and prevent "fat-finger" errors. NN/g (Aurora Harley, "Touch Targets on Touchscreens", May 5, 2019).
- **Underlying theory**: Fitts' law — time to acquire a target depends on distance and size; smaller targets require more precision and take longer.
- **Original studies cited by NN/g**:
  - Parhi, Karlson & Bederson (2006), "Target size study for one-handed thumb use on small touchscreen devices", MobileHCI '06 — basis for the 1cm minimum.
  - MIT Touch Lab (Dandekar, Raju, Srinivasan, 2003, *Journal of Biomechanical Engineering*): average fingertip width **1.6–2cm (0.6–0.8in)**; average thumb impact area **2.5cm (1 inch)** wide.
- Key concept — **view–tap asymmetry**: elements large enough to *see* but too small to *tap* reliably (a desktop-port artifact). From early NN/g iPad studies.
- Key concept — "Fat fingers are not the real culprit; the blame should lie on the tiny targets."
- Source: https://www.nngroup.com/articles/touch-target-size/

### 1.2 Thumb zones & one-handed use (Steven Hoober, UXmatters — NOT an NN/g study)
- **Important attribution note**: The famous thumb-zone research is Steven Hoober's, published in UXmatters ("How Do Users Really Hold Mobile Devices?", Feb 18, 2013), not NN/g. NN/g cites adjacent research (Parhi et al.) for one-handed thumb use. Do not attribute the 49% figure to NN/g.
- **Study details**: 1,333 observations of people using mobile devices "on the street, in airports, at bus stops, in cafes, on trains" over two months ending Jan 8, 2013; 780 of them were touching the screen. Observational, no demographics, no task recording.
- **Findings** (of users touching the screen): **49% one-handed**, **36% cradled** (two hands hold, one touches), **15% two-handed**. One-handed: 67% right thumb / 33% left thumb. Cradling: 72% used a thumb, 28% a finger. Two-handed: 90% portrait.
- Critical nuance (Hoober's own caution): **users switch grips constantly** — "sometimes every few seconds" — in relation to task switching. He explicitly warns *against* designing one-handed-only layouts or banishing dangerous functions to the upper-left corner, because users re-grip to reach whatever they need.
- Thumb-zone map (green easy / yellow stretch / red requires grip change) is a model, not a template; validate with real-device testing.
- Source: https://www.uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php

### 1.3 Mobile navigation conventions (NN/g quantitative study)
- **Study**: NN/g partnered with WhatUsersDo; **179 participants**, tasks on **6 live websites** (BBC, Bloomberg Business, Business Insider UK, Slate, 7digital, Supermarket HQ), on smartphones and desktops, 2016. Compared hidden vs visible vs combo navigation with 5 metrics (navigation use, time-to-navigation, task difficulty, content discoverability, task time).
- **Headline findings**:
  - Hidden navigation used **27%** of the time on desktop vs 48–50% for visible/combo (≈half). On mobile: hidden 57% vs combo 86% (1.5× more).
  - Hidden navigation used **later** in the task (desktop: 5–7s slower; mobile: ~2s slower; marginally significant, p<0.1).
  - **Content discoverability dropped >20%** with hidden navigation, both platforms.
  - Task-difficulty ratings: **21% higher** vs visible, 11% vs combo.
  - Navigation used **more on mobile than desktop** overall (63% vs ~; navigation-required tasks: 77% mobile vs 54% desktop) — attributed to desktop UIs being degraded ports of mobile designs.
- Sources: https://www.nngroup.com/articles/hamburger-menus/ ; https://www.nngroup.com/articles/mobile-first-not-mobile-only/ ; https://www.nngroup.com/articles/mobile-navigation-patterns/ ; https://www.nngroup.com/articles/find-navigation-mobile-even-hamburger/

### 1.4 Mobile vs desktop layout expectations (NN/g)
- Core tenet: **prioritize content over chrome** on mobile; screen space and attention are scarcer on mobile.
- **Interaction cost** is higher on mobile (more scrolling, less above the fold, slower loads, harder typing) — users resort to menus/links more readily.
- **Mobile-first ≠ mobile-only**: porting mobile patterns (hamburger, search-icon-only, top-right nav, bottom-repeated nav, oversized imagery) to desktop degrades desktop UX; each platform needs its own optimization ("multiplatform design strategy").
- Content should be **layered**: prioritize the gist, defer details to secondary pages; deep desktop IA must be compressed to ~2-level navigation on mobile; avoid arbitrarily cutting content/feature parity where users expect answers to be the same across devices.
- Mobile usability history: Nielsen (2009) called mobile usability "an oxymoron"; 2016 update (Budiu) found decent usability is now common.
- *Unverified*: the frequently quoted "59% success on mobile vs 80% on desktop" figure from Nielsen's 2011 mobile studies could not be confirmed against an nngroup.com page in this research pass; treat as unverified until checked against the Mobile Usability report.
- Sources: https://www.nngroup.com/articles/mobile-site-vs-full-site/ ; https://www.nngroup.com/articles/mobile-usability-update/

### 1.5 Response times & system status (Nielsen) — directly relevant to "watch chain finality"
- **0.1s** = feels instantaneous, no feedback needed. **1.0s** = flow of thought stays uninterrupted. **10s** = limit of keeping user attention; beyond that, give feedback indicating expected completion.
- Percent-done indicators recommended for operations >10s; they reassure the system hasn't crashed, set time expectations, and make waiting less painful. For unknown-duration work, provide running feedback of work done; last resort is an indeterminate spinner (but *always* show something).
- For delays >10s, give a clearly signposted way to interrupt; assume users must reorient when they return.
- Heuristic #1 (Visibility of system status, 1994) underpins this: keep users informed about what is going on through appropriate, timely feedback.
- Source: https://www.nngroup.com/articles/response-times-3-important-limits/

### 1.6 QR codes & cross-device handoff (NN/g China research)
- NN/g diary study of WeChat users in China (published Oct 16, 2016; WeChat had ~700M users Apr 2016). QR codes mediate online↔offline, payments, and multi-device communication.
- Payments: ~a third of diary-study WeChat activities were payments; more than half of those to offline businesses, mostly QR-driven.
- Cross-device handoff: QR-based login (scan phone→desktop, also seen at Dropbox) — "QR codes support cross-device handoff better than links — for example, if code is presented on a tablet or desktop screen, it can be scanned on a phone and the interaction can be continued on that device."
- Key usability finding: **QR codes have no information scent** — they need adjacent text explaining what they do. Also, QR inside a chat stream required tap-to-open-then-long-press in WeChat; participants failed trying to long-press in the thread view (implementation friction matters).
- Cross-channel guidance (WeChat mini-programs study, 2018): simplify channel switching; **deliver some value/content before asking users to switch channels** — a channel switch has high perceived cost and users abandon if asked "too much too soon".
- Sources: https://www.nngroup.com/articles/wechat-qr-shake/ ; https://www.nngroup.com/articles/wechat-mini-programs/

---

## 2. NN/g's SPECIFIC GUIDELINES (granular)

### Touch targets
1. Minimum 1cm × 1cm (0.4in × 0.4in) physical rendered size; specify in physical units, not px (density varies).
2. Spacing matters as much as size: "To avoid accidental taps, targets must first be big enough, and then also

3. 2mm is a commonly cited *minimum* gap between targets, but small targets + 2mm still fail (Instagram example: 2mm-wide dismiss buttons next to Follow buttons).
4. Primary CTAs and controls used *while moving* (walking, in-store, transit) should exceed the minimum — NN/g's example: Target app's search/scan buttons ≈2cm × 2cm.
5. Audience adjustments: children ≥2cm × 2cm; seniors and motor-impaired users benefit from larger, more forgiving targets.
6. Avoid view–tap asymmetry: if it's visible and looks actionable, it must be tappable at full size (carousel dots, tiny color swatches are anti-patterns).
7. Make labels and a perimeter tappable for checkboxes (target ≥1cm × 1cm); don't make users hit a tiny box.
8. Prefer horizontal over vertical steppers on mobile; separate +/- buttons to prevent slips.

### Mobile navigation
1. If ≤4 top-level options, show them as visible links; >4, hiding some is acceptable on mobile (the penalty is real but smaller than on desktop).
2. Prefer combo navigation (some exposed + rest collapsed) — combo was used 86% vs 57% hidden on mobile.
3. Give navigation a larger screen footprint; consider sticky navigation for persistent access.
4. If you must use a hamburger/menu: make it visually salient, visually distinct from the logo, make it look tappable, and **label it "Menu"** (research cited by NN/g: labeled + bordered menus get used more).
5. Tab bars: ≤5 options, icons **labeled with text**, persistent; iOS convention = bottom, Android historically = top (note: Material 3 now favors bottom navigation bars; platform conventions evolve).
6. Support navigation tasks without the menu: design pages so key tasks can be done via in-page links even if the user never opens navigation ("imagine a user who never finds the menu").
7. Task-oriented apps (one task per session) can use a homepage-as-navigation-hub pattern.
8. Never hide navigation on desktop.

### Layout / forms / mobile-desktop parity
1. Content over chrome; layer content (gist first, details deferred); compress deep IA to ~2 levels on mobile.
2. Don't arbitrarily cut content/features on mobile — answers should be the same across devices; defer secondary info to secondary pages.
3. Forms: single-column layout; labels directly above fields on mobile; logical sequencing; avoid dropdowns for long lists on iOS (use in-situ or separate page); avoid overlays (separation confusion, accidental background taps, truncation bugs); ensure modals/menus are scrollable and fully visible on all screen sizes.
4. Fix superlong mobile pages with mini-IA (page-local table of contents), accordions, sticky nav, back-to-top.
5. Optimize each platform independently; don't port mobile patterns to desktop.

### Feedback / status
1. <0.1s: just show the result. 0.1–1s: no special feedback needed. >1s: indicate the system is working. >10s: percent-done indicator + interrupt affordance; expect user reorientation.
2. For unknown-duration operations, show running progress (what has been done) — never a silent screen.

### QR / cross-device
1. Always add information scent next to a QR code (what it is, what happens when scanned).
2. Use QR for genuine cross-device handoff (desktop→phone continuation); on the same device, prefer a tappable link over a QR image.
3. Deliver value before requesting a channel switch; make channel switching cheap.

---

## 3. APPLICATION TO VAJRA

Context: sender's payment page is typically opened from a chat app on a phone — cold entry, likely one-handed, possibly in motion, zero prior context, money at stake. Hard constraints honored below: no fake success (success requires onchain proof), money actions fail closed, passkey never described as "verified identity".

1. **Bottom-anchored, oversized primary action on the sender payment page.** Put the single primary CTA ("Pay X MON") as a sticky bottom bar, ≥1cm tall (ideally 1.5–2cm per NN/g's "bigger is better" guidance for primary CTAs and in-motion use), spanning near-full width. Rationale: NN/g 1cm minimum + context-of-use guidance (users arriving from chat are often walking/one-handed); Hoober: ~85% of screen-touching users hold the phone one-handed or cradled. All secondary actions (cancel, report, details) go elsewhere — never adjacent to Pay.

2. **Verification content above, money actions below — with a hard visual gap.** The terms-verification block (amount, recipient, memo, expiry) is read-mostly content and belongs in the upper/middle scroll area; the Pay CTA sits at the bottom thumb zone. Keep ≥0.4cm (not just 2mm) separation between the Pay button and any adjacent interactive element (wallet selector, copy-address) so a slip can't trigger an adjacent action — NN/g's crowding-causes-errors finding. For a money action, treat the "Instagram dismiss/Follow" anti-pattern as a forbidden layout: no small destructive or state-changing targets next to Pay.

3. **Finality tracker must be honest, staged feedback — not a spinner-to-checkmark.** Nielsen's 0.1/1/10s rules + visibility-of-system-status map directly onto broadcast → included → final: show a stepwise progress indicator with explicit stage labels and elapsed time, because chain confirmation will exceed 1s and can exceed 10s. Beyond 10s, NN/g requires feedback about expected completion and a way to leave/interrupt — so: "You can safely leave; this link/receipt updates on its own." Never advance a stage or show success styling until the corresponding onchain condition is actually observed (fail closed + no fake success). If a stage stalls or the tx drops, the UI must say so explicitly and keep state recoverable — silent or fake progress violates both NN/g feedback rules and the no-fake-success constraint.

4. **Cold-open design: the sender page must work without navigation.** NN/g's advice — "imagine a user who never finds or uses the primary navigation" — is the *default* case for a link opened from chat. Everything needed (who's asking, amount, expiry, safety cues, pay) must be on the landing view; global nav is secondary. This also satisfies the hamburger-study finding that hidden navigation roughly halves discoverability: don't hide anything decision-critical behind a menu on the payment page.

5. **QR code is for cross-device handoff only; link-first on the same device.** When the recipient displays the request QR (e.g., on desktop or another phone), always pair it with information scent: "Scan with your phone to pay 25 MON to <name>" — NN/g: QR codes have no inherent information scent. On the recipient's own phone, lead with a shareable tappable link (chat apps are the dominant vector); QR is the in-person/second-screen path. Support the WeChat pattern of scanning from within chat gracefully.

6. **Passkey registration ceremony: oversized targets, layered explanation, truthful framing.** Registration is a one-time, high-stakes ceremony — treat it like NN/g's facial-recognition-payment onboarding findings (poor onboarding → no trust): explain *what the passkey does* ("this device signs your payment requests") and what it does *not* do. Per the constraint, copy must never call it "verified identity" — describe it as a device-bound signing key that proves requests came from this device. Use large targets (people register in varied contexts), single-column layout, one action per screen, and confirm success with a concrete next step, not abstract security claims.

7. **Request-creation form: single column, labels above fields, minimal typing, sensible defaults.** Per NN/g form + mobile guidelines: single-column vertical form; labels directly above inputs (amount, expiry, memo, optional payer); use segmented/stepper-style or preset options instead of dropdowns for expiry (iOS dropdown guidance: ≤4–6 short items only); typing is error-prone on touchscreens, so prefill defaults (e.g., default expiry) and make clearing defaults one tap (NN/g mobile guideline: single-button clear). Amount field: large numeric keypad input, horizontal stepper if any (NN/g stepper guideline), never a dropdown.

8. **Receipt page = permanent, layered content.** Apply NN/g's "layer content, gist first, details deferred": the receipt's first screen shows status (paid/pending/failed — always reflecting onchain truth), amount, parties, timestamp; tx hash, block, and proof data go in an expandable details section. Because receipts are shared/permanent, the page must be self-explanatory to a cold visitor with no app context (same cold-open rule as #4). Status must fail closed: if the chain can't be queried, show "status unknown — could not verify on chain", never cached "success".

9. **Activity/history page: list-first, large row targets, sticky context.** History rows must each be ≥1cm tall with clear separation (NN/g list-spacing guidance); status badges (final/pending/failed) are content, not tiny tap targets. Use sticky date/status headers for long lists (NN/g mobile-tables guidance: stick headers in place). Filters/search are visible utility controls, not hidden behind icons alone — label icons with text (NN/g: people don't reliably understand icons).

10. **Passkey settings: hub pattern, dangerous actions distant and guarded.** Settings is a task-based, single-task-per-session area — the navigation-hub pattern (NN/g) fits: a simple list page where each task is one tap. Destructive actions (remove passkey) get strong confirmation, but note Hoober's caution: don't rely on "hard-to-reach = safe"; guard with explicit confirmation and re-authentication instead. Fail closed: if passkey state can't be confirmed, disable request-signing actions with a clear explanation rather than letting the user proceed.

Bonus cross-cutting rule: **design the sender page mobile-first and desktop-adapted, not ported** (NN/g mobile-first-≠-mobile-only): on desktop the same page becomes a centered card with a visible details panel; never ship the phone layout stretched to a monitor.

---

## 4. NOTABLE QUOTES / NUMBERS

| # | Stat/quote | Source |
|---|---|---|
| 1 | "Interactive elements must be at least 1cm × 1cm (0.4in × 0.4in) to support adequate selection time and prevent fat-finger errors." | https://www.nngroup.com/articles/touch-target-size/ |
| 2 | Average fingertip 1.6–2cm wide; thumb impact area 2.5cm (1 inch) wide (MIT Touch Lab 2003, cited by NN/g) | https://www.nngroup.com/articles/touch-target-size/ |
| 3 | "Fat fingers are not the real culprit; the blame should lie on the tiny targets." | https://www.nngroup.com/articles/touch-target-size/ |
| 4 | 49% one-handed / 36% cradled / 15% two-handed; 1,333 street observations (Steven Hoober, UXmatters 2013 — NOT an NN/g study) | https://www.uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php |
| 5 | Users change how they hold the phone "sometimes every few seconds" — grip is task-dependent, not static | https://www.uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php |
| 6 | Hidden nav used 27% (desktop) / 57% (mobile) vs 48–50% / 86% for visible/combo; discoverability cut ~in half; content discoverability −20%+; task difficulty +21%; 179 participants, 6 sites | https://www.nngroup.com/articles/hamburger-menus/ |
| 7 | Navigation-required tasks: navigation used 77% on mobile vs 54% on desktop (desktop UIs degraded by ported mobile patterns) | https://www.nngroup.com/articles/mobile-first-not-mobile-only/ |
| 8 | 0.1s / 1s / 10s response-time limits; >10s needs percent-done indicator + interrupt option (Miller 1968; Card et al. 1991; Nielsen, Usability Engineering 1993) | https://www.nngroup.com/articles/response-times-3-important-limits/ |
| 9 | "QR codes support crossdevice handoff better than links" — but they "traditionally have no information scent and need additional verbiage nearby" | https://www.nngroup.com/articles/wechat-qr-shake/ |
| 10 | WeChat diary study: ~1/3 of user activities were payments; >half of those to offline businesses; ~700M WeChat users (Apr 2016) | https://www.nngroup.com/articles/wechat-qr-shake/ |
| 11 | Long-standing guideline of ≥0.4cm between targets (and 1cm × 1cm tap areas) | https://www.nngroup.com/articles/liquid-glass/ |
| 12 | In-motion use needs bigger targets: Target app's store-mode buttons ≈2cm × 2cm | https://www.nngroup.com/articles/touch-target-size/ |
| 13 | Children: ≥2cm × 2cm targets (4× adult minimum) | https://www.nngroup.com/articles/children-ux-physical-development/ |
| 14 | Platform minimums (non-NN/g): Apple HIG 44×44pt; Material 48×48dp + 8dp spacing; WCAG 2.2 AA 24×24 CSS px (SC 2.5.8); WCAG AAA 44×44 (SC 2.5.5) | developer.apple.com / m3.material.io / w3.org — aggregated from secondary sources; verify at source before quoting in final doc |
| 15 | First-time facial-recognition payment users asked "So is it done?" — novel payment tech without onboarding breeds distrust; onboarding must prevent misunderstanding and let users learn *after* first use | https://www.nngroup.com/articles/face-recognition-pay/ |

*Unverified (flagged): the "59% mobile vs 80% desktop task success" figure attributed to NN/g's 2011 mobile studies — commonly quoted but not confirmed against an nngroup.com page in this research pass.*
