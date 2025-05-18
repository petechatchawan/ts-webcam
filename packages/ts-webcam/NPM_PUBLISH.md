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
npm pack

# ตรวจสอบเนื้อหาของไฟล์ .tgz
tar -tf ts-webcam-x.x.x.tgz
```

### 4. เข้าสู่ระบบ npm

เข้าสู่ระบบ npm ด้วยบัญชีของคุณ:

```bash
npm login
```

### 5. เผยแพร่แพ็คเกจ

เผยแพร่แพ็คเกจไปยัง npm registry:

```bash
npm publish
```

หรือหากใช้ pnpm:

```bash
pnpm publish
```

### 6. ตรวจสอบการเผยแพร่

หลังจากเผยแพร่แล้ว ตรวจสอบว่าแพ็คเกจปรากฏบน npm registry:

```bash
npm view ts-webcam
```

หรือเข้าไปที่เว็บไซต์ npm: https://www.npmjs.com/package/ts-webcam

## การเผยแพร่เวอร์ชัน Beta หรือ Release Candidate

หากต้องการเผยแพร่เวอร์ชัน beta หรือ release candidate:

```bash
# อัปเดตเวอร์ชันเป็น beta
npm version prerelease --preid=beta

# เผยแพร่เวอร์ชัน beta
npm publish --tag beta
```

ผู้ใช้สามารถติดตั้งเวอร์ชัน beta ได้ด้วย:

```bash
npm install ts-webcam@beta
```

## การเผยแพร่แพ็คเกจ Scoped

หากต้องการเผยแพร่แพ็คเกจแบบ scoped (เช่น @username/ts-webcam):

1. แก้ไขชื่อแพ็คเกจในไฟล์ package.json:

```json
{
  "name": "@username/ts-webcam",
  ...
}
```

2. เผยแพร่แพ็คเกจ:

```bash
npm publish --access public
```

## การอัปเดตเอกสาร

หลังจากเผยแพร่แพ็คเกจแล้ว อย่าลืมอัปเดตเอกสารและตัวอย่างการใช้งานให้ตรงกับเวอร์ชันล่าสุด
