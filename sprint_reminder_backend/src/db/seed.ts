import fs from "node:fs";
import path from "node:path";
import { saveHolidays } from "../controllers/holidays.controller";
import { Holiday } from "../models/holiday.model";

const DATA_DIR = path.resolve(process.cwd(), "data");

/**
 * ถ้ายังไม่มีวันหยุดในฐานข้อมูล ให้ดูดจากไฟล์ .ics ใน data/ ให้อัตโนมัติ
 * วางไฟล์ของ ธปท. ทับ data/holidays.ics แล้วสั่ง import ซ้ำได้จากหน้าเว็บ
 */
export async function seedHolidays(): Promise<void> {
  const existing = await Holiday.estimatedDocumentCount();
  if (existing > 0) {
    console.log(`[seed] มีวันหยุดอยู่แล้ว ${existing} รายการ — ข้ามการ seed`);
    return;
  }

  if (!fs.existsSync(DATA_DIR)) {
    console.log("[seed] ไม่พบโฟลเดอร์ data/ — ข้ามการ seed วันหยุด");
    return;
  }

  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".ics"));
  if (files.length === 0) {
    console.log("[seed] ไม่พบไฟล์ .ics ใน data/ — ข้ามการ seed วันหยุด");
    return;
  }

  for (const file of files) {
    const ics = fs.readFileSync(path.join(DATA_DIR, file), "utf8");
    const { imported } = await saveHolidays(ics, file);
    console.log(`[seed] นำเข้าวันหยุด ${imported} รายการจาก ${file}`);
  }
}
