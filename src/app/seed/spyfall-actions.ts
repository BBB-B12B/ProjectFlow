"use server";
import { db } from "@/lib/firebase";
import { collection, writeBatch, getDocs, doc } from "firebase/firestore";

export async function seedSpyfallData() {
    const locationsData = [
        {
            name_en: "Airplane", name_th: "เครื่องบิน",
            roles_en: ["First Class Passenger", "Air Marshal", "Mechanic", "Coach Passenger", "Flight Attendant", "Co-Pilot", "Captain", "Economy Class Passenger", "Air Traffic Controller", "Ground Crew"],
            roles_th: ["ผู้โดยสารชั้นหนึ่ง", "ตำรวจอากาศ", "ช่างเครื่อง", "ผู้โดยสารชั้นประหยัด", "พนักงานต้อนรับบนเครื่องบิน", "นักบินผู้ช่วย", "กัปตัน", "ผู้โดยสารชั้นทัศนาจร", "เจ้าหน้าที่ควบคุมจราจรทางอากาศ", "เจ้าหน้าที่ภาคพื้นดิน"]
        },
        {
            name_en: "Bank", name_th: "ธนาคาร",
            roles_en: ["Armored Car Driver", "Manager", "Consultant", "Robber", "Security Guard", "Teller", "Customer", "Loan Officer", "Accountant", "Janitor"],
            roles_th: ["คนขับรถขนเงิน", "ผู้จัดการ", "ที่ปรึกษา", "โจรปล้นธนาคาร", "ยามรักษาความปลอดภัย", "พนักงานรับฝาก-ถอนเงิน", "ลูกค้า", "เจ้าหน้าที่สินเชื่อ", "นักบัญชี", "ภารโรง"]
        },
        {
            name_en: "Beach", name_th: "ชายหาด",
            roles_en: ["Beach Waitress", "Kite Surfer", "Lifeguard", "Thief", "Beach Photographer", "Ice Cream Truck Driver", "Beach Goer", "Volleyball Player", "Sandcastle Builder", "Sunbather"],
            roles_th: ["พนักงานเสิร์ฟชายหาด", "คนเล่นไคท์เซิร์ฟ", "ไลฟ์การ์ด", "ขโมย", "ช่างภาพชายหาด", "คนขับรถไอศกรีม", "คนมาเที่ยวทะเล", "นักวอลเลย์บอล", "คนสร้างปราสาททราย", "คนอาบแดด"]
        },
        {
            name_en: "Casino", name_th: "คาสิโน",
            roles_en: ["Bartender", "Head Security Guard", "Bouncer", "Manager", "High Roller", "Dealer", "Gambler", "Cocktail Waitress", "Pit Boss", "Chip Runner"],
            roles_th: ["บาร์เทนเดอร์", "หัวหน้าฝ่ายรักษาความปลอดภัย", "คนคุมร้าน", "ผู้จัดการ", "นักพนันรายใหญ่", "เจ้ามือ", "นักพนัน", "พนักงานเสิร์ฟค็อกเทล", "ผู้ควบคุมโต๊ะ", "คนวิ่งชิป"]
        },
        {
            name_en: "Hospital", name_th: "โรงพยาบาล",
            roles_en: ["Doctor", "Nurse", "Surgeon", "Patient", "Therapist", "Intern", "Janitor", "Anesthesiologist", "Radiologist", "Pharmacist"],
            roles_th: ["หมอ", "พยาบาล", "ศัลยแพทย์", "คนไข้", "นักบำบัด", "แพทย์ฝึกหัด", "ภารโรง", "วิสัญญีแพทย์", "นักรังสีวิทยา", "เภสัชกร"]
        },
        {
            name_en: "Movie Studio", name_th: "สตูดิโอถ่ายหนัง",
            roles_en: ["Stuntman", "Sound Engineer", "Camera Man", "Director", "Costume Artist", "Producer", "Actor", "Screenwriter", "Makeup Artist", "Gaffer"],
            roles_th: ["สตั๊นท์แมน", "วิศวกรเสียง", "ตากล้อง", "ผู้กำกับ", "ฝ่ายเสื้อผ้า", "โปรดิวเซอร์", "นักแสดง", "คนเขียนบท", "ช่างแต่งหน้า", "ฝ่ายจัดไฟ"]
        },
        {
            name_en: "Space Station", name_th: "สถานีอวกาศ",
            roles_en: ["Engineer", "Alien", "Space Tourist", "Pilot", "Scientist", "Doctor", "Commander", "Botanist", "Astrophysicist", "Communications Officer"],
            roles_th: ["วิศวกร", "เอเลี่ยน", "นักท่องเที่ยวอวกาศ", "นักบิน", "นักวิทยาศาสตร์", "หมอ", "ผู้บัญชาการ", "นักพฤกษศาสตร์", "นักดาราศาสตร์ฟิสิกส์", "เจ้าหน้าที่สื่อสาร"]
        },
        {
            name_en: "Amusement Park", name_th: "สวนสนุก",
            roles_en: ["Ride Operator", "Mascot", "Cashier", "Parent", "Lost Child", "Security Guard", "Janitor", "Food Vendor", "Technician", "Park Manager"],
            roles_th: ["คนคุมเครื่องเล่น", "มาสคอต", "แคชเชียร์", "ผู้ปกครอง", "เด็กหลง", "ยาม", "ภารโรง", "คนขายอาหาร", "ช่างเทคนิค", "ผู้จัดการสวนสนุก"]
        },
        {
            name_en: "Art Museum", name_th: "พิพิธภัณฑ์ศิลปะ",
            roles_en: ["Curator", "Security Guard", "Art Student", "Tourist", "Art Critic", "Restorer", "Patron", "Docent", "Gift Shop Clerk", "Janitor"],
            roles_th: ["ภัณฑารักษ์", "ยาม", "นักเรียนศิลปะ", "นักท่องเที่ยว", "นักวิจารณ์ศิลปะ", "นักบูรณะ", "ผู้อุปถัมภ์", "ผู้บรรยาย", "พนักงานร้านของที่ระลึก", "ภารโรง"]
        },
        {
            name_en: "Carnival", name_th: "งานคาร์นิวัล",
            roles_en: ["Carny", "Magician", "Clown", "Food Vendor", "Visitor", "Ride Operator", "Fortune Teller", "Strongman", "Security", "Ticket Taker"],
            roles_th: ["คนจัดงาน", "นักมายากล", "ตัวตลก", "คนขายอาหาร", "ผู้เข้าชม", "คนคุมเครื่องเล่น", "หมอดู", "ชายจอมพลัง", "ยาม", "คนเก็บตั๋ว"]
        },
        {
            name_en: "Circus Tent", name_th: "เต็นท์ละครสัตว์",
            roles_en: ["Acrobat", "Clown", "Animal Tamer", "Ring Master", "Magician", "Juggler", "Trapeze Artist", "Audience Member", "Food Vendor", "Human Cannonball"],
            roles_th: ["นักกายกรรม", "ตัวตลก", "ผู้ฝึกสัตว์", "ผู้ควบคุมการแสดง", "นักมายากล", "นักโยนของ", "นักกายกรรมห่วง", "ผู้ชม", "คนขายอาหาร", "มนุษย์ปืนใหญ่"]
        },
        {
            name_en: "Corporate Party", name_th: "งานเลี้ยงบริษัท",
            roles_en: ["CEO", "Intern", "Accountant", "Manager", "Marketing Specialist", "Janitor", "DJ", "Bartender", "Uninvited Guest", "HR Representative"],
            roles_th: ["ซีอีโอ", "นักศึกษาฝึกงาน", "นักบัญชี", "ผู้จัดการ", "ฝ่ายการตลาด", "ภารโรง", "ดีเจ", "บาร์เทนเดอร์", "แขกไม่ได้รับเชิญ", "ฝ่ายบุคคล"]
        },
        {
            name_en: "Crusader Army", name_th: "กองทัพครูเสด",
            roles_en: ["Monk", "Knight", "Squire", "Archer", "Siege Engineer", "Scout", "Cook", "Blacksmith", "Captain", "Peasant"],
            roles_th: ["พระ", "อัศวิน", "ผู้ติดตามอัศวิน", "พลธนู", "วิศวกรเครื่องยิง", "หน่วยสอดแนม", "พ่อครัว", "ช่างตีเหล็ก", "กัปตัน", "ชาวบ้าน"]
        },
        {
            name_en: "Day Spa", name_th: "เดย์สปา",
            roles_en: ["Masseuse", "Customer", "Stylist", "Manicurist", "Receptionist", "Aesthetician", "Pool Boy", "Yoga Instructor", "Beautician", "Manager"],
            roles_th: ["หมอนวด", "ลูกค้า", "สไตลิสต์", "ช่างทำเล็บ", "พนักงานต้อนรับ", "ผู้เชี่ยวชาญด้านความงาม", "คนดูแลสระ", "ครูโยคะ", "ช่างเสริมสวย", "ผู้จัดการ"]
        },
        {
            name_en: "Embassy", name_th: "สถานทูต",
            roles_en: ["Ambassador", "Marine", "Secretary", "Diplomat", "Visa Applicant", "Tourist", "Refugee", "Government Official", "Attaché", "Chauffeur"],
            roles_th: ["เอกอัครราชทูต", "นาวิกโยธิน", "เลขานุการ", "นักการทูต", "ผู้ยื่นขอวีซ่า", "นักท่องเที่ยว", "ผู้ลี้ภัย", "เจ้าหน้าที่รัฐบาล", "ผู้ช่วยทูต", "คนขับรถ"]
        },
        {
            name_en: "Hotel", name_th: "โรงแรม",
            roles_en: ["Doorman", "Guest", "Manager", "Housekeeper", "Bartender", "Bellhop", "Concierge", "Valet", "Chef", "Security Guard"],
            roles_th: ["พนักงานเปิดประตู", "แขก", "ผู้จัดการ", "แม่บ้าน", "บาร์เทนเดอร์", "พนักงานยกกระเป๋า", "เจ้าหน้าที่อำนวยความสะดวก", "พนักงานรับรถ", "เชฟ", "ยาม"]
        },
        {
            name_en: "Library", name_th: "ห้องสมุด",
            roles_en: ["Librarian", "Student", "Bookworm", "Researcher", "Noisy Person", "Security Guard", "Archivist", "Janitor", "Child", "Old Person"],
            roles_th: ["บรรณารักษ์", "นักเรียน", "หนอนหนังสือ", "นักวิจัย", "คนเสียงดัง", "ยาม", "นักเก็บเอกสาร", "ภารโรง", "เด็ก", "คนแก่"]
        },
        {
            name_en: "Military Base", name_th: "ฐานทัพ",
            roles_en: ["Drill Sergeant", "Soldier", "Mechanic", "Cook", "Medic", "Officer", "Sniper", "Pilot", "Intelligence Officer", "Janitor"],
            roles_th: ["ครูฝึก", "ทหาร", "ช่างเครื่อง", "พ่อครัว", "หมอทหาร", "นายทหาร", "พลซุ่มยิง", "นักบิน", "เจ้าหน้าที่ข่าวกรอง", "ภารโรง"]
        },
        {
            name_en: "Pirate Ship", name_th: "เรือโจรสลัด",
            roles_en: ["Captain", "First Mate", "Cook", "Cabin Boy", "Prisoner", "Lookout", "Gunner", "Navigator", "Quartermaster", "Swabbie"],
            roles_th: ["กัปตัน", "ต้นหน", "พ่อครัว", "เด็กรับใช้", "นักโทษ", "คนดูต้นทาง", "พลปืน", "ผู้นำทาง", "นายท้าย", "ลูกเรือ"]
        },
        {
            name_en: "Polar Station", name_th: "สถานีขั้วโลก",
            roles_en: ["Scientist", "Meteorologist", "Geologist", "Explorer", "Cook", "Doctor", "Expedition Leader", "Technician", "Biologist", "Dog Sledder"],
            roles_th: ["นักวิทยาศาสตร์", "นักอุตุนยมวิทยา", "นักธรณีวิทยา", "นักสำรวจ", "พ่อครัว", "หมอ", "หัวหน้าคณะสำรวจ", "ช่างเทคนิค", "นักชีววิทยา", "คนลากเลื่อนสุนัข"]
        },
        {
            name_en: "Police Station", name_th: "สถานีตำรวจ",
            roles_en: ["Detective", "Police Chief", "Patrol Officer", "Criminal", "Witness", "Lawyer", "Dispatcher", "Forensic Scientist", "Janitor", "Journalist"],
            roles_th: ["นักสืบ", "ผู้กำกับ", "สายตรวจ", "อาชญากร", "พยาน", "ทนาย", "พนักงานวิทยุ", "นักนิติวิทยาศาสตร์", "ภารโรง", "นักข่าว"]
        },
        {
            name_en: "Restaurant", name_th: "ร้านอาหาร",
            roles_en: ["Chef", "Waiter", "Customer", "Busboy", "Host", "Food Critic", "Dishwasher", "Sommelier", "Bartender", "Manager"],
            roles_th: ["เชฟ", "บริกร", "ลูกค้า", "พนักงานเก็บโต๊ะ", "พนักงานต้อนรับ", "นักวิจารณ์อาหาร", "คนล้างจาน", "ซอมเมอลิเยร์", "บาร์เทนเดอร์", "ผู้จัดการ"]
        },
        {
            name_en: "School", name_th: "โรงเรียน",
            roles_en: ["Principal", "Teacher", "Student", "Janitor", "Cafeteria Worker", "Gym Teacher", "Librarian", "Counselor", "School Nurse", "Coach"],
            roles_th: ["ครูใหญ่", "ครู", "นักเรียน", "ภารโรง", "พนักงานโรงอาหาร", "ครูพละ", "บรรณารักษ์", "ครูแนะแนว", "พยาบาลโรงเรียน", "โค้ช"]
        },
        {
            name_en: "Service Station", name_th: "สถานีบริการ",
            roles_en: ["Mechanic", "Cashier", "Customer", "Manager", "Tire Specialist", "Tow Truck Driver", "Snack Vendor", "Biker", "Teenager", "Traveler"],
            roles_th: ["ช่างยนต์", "แคชเชียร์", "ลูกค้า", "ผู้จัดการ", "ช่างเปลี่ยนยาง", "คนขับรถลาก", "คนขายขนม", "คนขี่มอเตอร์ไซค์", "วัยรุ่น", "นักเดินทาง"]
        },
        {
            name_en: "Subway", name_th: "รถไฟใต้ดิน",
            roles_en: ["Commuter", "Tourist", "Subway Operator", "Police Officer", "Musician", "Lost Child", "Ticket Inspector", "Cleaner", "Pickpocket", "Student"],
            roles_th: ["ผู้โดยสาร", "นักท่องเที่ยว", "คนขับรถไฟ", "ตำรวจ", "นักดนตรี", "เด็กหลง", "พนักงานตรวจตั๋ว", "พนักงานทำความสะอาด", "นักล้วงกระเป๋า", "นักเรียน"]
        },
        {
            name_en: "Supermarket", name_th: "ซูเปอร์มาร์เก็ต",
            roles_en: ["Cashier", "Stocker", "Butcher", "Customer", "Janitor", "Manager", "Bagger", "Deli Worker", "Security Guard", "Parent with Child"],
            roles_th: ["แคชเชียร์", "พนักงานเติมของ", "คนขายเนื้อ", "ลูกค้า", "ภารโรง", "ผู้จัดการ", "พนักงานจัดของใส่ถุง", "พนักงานแผนกเดลี่", "ยาม", "ผู้ปกครองกับเด็ก"]
        },
        {
            name_en: "Theater", name_th: "โรงละคร",
            roles_en: ["Actor", "Director", "Audience Member", "Stagehand", "Usher", "Ticket Taker", "Critic", "Sound Engineer", "Lighting Technician", "Conductor"],
            roles_th: ["นักแสดง", "ผู้กำกับ", "ผู้ชม", "ทีมงานเวที", "พนักงานเดินบัตร", "คนตรวจตั๋ว", "นักวิจารณ์", "วิศวกรเสียง", "ช่างไฟ", "วาทยกร"]
        },
        {
            name_en: "University", name_th: "มหาวิทยาลัย",
            roles_en: ["Professor", "Student", "Dean", "Janitor", "Librarian", "Teaching Assistant", "Researcher", "Cafeteria Worker", "Admissions Officer", "Frat Brother"],
            roles_th: ["ศาสตราจารย์", "นักศึกษา", "คณบดี", "ภารโรง", "บรรณารักษ์", "ผู้ช่วยสอน", "นักวิจัย", "พนักงานโรงอาหาร", "เจ้าหน้าที่รับสมัคร", "สมาชิกชมรม"]
        },
        {
            name_en: "Vineyard", name_th: "ไร่องุ่น",
            roles_en: ["Winemaker", "Grape Picker", "Wine Taster", "Tourist", "Sommelier", "Exporter", "Farmer", "Chef", "Owner", "Restaurant Critic"],
            roles_th: ["คนทำไวน์", "คนเก็บองุ่น", "นักชิมไวน์", "นักท่องเที่ยว", "ซอมเมอลิเยร์", "ผู้ส่งออก", "ชาวไร่", "เชฟ", "เจ้าของ", "นักวิจารณ์ร้านอาหาร"]
        },
        {
            name_en: "Zoo", name_th: "สวนสัตว์",
            roles_en: ["Zookeeper", "Visitor", "Veterinarian", "Cashier", "Janitor", "Animal", "Photographer", "Food Vendor", "Security Guard", "Tour Guide"],
            roles_th: ["ผู้ดูแลสัตว์", "ผู้เข้าชม", "สัตวแพทย์", "แคชเชียร์", "ภารโรง", "สัตว์", "ช่างภาพ", "คนขายอาหาร", "ยาม", "ไกด์นำเที่ยว"]
        }
    ];

    try {
        const locationsCol = collection(db, 'spyfall_locations');
        
        const snapshot = await getDocs(locationsCol);
        if (!snapshot.empty) {
            console.log('Spyfall data already exists. Aborting seed.');
            return { success: false, message: 'Spyfall data already exists.' };
        }

        const batch = writeBatch(db);
        locationsData.forEach(location => {
            const docRef = doc(collection(db, 'spyfall_locations'));
            batch.set(docRef, location);
        });

        await batch.commit();
        console.log('Spyfall data with translations seeded successfully!');
        return { success: true, message: 'Spyfall data seeded successfully!' };
    } catch (error) {
        console.error("Error seeding Spyfall data:", error);
        return { success: false, message: 'Error seeding Spyfall data.' };
    }
}
