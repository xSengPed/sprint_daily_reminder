import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { isProd } from "../config/env";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function notFound(req: Request, res: Response): void {
  res.status(404).json({
    error: { message: `ไม่พบเส้นทาง ${req.method} ${req.originalUrl}` },
  });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: "ข้อมูลที่ส่งมาไม่ถูกต้อง",
        details: err.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
    });
    return;
  }

  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: { message: err.message, details: err.details },
    });
    return;
  }

  // ชนกับ unique index (squadId + date) — เกิดตอนยิง upsert พร้อมกัน
  if (typeof err === "object" && err !== null && (err as { code?: number }).code === 11000) {
    res.status(409).json({ error: { message: "มี daily ของวันนี้อยู่แล้ว" } });
    return;
  }

  const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาดที่ไม่รู้จัก";
  console.error("[error]", err);
  res.status(500).json({
    error: {
      message: isProd ? "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" : message,
    },
  });
}
