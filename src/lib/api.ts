import type { Entry, Holiday, SquadId } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** entry ที่ backend ส่งกลับ มี field เวลาเพิ่มมาซึ่งฝั่งนี้ไม่ได้ใช้ */
type EntryResponse = Omit<Entry, "updatedAt"> & {
  createdAt?: string;
  updatedAt?: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(0, "ติดต่อเซิร์ฟเวอร์ไม่ได้");
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      (body as { error?: { message?: string } } | null)?.error?.message ??
      `เซิร์ฟเวอร์ตอบกลับ ${res.status}`;
    throw new ApiError(res.status, message);
  }

  return (body as { data: T }).data;
}

function normalize(entry: EntryResponse): Entry {
  return {
    squadId: entry.squadId,
    date: entry.date,
    yesterday: entry.yesterday ?? [],
    today: entry.today ?? [],
    blockers: entry.blockers ?? [],
    note: entry.note ?? "",
    updatedAt: entry.updatedAt ?? new Date().toISOString(),
  };
}

export const api = {
  health: () => request<{ ok: boolean; db: string }>("/health"),

  listEntries: async (limit = 500): Promise<Entry[]> => {
    const data = await request<EntryResponse[]>(`/entries?limit=${limit}`);
    return data.map(normalize);
  },

  getEntry: async (squadId: SquadId, date: string): Promise<Entry> => {
    const data = await request<EntryResponse>(`/entries/${squadId}/${date}`);
    return normalize(data);
  },

  saveEntry: async (entry: Entry): Promise<Entry> => {
    const data = await request<EntryResponse>(
      `/entries/${entry.squadId}/${entry.date}`,
      {
        method: "PUT",
        body: JSON.stringify({
          yesterday: entry.yesterday,
          today: entry.today,
          blockers: entry.blockers,
          note: entry.note,
        }),
      }
    );
    return normalize(data);
  },

  deleteEntry: (squadId: SquadId, date: string) =>
    request<{ deleted: number }>(`/entries/${squadId}/${date}`, {
      method: "DELETE",
    }),

  listHolidays: (year?: number) =>
    request<Holiday[]>(`/holidays${year ? `?year=${year}` : ""}`),

  addLeave: (date: string, title: string, endDate?: string) =>
    request<Holiday[]>("/holidays", {
      method: "POST",
      body: JSON.stringify({ date, endDate, title, type: "leave" }),
    }),

  removeHoliday: (date: string, title: string) =>
    request<{ deleted: number }>(
      `/holidays/${date}?title=${encodeURIComponent(title)}`,
      { method: "DELETE" }
    ),

  importHolidays: (ics: string, source: string, replaceAll = false) =>
    request<{ parsed: number; imported: number; total: number }>(
      "/holidays/import",
      {
        method: "POST",
        body: JSON.stringify({ ics, source, replaceAll }),
      }
    ),

  importEntries: (entries: Entry[]) =>
    request<{ imported: number; inserted: number; updated: number }>(
      "/entries/import",
      {
        method: "POST",
        body: JSON.stringify({
          entries: entries.map((e) => ({
            squadId: e.squadId,
            date: e.date,
            yesterday: e.yesterday,
            today: e.today,
            blockers: e.blockers,
            note: e.note,
          })),
        }),
      }
    ),
};
