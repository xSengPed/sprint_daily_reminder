import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

const holidaySchema = new Schema(
  {
    /** yyyy-mm-dd */
    date: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, "date ต้องอยู่ในรูปแบบ yyyy-mm-dd"],
      index: true,
    },
    title: { type: String, required: true, trim: true },
    /** public/observance มาจากไฟล์ .ics ส่วน leave คือวันลาที่ผู้ใช้เพิ่มเอง */
    type: {
      type: String,
      enum: ["public", "observance", "leave"],
      default: "public",
      index: true,
    },
    /** ที่มาของรายการ: ชื่อไฟล์ .ics ที่นำเข้า หรือ "manual" ถ้าเพิ่มเอง */
    source: { type: String, default: "ics", index: true },
  },
  { timestamps: true, versionKey: false,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret._id;
        return ret;
      },
    },
  }
);

// วันเดียวกันมีได้หลายชื่อ (เช่นวันหยุดชดเชยซ้อนวันสำคัญ) แต่ชื่อซ้ำในวันเดียวไม่ควรมี
holidaySchema.index({ date: 1, title: 1 }, { unique: true });

export type HolidayDoc = HydratedDocument<InferSchemaType<typeof holidaySchema>>;

export const Holiday = model("Holiday", holidaySchema);
