#!/usr/bin/env bash
# ดึงโค้ดล่าสุดของทั้ง 2 repo แล้ว build ใหม่ ใช้โดย GitHub Actions และสั่งมือก็ได้
# ติดตั้ง: cp deploy/deploy.sh /opt/daily/deploy.sh && chmod +x /opt/daily/deploy.sh
# วางไว้นอก repo ตั้งใจ — ถ้าอยู่ในนั้น git pull จะเขียนทับสคริปต์ที่กำลังรันอยู่
set -euo pipefail

ROOT=${ROOT:-/opt/daily}
FRONTEND="$ROOT/daily_reminder"
BACKEND="$ROOT/sprint_reminder_backend"
BRANCH=${BRANCH:-master}

# repo ทั้งสองฝั่ง deploy พร้อมกันได้ ล็อกไว้กันสองงานชนกันกลางคัน
exec 9>"$ROOT/.deploy.lock"
flock 9

for repo in "$BACKEND" "$FRONTEND"; do
  if [ ! -d "$repo/.git" ]; then
    echo "ไม่พบ git repo ที่ $repo — clone ให้ครบก่อน" >&2
    exit 1
  fi
  echo "==> อัปเดต $(basename "$repo")"
  git -C "$repo" fetch --prune origin
  # ยึดตามของบน remote เสมอ ไม่เอาของที่ใครเผลอแก้ค้างไว้บนเครื่อง
  git -C "$repo" reset --hard "origin/$BRANCH"
done

cd "$FRONTEND"
echo "==> build + start"
docker compose up -d --build
docker image prune -f >/dev/null   # เก็บ image เก่าไม่ให้ดิสก์เต็ม

PORT=$(grep -E '^HTTP_PORT=' .env 2>/dev/null | cut -d= -f2 || true)
PORT=${PORT:-80}

echo "==> รอให้ระบบพร้อม (สูงสุด 60 วินาที)"
for _ in $(seq 1 30); do
  if curl -fsS "http://localhost:$PORT/api/health" >/dev/null 2>&1 &&
     curl -fsS -o /dev/null "http://localhost:$PORT/"; then
    echo "deploy สำเร็จ"
    exit 0
  fi
  sleep 2
done

echo "ระบบไม่ตอบสนองหลัง deploy — log ล่าสุด:" >&2
docker compose ps
docker compose logs --tail 50
exit 1
