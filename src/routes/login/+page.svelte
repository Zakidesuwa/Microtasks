<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
	import { page } from '$app/stores'; // Corrected: page store is from $app/stores	
    import { auth } from '$lib/firebase';
    import {
        signInWithEmailAndPassword,
        createUserWithEmailAndPassword,
        GoogleAuthProvider,
        signInWithPopup,
        sendPasswordResetEmail
    } from 'firebase/auth';
    import { browser } from '$app/environment';

    let email = '';
    let password = '';
    let isLoginMode = true;
    let isLoading = false;
    let errorMessage: string | null = null;
    let successMessage: string | null = null;

    // Helper function to create the server-side session cookie
    async function createServerSession(idToken: string) {
        // isLoading is typically managed by the calling function for the overall login process
        // but we can set it specifically for this step if desired, or just rely on the outer isLoading.
        // For now, let's assume the outer function handles the main isLoading state.
        // errorMessage = null; // Clear previous session-specific errors

        try {
            console.log('[Login Page] Attempting to create server session with ID token...');
            const response = await fetch('/api/auth/session-login', { // CORRECTED URL
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ idToken }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `Server responded with ${response.status} to /api/auth/session-login` }));
                console.error('[Login Page] Failed to create server session:', errorData.error || response.statusText);
                // Set a general error message if a specific one isn't available
                errorMessage = errorData.error || 'Could not complete login with the server. Please try again.';
                return false; // Indicate failure
            }

            const sessionData = await response.json();
            console.log('[Login Page] Server session cookie created successfully via /api/auth/session-login:', sessionData);
            return true; // Indicate success
        } catch (error: any) {
            console.error('[Login Page] Exception in createServerSession when calling /api/auth/session-login:', error);
            errorMessage = error.message || 'A network error occurred while finalizing login. Please check your connection and try again.';
            return false; // Indicate failure
        }
    }

    async function handleEmailLogin(event: Event) { // Renamed from handleLogin for clarity
        event.preventDefault();
        isLoading = true;
        errorMessage = null;
        successMessage = null;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log("Email/Pass login successful, user UID:", user.uid);

            const idToken = await user.getIdToken();
            const sessionCreated = await createServerSession(idToken);

            if (sessionCreated) {
                // Username will be fetched by the server via locals on the next load of /home
                // No need to set client-side userId cookie if __session is primary
                await goto('/home');
            } else {
                // errorMessage should have been set by createServerSession
                // Consider signing out client-side if server session failed, to avoid inconsistent states
                await auth.signOut().catch(e => console.warn("Client signout after session fail error:", e));
            }
        } catch (error: any) {
            console.error("Email/Pass login error:", error);
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                errorMessage = 'Invalid email or password.';
            } else {
                errorMessage = error.message || 'Login failed. Please try again.';
            }
        } finally {
            isLoading = false;
        }
    }

    async function handleGoogleLogin() {
        isLoading = true;
        errorMessage = null;
        successMessage = null;
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            console.log("Google login successful, user UID:", user.uid);

            const idToken = await user.getIdToken();
            const sessionCreated = await createServerSession(idToken);

            if (sessionCreated) {
                // Store username from Google profile to localStorage for immediate client-side use if desired.
                // The server will still be the source of truth for `data.user.name` on page loads.
                if (browser && user.displayName) {
                    localStorage.setItem('microtask_username', user.displayName);
                }
                await goto('/home');
            } else {
                // errorMessage should have been set by createServerSession
                await auth.signOut().catch(e => console.warn("Client signout after session fail error:", e));
            }
        } catch (error: any) {
            console.error("Google login error:", error);
            if (error.code === 'auth/popup-closed-by-user'){
                errorMessage = "Google sign-in was cancelled.";
            } else {
                errorMessage = error.message || "Failed to log in with Google.";
            }
        } finally {
            isLoading = false;
        }
    }

    async function handleSignup(event: Event) {
        event.preventDefault();
        isLoading = true;
        errorMessage = null;
        successMessage = null;

        if (password.length < 6) {
            errorMessage = "Password should be at least 6 characters.";
            isLoading = false;
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log("Signup successful, user UID:", user.uid);

            const idToken = await user.getIdToken();
            const sessionCreated = await createServerSession(idToken);

            if (sessionCreated) {
                successMessage = "Signup successful! Redirecting...";
                // You'll likely want to create a 'credentials' document in Firestore for the new user here
                // or upon their first visit to a page that requires it (e.g., /home load function).
                // For now, redirecting. The username on home page will default to "User" until
                // their `credentials` document with a `username` field is created.
                await goto('/home');
            } else {
                // errorMessage should have been set
                // Consider what to do if signup is successful on Firebase but server session fails.
                // Maybe prompt user to try logging in.
                await auth.signOut().catch(e => console.warn("Client signout after session fail error:", e));
            }
        } catch (error: any) {
            console.error("Signup error:", error);
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered. Try logging in.';
            } else {
                errorMessage = error.message || 'Signup failed. Please try again.';
            }
        } finally {
            isLoading = false;
        }
    }

    async function handlePasswordReset() {
        if (!email) {
            errorMessage = "Please enter your email address to reset password.";
            return;
        }
        isLoading = true;
        errorMessage = null;
        successMessage = null;
        try {
            await sendPasswordResetEmail(auth, email);
            successMessage = "Password reset email sent! Check your inbox.";
        } catch (error: any) {
            console.error("Password reset error:", error);
            errorMessage = error.message || "Failed to send password reset email.";
        } finally {
            isLoading = false;
        }
    }

    let unsubscribeAuth: (() => void) | null = null;

    onMount(() => {
        // Redirect if user is already logged in (client-side) and on login page
        // This also attempts to ensure server session if they land here while client-logged-in
        let processingAuthChange = false; // Prevent race conditions / multiple redirects

        unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            if (user && $page.url.pathname === '/login' && !processingAuthChange) {
                processingAuthChange = true;
                isLoading = true; // Show loading indicator
                console.log('[Login onMount] User already signed in on client. Attempting to ensure server session.');
                try {
                    const idToken = await user.getIdToken(true); // Force refresh
                    const sessionOK = await createServerSession(idToken);
                    if (sessionOK) {
                        if ($page.url.pathname === '/login') { // Double check still on login page
                             goto('/home', { replaceState: true });
                        }
                    } else {
                        // If server session creation fails, sign out client to force re-login
                        // errorMessage should be set by createServerSession
                        await auth.signOut().catch(e => console.warn("Client signout after server session fail in onMount:", e));
                    }
                } catch(error) {
                    console.error("[Login onMount] Error during auto-session creation:", error);
                    errorMessage = "Could not automatically log you in. Please try logging in manually.";
                    await auth.signOut().catch(e => console.warn("Client signout after onMount error:", e));
                } finally {
                    isLoading = false;
                    processingAuthChange = false;
                }
            } else if (!user) {
                // User logged out or not logged in, ensure isLoading is false if no other process is running
                // This might be redundant if other flows manage isLoading, but safe.
                if (isLoading && !processingAuthChange) { // Only if not already being handled
                    // isLoading = false;
                }
            }
        });
        return () => {
            if (unsubscribeAuth) unsubscribeAuth();
        };
    });
</script>

<!-- ... rest of your HTML template ... -->

<div class="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-900 px-4 sm:px-6 lg:px-8 font-sans">
    <div class="max-w-md w-full space-y-8 p-8 sm:p-10 bg-white dark:bg-zinc-800 shadow-xl rounded-xl">
        <div>
            <img class="mx-auto h-16 w-auto" src="/logonamin.png" alt="Microtask Logo">
            <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-zinc-100">
                {isLoginMode ? 'Sign in to your account' : 'Create a new account'}
            </h2>
        </div>

        {#if errorMessage}
            <div class="bg-red-100 dark:bg-red-800 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded relative" role="alert">
                <strong class="font-bold">Error: </strong>
                <span class="block sm:inline">{errorMessage}</span>
            </div>
        {/if}
        {#if successMessage}
            <div class="bg-green-100 dark:bg-green-700 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-100 px-4 py-3 rounded relative" role="alert">
                <strong class="font-bold">Success: </strong>
                <span class="block sm:inline">{successMessage}</span>
            </div>
        {/if}

        <form class="mt-8 space-y-6" on:submit|preventDefault={isLoginMode ? handleEmailLogin : handleSignup}>
            <input type="hidden" name="remember" value="true">
            <div class="rounded-md shadow-sm -space-y-px">
                <div>
                    <label for="email-address" class="sr-only">Email address</label>
                    <input id="email-address" name="email" type="email" bind:value={email} autocomplete="email" required
                           class="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 dark:border-zinc-600 placeholder-gray-500 dark:placeholder-zinc-400 text-gray-900 dark:text-zinc-100 bg-white dark:bg-zinc-700 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                           placeholder="Email address">
                </div>
                <div>
                    <label for="password" class="sr-only">Password</label>
                    <input id="password" name="password" type="password" bind:value={password} autocomplete={isLoginMode ? 'current-password' : 'new-password'} required
                           class="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 dark:border-zinc-600 placeholder-gray-500 dark:placeholder-zinc-400 text-gray-900 dark:text-zinc-100 bg-white dark:bg-zinc-700 {isLoginMode ? 'rounded-b-md' : ''} focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                           placeholder="Password">
                </div>
            </div>

            {#if isLoginMode}
            <div class="flex items-center justify-between">
                <div class="text-sm">
                    <button type="button" on:click={handlePasswordReset} class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                        Forgot your password?
                    </button>
                </div>
            </div>
            {/if}

            <div>
                <button type="submit" disabled={isLoading}
                        class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-offset-zinc-800 disabled:opacity-70">
                    <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                        {#if isLoading}
                            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        {:else}
                            <svg class="h-5 w-5 text-blue-400 dark:text-blue-300 group-hover:text-blue-300 dark:group-hover:text-blue-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                            </svg>
                        {/if}
                    </span>
                    {isLoading ? 'Processing...' : (isLoginMode ? 'Sign in' : 'Sign up')}
                </button>
            </div>
        </form>

         <div class="mt-6">
            <div class="relative">
                <div class="absolute inset-0 flex items-center">
                    <div class="w-full border-t border-gray-300 dark:border-zinc-600"></div>
                </div>
                <div class="relative flex justify-center text-sm">
                    <span class="px-2 bg-white dark:bg-zinc-800 text-gray-500 dark:text-zinc-400">
                        Or continue with
                    </span>
                </div>
            </div>

            <div class="mt-6">
                <button on:click={handleGoogleLogin} disabled={isLoading}
                        class="w-full inline-flex justify-center py-3 px-4 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm bg-white dark:bg-zinc-700 text-sm font-medium text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-zinc-800 disabled:opacity-70">
                     {#if isLoading && !errorMessage} <!-- Consider a more specific loading state for Google -->
                        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700 dark:text-zinc-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                     {:else}
                        <svg class="w-5 h-5 mr-2 -ml-1" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 110.3 512 0 398.8 0 256S110.3 0 244 0c77.3 0 143.3 30.3 191.3 78.3l-75.8 66.3C334.3 119.9 291.8 99.3 244 99.3c-71.3 0-130 57.8-130 129.3s58.7 129.3 130 129.3c50.3 0 87-20.2 109.3-40.7 22.3-20.5 36.8-51.8 41.8-88.7H244V261.8z"></path></svg>
                        Sign in with Google
                     {/if}
                </button>
            </div>
        </div>

        <div class="mt-6 text-center text-sm">
            <button on:click={() => { isLoginMode = !isLoginMode; errorMessage = null; successMessage = null; }}
                    class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                {isLoginMode ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
        </div>
    </div>
</div>

<style>
 .font-sans { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
 :global(body.dark) .bg-red-100 { background-color: theme('colors.red.900'); }
 :global(body.dark) .border-red-400 { border-color: theme('colors.red.700'); }
 :global(body.dark) .text-red-700 { color: theme('colors.red.200'); }

 :global(body.dark) .bg-green-100 { background-color: theme('colors.green.900'); }
 :global(body.dark) .border-green-400 { border-color: theme('colors.green.700'); }
 :global(body.dark) .text-green-700 { color: theme('colors.green.200'); }
</style>