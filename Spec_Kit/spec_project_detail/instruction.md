# คำแนะนำและมาตรฐานการพัฒนา (Instruction & Standards)

## System Architecture
### 1. Real-time Collaboration (Presence System) - **[New]**
- **Concept**: ใช้ Firestore Collection `presence` เพื่อเก็บสถานะว่าใครกำลังเปิดดู/แก้ไขข้อมู (Active Editors)
- **Mechanism**:
  - เมื่อ User เปิด Dialog/Card -> เขียนชื่อและ timestamp ลงใน `presence/{documentId}`
  - เมื่อ User ปิด -> ลบชื่อออก
  - หน้าจอหลัก (Kanban/Calendar) Listen `presence` แบบ Real-time เพื่อแสดง Avatar คนที่กำลังทำงาน
- **Related Files**: `project-details-client.tsx`, `calendar-client-page.tsx`, `edit-event-dialog.tsx`

### 2. เทคโนโลยีที่ใช้ (Tech Stack)

### แกนหลัก (Core)
- **Framework**: Next.js 15.3.3 (App Router)
- **Language**: TypeScript
- **State/Props**: React 18.3

### การตกแต่งและส่วนติดต่อผู้ใช้ (Styling & UI)
- **CSS Engine**: Tailwind CSS 3.4
- **Component Library**: Shadcn UI (ใช้ Radix UI primitives)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Animations**: tailwindcss-animate

### ระบบหลังบ้านและข้อมูล (Backend & Data)
- **BaaS**: Firebase 11.10 (Firestore, Auth)
- **AI Engine**: Google Genkit 1.14 (`@genkit-ai/*`)
- **Validation**: Zod + React Hook Form
- **Deployment**: Cloudflare Pages (`@cloudflare/next-on-pages`)

### ไลบรารีสำคัญ (Key Libraries)
- `date-fns`: การจัดการวันที่และเวลา
- `react-beautiful-dnd`: ระบบลากและวาง (Drag and drop)
- `react-big-calendar`: การแสดงผลปฏิทินขนาดใหญ่

---

## โครงสร้างโฟลเดอร์ (Folder Structure)

### ระดับราก (Root Level)
```text
/
├── Spec_Kit/           # เอกสารและรายละเอียดสเปกของโปรเจกต์
│   └── spec_project_detail/ # ไฟล์สเปกที่ใช้งานจริง
├── src/                # ซอร์สโค้ดของโปรแกรม
├── public/             # ไฟล์ Static (รูปภาพ, ไอคอน)
├── .env                # ตัวแปรสภาพแวดล้อม (Environment Variables)
├── firebase.json       # การตั้งค่า Firebase
├── next.config.ts      # การตั้งค่า Next.js
└── tailwind.config.ts  # การตั้งค่า Tailwind CSS
```

### ระดับซอร์สโค้ด (`src/`)
```text
src/
├── app/                # หน้าเว็บ (Next.js App Router Pages)
│   ├── api/            # Route สำหรับ API
│   ├── projects/       # หน้ารายการโปรเจกต์
│   ├── project/[id]/   # หน้าดูรายละเอียดโปรเจกต์
│   ├── calendar/       # ฟีเจอร์ปฏิทิน
│   └── ...
├── components/         # UI Component ที่นำกลับมาใช้ซ้ำได้
│   ├── ui/             # Shadcn Primitives (ปุ่ม, อินพุต ฯลฯ)
│   └── ...             # Component เฉพาะสำหรับแต่ละฟีเจอร์
├── lib/                # ลอจิกหลักและการตั้งค่า (Core Logic)
│   ├── firebase.ts     # การเชื่อมต่อ Firebase Initialization
│   ├── types.ts        # TypeScript Interfaces (Data Models)
│   └── utils.ts        # ฟังก์ชันช่วยเหลือ (Helper functions)
├── ai/                 # ส่วนการทำงานของ Genkit AI
│   └── dev.ts          # Flow สำหรับการพัฒนา AI
└── hooks/              # Custom React Hooks
```

---

## ข้อตกลงการเขียนโค้ด (Conventions)

### การตั้งชื่อ (Naming)
- **Files**: `kebab-case` (เช่น `project-card.tsx`)
- **Components**: `PascalCase` (เช่น `ProjectCard`)
- **Interfaces**: `PascalCase` (เช่น `Project`, `Task`)
- **Variables/Functions**: `camelCase`

### การจัดการ State (State Management)
- ใช้ **Server Components** ในการดึงข้อมูล (Data Fetching) เป็นหลักเท่าที่ทําได้
- ใช้ **Client Components** (`"use client"`) สำหรับส่วนที่ต้องโต้ตอบกับผู้ใช้ (Forms, Drag & Drop)
- เก็บ Types ที่ใช้ร่วมกันไว้ใน `src/lib/types.ts`

### กฎข้อห้าม (Strict Rules)
1. **Type Safety**: ห้ามใช้ `any` ต้องกำหนด Interface ที่ชัดเจนใน `types.ts` เสมอ
2. **UI Consistency**: ให้ใช้ Component จาก `components/ui` (Shadcn) แทนการเขียน HTML/CSS ดิบ เพื่อความสวยงามที่สม่ำเสมอ
3. **Environment**: ห้าม Commit ไฟล์ `.env` ที่มี Key ความลับขึ้น Git เด็ดขาด
4. **Dark Mode = OS Mode**: ระบบใช้ Dark Mode ในการแยกแสดงข้อมูลสำหรับทีม OS (Internal) ให้ใช้ `useTheme` + `isDarkModeOnly` ในการกรองข้อมูล Projects และ Customers เสมอ
5. **Cost Awareness**: ระบบต้องมีกลไกตัดการทำงานเมื่อ User ไม่ Active (Auto-Logout > 4:30m) และไม่ควร Poll ข้อมูลถี่เกินความจำเป็น (Cache Refresh > 5m)
6. **State Persistence**: หน้าที่มีการกรองข้อมูล (Filter/Selection) ควรจดจำค่าล่าสุดไว้ใน `localStorage` เพื่อความต่อเนื่องในการใช้งาน (UX Continuity)

