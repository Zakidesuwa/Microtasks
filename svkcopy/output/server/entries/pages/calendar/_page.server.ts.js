import { b as adminDb } from "../../../chunks/firebaseAdmin.js";
import { FieldValue } from "firebase-admin/firestore";
import { f as fail } from "../../../chunks/index2.js";
const PHILIPPINES_TIMEZONE_OFFSET_HOURS = 8;
function getPreciseDueDateInTimezoneAsUTC(dateString, timeString, targetTimezoneOffsetHours) {
  if (!dateString || !/\d{4}-\d{2}-\d{2}/.test(dateString)) {
    return null;
  }
  try {
    const [year, month, day] = dateString.split("-").map(Number);
    let hoursInTargetTimezone = 23;
    let minutesInTargetTimezone = 59;
    let secondsInTargetTimezone = 59;
    let msInTargetTimezone = 999;
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
      // JS month is 0-indexed
      day,
      hoursInTargetTimezone - targetTimezoneOffsetHours,
      minutesInTargetTimezone,
      secondsInTargetTimezone,
      msInTargetTimezone
    ));
  } catch (e) {
    console.warn(`[Calendar Page Server] Error parsing date/time for target timezone: ${dateString} ${timeString}`, e);
    return null;
  }
}
function mapTaskDataForCalendar(docSnapshot) {
  const docData = docSnapshot.data();
  const taskId = docSnapshot.id;
  const createdAtTimestamp = docData.createdAt;
  const storedDueDateString = docData.dueDate;
  const storedDueTimeString = docData.dueTime;
  const completedAtTimestamp = docData.completedAt;
  const createdAtISO = createdAtTimestamp?.toDate()?.toISOString() ?? null;
  const completedAtDate = completedAtTimestamp?.toDate() ?? null;
  const preciseDueDateDeadlineUTC = getPreciseDueDateInTimezoneAsUTC(
    storedDueDateString ?? null,
    storedDueTimeString ?? null,
    // Pass deadline time
    PHILIPPINES_TIMEZONE_OFFSET_HOURS
  );
  let dueDateISO = null;
  if (storedDueDateString && /\d{4}-\d{2}-\d{2}/.test(storedDueDateString)) {
    try {
      dueDateISO = storedDueDateString;
    } catch (e) {
      console.warn(`[Calendar Page Server] Error processing dueDateISO for task ${taskId}: ${storedDueDateString}`, e);
    }
  }
  let status;
  const isCompleted = docData.isCompleted ?? false;
  const now = /* @__PURE__ */ new Date();
  if (isCompleted) {
    if (completedAtDate && preciseDueDateDeadlineUTC && completedAtDate.getTime() > preciseDueDateDeadlineUTC.getTime()) {
      status = "late";
    } else {
      status = "complete";
    }
  } else {
    if (preciseDueDateDeadlineUTC && now.getTime() > preciseDueDateDeadlineUTC.getTime()) {
      status = "incomplete";
    } else {
      status = "pending";
    }
  }
  return {
    id: taskId,
    title: docData.title || "Untitled Task",
    description: docData.description || "No Description Provided",
    isCompleted,
    status,
    priority: docData.priority ?? null,
    createdAtISO,
    dueDateISO,
    // YYYY-MM-DD format
    dueTime: storedDueTimeString ?? null,
    // This is the deadline time
    color: docData.color ?? "#3B82F6"
    // Default color
  };
}
const load = async ({ locals }) => {
  const userId = locals.userId;
  let userForFrontend = void 0;
  if (!userId) {
    return {
      user: userForFrontend,
      tasks: [],
      error: "User not authenticated. Please log in."
    };
  }
  try {
    const credDocRef = adminDb.collection("credentials").doc(userId);
    const credDoc = await credDocRef.get();
    if (credDoc.exists) {
      userForFrontend = { name: credDoc.data()?.username || "User" };
    } else {
      userForFrontend = { name: "User" };
    }
  } catch (userError) {
    console.error(`[Calendar Page Server] Error fetching user credentials for ${userId}:`, userError);
    userForFrontend = { name: "User" };
  }
  try {
    const tasksCollectionRef = adminDb.collection("tasks");
    const firestoreQuery = tasksCollectionRef.where("userId", "==", userId);
    const snapshot = await firestoreQuery.get();
    const tasks = snapshot.docs.map(mapTaskDataForCalendar).filter((task) => task.dueDateISO);
    return {
      user: userForFrontend,
      tasks
    };
  } catch (error) {
    console.error("[Calendar Page Server] ERROR loading tasks:", error);
    return {
      user: userForFrontend,
      tasks: [],
      error: `Failed to load tasks for calendar: ${error.message || "Server Error"}.`
    };
  }
};
const actions = {
  addEvent: async ({ request, locals }) => {
    const userId = locals.userId;
    if (!userId) {
      return fail(401, { eventForm: { error: "User not authenticated." } });
    }
    const formData = await request.formData();
    const title = formData.get("title")?.toString()?.trim();
    const description = formData.get("description")?.toString()?.trim() || "";
    const eventDate = formData.get("eventDate")?.toString() || null;
    const deadlineTime = formData.get("dueTime")?.toString() || null;
    const color = formData.get("color")?.toString() || "#3B82F6";
    if (!title) {
      return fail(400, {
        eventForm: { error: "Event title is required.", title, description, eventDate, dueTime: deadlineTime, color }
      });
    }
    if (!eventDate) {
      return fail(400, {
        eventForm: { error: "Event date is required.", title, description, eventDate, dueTime: deadlineTime, color }
      });
    }
    const taskData = {
      userId,
      title,
      description,
      isCompleted: false,
      createdAt: FieldValue.serverTimestamp(),
      lastModified: FieldValue.serverTimestamp(),
      priority: "standard",
      dueDate: null,
      // Initialize
      dueTime: null,
      // Initialize (this will be the deadline time)
      color
    };
    if (eventDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      taskData.dueDate = eventDate;
    } else {
      return fail(400, {
        eventForm: { error: "Invalid date format. Use YYYY-MM-DD.", title, description, eventDate, dueTime: deadlineTime, color }
      });
    }
    if (deadlineTime === "" || deadlineTime === null) {
      taskData.dueTime = null;
    } else if (deadlineTime && deadlineTime.match(/^\d{2}:\d{2}$/)) {
      taskData.dueTime = deadlineTime;
    } else if (deadlineTime) {
      return fail(400, {
        eventForm: { error: "Invalid deadline time format. Use HH:MM.", title, description, eventDate, dueTime: deadlineTime, color }
      });
    }
    try {
      const newTaskDocRef = await adminDb.collection("tasks").add(taskData);
      return {
        type: "success",
        status: 200,
        data: {
          eventForm: {
            success: true,
            id: newTaskDocRef.id,
            message: "Event added successfully as a task!"
          }
        }
      };
    } catch (error) {
      console.error("[Calendar Action addEvent] ERROR:", error);
      return fail(500, {
        eventForm: { error: `Failed to add event: ${error.message || "Server error"}`, title, description, eventDate, dueTime: deadlineTime, color }
      });
    }
  }
};
export {
  actions,
  load
};
