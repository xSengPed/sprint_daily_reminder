"use client";

import { useHolidays } from "@/lib/holidays";
import {
  formatThai,
  isWeekend,
  relativeLabel,
  shiftDays,
  todayKey,
} from "@/lib/date";

type Props = {
  date: string;
  onChange: (date: string) => void;
};

export default function DateNav({ date, onChange }: Props) {
  const rel = relativeLabel(date);
  const weekend = isWeekend(date);
  const { byDate } = useHolidays();
  const holidays = byDate[date] ?? [];

  return (
    <div className="datebar">
      <button
        className="icon-btn"
        onClick={() => onChange(shiftDays(date, -1))}
        aria-label="วันก่อนหน้า"
      >
        &#8249;
      </button>
      <button
        className="icon-btn"
        onClick={() => onChange(shiftDays(date, 1))}
        aria-label="วันถัดไป"
      >
        &#8250;
      </button>

      <div className="date-display">
        <strong>{formatThai(date)}</strong>
        {rel && <span className={rel === "วันนี้" ? "pill today" : "pill"}>{rel}</span>}
        {weekend && <span className="pill weekend">เสาร์-อาทิตย์</span>}
        {holidays.map((h) => (
          <span
            key={h.title}
            className={
              h.type === "public"
                ? "holiday-pill"
                : h.type === "leave"
                  ? "pill leave-pill"
                  : "pill"
            }
          >
            {h.title}
          </span>
        ))}
      </div>

      <span className="spacer" />

      <input
        type="date"
        className="date-input"
        value={date}
        onChange={(e) => e.target.value && onChange(e.target.value)}
      />
      <button
        className="btn"
        onClick={() => onChange(todayKey())}
        disabled={date === todayKey()}
      >
        วันนี้
      </button>
    </div>
  );
}
