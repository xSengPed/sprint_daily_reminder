# data/

วางไฟล์ `.ics` ของวันหยุดไว้ในโฟลเดอร์นี้ ตอนเซิร์ฟเวอร์เริ่มทำงานจะดูดเข้าฐานข้อมูลให้อัตโนมัติ
**เฉพาะตอนที่ยังไม่มีวันหยุดใน MongoDB เลย** (ถ้ามีแล้วจะข้าม ไม่ทับของเดิม)

## holidays.ics

ไฟล์ตั้งต้นเป็นปฏิทิน "วันหยุดในไทย" ของ Google (ครอบคลุมปี 2021–2031) ดึงมาจาก

```
https://calendar.google.com/calendar/ical/th.th%23holiday%40group.v.calendar.google.com/public/basic.ics
```

แต่ละ event ถูกแยกเป็น 2 ประเภทตาม `DESCRIPTION`

| ประเภท       | ความหมาย                                    |
| ------------ | ------------------------------------------- |
| `public`     | วันหยุดจริง (`วันหยุดนักขัตฤกษ์`)             |
| `observance` | วันสำคัญที่ไม่ได้หยุด (`วันสำคัญ`)             |

## เปลี่ยนไปใช้ไฟล์ของ ธปท. หรือปฏิทินบริษัท

1. เอาไฟล์ `.ics` มาวางทับ `holidays.ics` แล้วล้าง collection `holidays` ก่อนรีสตาร์ต **หรือ**
2. กด "นำเข้าไฟล์ .ics" ในหน้า `/calendar` ของเว็บ ซึ่งจะแทนที่ของเดิมทั้งหมด (`replaceAll`)

> หมายเหตุ: หน้า https://www.bot.or.th/th/financial-institutions-holiday.html โหลดข้อมูลผ่าน
> endpoint ภายใน (`/content/bot/.../holidaycalendar_copy.model.json`) ซึ่งตอนที่ทำระบบนี้
> ตอบกลับมาเป็นหน้า "under maintenance" จากภายนอก จึงดึงอัตโนมัติไม่ได้ ถ้าต้องการข้อมูลจาก ธปท.
> โดยตรง ให้สมัครใช้ Financial Institutions' Holidays API ที่ https://portal.api.bot.or.th
> (endpoint: `https://gateway.api.bot.or.th/financial-institutions-holidays?year=` ต้องมี
> `X-IBM-Client-Id`) แล้วแปลงผลลัพธ์เป็น `.ics` หรือยิงเข้า `POST /api/holidays/import`
