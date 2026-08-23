import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `ไม่พบ environment variable "${name}" — คัดลอก .env.example เป็น .env แล้วกรอกค่าให้ครบ`
    );
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  mongoUri: required("MONGODB_URI"),
  mongoDb: process.env.MONGODB_DB ?? "sprint_reminder",
  corsOrigins: (process.env.CORS_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
};

export const isProd = env.nodeEnv === "production";
