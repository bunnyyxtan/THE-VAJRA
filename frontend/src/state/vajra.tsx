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
import { SAMPLE_REQUESTS } from "@/src/lib/samples";
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
  outage: false,
};

interface VajraCtx {
  hydrated: boolean;
  passkey: Passkey | null;
  setPasskey: (p: Passkey | null) => void;
  wallet: Wallet | null;
  setWallet: (w: Wallet | null) => void;
  setWalletNetwork: (n: Wallet["network"]) => void;
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
      const [pk, wl, rq, st] = await Promise.all([
        storage.getItem(K.passkey, null),
        storage.getItem(K.wallet, null),
        storage.getItem(K.requests, null),
        storage.getItem(K.settings, null),
      ]);
      setPasskeyState(parse<Passkey | null>(pk as string | null, null));
      setWalletState(parse<Wallet | null>(wl as string | null, null));
      const stored = parse<PaymentRequest[] | null>(rq as string | null, null);
      setRequests(stored ?? []);
      setSettings({
        ...DEFAULT_SETTINGS,
        ...parse<Partial<Settings>>(st as string | null, {}),
      });
      setHydrated(true);
    })();
  }, []);

  const setPasskey = useCallback((p: Passkey | null) => {
    setPasskeyState(p);
    storage.setItem(K.passkey, JSON.stringify(p));
  }, []);

  const setWallet = useCallback((w: Wallet | null) => {
    setWalletState(w);
    storage.setItem(K.wallet, JSON.stringify(w));
  }, []);

  const setWalletNetwork = useCallback((n: Wallet["network"]) => {
    setWalletState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, network: n };
      storage.setItem(K.wallet, JSON.stringify(next));
      return next;
    });
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
      requestsRef.current.find((x) => x.id === id) ?? SAMPLE_REQUESTS[id],
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
      setWalletNetwork,
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
      setWalletNetwork,
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
