import type { Squad, SquadId } from "./types";

export const SQUADS: Squad[] = [
  {
    id: "zeny",
    name: "Zeny",
    start: "10:00",
    end: "10:15",
    color: "#7c5cff",
    accent: "rgba(124, 92, 255, 0.16)",
  },
  {
    id: "ledgerx",
    name: "LedgerX",
    start: "10:45",
    end: "11:00",
    color: "#12b3a8",
    accent: "rgba(18, 179, 168, 0.16)",
  },
];

export function getSquad(id: SquadId): Squad {
  return SQUADS.find((s) => s.id === id) ?? SQUADS[0];
}
