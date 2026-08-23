"use client";

import { useMemo } from "react";
import ItemList from "./ItemList";
import { minutesOf, prevWorkday, todayKey } from "@/lib/date";
import { newItem } from "@/lib/storage";
import { useStore } from "@/lib/store";
import type { Item, Squad } from "@/lib/types";

type Props = {
  squad: Squad;
  date: string;
  /** นาทีปัจจุบันของวันนี้ (null = ยัง hydrate ไม่เสร็จ) */
  nowMinutes: number | null;
  onPreview: () => void;
  onToast: (message: string) => void;
};

type Status = { label: string; className: string };

function statusOf(squad: Squad, nowMinutes: number | null, isToday: boolean): Status | null {
  if (nowMinutes === null || !isToday) return null;
  const start = minutesOf(squad.start);
  const end = minutesOf(squad.end);
  if (nowMinutes >= start && nowMinutes < end) {
    return { label: "กำลัง daily", className: "status-chip live" };
  }
  if (nowMinutes < start) {
    const diff = start - nowMinutes;
    if (diff <= 60) return { label: `อีก ${diff} นาที`, className: "status-chip" };
    return null;
  }
  return { label: "ผ่านไปแล้ว", className: "status-chip done" };
}

export default function SquadCard({
  squad,
  date,
  nowMinutes,
  onPreview,
  onToast,
}: Props) {
  const { getEntry, updateEntry, status: saveStatus, isDirty, saveEntry, discardEntry } =
    useStore();
  const entry = getEntry(squad.id, date);
  const dirty = isDirty(squad.id, date);
  const isToday = date === todayKey();
  const status = statusOf(squad, nowMinutes, isToday);

  const prevEntry = getEntry(squad.id, prevWorkday(date));
  const carryable = useMemo(
    () => prevEntry.today.filter((i) => i.text.trim()),
    [prevEntry]
  );

  const save = async () => {
    const ok = await saveEntry(squad.id, date);
    onToast(ok ? `บันทึก daily ${squad.name} แล้ว` : "บันทึกไม่สำเร็จ");
  };

  const setSection = (key: "yesterday" | "today" | "blockers", items: Item[]) =>
    updateEntry(squad.id, date, (prev) => ({ ...prev, [key]: items }));

  const carryOver = () => {
    if (carryable.length === 0) {
      onToast("ไม่มีงานของวันทำการก่อนหน้าให้ดึง");
      return;
    }
    const existing = new Set(
      entry.yesterday.map((i) => i.text.trim().toLowerCase())
    );
    const incoming = carryable
      .filter((i) => !existing.has(i.text.trim().toLowerCase()))
      .map((i) => ({ ...newItem(i.text), done: i.done }));

    if (incoming.length === 0) {
      onToast("ดึงมาครบแล้ว");
      return;
    }
    updateEntry(squad.id, date, (prev) => ({
      ...prev,
      yesterday: [...prev.yesterday, ...incoming],
    }));
    onToast(`ดึงมา ${incoming.length} รายการจากวันทำการก่อนหน้า`);
  };

  return (
    <section className="card">
      <div className="card-head">
        <span className="squad-badge">
          <span className="squad-chip" style={{ background: squad.color }} />
          {squad.name}
        </span>
        <span
          className="time-chip"
          style={{ background: squad.accent, color: squad.color }}
        >
          {squad.start} - {squad.end}
        </span>
        {status && <span className={status.className}>{status.label}</span>}

        <span className="spacer" />

        <button className="btn sm" onClick={carryOver}>
          ดึงงานเมื่อวาน
        </button>
        <button className="btn sm primary" onClick={onPreview}>
          คัดลอก Daily
        </button>
      </div>

      <div className="card-body">
        <ItemList
          title="เมื่อวานทำอะไร"
          placeholder="งานที่ปิดไปเมื่อวาน..."
          items={entry.yesterday}
          onChange={(items) => setSection("yesterday", items)}
          emptyHint={
            carryable.length > 0
              ? `มี ${carryable.length} รายการจากวันทำการก่อนหน้าให้ดึงมาได้`
              : undefined
          }
        />
        <ItemList
          title="วันนี้จะทำอะไร"
          placeholder="แผนงานวันนี้..."
          items={entry.today}
          onChange={(items) => setSection("today", items)}
        />
        <ItemList
          title="ติดปัญหาอะไรบ้าง"
          placeholder="blocker / ต้องการความช่วยเหลือ..."
          items={entry.blockers}
          onChange={(items) => setSection("blockers", items)}
          tone="blockers"
          emptyHint="ไม่มีปัญหา — ปล่อยว่างไว้ได้"
        />
      </div>

      <div className="card-foot">
        <input
          className="note-input"
          value={entry.note}
          placeholder="หมายเหตุถึงทีม (ลา / ประชุมชน / ขอ pair)..."
          onChange={(e) =>
            updateEntry(squad.id, date, (prev) => ({
              ...prev,
              note: e.target.value,
            }))
          }
        />
        <span className={dirty ? "saved-hint unsaved" : "saved-hint"}>
          {dirty ? "ยังไม่ได้บันทึก" : "บันทึกแล้ว"}
        </span>
        {dirty && (
          <button
            className="btn sm ghost"
            onClick={() => void discardEntry(squad.id, date)}
            disabled={saveStatus === "saving"}
          >
            ยกเลิกการแก้ไข
          </button>
        )}
        <button
          className="btn sm primary"
          onClick={() => void save()}
          disabled={!dirty || saveStatus === "saving"}
        >
          {saveStatus === "saving" ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>
    </section>
  );
}
