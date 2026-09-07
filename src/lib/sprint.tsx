"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "./api";

const CACHE_KEY = "daily-reminder:sprint:v1";

type SprintValue = {
  /** null = ยังโหลดไม่เสร็จ */
  sprint: number | null;
  ready: boolean;
  error: string | null;
  setSprint: (number: number) => Promise<void>;
};

const SprintContext = createContext<SprintValue | null>(null);

function readCache(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    const n = raw ? Number(raw) : null;
    return n !== null && Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function writeCache(n: number): void {
  try {
    window.localStorage.setItem(CACHE_KEY, String(n));
  } catch {
    /* เขียนไม่ได้ก็ข้าม — แค่แคชไว้ให้เปิดออฟไลน์ได้ */
  }
}

export function SprintProvider({ children }: { children: ReactNode }) {
  const [sprint, setSprintState] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const cached = readCache();
    if (cached !== null) setSprintState(cached);

    (async () => {
      try {
        const n = await api.getSprint();
        if (cancelled) return;
        setSprintState(n);
        writeCache(n);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "โหลดหมายเลข sprint ไม่สำเร็จ");
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const setSprint = useCallback<SprintValue["setSprint"]>(async (n) => {
    const saved = await api.setSprint(n);
    setSprintState(saved);
    writeCache(saved);
  }, []);

  const value = useMemo(
    () => ({ sprint, ready, error, setSprint }),
    [sprint, ready, error, setSprint]
  );

  return <SprintContext.Provider value={value}>{children}</SprintContext.Provider>;
}

export function useSprint(): SprintValue {
  const ctx = useContext(SprintContext);
  if (!ctx) throw new Error("useSprint ต้องอยู่ภายใน <SprintProvider>");
  return ctx;
}
