import { getChainConfig, explorerAddressUrl, MONAD_MAINNET_NAME } from "@/lib/chain";
import { CopyButton } from "@/components/ui/CopyButton";

/**
 * Landing footer: the giant ghost wordmark as centerpiece, with mono
 * contract details and links to real, checkable destinations only.
 */
export function Footer() {
  const chain = getChainConfig();
  const contractUrl = explorerAddressUrl(chain.contractAddress, chain);

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__word" aria-hidden="true">
          VAJRA
        </div>
        <div className="footer__row">
          <p className="footer__meta">
            VajraNativeV1 · {MONAD_MAINNET_NAME} · chain {chain.chainId} ·{" "}
            {chain.contractAddress}
            <CopyButton text={chain.contractAddress} label="contract address" />
          </p>
          <nav className="footer__links" aria-label="Footer">
            <a href={contractUrl} target="_blank" rel="noreferrer">
              Contract on Monadscan
            </a>
            <a href="https://docs.monad.xyz" target="_blank" rel="noreferrer">
              Monad documentation
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
