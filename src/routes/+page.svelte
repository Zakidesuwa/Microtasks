<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/firebase.js'; // Central Firebase instance
	import {
		signInWithEmailAndPassword,
		signInWithPopup,
		GoogleAuthProvider,
		onAuthStateChanged
	} from 'firebase/auth';
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';

	// --- Component State ---
	let loginIdentifier = '';
	let password = '';
	let errorMessage: string | null = null;
	let isLoading = false;
	let showPassword = false;
	let notificationMessage: string | null = null;

	// --- Lifecycle Hook ---
	onMount(() => {
		// Check for messages passed via URL parameters (e.g., after signup/password reset)
		const urlParams = new URLSearchParams($page.url.search);
		const message = urlParams.get('message');
		const passwordResetSuccess = urlParams.get('passwordResetSuccess');
		if (message === 'signup_success')
			notificationMessage = 'Signup successful! You can now log in.';
		else if (passwordResetSuccess === 'true')
			notificationMessage = 'Password successfully updated! You can now log in.';
		// Clean up URL parameters after reading them
		if (message || passwordResetSuccess)
			window.history.replaceState({}, document.title, $page.url.pathname);
		// Check initial auth state (optional)
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (user) console.log('[DEBUG] User already signed in.');
			else console.log('[DEBUG] No user signed in.');
		});
		return () => unsubscribe(); // Cleanup listener on component destroy
	});

	// --- Session Creation Helper ---
	// Sends the ID token to the server API endpoint to set the session cookie
	async function createServerSession(idToken: string) {
		console.log('[DEBUG] Sending ID token to /api/auth/session');
		const response = await fetch('/api/auth/session', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ token: idToken })
		});

		if (!response.ok) {
			let errorData;
			try {
				errorData = await response.json();
			} catch (e) {
				errorData = { message: `Server responded with status ${response.status}` };
			}
			console.error('[DEBUG] Failed to create server session:', errorData);
			// Throw an error to be caught by the calling function
			throw new Error(errorData.message || 'Failed to create server session.');
		}
		console.log('[DEBUG] Server session cookie set successfully.');
		return true; // Indicate success
	}

	// --- Firebase Login (Email/Password or Username) ---
	// Handles the actual Firebase sign-in and subsequent session creation
	async function performFirebaseLogin(emailToUse: string, passwordToUse: string) {
		errorMessage = null;
		isLoading = true; // Start loading indicator

		try {
			// 1. Sign in with Firebase Auth
			console.log(`[DEBUG] Attempting Firebase sign-in for email: ${emailToUse}`);
			const userCredential = await signInWithEmailAndPassword(auth, emailToUse, passwordToUse);
			const user = userCredential.user;
			console.log('[DEBUG] Firebase login successful:', user.uid);

			// 2. Get ID Token
			errorMessage = 'Finalizing login...'; // Update feedback
			const idToken = await user.getIdToken();

			// 3. Create Server Session Cookie
			await createServerSession(idToken); // Call the helper function

			// 4. Redirect on Full Success
			goto(`/home?username=${encodeURIComponent(user.displayName || 'User')}`);
			// isLoading will be implicitly false after navigation or if an error occurs
		} catch (error: any) {
			// Handle errors from Firebase Auth OR createServerSession
			console.error('[DEBUG] Error during login or session creation:', error);

			// Firebase Auth errors
			if (error.code === 'auth/invalid-email')
				errorMessage = 'Invalid email format provided.';
			else if (
				error.code === 'auth/user-not-found' ||
				error.code === 'auth/wrong-password' ||
				error.code === 'auth/invalid-credential'
			)
				errorMessage = 'Incorrect email/username or password.';
			else if (error.code === 'auth/user-disabled')
				errorMessage = 'This account has been disabled.';
			else if (error.code === 'auth/too-many-requests')
				errorMessage = 'Access temporarily disabled due to many failed login attempts.';
			// Error from createServerSession or other unexpected errors
			else errorMessage = error.message || 'Login failed. Please try again.';

			isLoading = false; // Stop loading indicator on error
		}
	}

	// --- Main Login Handler (Form Submission) ---
	// Determines if the input is email or username, calls lookup if needed, then calls performFirebaseLogin
	async function handleLogin() {
		errorMessage = null;
		isLoading = true; // Start loading
		const identifier = loginIdentifier.trim();

		if (!identifier || !password) {
			errorMessage = 'Please enter your email/username and password.';
			isLoading = false;
			return;
		}

		const isEmail = identifier.includes('@');

		if (isEmail) {
			// Identifier looks like an email, attempt direct Firebase login
			console.log(`[DEBUG] Identifier "${identifier}" treated as email. Proceeding with Firebase login.`);
			await performFirebaseLogin(identifier, password);
			// isLoading is handled within performFirebaseLogin
		} else {
			// Identifier looks like a username, call server action to find email
			console.log(
				`[DEBUG] Identifier "${identifier}" treated as username. Calling server action 'lookupEmail'...`
			);
			const formData = new FormData();
			formData.append('username', identifier);

			try {
				const response = await fetch('?/lookupEmail', { method: 'POST', body: formData });
				let result;
				try {
					result = await response.json(); // Expecting JSON response from action
					console.log('[DEBUG] Server lookup response status:', response.status);
					console.log('[DEBUG] Server lookup response JSON:', JSON.stringify(result, null, 2));
				} catch (jsonError) {
					// Handle cases where the response isn't valid JSON
					console.error('[DEBUG] Failed to parse server lookup response as JSON:', jsonError);
					const textResponse = await response.text();
					console.log('[DEBUG] Server lookup response TEXT:', textResponse);
					errorMessage = 'Received an invalid response from the server.';
					isLoading = false;
					return;
				}

				// Check the structure of the response from the SvelteKit action
				if (!response.ok || result?.type === 'failure' || result?.lookup?.success === false) {
					// Action failed (returned fail() or unexpected structure)
					const errorMsg =
						result?.lookup?.error || result?.error || 'Login failed. Please check username/password.';
					console.log('[DEBUG] Server action indicated failure:', errorMsg);
					errorMessage = errorMsg;
					isLoading = false;
				} else if (result?.lookup?.success && result?.lookup?.email) {
					// Action succeeded and returned the email
					const retrievedEmail = result.lookup.email;
					console.log(
						`[DEBUG] Server lookup successful. Email found: ${retrievedEmail}. Proceeding with Firebase login.`
					);
					// Now perform Firebase login using the retrieved email
					await performFirebaseLogin(retrievedEmail, password);
					// isLoading is handled within performFirebaseLogin
				} else {
					// Unexpected response structure
					errorMessage = 'Received an unexpected response from the server.';
					console.error('[DEBUG] Server lookup failed: Unexpected response structure.', result);
					isLoading = false;
				}
			} catch (fetchError) {
				// Network error during the fetch call to the action
				console.error('[DEBUG] Network error during username lookup fetch:', fetchError);
				errorMessage = 'Could not connect to the server. Please check your connection.';
				isLoading = false;
			}
		}
	}

	// --- Google Login Handler ---
	async function googleLogin() {
		errorMessage = null;
		isLoading = true; // Start loading

		try {
			// 1. Sign in with Google Popup
			const provider = new GoogleAuthProvider();
			const result = await signInWithPopup(auth, provider);
			const user = result.user;
			console.log('[DEBUG] Google login successful:', user.uid, user.displayName);

			// 2. Get ID Token
			errorMessage = 'Finalizing login...'; // Update feedback
			const idToken = await user.getIdToken();

			// 3. Create Server Session Cookie
			await createServerSession(idToken); // Call the helper function

			// 4. Redirect on Full Success
			goto(`/home?username=${encodeURIComponent(user.displayName || 'User')}`);
			// isLoading will be implicitly false after navigation or if an error occurs
		} catch (error: any) {
			// Handle errors from Google Popup OR createServerSession
			console.error('[DEBUG] Google login or session creation error:', error);
			if (error.code === 'auth/popup-closed-by-user')
				errorMessage = 'Google sign-in was cancelled.';
			else if (error.code === 'auth/account-exists-with-different-credential')
				errorMessage =
					'An account already exists with this email using a different sign-in method.';
			else if (error.code === 'auth/popup-blocked')
				errorMessage = 'Popup blocked by browser. Please allow popups for this site.';
			// Error from createServerSession or other unexpected errors
			else errorMessage = error.message || 'Google login failed. Please try again.';
			isLoading = false; // Stop loading indicator on error
		}
	}

	// --- UI Helpers ---
	function togglePasswordVisibility() {
		showPassword = !showPassword;
	}
	function clearNotification() {
		notificationMessage = null;
	}
</script>

<main
    class="flex flex-col justify-center items-center min-h-screen w-full h-full bg-cover bg-fixed"
    style="background-image: url('/background.png'); background-position: center +783px;" >
    <img
        src="/logonamin.png"
        alt="Microtask Logo"
        class="absolute top-10 left-10 h-12 scale-250" 
    />
    <h1 class="text-3xl font-bold text-center mb-6 text-black">Welcome to Microtask!</h1>

    {#if notificationMessage}
        <div
            class="fixed top-4 right-4 max-w-sm bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg z-50 mb-4 flex justify-between items-center"
            role="alert"
            transition:fade
        >
            <span class="block sm:inline text-sm">{notificationMessage}</span>
            <button on:click={clearNotification} class="ml-4 p-0.5 -mr-1" aria-label="Close notification">
                <svg
                    class="fill-current h-5 w-5 text-green-600 hover:text-green-800"
                    role="button"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    ><title>Close</title><path
                        d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.03a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"
                    /></svg
                >
            </button>
        </div>
    {/if}

    <div class="bg-white p-6 md:p-8 rounded-lg shadow-2xl border border-gray-300 max-w-md w-[90%] md:w-full">
        <h2 class="text-xl font-bold text-center mb-4">Log In</h2>

        {#if errorMessage}
            <div
                class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm"
                role="alert"
                transition:fade
            >
                <span class="block sm:inline">{errorMessage}</span>
            </div>
        {/if}

        <form on:submit|preventDefault={handleLogin} novalidate>
            <div class="mb-4">
                <label for="loginIdentifier" class="block text-gray-700 mb-1 font-medium text-sm"
                    >Email or Username</label
                >
                <input
                    id="loginIdentifier"
                    name="loginIdentifier"
                    type="text"
                    bind:value={loginIdentifier}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm transition duration-150 ease-in-out"
                    required
                    placeholder="Enter your email or username"
                    autocomplete="username"
                    aria-required="true"
                />
            </div>
            <div class="mb-2">
                <label for="password" class="block text-gray-700 mb-1 font-medium text-sm">Password</label>
                <div class="relative">
                    <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        bind:value={password}
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm transition duration-150 ease-in-out"
                        required
                        placeholder="Enter your password"
                        autocomplete="current-password"
                        aria-required="true"
                    />
                    <button
                        type="button"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        class="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700 p-1"
                        on:click={togglePasswordVisibility}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="w-5 h-5"
                        >
                            {#if showPassword}
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                                />
                            {:else}
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                                />
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            {/if}
                        </svg>
                    </button>
                </div>
            </div>
            <div class="flex justify-end items-center mt-3 mb-4">
                <a href="/forgotpass" class="text-sm text-blue-600 hover:underline font-medium"
                    >Forgot Password?</a
                >
            </div>
            <button
                type="submit"
                disabled={isLoading}
                class="w-full bg-black text-white py-2.5 rounded-lg font-semibold transition duration-200 ease-in-out transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Logging in...' : 'Log in'}
            </button>
            <div class="mt-4 text-center text-sm">
                Don't have an account?
                <a href="/signup" class="text-blue-600 hover:underline font-medium">Create one</a>
            </div>
            <div class="relative my-5">
                <div class="absolute inset-0 flex items-center" aria-hidden="true">
                    <div class="w-full border-t border-gray-300"></div>
                </div>
                <div class="relative flex justify-center text-sm">
                    <span class="px-2 bg-white text-gray-500">Or</span>
                </div>
            </div>
            <button
                type="button"
                on:click={googleLogin}
                disabled={isLoading}
                class="w-full border border-gray-300 flex items-center justify-center py-2.5 rounded-lg font-semibold cursor-pointer transition duration-200 ease-in-out transform hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 disabled:opacity-60 disabled:cursor-not-allowed"
            >
                <img src="/iconnggoogle.webp" alt="Google" class="h-5 mr-2" />
                <span class="text-sm text-gray-700">Log in with Google</span>
            </button>
        </form>
    </div>
</main>

<style>
	input:focus {
		outline: none;
	}
</style>