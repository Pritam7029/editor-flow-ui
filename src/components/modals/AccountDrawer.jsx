import { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { COLOR_OPTIONS } from '../../utils/constants';
import { getAvatarInitials } from '../../utils/helpers';
import { supabase } from '../../config/supabaseclient';

export default function AccountDrawer({ isOpen, onClose, onOpenWorkspaceModal }) {
  const {
   meta,
   switchWorkspace,
   deleteWorkspaceById,
   backendWorkspaces,
   backendWorkspaceLoading,
   backendWorkspaceError,
   deleteBackendWorkspaceById,
   saveAccount,
   joinOrCreateWorkspace
 } = useAppContext();
  const currentWorkspace = useMemo(() => meta.workspaces.find((item) => item.id === meta.currentWorkspaceId), [meta]);
  const [form, setForm] = useState(meta.account);
  const [joinName, setJoinName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm(meta.account);
      setJoinName('');
    }
  }, [isOpen, meta.account]);

  if (!isOpen) return null;
 const visibleWorkspaces =
  backendWorkspaces && backendWorkspaces.length > 0
    ? backendWorkspaces
    : meta.workspaces || [];

const usingBackendWorkspaces =
  backendWorkspaces && backendWorkspaces.length > 0; 

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer" onClick={(event) => event.stopPropagation()}>
        <div className="drawer-header">
          <div className="drawer-title-block">
            <div className="avatar-square large round" style={{ color: form.color, background: `${form.color}20` }}>
              {form.avatarUrl ? <img alt="Profile" className="avatar-image" src={form.avatarUrl} /> : getAvatarInitials(form.name)}
            </div>
            <div>
              <h3>Your Account</h3>
              <p>{currentWorkspace?.name}</p>
            </div>
          </div>
          <button className="icon-button" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-body">
          <section className="form-stack">
            <h4>Profile</h4>
            <label className="upload-avatar-box">
              <span>Upload photo</span>
              <input hidden type="file" accept="image/*" onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (loadEvent) => setForm((current) => ({ ...current, avatarUrl: loadEvent.target?.result }));
                reader.readAsDataURL(file);
              }} />
            </label>
            {form.avatarUrl && <button className="ghost-button small" onClick={() => setForm((current) => ({ ...current, avatarUrl: null }))}>Remove Photo</button>}
            <input className="text-input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Display name" />
            <input className="text-input" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} placeholder="Role / Title" />
            <textarea className="text-input" rows={3} value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} placeholder="Bio" />
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              <option value="active">🟢 Active</option>
              <option value="idle">🟡 Idle</option>
              <option value="offline">⚫ Offline</option>
            </select>
            <div className="color-picker">
              {COLOR_OPTIONS.map((color) => (
                <button key={color} className={`color-dot ${form.color === color ? 'color-dot-active' : ''}`} style={{ background: color }} onClick={() => setForm({ ...form, color })} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button className="primary-button" style={{ flex: 1 }} onClick={() => saveAccount(form)}>💾 Save Profile</button>
              <button className="danger-button" style={{ flex: 1 }} onClick={async () => { await supabase.auth.signOut(); }}>🚪 Logout</button>
            </div>
          </section>

          <section className="form-stack">
            <h4>Workspaces</h4>
                {backendWorkspaceLoading && (
  <div className="muted-text">Loading workspaces...</div>
)}

{backendWorkspaceError && (
  <div className="form-error">{backendWorkspaceError}</div>
)}

{visibleWorkspaces.map((workspace) => (
  <div
    className="workspace-row"
    key={workspace.id}
    role="button"
    tabIndex={0}
    onClick={() => switchWorkspace(workspace.id)}
    onKeyDown={(event) => {
      if (event.key === 'Enter') {
        switchWorkspace(workspace.id);
      }
    }}
  >
    <span>
      {workspace.id === meta.currentWorkspaceId ? '✦' : '🏢'} {workspace.name}
    </span>

    <div className="card-actions">
      {workspace.id === meta.currentWorkspaceId && (
        <button
          className="ghost-button small"
          onClick={(event) => {
            event.stopPropagation();
            onOpenWorkspaceModal('rename');
          }}
        >
          Rename
        </button>
      )}

      {usingBackendWorkspaces && backendWorkspaces.length > 1 && (
        <button
          className="danger-button small"
          onClick={(event) => {
            event.stopPropagation();
            if (window.confirm(`Are you sure you want to delete "${workspace.name}"?`)) {
              deleteBackendWorkspaceById(workspace.id);
            }
          }}
        >
          Delete
        </button>
      )}

      {!usingBackendWorkspaces && meta.workspaces.length > 1 && (
        <button
          className="danger-button small"
          onClick={(event) => {
            event.stopPropagation();
            if (window.confirm(`Are you sure you want to delete "${workspace.name}"?`)) {
              deleteWorkspaceById(workspace.id);
            }
          }}
        >
          Delete
        </button>
      )}
    </div>
  </div>
))}
              
            <div className="card-actions wrap-actions">
              <button className="ghost-button" onClick={() => onOpenWorkspaceModal('create')}>＋ New Workspace</button>
              <div className="inline-row grow">
                <input className="text-input compact" placeholder="Join by workspace name…" value={joinName} onChange={(event) => setJoinName(event.target.value)} />
                <button className="ghost-button small" onClick={() => { joinOrCreateWorkspace(joinName); setJoinName(''); }}>Join</button>
              </div>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}
