// src/hooks.server.ts
import { auth } from '$lib/server/lucia.ts';
import { redirect, type Handle, type HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

// Define protected routes that require authentication
const protectedRoutes = ['/workspace', '/tasks', '/calendar', '/settings']; // Add any other routes that need protection

// First handler: initializes Lucia's auth handling
const handleAuth: Handle = async ({ event, resolve }) => {
	// We are attaching auth to `event.locals` which allows us to access it anywhere on the server
	event.locals.auth = auth.handleRequest(event);
	return await resolve(event);
};

// Second handler: handles user object population and route protection
const handleUserAndProtection: Handle = async ({ event, resolve }) => {
	console.log(`[HOOKS] Path: ${event.url.pathname}`);
	const luciaCookieName = 'auth_session'; // Default Lucia v2 cookie name, adjust if you changed it
	const luciaCookie = event.cookies.get(luciaCookieName);
	console.log(`[HOOKS] Lucia cookie ('${luciaCookieName}') present: ${!!luciaCookie}, Value: ${luciaCookie}`);

	// This is run every time a server-side request is made
	const session = await event.locals.auth.validate();
	console.log(
		`[HOOKS] event.locals.auth.validate() result (session.user): ${
			session && session.user ? JSON.stringify(session.user) : 'null'
		}`
	);

	if (session && session.user) {
		// If the session is validated and user data exists
		event.locals.user = {
			id: session.user.userId,
			name: session.user.name,
			email: session.user.email,
			role: session.user.role,
			picture: session.user.picture
		};
		console.log('[HOOKS] Using Lucia session user:', JSON.stringify(event.locals.user));
	} else {
		// No active Lucia session OR session is invalid
		// Fallback to checking the manual sessionId cookie
		console.log('[HOOKS] Lucia session NOT validated or no session.user. Falling back to manual session check.');
		const manualSessionId = event.cookies.get('sessionId');
		console.log(`[HOOKS] Manual sessionId cookie value: ${manualSessionId}`);

		if (manualSessionId === 'valid-session-id-no-role') {
			event.locals.user = {
				id: 'user123',
				name: 'User',
				// email: 'user@example.com' // Role is MISSING
			};
			console.log('[HOOKS] Using manual "User" session from "valid-session-id-no-role".');
		} else if (manualSessionId === 'valid-session-id-with-role') {
			event.locals.user = {
				id: 'user456',
				name: 'Admin User',
				email: 'admin@example.com',
				role: 'admin'
			};
			console.log('[HOOKS] Using manual "Admin User" session from "valid-session-id-with-role".');
		} else if (manualSessionId === 'zakidesuwa-session-id') {
			event.locals.user = {
				id: 'zakidesuwa001',
				name: 'Zakidesu',
				email: 'zakidesuwa@example.com',
				role: 'owner'
			};
			console.log('[HOOKS] Using manual "Zakidesu" session from "zakidesuwa-session-id".');
		} else {
			event.locals.user = null;
			console.log('[HOOKS] No valid manual session found. event.locals.user is null.');
		}
	}

	console.log('[HOOKS] Final event.locals.user for this request:', JSON.stringify(event.locals.user));

	// Route protection logic
	const currentPath = event.url.pathname;
	if (protectedRoutes.includes(currentPath)) {
		if (!event.locals.user) {
			console.log(`[HOOKS] Access to protected route ${currentPath} denied. Redirecting to /login.`);
			throw redirect(302, '/login'); // Redirect to login if not authenticated
		}
		console.log(
			`[HOOKS] Access to protected route ${currentPath} allowed for user: ${event.locals.user.name}.`
		);
	}

	const response = await resolve(event);
	return response;
};

// Error handler (optional, but good for logging)
const handleError: HandleServerError = async ({ error, event }) => {
	// Log the error
	console.error('[HOOKS - handleError] An error occurred:', error);
	console.error('[HOOKS - handleError] Event details:', {
		url: event.url.toString(),
		params: event.params,
		routeId: event.route.id,
		clientAddress: event.getClientAddress()
	});


	// Provide a user-friendly error response
	return {
		message: 'An unexpected error occurred. Please try again later.',
		// You can add a unique error ID for tracking if needed
		// errorId: generateUniqueId()
	};
};

// Sequence the handlers
export const handle: Handle = sequence(handleAuth, handleUserAndProtection);
export { handleError }; // Export the error handler if you've defined it