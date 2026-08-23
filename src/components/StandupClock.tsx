"use client";

import { minutesOf } from "@/lib/date";
import { SQUADS } from "@/lib/squads";

type Props = { nowMinutes: number | null };

/** หา daily ที่กำลังเกิดขึ้น หรืออันถัดไปของวันนี้ */
function nextUp(nowMinutes: number) {
  const sorted = [...SQUADS].sort(
    (a, b) => minutesOf(a.start) - minutesOf(b.start)
  );
  for (const squad of sorted) {
    const start = minutesOf(squad.start);
    const end = minutesOf(squad.end);
    if (nowMinutes < start) return { squad, state: "before" as const, diff: start - nowMinutes };
    if (nowMinutes < end) return { squad, state: "live" as const, diff: end - nowMinutes };
  }
  return { squad: sorted[0], state: "tomorrow" as const, diff: 0 };
}

function humanize(minutes: number): string {
  if (minutes < 60) return `${minutes} นาที`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} ชม.` : `${h} ชม. ${m} นาที`;
}

export default function StandupClock({ nowMinutes }: Props) {
  if (nowMinutes === null) {
    return (
      <div className="clock">
        <span className="clock-dot" />
        <div>
          <div className="clock-label">Daily ถัดไป</div>
          <div className="clock-value">กำลังโหลด...</div>
        </div>
      </div>
    );
  }

  const { squad, state, diff } = nextUp(nowMinutes);

  const dotClass =
    state === "live" ? "clock-dot live" : state === "before" && diff <= 15 ? "clock-dot soon" : "clock-dot";

  const label =
    state === "live"
      ? `${squad.name} กำลัง daily`
      : state === "before"
        ? `Daily ถัดไป · ${squad.name}`
        : "Daily ถัดไป";

  const value =
    state === "live"
      ? `เหลืออีก ${humanize(diff)}`
      : state === "before"
        ? `${squad.start} น. · อีก ${humanize(diff)}`
        : `พรุ่งนี้ ${squad.start} น. · ${squad.name}`;

  return (
    <div className="clock">
      <span className={dotClass} />
      <div>
        <div className="clock-label">{label}</div>
        <div className="clock-value">{value}</div>
      </div>
    </div>
  );
}
