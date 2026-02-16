# System Cost Analysis (5 Users)

เอกสารฉบับนี้วิเคราะห์ค่าใช้จ่ายรายเดือนสำหรับการรันระบบ Project Management บน Architecture ปัจจุบัน (Cloudflare Pages + Firebase) สำหรับผู้ใช้งาน 5 คน

## สรุปภาพรวม (Executive Summary)
**ค่าใช้จ่ายโดยประมาณ: 0 บาท/เดือน (Free Tier)**
ระบบทั้งหมดสามารถทำงานได้บนโควต้าฟรี (Free Tier) ของทั้ง Firebase และ Cloudflare อย่างสบายๆ สำหรับทีมขนาด 5 คนครับ

---

## 1. Cloudflare Pages (Hosting & Frontend)
**Plan: Free**

| รายการ | โควต้าฟรี (Free Tier) | การใช้งานประเมิน (5 คน) | สถานะ |
| :--- | :--- | :--- | :--- |
| **Sites** | ไม่จำกัด | 1 Site | ✅ ฟรี |
| **Requests** | ไม่จำกัด (Unlimited static requests) | ~10k - 50k requests/เดือน | ✅ ฟรี |
| **Bandwidth** | ไม่จำกัด (Unmetered) | ต่ำมาก (Text/Small Images) | ✅ ฟรี |
| **Builds** | 500 ครั้ง/เดือน | ~50-100 ครั้ง (ถ้า Deploy บ่อยความถี่วันละ 2-3 ครั้ง) | ✅ ฟรี |

**วิเคราะห์**: สำหรับ Static Hosting หรือ SPA แบบนี้ Cloudflare ใจดีมากครับ โอกาสเกินโควต้ายากมาก

---

## 2. Firebase (Database & Auth)
**Plan: Spark (Free)**

| รายการ | โควต้าฟรี (Free Tier) | การใช้งานประเมิน (5 คน) | สถานะ |
| :--- | :--- | :--- | :--- |
| **Firestore Reads** | 50,000 ครั้ง/**วัน** | ~2,000 - 5,000 ครั้ง/วัน | ✅ ฟรี |
| **Firestore Writes** | 20,000 ครั้ง/**วัน** | ~100 - 500 ครั้ง/วัน | ✅ ฟรี |
| **Firestore Deletes** | 20,000 ครั้ง/**วัน** | ต่ำมาก | ✅ ฟรี |
| **Database Size** | 1 GiB | < 0.1 GiB (Text Data) | ✅ ฟรี |
| **Authentication** | 50,000 MAU (Active Users/เดือน) | 5 คน | ✅ ฟรี |
| **Network Egress** | 10 GB/เดือน | < 0.5 GB | ✅ ฟรี |

**การประเมินการใช้งาน (Scenario 5 คน):**
*   **Reads**: หาก 1 คน เปิดหน้า web 50 ครั้ง/วัน, แต่ละครั้งโหลด 20 projects = 1,000 reads/วัน/คน. Total = 5,000 reads/วัน (คิดแบบแย่ที่สุด) -> ยังเหลือโควต้าอีก 90%
*   **Storage (1 GiB)**: เนื่องจากข้อมูลเป็น Text (Project info, Task info) ขนาดเล็กมาก เก็บเป็นล้าน records ถึงจะเต็ม 1 GiB ครับ

---

## 3. ความเสี่ยงและข้อควรระวัง (Risks & Considerations)

### A. อัตราการเติบโต (Scalability)
*   หากทีมขยายเป็น **50-100 คน** อาจเริ่มแตะเพดาน Firestore Reads (50k/วัน) ได้ หากไม่ได้ทำ Caching ที่ดี
*   **ทางแก้**: เราได้ทำ Caching (LocalStorage) ในส่วน Analytics ไว้บ้างแล้ว ช่วยลด Reads ได้เยอะครับ

### B. ไฟล์แนบ (Attachments)
*   **ปัจจุบัน**: ระบบยังไม่มีฟีเจอร์อัปโหลดไฟล์หนักๆ (รูปภาพ/เอกสาร) ลง Storage โดยตรง
*   **อนาคต**: หากมีการเก็บไฟล์ Cloud Storage for Firebase ให้ฟรี 5 GB ครับ ซึ่งพอสำหรับเอกสารทั่วไป แต่ถ้ารูปเยอะๆ อาจต้องดูเรื่อง Bandwidth

### C. พลาดพลั้งทางเทคนิค (Infinite Loops)
*   **ความเสี่ยง**: หากเขียน Code ผิด เช่น `useEffect` วนลูปอ่านข้อมูลซ้ำๆ ไม่หยุด (Infinite Read Loop) อาจทำให้โควต้า Reads หมดภายในไม่กี่นาที
*   **ผลกระทบใน Plan Free**: ฐานข้อมูลจะถูกระงับชั่วคราว (Quota Exceeded) จนกว่าจะถึงวันใหม่ = **ไม่เสียเงิน แต่ระบบหยุดทำงาน**
*   **ผลกระทบใน Plan Blaze (เสียเงิน)**: ระบบทำงานต่อ แต่ **บิลค่าใช้จ่ายจะพุ่งสูง**

## ข้อสรุป (Recommendation)
สำหรับทีม 5 คน **ไม่มีค่าใช้จ่ายครับ (0 บาท)**

แนะนำให้ใช้ **Spark Plan (Free)** ต่อไปครับ ไม่จำเป็นต้องผูกบัตรเครดิตอัปเกรดเป็น Blaze Plan ยกเว้นว่าจะต้องการใช้ฟีเจอร์เฉพาะเช่น Cloud Functions หรือ พื้นที่เก็บข้อมูลมหาศาลจริงๆ ครับ
