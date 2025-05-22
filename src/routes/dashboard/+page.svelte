<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
    import { browser } from '$app/environment';
	import { Chart, registerables, type ChartConfiguration, type ChartItem } from 'chart.js';
    import { globalChartDisplayType, type GlobalChartType } from '$lib/stores/chartTypeStore';
    import { fly } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';

	export let data: import('./$types').PageData;

	let username: string = data.user?.name || 'User';
	let isSidebarOpen = false; // Sidebar starts closed, no localStorage
	let isDarkMode = false;
	let showProfileDropdown = false; // For Dashboard's specific profile dropdown

    // For Notification and Help dropdowns, profileWindow is handled by showProfileDropdown
    const dropdownIds = ['notifWindow', 'helpWindow', 'profileWindow'];

	$: dashboardStats = data.dashboardStats;
	$: pageError = data.error;

    $: if (data && data.user?.name) {
        username = data.user.name;
    } else if (data && !data.user?.name) {
        username = 'User';
    }


	let prioritiesChartCanvas: HTMLCanvasElement | undefined;
	let prioritiesChart: Chart<GlobalChartType> | undefined;
    let lastPrioritiesChartRenderedType: GlobalChartType | undefined = undefined;

	let timelinessChartCanvas: HTMLCanvasElement | undefined;
	let timelinessChart: Chart<GlobalChartType> | undefined;
    let lastTimelinessChartRenderedType: GlobalChartType | undefined = undefined;

	let tasksCompletedChartCanvas: HTMLCanvasElement | undefined;
	let tasksCompletedChart: Chart<GlobalChartType> | undefined;
    let lastTasksCompletedChartRenderedType: GlobalChartType | undefined = undefined;

	const chartColorPalette = {
        red: { light: 'rgba(255, 99, 132, 0.8)', dark: 'rgba(255, 99, 132, 0.9)', border: 'rgba(255, 99, 132, 1)'},
        blue: { light: 'rgba(54, 162, 235, 0.8)', dark: 'rgba(54, 162, 235, 0.9)', border: 'rgba(54, 162, 235, 1)'},
        yellow: { light: 'rgba(255, 206, 86, 0.8)', dark: 'rgba(255, 206, 86, 0.9)', border: 'rgba(255, 206, 86, 1)'},
        green: { light: 'rgba(75, 192, 192, 0.8)', dark: 'rgba(75, 192, 192, 0.9)', border: 'rgba(75, 192, 192, 1)'},
        purple: { light: 'rgba(153, 102, 255, 0.8)', dark: 'rgba(153, 102, 255, 0.9)', border: 'rgba(153, 102, 255, 1)'},
        orange: { light: 'rgba(255, 159, 64, 0.8)', dark: 'rgba(255, 159, 64, 0.9)', border: 'rgba(255, 159, 64, 1)'},
        gray: { light: 'rgba(201, 203, 207, 0.8)', dark: 'rgba(100, 116, 139, 0.9)', border: 'rgba(201, 203, 207, 1)'}
    };

    let unsubscribeGlobalChartType: () => void;

    function toggleSidebar() {
        isSidebarOpen = !isSidebarOpen;
        // No localStorage persistence for sidebar
    }

    function closeSidebar() {
        isSidebarOpen = false;
        // No localStorage persistence for sidebar
    }

    function toggleDarkMode() {
		isDarkMode = !isDarkMode;
        if (browser) {
		    document.body.classList.toggle('dark', isDarkMode); // Target document.body
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light'); // Theme persistence is fine
        }
        initOrUpdateAllCharts();
	}

    function toggleProfileDropdown() {
        showProfileDropdown = !showProfileDropdown;
        if (showProfileDropdown) {
            // Close other non-profile dropdowns when profile opens
            closeOtherWindows('profileWindow');
        }
    }

    function toggleWindow(id: string) { // For notif and help windows
        const el = document.getElementById(id);
        if (el) {
            const isHidden = el.classList.contains('hidden');
            el.classList.toggle('hidden');
            if (!isHidden) { // If it was just opened
                closeOtherWindows(id);
            }
        }
    }

    function closeOtherWindows(currentId: string) {
        dropdownIds.forEach(id => {
            if (id !== currentId) {
                const el = document.getElementById(id);
                if (id === 'profileWindow') {
                    // Only close profile if currentId is NOT profileWindow (meaning another dropdown triggered this)
                    // or if currentId is empty (global click)
                    if (showProfileDropdown && (currentId === '' || currentId !== 'profileWindow')) {
                        showProfileDropdown = false;
                    }
                } else {
                    if (el && !el.classList.contains('hidden')) {
                        el.classList.add('hidden');
                    }
                }
            }
        });
    }

    let handleGlobalClickListener: ((event: MouseEvent) => void) | null = null;
    let handleEscKeyListener: ((event: KeyboardEvent) => void) | null = null;

	onMount(() => {
		Chart.register(...registerables);
        const storedDarkMode = localStorage.getItem('theme');
		if (storedDarkMode === 'dark' || (!storedDarkMode && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
			isDarkMode = true;
			document.body.classList.add('dark'); // Target document.body
		} else {
            isDarkMode = false;
            document.body.classList.remove('dark'); // Target document.body
        }
		// No loading of sidebar state from localStorage

        if (browser) {
            const localUsername = localStorage.getItem('microtask_username');
            if (localUsername && localUsername !== username) {
                username = localUsername;
            }
        }

        unsubscribeGlobalChartType = globalChartDisplayType.subscribe(_value => {
            if (browser && dashboardStats && prioritiesChartCanvas && timelinessChartCanvas && tasksCompletedChartCanvas) {
                initOrUpdateAllCharts();
            }
        });

        const setupIconListener = (iconId: string, windowId: string) => {
            const iconElement = document.getElementById(iconId);
            if (iconElement) {
              // Use Svelte's on:click for profileIcon
              if (iconId !== 'profileIcon') {
                  iconElement.addEventListener('click', (e) => {
                    e.stopPropagation(); // Important for these dropdowns
                    toggleWindow(windowId); // This already calls closeOtherWindows
                  });
              }
            }
        };
        setupIconListener('bellIcon', 'notifWindow');
        setupIconListener('helpIcon', 'helpWindow');
        // Profile icon uses on:click={toggleProfileDropdown} directly in HTML

        handleGlobalClickListener = (event: MouseEvent) => {
            const target = event.target as Node | null;
            let isClickInsideHeaderDropdownTrigger = false;
            const headerTriggerIds = ['bellIcon', 'helpIcon', 'profileIcon'];
            headerTriggerIds.forEach(triggerId => {
                const triggerEl = document.getElementById(triggerId);
                if (triggerEl && triggerEl.contains(target)) isClickInsideHeaderDropdownTrigger = true;
            });

            let isClickInsideHeaderDropdownWindow = false;
            dropdownIds.forEach(windowId => { // Check all dropdown windows
                const windowEl = document.getElementById(windowId);
                if (windowEl && windowEl.contains(target)) isClickInsideHeaderDropdownWindow = true;
            });
            
            if (!isClickInsideHeaderDropdownTrigger && !isClickInsideHeaderDropdownWindow) {
                closeOtherWindows(''); // Close all if click is truly outside
                if (showProfileDropdown) showProfileDropdown = false; // Explicitly for profile if clickOutside didn't catch
            }

            // Sidebar closing logic (relies on this when hamburger doesn't stop propagation)
            const sidebarEl = document.getElementById('sidebar');
            const hamburgerButton = document.getElementById('hamburgerButton');
            if (isSidebarOpen && sidebarEl && !sidebarEl.contains(target) && hamburgerButton && !hamburgerButton.contains(target)) {
                closeSidebar();
            }
        };
        document.addEventListener('click', handleGlobalClickListener);
        
        handleEscKeyListener = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                if (showProfileDropdown) showProfileDropdown = false;
                if (isSidebarOpen) closeSidebar();
                // Close bell & help dropdowns
                dropdownIds.forEach(id => {
                    if (id !== 'profileWindow') { // Profile is handled by showProfileDropdown
                        const el = document.getElementById(id);
                        if (el && !el.classList.contains('hidden')) {
                            el.classList.add('hidden');
                        }
                    }
                });
            }
        };
		document.addEventListener('keydown', handleEscKeyListener);

		return () => {
			prioritiesChart?.destroy();
			timelinessChart?.destroy();
			tasksCompletedChart?.destroy();
            if (unsubscribeGlobalChartType) unsubscribeGlobalChartType();
            if (handleGlobalClickListener) document.removeEventListener('click', handleGlobalClickListener);
			if (handleEscKeyListener) document.removeEventListener('keydown', handleEscKeyListener);

            // Basic cleanup for listeners added with addEventListener
            const bellIconEl = document.getElementById('bellIcon');
            if (bellIconEl) bellIconEl.onclick = null; // Or remove specific if more than one listener type
            const helpIconEl = document.getElementById('helpIcon');
            if (helpIconEl) helpIconEl.onclick = null;
		};
	});

    function updateChartGlobalDefaults() {
        if (!browser) return;
        Chart.defaults.color = isDarkMode ? '#d1d5db' : '#374151';
        Chart.defaults.borderColor = isDarkMode ? 'rgba(75, 85, 99, 0.5)' : 'rgba(229, 231, 235, 0.7)';
    }

	$: if (
		browser &&
		dashboardStats &&
		prioritiesChartCanvas &&
		timelinessChartCanvas &&
		tasksCompletedChartCanvas &&
        typeof isDarkMode === 'boolean' // Ensure dark mode status is determined before first chart render
	) {
		initOrUpdateAllCharts();
	}

    function initOrUpdateAllCharts() {
        if (browser && dashboardStats && prioritiesChartCanvas && timelinessChartCanvas && tasksCompletedChartCanvas) {
            updateChartGlobalDefaults();
            createOrUpdatePrioritiesChart(dashboardStats, $globalChartDisplayType);
            createOrUpdateTimelinessChart(dashboardStats, $globalChartDisplayType);
            createOrUpdateTasksCompletedChart(dashboardStats, $globalChartDisplayType);
        }
    }

    // --- ALL CHART CREATION/UPDATE FUNCTIONS (createOrUpdatePrioritiesChart, etc.) remain unchanged ---
    // (These are lengthy and not directly related to the sidebar behavior change)
    function createOrUpdatePrioritiesChart(stats: typeof dashboardStats, displayType: GlobalChartType) {
        if (!prioritiesChartCanvas || !stats) return;
        if (prioritiesChart && lastPrioritiesChartRenderedType !== displayType) {
            prioritiesChart.destroy();
            prioritiesChart = undefined;
            lastPrioritiesChartRenderedType = undefined;
        }
        const labelsBase: string[] = [];
        const dataPointsBase: number[] = [];
        const priorityColorMap = { high: chartColorPalette.red, standard: chartColorPalette.blue, low: chartColorPalette.green, unprioritized: chartColorPalette.purple };
        let totalPriorityTasks = 0;
        const sortedPriorities = ['high', 'standard', 'low', 'unprioritized'];
        for (const priority of sortedPriorities) { const count = stats.priorityCounts[priority] || 0; labelsBase.push(priority.charAt(0).toUpperCase() + priority.slice(1)); dataPointsBase.push(count); totalPriorityTasks += count; }
        let chartConfig: ChartConfiguration<GlobalChartType>;
        if (displayType === 'doughnut') {
            const bgColors: string[] = [], borderColors: string[] = []; let finalLabels = [...labelsBase], finalData = [...dataPointsBase];
            if (totalPriorityTasks > 0) {
                const activeL: string[] = [], activeD: number[] = [];
                sortedPriorities.forEach((p, i) => { if (dataPointsBase[i] > 0) { activeL.push(labelsBase[i]); activeD.push(dataPointsBase[i]); const cKey = p as keyof typeof priorityColorMap, clr = priorityColorMap[cKey] || chartColorPalette.orange; bgColors.push(isDarkMode ? clr.dark : clr.light); borderColors.push(isDarkMode ? clr.dark : clr.border); } });
                finalLabels = activeL; finalData = activeD;
            } else { finalLabels = ["No Tasks with Priority"]; finalData = [1]; bgColors.push(isDarkMode ? chartColorPalette.gray.dark : chartColorPalette.gray.light); borderColors.push(isDarkMode ? chartColorPalette.gray.dark : chartColorPalette.gray.border); }
            chartConfig = { type: 'doughnut', data: { labels: finalLabels, datasets: [{ label: 'Task Priorities', data: finalData, backgroundColor: bgColors, borderColor: borderColors, borderWidth: 1.5, hoverOffset: 8 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { color: isDarkMode ? '#d1d5db' : '#374151', boxWidth:12, padding:15 } }, tooltip: { bodyColor: isDarkMode ? '#d1d5db' : '#374151', titleColor: isDarkMode ? '#d1d5db' : '#374151', backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 0.9)' : 'rgba(255, 255, 255, 0.9)', borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.9)' : 'rgba(229, 231, 235, 0.9)', borderWidth: 1 } } } } as ChartConfiguration<'doughnut'>;
        } else { /* bar */
            const maxVal = Math.max(0, ...dataPointsBase), step = Math.max(1, Math.ceil(maxVal / 5));
            chartConfig = { type: 'bar', data: { labels: labelsBase, datasets: [{ label: 'Priority Counts', data: dataPointsBase, backgroundColor: labelsBase.map((_, i) => { const pKey = sortedPriorities[i] as keyof typeof priorityColorMap, clr = priorityColorMap[pKey] || chartColorPalette.orange; return isDarkMode ? clr.dark : clr.light; }), borderColor: labelsBase.map((_, i) => { const pKey = sortedPriorities[i] as keyof typeof priorityColorMap, clr = priorityColorMap[pKey] || chartColorPalette.orange; return isDarkMode ? clr.dark : clr.border; }), borderWidth: 1 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { color: isDarkMode ? '#d1d5db' : '#374151', stepSize: step }, grid: { color: isDarkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.5)' } }, x: { ticks: { color: isDarkMode ? '#d1d5db' : '#374151' }, grid: { display: false } } }, plugins: { legend: { display: false }, tooltip: { bodyColor: isDarkMode ? '#d1d5db' : '#374151', titleColor: isDarkMode ? '#d1d5db' : '#374151', backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 0.9)' : 'rgba(255, 255, 255, 0.9)', borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.9)' : 'rgba(229, 231, 235, 0.9)', borderWidth: 1 } } } } as ChartConfiguration<'bar'>;
        }
        if (prioritiesChart) { prioritiesChart.data = chartConfig.data as any; prioritiesChart.options = chartConfig.options as any; prioritiesChart.update(); }
        else { prioritiesChart = new Chart(prioritiesChartCanvas as ChartItem, chartConfig); lastPrioritiesChartRenderedType = displayType; }
    }

    function createOrUpdateTimelinessChart(stats: typeof dashboardStats, displayType: GlobalChartType) {
        if (!timelinessChartCanvas || !stats) return;
        if (timelinessChart && lastTimelinessChartRenderedType !== displayType) { timelinessChart.destroy(); timelinessChart = undefined; lastTimelinessChartRenderedType = undefined; }
        const totalCompleted = stats.tasksDoneOnTime + stats.tasksDoneLate; let labels = ['On Time', 'Late'], dataPoints = [stats.tasksDoneOnTime, stats.tasksDoneLate]; let chartConfig: ChartConfiguration<GlobalChartType>;
        if (displayType === 'doughnut') {
            let bgColors = [ isDarkMode ? chartColorPalette.green.dark : chartColorPalette.green.light, isDarkMode ? chartColorPalette.orange.dark : chartColorPalette.orange.light ];
            let borderColors = [ isDarkMode ? chartColorPalette.green.dark : chartColorPalette.green.border, isDarkMode ? chartColorPalette.orange.dark : chartColorPalette.orange.border ];
            if (totalCompleted === 0) { labels = ["No Completed Tasks"]; dataPoints = [1]; bgColors = [isDarkMode ? chartColorPalette.gray.dark : chartColorPalette.gray.light]; borderColors = [isDarkMode ? chartColorPalette.gray.dark : chartColorPalette.gray.border]; }
            chartConfig = { type: 'doughnut', data: { labels, datasets: [{ label: 'Completion Timeliness', data: dataPoints, backgroundColor: bgColors, borderColor: borderColors, borderWidth: 1.5, hoverOffset: 8 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { color: isDarkMode ? '#d1d5db' : '#374151', boxWidth:12, padding:15 } }, tooltip: { bodyColor: isDarkMode ? '#d1d5db' : '#374151', titleColor: isDarkMode ? '#d1d5db' : '#374151', backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 0.9)' : 'rgba(255, 255, 255, 0.9)', borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.9)' : 'rgba(229, 231, 235, 0.9)', borderWidth: 1 } } } } as ChartConfiguration<'doughnut'>;
        } else { /* bar */
            const step = Math.max(1, Math.ceil(Math.max(0, ...dataPoints) / 2));
            let bgColors = [ isDarkMode ? chartColorPalette.green.dark : chartColorPalette.green.light, isDarkMode ? chartColorPalette.orange.dark : chartColorPalette.orange.light ];
            let borderColors = [ isDarkMode ? chartColorPalette.green.dark : chartColorPalette.green.border, isDarkMode ? chartColorPalette.orange.dark : chartColorPalette.orange.border ];
            if (totalCompleted === 0) { labels = ["No Data"]; dataPoints = [0]; bgColors = [isDarkMode ? chartColorPalette.gray.dark : chartColorPalette.gray.light]; borderColors = [isDarkMode ? chartColorPalette.gray.dark : chartColorPalette.gray.border]; }
            chartConfig = { type: 'bar', data: { labels, datasets: [{ label: 'Timeliness', data: dataPoints, backgroundColor: bgColors, borderColor: borderColors, borderWidth: 1 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { color: isDarkMode ? '#d1d5db' : '#374151', stepSize: step }, grid: { color: isDarkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.5)' } }, x: { ticks: { color: isDarkMode ? '#d1d5db' : '#374151' }, grid: { display: false } } }, plugins: { legend: { display: false }, tooltip: { bodyColor: isDarkMode ? '#d1d5db' : '#374151', titleColor: isDarkMode ? '#d1d5db' : '#374151', backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 0.9)' : 'rgba(255, 255, 255, 0.9)', borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.9)' : 'rgba(229, 231, 235, 0.9)', borderWidth: 1 } } } } as ChartConfiguration<'bar'>;
        }
        if (timelinessChart) { timelinessChart.data = chartConfig.data as any; timelinessChart.options = chartConfig.options as any; timelinessChart.update(); }
        else { timelinessChart = new Chart(timelinessChartCanvas as ChartItem, chartConfig); lastTimelinessChartRenderedType = displayType; }
    }

    function createOrUpdateTasksCompletedChart(stats: typeof dashboardStats, displayType: GlobalChartType) {
        if (!tasksCompletedChartCanvas || !stats) return;
        if (tasksCompletedChart && lastTasksCompletedChartRenderedType !== displayType) { tasksCompletedChart.destroy(); tasksCompletedChart = undefined; lastTasksCompletedChartRenderedType = undefined; }
        const labels = ['This Month', 'This Week', 'All Time'], dataPoints = [stats.tasksDoneThisMonth, stats.tasksDoneThisWeek, stats.tasksDoneAllTime]; const totalTasks = dataPoints.reduce((s, v) => s + v, 0); let chartConfig: ChartConfiguration<GlobalChartType>;
        const defaultBgColors = [isDarkMode?chartColorPalette.blue.dark:chartColorPalette.blue.light, isDarkMode?chartColorPalette.green.dark:chartColorPalette.green.light, isDarkMode?chartColorPalette.purple.dark:chartColorPalette.purple.light];
        const defaultBorderColors = [isDarkMode?chartColorPalette.blue.dark:chartColorPalette.blue.border, isDarkMode?chartColorPalette.green.dark:chartColorPalette.green.border, isDarkMode?chartColorPalette.purple.dark:chartColorPalette.purple.border];
        if (displayType === 'doughnut') {
            let bgColors = [...defaultBgColors], borderColors = [...defaultBorderColors], finalLbls = [...labels], finalData = [...dataPoints];
            if(totalTasks === 0) { finalLbls = ["No Tasks Completed"]; finalData = [1]; bgColors = [isDarkMode ? chartColorPalette.gray.dark : chartColorPalette.gray.light]; borderColors = [isDarkMode ? chartColorPalette.gray.dark : chartColorPalette.gray.border];}
            chartConfig = { type: 'doughnut', data: { labels: finalLbls, datasets: [{ label: 'Tasks Completed', data: finalData, backgroundColor: bgColors, borderColor: borderColors, borderWidth: 1.5, hoverOffset: 8 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { color: isDarkMode ? '#d1d5db' : '#374151', boxWidth: 12, padding: 15 } }, tooltip: { bodyColor: isDarkMode ? '#d1d5db' : '#374151', titleColor: isDarkMode ? '#d1d5db' : '#374151', backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 0.9)' : 'rgba(255, 255, 255, 0.9)', borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.9)' : 'rgba(229, 231, 235, 0.9)', borderWidth: 1 } } } } as ChartConfiguration<'doughnut'>;
        } else { /* bar */
            const maxVal = Math.max(0, ...dataPoints), step = Math.max(1, Math.ceil(maxVal / 5));
            chartConfig = { type: 'bar', data: { labels, datasets: [{ label: 'Tasks Completed', data: dataPoints, backgroundColor: defaultBgColors, borderColor: defaultBorderColors, borderWidth: 1 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { color: isDarkMode ? '#d1d5db' : '#374151', stepSize: step }, grid: { color: isDarkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.5)' } }, x: { ticks: { color: isDarkMode ? '#d1d5db' : '#374151' }, grid: { display: false } } }, plugins: { legend: { display: false }, tooltip: { bodyColor: isDarkMode ? '#d1d5db' : '#374151', titleColor: isDarkMode ? '#d1d5db' : '#374151', backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 0.9)' : 'rgba(255, 255, 255, 0.9)', borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.9)' : 'rgba(229, 231, 235, 0.9)', borderWidth: 1 } } } } as ChartConfiguration<'bar'>;
        }
        if (tasksCompletedChart) { tasksCompletedChart.data = chartConfig.data as any; tasksCompletedChart.options = chartConfig.options as any; tasksCompletedChart.update(); }
        else { tasksCompletedChart = new Chart(tasksCompletedChartCanvas as ChartItem, chartConfig); lastTasksCompletedChartRenderedType = displayType; }
    }

    function clickOutside(node: HTMLElement, callback: () => void) {
		const handleClick = (event: MouseEvent) => { if (node && !node.contains(event.target as Node) && !event.defaultPrevented) callback(); };
		document.addEventListener('click', handleClick, true);
		return { destroy() { document.removeEventListener('click', handleClick, true); } };
	}

    function handleLogout() {
		if (browser) {
			localStorage.removeItem('microtask_username');
			document.cookie = "userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax;";
			goto('/login');
		}
  	}
</script>

<svelte:head>
	<title>Dashboard - Microtask</title>
</svelte:head>

<!-- Apply dark mode class to document.body via JS, main div here reflects for Svelte-specific styles -->
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
		<header class={`top-header ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>
			<div class="header-left">
				<button id="hamburgerButton" class="menu-btn" on:click={toggleSidebar} aria-label="Toggle Sidebar">
					<!-- Simplified Hamburger Icon - always shows "bars" -->
            		<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
				</button>
                <a href="/home" class="logo flex items-center gap-2 no-underline">
                    <img src="/logonamin.png" alt="Microtask Logo" class="h-8 w-auto">
                    <span class={`font-semibold text-xl ${isDarkMode ? 'text-zinc-100' : 'text-gray-800'}`}>Microtask</span>
                </a>
			</div>
			<div class="header-icons">
        <div class="relative">
          <button id="bellIcon" aria-label="Notifications" class="relative">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5" aria-hidden="true"><path fill-rule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0c-1.673-.253-3.287-.673-4.831-1.243a.75.75 0 01-.297-1.206C4.45 13.807 5.25 11.873 5.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0H9.752z" clip-rule="evenodd" /></svg>
          </button>
          <div id="notifWindow" class={`dropdown-window hidden w-80 max-h-96 overflow-y-auto custom-scrollbar ${isDarkMode ? 'bg-zinc-700 border-zinc-600 text-zinc-300' : 'bg-white border-gray-200 text-gray-700'}`}>
            <h3 class="font-semibold mb-2 text-sm">Notifications</h3> <p class="text-xs text-center py-4">No new notifications.</p>
          </div>
        </div>
        <div class="relative">
          <button id="helpIcon" aria-label="Help & FAQ">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5" aria-hidden="true"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.042.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" /></svg>
          </button>
          <div id="helpWindow" class={`dropdown-window hidden ${isDarkMode ? 'bg-zinc-700 border-zinc-600 text-zinc-300' : 'bg-white border-gray-200 text-gray-700'}`}>
            <h3 class="font-semibold mb-2 text-sm">FAQ</h3><ul class="list-disc list-inside space-y-1 text-xs"><li>How do I add a task?</li><li>Where is the calendar?</li></ul><a href="/support" class="text-xs text-blue-600 hover:underline mt-2 block">Visit Support</a>
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
            {#if isDarkMode} <path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 0 0-.103.103l1.132 1.132a.75.75 0 0 0 1.06 0l1.132-1.132a.75.75 0 0 0-.103-1.06l-1.132-1.132a.75.75 0 0 0-1.06 0L9.63 1.615a.75.75 0 0 0-.102.103ZM12 3.75a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75ZM18.282 5.282a.75.75 0 0 0-1.06 0l-1.132 1.132a.75.75 0 0 0 .103 1.06l1.132 1.132a.75.75 0 0 0 1.06 0l1.132-1.132a.75.75 0 0 0-.103-1.06l-1.132-1.132a.75.75 0 000-.103ZM19.5 12a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5a.75.75 0 01.75.75ZM18.282 18.718a.75.75 0 000 1.06l1.132 1.132a.75.75 0 001.06 0l1.132-1.132a.75.75 0 00-.103-1.06l-1.132-1.132a.75.75 0 00-1.06 0l-1.132 1.132a.75.75 0 00.103.103ZM12 18.75a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5a.75.75 0 01.75.75ZM5.718 18.718a.75.75 0 001.06 0l1.132-1.132a.75.75 0 00-.103-1.06l-1.132-1.132a.75.75 0 00-1.06 0L4.586 17.686a.75.75 0 00.103 1.06l1.132 1.132a.75.75 0 000-.103ZM4.5 12a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75ZM5.718 5.282a.75.75 0 000-1.06l-1.132-1.132a.75.75 0 00-1.06 0L2.39 4.114a.75.75 0 00.103 1.06l1.132 1.132a.75.75 0 001.06 0l1.132-1.132a.75.75 0 00-.103-.103ZM12 6.75a5.25 5.25 0 015.25 5.25 5.25 5.25 0 01-5.25 5.25 5.25 5.25 0 01-5.25-5.25 5.25 5.25 0 015.25-5.25Z" clip-rule="evenodd" />
            {:else} <path fill-rule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM12 16.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 010 9Z" clip-rule="evenodd" /> {/if}
          </svg>
        </button>
      </div>
    </header>

		<main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-zinc-900 p-4 md:p-6 relative">
            <h1 class={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-zinc-100' : 'text-gray-800'}`}>Dashboard</h1>

			{#if pageError}
				<div class="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded relative mb-4" role="alert">
					<strong class="font-bold">Error:</strong> <span class="block sm:inline">{pageError}</span>
				</div>
			{/if}

			{#if dashboardStats}
				<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 pb-16">
					<div class="bg-white dark:bg-zinc-800 p-4 md:p-6 rounded-xl shadow-lg flex flex-col">
						<h2 class="text-lg font-semibold mb-4 text-blue-600 dark:text-blue-400 flex-shrink-0">Tasks Completed</h2>
						<div class="h-60 md:h-72 w-full relative flex-grow">
                            <canvas bind:this={tasksCompletedChartCanvas}></canvas>
                        </div>
                        <div class="mt-4 text-sm space-y-1 text-gray-600 dark:text-zinc-400 flex-shrink-0">
                            <p><strong>This Month:</strong> {dashboardStats.tasksDoneThisMonth}</p>
							<p><strong>This Week:</strong> {dashboardStats.tasksDoneThisWeek}</p>
							<p><strong>All Time:</strong> {dashboardStats.tasksDoneAllTime}</p>
                        </div>
					</div>

					<div class="bg-white dark:bg-zinc-800 p-4 md:p-6 rounded-xl shadow-lg flex flex-col">
						<h2 class="text-lg font-semibold mb-4 text-green-600 dark:text-green-400 flex-shrink-0">Completion Timeliness</h2>
						<div class="h-60 md:h-72 w-full relative flex-grow">
                            <canvas bind:this={timelinessChartCanvas}></canvas>
                        </div>
                        <div class="mt-4 text-sm space-y-1 text-gray-600 dark:text-zinc-400 flex-shrink-0">
                            <p><strong>Done On Time:</strong> {dashboardStats.tasksDoneOnTime}</p>
							<p><strong>Done Late:</strong> {dashboardStats.tasksDoneLate}</p>
                        </div>
					</div>

					<div class="bg-white dark:bg-zinc-800 p-4 md:p-6 rounded-xl shadow-lg flex flex-col">
                        <h2 class="text-lg font-semibold mb-4 text-purple-600 dark:text-purple-400 flex-shrink-0">Task Priorities</h2>
						<div class="h-60 md:h-72 w-full relative flex-grow">
                            <canvas bind:this={prioritiesChartCanvas}></canvas>
                        </div>
                        <div class="mt-4 text-sm space-y-1 text-gray-600 dark:text-zinc-400 flex-shrink-0">
							{#each Object.entries(dashboardStats.priorityCounts) as [priority, count]}
								{#if priority !== 'unprioritized' || (priority === 'unprioritized' && count > 0)}
									<p><strong class="capitalize">{priority}:</strong> {count}</p>
								{/if}
							{/each}
                        </div>
					</div>
				</div>

                <div class="fixed bottom-4 left-1/2 -translate-x-1/2 z-10
                            flex space-x-2 p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border dark:border-zinc-700 border-gray-200">
                    <button
                        on:click={() => globalChartDisplayType.set('doughnut')}
                        class:bg-blue-600={$globalChartDisplayType === 'doughnut'}
                        class:dark:bg-blue-700={$globalChartDisplayType === 'doughnut'}
                        class:text-white={$globalChartDisplayType === 'doughnut'}
                        class:bg-gray-200={$globalChartDisplayType !== 'doughnut'}
                        class:hover:bg-gray-300={$globalChartDisplayType !== 'doughnut'}
                        class:dark:bg-zinc-700={$globalChartDisplayType !== 'doughnut'}
                        class:dark:hover:bg-zinc-600={$globalChartDisplayType !== 'doughnut'}
                        class:text-gray-700={$globalChartDisplayType !== 'doughnut'}
                        class:dark:text-zinc-300={$globalChartDisplayType !== 'doughnut'}
                        class="px-3 py-1.5 text-sm rounded-md transition-colors font-medium"
                    >Pie / Doughnut</button>
                    <button
                        on:click={() => globalChartDisplayType.set('bar')}
                        class:bg-blue-600={$globalChartDisplayType === 'bar'}
                        class:dark:bg-blue-700={$globalChartDisplayType === 'bar'}
                        class:text-white={$globalChartDisplayType === 'bar'}
                        class:bg-gray-200={$globalChartDisplayType !== 'bar'}
                        class:hover:bg-gray-300={$globalChartDisplayType !== 'bar'}
                        class:dark:bg-zinc-700={$globalChartDisplayType !== 'bar'}
                        class:dark:hover:bg-zinc-600={$globalChartDisplayType !== 'bar'}
                        class:text-gray-700={$globalChartDisplayType !== 'bar'}
                        class:dark:text-zinc-300={$globalChartDisplayType !== 'bar'}
                        class="px-3 py-1.5 text-sm rounded-md transition-colors font-medium"
                    >Bar Chart</button>
                </div>

			{:else if !pageError}
                <div class="flex justify-center items-center h-full">
                    <p class="text-gray-500 dark:text-zinc-400 text-lg">Loading dashboard data or no data available...</p>
                </div>
			{/if}
		</main>

		<footer class="text-center p-4 text-sm text-gray-500 dark:text-zinc-400 border-t dark:border-zinc-700 border-gray-200 flex-shrink-0">
			Microtask © {new Date().getFullYear()}
		</footer>
	</div>
</div>

<style>
	/* Sidebar active link SVG styling */
    :global(a.bg-blue-600 svg), :global(a.bg-blue-700 svg),
    :global(a.dark\:bg-blue-700 svg), :global(a.dark\:bg-blue-800 svg) {
        fill: white !important;
        stroke: white !important;
    }
    :global(a.bg-blue-600 img), :global(a.bg-blue-700 img),
    :global(a.dark\:bg-blue-700 img), :global(a.dark\:bg-blue-800 img) {
        filter: brightness(0) invert(1);
    }

    canvas { display: block; }
    .h-60 { height: 15rem; }
    .h-72 { height: 18rem; }
    .w-full { width: 100%; }
    .relative { position: relative; }
    .flex-grow { flex-grow: 1; }

    .top-header {
        position: fixed; top: 0; left: 0; right: 0;
        width: 100%;
        display: flex; align-items: center; justify-content: space-between;
        padding: 0 1rem; height: 60px; z-index: 40;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        transition: background-color 0.2s, border-color 0.2s;
    }
    main { padding-top: calc(60px + 1rem); }
    @media (min-width: 768px) {
      main { padding-top: calc(60px + 1.5rem); }
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
    .top-header .header-icons #profileIcon { width: auto; padding-right: 0.5rem; }

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
    .dropdown-window.hidden { display: none !important; }

    /* Global dark mode styles that affect body directly or are fallbacks */
    :global(body.dark) {
        background-color: #18181b; /* bg-zinc-900 */
        color: #d1d5db; /* text-zinc-300 */
    }
    :global(body.dark .bg-gray-100) { background-color: #18181b !important; } /* Override for main flex container */
    :global(body.dark .text-gray-800) { color: #d1d5db !important; } /* Override for main flex container */


    :global(body.dark .top-header) { background-color: #1f2937; border-bottom-color: #374151; }
    :global(body.dark .dropdown-window) { background-color: #374151; border-color: #4b5563; color: #f3f4f6; }
    
    :global(body.dark input), :global(body.dark textarea), :global(body.dark select) {
        background-color: #374151 !important;
        color: #f3f4f6 !important;
        border-color: #4b5563 !important;
    }
    :global(body.dark input::placeholder), :global(body.dark textarea::placeholder) { color: #6b7280; }
    :global(body.dark .calendar-picker-dark::-webkit-calendar-picker-indicator) { filter: invert(0.8); }

    /* General Tailwind utilities for dark mode theme consistency (if body.dark isn't enough) */
    /* These are mostly covered by inline Svelte class bindings now with `isDarkMode` */
    :global(body.dark .bg-zinc-900) { background-color: #18181b; }
    :global(body.dark .bg-zinc-800) { background-color: #1f2937; }
    :global(body.dark .bg-zinc-700) { background-color: #374151; }
    :global(body.dark .border-zinc-700) { border-color: #374151; }
    :global(body.dark .border-zinc-600) { border-color: #4b5563; }
    :global(body.dark .text-zinc-100) { color: #f3f4f6; }
    :global(body.dark .text-zinc-300) { color: #d1d5db; }
    :global(body.dark .text-zinc-400) { color: #9ca3af; }
    :global(body.dark .hover\:bg-zinc-700:hover) { background-color: #4b5563; }
    :global(body.dark .hover\:bg-zinc-600:hover) { background-color: #6b7280; }
    :global(body.dark .bg-blue-700) { background-color: #1d4ed8; }
    :global(body.dark .text-blue-400) { color: #60a5fa; }
</style>