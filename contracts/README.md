# VajraNativeV1 — Contracts

Recipient-authenticated, single-use native-MON payment settlement on **Monad Mainnet** (chain ID 143).
Spec: `../vajra_blueprint_extracted.txt` (Vajra PRD/TRD/Security Blueprint v1.0, sections 11–14, 21–22).

## Architecture

One immutable contract. No owner, no upgradeability, no fee, no pause, no admin withdrawal,
no user balances. Two authentication modes resolve to the same EIP-712 request digest:

- **Wallet mode** — EIP-712 signature by the recipient (EOA + ERC-1271 via OpenZeppelin SignatureChecker).
- **Passkey mode** — WebAuthn assertion verified onchain against a registered P-256 key
  (EIP-7951 / RIP-7212 secp256r1 precompile at `0x0100`).

Settlement: checks-effects-interactions, nonReentrant, exact `msg.value`, state before native
transfer, full revert leaves the request Unused. Passkey rotation/deactivation bumps the credential
version, invalidating every unpaid request signed by older versions.

## Network configuration (mainnet, fail closed)

| Param | Value | Source |
|---|---|---|
| Chain ID | 143 | https://docs.monad.xyz/developer-essentials/network-information |
| RPC | https://rpc.monad.xyz | same |
| Explorers | https://monadscan.com · https://monadvision.com | same |

foundry.toml pins solc 0.8.30, optimizer 1000 runs, `bytecode_hash = "none"` and
`use_literal_content = true` per the Monad verify guide:
https://docs.monad.xyz/guides/verify-smart-contract/foundry

## Build & test

```shell
forge build
forge test        # 98 tests: unit, ERC-1271, passkey fixture, parity vectors, fuzz, invariant
```

## Deploy (dry-run first, then broadcast)

```shell
source ../.env   # provides DEPLOYER_PRIVATE_KEY (local only, gitignored)
forge script script/Deploy.s.sol --rpc-url https://rpc.monad.xyz            # dry run
forge script script/Deploy.s.sol --rpc-url https://rpc.monad.xyz --broadcast
```

The script refuses to deploy unless `block.chainid == 143`.

## Verify

Per https://docs.monad.xyz/guides/verify-smart-contract/foundry (Sourcify on Monad):

```shell
forge verify-contract <DEPLOYED_ADDRESS> src/VajraNativeV1.sol:VajraNativeV1 \
  --chain 143 --verifier sourcify
```

Then confirm the contract page shows verified source on https://monadscan.com.

## Post-deploy

Write the deployed address once into `.env` as `NEXT_PUBLIC_VAJRA_CONTRACT_ADDRESS` — every
consumer (frontend config, EIP-712 domain, receipts) reads it from that single source.
