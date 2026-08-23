/** ต้องตรงกับ src/lib/squads.ts ของฝั่ง frontend */
export const SQUADS = [
  { id: "zeny", name: "Zeny", start: "10:00", end: "10:15" },
  { id: "ledgerx", name: "LedgerX", start: "10:45", end: "11:00" },
] as const;

export type SquadId = (typeof SQUADS)[number]["id"];

export const SQUAD_IDS = SQUADS.map((s) => s.id) as readonly string[];

export function isSquadId(value: string): value is SquadId {
  return SQUAD_IDS.includes(value);
}
