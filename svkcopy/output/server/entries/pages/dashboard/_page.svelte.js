import { Q as head, F as escape_html, P as ensure_array_like, O as attr_class, J as store_get, K as unsubscribe_stores, G as bind_props, B as pop, z as push } from "../../../chunks/index.js";
import "../../../chunks/client.js";
import { w as writable } from "../../../chunks/exports.js";
const globalChartDisplayType = writable("doughnut");
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let dashboardStats, pageError;
  let data = $$props["data"];
  let username = data.user?.name || "User";
  dashboardStats = data.dashboardStats;
  pageError = data.error;
  if (data && data.user?.name) {
    username = data.user.name;
  } else if (data && !data.user?.name) {
    username = "User";
  }
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Dashboard - Microtask</title>`;
  });
  $$payload.out += `<div class="page-wrapper font-sans svelte-ysorvc">`;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="flex-1 flex flex-col overflow-hidden"><header class="top-header svelte-ysorvc"><div class="header-left svelte-ysorvc"><button id="hamburgerButton" class="menu-btn svelte-ysorvc" aria-label="Toggle Sidebar"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"></path></svg></button> <a href="/home" class="logo flex items-center gap-2 no-underline svelte-ysorvc"><img src="/logonamin.png" alt="Microtask Logo" class="h-8 w-auto"> <span class="top-header-logo-text font-semibold text-xl svelte-ysorvc">Microtask</span></a></div> <div class="header-icons svelte-ysorvc"><div class="relative svelte-ysorvc"><button id="bellIcon" aria-label="Notifications" class="svelte-ysorvc"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5" aria-hidden="true"><path fill-rule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0c-1.673-.253-3.287-.673-4.831-1.243a.75.75 0 01-.297-1.206C4.45 13.807 5.25 11.873 5.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0H9.752z" clip-rule="evenodd"></path></svg></button> <div id="notifWindow" class="dropdown-window hidden-dropdown w-80 max-h-96 overflow-y-auto custom-scrollbar svelte-ysorvc"><h3 class="font-semibold mb-2 text-sm">Notifications</h3> <p class="text-xs text-center py-4">No new notifications.</p></div></div> <div class="relative svelte-ysorvc"><button id="helpIcon" aria-label="Help &amp; FAQ" class="svelte-ysorvc"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5" aria-hidden="true"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.042.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd"></path></svg></button> <div id="helpWindow" class="dropdown-window hidden-dropdown svelte-ysorvc"><h3 class="font-semibold mb-2 text-sm">FAQ</h3><ul class="list-disc list-inside space-y-1 text-xs"><li>How do I add a task?</li><li>Where is the calendar?</li></ul><a href="/support" class="text-xs text-blue-600 hover:underline mt-2 block">Visit Support</a></div></div> <div class="relative svelte-ysorvc"><button id="profileIcon" aria-label="Profile Menu" class="svelte-ysorvc"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5" aria-hidden="true"><path fill-rule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clip-rule="evenodd"></path></svg></button> <div id="profileWindow" class="dropdown-window hidden-dropdown svelte-ysorvc"><h3 class="font-semibold mb-2 text-sm">Profile</h3> <p class="text-xs mb-2 truncate">Welcome, ${escape_html(username || "User")}!</p> <button class="profile-dropdown-button logout-action-button text-xs px-2 py-1.5 rounded w-full text-left transition-colors duration-150 svelte-ysorvc">Logout</button></div></div> <button id="darkModeToggle" aria-label="Toggle Dark Mode" class="darkmode-toggle-button ml-2 p-1.5 rounded-full transition-colors duration-150 svelte-ysorvc"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">`;
  {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<path fill-rule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM12 16.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Z" clip-rule="evenodd"></path>`;
  }
  $$payload.out += `<!--]--></svg></button></div></header> <main class="main-content flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 relative svelte-ysorvc"><h1 class="dashboard-title text-2xl font-bold mb-4 svelte-ysorvc">Dashboard</h1> `;
  if (pageError) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="error-alert border px-4 py-3 rounded relative mb-4 svelte-ysorvc" role="alert"><strong class="font-bold">Error:</strong> <span class="block sm:inline">${escape_html(pageError)}</span></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (dashboardStats) {
    $$payload.out += "<!--[-->";
    const each_array = ensure_array_like(Object.entries(dashboardStats.priorityCounts));
    $$payload.out += `<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 pb-16"><div class="chart-card p-4 md:p-6 rounded-xl shadow-lg flex flex-col svelte-ysorvc"><h2 class="chart-title chart-title-completed text-lg font-semibold mb-4 flex-shrink-0 svelte-ysorvc">Tasks Completed</h2> <div class="chart-canvas-wrapper h-60 md:h-72 w-full relative flex-grow svelte-ysorvc"><canvas class="svelte-ysorvc"></canvas></div> <div class="chart-summary mt-4 text-sm space-y-1 flex-shrink-0 svelte-ysorvc"><p><strong>This Month:</strong> ${escape_html(dashboardStats.tasksDoneThisMonth)}</p> <p><strong>This Week:</strong> ${escape_html(dashboardStats.tasksDoneThisWeek)}</p> <p><strong>All Time:</strong> ${escape_html(dashboardStats.tasksDoneAllTime)}</p></div></div> <div class="chart-card p-4 md:p-6 rounded-xl shadow-lg flex flex-col svelte-ysorvc"><h2 class="chart-title chart-title-timeliness text-lg font-semibold mb-4 flex-shrink-0 svelte-ysorvc">Completion Timeliness</h2> <div class="chart-canvas-wrapper h-60 md:h-72 w-full relative flex-grow svelte-ysorvc"><canvas class="svelte-ysorvc"></canvas></div> <div class="chart-summary mt-4 text-sm space-y-1 flex-shrink-0 svelte-ysorvc"><p><strong>Done On Time:</strong> ${escape_html(dashboardStats.tasksDoneOnTime)}</p> <p><strong>Done Late:</strong> ${escape_html(dashboardStats.tasksDoneLate)}</p></div></div> <div class="chart-card p-4 md:p-6 rounded-xl shadow-lg flex flex-col svelte-ysorvc"><h2 class="chart-title chart-title-priorities text-lg font-semibold mb-4 flex-shrink-0 svelte-ysorvc">Task Priorities</h2> <div class="chart-canvas-wrapper h-60 md:h-72 w-full relative flex-grow svelte-ysorvc"><canvas class="svelte-ysorvc"></canvas></div> <div class="chart-summary mt-4 text-sm space-y-1 flex-shrink-0 svelte-ysorvc"><!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let [priority, count] = each_array[$$index];
      if (priority !== "unprioritized" || priority === "unprioritized" && count > 0) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<p><strong class="capitalize svelte-ysorvc">${escape_html(priority)}:</strong> ${escape_html(count)}</p>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]-->`;
    }
    $$payload.out += `<!--]--></div></div></div> <div class="chart-toggle-bar fixed bottom-4 left-1/2 -translate-x-1/2 z-10 flex space-x-2 p-2 rounded-lg shadow-xl border svelte-ysorvc"><button${attr_class("chart-type-button px-3 py-1.5 text-sm rounded-md transition-colors font-medium svelte-ysorvc", void 0, {
      "active": store_get($$store_subs ??= {}, "$globalChartDisplayType", globalChartDisplayType) === "doughnut"
    })}>Pie / Doughnut</button> <button${attr_class("chart-type-button px-3 py-1.5 text-sm rounded-md transition-colors font-medium svelte-ysorvc", void 0, {
      "active": store_get($$store_subs ??= {}, "$globalChartDisplayType", globalChartDisplayType) === "bar"
    })}>Bar Chart</button></div>`;
  } else if (!pageError) {
    $$payload.out += "<!--[1-->";
    $$payload.out += `<div class="loading-message flex justify-center items-center h-full svelte-ysorvc"><p class="loading-text text-lg svelte-ysorvc">Loading dashboard data or no data available...</p></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></main></div></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  bind_props($$props, { data });
  pop();
}
export {
  _page as default
};
