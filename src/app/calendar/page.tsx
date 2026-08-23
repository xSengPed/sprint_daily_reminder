"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import LeaveModal from "@/components/LeaveModal";
import PageNav from "@/components/PageNav";
import ThemeToggle from "@/components/ThemeToggle";
import {
  formatThai,
  fromKey,
  monthGrid,
  monthKey,
  monthLabel,
  shiftMonths,
  TH_DAY_SHORT,
  thisMonth,
  todayKey,
} from "@/lib/date";
import { useHolidays } from "@/lib/holidays";
import { SQUADS } from "@/lib/squads";
import { entryId, isEmptyEntry } from "@/lib/storage";
import { useStore } from "@/lib/store";
import type { Holiday } from "@/lib/types";

/** หัวตารางเริ่มวันจันทร์ ให้ ส-อา ไปอยู่ท้ายสัปดาห์ */
const WEEK_HEAD = [1, 2, 3, 4, 5, 6, 0].map((d) => TH_DAY_SHORT[d]);

function chipClass(h: Holiday): string {
  if (h.type === "leave") return "calendar-holiday leave";
  if (h.type === "observance") return "calendar-holiday observance";
  return "calendar-holiday";
}

export default function CalendarPage() {
  const { entries } = useStore();
  const { byDate, ready, error, importIcs, addLeave, removeHoliday, holidays } =
    useHolidays();

  // เริ่มเป็น null แล้วเซ็ตหลัง mount เพราะหน้านี้ถูก prerender ตอน build
  const [month, setMonth] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [leaveFor, setLeaveFor] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMonth((prev) => prev ?? thisMonth());
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  };

  const weeks = useMemo(() => (month ? monthGrid(month) : []), [month]);

  const monthHolidays = useMemo(
    () =>
      month
        ? holidays
            .filter((h) => monthKey(h.date) === month)
            .sort((a, b) => a.date.localeCompare(b.date))
        : [],
    [holidays, month]
  );

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const count = await importIcs(await file.text(), file.name, true);
      showToast(`นำเข้าวันหยุด ${count} รายการจาก ${file.name} (วันลาไม่ถูกลบ)`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "นำเข้าไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const submitLeave = async (date: string, title: string, endDate?: string) => {
    const count = await addLeave(date, title, endDate);
    setLeaveFor(null);
    showToast(count > 1 ? `เพิ่มวันลา ${count} วันแล้ว` : "เพิ่มวันลาแล้ว");
  };

  const dropLeave = async (h: Holiday) => {
    try {
      await removeHoliday(h.date, h.title);
      showToast(`เอา "${h.title}" ของ ${formatThai(h.date)} ออกแล้ว`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "ลบไม่สำเร็จ");
    }
  };

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden>
            &#9679;
          </span>
          <div>
            <h1>ปฏิทิน Daily</h1>
            <p>วันหยุด วันลา และ daily ที่บันทึกไว้ของทั้ง 2 squad</p>
          </div>
        </div>
        <div className="topbar-actions">
          <PageNav current="calendar" />
          <ThemeToggle />
        </div>
      </header>

      {month === null ? (
        <p className="empty-state">กำลังโหลดปฏิทิน...</p>
      ) : (
        <>
          <div className="datebar">
            <button
              className="icon-btn"
              onClick={() => setMonth(shiftMonths(month, -1))}
              aria-label="เดือนก่อนหน้า"
            >
              &#8249;
            </button>
            <button
              className="icon-btn"
              onClick={() => setMonth(shiftMonths(month, 1))}
              aria-label="เดือนถัดไป"
            >
              &#8250;
            </button>
            <div className="date-display">
              <strong>{monthLabel(month)}</strong>
              {month === thisMonth() && (
                <span className="pill today">เดือนนี้</span>
              )}
            </div>

            <span className="spacer" />

            <button
              className="btn"
              onClick={() => setMonth(thisMonth())}
              disabled={month === thisMonth()}
            >
              เดือนนี้
            </button>
            <button
              className="btn primary"
              onClick={() => setLeaveFor(todayKey())}
            >
              + เพิ่มวันลา
            </button>
            <button
              className="btn"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
            >
              {busy ? "กำลังนำเข้า..." : "นำเข้า .ics"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".ics,text/calendar"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file);
                e.target.value = "";
              }}
            />
          </div>

          {error && (
            <p className="calendar-error">
              โหลดวันหยุดจากเซิร์ฟเวอร์ไม่ได้ ({error}) — แสดงเท่าที่แคชไว้ในเครื่อง
              และยังเพิ่ม/ลบวันลาไม่ได้จนกว่าเซิร์ฟเวอร์จะกลับมา
            </p>
          )}

          <div className="calendar">
            <div className="calendar-head">
              {WEEK_HEAD.map((d) => (
                <div key={d} className="calendar-head-cell">
                  {d}
                </div>
              ))}
            </div>

            <div className="calendar-grid">
              {weeks.flat().map((date) => {
                const inMonth = monthKey(date) === month;
                const dayHolidays = byDate[date] ?? [];
                const dayOff = dayHolidays.find(
                  (h) => h.type === "public" || h.type === "leave"
                );
                const weekend = [0, 6].includes(fromKey(date).getDay());

                const dailies = SQUADS.map((squad) => ({
                  squad,
                  entry: entries[entryId(squad.id, date)],
                })).filter(({ entry }) => !isEmptyEntry(entry));

                const blockers = dailies.reduce(
                  (sum, d) =>
                    sum +
                    (d.entry?.blockers.filter((b) => b.text.trim()).length ?? 0),
                  0
                );

                const classes = [
                  "calendar-cell",
                  inMonth ? "" : "outside",
                  date === todayKey() ? "today" : "",
                  weekend ? "weekend" : "",
                  dayOff?.type === "public" ? "holiday" : "",
                  dayHolidays.some((h) => h.type === "leave") ? "on-leave" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <div key={date} className={classes}>
                    {/* ลิงก์คลุมทั้งช่อง แต่ปุ่มด้านในลอยอยู่เหนือมัน */}
                    <Link
                      href={`/?date=${date}`}
                      className="calendar-cell-link"
                      title={`ไปที่ daily ของ ${formatThai(date)}`}
                    >
                      <span className="sr-only">
                        daily ของ {formatThai(date)}
                      </span>
                    </Link>

                    <span className="calendar-daynum">
                      {Number(date.slice(8))}
                    </span>

                    {dayHolidays.slice(0, 2).map((h) => (
                      <span key={h.title} className={chipClass(h)}>
                        <span className="chip-text">{h.title}</span>
                        {h.type === "leave" && (
                          <button
                            className="chip-remove"
                            onClick={() => void dropLeave(h)}
                            title="เอาวันลานี้ออก"
                            aria-label={`เอาวันลา ${h.title} ของ ${formatThai(h.date)} ออก`}
                          >
                            &times;
                          </button>
                        )}
                      </span>
                    ))}

                    {dayHolidays.length > 2 && (
                      <span className="calendar-more">
                        +{dayHolidays.length - 2} รายการ
                      </span>
                    )}

                    <span className="calendar-cell-foot">
                      {dailies.map(({ squad }) => (
                        <span
                          key={squad.id}
                          className="squad-chip"
                          style={{ background: squad.color }}
                          title={`มี daily ของ ${squad.name}`}
                        />
                      ))}
                      {blockers > 0 && (
                        <span className="calendar-blocker">{blockers}</span>
                      )}
                      <button
                        className="cell-add"
                        onClick={() => setLeaveFor(date)}
                        title={`เพิ่มวันลาวันที่ ${formatThai(date)}`}
                        aria-label={`เพิ่มวันลาวันที่ ${formatThai(date)}`}
                      >
                        +
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="calendar-legend">
            {SQUADS.map((squad) => (
              <span key={squad.id} className="legend-item">
                <span
                  className="squad-chip"
                  style={{ background: squad.color }}
                />
                มี daily ของ {squad.name}
              </span>
            ))}
            <span className="legend-item">
              <span className="legend-swatch holiday" /> วันหยุด
            </span>
            <span className="legend-item">
              <span className="legend-swatch leave" /> วันลาของฉัน
            </span>
            <span className="legend-item">
              <span className="legend-swatch observance" /> วันสำคัญ (ไม่ได้หยุด)
            </span>
            <span className="legend-item">
              <span className="calendar-blocker">n</span> จำนวน blocker
            </span>
          </div>

          <div className="section-heading">
            <h2>วันหยุดและวันลาใน{monthLabel(month)}</h2>
            <span className="saved-hint">
              {ready ? `ในระบบทั้งหมด ${holidays.length} รายการ` : "กำลังโหลด..."}
            </span>
          </div>

          {monthHolidays.length === 0 ? (
            <p className="empty-state">
              เดือนนี้ยังไม่มีวันหยุดหรือวันลา — กด &quot;เพิ่มวันลา&quot;
              หรือนำเข้าไฟล์ .ics ได้
            </p>
          ) : (
            <div className="history-list">
              {monthHolidays.map((h) => (
                <div key={`${h.date}-${h.title}`} className="history-row">
                  <span className={`legend-swatch ${h.type}`} />
                  <Link href={`/?date=${h.date}`} className="history-date">
                    {formatThai(h.date)}
                  </Link>
                  <span className="history-meta">{h.title}</span>
                  {h.type === "leave" ? (
                    <>
                      <span className="pill leave-pill">วันลา</span>
                      <button
                        className="btn sm ghost"
                        onClick={() => void dropLeave(h)}
                      >
                        เอาออก
                      </button>
                    </>
                  ) : (
                    h.type === "observance" && (
                      <span className="pill">วันสำคัญ</span>
                    )
                  )}
                </div>
              ))}
            </div>
          )}

          <p className="footer-tip">
            <span>คลิกวันไหนก็ได้เพื่อไปกรอก daily ของวันนั้น</span>
            <span>กด + ในช่องวันเพื่อบันทึกวันลาของวันนั้น</span>
            <span>นำเข้า .ics ใหม่ไม่ลบวันลาที่เพิ่มเอง</span>
          </p>
        </>
      )}

      {leaveFor && (
        <LeaveModal
          date={leaveFor}
          onClose={() => setLeaveFor(null)}
          onSubmit={submitLeave}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
