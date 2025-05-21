  <style global>
  /* --- Dark Mode Base Styles --- */
  body.dark {
    background-color: #1f2937; /* Equivalent to Tailwind's gray-800 */
    color: #d1d5db; /* Equivalent to Tailwind's gray-300 */
    transition: background-color 0.3s ease, color 0.3s ease;
  }
  
  /* --- Headings --- */
  body.dark h1,
  body.dark h2,
  body.dark h3,
  body.dark h4,
  body.dark h5,
  body.dark h6 {
    color: #f3f4f6; /* Equivalent to Tailwind's gray-100 */
  }
  
  /* --- Links --- */
  body.dark a {
    color: #60a5fa; /* Equivalent to Tailwind's blue-400 */
  }
  body.dark a:hover {
    color: #93c5fd; /* Equivalent to Tailwind's blue-300 */
  }
  
  /* --- Borders --- */
  body.dark .border-gray-200 {
    border-color: #4b5563; /* Equivalent to Tailwind's gray-600 */
  }
  body.dark .border-b {
    border-bottom-color: #4b5563; /* Equivalent to Tailwind's gray-600 */
  }
  
  /* --- Backgrounds --- */
  body.dark .bg-white {
    background-color: #374151; /* Equivalent to Tailwind's gray-700 */
  }
  body.dark .bg-gray-50 {
    background-color: #4b5563; /* Equivalent to Tailwind's gray-600 */
  }
  body.dark .bg-gray-100 {
    background-color: #374151; /* Equivalent to Tailwind's gray-700 */
  }
  body.dark .bg-gray-200 { /* For lighter elements on dark bg, if needed */
    background-color: #4b5563; /* Equivalent to Tailwind's gray-600 */
  }
  body.dark .hover\:bg-gray-50:hover {
    background-color: #4b5563; /* Equivalent to Tailwind's gray-600 */
  }
  body.dark .hover\:bg-gray-100:hover {
    background-color: #4b5563; /* Equivalent to Tailwind's gray-600 */
  }
  body.dark .hover\:bg-gray-200:hover {
      background-color: #525c6a; /* Slightly lighter gray for hover */
  }
  
  
  /* --- Text Colors --- */
  body.dark .text-gray-500 {
    color: #9ca3af; /* Equivalent to Tailwind's gray-400 */
  }
  body.dark .text-gray-600 {
    color: #d1d5db; /* Equivalent to Tailwind's gray-300 */
  }
  body.dark .text-gray-700 {
    color: #e5e7eb; /* Equivalent to Tailwind's gray-200 */
  }
  body.dark .text-gray-800 {
    color: #f3f4f6; /* Equivalent to Tailwind's gray-100 */
  }
  body.dark .text-black-600 { /* Assuming this was a custom class */
    color: #60a5fa; /* Example: blue-400 for dark mode */
  }
  
  /* --- Buttons --- */
  /* Standard Button (e.g., cancel) */
  body.dark .bg-gray-200.text-gray-800 {
    background-color: #4b5563; /* gray-600 */
    color: #f3f4f6; /* gray-100 */
  }
  body.dark .hover\:bg-gray-300:hover {
    background-color: #6b7280; /* gray-500 */
  }
  
  /* Primary Button (e.g., add, update) */
  body.dark .bg-blue-600.text-white {
    background-color: #3b82f6; /* blue-500 */
    color: #ffffff; /* white */
  }
  body.dark .hover\:bg-blue-700:hover {
    background-color: #2563eb; /* blue-600 */
  }
  
  /* Danger Button (e.g., delete) */
  body.dark .bg-red-600.text-white {
    background-color: #ef4444; /* red-500 */
    color: #ffffff; /* white */
  }
  body.dark .hover\:bg-red-700:hover {
    background-color: #dc2626; /* red-600 */
  }
  body.dark .text-red-600 {
    color: #f87171; /* red-400 */
  }
  body.dark .hover\:bg-red-100:hover {
      background-color: rgba(239, 68, 68, 0.2); /* Lighter red for hover on menu items */
  }
  body.dark .text-red-700 {
      color: #fca5a5; /* red-300 */
  }
  body.dark .bg-red-100 {
      background-color: rgba(239, 68, 68, 0.1); /* very transparent red */
  }
  body.dark .hover\:bg-red-200:hover {
      background-color: rgba(239, 68, 68, 0.25);
  }
  
  
  /* --- Forms --- */
  body.dark input[type="text"],
  body.dark input[type="date"],
  body.dark input[type="time"],
  body.dark input[type="email"],
  body.dark input[type="password"],
  body.dark textarea,
  body.dark select {
    background-color: #4b5563; /* gray-600 */
    border-color: #6b7280; /* gray-500 */
    color: #f3f4f6; /* gray-100 */
  }
  body.dark input[type="text"]::placeholder,
  body.dark input[type="email"]::placeholder,
  body.dark input[type="password"]::placeholder,
  body.dark textarea::placeholder {
    color: #9ca3af; /* gray-400 */
  }
  body.dark input[type="checkbox"] {
    border-color: #6b7280; /* gray-500 */
    background-color: #4b5563; /* gray-600 */
  }
  body.dark input[type="checkbox"]:checked {
    background-color: #3b82f6; /* blue-500 */
    border-color: #3b82f6; /* blue-500 */
  }
  /* Focus rings for dark mode */
  body.dark .focus\:ring-blue-500:focus {
    --tw-ring-color: #60a5fa; /* blue-400 */
    box-shadow: 0 0 0 2px var(--tw-ring-color);
  }
  body.dark .focus\:ring-gray-400:focus {
    --tw-ring-color: #9ca3af; /* gray-400 */
     box-shadow: 0 0 0 2px var(--tw-ring-color);
  }
  body.dark .focus\:ring-red-500:focus {
    --tw-ring-color: #f87171; /* red-400 */
     box-shadow: 0 0 0 2px var(--tw-ring-color);
  }
  
  
  /* --- Modals & Cards --- */
  body.dark .shadow-sm {
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2); /* Darker shadow */
  }
  body.dark .shadow-md {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.25), 0 2px 4px -1px rgba(0, 0, 0, 0.2); /* Darker shadow */
  }
  body.dark .shadow-lg {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.25); /* Darker shadow */
  }
  body.dark .shadow-xl {
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2); /* Darker shadow */
  }
  
  /* Specific component adjustments from your +page.svelte */
  
  /* Header */
  body.dark .top-header {
    background-color: #374151; /* gray-700 */
    border-bottom-color: #4b5563; /* gray-600 */
  }
  body.dark .top-header .menu-btn,
  body.dark .top-header .header-icons button {
    color: #d1d5db; /* gray-300 */
  }
  body.dark .top-header .menu-btn:hover,
  body.dark .top-header .header-icons button:hover {
    background-color: #4b5563; /* gray-600 */
  }
  body.dark .top-header .logo {
    color: #f3f4f6; /* gray-100 */
  }
  body.dark .top-header .header-icons img {
    opacity: 0.9; /* Make icons a bit brighter by default in dark mode */
  }
  
  /* Dropdown Windows (Notifications, Profile, etc.) */
  body.dark .dropdown-window {
    background-color: #4b5563; /* gray-600 */
    border-color: #6b7280; /* gray-500 */
  }
  body.dark .dropdown-window h3 {
    color: #f3f4f6; /* gray-100 */
  }
  body.dark .dropdown-window p,
  body.dark .dropdown-window li {
    color: #d1d5db; /* gray-300 */
  }
  body.dark .dropdown-window a {
    color: #93c5fd; /* blue-300 */
  }
  body.dark .dropdown-window button.bg-gray-100 {
    background-color: #6b7280; /* gray-500 */
    color: #f3f4f6; /* gray-100 */
  }
  body.dark .dropdown-window button.bg-gray-100:hover {
    background-color: #555f6d; /* Slightly darker gray-500 */
  }
  
  /* Sidebar */
  body.dark #sidebar {
    background-color: #374151; /* gray-700 */
    border-r-color: #4b5563; /* gray-600 */
  }
  body.dark #sidebar h1 {
    color: #f3f4f6; /* gray-100 */
  }
  body.dark #sidebar nav a {
    color: #d1d5db; /* gray-300 */
  }
  body.dark #sidebar nav a:hover {
    background-color: #4b5563; /* gray-600 */
  }
  body.dark #sidebar nav a.bg-blue-600 { /* Active link */
    background-color: #2563eb; /* blue-600 */
    color: #ffffff; /* white */
  }
  body.dark #sidebar button { /* Logout button */
    color: #d1d5db; /* gray-300 */
  }
  body.dark #sidebar button:hover {
    background-color: #4b5563; /* gray-600 */
  }
  
  /* Sub-header (Home, Search bar area) */
  body.dark .bg-zinc-800 {
    background-color: #27272a; /* zinc-800, can adjust if needed */
    color: #e4e4e7; /* zinc-200 */
  }
  body.dark .bg-zinc-800 .bg-white.text-black { /* Search input area */
    background-color: #3f3f46; /* zinc-700 */
    color: #d4d4d8; /* zinc-300 */
  }
  body.dark .bg-zinc-800 .text-gray-500 { /* Search placeholder text */
    color: #a1a1aa; /* zinc-400 */
  }
  
  /* Card menus (Recents, Todo, Notes dots menu) */
  body.dark #menuRecents,
  body.dark #menuTodo,
  body.dark #menuNotes {
    background-color: #4b5563; /* gray-600 */
    border-color: #6b7280; /* gray-500 */
  }
  body.dark #menuRecents li,
  body.dark #menuTodo li,
  body.dark #menuNotes li {
    color: #d1d5db; /* gray-300 */
  }
  body.dark #menuRecents li:hover,
  body.dark #menuTodo li:hover,
  body.dark #menuNotes li:hover {
    background-color: #6b7280; /* gray-500 */
  }
  
  /* Task items */
  body.dark .line-through.text-gray-500 { /* Completed task text */
    color: #9ca3af !important; /* gray-400 */
  }
  
  /* Notes section refresh button */
  body.dark button.hover\:bg-gray-100.text-gray-500 {
    color: #9ca3af; /* gray-400 */
  }
  body.dark button.hover\:bg-gray-100.text-gray-500:hover {
    background-color: #4b5563; /* gray-600 */
  }
  body.dark .animate-spin.text-blue-600 {
    color: #60a5fa; /* blue-400 */
  }
  
  /* AI Chat Toggle Button */
  body.dark #aiChatToggle button {
    background-color: #7c3aed; /* purple-600 */
  }
  body.dark #aiChatToggle button:hover {
    background-color: #6d28d9; /* purple-700 */
  }
  body.dark .focus\:ring-purple-500:focus {
    --tw-ring-color: #a78bfa; /* purple-400 */
     box-shadow: 0 0 0 2px var(--tw-ring-color);
  }
  
  
  /* AI Chat Window */
  body.dark #aiChatWindow {
    background-color: #374151; /* gray-700 */
    border-color: #4b5563; /* gray-600 */
  }
  body.dark #aiChatWindow .bg-gray-50 { /* Header and Footer of chat */
    background-color: #4b5563; /* gray-600 */
    border-color: #6b7280; /* gray-500 */
  }
  body.dark #aiChatWindow .text-gray-500 { /* Icons in chat header */
    color: #d1d5db; /* gray-300 */
  }
  body.dark #aiChatWindow .hover\:bg-gray-200:hover { /* Icon button hover */
    background-color: #6b7280; /* gray-500 */
  }
  body.dark #aiChatWindow .text-gray-700 { /* "Ask Synthia" title */
    color: #f3f4f6; /* gray-100 */
  }
  body.dark #chatMessages { /* Chat message area */
    background-color: #374151; /* gray-700 or a slightly different dark shade */
  }
  body.dark #chatMessages .initial-prompt img {
    opacity: 0.7;
  }
  body.dark #chatMessages .prompt-button {
    background-color: #4b5563; /* gray-600 */
    border-color: #6b7280; /* gray-500 */
    color: #e5e7eb; /* gray-200 */
  }
  body.dark #chatMessages .prompt-button:hover {
    background-color: #6b7280; /* gray-500 */
  }
  body.dark #chatMessages div.bg-blue-100 { /* User message */
    background-color: #2563eb; /* blue-600 */
    color: #eff6ff; /* blue-50 */
  }
  body.dark #chatMessages div.bg-gray-100 { /* AI message */
    background-color: #4b5563; /* gray-600 */
    color: #f3f4f6; /* gray-100 */
  }
  body.dark #chatMessages div.bg-gray-50 { /* AI Typing message */
    background-color: #404854; /* Slightly different from gray-600 for distinction */
    color: #9ca3af; /* gray-400 */
  }
  body.dark #chatInput {
    background-color: #6b7280; /* gray-500 */
    border-color: #9ca3af; /* gray-400 */
    color: #f3f4f6; /* gray-100 */
  }
  body.dark #chatInput::placeholder {
    color: #9ca3af; /* gray-400 */
  }
  body.dark #sendChat { /* Send button in chat */
    color: #93c5fd; /* blue-300 */
  }
  body.dark #sendChat:hover {
    color: #60a5fa; /* blue-400 */
  }
  body.dark .chat-expanded #chatMessages {
      background-color: #1f2937; /* gray-800, same as body */
  }
  
  /* Error Message */
  body.dark .bg-red-100.border-red-400.text-red-700 {
      background-color: rgba(153, 27, 27, 0.5); /* Darker red with opacity */
      border-color: #f87171; /* red-400 */
      color: #fecaca; /* red-200 */
  }
  body.dark .bg-red-100.border-red-400.text-red-700 button .text-xl {
      color: #fecaca; /* red-200 */
  }
  
  /* Scrollbar for dark mode */
  body.dark ::-webkit-scrollbar-track {
    background: #374151; /* gray-700 */
  }
  body.dark ::-webkit-scrollbar-thumb {
    background: #6b7280; /* gray-500 */
  }
  body.dark ::-webkit-scrollbar-thumb:hover {
    background: #9ca3af; /* gray-400 */
  }
  body.dark .custom-scrollbar {
    scrollbar-color: #6b7280 #374151; /* thumb track */
  }
  
  /* Ensure SVGs inherit color or are explicitly set for dark mode */
  body.dark svg path[stroke="currentColor"] {
      stroke: #d1d5db; /* gray-300 or appropriate icon color */
  }
  body.dark svg path[fill="currentColor"] {
      fill: #d1d5db; /* gray-300 or appropriate icon color */
  }
  
  /* Specific icon colors if needed */
  body.dark .text-blue-500 { /* e.g., Calendar icon in Recents */
      color: #60a5fa; /* blue-400 */
  }
  body.dark .text-green-500 { /* e.g., Progress icon in Recents */
      color: #4ade80; /* green-400 */
  }
  
  </style>