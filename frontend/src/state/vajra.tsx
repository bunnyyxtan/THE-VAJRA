import { Platform } from "react-native";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useReducedMotion } from "react-native-reanimated";

import type {
  PaymentRequest,
  Passkey,
  Settings,
  Wallet,
} from "@/src/lib/types";
import { MONAD_MAINNET_CHAIN_ID } from "@/src/lib/web3/chain";
import { getVajraWallet } from "@/src/lib/web3/wallet";
import { storage } from "@/src/utils/storage";

const K = {
  passkey: "vajra:passkey",
  wallet: "vajra:wallet",
  requests: "vajra:requests",
  settings: "vajra:settings",
};

const DEFAULT_SETTINGS: Settings = {
  reduceMotion: false,
  reduceTransparency: false,
};

/** Honest network label from a live chain id. */
export const networkLabel = (chainId: number | undefined): string =>
  chainId === MONAD_MAINNET_CHAIN_ID
    ? "Monad Mainnet"
    : `Chain ${chainId ?? "?"}`;

const walletFor = (address: string, chainId: number | undefined): Wallet => ({
  address,
  label: "Browser wallet",
  network: networkLabel(chainId),
  chainId,
});

interface VajraCtx {
  hydrated: boolean;
  passkey: Passkey | null;
  setPasskey: (p: Passkey | null) => void;
  wallet: Wallet | null;
  setWallet: (w: Wallet | null) => void;
  /** eth_requestAccounts via the injected wallet; updates state. */
  connectWallet: () => Promise<Wallet>;
  /** Clears local wallet state (injected wallets hold no session to close). */
  disconnectWallet: () => void;
  /** Switch/add Monad Mainnet in the wallet; updates state. */
  switchToMonad: () => Promise<number>;
  requests: PaymentRequest[];
  addRequest: (r: PaymentRequest) => void;
  updateRequest: (id: string, patch: Partial<PaymentRequest>) => void;
  getRequest: (id: string) => PaymentRequest | undefined;
  settings: Settings;
  setSetting: <T extends keyof Settings>(key: T, value: Settings[T]) => void;
}

const Ctx = createContext<VajraCtx | null>(null);

const parse = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export function VajraProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [passkey, setPasskeyState] = useState<Passkey | null>(null);
  const [wallet, setWalletState] = useState<Wallet | null>(null);
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    (async () => {
      const [pk, rq, st] = await Promise.all([
        storage.getItem(K.passkey, null),
        storage.getItem(K.requests, null),
        storage.getItem(K.settings, null),
      ]);
      setPasskeyState(parse<Passkey | null>(pk as string | null, null));
      // Real records only — nothing is seeded. Empty means empty.
      setRequests(parse<PaymentRequest[] | null>(rq as string | null, null) ?? []);
      setSettings({
        ...DEFAULT_SETTINGS,
        ...parse<Partial<Settings>>(st as string | null, {}),
      });

      // Restore the wallet from the provider itself (silent probe), never
      // from stale local state: whatever the injected wallet reports is truth.
      if (Platform.OS === "web") {
        const account = await getVajraWallet().currentAccount();
        if (account) setWalletState(walletFor(account.address, account.chainId));
      }
      setHydrated(true);
    })();
  }, []);

  // Live wallet events (web): account switch, disconnect, chain switch.
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const w = getVajraWallet();
    const offAccounts = w.on("accountsChanged", () => {
      void w.currentAccount().then((account) => {
        setWalletState(account ? walletFor(account.address, account.chainId) : null);
      });
    });
    const offChain = w.on("chainChanged", () => {
      void w.currentAccount().then((account) => {
        setWalletState((prev) =>
          prev && account
            ? walletFor(account.address, account.chainId)
            : prev,
        );
      });
    });
    return () => {
      offAccounts();
      offChain();
    };
  }, []);

  const setPasskey = useCallback((p: Passkey | null) => {
    setPasskeyState(p);
    storage.setItem(K.passkey, JSON.stringify(p));
  }, []);

  const setWallet = useCallback((w: Wallet | null) => {
    setWalletState(w);
    storage.setItem(K.wallet, JSON.stringify(w));
  }, []);

  const connectWallet = useCallback(async (): Promise<Wallet> => {
    const account = await getVajraWallet().connect();
    const next = walletFor(account.address, account.chainId);
    setWallet(next);
    return next;
  }, [setWallet]);

  const disconnectWallet = useCallback(() => {
    setWallet(null);
  }, [setWallet]);

  const switchToMonad = useCallback(async (): Promise<number> => {
    const chainId = await getVajraWallet().switchToMonad();
    setWalletState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, chainId, network: networkLabel(chainId) };
      storage.setItem(K.wallet, JSON.stringify(next));
      return next;
    });
    return chainId;
  }, []);

  const persistRequests = useCallback((next: PaymentRequest[]) => {
    setRequests(next);
    storage.setItem(K.requests, JSON.stringify(next));
  }, []);

  const requestsRef = useRef(requests);
  requestsRef.current = requests;

  const addRequest = useCallback(
    (r: PaymentRequest) => {
      persistRequests([r, ...requestsRef.current.filter((x) => x.id !== r.id)]);
    },
    [persistRequests],
  );

  const updateRequest = useCallback(
    (id: string, patch: Partial<PaymentRequest>) => {
      const list = requestsRef.current;
      const existing = list.find((x) => x.id === id);
      if (existing) {
        persistRequests(list.map((x) => (x.id === id ? { ...x, ...patch } : x)));
      }
    },
    [persistRequests],
  );

  const getRequest = useCallback(
    (id: string): PaymentRequest | undefined =>
      requestsRef.current.find((x) => x.id === id),
    [],
  );

  const setSetting = useCallback(
    <T extends keyof Settings>(key: T, value: Settings[T]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        storage.setItem(K.settings, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const value = useMemo(
    () => ({
      hydrated,
      passkey,
      setPasskey,
      wallet,
      setWallet,
      connectWallet,
      disconnectWallet,
      switchToMonad,
      requests,
      addRequest,
      updateRequest,
      getRequest,
      settings,
      setSetting,
    }),
    [
      hydrated,
      passkey,
      wallet,
      requests,
      settings,
      setPasskey,
      setWallet,
      connectWallet,
      disconnectWallet,
      switchToMonad,
      addRequest,
      updateRequest,
      getRequest,
      setSetting,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useVajra = (): VajraCtx => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useVajra must be used inside VajraProvider");
  return ctx;
};

/** True when motion should be minimized (system setting OR app preference). */
export const useMotionPref = (): boolean => {
  const system = useReducedMotion();
  const ctx = useContext(Ctx);
  return Boolean(system || ctx?.settings.reduceMotion);
};

/** True when translucency should be avoided. */
export const useTransparencyPref = (): boolean => {
  const ctx = useContext(Ctx);
  return Boolean(ctx?.settings.reduceTransparency);
};
