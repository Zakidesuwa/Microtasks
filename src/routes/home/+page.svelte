<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { db } from '$lib/firebase.js';
  import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
  import { enhance } from '$app/forms';
  import { slide, scale, fly, fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { goto, invalidateAll } from '$app/navigation';
  import { browser } from '$app/environment';

  let isSidebarOpen = false;
  let showNoteForm = false;
  let editingNoteId: string | null = null;
  let noteTitle = "";
  let noteContent = "";
  let expandedNoteId: string | null = null;
  let username = "";
  let greeting = "GOOD DAY";
  let email = ''; // Not actively used, but kept for potential future use
  let usernameFromUrl = '';
  let isChatExpanded = false;
  let isRefreshingNotes = false;
  let isRefreshingTasks = false;
  let errorMessage: string | null = null;
  let showTaskForm = false;
  let showCompletedTasks = false;
  let showDeleteConfirmation = false;

  let taskTitle = "";
  let taskDescription = "";
  let taskDueDate: string | null = null;
  let taskDueTime: string | null = null;
  let taskPriority: string = 'standard';
  let taskTags: string = '';
  let isDarkMode = false;
  let noTasksTodayMessage = "You have no tasks due today, take a well-deserved break for now view all tasks below!";

  const encouragingMessages = [
    "No tasks today? Enjoy the calm before the next storm of productivity!",
    "Looks like a clear schedule! Time to recharge or tackle a passion project.",
    "Zero tasks on the docket! Maybe it's a sign to get cynthia to assist you in learning something new today?",
    "Your to-do list is empty for today. Embrace the freedom!",
    "No tasks? Perfect day to plan your next big move or simply relax.",
  ];

  function getRandomMessage() {
    return encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
  }

  const dropdownIds = ['notifWindow', 'helpWindow', 'profileWindow'];
  // menuIds removed as dots menus are removed

  interface Task {
    id: string;
    description: string; // Assuming this is used for task title in the list
    isCompleted: boolean;
    createdAt: string | null;
    userId?: string;
    dueDate?: string | null;
    priority?: string | number;
    tags?: string[];
    noteId?: string;
  }

  interface PageData {
    notes?: {
      id: string;
      title: string;
      content: string;
      createdAt: string | null;
      userId?: string;
    }[];
    tasks?: Task[];
    showCompleted?: boolean;
    error?: string;
  }

  export let data: PageData;

  $: {
    if (data?.error) {
      errorMessage = data.error;
    } else {
      errorMessage = null;
    }
    if (data && typeof data.showCompleted === 'boolean') {
      showCompletedTasks = data.showCompleted;
    }
    if (browser && (!data?.tasks || data.tasks.length === 0)) {
      noTasksTodayMessage = getRandomMessage();
    }
  }

  $: if (browser) {
    const aiChatToggle = document.getElementById('aiChatToggle');
    if (aiChatToggle) {
      if (showNoteForm || expandedNoteId !== null || showTaskForm) {
        aiChatToggle.classList.add('hidden');
      } else {
        aiChatToggle.classList.remove('hidden');
      }
    }
  }

  // toggleShowCompleted function is no longer triggered by a menu,
  // if needed, a new UI element should call it.
  // For now, keeping it in case you add a new trigger.
  function toggleShowCompleted() {
    const currentUrl = new URL($page.url);
    const nextShowCompleted = !showCompletedTasks;
    currentUrl.searchParams.set('showCompleted', String(nextShowCompleted));
    goto(currentUrl.href, {
      replaceState: true,
      noScroll: true,
      keepFocus: true,
    });
  }

  function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    if (browser) {
      document.body.classList.toggle('dark', isDarkMode);
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }
  }

  function toggleSidebar() {
    isSidebarOpen = !isSidebarOpen;
  }

  function openAddTaskForm() {
    showTaskForm = true;
    taskTitle = "";
    taskDescription = "";
    taskDueDate = null;
    taskDueTime = null;
    taskPriority = 'standard';
    taskTags = '';
  }

  function closeTaskForm() {
    showTaskForm = false;
    taskTitle = "";
    taskDescription = "";
    taskDueDate = null;
    taskDueTime = null;
    taskPriority = 'standard';
    taskTags = '';
  }

  function closeSidebar() {
    isSidebarOpen = false;
  }

  function toggleWindow(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.toggle('hidden');
    }
  }

  function closeOtherWindows(currentId: string) {
    dropdownIds.forEach(id => {
      if (id !== currentId) {
        const el = document.getElementById(id);
        if (el && !el.classList.contains('hidden')) {
          el.classList.add('hidden');
        }
      }
    });
  }

  function openAddNoteForm() {
    showNoteForm = true;
    editingNoteId = null;
    noteTitle = "";
    noteContent = "";
  }

  function openEditNoteForm(note: { id: string; title: string; content: string }) {
    showNoteForm = true;
    editingNoteId = note.id;
    noteTitle = note.title;
    noteContent = note.content;
  }

  function closeForm() {
    showNoteForm = false;
    noteTitle = "";
    noteContent = "";
    editingNoteId = null;
  }

  const taskAddFormEnhanceCallback = () => {
    return async ({ result, update }: { result: any, update: any }) => {
      if (result.type === 'success' || result.type === 'redirect') {
        closeTaskForm();
        await invalidateAll();
      } else if (result.type === 'failure') {
        console.error("[Home Page / +page.svelte] Task add form submission failure:", result.data);
        const formError = result.data?.taskForm?.error || result.data?.error;
        errorMessage = formError || 'Failed to add task.';
        if (formError && formError.toLowerCase().includes('authentication required')) {
          goto('/login'); // Redirect if auth error
        }
      } else if (result.type === 'error') {
         console.error("[Home Page / +page.svelte] Task add form submission error (enhance):", result.error);
        errorMessage = result.error?.message || 'An unexpected error occurred.';
      }
      await update({ reset: result.type !== 'failure' });
    };
  };

  const noteFormEnhanceCallback = () => {
    return async ({ result, update }: { result: any, update: any }) => {
      if (result.type === 'success' || result.type === 'redirect') {
        closeForm();
        await invalidateAll();
      } else if (result.type === 'failure') {
        console.error("[Home Page / +page.svelte] Note form submission failure:", result.data);
        const formError = result.data?.noteForm?.error || result.data?.error;
        errorMessage = formError || (editingNoteId ? 'Failed to update note.' : 'Failed to add note.');
        if (formError && formError.toLowerCase().includes('authentication required')) {
          goto('/login'); // Redirect if auth error
        }
      } else if (result.type === 'error') {
        console.error("[Home Page / +page.svelte] Note form submission error (enhance):", result.error);
        errorMessage = result.error?.message || 'An unexpected error occurred with the note form.';
      }
       await update({ reset: result.type !== 'failure' });
    };
  };

  const taskFormEnhanceCallback = () => {
    return async ({ result, update }: { result: any, update: any }) => {
      if (result.type === 'failure') {
        console.error("[Home Page / +page.svelte] Task toggle failure:", result.data);
        errorMessage = result.data?.error || 'Failed to update task status.';
        await invalidateAll();
      } else if (result.type === 'error') {
        console.error("[Home Page / +page.svelte] Task toggle error (enhance):", result.error);
        errorMessage = result.error?.message || 'An unexpected error occurred toggling the task.';
        await invalidateAll();
      } else if (result.type === 'success') {
        if (errorMessage?.startsWith('Failed to update task')) {
          errorMessage = null;
        }
        await invalidateAll();
      }
      await update({ reset: false });
    };
  };

  const handleEscKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      if (showNoteForm) closeForm();
      if (showTaskForm) closeTaskForm();
      if (showDeleteConfirmation) showDeleteConfirmation = false;
      if (isSidebarOpen) closeSidebar();
    }
  };

  function getStoredUsername(): string {
    if (browser) {
      return localStorage.getItem('microtask_username') || "User";
    }
    return "User";
  }

  function saveUsername(name: string): void {
    if (browser) {
      localStorage.setItem('microtask_username', name);
    }
  }

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "GOOD MORNING";
    if (hour >= 12 && hour < 18) return "GOOD AFTERNOON";
    return "GOOD EVENING";
  }
  
  async function fetchUsernameFromFirebase() {
    if (!browser) return;
    try {
      const userId = document.cookie
        .split('; ')
        .find(row => row.startsWith('userId='))
        ?.split('=')[1];

      if (userId) {
        const userDocRef = doc(db, 'credentials', userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.username) {
            username = userData.username;
            saveUsername(username);
          } else { username = getStoredUsername(); }
        } else { username = getStoredUsername(); }
      } else { username = getStoredUsername(); }
    } catch (error) {
      console.error("[Home Page / +page.svelte] Error fetching/updating username from Firebase:", error);
      username = getStoredUsername();
    }
  }
  
  function handleLogout() {
    if (browser) {
        localStorage.removeItem('microtask_username');
        document.cookie = "userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax;";
        goto('/login');
    }
  }

  function updateChatWindowStyle() {
    if (!browser || !document.getElementById('aiChatWindow')) return;
    const aiChatWindow = document.getElementById('aiChatWindow');
    const aiExpandedLogo = document.getElementById('aiExpandedLogo');
    const expandChat = document.getElementById('expandChat');
    const chatMessages = document.getElementById('chatMessages');
    if (!aiChatWindow) return;
    const expandButtonSvg = expandChat?.querySelector('svg'); // Changed from img to svg

    if (isChatExpanded) {
      aiChatWindow.style.bottom = '0'; aiChatWindow.style.right = '0';
      aiChatWindow.style.width = '100%'; aiChatWindow.style.height = '100%';
      aiChatWindow.style.maxWidth = '100%'; aiChatWindow.style.maxHeight = '100%';
      aiChatWindow.style.borderRadius = '0';
      aiChatWindow.classList.add('chat-expanded');
      if (expandButtonSvg) expandButtonSvg.style.transform = 'rotate(180deg)';
      if (aiExpandedLogo) aiExpandedLogo.classList.remove('hidden');
      if (chatMessages?.querySelector('h2.initial-prompt-title')) {
        chatMessages.classList.add('items-center', 'justify-center', 'text-center');
        chatMessages.classList.remove('items-start', 'justify-start', 'text-left');
      } else {
        chatMessages?.classList.remove('items-center', 'justify-center', 'text-center');
        chatMessages?.classList.add('items-start', 'justify-start', 'text-left');
      }
    } else {
      aiChatWindow.style.bottom = '100px'; aiChatWindow.style.right = '16px';
      aiChatWindow.style.left = 'auto'; aiChatWindow.style.top = 'auto';
      aiChatWindow.style.width = '380px'; aiChatWindow.style.height = '480px';
      aiChatWindow.style.maxWidth = '90vw'; aiChatWindow.style.maxHeight = 'calc(100vh - 120px)';
      aiChatWindow.style.borderRadius = '1rem';
      aiChatWindow.classList.remove('chat-expanded');
      if (expandButtonSvg) expandButtonSvg.style.transform = 'rotate(0deg)';
      if (aiExpandedLogo) aiExpandedLogo.classList.add('hidden');
      if (chatMessages?.querySelector('h2.initial-prompt-title')) {
        chatMessages.classList.add('items-center', 'justify-center', 'text-center');
        chatMessages.classList.remove('items-start', 'justify-start', 'text-left');
      } else {
        chatMessages?.classList.remove('items-center', 'justify-center', 'text-center');
        chatMessages?.classList.add('items-start', 'justify-start', 'text-left');
      }
    }
  }

  async function sendChatMessage() {
    if (!browser) return;
    const chatInput = document.getElementById('chatInput') as HTMLInputElement | null;
    const chatMessages = document.getElementById('chatMessages');
    if (!chatInput || !chatMessages) return;
    const userMsgText = chatInput.value.trim();
    if (!userMsgText) return;

    const aiContextPreamble = `You are Synthia, a helpful AI assistant integrated into the Microtask productivity app. Keep your answers concise and relevant to task management, scheduling, note-taking, and general productivity. The user's name is ${username || 'User'}. Today's date is ${new Date().toLocaleDateString()}. \n\nUser query: `;
    const fullMessageToSend = aiContextPreamble + userMsgText;

    const userMsgDiv = document.createElement('div');
    userMsgDiv.className = `p-2 rounded-lg text-sm self-end max-w-[75%] ml-auto mb-2 break-words ${isDarkMode ? 'bg-blue-700 text-blue-100' : 'bg-blue-500 text-white'}`;
    userMsgDiv.textContent = userMsgText;

    const initialPromptDiv = chatMessages.querySelector('.initial-prompt');
    if (initialPromptDiv) {
      initialPromptDiv.remove();
      chatMessages.classList.remove('justify-center', 'items-center', 'text-center');
      chatMessages.classList.add('justify-start', 'items-start', 'text-left');
      if (isChatExpanded && document.getElementById('aiExpandedLogo')) {
           document.getElementById('aiExpandedLogo')?.classList.add('hidden');
       }
    }
    chatMessages.appendChild(userMsgDiv);
    chatInput.value = "";
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const typingIndicator = document.createElement('div');
    typingIndicator.id = 'aiTyping';
    typingIndicator.className = `p-2 rounded-lg text-sm self-start max-w-[75%] mb-2 italic ${isDarkMode ? 'bg-zinc-700 text-zinc-400' : 'bg-gray-200 text-gray-500'}`;
    typingIndicator.textContent = 'Synthia is typing...';
    chatMessages.appendChild(typingIndicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: fullMessageToSend })
      });
      typingIndicator.remove();
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `API request failed with status ${response.status}` }));
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      }
      const responseData = await response.json();
      if (responseData.error) { throw new Error(responseData.error); }
      const aiReplyText = responseData?.reply || "Hmm, I couldn't get a response this time.";
      let formattedReply = aiReplyText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
      const aiMsgDiv = document.createElement('div');
      aiMsgDiv.className = `p-2 rounded-lg text-sm self-start max-w-[75%] mb-2 break-words ${isDarkMode ? 'bg-zinc-700 text-zinc-200' : 'bg-gray-200 text-gray-800'}`;
      aiMsgDiv.innerHTML = formattedReply;
      chatMessages.appendChild(aiMsgDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error: any) {
      console.error("[Home Page / +page.svelte] Chat API error:", error);
      const errorMsgDiv = document.createElement('div');
      errorMsgDiv.className = `p-2 rounded-lg text-sm self-start max-w-[75%] mb-2 ${isDarkMode ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-700'}`;
      errorMsgDiv.textContent = error.message || "Oops! Something went wrong fetching Synthia's response.";
      const currentTypingIndicator = document.getElementById('aiTyping');
      if (currentTypingIndicator?.parentNode) currentTypingIndicator.remove();
      chatMessages.appendChild(errorMsgDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  async function refreshData() {
    isRefreshingNotes = true;
    isRefreshingTasks = true;
    errorMessage = null;
    try {
      await invalidateAll();
    } catch (err) {
      console.error('[Home Page / +page.svelte] Error during invalidateAll:', err);
      errorMessage = 'Failed to refresh data. Please try again.';
    } finally {
      isRefreshingNotes = false;
      isRefreshingTasks = false;
    }
  }

  function confirmDelete() {
    const noteModalForm = document.querySelector<HTMLFormElement>('#note-modal-form');
    if (!noteModalForm) {
      console.error("[Home Page / +page.svelte] CRITICAL: Note modal form not found by ID during confirmDelete.");
      errorMessage = "Error: Could not find the note form to process deletion. Please try again or refresh.";
      showDeleteConfirmation = false;
      return;
    }
    if (!editingNoteId) {
      console.error("[Home Page / +page.svelte] Attempted to delete note without an editingNoteId.");
      errorMessage = "Cannot delete note: No note was selected for editing. Please close and try again.";
      showDeleteConfirmation = false;
      return;
    }
    showDeleteConfirmation = false;

    const tempDeleteButton = document.createElement('button');
    tempDeleteButton.type = 'submit';
    tempDeleteButton.formAction = `?/deleteNote`;
    tempDeleteButton.style.display = 'none';
    noteModalForm.appendChild(tempDeleteButton);
    // console.log(`[Home Page / +page.svelte] Submitting delete for note ID: ${editingNoteId} using form:`, noteModalForm);
    tempDeleteButton.click();
    noteModalForm.removeChild(tempDeleteButton);
  }

  onMount(() => {
    if (!data?.tasks || data.tasks.length === 0) {
      noTasksTodayMessage = getRandomMessage();
    }
    username = getStoredUsername();
    greeting = getGreeting();

    if (browser) {
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      isDarkMode = savedTheme === 'dark' || (!savedTheme && prefersDark);
      document.body.classList.toggle('dark', isDarkMode);
    }

    fetchUsernameFromFirebase().then(() => {
      if (browser) {
        const params = new URLSearchParams($page.url.searchParams);
        usernameFromUrl = params.get('username') || '';
        if (usernameFromUrl) {
          username = usernameFromUrl;
          saveUsername(username);
          const url = new URL(window.location.href);
          url.searchParams.delete('username');
          window.history.replaceState({}, '', url.toString());
        }
      }
    });

    const setupIconListener = (iconId: string, windowId: string) => {
        const iconElement = document.getElementById(iconId);
        if (iconElement) {
          iconElement.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleWindow(windowId);
            closeOtherWindows(windowId);
          });
        }
      };
    setupIconListener('bellIcon', 'notifWindow');
    setupIconListener('helpIcon', 'helpWindow');
    setupIconListener('profileIcon', 'profileWindow');

    const darkModeButton = document.getElementById('darkModeToggle');
    if (darkModeButton) darkModeButton.addEventListener('click', toggleDarkMode);

    // Dots menus removed, so related listeners are also removed.

    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      // Header dropdown closing logic
      let isClickInsideHeaderDropdownTrigger = false;
      const headerTriggerIds = ['bellIcon', 'helpIcon', 'profileIcon'];
      headerTriggerIds.forEach(triggerId => {
        const triggerEl = document.getElementById(triggerId);
        if (triggerEl && triggerEl.contains(target)) isClickInsideHeaderDropdownTrigger = true;
      });
      let isClickInsideHeaderDropdownWindow = false;
       dropdownIds.forEach(windowId => {
        const windowEl = document.getElementById(windowId);
        if (windowEl && windowEl.contains(target)) isClickInsideHeaderDropdownWindow = true;
      });
      if (!isClickInsideHeaderDropdownTrigger && !isClickInsideHeaderDropdownWindow) {
        closeOtherWindows('');
      }
      // Sidebar closing logic
      const sidebarEl = document.getElementById('sidebar');
      const hamburgerButton = document.getElementById('hamburgerButton');
      if (isSidebarOpen && sidebarEl && !sidebarEl.contains(target) && hamburgerButton && !hamburgerButton.contains(target)) {
        closeSidebar();
      }
    };
    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('keydown', handleEscKey);

    const aiChatToggle = document.getElementById('aiChatToggle');
    const aiChatWindow = document.getElementById('aiChatWindow');
    const closeChat = document.getElementById('closeChat');
    const expandChat = document.getElementById('expandChat');
    const sendBtn = document.getElementById('sendChat');
    const chatInput = document.getElementById('chatInput') as HTMLInputElement | null;

    if (aiChatToggle && aiChatWindow) {
      aiChatToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentlyHidden = aiChatWindow.classList.contains('hidden');
        aiChatWindow.classList.toggle('hidden', !currentlyHidden);
        updateChatWindowStyle();
      });
    }
    if (closeChat && aiChatWindow) {
      closeChat.addEventListener('click', () => {
        aiChatWindow.classList.add('hidden');
        if (isChatExpanded) {
          isChatExpanded = false;
          updateChatWindowStyle();
        }
      });
    }
    if (expandChat) {
      expandChat.addEventListener('click', () => {
        isChatExpanded = !isChatExpanded;
        updateChatWindowStyle();
      });
    }
    if (sendBtn && chatInput) {
      sendBtn.addEventListener('click', sendChatMessage);
      chatInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          sendChatMessage();
        }
      });
    }

    updateChatWindowStyle();
    const greetingIntervalId = setInterval(() => { greeting = getGreeting(); }, 60000);

    return () => {
      clearInterval(greetingIntervalId);
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('keydown', handleEscKey);
      // Minimal cleanup, Svelte handles most DOM element listener removal
    };
  });
</script>

<div class={`flex h-screen font-sans ${isDarkMode ? 'dark bg-zinc-900 text-zinc-300' : 'bg-gray-100 text-gray-800'}`}>
  {#if errorMessage}
    <div class="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-md z-[100]" role="alert">
      <strong class="font-bold">Error:</strong>
      <span class="block sm:inline">{errorMessage}</span>
      <button on:click={() => errorMessage = null} class="absolute top-0 bottom-0 right-0 px-4 py-3" aria-label="Close error">
        <span class="text-xl">×</span>
      </button>
    </div>
  {/if}

  {#if isSidebarOpen}
    <div
      id="sidebar"
      class={`fixed top-0 left-0 h-full w-64 shadow-lg z-50 flex flex-col justify-between p-4 border-r ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}
      transition:fly={{ x: -300, duration: 300, easing: quintOut }}
    >
      <div>
        <div class="flex items-center gap-2 mb-8 pb-4 border-b ${isDarkMode ? 'border-zinc-700' : 'border-gray-200'}">
          <img src="/logonamin.png" alt="Microtask Logo" class="w-8 h-8" />
          <h1 class={`text-xl font-bold ${isDarkMode ? 'text-zinc-100' : 'text-gray-800'}`}>Microtask</h1>
        </div>
        <nav class="flex flex-col gap-2">
          <a href="/home" class="flex items-center gap-3 px-3 py-2 rounded-md font-semibold transition-colors duration-150" class:bg-blue-600={!isDarkMode} class:bg-blue-800={isDarkMode} class:text-white={true} class:hover:bg-gray-100={!isDarkMode} class:hover:bg-zinc-700={isDarkMode}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5" aria-hidden="true">
              <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
              <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
            </svg>
            <span>Home</span>
          </a>
          <a href="/tasks" class="flex items-center gap-3 px-3 py-2 rounded-md font-semibold transition-colors duration-150" class:hover:bg-gray-100={!isDarkMode} class:hover:bg-zinc-700={isDarkMode} class:text-gray-700={!isDarkMode} class:text-zinc-300={isDarkMode}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
            </svg>
            <span>All Tasks</span>
          </a>
          <a href="/calendar" class="flex items-center gap-3 px-3 py-2 rounded-md font-semibold transition-colors duration-150" class:hover:bg-gray-100={!isDarkMode} class:hover:bg-zinc-700={isDarkMode} class:text-gray-700={!isDarkMode} class:text-zinc-300={isDarkMode}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5" aria-hidden="true">
              <path fill-rule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zM5.25 6.75c-.621 0-1.125.504-1.125 1.125V18a1.125 1.125 0 001.125 1.125h13.5A1.125 1.125 0 0019.875 18V7.875c0-.621-.504-1.125-1.125-1.125H5.25z" clip-rule="evenodd" /><path d="M10.5 9.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H10.5v-.01a.75.75 0 000-1.5zM10.5 12.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H10.5v-.01a.75.75 0 000-1.5zM10.5 15.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H10.5v-.01a.75.75 0 000-1.5zM13.5 9.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H13.5v-.01a.75.75 0 000-1.5zM13.5 12.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H13.5v-.01a.75.75 0 000-1.5zM13.5 15.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H13.5v-.01a.75.75 0 000-1.5zM16.5 9.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H16.5v-.01a.75.75 0 000-1.5zM16.5 12.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H16.5v-.01a.75.75 0 000-1.5zM16.5 15.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H16.5v-.01a.75.75 0 000-1.5z"/></svg>
            <span>Calendar</span>
          </a>
          <a href="/workspace" class="flex items-center gap-3 px-3 py-2 rounded-md font-semibold transition-colors duration-150" class:hover:bg-gray-100={!isDarkMode} class:hover:bg-zinc-700={isDarkMode} class:text-gray-700={!isDarkMode} class:text-zinc-300={isDarkMode}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.098a2.25 2.25 0 0 1-2.25 2.25h-12a2.25 2.25 0 0 1-2.25-2.25V14.15M18 18.75h.75A2.25 2.25 0 0 0 21 16.5v-1.5a2.25 2.25 0 0 0-2.25-2.25h-15A2.25 2.25 0 0 0 1.5 15v1.5A2.25 2.25 0 0 0 3.75 18.75H4.5M12 12.75a3 3 0 0 0-3-3H5.25V7.5a3 3 0 0 1 3-3h7.5a3 3 0 0 1 3 3v2.25H15a3 3 0 0 0-3 3Z" />
            </svg>
            <span>Workspace</span>
          </a>
          <a href="/ai-chat" class="flex items-center gap-3 px-3 py-2 rounded-md font-semibold transition-colors duration-150" class:hover:bg-gray-100={!isDarkMode} class:hover:bg-zinc-700={isDarkMode} class:text-gray-700={!isDarkMode} class:text-zinc-300={isDarkMode}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5" aria-hidden="true"><path d="M12.001 2.504a2.34 2.34 0 00-2.335 2.335v.583c0 .582.212 1.13.582 1.556l.03.035-.03.034a2.34 2.34 0 00-2.917 3.916A3.287 3.287 0 004.08 14.25a3.287 3.287 0 003.287 3.287h8.266a3.287 3.287 0 003.287-3.287 3.287 3.287 0 00-1.253-2.583 2.34 2.34 0 00-2.917-3.916l-.03-.034.03-.035c.37-.425.582-.973.582-1.555v-.583a2.34 2.34 0 00-2.335-2.336h-.002zM9.75 12.75a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5z" /><path fill-rule="evenodd" d="M12 1.5c5.79 0 10.5 4.71 10.5 10.5S17.79 22.5 12 22.5 1.5 17.79 1.5 12 6.21 1.5 12 1.5zM2.85 12a9.15 9.15 0 019.15-9.15 9.15 9.15 0 019.15 9.15 9.15 9.15 0 01-9.15 9.15A9.15 9.15 0 012.85 12z" clip-rule="evenodd" /></svg>
            <span>Ask Synthia</span>
          </a>
        </nav>
      </div>
      <button on:click={handleLogout} class="flex items-center gap-3 px-3 py-2 rounded-md font-semibold w-full mt-auto transition-colors duration-150" class:hover:bg-gray-100={!isDarkMode} class:hover:bg-zinc-700={isDarkMode} class:text-gray-700={!isDarkMode} class:text-zinc-300={isDarkMode}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
        <span>Log out</span>
      </button>
    </div>
  {/if}

  <div class="flex-1 flex flex-col overflow-hidden">

    <header class={`top-header ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>
      <div class="header-left">
        <button id="hamburgerButton" class="menu-btn" on:click={toggleSidebar} aria-label="Toggle Sidebar">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
        </button>
        <a href="/home" class="logo">
          <img src="/logonamin.png" alt="Microtask Logo" class="h-8 w-auto">
          <span class={`${isDarkMode ? 'text-zinc-100' : 'text-gray-800'}`}>Microtask</span>
        </a>
      </div>
      <div class="header-icons">
        <div class="relative">
          <button id="bellIcon" aria-label="Notifications">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5" aria-hidden="true"><path fill-rule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0c-1.673-.253-3.287-.673-4.831-1.243a.75.75 0 01-.297-1.206C4.45 13.807 5.25 11.873 5.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0H9.752z" clip-rule="evenodd" /></svg>
          </button>
          <div id="notifWindow" class={`dropdown-window hidden ${isDarkMode ? 'bg-zinc-700 border-zinc-600 text-zinc-300' : 'bg-white border-gray-200 text-gray-700'}`}>
            <h3 class="font-semibold mb-2 text-sm">Notifications</h3><p class="text-xs">No new notifications.</p>
          </div>
        </div>
        <div class="relative">
          <button id="helpIcon" aria-label="Help & FAQ">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5" aria-hidden="true"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.042.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" /></svg>
          </button>
          <div id="helpWindow" class={`dropdown-window hidden ${isDarkMode ? 'bg-zinc-700 border-zinc-600 text-zinc-300' : 'bg-white border-gray-200 text-gray-700'}`}>
            <h3 class="font-semibold mb-2 text-sm">FAQ</h3>
            <ul class="list-disc list-inside space-y-1 text-xs"><li>How do I add a task?</li><li>Where is the calendar?</li></ul>
            <a href="/support" class="text-xs text-blue-600 hover:underline mt-2 block">Visit Support</a>
          </div>
        </div>
        <div class="relative">
          <button id="profileIcon" aria-label="Profile Menu">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5" aria-hidden="true"><path fill-rule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clip-rule="evenodd" /></svg>
          </button>
          <div id="profileWindow" class={`dropdown-window hidden ${isDarkMode ? 'bg-zinc-700 border-zinc-600 text-zinc-300' : 'bg-white border-gray-200 text-gray-700'}`}>
            <h3 class="font-semibold mb-2 text-sm">Profile</h3>
            <p class="text-xs mb-2 truncate">Welcome, {username || 'User'}!</p>
            <a href="/settings" class={`block text-xs px-2 py-1.5 rounded w-full text-left mb-1 transition-colors duration-150 ${isDarkMode ? 'bg-zinc-600 hover:bg-zinc-500 text-zinc-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>Settings</a>
            <button on:click={handleLogout} class={`text-xs px-2 py-1.5 rounded w-full text-left transition-colors duration-150 ${isDarkMode ? 'bg-red-700 hover:bg-red-600 text-zinc-300' : 'bg-red-100 hover:bg-red-200 text-red-700'}`}>Logout</button>
          </div>
        </div>
        <button id="darkModeToggle" aria-label="Toggle Dark Mode" class={`ml-2 p-1.5 rounded-full transition-colors duration-150 ${isDarkMode ? 'hover:bg-zinc-700 text-zinc-300' : 'hover:bg-gray-100 text-gray-700'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
            {#if isDarkMode} <path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 0 0-.103.103l1.132 1.132a.75.75 0 0 0 1.06 0l1.132-1.132a.75.75 0 0 0-.103-1.06l-1.132-1.132a.75.75 0 0 0-1.06 0L9.63 1.615a.75.75 0 0 0-.102.103ZM12 3.75a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75ZM18.282 5.282a.75.75 0 0 0-1.06 0l-1.132 1.132a.75.75 0 0 0 .103 1.06l1.132 1.132a.75.75 0 0 0 1.06 0l1.132-1.132a.75.75 0 0 0-.103-1.06l-1.132-1.132a.75.75 0 0 0 0-.103ZM19.5 12a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 .75.75ZM18.282 18.718a.75.75 0 0 0 0 1.06l1.132 1.132a.75.75 0 0 0 1.06 0l1.132-1.132a.75.75 0 0 0-.103-1.06l-1.132-1.132a.75.75 0 0 0-1.06 0l-1.132 1.132a.75.75 0 0 0 .103.103ZM12 18.75a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 .75.75ZM5.718 18.718a.75.75 0 0 0 1.06 0l1.132-1.132a.75.75 0 0 0-.103-1.06l-1.132-1.132a.75.75 0 0 0-1.06 0L4.586 17.686a.75.75 0 0 0 .103 1.06l1.132 1.132a.75.75 0 0 0 0 .103ZM4.5 12a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75ZM5.718 5.282a.75.75 0 0 0 0-1.06l-1.132-1.132a.75.75 0 0 0-1.06 0L2.39 4.114a.75.75 0 0 0 .103 1.06l1.132 1.132a.75.75 0 0 0 1.06 0l1.132-1.132a.75.75 0 0 0-.103-.103ZM12 6.75a5.25 5.25 0 0 1 5.25 5.25 5.25 5.25 0 0 1-5.25 5.25 5.25 5.25 0 0 1-5.25-5.25 5.25 5.25 0 0 1 5.25-5.25Z" clip-rule="evenodd" />
            {:else} <path fill-rule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM12 16.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Z" clip-rule="evenodd" /> {/if}
          </svg>
        </button>
      </div>
    </header>

    <div class="flex-1 overflow-y-auto pt-[60px] pb-20 flex flex-col">
      <div class={`w-full px-4 sm:px-6 py-3 flex items-center gap-3 shadow-md flex-shrink-0 ${isDarkMode ? 'bg-zinc-800 text-zinc-100 border-zinc-700' : 'bg-zinc-800 text-white border-gray-200'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8 hover:scale-110 transition-transform" aria-hidden="true"><path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" /><path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" /></svg>
        <span class="text-lg sm:text-xl font-semibold">Home</span>
        <div class={`ml-auto flex items-center px-3 py-1 rounded-md shadow-sm w-48 sm:w-64 ${isDarkMode ? 'bg-zinc-700 text-zinc-400' : 'bg-white text-black'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 mr-2" class:text-gray-400={!isDarkMode} class:text-zinc-400={isDarkMode} aria-hidden="true"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" /></svg>
          <span class="text-sm">Search...</span>
        </div>
      </div>

      <div class="px-4 sm:px-6 mt-6">
        <h1 class={`text-2xl sm:text-3xl font-bold ${isDarkMode ? 'text-zinc-100' : 'text-gray-800'}`}>{greeting}, <span class={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{username.toUpperCase()}</span>!</h1>
      </div>

      <main class="px-4 sm:px-6 mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow">
        <section class="flex flex-col gap-6">
          <div class={`border rounded-lg p-4 shadow-sm flex flex-col ${isDarkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-gray-200'}`}>
            <div class="flex justify-between items-center mb-3 flex-shrink-0">
              <h2 class={`text-lg font-semibold ${isDarkMode ? 'text-zinc-100' : 'text-gray-700'}`}>Quick access</h2>
            </div>
            <div class="space-y-2 flex-grow overflow-y-auto mb-4 pr-2 -mr-2 custom-scrollbar">
              <a href="/calendar" class={`block rounded-lg px-4 py-2.5 shadow-xs transition-colors duration-150 ${isDarkMode ? 'bg-zinc-600 border border-zinc-500 hover:bg-zinc-500 text-zinc-300' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-800'}`}>
                <div class="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-blue-500 dark:text-blue-400" aria-hidden="true"><path fill-rule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zM5.25 6.75c-.621 0-1.125.504-1.125 1.125V18a1.125 1.125 0 001.125 1.125h13.5A1.125 1.125 0 0019.875 18V7.875c0-.621-.504-1.125-1.125-1.125H5.25z" clip-rule="evenodd" /><path d="M10.5 9.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H10.5v-.01a.75.75 0 000-1.5zM10.5 12.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H10.5v-.01a.75.75 0 000-1.5zM10.5 15.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H10.5v-.01a.75.75 0 000-1.5zM13.5 9.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H13.5v-.01a.75.75 0 000-1.5zM13.5 12.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H13.5v-.01a.75.75 0 000-1.5zM13.5 15.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H13.5v-.01a.75.75 0 000-1.5zM16.5 9.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H16.5v-.01a.75.75 0 000-1.5zM16.5 12.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H16.5v-.01a.75.75 0 000-1.5zM16.5 15.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H16.5v-.01a.75.75 0 000-1.5z"/></svg>
                  <span class="text-base font-medium">Calendar</span>
                </div>
              </a>
              <a href="/tasks" class={`block rounded-lg px-4 py-2.5 shadow-xs transition-colors duration-150 ${isDarkMode ? 'bg-zinc-600 border border-zinc-500 hover:bg-zinc-500 text-zinc-300' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-800'}`}>
                <div class="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-green-500 dark:text-green-400" aria-hidden="true"><path fill-rule="evenodd" d="M2.25 5.25A3 3 0 015.25 2.25h13.5a3 3 0 013 3V12a3 3 0 01-3 3H5.25a3 3 0 01-3-3V5.25zm1.5 0v6.75c0 .828.672 1.5 1.5 1.5h13.5c.828 0 1.5-.672 1.5-1.5V5.25c0-.828-.672-1.5-1.5-1.5H5.25c-.828 0-1.5.672-1.5 1.5zM9 18.75a.75.75 0 000 1.5h6a.75.75 0 000-1.5H9z" clip-rule="evenodd" /></svg>
                  <span class="text-base font-medium">Tasks</span>
                </div>
              </a>
            </div>
          </div>

          <div class={`border rounded-lg p-4 shadow-sm relative flex flex-col ${isDarkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-gray-200'}`}>
            <div class="flex justify-between items-center mb-3 flex-shrink-0">
              <h2 class={`text-lg font-semibold ${isDarkMode ? 'text-zinc-100' : 'text-gray-700'}`}>Tasks that are due today</h2>
              <!-- Optionally, add a button here if toggleShowCompleted is needed -->
            </div>
            <div class="space-y-2 flex-grow overflow-y-auto mb-4 pr-2 -mr-2 custom-scrollbar">
              {#if data?.tasks && data.tasks.length > 0}
                {#each data.tasks as task (task.id)}
                  <form
  method="POST"
  action="?/toggleTask"
  use:enhance={taskFormEnhanceCallback}
  class={`flex justify-between items-center rounded-lg px-4 py-2 shadow-xs ${isDarkMode ? 'bg-zinc-600 border border-zinc-500' : 'bg-white border-gray-200'}`}
>
                    <input type="hidden" name="id" value={task.id} />
                    <div class="flex items-center gap-2 flex-grow mr-2 overflow-hidden">
                      <input
                        type="checkbox"
                        name="isCompleted"
                        checked={task.isCompleted}
                        on:change|preventDefault={(e) => { (e.currentTarget as HTMLInputElement).form?.requestSubmit(); }}
                        class="rounded border-gray-300 dark:border-zinc-600 text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 h-4 w-4 flex-shrink-0 cursor-pointer bg-white dark:bg-zinc-700 checked:bg-blue-600 dark:checked:bg-blue-500"
                        aria-label={`Mark task ${task.isCompleted ? 'incomplete' : 'complete'}`}
                      />
                      <span
                        class:line-through={task.isCompleted}
                        class:text-gray-500={task.isCompleted && !isDarkMode}
                        class:text-zinc-400={task.isCompleted && isDarkMode}
                        class={`font-medium text-sm truncate ${isDarkMode ? 'text-zinc-200' : 'text-gray-800'}`}
                        title={task.description}
                      >
                        {task.description}
                      </span>
                      {#if task.dueDate}
                        <span class={`text-xs flex-shrink-0 ml-auto ${isDarkMode ? 'text-zinc-400' : 'text-gray-400'}`}>
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      {/if}
                    </div>
                  </form>
                {/each}
              {:else if data?.tasks}
                <p class={`italic text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>{noTasksTodayMessage}</p>
              {:else if !data?.error}
                <p class={`italic text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>Loading tasks...</p>
              {/if}
            </div>
            <a href="/tasks" class={`text-sm hover:underline mt-auto pt-2 flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>View all tasks</a>
            {#if !showTaskForm}
              <button
                type="button"
                on:click={openAddTaskForm}
                class="absolute bottom-4 right-4 bg-blue-600 text-white rounded-full p-2.5 w-10 h-10 flex items-center justify-center shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150 ease-in-out z-20 transform hover:scale-105"
                aria-label="Add New Task"
                transition:scale={{ duration: 150, start: 0.8, opacity: 0.5 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
              </button>
            {/if}
          </div>
        </section>

        <section class={`notes-section rounded-lg p-4 flex flex-col justify-between relative shadow-sm ${isDarkMode ? 'bg-zinc-700 border border-zinc-600' : 'bg-white border border-gray-200'}`}>
          <div class="flex justify-between items-center mb-3 flex-shrink-0">
            <h2 class={`text-lg font-semibold ${isDarkMode ? 'text-zinc-100' : 'text-gray-700'}`}>Notes</h2>
            <div class="flex items-center gap-1">
              <button
                type="button"
                on:click={refreshData}
                disabled={isRefreshingNotes || isRefreshingTasks}
                class={`p-1 rounded-full disabled:opacity-50 disabled:cursor-wait transition-colors ${isDarkMode ? 'hover:bg-zinc-600 text-zinc-400' : 'hover:bg-gray-200 text-gray-500'}`}
                aria-label="Refresh Data"
              >
                {#if isRefreshingNotes || isRefreshingTasks}
                  <svg class="animate-spin h-5 w-5 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                {:else}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                {/if}
              </button>
            </div>
          </div>
          <div class="flex-grow overflow-y-auto mb-4 pr-2 -mr-2 custom-scrollbar">
            {#if data?.error && !data?.notes}
              <p class={`italic text-sm text-red-500`}>Error loading notes: {data.error}</p>
            {:else if data?.notes && data.notes.length > 0}
              <div class="space-y-3">
                {#each data.notes as note (note.id)}
                  <div class={`rounded-lg p-3 flex justify-between items-start group relative shadow-xs ${isDarkMode ? 'bg-zinc-600 border-zinc-500' : 'bg-white border-gray-200'}`}>                    <div class="flex-grow pr-2 overflow-hidden">
                      <h3 class={`font-semibold text-base truncate ${isDarkMode ? 'text-zinc-100' : 'text-gray-800'}`}>{note.title}</h3>
                      {#if expandedNoteId !== note.id}
                        <p class={`text-sm truncate mt-1 ${isDarkMode ? 'text-zinc-300' : 'text-gray-600'}`}>{note.content}</p>
                      {/if}
                      {#if expandedNoteId === note.id}
                        <div class="mt-2 space-y-1" transition:slide={{duration: 200}}>
                          <p class={`text-sm whitespace-pre-wrap break-words ${isDarkMode ? 'text-zinc-200' : 'text-gray-700'}`}>{note.content}</p>
                          {#if note.createdAt}
                            <p class={`text-xs pt-1 ${isDarkMode ? 'text-zinc-400' : 'text-gray-400'}`}>Created: {new Date(note.createdAt).toLocaleString()}</p>
                          {/if}
                        </div>
                      {/if}
                    </div>
                    <div class="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <button type="button" on:click={() => openEditNoteForm(note)} class={`p-1 rounded ${isDarkMode ? 'hover:bg-zinc-600 text-zinc-400' : 'hover:bg-gray-200 text-gray-500'}`} aria-label="Edit Note">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4" aria-hidden="true"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>
                      </button>
                      <button
                        type="button"
                        on:click={() => { expandedNoteId = expandedNoteId === note.id ? null : note.id; }}
                        class={`p-1 rounded ${isDarkMode ? 'hover:bg-zinc-600 text-zinc-400' : 'hover:bg-gray-200 text-gray-500'}`}
                        aria-label={expandedNoteId === note.id ? 'Collapse Note' : 'Expand Note'}
                        transition:scale={{duration:100}}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 transition-transform duration-200" style:transform={expandedNoteId === note.id ? 'rotate(180deg)' : 'rotate(0deg)'} aria-hidden="true"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.29a.75.75 0 01.02-1.06z" clip-rule="evenodd" /></svg>
                      </button>
                    </div>
                  </div>
                {/each}
              </div>
            {:else if data?.notes}
              <p class={`italic text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>No notes yet. Click the '+' to add one!</p>
            {:else if !data?.error}
              <p class={`italic text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>Loading notes...</p>
            {/if}
          </div>
          {#if !showNoteForm && !showTaskForm}
            <button
              type="button"
              on:click={openAddNoteForm}
              class="absolute bottom-4 right-4 bg-blue-600 text-white rounded-full p-2.5 w-10 h-10 flex items-center justify-center shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150 ease-in-out z-20 transform hover:scale-105"
              aria-label="Add New Note"
              transition:scale={{ duration: 150, start: 0.8, opacity: 0.5 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
            </button>
          {/if}
        </section>
      </main>

      <button class={`fixed bottom-4 left-4 w-16 h-16 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isDarkMode ? 'bg-zinc-700' : 'bg-white'}`} aria-label="Open Timer">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-10 h-10" class:text-zinc-800={!isDarkMode} class:text-zinc-300={isDarkMode} aria-hidden="true"><path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clip-rule="evenodd" /></svg>
      </button>

      <div id="aiChatToggle" class="fixed bottom-4 right-4 w-16 h-16 cursor-pointer z-40 transition-opacity duration-200">
        <button class="w-full h-full bg-purple-600 rounded-full shadow-lg flex items-center justify-center hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transform hover:scale-105 transition-all duration-150" aria-label="Toggle AI Chat">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-9 h-9 text-white" aria-hidden="true"><path d="M12.001 2.504a2.34 2.34 0 00-2.335 2.335v.583c0 .582.212 1.13.582 1.556l.03.035-.03.034a2.34 2.34 0 00-2.917 3.916A3.287 3.287 0 004.08 14.25a3.287 3.287 0 003.287 3.287h8.266a3.287 3.287 0 003.287-3.287 3.287 3.287 0 00-1.253-2.583 2.34 2.34 0 00-2.917-3.916l-.03-.034.03-.035c.37-.425.582-.973.582-1.555v-.583a2.34 2.34 0 00-2.335-2.336h-.002zM9.75 12.75a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5z" /><path fill-rule="evenodd" d="M12 1.5c5.79 0 10.5 4.71 10.5 10.5S17.79 22.5 12 22.5 1.5 17.79 1.5 12 6.21 1.5 12 1.5zM2.85 12a9.15 9.15 0 019.15-9.15 9.15 9.15 0 019.15 9.15 9.15 9.15 0 01-9.15 9.15A9.15 9.15 0 012.85 12z" clip-rule="evenodd" /></svg>
        </button>
      </div>

      <div id="aiChatWindow" class={`fixed transition-all duration-300 ease-in-out rounded-lg shadow-xl hidden z-[70] flex flex-col overflow-hidden ${isDarkMode ? 'bg-zinc-800 border border-zinc-700 text-zinc-300' : 'bg-white border border-gray-200 text-gray-800'}`} style="bottom: 100px; right: 16px; width: 380px; height: 480px; max-width: 90vw; max-height: 80vh;">
        <div id="aiExpandedLogo" class="hidden absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-48 h-48 sm:w-64 sm:h-64" aria-hidden="true"><path d="M12.001 2.504a2.34 2.34 0 00-2.335 2.335v.583c0 .582.212 1.13.582 1.556l.03.035-.03.034a2.34 2.34 0 00-2.917 3.916A3.287 3.287 0 004.08 14.25a3.287 3.287 0 003.287 3.287h8.266a3.287 3.287 0 003.287-3.287 3.287 3.287 0 00-1.253-2.583 2.34 2.34 0 00-2.917-3.916l-.03-.034.03-.035c.37-.425.582-.973.582-1.555v-.583a2.34 2.34 0 00-2.335-2.336h-.002zM9.75 12.75a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5z" /><path fill-rule="evenodd" d="M12 1.5c5.79 0 10.5 4.71 10.5 10.5S17.79 22.5 12 22.5 1.5 17.79 1.5 12 6.21 1.5 12 1.5zM2.85 12a9.15 9.15 0 019.15-9.15 9.15 9.15 0 019.15 9.15 9.15 9.15 0 01-9.15 9.15A9.15 9.15 0 012.85 12z" clip-rule="evenodd" /></svg>
        </div>
        <div class={`flex justify-between items-center px-3 py-2 border-b flex-shrink-0 ${isDarkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-gray-50 border-gray-200'}`}>
          <button class={`p-1.5 rounded-md ${isDarkMode ? 'hover:bg-zinc-600 text-zinc-400' : 'hover:bg-gray-200 text-gray-500'}`} aria-label="Chat History">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"> <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /> </svg>
          </button>
          <span class="text-sm font-semibold">Ask Synthia</span>
          <div class="flex items-center gap-1">
            <button class={`p-1.5 rounded-md ${isDarkMode ? 'hover:bg-zinc-600 text-zinc-400' : 'hover:bg-gray-200 text-gray-500'}`} aria-label="Chat Options">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5" aria-hidden="true"><path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" /></svg>
            </button>
            <button id="expandChat" class={`p-1.5 rounded-md ${isDarkMode ? 'hover:bg-zinc-600 text-zinc-400' : 'hover:bg-gray-200 text-gray-500'}`} aria-label="Expand/Collapse Chat">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 transition-transform duration-200" aria-hidden="true"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.29a.75.75 0 01.02-1.06z" clip-rule="evenodd" /></svg>
            </button>
            <button id="closeChat" class={`p-1.5 rounded-md ${isDarkMode ? 'hover:bg-zinc-600 text-zinc-400' : 'hover:bg-gray-200 text-gray-500'}`} aria-label="Close Chat">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"> <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /> </svg>
            </button>
          </div>
        </div>
        <div class="flex-1 flex flex-col p-4 space-y-3 overflow-y-auto custom-scrollbar" id="chatMessages">
          <div class="initial-prompt w-full h-full flex flex-col justify-center items-center text-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-16 h-16 mb-4 opacity-50" aria-hidden="true"><path d="M12.001 2.504a2.34 2.34 0 00-2.335 2.335v.583c0 .582.212 1.13.582 1.556l.03.035-.03.034a2.34 2.34 0 00-2.917 3.916A3.287 3.287 0 004.08 14.25a3.287 3.287 0 003.287 3.287h8.266a3.287 3.287 0 003.287-3.287 3.287 3.287 0 00-1.253-2.583 2.34 2.34 0 00-2.917-3.916l-.03-.034.03-.035c.37-.425.582-.973.582-1.555v-.583a2.34 2.34 0 00-2.335-2.336h-.002zM9.75 12.75a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5z" /><path fill-rule="evenodd" d="M12 1.5c5.79 0 10.5 4.71 10.5 10.5S17.79 22.5 12 22.5 1.5 17.79 1.5 12 6.21 1.5 12 1.5zM2.85 12a9.15 9.15 0 019.15-9.15 9.15 9.15 0 019.15 9.15 9.15 9.15 0 01-9.15 9.15A9.15 9.15 0 012.85 12z" clip-rule="evenodd" /></svg>
            <h2 class="text-lg font-semibold mb-3 initial-prompt-title">How can I help?</h2>
            <div class="flex flex-wrap justify-center gap-2">
              <button class="prompt-button">Create Task</button>
              <button class="prompt-button">Summarize Notes</button>
              <button class="prompt-button">Help using AI</button>
            </div>
          </div>
        </div>
        <div class={`px-4 py-3 border-t flex-shrink-0 ${isDarkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-gray-50 border-gray-200'}`}>
          <div class="relative flex items-center">
            <input id="chatInput" type="text" placeholder="Ask anything..." class={`w-full rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm pr-10 flex-grow ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-300 placeholder-zinc-500' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'}`}/>
            <button id="sendChat" class="absolute right-1.5 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-2" aria-label="Send Message">
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" class="w-4 h-4"><path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  {#if showNoteForm}
    <div
      class="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm"
      on:click|self={closeForm}  transition:fade={{ duration: 150 }}
    >
      <div
        class={`rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden ${isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-white text-gray-800'}`}
        role="dialog" aria-modal="true" aria-labelledby="note-modal-title"
        on:click|stopPropagation transition:scale={{ duration: 200, start: 0.95, opacity: 0.5 }}
      >
        <div class={`flex justify-between items-center p-4 sm:p-5 border-b flex-shrink-0 ${isDarkMode ? 'border-zinc-700' : 'border-gray-200'}`}>
          <h3 id="note-modal-title" class="text-lg sm:text-xl font-semibold">
            {editingNoteId ? 'Edit Note' : 'Add Note'}
          </h3>
          <button
            type="button"
            class={`p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150 ${isDarkMode ? 'text-zinc-400 hover:bg-zinc-700 focus:ring-zinc-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:ring-gray-400'}`}
            on:click={closeForm}
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form
          id="note-modal-form" 
          method="POST"
          action={editingNoteId ? '?/editNote' : '?/addNote'}
          use:enhance={noteFormEnhanceCallback}
          class={`flex-grow flex flex-col overflow-y-auto p-4 sm:p-5 custom-scrollbar relative`}
        >
        {#if showDeleteConfirmation}
          <div
            class="absolute inset-0 z-10 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm"
            on:click|self={() => showDeleteConfirmation = false}
            transition:fade={{ duration: 100 }}
          >
            <div
              class={`rounded-lg shadow-xl p-6 w-full max-w-sm mx-4 ${isDarkMode ? 'bg-zinc-700 text-zinc-300' : 'bg-white text-gray-800'}`}
              on:click|stopPropagation
              role="alertdialog"
              aria-labelledby="confirm-delete-title"
              aria-describedby="confirm-delete-desc"
              transition:scale={{ duration: 150, start: 0.95, opacity: 0.5 }}
            >
              <h4 id="confirm-delete-title" class="text-lg font-semibold mb-2">Confirm Deletion</h4>
              <p id="confirm-delete-desc" class="text-sm mb-4">Are you sure you want to delete this note? This action cannot be undone.</p>
              <div class="flex justify-end gap-3">
                <button
                  type="button"
                  class={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150 ${isDarkMode ? 'bg-zinc-600 text-zinc-300 hover:bg-zinc-500 focus:ring-zinc-500' : 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400'}`}
                  on:click={() => showDeleteConfirmation = false}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-150"
                  on:click={confirmDelete}
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        {/if}
          {#if editingNoteId} <input type="hidden" name="id" value={editingNoteId} /> {/if}

          <div class="mb-4">
            <label for="title" class="block text-sm font-medium mb-1">Title <span class="text-red-500">*</span></label>
            <input type="text" id="title" name="title" bind:value={noteTitle} class={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${isDarkMode ? 'bg-zinc-700 border-zinc-600 text-zinc-300 placeholder-zinc-500' : 'border-gray-300 text-gray-800 placeholder-gray-400'}`} required />
          </div>

          <div class="mb-4 flex-grow flex flex-col">
            <label for="content" class="block text-sm font-medium mb-1">Content <span class="text-red-500">*</span></label>
            <textarea id="content" name="content" bind:value={noteContent} class={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-grow min-h-[150px] sm:min-h-[200px] shadow-sm ${isDarkMode ? 'bg-zinc-700 border-zinc-600 text-zinc-300 placeholder-zinc-500' : 'border-gray-300 text-gray-800 placeholder-gray-400'}`} required ></textarea>
          </div>

          <div class={`flex flex-col sm:flex-row justify-end gap-3 mt-auto pt-4 border-t -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 px-4 py-3 sm:px-5 sm:py-3 rounded-b-lg flex-shrink-0 ${isDarkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-gray-50 border-gray-200'}`}>
            {#if editingNoteId}
              <button
                type="button" 
                on:click={(event) => {
                  event.preventDefault(); 
                  showDeleteConfirmation = true;
                }}
                class="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-150 order-3 sm:order-1"
              >
                Delete
              </button>
            {/if}
            <button type="button" class={`w-full sm:w-auto px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150 order-2 sm:order-2 ${isDarkMode ? 'bg-zinc-600 text-zinc-300 hover:bg-zinc-500 focus:ring-zinc-500' : 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400'}`} on:click={closeForm}> Cancel </button>
            <button type="submit" class="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150 order-1 sm:order-3"> {editingNoteId ? 'Update Note' : 'Add Note'} </button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  {#if showTaskForm}
    <div
      class="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm"
      on:click|self={closeTaskForm} transition:fade={{ duration: 150 }}
    >
      <div
        class={`rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden ${isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-white text-gray-800'}`}
        role="dialog" aria-modal="true" aria-labelledby="task-modal-title"
        on:click|stopPropagation transition:scale={{ duration: 200, start: 0.95, opacity: 0.5 }}
      >
        <div class={`flex justify-between items-center p-4 sm:p-5 border-b flex-shrink-0 ${isDarkMode ? 'border-zinc-700' : 'border-gray-200'}`}>
          <h3 id="task-modal-title" class="text-lg sm:text-xl font-semibold">
            Add New Task
          </h3>
          <button
            type="button"
            class={`p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150 ${isDarkMode ? 'text-zinc-400 hover:bg-zinc-700 focus:ring-zinc-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:ring-gray-400'}`}
            on:click={closeTaskForm}
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form
          method="POST"
          action="?/addTask"
          use:enhance={taskAddFormEnhanceCallback}
          class={`flex-grow flex flex-col overflow-y-auto p-4 sm:p-5 custom-scrollbar space-y-4`}
        >
          <div>
            <label for="task-title" class="block text-sm font-medium mb-1">Task Title <span class="text-red-500">*</span></label>
            <input type="text" id="task-title" name="title" bind:value={taskTitle} class={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${isDarkMode ? 'bg-zinc-700 border-zinc-600 text-zinc-300 placeholder-zinc-500' : 'border-gray-300 text-gray-800 placeholder-gray-400'}`} required />
          </div>
          <div>
            <label for="task-description" class="block text-sm font-medium mb-1">Description</label>
            <textarea id="task-description" name="description" bind:value={taskDescription} class={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm min-h-[80px] ${isDarkMode ? 'bg-zinc-700 border-zinc-600 text-zinc-300 placeholder-zinc-500' : 'border-gray-300 text-gray-800 placeholder-gray-400'}`} ></textarea>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="task-due-date" class="block text-sm font-medium mb-1">Due Date (Optional)</label>
              <input type="date" id="task-due-date" name="dueDate" bind:value={taskDueDate} class={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${isDarkMode ? 'bg-zinc-700 border-zinc-600 text-zinc-300 calendar-picker-dark' : 'border-gray-300 text-gray-800'}`} />
            </div>
            <div>
              <label for="task-due-time" class="block text-sm font-medium mb-1">Due Time (Optional)</label>
              <input type="time" id="task-due-time" name="dueTime" bind:value={taskDueTime} class={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${isDarkMode ? 'bg-zinc-700 border-zinc-600 text-zinc-300 calendar-picker-dark' : 'border-gray-300 text-gray-800'}`} />
            </div>
          </div>

          <div>
            <label for="task-priority" class="block text-sm font-medium mb-1">Priority</label>
            <select id="task-priority" name="priority" bind:value={taskPriority} class={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${isDarkMode ? 'bg-zinc-700 border-zinc-600 text-zinc-300' : 'border-gray-300 text-gray-800 bg-white'}`}>
              <option value="low">Low</option>
              <option value="standard" selected>Standard</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label for="task-tags" class="block text-sm font-medium mb-1">Tags (comma-separated)</label>
            <input type="text" id="task-tags" name="tags" bind:value={taskTags} placeholder="e.g., work, personal, urgent" class={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${isDarkMode ? 'bg-zinc-700 border-zinc-600 text-zinc-300 placeholder-zinc-500' : 'border-gray-300 text-gray-800 placeholder-gray-400'}`} />
          </div>


        <div class={`flex flex-col sm:flex-row justify-end gap-3 mt-auto pt-4 border-t -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 px-4 py-3 sm:px-5 sm:py-3 rounded-b-lg flex-shrink-0 ${isDarkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-gray-50 border-gray-200'}`}>
          <button type="button" class={`w-full sm:w-auto px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150 ${isDarkMode ? 'bg-zinc-600 text-zinc-300 hover:bg-zinc-500 focus:ring-zinc-500' : 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400'}`} on:click={closeTaskForm}> Cancel </button>
          <button type="submit" class="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"> Add Task </button>
        </div>
      </form>
    </div>
  </div>
{/if}

</div>

<style>
  .font-sans {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }

  :global(body, html) {
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden; /* Prevent scrollbars on body */
  }

  /* Custom Scrollbars */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 3px; }
  ::-webkit-scrollbar-thumb { background: #c5c5c5; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
  .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #c5c5c5 #f1f1f1; }
  :global(.dark) ::-webkit-scrollbar-track { background: #2d3748; }
  :global(.dark) ::-webkit-scrollbar-thumb { background: #4a5568; }
  :global(.dark) ::-webkit-scrollbar-thumb:hover { background: #718096; }
  :global(.dark) .custom-scrollbar { scrollbar-color: #4a5568 #2d3748; }


  /* Header Styles */
  .top-header {
    position: fixed; top: 0; left: 0; right: 0;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 1rem; height: 60px; z-index: 40;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    transition: background-color 0.2s, border-color 0.2s;
  }
  .header-left { display: flex; align-items: center; gap: 0.75rem; }
  .top-header .menu-btn {
    background: none; border: none; cursor: pointer; padding: 0.5rem;
    border-radius: 9999px; transition: background-color 0.15s ease;
    display: flex; align-items: center; justify-content: center; /* For SVG centering */
  }
  .top-header .menu-btn:hover { background-color: #f3f4f6; } /* Light mode */
  :global(.dark) .top-header .menu-btn:hover { background-color: #374151; } /* Dark mode */
  /* Removed direct img styling from .menu-btn img */

  .top-header .logo {
    display: flex; align-items: center; gap: 0.5rem;
    font-weight: 600; font-size: 1.125rem; text-decoration: none;
  }
  .top-header .logo img { height: 2rem; width: auto; } /* Keep for logonamin.png */

  .top-header .header-icons { display: flex; align-items: center; gap: 0.25rem; }
  .top-header .header-icons button {
    background: none; border: none; cursor: pointer; padding: 0.5rem;
    line-height: 0; display: flex; align-items: center; justify-content: center;
    border-radius: 9999px; width: 36px; height: 36px;
    transition: background-color 0.15s ease;
  }
  .top-header .header-icons button:hover { background-color: #f3f4f6; } 
  :global(.dark) .top-header .header-icons button:hover { background-color: #374151; } 

  .relative { position: relative; }
  .dropdown-window {
    position: absolute; right: 0; top: calc(100% + 8px);
    border-radius: 0.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    padding: 0.75rem; width: 260px; z-index: 50;
    opacity: 0; transform: translateY(-5px) scale(0.98);
    transition: opacity 0.15s ease-out, transform 0.15s ease-out;
    pointer-events: none; visibility: hidden;
  }
  .dropdown-window:not(.hidden) {
    opacity: 1; transform: translateY(0) scale(1);
    pointer-events: auto; visibility: visible;
  }

  /* AI Chat Styles */
  #aiChatWindow .prompt-button {
      display: inline-flex; align-items: center; justify-content: center;
      gap: 0.5rem; font-size: 0.875rem; font-weight: 500;
      padding: 0.5rem 1rem; border-radius: 0.375rem;
      border: 1px solid; /* Color will be set by dark/light mode classes */
      transition: background-color 0.15s ease; cursor: pointer;
      width: auto; max-width: 200px; text-align: center; margin: 0.25rem;
  }
  /* Light mode prompt button */
  #aiChatWindow .prompt-button { border-color: #e5e7eb; background-color: #f9fafb; color: #374151; }
  #aiChatWindow .prompt-button:hover { background-color: #f3f4f6; }
  /* Dark mode prompt button */
  :global(.dark) #aiChatWindow .prompt-button { border-color: #4b5563; background-color: #374151; color: #d1d5db; }
  :global(.dark) #aiChatWindow .prompt-button:hover { background-color: #4b5563; }


  #chatMessages:not(:has(.initial-prompt)) .initial-prompt { display: none; }
   #chatMessages > div:not(.initial-prompt) { /* Base style for messages */
      margin-bottom: 0.75rem; padding: 0.625rem 0.875rem;
      border-radius: 0.5rem; max-width: 80%;
      line-height: 1.4; word-wrap: break-word; box-shadow: 0 1px 2px rgba(0,0,0,0.05);
   }
   /* User message specific styling */
   #chatMessages > div[class*="bg-blue-500"], #chatMessages > div[class*="bg-blue-700"] { /* More general selector */
      align-self: flex-end; margin-left: auto;
   }
   /* AI reply specific styling */
   #chatMessages > div[class*="bg-gray-200"], #chatMessages > div[class*="bg-zinc-700"] { /* More general selector */
      align-self: flex-start; margin-right: auto;
   }
   /* Typing indicator */
    #chatMessages > #aiTyping {
      font-style: italic; box-shadow: none; padding: 0.5rem 0.875rem;
   }

  .chat-expanded {
    display: flex !important; flex-direction: column;
    z-index: 1000 !important; border-radius: 0 !important;
    border: none !important; box-shadow: none !important;
  }
  .chat-expanded #chatMessages {
    padding: 1rem 5% !important; overflow-y: auto;
    position: relative; z-index: 10; flex-grow: 1;
  }
   /* Ensure correct alignment when messages exist in expanded view */
  .chat-expanded #chatMessages:not(:has(.initial-prompt)) {
    align-items: flex-start !important; justify-content: flex-start !important;
  }
  .chat-expanded #chatMessages > div:not(.initial-prompt) {
      margin-bottom: 1rem; padding: 0.75rem 1rem;
      border-radius: 0.75rem; max-width: 90%;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  }
  .chat-expanded #chatInput {
      border-color: #d1d5db; :global(.dark) & { border-color: #4b5563; }
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      font-size: 1rem; padding: 0.75rem 3rem 0.75rem 1rem;
  }
  #expandChat svg { transition: transform 0.3s ease; } /* Changed from img to svg */
  .chat-expanded #expandChat svg { transform: rotate(180deg); }

  .hidden { display: none !important; }

  /* Transitions (if needed, Svelte transitions are preferred) */
  @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
  @keyframes fade-out { from { opacity: 1; } to { opacity: 0; } }
  /* .fade-enter-active { animation: fade-in 0.15s ease-out; } */
  /* .fade-leave-active { animation: fade-out 0.15s ease-in; } */

  /* General Dark Mode Overrides (many are handled by Tailwind's dark: prefix) */
  :global(.dark .top-header) { background-color: #1f2937; border-bottom-color: #374151; }
  :global(.dark .top-header .logo span) { color: #f3f4f6; }
  :global(.dark .dropdown-window) { background-color: #374151; border-color: #4b5563; color: #f3f4f6; }
  :global(.dark input), :global(.dark textarea), :global(.dark select) {
    background-color: #374151 !important; /* More specific for inputs */
    color: #f3f4f6 !important;
    border-color: #4b5563 !important;
  }
   :global(.dark input::placeholder), :global(.dark textarea::placeholder) {
    color: #6b7280; /* Dark mode placeholder text */
  }
   :global(.dark .calendar-picker-dark::-webkit-calendar-picker-indicator) {
    filter: invert(0.8);
  }


  /* Ensure SVGs in active sidebar links are white */
  :global(a.bg-blue-600 svg),
  :global(a.bg-blue-800 svg) {
    fill: white !important; /* For fill-based SVGs */
    stroke: white !important; /* For stroke-based SVGs */
  }
  /* Keep for any remaining IMG tags in active links */
  :global(a.bg-blue-600 img),
  :global(a.bg-blue-800 img) {
    filter: brightness(0) invert(1);
  }

  /* Specific dark mode adjustments for Tailwind classes if needed */
  :global(.dark .bg-zinc-800) { background-color: #1f2937; }
  :global(.dark .bg-zinc-700) { background-color: #374151; }
  :global(.dark .border-zinc-700) { border-color: #374151; }
  :global(.dark .border-zinc-600) { border-color: #4b5563; }
  :global(.dark .text-zinc-100) { color: #f3f4f6; }
  :global(.dark .text-zinc-300) { color: #d1d5db; }
  :global(.dark .text-zinc-400) { color: #9ca3af; }
  :global(.dark .text-zinc-500) { color: #6b7280; }
  :global(.dark .bg-zinc-600) { background-color: #4b5563; }
:global(.dark .hover\:bg-zinc-700:hover) { background-color: #4b5563; } /* Effective hover:bg-gray-600 for gray-700 elements */
:global(.dark .hover\:bg-zinc-600:hover) { background-color: #6b7280; } /* Effective hover:bg-gray-500 for gray-600 elements (was custom dark #424c5a) */
:global(.dark .hover\:bg-zinc-500:hover) { background-color: #6b7280; } /* NEW: Effective hover:bg-gray-500 for gray-500 elements (or for items on gray-600 that hover to gray-500) */
:global(.dark .border-zinc-500) { border-color: #6b7280; }             /* gray-500 */
:global(.dark .bg-blue-800) { background-color: #1d4ed8; }          /* Brighter blue for dark mode active (Tailwind blue-700) */
:global(.dark .text-blue-400) { color: #60a5fa; }                   /* Standard Tailwind blue-400 */
</style>