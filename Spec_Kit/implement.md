# Project Implementation Protocol (Project Management System)

คู่มือการปฏิบัติงานสำหรับการพัฒนาและติดตั้งระบบ (Implementation Standard Operating Procedure) เพื่อให้การดำเนินโครงการเป็นไปอย่างมีระบบ และตรวจสอบได้ตามมาตรฐาน

---

## 1. Context Loading & Preparation (การเตรียมความพร้อมข้อมูล)
> **Process**: ก่อนเริ่มการพัฒนาหรือแก้ไขส่วนใดส่วนหนึ่งของโครงการ **ต้องทบทวนเอกสารประกอบทั้งหมด** เพื่อให้เข้าใจภาพรวมและผลกระทบ

1.  **`SpecKit/instruction.md` (Blueprint & Structure)**
    *   **Purpose**: ศึกษา Environment, Tech Stack, Directory Structure, และ Coding Standards
    *   **Scope**: ตรวจสอบเกณฑ์มาตรฐานทางเทคนิค โครงสร้างไฟล์ และข้อกำหนดของระบบ Project Management
2.  **`SpecKit/spec.md` (Features & Requirements)**
    *   **Purpose**: ตรวจสอบความต้องการของระบบ (Functional Requirements) ตามรหัส `[F-xxx]`
    *   **Scope**: ยืนยันว่าการพัฒนาสอดคล้องกับขอบเขตงาน (Scope) ที่ตกลงไว้ใน Spec
3.  **`SpecKit/task.md` (Execution Roadmap)**
    *   **Purpose**: ตรวจสอบสถานะงานและแผนการดำเนินงาน (`[T-xxx]`)
    *   **Scope**: ประเมินงานที่คงค้างและลำดับความสำคัญของงานที่ต้องดำเนินการต่อ
4.  **`SpecKit/traceability.md` (Traceability Matrix)**
    *   **Purpose**: ตรวจสอบความเชื่อมโยงระหว่าง Feature, Task, และ Source Code
    *   **Scope**: วิเคราะห์ผลกระทบ (Impact Analysis) เพื่อป้องกันไม่ให้การแก้ไขจุดหนึ่งส่งผลกระทบต่อจุดอื่น (Regression)

---

## 2. Planning (การวางแผนการดำเนินงาน)
> **Process**: ให้ทำการวางแผนและระบุขั้นตอนการทำงานลงในเอกสารก่อนเริ่มดำเนินการทางเทคนิค

1.  **Requirement Analysis**:
    *   วิเคราะห์ความต้องการและผลกระทบของ Change Request (CR) ที่เกิดขึ้น
    *   ประเมินความเสี่ยงและความซับซ้อนของงาน
2.  **Update `SpecKit/task.md`**:
    *   สร้าง Task Item (`[T-xxx]`) สำหรับงานใหม่
    *   ระบุรายละเอียดขั้นตอนการปฏิบัติงาน (Action Plan) ที่ชัดเจน
    *   อ้างอิง Feature (`[F-xxx]`) และ Component ที่เกี่ยวข้อง
    *   **Component Registration**: หากมีการสร้าง Component หลักของระบบ Project Management (เช่น Gantt Chart, Kanban Board) ให้ลงทะเบียนรหัส `[C-xxx]` ใน `traceability.md`
    *   **Communication**: ใช้ **ภาษาไทย** ในการบันทึกแผนงานเพื่อให้ทีมงานเข้าใจตรงกัน
3.  **Update Specification**:
    *   หากเป็นฟีเจอร์ใหม่ที่ไม่เคยระบุ ให้ดำเนินการเพิ่มข้อมูลลงใน `SpecKit/spec.md`

---

## 3. Execution (ขั้นตอนการปฏิบัติงาน)
> **Process**: ดำเนินการตามแผนงานที่กำหนดไว้อย่างเป็นขั้นตอน

1.  **Sequential Implementation**: ปฏิบัติงานตามลำดับขั้นตอนใน `task.md`
2.  **Quality Control**: ตรวจสอบความถูกต้อง (Verification) ของผลลัพธ์ในแต่ละขั้นตอนย่อย
3.  **Standard Compliance**: ยึดถือมาตรฐาน coding conventions ที่ระบุใน `instruction.md` อย่างเคร่งครัด
4.  **Data Integrity**: ให้ความสำคัญกับความถูกต้องของข้อมูล (Data Consistency) โดยเฉพาะในส่วนของการเชื่อมโยงระหว่าง Task, Project และ Customer

---

## 4. Documentation & Finalization (การจัดทำเอกสารและส่งมอบงาน)
> **Process**: เมื่อดำเนินการเสร็จสิ้น ต้องปรับปรุงเอกสารโครงการให้เป็นปัจจุบัน (As-built Documentation)

1.  **Status Update**: ปรับสถานะงานใน `SpecKit/task.md` ให้เป็น "Complete" (`[x]`)
2.  **Traceability Update (`SpecKit/traceability.md`)**:
    *   บันทึกไฟล์ source code ที่ถูกสร้างหรือแก้ไข
    *   อัปเดตความสัมพันธ์ระหว่าง Code -> Feature -> Task
    *   บันทึกตัวแปรระบบ (System Variables) ที่สำคัญ
3.  **Language Standard**:
    *   การสื่อสารและการบันทึกข้อมูลในระบบเอกสาร **ใช้ภาษาไทย** เพื่อความเป็นมาตรฐานเดียวกันของโครงการ

---



## 5. Incident Resolution & Debugging Template (แนวทางการแก้ไขปัญหาและ Debugging)
> **Goal**: ให้ใช้ Template นี้ในการรับมือกับ Incident หรือ Bug ที่เกิดขึ้นเพื่อความเป็นระบบ

### A. Symptom Identification (การระบุอาการ)
*   **What**: อธิบายอาการที่เกิดขึ้นอย่างละเอียด (Error Message, Screen Recording, Steps to Reproduce)
*   **Where**: เกิดขึ้นที่ Environment ใด (Local, Preview, Production)
*   **When**: เริ่มพบล่าสุดเมื่อไหร่ หรือหลังจากการ Deployment รอบใด

### B. Root Cause Analysis (การวิเคราะห์สาเหตุ)
*   **Hypothesis**: ตั้งสมมุติฐานสาเหตุที่เป็นไปได้
*   **Validation**: ทดสอบสมมุติฐาน (Debug logs, Isolation test)
*   **Conclusion**: สรุปสาเหตุที่แท้จริง (Technical Root Cause) e.g., Library incompatibility, Runtime mismatch.

### C. Correction Plan (แผนการแก้ไข)
*   **Strategy**: แนวทางการแก้ไข (e.g., Refactor, Config Change, Library Swap)
*   **Action Steps**:
    1.  ขั้นตอนที่ 1
    2.  ขั้นตอนที่ 2
*   **Verification**: วิธีการตรวจสอบว่าปัญหานั้นถูกแก้ไขแล้ว (Test Case)

### D. Prevention (การป้องกันปัญหาระยะยาว)
*   **Lesson Learned**: สิ่งที่เรียนรู้จากปัญหานี้
*   **Policy Update**: ต้องปรับปรุงกฎระเบียบหรือเอกสารคู่มือ (instruction.md) อย่างไรเพื่อไม่ให้เกิดซ้ำ

