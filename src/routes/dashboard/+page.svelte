<!-- src/routes/dashboard/+page.svelte -->
<script lang="ts">
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { onMount, onDestroy } from 'svelte';
    import { browser } from '$app/environment';
	import { Chart, registerables, type ChartConfiguration, type ChartItem, type Point, type BubbleDataPoint } from 'chart.js';
    import { globalChartDisplayType, type GlobalChartType } from '$lib/stores/chartTypeStore';

	export let data: import('./$types').PageData;

	let username: string | undefined = data.user?.name || 'User';
	let isSidebarOpen = false;
	let isDarkMode = false;
	let showProfileDropdown = false;

	$: dashboardStats = data.dashboardStats;
	$: pageError = data.error;

	let prioritiesChartCanvas: HTMLCanvasElement | undefined;
	let prioritiesChart: Chart<GlobalChartType> | undefined;
    let lastPrioritiesChartRenderedType: GlobalChartType | undefined = undefined;

	let timelinessChartCanvas: HTMLCanvasElement | undefined;
	let timelinessChart: Chart<GlobalChartType> | undefined;
    let lastTimelinessChartRenderedType: GlobalChartType | undefined = undefined;

	let tasksCompletedChartCanvas: HTMLCanvasElement | undefined;
	let tasksCompletedChart: Chart<GlobalChartType> | undefined; // MODIFIED
    let lastTasksCompletedChartRenderedType: GlobalChartType | undefined = undefined; // ADDED

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

	onMount(() => {
		Chart.register(...registerables);
        const storedDarkMode = localStorage.getItem('theme');
		if (storedDarkMode === 'dark' || (!storedDarkMode && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
			isDarkMode = true;
			document.documentElement.classList.add('dark');
		} else {
            isDarkMode = false;
            document.documentElement.classList.remove('dark');
        }
		const storedSidebar = localStorage.getItem('sidebarOpen');
        if (storedSidebar === 'true') isSidebarOpen = true;

        unsubscribeGlobalChartType = globalChartDisplayType.subscribe(_value => {
            if (browser && dashboardStats && prioritiesChartCanvas && timelinessChartCanvas && tasksCompletedChartCanvas) {
                initOrUpdateAllCharts();
            }
        });

		return () => {
			prioritiesChart?.destroy();
			timelinessChart?.destroy();
			tasksCompletedChart?.destroy();
            if (unsubscribeGlobalChartType) unsubscribeGlobalChartType();
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
        typeof isDarkMode === 'boolean'
	) {
		initOrUpdateAllCharts();
	}

    function initOrUpdateAllCharts() {
        if (browser && dashboardStats && prioritiesChartCanvas && timelinessChartCanvas && tasksCompletedChartCanvas) {
            updateChartGlobalDefaults();
            createOrUpdatePrioritiesChart(dashboardStats, $globalChartDisplayType);
            createOrUpdateTimelinessChart(dashboardStats, $globalChartDisplayType);
            createOrUpdateTasksCompletedChart(dashboardStats, $globalChartDisplayType); // MODIFIED: pass displayType
        }
    }

    function createOrUpdatePrioritiesChart(stats: typeof dashboardStats, displayType: GlobalChartType) {
        if (!prioritiesChartCanvas || !stats) return;
        if (prioritiesChart && lastPrioritiesChartRenderedType !== displayType) {
            prioritiesChart.destroy();
            prioritiesChart = undefined;
            lastPrioritiesChartRenderedType = undefined;
        }
        // ... (rest of the function as in the previous correct answer)
        const labelsBase: string[] = [];
        const dataPointsBase: number[] = [];
        const priorityColorMap = {
            high: chartColorPalette.red, standard: chartColorPalette.blue,
            low: chartColorPalette.green, unprioritized: chartColorPalette.purple
        };
        let totalPriorityTasks = 0;
        const sortedPriorities = ['high', 'standard', 'low', 'unprioritized'];

        for (const priority of sortedPriorities) {
            const count = stats.priorityCounts[priority] || 0;
            labelsBase.push(priority.charAt(0).toUpperCase() + priority.slice(1));
            dataPointsBase.push(count);
            totalPriorityTasks += count;
        }

        let chartConfig: ChartConfiguration<GlobalChartType>;

        if (displayType === 'doughnut') {
            const backgroundColorsDoughnut: string[] = [];
            const borderColorsDoughnut: string[] = [];
            let finalLabelsDoughnut = [...labelsBase];
            let finalDataPointsDoughnut = [...dataPointsBase];

            if (totalPriorityTasks > 0) {
                const activeLabels: string[] = [];
                const activeData: number[] = [];
                sortedPriorities.forEach((priority, index) => {
                    if (dataPointsBase[index] > 0) {
                        activeLabels.push(labelsBase[index]);
                        activeData.push(dataPointsBase[index]);
                        const colorKey = priority as keyof typeof priorityColorMap;
                        const color = priorityColorMap[colorKey] || chartColorPalette.orange;
                        backgroundColorsDoughnut.push(isDarkMode ? color.dark : color.light);
                        borderColorsDoughnut.push(isDarkMode ? color.dark : color.border);
                    }
                });
                finalLabelsDoughnut = activeLabels;
                finalDataPointsDoughnut = activeData;
            } else {
                finalLabelsDoughnut = ["No Tasks with Priority"];
                finalDataPointsDoughnut = [1];
                backgroundColorsDoughnut.push(isDarkMode ? chartColorPalette.gray.dark : chartColorPalette.gray.light);
                borderColorsDoughnut.push(isDarkMode ? chartColorPalette.gray.dark : chartColorPalette.gray.border);
            }
            chartConfig = {
                type: 'doughnut',
                data: { labels: finalLabelsDoughnut, datasets: [{ label: 'Task Priorities', data: finalDataPointsDoughnut, backgroundColor: backgroundColorsDoughnut, borderColor: borderColorsDoughnut, borderWidth: 1.5, hoverOffset: 8 }] },
                options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { color: isDarkMode ? '#d1d5db' : '#374151', boxWidth:12, padding:15 } }, tooltip: { bodyColor: isDarkMode ? '#d1d5db' : '#374151', titleColor: isDarkMode ? '#d1d5db' : '#374151', backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 0.9)' : 'rgba(255, 255, 255, 0.9)', borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.9)' : 'rgba(229, 231, 235, 0.9)', borderWidth: 1 } } }
            } as ChartConfiguration<'doughnut'>;
        } else { // 'bar'
            const maxDataValueBar = Math.max(0, ...dataPointsBase);
            const stepSizeBar = Math.max(1, Math.ceil(maxDataValueBar / 5));
            chartConfig = {
                type: 'bar',
                data: {
                    labels: labelsBase,
                    datasets: [{
                        label: 'Priority Counts', data: dataPointsBase,
                        backgroundColor: labelsBase.map((_label, i) => {
                            const priorityKey = sortedPriorities[i] as keyof typeof priorityColorMap;
                            const color = priorityColorMap[priorityKey] || chartColorPalette.orange;
                            return isDarkMode ? color.dark : color.light;
                        }),
                        borderColor: labelsBase.map((_label, i) => {
                            const priorityKey = sortedPriorities[i] as keyof typeof priorityColorMap;
                            const color = priorityColorMap[priorityKey] || chartColorPalette.orange;
                            return isDarkMode ? color.dark : color.border;
                        }),
                        borderWidth: 1
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { color: isDarkMode ? '#d1d5db' : '#374151', stepSize: stepSizeBar }, grid: { color: isDarkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.5)' } }, x: { ticks: { color: isDarkMode ? '#d1d5db' : '#374151' }, grid: { display: false } } }, plugins: { legend: { display: false }, tooltip: { bodyColor: isDarkMode ? '#d1d5db' : '#374151', titleColor: isDarkMode ? '#d1d5db' : '#374151', backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 0.9)' : 'rgba(255, 255, 255, 0.9)', borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.9)' : 'rgba(229, 231, 235, 0.9)', borderWidth: 1 } } }
            } as ChartConfiguration<'bar'>;
        }

        if (prioritiesChart) {
            prioritiesChart.data = chartConfig.data as any;
            prioritiesChart.options = chartConfig.options as any;
            prioritiesChart.update();
        } else {
            prioritiesChart = new Chart(prioritiesChartCanvas, chartConfig);
            lastPrioritiesChartRenderedType = displayType;
        }
    }

    function createOrUpdateTimelinessChart(stats: typeof dashboardStats, displayType: GlobalChartType) {
        if (!timelinessChartCanvas || !stats) return;
        if (timelinessChart && lastTimelinessChartRenderedType !== displayType) {
            timelinessChart.destroy();
            timelinessChart = undefined;
            lastTimelinessChartRenderedType = undefined;
        }
        // ... (rest of the function as in the previous correct answer)
        const totalCompleted = stats.tasksDoneOnTime + stats.tasksDoneLate;
        let labelsBase = ['On Time', 'Late'];
        let dataPointsBase = [stats.tasksDoneOnTime, stats.tasksDoneLate];
        let chartConfig: ChartConfiguration<GlobalChartType>;

        if (displayType === 'doughnut') {
            let backgroundColors = [ isDarkMode ? chartColorPalette.green.dark : chartColorPalette.green.light, isDarkMode ? chartColorPalette.orange.dark : chartColorPalette.orange.light ];
            let borderColors = [ isDarkMode ? chartColorPalette.green.dark : chartColorPalette.green.border, isDarkMode ? chartColorPalette.orange.dark : chartColorPalette.orange.border ];
            if (totalCompleted === 0) {
                labelsBase = ["No Completed Tasks"]; dataPointsBase = [1];
                backgroundColors = [isDarkMode ? chartColorPalette.gray.dark : chartColorPalette.gray.light];
                borderColors = [isDarkMode ? chartColorPalette.gray.dark : chartColorPalette.gray.border];
            }
            chartConfig = {
                type: 'doughnut',
                data: { labels: labelsBase, datasets: [{ label: 'Completion Timeliness', data: dataPointsBase, backgroundColor: backgroundColors, borderColor: borderColors, borderWidth: 1.5, hoverOffset: 8 }] },
                options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { color: isDarkMode ? '#d1d5db' : '#374151', boxWidth:12, padding:15 } }, tooltip: { bodyColor: isDarkMode ? '#d1d5db' : '#374151', titleColor: isDarkMode ? '#d1d5db' : '#374151', backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 0.9)' : 'rgba(255, 255, 255, 0.9)', borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.9)' : 'rgba(229, 231, 235, 0.9)', borderWidth: 1 } } }
            } as ChartConfiguration<'doughnut'>;
        } else { // 'bar'
            const stepSizeBar = Math.max(1, Math.ceil(Math.max(0, ...dataPointsBase) / 2));
            let backgroundColors = [ isDarkMode ? chartColorPalette.green.dark : chartColorPalette.green.light, isDarkMode ? chartColorPalette.orange.dark : chartColorPalette.orange.light ];
            let borderColors = [ isDarkMode ? chartColorPalette.green.dark : chartColorPalette.green.border, isDarkMode ? chartColorPalette.orange.dark : chartColorPalette.orange.border ];
             if (totalCompleted === 0) {
                labelsBase = ["No Data"]; dataPointsBase = [0];
                backgroundColors = [isDarkMode ? chartColorPalette.gray.dark : chartColorPalette.gray.light];
                borderColors = [isDarkMode ? chartColorPalette.gray.dark : chartColorPalette.gray.border];
            }
            chartConfig = {
                type: 'bar',
                data: { labels: labelsBase, datasets: [{ label: 'Timeliness', data: dataPointsBase, backgroundColor: backgroundColors, borderColor: borderColors, borderWidth: 1 }] },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { color: isDarkMode ? '#d1d5db' : '#374151', stepSize: stepSizeBar }, grid: { color: isDarkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.5)' } }, x: { ticks: { color: isDarkMode ? '#d1d5db' : '#374151' }, grid: { display: false } } }, plugins: { legend: { display: false }, tooltip: { bodyColor: isDarkMode ? '#d1d5db' : '#374151', titleColor: isDarkMode ? '#d1d5db' : '#374151', backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 0.9)' : 'rgba(255, 255, 255, 0.9)', borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.9)' : 'rgba(229, 231, 235, 0.9)', borderWidth: 1 } } }
            } as ChartConfiguration<'bar'>;
        }
        if (timelinessChart) {
            timelinessChart.data = chartConfig.data as any;
            timelinessChart.options = chartConfig.options as any;
            timelinessChart.update();
        } else {
            timelinessChart = new Chart(timelinessChartCanvas, chartConfig);
            lastTimelinessChartRenderedType = displayType;
        }
    }

    // MODIFIED: createOrUpdateTasksCompletedChart
    function createOrUpdateTasksCompletedChart(stats: typeof dashboardStats, displayType: GlobalChartType) {
        if (!tasksCompletedChartCanvas || !stats) return;

        if (tasksCompletedChart && lastTasksCompletedChartRenderedType !== displayType) {
            tasksCompletedChart.destroy();
            tasksCompletedChart = undefined;
            lastTasksCompletedChartRenderedType = undefined;
        }

        const labels = ['This Month', 'This Week', 'All Time'];
        const dataPoints = [stats.tasksDoneThisMonth, stats.tasksDoneThisWeek, stats.tasksDoneAllTime];
        const totalTasks = dataPoints.reduce((sum, val) => sum + val, 0);

        let chartConfig: ChartConfiguration<GlobalChartType>;

        if (displayType === 'doughnut') {
            let backgroundColors = [
                isDarkMode ? chartColorPalette.blue.dark : chartColorPalette.blue.light,
                isDarkMode ? chartColorPalette.green.dark : chartColorPalette.green.light,
                isDarkMode ? chartColorPalette.purple.dark : chartColorPalette.purple.light,
            ];
            let borderColors = [
                isDarkMode ? chartColorPalette.blue.dark : chartColorPalette.blue.border,
                isDarkMode ? chartColorPalette.green.dark : chartColorPalette.green.border,
                isDarkMode ? chartColorPalette.purple.dark : chartColorPalette.purple.border,
            ];
            let finalLabels = [...labels];
            let finalDataPoints = [...dataPoints];

            if(totalTasks === 0) {
                finalLabels = ["No Tasks Completed"];
                finalDataPoints = [1];
                backgroundColors = [isDarkMode ? chartColorPalette.gray.dark : chartColorPalette.gray.light];
                borderColors = [isDarkMode ? chartColorPalette.gray.dark : chartColorPalette.gray.border];
            }

            chartConfig = {
                type: 'doughnut',
                data: {
                    labels: finalLabels,
                    datasets: [{
                        label: 'Tasks Completed',
                        data: finalDataPoints,
                        backgroundColor: backgroundColors,
                        borderColor: borderColors,
                        borderWidth: 1.5,
                        hoverOffset: 8
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false, cutout: '60%',
                    plugins: {
                        legend: { position: 'bottom', labels: { color: isDarkMode ? '#d1d5db' : '#374151', boxWidth: 12, padding: 15 } },
                        tooltip: {
                            bodyColor: isDarkMode ? '#d1d5db' : '#374151', titleColor: isDarkMode ? '#d1d5db' : '#374151',
                            backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                            borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.9)' : 'rgba(229, 231, 235, 0.9)', borderWidth: 1
                        }
                    }
                }
            } as ChartConfiguration<'doughnut'>;
        } else { // 'bar'
            const maxDataValue = Math.max(0, ...dataPoints);
            const stepSize = Math.max(1, Math.ceil(maxDataValue / 5));
            chartConfig = {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Tasks Completed',
                        data: dataPoints,
                        backgroundColor: [
                            isDarkMode ? chartColorPalette.blue.dark : chartColorPalette.blue.light,
                            isDarkMode ? chartColorPalette.green.dark : chartColorPalette.green.light,
                            isDarkMode ? chartColorPalette.purple.dark : chartColorPalette.purple.light,
                        ],
                        borderColor: [
                            isDarkMode ? chartColorPalette.blue.dark : chartColorPalette.blue.border,
                            isDarkMode ? chartColorPalette.green.dark : chartColorPalette.green.border,
                            isDarkMode ? chartColorPalette.purple.dark : chartColorPalette.purple.border,
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, ticks: { color: isDarkMode ? '#d1d5db' : '#374151', stepSize: stepSize }, grid: { color: isDarkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.5)' } },
                        x: { ticks: { color: isDarkMode ? '#d1d5db' : '#374151' }, grid: { display: false } }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            bodyColor: isDarkMode ? '#d1d5db' : '#374151', titleColor: isDarkMode ? '#d1d5db' : '#374151',
                            backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                            borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.9)' : 'rgba(229, 231, 235, 0.9)', borderWidth: 1
                        }
                    }
                }
            } as ChartConfiguration<'bar'>;
        }

        if (tasksCompletedChart) {
            tasksCompletedChart.data = chartConfig.data as any;
            tasksCompletedChart.options = chartConfig.options as any;
            tasksCompletedChart.update();
        } else {
            tasksCompletedChart = new Chart(tasksCompletedChartCanvas, chartConfig);
            lastTasksCompletedChartRenderedType = displayType;
        }
    }

	function toggleSidebar() { isSidebarOpen = !isSidebarOpen; localStorage.setItem('sidebarOpen', String(isSidebarOpen));}
	function toggleProfileDropdown() { showProfileDropdown = !showProfileDropdown; }
    function clickOutside(node: HTMLElement, callback: () => void) { /* ... */ }
	function toggleDarkMode() {
		isDarkMode = !isDarkMode;
		document.documentElement.classList.toggle('dark', isDarkMode);
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
	}
	$: if (browser) localStorage.setItem('sidebarOpen', String(isSidebarOpen));

</script>

<!-- HTML Structure (largely the same, ensure Tailwind classes for color are updated if needed) -->
<svelte:head>
	<title>Dashboard - Microtask</title>
</svelte:head>

<div class="flex h-screen text-gray-800 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-900">
	<!-- Sidebar -->
	{#if isSidebarOpen}
		<aside class="w-64 bg-white dark:bg-zinc-800 p-4 space-y-4 border-r dark:border-zinc-700 border-gray-200 shadow-lg flex-shrink-0 flex flex-col">
			<div>
                <div class="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-6">Microtask</div>
                <nav class="space-y-2">
                    <a href="/" class="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" /><path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" /></svg>
                        <span>Home</span>
                    </a>
                    <a href="/tasks" class="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path d="M2.5 3.5A1.5 1.5 0 014 2h12a1.5 1.5 0 011.5 1.5v13A1.5 1.5 0 0116 18H4a1.5 1.5 0 01-1.5-1.5v-13zM4 3h12a.5.5 0 01.5.5v13a.5.5 0 01-.5.5H4a.5.5 0 01-.5-.5v-13A.5.5 0 014 3zm5.5 4.75a.75.75 0 00-1.5 0v6.5a.75.75 0 001.5 0v-6.5zM12 6.25a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5a.75.75 0 01.75-.75z" /></svg>
                        <span>All Tasks</span>
                    </a>
                    <a href="/calendar" class="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c0-.69.56-1.25 1.25-1.25h10c.69 0 1.25.56 1.25 1.25v6.5c0 .69-.56 1.25-1.25 1.25h-10c-.69 0-1.25-.56-1.25-1.25v-6.5z" clip-rule="evenodd" /></svg>
                        <span>Calendar</span>
                    </a>
                    <a href="/workspace" class="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300">
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path d="M3.505 2.34a.75.75 0 00-1.061 1.06L4.19 5.147A1.75 1.75 0 006 6.303l7.5 2.253-2.254 7.503a1.75 1.75 0 001.156 2.14L16.25 19.5h.5c.966 0 1.75-.784 1.75-1.75V6.302a1.75 1.75 0 00-1.75-1.75h-2.006a3.25 3.25 0 01-3.103-3.103V-.5H9.258c-.603.301-1.082.78-1.38 1.38L3.505 2.34zM5.08 16.31a.25.25 0 01-.307-.307l2.254-7.503 7.503 2.254-2.254 7.503a.25.25 0 01-.307.307L5.08 16.31z" /></svg>
                        <span>Workspace</span>
                    </a>
                    <a href="/dashboard" class="flex items-center space-x-3 p-2 rounded-md bg-blue-600 dark:bg-blue-700 text-white font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M1 4a1 1 0 011-1h16a1 1 0 011 1v2.5a1 1 0 01-1 1H2a1 1 0 01-1-1V4zM2 9.5a1 1 0 011-1h4.5a1 1 0 011 1v6.5a1 1 0 01-1 1H3a1 1 0 01-1-1V9.5zM12.5 9.5A1 1 0 0011.5 10.5v6.5a1 1 0 001 1h4.5a1 1 0 001-1V9.5a1 1 0 00-1-1h-4.5z" clip-rule="evenodd" /></svg>
                        <span>Dashboard</span>
                    </a>
                    <a href="/ai-chat" class="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path d="M10.001 2.504a2.34 2.34 0 00-2.335 2.335v.583c0 .582.212 1.13.582 1.556l.03.035-.03.034a2.34 2.34 0 00-2.917 3.916A3.287 3.287 0 004.08 14.25a3.287 3.287 0 003.287 3.287h8.266a3.287 3.287 0 003.287-3.287 3.287 3.287 0 00-1.253-2.583 2.34 2.34 0 00-2.917-3.916l-.03-.034.03-.035c.37-.425.582-.973.582-1.555v-.583a2.34 2.34 0 00-2.335-2.336h-.002zM9.75 12.75a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5z" /><path fill-rule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM2.75 10a7.25 7.25 0 0112.439-5.743 7.25 7.25 0 015.743 12.44A7.25 7.25 0 013.81 16.181 7.25 7.25 0 012.75 10z" clip-rule="evenodd" /></svg>
                        <span>Ask Synthia</span>
                    </a>
                </nav>
            </div>
			<div class="mt-auto pt-4 border-t dark:border-zinc-600 border-gray-200">
				<form method="POST" action="?/logout" use:enhance class="w-full">
					<button type="submit" class="w-full flex items-center space-x-3 p-2 rounded-md text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-700/80 dark:hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2A.75.75 0 0010.75 3h-5.5A.75.75 0 004.5 4.25v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clip-rule="evenodd" /><path fill-rule="evenodd" d="M6 10a.75.75 0 01.75-.75h9.546l-1.048-.943a.75.75 0 111.004-1.114l2.5 2.25a.75.75 0 010 1.114l-2.5 2.25a.75.75 0 11-1.004-1.114l1.048-.943H6.75A.75.75 0 016 10z" clip-rule="evenodd" /></svg>
                        <span>Log out</span>
                    </button>
				</form>
			</div>
		</aside>
	{/if}

	<div class="flex-1 flex flex-col overflow-hidden">
		<header class="bg-white dark:bg-zinc-800 shadow p-4 flex justify-between items-center border-b dark:border-zinc-700 border-gray-200 flex-shrink-0">
			<div class="flex items-center">
				<button on:click={toggleSidebar} aria-label="Toggle sidebar" class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700 mr-3 text-gray-600 dark:text-zinc-400">
					{#if isSidebarOpen}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" /></svg>
                    {:else}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
                    {/if}
				</button>
				<h1 class="text-xl font-semibold text-gray-800 dark:text-zinc-100">Dashboard</h1>
			</div>
			<div class="flex items-center space-x-3 sm:space-x-4">
                <button on:click={toggleDarkMode} class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-600 dark:text-zinc-400" aria-label="Toggle dark mode">
                    {#if isDarkMode}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15.25a5.25 5.25 0 100-10.5 5.25 5.25 0 000 10.5zM10 18a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 18zM3.75 10a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 013.75 10zM13.75 10a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 0113.75 10zM6.099 5.013a.75.75 0 111.061-1.06l1.06 1.06a.75.75 0 11-1.06 1.06l-1.06-1.06zM12.78 13.902a.75.75 0 111.06-1.061l1.061 1.06a.75.75 0 11-1.06 1.06l-1.061-1.06zM5.037 13.901a.75.75 0 11-1.06-1.06l1.06-1.061a.75.75 0 011.06 1.06l-1.06 1.061zM13.84 5.013a.75.75 0 11-1.06-1.06l1.06-1.06a.75.75 0 111.06 1.06l-1.06 1.06z" /></svg>
                    {:else}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M7.455 2.663A.75.75 0 018.25 2a.75.75 0 01.75.75v.5a.75.75 0 01-1.5 0v-.5a.75.75 0 01.705-.747zM10 16.25a6.25 6.25 0 100-12.5 6.25 6.25 0 000 12.5zM5.295 4.545A.75.75 0 016 3.75a.75.75 0 01.75.75v.793a.75.75 0 01-1.5 0v-.793a.75.75 0 01-.205-.545zM13.25 3.75a.75.75 0 01.75.75v.793a.75.75 0 01-1.5 0v-.793A.75.75 0 0113.25 3.75zM16.205 5.045A.75.75 0 0117 5.25a.75.75 0 01-.75.75h-.793a.75.75 0 010-1.5h.793A.75.75 0 0116.205 5.045zM2.25 10a.75.75 0 01.75-.75h.793a.75.75 0 010 1.5H3a.75.75 0 01-.75-.75zM16.25 10a.75.75 0 01.75-.75h.793a.75.75 0 010 1.5h-.793a.75.75 0 01-.75-.75zM3.795 14.955A.75.75 0 013 14.75a.75.75 0 01.75-.75h.793a.75.75 0 010 1.5h-.793A.75.75 0 013.795 14.955zM13.25 15.25a.75.75 0 01.75-.75h.793a.75.75 0 010 1.5h-.793a.75.75 0 01-.75-.75zM8.25 17a.75.75 0 01.75-.75h.793a.75.75 0 010 1.5H9a.75.75 0 01-.75-.75z" clip-rule="evenodd" /></svg>
                    {/if}
                </button>
				<div class="relative">
                    <button class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-600 dark:text-zinc-400" aria-label="Notifications">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M10 2a.75.75 0 01.75.75v.813c.539.099 1.056.26 1.538.478l.538-.276a.75.75 0 11.54.922l-.329.64a6.509 6.509 0 010 7.686l.329.64a.75.75 0 11-.54.922l-.538-.276a6.479 6.479 0 01-1.538.478v.813a.75.75 0 01-1.5 0v-.813a6.479 6.479 0 01-1.538-.478l-.538.276a.75.75 0 11-.54-.922l.329-.64a6.509 6.509 0 010-7.686l-.329-.64a.75.75 0 11.54-.922l.538.276c.482-.217 1-.379 1.538-.478V2.75A.75.75 0 0110 2zM8.75 15.25a1.25 1.25 0 112.5 0 1.25 1.25 0 01-2.5 0z" clip-rule="evenodd" /></svg>
                    </button>
                </div>
				<div class="relative">
					<button on:click={toggleProfileDropdown} class="flex items-center space-x-1 sm:space-x-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700" aria-label="Profile options">
						<img src="/user-avatar-placeholder.png" alt="User avatar" class="w-8 h-8 rounded-full object-cover bg-gray-300 dark:bg-zinc-600" />
						<span class="hidden md:inline text-sm text-gray-700 dark:text-zinc-300">{username}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 text-gray-500 dark:text-zinc-400"><path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clip-rule="evenodd" /></svg>
					</button>
					{#if showProfileDropdown}
						<div use:clickOutside={() => showProfileDropdown = false} class="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-md shadow-xl py-1 border dark:border-zinc-700 border-gray-200 z-50">
							<div class="px-4 py-3 text-sm text-gray-500 dark:text-zinc-400 border-b dark:border-zinc-700 border-gray-200">
                                <p class="font-medium">Signed in as</p>
                                <p class="truncate">{username}</p>
                            </div>
							<a href="/settings" class="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300">Settings</a>
							<form method="POST" action="?/logout" use:enhance class="w-full">
								<button type="submit" class="w-full text-left block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-700/80 dark:hover:text-white">Logout</button>
							</form>
						</div>
					{/if}
				</div>
			</div>
		</header>

		<main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-zinc-900 p-4 md:p-6 relative">
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
	aside nav a[href="/dashboard"].bg-blue-600 svg,
    aside nav a[href="/dashboard"].dark\:bg-blue-700 svg {
        fill: white;
        stroke: white;
    }
    canvas { display: block; }
    .h-60 { height: 15rem; }
    .h-72 { height: 18rem; }
    .w-full { width: 100%; }
    .relative { position: relative; }
    .flex-grow { flex-grow: 1; }
</style>