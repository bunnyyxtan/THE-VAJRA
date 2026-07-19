/**
 * EIP-712 typed-data construction and canonical requestId computation (viem).
 *
 * MUST match VajraNativeV1._requestId exactly:
 *   domainSeparator = keccak256(abi.encode(DOMAIN_TYPEHASH, keccak256("Vajra"),
 *     keccak256("1"), chainId, verifyingContract))
 *   structHash      = keccak256(abi.encode(PAYMENT_REQUEST_TYPEHASH, recipient,
 *     payer, amount, issuedAt, expiresAt, nonce, memoHash, authMode, authVersion))
 *   requestId       = keccak256("\x19\x01" || domainSeparator || structHash)
 *
 * viem's hashTypedData performs precisely this construction. Parity against the
 * frozen Solidity vectors (contracts/test/Vectors.t.sol) is asserted in
 * hash.test.ts — TS == Solidity is a release blocker (blueprint §22).
 */

import { hashTypedData, type Address, type TypedDataDomain } from 'viem';
import { getChainConfig } from '../chain';
import type { Bytes32, PaymentRequest } from './types';

export const EIP712_DOMAIN_NAME = 'Vajra';
export const EIP712_DOMAIN_VERSION = '1';

/**
 * The canonical EIP-712 type string (blueprint Appendix A). Field order is the
 * canonical order shared with the Solidity struct.
 */
export const PAYMENT_REQUEST_TYPE_STRING =
  'PaymentRequest(address recipient,address payer,uint256 amount,uint64 issuedAt,uint64 expiresAt,bytes32 nonce,bytes32 memoHash,uint8 authMode,uint32 authVersion)' as const;

/** viem typed-data definition for the canonical request. */
export const PAYMENT_REQUEST_TYPES = {
  PaymentRequest: [
    { name: 'recipient', type: 'address' },
    { name: 'payer', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'issuedAt', type: 'uint64' },
    { name: 'expiresAt', type: 'uint64' },
    { name: 'nonce', type: 'bytes32' },
    { name: 'memoHash', type: 'bytes32' },
    { name: 'authMode', type: 'uint8' },
    { name: 'authVersion', type: 'uint32' },
  ],
} as const;

export interface VajraDomain {
  chainId: number;
  verifyingContract: Address;
}

/** The production domain: Monad Mainnet (143) + canonical contract. */
export function canonicalDomain(): VajraDomain {
  const config = getChainConfig();
  return { chainId: config.chainId, verifyingContract: config.contractAddress };
}

export function typedDataDomain(domain: VajraDomain): TypedDataDomain {
  return {
    name: EIP712_DOMAIN_NAME,
    version: EIP712_DOMAIN_VERSION,
    chainId: domain.chainId,
    verifyingContract: domain.verifyingContract,
  };
}

/**
 * Full EIP-712 typed-data payload for a request. In wallet-auth mode the
 * recipient signs exactly this; the resulting signature verifies onchain
 * against the same digest (SignatureChecker over requestId).
 */
export function paymentRequestTypedData(request: PaymentRequest, domain: VajraDomain = canonicalDomain()) {
  return {
    domain: typedDataDomain(domain),
    types: PAYMENT_REQUEST_TYPES,
    primaryType: 'PaymentRequest' as const,
    message: {
      recipient: request.recipient,
      payer: request.payer,
      amount: request.amount,
      issuedAt: request.issuedAt,
      expiresAt: request.expiresAt,
      nonce: request.nonce,
      memoHash: request.memoHash,
      authMode: request.authMode,
      authVersion: request.authVersion,
    },
  };
}

/**
 * The canonical request identifier — identical to VajraNativeV1.requestId().
 * This digest is also the WebAuthn challenge for passkey-authenticated
 * requests (base64url-encoded by the WebAuthn layer).
 */
export function computeRequestId(request: PaymentRequest, domain: VajraDomain = canonicalDomain()): Bytes32 {
  return hashTypedData(paymentRequestTypedData(request, domain));
}
