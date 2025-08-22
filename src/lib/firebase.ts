import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Hardcoded Firebase configuration to ensure connection
const firebaseConfig = {
  apiKey: "AIzaSyDUKlPIoG2G0j3HNZV7qbTrRYSX9a-vILM",
  authDomain: "project-management-app-88bdc.firebaseapp.com",
  projectId: "project-management-app-88bdc",
  storageBucket: "project-management-app-88bdc.firebasestorage.app",
  messagingSenderId: "319066320801",
  appId: "1:319066320801:web:21d9d776a6d2ad351ae5e0",
  measurementId: "G-9GJJ64KDGD"
};

// Initialize Firebase using a singleton pattern
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp(); // if already initialized, use that one
}

const db = getFirestore(app);

export { app, db };
