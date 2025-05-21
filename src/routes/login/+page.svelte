<script lang="ts">
    import { onMount } from 'svelte';
    import { goto, page } from '$app/stores';
    import { auth } from '$lib/firebase';
    import {
        signInWithEmailAndPassword,
        createUserWithEmailAndPassword,
        GoogleAuthProvider,
        signInWithPopup,
        sendPasswordResetEmail
    } from 'firebase/auth';
    import { browser } from '$app/environment';
    import { enhance } from '$app/forms'; // Import enhance for form submissions
    import type { ActionResult } from '@sveltejs/kit'; // For typing the form result

    // This variable will hold the result of the form action
    export let form: ActionResult | undefined | null;


    let email = '';
    let password = '';
    let isLoginMode = true;
    let isLoading = false; // General loading state for the whole login/signup process
    let isCreatingSession = false; // Specific loading state for session creation step
    let errorMessage: string | null = null;
    let successMessage: string | null = null;

    // This hidden form will be submitted programmatically
    let sessionFormElement: HTMLFormElement;

    async function createServerSessionViaFormAction(idToken: string) {
        if (!sessionFormElement) {
            console.error("[Login Page] Session form element not found!");
            errorMessage = "Client error: Could not initiate session creation.";
            return false;
        }
        if (!idToken || typeof idToken !== 'string' || idToken.trim() === "") {
            console.error('[Login Page] createServerSessionViaFormAction called with invalid idToken:', idToken);
            errorMessage = 'Authentication token is missing. Cannot complete login.';
            return false;
        }

        console.log('[Login Page] Preparing to submit session form with idToken...');
        isCreatingSession = true; // Indicate session creation is in progress
        errorMessage = null; // Clear previous errors

        const formData = new FormData();
        formData.append('idToken', idToken);

        // Programmatically submit the hidden form
        // The `enhance` directive on the form will handle the submission
        // We don't use fetch directly here; SvelteKit's form actions + enhance handle it.
        // We need to create a submit event or directly call requestSubmit on the form.
        // For simplicity with enhance, we can just trigger a submit on the form.
        // Ensure the form has an input for idToken or append it.

        // A more robust way with enhance might be to have visible inputs and let enhance handle it,
        // but for programmatic submission like this:
        const idTokenInput = sessionFormElement.elements.namedItem('idToken') as HTMLInputElement;
        if (idTokenInput) {
            idTokenInput.value = idToken;
        } else {
            // If no input, create one (though it's better to have it in the HTML)
            const tempInput = document.createElement('input');
            tempInput.type = 'hidden';
            tempInput.name = 'idToken';
            tempInput.value = idToken;
            sessionFormElement.appendChild(tempInput);
            sessionFormElement.requestSubmit();
            sessionFormElement.removeChild(tempInput); // Clean up
            return; // `enhance` will handle the rest, and we'll react to `form` prop changes
        }
        
        sessionFormElement.requestSubmit(); // This will trigger the 'enhance' logic
        // We don't return true/false directly here anymore.
        // We will react to changes in the `form` prop.
    }

    // Reactive statement to handle form action results
    $: {
        if (form) { // `form` is the prop SvelteKit provides with action results
            console.log("[Login Page] Form Action Result:", form);
            isCreatingSession = false; // Session creation attempt finished
            isLoading = false; // Also general loading

            if (form.type === 'success' && form.data?.session?.success) {
                console.log('[Login Page] Server session reported success:', form.data.session.message);
                // If successful, the login handlers will proceed with goto('/home')
                // We might not need to do anything else here if the calling function handles redirection
            } else if (form.type === 'failure' || (form.data && !form.data.session?.success)) {
                const errorMsg = form.data?.session?.error || form.data?.error || 'Failed to establish server session.';
                console.error('[Login Page] Server session creation failed via form action:', errorMsg);
                errorMessage = errorMsg;
                // The login handlers should call auth.signOut() if session creation fails
            }
            form = null; // Reset form prop to allow reacting to next submission
        }
    }


    async function handleEmailLogin(event: Event) {
        event.preventDefault();
        isLoading = true;
        isCreatingSession = false;
        errorMessage = null;
        successMessage = null;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log("Email/Pass login successful, user UID:", user.uid);

            const idToken = await user.getIdToken();
            console.log("[Login Page] ID Token obtained (Email/Pass):", idToken ? `Length: ${idToken.length}` : 'NULL');
            
            await createServerSessionViaFormAction(idToken);
            // Now we wait for the `form` prop to update from the action result
            // The redirection will happen IF the `form` prop indicates success
            // and the original calling context (this function) can check a flag or be resolved.

            // To handle redirection after form action success:
            // We can't directly await the form prop update here.
            // The goto('/home') needs to happen after `form` indicates success.
            // This can be managed by a slight restructuring or by checking `form` in a loop (not ideal)
            // or by setting a flag that the next reactive update of `form` should trigger goto.

            // Simpler: let the reactive block handle error display, and if no error, assume success from here.
            // The `form` prop will update, and if it's an error, `errorMessage` gets set.
            // If it's success, this function will complete, then isLoading=false.
            // The user experience is: click login -> isLoading=true -> form action runs -> isLoading=false.
            // If errorMessage is still null after this, we can assume success and redirect.

            // This timeout is a workaround to wait for the `form` prop to potentially update
            // It's not ideal. A better way is to make `createServerSessionViaFormAction` return a Promise
            // that resolves/rejects based on the `form` prop update.
            await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to allow `form` to update

            if (!errorMessage) { // If createServerSessionViaFormAction didn't set an error from `form`
                await goto('/home');
            } else {
                 await auth.signOut().catch(e => console.warn("Client signout after Email/Pass session fail:", e));
            }

        } catch (error: any) {
            console.error("Email/Pass login error:", error);
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                errorMessage = 'Invalid email or password.';
            } else {
                errorMessage = error.message || 'Login failed. Please try again.';
            }
            isLoading = false; // Ensure isLoading is false on direct catch
        }
        // isLoading is set to false by the reactive block or finally block if no direct catch.
        // However, for clarity if an error happens before createServerSessionViaFormAction:
        if (isLoading) isLoading = false;
    }

    async function handleGoogleLogin() {
        isLoading = true;
        isCreatingSession = false;
        errorMessage = null;
        successMessage = null;
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            console.log("Google login successful, user UID:", user.uid);

            const idToken = await user.getIdToken();
            console.log("[Login Page] ID Token obtained (Google):", idToken ? `Length: ${idToken.length}` : 'NULL');
            await createServerSessionViaFormAction(idToken);

            await new Promise(resolve => setTimeout(resolve, 100));

            if (!errorMessage) {
                if (browser && user.displayName) {
                    localStorage.setItem('microtask_username', user.displayName);
                }
                await goto('/home');
            } else {
                await auth.signOut().catch(e => console.warn("Client signout after Google session fail:", e));
            }

        } catch (error: any) {
            console.error("Google login error:", error);
            if (error.code === 'auth/popup-closed-by-user'){
                errorMessage = "Google sign-in was cancelled.";
            } else {
                errorMessage = error.message || "Failed to log in with Google.";
            }
            isLoading = false;
        }
        if (isLoading) isLoading = false;
    }

    async function handleSignup(event: Event) {
        event.preventDefault();
        isLoading = true;
        isCreatingSession = false;
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
            console.log("[Login Page] ID Token obtained (Signup):", idToken ? `Length: ${idToken.length}` : 'NULL');
            await createServerSessionViaFormAction(idToken);
            
            await new Promise(resolve => setTimeout(resolve, 100));

            if (!errorMessage) {
                successMessage = "Signup successful! Redirecting...";
                await goto('/home');
            } else {
                await auth.signOut().catch(e => console.warn("Client signout after Signup session fail:", e));
            }
        } catch (error: any) {
            console.error("Signup error:", error);
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered. Try logging in.';
            } else {
                errorMessage = error.message || 'Signup failed. Please try again.';
            }
            isLoading = false;
        }
         if (isLoading) isLoading = false;
    }

    // handlePasswordReset remains the same as it doesn't involve session creation

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
        let processingAuthChange = false;
        unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            if (user && $page.url.pathname === '/login' && !processingAuthChange) {
                processingAuthChange = true;
                isLoading = true;
                console.log('[Login onMount] User client-side signed in. Attempting server session.');
                try {
                    const idToken = await user.getIdToken(true);
                    await createServerSessionViaFormAction(idToken);
                    // Redirection will be handled based on the 'form' prop update
                    // or if an error isn't set after a short delay.
                    await new Promise(resolve => setTimeout(resolve, 100));
                    if (!errorMessage && $page.url.pathname === '/login') { // Check error and still on login page
                        goto('/home', { replaceState: true });
                    } else if (errorMessage) {
                        await auth.signOut().catch(e => console.warn("Client signout (onMount session fail):", e));
                    }
                } catch(error) {
                    console.error("[Login onMount] Error auto-session:", error);
                    errorMessage = "Auto-login failed. Please login manually.";
                    await auth.signOut().catch(e => console.warn("Client signout (onMount error):", e));
                } finally {
                    isLoading = false; // Ensure isLoading is reset
                    processingAuthChange = false;
                }
            }
        });
        return () => {
            if (unsubscribeAuth) unsubscribeAuth();
        };
    });
</script>

<!-- Hidden form for submitting idToken to the createSession action -->
<form method="POST" action="?/createSession" use:enhance bind:this={sessionFormElement} style="display: none;">
    <input type="hidden" name="idToken" />
</form>

<!-- Your existing HTML template for the login form -->
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
                <button type="submit" disabled={isLoading || isCreatingSession}
                        class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-offset-zinc-800 disabled:opacity-70">
                    <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                        {#if isLoading || isCreatingSession}
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
                    {isLoading || isCreatingSession ? 'Processing...' : (isLoginMode ? 'Sign in' : 'Sign up')}
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
                <button on:click={handleGoogleLogin} disabled={isLoading || isCreatingSession}
                        class="w-full inline-flex justify-center py-3 px-4 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm bg-white dark:bg-zinc-700 text-sm font-medium text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-zinc-800 disabled:opacity-70">
                     {#if isLoading || isCreatingSession}
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
 /* Dark mode specific alert/success styles (Tailwind 3.x+) */
 :global(body.dark .bg-red-100) { background-color: theme('colors.red.900'); } /* More direct if theme() works */
 :global(body.dark .border-red-400) { border-color: theme('colors.red.700'); }
 :global(body.dark .text-red-700) { color: theme('colors.red.200'); }

 :global(body.dark .bg-green-100) { background-color: theme('colors.green.900'); }
 :global(body.dark .border-green-400) { border-color: theme('colors.green.700'); }
 :global(body.dark .text-green-700) { color: theme('colors.green.100'); } /* Brighter green text */
</style>