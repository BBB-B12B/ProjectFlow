# AI Collaboration Protocol (The "Spec-First" Model)

เอกสารนี้สรุปขั้นตอนมาตรฐาน (Standard Operating Procedure) สำหรับการเริ่มและดำเนินโปรเจกต์ร่วมกับ AI เพื่อให้ได้โครงสร้างที่เป็นระเบียบ ตรวจสอบได้ และลดข้อผิดพลาด (Traceability & Maintainability)

---

## Phase 1: Preparation (Context Setting)
**Goal**: เตรียมพื้นที่สมอง (Brain) ให้ AI เข้าใจขอบเขตงานและโครงสร้างมาตรฐานก่อนเริ่มเขียน Code

**คำสั่งเริ่มโปรเจกต์ (Initial Prompt):**
> "เราจะเริ่มโปรเจกต์ใหม่ชื่อ **[Project Name]** โดยเน้นความเป็นระเบียบและ Traceability สูง
> ขอให้ช่วยสร้าง Folder `spec_project_detail/` และสร้างไฟล์เปล่า 3 ไฟล์รอไว้ก่อน:
> 1. `spec.md` (Functional Spec)
> 2. `instruction.md` (Tech Stack & Conventions)
> 3. `task.md` (Checklist Roadmap)
> ยังไม่ต้องเขียน Code จนกว่าเราจะทำเอกสาร 3 ฉบับนี้เสร็จ"

---

## Phase 2: The 3 Pillars (Documentation First)
**Goal**: สร้าง Single Source of Truth ที่ AI และ User ยึดถือร่วมกัน

### Step 2.1: Functional Spec (`spec.md`)
**Prompt Guidance:**
> "เริ่มร่าง `spec.md` กันครับ ในนี้ขอให้ระบุ:
> 1. **System Features**: ฟีเจอร์หลัก พร้อมใส่ ID **[F-XXX]** กำกับ (เช่น F-001 Authentication)
> 2. **Data Models**: ตาราง Database และความสัมพันธ์ (ER Diagram/Schemas)
> 3. **User Flows**: ขั้นตอนการใช้งาน (Text list หรือ Mermaid Sequence Diagram)
> 4. **Architecture**: โครงสร้างระบบ (Frontend -> API -> DB)
> 5. **System Structure Tree**: แผนผัง Sitemap (Mermaid Diagram) เพื่อให้เห็นภาพรวมหน้าจอทั้งหมด"

### Step 2.2: Instruction & Standards (`instruction.md`)
**Prompt Guidance:**
> "ต่อไปร่าง `instruction.md` ครับ ระบุ:
> 1. **Tech Stack**: ภาษา, Framework, Library หลักที่จะใช้ (Version ถ้าจำเป็น)
> 2. **Folder Structure**: ระบุโครงสร้างทั้ง **Root Level** (รวม folder เอกสาร/Config) และ **Source Code Level**
> 3. **Conventions**: กฎการตั้งชื่อ (Naming), การจัดการ State (State Management), หรือกฎห้ามทำ (Strict Rules)"

### Step 2.3: Task Roadmap (`task.md`)
**Prompt Guidance:**
> "สุดท้ายร่าง `task.md` ครับ โดยแบ่งงานเป็น Phases และใช้ **Rich Task Schema** สำหรับงานที่มีความซับซ้อน:
>
> **Task Schema Structure:**
> - [ ] **[T-XXX] Task Name**
>     - **Concept/Goal**: เป้าหมายหลักของงานนี้คืออะไร
>     - **Principles**: หลักการออกแบบ (เช่น Separation of Concerns, Performance First)
>     - **Implementation Details**:
>         - **UI/UX**: รายละเอียด Component, Interaction
>         - **Logic/State**: การจัดการ State, Context, Library ที่เกี่ยวข้อง
>         - **Data**: Query อะไร, Cache อย่างไร
>     - **Confirmed Behavior**: พฤติกรรมที่ต้องทดสอบ (Acceptance Criteria)
>     - **Sub-tasks**:
>         - [ ] Sub-task 1"

---

## Phase 3: Traceability (The Matrix)
**Goal**: เชื่อมโยงความสัมพันธ์ระหว่าง Requirement, Task และ Code เพื่อให้ตรวจสอบผลกระทบได้ง่าย (Impact Analysis)

**Prompt Guidance:**
> "สร้างไฟล์ `spec_project_detail/traceability.md` เพื่อทำ Requirement Traceability Matrix (RTM) ประกอบด้วย 2 ตารางหลัก:
>
> **1. Requirement Traceability Matrix (RTM)**
> Map ระหว่าง Feature -> Task -> File
> | Feature ID [F-XXX] | Spec Feature Name | Tasks [T-XXX] | Key Code Files | Status |
>
> **2. Data/Variable Traceability**
> Map ระหว่าง Entity -> Code Variables
> | ข้อมูลหลัก (Entity) | ชื่อ Interface/Type | ตัวแปร State หลัก (Key State Variables) | ไฟล์ที่เกี่ยวข้อง (Related Files) | หมายเหตุ (Notes) |"

---

## Phase 4: Implementation Protocol
**Goal**: ควบคุมทิศทางการเขียน Code ด้วยเอกสาร (Navigator)

### 1. Inception (รับโจทย์ใหม่)
ทุกครั้งที่มีโจทย์ใหม่ ห้ามแก้ Code ทันที ให้ทำตาม Step:
1.  **Analyze**: วิเคราะห์ผลกระทบ
2.  **Update `task.md`**: สร้าง Task ใหม่ [T-XXX] พร้อมรายละเอียด Principles/Implementation
3.  **Update `spec.md`**: เพิ่ม [F-XXX] หากเป็นฟีเจอร์ใหม่
4.  **Update `traceability.md`**: เพิ่มความเชื่อมโยง (Status: Planned)

### 2. Execution (เขียน Code)
-   **Checklist Driven**: ทำงานทีละข้อย่อยใน `task.md`
-   **Living Docs**: หากต้องเปลี่ยน Logic ให้แก้ `instruction.md` หรือ `spec.md` ให้ตรงกับความจริงเสมอ
-   **Error Logging**: หากเจอ Error ให้บันทึกลง `task.md`:
    ```markdown
    - **Error Encountered**: ...
    - **Root Cause**: ...
    - **Solution**: ...
    ```

### 3. Closure (จบงาน)
-   [x] Mark Complete ใน `task.md`
-   อัปเดตสถานะใน `traceability.md` (Active/Beta)
-   อัปเดต **Key Code Files** ใน `traceability.md`

---

## Phase 5: Deployment & Handoff
**Goal**: ส่งมอบงานอย่างสมบูรณ์และพร้อมสานต่อ

### Deployment
-   สร้าง Script `deploy.sh` หรือ CI/CD Pipeline
-   เขียน `README.md` สรุปวิธี Run/Build/Test

### Handoff Protocol (Continuing Work)
คำสั่งสำหรับเริ่ม Session ใหม่ เพื่อให้ AI เข้าใจบริบทเดิมทันที:

**Rehydration Prompt:**
> "สวัสดี เรากำลังทำโปรเจกต์ **[Project Name]** ต่อจากเดิม
> งานทั้งหมดถูก Document ไว้อย่างละเอียดแล้ว
>
> **Mission:**
> 1.  เข้าไปอ่านโฟลเดอร์ `spec_project_detail/`
> 2.  อ่าน (Contextualize) ตามลำดับ:
>     -   `instruction.md` (Tech Stack)
>     -   `spec.md` (Features)
>     -   `traceability.md` (Links)
>     -   `task.md` (Progress)
> 3.  สรุปสถานะปัจจุบันว่า 'ล่าสุดทำอะไรเสร็จ' และ 'Next Step คืออะไร'
> 4.  **ห้าม** แก้ไข Code จนกว่าจะเข้าใจเอกสารครบถ้วน"

---

## Summary Checklist for New Project
- [ ] Folder `spec_project_detail/` created
- [ ] `spec.md` defined with [F-XXX]
- [ ] `instruction.md` defined
- [ ] `task.md` initialized with [T-XXX]
- [ ] `traceability.md` initialized with RTM & Data Tables
- [ ] **Handoff Prompt** ready


