import admin from "firebase-admin";
import { getApps } from "firebase-admin/app";
import "dotenv/config";
const serviceAccountJson = process.env.FIREBASE_ADMIN_SDK_JSON;
if (!serviceAccountJson) {
  console.error("!!! FATAL ERROR: FIREBASE_ADMIN_SDK_JSON environment variable is not set! !!!");
  console.error("Ensure you have a .env file with the variable set in development,");
  console.error("or that the environment variable is configured in your deployment environment.");
  throw new Error("Firebase Admin SDK configuration is missing.");
}
let serviceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountJson);
} catch (e) {
  console.error("!!! Failed to parse FIREBASE_ADMIN_SDK_JSON environment variable content !!!", e);
  console.error("Verify the JSON content in your .env file or environment variable configuration.");
  throw new Error("Firebase Admin SDK service account key could not be parsed.");
}
if (!getApps().length) {
  try {
    admin.initializeApp({
      // Use the parsed service account object
      credential: admin.credential.cert(serviceAccount)
      // Optional: Add databaseURL or storageBucket if needed for other services
      // databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
      // storageBucket: `${serviceAccount.project_id}.appspot.com`,
    });
    console.log("[Firebase Admin] SDK Initialized successfully (using environment variable).");
  } catch (e) {
    console.error("!!! Firebase Admin SDK Initialization Failed !!!", e);
    throw new Error("Firebase Admin SDK could not be initialized.");
  }
} else {
  console.log("[Firebase Admin] SDK already initialized.");
}
const adminAuthInstance = admin.auth();
const adminDbInstance = admin.firestore();
console.log("[Firebase Admin] Auth and Firestore instances obtained.");
const adminAuth = adminAuthInstance;
const adminDb = adminDbInstance;
export {
  adminAuth as a,
  adminDb as b
};
