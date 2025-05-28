import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { d as db } from "../../../chunks/firebase.js";
import { f as fail } from "../../../chunks/index2.js";
import bcrypt from "bcryptjs";
function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}
const actions = {
  // Action to directly reset the password in Firestore
  resetPassword: async ({ request }) => {
    const formData = await request.formData();
    const email = formData.get("email")?.toString().toLowerCase();
    const newPassword = formData.get("newPassword")?.toString();
    const confirmPassword = formData.get("confirmPassword")?.toString();
    if (!email || !newPassword || !confirmPassword) {
      return fail(400, { resetPassword: { success: false, error: "Email and both password fields are required." } });
    }
    if (!isValidEmail(email)) {
      return fail(400, { resetPassword: { success: false, error: "Invalid email format.", email } });
    }
    if (newPassword !== confirmPassword) {
      return fail(400, { resetPassword: { success: false, error: "Passwords do not match.", email } });
    }
    if (newPassword.length < 6) {
      return fail(400, { resetPassword: { success: false, error: "Password must be at least 6 characters long.", email } });
    }
    console.log("Attempting direct password reset for:", email);
    try {
      const credRef = collection(db, "credentials");
      const q = query(credRef, where("email", "==", email));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        console.log(`User not found for email: ${email}`);
        return fail(404, { resetPassword: { success: false, error: "Email not found.", email } });
      }
      const userDoc = snapshot.docs[0];
      const userId = userDoc.id;
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      console.log(`New password hash generated for user ID: ${userId}`);
      console.log(`Hash to be stored: ${hashedPassword}`);
      const userRef = doc(db, "credentials", userId);
      console.log(`Attempting to update doc ID: ${userId} with hash: ${hashedPassword}`);
      await updateDoc(userRef, {
        password: hashedPassword
      });
      console.log(`Update operation completed for doc ID: ${userId}. Verifying...`);
      const { getDoc } = await import("firebase/firestore");
      const updatedDocSnap = await getDoc(userRef);
      if (updatedDocSnap.exists()) {
        const updatedData = updatedDocSnap.data();
        console.log(`Verification: Stored hash after update is: ${updatedData.password}`);
        if (updatedData.password !== hashedPassword) {
          console.error(`CRITICAL ERROR: Firestore update for ${userId} did not persist the new hash!`);
          return fail(500, { resetPassword: { success: false, error: "Database update failed verification. Please try again.", email } });
        }
      } else {
        console.error(`CRITICAL ERROR: Document ${userId} not found after update attempt!`);
        return fail(500, { resetPassword: { success: false, error: "User document lost during update. Please contact support.", email } });
      }
      console.log(`Password successfully reset and verified in Firestore for user ID: ${userId} (Email: ${email})`);
      return { resetPassword: { success: true, message: "Password successfully updated." } };
    } catch (error) {
      console.error("Error during direct password reset:", error);
      return fail(500, { resetPassword: { success: false, error: "Failed to reset password due to a server error. Please try again later.", email } });
    }
  }
};
export {
  actions
};
