"use client";

/**
 * Wallet/data providers scoped to the interactive screens (/request, /pay).
 *
 * Chain, RPC and contract facts come exclusively from lib/chain (the single
 * configuration module). Mainnet-only, fail closed — no testnet fallback.
 * Only the injected connector is offered.
 *
 * `injected` comes from the wagmi root (re-exported from @wagmi/core) — the
 * `wagmi/connectors` barrel statically imports optional wallet SDKs that are
 * not installed, which breaks the production build.
 */

import { useState, type ReactNode } from "react";
import { createConfig, http, injected, WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getChainConfig } from "@/lib/chain";

const chainConfig = getChainConfig();

export const screenWagmiConfig = createConfig({
  chains: [chainConfig.chain],
  connectors: [injected()],
  transports: {
    [chainConfig.chainId]: http(chainConfig.rpcUrl),
  },
  // Next.js App Router: let wagmi hydrate server-rendered markup safely.
  ssr: true,
});

export function ScreenWalletProviders({ children }: { children: ReactNode }) {
  // One QueryClient per browser session, created lazily so state is never
  // shared across requests during SSR.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <WagmiProvider config={screenWagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
