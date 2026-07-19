/**
 * EIP-712 parity vectors: TypeScript == Solidity (blueprint §22, release blocker).
 *
 * Each vector below is frozen in contracts/test/Vectors.t.sol, where the contract
 * itself recomputes the digest from first principles and asserts equality with the
 * frozen constant. This test asserts the TypeScript construction produces the same
 * digests, so any encoding drift on either side fails loudly.
 *
 * The frozen constants assume the forge test environment. Note: the comment in
 * Vectors.t.sol says chainId 31337, but contracts/foundry.toml sets
 * `chain_id = 143` in profile.default, so forge tests run with block.chainid
 * 143 and the vectors are frozen against chainId 143 (verified by running
 * `forge test --match-contract VectorsTest` and by this file passing only with
 * chainId 143 — see log.md ADR 2026-07-19). The deployed contract address in
 * the test environment is 0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f.
 */

import { describe, expect, it } from 'vitest';
import { keccak256, stringToBytes, toHex } from 'viem';
import { computeRequestId, PAYMENT_REQUEST_TYPES, paymentRequestTypedData } from './hash';
import { AUTH_MODE, type PaymentRequest } from './types';

const FORGE_CHAIN_ID = 143;
const FORGE_CONTRACT = '0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f' as const;
const FORGE_DOMAIN = { chainId: FORGE_CHAIN_ID, verifyingContract: FORGE_CONTRACT };

const T0 = 1_700_000_000n;
const HOUR = 3600n;
const DAY = 86_400n;
const ETHER = 1_000_000_000_000_000_000n;
const UINT256_MAX = (1n << 256n) - 1n;

const RECIPIENT = '0x1111111111111111111111111111111111111111' as const;
const PAYER = '0x2222222222222222222222222222222222222222' as const;
const ANY_PAYER = '0x0000000000000000000000000000000000000000' as const;
const NONCE = toHex(0xc0ffeen, { size: 32 });
const MEMO_HASH = keccak256(stringToBytes('Dinner'));
const MEMO_HASH_UNICODE = keccak256(stringToBytes('晚餐 🍜'));

function request(overrides: Partial<PaymentRequest> = {}): PaymentRequest {
  return {
    recipient: RECIPIENT,
    payer: ANY_PAYER,
    amount: ETHER,
    issuedAt: T0,
    expiresAt: T0 + HOUR,
    nonce: NONCE,
    memoHash: MEMO_HASH,
    authMode: AUTH_MODE.Wallet,
    authVersion: 0,
    ...overrides,
  };
}

const VECTORS: ReadonlyArray<{ label: string; request: PaymentRequest; expected: `0x${string}` }> = [
  {
    label: 'open-baseline',
    request: request(),
    expected: '0xad0a4e98455338b98b36896c2d54aa4f5d76ff0c4ab5d057e2370511f653a3ee',
  },
  {
    label: 'exact-payer',
    request: request({ payer: PAYER }),
    expected: '0xaf57cc6f4940bd60cd9a5938e9578d4da6127cc35759668e9646986c6e77f4ba',
  },
  {
    label: 'min-amount',
    request: request({ amount: 1n }),
    expected: '0x94a1888a4302c382f778af4e514d75f3d54465fd209b2295d3785f8ab379aa4d',
  },
  {
    label: 'max-amount',
    request: request({ amount: UINT256_MAX }),
    expected: '0xaee9a4d0f6090b0fad6350b89937408142a19df0012e8856cbd7c1d122abe750',
  },
  {
    label: 'min-lifetime',
    request: request({ expiresAt: T0 + 60n }),
    expected: '0x2f21885fe044136d26c671676ef4bb893f37049bcc69f18f41557c69e07e9c4c',
  },
  {
    label: 'max-lifetime',
    request: request({ expiresAt: T0 + 30n * DAY }),
    expected: '0xb82aa2cb4528646a149f62a114c3dc241dc1bbee25d6fcb73e1faf9627dd79ce',
  },
  {
    label: 'unicode-memo',
    request: request({ memoHash: MEMO_HASH_UNICODE }),
    expected: '0x38dc65fcaa0b976f5d12c14b73f4700eef2bb99c185094b433c5fc856789526b',
  },
  {
    label: 'passkey-mode',
    request: request({ authMode: AUTH_MODE.Passkey, authVersion: 3 }),
    expected: '0xa0723c89a7c8df958aa575743f0051ad5fab1bc9167d5f90591399d9922659a0',
  },
];

describe('EIP-712 requestId parity with VajraNativeV1 (Vectors.t.sol)', () => {
  for (const vector of VECTORS) {
    it(`matches frozen vector: ${vector.label}`, () => {
      expect(computeRequestId(vector.request, FORGE_DOMAIN)).toBe(vector.expected);
    });
  }

  it('uses the canonical primary type and field order', () => {
    const typedData = paymentRequestTypedData(request(), FORGE_DOMAIN);
    expect(typedData.primaryType).toBe('PaymentRequest');
    expect(typedData.domain).toEqual({
      name: 'Vajra',
      version: '1',
      chainId: FORGE_CHAIN_ID,
      verifyingContract: FORGE_CONTRACT,
    });
    expect(PAYMENT_REQUEST_TYPES.PaymentRequest.map((f) => `${f.name}:${f.type}`)).toEqual([
      'recipient:address',
      'payer:address',
      'amount:uint256',
      'issuedAt:uint64',
      'expiresAt:uint64',
      'nonce:bytes32',
      'memoHash:bytes32',
      'authMode:uint8',
      'authVersion:uint32',
    ]);
  });
});
