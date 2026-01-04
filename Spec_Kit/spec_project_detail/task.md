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
- [/] [T-021] เชื่อมข้อมูลงาน (Tasks) เข้ากับปฏิทิน (Fix: Dropdown options & Dark Mode Filter)
- [x] [T-022] พัฒนา Analytics Dashboard (`src/app/analytics`)
    - **Concept**: แยกมุมมองเป็น 2 Tabs เพื่อความชัดเจน (`Tabs` Component)
    - **Principles**: 
        - **Separation of Concerns**: แยก "สถานะงาน" (Overview) ออกจาก "ประสิทธิภาพการทำงาน" (Workload/Time) เพื่อลด Cognitive Load ของผู้ใช้
        - **Interactive Discovery**: ใช้ Cross-filtering เพื่อให้ผู้ใช้ "เล่น" กับข้อมูลเพื่อหา Insight ได้เอง (e.g., คลิกที่คน A -> เห็นงานทั้งหมดของ A)
    - **Implementation Details**:
        - **UI Architecture**: ใช้ `Tabs` component ของ shadcn/ui แยก View ออกเป็น:
            1. **Task Overview**: เน้น Management (Status, Assignee, Burndown)
            2. **Workload Analysis**: เน้น Performance (Hours Ranking, Trends)
        - **Global Filter Bar (Slicers)**: แถบเครื่องมือกรองข้อมูลด้านบนสุด (ใช้ `Select`, `Popover`, `Calendar` Components) ประกอบด้วย:
            - **Project Filter**: เพิ่มตัวกรอง Project เพื่อเลือกดูงานเฉพาะโปรเจกต์ที่รับผิดชอบได้ (Show only projects with active tasks) (Searchable Dropdown) [Fixed Z-Index]
            - **Date Range Picker**: เลือกช่วงเวลา (Start - End)
            - **Employee Selector**: เลือกพนักงาน (Assignee)
            - **Status Selector**: เลือกสถานะงาน (Status)
            - **Metric Cards**: เพิ่ม Cards แสดง "Filtered Projects" และ "Employee Total" ใน Header
        - **Unified State Management**: ใช้ State กลาง (`filters`, `filteredTasks`) ที่ระดับ Parent (`AnalyticsClient`) เพื่อให้ทั้ง Slicers และ Chart-Clicks ส่งผลต่อข้อมูลชุดเดียวกัน
        - **Table UI Refinements**:
            - **Scrollable View**: กำหนด Fixed Height ให้แสดงประมาณ 10 แถว และมี Scroll Bar ภายใน (`max-h-[xyz] overflow-y-auto`)
            - **Sticky Header**: หัวตารางต้องค้างอยู่ด้านบนเมื่อเลื่อนดูข้อมูล (`sticky top-0 bg-background z-10`)
            - **Sortable Columns**: สามารถกดที่หัวตารางเพื่อเรียงลำดับข้อมูล (Sort Asc/Desc) ได้
            - **Column Separation**: แยก Field `Details` เดิมออกเป็น Column `Progress` (%) และ `Due Date` ให้ชัดเจน
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
            - **Personalized View**: หากเลือกกรอง "Assignee" ให้แสดงเฉพาะชื่อผู้นั้นและชั่วโมงงานของผู้นั้นเท่านั้น (Personal Contribution) แต่หากไม่เลือกให้แสดงทุกคนและเวลารวม (Team Contribution)

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
- [ ] [T-086] **UI State Persistence**: พัฒนาระบบจำค่า Filter/Selection เมื่อเปลี่ยนหน้า
    - **Concept**: Short-term Memory. ผู้ใช้ไม่ควรต้องเลือก Filter ใหม่ทุกครั้งที่สลับ Tab ไปมา
    - **Mechanism**: ใช้ `localStorage` เก็บ State ของหน้า Analytics (Filters) และ Tracking (Assignee/Project/Date)
    - **Scope**: `AnalyticsClient` (filters), `TrackingClient` (selection)

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
- [x] [T-051] Deploy ขึ้น Production (Cloudflare Pages)
    - [x] สร้าง Script `deploy_prod.sh` (รองรับการลบไฟล์ Metadata `._*` ใน `.next` สำหรับ External Drive)
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

### ระบบเอกสารสัญญา (Legal Agreements) - **[New]**
- [x] [T-091] สร้าง `LegalAgreement` reusable component (กำหนดรหัส [C-010])
- [x] [T-092] สร้าง `ApplicationForm` สำหรับรวมสัญญา Transport และ Guarantor (กำหนดรหัส [C-011])
- [x] [T-093] อัปเดต `traceability.md` และ `spec.md` ด้วยตัวแปร `isTransportAccepted`, `isGuarantorAccepted`

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




## Phase 7: Validated Stability (Bug Fixes)
- [x] [T-094] **Debug Calendar Deployment**: แก้ไขปัญหา ChunkLoadError และ 404 Assets บน Cloudflare Pages
    - **Symptom**: หน้า Calendar ขาวโพลน, Console ฟ้อง `ChunkLoadError` และ `MIME type mismatch`
    - **Fix**: ปรับปรุง Deployment Script (`deploy_prod.sh`) ให้ Copy ไฟล์ Static ให้ครบถ้วนและลบ Metadata ที่ก่อกวน

- [x] [T-095] **Improve Autocomplete Interaction**: ปรับปรุง UI การเลือกรายการใน `SingleSelectAutocomplete`
    - **Requirement**: รองรับ Mouse Hover เพื่อ Highlight และ Click เพื่อ Select ได้สมบูรณ์แบบ (ทำงานคู่กับ Keyboard Navigation)
    - **Fix**: เพิ่ม `onMouseEnter` และแก้ไข Logic ให้รองรับ **Case-Insensitive** เนื่องจาก `cmdk` normalize value เป็น lowercase ทำให้การเลือกรายการที่มีตัวพิมพ์ใหญ่ (เช่น Related Task) ไม่ทำงานในตอนแรก
    - **Fix**: เพิ่ม `onMouseEnter` และแก้ไข Logic ให้รองรับ **Case-Insensitive** เนื่องจาก `cmdk` normalize value เป็น lowercase ทำให้การเลือกรายการที่มีตัวพิมพ์ใหญ่ (เช่น Related Task) ไม่ทำงานในตอนแรก (Note: This fix was incomplete, see T-096)

- [x] [T-096] **Refactor Autocomplete to use IDs (Safe Mode)**: แก้ไขปัญหา Interaction ของ Autocomplete ให้สมบูรณ์ถาวรตามคำแนะนำ User
    - **Requirement**: เปลี่ยน Logic จากการใช้ `label` เป็น `value` (ID) ใน `CommandItem` เพื่อเลี่ยงปัญหา Normalization ของ `cmdk`
    - **Fix (Refined)**: 
        1. Set `shouldFilter={false}` on `Command`.
        2. **CRITICAL**: ID passed to `CommandItem` value MUST be lowercased (`option.value.toLowerCase()`) because `cmdk` enforces this internally. Passing uppercase IDs causes highlight mismatch.
        3. Match `onMouseEnter` and `onSelect` with lowercased values.

- [x] [T-097] **Fix Project Actions & Edge Compatibility**: แก้ไขปัญหา 405 Error และ Empty Team List ในหน้า Projects
    - **Symptom**: "Create Project" fails with 405/500 Error, and "Team" dropdown is empty.
    - **Root Cause**: `src/app/projects/actions.ts` and `page.tsx` use the Full Firebase SDK (`@/lib/firebase`) which crashes on Edge Runtime/Server Actions.
    - **Fix**: Migrate `actions.ts` and `page.tsx` to use `@/lib/firebase-lite` (`firebase/firestore/lite`) which is Edge-compatible.
## Appendix: Incident Logs & Case Studies (บันทึกปัญหาและกรณีศึกษา)

### Deployment Incidents
*   **Incident 8: Deployment Failed "SyntaxError: Invalid or unexpected token" at `._index.js`**
    *   **Date**: 2025-12-29
    *   **Symptom**: `wrangler pages deploy` fails with `Uncaught SyntaxError` pointing to a file starting with `._`.
    *   **Root Cause**: macOS creates metadata files inside `.vercel/output/static` *after* the build but *before* deploy, contaminating the worker bundle.
    *   **Fix**: Update `deploy_prod.sh` to clean `._*` files in `.vercel` immediately after packaging.
    *   **Prevention**: Always clean output directory specifically before uploading.

*   **Incident 9: Node.JS Compatibility Error (Runtime)**
    *   **Symptom**: Page shows "no nodejs_compat compatibility flag set". 
    *   **Root Cause**: Next.js App Router uses `node:buffer` which requires the `nodejs_compat` flag in Cloudflare Workers/Pages.
    *   **Fix**: Created `wrangler.toml` with `compatibility_flags = ["nodejs_compat"]` and `compatibility_date`. `wrangler pages deploy` respects this file.

*   **Incident 10: 404 "Not Found" on Production URL**
    *   **Date**: 2025-12-29
    *   **Symptom**: Deployment success, but visiting site shows plain "Not Found" and missing assets (favicon.ico).
    *   **Root Cause**: `next-on-pages` failed to copy `.next/static` and `public` folders to `.vercel/output/static` (Reason unknown, possibly environment specific).
    *   **Fix**: Modified `deploy_prod.sh` to explicitly copy `.next/static` and `public` to `.vercel/output/static` before deployment.
    *   **Result**: 87 files uploaded, site loading correctly.

*   **Incident 11: Persistent 404 & Deployment Blockers**
    *   **Date**: 2025-12-29
    *   **Symptom**: 
        1. `next-on-pages` crashed due to "Ma" error (`._` files JSON parse). 
        2. `vercel build` strategy failed due to missing Authentication Token on local machine.
    *   **Fix**: Modified `deploy_prod.sh` to use `npx @cloudflare/next-on-pages` (standard adapter) wrapped in an **Aggressive Background Metadata Cleaner Loop** (0.1s interval). This cleans `._` files in real-time while the build runs, preventing the crash without needing Vercel Auth.
    *   **Result**: Strategy Refined (See Incident 12).

*   **Incident 12: Build Failed due to Missing Edge Runtime Config**
    *   **Date**: 2025-12-29
    *   **Symptom**: Build in temp dir succeeded effectively (no "Ma" error), but failed at final verification step: "The following routes were not configured to run with the Edge Runtime".
    *   **Root Cause**: Dynamic routes in Next.js on Cloudflare Pages must explicitly opt-in to Edge Runtime.
    *   **Fix**: Added `export const runtime = 'edge';` to `/api/check-password`, `/customers/[id]`, `/party/spyfall/[gameId]`, and `/project/[id]`.
    *   **Result**: **SUCCESS**. Build completed with valid `_worker.js`. Ready for Deployment.

*   **Incident 13: White Screen (SES Error) on Project Detail**
    *   **Date**: 2025-12-29
    *   **Symptom**: Deployment succeeded but accessing `/project/[id]` caused `SES_UNCAUGHT_EXCEPTION` (White Screen).
    *   **Root Cause**: Full `firebase/firestore` SDK uses Node.js APIs (e.g., `grpc`, `IndexedDB` checks) incompatible with Strict Edge Runtime, which was enforced by `runtime = 'edge'`.
    *   **Fix**:
        1.  Created `src/lib/firebase-lite.ts` using `firebase/firestore/lite` (Edge Compatible).
        2.  Migrated Server Components (`project/[id]`, `project/[id]/actions`, `customers/[id]`) to use Lite SDK.
        3.  Retained `runtime = 'edge'` to satisfy Cloudflare Build requirements.
    *   **Result**: Build Success. Runtime stability improved.

*   **Incident 14: Calendar Events & Dropdown Empty**
    *   **Date**: 2025-12-29
    - [x] Fix filter Logic `Related Task` Dropdown list
    - [x] Fix Calendar Page `500 Internal Server Error` (Edge Runtime)
    - [x] Verify deployment to Cloudflare Pagesn Calendar is empty. Events might not be loading initially or properly.
    *   **Root Cause**: `src/app/calendar/actions.ts` and `data-fetcher.ts` were running on Edge (Server) but used `firebase/firestore` (Full SDK), causing silent crashes or empty returns.
    *   **Fix**: Migrated `src/app/calendar/actions.ts` and `src/app/calendar/data-fetcher.ts` to use `firebase/firestore/lite` and `@/lib/firebase-lite`. Removed incompatible `auth` checks in `data-fetcher.ts`.
    *   **Result**: pending verification.

*   **Incident 15: Calendar Create Event Crash (405/SES Error)**
    *   **Date**: 2025-12-29
    *   **Symptom**: "Create Event" fails with `SES_UNCAUGHT_EXCEPTION` and `405 Method Not Allowed`.
    *   **Root Cause**: `src/app/calendar/page.tsx` was missing `export const runtime = 'edge';`. Without this, the page might not have been correctly routed as a dynamic Function capable of handling Server Action POST requests in the Cloudflare environment, or was defaulting to an incompatible runtime configuration.
    *   **Fix**: Added `export const runtime = 'edge';` to `src/app/calendar/page.tsx`.
    *   **Result**: Resolved.

*   **Incident 16: Persistent SES Error / Empty Dropdown in Calendar**
    *   **Date**: 2025-12-29
    *   **Symptom**: `SES_UNCAUGHT_EXCEPTION` persisted, or dropdowns were empty due to Edge incompatibility.
    *   **Fix**: Modified `src/app/calendar/new-event-dialog.tsx` to use **Firebase Client SDK** for fetching tasks and creating events, bypassing Server Actions entirely.
    *   **Result**: Resolved.

*   **Incident 17: Calendar Logic Mismatch (Missing Events & Broad Dropdown)**
    *   **Date**: 2025-12-29
    *   **Symptom**: "Related Task" dropdown showed all projects in Dark Mode. Events created might not appear if they didn't match the view filter.
    *   **Fix**: Updated `src/app/calendar/new-event-dialog.tsx` to strictly filter tasks based on theme mode (Exclusive Logic).
    *   **Result**: Resolved.

*   **Incident 18: Syntax Error in Calendar Dialog**
    *   **Date**: 2025-12-29
    *   **Symptom**: `Syntax Error: Expected a semicolon` in `new-event-dialog.tsx` after previous edit.
    *   **Fix**: Overwrote `new-event-dialog.tsx` with valid, corrected code.
    *   **Result**: Fixed.

*   **Incident 19: Build Failed due to macOS Metadata (._ files)**
    *   **Date**: 2025-12-29
    *   **Symptom**: `npm run pages:build` failed with `Error: Unexpected token '', "Ma"... is not valid JSON`.
    *   **Root Cause**: `next-on-pages` attempted to parse `._manifest.json` (AppleDouble binary files) created by macOS on the mounted volume as valid JSON.
    *   **Fix**: Updated `package.json` build script to `next build && find . -type f -name '._*' -delete` to clean these files immediately after compilation.
    *   **Result**: Build passed.

*   **Incident 20: Deployment Syntax Error (Worker Bundle)**
    *   **Date**: 2025-12-29
    *   **Symptom**: `npx wrangler pages deploy` failed with `Uncaught SyntaxError: Invalid or unexpected token at ._index.js:1`.
    *   **Root Cause**: macOS metadata files (`._*`) were present in the `.vercel/output` directory and were uploaded as part of the Worker bundle, causing syntax errors when the runtime tried to execute them.
    *   **Fix**: Ran `find .vercel -type f -name '._*' -delete` before deploying to clean the artifacts.
    *   **Result**: Deployment successful.

*   **Incident 21: Calendar Client Crash & Deployment Loop**
    *   **Date**: 2025-12-29
    *   **Symptom**: User reported "Client-side exception" on Calendar. Subsequent deployments failed with `SyntaxError` again.
    *   **Root Cause**:
        1.  Client Crash: Likely missing `NEXT_PUBLIC_FIREBASE` keys in the production build (db undefined).
        2.  Deployment Failure: The manual `npm run pages:build` command recreated `._` files in `.vercel`, which `wrangler` then tried to upload.
    *   **Fix**:
        1.  Updated `package.json` -> `"pages:build": "npx @cloudflare/next-on-pages && find .vercel -type f -name '._*' -delete"` to permanently fix the metadata issue.
        2.  Updated `CalendarClientPage` with a `db` check guard and fixed a syntax error in the component.
        3.  Ran deployment with explicit `source .env.local ...`.
    *   **Result**: Deployment successful (Exit Code 0). Calendar should now load or show a clear config error.

*   **Incident 22: Events Hidden (Date Range & Filter Logic)**
    *   **Date**: 2025-12-29
    *   **Symptom**: User created an event on Dec 19, but Calendar (viewing Dec 29) showed nothing.
    *   **Root Cause**:
        1.  Initial State Bug: Calendar started fetching from `startOfWeek` (Dec 28), excluding earlier events in the month.
        2.  Strict Filter: User uses Dark Mode, but the test event was Public (not `isDarkModeOnly`), so it was filtered out by design.
    *   **Fix**:
        1.  Updated `CalendarClientPage` to default to `startOfMonth`.
        2.  Advised user on Theme toggling.
    *   **Result**: Fixed (Date Range updated).

*   **Incident 23: 500 Internal Server Error (Edge Compatibility)**
    *   **Date**: 2025-12-29
    *   **Symptom**: Calendar page crashed with `500` error after env vars were loaded.
    *   **Root Cause**: Full Firebase SDK (`src/lib/firebase.ts`) tried to `initializeApp` on the Edge Runtime (Server) because it was imported by the Client Component. Full SDK is not Edge compatible. Behaving correctly only when `window` is defined.
    *   **Fix**: Added `if (typeof window !== 'undefined')` guard in `src/lib/firebase.ts` to prevent server-side initialization.
    *   **Result**: Fixed (SDK isolation implemented).

*   **Incident 24: Home Page Build Failed (Prerender Error)**
    *   **Date**: 2025-12-29
    *   **Symptom**: `npm run build` failed during prerendering of `/` with `FirebaseError: Expected first argument to collection() to be a CollectionReference`.
    *   **Root Cause**: `src/app/page.tsx` (Server Component) was using the Full Firebase SDK (`@/lib/firebase`), which was disabled on the server in Incident 23. Thus `db` was undefined during build.
    *   **Fix**: Migrated `src/app/page.tsx` to use `@/lib/firebase-lite` (Lite SDK) for server-side compatibility.
    *   **Result**: Build and Deployment Successful.


*   **Incident 25: Autocomplete Hover/Select Failure (Specific Case)**
    *   **Date**: 2025-01-04
    *   **Symptom**: "Related Task" dropdown hover effect not working despite previous fix.
    *   **Root Cause**: `cmdk` performs internal filtering and normalization on the `value` prop. When using manual filtering + complex labels uniqueness (Task Name + Project Name), `cmdk` internal logic mismatched the manual `filteredOptions`, causing it to "hide" or "ignore" interaction state for items it thought shouldn't be valid.
    *   **Lesson**: When implementing manual/external filtering with `cmdk`, **ALWAYS** set `shouldFilter={false}` on the `Command` root. Also, use stable Unique IDs for `CommandItem` value, not display labels.
    *   **Ref**: [T-096] implementation.


*   **Incident 26: Persistent 405 Error & Related Task Autocomplete Failure**
    *   **Date**: 2025-01-04
    *   **Symptom**: 
        1. Create Project fails with `405 Method Not Allowed`.
        2. Team dropdown in Create Project is empty.
        3. "Related Task" in Calendar still has issues with selection/hover despite T-096.
        4. Newly created Customer not showing in Project Owner dropdown.
    *   **Root Cause Analysis (Ongoing)**: 
        *   **405 Error**: Likely due to `projects/actions.ts` not being correctly registered as an Edge Server Action or failing silently during hydration/initialization, even after migration to `firebase-lite`. `POST` to a static page path usually implies the Server Action definition is missing from the build manifest.
        *   **Autocomplete**: `SingleSelectAutocomplete` logic regarding `value` vs `label` might still have edge cases, specifically when `cmdk`'s internal lowercase logic conflicts with how we set `selectedToken`.
    *   **Correction Plan**: [T-098] Deep Refactor of Autocomplete & Project Actions.


*   **Incident 27: Analytics Dashboard Missing Names & 0 Data**
    *   **Date**: 2025-01-04
    *   **Symptom**: 
        1. Analytics shows "0 Projects" / "0 Tasks".
        2. Top Project Workload Chart shows Project IDs (`QI2BZM...`) instead of Names.
    *   **Root Cause**: 
        1. **0 Data**: Strict Theme Logic (T-075) hides all projects if they don't match the current theme (e.g., viewing OS projects in Light Mode).
        2. **Missing Names**: `ProjectTrackingProgress` logs likely store `projectId` with inconsistent casing or whitespace, failing the exact `===` lookup against `initialProjects`.
    *   **Fix**: [T-100] Robust Analytics Mapping.
        1. Implement Case-Insensitive Lookup for Project Names.
        2. Consider relaxing Theme Filter for "Workload Analysis" tab (Historical data should probably show everything?).

- [x] [T-098] **Comprehensive Fix for Autocomplete & Project Creation**: แก้ไขปัญหา 405 และ Autocomplete ถาวร
    - **Actions**:
        1. **Autocomplete**: ตรวจสอบ Logic `SingleSelectAutocomplete` เทียบกับ `Assignee` Logic (ที่ทำงานได้). ตรวจสอบการส่งค่า `options` และ `value`.
        2. **Project 405**: ตรวจสอบการ Config `actions.ts` และ `runtime` config. อาจต้องย้าย Actions ไปที่ `src/actions/project-actions.ts` เพื่อความชัดเจน หรือเพิ่ม `export const runtime = 'edge'` ใน `projects/page.tsx`.
        3. **Empty Team/Customer**: ตรวจสอบการ Fetch Data ว่าทำงานบน Server (Edge) ได้จริงหรือไม่.
    - **Resolution**:
        - **Refactored `SingleSelectAutocomplete`**: Removed `cmdk` entirely. Replaced with custom implementation using standard `input` and `absolute div` (matching `MultiSelectAutocomplete`), granting full control over case-sensitive rendering and ID-based selection.
        - **Fixed 405 Error**: Added `export const runtime = 'edge'` to `src/app/projects/page.tsx` to enable proper Server Action handling on Cloudflare.

- [x] [T-099] **Apply OS Filter to Project Owners**: กรองรายชื่อ Customer ใน New/Edit Project -> Owner ให้แสดงตาม Mode (OS=Dark only, Std=Light only)
    - **Requirement**: "Mutually Exclusive" Logic.
    - **Action**:
        1. Update `getCustomers` in `actions.ts` to return `isDarkModeOnly`.
        2. Update `NewProjectDialog.tsx` to filter options based on `useTheme` (`resolvedTheme`).

- [x] [T-100] **Fix Analytics Mapping & Visibility**: แก้ไขปัญหาชื่อไม่ขึ้นและข้อมูลเป็น 0
    - **Actions**:
        1. Create `projectMap` lookup (Case-Insensitive) in `analytics-client.tsx`.
        2. Relax logic: Always allow mapping names even if project is hidden by theme (for Workload logs).

- [x] [T-101] **Fix Analytics Data Fetching (Edge Compatibility)**: แก้ไขปัญหา Analytics load data ไม่ขึ้น (0 items) บน Cloudflare
    - **Incident**: User report "Analysis ไม่ถูกแก้ไข" & Console shows 0 tasks.
    - **Root Cause**: `src/app/analytics/page.tsx` uses full `firebase` SDK which fails in Edge Runtime.
    - **Action**: Migrate to `firebase-lite` and add `export const runtime = 'edge'`.

- [x] [T-102] **Implement Sticky Filters in Analytics**: ทำให้ส่วน Filter ลอยติดด้านบนเมื่อ Scroll
    - **Concept**: User experience improvement for long analytics pages.
    - **Implementation**: Apply `sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60` to the filter container in `analytics-client.tsx`.

- [ ] [T-103] **Refine Analytics UI Interactivity**: ปรับตำแหน่ง Sticky และแก้ Chart Label ทับกัน
    - **Sticky Filter**: Increase `top` offset (e.g., `top-20`) to avoid navbar collision.
    - **Assignee Chart**: Fix overlap between legend badges and total stats footer.
