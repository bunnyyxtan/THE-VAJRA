# VAJRA Frontend Audit — Phase 0 (2026-07-19)

Scope: honest inventory before any frontend build. **No prior frontend existed.** This document
is the contract inventory, the spec'd surface area, and the functional risk list the frontend
must honor. It is not a design document (design gate: docs/design-direction-v1.md).

## 1. The contract (ground truth)

**VajraNativeV1** — live on Monad Mainnet (chain 143) at
`0x7d17f2765bb58ceb27b9e1e52b068c72ccb8299f`, verified (Sourcify full match + Monadscan),
smoke-tested with real transactions (log.md). Non-upgradeable, no owner, no roles, no fees,
no pause, no delegatecall, no token approvals, no user balances, no admin sweep. Native MON only.

**Reads:** `statusOf(requestId)` (Unused/Paid/Revoked) · `settlementOf(requestId)` (payer,
recipient, amount, paidAt, memoHash, authMode, authVersion) · `passkeyOf(recipient)` (qx, qy,
credentialIdHash, rpIdHash, version, active) · `requestId(request)` (canonical EIP-712 digest)
· `inspect(request, proof, prospectivePayer)` → `(id, ValidationCode)` · `memoHashOf(bytes)` ·
`DOMAIN_SEPARATOR()` · constants (`MIN_LIFETIME` 60s, `MAX_LIFETIME` 30d, `MAX_FUTURE_SKEW` 5m,
`MAX_MEMO_BYTES` 96, WebAuthn proof bounds 1024/1024).

**Writes:** `fulfill(request, proof)` payable, exact msg.value, nonReentrant ·
`revoke(request)` (recipient only) · `registerPasskey` / `rotatePasskey` / `deactivatePasskey`
(wallet-authorized; versions monotonic).

**Events:** `PaymentFulfilled` (one per settlement, exactly) · `PaymentRevoked` ·
`PasskeyRegistered/Rotated/Deactivated`.

**Custom errors (16):** ZeroRecipient, ZeroAmount, InvalidNonce, MemoTooLong, InvalidTimeWindow,
RequestExpired, RequestAlreadyPaid, RequestRevoked, WrongPayer(expected, actual),
InvalidWalletSignature, InvalidPasskeyProof, InactivePasskey, WrongPasskeyVersion(expected,
actual), IncorrectValue(expected, actual), NativeTransferFailed, DirectPaymentsDisabled.

**Invariants the frontend must respect:**
- requestId = EIP-712 digest, domain `("Vajra","1",143,contract)`; TS must equal Solidity
  (parity vectors frozen in contracts/test/Vectors.t.sol — **verified TS == Solidity, and
  TS == live mainnet contract `requestId()`**).
- Fulfill validation order: static fields → id → status Unused → expiry → passkey state/version
  → payer restriction → auth → exact value.
- A request pays exactly once; payment/revocation race resolves to whichever finalizes first.
- Passkey rotation/deactivation invalidates all unpaid requests with older authVersion.
- Contract holds no balances; direct transfers revert.
- Wallet mode: recipient's EIP-712 signature over the digest (EOA + ERC-1271). Passkey mode:
  WebAuthn assertion, challenge = base64url(requestId), UV required, P-256 onchain.

## 2. Spec'd surface (blueprint §18 routes, §7 journeys)

Routes: `/` · `/request` · `/pay#payload` · `/receipt/[requestId]` · `/activity` ·
`/settings/passkey` · `/api/health`. Journeys: A passkey setup · B create request ·
C verify & pay · D revoke · E rotate/deactivate. Workflow gates (design-direction §Workflow
gates): Phase 1 tokens + Motion Lab → Phase 2 Home/Create/Receipt at 390/768/1024/1440
light+dark → owner approval → propagate.

## 3. What the web3 lib now provides (this wave, apps/web/lib/)

`chain.ts` single config (143, rpc.monad.xyz, monadscan/monadvision, canonical address,
fail-closed env validation) · `vajra/types.ts`+`domain.ts` canonical types/constants/memo ·
`vajra/hash.ts` EIP-712 + requestId (parity-tested) · `vajra/encode.ts`/`decode.ts` §17 payload
(strict, 8KB cap, decimal-string integers, NFC memo ≤96 bytes, unknown-key/version rejection) ·
`vajra/fingerprint.ts` Vajra Code (first 4 bytes of requestId, `XXXX-XXXX`; ADR in log.md) ·
`contracts.ts` typed viem reads/writes + PaymentFulfilled decoding · `finality.ts`
broadcast→included→final with honest verification-delayed/reverted states · `activity.ts`
localStorage persistence (hashes survive refresh; success never stored) · `errors.ts` single
error shape + §23 four-question copy for every code.

## 4. Functional risks

1. **RPC lag/disagreement** → false state. Mitigation: receipt + event + state reads before any
   success; honest `verification_delayed`; hash preserved in activity.
2. **Stale simulation** after account/chain switch → wrong payer or revert. Mitigation: callers
   must re-run `inspect` + simulate immediately before `fulfill` (Journey C step 8); the lib
   exposes both.
3. **Finality source unverified** — public RPC `finalized` tag support on Monad is unconfirmed.
   Mitigation: finalized-tag preferred; documented 5-confirmation heuristic fallback, always
   labeled with its source; never a hardcoded time claim.
4. **Payload hostility** (XSS, oversized, malformed). Mitigation: strict decoder rejects before
   parse completes; memo plain-text only; explorer URLs built only from config + local values.
5. **Revocation race** — UI must never describe a pending revocation as effective (§13).
6. **Wallet-mode signing UX** — contract expects a signature over the raw EIP-712 digest;
   signing the typed data yields exactly that digest. Some wallets may still block
   digest-signing flows; passkey mode is the flagship path (blueprint §12).
7. **localStorage loss** (private mode) degrades activity to session memory — handled, and
   receipts remain reproducible from chain data + shared payload (§24).
8. **Vectors.t.sol comment drift** — its header says chainId 31337, but foundry.toml runs tests
   at chainId 143 and the frozen vectors match 143. TS parity only passes at 143. Logged as ADR;
   contract-side comment fix left to the contract owner.
