# Security Policy

## Scope

Vajra consists of:

- `VajraNativeV1` — an immutable settlement contract deployed on Monad Mainnet
  (chain ID 143) at `0x7d17f2765bb58ceb27b9e1e52b068c72ccb8299f`
- A client-side web application (this repository's `frontend/`) that constructs,
  verifies, and settles payment requests.

There is no backend, no database, and no custodial component.

## What we explicitly guarantee

The contract enforces, and the test suite proves:

- A request settles at most once.
- Settlement moves exactly the signed amount, only to the signed recipient.
- Payer-restricted requests settle only from the signed payer.
- Expired, revoked, already-paid, or stale-passkey-version requests cannot
  move funds.
- A failed native transfer reverts the entire transaction and leaves the
  request unused.
- No privileged account can alter a request, redirect a payment, or recover
  funds — there is no owner, no upgrade path, no pause, no admin withdrawal.

## What we do not claim

- Vajra verifies control and integrity, not legal identity. A scammer can
  create a valid request to their own wallet.
- A compromised recipient wallet can register an attacker passkey.
- A compromised sender wallet or browser extension can approve an unwanted
  transaction.
- The share link reveals its contents to anyone who receives it.
- No test suite proves the absence of unknown vulnerabilities.

The complete threat model lives in `Vajra_PRD_TRD_Security_Blueprint.pdf`
(section 19) and the residual-risk register in section 29.

## Reporting a vulnerability

Please do not open public issues for security reports.

- Open a private GitHub Security Advisory on this repository, or
- Contact the maintainer listed on the repository profile.

Include: affected component (contract / frontend / payload format), impact,
reproduction steps or a proof of concept, and any transaction hashes if the
issue is observable onchain.

We will acknowledge within 72 hours and coordinate disclosure. Because the
contract is immutable, confirmed contract-level issues are mitigated at the
application and domain layers and disclosed publicly with full detail.

## Secrets

Private keys never belong in this repository. The deployer key exists only in
a local, gitignored `.env`. If you find a secret committed anywhere in the
history, treat it as compromised and report it immediately via the channels
above.
