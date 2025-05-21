// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { adminAuth } from './lib/server/firebaseAdmin.js';

export const handle: Handle = async ({ event, resolve }) => {
    const { url, cookies } = event;
    const sessionCookie = cookies.get('__session');

    console.log(`[HOOKS] Request to: ${url.pathname}. __session cookie present: ${!!sessionCookie}`);
    if (sessionCookie) {
        console.log(`[HOOKS] __session cookie value (first 30 chars) for ${url.pathname}: ${sessionCookie.substring(0, 30)}...`);
    }

    if (!sessionCookie) {
        event.locals.userId = null;
        console.log(`[HOOKS] No __session cookie for ${url.pathname}. locals.userId set to null.`);
    } else {
        try {
            console.log(`[HOOKS] Attempting to verify session cookie for ${url.pathname}.`);
            const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true /** checkRevoked */);
            event.locals.userId = decodedToken.uid;
            console.log(`[HOOKS] Session cookie VERIFIED for ${url.pathname}. locals.userId SET to: ${event.locals.userId}`);
        } catch (error: any) {
            console.error(`[HOOKS] FAILED to verify session cookie for ${url.pathname}. Code: ${error.code || 'UNKNOWN'}, Msg: ${error.message}. Deleting cookie.`);
            cookies.delete('__session', { path: '/' });
            event.locals.userId = null;
        }
    }
    
    const response = await resolve(event); // Resolve the request first

    console.log(`[HOOKS] Exiting hook for ${url.pathname}. Final event.locals.userId: ${event.locals.userId}`);
    return response;
};