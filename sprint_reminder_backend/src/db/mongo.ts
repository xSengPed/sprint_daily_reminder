import mongoose from "mongoose";
import { env } from "../config/env";

export async function connectMongo(): Promise<void> {
  mongoose.set("strictQuery", true);

  await mongoose.connect(env.mongoUri, {
    dbName: env.mongoDb,
    serverSelectionTimeoutMS: 8000,
  });

  console.log(`[mongo] เชื่อมต่อสำเร็จ · db=${env.mongoDb}`);

  mongoose.connection.on("disconnected", () =>
    console.warn("[mongo] หลุดการเชื่อมต่อ")
  );
  mongoose.connection.on("reconnected", () =>
    console.log("[mongo] เชื่อมต่อกลับมาแล้ว")
  );
  mongoose.connection.on("error", (err) =>
    console.error("[mongo] error:", err.message)
  );
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.connection.close();
}

/** 1 = connected ตาม readyState ของ mongoose */
export function isMongoReady(): boolean {
  return mongoose.connection.readyState === 1;
}
