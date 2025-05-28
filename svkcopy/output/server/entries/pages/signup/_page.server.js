import { f as fail } from "../../../chunks/index2.js";
import { d as db } from "../../../chunks/firebase.js";
import { collection, doc, getDoc, query, where, getDocs, setDoc } from "firebase/firestore";
const actions = {
  saveUserProfile: async ({ request }) => {
    const formData = await request.formData();
    const uid = formData.get("uid")?.toString();
    const username = formData.get("username")?.toString();
    const email = formData.get("email")?.toString().toLowerCase();
    console.log(`[DEBUG] Server: Received saveUserProfile request for uid: ${uid}, username: ${username}, email: ${email}`);
    if (!uid || !username || !email) {
      console.error("[DEBUG] Server: Missing uid, username, or email in saveUserProfile request.");
      return fail(400, {
        // 400 Bad Request
        profileSave: {
          // Use a distinct key for this action's response
          success: false,
          error: "Missing required user data (uid, username, or email)."
        }
      });
    }
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      console.error(`[DEBUG] Server: Invalid username format: ${username}`);
      return fail(400, {
        profileSave: {
          success: false,
          error: "Username can only contain letters, numbers, and underscores."
        }
      });
    }
    const credCollectionRef = collection(db, "credentials");
    const userDocRef = doc(credCollectionRef, uid);
    try {
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        console.warn(`[DEBUG] Server: Document for UID ${uid} already exists in credentials. Potential duplicate signup attempt?`);
        const existingData = userDocSnap.data();
        if (existingData.username !== username) {
          console.error(`[DEBUG] Server: UID ${uid} exists but with different username (${existingData.username}) than provided (${username}).`);
          return fail(409, {
            // 409 Conflict
            profileSave: {
              success: false,
              error: "User ID already associated with a different username."
            }
          });
        }
        console.log(`[DEBUG] Server: UID ${uid} already exists with the same username. Treating as success.`);
        return { profileSave: { success: true } };
      }
      const usernameQuery = query(credCollectionRef, where("username", "==", username));
      const usernameSnap = await getDocs(usernameQuery);
      if (!usernameSnap.empty) {
        console.warn(`[DEBUG] Server: Username "${username}" is already taken.`);
        return fail(409, {
          // 409 Conflict
          profileSave: {
            success: false,
            error: "Username is already taken. Please choose another."
          }
        });
      }
      console.log(`[DEBUG] Server: Username "${username}" is available. Creating document for UID ${uid}.`);
      await setDoc(userDocRef, {
        uid,
        // Store uid explicitly as well, can be useful
        username,
        email
        // DO NOT store password here - Firebase Auth handles that securely.
      });
      console.log(`[DEBUG] Server: Successfully saved profile for UID ${uid} / Username ${username}.`);
      return {
        // SvelteKit default success is 200 OK
        profileSave: {
          success: true
        }
      };
    } catch (error) {
      console.error("[DEBUG] Server: Unexpected error during saveUserProfile:", error);
      return fail(500, {
        // 500 Internal Server Error
        profileSave: {
          success: false,
          error: "An internal server error occurred while saving profile. Please try again later."
        }
      });
    }
  }
};
export {
  actions
};
