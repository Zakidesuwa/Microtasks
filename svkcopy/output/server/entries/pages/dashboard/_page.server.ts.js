import { b as adminDb } from "../../../chunks/firebaseAdmin.js";
import "firebase-admin/firestore";
import { r as redirect } from "../../../chunks/index2.js";
const PHILIPPINES_TIMEZONE_OFFSET_HOURS = 8;
function getPreciseDueDateInTimezoneAsUTC(dateString, timeString, targetTimezoneOffsetHours) {
  if (!dateString || !/\d{4}-\d{2}-\d{2}/.test(dateString)) {
    return null;
  }
  try {
    const [year, month, day] = dateString.split("-").map(Number);
    let hoursInTargetTimezone = 23, minutesInTargetTimezone = 59, secondsInTargetTimezone = 59, msInTargetTimezone = 999;
    if (timeString && /\d{2}:\d{2}/.test(timeString)) {
      const [h, m] = timeString.split(":").map(Number);
      if (!isNaN(h) && !isNaN(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        hoursInTargetTimezone = h;
        minutesInTargetTimezone = m;
        secondsInTargetTimezone = 0;
        msInTargetTimezone = 0;
      }
    }
    return new Date(Date.UTC(
      year,
      month - 1,
      day,
      hoursInTargetTimezone - targetTimezoneOffsetHours,
      minutesInTargetTimezone,
      secondsInTargetTimezone,
      msInTargetTimezone
    ));
  } catch (e) {
    console.warn(`[getPreciseDueDateInTimezoneAsUTC] Error parsing date/time: ${dateString} ${timeString}`, e);
    return null;
  }
}
function getStartOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function getEndOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
function getStartOfWeek(date, startDay = 0) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (startDay === 1 && day === 0 ? -6 : startDay);
  const startOfWeekDate = new Date(d.setDate(diff));
  return getStartOfDay(startOfWeekDate);
}
function getEndOfWeek(date, startDay = 0) {
  const d = new Date(date);
  const sow = getStartOfWeek(d, startDay);
  const endOfWeekDate = new Date(sow);
  endOfWeekDate.setDate(sow.getDate() + 6);
  return getEndOfDay(endOfWeekDate);
}
function getStartOfMonth(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  return getStartOfDay(d);
}
function getEndOfMonth(date) {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return getEndOfDay(d);
}
const load = async ({ locals }) => {
  const userId = locals.userId;
  let userForFrontend = void 0;
  let pageLoadError = null;
  if (!userId) {
    throw redirect(303, "/login");
  }
  try {
    const credDocRef = adminDb.collection("credentials").doc(userId);
    const credDoc = await credDocRef.get();
    userForFrontend = credDoc.exists ? { name: credDoc.data()?.username || "User" } : { name: "User (No Credentials)" };
  } catch (userFetchError) {
    console.error(`[Dashboard Load] Error fetching user credentials for ${userId}:`, userFetchError);
    pageLoadError = "Could not load your user data.";
  }
  const dashboardStats = {
    tasksDoneThisMonth: 0,
    tasksDoneThisWeek: 0,
    tasksDoneAllTime: 0,
    tasksDoneOnTime: 0,
    tasksDoneLate: 0,
    priorityCounts: { high: 0, standard: 0, low: 0, unprioritized: 0 }
  };
  if (!pageLoadError) {
    try {
      const tasksSnapshot = await adminDb.collection("tasks").where("userId", "==", userId).get();
      const now = /* @__PURE__ */ new Date();
      const startOfThisWeek = getStartOfWeek(now, 1);
      const endOfThisWeek = getEndOfWeek(now, 1);
      const startOfThisMonth = getStartOfMonth(now);
      const endOfThisMonth = getEndOfMonth(now);
      tasksSnapshot.docs.forEach((doc) => {
        const task = doc.data();
        const priority = task.priority?.toLowerCase() || "unprioritized";
        if (dashboardStats.priorityCounts.hasOwnProperty(priority)) {
          dashboardStats.priorityCounts[priority]++;
        } else {
          dashboardStats.priorityCounts.unprioritized++;
        }
        if (task.isCompleted && task.completedAt) {
          dashboardStats.tasksDoneAllTime++;
          const completedAtDate = task.completedAt.toDate();
          if (completedAtDate >= startOfThisWeek && completedAtDate <= endOfThisWeek) {
            dashboardStats.tasksDoneThisWeek++;
          }
          if (completedAtDate >= startOfThisMonth && completedAtDate <= endOfThisMonth) {
            dashboardStats.tasksDoneThisMonth++;
          }
          const preciseDueDateUTC = getPreciseDueDateInTimezoneAsUTC(
            task.dueDate || null,
            task.dueTime || null,
            PHILIPPINES_TIMEZONE_OFFSET_HOURS
          );
          if (preciseDueDateUTC) {
            if (completedAtDate.getTime() <= preciseDueDateUTC.getTime()) {
              dashboardStats.tasksDoneOnTime++;
            } else {
              dashboardStats.tasksDoneLate++;
            }
          } else if (task.dueDate === null || task.dueDate === void 0) {
            dashboardStats.tasksDoneOnTime++;
          }
        }
      });
    } catch (dbFetchError) {
      console.error(`[Dashboard Load] Error fetching tasks for user ${userId}:`, dbFetchError);
      pageLoadError = (pageLoadError ? pageLoadError + " " : "") + "Could not load task data for dashboard.";
    }
  }
  return {
    user: userForFrontend,
    dashboardStats,
    error: pageLoadError
  };
};
const actions = {
  logout: async ({ cookies }) => {
    cookies.set("userId", "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    });
    throw redirect(303, "/login");
  }
};
export {
  actions,
  load
};
