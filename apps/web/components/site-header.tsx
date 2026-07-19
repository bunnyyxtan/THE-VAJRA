"use client";

import Link from "next/link";
import { useAccount, useChainId, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { getChainConfig, MONAD_MAINNET_NAME } from "@/lib/chain";
import styles from "./site-header.module.css";

const chain = getChainConfig();

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/**
 * Wallet chrome for the header — quiet, neutral, never the primary action.
 * Three real states: disconnected (connect via the injected connector),
 * wrong network (explicit switch to Monad Mainnet), ready (address pill;
 * activating it disconnects). Loading stages carry their own stage text.
 */
function HeaderWallet() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const connect = useConnect();
  const disconnect = useDisconnect();
  const switchChain = useSwitchChain();

  if (!isConnected) {
    const injectedConnector =
      connect.connectors.find((c) => c.id === "injected") ??
      connect.connectors[0];
    return (
      <Button
        variant="secondary"
        onClick={() =>
          injectedConnector && connect.connect({ connector: injectedConnector })
        }
        loading={connect.isPending}
        loadingText="Opening wallet"
        disabled={!injectedConnector}
      >
        Connect wallet
      </Button>
    );
  }

  if (chainId !== chain.chainId) {
    return (
      <Button
        variant="secondary"
        onClick={() => switchChain.switchChain({ chainId: chain.chainId })}
        loading={switchChain.isPending}
        loadingText="Awaiting wallet approval"
      >
        Switch network
      </Button>
    );
  }

  return (
    <button
      type="button"
      className={styles.wallet}
      onClick={() => disconnect.disconnect()}
      aria-label={`Connected as ${address}. Activate to disconnect.`}
      title="Disconnect wallet"
    >
      <span className={styles.walletDot} aria-hidden="true" />
      <span className={styles.walletAddress}>{shortAddress(address ?? "")}</span>
    </button>
  );
}

/**
 * Shared site chrome: product wordmark, target-network label, wallet connect,
 * appearance toggle. Rendered once from the root layout so every screen gets
 * it without duplicating header code.
 */
export function SiteHeader() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand}>
        Vajra
      </Link>
      <div className={styles.right}>
        <span className={styles.network}>{MONAD_MAINNET_NAME}</span>
        <HeaderWallet />
        <ThemeToggle />
      </div>
    </header>
  );
}
