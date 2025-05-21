// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { adminAuth } from './lib/server/firebaseAdmin.js'; // Ensure adminAuth is your initialized Firebase Admin Auth instance

export const handle: Handle = async ({ event, resolve }) => {
    const sessionCookie = event.cookies.get('__session'); // Or whatever you named your session cookie

    if (!sessionCookie) {
        // No session cookie found, user is not logged in server-side for this request.
        // console.debug('[Hooks] No session cookie found.');
        event.locals.userId = null;
        // Optionally set a full user object to null as well if you use one
        // event.locals.user = null;
        return resolve(event); // Proceed without setting user info
    }

    try {
        // Verify the SESSION cookie using Firebase Admin SDK
        // console.debug('[Hooks] Verifying session cookie...');

        // --- MODIFIED LINE for Strategy A (Session Cookies) ---
        // The second argument 'true' enables checking if the session cookie has been revoked.
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true /** checkRevoked */);
        // --- END MODIFICATION ---

        // console.debug(`[Hooks] Session cookie verified successfully for UID: ${decodedToken.uid}`);

        // Add the user's UID to event.locals for access in server load functions and actions
        event.locals.userId = decodedToken.uid;

        // OPTIONAL: You could also fetch minimal user data here and attach it to locals
        // if it's needed on every authenticated page load and you want to avoid fetching it in each load function.
        // For example:
        // const userRecord = await adminAuth.getUser(decodedToken.uid);
        // event.locals.user = {
        //     uid: userRecord.uid,
        //     email: userRecord.email,
        //     displayName: userRecord.displayName,
        //     // Add other relevant, non-sensitive fields
        // };

    } catch (error: any) {
        // Session cookie is invalid (e.g., expired, revoked, malformed).
        // Clear the invalid cookie from the browser and treat the user as logged out.
        console.warn(`[Hooks] Invalid or expired session cookie: ${error.code || error.message}. Clearing cookie.`);
        event.cookies.delete('__session', { path: '/' }); // Ensure path matches how it was set

        event.locals.userId = null;
        // event.locals.user = null; // also clear any full user object in locals
    }

    // Continue processing the request, event.locals.userId is now set (or null if auth failed)
    const response = await resolve(event);
    return response;
};