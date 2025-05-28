// @ts-nocheck
// src/routes/kanban/+page.server.ts

// Corrected SvelteKit core type imports
import type {
    ServerLoad,         // Corrected from PageServerLoad
    Actions,            // This one is correct
    ServerLoadEvent     // Corrected from PageServerLoadEvent
} from '@sveltejs/kit';

// Import your custom PageData and ActionData (which includes KanbanPageActionData)
// These define the specifics for *this* route.
import type { PageData, ActionData } from './$types.js'; // Ensure $types.ts exports these correctly

import { adminDb } from '$lib/server/firebaseAdmin.js';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { fail, redirect } from '@sveltejs/kit';

// --- INTERFACES ---
interface FetchedTaskData {
    title: string;
    description?: string;
    isCompleted?: boolean;
    createdAt?: Timestamp;
    dueDate?: string | null;
    dueTime?: string | null;
    completedAt?: Timestamp | null;
    userId?: string;
    priority?: string;
    tags?: string[];
    noteId?: string;
    lastModified?: Timestamp;
    boardId?: string;
}

export interface TaskForFrontend {
    id: string;
    title: string;
    description: string;
    isCompleted: boolean;
    status: 'pending' | 'complete' | 'incomplete' | 'late';
    priority: string | number | null;
    createdAtISO: string | null;
    dueDateISO: string | null;
    dueTime: string | null;
    boardId?: string;
}

export interface WorkspaceColumn {
    id: string;
    title: string;
    createdAtISO?: string | null;
    tasks: TaskForFrontend[];
}

export interface UserForFrontend {
    name?: string;
}

// --- ACTION DATA TYPE DEFINITIONS ---
// These are EXPORTED so $types.ts can pick them up.

export type AddWorkspaceSuccessData = { workspaceForm: { success: true; message: string; newWorkspace: WorkspaceColumn }};
export type AddWorkspaceErrorData = { workspaceForm: { error: string; title?: string }};

export type DeleteWorkspaceSuccessData = { deleteWorkspaceForm: { success: true; message: string; deletedWorkspaceId: string }};
export type DeleteWorkspaceErrorData = { deleteWorkspaceForm: { error: string; }};

export type AddTaskSuccessData = { taskForm: { success: true; message: string; newTask: TaskForFrontend }};
export type AddTaskErrorData = { taskForm: { error: string; title?: string; description?: string; dueDate?: string | null; dueTime?: string | null; priority?: string; tags?: string; boardId?: string }};

export type UpdateTaskSuccessData = { taskForm: { success: true; message: string; updatedTask: TaskForFrontend }};
export type UpdateTaskErrorData = { taskForm: { error: string; taskId?: string }};

export type ToggleCompleteSuccessData = { toggleCompleteForm: { successMessage: string; updatedTask: TaskForFrontend }};
export type ToggleCompleteErrorData = { toggleCompleteForm: { error: string }};

export type DeleteTaskSuccessData = { deleteTaskForm: { successMessage: string; deletedTaskId: string; boardId?: string }};
export type DeleteTaskErrorData = { deleteTaskForm: { error: string }};

export type BatchDeleteSuccessData = { batchDeleteForm: { successMessage: string; deletedTaskDetails: { id: string; boardId?: string }[] }};
export type BatchDeleteErrorData = { batchDeleteForm: { error: string }};

// Union type for all possible action data structures for this page.
export type KanbanPageActionData =
    | AddWorkspaceSuccessData
    | DeleteWorkspaceSuccessData
    | AddTaskSuccessData
    | UpdateTaskSuccessData
    | ToggleCompleteSuccessData
    | DeleteTaskSuccessData
    | BatchDeleteSuccessData
    | AddWorkspaceErrorData
    | DeleteWorkspaceErrorData
    | AddTaskErrorData
    | UpdateTaskErrorData
    | ToggleCompleteErrorData
    | DeleteTaskErrorData
    | BatchDeleteErrorData;


// --- HELPER FUNCTIONS ---
const PHILIPPINES_TIMEZONE_OFFSET_HOURS = 8;

function getPreciseDueDateInTimezoneAsUTC(
    dateString: string | null,
    timeString: string | null,
    targetTimezoneOffsetHours: number
): Date | null {
    if (!dateString || !/\d{4}-\d{2}-\d{2}/.test(dateString)) {
        return null;
    }
    try {
        const [year, month, day] = dateString.split('-').map(Number);
        let hoursInTargetTimezone = 23, minutesInTargetTimezone = 59, secondsInTargetTimezone = 59, msInTargetTimezone = 999;
        if (timeString && /\d{2}:\d{2}/.test(timeString)) {
            const [h, m] = timeString.split(':').map(Number);
            if (!isNaN(h) && !isNaN(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59) {
                hoursInTargetTimezone = h; minutesInTargetTimezone = m; secondsInTargetTimezone = 0; msInTargetTimezone = 0;
            }
        }
        return new Date(Date.UTC( year, month - 1, day, hoursInTargetTimezone - targetTimezoneOffsetHours, minutesInTargetTimezone, secondsInTargetTimezone, msInTargetTimezone ));
    } catch (e) {
        console.warn(`[getPreciseDueDateInTimezoneAsUTC] Error: ${dateString} ${timeString}`, e);
        return null;
    }
}

function mapTaskData(docSnapshot: FirebaseFirestore.QueryDocumentSnapshot): TaskForFrontend {
    const docData = docSnapshot.data() as FetchedTaskData;
    const taskId = docSnapshot.id;
    const createdAtTimestamp = docData.createdAt;
    const storedDueDateString = docData.dueDate;
    const storedDueTimeString = docData.dueTime;
    const completedAtTimestamp = docData.completedAt;
    const createdAtISO = createdAtTimestamp?.toDate()?.toISOString() ?? null;
    const completedAtDate = completedAtTimestamp?.toDate() ?? null;
    const preciseDueDateDeadlineUTC = getPreciseDueDateInTimezoneAsUTC(storedDueDateString ?? null, storedDueTimeString ?? null, PHILIPPINES_TIMEZONE_OFFSET_HOURS);
    let dueDateISO: string | null = null;
    if (storedDueDateString && /\d{4}-\d{2}-\d{2}/.test(storedDueDateString)) {
        try {
            const [year, month, day] = storedDueDateString.split('-').map(Number);
            dueDateISO = new Date(Date.UTC(year, month - 1, day)).toISOString();
        } catch (e) { console.warn(`[mapTaskData] Error creating dueDateISO: ${storedDueDateString}`, e); }
    }
    let status: TaskForFrontend['status'];
    const isCompleted = docData.isCompleted ?? false;
    const now = new Date();
    if (isCompleted) {
        status = (completedAtDate && preciseDueDateDeadlineUTC && completedAtDate.getTime() > preciseDueDateDeadlineUTC.getTime()) ? 'late' : 'complete';
    } else {
        status = (preciseDueDateDeadlineUTC && now.getTime() > preciseDueDateDeadlineUTC.getTime()) ? 'incomplete' : 'pending';
    }
    return {
        id: taskId, title: docData.title || 'Untitled Task', description: docData.description || 'No Description',
        isCompleted, status, priority: docData.priority ?? null, createdAtISO, dueDateISO,
        dueTime: storedDueTimeString ?? null, boardId: docData.boardId
    };
}

// --- LOAD FUNCTION ---
// Use the corrected ServerLoad and ServerLoadEvent types
export const load = async ({ locals }: ServerLoadEvent) => {
    console.log('Loading Kanban board data...');
    const userId = locals.userId;
    let userForFrontend: UserForFrontend | undefined = undefined;
    if (!userId) {
        console.log('User not authenticated, redirecting to login...');
        throw redirect(303, '/login');
    }
    try {
        console.log('Fetching user data...');
        const credDoc = await adminDb.collection('credentials').doc(userId).get();
        userForFrontend = credDoc.exists ? { name: credDoc.data()?.username || 'User' } : { name: 'User' };
        console.log('User data fetched successfully:', userForFrontend);
    } catch (e) {
        console.error(`Error fetching user:`, e);
        userForFrontend = { name: 'User' };
    }

    let workspaceColumns: WorkspaceColumn[] = [];
    try {
        console.log('Fetching workspace columns...');
        const wsSnapshot = await adminDb.collection('workspaces').where('userId', '==', userId).orderBy('createdAt', 'asc').get();
        console.log(`Found ${wsSnapshot.docs.length} workspace columns.`);
        for (const wsDoc of wsSnapshot.docs) {
            const wsData = wsDoc.data();
            console.log(`Fetching tasks for workspace ${wsDoc.id}...`);
            const tasksSnapshot = await adminDb.collection('tasks').where('userId', '==', userId).where('boardId', '==', wsDoc.id).get();
            console.log(`Found ${tasksSnapshot.docs.length} tasks for workspace ${wsDoc.id}.`);
            let tasks = tasksSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
               const task = mapTaskData(doc);
               console.log(`Task ID: ${task.id}, Title: ${task.title}`);
               return task;
            });

            const uniqueTasks = tasks.filter((task, index, self) => {
                return index === self.findIndex((t) => t.id === task.id);
            });
            tasks = uniqueTasks;

            tasks.sort((a, b) => {
                const statusOrder = { 'pending': 1, 'incomplete': 2, 'late': 3, 'complete': 4 };
                if (statusOrder[a.status] !== statusOrder[b.status]) { return statusOrder[a.status] - statusOrder[b.status]; }
                if (a.status === 'pending' || a.status === 'incomplete') {
                    const dateA = a.dueDateISO ? new Date(a.dueDateISO).getTime() : Infinity;
                    const dateB = b.dueDateISO ? new Date(b.dueDateISO).getTime() : Infinity;
                    if (dateA !== dateB) return dateA - dateB;
                    if (a.dueTime && b.dueTime) return a.dueTime.localeCompare(b.dueTime);
                    else if (a.dueTime) return -1; else if (b.dueTime) return 1;
                }
                const createdAtA = a.createdAtISO ? new Date(a.createdAtISO).getTime() : 0;
                const createdAtB = b.createdAtISO ? new Date(b.createdAtISO).getTime() : 0;
                return createdAtB - createdAtA;
            });
            let wsCreatedAtISO = null;
            if (wsData.createdAt instanceof Timestamp) wsCreatedAtISO = wsData.createdAt.toDate().toISOString();
             else if (wsData.createdAt && typeof wsData.createdAt === 'object' && (wsData.createdAt as any)._seconds) {
                wsCreatedAtISO = new Date((wsData.createdAt as any)._seconds * 1000).toISOString();
            }
            workspaceColumns.push({ id: wsDoc.id, title: wsData.title || 'Untitled Workspace', tasks, createdAtISO: wsCreatedAtISO });
        }
        console.log('Workspace columns fetched successfully:', workspaceColumns);
        return { user: userForFrontend, workspaceColumns, error: null };
    } catch (e: any) {
        console.error('Error loading Kanban data:', e);
        if (e.code === 'FAILED_PRECONDITION' && e.message.includes('index')) {
            console.warn('Firestore index is missing.');
            return { user: userForFrontend, workspaceColumns: [], error: 'Query failed: Missing Firestore index.'};
        }
        console.error('Error loading Kanban data:', e);
        return { user: userForFrontend, workspaceColumns: [], error: e.message || 'Server error during data load.' };
    }
};

// --- ACTIONS ---
// Use Actions and provide your specific ActionData from ./$types.js
export const actions = {
    addWorkspace: async ({ request, locals }: import('./$types').RequestEvent) => {
        const userId = locals.userId;
        if (!userId) {
            return fail(401, { workspaceForm: { error: 'User not authenticated. Please log in.' } } satisfies AddWorkspaceErrorData);
        }
        const formData = await request.formData();
        const title = formData.get('title')?.toString()?.trim();
        if (!title) {
            return fail(400, { workspaceForm: { error: 'Workspace title is required.', title } } satisfies AddWorkspaceErrorData);
        }
        if (title.length > 100) {
             return fail(400, { workspaceForm: { error: 'Workspace title is too long (max 100 chars).', title } } satisfies AddWorkspaceErrorData);
        }
        try {
            const newWorkspaceRef = await adminDb.collection('workspaces').add({
                userId,
                title,
                createdAt: FieldValue.serverTimestamp()
            });
            const newWorkspaceDoc = await newWorkspaceRef.get();
            const newWorkspaceData = newWorkspaceDoc.data();
            let createdAtISO = new Date().toISOString();
            if (newWorkspaceData?.createdAt instanceof Timestamp) {
                createdAtISO = newWorkspaceData.createdAt.toDate().toISOString();
            }
            return { workspaceForm: {
                success: true,
                message: 'Workspace added!',
                newWorkspace: {
                    id: newWorkspaceRef.id,
                    title,
                    tasks: [],
                    createdAtISO
                }
            }} satisfies AddWorkspaceSuccessData;
        } catch (error: any) {
            console.error('[Action addWorkspace] ERROR:', error);
            return fail(500, { workspaceForm: { error: `Failed to add workspace: ${(error as Error).message || 'Server error.'}`, title }} satisfies AddWorkspaceErrorData);
        }
    },

    deleteWorkspace: async ({ request, locals }: import('./$types').RequestEvent) => {
        const userId = locals.userId;
        if (!userId) return fail(401, { deleteWorkspaceForm: { error: 'User not authenticated.' }} satisfies DeleteWorkspaceErrorData);
        const formData = await request.formData();
        const workspaceId = formData.get('workspaceId')?.toString();
        if (!workspaceId) return fail(400, { deleteWorkspaceForm: { error: 'Workspace ID required.' }} satisfies DeleteWorkspaceErrorData);

        try {
            const workspaceRef = adminDb.collection('workspaces').doc(workspaceId);
            const workspaceDoc = await workspaceRef.get();
            if (!workspaceDoc.exists || workspaceDoc.data()?.userId !== userId) {
                return fail(workspaceDoc.exists ? 403 : 404, { deleteWorkspaceForm: { error: workspaceDoc.exists ? 'Permission denied.' : 'Workspace not found.' }} satisfies DeleteWorkspaceErrorData);
            }

            const batch = adminDb.batch();
            const tasksQuery = adminDb.collection('tasks').where('boardId', '==', workspaceId).where('userId', '==', userId);
            const tasksSnapshot = await tasksQuery.get();
            tasksSnapshot.docs.forEach(doc => batch.delete(doc.ref));
            batch.delete(workspaceRef);
            await batch.commit();
            return { deleteWorkspaceForm: { success: true, message: `Deleted workspace and ${tasksSnapshot.size} associated task(s).`, deletedWorkspaceId: workspaceId }} satisfies DeleteWorkspaceSuccessData;
        } catch (error: any) {
            console.error(`[Action deleteWorkspace] ERROR for workspace ${workspaceId}:`, error);
            return fail(500, { deleteWorkspaceForm: { error: `Failed to delete workspace: ${(error as Error).message || 'Server error.'}` }} satisfies DeleteWorkspaceErrorData);
        }
    },

    addTask: async ({ request, locals }: import('./$types').RequestEvent) => {
        const userId = locals.userId;
        if (!userId) return fail(401, { taskForm: { error: 'User not authenticated.' } } satisfies AddTaskErrorData);
        const formData = await request.formData();
        const title = formData.get('title')?.toString()?.trim();
        const boardId = formData.get('boardId')?.toString()?.trim();
        const description = formData.get('description')?.toString()?.trim() || '';
        const dueDate = formData.get('dueDate')?.toString() || null;
        const dueTime = formData.get('dueTime')?.toString() || null;
        const priority = formData.get('priority')?.toString() || 'standard';
        const errorPayloadBase = { title, boardId, description, dueDate, dueTime, priority };

        if (!title) return fail(400, { taskForm: { error: 'Task title is required.', ...errorPayloadBase } } satisfies AddTaskErrorData);
        if (!boardId) return fail(400, { taskForm: { error: 'Workspace ID (boardId) is required.', ...errorPayloadBase } } satisfies AddTaskErrorData);

        const taskDataForCreate: Omit<FetchedTaskData, 'createdAt'|'lastModified'|'completedAt'> & {userId: string, createdAt: FieldValue, lastModified: FieldValue} = {
            userId, boardId, title, description, priority, isCompleted: false,
            createdAt: FieldValue.serverTimestamp(), lastModified: FieldValue.serverTimestamp(),
            dueDate: (dueDate && dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) ? dueDate : null,
            dueTime: (dueTime && dueTime.match(/^\d{2}:\d{2}$/)) ? dueTime : null
        };
        if (dueDate && !taskDataForCreate.dueDate) return fail(400, {taskForm: {error: 'Invalid due date format. Use YYYY-MM-DD.', ...errorPayloadBase}} satisfies AddTaskErrorData);
        if (dueTime && !taskDataForCreate.dueTime) return fail(400, {taskForm: {error: 'Invalid due time format. Use HH:MM.', ...errorPayloadBase}} satisfies AddTaskErrorData);
        if (taskDataForCreate.dueDate === null) taskDataForCreate.dueTime = null;

        try {
            const newTaskDocRef = await adminDb.collection('tasks').add(taskDataForCreate);
            const newTaskSnapshot = await newTaskDocRef.get() as FirebaseFirestore.QueryDocumentSnapshot;
            const mappedNewTask = mapTaskData(newTaskSnapshot);
            return { taskForm: { success: true, message: 'Task added successfully!', newTask: mappedNewTask }} satisfies AddTaskSuccessData;
        } catch (error: any) {
            console.error('[Action addTask] ERROR:', error);
            return fail(500, { taskForm: { error: `Failed to add task: ${error.message}`, ...errorPayloadBase } } satisfies AddTaskErrorData);
        }
    },

    updateTask: async ({ request, locals }: import('./$types').RequestEvent) => {
        const userId = locals.userId;
        if (!userId) return fail(401, { taskForm: { error: 'User not authenticated.' } } satisfies UpdateTaskErrorData);
        const formData = await request.formData();
        const taskId = formData.get('taskId')?.toString();
        if (!taskId) return fail(400, { taskForm: { error: 'Task ID is required.' } } satisfies UpdateTaskErrorData);
        const title = formData.get('title')?.toString()?.trim();
        if (!title) return fail(400, { taskForm: { error: 'Task title is required.', taskId } } satisfies UpdateTaskErrorData);

        const taskUpdateData: Partial<Omit<FetchedTaskData, 'lastModified'>> & { lastModified: FieldValue } = {
            lastModified: FieldValue.serverTimestamp()
        };
        if (title !== undefined) taskUpdateData.title = title;
        const description = formData.get('description')?.toString()?.trim();
        if (description !== undefined) taskUpdateData.description = description;
        const priority = formData.get('priority')?.toString();
        if (priority) taskUpdateData.priority = priority;
        const boardId = formData.get('boardId')?.toString()?.trim();
        if (boardId) taskUpdateData.boardId = boardId;
        const dueDate = formData.get('dueDate')?.toString();
        const dueTime = formData.get('dueTime')?.toString();

        if (dueDate === null || dueDate === '') { taskUpdateData.dueDate = null; taskUpdateData.dueTime = null; }
        else if (dueDate && dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) taskUpdateData.dueDate = dueDate;
        else if (dueDate) return fail(400, { taskForm: { error: 'Invalid due date format (YYYY-MM-DD).', taskId } } satisfies UpdateTaskErrorData);

        if (dueTime === null || dueTime === '' || !taskUpdateData.dueDate) taskUpdateData.dueTime = null;
        else if (dueTime && dueTime.match(/^\d{2}:\d{2}$/)) taskUpdateData.dueTime = dueTime;
        else if (dueTime) return fail(400, { taskForm: { error: 'Invalid due time format (HH:MM).', taskId } } satisfies UpdateTaskErrorData);

        try {
            const taskRef = adminDb.collection('tasks').doc(taskId);
            const taskDoc = await taskRef.get();
            if (!taskDoc.exists) return fail(404, { taskForm: { error: 'Task not found.' } } satisfies UpdateTaskErrorData);
            if (taskDoc.data()?.userId !== userId) return fail(403, { taskForm: { error: 'Permission denied.' } } satisfies UpdateTaskErrorData);
            await taskRef.update(taskUpdateData);
            const updatedTaskSnapshot = await taskRef.get() as FirebaseFirestore.QueryDocumentSnapshot;
            const mappedUpdatedTask = mapTaskData(updatedTaskSnapshot);
            return { taskForm: { success: true, message: 'Task updated successfully!', updatedTask: mappedUpdatedTask } } satisfies UpdateTaskSuccessData;
        } catch (error: any) {
            console.error(`[Action updateTask] ERROR for task ${taskId}:`, error);
            return fail(500, { taskForm: { error: `Failed to update task: ${error.message}` } } satisfies UpdateTaskErrorData);
        }
    },

    toggleComplete: async ({ request, locals }: import('./$types').RequestEvent) => {
        const userId = locals.userId;
        if (!userId) return fail(401, { toggleCompleteForm: { error: 'User not authenticated.' } } satisfies ToggleCompleteErrorData);
        const formData = await request.formData();
        const taskId = formData.get('taskId')?.toString();
        const newCompletedState = formData.get('isCompleted')?.toString() === 'true';
        if (!taskId) return fail(400, { toggleCompleteForm: { error: 'Task ID is required.' } } satisfies ToggleCompleteErrorData);
        try {
            const taskRef = adminDb.collection('tasks').doc(taskId);
            const taskDoc = await taskRef.get();
            if (!taskDoc.exists || taskDoc.data()?.userId !== userId) return fail(403, {toggleCompleteForm: {error: 'Permission denied or not found.'}} satisfies ToggleCompleteErrorData);

            await taskRef.update({
                isCompleted: newCompletedState,
                completedAt: newCompletedState ? FieldValue.serverTimestamp() : null,
                lastModified: FieldValue.serverTimestamp()
            });
            const updatedTaskSnapshot = await taskRef.get() as FirebaseFirestore.QueryDocumentSnapshot;
            const mappedUpdatedTask = mapTaskData(updatedTaskSnapshot);
            return { toggleCompleteForm: { successMessage: `Task ${newCompletedState ? 'marked as complete' : 'marked as not complete'}.`, updatedTask: mappedUpdatedTask } } satisfies ToggleCompleteSuccessData;
        } catch (error: any) {
            console.error(`[Action toggleComplete] ERROR for task ${taskId}:`, error);
            return fail(500, { toggleCompleteForm: { error: `Failed to update completion: ${error.message}` } } satisfies ToggleCompleteErrorData);
        }
    },

    deleteTask: async ({ request, locals }: import('./$types').RequestEvent) => {
        const userId = locals.userId;
        if (!userId) return fail(401, { deleteTaskForm: { error: 'User not authenticated.' } } satisfies DeleteTaskErrorData);
        const formData = await request.formData();
        const taskId = formData.get('taskId') as string;
        if (!taskId) return fail(400, { deleteTaskForm: { error: 'Task ID is required.' } } satisfies DeleteTaskErrorData);
        try {
            const taskRef = adminDb.collection('tasks').doc(taskId);
            const taskDoc = await taskRef.get();
            if (!taskDoc.exists || taskDoc.data()?.userId !== userId) return fail(403, {deleteTaskForm: {error: 'Permission denied or not found.'}} satisfies DeleteTaskErrorData);
            const boardId = taskDoc.data()?.boardId;
            await taskRef.delete();
            return { deleteTaskForm: { successMessage: 'Task deleted successfully.', deletedTaskId: taskId, boardId: boardId } } satisfies DeleteTaskSuccessData;
        } catch (error: any) {
            console.error(`[Action deleteTask] ERROR for task ${taskId}:`, error);
            return fail(500, { deleteTaskForm: { error: `Failed to delete task: ${error.message}` } } satisfies DeleteTaskErrorData);
        }
    },

    batchDeleteTasks: async ({ request, locals }: import('./$types').RequestEvent) => {
        const userId = locals.userId;
        if (!userId) return fail(401, { batchDeleteForm: { error: 'User not authenticated.' } } satisfies BatchDeleteErrorData);
        const formData = await request.formData();
        const taskIdsString = formData.get('taskIds') as string;
        if (!taskIdsString) return fail(400, { batchDeleteForm: { error: 'Task IDs are required.' } } satisfies BatchDeleteErrorData);
        const taskIds = taskIdsString.split(',').map(id => id.trim()).filter(Boolean);
        if (taskIds.length === 0) return fail(400, { batchDeleteForm: { error: 'No valid task IDs provided.' } } satisfies BatchDeleteErrorData);
        try {
            const batch = adminDb.batch();
            const tasksCollectionRef = adminDb.collection('tasks');
            let deletedCount = 0;
            const deletedTaskDetails: { id: string; boardId?: string }[] = [];
            for (const taskId of taskIds) {
                const taskRef = tasksCollectionRef.doc(taskId);
                const taskDoc = await taskRef.get();
                if (taskDoc.exists && taskDoc.data()?.userId === userId) {
                    batch.delete(taskRef); deletedCount++;
                    deletedTaskDetails.push({id: taskId, boardId: taskDoc.data()?.boardId});
                }
            }
            if (deletedCount > 0) await batch.commit();
            return { batchDeleteForm: { successMessage: `${deletedCount} task(s) deleted. ${taskIds.length - deletedCount} task(s) skipped.`, deletedTaskDetails }} satisfies BatchDeleteSuccessData;
        } catch (error: any) {
            console.error(`[Action batchDeleteTasks] ERROR:`, error);
            return fail(500, { batchDeleteForm: { error: `Failed to batch delete tasks: ${error.message}` } } satisfies BatchDeleteErrorData);
        }
    },

    logout: async ({ cookies }: import('./$types').RequestEvent) => {
        cookies.set('userId', '', { path: '/', maxAge: 0, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
        throw redirect(303, '/login');
    }
};;null as any as ServerLoad<PageData>;;null as any as Actions<ActionData>;