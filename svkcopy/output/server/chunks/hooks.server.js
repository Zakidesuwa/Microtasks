import { a as adminAuth } from "./firebaseAdmin.js";
const handle = async ({ event, resolve }) => {
  const sessionCookie = event.cookies.get("__session");
  if (!sessionCookie) {
    event.locals.userId = null;
    return resolve(event);
  }
  try {
    const decodedToken = await adminAuth.verifyIdToken(sessionCookie, true);
    event.locals.userId = decodedToken.uid;
  } catch (error) {
    if (error.code === "auth/id-token-expired" || error.code === "auth/argument-error") {
      console.warn(`[Hooks] Invalid session cookie: ${error.code}. Clearing cookie.`);
      event.cookies.delete("__session", { path: "/" });
    } else {
      console.error("[Hooks] Error verifying session cookie:", error);
    }
    event.locals.userId = null;
  }
  return resolve(event);
};
export {
  handle
};
