<script lang="ts">
  // Common Svelte and Sapper/Kit imports
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { enhance } from '$app/forms'; // If settings page uses forms that need enhancement
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { fly } from 'svelte/transition';
   import { quintOut } from 'svelte/easing'; // For sidebar transition

  // Lucide icons for Settings page content
  import SunIcon from 'lucide-svelte/icons/sun';
  import MoonIcon from 'lucide-svelte/icons/moon';
  import UserIconLucide from 'lucide-svelte/icons/user';
  import Lock from 'lucide-svelte/icons/lock';
  import Palette from 'lucide-svelte/icons/palette';
  import Trash2 from 'lucide-svelte/icons/trash-2';
  import Eye from 'lucide-svelte/icons/eye';
  import { ListChecks } from 'lucide-svelte/icons';
  import { CalendarDays } from 'lucide-svelte/icons';
  // Header icons (Bell, Help, Profile) are inline SVGs in the new layout

  // Data prop for user info (if passed from a load function)
  export let data: { user?: { name?: string } } = {};

  // --- STATE FOR HEADER & SIDEBAR ---
  let headerUsername: string = data.user?.name || 'User';
  let isSidebarOpen = false;
  let isDarkMode = false; // Single source of truth for theme
  
  // Dropdown IDs for the header icons (bell, help, profile)
  const dropdownIds = ['notifWindow', 'helpWindow', 'profileWindow'];

  // --- STATE FOR SETTINGS PAGE FORMS ---
  let formUsername = ''; // Settings form field for username
  let displayName = '';
  let email = '';
  let bio = '';
  let oldPassword = '';
  let newPassword = '';
  let confirmNewPassword = '';
  let emailNotifications = true;
  let inAppNotifications = true;
  let pushNotifications = true;
  let notificationSounds = true;
  let dndMode = false;
  let defaultTaskView = 'list';
  let defaultTaskReminder = '15';
  let defaultCalendarView = 'month';
  let workingHoursStart = '09:00';
  let workingHoursEnd = '17:00';
  let highContrastMode = false;

  // Reactive update for header username
  $: if (data && data.user?.name && browser) {
      headerUsername = data.user.name;
  } else if (browser && (!data?.user || !data.user.name)) { 
      const storedUser = localStorage.getItem('microtask_username');
      if (storedUser) headerUsername = storedUser;
      else headerUsername = 'User';
  }


  // --- HEADER & SIDEBAR FUNCTIONS ---
  function toggleSidebar() {
      isSidebarOpen = !isSidebarOpen;
  }

  function closeSidebar() {
      isSidebarOpen = false;
  }

  // For the DARK MODE TOGGLE BUTTON IN THE HEADER
  function toggleDarkModeHeaderButton() {
      isDarkMode = !isDarkMode;
      if (browser) {
          document.body.classList.toggle('dark', isDarkMode);
          localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
      }
  }
  
  // For the THEME TOGGLE BUTTON WITHIN THE SETTINGS "Appearance" SECTION
  function toggleSettingsPageThemeButton() {
    isDarkMode = !isDarkMode; 
    if (browser) {
        document.body.classList.toggle('dark', isDarkMode);
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }
    handleAppearanceSave(); 
  }

  // For Bell, Help, Profile dropdowns in the header
  function toggleHeaderWindow(id: string) {
      const el = document.getElementById(id);
      if (el) {
          const isCurrentlyHidden = el.classList.contains('hidden');
          el.classList.toggle('hidden'); 
          if (isCurrentlyHidden) { 
              closeOtherHeaderWindows(id); 
          }
      }
  }

  function closeOtherHeaderWindows(currentId: string) {
      dropdownIds.forEach(id => {
          if (id !== currentId) { 
              const el = document.getElementById(id);
              if (el && !el.classList.contains('hidden')) {
                  el.classList.add('hidden');
              }
          }
      });
  }
  
  function handleLogout() {
      if (browser) {
          localStorage.removeItem('microtask_username');
          document.cookie = "userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax;";
          goto('/login');
      }
  }

  // --- SETTINGS PAGE SPECIFIC SAVE HANDLERS ---
  function handleProfileSave() { console.log('Saving profile:', { formUsername, displayName, email, bio }); }
  function handlePasswordChange() { console.log('Changing password'); }
  function handleAppearanceSave() { console.log('Saving appearance (theme based on isDarkMode):', { isDarkMode }); }
  function handleNotificationSave() { console.log('Saving notification settings:', { emailNotifications, inAppNotifications, pushNotifications, notificationSounds, dndMode }); }
  function handleTaskSettingsSave() { console.log('Saving task settings:', { defaultTaskView, defaultTaskReminder }); }
  function handleCalendarSettingsSave() { console.log('Saving calendar settings:', { defaultCalendarView, workingHoursStart, workingHoursEnd }); }
  function handleAccessibilitySave() { console.log('Saving accessibility settings:', { highContrastMode }); }
  function handleDeleteAccount() { if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) { console.log('Deleting account');}}

  // Variables to store listener functions for proper removal
  let handleGlobalClickListener: ((event: MouseEvent) => void) | null = null;
  let handleEscKeyListener: ((event: KeyboardEvent) => void) | null = null;
  
  let bellButtonEl: HTMLElement | null = null;
  let helpButtonEl: HTMLElement | null = null;
  let profileButtonEl: HTMLElement | null = null;
  let darkModeHeaderToggleEl: HTMLElement | null = null;

  const bellClickListener = (e: Event) => { e.stopPropagation(); toggleHeaderWindow('notifWindow'); };
  const helpClickListener = (e: Event) => { e.stopPropagation(); toggleHeaderWindow('helpWindow'); };
  const profileClickListener = (e: Event) => { e.stopPropagation(); toggleHeaderWindow('profileWindow'); };

  onMount(() => {
      if (browser) {
        const storedDarkMode = localStorage.getItem('theme');
        if (storedDarkMode === 'dark' || (!storedDarkMode && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            isDarkMode = true;
            document.body.classList.add('dark');
        } else {
            isDarkMode = false;
            document.body.classList.remove('dark');
        }

        const localUsername = localStorage.getItem('microtask_username');
        if (localUsername && localUsername !== headerUsername) {
            headerUsername = localUsername;
        }
      }
      // TODO: Fetch actual user settings data here and populate form fields for Settings page

      bellButtonEl = document.getElementById('bellIcon');
      if (bellButtonEl) bellButtonEl.addEventListener('click', bellClickListener);
      
      helpButtonEl = document.getElementById('helpIcon');
      if (helpButtonEl) helpButtonEl.addEventListener('click', helpClickListener);

      profileButtonEl = document.getElementById('profileIcon');
      if (profileButtonEl) profileButtonEl.addEventListener('click', profileClickListener);
      
      darkModeHeaderToggleEl = document.getElementById('darkModeToggle'); 
      if (darkModeHeaderToggleEl) darkModeHeaderToggleEl.addEventListener('click', toggleDarkModeHeaderButton);

      handleGlobalClickListener = (event: MouseEvent) => {
          const target = event.target as Node | null;
          let isClickInsideHeaderDropdownTrigger = false;
          const headerTriggerIds = ['bellIcon', 'helpIcon', 'profileIcon'];
          headerTriggerIds.forEach(triggerId => {
              const triggerEl = document.getElementById(triggerId);
              if (triggerEl && triggerEl.contains(target)) isClickInsideHeaderDropdownTrigger = true;
          });

          let isClickInsideHeaderDropdownWindow = false;
          dropdownIds.forEach(windowId => {
              const windowEl = document.getElementById(windowId);
              if (windowEl && !windowEl.classList.contains('hidden') && windowEl.contains(target)) {
                isClickInsideHeaderDropdownWindow = true;
              }
          });
          
          if (!isClickInsideHeaderDropdownTrigger && !isClickInsideHeaderDropdownWindow) {
              closeOtherHeaderWindows(''); 
          }

          const sidebarEl = document.getElementById('sidebar');
          const hamburgerButton = document.getElementById('hamburgerButton');
          if (isSidebarOpen && sidebarEl && !sidebarEl.contains(target) && hamburgerButton && !hamburgerButton.contains(target)) {
              closeSidebar();
          }
      };
      document.addEventListener('click', handleGlobalClickListener);
      
      handleEscKeyListener = (event: KeyboardEvent) => {
          if (event.key === 'Escape') {
              if (isSidebarOpen) closeSidebar();
              closeOtherHeaderWindows(''); 
          }
      };
      document.addEventListener('keydown', handleEscKeyListener);

      return () => {
          if (handleGlobalClickListener) document.removeEventListener('click', handleGlobalClickListener);
          if (handleEscKeyListener) document.removeEventListener('keydown', handleEscKeyListener);
          
          if (bellButtonEl) bellButtonEl.removeEventListener('click', bellClickListener);
          if (helpButtonEl) helpButtonEl.removeEventListener('click', helpClickListener);
          if (profileButtonEl) profileButtonEl.removeEventListener('click', profileClickListener);
          if (darkModeHeaderToggleEl) darkModeHeaderToggleEl.removeEventListener('click', toggleDarkModeHeaderButton);
      };
  });
</script>

<svelte:head>
    <title>Settings - Microtask</title>
</svelte:head>

<div class={`flex h-screen font-sans ${isDarkMode ? 'text-zinc-300' : 'text-gray-800'}`}>
  {#if isSidebarOpen}
    <aside
        id="sidebar"
        class={`fixed top-0 left-0 h-full w-64 shadow-lg z-50 flex flex-col justify-between p-4 border-r
               ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}
        transition:fly={{ x: -300, duration: 300, easing: quintOut }}
    >
      <div>
        <div class="flex items-center gap-2 mb-8 pb-4 border-b ${isDarkMode ? 'border-zinc-700' : 'border-gray-200'}">
          <img src="/logonamin.png" alt="Microtask Logo" class="w-8 h-8" />
          <h1 class={`text-xl font-bold ${isDarkMode ? 'text-zinc-100' : 'text-gray-800'}`}>Microtask</h1>
        </div>
        <nav class="flex flex-col gap-2">
          <a href="/home"
             class="flex items-center gap-3 px-3 py-2 rounded-md font-semibold transition-colors duration-150"
             class:bg-blue-600={!isDarkMode && ($page.url.pathname === '/home' || $page.url.pathname === '/')}
             class:bg-blue-700={isDarkMode && ($page.url.pathname === '/home' || $page.url.pathname === '/')}
             class:text-white={$page.url.pathname === '/home' || $page.url.pathname === '/'}
             class:text-gray-700={!isDarkMode && !($page.url.pathname === '/home' || $page.url.pathname === '/')}
             class:text-zinc-300={isDarkMode && !($page.url.pathname === '/home' || $page.url.pathname === '/')}
             class:hover:bg-gray-100={!isDarkMode} class:hover:bg-zinc-700={isDarkMode}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5" aria-hidden="true">
              <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
              <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
            </svg>
            <span>Home</span>
          </a>
          <a href="/dashboard"
             class="flex items-center gap-3 px-3 py-2 rounded-md font-semibold transition-colors duration-150"
             class:bg-blue-600={!isDarkMode && $page.url.pathname === '/dashboard'}
             class:bg-blue-700={isDarkMode && $page.url.pathname === '/dashboard'}
             class:text-white={$page.url.pathname === '/dashboard'}
             class:text-gray-700={!isDarkMode && $page.url.pathname !== '/dashboard'}
             class:text-zinc-300={isDarkMode && $page.url.pathname !== '/dashboard'}
             class:hover:bg-gray-100={!isDarkMode} class:hover:bg-zinc-700={isDarkMode}
          >
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M1 4a1 1 0 011-1h16a1 1 0 011 1v2.5a1 1 0 01-1 1H2a1 1 0 01-1-1V4zM2 9.5a1 1 0 011-1h4.5a1 1 0 011 1v6.5a1 1 0 01-1 1H3a1 1 0 01-1-1V9.5zM12.5 9.5A1 1 0 0011.5 10.5v6.5a1 1 0 001 1h4.5a1 1 0 001-1V9.5a1 1 0 00-1-1h-4.5z" clip-rule="evenodd" /></svg>
            <span>Dashboard</span>
          </a>
          <a href="/tasks"
            class="flex items-center gap-3 px-3 py-2 rounded-md font-semibold transition-colors duration-150"
             class:bg-blue-600={!isDarkMode && $page.url.pathname.startsWith('/tasks')}
             class:bg-blue-700={isDarkMode && $page.url.pathname.startsWith('/tasks')}
             class:text-white={$page.url.pathname.startsWith('/tasks')}
             class:text-gray-700={!isDarkMode && !$page.url.pathname.startsWith('/tasks')}
             class:text-zinc-300={isDarkMode && !$page.url.pathname.startsWith('/tasks')}
             class:hover:bg-gray-100={!isDarkMode} class:hover:bg-zinc-700={isDarkMode}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
            </svg>
            <span>All Tasks</span>
          </a>
          <a href="/calendar"
             class="flex items-center gap-3 px-3 py-2 rounded-md font-semibold transition-colors duration-150"
             class:bg-blue-600={!isDarkMode && $page.url.pathname === '/calendar'}
             class:bg-blue-700={isDarkMode && $page.url.pathname === '/calendar'}
             class:text-white={$page.url.pathname === '/calendar'}
             class:text-gray-700={!isDarkMode && $page.url.pathname !== '/calendar'}
             class:text-zinc-300={isDarkMode && $page.url.pathname !== '/calendar'}
             class:hover:bg-gray-100={!isDarkMode} class:hover:bg-zinc-700={isDarkMode}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5" aria-hidden="true">
              <path fill-rule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zM5.25 6.75c-.621 0-1.125.504-1.125 1.125V18a1.125 1.125 0 001.125 1.125h13.5A1.125 1.125 0 0019.875 18V7.875c0-.621-.504-1.125-1.125-1.125H5.25z" clip-rule="evenodd" /><path d="M10.5 9.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H10.5v-.01a.75.75 0 000-1.5zM10.5 12.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H10.5v-.01a.75.75 0 000-1.5zM10.5 15.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H10.5v-.01a.75.75 0 000-1.5zM13.5 9.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H13.5v-.01a.75.75 0 000-1.5zM13.5 12.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H13.5v-.01a.75.75 0 000-1.5zM13.5 15.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H13.5v-.01a.75.75 0 000-1.5zM16.5 9.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H16.5v-.01a.75.75 0 000-1.5zM16.5 12.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H16.5v-.01a.75.75 0 000-1.5zM16.5 15.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H16.5v-.01a.75.75 0 000-1.5z"/></svg>
            <span>Calendar</span>
          </a>
          <a href="/workspace"
             class="flex items-center gap-3 px-3 py-2 rounded-md font-semibold transition-colors duration-150"
             class:bg-blue-600={!isDarkMode && $page.url.pathname.startsWith('/workspace')}
             class:bg-blue-700={isDarkMode && $page.url.pathname.startsWith('/workspace')}
             class:text-white={$page.url.pathname.startsWith('/workspace')}
             class:text-gray-700={!isDarkMode && !$page.url.pathname.startsWith('/workspace')}
             class:text-zinc-300={isDarkMode && !$page.url.pathname.startsWith('/workspace')}
             class:hover:bg-gray-100={!isDarkMode} class:hover:bg-zinc-700={isDarkMode}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.098a2.25 2.25 0 0 1-2.25 2.25h-12a2.25 2.25 0 0 1-2.25-2.25V14.15M18 18.75h.75A2.25 2.25 0 0 0 21 16.5v-1.5a2.25 2.25 0 0 0-2.25-2.25h-15A2.25 2.25 0 0 0 1.5 15v1.5A2.25 2.25 0 0 0 3.75 18.75H4.5M12 12.75a3 3 0 0 0-3-3H5.25V7.5a3 3 0 0 1 3-3h7.5a3 3 0 0 1 3 3v2.25H15a3 3 0 0 0-3 3Z" />
            </svg>
            <span>Workspace</span>
          </a>
          <a href="/ai-chat"
            class="flex items-center gap-3 px-3 py-2 rounded-md font-semibold transition-colors duration-150"
            class:bg-blue-600={!isDarkMode && $page.url.pathname === '/ai-chat'}
            class:bg-blue-700={isDarkMode && $page.url.pathname === '/ai-chat'}
            class:text-white={$page.url.pathname === '/ai-chat'}
            class:text-gray-700={!isDarkMode && $page.url.pathname !== '/ai-chat'}
            class:text-zinc-300={isDarkMode && $page.url.pathname !== '/ai-chat'}
            class:hover:bg-gray-100={!isDarkMode} class:hover:bg-zinc-700={isDarkMode}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5" aria-hidden="true"><path d="M12.001 2.504a2.34 2.34 0 00-2.335 2.335v.583c0 .582.212 1.13.582 1.556l.03.035-.03.034a2.34 2.34 0 00-2.917 3.916A3.287 3.287 0 004.08 14.25a3.287 3.287 0 003.287 3.287h8.266a3.287 3.287 0 003.287-3.287 3.287 3.287 0 00-1.253-2.583 2.34 2.34 0 00-2.917-3.916l-.03-.034.03-.035c.37-.425.582-.973.582-1.555v-.583a2.34 2.34 0 00-2.335-2.336h-.002zM9.75 12.75a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5z" /><path fill-rule="evenodd" d="M12 1.5c5.79 0 10.5 4.71 10.5 10.5S17.79 22.5 12 22.5 1.5 17.79 1.5 12 6.21 1.5 12 1.5zM2.85 12a9.15 9.15 0 019.15-9.15 9.15 9.15 0 019.15 9.15 9.15 9.15 0 01-9.15 9.15A9.15 9.15 0 012.85 12z" clip-rule="evenodd" /></svg>
            <span>Ask Synthia</span>
          </a>
        </nav>
      </div>
      <button on:click={handleLogout} class="flex items-center gap-3 px-3 py-2 rounded-md font-semibold w-full mt-auto transition-colors duration-150" class:hover:bg-gray-100={!isDarkMode} class:hover:bg-zinc-700={isDarkMode} class:text-gray-700={!isDarkMode} class:text-zinc-300={isDarkMode}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
        <span>Log out</span>
      </button>
    </aside>
  {/if}

  <div class="flex-1 flex flex-col overflow-hidden">
    <!-- HEADER with NEW icon layout -->
    <header class={`top-header ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>
      <div class="header-left">
        <button id="hamburgerButton" class="menu-btn" on:click={toggleSidebar} aria-label="Toggle Sidebar">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
        </button>
        <a href="/home" class="logo flex items-center gap-2 no-underline">
            <img src="/logonamin.png" alt="Microtask Logo" class="h-8 w-auto">
            <span class={`font-semibold text-xl ${isDarkMode ? 'text-zinc-100' : 'text-gray-800'}`}>Microtask</span>
        </a>
      </div>
      <div class="header-icons">
        <div class="relative">
          <button id="bellIcon" aria-label="Notifications" class="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-600 dark:text-zinc-400">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5" aria-hidden="true"><path fill-rule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0c-1.673-.253-3.287-.673-4.831-1.243a.75.75 0 01-.297-1.206C4.45 13.807 5.25 11.873 5.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0H9.752z" clip-rule="evenodd" /></svg>
          </button>
          <div id="notifWindow" class={`dropdown-window hidden w-80 max-h-96 overflow-y-auto custom-scrollbar ${isDarkMode ? 'bg-zinc-700 border-zinc-600 text-zinc-300' : 'bg-white border-gray-200 text-gray-700'}`}>
            <h3 class="font-semibold mb-2 text-sm">Notifications</h3> <p class="text-xs text-center py-4">No new notifications.</p>
          </div>
        </div>
        <div class="relative">
          <button id="helpIcon" aria-label="Help & FAQ" class="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-600 dark:text-zinc-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5" aria-hidden="true"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.042.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" /></svg>
          </button>
          <div id="helpWindow" class={`dropdown-window hidden ${isDarkMode ? 'bg-zinc-700 border-zinc-600 text-zinc-300' : 'bg-white border-gray-200 text-gray-700'}`}>
            <h3 class="font-semibold mb-2 text-sm">FAQ</h3><ul class="list-disc list-inside space-y-1 text-xs"><li>How do I add a task?</li><li>Where is the calendar?</li></ul><a href="/support" class="text-xs text-blue-500 dark:text-blue-400 hover:underline mt-2 block">Visit Support</a>
          </div>
        </div>
        <div class="relative">
          <button id="profileIcon" aria-label="Profile Menu" class="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-600 dark:text-zinc-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5" aria-hidden="true"><path fill-rule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clip-rule="evenodd" /></svg>
          </button>
          <div id="profileWindow" class={`dropdown-window hidden ${isDarkMode ? 'bg-zinc-700 border-zinc-600 text-zinc-300' : 'bg-white border-gray-200 text-gray-700'}`}>
            <h3 class="font-semibold mb-2 text-sm">Profile</h3>
            <p class="text-xs mb-2 truncate">Welcome, {headerUsername || 'User'}!</p>
            <a href="/settings" class={`block text-xs px-2 py-1.5 rounded w-full text-left mb-1 transition-colors duration-150 ${isDarkMode ? 'bg-zinc-600 hover:bg-zinc-500 text-zinc-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>Settings</a>
            <button on:click={handleLogout} class={`text-xs px-2 py-1.5 rounded w-full text-left transition-colors duration-150 ${isDarkMode ? 'bg-red-700 hover:bg-red-600 text-zinc-300' : 'bg-red-100 hover:bg-red-200 text-red-700'}`}>Logout</button>
          </div>
        </div>
        <button id="darkModeToggle" on:click={toggleDarkModeHeaderButton} aria-label="Toggle Dark Mode" class={`ml-2 p-1.5 rounded-full transition-colors duration-150 ${isDarkMode ? 'hover:bg-zinc-700 text-zinc-300' : 'hover:bg-gray-100 text-gray-700'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
            {#if isDarkMode} <path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 0 0-.103.103l1.132 1.132a.75.75 0 0 0 1.06 0l1.132-1.132a.75.75 0 0 0-.103-1.06l-1.132-1.132a.75.75 0 0 0-1.06 0L9.63 1.615a.75.75 0 0 0-.102.103ZM12 3.75a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75ZM18.282 5.282a.75.75 0 0 0-1.06 0l-1.132 1.132a.75.75 0 0 0 .103 1.06l1.132 1.132a.75.75 0 0 0 1.06 0l1.132-1.132a.75.75 0 0 0-.103-1.06l-1.132-1.132a.75.75 0 000-.103ZM19.5 12a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5a.75.75 0 01.75.75ZM18.282 18.718a.75.75 0 000 1.06l1.132 1.132a.75.75 0 001.06 0l1.132-1.132a.75.75 0 00-.103-1.06l-1.132-1.132a.75.75 0 00-1.06 0l-1.132 1.132a.75.75 0 00.103.103ZM12 18.75a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5a.75.75 0 01.75.75ZM5.718 18.718a.75.75 0 001.06 0l1.132-1.132a.75.75 0 00-.103-1.06l-1.132-1.132a.75.75 0 00-1.06 0L4.586 17.686a.75.75 0 00.103 1.06l1.132 1.132a.75.75 0 000-.103ZM4.5 12a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75ZM5.718 5.282a.75.75 0 000-1.06l-1.132-1.132a.75.75 0 00-1.06 0L2.39 4.114a.75.75 0 00.103 1.06l1.132 1.132a.75.75 0 001.06 0l1.132-1.132a.75.75 0 00-.103-.103ZM12 6.75a5.25 5.25 0 015.25 5.25 5.25 5.25 0 01-5.25 5.25 5.25 5.25 0 01-5.25-5.25 5.25 5.25 0 015.25-5.25Z" clip-rule="evenodd" />
            {:else} <path fill-rule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM12 16.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 010 9Z" clip-rule="evenodd" /> {/if}
          </svg>
        </button>
      </div>
    </header>

    <!-- Main Settings Content Area -->
    <main class="flex-1 p-6 md:p-10 overflow-y-auto pt-[calc(60px+1.5rem)] md:pt-[calc(60px+2.5rem)] bg-gray-100 dark:bg-zinc-900">
      <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-8">Settings</h1>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-8">
          <section class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-6 flex items-center">
              <UserIconLucide class="mr-2 w-5 h-5" /> Profile
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="displayName" class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Display Name</label>
                <input type="text" id="displayName" bind:value={displayName} class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500" placeholder="Your Name">
              </div>
              <div>
                <label for="formUsername" class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Username</label>
                <input type="text" id="formUsername" bind:value={formUsername} class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500" placeholder="your_username">
              </div>
              <div class="md:col-span-2">
                <label for="email" class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Email</label>
                <input type="email" id="email" bind:value={email} class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500" placeholder="you@example.com">
              </div>
              <div class="md:col-span-2">
                <label for="bio" class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Bio/About Me</label>
                <textarea id="bio" bind:value={bio} rows="3" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500" placeholder="Tell us a bit about yourself..."></textarea>
              </div>
              <div class="md:col-span-2">
                <label for="profilePicture" class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Profile Picture</label>
                <input type="file" id="profilePicture" class="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-800">
              </div>
            </div>
            <button on:click={handleProfileSave} class="mt-6 w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150">
              Save Profile Info
            </button>
          </section>

          <section class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-6 flex items-center">
              <Lock class="mr-2 w-5 h-5" /> Password
            </h2>
            <div class="space-y-4">
              <div>
                <label for="oldPassword" class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Old Password</label>
                <input type="password" id="oldPassword" bind:value={oldPassword} class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500">
              </div>
              <div>
                <label for="newPassword" class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">New Password</label>
                <input type="password" id="newPassword" bind:value={newPassword} class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500">
              </div>
              <div>
                <label for="confirmNewPassword" class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Confirm New Password</label>
                <input type="password" id="confirmNewPassword" bind:value={confirmNewPassword} class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500">
              </div>
            </div>
            <button on:click={handlePasswordChange} class="mt-6 w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150">
              Change Password
            </button>
          </section>
        </div>

        <div class="lg:col-span-1 space-y-8">
          <section class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-6 flex items-center">
              <Palette class="mr-2 w-5 h-5" /> Appearance
            </h2>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-300">Theme</span>
                <button on:click={toggleSettingsPageThemeButton} class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                  {#if !isDarkMode}
                    <MoonIcon class="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  {:else}
                    <SunIcon class="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  {/if}
                </button>
              </div>
            </div>
             <button on:click={handleAppearanceSave} class="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150">
              Save Appearance
            </button>
          </section>

          <section class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-6 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="mr-2 w-5 h-5" aria-hidden="true"><path fill-rule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0c-1.673-.253-3.287-.673-4.831-1.243a.75.75 0 01-.297-1.206C4.45 13.807 5.25 11.873 5.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0H9.752z" clip-rule="evenodd" /></svg>
               Notifications
            </h2>
            <div class="space-y-3">
              <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" bind:checked={emailNotifications} class="form-checkbox h-5 w-5 text-blue-600 rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                <span class="text-sm text-gray-600 dark:text-gray-300">Email Notifications</span>
              </label>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" bind:checked={inAppNotifications} class="form-checkbox h-5 w-5 text-blue-600 rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                <span class="text-sm text-gray-600 dark:text-gray-300">In-App Notifications</span>
              </label>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" bind:checked={pushNotifications} class="form-checkbox h-5 w-5 text-blue-600 rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                <span class="text-sm text-gray-600 dark:text-gray-300">Push Notifications</span>
              </label>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" bind:checked={notificationSounds} class="form-checkbox h-5 w-5 text-blue-600 rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                <span class="text-sm text-gray-600 dark:text-gray-300">Notification Sounds</span>
              </label>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" bind:checked={dndMode} class="form-checkbox h-5 w-5 text-blue-600 rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                <span class="text-sm text-gray-600 dark:text-gray-300">Do Not Disturb Mode</span>
              </label>
            </div>
            <button on:click={handleNotificationSave} class="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150">
              Save Notifications
            </button>
          </section>

          <section class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-6 flex items-center">
              <ListChecks class="mr-2 w-5 h-5" /> Task Settings
            </h2>
            <div class="space-y-4">
              <div>
                <label for="defaultTaskView" class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Default Task View</label>
                <select id="defaultTaskView" bind:value={defaultTaskView} class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500">
                  <option value="list">List</option>
                  <option value="board">Board</option>
                </select>
              </div>
              <div>
                <label for="defaultTaskReminder" class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Default Reminder Time (minutes before)</label>
                <input type="number" id="defaultTaskReminder" bind:value={defaultTaskReminder} min="0" class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500">
              </div>
            </div>
            <button on:click={handleTaskSettingsSave} class="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150">
              Save Task Settings
            </button>
          </section>

          <section class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-6 flex items-center">
              <CalendarDays class="mr-2 w-5 h-5" /> Calendar Settings
            </h2>
            <div class="space-y-4">
              <div>
                <label for="defaultCalendarView" class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Default Calendar View</label>
                <select id="defaultCalendarView" bind:value={defaultCalendarView} class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500">
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Working Hours</label>
                <div class="flex items-center space-x-2">
                  <input type="time" bind:value={workingHoursStart} class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500">
                  <span class="text-gray-500 dark:text-gray-400">to</span>
                  <input type="time" bind:value={workingHoursEnd} class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500">
                </div>
              </div>
            </div>
            <button on:click={handleCalendarSettingsSave} class="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150">
              Save Calendar Settings
            </button>
          </section>

          <section class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-6 flex items-center">
              <Eye class="mr-2 w-5 h-5" /> Accessibility
            </h2>
            <div class="space-y-3">
              <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" bind:checked={highContrastMode} class="form-checkbox h-5 w-5 text-blue-600 rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                <span class="text-sm text-gray-600 dark:text-gray-300">High Contrast Mode</span>
              </label>
            </div>
            <button on:click={handleAccessibilitySave} class="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150">
              Save Accessibility Settings
            </button>
          </section>

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
    </main>
     <footer class="text-center p-4 text-sm text-gray-500 dark:text-zinc-400 border-t dark:border-zinc-700 border-gray-200 flex-shrink-0">
			Microtask © {new Date().getFullYear()}
		</footer>
  </div>
</div>

<style>
  :global(a.bg-blue-600 svg), :global(a.bg-blue-700 svg),
  :global(a.dark\:bg-blue-700 svg), :global(a.dark\:bg-blue-800 svg) {
      fill: white !important;
      stroke: white !important;
  }
  :global(a.bg-blue-600 img), :global(a.bg-blue-700 img),
  :global(a.dark\:bg-blue-700 img), :global(a.dark\:bg-blue-800 img) {
      filter: brightness(0) invert(1);
  }

  .top-header {
      position: fixed; top: 0; left: 0; right: 0;
      width: 100%;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 1rem; height: 60px; z-index: 40;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      transition: background-color 0.2s, border-color 0.2s;
  }

  .header-left { display: flex; align-items: center; gap: 0.75rem; }
  .top-header .menu-btn {
      background: none; border: none; cursor: pointer; padding: 0.5rem;
      border-radius: 9999px; transition: background-color 0.15s ease;
      display: flex; align-items: center; justify-content: center;
      color: inherit;
  }
  .top-header .menu-btn:hover { background-color: #f3f4f6; }
  :global(.dark) .top-header .menu-btn:hover { background-color: #374151; }

  .top-header .logo {
      display: flex; align-items: center; gap: 0.5rem;
      font-weight: 600; font-size: 1.125rem; text-decoration: none;
  }

  .top-header .header-icons { display: flex; align-items: center; gap: 0.25rem; }
  .top-header .header-icons button,
  .top-header .header-icons .relative > button {
      background: none; border: none; cursor: pointer; padding: 0.5rem;
      line-height: 0; display: flex; align-items: center; justify-content: center;
      border-radius: 9999px; width: 36px; height: 36px;
      transition: background-color 0.15s ease;
      color: inherit;
  }
  .top-header .header-icons button:hover,
  .top-header .header-icons .relative > button:hover {
    background-color: #f3f4f6;
  }
  :global(.dark) .top-header .header-icons button:hover,
  :global(.dark) .top-header .header-icons .relative > button:hover {
    background-color: #374151;
  }

  .dropdown-window {
      position: absolute; right: 0; top: calc(100% + 8px);
      border-radius: 0.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      padding: 0.75rem;
      z-index: 50;
      opacity: 0; transform: translateY(-5px) scale(0.98);
      transition: opacity 0.15s ease-out, transform 0.15s ease-out;
      pointer-events: none; visibility: hidden;
  }
  .dropdown-window:not(.hidden) {
      opacity: 1; transform: translateY(0) scale(1);
      pointer-events: auto; visibility: visible;
  }
  .dropdown-window.hidden { display: none !important; }

  :global(body.dark) {
      background-color: #18181b; 
      color: #d1d5db;
  }
  /* Apply to the main settings container too for consistency */
  .dark\:bg-zinc-900 {
    background-color: #18181b;
  }
  .dark\:text-gray-200 {
    color: #e5e7eb;
  }

  :global(body.dark .top-header) { background-color: #1f2937; border-bottom-color: #374151; }
  :global(body.dark .dropdown-window) { background-color: #374151; border-color: #4b5563; color: #f3f4f6; }
  
  .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 3px; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #c5c5c5; border-radius: 3px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
  :global(.dark) .custom-scrollbar::-webkit-scrollbar-track { background: #2d3748; }
  :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb { background: #4a5568; }
  :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #718096; }

  /* Ensure Tailwind form inputs respect dark mode (if not using @tailwindcss/forms) */
  :global(.dark input[type="text"]),
  :global(.dark input[type="email"]),
  :global(.dark input[type="password"]),
  :global(.dark input[type="number"]),
  :global(.dark input[type="time"]),
  :global(.dark input[type="date"]),
  :global(.dark textarea),
  :global(.dark select) {
    background-color: #374151; /* zinc-700 / gray-700 */
    border-color: #4b5563; /* zinc-600 / gray-600 */
    color: #e5e7eb; /* gray-200 */
  }
  :global(.dark input[type="text"]::placeholder),
  :global(.dark input[type="email"]::placeholder),
  :global(.dark textarea::placeholder) {
    color: #9ca3af; /* gray-400 */
  }
  :global(.dark .form-checkbox) {
    background-color: #4b5563; /* zinc-600 / gray-600 */
    border-color: #6b7280; /* zinc-500 / gray-500 */
  }
  :global(.dark .form-checkbox:checked) {
    background-color: #2563eb; /* blue-600 */
    border-color: #2563eb;
  }
  :global(.dark input[type="file"]::file-selector-button) {
    background-color: #1e3a8a; /* blue-900 */
    color: #93c5fd; /* blue-300 */
  }
  :global(.dark input[type="file"]::file-selector-button:hover) {
    background-color: #1e40af; /* blue-800 */
  }

</style>