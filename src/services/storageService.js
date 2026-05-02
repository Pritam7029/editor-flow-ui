import { DEFAULT_ACCOUNT, DEFAULT_COLUMNS, EMPTY_CHAT_BUCKET } from '../utils/constants';
import { createDemoWorkspaceState } from '../utils/demoData';

const META_KEY = 'editorflow_meta';

export function getDefaultMeta() {
  return {
    currentWorkspaceId: 'ws_default',
    workspaces: [{ id: 'ws_default', name: 'My Workspace', createdAt: Date.now() }],
    account: null,
  };
}

export function loadMeta() {
  try {
    const saved = localStorage.getItem(META_KEY);
    if (!saved) {
      const meta = getDefaultMeta();
      saveMeta(meta);
      return meta;
    }
    const parsed = JSON.parse(saved);
    const merged = {
      ...getDefaultMeta(),
      ...parsed,
    };
    if (!merged.workspaces.length) {
      merged.workspaces = getDefaultMeta().workspaces;
      merged.currentWorkspaceId = merged.workspaces[0].id;
    }
    if (!merged.workspaces.some((item) => item.id === merged.currentWorkspaceId)) {
      merged.currentWorkspaceId = merged.workspaces[0].id;
    }
    saveMeta(merged);
    return merged;
  } catch {
    const meta = getDefaultMeta();
    saveMeta(meta);
    return meta;
  }
}

export function saveMeta(meta) {
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

export function getWorkspaceStorageKey(workspaceId) {
  return `editorflow_ws_${workspaceId}`;
}

export function getEmptyWorkspaceState() {
  return {
    editors: [],
    tasks: [],
    columns: structuredClone(DEFAULT_COLUMNS),
    files: [],
    notifications: [],
    chat: { dm: {}, teams: {}, global: EMPTY_CHAT_BUCKET() },
    activeConv: { type: 'global', id: null },
    activeChannel: 'general',
    activeEditorId: null,
    currentView: 'overview',
    panelWidths: { chat: 420, sidebar: 240 },
    senderId: null,
    ownerId: null,
  };
}

export function normalizeWorkspaceState(rawState) {
  const state = { ...getEmptyWorkspaceState(), ...(rawState || {}) };
  state.columns = state.columns?.length ? state.columns : structuredClone(DEFAULT_COLUMNS);
  state.files = (state.files || []).map((file) => ({ ...file, comments: file.comments || [] }));
  state.tasks = (state.tasks || []).map((task) => ({ ...task, comments: task.comments || [] }));
  state.notifications = state.notifications || [];
  state.chat = {
    dm: state.chat?.dm || {},
    teams: state.chat?.teams || {},
    global: { ...EMPTY_CHAT_BUCKET(), ...(state.chat?.global || {}) },
  };
  state.panelWidths = state.panelWidths || { chat: 420, sidebar: 240 };
  state.senderId = state.senderId || null;
  state.ownerId = state.ownerId || null;
  return state;
}

export function loadWorkspaceState(workspaceId) {
  const key = getWorkspaceStorageKey(workspaceId);
  const saved = localStorage.getItem(key);
  if (!saved) {
    const empty = getEmptyWorkspaceState();
    saveWorkspaceState(workspaceId, empty);
    return empty;
  }
  try {
    return normalizeWorkspaceState(JSON.parse(saved));
  } catch {
    const fallback = getEmptyWorkspaceState();
    saveWorkspaceState(workspaceId, fallback);
    return fallback;
  }
}

export function saveWorkspaceState(workspaceId, state) {
  localStorage.setItem(getWorkspaceStorageKey(workspaceId), JSON.stringify(state));
}

export function deleteWorkspaceState(workspaceId) {
  localStorage.removeItem(getWorkspaceStorageKey(workspaceId));
}
