"use client";

import { useEffect } from "react";

type Props = {
  title: string;
  text: string;
  onClose: () => void;
  onCopy: (text: string) => void;
};

export default function PreviewModal({ title, text, onClose, onCopy }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="btn ghost sm" onClick={onClose}>
            ปิด
          </button>
        </div>
        <div className="modal-body">
          <pre className="preview">{text}</pre>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>
            ยกเลิก
          </button>
          <button className="btn primary" onClick={() => onCopy(text)}>
            คัดลอกไปคลิปบอร์ด
          </button>
        </div>
      </div>
    </div>
  );
}
