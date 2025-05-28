import { getApps, getApp, deleteApp, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
const firebaseConfig = {
  apiKey: "AIzaSyCw0-_N_zTL2Psu2kpIDReFOt6fCF2RcFo",
  authDomain: "microtasks-4c31d.firebaseapp.com",
  projectId: "microtasks-4c31d",
  storageBucket: "microtasks-4c31d.firebasestorage.app",
  messagingSenderId: "599965802416",
  appId: "1:599965802416:web:e09f0a98cb25be73c50075",
  measurementId: "G-LVS586S5HK"
};
let firebaseApp;
if (getApps().length) {
  firebaseApp = getApp();
  deleteApp(firebaseApp);
}
firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
getAuth(firebaseApp);
getStorage(firebaseApp);
export {
  db as d
};
