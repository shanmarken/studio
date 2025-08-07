import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: 'project-pulse-17wzf',
  appId: '1:906680989803:web:a2fc77dd9c0806ece6592e',
  storageBucket: 'project-pulse-17wzf.firebasestorage.app',
  apiKey: 'YOUR_API_KEY',
  authDomain: 'project-pulse-17wzf.firebaseapp.com',
  messagingSenderId: '906680989803',
  measurementId: 'YOUR_MEASUREMENT_ID',
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
