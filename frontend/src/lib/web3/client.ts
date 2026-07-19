/**
 * Shared viem PublicClient for Monad Mainnet reads.
 *
 * One cached instance per process, built from the canonical chain config
 * (lib/web3/chain.ts) — the only configuration source. Reads never go
 * through the wallet's provider: verification must be independent of
 * whatever chain the wallet happens to be on.
 */

import { createPublicClient, http, type PublicClient } from 'viem';
import { getChainConfig, type VajraChainConfig } from './chain';

let cached: { config: VajraChainConfig; client: PublicClient } | null = null;

export function getPublicClient(config: VajraChainConfig = getChainConfig()): PublicClient {
  if (cached && cached.config.rpcUrl === config.rpcUrl) return cached.client;
  const client = createPublicClient({
    chain: config.chain,
    transport: http(config.rpcUrl, { timeout: 15_000 }),
  });
  cached = { config, client };
  return client;
}
