# EditorFlow React Parity Migration

This package is the stricter parity pass of the uploaded HTML/CSS/JS EditorFlow application.

## Goal

Preserve the original feature set while moving from imperative DOM code to a structured React application.

## Included feature coverage

- Workspace switching, creation, rename, join-by-name, and deletion
- Account drawer with editable profile, avatar upload/remove, color selection, and status
- Header stats, notifications panel, unread badge, and clear-all
- Editors sidebar with progress bars and task filtering jump
- Overview, Editors, Tasks, and Files views
- Task board with dynamic columns, drag-and-drop between columns, in-column reordering, add/edit/delete column flows
- Task detail modal with editable fields and comments
- Inline task-card comment expansion and comment creation
- Direct messages, team channels, global channels, tagged aggregation channel
- Link cards in chat, @mention highlighting, mention-triggered notifications
- File upload, drag/drop upload zone, file viewer, timestamped video comments, marker seeking, fullscreen mode
- Mobile chat/sidebar slide-in panels with overlay close behavior
- Persisted panel widths using localStorage and live drag resizing on desktop
- Persisted workspaces and account state using localStorage
- Demo data bootstrapping for new workspaces

## Exactness notes

This pass intentionally mirrors the original layout and interaction model more closely than the earlier conversion.

Where a browser-native or React-native implementation is more robust than porting imperative DOM code directly, an equivalent interaction is used:

- Task cards now support cross-column moves and in-column realignment using React-managed native drag/drop with insertion indicators. This is the React equivalent of the original custom ghost-card drag implementation.
- Call buttons remain placeholder UI actions because there is no real calling backend in the original project either; these are kept as interaction entry points.

## Folder structure

```text
src/
  components/
    chat/
    common/
    layout/
    modals/
  context/
  hooks/
  pages/
  services/
  styles/
  utils/
  assets/
```

## Data flow

- `AppContext` owns the main application state.
- Workspace state and account meta state are loaded from `localStorage` through `storageService`.
- Pages and components read state with `useAppContext()`.
- Mutations are routed through context helper functions such as `addTask`, `moveTask`, `sendMessage`, `addFileComment`, `switchWorkspace`, and `saveAccount`.

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
