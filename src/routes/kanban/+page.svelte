<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
    import { fly } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import { goto } from '$app/navigation';

    export let data: import('./$types').PageData;

    // --- KANBAN INTERFACES ---
    interface PlaceholderTask {
        id: string;
        title: string;
        description?: string;
        priority?: 'high' | 'medium' | 'low' | 'standard' | string;
        dueDateISO?: string | null;
        dueTime?: string | null;
    }
    interface PlaceholderColumn {
        id: 'todo' | 'inProgress' | 'done';
        title: string;
        tasks: PlaceholderTask[];
    }
    // --- END KANBAN INTERFACES ---

    // --- LOCALSTORAGE STATE ---
    interface KanbanLayoutStorage {
        columnOrder: PlaceholderColumn['id'][];
        taskOrders: Record<PlaceholderColumn['id'], string[]>;
    }
    let savedLayout: KanbanLayoutStorage | null = null;
    const KANBAN_STORAGE_KEY = 'kanbanBoardLayout';

    // --- HEADER/SIDEBAR UI STATE ---
	let isSidebarOpen = false;
	let isDarkMode = false;
    const dropdownIds = ['notifWindow', 'helpWindow', 'profileWindow'];
    let usernameForDisplay: string;
    // --- END Header/Sidebar UI State ---

    // --- KANBAN DRAG & DROP STATE (Column & Card) ---
    let draggedColumnItem: PlaceholderColumn | null = null;
    let activeDraggedColumnElement: HTMLElement | null = null;
    let columnDragOverIndex: number | null = null;
    let columnDragOffsetX = 0, columnDragOffsetY = 0;
    let currentColumnX = 0, currentColumnY = 0, targetColumnX = 0, targetColumnY = 0;
    let velocityX = 0, velocityY = 0;
    let currentRotation = 0, targetRotation = 0, rotationVelocity = 0;
    let currentSkewX = 0, targetSkewX = 0, skewXVelocity = 0;
    let columnAnimationFrameId: number | null = null;

    let draggedCardItem: { task: PlaceholderTask; fromColumnId: PlaceholderColumn['id'] } | null = null;
    let currentCardDragOverInfo: { columnId: PlaceholderColumn['id']; overTaskId?: string; position?: 'before' | 'after' } | null = null;
    let activeDraggedCardElement: HTMLElement | null = null; // Card element
    let cardDragOffsetX = 0, cardDragOffsetY = 0;
    let currentCardX = 0, currentCardY = 0, targetCardX = 0, targetCardY = 0;
    let cardVelocityX = 0, cardVelocityY = 0;
    let cardAnimationFrameId: number | null = null;

    const POS_SPRING_STIFFNESS = 0.09;
    const POS_DAMPING_FACTOR = 0.70;
    const DEFORM_SPRING_STIFFNESS = 0.1;
    const DEFORM_DAMPING_FACTOR = 0.65;
    const MAX_SKEW_X = 15;
    const MAX_ROTATION = 10;
    let DUMMY_DRAG_IMAGE: HTMLImageElement;
    // --- END KANBAN DRAG & DROP STATE ---

    // --- REACTIVE DERIVATION OF KANBAN BOARD COLUMNS ---
    let boardColumns: PlaceholderColumn[] = [];

    function mapRawTaskToPlaceholder(rawTask: typeof data.tasks[0]): PlaceholderTask {
        return {
            id: rawTask.id,
            title: rawTask.title,
            description: rawTask.description || undefined,
            priority: mapPriorityToKanban(rawTask.priority),
            dueDateISO: rawTask.dueDateISO,
            dueTime: rawTask.dueTime
        };
    }

    $: {
        usernameForDisplay = data.user?.name || 'User';
        const columnTitles: Record<PlaceholderColumn['id'], string> = { todo: 'To Do', inProgress: 'In Progress', done: 'Completed' };
        const defaultColumnOrder: PlaceholderColumn['id'][] = ['todo', 'inProgress', 'done'];

        if (!data.tasks || !Array.isArray(data.tasks)) {
            // Initialize with empty default columns if no data
            boardColumns = defaultColumnOrder.map(id => ({
                id,
                title: columnTitles[id],
                tasks: []
            }));
        } else {
            const allRawTasks = data.tasks;
            const tasksById = new Map(allRawTasks.map(t => [t.id, t]));
            
            let finalColumnOrder: PlaceholderColumn['id'][];

            if (savedLayout && savedLayout.columnOrder) {
                finalColumnOrder = [...savedLayout.columnOrder];
                defaultColumnOrder.forEach(defaultColId => {
                    if (!finalColumnOrder.includes(defaultColId)) {
                        finalColumnOrder.push(defaultColId);
                    }
                });
                finalColumnOrder = finalColumnOrder.filter(id => defaultColumnOrder.includes(id));
            } else {
                finalColumnOrder = [...defaultColumnOrder];
            }

            const tempBoardColumns = finalColumnOrder.map(id => ({
                id,
                title: columnTitles[id],
                tasks: [] as PlaceholderTask[]
            }));
            const columnsMap = new Map(tempBoardColumns.map(col => [col.id, col]));
            const processedTaskIds = new Set<string>();

            if (savedLayout && savedLayout.taskOrders) {
                for (const columnId of finalColumnOrder) { // Iterate in the final determined order
                    const column = columnsMap.get(columnId);
                    if (!column) continue;

                    const tasksForThisColumnInStorage = savedLayout.taskOrders[columnId] || [];
                    for (const taskId of tasksForThisColumnInStorage) {
                        if (tasksById.has(taskId) && !processedTaskIds.has(taskId)) {
                            const rawTask = tasksById.get(taskId)!;
                            column.tasks.push(mapRawTaskToPlaceholder(rawTask));
                            processedTaskIds.add(taskId);
                        }
                    }
                }
            }

            for (const rawTask of allRawTasks) {
                if (!processedTaskIds.has(rawTask.id)) {
                    const boardTask = mapRawTaskToPlaceholder(rawTask);
                    let targetColumnId: PlaceholderColumn['id'] = rawTask.isCompleted ? 'done' : 'todo';
                    
                    const targetColumn = columnsMap.get(targetColumnId) || columnsMap.get('todo')!;
                    targetColumn.tasks.push(boardTask);
                    // No need to add to processedTaskIds here as this loop is for unprocessed tasks
                }
            }
            boardColumns = tempBoardColumns;
        }
    }

    function mapPriorityToKanban(priority: string | number | null): PlaceholderTask['priority'] {
        if (typeof priority === 'string') {
            const lowerPriority = priority.toLowerCase();
            if (lowerPriority === 'high' || lowerPriority === 'medium' || lowerPriority === 'low') {
                return lowerPriority as 'high' | 'medium' | 'low';
            }
            return 'standard';
        }
        return 'standard';
    }
    // --- END REACTIVE DERIVATION ---

    // --- LOCALSTORAGE FUNCTIONS ---
    function loadBoardStateFromLocalStorage() {
        if (!browser) return;
        const storedLayout = localStorage.getItem(KANBAN_STORAGE_KEY);
        if (storedLayout) {
            try {
                savedLayout = JSON.parse(storedLayout);
                // console.log("Kanban state loaded from localStorage:", savedLayout);
            } catch (e) {
                console.error("Failed to parse saved kanban layout:", e);
                localStorage.removeItem(KANBAN_STORAGE_KEY); // Clear corrupted data
                savedLayout = null;
            }
        } else {
            savedLayout = null; // Explicitly set to null to trigger reactivity if it wasn't
        }
    }

    function saveBoardStateToLocalStorage() {
        if (!browser || !boardColumns || boardColumns.length === 0) return;

        const layoutToSave: KanbanLayoutStorage = {
            columnOrder: boardColumns.map(col => col.id),
            taskOrders: boardColumns.reduce((acc, col) => {
                acc[col.id] = col.tasks.map(task => task.id);
                return acc;
            }, {} as Record<PlaceholderColumn['id'], string[]>)
        };
        localStorage.setItem(KANBAN_STORAGE_KEY, JSON.stringify(layoutToSave));
        // console.log("Kanban state saved to localStorage.");
    }
    // --- END LOCALSTORAGE FUNCTIONS ---

    // --- HEADER/SIDEBAR FUNCTIONS ---
    function toggleSidebar() { isSidebarOpen = !isSidebarOpen; }
    function closeSidebar() { isSidebarOpen = false; }
    function toggleDarkMode() {
		isDarkMode = !isDarkMode;
        if (browser) {
		    document.body.classList.toggle('dark', isDarkMode);
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        }
	}
    function toggleWindow(id: string) {
        const el = document.getElementById(id);
        if (el) {
            const isHidden = el.classList.contains('hidden-dropdown');
            el.classList.toggle('hidden-dropdown');
            if (isHidden) closeOtherWindows(id);
        }
    }
    function closeOtherWindows(currentId: string) {
        dropdownIds.forEach(id => {
            if (id !== currentId) {
                const el = document.getElementById(id);
                if (el && !el.classList.contains('hidden-dropdown')) {
                    el.classList.add('hidden-dropdown');
                }
            }
        });
    }
    function handleLogout() {
		if (browser) {
			console.log("Logout action triggered from Kanban page");
            localStorage.removeItem(KANBAN_STORAGE_KEY); // Optional: clear board state on logout
			goto('/login'); 
		}
  	}
    // --- END HEADER/SIDEBAR FUNCTIONS ---

    let handleGlobalClickListener: ((event: MouseEvent) => void);
    let handleEscKeyListener: ((event: KeyboardEvent) => void);

	onMount(() => {
        loadBoardStateFromLocalStorage(); // Load saved layout first

        DUMMY_DRAG_IMAGE = new Image();
        DUMMY_DRAG_IMAGE.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

        const storedDarkMode = localStorage.getItem('theme');
		if (storedDarkMode === 'dark' || (!storedDarkMode && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
			isDarkMode = true;
			if (browser) document.body.classList.add('dark');
		} else {
            isDarkMode = false;
            if (browser) document.body.classList.remove('dark');
        }

        const setupIconListener = (iconId: string, windowId: string) => {
            const iconElement = document.getElementById(iconId);
            if (iconElement) {
                const listener = (e: Event) => { e.stopPropagation(); toggleWindow(windowId); };
                iconElement.addEventListener('click', listener);
                (iconElement as any).__clickHandler = listener;
            }
        };
        setupIconListener('bellIcon', 'notifWindow');
        setupIconListener('helpIcon', 'helpWindow');
        setupIconListener('profileIcon', 'profileWindow');
        
        const darkModeButton = document.getElementById('darkModeToggle');
        if (darkModeButton) darkModeButton.addEventListener('click', toggleDarkMode);

        handleGlobalClickListener = (event: MouseEvent) => {
            const target = event.target as Node | null;
            let isClickInsideHeaderDropdownTrigger = false;
            const headerTriggerIds = ['bellIcon', 'helpIcon', 'profileIcon']; 
            headerTriggerIds.forEach(triggerId => { const triggerEl = document.getElementById(triggerId); if (triggerEl && triggerEl.contains(target)) isClickInsideHeaderDropdownTrigger = true; });
            let isClickInsideHeaderDropdownWindow = false;
            dropdownIds.forEach(windowId => { const windowEl = document.getElementById(windowId); if (windowEl && windowEl.contains(target)) isClickInsideHeaderDropdownWindow = true; });
            if (!isClickInsideHeaderDropdownTrigger && !isClickInsideHeaderDropdownWindow) closeOtherWindows(''); 
            const sidebarEl = document.getElementById('sidebar');
            const hamburgerButton = document.getElementById('hamburgerButton');
            if (isSidebarOpen && sidebarEl && !sidebarEl.contains(target) && hamburgerButton && !hamburgerButton.contains(target)) closeSidebar();
        };
        if (browser) document.addEventListener('click', handleGlobalClickListener);
        
        handleEscKeyListener = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                if (isSidebarOpen) closeSidebar();
                closeOtherWindows('');
            }
        };
		if (browser) document.addEventListener('keydown', handleEscKeyListener);

		return () => {
            if (browser) {
                if (handleGlobalClickListener) document.removeEventListener('click', handleGlobalClickListener);
			    if (handleEscKeyListener) document.removeEventListener('keydown', handleEscKeyListener);
            }
            ['bellIcon', 'helpIcon', 'profileIcon'].forEach(iconId => {
                const iconElement = document.getElementById(iconId);
                if (iconElement && (iconElement as any).__clickHandler) {
                    iconElement.removeEventListener('click', (iconElement as any).__clickHandler);
                }
            });
            const darkModeButtonEl = document.getElementById('darkModeToggle');
            if (darkModeButtonEl) darkModeButtonEl.removeEventListener('click', toggleDarkMode);

            if (columnAnimationFrameId) cancelAnimationFrame(columnAnimationFrameId);
            if (cardAnimationFrameId) cancelAnimationFrame(cardAnimationFrameId);
		};
	});

    // --- KANBAN DRAG/DROP FUNCTIONS (DEFINED ONCE) ---
    function handleCardDragStart(event: DragEvent, task: PlaceholderTask, fromColumnId: PlaceholderColumn['id']) {
        if (event.dataTransfer && DUMMY_DRAG_IMAGE) {
            event.dataTransfer.setData('text/task-id', task.id);
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setDragImage(DUMMY_DRAG_IMAGE, 0, 0);
            draggedCardItem = { task, fromColumnId };
            activeDraggedCardElement = event.target as HTMLElement;
            const rect = activeDraggedCardElement.getBoundingClientRect();
            cardDragOffsetX = event.clientX - rect.left; cardDragOffsetY = event.clientY - rect.top;
            currentCardX = rect.left; currentCardY = rect.top;
            targetCardX = rect.left; targetCardY = rect.top;
            cardVelocityX = 0; cardVelocityY = 0;
            activeDraggedCardElement.style.position = 'fixed';
            activeDraggedCardElement.style.left = `${currentCardX}px`;
            activeDraggedCardElement.style.top = `${currentCardY}px`;
            activeDraggedCardElement.style.width = `${rect.width}px`;
            activeDraggedCardElement.style.height = `${rect.height}px`;
            activeDraggedCardElement.style.zIndex = '1001';
            activeDraggedCardElement.style.margin = '0';
            setTimeout(() => { activeDraggedCardElement?.classList.add('dragging-card'); }, 0);
            if (cardAnimationFrameId) cancelAnimationFrame(cardAnimationFrameId);
            cardAnimationFrameId = requestAnimationFrame(updateCardPosition);
        }
    }
    function handleCardDragMove(event: DragEvent) {
        if (!activeDraggedCardElement || !draggedCardItem) return;
        if (event.clientX === 0 && event.clientY === 0 && event.screenX === 0 && event.screenY === 0) return;
        targetCardX = event.clientX - cardDragOffsetX; targetCardY = event.clientY - cardDragOffsetY;
    }
    function updateCardPosition() {
        if (!activeDraggedCardElement || !draggedCardItem) { if (cardAnimationFrameId) cancelAnimationFrame(cardAnimationFrameId); cardAnimationFrameId = null; return; }
        let forceX = (targetCardX - currentCardX) * POS_SPRING_STIFFNESS; let forceY = (targetCardY - currentCardY) * POS_SPRING_STIFFNESS;
        cardVelocityX += forceX; cardVelocityY += forceY;
        cardVelocityX *= POS_DAMPING_FACTOR; cardVelocityY *= POS_DAMPING_FACTOR;
        currentCardX += cardVelocityX; currentCardY += cardVelocityY;
        if (Math.abs(cardVelocityX) < 0.1 && Math.abs(cardVelocityY) < 0.1 && Math.abs(targetCardX - currentCardX) < 0.1 && Math.abs(targetCardY - currentCardY) < 0.1) { currentCardX = targetCardX; currentCardY = targetCardY; cardVelocityX = 0; cardVelocityY = 0; }
        activeDraggedCardElement.style.left = `${currentCardX}px`; activeDraggedCardElement.style.top = `${currentCardY}px`;
        activeDraggedCardElement.style.transform = `rotate(2deg) scale(1.03)`;
        cardAnimationFrameId = requestAnimationFrame(updateCardPosition);
    }
    function handleCardDragOverItem(event: DragEvent, targetColumnId: PlaceholderColumn['id'], overTaskId?: string) {
        event.preventDefault(); event.stopPropagation();
        if (!draggedCardItem || draggedColumnItem) return;
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
        let position: 'before' | 'after' | undefined = undefined;
        if (overTaskId && draggedCardItem && overTaskId !== draggedCardItem.task.id) {
            const targetCardElement = document.getElementById(`task-${overTaskId}`);
            if (targetCardElement && targetCardElement !== activeDraggedCardElement) { const rect = targetCardElement.getBoundingClientRect(); const midpointY = rect.top + rect.height / 2; position = event.clientY < midpointY ? 'before' : 'after'; }
        }
        if (currentCardDragOverInfo?.columnId !== targetColumnId || currentCardDragOverInfo?.overTaskId !== overTaskId || currentCardDragOverInfo?.position !== position) { currentCardDragOverInfo = { columnId: targetColumnId, overTaskId: (draggedCardItem && overTaskId === draggedCardItem.task.id) ? undefined : overTaskId, position }; }
    }
    function handleCardDragLeaveItem(event: DragEvent, itemType: 'column' | 'card', itemId: string) {
        event.stopPropagation(); if (!draggedCardItem) return;
        const relatedTarget = event.relatedTarget as Node | null; const currentTarget = event.currentTarget as HTMLElement;
        if (!relatedTarget || !currentTarget.closest('.kanban-board')?.contains(relatedTarget)) { currentCardDragOverInfo = null; return; }
        if (itemType === 'card' && currentCardDragOverInfo?.overTaskId === itemId) { const columnElement = currentTarget.closest('.kanban-column'); if (columnElement && columnElement.contains(relatedTarget) && !(relatedTarget as HTMLElement).closest('.kanban-card')) { currentCardDragOverInfo = { columnId: currentCardDragOverInfo.columnId }; } }
    }
    function handleDropOnCardOrColumn(event: DragEvent, targetColumnId: PlaceholderColumn['id'], dropTargetTaskId?: string) {
        event.preventDefault(); event.stopPropagation();
        if (draggedColumnItem) return; if (!draggedCardItem) { cleanupCardDragState(); return; }
        const { task: taskToMove, fromColumnId } = draggedCardItem;
        if (dropTargetTaskId === taskToMove.id && targetColumnId === fromColumnId) { cleanupCardDragState(); return; }
        
        const sourceColIndex = boardColumns.findIndex(col => col.id === fromColumnId);
        if (sourceColIndex === -1) { cleanupCardDragState(); return; }
        
        const taskIndexInSource = boardColumns[sourceColIndex].tasks.findIndex(t => t.id === taskToMove.id);
        if (taskIndexInSource > -1) {
            boardColumns[sourceColIndex].tasks.splice(taskIndexInSource, 1);
        }

        const destColIndex = boardColumns.findIndex(col => col.id === targetColumnId);
        if (destColIndex === -1) { // Should not happen if columns are fixed
            if (taskIndexInSource > -1) boardColumns[sourceColIndex].tasks.splice(taskIndexInSource, 0, taskToMove); // Put back if dest not found
            cleanupCardDragState(); 
            return; 
        }

        let inserted = false;
        if (dropTargetTaskId && currentCardDragOverInfo?.position && (draggedCardItem && dropTargetTaskId !== draggedCardItem.task.id)) {
            const targetIndexInDest = boardColumns[destColIndex].tasks.findIndex(t => t.id === dropTargetTaskId);
            if (targetIndexInDest > -1) {
                if (currentCardDragOverInfo.position === 'before') {
                    boardColumns[destColIndex].tasks.splice(targetIndexInDest, 0, taskToMove);
                } else {
                    boardColumns[destColIndex].tasks.splice(targetIndexInDest + 1, 0, taskToMove);
                }
                inserted = true;
            }
        }
        
        if (!inserted) {
            boardColumns[destColIndex].tasks.push(taskToMove);
        }
        
        boardColumns = [...boardColumns]; // Trigger Svelte reactivity
        saveBoardStateToLocalStorage(); // Persist changes
    }
    function handleCardDragEnd() {
        if (cardAnimationFrameId) { cancelAnimationFrame(cardAnimationFrameId); cardAnimationFrameId = null; }
        if (activeDraggedCardElement) { activeDraggedCardElement.classList.remove('dragging-card'); activeDraggedCardElement.style.position = ''; activeDraggedCardElement.style.left = ''; activeDraggedCardElement.style.top = ''; activeDraggedCardElement.style.width = ''; activeDraggedCardElement.style.height = ''; activeDraggedCardElement.style.zIndex = ''; activeDraggedCardElement.style.transform = ''; activeDraggedCardElement.style.margin = ''; }
        cleanupCardDragState();
    }
    function cleanupCardDragState() { draggedCardItem = null; currentCardDragOverInfo = null; activeDraggedCardElement = null; cardDragOffsetX = 0; cardDragOffsetY = 0; currentCardX = 0; currentCardY = 0; targetCardX = 0; targetCardY = 0; cardVelocityX = 0; cardVelocityY = 0; if(cardAnimationFrameId) cancelAnimationFrame(cardAnimationFrameId); cardAnimationFrameId = null; }

    function handleColumnDragStart(event: DragEvent, column: PlaceholderColumn) {
        if (event.dataTransfer && DUMMY_DRAG_IMAGE) { event.dataTransfer.setData('text/column-id', column.id); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setDragImage(DUMMY_DRAG_IMAGE, 0, 0); draggedColumnItem = column; activeDraggedColumnElement = (event.target as HTMLElement).closest('.kanban-column') as HTMLElement; if (activeDraggedColumnElement) { const rect = activeDraggedColumnElement.getBoundingClientRect(); columnDragOffsetX = event.clientX - rect.left; columnDragOffsetY = event.clientY - rect.top; currentColumnX = rect.left; currentColumnY = rect.top; targetColumnX = rect.left; targetColumnY = rect.top; velocityX = 0; velocityY = 0; currentRotation = 0; targetRotation = 0; rotationVelocity = 0; currentSkewX = 0; targetSkewX = 0; skewXVelocity = 0; activeDraggedColumnElement.style.position = 'fixed'; activeDraggedColumnElement.style.left = `${currentColumnX}px`; activeDraggedColumnElement.style.top = `${currentColumnY}px`; activeDraggedColumnElement.style.width = `${rect.width}px`; activeDraggedColumnElement.style.height = `${rect.height}px`; activeDraggedColumnElement.style.zIndex = '1000'; activeDraggedColumnElement.style.transformOrigin = `${columnDragOffsetX}px ${columnDragOffsetY}px`; setTimeout(() => { activeDraggedColumnElement?.classList.add('dragging-column'); },0); if (columnAnimationFrameId) cancelAnimationFrame(columnAnimationFrameId); columnAnimationFrameId = requestAnimationFrame(updateColumnEffects); } }
        event.stopPropagation();
    }
    function handleColumnDrag(event: DragEvent) { if (!activeDraggedColumnElement || !draggedColumnItem) return; if (event.clientX === 0 && event.clientY === 0 && event.screenX === 0 && event.screenY ===0) return; targetColumnX = event.clientX - columnDragOffsetX; targetColumnY = event.clientY - columnDragOffsetY; }
    function updateColumnEffects() { if (!activeDraggedColumnElement) { if (columnAnimationFrameId) cancelAnimationFrame(columnAnimationFrameId); columnAnimationFrameId = null; return; } let forceX = (targetColumnX - currentColumnX) * POS_SPRING_STIFFNESS; let forceY = (targetColumnY - currentColumnY) * POS_SPRING_STIFFNESS; velocityX += forceX; velocityY += forceY; velocityX *= POS_DAMPING_FACTOR; velocityY *= POS_DAMPING_FACTOR; currentColumnX += velocityX; currentColumnY += velocityY; targetSkewX = -velocityX * 0.5; targetSkewX = Math.max(-MAX_SKEW_X, Math.min(MAX_SKEW_X, targetSkewX)); targetRotation = -velocityX * 0.2; targetRotation = Math.max(-MAX_ROTATION, Math.min(MAX_ROTATION, targetRotation)); let forceSkew = (targetSkewX - currentSkewX) * DEFORM_SPRING_STIFFNESS; skewXVelocity += forceSkew; skewXVelocity *= DEFORM_DAMPING_FACTOR; currentSkewX += skewXVelocity; let forceRot = (targetRotation - currentRotation) * DEFORM_SPRING_STIFFNESS; rotationVelocity += forceRot; rotationVelocity *= DEFORM_DAMPING_FACTOR; currentRotation += rotationVelocity; if (Math.abs(velocityX) < 0.1 && Math.abs(velocityY) < 0.1 && Math.abs(targetColumnX - currentColumnX) < 0.1 && Math.abs(targetColumnY - currentColumnY) < 0.1) { if (Math.abs(currentSkewX) < 0.1 && Math.abs(currentRotation) < 0.1) { currentColumnX = targetColumnX; currentColumnY = targetColumnY; velocityX = 0; velocityY = 0; currentSkewX = 0; targetSkewX = 0; skewXVelocity = 0; currentRotation = 0; targetRotation = 0; rotationVelocity = 0; } } activeDraggedColumnElement.style.left = `${currentColumnX}px`; activeDraggedColumnElement.style.top = `${currentColumnY}px`; const baseTransform = "translateY(-6px) scale(1.02)"; activeDraggedColumnElement.style.transform = `rotate(${currentRotation}deg) skewX(${currentSkewX}deg) ${baseTransform}`; columnAnimationFrameId = requestAnimationFrame(updateColumnEffects); }
    function handleBoardDragOver(event: DragEvent) { event.preventDefault(); if (!draggedColumnItem || draggedCardItem) return; if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'; const boardElement = (event.currentTarget as HTMLElement).querySelector('.kanban-board'); if (!boardElement || !activeDraggedColumnElement) return; const staticColumns = Array.from(boardElement.querySelectorAll('.kanban-column:not(.dragging-column)')) as HTMLElement[]; let newIndex = staticColumns.length; const mouseX = event.clientX; for (let i = 0; i < staticColumns.length; i++) { const staticColRect = staticColumns[i].getBoundingClientRect(); const staticColCenterX = staticColRect.left + staticColRect.width / 2; if (mouseX < staticColCenterX) { newIndex = i; break; } } if (columnDragOverIndex !== newIndex) { columnDragOverIndex = newIndex; } }
    function handleBoardDragLeave(event: DragEvent) { if (!draggedColumnItem) return; const boardContainer = event.currentTarget as HTMLElement; const board = boardContainer.querySelector('.kanban-board'); if (board && event.relatedTarget && !board.contains(event.relatedTarget as Node)) { columnDragOverIndex = null; } else if (!event.relatedTarget) { columnDragOverIndex = null; } }
    function handleColumnDropOnBoard(event: DragEvent) {
        event.preventDefault(); event.stopPropagation();
        if (!draggedColumnItem || draggedCardItem) { cleanupColumnDragState(); return; }
        const droppedColumnId = event.dataTransfer?.getData('text/column-id');
        if (!draggedColumnItem || !droppedColumnId || droppedColumnId !== draggedColumnItem.id) {
            cleanupColumnDragState(); return;
        }
        
        const fromIndex = boardColumns.findIndex(col => col.id === draggedColumnItem!.id);
        if (fromIndex > -1 && columnDragOverIndex !== null && columnDragOverIndex !== fromIndex) {
            const [movedColumn] = boardColumns.splice(fromIndex, 1);
            boardColumns.splice(columnDragOverIndex, 0, movedColumn);
            boardColumns = [...boardColumns]; // Trigger reactivity
            saveBoardStateToLocalStorage(); // Persist changes
        }
        // No cleanupColumnDragState() here, it's called in dragEnd
    }
    function handleColumnDragEnd() {
        if (columnAnimationFrameId) { cancelAnimationFrame(columnAnimationFrameId); columnAnimationFrameId = null; }
        if (activeDraggedColumnElement) {
            activeDraggedColumnElement.classList.remove('dragging-column');
            activeDraggedColumnElement.style.position = ''; activeDraggedColumnElement.style.left = '';
            activeDraggedColumnElement.style.top = ''; activeDraggedColumnElement.style.width = '';
            activeDraggedColumnElement.style.height = ''; activeDraggedColumnElement.style.zIndex = '';
            activeDraggedColumnElement.style.transformOrigin = ''; activeDraggedColumnElement.style.transform = '';
        }
        cleanupColumnDragState();
    }
    function cleanupColumnDragState() { draggedColumnItem = null; activeDraggedColumnElement = null; columnDragOverIndex = null; columnDragOffsetX = 0; columnDragOffsetY = 0; velocityX = 0; velocityY = 0; currentColumnX = 0; currentColumnY = 0; targetColumnX = 0; targetColumnY = 0; currentRotation = 0; targetRotation = 0; rotationVelocity = 0; currentSkewX = 0; targetSkewX = 0; skewXVelocity = 0; if(columnAnimationFrameId) cancelAnimationFrame(columnAnimationFrameId); columnAnimationFrameId = null; }
    // --- END KANBAN DRAG/DROP FUNCTIONS ---
</script>

<!-- HTML Structure (Identical to your provided HTML, so not repeated here for brevity) -->
<div class="page-wrapper font-sans">
	{#if isSidebarOpen}
    <aside
        id="sidebar"
        class="sidebar-container"
        transition:fly={{ x: -300, duration: 300, easing: quintOut }}
    >
      <div>
        <div class="sidebar-header">
          <img src="/logonamin.png" alt="Microtask Logo" class="sidebar-logo-img" />
          <h1 class="sidebar-title">Microtask</h1>
        </div>
        <nav class="sidebar-nav">
          <a href="/home" class="nav-link" class:active={$page.url.pathname === '/home' || $page.url.pathname === '/'}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="nav-icon" aria-hidden="true"><path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" /><path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75-.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" /></svg>
            <span>Home</span>
          </a>
          <a href="/dashboard" class="nav-link" class:active={$page.url.pathname === '/dashboard'}>
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="nav-icon" aria-hidden="true"><path fill-rule="evenodd" d="M1 4a1 1 0 011-1h16a1 1 0 011 1v2.5a1 1 0 01-1 1H2a1 1 0 01-1-1V4zM2 9.5a1 1 0 011-1h4.5a1 1 0 011 1v6.5a1 1 0 01-1 1H3a1 1 0 01-1-1V9.5zM12.5 9.5A1 1 0 0011.5 10.5v6.5a1 1 0 001 1h4.5a1 1 0 001-1V9.5a1 1 0 00-1-1h-4.5z" clip-rule="evenodd" /></svg>
            <span>Dashboard</span>
          </a>
          <a href="/kanban" class="nav-link" class:active={$page.url.pathname.startsWith('/kanban') || $page.url.pathname.startsWith('/tasks')}> <!-- Updated active check -->
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="nav-icon" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" /></svg>
            <span>Kanban Board</span>
          </a>
          <a href="/calendar" class="nav-link" class:active={$page.url.pathname === '/calendar'}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="nav-icon" aria-hidden="true"><path fill-rule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zM5.25 6.75c-.621 0-1.125.504-1.125 1.125V18a1.125 1.125 0 001.125 1.125h13.5A1.125 1.125 0 0019.875 18V7.875c0-.621-.504-1.125-1.125-1.125H5.25z" clip-rule="evenodd" /><path d="M10.5 9.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H10.5v-.01a.75.75 0 000-1.5zM10.5 12.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H10.5v-.01a.75.75 0 000-1.5zM10.5 15.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H10.5v-.01a.75.75 0 000-1.5zM13.5 9.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H13.5v-.01a.75.75 0 000-1.5zM13.5 12.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H13.5v-.01a.75.75 0 000-1.5zM13.5 15.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H13.5v-.01a.75.75 0 000-1.5zM16.5 9.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H16.5v-.01a.75.75 0 000-1.5zM16.5 12.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H16.5v-.01a.75.75 0 000-1.5zM16.5 15.75a.75.75 0 00-1.5 0v.01c0 .414.336.75.75.75H16.5v-.01a.75.75 0 000-1.5z"/></svg>
            <span>Calendar</span>
          </a>
          <a href="/ai-chat" class="nav-link" class:active={$page.url.pathname === '/ai-chat'}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="nav-icon" aria-hidden="true"><path d="M12.001 2.504a2.34 2.34 0 00-2.335 2.335v.583c0 .582.212 1.13.582 1.556l.03.035-.03.034a2.34 2.34 0 00-2.917 3.916A3.287 3.287 0 004.08 14.25a3.287 3.287 0 003.287 3.287h8.266a3.287 3.287 0 003.287-3.287 3.287 3.287 0 00-1.253-2.583 2.34 2.34 0 00-2.917-3.916l-.03-.034.03-.035c.37-.425.582-.973.582-1.555v-.583a2.34 2.34 0 00-2.335-2.336h-.002zM9.75 12.75a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5z" /><path fill-rule="evenodd" d="M12 1.5c5.79 0 10.5 4.71 10.5 10.5S17.79 22.5 12 22.5 1.5 17.79 1.5 12 6.21 1.5 12 1.5zM2.85 12a9.15 9.15 0 019.15-9.15 9.15 9.15 0 019.15 9.15 9.15 9.15 0 01-9.15 9.15A9.15 9.15 0 012.85 12z" clip-rule="evenodd" /></svg>
            <span>Ask Synthia</span>
          </a>
        </nav>
      </div>
		<button on:click={handleLogout} class="logout-button">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="nav-icon" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
        <span>Log out</span>
      </button>
    </aside>
	{/if}

	<div class="main-content-wrapper">
		<header class="top-header">
			<div class="header-left">
				<button id="hamburgerButton" class="menu-btn" on:click={toggleSidebar} aria-label="Toggle Sidebar">
            		<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
				</button>
                <a href="/home" class="logo">
                    <img src="/logonamin.png" alt="Microtask Logo" />
                    <span class="top-header-logo-text">Microtask</span>
                </a>
			</div>
			<div class="header-icons">
                <div class="relative">
                    <button id="bellIcon" class="header-icon-btn" aria-label="Notifications">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0c-1.673-.253-3.287-.673-4.831-1.243a.75.75 0 01-.297-1.206C4.45 13.807 5.25 11.873 5.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0H9.752z" clip-rule="evenodd" /></svg>
                    </button>
                    <div id="notifWindow" class="dropdown-window hidden-dropdown w-80">
                        <h3 class="dropdown-title">Notifications</h3> <p class="dropdown-empty-text">No new notifications.</p>
                    </div>
                </div>
                <div class="relative">
                    <button id="helpIcon" class="header-icon-btn" aria-label="Help & FAQ">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.042.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" /></svg>
                    </button>
                    <div id="helpWindow" class="dropdown-window hidden-dropdown">
                        <h3 class="dropdown-title">FAQ</h3><ul class="dropdown-list"><li>How do I add a task?</li><li>Where is the calendar?</li></ul><a href="/support" class="dropdown-link">Visit Support</a>
                    </div>
                </div>
                <div class="relative">
                    <button id="profileIcon" class="header-icon-btn" aria-label="Profile Menu">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clip-rule="evenodd" /></svg>
                    </button>
                    <div id="profileWindow" class="dropdown-window hidden-dropdown">
                        <h3 class="dropdown-title">Profile</h3>
                        <p class="dropdown-user-welcome">Welcome, {usernameForDisplay}!</p>
                        <button on:click={handleLogout} class="profile-dropdown-button logout-action-button">Logout</button>
                    </div>
                </div>
                <button id="darkModeToggle" aria-label="Toggle Dark Mode" class="darkmode-toggle-button">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        {#if isDarkMode} <path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 0 0-.103.103l1.132 1.132a.75.75 0 0 0 1.06 0l1.132-1.132a.75.75 0 0 0-.103-1.06l-1.132-1.132a.75.75 0 0 0-1.06 0L9.63 1.615a.75.75 0 0 0-.102.103ZM12 3.75a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75ZM18.282 5.282a.75.75 0 0 0-1.06 0l-1.132 1.132a.75.75 0 0 0 .103 1.06l1.132 1.132a.75.75 0 0 0 1.06 0l1.132-1.132a.75.75 0 0 0-.103-1.06l-1.132-1.132a.75.75 0 0 0 0-.103ZM19.5 12a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 .75.75ZM18.282 18.718a.75.75 0 0 0 0 1.06l1.132 1.132a.75.75 0 0 0 1.06 0l1.132-1.132a.75.75 0 0 0-.103-1.06l-1.132-1.132a.75.75 0 0 0-1.06 0l-1.132 1.132a.75.75 0 0 0 .103.103ZM12 18.75a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 .75.75ZM5.718 18.718a.75.75 0 0 0 1.06 0l1.132-1.132a.75.75 0 0 0-.103-1.06l-1.132-1.132a.75.75 0 0 0-1.06 0L4.586 17.686a.75.75 0 0 0 .103 1.06l1.132 1.132a.75.75 0 0 0 0 .103ZM4.5 12a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0-1.5h-1.5a.75.75 0 0 1-.75-.75ZM5.718 5.282a.75.75 0 0 0 0-1.06l-1.132-1.132a.75.75 0 0 0-1.06 0L2.39 4.114a.75.75 0 0 0 .103 1.06l1.132 1.132a.75.75 0 0 0 1.06 0l1.132-1.132a.75.75 0 0 0-.103-.103ZM12 6.75a5.25 5.25 0 0 1 5.25 5.25 5.25 5.25 0 0 1-5.25 5.25 5.25 5.25 0 0 1-5.25-5.25 5.25 5.25 0 0 1 5.25-5.25Z" clip-rule="evenodd" />
                        {:else} <path fill-rule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM12 16.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Z" clip-rule="evenodd" /> {/if}
                    </svg>
                </button>
            </div>
		</header>

        <main class="main-content-kanban">
            <div class="board-header-kanban">
                <h1 class="board-title-kanban">Project Alpha Tasks</h1>
            </div>
            <div
                class="kanban-board-scroll-container"
                on:dragover={handleBoardDragOver}
                on:dragleave={handleBoardDragLeave}
                on:drop={handleColumnDropOnBoard}
            >
                <div class="kanban-board">
                    {#each boardColumns as column, i (column.id)}
                        {#if draggedColumnItem && columnDragOverIndex === i }
                            <div class="column-drop-placeholder" style="height: {activeDraggedColumnElement?.offsetHeight || 150}px;"></div>
                        {/if}
                        <div 
                            class="kanban-column" 
                            class:drag-over-column={currentCardDragOverInfo?.columnId === column.id && !currentCardDragOverInfo?.overTaskId && draggedCardItem} 
                            data-column-id={column.id} 
                            on:dragover={(e) => { if(draggedCardItem) handleCardDragOverItem(e, column.id); else e.preventDefault(); }} 
                            on:dragleave={(e) => { if(draggedCardItem) handleCardDragLeaveItem(e, 'column', column.id);}} 
                            on:drop={(e) => { if(draggedCardItem) handleDropOnCardOrColumn(e, column.id);}}
                        >
                            <div class="column-header" draggable="true" on:dragstart={(e) => handleColumnDragStart(e, column)} on:drag={handleColumnDrag} on:dragend={handleColumnDragEnd}>
                                <h3 class="column-title">{column.title}</h3>
                                <span class="column-task-count">{column.tasks.length}</span>
                                <button class="column-options-button" title="Column options">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 3C10.9 3 10 3.9 10 5C10 6.1 10.9 7 12 7C13.1 7 14 6.1 14 5C14 3.9 13.1 3 12 3ZM12 17C10.9 17 10 17.9 10 19C10 20.1 10.9 21 12 21C13.1 21 14 20.1 14 19C14 17.9 13.1 17 12 17ZM12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10Z"></path></svg>
                                </button>
                            </div>
                            <div class="kanban-column-content">
                                {#if column.tasks.length === 0 && !draggedCardItem && !(currentCardDragOverInfo?.columnId === column.id && draggedCardItem)}
                                    <div 
                                        class="empty-column-dropzone" 
                                        on:dragover={(e) => { if(draggedCardItem) handleCardDragOverItem(e, column.id); else e.preventDefault(); }} 
                                        on:drop={(e) => { if(draggedCardItem) handleDropOnCardOrColumn(e, column.id);}}
                                    >Drop card here</div>
                                {/if}
                                {#each column.tasks as task (task.id)}
                                    <div 
                                        class="kanban-card priority-{task.priority || 'standard'}" 
                                        class:drag-over-card-before={currentCardDragOverInfo?.overTaskId === task.id && currentCardDragOverInfo?.position === 'before' && activeDraggedCardElement?.id !== `task-${task.id}` } 
                                        class:drag-over-card-after={currentCardDragOverInfo?.overTaskId === task.id && currentCardDragOverInfo?.position === 'after' && activeDraggedCardElement?.id !== `task-${task.id}` } 
                                        draggable="true" 
                                        id="task-{task.id}" 
                                        on:dragstart={(e) => handleCardDragStart(e, task, column.id)} 
                                        on:drag={handleCardDragMove} 
                                        on:dragend={handleCardDragEnd} 
                                        on:dragover={(e) => handleCardDragOverItem(e, column.id, task.id)} 
                                        on:dragleave={(e) => handleCardDragLeaveItem(e, 'card', task.id)} 
                                        on:drop={(e) => handleDropOnCardOrColumn(e, column.id, task.id)}
                                    >
                                        <div class="card-labels"></div>
                                        <h4 class="card-title">{task.title}</h4>
                                        {#if task.description} <p class="card-description-preview">{task.description.substring(0, 70)}{task.description.length > 70 ? '...' : ''}</p> {/if}
                                        <div class="card-footer">
                                            <div class="card-meta-icons">
                                                {#if task.description} <span class="meta-icon" title="Has description"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M3 18H21V16H3V18ZM3 13H21V11H3V13ZM3 8H21V6H3V8Z"></path></svg></span> {/if}
                                                {#if task.dueDateISO} <span class="meta-icon" title="Due date: {task.dueDateISO}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M17 3H19V5H17V3M17 7H19V9H17V7M5 3H7V5H5V3M5 7H7V9H5V7M16 1V3H8V1H6V3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3H18V1H16M19 19H5V10H19V19Z"></path></svg><span class="due-date-text">{new Date(task.dueDateISO).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></span> {/if}
                                            </div>
                                        </div>
                                    </div>
                                {/each}
                                {#if !draggedColumnItem && !draggedCardItem && column.tasks.length > 0 }  
                                    <button class="add-card-button">+ Add a card</button>
                                {/if}
                            </div>
                        </div>
                    {/each}
                    {#if draggedColumnItem && columnDragOverIndex === boardColumns.length}
                        <div class="column-drop-placeholder" style="height: {activeDraggedColumnElement?.offsetHeight || 150}px;"></div>
                    {/if}
                    <div class="add-list-wrapper">
                        <button class="add-list-button">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style="margin-right: 4px;"><path d="M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z"></path></svg>
                            Add another list
                        </button>
                    </div>
                </div>
            </div>
        </main>
	</div>
</div>

<style>
    /* --- DASHBOARD STYLES (Copied Verbatim from your dashboard component) --- */
    /* --- Base Styles & Font --- */
    .font-sans {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .page-wrapper { /* Applied to the root div */
        display: flex;
        height: 100vh;
        color: #1f2937; /* text-gray-800 */
        background-color: #ffffff; /* Default light background for the entire wrapper */
    }
    canvas { display: block; }
    .hidden-dropdown { display: none !important; } 
    .capitalize { text-transform: capitalize; }

	/* --- Sidebar --- */
    .sidebar-container {
        background-color: #ffffff; 
        border-right: 1px solid #e5e7eb; 
        color: #374151; 
        position: fixed; top: 0; left: 0; height: 100%; width: 16rem; /* w-64 */
        box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); /* shadow-lg */
        z-index: 50; display: flex; flex-direction: column; justify-content: space-between;
        padding: 1rem; /* p-4 */
        box-sizing: border-box;
    }
    .sidebar-header {
        display: flex; align-items: center; gap: 0.5rem; /* gap-2 */
        margin-bottom: 2rem; /* mb-8 */
        padding-bottom: 1rem; /* pb-4 */
        border-bottom: 1px solid #e5e7eb;
    }
    .sidebar-logo-img { width: 2rem; height: 2rem; } /* w-8 h-8 */
    .sidebar-title { color: #1f2937; font-size: 1.25rem; font-weight: 700; } /* text-xl font-bold */
    
    .sidebar-nav { display: flex; flex-direction: column; gap: 0.5rem; /* gap-2 */ }
    .nav-link {
        color: #374151; 
        display: flex; align-items: center; gap: 0.75rem; /* gap-3 */
        padding: 0.5rem 0.75rem; /* px-3 py-2 */
        border-radius: 0.375rem; /* rounded-md */
        font-weight: 600; /* font-semibold */
        transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 150ms;
        text-decoration: none;
    }
    .nav-link:hover { background-color: #f3f4f6;  }
    .nav-link.active { background-color: #2563eb; color: #ffffff; }
    .nav-icon { width: 1.25rem; height: 1.25rem; } /* w-5 h-5 */
    .nav-link.active .nav-icon { filter: brightness(0) invert(1); }

    .logout-button {
        color: #374151;
        display: flex; align-items: center; gap: 0.75rem;
        padding: 0.5rem 0.75rem; border-radius: 0.375rem; font-weight: 600;
        width: 100%; margin-top: auto;
        transition: background-color 150ms ease;
        background: none; border: none; cursor: pointer; text-align: left;
    }
    .logout-button:hover { background-color: #f3f4f6; }
    .logout-button .nav-icon { width: 1.25rem; height: 1.25rem; }

    /* --- Top Header --- */
    .top-header {
        position: fixed; top: 0; /* left: 0; by default */ right: 0;
        width: 100%; 
        display: flex; align-items: center; justify-content: space-between;
        padding: 0 1rem; height: 60px; z-index: 40;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        transition: background-color 0.2s, border-color 0.2s, left 0.3s ease; /* Added left transition */
        background-color: #ffffff; 
        border-bottom: 1px solid #e5e7eb;
        color: #1f2937; 
        box-sizing: border-box;
    }
    .header-left { display: flex; align-items: center; gap: 0.75rem; }
    .top-header .menu-btn {
        background: none; border: none; cursor: pointer; padding: 0.5rem;
        border-radius: 9999px; transition: background-color 0.15s ease;
        display: flex; align-items: center; justify-content: center;
        color: inherit; 
    }
    .top-header .menu-btn svg { width: 1.5rem; height: 1.5rem; }
    .top-header .menu-btn:hover { background-color: #f3f4f6; }
    .top-header .logo { display: flex; align-items: center; gap: 0.5rem; text-decoration: none;}
    .top-header .logo img { height: 2rem; width: auto; } 
    .top-header .logo .top-header-logo-text { color: #1f2937; font-weight: 600; font-size: 1.25rem; }

    .top-header .header-icons { display: flex; align-items: center; gap: 0.25rem; }
    .top-header .header-icons .header-icon-btn {
        background: none; border: none; cursor: pointer; padding: 0.5rem;
        line-height: 0; display: flex; align-items: center; justify-content: center;
        border-radius: 9999px; width: 36px; height: 36px;
        transition: background-color 0.15s ease; color: inherit;
    }
    .top-header .header-icons .header-icon-btn svg { width: 1.25rem; height: 1.25rem; }
    .top-header .header-icons .header-icon-btn:hover { background-color: #f3f4f6; }
    
    .darkmode-toggle-button { 
        margin-left: 0.5rem; padding: 0.375rem;
        background: none; border: none; cursor: pointer;
        line-height: 0; display: flex; align-items: center; justify-content: center;
        border-radius: 9999px; width: 36px; height: 36px;
        transition: background-color 0.15s ease; color: #374151;
    }
    .darkmode-toggle-button svg { width: 1.25rem; height: 1.25rem; }
    .darkmode-toggle-button:hover { background-color: #f3f4f6; }

    /* Dropdown Windows */
    .relative { position: relative; } 
    .dropdown-window {
        position: absolute; right: 0; top: calc(100% + 8px);
        border-radius: 0.5rem; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        padding: 0.75rem; 
        z-index: 50;
        opacity: 0; transform: translateY(-5px) scale(0.98);
        transition: opacity 0.15s ease-out, transform 0.15s ease-out;
        pointer-events: none; visibility: hidden;
        background-color: #ffffff; 
        border: 1px solid #e5e7eb; 
        color: #374151; 
        box-sizing: border-box;
    }
    .dropdown-window.w-80 { width: 20rem; } 
    .dropdown-window:not(.hidden-dropdown) {
        opacity: 1; transform: translateY(0) scale(1);
        pointer-events: auto; visibility: visible;
    }
    .dropdown-title { font-weight: 600; margin-bottom: 0.5rem; font-size: 0.875rem; }
    .dropdown-empty-text { font-size: 0.75rem; text-align: center; padding-top: 1rem; padding-bottom: 1rem;}
    .dropdown-list { list-style-type: disc; list-style-position: inside; margin-top: 0.25rem; font-size: 0.75rem; padding-left: 1rem; }
    .dropdown-list > li:not(:first-child) { margin-top: 0.25rem; }
    .dropdown-link { font-size: 0.75rem; color: #2563eb; margin-top: 0.5rem; display: block; }
    .dropdown-link:hover { text-decoration: underline; }
    .dropdown-user-welcome { font-size: 0.75rem; margin-bottom: 0.5rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;}
    .profile-dropdown-button.logout-action-button { 
        background-color: #fee2e2; color: #b91c1c; 
        font-size: 0.75rem; padding: 0.375rem 0.5rem; border-radius: 0.25rem;
        width: 100%; text-align: left;
        transition: background-color 150ms; border: none; cursor: pointer;
    }
    .profile-dropdown-button.logout-action-button:hover { background-color: #fecaca; }
    
    .main-content-wrapper {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden; 
    }

    /* Main Content Area for Kanban Board itself */
    .main-content-kanban {
        padding-top: 60px; /* Fixed header height */
        flex-grow: 1; display: flex; flex-direction: column; 
        overflow: hidden; box-sizing: border-box; 
        background-color: var(--bg-light);
        color: var(--text-light-primary);
    }
    .board-header-kanban { display: flex; align-items: center; padding: 10px 1rem; flex-shrink: 0; box-sizing: border-box; }
    .board-title-kanban { font-size: 1.25rem; font-weight: 700; color: inherit; margin: 0; }


    /* === DARK MODE STYLES === */
    :global(body.dark) .page-wrapper { color: #d1d5db; background-color: var(--bg-dark); }
    :global(body.dark) .sidebar-container { background-color: #1f2937; border-right-color: #374151; color: #d1d5db; }
    :global(body.dark) .sidebar-header { border-bottom-color: #374151; }
    :global(body.dark) .sidebar-title { color: #f3f4f6; }
    :global(body.dark) .nav-link { color: #d1d5db; }
    :global(body.dark) .nav-link:hover { background-color: #374151; }
    :global(body.dark) .nav-link.active { background-color: #1e40af; }
    :global(body.dark) .logout-button { color: #d1d5db; }
    :global(body.dark) .logout-button:hover { background-color: #374151; }

    :global(body.dark) .top-header { background-color: #1f2937; border-bottom-color: #374151; color: #d1d5db; }
    :global(body.dark) .top-header .logo .top-header-logo-text { color: #f3f4f6; }
    :global(body.dark) .top-header .menu-btn:hover { background-color: #374151; }
    :global(body.dark) .top-header .header-icons .header-icon-btn:hover { background-color: #374151; }
    :global(body.dark) .darkmode-toggle-button { color: #d1d5db; }
    :global(body.dark) .darkmode-toggle-button:hover { background-color: #374151; }

    :global(body.dark) .dropdown-window { background-color: #374151; border-color: #4b5563; color: #f3f4f6; }
    :global(body.dark) .dropdown-link { color: #60a5fa; }
    :global(body.dark) .profile-dropdown-button.logout-action-button { background-color: #7f1d1d; color: #fca5a5; }
    :global(body.dark) .profile-dropdown-button.logout-action-button:hover { background-color: #991b1b; }
    
    :global(body.dark) .main-content-kanban { background-color: var(--bg-dark); color: var(--text-dark-primary); }


    /* --- KANBAN BOARD SPECIFIC STYLES (Themed with CSS Variables) --- */
    :root {
        --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        --bg-light: #f3f4f6; --bg-dark: #18181b; /* Main page background */
        --text-light-primary: #1f2937; --text-light-secondary: #4b5563;
        --text-dark-primary: #f3f4f6; --text-dark-secondary: #9ca3af;
        --border-light: #e5e7eb; --border-dark: #374151;
        /* Surface for elements ON the main background (e.g., cards, columns) */
        --surface-light: #ffffff; --surface-dark: #1f2937; 
        --interactive-light: #2563eb; --interactive-dark: #1d4ed8;
        --interactive-hover-light: #f0f4f8; 
        --interactive-hover-dark: #2c3a4f; 
        --priority-high-light: #ef4444; --priority-high-dark: #f87171;
        --priority-medium-light: #f59e0b; --priority-medium-dark: #fbbf24;
        --priority-low-light: #22c55e; --priority-low-dark: #4ade80;
        --priority-standard-light: #3b82f6; --priority-standard-dark: #60a5fa;
    }

    .kanban-board-scroll-container { flex-grow: 1; overflow-x: auto; overflow-y: hidden; padding: 10px; box-sizing: border-box; }
    .kanban-board { display: inline-flex; gap: 12px; padding-bottom: 10px; min-height: calc(100% - 10px); align-items: flex-start; box-sizing: border-box; }
    
    .kanban-column { background-color: var(--surface-light); border: 1px solid var(--border-light); border-radius: 8px; width: 280px; flex-shrink: 0; display: flex; flex-direction: column; max-height: calc(100% - 10px); /* Max height relative to scroll container */ padding: 0; box-sizing: border-box; box-shadow: 0 2px 4px rgba(0,0,0,0.04); }
    :global(body.dark) .kanban-column { background-color: var(--surface-dark); border-color: var(--border-dark); box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
    .kanban-column.drag-over-column { background-color: #e9eff1; }
    :global(body.dark) .kanban-column.drag-over-column { background-color: #2a3b4d; }
    
    .kanban-column.dragging-column { opacity: 0.9; border: 2px solid var(--interactive-light); background-color: var(--surface-light); box-shadow: 0 10px 20px rgba(0,0,0,0.1), 0 6px 6px rgba(0,0,0,0.1); pointer-events: none; transition: opacity 0.2s ease; }
    :global(body.dark) .kanban-column.dragging-column { border-color: var(--interactive-dark); background-color: var(--surface-dark); }
    
    .column-drop-placeholder { width: 280px; min-height: 100px; border: 2px dashed var(--border-light); background-color: rgba(0,0,0,0.02); border-radius: 8px; flex-shrink: 0; box-sizing: border-box; margin: 0 4px; }
    :global(body.dark) .column-drop-placeholder { border-color: var(--border-dark); background-color: rgba(255,255,255,0.02); }
    
    .column-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; cursor: grab; box-sizing: border-box; user-select: none; border-bottom: 1px solid var(--border-light); }
    :global(body.dark) .column-header { border-bottom-color: var(--border-dark); }
    .column-title { font-size: 0.95em; font-weight: 600; color: var(--text-light-primary); margin: 0; flex-grow: 1; padding-right: 5px; }
    :global(body.dark) .column-title { color: var(--text-dark-primary); }
    .column-task-count { font-size: 0.8em; color: var(--text-light-secondary); margin-left: 8px; background-color: var(--bg-light); padding: 2px 6px; border-radius: 4px;}
    :global(body.dark) .column-task-count { color: var(--text-dark-secondary); background-color: var(--bg-dark); }
    
    .column-options-button { background: transparent; border: none; color: var(--text-light-secondary); padding: 4px; cursor: pointer; border-radius: 999px; line-height: 1; transition: background-color 0.15s ease;}
    .column-options-button:hover { background-color: var(--interactive-hover-light); }
    :global(body.dark) .column-options-button { color: var(--text-dark-secondary); }
    :global(body.dark) .column-options-button:hover { background-color: var(--interactive-hover-dark); }
    
    .kanban-column-content { overflow-y: auto; flex-grow: 1; padding: 10px; min-height: 30px; box-sizing: border-box; display: flex; flex-direction: column; gap: 8px; }
    .empty-column-dropzone { flex-grow: 1; min-height: 60px; border: 2px dashed var(--border-light); border-radius: 6px; margin: 0; display: flex; align-items: center; justify-content: center; color: var(--text-light-secondary); font-size: 0.9em; }
    :global(body.dark) .empty-column-dropzone { border-color: var(--border-dark); color: var(--text-dark-secondary); }
    
    .kanban-column-content::-webkit-scrollbar { width: 8px; }
    .kanban-column-content::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 4px; } 
    .kanban-column-content::-webkit-scrollbar-track { background-color: transparent; }
    :global(body.dark) .kanban-column-content::-webkit-scrollbar-thumb { background-color: #475569; } 
    
    .kanban-card { background-color: var(--surface-light); border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.06), 0 1px 1px rgba(0,0,0,0.04); padding: 10px 12px; margin-bottom: 0; cursor: grab; word-wrap: break-word; font-size: 14px; color: var(--text-light-primary); position: relative; transition: border-top 0.1s linear, border-bottom 0.1s linear, background-color 0.15s ease; box-sizing: border-box; border-top: 3px solid transparent; border-bottom: 3px solid transparent; border-left: 4px solid transparent; }
    :global(body.dark) .kanban-card { background-color: var(--surface-dark); color: var(--text-dark-primary); box-shadow: 0 1px 2px rgba(0,0,0,0.2), 0 1px 1px rgba(0,0,0,0.2); }
    .kanban-card:hover:not(.dragging-card) { background-color: #f8fafc; } 
    :global(body.dark) .kanban-card:hover:not(.dragging-card) { background-color: #334155; } 
    
    .kanban-card.dragging-card { opacity: 0.85; box-shadow: 0 8px 16px rgba(0,0,0,0.12); border-color: transparent !important; pointer-events: none; transition: opacity 0.2s ease-in-out; }
    :global(body.dark) .kanban-card.dragging-card { box-shadow: 0 8px 16px rgba(0,0,0,0.35); }
    
    .kanban-card.drag-over-card-before { border-top-color: var(--interactive-light); }
    .kanban-card.drag-over-card-after { border-bottom-color: var(--interactive-light); }
    :global(body.dark) .kanban-card.drag-over-card-before { border-top-color: var(--interactive-dark); }
    :global(body.dark) .kanban-card.drag-over-card-after { border-bottom-color: var(--interactive-dark); }
    
    .card-title { margin: 0 0 6px 0; font-size: 0.9rem; font-weight: 500; line-height: 1.4; display: block; }
    .card-description-preview { font-size: 0.8rem; color: var(--text-light-secondary); margin-bottom: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; }
    :global(body.dark) .card-description-preview { color: var(--text-dark-secondary); }
    
    .card-footer { display: flex; justify-content: space-between; align-items: center; min-height: 20px; margin-top: 4px; }
    .card-meta-icons { display: flex; align-items: center; gap: 10px; color: var(--text-light-secondary); }
    :global(body.dark) .card-meta-icons { color: var(--text-dark-secondary); }
    .meta-icon { display: flex; align-items: center; gap: 4px; font-size: 0.75em; }
    .due-date-text { font-size: 0.85em; }
    
    .priority-high { border-left-color: var(--priority-high-light); }
    .priority-medium { border-left-color: var(--priority-medium-light); }
    .priority-low { border-left-color: var(--priority-low-light); }
    .priority-standard { border-left-color: var(--border-light); } 
    :global(body.dark) .priority-high { border-left-color: var(--priority-high-dark); }
    :global(body.dark) .priority-medium { border-left-color: var(--priority-medium-dark); }
    :global(body.dark) .priority-low { border-left-color: var(--priority-low-dark); }
    :global(body.dark) .priority-standard { border-left-color: var(--border-dark); }
    
    .add-card-button { background-color: transparent; border: none; color: var(--text-light-secondary); padding: 8px 10px; border-radius: 4px; text-align: left; width: 100%; cursor: pointer; font-size: 0.85em; box-sizing: border-box; transition: background-color 0.15s ease, color 0.15s ease; margin-top: 4px; }
    .add-card-button:hover { background-color: var(--interactive-hover-light); color: var(--interactive-light); }
    :global(body.dark) .add-card-button { color: var(--text-dark-secondary); }
    :global(body.dark) .add-card-button:hover { background-color: var(--interactive-hover-dark); color: var(--interactive-dark); }
    
    .add-list-wrapper { background-color: rgba(0,0,0,0.04); border-radius: 8px; width: 280px; flex-shrink: 0; padding: 6px; height: fit-content; box-sizing: border-box; }
    :global(body.dark) .add-list-wrapper { background-color: rgba(255,255,255,0.04); }
    .add-list-button { background-color: transparent; border: none; color: var(--text-light-secondary); padding: 8px 10px; border-radius: 6px; text-align: left; width: 100%; cursor: pointer; font-size: 0.9em; box-sizing: border-box; transition: background-color 0.15s ease, color 0.15s ease; display: flex; align-items: center; font-weight: 500; }
    .add-list-button:hover { background-color: rgba(0,0,0,0.06); color: var(--text-light-primary); }
    :global(body.dark) .add-list-button { color: var(--text-dark-secondary); }
    :global(body.dark) .add-list-button:hover { background-color: rgba(255,255,255,0.06); color: var(--text-dark-primary); }
</style>