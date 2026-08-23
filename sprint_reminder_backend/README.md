# sprint_reminder_backend

Express + TypeScript + MongoDB สำหรับเก็บ daily standup ของแต่ละ squad

## เริ่มใช้งาน

```bash
npm install
npm run dev      # http://localhost:4000
```

`npm start` จะ build ใหม่ให้ก่อนเสมอ (`prestart`) เพื่อไม่ให้รัน `dist/` เก่าที่ยังไม่มีโค้ดล่าสุด

ค่าเชื่อมต่ออยู่ใน `.env` (ถูก gitignore ไว้ — ดูตัวอย่างที่ `.env.example`)

| ตัวแปร        | ความหมาย                                   |
| ------------- | ------------------------------------------ |
| `MONGODB_URI` | connection string ของ MongoDB              |
| `MONGODB_DB`  | ชื่อ database (ค่าเริ่มต้น `sprint_reminder`) |
| `PORT`        | พอร์ตของ API (ค่าเริ่มต้น `4000`)            |
| `CORS_ORIGIN` | origin ของ frontend คั่นด้วย `,`            |

## API

ทุก endpoint อยู่ใต้ `/api`

| Method   | Path                       | ทำอะไร                                           |
| -------- | -------------------------- | ------------------------------------------------ |
| `GET`    | `/health`                  | สถานะเซิร์ฟเวอร์ + การเชื่อมต่อ DB                 |
| `GET`    | `/squads`                  | รายชื่อ squad และเวลา daily                       |
| `GET`    | `/entries`                 | รายการ daily (กรองด้วย `squadId`, `from`, `to`, `limit`) |
| `GET`    | `/entries/:squadId/:date`  | daily ของ squad ในวันนั้น (ไม่มี = คืนฟอร์มเปล่า)   |
| `PUT`    | `/entries/:squadId/:date`  | บันทึก/อัปเดต daily (upsert)                      |
| `DELETE` | `/entries/:squadId/:date`  | ลบ daily ของวันนั้น                               |
| `POST`   | `/entries/import`          | นำเข้าหลายรายการพร้อมกัน (upsert ทีละก้อน)          |
| `GET`    | `/holidays`                | วันหยุด (กรองด้วย `year` หรือ `from`/`to` และ `type`) |
| `POST`   | `/holidays`                | เพิ่มวันลาเอง (ใส่ `endDate` เพื่อลาต่อเนื่อง)        |
| `POST`   | `/holidays/import`         | นำเข้าวันหยุดจากเนื้อหาไฟล์ `.ics`                  |
| `DELETE` | `/holidays/:date?title=`   | ลบรายการนั้น (ไม่ส่ง `title` = ลบทั้งวัน)            |

`:date` เป็นรูปแบบ `yyyy-mm-dd` และ `:squadId` เป็น `zeny` หรือ `ledgerx`

รูปแบบ response: `{ "data": ... }` เมื่อสำเร็จ และ `{ "error": { "message": ..., "details"?: ... } }` เมื่อผิดพลาด

## วันหยุด

วันหยุดมาจากไฟล์ `.ics` ไม่ได้ดึงสดจากเว็บ — รายละเอียดและวิธีเปลี่ยนไฟล์อยู่ใน [data/README.md](data/README.md)

ตอนเซิร์ฟเวอร์เริ่มทำงาน ถ้า collection `holidays` ยังว่าง จะนำเข้าไฟล์ `.ics` ทุกไฟล์ใน `data/` ให้อัตโนมัติ

`POST /holidays/import` รับ body เป็น `{ "ics": "<เนื้อหาไฟล์>", "source": "ชื่อไฟล์", "replaceAll": true }`

วันหยุดมี 3 ประเภทในฟิลด์ `type`

| `type`       | ที่มา                     | ความหมาย                        |
| ------------ | ------------------------- | ------------------------------- |
| `public`     | ไฟล์ `.ics`               | วันหยุดจริง                      |
| `observance` | ไฟล์ `.ics`               | วันสำคัญที่ไม่ได้หยุด             |
| `leave`      | `POST /holidays` (manual) | วันลาที่ผู้ใช้เพิ่มเอง             |

`replaceAll: true` ล้างเฉพาะรายการที่มาจากไฟล์ (`source != "manual"`) วันลาที่เพิ่มเองจะไม่ถูกลบ

## โครงสร้าง

```
src/
  server.ts                    จุดเริ่ม: ต่อ DB แล้วค่อย listen
  app.ts                       ประกอบ express app
  config/env.ts                อ่านและตรวจ environment variables
  config/squads.ts             ตั้งค่า squad (ต้องตรงกับฝั่ง frontend)
  db/mongo.ts                  เชื่อมต่อ mongoose + graceful shutdown
  db/seed.ts                   นำเข้าวันหยุดจาก data/*.ics ตอนเริ่มระบบ
  lib/ics.ts                   ตัวอ่านไฟล์ .ics
  models/entry.model.ts        schema ของ daily 1 รายการ
  models/holiday.model.ts      schema ของวันหยุด 1 วัน
  routes/index.ts              รวม router ทั้งหมด
  routes/entries.routes.ts     เส้นทางของ /entries
  routes/holidays.routes.ts    เส้นทางของ /holidays
  controllers/entries.controller.ts
  controllers/holidays.controller.ts
  middleware/error.ts          not found + error handler (Express 5 ส่ง async error มาเอง)
  schemas/entry.schema.ts      zod validation ของ daily
  schemas/holiday.schema.ts    zod validation ของวันหยุด
```
