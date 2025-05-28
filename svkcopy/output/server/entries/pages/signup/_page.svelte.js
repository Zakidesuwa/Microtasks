import { N as attr, O as attr_class, F as escape_html, B as pop, z as push, I as stringify } from "../../../chunks/index.js";
import "../../../chunks/firebase.js";
import "firebase/auth";
import "../../../chunks/client.js";
function _page($$payload, $$props) {
  push();
  let username = "";
  let email = "";
  let password = "";
  let confirmPassword = "";
  let isLoading = false;
  $$payload.out += `<main class="flex flex-col justify-center items-center min-h-screen w-full h-full bg-cover bg-fixed" style="background-image: url('/background.png'); background-position: center +783px;"><img src="/logonamin.png" alt="Microtask Logo" class="absolute top-10 left-10 h-12 scale-150 md:scale-250"> <h1 class="text-3xl font-bold text-center mb-6 text-black">Welcome to Microtask</h1> <form class="bg-white p-6 md:p-8 rounded-lg shadow-2xl border border-gray-300 max-w-md w-[90%] md:w-full"><h2 class="text-xl font-bold text-center mb-4">Sign up to continue</h2> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="mb-4"><label for="username" class="block text-gray-700 mb-1 font-medium text-sm">Username</label> <input id="username" name="username" type="text"${attr("value", username)} class="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm svelte-1rjc95u" required placeholder="Choose a username (letters, numbers, _)" aria-describedby="usernameHint"> <p id="usernameHint" class="text-xs text-gray-500 mt-1">Only letters, numbers, and underscores allowed.</p></div> <div class="mb-4"><label for="email" class="block text-gray-700 mb-1 font-medium text-sm">Email</label> <input id="email" name="email" type="email"${attr("value", email)} class="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm svelte-1rjc95u" required placeholder="your@email.com"></div> <div class="mb-4"><label for="password" class="block text-gray-700 mb-1 font-medium text-sm">Password</label> <div class="relative"><input id="password" name="password"${attr("type", "password")}${attr("value", password)}${attr_class(`w-full px-3 py-2 border ${stringify("border-gray-300")} rounded-lg outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm`, "svelte-1rjc95u")} required placeholder="Create a password" aria-describedby="passwordHint passwordErrorMsg"> <button type="button"${attr("aria-label", "Show password")} class="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700 p-1"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">`;
  {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"></path>`;
  }
  $$payload.out += `<!--]--></svg></button></div> <p id="passwordHint" class="text-xs text-gray-500 mt-1">Min. 8 characters, with uppercase &amp; lowercase letters.</p> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> <div class="mb-6"><label for="confirmPassword" class="block text-gray-700 mb-1 font-medium text-sm">Re-type Password</label> <div class="relative"><input id="confirmPassword" name="confirmPassword"${attr("type", "password")}${attr("value", confirmPassword)} class="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm svelte-1rjc95u" required placeholder="Confirm your password"> <button type="button"${attr("aria-label", "Show password")} class="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700 p-1"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">`;
  {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"></path>`;
  }
  $$payload.out += `<!--]--></svg></button></div></div> <div class="mt-6"><button type="submit"${attr("disabled", isLoading, true)} class="w-full bg-black text-white py-2.5 rounded-lg font-semibold transition duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-60 disabled:cursor-not-allowed">${escape_html("Sign up")}</button></div> <div class="relative my-5"><div class="absolute inset-0 flex items-center" aria-hidden="true"><div class="w-full border-t border-gray-300"></div></div> <div class="relative flex justify-center text-sm"><span class="px-2 bg-white text-gray-500">Or</span></div></div> <div class="mt-4"><button type="button"${attr("disabled", isLoading, true)} class="w-full border border-gray-300 flex items-center justify-center py-2.5 rounded-lg font-semibold cursor-pointer transition duration-200 transform hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 disabled:opacity-60 disabled:cursor-not-allowed"><img src="/iconnggoogle.webp" alt="Google" class="h-5 mr-2"> <span class="text-sm text-gray-700">Sign up with Google</span></button></div> <div class="mt-5 text-center text-sm"><p class="text-gray-600">Already have an account? <a href="/login" class="text-blue-600 hover:underline font-medium">Log in</a></p></div></form></main>`;
  pop();
}
export {
  _page as default
};
