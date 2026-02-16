
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import * as dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function inspectData() {
    console.log("--- Inspecting Groups ---");
    const groupsRef = collection(db, 'assignee_groups');
    const groupsSnap = await getDocs(groupsRef);
    const groups: any[] = [];
    groupsSnap.forEach(doc => {
        const data = doc.data();
        console.log(`Group: '${data.name}' | Members: ${JSON.stringify(data.members)}`);
        groups.push(data);
    });

    console.log("\n--- Inspecting Tasks ---");
    const tasksRef = collection(db, 'tasks');
    const tasksSnap = await getDocs(tasksRef);
    let matchCount = 0;

    tasksSnap.forEach(doc => {
        const data = doc.data();
        const assignee = data.Assignee;

        // Check if task is assigned to a group found above
        const groupNames = groups.map(g => g.name);
        if (groupNames.includes(assignee) || groups.some(g => assignee?.includes(g.name))) {
            console.log(`Task '${data.TaskName}' is assigned to: '${assignee}'`);
            matchCount++;
        }
    });

    if (matchCount === 0) {
        console.log("No tasks found assigned to any group names.");
        console.log("Dumping first 5 tasks to check Assignee format:");
        let i = 0;
        tasksSnap.forEach(doc => {
            if (i < 5) {
                console.log(`Task: ${doc.data().TaskName}, Assignee: ${doc.data().Assignee}`);
                i++;
            }
        });
    }
}

inspectData();
