/**
 * Typed viem client helpers for VajraNativeV1.
 *
 * Framework-agnostic: every function takes a viem PublicClient (reads) or
 * builds transaction parameters for a wallet layer (writes). No wagmi
 * dependency here — the wallet layer owns connectors; this module owns the
 * contract surface. All reads/writes target the canonical address from
 * lib/chain.ts — the single configuration module.
 *
 * Read functions:  statusOf, settlementOf, passkeyOf, requestId, inspect
 * Write functions: fulfill, revoke, registerPasskey, rotatePasskey, deactivatePasskey
 * Events:          PaymentFulfilled decoding for receipt verification (§14).
 */

import {
  encodeFunctionData,
  parseEventLogs,
  type Address,
  type Hex,
  type Log,
  type PublicClient,
} from 'viem';
import { getChainConfig, type VajraChainConfig } from './chain';
import { VAJRA_ABI } from './contracts/abi';
import type {
  AuthMode,
  AuthProof,
  PasskeyCredential,
  PaymentFulfilledEvent,
  PaymentRequest,
  Settlement,
  ValidationCode,
} from './vajra/types';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

export function vajraAddress(config: VajraChainConfig = getChainConfig()): Address {
  return config.contractAddress;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function readRequestId(
  client: PublicClient,
  request: PaymentRequest,
  config: VajraChainConfig = getChainConfig(),
): Promise<Hex> {
  return client.readContract({
    address: vajraAddress(config),
    abi: VAJRA_ABI,
    functionName: 'requestId',
    args: [request],
  });
}

export async function readStatusOf(
  client: PublicClient,
  requestId: Hex,
  config: VajraChainConfig = getChainConfig(),
): Promise<number> {
  return client.readContract({
    address: vajraAddress(config),
    abi: VAJRA_ABI,
    functionName: 'statusOf',
    args: [requestId],
  });
}

export async function readSettlementOf(
  client: PublicClient,
  requestId: Hex,
  config: VajraChainConfig = getChainConfig(),
): Promise<Settlement> {
  const [payer, recipient, amount, paidAt, memoHash, authMode, authVersion] = await client.readContract({
    address: vajraAddress(config),
    abi: VAJRA_ABI,
    functionName: 'settlementOf',
    args: [requestId],
  });
  return { payer, recipient, amount, paidAt, memoHash, authMode: authMode as AuthMode, authVersion };
}

export async function readPasskeyOf(
  client: PublicClient,
  recipient: Address,
  config: VajraChainConfig = getChainConfig(),
): Promise<PasskeyCredential> {
  const [qx, qy, credentialIdHash, rpIdHash, version, active] = await client.readContract({
    address: vajraAddress(config),
    abi: VAJRA_ABI,
    functionName: 'passkeyOf',
    args: [recipient],
  });
  return { qx, qy, credentialIdHash, rpIdHash, version, active };
}

export interface InspectResult {
  id: Hex;
  code: ValidationCode;
}

/**
 * Dry-run validation for a prospective payer (blueprint §11 Appendix B).
 * The msg.value check is enforced by fulfill at payment time, not here.
 */
export async function inspectRequest(
  client: PublicClient,
  request: PaymentRequest,
  proof: AuthProof,
  prospectivePayer: Address,
  config: VajraChainConfig = getChainConfig(),
): Promise<InspectResult> {
  const [id, code] = await client.readContract({
    address: vajraAddress(config),
    abi: VAJRA_ABI,
    functionName: 'inspect',
    args: [request, proof, prospectivePayer],
  });
  return { id, code: code as ValidationCode };
}

// ---------------------------------------------------------------------------
// Write transaction builders (the wallet layer signs/sends these)
// ---------------------------------------------------------------------------

export interface TxParams {
  to: Address;
  data: Hex;
  value: bigint;
}

/** fulfill(request, proof) with EXACT msg.value = request.amount. */
export function buildFulfillTx(
  request: PaymentRequest,
  proof: AuthProof,
  config: VajraChainConfig = getChainConfig(),
): TxParams {
  return {
    to: vajraAddress(config),
    data: encodeFunctionData({ abi: VAJRA_ABI, functionName: 'fulfill', args: [request, proof] }),
    value: request.amount,
  };
}

/** revoke(request) — callable only by the request recipient. */
export function buildRevokeTx(request: PaymentRequest, config: VajraChainConfig = getChainConfig()): TxParams {
  return {
    to: vajraAddress(config),
    data: encodeFunctionData({ abi: VAJRA_ABI, functionName: 'revoke', args: [request] }),
    value: 0n,
  };
}

export function buildRegisterPasskeyTx(
  credential: Pick<PasskeyCredential, 'qx' | 'qy' | 'credentialIdHash' | 'rpIdHash'>,
  config: VajraChainConfig = getChainConfig(),
): TxParams {
  return {
    to: vajraAddress(config),
    data: encodeFunctionData({
      abi: VAJRA_ABI,
      functionName: 'registerPasskey',
      args: [credential.qx, credential.qy, credential.credentialIdHash, credential.rpIdHash],
    }),
    value: 0n,
  };
}

export function buildRotatePasskeyTx(
  credential: Pick<PasskeyCredential, 'qx' | 'qy' | 'credentialIdHash' | 'rpIdHash'>,
  config: VajraChainConfig = getChainConfig(),
): TxParams {
  return {
    to: vajraAddress(config),
    data: encodeFunctionData({
      abi: VAJRA_ABI,
      functionName: 'rotatePasskey',
      args: [credential.qx, credential.qy, credential.credentialIdHash, credential.rpIdHash],
    }),
    value: 0n,
  };
}

export function buildDeactivatePasskeyTx(config: VajraChainConfig = getChainConfig()): TxParams {
  return {
    to: vajraAddress(config),
    data: encodeFunctionData({ abi: VAJRA_ABI, functionName: 'deactivatePasskey' }),
    value: 0n,
  };
}

// ---------------------------------------------------------------------------
// Event decoding (receipt verification, blueprint §14)
// ---------------------------------------------------------------------------

/**
 * Decodes PaymentFulfilled events from transaction logs, keeping ONLY events
 * emitted by the canonical Vajra contract. Receipt verification additionally
 * requires requestId equality with the locally computed digest (§14 check 3) —
 * callers compare `event.requestId` against their computed value.
 */
export function decodePaymentFulfilledEvents(
  logs: readonly Log[],
  config: VajraChainConfig = getChainConfig(),
): PaymentFulfilledEvent[] {
  const canonical = vajraAddress(config).toLowerCase();
  const parsed = parseEventLogs({
    abi: VAJRA_ABI,
    eventName: 'PaymentFulfilled',
    logs: logs.filter((log) => log.address.toLowerCase() === canonical),
  });
  return parsed.map((log) => ({
    requestId: log.args.requestId,
    payer: log.args.payer,
    recipient: log.args.recipient,
    amount: log.args.amount,
    paidAt: log.args.paidAt,
    memoHash: log.args.memoHash,
    authMode: log.args.authMode as AuthMode,
    authVersion: log.args.authVersion,
  }));
}
