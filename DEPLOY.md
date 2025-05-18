# วิธีการ Deploy ts-webcam Demo

เอกสารนี้อธิบายวิธีการ deploy ts-webcam demo ไปยัง Firebase Hosting

## ขั้นตอนการ Deploy

### 1. การ Deploy แบบปกติ

เพื่อ deploy เวอร์ชันล่าสุดของแอปพลิเคชันไปยัง Firebase Hosting ให้รันคำสั่งต่อไปนี้:

```bash
pnpm deploy
```

คำสั่งนี้จะทำการ:
1. Build แอปพลิเคชัน docs
2. Deploy ไปยัง Firebase Hosting ที่ URL: https://ts-webcam.web.app

### 2. การ Deploy แบบ Preview Channel

หากต้องการทดสอบการเปลี่ยนแปลงก่อนที่จะ deploy ไปยังเวอร์ชันหลัก สามารถใช้ Firebase Preview Channels:

```bash
pnpm deploy:preview
```

คำสั่งนี้จะสร้าง URL ชั่วคราวสำหรับทดสอบการเปลี่ยนแปลง

### 3. การ Deploy ด้วยตนเอง

หากต้องการ deploy ด้วยตนเอง สามารถทำตามขั้นตอนต่อไปนี้:

1. Build แอปพลิเคชัน:
   ```bash
   pnpm build --filter=docs
   ```

2. Deploy ไปยัง Firebase Hosting:
   ```bash
   firebase deploy --only hosting:ts-webcam
   ```

## การตั้งค่าความปลอดภัย

แอปพลิเคชันนี้ได้รับการตั้งค่าความปลอดภัยดังนี้:

1. **HTTP Security Headers**:
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - X-XSS-Protection: 1; mode=block
   - Referrer-Policy: strict-origin-when-cross-origin
   - Strict-Transport-Security: max-age=31536000; includeSubDomains

2. **การจัดการ Cache**:
   - ไฟล์สถิต (JS, CSS, รูปภาพ): cache 1 ปี
   - ไฟล์ HTML และ JSON: ไม่มีการ cache
   - ไฟล์ในโฟลเดอร์ assets: cache 1 ปี

## ข้อควรระวังเกี่ยวกับข้อมูลสำคัญ

- Firebase Hosting เหมาะสำหรับเก็บไฟล์สถิตเท่านั้น
- ข้อมูลสำคัญควรเก็บใน Firebase Firestore, Realtime Database หรือ Cloud Storage ที่มีการตั้งค่าความปลอดภัยเฉพาะ
- ควรใช้ Firebase Authentication สำหรับการควบคุมการเข้าถึง
- ข้อมูลส่วนบุคคลที่ละเอียดอ่อนควรมีการเข้ารหัสและควบคุมการเข้าถึงอย่างเข้มงวด
