import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, getReactNativePersistence, initializeAuth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getFunctions } from "firebase/functions"; // <--- Required for AI
import { Platform } from "react-native";

// Access environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// 1. Initialize Firebase App (Singleton Pattern)
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// 2. Initialize Auth
let auth;
if (Platform.OS === "web") {
  auth = getAuth(app);
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

// 3. Initialize Firestore (Safe Mode)
let db;
const cacheOptions =
  Platform.OS === "web"
    ? { tabManager: persistentMultipleTabManager(), storage: AsyncStorage }
    : { storage: AsyncStorage };

try {
  // Try to initialize with custom cache settings
  db = initializeFirestore(app, {
    localCache: persistentLocalCache(cacheOptions),
  });
} catch (e) {
  // If already initialized (e.g. during reload), just use the existing instance
  db = getFirestore(app);
}

// 4. Initialize Functions (For AI Features)
const functions = getFunctions(app);

export { auth, db, functions };
