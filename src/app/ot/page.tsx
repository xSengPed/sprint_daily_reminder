"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import OtDeductModal from "@/components/OtDeductModal";
import OtTable from "@/components/OtTable";
import PageNav from "@/components/PageNav";
import SprintBadge from "@/components/SprintBadge";
import ThemeToggle from "@/components/ThemeToggle";
import { api } from "@/lib/api";
import { formatThai, todayKey } from "@/lib/date";
import { otBalance } from "@/lib/ot";
import type { OtDeduction, OtDeductionAmount, OtEntry } from "@/lib/types";

type OtEntryDraft = Omit<OtEntry, "id" | "hours">;

export default function OtPage() {
  const [entries, setEntries] = useState<OtEntry[]>([]);
  const [deductions, setDeductions] = useState<OtDeduction[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [deductOpen, setDeductOpen] = useState(false);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const load = useCallback(async () => {
    const [entryList, deductionList] = await Promise.all([
      api.listOtEntries(),
      api.listOtDeductions(),
    ]);
    setEntries(entryList);
    setDeductions(deductionList);
    setError(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "โหลดข้อมูล OT ไม่สำเร็จ");
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const balance = useMemo(() => otBalance(entries, deductions), [entries, deductions]);

  const createEntry = async (draft: OtEntryDraft) => {
    await api.createOtEntry(draft);
    await load();
    showToast("บันทึกชั่วโมง OT แล้ว");
  };

  const updateEntry = async (id: string, draft: OtEntryDraft) => {
    await api.updateOtEntry(id, draft);
    await load();
    showToast("แก้ไขรายการ OT แล้ว");
  };

  const deleteEntry = async (id: string) => {
    await api.deleteOtEntry(id);
    await load();
    showToast("ลบรายการ OT แล้ว");
  };

  const submitDeduction = async (date: string, days: OtDeductionAmount, note: string) => {
    await api.createOtDeduction({ date, days, note });
    await load();
    setDeductOpen(false);
    showToast(`หักวันหยุดชดเชย ${days} วันแล้ว`);
  };

  const deleteDeduction = async (id: string) => {
    try {
      await api.deleteOtDeduction(id);
      await load();
      showToast("ลบประวัติการหักวันแล้ว");
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
            <h1>OT</h1>
            <p>บันทึกชั่วโมง OT · ทุก 8 ชม. สะสม = วันหยุดชดเชย 1 วัน</p>
          </div>
        </div>
        <div className="topbar-actions">
          <SprintBadge onToast={showToast} />
          <PageNav current="ot" />
          <ThemeToggle />
        </div>
      </header>

      {!ready ? (
        <p className="empty-state">กำลังโหลด...</p>
      ) : (
        <>
          {error && (
            <p className="calendar-error">
              โหลดข้อมูล OT จากเซิร์ฟเวอร์ไม่ได้ ({error}) — ลองรีเฟรชหน้าอีกครั้ง
            </p>
          )}

          <div className="ot-summary">
            <div className="ot-stat">
              <span className="ot-stat-label">ชั่วโมงสะสม</span>
              <strong>{balance.totalHours.toFixed(2)} ชม.</strong>
            </div>
            <div className="ot-stat">
              <span className="ot-stat-label">เท่ากับ</span>
              <strong>{balance.totalDays.toFixed(2)} วัน</strong>
            </div>
            <div className="ot-stat">
              <span className="ot-stat-label">ใช้ไปแล้ว</span>
              <strong>{balance.usedDays.toFixed(2)} วัน</strong>
            </div>
            <div className="ot-stat highlight">
              <span className="ot-stat-label">คงเหลือ</span>
              <strong>{balance.remainingDays.toFixed(2)} วัน</strong>
            </div>
            <span className="spacer" />
            <button
              className="btn primary"
              onClick={() => setDeductOpen(true)}
              disabled={balance.remainingDays < 0.5 - 1e-9}
              title={
                balance.remainingDays < 0.5 - 1e-9
                  ? "ยอดคงเหลือไม่พอให้หัก"
                  : undefined
              }
            >
              หักวันลา
            </button>
          </div>

          <div className="section-heading">
            <h2>ตารางบันทึกชั่วโมง OT</h2>
          </div>

          <OtTable
            entries={entries}
            onCreate={createEntry}
            onUpdate={updateEntry}
            onDelete={deleteEntry}
          />

          <div className="section-heading">
            <h2>ประวัติการหักวันหยุดชดเชย</h2>
          </div>

          {deductions.length === 0 ? (
            <p className="empty-state">ยังไม่มีการหักวันหยุดชดเชย</p>
          ) : (
            <div className="history-list">
              {deductions.map((d) => (
                <div key={d.id} className="history-row">
                  <span className="history-date">{formatThai(d.date)}</span>
                  <span className="history-meta">{d.note || "-"}</span>
                  <span className="pill leave-pill">{d.days} วัน</span>
                  <button className="btn sm ghost" onClick={() => void deleteDeduction(d.id)}>
                    เอาออก
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {deductOpen && (
        <OtDeductModal
          date={todayKey()}
          remainingDays={balance.remainingDays}
          onClose={() => setDeductOpen(false)}
          onSubmit={submitDeduction}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
