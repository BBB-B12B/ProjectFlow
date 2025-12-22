import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app!: FirebaseApp;
let db!: Firestore;

// Check if firebaseConfig has necessary values, especially projectId
if (!firebaseConfig.projectId) {
  console.error("Firebase: Environment variables (e.g., NEXT_PUBLIC_FIREBASE_PROJECT_ID) are not properly set.");
  // It's crucial to handle this, as initializeApp will fail without it.
  // For now, we proceed but expect a failure later if not set.
}

if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    console.log("Firebase: New app initialized (server-side).");
  } catch (e) {
    console.error("Firebase: Error initializing new Firebase app (server-side):", e);
  }
} else {
  app = getApp();
  console.log("Firebase: Using existing Firebase app (server-side).");
}

if (app) {
  db = getFirestore(app);
  console.log("Firebase: Firestore instance obtained (server-side).");
} else {
  console.error("Firebase: Firebase app is undefined, cannot get Firestore instance.");
}

export { app, db };
