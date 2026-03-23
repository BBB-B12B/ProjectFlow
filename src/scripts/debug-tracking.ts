import { db } from '../lib/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';

async function main() {
    const trackingRef = collection(db, 'projectTrackingProgress');
    const trackingSnapshot = await getDocs(query(trackingRef, limit(10)));

    console.log('--- TRACKING DATA SAMPLE ---');
    trackingSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`ID: ${doc.id}`);
        console.log(`Date: ${data.date} (Type: ${typeof data.date})`);
        console.log(`Progress: ${data.progressPercentage} (Type: ${typeof data.progressPercentage})`);
        console.log(`TaskID: ${data.taskId}`);
        console.log(`Tracker: ${data.trackerName}`);
        console.log('----------------------------');
    });
    process.exit(0);
}

main().catch(console.error);
