import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
// import { getAuth, Auth } from "firebase/auth"; // [T-152] Commented out unused Auth

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
// let auth!: Auth; // [T-152] Commented out unused Auth

// Check if firebaseConfig has necessary values, especially projectId
if (!firebaseConfig.projectId) {
  console.error("Firebase: Environment variables (e.g., NEXT_PUBLIC_FIREBASE_PROJECT_ID) are not properly set.");
}

// Initialize Firebase (Works on Client & Server)
// Polyfill navigator for Server Actions (Node.js) to prevent Firebase SDK errors
if (typeof window === 'undefined' && typeof navigator === 'undefined') {
  // @ts-ignore
  global.navigator = { userAgent: 'node' };
}

if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    console.log("Firebase: App initialized.");
  } catch (e) {
    console.error("Firebase: Error initializing app:", e);
  }
} else {
  app = getApp();
}

if (app) {
  try {
    db = getFirestore(app);
  } catch (e) {
    console.error("Firebase: Error initializing Firestore:", e);
  }
}

// export { app, db, auth };
export { app, db }; // [T-152] Export only app and db
