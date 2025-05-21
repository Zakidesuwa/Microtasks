// src/routes/login/+page.server.ts
import { json, error as SvelteKitError, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js'; // Added PageServerLoad if you have one
import { adminAuth } from '$lib/server/firebaseAdmin.js';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '$lib/firebase'; // Client-side db for lookupEmail (consider using adminDb here too for consistency)

// Optional: Load function (if you need to pass any data to the login page on initial load)
// export const load: PageServerLoad = async ({ locals }) => {
//     if (locals.userId) {
//         // If user already has a valid session, maybe redirect them from login page
//         // throw redirect(303, '/home');
//     }
//     return {};
// };

export const actions: Actions = {
  // Your existing lookupEmail action
  lookupEmail: async ({ request }) => {
    // ... (your existing lookupEmail logic) ...
    const formData = await request.formData();
    const username = formData.get('username')?.toString();

    if (!username) {
      return fail(400, { lookup: { success: false, error: 'Username was not provided.'}});
    }
    console.log(`[Login Action lookupEmail] Looking up email for username: ${username}`);
    try {
      const credRef = collection(db, "credentials"); // Using client-side db here, consider adminDb
      const q = query(credRef, where("username", "==", username), limit(1));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return fail(404, { lookup: { success: false, error: 'Username not found.' }});
      } else {
        const userData = snapshot.docs[0].data();
        const email = userData.email;
        if (!email) {
             return fail(500, { lookup: { success: false, error: 'User data incomplete on server (email missing).' }});
        }
        return { lookup: { success: true, email: email }};
      }
    } catch (error: any) {
      console.error("[Login Action lookupEmail] Error:", error);
      return fail(500, { lookup: { success: false, error: 'Internal server error during email lookup.' }});
    }
  },

  // New action to create a session cookie
  createSession: async ({ request, cookies }) => {
    console.log('[Login Action createSession] Received request.');
    try {
      const formData = await request.formData();
      const idToken = formData.get('idToken')?.toString();

      if (!idToken || typeof idToken !== 'string' || idToken.trim() === '') {
        console.warn('[Login Action createSession] ID token missing or invalid from form data.');
        return fail(400, { // Use fail for form action errors
            session: { // Keep errors nested for clarity on the client
                success: false,
                error: 'Authentication token is required.'
            }
        });
      }

      const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
      console.log('[Login Action createSession] Attempting to create session cookie with idToken (first 20 chars):', idToken.substring(0,20));
      const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
      console.log('[Login Action createSession] Session cookie created successfully.');

      cookies.set('__session', sessionCookie, {
        maxAge: expiresIn / 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax',
      });
      console.log('[Login Action createSession] __session cookie set.');

      // For form actions, a successful plain object return implies success.
      // SvelteKit's `enhance` will see this and typically the `result.type` will be 'success'.
      return {
        session: {
            success: true,
            message: 'Session created successfully.'
        }
      };

    } catch (error: any) {
      console.error('[Login Action createSession] Error:', error.code, error.message, error);
      let errorMessage = 'Failed to create session due to an internal server error.';
      let errorStatus = 500;

      if (error.code && (error.code.startsWith('auth/') || error.code === 'messaging/invalid-argument')) {
        errorMessage = `Failed to create session: ${error.message || 'Invalid authentication token.'}`;
        errorStatus = 401; // Unauthorized or Bad Request depending on context
      }
      
      return fail(errorStatus, {
        session: {
            success: false,
            error: errorMessage
        }
      });
    }
  }
};