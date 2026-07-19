"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { getChainConfig } from "@/lib/chain";
import { ToastProvider } from "@/components/ui/Toast";

/**
 * Wallet + query providers. Chain, RPC and connector configuration come
 * from lib/chain.ts — the single configuration module (mainnet only).
 */
export function Providers({ children }: { children: ReactNode }) {
  const [clients] = useState(() => {
    const chain = getChainConfig();
    const wagmiConfig = createConfig({
      chains: [chain.chain],
      connectors: [injected()],
      transports: { [chain.chain.id]: http(chain.rpcUrl) },
      ssr: true,
    });
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5_000,
          refetchOnWindowFocus: true,
          retry: 2,
        },
      },
    });
    return { wagmiConfig, queryClient };
  });

  return (
    <WagmiProvider config={clients.wagmiConfig}>
      <QueryClientProvider client={clients.queryClient}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
