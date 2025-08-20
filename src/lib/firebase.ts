// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDUKlPIoG2G0j3HNZV7qbTrRYSX9a-vILM",
  authDomain: "project-management-app-88bdc.firebaseapp.com",
  projectId: "project-management-app-88bdc",
  storageBucket: "project-management-app-88bdc.firebasestorage.app",
  messagingSenderId: "319066320801",
  appId: "1:319066320801:web:21d9d776a6d2ad351ae5e0",
  measurementId: "G-9GJJ64KDGD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
