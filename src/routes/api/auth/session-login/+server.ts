// src/routes/api/auth/session-login/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { adminAuth } from '$lib/server/firebaseAdmin';

export const POST: RequestHandler = async ({ request, cookies }) => {
    console.log('[API session-login] Received POST request.'); // DEBUG LOG
    try {
        const requestBodyText = await request.text(); // Get raw text first
        console.log('[API session-login] Raw request body text:', requestBodyText); // DEBUG LOG

        let idToken: string | undefined;
        try {
            const requestBodyJSON = JSON.parse(requestBodyText);
            console.log('[API session-login] Parsed request body JSON:', requestBodyJSON); // DEBUG LOG
            idToken = requestBodyJSON.idToken;
        } catch (parseError) {
            console.error('[API session-login] Error parsing request body as JSON:', parseError);
            return json({ error: 'Invalid request body: Malformed JSON.' }, { status: 400 });
        }


        if (!idToken || typeof idToken !== 'string' || idToken.trim() === '') {
            console.warn('[API session-login] idToken is missing, undefined, or empty in parsed body.');
            return json({ error: 'ID token required and must be a non-empty string.' }, { status: 400 });
        }

        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days in milliseconds
        console.log('[API session-login] Attempting to create session cookie with idToken (first 20 chars):', idToken.substring(0,20));
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
        console.log('[API session-login] Session cookie created successfully.');

        cookies.set('__session', sessionCookie, {
            maxAge: expiresIn / 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax',
        });
        console.log('[API session-login] __session cookie set.');

        return json({ status: 'success', message: 'Session cookie created.' });
    } catch (error: any) {
        console.error('[API session-login] Error creating session cookie:', error.code, error.message, error); // Log more details
        // Differentiate between client errors (bad token) and server errors
        if (error.code && (error.code.startsWith('auth/') || error.code === 'messaging/invalid-argument')) { // Firebase Admin Auth errors
            return json({ error: 'Failed to create session: Invalid authentication token provided.', details: error.message }, { status: 401 });
        }
        return json({ error: 'Failed to create session due to an internal server error.', details: 'Please contact support if this persists.' }, { status: 500 });
    }
};