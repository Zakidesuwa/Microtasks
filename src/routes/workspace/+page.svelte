<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores'; // For active link highlighting
	import { goto } from '$app/navigation'; // For logout
	import { browser } from '$app/environment';
	import { fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation'; // Crucial for reloading data
	import type { PageData, ActionData } from './$types';

	export let data: PageData;
	export let form: ActionData; // This is ActionData from ./$types

	// Page state
	let username = data.user?.name || "User"; // Initialize from server, fallback
	$: boards = data.boards || []; 
	
	let pageError = data.error || null;
	let pageSuccessMessage: string | null = null;

	// UI state
	let isSidebarOpen = false;
	let isDarkMode = false; // This will be set by onMount from localStorage or system
	$: currentPath = $page.url.pathname;

	function getStoredUsername(): string {
		if (browser) {
			return localStorage.getItem('microtask_username') || "User";
		}
		return "User";
	}

	function toggleSidebar() { isSidebarOpen = !isSidebarOpen; }
	function closeSidebar() { isSidebarOpen = false; }

	function toggleDarkMode() {
		isDarkMode = !isDarkMode;
		if (browser) {
			document.body.classList.toggle('dark', isDarkMode);
			localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
		}
	}

	function handleLogout() {
		if (browser) {
			localStorage.removeItem('microtask_username');
			document.cookie = "userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax;";
			goto('/login'); 
		}
	}

	const topHeaderDropdownIds = ['notifWindow', 'helpWindow', 'profileWindow'];
	function toggleHeaderWindow(id: string) {
		const el = document.getElementById(id);
		if (el) el.classList.toggle('hidden');
	}
	function closeOtherHeaderWindows(currentId: string) {
		topHeaderDropdownIds.forEach(id => {
			if (id !== currentId) {
				document.getElementById(id)?.classList.add('hidden');
			}
		});
	}

	// Add Board Modal
	let showAddBoardModal = false;
	let workspaceNameInput = '';
	let isSubmittingWorkspace = false;
	let formActionError: string | null = null;

	// Delete Board Confirm Modal
	let showDeleteBoardConfirm = false;
	let boardToConfirmDelete: { id: string; title: string } | null = null;
	let isDeletingBoard = false;

	interface TemplateStep {
		text: string;
		inputPrompt?: string;
		inputType?: 'text' | 'textarea';
		requiresContext?: boolean;
	}
	interface Template {
		title: string;
		iconKey: string;
		goal: string;
		steps: TemplateStep[];
	}

	const templates: Template[] = [
		{
			title: 'Study Plan',
			iconKey: 'study',
			goal: 'Ace your exams with a structured plan.',
			steps: [
				{ text: 'Define subjects & topics to cover', inputPrompt: 'List the main subjects or topics you need to cover for your exams (e.g., "Calculus II, Organic Chemistry - Chapters 1-5, World History 1800-1900")?', inputType: 'textarea' },
				{ text: 'Allocate specific study hours per subject/topic', requiresContext: true },
				{ text: 'Schedule regular practice tests and quizzes for each subject/topic', requiresContext: true },
				{ text: 'Identify and review weak areas based on test results', requiresContext: true },
				{ text: 'Plan short, regular breaks during study sessions' },
				{ text: 'Schedule a final comprehensive review week before exams' }
			]
		},
		{
			title: 'New Project Kickoff',
			iconKey: 'work',
			goal: 'Successfully launch a new project.',
			steps: [
				{ text: 'Define project scope and primary objectives', inputPrompt: 'What is the overall scope and what are the main objectives of this project?', inputType: 'textarea' },
				{ text: 'Identify key stakeholders and their roles', inputPrompt: 'List key stakeholders and their primary roles/responsibilities (e.g., "Jane Doe - Product Owner, Marketing Team - Feedback & Promotion")?', inputType: 'textarea' },
				{ text: 'Develop a detailed project plan and initial timeline estimate', requiresContext: true },
				{ text: 'Set up communication channels and recurring meeting schedules' },
				{ text: 'Outline necessary resources (budget, team members, tools)' },
				{ text: 'Define Key Performance Indicators (KPIs) for measuring project success' }
			]
		},
		{
			title: 'Habit Building',
			iconKey: 'self-improvement',
			goal: 'Build a new positive habit or skill.',
			steps: [
				{ text: 'Clearly define the new habit or skill you want to build', inputPrompt: 'What specific habit or skill are you aiming to develop (e.g., "Meditate for 10 minutes daily", "Learn conversational Spanish")?', inputType: 'text' },
				{ text: 'Break the habit/skill into small, actionable daily or weekly steps', requiresContext: true },
				{ text: 'Set a SMART goal for this habit/skill', inputPrompt: 'What is your Specific, Measurable, Achievable, Relevant, and Time-bound (SMART) goal (e.g., "Meditate 5 days a week for 1 month", "Be able to hold a 5-minute basic conversation in Spanish in 3 months")?', inputType: 'textarea'},
				{ text: 'Choose a method for tracking consistency' },
				{ text: 'Schedule weekly review and reflection on progress and challenges' },
				{ text: 'Identify potential obstacles and plan strategies to overcome them' }
			]
		}
	];

	let showTemplateUsageModal = false;
	let selectedTemplateForUsage: Template | null = null;
	let newWorkspaceNameFromTemplate = '';
	let projectStartDate: string = '';
	let projectEndDate: string = '';
	let projectNotes: string = '';
	let stepSpecificInputs: Record<number, string> = {};
	let isSubmittingTemplateWorkspace = false;
	let templateFormActionError: string | null = null;
	let templateFormSuccessMessage: string | null = null;

	function openAddBoardModal() {
		workspaceNameInput = '';
		formActionError = null;
		showAddBoardModal = true;
	}
	function closeAddBoardModal() {
		showAddBoardModal = false;
	}

	function requestDeleteBoard(board: { id: string; title: string }) {
		boardToConfirmDelete = board;
		showDeleteBoardConfirm = true;
	}
	function closeDeleteBoardConfirm() {
		boardToConfirmDelete = null;
		showDeleteBoardConfirm = false;
		isDeletingBoard = false;
	}
	
	function openTemplateUsageModal(template: Template) {
		selectedTemplateForUsage = template;
		newWorkspaceNameFromTemplate = `${template.title} Initiative`;
		projectStartDate = new Date().toISOString().split('T')[0];
		projectEndDate = '';
		projectNotes = '';
		stepSpecificInputs = {};
		templateFormActionError = null;
		templateFormSuccessMessage = null;
		isSubmittingTemplateWorkspace = false;
		showTemplateUsageModal = true;
	}

	function closeTemplateUsageModal() {
		showTemplateUsageModal = false;
		selectedTemplateForUsage = null;
	}

	// --- Reactive logic for form handling ---
	$: {
		if (form) {
			formActionError = null;
			templateFormActionError = null;

			if (form.boardForm) {
				isSubmittingWorkspace = false;
				if ('error' in form.boardForm) { 
					formActionError = form.boardForm.error;
					if ('title' in form.boardForm && typeof form.boardForm.title === 'string') {
						workspaceNameInput = form.boardForm.title;
					}
				} else if ('success' in form.boardForm) { 
					pageSuccessMessage = form.boardForm.message;
					invalidateAll(); 
					closeAddBoardModal();
					setTimeout(() => pageSuccessMessage = null, 3000);
				}
			} else if (form.deleteBoardForm) {
				isDeletingBoard = false;
				if ('error' in form.deleteBoardForm) {
					pageError = form.deleteBoardForm.error; 
				} else if ('success' in form.deleteBoardForm) {
					pageSuccessMessage = form.deleteBoardForm.message;
					invalidateAll(); 
					closeDeleteBoardConfirm();
					setTimeout(() => pageSuccessMessage = null, 3000);
				}
			} else if (form.templateForm) {
				isSubmittingTemplateWorkspace = false;
				if ('error' in form.templateForm) { 
					templateFormActionError = form.templateForm.error;
				} else if ('success' in form.templateForm) { 
					templateFormSuccessMessage = form.templateForm.message; 
                    const newBoardTitle = form.templateForm.newBoard.title; // Make sure this path is correct
					pageSuccessMessage = `Workspace "${newBoardTitle}" and AI tasks created! View tasks inside.`;
					invalidateAll(); 
					closeTemplateUsageModal();
					setTimeout(() => {
						pageSuccessMessage = null;
						templateFormSuccessMessage = null; 
					}, 5000);
				}
			}
		}
	}

	let globalClickListener: ((event: MouseEvent) => void) | null = null;
	let escKeyListener: ((event: KeyboardEvent) => void) | null = null;

	onMount(() => {
		username = data.user?.name || getStoredUsername(); 
		if (browser && data.user?.name) { 
			localStorage.setItem('microtask_username', data.user.name);
		}

		if (browser) {
			// Initialize isDarkMode based on localStorage or system preference
			const savedTheme = localStorage.getItem('theme');
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			isDarkMode = savedTheme === 'dark' || (!savedTheme && prefersDark);
			// Apply .dark class to body based on initial state
			if (isDarkMode) {
				document.body.classList.add('dark');
			} else {
				document.body.classList.remove('dark');
			}


			const darkModeButton = document.getElementById('darkModeToggle');
			if (darkModeButton) darkModeButton.addEventListener('click', toggleDarkMode);

			const setupIconListener = (iconId: string, windowId: string) => {
				const iconElement = document.getElementById(iconId);
				if (iconElement) {
					iconElement.addEventListener('click', (e) => {
						e.stopPropagation();
						toggleHeaderWindow(windowId);
						closeOtherHeaderWindows(windowId);
					});
				}
			};
			setupIconListener('bellIcon', 'notifWindow');
			setupIconListener('helpIcon', 'helpWindow');
			setupIconListener('profileIcon', 'profileWindow');
		}

		globalClickListener = (event: MouseEvent) => {
			const target = event.target as Node | null;
			let isClickInsideDropdownTrigger = false;
			const triggerIds = ['bellIcon', 'helpIcon', 'profileIcon'];
			triggerIds.forEach(triggerId => {
				const triggerEl = document.getElementById(triggerId);
				if (triggerEl && triggerEl.contains(target)) isClickInsideDropdownTrigger = true;
			});
			let isClickInsideDropdownWindow = false;
			topHeaderDropdownIds.forEach(windowId => {
				const windowEl = document.getElementById(windowId);
				if (windowEl && !windowEl.classList.contains('hidden') && windowEl.contains(target)) {
					isClickInsideDropdownWindow = true;
				}
			});
			if (!isClickInsideDropdownTrigger && !isClickInsideDropdownWindow) {
				closeOtherHeaderWindows('');
			}

			const sidebarEl = document.getElementById('sidebar');
			const hamburgerButton = document.getElementById('hamburgerButton');
			if (sidebarEl && !sidebarEl.contains(target) && hamburgerButton && !hamburgerButton.contains(target) && isSidebarOpen) {
				closeSidebar();
			}

			const modals = [
				{ modalId: 'addBoardModalContent', condition: showAddBoardModal, closeFn: closeAddBoardModal },
				{ modalId: 'deleteBoardModalContent', condition: showDeleteBoardConfirm, closeFn: closeDeleteBoardConfirm },
				{ modalId: 'templateUsageModalContent', condition: showTemplateUsageModal, closeFn: closeTemplateUsageModal }
			];
			modals.forEach(modal => {
				const modalEl = document.getElementById(modal.modalId);
				if (modal.condition && modalEl && !modalEl.contains(target as Node)) {
					const overlayEl = modalEl.parentElement;
					if (overlayEl && overlayEl === event.target) {
						modal.closeFn();
					}
				}
			});
		};
		document.addEventListener('click', globalClickListener);

		escKeyListener = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				if (isSidebarOpen) closeSidebar();
				if (showAddBoardModal) closeAddBoardModal();
				if (showDeleteBoardConfirm) closeDeleteBoardConfirm();
				if (showTemplateUsageModal) closeTemplateUsageModal();
				closeOtherHeaderWindows(''); 
			}
		};
		document.addEventListener('keydown', escKeyListener);
	});

	onDestroy(() => {
		if (browser) {
			if(globalClickListener) document.removeEventListener('click', globalClickListener);
			if(escKeyListener) document.removeEventListener('keydown', escKeyListener);
			
			// Ensure darkModeToggle listener is removed if it was added
			const darkModeButton = document.getElementById('darkModeToggle');
			if (darkModeButton) darkModeButton.removeEventListener('click', toggleDarkMode);
		}
	});

</script>

<div class={`flex h-screen font-sans ${isDarkMode ? 'dark bg-zinc-900 text-zinc-300' : 'bg-gray-100 text-gray-800'}`}>
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
						class={`flex items-center gap-3 px-3 py-2 rounded-md font-semibold transition-colors duration-150
								${currentPath === '/home' || currentPath === '/' ? (isDarkMode ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white') : (isDarkMode ? 'text-zinc-300 hover:bg-zinc-700' : 'text-gray-700 hover:bg-gray-100')}`}
					>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5" aria-hidden="true"><path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" /><path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" /></svg>
						<span>Home</span>
					</a>
					<a href="/dashboard" 
             class="flex items-center gap-3 px-3 py-2 rounded-md font-semibold transition-colors duration-150"
             class:bg-blue-600={!isDarkMode && $page.url.pathname === '/dashboard'} 
             class:bg-blue-800={isDarkMode && $page.url.pathname === '/dashboard'} 
             class:text-white={$page.url.pathname === '/dashboard'}
             class:text-gray-700={!isDarkMode && $page.url.pathname !== '/dashboard'}
             class:text-zinc-300={isDarkMode && $page.url.pathname !== '/dashboard'}
             class:hover:bg-gray-100={!isDarkMode} 
             class:hover:bg-zinc-700={isDarkMode}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5" aria-hidden="true">
              <path d="M10.5 4.5a1.5 1.5 0 00-3 0v15a1.5 1.5 0 003 0V4.5z" />
              <path d="M4.5 10.5a1.5 1.5 0 000 3h15a1.5 1.5 0 000-3h-15z" /> 
              <path fill-rule="evenodd" d="M1.5 3A1.5 1.5 0 013 1.5h18A1.5 1.5 0 0122.5 3v18a1.5 1.5 0 01-1.5 1.5H3A1.5 1.5 0 011.5 21V3zm1.5.75v16.5h16.5V3.75H3z" clip-rule="evenodd" />
            </svg>
            <span>Dashboard</span>
          </a>
					<a href="/tasks"
						class={`flex items-center gap-3 px-3 py-2 rounded-md font-semibold transition-colors duration-150
								${currentPath === '/tasks' ? (isDarkMode ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white') : (isDarkMode ? 'text-zinc-300 hover:bg-zinc-700' : 'text-gray-700 hover:bg-gray-100')}`}
					>
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" class={`w-5 h-5 ${currentPath === '/tasks' ? 'stroke-white' : (isDarkMode ? 'stroke-zinc-300' : 'stroke-gray-700')}`}><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" /></svg>
						<span>All Tasks</span>
					</a>
					<a href="/calendar"
						class={`flex items-center gap-3 px-3 py-2 rounded-md font-semibold transition-colors duration-150
								${currentPath === '/calendar' ? (isDarkMode ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white') : (isDarkMode ? 'text-zinc-300 hover:bg-zinc-700' : 'text-gray-700 hover:bg-gray-100')}`}
					>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5" aria-hidden="true"><path fill-rule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zM5.25 6.75c-.621 0-1.125.504-1.125 1.125V18a1.125 1.125 0 001.125 1.125h13.5A1.125 1.125 0 0019.875 18V7.875c0-.621-.504-1.125-1.125-1.125H5.25z" clip-rule="evenodd" /><path d="M10.5 9.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H10.5v-.01a.75.75 0 000-1.5zM10.5 12.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H10.5v-.01a.75.75 0 000-1.5zM10.5 15.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H10.5v-.01a.75.75 0 000-1.5zM13.5 9.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H13.5v-.01a.75.75 0 000-1.5zM13.5 12.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H13.5v-.01a.75.75 0 000-1.5zM13.5 15.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H13.5v-.01a.75.75 0 000-1.5zM16.5 9.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H16.5v-.01a.75.75 0 000-1.5zM16.5 12.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H16.5v-.01a.75.75 0 000-1.5zM16.5 15.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H16.5v-.01a.75.75 0 000-1.5z"/></svg>
						<span>Calendar</span>
					</a>
					<a href="/workspace"
						class={`flex items-center gap-3 px-3 py-2 rounded-md font-semibold transition-colors duration-150
								${currentPath === '/workspace' ? (isDarkMode ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white') : (isDarkMode ? 'text-zinc-300 hover:bg-zinc-700' : 'text-gray-700 hover:bg-gray-100')}`}
					>
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" class={`w-5 h-5 ${currentPath === '/workspace' ? 'stroke-white' : (isDarkMode ? 'stroke-zinc-300' : 'stroke-gray-700')}`}><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.098a2.25 2.25 0 0 1-2.25 2.25h-12a2.25 2.25 0 0 1-2.25-2.25V14.15M18 18.75h.75A2.25 2.25 0 0 0 21 16.5v-1.5a2.25 2.25 0 0 0-2.25-2.25h-15A2.25 2.25 0 0 0 1.5 15v1.5A2.25 2.25 0 0 0 3.75 18.75H4.5M12 12.75a3 3 0 0 0-3-3H5.25V7.5a3 3 0 0 1 3-3h7.5a3 3 0 0 1 3 3v2.25H15a3 3 0 0 0-3 3Z" /></svg>
						<span>Workspace</span>
					</a>
					<a href="/ai-chat"
						class={`flex items-center gap-3 px-3 py-2 rounded-md font-semibold transition-colors duration-150
								${currentPath === '/ai-chat' ? (isDarkMode ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white') : (isDarkMode ? 'text-zinc-300 hover:bg-zinc-700' : 'text-gray-700 hover:bg-gray-100')}`}
					>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5" aria-hidden="true"><path d="M12.001 2.504a2.34 2.34 0 00-2.335 2.335v.583c0 .582.212 1.13.582 1.556l.03.035-.03.034a2.34 2.34 0 00-2.917 3.916A3.287 3.287 0 004.08 14.25a3.287 3.287 0 003.287 3.287h8.266a3.287 3.287 0 003.287-3.287 3.287 3.287 0 00-1.253-2.583 2.34 2.34 0 00-2.917-3.916l-.03-.034.03-.035c.37-.425.582-.973.582-1.555v-.583a2.34 2.34 0 00-2.335-2.336h-.002zM9.75 12.75a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5z" /><path fill-rule="evenodd" d="M12 1.5c5.79 0 10.5 4.71 10.5 10.5S17.79 22.5 12 22.5 1.5 17.79 1.5 12 6.21 1.5 12 1.5zM2.85 12a9.15 9.15 0 019.15-9.15 9.15 9.15 0 019.15 9.15 9.15 9.15 0 01-9.15 9.15A9.15 9.15 0 012.85 12z" clip-rule="evenodd" /></svg>
						<span>Ask Synthia</span>
					</a>
				</nav>
			</div>
			<form method="POST" action="?/logout" use:enhance={() => { 
				handleLogout(); 
				return async ({ update }) => { await update(); };
			}}>
				<button type="submit"
					class={`flex items-center gap-3 px-3 py-2 rounded-md font-semibold w-full mt-auto transition-colors duration-150
							${isDarkMode ? 'text-zinc-300 hover:bg-zinc-700' : 'text-gray-700 hover:bg-gray-100'}`}
				>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" class={`w-5 h-5 ${isDarkMode ? 'stroke-zinc-300' : 'stroke-gray-700'}`}><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
					<span>Log out</span>
				</button>
			</form>
		</aside>
		{#if isSidebarOpen}
			<div on:click={closeSidebar} class="fixed inset-0 bg-black opacity-50 z-40 md:hidden" aria-hidden="true"></div>
		{/if}
	{/if}

	<div class="flex-1 flex flex-col overflow-hidden">
		<!-- HEADER COPIED AND ADAPTED FROM YOUR HOME PAGE -->
		<header class={`top-header ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>
			<div class="header-left">
				<button id="hamburgerButton" class="menu-btn md:hidden" on:click={toggleSidebar} aria-label="Toggle Sidebar">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
				</button>
				<a href="/home" class="logo hidden md:flex">
					<img src="/logonamin.png" alt="Microtask Logo" class="h-8 w-auto">
					<span class={`${isDarkMode ? 'text-zinc-100' : 'text-gray-800'}`}>Microtask</span>
				</a>
				<h1 class="text-xl font-semibold ml-2 md:ml-0 ${isDarkMode ? 'text-zinc-100' : 'text-gray-800'}">Workspace</h1>
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
						<ul class="list-disc list-inside space-y-1 text-xs">
							<li>How to create workspace?</li>
							<li>Where are my tasks?</li>
						</ul>
						<a href="/support" class="text-xs text-blue-600 hover:underline mt-2 block ${isDarkMode ? 'dark:text-blue-400' : ''}">Visit Support</a>
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
						<form method="POST" action="?/logout" use:enhance={() => { 
							handleLogout(); 
							return async ({ update }) => { await update(); };
						}}>
							<button type="submit" class={`text-xs px-2 py-1.5 rounded w-full text-left transition-colors duration-150 ${isDarkMode ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-red-100 hover:bg-red-200 text-red-700'}`}>Logout</button>
						</form>
					</div>
				</div>
				<button id="darkModeToggle" aria-label="Toggle Dark Mode" class={`ml-2 p-1.5 rounded-full transition-colors duration-150 ${isDarkMode ? 'hover:bg-zinc-700 text-zinc-300' : 'hover:bg-gray-100 text-gray-700'}`}>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
						{#if isDarkMode} <path fill-rule="evenodd" d="M12 1.5a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0112 1.5zM12 6.75a5.25 5.25 0 100 10.5 5.25 5.25 0 000-10.5zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5zM5.25 12a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zm12 0a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zm-2.645-4.97a.75.75 0 10-1.06-1.06L12.53 7.03a.75.75 0 001.06 1.06l1.06-1.061zM7.03 12.53a.75.75 0 10-1.06 1.06L7.03 14.65a.75.75 0 001.06-1.06L7.03 12.53zm7.59-5.56a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 101.06 1.06l1.06-1.06zM7.03 7.03a.75.75 0 10-1.06 1.06l1.06 1.061a.75.75 0 101.06-1.06L7.03 7.03z" clip-rule="evenodd"/>
						{:else} <path fill-rule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM12 16.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Z" clip-rule="evenodd" /> {/if}
					</svg>
				</button>
			</div>
		</header>

		{#if pageError && !formActionError && !templateFormActionError }
			<div class="m-4 p-4 bg-red-100 border border-red-400 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300 rounded-md relative" role="alert">
				<strong class="font-bold">Error:</strong>
				<span class="block sm:inline">{pageError}</span>
				<button on:click={() => pageError = null} class="absolute top-0 bottom-0 right-0 px-4 py-3" aria-label="Close error">
					<span class="text-2xl leading-none">×</span>
				</button>
			</div>
		{/if}
		{#if pageSuccessMessage }
			<div class="m-4 p-4 bg-green-100 border border-green-400 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300 rounded-md relative" role="alert">
				<span class="block sm:inline">{pageSuccessMessage}</span>
				<button on:click={() => pageSuccessMessage = null} class="absolute top-0 bottom-0 right-0 px-4 py-3" aria-label="Close message">
					<span class="text-2xl leading-none">×</span>
				</button>
			</div>
		{/if}
		
		<!-- MAIN CONTENT AREA WITH PADDING-TOP -->
		<main class="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 pt-[76px]">
			<!-- Added pt-[76px] to prevent header clipping. Adjust value if header height changes. -->
			<div class="container mx-auto">
				<div class="flex justify-between items-center mb-6">
					<h2 class="text-2xl font-semibold text-gray-700 dark:text-gray-300">Your Workspaces</h2>
					<button on:click={openAddBoardModal} class="flex items-center bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-150">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 mr-2"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" /></svg>
						New Workspace
					</button>
				</div>

				<section class="mb-12">
					<h3 class="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-4 sr-only">List of Your Workspaces</h3>
					{#if boards && boards.length > 0}
						<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
							{#each boards as board (board.id)}
								<a href="/workspace/{board.id}" class="block bg-white dark:bg-zinc-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200 p-6 relative">
									<h4 class="text-lg font-bold text-blue-600 dark:text-blue-400 mb-2 truncate">{board.title}</h4>
									{#if board.createdAtISO}
										<p class="text-xs text-gray-500 dark:text-zinc-400">
											Created: {new Date(board.createdAtISO).toLocaleDateString()}
										</p>
									{/if}
									<button
										on:click|stopPropagation|preventDefault={() => requestDeleteBoard(board)}
										aria-label={`Delete workspace ${board.title}`}
										class={`absolute top-2 right-2 p-1.5 rounded-full text-xs transition-colors duration-150 ${
											isDarkMode ? 'text-red-400 hover:bg-red-700 hover:text-white' : 'text-red-500 hover:bg-red-100 hover:text-red-700'
										}`}
										disabled={isDeletingBoard && boardToConfirmDelete?.id === board.id}
									>
										{#if isDeletingBoard && boardToConfirmDelete?.id === board.id}
											<svg class="animate-spin h-4 w-4 text-currentColor" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
												<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
												<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
											</svg>
										{:else}
											<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.58.177-2.34.294a.75.75 0 0 0-.706.705c-.117.76-.217 1.545-.294 2.34V16.25A2.75 2.75 0 0 0 5.25 19h9.5A2.75 2.75 0 0 0 17.5 16.25V7.534c-.077-.795-.177-1.58-.294-2.34a.75.75 0 0 0-.705-.705c-.76-.117-1.545-.217-2.34-.294V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.67.036 2.5.108V5.25a.75.75 0 0 0 .75.75h1.142c.072.83.108 1.66.108 2.5v6.392c0 .84-.036 1.67-.108 2.5H6.608c-.072-.83-.108-1.66-.108-2.5V8.5c0-.84.036 1.67.108 2.5h1.142a.75.75 0 0 0 .75-.75V4.108C8.33 4.036 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.06-1.06L6.25 8a.75.75 0 0 0-1.06 1.06L6.44 10l-1.27 1.27a.75.75 0 1 0 1.06 1.06L7.5 11.06l1.27 1.27a.75.75 0 1 0 1.06-1.06L8.56 10l1.27-1.27a.75.75 0 0 0-1.06-1.06L7.5 8.94l.06-.06Z" clip-rule="evenodd" /></svg>
									{/if}
								</button>
							</a>
						{/each}
						<button on:click={openAddBoardModal} class="flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-800/50 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-lg shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 p-6 text-gray-500 dark:text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 min-h-[120px]">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-8 h-8 mb-2"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" /></svg>
							<span class="text-sm font-medium">Add Workspace</span>
						</button>
					</div>
				{:else if !data.error}
					<div class="text-center py-10 px-6 bg-white dark:bg-zinc-800 rounded-lg shadow">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-16 h-16 text-gray-400 dark:text-zinc-500 mx-auto mb-4">
							<path d="M2.25 21h19.5A2.25 2.25 0 0024 18.75V5.25A2.25 2.25 0 0021.75 3H2.25A2.25 2.25 0 000 5.25v13.5A2.25 2.25 0 002.25 21zM18.75 10.5A.75.75 0 0118 9.75H6a.75.75 0 010-1.5h12a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-1.5H9.75V15A.75.75 0 019 15.75H7.5a.75.75 0 01-.75-.75V9.362a2.251 2.251 0 011.437-2.097l4.5-.818a2.25 2.25 0 012.563 2.097v1.875H18a.75.75 0 01.75.75v.375z" />
						</svg>
						<h3 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No Workspaces Yet</h3>
						<p class="text-gray-500 dark:text-zinc-400 mb-4">
							It looks like you haven't created any workspaces. <br />
							Workspaces help you organize your tasks into projects or different areas of focus.
						</p>
						<button on:click={openAddBoardModal} class="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-colors duration-150">
							Create Your First Workspace
						</button>
					</div>
				{/if}
			</section>

			<section class="mt-12"> <!-- Changed from mb-12 to mt-12 -->
				<h3 class="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-1">PREMADE TEMPLATES FOR YOUR WORKSPACE</h3>
				<p class="text-sm text-gray-500 dark:text-zinc-400 mb-6">
					Having a hard time getting started? Use our pre-made workspace templates to jump right in and stay productive—no stress, just progress.
				</p>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each templates as template (template.title)}
						<div class="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6 flex flex-col">
							<div class="flex items-center mb-3">
								<span class="p-2 bg-blue-100 dark:bg-blue-700/30 rounded-full mr-3">
									{#if template.iconKey === "study"}
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 text-blue-500 dark:text-blue-400"><path d="M2.5 1A1.5 1.5 0 0 0 1 2.5v15A1.5 1.5 0 0 0 2.5 19h15a1.5 1.5 0 0 0 1.5-1.5v-15A1.5 1.5 0 0 0 17.5 1h-15ZM2.75 5.24v11.261c0 .136.11.25.25.25h13.998a.25.25 0 0 0 .251-.25V5.239c-.54.091-1.12.15-1.749.17P12.5 5.5 10 6l-2.5-.5c-.63-.02-1.209-.079-1.751-.17Z" /></svg>
									{:else if template.iconKey === "work"}
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 text-blue-500 dark:text-blue-400"><path fill-rule="evenodd" d="M6 3.75A2.75 2.75 0 0 1 8.75 1h2.5A2.75 2.75 0 0 1 14 3.75v.438A2.5 2.5 0 0 0 12.5 3h-5A2.5 2.5 0 0 0 6 4.188V3.75ZM13.5 6A1.5 1.5 0 0 1 15 7.5v6A1.5 1.5 0 0 1 13.5 15h-7A1.5 1.5 0 0 1 5 13.5v-6A1.5 1.5 0 0 1 6.5 6h7Zm0 1.5H6.5V13h7V7.5Z" clip-rule="evenodd" /></svg>
									{:else if template.iconKey === "self-improvement"}
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 text-blue-500 dark:text-blue-400"><path d="M11.213 4.042S8.446 3.214 6.83 4.83c-1.224 1.223-1.037 3.304.196 4.537l-.392.393a.75.75 0 001.06 1.061l.393-.392c1.233 1.233 3.314 1.037 4.537.196 1.617-1.617.789-4.384.789-4.384S12.436 5.266 11.213 4.042ZM10 9.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3Z" /><path d="M17.5 6.5c0 .69-.56 1.25-1.25 1.25S15 7.19 15 6.5s.56-1.25 1.25-1.25S17.5 5.81 17.5 6.5ZM14.452 2.456a1.25 1.25 0 011.768 0l.022.021c.48.48.48 1.256 0 1.736L15.25 5.206a1.25 1.25 0 01-1.736-1.736l.938-.914Z" /></svg>
									{:else}
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 text-blue-500 dark:text-blue-400"><path d="M10 3.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5ZM9.25 9.545v4.578A.75.75 0 0 0 10 14.873a.75.75 0 0 0 .75-.75V9.546A2.265 2.265 0 0 1 10 9.25c-.134 0-.265.01-.393.029a2.257 2.257 0 0 1-.357.266ZM7.625 5.155A2.255 2.255 0 0 1 7.5 5.5c0 .481.153.923.412 1.285A2.255 2.255 0 0 1 7.625 5.155ZM5.155 7.625A2.255 2.255 0 0 1 5.5 7.5c.481 0 .923.153 1.285.412A2.255 2.255 0 0 1 5.155 7.625ZM12.375 5.155A2.255 2.255 0 0 1 12.5 5.5c0 .481-.153.923-.412 1.285A2.255 2.255 0 0 1 12.375 5.155ZM14.845 7.625A2.255 2.255 0 0 1 14.5 7.5c-.481 0-.923.153-1.285.412A2.255 2.255 0 0 1 14.845 7.625Z" /></svg>
									{/if}
								</span>
								<h4 class="text-lg font-bold text-gray-700 dark:text-gray-200">{template.title}</h4>
							</div>
							<p class="text-sm text-gray-600 dark:text-zinc-400 mb-3">
								<strong class="font-medium">Goal:</strong> {template.goal}
							</p>
							<ul class="list-disc list-inside text-sm text-gray-500 dark:text-zinc-400 space-y-1 mb-4 flex-grow">
								{#each template.steps.slice(0, 4) as step}
									<li>{step.text}</li>
								{/each}
								{#if template.steps.length > 4}
									<li>...and more</li>
								{/if}
							</ul>
							<button
								on:click={() => openTemplateUsageModal(template)}
								class="mt-auto w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-150"
							>
								Use Template
							</button>
						</div>
					{/each}
				</div>
			</section>
		</div>
	</main>

	<footer class="text-center p-4 text-sm text-gray-500 dark:text-zinc-400 border-t dark:border-zinc-700">
		Microtask © {new Date().getFullYear()}
	</footer>
</div>
</div>
<!-- Modals (Add Board, Delete Board, Use Template) -->
<!-- Add Board Modal -->
{#if showAddBoardModal}
<div class="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4" id="addBoardModalOverlay">
	<div id="addBoardModalContent" class="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-xl w-full max-w-md transform transition-all">
		<div class="flex justify-between items-center mb-4">
			<h3 class="text-xl font-semibold text-gray-700 dark:text-gray-200">Create New Workspace</h3>
			<button on:click={closeAddBoardModal} class="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors">
				<span class="text-2xl leading-none">×</span>
			</button>
		</div>
		<form method="POST" action="?/addBoard" use:enhance={() => {
            isSubmittingWorkspace = true;
            formActionError = null; 
            return async ({ update }) => {
                await update(); 
            };
        }}>
			<div class="mb-4">
				<label for="workspaceNameModalInput" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Workspace Name <span class="text-red-500">*</span></label>
				<input type="text" id="workspaceNameModalInput" name="title" bind:value={workspaceNameInput} required maxlength="100"
					class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
					placeholder="e.g., Q3 Project, Home Renovation"
				/>
			</div>
			{#if formActionError}
				<p class="text-sm text-red-500 dark:text-red-400 mb-3">{formActionError}</p>
			{/if}
			<div class="flex justify-end space-x-3">
				<button type="button" on:click={closeAddBoardModal}
					class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 rounded-md border border-gray-300 dark:border-zinc-500 transition-colors"
					disabled={isSubmittingWorkspace}>
					Cancel
				</button>
				<button type="submit"
					class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 flex items-center"
					disabled={isSubmittingWorkspace || !workspaceNameInput.trim()}>
					{#if isSubmittingWorkspace}
						<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg> Creating...
					{:else}
						Create Workspace
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>
{/if}
<!-- Delete Board Confirmation Modal -->
{#if showDeleteBoardConfirm && boardToConfirmDelete}
<div class="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4" id="deleteBoardModalOverlay">
	<div id="deleteBoardModalContent" class="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-xl w-full max-w-md transform transition-all">
		<div class="flex justify-between items-center mb-4">
			<h3 class="text-xl font-semibold text-red-600 dark:text-red-400">Confirm Deletion</h3>
			<button on:click={closeDeleteBoardConfirm} class="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors">
				<span class="text-2xl leading-none">×</span>
			</button>
		</div>
		<form method="POST" action="?/deleteBoard" use:enhance={() => {
            isDeletingBoard = true;
            return async ({ update }) => {
                await update();
            };
        }}>
			<input type="hidden" name="boardId" value={boardToConfirmDelete.id} />
			<p class="text-gray-600 dark:text-gray-300 mb-2">
				Are you sure you want to delete the workspace "<strong>{boardToConfirmDelete.title}</strong>"?
			</p>
			<p class="text-sm text-red-500 dark:text-red-400 mb-6">
				This action cannot be undone and will also delete ALL tasks within this workspace.
			</p>
			<div class="flex justify-end space-x-3">
				<button type="button" on:click={closeDeleteBoardConfirm}
					class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 rounded-md border border-gray-300 dark:border-zinc-500 transition-colors"
					disabled={isDeletingBoard}>
					Cancel
				</button>
				<button type="submit"
					class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 flex items-center"
					disabled={isDeletingBoard}>
					{#if isDeletingBoard}
						<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg> Deleting...
					{:else}
						Delete Workspace
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>
{/if}
<!-- Use Template Modal -->
{#if showTemplateUsageModal && selectedTemplateForUsage}
<div class="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4" id="templateUsageModalOverlay">
	<div id="templateUsageModalContent" class="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-xl w-full max-w-lg transform transition-all max-h-[90vh] flex flex-col">
		<div class="flex justify-between items-center mb-4 flex-shrink-0">
			<h3 class="text-xl font-semibold text-gray-700 dark:text-gray-200">Use Template: {selectedTemplateForUsage.title}</h3>
			<button on:click={closeTemplateUsageModal} class="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors">
				<span class="text-2xl leading-none">×</span>
			</button>
		</div>
<form method="POST" action="?/createWorkspaceFromTemplate" use:enhance={() => {
		isSubmittingTemplateWorkspace = true;
		templateFormActionError = null;
		templateFormSuccessMessage = null; 
		return async ({ update }) => {
			await update(); 
		};
	}} class="flex flex-col flex-grow overflow-hidden">
		<div class="overflow-y-auto pr-2 flex-grow mb-4 custom-scrollbar">
			<p class="text-sm text-gray-600 dark:text-zinc-400 mb-3"><strong class="font-medium">Template Goal:</strong> {selectedTemplateForUsage.goal}</p>
			
			<input type="hidden" name="templateTitle" value={selectedTemplateForUsage.title} />
			<input type="hidden" name="templateGoal" value={selectedTemplateForUsage.goal} />
			<input type="hidden" name="templateStepsJSON" value={JSON.stringify(selectedTemplateForUsage.steps)} />
			<input type="hidden" name="stepSpecificInputsJSON" value={JSON.stringify(stepSpecificInputs)} />

			<div class="mb-4">
				<label for="newWorkspaceNameFromTemplate" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name for your new workspace <span class="text-red-500">*</span></label>
				<input type="text" id="newWorkspaceNameFromTemplate" name="workspaceName" bind:value={newWorkspaceNameFromTemplate} required maxlength="100"
					class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
					placeholder="e.g., My Study Plan for Finals"
				/>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
				<div>
					<label for="projectStartDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan Start Date</label>
					<input type="date" id="projectStartDate" name="projectStartDate" bind:value={projectStartDate}
						class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
					/>
					<p class="text-xs text-gray-500 dark:text-zinc-400 mt-1">Tasks will be scheduled from this date.</p>
				</div>
				<div>
					<label for="projectEndDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan End Date (Optional)</label>
					<input type="date" id="projectEndDate" name="projectEndDate" bind:value={projectEndDate}
						class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
					/>
					<p class="text-xs text-gray-500 dark:text-zinc-400 mt-1">Distribute tasks until this date if set.</p>
				</div>
			</div>
			
			<hr class="my-4 dark:border-zinc-700"/>
			<p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Help the AI tailor your tasks:</p>

			{#each selectedTemplateForUsage.steps as step, i}
				{#if step.inputPrompt}
					<div class="mb-4 p-3 bg-gray-50 dark:bg-zinc-700/50 rounded-md border dark:border-zinc-600">
						<label for={`step-input-${i}`} class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">{step.inputPrompt}</label>
						{#if step.inputType === 'textarea'}
							<textarea id={`step-input-${i}`} name={`step_input_${i}`} bind:value={stepSpecificInputs[i]} rows="2"
								class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
							></textarea>
						{:else}
							<input type="text" id={`step-input-${i}`} name={`step_input_${i}`} bind:value={stepSpecificInputs[i]}
								class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
							/>
						{/if}
						<p class="text-xs text-gray-500 dark:text-zinc-400 mt-1">AI will use this to customize the task: "<em>{step.text}</em>".</p>
					</div>
				{/if}
			{/each}

			<hr class="my-4 dark:border-zinc-700"/>

			<div class="mb-4">
				<label for="projectNotes" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">General Notes/Additional Context (Optional)</label>
				<textarea id="projectNotes" name="projectNotes" bind:value={projectNotes} rows="2"
					class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
					placeholder="Any other details for the AI to consider for all tasks."
				></textarea>
			</div>

			{#if templateFormActionError}
				<p class="text-sm text-red-500 dark:text-red-400 mb-3">{templateFormActionError}</p>
			{/if}
			{#if templateFormSuccessMessage && !pageSuccessMessage}
				<p class="text-sm text-green-500 dark:text-green-400 mb-3">{templateFormSuccessMessage}</p>
			{/if}
		</div>
		
		<div class="flex justify-end space-x-3 pt-4 border-t dark:border-zinc-700 flex-shrink-0">
			<button type="button" on:click={closeTemplateUsageModal}
				class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 rounded-md border border-gray-300 dark:border-zinc-500 transition-colors"
				disabled={isSubmittingTemplateWorkspace}>
				Cancel
			</button>
			<button type="submit"
				class="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 flex items-center"
				disabled={isSubmittingTemplateWorkspace || !newWorkspaceNameFromTemplate.trim()}>
				{#if isSubmittingTemplateWorkspace}
					<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg> Creating...
				{:else}
					Create Workspace & AI Tasks
				{/if}
			</button>
		</div>
	</form>
</div>
</div>
{/if}
<style>
	.font-sans { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
	:global(body, html) { height: 100%; margin: 0; padding: 0; overflow: hidden; }
	
	::-webkit-scrollbar { width: 6px; height: 6px; }
	::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 3px; }
	::-webkit-scrollbar-thumb { background: #c5c5c5; border-radius: 3px; }
	::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
	.custom-scrollbar { scrollbar-width: thin; scrollbar-color: #c5c5c5 #f1f1f1; } 
	
	:global(.dark) ::-webkit-scrollbar-track { background: #2d3748; } 
	:global(.dark) ::-webkit-scrollbar-thumb { background: #4a5568; } 
	:global(.dark) ::-webkit-scrollbar-thumb:hover { background: #718096; } 
	:global(.dark) .custom-scrollbar { scrollbar-color: #4a5568 #2d3748; }

	.top-header {
		position: fixed; top: 0; left: 0; right: 0; 
		width: 100%; 
		display: flex; align-items: center; justify-content: space-between;
		padding: 0 1rem; height: 60px; z-index: 30; 
		box-shadow: 0 1px 3px rgba(0,0,0,0.05);
		transition: background-color 0.2s, border-color 0.2s;
	}
	.header-left { display: flex; align-items: center; gap: 0.75rem; }
	.top-header .menu-btn {
		background: none; border: none; cursor: pointer; padding: 0.5rem;
		border-radius: 9999px; transition: background-color 0.15s ease;
		display: flex; align-items: center; justify-content: center;
	}
	.top-header .menu-btn:hover { background-color: #f3f4f6; } 
	:global(.dark) .top-header .menu-btn:hover { background-color: #374151; } 
	.top-header .menu-btn svg { width: 1.5rem; height: 1.5rem; display: block; }
	:global(.dark) .top-header .menu-btn svg { stroke: #d1d5db; } 


	.top-header .logo { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; font-size: 1.125rem; text-decoration: none; }
	.top-header .logo img { height: 2rem; width: auto; }
	
	.top-header .header-icons { display: flex; align-items: center; gap: 0.25rem; }
	.top-header .header-icons button {
		background: none; border: none; cursor: pointer; padding: 0.5rem;
		line-height: 0; display: flex; align-items: center; justify-content: center;
		border-radius: 9999px; width: 36px; height: 36px;
		transition: background-color 0.15s ease;
	}
	.top-header .header-icons button:hover { background-color: #f3f4f6; } 
	:global(.dark) .top-header .header-icons button:hover { background-color: #374151; } 
	.top-header .header-icons svg { height: 1.25rem; width: 1.25rem; opacity: 0.9; }
	:global(:not(.dark)) .top-header .header-icons svg { fill: #4b5563; } 
	:global(.dark) .top-header .header-icons svg { fill: #d1d5db; } 

	.relative { position: relative; }
	.dropdown-window {
		position: absolute; right: 0; top: calc(100% + 8px);
		border-radius: 0.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
		padding: 0.75rem; width: 260px; z-index: 35; 
		opacity: 0; transform: translateY(-5px) scale(0.98);
		transition: opacity 0.15s ease-out, transform 0.15s ease-out, visibility 0s linear 0.15s;
		pointer-events: none; visibility: hidden;
	}
	.dropdown-window:not(.hidden) { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; visibility: visible; transition-delay: 0s;}
	.hidden { display: none !important; } 

	:global(aside nav a.bg-blue-600 svg), :global(aside nav a.bg-blue-700 svg) {
		fill: white !important; 
		stroke: white !important; 
	}
	:global(aside nav a.bg-blue-600 img), :global(aside nav a.bg-blue-700 img) { 
		filter: brightness(0) invert(1);
	}
	:global(.dark aside nav a:not(.bg-blue-700) svg[stroke]) { stroke: #d1d5db; } 
	:global(.dark aside nav a:not(.bg-blue-700) img) { filter: invert(0.8); }
	:global(body:not(.dark) aside nav a:not(.bg-blue-600) img) { filter: none; }

	:global(.dark .bg-zinc-900) { background-color: #18181b; }
	:global(.dark .text-zinc-300) { color: #d4d4d8; }
	:global(.dark .bg-zinc-800) { background-color: #27272a; }
	:global(.dark .border-zinc-700) { border-color: #3f3f46; }
	:global(.dark .text-zinc-100) { color: #f4f4f5; }
	:global(.dark .text-zinc-200) { color: #e4e4e7; }
	:global(.dark .text-zinc-400) { color: #a1a1aa; }
	:global(.dark .hover\:bg-zinc-700:hover) { background-color: #3f3f46; }
	:global(.dark .bg-zinc-700) { background-color: #3f3f46; }
	:global(.dark .border-zinc-600) { border-color: #52525b; }
	:global(.dark .bg-zinc-600) { background-color: #52525b; }
	:global(.dark .hover\:bg-zinc-600:hover) { background-color: #52525b; }
	:global(.dark .hover\:bg-zinc-500:hover) { background-color: #71717a; }
	
	:global(.dark .bg-blue-700) { background-color: #2563eb; } 
	:global(.dark .dark\:text-blue-400) { color: #60a5fa; }
		
	:global(.dark .dark\:hover\:bg-blue-700\/30:hover) { background-color: rgba(59, 130, 246, 0.3); }

	:global(.dark .bg-gray-100) { background-color: #18181b; } 
	:global(.dark .text-gray-800) { color: #d4d4d8; } 

	main {
		padding-top: 60px; 
	}

	:global(.dark input[type="text"]), 
	:global(.dark input[type="date"]), 
	:global(.dark textarea) {
		background-color: #3f3f46; 
		border-color: #52525b;    
		color: #f4f4f5;          
	}
	:global(.dark input::placeholder), 
	:global(.dark textarea::placeholder) {
		color: #a1a1aa; 
	}
	:global(.dark select) { 
		background-color: #3f3f46;
		border-color: #52525b;
		color: #f4f4f5;
	}

	:global(.dark .dark\:bg-blue-700\/30) {
		background-color: rgba(37, 99, 235, 0.3) !important; 
	}
	:global(.dark .dark\:text-blue-400) {
		color: #60a5fa !important;
	}

</style>