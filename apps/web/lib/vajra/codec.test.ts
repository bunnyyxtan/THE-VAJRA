/**
 * Codec roundtrip and strict-decoder tests (blueprint §17 transport rules,
 * §18 "The request parser must be pure, deterministic and independently tested").
 */

import { describe, expect, it } from 'vitest';
import { VajraError } from '../errors';
import { memoHashOf } from './domain';
import { decodePayload } from './decode';
import { base64UrlToBytes, bytesToBase64Url, encodePayload, type EncodeInput } from './encode';
import { AUTH_MODE, type PaymentRequest } from './types';

const CHAIN_ID = 143;
const CONTRACT = '0x7d17f2765bb58ceb27b9e1e52b068c72ccb8299f' as const;
const EXPECTED = { chainId: CHAIN_ID, verifyingContract: CONTRACT };

const T0 = 1_700_000_000n;

function sampleRequest(overrides: Partial<PaymentRequest> = {}): PaymentRequest {
  return {
    recipient: '0x1111111111111111111111111111111111111111',
    payer: '0x0000000000000000000000000000000000000000',
    amount: 10_000_000_000_000_000n, // 0.01 MON
    issuedAt: T0,
    expiresAt: T0 + 3600n,
    nonce: '0x0000000000000000000000000000000000000000000000000000000000c0ffee',
    memoHash: memoHashOf('Dinner'),
    authMode: AUTH_MODE.Wallet,
    authVersion: 0,
    ...overrides,
  };
}

const WALLET_SIG =
  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1b' as const;

function sampleInput(): EncodeInput {
  return {
    chainId: CHAIN_ID,
    verifyingContract: CONTRACT,
    request: sampleRequest(),
    memo: 'Dinner',
    proof: { kind: 'wallet', signature: WALLET_SIG },
  };
}

function expectCode(fn: () => unknown, code: string, pattern?: RegExp): void {
  try {
    fn();
  } catch (err) {
    expect(err).toBeInstanceOf(VajraError);
    expect((err as VajraError).code).toBe(code);
    if (pattern) expect((err as VajraError).message).toMatch(pattern);
    return;
  }
  throw new Error(`Expected VajraError ${code}, but no error was thrown`);
}

describe('payload codec', () => {
  it('roundtrips a wallet-mode payload byte-exactly', () => {
    const input = sampleInput();
    const encoded = encodePayload(input);
    const again = encodePayload(input);
    expect(encoded).toBe(again); // deterministic

    const decoded = decodePayload(encoded, EXPECTED);
    expect(decoded.request).toEqual(input.request);
    expect(decoded.memo).toBe('Dinner');
    expect(decoded.proof.signature).toBe(WALLET_SIG);
    expect(decoded.envelope.proof.kind).toBe('wallet');
    expect(decoded.envelope.chainId).toBe('143');
    expect(decoded.envelope.v).toBe(1);
  });

  it('roundtrips a webauthn-mode payload', () => {
    const input: EncodeInput = {
      ...sampleInput(),
      request: sampleRequest({ authMode: AUTH_MODE.Passkey, authVersion: 3 }),
      proof: {
        kind: 'webauthn',
        authenticatorData: bytesToBase64Url(new Uint8Array(64).fill(7)),
        clientDataJSON: bytesToBase64Url(new TextEncoder().encode('{"type":"webauthn.get"}')),
        challengeIndex: 20,
        typeIndex: 2,
        r: '0x00000000000000000000000000000000000000000000000000000000000000aa',
        s: '0x00000000000000000000000000000000000000000000000000000000000000bb',
      },
    };
    const decoded = decodePayload(encodePayload(input), EXPECTED);
    expect(decoded.request.authMode).toBe(AUTH_MODE.Passkey);
    expect(decoded.request.authVersion).toBe(3);
    expect(decoded.proof.authenticatorData).toBe('0x' + '07'.repeat(64));
    expect(decoded.proof.challengeIndex).toBe(20n);
    expect(decoded.proof.r).toBe('0x00000000000000000000000000000000000000000000000000000000000000aa');
  });

  it('NFC-normalizes the memo and derives the memoHash from it', () => {
    // "café" with combining accent (NFD) must normalize to NFC.
    const nfd = 'café';
    const input = { ...sampleInput(), memo: nfd, request: sampleRequest({ memoHash: memoHashOf(nfd) }) };
    const decoded = decodePayload(encodePayload(input), EXPECTED);
    expect(decoded.memo).toBe(nfd.normalize('NFC'));
    expect(decoded.request.memoHash).toBe(memoHashOf('café'));
  });

  it('accepts a leading # and a full URL fragment form', () => {
    const encoded = encodePayload(sampleInput());
    expect(decodePayload(`#${encoded}`, EXPECTED).memo).toBe('Dinner');
    expect(decodePayload(`https://vajra.xyz/pay#${encoded}`, EXPECTED).memo).toBe('Dinner');
  });

  it('base64url helpers roundtrip arbitrary bytes without padding', () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 251, 252, 253, 254, 255]);
    const encoded = bytesToBase64Url(bytes);
    expect(encoded).not.toMatch(/[+/=]/);
    expect(base64UrlToBytes(encoded)).toEqual(bytes);
  });
});

describe('strict decoder rejections', () => {
  const good = encodePayload(sampleInput());

  function tamper(mutate: (envelope: Record<string, unknown>) => void): string {
    const json = JSON.parse(new TextDecoder().decode(base64UrlToBytes(good)));
    mutate(json);
    return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(json)));
  }

  it('rejects unknown versions', () => {
    expectCode(() => decodePayload(tamper((j) => (j.v = 2)), EXPECTED), 'PAYLOAD_INVALID', /version/i);
  });

  it('rejects unknown keys at every level', () => {
    expectCode(() => decodePayload(tamper((j) => (j.extra = 1)), EXPECTED), 'PAYLOAD_INVALID', /unknown key/i);
    expectCode(
      () => decodePayload(tamper((j) => ((j.request as Record<string, unknown>).evil = 1)), EXPECTED),
      'PAYLOAD_INVALID',
      /unknown key/i,
    );
    expectCode(
      () => decodePayload(tamper((j) => ((j.proof as Record<string, unknown>).evil = 1)), EXPECTED),
      'PAYLOAD_INVALID',
      /unknown key/i,
    );
  });

  it('rejects missing keys', () => {
    expectCode(
      () => decodePayload(tamper((j) => delete (j.request as Record<string, unknown>).amount), EXPECTED),
      'PAYLOAD_INVALID',
      /missing required key/i,
    );
  });

  it('rejects oversized payloads (> 8 KB)', () => {
    const big = 'A'.repeat(8 * 1024 + 1);
    expectCode(() => decodePayload(big, EXPECTED), 'PAYLOAD_TOO_LARGE');
  });

  it('rejects scientific notation, floats, signs and leading zeros in numbers', () => {
    for (const bad of ['1e18', '1.5', '-1', '+1', '01', ' 1', '1 ']) {
      expectCode(
        () =>
          decodePayload(
            tamper((j) => ((j.request as Record<string, unknown>).amount = bad)),
            EXPECTED,
          ),
        'PAYLOAD_INVALID',
        /decimal/i,
      );
    }
  });

  it('rejects numbers with wrong JSON types', () => {
    expectCode(
      () => decodePayload(tamper((j) => ((j.request as Record<string, unknown>).amount = 100)), EXPECTED),
      'PAYLOAD_INVALID',
    );
    expectCode(
      () => decodePayload(tamper((j) => ((j.request as Record<string, unknown>).issuedAt = 1.5)), EXPECTED),
      'PAYLOAD_INVALID',
    );
  });

  it('rejects uint64 overflow and unsafe amounts', () => {
    expectCode(
      () =>
        decodePayload(
          tamper((j) => ((j.request as Record<string, unknown>).issuedAt = '18446744073709551616')),
          EXPECTED,
        ),
      'PAYLOAD_INVALID',
      /uint64/i,
    );
    expectCode(
      () =>
        decodePayload(
          tamper((j) => ((j.request as Record<string, unknown>).amount = '0')),
          EXPECTED,
        ),
      'PAYLOAD_INVALID',
      /positive/i,
    );
  });

  it('rejects wrong chain and wrong contract (fail closed)', () => {
    expectCode(
      () => decodePayload(tamper((j) => (j.chainId = '1')), EXPECTED),
      'WRONG_CHAIN',
    );
    expectCode(
      () =>
        decodePayload(
          tamper((j) => (j.verifyingContract = '0x000000000000000000000000000000000000dEaD')),
          EXPECTED,
        ),
      'PAYLOAD_INVALID',
      /canonical/i,
    );
  });

  it('rejects invalid addresses, zero recipient and zero nonce', () => {
    expectCode(
      () => decodePayload(tamper((j) => ((j.request as Record<string, unknown>).recipient = '0x123')), EXPECTED),
      'PAYLOAD_INVALID',
    );
    expectCode(
      () =>
        decodePayload(
          tamper(
            (j) => ((j.request as Record<string, unknown>).recipient = '0x0000000000000000000000000000000000000000'),
          ),
          EXPECTED,
        ),
      'PAYLOAD_INVALID',
      /non-zero/i,
    );
    expectCode(
      () =>
        decodePayload(
          tamper(
            (j) =>
              ((j.request as Record<string, unknown>).nonce =
                '0x0000000000000000000000000000000000000000000000000000000000000000'),
          ),
          EXPECTED,
        ),
      'PAYLOAD_INVALID',
      /nonce/i,
    );
  });

  it('rejects inverted time windows', () => {
    expectCode(
      () =>
        decodePayload(
          tamper((j) => {
            (j.request as Record<string, unknown>).issuedAt = '1700003600';
            (j.request as Record<string, unknown>).expiresAt = '1700000000';
          }),
          EXPECTED,
        ),
      'PAYLOAD_INVALID',
    );
  });

  it('rejects control characters and lone surrogates in memo', () => {
    expectCode(
      () => decodePayload(tamper((j) => ((j.request as Record<string, unknown>).memo = 'hi\u0001there')), EXPECTED),
      'PAYLOAD_INVALID',
      /control/i,
    );
    expectCode(
      () => decodePayload(tamper((j) => ((j.request as Record<string, unknown>).memo = 'bidi‮x')), EXPECTED),
      'PAYLOAD_INVALID',
      /control/i,
    );
    const loneSurrogate = bytesToBase64Url(
      new TextEncoder().encode(
        JSON.stringify({
          ...JSON.parse(new TextDecoder().decode(base64UrlToBytes(good))),
          request: {
            ...JSON.parse(new TextDecoder().decode(base64UrlToBytes(good))).request,
            memo: '\ud800',
          },
        }),
      ),
    );
    expectCode(() => decodePayload(loneSurrogate, EXPECTED), 'PAYLOAD_INVALID', /surrogate/i);
  });

  it('rejects memos over 96 UTF-8 bytes', () => {
    expectCode(
      () =>
        decodePayload(
          tamper((j) => ((j.request as Record<string, unknown>).memo = 'x'.repeat(97))),
          EXPECTED,
        ),
      'PAYLOAD_INVALID',
      /96/,
    );
  });

  it('rejects authMode/proof mismatches', () => {
    expectCode(
      () =>
        decodePayload(
          tamper((j) => {
            (j.request as Record<string, unknown>).authMode = 'passkey';
            (j.request as Record<string, unknown>).authVersion = '1';
          }),
          EXPECTED,
        ),
      'PAYLOAD_INVALID',
      /proof/i,
    );
    expectCode(
      () =>
        decodePayload(
          tamper((j) => ((j.proof as Record<string, unknown>).kind = 'webauthn')),
          EXPECTED,
        ),
      'PAYLOAD_INVALID',
    );
  });

  it('rejects invalid base64url and non-JSON bodies', () => {
    expectCode(() => decodePayload('!!!not-base64!!!', EXPECTED), 'PAYLOAD_INVALID');
    expectCode(() => decodePayload(bytesToBase64Url(new TextEncoder().encode('{"v":1')), EXPECTED), 'PAYLOAD_INVALID');
    expectCode(() => decodePayload('', EXPECTED), 'PAYLOAD_INVALID');
  });
});
