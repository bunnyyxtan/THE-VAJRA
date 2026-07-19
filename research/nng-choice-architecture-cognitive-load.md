# NN/g Research Report: Choice Architecture & Cognitive Load
## For Vajra (Web3 payment-request app on Monad) - one primary action per money screen

Compiled from nngroup.com (primary) + corroborating academic/secondary sources. Unverifiable items are flagged.

---

## 1. CORE THEORY

### 1.1 Hick's Law (Hick-Hyman Law)
- **Principle**: Decision time increases with the number (and complexity) of choices - the relationship is logarithmic, commonly written RT = a + b*log2(n). (Formula form is standard textbook material; not re-verified against the original papers this session.)
- **Attribution**: British psychologist William Edmund Hick (1952) and American psychologist Ray Hyman (1953, extension). Per lawsofux.com: "In 1952, this pair set out to examine the relationship between the number of stimuli present and an individual's reaction time."
- **NN/g's framing** (Katie Sherwin, NN/g video, 2018): "Hick's Law (or the Hick-Hyman Law) says that the more choices you present to your users, the longer it takes them to reach a decision. However, combining Hick's Law with other design techniques can make long menus easy to use."
- Source: https://www.nngroup.com/videos/hicks-law-long-menus/ ; https://lawsofux.com/hicks-law/

### 1.2 Miller's 7+/-2 and its modern reinterpretation
- **Original**: George A. Miller, "The Magical Number Seven, Plus or Minus Two: Some Limits on Our Capacity for Processing Information," Psychological Review, 1956. Memory span ~7 chunks regardless of information per chunk.
- **NN/g's correction** ("How Chunking Helps Content Processing," 2016): Miller's finding was about *recall* of chunked items, NOT a cap on how many options a screen may show. NN/g explicitly warns designers not to cap menus at 7, because menus rely on **recognition, not recall**. The real takeaway: "Human short-term memory is limited, so if you want your users to retain more, pack information into meaningful chunks... don't get hung up on the number seven - other researchers have suggested that the right number could be anywhere from three to six."
- **Modern reinterpretation**: Nelson Cowan (2001) argues working-memory capacity is ~4+/-1 chunks when rehearsal/chunking is controlled (cited in Norris et al. memory literature). IxDF glossary: "a range of three to six (4+/-1) appears ideal for interaction design." Miller himself used "magical number seven" rhetorically and was surprised by its misinterpretation.
- Sources: https://www.nngroup.com/articles/chunking/ ; https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7144498/ ; https://ixdf.org/literature/book/the-glossary-of-human-computer-interaction/chunking

### 1.3 Paradox of choice / choice overload
- **Original study**: Iyengar & Lepper (2000), "When choice is demotivating," Journal of Personality and Social Psychology. Jam-tasting booth at an upscale grocery store (Draeger's Market, Menlo Park, CA, over two Saturdays, per secondary accounts): 24-jam display drew 60% of passersby to stop vs 40% for the 6-jam display, but **30% of those who stopped bought from the 6-jam display vs only 3% from the 24-jam display** (~10x conversion gap). Companion studies: students choosing essay topics from 6 vs 30 options showed higher satisfaction and higher-rated essays with the smaller set. (Precise sample sizes are not consistently reported in accessible secondary sources - treat the percentages as the citable figures; exact N unverified.)
- **Popularization**: Barry Schwartz, *The Paradox of Choice: Why More Is Less* (2004).
- **Replications/meta-analyses - important nuance**:
  - Scheibehenne, Greifeneder & Todd (2010, Journal of Consumer Research) meta-analysis: **mean effect size of choice overload across studies was effectively zero** - the effect is real but not universal.
  - Chernev, Boeckenholt & Goodman (2015, Journal of Consumer Psychology) meta-analysis of 99 studies: choice overload emerges under 4 conditions - (1) people want a quick/easy choice, (2) the product is complex, (3) options are hard to compare, (4) choosers lack clear preferences. (All 4 apply to a first-time crypto payer - strong support for minimal-choice money screens.)
- Sources: https://www.jasoncollins.blog/posts/not-the-jam-study-again ; https://www.voucherify.io/blog/value-of-variety-and-choice-overload-in-customer-psychology-when-too-much-choice-can-decrease-sales ; https://readmedium.com/the-jam-experiment-how-choice-overloads-makes-consumers-buy-less-d610f8c37b9b

### 1.4 Progressive disclosure & staged disclosure
- **NN/g definition** (Jakob Nielsen, 2006): defer advanced/rarely-used features to a secondary screen. "Initially, show users only a few of the most important options. Offer a larger set of specialized options upon request."
- **Staged disclosure** = the linear variant; wizards are the classic example. Progressive disclosure -> learnability; staged disclosure -> simplicity of each step.
- Source: https://www.nngroup.com/articles/progressive-disclosure/

### 1.5 Wizard vs single-page
- **NN/g evidence**: research on 46 web-based applications included a hotel-reservation system that squeezed all stages onto one screen; NN/g uses it to show staged disclosure's tradeoffs.
- Wizards reduce overwhelm, cognitive effort, and mistakes, but raise interaction cost, impede cross-step comparison, and are not gracefully interruptible.
- Sources: https://www.nngroup.com/articles/wizards/ ; https://www.nngroup.com/articles/4-principles-reduce-cognitive-load/

### 1.6 Jakob's Law of Internet User Experience
- "Users spend most of their time on other sites. This means that users prefer your site to work the same way as all the other sites they already know." Coined by Jakob Nielsen (NN/g co-founder).
- Sources: https://www.nngroup.com/videos/jakobs-law-internet-ux/ ; https://lawsofux.com/jakobs-law/

---

## 2. NN/g SPECIFIC GUIDELINES (granular do/don't)

**From "Progressive Disclosure" (2006):**
- Get the split right: everything frequently needed must be up front; secondary only rarely visited; no confusing features on the initial display.
- Make the mechanism to reach secondary options obvious, with strong information scent (clear labels setting expectations).
- Cap at 2 disclosure levels: "designs that go beyond 2 disclosure levels typically have low usability because users often get lost."
- If 3+ levels seem needed, simplify the design or chunk advanced features into meaningful groups (card sorting).
- Benefit: improves 3 of usability's 5 components - learnability, efficiency of use, error rate. Contrary to fears, "people understand a system better when you help them prioritize features."

**From "Wizards: Definition and Design Recommendations" (2017):**
- Use wizards for infrequent, dependent-step processes; each page = one step; perceived linear flow (next, next, next).
- Benefits: less overwhelm (long forms look harder than they are), less cognitive effort (irrelevant fields never shown), fewer mistakes, more screen space per control.
- Don't use wizards for expert/repetitive data entry (interaction cost of clicking through), when users must compare/transfer info across steps, or when interruption is likely (state loss).
- Show only the steps relevant to each user via transparent branching.

**From "4 Principles to Reduce Cognitive Load in Forms" (2025):**
- Single-column layouts consistently outperform multicolumn for completion rates.
- Order questions to minimize effort: familiarity -> priority -> dependency -> complexity -> sensitivity. Use branching to hide irrelevant fields.
- Use progressive disclosure on long forms; cites GOV.UK's "one thing per page" pattern: one question/task per screen makes errors easy to spot and fix.

**From "Simplicity Wins over Abundance of Choice" (Hoa Loranger, 2015):**
- Every feature adds: more things to consider, more help-text overhead, more error risk. Feature interactions compound complexity and break mental models.
- Empirical: in NN/g's soda-machine example, time on task bloated by over 500% when users could customize.
- Web users are uncommitted - if choosing is hard, "they can simply go somewhere else."
- "Keeping the number of options at a reasonable level allows people to make decisions more easily and complete tasks faster."

**From "Confirmation Dialogs Can Prevent User Errors" (2018) - directly relevant to money actions:**
- Use confirmation before actions with serious consequences (e.g., costing large amounts of money), especially irreversible ones.
- Do NOT confirm routine actions (cry-wolf effect).
- Be specific about the consequence - never "Are you sure?"
- Label buttons with the outcome verb ("Delete file" / "Keep file"), not Yes/No.
- Use progressive disclosure for consequence details.
- Avoid defaulting to the dangerous answer; probably no default at all on high-risk confirmations.

**From "How Chunking Helps Content Processing" (2016):**
- Pack information into meaningful chunks; don't ask users to hold more than a few pieces of information in short-term memory at once.
- Don't cap visible options at 7 - recognition-based displays are exempt from the 7+/-2 limit.

**From "Clean the Sludge from Decision-Making Workflows" (2024):**
- Prefer removing sludge over adding nudges. Thaler (2021): nudges are only marginally effective; users already decided, repeat past choices, are too confused, or aren't paying attention.
- Benefits of simplified decision workflows: greater satisfaction, increased retention, reduced support load, fewer refunds.
- Match tooling to decision difficulty: assess user experience with the decision type, stakes, number of options compared, and differentiability.

**From "Jakob's Law" + "The Danger of Defaults" (2024):**
- Follow conventions users already know; leverage existing mental models.
- Assume users will not change defaults - design defaults as the choice most users should get.

**From "Onboarding Tutorials vs. Contextual Help" (2023):** "No memorization! For multistep workflows... show help content alongside each step to minimize cognitive load."

**From "Defer Secondary Content When Writing for Mobile":** first screen = only essential information; "the less you can see, the more you have to remember, and human short-term memory is notoriously weak."

---

## 3. APPLICATION TO VAJRA (8 actionable rules)

**V1 - One decision per screen, one primary CTA, via staged disclosure.**
Model the sender flow (verify terms -> connect wallet -> pay -> watch finality) as a wizard: NN/g's evidence says splitting a dependent, infrequent, high-stakes process into one step per page reduces overwhelm, cognitive effort, and errors. Exactly one filled/primary button per screen; everything else is a link or ghost button. (Hick's Law; NN/g Wizards 2017.)

**V2 - Keep terms visible at the pay step (recognition over recall).**
NN/g's wizard caveat: users can't compare/transfer info across steps. So on the Pay step, show a persistent compact summary chunk (amount, recipient, expiry, memo) above the button - never make the payer remember terms from a previous screen. (Miller/chunking reinterpretation: limit what working memory must hold to ~3-4 chunks; keep everything else on screen.)

**V3 - Payment-request form: single column, effort-ordered, optional fields collapsed.**
Order: Amount (primary) -> Expiry (sensible default prefilled) -> Memo (collapsed "Add memo") -> Optional payer (collapsed "Restrict to a specific payer"). This is literal NN/g progressive disclosure: frequent needs up front, rare options behind a clearly labeled reveal. Single-column layout; assume defaults won't be changed, so the default expiry must be the one you'd want most users to get. (NN/g Forms 2025; Progressive Disclosure 2006; Danger of Defaults 2024.)

**V4 - Confirmation designed for irreversible money, not habituated away.**
The Pay tap is exactly NN/g's "serious consequence" case: use one confirmation-style review with the specific consequence spelled out ("Send 25 MON to 0x1a...9f"), outcome-verb buttons ("Send 25 MON" / "Cancel"), no pre-focused default on Send, and progressive disclosure ("Details") for fee/expiry terms. Never add confirmations to routine steps (connect wallet, view receipt) - overuse destroys their protective power. (NN/g Confirmation Dialogs 2018.)

**V5 - Fail closed, and make the closed state a clear non-choice.**
If terms can't be verified (bad signature, expired request, wrong chain), the Pay action is disabled or absent - not an enabled button with a warning. Hick's Law cuts both ways: don't present a "Pay anyway" option as a co-equal choice on a money screen; a failing state should offer exactly one safe path (back out) plus optional info reveal. (Vajra constraint; NN/g choice-overload + confirmation research.)

**V6 - Chain status as staged states, success only on finality.**
The watch screen shows broadcast -> included -> final as a single linear status (staged disclosure of the chain lifecycle), with exactly one thing happening at a time. The words "Success"/"Paid" and any green checkmark appear only on the final state backed by onchain proof; intermediate states use neutral in-progress language ("Broadcast to Monad - waiting for inclusion"). The permanent receipt page is the terminal proof artifact. (Vajra no-fake-success constraint; NN/g visibility-of-system-status heuristic.)

**V7 - Follow wallet/payment conventions (Jakob's Law).**
Sender page should look like checkout patterns users know (amount prominent, single pay button, familiar wallet-connect list, QR + copy affordances). Cap the wallet list at detected options (typically <=3), recommend one ("Detected: Rabby") rather than presenting a directory of dozens - lawsofux's Hick's Law takeaway: minimize choices when response time matters, highlight the recommended option. Native-MON-only means no token selector: keep it that way and surface it as a fact, not a disabled choice. Passkey registration should use the platform's native passkey prompt verbatim - do not re-skin it into an unfamiliar ceremony. (Jakob's Law; Hick's Law takeaways; Chernev et al. 2015 - novice payer + complex product + no clear preference = maximal overload risk, so remove choices aggressively.)

**V8 - Copy rules: chunk the facts, disclose the fine print, never oversell the passkey.**
- Terms as 3-4 visually distinct chunks (Amount / To / Valid until / Note), each 1 line or less - chunking research shows chunked content is processed and retained better.
- Advanced details (request ID, contract, signature) behind one labeled "Technical details" reveal - 2 disclosure levels max, per NN/g.
- Describe the passkey as "this device's key that signed this request" - never "verified identity" (Vajra constraint; also NN/g's warning that interface copy shapes decisions and manipulative/imprecise copy harms users).
- Help text inline next to each step ("No memorization!" guideline) - no pre-tours before the passkey or payment flows.
- Activity/history page: primary action is "Create request"; list items chunked (counterparty + amount + status chip), with grouping (e.g., by day) rather than flat walls of rows.

---

## 4. NOTABLE QUOTES / NUMBERS (citable)

1. "Users spend most of their time on other sites." - Jakob's Law, NN/g. https://www.nngroup.com/videos/jakobs-law-internet-ux/
2. Jam study: 24 jams -> 60% stop, 3% buy; 6 jams -> 40% stop, 30% buy (~10x conversion). Iyengar & Lepper 2000, JPSP. Secondary: https://www.jasoncollins.blog/posts/not-the-jam-study-again
3. Scheibehenne et al. 2010 meta-analysis: mean choice-overload effect size across studies "effectively zero" - the effect is conditional, not universal. (same URL as #2)
4. Chernev et al. 2015, J. Consumer Psychology, 99 studies: overload occurs when users want a quick choice, product is complex, comparison is hard, or preferences are unclear. https://readmedium.com/the-jam-experiment-how-choice-overloads-makes-consumers-buy-less-d610f8c37b9b
5. NN/g: soda-machine customization "time on task bloated by over 500%." https://www.nngroup.com/articles/simplicity-vs-choice/
6. "Don't get hung up on the number seven - Other researchers have suggested that the right number could be anywhere from three to six." NN/g Chunking. https://www.nngroup.com/articles/chunking/
7. Cowan (2001): working-memory capacity ~4+/-1 chunks. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7144498/
8. "Designs that go beyond 2 disclosure levels typically have low usability because users often get lost." NN/g. https://www.nngroup.com/articles/progressive-disclosure/
9. Progressive disclosure "improves 3 of usability's 5 components: learnability, efficiency of use, and error rate." (same URL)
10. NN/g wizard research base: 46 web-based applications studied; single-screen hotel reservation used as the counterexample. https://www.nngroup.com/articles/progressive-disclosure/ and https://www.nngroup.com/articles/wizards/
11. Confirmation dialogs: "Do not ask 'Are you sure you want to do this?'... Avoid giving confirmation dialogs a default Yes answer." https://www.nngroup.com/articles/confirmation-dialog/
12. "Short is too long [for mobile]. Ultra-short rules the day." NN/g mobile content. https://www.nngroup.com/articles/defer-secondary-content-for-mobile/
13. Thaler via NN/g: nudges are "only marginally effective"; reduce sludge instead of adding nudges. https://www.nngroup.com/articles/sludge-decisions/

### Unverified / handle with care
- Hick-Hyman formula RT = a + b*log2(n) and the exact paper titles/years (Hick 1952 QJEP; Hyman 1953 JEP) - standard textbook citations, not re-verified against originals this session.
- Exact sample sizes of the Iyengar & Lepper jam study - percentages (60/40 stop; 30/3 buy) are consistently reported; raw Ns are not, in accessible secondary sources.
- "HubSpot 2023: 4->3 form options = +50% conversion" appeared in a low-authority source - do NOT cite.
