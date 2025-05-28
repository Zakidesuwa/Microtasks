import { J as store_get, P as ensure_array_like, O as attr_class, F as escape_html, N as attr, I as stringify, K as unsubscribe_stores, G as bind_props, B as pop, z as push } from "../../../chunks/index.js";
import { o as onDestroy } from "../../../chunks/index-server.js";
import { p as page } from "../../../chunks/stores.js";
import { i as invalidateAll } from "../../../chunks/client.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let boards;
  let data = $$props["data"];
  let form = $$props["form"];
  let username = data.user?.name || "User";
  let pageError = data.error || null;
  let pageSuccessMessage = null;
  let showAddBoardModal = false;
  let workspaceNameInput = "";
  let isSubmittingWorkspace = false;
  let formActionError = null;
  let showDeleteBoardConfirm = false;
  let boardToConfirmDelete = null;
  let isDeletingBoard = false;
  const templates = [
    {
      title: "Study Plan",
      iconKey: "study",
      goal: "Ace your exams with a structured plan.",
      steps: [
        {
          text: "Define subjects & topics to cover",
          inputPrompt: 'List the main subjects or topics you need to cover for your exams (e.g., "Calculus II, Organic Chemistry - Chapters 1-5, World History 1800-1900")?',
          inputType: "textarea"
        },
        {
          text: "Allocate specific study hours per subject/topic",
          requiresContext: true
        },
        {
          text: "Schedule regular practice tests and quizzes for each subject/topic",
          requiresContext: true
        },
        {
          text: "Identify and review weak areas based on test results",
          requiresContext: true
        },
        {
          text: "Plan short, regular breaks during study sessions"
        },
        {
          text: "Schedule a final comprehensive review week before exams"
        }
      ]
    },
    {
      title: "New Project Kickoff",
      iconKey: "work",
      goal: "Successfully launch a new project.",
      steps: [
        {
          text: "Define project scope and primary objectives",
          inputPrompt: "What is the overall scope and what are the main objectives of this project?",
          inputType: "textarea"
        },
        {
          text: "Identify key stakeholders and their roles",
          inputPrompt: 'List key stakeholders and their primary roles/responsibilities (e.g., "Jane Doe - Product Owner, Marketing Team - Feedback & Promotion")?',
          inputType: "textarea"
        },
        {
          text: "Develop a detailed project plan and initial timeline estimate",
          requiresContext: true
        },
        {
          text: "Set up communication channels and recurring meeting schedules"
        },
        {
          text: "Outline necessary resources (budget, team members, tools)"
        },
        {
          text: "Define Key Performance Indicators (KPIs) for measuring project success"
        }
      ]
    },
    {
      title: "Habit Building",
      iconKey: "self-improvement",
      goal: "Build a new positive habit or skill.",
      steps: [
        {
          text: "Clearly define the new habit or skill you want to build",
          inputPrompt: 'What specific habit or skill are you aiming to develop (e.g., "Meditate for 10 minutes daily", "Learn conversational Spanish")?',
          inputType: "text"
        },
        {
          text: "Break the habit/skill into small, actionable daily or weekly steps",
          requiresContext: true
        },
        {
          text: "Set a SMART goal for this habit/skill",
          inputPrompt: 'What is your Specific, Measurable, Achievable, Relevant, and Time-bound (SMART) goal (e.g., "Meditate 5 days a week for 1 month", "Be able to hold a 5-minute basic conversation in Spanish in 3 months")?',
          inputType: "textarea"
        },
        {
          text: "Choose a method for tracking consistency"
        },
        {
          text: "Schedule weekly review and reflection on progress and challenges"
        },
        {
          text: "Identify potential obstacles and plan strategies to overcome them"
        }
      ]
    }
  ];
  let showTemplateUsageModal = false;
  let selectedTemplateForUsage = null;
  let newWorkspaceNameFromTemplate = "";
  let projectStartDate = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  let projectEndDate = "";
  let projectNotes = "";
  let stepSpecificInputs = {};
  let isSubmittingTemplateWorkspace = false;
  let templateFormActionError = null;
  let templateFormSuccessMessage = null;
  function closeAddBoardModal() {
    showAddBoardModal = false;
  }
  function closeDeleteBoardConfirm() {
    boardToConfirmDelete = null;
    showDeleteBoardConfirm = false;
    isDeletingBoard = false;
  }
  function closeTemplateUsageModal() {
    showTemplateUsageModal = false;
    selectedTemplateForUsage = null;
  }
  onDestroy(() => {
  });
  boards = data.boards || [];
  store_get($$store_subs ??= {}, "$page", page).url.pathname;
  {
    if (form) {
      formActionError = null;
      templateFormActionError = null;
      if (form.boardForm) {
        isSubmittingWorkspace = false;
        if ("error" in form.boardForm) {
          formActionError = form.boardForm.error;
          if ("title" in form.boardForm && typeof form.boardForm.title === "string") {
            workspaceNameInput = form.boardForm.title;
          }
        } else if ("success" in form.boardForm) {
          pageSuccessMessage = form.boardForm.message;
          invalidateAll();
          closeAddBoardModal();
          setTimeout(() => pageSuccessMessage = null, 3e3);
        }
      } else if (form.deleteBoardForm) {
        isDeletingBoard = false;
        if ("error" in form.deleteBoardForm) {
          pageError = form.deleteBoardForm.error;
        } else if ("success" in form.deleteBoardForm) {
          pageSuccessMessage = form.deleteBoardForm.message;
          invalidateAll();
          closeDeleteBoardConfirm();
          setTimeout(() => pageSuccessMessage = null, 3e3);
        }
      } else if (form.templateForm) {
        isSubmittingTemplateWorkspace = false;
        if ("error" in form.templateForm) {
          templateFormActionError = form.templateForm.error;
        } else if ("success" in form.templateForm) {
          templateFormSuccessMessage = form.templateForm.message;
          const newBoardTitle = form.templateForm.newBoard.title;
          pageSuccessMessage = `Workspace "${newBoardTitle}" and AI tasks created! View tasks inside.`;
          invalidateAll();
          closeTemplateUsageModal();
          setTimeout(
            () => {
              pageSuccessMessage = null;
              templateFormSuccessMessage = null;
            },
            5e3
          );
        }
      }
    }
  }
  const each_array_1 = ensure_array_like(templates);
  $$payload.out += `<div class="app-layout svelte-14eejdq">`;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="main-content-wrapper svelte-14eejdq"><header${attr_class(`top-header ${"bg-white border-gray-200"}`, "svelte-14eejdq")}><div class="header-left svelte-14eejdq"><button id="hamburgerButton" class="menu-btn svelte-14eejdq" aria-label="Toggle Sidebar"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 svelte-14eejdq"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"></path></svg></button> <a href="/home" class="logo svelte-14eejdq"><img src="/logonamin.png" alt="Microtask Logo" class="h-8 w-auto svelte-14eejdq"> <span${attr_class(`${"text-gray-800"}`, "svelte-14eejdq")}>Microtask</span></a></div> <div class="header-icons svelte-14eejdq"><div class="relative svelte-14eejdq"><button id="bellIcon" aria-label="Notifications" class="svelte-14eejdq"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 svelte-14eejdq" aria-hidden="true"><path fill-rule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0c-1.673-.253-3.287-.673-4.831-1.243a.75.75 0 01-.297-1.206C4.45 13.807 5.25 11.873 5.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0H9.752z" clip-rule="evenodd"></path></svg></button> <div id="notifWindow"${attr_class(`dropdown-window hidden-dropdown ${"bg-white border-gray-200 text-gray-700"}`, "svelte-14eejdq")}><h3 class="font-semibold mb-2 text-sm svelte-14eejdq">Notifications</h3><p class="text-xs svelte-14eejdq">No new notifications.</p></div></div> <div class="relative svelte-14eejdq"><button id="helpIcon" aria-label="Help &amp; FAQ" class="svelte-14eejdq"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 svelte-14eejdq" aria-hidden="true"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.042.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd"></path></svg></button> <div id="helpWindow"${attr_class(`dropdown-window hidden-dropdown ${"bg-white border-gray-200 text-gray-700"}`, "svelte-14eejdq")}><h3 class="font-semibold mb-2 text-sm svelte-14eejdq">FAQ</h3> <ul class="list-disc list-inside space-y-1 text-xs"><li class="svelte-14eejdq">How do I add a task?</li><li class="svelte-14eejdq">Where is the calendar?</li></ul> <a href="/support" class="text-xs text-blue-600 hover:underline mt-2 block dropdown-support-link svelte-14eejdq">Visit Support</a></div></div> <div class="relative svelte-14eejdq"><button id="profileIcon" aria-label="Profile Menu" class="svelte-14eejdq"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 svelte-14eejdq" aria-hidden="true"><path fill-rule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clip-rule="evenodd"></path></svg></button> <div id="profileWindow"${attr_class(`dropdown-window hidden-dropdown ${"bg-white border-gray-200 text-gray-700"}`, "svelte-14eejdq")}><h3 class="font-semibold mb-2 text-sm svelte-14eejdq">Profile</h3> <p class="text-xs mb-2 truncate profile-welcome-msg svelte-14eejdq">Welcome, ${escape_html(username || "User")}!</p> <button class="dropdown-button-danger text-xs px-2 py-1.5 rounded w-full text-left transition-colors duration-150 svelte-14eejdq">Logout</button></div></div> <button id="darkModeToggle" aria-label="Toggle Dark Mode"${attr_class(`ml-2 p-1.5 rounded-full transition-colors duration-150 ${"hover:bg-gray-100 text-gray-700"}`, "svelte-14eejdq")}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 svelte-14eejdq">`;
  {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<path fill-rule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM12 16.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Z" clip-rule="evenodd"></path>`;
  }
  $$payload.out += `<!--]--></svg></button></div></header> `;
  if (pageError && !formActionError && !templateFormActionError) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="alert alert-error svelte-14eejdq" role="alert"><strong class="svelte-14eejdq">Error:</strong> <span>${escape_html(pageError)}</span> <button class="alert-close-button svelte-14eejdq" aria-label="Close error"><span class="alert-close-icon svelte-14eejdq">×</span></button></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (pageSuccessMessage) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="alert alert-success svelte-14eejdq" role="alert"><span>${escape_html(pageSuccessMessage)}</span> <button class="alert-close-button svelte-14eejdq" aria-label="Close message"><span class="alert-close-icon svelte-14eejdq">×</span></button></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <main class="main-area svelte-14eejdq"><div class="container svelte-14eejdq"><h2 class="section-title svelte-14eejdq">Your Workspaces</h2> <section class="workspace-section svelte-14eejdq"><h3 class="sub-section-title sr-only svelte-14eejdq">List of Your Workspaces</h3> `;
  if (boards && boards.length > 0) {
    $$payload.out += "<!--[-->";
    const each_array = ensure_array_like(boards);
    $$payload.out += `<div class="workspace-grid svelte-14eejdq"><!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let board = each_array[$$index];
      $$payload.out += `<a${attr("href", `/workspace/${stringify(board.id)}`)} class="board-card svelte-14eejdq"><h4 class="board-card-title svelte-14eejdq">${escape_html(board.title)}</h4> `;
      if (board.createdAtISO) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<p class="board-card-meta svelte-14eejdq">Created: ${escape_html(new Date(board.createdAtISO).toLocaleDateString())}</p>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--> <button${attr("aria-label", `Delete workspace ${board.title}`)} class="board-card-delete-btn svelte-14eejdq"${attr("disabled", isDeletingBoard && boardToConfirmDelete?.id === board.id, true)}>`;
      if (isDeletingBoard && boardToConfirmDelete?.id === board.id) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<svg class="spinner svelte-14eejdq" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
      } else {
        $$payload.out += "<!--[!-->";
        $$payload.out += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="icon-sm svelte-14eejdq"><path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.58.177-2.34.294a.75.75 0 0 0-.706.705c-.117.76-.217 1.545-.294 2.34V16.25A2.75 2.75 0 0 0 5.25 19h9.5A2.75 2.75 0 0 0 17.5 16.25V7.534c-.077-.795-.177-1.58-.294-2.34a.75.75 0 0 0-.705-.705c-.76-.117-1.545-.217-2.34-.294V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.67.036 2.5.108V5.25a.75.75 0 0 0 .75.75h1.142c.072.83.108 1.66.108 2.5v6.392c0 .84-.036 1.67-.108 2.5H6.608c-.072-.83-.108-1.66-.108-2.5V8.5c0-.84.036 1.67.108 2.5h1.142a.75.75 0 0 0 .75-.75V4.108C8.33 4.036 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.06-1.06L6.25 8a.75.75 0 0 0-1.06 1.06L6.44 10l-1.27 1.27a.75.75 0 1 0 1.06 1.06L7.5 11.06l1.27 1.27a.75.75 0 1 0 1.06-1.06L8.56 10l1.27-1.27a.75.75 0 0 0-1.06-1.06L7.5 8.94l.06-.06Z" clip-rule="evenodd"></path></svg>`;
      }
      $$payload.out += `<!--]--></button></a>`;
    }
    $$payload.out += `<!--]--> <button class="add-workspace-card svelte-14eejdq"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="icon-lg svelte-14eejdq"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z"></path></svg> <span class="text-sm font-medium svelte-14eejdq">Add Workspace</span></button></div>`;
  } else if (!data.error) {
    $$payload.out += "<!--[1-->";
    $$payload.out += `<div class="empty-state-workspaces svelte-14eejdq"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="icon-xl svelte-14eejdq"><path d="M2.25 21h19.5A2.25 2.25 0 0024 18.75V5.25A2.25 2.25 0 0021.75 3H2.25A2.25 2.25 0 000 5.25v13.5A2.25 2.25 0 002.25 21zM18.75 10.5A.75.75 0 0118 9.75H6a.75.75 0 010-1.5h12a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-1.5H9.75V15A.75.75 0 019 15.75H7.5a.75.75 0 01-.75-.75V9.362a2.251 2.251 0 011.437-2.097l4.5-.818a2.25 2.25 0 012.563 2.097v1.875H18a.75.75 0 01.75.75v.375z"></path></svg> <h3 class="svelte-14eejdq">No Workspaces Yet</h3> <p class="svelte-14eejdq">It looks like you haven't created any workspaces. <br> Workspaces help you organize your tasks into projects or different areas of focus.</p> <button class="button button-success svelte-14eejdq">Create Your First Workspace</button></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></section> <section class="template-section svelte-14eejdq"><h3 class="sub-section-title svelte-14eejdq">AI-assisted templates</h3> <p class="section-description svelte-14eejdq">Having a hard time getting started? Use our ai assisted workspace templates to jump right in and stay productive—no stress, just progress.</p> <div class="template-grid svelte-14eejdq"><!--[-->`;
  for (let $$index_2 = 0, $$length = each_array_1.length; $$index_2 < $$length; $$index_2++) {
    let template = each_array_1[$$index_2];
    const each_array_2 = ensure_array_like(template.steps.slice(0, 4));
    $$payload.out += `<div class="template-card svelte-14eejdq"><div class="template-card-header svelte-14eejdq"><span class="template-card-icon-wrapper svelte-14eejdq">`;
    if (template.iconKey === "study") {
      $$payload.out += "<!--[-->";
      $$payload.out += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="svelte-14eejdq"><path d="M2.5 1A1.5 1.5 0 0 0 1 2.5v15A1.5 1.5 0 0 0 2.5 19h15a1.5 1.5 0 0 0 1.5-1.5v-15A1.5 1.5 0 0 0 17.5 1h-15ZM2.75 5.24v11.261c0 .136.11.25.25.25h13.998a.25.25 0 0 0 .251-.25V5.239c-.54.091-1.12.15-1.749.17P12.5 5.5 10 6l-2.5-.5c-.63-.02-1.209-.079-1.751-.17Z"></path></svg>`;
    } else if (template.iconKey === "work") {
      $$payload.out += "<!--[1-->";
      $$payload.out += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="svelte-14eejdq"><path fill-rule="evenodd" d="M6 3.75A2.75 2.75 0 0 1 8.75 1h2.5A2.75 2.75 0 0 1 14 3.75v.438A2.5 2.5 0 0 0 12.5 3h-5A2.5 2.5 0 0 0 6 4.188V3.75ZM13.5 6A1.5 1.5 0 0 1 15 7.5v6A1.5 1.5 0 0 1 13.5 15h-7A1.5 1.5 0 0 1 5 13.5v-6A1.5 1.5 0 0 1 6.5 6h7Zm0 1.5H6.5V13h7V7.5Z" clip-rule="evenodd"></path></svg>`;
    } else if (template.iconKey === "self-improvement") {
      $$payload.out += "<!--[2-->";
      $$payload.out += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="svelte-14eejdq"><path d="M11.213 4.042S8.446 3.214 6.83 4.83c-1.224 1.223-1.037 3.304.196 4.537l-.392.393a.75.75 0 001.06 1.061l.393-.392c1.233 1.233 3.314 1.037 4.537.196 1.617-1.617.789-4.384.789-4.384S12.436 5.266 11.213 4.042ZM10 9.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3Z"></path><path d="M17.5 6.5c0 .69-.56 1.25-1.25 1.25S15 7.19 15 6.5s.56-1.25 1.25-1.25S17.5 5.81 17.5 6.5ZM14.452 2.456a1.25 1.25 0 011.768 0l.022.021c.48.48.48 1.256 0 1.736L15.25 5.206a1.25 1.25 0 01-1.736-1.736l.938-.914Z"></path></svg>`;
    } else {
      $$payload.out += "<!--[!-->";
      $$payload.out += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="svelte-14eejdq"><path d="M10 3.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5ZM9.25 9.545v4.578A.75.75 0 0 0 10 14.873a.75.75 0 0 0 .75-.75V9.546A2.265 2.265 0 0 1 10 9.25c-.134 0-.265.01-.393.029a2.257 2.257 0 0 1-.357.266ZM7.625 5.155A2.255 2.255 0 0 1 7.5 5.5c0 .481.153.923.412 1.285A2.255 2.255 0 0 1 7.625 5.155ZM5.155 7.625A2.255 2.255 0 0 1 5.5 7.5c.481 0 .923.153 1.285.412A2.255 2.255 0 0 1 5.155 7.625ZM12.375 5.155A2.255 2.255 0 0 1 12.5 5.5c0 .481-.153.923-.412 1.285A2.255 2.255 0 0 1 12.375 5.155ZM14.845 7.625A2.255 2.255 0 0 1 14.5 7.5c-.481 0-.923.153-1.285.412A2.255 2.255 0 0 1 14.845 7.625Z"></path></svg>`;
    }
    $$payload.out += `<!--]--></span> <h4 class="template-card-title svelte-14eejdq">${escape_html(template.title)}</h4></div> <p class="template-card-goal svelte-14eejdq"><strong class="font-medium svelte-14eejdq">Goal:</strong> ${escape_html(template.goal)}</p> <ul class="template-card-steps svelte-14eejdq"><!--[-->`;
    for (let $$index_1 = 0, $$length2 = each_array_2.length; $$index_1 < $$length2; $$index_1++) {
      let step = each_array_2[$$index_1];
      $$payload.out += `<li class="svelte-14eejdq">${escape_html(step.text)}</li>`;
    }
    $$payload.out += `<!--]--> `;
    if (template.steps.length > 4) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<li class="svelte-14eejdq">...and more</li>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></ul> <button class="button button-success template-card-button svelte-14eejdq">Use Template</button></div>`;
  }
  $$payload.out += `<!--]--></div></section></div></main></div> `;
  if (showAddBoardModal) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="modal-overlay svelte-14eejdq" id="addBoardModalOverlay"><div id="addBoardModalContent" class="modal-content svelte-14eejdq"><div class="modal-header svelte-14eejdq"><h3 class="modal-title svelte-14eejdq">Create New Workspace</h3> <button class="modal-close-button svelte-14eejdq"><span>×</span></button></div> <form method="POST" action="?/addBoard"><div class="modal-form-group svelte-14eejdq"><label for="workspaceNameModalInput" class="modal-label svelte-14eejdq">Workspace Name <span class="required-asterisk svelte-14eejdq">*</span></label> <input type="text" id="workspaceNameModalInput" name="title"${attr("value", workspaceNameInput)} required maxlength="100" class="modal-input svelte-14eejdq" placeholder="e.g., Q3 Project, Home Renovation"></div> `;
    if (formActionError) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<p class="form-action-error svelte-14eejdq">${escape_html(formActionError)}</p>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> <div class="modal-actions svelte-14eejdq"><button type="button" class="button button-default svelte-14eejdq"${attr("disabled", isSubmittingWorkspace, true)}>Cancel</button> <button type="submit" class="button button-primary svelte-14eejdq"${attr("disabled", isSubmittingWorkspace || !workspaceNameInput.trim(), true)}>`;
    if (isSubmittingWorkspace) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<svg class="button-spinner svelte-14eejdq" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Creating...`;
    } else {
      $$payload.out += "<!--[!-->";
      $$payload.out += `Create Workspace`;
    }
    $$payload.out += `<!--]--></button></div></form></div></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (showDeleteBoardConfirm && boardToConfirmDelete) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="modal-overlay svelte-14eejdq" id="deleteBoardModalOverlay"><div id="deleteBoardModalContent" class="modal-content svelte-14eejdq"><div class="modal-header svelte-14eejdq"><h3 class="modal-title modal-title-danger svelte-14eejdq">Confirm Deletion</h3> <button class="modal-close-button svelte-14eejdq"><span>×</span></button></div> <form method="POST" action="?/deleteBoard"><input type="hidden" name="boardId"${attr("value", boardToConfirmDelete.id)}> <p class="modal-text-confirm svelte-14eejdq">Are you sure you want to delete the workspace "<strong>${escape_html(boardToConfirmDelete.title)}</strong>"?</p> <p class="modal-text-warning svelte-14eejdq">This action cannot be undone and will also delete ALL tasks within this workspace.</p> <div class="modal-actions svelte-14eejdq"><button type="button" class="button button-default svelte-14eejdq"${attr("disabled", isDeletingBoard, true)}>Cancel</button> <button type="submit" class="button button-danger svelte-14eejdq"${attr("disabled", isDeletingBoard, true)}>`;
    if (isDeletingBoard) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<svg class="button-spinner svelte-14eejdq" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Deleting...`;
    } else {
      $$payload.out += "<!--[!-->";
      $$payload.out += `Delete Workspace`;
    }
    $$payload.out += `<!--]--></button></div></form></div></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (showTemplateUsageModal && selectedTemplateForUsage) {
    $$payload.out += "<!--[-->";
    const each_array_3 = ensure_array_like(selectedTemplateForUsage.steps);
    $$payload.out += `<div class="modal-overlay svelte-14eejdq" id="templateUsageModalOverlay"><div id="templateUsageModalContent" class="modal-content modal-content-large svelte-14eejdq"><div class="modal-header svelte-14eejdq"><h3 class="modal-title svelte-14eejdq">Use Template: ${escape_html(selectedTemplateForUsage.title)}</h3> <button class="modal-close-button svelte-14eejdq"><span>×</span></button></div> <form method="POST" action="?/createWorkspaceFromTemplate" class="modal-form-flex-grow svelte-14eejdq"><div class="modal-form-scrollable custom-scrollbar svelte-14eejdq"><p class="template-modal-goal svelte-14eejdq"><strong class="font-medium svelte-14eejdq">Template Goal:</strong> ${escape_html(selectedTemplateForUsage.goal)}</p> <input type="hidden" name="templateTitle"${attr("value", selectedTemplateForUsage.title)}> <input type="hidden" name="templateGoal"${attr("value", selectedTemplateForUsage.goal)}> <input type="hidden" name="templateStepsJSON"${attr("value", JSON.stringify(selectedTemplateForUsage.steps))}> <input type="hidden" name="stepSpecificInputsJSON"${attr("value", JSON.stringify(stepSpecificInputs))}> <div class="modal-form-group svelte-14eejdq"><label for="newWorkspaceNameFromTemplate" class="modal-label svelte-14eejdq">Name for your new workspace <span class="required-asterisk svelte-14eejdq">*</span></label> <input type="text" id="newWorkspaceNameFromTemplate" name="workspaceName"${attr("value", newWorkspaceNameFromTemplate)} required maxlength="100" class="modal-input svelte-14eejdq" placeholder="e.g., My Study Plan for Finals"></div> <div class="date-input-grid svelte-14eejdq"><div><label for="projectStartDate" class="modal-label svelte-14eejdq">Plan Start Date</label> <input type="date" id="projectStartDate" name="projectStartDate"${attr("value", projectStartDate)} class="modal-input svelte-14eejdq"> <p class="input-hint svelte-14eejdq">Tasks will be scheduled from this date.</p></div> <div><label for="projectEndDate" class="modal-label svelte-14eejdq">Plan End Date (Optional)</label> <input type="date" id="projectEndDate" name="projectEndDate"${attr("value", projectEndDate)} class="modal-input svelte-14eejdq"> <p class="input-hint svelte-14eejdq">Distribute tasks until this date if set.</p></div></div> <hr class="modal-divider svelte-14eejdq"> <p class="ai-prompt-section-title svelte-14eejdq">Help the AI tailor your tasks:</p> <!--[-->`;
    for (let i = 0, $$length = each_array_3.length; i < $$length; i++) {
      let step = each_array_3[i];
      if (step.inputPrompt) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="step-input-container svelte-14eejdq"><label${attr("for", `step-input-${i}`)} class="step-input-label svelte-14eejdq">${escape_html(step.inputPrompt)}</label> `;
        if (step.inputType === "textarea") {
          $$payload.out += "<!--[-->";
          $$payload.out += `<textarea${attr("id", `step-input-${i}`)}${attr("name", `step_input_${i}`)} rows="2" class="modal-textarea svelte-14eejdq">`;
          const $$body = escape_html(stepSpecificInputs[i]);
          if ($$body) {
            $$payload.out += `${$$body}`;
          }
          $$payload.out += `</textarea>`;
        } else {
          $$payload.out += "<!--[!-->";
          $$payload.out += `<input type="text"${attr("id", `step-input-${i}`)}${attr("name", `step_input_${i}`)}${attr("value", stepSpecificInputs[i])} class="modal-input svelte-14eejdq">`;
        }
        $$payload.out += `<!--]--> <p class="step-input-hint svelte-14eejdq">AI will use this to customize the task: "<em class="svelte-14eejdq">${escape_html(step.text)}</em>".</p></div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]-->`;
    }
    $$payload.out += `<!--]--> <hr class="modal-divider svelte-14eejdq"> <div class="modal-form-group svelte-14eejdq"><label for="projectNotes" class="modal-label svelte-14eejdq">General Notes/Additional Context (Optional)</label> <textarea id="projectNotes" name="projectNotes" rows="2" class="modal-textarea svelte-14eejdq" placeholder="Any other details for the AI to consider for all tasks.">`;
    const $$body_1 = escape_html(projectNotes);
    if ($$body_1) {
      $$payload.out += `${$$body_1}`;
    }
    $$payload.out += `</textarea></div> `;
    if (templateFormActionError) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<p class="form-action-error svelte-14eejdq">${escape_html(templateFormActionError)}</p>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> `;
    if (templateFormSuccessMessage && !pageSuccessMessage) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<p class="form-success-message svelte-14eejdq">${escape_html(templateFormSuccessMessage)}</p>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div> <div class="modal-footer-actions svelte-14eejdq"><button type="button" class="button button-default svelte-14eejdq"${attr("disabled", isSubmittingTemplateWorkspace, true)}>Cancel</button> <button type="submit" class="button button-success svelte-14eejdq"${attr("disabled", isSubmittingTemplateWorkspace || !newWorkspaceNameFromTemplate.trim(), true)}>`;
    if (isSubmittingTemplateWorkspace) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<svg class="button-spinner svelte-14eejdq" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Creating...`;
    } else {
      $$payload.out += "<!--[!-->";
      $$payload.out += `Create Workspace &amp; AI Tasks`;
    }
    $$payload.out += `<!--]--></button></div></form></div></div>`;
  } else {
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
