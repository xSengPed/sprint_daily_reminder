"use client";

import { useRef, useState } from "react";
import { formatShort, todayKey } from "@/lib/date";
import { computeHours, OT_MULTIPLIERS, weightedHours } from "@/lib/ot";
import type { OtEntry, OtMultiplier } from "@/lib/types";

type Draft = {
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  multiplier: OtMultiplier;
};

type Props = {
  entries: OtEntry[];
  onCreate: (draft: Draft) => Promise<void>;
  onUpdate: (id: string, draft: Draft) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

function emptyDraft(date: string): Draft {
  return { date, startTime: "", endTime: "", description: "", multiplier: 1 };
}

function draftHours(draft: Draft): number | null {
  if (!draft.startTime || !draft.endTime || draft.endTime <= draft.startTime) return null;
  return computeHours(draft.startTime, draft.endTime);
}

function draftWeightedHours(draft: Draft): string {
  const hours = draftHours(draft);
  return hours === null ? "-" : weightedHours({ hours, multiplier: draft.multiplier }).toFixed(2);
}

function MultiplierSelect({
  value,
  onChange,
}: {
  value: OtMultiplier;
  onChange: (v: OtMultiplier) => void;
}) {
  return (
    <select
      className="field-input"
      value={value}
      onChange={(e) => onChange(Number(e.target.value) as OtMultiplier)}
    >
      {OT_MULTIPLIERS.map((m) => (
        <option key={m} value={m}>
          x{m}
        </option>
      ))}
    </select>
  );
}

export default function OtTable({ entries, onCreate, onUpdate, onDelete }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(emptyDraft(todayKey()));
  const [newRow, setNewRow] = useState<Draft>(emptyDraft(todayKey()));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dateRef = useRef<HTMLInputElement>(null);

  const startEdit = (entry: OtEntry) => {
    setEditingId(entry.id);
    setEditDraft({
      date: entry.date,
      startTime: entry.startTime,
      endTime: entry.endTime,
      description: entry.description,
      multiplier: entry.multiplier,
    });
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setError(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    if (!editDraft.startTime || !editDraft.endTime) {
      setError("ใส่เวลาเริ่มและเวลาจบให้ครบ");
      return;
    }
    if (editDraft.endTime <= editDraft.startTime) {
      setError("เวลาจบต้องอยู่หลังเวลาเริ่ม");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onUpdate(editingId, editDraft);
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const submitNewRow = async () => {
    if (!newRow.startTime || !newRow.endTime || !newRow.description.trim()) {
      setError("กรอกเวลาเริ่ม เวลาจบ และรายละเอียดงานให้ครบ");
      return;
    }
    if (newRow.endTime <= newRow.startTime) {
      setError("เวลาจบต้องอยู่หลังเวลาเริ่ม");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onCreate({ ...newRow, description: newRow.description.trim() });
      setNewRow(emptyDraft(newRow.date));
      dateRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ot-table-wrap">
      <table className="ot-table">
        <thead>
          <tr>
            <th>วันที่</th>
            <th>เริ่ม</th>
            <th>จบ</th>
            <th>รายละเอียดงาน</th>
            <th>ตัวคูณ</th>
            <th>ชม.</th>
            <th>ชม.สะสม</th>
            <th aria-label="จัดการ" />
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) =>
            editingId === entry.id ? (
              <tr key={entry.id} className="ot-row editing">
                <td>
                  <input
                    type="date"
                    className="field-input"
                    value={editDraft.date}
                    onChange={(e) =>
                      e.target.value && setEditDraft((d) => ({ ...d, date: e.target.value }))
                    }
                  />
                </td>
                <td>
                  <input
                    type="time"
                    className="field-input"
                    value={editDraft.startTime}
                    onChange={(e) => setEditDraft((d) => ({ ...d, startTime: e.target.value }))}
                  />
                </td>
                <td>
                  <input
                    type="time"
                    className="field-input"
                    value={editDraft.endTime}
                    onChange={(e) => setEditDraft((d) => ({ ...d, endTime: e.target.value }))}
                  />
                </td>
                <td>
                  <input
                    className="field-input"
                    value={editDraft.description}
                    onChange={(e) =>
                      setEditDraft((d) => ({ ...d, description: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void saveEdit();
                    }}
                  />
                </td>
                <td>
                  <MultiplierSelect
                    value={editDraft.multiplier}
                    onChange={(multiplier) => setEditDraft((d) => ({ ...d, multiplier }))}
                  />
                </td>
                <td className="ot-hours">{draftHours(editDraft)?.toFixed(2) ?? "-"}</td>
                <td className="ot-hours">{draftWeightedHours(editDraft)}</td>
                <td className="ot-actions">
                  <button className="btn sm primary" onClick={() => void saveEdit()} disabled={busy}>
                    บันทึก
                  </button>
                  <button className="btn sm ghost" onClick={cancelEdit} disabled={busy}>
                    ยกเลิก
                  </button>
                </td>
              </tr>
            ) : (
              <tr key={entry.id} className="ot-row">
                <td>{formatShort(entry.date)}</td>
                <td>{entry.startTime}</td>
                <td>{entry.endTime}</td>
                <td className="ot-desc">{entry.description}</td>
                <td>x{entry.multiplier}</td>
                <td className="ot-hours">{entry.hours.toFixed(2)}</td>
                <td className="ot-hours">{weightedHours(entry).toFixed(2)}</td>
                <td className="ot-actions">
                  <button className="btn sm ghost" onClick={() => startEdit(entry)}>
                    แก้ไข
                  </button>
                  <button
                    className="btn sm ghost danger"
                    onClick={() => void onDelete(entry.id)}
                    aria-label={`ลบรายการ OT วันที่ ${entry.date}`}
                  >
                    ลบ
                  </button>
                </td>
              </tr>
            )
          )}

          <tr className="ot-row new-row">
            <td>
              <input
                ref={dateRef}
                type="date"
                className="field-input"
                value={newRow.date}
                onChange={(e) => e.target.value && setNewRow((d) => ({ ...d, date: e.target.value }))}
              />
            </td>
            <td>
              <input
                type="time"
                className="field-input"
                value={newRow.startTime}
                onChange={(e) => setNewRow((d) => ({ ...d, startTime: e.target.value }))}
              />
            </td>
            <td>
              <input
                type="time"
                className="field-input"
                value={newRow.endTime}
                onChange={(e) => setNewRow((d) => ({ ...d, endTime: e.target.value }))}
              />
            </td>
            <td>
              <input
                className="field-input"
                placeholder="รายละเอียดงาน..."
                value={newRow.description}
                onChange={(e) => setNewRow((d) => ({ ...d, description: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void submitNewRow();
                }}
              />
            </td>
            <td>
              <MultiplierSelect
                value={newRow.multiplier}
                onChange={(multiplier) => setNewRow((d) => ({ ...d, multiplier }))}
              />
            </td>
            <td className="ot-hours">{draftHours(newRow)?.toFixed(2) ?? "-"}</td>
            <td className="ot-hours">{draftWeightedHours(newRow)}</td>
            <td className="ot-actions">
              <button className="btn sm primary" onClick={() => void submitNewRow()} disabled={busy}>
                เพิ่ม
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      {entries.length === 0 && (
        <p className="empty-hint">ยังไม่มีรายการ OT — กรอกแถวด้านล่างแล้วกด Enter ได้เลย</p>
      )}

      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
