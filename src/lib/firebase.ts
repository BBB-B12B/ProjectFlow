import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

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
let auth!: Auth;

// Check if firebaseConfig has necessary values, especially projectId
if (!firebaseConfig.projectId) {
  console.error("Firebase: Environment variables (e.g., NEXT_PUBLIC_FIREBASE_PROJECT_ID) are not properly set.");
}

// Ensure we are in the browser before initializing the FULL SDK (incompatible with Edge)
if (typeof window !== 'undefined') {
  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
      console.log("Firebase: New app initialized (client-side).");
    } catch (e) {
      console.error("Firebase: Error initializing new Firebase app (client-side):", e);
    }
  } else {
    app = getApp();
    console.log("Firebase: Using existing Firebase app (client-side).");
  }

  if (app) {
    db = getFirestore(app);
    auth = getAuth(app);
    console.log("Firebase: Firestore and Auth instances obtained (client-side).");
  } else {
    console.error("Firebase: Firebase app is undefined, cannot get instances.");
  }
} else {
  console.log("Firebase: Skipping Full SDK initialization on Server/Edge.");
}

export { app, db, auth };
