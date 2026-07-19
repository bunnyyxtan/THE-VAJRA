"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useChainId, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { getChainConfig, explorerAddressUrl, MONAD_MAINNET_NAME } from "@/lib/chain";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { CopyButton } from "@/components/ui/CopyButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cx } from "@/components/ui/cx";

const NAV_ITEMS = [
  { href: "/request", label: "Create request" },
  { href: "/pay", label: "Pay" },
  { href: "/activity", label: "Activity" },
];

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function WalletControls() {
  const chain = getChainConfig();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connectors, connect, isPending, error, reset } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [open, setOpen] = useState(false);

  const wrongChain = isConnected && chainId !== chain.chainId;

  const openDialog = () => {
    reset();
    setOpen(true);
  };

  return (
    <>
      {isConnected && address ? (
        <button
          type="button"
          className={buttonClasses({ variant: wrongChain ? "secondary" : "ghost", size: "sm" })}
          onClick={openDialog}
        >
          <span
            aria-hidden="true"
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: wrongChain ? "var(--v-warning)" : "var(--v-success)",
              flex: "none",
            }}
          />
          <span className="mono" style={{ fontSize: 13 }}>
            {wrongChain ? "Wrong network" : truncateAddress(address)}
          </span>
        </button>
      ) : (
        <Button size="sm" onClick={openDialog}>
          Connect wallet
        </Button>
      )}

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={isConnected ? "Wallet" : "Connect a wallet"}
        description={
          isConnected
            ? undefined
            : `VAJRA runs on ${MONAD_MAINNET_NAME} (chain ${chain.chainId}). Connect with a browser wallet to continue.`
        }
      >
        {isConnected && address ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="vledger">
              <div className="vledger-row">
                <span className="vledger-row__label">Address</span>
                <span className="vledger-row__value vledger-row__value--mono">
                  {truncateAddress(address)}
                  <CopyButton text={address} label="wallet address" />
                </span>
              </div>
              <div className="vledger-row">
                <span className="vledger-row__label">Network</span>
                <span className="vledger-row__value">
                  {wrongChain ? `Connected chain ${chainId} — expected ${chain.chainId}` : MONAD_MAINNET_NAME}
                </span>
              </div>
            </div>

            {wrongChain && (
              <Button
                fullWidth
                loading={isSwitching}
                loadingLabel="Switching network"
                onClick={() => switchChain({ chainId: chain.chainId })}
              >
                Switch to {MONAD_MAINNET_NAME}
              </Button>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <a
                href={explorerAddressUrl(address, chain)}
                target="_blank"
                rel="noreferrer"
                className={buttonClasses({ variant: "secondary", size: "sm", fullWidth: true })}
              >
                View on Monadscan
              </a>
              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onClick={() => {
                  disconnect();
                  setOpen(false);
                }}
              >
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {connectors.map((connector) => (
              <Button
                key={connector.uid}
                variant="secondary"
                fullWidth
                loading={isPending}
                loadingLabel="Opening wallet"
                onClick={() =>
                  connect(
                    { connector, chainId: chain.chainId },
                    { onSuccess: () => setOpen(false) },
                  )
                }
              >
                {connector.name}
              </Button>
            ))}
            {error && (
              <p className="vfield__error" role="alert">
                {connectors.length === 0
                  ? "No browser wallet found. Install a wallet extension and try again."
                  : "The connection request was not completed. No transaction was sent."}
              </p>
            )}
          </div>
        )}
      </Dialog>
    </>
  );
}

/**
 * Slim glass top bar with progressive blur. Desktop: full nav, network
 * label, wallet, theme. Phone: wordmark + theme + wallet only — primary
 * navigation moves to the bottom nav (MobileNav).
 */
export function SiteHeader() {
  const pathname = usePathname();
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const chain = getChainConfig();
  const wrongChain = isConnected && chainId !== chain.chainId;

  return (
    <header className="vheader">
      <div className="vheader__bar">
        <Link href="/" className="vwordmark" aria-label="VAJRA home">
          VAJRA
        </Link>

        <nav className="vheader__nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="vheader__link"
              aria-current={pathname.startsWith(item.href) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="vheader__right">
          <span className={cx("vnetpill", wrongChain && "vnetpill--wrong")}>
            <span className="vnetpill__dot" aria-hidden="true" />
            {wrongChain ? `Chain ${chainId} — expected ${chain.chainId}` : MONAD_MAINNET_NAME}
          </span>
          <ThemeToggle />
          <WalletControls />
        </div>
      </div>
    </header>
  );
}
