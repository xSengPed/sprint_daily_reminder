# Daily Reminder — Zeny & LedgerX

Web app จัดการ daily standup ของ 2 squad ในหน้าเดียว

| Squad   | เวลา          |
| ------- | ------------- |
| Zeny    | 10:00 - 10:15 |
| LedgerX | 10:45 - 11:00 |

repo นี้เป็น **frontend อย่างเดียว** ส่วน API อยู่คนละ repo ที่ `sprint_reminder_backend`
ให้ clone ไว้ข้างกันแบบนี้ (คำสั่ง docker compose อ้าง path นี้)

```
<โฟลเดอร์ที่เก็บโปรเจกต์>/
  daily_reminder/            <- repo นี้
  sprint_reminder_backend/   <- repo ของ API
```

## เริ่มใช้งาน

เปิด 2 เทอร์มินัล — backend ต้องขึ้นก่อน frontend จึงจะซิงก์ข้อมูลได้

```bash
# เทอร์มินัลที่ 1 — backend (อีก repo)
cd ../sprint_reminder_backend
npm install
npm run dev      # http://localhost:4000/api

# เทอร์มินัลที่ 2 — frontend (repo นี้)
npm install
npm run dev      # http://localhost:3000
```

ที่อยู่ API ตอน dev ตั้งไว้ใน `.env.local` (`NEXT_PUBLIC_API_URL=http://localhost:4000/api`) ส่วนค่าเชื่อมต่อ MongoDB อยู่ใน `.env` ของ repo backend — ทั้งสองไฟล์ถูก gitignore ไว้

คำสั่งอื่น: `npm run build` (build production), `npm start` (รัน build ที่ได้)

## ฟีเจอร์

- **3 ช่องตามฟอร์แมต daily** — เมื่อวานทำอะไร / วันนี้จะทำอะไร / ติดปัญหาอะไรบ้าง แยกการ์ดของแต่ละ squad
- **นาฬิกา daily ถัดไป** — บอกว่าอีกกี่นาทีถึงคิวของ squad ไหน และขึ้นสถานะ "กำลัง daily" ระหว่างช่วงเวลานั้น
- **ดึงงานเมื่อวาน** — ก๊อป "วันนี้จะทำอะไร" ของวันทำการก่อนหน้า (ข้าม ส-อา) มาเป็น "เมื่อวานทำอะไร" อัตโนมัติ ไม่ซ้ำรายการเดิม
- **คัดลอก Daily** — พรีวิวข้อความแล้วคัดลอกไปวางใน Slack / Teams ได้ทันที ทั้งแบบราย squad และรวม 2 squad
- **บันทึกเมื่อกดเอง** — ไม่มี auto-sync แก้เสร็จแล้วกด **บันทึก** ในการ์ดของ squad นั้น หรือ **บันทึกทั้งหมด** / `Ctrl+S` เพื่อส่งขึ้น MongoDB ทีเดียว ปุ่มจะกดไม่ได้ถ้ายังไม่มีอะไรเปลี่ยน
- **ของที่แก้ไว้ไม่หาย** — ระหว่างยังไม่กดบันทึก ทุกการแก้ไขถูกเก็บเป็น draft ใน `localStorage` ปิดแท็บหรือรีเฟรชแล้วกลับมากรอกต่อได้ (มีเตือนก่อนปิดแท็บด้วย) และตอนโหลดใหม่ draft จะไม่ถูกข้อมูลบนเซิร์ฟเวอร์ทับ
- **ยกเลิกการแก้ไขได้** — กด "ยกเลิกการแก้ไข" เพื่อดึงของบนเซิร์ฟเวอร์กลับมาทับ draft
- **ประวัติย้อนหลัง** — ดูรายการล่าสุด พร้อมธงจำนวน blocker คลิกเพื่อกระโดดไปวันนั้น
- **สำรอง / นำเข้า** — export เป็นไฟล์ JSON และ import กลับเข้าฐานข้อมูลผ่าน `POST /entries/import`
- **ปฏิทินรายเดือน** — ดูวันหยุดกับ daily ที่บันทึกไว้พร้อมกันที่ [/calendar](src/app/calendar/page.tsx)
- **สลับธีมได้** — สวิตช์มุมขวาบนเลือก สว่าง / มืด / ตามระบบ จำค่าไว้ใน `localStorage` และไม่กะพริบตอนโหลดหน้า

## หน้า /calendar

ปฏิทินรายเดือนที่รวมวันหยุดกับ daily ที่บันทึกไว้ไว้ในภาพเดียว

- ตารางเริ่มวันจันทร์ แต่ละช่องบอกชื่อวันหยุด (แดง) หรือวันสำคัญที่ไม่ได้หยุด (เทา)
- จุดสีในช่อง = วันนั้นมี daily ของ squad ไหนบันทึกไว้ พร้อมตัวเลขจำนวน blocker
- คลิกวันไหนก็ได้เพื่อกระโดดไปกรอก daily ของวันนั้น (`/?date=yyyy-mm-dd`)
- **เพิ่มวันลาเองได้** — กด + ในช่องวัน หรือปุ่ม "เพิ่มวันลา" บนแถบเครื่องมือ ใส่ช่วงวันที่กับเหตุผล (ลาพักร้อน / ลากิจ / ลาป่วย / WFH) ลาต่อเนื่องหลายวันได้ในครั้งเดียว
- **ยกเลิกวันลาได้** — กด × บนป้ายวันลาในช่องปฏิทิน หรือปุ่ม "เอาออก" ในรายการด้านล่าง
- ปุ่ม **นำเข้าไฟล์ .ics** อัปโหลดปฏิทินวันหยุดชุดใหม่ทับของเดิมได้จากหน้าเว็บเลย โดย**ไม่ลบวันลาที่เพิ่มเอง**
- วันหยุดถูกแคชไว้ใน `localStorage` ด้วย เปิดดูได้แม้ backend ล่ม

วันหยุดตั้งต้นมาจากไฟล์ `data/holidays.ics` ของ repo backend — วิธีเปลี่ยนไฟล์อยู่ใน `data/README.md` ของ repo นั้น

## คีย์ลัด

| ปุ่ม              | ทำอะไร                            |
| ----------------- | --------------------------------- |
| `←` / `→`         | เปลี่ยนวัน                        |
| `T`               | กลับมาวันนี้                      |
| `Enter`           | เพิ่มรายการถัดไป (ในช่องกรอก)     |
| `Backspace`       | ลบรายการที่ว่าง                   |
| `Ctrl` + `S`      | บันทึกทั้งหมดขึ้นเซิร์ฟเวอร์        |
| `Esc`             | ปิดหน้าต่างพรีวิว                 |

## โครงสร้าง

```
src/
  app/
    layout.tsx        root layout + provider ของ state และวันหยุด
    page.tsx          หน้าหลัก: วันที่, การ์ด squad, ประวัติ
    calendar/page.tsx ปฏิทินรายเดือน + วันหยุด
    globals.css       design tokens + ทุกสไตล์
  components/
    SquadCard.tsx     การ์ด daily ของ 1 squad
    ItemList.tsx      รายการ bullet แก้ไขได้ 1 ช่อง
    DateNav.tsx       แถบเลือกวันที่
    StandupClock.tsx  นาฬิกานับถอยหลัง daily ถัดไป
    ThemeToggle.tsx   สวิตช์ สว่าง / มืด / ตามระบบ
    HistoryList.tsx   ประวัติย้อนหลัง
    PageNav.tsx       สลับหน้า Daily / ปฏิทิน
    LeaveModal.tsx    ฟอร์มเพิ่มวันลา
    PreviewModal.tsx  พรีวิว + คัดลอก
    SaveStatus.tsx    สถานะการบันทึก + ปุ่มบันทึกทั้งหมด
  lib/
    types.ts          Entry / Item / Squad
    squads.ts         ตั้งค่า squad + เวลา daily
    date.ts           แปลงวันที่ไทย, วันทำการก่อนหน้า
    storage.ts        อ่าน-เขียน localStorage, export/import
    format.ts         แปลง entry เป็นข้อความพร้อม paste
    api.ts            client ของ backend API
    holidays.tsx      React context ของวันหยุด (+ แคชในเครื่อง)
    store.tsx         React context: state + draft ที่ยังไม่บันทึก + เรียก API
    theme.ts          อ่าน-เขียนธีม + สคริปต์กันจอกะพริบ
```

## Deploy

มี Docker Compose ให้พร้อมใช้: Caddy (reverse proxy) → Next.js + Express โดยใช้ MongoDB ตัวเดิมที่มีอยู่

```bash
cp .env.example .env     # แก้ MONGODB_URI ให้ชี้ไปที่ MongoDB ของคุณ
docker compose up -d --build
```

compose ไฟล์นี้ build backend จาก `../sprint_reminder_backend` จึงต้อง clone repo นั้นไว้ข้างกันก่อน

เว็บกับ API อยู่ origin เดียวกันผ่าน Caddy (`/api/*` → backend) จึงไม่ต้องตั้ง CORS และไม่ต้องฝัง IP เซิร์ฟเวอร์ลงใน bundle

มี GitHub Actions ให้ด้วย — merge เข้า `master` ที่ repo ไหน (frontend หรือ backend) ก็ deploy ทั้งระบบให้อัตโนมัติ
ผ่าน self-hosted runner บนเครื่องปลายทาง ([.github/workflows/](.github/workflows/))

ขั้นตอนแบบละเอียดสำหรับ **Proxmox** (สร้าง LXC, เปิด nesting, ติดตั้ง Docker, อัปเดตเวอร์ชัน, HTTPS) อยู่ใน [deploy/README.md](deploy/README.md)

## Backend

อยู่คนละ repo — รายละเอียด API ทั้งหมดอยู่ใน README ของ repo `sprint_reminder_backend`

## ปรับแต่ง

แก้ชื่อ squad หรือเวลา daily ได้ที่ [src/lib/squads.ts](src/lib/squads.ts) — เพิ่ม squad ใหม่ในอาร์เรย์ได้เลย หน้าเว็บกับนาฬิกาจะปรับตามเอง (อย่าลืมเพิ่ม id ใหม่ใน `SquadId` ที่ [src/lib/types.ts](src/lib/types.ts) และใน `src/config/squads.ts` ของ repo backend ด้วย เพราะฝั่ง backend ตรวจ squadId ที่ไม่รู้จักทิ้ง)
