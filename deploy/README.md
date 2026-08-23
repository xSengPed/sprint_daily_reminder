# Deploy ขึ้น Proxmox

รูปแบบที่เลือกใช้: **LXC container 1 ตัว รัน Docker Compose 3 service** — Caddy (reverse proxy) → Next.js + Express
ส่วน MongoDB ใช้ตัวที่มีอยู่แล้วที่ `10.0.0.141` ไม่ต้องย้าย

```
                    ┌─────────────────── LXC: daily-reminder ───────────────────┐
   เบราว์เซอร์ ──80──┤  caddy ──/api/*──> backend:4000 ──┐                        │
                    │        └─(อื่น ๆ)─> frontend:3000  │                        │
                    └───────────────────────────────────┼────────────────────────┘
                                                        └──27017──> MongoDB 10.0.0.141
```

ทำไมถึงเลือกแบบนี้

- **LXC เบากว่า VM มาก** (กิน RAM ~100MB ตอน idle) และ Proxmox สำรอง/ย้ายเครื่องได้เหมือนกัน
- **มี Caddy คั่นหน้า** ทำให้เว็บกับ API อยู่ origin เดียวกัน → ไม่ต้องตั้ง CORS, ไม่ต้องฝัง IP ของเซิร์ฟเวอร์ลงใน bundle ของ frontend และเปลี่ยน IP เครื่องทีหลังไม่ต้อง build ใหม่
- **ทุก container ไม่เก็บ state** ข้อมูลอยู่ที่ MongoDB ทั้งหมด พังก็ลบทิ้งแล้วสร้างใหม่ได้

---

## 1. สร้าง LXC บน Proxmox

ผ่าน GUI: **Create CT** → เลือก template `debian-12-standard`

| ค่า        | ที่แนะนำ                                    |
| ---------- | ------------------------------------------- |
| Cores      | 2                                           |
| Memory     | 4096 MB (ตอน build Next ใช้เยอะ รันจริงใช้ ~400MB) |
| Disk       | 12 GB                                       |
| Network    | ตั้ง static IP ไว้ เช่น `10.0.0.150/24`      |
| Unprivileged | ติ๊กไว้ (ปลอดภัยกว่า)                      |

**สำคัญ** — ที่แท็บ Options → Features ต้องเปิด **Nesting** (และ **keyctl**) ไม่งั้น Docker รันใน LXC ไม่ได้

หรือสั่งจาก shell ของ Proxmox host

```bash
pct create 150 local:vztmpl/debian-12-standard_12.7-1_amd64.tar.zst \
  --hostname daily-reminder \
  --cores 2 --memory 4096 --rootfs local-lvm:12 \
  --net0 name=eth0,bridge=vmbr0,ip=10.0.0.150/24,gw=10.0.0.1 \
  --features nesting=1,keyctl=1 \
  --unprivileged 1 --onboot 1 --start 1
```

> ถ้าองค์กรไม่อนุญาตให้รัน Docker ใน LXC ให้สร้างเป็น **VM (Debian 12)** แทน ขั้นตอนที่เหลือเหมือนกันทุกอย่าง

## 2. ติดตั้ง Docker ใน container

```bash
pct enter 150            # หรือ ssh เข้าไป

apt update && apt install -y curl git
curl -fsSL https://get.docker.com | sh
docker compose version   # ต้องขึ้นเวอร์ชัน ไม่ error
```

## 3. เอาโค้ดขึ้นเครื่อง

frontend กับ backend อยู่คนละ repo และ `docker-compose.yml` อ้าง `../sprint_reminder_backend`
จึงต้อง clone ไว้ข้างกัน

```bash
mkdir -p /opt/daily && cd /opt/daily
git clone <url ของ repo frontend> daily_reminder
git clone <url ของ repo backend> sprint_reminder_backend
cd daily_reminder
```

ได้โครงแบบนี้

```
/opt/daily/
  daily_reminder/            <- รันคำสั่ง docker compose ที่นี่
  sprint_reminder_backend/
```

ถ้ายังไม่มี git remote ใช้ `scp -r` จากเครื่องตัวเองก็ได้ (อย่าลืม **ไม่ต้อง**ก๊อป `node_modules`)

## 4. ตั้งค่า .env

```bash
cp .env.example .env
nano .env
```

ต้องแก้อย่างน้อย `MONGODB_URI` ให้ชี้ไปที่ MongoDB ของคุณ

```env
MONGODB_URI=mongodb://admin:รหัสผ่าน@10.0.0.141:27017/?authSource=admin
MONGODB_DB=sprint_reminder
HTTP_PORT=80
NEXT_PUBLIC_API_URL=/api
```

ไฟล์ `.env` ถูก gitignore ไว้แล้ว รหัสผ่านจะไม่หลุดขึ้น git

## 5. รัน

```bash
docker compose up -d --build
```

ครั้งแรกจะ build นาน 2-5 นาที เสร็จแล้วเปิด `http://10.0.0.150` ได้เลย

ตรวจสถานะ

```bash
docker compose ps                    # backend ต้องขึ้น healthy
docker compose logs -f backend       # ดู log
curl http://localhost/api/health     # {"data":{"ok":true,"db":"connected",...}}
```

ตอนขึ้นครั้งแรก backend จะ seed วันหยุดจาก `data/holidays.ics` ของ repo backend ให้อัตโนมัติ (เฉพาะตอนที่ collection ยังว่าง)

---

## อัปเดตเวอร์ชันใหม่

```bash
cd /opt/daily/sprint_reminder_backend && git pull
cd /opt/daily/daily_reminder && git pull
docker compose up -d --build
```

Caddy กับ backend จะสลับตัวใหม่ให้เอง ผู้ใช้เห็นดาวน์ไทม์ไม่กี่วินาที

## คำสั่งที่ใช้บ่อย

```bash
docker compose restart backend    # รีสตาร์ตเฉพาะ backend
docker compose down               # หยุดทั้งหมด
docker compose logs --tail 100 caddy
docker compose exec backend sh    # เข้าไปดูข้างใน container
```

---

## เรื่องที่ต้องเช็กก่อนใช้งานจริง

**MongoDB ต้องยอมให้ container เชื่อมต่อ**
ถ้า `mongod.conf` ตั้ง `bindIp: 127.0.0.1` ไว้ container จะต่อไม่ได้ ต้องแก้เป็น IP ของ LAN แล้วรีสตาร์ต mongod
ทดสอบจากใน container: `docker compose exec backend wget -qO- http://127.0.0.1:4000/api/health`

**API ยังไม่มี auth**
ใครยิงถึงพอร์ต 80 ของเครื่องนี้ได้ก็แก้ข้อมูลได้ ตอนนี้เหมาะกับใช้ในวง LAN เท่านั้น
ถ้าจะเปิดออกอินเทอร์เน็ตต้องใส่ auth ก่อน (หรืออย่างน้อยกั้นด้วย basic auth ของ Caddy)

**สำรองข้อมูล**
ข้อมูลทั้งหมดอยู่ที่ MongoDB ตัวเดิม — ตั้ง `mongodump` cron ไว้ที่ `10.0.0.141` และ Proxmox backup ของ LXC ตัวนี้ก็พอ (ตัว container ไม่มีข้อมูลอะไรให้หาย)

**อยากได้ HTTPS**
มี domain ชี้มาที่เครื่องนี้แล้วแก้ `deploy/Caddyfile` จาก `:80` เป็นชื่อโดเมน Caddy จะขอใบรับรอง Let's Encrypt ให้อัตโนมัติ (ต้องเปิดพอร์ต 80/443 เข้ามาถึงเครื่อง)

```
daily.example.com {
	encode gzip
	handle /api/* { reverse_proxy backend:4000 }
	handle { reverse_proxy frontend:3000 }
}
```

**RAM ไม่พอตอน build**
ถ้าตั้ง LXC ไว้ 2GB แล้ว build Next แล้วโดน OOM ให้เพิ่ม RAM ชั่วคราวเป็น 4GB ตอน build แล้วค่อยลดลง หรือ build image จากเครื่อง dev แล้ว push เข้า registry

---

## ถ้าอยากรัน MongoDB ในเครื่องเดียวกันด้วย

สร้างไฟล์ `docker-compose.override.yml` (compose จะอ่านต่อจากไฟล์หลักอัตโนมัติ)

```yaml
services:
  mongo:
    image: mongo:7
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: เปลี่ยนรหัสผ่านด้วย
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

  backend:
    depends_on:
      - mongo

volumes:
  mongo_data:
```

แล้วเปลี่ยนใน `.env` เป็น `MONGODB_URI=mongodb://admin:รหัสผ่าน@mongo:27017/?authSource=admin`

> โหมดนี้ข้อมูลอยู่ใน docker volume `mongo_data` แล้ว — ต้อง backup volume นี้ด้วย ไม่ใช่แค่ Proxmox snapshot
