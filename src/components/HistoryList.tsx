"use client";

import { useMemo } from "react";
import { formatShort, formatThai } from "@/lib/date";
import { getSquad } from "@/lib/squads";
import { isEmptyEntry } from "@/lib/storage";
import { useStore } from "@/lib/store";

type Props = {
  limit?: number;
  onPick: (date: string) => void;
};

export default function HistoryList({ limit = 12, onPick }: Props) {
  const { entries, ready } = useStore();

  const rows = useMemo(
    () =>
      Object.values(entries)
        .filter((e) => !isEmptyEntry(e))
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
        .slice(0, limit),
    [entries, limit]
  );

  if (!ready) return null;

  if (rows.length === 0) {
    return (
      <p className="empty-state">
        ยังไม่มีประวัติ daily — เริ่มกรอกของวันนี้ได้เลย
      </p>
    );
  }

  return (
    <div className="history-list">
      {rows.map((entry) => {
        const squad = getSquad(entry.squadId);
        const blockers = entry.blockers.filter((i) => i.text.trim()).length;
        const summary =
          entry.today.find((i) => i.text.trim())?.text.trim() ??
          entry.yesterday.find((i) => i.text.trim())?.text.trim() ??
          entry.note.trim() ??
          "-";

        return (
          <button
            key={`${entry.squadId}-${entry.date}`}
            className="history-row"
            onClick={() => onPick(entry.date)}
            title={formatThai(entry.date)}
          >
            <span className="squad-chip" style={{ background: squad.color }} />
            <span className="history-date">
              {formatShort(entry.date)} · {squad.name}
            </span>
            <span className="history-meta">{summary}</span>
            {blockers > 0 && (
              <span className="blocker-flag">{blockers} blocker</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
