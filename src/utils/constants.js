export const CHANNELS = ['general', 'links', 'feedback', 'tagged'];

export const DEFAULT_COLUMNS = [
  { key: 'todo', label: 'To Do', emoji: '📋', color: '#94a3b8' },
  { key: 'inprogress', label: 'In Progress', emoji: '⚡', color: '#f59e0b' },
  { key: 'done', label: 'Done', emoji: '✅', color: '#10b981' },
];

export const COLOR_OPTIONS = [
  '#8b5cf6', '#06b6d4', '#10b981', '#f43f5e',
  '#f59e0b', '#3b82f6', '#ec4899', '#14b8a6',
];

export const COLUMN_COLORS = [
  '#94a3b8', '#f59e0b', '#10b981', '#8b5cf6',
  '#ef4444', '#3b82f6', '#ec4899', '#06b6d4',
  '#f97316', '#a3e635', '#facc15', '#c084fc',
];

export const EMPTY_CHAT_BUCKET = () => ({
  general: [],
  links: [],
  feedback: [],
});

export const DEFAULT_ACCOUNT = {
  name: 'Admin',
  role: 'Workspace Admin',
  bio: '',
  avatarUrl: null,
  color: '#8b5cf6',
  status: 'active',
};

export const CHAT_W_KEY = 'ef_chat_w';
export const SIDEBAR_W_KEY = 'ef_sidebar_w';
export const MIN_CHAT_W = 220;
export const MAX_CHAT_W = 720;
export const MIN_SIDEBAR_W = 180;
export const MAX_SIDEBAR_W = 420;
