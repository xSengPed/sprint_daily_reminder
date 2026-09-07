"use client";

import { useEffect, useState } from "react";
import { formatThai } from "@/lib/date";
import type { OtDeductionAmount } from "@/lib/types";

type Props = {
  /** วันที่ตั้งต้นในฟอร์ม */
  date: string;
  /** ยอดวันคงเหลือปัจจุบัน — ใช้ disable ตัวเลือกที่ทำให้ยอดติดลบ */
  remainingDays: number;
  onClose: () => void;
  onSubmit: (date: string, days: OtDeductionAmount, note: string) => Promise<void>;
};

const AMOUNTS: OtDeductionAmount[] = [0.5, 1];

export default function OtDeductModal({ date, remainingDays, onClose, onSubmit }: Props) {
  const [pickedDate, setPickedDate] = useState(date);
  const [days, setDays] = useState<OtDeductionAmount | null>(null);
  const [note, setNote] = useState("");
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
    if (days === null) {
      setError("เลือกจำนวนวันที่จะหักด้วย");
      return;
    }
    if (days > remainingDays + 1e-9) {
      setError(`ยอดวันคงเหลือไม่พอ (เหลือ ${remainingDays.toFixed(2)} วัน)`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit(pickedDate, days, note.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "หักวันไม่สำเร็จ");
      setBusy(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="หักวันหยุดชดเชย"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h3>หักวันหยุดชดเชย</h3>
          <button className="btn ghost sm" onClick={onClose}>
            ปิด
          </button>
        </div>

        <div className="modal-body">
          <label className="field">
            <span className="field-label">วันที่ใช้</span>
            <input
              type="date"
              className="field-input"
              value={pickedDate}
              onChange={(e) => e.target.value && setPickedDate(e.target.value)}
            />
          </label>

          <div className="field">
            <span className="field-label">จำนวนวัน</span>
            <div className="preset-row">
              {AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  className={amount === days ? "btn sm primary" : "btn sm"}
                  onClick={() => setDays(amount)}
                  disabled={amount > remainingDays + 1e-9}
                  title={
                    amount > remainingDays + 1e-9
                      ? `ยอดคงเหลือไม่พอ (เหลือ ${remainingDays.toFixed(2)} วัน)`
                      : undefined
                  }
                >
                  {amount} วัน
                </button>
              ))}
            </div>
          </div>

          <label className="field">
            <span className="field-label">หมายเหตุ (ไม่ใส่ก็ได้)</span>
            <input
              className="field-input"
              value={note}
              placeholder="ลาครึ่งวันบ่าย / ลาเต็มวัน..."
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void save();
              }}
            />
          </label>

          <p className="field-hint">
            ยอดคงเหลือตอนนี้ {remainingDays.toFixed(2)} วัน — จะหักของวันที่{" "}
            {formatThai(pickedDate)}
          </p>

          {error && <p className="field-error">{error}</p>}
        </div>

        <div className="modal-foot">
          <button className="btn" onClick={onClose} disabled={busy}>
            ยกเลิก
          </button>
          <button className="btn primary" onClick={() => void save()} disabled={busy}>
            {busy ? "กำลังบันทึก..." : "หักวัน"}
          </button>
        </div>
      </div>
    </div>
  );
}
