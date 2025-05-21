// src/routes/home/+page.server.ts

import type { PageServerLoad, Actions, RequestHandler } from './$types.js'; // Assuming RequestHandler might come from here or @sveltejs/kit
// Or explicitly: import type { RequestHandler } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebaseAdmin.js';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { fail } from '@sveltejs/kit';
import type { Cookies } from '@sveltejs/kit'; // For better cookies typing

// ... (Task interface) ...

// Helper function (if needed by multiple handlers or complex enough)
// Can be at top level or within the scope it's used if not exported
const authenticateUser = async (email: string, password: string): Promise<string | null> => {
    // Actual authentication logic
    if (email === "test@example.com" && password === "password") {
        return "user123-from-post";
    }
    return null;
};

export const load: PageServerLoad = async ({ locals, url }) => {
    // ... your existing load logic ...
    // You would NOT define authenticate or POST here
    // ...
};

export const actions: Actions = {
    // ... your existing actions (addNote, addTask, etc.) ...
};

// --- Standalone POST handler for the /home route ---
// This handles POST requests to /home that are NOT SvelteKit form actions
// e.g., if you POST to /home with a JSON body from an external client or custom fetch
export const POST: RequestHandler = async ({ request, cookies }) => { // cookies will be typed if RequestHandler is from @sveltejs/kit
    try {
        const { email, password } = await request.json();
        const userId = await authenticateUser(email, password); // Use the top-level helper

        if (!userId) {
            return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        cookies.set('auth_session', userId, { // Example: using 'auth_session' like Lucia might
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });

        // It's common to return a success message or the user object (without sensitive data)
        return new Response(JSON.stringify({ message: 'Login successful', userId }), {
            status: 200, // 200 OK or 204 No Content if nothing to return in body
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error in POST /home:', error);
        return new Response(JSON.stringify({ error: 'Server error during login' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};