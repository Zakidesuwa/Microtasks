// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { adminAuth } from './lib/server/firebaseAdmin.js'; // Path to your initialized adminAuth

export const handle: Handle = async ({ event, resolve }) => {
    const sessionCookie = event.cookies.get('__session');

    // Corrected logging for event.url.pathname
    console.log(`[HOOKS] Request to: ${event.url.pathname}. __session cookie present: ${!!sessionCookie}`);
    if (sessionCookie) {
        console.log(`[HOOKS] __session cookie value (first 30 chars) for ${event.url.pathname}: ${sessionCookie.substring(0, 30)}...`);
    }

    if (!sessionCookie) {
        event.locals.userId = null;
        console.log(`[HOOKS] No __session cookie for ${event.url.pathname}. locals.userId set to null.`);
    } else {
        try {
            console.log(`[HOOKS] Attempting to verify session cookie for ${event.url.pathname}.`);
            const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true /** checkRevoked */);
            event.locals.userId = decodedToken.uid;
            console.log(`[HOOKS] Session cookie VERIFIED for ${event.url.pathname}. locals.userId SET to: ${event.locals.userId}`);
        } catch (error: any) {
            // Corrected logging for event.url.pathname
            console.error(`[HOOKS] FAILED to verify session cookie for ${event.url.pathname}. Code: ${error.code || 'UNKNOWN'}, Msg: ${error.message}. Deleting cookie.`);
            event.cookies.delete('__session', { path: '/' }); // Delete invalid/expired cookie
            event.locals.userId = null;
        }
    }
    
    // Resolve the request
    const response = await resolve(event);

    // Corrected logging for event.url.pathname
    console.log(`[HOOKS] Exiting hook for ${event.url.pathname}. Final event.locals.userId: ${event.locals.userId}`);
    return response;
};