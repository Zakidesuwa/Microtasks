// src/routes/api/auth/session-logout/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { adminAuth } from '$lib/server/firebaseAdmin';

export const POST: RequestHandler = async ({ cookies, locals }) => {
    const sessionCookie = cookies.get('__session');
    if (sessionCookie) {
        try {
            const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
            await adminAuth.revokeRefreshTokens(decodedClaims.sub); // Revoke user's refresh tokens
        } catch (error) {
            console.warn('[API session-logout] Error during token revocation (token might be invalid already):', error);
        }
    }
    cookies.delete('__session', { path: '/' });
    locals.userId = null; // Clear locals
    return json({ status: 'success', message: 'Logged out.' });
};