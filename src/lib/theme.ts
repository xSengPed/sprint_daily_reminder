export type Theme = "system" | "light" | "dark";

export const THEME_KEY = "daily-reminder:theme";

export function isTheme(value: unknown): value is Theme {
  return value === "system" || value === "light" || value === "dark";
}

export function readTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const raw = window.localStorage.getItem(THEME_KEY);
    return isTheme(raw) ? raw : "system";
  } catch {
    return "system";
  }
}

/** เขียน data-theme ลง <html> — ไม่ใส่เลยแปลว่าตามระบบ */
export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "system") {
    delete root.dataset.theme;
  } else {
    root.dataset.theme = theme;
  }
}

/**
 * สคริปต์ที่รันก่อน paint เพื่อกันหน้าจอกะพริบขาวตอนโหลด
 * (หน้าเว็บถูก prerender เป็น static จึงยังไม่รู้ค่าที่ผู้ใช้เลือกไว้)
 */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(
  THEME_KEY
)});if(t==="light"||t==="dark"){document.documentElement.dataset.theme=t}}catch(e){}`;
