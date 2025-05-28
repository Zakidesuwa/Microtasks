import { r as redirect } from "../../../chunks/index2.js";
const load = async ({ locals }) => {
  const userId = locals.userId;
  console.log("[Server Load /ai-chat] Checking authentication...");
  if (!userId) {
    console.warn("[Server Load /ai-chat] User not authenticated. Redirecting to login.");
    redirect(302, "/login");
  }
  console.log(`[Server Load /ai-chat] User authenticated: ${userId}. Allowing access.`);
  return {};
};
export {
  load
};
