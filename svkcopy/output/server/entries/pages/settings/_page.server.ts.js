import { r as redirect } from "../../../chunks/index2.js";
import { a as adminAuth, b as adminDb } from "../../../chunks/firebaseAdmin.js";
if (!adminAuth) {
  console.warn("Firebase Admin SDK not initialized on the server. User data might be limited.");
}
const load = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(302, "/login");
  }
  let username = locals.user.name || "User";
  let photoURL = locals.user.picture || null;
  if (adminAuth && adminDb) {
    try {
      const userRecord = await adminAuth.getUser(locals.user.uid);
      username = userRecord.displayName || username;
      photoURL = userRecord.photoURL || photoURL;
    } catch (error) {
      console.error("Error fetching user data from Firebase Admin in settings load:", error.message);
    }
  }
  return {
    // Pass the username that will be used in the header and potentially to pre-fill forms
    // The client-side onAuthStateChanged will ultimately be the most up-to-date source for forms.
    username
    // Note: We don't pass full user object here to avoid exposing sensitive data if `locals.user` contains more.
    // The client-side will handle fetching the detailed profile for editing via Firebase SDK.
    // photoURL: photoURL, // Can also pass this if needed for initial header display
  };
};
export {
  load
};
