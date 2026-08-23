/**
 * ตัวอ่านไฟล์ .ics แบบเล็ก ๆ ที่รองรับเท่าที่ปฏิทินวันหยุดใช้จริง
 * (VEVENT แบบ all-day, ชื่อใน SUMMARY, ประเภทใน DESCRIPTION)
 */

export type IcsHoliday = {
  /** yyyy-mm-dd */
  date: string;
  title: string;
  /** public = วันหยุดจริง, observance = วันสำคัญที่ไม่ได้หยุด */
  type: "public" | "observance";
  uid?: string;
};

/** ICS ตัดบรรทัดยาวแล้วขึ้นบรรทัดใหม่โดยเว้นวรรคนำหน้า ต้องต่อกลับก่อนอ่าน */
function unfold(text: string): string[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  for (const line of lines) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && out.length > 0) {
      out[out.length - 1] += line.slice(1);
    } else {
      out.push(line);
    }
  }
  return out;
}

function unescapeText(value: string): string {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

/** รับได้ทั้ง 20260101 และ 20260101T000000Z */
function toKey(raw: string): string | null {
  const m = /^(\d{4})(\d{2})(\d{2})/.exec(raw.trim());
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

function addDays(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function classify(description: string, summary: string): IcsHoliday["type"] {
  // ปฏิทินไทยของ Google ระบุ "วันสำคัญ" กับวันที่ไม่ได้หยุดจริง
  return /วันสำคัญ|observance/i.test(`${description} ${summary}`)
    ? "observance"
    : "public";
}

export function parseIcs(text: string): IcsHoliday[] {
  const holidays: IcsHoliday[] = [];

  let inEvent = false;
  let start: string | null = null;
  let end: string | null = null;
  let summary = "";
  let description = "";
  let uid = "";

  for (const line of unfold(text)) {
    if (line.startsWith("BEGIN:VEVENT")) {
      inEvent = true;
      start = end = null;
      summary = description = uid = "";
      continue;
    }

    if (line.startsWith("END:VEVENT")) {
      if (start && summary) {
        // DTEND ของ all-day event คือวันถัดจากวันสุดท้าย จึงไล่ถึงก่อนหน้านั้น
        const last = end ? addDays(end, -1) : start;
        const type = classify(description, summary);
        for (let day = start; day <= last; day = addDays(day, 1)) {
          holidays.push({
            date: day,
            title: summary,
            type,
            uid: uid || undefined,
          });
        }
      }
      inEvent = false;
      continue;
    }

    if (!inEvent) continue;

    const sep = line.indexOf(":");
    if (sep === -1) continue;
    const name = line.slice(0, sep).split(";")[0].toUpperCase();
    const value = line.slice(sep + 1);

    if (name === "DTSTART") start = toKey(value);
    else if (name === "DTEND") end = toKey(value);
    else if (name === "SUMMARY") summary = unescapeText(value);
    else if (name === "DESCRIPTION") description = unescapeText(value);
    else if (name === "UID") uid = value.trim();
  }

  return holidays;
}
