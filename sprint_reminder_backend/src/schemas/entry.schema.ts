import { z } from "zod";
import { SQUAD_IDS } from "../config/squads";

export const dateKey = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "ต้องเป็นรูปแบบ yyyy-mm-dd");

export const squadIdSchema = z.enum(
  SQUAD_IDS as unknown as [string, ...string[]]
);

const itemSchema = z.object({
  id: z.string().min(1),
  text: z.string().default(""),
  done: z.boolean().default(false),
});

/** body ของ PUT — ไม่รับ squadId/date เพราะอ่านจาก path เท่านั้น */
export const entryBodySchema = z.object({
  yesterday: z.array(itemSchema).default([]),
  today: z.array(itemSchema).default([]),
  blockers: z.array(itemSchema).default([]),
  note: z.string().default(""),
});

export const entryParamsSchema = z.object({
  squadId: squadIdSchema,
  date: dateKey,
});

export const listQuerySchema = z.object({
  squadId: squadIdSchema.optional(),
  from: dateKey.optional(),
  to: dateKey.optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200),
});

export const importBodySchema = z.object({
  entries: z
    .array(entryBodySchema.extend({ squadId: squadIdSchema, date: dateKey }))
    .max(2000),
});

export type EntryBody = z.infer<typeof entryBodySchema>;
