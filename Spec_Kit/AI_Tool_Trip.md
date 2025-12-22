# AI Collaboration Workflow Template (The "Paystub" Model)

เอกสารนี้สรุปขั้นตอน (Best Practices) ในการเริ่มโปรเจกต์ใหม่ร่วมกับ AI ให้ได้โครงสร้างที่เป็นระเบียบ ตรวจสอบได้ และทำงานได้จริงเหมือนโปรเจกต์ Paystub

---

## Phase 1: Preparation (Context Setting)
**Goal**: เตรียมพื้นที่สมอง (Brain) ให้ AI เข้าใจขอบเขตงานก่อนเริ่มเขียน Code

**คำสั่งแรก (Prompt) ให้ AI:**
> "เราจะเริ่มโปรเจกต์ใหม่ชื่อ **[Project Name]** โดยเน้นความเป็นระเบียบและ Traceability สูง
> ขอให้ช่วยสร้าง Folder `spec_project_detail/` และสร้างไฟล์เปล่า 3 ไฟล์รอไว้ก่อน:
> 1. `spec.md` (Functional Spec)
> 2. `instruction.md` (Tech Stack & Conventions)
> 3. `task.md` (Checklist Roadmap)
> ยังไม่ต้องเขียน Code จนกว่าเราจะทำเอกสาร 3 ฉบับนี้เสร็จ"

---

## Phase 2: The 3 Pillars (Documentation First)
**Goal**: สร้าง Single Source of Truth

### Step 2.1: Functional Spec (`spec.md`)
**สิ่งที่ต้องบอก AI:**
> "เริ่มร่าง `spec.md` กันครับ ในนี้ขอให้ระบุ:
> 1. **System Features**: ฟีเจอร์หลัก (เช่น Auth, CRUD, Report) พร้อมใส่ ID **[F-XXX]** กำกับ
> 2. **Data Models**: ตาราง Database และความสัมพันธ์ (ER Diagram/Schemas)
> 3. **User Flows**: ขั้นตอนการใช้งาน (Text list)
> 4. **Architecture**: โครงสร้างระบบ (Frontend -> API -> DB)
> 5. **System Structure Tree**: ขอแผนผัง Sitemap (Mermaid Diagram) เพื่อให้เห็นภาพรวมหน้าจอทั้งหมด"

### Step 2.2: Instruction & Standards (`instruction.md`)
**สิ่งที่ต้องบอก AI:**
> "ต่อไปร่าง `instruction.md` ครับ ระบุ:
> 1. **Tech Stack**: ภาษา, Framework, Library หลักที่จะใช้
> 2. **Folder Structure**: ระบุโครงสร้างทั้ง **Root Level** (รวม folder เอกสาร/Config) และ **Source Code Level** เพื่อให้เห็นภาพรวมทั้งโปรเจกต์
> 3. **Conventions**: กฎการตั้งชื่อ (Naming), การจัดการ State, หรือกฎห้ามทำ (Strict Rules)"

### Step 2.3: Task Roadmap (`task.md`)
**สิ่งที่ต้องบอก AI:**
> "สุดท้ายร่าง `task.md` ครับ:
> 1. แบ่งงานเป็น **Phases** (Setup, Core Features, UI, Polish, Deploy)
> 2. แตกงานย่อยเป็น Checklist `[ ]`
> 3. ใส่ ID **[T-XXX]** หน้าแต่ละ Task เพื่อใช้ทำ Traceability ทีหลัง"

---

## Phase 3: Traceability (The Matrix)
**Goal**: เชื่อมโยงทุกอย่างเข้าด้วยกัน (Feature -> Task -> Code)

**คำสั่งเมื่อเริ่มเห็นภาพรวม:**
> "สร้างไฟล์ `traceability.md` เพื่อทำ Requirement Traceability Matrix (RTM)
> โดยสร้างตาราง Map ระหว่าง:
> | Feature ID [F-XXX] | Spec Header | Tasks [T-XXX] | Key Code Files | Status |"

---

## Phase 4: Implementation (Agentic Loop)
**Goal**: เริ่มเขียน Code ตามแผนที่วางไว้

**วิธีการทำงาน:**
1.  **Select Task**: "เริ่มทำ Phase 1 ข้อ [T-001] และ [T-002] ตาม `task.md`"
2.  **Update Docs**: "ถ้ามีการเปลี่ยน Logic หรือเพิ่มไฟล์ใหม่ อย่าลืมอัปเดต `spec.md` และ `instruction.md` ด้วย"
3.  **Checklist**: "เมื่อทำเสร็จแล้ว ให้ไปขีดถูก `[x]` ใน `task.md`"

---

## Phase 5: Deployment & Operations
**Goal**: ทำให้โปรเจกต์ Live และ Maintain ง่าย

1.  **Deployment Script**:
    > "ช่วยเขียน Script `deploy_prod.sh` รวมคำสั่ง Build และ Deploy ทั้งหมดไว้ในไฟล์เดียว"
2.  **README**:
    > "เขียน `README.md` สรุปวิธีรัน (Dev) วิธี Deploy (Prod) และแปะ Link ไปยัง `spec_project_detail` ทั้งหมด"

---

## Phase 6: Handoff Protocol (Continuing Work)
**Goal**: ส่งงานให้ AI ตัวถัดไป (New Chat) เข้าใจงานทันทีโดยไม่ต้องอธิบายใหม่

**คำสั่งแรกสำหรับ Chat ใหม่ (The "Rehydration" Prompt):**
> "สวัสดี เรากำลังทำโปรเจกต์ **[Project Name]** ต่อจากเดิม
> งานทั้งหมดถูก Document ไว้อย่างละเอียดแล้ว
>
> **คำสั่งของคุณ (Mission):**
> 1.  เข้าไปอ่านโฟลเดอร์ `spec_project_detail/`
> 2.  อ่านเรียงลำดับดังนี้ เพื่อ Re-contextualize ตัวเอง:
>     -   `instruction.md` (เข้าใจ Tech Stack & Structure)
>     -   `spec.md` (เข้าใจ Flow & Features)
>     -   `traceability.md` (เข้าใจความเชื่อมโยง F-XXX กับ Code)
>     -   `task.md` (ดูว่าทำถึงตรงไหนแล้ว)
> 3.  สรุปสถานะปัจจุบันให้ผมฟังว่า 'งานล่าสุดที่ทำเสร็จคืออะไร' และ 'Next Step คืออะไร'
> 4.  **ห้าม** แก้ไข Code จนกว่าจะทำความเข้าใจเอกสารครบถ้วน"

---

## Summary Checklist for New Project
- [ ] Folder `spec_project_detail/` created
- [ ] `spec.md` with [F-XXX] and **Sitemap**
- [ ] `instruction.md` with Tech Stack defined
- [ ] `task.md` with [T-XXX] defined
- [ ] `traceability.md` initialized
- [ ] **Handoff Prompt** ready for next session

