import { createApp } from "./app";
import { env } from "./config/env";
import { connectMongo, disconnectMongo } from "./db/mongo";
import { seedHolidays } from "./db/seed";

async function main(): Promise<void> {
  await connectMongo();
  await seedHolidays();

  const server = createApp().listen(env.port, () => {
    console.log(`[api] พร้อมใช้งานที่ http://localhost:${env.port}/api`);
  });

  const shutdown = (signal: string) => {
    console.log(`\n[api] ได้รับ ${signal} — กำลังปิด...`);
    server.close(async () => {
      await disconnectMongo();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("[api] เริ่มเซิร์ฟเวอร์ไม่สำเร็จ:", err instanceof Error ? err.message : err);
  process.exit(1);
});
