/**
 * VAJRA canonical chain & contract configuration (blueprint §18 architecture rules:
 * "Contract addresses, chain ID, explorer URLs and RPC endpoints must come from one
 * configuration module" and "Production configuration must fail closed when the
 * contract address is missing or invalid").
 *
 * This module is the ONLY place the frontend reads chain configuration.
 * Resolution order for each value:
 *   1. Environment variable, if set (must pass strict validation).
 *   2. The canonical constant baked in here (the live, verified mainnet deployment).
 *
 * Fail-closed rules:
 *   - An env-provided contract address that is missing/empty is treated as unset.
 *   - An env-provided contract address that is malformed throws CONFIG_INVALID.
 *   - An env-provided chain ID that is not "143" throws CONFIG_INVALID.
 *   - An env-provided explorer URL that is not a valid https URL throws CONFIG_INVALID.
 * There are no testnet fallbacks anywhere in this module (log.md: mainnet-first).
 */

import { defineChain, getAddress, isAddress, type Address, type Chain } from 'viem';
import { VajraError } from './errors';

export const MONAD_MAINNET_CHAIN_ID = 143;
export const MONAD_MAINNET_NAME = 'Monad Mainnet';
export const MONAD_MAINNET_RPC_URL = 'https://rpc.monad.xyz';
export const MONADSCAN_URL = 'https://monadscan.com';
export const MONADVISION_URL = 'https://monadvision.com';
export const MON_NATIVE_CURRENCY = { name: 'Monad', symbol: 'MON', decimals: 18 } as const;

/**
 * The canonical VajraNativeV1 deployment on Monad Mainnet.
 * Verified on Sourcify (full match) and Monadscan; smoke-tested with real
 * mainnet transactions. See log.md "2026-07-19 — MAINNET DEPLOYMENT COMPLETE".
 */
export const CANONICAL_CONTRACT_ADDRESS: Address = '0x7d17f2765bb58ceb27b9e1e52b068c72ccb8299f';

export interface VajraChainConfig {
  chainId: typeof MONAD_MAINNET_CHAIN_ID;
  chainName: typeof MONAD_MAINNET_NAME;
  rpcUrl: string;
  contractAddress: Address;
  /** Primary explorer (Monadscan). */
  explorerUrl: string;
  /** Secondary explorer (MonadVision), offered as an alternative view. */
  altExplorerUrl: string;
  /** viem chain definition for Monad Mainnet. */
  chain: Chain;
}

type EnvLike = Record<string, string | undefined>;

function resolveChainId(env: EnvLike): typeof MONAD_MAINNET_CHAIN_ID {
  const raw = env.EXPO_PUBLIC_VAJRA_CHAIN_ID ?? env.NEXT_PUBLIC_VAJRA_CHAIN_ID;
  if (raw === undefined || raw.trim() === '') return MONAD_MAINNET_CHAIN_ID;
  if (raw.trim() !== String(MONAD_MAINNET_CHAIN_ID)) {
    throw new VajraError(
      'CONFIG_INVALID',
      `NEXT_PUBLIC_VAJRA_CHAIN_ID must be ${MONAD_MAINNET_CHAIN_ID} (Monad Mainnet); got "${raw}". ` +
        'Vajra is mainnet-only and has no testnet fallback.',
    );
  }
  return MONAD_MAINNET_CHAIN_ID;
}

function resolveContractAddress(env: EnvLike): Address {
  const raw = env.EXPO_PUBLIC_VAJRA_CONTRACT_ADDRESS ?? env.NEXT_PUBLIC_VAJRA_CONTRACT_ADDRESS;
  if (raw === undefined || raw.trim() === '') return CANONICAL_CONTRACT_ADDRESS;
  const candidate = raw.trim();
  if (!isAddress(candidate, { strict: false })) {
    throw new VajraError(
      'CONFIG_INVALID',
      `NEXT_PUBLIC_VAJRA_CONTRACT_ADDRESS is not a valid address: "${candidate}". ` +
        `The canonical VajraNativeV1 deployment is ${CANONICAL_CONTRACT_ADDRESS}.`,
    );
  }
  return getAddress(candidate);
}

function resolveExplorerUrl(env: EnvLike): string {
  const raw = env.EXPO_PUBLIC_VAJRA_EXPLORER_URL ?? env.NEXT_PUBLIC_VAJRA_EXPLORER_URL;
  if (raw === undefined || raw.trim() === '') return MONADSCAN_URL;
  const candidate = raw.trim().replace(/\/+$/, '');
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new VajraError(
      'CONFIG_INVALID',
      `NEXT_PUBLIC_VAJRA_EXPLORER_URL is not a valid URL: "${candidate}".`,
    );
  }
  if (parsed.protocol !== 'https:') {
    throw new VajraError(
      'CONFIG_INVALID',
      `NEXT_PUBLIC_VAJRA_EXPLORER_URL must use https: "${candidate}".`,
    );
  }
  return candidate;
}

function resolveRpcUrl(env: EnvLike): string {
  // Server-side code may set VAJRA_RPC_URL; browser code can only see NEXT_PUBLIC_*.
  const raw = env.EXPO_PUBLIC_VAJRA_RPC_URL ?? env.NEXT_PUBLIC_VAJRA_RPC_URL ?? env.VAJRA_RPC_URL;
  if (raw === undefined || raw.trim() === '') return MONAD_MAINNET_RPC_URL;
  const candidate = raw.trim();
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new VajraError('CONFIG_INVALID', `Configured RPC URL is not a valid URL: "${candidate}".`);
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'wss:') {
    throw new VajraError('CONFIG_INVALID', `Configured RPC URL must use https/wss: "${candidate}".`);
  }
  return candidate;
}

let cached: VajraChainConfig | null = null;

/**
 * Resolves and validates the chain configuration. Throws VajraError
 * CONFIG_INVALID on any invalid override — there is no degraded mode.
 * The result is cached per process; pass a custom env for tests.
 */
export function getChainConfig(env: EnvLike = process.env): VajraChainConfig {
  if (env === process.env && cached) return cached;

  const rpcUrl = resolveRpcUrl(env);
  const explorerUrl = resolveExplorerUrl(env);
  const config: VajraChainConfig = {
    chainId: resolveChainId(env),
    chainName: MONAD_MAINNET_NAME,
    rpcUrl,
    contractAddress: resolveContractAddress(env),
    explorerUrl,
    altExplorerUrl: MONADVISION_URL,
    chain: defineChain({
      id: MONAD_MAINNET_CHAIN_ID,
      name: MONAD_MAINNET_NAME,
      nativeCurrency: MON_NATIVE_CURRENCY,
      rpcUrls: { default: { http: [rpcUrl] } },
      blockExplorers: {
        default: { name: 'Monadscan', url: explorerUrl },
        monadvision: { name: 'MonadVision', url: MONADVISION_URL },
      },
    }),
  };

  if (env === process.env) cached = config;
  return config;
}

/**
 * Explorer URL builders. Blueprint §20: never construct explorer URLs from
 * payload fields — only from this module's validated base URL and a
 * locally-computed hash/address.
 */
export function explorerTxUrl(txHash: `0x${string}`, config: VajraChainConfig = getChainConfig()): string {
  return `${config.explorerUrl}/tx/${txHash}`;
}

export function explorerAddressUrl(address: Address, config: VajraChainConfig = getChainConfig()): string {
  return `${config.explorerUrl}/address/${address}`;
}
