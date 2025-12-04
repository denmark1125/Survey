import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// 您的 Firebase 設定檔
const firebaseConfig = {
  apiKey: "AIzaSyCO3-WI-gD72w81WbK8yCUgkLH7-vHj5BE",
  authDomain: "survey-for-dorm.firebaseapp.com",
  projectId: "survey-for-dorm",
  storageBucket: "survey-for-dorm.firebasestorage.app",
  messagingSenderId: "265334968846",
  appId: "1:265334968846:web:9a8343cacfc62a1e81225f",
  measurementId: "G-Z85BDDK33M"
};

// Initialize Firebase
let db: Firestore;

try {
  const app = initializeApp(firebaseConfig);
  // Analytics removed to prevent "Component analytics has not been registered" error
  db = getFirestore(app);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization failed:", error);
  // We explicitly throw or handle it so the app knows DB is down, 
  // but to prevent white screen we allow code execution to continue, 
  // though db operations will likely fail later.
}

export { db };