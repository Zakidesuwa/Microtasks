import { d as db } from "../../chunks/firebase.js";
import { f as fail } from "../../chunks/index2.js";
import { collection, query, where, limit, getDocs } from "firebase/firestore";
const actions = {
  lookupEmail: async ({ request }) => {
    const formData = await request.formData();
    const username = formData.get("username")?.toString();
    if (!username) {
      return fail(400, {
        lookup: {
          // Use consistent nested structure for errors
          success: false,
          error: "Username was not provided."
        }
      });
    }
    console.log(`[DEBUG] Server: Looking up email for username: ${username}`);
    try {
      const credRef = collection(db, "credentials");
      const q = query(credRef, where("username", "==", username), limit(1));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        console.log(`[DEBUG] Server: Username not found: ${username}. Returning fail(404).`);
        return fail(404, {
          // HTTP 404 Not Found
          lookup: {
            // Maintain consistent payload structure
            success: false,
            error: "Username not found."
            // Specific error for client
          }
        });
      } else {
        const userData = snapshot.docs[0].data();
        const email = userData.email;
        if (!email) {
          console.error(`[DEBUG] Server: Found user document for ${username} but the 'email' field is missing or empty.`);
          return fail(500, {
            lookup: {
              success: false,
              error: "User data incomplete on server."
              // Error for internal issue
            }
          });
        }
        console.log(`[DEBUG] Server: Found email ${email} for username ${username}`);
        return {
          // Success case
          lookup: {
            success: true,
            email
            // Include the found email
          }
        };
      }
    } catch (error) {
      console.error("[DEBUG] Server: Unexpected error during username lookup:", error);
      return fail(500, {
        lookup: {
          success: false,
          error: "An internal server error occurred. Please try again later."
          // Generic error for client
        }
      });
    }
  }
  // Other actions (e.g., password reset) could be defined here
};
export {
  actions
};
