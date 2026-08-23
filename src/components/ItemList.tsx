"use client";

import { useEffect, useRef } from "react";
import { newItem } from "@/lib/storage";
import type { Item } from "@/lib/types";

type Props = {
  title: string;
  placeholder: string;
  items: Item[];
  onChange: (items: Item[]) => void;
  tone?: "normal" | "blockers";
  emptyHint?: string;
};

export default function ItemList({
  title,
  placeholder,
  items,
  onChange,
  tone = "normal",
  emptyHint,
}: Props) {
  // เก็บ id ของ item ที่เพิ่งสร้าง เพื่อโฟกัสให้อัตโนมัติ
  const focusId = useRef<string | null>(null);

  const filled = items.filter((i) => i.text.trim()).length;

  const patch = (id: string, next: Partial<Item>) =>
    onChange(items.map((i) => (i.id === id ? { ...i, ...next } : i)));

  const remove = (id: string) => onChange(items.filter((i) => i.id !== id));

  const addAt = (index: number) => {
    const item = newItem();
    focusId.current = item.id;
    const next = [...items];
    next.splice(index, 0, item);
    onChange(next);
  };

  return (
    <div className={tone === "blockers" ? "section blockers" : "section"}>
      <div className="section-head">
        <span className="section-title">{title}</span>
        {filled > 0 && <span className="section-count">{filled}</span>}
      </div>

      <div className="items">
        {items.map((item, index) => (
          <Row
            key={item.id}
            item={item}
            placeholder={placeholder}
            autoFocus={focusId.current === item.id}
            onFocused={() => {
              if (focusId.current === item.id) focusId.current = null;
            }}
            onText={(text) => patch(item.id, { text })}
            onToggle={() => patch(item.id, { done: !item.done })}
            onRemove={() => remove(item.id)}
            onEnter={() => addAt(index + 1)}
          />
        ))}
      </div>

      {items.length === 0 && emptyHint && (
        <p className="empty-hint">{emptyHint}</p>
      )}

      <button className="add-item" onClick={() => addAt(items.length)}>
        <span aria-hidden>+</span> เพิ่มรายการ
      </button>
    </div>
  );
}

type RowProps = {
  item: Item;
  placeholder: string;
  autoFocus: boolean;
  onFocused: () => void;
  onText: (text: string) => void;
  onToggle: () => void;
  onRemove: () => void;
  onEnter: () => void;
};

function Row({
  item,
  placeholder,
  autoFocus,
  onFocused,
  onText,
  onToggle,
  onRemove,
  onEnter,
}: RowProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // ยืดความสูง textarea ตามเนื้อหา
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [item.text]);

  useEffect(() => {
    if (autoFocus) {
      ref.current?.focus();
      onFocused();
    }
  }, [autoFocus, onFocused]);

  return (
    <div className={item.done ? "item done" : "item"}>
      <input
        type="checkbox"
        className="check"
        checked={item.done}
        onChange={onToggle}
        aria-label="ทำเสร็จแล้ว"
      />
      <textarea
        ref={ref}
        rows={1}
        className="item-input"
        value={item.text}
        placeholder={placeholder}
        onChange={(e) => onText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onEnter();
          }
          if (e.key === "Backspace" && item.text === "") {
            e.preventDefault();
            onRemove();
          }
        }}
      />
      <button className="item-del" onClick={onRemove} aria-label="ลบรายการ">
        &times;
      </button>
    </div>
  );
}
