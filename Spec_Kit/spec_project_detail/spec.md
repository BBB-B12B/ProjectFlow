# รายละเอียดฟังก์ชันระบบ (Functional Specification)

## คุณสมบัติระบบ (System Features)

### ระบบหลัก (Core System)
- **[F-001] การยืนยันตัวตน (User Authentication)**
  - เข้าสู่ระบบ/สมัครสมาชิกผ่าน Firebase Auth
  - การจัดการโปรไฟล์ผู้ใช้

### การบริหารจัดการโปรเจกต์ (Project Management)
- **[F-002] แดชบอร์ดโปรเจกต์ (Project Dashboard)**
  - แสดงรายการโปรเจกต์ทั้งหมดพร้อมสถานะ:
    - `กำลังดำเนินการ` (Running)
    - `เสร็จสิ้น` (Finished)
    - `วางแผน` (Planned)
    - `Archived`
  - สรุปตัวเลข: งานที่เสร็จ vs งานทั้งหมด
  - สร้าง/แก้ไข/ลบ โปรเจกต์ (CRUD)
  - **Project Owner Selection**:
    - ใช้ **Autocomplete** เลือกจากรายชื่อ Customers
    - มีปุ่ม **Quick Add** สำหรับเพิ่ม Customer ใหม่ได้ทันทีในหน้าสร้าง/แก้ไขโปรเจกต์
- **[F-003] การจัดการงานแบบ Kanban (Task Management)**
  - สามารถย้ายสถานะงานได้ด้วยการ Drag & Drop
  - **Real-time Collaboration**: แสดงรูปโปรไฟล์ของผู้ที่กำลังเปิดแก้ไขการ์ดงานนั้นๆ (Presence System / Anonymous Animals)
  - แบ่งหมวดหมู่งานตาม Project Type (Main, Quick Win, Fill-in, Thankless)
    - `QuickWin` (งานด่วนได้ผลเร็ว)
    - `Fillin` (งานแทรก)
    - `Thankless` (งานปิดทองหลังพระ)
  - ติดตามสถานะ: `ยังไม่เริ่ม`, `กำลังดำเนินการ`, `ติดปัญหา`, `จบงานแล้ว`
  - ข้อมูลระบุ: Effort (แรงที่ใช้), Effect (ผลลัพธ์), วันเริ่ม/จบ, ผู้รับผิดชอบ
  - **การแสดงผล (Visualization)**: ใช้ Modular Chart Components (`src/components/charts/*`) แยกตามประเภทกราฟ (Pie, Bar, Scatter) เพื่อลดขนาดไฟล์และเพิ่มความเร็วในการโหลด

### เครื่องมือเพิ่มประสิทธิภาพ (Productivity Tools)
- **[F-004] การติดตามเวลาและความคืบหน้า (Time & Progress Tracking)**
  - บันทึกชั่วโมงทำงานและ % ความคืบหน้ารายวัน (`ProjectTrackingProgress`)
  - **On-Demand Loading**: ดึงข้อมูลประวัติการทำงานเฉพาะ **Task ที่เกี่ยวข้องกับผู้ใช้ที่เลือก** และ **ตามความจำเป็น** (Chunk Query) เพื่อความรวดเร็ว
  - **OS Project Filtering**:
      - **Dark Mode**: แสดงเฉพาะ Tasks ของ OS Project
      - **Light Mode**: แสดงเฉพาะ Tasks ของ Standard Project
  - **Logic**:
    - **Dual Update**: เมื่อบันทึก ระบบจะ save ลง 2 ที่พร้อมกัน:
      1. `projectTrackingProgress` (History Log): เก็บประวัติว่าวันนี้นาย A ทำงาน B ไปกี่ ชม.
      2. `tasks` (Master Data): อัปเดต `% Progress` ล่าสุดของงานนั้นทันที เพื่อให้ Project Manager เห็นสถานะจริง
- **[F-006] ปฏิทินและตารางงาน (Calendar & Scheduling)**
  - แสดงงานและเหตุการณ์ในรูปแบบปฏิทิน (Month/Week/Day)
  - **Live Presence**: เห็นว่าใครกำลังเปิดดูหรือแก้ไข Event ไหนอยู่ในหน้าปฏิทิน
  - เชื่อมโยง Event กับ Task และ Project ได้ (Traceability)
  - **Members Autocomplete**:
    - กรองลูกค้า OS (`isDarkModeOnly`) ตาม Dark Mode (Additive Logic: Dark Mode เห็นครบ, Light Mode ไม่เห็น OS)
  - **Event Filtering**:
    - **Events (Project/Task)**: ใช้ Mutually Exclusive Logic (Dark=OS Only, Light=Standard Only)

      - **Events (Project/Task)**: ใช้ Mutually Exclusive Logic (Dark=OS Only, Light=Standard Only)
- **[F-010] ระบบวิเคราะห์ข้อมูล (Analytics Dashboard)** (`src/app/analytics`)
  - **Purpose**: วิเคราะห์ภาพรวมการทำงานของทีมผ่าน 2 มุมมองหลัก (Tabs)
  - **Structure (Tabbed Interface)**:
    1. **Task Overview (มุมมองการจัดการ)**:
       - **Focus**: สถานะงาน (Status), การกระจายงาน (Assignee), ความสำคัญ (Priority Matrix)
       - **Visuals**: Donut Chart, Bar Chart, Scatter Plot, Burndown Chart
    2. **Workload Analysis (มุมมองประสิทธิภาพ)**:
       - **Focus**: ชั่วโมงการทำงานจริง (Actual Hours), ประสิทธิภาพทีม
       - **Visuals**:
         - **Project Ranking**: จัดอันดับโปรเจกต์ที่ใช้เวลาเยอะที่สุด
         - **Employee Ranking**: ใครทำงานหนักที่สุด (Top Performers)
         - **Trend**: แนวโน้มการทำงานรายสัปดาห์/เดือน
         - **Performance Table**: ตารางรายละเอียดงานพร้อม Hours Worked สะสม
  - **Interactivity**:
    - **Global Filtering**: ระบบกรองข้อมูลกลาง (Header) ส่งผลต่อกราฟในทุก Tabs
    - **Deep Dive**: คลิกที่กราฟเพื่อ Drill-down ข้อมูลเฉพาะส่วนนั้นๆ

### ระบบ AI (AI Integration)
- **[F-007] ผู้ช่วย AI (Genkit)**
  - ใช้ **Google Genkit** ในการช่วยเหลือด้านการพัฒนา (Development Flows)

### การบริหารความสัมพันธ์ลูกค้า (CRM)
- **[F-008] ระบบจัดการข้อมูลลูกค้า (Customer Relationship Management)** (`src/app/customers/*`)
  - จัดเก็บข้อมูลลูกค้า: ชื่อ, ช่องทางติดต่อ, อีเมล, เบอร์โทร
  - **Health Score & Rating**:
    - ให้คะแนนลูกค้าตาม 4 มิติ (1-10 คะแนน)
    - แสดงผลด้วย Radar Chart และคำนวณ % Health
  - **Project Linkage**: เชื่อมโยง Customers เข้ากับ Projects
  - **Performance Mode**:
    - หน้า **Customer List**: ปิดการคำนวณ Project Stats (Total/Completed) แบบ Real-time เพื่อความรวดเร็วในการโหลด (Stats ดูได้ในหน้า Detail)
  - **OS Customer Filtering**:
    - รองรับการแบ่งแยก "ลูกค้า OS" ออกจากลูกค้าปกติ
    - ทำงานร่วมกับ **Dark Mode**:
      - **Customer List/Select**: Dark Mode เห็นครบ, Light Mode เห็นเฉพาะลูกค้าทั่วไป

### การเสถียรภาพและประสิทธิภาพ (Stability & Performance)
- **[F-009] การปรับปรุงประสิทธิภาพและลดค่าใช้จ่าย (Performance & Cost Optimization)**
  - **Global Listener Removal**: ยกเลิกการดึงข้อมูลทั้ง Collection (`onSnapshot`) ในจุดที่ไม่จำเป็น (Customers Page)
  - **Global Caching Strategy**: ใช้ `DataCacheContext` เก็บข้อมูล Customers (Global State) + **Auto-Refresh ทุก 1 นาที** เพื่อให้ข้อมูล Real-time พอประมาณโดยไม่โหลดซ้ำ (Sustain & Lean)
  - **Targeted Fetching**: ในหน้า Tracking, ดึง Log เฉพาะของผู้ใช้ที่เลือก (`trackerName`) แทนการดึงตาม Task ID (Chunk List) เพื่อแก้ปัญหา Permission และคำนวณ Total Hours ได้แม่นยำ
  - **Pagination & Indexing**: ใช้ Indexing และ Limit ในการดึงข้อมูล Lists ใหญ่ๆ
  - **Lazy Loading**: โหลด Component กราฟหนักๆ เฉพาะเมื่อต้องแสดงผล
  - **Sustainable Security Rules**: ใช้ `firestore.rules` แบบเปิดกว้าง (User-based Check) แทนการ Filter ที่ซับซ้อน เพื่อความยั่งยืนของการ Query

---

## แบบจำลองข้อมูล (Data Models)

อ้างอิงจาก `src/lib/types.ts`

```mermaid
erDiagram
    PROJECT ||--o{ TASK : contains
    TASK ||--o{ TRACKING_LOG : has
    USER ||--o{ PRESENCE : has
    USER ||--o{ PRESENCE : has
    CUSTOMER ||--o{ CUSTOMER_LOG : has
    CUSTOMER ||--o{ CUSTOMER_RATING : rated_by
    CALENDAR_EVENT }|--|{ CUSTOMER : mentions
    SPYFALL_LOBBY ||--o{ SPYFALL_GAME : hosts

    CUSTOMER {
        string id PK
        string name "ชื่อลูกค้า/บริษัท"
        string email
        string phone
        string address
        string[] tags "VIP, Prospect, etc."
        timestamp lastContactDate "วันที่ติดต่อล่าสุด"
        float healthScore "คะแนนความสัมพันธ์ (%)"
        boolean isDarkModeOnly "ลูกค้า OS (แสดงเฉพาะ Dark Mode)"
        timestamp createdAt
        timestamp updatedAt
    }

    CUSTOMER_RATING {
        string id PK
        string customerId FK
        string raterId FK "User ID"
        int payerScore "Payer: 1-10"
        int visionerScore "Visioner: 1-10"
        int harderScore "Harder: 1-10 (Direct Plot, Inverted for Health Calc)"
        int niceGuyScore "Nice_Guy: 1-10"
        timestamp updatedAt
    }

    CUSTOMER_LOG {
        string id PK
        string customerId FK
        string type "Call, Meeting, Email, Note"
        string description
        timestamp date
        string relatedId "CalendarEventID or TaskID"
    }

    PROJECT {
        string id PK
        string customerId FK "ลูกค้าเจ้าของโปรเจกต์"
        string name "ชื่อโปรเจกต์"
        string description "รายละเอียด"
        string status "Enum: กำลังดำเนินการ, เสร็จสิ้น, วางแผน, Archived"
        string team "ทีมรับผิดชอบ"
        string owner "เจ้าของโปรเจกต์"
        int completedTasks
        int totalTasks
    }

    TASK {
        string id PK
        string projectId FK
        string TaskName "ชื่อหมวดงาน"
        string Status "Enum: ยังไม่เริ่ม, กำลังดำเนินการ, ติดปัญหา, จบงานแล้ว"
        string ProjectType "Enum: Main, QuickWin, Fillin, Thankless"
        int Effort "แรงที่ต้องใช้"
        int Effect "ผลลัพธ์ที่ได้"
        int Progress "ความคืบหน้า (%)"
    }

    TRACKING_LOG {
        string id PK
        string taskId FK
        string projectId FK
        int hoursWorked "ชั่วโมงที่ทำ"
        int progressPercentage "ความคืบหน้าที่บันทึก"
        timestamp date "วันที่บันทึก"
    }

    PRESENCE {
        string userId PK
        string userName
        timestamp lastSeen
    }

    SPYFALL_GAME {
        string id PK
        string lobbyId FK
        string status
        timestamp startedAt
    }

    SPYFALL_LOCATION {
        string id PK
        string name
        string[] roles
    }
```

## ขั้นตอนการใช้งาน (User Flows)

### 1. การตั้งค่าโปรเจกต์และงาน (Project & Task Setup)
1. ผู้ใช้เข้าสู่ระบบ (Auth)
2. ผู้ใช้สร้าง **Project** ใหม่ (เช่น "Website Redesign")
3. ผู้ใช้เพิ่ม **Tasks** เข้าไปในโปรเจกต์ พร้อมระบุ **Type** (เช่น "QuickWin")
4. งานจะปรากฏบน Dashboard และปฏิทินทันที

### 2. การติดตามงานรายวัน (Daily Work Tracking)
1. ผู้ใช้เลือกงานที่ต้องการอัปเดต (Task)
2. ผู้ใช้บันทึก "ชั่วโมงที่ทำ (Hours Worked)" และ "ความคืบหน้าล่าสุด (Progress %)"
3. ระบบสร้างบันทึก `ProjectTrackingProgress`
4. Progress Bar ของโปรเจกต์อัปเดตอัตโนมัติ

---

## สถาปัตยกรรมระบบ (Architecture)

```mermaid
graph TD
    User[User Browser / ผู้ใช้งาน]
    
    subgraph Frontend [Next.js App Router]
        Page[Pages (src/app)]
        Comp[Components (Shadcn UI)]
        Lib[Lib (src/lib)]
    end
    
    subgraph Backend [Firebase Services]
        Auth[Firebase Auth]
        Store[Firestore DB]
        Host[App Hosting]
    end
    
    subgraph AI [AI Layer]
        Genkit[Google Genkit Node]
    end

    User --> Page
    Page --> Comp
    Comp --> Lib
    Lib --> Auth
    Lib --> Store
    Lib --> Genkit
```

## แผนผังโครงสร้างระบบ (System Structure Tree / Sitemap)

```mermaid
graph TD
    Root[/]
    Root --> Login[Login / เข้าสู่ระบบ]
    Root --> Dashboard[Dashboard /projects]
    
    Dashboard --> CreateProj[Create Project / สร้างโปรเจกต์]
    Dashboard --> ViewProj[Project Details /project/:id]
    
    ViewProj --> TaskList[Task List / รายการงาน]
    ViewProj --> Kanban[Kanban Board / กระดานงาน]
    ViewProj --> Timeline[Timeline / ไทม์ไลน์]
    
    Root --> Calendar[Calendar /calendar]
    Root --> Analytics[Analytics /analytics]
    Root --> Party[Party Team /party]
    Root --> Customers[Customers /customers]
    Party --> SpyFall[Game: Spyfall]
    Customers --> CustomerDetail[Detail /customers/:id]
```

    }

## 6. Performance & Cost Constraints (Non-Functional)
- **Data Freshness**: Customer cache auto-refresh interval = **5 minutes** (from 1 min) to optimize costs.
- **Idle System (Soft-Logout)**:
  - เมื่อไม่มี Interaction เกิน **4 นาที 30 วินาที** -> แสดง **Overlay (Backdrop Blur)** + ปุ่ม "Re-connect"
  - **Stop Polling**: ระบบจะหยุดดึงข้อมูล Background Cache ชั่วคราวเมื่อ Overlay แสดง (Load Shedding)
  - **Resume**: เมื่อผู้ใช้กด Re-connect จะดึงข้อมูลล่าสุดทันทีและเริ่มนับเวลาใหม่
