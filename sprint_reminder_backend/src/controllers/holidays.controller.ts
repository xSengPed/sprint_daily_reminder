import type { Request, Response } from "express";
import { parseIcs } from "../lib/ics";
import { Holiday } from "../models/holiday.model";
import {
  holidayCreateSchema,
  holidayDeleteQuerySchema,
  holidayImportSchema,
  holidayParamsSchema,
  holidayQuerySchema,
  MANUAL_SOURCE,
} from "../schemas/holiday.schema";

/** นำรายการที่อ่านจาก .ics ลงฐานข้อมูล — ชื่อซ้ำในวันเดิมถือเป็นรายการเดียวกัน */
export async function saveHolidays(
  ics: string,
  source: string,
  replaceAll = false
): Promise<{ parsed: number; imported: number }> {
  const parsed = parseIcs(ics);
  // ล้างเฉพาะของที่มาจากไฟล์ ไม่แตะวันลาที่ผู้ใช้เพิ่มเอง
  if (replaceAll) await Holiday.deleteMany({ source: { $ne: MANUAL_SOURCE } });
  if (parsed.length === 0) return { parsed: 0, imported: 0 };

  const ops = parsed.map((h) => ({
    updateOne: {
      filter: { date: h.date, title: h.title },
      update: { $set: { date: h.date, title: h.title, type: h.type, source } },
      upsert: true,
    },
  })) as unknown as Parameters<typeof Holiday.bulkWrite>[0];

  await Holiday.bulkWrite(ops);
  return { parsed: parsed.length, imported: parsed.length };
}

/** GET /api/holidays?year=2026 หรือ ?from=&to=&type= */
export async function listHolidays(req: Request, res: Response): Promise<void> {
  const { year, from, to, type } = holidayQuerySchema.parse(req.query);

  const filter: Record<string, unknown> = {};
  if (type) filter.type = type;
  if (year) {
    filter.date = { $gte: `${year}-01-01`, $lte: `${year}-12-31` };
  } else if (from || to) {
    filter.date = {
      ...(from ? { $gte: from } : {}),
      ...(to ? { $lte: to } : {}),
    };
  }

  const holidays = await Holiday.find(filter).sort({ date: 1, title: 1 });
  res.json({ data: holidays });
}

/** POST /api/holidays/import — body: { ics, source?, replaceAll? } */
export async function importHolidays(
  req: Request,
  res: Response
): Promise<void> {
  const { ics, source, replaceAll } = holidayImportSchema.parse(req.body);
  const result = await saveHolidays(ics, source ?? "upload", replaceAll);
  const total = await Holiday.countDocuments();
  res.json({ data: { ...result, total } });
}

function addDays(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** POST /api/holidays — เพิ่มวันลาเอง (ใส่ endDate เพื่อลาต่อเนื่อง) */
export async function createHoliday(
  req: Request,
  res: Response
): Promise<void> {
  const { date, endDate, title, type } = holidayCreateSchema.parse(req.body);

  const dates: string[] = [];
  for (let cur = date; cur <= (endDate ?? date); cur = addDays(cur, 1)) {
    dates.push(cur);
    if (dates.length > 366) break; // กันช่วงวันที่ยาวผิดปกติ
  }

  const ops = dates.map((d) => ({
    updateOne: {
      filter: { date: d, title },
      update: { $set: { date: d, title, type, source: MANUAL_SOURCE } },
      upsert: true,
    },
  })) as unknown as Parameters<typeof Holiday.bulkWrite>[0];

  await Holiday.bulkWrite(ops);
  const created = await Holiday.find({ date: { $in: dates }, title }).sort({
    date: 1,
  });

  res.status(201).json({ data: created });
}

/** DELETE /api/holidays/:date?title=... — ไม่ส่ง title มาจะลบทั้งวัน */
export async function deleteHoliday(
  req: Request,
  res: Response
): Promise<void> {
  const { date } = holidayParamsSchema.parse(req.params);
  const { title } = holidayDeleteQuerySchema.parse(req.query);

  const result = await Holiday.deleteMany({
    date,
    ...(title ? { title } : {}),
  });
  res.json({ data: { deleted: result.deletedCount } });
}
