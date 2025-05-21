<script lang="ts">
  import Sun from 'lucide-svelte/icons/sun';
  import Moon from 'lucide-svelte/icons/moon';
  import Bell from 'lucide-svelte/icons/bell';
  import User from 'lucide-svelte/icons/user';
  import Lock from 'lucide-svelte/icons/lock';
  import Palette from 'lucide-svelte/icons/palette';
  import Trash2 from 'lucide-svelte/icons/trash-2';
  import Eye from 'lucide-svelte/icons/eye';
  import ListChecks from 'lucide-svelte/icons/list-checks';
  import CalendarDays from 'lucide-svelte/icons/calendar-days';
  import { onMount } from 'svelte';

  // Reactive variables for form inputs - you'll need to wire these up to your backend/stores
  let username = '';
  let displayName = '';
  let email = '';
  let bio = '';
  // Profile picture would require file handling
  let oldPassword = '';
  let newPassword = '';
  let confirmNewPassword = '';

  let lightMode = true;
  // accentColor and fontSize removed as per feedback

  // Notification preferences (example structure)
  let emailNotifications = true;
  let inAppNotifications = true;
  let pushNotifications = true;
  let notificationSounds = true;
  let dndMode = false;

  // Task settings
  let defaultTaskView = 'list'; // 'list', 'board'
  let defaultTaskReminder = '15'; // minutes

  // Calendar settings
  let defaultCalendarView = 'month'; // 'day', 'week', 'month'
  let workingHoursStart = '09:00';
  let workingHoursEnd = '17:00';

  // Accessibility
  let highContrastMode = false;

  onMount(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      lightMode = false;
      document.body.classList.add('dark');
    } else {
      lightMode = true;
      document.body.classList.remove('dark');
    }
  });

  function toggleTheme() {
    lightMode = !lightMode;
    if (lightMode) {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    // Call save appearance if you want to persist this choice beyond local storage/body class
    handleAppearanceSave();
  }

  function handleProfileSave() {
    console.log('Saving profile:', { username, displayName, email, bio });
    // Add logic to save profile info
  }

  function handlePasswordChange() {
    console.log('Changing password');
    // Add logic to change password
  }

  function handleAppearanceSave() {
    console.log('Saving appearance settings:', { lightMode });
    // Add logic to save appearance settings (e.g., to user preferences in DB)
  }

  function handleNotificationSave() {
    console.log('Saving notification settings:', { emailNotifications, inAppNotifications, pushNotifications, notificationSounds, dndMode });
    // Add logic to save notification settings
  }

  function handleTaskSettingsSave() {
    console.log('Saving task settings:', { defaultTaskView, defaultTaskReminder });
    // Add logic to save task settings
  }

  function handleCalendarSettingsSave() {
    console.log('Saving calendar settings:', { defaultCalendarView, workingHoursStart, workingHoursEnd });
    // Add logic to save calendar settings
  }

  function handleAccessibilitySave() {
    console.log('Saving accessibility settings:', { highContrastMode });
    // Add logic to save accessibility settings
  }

  function handleDeleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      console.log('Deleting account');
      // Add logic to delete account
    }
  }
</script>

<div class="flex flex-col min-h-screen bg-gray-100 dark:bg-zinc-900 text-gray-800 dark:text-gray-200">
  <!-- Placeholder for a potential shared header if you add one to a layout later -->
  <!-- <header class="bg-white dark:bg-zinc-800 shadow p-4">Header Content</header> -->

  <!-- Main Content Area -->
  <div class="flex-1 p-6 md:p-10 overflow-y-auto"> <!-- Ensures this part scrolls -->
    <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-8">Settings</h1>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left Column for Profile & Password -->
      <div class="lg:col-span-2 space-y-8">
        <!-- Profile Section -->
        <section class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-6 flex items-center">
            <User class="mr-2 w-5 h-5" /> Profile
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="displayName" class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Display Name</label>
              <input type="text" id="displayName" bind:value={displayName} class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500" placeholder="Your Name">
            </div>
            <div>
              <label for="username" class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Username</label>
              <input type="text" id="username" bind:value={username} class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500" placeholder="your_username">
            </div>
            <div class="md:col-span-2">
              <label for="email" class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Email</label>
              <input type="email" id="email" bind:value={email} class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500" placeholder="you@example.com">
            </div>
            <div class="md:col-span-2">
              <label for="bio" class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Bio/About Me</label>
              <textarea id="bio" bind:value={bio} rows="3" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500" placeholder="Tell us a bit about yourself..."></textarea>
            </div>
            <div class="md:col-span-2">
              <label for="profilePicture" class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Profile Picture</label>
              <input type="file" id="profilePicture" class="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-800">
              <!-- Add preview for avatar here -->
            </div>
          </div>
          <button on:click={handleProfileSave} class="mt-6 w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150">
            Save Profile Info
          </button>
        </section>

        <!-- Password Section -->
        <section class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-6 flex items-center">
            <Lock class="mr-2 w-5 h-5" /> Password
          </h2>
          <div class="space-y-4">
            <div>
              <label for="oldPassword" class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Old Password</label>
              <input type="password" id="oldPassword" bind:value={oldPassword} class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div>
              <label for="newPassword" class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">New Password</label>
              <input type="password" id="newPassword" bind:value={newPassword} class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div>
              <label for="confirmNewPassword" class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Confirm New Password</label>
              <input type="password" id="confirmNewPassword" bind:value={confirmNewPassword} class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500">
            </div>
          </div>
          <button on:click={handlePasswordChange} class="mt-6 w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150">
            Change Password
          </button>
        </section>
      </div>

      <!-- Right Column for Other Settings -->
      <div class="lg:col-span-1 space-y-8">
        <!-- Appearance Section -->
        <section class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-6 flex items-center">
            <Palette class="mr-2 w-5 h-5" /> Appearance
          </h2>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-600 dark:text-gray-300">Theme</span>
              <button on:click={toggleTheme} class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                {#if lightMode}
                  <Moon class="w-5 h-5 text-gray-600 dark:text-gray-300" />
                {:else}
                  <Sun class="w-5 h-5 text-gray-600 dark:text-gray-300" />
                {/if}
              </button>
            </div>
            <!-- Accent Color and Font Size options removed -->
          </div>
           <!-- Save button for appearance might be optional if theme toggle saves immediately -->
           <!-- You can keep it if other appearance settings are added back later -->
           <button on:click={handleAppearanceSave} class="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150">
            Save Appearance Preferences
          </button>
        </section>

        <!-- Notifications Section -->
        <section class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-6 flex items-center">
            <Bell class="mr-2 w-5 h-5" /> Notifications
          </h2>
          <div class="space-y-3">
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" bind:checked={emailNotifications} class="form-checkbox h-5 w-5 text-blue-600 rounded dark:bg-gray-700 border-gray-300 dark:border-gray-600">
              <span class="text-sm text-gray-600 dark:text-gray-300">Email Notifications</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" bind:checked={inAppNotifications} class="form-checkbox h-5 w-5 text-blue-600 rounded dark:bg-gray-700 border-gray-300 dark:border-gray-600">
              <span class="text-sm text-gray-600 dark:text-gray-300">In-App Notifications</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" bind:checked={pushNotifications} class="form-checkbox h-5 w-5 text-blue-600 rounded dark:bg-gray-700 border-gray-300 dark:border-gray-600">
              <span class="text-sm text-gray-600 dark:text-gray-300">Push Notifications</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" bind:checked={notificationSounds} class="form-checkbox h-5 w-5 text-blue-600 rounded dark:bg-gray-700 border-gray-300 dark:border-gray-600">
              <span class="text-sm text-gray-600 dark:text-gray-300">Notification Sounds</span>
            </label>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" bind:checked={dndMode} class="form-checkbox h-5 w-5 text-blue-600 rounded dark:bg-gray-700 border-gray-300 dark:border-gray-600">
              <span class="text-sm text-gray-600 dark:text-gray-300">Do Not Disturb Mode</span>
            </label>
          </div>
          <button on:click={handleNotificationSave} class="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150">
            Save Notifications
          </button>
        </section>

        <!-- Task Settings Section -->
        <section class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-6 flex items-center">
            <ListChecks class="mr-2 w-5 h-5" /> Task Settings
          </h2>
          <div class="space-y-4">
            <div>
              <label for="defaultTaskView" class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Default Task View</label>
              <select id="defaultTaskView" bind:value={defaultTaskView} class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500">
                <option value="list">List</option>
                <option value="board">Board</option>
              </select>
            </div>
            <div>
              <label for="defaultTaskReminder" class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Default Reminder Time (minutes before)</label>
              <input type="number" id="defaultTaskReminder" bind:value={defaultTaskReminder} min="0" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500">
            </div>
          </div>
          <button on:click={handleTaskSettingsSave} class="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150">
            Save Task Settings
          </button>
        </section>

        <!-- Calendar Settings Section -->
        <section class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-6 flex items-center">
            <CalendarDays class="mr-2 w-5 h-5" /> Calendar Settings
          </h2>
          <div class="space-y-4">
            <div>
              <label for="defaultCalendarView" class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Default Calendar View</label>
              <select id="defaultCalendarView" bind:value={defaultCalendarView} class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500">
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Working Hours</label>
              <div class="flex items-center space-x-2">
                <input type="time" bind:value={workingHoursStart} class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500">
                <span class="text-gray-500 dark:text-gray-400">to</span>
                <input type="time" bind:value={workingHoursEnd} class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500">
              </div>
            </div>
          </div>
          <button on:click={handleCalendarSettingsSave} class="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150">
            Save Calendar Settings
          </button>
        </section>

        <!-- Accessibility Section -->
        <section class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-6 flex items-center">
            <Eye class="mr-2 w-5 h-5" /> Accessibility
          </h2>
          <div class="space-y-3">
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" bind:checked={highContrastMode} class="form-checkbox h-5 w-5 text-blue-600 rounded dark:bg-gray-700 border-gray-300 dark:border-gray-600">
              <span class="text-sm text-gray-600 dark:text-gray-300">High Contrast Mode</span>
            </label>
            <!-- Add more accessibility options as needed -->
          </div>
          <button on:click={handleAccessibilitySave} class="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150">
            Save Accessibility Settings
          </button>
        </section>

        <!-- Account Deletion Section -->
        <section class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 class="text-xl font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center">
            <Trash2 class="mr-2 w-5 h-5" /> Account Deletion
          </h2>
          <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <button on:click={handleDeleteAccount} class="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150">
            Delete My Account
          </button>
        </section>
      </div>
    </div>
  </div>
</div>

<style>
  /* You can add any additional page-specific styles here if needed, */
  /* but Tailwind CSS should cover most styling. */
  /* Ensure your global app.css or layout includes Tailwind directives. */
</style>