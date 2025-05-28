import { e as error, j as json } from "../../../../../chunks/index2.js";
import { b as adminDb } from "../../../../../chunks/firebaseAdmin.js";
import { C as CRON_SECRET, A as APP_URL } from "../../../../../chunks/private.js";
import admin from "firebase-admin";
function getFormattedDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
const GET = async ({ url }) => {
  const providedSecret = url.searchParams.get("secret");
  if (providedSecret !== CRON_SECRET) {
    console.warn("[API /send-reminders] Unauthorized cron attempt.");
    throw error(401, "Unauthorized");
  }
  console.log("[API /send-reminders] Cron job triggered. Processing tasks for <= 24hr FCM reminders...");
  const now = /* @__PURE__ */ new Date();
  const todayDateString = getFormattedDateString(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowDateString = getFormattedDateString(tomorrow);
  let notificationsSentCount = 0;
  let tasksConsideredCount = 0;
  try {
    const tasksSnapshot = await adminDb.collection("tasks").where("isCompleted", "==", false).where("dueDate", "in", [todayDateString, tomorrowDateString]).get();
    if (tasksSnapshot.empty) {
      console.log(`[API /send-reminders] No tasks found due today or tomorrow for potential reminders.`);
      return json({ message: "No tasks due today or tomorrow for potential reminders.", tasksConsidered: 0, notificationsSent: 0 });
    }
    console.log(`[API /send-reminders] Found ${tasksSnapshot.docs.length} tasks due today or tomorrow to consider.`);
    for (const taskDoc of tasksSnapshot.docs) {
      tasksConsideredCount++;
      const task = taskDoc.data();
      const userId = task.userId;
      const taskTitle = task.title || "Untitled Task";
      const taskDueDateStr = task.dueDate;
      const taskDueTimeStr = task.dueTime;
      if (task.reminderSent24hr === true) {
        continue;
      }
      if (!taskDueDateStr) {
        console.warn(`[API /send-reminders] Task ${taskDoc.id} ('${taskTitle}') has no dueDate. Skipping.`);
        continue;
      }
      let taskDueDateTime;
      try {
        const [year, month, day] = taskDueDateStr.split("-").map(Number);
        let hours = 23, minutes = 59, seconds = 59;
        if (taskDueTimeStr && /^\d{2}:\d{2}$/.test(taskDueTimeStr)) {
          [hours, minutes] = taskDueTimeStr.split(":").map(Number);
          seconds = 0;
        }
        taskDueDateTime = new Date(year, month - 1, day, hours, minutes, seconds);
      } catch (e) {
        console.warn(`[API /send-reminders] Could not parse dueDate/dueTime for task ${taskDoc.id} ('${taskDueDateStr}' '${taskDueTimeStr}'). Skipping.`, e);
        continue;
      }
      const timeDifferenceMs = taskDueDateTime.getTime() - now.getTime();
      const hoursDifference = timeDifferenceMs / (1e3 * 60 * 60);
      if (hoursDifference > -1 && hoursDifference <= 24) {
        console.log(`[API /send-reminders] Task ${taskDoc.id} (${taskTitle}) is due in ${hoursDifference.toFixed(1)} hours. Preparing notification.`);
      } else {
        continue;
      }
      if (!userId) {
        console.warn(`[API /send-reminders] Task ${taskDoc.id} is missing userId. Skipping.`);
        continue;
      }
      const userCredDoc = await adminDb.collection("credentials").doc(userId).get();
      const userName = userCredDoc.exists ? userCredDoc.data()?.username || "User" : "User";
      const fcmTokensSnapshot = await adminDb.collection("users").doc(userId).collection("fcmTokens").get();
      if (fcmTokensSnapshot.empty) {
        console.log(`[API /send-reminders] No FCM tokens found for user ${userId} (${userName}). Skipping push notification for task ${taskTitle}.`);
        continue;
      }
      const tokens = fcmTokensSnapshot.docs.map((docSnap) => docSnap.data().token).filter(Boolean);
      if (tokens.length === 0) {
        console.log(`[API /send-reminders] No valid FCM tokens extracted for user ${userId} (${userName}) for task ${taskTitle}.`);
        continue;
      }
      const appBaseUrl = APP_URL || "https://microtasks-zoys.vercel.app/";
      const taskPageUrl = `${appBaseUrl}/tasks`;
      const messagePayload = {
        notification: {
          title: `Task Reminder: ${taskTitle}`,
          body: `Your task "${taskTitle}" is due in approx. ${Math.max(0, Math.round(hoursDifference))} hour(s) (at ${taskDueTimeStr || "end of day"} on ${taskDueDateStr}).`
          // icon: `${appBaseUrl}/favicon.png`, // Optional: URL to an icon
        },
        webpush: {
          fcmOptions: {
            link: taskPageUrl
          }
        },
        tokens
      };
      try {
        console.log(`[API /send-reminders] Attempting to send push notification to user ${userId} (${userName}) for task "${taskTitle}" to ${tokens.length} device(s).`);
        const response = await admin.messaging().sendEachForMulticast(messagePayload);
        let successCount = response.successCount;
        if (successCount > 0) {
          notificationsSentCount += successCount;
          console.log(`[API /send-reminders] Successfully sent ${successCount} push notifications for task "${taskTitle}" to user ${userId}.`);
          await adminDb.collection("tasks").doc(taskDoc.id).update({ reminderSent24hr: true });
          console.log(`[API /send-reminders] Marked task ${taskDoc.id} (${taskTitle}) with reminderSent24hr = true.`);
        }
        if (response.failureCount > 0) {
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              console.error(`[API /send-reminders] Failed to send to token ${tokens[idx]}: ${resp.error}`);
              if (resp.error?.code === "messaging/registration-token-not-registered") {
                const failedToken = tokens[idx];
                adminDb.collection("users").doc(userId).collection("fcmTokens").where("token", "==", failedToken).get().then((snap) => snap.forEach((d) => d.ref.delete())).catch((e) => console.error(`[API /send-reminders] Error deleting stale token ${failedToken}:`, e));
              }
            }
          });
        }
      } catch (pushError) {
        console.error(`[API /send-reminders] Failed to send push notification for task "${taskTitle}" to user ${userId}:`, pushError);
      }
    }
    console.log(`[API /send-reminders] Finished processing. Tasks considered: ${tasksConsideredCount}. Push notifications sent to ${notificationsSentCount} device(s).`);
    return json({
      message: "Reminder processing complete.",
      tasksConsidered: tasksConsideredCount,
      notificationsSent: notificationsSentCount
    });
  } catch (err) {
    console.error("[API /send-reminders] Critical error during reminder processing:", err);
    throw error(500, `Internal Server Error: ${err.message}`);
  }
};
export {
  GET
};
