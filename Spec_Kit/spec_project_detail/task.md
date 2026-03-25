# แผนงานและรายการสิ่งที่ต้องทำ (Task Roadmap)

## Phase 1: การวางรากฐาน (Foundation) - **เสร็จสิ้น**
### 🔧 System / Global Components
- [x] [T-001] เริ่มต้นโปรเจกต์ Next.js พร้อม TypeScript
- [x] [T-002] ติดตั้ง Tailwind CSS และ Shadcn UI
- [x] [T-003] ตั้งค่าการเชื่อมต่อ Firebase (`src/lib/firebase.ts`)
- [x] [T-004] กำหนด Data Models หลัก (`src/lib/types.ts`)
- [x] [T-108] **Fix React 419 & Firebase 400 Errors**: แก้ไขปัญหา Server Action Fail (419) และ Firebase "CONFIGURATION_NOT_FOUND" (400) <!-- id: 8 -->
  - **Type**: Bug/Stability
  - **Priority**: High
  - **Description**: Investigate and fix "Minified React error #419" (Server Action failure) and Firebase "CONFIGURATION_NOT_FOUND" (400).
    - Checks: Firebase Auth Domain/API Key, Server Action Edge Compatibility.
  - **Status**: Completed
  - **Time Validated**: 2025-01-14
  - **Actual Time**: 0.5h
  - **Traceability**: [F-009], [F-12]
- [x] [T-147] **Refactor Task Documentation Structure**: จัดโครงสร้าง task.md ใหม่ตาม implement.md
  - **Type**: Documentation
  - **Priority**: Medium
  - **Description**:
      1. Distribute 'Appendix: Incident Logs' back into relevant tasks ([T-051], [T-094], [T-098], [T-100]) as Nested Error Logs.
      2. Verify structure consistency.
  - **Status**: Completed
  - **Time Validated**: 2026-01-08

---

## Phase 2: ฟีเจอร์หลัก (Core Features) - **กำลังดำเนินการ**

### 📍 Page: Projects List (`src/app/projects`)
- [x] [T-010] สร้างหน้ารายการโปรเจกต์ (`src/app/projects`)
- [/] [T-011] พัฒนาแบบฟอร์มสร้างโปรเจกต์
- [x] [T-015] เพิ่ม Field `Owner` ในระดับ Project (Type, UI, Actions)
- [x] [T-016] เพิ่ม Autocomplete สำหรับ Project Owner (เลือกจาก Customer) และปุ่ม Quick Add Customer
- [x] [T-095] **Improve Autocomplete Interaction**: ปรับปรุง UI การเลือกรายการใน `SingleSelectAutocomplete`
    - **Requirement**: รองรับ Mouse Hover เพื่อ Highlight และ Click เพื่อ Select ได้สมบูรณ์แบบ (ทำงานคู่กับ Keyboard Navigation)
    - **Fix**: เพิ่ม `onMouseEnter` และแก้ไข Logic ให้รองรับ **Case-Insensitive**
- [x] [T-096] **Refactor Autocomplete to use IDs (Safe Mode)**: แก้ไขปัญหา Interaction ของ Autocomplete ให้สมบูรณ์ถาวรตามคำแนะนำ User
    - **Requirement**: เปลี่ยน Logic จากการใช้ `label` เป็น `value` (ID) ใน `CommandItem` เพื่อเลี่ยงปัญหา Normalization ของ `cmdk`
    - **Fix (Refined)**: Set `shouldFilter={false}`, convert ID to lowercase for comparisons.
- [x] [T-097] **Fix Project Actions & Edge Compatibility**: แก้ไขปัญหา 405 Error และ Empty Team List ในหน้า Projects
    - **Symptom**: "Create Project" fails with 405/500 Error, and "Team" dropdown is empty.
    - **Fix**: Migrate `actions.ts` and `page.tsx` to use `@/lib/firebase-lite`.
- [x] [T-098] **Comprehensive Fix for Autocomplete & Project Creation**: แก้ไขปัญหา 405 และ Autocomplete ถาวร
    - **Resolution**: Refactored `SingleSelectAutocomplete` (removed cmdk), Fixed 405 by adding `export const runtime = 'edge'`.
- [x] [T-099] **Apply OS Filter to Project Owners**: กรองรายชื่อ Customer ใน New/Edit Project -> Owner ให้แสดงตาม Mode (OS=Dark only, Std=Light only)
- [x] [T-109] **Add Project Category & Highlighting**: เพิ่ม Field `category` และระบบสีแบ่งหมวดหมู่ <!-- id: 9 -->
  - **Type**: Feature
  - **Priority**: High
  - **Traceability**: [F-013]
- [x] [T-114] **Project Sorting Options**: เพิ่มตัวเลือกจัดเรียงการ์ด (Category, Start Date, End Date) <!-- id: 14 -->
  - **Type**: Feature/UI
  - **Traceability**: [F-002], [F-010]
- [x] [T-173] **GitHub Link**: Add GitHub Link to Project Card (Clip Label) <!-- id: 173 -->
  - **Type**: Feature
  - **Traceability**: [F-002]
  - **Error Logs**:
    - **[T-173-E1-1]**: Syntax Error in ProjectCard (Missing closing div)
      1. **Root Cause**: Improper nesting of `div` and `DropdownMenu` during `replace_file_content`.
      2. **Action**: Added missing `</div>` tag.
      3. **Status**: Fixed, [F-010]
- [x] [T-174] **Enhance GitHub Link Interaction**: ย้ายตำแหน่ง GitHub Link ไปที่ซ้ายล่าง และเปลี่ยนเป็นแบบ Click-to-Reveal (Clip Label) <!-- id: 174 -->
  - **Type**: Feature/UX
  - **Traceability**: [F-002]
- [x] [T-175] **Fix Project Dialog Overflow**: แก้ไขปัญหา Dialog ล้นจอด้วยการจำกัดความสูงและการเลื่อน (Scroll) <!-- id: 175 -->
  - **Type**: Bug/UI
  - **Traceability**: [F-002]
- [x] [T-176] **Deploy to Production**: Deploy GitHub Link & Dialog Overflow Fixes to Production <!-- id: 176 -->
  - **Type**: DevOps
  - **Traceability**: [F-012]
- [x] [T-177] **Support Multiple External Links**: Upgrade githubLink to support multiple Label+URL links <!-- id: 177 -->
  - **Type**: Feature/UX
  - **Traceability**: [F-002]
- [x] [T-178] **In-Progress Task Indicator**: Show hammer icon with count & tooltip of active tasks on Project Card <!-- id: 178 -->
  - **Type**: Feature/UX
  - **Traceability**: [F-002]
- [x] [T-118] **Project Categorized View**: แสดงผลแบบแยกหมวดหมู่ (Section Headers) <!-- id: 18 -->
  - **Type**: UI/UX
- [x] [T-119] **Persist Filter Settings**: จำค่า Filter/Sort ล่าสุด <!-- id: 19 -->
  - **Type**: Enhancement
- [x] [T-179] **In-Progress Poject Filter**: เพิ่มตัวเลือกกรองโปรเจกต์ที่มีงาน In-Progress ในหน้ารายการ <!-- id: 179 -->
  - **Type**: Feature/UX
  - **Traceability**: [F-002], [F-010]
- [x] [T-180] **Deploy In-Progress Filter**: Deploy In-Progress filter feature to Production <!-- id: 180 -->
  - **Type**: DevOps
  - **Traceability**: [F-012]
- [x] [T-181] **Refine Completion Display**: เปลี่ยนข้อความ Complete เป็น Icon (CheckCircle) บนการ์ดโปรเจกต์ <!-- id: 181 -->
  - **Type**: UI/UX
  - **Traceability**: [F-002]
- [x] [T-182] **Real-time Stats Update**: เพิ่ม Revalidate Path '/projects' เมื่อมีการเปลี่ยนแปลง Task Status <!-- id: 182 -->
  - **Type**: Enhancement
  - **Traceability**: [F-002]
- [x] [T-135] **Fix Project Edit Not Saving**: แก้ไขปัญหาการแก้ไขข้อมูล Project แล้วไม่บันทึก (Revert ค่าเดิม)
  - **Type**: Bug
  - **Priority**: High
  - **Status**: Completed (Fix: Add useEffect hook)

### 📍 Page: Project Board (`src/app/project/[id]`)
- [x] [T-012] สร้างหน้ารายละเอียดโปรเจกต์ (`src/app/project/[id]`)
- [/] [T-013] พัฒนาระบบสร้างงาน (Task) และการจัดหมวดหมู่แบบ Matrix
    - **Error Logs**:
      - **[T-013-E1-1]**: Real-time updates for new tasks/edits not reflecting on other clients.
        1. **Root Cause**: Linked to [T-138-E1-1] - Missing data variable in snapshot loop.
        2. **Action**: Fix `project-details-client.tsx`.
        3. **Status**: Fixed
- [x] [T-014] พัฒนาระบบ Drag & Drop สำหรับอัปเดตสถานะงาน (Implement `react-beautiful-dnd` & Backend Recalculation Stats)
- [x] [T-110] **Automate Project Dates from Tasks**: เชื่อมโยงวันเริ่ม/จบของโปรเจกต์กับ Task (Min/Max Dates) <!-- id: 10 -->
  - **Type**: Feature/Logic
  - **Traceability**: [F-002]
- [x] [T-111] **Persistent Project Dates & UI Display**: Recalculate Project Dates on Task Mutations <!-- id: 11 -->
  - **Type**: Feature/Refactor
  - **Traceability**: [F-002]
- [x] [T-112] **Project Editing Presence (Visual Lock)**: แสดงสถานะป้องกันแก้ไขซ้ำ (Visual Anmil) <!-- id: 12 -->
  - **Type**: Feature/Safety
  - **Traceability**: [F-003]
- [x] [T-113] **Project Card UI Refinement**: ปรับปรุง UI การ์ดโปรเจกต์ (Size, Description, Badges) <!-- id: 13 -->
  - **Type**: UI/UX
- [x] [T-115] **Fix Create Task Error**: แก้ไข Error 419/TypeError ตอนสร้าง Task <!-- id: 15 -->
  - **Type**: Bug
  - **Status**: Completed (Fix: Remount Dialog, Hidden Inputs, AlertDialogTitle)
- [x] [T-116] **Lock Task Type**: ล็อค Field "Project Type" (Task Type) <!-- id: 16 -->
  - **Type**: Enhancement
- [x] [T-117] **Task Checklist**: ระบบ Checklist ในการ์ดงาน <!-- id: 17 -->
  - **Type**: Feature
- [x] [T-141] **Implement Assignee Groups**: ระบบสร้างและจัดการกลุ่มผู้รับผิดชอบงาน
  - **Type**: Feature
  - **Traceability**: [F-014]
- [ ] [T-167] **Edit Assignee Group**: แก้ไขชื่อและสมาชิกในกลุ่มผู้รับผิดชอบ <!-- id: 167 -->
  - **Type**: Feature
- [x] [T-130] **Vertical Task Reordering & Animation Polish**: เพิ่มการจัดเรียง Task แนวตั้งและแก้ไข Animation กระโดด <!-- id: 30 -->
  - **Type**: Feature/Bug Fix
  - **Traceability**: [F-003]
- [x] [T-131] **Enhance Drag & Drop UX (Static List + Guide Line)**: ปรับปรุง UX การลากวางให้รายการนิ่งและมีเส้นไกด์ <!-- id: 31 -->
  - **Type**: Enhancement/UX
- [ ] [T-132] **Enable Intra-Column Task Reordering**: สลับลำดับการ์ดในสถานะเดียวกันได้ <!-- id: 32 -->
  - **Type**: Feature/UX
- [ ] [T-133] **Fix DropIndicator Positioning**: แก้ไขตำแหน่ง Guide Line ให้แสดงถูกต้องตาม Cursor <!-- id: 33 -->
  - **Type**: Bug/UX
- [ ] [T-134] **Custom Drag Hit Detection (Force Insert Before)**: ปรับ Logic การวางการ์ดให้ "วางบนการ์ด = แทรกก่อนหน้าเสมอ" <!-- id: 34 -->
  - **Type**: Feature/UX
- [x] [T-136] **Fix Missing Task Buttons**: ปุ่ม CheckList และ Tracking หายไปจาก Task Card
  - **Type**: Bug
  - **Status**: Completed (Fix: Restore TaskChecklist & Add Link)
- [x] [T-137] **Fix Task Creation Freeze**: การสร้าง Task ค้างหรือไม่สำเร็จในบางจังหวะ
  - **Type**: Bug
  - **Status**: Completed (Fix: Force Remount Dialog)
- [x] [T-138] **Fix Checklist Persistence**: Checklist เพิ่มแล้วไม่บันทึก (Refresh แล้วหาย)
  - **Type**: Bug
  - **Status**: Completed (Fix: Added useEffect for prop sync)
    - **Error Logs**:
      - **[T-138-EX-1]**: Checklist items not displaying "No items yet" and Real-time broken.
        1. **Root Cause**: Missing `const data = doc.data()` in `project-details-client.tsx` `onSnapshot` loop, causing `ReferenceError` or undefined fields.
        2. **Action**: Add missing variable declaration.
        3. **Status**: Fixed
      - **[T-138-EX-2]**: "Each child in a list should have a unique 'key' prop" error for Editors.
        1. **Root Cause**: `editor.userId` was undefined because it wasn't populated from map key.
        2. **Action**: Refactor `activeEditors` to use `Object.entries` and fallback to key.
        3. **Status**: Fixed
- [x] [T-139] **Change Track to Comment**: เปลี่ยนปุ่ม Track เป็นปุ่ม Comment สำหรับบันทึกข้อความ
  - **Type**: Change Request
- [x] [T-127] **Enhance Matrix Interaction**: ปรับปรุงการกดที่กราฟ Matrix ให้เลือก Project ได้ <!-- id: 27 -->
  - **Type**: Enhancement
- [x] [T-159] **Implement Manual Task Reordering**: เพิ่มปุ่มลูกศรขึ้น/ลง เพื่อจัดเรียงการ์ด
   - **Type**: Feature / UX Improvement
- [ ] [T-032] รองรับการแนบไฟล์ (File Attachment) ในแต่ละงาน

### 📍 Page: Calendar (`src/app/calendar`)
- [x] [T-020] ตั้งค่าหน้าปฏิทิน (`src/app/calendar`)
- [/] [T-021] เชื่อมข้อมูลงาน (Tasks) เข้ากับปฏิทิน (Fix: Dropdown options & Dark Mode Filter)
- [x] [T-094] **Debug Calendar Deployment**: แก้ไขปัญหา ChunkLoadError และ 404 Assets บน Cloudflare Pages
    - **Fix**: ปรับปรุง Deployment Script (`deploy_prod.sh`)
- [x] [T-150] **Fix Calendar Member Selection & Group Support**: แก้ไขปัญหาเลือก Member แล้วหาย และเพิ่มการรองรับ Group Selection
  - **Type**: Bug Fix / Feature Enable
- [x] [T-151] **Deploy Calendar Fix & Resolve API Key Restriction**: Deploy fixes from T-150 and address CORS/Referrer 403 error.
  - **Type**: DevOps / Deployment
- [x] [T-164] **Deploy Calendar Features**: Deploy Duplicate & Recurring Event features to Production
  - **Type**: DevOps / Deployment
  - **Traceability**: [F-005]
- [x] [T-153] **Standardize Member Selection & Group Creation**: Refactor member selection into a reusable component with "New Group" button.
   - **Type**: Feature/Refactor
   - **Traceability**: [F-014], [F-009]
- [x] [T-154] **Implement Calendar Event Tooltip**: แสดงรายละเอียดเพิ่มเติมเมื่อ Hover บน Event
   - **Type**: UI/UX
- [x] [T-155] **Enhance Calendar Tooltip with Group Logic**: แสดงชื่อกลุ่มแทนรายชื่อสมาชิก และ Hover เพื่อดูสมาชิกในกลุ่ม
   - **Type**: UI/UX
- [x] [T-156] **Fix Calendar Tooltip Interaction Stability**: เปลี่ยน Outer Tooltip เป็น HoverCard เพื่อแก้ปัญหา Tooltip หายก่อนชี้
   - **Type**: Bug Fix / UX Improvement
- [x] [T-157] **Refine Calendar Tooltip Z-Index & Interaction**: แก้ไข Tooltip โดนบังและปิดเร็วเกินไป
   - **Type**: Bug Fix / UX Improvement
- [x] [T-158] **Fix Calendar Group Flash-on-Load**: ป้องกันการแสดงรายชื่อแยกก่อนโหลดกลุ่มเสร็จ
   - **Type**: UX Improvement / Bug Fix
- [x] [T-162] **Implement Duplicate Event Feature**: เพิ่มปุ่ม Duplicate ในหน้า Edit Event
   - **Type**: Feature
- [x] [T-163] **Implement Recurring Events**: ระบบสร้าง Event แบบทำซ้ำ (Daily, Weekly, Monthly)
   - **Type**: Feature
- [ ] [T-028] เชื่อมต่อ Calendar Events กับ Customers เพื่อสร้าง Auto Activity Log

### 📍 Page: Analytics (`src/app/analytics`)
- [x] [T-022] พัฒนา Analytics Dashboard (`src/app/analytics`)
    - **Concept**: แยกมุมมองเป็น 2 Tabs (Task Overview, Workload Analysis)
    - **Features**: Global Filter Bar, Unified State Management, Table UI Refinements.
- [x] [T-100] **Fix Analytics Mapping & Visibility**: แก้ไขปัญหาชื่อไม่ขึ้นและข้อมูลเป็น 0
    - **Actions**: Add Sensitive Map, Relax Logic.
- [x] [T-101] **Fix Analytics Data Fetching (Edge Compatibility)**: แก้ไขปัญหา Analytics load data ไม่ขึ้น (0 items) บน Cloudflare
    - **Action**: Migrate to `firebase-lite`.
- [x] [T-102] **Implement Sticky Filters in Analytics**: ทำให้ส่วน Filter ลอยติดด้านบนเมื่อ Scroll
- [x] [T-103] **Refine Analytics UI Interactivity**: ปรับตำแหน่ง Sticky และแก้ Chart Label ทับกัน
- [x] [T-107] **Optimize Analytics Data Caching**: พัฒนาระบบ Caching สำหรับ Analytics เพื่อลดเวลาในการโหลด <!-- id: 7 -->
  - **Type**: Optimization
- [x] [T-140] **Implement Analytics Filter Toggle**: เพิ่มปุ่มซ่อน/แสดง Filter ในหน้า Analytics เพื่อแก้ปัญหาบังหน้าจอบนมือถือ
  - **Type**: Feature/UX
- [x] [T-185] **Implement Daily Report Analysis Tab**: เพิ่มแท็บ Daily Report Analysis เพื่อสรุปการลงเวลาของทีมงานแยกตามวัน/บุคคล สามารถดูรายละเอียดงานย่อยได้ <!-- id: 185 -->
  - **Type**: Feature
  - **Traceability**: [F-010]
  - **Error Logs**:
    - **[T-185-EX-1]**: Server Component passes non-plain object (Firestore Timestamp) out of AssigneeGroups causing console error.
      1. **Root Cause**: `getAssigneeGroups` in `analytics/page.tsx` directly returned Firebase Document data containing `createdAt` objects.
      2. **Action**: Manually mapped and extracted only necessary plain static fields (`id`, `name`, `description`, `members`) from the Server Component before passing as props.
      3. **Status**: Fixed
- [x] [T-187] **Daily Report Missing Logs Detection**: ตรวจสอบและแสดงรายการวันที่ไม่ได้ลงเวลา (เฉพาะจันทร์-ศุกร์) โดยระบุสถานะ "ผิดปกติ (0 ชม.)" ในแท็บ Daily Report Analysis
  - **Type**: Feature
  - **Traceability**: [F-010]



### 📍 Page: Tracking (`src/app/tracking`)
- [x] [T-085] **Verify Tracking Logic**: ตรวจสอบการทำงานของหน้า Daily Tracking ว่าส่งผลต่อ Task จริงหรือไม่
    - **Principles**: Data Integrity.
    - **Error Logs**:
      - **[T-085-EX-1]**: Tracking Logic incorrectly defaults progress to 100% based on historical max.
        1. **Root Cause**: `processTrackingDataFromCache` uses `Math.max` across all history, overriding current task status.
        2. **Action**: Remove `Math.max` logic and use `task.Progress` as source of truth.
        3. **Status**: Fixed
- [x] [T-087] **Implement Show Completed Toggle**: Add toggle to Tracking page to view 100% completed tasks
  - **Type**: Feature/UX
  - **Traceability**: [F-004]
  - **Error Logs**:
    - **[T-087-EX-1]**: Duplicate declaration of `showConfirmDialog`.
      1. **Root Cause**: Copy-paste error during implementation of Show Completed toggle.
      2. **Action**: Remove duplicate line.
      3. **Status**: Fixed
    - **[T-087-EX-2]**: Build error "Identifier already declared" persists despite fix.
      1. **Root Cause**: Build cache issue or stale file serving.
      2. **Action**: Verify unique declaration and force file update.
      3. **Status**: Fixed
- [ ] [T-088] **Implement Assignee Group Filtering**: Update Tracking to show tasks assigned to groups the user belongs to
  - **Type**: Feature/Bug Fix
  - **Traceability**: [F-004], [F-014]
  - **Error Logs**:
    - **[T-088-EX-1]**: Tasks assigned to groups (e.g., DBD) not showing for individual members.
      1. **Root Cause**: Filter logic only checks direct assignee name match.
      2. **Action**: Fetch `assignee_groups` and check membership in `tracking-client.tsx`.
      3. **Status**: Fixed
- [x] [T-183] **Force Show Completed Default**: Default "Show Completed" to ON and add Group debugging UI.
  - **Type**: Verification
  - **Traceability**: [F-004]
  - **Status**: Fixed
- [ ] [T-086] **UI State Persistence**: พัฒนาระบบจำค่า Filter/Selection เมื่อเปลี่ยนหน้า
- [x] [T-104] Improve Tracking Table UX: เพิ่ม Sorting และแก้ Input Behavior <!-- id: 4 -->
  - **Type**: Feature/UX
- [x] [T-106] **Optimize Tracking Data Fetching**: แก้ไขปัญหาตารางโหลดซ้อน 2 รอบ (Redundant Fetching) <!-- id: 6 -->
  - **Type**: Bug/Optimization
- [x] [T-184] **Enhance Daily Tracking Validation and Display**: ปรับปรุงการตรวจสอบ Progress ย้อนหลัง, แสดงผลงาน Done ในอดีต, เรียงลำดับตาม Project
  - **Type**: Feature/UX
  - **Priority**: High
  - **Description**:
      1. ล็อก Input Progress ไม่ให้ข้ามขอบเขตในอดีตและอนาคต
      2. ปรับสถานะเป็น "จบงานแล้ว" อัตโนมัติเมื่อ Progress = 100%
      3. แสดงงานที่เคยลงเวลาในอดีตแม้สถานะปัจจุบันจะ Done แล้ว
      4. จัดเรียงตารางตาม Project Name และลดหลั่นตาม Progress
  - **Traceability**: [F-004]
  - **Error Logs**:
    - **[T-184-EX-1]**: ข้อมูลการลงเวลาของ Task ที่ใช้งานร่วมกัน (เช่น "ลา", "ประชุม" ของโปรเจกต์ "พิธีกรรม") สูญหายเมื่อดูย้อนหลัง
      1. **Root Cause**: ฟังก์ชัน `confirmSave` อัปเดตข้อมูลแบบ Batch แต่ Query หา Existing Tracking record เดิมโดยระบุแค่ `taskId` กับ `date` ขาด `trackerName` ทำให้ถ้ามีคนลงเวลาย้อนหลังงานเดียวกันในวันเดียวกัน จะไปทับ(Overwrite) Record ของคนก่อนหน้า
      2. **Action**: เพิ่มเงื่อนไข `where('trackerName', '==', selectedAssignee)` ใน Firestore Query ตอนกด Save
      3. **Status**: Fixed
- [x] [T-186] **Refactor Tracking Progress to Global Scope**: เปลี่ยนการคำนวณ Min/Max/Latest Progress ให้อิงจากประวัติของทุกคน (Global History) ไม่ใช่แค่ของคนลงเวลา
  - **Type**: Feature/Refactor
  - **Traceability**: [F-004]
- [ ] [T-031] ปรับปรุงระบบบันทึกเวลาทำงาน (Time Tracking Log)

### 📍 Page: Customers (`src/app/customers`)
- [x] [T-025] ออกแบบ Data Model สำหรับ Customer และ Activity Logs (`src/lib/types.ts`)
- [x] [T-026] สร้างหน้า Customer List (`src/app/customers/page.tsx`) พร้อม Project Stats & Health Score
- [x] [T-027] สร้างหน้า Customer Details, 360-View Project & Rating System (`src/app/customers/[id]/page.tsx`) พร้อมหน้า Edit & Error Handling
- [x] [T-029] เพิ่มฟีเจอร์ OS Customer Filtering ตาม Dark Mode (`isDarkModeOnly`) ลงใน Customer List, Edit Form, Calendar Members **และ Tracking Page**
- [x] [T-079] **Customer Statistics**: แก้ไขการคำนวณ Star Chart และเพิ่ม Customer Project Count (Completed/Total) ด้วยการ denormalize ข้อมูลลง Customer Document
- [x] [T-080] **Project Owner Linkage & UI**: ปรับปรุงการเก็บข้อมูล Project Owner ให้เก็บ `customerId` (Link) ควบคู่กับชื่อ และแสดง Badge "Owner" บนการ์ดโปรเจกต์
- [x] [T-081] **Refine Star Chart Metric**: ปรับปรุงการแสดงผลและคำนวณแกน "Harder" (ความเขี้ยว)
- [x] [T-082] **Fix Rating Dialog Initialization**: แก้ไขปัญหา Dialog ให้คะแนนไม่ดึงค่าล่าสุดมาแสดง
- [x] [T-142] **Fix Customer List Refresh**: แก้ไขปัญหารายชื่อลูกค้าไม่แสดงทันทีหลังเพิ่ม
  - **Type**: Bug Fix
- [x] [T-143] **Add Customer Social Media Fields**: เพิ่มช่องกรอก Line, Facebook, WhatsApp
  - **Type**: Feature
- [x] [T-144] **Improve Documentation & Fix Edit Customer**: ปรับปรุงเอกสารเพื่อป้องกัน Impact Analysis หลุด และแก้ Edit Customer <!-- id: 44 -->
  - **Type**: Verification/Fix
- [x] [T-145] **Polish Edit Customer Dialog UI**: ขยายความกว้าง Dialog เพื่อให้อ่านง่ายขึ้น
  - **Type**: UI/UX
- [x] [T-148] **Refactor Customer Dialogs (Unified Component)**: รวม Add/Edit Customer Dialog เป็น Component เดียวกัน
  - **Type**: Refactor/Cleanup
- [x] [T-149] **Display Social Media in Contact Info**: แสดงข้อมูล Social Media ในหน้า Customer Detail
  - **Type**: UI Update

---

## Phase 3: ฟีเจอร์ขั้นสูง (Advanced Features)
- [ ] [T-030] พัฒนา "Party Mode" (ระบบ Presence แสดงสถานะออนไลน์แบบ Real-time)
- [x] [T-078] **Real-time Presence (Collaboration)**: แสดง Avatar ของผู้ใช้ (Anonymous Animals) ที่กำลังแก้ไขงานใน Kanban และ Calendar (ใช้ Firestore `presence`)

## Phase 4: การทำงานร่วมกับ AI (AI Integration - Genkit)
- [ ] [T-040] ติดตั้งและตั้งค่า Genkit สำหรับ Local Development
- [ ] [T-041] สร้าง AI Flow สำหรับ "ช่วยแตกงานย่อยอัตโนมัติ" (Auto-generate Subtasks)
- [ ] [T-042] สร้าง AI Flow สำหรับ "วิเคราะห์ความเสี่ยงโปรเจกต์" (Project Risk Analysis)
- [x] [T-165] **Update AI Tool Trip Protocol**: ปรับปรุงเอกสาร `AI_Tool_Trip.md` ให้สอดคล้องกับ `implement.md` (Strict Workflow)
- [x] [T-166] **Add Project Adoption Prompt**: เพิ่มคำสั่ง `Adoption Prompt` ใน `AI_Tool_Trip.md` สำหรับ Existing Projects

## Phase 5: การ Deployment และปรับแต่ง (Deployment & Polish)
### 🔧 System / Global Components
- [ ] [T-050] กำหนดกติกาความปลอดภัย (Firebase Security Rules) ให้สมบูรณ์
- [x] [T-051] Deploy ขึ้น Production (Cloudflare Pages)
    - [x] สร้าง Script `deploy_prod.sh`
    - **Error Logs**: Detailed deployment logs maintained in task history.
- [ ] [T-052] ตรวจสอบประสิทธิภาพ (Performance Audit ด้วย Lighthouse)
- [x] [T-152] **Remove Unused Firebase Auth Initialization**: Comment out `getAuth(app)` to prevent 403 Errors.
- [x] [T-105] **Implement Global Blur Loading State**: เพิ่ม Loading Screen แบบ Blur Overlay ระหว่างเปลี่ยนหน้า <!-- id: 5 -->
  - **Type**: Feature/UX
