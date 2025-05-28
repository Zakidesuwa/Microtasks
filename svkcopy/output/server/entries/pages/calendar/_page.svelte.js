import { J as store_get, P as ensure_array_like, O as attr_class, F as escape_html, N as attr, E as attr_style, I as stringify, K as unsubscribe_stores, G as bind_props, B as pop, z as push } from "../../../chunks/index.js";
import { t as tick } from "../../../chunks/index-server.js";
import { p as page } from "../../../chunks/stores.js";
import "../../../chunks/client.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let data = $$props["data"];
  let form = $$props["form"];
  let username = "User (Calendar Initial Default)";
  let greeting = "GOOD DAY";
  let eventFormActionError = null;
  let pageError = data.error || null;
  let currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  let currentMonth = (/* @__PURE__ */ new Date()).getMonth();
  let daysInMonth = [];
  let isLoadingCalendar = true;
  async function updateCalendarDays() {
    isLoadingCalendar = true;
    await tick();
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const newDaysInMonth = [];
    const firstDateOfMonth = new Date(currentYear, currentMonth, 1);
    const startingDayOfWeek = firstDateOfMonth.getDay();
    const daysInCurrentActualMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthEndDate = new Date(currentYear, currentMonth, 0);
    const daysInPrevMonth = prevMonthEndDate.getDate();
    for (let i = 0; i < startingDayOfWeek; i++) {
      const dayNum = daysInPrevMonth - startingDayOfWeek + 1 + i;
      const date = new Date(currentYear, currentMonth - 1, dayNum);
      date.setHours(0, 0, 0, 0);
      newDaysInMonth.push({
        dayNum,
        events: [],
        isCurrentMonth: false,
        isToday: date.getTime() === today.getTime(),
        date
      });
    }
    for (let i = 1; i <= daysInCurrentActualMonth; i++) {
      const currentDateObj = new Date(currentYear, currentMonth, i);
      currentDateObj.setHours(0, 0, 0, 0);
      const isTodayFlag = currentDateObj.getTime() === today.getTime();
      let eventsForThisDay = [];
      if (data.tasks && Array.isArray(data.tasks)) {
        data.tasks.forEach((task) => {
          if (task.dueDateISO) {
            const [taskYear, taskMonth, taskDay] = task.dueDateISO.split("-").map(Number);
            if (taskYear === currentDateObj.getFullYear() && taskMonth - 1 === currentDateObj.getMonth() && taskDay === currentDateObj.getDate()) {
              eventsForThisDay.push({
                id: task.id,
                title: task.title,
                description: task.description,
                deadlineTime: task.dueTime || void 0,
                color: task.color || "#10B981"
              });
            }
          }
        });
      }
      newDaysInMonth.push({
        dayNum: i,
        events: eventsForThisDay,
        isCurrentMonth: true,
        isToday: isTodayFlag,
        date: currentDateObj
      });
    }
    const totalCells = Math.ceil(newDaysInMonth.length / 7) * 7;
    let nextMonthDayCounter = 1;
    while (newDaysInMonth.length < totalCells) {
      const date = new Date(currentYear, currentMonth + 1, nextMonthDayCounter);
      date.setHours(0, 0, 0, 0);
      newDaysInMonth.push({
        dayNum: nextMonthDayCounter,
        events: [],
        isCurrentMonth: false,
        isToday: date.getTime() === today.getTime(),
        date
      });
      nextMonthDayCounter++;
    }
    daysInMonth = newDaysInMonth;
    isLoadingCalendar = false;
  }
  let successMessage = null;
  let successMessageTimeoutId;
  store_get($$store_subs ??= {}, "$page", page).url.pathname;
  {
    pageError = data.error || null;
  }
  {
    if (data.tasks) {
      updateCalendarDays();
    }
  }
  {
    if (form) {
      if (form.type === "failure" && form.data?.eventForm?.error) {
        eventFormActionError = form.data.eventForm.error;
      } else if (form.type === "success" && form.data?.eventForm?.success) {
        eventFormActionError = null;
        successMessage = form.data.eventForm.message || "Operation successful!";
        if (successMessageTimeoutId) clearTimeout(successMessageTimeoutId);
        successMessageTimeoutId = window.setTimeout(() => successMessage = null, 3e3);
      }
      form = null;
    }
  }
  const each_array = ensure_array_like([
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat"
  ]);
  $$payload.out += `<div${attr_class(`flex h-screen font-sans ${"bg-gray-100 text-gray-800"}`, "svelte-i7hfk6")}>`;
  if (pageError && !eventFormActionError) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-md z-[100] svelte-i7hfk6" role="alert"><strong class="font-bold svelte-i7hfk6">Error:</strong> <span class="block sm:inline svelte-i7hfk6">${escape_html(pageError)}</span> <button class="absolute top-0 bottom-0 right-0 px-4 py-3 svelte-i7hfk6" aria-label="Close error"><span class="text-xl svelte-i7hfk6">×</span></button></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (successMessage) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-md z-[100] svelte-i7hfk6" role="status"><span class="block sm:inline svelte-i7hfk6">${escape_html(successMessage)}</span> <button class="absolute top-0 bottom-0 right-0 px-4 py-3 svelte-i7hfk6" aria-label="Close success message"><span class="text-xl svelte-i7hfk6">×</span></button></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="flex-1 flex flex-col overflow-hidden svelte-i7hfk6"><header${attr_class(`top-header ${"bg-white border-gray-200"}`, "svelte-i7hfk6")}><div class="header-left svelte-i7hfk6"><button id="hamburgerButton" class="menu-btn svelte-i7hfk6" aria-label="Toggle Sidebar"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 svelte-i7hfk6"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" class="svelte-i7hfk6"></path></svg></button> <a href="/home" class="logo svelte-i7hfk6"><img src="/logonamin.png" alt="Microtask Logo" class="h-8 w-auto svelte-i7hfk6"> <span${attr_class(`${"text-gray-800"}`, "svelte-i7hfk6")}>Microtask</span></a></div> <div class="header-icons svelte-i7hfk6"><div class="relative svelte-i7hfk6"><button id="bellIcon" aria-label="Notifications" class="relative svelte-i7hfk6"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 svelte-i7hfk6" aria-hidden="true"><path fill-rule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0c-1.673-.253-3.287-.673-4.831-1.243a.75.75 0 01-.297-1.206C4.45 13.807 5.25 11.873 5.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0H9.752z" clip-rule="evenodd" class="svelte-i7hfk6"></path></svg></button> <div id="notifWindow"${attr_class(`dropdown-window hidden w-80 max-h-96 overflow-y-auto custom-scrollbar ${"bg-white border-gray-200 text-gray-700"}`, "svelte-i7hfk6")}><h3 class="font-semibold mb-2 text-sm svelte-i7hfk6">Notifications</h3> <p class="text-xs text-center py-4 svelte-i7hfk6">No new notifications.</p></div></div> <div class="relative svelte-i7hfk6"><button id="helpIcon" aria-label="Help &amp; FAQ" class="svelte-i7hfk6"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 svelte-i7hfk6" aria-hidden="true"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.042.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" class="svelte-i7hfk6"></path></svg></button> <div id="helpWindow"${attr_class(`dropdown-window hidden ${"bg-white border-gray-200 text-gray-700"}`, "svelte-i7hfk6")}><h3 class="font-semibold mb-2 text-sm svelte-i7hfk6">FAQ</h3><ul class="list-disc list-inside space-y-1 text-xs svelte-i7hfk6"><li class="svelte-i7hfk6">How do I add a task?</li><li class="svelte-i7hfk6">Where is the calendar?</li></ul><a href="/support" class="text-xs text-blue-600 hover:underline mt-2 block svelte-i7hfk6">Visit Support</a></div></div> <div class="relative svelte-i7hfk6"><button id="profileIcon" aria-label="Profile Menu" class="svelte-i7hfk6"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 svelte-i7hfk6" aria-hidden="true"><path fill-rule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clip-rule="evenodd" class="svelte-i7hfk6"></path></svg></button> <div id="profileWindow"${attr_class(`dropdown-window hidden ${"bg-white border-gray-200 text-gray-700"}`, "svelte-i7hfk6")}><h3 class="font-semibold mb-2 text-sm svelte-i7hfk6">Profile</h3> <p class="text-xs mb-2 truncate svelte-i7hfk6">Welcome, ${escape_html(username)}!</p> <button${attr_class(`text-xs px-2 py-1.5 rounded w-full text-left transition-colors duration-150 ${"bg-red-100 hover:bg-red-200 text-red-700"}`, "svelte-i7hfk6")}>Logout</button></div></div> <button id="darkModeToggle" aria-label="Toggle Dark Mode"${attr_class(`ml-2 p-1.5 rounded-full transition-colors duration-150 ${"hover:bg-gray-100 text-gray-700"}`, "svelte-i7hfk6")}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 svelte-i7hfk6">`;
  {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<path fill-rule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM12 16.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 010 9Z" clip-rule="evenodd" class="svelte-i7hfk6"></path>`;
  }
  $$payload.out += `<!--]--></svg></button></div></header> <div class="flex-1 overflow-y-auto pt-[60px] pb-4 flex flex-col svelte-i7hfk6"><div${attr_class(`w-full px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shadow-sm flex-shrink-0 border-b ${"bg-white text-gray-800 border-gray-200"}`, "svelte-i7hfk6")}><div class="flex items-center gap-3 svelte-i7hfk6"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-7 h-7 svelte-i7hfk6" aria-hidden="true"><path fill-rule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zM5.25 6.75c-.621 0-1.125.504-1.125 1.125V18a1.125 1.125 0 001.125 1.125h13.5A1.125 1.125 0 0019.875 18V7.875c0-.621-.504-1.125-1.125-1.125H5.25z" clip-rule="evenodd" class="svelte-i7hfk6"></path></svg> <span class="text-lg sm:text-xl font-semibold svelte-i7hfk6">Calendar</span></div> <button${attr_class(`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${"bg-blue-600 hover:bg-blue-700 text-white"}`, "svelte-i7hfk6")}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 svelte-i7hfk6"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" class="svelte-i7hfk6"></path></svg> Add Event</button></div> <div class="px-4 sm:px-6 mt-4 svelte-i7hfk6"><h1${attr_class(`text-xl sm:text-2xl font-semibold ${"text-gray-800"}`, "svelte-i7hfk6")}>${escape_html(greeting)}, <span${attr_class(`${"text-blue-600"}`, "svelte-i7hfk6")}>${escape_html(username.toUpperCase())}</span>!</h1> <p${attr_class(`text-sm mt-1 ${"text-gray-500"}`, "svelte-i7hfk6")}>Here is your monthly schedule.</p></div> <main class="px-4 sm:px-6 mt-4 flex-grow svelte-i7hfk6"><div${attr_class(`calendar-container w-full p-2 sm:p-4 rounded-lg shadow ${"bg-white border border-gray-200"}`, "svelte-i7hfk6")}><div class="flex justify-between items-center mb-4 px-1 svelte-i7hfk6"><button aria-label="Previous Month"${attr_class(`p-2 rounded-md transition-colors ${"hover:bg-gray-100 text-gray-600"}`, "svelte-i7hfk6")}><svg class="w-5 h-5 svelte-i7hfk6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" class="svelte-i7hfk6"></path></svg></button> <h2${attr_class(`text-lg sm:text-xl font-semibold ${"text-gray-800"}`, "svelte-i7hfk6")}>${escape_html(new Date(currentYear, currentMonth).toLocaleString("default", { month: "long" }))} ${escape_html(currentYear)}</h2> <button aria-label="Next Month"${attr_class(`p-2 rounded-md transition-colors ${"hover:bg-gray-100 text-gray-600"}`, "svelte-i7hfk6")}><svg class="w-5 h-5 svelte-i7hfk6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" class="svelte-i7hfk6"></path></svg></button></div> <div${attr_class(`grid grid-cols-7 gap-px text-center font-medium text-xs mb-1 ${"text-gray-500"}`, "svelte-i7hfk6")}><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let dayName = each_array[$$index];
    $$payload.out += `<div class="py-1 hidden sm:block svelte-i7hfk6">${escape_html(dayName.toUpperCase())}</div><div class="py-1 sm:hidden svelte-i7hfk6">${escape_html(dayName[0])}</div>`;
  }
  $$payload.out += `<!--]--></div> <div class="grid grid-cols-7 gap-px svelte-i7hfk6">`;
  if (isLoadingCalendar && daysInMonth.length === 0) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="col-span-7 text-center py-10 flex justify-center items-center min-h-[300px] svelte-i7hfk6"><svg${attr_class(`animate-spin h-8 w-8 ${"text-blue-600"}`, "svelte-i7hfk6")} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25 svelte-i7hfk6" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75 svelte-i7hfk6" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>`;
  } else if (daysInMonth.length > 0) {
    $$payload.out += "<!--[1-->";
    const each_array_1 = ensure_array_like(daysInMonth);
    $$payload.out += `<!--[-->`;
    for (let $$index_2 = 0, $$length = each_array_1.length; $$index_2 < $$length; $$index_2++) {
      let day = each_array_1[$$index_2];
      $$payload.out += `<div${attr_class(`p-1 sm:p-1.5 border min-h-[5rem] sm:min-h-[7rem] flex flex-col transition-colors duration-150 cursor-pointer relative group ${!day.isCurrentMonth ? "bg-gray-50 border-gray-100 text-gray-400" : "bg-white border-gray-200 hover:bg-gray-50"} ${day.isToday && day.isCurrentMonth ? "!border-blue-500 ring-1 ring-blue-500 !bg-blue-50" : ""}`, "svelte-i7hfk6")} role="gridcell"${attr("aria-label", `Date ${day.date.toLocaleDateString()}${day.events.length ? ", " + day.events.length + " event" + (day.events.length > 1 ? "s" : "") : ""}`)} tabindex="0"><span${attr_class(`text-xs sm:text-sm font-semibold mb-0.5 ${day.isToday && day.isCurrentMonth ? "text-blue-600" : ""} ${!day.isCurrentMonth ? "opacity-60" : ""}`, "svelte-i7hfk6")}>${escape_html(day.dayNum)}</span> `;
      if (day.isCurrentMonth && day.events.length > 0) {
        $$payload.out += "<!--[-->";
        const maxEventsToShow = day.events.length > 2 ? 1 : 2;
        const each_array_2 = ensure_array_like(day.events.slice(0, maxEventsToShow));
        $$payload.out += `<ul class="mt-0.5 text-[0.6rem] sm:text-[0.7rem] space-y-0.5 overflow-hidden flex-grow svelte-i7hfk6"><!--[-->`;
        for (let $$index_1 = 0, $$length2 = each_array_2.length; $$index_1 < $$length2; $$index_1++) {
          let event = each_array_2[$$index_1];
          $$payload.out += `<li${attr_class(`truncate p-0.5 sm:px-1 sm:py-0.5 rounded text-white leading-tight cursor-pointer hover:opacity-80 transition-opacity`, "svelte-i7hfk6")}${attr_style(`background-color: ${stringify(event.color || "#9CA3AF")};`)} tabindex="0" role="button"${attr("aria-label", `View details for ${event.title}`)}${attr("title", event.title + (event.deadlineTime ? ` (DL: ${event.deadlineTime})` : ""))}>${escape_html(event.title)} `;
          if (event.deadlineTime) {
            $$payload.out += "<!--[-->";
            $$payload.out += `<span class="block text-[0.55rem] sm:text-[0.6rem] opacity-80 svelte-i7hfk6">DL: ${escape_html(event.deadlineTime)}</span>`;
          } else {
            $$payload.out += "<!--[!-->";
          }
          $$payload.out += `<!--]--></li>`;
        }
        $$payload.out += `<!--]--> `;
        if (day.events.length > maxEventsToShow) {
          $$payload.out += "<!--[-->";
          $$payload.out += `<li${attr_class(`italic text-[0.55rem] sm:text-[0.65rem] mt-0.5 ${"text-gray-500"}`, "svelte-i7hfk6")}>+${escape_html(day.events.length - maxEventsToShow)} more</li>`;
        } else {
          $$payload.out += "<!--[!-->";
        }
        $$payload.out += `<!--]--></ul>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--> <button${attr_class(`absolute bottom-1 right-1 p-0.5 sm:p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 focus:opacity-100 ${"bg-blue-500 hover:bg-blue-600 text-white"}`, "svelte-i7hfk6")} aria-label="Add event to this day"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-2.5 h-2.5 sm:w-3 sm:h-3 svelte-i7hfk6"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" class="svelte-i7hfk6"></path></svg></button></div>`;
    }
    $$payload.out += `<!--]-->`;
  } else if (!isLoadingCalendar && daysInMonth.length === 0) {
    $$payload.out += "<!--[2-->";
    $$payload.out += `<p${attr_class(`col-span-7 text-center py-10 ${"text-gray-500"}`, "svelte-i7hfk6")}>No days to display for this month.</p>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div></div></main></div></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  bind_props($$props, { data, form });
  pop();
}
export {
  _page as default
};
