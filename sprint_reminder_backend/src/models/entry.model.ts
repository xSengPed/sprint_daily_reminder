import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";
import { SQUAD_IDS } from "../config/squads";

const itemSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, default: "", trim: true },
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

const entrySchema = new Schema(
  {
    squadId: { type: String, required: true, enum: SQUAD_IDS, index: true },
    /** yyyy-mm-dd */
    date: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, "date ต้องอยู่ในรูปแบบ yyyy-mm-dd"],
      index: true,
    },
    yesterday: { type: [itemSchema], default: [] },
    today: { type: [itemSchema], default: [] },
    blockers: { type: [itemSchema], default: [] },
    note: { type: String, default: "" },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret._id;
        return ret;
      },
    },
  }
);

// daily ของ 1 squad มีได้วันละ 1 รายการเท่านั้น
entrySchema.index({ squadId: 1, date: 1 }, { unique: true });

export type EntryDoc = HydratedDocument<InferSchemaType<typeof entrySchema>>;

export const Entry = model("Entry", entrySchema);
