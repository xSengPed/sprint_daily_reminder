"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import DateNav from "@/components/DateNav";
import HistoryList from "@/components/HistoryList";
import PreviewModal from "@/components/PreviewModal";
import SquadCard from "@/components/SquadCard";
import StandupClock from "@/components/StandupClock";
import PageNav from "@/components/PageNav";
import SaveStatus from "@/components/SaveStatus";
import SprintBadge from "@/components/SprintBadge";
import ThemeToggle from "@/components/ThemeToggle";
import { formatThai, shiftDays, todayKey } from "@/lib/date";
import { toPlainText } from "@/lib/format";
import { SQUADS } from "@/lib/squads";
import { exportJSON, importJSON } from "@/lib/storage";
import { useStore } from "@/lib/store";
import type { SquadId } from "@/lib/types";

export default function Page() {
  const { getEntry, entries, importEntries, saveAllDirty, dirtyCount } =
    useStore();
  // วันที่กับนาฬิกาเริ่มเป็น null แล้วเซ็ตหลัง mount — หน้านี้ถูก prerender ตอน build
  // ถ้าอ่านวันที่ตอน render จะไม่ตรงกับตอนผู้ใช้เปิดจริงและ hydration พัง
  const [date, setDate] = useState<string | null>(null);
  const [nowMinutes, setNowMinutes] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ title: string; text: string } | null>(
    null
  );
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNowMinutes(d.getHours() * 60 + d.getMinutes());
      // ?date=yyyy-mm-dd มาจากการคลิกวันในหน้าปฏิทิน
      const wanted = new URLSearchParams(window.location.search).get("date");
      const initial = wanted && /^\d{4}-\d{2}-\d{2}$/.test(wanted) ? wanted : todayKey();
      setDate((prev) => prev ?? initial);
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  // ลูกศรซ้าย/ขวาเปลี่ยนวัน เมื่อไม่ได้อยู่ในช่องกรอก
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el instanceof HTMLElement && el.isContentEditable);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void saveAllDirty().then((ok) =>
          showToast(ok ? "บันทึกแล้ว" : "บันทึกไม่สำเร็จ")
        );
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowLeft") setDate((d) => (d ? shiftDays(d, -1) : d));
      if (e.key === "ArrowRight") setDate((d) => (d ? shiftDays(d, 1) : d));
      if (e.key.toLowerCase() === "t") setDate(todayKey());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saveAllDirty, showToast]);

  const openPreview = (squadId: SquadId) => {
    if (!date) return;
    const squad = SQUADS.find((s) => s.id === squadId);
    setPreview({
      title: `Daily ${squad?.name} · ${formatThai(date)}`,
      text: toPlainText(getEntry(squadId, date)),
    });
  };

  const openPreviewAll = () => {
    if (!date) return;
    const text = SQUADS.map((s) => toPlainText(getEntry(s.id, date))).join(
      "\n\n———\n\n"
    );
    setPreview({ title: `Daily ทั้ง 2 squad · ${formatThai(date)}`, text });
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      showToast("คัดลอกไม่สำเร็จ — เลือกข้อความแล้วกด Ctrl+C แทน");
      return;
    }
    showToast("คัดลอกแล้ว");
    setPreview(null);
  };

  const doExport = () => {
    const blob = new Blob([exportJSON(entries)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily-reminder-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("ดาวน์โหลดไฟล์สำรองแล้ว");
  };

  const doImport = async (file: File) => {
    try {
      const count = await importEntries(importJSON(await file.text()));
      showToast(`นำเข้า ${count} รายการขึ้นเซิร์ฟเวอร์แล้ว`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "ไฟล์ไม่ถูกต้อง");
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
            <h1>Daily Reminder</h1>
            <p>Zeny 10:00 - 10:15 · LedgerX 10:45 - 11:00</p>
          </div>
        </div>
        <div className="topbar-actions">
          <SprintBadge onToast={showToast} />
          <PageNav current="daily" />
          <StandupClock nowMinutes={nowMinutes} />
          <SaveStatus onToast={showToast} />
          <ThemeToggle />
        </div>
      </header>

      {date === null ? (
        <p className="empty-state">กำลังโหลด...</p>
      ) : (
        <>
          <DateNav date={date} onChange={setDate} />

          <div className="squads">
            {SQUADS.map((squad) => (
              <SquadCard
                key={squad.id}
                squad={squad}
                date={date}
                nowMinutes={nowMinutes}
                onPreview={() => openPreview(squad.id)}
                onToast={showToast}
              />
            ))}
          </div>

          <div className="section-heading">
            <h2>ประวัติ Daily</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn sm" onClick={openPreviewAll}>
                คัดลอกทั้ง 2 squad
              </button>
              <button className="btn sm" onClick={doExport}>
                สำรองข้อมูล
              </button>
              <button className="btn sm" onClick={() => fileRef.current?.click()}>
                นำเข้า
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) doImport(file);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          <HistoryList onPick={setDate} />

          <p className="footer-tip">
            <span>
              <span className="kbd">&larr;</span>{" "}
              <span className="kbd">&rarr;</span> เปลี่ยนวัน
            </span>
            <span>
              <span className="kbd">T</span> กลับมาวันนี้
            </span>
            <span>
              <span className="kbd">Enter</span> เพิ่มรายการถัดไป
            </span>
            <span>
              <span className="kbd">Ctrl</span> + <span className="kbd">S</span>{" "}
              บันทึกทั้งหมด
            </span>
            <span>
              {dirtyCount > 0
                ? `มี ${dirtyCount} รายการที่ยังไม่ได้บันทึกขึ้น MongoDB`
                : "บันทึกขึ้น MongoDB ครบแล้ว"}
            </span>
          </p>
        </>
      )}

      {preview && (
        <PreviewModal
          title={preview.title}
          text={preview.text}
          onClose={() => setPreview(null)}
          onCopy={copy}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
