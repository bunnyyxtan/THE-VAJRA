/**
 * Shared read-only viem client for the product screens.
 *
 * Used for every chain read that must work WITHOUT a connected wallet:
 * terms inspection on /pay, receipt verification, activity status re-reads.
 * Configuration comes exclusively from lib/chain — the single config module.
 */

import { createPublicClient, http, type PublicClient } from "viem";
import { getChainConfig, type VajraChainConfig } from "@/lib/chain";

export function getVajraPublicClient(config: VajraChainConfig = getChainConfig()): PublicClient {
  return createPublicClient({
    chain: config.chain,
    transport: http(config.rpcUrl),
  });
}
