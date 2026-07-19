"use client";

/**
 * App-wide providers: wagmi (wallet) + TanStack Query (async chain state).
 *
 * Chain configuration comes exclusively from lib/chain.ts — the single
 * configuration module (blueprint §18). Monad Mainnet (chain ID 143) is the
 * only configured chain; there is no testnet fallback. Only the injected
 * connector is offered (no WalletConnect project ID is provisioned).
 */

import { useState, type ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getChainConfig } from "@/lib/chain";

const chainConfig = getChainConfig();

export const wagmiConfig = createConfig({
  chains: [chainConfig.chain],
  connectors: [injected()],
  transports: {
    [chainConfig.chainId]: http(chainConfig.rpcUrl),
  },
  // Next.js App Router: let wagmi hydrate server-rendered markup safely.
  ssr: true,
});

export function Providers({ children }: { children: ReactNode }) {
  // One QueryClient per browser session, created lazily so state is never
  // shared across requests during SSR.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: true,
          },
        },
      })
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
