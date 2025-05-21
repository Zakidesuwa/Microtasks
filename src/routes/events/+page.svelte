<script lang="ts">
	import { fly, slide } from 'svelte/transition'; // Import slide transition
	import { onMount } from 'svelte';

	let isSidebarOpen = false;
	let isCreateOpen = false; // State for the Create section accordion
	// Set active view to 'viewEvents' for this page
	let activeView = 'viewEvents'; // Can be 'calendar', 'create', 'viewList', 'viewEvents'

	function toggleSidebar() {
		isSidebarOpen = !isSidebarOpen;
		// Optionally close the create section when sidebar closes
		if (!isSidebarOpen) {
			isCreateOpen = false;
		}
	}

	// Toggle the Create accordion section
	function toggleCreateSection() {
		isCreateOpen = !isCreateOpen;
		// IMPORTANT: Don't set activeView when just toggling the accordion
	}

	// IDs for header dropdowns ONLY
	const headerDropdownIds = ['notifWindow', 'helpWindow', 'profileWindow'];

	function toggleWindow(id: string) {
		const el = document.getElementById(id);
		if (el) {
			el.classList.toggle('hidden');
		}
	}

	// Function to close all HEADER dropdowns except the one specified
	function closeOtherHeaderWindows(currentId: string) {
		headerDropdownIds.forEach((id) => {
			if (id !== currentId) {
				const el = document.getElementById(id);
				if (el && !el.classList.contains('hidden')) {
					el.classList.add('hidden');
				}
			}
		});
	}

	// Function to set the active view (triggered by clicking sidebar items)
	function setActiveView(viewName: string) {
		activeView = viewName;
		// In a real app, you'd likely load different component/data here
		console.log('Active view set to:', viewName);
		// Close create accordion if another main view is selected
		if (viewName !== 'create') {
			// Keep 'create' check conceptually, though it's not a main view
			isCreateOpen = false;
		}
	}

	onMount(() => {
		const bellIcon = document.getElementById('bellIcon');
		const helpIcon = document.getElementById('helpIcon');
		const profileIcon = document.getElementById('profileIcon');

		// --- Event listeners for header dropdowns ---
		if (bellIcon) {
			bellIcon.addEventListener('click', (event) => {
				event.stopPropagation();
				toggleWindow('notifWindow');
				closeOtherHeaderWindows('notifWindow');
			});
		}
		if (helpIcon) {
			helpIcon.addEventListener('click', (event) => {
				event.stopPropagation();
				toggleWindow('helpWindow');
				closeOtherHeaderWindows('helpWindow');
			});
		}
		if (profileIcon) {
			profileIcon.addEventListener('click', (event) => {
				event.stopPropagation();
				toggleWindow('profileWindow');
				closeOtherHeaderWindows('profileWindow');
			});
		}

		// --- Global click listener to close HEADER dropdowns ---
		document.addEventListener('click', (event) => {
			const target = event.target as Node | null;

			// Check if the click is inside any HEADER dropdown or its trigger
			const isClickInsideHeaderDropdownOrTrigger = headerDropdownIds.some((id) => {
				const el = document.getElementById(id);
				if (el && el.contains(target)) return true;
				let triggerId = '';
				// Derive trigger ID only for header dropdowns
				if (id === 'notifWindow') triggerId = 'bellIcon';
				else if (id === 'helpWindow') triggerId = 'helpIcon';
				else if (id === 'profileWindow') triggerId = 'profileIcon';
				const triggerEl = triggerId ? document.getElementById(triggerId) : null;
				return triggerEl && triggerEl.contains(target);
			});

			// If the click is outside any HEADER dropdown/trigger, close all HEADER dropdowns
			if (!isClickInsideHeaderDropdownOrTrigger) {
				closeOtherHeaderWindows(''); // Passing empty string ensures all are considered 'other'
			}
		});
	});
</script>

<div class="app-container" class:sidebar-closed={!isSidebarOpen}>
	<header class="top-header">
		<div class="header-left">
			<button class="menu-btn" on:click={toggleSidebar}>
				<img src="/Hamburger.png" alt="Menu" style="width: 24px; height: 24px;" />
			</button>
			<a href="/home" class="logo">
				<img src="/logonamin.png" alt="Microtask Logo" />
				<span>Microtask</span>
			</a>
		</div>
		<div class="header-icons">
			<div class="relative">
				<button id="bellIcon">
					<img src="/Bell.png" alt="Notifications" />
				</button>
				<div id="notifWindow" class="dropdown-window hidden">
					<h3 class="font-semibold mb-2 text-sm">Notifications</h3>
					<p class="text-xs text-gray-600">No new notifications.</p>
				</div>
			</div>
			<div class="relative">
				<button id="helpIcon">
					<img src="/Question.png" alt="FAQ" />
				</button>
				<div id="helpWindow" class="dropdown-window hidden">
					<h3 class="font-semibold mb-2 text-sm">FAQ</h3>
					<ul class="list-disc list-inside space-y-1">
						<li class="text-xs text-gray-600">How do I add a task?</li>
						<li class="text-xs text-gray-600">Where is the calendar?</li>
					</ul>
					<a href="/support" class="text-xs text-blue-500 hover:underline mt-2 block">Visit Support</a>
				</div>
			</div>
			<div class="relative">
				<button id="profileIcon">
					<img src="/Profile.png" alt="Profile" />
				</button>
				<div id="profileWindow" class="dropdown-window hidden">
					<h3 class="font-semibold mb-2 text-sm">Profile</h3>
					<p class="text-xs text-gray-600 mb-2">Welcome!</p>
					<a href="/settings"
						class="block text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded w-full text-left mb-1"
						>Settings</a
					>
					<button
						class="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded w-full text-left"
						>Logout</button
					>
				</div>
			</div>
		</div>
	</header>

	{#if isSidebarOpen}
		<aside class="sidebar" transition:fly={{ x: -240, duration: 300 }}>
			<nav class="main-nav">
				<ul>
					<a href="/calendar" class="nav-item-link">
						<li class="nav-item" class:active={activeView === 'calendar'}>
							<img src="/Calendar.png" alt="" /> Calendar
						</li>
					</a>

					<li class="nav-item-container create-accordion">
						<button class="nav-button" on:click={toggleCreateSection} aria-expanded={isCreateOpen}>
							<img src="/Plus.png" alt="" />
							<span>Create</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
								fill="currentColor"
								class="w-4 h-4 ml-auto opacity-70 chevron-icon"
								class:rotated={isCreateOpen}
							>
								<path
									fill-rule="evenodd"
									d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.27a.75.75 0 01.02-1.06z"
									clip-rule="evenodd"
								/>
							</svg>
						</button>
						{#if isCreateOpen}
							<div class="accordion-content" transition:slide={{ duration: 250 }}>
								<button class="accordion-item">
									<span>Schedule</span>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 20 20"
										fill="currentColor"
										class="w-4 h-4 ml-auto opacity-70"
									>
										<path
											fill-rule="evenodd"
											d="M7.21 14.77a.75.75 0 01.02-1.06L11.19 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
											clip-rule="evenodd"
										/>
									</svg>
								</button>
								<button class="accordion-item">
									<span>Task</span>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 20 20"
										fill="currentColor"
										class="w-4 h-4 ml-auto opacity-70"
									>
										<path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.19 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
									</svg>
								</button>
							</div>
						{/if}
					</li>
					
					<a href="/tasks">
					<li class="nav-item" class:active={activeView === 'viewList'} on:click={() => setActiveView('viewList')}>
						<img src="/View.png" alt="" /> View List
					</li>
					</a>
					               <a href="/events" class="nav-item-link">
					                   <li
					                       class="nav-item"
					                       class:active={activeView === 'viewEvents'}
					                   >
					                       <img src="/Events.png" alt="" /> View Events
					                   </li>
					               </a>
				</ul>
			</nav>
			<div class="mini-calendar-widget">
				<div class="calendar-header">
					<button>&lt;</button>
					<span>March 2025</span>
					<button>&gt;</button>
					<button class="mini-today-btn">Today</button>
				</div>
				<table>
					<thead>
						<tr><th>Su</th><th>Mo</th><th>Tu</th><th>We</th><th>Th</th><th>Fr</th><th>Sa</th></tr>
					</thead>
					<tbody>
						<tr><td class="other-month">23</td><td class="other-month">24</td><td class="other-month">25</td><td class="other-month">26</td><td class="other-month">27</td><td class="other-month">28</td><td>1</td></tr>
						<tr><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td><td>7</td><td>8</td></tr>
						<tr><td>9</td><td>10</td><td>11</td><td>12</td><td class="highlighted">13</td><td>14</td><td>15</td></tr>
						<tr><td>16</td><td>17</td><td>18</td><td>19</td><td>20</td><td>21</td><td>22</td></tr>
						<tr><td>23</td><td>24</td><td>25</td><td>26</td><td>27</td><td>28</td><td>29</td></tr>
						<tr><td>30</td><td>31</td><td class="other-month next">1</td><td class="other-month next">2</td><td class="other-month next">3</td><td class="other-month next">4</td><td class="other-month next">5</td></tr>
					</tbody>
				</table>
			</div>
		</aside>
	{/if}

	<main class="main-content">
		<div class="content-header event-list-header">
			<button class="today-btn">TODAY</button>
			<div class="search-bar">
				<img src="/Search.png" alt="Search Icon" />
				<input type="search" placeholder="Search" />
			</div>
			<div class="filter-buttons">
				<button class="filter-btn">Day</button>
				<button class="filter-btn">Sort</button>
				<button class="filter-btn">Filter</button>
			</div>
		</div>

		<!-- Event Grid Area - Replaces Task List -->
		<div class="event-grid">
			<div class="event-card">
				<h3>HIGH PRIORITY</h3>
				<hr />
				<ul>
					<li>
						<span class="event-title">Project Deadline Meeting</span>
						<span class="event-time">March 25, 2025, 10:00 AM - 11:30 AM</span>
					</li>
					<li>
						<span class="event-title">System Security Update</span>
						<span class="event-time">March 28, 2025, 2:00 PM - 4:00 PM</span>
					</li>
				</ul>
			</div>
			<div class="event-card">
				<h3>STANDARD PRIORITY</h3>
				<hr />
				<ul>
					<li>
						<span class="event-title">Client Presentation Prep</span>
						<span class="event-time">March 26, 2025, 1:00 PM - 2:30 PM</span>
					</li>
					<li>
						<span class="event-title">Team Progress Review</span>
						<span class="event-time">March 27, 2025, 3:00 PM - 4:00 PM</span>
					</li>
				</ul>
			</div>
			<div class="event-card">
				<h3>LOW PRIORITY</h3>
				<hr />
				<ul>
					<li>
						<span class="event-title">Website UI Tweaks Discussion</span>
						<span class="event-time">March 29, 2025, 11:00 AM - 12:00 PM</span>
					</li>
					<li>
						<span class="event-title">General Market Research</span>
						<span class="event-time">April 1, 2025, 2:00 PM - 3:00 PM</span>
					</li>
				</ul>
			</div>
			<div class="event-card">
				<h3>PERSONAL</h3>
				<hr />
				<ul>
					<li>
						<span class="event-title">Doctor's Appointment</span>
						<span class="event-time">March 30, 2025, 9:00 AM - 10:00 AM</span>
					</li>
					<li>
						<span class="event-title">Friend's Birthday Dinner</span>
						<span class="event-time">April 2, 2025, 7:00 PM - 9:00 PM</span>
					</li>
				</ul>
			</div>
		</div>
		<!-- End Event Grid Area -->
	</main>
</div>

<style>
	/* --- Styles --- */
	:global(body) {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
		background-color: #f0f2f5;
		color: #333;
		margin: 0;
		padding: 0;
		overflow-x: hidden;
	}

	.app-container {
		display: flex;
		width: 100%;
		min-height: 100vh;
		transition: margin-left 0.3s ease-in-out;
	}

	.top-header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 20px;
		background-color: #ffffff;
		border-bottom: 1px solid #e0e0e0;
		height: 60px;
		z-index: 1000;
	}
	.header-left {
		display: flex;
		align-items: center;
	}
	.top-header .menu-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 8px; /* Adjust padding */
		margin-right: 15px;
		display: flex; /* Make it a flex container */
		align-items: center; /* Center image vertically */
		justify-content: center; /* Center image horizontally */
		line-height: 0; /* Prevent extra space from text node */
	}
	.top-header .menu-btn img {
		/* Style for the image if needed */
		display: block; /* Ensure image behaves like a block */
	}
	.top-header .logo {
		display: flex;
		align-items: center;
		font-weight: 600;
		font-size: 1.15em;
		color: #1c1e21;
		text-decoration: none;
	}
	.top-header .logo:hover {
		opacity: 0.8;
	}
	.top-header .logo img {
		height: 24px;
		margin-right: 8px;
		vertical-align: middle;
	}
	.top-header .header-icons {
		display: flex;
		align-items: center;
		gap: 5px;
	}
	.top-header .header-icons button {
		background: none;
		border: none;
		cursor: pointer;
		padding: 5px;
		line-height: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		width: 36px;
		height: 36px;
		transition: background-color 0.2s ease;
	}
	.top-header .header-icons button:hover {
		background-color: #f0f2f5;
	}
	.top-header .header-icons img {
		height: 22px;
		width: 22px;
		opacity: 0.7;
	}
	.top-header .header-icons button:hover img {
		opacity: 1;
	}

	/* --- Dropdown Window Styles (Header) --- */
	.relative {
		position: relative;
	}
	.dropdown-window {
		position: absolute;
		right: 0;
		top: calc(100% + 8px);
		background-color: white;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		padding: 12px;
		width: 240px;
		z-index: 1010;
		opacity: 1;
		transform: translateY(0);
		transition:
			opacity 0.2s ease,
			transform 0.2s ease,
			visibility 0s linear 0s;
		visibility: visible;
	}
	.dropdown-window.hidden {
		opacity: 0;
		transform: translateY(-5px);
		pointer-events: none;
		visibility: hidden;
		transition:
			opacity 0.2s ease,
			transform 0.2s ease,
			visibility 0s linear 0.2s;
	}
	.dropdown-window h3 {
		color: #1c1e21;
	}
	.dropdown-window p,
	.dropdown-window li {
		color: #606770;
	}
	.dropdown-window button {
		/* Basic button styling */
	}
	.dropdown-window a {
		color: #1877f2;
	}

	.sidebar {
		width: 240px;
		flex-shrink: 0;
		background-color: #ffffff;
		border-right: 1px solid #e0e0e0;
		padding-top: 60px; /* Match header height */
		display: flex;
		flex-direction: column;
		height: 100vh;
		position: fixed;
		left: 0;
		top: 0;
		z-index: 999;
	}
	.main-nav {
		flex-grow: 1; /* Allow nav to take space */
		overflow-y: auto; /* Add scroll if needed */
	}
	.main-nav ul {
		list-style: none;
		padding: 15px 0;
		margin: 0;
	}

	/* --- Sidebar Navigation Item Styling --- */
	.nav-item {
		/* Combined styles for li and button-like appearance */
		padding: 10px 20px;
		display: flex;
		align-items: center;
		cursor: pointer;
		color: #4b4f56;
		font-size: 0.95em;
		font-weight: 500;
		margin: 2px 10px;
		border-radius: 6px;
		transition: background-color 0.2s ease;
		background: none; /* Reset background */
		border: none; /* Reset border */
		width: calc(100% - 20px); /* Account for margin */
		text-align: left; /* Align text */
		box-sizing: border-box; /* Include padding in width calculation */
	}
	.nav-item:hover {
		background-color: #f0f2f5;
	}
	.nav-item.active {
		background-color: #e7f3ff;
		color: #1877f2;
		font-weight: 600;
	}
	.nav-item img {
		height: 20px;
		width: 20px;
		margin-right: 15px;
		opacity: 0.6;
		filter: invert(39%) sepia(6%) saturate(954%) hue-rotate(179deg) brightness(93%) contrast(89%);
	}
	.nav-item.active img {
		opacity: 1;
		filter: invert(40%) sepia(56%) saturate(5870%) hue-rotate(201deg) brightness(98%) contrast(96%);
	}

	/* Style for anchor tag wrapping nav items */
	.nav-item-link {
		text-decoration: none; /* Remove underline */
		color: inherit; /* Inherit color from parent */
		display: block; /* Ensure the link takes up the li space */
		margin: 0 10px; /* Match margin of other items for spacing */
	}
	/* Apply hover/active styles to the inner li when the link is hovered/active */
	.nav-item-link:hover .nav-item {
		background-color: #f0f2f5;
	}
	/* Note: Active state styling depends on how activeView is updated after navigation */
	.nav-item-link .nav-item.active {
		background-color: #e7f3ff;
		color: #1877f2;
		font-weight: 600;
	}
	.nav-item-link .nav-item.active img {
		opacity: 1;
		filter: invert(40%) sepia(56%) saturate(5870%) hue-rotate(201deg) brightness(98%) contrast(96%);
	}

	/* Container for the Create button+accordion li */
	.nav-item-container.create-accordion {
		margin: 2px 10px; /* Match standard item margin */
	}
	.nav-button {
		/* Style for the Create button specifically */
		display: flex;
		align-items: center;
		width: 100%;
		padding: 10px 20px;
		background: none;
		border: none;
		text-align: left;
		cursor: pointer;
		color: #4b4f56;
		font-size: 0.95em;
		font-weight: 500;
		border-radius: 6px;
		transition: background-color 0.2s ease;
		box-sizing: border-box;
	}
	.nav-button:hover {
		background-color: #f0f2f5;
	}
	.nav-button img {
		height: 20px;
		width: 20px;
		margin-right: 15px;
		opacity: 0.6;
		filter: invert(39%) sepia(6%) saturate(954%) hue-rotate(179deg) brightness(93%) contrast(89%);
	}
	.nav-button .chevron-icon {
		transition: transform 0.2s ease-in-out; /* Smooth rotation */
	}
	.nav-button .chevron-icon.rotated {
		transform: rotate(180deg); /* Rotate chevron when open */
	}

	/* --- Sidebar Accordion Content Styles --- */
	.accordion-content {
		/* Style the container for the accordion items */
		background-color: #f8f9fa; /* Slightly different background */
		border-radius: 4px; /* Slightly rounded corners */
		margin: 4px 0 4px 35px; /* Indent slightly more than icon+margin */
		padding: 6px; /* Padding around items */
		overflow: hidden; /* Needed for slide transition */
	}
	.accordion-item {
		/* Style individual items within the accordion */
		display: flex;
		align-items: center;
		width: 100%;
		padding: 8px 12px;
		background: none;
		border: none;
		text-align: left;
		cursor: pointer;
		color: #333333;
		font-size: 0.9em;
		font-weight: 500;
		border-radius: 4px;
		margin-bottom: 2px;
		transition: background-color 0.2s ease;
	}
	.accordion-item:last-child {
		margin-bottom: 0;
	}
	.accordion-item:hover {
		background-color: #e9ecef; /* Lighter gray hover */
	}
	.accordion-item span {
		flex-grow: 1;
	}

	/* --- Mini Calendar Widget (Sidebar) --- */
	.mini-calendar-widget {
		padding: 15px;
		margin: 10px; /* Add some margin */
		border-top: 1px solid #e0e0e0; /* Separator */
		margin-top: auto; /* Push to bottom */
		flex-shrink: 0; /* Prevent shrinking */
	}
	.mini-calendar-widget .calendar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 10px;
		padding: 0;
		font-size: 0.9em;
	}
	.mini-calendar-widget .calendar-header span {
		font-weight: 600;
		color: #333;
	}
	.mini-calendar-widget .calendar-header button {
		background: none;
		border: none;
		font-size: 1.2em;
		cursor: pointer;
		color: #606770;
		padding: 0 5px;
	}
	.mini-calendar-widget .calendar-header button:hover {
		color: #000;
	}
	.mini-calendar-widget .mini-today-btn {
		font-size: 0.8em;
		color: #1877f2;
		padding: 2px 5px;
		margin-left: auto;
		font-weight: 600;
	}
	.mini-calendar-widget table {
		width: 100%;
		border-collapse: collapse;
		text-align: center;
	}
	.mini-calendar-widget th {
		padding-bottom: 8px;
		font-size: 0.7em;
		color: #606770;
		font-weight: 600;
		text-transform: uppercase;
	}
	.mini-calendar-widget td {
		padding: 0;
		font-size: 0.8em;
		cursor: pointer;
		width: 24px;
		height: 24px;
		line-height: 24px;
		position: relative;
		border-radius: 50%;
		color: #1c1e21;
		font-weight: 400;
		border: 1px solid transparent;
		transition: background-color 0.2s ease;
	}
	.mini-calendar-widget td:hover {
		background-color: #f0f2f5;
	}
	.mini-calendar-widget td.highlighted {
		background-color: #333;
		color: #fff;
		font-weight: 700;
	}
	.mini-calendar-widget td.other-month {
		color: #ccc;
		cursor: default;
	}
	.mini-calendar-widget td.other-month.next {
		color: #e0e0e0; /* Slightly different shade for next month */
	}
	.mini-calendar-widget td.other-month:hover {
		background-color: transparent;
	}

	/* --- Main Content --- */
	.main-content {
		flex-grow: 1;
		padding: 20px;
		padding-top: 80px; /* Header height + padding */
		margin-left: 240px;
		background-color: #f0f2f5; /* Match body background */
		transition: margin-left 0.3s ease-in-out;
		min-width: 0; /* Prevent content from overflowing */
	}
	.app-container.sidebar-closed .main-content {
		margin-left: 0;
	}

	/* Updated Content Header for Event List */
	.content-header.event-list-header {
		display: flex;
		align-items: center;
		justify-content: space-between; /* Adjust as needed */
		margin-bottom: 25px;
		padding: 8px 15px;
		background-color: #ffffff; /* White background */
		border: 1px solid #e0e0e0; /* Add border like image */
		border-radius: 6px;
		gap: 10px; /* Add gap between elements */
	}
	.today-btn {
		padding: 6px 15px;
		background-color: #e4e6eb;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 600;
		font-size: 0.9em;
		color: #050505;
		flex-shrink: 0;
	}
	.today-btn:hover {
		background-color: #d8dadf;
	}
	.search-bar {
		display: flex;
		align-items: center;
		background-color: #ffffff;
		border: 1px solid #ccd0d5;
		border-radius: 20px;
		padding: 5px 12px;
		flex-grow: 1; /* Allow search to grow */
	}
	.search-bar img {
		height: 16px;
		width: 16px;
		margin-right: 6px;
		opacity: 0.6;
	}
	.search-bar input {
		border: none;
		outline: none;
		padding: 3px 0;
		background: none;
		font-size: 0.9em;
		color: #000000;
		width: 100%;
	}
	.search-bar input::placeholder {
		color: #8a8d91;
	}
	.filter-buttons {
		display: flex;
		gap: 8px;
		flex-shrink: 0;
	}
	.filter-btn {
		padding: 6px 15px;
		background-color: #e4e6eb;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 600;
		font-size: 0.9em;
		color: #050505;
	}
	.filter-btn:hover {
		background-color: #d8dadf;
	}

	/* --- Event Grid Styles --- */
	.event-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); /* Responsive grid */
		gap: 20px;
	}

	.event-card {
		background-color: #e4e6eb; /* Light grey background like image */
		border-radius: 8px;
		padding: 15px 20px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.event-card h3 {
		font-size: 0.9em;
		font-weight: 700;
		color: #050505;
		margin: 0 0 8px 0;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.event-card hr {
		border: none;
		border-top: 1px solid #050505; /* Black separator line */
		margin: 8px 0 12px 0;
	}

	.event-card ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.event-card li {
		margin-bottom: 12px;
		position: relative;
		padding-left: 18px; /* Space for the bullet */
	}
	.event-card li:last-child {
		margin-bottom: 0;
	}

	.event-card li::before {
		content: '•'; /* Bullet point */
		position: absolute;
		left: 0;
		top: 0px; /* Adjust vertical alignment */
		font-size: 1.2em; /* Adjust bullet size */
		line-height: 1;
		color: #050505; /* Black bullet */
	}

	.event-card .event-title {
		display: block;
		font-weight: 600;
		color: #050505;
		font-size: 0.95em;
		margin-bottom: 2px;
	}

	.event-card .event-time {
		display: block;
		font-size: 0.8em;
		color: #333; /* Slightly lighter than title */
	}

	/* Helper classes for inline SVGs */
	.w-4 {
		width: 1rem;
	}
	.h-4 {
		height: 1rem;
	}
	.ml-auto {
		margin-left: auto;
	}
	.opacity-70 {
		opacity: 0.7;
	}
	.fill-current {
		fill: currentColor;
	}
</style>