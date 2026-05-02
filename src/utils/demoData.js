import { uid } from './helpers';
import { DEFAULT_COLUMNS, EMPTY_CHAT_BUCKET } from './constants';

export function createDemoWorkspaceState() {
  const now = Date.now();

  const editors = [
    { id: uid(), name: 'Alex Rivera', role: 'Video Editor', status: 'active', color: '#8b5cf6', createdAt: now },
    { id: uid(), name: 'Jordan Lee', role: 'Motion Designer', status: 'active', color: '#06b6d4', createdAt: now },
    { id: uid(), name: 'Sam Park', role: 'Photo Editor', status: 'idle', color: '#10b981', createdAt: now },
    { id: uid(), name: 'Casey Morgan', role: 'Audio Engineer', status: 'active', color: '#f43f5e', createdAt: now },
  ];

  const tasks = [
    { id: uid(), title: 'Edit Episode 14 — Main Cut', type: 'video', priority: 'high', assigneeId: editors[0].id, deadline: '2026-04-10', status: 'inprogress', comments: [], createdAt: now },
    { id: uid(), title: 'Color Grade Vlog Footage', type: 'video', priority: 'medium', assigneeId: editors[0].id, deadline: '2026-04-12', status: 'todo', comments: [], createdAt: now },
    { id: uid(), title: 'Thumbnail Batch — Week 15', type: 'photo', priority: 'high', assigneeId: editors[0].id, deadline: '2026-04-08', status: 'done', comments: [], createdAt: now },
    { id: uid(), title: 'Intro Animation v3', type: 'design', priority: 'high', assigneeId: editors[1].id, deadline: '2026-04-09', status: 'inprogress', comments: [], createdAt: now },
    { id: uid(), title: 'Lower Thirds Pack', type: 'design', priority: 'medium', assigneeId: editors[1].id, deadline: '2026-04-15', status: 'todo', comments: [], createdAt: now },
    { id: uid(), title: 'Channel Banner Refresh', type: 'design', priority: 'low', assigneeId: editors[1].id, deadline: '', status: 'done', comments: [], createdAt: now },
    { id: uid(), title: 'Product Shot Retouching', type: 'photo', priority: 'medium', assigneeId: editors[2].id, deadline: '2026-04-11', status: 'inprogress', comments: [], createdAt: now },
    { id: uid(), title: 'Brand Photo Selection', type: 'photo', priority: 'low', assigneeId: editors[2].id, deadline: '', status: 'done', comments: [], createdAt: now },
    { id: uid(), title: 'Podcast Mix — Episode 45', type: 'audio', priority: 'high', assigneeId: editors[3].id, deadline: '2026-04-07', status: 'done', comments: [], createdAt: now },
    { id: uid(), title: 'SFX Pack for Shorts', type: 'audio', priority: 'medium', assigneeId: editors[3].id, deadline: '2026-04-14', status: 'todo', comments: [], createdAt: now },
  ];

  const dm = {
    [editors[0].id]: {
      general: [
        { id: uid(), senderId: '__admin__', senderName: 'Admin', text: "Hey Alex, how's the EP14 cut looking?", ts: now - 3600000 },
        { id: uid(), senderId: editors[0].id, senderName: editors[0].name, text: 'Coming along great! Rough draft: https://drive.google.com/file/d/example-rough-draft', ts: now - 3500000 },
      ],
      links: [{ id: uid(), senderId: editors[0].id, senderName: editors[0].name, text: 'Reference footage: https://www.dropbox.com/sh/example-reference', ts: now - 7200000 }],
      feedback: [{ id: uid(), senderId: '__admin__', senderName: 'Admin', text: 'Great work on the thumbnails! 🔥', ts: now - 86400000 }],
    },
    [editors[1].id]: {
      general: [{ id: uid(), senderId: editors[1].id, senderName: editors[1].name, text: 'Intro animation v3 preview is up!', ts: now - 1800000 }],
      links: [{ id: uid(), senderId: editors[1].id, senderName: editors[1].name, text: 'https://www.figma.com/file/example-intro-animation', ts: now - 1790000 }],
      feedback: [{ id: uid(), senderId: '__admin__', senderName: 'Admin', text: 'Looks amazing, finalize by Thursday!', ts: now - 900000 }],
    },
  };

  const teamId = uid();

  return {
    editors,
    tasks,
    columns: structuredClone(DEFAULT_COLUMNS),
    files: [],
    notifications: [],
    chat: {
      dm,
      teams: {
        [teamId]: {
          name: 'Design Squad',
          memberIds: [editors[1].id, editors[2].id],
          ...EMPTY_CHAT_BUCKET(),
          general: [{ id: uid(), senderId: '__admin__', senderName: 'Admin', text: 'Design Squad, please sync on the brand refresh this week!', ts: now - 43200000 }],
        },
      },
      global: {
        general: [{ id: uid(), senderId: '__admin__', senderName: 'Admin', text: 'Welcome to EditorFlow! 🎉 Use the DMs to message editors directly.', ts: now - 3600000 }],
        links: [],
        feedback: [],
      },
    },
    activeConv: { type: 'global', id: null },
    activeChannel: 'general',
    activeEditorId: null,
    currentView: 'overview',
  };
}
