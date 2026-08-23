"use client";

import { useEffect, useState } from "react";
import { formatThai } from "@/lib/date";

type Props = {
  /** วันที่ตั้งต้นในฟอร์ม */
  date: string;
  onClose: () => void;
  onSubmit: (date: string, title: string, endDate?: string) => Promise<void>;
};

const PRESETS = ["ลาพักร้อน", "ลากิจ", "ลาป่วย", "WFH"];

export default function LeaveModal({ date, onClose, onSubmit }: Props) {
  const [start, setStart] = useState(date);
  const [end, setEnd] = useState("");
  const [title, setTitle] = useState("ลาพักร้อน");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = async () => {
    if (!title.trim()) {
      setError("ใส่เหตุผลของวันลาด้วย");
      return;
    }
    if (end && end < start) {
      setError("วันสุดท้ายต้องไม่อยู่ก่อนวันแรก");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit(start, title.trim(), end || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
      setBusy(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="เพิ่มวันลา"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h3>เพิ่มวันลา</h3>
          <button className="btn ghost sm" onClick={onClose}>
            ปิด
          </button>
        </div>

        <div className="modal-body">
          <div className="field-row">
            <label className="field">
              <span className="field-label">วันแรก</span>
              <input
                type="date"
                className="field-input"
                value={start}
                onChange={(e) => e.target.value && setStart(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field-label">ถึงวันที่ (ไม่ใส่ก็ได้)</span>
              <input
                type="date"
                className="field-input"
                value={end}
                min={start}
                onChange={(e) => setEnd(e.target.value)}
              />
            </label>
          </div>

          <label className="field">
            <span className="field-label">เหตุผล</span>
            <input
              className="field-input"
              value={title}
              placeholder="ลาพักร้อน"
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void save();
              }}
            />
          </label>

          <div className="preset-row">
            {PRESETS.map((p) => (
              <button
                key={p}
                className={p === title ? "btn sm primary" : "btn sm"}
                onClick={() => setTitle(p)}
              >
                {p}
              </button>
            ))}
          </div>

          <p className="field-hint">
            จะเพิ่มเป็นวันลาตั้งแต่ {formatThai(start)}
            {end && end !== start ? ` ถึง ${formatThai(end)}` : ""}
          </p>

          {error && <p className="field-error">{error}</p>}
        </div>

        <div className="modal-foot">
          <button className="btn" onClick={onClose} disabled={busy}>
            ยกเลิก
          </button>
          <button className="btn primary" onClick={() => void save()} disabled={busy}>
            {busy ? "กำลังบันทึก..." : "เพิ่มวันลา"}
          </button>
        </div>
      </div>
    </div>
  );
}
