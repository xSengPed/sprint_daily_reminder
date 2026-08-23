import type { Entry, Item, SquadId } from "./types";

const KEY = "daily-reminder:entries:v1";
const DIRTY_KEY = "daily-reminder:dirty:v1";

export type EntryMap = Record<string, Entry>;

export function entryId(squadId: SquadId, date: string): string {
  return `${squadId}__${date}`;
}

export function emptyEntry(squadId: SquadId, date: string): Entry {
  return {
    squadId,
    date,
    yesterday: [],
    today: [],
    blockers: [],
    note: "",
    updatedAt: new Date().toISOString(),
  };
}

export function newItem(text = ""): Item {
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    done: false,
  };
}

export function loadAll(): EntryMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as EntryMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveAll(map: EntryMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* quota เต็ม / โหมด private — ข้ามไป ไม่ให้ UI พัง */
  }
}

/** id ของรายการที่แก้แล้วแต่ยังไม่ได้กดบันทึก — เก็บไว้เพื่อให้รอดการรีเฟรช */
export function loadDirty(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(DIRTY_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return Array.isArray(parsed) ? new Set(parsed as string[]) : new Set();
  } catch {
    return new Set();
  }
}

export function saveDirty(ids: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DIRTY_KEY, JSON.stringify([...ids]));
  } catch {
    /* เขียนไม่ได้ก็ข้าม */
  }
}

export function isEmptyEntry(e: Entry | undefined): boolean {
  if (!e) return true;
  const hasItem = [...e.yesterday, ...e.today, ...e.blockers].some(
    (i) => i.text.trim() !== ""
  );
  return !hasItem && e.note.trim() === "";
}

export function exportJSON(map: EntryMap): string {
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), entries: map }, null, 2);
}

export function importJSON(raw: string): EntryMap {
  const parsed = JSON.parse(raw);
  const entries = parsed?.entries ?? parsed;
  if (!entries || typeof entries !== "object") throw new Error("รูปแบบไฟล์ไม่ถูกต้อง");
  return entries as EntryMap;
}
