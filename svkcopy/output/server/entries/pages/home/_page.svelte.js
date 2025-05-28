import { O as attr_class, F as escape_html, P as ensure_array_like, N as attr, E as attr_style, G as bind_props, B as pop, z as push } from "../../../chunks/index.js";
import "../../../chunks/client.js";
import "../../../chunks/firebase.js";
function _page($$payload, $$props) {
  push();
  let expandedNoteId = null;
  let username = "User";
  let greeting = "GOOD DAY";
  let isRefreshingTasks = false;
  let errorMessage = null;
  let isDarkMode = false;
  let noTasksTodayMessage = "You have no tasks due today, take a well-deserved break for now view all tasks below!";
  let data = $$props["data"];
  if (data && data.username) {
    username = data.username;
  }
  {
    if (data?.error) {
      errorMessage = data.error;
    } else {
      errorMessage = null;
    }
    if (data && typeof data.showCompleted === "boolean") {
      data.showCompleted;
    }
  }
  $$payload.out += `<div${attr_class(`flex h-screen font-sans ${"bg-gray-100 text-gray-800"}`, "svelte-1as78wz")}>`;
  if (errorMessage) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-md z-[100] svelte-1as78wz" role="alert"><strong class="font-bold svelte-1as78wz">Error:</strong> <span class="block sm:inline svelte-1as78wz">${escape_html(errorMessage)}</span> <button class="absolute top-0 bottom-0 right-0 px-4 py-3 svelte-1as78wz" aria-label="Close error"><span class="text-xl svelte-1as78wz">×</span></button></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="flex-1 flex flex-col overflow-hidden svelte-1as78wz"><header${attr_class(`top-header ${"bg-white border-gray-200"}`, "svelte-1as78wz")}><div class="header-left svelte-1as78wz"><button id="hamburgerButton" class="menu-btn svelte-1as78wz" aria-label="Toggle Sidebar"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 svelte-1as78wz"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" class="svelte-1as78wz"></path></svg></button> <a href="/home" class="logo svelte-1as78wz"><img src="/logonamin.png" alt="Microtask Logo" class="h-8 w-auto svelte-1as78wz"> <span${attr_class(`${"text-gray-800"}`, "svelte-1as78wz")}>Microtask</span></a></div> <div class="header-icons svelte-1as78wz"><div class="relative svelte-1as78wz"><button id="bellIcon" aria-label="Notifications" class="svelte-1as78wz"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 svelte-1as78wz" aria-hidden="true"><path fill-rule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0c-1.673-.253-3.287-.673-4.831-1.243a.75.75 0 01-.297-1.206C4.45 13.807 5.25 11.873 5.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0H9.752z" clip-rule="evenodd" class="svelte-1as78wz"></path></svg></button> <div id="notifWindow"${attr_class(`dropdown-window hidden ${"bg-white border-gray-200 text-gray-700"}`, "svelte-1as78wz")}><h3 class="font-semibold mb-2 text-sm svelte-1as78wz">Notifications</h3><p class="text-xs svelte-1as78wz">No new notifications.</p></div></div> <div class="relative svelte-1as78wz"><button id="helpIcon" aria-label="Help &amp; FAQ" class="svelte-1as78wz"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 svelte-1as78wz" aria-hidden="true"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.042.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" class="svelte-1as78wz"></path></svg></button> <div id="helpWindow"${attr_class(`dropdown-window hidden ${"bg-white border-gray-200 text-gray-700"}`, "svelte-1as78wz")}><h3 class="font-semibold mb-2 text-sm svelte-1as78wz">FAQ</h3> <ul class="list-disc list-inside space-y-1 text-xs svelte-1as78wz"><li class="svelte-1as78wz">How do I add a task?</li><li class="svelte-1as78wz">Where is the calendar?</li></ul> <a href="/support" class="text-xs text-blue-600 hover:underline mt-2 block svelte-1as78wz">Visit Support</a></div></div> <div class="relative svelte-1as78wz"><button id="profileIcon" aria-label="Profile Menu" class="svelte-1as78wz"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 svelte-1as78wz" aria-hidden="true"><path fill-rule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clip-rule="evenodd" class="svelte-1as78wz"></path></svg></button> <div id="profileWindow"${attr_class(`dropdown-window hidden ${"bg-white border-gray-200 text-gray-700"}`, "svelte-1as78wz")}><h3 class="font-semibold mb-2 text-sm svelte-1as78wz">Profile</h3> <p class="text-xs mb-2 truncate svelte-1as78wz">Welcome, ${escape_html(username || "User")}!</p> <button${attr_class(`text-xs px-2 py-1.5 rounded w-full text-left transition-colors duration-150 ${"bg-red-100 hover:bg-red-200 text-red-700"}`, "svelte-1as78wz")}>Logout</button></div></div> <button id="darkModeToggle" aria-label="Toggle Dark Mode"${attr_class(`ml-2 p-1.5 rounded-full transition-colors duration-150 ${"hover:bg-gray-100 text-gray-700"}`, "svelte-1as78wz")}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 svelte-1as78wz">`;
  {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<path fill-rule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM12 16.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Z" clip-rule="evenodd" class="svelte-1as78wz"></path>`;
  }
  $$payload.out += `<!--]--></svg></button></div></header> <div class="flex-1 overflow-y-auto pt-[60px] pb-20 flex flex-col svelte-1as78wz"><div class="px-4 sm:px-6 mt-6 svelte-1as78wz"><h1${attr_class(`text-2xl sm:text-3xl font-bold ${"text-gray-800"}`, "svelte-1as78wz")}>${escape_html(greeting)}, <span${attr_class(`${"text-blue-600"}`, "svelte-1as78wz")}>${escape_html(username.toUpperCase())}</span>!</h1></div> <main class="px-4 sm:px-6 mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow svelte-1as78wz"><section class="flex flex-col gap-6 svelte-1as78wz"><div${attr_class(`border rounded-lg p-4 shadow-sm flex flex-col ${"bg-white border-gray-200"}`, "svelte-1as78wz")}><div class="flex justify-between items-center mb-3 flex-shrink-0 svelte-1as78wz"><h2${attr_class(`text-lg font-semibold ${"text-gray-700"}`, "svelte-1as78wz")}>Quick access</h2></div> <div class="space-y-2 flex-grow overflow-y-auto mb-4 pr-2 -mr-2 custom-scrollbar svelte-1as78wz"><a href="/calendar"${attr_class(`block rounded-lg px-4 py-2.5 shadow-xs transition-colors duration-150 ${"bg-white border border-gray-200 hover:bg-gray-50 text-gray-800"}`, "svelte-1as78wz")}><div class="flex items-center gap-3 svelte-1as78wz"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-blue-500 dark:text-blue-400 svelte-1as78wz" aria-hidden="true"><path fill-rule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zM5.25 6.75c-.621 0-1.125.504-1.125 1.125V18a1.125 1.125 0 001.125 1.125h13.5A1.125 1.125 0 0019.875 18V7.875c0-.621-.504-1.125-1.125-1.125H5.25z" clip-rule="evenodd" class="svelte-1as78wz"></path><path d="M10.5 9.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H10.5v-.01a.75.75 0 000-1.5zM10.5 12.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H10.5v-.01a.75.75 0 000-1.5zM10.5 15.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H10.5v-.01a.75.75 0 000-1.5zM13.5 9.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H13.5v-.01a.75.75 0 000-1.5zM13.5 12.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H13.5v-.01a.75.75 0 000-1.5zM13.5 15.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H13.5v-.01a.75.75 0 000-1.5zM16.5 9.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H16.5v-.01a.75.75 0 000-1.5zM16.5 12.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H16.5v-.01a.75.75 0 000-1.5zM16.5 15.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H16.5v-.01a.75.75 0 000-1.5z" class="svelte-1as78wz"></path></svg> <span class="text-base font-medium svelte-1as78wz">Calendar</span></div></a> <a href="/tasks"${attr_class(`block rounded-lg px-4 py-2.5 shadow-xs transition-colors duration-150 ${"bg-white border border-gray-200 hover:bg-gray-50 text-gray-800"}`, "svelte-1as78wz")}><div class="flex items-center gap-3 svelte-1as78wz"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-green-500 dark:text-green-400 svelte-1as78wz" aria-hidden="true"><path fill-rule="evenodd" d="M2.25 5.25A3 3 0 015.25 2.25h13.5a3 3 0 013 3V12a3 3 0 01-3 3H5.25a3 3 0 01-3-3V5.25zm1.5 0v6.75c0 .828.672 1.5 1.5 1.5h13.5c.828 0 1.5-.672 1.5-1.5V5.25c0-.828-.672-1.5-1.5-1.5H5.25c-.828 0-1.5.672-1.5 1.5zM9 18.75a.75.75 0 000 1.5h6a.75.75 0 000-1.5H9z" clip-rule="evenodd" class="svelte-1as78wz"></path></svg> <span class="text-base font-medium svelte-1as78wz">Tasks</span></div></a></div></div> <div${attr_class(`border rounded-lg p-4 shadow-sm relative flex flex-col ${"bg-white border-gray-200"}`, "svelte-1as78wz")}><div class="flex justify-between items-center mb-3 flex-shrink-0 svelte-1as78wz"><h2${attr_class(`text-lg font-semibold ${"text-gray-700"}`, "svelte-1as78wz")}>Tasks that are due today</h2></div> <div class="space-y-2 flex-grow overflow-y-auto mb-4 pr-2 -mr-2 custom-scrollbar svelte-1as78wz">`;
  if (data?.tasks && data.tasks.length > 0) {
    $$payload.out += "<!--[-->";
    const each_array = ensure_array_like(data.tasks);
    $$payload.out += `<!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let task = each_array[$$index];
      $$payload.out += `<form method="POST" action="?/toggleTask"${attr_class(`flex justify-between items-center rounded-lg px-4 py-2 shadow-xs ${"bg-white border-gray-200"}`, "svelte-1as78wz")}><input type="hidden" name="id"${attr("value", task.id)} class="svelte-1as78wz"> <div class="flex items-center gap-2 flex-grow mr-2 overflow-hidden svelte-1as78wz"><input type="checkbox" name="isCompleted"${attr("checked", task.isCompleted, true)} class="rounded border-gray-300 dark:border-zinc-600 text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 h-4 w-4 flex-shrink-0 cursor-pointer bg-white dark:bg-zinc-700 checked:bg-blue-600 dark:checked:bg-blue-500 svelte-1as78wz"${attr("aria-label", `Mark task ${task.isCompleted ? "incomplete" : "complete"}`)}> <span${attr_class(`font-medium text-sm truncate ${"text-gray-800"}`, "svelte-1as78wz", {
        "line-through": task.isCompleted,
        "text-gray-500": task.isCompleted && true,
        "text-zinc-400": task.isCompleted && isDarkMode
      })}${attr("title", task.description)}>${escape_html(task.description)}</span> `;
      if (task.dueDate) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<span${attr_class(`text-xs flex-shrink-0 ml-auto ${"text-gray-400"}`, "svelte-1as78wz")}>Due: ${escape_html(new Date(task.dueDate).toLocaleDateString())}</span>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--></div></form>`;
    }
    $$payload.out += `<!--]-->`;
  } else if (data?.tasks) {
    $$payload.out += "<!--[1-->";
    $$payload.out += `<p${attr_class(`italic text-sm ${"text-gray-500"}`, "svelte-1as78wz")}>${escape_html(noTasksTodayMessage)}</p>`;
  } else if (!data?.error) {
    $$payload.out += "<!--[2-->";
    $$payload.out += `<p${attr_class(`italic text-sm ${"text-gray-500"}`, "svelte-1as78wz")}>Loading tasks...</p>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> <a href="/tasks"${attr_class(`text-sm hover:underline mt-auto pt-2 flex-shrink-0 ${"text-blue-600"}`, "svelte-1as78wz")}>View all tasks</a> `;
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<button type="button" class="absolute bottom-4 right-4 bg-blue-600 text-white rounded-full p-2.5 w-10 h-10 flex items-center justify-center shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150 ease-in-out z-20 transform hover:scale-105 svelte-1as78wz" aria-label="Add New Task"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 svelte-1as78wz"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" class="svelte-1as78wz"></path></svg></button>`;
  }
  $$payload.out += `<!--]--></div></section> <section${attr_class(`notes-section rounded-lg p-4 flex flex-col justify-between relative shadow-sm ${"bg-white border border-gray-200"}`, "svelte-1as78wz")}><div class="flex justify-between items-center mb-3 flex-shrink-0 svelte-1as78wz"><h2${attr_class(`text-lg font-semibold ${"text-gray-700"}`, "svelte-1as78wz")}>Notes</h2> <div class="flex items-center gap-1 svelte-1as78wz"><button type="button"${attr("disabled", isRefreshingTasks, true)}${attr_class(`p-1 rounded-full disabled:opacity-50 disabled:cursor-wait transition-colors ${"hover:bg-gray-200 text-gray-500"}`, "svelte-1as78wz")} aria-label="Refresh Data">`;
  {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 svelte-1as78wz" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" class="svelte-1as78wz"></path></svg>`;
  }
  $$payload.out += `<!--]--></button></div></div> <div class="flex-grow overflow-y-auto mb-4 pr-2 -mr-2 custom-scrollbar svelte-1as78wz">`;
  if (data?.error && !data?.notes) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<p${attr_class(`italic text-sm text-red-500`, "svelte-1as78wz")}>Error loading notes: ${escape_html(data.error)}</p>`;
  } else if (data?.notes && data.notes.length > 0) {
    $$payload.out += "<!--[1-->";
    const each_array_1 = ensure_array_like(data.notes);
    $$payload.out += `<div class="space-y-3 svelte-1as78wz"><!--[-->`;
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let note = each_array_1[$$index_1];
      $$payload.out += `<div${attr_class(`rounded-lg p-3 flex justify-between items-start group relative shadow-xs ${"bg-white border-gray-200"}`, "svelte-1as78wz")}><div class="flex-grow pr-2 overflow-hidden svelte-1as78wz"><h3${attr_class(`font-semibold text-base truncate ${"text-gray-800"}`, "svelte-1as78wz")}>${escape_html(note.title)}</h3> `;
      if (expandedNoteId !== note.id) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<p${attr_class(`text-sm truncate mt-1 ${"text-gray-600"}`, "svelte-1as78wz")}>${escape_html(note.content)}</p>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--> `;
      if (expandedNoteId === note.id) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="mt-2 space-y-1 svelte-1as78wz"><p${attr_class(`text-sm whitespace-pre-wrap break-words ${"text-gray-700"}`, "svelte-1as78wz")}>${escape_html(note.content)}</p> `;
        if (note.createdAt) {
          $$payload.out += "<!--[-->";
          $$payload.out += `<p${attr_class(`text-xs pt-1 ${"text-gray-400"}`, "svelte-1as78wz")}>Created: ${escape_html(new Date(note.createdAt).toLocaleString())}</p>`;
        } else {
          $$payload.out += "<!--[!-->";
        }
        $$payload.out += `<!--]--></div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--></div> <div class="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 svelte-1as78wz"><button type="button"${attr_class(`p-1 rounded ${"hover:bg-gray-200 text-gray-500"}`, "svelte-1as78wz")} aria-label="Edit Note"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 svelte-1as78wz" aria-hidden="true"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" class="svelte-1as78wz"></path><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" class="svelte-1as78wz"></path></svg></button> <button type="button"${attr_class(`p-1 rounded ${"hover:bg-gray-200 text-gray-500"}`, "svelte-1as78wz")}${attr("aria-label", expandedNoteId === note.id ? "Collapse Note" : "Expand Note")}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 transition-transform duration-200 svelte-1as78wz" aria-hidden="true"${attr_style("", {
        transform: expandedNoteId === note.id ? "rotate(180deg)" : "rotate(0deg)"
      })}><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.29a.75.75 0 01.02-1.06z" clip-rule="evenodd" class="svelte-1as78wz"></path></svg></button></div></div>`;
    }
    $$payload.out += `<!--]--></div>`;
  } else if (data?.notes) {
    $$payload.out += "<!--[2-->";
    $$payload.out += `<p${attr_class(`italic text-sm ${"text-gray-500"}`, "svelte-1as78wz")}>No notes yet. Click the '+' to add one!</p>`;
  } else if (!data?.error) {
    $$payload.out += "<!--[3-->";
    $$payload.out += `<p${attr_class(`italic text-sm ${"text-gray-500"}`, "svelte-1as78wz")}>Loading notes...</p>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> `;
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<button type="button" class="absolute bottom-4 right-4 bg-blue-600 text-white rounded-full p-2.5 w-10 h-10 flex items-center justify-center shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150 ease-in-out z-20 transform hover:scale-105 svelte-1as78wz" aria-label="Add New Note"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 svelte-1as78wz"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" class="svelte-1as78wz"></path></svg></button>`;
  }
  $$payload.out += `<!--]--></section></main> <div id="aiChatToggle" class="fixed bottom-10 right-16 w-16 h-16 cursor-pointer z-40 transition-opacity duration-200 svelte-1as78wz"><button class="w-full h-full bg-purple-600 rounded-full shadow-lg flex items-center justify-center hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transform hover:scale-105 transition-all duration-150 svelte-1as78wz" aria-label="Toggle AI Chat"><img src="/Ai.png" alt="Ask Synthia AI" class="w-9 h-9 svelte-1as78wz"></button> <div id="aiSpeechBubble" class="ai-speech-bubble svelte-1as78wz"></div></div> <div id="aiChatWindow"${attr_class(`fixed transition-all duration-300 ease-in-out rounded-lg shadow-xl hidden z-[70] flex flex-col overflow-hidden ${"bg-white border-gray-200 text-gray-800"}`, "svelte-1as78wz")} style="bottom: 100px; left: 16px; width: 380px; height: 480px; max-width: 90vw; max-height: calc(100vh - 120px);"><div id="aiExpandedLogo" class="hidden absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none svelte-1as78wz"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-48 h-48 sm:w-64 sm:h-64 svelte-1as78wz" aria-hidden="true"><path d="M12.001 2.504a2.34 2.34 0 00-2.335 2.335v.583c0 .582.212 1.13.582 1.556l.03.035-.03.034a2.34 2.34 0 00-2.917 3.916A3.287 3.287 0 004.08 14.25a3.287 3.287 0 003.287 3.287h8.266a3.287 3.287 0 003.287-3.287 3.287 3.287 0 00-1.253-2.583 2.34 2.34 0 00-2.917-3.916l-.03-.034.03-.035c.37-.425.582-.973.582-1.555v-.583a2.34 2.34 0 00-2.335-2.336h-.002zM9.75 12.75a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5z" class="svelte-1as78wz"></path><path fill-rule="evenodd" d="M12 1.5c5.79 0 10.5 4.71 10.5 10.5S17.79 22.5 12 22.5 1.5 17.79 1.5 12 6.21 1.5 12 1.5zM2.85 12a9.15 9.15 0 019.15-9.15 9.15 9.15 0 019.15 9.15 9.15 9.15 0 01-9.15 9.15A9.15 9.15 0 012.85 12z" clip-rule="evenodd" class="svelte-1as78wz"></path></svg></div> <div id="aiChatHeader"${attr_class(`flex justify-between items-center px-3 py-2 border-b flex-shrink-0 ${"bg-gray-50 border-gray-200"}`, "svelte-1as78wz")}><div class="w-8 svelte-1as78wz"></div> <span class="text-sm font-semibold flex-grow text-center svelte-1as78wz">Ask Synthia</span> <div class="flex items-center svelte-1as78wz"><button id="closeChat"${attr_class(`p-1.5 rounded-md ${"hover:bg-gray-200 text-gray-500"}`, "svelte-1as78wz")} aria-label="Close Chat"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 svelte-1as78wz"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" class="svelte-1as78wz"></path></svg></button></div></div> <div class="flex-1 flex flex-col p-4 space-y-3 overflow-y-auto custom-scrollbar svelte-1as78wz" id="chatMessages"><div class="initial-prompt w-full h-full flex flex-col justify-center items-center text-center svelte-1as78wz"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-16 h-16 mb-4 opacity-50 svelte-1as78wz" aria-hidden="true"><path d="M12.001 2.504a2.34 2.34 0 00-2.335 2.335v.583c0 .582.212 1.13.582 1.556l.03.035-.03.034a2.34 2.34 0 00-2.917 3.916A3.287 3.287 0 004.08 14.25a3.287 3.287 0 003.287 3.287h8.266a3.287 3.287 0 003.287-3.287 3.287 3.287 0 00-1.253-2.583 2.34 2.34 0 00-2.917-3.916l-.03-.034.03-.035c.37-.425.582-.973.582-1.555v-.583a2.34 2.34 0 00-2.335-2.336h-.002zM9.75 12.75a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5z" class="svelte-1as78wz"></path><path fill-rule="evenodd" d="M12 1.5c5.79 0 10.5 4.71 10.5 10.5S17.79 22.5 12 22.5 1.5 17.79 1.5 12 6.21 1.5 12 1.5zM2.85 12a9.15 9.15 0 019.15-9.15 9.15 9.15 0 019.15 9.15 9.15 9.15 0 01-9.15 9.15A9.15 9.15 0 012.85 12z" clip-rule="evenodd" class="svelte-1as78wz"></path></svg> <h2 class="text-lg font-semibold mb-3 initial-prompt-title svelte-1as78wz">How can I help?</h2></div></div> <div${attr_class(`px-4 py-3 border-t flex-shrink-0 ${"bg-gray-50 border-gray-200"}`, "svelte-1as78wz")}><div class="relative flex items-center svelte-1as78wz"><input id="chatInput" type="text" placeholder="Ask anything..."${attr_class(`w-full rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm pr-10 flex-grow ${"bg-white border-gray-300 text-gray-800 placeholder-gray-400"}`, "svelte-1as78wz")}> <button id="sendChat" class="absolute right-1.5 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-2 svelte-1as78wz" aria-label="Send Message"><svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" class="w-4 h-4 svelte-1as78wz"><path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z" class="svelte-1as78wz"></path></svg></button></div></div> <div id="resizeHandle" class="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-10 svelte-1as78wz"></div></div></div></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div>`;
  bind_props($$props, { data });
  pop();
}
export {
  _page as default
};
