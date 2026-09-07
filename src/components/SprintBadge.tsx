"use client";

import { useState } from "react";
import { useSprint } from "@/lib/sprint";

type Props = {
  onToast?: (message: string) => void;
};

export default function SprintBadge({ onToast }: Props) {
  const { sprint, ready, setSprint } = useSprint();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  if (!ready || sprint === null) return null;

  const start = () => {
    setDraft(String(sprint));
    setEditing(true);
  };

  const commit = async () => {
    const n = Number(draft);
    if (!Number.isInteger(n) || n < 1) {
      onToast?.("หมายเลข sprint ต้องเป็นจำนวนเต็มตั้งแต่ 1");
      setEditing(false);
      return;
    }
    if (n === sprint) {
      setEditing(false);
      return;
    }
    setBusy(true);
    try {
      await setSprint(n);
      onToast?.(`อัปเดตเป็น Sprint ${n} แล้ว`);
      setEditing(false);
    } catch (err) {
      onToast?.(err instanceof Error ? err.message : "อัปเดตหมายเลข sprint ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  if (editing) {
    return (
      <input
        className="sprint-input"
        type="number"
        min={1}
        autoFocus
        value={draft}
        disabled={busy}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void commit()}
        onKeyDown={(e) => {
          if (e.key === "Enter") void commit();
          if (e.key === "Escape") setEditing(false);
        }}
        aria-label="แก้ไขหมายเลข sprint"
      />
    );
  }

  return (
    <button
      className="pill sprint-pill"
      onClick={start}
      title="แก้ไขหมายเลข sprint"
    >
      Sprint {sprint}
    </button>
  );
}
