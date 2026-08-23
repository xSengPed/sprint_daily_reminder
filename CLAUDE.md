# CLAUDE.md

คำแนะนำสำหรับ Claude Code เวลาทำงานกับ repo นี้

## โจทย์ตั้งต้น

ผู้ใช้ทำงาน 2 squad และต้อง daily ทุกเช้า

| Squad   | เวลา daily    |
| ------- | ------------- |
| Zeny    | 10:00 - 10:15 |
| LedgerX | 10:45 - 11:00 |

Daily ประกอบด้วย 3 ช่อง: **เมื่อวานทำอะไร / วันนี้จะทำอะไร / ติดปัญหาอะไรบ้าง**

## โครงสร้าง repo

โปรเจกต์เดียวแต่มี 2 แอป — ไม่ได้ใช้ monorepo tool ต้อง `npm install` แยกกัน

```
/                        frontend: Next.js 15 (App Router) + React 19 + TypeScript
  src/app/               หน้า / (daily) และ /calendar
  src/components/        UI ทั้งหมด
  src/lib/               state, API client, utils
sprint_reminder_backend/ backend: Express 5 + Mongoose + zod
deploy/                  Caddyfile + คู่มือ deploy ขึ้น Proxmox
```

CSS เป็นไฟล์เดียวที่ [src/app/globals.css](src/app/globals.css) ใช้ CSS variable เป็น design token
**ไม่มี Tailwind และไม่มี CSS-in-JS** — เพิ่มสไตล์ใหม่ให้เขียนต่อในไฟล์นี้ตามหมวดที่มีอยู่

## คำสั่ง

ต้องใช้ Node 20 ขึ้นไป (พัฒนาบน Node 22, image ที่ deploy ใช้ `node:22-alpine`)

```bash
# frontend (ราก repo)
npm install
npm run dev              # http://localhost:3000
npm run build            # ต้องผ่านก่อนถือว่างานเสร็จ

# backend
cd sprint_reminder_backend
npm install
npm run dev              # http://localhost:4000/api — tsx watch คอมไพล์สดให้
npm run typecheck        # tsc --noEmit
npm start                # build ใหม่ให้ก่อนเสมอผ่าน prestart
```

ยังไม่มี test runner และไม่มี linter/formatter ที่ตั้งค่าไว้ — เกณฑ์ตรวจงานคือ `npm run build`
ของ frontend และ `npm run typecheck` ของ backend ต้องผ่านทั้งคู่

## ไฟล์ env (ถูก gitignore — ต้องสร้างเองหลัง clone)

`/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

`/sprint_reminder_backend/.env`

```env
MONGODB_URI=mongodb://admin:<รหัสผ่าน>@10.0.0.141:27017/?authSource=admin
MONGODB_DB=sprint_reminder
PORT=4000
CORS_ORIGIN=http://localhost:3000
```

MongoDB อยู่ที่เครื่องในวง LAN (`10.0.0.141`) — ถ้าเครื่องที่ทำงานอยู่ไม่ได้อยู่ในวงเดียวกันหรือไม่ได้ต่อ VPN
backend จะเชื่อมต่อไม่ได้ ให้รัน Mongo ในเครื่องแล้วชี้ `MONGODB_URI` ไปที่ `mongodb://localhost:27017` แทน
(ฝั่งเว็บยังใช้งานต่อได้ในโหมดออฟไลน์ แต่จะกดบันทึกขึ้นเซิร์ฟเวอร์ไม่ได้)

## เรื่องที่ต้องรู้ก่อนแก้โค้ด

**บันทึกเมื่อกดเองเท่านั้น ไม่มี auto-save**
ผู้ใช้เลือกแบบนี้เอง อย่าเผลอใส่ debounce auto-sync กลับเข้าไป การแก้ไขจะถูกเก็บเป็น draft ใน
`localStorage` พร้อม "รายชื่อรายการที่ยังไม่ได้บันทึก" (dirty set) แล้วส่งขึ้นเซิร์ฟเวอร์ตอนกดปุ่มเท่านั้น
ตอนโหลดหน้าใหม่ ข้อมูลจากเซิร์ฟเวอร์**ต้องไม่ทับ** key ที่อยู่ใน dirty set — ดู [src/lib/store.tsx](src/lib/store.tsx)

**ทุกหน้าเป็น client component ที่ถูก prerender ตอน build**
ห้ามอ่าน `new Date()` หรือ `localStorage` ตอน render เพราะค่าที่ได้ตอน build จะไม่ตรงกับตอนผู้ใช้เปิดจริง
แล้ว hydration พัง — ให้เริ่ม state เป็น `null` แล้วเซ็ตใน `useEffect` (ทำแบบนี้ทั้ง `date`, `nowMinutes`, `month`)

**`NEXT_PUBLIC_API_URL` ถูกฝังลง bundle ตอน build**
เปลี่ยนค่าแล้วต้อง build ใหม่ ตอน deploy จึงตั้งเป็น `/api` แล้วให้ Caddy ส่งต่อไป backend ที่ origin เดียวกัน

**ตั้งค่า squad อยู่ 2 ที่ ต้องตรงกัน**
[src/lib/squads.ts](src/lib/squads.ts) (ชื่อ/เวลา/สี) กับ
[sprint_reminder_backend/src/config/squads.ts](sprint_reminder_backend/src/config/squads.ts) (ใช้ validate `squadId`)
เพิ่ม squad ใหม่ต้องแก้ทั้งสองไฟล์ + `SquadId` ใน [src/lib/types.ts](src/lib/types.ts)

**วันหยุดมี 3 ประเภท**
`public` / `observance` มาจากไฟล์ `.ics` ส่วน `leave` คือวันลาที่ผู้ใช้เพิ่มเอง (`source: "manual"`)
การนำเข้า `.ics` แบบ `replaceAll` **ต้องลบเฉพาะรายการที่ `source != "manual"`** ไม่งั้นวันลาที่ผู้ใช้กรอกไว้หายหมด

**วันหยุดไม่ได้ดึงสดจาก bot.or.th**
หน้าเว็บ ธปท. โหลดข้อมูลผ่าน endpoint ภายในที่ตอบ "under maintenance" จากภายนอก และ API ทางการ
ต้องสมัครเอา `X-IBM-Client-Id` ก่อน — รายละเอียดอยู่ใน [sprint_reminder_backend/data/README.md](sprint_reminder_backend/data/README.md)
ตอนนี้ใช้ไฟล์ `.ics` แทน และ seed อัตโนมัติตอนเริ่มเซิร์ฟเวอร์เมื่อ collection ยังว่าง

**วันที่ใช้ string `yyyy-mm-dd` ตลอดทั้งระบบ**
ทั้ง key ใน state, พารามิเตอร์ API และฟิลด์ใน MongoDB — เทียบมาก/น้อยด้วย string ได้เลย
อย่าเผลอใช้ `toISOString()` กับ `new Date()` ที่เป็น local time เพราะจะเลื่อนไปวันก่อนหน้า
ให้ใช้ `toKey()` / `fromKey()` ใน [src/lib/date.ts](src/lib/date.ts)

## แนวการเขียน

- ข้อความบน UI และคอมเมนต์เป็นภาษาไทย ชื่อตัวแปร/ฟังก์ชันเป็นอังกฤษ
- คอมเมนต์เขียนเฉพาะตอนที่ต้องอธิบาย **"ทำไม"** ไม่ใช่เล่าซ้ำว่าโค้ดทำอะไร
- TypeScript `strict` ทั้งสองฝั่ง เลี่ยง `any`
- backend ตอบกลับรูปแบบเดียวกันหมด: สำเร็จ `{ "data": ... }` ผิดพลาด `{ "error": { "message": ... } }`
- validate ทุก input ด้วย zod ที่ `src/schemas/` แล้วปล่อย error ให้ error handler กลางจัดการ
  (Express 5 ส่ง async error ให้เอง ไม่ต้องมี asyncHandler)

## Deploy

`docker compose up -d --build` ที่ราก repo — ขั้นตอนบน Proxmox อยู่ใน [deploy/README.md](deploy/README.md)

## สิ่งที่ยังไม่มี (ตั้งใจ)

- **auth** — API เปิดให้ใครก็ได้ที่ยิงถึง เหมาะกับใช้ในวง LAN เท่านั้น ถ้าจะเปิดออกอินเทอร์เน็ตต้องทำ auth ก่อน
- **test** — ยังไม่มี test suite
- **multi-user** — ระบบนี้ออกแบบมาสำหรับผู้ใช้คนเดียว ไม่มีการแยกข้อมูลตามผู้ใช้
