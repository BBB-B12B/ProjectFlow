# Master Developer Instruction for AI Agent

เอกสารนี้คือ **"Single Source of Truth"** และคู่มือปฏิบัติงานหลักสำหรับ AI Agent และทีมพัฒนา ภายใต้แนวคิด **"Spec-First Development"**
เมื่อได้รับคำสั่ง "เริ่มพัฒนา", "ทำงานต่อ", หรือการอ้างถึงไฟล์นี้ (`@[Spec_Kit/implement.md]`) ให้ปฏิบัติงานตามขั้นตอนด้านล่างอย่างเคร่งครัด

---

## 1. Rules of Engagement (กฎไตรภาคี)

### 1.1 The Spec-First Philosophy (เอกสารนำทางโค้ด)
> **"Code is a liability, Documentation is an asset."**
> ห้ามเขียน Code จนกว่าจะมั่นใจว่า `spec.md`, `task.md`, และ `traceability.md` ถูกอัปเดตให้สอดคล้องกับงานใหม่แล้วเท่านั้น

### 1.2 Primary Language (ภาษาหลัก)
- **THAI (ภาษาไทย):** ใช้ภาษาไทยในการสนทนา อธิบายเหตุผล และสรุปงาน **ทุกกรณี** (ยกเว้นข้อความ System Log)
- **Technical Terms:** ใช้ภาษาอังกฤษทับศัพท์ได้ แต่หากซับซ้อนให้มีคำอธิบายไทยกำกับไว้เสมอ
- **Response Protocol:** โปรดตรวจสอบเสมอว่าคำตอบสุดท้ายเป็นภาษาไทยก่อนส่งเสมอ

### 1.3 Code Documentation
- **Comment Policy:** ทุกการแก้ไข Logic สำคัญ ต้องมี Comment ภาษาไทยอธิบายเสมอ
  ```typescript
  // Validate input (ตรวจสอบข้อมูลก่อนบันทึก)
  if (!isValid) return;
  ```

### 1.4 Rigid Workflow Adherence (กฎเหล็กแห่งขั้นตอน)
- **Mandatory Sequence:** ขั้นตอนการทำงานในหมวด **"2. Development Workflow" (Step 2.1 - 2.7)** ถือเป็นข้อบังคับที่ **ห้ามข้าม ห้ามลัด และห้ามทำสลับขั้นตอน** โดยเด็ดขาด
- **Completeness Check:** การส่งมอบงานต้องมีองค์ประกอบครบทั้ง Code, Test, และ Documentation (ตาม Step 2.7) หากขาดอย่างใดอย่างหนึ่ง ให้ถือว่างานนั้น **"ยังไม่เสร็จ" (Incomplete)**
- **System Discipline:** แม้จะเป็นงานแก้ Bug เล็กน้อย ก็ต้องเริ่มจาก 2.1 (Context) -> 2.3 (Log Problem) -> 2.4 (Fix) -> 2.7 (Doc Summary) เสมอ เพื่อรักษามาตรฐาน Traceability ของระบบ

---

## 2. Development Workflow (ขั้นตอนการทำงานแบบพรีเมียม)

ให้ปฏิบัติงานตาม **8 ขั้นตอนนี้ (Step 2.1 - 2.8)** เรียงตามลำดับ (Sequential) **ห้ามข้ามขั้นตอนและห้ามทำพร้อมกัน (Parallel) โดยเด็ดขาด** ความถูกต้องของ Process สำคัญเท่ากับความถูกต้องของ Code

### Step 2.1: Context Loading & Rehydration (โหลดบริบท)
ทุกครั้งที่เริ่ม Session หรือรับงานให้ทำความเข้าใจ Context จาก 4 ไฟล์หลัก:
1.  **`Spec_Kit/spec_project_detail/instruction.md`**: Tech Stack & Standards
2.  **`Spec_Kit/spec_project_detail/spec.md`**: User Flow & Features [F-XXX]
3.  **`Spec_Kit/spec_project_detail/traceability.md`**: Relationship & Impact
4.  **`Spec_Kit/spec_project_detail/task.md`**: Progress & Roadmap [T-XXX]

**Handoff Prompt (สำหรับเริ่มงานต่อ):**
> "สรุปสถานะปัจจุบันจาก `task.md` ว่าล่าสุดทำอะไรเสร็จไปแล้ว และ Next Step คืออะไร ก่อนเริ่มงาน"

### Step 2.2: Analysis & Planning (วิเคราะห์และวางแผน)
- เปรียบเทียบ User Request กับ System Spec
- **The CRUD Heuristic (กฎการตรวจสอบความครบถ้วน):**
    > หากมีการเพิ่ม Field ใน Data Model ต้องวางแผนแก้ไขให้ครบ 3 จุด:
    > 1. **Create Form** (e.g., Add Dialog) -> *Update Input*
    > 2. **Read/View** (e.g., Detail Page) -> *Update Display*
    > 3. **Update Form** (e.g., Edit Dialog) -> *Update Input*
- **Dependency Check Rule:**
    - ตรวจสอบ `traceability.md` ว่า Component ใดบ้างที่ได้รับผลกระทบ
    - ห้ามแก้ Data Model โดยไม่เช็ค CRUD

### Step 2.3: Ephemeral Planning (วางแผนเบื้องต้น) **[PLANNING MODE]**
> **"Think before you Write."**
1.  **Create `implementation_plan.md`**:
    - สร้างไฟล์แผนงานชั่วคราวเพื่อระบุ Goal, Proposed Changes, และ Verification Plan
    - ใช้ `notify_user` เพื่อขอ Approval จาก User เสมอ
    - **Note**: ห้ามข้ามขั้นตอนนี้ แม้จะเป็นงานเล็กน้อย เพื่อให้ User เห็นภาพรวมก่อนลงมือจริง
    - *Plan Template*: ดู `implementation_plan_artifact` ใน System Prompt

### Step 2.4: Permanent Documentation (บันทึกข้อมูลถาวร) **[CRITICAL GATEKEEPER]**
**Pre-condition**: `implementation_plan.md` ต้องได้รับการอนุมัติ (Approved) แล้วเท่านั้น
ก่อนเขียนโค้ดบรรทัดแรก ต้องอัปเดตเอกสารหลักให้ครบถ้วนตามแผนที่วางไว้:

1.  **Update `task.md`**:
    - ค้นหา Page Section ที่เกี่ยวข้อง (Page-Based Grouping)
    - **Placement Rule**: ต้องเลือก Section ที่ตรงกับ "ต้นเหตุ" หรือ "Component หลัก" ของงานนั้นๆ ไม่ใช่แค่ดูว่าเจอปัญหาที่ไหน (ดู List of Sections ใน `task.md` เป็นหลัก)
      - *Example*: เจอปัญหา Auth ที่หน้า Calendar -> ต้องไปใส่ใน Section "Authentication/System" ไม่ใช่ "Calendar"
    - **Defect Decision Matrix (เช็คก่อนสร้าง Task ใหม่):**
      - 🔴 เป็น Bug/Error จากงานที่เพิ่งทำ / เคยทำเสร็จแล้ว? -> **ห้ามสร้าง Task ใหม่** ให้ใช้ **Error Log (T-XXX-EX-Y)**
      - 🔴 เป็น Production Incident ของ Feature เดิม? -> **ห้ามสร้าง Task ใหม่** ให้ใช้ **Error Log**
      - 🟢 เป็น Feature ใหม่ หรือ Requirement ใหม่ที่ไม่เคยระบุมาก่อน? -> **สร้าง Task ใหม่ได้**

    - **Rich Task Schema (Copy & Use):**
      ```markdown
      - [ ] [T-XXX] **Task Name**: Short Description
          - **Type**: Feature / Bug Fix / Refactor
          - **Priority**: High / Medium / Low
          - **Description**:
              1. ...
          - **Traceability**: [F-XXX]
      ```

    > **[CRITICAL WARNING] Artifact ≠ Documentation**
    > การสร้าง `implementation_plan.md` หรือ Artifact ใดๆ **ไม่ถือว่า** เป็นการอัปเดตเอกสารหลัก
    > คุณ **ต้อง** เขียนลงในไฟล์ `spec.md` และ `traceability.md` จริงๆ เท่านั้นถึงจะผ่านขั้นตอนนี้ได้
    > ห้ามข้ามขั้นตอนนี้โดยอ้างว่า "มีรายละเอียดใน Plan แล้ว" เด็ดขาด

2.  **Update `traceability.md`**:
      ```markdown
      - [ ] **[T-XXX] Task Name**
          - **Concept/Goal**: เป้าหมายหลัก
          - **Principles**: หลักการออกแบบ (e.g., Performance, Consistency)
          - **Implementation Details**:
              - **UI/UX**: Component ที่ต้องแก้
              - **Logic/State**: State management
              - **Data**: Query/Cache strategy
          - **Confirmed Behavior**: สิ่งที่ต้องทดสอบ (Acceptance Criteria)
          - **Sub-tasks**:
              - [ ] Sub-task 1
      ```

2.  **Update `traceability.md`**:
    - ใช้โครงสร้างตารางมาตรฐาน:
      - **RTM**: `| Feature ID | Name | Tasks | Files | Status |`
      - **Data Traceability**: `| Entity | Type | Key State Vars | Related Files | Notes |`
    - เพิ่ม Row ใหม่หากมี Feature หรือ Key Variable ใหม่

3.  **Update `spec.md`**:
    - **Refactor using Rich Feature Schema**:
      - `**[F-XXX] Feature Name**`
      - **Description**: คำอธิบายหลัก
      - **User Flow**: Step-by-step actions (1. User logs in -> 2. System redirects)
      - **Key Components**: `src/path/to/file.tsx`
      - **Data Usage**: `Entity.field`

### Step 2.5: Implementation (ลงมือทำ) **[EXECUTION MODE]**
- **GATEKEEPER CHECK**:
  - [ ] `implementation_plan.md` Approved?
  - [ ] `task.md` Updated?
  - [ ] `traceability.md` Updated?
  - [ ] `spec.md` Updated?
  - *หากยังไม่ครบ 4 ข้อนี้ ห้ามเริ่มเขียน Code เด็ดขาด!*
- เขียน Code ตามแผนที่วางไว้ใน Step 2.3
- ทำทีละ Sub-task เพื่อลดความซับซ้อน

### Step 2.6: Verification (ตรวจสอบ) **[VERIFICATION MODE]**
- รัน Validate Command: `npm run lint` หรือ Build Check
- **Verification Plan**: ตรวจสอบตาม "Confirmed Behavior" ที่ระบุใน Task

### Step 2.7: Closure & Handoff (จบงาน)
- [x] Mark Task as Completed ใน `task.md`
- ลบ Temporary Logs หรือ Comments ที่ไม่จำเป็นตอน Production

### Step 2.8: Documentation Summary (สรุปการอัปเดตเอกสาร) **[MANDATORY FINAL CHECK]**
> **[CRITICAL GATEKEEPER]** : หากคุณไม่สรุปหัวข้อนี้ใน Final Response ถือว่างาน **"FAILED"** และผู้ใช้จะตีกลับงานทันที

ในขั้นตอนสุดท้ายของการตอบโต้ (Final Response) หรือเมื่อจะแจ้ง `notify_user` เพื่อจบงาน **คุณต้อง** สรุปการเปลี่ยนแปลงของเอกสาร 4 ฉบับหลักเสมอ:

1. `Spec_Kit/spec_project_detail/instruction.md`
2. `Spec_Kit/spec_project_detail/spec.md`
3. `Spec_Kit/spec_project_detail/task.md`
4. `Spec_Kit/spec_project_detail/traceability.md`

**Format การสรุป (Copy template นี้ไปใช้):**
```markdown
### Documentation Summary
1. **instruction.md**: [Updated / No Change] - (ระบุรายละเอียดการแก้ หรือเหตุผลที่ไม่ได้แก้)
2. **spec.md**: [Updated / No Change] - (ระบุรายละเอียดการแก้ หรือเหตุผลที่ไม่ได้แก้)
3. **task.md**: [Updated / No Change] - (ระบุรายละเอียดการแก้ หรือเหตุผลที่ไม่ได้แก้)
4. **traceability.md**: [Updated / No Change] - (ระบุรายละเอียดการแก้ หรือเหตุผลที่ไม่ได้แก้)
```
*เหตุผลที่ต้องระบุ "No Change"*: เพื่อยืนยันว่าคุณได้ "คิด" และ "ตรวจสอบ" แล้วจริงๆ ไม่ใช่แค่ลืม

---

## 3. Error Handling & Logging (การบันทึกปัญหา)
ทุกครั้งที่เจอ `Critical Error` หรือ `Bug` ที่ส่งผลกระทบต่อ User ให้บันทึกลงในส่วนนี้เสมอ

### Error Logs
- **[2026-02-16] File Count Real-time Update Failure**
  - **Issue**: Uploaded files via Gallery did not update the Project Card's file count immediately.
  - **Cause**: The `onSnapshot` listener in `projects-client-page.tsx` was missing the `totalFiles` field in its data mapping, causing it to ignore the updated value from Firestore.
  - **Fix**: Added `totalFiles: data.totalFiles || 0` to the project mapper object.
  - **Impact**: Real-time updates for file counts now work correctly.

- **[2026-02-16] Inconsistent R2 Folder Structure**
  - **Issue**: Uploads were split between `gallery-uploads` and `task-attachments`.
  - **Fix**: Standardized to `project-files/gallery` and `project-files/tasks` to keep project files organized under a common root.

- **[2026-02-16] Lightbox Accessibility Error**
  - **Issue**: Clicking "View" caused a runtime error: `DialogContent requires a DialogTitle`.
  - **Cause**: Radix UI requires a `DialogTitle` for accessibility, which was missing in the Lightbox implementation.
  - **Fix**: Added `<DialogTitle className="sr-only">Image Preview</DialogTitle>` to satisfy the requirement without affecting the UI.

- **[2026-02-16] Build Error: Duplicate Declaration**
  - **Issue**: Build failed with `Module parse failed: Identifier 'ImageUpload' has already been declared`.
  - **Cause**: Accidental duplicate import of `ImageUpload` component in `src/components/project-files-gallery.tsx` during previous edit.
  - **Cause**: Accidental duplicate import of `ImageUpload` component in `src/components/project-files-gallery.tsx` during previous edit.
  - **Fix**: Removed the redundant import statement.

- **[2026-02-16] Runtime Error: Delete Failed**
  - **Issue**: User reported generic "Failed to delete file" error in Lightbox.
  - **Investigation**: Generic catch-block masked the actual error.
  - **Fix**: Updated `deleteProjectFile` to return specific error messages (`error.message`) and added parameter validation logging.
  - **Fix**: Updated `deleteProjectFile` to return specific error messages (`error.message`) and added parameter validation logging.
  - **Next Step**: Waiting for user to retry and provide the specific error details.

- **[2026-02-16] Server Action Error: Firestore not initialized**
  - **Issue**: `deleteProjectFile` failed with `Expected first argument to collection() to be a CollectionReference...`.
  - **Cause**: `src/lib/firebase.ts` had a check `if (typeof window !== 'undefined')`, preventing Firestore initialization on the server. Since Server Actions run on the server, `db` was undefined.
  - **Cause**: `src/lib/firebase.ts` had a check `if (typeof window !== 'undefined')`, preventing Firestore initialization on the server. Since Server Actions run on the server, `db` was undefined.
  - **Fix**: Removed the browser-check to allow Firebase initialization in Node.js environment (Server).

- **[2026-02-16] Server Action Error: ReferenceError navigator is not defined**
  - **Issue**: Firebase JS SDK crashed in Server Action with `navigator is not defined`.
  - **Cause**: The Client SDK (`firebase/firestore`) checks `navigator.userAgent` even in Node.js environments if not fully compatible/mocked.
  - **Cause**: The Client SDK (`firebase/firestore`) checks `navigator.userAgent` even in Node.js environments if not fully compatible/mocked.
  - **Fix**: Added a polyfill `global.navigator = { userAgent: 'node' }` in `src/lib/firebase.ts` to satisfy the SDK checks on the server.

- **[2026-02-16] Feature Request: Missing Drag and Drop**
  - **Issue**: User reported inability to drag and drop files onto the gallery "white space".
  - **Action**: Implemented `onDrop` handler in `ProjectFilesGallery`.
  - **Detail**: Added visual overlay, file resizing (client-side), and batch upload support (sequential).
  - **Outcome**: Users can now drag images directly into the gallery to upload.

- **[2026-02-16] Build Error: Duplicate Declaration (Recurrence)**
  - **Issue**: Build failed with `Identifier 'ImageUpload' has already been declared`.
  - **Cause**: Accidental re-introduction of `ImageUpload` import when adding Drag and Drop logic.
  - **Fix**: Removed the redundant import line.

- **[2026-02-16] UX Improvement: Drag and Drop Feedback**
  - **Issue**: User reported "It doesn't look like anything" when dragging; overlay was flickering or not obvious.
  - **Cause**: The overlay element blocked `dragOver` events on the parent, causing `dragLeave` to fire immediately (flickering).
  - **Fix**: Added `pointer-events-none` to the overlay so drag events pass through to the drop zone. Enhanced visual style (backdrop, bounce animation, text).

- **[2026-02-16] Feature: Batch Upload & Drop Zone Fix**
  - **Issue**: Drag & Drop only worked in the inner area, causing browser opens on miss. Sequential upload was slow for many files.
  - **Action**: Moved drag listeners to `DialogContent` (root). Implemented `Promise.all` for parallel uploads.
  - **Detail**: Added "Uploading..." overlay status. Optimized Firestore writes (skip refresh per item).

- **[2026-02-16] Bug Fix: Drag and Drop Flickering**
  - **Issue**: User reported DnD features "didn't solve anything"; overlay was likely flickering or disappearing when dragging over child elements.
  - **Cause**: Simple `dragLeave` implementation turned off state immediately when entering children.
  - **Fix**: Implemented `dragCounter` (useRef) pattern. State is only disabled when the counter reaches 0 (leaving the root element). Added `onDragEnter` listener.

## 4. Documentation & Traceability ระหว่างทำงาน ให้บันทึกแบบ **Nested Log** ภายใต้ Task นั้นๆ ใน `task.md` เสมอ:

### Format: `T-XXX-EX-Y`
- **`T-XXX` (Task ID)**: รหัสงานหลักที่ปัญหานั้นเกิดขึ้น
- **`EX` (Error Index)**: ลำดับของ "ปัญหา" (Problem) ที่พบ (รันเลข E1, E2, ... ตามลำดับการเจอ)
  - *Note*: หากเป็นปัญหาเรื่องเดิม อาการเดิม หรือ Root Cause เดิม ให้ใช้เลข **E เดิม** เสมอ
- **`Y` (Attempt Count)**: จำนวนครั้งที่พยายามแก้ไข (เริ่มที่ 1)
  - หากแก้ครั้งแรกไม่หาย แล้วต้องแก้ซ้ำ ให้เพิ่มเลขนี้เป็น 2, 3, ... (เช่น E1-2, E1-3)
  - ห้ามเปลี่ยนเลข E ถ้ายังเป็นปัญหาเดิม

**Critical Rule: Bug vs. New Task (The "No New Task" Policy)**
- **ห้ามสร้าง Task ใหม่** ([T-New]) สำหรับการแก้ไขปัญหา (Bug/Fix) ในทุกกรณี ยกเว้นมันคือ Feature ใหม่ 100%
- หากปัญหานั้นเกิดจาก:
  1.  **Immediate Regression**: บั๊กที่เกิดทันทีหลัง Deploy หรือหลังแก้โค้ดจาก Task ล่าสุด
  2.  **Implementation Defect**: การตกหล่นของฟีเจอร์ที่กำลังทำอยู่ (ทำไม่ครบ, ทำแล้วพัง)
  3.  **Config/Env Issue**: ปัญหา Environment ที่ต้องแก้เพื่อให้ Task เดิมผ่าน (เช่น CORS, API Key)
  4.  **Logic Error**: สูตรคำนวณผิด, แสดงผลผิด
- **Action**: ให้บันทึกเป็น **Error Log (Nested List)** ใต้ Task เดิมที่เป็นเจ้าของ Feature นั้นๆ ทันที
  - *เหตุผล*: เพื่อให้เห็น History การแก้ปัญหาอยู่ในจุดเดียว (Traceability) และไม่ทำให้ Task List รกด้วยเศษงานแก้บั๊ก
- **สร้าง Task ใหม่ได้เมื่อ (Exceptions)**:
  - เป็น **Feature Request** ใหม่จาก User ที่ไม่เคยมีใน Spec มาก่อน
  - ต้องการ **Refactor** ใหญ่ที่แยก Module ออกมาอย่างชัดเจน
  - เป็นงาน **Optimization** ที่ไม่ได้เกิดจาก Error แต่ต้องการ Performance ที่ดีขึ้นมาก

### Example Log:
```markdown
- [ ] [T-XXX] Implement Feature A
    - **Error Logs**:
      - **[T-XXX-E1-1]**: Import Error
        1. **Root Cause**: วงวนการ Import (Circular Dependency)
        2. **Action**: แยก Type ออกไฟล์กลาง
        3. **Status**: Fixed
```

---

## 4. Incident Resolution Template (Production Issues)
*(สำหรับปัญหาเร่งด่วน หรือ Critical Bug)*

### A. Symptom (อาการ)
*   **What**: เกิดอะไรขึ้น Error คืออะไร
*   **Where**: Environment ไหน (Dev/Prod)

### B. Analysis (วิเคราะห์)
*   **Root Cause**: สาเหตุทางเทคนิค
*   **Impact**: ผลกระทบ

### C. Solution (การแก้ไข)
*   **Fix Steps**: วิธีแก้ตามลำดับ
*   **Verification**: วิธีตรวจสอบว่าหายจริง
