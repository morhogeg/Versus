import "server-only";
import type { Firestore } from "firebase-admin/firestore";

// Lazily initialize firebase-admin ONLY when service-account credentials are present.
// With no credentials, getDb() returns null and callers fall back to an in-memory
// store, so the app runs with zero env config (see CLAUDE.md / PRD §4.1 note).

let initialized = false;
let db: Firestore | null = null;

function init(): Firestore | null {
  if (initialized) return db;
  initialized = true;

  const inlineSa = process.env.FIREBASE_SERVICE_ACCOUNT;
  const appDefault = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!inlineSa && !appDefault) {
    db = null;
    return db;
  }

  try {
    // Required lazily so the dependency never loads on the in-memory path.
    const {
      getApps,
      initializeApp,
      cert,
      applicationDefault,
    } = require("firebase-admin/app");
    const { getFirestore } = require("firebase-admin/firestore");

    if (!getApps().length) {
      if (inlineSa) {
        initializeApp({ credential: cert(JSON.parse(inlineSa)) });
      } else {
        initializeApp({ credential: applicationDefault() });
      }
    }
    db = getFirestore();
  } catch (err) {
    console.error("firebase-admin init failed; using in-memory store:", err);
    db = null;
  }
  return db;
}

export function getDb(): Firestore | null {
  return init();
}

export function firestoreEnabled(): boolean {
  return getDb() !== null;
}
