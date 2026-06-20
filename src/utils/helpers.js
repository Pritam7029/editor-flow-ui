export const uid = () => Math.random().toString(36).slice(2, 10);

export const uuidv4 = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};


export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const formatDateTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export const formatSeconds = (seconds) => {
  if (seconds == null || Number.isNaN(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${minutes}:${String(remaining).padStart(2, '0')}`;
};

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const getAvatarInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'A';

export const isOverdue = (dateString) => Boolean(dateString) && new Date(dateString) < new Date();

export const escapeHtml = (text = '') =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

export const getDomain = (url) => {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname.replace('www.', '');
  } catch {
    return url;
  }
};

export const getLinkIcon = (url = '') => {
  const lower = url.toLowerCase();
  if (lower.includes('youtube') || lower.includes('youtu.be')) return '▶';
  if (lower.includes('drive.google') || lower.includes('docs.google')) return '📁';
  if (lower.includes('dropbox')) return '📦';
  if (lower.includes('notion')) return '📝';
  if (lower.includes('figma')) return '🎨';
  if (lower.includes('github')) return '🐙';
  if (lower.includes('vimeo')) return '🎬';
  if (/(jpg|jpeg|png|gif|webp|svg)$/.test(lower)) return '🖼';
  if (/(mp4|mov|avi|mkv)$/.test(lower)) return '🎬';
  if (/(mp3|wav|aac)$/.test(lower)) return '🎵';
  if (/pdf$/.test(lower)) return '📄';
  if (/(zip|rar|7z)$/.test(lower)) return '📦';
  return '🔗';
};

export const getFileIcon = (type = '', name = '') => {
  if (type.startsWith('video')) return '🎬';
  if (type.startsWith('image')) return '🖼';
  if (type.startsWith('audio')) return '🎵';
  if (name.endsWith('.pdf')) return '📄';
  if (/\.(zip|rar|7z)$/i.test(name)) return '📦';
  return '📁';
};

const mentionRegex = /@([A-Za-z][A-Za-z0-9_]*(?:\s[A-Za-z][A-Za-z0-9_]*)?)/g;

export const extractMentions = (text = '', editors = []) => {
  const mentioned = [];
  let match;
  mentionRegex.lastIndex = 0;

  while ((match = mentionRegex.exec(text)) !== null) {
    const raw = match[1].trim().toLowerCase();
    const editor = editors.find((item) => {
      const first = item.name.split(' ')[0].toLowerCase();
      const full = item.name.toLowerCase();
      return first === raw || full === raw;
    });
    if (editor && !mentioned.some((entry) => entry.id === editor.id)) mentioned.push(editor);
  }
  return mentioned;
};

export const renderMentions = (text = '', editors = []) => {
  let output = '';
  let lastIndex = 0;
  let match;
  mentionRegex.lastIndex = 0;

  while ((match = mentionRegex.exec(text)) !== null) {
    const raw = match[1].trim().toLowerCase();
    const editor = editors.find((item) => {
      const first = item.name.split(' ')[0].toLowerCase();
      const full = item.name.toLowerCase();
      return first === raw || full === raw;
    });

    output += escapeHtml(text.slice(lastIndex, match.index));
    if (editor) {
      output += `<span class="mention-chip" style="border-color:${editor.color}55;color:${editor.color};background:${editor.color}18;">@${escapeHtml(match[1])}</span>`;
    } else {
      output += escapeHtml(match[0]);
    }
    lastIndex = match.index + match[0].length;
  }

  output += escapeHtml(text.slice(lastIndex));
  return output;
};

export const getEditorProgress = (editorId, tasks = []) => {
  const assigned = tasks.filter((task) => task.assigneeId === editorId);
  if (!assigned.length) return { total: 0, done: 0, inprogress: 0, todo: 0, pct: 0 };
  const done = assigned.filter((task) => task.status === 'done').length;
  const inprogress = assigned.filter((task) => task.status === 'inprogress').length;
  const todo = assigned.filter((task) => task.status === 'todo').length;
  return { total: assigned.length, done, inprogress, todo, pct: Math.round((done / assigned.length) * 100) };
};

export const getEditorStatusBadge = (editor, progress) => {
  if (editor.status === 'idle') return { label: 'Idle', tone: 'warning' };
  if (editor.status === 'offline') return { label: 'Offline', tone: 'danger' };
  if (progress.pct === 100) return { label: 'Done', tone: 'success' };
  if (progress.inprogress > 0) return { label: 'Active', tone: 'success' };
  if (progress.todo > 0) return { label: 'Queued', tone: 'warning' };
  return { label: 'Active', tone: 'success' };
};

export const getConversationLabel = (workspace, activeConv, activeChannel) => {
  if (activeChannel === 'tagged') {
    return { title: 'Tagged', subtitle: 'Messages and feedback that mention editors' };
  }
  if (activeConv.type === 'dm') {
    const editor = workspace.editors.find((item) => item.id === activeConv.id);
    return { title: editor?.name || 'Direct Message', subtitle: editor?.role || 'Editor' };
  }
  if (activeConv.type === 'team') {
    const team = workspace.chat.teams[activeConv.id];
    const members = (team?.memberIds || [])
      .map((memberId) => workspace.editors.find((item) => item.id === memberId)?.name?.split(' ')[0])
      .filter(Boolean)
      .join(', ');
    return { title: team?.name || 'Team', subtitle: members || 'Team' };
  }
  return { title: 'General', subtitle: 'Team-wide channel' };
};
