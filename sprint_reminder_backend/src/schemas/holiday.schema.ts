import { z } from "zod";
import { dateKey } from "./entry.schema";

export const MANUAL_SOURCE = "manual";

export const holidayQuerySchema = z
  .object({
    year: z.coerce.number().int().min(1900).max(2999).optional(),
    from: dateKey.optional(),
    to: dateKey.optional(),
    type: z.enum(["public", "observance", "leave"]).optional(),
  })
  .refine((q) => !(q.year && (q.from || q.to)), {
    message: "ใช้ year หรือ from/to อย่างใดอย่างหนึ่ง",
  });

export const holidayImportSchema = z.object({
  /** เนื้อหาไฟล์ .ics ทั้งไฟล์ */
  ics: z.string().min(1, "ต้องส่งเนื้อหาไฟล์ .ics มาด้วย").max(5_000_000),
  source: z.string().max(120).optional(),
  /** ล้างของเดิมก่อนนำเข้า */
  replaceAll: z.boolean().default(false),
});

export const holidayParamsSchema = z.object({ date: dateKey });

/** เพิ่มวันลาเอง — ใส่ endDate เพื่อลาต่อเนื่องหลายวัน */
export const holidayCreateSchema = z
  .object({
    date: dateKey,
    endDate: dateKey.optional(),
    title: z.string().trim().min(1).max(120).default("ลา"),
    type: z.enum(["leave", "public", "observance"]).default("leave"),
  })
  .refine((v) => !v.endDate || v.endDate >= v.date, {
    message: "endDate ต้องไม่อยู่ก่อน date",
  });

/** ลบเฉพาะรายการที่ระบุชื่อ ถ้าไม่ส่ง title มาจะลบทั้งวัน */
export const holidayDeleteQuerySchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
});
