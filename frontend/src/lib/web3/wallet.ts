/**
 * VAJRA wallet layer (EIP-1193 + EIP-6963).
 *
 * Web: any injected wallet. Providers are discovered via EIP-6963
 * ('eip6963:announceProvider' events) so multiple installed wallets
 * (MetaMask, Rabby, OKX, …) are offered individually; window.ethereum
 * remains as the generic 'Browser wallet' fallback. Connect, chain read,
 * Monad Mainnet switch/add (EIP-3085/3326), EIP-712 typed-data signing
 * (eth_signTypedData_v4) and transaction sending all go through a viem
 * WalletClient bound to the canonical chain config and the provider the
 * user selected.
 *
 * Chain handling rules (the 'keeps asking to add Vajra' fix):
 *   - eth_chainId answers are parsed tolerantly (0x-hex, decimal string,
 *     number, bigint) and always compared as numbers.
 *   - switchToMonad() is prompt-free when the wallet is already on Monad.
 *   - The wallet is asked to SWITCH first; wallet_addEthereumChain is only
 *     sent when the switch reports 'chain not added' (4902, including
 *     nested error shapes and the -32603 'Unrecognized chain ID' wording
 *     used by Rabby/OKX-style providers).
 *   - Wallets that add a chain without activating it are switched
 *     explicitly afterwards, and the final chain id is always verified.
 *
 * Native (iOS/Android): no injected provider exists. Every method fails
 * closed with WALLET_UNAVAILABLE and honest copy — nothing is faked.
 *
 * All errors are classified through lib/web3/errors.ts, so the UI only ever
 * sees VajraError with a stable code.
 */

import { Platform } from 'react-native';
import {
  createWalletClient,
  custom,
  type Address,
  type Hex,
  type WalletClient,
} from 'viem';
import { getChainConfig, type VajraChainConfig } from './chain';
import type { TxParams } from './contracts';
import { VajraError, classifyError } from './errors';
import type { paymentRequestTypedData } from './vajra/hash';

export interface VajraAccount {
  address: Address;
  chainId: number;
}

export type VajraWalletEvent = 'accountsChanged' | 'chainChanged';

type TypedDataPayload = ReturnType<typeof paymentRequestTypedData>;

export interface VajraWallet {
  /** True when an injected provider is present (web only). */
  isAvailable(): boolean;
  /** eth_requestAccounts — prompts the user. */
  connect(): Promise<VajraAccount>;
  /** Silent read of the currently authorized account, if any. */
  currentAccount(): Promise<VajraAccount | null>;
  /** Switch (or add + switch) the wallet to Monad Mainnet. Returns the chain id. */
  switchToMonad(): Promise<number>;
  /** eth_signTypedData_v4 over the canonical Vajra typed data. */
  signTypedData(account: Address, typedData: TypedDataPayload): Promise<Hex>;
  /** Sends a contract transaction built by lib/web3/contracts.ts. */
  sendTransaction(account: Address, tx: TxParams): Promise<Hex>;
  /** Subscribe to wallet events; returns an unsubscribe function. */
  on(event: VajraWalletEvent, handler: () => void): () => void;
}

// ---------------------------------------------------------------------------
// Web implementation (window.ethereum)
// ---------------------------------------------------------------------------

interface Eip1193Provider {
  request(args: { method: string; params?: unknown }): Promise<unknown>;
  on?(event: string, handler: (...args: unknown[]) => void): void;
  removeListener?(event: string, handler: (...args: unknown[]) => void): void;
}

// ---------------------------------------------------------------------------
// EIP-6963 multi-provider discovery (web only)
// ---------------------------------------------------------------------------

/** A wallet announced via EIP-6963, safe to render in the UI. */
export interface DiscoveredWallet {
  /** Reverse-DNS identifier, e.g. 'io.metamask'. Stable per wallet. */
  rdns: string;
  uuid: string;
  name: string;
  /** Data-URI icon supplied by the wallet itself. */
  icon: string;
}

interface Eip6963Detail {
  info: { rdns?: unknown; uuid?: unknown; name?: unknown; icon?: unknown };
  provider?: unknown;
}

const announced = new Map<string, { wallet: DiscoveredWallet; provider: Eip1193Provider }>();
const discoveryListeners = new Set<() => void>();
let discoveryStarted = false;

function isEip1193(value: unknown): value is Eip1193Provider {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as Eip1193Provider).request === 'function'
  );
}

function notifyDiscovery(): void {
  for (const listener of discoveryListeners) listener();
}

function startDiscovery(): void {
  if (discoveryStarted) return;
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  discoveryStarted = true;
  const handler = (event: unknown) => {
    const detail = (event as { detail?: Eip6963Detail })?.detail;
    const info = detail?.info;
    if (!info || typeof info.rdns !== 'string' || info.rdns.length === 0) return;
    if (!isEip1193(detail?.provider)) return;
    announced.set(info.rdns, {
      wallet: {
        rdns: info.rdns,
        uuid: typeof info.uuid === 'string' ? info.uuid : info.rdns,
        name: typeof info.name === 'string' && info.name.length > 0 ? info.name : info.rdns,
        icon: typeof info.icon === 'string' ? info.icon : '',
      },
      provider: detail.provider,
    });
    notifyDiscovery();
  };
  window.addEventListener('eip6963:announceProvider', handler as EventListener);
  window.dispatchEvent(new Event('eip6963:requestProvider'));
}

/** Snapshot of the wallets discovered so far (EIP-6963 announcements). */
export function getDiscoveredWallets(): DiscoveredWallet[] {
  startDiscovery();
  return [...announced.values()].map((entry) => entry.wallet);
}

/** Subscribe to wallet announcements; returns an unsubscribe function. */
export function onWalletsChanged(listener: () => void): () => void {
  startDiscovery();
  discoveryListeners.add(listener);
  return () => discoveryListeners.delete(listener);
}

function plainInjectedProvider(): Eip1193Provider | null {
  if (Platform.OS !== 'web') return null;
  if (typeof window === 'undefined') return null;
  const provider = (window as unknown as { ethereum?: unknown }).ethereum;
  return isEip1193(provider) ? provider : null;
}

/**
 * True when window.ethereum exists and is NOT one of the announced EIP-6963
 * providers — i.e. there is a genuine extra 'Browser wallet' option.
 */
export function hasInjectedFallback(): boolean {
  const plain = plainInjectedProvider();
  if (!plain) return false;
  for (const entry of announced.values()) {
    if (entry.provider === plain) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Provider selection — the wallet the user picked in ConnectWalletSheet.
// ---------------------------------------------------------------------------

let selectedRdns: string | null = null;

/**
 * Selects the provider used for connect/sign/send. Pass an announced rdns,
 * or null for the plain window.ethereum fallback. If the selected wallet
 * disappears (extension removed/disabled), we fall back to window.ethereum
 * rather than faking availability.
 */
export function selectProvider(rdns: string | null): void {
  selectedRdns = rdns;
}

/** The rdns of the currently selected provider, or null for the fallback. */
export function getSelectedProviderRdns(): string | null {
  return selectedRdns;
}

function injectedProvider(): Eip1193Provider | null {
  if (Platform.OS !== 'web') return null;
  if (typeof window === 'undefined') return null;
  if (selectedRdns) {
    startDiscovery();
    const match = announced.get(selectedRdns);
    if (match) return match.provider;
  }
  return plainInjectedProvider();
}

// ---------------------------------------------------------------------------
// Chain-id handling — always numeric, tolerant of inconsistent wallets.
// ---------------------------------------------------------------------------

/**
 * Parses an eth_chainId answer into a number. Wallets are inconsistent in
 * the wild: most return 0x-prefixed hex, some return decimal strings, and a
 * few non-conforming providers return numbers or bigints.
 */
function parseChainId(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^0x[0-9a-fA-F]+$/.test(trimmed)) return Number(BigInt(trimmed));
    if (/^[0-9]+$/.test(trimmed)) return Number(trimmed);
  }
  throw new VajraError(
    'UNKNOWN',
    `The wallet returned an unreadable chain ID (${String(value)}), so the network could not be verified.`,
  );
}

/**
 * True when a failed wallet_switchEthereumChain means 'this chain is not
 * added to the wallet'. The canonical signal is error code 4902, but some
 * providers nest it (err.data.originalError.code) or report -32603 with an
 * 'Unrecognized chain ID' style message instead.
 */
function isChainNotAddedError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const record = err as { code?: unknown; message?: unknown; data?: unknown };
  if (record.code === 4902 || record.code === '4902') return true;
  const nested = (record.data as { originalError?: { code?: unknown } } | undefined)?.originalError
    ?.code;
  if (nested === 4902 || nested === '4902') return true;
  const message = typeof record.message === 'string' ? record.message.toLowerCase() : '';
  return (
    message.includes('4902') ||
    message.includes('unrecognized chain') ||
    message.includes('unknown chain') ||
    message.includes('has not been added') ||
    message.includes('chain not added') ||
    message.includes('wallet_addethereumchain')
  );
}

function webWalletClient(account: Address, config: VajraChainConfig): WalletClient {
  const provider = injectedProvider();
  if (!provider) {
    throw new VajraError(
      'WALLET_UNAVAILABLE',
      'No injected wallet (window.ethereum) is available in this browser.',
    );
  }
  return createWalletClient({
    account,
    chain: config.chain,
    transport: custom(provider as Parameters<typeof custom>[0]),
  });
}

class WebVajraWallet implements VajraWallet {
  isAvailable(): boolean {
    return injectedProvider() !== null;
  }

  private provider(): Eip1193Provider {
    const provider = injectedProvider();
    if (!provider) {
      throw new VajraError(
        'WALLET_UNAVAILABLE',
        'No injected wallet (window.ethereum) is available in this browser.',
      );
    }
    return provider;
  }

  async connect(): Promise<VajraAccount> {
    try {
      const provider = this.provider();
      const accounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[];
      if (!accounts || accounts.length === 0) {
        throw new VajraError('WALLET_UNAVAILABLE', 'The wallet returned no accounts.');
      }
      const chainIdHex = await provider.request({ method: 'eth_chainId' });
      return { address: accounts[0] as Address, chainId: parseChainId(chainIdHex) };
    } catch (err) {
      throw classifyError(err);
    }
  }

  async currentAccount(): Promise<VajraAccount | null> {
    try {
      const provider = injectedProvider();
      if (!provider) return null;
      const accounts = (await provider.request({ method: 'eth_accounts' })) as string[];
      if (!accounts || accounts.length === 0) return null;
      const chainIdHex = await provider.request({ method: 'eth_chainId' });
      return { address: accounts[0] as Address, chainId: parseChainId(chainIdHex) };
    } catch {
      // Silent probe — a wallet that cannot answer is treated as absent.
      return null;
    }
  }

  async switchToMonad(): Promise<number> {
    const config = getChainConfig();
    const provider = this.provider();
    const targetHex = `0x${config.chainId.toString(16)}`;

    // Already on Monad Mainnet? Return without prompting the wallet at all.
    // This is what stops repeat 'add/switch Vajra' prompts on every action.
    try {
      const current = parseChainId(await provider.request({ method: 'eth_chainId' }));
      if (current === config.chainId) return current;
    } catch {
      // A wallet that cannot answer eth_chainId still gets the switch flow.
    }

    // Switch first — never add eagerly. Only a 'chain not added' failure
    // (4902 and its provider-specific variants) triggers wallet_addEthereumChain.
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetHex }],
      });
    } catch (err) {
      if (isChainNotAddedError(err)) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: targetHex,
                chainName: config.chainName,
                nativeCurrency: {
                  name: 'Monad',
                  symbol: 'MON',
                  decimals: 18,
                },
                rpcUrls: [config.rpcUrl],
                blockExplorerUrls: [config.explorerUrl],
              },
            ],
          });
        } catch (addErr) {
          throw classifyError(addErr);
        }
        // Some wallets add the chain without activating it — switch explicitly.
        const afterAdd = parseChainId(await provider.request({ method: 'eth_chainId' }));
        if (afterAdd !== config.chainId) {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetHex }],
          });
        }
      } else {
        throw classifyError(err);
      }
    }
    // Confirm the switch actually happened — never trust the wallet's silence.
    const chainIdHex = await provider.request({ method: 'eth_chainId' });
    const chainId = parseChainId(chainIdHex);
    if (chainId !== config.chainId) {
      throw new VajraError(
        'WRONG_CHAIN',
        `Wallet is on chain ${chainId} after the switch request; expected ${config.chainId} (Monad Mainnet).`,
      );
    }
    return chainId;
  }

  async signTypedData(account: Address, typedData: TypedDataPayload): Promise<Hex> {
    try {
      const client = webWalletClient(account, getChainConfig());
      return await client.signTypedData({
        account,
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: typedData.message,
      });
    } catch (err) {
      throw classifyError(err);
    }
  }

  async sendTransaction(account: Address, tx: TxParams): Promise<Hex> {
    try {
      const client = webWalletClient(account, getChainConfig());
      return await client.sendTransaction({
        account,
        chain: getChainConfig().chain,
        to: tx.to,
        data: tx.data,
        value: tx.value,
      });
    } catch (err) {
      throw classifyError(err);
    }
  }

  on(event: VajraWalletEvent, handler: () => void): () => void {
    const provider = injectedProvider();
    if (!provider || typeof provider.on !== 'function') return () => {};
    provider.on(event, handler);
    return () => provider.removeListener?.(event, handler);
  }
}

// ---------------------------------------------------------------------------
// Native stub — fail closed, never fake a wallet.
// ---------------------------------------------------------------------------

const NATIVE_MESSAGE =
  'Wallet connection is not available in the native app yet. Use the Vajra web app with a browser wallet on Monad Mainnet.';

class NativeVajraWallet implements VajraWallet {
  isAvailable(): boolean {
    return false;
  }

  private unsupported(): never {
    throw new VajraError('WALLET_UNAVAILABLE', NATIVE_MESSAGE);
  }

  async connect(): Promise<VajraAccount> {
    return this.unsupported();
  }

  async currentAccount(): Promise<VajraAccount | null> {
    return null;
  }

  async switchToMonad(): Promise<number> {
    return this.unsupported();
  }

  async signTypedData(): Promise<Hex> {
    return this.unsupported();
  }

  async sendTransaction(): Promise<Hex> {
    return this.unsupported();
  }

  on(): () => void {
    return () => {};
  }
}

// ---------------------------------------------------------------------------

let instance: VajraWallet | null = null;

/** The platform wallet layer: real EIP-1193 on web, fail-closed stub on native. */
export function getVajraWallet(): VajraWallet {
  if (!instance) {
    instance = Platform.OS === 'web' ? new WebVajraWallet() : new NativeVajraWallet();
  }
  return instance;
}
