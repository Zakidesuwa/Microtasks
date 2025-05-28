import { N as attr, F as escape_html, B as pop, z as push } from "../../../chunks/index.js";
import "../../../chunks/firebase.js";
import "firebase/auth";
function _page($$payload, $$props) {
  push();
  let email = "";
  let isLoading = false;
  $$payload.out += `<main class="flex flex-col justify-center items-center min-h-screen w-full h-full bg-cover bg-[center_top_100%]" style="background-image: url('/background.png');"><img src="/logonamin.png" alt="Logo" class="absolute top-10 left-10 h-12 scale-250"> <h1 class="text-3xl font-bold text-center mb-6 text-black">Microtask</h1> <div class="bg-white p-8 rounded-lg shadow-2xl border border-gray-500/50 max-w-md w-full text-center"><h2 class="text-xl font-bold mb-2">Forgot Your Password?</h2> <p class="text-gray-600 mb-6">Enter your email address below, and if an account exists, we'll send you a link to reset your password.</p> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <form><div class="mb-4 text-left"><label for="email" class="block text-gray-700 font-semibold mb-1">Email address</label> <input id="email" name="email" type="email"${attr("value", email)} class="w-full px-3 py-2 border rounded-lg outline-none border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 svelte-y5hita" placeholder="Enter your account email" required${attr("disabled", isLoading, true)}></div> <button type="submit"${attr("disabled", isLoading, true)} class="w-full bg-black text-white py-2 rounded-lg font-semibold transition duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">${escape_html("Send Reset Link")}</button></form> <a href="/login" class="block mt-6 text-sm text-blue-500 hover:underline">Back to Login</a></div></main>`;
  pop();
}
export {
  _page as default
};
