"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "./api";
import {
  emptyEntry,
  entryId,
  isEmptyEntry,
  loadAll,
  loadDirty,
  saveAll,
  saveDirty,
  type EntryMap,
} from "./storage";
import type { Entry, SquadId } from "./types";

export type SaveStatus = "loading" | "idle" | "saving" | "offline";

type StoreValue = {
  entries: EntryMap;
  ready: boolean;
  status: SaveStatus;
  /** จำนวนรายการที่แก้แล้วยังไม่ได้กดบันทึก */
  dirtyCount: number;
  lastSavedAt: string | null;
  lastError: string | null;
  isDirty: (squadId: SquadId, date: string) => boolean;
  getEntry: (squadId: SquadId, date: string) => Entry;
  updateEntry: (
    squadId: SquadId,
    date: string,
    patch: (prev: Entry) => Entry
  ) => void;
  removeEntry: (squadId: SquadId, date: string) => void;
  saveEntry: (squadId: SquadId, date: string) => Promise<boolean>;
  saveAllDirty: () => Promise<boolean>;
  discardEntry: (squadId: SquadId, date: string) => Promise<void>;
  importEntries: (map: EntryMap) => Promise<number>;
};

const StoreContext = createContext<StoreValue | null>(null);

function toMap(list: Entry[]): EntryMap {
  return Object.fromEntries(list.map((e) => [entryId(e.squadId, e.date), e]));
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<EntryMap>({});
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<SaveStatus>("loading");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  // ค่าล่าสุดสำหรับให้ handler อ่านโดยไม่ต้องผูกกับ render
  const latest = useRef<EntryMap>({});
  const dirtyRef = useRef<Set<string>>(new Set());

  const commit = useCallback((map: EntryMap) => {
    latest.current = map;
    setEntries(map);
    saveAll(map); // เก็บ draft ไว้ในเครื่อง เผื่อปิดแท็บก่อนกดบันทึก
  }, []);

  const commitDirty = useCallback((ids: Set<string>) => {
    dirtyRef.current = ids;
    setDirty(ids);
    saveDirty(ids);
  }, []);

  // โหลดครั้งแรก: โชว์ draft ในเครื่องก่อน แล้วดึงของจริงจากเซิร์ฟเวอร์มาทับ
  // ยกเว้นรายการที่ยังไม่ได้กดบันทึก — ของในเครื่องใหม่กว่า จึงต้องเก็บไว้
  useEffect(() => {
    let cancelled = false;
    const cache = loadAll();
    const cachedDirty = loadDirty();
    latest.current = cache;
    dirtyRef.current = cachedDirty;
    setEntries(cache);
    setDirty(cachedDirty);

    (async () => {
      try {
        const fromServer = toMap(await api.listEntries());
        if (cancelled) return;

        const merged = { ...fromServer };
        cachedDirty.forEach((id) => {
          if (cache[id]) merged[id] = cache[id];
        });

        commit(merged);
        setStatus("idle");
        setLastError(null);
      } catch (err) {
        if (cancelled) return;
        setStatus("offline");
        setLastError(err instanceof Error ? err.message : null);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [commit]);

  // กันปิดแท็บทิ้งทั้งที่ยังไม่ได้กดบันทึก
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current.size === 0) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  const getEntry = useCallback<StoreValue["getEntry"]>(
    (squadId, date) =>
      entries[entryId(squadId, date)] ?? emptyEntry(squadId, date),
    [entries]
  );

  const isDirty = useCallback<StoreValue["isDirty"]>(
    (squadId, date) => dirty.has(entryId(squadId, date)),
    [dirty]
  );

  const updateEntry = useCallback<StoreValue["updateEntry"]>(
    (squadId, date, patch) => {
      const id = entryId(squadId, date);
      const current = latest.current[id] ?? emptyEntry(squadId, date);

      commit({
        ...latest.current,
        [id]: { ...patch(current), updatedAt: new Date().toISOString() },
      });

      if (!dirtyRef.current.has(id)) {
        commitDirty(new Set(dirtyRef.current).add(id));
      }
    },
    [commit, commitDirty]
  );

  const clearDirty = useCallback(
    (ids: string[]) => {
      const next = new Set(dirtyRef.current);
      ids.forEach((id) => next.delete(id));
      commitDirty(next);
    },
    [commitDirty]
  );

  const saveEntry = useCallback<StoreValue["saveEntry"]>(
    async (squadId, date) => {
      const id = entryId(squadId, date);
      const entry = latest.current[id];
      if (!entry) return true;

      setStatus("saving");
      try {
        const saved = await api.saveEntry(entry);
        commit({ ...latest.current, [id]: saved });
        clearDirty([id]);
        setLastSavedAt(new Date().toISOString());
        setLastError(null);
        setStatus("idle");
        return true;
      } catch (err) {
        setStatus("offline");
        setLastError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
        return false;
      }
    },
    [clearDirty, commit]
  );

  const saveAllDirty = useCallback<StoreValue["saveAllDirty"]>(async () => {
    const ids = [...dirtyRef.current];
    const pending = ids
      .map((id) => latest.current[id])
      .filter((e): e is Entry => Boolean(e));

    if (pending.length === 0) return true;

    setStatus("saving");
    try {
      await api.importEntries(pending);
      clearDirty(ids);
      setLastSavedAt(new Date().toISOString());
      setLastError(null);
      setStatus("idle");
      return true;
    } catch (err) {
      setStatus("offline");
      setLastError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
      return false;
    }
  }, [clearDirty]);

  /** ทิ้งสิ่งที่แก้ไว้ แล้วดึงของบนเซิร์ฟเวอร์กลับมา */
  const discardEntry = useCallback<StoreValue["discardEntry"]>(
    async (squadId, date) => {
      const id = entryId(squadId, date);
      try {
        // ไม่มีบนเซิร์ฟเวอร์ backend จะคืนฟอร์มเปล่ามาให้อยู่แล้ว
        const fresh = await api.getEntry(squadId, date);
        commit({ ...latest.current, [id]: fresh });
        clearDirty([id]);
        setStatus("idle");
      } catch (err) {
        setStatus("offline");
        setLastError(err instanceof Error ? err.message : null);
      }
    },
    [clearDirty, commit]
  );

  const removeEntry = useCallback<StoreValue["removeEntry"]>(
    (squadId, date) => {
      const id = entryId(squadId, date);
      const next = { ...latest.current };
      delete next[id];
      commit(next);
      clearDirty([id]);
      api.deleteEntry(squadId, date).catch(() => setStatus("offline"));
    },
    [clearDirty, commit]
  );

  const importEntries = useCallback<StoreValue["importEntries"]>(
    async (map) => {
      const list = Object.values(map).filter((e) => !isEmptyEntry(e));
      await api.importEntries(list);
      commit(toMap(await api.listEntries()));
      commitDirty(new Set());
      setLastSavedAt(new Date().toISOString());
      setStatus("idle");
      return list.length;
    },
    [commit, commitDirty]
  );

  const value = useMemo(
    () => ({
      entries,
      ready,
      status,
      dirtyCount: dirty.size,
      lastSavedAt,
      lastError,
      isDirty,
      getEntry,
      updateEntry,
      removeEntry,
      saveEntry,
      saveAllDirty,
      discardEntry,
      importEntries,
    }),
    [
      entries,
      ready,
      status,
      dirty,
      lastSavedAt,
      lastError,
      isDirty,
      getEntry,
      updateEntry,
      removeEntry,
      saveEntry,
      saveAllDirty,
      discardEntry,
      importEntries,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore ต้องอยู่ภายใน <StoreProvider>");
  return ctx;
}
