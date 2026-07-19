/**
 * VAJRA single error shape (blueprint §23, Constitution process rules).
 *
 * Every failure surfaced to the UI is a VajraError with a SCREAMING_SNAKE code.
 * `userCopy(code)` answers the four mandatory questions for every transaction
 * error: what happened, whether funds moved, whether retry is safe, and how the
 * user can independently verify the state. Raw RPC/Solidity output is never
 * primary production copy — it is kept on `cause` for local development only.
 */

import { BaseError, ContractFunctionRevertedError, decodeErrorResult } from 'viem';
import { VAJRA_ABI } from './contracts/abi';

export const ERROR_CODES = [
  'CONFIG_INVALID',
  'PAYLOAD_INVALID',
  'PAYLOAD_TOO_LARGE',
  'MEMO_TOO_LONG',
  'WALLET_REJECTED',
  'WALLET_UNAVAILABLE',
  'WRONG_CHAIN',
  'RPC_UNAVAILABLE',
  'SIMULATION_REVERTED',
  'TX_REVERTED',
  'REQUEST_EXPIRED',
  'REQUEST_ALREADY_PAID',
  'REQUEST_REVOKED',
  'WRONG_PAYER',
  'INACTIVE_PASSKEY',
  'WRONG_PASSKEY_VERSION',
  'INVALID_WALLET_SIGNATURE',
  'INVALID_PASSKEY_PROOF',
  'INCORRECT_VALUE',
  'NATIVE_TRANSFER_FAILED',
  'DIRECT_PAYMENTS_DISABLED',
  'VERIFICATION_DELAYED',
  'UNKNOWN',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export class VajraError extends Error {
  readonly code: ErrorCode;
  override readonly cause?: unknown;

  constructor(code: ErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'VajraError';
    this.code = code;
    this.cause = cause;
  }
}

export interface UserErrorCopy {
  /** Short headline: what happened. */
  title: string;
  /** Plain-language explanation of what happened. */
  whatHappened: string;
  /** Whether any funds moved. */
  fundsMoved: string;
  /** Whether retry is safe, and under what conditions. */
  retrySafe: string;
  /** How the user can independently verify the state. */
  howToVerify: string;
}

const COPY: Record<ErrorCode, UserErrorCopy> = {
  CONFIG_INVALID: {
    title: 'App configuration error',
    whatHappened:
      'The application is missing or has an invalid contract or network configuration. This is a deployment problem, not something you did.',
    fundsMoved: 'No funds moved. No transaction was created.',
    retrySafe: 'Retrying will not help until the deployment configuration is fixed.',
    howToVerify:
      'Check the /api/health endpoint of this deployment, which reports the configured chain and contract-address presence without secrets.',
  },
  PAYLOAD_INVALID: {
    title: 'This payment link is not valid',
    whatHappened:
      'The shared request data failed strict validation. It may be corrupted, truncated, tampered with, or produced by a different application.',
    fundsMoved: 'No funds moved. Nothing was submitted.',
    retrySafe: 'Do not retry with this link. Ask the recipient to generate a fresh request link.',
    howToVerify:
      'Compare the Vajra Code and full recipient address with the recipient through a separate channel before paying any link.',
  },
  PAYLOAD_TOO_LARGE: {
    title: 'This payment link is too large',
    whatHappened: 'The shared request data exceeds the 8 KB transport limit and was rejected before parsing.',
    fundsMoved: 'No funds moved. Nothing was submitted.',
    retrySafe: 'Do not retry with this link. Ask the recipient to generate a fresh request link.',
    howToVerify: 'Ask the recipient to confirm the request directly or share it again.',
  },
  MEMO_TOO_LONG: {
    title: 'Memo is too long',
    whatHappened: 'The memo exceeds 96 UTF-8 bytes after normalization, which is the protocol limit.',
    fundsMoved: 'No funds moved. The request was not created.',
    retrySafe: 'Safe to retry with a shorter memo.',
    howToVerify: 'The memo limit is defined by the contract constant MAX_MEMO_BYTES (96).',
  },
  WALLET_REJECTED: {
    title: 'Rejected in wallet',
    whatHappened: 'You declined the signature or transaction in your wallet.',
    fundsMoved: 'No transaction was sent. No funds moved.',
    retrySafe: 'You can retry safely whenever you are ready.',
    howToVerify: 'No transaction hash exists, so there is nothing to look up. Your wallet history will show no submission.',
  },
  WALLET_UNAVAILABLE: {
    title: 'No wallet available',
    whatHappened: 'No compatible wallet was detected, or the wallet connection failed before any request was made.',
    fundsMoved: 'No funds moved. Nothing was submitted.',
    retrySafe: 'Safe to retry after installing or unlocking a wallet that supports Monad Mainnet (chain ID 143).',
    howToVerify: 'Confirm your wallet is connected to Monad Mainnet, chain ID 143.',
  },
  WRONG_CHAIN: {
    title: 'Wrong network',
    whatHappened:
      'Your wallet is connected to a different network than Monad Mainnet (chain ID 143), or the link was created for a different chain.',
    fundsMoved: 'No funds moved. The transaction was not submitted.',
    retrySafe: 'Safe to retry after switching your wallet to Monad Mainnet (chain ID 143).',
    howToVerify: 'Check the network indicator in your wallet; it must read Monad Mainnet, chain ID 143.',
  },
  RPC_UNAVAILABLE: {
    title: 'Network connection problem',
    whatHappened:
      'The Monad RPC endpoint is temporarily unreachable or did not answer. We cannot confirm the current chain state.',
    fundsMoved:
      'Unknown. We do not infer failure or success. If you already submitted a transaction, its hash is preserved in your local activity.',
    retrySafe: 'Verification retry is safe. Do not submit a second payment until the first one is verified or ruled out.',
    howToVerify:
      'Paste your transaction hash into monadscan.com, or re-open your receipt link once connectivity returns. The app re-reads the contract state on retry.',
  },
  SIMULATION_REVERTED: {
    title: 'Payment would fail onchain',
    whatHappened:
      'A pre-flight simulation against the live contract reverted, so the payment was not sent. The specific reason is shown alongside this message.',
    fundsMoved: 'Payment was not sent. No funds moved.',
    retrySafe:
      'Only retry after the shown reason is resolved (for example: request re-created, correct wallet connected, request still within its time window).',
    howToVerify: 'Re-open the request link to re-run inspection against the contract before paying.',
  },
  TX_REVERTED: {
    title: 'Transaction reverted onchain',
    whatHappened: 'The transaction was included in a block but the contract rejected it.',
    fundsMoved: 'The Vajra payment did not settle. Only the gas fee was consumed.',
    retrySafe: 'Safe to retry only after re-inspecting the request; the revert reason is shown alongside this message.',
    howToVerify: 'Open the transaction hash on monadscan.com to see the revert status and reason.',
  },
  REQUEST_EXPIRED: {
    title: 'This request has expired',
    whatHappened: 'The request’s expiry time has passed. Expired requests can never transfer MON.',
    fundsMoved: 'No funds moved.',
    retrySafe: 'Do not retry this request. Ask the recipient to create a fresh request.',
    howToVerify: 'The expiry timestamp is part of the signed request terms shown on the payment page.',
  },
  REQUEST_ALREADY_PAID: {
    title: 'This request is already paid',
    whatHappened: 'The contract shows this request as settled. Each Vajra request can be paid exactly once.',
    fundsMoved: 'Funds already moved in the earlier settlement transaction — not in anything you just did.',
    retrySafe: 'Do not attempt another payment.',
    howToVerify: 'Open the existing settlement receipt at /receipt/<requestId> or check statusOf on monadscan.com.',
  },
  REQUEST_REVOKED: {
    title: 'This request was revoked',
    whatHappened: 'The recipient revoked this request before it was paid. It can no longer be fulfilled.',
    fundsMoved: 'No funds moved.',
    retrySafe: 'Do not retry. Ask the recipient for a new request if payment is still intended.',
    howToVerify: 'statusOf(requestId) on the canonical contract returns Revoked; see the PaymentRevoked event on monadscan.com.',
  },
  WRONG_PAYER: {
    title: 'This request is addressed to another wallet',
    whatHappened:
      'The recipient restricted this request to a specific payer address, and the connected wallet is not that address.',
    fundsMoved: 'No funds moved. No payment action is possible from this wallet.',
    retrySafe: 'Do not retry from this wallet. Connect the wallet the request was addressed to, or ask the recipient for an open request.',
    howToVerify: 'The restricted payer address is part of the signed request terms shown on the payment page.',
  },
  INACTIVE_PASSKEY: {
    title: 'Recipient passkey is not active',
    whatHappened: 'The recipient’s passkey credential is deactivated, so passkey-authorized requests cannot be fulfilled.',
    fundsMoved: 'No funds moved.',
    retrySafe: 'Do not retry. The recipient must authorize a new request with wallet signature or an active passkey.',
    howToVerify: 'passkeyOf(recipient) on the canonical contract shows the credential as inactive.',
  },
  WRONG_PASSKEY_VERSION: {
    title: 'Request signed by a replaced passkey',
    whatHappened:
      'The recipient rotated or deactivated their passkey after this request was created, so this request’s key version is stale.',
    fundsMoved: 'No funds moved.',
    retrySafe: 'Do not retry. The recipient must create a new request using the active credential.',
    howToVerify: 'passkeyOf(recipient) on the canonical contract shows the current active version; compare with the request’s authVersion.',
  },
  INVALID_WALLET_SIGNATURE: {
    title: 'Recipient signature does not verify',
    whatHappened: 'The EIP-712 signature attached to the request does not verify against the recipient address onchain.',
    fundsMoved: 'No funds moved.',
    retrySafe: 'Do not retry with this link. Ask the recipient to re-create and re-sign the request.',
    howToVerify: 'The request digest and signature can be checked with the contract’s inspect function.',
  },
  INVALID_PASSKEY_PROOF: {
    title: 'Passkey proof does not verify',
    whatHappened: 'The WebAuthn assertion attached to the request failed onchain P-256 verification.',
    fundsMoved: 'No funds moved.',
    retrySafe: 'Do not retry with this link. Ask the recipient to re-create the request with their registered device.',
    howToVerify: 'The contract’s inspect function returns the exact validation failure for this proof.',
  },
  INCORRECT_VALUE: {
    title: 'Amount mismatch',
    whatHappened: 'The transaction value did not exactly equal the request amount. The contract requires an exact match.',
    fundsMoved: 'No funds moved.',
    retrySafe: 'Safe to retry through the payment page, which always submits the exact signed amount.',
    howToVerify: 'The signed amount is shown on the payment page and in the request terms.',
  },
  NATIVE_TRANSFER_FAILED: {
    title: 'Recipient rejected the transfer',
    whatHappened: 'The recipient contract rejected the native MON transfer, so the whole settlement reverted.',
    fundsMoved: 'No funds moved to the recipient; the request remains unpaid. Only the gas fee was consumed.',
    retrySafe: 'Retrying against the same recipient will fail again. The recipient must use an address that can receive native MON.',
    howToVerify: 'statusOf(requestId) on the canonical contract still returns Unused.',
  },
  DIRECT_PAYMENTS_DISABLED: {
    title: 'Direct transfers are disabled',
    whatHappened: 'The Vajra contract rejects plain MON transfers; payments must go through a signed request.',
    fundsMoved: 'No funds moved beyond gas.',
    retrySafe: 'Use a Vajra payment link instead of sending MON to the contract address.',
    howToVerify: 'The contract has no balance-keeping logic; see the verified source on monadscan.com.',
  },
  VERIFICATION_DELAYED: {
    title: 'Verification delayed',
    whatHappened:
      'Your transaction may be successful, but one or more proof sources (receipt, event, contract state, finality) are temporarily unavailable.',
    fundsMoved: 'Unknown — that is exactly what we are still verifying. We do not claim success without receipt, event, and state.',
    retrySafe: 'Do not submit a second payment. Verification retry is safe and resumes from the preserved transaction hash.',
    howToVerify: 'Paste the transaction hash into monadscan.com, or wait — the app keeps the hash and re-checks automatically.',
  },
  UNKNOWN: {
    title: 'Something went wrong',
    whatHappened: 'An unexpected error occurred that we could not classify. No success is claimed.',
    fundsMoved: 'If a transaction hash exists in your activity, check it before assuming anything moved.',
    retrySafe: 'Retry only after checking whether a transaction was already submitted.',
    howToVerify: 'Check your wallet history and any preserved transaction hash on monadscan.com.',
  },
};

export function userCopy(code: ErrorCode): UserErrorCopy {
  return COPY[code];
}

/** Maps contract custom-error names to stable application codes. */
const CONTRACT_ERROR_TO_CODE: Record<string, ErrorCode> = {
  ZeroRecipient: 'PAYLOAD_INVALID',
  ZeroAmount: 'PAYLOAD_INVALID',
  InvalidNonce: 'PAYLOAD_INVALID',
  MemoTooLong: 'MEMO_TOO_LONG',
  InvalidTimeWindow: 'SIMULATION_REVERTED',
  RequestExpired: 'REQUEST_EXPIRED',
  RequestAlreadyPaid: 'REQUEST_ALREADY_PAID',
  RequestRevoked: 'REQUEST_REVOKED',
  WrongPayer: 'WRONG_PAYER',
  InvalidWalletSignature: 'INVALID_WALLET_SIGNATURE',
  InvalidPasskeyProof: 'INVALID_PASSKEY_PROOF',
  InactivePasskey: 'INACTIVE_PASSKEY',
  WrongPasskeyVersion: 'WRONG_PASSKEY_VERSION',
  IncorrectValue: 'INCORRECT_VALUE',
  NativeTransferFailed: 'NATIVE_TRANSFER_FAILED',
  DirectPaymentsDisabled: 'DIRECT_PAYMENTS_DISABLED',
};

function isUserRejection(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const anyErr = err as { code?: unknown; name?: unknown; message?: unknown };
  // EIP-1193 4001, ethers/viem ACTION_REJECTED, and common wallet wordings.
  if (anyErr.code === 4001 || anyErr.code === 'ACTION_REJECTED') return true;
  if (anyErr.name === 'UserRejectedRequestError') return true;
  const msg = typeof anyErr.message === 'string' ? anyErr.message.toLowerCase() : '';
  return msg.includes('user rejected') || msg.includes('user denied') || msg.includes('rejected the request');
}

function looksLikeTransport(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const name = String((err as { name?: unknown }).name ?? '');
  if (
    name === 'HttpRequestError' ||
    name === 'TimeoutError' ||
    name === 'WebSocketRequestError' ||
    name === 'RpcRequestError' ||
    name === 'TransportNotConfiguredError'
  ) {
    return true;
  }
  const msg = String((err as { message?: unknown }).message ?? '').toLowerCase();
  return (
    msg.includes('fetch failed') ||
    msg.includes('network error') ||
    msg.includes('failed to fetch') ||
    msg.includes('etimedout') ||
    msg.includes('econnrefused') ||
    msg.includes('socket hang up')
  );
}

/**
 * Classifies any thrown value into a VajraError with a stable code.
 * Known wallet, transport, revert and validation conditions map to specific
 * codes; anything unrecognized becomes UNKNOWN with the original error kept
 * on `cause` for local development logging only.
 */
export function classifyError(err: unknown, context?: { simulation?: boolean }): VajraError {
  if (err instanceof VajraError) return err;

  if (isUserRejection(err)) {
    return new VajraError('WALLET_REJECTED', 'The request was rejected in the wallet.', err);
  }

  // viem nests the useful causes inside BaseError; walk the chain.
  if (err instanceof BaseError) {
    const reverted = err.walk((e) => e instanceof ContractFunctionRevertedError) as
      | ContractFunctionRevertedError
      | undefined;
    if (reverted) {
      const errorName = reverted.data?.errorName ?? reverted.shortMessage;
      const mapped = errorName ? CONTRACT_ERROR_TO_CODE[errorName] : undefined;
      const code: ErrorCode = mapped ?? (context?.simulation ? 'SIMULATION_REVERTED' : 'TX_REVERTED');
      return new VajraError(code, `Contract reverted${errorName ? `: ${errorName}` : '.'}`, err);
    }
    if (looksLikeTransport(err)) {
      return new VajraError('RPC_UNAVAILABLE', 'The Monad RPC endpoint did not answer.', err);
    }
    if (err.name === 'ChainMismatchError' || err.shortMessage?.toLowerCase().includes('chain')) {
      return new VajraError('WRONG_CHAIN', 'The connected wallet is on the wrong chain.', err);
    }
  }

  // Raw revert data from non-viem paths: try to decode against the contract ABI.
  const data = (err as { data?: unknown })?.data;
  if (typeof data === 'string' && data.startsWith('0x')) {
    try {
      const decoded = decodeErrorResult({ abi: VAJRA_ABI, data: data as `0x${string}` });
      const mapped = CONTRACT_ERROR_TO_CODE[decoded.errorName];
      if (mapped) {
        return new VajraError(mapped, `Contract reverted: ${decoded.errorName}`, err);
      }
    } catch {
      // Not a known Vajra revert; fall through.
    }
  }

  if (looksLikeTransport(err)) {
    return new VajraError('RPC_UNAVAILABLE', 'The Monad RPC endpoint did not answer.', err);
  }

  const message = err instanceof Error ? err.message : 'Unknown error';
  return new VajraError('UNKNOWN', message, err);
}
