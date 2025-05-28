import { N as attr, F as escape_html, B as pop, z as push } from "../../chunks/index.js";
import "../../chunks/client.js";
import "../../chunks/firebase.js";
import "firebase/auth";
function _page($$payload, $$props) {
  push();
  let loginIdentifier = "";
  let password = "";
  let isLoading = false;
  $$payload.out += `<main class="flex flex-col justify-center items-center min-h-screen w-full h-full bg-cover bg-fixed" style="background-image: url('/background.png'); background-position: center +783px;"><img src="/logonamin.png" alt="Microtask Logo" class="absolute top-10 left-10 h-12 scale-250"> <h1 class="text-3xl font-bold text-center mb-6 text-black">Welcome to Microtask!</h1> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="bg-white p-6 md:p-8 rounded-lg shadow-2xl border border-gray-300 max-w-md w-[90%] md:w-full"><h2 class="text-xl font-bold text-center mb-4">Log In</h2> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <form novalidate><div class="mb-4"><label for="loginIdentifier" class="block text-gray-700 mb-1 font-medium text-sm">Email or Username</label> <input id="loginIdentifier" name="loginIdentifier" type="text"${attr("value", loginIdentifier)} class="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm transition duration-150 ease-in-out svelte-4hyim8" required placeholder="Enter your email or username" autocomplete="username" aria-required="true"></div> <div class="mb-2"><label for="password" class="block text-gray-700 mb-1 font-medium text-sm">Password</label> <div class="relative"><input id="password" name="password"${attr("type", "password")}${attr("value", password)} class="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm transition duration-150 ease-in-out svelte-4hyim8" required placeholder="Enter your password" autocomplete="current-password" aria-required="true"> <button type="button"${attr("aria-label", "Show password")} class="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700 p-1"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">`;
  {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"></path>`;
  }
  $$payload.out += `<!--]--></svg></button></div></div> <div class="flex justify-end items-center mt-3 mb-4"><a href="/forgotpass" class="text-sm text-blue-600 hover:underline font-medium">Forgot Password?</a></div> <button type="submit"${attr("disabled", isLoading, true)} class="w-full bg-black text-white py-2.5 rounded-lg font-semibold transition duration-200 ease-in-out transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-60 disabled:cursor-not-allowed">${escape_html("Log in")}</button> <div class="mt-4 text-center text-sm">Don't have an account? <a href="/signup" class="text-blue-600 hover:underline font-medium">Create one</a></div> <div class="relative my-5"><div class="absolute inset-0 flex items-center" aria-hidden="true"><div class="w-full border-t border-gray-300"></div></div> <div class="relative flex justify-center text-sm"><span class="px-2 bg-white text-gray-500">Or</span></div></div> <button type="button"${attr("disabled", isLoading, true)} class="w-full border border-gray-300 flex items-center justify-center py-2.5 rounded-lg font-semibold cursor-pointer transition duration-200 ease-in-out transform hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 disabled:opacity-60 disabled:cursor-not-allowed"><img src="/iconnggoogle.webp" alt="Google" class="h-5 mr-2"> <span class="text-sm text-gray-700">Log in with Google</span></button></form></div></main>`;
  pop();
}
export {
  _page as default
};
