/**
 * Wagmi configuration scoped to the request-creation flow.
 *
 * Chain, RPC and contract facts come exclusively from lib/chain (the single
 * configuration module); nothing is re-declared here. Mainnet-only, fail
 * closed — there is no testnet fallback.
 */
// `injected` comes from the wagmi root (re-exported from @wagmi/core) — the
// `wagmi/connectors` barrel statically imports optional wallet SDKs that are
// not installed, which breaks the production build.
import { createConfig, http, injected } from "wagmi";
import { getChainConfig } from "@/lib/chain";

const chainConfig = getChainConfig();

export const wagmiConfig = createConfig({
  chains: [chainConfig.chain],
  connectors: [injected()],
  transports: {
    [chainConfig.chainId]: http(chainConfig.rpcUrl),
  },
});
