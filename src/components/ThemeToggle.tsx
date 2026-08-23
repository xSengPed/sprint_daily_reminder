"use client";

import { useEffect, useState } from "react";
import { applyTheme, readTheme, THEME_KEY, type Theme } from "@/lib/theme";

const OPTIONS: { value: Theme; icon: string; label: string }[] = [
  { value: "light", icon: "☀", label: "โทนสว่าง" },
  { value: "dark", icon: "☾", label: "โทนมืด" },
  { value: "system", icon: "Auto", label: "ตามระบบ" },
];

export default function ThemeToggle() {
  // เริ่มที่ system เสมอเพื่อให้ตรงกับ HTML ที่ prerender ไว้ แล้วค่อยอ่านค่าจริงหลัง mount
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  const pick = (next: Theme) => {
    setTheme(next);
    applyTheme(next);
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      /* โหมด private — เปลี่ยนธีมได้แต่ไม่ถูกจำไว้ */
    }
  };

  return (
    <div className="theme-toggle" role="group" aria-label="ธีม">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          className="theme-opt"
          aria-pressed={theme === opt.value}
          title={opt.label}
          onClick={() => pick(opt.value)}
        >
          <span aria-hidden>{opt.icon}</span>
          <span className="sr-only">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
