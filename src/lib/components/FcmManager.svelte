<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { auth, app } from '$lib/firebase.js'; // Explicitly add .js extension
  import { getMessaging, getToken, onMessage } from 'firebase/messaging';
  import { doc, setDoc, serverTimestamp, collection, getDocs, query, where } from 'firebase/firestore';
  import { db } from '$lib/firebase.js'; // Explicitly add .js extension
  import { user as userStore } from '../stores/authStore.js'; // Relative path with .js extension
  import type { UserState } from '../stores/authStore.js'; // Relative path with .js extension for type import

  let messagingInstance: any = null;
  let currentFcmToken: string | null = null;
  let notificationPermissionStatus: NotificationPermission | null = null;

  async function initializeMessaging() {
    if (!browser || !app || typeof window === 'undefined') return;

    try {
      messagingInstance = getMessaging(app);
      console.log('[FCM Manager] Firebase Messaging initialized.');

      // Handle foreground messages
      onMessage(messagingInstance, (payload) => {
        console.log('[FCM Manager] Message received in foreground: ', payload);
        // Customize how you want to handle the PWA when it's in the foreground
        // e.g., show a custom toast notification within your app
        alert(`New Notification: ${payload.notification?.title}\n${payload.notification?.body}`);
      });

      await requestPermissionAndToken();

    } catch (err) {
      console.error('[FCM Manager] Error initializing messaging:', err);
    }
  }

  async function requestPermissionAndToken() {
    if (!messagingInstance || typeof Notification === 'undefined') return;

    try {
      notificationPermissionStatus = Notification.permission;
      if (notificationPermissionStatus === 'granted') {
        console.log('[FCM Manager] Notification permission already granted.');
        await getAndStoreToken();
      } else if (notificationPermissionStatus === 'default') {
        console.log('[FCM Manager] Requesting notification permission...');
        // No explicit button for now, will request on load if default.
        // Consider adding a button for a better UX.
        const permission = await Notification.requestPermission();
        notificationPermissionStatus = permission;
        if (permission === 'granted') {
          console.log('[FCM Manager] Notification permission granted.');
          await getAndStoreToken();
        } else {
          console.warn('[FCM Manager] Notification permission denied.');
        }
      } else {
        console.warn('[FCM Manager] Notification permission is', notificationPermissionStatus);
      }
    } catch (err) {
      console.error('[FCM Manager] Error requesting permission or getting token:', err);
    }
  }

  async function getAndStoreToken() {
    if (!messagingInstance || !$userStore?.uid) {
      console.log('[FCM Manager] Messaging instance or user UID not available for token.');
      return;
    }

    try {
      // You need to provide your VAPID key to getToken.
      // This key is generated in your Firebase project settings:
      // Project settings > Cloud Messaging > Web configuration > Web Push certificates > Key pair
      const vapidKey = "BOXzGswD4I9fUeh8L-_t0Q7_e_PrT7-_NjfwAPw-_PE-4TuQG_pHBqMUdQMV3TvsOYxL9iMZt2PWpRiIXc4zx3w"; // This is your actual key
      // The check for the placeholder is no longer needed as the key has been set.
      // If it were still the placeholder, getToken would likely fail anyway.

      const token = await getToken(messagingInstance, { vapidKey: vapidKey });
      if (token) {
        currentFcmToken = token;
        console.log('[FCM Manager] FCM Token:', token);
        await storeTokenOnServer(token, $userStore.uid);
      } else {
        console.warn('[FCM Manager] No registration token available. Request permission to generate one.');
        // This might happen if permission was just denied or if there's an issue with the service worker.
      }
    } catch (err) {
      console.error('[FCM Manager] An error occurred while retrieving token. ', err);
      if (String(err).includes('MISSING_GSW_IN_MANIFEST')) {
        console.error("[FCM Manager] Error: Service worker not found. Ensure 'firebase-messaging-sw.js' is in your static folder and accessible, and that your Firebase config in it is correct.");
      }
    }
  }

  async function storeTokenOnServer(token: string, userId: string) {
    if (!userId) {
      console.warn('[FCM Manager] No user ID, cannot store token.');
      return;
    }
    try {
      // Check if this token already exists for this user to avoid duplicates
      const tokensRef = collection(db, 'users', userId, 'fcmTokens');
      const q = query(tokensRef, where('token', '==', token));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        const tokenDocRef = doc(tokensRef); // Auto-generate ID for the token document
        await setDoc(tokenDocRef, {
          token: token,
          createdAt: serverTimestamp(),
          userAgent: navigator.userAgent // Optional: store user agent for context
        });
        console.log('[FCM Manager] FCM token stored on server for user:', userId);
      } else {
        console.log('[FCM Manager] FCM token already exists on server for this user.');
        // Optionally, update the 'updatedAt' timestamp of the existing token document
        querySnapshot.forEach(async (docSnap) => {
            await setDoc(doc(tokensRef, docSnap.id), { updatedAt: serverTimestamp() }, { merge: true });
        });
      }
    } catch (err) {
      console.error('[FCM Manager] Error storing FCM token on server:', err);
    }
  }

  // UserState import moved to the top

  onMount(() => {
    // Wait for user to be potentially available from authStore
    const unsubscribe = userStore.subscribe((currentUser: UserState | null) => {
      if (currentUser?.uid) {
        console.log('[FCM Manager] User identified, attempting to initialize messaging.');
        initializeMessaging();
        // Unsubscribe after first valid user to avoid re-initialization on user changes if not desired
        // or manage token refresh logic if user logs out and logs in as someone else.
        // For simplicity now, we initialize once a user is found.
        if (unsubscribe) unsubscribe();
      } else {
        console.log('[FCM Manager] No user identified yet from store.');
      }
    });

    // Fallback if user is already available but store hasn't emitted yet or for race conditions
    // This timeout is a bit of a hack; a more robust solution might involve an event bus or a store that signals auth readiness.
    setTimeout(() => {
        if (!$userStore?.uid && Notification.permission === 'default') {
            // If still no user after a short delay, and permission is default,
            // we might still want to initialize messaging to allow permission request
            // if the app structure allows for anonymous permission requests.
            // However, storing token requires UID.
            // For now, we strictly tie it to an authenticated user.
        } else if ($userStore?.uid && !messagingInstance) {
            // If user is present but messaging didn't init (e.g. unsubscribe happened too fast)
            console.log('[FCM Manager] Fallback: User identified, attempting to initialize messaging.');
            initializeMessaging();
        }
    }, 1500);


    return () => {
      if (unsubscribe) unsubscribe();
    };
  });

</script>

<!-- This component doesn't render anything visible -->
<!-- You could add a button here to manually request permission if desired -->
<!--
{#if browser && notificationPermissionStatus === 'default'}
  <button on:click={requestPermissionAndToken}>Enable Notifications</button>
{:else if browser && notificationPermissionStatus === 'denied'}
  <p>Notification permission denied. Please enable it in your browser settings.</p>
{/if}
-->