# วิธีการเผยแพร่ ts-webcam บน npm

เอกสารนี้อธิบายขั้นตอนการเผยแพร่ไลบรารี ts-webcam บน npm registry

## ขั้นตอนการเผยแพร่

### 1. ตรวจสอบและอัปเดตเวอร์ชัน

ก่อนเผยแพร่ ให้ตรวจสอบและอัปเดตเวอร์ชันในไฟล์ `package.json` ตามหลัก Semantic Versioning:

- **MAJOR** (x.0.0): เมื่อมีการเปลี่ยนแปลง API ที่ไม่สามารถใช้งานร่วมกับเวอร์ชันเก่าได้
- **MINOR** (0.x.0): เมื่อเพิ่มฟีเจอร์ใหม่ที่สามารถใช้งานร่วมกับเวอร์ชันเก่าได้
- **PATCH** (0.0.x): เมื่อแก้ไขบัก โดยไม่มีการเปลี่ยนแปลง API

```bash
# ตัวอย่างการอัปเดตเวอร์ชันด้วย npm
npm version patch  # เพิ่ม patch version (0.0.x)
npm version minor  # เพิ่ม minor version (0.x.0)
npm version major  # เพิ่ม major version (x.0.0)

# หรือแก้ไขเวอร์ชันในไฟล์ package.json โดยตรง
```

### 2. ทดสอบการ build

ทดสอบว่าไลบรารีสามารถ build ได้อย่างถูกต้อง:

```bash
pnpm build
```

### 3. ทดสอบแพ็คเกจก่อนเผยแพร่

ทดสอบว่าแพ็คเกจมีไฟล์ที่ถูกต้องและครบถ้วน:

```bash
# สร้างไฟล์ .tgz ของแพ็คเกจ
pnpm pack
# หรือ
npm pack

# ตรวจสอบเนื้อหาของไฟล์ .tgz
tar -tf ts-webcam-x.x.x.tgz
```

### 4. ทดสอบการเผยแพร่แบบจำลอง (Dry Run)

ทดสอบการเผยแพร่แบบจำลองเพื่อตรวจสอบว่าทุกอย่างพร้อมสำหรับการเผยแพร่จริง:

```bash
pnpm publish:dry
# หรือ
npm publish --dry-run
```

### 5. เข้าสู่ระบบ npm

เข้าสู่ระบบ npm ด้วยบัญชีของคุณ:

```bash
npm login
```

### 6. เผยแพร่แพ็คเกจ

เผยแพร่แพ็คเกจไปยัง npm registry:

```bash
pnpm publish
# หรือ
npm publish
```

### 7. ตรวจสอบการเผยแพร่

หลังจากเผยแพร่แล้ว ตรวจสอบว่าแพ็คเกจปรากฏบน npm registry:

```bash
npm view ts-webcam
```

หรือเข้าไปที่เว็บไซต์ npm: https://www.npmjs.com/package/ts-webcam

## การเผยแพร่เวอร์ชัน Beta

หากต้องการเผยแพร่เวอร์ชัน beta:

```bash
# อัปเดตเวอร์ชันเป็น beta
npm version prerelease --preid=beta

# เผยแพร่เวอร์ชัน beta
pnpm publish:beta
# หรือ
npm publish --tag beta
```

ผู้ใช้สามารถติดตั้งเวอร์ชัน beta ได้ด้วย:

```bash
npm install ts-webcam@beta
```

## คำสั่งที่มีให้ใช้งาน

ไลบรารี ts-webcam มีคำสั่งสำหรับการเผยแพร่ดังนี้:

- `pnpm build` - สร้างไลบรารีสำหรับการเผยแพร่
- `pnpm pack` - สร้างไฟล์ .tgz ของแพ็คเกจเพื่อทดสอบ
- `pnpm publish:dry` - ทดสอบการเผยแพร่แบบจำลอง
- `pnpm publish` - เผยแพร่แพ็คเกจไปยัง npm registry
- `pnpm publish:beta` - เผยแพร่แพ็คเกจเวอร์ชัน beta
