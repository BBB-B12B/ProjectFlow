# ProjectManagement System

ระบบบริหารจัดการโปรเจกต์ที่ผสานพลัง AI (Genkit) เพื่อช่วยในการติดตามงานและบริหารเวลา

## 📚 Documentation
เอกสารรายละเอียดโปรเจกต์ทั้งหมดถูกเก็บไว้ในโฟลเดอร์ `Spec_Kit/spec_project_detail/`:
- [Functional Spec (Feature ต่างๆ)](Spec_Kit/spec_project_detail/spec.md)
- [Instruction (Tech Stack & Structure)](Spec_Kit/spec_project_detail/instruction.md)
- [Task Roadmap (แผนงาน)](Spec_Kit/spec_project_detail/task.md)
- [Traceability Matrix](Spec_Kit/spec_project_detail/traceability.md)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Firebase CLI

### Installation
```bash
npm install
```

## 🛠 Development & Testing

เพื่อความสะดวกในการทดสอบระบบ เราได้เตรียม Script สำหรับรันทั้ง **Frontend (Next.js)** และ **Backend AI (Genkit)** พร้อมกันไว้ให้แล้ว

### วิธีใช้งาน
รันคำสั่งเดียวผ่าน Terminal:

```bash
./develop.sh
```

### ระบบจะเริ่มทำงานที่:
- **Frontend App**: [http://localhost:9003](http://localhost:9003)
- **AI Genkit UI**: [http://localhost:4000](http://localhost:4000)

> **Note**: กด `Ctrl+C` เพื่อหยุดการทำงาน (Script จะทำการเคลียร์ Process ให้โดยอัตโนมัติ ไม่ต้องกลัว Zombie Process)
