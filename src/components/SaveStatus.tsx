"use client";

import { useStore } from "@/lib/store";

function timeOf(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

type Props = {
  onToast: (message: string) => void;
};

export default function SaveStatus({ onToast }: Props) {
  const { status, dirtyCount, lastSavedAt, lastError, saveAllDirty } =
    useStore();

  const saveAll = async () => {
    const ok = await saveAllDirty();
    onToast(ok ? `บันทึก ${dirtyCount} รายการแล้ว` : "บันทึกไม่สำเร็จ");
  };

  if (status === "loading") {
    return (
      <div className="save-status">
        <span className="save-dot" aria-hidden />
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  if (dirtyCount > 0) {
    return (
      <div className="save-status unsaved">
        <span className="save-dot" aria-hidden />
        <span>ยังไม่บันทึก {dirtyCount} รายการ</span>
        <button
          className="btn sm primary"
          onClick={() => void saveAll()}
          disabled={status === "saving"}
        >
          {status === "saving" ? "กำลังบันทึก..." : "บันทึกทั้งหมด"}
        </button>
      </div>
    );
  }

  if (status === "offline") {
    return (
      <div className="save-status error">
        <span className="save-dot" aria-hidden />
        <span>{lastError ?? "ติดต่อเซิร์ฟเวอร์ไม่ได้"}</span>
      </div>
    );
  }

  return (
    <div className="save-status saved">
      <span className="save-dot" aria-hidden />
      <span>
        {lastSavedAt ? `บันทึกล่าสุด ${timeOf(lastSavedAt)}` : "บันทึกครบแล้ว"}
      </span>
    </div>
  );
}
