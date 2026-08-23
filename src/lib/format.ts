import { formatThai } from "./date";
import { getSquad } from "./squads";
import type { Entry } from "./types";

const bullet = (text: string) => `• ${text}`;

/** แปลง entry เป็นข้อความพร้อม paste ลง Slack / Teams */
export function toPlainText(entry: Entry): string {
  const squad = getSquad(entry.squadId);
  const lines: string[] = [];

  lines.push(`[Daily ${squad.name}] ${formatThai(entry.date)}`);
  lines.push("");

  const block = (title: string, items: Entry["today"]) => {
    const filled = items.filter((i) => i.text.trim());
    lines.push(title);
    if (filled.length === 0) {
      lines.push("  -");
    } else {
      filled.forEach((i) =>
        lines.push(`  ${bullet(i.text.trim())}${i.done ? " ✅" : ""}`)
      );
    }
    lines.push("");
  };

  block("เมื่อวานทำอะไร", entry.yesterday);
  block("วันนี้จะทำอะไร", entry.today);
  block("ติดปัญหาอะไรบ้าง", entry.blockers);

  if (entry.note.trim()) {
    lines.push("หมายเหตุ");
    lines.push(`  ${entry.note.trim()}`);
    lines.push("");
  }

  return lines.join("\n").trim();
}

export function countFilled(entry: Entry): number {
  return [...entry.yesterday, ...entry.today, ...entry.blockers].filter((i) =>
    i.text.trim()
  ).length;
}
