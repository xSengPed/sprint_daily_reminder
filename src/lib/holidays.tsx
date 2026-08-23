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
import type { Holiday } from "./types";

const CACHE_KEY = "daily-reminder:holidays:v1";

type HolidayMap = Record<string, Holiday[]>;

type HolidaysValue = {
  holidays: Holiday[];
  /** ค้นตามวันที่ yyyy-mm-dd */
  byDate: HolidayMap;
  ready: boolean;
  error: string | null;
  reload: () => Promise<void>;
  /** อัปโหลดไฟล์ .ics เข้าเซิร์ฟเวอร์ แล้วโหลดรายการใหม่ */
  importIcs: (
    ics: string,
    source: string,
    replaceAll: boolean
  ) => Promise<number>;
  /** เพิ่มวันลาเอง — ใส่ endDate เพื่อลาต่อเนื่องหลายวัน */
  addLeave: (date: string, title: string, endDate?: string) => Promise<number>;
  /** เอาวันลา (หรือวันหยุด) ของวันนั้นออก */
  removeHoliday: (date: string, title: string) => Promise<void>;
};

const HolidaysContext = createContext<HolidaysValue | null>(null);

function toMap(list: Holiday[]): HolidayMap {
  const map: HolidayMap = {};
  for (const h of list) {
    (map[h.date] ??= []).push(h);
  }
  return map;
}

function readCache(): Holiday[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return Array.isArray(parsed) ? (parsed as Holiday[]) : [];
  } catch {
    return [];
  }
}

function writeCache(list: Holiday[]): void {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(list));
  } catch {
    /* เขียนไม่ได้ก็ข้าม — แค่แคชไว้ให้เปิดออฟไลน์ได้ */
  }
}

export function HolidaysProvider({ children }: { children: ReactNode }) {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const list = await api.listHolidays();
    setHolidays(list);
    writeCache(list);
    setError(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const cached = readCache();
    if (cached.length > 0) setHolidays(cached);

    (async () => {
      try {
        const list = await api.listHolidays();
        if (cancelled) return;
        setHolidays(list);
        writeCache(list);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "โหลดวันหยุดไม่สำเร็จ"
        );
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const importIcs = useCallback<HolidaysValue["importIcs"]>(
    async (ics, source, replaceAll) => {
      const result = await api.importHolidays(ics, source, replaceAll);
      await load();
      return result.imported;
    },
    [load]
  );

  const addLeave = useCallback<HolidaysValue["addLeave"]>(
    async (date, title, endDate) => {
      const created = await api.addLeave(date, title, endDate);
      await load();
      return created.length;
    },
    [load]
  );

  const removeHoliday = useCallback<HolidaysValue["removeHoliday"]>(
    async (date, title) => {
      await api.removeHoliday(date, title);
      await load();
    },
    [load]
  );

  const value = useMemo(
    () => ({
      holidays,
      byDate: toMap(holidays),
      ready,
      error,
      reload: load,
      importIcs,
      addLeave,
      removeHoliday,
    }),
    [holidays, ready, error, load, importIcs, addLeave, removeHoliday]
  );

  return (
    <HolidaysContext.Provider value={value}>
      {children}
    </HolidaysContext.Provider>
  );
}

export function useHolidays(): HolidaysValue {
  const ctx = useContext(HolidaysContext);
  if (!ctx) throw new Error("useHolidays ต้องอยู่ภายใน <HolidaysProvider>");
  return ctx;
}
