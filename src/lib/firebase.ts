import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  "projectId": "project-pulse-17wzf",
  "appId": "1:906680989803:web:a2fc77dd9c0806ece6592e",
  "storageBucket": "project-pulse-17wzf.firebasestorage.app",
  "apiKey": "AIzaSyC9UTcTKTzX0mesZg6HG4Mr0ELWFXtnbr0",
  "authDomain": "project-pulse-17wzf.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "906680989803"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
