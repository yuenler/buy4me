// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAeqLRBsy-Rs0E8Wkibp1gapX_S7zeu0Ls",
  authDomain: "buy4me-54652.firebaseapp.com",
  projectId: "buy4me-54652",
  storageBucket: "buy4me-54652.appspot.com", // Corrected storage bucket URL
  messagingSenderId: "668200147488",
  appId: "1:668200147488:web:c8392aec57c8cfbf27fa45",
  measurementId: "G-L2JZH3L9JH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services and the app instance
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export { app }; // ✅ Export app instance
