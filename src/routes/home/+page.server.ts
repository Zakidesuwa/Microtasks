// src/routes/home/+page.server.ts

import type { PageServerLoad, Actions } from './$types.js';
import { adminDb } from '$lib/server/firebaseAdmin.js';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { fail } from '@sveltejs/kit';

interface TaskServerData {
    id: string;
    title: string;
    description: string;
    isCompleted: boolean;
    createdAt: string | null;
    userId?: string;
    dueDate?: string | null;
    dueTime?: string | null;
    priority?: string;
    tags?: string[];
    noteId?: string;
}

interface UserForFrontend {
    name?: string;
}

// --- THIS IS THE CORRECT AND ONLY LOAD FUNCTION YOU NEED ---
export const load: PageServerLoad = async ({ locals, url }) => {
    const userId = locals.userId;
    const showCompletedParam = url.searchParams.get('showCompleted');
    const shouldShowCompleted = showCompletedParam === 'true';
    console.log(`[Server Load /home] For user: ${userId}, showCompleted=${shouldShowCompleted}`);

    let userForFrontend: UserForFrontend | undefined = undefined; // Initialize user object

    if (!userId) {
        console.warn('[Server Load /home] No userId found in locals. User not authenticated.');
        return {
            user: { name: 'User' }, // Provide default user structure
            notes: [],
            tasks: [],
            showCompleted: shouldShowCompleted,
            error: 'User not authenticated. Please log in.'
        };
    }

    // --- Fetch User Name ---
    try {
        const credDocRef = adminDb.collection('credentials').doc(userId);
        const credDoc = await credDocRef.get();
        if (credDoc.exists) {
            const userData = credDoc.data();
            userForFrontend = { name: userData?.username || 'User (from home server - username missing/empty)' };
            console.log(`[Server Load /home] Fetched username: ${userForFrontend.name}`);
        } else {
            userForFrontend = { name: 'User (from home server - no creds doc)' };
            console.warn(`[Server Load /home] No credentials document found for userId: ${userId}.`);
        }
    } catch (userError: any) {
        console.error(`[Server Load /home] Error fetching user credentials for ${userId}:`, userError.message);
        userForFrontend = { name: 'User (from home server - fetch error)' };
    }
    // --- End Fetch User Name ---

    try {
        // --- Fetch Notes ---
        const notesCollectionRef = adminDb.collection('notes');
        const notesQuery = notesCollectionRef.where('userId', '==', userId).orderBy('createdAt', 'desc');
        const notesSnapshot = await notesQuery.get();
        const notes = notesSnapshot.docs.map((docSnapshot: any) => {
            const docData = docSnapshot.data();
            const createdAtTimestamp = docData.createdAt as Timestamp | undefined;
            return {
                id: docSnapshot.id,
                title: docData.title || 'Untitled Note',
                content: docData.content || '',
                createdAt: createdAtTimestamp?.toDate()?.toISOString() ?? null,
                userId: docData.userId
            };
        });
        console.log(`[Server Load /home] Fetched ${notes.length} notes.`);

        // --- Fetch Tasks (Conditionally Filtered) ---
        const tasksCollectionRef = adminDb.collection('tasks');
        let tasksQuery = tasksCollectionRef.where('userId', '==', userId);

        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayDateString = `${year}-${month}-${day}`;

        tasksQuery = tasksQuery.where('dueDate', '==', todayDateString);
        if (!shouldShowCompleted) {
            tasksQuery = tasksQuery.where('isCompleted', '==', false);
        }
        tasksQuery = tasksQuery.orderBy('priority', 'desc').orderBy('createdAt', 'asc').limit(10);

        const tasksSnapshot = await tasksQuery.get();
        console.log(`[Server Load /home] Fetched ${tasksSnapshot.size} tasks for today matching filter.`);

        const tasksData: TaskServerData[] = tasksSnapshot.docs.map((docSnapshot: any) => {
            const docData = docSnapshot.data();
            const createdAtTimestamp = docData.createdAt as Timestamp | undefined;
            let dueDateStr: string | null = null;
            if (docData.dueDate) {
                if (docData.dueDate instanceof Timestamp) {
                     try { dueDateStr = docData.dueDate.toDate().toISOString().split('T')[0]; }
                     catch (e) { console.warn(`Error converting dueDate Timestamp for task ${docSnapshot.id}`); }
                } else if (typeof docData.dueDate === 'string') {
                    dueDateStr = docData.dueDate.match(/^\d{4}-\d{2}-\d{2}$/) ? docData.dueDate : null;
                }
            }
            return {
                id: docSnapshot.id,
                title: docData.title || 'Untitled Task', // Ensure title is included
                description: docData.description || '',
                isCompleted: docData.isCompleted ?? false,
                createdAt: createdAtTimestamp?.toDate()?.toISOString() ?? null,
                userId: docData.userId,
                dueDate: dueDateStr,
                dueTime: docData.dueTime || null,
                priority: docData.priority || 'standard',
                tags: docData.tags || [],
                noteId: docData.noteId
            };
        });

        // Return all fetched data INCLUDING THE USER
        console.log(`[Server Load /home] Returning user:`, userForFrontend, `Notes: ${notes.length}, Tasks: ${tasksData.length}`);
        return { user: userForFrontend, notes, tasks: tasksData, showCompleted: shouldShowCompleted };

    } catch (error: any) {
        console.error('[Server Load /home] ERROR loading notes/tasks from Firestore:', error.message);
        if (error.code === 'FAILED_PRECONDITION' && error.message.includes('index')) {
            console.error("[Server Load /home] Query failed due to a missing Firestore index.");
            return {
                user: userForFrontend, // Include user even in error case
                notes: [], tasks: [], showCompleted: shouldShowCompleted,
                error: `Query failed: Missing Firestore index. Check server logs and Firestore console.`
            };
        }
        return {
            user: userForFrontend, // Include user even in error case
            notes: [], tasks: [], showCompleted: shouldShowCompleted,
            error: `Failed to load page data: ${error.message || 'Server Error'}.`
        };
    }
};

// --- REMOVE THE DUPLICATE LOAD FUNCTION THAT WAS HERE ---
// // export const load: PageServerLoad = async ({ locals, url }) => { ... }; // <-- DELETE THIS BLOCK

// --- Form Actions ---
// (Your existing actions: addNote, editNote, deleteNote, addTask, toggleTask, deleteTask)
// These should remain as they are.
export const actions: Actions = {
    addNote: async ({ request, locals }) => {
        const userId = locals.userId;
        if (!userId) return fail(401, { noteForm: { error: 'Authentication required.' } });
        const formData = await request.formData();
        const title = formData.get('title')?.toString()?.trim() || 'Untitled Note';
        const content = formData.get('content')?.toString()?.trim();
        if (!content) return fail(400, { noteForm: { title, missingContent: true, error: 'Note content cannot be empty.' } });
        try {
            const newDocRef = await adminDb.collection('notes').add({ userId, title, content, createdAt: FieldValue.serverTimestamp(), lastModified: FieldValue.serverTimestamp() });
            return { noteForm: { success: true, id: newDocRef.id, message: 'Note added.' } };
        } catch (e:any) { console.error('[Action addNote] Error:', e); return fail(500, { noteForm: { title, content, error: 'Server error adding note.' } }); }
    },

    editNote: async ({ request, locals }) => {
        const userId = locals.userId;
        if (!userId) return fail(401, { noteForm: { error: 'Authentication required.' } });
        const formData = await request.formData();
        const id = formData.get('id')?.toString();
        const title = formData.get('title')?.toString()?.trim() || 'Untitled Note';
        const content = formData.get('content')?.toString()?.trim();
        if (!id) return fail(400, { noteForm: { error: 'Note ID missing.' } });
        if (!content) return fail(400, { noteForm: { id, title, error: 'Note content empty.' } });
        try {
            const noteDocRef = adminDb.collection('notes').doc(id);
            const noteSnap = await noteDocRef.get();
            if (!noteSnap.exists || noteSnap.data()?.userId !== userId) return fail(noteSnap.exists ? 403 : 404, { noteForm: { id, error: 'Permission denied or note not found.' }});
            await noteDocRef.update({ title, content, lastModified: FieldValue.serverTimestamp() });
            return { noteForm: { success: true, id, message: 'Note updated.' } };
        } catch (e:any) { console.error('[Action editNote] Error:', e); return fail(500, { noteForm: { id, title, content, error: 'Server error updating note.' } }); }
    },

    deleteNote: async ({ request, locals }) => {
        const userId = locals.userId;
        if (!userId) return fail(401, { noteForm: { error: 'Authentication required.' } });
        const formData = await request.formData();
        const id = formData.get('id')?.toString();
        if (!id) return fail(400, { noteForm: { error: 'Note ID missing.' } });
        try {
            const noteDocRef = adminDb.collection('notes').doc(id);
            const noteSnap = await noteDocRef.get();
            if (noteSnap.exists && noteSnap.data()?.userId === userId) {
                 await noteDocRef.delete();
                 return { noteForm: { success: true, id, message: 'Note deleted.' } };
            } else if (!noteSnap.exists) {
                 return { noteForm: { success: true, id, message: 'Note already deleted or not found.' } };
            } else {
                 return fail(403, { noteForm: { id, error: 'Permission denied.' }});
            }
        } catch (e:any) { console.error('[Action deleteNote] Error:', e); return fail(500, { noteForm: { id, error: 'Server error deleting note.' } }); }
    },
    addTask: async ({ request, locals }) => {
        const userId = locals.userId;
        if (!userId) { return fail(401, { taskForm: { error: 'Authentication required.' } }); }
        const formData = await request.formData();
        const title = formData.get('title')?.toString()?.trim();
        const description = formData.get('description')?.toString()?.trim();
        const dueDate = formData.get('dueDate')?.toString() || null;
        const dueTime = formData.get('dueTime')?.toString() || null;
        const priority = formData.get('priority')?.toString() || 'standard';
        const tagsString = formData.get('tags')?.toString()?.trim() || '';
        const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
        if (!title) {
             return fail(400, { taskForm: { description, dueDate, dueTime, priority, tags: tagsString, error: 'Task title is required.' } });
        }
        const taskData: any = {
            userId: userId, title: title, description: description || "", isCompleted: false,
            createdAt: FieldValue.serverTimestamp(), lastModified: FieldValue.serverTimestamp(),
            priority: priority, tags: tags
        };
        if (dueDate && dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) taskData.dueDate = dueDate;
        if (dueTime && dueTime.match(/^\d{2}:\d{2}$/)) taskData.dueTime = dueTime;
        try {
            const newTaskDocRef = await adminDb.collection('tasks').add(taskData);
            return { taskForm: { success: true, id: newTaskDocRef.id, message: 'Task added!' } }; // For form action success
        } catch (error: any) {
            return fail(500, { taskForm: { title, description, dueDate, dueTime, priority, tags: tagsString, error: 'Failed to save task.' } });
        }
    },
    toggleTask: async ({ request, locals }) => {
        const userId = locals.userId;
        if (!userId) return fail(401, { error: 'Authentication required.' });
        const formData = await request.formData();
        const id = formData.get('id')?.toString();
        const newIsCompleted = formData.get('isCompleted') !== null;
        if (!id) return fail(400, { error: 'Task ID missing.' });
        try {
            const taskDocRef = adminDb.collection('tasks').doc(id);
            const taskSnap = await taskDocRef.get();
            if (!taskSnap.exists || taskSnap.data()?.userId !== userId) return fail(taskSnap.exists ? 403: 404, { id, error: 'Permission denied or task not found.' });
            await taskDocRef.update({ isCompleted: newIsCompleted, lastModified: FieldValue.serverTimestamp() });
            return { success: true }; // For form action success
        } catch (e:any) { return fail(500, { id, error: 'Server error updating task status.' }); }
    },
    deleteTask: async ({ request, locals }) => {
        const userId = locals.userId;
        if (!userId) return fail(401, { error: 'Authentication required.' });
        const formData = await request.formData();
        const id = formData.get('id')?.toString();
        if (!id) return fail(400, { error: 'Task ID missing.' });
        try {
            const taskDocRef = adminDb.collection('tasks').doc(id);
            const taskSnap = await taskDocRef.get();
             if (taskSnap.exists && taskSnap.data()?.userId === userId) {
                 await taskDocRef.delete();
                 return { success: true, message: 'Task deleted.' }; // For form action success
            } else if (!taskSnap.exists) {
                 return { success: true, message: 'Task already deleted or not found.' };
            } else {
                 return fail(403, { id, error: 'Permission denied.' });
            }
        } catch (e:any) { return fail(500, { id, error: 'Server error deleting task.' }); }
    },
};