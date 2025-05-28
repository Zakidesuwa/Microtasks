import { e as error, j as json } from "../../../../../chunks/index2.js";
import { a as adminAuth, b as adminDb } from "../../../../../chunks/firebaseAdmin.js";
import { FieldValue } from "firebase-admin/firestore";
import { d as private_env } from "../../../../../chunks/shared-server.js";
const POST = async ({ request, cookies }) => {
  try {
    const { token } = await request.json();
    if (!token) {
      throw error(400, "ID token is required.");
    }
    const decodedToken = await adminAuth.verifyIdToken(
      token,
      true
      /** checkRevoked - optional */
    );
    console.log(`[API Session] Verified ID token for UID: ${decodedToken.uid}`);
    const secure = private_env.NODE_ENV === "production";
    const maxAge = 60 * 60 * 24 * 14;
    cookies.set("__session", token, {
      path: "/",
      // Cookie available for all paths
      httpOnly: true,
      // CRITICAL: Prevents client-side JS from accessing the cookie
      secure,
      // CRITICAL: Send only over HTTPS in production
      maxAge,
      // How long the cookie lasts
      sameSite: "lax"
      // Protects against CSRF attacks in most cases
    });
    const userDocRef = adminDb.collection("credentials").doc(decodedToken.uid);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      await userDocRef.set({
        username: decodedToken.name || decodedToken.email || "Google User",
        email: decodedToken.email,
        provider: "google",
        createdAt: FieldValue.serverTimestamp()
      });
      console.log(`[API Session] Created new user document for UID: ${decodedToken.uid}`);
    } else {
      await userDocRef.update({
        username: decodedToken.name || decodedToken.email || "Google User",
        email: decodedToken.email,
        lastLogin: FieldValue.serverTimestamp()
      });
      console.log(`[API Session] Updated user document for UID: ${decodedToken.uid}`);
    }
    return json({ success: true, message: "Session cookie set." });
  } catch (err) {
    console.error("[API Session] Error verifying token or setting cookie:", err);
    if (err.code === "auth/id-token-expired") {
      throw error(401, "Firebase ID token has expired. Please log in again.");
    }
    if (err.code === "auth/argument-error" || err.code === "auth/invalid-id-token") {
      throw error(401, "Firebase ID token is invalid.");
    }
    if (err.code === "auth/id-token-revoked") {
      throw error(401, "Your session has been revoked. Please log in again.");
    }
    throw error(500, "Failed to verify authentication.");
  }
};
export {
  POST
};
