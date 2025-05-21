// src/app.d.ts

declare global {
  namespace App {
    // Interface for event.locals
    interface Locals {
      userId: string | null;
      user?: {
        name?: string;
      };
    }

    // Defines the shape of data returned from `load` functions or passed to pages.
    interface PageData {
      // Data for the workspace listing page (/workspace)
      user?: { name?: string };
      boards?: BoardForFrontend[];
      templates?: Template[];
      error?: string | null; // General page-level error

      // Data for a specific workspace page (/workspace/[boardId])
      // These are included here because PageData is a general type for any page
      board?: BoardDataForFrontend;
      tasks?: TaskForFrontend[];
      filterFromDate?: string | null;
      filterToDate?: string | null;

      // Form action results can also be part of PageData if the action redirects
      // or if `update` merges them. For now, these are primarily for `enhance` callback.
      boardForm?: BoardFormResult;
      deleteBoardForm?: DeleteBoardFormResult;
      templateForm?: TemplateFormResult;
    }

    // interface Error {} // Default SvelteKit error type
    // interface Platform {} // For Cloudflare Pages, Vercel, Netlify, etc.

    // --- Shared custom types exported from the App namespace ---
    export type IconKey = "study" | "work" | "self-improvement" | "other"; // Defined icon keys

    export interface Template {
      title: string;
      iconKey: IconKey; // Uses the specific IconKey type
      goal: string;
      steps: string[];
    }

    export interface BoardForFrontend {
      id: string;
      title: string;
      createdAtISO?: string | null;
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
    }

    export interface BoardDataForFrontend {
      id: string;
      title: string;
    }

    // --- Form Action Return Types ---
    // These define the structure of the object returned by form actions,
    // especially when using `fail()` or successful returns.
    export interface BoardFormResult {
      success?: boolean;
      message?: string;
      error?: string;
      title?: string; // For echoing back input on error
      newBoard?: BoardForFrontend; // On successful add
    }

    export interface DeleteBoardFormResult {
      success?: boolean;
      message?: string;
      error?: string;
      deletedBoardId?: string; // On successful delete
    }

    export interface TemplateFormResult {
        success?: boolean;
        message?: string;
        error?: string;
        workspaceName?: string; // For echoing back input on error
        newBoardId?: string; // On successful creation, for navigation
    }
  }
}

export {}; // Crucial: makes this file a module for global augmentation.