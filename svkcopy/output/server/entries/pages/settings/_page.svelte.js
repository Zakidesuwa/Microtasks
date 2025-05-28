import { O as attr_class, F as escape_html, N as attr, G as bind_props, B as pop, z as push } from "../../../chunks/index.js";
import "../../../chunks/client.js";
import "../../../chunks/firebase.js";
import "firebase/auth";
import "firebase/firestore";
import "firebase/storage";
function _page($$payload, $$props) {
  push();
  let globalUsername = "User";
  let pageErrorMessage = null;
  let data = $$props["data"];
  let displayNameInput = "";
  let profilePicturePreview = "https://via.placeholder.com/150/CCCCCC/808080?Text=Avatar";
  let isLoadingSave = false;
  let isLoadingDelete = false;
  if (data?.error) pageErrorMessage = data.error;
  $$payload.out += `<div${attr_class(`flex h-screen font-sans ${"bg-gray-100 text-gray-800"}`, "svelte-1d7fo4d")}>`;
  if (pageErrorMessage) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-md z-[100] svelte-1d7fo4d" role="alert"><strong class="font-bold svelte-1d7fo4d">Error:</strong> <span class="block sm:inline svelte-1d7fo4d">${escape_html(pageErrorMessage)}</span> <button class="absolute top-0 bottom-0 right-0 px-4 py-3 svelte-1d7fo4d" aria-label="Close error"><span class="text-xl svelte-1d7fo4d">×</span></button></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="flex-1 flex flex-col overflow-hidden svelte-1d7fo4d"><header${attr_class(`top-header ${"bg-white border-gray-200"}`, "svelte-1d7fo4d")}><div class="header-left svelte-1d7fo4d"><button id="hamburgerButton" class="menu-btn svelte-1d7fo4d" aria-label="Toggle Sidebar"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 svelte-1d7fo4d"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" class="svelte-1d7fo4d"></path></svg></button> <a href="/home" class="logo svelte-1d7fo4d"><img src="/logonamin.png" alt="Microtask Logo" class="h-8 w-auto svelte-1d7fo4d"> <span${attr_class(`${"text-gray-800"}`, "svelte-1d7fo4d")}>Microtask</span></a></div> <div class="header-icons svelte-1d7fo4d"><div class="relative svelte-1d7fo4d"><button id="bellIcon" aria-label="Notifications" class="svelte-1d7fo4d"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 svelte-1d7fo4d" aria-hidden="true"><path fill-rule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0c-1.673-.253-3.287-.673-4.831-1.243a.75.75 0 01-.297-1.206C4.45 13.807 5.25 11.873 5.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0H9.752z" clip-rule="evenodd" class="svelte-1d7fo4d"></path></svg></button> <div id="notifWindow"${attr_class(`dropdown-window hidden ${"bg-white border-gray-200 text-gray-700"}`, "svelte-1d7fo4d")}><h3 class="font-semibold mb-2 text-sm svelte-1d7fo4d">Notifications</h3><p class="text-xs svelte-1d7fo4d">No new notifications.</p></div></div> <div class="relative svelte-1d7fo4d"><button id="helpIcon" aria-label="Help &amp; FAQ" class="svelte-1d7fo4d"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 svelte-1d7fo4d" aria-hidden="true"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.042.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" class="svelte-1d7fo4d"></path></svg></button> <div id="helpWindow"${attr_class(`dropdown-window hidden ${"bg-white border-gray-200 text-gray-700"}`, "svelte-1d7fo4d")}><h3 class="font-semibold mb-2 text-sm svelte-1d7fo4d">FAQ</h3> <ul class="list-disc list-inside space-y-1 text-xs svelte-1d7fo4d"><li class="svelte-1d7fo4d">How do I add a task?</li><li class="svelte-1d7fo4d">Where is the calendar?</li></ul> <a href="/support" class="text-xs text-blue-600 hover:underline mt-2 block svelte-1d7fo4d">Visit Support</a></div></div> <div class="relative svelte-1d7fo4d"><button id="profileIcon" aria-label="Profile Menu" class="svelte-1d7fo4d"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 svelte-1d7fo4d" aria-hidden="true"><path fill-rule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clip-rule="evenodd" class="svelte-1d7fo4d"></path></svg></button> <div id="profileWindow"${attr_class(`dropdown-window hidden ${"bg-white border-gray-200 text-gray-700"}`, "svelte-1d7fo4d")}><h3 class="font-semibold mb-2 text-sm svelte-1d7fo4d">Profile</h3> <p class="text-xs mb-2 truncate svelte-1d7fo4d">Welcome, ${escape_html(globalUsername)}!</p> <a href="/settings"${attr_class(`block text-xs px-2 py-1.5 rounded w-full text-left mb-1 transition-colors duration-150 ${"bg-gray-100 hover:bg-gray-200 text-gray-700"}`, "svelte-1d7fo4d")}>Settings</a> <button${attr_class(`text-xs px-2 py-1.5 rounded w-full text-left transition-colors duration-150 ${"bg-red-100 hover:bg-red-200 text-red-700"}`, "svelte-1d7fo4d")}>Logout</button></div></div> <button id="darkModeToggle" aria-label="Toggle Dark Mode"${attr_class(`ml-2 p-1.5 rounded-full transition-colors duration-150 ${"hover:bg-gray-100 text-gray-700"}`, "svelte-1d7fo4d")}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 svelte-1d7fo4d">`;
  {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<path fill-rule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM12 16.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Z" clip-rule="evenodd" class="svelte-1d7fo4d"></path>`;
  }
  $$payload.out += `<!--]--></svg></button></div></header> <div class="flex-1 overflow-y-auto pt-[60px] flex flex-col custom-scrollbar svelte-1d7fo4d"><div class="settings-page svelte-1d7fo4d"><h1 class="svelte-1d7fo4d">Account Settings</h1> <section class="settings-section svelte-1d7fo4d"><h2 class="svelte-1d7fo4d">Profile Information</h2> <p class="welcome-message svelte-1d7fo4d">Welcome, ${escape_html(globalUsername)}!</p> <div class="profile-form-grid svelte-1d7fo4d"><div class="form-group profile-picture-group svelte-1d7fo4d"><label for="profilePictureInput" class="svelte-1d7fo4d">Profile Picture</label> <div class="profile-picture-controls svelte-1d7fo4d"><img${attr("src", profilePicturePreview)} alt="Profile Preview" class="profile-preview svelte-1d7fo4d"> <input type="file" id="profilePictureInput" accept="image/*" style="display: none;" class="svelte-1d7fo4d"> <label for="profilePictureInput" class="button button-secondary upload-button svelte-1d7fo4d" role="button" tabindex="0">Choose Image</label></div></div> <div class="form-group full-width-profile-field svelte-1d7fo4d"><label for="displayNameInput" class="svelte-1d7fo4d">Display Name</label> <input type="text" id="displayNameInput"${attr("value", displayNameInput)} placeholder="Your public display name" class="svelte-1d7fo4d"></div></div> <button class="button button-primary svelte-1d7fo4d"${attr("disabled", isLoadingSave, true)}>`;
  {
    $$payload.out += "<!--[!-->";
    $$payload.out += `Save Profile Info`;
  }
  $$payload.out += `<!--]--></button> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></section> <section class="settings-section danger-zone svelte-1d7fo4d"><h2 class="svelte-1d7fo4d">Account Deletion</h2> <p class="danger-text svelte-1d7fo4d">Permanently delete your account and all associated data. This action cannot be undone. 
            Please be absolutely sure before proceeding.</p> <button class="button button-danger svelte-1d7fo4d"${attr("disabled", isLoadingDelete, true)}>`;
  {
    $$payload.out += "<!--[!-->";
    $$payload.out += `Delete My Account`;
  }
  $$payload.out += `<!--]--></button> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></section> <footer class="settings-footer svelte-1d7fo4d">Microtask © ${escape_html((/* @__PURE__ */ new Date()).getFullYear())}</footer></div></div></div></div>`;
  bind_props($$props, { data });
  pop();
}
export {
  _page as default
};
