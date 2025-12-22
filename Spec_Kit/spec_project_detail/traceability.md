# ตารางตรวจสอบความครบถ้วนของความต้องการ (Requirement Traceability Matrix - RTM)

| รหัสฟีเจอร์ [Feature ID] | ชื่อฟีเจอร์ (Spec Feature Name) | งานที่เกี่ยวข้อง [Tasks] | ไฟล์โค้ดหลัก (Key Code Files) | สถานะ (Status) |
| :--- | :--- | :--- | :--- | :--- |
| **[F-001]** | การยืนยันตัวตน (User Authentication) | [T-003] | `src/lib/firebase.ts`, `Firestore: customers` | **Active** |
| **[F-002]** | การจัดการโปรเจกต์ (Project Management) | [T-010], [T-011], [T-066] | `src/app/projects/page.tsx`, `src/lib/types.ts` (Project) | **Beta** |
| **[F-003]** | การจัดการงาน (Task Management) | [T-013], [T-014], [T-061], [T-063] | `src/app/project/[id]/page.tsx`, `src/components/charts/*`, `src/components/strict-mode-droppable.tsx` | **Beta** |
| **[F-004]** | การติดตามเวลา (Time Tracking) | [T-031], [T-064], [T-065] | `src/lib/types.ts`, `src/app/tracking/tracking-client.tsx` | **Beta** |
| **[F-005]** | มุมมองปฏิทิน (Calendar View) | [T-020], [T-021], [T-064], [T-066] | `src/app/calendar/page.tsx`, `src/app/calendar/calendar-client-page.tsx` | **Active** |
| **[F-006]** | โหมดปาร์ตี้ (Party Mode: Presence & Spyfall)| [T-030] | `src/app/party/*`, `Firestore: spyfall_*` | **Planned** |
| **[F-007]** | ผู้ช่วย AI (AI Assistant) | [T-040] | `src/ai/dev.ts` | **Planned** |
| **[F-008]** | ระบบบริหารความสัมพันธ์ลูกค้า (CRM) & 360 View | [T-025], [T-026], [T-027], [T-066] | `src/app/customers/*` (`page.tsx`, `customer-list-client.tsx`, `customer-detail-client.tsx`), `src/lib/types.ts` (Customer, Rating) | **Beta** |
| **[F-009]** | การปรับปรุงประสิทธิภาพและลดค่าใช้จ่าย (Performance Optimization) | [T-070], [T-071], [T-072], [T-073] | `src/app/customers/customer-list-client.tsx`, `src/app/calendar/calendar-client-page.tsx`, `src/lib/firebase.ts` | **Planned** |
