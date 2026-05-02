# EditorFlow: React Single-Page Application (SPA) - Architecture & Codebase Summary

This document provides an in-depth summary of the EditorFlow application. It serves as a technical primer for developers and AI agents to quickly understand the project's structure, state management patterns, UI architecture, and feature implementations.

---

## 1. High-Level Overview

**EditorFlow** is a modern, responsive, workflow management tool tailored for editor teams, designers, and creatives. It allows users to track tasks in a Kanban-style board, manage team members, review project files (images/videos) with timestamped comments, and communicate in real-time via a built-in messaging system (direct messages and team channels). 

The application recently underwent a migration from a vanilla HTML/JS/CSS monolithic architecture to a **component-driven React/Vite architecture** for maintainability, encapsulation, and scalability while retaining its "Visual Parity" with the original pure CSS styles (`global.css`).

---

## 2. Technology Stack

- **Framework**: React 18 (Functional components with hooks)
- **Build Tool**: Vite (Lightning fast dev server and bundler)
- **State Management**: Built-in React Context API (`createContext`, `useReducer`, `useMemo`) + LocalStorage API. No external state libraries like Redux or Zustand are used.
- **Styling**: Raw vanilla CSS (`src/styles/global.css`). Styling heavily relies on native CSS variables (CSS Custom Properties) for themes, layout boundaries, and visual styling. Contains responsive overrides for mobile viewports.
- **Data Persistence**: Local, offline-first approach via the browser's `localStorage`.

---

## 3. Core Architecture & Global State

### Context API (`src/context/AppContext.jsx`)
This is the brain of the application. It utilizes a `useReducer` hook mapped alongside an exhaustive list of helper functions memoized securely via `useMemo` to prevent unnecessary UI renders. 

The application state is deeply split into two main trees:
1. **Meta (`meta`)**: High-level application state identifying the user (`account`), tracking all available workspaces (`workspaces`), and identifying which workspace the user is currently viewing (`currentWorkspaceId`).
2. **Workspace (`workspace`)**: Heavily nested workspace-specific data retrieved based on the `currentWorkspaceId`. This represents all the dynamic business data:
   - **`editors`**: Array of team members added to the workspace.
   - **`tasks`**: Array of task objects (with properties like assignee, status, comments, attachments).
   - **`columns`**: Represents the custom columns in the Kanban board.
   - **`files`**: Assests (video, photo) uploaded to the workspace awaiting review.
   - **`chat`**: Deeply nested chat buckets mapping out direct messages (`dm`), team chats (`teams`), and `global` channels.
   - **`activeConv` & `activeChannel`**: Tracks the user's currently focused chat.

### Data Persistence (`src/services/storageService.js`)
All mutations executed via the Context API automatically trigger `useEffect` hooks in `AppContext.jsx` that serialize (`JSON.stringify`) the data and sync it over to the browser's `localStorage` via the `storageService.js`.
- `loadMeta()` / `saveMeta()`: Reads / writes the `editorflow_meta` object.
- `loadWorkspaceState(id)` / `saveWorkspaceState(id, data)`: Dynamically reads / writes `editorflow_ws_[id]` for a specific workspace, allowing users to create multiple isolated project environments locally.

---

## 4. UI Layout & Component Organization

The UI follows an app layout pattern typically consisting of a navigation header, a resilient global chat side-panel, dynamic main content views, and a utility sidebar.

### Shell & Wrappers (`src/components/layout/`)
- **`AppShell.jsx`**: The main interface structure holding the `Header`, `MainContent` router, the `ChatPanel` (left side), and the `Sidebar` (right side).
- **`Header.jsx`**: Top navigation, branding, notification popups, workspace switcher dropdowns, and UI-action triggers (add tasks, open settings).
- **`MainContent.jsx`**: A crude React-level router. Instead of utilizing `react-router-dom`, conditional rendering is linked to `workspace.currentView` to swap between the four primary Pages.

### Main Pages (`src/pages/`)
1. **`OverviewPage.jsx`**: A high-level dashboard offering a statistical summary (completion rate, editors count) and a bird's-eye view of recent team actions.
2. **`TasksPage.jsx`**: The foundational Kanban board. Handles mapping through `workspace.columns`, iterating the matching `workspace.tasks` into draggable items. Contains task filtering logic.
3. **`FilesPage.jsx`**: Visual asset manager. Implements file-review features rendering videos or images with adjacent sidebars containing file-specific contextual comments (some with video timestamp tracking).
4. **`EditorsPage.jsx`**: A grid layout listing all individuals integrated into the team with controls for managing their profiles.

### Isolated Modules (`src/components/`)
- **`modals/`**: Accessible popups driven by local state in the `AppShell`. Modules include `TaskModal`, `TaskDetailModal`, `TeamModal`, `WorkspaceModal`, `AccountDrawer`, and `FileViewerModal`. 
- **`chat/`**: Houses the complex message components like `ChatPanel.jsx`, tracking mentions, and bucket-routing based on local selection inside `ChatConversations`.
- **`tasks/`**, **`files/`**, **`common/`**: Deeply fragmented atom-level and molecular components matching distinct UI requirements (File Cards, Avatars, Kanban Columns, Toast notifications, etc.).

---

## 5. Noteworthy Features & Mechanics

- **No Relational Database / Backend**: The entire architecture artificially simulates a backend. E.g., when adding an `editor`, the platform assigns a pseudorandom generic `id` via a UI utility, and manually filters task arrays (`workspace.tasks`) to remove dangling assignee IDs when an editor is deleted.
- **Cross-Component Events via State**: Clicking a notification regarding a file will trigger the global Context to change the `currentView` to `files` and trigger a `fileViewer` modal state explicitly, showing how the app handles internal routing entirely via context.
- **File System Imitation**: `FileReader` API handles transforming user-uploaded files into enormous base64 `dataUrl` strings synced straight to `localStorage` (Note: susceptible to local storage size limits quickly).
- **Mentions & Tagging System**: `addMentionNotifications` and regex parser functions (`extractMentions`) scan text bodies for `@editorName` on creation, subsequently injecting unread notifications into the context targetting the associated user.

---

## 6. CSS Methodology (`global.css`)

All components share a monolithic stylesheet utilizing class reuse rather than CSS Modules or Styled Components.
- Custom properties scale UI dimensions continuously (e.g., `--chat-w` and `--sidebar-w`) that are updated in real-time by a resize dragger component logic.
- Dark mode theme utilizing `rgba` blends and `backdrop-filter: blur(18px)` across transparent absolute layers (`.floating-panel`, `.app-header`) to achieve a distinct dynamic glassmorphism effect.
