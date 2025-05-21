<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
	import { page } from '$app/stores';
    import { auth } from '$lib/firebase';
    import {
        signInWithEmailAndPassword,
        createUserWithEmailAndPassword,
        GoogleAuthProvider,
        signInWithPopup,
        sendPasswordResetEmail
    } from 'firebase/auth';
    import { browser } from '$app/environment';
    import { enhance } from '$app/forms';
    import type { ActionResult } from '@sveltejs/kit';

    export let form: ActionResult | undefined | null;

    let email = '';
    let password = '';
    let isLoginMode = true;
    let isLoading = false;
    let errorMessage: string | null = null;
    let successMessage: string | null = null;

    let sessionCreateFormElement: HTMLFormElement;

    interface SessionActionPayload {
        success?: boolean;
        message?: string;
        error?: string;
    }
    interface CreateSessionActionResultData {
        session?: SessionActionPayload;
        error?: string;
    }

    const handleSessionFormSubmit: Parameters<typeof enhance>[1] = () => {
        console.log('[Enhance] Submitting session creation form (outer callback)...');
        isLoading = true;
        errorMessage = null;

        return async ({ result, update }) => {
            console.log('[Enhance update callback] Action result:', JSON.stringify(result, null, 2));
            let resultData: CreateSessionActionResultData | undefined = undefined;

            if (result.type === 'success' || result.type === 'failure') {
                resultData = result.data as CreateSessionActionResultData | undefined;
            }

            if (result.type === 'success' && resultData?.session?.success === true) {
                console.log('[Enhance update callback] Session creation successful. Message:', resultData.session.message);
                successMessage = resultData.session.message ?? null;
                await goto('/home');
            } else if (result.type === 'failure') {
                errorMessage = (resultData?.session?.error || resultData?.error) ?? 'Failed to establish server session.';
                console.error('[Enhance update callback] Session creation failed (type: failure):', errorMessage);
                await auth.signOut().catch(e => console.warn("[Enhance update callback] Client signout after session fail error:", e));
            } else if (result.type === 'error') {
                errorMessage = (result.error as Error)?.message || 'An unexpected error occurred.';
                console.error('[Enhance update callback] Form submission error (type: error):', errorMessage);
                await auth.signOut().catch(e => console.warn("[Enhance update callback] Client signout after form error:", e));
            } else if (result.type === 'redirect') {
                console.log('[Enhance update callback] Action resulted in a redirect to:', result.location);
            } else if (result.type === 'success' && !(resultData?.session?.success === true)) {
                errorMessage = resultData?.session?.error ?? 'Session creation reported an issue or returned unexpected data.';
                console.error('[Enhance update callback] Session success type but internal failure/unexpected data:', errorMessage);
                await auth.signOut().catch(e => console.warn("[Enhance update callback] Client signout after unexpected success data:", e));
            }

            await update({ reset: false });
            isLoading = false;
        };
    };

    $: { // Reactive block
        if (form) {
            console.log("[Login Page] Form Prop Updated (reactive block), usually means enhance callback ran:", JSON.stringify(form, null, 2));
            if (form.type === 'failure' && !errorMessage) {
                const formErrorData = form.data as CreateSessionActionResultData | undefined;
                errorMessage = (formErrorData?.session?.error || formErrorData?.error) ?? 'An error occurred (form prop).';
                isLoading = false;
            } else if (form.type === 'error' && !errorMessage) {
                 errorMessage = (form.error as Error)?.message || 'An unexpected error occurred (form prop).';
                 isLoading = false;
            }
            form = null;
        }
    }

    async function processAuthentication(authPromise: Promise<any>, authSource: string) {
        isLoading = true;
        errorMessage = null;
        successMessage = null;
        try {
            const userCredentialOrResult = await authPromise;
            const user = userCredentialOrResult.user;
            console.log(`[Login Page] Client-side ${authSource} auth successful, user UID:`, user.uid);
            const idToken = await user.getIdToken();
            console.log(`[Login Page] ID Token obtained (${authSource}):`, idToken ? `Length: ${idToken.length}` : 'NULL_OR_UNDEFINED');
            if (!idToken) {
                throw new Error("Failed to obtain ID token from Firebase. Cannot create server session.");
            }
            if (sessionCreateFormElement) {
                (sessionCreateFormElement.elements.namedItem('idToken') as HTMLInputElement).value = idToken;
                sessionCreateFormElement.requestSubmit();
            } else {
                console.error("[Login Page] Critical error: Session creation form element not found!");
                errorMessage = "Client-side error: Login form is misconfigured.";
                isLoading = false;
            }
        } catch (error: any) {
            console.error(`[Login Page] Error during ${authSource} or initial ID token fetch:`, error);
            if (authSource === 'Google' && error.code === 'auth/popup-closed-by-user') {
                errorMessage = "Google sign-in was cancelled by user.";
            } else if (authSource === 'Email/Pass' && (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential')) {
                errorMessage = 'Invalid email or password.';
            } else if (authSource === 'Signup' && error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered. Please try logging in.';
            } else {
                errorMessage = error.message || `Failed to ${isLoginMode ? 'log in' : 'sign up'}.`;
            }
            isLoading = false;
        }
    }

    function handleEmailLogin(event: Event) {
        event.preventDefault();
        processAuthentication(signInWithEmailAndPassword(auth, email, password), 'Email/Pass');
    }

    function handleGoogleLogin() {
        const googleProvider = new GoogleAuthProvider();
        processAuthentication(
            signInWithPopup(auth, googleProvider).then(result => {
                if (browser && result.user.displayName) {
                    localStorage.setItem('microtask_username', result.user.displayName);
                }
                return result;
            }),
            'Google'
        );
    }

    function handleSignup(event: Event) {
        event.preventDefault();
        if (password.length < 6) {
            errorMessage = "Password should be at least 6 characters.";
            return;
        }
        processAuthentication(createUserWithEmailAndPassword(auth, email, password), 'Signup');
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
        let processingAuthChange = false;
        unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            if (user && $page.url.pathname === '/login' && !processingAuthChange) {
                processingAuthChange = true;
                console.log('[Login onMount] Client user detected. Attempting server session. UID:', user.uid);
                try {
                    const idToken = await user.getIdToken(true);
                    console.log("[Login onMount] ID Token (onMount):", idToken ? `Length: ${idToken.length}` : 'NULL');
                    if (!idToken) throw new Error("Failed to get ID token in onMount.");
                    if (sessionCreateFormElement) {
                        (sessionCreateFormElement.elements.namedItem('idToken') as HTMLInputElement).value = idToken;
                        sessionCreateFormElement.requestSubmit();
                    } else {
                       throw new Error("Session form not found in onMount!");
                    }
                } catch(error: any) {
                    console.error("[Login onMount] Error auto-session:", error);
                    errorMessage = error.message || "Auto-login failed. Please login manually.";
                    await auth.signOut().catch(e => console.warn("Client signout (onMount error):", e));
                    isLoading = false;
                    processingAuthChange = false;
                }
            } else if (!user) {
                processingAuthChange = false;
            }
        });
        return () => {
            if (unsubscribeAuth) unsubscribeAuth();
        };
    });
</script>

<!-- HTML TEMPLATE REMAINS THE SAME -->
<form
    method="POST"
    action="?/createSession"
    use:enhance={handleSessionFormSubmit}
    bind:this={sessionCreateFormElement}
    style="display: none;"
    id="sessionCreateForm"
>
    <input type="hidden" name="idToken" />
</form>

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
                     {#if isLoading && !successMessage}
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
            <button on:click={() => { isLoginMode = !isLoginMode; errorMessage = null; successMessage = null; email = ''; password = ''; }}
                    class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                {isLoginMode ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
        </div>
    </div>
</div>

<style>
 .font-sans { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
 :global(body.dark .bg-red-100) { background-color: theme('colors.red.900'); }
 :global(body.dark .border-red-400) { border-color: theme('colors.red.700'); }
 :global(body.dark .text-red-700) { color: theme('colors.red.200'); }

 :global(body.dark .bg-green-100) { background-color: theme('colors.green.900'); }
 :global(body.dark .border-green-400) { border-color: theme('colors.green.700'); }
 :global(body.dark .text-green-700) { color: theme('colors.green.100'); }
</style>