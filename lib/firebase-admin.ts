import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

// Load local Firebase Applet config for development fallbacks
let firebaseConfig: any = {};
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  }
} catch (err) {
  console.warn("Failed to load firebase-applet-config.json fallback configs:", err);
}

const projectId = process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

let initializedApp: admin.app.App | null = null;
let initError: any = null;

function getApp(): admin.app.App {
  if (initializedApp) return initializedApp;
  if (initError) throw initError;

  try {
    if (admin.apps.length > 0) {
      initializedApp = admin.apps[0]!;
      return initializedApp;
    }

    if (privateKey && clientEmail) {
      initializedApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
      });
      console.log("Firebase Admin initialized with custom Service Account credentials.");
    } else if (projectId) {
      // Application Default Credentials or standard local CLI configuration
      initializedApp = admin.initializeApp({
        projectId,
      });
      console.log(`Firebase Admin initialized via credentials for project: ${projectId}`);
    } else {
      throw new Error("FIREBASE_PROJECT_ID or projectId is required but not provided.");
    }
    return initializedApp;
  } catch (err) {
    initError = err;
    console.error("Firebase Admin initialization failed lazily:", err);
    throw err;
  }
}

// Select database: support custom firestoreDatabaseId if configured
const databaseId = process.env.FIREBASE_DATABASE_ID || firebaseConfig.firestoreDatabaseId;

let firestoreInstance: any = null;
function getFirestoreInstance() {
  if (!firestoreInstance) {
    const app = getApp();
    firestoreInstance = getFirestore(
      app,
      databaseId && databaseId !== "(default)" ? databaseId : undefined
    );
  }
  return firestoreInstance;
}

let authInstance: any = null;
function getAuthInstance() {
  if (!authInstance) {
    const app = getApp();
    authInstance = app.auth();
  }
  return authInstance;
}

// Create clean, robust Proxies to avoid top-level module load time failures
export const adminDb = new Proxy({} as any, {
  get(target, prop, receiver) {
    const instance = getFirestoreInstance();
    const value = Reflect.get(instance, prop);
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
  set(target, prop, value, receiver) {
    const instance = getFirestoreInstance();
    return Reflect.set(instance, prop, value);
  }
});

export const adminAuth = new Proxy({} as any, {
  get(target, prop, receiver) {
    const instance = getAuthInstance();
    const value = Reflect.get(instance, prop);
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
  set(target, prop, value, receiver) {
    const instance = getAuthInstance();
    return Reflect.set(instance, prop, value);
  }
});

export { admin };
