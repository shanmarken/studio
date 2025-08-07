import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC9UTcTKTzX0mesZg6HG4Mr0ELWFXtnbr0",
  authDomain: "project-pulse-17wzf.firebaseapp.com",
  projectId: "project-pulse-17wzf",
  storageBucket: "project-pulse-17wzf.firebasestorage.app",
  messagingSenderId: "906680989803",
  appId: "1:906680989803:web:a2fc77dd9c0806ece6592e"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
