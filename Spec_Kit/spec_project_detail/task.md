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
- [x] [T-014] พัฒนาระบบ Drag & Drop สำหรับอัปเดตสถานะงาน (Implement `react-beautiful-dnd` & Backend Recalculation Stats)
- [x] [T-015] เพิ่ม Field `Owner` ในระดับ Project (Type, UI, Actions)
- [x] [T-016] เพิ่ม Autocomplete สำหรับ Project Owner (เลือกจาก Customer) และปุ่ม Quick Add Customer

### การแสดงผลภาพรวม (Visualization)
- [x] [T-020] ตั้งค่าหน้าปฏิทิน (`src/app/calendar`)
- [ ] [T-021] เชื่อมข้อมูลงาน (Tasks) เข้ากับปฏิทิน
- [x] [T-022] พัฒนา Analytics Dashboard (`src/app/analytics`)
    - **Concept**: แยกมุมมองเป็น 2 Tabs เพื่อความชัดเจน (`Tabs` Component)
    - **Principles**: 
        - **Separation of Concerns**: แยก "สถานะงาน" (Overview) ออกจาก "ประสิทธิภาพการทำงาน" (Workload/Time) เพื่อลด Cognitive Load ของผู้ใช้
        - **Interactive Discovery**: ใช้ Cross-filtering เพื่อให้ผู้ใช้ "เล่น" กับข้อมูลเพื่อหา Insight ได้เอง (e.g., คลิกที่คน A -> เห็นงานทั้งหมดของ A)
    - **Implementation Details**:
        - **UI Architecture**: ใช้ `Tabs` component ของ shadcn/ui แยก View ออกเป็น:
            1. **Task Overview**: เน้น Management (Status, Assignee, Burndown)
            2. **Workload Analysis**: เน้น Performance (Hours Ranking, Trends)
        - **Unified State Management**: ใช้ State กลาง (`filters`, `filteredTasks`) ที่ระดับ Parent (`AnalyticsClient`) เพื่อให้ Global Filter (Header) ส่งผลต่อทั้ง 2 Tabs
        - **Table UI Refinements**:
            - **Scrollable View**: กำหนด Fixed Height ให้แสดงประมาณ 10 แถว และมี Scroll Bar ภายใน (`max-h-[xyz] overflow-y-auto`)
            - **Sticky Header**: หัวตารางต้องค้างอยู่ด้านบนเมื่อเลื่อนดูข้อมูล (`sticky top-0 bg-background z-10`)
            - **Assignee Labels**: แสดงชื่อผู้รับผิดชอบเป็น Label (Badge) แยกรายบุคคล ไม่รวมเป็น text ยาวๆ
        - **Data Fetching**:
            - **Tasks**: ข้อมูลดิบสำหรับการวางแผน
            - **projectTrackingProgress**: ข้อมูล Log จริงสำหรับการคำนวณ Workload (Hours Worked)
    - **Tab 1: Task Overview (Existing Visualizations)**
        - **Task Status**: Donut Chart แสดงสัดส่วนงาน
        - **Task Assignee**: Bar Chart แสดงจำนวนงานต่อคน (Distribution)
        - **Project Progress**: Progress Bar รวมของแต่ละโปรเจกต์
        - **Priority Matrix**: Scatter Chart (Effort vs Effect)
        - **Burndown Chart**: Timeline ของงานตาม Due Date
    - **Tab 2: Workload Analysis (New Requirements)**
        - **Project Workload Ranking**: Bar Chart จัดอันดับโปรเจกต์ที่ใช้เวลาจริงมากที่สุด
        - **Employee Workload Ranking**: Bar Chart จัดอันดับคนที่ลงเวลาทำงานสูงสุด
        - **Work Hours Trend**: แนวโน้มชั่วโมงทำงานรายสัปดาห์ (Weekly ISO) หรือรายเดือน
        - **Task Performance Table**: ตารางเจาะลึกที่แสดง "Total Hours Worked" ของแต่ละงาน

### ระบบบริหารความสัมพันธ์ลูกค้า (CRM)
- [x] [T-025] ออกแบบ Data Model สำหรับ Customer และ Activity Logs (`src/lib/types.ts`)
- [x] [T-026] สร้างหน้า Customer List (`src/app/customers/page.tsx`) พร้อม Project Stats & Health Score
- [x] [T-027] สร้างหน้า Customer Details, 360-View Project & Rating System (`src/app/customers/[id]/page.tsx`) พร้อมหน้า Edit & Error Handling
- [x] [T-029] เพิ่มฟีเจอร์ OS Customer Filtering ตาม Dark Mode (`isDarkModeOnly`) ลงใน Customer List, Edit Form, Calendar Members **และ Tracking Page**
- [ ] [T-028] เชื่อมต่อ Calendar Events กับ Customers เพื่อสร้าง Auto Activity Log
- [x] [T-079] **Customer Statistics**: แก้ไขการคำนวณ Star Chart และเพิ่ม Customer Project Count (Completed/Total) ด้วยการ denormalize ข้อมูลลง Customer Document
    - **Principles**: Denormalization for Performance. การนับ Project ของลูกค้าทุกคนขณะโหลด List (O(N*M)) กิน resource สูง จึงควรเก็บยอดรวมไว้ที่ตัวลูกค้า (O(1))
    - **Implementation Details**:
        - เพิ่ม Field `totalProjects`, `completedProjects` ใน `Customer` Interface
        - Server Action `recalculateCustomerStats(customerId)` คำนวณยอดใหม่ทุกครั้งที่มีการ Create/Update/Delete Project
        - แก้ไข Race Condition ใน `customer-detail-client.tsx` ให้แสดง Star Chart ได้ถูกต้อง
- [x] [T-080] **Project Owner Linkage & UI**: ปรับปรุงการเก็บข้อมูล Project Owner ให้เก็บ `customerId` (Link) ควบคู่กับชื่อ และแสดง Badge "Owner" บนการ์ดโปรเจกต์
    - **Principles (Why it broke)**:
        - **Data Mismatch**: Dropdown (`SingleSelectAutocomplete`) รับค่า `value` เป็น ID (`customerId`) แต่ต้นทางส่งค่าเป็น Name (`owner`) มาให้ ทำให้หาใน Options ไม่เจอและแสดงเป็นค่าว่าง
        - **Incomplete Fetching**: Server Listener (Initial Load) ลืมหยิบ field `customerId` มาจาก Firestore ทำให้ตอนเปิด Edit Dialog ค่า `project.customerId` เป็น undefined
    - **Implementation Details (What was fixed)**:
        - **UI Component**: แก้ `SingleSelectAutocomplete.tsx` ให้รอ `options` โหลดเสร็จ async แล้วค่อยจับคู่ ID กับ Name และ fallback ไปแสดงค่าที่รับมา (legacy name) ถ้าหา ID ไม่เจอ
        - **Data Layer**: แก้ `projects/page.tsx` (Server) และ `projects-client-page.tsx` (Client) ให้ map field `customerId` และ `owner` ออกมาให้ครบถ้วน
        - **UX**: เพิ่ม `Badge` แสดงชื่อ Owner บน Project Card (ข้าง Team Badge) พร้อม Tooltip ป้องกันชื่อยาวเกินไป
- [x] [T-081] **Refine Star Chart Metric**: ปรับปรุงการแสดงผลและคำนวณแกน "Harder" (ความเขี้ยว)
    - **Principles**: Hybrid Logic. 
        - **Visual (Chart)**: แสดงค่าตามจริง (Direct Scale) เพื่อสะท้อนบุคลิก (Harder น้อย = กราฟสั้น)
        - **Calculation (Health Score)**: ใช้ Inverted Scale (10 - Harder) เพื่อให้คะแนนรวมสะท้อน "สุขภาพ" (Harder น้อย = Health สูง)
    - **Implementation Details**:
        - `Chart Data`: ใช้ Raw Score (e.g., 2)
        - `Health Formula`: `(Payer + Visioner + NiceGuy + (10 - Harder)) / 40 * 100`
        - `Tooltip`: แสดง Raw Score
- [x] [T-082] **Fix Rating Dialog Initialization**: แก้ไขปัญหา Dialog ให้คะแนนไม่ดึงค่าล่าสุดมาแสดง
    - **Principles**: State Synchronization. Form ควรเริ่มต้นด้วย Current State ไม่ใช่ Default State
    - **Implementation Details**:
        - เพิ่ม `useEffect` ใน `customer-detail-client.tsx`
        - เมื่อ `isRateOpen` เป็น true -> ค้นหา `ratings` ล่าสุด -> `setNewRating`

### ระบบติดตามและประเมินผล (Tracking Core)
- [x] [T-085] **Verify Tracking Logic**: ตรวจสอบการทำงานของหน้า Daily Tracking ว่าส่งผลต่อ Task จริงหรือไม่
    - **Principles**: Data Integrity. การบันทึก Tracking Log ต้อง Update สถานะของ Task หลัก (Source of Truth) เสมอ
    - **Confirmed Behavior**:
        - เมื่อกด "Save All Changes" -> ระบบจะสร้าง `projectTrackingProgress` (Log)
        - **และ** ทำการ update `Progress` field ใน Collection `tasks` ทันที
        - ส่งผลให้หน้า Dashboard/Project Detail เห็น % ความคืบหน้าล่าสุดตรงกันแบบ Real-time ✅

## Phase 3: ฟีเจอร์ขั้นสูง (Advanced Features)
- [ ] [T-030] พัฒนา "Party Mode" (ระบบ Presence แสดงสถานะออนไลน์แบบ Real-time)
- [x] [T-078] **Real-time Presence (Collaboration)**: แสดง Avatar ของผู้ใช้ (Anonymous Animals) ที่กำลังแก้ไขงานใน Kanban และ Calendar (ใช้ Firestore `presence`)
    - **Principles**: Awareness & Conflict Avoidance. ให้ผู้ใช้รู้ว่ามีคนอื่นกำลังทำงานอยู่ในหน้านี้เหมือนกัน
    - **Implementation Details**:
        - สร้าง Collection `presence` ใน Firestore และ Rules `allow read, write: if true;`
        - Custom Hook `usePresence` สำหรับส่ง Heartbeat และฟังเพื่อนร่วมทีม
        - Utility `anonymous-animals.ts` สุ่มชื่อสัตว์ (e.g., "Anonymous Alpaca") กรณีไม่มี User Profile
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

- [x] [T-060] ล้างไฟล์ขยะใน Git Repo (ลบ `.next` ออกจาก History)
- [x] [T-061] ปรับโครงสร้าง `src/components/charts.tsx` (แยกเป็น Component ย่อย)
- [x] [T-062] ตรวจสอบและซิงค์ TypeScript Interfaces (`src/lib/types.ts`) ให้ตรงกับ Firestore Schema จริง (Customers, Spyfall)
- [x] [T-063] แก้ไขข้อผิดพลาด `react-beautiful-dnd` กับ React Strict Mode (`src/components/strict-mode-droppable.tsx`)
- [x] [T-064] แก้ปัญหา Firebase Permission Error บนหน้า Calendar และ Tracking (เปลี่ยนเป็น Client-Side Fetching พร้อม Auth Check)
    - **Principles**: Security Rules Compliance. Server Component (RSC) บางครั้งมีปัญหากับ `currentUser` context ในการ fetch
    - **Implementation Details**:
        - ย้าย Logic จาก `page.tsx` (Server) มาเป็น `useCalendarEvents` (Client Hook)
        - ใช้ `onAuthStateChanged` รอให้ User Login สมบูรณ์ก่อนเริ่ม Query
- [x] [T-065] ปรับปรุงระบบ Tracking ให้รองรับข้อผิดพลาด (Promise.allSettled) และแก้ Logic การกรองชื่อ (Assignee Filter)
- [x] [T-066] เพิ่ม Loading State ให้กับปุ่ม Submit ในทุกฟอร์ม (Projects, Customers, Calendar) เพื่อป้องกัน Double Submit
    - **Principles**: User Feedback & Data Integrity. ป้องกัน User กดย้ำๆ จนเกิด Data Duplicate
    - **Implementation Details**:
        - สร้าง component `LoadingButton` รับ prop `loading` แสดง Spinner
        - ใช้ `useActionState` (React 19) หรือ `try/catch/finally` เพื่อ toggle loading state
- [x] [T-075] **OS Logic Update**: ปรับปรุง Logic การกรอง OS Project ใน Tracking and Calendar ให้เป็น Mutually Exclusive (Dark=OS vs Light=Standard)

## Phase 6: Optimization & Scalability (Performance)
- [x] [T-070] ทำ Pagination / Infinite Scroll และ Server-Side Search ในหน้า Customer List (**Lean UI & Debounce Fix**, ปิด Stats ชั่วคราว)
    - **Principles**: Scalability. การโหลดข้อมูลทั้งหมด (fetch all) ไม่รองรับอนาคตที่มีลูกค้าเป็นพันคน
    - **Implementation Details**:
        - Firestore `limit(12)` และ `startAfter` (Cursor-based Pagination)
        - Search ใช้ `where('name', '>=', query).where('name', '<=', query + '\uf8ff')` (Prefix Search)
- [x] [T-071] ปรับปรุง Calendar ให้ดึงข้อมูลตามช่วงเวลา (Start/End Date) แทนการดึงทั้งหมด
    - **Principles**: Query Scope Reduction. โหลดเฉพาะสิ่งที่ User มองเห็น (Viewport)
    - **Implementation Details**:
        - รับค่า `currentDate` และคำนวณ `startOfMonth`/`endOfMonth`
        - Query Firestore `where('startDate', '>=', start).where('startDate', '<=', end)`
- [x] [T-072] ตรวจสอบและแก้ไข Firestore Query ที่ไม่มี Limit ในหน้า Projects และอื่นๆ
- [x] [T-073] ปรับปรุง Real-time Listeners (onSnapshot) ให้ใช้ getDocs ในส่วนข้อมูลที่นิ่งเพื่อลด Cost
- [x] [T-074] **Performance Optimization (Tracking)**: เปลี่ยนระบบ Cache จาก Global Load เป็น On-Demand (Chunk Query) ตาม Task IDs ของผู้ใช้ที่เลือก
    - **Principles**: Lazy Loading. เดิมโหลดงานทั้งหมด (All Tasks) ช้ามาก การโหลดเฉพาะงานที่เกี่ยวข้องกับ Project ที่เลือกช่วยลด Payload ได้ >90%
    - **Implementation Details**:
        - ใช้ `where('projectId', 'in', projectIds)` แบ่ง Chunk ทีละ 30 IDs เพื่อเลี่ยง Firestore Limit
        - เก็บ Cache ใส่ Map (`projectId` -> `tasks[]`) ป้องกันโหลดซ้ำ
- [x] [T-076] **Global Caching Strategy**: พัฒนา `DataCacheContext` เพื่อ Cache ข้อมูล Customers ลดการโหลดซ้ำเมื่อเปลี่ยนหน้า (Sustain & Lean)
    - **Principles**: Single Source of Truth + Reduce Reads. ข้อมูลลูกค้าเปลี่ยนไม่บ่อย ไม่จำเป็นต้อง fetch ใหม่ทุกหน้า
    - **Implementation Details**:
        - สร้าง React Context เก็บ `customers`, `lastUpdated`, `isLoaded`
        - check `if (!isLoaded || now - lastUpdated > 60s)` ก่อน fetch ใหม่
- [x] [T-077] **Auto-Refresh Cache**: เพิ่มระบบดึงข้อมูลใหม่เบื้องหลังทุก 1 นาที (Background Re-fetch) เพื่อลด Gap ของข้อมูล
    - **Principles**: balancing Data Freshness vs. Read Costs. ต้องการให้ข้อมูลไม่อัปเดตช้าเกินไปโดยไม่ต้องใช้ Real-time Listener ตลอดเวลา
    - **Implementation Details**:
        - ใช้ `setInterval` ใน `DataCacheContext` เพื่อนับถอยหลัง 60 วินาที
        - เรียก `refreshCustomers()` แบบ Silent (ไม่แสดง Loading เต็มจอ) เมื่อครบเวลา
        - เพิ่ม State `lastUpdated` เพื่อตรวจสอบความสดใหม่ของข้อมูล
- [x] [T-083] **Optimize Cache Refresh Rate**: ปรับรอบการ Auto-Refresh ข้อมูลลูกค้าจาก 1 นาทีเป็น 5 นาที
    - **Principles**: Cost Reduction. ลดจำนวน Read Operation ลง 5 เท่าสำหรับ Idle Client
- [x] [T-084] **Idle System (Soft-Logout)**: ระบบพักการทำงานเมื่อไม่มี Interaction เกิน 4 นาที 30 วินาที
    - **Principles**: Load Shedding w/ Better UX. หยุดการทำงานเบื้องหลัง (Polling) แต่ไม่ดีด User ไปหน้า Login (เพราะเราไม่มี) -> ใช้ Overlay บังหน้าจอแทน
    - **Implementation Details**:
        - สร้าง `IdleOverlay` component
        - ถ้า Idle > 4:30 นาที -> แสดง Overlay (Backdrop Blur) + ปุ่ม "Re-connect"
        - เมื่อ Active (Overlay visible) -> หยุด `DataCacheContext` polling ชั่วคราว
        - เมื่อกด Re-connect -> ซ่อน Overlay + Resume polling



