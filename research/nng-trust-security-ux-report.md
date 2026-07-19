# NN/g Research Report: Trust, Credibility & Security UX - Applied to Vajra (Monad payment-request app)
Compiled from live fetches of nngroup.com articles + the NIST security-fatigue paper. All quotes verified against source text in this session.

## 1. CORE THEORY

### 1.1 How users decide to trust (NN/g)
- Jakob Nielsen (1999) defined 4 ways a site communicates trustworthiness: (1) design quality, (2) up-front disclosure, (3) comprehensive/correct/current content, (4) connection to the rest of the web. NN/g re-validated these in a 2016 usability study in Singapore (Western vs. Asian participants): "the basic factors used to weigh site trustworthiness were the same, regardless of location and culture" and "Users' priorities and methods of evaluation are the same today as they were 17 years ago." (nngroup.com/articles/trustworthy-design/)
- First impressions: Lindgaard et al. (2006, Behaviour & Information Technology 25(2):115-126, "Attention web designers: You have 50 milliseconds to make a good first impression!") - reliable visual-appeal judgments form in 50 ms (Study 3: n=40, 50 ms condition; ratings highly correlated with 500 ms and unlimited-time judgments). NN/g covers this study in its first-impressions material. Implication: the sender payment page is judged before a single word is read.
- Trust = predictability. NN/g (Heuristic #1, Visibility of System Status): "The predictability of the interaction creates trust not only in the mechanics of the site or the app, but also in the brand itself... no action with consequences to users should be taken without informing them. When an external event or the passage of time caused a change in the state of the system, explain it in brief but understandable terms." (nngroup.com/articles/visibility-system-status/)

### 1.2 Security fatigue (NIST - the canonical study; NN/g is thin here)
- Stanton, Theofanos, Prettyman & Furman (NIST), "Security Fatigue," IEEE IT Professional, Sept/Oct 2016. Qualitative study: 40 semi-structured interviews with average (non-expert) users, collected Jan-Mar 2011, urban/rural/suburban. Fatigue surfaced spontaneously in 25 of 40 interviews even though fatigue was not in the interview protocol.
- Findings: security fatigue = decision fatigue applied to security, producing resignation, loss of control, and three cognitive biases: (a) "I'm not a target" (nothing of value), (b) "someone else is responsible" (the bank/vendor will protect me), (c) fatalism ("no measure will really make a difference"). Users make cost-benefit tradeoffs that look irrational to experts but are rational given overload (citing Herley 2009, the "rational rejection of security advice").
- NIST's three mitigations: (1) limit the number of security decisions users must make; (2) make it easy for users to do the right thing (the secure option = default/easiest); (3) provide consistency in the decisions users do need to make.

### 1.3 Security-usability tension (NN/g position)
- Nielsen, "Stop Password Masking" (2009): masking "doesn't even increase security, but it does cost you business due to login failures" - BUT the crucial caveat: "In cases where there's a tension between security and usability, sometimes security should win" (e.g., bank accounts, high-risk apps). NN/g is not usability-at-all-costs; for money movement, friction can be correct.

### 1.4 Passkeys / biometrics (NN/g, June 2023)
- "Passwordless Accounts: One-Time Passwords (OTPs) and Passkeys" (Raluca Budiu, 2023-06-25): a passkey is "a password that is invisible to the user"; the device creates and stores it encrypted; biometric (fingerprint/face) unlocks it; passkeys "cannot be used for phishing because they only can be sent to the sites they are associated with." NN/g survey finding: 83% of users use a biometric authentication method at least occasionally (95% CI: 73-87% - reported as printed).
- NN/g's catch: cross-device use is the friction point - "if you are going to use the site across several devices, it may not be possible to easily take advantage of them on all"; solution = QR-code cross-device authentication.
- Note: NN/g has no article specifically on passkey registration-ceremony UX beyond this. Academic caveat (Lyastani et al. 2023): do not assume users "naturally accept biometric authentication... because they are easier and more convenient."

### 1.5 Communicating risk without fearmongering
- NN/g's confirmation-dialog research (nngroup.com/articles/confirmation-dialog/): warnings work only if rare, specific, and non-automatable. "If you warn people too much, they stop paying attention... Like in Aesop's fable, if you cry wolf too many times, people will stop paying attention."
- NN/g's deceptive-patterns article defines "emotionally manipulative designs" - designs that "scare, guilt, or shame users into making a choice that the business favors" - as a deceptive-pattern category. Fear appeals aimed at conversion are explicitly condemned; risk communication must be factual and user-serving.
- NIST fatigue data shows the downstream cost of fear-based security messaging: users become "desensitized" ("You get this warning that some virus is going to attack... I don't pay any attention to those things anymore" - participant 101).

## 2. NN/g'S SPECIFIC GUIDELINES (granular do/don't)

### 2.1 Trust & credibility (trustworthy-design, 2016)
DO: professional visual design, meaningful navigation labels, adequate white space; fix all typos/broken links ("quickly degrade credibility"); disclose prices/fees/policies before asking for anything; show process (not just outcomes) content; link out to external/third-party sources ("links to outside sources are a good way to generate trust").
DON'T: gate content behind login/registration ("Asking for information before providing any value is a breach of trust"); hide costs until late in the flow; use clever/nondescript labels; rely on on-site testimonials alone (users trust external reviews more).

### 2.2 Visibility of system status (Heuristic #1)
- Every user action needs appropriate, timely feedback (button state change, progress indicator).
- Lack of feedback leads to double-tapping, lost confidence, feeling out of control (NN/g eyetracking clip shows a user scanning for a progress indicator when none appears).
- Backstage events that affect users (state changes caused by external events or time) must be surfaced in "brief but understandable terms"; never silently remove or change user data.
- Communicating state = trust: "Don't blindfold your users!"

### 2.3 Error messages (nngroup.com/articles/error-message-guidelines/)
- Display the error close to its source.
- Use noticeable, redundant, accessible indicators (bold, high-contrast, red plus icon; never color alone - roughly 350M people worldwide have color-vision deficiency).
- Match message gravity to severity: toast/banner for "good to know," modal only for severe, blocking errors.
- Don't show errors prematurely (erroring on focus-loss of an empty field = hostile pattern).
- Human-readable language; hide error codes (show for diagnostics only); concisely and precisely describe what happened and what to do next. Generic "An error occurred" is useless.

### 2.4 Confirmation dialogs (8 guidelines; critical for money actions)
1. Use only before actions with serious consequences - "destroying users' work or costing large amounts of money," especially irreversible ones.
2. Never for routine actions (cry-wolf effect).
3. Be specific: restate the request and its consequence in user-centric terms; never a bare "Are you sure?"
4. Buttons must summarize the outcome ("Delete file" / "Keep file"), not Yes/No.
5. Progressive disclosure for secondary detail ("Tell me more").
6. No default = Yes for dangerous actions (preferably no default at all).
7. For particularly dangerous operations, require a nonstandard action (type-to-confirm); banks use intrusive confirmation before wire transfers - cited approvingly.
8. Allow bypass of routine confirmations.
- Personalization idea NN/g endorses: confirm only anomalous payments (e.g., at least 2x the user's normal payment range).
- Also: provide undo wherever possible ("user control and freedom").

### 2.5 Error prevention / slips (Hawaii missile alert analysis, 2018)
- Blame the system, not the user: "a poorly designed system is to blame... The answer is to redesign the system to be less error-prone."
- Avoid poorly differentiated options (similar names/styling for test vs. live).
- Separate modes/environments for dangerous vs. safe operations; make the safe mode the default.
- Build in recovery (the retraction message took 38 minutes because the system lacked an undo path).

### 2.6 Passkeys / passwordless (2023)
- Offer biometric login as an option; don't force passwords on passwordless accounts.
- For passkeys: support multiple devices via QR-code cross-device authentication.
- Present passkeys as convenience + security, not as identity.

### 2.7 QR codes (13 guidelines, Feb 2024 - directly relevant to Vajra's request QR)
1. Tell users what the code does and where it came from ("QR codes have no information scent by themselves"); the label should be as prominent as the code itself; show the URL next to the code.
2. State which device/app must scan it, if restricted.
3. Codes must lead to mobile-friendly pages.
4. Deep-link directly to the relevant page/action - never a generic homepage.
5. On the same device, use a direct link, not a QR (QRs on mobile are for presenting to other devices/scanners - e.g., Venmo account codes).
6. Never invert QR colors.
7. QRs are good for cross-device authentication.
8. Use QRs for progressive disclosure with rich contextual labels (not generic "Learn more").
9. Codes must lead to up-to-date info; expired destinations should redirect to an explanatory page, not a stale one.
10. If users have under 15 seconds to scan, use a short memorable URL instead (scanning takes 15+ s: notice, decide, retrieve phone, aim, focus, tap).
11. Don't rely solely on QR for repeat visits (codes can't be remembered).
12. Place codes where users are likely to look (proximity principle).
13. Minimum effective size 2 cm x 2 cm; add 1 cm per 10 cm of expected scan distance.
- SECURITY: NN/g explicitly warns QRs can be "manipulated to trigger unauthorized payments from mobile-payment apps. Scammers achieve this by linking the code to their own accounts" - and "few users interacting with QR codes will actively consider these risks." The design must therefore carry the safety burden.

### 2.8 Deceptive patterns (avoid list)
- 2019 Princeton/UChicago crawl (Mathur et al., CSCW): deceptive patterns on over 10% of 11,000 popular ecommerce sites. Di Geronimo et al. (CHI 2020, U. Zurich): 95% of 240 free trending Google Play apps contained deceptive patterns; over half averaged 7 each. Luguri & Strahilevitz (2021): mild deceptive patterns often go unnoticed, especially by lower-education users.
- Categories to avoid in Vajra: obstruction, visual/wording tricks, nagging, emotional manipulation (fear/guilt/shame), sneaking/preselection.
- NN/g's self-audit questions include: "Could users spend more... than they intended?" "Is the information presented about each choice factually correct?" "Are users rushed into making a decision?" "Are users unfairly pressured or emotionally manipulated?"

## 3. APPLICATION TO VAJRA - 10 actionable rules

R1. Honest finality state machine (sender payment page + receipt). Implement broadcast / included / final as three visually distinct, labeled states with elapsed time and plain-language explanations ("Included in block N - waiting for finality, ~Xs typical"). Show "Paid / Final" ONLY after onchain finality. This is Heuristic #1 applied literally; NN/g: "no action with consequences to users should be taken without informing them."

R2. Upfront disclosure before wallet connection. The sender must see the complete terms - amount in MON, fiat equivalent, recipient address (truncated + copyable), memo, expiry, payer restriction, and the fact that payment is irreversible - BEFORE "Connect wallet." NN/g: asking for anything before providing value "is a breach of trust"; omitted basic info gets sites "almost immediately ruled out."

R3. One specific, high-friction confirmation at the irreversible step. The pay confirmation restates amount, recipient, and network; buttons labeled "Pay 250 MON" / "Cancel"; no default-focus on Pay; state irreversibility factually ("This payment cannot be reversed once confirmed on Monad"). No confirmation dialogs anywhere else in the flow (cry-wolf). Consider NN/g's anomaly heuristic: add friction only when a payment deviates from the request's visible terms.

R4. Fail closed, recover visibly. Any failed verification (bad signature, expired request, wrong payer, RPC outage) blocks payment and shows: what failed, in plain language, near the pay button, with the constructive next step ("This request expired at 14:03 UTC - ask the recipient for a new link"). Never a silent disabled button; never "An error occurred."

R5. Describe the passkey as a signing key, never as identity. Ceremony copy: "Create a passkey on this device. It signs your payment requests so payers can verify the request wasn't tampered with. It does not identify you, and Vajra never sees your biometric." The passkey proves device possession + user presence; the receipt page should say "Request signature valid" (a fact) not "Verified user" (a claim). This honors both NN/g's factual-correctness audit question and Vajra's hard constraint.

R6. Minimize security decisions (NIST fatigue mitigations). Safe defaults everywhere: expiry default on, payer field default open, no settings the user must tune to be safe. The secure path must be the easiest path. Reserve red/warning UI exclusively for real, actionable risk (e.g., "This link's signature does not match - do not pay") so warnings keep their power.

R7. QR/link design per NN/g's 13 rules. Request QR ships with a label ("Scan to review and pay 250 MON to [name]"), the short URL printed beside it, deep-links to the specific payment page (mobile-optimized), and an in-app direct link for same-device sharing (NN/g rule 5). Expired links redirect to an explanatory page ("This request expired") with a recipient-contact affordance - never a 404 (NN/g rule 9).

R8. Design against QR-payment fraud explicitly. NN/g warns payment QRs are manipulated by scammers and "few users... will actively consider these risks," so Vajra must carry the burden: the payment page derives everything from the signed payload, prominently shows the recipient address and amount as decoded on-device, and warns if the payload fails signature verification. The page itself is the anti-phishing surface.

R9. Connect to the rest of the web for proof. Every receipt links out to an independent Monad explorer (tx hash, block number, finality status). NN/g: links to external, unbiased sources generate trust; users trust third-party verification more than first-party claims. The permanent receipt page should be shareable and verifiable without a Vajra account (no login gate on receipts).

R10. Polish as a trust feature. Zero typos, consistent state colors/icons across payment page, receipt, and activity history; professional visual design on the sender payment page (50 ms first impression; the sender often has no prior relationship with Vajra). Show "process" content - a short "How Vajra verifies payments" explainer - because NN/g found users trust services that show how the work is done, not just outcomes.

## 4. NOTABLE QUOTES / NUMBERS (with sources)

1. "The basic factors used to weigh site trustworthiness were the same, regardless of location and culture." - NN/g, Trustworthiness in Web Design (2016). https://www.nngroup.com/articles/trustworthy-design/
2. "Typos, broken links, and other mistakes quickly degrade credibility." - same article.
3. "The predictability of the interaction creates trust not only in the mechanics of the site or the app, but also in the brand itself." - NN/g, Visibility of System Status. https://www.nngroup.com/articles/visibility-system-status/
4. "Don't blindfold your users!" - same article.
5. "83% of users use a biometric method of authentication at least occasionally" (NN/g survey; CI 73-87% as printed). - NN/g, Passwordless Accounts (2023). https://www.nngroup.com/articles/passwordless-accounts/
6. "If you warn people too much, they stop paying attention." - NN/g, Confirmation Dialogs. https://www.nngroup.com/articles/confirmation-dialog/
7. "A poorly designed system is to blame." (Hawaii false missile alert, 2018 - 38-minute retraction delay.) - NN/g. https://www.nngroup.com/articles/error-prevention/
8. "In cases where there's a tension between security and usability, sometimes security should win." - Nielsen, Stop Password Masking (2009). https://www.nngroup.com/articles/stop-password-masking/
9. Security fatigue: 40 interviews (Jan-Mar 2011), fatigue in 25/40; "People get weary of being bombarded by 'watch out for this or watch out for that.'" - Stanton et al., NIST, IEEE IT Professional 2016. https://www.nist.gov/news-events/news/2016/10/security-fatigue-can-cause-computer-users-feel-hopeless-and-act-recklessly
10. 50 ms first impression of website visual appeal (Study 3, n=40). - Lindgaard et al. 2006, Behaviour & Information Technology 25(2):115-126 (covered in NN/g's first-impressions material).
11. "QR codes can be manipulated to trigger unauthorized payments from mobile-payment apps... few users interacting with QR codes will actively consider these risks." - NN/g, 13 QR-Code Usability Guidelines (2024). https://www.nngroup.com/articles/qr-code-guidelines/
12. Deceptive patterns on over 10% of 11,000 ecommerce sites (Mathur et al. 2019); 95% of 240 trending free apps (Di Geronimo et al., CHI 2020). - cited in NN/g, Deceptive Patterns in UX. https://www.nngroup.com/articles/deceptive-patterns/

## UNVERIFIED / GAPS
- NN/g has no crypto/blockchain-specific trust article (searched; none found on nngroup.com).
- NN/g's passkey coverage is a single 2023 article plus a video; no NN/g guidance on passkey registration-ceremony microcopy. Academic supplement (Lyastani et al. 2023) warns against assuming users naturally accept biometrics.
- The error-message-guidelines fetch was partially truncated; the "efficiency" section (respect user effort, preserve entered data) was not captured verbatim - treat that part as summarized from NN/g's known position, not quoted.
- The NN/g 83% biometric CI (73-87%) looks asymmetric relative to the point estimate; reported exactly as printed on nngroup.com.
