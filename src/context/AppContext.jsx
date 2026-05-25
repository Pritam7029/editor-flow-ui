import { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import {
  loadBackendWorkspaceMeta,
  createBackendWorkspace,
  renameBackendWorkspace,
  removeBackendWorkspace
} from '../services/backendWorkspaceBridge';
import {
  loadMeta,
  saveMeta,
  loadWorkspaceState,
  saveWorkspaceState,
  deleteWorkspaceState,
} from '../services/storageService';
import {
  COLUMN_COLORS,
  DEFAULT_ACCOUNT,
  EMPTY_CHAT_BUCKET,
  CHAT_W_KEY,
  SIDEBAR_W_KEY,
  MIN_CHAT_W,
  MAX_CHAT_W,
  MIN_SIDEBAR_W,
  MAX_SIDEBAR_W,
} from '../utils/constants';
import { clamp, extractMentions, uid } from '../utils/helpers';
import { setObjectUrl, revokeObjectUrl } from '../utils/fileStore';

const AppContext = createContext(null);

function reducer(state, action) {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, workspace: { ...state.workspace, currentView: action.view } };
    case 'SET_ACTIVE_EDITOR':
      return { ...state, workspace: { ...state.workspace, activeEditorId: action.editorId } };
    case 'SET_ACTIVE_CONVERSATION':
      return { ...state, workspace: { ...state.workspace, activeConv: action.payload, activeChannel: 'general' } };
    case 'SET_ACTIVE_CHANNEL':
      return { ...state, workspace: { ...state.workspace, activeChannel: action.channel } };
    case 'SET_SENDER_ID':
      return { ...state, workspace: { ...state.workspace, senderId: action.senderId } };
    case 'REPLACE_WORKSPACE':
      return { ...state, workspace: action.workspace };
    case 'UPDATE_WORKSPACE':
      return { ...state, workspace: action.updater(state.workspace) };
    case 'REPLACE_META':
      return { ...state, meta: action.meta };
    default:
      return state;
  }
}

export function AppProvider({ children, session }) {
  const initialMeta = loadMeta();
  if (session) {
    initialMeta.account = {
      id: session.user.id,
      name: session.user.user_metadata?.name || session.user.email.split('@')[0],
      email: session.user.email,
      color: session.user.user_metadata?.color || '#8b5cf6',
      role: 'Workspace Admin',
      avatarUrl: null,
      status: 'active'
    };
  }

    const [backendWorkspaces, setBackendWorkspaces] = useState([]);
    const [backendWorkspaceLoading, setBackendWorkspaceLoading] = useState(false);
    const [backendWorkspaceError, setBackendWorkspaceError] = useState(null);
  

  const initialWorkspace = loadWorkspaceState(initialMeta.currentWorkspaceId);
  if (!initialWorkspace.ownerId && initialMeta.account) {
    initialWorkspace.ownerId = initialMeta.account.id;
    saveWorkspaceState(initialMeta.currentWorkspaceId, initialWorkspace);
  }

  const [state, dispatch] = useReducer(reducer, { meta: initialMeta, workspace: initialWorkspace });

  useEffect(() => {
    saveMeta(state.meta);
  }, [state.meta]);

  useEffect(() => {
    saveWorkspaceState(state.meta.currentWorkspaceId, state.workspace);
  }, [state.workspace, state.meta.currentWorkspaceId]);

  useEffect(() => {
    const chatWidth = clamp(Number(localStorage.getItem(CHAT_W_KEY)) || state.workspace.panelWidths.chat || 420, MIN_CHAT_W, MAX_CHAT_W);
    const sidebarWidth = clamp(Number(localStorage.getItem(SIDEBAR_W_KEY)) || state.workspace.panelWidths.sidebar || 240, MIN_SIDEBAR_W, MAX_SIDEBAR_W);
    document.documentElement.style.setProperty('--chat-w', `${chatWidth}px`);
    document.documentElement.style.setProperty('--sidebar-w', `${sidebarWidth}px`);
  }, [state.workspace.panelWidths.chat, state.workspace.panelWidths.sidebar]);

  const helpers = useMemo(() => {
    const updateWorkspace = (updater) => {
      if (typeof updater === 'function') {
        dispatch({ type: 'UPDATE_WORKSPACE', updater });
      } else {
        dispatch({ type: 'REPLACE_WORKSPACE', workspace: updater });
      }
    };

    const updateMeta = (updater) => {
      const next = typeof updater === 'function' ? updater(state.meta) : updater;
      dispatch({ type: 'REPLACE_META', meta: next });
    };

    const getActiveChatBucketRef = (workspace) => {
      const { activeConv, activeChannel, chat } = workspace;
      if (activeConv.type === 'dm') {
        chat.dm[activeConv.id] = chat.dm[activeConv.id] || EMPTY_CHAT_BUCKET();
        return chat.dm[activeConv.id][activeChannel];
      }
      if (activeConv.type === 'team') {
        chat.teams[activeConv.id] = chat.teams[activeConv.id] || { name: 'Team', memberIds: [], ...EMPTY_CHAT_BUCKET() };
        return chat.teams[activeConv.id][activeChannel];
      }
      return chat.global[activeChannel];
    };

    const getActiveChatBucket = () => {
      if (state.workspace.activeChannel === 'tagged') return [];
      return getActiveChatBucketRef(structuredClone(state.workspace));
    };

    const pushToast = (message, tone = 'success') => {
      updateWorkspace((current) => ({
        ...current,
        toasts: [...(current.toasts || []), { id: uid(), message, tone }],
      }));
    };

    const removeToast = (toastId) => {
      updateWorkspace((current) => ({
        ...current,
        toasts: (current.toasts || []).filter((item) => item.id !== toastId),
      }));
    };

    const pushNotification = ({ icon, iconClass = 'mention-notif', title, sub, targetEditorId = null }) => {
      updateWorkspace((current) => ({
        ...current,
        notifications: [{ id: uid(), icon, iconClass, title, sub, targetEditorId, ts: Date.now(), read: false }, ...current.notifications],
      }));
    };

    const addMentionNotifications = (text, authorName, source) => {
      extractMentions(text, state.workspace.editors).forEach((editor) => {
        pushNotification({
          icon: source.icon,
          iconClass: source.iconClass,
          title: `${authorName} mentioned @${editor.name.split(' ')[0]}`,
          sub: source.getSubtext(text),
          targetEditorId: editor.id,
        });
      });
    };

    const getActorName = (senderId) => {
      if (senderId === state.meta.account?.id) return state.meta.account.name || 'Admin';
      return state.workspace.editors.find((editor) => editor.id === senderId)?.name || 'Unknown';
    };

    const addEditor = (payload) => {
      const editor = { id: uid(), createdAt: Date.now(), ...payload };
      updateWorkspace((current) => ({ ...current, editors: [...current.editors, editor] }));
      pushToast(`${editor.name} added to your team.`);
    };

    const deleteEditorById = (editorId) => {
      const editor = state.workspace.editors.find((item) => item.id === editorId);
      updateWorkspace((current) => {
        const nextTeams = Object.fromEntries(
          Object.entries(current.chat.teams).map(([teamId, team]) => [teamId, { ...team, memberIds: team.memberIds.filter((id) => id !== editorId) }]),
        );
        return {
          ...current,
          editors: current.editors.filter((item) => item.id !== editorId),
          tasks: current.tasks.map((task) => (task.assigneeId === editorId ? { ...task, assigneeId: '' } : task)),
          chat: {
            ...current.chat,
            dm: Object.fromEntries(Object.entries(current.chat.dm).filter(([id]) => id !== editorId)),
            teams: nextTeams,
          },
          activeConv: current.activeConv.type === 'dm' && current.activeConv.id === editorId ? { type: 'global', id: null } : current.activeConv,
          activeEditorId: current.activeEditorId === editorId ? null : current.activeEditorId,
        };
      });
      pushToast(`${editor?.name || 'Editor'} removed.`, 'error');
    };

    const addTask = (payload) => {
      const task = { id: uid(), createdAt: Date.now(), comments: [], ...payload };
      updateWorkspace((current) => ({ ...current, tasks: [...current.tasks, task] }));
      if (task.assigneeId) {
        const editor = state.workspace.editors.find((item) => item.id === task.assigneeId);
        if (editor) {
          pushNotification({
            icon: '✅',
            iconClass: 'task-notif',
            title: `Task assigned to ${editor.name}`,
            sub: `"${task.title}" has been added to their board.`,
            targetEditorId: editor.id,
          });
        }
      }
      pushToast(`Task "${task.title}" added.`);
    };

    const updateTask = (taskId, updates) => {
      const currentTask = state.workspace.tasks.find((task) => task.id === taskId);
      updateWorkspace((current) => ({
        ...current,
        tasks: current.tasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task)),
      }));
      if (updates.assigneeId && updates.assigneeId !== currentTask?.assigneeId) {
        const editor = state.workspace.editors.find((item) => item.id === updates.assigneeId);
        if (editor) {
          pushNotification({
            icon: '✅',
            iconClass: 'task-notif',
            title: `Task re-assigned to ${editor.name}`,
            sub: `"${updates.title || currentTask?.title || 'Task'}" was assigned to them.`,
            targetEditorId: editor.id,
          });
        }
      }
    };

    const deleteTaskById = (taskId) => {
      updateWorkspace((current) => ({ ...current, tasks: current.tasks.filter((task) => task.id !== taskId) }));
      pushToast('Task deleted.', 'error');
    };

    const addTaskComment = (taskId, text, senderId) => {
      const authorName = getActorName(senderId);
      updateWorkspace((current) => ({
        ...current,
        tasks: current.tasks.map((task) => task.id === taskId ? {
          ...task,
          comments: [...task.comments, { id: uid(), authorId: senderId, authorName, text, ts: Date.now() }],
        } : task),
      }));
      const task = state.workspace.tasks.find((item) => item.id === taskId);
      addMentionNotifications(text, authorName, {
        icon: '📋',
        iconClass: 'task-notif',
        getSubtext: (value) => `"${task?.title || 'Task'}": ${value.slice(0, 60)}${value.length > 60 ? '…' : ''}`,
      });
      pushToast('Comment added.');
    };

    const addColumn = (payload) => {
      const key = `col_${uid()}`;
      updateWorkspace((current) => ({
        ...current,
        columns: [...current.columns, { key, ...payload }],
      }));
      pushToast('Column added.');
      return key;
    };

    const updateColumn = (columnKey, updates) => {
      updateWorkspace((current) => ({
        ...current,
        columns: current.columns.map((column) => (column.key === columnKey ? { ...column, ...updates } : column)),
      }));
      pushToast('Column updated.');
    };

    const deleteColumnByKey = (columnKey) => {
      updateWorkspace((current) => {
        const fallback = current.columns.find((column) => column.key !== columnKey);
        if (!fallback) return current;
        return {
          ...current,
          columns: current.columns.filter((column) => column.key !== columnKey),
          tasks: current.tasks.map((task) => (task.status === columnKey ? { ...task, status: fallback.key } : task)),
        };
      });
      pushToast('Column deleted.');
    };

    const moveColumn = (sourceKey, targetIndex) => {
      updateWorkspace((current) => {
        const list = [...current.columns];
        const sourceIndex = list.findIndex((column) => column.key === sourceKey);
        if (sourceIndex < 0) return current;
        const [removed] = list.splice(sourceIndex, 1);
        list.splice(targetIndex, 0, removed);
        return { ...current, columns: list };
      });
    };

    const moveTask = (taskId, targetStatus, targetIndex = null) => {
      updateWorkspace((current) => {
        const moving = current.tasks.find((task) => task.id === taskId);
        if (!moving) return current;
        const remaining = current.tasks.filter((task) => task.id !== taskId);
        const moved = { ...moving, status: targetStatus };
        if (targetIndex == null) {
          const next = [...remaining];
          const sameColumnIndexes = next.reduce((acc, task, index) => (task.status === targetStatus ? index : acc), -1);
          if (sameColumnIndexes >= 0) next.splice(sameColumnIndexes + 1, 0, moved);
          else next.push(moved);
          return { ...current, tasks: next };
        }
        const next = [...remaining];
        const visibleIds = next.filter((task) => task.status === targetStatus);
        if (targetIndex >= visibleIds.length) {
          const insertionBase = next.reduce((acc, task, index) => (task.status === targetStatus ? index : acc), -1);
          if (insertionBase >= 0) next.splice(insertionBase + 1, 0, moved);
          else next.push(moved);
        } else {
          const anchor = visibleIds[targetIndex];
          const anchorIndex = next.findIndex((task) => task.id === anchor.id);
          next.splice(anchorIndex, 0, moved);
        }
        return { ...current, tasks: next };
      });
    };

    const sendMessage = ({ text, senderId }) => {
      const senderName = getActorName(senderId);
      updateWorkspace((current) => {
        const nextChat = structuredClone(current.chat);
        const message = { id: uid(), senderId, senderName, text, ts: Date.now() };
        if (current.activeConv.type === 'dm') {
          nextChat.dm[current.activeConv.id] = nextChat.dm[current.activeConv.id] || EMPTY_CHAT_BUCKET();
          nextChat.dm[current.activeConv.id][current.activeChannel].push(message);
        } else if (current.activeConv.type === 'team') {
          nextChat.teams[current.activeConv.id][current.activeChannel].push(message);
        } else {
          nextChat.global[current.activeChannel].push(message);
        }
        return { ...current, chat: nextChat };
      });
      addMentionNotifications(text, senderName, {
        icon: '💬',
        iconClass: 'mention-notif',
        getSubtext: (value) => `${value.slice(0, 80)}${value.length > 80 ? '…' : ''}`,
      });
    };

    const createTeam = (name, memberIds) => {
      const teamId = uid();
      updateWorkspace((current) => ({
        ...current,
        chat: { ...current.chat, teams: { ...current.chat.teams, [teamId]: { name, memberIds, ...EMPTY_CHAT_BUCKET() } } },
        activeConv: { type: 'team', id: teamId },
        activeChannel: 'general',
      }));
      pushToast(`Team "${name}" created.`);
    };

    const clearActiveChat = () => {
      updateWorkspace((current) => {
        const nextChat = structuredClone(current.chat);
        if (current.activeConv.type === 'dm') nextChat.dm[current.activeConv.id] = EMPTY_CHAT_BUCKET();
        else if (current.activeConv.type === 'team') nextChat.teams[current.activeConv.id] = { ...nextChat.teams[current.activeConv.id], ...EMPTY_CHAT_BUCKET() };
        else nextChat.global = EMPTY_CHAT_BUCKET();
        return { ...current, chat: nextChat };
      });
      pushToast('Chat cleared.', 'error');
    };

    const addFiles = async (fileList, uploaderId) => {
      // Images ≤ 2 MB: compress to base64 so they persist across page refreshes.
      // Everything else (videos, audio, large images, any format): use a zero-copy
      // Object URL — the browser streams directly from disk, so there is NO size
      // limit and NO memory overhead. The URL is valid for this browser session.
      const IMAGE_PERSIST_LIMIT = 2 * 1024 * 1024; // 2 MB

      const compressImage = (file) => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const raw = e.target?.result;
          const img = new Image();
          img.onload = () => {
            const MAX_DIM = 1920;
            let { width, height } = img;
            if (width > MAX_DIM || height > MAX_DIM) {
              if (width > height) { height = Math.round(height * MAX_DIM / width); width = MAX_DIM; }
              else { width = Math.round(width * MAX_DIM / height); height = MAX_DIM; }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.82));
          };
          img.onerror = () => resolve(raw);
          img.src = raw;
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });

      const files = await Promise.all([...fileList].map(async (file) => {
        const fileId = uid();
        const useBase64 = file.type.startsWith('image/') && file.size <= IMAGE_PERSIST_LIMIT;
        let dataUrl = null;

        if (useBase64) {
          dataUrl = await compressImage(file);
        } else {
          // Create a zero-copy Object URL — works for any format, any size
          const objectUrl = URL.createObjectURL(file);
          setObjectUrl(fileId, objectUrl);
        }

        return {
          id: fileId,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl, // null for large/non-image files (they use Object URL instead)
          uploadedBy: uploaderId,
          uploadedAt: Date.now(),
          comments: [],
          visibleTo: [],
        };
      }));

      updateWorkspace((current) => ({ ...current, files: [...current.files, ...files] }));
      pushToast(`${files.length} file(s) uploaded.`);
    };

    const addFileComment = (fileId, text, senderId, timestamp = null) => {
      const authorName = getActorName(senderId);
      updateWorkspace((current) => ({
        ...current,
        files: current.files.map((file) => file.id === fileId ? {
          ...file,
          comments: [...file.comments, { id: uid(), authorId: senderId, authorName, text, timestamp, ts: Date.now() }],
        } : file),
      }));
      const file = state.workspace.files.find((item) => item.id === fileId);
      addMentionNotifications(text, authorName, {
        icon: '🎥',
        iconClass: 'file-notif',
        getSubtext: (value) => `On "${file?.name || 'file'}"${timestamp != null ? ` at ${Math.floor(timestamp)}s` : ''}: ${value.slice(0, 60)}${value.length > 60 ? '…' : ''}`,
      });
      pushToast('Feedback added.');
    };

    const deleteFileById = (fileId) => {
      revokeObjectUrl(fileId); // free browser memory for Object URL files
      updateWorkspace((current) => ({ ...current, files: current.files.filter((file) => file.id !== fileId) }));
      pushToast('File deleted.', 'error');
    };

    const updateFilePermissions = (fileId, visibleTo) => {
      updateWorkspace((current) => ({
        ...current,
        files: current.files.map((file) => (file.id === fileId ? { ...file, visibleTo } : file)),
      }));
      pushToast('File access updated.');
    };

    const markNotificationRead = (notificationId) => {
      updateWorkspace((current) => ({
        ...current,
        notifications: current.notifications.map((item) => item.id === notificationId ? { ...item, read: true } : item),
      }));
    };

    const clearNotifications = () => updateWorkspace((current) => ({ ...current, notifications: [] }));

    const saveAccount = (payload) => {
      updateMeta((current) => ({ ...current, account: { ...DEFAULT_ACCOUNT, ...current.account, ...payload } }));
      pushToast('Profile updated.');
    };

    const createWorkspace = (name) => {
      const workspaceId = `ws_${uid()}`;
      const nextMeta = {
        ...state.meta,
        workspaces: [...state.meta.workspaces, { id: workspaceId, name, createdAt: Date.now() }],
        currentWorkspaceId: workspaceId,
      };
      
      const newWorkspace = loadWorkspaceState(workspaceId);
      newWorkspace.ownerId = state.meta.account.id;
      saveWorkspaceState(workspaceId, newWorkspace);

      dispatch({ type: 'REPLACE_META', meta: nextMeta });
      dispatch({ type: 'REPLACE_WORKSPACE', workspace: newWorkspace });
      pushToast(`Workspace "${name}" created.`);
    };

    const joinWorkspaceById = (workspaceId) => {
      if (state.meta.workspaces.some((ws) => ws.id === workspaceId)) {
        pushToast('You are already in this workspace.');
        switchWorkspace(workspaceId);
        return;
      }
      const newWorkspace = loadWorkspaceState(workspaceId);
      // Ensure the user is added to the editors list
      if (!newWorkspace.editors.some(e => e.id === state.meta.account.id)) {
        newWorkspace.editors.push({
          id: state.meta.account.id,
          name: state.meta.account.name,
          role: 'Editor',
          status: 'active',
          color: state.meta.account.color
        });
        saveWorkspaceState(workspaceId, newWorkspace);
      }
      const nextMeta = {
        ...state.meta,
        workspaces: [...state.meta.workspaces, { id: workspaceId, name: newWorkspace.name || 'Joined Workspace', createdAt: Date.now() }],
        currentWorkspaceId: workspaceId,
      };
      dispatch({ type: 'REPLACE_META', meta: nextMeta });
      dispatch({ type: 'REPLACE_WORKSPACE', workspace: newWorkspace });
      pushToast(`Joined workspace successfully.`);
    };

    const switchWorkspace = (workspaceId) => {
      const target = state.meta.workspaces.find((workspace) => workspace.id === workspaceId);
      if (!target) return;
      dispatch({ type: 'REPLACE_META', meta: { ...state.meta, currentWorkspaceId: workspaceId } });
      dispatch({ type: 'REPLACE_WORKSPACE', workspace: loadWorkspaceState(workspaceId) });
      pushToast(`Switched to "${target.name}".`);
    };

    const renameWorkspace = (workspaceId, name) => {
      updateMeta((current) => ({
        ...current,
        workspaces: current.workspaces.map((workspace) => workspace.id === workspaceId ? { ...workspace, name } : workspace),
      }));
      pushToast(`Workspace renamed to "${name}".`);
    };

    const deleteWorkspaceById = (workspaceId) => {
      if (state.meta.workspaces.length <= 1) return;
      deleteWorkspaceState(workspaceId);
      const remaining = state.meta.workspaces.filter((workspace) => workspace.id !== workspaceId);
      const nextMeta = { ...state.meta, workspaces: remaining, currentWorkspaceId: remaining[0].id };
      dispatch({ type: 'REPLACE_META', meta: nextMeta });
      dispatch({ type: 'REPLACE_WORKSPACE', workspace: loadWorkspaceState(remaining[0].id) });
      pushToast('Workspace deleted.', 'error');
    };

    const joinOrCreateWorkspace = (name) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const existing = state.meta.workspaces.find((workspace) => workspace.name.toLowerCase() === trimmed.toLowerCase());
      if (existing) switchWorkspace(existing.id);
      else createWorkspace(trimmed);
    };

    const setPanelWidth = (panel, width) => {
      const clamped = panel === 'chat' ? clamp(width, MIN_CHAT_W, MAX_CHAT_W) : clamp(width, MIN_SIDEBAR_W, MAX_SIDEBAR_W);
      updateWorkspace((current) => ({ ...current, panelWidths: { ...current.panelWidths, [panel]: clamped } }));
      document.documentElement.style.setProperty(panel === 'chat' ? '--chat-w' : '--sidebar-w', `${clamped}px`);
      localStorage.setItem(panel === 'chat' ? CHAT_W_KEY : SIDEBAR_W_KEY, String(clamped));
    };

    const createColumnDraft = () => ({ label: '', emoji: '📌', color: COLUMN_COLORS[3] });

    return {
      dispatch,
      updateWorkspace,
      getActiveChatBucket,
      pushToast,
      removeToast,
      pushNotification,
      addEditor,
      deleteEditorById,
      addTask,
      updateTask,
      deleteTaskById,
      addTaskComment,
      addColumn,
      updateColumn,
      deleteColumnByKey,
      moveColumn,
      moveTask,
      sendMessage,
      createTeam,
      clearActiveChat,
      addFiles,
      addFileComment,
      deleteFileById,
      updateFilePermissions,
      markNotificationRead,
      clearNotifications,
      saveAccount,
      createWorkspace,
      switchWorkspace,
      joinWorkspaceById,
      renameWorkspace,
      deleteWorkspaceById,
      joinOrCreateWorkspace,
      setPanelWidth,
      createColumnDraft,
    };
  }, [state]);

  async function refreshBackendWorkspaces() {
  setBackendWorkspaceLoading(true);
  setBackendWorkspaceError(null);

  try {
    const workspaces = await loadBackendWorkspaceMeta();
    setBackendWorkspaces(workspaces);
    return workspaces;
  } catch (error) {
    const message = error.message || 'Failed to load workspaces';
    setBackendWorkspaceError(message);
    throw error;
  } finally {
    setBackendWorkspaceLoading(false);
  }
}

async function addBackendWorkspace(name) {
  const workspace = await createBackendWorkspace(name);
  await refreshBackendWorkspaces();
  return workspace;
}

async function editBackendWorkspace(workspaceId, name) {
  const workspace = await renameBackendWorkspace(workspaceId, name);
  await refreshBackendWorkspaces();
  return workspace;
}

async function deleteBackendWorkspaceById(workspaceId) {
  await removeBackendWorkspace(workspaceId);
  await refreshBackendWorkspaces();
  return true;
}

useEffect(() => {
  const userId =
    session && session.user && session.user.id ? session.user.id : null;

  if (!userId) return;

  refreshBackendWorkspaces().catch((error) => {
    console.error('Failed to load backend workspaces:', error);
  });
}, [session && session.user && session.user.id]);

 const value = useMemo(
  () => ({
    ...state,
    ...helpers,

    backendWorkspaces,
    backendWorkspaceLoading,
    backendWorkspaceError,
    refreshBackendWorkspaces,
    addBackendWorkspace,
    editBackendWorkspace,
    deleteBackendWorkspaceById
  }),
  [
    state,
    helpers,
    backendWorkspaces,
    backendWorkspaceLoading,
    backendWorkspaceError
  ]
);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used inside AppProvider');
  return context;
}
