import { minutesOf } from "./date";
import type { OtDeduction, OtEntry, OtMultiplier } from "./types";

export const OT_MULTIPLIERS: OtMultiplier[] = [1, 1.5, 1.75];

/** ชั่วโมงระหว่าง start-end (HH:mm) ปัดเป็น 2 ตำแหน่งทศนิยม */
export function computeHours(startTime: string, endTime: string): number {
  return Math.round(((minutesOf(endTime) - minutesOf(startTime)) / 60) * 100) / 100;
}

/** ชั่วโมงสะสมจริงของ 1 แถว = ชั่วโมงที่ทำงาน x ตัวคูณ */
export function weightedHours(entry: Pick<OtEntry, "hours" | "multiplier">): number {
  return Math.round(entry.hours * entry.multiplier * 100) / 100;
}

export type OtBalance = {
  totalHours: number;
  /** ทุก 8 ชม. สะสม (หลังคูณตัวคูณแล้ว) = 1 วัน เศษที่ไม่ครบ 8 ชม. นับรวมเป็นทศนิยม */
  totalDays: number;
  usedDays: number;
  remainingDays: number;
};

export function otBalance(entries: OtEntry[], deductions: OtDeduction[]): OtBalance {
  const totalHours = entries.reduce((sum, e) => sum + weightedHours(e), 0);
  const totalDays = totalHours / 8;
  const usedDays = deductions.reduce((sum, d) => sum + d.days, 0);
  return { totalHours, totalDays, usedDays, remainingDays: totalDays - usedDays };
}
