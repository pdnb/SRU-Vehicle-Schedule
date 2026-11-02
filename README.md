# ตารางการใช้รถ (SRU Vehicle Schedule)

หน้าเว็บแสดงตารางการใช้รถรายวัน แยกตามคัน อ่านข้อมูลจาก Oracle PROMIS (อ่านอย่างเดียว)
Next.js 15 + Ant Design 5 + node-oracledb

## เริ่มใช้งาน

```bash
npm install
cp .env.example .env.local   # กรอกค่าเชื่อมต่อ Oracle
npm run dev                  # http://localhost:3000
```

ถ้า `USE_MOCK=1` หรือยังไม่ได้ตั้ง `ORACLE_CONNECT_STRING` หน้าเว็บจะแสดงข้อมูลตัวอย่าง (มีป้าย "ข้อมูลตัวอย่าง")

## แหล่งข้อมูลใน PROMIS

SQL ทั้งหมดอยู่ใน `src/lib/queries.ts`

| ข้อมูล | ตาราง/วิว |
|---|---|
| รถ | `CAR` (เฉพาะ `CANBOOKING = 'Y'`) + `CAMPUS` |
| การจอง | `V_BUL_CARBOOKINGITEM` + `BUL_CARBOOKING` + `DEPARTMENT` + `BUL_CARBOOKINGPLACE` |
| เบอร์โทร | ผู้รับผิดชอบ `BUL_CARBOOKING.UNDERTAKERPHONENO`, คนขับ `BUL_CARDRIVER.PHONENO` |
| ชื่อสถานะ | `SYSBYTEDES` (`ROOMBOOKING` / `ROOMBOOKINGSTATUS`) |
| ประเภทรถ | `SYSBYTEDES` (`CAR` / `CARTYPE`) ถ้าไม่มีจะแสดงเป็นรหัส |

ค่าเริ่มต้นจะแสดงเฉพาะสถานะ `S` (อนุมัติ/ส่งรายการ) เลือกดูสถานะอื่น (`W` ทำการ, `A` บันทึก, `V` ยกเลิก) ได้จากตัวกรองสถานะ

## API

`GET /api/schedule?date=YYYY-MM-DD` → `{ date, source, vehicles, bookings, statuses, phonesHidden }`

ถ้าผู้เรียกไม่ได้ล็อกอินด้วยอีเมล @sru.ac.th ที่ยืนยันแล้ว จะได้ `phonesHidden: true` และ `driverPhone`, `undertakerPhone`, `contact` ของทุกรายการจะเป็น `null` เพราะถูกตัดออกที่ server

## ล็อกอินด้วย Auth0 (ดูเบอร์โทร)

ตารางการใช้รถเปิดดูได้โดยไม่ต้องล็อกอิน แต่เบอร์โทรคนขับ/ผู้รับผิดชอบ และช่อง "ติดต่อผู้ขอ" จะแสดงเฉพาะผู้ที่ล็อกอินด้วยอีเมล `@sru.ac.th` ที่ยืนยันแล้ว (`email_verified`) กฎนี้อยู่ใน `src/lib/auth0.ts`
แอปใช้ `@auth0/nextjs-auth0` v4 โดย `src/middleware.ts` สร้าง route `/auth/login`, `/auth/logout`, `/auth/callback` ให้

ตั้งค่าใน Auth0 Dashboard:

1. **Applications → Create Application → Regular Web Application** แล้วนำ Domain, Client ID, Client Secret ไปใส่ใน `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`
2. ใน Settings ของแอป ให้ตั้ง
   - **Allowed Callback URLs:** `http://localhost:3000/auth/callback, https://<domain>/auth/callback`
   - **Allowed Logout URLs:** `http://localhost:3000, https://<domain>`
3. **Connections:** แนะนำให้เปิดเฉพาะ Google (Google Workspace ของ sru.ac.th) เพื่อให้ผู้ใช้ล็อกอินด้วยบัญชีมหาวิทยาลัยได้ทันที
4. (แนะนำ) **Actions → Triggers → post-login:** เพิ่ม Action ที่ปฏิเสธบัญชีโดเมนอื่นตั้งแต่ตอนล็อกอิน แอปตรวจโดเมนเองอยู่แล้ว แต่ Action จะช่วยไม่ให้มีบัญชีโดเมนอื่นเข้ามาใน tenant
   ```js
   exports.onExecutePostLogin = async (event, api) => {
     const email = (event.user.email || "").toLowerCase();
     if (!event.user.email_verified || !email.endsWith("@sru.ac.th")) {
       api.access.deny("ใช้ได้เฉพาะบัญชี @sru.ac.th");
     }
   };
   ```
5. สร้าง `AUTH0_SECRET` ด้วย `openssl rand -hex 32` และตั้ง `APP_BASE_URL` เป็น URL ของเว็บ

`GET /api/health` → สถานะของแอป (ใช้เป็น healthcheck) · `GET /api/health?db=1` → ตรวจการเชื่อมต่อ PROMIS ด้วย

## Deploy บน Coolify

แอปมี `Dockerfile` แบบ multi-stage (Next.js standalone + Oracle Instant Client 21.19 สำหรับ Thick mode) และ healthcheck ในตัว

### ตั้งค่าใน Coolify

1. **New Resource → Application** แล้วเลือก repository นี้
2. **Build Pack:** `Dockerfile` (ไม่ใช่ Nixpacks — Nixpacks ไม่ติดตั้ง Oracle Instant Client ให้)
3. **Ports Exposes:** `3000`
4. **Health Check:** path `/api/health`
5. **Environment Variables** (ติ๊ก *Is Secret* ที่ `ORACLE_PASSWORD`, `AUTH0_CLIENT_SECRET`, `AUTH0_SECRET`):

   | ตัวแปร | ค่า |
   |---|---|
   | `USE_MOCK` | `0` |
   | `ORACLE_USER` | บัญชีที่มีสิทธิ์ SELECT อย่างเดียว |
   | `ORACLE_PASSWORD` | รหัสผ่าน |
   | `ORACLE_CONNECT_STRING` | `<promis_host>:1521/<service_name>` |
   | `ORACLE_SCHEMA` | `PROMIS` |
   | `AUTH0_DOMAIN` | เช่น `<tenant>.us.auth0.com` |
   | `AUTH0_CLIENT_ID` | Client ID ของแอปใน Auth0 |
   | `AUTH0_CLIENT_SECRET` | Client Secret ของแอปใน Auth0 |
   | `AUTH0_SECRET` | ผลจาก `openssl rand -hex 32` (ห้ามใช้ค่าเดียวกับเครื่อง dev) |
   | `APP_BASE_URL` | `https://<domain>` |

   **ไม่ต้อง** ตั้ง `ORACLE_CLIENT_DIR` — image ตั้งไว้แล้วเป็น `/opt/oracle/instantclient` (ถ้าคัดลอกค่า Windows จาก `.env.local` ไปใส่ แอปจะหา Oracle Client ไม่เจอ)

6. Deploy แล้วเปิด `https://<domain>/api/health?db=1` ต้องได้ `"db":"ok"`

### ⚠️ ปัญหา subnet ชนกับ PROMIS (ต้องตรวจก่อน deploy)

IP ของ PROMIS อยู่ในช่วงเดียวกับที่ Docker แจกให้ network ภายใน (`172.17.0.0/16`–`172.31.0.0/16`)
ถ้าบนเครื่อง Coolify มี Docker network ที่ subnet ครอบ IP ของ PROMIS เครื่องนั้นจะ route traffic ไป PROMIS เข้า bridge ของ Docker เอง container ทุกตัวจึงต่อ PROMIS ไม่ได้ (อาการ: `NJS-040 connection request timeout`)
network ที่สร้างก่อนๆ บนเครื่องใหม่มักได้ subnet ช่วง `172.18.0.0/16` ขึ้นไป — รวมถึง network `coolify` ด้วย

ตรวจบนเครื่อง Coolify (แทน `<promis_host>` ด้วย IP ของ PROMIS):

```bash
ip route get <promis_host>
```

```bash
for n in $(docker network ls -q); do docker network inspect -f '{{.Name}} {{range .IPAM.Config}}{{.Subnet}}{{end}}' $n; done
```

ถ้า `ip route get` ตอบว่าออกทาง `dev br-...` หรือ `dev docker0` (แทนที่จะเป็น interface ของเครื่อง เช่น `eth0`) แสดงว่าชน วิธีแก้ (ทำช่วงที่หยุดระบบได้ เพราะต้อง restart Docker และสร้าง network ที่ชนใหม่):

1. เพิ่มใน `/etc/docker/daemon.json` (รวมกับ key เดิมที่มีอยู่ อย่าเขียนทับทั้งไฟล์)
   ```json
   { "default-address-pools": [{ "base": "10.201.0.0/16", "size": 24 }] }
   ```
2. `sudo systemctl restart docker`
3. ลบแล้วสร้าง network ที่ subnet ครอบ IP ของ PROMIS ใหม่ (ต้องหยุด container ที่อยู่ใน network นั้นก่อน) เพื่อให้ได้ subnet ใหม่จากช่วง `10.201.x.x`
4. ตรวจซ้ำด้วย `ip route get <promis_host>` ว่าออกทาง interface ของเครื่องแล้ว

### หมายเหตุด้านความปลอดภัย

เบอร์โทรถูกจำกัดให้เฉพาะผู้ล็อกอินด้วยบัญชี @sru.ac.th (ดูหัวข้อ "ล็อกอินด้วย Auth0") แต่ชื่อบุคลากร หน่วยงาน และปลายทางยังเปิดให้ทุกคนเห็น ถ้าไม่ต้องการให้คนนอกเห็นข้อมูลเหล่านี้ ควรจำกัดการเข้าถึงเพิ่ม เช่น ให้เข้าได้เฉพาะเครือข่ายมหาวิทยาลัย

## หมายเหตุ

- ใช้บัญชี Oracle ที่มีสิทธิ์ SELECT เท่านั้น
- PROMIS เป็น Oracle รุ่นเก่ากว่า 12.1 ซึ่ง Thin mode ต่อไม่ได้ (NJS-138) จึงต้องติดตั้ง Oracle Instant Client แล้วตั้ง `ORACLE_CLIENT_DIR` (บน Windows ใช้ Instant Client ที่ติดตั้งไว้ เช่น `C:/Oracle/instantclient_12_2`; ใน Docker image ตั้งให้แล้ว)
- ใช้ Instant Client 21 เพราะเป็นรุ่นล่าสุดที่ยังรองรับฐานข้อมูล 11.2 และต้องเป็นแพ็กเกจ `basic` (ไม่ใช่ `basiclite`) เพื่อรองรับ character set ภาษาไทย
- เวลาจาก PROMIS เป็นเวลาท้องถิ่น (ไม่มี timezone) จึงส่งเป็นสตริง `YYYY-MM-DDTHH:mm:ss`
