import { minutesOf } from "./date";
import type { OtDeduction, OtEntry } from "./types";

/** ชั่วโมงระหว่าง start-end (HH:mm) ปัดเป็น 2 ตำแหน่งทศนิยม */
export function computeHours(startTime: string, endTime: string): number {
  return Math.round(((minutesOf(endTime) - minutesOf(startTime)) / 60) * 100) / 100;
}

export type OtBalance = {
  totalHours: number;
  /** ทุก 8 ชม. สะสม = 1 วัน เศษที่ไม่ครบ 8 ชม. นับรวมเป็นทศนิยม */
  totalDays: number;
  usedDays: number;
  remainingDays: number;
};

export function otBalance(entries: OtEntry[], deductions: OtDeduction[]): OtBalance {
  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
  const totalDays = totalHours / 8;
  const usedDays = deductions.reduce((sum, d) => sum + d.days, 0);
  return { totalHours, totalDays, usedDays, remainingDays: totalDays - usedDays };
}
