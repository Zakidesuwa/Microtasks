import { O as attr_class, F as escape_html, N as attr, P as ensure_array_like, I as stringify, G as bind_props, B as pop, z as push } from "../../../chunks/index.js";
import { o as onDestroy } from "../../../chunks/index-server.js";
import "../../../chunks/client.js";
import { h as html } from "../../../chunks/html.js";
function _page($$payload, $$props) {
  push();
  let tasks, loadError, username;
  let data = $$props["data"];
  let form = $$props["form"];
  let isSubmitting = false;
  let isToggleCompleting = {};
  let shouldShowOtherTasksTitle = false;
  let viewingDateInput = null;
  let clientFilterFromDate = data.filterFromDate ?? null;
  let clientFilterToDate = data.filterToDate ?? null;
  let searchQuery = "";
  let actionError = void 0;
  let pageActionError = void 0;
  let pageActionSuccessMessage = void 0;
  let messageTimeoutId;
  let noTasksInViewMessage = "No tasks for this view. Time to relax or plan ahead!";
  const encouragingMessages = [
    "Great things start with small tasks!",
    "Let's organize and conquer!",
    "Ready to make some progress?",
    "Add a task and let's get started!",
    "One task at a time builds momentum.",
    "Your future self will thank you for these tasks.",
    "What's next on the agenda?",
    "No tasks in this view! Enjoy the moment or plan your next big win.",
    "Looks clear here! A perfect opportunity to strategize or take a breather.",
    "Zero tasks? Maybe it's a sign to explore a new idea or learn something new.",
    "Your schedule for this view is empty. Embrace the freedom or fill it with purpose!",
    "All clear! Time to celebrate small victories or set new goals.",
    "A blank slate! What amazing thing will you decide to do next?",
    "No tasks looming. Use this calm to recharge or create something new.",
    "This space is open! What will you fill it with? Adventure? Learning? Rest?",
    "Task list clear! Perhaps it's time for that coffee break you've been thinking about.",
    "An empty list means you're either super efficient or it's time to dream big!",
    "Nothing to see here (task-wise). Seize the day in other ways!",
    "Well done on clearing your tasks for this view, or perhaps it's a fresh start!",
    "The coast is clear! What's your next move, captain?",
    "No tasks in sight. Perfect for a moment of mindfulness or a burst of creativity.",
    "Your task list is looking spotless for this view. What's your next focus?"
  ];
  function getRandomMessage() {
    return encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
  }
  let tasksForSelectedDate = [];
  let otherTasksToList = [];
  let selectedDateDisplayTitle = "Due Today";
  function getTodaysDateISO() {
    const today = /* @__PURE__ */ new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  }
  function formatDisplayDate(dateStr) {
    if (typeof dateStr !== "string" || dateStr.indexOf("-") === -1) {
      return dateStr || (viewingDateInput === null ? "Today" : "");
    }
    try {
      const parts = dateStr.split("-").map(Number);
      if (parts.length === 3 && !parts.some(isNaN) && parts[1] >= 1 && parts[1] <= 12 && parts[2] >= 1 && parts[2] <= 31) {
        const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
        if (dateObj.getFullYear() === parts[0] && dateObj.getMonth() === parts[1] - 1 && dateObj.getDate() === parts[2]) {
          return dateObj.toLocaleDateString(void 0, {
            month: "long",
            day: "numeric",
            year: "numeric"
          });
        }
      }
      return dateStr;
    } catch (e) {
      console.error("Error formatting display date:", e);
      return dateStr;
    }
  }
  function showPageMessage(message, isError = false, duration = 4e3) {
    if (isError) pageActionError = message;
    else pageActionSuccessMessage = message;
    if (messageTimeoutId) clearTimeout(messageTimeoutId);
    messageTimeoutId = window.setTimeout(
      () => {
        pageActionError = void 0;
        pageActionSuccessMessage = void 0;
      },
      duration
    );
  }
  let selectedTaskIds = /* @__PURE__ */ new Set();
  function formatDateTimeDisplay(isoDateString, dueTime = null) {
    if (!isoDateString) return "N/A";
    try {
      const datePartOnly = isoDateString.substring(0, 10);
      const [year, month, day] = datePartOnly.split("-").map(Number);
      const displayDate = new Date(year, month - 1, day);
      const dateFormatted = displayDate.toLocaleDateString(void 0, {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
      if (dueTime && dueTime.includes(":")) {
        let [hoursStr, minutesStr] = dueTime.split(":");
        let hours = parseInt(hoursStr, 10), minutes = parseInt(minutesStr, 10);
        if (isNaN(hours) || isNaN(minutes)) return dateFormatted;
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;
        return `${dateFormatted} ${hours}:${minutes < 10 ? "0" : ""}${minutes} ${ampm}`;
      }
      return dateFormatted;
    } catch (e) {
      return "Invalid Date";
    }
  }
  function formatPriorityDisplay(priority) {
    const priorityValue = priority ? String(priority).toLowerCase() : "na";
    let displayClass = "priority-tag";
    let displayText = "";
    switch (priorityValue) {
      case "low":
        displayClass += " priority-low";
        displayText = "LOW";
        break;
      case "standard":
        displayClass += " priority-standard";
        displayText = "STANDARD";
        break;
      case "high":
        displayClass += " priority-high";
        displayText = "HIGH";
        break;
      default:
        displayClass += " priority-na";
        displayText = "N/A";
        break;
    }
    return `<span class="${displayClass}">${displayText}</span>`;
  }
  onDestroy(() => {
    if (messageTimeoutId) clearTimeout(messageTimeoutId);
  });
  tasks = data?.tasks ?? [];
  loadError = data?.error;
  username = data?.user?.name || "User";
  {
    const todayISO = getTodaysDateISO();
    let primaryTaskList = [];
    let secondaryTaskList = [];
    let tasksToProcess = tasks;
    const trimmedSearchQuery = searchQuery.trim();
    if (trimmedSearchQuery !== "") {
      const lowerSearchQuery = trimmedSearchQuery.toLowerCase();
      tasksToProcess = tasks.filter((task) => {
        const titleMatch = task.title.toLowerCase().includes(lowerSearchQuery);
        const descriptionMatch = task.description && task.description.toLowerCase().includes(lowerSearchQuery);
        let dueDateMatch = false;
        if (task.dueDateISO) {
          if (task.dueDateISO.toLowerCase().includes(lowerSearchQuery)) dueDateMatch = true;
          try {
            const dateObj = new Date(task.dueDateISO);
            if (dateObj.toLocaleDateString(void 0, {
              year: "numeric",
              month: "long",
              day: "numeric"
            }).toLowerCase().includes(lowerSearchQuery)) dueDateMatch = true;
            if (dateObj.toLocaleDateString(void 0, { month: "short", day: "numeric" }).toLowerCase().includes(lowerSearchQuery)) dueDateMatch = true;
          } catch (e) {
          }
        }
        return titleMatch || descriptionMatch || dueDateMatch;
      });
    }
    const isDateRangeFilterActive = !!(clientFilterFromDate || clientFilterToDate);
    if (isDateRangeFilterActive) {
      const from = clientFilterFromDate ? (/* @__PURE__ */ new Date(clientFilterFromDate + "T00:00:00Z")).getTime() : -Infinity;
      const to = clientFilterToDate ? (/* @__PURE__ */ new Date(clientFilterToDate + "T23:59:59Z")).getTime() : Infinity;
      if (tasksToProcess && tasksToProcess.length > 0) {
        primaryTaskList = tasksToProcess.filter((task) => {
          if (!task.dueDateISO) return false;
          try {
            const taskDueDate = new Date(task.dueDateISO).getTime();
            return taskDueDate >= from && taskDueDate <= to;
          } catch (e) {
            return false;
          }
        });
        const primaryTaskIds = new Set(primaryTaskList.map((t) => t.id));
        secondaryTaskList = tasksToProcess.filter((task) => !primaryTaskIds.has(task.id));
      }
      let title = "Tasks ";
      if (clientFilterFromDate && clientFilterToDate) title = `Due from ${formatDisplayDate(clientFilterFromDate)} to ${formatDisplayDate(clientFilterToDate)}`;
      else if (clientFilterFromDate) title = `Due on or after ${formatDisplayDate(clientFilterFromDate)}`;
      else if (clientFilterToDate) title = `Due on or before ${formatDisplayDate(clientFilterToDate)}`;
      selectedDateDisplayTitle = title;
      viewingDateInput = null;
    } else {
      const targetDateFilter = viewingDateInput || todayISO;
      if (tasksToProcess && tasksToProcess.length > 0) {
        primaryTaskList = tasksToProcess.filter((task) => task.dueDateISO && task.dueDateISO.startsWith(targetDateFilter));
        const primaryTaskIds = new Set(primaryTaskList.map((t) => t.id));
        secondaryTaskList = tasksToProcess.filter((task) => !primaryTaskIds.has(task.id));
      }
      if (viewingDateInput) selectedDateDisplayTitle = viewingDateInput === todayISO ? "Due Today" : `Due ${formatDisplayDate(viewingDateInput)}`;
      else selectedDateDisplayTitle = "Due Today";
    }
    const sortTasks = (taskArray) => {
      return [...taskArray].sort((a, b) => {
        let valA, valB;
        {
          valA = a.dueDateISO ? new Date(a.dueDateISO).getTime() : 0;
          valB = b.dueDateISO ? new Date(b.dueDateISO).getTime() : 0;
          if (!a.dueDateISO) valA = Infinity;
          if (!b.dueDateISO) valB = Infinity;
        }
        if (valA < valB) return -1;
        if (valA > valB) return 1;
        return 0;
      });
    };
    tasksForSelectedDate = sortTasks(primaryTaskList);
    otherTasksToList = sortTasks(secondaryTaskList);
    if (tasksForSelectedDate.length === 0 && !loadError && !pageActionError && true) {
      if (trimmedSearchQuery !== "") {
        let baseMsg = `No tasks match your search: "${trimmedSearchQuery}"`;
        if (isDateRangeFilterActive || viewingDateInput) baseMsg += ` for ${selectedDateDisplayTitle.toLowerCase().replace(/^due /i, "")}.`;
        else baseMsg += ` for today.`;
        noTasksInViewMessage = baseMsg;
      } else if (isDateRangeFilterActive || viewingDateInput) {
        noTasksInViewMessage = `No tasks found for ${selectedDateDisplayTitle.toLowerCase().replace(/^due /i, "")}. Try a different date or clear filters.`;
      } else {
        noTasksInViewMessage = getRandomMessage();
      }
    }
    shouldShowOtherTasksTitle = viewingDateInput !== null || tasksForSelectedDate.length > 0 || clientFilterFromDate !== null || clientFilterToDate !== null;
  }
  {
    if (form) {
      actionError = void 0;
      if (form.type === "failure") {
        const formErrors = form.data;
        let errorMessageToShow = void 0;
        if (formErrors?.taskForm?.error) errorMessageToShow = formErrors.taskForm.error;
        else if (formErrors?.deleteTaskForm?.error) errorMessageToShow = formErrors.deleteTaskForm.error;
        else if (formErrors?.batchDeleteForm?.error) errorMessageToShow = formErrors.batchDeleteForm.error;
        else if (formErrors?.toggleCompleteForm?.error) errorMessageToShow = formErrors.toggleCompleteForm.error;
        else if (formErrors?.error) errorMessageToShow = formErrors.error;
        if (errorMessageToShow && !actionError) showPageMessage(errorMessageToShow, true);
        else if (!actionError && !errorMessageToShow && Object.keys(formErrors || {}).length > 0) showPageMessage("An unknown error occurred.", true);
      } else if (form.type === "success") {
        const formSuccessData = form.data;
        if (formSuccessData?.taskForm?.message) showPageMessage(formSuccessData.taskForm.message);
        else if (formSuccessData?.deleteTaskForm?.successMessage) showPageMessage(formSuccessData.deleteTaskForm.successMessage);
        else if (formSuccessData?.toggleCompleteForm?.successMessage) showPageMessage(formSuccessData.toggleCompleteForm.successMessage, false, 2500);
      }
    }
  }
  $$payload.out += `<form method="POST" action="?/deleteTask" style="display: none;"><input type="hidden" name="taskId"></form> <form method="POST" action="?/batchDeleteTasks" style="display: none;"></form> <form method="POST" action="?/toggleComplete" style="display: none;"><input type="hidden" name="taskId"> <input type="hidden" name="isCompleted"></form> <div class="app-container svelte-ws8oy"><header class="top-header svelte-ws8oy"><div class="header-left svelte-ws8oy"><button id="hamburgerButton" class="menu-btn svelte-ws8oy" aria-label="Toggle Sidebar"><img src="/Hamburger.png" alt="Menu" class="w-6 h-6 svelte-ws8oy"></button> <a href="/home" class="logo svelte-ws8oy"><img src="/logonamin.png" alt="Microtask Logo" class="svelte-ws8oy"> <span${attr_class(`${"text-gray-800"}`, "svelte-ws8oy")}>Microtask</span></a></div> <div class="header-icons svelte-ws8oy"><div class="relative svelte-ws8oy"><button id="bellIcon" aria-label="Notifications" class="svelte-ws8oy"><img src="/Bell.png" alt="Notifications" class="svelte-ws8oy"></button> <div id="notifWindow"${attr_class(`dropdown-window hidden ${"bg-white border-gray-200 text-gray-700"}`, "svelte-ws8oy")}><h3 class="font-semibold mb-2 text-sm svelte-ws8oy">Notifications</h3><p class="text-xs svelte-ws8oy">No new notifications.</p></div></div> <div class="relative svelte-ws8oy"><button id="helpIcon" aria-label="Help &amp; FAQ" class="svelte-ws8oy"><img src="/Question.png" alt="FAQ" class="svelte-ws8oy"></button> <div id="helpWindow"${attr_class(`dropdown-window hidden ${"bg-white border-gray-200 text-gray-700"}`, "svelte-ws8oy")}><h3 class="font-semibold mb-2 text-sm svelte-ws8oy">FAQ</h3> <ul class="list-disc list-inside space-y-1 text-xs"><li class="svelte-ws8oy">How do I add a task?</li><li class="svelte-ws8oy">Where is the calendar?</li></ul> <a href="/support" class="text-xs text-blue-600 hover:underline mt-2 block svelte-ws8oy">Visit Support</a></div></div> <div class="relative svelte-ws8oy"><button id="profileIcon" aria-label="Profile Menu" class="svelte-ws8oy"><img src="/Profile.png" alt="Profile" class="svelte-ws8oy"></button> <div id="profileWindow"${attr_class(`dropdown-window hidden ${"bg-white border-gray-200 text-gray-700"}`, "svelte-ws8oy")}><h3 class="font-semibold mb-2 text-sm svelte-ws8oy">Profile</h3> <p class="text-xs mb-2 truncate svelte-ws8oy">Welcome, ${escape_html(username || "User")}!</p> <form method="POST" action="?/logout"><button type="submit"${attr_class(`text-xs px-2 py-1.5 rounded w-full text-left transition-colors duration-150 ${"bg-red-100 hover:bg-red-200 text-red-700"}`, "svelte-ws8oy")}>Logout</button></form></div></div> <button id="darkModeToggle" aria-label="Toggle Dark Mode"${attr_class(`ml-2 p-1.5 rounded-full transition-colors duration-150 ${"hover:bg-gray-100 text-gray-700"}`, "svelte-ws8oy")}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 svelte-ws8oy">`;
  {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<path fill-rule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM12 16.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Z" clip-rule="evenodd"></path>`;
  }
  $$payload.out += `<!--]--></svg></button></div></header> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <main class="main-content svelte-ws8oy"><div class="page-title-header svelte-ws8oy"><h1 class="svelte-ws8oy">Here are all of the tasks you have:</h1></div> <div class="content-header task-list-header svelte-ws8oy"><button class="today-btn svelte-ws8oy">TODAY</button> <div class="search-bar svelte-ws8oy"><img src="/Search.png" alt="Search Icon" class="svelte-ws8oy"> <input type="search" placeholder="Search all tasks..."${attr("value", searchQuery)} class="svelte-ws8oy"></div> <div class="filter-buttons svelte-ws8oy"><button class="filter-btn svelte-ws8oy">+ Add Task</button> <button class="filter-btn svelte-ws8oy">Day `;
  if (viewingDateInput !== null) {
    $$payload.out += "<!--[-->";
    $$payload.out += `*`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></button> <div class="relative svelte-ws8oy"><button id="sortButton" class="filter-btn svelte-ws8oy">Sort `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></button> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> <button class="filter-btn svelte-ws8oy">Filter `;
  if (clientFilterFromDate || clientFilterToDate) {
    $$payload.out += "<!--[-->";
    $$payload.out += `*`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></button></div></div> `;
  if (loadError) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="message error-message svelte-ws8oy" role="alert"><strong>Error loading tasks:</strong> ${escape_html(loadError)}</div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (pageActionError) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="message error-message svelte-ws8oy" role="alert">${escape_html(pageActionError)}</div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (pageActionSuccessMessage && true) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="message success-message svelte-ws8oy" role="status">${escape_html(pageActionSuccessMessage)}</div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="task-list-area svelte-ws8oy">`;
  if (selectedTaskIds.size > 0 && (tasksForSelectedDate.length > 0 || otherTasksToList.length > 0)) {
    $$payload.out += "<!--[1-->";
    $$payload.out += `<div class="batch-actions-bar svelte-ws8oy"><span class="svelte-ws8oy">${escape_html(selectedTaskIds.size)} task(s) selected</span> <button type="button" class="batch-delete-btn svelte-ws8oy"${attr("disabled", isSubmitting, true)}>Delete Selected</button></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="todays-tasks-section svelte-ws8oy"><h2 class="tasks-section-title svelte-ws8oy">${escape_html(selectedDateDisplayTitle)} `;
  if (searchQuery.trim() !== "") {
    $$payload.out += "<!--[-->";
    $$payload.out += `<span style="font-weight: normal; font-size: 0.8em; color: #555;">(Search: "${escape_html(searchQuery.trim())}")</span>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></h2> `;
  if (tasksForSelectedDate.length > 0) {
    $$payload.out += "<!--[-->";
    const each_array = ensure_array_like(tasksForSelectedDate);
    $$payload.out += `<div class="task-table-container svelte-ws8oy"><table class="task-table svelte-ws8oy"><thead><tr><th class="checkbox-column svelte-ws8oy"></th><th class="task-details-column svelte-ws8oy">TASK</th><th class="svelte-ws8oy">CREATED</th><th class="svelte-ws8oy">PRIORITY</th><th class="svelte-ws8oy">DUE</th><th class="svelte-ws8oy">STATUS</th><th class="actions-column svelte-ws8oy">ACTIONS</th></tr></thead><tbody class="svelte-ws8oy"><!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let task = each_array[$$index];
      $$payload.out += `<tr${attr_class("svelte-ws8oy", void 0, { "selected": selectedTaskIds.has(task.id) })}><td class="checkbox-column svelte-ws8oy"><input type="checkbox" class="task-checkbox svelte-ws8oy"${attr("aria-label", `Select task ${stringify(task.title)}`)}${attr("checked", selectedTaskIds.has(task.id), true)}></td><td class="task-details-column svelte-ws8oy"><div class="task-title svelte-ws8oy">${escape_html(task.title)}</div>`;
      if (task.description) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="task-description svelte-ws8oy">${escape_html(task.description)}</div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--></td><td class="svelte-ws8oy">${escape_html(formatDateTimeDisplay(task.createdAtISO))}</td><td class="svelte-ws8oy">${html(formatPriorityDisplay(task.priority))}</td><td class="svelte-ws8oy">${escape_html(formatDateTimeDisplay(task.dueDateISO, task.dueTime))}</td><td class="svelte-ws8oy"><span${attr_class(`status status-${stringify(task.status.replace(" ", "-"))}`, "svelte-ws8oy")}>${escape_html(task.status)}</span></td><td class="actions-column svelte-ws8oy"><button type="button" class="action-btn toggle-complete-btn svelte-ws8oy"${attr("aria-label", task.isCompleted ? "Mark task as not complete" : "Mark task as complete")}${attr("title", task.isCompleted ? "Unmark as complete" : "Mark as complete")}${attr("disabled", isToggleCompleting[task.id], true)}>`;
      if (isToggleCompleting[task.id]) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<svg class="animate-spin svelte-ws8oy" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M21 12a9 9 0 11-6.219-8.56"></path></svg>`;
      } else if (task.isCompleted) {
        $$payload.out += "<!--[1-->";
        $$payload.out += `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#4CAF50" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="completed-icon svelte-ws8oy"><circle cx="12" cy="12" r="9"></circle></svg>`;
      } else {
        $$payload.out += "<!--[!-->";
        $$payload.out += `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="not-completed-icon svelte-ws8oy"><circle cx="12" cy="12" r="9"></circle></svg>`;
      }
      $$payload.out += `<!--]--></button> <button type="button" class="action-btn edit-btn svelte-ws8oy"${attr("aria-label", `Edit task: ${stringify(task.title)}`)}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" class="svelte-ws8oy"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button> <button type="button" class="action-btn delete-btn svelte-ws8oy"${attr("aria-label", `Delete task: ${stringify(task.title)}`)}><svg width="18" height="18" viewBox="0 0 24 24" class="svelte-ws8oy"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button></td></tr>`;
    }
    $$payload.out += `<!--]--></tbody></table></div>`;
  } else if (tasksForSelectedDate.length === 0 && !loadError && !pageActionError && true) {
    $$payload.out += "<!--[1-->";
    $$payload.out += `<div class="no-tasks-message svelte-ws8oy" style="padding: 20px 15px; text-align: center;"><p>${escape_html(noTasksInViewMessage)}</p></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> `;
  if (otherTasksToList.length > 0) {
    $$payload.out += "<!--[-->";
    const each_array_1 = ensure_array_like(otherTasksToList);
    $$payload.out += `<div class="other-tasks-section svelte-ws8oy"><h2 class="tasks-section-title svelte-ws8oy">${escape_html(shouldShowOtherTasksTitle ? "Other Tasks" : "Tasks")} `;
    if (searchQuery.trim() !== "" && !shouldShowOtherTasksTitle) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<span style="font-weight: normal; font-size: 0.8em; color: #555;">(Search: "${escape_html(searchQuery.trim())}")</span>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></h2> <div class="task-table-container svelte-ws8oy"><table class="task-table svelte-ws8oy"><thead><tr><th class="checkbox-column svelte-ws8oy"></th><th class="task-details-column svelte-ws8oy">TASK</th><th class="svelte-ws8oy">CREATED</th><th class="svelte-ws8oy">PRIORITY</th><th class="svelte-ws8oy">DUE</th><th class="svelte-ws8oy">STATUS</th><th class="actions-column svelte-ws8oy">ACTIONS</th></tr></thead><tbody class="svelte-ws8oy"><!--[-->`;
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let task = each_array_1[$$index_1];
      $$payload.out += `<tr${attr_class("svelte-ws8oy", void 0, { "selected": selectedTaskIds.has(task.id) })}><td class="checkbox-column svelte-ws8oy"><input type="checkbox" class="task-checkbox svelte-ws8oy"${attr("aria-label", `Select task ${stringify(task.title)}`)}${attr("checked", selectedTaskIds.has(task.id), true)}></td><td class="task-details-column svelte-ws8oy"><div class="task-title svelte-ws8oy">${escape_html(task.title)}</div>`;
      if (task.description) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="task-description svelte-ws8oy">${escape_html(task.description)}</div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--></td><td class="svelte-ws8oy">${escape_html(formatDateTimeDisplay(task.createdAtISO))}</td><td class="svelte-ws8oy">${html(formatPriorityDisplay(task.priority))}</td><td class="svelte-ws8oy">${escape_html(formatDateTimeDisplay(task.dueDateISO, task.dueTime))}</td><td class="svelte-ws8oy"><span${attr_class(`status status-${stringify(task.status.replace(" ", "-"))}`, "svelte-ws8oy")}>${escape_html(task.status)}</span></td><td class="actions-column svelte-ws8oy"><button type="button" class="action-btn toggle-complete-btn svelte-ws8oy"${attr("aria-label", task.isCompleted ? "Mark task as not complete" : "Mark task as complete")}${attr("title", task.isCompleted ? "Unmark as complete" : "Mark as complete")}${attr("disabled", isToggleCompleting[task.id], true)}>`;
      if (isToggleCompleting[task.id]) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<svg class="animate-spin svelte-ws8oy" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M21 12a9 9 0 11-6.219-8.56"></path></svg>`;
      } else if (task.isCompleted) {
        $$payload.out += "<!--[1-->";
        $$payload.out += `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#4CAF50" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="completed-icon svelte-ws8oy"><circle cx="12" cy="12" r="9"></circle></svg>`;
      } else {
        $$payload.out += "<!--[!-->";
        $$payload.out += `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="not-completed-icon svelte-ws8oy"><circle cx="12" cy="12" r="9"></circle></svg>`;
      }
      $$payload.out += `<!--]--></button> <button type="button" class="action-btn edit-btn svelte-ws8oy"${attr("aria-label", `Edit task: ${stringify(task.title)}`)}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" class="svelte-ws8oy"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button> <button type="button" class="action-btn delete-btn svelte-ws8oy"${attr("aria-label", `Delete task: ${stringify(task.title)}`)}><svg width="18" height="18" viewBox="0 0 24 24" class="svelte-ws8oy"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button></td></tr>`;
    }
    $$payload.out += `<!--]--></tbody></table></div></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (tasksForSelectedDate.length === 0 && otherTasksToList.length === 0 && !clientFilterFromDate && !clientFilterToDate && viewingDateInput === null && !loadError && !pageActionError && true) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="no-tasks-message svelte-ws8oy"><p>${escape_html(noTasksInViewMessage)}</p></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div></main></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]-->`;
  bind_props($$props, { data, form });
  pop();
}
export {
  _page as default
};
