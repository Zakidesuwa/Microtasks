// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { adminAuth } from './lib/server/firebaseAdmin.js'; // Path to your initialized adminAuth

export const handle: Handle = async ({ event, resolve }) => {
    const sessionCookie = event.cookies.get('__session'); // Ensure this is the name you set in session-login

    if (!sessionCookie) {
        // No session cookie found, user is not logged in server-side for this request.
        // console.debug('[Hooks] No __session cookie found.');
        event.locals.userId = null;
        return resolve(event); // Proceed without setting user info
    }

    try {
        // Verify the SESSION cookie using Firebase Admin SDK
        // The second argument 'true' enables checking if the session cookie has been revoked.
        // console.debug('[Hooks] Verifying __session cookie...');
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true /** checkRevoked */);
        
        // console.debug(`[Hooks] Session cookie verified successfully for UID: ${decodedToken.uid}`);
        event.locals.userId = decodedToken.uid;

    } catch (error: any) {
        // Session cookie is invalid (e.g., expired, revoked, malformed).
        // Log the specific error code for better debugging.
        console.warn(`[Hooks] Invalid or expired session cookie. Code: ${error.code || 'UNKNOWN_ERROR'}, Message: ${error.message}. Clearing cookie.`);
        event.cookies.delete('__session', { path: '/' }); // Ensure path matches how it was set

        event.locals.userId = null;
    }

    // Continue processing the request, event.locals.userId is now set (or null if auth failed)
    const response = await resolve(event);
    return response;
};