# แผนงานและรายการสิ่งที่ต้องทำ (Task Roadmap)

## Phase 1: การวางรากฐาน (Foundation) - **เสร็จสิ้น**
- [x] [T-001] เริ่มต้นโปรเจกต์ Next.js พร้อม TypeScript
- [x] [T-002] ติดตั้ง Tailwind CSS และ Shadcn UI
- [x] [T-003] ตั้งค่าการเชื่อมต่อ Firebase (`src/lib/firebase.ts`)
- [x] [T-004] กำหนด Data Models หลัก (`src/lib/types.ts`)

## Phase 2: ฟีเจอร์หลัก (Core Features) - **กำลังดำเนินการ**
### การจัดการโปรเจกต์และงาน (Project & Task Management)
- [x] [T-010] สร้างหน้ารายการโปรเจกต์ (`src/app/projects`)
- [/] [T-011] พัฒนาแบบฟอร์มสร้างโปรเจกต์
- [x] [T-012] สร้างหน้ารายละเอียดโปรเจกต์ (`src/app/project/[id]`)
- [/] [T-013] พัฒนาระบบสร้างงาน (Task) และการจัดหมวดหมู่แบบ Matrix
- [ ] [T-014] พัฒนาระบบ Drag & Drop สำหรับอัปเดตสถานะงาน

### การแสดงผลภาพรวม (Visualization)
- [x] [T-020] ตั้งค่าหน้าปฏิทิน (`src/app/calendar`)
- [ ] [T-021] เชื่อมข้อมูลงาน (Tasks) เข้ากับปฏิทิน
- [ ] [T-022] พัฒนา Analytics Dashboard (`src/app/analytics`)

### ระบบบริหารความสัมพันธ์ลูกค้า (CRM)
- [x] [T-025] ออกแบบ Data Model สำหรับ Customer และ Activity Logs (`src/lib/types.ts`)
- [x] [T-026] สร้างหน้า Customer List (`src/app/customers/page.tsx`) พร้อม Project Stats & Health Score
- [x] [T-027] สร้างหน้า Customer Details, 360-View Project & Rating System (`src/app/customers/[id]/page.tsx`) พร้อมหน้า Edit & Error Handling
- [ ] [T-028] เชื่อมต่อ Calendar Events กับ Customers เพื่อสร้าง Auto Activity Log

## Phase 3: ฟีเจอร์ขั้นสูง (Advanced Features)
- [ ] [T-030] พัฒนา "Party Mode" (ระบบ Presence แสดงสถานะออนไลน์แบบ Real-time)
- [ ] [T-031] ปรับปรุงระบบบันทึกเวลาทำงาน (Time Tracking Log)
- [ ] [T-032] รองรับการแนบไฟล์ (File Attachment) ในแต่ละงาน

## Phase 4: การทำงานร่วมกับ AI (AI Integration - Genkit)
- [ ] [T-040] ติดตั้งและตั้งค่า Genkit สำหรับ Local Development
- [ ] [T-041] สร้าง AI Flow สำหรับ "ช่วยแตกงานย่อยอัตโนมัติ" (Auto-generate Subtasks)
- [ ] [T-042] สร้าง AI Flow สำหรับ "วิเคราะห์ความเสี่ยงโปรเจกต์" (Project Risk Analysis)

## Phase 5: การ Deployment และปรับแต่ง (Deployment & Polish)
- [ ] [T-050] กำหนดกติกาความปลอดภัย (Firebase Security Rules) ให้สมบูรณ์
- [ ] [T-051] Deploy ขึ้น Production (Vercel หรือ Firebase App Hosting)
- [ ] [T-052] ตรวจสอบประสิทธิภาพ (Performance Audit ด้วย Lighthouse)

## Phase 6: การปรับปรุงและบำรุงรักษา Codebase (Optimization & Maintenance)
- [x] [T-060] ล้างไฟล์ขยะใน Git Repo (ลบ `.next` ออกจาก History)
- [x] [T-061] ปรับโครงสร้าง `src/components/charts.tsx` (แยกเป็น Component ย่อย)
- [ ] [T-062] ตรวจสอบและซิงค์ TypeScript Interfaces (`src/lib/types.ts`) ให้ตรงกับ Firestore Schema จริง (Customers, Spyfall)
- [x] [T-063] แก้ไขข้อผิดพลาด `react-beautiful-dnd` กับ React Strict Mode (`src/components/strict-mode-droppable.tsx`)
- [x] [T-064] แก้ปัญหา Firebase Permission Error บนหน้า Calendar และ Tracking (เปลี่ยนเป็น Client-Side Fetching)
- [x] [T-065] ปรับปรุงระบบ Tracking ให้รองรับข้อผิดพลาด (Promise.allSettled) และแก้ Logic การกรองชื่อ (Assignee Filter)
- [x] [T-066] เพิ่ม Loading State ให้กับปุ่ม Submit ในทุกฟอร์ม (Projects, Customers, Calendar) เพื่อป้องกัน Double Submit
- [x] [T-070] ทำ Pagination / Infinite Scroll และ Server-Side Search ในหน้า Customer List (เปลี่ยนจากดึงทั้งหมดเป็นดึงทีละส่วน)
- [x] [T-071] ปรับปรุง Calendar ให้ดึงข้อมูลตามช่วงเวลา (Start/End Date) แทนการดึงทั้งหมด
- [x] [T-072] ตรวจสอบและแก้ไข Firestore Query ที่ไม่มี Limit ในหน้า Projects และอื่นๆ
- [x] [T-073] ปรับปรุง Real-time Listeners (onSnapshot) ให้ใช้ getDocs ในส่วนข้อมูลที่นิ่งเพื่อลด Cost
