import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { firebaseConfig } from './firebaseConfig';

// Khởi tạo Firebase App duy nhất
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Khởi tạo Auth và Realtime Database
export const auth = getAuth(app);
export const database = getDatabase(app);

export default app;

