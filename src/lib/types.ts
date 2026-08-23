export type SquadId = "zeny" | "ledgerx";

export type Section = "yesterday" | "today" | "blockers";

export type Item = {
  id: string;
  text: string;
  done: boolean;
};

/** Daily ของ 1 squad ใน 1 วัน */
export type Entry = {
  squadId: SquadId;
  /** yyyy-mm-dd */
  date: string;
  yesterday: Item[];
  today: Item[];
  blockers: Item[];
  note: string;
  updatedAt: string;
};

export type Squad = {
  id: SquadId;
  name: string;
  start: string;
  end: string;
  color: string;
  accent: string;
};

export type Holiday = {
  /** yyyy-mm-dd */
  date: string;
  title: string;
  /** public = วันหยุดจริง, observance = วันสำคัญที่ไม่ได้หยุด, leave = วันลาที่เพิ่มเอง */
  type: "public" | "observance" | "leave";
  source?: string;
};
