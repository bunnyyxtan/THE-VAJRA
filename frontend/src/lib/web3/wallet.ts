/**
 * VAJRA wallet layer (EIP-1193).
 *
 * Web: any injected wallet (window.ethereum — MetaMask, Rabby, Phantom EVM,
 * etc.). Connect, chain read, Monad Mainnet switch/add (EIP-3085/3326),
 * EIP-712 typed-data signing (eth_signTypedData_v4) and transaction sending
 * all go through a viem WalletClient bound to the canonical chain config.
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

function injectedProvider(): Eip1193Provider | null {
  if (Platform.OS !== 'web') return null;
  if (typeof window === 'undefined') return null;
  const provider = (window as unknown as { ethereum?: Eip1193Provider }).ethereum;
  return provider && typeof provider.request === 'function' ? provider : null;
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
      const chainIdHex = (await provider.request({ method: 'eth_chainId' })) as string;
      return { address: accounts[0] as Address, chainId: Number(BigInt(chainIdHex)) };
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
      const chainIdHex = (await provider.request({ method: 'eth_chainId' })) as string;
      return { address: accounts[0] as Address, chainId: Number(BigInt(chainIdHex)) };
    } catch {
      // Silent probe — a wallet that cannot answer is treated as absent.
      return null;
    }
  }

  async switchToMonad(): Promise<number> {
    const config = getChainConfig();
    const provider = this.provider();
    const targetHex = `0x${config.chainId.toString(16)}`;
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetHex }],
      });
    } catch (err) {
      const code = (err as { code?: unknown })?.code;
      if (code === 4902) {
        // Chain unknown to the wallet — add it, then it is active.
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
      } else {
        throw classifyError(err);
      }
    }
    // Confirm the switch actually happened — never trust the wallet's silence.
    const chainIdHex = (await provider.request({ method: 'eth_chainId' })) as string;
    const chainId = Number(BigInt(chainIdHex));
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
