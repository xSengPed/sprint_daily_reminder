const TH_DAYS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
const TH_MONTHS_FULL = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];
const TH_MONTHS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

/** yyyy-mm-dd ตาม local time (ไม่ใช้ toISOString เพราะจะเพี้ยนด้วย timezone) */
export function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(): string {
  return toKey(new Date());
}

export function shiftDays(key: string, delta: number): string {
  const d = fromKey(key);
  d.setDate(d.getDate() + delta);
  return toKey(d);
}

/** วันทำการก่อนหน้า (ข้าม ส-อา) — ใช้ดึงงาน "เมื่อวาน" */
export function prevWorkday(key: string): string {
  let cur = shiftDays(key, -1);
  while ([0, 6].includes(fromKey(cur).getDay())) {
    cur = shiftDays(cur, -1);
  }
  return cur;
}

export function isWeekend(key: string): boolean {
  return [0, 6].includes(fromKey(key).getDay());
}

export function formatThai(key: string): string {
  const d = fromKey(key);
  return `วัน${TH_DAYS[d.getDay()]}ที่ ${d.getDate()} ${TH_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
}

export function formatShort(key: string): string {
  const d = fromKey(key);
  return `${d.getDate()} ${TH_MONTHS[d.getMonth()]}`;
}

export function relativeLabel(key: string): string | null {
  const today = todayKey();
  if (key === today) return "วันนี้";
  if (key === shiftDays(today, -1)) return "เมื่อวาน";
  if (key === shiftDays(today, 1)) return "พรุ่งนี้";
  return null;
}

/** นาทีตั้งแต่เที่ยงคืน จาก "HH:mm" */
export function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** ชื่อวันแบบสั้น เรียงตาม getDay() (อาทิตย์ = 0) */
export const TH_DAY_SHORT = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

/** yyyy-mm ของเดือนที่วันนั้นอยู่ */
export function monthKey(key: string): string {
  return key.slice(0, 7);
}

export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return `${TH_MONTHS_FULL[m - 1]} ${y + 543}`;
}

export function shiftMonths(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function thisMonth(): string {
  return monthKey(todayKey());
}

/**
 * ตารางเดือนแบบเริ่มวันจันทร์ — เติมวันของเดือนก่อน/ถัดไปให้ครบสัปดาห์
 * คืนค่าเป็น 6 สัปดาห์เสมอ ความสูงปฏิทินจะได้ไม่กระตุกตอนเปลี่ยนเดือน
 */
export function monthGrid(month: string): string[][] {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  // getDay(): อาทิตย์ = 0 แต่ตารางเริ่มวันจันทร์ จึงเลื่อนให้จันทร์ = 0
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(y, m - 1, 1 - offset);

  const weeks: string[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) {
      const cur = new Date(start);
      cur.setDate(start.getDate() + w * 7 + d);
      week.push(toKey(cur));
    }
    weeks.push(week);
  }
  return weeks;
}
