// src/routes/api/auth/session-login/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { adminAuth } from '$lib/server/firebaseAdmin';

export const POST: RequestHandler = async ({ request, cookies }) => {
    try {
        const { idToken } = await request.json();
        if (!idToken) {
            return json({ error: 'ID token required.' }, { status: 400 });
        }

        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days in milliseconds
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

        // Set cookie with httpOnly, secure (in prod), path, etc.
        cookies.set('__session', sessionCookie, {
            maxAge: expiresIn / 1000, // maxAge is in seconds
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use true in production
            path: '/',
            sameSite: 'lax',
        });

        return json({ status: 'success', message: 'Session cookie created.' });
    } catch (error: any) {
        console.error('[API session-login] Error creating session cookie:', error);
        return json({ error: 'Failed to create session.', details: error.message }, { status: 401 });
    }
};