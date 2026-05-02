import { useMemo, useRef, useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { getAvatarInitials, formatTime } from '../../utils/helpers';
import { canManageEditors } from '../../utils/rbac';

function useOutsideClick(ref, callback) {
  useEffect(() => {
    const handler = (event) => {
      if (ref.current && !ref.current.contains(event.target)) callback();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, callback]);
}

export default function Header({ onOpenEditorModal, onOpenTaskModal, onOpenWorkspaceModal, onOpenAccount, onOpenMobileChat, onOpenMobileSidebar }) {
  const {
    meta,
    workspace,
    markNotificationRead,
    clearNotifications,
    switchWorkspace,
    joinOrCreateWorkspace,
    deleteWorkspaceById,
  } = useAppContext();
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [joinName, setJoinName] = useState('');
  const workspaceRef = useRef(null);
  const notificationRef = useRef(null);
  useOutsideClick(workspaceRef, () => setShowWorkspaceMenu(false));
  useOutsideClick(notificationRef, () => setShowNotifications(false));

  const currentWorkspace = useMemo(
    () => meta.workspaces.find((item) => item.id === meta.currentWorkspaceId),
    [meta],
  );

  const completion = workspace.tasks.length
    ? Math.round((workspace.tasks.filter((task) => task.status === 'done').length / workspace.tasks.length) * 100)
    : 0;
  const unreadCount = workspace.notifications.filter((item) => !item.read).length;

  return (
    <header className="app-header">
      <div className="brand-block">
        <div className="brand-icon">✦</div>
        <div>
          <div className="brand-name">EditorFlow</div>
          <div className="brand-tag">{currentWorkspace?.name || 'Workspace'}</div>
        </div>
      </div>

      <div className="workspace-switcher" ref={workspaceRef}>
        <button className="ghost-button" onClick={() => setShowWorkspaceMenu((value) => !value)}>
          🏢 {currentWorkspace?.name || 'Workspace'} ▾
        </button>
        {showWorkspaceMenu && (
          <div className="floating-panel workspace-panel">
            <div className="panel-title">Workspaces</div>
            {meta.workspaces.map((item) => (
              <button
                className={`panel-row ${item.id === meta.currentWorkspaceId ? 'panel-row-active' : ''}`}
                key={item.id}
                onClick={() => {
                  switchWorkspace(item.id);
                  setShowWorkspaceMenu(false);
                }}
              >
                <span>{item.id === meta.currentWorkspaceId ? '✦' : '🏢'}</span>
                <span>{item.name}</span>
              </button>
            ))}
            {canManageEditors(meta.account.id, workspace) && (
              <>
                <div className="panel-divider" />
                <button className="panel-row" onClick={() => { onOpenWorkspaceModal('create'); setShowWorkspaceMenu(false); }}>＋ New Workspace</button>
                <div className="inline-row">
                  <input className="text-input compact" placeholder="Join by workspace name…" value={joinName} onChange={(event) => setJoinName(event.target.value)} />
                  <button className="ghost-button small" onClick={() => { joinOrCreateWorkspace(joinName); setJoinName(''); setShowWorkspaceMenu(false); }}>Join</button>
                </div>
                <button className="panel-row" onClick={() => { onOpenWorkspaceModal('rename'); setShowWorkspaceMenu(false); }}>✏️ Rename Current</button>
                {meta.workspaces.length > 1 && (
                  <button className="panel-row panel-row-danger" onClick={() => { deleteWorkspaceById(meta.currentWorkspaceId); setShowWorkspaceMenu(false); }}>🗑 Delete Current</button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="header-stats">
        <div className="stat-pill"><strong>{workspace.editors.length}</strong><span>Editors</span></div>
        <div className="stat-pill"><strong>{workspace.tasks.length}</strong><span>Tasks</span></div>
        <div className="stat-pill"><strong>{completion}%</strong><span>Done</span></div>
      </div>

      <div className="header-actions">
        <div className="notifications-wrap" ref={notificationRef}>
          <button className="icon-button notification-button" onClick={() => setShowNotifications((value) => !value)}>
            🔔
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </button>
          {showNotifications && (
            <div className="floating-panel notification-panel">
              <div className="panel-head">
                <strong>Notifications</strong>
                <button className="text-button" onClick={clearNotifications}>Clear all</button>
              </div>
              <div className="notification-list">
                {!workspace.notifications.length && <div className="empty-inline">No notifications yet.</div>}
                {workspace.notifications.map((notification) => (
                  <button
                    key={notification.id}
                    className={`notification-item ${notification.read ? '' : 'notification-unread'}`}
                    onClick={() => markNotificationRead(notification.id)}
                  >
                    <span className="notification-icon">{notification.icon}</span>
                    <span className="notification-copy">
                      <strong>{notification.title}</strong>
                      <small>{notification.sub}</small>
                      <em>{formatTime(notification.ts)}</em>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <button className="ghost-button hide-mobile" onClick={onOpenTaskModal}>＋ Add Task</button>
        {canManageEditors(meta.account.id, workspace) && (
          <button className="primary-button hide-mobile" onClick={onOpenEditorModal}>＋ Add Editor</button>
        )}
        <button className="avatar-button" onClick={onOpenAccount}>
          {meta.account.avatarUrl ? <img alt="Profile" className="avatar-image" src={meta.account.avatarUrl} /> : <span style={{ color: meta.account.color }}>{getAvatarInitials(meta.account.name)}</span>}
        </button>
        <button className="icon-button only-mobile" onClick={onOpenMobileChat}>💬</button>
        <button className="icon-button only-mobile" onClick={onOpenMobileSidebar}>☰</button>
      </div>
    </header>
  );
}
