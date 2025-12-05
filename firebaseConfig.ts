import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// 您的 Firebase 設定檔
const firebaseConfig = {
  apiKey: "AIzaSyACoDpGMa8ZeziqampkfqOxFGdY3yqxcCQ",
  authDomain: "carldormy.firebaseapp.com",
  projectId: "carldormy",
  storageBucket: "carldormy.firebasestorage.app",
  messagingSenderId: "1027316600374",
  appId: "1:1027316600374:web:3a42f41a5b4b135545d297"
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