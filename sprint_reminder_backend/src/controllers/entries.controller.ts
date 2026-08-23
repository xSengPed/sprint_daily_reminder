import type { Request, Response } from "express";
import { Entry } from "../models/entry.model";
import {
  entryBodySchema,
  entryParamsSchema,
  importBodySchema,
  listQuerySchema,
} from "../schemas/entry.schema";

/** GET /api/entries?squadId=&from=&to=&limit= */
export async function listEntries(req: Request, res: Response): Promise<void> {
  const { squadId, from, to, limit } = listQuerySchema.parse(req.query);

  const filter: Record<string, unknown> = {};
  if (squadId) filter.squadId = squadId;
  if (from || to) {
    // date เป็น yyyy-mm-dd จึงเทียบเป็น string ตรง ๆ ได้
    filter.date = {
      ...(from ? { $gte: from } : {}),
      ...(to ? { $lte: to } : {}),
    };
  }

  const entries = await Entry.find(filter)
    .sort({ date: -1, squadId: 1 })
    .limit(limit);

  res.json({ data: entries });
}

/** GET /api/entries/:squadId/:date — ไม่มีข้อมูลก็คืนฟอร์มเปล่าให้ frontend ใช้ต่อได้เลย */
export async function getEntry(req: Request, res: Response): Promise<void> {
  const { squadId, date } = entryParamsSchema.parse(req.params);
  const entry = await Entry.findOne({ squadId, date });

  res.json({
    data:
      entry ??
      { squadId, date, yesterday: [], today: [], blockers: [], note: "" },
  });
}

/** PUT /api/entries/:squadId/:date */
export async function upsertEntry(req: Request, res: Response): Promise<void> {
  const { squadId, date } = entryParamsSchema.parse(req.params);
  const body = entryBodySchema.parse(req.body);

  const entry = await Entry.findOneAndUpdate(
    { squadId, date },
    { $set: { ...body, squadId, date } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.json({ data: entry });
}

/** DELETE /api/entries/:squadId/:date */
export async function deleteEntry(req: Request, res: Response): Promise<void> {
  const { squadId, date } = entryParamsSchema.parse(req.params);
  const result = await Entry.deleteOne({ squadId, date });

  res.json({ data: { deleted: result.deletedCount } });
}

/** POST /api/entries/import — ใช้ย้ายข้อมูลที่เคยเก็บไว้ใน localStorage ขึ้นเซิร์ฟเวอร์ */
export async function importEntries(req: Request, res: Response): Promise<void> {
  const { entries } = importBodySchema.parse(req.body);

  if (entries.length === 0) {
    res.json({ data: { imported: 0 } });
    return;
  }

  // cast เพราะ type ของ bulkWrite คาดหวัง DocumentArray ไม่ใช่ array ธรรมดา
  const ops = entries.map((entry) => ({
    updateOne: {
      filter: { squadId: entry.squadId, date: entry.date },
      update: { $set: entry },
      upsert: true,
    },
  })) as unknown as Parameters<typeof Entry.bulkWrite>[0];

  const result = await Entry.bulkWrite(ops);

  res.json({
    data: {
      imported: entries.length,
      inserted: result.upsertedCount,
      updated: result.modifiedCount,
    },
  });
}
