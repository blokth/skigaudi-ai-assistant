import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
} from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
} from "firebase/firestore";
import {
  getFunctions,
  connectFunctionsEmulator,
} from "firebase/functions";
import {
  getStorage,
  connectStorageEmulator,
} from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, "us-central1");
export const storage = getStorage(app);

// Use emulator when requested
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true") {
  const fnPort = Number(process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_EMULATOR_PORT || 5003);
  const fsPort = Number(process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_PORT || 8080);
  const authPort = Number(process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT || 9099);

  connectFunctionsEmulator(functions, "localhost", fnPort);
  const stPort = Number(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_PORT || 9199);
  connectStorageEmulator(storage, "localhost", stPort);
  // Vector search requires production Firestore; keep reads/writes there.
  connectFirestoreEmulator(db, "localhost", fsPort);
  // Keep Auth on production when Firestore is on production.
  // Using the Auth emulator here would send invalid tokens to production
  // Firestore and trigger “Missing or insufficient permissions”.
  connectAuthEmulator(auth, `http://localhost:${authPort}`, { disableWarnings: true });
}
