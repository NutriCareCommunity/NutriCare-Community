import * as adminNamespace from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

// Resolve actual admin object supporting both ES modules default and namespace exports
const adminInstance: any = (adminNamespace as any).default || adminNamespace;

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
const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

// Safe, extensive formatting of the private key to handle any escaping/wrapping from environment variables
const getFormattedPrivateKey = (key: string | undefined): string | undefined => {
  if (!key) return undefined;
  let formatted = key.trim();
  
  // Strip outer quotes if the environment wrapper preserved them
  if (formatted.startsWith('"') && formatted.endsWith('"')) {
    formatted = formatted.slice(1, -1).trim();
  }
  if (formatted.startsWith("'") && formatted.endsWith("'")) {
    formatted = formatted.slice(1, -1).trim();
  }
  
  // Unescape both double-escaped and single-escaped newlines to true carriage returns
  formatted = formatted.replace(/\\n/g, "\n");
  formatted = formatted.replace(/\\r/g, "\r");
  
  return formatted;
};

const privateKey = getFormattedPrivateKey(rawPrivateKey);

let initializedApp: adminNamespace.app.App | null = null;
let initError: any = null;

function getApp(): adminNamespace.app.App {
  if (initializedApp) return initializedApp;
  if (initError) throw initError;

  try {
    const apps = adminInstance.apps;
    if (apps && apps.length > 0) {
      initializedApp = apps[0]!;
      return initializedApp;
    }

    if (privateKey && clientEmail) {
      initializedApp = adminInstance.initializeApp({
        credential: adminInstance.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log("Firebase Admin initialized with custom Service Account credentials.");
    } else if (projectId) {
      // Application Default Credentials or standard local CLI configuration
      initializedApp = adminInstance.initializeApp({
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

export { adminInstance as admin };
